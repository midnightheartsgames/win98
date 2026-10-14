(function (F) {
  'use strict';

  const SZ = 1024;
  const MAT = F.MAT;
  const LEAF = 18, GRASS = 19, BARK = 20;
  MAT.LEAF = LEAF; MAT.GRASS = GRASS; MAT.BARK = BARK;
  const TAU = Math.PI * 2;
  const UP = [0, 1, 0];

  const R = {};
  const reg = (n, x, y, w, h) => { R[n] = [x, y, w, h]; };
  ['linden', 'oak', 'birch', 'maple', 'chestnut', 'apple', 'willow', 'poplar'].forEach((n, i) => reg(n, i * 128, 0, 128, 128));
  ['pineA', 'pineB', 'spruce', 'spruceCore', 'juniper', 'hazel', 'lilac', 'jasmine'].forEach((n, i) => reg(n, i * 128, 128, 128, 128));
  ['rose', 'wshrub', 'hedge', 'curtain'].forEach((n, i) => reg(n, i * 128, 256, 128, 128));
  reg('straw', 512, 256, 128, 64); reg('baleEnd', 512, 320, 64, 64); reg('logEnd', 576, 320, 64, 64);
  reg('pileEnd', 640, 256, 128, 64); reg('pileSide', 640, 320, 128, 64);
  reg('barkPine', 768, 256, 64, 512); reg('barkBirch', 832, 256, 64, 512); reg('barkOak', 896, 256, 64, 256); reg('barkGrey', 960, 256, 64, 256);
  reg('barkDark', 896, 512, 64, 256); reg('barkLog', 960, 512, 64, 256);
  reg('rock', 0, 384, 256, 256); reg('rockB', 256, 384, 256, 256); reg('needles', 512, 384, 128, 128); reg('white', 640, 384, 32, 32);
  const COVER = ['grass', 'lawn', 'tall', 'dry', 'daisy', 'yellow', 'lupin', 'fern', 'berry', 'reed', 'dune', 'nettle'];
  COVER.forEach((k, i) => [0, 1].forEach(v => { const j = i * 2 + v; reg('g_' + k + v, (j % 6) * 128, 640 + Math.floor(j / 6) * 64, 128, 64); }));

  const RF = {};
  const regF = (n, x, y, w, h) => { RF[n] = [x, y, w, h]; };
  regF('pine0', 0, 0, 128, 256); regF('pine1', 128, 0, 128, 256); regF('spruce0', 256, 0, 128, 256); regF('spruce1', 384, 0, 128, 256);
  regF('poplar0', 512, 0, 64, 256); regF('poplar1', 576, 0, 64, 256); regF('birch0', 640, 0, 128, 224); regF('birch1', 768, 0, 128, 224);
  regF('willow0', 896, 0, 128, 128); regF('willow1', 896, 128, 128, 128);
  regF('linden0', 0, 256, 128, 144); regF('linden1', 128, 256, 128, 144); regF('maple0', 256, 256, 128, 160); regF('maple1', 384, 256, 128, 160);
  regF('chestnut0', 512, 256, 128, 176); regF('chestnut1', 640, 256, 128, 176); regF('oak0', 768, 256, 128, 128); regF('oak1', 896, 256, 128, 128);
  regF('apple0', 0, 448, 128, 128); regF('apple1', 128, 448, 128, 128);
  ['hazel', 'lilac', 'jasmine', 'juniper', 'willow', 'rose', 'fir', 'sapling'].forEach((n, i) => regF('b_' + n, 256 + i * 64, 448, 64, 64));

  const SP = {
    pine: { h: 16, w: 6.5, shape: 'pine', bark: 'barkPine', leaf: ['pineA', 'pineB'], trunk: 0.018, col: [0.22, 0.34, 0.2] },
    spruce: { h: 14, w: 5.5, shape: 'spruce', bark: 'barkDark', leaf: ['spruce'], trunk: 0.02, col: [0.16, 0.28, 0.18] },
    birch: { h: 12, w: 6.5, shape: 'broad', bark: 'barkBirch', leaf: ['birch'], base: 0.4, n: 10, cs: 0.48, droop: 0.45, limbs: 2, trunk: 0.016, lean: 0.07, col: [0.5, 0.66, 0.26] },
    linden: { h: 11, w: 9, shape: 'broad', bark: 'barkGrey', leaf: ['linden'], base: 0.3, n: 11, cs: 0.6, limbs: 2, trunk: 0.024, col: [0.3, 0.48, 0.2] },
    oak: { h: 12, w: 10, shape: 'broad', bark: 'barkOak', leaf: ['oak'], base: 0.27, n: 12, cs: 0.52, limbs: 3, trunk: 0.036, flat: 0.82, col: [0.28, 0.42, 0.16] },
    apple: { h: 5.5, w: 5.5, shape: 'broad', bark: 'barkOak', leaf: ['apple'], base: 0.24, n: 8, cs: 0.6, limbs: 3, trunk: 0.03, flat: 0.86, lean: 0.06, col: [0.34, 0.5, 0.2] },
    maple: { h: 13, w: 9, shape: 'broad', bark: 'barkGrey', leaf: ['maple'], base: 0.28, n: 11, cs: 0.58, limbs: 2, trunk: 0.024, col: [0.36, 0.54, 0.2] },
    chestnut: { h: 14, w: 10, shape: 'broad', bark: 'barkDark', leaf: ['chestnut'], base: 0.25, n: 12, cs: 0.6, limbs: 2, trunk: 0.028, col: [0.24, 0.4, 0.16] },
    poplar: { h: 22, w: 5, shape: 'column', bark: 'barkGrey', leaf: ['poplar'], base: 0.1, n: 10, cs: 0.72, trunk: 0.02, col: [0.3, 0.46, 0.2] },
    willow: { h: 12, w: 12, shape: 'weep', bark: 'barkDark', leaf: ['willow'], base: 0.36, n: 8, cs: 0.5, limbs: 3, trunk: 0.04, col: [0.46, 0.56, 0.32] }
  };
  F.TREE = SP;

  const BUSHES = {
    hazel: { leaf: 'hazel', shape: 'clump', n: 6, ch: 3.1, cw: 3.4 }, lilac: { leaf: 'lilac', shape: 'clump', n: 6, ch: 2.8, cw: 2.8 }, jasmine: { leaf: 'jasmine', shape: 'clump', n: 5, ch: 2.1, cw: 2.3 },
    willow: { leaf: 'wshrub', shape: 'clump', n: 6, ch: 2.9, cw: 3.1 }, rose: { leaf: 'rose', shape: 'clump', n: 5, ch: 1.4, cw: 1.9 }, juniper: { leaf: 'juniper', shape: 'column', n: 4, ch: 2.3, cw: 1.25 },
    fir: { leaf: 'spruce', shape: 'fir', ch: 2.1, cw: 1.5 }, sapling: { leaf: 'birch', shape: 'sapling', n: 4, ch: 3.5, cw: 1.7 }
  };
  const PAD = 1.04;

  const TUFT = {
    grass: { h: [0.35, 0.6], w: [0.6, 1.0] }, lawn: { h: [0.18, 0.32], w: [0.5, 0.8] }, tall: { h: [0.55, 0.95], w: [0.7, 1.1] },
    dry: { h: [0.35, 0.7], w: [0.6, 1.0] }, daisy: { h: [0.3, 0.5], w: [0.6, 0.9] }, yellow: { h: [0.22, 0.4], w: [0.5, 0.8] },
    lupin: { h: [0.7, 1.1], w: [0.7, 1.0] }, fern: { h: [0.45, 0.8], w: [0.9, 1.4] }, berry: { h: [0.2, 0.35], w: [0.8, 1.2] },
    reed: { h: [1.5, 2.3], w: [0.9, 1.3] }, dune: { h: [0.55, 0.85], w: [0.8, 1.2] }, nettle: { h: [0.6, 1.0], w: [0.6, 0.9] }
  };

  const uvq = (r, S = SZ, H = SZ) => [(r[0] + 0.5) / S, (r[1] + 0.5) / H, (r[0] + r[2] - 0.5) / S, (r[1] + r[3] - 0.5) / H];
  const WHITE = (() => { const r = R.white; return [(r[0] + r[2] / 2) / SZ, (r[1] + r[3] / 2) / SZ]; })();
  const c8 = v => (v < 0 ? 0 : v > 255 ? 255 : Math.round(v));

  function inst(x, z, s, sp) {
    const h1 = F.hash2(Math.round(x * 10), Math.round(z * 10), 5), h2 = F.hash2(Math.round(x * 10), Math.round(z * 10), 9), h3 = F.hash2(Math.round(x * 7), Math.round(z * 7), 13);
    const H = sp.h * s * (0.88 + 0.24 * h1), Wd = sp.w * s * (0.85 + 0.3 * h2);
    const tint = [0.86 + 0.18 * h3, 0.9 + 0.14 * h2, 0.86 + 0.14 * h1];
    return { H, Wd, seed: Math.floor(h1 * 1e6) + Math.floor(h2 * 1e3), v: h3 < 0.5 ? 0 : 1, yaw: h2 * Math.PI, tint };
  }

  function skeleton(kind, H, Wd, seed) {
    const sp = SP[kind], rnd = F.rng(seed);
    const sk = { kind, h: H, w: Wd, trunks: [], limbs: [], puffs: [], tiers: [], cores: [], curtains: [], crown: null };
    const r0 = sp.trunk * H;
    const lean = (sp.lean || 0.025) * rnd(), la = rnd() * TAU, lx = Math.cos(la) * lean, lz = Math.sin(la) * lean;
    const trunk = (top, rTop, bend = 0.04) => {
      const pts = [], n = 3;
      const bx = (rnd() - 0.5) * bend * top, bz = (rnd() - 0.5) * bend * top;
      for (let i = 0; i <= n; i++) {
        const t = i / n, y = top * t, k = Math.sin(t * Math.PI);
        pts.push([lx * y + bx * k, y, lz * y + bz * k, r0 * (1.18 - t * (1.18 - rTop)) * (i === 0 ? 1.12 : 1)]);
      }
      return pts;
    };
    const at = (pts, y) => {
      for (let i = 1; i < pts.length; i++) if (pts[i][1] >= y || i === pts.length - 1) { const a = pts[i - 1], b = pts[i], t = F.clamp((y - a[1]) / Math.max(0.01, b[1] - a[1]), 0, 1); return [a[0] + (b[0] - a[0]) * t, y, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; }
      return pts[pts.length - 1];
    };
    if (sp.shape === 'broad' || sp.shape === 'weep') {
      const weep = sp.shape === 'weep';
      const base = sp.base * H, top = weep ? H * 0.42 : H * (sp.base + (1 - sp.base) * 0.58);
      const tr = trunk(top, 0.42);
      sk.trunks.push(tr);
      if (kind === 'birch' && rnd() < 0.25) {
        const off = [0.35 * Math.cos(la + 2), 0, 0.35 * Math.sin(la + 2)];
        sk.trunks.push(tr.map((p, i) => [p[0] + off[0] * (1 + i * 0.6), p[1] * 0.92, p[2] + off[2] * (1 + i * 0.6), p[3] * 0.8]));
      }
      const tp = tr[tr.length - 1];
      const ry = (H - base) / 2 * (sp.flat || 1), rx = Wd / 2;
      const cy = weep ? H * 0.7 : base + (H - base) / 2 + (sp.flat ? (H - base) * (1 - sp.flat) * 0.5 : 0);
      const C = { x: tp[0], y: cy, z: tp[2], rx, ry: weep ? H * 0.28 : ry };
      sk.crown = C;
      const nl = (sp.limbs || 2) + (rnd() < 0.5 ? 1 : 0);
      for (let i = 0; i < nl; i++) {
        const a = la + i * TAU / nl + rnd() * 0.8, y0 = base + (top - base) * (0.15 + rnd() * 0.5), p0 = at(tr, y0);
        const p1 = [C.x + Math.cos(a) * rx * 0.62, C.y + C.ry * (weep ? 0.2 : -0.05 + rnd() * 0.3), C.z + Math.sin(a) * rx * 0.62];
        sk.limbs.push([p0, p1, p0[3] * 0.5, 0.25]);
      }
      const n = sp.n;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, yy = weep ? 1 - t * 0.9 : 1 - t * 1.62;
        const rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = i * 2.39996 + rnd() * 0.6, k = 0.58 + rnd() * 0.3;
        const px = C.x + Math.cos(a) * rr * rx * k, py = C.y + yy * C.ry * k, pz = C.z + Math.sin(a) * rr * rx * k;
        const S = (rx + C.ry) * sp.cs * (0.82 + rnd() * 0.36);
        sk.puffs.push({ x: px, y: py, z: pz, S, yaw: rnd() * Math.PI, tilt: (sp.droop || 0.12) * (rnd() - 0.3), ao: 0.78 + 0.22 * (yy * 0.5 + 0.5), leaf: 0 });
      }
      sk.puffs.push({ x: C.x, y: C.y, z: C.z, S: (rx + C.ry) * 0.95, yaw: rnd() * Math.PI, tilt: 0.1, ao: 0.62, leaf: 0, core: true });
      if (weep) {
        const m = 9;
        for (let i = 0; i < m; i++) {
          const a = i * TAU / m + rnd() * 0.4, R0 = rx * (0.82 + rnd() * 0.12);
          sk.curtains.push({ a, R: R0, y1: C.y + C.ry * (0.05 + rnd() * 0.2), y0: 1.1 + rnd() * 1.2, w: 2.4 + rnd() * 1.2 });
        }
      }
    } else if (sp.shape === 'pine') {
      const tr = trunk(H * 0.98, 0.16, 0.06);
      sk.trunks.push(tr);
      const n = 8 + Math.floor(rnd() * 4);
      sk.crown = { x: tr[3][0], y: H * 0.84, z: tr[3][2], rx: Wd / 2, ry: H * 0.16 };
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), y = H * (0.66 + 0.28 * t) + (rnd() - 0.5) * 0.6, p0 = at(tr, y);
        const a = i * 2.39996 + rnd(), L = Wd / 2 * (0.82 - 0.45 * t) * (0.45 + rnd() * 0.5);
        const p1 = [p0[0] + Math.cos(a) * L, y + 0.2 + rnd() * 0.5, p0[2] + Math.sin(a) * L];
        sk.limbs.push([p0, p1, Math.max(0.05, p0[3] * 0.4), 0.4]);
        sk.puffs.push({ x: p1[0], y: p1[1] + 0.15, z: p1[2], S: Wd * (0.5 - 0.14 * t) * (0.85 + rnd() * 0.3), yaw: rnd() * Math.PI, tilt: 0.04, ao: 0.78 + 0.22 * t, leaf: i % 2 });
      }
      const tp = tr[3];
      sk.puffs.push({ x: tp[0], y: H * 0.97, z: tp[2], S: Wd * 0.36, yaw: rnd() * Math.PI, tilt: 0, ao: 1, leaf: 0 });
      sk.puffs.push({ x: tp[0], y: H * 0.84, z: tp[2], S: Wd * 0.62, yaw: rnd() * Math.PI, tilt: 0, ao: 0.68, leaf: 1, core: true });
      for (let i = 0; i < 4; i++) {
        const y = H * (0.25 + 0.35 * rnd()), p0 = at(tr, y), a = rnd() * TAU, L = 0.4 + rnd() * 0.7;
        sk.limbs.push([p0, [p0[0] + Math.cos(a) * L, y - 0.2 - rnd() * 0.3, p0[2] + Math.sin(a) * L], 0.04, 0.05]);
      }
    } else if (sp.shape === 'spruce') {
      const tr = trunk(H, 0.06, 0.02);
      sk.trunks.push(tr);
      sk.crown = { x: 0, y: H * 0.45, z: 0, rx: Wd / 2, ry: H * 0.5 };
      const m = Math.round(5 + H / 2.6), gap = H * 0.88 / (m - 1);
      for (let j = 0; j < m; j++) {
        const t = j / (m - 1), y = H * (0.08 + 0.86 * t), rt = Wd / 2 * Math.pow(1 - t * 0.92, 0.85) * (0.9 + rnd() * 0.2) + 0.3;
        const c = rt < 1.1 ? 4 : 6, a0 = rnd() * TAU, p = at(tr, y);
        for (let k = 0; k < c; k++) sk.tiers.push({ x: p[0], y, z: p[2], a: a0 + k * TAU / c + (rnd() - 0.5) * 0.35, r: rt * (0.85 + rnd() * 0.2), hb: gap * 2.1, droop: 0.22 + rnd() * 0.1, ao: 0.6 + 0.4 * t });
      }
      sk.cores.push({ y0: H * 0.05, y1: H * 1.01, w: Wd * 0.5, yaw: rnd() * Math.PI });
    } else if (sp.shape === 'column') {
      const tr = trunk(H * 0.88, 0.25, 0.02);
      sk.trunks.push(tr);
      sk.crown = { x: 0, y: H * 0.55, z: 0, rx: Wd / 2, ry: H * 0.46 };
      const n = sp.n;
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, y = H * (sp.base + 0.9 * (1 - sp.base) * t) + 1, p = at(tr, Math.min(y, H * 0.86));
        const rp = Wd / 2 * Math.pow(Math.sin(Math.PI * (0.12 + 0.8 * t)), 0.7);
        const a = rnd() * TAU;
        sk.puffs.push({ x: p[0] + Math.cos(a) * rp * 0.25, y, z: p[2] + Math.sin(a) * rp * 0.25, S: rp * 2 * sp.cs * 1.3, yaw: rnd() * Math.PI, tilt: 0.05, ao: 0.72 + 0.28 * t, leaf: 0 });
      }
    }
    return sk;
  }

  function bushSkeleton(kind, h, w, seed) {
    const B = BUSHES[kind], rnd = F.rng(seed);
    const sk = { kind, h, w, trunks: [], limbs: [], puffs: [], tiers: [], cores: [], curtains: [], crown: { x: 0, y: h * 0.5, z: 0, rx: w / 2, ry: h / 2 } };
    if (B.shape === 'clump') {
      for (let i = 0; i < 4; i++) {
        const a = rnd() * TAU, d = w * 0.18 * rnd();
        sk.limbs.push([[Math.cos(a) * d, 0, Math.sin(a) * d, 0.04], [Math.cos(a) * w * 0.28, h * 0.62, Math.sin(a) * w * 0.28], 0.035, 0.3]);
      }
      for (let i = 0; i < B.n; i++) {
        const t = (i + 0.5) / B.n, yy = 0.9 - t * 1.25, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), a = i * 2.39996 + rnd() * 0.5, k = 0.5 + rnd() * 0.25;
        sk.puffs.push({ x: Math.cos(a) * rr * w / 2 * k, y: h * 0.5 + yy * h * 0.5 * k, z: Math.sin(a) * rr * w / 2 * k, S: (w + h) * 0.42 * (0.85 + rnd() * 0.3), yaw: rnd() * Math.PI, tilt: 0.1 * (rnd() - 0.5), ao: 0.74 + 0.26 * (yy * 0.5 + 0.5), leaf: 0 });
      }
      sk.puffs.push({ x: 0, y: h * 0.45, z: 0, S: (w + h) * 0.5, yaw: rnd() * Math.PI, tilt: 0, ao: 0.6, leaf: 0, core: true });
    } else if (B.shape === 'column') {
      for (let i = 0; i < B.n; i++) {
        const t = (i + 0.5) / B.n;
        sk.puffs.push({ x: (rnd() - 0.5) * 0.2, y: h * (0.15 + 0.78 * t), z: (rnd() - 0.5) * 0.2, S: w * 1.25 * (1.05 - 0.5 * t), yaw: rnd() * Math.PI, tilt: 0, ao: 0.72 + 0.28 * t, leaf: 0 });
      }
    } else if (B.shape === 'fir') {
      const m = 5, gap = h * 0.86 / (m - 1);
      for (let j = 0; j < m; j++) {
        const t = j / (m - 1), y = h * (0.1 + 0.84 * t), rt = w / 2 * (1 - t * 0.8) + 0.12, c = 5, a0 = rnd() * TAU;
        for (let k = 0; k < c; k++) sk.tiers.push({ x: 0, y, z: 0, a: a0 + k * TAU / c, r: rt, hb: gap * 2.1, droop: 0.25, ao: 0.65 + 0.35 * t });
      }
      sk.cores.push({ y0: 0.05, y1: h * 1.02, w: w * 0.55, yaw: rnd() * Math.PI });
      sk.trunks.push([[0, 0, 0, 0.05], [0, h * 0.5, 0, 0.035], [0, h, 0, 0.01]]);
    } else if (B.shape === 'sapling') {
      const lean = (rnd() - 0.5) * 0.15;
      sk.trunks.push([[0, 0, 0, 0.06], [lean * h * 0.5, h * 0.5, 0, 0.045], [lean * h, h * 0.95, 0, 0.02]]);
      sk.crown = { x: lean * h * 0.7, y: h * 0.68, z: 0, rx: w / 2, ry: h * 0.32 };
      for (let i = 0; i < B.n; i++) {
        const t = (i + 0.5) / B.n, a = i * 2.39996;
        sk.puffs.push({ x: lean * h * 0.7 + Math.cos(a) * w * 0.22, y: h * (0.45 + 0.45 * t), z: Math.sin(a) * w * 0.22, S: w * 0.85, yaw: rnd() * Math.PI, tilt: 0.2, ao: 0.78 + 0.22 * t, leaf: 0 });
      }
    }
    return sk;
  }

  function rot(x, z, c, s) { return [x * c - z * s, x * s + z * c]; }

  function emit(b, sk, o) {
    const ox = o.x, oy = o.y, oz = o.z, c = Math.cos(o.yaw), s = Math.sin(o.yaw), tint = o.tint, H = sk.h, swayK = o.sway;
    const C = sk.crown;
    const P = (x, y, z) => { const q = rot(x, z, c, s); return [ox + q[0], oy + y, oz + q[1]]; };
    const sway = y => c8(255 * Math.min(1, swayK * Math.pow(F.clamp(y / H, 0, 1), 1.5)));
    const leafN = (p) => {
      if (!C) return UP;
      const q = rot(C.x, C.z, c, s);
      let nx = (p[0] - ox - q[0]) / C.rx, ny = (p[1] - oy - C.y) / C.ry + 0.35, nz = (p[2] - oz - q[1]) / C.rx;
      const l = Math.hypot(nx, ny, nz) || 1;
      return [nx / l, ny / l, nz / l];
    };
    const barkR = uvq(R[o.bark]);
    for (const tr of sk.trunks) prism(b, tr.map(p => { const w = P(p[0], p[1], p[2]); return [w[0], w[1], w[2], p[3]]; }), o.sides, barkR, o.barkTint, y => c8(255 * Math.min(1, 0.14 * swayK * Math.pow(F.clamp((y - oy) / H, 0, 1), 2))), oy, true);
    for (const l of sk.limbs) {
      const a = P(l[0][0], l[0][1], l[0][2]), e = P(l[1][0], l[1][1], l[1][2]);
      prism(b, [[a[0], a[1], a[2], l[2]], [e[0], e[1], e[2], l[2] * 0.45]], 3, barkR, o.barkTint, y => c8(255 * Math.min(1, swayK * l[3] * Math.pow(F.clamp((y - oy) / H, 0, 1), 1.5))), oy, false);
    }
    for (const p of sk.puffs) {
      const ctr = P(p.x, p.y, p.z), lr = uvq(R[o.leaf[p.leaf % o.leaf.length]]);
      puff(b, ctr, p.S, p.yaw + o.yaw, p.tilt, lr, p.ao, tint, leafN, sway, oy, p.core);
    }
    if (sk.tiers.length) {
      const tr = uvq(R[o.tierLeaf || 'spruce']);
      for (const t of sk.tiers) {
        const a = t.a + o.yaw, ca = Math.cos(a), sa = Math.sin(a), base = P(t.x, t.y, t.z);
        const d = t.r * t.droop, up = t.hb * 0.36, dn = t.hb * 0.64;
        const tip = [base[0] + ca * t.r, base[1] - d, base[2] + sa * t.r];
        const k0 = t.ao * 0.82, k1 = t.ao;
        const pts = [[base[0], base[1] - dn, base[2]], [tip[0], tip[1] - dn * 0.45, tip[2]], [tip[0], tip[1] + up * 0.45, tip[2]], [base[0], base[1] + up, base[2]]];
        const us = [[tr[0], tr[3]], [tr[2], tr[3]], [tr[2], tr[1]], [tr[0], tr[1]]], ks = [k0, k1, k1, k0];
        b.need(4, 6);
        const ids = pts.map((p, i) => {
          const n = leafN(p), k = ks[i];
          return b.v(p[0], p[1], p[2], us[i][0], us[i][1], n[0], n[1], n[2], [c8(255 * tint[0] * k), c8(255 * tint[1] * k), c8(255 * tint[2] * k), sway(p[1] - oy)], LEAF);
        });
        b.tri(ids[0], ids[1], ids[2]); b.tri(ids[0], ids[2], ids[3]);
      }
    }
    for (const k of sk.cores) {
      const cr = uvq(R.spruceCore);
      for (let q = 0; q < 2; q++) {
        const a = k.yaw + o.yaw + q * Math.PI / 2, ux = Math.cos(a) * k.w / 2, uz = Math.sin(a) * k.w / 2;
        card(b, [ox - ux, oy + k.y0, oz - uz], [ox + ux, oy + k.y0, oz + uz], [ox + ux, oy + k.y1, oz + uz], [ox - ux, oy + k.y1, oz - uz], cr, tint, 0.62, 1, leafN, sway, oy);
      }
    }
    for (const cu of sk.curtains) {
      const a = cu.a + o.yaw, ca = Math.cos(a), sa = Math.sin(a), ux = -sa * cu.w / 2, uz = ca * cu.w / 2;
      const q = rot(C.x, C.z, c, s), cx = ox + q[0] + ca * cu.R, cz = oz + q[1] + sa * cu.R;
      const cr = uvq(R.curtain);
      card(b, [cx - ux, oy + cu.y0, cz - uz], [cx + ux, oy + cu.y0, cz + uz], [cx + ux, oy + cu.y1, cz + uz], [cx - ux, oy + cu.y1, cz - uz], cr, tint, 0.75, 1, leafN, sway, oy);
    }
  }

  function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }

  function card(b, p0, p1, p2, p3, uv, tint, ao0, ao1, nf, sway, oy) {
    b.need(4, 6);
    const cols = [ao0, ao0, ao1, ao1];
    const ps = [p0, p1, p2, p3], us = [[uv[0], uv[3]], [uv[2], uv[3]], [uv[2], uv[1]], [uv[0], uv[1]]];
    const ids = ps.map((p, i) => {
      const n = nf(p), k = cols[i];
      return b.v(p[0], p[1], p[2], us[i][0], us[i][1], n[0], n[1], n[2], [c8(255 * tint[0] * k), c8(255 * tint[1] * k), c8(255 * tint[2] * k), sway(p[1] - oy)], LEAF);
    });
    b.tri(ids[0], ids[1], ids[2]); b.tri(ids[0], ids[2], ids[3]);
  }

  function puff(b, ctr, S, yaw, tilt, uv, ao, tint, nf, sway, oy, core) {
    const ca = Math.cos(yaw), sa = Math.sin(yaw), h = S / 2, st = Math.sin(tilt), ct = Math.cos(tilt);
    const planes = [
      [[ca, 0, sa], [-sa * st, ct, ca * st]],
      [[-sa, 0, ca], [ca * st, ct, sa * st]],
      [[ca, 0, sa], [-sa * 0.94, 0.34, ca * 0.94]]
    ];
    const n = core ? 2 : 3;
    for (let k = 0; k < n; k++) {
      const U = planes[k][0], V = planes[k][1];
      const corner = (a, c) => [ctr[0] + U[0] * h * a + V[0] * h * c, ctr[1] + U[1] * h * a + V[1] * h * c, ctr[2] + U[2] * h * a + V[2] * h * c];
      const p0 = corner(-1, -1), p1 = corner(1, -1), p2 = corner(1, 1), p3 = corner(-1, 1);
      b.need(4, 6);
      const us = [[uv[0], uv[3]], [uv[2], uv[3]], [uv[2], uv[1]], [uv[0], uv[1]]];
      const ids = [p0, p1, p2, p3].map((p, i) => {
        const nn = nf(p), k2 = ao * (i < 2 ? 0.84 : 1);
        return b.v(p[0], p[1], p[2], us[i][0], us[i][1], nn[0], nn[1], nn[2], [c8(255 * tint[0] * k2), c8(255 * tint[1] * k2), c8(255 * tint[2] * k2), sway(p[1] - oy)], LEAF);
      });
      b.tri(ids[0], ids[1], ids[2]); b.tri(ids[0], ids[2], ids[3]);
    }
  }

  function prism(b, pts, sides, uv, tint, sw, oy, flare) {
    const n = pts.length;
    b.need(n * (sides + 1), (n - 1) * sides * 6);
    let total = 0;
    const acc = [0];
    for (let i = 1; i < n; i++) { total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); acc.push(total); }
    const base = b.n;
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)];
      const ax = norm3([q[0] - o[0], q[1] - o[1], q[2] - o[2]]);
      const ref = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const e1 = norm3([ax[1] * ref[2] - ax[2] * ref[1], ax[2] * ref[0] - ax[0] * ref[2], ax[0] * ref[1] - ax[1] * ref[0]]);
      const e2 = [ax[1] * e1[2] - ax[2] * e1[1], ax[2] * e1[0] - ax[0] * e1[2], ax[0] * e1[1] - ax[1] * e1[0]];
      const v = uv[3] - (uv[3] - uv[1]) * (total > 0 ? acc[i] / total : 0);
      const ao = flare ? 0.62 + 0.38 * F.clamp((p[1] - oy) / 2.2, 0, 1) : 0.85;
      const col = [c8(255 * tint[0] * ao), c8(255 * tint[1] * ao), c8(255 * tint[2] * ao), sw(p[1])];
      for (let j = 0; j <= sides; j++) {
        const a = j / sides * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const nx = e1[0] * ca + e2[0] * sa, ny = e1[1] * ca + e2[1] * sa, nz = e1[2] * ca + e2[2] * sa;
        b.v(p[0] + nx * p[3], p[1] + ny * p[3], p[2] + nz * p[3], uv[0] + (uv[2] - uv[0]) * j / sides, v, nx, ny, nz, col, BARK);
      }
    }
    for (let i = 0; i + 1 < n; i++) {
      for (let j = 0; j < sides; j++) {
        const a = base + i * (sides + 1) + j, c = a + sides + 1;
        b.tri(a, c, a + 1); b.tri(a + 1, c, c + 1);
      }
    }
  }

  const BARK_TINT = { barkPine: [1, 1, 1], barkBirch: [1, 1, 1], barkOak: [0.95, 0.95, 0.95], barkGrey: [1, 1, 1], barkDark: [1, 1, 1], barkLog: [1, 1, 1] };

  function treeNear(b, t) {
    const sp = SP[t.kind] || SP.pine, I = inst(t.x, t.z, t.s, sp);
    const sk = skeleton(t.kind in SP ? t.kind : 'pine', I.H, I.Wd, I.seed);
    emit(b, sk, { x: t.x, y: t.y - 0.15, z: t.z, yaw: I.yaw, tint: I.tint, bark: sp.bark, barkTint: BARK_TINT[sp.bark], leaf: sp.leaf, sides: I.H > 9 ? 6 : 5, sway: Math.min(1, 0.32 * Math.min(1.4, I.H / 12)) });
    return I.H;
  }

  function treeFar(b, t) {
    const sp = SP[t.kind] || SP.pine, kind = t.kind in SP ? t.kind : 'pine', I = inst(t.x, t.z, t.s, sp);
    const r = RF[kind + I.v], uv = uvq(r, SZ, SZ), qh = I.H * PAD, qw = qh * r[2] / r[3];
    const y0 = t.y - 0.25, tint = I.tint;
    for (let k = 0; k < 3; k++) {
      const a = I.yaw + k * Math.PI / 3, ux = Math.cos(a) * qw / 2, uz = Math.sin(a) * qw / 2;
      const nL = norm3([-Math.cos(a) * 0.8, 0.45, -Math.sin(a) * 0.8]), nR = norm3([Math.cos(a) * 0.8, 0.45, Math.sin(a) * 0.8]);
      const tL = norm3([nL[0] * 0.5, 1, nL[2] * 0.5]), tR = norm3([nR[0] * 0.5, 1, nR[2] * 0.5]);
      b.need(4, 6);
      const sw = c8(255 * Math.min(1, 0.32 * Math.min(1.4, I.H / 12)));
      const cb = [c8(235 * tint[0]), c8(235 * tint[1]), c8(235 * tint[2]), 0], ct = [c8(255 * tint[0]), c8(255 * tint[1]), c8(255 * tint[2]), sw];
      const i0 = b.v(t.x - ux, y0, t.z - uz, uv[0], uv[3], nL[0], nL[1], nL[2], cb, LEAF);
      const i1 = b.v(t.x + ux, y0, t.z + uz, uv[2], uv[3], nR[0], nR[1], nR[2], cb, LEAF);
      const i2 = b.v(t.x + ux, y0 + qh, t.z + uz, uv[2], uv[1], tR[0], tR[1], tR[2], ct, LEAF);
      const i3 = b.v(t.x - ux, y0 + qh, t.z - uz, uv[0], uv[1], tL[0], tL[1], tL[2], ct, LEAF);
      b.tri(i0, i1, i2); b.tri(i0, i2, i3);
    }
    return qh;
  }

  function bushTint(f) {
    const h = F.hash2(Math.round(f.x * 10), Math.round(f.z * 10), 17);
    return [0.88 + 0.14 * h, 0.9 + 0.12 * (1 - h), 0.88 + 0.1 * h];
  }

  function bushNear(b, f) {
    const B = BUSHES[f.kind];
    if (!B) return;
    const sk = bushSkeleton(f.kind, f.h, f.w, f.seed);
    emit(b, sk, { x: f.x, y: f.y - 0.1, z: f.z, yaw: f.yaw, tint: bushTint(f), bark: f.kind === 'sapling' ? 'barkBirch' : 'barkGrey', barkTint: [0.9, 0.9, 0.9], leaf: [B.leaf], tierLeaf: 'spruce', sides: 4, sway: Math.min(1, 0.12 + f.h * 0.04) });
  }

  function bushFar(b, f) {
    const r = RF['b_' + f.kind];
    if (!r) return;
    const B = BUSHES[f.kind], uv = uvq(r, SZ, SZ), tint = bushTint(f), y0 = f.y - 0.1;
    const q = Math.max(B.ch, B.cw) * 1.08 * Math.max(f.h / B.ch, f.w / B.cw);
    for (let k = 0; k < 2; k++) {
      const a = f.yaw + k * Math.PI / 2, ux = Math.cos(a) * q / 2, uz = Math.sin(a) * q / 2;
      const nL = norm3([-Math.cos(a), 0.6, -Math.sin(a)]), nR = norm3([Math.cos(a), 0.6, Math.sin(a)]);
      const tL = norm3([nL[0] * 0.5, 1, nL[2] * 0.5]), tR = norm3([nR[0] * 0.5, 1, nR[2] * 0.5]);
      b.need(4, 6);
      const cb = [c8(225 * tint[0]), c8(225 * tint[1]), c8(225 * tint[2]), 0], ct = [c8(255 * tint[0]), c8(255 * tint[1]), c8(255 * tint[2]), 20];
      const i0 = b.v(f.x - ux, y0, f.z - uz, uv[0], uv[3], nL[0], nL[1], nL[2], cb, LEAF);
      const i1 = b.v(f.x + ux, y0, f.z + uz, uv[2], uv[3], nR[0], nR[1], nR[2], cb, LEAF);
      const i2 = b.v(f.x + ux, y0 + q, f.z + uz, uv[2], uv[1], tR[0], tR[1], tR[2], ct, LEAF);
      const i3 = b.v(f.x - ux, y0 + q, f.z - uz, uv[0], uv[1], tL[0], tL[1], tL[2], ct, LEAF);
      b.tri(i0, i1, i2); b.tri(i0, i2, i3);
    }
  }

  function hedge(b, f) {
    const tx = Math.sin(f.yaw), tz = -Math.cos(f.yaw), nx = -tz, nz = tx, hw = f.w / 2, y0 = f.y - 0.1, y1 = f.y + f.h;
    const n = Math.max(1, Math.round(f.len / 1.6)), uv = uvq(R.hedge), tint = bushTint(f);
    const col = (k, top) => [c8(255 * tint[0] * k), c8(255 * tint[1] * k), c8(255 * tint[2] * k), top ? 10 : 0];
    const P = (s, l, y) => [f.x + tx * s + nx * l, y, f.z + tz * s + nz * l];
    const quad = (p0, p1, p2, p3, nrm, k0, k1, top) => {
      b.need(4, 6);
      const i0 = b.v(p0[0], p0[1], p0[2], uv[0], uv[3], nrm[0], nrm[1], nrm[2], col(k0, false), LEAF);
      const i1 = b.v(p1[0], p1[1], p1[2], uv[2], uv[3], nrm[0], nrm[1], nrm[2], col(k0, false), LEAF);
      const i2 = b.v(p2[0], p2[1], p2[2], uv[2], uv[1], nrm[0], nrm[1], nrm[2], col(k1, top), LEAF);
      const i3 = b.v(p3[0], p3[1], p3[2], uv[0], uv[1], nrm[0], nrm[1], nrm[2], col(k1, top), LEAF);
      b.tri(i0, i1, i2); b.tri(i0, i2, i3);
    };
    for (let i = 0; i < n; i++) {
      const s0 = -f.len / 2 + f.len * i / n, s1 = -f.len / 2 + f.len * (i + 1) / n;
      const wob = (F.hash2(f.seed, i, 3) - 0.5) * 0.12, top = y1 + wob;
      quad(P(s0, hw, y0), P(s1, hw, y0), P(s1, hw, top), P(s0, hw, top), [nx, 0.25, nz], 0.62, 0.95, true);
      quad(P(s1, -hw, y0), P(s0, -hw, y0), P(s0, -hw, top), P(s1, -hw, top), [-nx, 0.25, -nz], 0.62, 0.95, true);
      quad(P(s0, -hw, top), P(s1, -hw, top), P(s1, hw, top), P(s0, hw, top), [0, 1, 0], 1, 1.05, true);
    }
    quad(P(-f.len / 2, -hw, y0), P(-f.len / 2, hw, y0), P(-f.len / 2, hw, y1), P(-f.len / 2, -hw, y1), [-tx, 0.25, -tz], 0.62, 0.95, true);
    quad(P(f.len / 2, hw, y0), P(f.len / 2, -hw, y0), P(f.len / 2, -hw, y1), P(f.len / 2, hw, y1), [tx, 0.25, tz], 0.62, 0.95, true);
  }

  const ICO = (() => {
    const t = (1 + Math.sqrt(5)) / 2;
    const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm3);
    const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    const sub = (V, Fc) => {
      const out = [], vv = V.slice(), mid = new Map();
      const m = (a, c) => { const k = a < c ? a + ':' + c : c + ':' + a; if (!mid.has(k)) { vv.push(norm3([(vv[a][0] + vv[c][0]) / 2, (vv[a][1] + vv[c][1]) / 2, (vv[a][2] + vv[c][2]) / 2])); mid.set(k, vv.length - 1); } return mid.get(k); };
      for (const [a, c, d] of Fc) { const ab = m(a, c), bc = m(c, d), ca = m(d, a); out.push([a, ab, ca], [c, bc, ab], [d, ca, bc], [ab, bc, ca]); }
      return { v: vv, f: out };
    };
    return { lo: { v, f }, hi: sub(v, f) };
  })();

  function rock(b, f) {
    const mesh = f.r >= 1.1 ? ICO.hi : ICO.lo, rnd = F.rng(f.seed), c = Math.cos(f.yaw), s = Math.sin(f.yaw);
    const sq = 0.75 + rnd() * 0.35, bury = f.h * 0.3;
    const uv = uvq(R[f.kind === 'boulder' && rnd() < 0.5 ? 'rockB' : 'rock']);
    const pink = rnd(), base = [0.82 + 0.12 * pink, 0.8 + 0.05 * pink, 0.78], moss = f.moss || 0;
    const P = mesh.v.map((v, i) => {
      const j = 0.78 + 0.32 * F.hash2(i, f.seed & 1023, 7);
      let x = v[0] * f.r * j, y = v[1] * f.h * j, z = v[2] * f.r * j * sq;
      y = Math.max(y, -bury - 0.02);
      const q = rot(x, z, c, s);
      return [f.x + q[0], f.y + y + bury * 0.6, f.z + q[1], v];
    });
    b.need(mesh.f.length * 3, mesh.f.length * 3);
    for (const fc of mesh.f) {
      const a = P[fc[0]], e = P[fc[1]], d = P[fc[2]];
      let n = norm3([(e[1] - a[1]) * (d[2] - a[2]) - (e[2] - a[2]) * (d[1] - a[1]), (e[2] - a[2]) * (d[0] - a[0]) - (e[0] - a[0]) * (d[2] - a[2]), (e[0] - a[0]) * (d[1] - a[1]) - (e[1] - a[1]) * (d[0] - a[0])]);
      const cx = (a[0] + e[0] + d[0]) / 3 - f.x, cz = (a[2] + e[2] + d[2]) / 3 - f.z, cy = (a[1] + e[1] + d[1]) / 3 - f.y;
      if (n[0] * cx + n[1] * cy + n[2] * cz < 0) n = [-n[0], -n[1], -n[2]];
      const ay = Math.abs(n[1]) > 0.6, ax = Math.abs(n[0]) > Math.abs(n[2]);
      const proj = p => ay ? [p[0], p[2]] : ax ? [p[2], p[1]] : [p[0], p[1]];
      const pr = [a, e, d].map(proj), mu = Math.min(pr[0][0], pr[1][0], pr[2][0]), mv = Math.min(pr[0][1], pr[1][1], pr[2][1]);
      const ou = F.hash2(fc[0], fc[1], f.seed & 4095) * 0.4, ov = F.hash2(fc[1], fc[2], f.seed & 4095) * 0.4;
      const ids = [a, e, d].map((p, k) => {
        const rn = p[3], vn = norm3([n[0] * 0.5 + rn[0] * 0.5, n[1] * 0.5 + rn[1] * 0.5, n[2] * 0.5 + rn[2] * 0.5]);
        const up = F.clamp(vn[1], 0, 1), ao = 0.66 + 0.34 * F.clamp((p[1] - f.y + bury) / (f.h * 1.2), 0, 1);
        const mk = moss * up * up;
        const col = [c8(255 * ao * (base[0] * (1 - mk) + 0.48 * mk)), c8(255 * ao * (base[1] * (1 - mk) + 0.62 * mk)), c8(255 * ao * (base[2] * (1 - mk) + 0.3 * mk)), 255];
        const u = F.clamp(ou + (pr[k][0] - mu) * 0.32, 0, 1), v = F.clamp(ov + (pr[k][1] - mv) * 0.32, 0, 1);
        return b.v(p[0], p[1], p[2], uv[0] + (uv[2] - uv[0]) * u, uv[1] + (uv[3] - uv[1]) * v, vn[0], vn[1], vn[2], col, 0);
      });
      b.tri(ids[0], ids[1], ids[2]);
    }
  }

  function capFan(b, ctr, axis, e1, e2, r, sides, uv, col) {
    b.need(sides + 1, sides * 3);
    const cu = (uv[0] + uv[2]) / 2, cv = (uv[1] + uv[3]) / 2, hu = (uv[2] - uv[0]) / 2, hv = (uv[3] - uv[1]) / 2;
    const c0 = b.v(ctr[0], ctr[1], ctr[2], cu, cv, axis[0], axis[1], axis[2], col, 0);
    const first = b.n;
    for (let j = 0; j < sides; j++) {
      const a = j / sides * TAU, ca = Math.cos(a), sa = Math.sin(a);
      b.v(ctr[0] + (e1[0] * ca + e2[0] * sa) * r, ctr[1] + (e1[1] * ca + e2[1] * sa) * r, ctr[2] + (e1[2] * ca + e2[2] * sa) * r, cu + ca * hu, cv + sa * hv, axis[0], axis[1], axis[2], col, 0);
    }
    for (let j = 0; j < sides; j++) b.tri(c0, first + j, first + (j + 1) % sides);
  }

  function logMesh(b, f, w) {
    const tx = Math.sin(f.yaw), tz = -Math.cos(f.yaw), l = f.len / 2;
    const ya = w.terrainH(f.x - tx * l, f.z - tz * l) + f.r - 0.06, yb = w.terrainH(f.x + tx * l, f.z + tz * l) + f.r - 0.06;
    const a = [f.x - tx * l, ya, f.z - tz * l], e = [f.x + tx * l, yb, f.z + tz * l];
    const uv = uvq(R.barkLog), vl = Math.min(1, f.len / 6);
    const sub = [uv[0], uv[3] - (uv[3] - uv[1]) * vl, uv[2], uv[3]];
    prism(b, [[a[0], a[1], a[2], f.r], [e[0], e[1], e[2], f.r * 0.82]], 6, sub, [0.92, 0.9, 0.86], () => 0, Math.min(ya, yb) - f.r, false);
    const ax = norm3([e[0] - a[0], e[1] - a[1], e[2] - a[2]]), e1 = norm3([-ax[2], 0, ax[0]]), e2 = [ax[1] * e1[2] - ax[2] * e1[1], ax[2] * e1[0] - ax[0] * e1[2], ax[0] * e1[1] - ax[1] * e1[0]];
    const end = uvq(R.logEnd), cc = [230, 220, 205, 255];
    capFan(b, a, [-ax[0], -ax[1], -ax[2]], e2, e1, f.r, 6, end, cc);
    capFan(b, e, ax, e1, e2, f.r * 0.82, 6, end, cc);
    const rnd = F.rng(f.seed);
    for (let i = 0; i < 2; i++) {
      const t = 0.25 + rnd() * 0.5, p = [a[0] + (e[0] - a[0]) * t, a[1] + (e[1] - a[1]) * t, a[2] + (e[2] - a[2]) * t], ang = rnd() * Math.PI - Math.PI / 2;
      const d = [e1[0] * Math.cos(ang) + e2[0] * Math.sin(ang) + ax[0] * 0.4, e1[1] * Math.cos(ang) + Math.abs(e2[1] * Math.sin(ang)) + 0.3, e1[2] * Math.cos(ang) + e2[2] * Math.sin(ang) + ax[2] * 0.4];
      const L = 0.4 + rnd() * 0.6;
      prism(b, [[p[0], p[1], p[2], f.r * 0.25], [p[0] + d[0] * L, p[1] + d[1] * L, p[2] + d[2] * L, f.r * 0.08]], 3, sub, [0.85, 0.82, 0.78], () => 0, p[1] - 1, false);
    }
  }

  function stump(b, f) {
    const uv = uvq(R.barkOak), y0 = f.y - 0.1, y1 = f.y + f.h;
    prism(b, [[f.x, y0, f.z, f.r * 1.15], [f.x, y1, f.z, f.r]], 7, [uv[0], uv[3] - (uv[3] - uv[1]) * 0.2, uv[2], uv[3]], [1, 1, 1], () => 0, y0 - 1.5, true);
    capFan(b, [f.x, y1, f.z], [0, 1, 0], [1, 0, 0], [0, 0, 1], f.r, 7, uvq(R.logEnd), [200, 190, 170, 255]);
    const rnd = F.rng(f.seed);
    for (let i = 0; i < 4; i++) {
      const a = f.yaw + i * TAU / 4 + rnd() * 0.5, L = f.r * (1.3 + rnd() * 0.8);
      prism(b, [[f.x + Math.cos(a) * f.r * 0.6, f.y + 0.12, f.z + Math.sin(a) * f.r * 0.6, f.r * 0.32], [f.x + Math.cos(a) * L, f.y - 0.12, f.z + Math.sin(a) * L, 0.04]], 3, uv, [0.9, 0.88, 0.85], () => 0, f.y - 1.5, false);
    }
  }

  function pile(b, f) {
    const tx = Math.sin(f.yaw), tz = -Math.cos(f.yaw), nx = -tz, nz = tx, l = f.len / 2, d = f.d / 2, y0 = f.y - 0.1, y1 = f.y + f.h, dt = d * 0.72;
    const P = (s, q, y) => [f.x + tx * s + nx * q, y, f.z + tz * s + nz * q];
    const side = uvq(R.pileSide), end = uvq(R.pileEnd), col = [235, 225, 210, 255];
    const quad = (p0, p1, p2, p3, uv, n) => {
      b.need(4, 6);
      const i0 = b.v(p0[0], p0[1], p0[2], uv[0], uv[3], n[0], n[1], n[2], col, 0), i1 = b.v(p1[0], p1[1], p1[2], uv[2], uv[3], n[0], n[1], n[2], col, 0);
      const i2 = b.v(p2[0], p2[1], p2[2], uv[2], uv[1], n[0], n[1], n[2], col, 0), i3 = b.v(p3[0], p3[1], p3[2], uv[0], uv[1], n[0], n[1], n[2], col, 0);
      b.tri(i0, i1, i2); b.tri(i0, i2, i3);
    };
    quad(P(-l, -d, y0), P(-l, d, y0), P(-l, dt, y1), P(-l, -dt, y1), end, [-tx, 0, -tz]);
    quad(P(l, d, y0), P(l, -d, y0), P(l, -dt, y1), P(l, dt, y1), end, [tx, 0, tz]);
    quad(P(l, -d, y0), P(-l, -d, y0), P(-l, -dt, y1), P(l, -dt, y1), side, norm3([-nx, 0.3, -nz]));
    quad(P(-l, d, y0), P(l, d, y0), P(l, dt, y1), P(-l, dt, y1), side, norm3([nx, 0.3, nz]));
    quad(P(-l, -dt, y1), P(-l, dt, y1), P(l, dt, y1), P(l, -dt, y1), side, [0, 1, 0]);
  }

  function anthill(b, f) {
    const uv = uvq(R.needles), r = f.w / 2, h = f.h, seg = 9, y0 = f.y - 0.05;
    b.need(seg * 2 + 2, seg * 9);
    const top = b.v(f.x, y0 + h, f.z, (uv[0] + uv[2]) / 2, (uv[1] + uv[3]) / 2, 0, 1, 0, [220, 200, 180, 255], 0);
    const ring = (k, rr, y, sh) => {
      const first = b.n;
      for (let j = 0; j < seg; j++) {
        const a = j / seg * TAU + f.yaw, ca = Math.cos(a), sa = Math.sin(a);
        const n = norm3([ca, 0.9 - k * 0.4, sa]);
        b.v(f.x + ca * rr, y, f.z + sa * rr, (uv[0] + uv[2]) / 2 + ca * (uv[2] - uv[0]) * 0.48 * (rr / r), (uv[1] + uv[3]) / 2 + sa * (uv[3] - uv[1]) * 0.48 * (rr / r), n[0], n[1], n[2], [c8(200 * sh), c8(185 * sh), c8(165 * sh), 255], 0);
      }
      return first;
    };
    const mid = ring(0, r * 0.6, y0 + h * 0.62, 0.95), out = ring(1, r, y0, 0.7);
    for (let j = 0; j < seg; j++) {
      const j1 = (j + 1) % seg;
      b.tri(top, mid + j1, mid + j);
      b.tri(mid + j, mid + j1, out + j1); b.tri(mid + j, out + j1, out + j);
    }
  }

  function decor(b, f, w) {
    if (f.type === 'rock') rock(b, f);
    else if (f.type === 'log') logMesh(b, f, w);
    else if (f.type === 'stump') stump(b, f);
    else if (f.type === 'pile') pile(b, f);
    else if (f.type === 'hedge') hedge(b, f);
    else if (f.type === 'bush' && f.kind === 'ant') anthill(b, f);
  }

  function tuft(b, x, y, z, kind, h, tint) {
    const T = TUFT[kind];
    if (!T) return;
    const r1 = F.hash2(Math.round(x * 31), Math.round(z * 31), 23), r2 = F.hash2(Math.round(x * 17), Math.round(z * 29), 29);
    const H = T.h[0] + (T.h[1] - T.h[0]) * r1 * h, Wd = T.w[0] + (T.w[1] - T.w[0]) * r2;
    const uv = uvq(R['g_' + kind + (r2 < 0.5 ? 0 : 1)]), yaw = r1 * Math.PI * 7, lean = (r2 - 0.5) * 0.3 * H;
    const sw = c8(255 * Math.min(1, 0.11 * H / 0.5 + 0.03));
    const cb = [c8(tint[0] * 0.62), c8(tint[1] * 0.62), c8(tint[2] * 0.62), 0], ct = [c8(tint[0]), c8(tint[1]), c8(tint[2]), sw];
    const lx = Math.cos(yaw * 1.3) * lean, lz = Math.sin(yaw * 1.3) * lean;
    for (let q = 0; q < 2; q++) {
      const a = yaw + q * Math.PI / 2, ux = Math.cos(a) * Wd / 2, uz = Math.sin(a) * Wd / 2;
      const nb = norm3([-Math.sin(a) * 0.3, 1, Math.cos(a) * 0.3]);
      b.need(4, 6);
      const i0 = b.v(x - ux, y - 0.05, z - uz, uv[0], uv[3], nb[0], nb[1], nb[2], cb, GRASS);
      const i1 = b.v(x + ux, y - 0.05, z + uz, uv[2], uv[3], nb[0], nb[1], nb[2], cb, GRASS);
      const i2 = b.v(x + ux + lx, y + H, z + uz + lz, uv[2], uv[1], 0, 1, 0, ct, GRASS);
      const i3 = b.v(x - ux + lx, y + H, z - uz + lz, uv[0], uv[1], 0, 1, 0, ct, GRASS);
      b.tri(i0, i1, i2); b.tri(i0, i2, i3);
    }
  }

  function bale(b, p) {
    const r = 0.75, l = 0.62, seg = 16;
    const wrap = !!p.wrap;
    const side = wrap ? [[226, 228, 222], [214, 218, 212]] : [[206, 176, 98], [194, 162, 86]];
    const cap = wrap ? [[204, 206, 200], [176, 180, 174]] : [[180, 146, 72], [140, 108, 50]];
    const A = (a, rr, x) => [x, r + Math.sin(a) * rr, Math.cos(a) * rr];
    const otri = (p0, p1, p2, col, out) => {
      const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      if (nx * out[0] + ny * out[1] + nz * out[2] >= 0) b.triangle(p0, p1, p2, col, 0); else b.triangle(p0, p2, p1, col, 0);
    };
    for (let j = 0; j < seg; j++) {
      const a0 = j / seg * TAU, a1 = (j + 1) / seg * TAU, c = side[j % 2], am = (a0 + a1) / 2;
      const out = [0, Math.sin(am), Math.cos(am)], col = [c[0], c[1], c[2], 255];
      otri(A(a0, r, -l), A(a1, r, -l), A(a1, r, l), col, out);
      otri(A(a0, r, -l), A(a1, r, l), A(a0, r, l), col, out);
      for (const s of [-1, 1]) {
        const cc = [cap[0][0], cap[0][1], cap[0][2], 255], ci = [cap[1][0], cap[1][1], cap[1][2], 255], x0 = s * l, x1 = s * (l + 0.012), o = [s, 0, 0];
        otri(A(a0, r, x0), A(a1, r, x0), A(a1, r * 0.5, x1), cc, o);
        otri(A(a0, r, x0), A(a1, r * 0.5, x1), A(a0, r * 0.5, x1), cc, o);
        otri(A(a0, r * 0.5, x1), A(a1, r * 0.5, x1), [s * (l + 0.02), r, 0], ci, o);
      }
    }
  }
  F.Models.PROPS.bale = (b, p) => bale(b, p);

  const leafCol = kind => (SP[kind] ? SP[kind].col : F.FLORA && F.FLORA.BUSH[kind] ? F.FLORA.BUSH[kind].leaf : [0.3, 0.45, 0.2]);

  let cardCv = null;

  function canvasOf(w, h) { return F.Tex.canvas(w, h); }

  function leafCard(x, r, o) {
    const rnd = F.rng(o.seed), X = r[0], Y = r[1], Wd = r[2], Hd = r[3];
    const cx = X + Wd * (o.cx || 0.5), cy = Y + Hd * (o.cy || 0.5), rx = Wd * (o.rx || 0.44), ry = Hd * (o.ry || 0.44);
    if (o.twig) {
      x.strokeStyle = o.twig; x.lineCap = 'round';
      for (let i = 0; i < (o.twigs || 7); i++) {
        const a = rnd() * TAU, d = 0.4 + rnd() * 0.5;
        x.lineWidth = 1 + rnd() * 1.5;
        x.beginPath(); x.moveTo(cx + (rnd() - 0.5) * rx * 0.3, Y + Hd * 0.96); x.quadraticCurveTo(cx + Math.cos(a) * rx * 0.3, cy + ry * 0.3, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d); x.stroke();
      }
    }
    const n = o.n || 700, [l0, l1] = o.len || [5, 9], [w0, w1] = o.wid || [3, 5];
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd());
      if (d > 0.82 && rnd() < 0.55) continue;
      let px = cx + Math.cos(a) * d * rx, py = cy + Math.sin(a) * d * ry;
      if (o.droop) py += d * d * ry * o.droop * (0.5 + 0.5 * Math.cos(a * 0.5));
      if (F.noise2(px / (o.hole || 11), py / (o.hole || 11), o.seed + 5) < (o.gaps || 0.3)) continue;
      const lit = 0.66 + 0.42 * (1 - (py - Y) / Hd) * 0.7 + 0.18 * (1 - (px - X) / Wd) - d * 0.14 + (rnd() - 0.5) * 0.22;
      const hue = (rnd() - 0.5) * (o.hue || 12);
      const col = o.col;
      x.fillStyle = `rgb(${c8(col[0] * lit + hue)},${c8(col[1] * lit + hue * 0.5)},${c8(col[2] * lit)})`;
      const L = l0 + rnd() * (l1 - l0), Wl = w0 + rnd() * (w1 - w0), ang = o.needle ? a + (rnd() - 0.5) * 0.6 : rnd() * Math.PI;
      if (o.needle) {
        x.strokeStyle = x.fillStyle; x.lineWidth = Wl; x.beginPath();
        x.moveTo(px, py); x.lineTo(px + Math.cos(ang) * L, py + Math.sin(ang) * L); x.stroke();
      } else {
        x.beginPath(); x.ellipse(px, py, L / 2, Wl / 2, ang, 0, TAU); x.fill();
      }
    }
    if (o.flowers) {
      const fl = o.flowers;
      for (let i = 0; i < fl.n; i++) {
        const a = rnd() * TAU, d = Math.sqrt(rnd()) * 0.85, px = cx + Math.cos(a) * d * rx, py = cy + Math.sin(a) * d * ry - ry * 0.1;
        const col = fl.cols[Math.floor(rnd() * fl.cols.length)];
        for (let k = 0; k < (fl.k || 6); k++) {
          x.fillStyle = `rgb(${c8(col[0] * (0.8 + rnd() * 0.3))},${c8(col[1] * (0.8 + rnd() * 0.3))},${c8(col[2] * (0.8 + rnd() * 0.3))})`;
          x.beginPath(); x.arc(px + (rnd() - 0.5) * fl.s, py - k * fl.s * (fl.spike || 0) + (rnd() - 0.5) * fl.s, fl.s * (0.35 + rnd() * 0.3), 0, TAU); x.fill();
        }
      }
    }
  }

  function spruceBranch(x, r, seed, core) {
    const rnd = F.rng(seed), X = r[0], Y = r[1], Wd = r[2], Hd = r[3];
    const needle = (px, py, ang, L, lit) => {
      x.strokeStyle = `rgb(${c8(38 * lit)},${c8(70 * lit)},${c8(50 * lit)})`;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(ang) * L, py + Math.sin(ang) * L); x.stroke();
    };
    const frond = (x0, y0, x1, y1, hang, lit0) => {
      x.strokeStyle = '#4a3a28'; x.lineWidth = 1.3; x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - 2, x1, y1); x.stroke();
      x.lineWidth = 1.3;
      const n = Math.max(8, Math.round(Math.hypot(x1 - x0, y1 - y0) * 1.6));
      for (let k = 0; k < n; k++) {
        const q = k / n, px = x0 + (x1 - x0) * q, py = y0 + (y1 - y0) * q - Math.sin(q * Math.PI) * 2;
        const hl = hang * (1 - q * 0.75), lit = lit0 * (0.75 + rnd() * 0.5);
        for (let j = 0; j < 3; j++) {
          const dy = rnd() * hl, dx = (rnd() - 0.5) * 3;
          needle(px + dx, py + dy, Math.PI / 2 + (rnd() - 0.5) * 1.2, 2.5 + rnd() * 3, lit * (1 - dy / (hl + 1) * 0.3));
        }
        needle(px, py, -Math.PI / 2 + (rnd() - 0.5) * 1.6, 2 + rnd() * 2.5, lit * 1.25);
      }
    };
    if (core) {
      const cx = X + Wd / 2, rows = 15;
      x.fillStyle = '#4a3a2c'; x.fillRect(cx - 1, Y + 4, 2, Hd - 6);
      for (let t = rows - 1; t >= 0; t--) {
        const q = t / (rows - 1), y = Y + 8 + q * (Hd - 18), half = (Wd / 2 - 4) * (0.1 + 0.9 * q);
        for (const sd of [-1, 1]) frond(cx, y, cx + sd * half * (0.8 + rnd() * 0.2), y + half * 0.22, 6 + q * 10, 0.75 + (1 - q) * 0.35);
      }
      return;
    }
    const by = Y + Hd * 0.3;
    for (let s = 0; s < 7; s++) {
      const q = s / 6, sy = by + q * Hd * 0.22, ex = X + Wd * (0.55 + 0.42 * (1 - q * 0.4)), ey = sy + Hd * (0.12 + 0.06 * q);
      frond(X + 2, sy, ex, ey, Hd * (0.55 - q * 0.18), 0.8 + (1 - q) * 0.4);
    }
    frond(X + 2, by - 4, X + Wd - 3, by + Hd * 0.2, Hd * 0.25, 1.25);
  }

  function pineTuft(x, r, seed) {
    const rnd = F.rng(seed), X = r[0], Y = r[1], Wd = r[2], Hd = r[3], cx = X + Wd / 2, cy = Y + Hd * 0.52;
    x.strokeStyle = '#7a5032'; x.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      const a = Math.PI + (i / 5) * Math.PI + (rnd() - 0.5) * 0.3;
      x.lineWidth = 1.6; x.beginPath(); x.moveTo(cx, Y + Hd * 0.8); x.quadraticCurveTo(cx + Math.cos(a) * Wd * 0.12, cy, cx + Math.cos(a) * Wd * 0.34, cy + Math.sin(a) * Hd * 0.22); x.stroke();
    }
    const balls = [];
    for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, d = Math.sqrt(rnd());
      balls.push([cx + Math.cos(a) * d * Wd * 0.38, cy + Math.sin(a) * d * Hd * 0.27, 7 + rnd() * 6]);
    }
    balls.sort((p, q) => q[1] - p[1]);
    x.lineWidth = 1.2;
    for (const [bx, by, br] of balls) {
      const top = 1 - (by - Y) / Hd;
      for (let k = 0; k < 34; k++) {
        const a = -Math.PI / 2 + (rnd() - 0.5) * 3.6, L = br * (0.45 + rnd() * 0.6), lit = 0.6 + top * 0.55 + rnd() * 0.3 - (a > 0 ? 0.15 : 0);
        x.strokeStyle = `rgb(${c8(50 * lit)},${c8(84 * lit)},${c8(66 * lit)})`;
        x.beginPath(); x.moveTo(bx, by); x.lineTo(bx + Math.cos(a) * L, by + Math.sin(a) * L * 0.8); x.stroke();
      }
    }
  }

  function curtain(x, r, seed) {
    const rnd = F.rng(seed), X = r[0], Y = r[1], Wd = r[2], Hd = r[3];
    for (let i = 0; i < 46; i++) {
      const sx = X + 3 + rnd() * (Wd - 6), len = Hd * (0.55 + rnd() * 0.43), sway = (rnd() - 0.5) * 8;
      x.strokeStyle = '#6a6040'; x.lineWidth = 0.8;
      x.beginPath(); x.moveTo(sx, Y + 2); x.quadraticCurveTo(sx + sway, Y + len * 0.5, sx + sway * 0.6, Y + len); x.stroke();
      for (let k = 0; k < len / 2.5; k++) {
        const t = k / (len / 2.5), px = sx + sway * (2 * t - t * t) * 0.6 + (rnd() - 0.5) * 2, py = Y + 2 + len * t;
        const lit = 0.75 + rnd() * 0.45 - t * 0.15;
        x.fillStyle = `rgb(${c8(122 * lit)},${c8(146 * lit)},${c8(84 * lit)})`;
        x.beginPath(); x.ellipse(px, py, 1.1, 3.2, (rnd() - 0.5) * 0.8, 0, TAU); x.fill();
      }
    }
  }

  function blades(x, r, o) {
    const rnd = F.rng(o.seed), X = r[0], Y = r[1], Wd = r[2], Hd = r[3];
    const n = o.n || 34;
    for (let i = 0; i < n; i++) {
      const bx = X + Wd * (0.5 + (rnd() - 0.5) * (o.spread || 0.7)), by = Y + Hd - 1;
      const hh = Hd * (o.h0 || 0.5) + rnd() * Hd * ((o.h1 || 0.95) - (o.h0 || 0.5));
      const lean = (bx - (X + Wd / 2)) * (o.fan || 0.9) + (rnd() - 0.5) * 14;
      const tx = bx + lean, ty = by - hh, w = (o.w || 2.6) * (0.7 + rnd() * 0.6);
      const g = x.createLinearGradient(0, by, 0, ty);
      const lit = 0.8 + rnd() * 0.4, c0 = o.c0, c1 = o.c1;
      g.addColorStop(0, `rgb(${c8(c0[0] * lit)},${c8(c0[1] * lit)},${c8(c0[2] * lit)})`);
      g.addColorStop(1, `rgb(${c8(c1[0] * lit)},${c8(c1[1] * lit)},${c8(c1[2] * lit)})`);
      x.fillStyle = g;
      const mx = bx + lean * 0.25, my = by - hh * 0.6;
      x.beginPath(); x.moveTo(bx - w / 2, by); x.quadraticCurveTo(mx - w / 4, my, tx, ty); x.quadraticCurveTo(mx + w / 4, my, bx + w / 2, by); x.fill();
      if (o.head && rnd() < o.head.p) {
        const hc = o.head.col;
        x.fillStyle = `rgb(${hc[0]},${hc[1]},${hc[2]})`;
        x.beginPath(); x.ellipse(tx, ty + 3, o.head.w || 1.5, o.head.l || 5, Math.atan2(tx - mx, my - ty) * 0.3, 0, TAU); x.fill();
      }
    }
  }

  function heads(x, r, seed, o) {
    const rnd = F.rng(seed), X = r[0], Y = r[1], Wd = r[2], Hd = r[3];
    for (let i = 0; i < o.n; i++) {
      const bx = X + Wd * (0.5 + (rnd() - 0.5) * 0.8), by = Y + Hd - 1, hy = Y + Hd * (1 - o.h0 - rnd() * (o.h1 - o.h0)), hx = bx + (rnd() - 0.5) * 12;
      x.strokeStyle = o.stem || '#4a7a30'; x.lineWidth = 1.2;
      x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx, (by + hy) / 2, hx, hy); x.stroke();
      o.draw(hx, hy, rnd);
    }
  }

  function grassCell(x, kind, v) {
    const r = R['g_' + kind + v], s = 300 + COVER.indexOf(kind) * 10 + v;
    const green = [[52, 84, 30], [118, 160, 62]], lawn = [[60, 98, 34], [132, 178, 70]];
    switch (kind) {
      case 'grass': blades(x, r, { seed: s, n: 42, c0: green[0], c1: green[1], h0: 0.45 + v * 0.1 }); break;
      case 'lawn': blades(x, r, { seed: s, n: 56, c0: lawn[0], c1: lawn[1], h0: 0.3, h1: 0.75, w: 2.2, spread: 0.85 }); break;
      case 'tall': blades(x, r, { seed: s, n: 34, c0: [62, 90, 34], c1: [140, 160, 70], h0: 0.6, h1: 1, head: { p: 0.35, col: [168, 150, 96], l: 6 } }); break;
      case 'dry': blades(x, r, { seed: s, n: 36, c0: [104, 96, 54], c1: [196, 178, 112], h0: 0.4, head: { p: 0.25, col: [188, 170, 120] } }); break;
      case 'daisy':
        blades(x, r, { seed: s, n: 30, c0: green[0], c1: green[1], h0: 0.3, h1: 0.7 });
        heads(x, r, s + 1, { n: 7 + v * 3, h0: 0.45, h1: 0.85, draw: (hx, hy) => { x.fillStyle = '#f4f2ea'; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; x.beginPath(); x.ellipse(hx + Math.cos(a) * 2.4, hy + Math.sin(a) * 2.4, 2.2, 1.1, a, 0, TAU); x.fill(); } x.fillStyle = '#e8c020'; x.beginPath(); x.arc(hx, hy, 1.7, 0, TAU); x.fill(); } });
        break;
      case 'yellow':
        blades(x, r, { seed: s, n: 34, c0: lawn[0], c1: lawn[1], h0: 0.3, h1: 0.65 });
        heads(x, r, s + 1, { n: 7 + v * 2, h0: 0.35, h1: 0.7, draw: (hx, hy, rnd) => { x.fillStyle = rnd() < 0.5 ? '#f2d21e' : '#f6c010'; x.beginPath(); x.arc(hx, hy, 2.6 + rnd(), 0, TAU); x.fill(); x.fillStyle = '#d8a010'; x.beginPath(); x.arc(hx, hy, 1, 0, TAU); x.fill(); } });
        break;
      case 'lupin': {
        blades(x, r, { seed: s, n: 16, c0: green[0], c1: [90, 130, 56], h0: 0.2, h1: 0.45, w: 3 });
        const cols = v ? [[200, 110, 170], [150, 90, 200], [236, 226, 240]] : [[122, 80, 196], [168, 120, 220], [208, 116, 168]];
        heads(x, r, s + 1, { n: 6, h0: 0.75, h1: 1, stem: '#3e6a2a', draw: (hx, hy, rnd) => { const c = cols[Math.floor(rnd() * cols.length)]; for (let k = 0; k < 9; k++) { const t = k / 8, lit = 0.75 + rnd() * 0.4; x.fillStyle = `rgb(${c8(c[0] * lit)},${c8(c[1] * lit)},${c8(c[2] * lit)})`; x.beginPath(); x.ellipse(hx + (rnd() - 0.5) * 2, hy + t * 20, 2.4 - t * 0.8, 1.7, 0, 0, TAU); x.fill(); } } });
        break;
      }
      case 'fern': {
        const rnd = F.rng(s), cx = r[0] + r[2] / 2, by = r[1] + r[3] - 1;
        for (let i = 0; i < 7; i++) {
          const a = -Math.PI / 2 + (i - 3) * 0.38 + (rnd() - 0.5) * 0.2, L = r[3] * (0.75 + rnd() * 0.25) * (1 - Math.abs(i - 3) * 0.08);
          let px = cx, py = by;
          for (let k = 0; k < 12; k++) {
            const t = k / 11, ang = a + t * t * (a + Math.PI / 2) * 0.9, step = L / 12;
            const nx = px + Math.cos(ang) * step * 1.4, ny = py + Math.sin(ang) * step;
            const lw = (1 - t) * 9 + 2, lit = 0.8 + rnd() * 0.35;
            x.strokeStyle = `rgb(${c8(70 * lit)},${c8(120 * lit)},${c8(40 * lit)})`; x.lineWidth = 1.6;
            for (const sd of [-1, 1]) { x.beginPath(); x.moveTo(nx, ny); x.lineTo(nx + Math.cos(ang + sd * 1.3) * lw, ny + Math.sin(ang + sd * 1.3) * lw * 0.6); x.stroke(); }
            x.strokeStyle = '#3e5a24'; x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(nx, ny); x.stroke();
            px = nx; py = ny;
          }
        }
        break;
      }
      case 'berry': {
        const rnd = F.rng(s);
        for (let i = 0; i < 9; i++) {
          const bx = r[0] + r[2] * (0.12 + 0.76 * rnd()), by = r[1] + r[3] - 1, top = r[1] + r[3] * (0.25 + rnd() * 0.3);
          x.strokeStyle = v ? '#6a4a40' : '#4a6a30'; x.lineWidth = 1.2;
          for (let k = 0; k < 3; k++) { const ex = bx + (rnd() - 0.5) * 18; x.beginPath(); x.moveTo(bx, by); x.quadraticCurveTo(bx, (by + top) / 2, ex, top + rnd() * 8); x.stroke(); }
          for (let k = 0; k < 22; k++) {
            const px = bx + (rnd() - 0.5) * 20, py = top + rnd() * (by - top) * 0.75, lit = 0.8 + rnd() * 0.45 - (py - top) / (by - top) * 0.3;
            x.fillStyle = v ? `rgb(${c8(104 * lit)},${c8(110 * lit)},${c8(62 * lit)})` : `rgb(${c8(70 * lit)},${c8(122 * lit)},${c8(48 * lit)})`;
            x.beginPath(); x.ellipse(px, py, 2.2, 1.4, rnd() * Math.PI, 0, TAU); x.fill();
          }
          for (let k = 0; k < (v ? 9 : 4); k++) {
            x.fillStyle = v ? (rnd() < 0.5 ? '#b070b0' : '#c890c8') : '#30306a';
            x.beginPath(); x.arc(bx + (rnd() - 0.5) * 16, top + rnd() * 10, v ? 1.6 : 1.4, 0, TAU); x.fill();
          }
        }
        break;
      }
      case 'reed':
        blades(x, r, { seed: s, n: 22, c0: [70, 96, 46], c1: [150, 160, 90], h0: 0.7, h1: 1, w: 2, fan: 0.4 });
        heads(x, r, s + 1, { n: 3 + v, h0: 0.82, h1: 0.97, stem: '#6a7a40', draw: (hx, hy) => { x.fillStyle = '#5a3a22'; x.beginPath(); x.ellipse(hx, hy + 6, 2.4, 7, 0, 0, TAU); x.fill(); } });
        break;
      case 'dune': blades(x, r, { seed: s, n: 38, c0: [96, 118, 96], c1: [178, 192, 150], h0: 0.6, h1: 1, w: 2, fan: 1.5 }); break;
      case 'nettle': {
        const rnd = F.rng(s);
        blades(x, r, { seed: s, n: 10, c0: green[0], c1: [80, 120, 50], h0: 0.2, h1: 0.4 });
        for (let i = 0; i < 4; i++) {
          const bx = r[0] + r[2] * (0.2 + 0.2 * i + (rnd() - 0.5) * 0.08), by = r[1] + r[3] - 1, top = r[1] + r[3] * (0.05 + rnd() * 0.15);
          x.strokeStyle = '#3a5a26'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(bx, by); x.lineTo(bx, top); x.stroke();
          for (let k = 0; k < 6; k++) {
            const py = by - (by - top) * (k / 6 + 0.1), sz = 6 - k * 0.6;
            for (const sd of [-1, 1]) {
              const lit = 0.75 + rnd() * 0.35;
              x.fillStyle = `rgb(${c8(46 * lit)},${c8(86 * lit)},${c8(36 * lit)})`;
              x.beginPath(); x.ellipse(bx + sd * sz * 0.9, py, sz, sz * 0.5, sd * 0.5, 0, TAU); x.fill();
            }
          }
        }
        break;
      }
      default: break;
    }
  }

  function pixelFill(img, r, fn) {
    const d = img.data, W = img.width;
    for (let y = 0; y < r[3]; y++) for (let x = 0; x < r[2]; x++) {
      const c = fn(x, y, x / r[2], y / r[3]), i = ((r[1] + y) * W + r[0] + x) * 4;
      d[i] = c8(c[0]); d[i + 1] = c8(c[1]); d[i + 2] = c8(c[2]); d[i + 3] = 255;
    }
  }

  function solidTextures(img) {
    const N = F.noise2, Hh = F.hash2;
    pixelFill(img, R.barkPine, (x, y, u, v) => {
      const up = F.smooth(0.62, 0.38, v), fur = N(x / 2.2, y / 16, 3) * 0.6 + N(x / 5, y / 40, 4) * 0.4, flake = N(x / 4, y / 6, 5);
      const low = [104 + fur * 52, 86 + fur * 40, 70 + fur * 32], hi = [182 + flake * 50, 108 + flake * 36, 60 + flake * 20];
      const crack = fur < 0.32 ? 0.55 : 1;
      return [(low[0] * crack) * (1 - up) + hi[0] * up, (low[1] * crack) * (1 - up) + hi[1] * up, (low[2] * crack) * (1 - up) + hi[2] * up];
    });
    pixelFill(img, R.barkBirch, (x, y, u, v) => {
      const base = 222 + N(x / 6, y / 30, 6) * 24, dash = Hh(Math.floor(x / 9), Math.floor(y / 4), 7) > 0.88 && N(x / 3, y / 2, 8) > 0.4;
      const dark = F.smooth(0.72, 0.98, v) * (N(x / 3, y / 10, 9) > 0.45 ? 1 : 0.4);
      const k = dash ? 0.22 : 1;
      const c = base * k * (1 - dark * 0.7);
      return [c, c * 0.98, c * 0.94];
    });
    const furrow = (cA, cB, sx, sy, seed) => (x, y) => { const f = N(x / sx, y / sy, seed) * 0.65 + N(x / (sx * 2.5), y / (sy * 2), seed + 1) * 0.35, k = f < 0.36 ? 0.6 : 1; return [(cA[0] + (cB[0] - cA[0]) * f) * k, (cA[1] + (cB[1] - cA[1]) * f) * k, (cA[2] + (cB[2] - cA[2]) * f) * k]; };
    pixelFill(img, R.barkOak, furrow([52, 44, 36], [112, 100, 86], 2, 14, 11));
    pixelFill(img, R.barkGrey, furrow([88, 84, 76], [138, 132, 120], 3, 24, 13));
    pixelFill(img, R.barkDark, furrow([46, 40, 34], [96, 86, 74], 2.5, 18, 15));
    pixelFill(img, R.barkLog, furrow([86, 78, 66], [150, 140, 122], 3, 20, 17));
    const granite = (seed, dark) => (x, y) => {
      const n = N(x / 14, y / 14, seed) * 0.6 + N(x / 5, y / 5, seed + 1) * 0.4, h = Hh(x, y, seed + 2);
      let c = dark ? [96 + n * 50, 98 + n * 48, 100 + n * 46] : [138 + n * 60, 126 + n * 52, 120 + n * 50];
      if (h < 0.06) c = c.map(q => q * 0.45); else if (h > 0.95) c = c.map(q => q * 1.25); else if (!dark && h > 0.86) c = [c[0] * 1.12, c[1] * 0.92, c[2] * 0.9];
      const li = N(x / 10, y / 10, seed + 3);
      if (li > 0.7) { const k = F.smooth(0.7, 0.8, li) * 0.6; c = [c[0] * (1 - k) + 178 * k, c[1] * (1 - k) + 182 * k, c[2] * (1 - k) + 138 * k]; }
      return c;
    };
    pixelFill(img, R.rock, granite(21, false));
    pixelFill(img, R.rockB, granite(31, true));
    pixelFill(img, R.needles, (x, y) => { const n = N(x / 3, y / 3, 41), h = Hh(x, y, 42); const k = 0.7 + n * 0.5 + (h > 0.8 ? 0.25 : 0); return [92 * k, 68 * k, 44 * k]; });
    pixelFill(img, R.white, () => [255, 255, 255]);
    pixelFill(img, R.straw, (x, y) => { const s = N(x / 30, y / 1.5, 51) * 0.6 + N(x / 6, y / 1, 52) * 0.4; return [168 + s * 70, 138 + s * 60, 62 + s * 40]; });
    pixelFill(img, R.baleEnd, (x, y) => { const dx = x - 32, dy = y - 32, rr = Math.hypot(dx, dy), a = Math.atan2(dy, dx), sp = Math.sin(rr * 0.9 - a * 1); const s = 0.75 + sp * 0.18 + N(x / 2, y / 2, 53) * 0.2; return [190 * s, 156 * s, 78 * s]; });
    pixelFill(img, R.logEnd, (x, y) => { const dx = x - 32, dy = y - 32, rr = Math.hypot(dx, dy), ring = 0.85 + 0.15 * Math.sin(rr * 1.6 + N(x / 6, y / 6, 54) * 3); if (rr > 29) return [70, 56, 42]; const c = rr < 3 ? 0.8 : ring; return [210 * c, 176 * c, 130 * c]; });
    pixelFill(img, R.pileEnd, (x, y) => {
      const rr = 7.5, row = Math.floor(y / (rr * 1.75)), off = row % 2 ? rr : 0, cxx = Math.floor((x - off) / (rr * 2)) * rr * 2 + rr + off, cyy = row * rr * 1.75 + rr;
      const d = Math.hypot(x - cxx, y - cyy) / (rr * (0.82 + 0.18 * Hh(Math.floor(cxx), row, 55)));
      if (d > 1) return [40, 32, 24];
      if (d > 0.84) return [92, 70, 50];
      const ring = 0.86 + 0.14 * Math.sin(d * 18);
      return [214 * ring, 178 * ring, 128 * ring];
    });
    pixelFill(img, R.pileSide, (x, y) => { const band = (y % 13) / 13, edge = band < 0.12 || band > 0.9 ? 0.45 : 1, f = N(x / 3, y / 12, 56); return [(84 + f * 50) * edge, (72 + f * 40) * edge, (58 + f * 30) * edge]; });
  }

  function paintCards() {
    if (cardCv) return cardCv;
    const c = canvasOf(SZ, SZ), x = c.getContext('2d');
    const broad = (name, seed, col, o = {}) => leafCard(x, R[name], Object.assign({ seed, col, twig: '#4a3a2a' }, o));
    broad('linden', 101, [70, 116, 48], { n: 820, len: [6, 9], wid: [4, 6] });
    broad('oak', 102, [66, 104, 40], { n: 700, len: [6, 10], wid: [3, 5], gaps: 0.36, hole: 9 });
    broad('birch', 103, [116, 158, 62], { n: 620, len: [4, 6], wid: [3, 4], droop: 0.6, gaps: 0.36, rx: 0.42, twig: '#6a5a4a' });
    broad('maple', 104, [92, 140, 52], { n: 640, len: [7, 11], wid: [6, 9], gaps: 0.3 });
    broad('chestnut', 105, [58, 100, 40], { n: 560, len: [10, 15], wid: [4, 6], gaps: 0.26 });
    broad('apple', 106, [82, 124, 50], { n: 640, len: [5, 8], wid: [3, 5], flowers: { n: 22, cols: [[200, 40, 30], [216, 180, 40], [190, 60, 30]], s: 3, k: 1 } });
    broad('willow', 107, [118, 142, 82], { n: 900, len: [6, 10], wid: [1.5, 2.5], droop: 0.8, hue: 8 });
    broad('poplar', 108, [72, 112, 52], { n: 760, len: [5, 8], wid: [4, 6], rx: 0.4, ry: 0.46 });
    pineTuft(x, R.pineA, 109);
    pineTuft(x, R.pineB, 110);
    spruceBranch(x, R.spruce, 111, false);
    spruceBranch(x, R.spruceCore, 112, true);
    leafCard(x, R.juniper, { seed: 113, col: [52, 84, 68], n: 1300, len: [3, 6], wid: [1, 1.6], needle: true, gaps: 0.2, rx: 0.4, ry: 0.46, flowers: { n: 16, cols: [[60, 70, 110]], s: 1.6, k: 1 } });
    broad('hazel', 114, [76, 120, 50], { n: 560, len: [8, 12], wid: [6, 9], gaps: 0.26 });
    broad('lilac', 115, [62, 104, 46], { n: 620, len: [6, 10], wid: [4, 7], flowers: { n: 14, cols: [[170, 120, 200], [150, 100, 186], [200, 170, 220]], s: 2.4, k: 7, spike: 0.5 } });
    broad('jasmine', 116, [74, 116, 50], { n: 620, len: [5, 8], wid: [3, 5], flowers: { n: 40, cols: [[246, 244, 236], [236, 234, 220]], s: 2.4, k: 2 } });
    broad('rose', 117, [70, 110, 46], { n: 560, len: [4, 6], wid: [3, 4], gaps: 0.34, flowers: { n: 26, cols: [[230, 130, 160], [240, 170, 190], [200, 40, 40]], s: 2.8, k: 1 } });
    broad('wshrub', 118, [120, 138, 98], { n: 800, len: [6, 9], wid: [2, 3], gaps: 0.3, hue: 6 });
    leafCard(x, R.hedge, { seed: 119, col: [62, 102, 44], n: 2600, len: [4, 6], wid: [3, 4], rx: 0.62, ry: 0.62, gaps: 0.05 });
    curtain(x, R.curtain, 120);
    for (const k of COVER) for (const v of [0, 1]) grassCell(x, k, v);
    const img = x.getImageData(0, 0, SZ, SZ);
    solidTextures(img);
    x.putImageData(img, 0, 0);
    cardCv = c;
    return c;
  }

  function finishAtlas(cv, regions) {
    const x = cv.getContext('2d'), img = x.getImageData(0, 0, cv.width, cv.height), d = img.data, W = cv.width;
    for (const name of Object.keys(regions)) {
      const r = regions[name];
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let y = r[1]; y < r[1] + r[3]; y++) for (let k = r[0]; k < r[0] + r[2]; k++) {
        const i = (y * W + k) * 4;
        if (d[i + 3] >= 110) { sr += d[i]; sg += d[i + 1]; sb += d[i + 2]; n++; }
      }
      const ar = n ? sr / n : 80, ag = n ? sg / n : 110, ab = n ? sb / n : 60;
      for (let y = r[1]; y < r[1] + r[3]; y++) for (let k = r[0]; k < r[0] + r[2]; k++) {
        const i = (y * W + k) * 4;
        if (d[i + 3] >= 110) d[i + 3] = 255;
        else { d[i] = ar; d[i + 1] = ag; d[i + 2] = ab; d[i + 3] = 0; }
      }
    }
    return img;
  }

  function paintFlora() {
    const cv = paintCards(), copy = canvasOf(SZ, SZ);
    copy.getContext('2d').drawImage(cv, 0, 0);
    return finishAtlas(copy, R);
  }

  function drawCard(x, tmp, src, r, dx, dy, dw, dh, ang, dark) {
    const t = tmp.getContext('2d');
    t.globalCompositeOperation = 'source-over';
    t.clearRect(0, 0, tmp.width, tmp.height);
    t.drawImage(src, r[0], r[1], r[2], r[3], 0, 0, tmp.width, tmp.height);
    if (dark < 1) { t.globalCompositeOperation = 'source-atop'; t.fillStyle = `rgba(0,0,0,${(1 - dark).toFixed(3)})`; t.fillRect(0, 0, tmp.width, tmp.height); }
    x.save(); x.translate(dx, dy); x.rotate(ang); x.drawImage(tmp, -dw / 2, -dh / 2, dw, dh); x.restore();
  }

  function paintImpostor(x, tmp, src, r, sk, sp, leafNames, Hc) {
    const pxm = r[3] / Hc, X0 = r[0] + r[2] / 2, Y0 = r[1] + r[3];
    const SX = v => X0 + v * pxm, SY = v => Y0 - v * pxm;
    x.save(); x.beginPath(); x.rect(r[0], r[1], r[2], r[3]); x.clip();
    const bark = R[sp.bark || 'barkGrey'];
    for (const tr of sk.trunks) {
      for (let i = 0; i + 1 < tr.length; i++) {
        const a = tr[i], b = tr[i + 1];
        x.save(); x.beginPath();
        x.moveTo(SX(a[0] - a[3]), SY(a[1])); x.lineTo(SX(a[0] + a[3]), SY(a[1])); x.lineTo(SX(b[0] + b[3]), SY(b[1])); x.lineTo(SX(b[0] - b[3]), SY(b[1])); x.closePath(); x.clip();
        x.drawImage(src, bark[0], bark[1], bark[2], bark[3], SX(Math.min(a[0], b[0]) - a[3]) - 1, SY(tr[tr.length - 1][1]), Math.max(2, a[3] * 2 * pxm + 2), (tr[tr.length - 1][1] - tr[0][1]) * pxm);
        x.restore();
      }
    }
    for (const l of sk.limbs) {
      x.strokeStyle = sp.bark === 'barkBirch' ? '#d8d4c8' : sp.bark === 'barkPine' ? '#a0603a' : '#5a4a3a'; x.lineWidth = Math.max(1, l[2] * 2 * pxm); x.lineCap = 'round';
      x.beginPath(); x.moveTo(SX(l[0][0]), SY(l[0][1])); x.lineTo(SX(l[1][0]), SY(l[1][1])); x.stroke();
    }
    const items = [];
    for (const p of sk.puffs) items.push({ z: p.z, f: () => { const S = p.S * pxm; drawCard(x, tmp, src, R[leafNames[p.leaf % leafNames.length]], SX(p.x), SY(p.y), S, S, (p.yaw % 1) - 0.5, p.ao * (0.92 + 0.08 * Math.sin(p.yaw * 7))); } });
    for (const k of sk.cores) items.push({ z: 0.1, f: () => drawCard(x, tmp, src, R.spruceCore, SX(0), SY((k.y0 + k.y1) / 2), k.w * pxm, (k.y1 - k.y0) * pxm, 0, 0.85) });
    for (const t of sk.tiers) items.push({ z: Math.sin(t.a) * t.r, f: () => {
      const cx = Math.cos(t.a) * t.r, w = Math.abs(cx) * pxm;
      if (w < 2) return;
      const t2 = tmp.getContext('2d'); t2.globalCompositeOperation = 'source-over'; t2.clearRect(0, 0, tmp.width, tmp.height); t2.drawImage(src, R.spruce[0], R.spruce[1], R.spruce[2], R.spruce[3], 0, 0, tmp.width, tmp.height);
      t2.globalCompositeOperation = 'source-atop'; t2.fillStyle = `rgba(0,0,0,${(1 - t.ao).toFixed(3)})`; t2.fillRect(0, 0, tmp.width, tmp.height);
      x.save(); x.translate(SX(t.x), SY(t.y + t.hb * 0.36)); x.scale(cx < 0 ? -1 : 1, 1); x.transform(1, t.droop, 0, 1, 0, 0);
      x.drawImage(tmp, 0, 0, w, t.hb * pxm); x.restore();
    } });
    for (const cu of sk.curtains) items.push({ z: Math.sin(cu.a) * cu.R, f: () => drawCard(x, tmp, src, R.curtain, SX((sk.crown ? sk.crown.x : 0) + Math.cos(cu.a) * cu.R), SY((cu.y0 + cu.y1) / 2), cu.w * pxm * Math.max(0.4, Math.abs(Math.sin(cu.a))), (cu.y1 - cu.y0) * pxm, 0, 0.9) });
    items.sort((a, b) => b.z - a.z);
    for (const it of items) it.f();
    x.restore();
  }

  function paintFar() {
    const src = paintCards(), c = canvasOf(SZ, SZ), x = c.getContext('2d'), tmp = canvasOf(128, 128);
    for (const kind of Object.keys(SP)) {
      const sp = SP[kind];
      for (const v of [0, 1]) {
        const r = RF[kind + v];
        const sk = skeleton(kind, sp.h, sp.w, v ? 7919 : 104729);
        paintImpostor(x, tmp, src, r, sk, sp, sp.leaf, sp.h * PAD);
      }
    }
    for (const kind of Object.keys(BUSHES)) {
      const B = BUSHES[kind], r = RF['b_' + kind];
      const sk = bushSkeleton(kind, B.ch, B.cw, 4242);
      paintImpostor(x, tmp, src, r, sk, { bark: kind === 'sapling' ? 'barkBirch' : 'barkGrey' }, [B.leaf], Math.max(B.ch, B.cw) * 1.08);
    }
    return finishAtlas(c, RF);
  }

  function paintLeaf() {
    const c = canvasOf(32, 32), x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.beginPath(); x.ellipse(16, 16, 12, 6, 0.6, 0, TAU); x.fill();
    x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 1; x.beginPath(); x.moveTo(7, 10); x.lineTo(25, 22); x.stroke();
    return c;
  }

  function coverageMips(img, regions) {
    const levels = [img], targets = regions.map(r => cover(img, r, 1));
    let src = img, scale = 1;
    while (src.width > 1 || src.height > 1) {
      const w = Math.max(1, src.width >> 1), h = Math.max(1, src.height >> 1), dst = new ImageData(w, h), s = src.data, o = dst.data, SW = src.width;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i0 = ((y * 2) * SW + x * 2) * 4, i1 = i0 + (src.width > 1 ? 4 : 0), i2 = i0 + (src.height > 1 ? SW * 4 : 0), i3 = i2 + (src.width > 1 ? 4 : 0), j = (y * w + x) * 4;
        for (let k = 0; k < 4; k++) o[j + k] = (s[i0 + k] + s[i1 + k] + s[i2 + k] + s[i3 + k] + 2) >> 2;
      }
      scale *= 2;
      regions.forEach((r, ri) => {
        const q = [Math.floor(r[0] / scale), Math.floor(r[1] / scale), Math.max(1, Math.floor(r[2] / scale)), Math.max(1, Math.floor(r[3] / scale))];
        if (q[2] < 2 || q[3] < 2 || targets[ri] <= 0 || targets[ri] >= 1) return;
        let lo = 0.5, hi = 6;
        for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2; if (cover(dst, q, m) < targets[ri]) lo = m; else hi = m; }
        const k = (lo + hi) / 2;
        for (let y = q[1]; y < q[1] + q[3]; y++) for (let x = q[0]; x < q[0] + q[2]; x++) { const i = (y * w + x) * 4 + 3; o[i] = Math.min(255, Math.round(o[i] * k)); }
      });
      levels.push(dst);
      src = dst;
    }
    return levels;
  }

  function cover(img, r, k) {
    const d = img.data, W = img.width;
    let n = 0, t = 0;
    for (let y = r[1]; y < r[1] + r[3]; y++) for (let x = r[0]; x < r[0] + r[2]; x++) { t++; if (d[(y * W + x) * 4 + 3] * k >= 127.5) n++; }
    return t ? n / t : 0;
  }

  F.Tex.register('flora', paintFlora, { alpha: true, clamp: true, mips: img => coverageMips(img, Object.values(R)) });
  F.Tex.register('florafar', paintFar, { alpha: true, clamp: true, mips: img => coverageMips(img, Object.values(RF)) });
  F.Tex.register('leaf', paintLeaf, { alpha: true, clamp: true });

  F.Trees = { R, RF, SP, BUSHES, TUFT, COVER, WHITE, inst, skeleton, bushSkeleton, treeNear, treeFar, bushNear, bushFar, decor, tuft, leafCol, size: SZ };
})(globalThis.Forza = globalThis.Forza || {});
