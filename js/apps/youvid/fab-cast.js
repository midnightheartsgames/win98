(function () {
  const { M4, V3, rgb, shade } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh } = K;
  const Rig = window.YouVidRig;

  const TEAMS = {
    red: { cloth: 0xa83b31, dark: 0x7d2b25, hi: 0xc04c40, suit: 0x6c3429, suitDk: 0x51261f, mask: 0x7b3a2d, glove: 0x9b3329, pale: 0xd9a487 },
    blu: { cloth: 0x557d9f, dark: 0x3c5c7b, hi: 0x6a93b5, suit: 0x313f57, suitDk: 0x252f43, mask: 0x34465f, glove: 0x48709a, pale: 0x9cb2ca }
  };

  const D = {
    heavy: { chestY: 0.14, neckY: 0.56, headY: 0.115, shX: 0.31, shY: 0.47, upper: 0.33, fore: 0.33, hipX: 0.15, hipY: -0.06, thigh: 0.42, shin: 0.42 },
    scout: { chestY: 0.1, neckY: 0.42, headY: 0.135, shX: 0.19, shY: 0.33, upper: 0.28, fore: 0.27, hipX: 0.1, hipY: -0.05, thigh: 0.45, shin: 0.44 },
    soldier: { chestY: 0.11, neckY: 0.47, headY: 0.135, shX: 0.24, shY: 0.38, upper: 0.3, fore: 0.29, hipX: 0.12, hipY: -0.05, thigh: 0.45, shin: 0.44 },
    pyro: { chestY: 0.1, neckY: 0.45, headY: 0.135, shX: 0.22, shY: 0.36, upper: 0.29, fore: 0.28, hipX: 0.12, hipY: -0.05, thigh: 0.44, shin: 0.43 },
    demo: { chestY: 0.1, neckY: 0.44, headY: 0.135, shX: 0.23, shY: 0.36, upper: 0.29, fore: 0.28, hipX: 0.12, hipY: -0.05, thigh: 0.43, shin: 0.42 },
    engineer: { chestY: 0.1, neckY: 0.42, headY: 0.135, shX: 0.22, shY: 0.33, upper: 0.27, fore: 0.27, hipX: 0.12, hipY: -0.05, thigh: 0.39, shin: 0.38 },
    medic: { chestY: 0.11, neckY: 0.46, headY: 0.135, shX: 0.21, shY: 0.37, upper: 0.3, fore: 0.28, hipX: 0.11, hipY: -0.05, thigh: 0.46, shin: 0.45 },
    sniper: { chestY: 0.12, neckY: 0.47, headY: 0.135, shX: 0.21, shY: 0.37, upper: 0.32, fore: 0.3, hipX: 0.11, hipY: -0.05, thigh: 0.49, shin: 0.48 },
    spy: { chestY: 0.11, neckY: 0.46, headY: 0.135, shX: 0.2, shY: 0.37, upper: 0.3, fore: 0.28, hipX: 0.1, hipY: -0.05, thigh: 0.47, shin: 0.46 },
    man: { chestY: 0.11, neckY: 0.46, headY: 0.13, shX: 0.205, shY: 0.37, upper: 0.3, fore: 0.28, hipX: 0.105, hipY: -0.05, thigh: 0.47, shin: 0.46 }
  };

  const HEAD = {
    heavy: { rx: 0.106, ry: 0.13, rz: 0.12, jaw: -0.24, chinIn: -0.04, chinDrop: 0.2, back: 0.96, brow: 0.024, cheek: 0.05, crown: 0.84, neck: 0.105 },
    scout: { rx: 0.09, ry: 0.126, rz: 0.112, jaw: 0.12, chinIn: -0.02, chinDrop: 0.14, back: 1.04, brow: 0.012, cheek: 0.02, crown: 1, neck: 0.058 },
    soldier: { rx: 0.1, ry: 0.128, rz: 0.116, jaw: -0.14, chinIn: -0.08, chinDrop: 0.22, back: 1, brow: 0.012, cheek: 0.03, crown: 1, neck: 0.078 },
    pyro: { rx: 0.1, ry: 0.124, rz: 0.114, jaw: 0.04, chinIn: 0.0, chinDrop: 0.08, back: 1.02, brow: 0.0, cheek: 0.0, crown: 1, neck: 0.072 },
    demo: { rx: 0.097, ry: 0.125, rz: 0.114, jaw: -0.06, chinIn: -0.02, chinDrop: 0.14, back: 1.02, brow: 0.016, cheek: 0.03, crown: 1, neck: 0.072 },
    engineer: { rx: 0.1, ry: 0.124, rz: 0.114, jaw: -0.16, chinIn: -0.09, chinDrop: 0.22, back: 1, brow: 0.014, cheek: 0.03, crown: 0.95, neck: 0.074 },
    medic: { rx: 0.088, ry: 0.128, rz: 0.114, jaw: 0.1, chinIn: 0.0, chinDrop: 0.16, back: 1.05, brow: 0.014, cheek: 0.02, crown: 1, neck: 0.06 },
    sniper: { rx: 0.088, ry: 0.132, rz: 0.114, jaw: 0.08, chinIn: -0.02, chinDrop: 0.2, back: 1.04, brow: 0.016, cheek: 0.02, crown: 1, neck: 0.062 },
    spy: { rx: 0.088, ry: 0.128, rz: 0.114, jaw: 0.08, chinIn: 0.0, chinDrop: 0.18, back: 1.04, brow: 0.014, cheek: 0.02, crown: 1, neck: 0.06 },
    man: { rx: 0.084, ry: 0.12, rz: 0.108, jaw: 0.06, chinIn: -0.01, chinDrop: 0.16, back: 1.04, brow: 0.014, cheek: 0.02, crown: 1, neck: 0.058 }
  };

  const SKIN = { heavy: 0xd9936c, scout: 0xdfa07a, soldier: 0xd79a73, pyro: 0xd79a73, demo: 0x6c4634, engineer: 0xdb9c75, medic: 0xe2ab88, sniper: 0xd6976e, spy: 0xe0a685, man: 0xe0aa8a };

  const FP = [-1.3, 1.3, -1.2, 0.95];
  const N_UP = [0, 1, 0];
  const N_DN = [0, -1, 0];

  function hex(c) {
    return '#' + (c >>> 0).toString(16).padStart(6, '0');
  }

  function dim(c, k) {
    const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
    return (ch((c >> 16) & 255) << 16) | (ch((c >> 8) & 255) << 8) | ch(c & 255);
  }

  function dome(b, rx, ry, rz, seg, rings, col) {
    const c = rgb(col);
    const pt = (i, j) => {
      const th = (j / rings) * PI / 2;
      const ph = (i / seg) * PI * 2;
      const n = [S(th) * S(ph), C(th), S(th) * C(ph)];
      return { p: [n[0] * rx, n[1] * ry, n[2] * rz], n: V3.norm([n[0] / rx, n[1] / ry, n[2] / rz]) };
    };
    for (let j = 0; j < rings; j++) {
      for (let i = 0; i < seg; i++) {
        const a = pt(i, j), bb = pt(i + 1, j), cc = pt(i + 1, j + 1), d = pt(i, j + 1);
        b.tri(a.p, d.p, cc.p, c, null, [a.n, d.n, cc.n]);
        b.tri(a.p, cc.p, bb.p, c, null, [a.n, cc.n, bb.n]);
      }
    }
    return b;
  }

  function rgba(c, a) {
    return `rgba(${(c >> 16) & 255},${(c >> 8) & 255},${c & 255},${a})`;
  }

  function headPt(H, yaw, pit, inf) {
    const cx = S(yaw) * C(pit), cy = S(pit), cz = C(yaw) * C(pit);
    let x = cx * H.rx, y = cy * H.ry, z = cz * H.rz;
    if (cy < 0) {
      const q = -cy;
      x *= 1 - H.jaw * q * q;
      if (z > 0) z *= 1 - H.chinIn * q * q * (1 - 0.6 * Math.abs(S(yaw)));
      else z *= 1 - 0.3 * q * q;
      y *= 1 + H.chinDrop * q;
    } else if (H.crown !== 1) {
      const q = cy;
      x *= 1 - (1 - H.crown) * q * q;
      z *= 1 - (1 - H.crown) * 0.6 * q * q;
    }
    if (z < 0) z *= H.back;
    if (z > 0) {
      const brow = Math.max(0, 1 - Math.abs(cy - 0.26) / 0.15) * Math.max(0, 1 - Math.abs(cx) / 0.7);
      z += brow * H.brow;
      const cheek = Math.max(0, 1 - Math.abs(cy + 0.08) / 0.26) * Math.max(0, 1 - Math.abs(Math.abs(cx) - 0.74) / 0.24);
      x *= 1 + cheek * H.cheek;
    }
    return [x * inf, y * inf, z * inf];
  }

  function headVert(H, yaw, pit, inf) {
    const e = 0.002;
    const p = headPt(H, yaw, pit, inf);
    const dy = V3.sub(headPt(H, yaw + e, pit, inf), headPt(H, yaw - e, pit, inf));
    const dp = V3.sub(headPt(H, yaw, Math.min(pit + e, PI / 2), inf), headPt(H, yaw, Math.max(pit - e, -PI / 2), inf));
    const n = V3.cross(dy, dp);
    return { p, n: V3.len(n) > 1e-9 ? V3.norm(n) : V3.norm(p) };
  }

  function headPatch(b, H, inf, y0, y1, p0, p1, nu, nv, colAt, uvs) {
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const yA = lerp(y0, y1, u0), yB = lerp(y0, y1, u1), pA = lerp(p0, p1, v0), pB = lerp(p0, p1, v1);
        const a = headVert(H, yA, pA, inf), bb = headVert(H, yB, pA, inf), c = headVert(H, yB, pB, inf), d = headVert(H, yA, pB, inf);
        const col = typeof colAt === 'function' ? [colAt(yA, pA), colAt(yB, pA), colAt(yB, pB), colAt(yA, pB)] : colAt;
        b.quad(a.p, bb.p, c.p, d.p, col, uvs ? [[u0, v0], [u1, v0], [u1, v1], [u0, v1]] : null, [a.n, bb.n, c.n, d.n]);
      }
    }
  }

  function catmull(keys, y, idx) {
    if (y <= keys[0][0]) return keys[0][idx];
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i], c = keys[i + 1];
      if (y <= c[0]) {
        const t = (y - a[0]) / (c[0] - a[0]);
        const p0 = keys[Math.max(0, i - 1)][idx], p1 = a[idx], p2 = c[idx], p3 = keys[Math.min(keys.length - 1, i + 2)][idx];
        const t2 = t * t, t3 = t2 * t;
        return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
      }
    }
    return keys[keys.length - 1][idx];
  }

  function profile(b, keys, n, sides, col, opts) {
    const o = opts || {};
    const y0 = keys[0][0], y1 = keys[keys.length - 1][0];
    const rows = [];
    for (let i = 0; i <= n; i++) {
      const y = lerp(y0, y1, i / n);
      rows.push({ y, rx: catmull(keys, y, 1), rz: catmull(keys, y, 2), cz: catmull(keys, y, 3), cx: 0, col: typeof col === 'function' ? col(y) : col });
    }
    Rig.loft(b, rows, sides, Object.assign({ phase: o.uv ? PI : 0 }, o));
    return b;
  }

  function limb(b, len, r0, r1, cols, sides, top) {
    const t = top === undefined ? 0.03 : top;
    const rows = [];
    const keys = [[t, r0 * 0.92], [0, r0], [-len, r1], [-len - 0.025, r1 * 0.9]];
    const cuts = cols.map(c => c[0]).filter(f => f > 0 && f < 1);
    const ys = [t, 0, -len, -len - 0.025];
    cuts.forEach(f => { ys.push(-len * f + 0.001, -len * f - 0.001); });
    ys.sort((a, c) => c - a);
    const colAt = (y) => {
      const f = -y / len;
      let col = cols[0][1];
      cols.forEach(([from, cc]) => { if (f >= from) col = cc; });
      return col;
    };
    ys.forEach(y => {
      let r;
      if (y >= 0) r = lerp(keys[1][1], keys[0][1], y / Math.max(t, 1e-4));
      else if (y >= -len) r = lerp(r0, r1, -y / len);
      else r = r1 * 0.9;
      rows.push({ y, rx: r, rz: r * 0.95, cz: 0, cx: 0, col: colAt(y) });
    });
    rows.reverse();
    Rig.loft(b, rows, sides || 9, { capBottom: true, capTop: true, hard: true });
    return b;
  }

  const LIMBS = {
    heavy: { upper: [0.105, 0.085], fore: [0.095, 0.07], thigh: [0.12, 0.09], shin: [0.088, 0.07], sleeve: 0.42, hand: 1.25, foot: [0.07, 0.07, 0.17] },
    scout: { upper: [0.052, 0.04], fore: [0.044, 0.035], thigh: [0.075, 0.055], shin: [0.052, 0.042], sleeve: 0.4, hand: 0.95, foot: [0.055, 0.055, 0.15] },
    soldier: { upper: [0.068, 0.054], fore: [0.058, 0.046], thigh: [0.085, 0.064], shin: [0.06, 0.05], sleeve: 1.2, hand: 1.05, foot: [0.06, 0.07, 0.16] },
    pyro: { upper: [0.068, 0.056], fore: [0.058, 0.05], thigh: [0.086, 0.066], shin: [0.062, 0.054], sleeve: 1.2, hand: 1.05, foot: [0.062, 0.07, 0.16] },
    demo: { upper: [0.066, 0.054], fore: [0.056, 0.046], thigh: [0.084, 0.064], shin: [0.06, 0.05], sleeve: 1.2, hand: 1.0, foot: [0.06, 0.068, 0.16] },
    engineer: { upper: [0.066, 0.052], fore: [0.06, 0.05], thigh: [0.085, 0.066], shin: [0.06, 0.052], sleeve: 0.62, hand: 1.18, foot: [0.062, 0.07, 0.16] },
    medic: { upper: [0.056, 0.046], fore: [0.05, 0.04], thigh: [0.072, 0.056], shin: [0.054, 0.045], sleeve: 1.2, hand: 1.0, foot: [0.055, 0.06, 0.155] },
    sniper: { upper: [0.054, 0.044], fore: [0.05, 0.04], thigh: [0.07, 0.054], shin: [0.052, 0.044], sleeve: 0.55, hand: 1.0, foot: [0.055, 0.065, 0.16] },
    spy: { upper: [0.052, 0.043], fore: [0.046, 0.038], thigh: [0.068, 0.052], shin: [0.05, 0.042], sleeve: 1.2, hand: 0.95, foot: [0.05, 0.05, 0.16] },
    man: { upper: [0.054, 0.044], fore: [0.048, 0.04], thigh: [0.07, 0.054], shin: [0.052, 0.044], sleeve: 1.2, hand: 0.95, foot: [0.052, 0.055, 0.16] }
  };

  function palette(cls, team, look) {
    const T = TEAMS[team] || TEAMS.red;
    const skin = SKIN[cls];
    const base = { skin, skinDk: shade(skin, 0.82), cloth: T.cloth, clothDk: T.dark, clothHi: T.hi, boot: 0x2a2320, sole: 0x18130f, glove: 0x2b2522, pants: 0x3d372f, belt: 0x241d18, buckle: 0xb3954d, metal: 0x5b5d61 };
    if (cls === 'heavy') Object.assign(base, { pants: 0x3c382f, vest: 0x2c2724, glove: 0x252120, sleeve: T.cloth });
    if (cls === 'scout') Object.assign(base, { pants: 0xa38f6a, boot: T.cloth, sole: 0xe8e2d4, glove: 0xeae5da, sleeve: T.cloth });
    if (cls === 'soldier') Object.assign(base, { pants: 0x4b4636, boot: 0x2b241f, glove: 0x2e2722, sleeve: T.cloth, helmet: 0x5a5639 });
    if (cls === 'pyro') Object.assign(base, { pants: T.cloth, boot: 0x2e2620, glove: 0x2e2620, sleeve: T.cloth, mask: 0x2c2926 });
    if (cls === 'demo') Object.assign(base, { pants: 0x2f2a26, boot: 0x2a2320, glove: 0x332b25, sleeve: 0x37302a, shirt: T.cloth });
    if (cls === 'engineer') Object.assign(base, { pants: 0x3b3129, overall: 0x3b3129, glove: 0xe0a43a, gloveBand: 0x8d8a83, sleeve: T.cloth });
    if (cls === 'medic') Object.assign(base, { pants: 0x34302c, coat: 0xe6e1d7, coatDk: 0xc9c2b4, glove: T.glove, sleeve: 0xe6e1d7, vest: T.cloth });
    if (cls === 'sniper') Object.assign(base, { pants: 0x5c4a33, vest: 0x5a3c25, glove: 0x3a2a1e, sleeve: T.cloth, hat: 0x6b4f34 });
    if (cls === 'spy') Object.assign(base, { pants: T.suit, suit: T.suit, suitDk: T.suitDk, boot: 0x1d1a19, glove: 0x1e1b1a, sleeve: T.suit, mask: T.mask, tie: team === 'blu' ? 0x1d2433 : 0x3a1a16 });
    if (cls === 'man') Object.assign(base, { sleeve: 0x8a8a8a, pants: 0x3a3e48, boot: 0x2a2420, glove: 0x222222, hair: 0x2a2018, hairLine: 0.5 });
    if (look && LOOKS[look]) {
      Object.assign(base, LOOKS[look].pal);
      base.skinDk = shade(base.skin, 0.82);
    }
    return base;
  }

  function strap(ctx, x0, y0, x1, y1, w, col) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function shadeTorso(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(0,0,0,0.18)');
    g.addColorStop(0.25, 'rgba(0,0,0,0.04)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    g.addColorStop(0.75, 'rgba(0,0,0,0.04)');
    g.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  const FX = (w, fx) => (0.5 + fx * 0.25) * w;

  function torsoPaint(cls, pal) {
    return (ctx, w, h) => {
      const vy = (v) => (1 - v) * h;
      if (cls === 'heavy') {
        ctx.fillStyle = hex(pal.vest);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hex(pal.cloth);
        ctx.beginPath();
        ctx.moveTo(FX(w, -0.62), vy(0.98));
        ctx.lineTo(FX(w, 0.62), vy(0.98));
        ctx.lineTo(FX(w, 0.26), vy(0.5));
        ctx.lineTo(FX(w, -0.26), vy(0.5));
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(FX(w, -1.25), vy(1), FX(w, -0.7) - FX(w, -1.25), vy(0.74) - vy(1));
        ctx.fillRect(FX(w, 0.7), vy(1), FX(w, 1.25) - FX(w, 0.7), vy(0.74) - vy(1));
        ctx.fillStyle = hex(pal.belt);
        ctx.fillRect(0, vy(0.08), w, vy(0) - vy(0.08));
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(FX(w, -0.02), vy(0.5), 2, vy(0.08) - vy(0.5));
      } else if (cls === 'scout') {
        ctx.fillStyle = hex(pal.cloth);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hex(dim(pal.cloth, 0.8));
        ctx.fillRect(0, vy(1), w, vy(0.93) - vy(1));
        strap(ctx, FX(w, -0.75), vy(0.98), FX(w, 0.85), vy(0.18), w * 0.03, hex(0x4a3a2a));
        ctx.fillStyle = hex(pal.pants);
        ctx.fillRect(0, vy(0.07), w, vy(0) - vy(0.07));
      } else if (cls === 'soldier') {
        ctx.fillStyle = hex(pal.cloth);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hex(pal.clothDk);
        ctx.fillRect(FX(w, -0.04), vy(0.95), 3, vy(0.05) - vy(0.95));
        [-0.5, 0.5].forEach(sx => {
          ctx.fillRect(FX(w, sx) - 10, vy(0.62), 20, 14);
        });
        strap(ctx, FX(w, -0.8), vy(0.98), FX(w, 0.7), vy(0.2), w * 0.035, hex(0x3b3226));
        strap(ctx, FX(w, 0.8), vy(0.98), FX(w, -0.7), vy(0.2), w * 0.035, hex(0x3b3226));
        ctx.fillStyle = hex(pal.belt);
        ctx.fillRect(0, vy(0.2), w, vy(0.1) - vy(0.2));
        ctx.fillStyle = hex(pal.buckle);
        ctx.fillRect(FX(w, 0) - 8, vy(0.2), 16, vy(0.1) - vy(0.2));
        ctx.fillStyle = hex(pal.pants);
        ctx.fillRect(0, vy(0.07), w, vy(0) - vy(0.07));
      } else if (cls === 'pyro') {
        ctx.fillStyle = hex(pal.cloth);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hex(pal.clothDk);
        ctx.fillRect(FX(w, -0.03), vy(0.95), 4, vy(0.12) - vy(0.95));
        strap(ctx, FX(w, -0.7), vy(0.98), FX(w, -0.55), vy(0.15), w * 0.03, hex(0x2c2420));
        strap(ctx, FX(w, 0.7), vy(0.98), FX(w, 0.55), vy(0.15), w * 0.03, hex(0x2c2420));
        ctx.fillStyle = hex(0x2c2420);
        ctx.fillRect(0, vy(0.16), w, vy(0.09) - vy(0.16));
      } else if (cls === 'demo') {
        ctx.fillStyle = hex(pal.sleeve);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hex(pal.shirt);
        ctx.fillRect(FX(w, -0.35), vy(0.98), FX(w, 0.35) - FX(w, -0.35), vy(0.3) - vy(0.98));
        strap(ctx, FX(w, -0.7), vy(0.98), FX(w, 0.7), vy(0.18), w * 0.04, hex(0x3d3024));
        ctx.fillStyle = hex(pal.belt);
        ctx.fillRect(0, vy(0.18), w, vy(0.08) - vy(0.18));
      } else if (cls === 'engineer') {
        ctx.fillStyle = hex(pal.cloth);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hex(pal.overall);
        ctx.fillRect(0, vy(0.42), w, vy(0) - vy(0.42));
        ctx.fillRect(FX(w, -0.42), vy(0.62), FX(w, 0.42) - FX(w, -0.42), vy(0.4) - vy(0.62));
        strap(ctx, FX(w, -0.36), vy(0.62), FX(w, -0.5), vy(1), w * 0.025, hex(pal.overall));
        strap(ctx, FX(w, 0.36), vy(0.62), FX(w, 0.5), vy(1), w * 0.025, hex(pal.overall));
        strap(ctx, FX(w, 1.5), vy(0.62), FX(w, 1.45), vy(1), w * 0.025, hex(pal.overall));
        strap(ctx, FX(w, 2.5), vy(0.62), FX(w, 2.55), vy(1), w * 0.025, hex(pal.overall));
        ctx.fillStyle = hex(pal.buckle);
        [-0.36, 0.36].forEach(sx => ctx.fillRect(FX(w, sx) - 4, vy(0.63), 8, 6));
        ctx.fillStyle = hex(dim(pal.cloth, 0.8));
        ctx.fillRect(FX(w, -0.02), vy(0.98), 2, vy(0.62) - vy(0.98));
        ctx.fillStyle = hex(0x1e1914);
        ctx.fillRect(0, vy(0.2), w, vy(0.12) - vy(0.2));
      } else if (cls === 'medic') {
        ctx.fillStyle = hex(pal.coat);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hex(pal.vest);
        ctx.beginPath();
        ctx.moveTo(FX(w, -0.3), vy(0.98));
        ctx.lineTo(FX(w, 0.3), vy(0.98));
        ctx.lineTo(FX(w, 0.16), vy(0.35));
        ctx.lineTo(FX(w, -0.16), vy(0.35));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#efeae0';
        ctx.beginPath();
        ctx.moveTo(FX(w, -0.12), vy(0.99));
        ctx.lineTo(FX(w, 0.12), vy(0.99));
        ctx.lineTo(FX(w, 0), vy(0.8));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = hex(0x2a2a2a);
        ctx.fillRect(FX(w, -0.03), vy(0.86), FX(w, 0.03) - FX(w, -0.03), vy(0.55) - vy(0.86));
        strap(ctx, FX(w, -0.65), vy(0.98), FX(w, -0.55), vy(0.3), w * 0.02, hex(0x3a3028));
        strap(ctx, FX(w, 0.65), vy(0.98), FX(w, 0.55), vy(0.3), w * 0.02, hex(0x3a3028));
        ctx.fillStyle = hex(pal.coatDk);
        ctx.fillRect(FX(w, -0.32), vy(0.4), 2, vy(0) - vy(0.4));
        ctx.fillRect(FX(w, 0.32), vy(0.4), 2, vy(0) - vy(0.4));
      } else if (cls === 'sniper') {
        ctx.fillStyle = hex(pal.cloth);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hex(pal.vest);
        ctx.fillRect(0, vy(0.95), FX(w, -0.12), vy(0.05) - vy(0.95));
        ctx.fillRect(FX(w, 0.12), vy(0.95), w - FX(w, 0.12), vy(0.05) - vy(0.95));
        ctx.fillStyle = hex(dim(pal.vest, 0.75));
        [-0.5, 0.5].forEach(sx => ctx.fillRect(FX(w, sx) - 9, vy(0.55), 18, 14));
        ctx.fillStyle = hex(0x2a1e14);
        ctx.fillRect(0, vy(0.12), w, vy(0.05) - vy(0.12));
        strap(ctx, FX(w, -0.7), vy(0.98), FX(w, 0.8), vy(0.15), w * 0.02, hex(0x3a2a1c));
      } else if (cls === 'man') {
        ctx.fillStyle = hex(pal.sleeve);
        ctx.fillRect(0, 0, w, h);
      } else if (cls === 'spy') {
        ctx.fillStyle = hex(pal.suit);
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#e8e2d6';
        ctx.beginPath();
        ctx.moveTo(FX(w, -0.22), vy(0.99));
        ctx.lineTo(FX(w, 0.22), vy(0.99));
        ctx.lineTo(FX(w, 0.05), vy(0.45));
        ctx.lineTo(FX(w, -0.05), vy(0.45));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = hex(pal.tie);
        ctx.beginPath();
        ctx.moveTo(FX(w, -0.04), vy(0.97));
        ctx.lineTo(FX(w, 0.04), vy(0.97));
        ctx.lineTo(FX(w, 0.05), vy(0.55));
        ctx.lineTo(FX(w, 0), vy(0.5));
        ctx.lineTo(FX(w, -0.05), vy(0.55));
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = hex(pal.suitDk);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(FX(w, -0.22), vy(0.99));
        ctx.lineTo(FX(w, -0.05), vy(0.45));
        ctx.lineTo(FX(w, -0.02), vy(0.0));
        ctx.moveTo(FX(w, 0.22), vy(0.99));
        ctx.lineTo(FX(w, 0.05), vy(0.45));
        ctx.stroke();
        ctx.fillStyle = hex(pal.suitDk);
        [0.35, 0.22].forEach(v => ctx.fillRect(FX(w, 0.04), vy(v), 5, 5));
      }
      shadeTorso(ctx, w, h);
    };
  }

  const TORSO = {
    heavy: [[-0.02, 0.27, 0.235, 0.05], [0.1, 0.285, 0.25, 0.07], [0.22, 0.3, 0.24, 0.05], [0.34, 0.31, 0.215, 0.02], [0.44, 0.3, 0.19, 0.0], [0.5, 0.25, 0.16, -0.02], [0.55, 0.15, 0.12, 0.0], [0.6, 0.11, 0.1, 0.01]],
    scout: [[-0.02, 0.14, 0.1, 0.0], [0.1, 0.145, 0.1, 0.005], [0.22, 0.165, 0.11, 0.01], [0.32, 0.175, 0.105, 0.005], [0.38, 0.15, 0.09, 0.0], [0.42, 0.075, 0.065, 0.0], [0.46, 0.058, 0.055, 0.005]],
    soldier: [[-0.02, 0.19, 0.14, 0.01], [0.12, 0.2, 0.145, 0.02], [0.25, 0.22, 0.15, 0.02], [0.36, 0.23, 0.14, 0.01], [0.43, 0.19, 0.12, 0.0], [0.47, 0.1, 0.09, 0.0], [0.5, 0.078, 0.074, 0.005]],
    pyro: [[-0.02, 0.19, 0.145, 0.02], [0.12, 0.2, 0.15, 0.03], [0.25, 0.21, 0.15, 0.02], [0.35, 0.215, 0.14, 0.01], [0.41, 0.18, 0.12, 0.0], [0.45, 0.1, 0.09, 0.0], [0.48, 0.075, 0.072, 0.005]],
    demo: [[-0.02, 0.19, 0.15, 0.03], [0.12, 0.2, 0.155, 0.04], [0.25, 0.21, 0.15, 0.02], [0.34, 0.21, 0.14, 0.01], [0.4, 0.18, 0.12, 0.0], [0.44, 0.1, 0.09, 0.0], [0.47, 0.074, 0.07, 0.005]],
    engineer: [[-0.02, 0.19, 0.16, 0.04], [0.1, 0.2, 0.17, 0.05], [0.2, 0.205, 0.16, 0.03], [0.3, 0.21, 0.145, 0.01], [0.37, 0.18, 0.12, 0.0], [0.42, 0.1, 0.09, 0.0], [0.45, 0.075, 0.072, 0.005]],
    medic: [[-0.02, 0.16, 0.115, 0.0], [0.12, 0.165, 0.12, 0.01], [0.25, 0.185, 0.125, 0.015], [0.35, 0.195, 0.12, 0.005], [0.42, 0.165, 0.1, 0.0], [0.46, 0.08, 0.072, 0.0], [0.49, 0.062, 0.06, 0.005]],
    sniper: [[-0.02, 0.15, 0.11, 0.0], [0.12, 0.155, 0.115, 0.01], [0.25, 0.175, 0.12, 0.012], [0.35, 0.185, 0.115, 0.005], [0.42, 0.16, 0.1, 0.0], [0.47, 0.08, 0.072, 0.0], [0.5, 0.064, 0.062, 0.005]],
    spy: [[-0.02, 0.145, 0.105, 0.0], [0.12, 0.15, 0.11, 0.008], [0.25, 0.175, 0.115, 0.012], [0.35, 0.185, 0.11, 0.005], [0.42, 0.155, 0.095, 0.0], [0.46, 0.075, 0.068, 0.0], [0.49, 0.06, 0.058, 0.005]],
    man: [[-0.02, 0.15, 0.108, 0.0], [0.12, 0.155, 0.114, 0.008], [0.25, 0.18, 0.12, 0.012], [0.35, 0.19, 0.114, 0.005], [0.42, 0.16, 0.098, 0.0], [0.46, 0.078, 0.07, 0.0], [0.49, 0.06, 0.058, 0.005]]
  };

  const HIPS = {
    heavy: [[-0.17, 0.2, 0.17, -0.01], [-0.08, 0.25, 0.2, 0.01], [0.04, 0.27, 0.23, 0.04], [0.16, 0.28, 0.24, 0.06]],
    scout: [[-0.14, 0.12, 0.085, -0.005], [-0.06, 0.135, 0.095, 0.0], [0.04, 0.14, 0.1, 0.0], [0.12, 0.145, 0.1, 0.005]],
    soldier: [[-0.15, 0.15, 0.11, -0.005], [-0.06, 0.17, 0.125, 0.0], [0.04, 0.185, 0.135, 0.005], [0.13, 0.195, 0.14, 0.015]],
    pyro: [[-0.15, 0.15, 0.115, -0.005], [-0.06, 0.17, 0.13, 0.0], [0.04, 0.185, 0.14, 0.01], [0.12, 0.195, 0.145, 0.02]],
    demo: [[-0.15, 0.15, 0.115, -0.005], [-0.06, 0.17, 0.13, 0.005], [0.04, 0.185, 0.14, 0.015], [0.12, 0.195, 0.15, 0.03]],
    engineer: [[-0.15, 0.15, 0.12, 0.0], [-0.06, 0.17, 0.14, 0.01], [0.04, 0.185, 0.155, 0.03], [0.12, 0.195, 0.16, 0.04]],
    medic: [[-0.15, 0.135, 0.1, -0.005], [-0.06, 0.15, 0.11, 0.0], [0.04, 0.16, 0.115, 0.0], [0.13, 0.165, 0.118, 0.008]],
    sniper: [[-0.15, 0.13, 0.095, -0.005], [-0.06, 0.145, 0.105, 0.0], [0.04, 0.152, 0.11, 0.0], [0.14, 0.155, 0.112, 0.008]],
    spy: [[-0.15, 0.125, 0.092, -0.005], [-0.06, 0.14, 0.1, 0.0], [0.04, 0.145, 0.105, 0.0], [0.13, 0.148, 0.108, 0.006]],
    man: [[-0.15, 0.128, 0.094, -0.005], [-0.06, 0.142, 0.102, 0.0], [0.04, 0.148, 0.107, 0.0], [0.13, 0.15, 0.11, 0.006]]
  };

  function buildTorso(b, cls) {
    profile(b, TORSO[cls], 14, 18, 0xffffff, { uv: true, capTop: true, capBottom: true });
  }

  function buildHips(b, cls, pal, look) {
    if (look && LOOKS[look] && LOOKS[look].hips) LOOKS[look].hips(b, pal);
    const col = cls === 'medic' ? pal.pants : cls === 'pyro' ? pal.cloth : pal.pants;
    const top = HIPS[cls][HIPS[cls].length - 1][0];
    profile(b, HIPS[cls], 6, 14, (y) => (y > top - 0.05 && cls !== 'pyro' ? pal.belt : col), { capBottom: true, capTop: true });
    if (cls === 'medic') {
      const coat = pal.coat;
      b.push(M4.translate(0, 0.02, 0));
      profile(b, [[-0.36, 0.2, 0.15, -0.02], [-0.2, 0.19, 0.14, -0.01], [-0.05, 0.175, 0.13, 0.0], [0.13, 0.172, 0.124, 0.008]], 8, 16, coat, {});
      b.pop();
    }
    if (cls === 'spy') {
      b.push(M4.translate(0, 0.0, 0));
      profile(b, [[-0.16, 0.152, 0.112, -0.004], [-0.06, 0.15, 0.11, 0.0], [0.1, 0.152, 0.112, 0.006]], 4, 14, pal.suit, {});
      b.pop();
    }
    if (cls === 'engineer') {
      b.at(-0.17, -0.02, 0.04, h => h.box(0.06, 0.12, 0.1, 0x4a3a2c));
      b.at(0.17, -0.02, 0.04, h => h.box(0.05, 0.1, 0.08, 0x2a221c));
    }
    if (cls === 'soldier') {
      [-0.12, -0.04, 0.04, 0.12].forEach((x, i) => b.at(x, 0.06, 0.13, h => h.ellipsoid(0.03, 0.036, 0.03, 7, 5, i % 2 ? 0x4c5a32 : 0x56643a)));
    }
  }

  function buildHeavyBelt(b, pal) {
    const path = [[0.22, 0.52, -0.02], [0.1, 0.48, 0.17], [0.0, 0.38, 0.235], [-0.12, 0.26, 0.255], [-0.22, 0.14, 0.24], [-0.27, 0.06, 0.18]];
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], c = path[i + 1];
      for (let k = 0; k < 4; k++) {
        const f = k / 4;
        const p = [lerp(a[0], c[0], f), lerp(a[1], c[1], f), lerp(a[2], c[2], f)];
        const dir = V3.norm(V3.sub(c, a));
        const ang = Math.atan2(dir[1], dir[0]);
        b.at(p[0], p[1], p[2] + 0.006, h => {
          h.push(M4.rotZ(ang));
          h.box(0.06, 0.07, 0.03, 0x4c3626);
          h.at(0, 0, 0.02, q => q.box(0.022, 0.06, 0.03, 0xc79a45));
          h.at(0, 0.0, 0.04, q => q.box(0.016, 0.04, 0.02, 0xb9672e));
          h.pop();
        });
      }
    }
    const back = [[0.22, 0.52, -0.02], [0.05, 0.4, -0.2], [-0.15, 0.22, -0.22], [-0.27, 0.06, 0.0]];
    for (let i = 0; i < back.length - 1; i++) {
      const a = back[i], c = back[i + 1];
      for (let k = 0; k < 3; k++) {
        const f = k / 3;
        const p = [lerp(a[0], c[0], f), lerp(a[1], c[1], f), lerp(a[2], c[2], f)];
        b.at(p[0], p[1], p[2] - 0.006, h => h.box(0.06, 0.07, 0.03, 0x4c3626));
      }
    }
  }

  function buildChestExtras(b, cls, pal, look) {
    const T = TORSO[cls];
    const top = T[T.length - 3];
    if (look && LOOKS[look] && LOOKS[look].chest) LOOKS[look].chest(b, pal);
    if (cls === 'man') {
      [-1, 1].forEach(s => b.at(s * 0.19, 0.37, 0.0, h => h.ellipsoid(0.066, 0.06, 0.066, 9, 6, pal.sleeve)));
      b.at(0, 0.44, 0.0, h => h.prism(12, 0.075, 0.07, -0.02, 0.066, 0.062, 0.03, pal.sleeve));
    } else if (cls === 'heavy') {
      buildHeavyBelt(b, pal);
      [-1, 1].forEach(s => b.at(s * 0.29, 0.45, 0.0, h => h.ellipsoid(0.115, 0.1, 0.11, 10, 7, pal.cloth)));
    } else if (cls === 'engineer') {
      [-1, 1].forEach(s => b.at(s * 0.2, top[0] - 0.02, 0.0, h => h.ellipsoid(0.075, 0.07, 0.075, 9, 6, pal.cloth)));
      b.at(0, 0.36, 0.1, h => h.ellipsoid(0.07, 0.03, 0.05, 8, 5, pal.clothDk));
    } else if (cls === 'pyro') {
      b.at(0, 0.24, -0.17, h => {
        h.prism(10, 0.065, 0.065, -0.17, 0.065, 0.065, 0.17, 0x6b6e70);
        h.at(0, 0.19, 0, q => q.ellipsoid(0.065, 0.04, 0.065, 9, 5, 0x6b6e70));
      });
      [-1, 1].forEach(s => b.at(s * 0.21, 0.36, 0.0, h => h.ellipsoid(0.08, 0.075, 0.08, 9, 6, pal.cloth)));
    } else if (cls === 'soldier') {
      [-1, 1].forEach(s => b.at(s * 0.23, 0.38, 0.0, h => h.ellipsoid(0.085, 0.07, 0.085, 9, 6, pal.cloth)));
      [-0.09, 0.0, 0.09].forEach(x => b.at(x, 0.27, 0.15, h => h.ellipsoid(0.028, 0.036, 0.028, 7, 5, 0x55633a)));
      b.at(0, 0.44, 0.0, h => h.prism(12, 0.1, 0.095, -0.02, 0.09, 0.085, 0.05, pal.clothDk));
    } else if (cls === 'medic') {
      [-1, 1].forEach(s => b.at(s * 0.2, 0.37, 0.0, h => h.ellipsoid(0.07, 0.065, 0.07, 9, 6, pal.coat)));
      b.at(0, 0.44, 0.0, h => h.prism(12, 0.085, 0.08, -0.02, 0.07, 0.068, 0.05, pal.coat));
      b.at(0, 0.24, -0.16, h => {
        h.prism(10, 0.06, 0.06, -0.13, 0.06, 0.06, 0.13, pal.cloth);
        h.at(0, 0.14, 0, q => q.ellipsoid(0.06, 0.035, 0.06, 9, 5, 0xb0b2b4));
      });
    } else if (cls === 'sniper') {
      [-1, 1].forEach(s => b.at(s * 0.2, 0.37, 0.0, h => h.ellipsoid(0.065, 0.062, 0.066, 9, 6, pal.cloth)));
      b.at(0, 0.44, 0.0, h => h.prism(12, 0.08, 0.075, -0.02, 0.072, 0.068, 0.04, pal.cloth));
    } else if (cls === 'spy') {
      [-1, 1].forEach(s => b.at(s * 0.19, 0.37, 0.0, h => h.ellipsoid(0.065, 0.058, 0.066, 9, 6, pal.suit)));
      b.at(0, 0.445, 0.02, h => h.prism(12, 0.07, 0.068, -0.02, 0.062, 0.06, 0.03, 0xe8e2d6));
    } else if (cls === 'demo') {
      [-1, 1].forEach(s => b.at(s * 0.21, 0.36, 0.0, h => h.ellipsoid(0.075, 0.07, 0.076, 9, 6, pal.sleeve)));
      [-0.12, -0.04, 0.04, 0.12].forEach(x => b.at(x, 0.12, 0.16, h => h.ellipsoid(0.026, 0.034, 0.026, 7, 5, 0x3a3f2a)));
    } else if (cls === 'scout') {
      [-1, 1].forEach(s => b.at(s * 0.17, 0.33, 0.0, h => h.ellipsoid(0.058, 0.052, 0.058, 9, 6, pal.cloth)));
      b.at(0, 0.3, 0.115, h => h.box(0.025, 0.035, 0.008, 0xbfc3c6));
      b.at(-0.2, 0.06, -0.06, h => h.box(0.05, 0.12, 0.1, 0x6a5a3e));
    }
  }

  function buildHand(b, cls, pal, side, grip, opts) {
    const L = LIMBS[cls];
    const s = L.hand;
    const k = side === 'L' ? 1 : -1;
    const o = opts || {};
    const glove = o.robot ? 0x8b8f93 : cls === 'man' ? (pal.gloves ? pal.glove : pal.skin) : (cls === 'heavy' ? pal.glove : cls === 'scout' ? pal.glove : cls === 'engineer' ? pal.glove : cls === 'medic' ? pal.glove : cls === 'spy' ? pal.glove : cls === 'pyro' ? pal.glove : cls === 'soldier' ? pal.glove : cls === 'demo' ? pal.glove : cls === 'sniper' ? pal.skin : pal.skin);
    const finger = cls === 'heavy' || cls === 'sniper' || (cls === 'man' && pal.fingerless) ? pal.skin : glove;
    b.push(M4.scale(s, s, s));
    b.at(0, -0.045, 0.0, h => h.ellipsoid(0.04, 0.05, 0.022, 8, 5, glove));
    if (grip === 'fist') {
      b.at(0, -0.09, 0.012, h => h.ellipsoid(0.04, 0.03, 0.03, 8, 5, finger));
      b.at(k * 0.035, -0.06, 0.02, h => h.ellipsoid(0.014, 0.025, 0.014, 6, 4, finger));
    } else if (grip === 'grip') {
      b.at(0, -0.09, 0.03, h => h.ellipsoid(0.04, 0.026, 0.026, 8, 5, finger));
      b.at(k * 0.032, -0.055, 0.03, h => h.ellipsoid(0.013, 0.026, 0.014, 6, 4, finger));
    } else if (grip === 'point') {
      b.at(0, -0.085, 0.012, h => h.ellipsoid(0.038, 0.028, 0.028, 8, 5, finger));
      b.at(-k * 0.022, -0.12, 0.0, h => h.ellipsoid(0.011, 0.04, 0.011, 6, 4, finger));
      b.at(k * 0.035, -0.06, 0.02, h => h.ellipsoid(0.013, 0.024, 0.013, 6, 4, finger));
    } else if (grip === 'open') {
      [-0.024, -0.008, 0.008, 0.024].forEach(x => b.at(x, -0.105, 0.0, h => h.ellipsoid(0.01, 0.034, 0.011, 5, 4, finger)));
      b.at(k * 0.042, -0.055, 0.012, h => { h.push(M4.rotZ(k * 0.6)); h.ellipsoid(0.012, 0.03, 0.012, 6, 4, finger); h.pop(); });
    } else if (grip === 'peace') {
      b.at(0, -0.085, 0.014, h => h.ellipsoid(0.038, 0.026, 0.026, 8, 5, finger));
      [-0.016, 0.004].forEach((x, i) => b.at(x * -k, -0.12, 0.0, h => { h.push(M4.rotZ((i ? 0.18 : -0.18) * k)); h.ellipsoid(0.01, 0.04, 0.01, 6, 4, finger); h.pop(); }));
    } else {
      b.at(0, -0.095, 0.012, h => h.ellipsoid(0.036, 0.036, 0.018, 8, 5, finger));
      b.at(k * 0.036, -0.06, 0.016, h => h.ellipsoid(0.013, 0.026, 0.013, 6, 4, finger));
    }
    if (cls === 'engineer' && !o.robot) {
      b.at(0, 0.005, 0, h => h.prism(10, 0.05, 0.034, -0.03, 0.054, 0.038, 0.035, pal.gloveBand));
    }
    if (o.robot) {
      b.at(0, -0.03, 0.0, h => h.box(0.06, 0.03, 0.03, 0xe0a43a));
    }
    b.pop();
  }

  function buildFoot(b, cls, pal) {
    const [w, hgt, len] = LIMBS[cls].foot;
    const boot = pal.boot;
    b.at(0, -0.035, 0.04, h => h.ellipsoid(w, hgt * 0.55, len * 0.55, 9, 5, boot));
    b.at(0, -0.06, 0.05, h => h.box(w * 1.9, 0.022, len * 1.05, pal.sole));
    b.at(0, 0.0, -0.005, h => h.prism(9, w * 0.9, w * 0.9, -0.03, w * 0.85, w * 0.85, 0.06, boot));
  }

  function buildArm(b, cls, pal, part, opts) {
    const L = LIMBS[cls];
    const DD = D[cls];
    const sleeve = pal.sleeve;
    const skin = pal.skin;
    const o = opts || {};
    if (part === 'upper') {
      const cols = pal.upperCols ? pal.upperCols.slice() : L.sleeve >= 1 ? [[0, sleeve]] : [[0, sleeve], [L.sleeve, skin]];
      if (cls === 'medic') cols.splice(0, cols.length, [0, pal.coat]);
      limb(b, DD.upper, L.upper[0], L.upper[1], cols, 10);
      if (cls === 'engineer' || cls === 'sniper') b.at(0, -DD.upper * L.sleeve, 0, h => h.prism(10, L.upper[0] * 1.08, L.upper[0] * 1.08, -0.02, L.upper[0] * 1.05, L.upper[0] * 1.05, 0.03, shade(sleeve, 0.9)));
    } else {
      let cols;
      if (cls === 'heavy') cols = [[0, skin], [0.8, pal.glove]];
      else if (cls === 'scout') cols = [[0, skin], [0.86, pal.glove]];
      else if (cls === 'engineer') cols = [[0, o.robot ? 0x8b8f93 : skin], [0.62, o.robot ? 0x8b8f93 : pal.glove]];
      else if (cls === 'sniper') cols = [[0, skin], [0.85, 0x3a2a1e]];
      else if (cls === 'medic') cols = [[0, pal.coat], [0.75, pal.glove]];
      else if (pal.foreCols) cols = pal.foreCols;
      else if (cls === 'man') cols = [[0, sleeve], [0.9, pal.gloves ? pal.glove : skin]];
      else cols = [[0, sleeve], [0.86, pal.glove]];
      limb(b, DD.fore, L.fore[0], L.fore[1], cols, 10);
      if (cls === 'sniper') b.at(0, -DD.fore * 0.82, 0, h => h.prism(10, L.fore[1] * 1.15, L.fore[1] * 1.15, -0.012, L.fore[1] * 1.15, L.fore[1] * 1.15, 0.012, 0x2a2a2a));
    }
  }

  function buildLeg(b, cls, pal, part) {
    const L = LIMBS[cls];
    const DD = D[cls];
    if (part === 'thigh') {
      limb(b, DD.thigh, L.thigh[0], L.thigh[1], [[0, cls === 'pyro' ? pal.cloth : pal.pants]], 10, 0.05);
    } else {
      const bootTop = pal.bootTop || (cls === 'scout' ? 0.82 : cls === 'spy' || cls === 'medic' || cls === 'man' ? 0.88 : 0.55);
      limb(b, DD.shin, L.shin[0], L.shin[1], [[0, cls === 'pyro' ? pal.cloth : pal.pants], [bootTop, pal.boot]], 10);
      if (cls === 'scout') b.at(0, -DD.shin * 0.8, 0, h => h.prism(10, L.shin[1] * 1.12, L.shin[1] * 1.12, -0.01, L.shin[1] * 1.15, L.shin[1] * 1.15, 0.02, 0xe8e2d4));
    }
  }

  function buildNeck(b, cls, pal) {
    const H = HEAD[cls];
    const col = pal.neck || (cls === 'spy' ? pal.mask : cls === 'pyro' ? pal.cloth : pal.skin);
    Rig.loft(b, [
      { y: -0.08, rx: H.neck * 1.12, rz: H.neck * 1.08, cz: 0, cx: 0, col },
      { y: 0.0, rx: H.neck, rz: H.neck * 0.98, cz: 0.005, cx: 0, col },
      { y: 0.1, rx: H.neck * 0.95, rz: H.neck * 0.95, cz: 0.012, cx: 0, col }
    ], 10, {});
  }

  function headBaseCol(cls, pal, look) {
    if (cls === 'spy') return pal.mask;
    if (cls === 'pyro') return 0x2c2926;
    return pal.skin;
  }

  function hairLine(cls) {
    if (cls === 'heavy' || cls === 'engineer') return 9;
    if (cls === 'medic') return 0.42;
    if (cls === 'demo') return 0.5;
    if (cls === 'scout' || cls === 'sniper' || cls === 'soldier') return 0.45;
    return 9;
  }

  function buildHead(b, cls, pal) {
    const H = HEAD[cls];
    const base = rgb(headBaseCol(cls, pal));
    const hairCol = cls === 'man' && pal.hair ? (pal.hairAlpha ? shade(pal.hair, 1).map((v, i) => (i < 3 ? v * pal.hairAlpha + rgb(pal.skin)[i] * (1 - pal.hairAlpha) : v)) : rgb(pal.hair)) : rgb(cls === 'medic' ? 0x2b231d : cls === 'demo' ? 0x1e1916 : cls === 'scout' ? 0x3a2a1c : cls === 'sniper' ? 0x4a3523 : 0x3a2c22);
    const hl = cls === 'man' ? (pal.hair ? pal.hairLine || 0.5 : 9) : hairLine(cls);
    headPatch(b, H, 1, -PI, PI, -PI / 2, PI / 2, 24, 16, (yaw, pit) => {
      const front = Math.abs(yaw) < 1.3;
      if (cls !== 'spy' && cls !== 'pyro' && pit > hl - (front ? 0 : 0.35)) return hairCol;
      return base;
    });
    const nose = { heavy: [0, -0.012, 0.022, 0.026, 0.03, 0.03], scout: [0, -0.015, 0.03, 0.017, 0.032, 0.035], soldier: [0, -0.02, 0.022, 0.02, 0.026, 0.024], demo: [0, -0.016, 0.024, 0.022, 0.028, 0.026], engineer: [0, -0.02, 0.022, 0.02, 0.026, 0.024], medic: [0, -0.012, 0.028, 0.016, 0.036, 0.036], sniper: [0, -0.016, 0.03, 0.016, 0.034, 0.036], spy: [0, -0.012, 0.03, 0.016, 0.034, 0.036], man: [0, -0.016, 0.028, 0.016, 0.032, 0.034] }[cls];
    if (nose) {
      const front = headPt(H, 0, nose[1] / H.ry * 1.2, 1);
      const col = cls === 'spy' ? pal.mask : pal.skin;
      b.at(nose[0], nose[1], front[2] + nose[2] * 0.25, h => { h.push(M4.rotX(-0.25)); h.ellipsoid(nose[3], nose[4], nose[5] * 0.75, 8, 6, shade(col, 1.02)); h.pop(); });
    }
    if (cls !== 'pyro') {
      [-1, 1].forEach(s => {
        const ep = headPt(H, s * 1.57, -0.05, 1);
        b.at(ep[0] + s * 0.004, ep[1] - 0.004, ep[2] - 0.006, h => h.ellipsoid(0.012, 0.028, 0.02, 6, 5, shade(headBaseCol(cls, pal), 0.95)));
      });
    }
    if (cls === 'pyro') {
      [-1, 1].forEach(s => {
        const ep = headPt(H, s * 0.42, 0.18, 1);
        b.at(ep[0], ep[1], ep[2] + 0.004, h => { h.push(M4.rotY(s * 0.42)); h.prism(12, 0.03, 0.03, -0.01, 0.034, 0.034, 0.012, 0x3a3631); h.pop(); });
      });
      const fp = headPt(H, 0, -0.42, 1);
      b.at(0, fp[1], fp[2] + 0.02, h => { h.push(M4.rotX(PI / 2 - 0.35)); h.prism(10, 0.034, 0.034, -0.03, 0.03, 0.03, 0.03, 0x45413b); h.pop(); });
    }
  }

  function faceKey(o) {
    return [o.eyes || 'open', o.brows || 'flat', o.mouth || 'shut', Math.round(clamp(o.open || 0, 0, 1) * 3), o.look || 0, o.mask === undefined ? '' : o.mask, o.beard ? 1 : 0].join('|');
  }

  function drawFace(cls, pal, ex) {
    return (ctx, w, h) => {
      const P = (yaw, pit) => [((yaw - FP[0]) / (FP[1] - FP[0])) * w, ((FP[3] - pit) / (FP[3] - FP[2])) * h];
      const sx = w / (FP[1] - FP[0]);
      const sy = h / (FP[3] - FP[2]);
      const base = headBaseCol(cls, pal);
      ctx.fillStyle = hex(base);
      ctx.fillRect(0, 0, w, h);
      if (cls === 'pyro') return;
      const skin = pal.skin;
      const spy = cls === 'spy' || ex.mask !== undefined;
      if (ex.mask !== undefined) {
        ctx.fillStyle = hex(ex.mask);
        ctx.fillRect(0, 0, w, h);
      }
      if (spy) {
        ctx.fillStyle = hex(skin);
        [-1, 1].forEach(s => {
          const [x, y] = P(s * 0.34, 0.12);
          ctx.beginPath();
          ctx.ellipse(x, y, 0.2 * sx, 0.14 * sy, 0, 0, PI * 2);
          ctx.fill();
        });
        const [mx, my] = P(0, -0.5);
        ctx.beginPath();
        ctx.ellipse(mx, my, 0.32 * sx, 0.2 * sy, 0, 0, PI * 2);
        ctx.fill();
      }
      if (cls === 'man' && pal.hair) {
        const hl = pal.hairLine || 0.5;
        ctx.fillStyle = pal.hairAlpha ? rgba(pal.hair, pal.hairAlpha) : hex(pal.hair);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        for (let i = 0; i <= 26; i++) {
          const yaw = FP[0] + (FP[1] - FP[0]) * (i / 26);
          const q = P(yaw, hl - 0.08 * C(yaw * 1.4) + 0.12 * Math.max(0, Math.abs(yaw) - 0.9));
          ctx.lineTo(q[0], q[1]);
        }
        ctx.lineTo(w, 0);
        ctx.closePath();
        ctx.fill();
      }
      if (cls === 'man' && (pal.stubble || pal.goatee || ex.stubble)) {
        const g = window.P3D.rand(17);
        ctx.fillStyle = 'rgba(40,30,25,0.35)';
        for (let i = 0; i < (pal.goatee ? 90 : 520); i++) {
          const yaw = (g() - 0.5) * 1.9, pit = -0.25 - g() * 0.75;
          if (Math.abs(yaw) < 0.3 && pit > -0.62 && pit < -0.42) continue;
          if (Math.abs(yaw) > 0.95 - (pit + 1) * 0.3) continue;
          const q = P(yaw, pit);
          ctx.fillRect(q[0], q[1], 2, 2);
        }
      }
      if (cls === 'man' && pal.goatee) {
        ctx.fillStyle = 'rgba(30,22,18,0.85)';
        const a = P(0, -0.47), c2 = P(0, -0.78);
        ctx.beginPath();
        ctx.ellipse(a[0], a[1], 0.3 * sx, 0.06 * sy, 0, 0, PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(c2[0], c2[1], 0.16 * sx, 0.14 * sy, 0, 0, PI * 2);
        ctx.fill();
      }
      if (cls === 'man' && pal.eyeShadow) {
        ctx.fillStyle = 'rgba(20,14,12,0.7)';
        [-1, 1].forEach(s => {
          const q = P(s * 0.36, 0.1);
          ctx.beginPath();
          ctx.ellipse(q[0], q[1], 0.24 * sx, 0.16 * sy, 0, 0, PI * 2);
          ctx.fill();
        });
      }
      const shadeG = ctx.createRadialGradient(...P(0, -0.05), 0, ...P(0, -0.05), 1.2 * sx);
      shadeG.addColorStop(0, 'rgba(255,240,220,0.08)');
      shadeG.addColorStop(0.6, 'rgba(0,0,0,0)');
      shadeG.addColorStop(1, 'rgba(60,20,10,0.22)');
      ctx.fillStyle = shadeG;
      ctx.fillRect(0, 0, w, h);
      const eyeY = cls === 'heavy' ? 0.1 : 0.12;
      const eyeX = { heavy: 0.31, scout: 0.36, soldier: 0.35, demo: 0.36, engineer: 0.36, medic: 0.34, sniper: 0.34, spy: 0.36 }[cls] || 0.36;
      const browCol = { heavy: 0x2a1c14, scout: 0x2a1c12, soldier: 0x2a1e16, demo: 0x1a1412, engineer: 0x4a3626, medic: 0x2a2018, sniper: 0x3a2818, spy: 0x2a1c14 }[cls] || 0x2a1c14;
      const eyes = ex.eyes || 'open';
      const brows = ex.brows || 'flat';
      const lk = (ex.look || 0) * 0.04;
      [-1, 1].forEach(s => {
        const [x, y] = P(s * eyeX, eyeY - 0.01);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 0.24 * sx);
        g.addColorStop(0, 'rgba(90,40,25,0.42)');
        g.addColorStop(0.55, 'rgba(90,40,25,0.22)');
        g.addColorStop(1, 'rgba(90,40,25,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 0.3 * sx, y - 0.3 * sy, 0.6 * sx, 0.6 * sy);
      });
      if (cls !== 'soldier' && cls !== 'engineer') {
        [-1, 1].forEach(s => {
          const [x, y] = P(s * eyeX, eyeY);
          const rw = (cls === 'heavy' ? 0.11 : 0.13) * sx;
          let rh = (eyes === 'wide' || eyes === 'crazy' ? 0.12 : eyes === 'half' ? 0.045 : eyes === 'angry' ? 0.055 : 0.08) * sy;
          if (eyes === 'shut') {
            ctx.strokeStyle = hex(browCol);
            ctx.lineWidth = 0.022 * sy;
            ctx.beginPath();
            ctx.moveTo(x - rw, y);
            ctx.quadraticCurveTo(x, y + rh * 0.7, x + rw, y);
            ctx.stroke();
            return;
          }
          ctx.fillStyle = '#f2ece2';
          ctx.beginPath();
          ctx.ellipse(x, y, rw, rh, 0, 0, PI * 2);
          ctx.fill();
          const pr = (eyes === 'crazy' ? 0.03 : 0.05) * sx;
          ctx.fillStyle = pal.eye || (cls === 'demo' ? '#3a2a1a' : '#4a5e70');
          ctx.beginPath();
          ctx.arc(x + lk * sx * 4, y, Math.min(pr * 1.4, rh * 1.1), 0, PI * 2);
          ctx.fill();
          ctx.fillStyle = '#100c0a';
          ctx.beginPath();
          ctx.arc(x + lk * sx * 4, y, Math.min(pr * 0.7, rh * 0.8), 0, PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(40,20,10,0.9)';
          ctx.lineWidth = 0.028 * sy;
          ctx.beginPath();
          ctx.ellipse(x, y, rw, rh, 0, PI * 1.02, PI * 1.98);
          ctx.stroke();
          ctx.lineWidth = 0.012 * sy;
          ctx.beginPath();
          ctx.ellipse(x, y, rw, rh, 0, PI * 0.1, PI * 0.9);
          ctx.stroke();
        });
        if (cls === 'demo') {
          const [x, y] = P(0.34, eyeY);
          ctx.fillStyle = '#141210';
          ctx.beginPath();
          ctx.ellipse(x, y, 0.13 * sx, 0.1 * sy, 0, 0, PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#141210';
          ctx.lineWidth = 0.03 * sy;
          ctx.beginPath();
          ctx.moveTo(...P(0.05, 0.5));
          ctx.lineTo(...P(1.3, -0.1));
          ctx.stroke();
        }
      }
      if (cls !== 'soldier') {
        [-1, 1].forEach(s => {
          const lift = brows === 'up' ? 0.07 : brows === 'raise' && s > 0 ? 0.08 : 0;
          const tilt = brows === 'angry' ? -0.06 : brows === 'sad' ? 0.05 : 0;
          const thick = cls === 'heavy' ? 0.075 : 0.055;
          const a = P(s * (eyeX + 0.17), eyeY + 0.15 + lift + (cls === 'heavy' ? -0.03 : 0));
          const c = P(s * (eyeX - 0.14), eyeY + 0.16 + lift + tilt);
          ctx.strokeStyle = hex(browCol);
          ctx.lineCap = 'round';
          ctx.lineWidth = thick * sy;
          ctx.beginPath();
          ctx.moveTo(a[0], a[1]);
          ctx.lineTo(c[0], c[1]);
          ctx.stroke();
        });
      }
      const mouth = ex.mouth || 'shut';
      const open = clamp(ex.open || 0, 0, 1);
      const mY = cls === 'heavy' ? -0.5 : -0.52;
      const mW = { heavy: 0.34, scout: 0.3, soldier: 0.36, demo: 0.3, engineer: 0.34, medic: 0.28, sniper: 0.28, spy: 0.28 }[cls] || 0.3;
      const [mx, my] = P(0, mY);
      const mw = mW * sx;
      ctx.lineCap = 'round';
      if (mouth === 'grin' || mouth === 'smile') {
        const hgt = (mouth === 'grin' ? 0.12 + open * 0.1 : 0.05) * sy;
        ctx.fillStyle = '#3a1410';
        ctx.beginPath();
        ctx.moveTo(mx - mw * 1.25, my - hgt * 0.3);
        ctx.quadraticCurveTo(mx, my + hgt * 2.2, mx + mw * 1.25, my - hgt * 0.3);
        ctx.quadraticCurveTo(mx, my + hgt * 0.3, mx - mw * 1.25, my - hgt * 0.3);
        ctx.fill();
        if (mouth === 'grin') {
          ctx.fillStyle = '#f4efe4';
          ctx.beginPath();
          ctx.moveTo(mx - mw * 1.1, my - hgt * 0.15);
          ctx.quadraticCurveTo(mx, my + hgt * 0.9, mx + mw * 1.1, my - hgt * 0.15);
          ctx.quadraticCurveTo(mx, my + hgt * 0.4, mx - mw * 1.1, my - hgt * 0.15);
          ctx.fill();
        }
      } else if (mouth === 'scream' || mouth === 'o' || (mouth === 'open' && open > 0.05)) {
        const k = mouth === 'scream' ? 0.6 + open * 0.4 : mouth === 'o' ? 0.5 : open;
        const rw = mouth === 'o' ? mw * 0.45 : mw * (0.75 + k * 0.25);
        const rh = (0.03 + k * 0.17) * sy;
        ctx.fillStyle = '#2a0e0c';
        ctx.beginPath();
        ctx.ellipse(mx, my + rh * 0.4, rw, rh, 0, 0, PI * 2);
        ctx.fill();
        if (mouth !== 'o') {
          ctx.fillStyle = '#efe8dc';
          ctx.fillRect(mx - rw * 0.7, my + rh * 0.4 - rh, rw * 1.4, rh * 0.3);
          ctx.fillStyle = '#9a3a34';
          ctx.beginPath();
          ctx.ellipse(mx, my + rh * 1.0, rw * 0.6, rh * 0.35, 0, 0, PI * 2);
          ctx.fill();
        }
      } else if (mouth === 'teeth') {
        ctx.fillStyle = '#efe8dc';
        ctx.fillRect(mx - mw, my - 0.035 * sy, mw * 2, 0.07 * sy);
        ctx.strokeStyle = '#4a2a20';
        ctx.lineWidth = 0.012 * sy;
        ctx.strokeRect(mx - mw, my - 0.035 * sy, mw * 2, 0.07 * sy);
        ctx.beginPath();
        ctx.moveTo(mx - mw, my);
        ctx.lineTo(mx + mw, my);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(70,30,22,0.9)';
        ctx.lineWidth = 0.025 * sy;
        const curve = mouth === 'frown' ? -0.04 : mouth === 'smirk' ? 0.03 : 0.0;
        ctx.beginPath();
        ctx.moveTo(mx - mw, my - curve * sy);
        ctx.quadraticCurveTo(mx, my + curve * sy * 1.5, mx + mw, my - (mouth === 'smirk' ? 0.07 : curve) * sy);
        ctx.stroke();
      }
      if (cls === 'engineer' || cls === 'soldier' || cls === 'heavy') {
        ctx.fillStyle = 'rgba(80,60,50,0.18)';
        ctx.beginPath();
        ctx.ellipse(mx, my - 0.05 * sy, mw * 1.6, 0.3 * sy, 0, 0, PI);
        ctx.fill();
      }
      if (ex.beard) {
        ctx.fillStyle = 'rgba(150,140,128,0.55)';
        const [bx, by] = P(0, -0.62);
        ctx.beginPath();
        ctx.ellipse(bx, by, 0.62 * sx, 0.4 * sy, 0, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(120,110,100,0.5)';
        for (let i = 0; i < 160; i++) {
          const a = (i * 2.399) % (PI * 2), rr = ((i * 0.618) % 1) * 0.55;
          const [qx, qy] = P(S(a) * rr, -0.6 + C(a) * rr * 0.6);
          ctx.fillRect(qx, qy, 2, 2);
        }
      }
      if (cls === 'sniper') {
        ctx.fillStyle = 'rgba(70,46,26,0.8)';
        [-1, 1].forEach(s => {
          const [x, y] = P(s * 0.95, -0.15);
          ctx.fillRect(x - 0.08 * sx, y - 0.25 * sy, 0.16 * sx, 0.42 * sy);
        });
      }
    };
  }

  const FXL = (w, fx) => (0.5 + fx * 0.25) * w;
  const VY = (h, v) => (1 - v) * h;

  function grime(ctx, w, h, seed, col, n) {
    const g = window.P3D.rand(seed);
    for (let i = 0; i < (n || 160); i++) {
      ctx.fillStyle = `rgba(${col},${0.05 + g() * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 2 + g() * 9, 1 + g() * 6, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function camo(ctx, w, h, cols, seed) {
    ctx.fillStyle = hex(cols[0]);
    ctx.fillRect(0, 0, w, h);
    const g = window.P3D.rand(seed || 3);
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = hex(cols[1 + Math.floor(g() * (cols.length - 1))]);
      ctx.beginPath();
      ctx.ellipse(g() * w, g() * h, 6 + g() * 16, 4 + g() * 9, g() * PI, 0, PI * 2);
      ctx.fill();
    }
  }

  function openFront(ctx, w, h, half, col, v0, v1) {
    ctx.fillStyle = hex(col);
    ctx.fillRect(FXL(w, -half), VY(h, v1), FXL(w, half) - FXL(w, -half), VY(h, v0) - VY(h, v1));
  }

  function paintWith(fn) {
    return (pal) => (ctx, w, h) => {
      fn(ctx, w, h, pal);
      shadeTorso(ctx, w, h);
    };
  }

  const paintAssassin = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = hex(pal.sleeve);
    ctx.fillRect(0, 0, w, h);
    grime(ctx, w, h, 11, '120,120,110', 60);
    openFront(ctx, w, h, 0.3, 0x1a1a1c, 0.05, 1);
    ctx.fillStyle = '#b82a26';
    [-1, 1].forEach(s => ctx.fillRect(FXL(w, s * 0.3) - (s > 0 ? 0 : 5), 0, 5, h));
    ctx.fillStyle = '#6a6a70';
    ctx.beginPath();
    ctx.moveTo(FXL(w, -0.14), VY(h, 0.78));
    ctx.lineTo(FXL(w, 0.14), VY(h, 0.78));
    ctx.lineTo(FXL(w, 0.0), VY(h, 0.56));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c83a32';
    ctx.fillRect(FXL(w, -0.03), VY(h, 0.74), FXL(w, 0.03) - FXL(w, -0.03), VY(h, 0.6) - VY(h, 0.74));
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    [-1, 1].forEach(s => ctx.fillRect(FXL(w, s * 0.62) - 14, VY(h, 0.32), 28, VY(h, 0.12) - VY(h, 0.32)));
  });

  const paintSam = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = hex(pal.sleeve);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2c2c30';
    [-1, 1].forEach(s => ctx.fillRect(FXL(w, s * 0.38) - 5, 0, 10, h));
    ctx.fillRect(0, VY(h, 0.16), w, VY(h, 0.08) - VY(h, 0.16));
    ctx.fillStyle = '#242428';
    [-0.55, -0.2, 0.2, 0.55].forEach(x => ctx.fillRect(FXL(w, x) - 9, VY(h, 0.7), 18, 16));
    ctx.fillStyle = '#3a3a40';
    ctx.fillRect(FXL(w, 1.5) - 22, VY(h, 0.85), 44, VY(h, 0.35) - VY(h, 0.85));
  });

  const paintKnight = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = hex(pal.sleeve);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(20,20,24,0.55)';
    for (let y = 0; y < h; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < w; x += 4) ctx.fillRect(x, y, 2, 2);
    ctx.fillStyle = '#121214';
    ctx.fillRect(FXL(w, -0.62), VY(h, 0.96), FXL(w, 0.62) - FXL(w, -0.62), h);
    ctx.fillRect(FXL(w, 1.38), VY(h, 0.96), FXL(w, 2.62) - FXL(w, 1.38), h);
    const cx = FXL(w, 0), cy = VY(h, 0.58), s = w * 0.07;
    ctx.fillStyle = '#b8241c';
    ctx.beginPath();
    ctx.ellipse(cx, cy, s * 0.9, s * 0.55, -0.3, 0, PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + s * 0.55, cy - s * 0.6, s * 0.35, s * 0.32, 0, 0, PI * 2);
    ctx.fill();
    ctx.lineWidth = s * 0.22;
    ctx.strokeStyle = '#b8241c';
    ctx.lineCap = 'round';
    [[0.6, -0.4, 1.1, -1.0], [0.3, -0.3, 0.7, -1.1], [-0.5, 0.3, -0.8, 0.9], [0.4, 0.3, 0.5, 0.95], [-0.8, -0.1, -1.3, -0.7]].forEach(([a, b, c, d]) => {
      ctx.beginPath();
      ctx.moveTo(cx + a * s, cy + b * s);
      ctx.lineTo(cx + c * s, cy + d * s);
      ctx.stroke();
    });
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(0, VY(h, 0.12), w, VY(h, 0.04) - VY(h, 0.12));
  });

  const paintBeanie = paintWith((ctx, w, h, pal) => {
    camo(ctx, w, h, [0x2e3428, 0x3a4232, 0x22281e, 0x45443a], 5);
    ctx.fillStyle = '#25262a';
    ctx.fillRect(FXL(w, -0.7), VY(h, 0.88), FXL(w, 0.7) - FXL(w, -0.7), VY(h, 0.2) - VY(h, 0.88));
    ctx.fillRect(FXL(w, 1.3), VY(h, 0.88), FXL(w, 2.7) - FXL(w, 1.3), VY(h, 0.2) - VY(h, 0.88));
    ctx.fillStyle = '#1c1d20';
    [-0.45, -0.15, 0.15, 0.45].forEach(x => ctx.fillRect(FXL(w, x) - 10, VY(h, 0.5), 20, 20));
    ctx.fillRect(FXL(w, -0.04), VY(h, 0.88), 6, VY(h, 0.2) - VY(h, 0.88));
  });

  const paintDrake = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = hex(pal.sleeve);
    ctx.fillRect(0, 0, w, h);
    grime(ctx, w, h, 21, '40,20,10', 90);
    openFront(ctx, w, h, 0.36, 0xd8d2c4, 0.0, 1);
    grime(ctx, FXL(w, 0.36) * 2, h, 22, '90,70,40', 40);
    ctx.strokeStyle = '#4a3018';
    ctx.lineWidth = w * 0.028;
    ctx.beginPath();
    ctx.moveTo(FXL(w, -0.55), VY(h, 1));
    ctx.lineTo(FXL(w, 0.55), VY(h, 0.25));
    ctx.stroke();
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(0, VY(h, 0.1), w, VY(h, 0.02) - VY(h, 0.1));
  });

  const paintFrank = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = hex(pal.sleeve);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    [-0.8, 0.8].forEach(x => ctx.fillRect(FXL(w, x) - 6, 0, 12, h));
    openFront(ctx, w, h, 0.26, 0xb8c4cc, 0.08, 1);
    ctx.fillStyle = '#e8eef2';
    ctx.beginPath();
    ctx.moveTo(FXL(w, -0.24), VY(h, 1));
    ctx.lineTo(FXL(w, 0), VY(h, 0.86));
    ctx.lineTo(FXL(w, 0.24), VY(h, 1));
    ctx.fill();
  });

  const paintThug = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = '#141416';
    ctx.fillRect(0, 0, w, h);
    openFront(ctx, w, h, 0.34, 0xc8c2b8, 0.06, 1);
    ctx.fillStyle = '#2a2a2e';
    [-1, 1].forEach(s => ctx.fillRect(FXL(w, s * 0.34) - 3, 0, 6, h));
    ctx.fillStyle = 'rgba(70,40,30,0.35)';
    ctx.fillRect(FXL(w, -0.2), VY(h, 1), FXL(w, 0.2) - FXL(w, -0.2), VY(h, 0.9) - VY(h, 1));
  });

  const paintAgent = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = hex(pal.sleeve);
    ctx.fillRect(0, 0, w, h);
    grime(ctx, w, h, 31, '90,70,30', 50);
    ctx.fillStyle = '#7a6a40';
    ctx.fillRect(FXL(w, -0.01), VY(h, 1), 3, h);
    ctx.fillStyle = '#b83228';
    [-1, 1].forEach(s => ctx.fillRect(FXL(w, s * 0.42) - 6, 0, 12, VY(h, 0.2)));
    ctx.fillStyle = '#5a6a80';
    ctx.fillRect(0, VY(h, 0.06), w, h - VY(h, 0.06));
  });

  const paintGuard = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = hex(pal.sleeve);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#e8eaee';
    ctx.beginPath();
    ctx.moveTo(FXL(w, -0.2), VY(h, 0.99));
    ctx.lineTo(FXL(w, 0.2), VY(h, 0.99));
    ctx.lineTo(FXL(w, 0.04), VY(h, 0.5));
    ctx.lineTo(FXL(w, -0.04), VY(h, 0.5));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1c24';
    ctx.fillRect(FXL(w, -0.025), VY(h, 0.96), FXL(w, 0.025) - FXL(w, -0.025), VY(h, 0.56) - VY(h, 0.96));
  });

  const paintTrooper = paintWith((ctx, w, h) => {
    camo(ctx, w, h, [0x4a5236, 0x5c6442, 0x343a26, 0x6a6448], 9);
    ctx.fillStyle = '#3a4030';
    ctx.fillRect(FXL(w, -0.65), VY(h, 0.9), FXL(w, 0.65) - FXL(w, -0.65), VY(h, 0.25) - VY(h, 0.9));
    ctx.fillStyle = '#2c3224';
    [-0.4, 0, 0.4].forEach(x => ctx.fillRect(FXL(w, x) - 10, VY(h, 0.55), 20, 22));
  });

  const paintCiv = paintWith((ctx, w, h, pal) => {
    ctx.fillStyle = hex(pal.sleeve);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(FXL(w, 0), VY(h, 1), w * 0.06, h * 0.05, 0, 0, PI * 2);
    ctx.fill();
    ctx.fillStyle = hex(pal.pants);
    ctx.fillRect(0, VY(h, 0.06), w, h - VY(h, 0.06));
  });

  function chestHood(b, pal) {
    const ring = [];
    for (let i = 0; i <= 12; i++) {
      const a = PI * 0.15 + (i / 12) * PI * 1.7;
      ring.push([S(a) * 0.12, 0.45 + Math.max(0, -C(a)) * 0.05, C(a) * 0.1 - 0.02]);
    }
    K.tube(b, ring, ring.map(() => 0.045), 7, pal.sleeve);
    b.at(0, 0.36, -0.13, h => h.ellipsoid(0.1, 0.11, 0.05, 9, 6, pal.sleeve));
    b.at(0, 0.37, -0.11, h => h.ellipsoid(0.07, 0.08, 0.04, 8, 5, 0xa82422));
  }

  function chestBackpack(b) {
    b.at(0, 0.2, -0.17, h => h.box(0.26, 0.32, 0.12, 0xb83228));
    b.at(0, 0.12, -0.235, h => h.box(0.2, 0.12, 0.03, 0x9a2820));
  }

  function chestHarness(b) {
    b.at(0, 0.18, -0.15, h => h.box(0.18, 0.22, 0.06, 0x26262a));
    [-0.08, 0.08].forEach(x => b.at(x, 0.12, 0.14, h => h.box(0.06, 0.07, 0.04, 0x2a2a2e)));
  }

  function chestVest(b) {
    [-0.12, -0.04, 0.04, 0.12].forEach(x => b.at(x, 0.2, 0.135, h => h.box(0.06, 0.08, 0.04, 0x232428)));
  }

  function chestCollar(b, pal) {
    [-1, 1].forEach(s => b.at(s * 0.06, 0.45, 0.07, h => { h.push(M4.rotZ(-s * 0.4), M4.rotX(-0.3)); h.box(0.06, 0.07, 0.015, pal.sleeve); h.pop(); }));
  }

  function hipsTabard(b) {
    [-1, 1].forEach(s => b.at(0, -0.2, s * 0.13, h => h.box(0.26, 0.4, 0.02, 0x121214)));
  }

  function foreBracer(b) {
    b.at(0, -0.17, 0, h => h.prism(10, 0.05, 0.05, -0.1, 0.046, 0.046, 0.1, 0x1c1816, { capBottom: true }));
    b.at(0, -0.17, -0.045, h => h.box(0.03, 0.16, 0.012, 0x6a6a70));
  }

  const LOOKS = {
    assassin: { pal: { skin: 0xe2b08e, hair: 0x2a1e16, hairLine: 0.5, stubble: true, eye: '#5a4630', sleeve: 0xeeeeea, pants: 0x2e3440, boot: 0x2a2520, belt: 0x2a2018 }, paint: paintAssassin, chest: chestHood, foreL: foreBracer },
    sam: { pal: { skin: 0xd8a888, hair: 0x1e1814, hairLine: 0.52, stubble: true, eye: '#3a4a3a', sleeve: 0x1c1c1e, pants: 0x202024, boot: 0x141414, gloves: true, glove: 0x18181a, belt: 0x161616 }, paint: paintSam, chest: chestHarness, hat: 'nvgUp' },
    knight: { pal: { skin: 0xd8a888, sleeve: 0x45464c, pants: 0x3a3b40, boot: 0x1a1a1c, gloves: true, glove: 0x1c1c1e, belt: 0x2a2018, neck: 0x45464c }, paint: paintKnight, hat: 'greathelm', hips: hipsTabard },
    beanie: { pal: { skin: 0xc89a7a, hair: 0x2a2018, hairLine: 0.45, stubble: true, eye: '#3a2a1a', sleeve: 0x2e3428, pants: 0x2a2a26, boot: 0x1a1816, gloves: true, glove: 0x1a1a1a }, paint: paintBeanie, chest: chestVest, hat: 'beanie' },
    drake: { pal: { skin: 0xd8a080, hair: 0x2a1e14, hairLine: 0.48, stubble: true, eye: '#4a3a24', sleeve: 0x7a2a22, pants: 0x7a8a9c, boot: 0x4a3626, belt: 0x4a3018, foreCols: [[0, 0x7a2a22], [0.45, 0xd8a080]] }, paint: paintDrake },
    frank: { pal: { skin: 0xd8a888, hair: 0x241a12, hairLine: 0.4, eye: '#3a2a1a', sleeve: 0x1a1a1c, pants: 0x6a5a42, boot: 0x2a2018 }, paint: paintFrank, chest: chestCollar },
    thug: { pal: { skin: 0xc0906e, hair: 0x2a2420, hairLine: 0.55, hairAlpha: 0.55, goatee: true, eyeShadow: true, eye: '#2a1e14', sleeve: 0x7a5a48, pants: 0x2a2c30, boot: 0x1a1a1a, gloves: true, fingerless: true, glove: 0x1a1a1a, upperCols: [[0, 0x8a6a54], [0.3, 0x6a4a3a], [0.6, 0x8a6a54]], foreCols: [[0, 0x7a5a48], [0.5, 0x6a4a3a], [0.85, 0x1a1a1a]] }, paint: paintThug },
    agent: { pal: { skin: 0xe0b090, hair: 0x4a3420, hairLine: 0.5, eye: '#4a3a2a', sleeve: 0xc8b47a, pants: 0x5a6a80, boot: 0x3a2a1e }, paint: paintAgent, chest: chestBackpack },
    guard: { pal: { skin: 0xd8a888, hair: 0x2a2018, hairLine: 0.5, sleeve: 0x22242a, pants: 0x22242a, boot: 0x141414 }, paint: paintGuard },
    guard2: { pal: { skin: 0xb88466, hair: 0x141210, hairLine: 0.55, sleeve: 0x2a2c34, pants: 0x2a2c34, boot: 0x141414 }, paint: paintGuard },
    trooper: { pal: { skin: 0xc89a7a, sleeve: 0x4a5236, pants: 0x4a5236, boot: 0x2a2620, gloves: true, glove: 0x2a2a26 }, paint: paintTrooper, hat: 'helmet' },
    civ1: { pal: { skin: 0xe0b090, hair: 0x5a3a20, sleeve: 0x3a6ab8, pants: 0x3a3e48 }, paint: paintCiv },
    civ2: { pal: { skin: 0xc8946c, hair: 0x1a1410, sleeve: 0xc84a3a, pants: 0x5a5040 }, paint: paintCiv },
    civ3: { pal: { skin: 0xe8c0a0, hair: 0xb88a4a, hairLine: 0.3, sleeve: 0xe8e2d0, pants: 0x2a3a5a }, paint: paintCiv },
    civ4: { pal: { skin: 0x8a5a40, hair: 0x141210, sleeve: 0x4a8a4a, pants: 0x3a3a3a }, paint: paintCiv },
    civ5: { pal: { skin: 0xe0b090, hair: 0x2a1e14, hairLine: 0.3, sleeve: 0x8a3a8a, pants: 0x1a1a1a }, paint: paintCiv },
    civ6: { pal: { skin: 0xd8a888, hair: 0x6a6a6a, sleeve: 0xc8a83a, pants: 0x4a4a5a }, paint: paintCiv }
  };

  function buildHardhat(b, H) {
    b.at(0, H.ry * 0.55, 0.0, h => {
      dome(h, H.rx * 1.12, H.ry * 0.62, H.rz * 1.12, 12, 6, 0xe8b72a);
      h.prism(16, H.rx * 1.3, H.rz * 1.38, -0.004, H.rx * 1.3, H.rz * 1.38, 0.008, 0xd9a823);
      h.at(0, 0.02, 0, q => q.box(0.018, H.ry * 0.55, H.rz * 2.1, 0xd29e20));
    });
  }

  function buildGoggles(b, H, onEyes) {
    const y = onEyes ? 0.012 : H.ry * 0.58;
    [-1, 1].forEach(s => {
      const p = headPt(H, s * 0.36, onEyes ? 0.12 : 0.62, 1.02);
      b.at(p[0], onEyes ? p[1] : y, p[2] + 0.006, h => {
        h.push(M4.rotY(s * 0.34), M4.rotX(PI / 2));
        h.prism(12, 0.034, 0.034, -0.012, 0.03, 0.03, 0.016, 0x2a2724);
        h.at(0, 0.018, 0, q => q.prism(12, 0.026, 0.026, -0.002, 0.026, 0.026, 0.002, 0x101012));
        h.pop();
      });
    });
    const p = headPt(H, 0, onEyes ? 0.12 : 0.62, 1.0);
    b.at(0, onEyes ? p[1] : y, 0, h => h.prism(18, H.rx * 1.06, H.rz * 1.08, -0.012, H.rx * 1.06, H.rz * 1.08, 0.012, 0x221e1b));
  }

  function brim(b, rIn, rOut, rz, curl, droop, col, sides) {
    const n = sides || 24;
    const y = (a, k) => curl * Math.pow(Math.abs(S(a)), 2.2) * k - droop * Math.max(0, C(a)) * k * 0.6;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const P0 = (a, rr, k) => [S(a) * rr, y(a, k), C(a) * rr * rz];
      const A = P0(a0, rIn, 0), B = P0(a1, rIn, 0), Cc = P0(a1, rOut, 1), Dd = P0(a0, rOut, 1);
      b.quad(A, B, Cc, Dd, col, null, [N_UP, N_UP, N_UP, N_UP]);
      b.quad(Dd, Cc, B, A, shade(col, 0.82), null, [N_DN, N_DN, N_DN, N_DN]);
    }
  }

  function buildCowboy(b, H, col) {
    b.at(0, H.ry * 0.66, -0.005, h => {
      brim(h, H.rx * 0.95, H.rx * 2.3, 1.05, 0.06, 0.012, col);
      h.prism(16, H.rx * 1.06, H.rz * 1.08, 0.0, H.rx * 0.98, H.rz * 1.0, 0.13, col);
      h.prism(16, H.rx * 1.08, H.rz * 1.1, 0.0, H.rx * 1.08, H.rz * 1.1, 0.03, 0x4a3a2a);
      h.at(0, 0.13, 0, q => q.prism(16, H.rx * 0.98, H.rz * 1.0, 0.0, H.rx * 0.5, H.rz * 0.8, 0.03, shade(col, 0.92)));
    });
  }

  function buildCap(b, H, col) {
    b.at(0, H.ry * 0.42, -0.005, h => {
      dome(h, H.rx * 1.08, H.ry * 0.6, H.rz * 1.1, 12, 6, col);
      h.at(0, 0.0, H.rz * 1.0, q => { q.push(M4.rotX(0.12)); q.box(H.rx * 1.5, 0.012, H.rz * 0.9, shade(col, 0.85)); q.pop(); });
    });
    const p = headPt(H, -1.5, 0.05, 1.02);
    b.at(p[0], p[1], p[2], h => h.box(0.03, 0.05, 0.04, 0x1a1a1a));
    b.at(p[0] - 0.01, p[1] - 0.06, p[2] + 0.06, h => { h.push(M4.rotX(-0.9)); h.box(0.008, 0.008, 0.11, 0x1a1a1a); h.pop(); });
  }

  function buildHelmet(b, H) {
    b.at(0, -H.ry * 0.02, -0.004, h => {
      dome(h, H.rx * 1.3, H.ry * 1.32, H.rz * 1.34, 14, 8, 0x5b573a);
      h.prism(18, H.rx * 1.42, H.rz * 1.48, -0.01, H.rx * 1.36, H.rz * 1.42, 0.006, 0x4e4a32);
    });
  }

  function buildSlouch(b, H, col) {
    b.at(0, H.ry * 0.62, -0.005, h => {
      h.prism(18, H.rx * 2.0, H.rz * 2.0, -0.006, H.rx * 2.05, H.rz * 2.05, 0.004, col);
      h.at(H.rx * 1.6, 0.03, 0, q => { q.push(M4.rotZ(-0.9)); q.box(H.rx * 0.7, 0.01, H.rz * 2.6, col); q.pop(); });
      h.prism(14, H.rx * 1.06, H.rz * 1.08, 0.0, H.rx * 0.9, H.rz * 0.95, 0.1, col);
      h.prism(14, H.rx * 1.08, H.rz * 1.1, 0.0, H.rx * 1.06, H.rz * 1.08, 0.025, 0x3a2a1c);
    });
  }

  function buildParty(b, H, col) {
    b.at(-H.rx * 0.2, H.ry * 0.85, 0.0, h => {
      h.push(M4.rotZ(0.25));
      h.prism(12, 0.045, 0.045, 0.0, 0.002, 0.002, 0.15, col);
      h.at(0, 0.03, 0, q => q.prism(12, 0.04, 0.04, 0.0, 0.034, 0.034, 0.012, 0xf2d24a));
      h.at(0, 0.08, 0, q => q.prism(12, 0.022, 0.022, 0.0, 0.019, 0.019, 0.01, 0xf2d24a));
      h.pop();
    });
  }

  function buildHorned(b, H) {
    b.at(0, H.ry * 0.25, -0.005, h => {
      dome(h, H.rx * 1.18, H.ry * 0.92, H.rz * 1.2, 12, 7, 0x8a8c8e);
      h.prism(16, H.rx * 1.2, H.rz * 1.22, -0.03, H.rx * 1.2, H.rz * 1.22, 0.02, 0x6c6e70);
      [-1, 1].forEach(s => {
        const pts = [[s * H.rx * 1.0, 0.04, 0], [s * H.rx * 1.6, 0.08, 0.02], [s * H.rx * 2.0, 0.16, 0.05], [s * H.rx * 2.05, 0.26, 0.08]];
        K.tube(h, pts, [0.032, 0.026, 0.016, 0.004], 7, 0xe9dcbc);
      });
    });
  }

  function buildFurcap(b, H) {
    b.at(0, H.ry * 0.5, 0, h => {
      h.prism(14, H.rx * 1.18, H.rz * 1.2, -0.03, H.rx * 1.18, H.rz * 1.2, 0.03, 0xe4e0d4);
      h.prism(14, H.rx * 1.05, H.rz * 1.08, 0.02, H.rx * 1.12, H.rz * 1.14, 0.12, 0x3d5a2a);
      h.at(0, 0.12, 0, q => q.ellipsoid(H.rx * 1.12, 0.03, H.rz * 1.14, 10, 4, 0x4a6a32));
    });
  }

  function buildKnit(b, H) {
    b.at(0, H.ry * 0.42, 0, h => {
      h.prism(14, H.rx * 1.16, H.rz * 1.18, -0.03, H.rx * 1.16, H.rz * 1.18, 0.035, 0x9a9690);
      dome(h, H.rx * 1.05, H.ry * 0.62, H.rz * 1.08, 12, 6, 0xa04030);
      h.at(0, H.ry * 0.62, 0, q => q.ellipsoid(0.05, 0.045, 0.05, 8, 5, 0x8a6a4a));
    });
  }

  function buildLights(b, H) {
    buildGoggles(b, H, true);
    const cols = [0xff4040, 0x40ff60, 0xffd040, 0x5080ff, 0xff60ff, 0x40e0ff];
    const N = 14;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * PI * 2;
      const r = 1.18 + 0.1 * S(a * 3);
      const y = H.ry * (0.45 + 0.12 * S(a * 2 + 1));
      b.at(S(a) * H.rx * r, y, C(a) * H.rz * r, h => {
        h.box(0.012, 0.012, 0.012, 0x1c2a1a);
        h.at(0, 0.022, 0, q => q.ellipsoid(0.011, 0.02, 0.011, 6, 4, rgb(cols[i % cols.length], 0.85)));
      });
    }
    b.at(0, H.ry * 0.45, 0, h => h.prism(18, H.rx * 1.19, H.rz * 1.19, -0.006, H.rx * 1.19, H.rz * 1.19, 0.006, 0x1c2a1a));
  }

  function buildShades(b, H) {
    [-1, 1].forEach(s => {
      const p = headPt(H, s * 0.33, 0.1, 1.04);
      b.at(p[0], p[1], p[2] + 0.004, h => { h.push(M4.rotY(s * 0.3)); h.box(0.07, 0.04, 0.008, 0x0c0c0e); h.pop(); });
    });
    const p = headPt(H, 0, 0.12, 1.05);
    b.at(0, p[1] + 0.008, p[2], h => h.box(0.04, 0.008, 0.008, 0x0c0c0e));
    b.at(0, p[1] + 0.008, 0, h => h.prism(18, H.rx * 1.04, H.rz * 1.04, -0.004, H.rx * 1.04, H.rz * 1.04, 0.004, 0x0c0c0e));
  }

  function buildGlasses(b, H, col) {
    [-1, 1].forEach(s => {
      const p = headPt(H, s * 0.33, 0.12, 1.05);
      b.at(p[0], p[1], p[2] + 0.004, h => {
        h.push(M4.rotY(s * 0.3), M4.rotX(PI / 2));
        h.prism(12, 0.034, 0.034, -0.002, 0.034, 0.034, 0.002, col || 0x2a2a2a);
        h.at(0, 0.003, 0, q => q.prism(12, 0.028, 0.028, -0.001, 0.028, 0.028, 0.001, rgb(0xd8e4e8)));
        h.pop();
      });
    });
    const p = headPt(H, 0, 0.12, 1.06);
    b.at(0, p[1] + 0.006, p[2], h => h.box(0.03, 0.006, 0.006, col || 0x2a2a2a));
  }

  function buildHood(b, H, col) {
    b.at(0, -0.01, -0.012, h => {
      dome(h, H.rx * 1.32, H.ry * 1.28, H.rz * 1.3, 14, 8, col);
      h.prism(16, H.rx * 1.32, H.rz * 1.3, -0.16, H.rx * 1.32, H.rz * 1.3, 0.0, col, { skip: [0, 1, 15], capTop: false });
    });
  }

  function buildEyeball(b, H) {
    b.at(0, H.ry * 0.25, 0.01, h => {
      h.ellipsoid(H.rx * 1.75, H.ry * 1.45, H.rz * 1.65, 16, 12, 0xf2eee6);
      h.at(0, 0.02, H.rz * 1.62, q => q.prism(16, 0.075, 0.075, -0.004, 0.075, 0.075, 0.004, 0x5a7a3a, { phase: 0 }));
      h.at(0, 0.02, H.rz * 1.645, q => { q.push(M4.rotX(PI / 2)); q.prism(14, 0.04, 0.04, -0.003, 0.04, 0.04, 0.003, 0x0e0e0e); q.pop(); });
      h.at(0, H.ry * 1.42, -0.01, q => q.prism(12, 0.06, 0.06, 0, 0.055, 0.055, 0.06, 0x2a2a2a));
      h.at(0, H.ry * 1.42, -0.01, q => q.prism(14, 0.1, 0.1, -0.006, 0.1, 0.1, 0.006, 0x2a2a2a));
    });
  }

  function buildCatmask(b, H) {
    const w = 0xece6dc, k = 0x1a1a1a;
    const p = headPt(H, 0, -0.1, 1.08);
    b.at(0, p[1], p[2] - 0.02, h => {
      h.ellipsoid(H.rx * 0.95, H.ry * 0.85, 0.05, 12, 8, w);
      [-1, 1].forEach(s => {
        h.at(s * 0.035, 0.03, 0.04, q => q.ellipsoid(0.02, 0.026, 0.01, 8, 5, k));
        h.at(s * 0.06, 0.1, 0.0, q => { q.push(M4.rotZ(-s * 0.4)); q.prism(3, 0.03, 0.02, 0, 0.002, 0.002, 0.07, w); q.pop(); });
        [0, 1, 2].forEach(i => h.at(s * 0.06, -0.035 - i * 0.012, 0.045, q => { q.push(M4.rotZ(s * (0.2 - i * 0.2))); q.box(0.07, 0.004, 0.004, k); q.pop(); }));
      });
      h.at(0, -0.01, 0.05, q => q.ellipsoid(0.012, 0.009, 0.008, 6, 4, k));
      h.at(0, -0.05, 0.045, q => q.box(0.05, 0.004, 0.004, k));
    });
  }

  function buildNvg(b, H, down) {
    const ringY = H.ry * 0.36;
    b.at(0, ringY, 0, h => h.prism(18, H.rx * 1.06, H.rz * 1.08, -0.012, H.rx * 1.06, H.rz * 1.08, 0.012, 0x1a1a1c));
    const lens = (q, x, y, z, rx) => q.at(x, y, z, e => {
      e.push(M4.rotX(rx));
      e.prism(12, 0.022, 0.022, 0.0, 0.026, 0.026, 0.06, 0x202024, { capBottom: true });
      e.at(0, 0.061, 0, f => f.prism(12, 0.02, 0.02, -0.002, 0.02, 0.02, 0.002, rgb(0x3aff8a, 1)));
      e.pop();
    });
    if (down) {
      const p = headPt(H, 0, 0.12, 1.0);
      b.at(0, p[1], p[2], h => {
        h.box(0.13, 0.05, 0.03, 0x1e1e22);
        lens(h, -0.035, -0.012, 0.0, PI / 2);
        lens(h, 0.035, -0.012, 0.0, PI / 2);
        lens(h, 0.0, 0.03, 0.0, PI / 2);
      });
    } else {
      const p = headPt(H, 0, 0.62, 1.0);
      b.at(0, p[1] + 0.02, p[2] - 0.01, h => {
        h.box(0.11, 0.04, 0.04, 0x1e1e22);
        lens(h, -0.03, 0.02, 0.0, 0.5);
        lens(h, 0.03, 0.02, 0.0, 0.5);
        lens(h, 0.0, 0.05, -0.015, 0.5);
      });
    }
  }

  function buildGreathelm(b, H) {
    b.at(0, 0, 0, h => {
      h.prism(16, H.rx * 1.28, H.rz * 1.25, -H.ry * 1.05, H.rx * 1.2, H.rz * 1.18, H.ry * 0.82, 0x2a2a2e, { capBottom: false });
      h.at(0, H.ry * 0.82, 0, q => q.prism(16, H.rx * 1.2, H.rz * 1.18, -0.004, H.rx * 1.2, H.rz * 1.18, 0.004, 0x232326));
      h.at(0, H.ry * 0.12, H.rz * 1.2, q => q.box(H.rx * 1.5, 0.022, 0.02, 0x050505));
      h.at(0, -H.ry * 0.35, H.rz * 1.21, q => q.box(0.012, H.ry * 0.9, 0.02, 0x3a3a40));
      for (let i = 0; i < 6; i++) h.at(H.rx * 0.5 + (i % 2) * 0.02, -H.ry * 0.3 - Math.floor(i / 2) * 0.025, H.rz * 1.1, q => q.box(0.01, 0.01, 0.02, 0x050505));
    });
  }

  function buildBeanie(b, H) {
    b.at(0, H.ry * 0.32, 0, h => {
      dome(h, H.rx * 1.12, H.ry * 0.82, H.rz * 1.14, 12, 6, 0x2c2c2e);
      h.prism(16, H.rx * 1.14, H.rz * 1.16, -0.03, H.rx * 1.15, H.rz * 1.17, 0.03, 0x3a3a3c);
    });
  }

  function buildHatStack(b, H) {
    b.at(0, H.ry * 0.62, 0, h => {
      h.prism(14, H.rx * 1.6, H.rz * 1.6, -0.005, H.rx * 1.6, H.rz * 1.6, 0.005, 0xd8641e);
      h.prism(14, H.rx * 0.95, H.rz * 0.95, 0.0, H.rx * 0.95, H.rz * 0.95, 0.07, 0xd8641e);
      h.at(0, 0.07, 0, q => {
        q.prism(14, H.rx * 1.5, H.rz * 1.5, -0.004, H.rx * 1.5, H.rz * 1.5, 0.004, 0xb82a22);
        q.prism(14, H.rx * 0.8, H.rz * 0.8, 0.0, 0.006, 0.006, 0.2, 0xb82a22);
        q.at(0, 0.2, 0, e => {
          e.ellipsoid(H.rx * 0.75, H.ry * 0.6, H.rz * 0.75, 10, 7, 0x1a1a1a);
          [-1, 1].forEach(sd => K.tube(e, [[sd * 0.05, 0.03, 0], [sd * 0.1, 0.07, 0.02], [sd * 0.12, 0.13, 0.03]], [0.018, 0.012, 0.004], 6, 0x1a1a1a));
          e.at(0, 0.06, 0, f => {
            f.prism(14, H.rx * 0.7, H.rz * 0.7, 0.0, H.rx * 0.65, H.rz * 0.65, 0.22, 0x7a7a7e);
            f.at(0, 0.1, H.rz * 0.68, g2 => g2.box(0.04, 0.05, 0.01, 0xe8e2d4));
          });
        });
      });
    });
  }

  function buildCtlHelmet(b, H) {
    const shell = 0x3a3e46, dark = 0x23262c, glow = rgb(0x6ac8ff, 1);
    b.at(0, H.ry * 0.1, -H.rz * 0.05, h => dome(h, H.rx * 1.16, H.ry * 0.9, H.rz * 1.18, 12, 6, shell));
    b.at(0, H.ry * 0.36, H.rz * 0.99, h => h.box(H.rx * 2.1, 0.05, 0.035, dark));
    b.at(0, H.ry * 0.36, H.rz * 1.02, h => h.box(H.rx * 1.5, 0.008, 0.01, glow));
    [-1, 1].forEach(sd => {
      b.at(sd * H.rx * 1.03, -H.ry * 0.12, H.rz * 0.12, h => h.box(0.035, H.ry * 0.95, H.rz * 1.15, shell));
      b.at(sd * H.rx * 1.06, -H.ry * 0.02, H.rz * 0.2, h => h.box(0.02, 0.03, 0.03, glow));
      b.at(sd * H.rx * 0.72, -H.ry * 0.52, H.rz * 0.84, h => { h.push(M4.rotY(-sd * 0.75)); h.box(H.rx * 0.7, 0.07, 0.035, dark); h.pop(); });
    });
    b.at(0, -H.ry * 0.66, H.rz * 1.06, h => h.box(H.rx * 0.8, 0.06, 0.035, dark));
    const e = headPt(H, -0.36, 0.12, 1.06);
    b.at(e[0], e[1], e[2] + 0.004, h => {
      h.push(M4.rotY(-0.34), M4.rotX(PI / 2));
      h.prism(12, 0.034, 0.034, -0.006, 0.032, 0.032, 0.012, dark);
      h.at(0, 0.013, 0, q => q.prism(12, 0.024, 0.024, 0, 0.024, 0.024, 0.003, glow));
      h.pop();
    });
  }

  function buildFedora(b, H) {
    const col = 0x7a5a3a;
    b.at(0, H.ry * 0.62, -0.005, h => {
      brim(h, H.rx * 0.95, H.rx * 1.9, 1.05, 0.03, 0.02, col);
      h.prism(16, H.rx * 1.05, H.rz * 1.06, 0.0, H.rx * 0.92, H.rz * 0.94, 0.12, col);
      h.prism(16, H.rx * 1.07, H.rz * 1.08, 0.0, H.rx * 1.07, H.rz * 1.08, 0.028, 0x2a1a10);
      h.at(0, 0.12, 0, q => q.prism(16, H.rx * 0.92, H.rz * 0.94, 0, H.rx * 0.7, H.rz * 0.6, 0.02, shade(col, 0.9)));
      h.at(H.rx * 0.5, 0.04, H.rz * 0.95, q => { q.push(M4.rotY(0.5), M4.rotZ(0.12)); q.box(0.065, 0.04, 0.004, 0xf2f0ea); q.pop(); });
    });
  }

  function buildHat(b, cls, pal, hat, H) {
    if (hat === 'hardhat') { buildHardhat(b, H); buildGoggles(b, H, true); }
    else if (hat === 'cowboy') { buildCowboy(b, H, 0xe6dcc4); buildGoggles(b, H, true); }
    else if (hat === 'lights') buildLights(b, H);
    else if (hat === 'cap') buildCap(b, H, pal.cloth);
    else if (hat === 'helmet') buildHelmet(b, H);
    else if (hat === 'slouch') buildSlouch(b, H, pal.hat || 0x6b4f34);
    else if (hat === 'party') buildParty(b, H, pal.cloth);
    else if (hat === 'horned') buildHorned(b, H);
    else if (hat === 'furcap') buildFurcap(b, H);
    else if (hat === 'knit') { buildKnit(b, H); }
    else if (hat === 'hood') buildHood(b, H, 0x2e3a4a);
    else if (hat === 'eyeball') buildEyeball(b, H);
    else if (hat === 'nvgUp') buildNvg(b, H, false);
    else if (hat === 'nvgDown') buildNvg(b, H, true);
    else if (hat === 'greathelm') buildGreathelm(b, H);
    else if (hat === 'beanie') buildBeanie(b, H);
    else if (hat === 'hardlights') { buildHardhat(b, H); buildLights(b, H); }
    else if (hat === 'hatstack') buildHatStack(b, H);
    else if (hat === 'catmask') { buildCatmask(b, H); buildSlouch(b, H, 0x5a2a20); }
    else if (hat === 'goggles') buildGoggles(b, H, true);
    else if (hat === 'ctlHelmet') buildCtlHelmet(b, H);
    else if (hat === 'fedoraPress') buildFedora(b, H);
  }

  const DEFAULT_HAT = { heavy: 'none', scout: 'cap', soldier: 'helmet', pyro: 'none', demo: 'none', engineer: 'hardhat', medic: 'none', sniper: 'slouch', spy: 'none', man: 'none' };

  const GUNS = {
    minigun(b) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2;
        b.at(S(a) * 0.035, C(a) * 0.035, 0, h => { h.push(M4.rotX(PI / 2)); h.prism(6, 0.012, 0.012, 0.15, 0.012, 0.012, 0.78, 0x2c2c2e); h.pop(); });
      }
      b.at(0, 0, 0.5, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.06, 0.06, -0.02, 0.06, 0.06, 0.02, 0x3a3a3c); h.pop(); });
      b.at(0, 0, 0.72, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.056, 0.056, -0.012, 0.056, 0.056, 0.012, 0x3a3a3c); h.pop(); });
      b.at(0, 0, 0.0, h => h.box(0.2, 0.2, 0.36, 0x3d3b38));
      b.at(0, -0.06, -0.12, h => h.box(0.22, 0.12, 0.2, 0x2f2d2a));
      b.at(0, 0.13, -0.05, h => h.box(0.04, 0.05, 0.26, 0x2a2826));
      b.at(0.13, -0.02, 0.0, h => h.ellipsoid(0.06, 0.09, 0.12, 8, 5, 0x5a4a32));
      b.at(0, 0.0, -0.22, h => h.box(0.12, 0.12, 0.08, 0x26241f));
    },
    rocket(b) {
      b.at(0, 0, 0, h => { h.push(M4.rotX(PI / 2)); h.prism(12, 0.07, 0.07, -0.55, 0.07, 0.07, 0.6, 0x5a5a3c); h.pop(); });
      b.at(0, 0, 0.62, h => { h.push(M4.rotX(PI / 2)); h.prism(12, 0.08, 0.08, -0.04, 0.08, 0.08, 0.04, 0x4a4a32); h.pop(); });
      b.at(0, -0.09, 0.05, h => h.box(0.03, 0.12, 0.04, 0x3a2e24));
      b.at(0, -0.08, 0.3, h => h.box(0.03, 0.1, 0.03, 0x3a2e24));
      b.at(0.06, 0.04, 0.2, h => h.box(0.03, 0.04, 0.08, 0x2a2a2a));
    },
    scatter(b) {
      [-0.016, 0.016].forEach(x => b.at(x, 0.02, 0.2, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.017, 0.017, -0.2, 0.017, 0.017, 0.24, 0x2a2a2c); h.pop(); }));
      b.at(0, 0.0, -0.03, h => h.box(0.05, 0.07, 0.14, 0x3c3c3e));
      b.at(0, -0.04, -0.2, h => { h.push(M4.rotX(-0.25)); h.box(0.045, 0.08, 0.24, 0x7a4a26); h.pop(); });
      b.at(0, -0.01, 0.14, h => h.box(0.05, 0.035, 0.12, 0x7a4a26));
    },
    pistol(b) {
      b.at(0, 0.02, 0.06, h => h.box(0.03, 0.04, 0.18, 0x2c2c2e));
      b.at(0, -0.04, -0.01, h => { h.push(M4.rotX(0.3)); h.box(0.028, 0.09, 0.04, 0x3a2a20); h.pop(); });
    },
    revolver(b) {
      b.at(0, 0.03, 0.1, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.012, 0.012, -0.06, 0.012, 0.012, 0.12, 0x6a6c70); h.pop(); });
      b.at(0, 0.025, 0.01, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.026, 0.026, -0.03, 0.026, 0.026, 0.03, 0x5a5c60); h.pop(); });
      b.at(0, -0.035, -0.035, h => { h.push(M4.rotX(0.35)); h.box(0.026, 0.08, 0.035, 0x3a2418); h.pop(); });
    },
    wrench(b) {
      b.at(0, 0, 0.14, h => h.box(0.022, 0.012, 0.3, 0x5c4a9a));
      b.at(0, 0, 0.31, h => h.box(0.06, 0.016, 0.05, 0x6a58aa));
      [-1, 1].forEach(s => b.at(s * 0.024, 0, 0.35, h => h.box(0.014, 0.016, 0.05, 0x6a58aa)));
    },
    wrenchSteel(b) {
      b.at(0, 0, 0.14, h => h.box(0.022, 0.012, 0.3, 0x55575c));
      b.at(0, 0, 0.31, h => h.box(0.06, 0.016, 0.05, 0x606268));
      [-1, 1].forEach(s => b.at(s * 0.024, 0, 0.35, h => h.box(0.014, 0.016, 0.05, 0x606268)));
    },
    rifle(b) {
      b.at(0, 0.0, 0.3, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.013, 0.013, -0.25, 0.012, 0.012, 0.42, 0x2a2a2c); h.pop(); });
      b.at(0, -0.01, -0.02, h => h.box(0.045, 0.05, 0.62, 0x5a3418));
      b.at(0, -0.04, -0.33, h => { h.push(M4.rotX(-0.15)); h.box(0.045, 0.1, 0.2, 0x5a3418); h.pop(); });
      b.at(0, 0.06, 0.05, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.022, 0.022, -0.14, 0.022, 0.022, 0.14, 0x1e1e20); h.pop(); });
    },
    flamer(b) {
      b.at(0, 0, 0.2, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.03, 0.03, -0.25, 0.035, 0.035, 0.35, 0x6a6a6c); h.pop(); });
      b.at(0, -0.05, 0.0, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.07, 0.07, -0.12, 0.07, 0.07, 0.12, 0x8a2a20); h.pop(); });
      b.at(0, -0.1, -0.06, h => h.box(0.03, 0.1, 0.04, 0x2a2a2a));
    },
    medigun(b) {
      b.at(0, 0, 0.12, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.035, 0.03, -0.15, 0.025, 0.02, 0.2, 0xd8d4cc); h.pop(); });
      b.at(0, -0.06, -0.02, h => h.box(0.03, 0.09, 0.04, 0x3a3a3a));
    },
    bat(b) {
      b.at(0, 0, 0.25, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.015, 0.015, -0.25, 0.035, 0.035, 0.38, 0xb08a58); h.pop(); });
    },
    knife(b) {
      b.at(0, 0, 0.0, h => h.box(0.02, 0.025, 0.09, 0x2a2a2a));
      b.at(0, 0.004, 0.11, h => h.box(0.006, 0.02, 0.13, 0xc8ccd0));
    },
    shotgun(b) {
      b.at(0, 0.02, 0.22, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.016, 0.016, -0.2, 0.016, 0.016, 0.28, 0x2a2a2c); h.pop(); });
      b.at(0, -0.01, 0.12, h => h.box(0.04, 0.035, 0.14, 0x7a4a26));
      b.at(0, -0.02, -0.12, h => { h.push(M4.rotX(-0.2)); h.box(0.04, 0.07, 0.24, 0x7a4a26); h.pop(); });
    },
    grenade(b) {
      b.at(0, 0, 0.2, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.03, 0.03, -0.2, 0.03, 0.03, 0.2, 0x3a3a3c); h.pop(); });
      b.at(0, 0, 0.0, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.06, 0.06, -0.06, 0.06, 0.06, 0.06, 0x4a3a2a); h.pop(); });
      b.at(0, -0.06, -0.12, h => h.box(0.04, 0.08, 0.18, 0x6a4a2a));
    },
    guitar(b) {
      const body = (y, rx) => ({ y, rx, rz: 0.055, cz: 0, cx: 0, col: 0xb6803e });
      Rig.loft(b, [body(-0.25, 0.03), body(-0.235, 0.13), body(-0.14, 0.175), body(-0.03, 0.13), body(0.04, 0.105), body(0.12, 0.13), body(0.2, 0.105), body(0.235, 0.03)], 18, { capBottom: true, capTop: true });
      b.at(0, -0.04, 0.056, h => K.discXY(h, 0, 0, 0, 0.045, 14, 0x1a120c));
      b.at(0, -0.04, 0.0565, h => K.discXY(h, 0, 0, 0, 0.032, 14, 0x0a0806));
      b.at(0, -0.17, 0.058, h => h.box(0.13, 0.02, 0.012, 0x2a1a10));
      b.at(0, 0.47, 0.025, h => h.box(0.052, 0.52, 0.024, 0x4a2a14));
      b.at(0, 0.77, 0.02, h => h.box(0.064, 0.12, 0.022, 0x2a1a10));
      b.at(0, 0.3, 0.04, h => h.box(0.028, 0.92, 0.003, 0xd8d0c0));
    },
    eguitar(b) {
      b.at(0, -0.1, 0.02, h => h.box(0.3, 0.36, 0.05, 0xf2f2ee));
      [-0.07, 0.07].forEach(x => b.at(x, -0.1, 0.046, h => h.box(0.03, 0.34, 0.006, 0xc8261e)));
      b.at(0, -0.04, 0.048, h => h.box(0.12, 0.03, 0.006, 0x2a2a2a));
      [-0.22, -0.17].forEach(y => b.at(0.1, y, 0.048, h => h.box(0.03, 0.02, 0.008, 0x1a1a1a)));
      b.at(0, 0.36, 0.02, h => h.box(0.05, 0.58, 0.024, 0x2a2a2a));
      b.at(0, 0.36, 0.034, h => h.box(0.03, 0.56, 0.004, 0xe8e2d4));
      b.at(0, 0.7, 0.02, h => h.box(0.07, 0.11, 0.022, 0x1a1a1a));
    },
    eguitar2(b) {
      const body = (y, rx, col) => ({ y, rx, rz: 0.03, cz: 0, cx: 0, col });
      Rig.loft(b, [body(-0.24, 0.03, 0x5a2a10), body(-0.22, 0.13, 0x8a4a1a), body(-0.12, 0.16, 0xc88a2a), body(-0.02, 0.11, 0xd8a83a), body(0.06, 0.12, 0xc88a2a), body(0.14, 0.09, 0x8a4a1a), body(0.18, 0.03, 0x5a2a10)], 16, { capBottom: true, capTop: true });
      b.at(-0.02, -0.06, 0.031, h => h.box(0.14, 0.2, 0.004, 0xf2f2ee));
      b.at(0, 0.44, 0.02, h => h.box(0.05, 0.56, 0.022, 0xd8b06a));
      b.at(0, 0.76, 0.02, h => h.box(0.06, 0.12, 0.02, 0xd8b06a));
      b.at(0, 0.3, 0.033, h => h.box(0.028, 0.92, 0.003, 0xd8d0c0));
    },
    lasso(b) {
      [0, 0.02].forEach((dz, k) => {
        const pts = [], rad = [];
        for (let i = 0; i <= 24; i++) {
          const a = (i / 24) * PI * 2;
          pts.push([S(a) * (0.15 + k * 0.02), C(a) * (0.15 + k * 0.02) - 0.15, dz]);
          rad.push(0.011);
        }
        K.tube(b, pts, rad, 5, 0xb89a5a);
      });
    },
    blaster(b) {
      b.at(0, 0, 0.1, h => h.box(0.12, 0.12, 0.24, 0x8a8a90));
      b.at(0, 0, 0.26, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.05, 0.05, -0.04, 0.06, 0.06, 0.04, 0x5a5a60, { capBottom: true }); h.pop(); });
      b.at(0, 0.08, 0.06, h => h.box(0.06, 0.04, 0.12, 0x3a6ab8));
      b.at(0, -0.08, 0.0, h => h.box(0.04, 0.1, 0.05, 0x2a2a2a));
    },
    mop(b) {
      b.at(0, 0, 0.0, h => { h.push(M4.rotX(PI / 2)); h.prism(6, 0.012, 0.012, -0.7, 0.012, 0.012, 0.7, 0x8a6a42); h.pop(); });
      b.at(0, 0, -0.74, h => h.box(0.32, 0.03, 0.06, 0x6a6a68));
      b.at(0, -0.02, -0.76, h => h.box(0.36, 0.02, 0.2, 0x9a9a8a));
    },
    sandvich(b) {
      b.at(0, 0, 0, h => h.box(0.14, 0.03, 0.1, 0xd6a860));
      b.at(0, 0.02, 0, h => h.box(0.15, 0.012, 0.11, 0x5a9a3a));
      b.at(0, 0.04, 0, h => h.box(0.14, 0.03, 0.1, 0xd6a860));
    },
    bottle(b) {
      b.at(0, 0, 0, h => h.prism(8, 0.03, 0.03, -0.05, 0.03, 0.03, 0.08, 0x3a6a2a));
      b.at(0, 0.11, 0, h => h.prism(8, 0.012, 0.012, 0, 0.012, 0.012, 0.06, 0x3a6a2a));
    },
    jar(b) {
      b.at(0, 0, 0, h => h.prism(10, 0.045, 0.045, -0.05, 0.045, 0.045, 0.07, rgb(0xe8d040, 0.35)));
      b.at(0, 0.08, 0, h => h.prism(10, 0.04, 0.04, 0, 0.04, 0.04, 0.02, 0x8a8a8a));
    },
    photo(b) {
      b.at(0, 0.02, 0.0, h => h.box(0.09, 0.11, 0.004, 0xf2f0ea));
    },
    banana(b) {
      K.tube(b, [[0, -0.09, 0.02], [0, -0.03, 0.035], [0, 0.04, 0.035], [0, 0.1, 0.015]], [0.012, 0.022, 0.022, 0.01], 6, 0xf0d040);
    },
    boot(b) {
      b.at(0, 0, 0, h => h.box(0.09, 0.18, 0.1, 0x5a3a22));
      b.at(0, -0.08, 0.07, h => h.box(0.09, 0.07, 0.18, 0x4a2e1a));
    },
    bow(b) {
      const pts = [];
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8 - 0.5) * 2.0;
        pts.push([0, S(a) * 0.55, C(a) * 0.16 - 0.16]);
      }
      K.tube(b, pts, pts.map((p, i) => (i === 0 || i === 8 ? 0.008 : 0.016)), 5, 0x6a4022);
      b.at(0, 0, -0.02, h => h.box(0.004, 1.0, 0.004, 0xe8e2d0));
    },
    longsword(b) {
      b.at(0, 0, -0.04, h => h.box(0.03, 0.03, 0.18, 0x3a2a1c));
      b.at(0, 0, -0.14, h => h.ellipsoid(0.03, 0.03, 0.03, 6, 4, 0x8a8a90));
      b.at(0, 0, 0.06, h => h.box(0.26, 0.03, 0.03, 0x8a8a90));
      b.at(0, 0, 0.5, h => h.box(0.05, 0.012, 0.84, 0xc8ccd2));
      b.at(0, 0, 0.94, h => { h.push(M4.rotY(PI / 4)); h.box(0.035, 0.012, 0.035, 0xc8ccd2); h.pop(); });
    },
    camera(b) {
      b.at(0, 0, 0, h => h.box(0.15, 0.1, 0.08, 0x1a1a1c));
      b.at(0, 0, 0.08, h => { h.push(M4.rotX(PI / 2)); h.prism(12, 0.035, 0.035, -0.04, 0.032, 0.032, 0.05, 0x101012, { capBottom: true }); h.pop(); });
      b.at(0.04, 0.07, 0.0, h => h.box(0.05, 0.04, 0.04, 0xd8d8d8));
    },
    walkie(b) {
      b.at(0, 0.02, 0, h => h.box(0.05, 0.13, 0.03, 0x1a1a1c));
      b.at(0.015, 0.13, 0, h => h.box(0.008, 0.1, 0.008, 0x101010));
    },
    sodaCup(b) {
      b.at(0, 0, 0, h => h.prism(10, 0.035, 0.035, -0.05, 0.042, 0.042, 0.06, 0xd8261e, { capBottom: true }));
      b.at(0, 0.0, 0, h => h.prism(10, 0.037, 0.037, -0.01, 0.039, 0.039, 0.02, 0xf2f2f2));
      b.at(0.01, 0.1, 0, h => { h.push(M4.rotZ(-0.2)); h.box(0.008, 0.12, 0.008, 0xf2f2f2); h.pop(); });
    },
    hiddenBlade(b) {
      b.at(0, -0.13, 0.01, h => h.box(0.01, 0.2, 0.018, 0xd8dce2));
    },
    smg(b) {
      b.at(0, 0.0, 0.14, h => h.box(0.04, 0.06, 0.36, 0x1e1e20));
      b.at(0, -0.06, 0.04, h => h.box(0.03, 0.1, 0.04, 0x1e1e20));
      b.at(0, 0.0, 0.34, h => { h.push(M4.rotX(PI / 2)); h.prism(8, 0.012, 0.012, 0, 0.012, 0.012, 0.1, 0x101010); h.pop(); });
    },
    cup(b) {
      b.at(0, 0, 0, h => h.prism(10, 0.035, 0.035, -0.05, 0.04, 0.04, 0.06, rgb(0xe8e4d8)));
      b.at(0, 0.055, 0, h => h.prism(10, 0.035, 0.035, -0.003, 0.035, 0.035, 0.003, 0xe8c050));
    }
  };

  const HOLD = {
    wrench: M4.chain(M4.translate(0, -0.085, 0.01), M4.rotX(-PI / 2)),
    wrenchSteel: M4.chain(M4.translate(0, -0.085, 0.01), M4.rotX(-PI / 2)),
    pistol: M4.chain(M4.translate(0, -0.07, 0.02), M4.rotX(-PI / 2 + 0.3)),
    revolver: M4.chain(M4.translate(0, -0.07, 0.02), M4.rotX(-PI / 2 + 0.3)),
    knife: M4.chain(M4.translate(0, -0.08, 0.02), M4.rotX(-PI / 2)),
    bat: M4.chain(M4.translate(0, -0.08, 0.01), M4.rotX(-PI / 2)),
    bottle: M4.chain(M4.translate(0, -0.08, 0.04)),
    jar: M4.chain(M4.translate(0, -0.08, 0.05)),
    banana: M4.chain(M4.translate(0, -0.08, 0.04)),
    longsword: M4.chain(M4.translate(0, -0.085, 0.01), M4.rotX(-PI / 2)),
    camera: M4.chain(M4.translate(0, -0.09, 0.06)),
    walkie: M4.chain(M4.translate(0, -0.08, 0.035)),
    lasso: M4.chain(M4.translate(0, -0.08, 0.03)),
    blaster: M4.chain(M4.translate(0, -0.07, 0.02), M4.rotX(-PI / 2 + 0.3)),
    sodaCup: M4.chain(M4.translate(0, -0.08, 0.05)),
    hiddenBlade: M4.ident(),
    smg: M4.chain(M4.translate(0, -0.07, 0.02), M4.rotX(-PI / 2 + 0.3)),
    photo: M4.chain(M4.translate(0, -0.1, 0.03)),
    boot: M4.chain(M4.translate(0, -0.1, 0.05)),
    bow: M4.chain(M4.translate(0, -0.07, 0.03)),
    cup: M4.chain(M4.translate(0, -0.08, 0.05)),
    sandvich: M4.chain(M4.translate(0, -0.09, 0.05), M4.rotX(-0.3)),
    mop: M4.chain(M4.translate(0, -0.08, 0.02), M4.rotX(-PI / 2))
  };

  const TWO = {
    minigun: { at: [0, -0.18, 0.32], rot: [0, 0, 0], hR: [0.04, 0.05, -0.14], hL: [-0.16, 0.12, 0.05] },
    rocket: { at: [-0.14, 0.42, 0.04], rot: [0, 0, 0], hR: [0.02, -0.11, 0.06], hL: [0.02, -0.1, 0.32] },
    scatter: { at: [-0.06, 0.14, 0.36], rot: [0, 0, 0], hR: [0.0, -0.05, -0.1], hL: [0.0, -0.03, 0.15] },
    shotgun: { at: [-0.06, 0.12, 0.36], rot: [0, 0, 0], hR: [0.0, -0.05, -0.1], hL: [0.0, -0.03, 0.14] },
    rifle: { at: [-0.08, 0.28, 0.3], rot: [0, 0, 0], hR: [0.0, -0.05, -0.18], hL: [0.0, -0.03, 0.18] },
    flamer: { at: [-0.04, 0.02, 0.4], rot: [0, 0, 0], hR: [0.0, -0.1, -0.06], hL: [0.0, -0.04, 0.12] },
    medigun: { at: [-0.04, 0.12, 0.38], rot: [0, 0, 0], hR: [0.0, -0.08, -0.02], hL: [0.0, 0.0, 0.08] },
    grenade: { at: [-0.06, 0.12, 0.34], rot: [0, 0, 0], hR: [0.0, -0.06, -0.12], hL: [0.0, -0.02, 0.18] },
    guitar: { at: [-0.04, 0.12, 0.2], rot: [0.12, 0.0, -1.2], hR: [0.0, -0.04, 0.09], hL: [0.0, 0.52, 0.05] },
    eguitar: { at: [-0.04, 0.1, 0.18], rot: [0.12, 0.0, -1.15], hR: [0.0, -0.06, 0.07], hL: [0.0, 0.5, 0.04] },
    eguitar2: { at: [-0.04, 0.12, 0.18], rot: [0.12, 0.0, -1.2], hR: [0.0, -0.06, 0.06], hL: [0.0, 0.5, 0.04] },
    mop: { at: [-0.05, 0.05, 0.3], rot: [1.2, 0, 0], hR: [0.0, 0.0, 0.0], hL: [0.0, 0.0, 0.35] }
  };

  function twoHanded(gun, opts) {
    const g = TWO[gun];
    const o = opts || {};
    const at = V3.add(g.at, o.off || [0, 0, 0]);
    const rot = [(o.pitch || 0) + g.rot[0], (o.yaw || 0) + g.rot[1], (o.roll || 0) + g.rot[2]];
    const M = M4.chain(M4.translate(at[0], at[1], at[2]), M4.rotY(rot[1]), M4.rotX(rot[0]), M4.rotZ(rot[2]));
    return { M, hR: M4.point(M, V3.add(g.hR, o.hROff || [0, 0, 0])), hL: M4.point(M, V3.add(g.hL, o.hLOff || [0, 0, 0])) };
  }

  const PROPS = {
    sentry(b) {
      b.at(0, 0.0, 0.0, h => {
        [0, 2.1, 4.2].forEach(a => h.at(S(a) * 0.18, 0.12, C(a) * 0.18, q => { q.push(M4.rotY(a), M4.rotX(0.6)); q.box(0.03, 0.3, 0.03, 0x3a3a3c); q.pop(); }));
        h.at(0, 0.3, 0, q => q.box(0.08, 0.1, 0.08, 0x4a4a4c));
        h.at(0, 0.42, 0.02, q => q.box(0.2, 0.16, 0.3, 0x5a5c60));
        h.at(0.0, 0.44, 0.22, q => { q.push(M4.rotX(PI / 2)); q.prism(8, 0.03, 0.03, -0.05, 0.03, 0.03, 0.12, 0x2a2a2c); q.pop(); });
        h.at(0.11, 0.42, 0.0, q => q.box(0.02, 0.12, 0.14, 0x3a3a3c));
        h.at(-0.11, 0.42, 0.0, q => q.box(0.02, 0.12, 0.14, 0x3a3a3c));
      });
    },
    toolbox(b) {
      b.at(0, 0.1, 0, h => h.box(0.36, 0.18, 0.18, 0x8a2a24));
      b.at(0, 0.22, 0, h => h.box(0.2, 0.03, 0.03, 0x3a3a3c));
    },
    bucket(b) {
      b.at(0, 0.18, 0, h => h.box(0.42, 0.32, 0.32, 0xd8c030));
      b.at(0.12, 0.38, 0, h => h.box(0.14, 0.08, 0.3, 0xc8b028));
      [[-0.18, -0.14], [0.18, -0.14], [-0.18, 0.14], [0.18, 0.14]].forEach(([x, z]) => b.at(x, 0.03, z, h => h.ellipsoid(0.03, 0.03, 0.03, 6, 4, 0x2a2a2a)));
    },
    banana(b) {
      K.tube(b, [[-0.08, 0.01, 0], [-0.03, 0.025, 0.01], [0.03, 0.025, 0.0], [0.08, 0.01, -0.01]], [0.012, 0.022, 0.022, 0.01], 6, 0xf0d040);
    },
    cone(b) {
      b.at(0, 0, 0, h => h.box(0.36, 0.03, 0.36, 0xe0602a));
      b.at(0, 0.03, 0, h => h.prism(12, 0.12, 0.12, 0, 0.02, 0.02, 0.5, 0xf06a2c));
      b.at(0, 0.2, 0, h => h.prism(12, 0.085, 0.085, 0, 0.066, 0.066, 0.08, 0xf2f0ea));
    },
    plate(b) {
      b.at(0, 0, 0, h => h.prism(16, 0.11, 0.11, 0, 0.13, 0.13, 0.015, 0xf2f0ea));
    },
    kart(b) {
      b.at(0, 0.16, 0.05, h => h.box(0.86, 0.06, 1.5, 0x2a2a2c));
      b.at(0, 0.24, 0.62, h => h.box(0.9, 0.14, 0.36, 0xd8322a));
      b.at(0, 0.26, -0.05, h => h.box(0.6, 0.12, 0.6, 0xe8e6e0));
      b.at(0, 0.4, -0.32, h => h.box(0.5, 0.36, 0.08, 0xd8322a));
      b.at(0, 0.24, -0.62, h => h.box(0.9, 0.12, 0.2, 0xd8322a));
      b.at(0, 0.5, 0.42, h => { h.push(M4.rotX(-0.9)); h.prism(6, 0.02, 0.02, -0.2, 0.02, 0.02, 0.0, 0x2a2a2a); h.at(0, 0.02, 0, q => q.prism(14, 0.14, 0.14, -0.015, 0.14, 0.14, 0.015, 0x1e1e1e)); h.pop(); });
      [[-0.5, 0.58], [0.5, 0.58], [-0.52, -0.5], [0.52, -0.5]].forEach(([x, z], i) => b.at(x, 0.14, z, h => { h.push(M4.rotZ(PI / 2)); h.prism(12, 0.14, 0.14, -0.08 - (i > 1 ? 0.03 : 0), 0.14, 0.14, 0.08 + (i > 1 ? 0.03 : 0), 0x1a1a1a, { capBottom: true }); h.at(0, 0.0, 0, q => q.prism(10, 0.07, 0.07, -0.1 - (i > 1 ? 0.03 : 0), 0.07, 0.07, 0.1 + (i > 1 ? 0.03 : 0), 0xc8c8cc, { capBottom: true })); h.pop(); }));
      b.at(0, 0.3, -0.75, h => h.box(0.3, 0.08, 0.06, 0x8a8a8e));
    },
    bowl(b) {
      b.at(0, 0, 0, h => h.prism(18, 0.1, 0.1, 0, 0.24, 0.24, 0.16, 0xe8eef4, { capBottom: true, capTop: false }));
      b.at(0, 0.11, 0, h => h.prism(18, 0.2, 0.2, 0, 0.23, 0.23, 0.04, 0x5a7ab8, { capTop: false }));
    },
    sandwiches(b) {
      b.at(0, 0, 0, h => h.prism(18, 0.26, 0.26, 0, 0.3, 0.3, 0.02, 0xf2f0ea));
      const g = window.P3D.rand(5);
      for (let i = 0; i < 14; i++) {
        const a = g() * PI * 2, rr = g() * 0.18, lvl = Math.floor(i / 6);
        b.at(S(a) * rr, 0.05 + lvl * 0.06, C(a) * rr, h => {
          h.push(M4.rotY(g() * PI));
          h.box(0.12, 0.025, 0.07, 0xd6a860);
          h.at(0, 0.02, 0, q => q.box(0.13, 0.012, 0.08, i % 2 ? 0x5a9a3a : 0xc84a3a));
          h.at(0, 0.035, 0, q => q.box(0.12, 0.022, 0.07, 0xd6a860));
          h.pop();
        });
      }
    },
    pizza(b) {
      b.at(0, 0, 0, h => h.prism(20, 0.26, 0.26, 0, 0.26, 0.26, 0.02, 0xd8a050));
      b.at(0, 0.021, 0, h => h.prism(20, 0.23, 0.23, 0, 0.23, 0.23, 0.004, 0xc8502a));
      const g = window.P3D.rand(9);
      for (let i = 0; i < 12; i++) {
        const a = g() * PI * 2, rr = g() * 0.18;
        b.at(S(a) * rr, 0.027, C(a) * rr, h => h.prism(8, 0.022, 0.022, 0, 0.022, 0.022, 0.006, 0x8a2a1a));
      }
    },
    ration(b) {
      b.at(0, 0, 0, h => h.box(0.5, 0.16, 0.12, 0xe6e4dc));
    },
    studWall(b) {
      b.at(0, 1.6, 0, h => h.box(2.6, 3.2, 0.3, 0xc8322a));
      for (let y = 0; y < 8; y++) for (let x = 0; x < 6; x++) b.at(-1.1 + x * 0.44, 0.25 + y * 0.4, 0.17, h => h.prism(4, 0.2, 0.2, 0, 0.0, 0.0, 0.1, 0xd83a30, { phase: PI / 4 }));
    },
    fence(b) {
      [-2.4, -1.2, 0, 1.2, 2.4].forEach(x => b.at(x, 0.6, 0, h => h.box(0.12, 1.2, 0.12, 0x3a2a1e)));
      [0.45, 0.85, 1.1].forEach(y => b.at(0, y, 0.07, h => h.box(5.0, 0.1, 0.05, 0x4a3626)));
    },
    billboard(b) {
      b.at(0, 2.2, 0, h => h.box(4.2, 2.8, 0.2, 0x141414));
      [-1.6, 1.6].forEach(x => b.at(x, 0.4, 0, h => h.box(0.15, 0.8, 0.15, 0x2a2a2a)));
    },
    mushroomRed(b) {
      b.at(0, 0, 0, h => h.prism(16, 1.0, 1.0, 0, 0.9, 0.9, 2.7, 0xf2ead8));
      b.at(0, 2.6, 0, h => h.ellipsoid(2.7, 1.35, 2.7, 18, 10, 0xd8281e));
      b.at(0, 2.6, 0, h => h.prism(18, 2.68, 2.68, -0.02, 2.4, 2.4, 0.02, 0xc8b8a0));
      [[0, 1.3, 0, 0.7], [1.6, 1.0, 0.9, 0.55], [-1.5, 1.05, 0.8, 0.6], [0.4, 0.95, -1.7, 0.55], [-0.9, 0.85, -1.8, 0.45], [1.9, 0.6, -0.9, 0.45], [-2.1, 0.55, -0.6, 0.45], [0.2, 0.6, 2.2, 0.5]].forEach(([x, y, z, r]) => {
        const n = V3.norm([x / 2.7, y / 1.35, z / 2.7]);
        b.at(x, 2.6 + y, z, h => { h.push(M4.rotY(Math.atan2(n[0], n[2])), M4.rotX(Math.acos(Math.max(-1, Math.min(1, n[1]))))); h.ellipsoid(r, 0.06, r, 10, 4, 0xf6f2ea); h.pop(); });
      });
    },
    mushroomGreen(b) {
      b.at(0, 0, 0, h => h.prism(14, 0.55, 0.55, 0, 0.5, 0.5, 3.4, 0xf2ead8));
      b.at(0, 3.3, 0, h => h.ellipsoid(1.4, 0.75, 1.4, 16, 8, 0x3aa82a));
      [[0, 0.75, 0, 0.35], [0.9, 0.5, 0.5, 0.28], [-0.8, 0.5, -0.6, 0.3]].forEach(([x, y, z, r]) => b.at(x, 3.3 + y, z, h => h.ellipsoid(r, 0.05, r, 8, 4, 0xf6f2ea)));
    },
    tyre(b) {
      b.at(0, 0.32, 0, h => { h.push(M4.rotZ(PI / 2)); h.prism(16, 0.32, 0.32, -0.12, 0.32, 0.32, 0.12, 0x1a1a1a, { capBottom: true }); h.at(0, 0, 0, q => q.prism(12, 0.16, 0.16, -0.125, 0.16, 0.16, 0.125, 0x5a5a5e, { capBottom: true })); h.pop(); });
    },
    van(b) {
      b.at(0, 1.05, 0, h => h.box(2.1, 1.7, 4.6, 0x141414));
      b.at(0, 0.3, 0, h => h.box(2.0, 0.3, 4.4, 0x0c0c0c));
      b.at(0, 1.45, 1.6, h => h.box(2.12, 0.6, 1.0, rgb(0x4ad83a, 0.6)));
      [[-1.0, 1.5], [1.0, 1.5], [-1.0, -1.5], [1.0, -1.5]].forEach(([x, z]) => b.at(x, 0.36, z, h => { h.push(M4.rotZ(PI / 2)); h.prism(12, 0.36, 0.36, -0.12, 0.36, 0.36, 0.12, 0x1a1a1a, { capBottom: true }); h.pop(); }));
    },
    jeep(b) {
      b.at(0, 0.8, 0, h => h.box(1.9, 0.8, 4.0, 0x2e4a2a));
      b.at(0, 1.5, -0.4, h => h.box(1.7, 0.6, 1.6, 0x24381f));
      [[-0.95, 1.3], [0.95, 1.3], [-0.95, -1.3], [0.95, -1.3]].forEach(([x, z]) => b.at(x, 0.4, z, h => { h.push(M4.rotZ(PI / 2)); h.prism(12, 0.4, 0.4, -0.15, 0.4, 0.4, 0.15, 0x161616, { capBottom: true }); h.pop(); }));
    },
    carRed(b) {
      b.at(0, 0.6, 0, h => h.box(1.8, 0.6, 4.2, 0xb8241c));
      b.at(0, 1.1, -0.2, h => h.box(1.6, 0.5, 2.0, 0x8a1a14));
      [[-0.9, 1.3], [0.9, 1.3], [-0.9, -1.3], [0.9, -1.3]].forEach(([x, z]) => b.at(x, 0.32, z, h => { h.push(M4.rotZ(PI / 2)); h.prism(12, 0.32, 0.32, -0.12, 0.32, 0.32, 0.12, 0x161616, { capBottom: true }); h.pop(); }));
    },
    arrow(b) {
      b.at(0, 0, 0, h => { h.push(M4.rotX(PI / 2)); h.prism(5, 0.008, 0.008, -0.35, 0.008, 0.008, 0.35, 0x8a6a42); h.pop(); });
      b.at(0, 0, 0.37, h => { h.push(M4.rotX(PI / 2)); h.prism(4, 0.02, 0.02, 0, 0.0, 0.0, 0.06, 0x8a8a8a); h.pop(); });
      [0, 2.1, 4.2].forEach(a => b.at(S(a) * 0.015, C(a) * 0.015, -0.3, h => h.box(0.004, 0.03, 0.08, 0xd8d0c0)));
    },
    cube(b) {
      b.at(0, 0.8, 0, h => h.box(1.6, 1.6, 1.6, 0x4a6ac8));
    },
    yellowWall(b) {
      b.at(0, 0.45, 0, h => h.box(4.2, 0.9, 0.4, 0xe2cc2a));
    },
    blueWall(b) {
      b.at(0, 1.3, 0, h => h.box(6.0, 2.6, 0.4, 0x88b8e2));
    },
    mauve(b) {
      b.at(0, 0.7, 0, h => h.box(5.0, 1.4, 2.6, 0x9a5a66));
    },
    cowboyHat(b) {
      b.push(M4.translate(0, -HEAD.engineer.ry * 0.66 + 0.004, 0));
      buildCowboy(b, HEAD.engineer, 0xe6dcc4);
      b.pop();
    },
    pool(b) {
      b.at(0, 0, 0, h => h.prism(18, 1.0, 0.7, 0, 1.0, 0.7, 0.004, 0x5a0806));
      [[0.8, 0.5, 0.25], [-0.9, -0.3, 0.2], [0.3, -0.75, 0.18]].forEach(([x, z, r]) => b.at(x, 0, z, h => h.prism(10, r, r, 0, r, r, 0.004, 0x5a0806)));
    },
    beam(b) {
      b.at(0, 9, 0, h => h.box(0.25, 18, 0.25, rgb(0xf2f8ff, 1)));
    },
    lightsCoil(b) {
      const cols = [0xff4040, 0x40ff60, 0xffd040, 0x5080ff, 0xff60ff, 0x40e0ff];
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * PI * 2;
        b.at(S(a) * 0.16, 0.02 + 0.015 * S(a * 3), C(a) * 0.16, h => {
          h.box(0.012, 0.012, 0.012, 0x1c2a1a);
          h.at(0.015, 0.0, 0, q => q.ellipsoid(0.011, 0.02, 0.011, 6, 4, rgb(cols[i % cols.length], 0.85)));
        });
      }
      b.at(0, 0.02, 0, h => h.prism(18, 0.16, 0.16, -0.005, 0.16, 0.16, 0.005, 0x1c2a1a));
    },
    redBlock(b) {
      b.at(0, 1.3, 0, h => h.box(3.0, 2.6, 1.2, 0xc8322a));
    },
    greenBlock(b) {
      b.at(0, 1.2, 0, h => h.box(1.6, 2.4, 1.6, 0x3a9a2a));
    },
    bacon(b) {
      const pts = [];
      for (let i = 0; i <= 8; i++) pts.push([-0.4 + i * 0.1, S(i * 1.4) * 0.04, 0.01]);
      K.tube(b, pts, pts.map(() => 0.035), 4, 0xb84a3a);
    },
    paper(b) {
      b.at(0, 0, -0.004, h => h.box(1, 1, 0.006, 0xe8e4da));
    },
    decoy(b) {
      b.at(0, 0, -0.01, h => h.box(0.9, 1.6, 0.02, 0xa8844a));
    },
    haystack(b) {
      b.at(0, 0.0, 0, h => h.ellipsoid(1.3, 0.32, 1.0, 16, 8, 0xd8b04a, { colorAt: (p) => shade(0xd8b04a, 0.8 + 0.3 * Math.abs(Math.sin(p[0] * 31 + p[2] * 17))) }));
    },
    sentry3(b) {
      [0, 2.1, 4.2].forEach(a => b.at(S(a) * 0.32, 0.18, C(a) * 0.32, q => { q.push(M4.rotY(a), M4.rotX(0.55)); q.box(0.05, 0.42, 0.05, 0x2a2c30); q.pop(); }));
      b.at(0, 0.42, 0, h => h.box(0.14, 0.16, 0.14, 0x3a3c42));
      b.at(0, 0.62, 0.02, h => h.box(0.36, 0.24, 0.5, 0x4a6aa8));
      [-1, 1].forEach(sd => b.at(sd * 0.24, 0.6, 0.18, h => {
        for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; h.at(S(a) * 0.035, C(a) * 0.035, 0.18, q => { q.push(M4.rotX(PI / 2)); q.prism(6, 0.012, 0.012, -0.22, 0.012, 0.012, 0.22, 0x242426); q.pop(); }); }
        h.box(0.12, 0.12, 0.2, 0x2a2c30);
      }));
      b.at(0, 0.86, -0.06, h => {
        h.box(0.3, 0.2, 0.24, 0x4a6aa8);
        [[-0.07, 0.05], [0.07, 0.05], [-0.07, -0.05], [0.07, -0.05]].forEach(([x, y]) => h.at(x, y, 0.121, q => q.box(0.06, 0.06, 0.01, 0x101012)));
      });
    },
    dragonBody(b) {
      b.at(0, 0, 0, h => h.ellipsoid(0.16, 0.13, 0.26, 12, 8, 0x8a3ab8));
      b.at(0, -0.05, 0.05, h => h.ellipsoid(0.11, 0.08, 0.18, 10, 6, 0xe8b83a));
      b.at(0, 0.12, 0.28, h => {
        h.ellipsoid(0.13, 0.12, 0.13, 10, 8, 0x8a3ab8);
        h.at(0, -0.02, 0.12, q => q.ellipsoid(0.08, 0.06, 0.1, 8, 6, 0x9a4ac8));
        [-1, 1].forEach(sd => {
          h.at(sd * 0.06, 0.07, 0.08, q => q.ellipsoid(0.035, 0.04, 0.02, 8, 5, 0xf2f2f2));
          h.at(sd * 0.06, 0.07, 0.096, q => q.ellipsoid(0.016, 0.022, 0.01, 6, 4, 0x5a3a8a));
          K.tube(h, [[sd * 0.06, 0.1, -0.02], [sd * 0.1, 0.18, -0.1], [sd * 0.12, 0.24, -0.2]], [0.035, 0.02, 0.004], 6, 0xe8a02a);
        });
      });
      K.tube(b, [[0, 0.02, -0.24], [0, 0.06, -0.4], [0, 0.14, -0.55], [0, 0.22, -0.62]], [0.07, 0.05, 0.03, 0.015], 8, 0x8a3ab8);
      b.at(0, 0.24, -0.66, h => { h.push(M4.rotX(-0.6)); h.prism(3, 0.06, 0.03, 0, 0.0, 0.0, 0.1, 0xe8a02a); h.pop(); });
      [[-0.09, 0.14], [0.09, 0.14], [-0.09, -0.12], [0.09, -0.12]].forEach(([x, z]) => b.at(x, -0.13, z, h => h.ellipsoid(0.045, 0.06, 0.05, 6, 4, 0x8a3ab8)));
      [-0.04, 0.0, 0.04].forEach((x, i) => b.at(0, 0.15 - i * 0.02, -0.1 - i * 0.12, h => h.prism(3, 0.03, 0.02, 0, 0, 0, 0.06, 0xe8a02a)));
    },
    dragonWing(b) {
      const pts = [[0, 0, 0], [0.42, 0.18, 0.05], [0.5, 0.05, -0.1], [0.36, -0.02, -0.2], [0.18, -0.02, -0.18]];
      for (let i = 1; i < pts.length - 1; i++) {
        b.tri(pts[0], pts[i], pts[i + 1], 0xe8a02a);
        b.tri(pts[0], pts[i + 1], pts[i], 0xc8801a);
      }
      K.tube(b, [pts[0], pts[1]], [0.02, 0.008], 5, 0x8a3ab8);
    },
    moon(b) {},
    towelRack(b) {
      b.at(0, 1.4, 0, h => h.box(0.9, 0.03, 0.04, 0x8a8a8e));
      [-0.25, 0.22].forEach((x, i) => b.at(x, 1.16, 0.02, h => h.box(0.32, 0.48, 0.03, i ? 0xe8e4dc : 0xd8d4cc)));
    },
    yellowPillar(b) {
      b.at(0, 0, 0, h => h.prism(16, 0.45, 0.45, 0, 0.45, 0.45, 0.9, 0x2a2420, { capBottom: true }));
      b.at(0, 0.9, 0, h => h.prism(16, 0.45, 0.45, 0, 0.45, 0.45, 5.5, 0xb8943a));
    },
    deskLair(b) {
      b.at(0, 0.45, 0, h => h.box(2.2, 0.9, 0.9, 0x2a3a6a));
      b.at(0, 0.92, 0, h => h.box(2.3, 0.06, 1.0, 0x3a4a7a));
      [[-0.7, 0x8a2a2a], [-0.55, 0x2a6a3a], [-0.42, 0xd8c84a]].forEach(([x, col]) => b.at(x, 1.07, -0.2, h => h.box(0.08, 0.24, 0.18, col)));
      [0.35, 0.8].forEach(x => b.at(x, 1.2, -0.2, h => {
        h.box(0.4, 0.3, 0.04, 0x1a1a1c);
        h.at(0, 0, 0.021, q => q.box(0.36, 0.26, 0.002, rgb(0x6aa8e8, 0.7)));
        h.at(0, -0.18, 0, q => q.box(0.06, 0.08, 0.06, 0x1a1a1c));
      }));
    },
    fencePlank(b) {
      b.at(0, 0.6, 0, h => h.box(0.24, 1.2, 0.05, 0x7a5a3a));
      b.at(0, 1.21, 0, h => { h.push(M4.rotZ(PI / 4)); h.box(0.17, 0.17, 0.05, 0x7a5a3a); h.pop(); });
    },
    boardGame(b) {
      b.at(0, 0.01, 0, h => h.box(0.5, 0.02, 0.5, 0xe8e4d0));
    },
    hatTall(b) {
      b.at(0, 0.0, 0, h => h.prism(14, 0.08, 0.08, 0, 0.075, 0.075, 0.2, 0x7a7a7e));
    },
    hatWitch(b) {
      b.at(0, 0, 0, h => h.prism(14, 0.16, 0.16, 0, 0.16, 0.16, 0.008, 0xb82a22));
      b.at(0, 0.008, 0, h => h.prism(14, 0.08, 0.08, 0, 0.006, 0.006, 0.18, 0xb82a22));
    },
    hatBrim(b) {
      b.at(0, 0, 0, h => h.prism(14, 0.16, 0.16, 0, 0.16, 0.16, 0.008, 0xd8641e));
      b.at(0, 0.008, 0, h => h.prism(14, 0.085, 0.085, 0, 0.085, 0.085, 0.07, 0xd8641e));
    },
    hatSkull(b) {
      b.at(0, 0.06, 0, h => h.ellipsoid(0.08, 0.06, 0.08, 10, 6, 0x1a1a1a));
    },
    lightCone(b) {
      b.at(0, 0, 0, h => h.prism(16, 0.15, 0.15, 0, 1.6, 1.6, -7, rgb(0xf2f6ff, 1), { capTop: false }));
    },
    lamp(b) {
      b.at(0, 2.5, 0, h => h.box(0.12, 5, 0.12, 0x2a2a2e));
      b.at(0, 5.05, 0.25, h => h.box(0.3, 0.12, 0.6, 0x2a2a2e));
      b.at(0, 4.98, 0.45, h => h.box(0.24, 0.02, 0.3, rgb(0xfff4d8, 1)));
    },
    whiteboard(b) {
      b.at(0, 0, 0, h => h.box(1.9, 1.2, 0.06, 0x8a8a8e));
    },
    sign(b) {},
    robotSpider(b) {
      b.at(0, 0, 0, h => h.ellipsoid(0.32, 0.22, 0.32, 14, 8, 0xe8e8e4));
      b.at(0, -0.1, 0.22, h => h.ellipsoid(0.16, 0.16, 0.16, 12, 8, 0x2a2a30));
      b.at(0, -0.1, 0.375, h => h.ellipsoid(0.04, 0.04, 0.02, 8, 5, rgb(0xff6ab8, 1)));
      for (let i = 0; i < 4; i++) {
        const a = PI / 4 + i * PI / 2;
        const p0 = [S(a) * 0.25, 0, C(a) * 0.25], p1 = [S(a) * 0.6, 0.28, C(a) * 0.6], p2 = [S(a) * 0.78, -0.45, C(a) * 0.78], p3 = [S(a) * 0.58, -0.85, C(a) * 0.58];
        K.tube(b, [p0, p1, p2, p3], [0.05, 0.045, 0.035, 0.018], 7, 0xe8e8e4);
        b.at(p1[0], p1[1], p1[2], h => h.ellipsoid(0.065, 0.065, 0.065, 8, 5, 0x9a9aa0));
        b.at(p2[0], p2[1], p2[2], h => h.ellipsoid(0.05, 0.05, 0.05, 8, 5, 0x9a9aa0));
      }
      b.at(0, 0.2, 0, h => h.prism(10, 0.05, 0.05, 0, 0.05, 0.05, 4.0, 0x8a8a90));
    },
    ctlHelmet(b) {
      buildCtlHelmet(b, HEAD.heavy);
    },
    fedora(b) {
      b.at(0, -HEAD.heavy.ry * 0.62, 0, h => buildFedora(h, HEAD.heavy));
    },
    speaker(b) {
      b.at(0, 0.6, 0, h => h.box(1.2, 1.2, 0.6, 0x1c1c1e));
      [[-0.28, 0.88], [0.28, 0.88], [-0.28, 0.32], [0.28, 0.32]].forEach(([x, y]) => b.at(x, y, 0.301, h => {
        K.discXY(h, 0, 0, 0, 0.25, 18, 0x2a2a2e);
        h.at(0, 0, 0.003, q => K.discXY(q, 0, 0, 0, 0.18, 16, 0x101012));
        h.at(0, 0, 0.006, q => K.discXY(q, 0, 0, 0, 0.06, 12, 0x3a3a3e));
      }));
    },
    laptop(b) {
      b.at(0, 0.01, 0, h => h.box(0.36, 0.02, 0.25, 0xb8bcc2));
      b.at(0, 0.13, -0.125, h => { h.push(M4.rotX(-0.25)); h.box(0.36, 0.24, 0.012, 0xb8bcc2); h.pop(); });
    },
    cask(b) {
      b.at(0, 0, 0, h => h.prism(16, 0.3, 0.3, 0, 0.3, 0.3, 0.85, 0x4a5a6a, { capTop: true, capBottom: true }));
      [0.12, 0.73].forEach(y => b.at(0, y, 0, h => h.prism(16, 0.31, 0.31, -0.02, 0.31, 0.31, 0.02, 0x2a2a2e)));
    },
    chair(b) {
      b.at(0, 0.45, 0, h => h.box(0.45, 0.05, 0.45, 0x3a2a1c));
      b.at(0, 0.8, -0.2, h => h.box(0.45, 0.6, 0.05, 0x3a2a1c));
      [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([x, z]) => b.at(x, 0.22, z, h => h.box(0.04, 0.45, 0.04, 0x2a1a10)));
    },
    deskLamp(b) {
      b.at(0, 0.0, 0, h => h.prism(12, 0.1, 0.1, 0, 0.1, 0.1, 0.03, 0x2a2a2a));
      K.tube(b, [[0, 0.03, 0], [0, 0.5, 0.05], [0.2, 0.72, 0.1]], [0.012, 0.012, 0.012], 5, 0x2a2a2a);
      b.at(0.24, 0.7, 0.12, h => { h.push(M4.rotZ(-0.6)); h.prism(12, 0.04, 0.04, 0, 0.14, 0.14, -0.16, 0xd8c8a0, { capTop: false }); h.pop(); });
      b.at(0.28, 0.6, 0.12, h => h.ellipsoid(0.05, 0.05, 0.05, 8, 5, rgb(0xfff2c8, 1)));
    },
    guitarHalfA(b) {
      const body = (y, rx) => ({ y, rx, rz: 0.055, cz: 0, cx: 0, col: 0xb6803e });
      Rig.loft(b, [body(-0.25, 0.03), body(-0.235, 0.13), body(-0.14, 0.175), body(-0.05, 0.14)], 18, { capBottom: true, capTop: true });
      b.at(0, -0.04, 0.056, h => K.discXY(h, 0, 0, 0, 0.045, 14, 0x1a120c));
      b.at(0, -0.17, 0.058, h => h.box(0.13, 0.02, 0.012, 0x2a1a10));
    },
    guitarHalfB(b) {
      const body = (y, rx) => ({ y, rx, rz: 0.055, cz: 0, cx: 0, col: 0xb6803e });
      Rig.loft(b, [body(-0.03, 0.12), body(0.04, 0.105), body(0.12, 0.13), body(0.2, 0.105), body(0.235, 0.03)], 18, { capBottom: true, capTop: true });
      b.at(0, 0.47, 0.025, h => h.box(0.052, 0.52, 0.024, 0x4a2a14));
      b.at(0, 0.77, 0.02, h => h.box(0.064, 0.12, 0.022, 0x2a1a10));
    },
    cigarette(b) {
      b.at(0, 0, 0.035, h => h.box(0.009, 0.009, 0.07, 0xf2f0ea));
      b.at(0, 0, 0.073, h => h.box(0.01, 0.01, 0.008, rgb(0xff8a3a, 1)));
    },
    robotHand(b) {
      b.at(0, 0.04, 0, h => h.box(0.12, 0.06, 0.14, 0x1c1c1e));
      [-0.04, 0, 0.04].forEach(x => K.tube(b, [[x, 0.05, 0.07], [x, 0.05, 0.16], [x, 0.02, 0.22]], [0.014, 0.012, 0.01], 5, 0x2a2a2c));
      K.tube(b, [[0.06, 0.05, 0.02], [0.11, 0.05, 0.08]], [0.014, 0.01], 5, 0x2a2a2c);
      b.at(0, 0.075, -0.02, h => h.prism(12, 0.035, 0.035, 0, 0.035, 0.035, 0.01, 0xd8d8d0));
      b.at(0, 0.045, -0.12, h => h.box(0.1, 0.07, 0.12, 0x3a3a3c));
    },
    fridge(b) {
      b.at(0, 1.0, 0, h => h.box(0.9, 2.0, 0.75, 0xb8bcc2));
      b.at(0, 1.0, 0.38, h => h.box(0.02, 1.9, 0.02, 0x7a7e84));
      b.at(-0.1, 1.2, 0.39, h => h.box(0.04, 0.4, 0.04, 0x5a5e64));
    },
    raygun(b) {
      b.at(0, 0, 0, h => { h.push(M4.rotX(PI / 2)); h.prism(10, 0.03, 0.03, -0.2, 0.05, 0.05, 0.25, 0xc8a040); h.pop(); });
      [-0.12, 0.0, 0.12].forEach(z => b.at(0, 0, z, h => { h.push(M4.rotX(PI / 2)); h.prism(12, 0.09, 0.09, -0.012, 0.09, 0.09, 0.012, 0xb08a30); h.pop(); }));
      b.at(0, 0, 0.3, h => h.ellipsoid(0.05, 0.05, 0.05, 8, 6, rgb(0x6ad83a, 0.6)));
      b.at(0, -0.08, -0.12, h => h.box(0.04, 0.12, 0.05, 0x5a3a20));
    },
    thwompBox(b) {
      b.at(0, 0.45, 0, h => h.box(0.9, 0.9, 0.9, 0xd8d8d4));
      [-0.18, 0.18].forEach(x => b.at(x, 0.58, 0.455, h => h.box(0.12, 0.16, 0.01, 0x1a1a1a)));
      b.at(0, 0.36, 0.455, h => h.box(0.2, 0.05, 0.01, 0x1a1a1a));
    },
    crate(b) {
      b.at(0, 0.25, 0, h => h.box(0.7, 0.5, 0.5, 0x6a4a2c));
      b.at(0, 0.25, 0.255, h => h.box(0.66, 0.06, 0.01, 0x4a3420));
    },
    dispenser(b) {
      b.at(0, 0.5, 0, h => h.box(0.5, 1.0, 0.4, 0xb8322a));
      b.at(0, 0.7, 0.205, h => h.box(0.36, 0.3, 0.01, 0x2a2a2a));
    }
  };

  const flatLabel = (X0, Y0, X1, Y1, Z) => (b) => b.quad([X0, Y0, Z], [X1, Y0, Z], [X1, Y1, Z], [X0, Y1, Z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);

  const LABELS = {
    moon(b) {
      const nu = 28, nv = 18;
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const pt = (u, v) => {
          const yaw = (u - 0.5) * PI * 2, pit = (v - 0.5) * PI;
          return [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
        };
        const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv, v1 = (j + 1) / nv;
        const a = pt(u0, v0), c = pt(u1, v0), d = pt(u1, v1), e = pt(u0, v1);
        b.quad(a, c, d, e, rgb(0xffffff, 0.75), [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], [a, c, d, e]);
      }
    },
    whiteboard: flatLabel(-0.9, -0.55, 0.9, 0.55, 0.031),
    cask: flatLabel(-0.2, 0.25, 0.2, 0.6, 0.305),
    laptop(b) {
      b.at(0, 0.13, -0.117, h => { h.push(M4.rotX(-0.25)); h.quad([-0.16, -0.1, 0], [0.16, -0.1, 0], [0.16, 0.1, 0], [-0.16, 0.1, 0], rgb(0xffffff, 0.7), [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]); h.pop(); });
    },
    robotSpider(b) {
      b.quad([0.04, 0.05, 0.33], [0.22, 0.05, 0.27], [0.22, 0.12, 0.27], [0.04, 0.12, 0.33], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0.2, 0, 1], [0.2, 0, 1], [0.2, 0, 1], [0.2, 0, 1]]);
    },
    sign: flatLabel(-0.5, -0.5, 0.5, 0.5, 0.0),
    boardGame(b) {
      const n = [0, 1, 0];
      b.quad([-0.25, 0.021, 0.25], [0.25, 0.021, 0.25], [0.25, 0.021, -0.25], [-0.25, 0.021, -0.25], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    },
    paper: flatLabel(-0.5, -0.5, 0.5, 0.5, 0.0),
    decoy: flatLabel(-0.45, -0.8, 0.45, 0.8, 0.001),
    van(b) {
      const n = [1, 0, 0];
      b.quad([1.06, 0.5, 2.2], [1.06, 0.5, -2.2], [1.06, 1.85, -2.2], [1.06, 1.85, 2.2], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    },
    billboard(b) {
      const X = 1.95, Y0 = 0.9, Y1 = 3.5, Z = 0.105;
      b.quad([-X, Y0, Z], [X, Y0, Z], [X, Y1, Z], [-X, Y1, Z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    },
    ration(b) {
      const X = 0.25, Y = 0.08, Z = 0.0612;
      b.quad([-X, -Y, Z], [X, -Y, Z], [X, Y, Z], [-X, Y, Z], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
  };

  function build(r) {
    const P = { r, parts: {}, faces: {}, guns: {}, props: {}, hats: {}, torsoTex: {} };
    P.unitCyl = mesh(r, b => {
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
        b.quad([C(a0), 0, S(a0)], [C(a1), 0, S(a1)], [C(a1), 1, S(a1)], [C(a0), 1, S(a0)], 0xffffff, null, [[C(a0), 0, S(a0)], [C(a1), 0, S(a1)], [C(a1), 0, S(a1)], [C(a0), 0, S(a0)]]);
      }
    });
    return P;
  }

  function part(P, key, fn) {
    if (!P.parts[key]) P.parts[key] = mesh(P.r, fn);
    return P.parts[key];
  }

  function body(P, cls, team, look) {
    const key = cls + '|' + team + '|' + (look || '');
    if (P.parts[key]) return P.parts[key];
    const pal = palette(cls, team, look);
    const L = look && LOOKS[look];
    const out = {
      pal,
      torso: mesh(P.r, b => buildTorso(b, cls)),
      torsoTex: P.r.texture(256, L && L.paint ? L.paint(pal) : torsoPaint(cls, pal)),
      extras: mesh(P.r, b => buildChestExtras(b, cls, pal, look)),
      hips: mesh(P.r, b => buildHips(b, cls, pal, look)),
      foreLx: L && L.foreL ? mesh(P.r, b => L.foreL(b, pal)) : null,
      neck: mesh(P.r, b => buildNeck(b, cls, pal)),
      head: mesh(P.r, b => buildHead(b, cls, pal)),
      face: mesh(P.r, b => headPatch(b, HEAD[cls], 1.006, FP[0], FP[1], FP[2], FP[3], 18, 14, [1, 1, 1, 0], true)),
      upper: mesh(P.r, b => buildArm(b, cls, pal, 'upper')),
      fore: mesh(P.r, b => buildArm(b, cls, pal, 'fore')),
      foreRobot: cls === 'engineer' ? mesh(P.r, b => buildArm(b, cls, pal, 'fore', { robot: true })) : null,
      thigh: mesh(P.r, b => buildLeg(b, cls, pal, 'thigh')),
      shin: mesh(P.r, b => buildLeg(b, cls, pal, 'shin')),
      foot: mesh(P.r, b => buildFoot(b, cls, pal)),
      hands: {}
    };
    P.parts[key] = out;
    return out;
  }

  function hand(P, cls, team, side, grip, robot, look) {
    const key = ['hand', cls, team, side, grip, robot ? 1 : 0, look || ''].join('|');
    if (!P.parts[key]) P.parts[key] = mesh(P.r, b => buildHand(b, cls, palette(cls, team, look), side, grip, { robot }));
    return P.parts[key];
  }

  function face(P, cls, team, ex, look) {
    const key = cls + '|' + team + '|' + (look || '') + '|' + faceKey(ex);
    if (!P.faces[key]) P.faces[key] = P.r.texture(256, drawFace(cls, palette(cls, team, look), ex), { clamp: true });
    return P.faces[key];
  }

  function hatMesh(P, cls, team, hat) {
    const key = ['hat', cls, team, hat].join('|');
    if (!P.hats[key]) P.hats[key] = mesh(P.r, b => buildHat(b, cls, palette(cls, team), hat, HEAD[cls]));
    return P.hats[key];
  }

  function eyewearMesh(P, cls, kind) {
    const key = ['eye', cls, kind].join('|');
    if (!P.hats[key]) {
      P.hats[key] = mesh(P.r, b => {
        if (kind === 'shades') buildShades(b, HEAD[cls]);
        else if (kind === 'glasses') buildGlasses(b, HEAD[cls], 0x2a2a2a);
        else if (kind === 'aviators') buildGlasses(b, HEAD[cls], 0x8a7a50);
        else if (kind === 'goggles') buildGoggles(b, HEAD[cls], true);
        else if (kind === 'glasses3d') {
          [[-1, 0x2a6ad8], [1, 0xd8322a]].forEach(([s, col]) => {
            const p = headPt(HEAD[cls], s * 0.33, 0.12, 1.05);
            b.at(p[0], p[1], p[2] + 0.004, h => { h.push(M4.rotY(s * 0.3)); h.box(0.07, 0.045, 0.008, col); h.pop(); });
          });
          const p = headPt(HEAD[cls], 0, 0.12, 1.06);
          b.at(0, p[1], p[2], h => h.box(0.15, 0.012, 0.01, 0xf2f2f2));
        }
      });
    }
    return P.hats[key];
  }

  function gunMesh(P, gun) {
    if (!P.guns[gun]) P.guns[gun] = mesh(P.r, b => GUNS[gun](b));
    return P.guns[gun];
  }

  function propMesh(P, name) {
    if (!P.props[name]) P.props[name] = mesh(P.r, b => PROPS[name](b));
    return P.props[name];
  }

  function propParts(P, name) {
    const key = 'label|' + name;
    if (!P.props[key]) P.props[key] = LABELS[name] ? mesh(P.r, b => LABELS[name](b)) : null;
    return { body: propMesh(P, name), label: P.props[key] };
  }

  function solve(cls, pose) {
    return Rig.solve(pose, D[cls]);
  }

  function standY(cls) {
    const d = D[cls];
    return d.thigh + d.shin + 0.07 - d.hipY - 0.02;
  }

  function draw(r0, P, a, m, opts) {
    const o = opts || {};
    const r = o.pre ? { draw: (ms, M, ps) => r0.draw(ms, M4.mul(o.pre, M), ps) } : r0;
    const cls = a.cls, team = a.team || 'red';
    const look = a.look;
    const B = body(P, cls, team, look);
    const pass = {};
    if (o.tint || a.tint) pass.tint = o.tint || a.tint;
    if (o.alpha !== undefined && o.alpha < 1) { pass.blend = true; pass.alpha = o.alpha; }
    if (o.flat) { pass.flat = o.flat; pass.shadow = true; }
    if (o.additive) { pass.additive = true; pass.alpha = o.alpha === undefined ? 0.5 : o.alpha; delete pass.blend; }
    const tex = (t) => Object.assign({ texture: t }, pass);
    r.draw(B.hips, m.pelvis, pass);
    r.draw(B.torso, m.chest, o.flat ? pass : tex(B.torsoTex));
    r.draw(B.extras, m.chest, pass);
    r.draw(B.neck, m.neck, pass);
    const hm = a.headScale ? M4.chain(m.head, M4.scale(a.headScale, a.headScale, a.headScale)) : m.head;
    r.draw(B.head, hm, pass);
    if (!o.flat) r.draw(B.face, hm, tex(face(P, cls, team, a.face || {}, look)));
    const hat = a.hat === undefined ? (look && LOOKS[look] && LOOKS[look].hat) || DEFAULT_HAT[cls] : a.hat;
    if (hat && hat !== 'none') r.draw(hatMesh(P, cls, team, hat), hm, pass);
    if (a.eyewear) r.draw(eyewearMesh(P, cls, a.eyewear), hm, pass);
    ['L', 'R'].forEach(s => {
      r.draw(B.upper, m['upper' + s], pass);
      const robot = s === 'R' && a.robot && cls === 'engineer';
      r.draw(robot ? B.foreRobot : B.fore, m['fore' + s], pass);
      r.draw(hand(P, cls, team, s, (a.grips && a.grips[s]) || 'relax', robot, look), m['hand' + s], pass);
      if (s === 'L' && B.foreLx) r.draw(B.foreLx, m.foreL, pass);
      if (!o.noLegs) {
        r.draw(B.thigh, m['thigh' + s], pass);
        r.draw(B.shin, m['shin' + s], pass);
        r.draw(B.foot, m['foot' + s], pass);
      }
    });
    if (a.gun && TWO[a.gun]) {
      const g = a.gunM || twoHanded(a.gun, a.gunOpts).M;
      r.draw(gunMesh(P, a.gun), M4.mul(m.chest, g), pass);
    }
    ['L', 'R'].forEach(s => {
      const item = a['item' + s];
      if (item && GUNS[item]) r.draw(gunMesh(P, item), M4.mul(m['hand' + s], HOLD[item] || M4.ident()), pass);
    });
  }

  window.FabCast = { TEAMS, D, HEAD, SKIN, LIMBS, LOOKS, TWO, GUNS, PROPS, LABELS, palette, build, body, solve, standY, draw, twoHanded, propMesh, propParts, gunMesh, headPt };
})();
