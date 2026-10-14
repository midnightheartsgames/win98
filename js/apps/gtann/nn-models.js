(function (N) {
  'use strict';

  const K = N.KIND;
  const T = n => N.TEX[n];
  const rgb = N.rgb;
  const W = [255, 255, 255, 255];
  const LK = { HEAD: 20, TAIL: 21, BLUE: 22, RED: 23, TAXI: 24, REV: 25, INDL: 26, INDR: 27, PLATE: 28, DASH: 29 };
  N.LAMPKIND = LK;
  const LAMP_COL = { [LK.HEAD]: [255, 250, 225, 255], [LK.TAIL]: [230, 40, 30, 255], [LK.REV]: [255, 255, 250, 255], [LK.INDL]: [255, 140, 20, 255], [LK.INDR]: [255, 140, 20, 255], [LK.PLATE]: [255, 255, 240, 255] };
  const LAMP_NAME = { [LK.HEAD]: 'head', [LK.TAIL]: 'tail', [LK.REV]: 'rev', [LK.INDL]: 'ind', [LK.INDR]: 'ind' };
  const PLATE_W = 0.52, PLATE_H = 0.112;

  function wheelMesh() {
    const mb = new N.MB(256);
    const seg = 12;
    const hw = 0.36;
    mb.ensure(seg * 4 + 4, seg * 12);
    const base = mb.nv;
    for (let i = 0; i <= seg; i++) {
      const a = i / seg * Math.PI * 2;
      const y = Math.cos(a), z = Math.sin(a);
      mb.v(-hw, y, z, 0, y, z, i / seg * 4, 0, W, T('tire'), 0);
      mb.v(hw, y, z, 0, y, z, i / seg * 4, 1, W, T('tire'), 0);
    }
    for (let i = 0; i < seg; i++) { const a = base + i * 2; mb.tri(a, a + 2, a + 3); mb.tri(a, a + 3, a + 1); }
    for (const sx of [1, -1]) {
      const c = mb.v(sx * hw, 0, 0, sx, 0, 0, 0.5, 0.5, W, T(sx > 0 ? 'rim' : 'tire'), 0);
      const b2 = mb.nv;
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; mb.v(sx * hw, Math.cos(a) * 0.98, Math.sin(a) * 0.98, sx, 0, 0, 0.5 + Math.sin(a) * 0.5, 0.5 + Math.cos(a) * 0.5, W, T(sx > 0 ? 'rim' : 'tire'), 0); }
      for (let i = 0; i < seg; i++) mb.tri(c, b2 + i, b2 + i + 1);
    }
    return mb;
  }

  function lampAt(mb, parts, c, a, b, n, sh, kind) {
    shapeAt(mb, c, a, b, n, sh, LAMP_COL[kind], T('lamplens'), kind);
    if (parts && LAMP_NAME[kind]) parts.push({ k: LAMP_NAME[kind], side: c[0] < 0 ? -1 : 1, c, n });
  }

  function shapeAt(mb, c, a, b, n, sh, col, L, kind) {
    if (sh.r) {
      const seg = sh.seg || 14;
      mb.ensure(seg + 2, seg * 3);
      const base = mb.v(c[0], c[1], c[2], n[0], n[1], n[2], 0.5, 0.5, col, L, kind);
      for (let i = 0; i <= seg; i++) {
        const t = i / seg * Math.PI * 2, ca = Math.cos(t), sa = Math.sin(t);
        mb.v(c[0] + (a[0] * ca + b[0] * sa) * sh.r, c[1] + (a[1] * ca + b[1] * sa) * sh.r, c[2] + (a[2] * ca + b[2] * sa) * sh.r, n[0], n[1], n[2], 0.5 + ca * 0.5, 0.5 - sa * 0.5, col, L, kind);
      }
      for (let i = 0; i < seg; i++) mb.tri(base, base + 1 + i, base + 2 + i);
    } else {
      const p = (u, v) => [c[0] + a[0] * u + b[0] * v, c[1] + a[1] * u + b[1] * v, c[2] + a[2] * u + b[2] * v];
      const w = sh.w / 2, h = sh.h / 2;
      mb.quad([...p(-w, -h), ...p(w, -h), ...p(w, h), ...p(-w, h)], n, [0, 1, 1, 1, 1, 0, 0, 0], col, L, kind);
    }
  }

  function lampAnchors(parts, lift) {
    const groups = new Map();
    for (const q of parts) {
      const key = q.k + (q.n[2] < 0 ? 'F' : 'R') + q.side;
      if (!groups.has(key)) groups.set(key, { k: q.k, side: q.side, n: q.n, sum: [0, 0, 0], cnt: 0 });
      const g = groups.get(key);
      g.sum[0] += q.c[0]; g.sum[1] += q.c[1]; g.sum[2] += q.c[2]; g.cnt++;
    }
    return [...groups.values()].map(g => ({ k: g.k, side: g.side, n: g.n, p: [0, 1, 2].map(i => g.sum[i] / g.cnt + g.n[i] * lift) }));
  }

  const WEAR_LAYERS = ['carbody', 'chrome', 'trim', 'white', 'darkmetal'];
  function bakeWear(mbs, o) {
    const layers = new Set(WEAR_LAYERS.map(T));
    for (const m of mbs) for (let i = 0; i < m.nv; i++) {
      const b = i * 32, f = i * 8;
      if (!layers.has(m.u8[b + 28])) continue;
      const x = m.f[f], y = m.f[f + 1], z = m.f[f + 2];
      if (Math.abs(x) < o.hw - 0.12 && Math.abs(z) < o.L / 2 - 0.2 && y > o.clr + 0.08) continue;
      const low = 1 - N.smooth(o.belt - 0.25, o.belt, y);
      let g = 1 - N.smooth(o.clr + 0.05, o.belt + 0.05, y), ao = 1;
      for (const w of o.wz) {
        const d = Math.hypot(z - w, y - o.wr);
        g = Math.max(g, (1 - N.smooth(o.ra * 0.9, o.ra + 0.45, d)) * low);
        ao = Math.min(ao, N.lerp(0.6, 1, N.smooth(o.ra * 0.9, o.ra + 0.3, d)) * low + (1 - low));
      }
      m.u8[b + 31] = Math.round(255 * N.clamp(g, 0, 1));
      m.u8[b + 27] = Math.round(m.u8[b + 27] * ao);
    }
  }

  function plateMatrix(x, y, z, front) {
    const M = N.M3.euler(0, front ? Math.PI : 0, 0, x, y, z);
    const S = N.M3.mat();
    S[0] = PLATE_W; S[4] = PLATE_H; S[8] = 1;
    return N.M3.mul(M, S);
  }

  const PB = { PELVIS: 0, SPINE: 1, CHEST: 2, HEAD: 3, UAL: 4, FAL: 5, HANDL: 6, UAR: 7, FAR: 8, HANDR: 9, THL: 10, SHL: 11, FOOTL: 12, THR: 13, SHR: 14, FOOTR: 15 };
  N.PB = PB;
  const PIVOT = [[0, 0.98, 0], [0, 1.08, 0], [0, 1.25, 0], [0, 1.5, 0], [-0.2, 1.44, 0], [-0.2, 1.15, 0], [-0.2, 0.88, 0], [0.2, 1.44, 0], [0.2, 1.15, 0], [0.2, 0.88, 0], [-0.095, 0.94, 0], [-0.095, 0.51, 0], [-0.095, 0.085, 0], [0.095, 0.94, 0], [0.095, 0.51, 0], [0.095, 0.085, 0]];
  const PARENT = [-1, 0, 1, 2, 2, 4, 5, 2, 7, 8, 0, 10, 11, 0, 13, 14];
  N.PIVOT = PIVOT;
  N.PPARENT = PARENT;

  const shoulderK = look => (look.male === false ? 0.9 : 1) * (1 + ((look.fat || 1) - 1) * 0.6);
  const hipK = look => (look.male === false ? 1.08 : 1) * (1 + ((look.fat || 1) - 1) * 0.6);
  N.pedPivots = look => {
    const tall = look.tall || 1, sw = shoulderK(look), hw = hipK(look);
    return PIVOT.map((p, i) => [p[0] * (i >= PB.THL ? hw : sw), p[1] * tall, p[2]]);
  };

  const strHash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) | 0; return h >>> 0; };
  N.faceOf = look => {
    if (look.face !== undefined) return look.face;
    const h = strHash((look.skin || '') + (look.hair || '') + (look.top || '') + (look.pants || '') + (look.shoes || '') + (look.hat || ''));
    const set = look.male !== false ? (look.old ? [4, 5, 4] : [0, 1, 2, 3, 13, 15, 0, 1, 11]) : (look.old ? [8] : [6, 7, 12, 7]);
    return set[h % set.length];
  };

  const HEAD_R = [[1.555, 0.055, 0.06, -0.012], [1.585, 0.082, 0.092, -0.008], [1.625, 0.094, 0.106, -0.004], [1.675, 0.098, 0.112, 0], [1.72, 0.1, 0.112, 0.003], [1.76, 0.098, 0.108, 0.005], [1.8, 0.086, 0.096, 0.006], [1.83, 0.058, 0.066, 0.006], [1.845, 0.02, 0.025, 0.006]];
  const headAt = y => {
    const H = HEAD_R;
    if (y <= H[0][0]) return [H[0][1], H[0][2], H[0][3]];
    for (let i = 1; i < H.length; i++) {
      if (y <= H[i][0]) { const t = (y - H[i - 1][0]) / (H[i][0] - H[i - 1][0]); return [N.lerp(H[i - 1][1], H[i][1], t), N.lerp(H[i - 1][2], H[i][2], t), N.lerp(H[i - 1][3], H[i][3], t)]; }
    }
    return [0.01, 0.01, 0.006];
  };
  const HAIR_LOW = {
    short: [[0, 1.772], [0.55, 1.765], [0.95, 1.71], [1.6, 1.69], [2.2, 1.62], [3.2, 1.6]],
    long: [[0, 1.775], [0.6, 1.745], [1.0, 1.56], [1.6, 1.44], [3.2, 1.38]],
    bob: [[0, 1.772], [0.45, 1.738], [0.9, 1.6], [3.2, 1.585]],
    bun: [[0, 1.775], [0.6, 1.765], [1.0, 1.7], [1.7, 1.66], [3.2, 1.6]],
    bald: [[0, 1.75], [1.0, 1.72], [1.4, 1.67], [3.2, 1.62]],
    scarf: [[0, 1.79], [0.85, 1.58], [1.6, 1.52], [3.2, 1.48]]
  };
  const tab = (T0, a) => {
    for (let i = 1; i < T0.length; i++) if (a <= T0[i][0]) return N.lerp(T0[i - 1][1], T0[i][1], (a - T0[i - 1][0]) / (T0[i][0] - T0[i - 1][0]));
    return T0[T0.length - 1][1];
  };

  function buildPed(look, lod) {
    const lo = lod > 0;
    const mb = new N.MB(lo ? 600 : 2000);
    const bones = [];
    const tall = look.tall || 1, fat = look.fat || 1, fem = look.male === false;
    const piv = N.pedPivots(look);
    const sw = shoulderK(look);
    const seg = lo ? 6 : 10;
    const L = { skin: T('skin'), cloth: T('cloth'), leather: T('leather'), hair: T('hair'), stripes: T('stripes'), camo: T('camo'), palms: T('palms'), plaid: T('plaid'), face: T('face'), white: T('white') };
    const DK = K.SKIN;
    const sh = (c, k) => [Math.min(255, c[0] * k) | 0, Math.min(255, c[1] * k) | 0, Math.min(255, c[2] * k) | 0, 255];
    const skin = rgb(look.skin), hairC = rgb(look.hair), topC = rgb(look.top), pantsC = rgb(look.pants), shoesC = rgb(look.shoes);
    const tk = look.topKind;
    const camo = !!look.camo;
    const pat = camo ? 'camo' : look.stripesH ? 'stripes' : look.pattern === 'palms' ? 'palms' : null;
    const topL = look.leather ? L.leather : L.cloth;
    const cloth = (c, p) => ({ c, l: p ? L[p] : topL, k: p ? DK : 0 });
    const TOP = cloth(topC, pat), LOW = cloth(look.skirt && tk === 'dress' ? topC : pantsC, camo ? 'camo' : null), SKIN = { c: skin, l: L.skin, k: 0 };
    LOW.l = camo ? L.camo : L.cloth;
    const legCol = look.skirt && fem ? SKIN : LOW;
    const put = (bone, n0) => { for (let i = n0; i < mb.nv; i++) bones[i] = bone; };
    const box = (bone, x0, y0, z0, x1, y1, z1, c, layer, kind) => { const n0 = mb.nv; mb.box(x0, y0 * tall, z0, x1, y1 * tall, z1, { layer: layer === undefined ? L.cloth : layer, c, kind: kind || 0, bottom: true }); put(bone, n0); };
    const plate = (bone, pts, n, c, layer) => { const n0 = mb.nv; mb.quad(pts.map((v, i) => (i % 3 === 1 ? v * tall : v)), n, [0, 0, 1, 0, 1, 1, 0, 1], c, layer === undefined ? L.cloth : layer, 0); put(bone, n0); };
    const R = (y, rx, rz, b, m, o) => Object.assign({ y, x: 0, z: 0, rx, rz, b, c: m.c, l: m.l, k: m.k }, o || {});
    const tube = (rings, o) => {
      const n = o.seg || seg, a0 = o.a0 === undefined ? -Math.PI : o.a0, a1 = o.a1 === undefined ? Math.PI : o.a1;
      const base = mb.nv;
      mb.ensure(rings.length * (n + 1) + 2 * (n + 2), rings.length * n * 6 + n * 6 + 12);
      for (let j = 0; j < rings.length; j++) {
        const r = rings[j], rp = rings[Math.max(0, j - 1)], rn = rings[Math.min(rings.length - 1, j + 1)];
        const dy = rn.y - rp.y;
        const drdy = Math.abs(dy) > 1e-4 ? ((rn.rx + rn.rz) - (rp.rx + rp.rz)) / 2 / dy : 0;
        for (let k = 0; k <= n; k++) {
          const a = a0 + (a1 - a0) * k / n;
          const sa = Math.sin(a), ca = -Math.cos(a);
          let nx = sa / Math.max(0.01, r.rx), nz = ca / Math.max(0.01, r.rz);
          const l = Math.hypot(nx, nz) || 1;
          nx /= l; nz /= l;
          let ny = N.clamp(-drdy, -2, 2);
          const ln = Math.hypot(nx, ny, nz) || 1;
          const uv = o.uv ? o.uv(a, r) : [k / n * (o.ur || 2), r.y * (o.vs || 2.8)];
          const vi = mb.v(r.x + sa * r.rx, r.y * tall, r.z + ca * r.rz, nx / ln, ny / ln, nz / ln, uv[0], uv[1], r.c, r.l, r.k || 0);
          bones[vi] = r.b;
        }
      }
      for (let j = 0; j + 1 < rings.length; j++) for (let k = 0; k < n; k++) {
        const a = base + j * (n + 1) + k, b = a + n + 1;
        mb.tri(a, b, b + 1);
        mb.tri(a, b + 1, a + 1);
      }
      const cap = (j, down) => {
        const r = rings[j];
        const c = mb.v(r.x, r.y * tall, r.z, 0, down ? -1 : 1, 0, 0.5, 0.5, r.c, r.l, r.k || 0);
        bones[c] = r.b;
        for (let k = 0; k < n; k++) mb.tri(c, base + j * (n + 1) + k, base + j * (n + 1) + k + 1);
      };
      if (o.capBot) cap(0, true);
      if (o.capTop) cap(rings.length - 1, false);
    };
    const strip = (rings, s, dz, w, c) => {
      for (let j = 0; j + 1 < rings.length; j++) {
        const a = rings[j], b = rings[j + 1];
        const n0 = mb.nv;
        mb.quad([a.x + s * (a.rx + 0.003), a.y * tall, a.z + dz - w, a.x + s * (a.rx + 0.003), a.y * tall, a.z + dz + w, b.x + s * (b.rx + 0.003), b.y * tall, b.z + dz + w, b.x + s * (b.rx + 0.003), b.y * tall, b.z + dz - w], [s, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1], c, L.cloth, 0);
        bones[n0] = a.b; bones[n0 + 1] = a.b; bones[n0 + 2] = b.b; bones[n0 + 3] = b.b;
      }
    };
    const fw = 1 + (fat - 1) * 1.1, fz = 1 + (fat - 1) * 1.8;
    const TR = fem
      ? [[0.84, 0.15, 0.1, 0, 0], [0.93, 0.188, 0.122, 0.01, 0], [1.01, 0.172, 0.112, 0, 0], [1.1, 0.138 * fw, 0.098 * fz, 0, 1], [1.18, 0.148 * fw, 0.105 * fz, -0.005, 1], [1.27, 0.165, 0.125, -0.02, 2], [1.34, 0.17, 0.13, -0.022, 2], [1.42, 0.182, 0.106, -0.005, 2], [1.475, 0.15, 0.085, 0, 2], [1.51, 0.06, 0.058, 0, 2]]
      : [[0.84, 0.145, 0.1, 0, 0], [0.92, 0.172, 0.115, 0.005, 0], [1.0, 0.172 * fw, 0.114 * fz, 0, 0], [1.08, 0.168 * fw, 0.11 * fz, -0.006 * fz, 1], [1.17, 0.176 * fw, 0.115 * fz, -0.01 * fz, 1], [1.26, 0.188, 0.122, -0.01, 2], [1.35, 0.2, 0.126, -0.012, 2], [1.43, 0.208, 0.114, -0.005, 2], [1.485, 0.172, 0.094, 0, 2], [1.515, 0.072, 0.066, 0, 2]];
    const TB = [PB.PELVIS, PB.SPINE, PB.CHEST];
    const torsoAt = y => {
      if (y <= TR[0][0]) return { rx: TR[0][1] * sw, rz: TR[0][2], zc: TR[0][3] };
      for (let i = 1; i < TR.length; i++) if (y <= TR[i][0]) { const t = (y - TR[i - 1][0]) / (TR[i][0] - TR[i - 1][0]); return { rx: N.lerp(TR[i - 1][1], TR[i][1], t) * sw, rz: N.lerp(TR[i - 1][2], TR[i][2], t), zc: N.lerp(TR[i - 1][3], TR[i][3], t) }; }
      const q = TR[TR.length - 1];
      return { rx: q[1] * sw, rz: q[2], zc: q[3] };
    };
    const frontZ = y => { const q = torsoAt(y); return q.zc - q.rz - 0.004; };
    const hem = tk === 'top' ? 1.104 : tk === 'sweater' || tk === 'shirt' || tk === 'vest' ? 1.003 : tk === 'track' ? 0.97 : 0.9;
    const bare = tk === 'vest' || tk === 'top';
    const midriff = tk === 'top' && fem && !look.old;
    const torsoMat = y => {
      if (bare && y > 1.47) return SKIN;
      if (midriff && y >= 1.0 && y < 1.104) return SKIN;
      return y >= hem ? TOP : LOW;
    };
    const rings = [];
    for (const q of TR) {
      const m = torsoMat(q[0]);
      rings.push(R(q[0], q[1] * sw, q[2], TB[q[4]], m, { z: q[3] }));
      const yn = TR[TR.indexOf(q) + 1];
      if (yn) for (const cut of [hem, midriff ? 1.0 : -1, bare ? 1.47 : -1]) {
        if (cut > q[0] && cut < yn[0]) {
          const t = (cut - q[0]) / (yn[0] - q[0]);
          const rx = N.lerp(q[1], yn[1], t) * sw, rz = N.lerp(q[2], yn[2], t), zc = N.lerp(q[3], yn[3], t);
          const b = TB[t < 0.5 ? q[4] : yn[4]];
          rings.push(R(cut - 0.0005, rx, rz, b, torsoMat(cut - 0.001), { z: zc }));
          rings.push(R(cut + 0.0005, rx, rz, b, torsoMat(cut + 0.001), { z: zc }));
        }
      }
    }
    rings.sort((a, b) => a.y - b.y);
    tube(rings, { capBot: true, capTop: true, ur: pat === 'palms' ? 2 : 3, vs: pat === 'stripes' ? 2.8 : pat === 'palms' ? 1.6 : 1.4 });
    const hs = 1 + (fat - 1) * 0.5;
    tube([R(1.46, 0.058, 0.058, PB.HEAD, SKIN, { z: 0.005 }), R(1.6, 0.052, 0.055, PB.HEAD, SKIN, { z: -0.005 })], { seg: lo ? 5 : 8 });
    const fi = N.faceOf(look);
    const cu = (fi % 4) * 0.25, cv = Math.floor(fi / 4) * 0.25;
    const headRings = HEAD_R.map(h => ({ y: h[0], x: 0, z: h[3], rx: h[1] * hs, rz: h[2], b: PB.HEAD, c: skin, l: L.face, k: DK }));
    const backRings = headRings.map(r => Object.assign({}, r, { l: L.skin, k: 0 }));
    if (!lo) {
      tube(headRings, { seg: 6, a0: -Math.PI / 2, a1: Math.PI / 2, capBot: true, capTop: true, uv: (a, r) => [cu + (0.5 - a / Math.PI) * 0.25, cv + N.clamp((1.845 - r.y) / 0.29, 0, 1) * 0.25] });
      tube(backRings, { seg: 6, a0: Math.PI / 2, a1: Math.PI * 1.5, capBot: true, capTop: true });
      box(PB.HEAD, -0.011, 1.655, -0.133, 0.011, 1.703, -0.1, sh(skin, 0.97), L.skin);
      for (const s of [-1, 1]) box(PB.HEAD, s > 0 ? 0.09 * hs : -0.104 * hs, 1.665, -0.004, s > 0 ? 0.104 * hs : -0.09 * hs, 1.715, 0.02, sh(skin, 0.9), L.skin);
    } else {
      tube(backRings, { seg: 6, capBot: true, capTop: true });
      for (const s of [-1, 1]) box(PB.HEAD, s * 0.033 - 0.012, 1.705, -0.118, s * 0.033 + 0.012, 1.722, -0.1, [40, 30, 28, 255], L.skin);
    }
    const shell = (low, high, off, m, rowsY, n, hang) => {
      const base = mb.nv;
      const nn = n || (lo ? 6 : 12);
      for (let j = 0; j < rowsY.length; j++) {
        for (let k = 0; k <= nn; k++) {
          const a = -Math.PI + 2 * Math.PI * k / nn;
          const aa = Math.abs(a);
          const y = N.clamp(rowsY[j], low(aa), high(aa));
          let rx, rz, zc;
          if (y < 1.585 && hang) { const d = 1.585 - y; rx = 0.1 * hs + d * 0.12; rz = 0.112 + d * 0.22; zc = 0.012 + d * 0.16; } else { const h = headAt(y); rx = h[0] * hs; rz = h[1]; zc = h[2]; }
          const sa = Math.sin(a), ca = -Math.cos(a);
          const ny = N.clamp((y - 1.7) / 0.14, -0.3, 1.2);
          const ln = Math.hypot(sa, ny, ca) || 1;
          const vi = mb.v(sa * (rx + off), y * tall, zc + ca * (rz + off), sa / ln, ny / ln, ca / ln, k / nn * 2, y * 3, m.c, m.l, m.k || 0);
          bones[vi] = PB.HEAD;
        }
      }
      for (let j = 0; j + 1 < rowsY.length; j++) for (let k = 0; k < nn; k++) {
        const a = base + j * (nn + 1) + k, b = a + nn + 1;
        mb.tri(a, b, b + 1);
        mb.tri(a, b + 1, a + 1);
      }
      const top = mb.v(0, (rowsY[rowsY.length - 1] + off * 0.3) * tall, 0.006, 0, 1, 0, 0.5, 0.5, m.c, m.l, m.k || 0);
      bones[top] = PB.HEAD;
      const lastRow = base + (rowsY.length - 1) * (nn + 1);
      if (rowsY[rowsY.length - 1] >= 1.84) for (let k = 0; k < nn; k++) mb.tri(top, lastRow + k, lastRow + k + 1);
    };
    const HAIR = { c: hairC, l: L.hair, k: 0 };
    const hat = look.hat;
    const hsty = look.hairStyle || 'short';
    const rowsAll = lo ? [1.4, 1.55, 1.65, 1.75, 1.85] : [1.36, 1.44, 1.52, 1.585, 1.63, 1.68, 1.72, 1.76, 1.8, 1.83, 1.85];
    if (hat !== 'scarf' && hat !== 'helmet' && hat !== 'mask') {
      if (hsty === 'bald') {
        if (look.old) shell(aa => tab(HAIR_LOW.bald, aa), aa => (aa < 1.0 ? tab(HAIR_LOW.bald, aa) : 1.745), 0.006, HAIR, rowsAll.filter(y => y < 1.8));
      } else {
        const T0 = HAIR_LOW[hsty] || HAIR_LOW.short;
        shell(aa => tab(T0, aa), () => 1.86, hsty === 'long' || hsty === 'bob' ? 0.018 : 0.011, HAIR, rowsAll, 0, hsty === 'long' || hsty === 'bob');
        if (hsty === 'bun' && !lo) box(PB.HEAD, -0.045, 1.72, 0.1, 0.045, 1.81, 0.17, hairC, L.hair);
      }
    }
    if (hat === 'cap') {
      const C = { c: look.stripes ? [30, 30, 30, 255] : [60, 60, 70, 255], l: L.cloth, k: 0 };
      shell(() => 1.765, () => 1.87, 0.022, C, [1.765, 1.8, 1.84, 1.87]);
      box(PB.HEAD, -0.085, 1.765, -0.225, 0.085, 1.783, -0.1, sh(C.c, 0.85));
    }
    if (hat === 'furazhka') {
      tube([R(1.752, 0.112 * hs, 0.124, PB.HEAD, { c: [170, 30, 30, 255], l: L.cloth }, { z: 0.004 }), R(1.812, 0.11 * hs, 0.122, PB.HEAD, { c: [170, 30, 30, 255], l: L.cloth }, { z: 0.004 })], { seg: 12 });
      const CR = { c: [88, 96, 106, 255], l: L.cloth, k: 0 };
      tube([R(1.81, 0.112 * hs, 0.124, PB.HEAD, CR, { z: 0.004 }), R(1.86, 0.148, 0.158, PB.HEAD, CR, { z: 0.01 }), R(1.895, 0.152, 0.162, PB.HEAD, CR, { z: 0.01 }), R(1.9, 0.145, 0.155, PB.HEAD, CR, { z: 0.01 })], { seg: 12, capTop: true });
      box(PB.HEAD, -0.09, 1.752, -0.215, 0.09, 1.772, -0.105, [18, 18, 20, 255]);
      if (!lo) box(PB.HEAD, -0.014, 1.82, -0.136, 0.014, 1.85, -0.126, [220, 180, 60, 255]);
    }
    if (hat === 'mask') {
      const MK = { c: [26, 26, 28, 255], l: L.cloth, k: 0 };
      shell(aa => (aa < 1.05 ? 1.748 : 1.5), () => 1.88, 0.012, MK, [1.5, 1.6, 1.68, 1.748, 1.79, 1.83, 1.86, 1.88]);
      shell(() => 1.45, aa => (aa < 1.05 ? 1.686 : 1.5), 0.014, MK, [1.45, 1.52, 1.58, 1.63, 1.686]);
    }
    if (hat === 'helmet') {
      const C = { c: camo ? [70, 80, 55, 255] : [40, 44, 50, 255], l: camo ? L.camo : L.cloth, k: camo ? DK : 0 };
      shell(() => 1.69, () => 1.9, 0.034, C, [1.69, 1.74, 1.79, 1.84, 1.88, 1.9]);
    }
    if (hat === 'scarf') {
      shell(aa => tab(HAIR_LOW.scarf, aa), () => 1.86, 0.02, TOP.k ? { c: topC, l: L.cloth, k: 0 } : TOP, rowsAll, 0, true);
      if (!lo) box(PB.HEAD, -0.03, 1.47, 0.1, 0.03, 1.56, 0.16, sh(topC, 0.85));
    }
    if (look.glasses && !lo) {
      const fzE = -0.112 - 0.004;
      for (const s of [-1, 1]) box(PB.HEAD, s > 0 ? 0.01 : -0.054, 1.696, fzE - 0.008, s > 0 ? 0.054 : -0.01, 1.734, fzE, [14, 14, 16, 255], L.white);
      box(PB.HEAD, -0.01, 1.716, fzE - 0.006, 0.01, 1.724, fzE, [30, 30, 30, 255], L.white);
      for (const s of [-1, 1]) box(PB.HEAD, s * 0.101 - 0.004, 1.714, -0.11, s * 0.101 + 0.004, 1.722, 0.0, [30, 30, 30, 255], L.white);
    }
    const longSleeve = tk !== 'top' && tk !== 'vest' && tk !== 'shirt' && tk !== 'dress';
    const sleeveY = longSleeve ? 0.93 : tk === 'shirt' || (tk === 'dress' && !look.old) ? 1.285 : 1.47;
    for (const s of [-1, 1]) {
      const ua = s < 0 ? PB.UAL : PB.UAR, fa = ua + 1, hd = ua + 2;
      const px = piv[ua][0];
      const aw = (fem ? 0.88 : 1) * (1 + (fat - 1) * 0.7);
      const A = [[1.478, 0.034, ua], [1.455, 0.056, ua], [1.4, 0.065, ua], [1.29, 0.059, ua], [1.2, 0.054, ua], [1.12, 0.051, fa], [1.02, 0.048, fa], [0.935, 0.041, fa], [0.9, 0.033, fa], [0.875, 0.03, hd]];
      const ar = [];
      for (let i = 0; i < A.length; i++) {
        const [y, r, b] = A[i];
        const m = y >= sleeveY - 1e-3 ? TOP : SKIN;
        ar.push(R(y, r * aw, r * aw, b, m, { x: px }));
        const yn = A[i + 1];
        if (yn && sleeveY < y - 1e-3 && sleeveY > yn[0] + 1e-3) {
          const t = (y - sleeveY) / (y - yn[0]);
          const rr = N.lerp(r, yn[1], t) * aw, bb = t < 0.5 ? b : yn[2];
          ar.push(R(sleeveY, rr * 1.04, rr * 1.04, bb, TOP, { x: px }));
          ar.push(R(sleeveY - 0.001, rr * 0.86, rr * 0.86, bb, SKIN, { x: px }));
        }
      }
      tube(ar.slice().reverse(), { seg: lo ? 5 : 8, capTop: true, ur: 1, vs: pat === 'stripes' ? 2.8 : 1.4 });
      if (look.stripes && longSleeve && !lo) for (const dz of [-0.013, 0, 0.013]) strip(ar.filter(r => r.c === TOP.c && r.y > 0.94), s, dz, 0.004, [240, 240, 240, 255]);
      const hand = look.hat === 'helmet' ? [34, 34, 36, 255] : skin;
      if (!lo) {
        box(hd, px - 0.019, 0.8, -0.038, px + 0.019, 0.885, 0.034, hand, L.skin);
        box(hd, px - 0.017 - s * 0.006, 0.752, -0.036, px + 0.017 - s * 0.006, 0.805, 0.03, sh(hand, 0.95), L.skin);
        box(hd, s > 0 ? px - 0.032 : px + 0.008, 0.8, -0.066, s > 0 ? px - 0.008 : px + 0.032, 0.862, -0.036, hand, L.skin);
      } else box(hd, px - 0.02, 0.76, -0.04, px + 0.02, 0.88, 0.036, hand, L.skin);
    }
    for (const s of [-1, 1]) {
      const th = s < 0 ? PB.THL : PB.THR, sn = th + 1, ft = th + 2;
      const px = piv[th][0];
      const lw = (1 + (fat - 1) * 0.8) * (fem ? 0.95 : 1);
      const G = [[0.975, 0.095, 0.1, th, 0], [0.88, 0.098, 0.104, th, -0.006], [0.74, 0.085, 0.09, th, -0.01], [0.6, 0.071, 0.077, th, -0.006], [0.535, 0.064, 0.07, th, 0], [0.47, 0.063, 0.068, sn, 0], [0.38, 0.065, 0.073, sn, 0.012], [0.24, 0.051, 0.055, sn, 0.006], [0.12, 0.044, 0.049, sn, 0], [0.095, 0.044, 0.049, sn, 0]];
      const lr = G.map(([y, rx, rz, b, z]) => R(y, rx * lw, rz * lw, b, legCol, { x: px, z }));
      tube(lr.slice().reverse(), { seg: lo ? 5 : 8, capTop: true, capBot: true, ur: 1, vs: 1.2 });
      if (look.stripes && !look.skirt && !lo) for (const dz of [-0.014, 0, 0.014]) strip(lr.filter(r => r.y > 0.12), s, dz, 0.0045, [240, 240, 240, 255]);
      const sole = look.shoes === '#e8e8e8' || look.shoes === '#d8d4c8' ? [236, 236, 230, 255] : sh(shoesC, 0.6);
      const boot = camo || tk === 'uniform' && look.hat === 'helmet';
      if (!lo) {
        box(ft, px - 0.05, 0, -0.13, px + 0.05, boot ? 0.2 : 0.1, 0.065, shoesC, L.leather);
        box(ft, px - 0.045, 0, -0.205, px + 0.045, 0.075, -0.13, shoesC, L.leather);
        box(ft, px - 0.052, 0, -0.21, px + 0.052, 0.022, 0.07, sole, L.white);
      } else box(ft, px - 0.05, 0, -0.2, px + 0.05, 0.1, 0.065, shoesC, L.leather);
    }
    if (look.skirt) {
      const long = tk === 'dress' || look.old;
      const M = tk === 'dress' ? TOP : LOW;
      tube([R(1.0, 0.176 * sw, 0.122, PB.PELVIS, M), R(0.86, 0.205, 0.15, PB.PELVIS, M, { z: -0.005 }), R(long ? 0.56 : 0.68, long ? 0.245 : 0.215, long ? 0.19 : 0.16, PB.PELVIS, M, { z: -0.01 })], { seg: lo ? 6 : 12, vs: 1.4 });
    }
    if (tk === 'coat') {
      const M = { c: topC, l: L.cloth, k: 0 };
      tube([R(0.95, 0.185 * sw, 0.128, PB.PELVIS, M), R(0.75, 0.22, 0.16, PB.PELVIS, M, { z: -0.005 }), R(0.52, 0.245, 0.185, PB.PELVIS, { c: sh(topC, 0.9), l: L.cloth }, { z: -0.01 })], { seg: lo ? 6 : 12 });
    }
    if (!lo) {
      const F = (x, y) => [x, y, frontZ(y)];
      const V = (a, b, c, d, col, bone) => plate(bone || PB.CHEST, [].concat(F(a[0], a[1]), F(b[0], b[1]), F(c[0], c[1]), F(d[0], d[1])), [0, 0, -1], col);
      if (tk === 'jacket' || tk === 'suit' || tk === 'coat') {
        const shirt = tk === 'suit' ? [236, 236, 236, 255] : look.leather ? [220, 220, 215, 255] : tk === 'coat' ? sh(topC, 0.6) : [58, 60, 64, 255];
        V([-0.075, 1.485], [0.075, 1.485], [0.014, 1.25], [-0.014, 1.25], shirt);
        const lap = sh(topC, look.leather ? 1.25 : 0.72);
        for (const s of [-1, 1]) V([s * 0.075, 1.485], [s * 0.098, 1.475], [s * 0.03, 1.24], [s * 0.014, 1.25], lap);
        if (tk === 'suit') V([-0.013, 1.47], [0.013, 1.47], [0.018, 1.22], [-0.018, 1.22], look.glasses ? [24, 24, 28, 255] : [120, 24, 34, 255]);
        if (tk !== 'suit') for (const s of [-1, 1]) V([s * 0.06, 1.06], [s * 0.13, 1.06], [s * 0.13, 0.99], [s * 0.06, 0.99], sh(topC, 0.8), PB.PELVIS);
      }
      if (tk === 'track') {
        V([-0.006, 1.49], [0.006, 1.49], [0.006, 0.98], [-0.006, 0.98], [230, 230, 230, 255]);
        tube([R(1.47, 0.085, 0.078, PB.CHEST, TOP), R(1.53, 0.075, 0.07, PB.CHEST, TOP)], { seg: 10 });
      }
      if (tk === 'uniform') {
        const belt = look.belt ? [235, 235, 235, 255] : [52, 36, 24, 255];
        const q0 = torsoAt(1.05), q1 = torsoAt(1.1);
        tube([R(1.045, q0.rx + 0.007, q0.rz + 0.007, PB.SPINE, { c: belt, l: L.leather }, { z: q0.zc }), R(1.1, q1.rx + 0.007, q1.rz + 0.007, PB.SPINE, { c: belt, l: L.leather }, { z: q1.zc })], { seg: 12 });
        for (const s of [-1, 1]) box(PB.CHEST, s > 0 ? 0.09 : -0.19, 1.475, -0.04, s > 0 ? 0.19 : -0.09, 1.495, 0.04, sh(topC, 0.75));
        for (const y of [1.42, 1.34, 1.26, 1.18]) V([-0.008, y + 0.008], [0.008, y + 0.008], [0.008, y - 0.008], [-0.008, y - 0.008], [210, 180, 70, 255], y > 1.25 ? PB.CHEST : PB.SPINE);
        V([-0.13, 1.4], [-0.08, 1.4], [-0.08, 1.35], [-0.13, 1.35], [200, 170, 60, 255]);
      }
      if (tk === 'shirt') {
        V([-0.05, 1.49], [0.05, 1.49], [0, 1.39], [0, 1.39], skin);
        for (const s of [-1, 1]) V([s * 0.05, 1.495], [s * 0.1, 1.48], [s * 0.04, 1.42], [s * 0.012, 1.4], sh(topC, 0.9));
      }
      if (tk === 'sweater') { const q0 = torsoAt(1.0), q1 = torsoAt(1.05); tube([R(1.0, q0.rx + 0.004, q0.rz + 0.004, PB.PELVIS, { c: sh(topC, 0.82), l: L.cloth }, { z: q0.zc }), R(1.05, q1.rx + 0.004, q1.rz + 0.004, PB.SPINE, { c: sh(topC, 0.82), l: L.cloth }, { z: q1.zc })], { seg: 10 }); }
      if (bare) for (const s of [-1, 1]) V([s * 0.09, 1.49], [s * 0.12, 1.49], [s * 0.12, 1.45], [s * 0.09, 1.45], tk === 'vest' ? [236, 236, 240, 255] : topC);
      if (look.chain) {
        const g = [226, 186, 64, 255];
        V([-0.07, 1.48], [-0.055, 1.48], [-0.004, 1.36], [-0.016, 1.36], g);
        V([0.055, 1.48], [0.07, 1.48], [0.016, 1.36], [0.004, 1.36], g);
      }
      if (look.bag) {
        const bx = piv[PB.HANDL][0];
        if (look.bigBag) {
          box(PB.HANDL, bx - 0.12, 0.3, -0.28, bx + 0.1, 0.76, 0.28, [255, 255, 255, 255], L.plaid);
          box(PB.HANDL, bx - 0.012, 0.76, -0.05, bx + 0.012, 0.84, 0.05, [40, 40, 120, 255]);
        } else {
          box(PB.HANDL, bx - 0.05, 0.52, -0.13, bx + 0.04, 0.74, 0.12, [110, 70, 40, 255], L.leather);
          box(PB.HANDL, bx - 0.008, 0.74, -0.03, bx + 0.008, 0.82, 0.03, [70, 45, 25, 255], L.leather);
        }
      }
    }
    return { mb, bones: Uint8Array.from(bones), piv };
  }

  const PICK = {};
  function pickupMesh(k) {
    const key = k.type === 'weapon' ? 'w|' + k.weapon : k.type === 'item' ? 'i|' + k.item : k.type;
    if (PICK[key]) return PICK[key];
    const mb = new N.MB(64);
    const L = T('white');
    const box = (a, b, c, d, e, f, col) => mb.box(a, b, c, d, e, f, { layer: L, c: col });
    if (k.type === 'health') { box(-0.25, -0.18, -0.12, 0.25, 0.18, 0.12, [240, 240, 240, 255]); box(-0.05, -0.14, -0.125, 0.05, 0.14, 0.125, [220, 30, 30, 255]); box(-0.14, -0.05, -0.126, 0.14, 0.05, 0.126, [220, 30, 30, 255]); }
    else if (k.type === 'armor') { box(-0.24, -0.3, -0.1, 0.24, 0.3, 0.1, [50, 80, 150, 255]); box(-0.12, 0.2, -0.11, 0.12, 0.31, 0.11, [40, 60, 110, 255]); }
    else if (k.type === 'money') { box(-0.2, -0.05, -0.1, 0.2, 0.05, 0.1, [80, 160, 80, 255]); box(-0.2, 0.05, -0.1, 0.2, 0.1, 0.1, [100, 180, 100, 255]); }
    else if (k.type === 'bribe') { box(-0.22, -0.14, -0.02, 0.22, 0.14, 0.02, [230, 210, 130, 255]); box(-0.18, -0.02, -0.025, 0.18, 0.02, 0.025, [180, 40, 40, 255]); }
    else if (k.type === 'stash') { box(-0.12, -0.2, -0.12, 0.12, 0.16, 0.12, [140, 200, 160, 200]); box(-0.1, -0.12, -0.1, 0.1, 0.1, 0.1, [90, 160, 90, 255]); box(-0.13, 0.16, -0.13, 0.13, 0.22, 0.13, [180, 180, 180, 255]); }
    else if (k.type === 'weapon') {
      const G = N.WGRIP[k.weapon];
      const sc = Math.min(2.2, 1.25 / ((G && G.len) || 0.6));
      mb.append(N.Models.weapon(k.weapon), 0, 0.05, 0, 0, sc);
      for (const q of N.Models.wparts(k.weapon)) if (!q.hidden) mb.append(q.mb, q.at[0] * sc, 0.05 + q.at[1] * sc, q.at[2] * sc, 0, sc);
    }
    else if (k.type === 'item') {
      if (k.item === 'ledger') box(-0.18, -0.02, -0.25, 0.18, 0.04, 0.25, [40, 60, 120, 255]);
      else if (k.item === 'diary') { box(-0.11, -0.016, -0.15, 0.11, 0.016, 0.15, [96, 22, 30, 255]); box(-0.105, -0.012, -0.145, 0.1, 0.012, 0.15, [236, 230, 210, 255]); }
      else if (k.item === 'crate') { box(-0.4, 0, -0.25, 0.4, 0.42, 0.25, [86, 102, 62, 255]); box(-0.41, 0.14, -0.26, 0.41, 0.2, 0.26, [64, 76, 46, 255]); box(-0.06, 0.25, -0.255, 0.06, 0.33, -0.25, [230, 230, 220, 255]); }
      else if (k.item === 'cash') { box(-0.08, 0, -0.035, 0.08, 0.035, 0.035, [96, 140, 92, 255]); box(-0.081, 0.012, -0.012, 0.081, 0.024, 0.012, [236, 236, 228, 255]); }
      else if (k.item === 'case') { box(-0.3, -0.2, -0.06, 0.3, 0.2, 0.06, [30, 30, 30, 255]); box(-0.08, 0.2, -0.02, 0.08, 0.26, 0.02, [150, 150, 150, 255]); }
      else { box(-0.22, -0.16, -0.12, 0.22, 0.16, 0.12, [110, 70, 40, 255]); box(-0.1, 0.16, -0.02, 0.1, 0.24, 0.02, [80, 50, 30, 255]); }
    }
    PICK[key] = mb;
    return mb;
  }

  const CARS = new Map();
  const PEDS = new Map();
  const PLATES = new Map();
  let WHEEL = null;

  const bakeWheels = m => {
    const mb = new N.MB(1024);
    for (const w of m.wheels) mb.append(w.kind ? m.wheelKinds[w.kind] : m.wheel, w.x, w.y, w.z, w.sx < 0 ? Math.PI : 0, w.r);
    return mb;
  };

  N.CarKit = { LK, LAMP_COL, shapeAt, lampAt, lampAnchors, bakeWear, plateMatrix, PLATE_W, PLATE_H };

  N.Models = {
    car(model, livery, lod) {
      const spec = N.VEHICLES[model], lv = spec.type === 'bike' ? (lod ? 1 : 0) : lod || 0;
      const key = model + '|' + (livery || '') + '|' + lv;
      let m = CARS.get(key);
      if (!m) {
        m = N.Cars.build(spec, livery, lv);
        if (lv === 2) m.wheelsMb = bakeWheels(m);
        CARS.set(key, m);
      }
      return m;
    },
    wheel() { return WHEEL || (WHEEL = wheelMesh()); },
    ped(look, lod) {
      const key = (lod ? 'L' : 'H') + JSON.stringify(look);
      let m = PEDS.get(key);
      if (!m) { m = buildPed(look, lod || 0); PEDS.set(key, m); if (PEDS.size > 500) PEDS.delete(PEDS.keys().next().value); }
      return m;
    },
    pickup: pickupMesh,
    plate(key) {
      if (PLATES.has(key)) return PLATES.get(key);
      const uv = N.ATLAS_MAP && N.ATLAS_MAP[key];
      let mb = null;
      if (uv) {
        mb = new N.MB(4);
        mb.quad([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], [0, 0, 1], [uv[0], uv[3], uv[2], uv[3], uv[2], uv[1], uv[0], uv[1]], W, 0, K.ATLAS);
      }
      PLATES.set(key, mb);
      return mb;
    },
    clear() { CARS.clear(); PEDS.clear(); PLATES.clear(); }
  };

  const mat = () => new Float32Array(12);
  const mul = (a, b, o) => {
    const r = o || mat();
    const a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3], a4 = a[4], a5 = a[5], a6 = a[6], a7 = a[7], a8 = a[8], a9 = a[9], a10 = a[10], a11 = a[11];
    for (let c = 0; c < 3; c++) {
      const b0 = b[c], b1 = b[c + 3], b2 = b[c + 6];
      r[c] = a0 * b0 + a1 * b1 + a2 * b2;
      r[c + 3] = a3 * b0 + a4 * b1 + a5 * b2;
      r[c + 6] = a6 * b0 + a7 * b1 + a8 * b2;
    }
    r[9] = a0 * b[9] + a1 * b[10] + a2 * b[11] + a9;
    r[10] = a3 * b[9] + a4 * b[10] + a5 * b[11] + a10;
    r[11] = a6 * b[9] + a7 * b[10] + a8 * b[11] + a11;
    return r;
  };
  const euler = (rx, ry, rz, tx, ty, tz, o) => {
    const r = o || mat();
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    r[0] = cy * cz + sy * sx * sz; r[1] = -cy * sz + sy * sx * cz; r[2] = sy * cx;
    r[3] = cx * sz; r[4] = cx * cz; r[5] = -sx;
    r[6] = -sy * cz + cy * sx * sz; r[7] = sy * sz + cy * sx * cz; r[8] = cy * cx;
    r[9] = tx; r[10] = ty; r[11] = tz;
    return r;
  };
  N.M3 = { mat, mul, euler };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
