(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const GT = N.GT;
  const H = (a, b, s) => N.hash2(Math.round(a * 10), Math.round(b * 10), s);
  const W = [255, 255, 255, 255];

  N.FLORA_DETAIL = { high: { near: 170, grass: 70 }, mid: { near: 120, grass: 45 }, low: { near: 0, grass: 0 } };

  const vtx = (mb, x, y, z, nx, ny, nz, u, v, c, layer, kind, sway, fade) => {
    const L = Math.hypot(nx, ny, nz) || 1;
    const n = mb.v(x, y, z, nx / L, ny / L, nz / L, u, v, c.length > 3 ? c : [c[0], c[1], c[2], 255], layer, kind);
    mb.u8[n * 32 + 30] = N.clamp(Math.round(sway * 255), 0, 255);
    mb.u8[n * 32 + 31] = fade || 0;
    return n;
  };

  const tube = (mb, a, b, r0, r1, seg, o) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
    const ax = dx / L, ay = dy / L, az = dz / L;
    let px = -az, py = 0, pz = ax;
    if (Math.hypot(px, pz) < 1e-3) { px = 1; pz = 0; }
    const pl = Math.hypot(px, py, pz);
    px /= pl; py /= pl; pz /= pl;
    const qx = ay * pz - az * py, qy = az * px - ax * pz, qz = ax * py - ay * px;
    mb.ensure((seg + 1) * 2, seg * 6);
    const base = mb.nv, vs = o.vs || 2, v0 = o.v0 || 0;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      const nx = px * c + qx * s, ny = py * c + qy * s, nz = pz * c + qz * s, u = i / seg * (o.wrap || 1);
      vtx(mb, a[0] + nx * r0, a[1] + ny * r0, a[2] + nz * r0, nx, ny, nz, u, v0 + L / vs, o.cb || o.c || W, o.layer, o.kind || 0, o.sw0 || 0, 0);
      vtx(mb, b[0] + nx * r1, b[1] + ny * r1, b[2] + nz * r1, nx, ny, nz, u, v0, o.ct || o.c || W, o.layer, o.kind || 0, o.sw1 || 0, 0);
    }
    for (let i = 0; i < seg; i++) { const k = base + i * 2; mb.tri(k, k + 2, k + 3); mb.tri(k, k + 3, k + 1); }
  };

  const card = (mb, c, U, V, uv, layer, look) => {
    mb.ensure(4, 6);
    const P = [
      [c[0] - U[0] - V[0], c[1] - U[1] - V[1], c[2] - U[2] - V[2], uv[0], uv[3]],
      [c[0] + U[0] - V[0], c[1] + U[1] - V[1], c[2] + U[2] - V[2], uv[2], uv[3]],
      [c[0] + U[0] + V[0], c[1] + U[1] + V[1], c[2] + U[2] + V[2], uv[2], uv[1]],
      [c[0] - U[0] + V[0], c[1] - U[1] + V[1], c[2] - U[2] + V[2], uv[0], uv[1]]
    ];
    const a = mb.nv;
    for (const p of P) {
      const n = look.n(p);
      vtx(mb, p[0], p[1], p[2], n[0], n[1], n[2], p[3], p[4], look.c(p, n), layer, K.FOLIAGE, look.s(p), look.f || 0);
    }
    mb.tri(a, a + 1, a + 2);
    mb.tri(a, a + 2, a + 3);
  };

  const crownLook = (ctr, rad, tint, top, sk) => ({
    n: p => [(p[0] - ctr[0]) / rad[0], (p[1] - ctr[1]) / rad[1] + 0.35, (p[2] - ctr[2]) / rad[2]],
    c: (p, n) => {
      const o = Math.min(1.15, Math.hypot((p[0] - ctr[0]) / rad[0], (p[1] - ctr[1]) / rad[1], (p[2] - ctr[2]) / rad[2]));
      const ny = n[1] / (Math.hypot(n[0], n[1], n[2]) || 1);
      return [tint[0], tint[1], tint[2], Math.round(255 * N.clamp(0.38 + 0.42 * o + 0.22 * ny, 0.32, 1))];
    },
    s: p => sk * (0.12 + 0.88 * N.clamp(p[1] / top, 0, 1.2))
  });

  const UVS = [[0, 0, 1, 1], [1, 0, 0, 1]];

  const clump = (mb, rng, p, sz, layer, look, o) => {
    const yaw = rng() * Math.PI, n = o.cards || 2, uv = o.uv || UVS[rng() < 0.5 ? 0 : 1];
    for (let k = 0; k < n; k++) {
      const a = yaw + k * Math.PI / n, ux = Math.cos(a) * sz / 2, uz = Math.sin(a) * sz / 2, t = (rng() - 0.5) * 0.5;
      card(mb, p, [ux, 0, uz], [-Math.sin(a) * t * sz / 2, sz / 2 * (o.vy || 1), Math.cos(a) * t * sz / 2], uv, layer, look);
    }
    if (o.flat) {
      const a = rng() * Math.PI * 2;
      card(mb, [p[0], p[1] + sz * 0.1, p[2]], [Math.cos(a) * sz / 2, 0, Math.sin(a) * sz / 2], [-Math.sin(a) * sz / 2, sz * 0.12, Math.cos(a) * sz / 2], uv, layer, look);
    }
  };

  const shade = (c, k) => [c[0] * k | 0, c[1] * k | 0, c[2] * k | 0, 255];
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  const SPEC = {
    linden: { form: 'broad', h: 11, trunk: 0.62, tr: 0.26, bark: 'trunk', barkC: [176, 164, 150], leaf: 'leafbroad', tint: [226, 240, 214], crown: [0.66, 0.36, 0.34], n: 18, size: 3.4, limbs: 5, far: 'leaves_linden' },
    maple: { form: 'broad', h: 12, trunk: 0.58, tr: 0.25, bark: 'trunk', barkC: [168, 160, 150], leaf: 'leafbroad', tint: [240, 250, 205], crown: [0.64, 0.4, 0.33], n: 19, size: 3.6, limbs: 5, far: 'leaves_linden', farTint: [238, 250, 205] },
    poplar: { form: 'broad', h: 19, trunk: 0.74, tr: 0.3, bark: 'trunk', barkC: [184, 180, 168], leaf: 'leafbroad', tint: [214, 230, 206], crown: [0.6, 0.16, 0.4], n: 24, size: 3.4, limbs: 6, far: 'leaves_poplar' },
    pollard: { form: 'pollard', h: 9.5, trunk: 0.76, tr: 0.38, bark: 'trunk', barkC: [184, 178, 166], leaf: 'leafbroad', tint: [222, 238, 210], crown: [0.8, 0.26, 0.22], n: 14, size: 2.0, far: 'leaves_bush' },
    birch: { form: 'birch', h: 13, trunk: 0.88, tr: 0.17, bark: 'bark', barkC: [250, 250, 246], leaf: 'leafsmall', tint: [236, 248, 220], crown: [0.62, 0.22, 0.3], n: 14, size: 2.5, limbs: 4, far: 'leaves_birch' },
    willow: { form: 'willow', h: 10.5, trunk: 0.36, tr: 0.36, bark: 'trunk', barkC: [160, 150, 138], leaf: 'leafsmall', tint: [198, 214, 196], crown: [0.62, 0.46, 0.32], n: 15, size: 3.0, far: 'leaves_willow' },
    pine: { form: 'pine', h: 17, trunk: 0.93, tr: 0.24, bark: 'trunk', barkC: [150, 138, 128], leaf: 'needles', tint: [232, 240, 230], crown: [0.85, 0.15, 0.12], n: 9, size: 3.0, far: 'leaves_pine' },
    spruce: { form: 'spruce', h: 11.5, trunk: 0.97, tr: 0.22, bark: 'trunk', barkC: [140, 128, 118], leaf: 'sprucebr', tint: [226, 236, 232], crown: [0.48, 0.26, 0.47], n: 9, far: 'leaves_spruce' },
    apple: { form: 'broad', h: 4.8, trunk: 0.36, tr: 0.15, bark: 'trunk', barkC: [150, 136, 124], leaf: 'leafapple', tint: [236, 244, 226], crown: [0.62, 0.55, 0.36], n: 10, size: 2.0, limbs: 3, crooked: true, far: 'leaves_apple' },
    rowan: { form: 'broad', h: 7, trunk: 0.52, tr: 0.13, bark: 'trunk', barkC: [170, 160, 150], leaf: 'leafrowan', tint: [236, 244, 226], crown: [0.66, 0.3, 0.33], n: 10, size: 1.9, limbs: 3, far: 'leaves_apple', farTint: [214, 226, 200] },
    ashmaple: { form: 'broad', h: 8.5, trunk: 0.45, tr: 0.2, bark: 'trunk', barkC: [176, 172, 160], leaf: 'leafbroad', tint: [246, 255, 196], crown: [0.62, 0.42, 0.32], n: 13, size: 2.9, limbs: 4, stems: 2, far: 'leaves_linden', farTint: [244, 255, 200] }
  };

  const BUSH = {
    lilac: { leaf: 'leafbroad', tint: [196, 218, 194], n: 10, size: 1.55, stems: 6, far: 'leaves_bush' },
    jasmine: { leaf: 'leafbloom', tint: [244, 250, 238], n: 9, size: 1.35, stems: 5, far: 'leaves_bush', farTint: [236, 246, 232] },
    acacia: { leaf: 'leafsmall', tint: [236, 250, 210], n: 9, size: 1.45, stems: 5, far: 'leaves_bush', farTint: [232, 248, 206] },
    rosehip: { leaf: 'leafbloom', tint: [255, 214, 222], n: 8, size: 1.15, stems: 5, far: 'leaves_bush', farTint: [226, 214, 210] },
    spiraea: { leaf: 'leafbloom', tint: [238, 246, 230], n: 7, size: 0.95, stems: 4, far: 'leaves_bush' },
    hazel: { leaf: 'leafbroad', tint: [238, 250, 222], n: 12, size: 1.95, stems: 7, far: 'leaves_bush', farTint: [236, 250, 220] },
    willowbush: { leaf: 'leafsmall', tint: [204, 220, 196], n: 12, size: 1.9, stems: 7, far: 'leaves_willow' }
  };

  const WEEDS = [
    { uv: [0.008, 0.008, 0.492, 0.492], w: 1.3, h: 1.25 },
    { uv: [0.508, 0.008, 0.992, 0.492], w: 1.0, h: 1.25 },
    { uv: [0.008, 0.508, 0.492, 0.992], w: 1.2, h: 0.85 },
    { uv: [0.508, 0.508, 0.992, 0.992], w: 0.9, h: 2.0 }
  ];

  const PAINT = [[238, 236, 228, 255], [96, 160, 220, 255], [236, 200, 60, 255], [210, 64, 52, 255], [96, 170, 90, 255]];

  const B = {
    broad(sp, rng, white) {
      const mb = new N.MB(512), h = sp.h, cy = h * sp.crown[0], rx = h * sp.crown[1], ry = h * sp.crown[2];
      const lean = [(rng() - 0.5) * 0.07 * h, 0, (rng() - 0.5) * 0.07 * h];
      const bark = { layer: T(sp.bark), c: sp.barkC, cb: shade(sp.barkC, 0.72), wrap: 2, vs: 1.6 };
      const stems = sp.stems || 1, tops = [];
      for (let s = 0; s < stems; s++) {
        const a = s / stems * Math.PI * 2 + rng(), spread = stems > 1 ? 0.12 * h : 0;
        const base = [Math.cos(a) * 0.12 * (stems - 1), 0, Math.sin(a) * 0.12 * (stems - 1)];
        const top = [lean[0] + Math.cos(a) * spread, h * sp.trunk * (stems > 1 ? 0.9 + rng() * 0.2 : 1), lean[2] + Math.sin(a) * spread];
        const tr = sp.tr / Math.sqrt(stems);
        const knee = sp.crooked ? [top[0] * 0.5 + (rng() - 0.5) * 0.5, top[1] * 0.55, top[2] * 0.5 + (rng() - 0.5) * 0.5] : [top[0] * 0.4, top[1] * 0.45, top[2] * 0.4];
        tube(mb, [base[0], -0.15, base[2]], [base[0] + knee[0] * 0.15, 0.55, base[2] + knee[2] * 0.15], tr * 1.4, tr, 7, bark);
        tube(mb, [base[0] + knee[0] * 0.15, 0.55, base[2] + knee[2] * 0.15], knee, tr, tr * 0.82, 7, Object.assign({}, bark, { cb: sp.barkC }));
        tube(mb, knee, top, tr * 0.82, tr * 0.5, 6, Object.assign({}, bark, { cb: sp.barkC }));
        if (white && s === 0) {
          const lime = { layer: T(sp.bark), c: [242, 242, 236, 255], cb: [226, 226, 220, 255], wrap: 2, vs: 1.6 };
          const k0 = [base[0] + knee[0] * 0.15, 0.55, base[2] + knee[2] * 0.15], f = (white - 0.55) / Math.max(0.1, knee[1] - 0.55);
          tube(mb, [base[0], -0.08, base[2]], k0, tr * 1.42 + 0.01, tr + 0.01, 7, lime);
          tube(mb, k0, lerp3(k0, knee, Math.min(1, f)), tr + 0.01, tr * (1 - 0.18 * Math.min(1, f)) + 0.01, 7, lime);
        }
        tops.push(top);
      }
      const ctr = [lean[0], cy, lean[2]];
      const look = crownLook(ctr, [rx, ry, rx], sp.tint, h, 0.55);
      const pts = [];
      for (let i = 0; i < sp.n; i++) {
        const y = 1 - (i + 0.5) / sp.n * 1.7, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996 + rng() * 0.7, k = 0.6 + rng() * 0.32;
        pts.push([ctr[0] + Math.cos(a) * r * rx * k, ctr[1] + y * ry * k, ctr[2] + Math.sin(a) * r * rx * k]);
      }
      for (let i = 0; i < (sp.limbs || 3); i++) {
        const p = pts[Math.min(sp.n - 1, Math.floor(sp.n * (0.3 + 0.55 * i / (sp.limbs || 3))))], t0 = tops[i % tops.length];
        const from = [t0[0] * 0.9, t0[1] * (0.78 + 0.2 * rng()), t0[2] * 0.9];
        tube(mb, from, lerp3(from, p, 0.85), sp.tr * 0.42, sp.tr * 0.12, 5, Object.assign({}, bark, { cb: sp.barkC }));
      }
      const leaf = T(sp.leaf);
      for (const p of pts) clump(mb, rng, p, sp.size * (0.85 + rng() * 0.35), leaf, look, { flat: p[1] > ctr[1] + ry * 0.25 });
      for (let i = 0; i < 5; i++) clump(mb, rng, [ctr[0] + (rng() - 0.5) * rx * 0.6, ctr[1] + (rng() - 0.4) * ry * 0.7, ctr[2] + (rng() - 0.5) * rx * 0.6], sp.size, leaf, look, {});
      return mb;
    },

    pollard(sp, rng) {
      const mb = new N.MB(512), h = sp.h, top = h * sp.trunk;
      const bark = { layer: T(sp.bark), c: sp.barkC, cb: shade(sp.barkC, 0.72), wrap: 2, vs: 1.6 };
      tube(mb, [0, -0.15, 0], [0, 0.6, 0], sp.tr * 1.35, sp.tr, 8, bark);
      tube(mb, [0, 0.6, 0], [0.1, top, 0.05], sp.tr, sp.tr * 0.8, 8, Object.assign({}, bark, { cb: sp.barkC }));
      const ctr = [0, h * sp.crown[0], 0], rx = h * sp.crown[1], ry = h * sp.crown[2];
      const look = crownLook(ctr, [rx, ry, rx], sp.tint, h, 0.35);
      const knobs = [];
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + rng() * 0.6, end = [0.1 + Math.cos(a) * 0.9, top + 1.1 + rng() * 0.5, 0.05 + Math.sin(a) * 0.9];
        tube(mb, [0.1, top - 0.3, 0.05], end, sp.tr * 0.55, sp.tr * 0.42, 6, Object.assign({}, bark, { cb: sp.barkC }));
        knobs.push(end);
      }
      const leaf = T(sp.leaf);
      for (let i = 0; i < sp.n; i++) {
        const kb = knobs[i % 3], p = [kb[0] + (rng() - 0.5) * 1.6, kb[1] + (rng() - 0.2) * 1.8, kb[2] + (rng() - 0.5) * 1.6];
        clump(mb, rng, p, sp.size * (0.8 + rng() * 0.4), leaf, look, { flat: i % 3 === 0 });
      }
      for (let i = 0; i < 4; i++) clump(mb, rng, [(rng() - 0.5) * 0.6, top * (0.45 + 0.4 * rng()), (rng() - 0.5) * 0.6], 1.1, leaf, look, {});
      return mb;
    },

    birch(sp, rng) {
      const mb = new N.MB(512), h = sp.h, cy = h * sp.crown[0], rx = h * sp.crown[1], ry = h * sp.crown[2];
      const bend = [(rng() - 0.5) * 0.5, 0, (rng() - 0.5) * 0.5], mid = [bend[0], h * 0.45, bend[2]], top = [bend[0] * 0.4 + (rng() - 0.5) * 0.4, h * sp.trunk, bend[2] * 0.4 + (rng() - 0.5) * 0.4];
      const bark = { layer: T('bark'), c: sp.barkC, wrap: 2, vs: 2.2 };
      tube(mb, [0, -0.15, 0], [bend[0] * 0.08, 1.3, bend[2] * 0.08], sp.tr * 1.3, sp.tr, 7, Object.assign({}, bark, { cb: [70, 66, 62, 255], ct: [200, 198, 192, 255] }));
      tube(mb, [bend[0] * 0.08, 1.3, bend[2] * 0.08], mid, sp.tr, sp.tr * 0.78, 7, bark);
      tube(mb, mid, top, sp.tr * 0.78, sp.tr * 0.3, 6, bark);
      const ctr = [top[0], cy, top[2]];
      const look = crownLook(ctr, [rx, ry, rx], sp.tint, h, 0.6);
      const leaf = T(sp.leaf), pts = [];
      for (let i = 0; i < sp.n; i++) {
        const y = 1 - (i + 0.5) / sp.n * 1.8, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996 + rng(), k = 0.62 + rng() * 0.3;
        pts.push([ctr[0] + Math.cos(a) * r * rx * k, ctr[1] + y * ry * k, ctr[2] + Math.sin(a) * r * rx * k]);
      }
      for (let i = 0; i < sp.limbs; i++) { const p = pts[Math.floor(sp.n * (0.2 + 0.6 * i / sp.limbs))], from = lerp3(mid, top, 0.4 + 0.5 * rng()); tube(mb, from, lerp3(from, p, 0.8), sp.tr * 0.35, sp.tr * 0.1, 4, bark); }
      for (const p of pts) clump(mb, rng, p, sp.size * (0.85 + rng() * 0.3), leaf, look, { vy: 1.25 });
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 + rng(), r = rx * (0.75 + rng() * 0.2), y = cy - ry * 0.15 - rng() * 0.6, L = 1.4 + rng() * 1.0;
        const p = [ctr[0] + Math.cos(a) * r, y - L / 2 + 0.6, ctr[2] + Math.sin(a) * r];
        card(mb, p, [-Math.sin(a) * 0.7, 0, Math.cos(a) * 0.7], [0, L / 2, 0], [0, 0, 0.45, 1], leaf, look);
      }
      return mb;
    },

    willow(sp, rng) {
      const mb = new N.MB(512), h = sp.h, cy = h * sp.crown[0], rx = h * sp.crown[1], ry = h * sp.crown[2];
      const bark = { layer: T(sp.bark), c: sp.barkC, cb: shade(sp.barkC, 0.7), wrap: 2, vs: 1.6 };
      const lean = [(rng() - 0.5) * 1.6, h * sp.trunk, (rng() - 0.5) * 1.6];
      tube(mb, [0, -0.2, 0], lean, sp.tr * 1.3, sp.tr * 0.9, 8, bark);
      const ctr = [lean[0], cy, lean[2]];
      for (let k = 0; k < 3; k++) {
        const a = k * 2.1 + rng(), end = [ctr[0] + Math.cos(a) * rx * 0.55, cy + ry * 0.2, ctr[2] + Math.sin(a) * rx * 0.55];
        tube(mb, lean, end, sp.tr * 0.6, sp.tr * 0.25, 6, Object.assign({}, bark, { cb: sp.barkC }));
      }
      const look = crownLook(ctr, [rx, ry, rx], sp.tint, h, 0.6);
      const leaf = T(sp.leaf);
      for (let i = 0; i < sp.n; i++) {
        const y = 1 - (i + 0.5) / sp.n * 1.4, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996 + rng(), k = 0.6 + rng() * 0.32;
        clump(mb, rng, [ctr[0] + Math.cos(a) * r * rx * k, ctr[1] + y * ry * k, ctr[2] + Math.sin(a) * r * rx * k], sp.size * (0.85 + rng() * 0.3), leaf, look, { vy: 1.2, flat: y > 0.4 });
      }
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 + rng() * 0.3, r = rx * (0.85 + rng() * 0.15), y0 = cy - ry * 0.1, y1 = 1.1 + rng() * 1.2;
        card(mb, [ctr[0] + Math.cos(a) * r, (y0 + y1) / 2, ctr[2] + Math.sin(a) * r], [-Math.sin(a) * 1.3, 0, Math.cos(a) * 1.3], [Math.cos(a) * 0.3, (y0 - y1) / 2, Math.sin(a) * 0.3], rng() < 0.5 ? [0, 0, 1, 1] : [1, 0, 0, 1], leaf, look);
      }
      return mb;
    },

    pine(sp, rng) {
      const mb = new N.MB(512), h = sp.h, top = [(rng() - 0.5) * 0.6, h * sp.trunk, (rng() - 0.5) * 0.6];
      const low = { layer: T('trunk'), c: sp.barkC, cb: shade(sp.barkC, 0.7), wrap: 2, vs: 1.6 };
      const up = { layer: T('barkpine'), c: [236, 220, 210, 255], wrap: 2, vs: 1.6 };
      const mid = lerp3([0, 0, 0], top, 0.5);
      tube(mb, [0, -0.15, 0], [0, 0.7, 0], sp.tr * 1.35, sp.tr, 7, low);
      tube(mb, [0, 0.7, 0], mid, sp.tr, sp.tr * 0.78, 7, Object.assign({}, low, { cb: sp.barkC }));
      tube(mb, mid, top, sp.tr * 0.78, sp.tr * 0.35, 6, up);
      for (let i = 0; i < 5; i++) {
        const a = rng() * Math.PI * 2, y = h * (0.3 + 0.35 * rng()), from = lerp3([0, 0, 0], top, y / top[1]);
        tube(mb, from, [from[0] + Math.cos(a) * 0.6, y + 0.25, from[2] + Math.sin(a) * 0.6], 0.05, 0.02, 3, low);
      }
      const ctr = [top[0], h * sp.crown[0], top[2]], rx = 2.6, ry = 1.9;
      const look = crownLook(ctr, [rx, ry, rx], sp.tint, h, 0.5);
      const leaf = T(sp.leaf);
      for (let i = 0; i < sp.n; i++) {
        const a = i * 2.39996 + rng() * 0.8, y = h * (0.7 + 0.27 * (i / sp.n)) + (rng() - 0.5) * 0.8, r = (0.6 + rng() * 1.2) * (1.15 - 0.6 * i / sp.n);
        const p = [top[0] * y / top[1] + Math.cos(a) * r, y, top[2] * y / top[1] + Math.sin(a) * r];
        tube(mb, lerp3([0, 0, 0], top, Math.min(1, (y - 0.6) / top[1])), p, 0.07, 0.03, 4, up);
        clump(mb, rng, p, sp.size * (0.8 + rng() * 0.35), leaf, look, { flat: true, vy: 0.8 });
      }
      clump(mb, rng, [top[0], top[1] + 0.4, top[2]], 2.2, leaf, look, { flat: true });
      return mb;
    },

    spruce(sp, rng) {
      const mb = new N.MB(512), h = sp.h, top = [0, h * sp.trunk, 0];
      tube(mb, [0, -0.15, 0], top, sp.tr * 1.2, 0.04, 6, { layer: T('trunk'), c: sp.barkC, cb: shade(sp.barkC, 0.7), wrap: 2, vs: 1.6 });
      const ctr = [0, h * sp.crown[0], 0], rx = h * sp.crown[1], ry = h * sp.crown[2];
      const look = crownLook(ctr, [rx, ry, rx], sp.tint, h, 0.35);
      const far = T('leaves_spruce');
      for (let k = 0; k < 2; k++) {
        const a = k * Math.PI / 2 + 0.4;
        card(mb, [0, h * 0.5, 0], [Math.cos(a) * h * 0.24, 0, Math.sin(a) * h * 0.24], [0, h * 0.5, 0], [0, 0, 1, 1], far, look);
      }
      const leaf = T(sp.leaf), tiers = sp.n;
      for (let t = 0; t < tiers; t++) {
        const f = t / (tiers - 1), y = h * (0.07 + 0.83 * f), R = (1 - f) * h * 0.27 + 0.4, n = f > 0.7 ? 4 : 5;
        for (let i = 0; i < n; i++) {
          const a = i / n * Math.PI * 2 + t * 0.7 + rng() * 0.4, dx = Math.cos(a), dz = Math.sin(a), wd = R * 0.85, droop = R * (0.45 + rng() * 0.15);
          const c = [dx * R * 0.5, y - droop * 0.5, dz * R * 0.5];
          card(mb, c, [dx * R * 0.5, -droop * 0.5, dz * R * 0.5], [-dz * wd / 2, 0.12, dx * wd / 2], [0, 0.05, 1, 0.95], leaf, look);
        }
      }
      return mb;
    },

    shrub(kind, rng) {
      const sp = BUSH[kind], dim = N.BUSHES[kind], mb = new N.MB(256), h = dim.h, rx = dim.r;
      const ctr = [0, h * 0.5, 0];
      const look = crownLook(ctr, [rx, h * 0.5, rx], sp.tint, h, 0.22);
      for (let i = 0; i < sp.stems; i++) {
        const a = i / sp.stems * Math.PI * 2 + rng(), r = rx * (0.3 + rng() * 0.3);
        tube(mb, [Math.cos(a) * 0.08, -0.05, Math.sin(a) * 0.08], [Math.cos(a) * r, h * (0.45 + rng() * 0.2), Math.sin(a) * r], 0.035, 0.015, 3, { layer: T('trunk'), c: [150, 140, 128, 255], wrap: 1 });
      }
      const leaf = T(sp.leaf);
      for (let i = 0; i < sp.n; i++) {
        const y = 1 - (i + 0.5) / sp.n * 1.35, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.39996 + rng() * 0.7, k = 0.55 + rng() * 0.3;
        const p = [Math.cos(a) * r * rx * k, Math.max(sp.size * 0.42, ctr[1] + y * h * 0.5 * k), Math.sin(a) * r * rx * k];
        clump(mb, rng, p, sp.size * (0.85 + rng() * 0.3), leaf, look, { flat: y > 0.3 });
      }
      clump(mb, rng, [0, h * 0.45, 0], sp.size, leaf, look, {});
      return mb;
    },

    hedge(w, h, d) {
      const mb = new N.MB(64), lay = T('hedge'), top = h + 0.16, x0 = -w / 2, x1 = w / 2, z0 = -d / 2, z1 = d / 2;
      const look = (sw, ao) => ({ n: p => [0, 0.45, p[2] > 0 ? 1 : -1], c: () => [255, 255, 255, ao], s: p => (p[1] > h * 0.5 ? sw : 0) });
      const side = (z, nz) => {
        mb.ensure(4, 6);
        const a = mb.nv;
        vtx(mb, x0, 0, z, 0, 0.45, nz, x0 / 2, 1, [255, 255, 255, 170], lay, K.FOLIAGE, 0, 0);
        vtx(mb, x1, 0, z, 0, 0.45, nz, x1 / 2, 1, [255, 255, 255, 170], lay, K.FOLIAGE, 0, 0);
        vtx(mb, x1, top, z, 0, 0.45, nz, x1 / 2, 0, W, lay, K.FOLIAGE, 0.05, 0);
        vtx(mb, x0, top, z, 0, 0.45, nz, x0 / 2, 0, W, lay, K.FOLIAGE, 0.05, 0);
        mb.tri(a, a + 1, a + 2); mb.tri(a, a + 2, a + 3);
      };
      side(z0, -1);
      side(z1, 1);
      card(mb, [0, h - 0.02, 0], [w / 2, 0, 0], [0, 0, d / 2], [x0 / 2, 0.42, x1 / 2, 0.82], lay, { n: () => [0, 1, 0], c: () => W, s: () => 0.04 });
      for (const x of [x0, x1]) card(mb, [x, top / 2, 0], [0, 0, d / 2], [0, top / 2, 0], [0, 0, 0.4, 1], lay, look(0.04, 220));
      return mb;
    },

    reeds(depth, rng) {
      const mb = new N.MB(128), lay = T('reeds'), top = depth + 1.7;
      const look = { n: p => [p[0] * 0.6, 1.2, p[2] * 0.6], c: p => [230, 236, 214, Math.round(255 * N.clamp(0.6 + 0.4 * (p[1] - depth) / 1.7, 0.45, 1))], s: p => N.clamp((p[1] - depth) / 1.7, 0, 1) * 0.32 };
      for (let i = 0; i < 11; i++) {
        const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * 0.75, hh = top * (0.75 + rng() * 0.35), b = rng() * Math.PI, u0 = rng() * 0.6;
        card(mb, [Math.cos(a) * r, hh / 2, Math.sin(a) * r], [Math.cos(b) * 0.24, 0, Math.sin(b) * 0.24], [0, hh / 2, 0], [u0, 0, u0 + 0.4, 1], lay, look);
      }
      return mb;
    },

    lily(rng) {
      const mb = new N.MB(32), lay = T('lily'), look = { n: () => [0, 1, 0], c: () => [236, 244, 230, 255], s: () => 0.015 };
      for (let i = 0; i < 2 + Math.floor(rng() * 2); i++) {
        const a = rng() * Math.PI * 2, sz = 1.2 + rng() * 0.9, ox = (rng() - 0.5) * 1.2, oz = (rng() - 0.5) * 1.2;
        card(mb, [ox, 0.02 + i * 0.004, oz], [Math.cos(a) * sz / 2, 0, Math.sin(a) * sz / 2], [-Math.sin(a) * sz / 2, 0, Math.cos(a) * sz / 2], [0, 0, 1, 1], lay, look);
      }
      return mb;
    },

    weeds(kind, rng) {
      const mb = new N.MB(32), q = WEEDS[kind], lay = T('weeds');
      const look = { n: p => [p[0], 1.1, p[2]], c: p => [236, 240, 226, Math.round(255 * N.clamp(0.55 + 0.45 * p[1] / q.h, 0.5, 1))], s: p => 0.16 * p[1] / q.h };
      const a0 = rng() * Math.PI;
      for (let k = 0; k < 3; k++) {
        const a = a0 + k * Math.PI / 3;
        card(mb, [(rng() - 0.5) * 0.15, q.h / 2, (rng() - 0.5) * 0.15], [Math.cos(a) * q.w / 2, 0, Math.sin(a) * q.w / 2], [0, q.h / 2, 0], k % 2 ? [q.uv[2], q.uv[1], q.uv[0], q.uv[3]] : q.uv, lay, look);
      }
      return mb;
    },

    torus(mb, cx, cy, cz, R, r, u0, u1, nu, nv, flat, c) {
      mb.ensure((nu + 1) * (nv + 1), nu * nv * 6);
      const base = mb.nv, lay = T('white');
      for (let i = 0; i <= nu; i++) {
        const u = u0 + (u1 - u0) * i / nu, cu = Math.cos(u), su = Math.sin(u);
        for (let j = 0; j <= nv; j++) {
          const v = j / nv * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v);
          const n = flat ? [cu * cv, sv, su * cv] : [cu * cv, su * cv, sv];
          const p = flat ? [cx + cu * R + n[0] * r, cy + n[1] * r, cz + su * R + n[2] * r] : [cx + cu * R + n[0] * r, cy + su * R + n[1] * r, cz + n[2] * r];
          const k = 0.82 + 0.18 * Math.max(0, n[1]);
          vtx(mb, p[0], p[1], p[2], n[0], n[1], n[2], i / nu, j / nv, [c[0] * k | 0, c[1] * k | 0, c[2] * k | 0, 255], lay, 0, 0, 0);
        }
      }
      for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
        const a = base + i * (nv + 1) + j, b = a + nv + 1;
        mb.tri(a, b, a + 1);
        mb.tri(a + 1, b, b + 1);
      }
    },

    tires(n, tone) {
      const mb = new N.MB(256), step = 0.66, x0 = -(n - 1) * step / 2;
      for (let i = 0; i < n; i++) {
        const c = tone === 4 ? PAINT[i % 4] : (i % 2 ? PAINT[tone] : PAINT[0]);
        B.torus(mb, x0 + i * step, -0.06, 0, 0.29, 0.085, 0, Math.PI, 7, 6, false, c);
      }
      return mb;
    },

    tirebed(kind, n) {
      const mb = new N.MB(256), c = PAINT[kind % 4], top = 0.2 * n + 0.02;
      for (let i = 0; i < n; i++) B.torus(mb, 0, 0.1 + i * 0.2, 0, 0.36, 0.1, 0, Math.PI * 2, 12, 6, true, i % 2 ? PAINT[0] : c);
      const seg = 12, lay = T('flowers');
      mb.ensure(seg + 2, seg * 3);
      const ctr = vtx(mb, 0, top, 0, 0, 1, 0, 0.5, 0.5, W, lay, 0, 0, 0), b0 = mb.nv;
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; vtx(mb, Math.cos(a) * 0.34, top, Math.sin(a) * 0.34, 0, 1, 0, 0.5 + Math.cos(a) * 0.4, 0.5 + Math.sin(a) * 0.4, W, lay, 0, 0, 0); }
      for (let i = 0; i < seg; i++) mb.tri(ctr, b0 + i, b0 + i + 1);
      const look = { n: () => [0, 1, 0], c: () => [236, 240, 228, 255], s: p => 0.08 * (p[1] - top) / 0.5 };
      for (let k = 0; k < 2; k++) { const a = k * Math.PI / 2 + 0.3; card(mb, [0, top + 0.24, 0], [Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32], [0, 0.26, 0], [0.1, 0, 0.9, 1], T('meadow'), look); }
      return mb;
    },

    swan(tone) {
      const mb = new N.MB(256), white = [242, 240, 232, 255], body = tone === 1 ? [70, 72, 76, 255] : white;
      B.torus(mb, 0, 0.12, 0, 0.3, 0.12, Math.PI * 0.15, Math.PI * 0.85, 6, 6, true, body);
      B.torus(mb, 0, 0.12, 0, 0.3, 0.12, Math.PI * 1.15, Math.PI * 1.85, 6, 6, true, body);
      for (const s of [-1, 1]) B.torus(mb, -0.05, 0.3, s * 0.2, 0.22, 0.04, Math.PI * 0.05, Math.PI * 0.75, 5, 4, false, white);
      const lay = T('white'), o = { layer: lay, c: body, wrap: 1 };
      const neck = [[0.32, 0.18, 0], [0.42, 0.42, 0], [0.4, 0.66, 0], [0.48, 0.8, 0]];
      for (let i = 0; i + 1 < neck.length; i++) tube(mb, neck[i], neck[i + 1], 0.055 - i * 0.008, 0.05 - i * 0.008, 6, o);
      tube(mb, [0.46, 0.8, 0], [0.6, 0.79, 0], 0.055, 0.045, 6, o);
      tube(mb, [0.6, 0.79, 0], [0.72, 0.76, 0], 0.025, 0.005, 5, { layer: lay, c: [220, 90, 40, 255], wrap: 1 });
      for (const s of [-1, 1]) tube(mb, [0.55, 0.82, s * 0.03], [0.56, 0.82, s * 0.048], 0.012, 0.012, 4, { layer: lay, c: [20, 20, 20, 255], wrap: 1 });
      return mb;
    },

    stump(kind) {
      const mb = new N.MB(128), birch = kind === 1, h = 0.5, r = 0.33;
      const bark = { layer: T(birch ? 'bark' : 'trunk'), c: birch ? [230, 228, 222, 255] : [168, 156, 144, 255], cb: [110, 100, 90, 255], wrap: 2, vs: 1 };
      tube(mb, [0, -0.08, 0], [0, h, 0], r * 1.15, r, 9, bark);
      const seg = 9, lay = T('endgrain');
      mb.ensure(seg + 2, seg * 3);
      const c = vtx(mb, 0, h + 0.02, 0, 0, 1, 0, 0.5, 0.5, W, lay, 0, 0, 0), b0 = mb.nv;
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; vtx(mb, Math.cos(a) * r, h - 0.04 * Math.sin(a * 3), Math.sin(a) * r, 0, 1, 0, 0.5 + Math.cos(a) * 0.47, 0.5 + Math.sin(a) * 0.47, W, lay, 0, 0, 0); }
      for (let i = 0; i < seg; i++) mb.tri(c, b0 + i, b0 + i + 1);
      for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.4; tube(mb, [Math.cos(a) * r * 0.6, 0.18, Math.sin(a) * r * 0.6], [Math.cos(a) * (r + 0.45), -0.1, Math.sin(a) * (r + 0.45)], 0.11, 0.04, 5, bark); }
      return mb;
    },

    log(len, r, kind) {
      const mb = new N.MB(128), birch = kind === 1, y = r * 0.75;
      const bark = { layer: T(birch ? 'bark' : 'trunk'), c: birch ? [228, 226, 220, 255] : [160, 148, 136, 255], wrap: 2, vs: 1.5 };
      tube(mb, [-len / 2, y, 0], [len / 2, y - 0.05, 0], r, r * 0.82, 8, bark);
      const lay = T('endgrain');
      for (const [x, rr, yy] of [[-len / 2, r, y], [len / 2, r * 0.82, y - 0.05]]) {
        mb.ensure(10, 24);
        const c = vtx(mb, x, yy, 0, x < 0 ? -1 : 1, 0, 0, 0.5, 0.5, W, lay, 0, 0, 0), b0 = mb.nv;
        for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 2; vtx(mb, x, yy + Math.cos(a) * rr, Math.sin(a) * rr, x < 0 ? -1 : 1, 0, 0, 0.5 + Math.cos(a) * 0.47, 0.5 + Math.sin(a) * 0.47, W, lay, 0, 0, 0); }
        for (let i = 0; i < 8; i++) mb.tri(c, b0 + i, b0 + i + 1);
      }
      for (const u of [-0.2, 0.25]) tube(mb, [u * len, y + r * 0.6, 0], [u * len + 0.25, y + r + 0.35, 0.2], 0.06, 0.03, 4, bark);
      return mb;
    },

    rock(variant, painted, rubble) {
      const mb = new N.MB(128), seed = variant * 7 + (rubble ? 101 : 3);
      const t = (1 + Math.sqrt(5)) / 2;
      let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
      let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
      if (!rubble) {
        const mid = new Map(), F2 = [];
        const m = (a, b) => { const k = a < b ? a + ',' + b : b + ',' + a; if (mid.has(k)) return mid.get(k); const p = [(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2, (V[a][2] + V[b][2]) / 2], l = Math.hypot(p[0], p[1], p[2]); V.push([p[0] / l, p[1] / l, p[2] / l]); mid.set(k, V.length - 1); return V.length - 1; };
        for (const [a, b, c] of F) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
        F = F2;
      }
      const sc = rubble ? [0.55, 0.38, 0.45] : [0.55 + N.hash2(variant, 1, 5) * 0.15, 0.42 + N.hash2(variant, 2, 5) * 0.12, 0.48 + N.hash2(variant, 3, 5) * 0.12];
      const P = V.map(v => {
        const k = 1 + 0.32 * (N.noise2(v[0] * 1.7 + seed, v[2] * 1.7 + v[1] * 0.9, seed) - 0.5) + (rubble ? 0.4 * (N.hash2(Math.round(v[0] * 9), Math.round(v[2] * 9 + v[1] * 31), seed) - 0.5) : 0);
        return [v[0] * sc[0] * k, v[1] * sc[1] * k + sc[1] * 0.62, v[2] * sc[2] * k];
      });
      const lay = painted ? T('plaster') : rubble ? T('concrete') : T('boulder');
      const col = painted ? [246, 244, 238, 255] : rubble ? [196, 192, 184, 255] : [226 + N.hash2(variant, 4, 5) * 29 | 0, 222, 214 + N.hash2(variant, 5, 5) * 30 | 0, 255];
      if (rubble) {
        for (const [a, b, c] of F) {
          const A = P[a], Bv = P[b], C = P[c], ux = Bv[0] - A[0], uy = Bv[1] - A[1], uz = Bv[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
          const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
          mb.ensure(3, 3);
          const i0 = mb.nv;
          for (const p of [A, Bv, C]) vtx(mb, p[0], p[1], p[2], n[0], n[1], n[2], p[0] * 1.5 + p[2], p[1] * 1.5, col, lay, 0, 0, 0);
          mb.tri(i0, i0 + 1, i0 + 2);
        }
        for (let k = 0; k < 3; k++) tube(mb, [(k - 1) * 0.15, 0.3, -0.1], [(k - 1) * 0.2 + 0.1, 0.55 + k * 0.1, -0.35], 0.012, 0.012, 3, { layer: T('darkmetal'), c: [120, 70, 50, 255], wrap: 1 });
        return mb;
      }
      const Nn = P.map(() => [0, 0, 0]);
      for (const [a, b, c] of F) {
        const A = P[a], Bv = P[b], C = P[c], ux = Bv[0] - A[0], uy = Bv[1] - A[1], uz = Bv[2] - A[2], vx = C[0] - A[0], vy = C[1] - A[1], vz = C[2] - A[2];
        const n = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
        for (const i of [a, b, c]) { Nn[i][0] += n[0]; Nn[i][1] += n[1]; Nn[i][2] += n[2]; }
      }
      mb.ensure(P.length, F.length * 3);
      const base = mb.nv;
      P.forEach((p, i) => {
        const ao = N.clamp(0.55 + p[1] / (sc[1] * 2) * 0.6, 0.5, 1);
        vtx(mb, p[0], p[1] - sc[1] * 0.3, p[2], Nn[i][0], Nn[i][1], Nn[i][2], Math.atan2(p[2], p[0]) / Math.PI * 1.5, p[1] * 1.6, [col[0] * ao | 0, col[1] * ao | 0, col[2] * ao | 0, 255], lay, 0, 0, 0);
      });
      for (const [a, b, c] of F) mb.tri(base + a, base + b, base + c);
      return mb;
    }
  };

  const crownBox = sp => {
    const h = sp.h;
    if (sp.form === 'pine') return { y0: h * 0.66, y1: h * 1.03, w: 6.2, ty: h * 0.7 };
    if (sp.form === 'spruce') return { y0: h * 0.02, y1: h * 1.02, w: h * 0.56, ty: h * 0.1 };
    if (sp.form === 'willow') return { y0: 0.9, y1: h * (sp.crown[0] + sp.crown[2]) + 0.4, w: h * sp.crown[1] * 2.15, ty: h * 0.3 };
    if (sp.form === 'pollard') return { y0: h * 0.55, y1: h * 1.05, w: h * sp.crown[1] * 2.4, ty: h * 0.6 };
    const cy = h * sp.crown[0], ry = h * sp.crown[2];
    return { y0: cy - ry * 1.08, y1: cy + ry * 1.08, w: h * sp.crown[1] * 2.15, ty: cy - ry * 0.6 };
  };

  const farTree = sp => {
    const mb = new N.MB(32), bx = crownBox(sp), lay = T(sp.far), tint = sp.farTint || sp.tint, cy = (bx.y0 + bx.y1) / 2, ry = (bx.y1 - bx.y0) / 2;
    const look = crownLook([0, cy, 0], [bx.w / 2, ry, bx.w / 2], tint, sp.h, 0.4);
    for (let k = 0; k < 2; k++) {
      const a = k * Math.PI / 2 + 0.3;
      card(mb, [0, cy, 0], [Math.cos(a) * bx.w / 2, 0, Math.sin(a) * bx.w / 2], [0, ry, 0], [0, 0, 1, 1], lay, look);
    }
    if (sp.form !== 'spruce') card(mb, [0, cy + ry * 0.1, 0], [bx.w * 0.42, 0, 0], [0, 0, bx.w * 0.42], [0, 0, 1, 1], lay, look);
    const tr = sp.tr * 0.9, bark = T(sp.form === 'pine' ? 'barkpine' : sp.bark), bc = sp.form === 'pine' ? [220, 200, 190, 255] : [sp.barkC[0], sp.barkC[1], sp.barkC[2], 255];
    for (let k = 0; k < 2; k++) {
      const a = k * Math.PI / 2 + 1.1, dx = Math.cos(a) * tr, dz = Math.sin(a) * tr;
      mb.quad([-dx, 0, -dz, dx, 0, dz, dx, bx.ty, dz, -dx, bx.ty, -dz], [dz / tr, 0, -dx / tr], [0, bx.ty / 1.6, 1, bx.ty / 1.6, 1, 0, 0, 0], bc, bark, 0, bc);
    }
    return mb;
  };

  const farQuads = (lay, w, h, tint, sway) => {
    const mb = new N.MB(16), look = crownLook([0, h / 2, 0], [w / 2, h / 2, w / 2], tint, h, sway);
    for (let k = 0; k < 2; k++) { const a = k * Math.PI / 2 + 0.5; card(mb, [0, h / 2, 0], [Math.cos(a) * w / 2, 0, Math.sin(a) * w / 2], [0, h / 2, 0], [0, 0, 1, 1], lay, look); }
    return mb;
  };

  const put = (dst, src, x, y, z, yaw, s, tint) => {
    dst.ensure(src.nv, src.ni);
    const c = Math.cos(yaw || 0), sn = Math.sin(yaw || 0), base = dst.nv;
    const F = dst.f, I8 = dst.i8, U8 = dst.u8, SF = src.f, SI = src.i8, SU = src.u8;
    const tr = tint ? tint[0] : 1, tg = tint ? tint[1] : 1, tb = tint ? tint[2] : 1;
    for (let i = 0; i < src.nv; i++) {
      const o = i * 8, b = i * 32, d = (base + i) * 8, db = (base + i) * 32;
      const lx = SF[o] * s, ly = SF[o + 1] * s, lz = SF[o + 2] * s;
      F[d] = x + lx * c - lz * sn;
      F[d + 1] = y + ly;
      F[d + 2] = z + lx * sn + lz * c;
      const nx = SI[b + 12], nz = SI[b + 14];
      I8[db + 12] = Math.round(nx * c - nz * sn);
      I8[db + 13] = SI[b + 13];
      I8[db + 14] = Math.round(nx * sn + nz * c);
      I8[db + 15] = 0;
      F[d + 4] = SF[o + 4];
      F[d + 5] = SF[o + 5];
      U8[db + 24] = Math.min(255, SU[b + 24] * tr);
      U8[db + 25] = Math.min(255, SU[b + 25] * tg);
      U8[db + 26] = Math.min(255, SU[b + 26] * tb);
      U8[db + 27] = SU[b + 27];
      U8[db + 28] = SU[b + 28];
      U8[db + 29] = SU[b + 29];
      U8[db + 30] = Math.min(255, SU[b + 30] * s);
      U8[db + 31] = SU[b + 31];
    }
    for (let i = 0; i < src.ni; i++) dst.idx[dst.ni + i] = src.idx[i] + base;
    dst.ni += src.ni;
    dst.nv += src.nv;
  };

  const ROUTE = { tree: 'lod', bush: 'lod', reeds: 'lod', hedge: 'static', boulder: 'static', rubble: 'static', lily: 'near', tires: 'near', tirebed: 'near', swan: 'near', stump: 'near', log: 'near', weeds: 'near' };

  const GRASS_CLASS = { R: 'lawn', h: 'lawn', d: 'lawn', x: 'lawn', v: 'lawn', z: 'lawn', o: 'lawn', p: 'park', f: 'forest', g: 'meadow', e: 'meadow', b: 'meadow', l: 'meadow', a: 'meadow', n: 'wild', r: 'wild', u: 'wild', j: 'wild', c: 'wild' };
  const GRASS = {
    lawn: { d: 2.2, h: [0.12, 0.12], w: [0.55, 0.3], flower: 0.03, tint: [238, 250, 212] },
    park: { d: 2.3, h: [0.15, 0.16], w: [0.6, 0.3], flower: 0.05, tint: [232, 250, 206] },
    meadow: { d: 1.7, h: [0.32, 0.34], w: [0.6, 0.3], flower: 0.1, tint: [240, 232, 190] },
    forest: { d: 0.6, h: [0.18, 0.2], w: [0.5, 0.25], flower: 0, fern: 0.18, tint: [206, 222, 182] },
    wild: { d: 1.4, h: [0.3, 0.38], w: [0.55, 0.3], flower: 0.03, weed: 0.04, tint: [238, 230, 186] }
  };
  const MASK_R = { playground: 7, fountain: 8, monument: 4, kiosk: 2.2, busstop: 3, tent: 3, flowerbed: 2.5, binpad: 1.6, bin: 0.9, podezd: 1.6, slabs: 4, wreck: 3, porch: 4, carousel: 7, ferris: 18, ferrisbase: 10, tir: 6, shawarma: 3.5, autodrom: 12, swings: 9.5, waltz: 7.5, dancefloor: 12, cafetable: 1.5, attrgate: 3, pkoarch: 4, goal: 1.5, metro: 5, tirebed: 0.5, swan: 0.6, stump: 0.4, mosaicstand: 3, gate: 3 };

  class Flora {
    constructor(geo) {
      this.geo = geo;
      this.city = geo.city;
      this.meshes = new Map();
      this.count = { lod: 0, near: 0, static: 0 };
      this.G = 32;
    }

    takes(p) { return !!ROUTE[p.type]; }

    mesh(key, make) {
      let m = this.meshes.get(key);
      if (!m) { m = make(); this.meshes.set(key, m); }
      return m;
    }

    variant(p, n) { return Math.floor(H(p.x, p.z, 7) * n) % n; }

    tintOf(p) {
      const h = H(p.x, p.z, 8), f = 0.88 + h * 0.18, y = H(p.x, p.z, 10) < 0.3 ? 1.04 : 1;
      return [f * y, f, f * (2 - y) * 0.98];
    }

    nearMesh(p) {
      switch (p.type) {
        case 'tree': {
          const sp = SPEC[p.kind] || SPEC.birch, v = this.variant(p, 4), w = p.white && sp.form === 'broad' ? p.white : 0;
          return this.mesh('t|' + p.kind + '|' + v + (w ? '|w' + w : ''), () => B[sp.form](sp, N.rng(v * 977 + p.kind.length * 31 + 5), w));
        }
        case 'bush': { const v = this.variant(p, 4); return this.mesh('b|' + p.kind + '|' + v, () => B.shrub(p.kind, N.rng(v * 131 + p.kind.length * 7 + 3))); }
        case 'reeds': { const v = this.variant(p, 3), dq = Math.round((p.depth || 0) / (p.s || 1) * 10) / 10; return this.mesh('r|' + v + '|' + dq, () => B.reeds(dq, N.rng(v * 17 + dq * 100 + 1))); }
        case 'hedge': { const w = Math.round(p.w * 10) / 10, h = Math.round(p.h * 20) / 20; return this.mesh('h|' + w + '|' + h + '|' + p.d, () => B.hedge(w, h, p.d)); }
        case 'boulder': return this.mesh('k|' + p.kind + '|' + p.paint, () => B.rock(p.kind, !!p.paint, false));
        case 'rubble': return this.mesh('u|' + p.kind, () => B.rock(p.kind, false, true));
        case 'lily': { const v = this.variant(p, 4); return this.mesh('l|' + v, () => B.lily(N.rng(v * 13 + 2))); }
        case 'tires': return this.mesh('y|' + p.n + '|' + p.tone, () => B.tires(p.n, p.tone));
        case 'tirebed': return this.mesh('e|' + p.kind + '|' + p.n, () => B.tirebed(p.kind, p.n));
        case 'swan': return this.mesh('s|' + p.tone, () => B.swan(p.tone));
        case 'stump': return this.mesh('p|' + p.kind, () => B.stump(p.kind));
        case 'log': { const L = Math.round(p.len * 2) / 2, r = Math.round(p.r * 20) / 20; return this.mesh('g|' + p.kind + '|' + L + '|' + r, () => B.log(L, r, p.kind)); }
        case 'weeds': { const v = this.variant(p, 2); return this.mesh('w|' + p.kind + '|' + v, () => B.weeds(p.kind, N.rng(v * 5 + p.kind * 3 + 1))); }
      }
      return null;
    }

    farMesh(p) {
      if (p.type === 'tree') { const sp = SPEC[p.kind] || SPEC.birch; return this.mesh('ft|' + p.kind, () => farTree(sp)); }
      if (p.type === 'bush') {
        const sp = BUSH[p.kind], d = N.BUSHES[p.kind];
        return this.mesh('fb|' + p.kind, () => farQuads(T(sp.far), d.r * 2.05, d.h * 1.04, sp.farTint || sp.tint, 0.2));
      }
      if (p.type === 'reeds') { const dq = Math.round((p.depth || 0) / (p.s || 1) * 5) / 5; return this.mesh('fr|' + dq, () => farQuads(T('reeds'), 1.5, dq + 1.8, [230, 236, 214], 0.3)); }
      return null;
    }

    scaleOf(p) { return p.type === 'hedge' || p.type === 'tires' || p.type === 'log' ? 1 : p.s || 1; }

    topOf(p) {
      if (p.type === 'tree') return (SPEC[p.kind] || SPEC.birch).h * (p.s || 1) + 1;
      if (p.type === 'bush') return N.BUSHES[p.kind].h * (p.s || 1) + 0.5;
      if (p.type === 'reeds') return (p.depth || 0) + 2.6;
      return 2.5;
    }

    add(ch, p, gy) {
      const r = ROUTE[p.type], s = this.scaleOf(p), tint = p.type === 'tree' || p.type === 'bush' || p.type === 'hedge' || p.type === 'reeds' ? this.tintOf(p) : null;
      const R = p.type === 'tree' ? 7 * s : 3;
      if (r === 'static') {
        put(ch.mb, this.nearMesh(p), p.x, gy, p.z, p.rot || 0, s, tint);
        this.count.static++;
      } else {
        (ch.flora || (ch.flora = [])).push(p);
        (ch.floraY || (ch.floraY = [])).push(gy);
        if (r === 'lod') {
          const fm = this.farMesh(p);
          if (fm) put(ch.fmb || (ch.fmb = new N.MB(1024)), fm, p.x, gy, p.z, p.rot || 0, s, tint);
          this.count.lod++;
        } else this.count.near++;
      }
      this.geo.grow(ch, p.x - R, p.z - R, p.x + R, p.z + R, gy + this.topOf(p));
    }

    nearJob(ch) {
      return { ch, i: 0, mb: new N.MB(Math.min(65536, (ch.flora ? ch.flora.length : 0) * 120 + 64)) };
    }

    nearStep(job, until) {
      const L = job.ch.flora || [], Y = job.ch.floraY;
      while (job.i < L.length) {
        const p = L[job.i], m = this.nearMesh(p);
        if (m) put(job.mb, m, p.x, Y[job.i], p.z, p.rot || 0, this.scaleOf(p), p.type === 'tree' || p.type === 'bush' || p.type === 'reeds' ? this.tintOf(p) : null);
        job.i++;
        if ((job.i & 15) === 0 && performance.now() > until) return job.i >= L.length;
      }
      return true;
    }

    near(ch) {
      const j = this.nearJob(ch);
      this.nearStep(j, Infinity);
      return j.mb.ni ? j.mb : null;
    }

    grassMask(x0, z0) {
      const G = this.G, c = this.city, m = new Uint8Array(G * G);
      const stamp = (cx, cz, r) => {
        const i0 = Math.max(0, Math.floor(cx - r - x0)), i1 = Math.min(G - 1, Math.floor(cx + r - x0)), j0 = Math.max(0, Math.floor(cz - r - z0)), j1 = Math.min(G - 1, Math.floor(cz + r - z0));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) if ((x0 + i + 0.5 - cx) ** 2 + (z0 + j + 0.5 - cz) ** 2 < r * r) m[j * G + i] = 1;
      };
      if (c.hash) c.hash.query(x0 - 1, z0 - 1, x0 + G + 1, z0 + G + 1, b => {
        if (b.circle || b.kind !== 'building' || !b.poly) return;
        for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
          if (m[j * G + i]) continue;
          const x = x0 + i + 0.5, z = z0 + j + 0.5;
          if (x < b.x0 - 0.8 || x > b.x1 + 0.8 || z < b.z0 - 0.8 || z > b.z1 + 0.8) continue;
          if (N.pointInPoly(b.poly, x, z) || N.pointInPoly(b.poly, x + 0.6, z) || N.pointInPoly(b.poly, x - 0.6, z) || N.pointInPoly(b.poly, x, z + 0.6) || N.pointInPoly(b.poly, x, z - 0.6)) m[j * G + i] = 1;
        }
      });
      if (c.propHash) c.propHash.query(x0 - 20, z0 - 20, x0 + G + 20, z0 + G + 20, p => { const r = MASK_R[p.type]; if (r) stamp(p.x, p.z, r); });
      for (const q of c.doorPaths || []) {
        if (Math.max(q.ax, q.bx) < x0 - 2 || Math.min(q.ax, q.bx) > x0 + G + 2 || Math.max(q.az, q.bz) < z0 - 2 || Math.min(q.az, q.bz) > z0 + G + 2) continue;
        const L = Math.hypot(q.bx - q.ax, q.bz - q.az);
        for (let t = 0; t <= L; t += 0.5) stamp(q.ax + (q.bx - q.ax) * t / L, q.az + (q.bz - q.az) * t / L, q.w / 2 + 0.3);
      }
      for (const q of c.plazas || []) {
        const b = q.box || (q.box = N.polyBounds(q.poly));
        if (b.x1 < x0 || b.x0 > x0 + G || b.z1 < z0 || b.z0 > z0 + G) continue;
        for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) if (N.pointInPoly(q.poly, x0 + i + 0.5, z0 + j + 0.5)) m[j * G + i] = 1;
      }
      return m;
    }

    grass(tx, tz, fade) {
      const G = this.G, c = this.city, x0 = tx * G, z0 = tz * G;
      let any = false;
      for (let j = 0; j < G && !any; j += 2) for (let i = 0; i < G && !any; i += 2) { const t = c.g[c.idx(x0 + i + 1, z0 + j + 1)]; if (t === GT.GRASS || t === GT.FOREST || t === GT.FIELD) any = true; }
      if (!any || !c.inPlay(x0 + G / 2, z0 + G / 2) && !c.inPlay(x0, z0) && !c.inPlay(x0 + G, z0 + G)) return null;
      const mask = this.grassMask(x0, z0), rng = N.rng((tx * 73856093) ^ (tz * 19349663)), mb = new N.MB(4096);
      const fb = N.clamp(Math.round(fade / 2), 1, 255), tuft = T('grasstuft'), meadow = T('meadow'), weeds = T('weeds');
      for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
        if (mask[j * G + i]) continue;
        const cx = x0 + i, cz = z0 + j, t = c.g[c.idx(cx + 0.5, cz + 0.5)];
        if (t !== GT.GRASS && t !== GT.FOREST && t !== GT.FIELD) continue;
        const cls = GRASS[GRASS_CLASS[c.luAt ? c.luAt(cx + 0.5, cz + 0.5) : ''] || (t === GT.FOREST ? 'forest' : t === GT.FIELD ? 'meadow' : 'lawn')];
        let safe = true;
        for (let oz = -1.5; oz <= 1.5 && safe; oz += 1.5) for (let ox = -1.5; ox <= 1.5; ox += 1.5) { const q = c.g[c.idx(cx + 0.5 + ox, cz + 0.5 + oz)]; if (q !== GT.GRASS && q !== GT.FOREST && q !== GT.FIELD) { safe = false; break; } }
        const patch = N.noise2(cx * 0.09, cz * 0.09, 17), n = Math.floor(cls.d * (0.55 + patch * 0.9) + rng());
        for (let k = 0; k < n; k++) {
          const x = cx + rng(), z = cz + rng(), r = rng(), a = rng() * Math.PI, tt = c.g[c.idx(x, z)];
          if (!safe && ((tt !== GT.GRASS && tt !== GT.FOREST && tt !== GT.FIELD) || c.surfaceAt(x, z) !== 3)) continue;
          let lay = tuft, uv = r < 0.5 ? [0, 0, 1, 1] : [1, 0, 0, 1], h = cls.h[0] + rng() * cls.h[1], w = cls.w[0] + rng() * cls.w[1];
          if (cls.fern && r < cls.fern) { lay = weeds; uv = [0.008, 0.508, 0.492, 0.992]; h = 0.5 + rng() * 0.35; w = 0.8 + rng() * 0.3; }
          else if (cls.weed && r < cls.weed) { lay = weeds; uv = rng() < 0.5 ? [0.008, 0.008, 0.492, 0.492] : [0.508, 0.008, 0.992, 0.492]; h = 0.6 + rng() * 0.5; w = 0.7 + rng() * 0.3; }
          else if (r > 1 - cls.flower) { lay = meadow; h *= 1.25; w *= 1.1; }
          const dry = N.noise2(x * 0.05 + 7, z * 0.05, 19), k2 = 0.86 + rng() * 0.22;
          const tint = [Math.min(255, cls.tint[0] * k2 * (1 + dry * 0.18)) | 0, Math.min(255, cls.tint[1] * k2) | 0, Math.min(255, cls.tint[2] * k2 * (1 - dry * 0.15)) | 0];
          const y = c.groundY(x, z), sw = Math.min(0.3, 0.1 + h * 0.18);
          for (let q = 0; q < 2; q++) {
            const b = a + q * Math.PI / 2, ux = Math.cos(b) * w / 2, uz = Math.sin(b) * w / 2;
            mb.ensure(4, 6);
            const v0 = mb.nv, lean = (rng() - 0.5) * 0.12;
            vtx(mb, x - ux, y, z - uz, 0, 1, 0, uv[0], uv[3], [tint[0], tint[1], tint[2], 200], lay, K.FOLIAGE, 0, fb);
            vtx(mb, x + ux, y, z + uz, 0, 1, 0, uv[2], uv[3], [tint[0], tint[1], tint[2], 200], lay, K.FOLIAGE, 0, fb);
            vtx(mb, x + ux + lean, y + h, z + uz + lean, 0, 1, 0, uv[2], uv[1], [tint[0], tint[1], tint[2], 255], lay, K.FOLIAGE, sw, fb);
            vtx(mb, x - ux + lean, y + h, z - uz + lean, 0, 1, 0, uv[0], uv[1], [tint[0], tint[1], tint[2], 255], lay, K.FOLIAGE, sw, fb);
            mb.tri(v0, v0 + 1, v0 + 2);
            mb.tri(v0, v0 + 2, v0 + 3);
          }
        }
      }
      return mb.ni ? mb : null;
    }
  }

  N.Flora = Flora;
  N.FloraB = B;
  N.FLORA_SPEC = SPEC;
  N.FLORA_BUSH = BUSH;
  N.floraPut = put;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
