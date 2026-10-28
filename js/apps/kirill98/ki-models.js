(function (K) {
  'use strict';

  const SLOT = Object.freeze({ skin: 0, hair: 1, main: 2, accent: 3, metal: 4, leather: 5, face: 6, wood: 7, dark: 8, cloth: 9, bandage: 10 });
  const STRIDE = 9, CLASSES = [96, 192, 288, 384, 576, 768, 1152, 1536], INST = 20;
  const R = () => K.Tex.PREG;

  const builder = () => {
    const a = [];
    return {
      a,
      vert(p, n, uv, slot) { a.push(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1], slot); },
      tri(p0, p1, p2, n0, n1, n2, t0, t1, t2, slot) { this.vert(p0, n0, t0, slot); this.vert(p1, n1, t1, slot); this.vert(p2, n2, t2, slot); }
    };
  };

  const norm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const cell = (reg, u, v) => K.Tex.pcell(reg, u, v);

  function lathe(B, rings, sides, slot, reg, o) {
    const opt = o || {}, n = rings.length, pts = [], nrm = [], add = opt.grow || 0;
    const rr = rings.map(r => [r[0], r[1] + (r[1] > 0 ? add : 0), r[2] + (r[2] > 0 ? add : 0), r[3] || 0, r[4] || 0]);
    for (let i = 0; i < n; i++) {
      const [y, rx, rz, cx, cz] = rr[i], lo = rr[Math.max(0, i - 1)], hi = rr[Math.min(n - 1, i + 1)], dy = hi[0] - lo[0] || 1;
      const drx = (hi[1] - lo[1]) / dy, drz = (hi[2] - lo[2]) / dy, dcx = (hi[3] - lo[3]) / dy, dcz = (hi[4] - lo[4]) / dy;
      const row = [], nr = [];
      for (let k = 0; k <= sides; k++) {
        const a = k / sides * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        row.push([cx + rx * c, y, cz + rz * s]);
        if (rx < 1e-6 && rz < 1e-6) nr.push([0, i === 0 ? -1 : 1, 0]);
        else nr.push(norm(cross([drx * c + dcx, 1, drz * s + dcz], [-rx * s, 0, rz * c])));
      }
      pts.push(row);
      nrm.push(nr);
    }
    const uvOf = (p, k, i) => cell(reg, k / sides, i / (n - 1));
    for (let i = 0; i < n - 1; i++) {
      for (let k = 0; k < sides; k++) {
        const q = [[i, k], [i, k + 1], [i + 1, k + 1], [i + 1, k]];
        for (const tri of [[q[0], q[1], q[2]], [q[0], q[2], q[3]]]) {
          const P = tri.map(([a, b]) => pts[a][b]);
          const area = cross([P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]], [P[2][0] - P[0][0], P[2][1] - P[0][1], P[2][2] - P[0][2]]);
          if (Math.hypot(area[0], area[1], area[2]) < 1e-10) continue;
          const c = [(P[0][0] + P[1][0] + P[2][0]) / 3, (P[0][1] + P[1][1] + P[2][1]) / 3, (P[0][2] + P[1][2] + P[2][2]) / 3];
          const N = tri.map(([a, b]) => nrm[a][b]);
          const nc = norm([N[0][0] + N[1][0] + N[2][0], N[0][1] + N[1][1] + N[2][1], N[0][2] + N[1][2] + N[2][2]]);
          if (opt.keep && !opt.keep(c, nc)) continue;
          const sl = opt.slotOf ? opt.slotOf(c, nc) : slot;
          const T = tri.map(([a, b], j) => (opt.uvOf && opt.uvOf(P[j], sl)) || uvOf(P[j], b, a));
          B.tri(P[0], P[1], P[2], N[0], N[1], N[2], T[0], T[1], T[2], sl);
        }
      }
    }
    for (const [i, j, want] of [[0, 1, opt.cap0], [n - 1, n - 2, opt.cap1]]) {
      const r = rr[i], up = r[0] > rr[j][0] ? 1 : -1;
      if (!want || (r[1] < 1e-6 && r[2] < 1e-6)) continue;
      const c = [r[3], r[0], r[4]], nn = [0, up, 0], t = cell(reg, 0.5, 0.5);
      for (let k = 0; k < sides; k++) {
        const a = pts[i][k], b = pts[i][k + 1];
        B.tri(c, a, b, nn, nn, nn, t, t, t, slot);
      }
    }
  }

  function box(B, c, h, slot, reg) {
    const [x, y, z] = c, [a, b, d] = h;
    const faces = [
      [[1, 0, 0], [[x + a, y - b, z - d], [x + a, y - b, z + d], [x + a, y + b, z + d], [x + a, y + b, z - d]]],
      [[-1, 0, 0], [[x - a, y - b, z + d], [x - a, y - b, z - d], [x - a, y + b, z - d], [x - a, y + b, z + d]]],
      [[0, 1, 0], [[x - a, y + b, z - d], [x + a, y + b, z - d], [x + a, y + b, z + d], [x - a, y + b, z + d]]],
      [[0, -1, 0], [[x - a, y - b, z + d], [x + a, y - b, z + d], [x + a, y - b, z - d], [x - a, y - b, z - d]]],
      [[0, 0, 1], [[x + a, y - b, z + d], [x - a, y - b, z + d], [x - a, y + b, z + d], [x + a, y + b, z + d]]],
      [[0, 0, -1], [[x - a, y - b, z - d], [x + a, y - b, z - d], [x + a, y + b, z - d], [x - a, y + b, z - d]]]
    ];
    const t = [cell(reg, 0, 1), cell(reg, 1, 1), cell(reg, 1, 0), cell(reg, 0, 0)];
    for (const [n, q] of faces) {
      B.tri(q[0], q[1], q[2], n, n, n, t[0], t[1], t[2], slot);
      B.tri(q[0], q[2], q[3], n, n, n, t[0], t[2], t[3], slot);
    }
  }

  function wedge(B, base, tip, slot, reg) {
    const c = [0, 1, 2].map(i => (base[0][i] + base[1][i] + base[2][i] + base[3][i]) / 4);
    const t = [cell(reg, 0, 1), cell(reg, 1, 1), cell(reg, 0.5, 0)];
    for (let k = 0; k < 4; k++) {
      const a = base[k], b = base[(k + 1) % 4];
      let n = norm(cross([b[0] - a[0], b[1] - a[1], b[2] - a[2]], [tip[0] - a[0], tip[1] - a[1], tip[2] - a[2]]));
      const out = [a[0] + b[0] + tip[0] - 3 * c[0], a[1] + b[1] + tip[1] - 3 * c[1], a[2] + b[2] + tip[2] - 3 * c[2]];
      if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) n = n.map(v => -v);
      B.tri(a, b, tip, n, n, n, t[0], t[1], t[2], slot);
    }
  }

  const ell = (B, c, r, sides, rings, slot, reg) => {
    const list = [];
    for (let i = 0; i <= rings; i++) {
      const a = -Math.PI / 2 + Math.PI * i / rings;
      list.push([c[1] + Math.sin(a) * r[1], Math.cos(a) * r[0], Math.cos(a) * r[2], c[0], c[2]]);
    }
    lathe(B, list, sides, slot, reg);
  };

  const HEAD_M = [[0.072, 0, 0, 0, -0.06], [0.085, 0.035, 0.03, 0, -0.058], [0.11, 0.058, 0.07, 0, -0.025], [0.15, 0.07, 0.088, 0, -0.01], [0.19, 0.077, 0.098, 0, 0], [0.235, 0.076, 0.098, 0, 0.004], [0.275, 0.064, 0.085, 0, 0.006], [0.3, 0.04, 0.055, 0, 0.006], [0.312, 0, 0, 0, 0.006]];
  const HEAD_F = HEAD_M.map(([y, rx, rz, cx, cz]) => [y, rx * (y < 0.16 ? 0.9 : 0.97), rz * 0.97, cx, cz * (y < 0.12 ? 0.85 : 1)]);
  const SKULL = HEAD_M.slice(3);

  const faceUv = p => cell(R().face, K.clamp(0.5 + p[0] / 0.15, 0, 1), K.clamp((0.275 - p[1]) / 0.2, 0, 1));
  const inFace = c => c[2] < -0.045 && c[1] > 0.085 && c[1] < 0.272;

  function head(race, fig) {
    const B = builder(), rg = R(), rings = fig === 'f' ? HEAD_F : HEAD_M;
    lathe(B, rings, 10, SLOT.skin, rg.skin, {
      slotOf: c => inFace(c) ? SLOT.face : SLOT.skin,
      uvOf: (p, sl) => sl === SLOT.face ? faceUv(p) : null
    });
    lathe(B, [[-0.03, 0.05, 0.048], [0.1, 0.045, 0.045, 0, -0.005]], 8, SLOT.skin, rg.skin);
    const nz = fig === 'f' ? -0.092 : -0.096;
    wedge(B, [[-0.014, 0.19, nz], [0.014, 0.19, nz], [0.016, 0.148, nz - 0.004], [-0.016, 0.148, nz - 0.004]], [0, 0.152, nz - 0.03], SLOT.skin, rg.skin);
    for (const s of [-1, 1]) {
      if (race === 'elf') {
        wedge(B, [[0.072 * s, 0.215, 0.0], [0.072 * s, 0.215, 0.03], [0.07 * s, 0.165, 0.03], [0.07 * s, 0.165, 0.0]], [0.155 * s, 0.3, 0.075], SLOT.skin, rg.skin);
      } else {
        box(B, [0.077 * s, 0.18, 0.012], [0.011, 0.027, 0.017], SLOT.skin, rg.skin);
      }
    }
    return B;
  }

  const hairCap = (B, grow, low, front) => lathe(B, SKULL.map(r => [r[0] < 0.16 ? low : r[0], r[1], r[2], r[3], r[4]]), 10, SLOT.hair, R().hair, {
    grow, keep: c => !(c[2] < -0.03 && c[1] < front)
  });

  const HAIR = {
    crop: B => hairCap(B, 0.006, 0.17, 0.262),
    short: B => hairCap(B, 0.014, 0.13, 0.25),
    long: B => {
      hairCap(B, 0.014, 0.13, 0.25);
      lathe(B, [[-0.03, 0.095, 0.075, 0, 0.04], [0.08, 0.088, 0.085, 0, 0.03], [0.2, 0.09, 0.105, 0, 0.012]], 10, SLOT.hair, R().hair, { keep: c => c[2] > 0.01 });
    },
    tail: B => {
      hairCap(B, 0.008, 0.15, 0.258);
      lathe(B, [[-0.07, 0.016, 0.016, 0, 0.13], [0.05, 0.022, 0.022, 0, 0.12], [0.17, 0.026, 0.026, 0, 0.1]], 6, SLOT.hair, R().hair, { cap0: true });
    },
    braid: B => {
      hairCap(B, 0.008, 0.15, 0.258);
      const r = [];
      for (let i = 0; i <= 8; i++) r.push([0.17 - i * 0.04, i % 2 ? 0.022 : 0.03, i % 2 ? 0.022 : 0.03, 0, 0.1 + Math.min(i, 3) * 0.012]);
      lathe(B, r.reverse(), 6, SLOT.hair, R().hair, { cap0: true });
    },
    bun: B => {
      hairCap(B, 0.008, 0.15, 0.258);
      ell(B, [0, 0.245, 0.1], [0.045, 0.04, 0.04], 6, 3, SLOT.hair, R().hair);
    }
  };

  function beard() {
    const B = builder();
    lathe(B, [[0.058, 0.0, 0.0, 0, -0.07], [0.075, 0.04, 0.035, 0, -0.065], [0.105, 0.064, 0.077, 0, -0.03], [0.15, 0.075, 0.094, 0, -0.012], [0.17, 0.078, 0.098, 0, -0.006]], 10, SLOT.hair, R().hair, {
      grow: 0.008, keep: c => c[2] < 0.03 && !(c[2] < -0.07 && c[1] > 0.115)
    });
    return B;
  }

  const HATS = {
    hood: B => {
      lathe(B, [[0.03, 0.1, 0.095, 0, 0.02], [0.09, 0.087, 0.105, 0, 0.01], [0.16, 0.092, 0.113, 0, 0.006], [0.22, 0.093, 0.116, 0, 0.012], [0.28, 0.08, 0.104, 0, 0.022], [0.33, 0.05, 0.072, 0, 0.045], [0.375, 0, 0, 0, 0.085]], 10, SLOT.main, R().wool, {
        keep: c => !(c[2] < -0.035 && c[1] > 0.06 && c[1] < 0.285)
      });
      lathe(B, [[-0.07, 0.205, 0.145, 0, 0.0], [-0.02, 0.18, 0.13, 0, 0.005], [0.04, 0.105, 0.098, 0, 0.018]], 10, SLOT.main, R().wool);
    },
    cap: B => lathe(B, [[0.24, 0.085, 0.104, 0, 0.004], [0.28, 0.088, 0.107, 0, 0.004], [0.32, 0.072, 0.092, 0, 0.004], [0.345, 0, 0, 0, 0.004]], 10, SLOT.accent, R().felt, { cap0: false }),
    kerchief: B => {
      lathe(B, [[0.1, 0.075, 0.09, 0, 0.012], [0.16, 0.084, 0.104, 0, 0.006], [0.22, 0.088, 0.11, 0, 0.006], [0.27, 0.076, 0.098, 0, 0.008], [0.305, 0.048, 0.064, 0, 0.008], [0.322, 0, 0, 0, 0.008]], 10, SLOT.accent, R().linen, {
        keep: c => !(c[2] < -0.04 && c[1] < 0.262)
      });
      box(B, [0, 0.13, 0.108], [0.02, 0.02, 0.015], SLOT.accent, R().linen);
      wedge(B, [[-0.05, 0.13, 0.1], [0.05, 0.13, 0.1], [0.05, 0.13, 0.115], [-0.05, 0.13, 0.115]], [0, 0.03, 0.12], SLOT.accent, R().linen);
    },
    crest: B => {
      lathe(B, [[0.2, 0.089, 0.109, 0, 0.004], [0.25, 0.091, 0.111, 0, 0.004], [0.3, 0.076, 0.096, 0, 0.004], [0.34, 0.046, 0.062, 0, 0.004], [0.372, 0, 0, 0, 0.006]], 10, SLOT.metal, R().steel);
      lathe(B, [[0.195, 0.094, 0.114, 0, 0.004], [0.215, 0.094, 0.114, 0, 0.004]], 10, SLOT.metal, R().steel);
      box(B, [0, 0.39, 0.012], [0.009, 0.035, 0.07], SLOT.accent, R().felt);
      box(B, [0, 0.345, -0.07], [0.008, 0.012, 0.012], SLOT.metal, R().steel);
    },
    crown: B => {
      lathe(B, [[0.24, 0.093, 0.113, 0, 0.004], [0.3, 0.096, 0.116, 0, 0.004]], 12, SLOT.accent, R().iron, { cap0: false });
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, x = Math.sin(a), z = Math.cos(a); box(B, [x * 0.097, 0.325, z * 0.116], [0.012, 0.03, 0.012], SLOT.accent, R().iron); box(B, [x * 0.1, 0.27, z * 0.12], [0.009, 0.009, 0.006], i % 2 ? SLOT.main : SLOT.metal, R().steel); }
      lathe(B, [[0.29, 0.088, 0.106, 0, 0.004], [0.33, 0.04, 0.05, 0, 0.004], [0.345, 0, 0, 0, 0.004]], 10, SLOT.main, R().felt);
    },
    nasal: B => {
      lathe(B, [[0.2, 0.088, 0.107, 0, 0.004], [0.26, 0.083, 0.101, 0, 0.004], [0.32, 0.056, 0.072, 0, 0.004], [0.385, 0, 0, 0, 0.006]], 8, SLOT.metal, R().iron);
      lathe(B, [[0.193, 0.093, 0.112, 0, 0.004], [0.214, 0.093, 0.112, 0, 0.004]], 8, SLOT.metal, R().iron);
      box(B, [0, 0.168, -0.112], [0.009, 0.04, 0.005], SLOT.metal, R().iron);
    },
    closed: B => {
      lathe(B, [[0.06, 0.088, 0.108, 0, -0.008], [0.12, 0.096, 0.116, 0, -0.004], [0.3, 0.096, 0.116, 0, 0], [0.33, 0.08, 0.1, 0, 0], [0.336, 0, 0, 0, 0]], 10, SLOT.metal, R().iron, { cap0: false });
      box(B, [0, 0.196, -0.114], [0.065, 0.01, 0.006], SLOT.dark, R().slit);
      box(B, [0, 0.13, -0.118], [0.01, 0.06, 0.004], SLOT.metal, R().iron);
    }
  };

  const CHEST_M = [[0, 0.15, 0.1], [0.1, 0.16, 0.108], [0.2, 0.172, 0.115], [0.265, 0.19, 0.112], [0.31, 0.16, 0.095], [0.345, 0.09, 0.065], [0.37, 0.052, 0.048]];
  const CHEST_F = [[0, 0.138, 0.096], [0.1, 0.145, 0.1], [0.2, 0.162, 0.108], [0.265, 0.18, 0.106], [0.31, 0.152, 0.09], [0.345, 0.086, 0.062], [0.37, 0.05, 0.046]];
  const BELLY_M = [[-0.1, 0.12, 0.085], [-0.03, 0.155, 0.1], [0.05, 0.16, 0.103], [0.12, 0.153, 0.1], [0.2, 0.15, 0.1]];
  const BELLY_F = [[-0.1, 0.135, 0.09], [-0.03, 0.178, 0.108], [0.05, 0.175, 0.106], [0.12, 0.15, 0.098], [0.2, 0.138, 0.096]];

  function chest(side, fig) {
    const B = builder(), rg = R(), f = fig === 'f', rings = f ? CHEST_F : CHEST_M;
    const tex = { elf: rg.leather, guard: rg.smooth, villain: rg.quilt, town: rg.linen }[side];
    lathe(B, rings, 10, SLOT.main, tex);
    for (const s of [-1, 1]) {
      ell(B, [0.185 * s, 0.29, 0], f ? [0.06, 0.062, 0.058] : [0.066, 0.066, 0.062], 6, 3, SLOT.main, tex);
      if (f) ell(B, [0.052 * s, 0.19, -0.07], [0.052, 0.05, 0.045], 6, 3, SLOT.main, tex);
    }
    const front = f ? -0.11 : -0.117;
    if (side === 'elf') {
      box(B, [0, 0.17, front], [0.012, 0.13, 0.006], SLOT.accent, rg.leather);
      lathe(B, [[0.33, 0.1, 0.075], [0.375, 0.058, 0.052]], 10, SLOT.accent, rg.linen);
    } else if (side === 'guard') {
      box(B, [-0.022, 0.17, front], [0.014, 0.17, 0.006], SLOT.accent, rg.trim);
      for (const y of [0.12, 0.18, 0.24]) box(B, [0.02, y, front + 0.002], [0.04, 0.007, 0.006], SLOT.accent, rg.trim);
      lathe(B, [[0.33, 0.1, 0.075], [0.385, 0.06, 0.055]], 10, SLOT.accent, rg.trim);
    } else if (side === 'villain') {
      lathe(B, [[0.33, 0.1, 0.075], [0.38, 0.06, 0.054]], 10, SLOT.accent, rg.wool);
    } else {
      box(B, [-0.03, 0.3, front + 0.02], [0.006, 0.04, 0.006], SLOT.accent, rg.linen);
    }
    return B;
  }

  function belly(side, fig) {
    const B = builder(), rg = R(), f = fig === 'f', rings = f ? BELLY_F : BELLY_M;
    if (side === 'guard') {
      lathe(B, rings, 10, SLOT.cloth, rg.wool, { cap0: true });
      lathe(B, [[-0.32, 0.27, 0.215, 0, 0.01], [-0.1, 0.228, 0.165], [0.05, 0.19, 0.128], [0.2, 0.152, 0.102]], 12, SLOT.main, rg.smooth);
      lathe(B, [[-0.325, 0.274, 0.219, 0, 0.01], [-0.27, 0.262, 0.205, 0, 0.008]], 12, SLOT.accent, rg.trim);
      lathe(B, [[0.11, 0.163, 0.108], [0.17, 0.158, 0.106]], 10, SLOT.accent, rg.wool);
    } else if (side === 'town' && f) {
      lathe(B, rings, 10, SLOT.cloth, rg.wool, { cap0: true });
      lathe(B, [[-0.84, 0.32, 0.28, 0, 0.01], [-0.62, 0.3, 0.26], [-0.3, 0.25, 0.2], [0.02, 0.19, 0.13], [0.14, 0.15, 0.1]], 12, SLOT.accent, rg.wool);
      lathe(B, [[-0.6, 0.31, 0.27, 0, 0.004], [-0.3, 0.262, 0.212], [0.0, 0.2, 0.142], [0.1, 0.168, 0.116]], 12, SLOT.main, rg.linen, { keep: c => c[2] < -0.06 && Math.abs(c[0]) < 0.17 });
    } else {
      const tex = { elf: rg.leather, villain: rg.quilt, town: rg.linen }[side];
      lathe(B, rings, 10, SLOT.accent, rg.wool, { cap0: true, slotOf: c => c[1] > 0.02 ? SLOT.main : SLOT.accent });
      const flare = { elf: [[-0.14, 0.205, 0.145], [-0.05, 0.188, 0.128], [0.08, 0.165, 0.108]], villain: [[-0.16, 0.21, 0.15], [-0.05, 0.192, 0.132], [0.08, 0.166, 0.11]], town: [[-0.12, 0.2, 0.14], [-0.04, 0.186, 0.125], [0.08, 0.163, 0.107]] }[side];
      lathe(B, flare, 10, SLOT.main, tex);
      const belt = side === 'villain' ? [[0.04, 0.17, 0.114], [0.12, 0.165, 0.112]] : [[0.07, 0.166, 0.11], [0.105, 0.163, 0.108]];
      lathe(B, belt, 10, SLOT.leather, rg.leather);
      if (side === 'villain') for (const x of [-0.12, -0.06, 0, 0.06, 0.12]) box(B, [x, 0.08, -0.115], [0.008, 0.008, 0.004], SLOT.metal, rg.iron);
    }
    return B;
  }

  const slice = (rings, a, b, grow, scale) => {
    const lo = Math.min(a, b), hi = Math.max(a, b), k = scale || 1;
    const s = rings.map(r => [r[0], r[1], r[2], r[3] || 0, r[4] || 0]).sort((p, q) => p[0] - q[0]);
    const at = y => {
      for (let i = 0; i < s.length - 1; i++) {
        if (y < s[i][0] || y > s[i + 1][0]) continue;
        const t = (y - s[i][0]) / (s[i + 1][0] - s[i][0] || 1);
        return s[i].map((v, j) => j === 0 ? y : v + (s[i + 1][j] - v) * t);
      }
      return null;
    };
    const out = [at(lo), ...s.filter(r => r[0] > lo + 1e-9 && r[0] < hi - 1e-9), at(hi)].filter(Boolean);
    return out.map(r => [r[0], r[1] * k + grow, r[2] * k + grow, r[3], r[4]]);
  };

  const ARM = [[0.03, 0.05, 0.05], [-0.02, 0.058, 0.056], [-0.28, 0.046, 0.044], [-0.31, 0.04, 0.04]];
  const FORE = [[0.0, 0.047, 0.045], [-0.22, 0.037, 0.035], [-0.245, 0.034, 0.032]];
  const THIGH = [[0.03, 0.076, 0.08], [0.0, 0.082, 0.085], [-0.4, 0.062, 0.06], [-0.44, 0.055, 0.055]];
  const SHIN = [[0.0, 0.06, 0.06], [-0.12, 0.059, 0.057], [-0.42, 0.04, 0.04]];

  const limbStyle = set => ({
    elf: { sleeve: SLOT.accent, sleeveTex: 'linen', legs: SLOT.accent, legTex: 'wool', boot: -0.02 },
    guard: { sleeve: SLOT.main, sleeveTex: 'smooth', legs: SLOT.cloth, legTex: 'wool', boot: -0.05 },
    villain: { sleeve: SLOT.main, sleeveTex: 'quilt', legs: SLOT.accent, legTex: 'wool', boot: -0.12 },
    'town.m': { sleeve: SLOT.main, sleeveTex: 'linen', legs: SLOT.accent, legTex: 'wool', boot: -0.26 },
    'town.f': { sleeve: SLOT.main, sleeveTex: 'linen', legs: SLOT.cloth, legTex: 'wool', boot: -0.36 }
  }[set]);

  function arm(set) {
    const B = builder(), L = limbStyle(set);
    lathe(B, ARM, 7, L.sleeve, R()[L.sleeveTex], { cap0: true, cap1: true });
    return B;
  }

  const hand = (B, slot, reg) => {
    lathe(B, [[-0.268, 0.027, 0.024], [-0.24, 0.029, 0.027]], 6, slot, reg);
    box(B, [0, -0.305, 0], [0.014, 0.045, 0.04], slot, reg);
    box(B, [0.002, -0.375, 0.002], [0.012, 0.027, 0.036], slot, reg);
    box(B, [0.006, -0.3, -0.047], [0.01, 0.028, 0.01], slot, reg);
  };

  const fist = (B, slot, reg) => {
    lathe(B, [[-0.268, 0.027, 0.024], [-0.25, 0.029, 0.027]], 6, slot, reg);
    box(B, [0, -0.306, 0.004], [0.026, 0.04, 0.04], slot, reg);
    box(B, [0, -0.336, 0.004], [0.022, 0.016, 0.042], slot, reg);
    box(B, [0, -0.29, -0.046], [0.015, 0.014, 0.012], slot, reg);
  };

  function fore(set, grip) {
    const B = builder(), L = limbStyle(set), rg = R();
    lathe(B, FORE, 7, L.sleeve, rg[L.sleeveTex], { cap0: true });
    if (set === 'guard') lathe(B, [[-0.248, 0.04, 0.038], [-0.2, 0.044, 0.042]], 7, SLOT.accent, rg.trim, { cap0: true });
    (grip ? fist : hand)(B, SLOT.skin, rg.skin);
    return B;
  }

  function thigh(set) {
    const B = builder(), L = limbStyle(set);
    lathe(B, THIGH, 7, L.legs, R()[L.legTex], { cap0: true, cap1: true });
    return B;
  }

  const foot = (B, slot, reg) => {
    box(B, [0, -0.465, -0.01], [0.042, 0.035, 0.062], slot, reg);
    box(B, [0, -0.475, -0.12], [0.038, 0.025, 0.05], slot, reg);
  };

  function shin(set) {
    const B = builder(), L = limbStyle(set), rg = R();
    lathe(B, slice(SHIN, L.boot - 0.02, 0.0, 0), 7, L.legs, rg[L.legTex], { cap1: true });
    lathe(B, slice(SHIN, -0.43, L.boot, 0.007), 7, SLOT.leather, rg.boot);
    foot(B, SLOT.leather, rg.boot);
    return B;
  }

  function ironFore() {
    const B = builder(), rg = R();
    lathe(B, [[-0.245, 0.03, 0.03], [-0.2, 0.026, 0.026], [-0.07, 0.03, 0.03], [-0.035, 0.046, 0.044], [0.02, 0.052, 0.05]], 8, SLOT.metal, rg.iron, { cap0: true });
    lathe(B, [[-0.03, 0.05, 0.048], [0.0, 0.053, 0.051]], 8, SLOT.leather, rg.leather);
    box(B, [0, -0.3, 0], [0.016, 0.045, 0.038], SLOT.metal, rg.iron);
    box(B, [0.003, -0.36, 0.002], [0.013, 0.016, 0.034], SLOT.metal, rg.iron);
    box(B, [0.009, -0.392, 0.002], [0.011, 0.016, 0.032], SLOT.metal, rg.iron);
    box(B, [0.006, -0.295, -0.048], [0.01, 0.03, 0.01], SLOT.metal, rg.iron);
    return B;
  }

  function ironShin() {
    const B = builder(), rg = R();
    lathe(B, [[-0.43, 0.035, 0.035], [-0.4, 0.028, 0.028], [-0.1, 0.03, 0.03], [-0.05, 0.05, 0.05], [0.03, 0.066, 0.066]], 8, SLOT.metal, rg.iron, { cap0: true });
    lathe(B, [[-0.03, 0.064, 0.064], [0.01, 0.068, 0.068]], 8, SLOT.leather, rg.leather);
    foot(B, SLOT.metal, rg.iron);
    return B;
  }

  function peg() {
    const B = builder(), rg = R();
    lathe(B, [[-0.12, 0.04, 0.04], [-0.08, 0.055, 0.055], [0.03, 0.066, 0.066]], 8, SLOT.leather, rg.leather, { cap0: true });
    lathe(B, [[-0.5, 0.024, 0.024], [-0.47, 0.022, 0.022], [-0.12, 0.036, 0.036]], 6, SLOT.wood, rg.wood, { cap0: true });
    return B;
  }


  function hookFore() {
    const B = builder(), rg = R();
    lathe(B, [[-0.17, 0.034, 0.032], [-0.1, 0.044, 0.042], [-0.035, 0.05, 0.048], [0.02, 0.054, 0.052]], 8, SLOT.leather, rg.leather, { cap0: true });
    lathe(B, [[-0.24, 0.02, 0.02], [-0.21, 0.03, 0.03], [-0.17, 0.034, 0.034]], 7, SLOT.wood, rg.wood, { cap0: true });
    const arc = [[0, -0.24, 0], [0, -0.3, 0.004], [0.006, -0.35, 0.016], [0.004, -0.385, 0.045], [-0.004, -0.38, 0.072], [-0.01, -0.355, 0.082]];
    for (let i = 0; i < arc.length - 1; i++) obox(B, arc[i], arc[i + 1], [1, 0, 0], 0.008, 0.008, SLOT.metal, rg.iron);
    for (const y of [-0.06, -0.13]) lathe(B, [[y - 0.008, 0.052, 0.05], [y + 0.008, 0.052, 0.05]], 8, SLOT.metal, rg.iron);
    return B;
  }

  function carvedFore() {
    const B = builder(), rg = R();
    lathe(B, [[-0.3, 0.028, 0.024], [-0.22, 0.034, 0.03], [-0.1, 0.042, 0.038], [-0.03, 0.047, 0.045], [0.02, 0.05, 0.048]], 8, SLOT.wood, rg.wood, { cap0: true });
    lathe(B, [[-0.025, 0.05, 0.048], [0.005, 0.053, 0.051]], 8, SLOT.leather, rg.leather);
    for (const y of [-0.08, -0.16, -0.24]) lathe(B, [[y - 0.004, 0.04 - y * 0.03, 0.037 - y * 0.03], [y + 0.004, 0.04 - y * 0.03, 0.037 - y * 0.03]], 8, SLOT.dark, rg.wood);
    box(B, [0, -0.335, 0.004], [0.017, 0.04, 0.038], SLOT.wood, rg.wood);
    for (let f = 0; f < 4; f++) obox(B, [0.006, -0.37, -0.026 + f * 0.017], [0.012, -0.415, -0.026 + f * 0.018], [0, 0, 1], 0.007, 0.007, SLOT.wood, rg.wood);
    obox(B, [0.01, -0.33, 0.036], [0.02, -0.365, 0.05], [0, 0, 1], 0.008, 0.008, SLOT.wood, rg.wood);
    return B;
  }

  function hingeFore() {
    const B = builder(), rg = R();
    lathe(B, [[-0.2, 0.034, 0.032], [-0.12, 0.04, 0.038], [-0.04, 0.047, 0.045], [0.02, 0.052, 0.05]], 8, SLOT.wood, rg.wood, { cap0: true });
    for (const s of [-1, 1]) obox(B, [0.046 * s, 0.0, 0], [0.034 * s, -0.27, 0], [0, 0, 1], 0.012, 0.005, SLOT.metal, rg.iron);
    for (const y of [-0.02, -0.11]) lathe(B, [[y - 0.007, 0.05, 0.048], [y + 0.007, 0.05, 0.048]], 8, SLOT.metal, rg.iron);
    ell(B, [0, -0.255, 0], [0.034, 0.022, 0.032], 6, 3, SLOT.metal, rg.iron);
    box(B, [0, -0.31, 0.003], [0.016, 0.034, 0.036], SLOT.metal, rg.iron);
    for (let f = 0; f < 4; f++) for (const [a, b] of [[-0.343, -0.37], [-0.372, -0.398]]) obox(B, [0.004, a, -0.026 + f * 0.017], [0.008, b, -0.026 + f * 0.017], [0, 0, 1], 0.0065, 0.0065, SLOT.metal, rg.iron);
    obox(B, [0.01, -0.3, 0.034], [0.022, -0.34, 0.05], [0, 0, 1], 0.008, 0.008, SLOT.metal, rg.iron);
    return B;
  }

  function willowShin() {
    const B = builder(), rg = R();
    lathe(B, [[-0.12, 0.042, 0.042], [-0.08, 0.056, 0.056], [0.03, 0.066, 0.066]], 8, SLOT.leather, rg.leather, { cap0: true });
    lathe(B, [[-0.44, 0.03, 0.034], [-0.38, 0.03, 0.03], [-0.25, 0.036, 0.036], [-0.12, 0.044, 0.044]], 8, SLOT.wood, rg.wood, { cap0: true });
    for (let k = 0; k < 7; k++) { const y = -0.4 + k * 0.045; lathe(B, [[y - 0.006, 0.035 + k * 0.0016, 0.035 + k * 0.0016], [y + 0.006, 0.035 + k * 0.0016, 0.035 + k * 0.0016]], 8, SLOT.dark, rg.wood); }
    box(B, [0, -0.465, -0.04], [0.036, 0.022, 0.07], SLOT.wood, rg.wood);
    return B;
  }

  function hingeShin() {
    const B = builder(), rg = R();
    lathe(B, [[-0.14, 0.042, 0.042], [-0.08, 0.058, 0.058], [0.03, 0.066, 0.066]], 8, SLOT.wood, rg.wood, { cap0: true });
    for (const s of [-1, 1]) obox(B, [0.056 * s, 0.0, 0], [0.026 * s, -0.4, 0], [0, 0, 1], 0.014, 0.006, SLOT.metal, rg.iron);
    lathe(B, [[-0.4, 0.03, 0.03], [-0.14, 0.032, 0.032]], 7, SLOT.metal, rg.iron);
    ell(B, [0, -0.42, 0], [0.032, 0.026, 0.032], 6, 3, SLOT.metal, rg.iron);
    for (const y of [-0.03, -0.1]) lathe(B, [[y - 0.008, 0.062, 0.062], [y + 0.008, 0.062, 0.062]], 8, SLOT.metal, rg.iron);
    foot(B, SLOT.leather, rg.boot);
    return B;
  }

  const ARMOR = {
    'mail.chest': () => { const B = builder(); lathe(B, slice(CHEST_M, 0, 0.345, 0.008, 1.04), 10, SLOT.metal, R().mail); for (const s of [-1, 1]) ell(B, [0.185 * s, 0.29, 0], [0.074, 0.074, 0.07], 6, 3, SLOT.metal, R().mail); return B; },
    'mail.belly': () => { const B = builder(); lathe(B, [[-0.22, 0.228, 0.165], [-0.05, 0.2, 0.14], [0.08, 0.178, 0.12], [0.2, 0.164, 0.112]], 10, SLOT.metal, R().mail); return B; },
    'mail.arm': () => { const B = builder(); lathe(B, slice(ARM, -0.16, 0.03, 0.006, 1.1), 8, SLOT.metal, R().mail); return B; },
    plate: () => { const B = builder(); lathe(B, slice(CHEST_M, 0.0, 0.31, 0.012, 1.08), 10, SLOT.metal, R().iron); return B; },
    bracer: () => { const B = builder(); lathe(B, slice(FORE, -0.22, -0.02, 0.012), 8, SLOT.metal, R().iron); return B; },
    greave: () => { const B = builder(); lathe(B, slice(SHIN, -0.36, -0.03, 0.016), 8, SLOT.metal, R().iron, { keep: c => c[2] < 0.03 }); return B; },
    collar: () => { const B = builder(); lathe(B, [[0.3, 0.12, 0.09], [0.35, 0.09, 0.07], [0.4, 0.066, 0.058]], 10, SLOT.metal, R().mail); return B; }
  };

  function obox(B, a, b, side, hs, hn, slot, reg) {
    const d = norm([b[0] - a[0], b[1] - a[1], b[2] - a[2]]), s = norm(side), n = norm(cross(s, d));
    const P = (p, i, j) => [p[0] + s[0] * hs * i + n[0] * hn * j, p[1] + s[1] * hs * i + n[1] * hn * j, p[2] + s[2] * hs * i + n[2] * hn * j];
    const c = [[a, -1, -1], [a, 1, -1], [a, 1, 1], [a, -1, 1], [b, -1, -1], [b, 1, -1], [b, 1, 1], [b, -1, 1]].map(([p, i, j]) => P(p, i, j));
    const t = [cell(reg, 0, 1), cell(reg, 1, 1), cell(reg, 1, 0), cell(reg, 0, 0)];
    const neg = v => [-v[0], -v[1], -v[2]];
    for (const [q, nn] of [[[0, 1, 2, 3], neg(d)], [[4, 7, 6, 5], d], [[0, 4, 5, 1], neg(n)], [[1, 5, 6, 2], s], [[2, 6, 7, 3], n], [[3, 7, 4, 0], neg(s)]]) {
      B.tri(c[q[0]], c[q[1]], c[q[2]], nn, nn, nn, t[0], t[1], t[2], slot);
      B.tri(c[q[0]], c[q[2]], c[q[3]], nn, nn, nn, t[0], t[2], t[3], slot);
    }
  }

  const turnFrom = (B, start, fn) => {
    const a = B.a;
    for (let i = start; i < a.length; i += STRIDE) {
      const p = fn([a[i], a[i + 1], a[i + 2]]), q = fn([a[i + 3], a[i + 4], a[i + 5]]);
      a[i] = p[0]; a[i + 1] = p[1]; a[i + 2] = p[2];
      a[i + 3] = q[0]; a[i + 4] = q[1]; a[i + 5] = q[2];
    }
  };
  const X = [1, 0, 0];

  function cartBody(B, iron) {
    const rg = R();
    box(B, [0, 0.7, 0], [0.75, 0.05, 1.45], SLOT.wood, rg.wood);
    for (const s of [-1, 1]) box(B, [0.73 * s, 0.92, 0], [0.03, 0.2, 1.45], SLOT.wood, rg.wood);
    for (const z of [-1.43, 1.43]) box(B, [0, 0.9, z], [0.75, 0.18, 0.03], SLOT.wood, rg.wood);
    for (const z of [-0.8, 0.8]) box(B, [0, 0.55, z], [0.95, 0.05, 0.05], SLOT.wood, rg.wood);
    for (const s of [-1, 1]) obox(B, [0.35 * s, 0.62, -1.4], [0.42 * s, 0.55, -3.3], X, 0.04, 0.04, SLOT.wood, rg.wood);
    obox(B, [-0.45, 0.55, -3.2], [0.45, 0.55, -3.2], [0, 1, 0], 0.04, 0.05, SLOT.wood, rg.wood);
    if (iron) {
      for (const z of [-1, -0.33, 0.33, 1]) { box(B, [0, 1.13, z], [0.78, 0.03, 0.04], SLOT.metal, rg.iron); for (const s of [-1, 1]) box(B, [0.765 * s, 0.92, z], [0.02, 0.21, 0.04], SLOT.metal, rg.iron); }
      box(B, [0, 1.2, 0], [0.74, 0.04, 1.42], SLOT.wood, rg.wood);
    }
  }

  const WEAPON_MESH = {
    knife: B => {
      lathe(B, [[-0.11, 0.014, 0.017], [0, 0.015, 0.018]], 6, SLOT.wood, R().wood, { cap0: true });
      obox(B, [0, 0, -0.026], [0, 0, 0.026], X, 0.008, 0.008, SLOT.metal, R().iron);
      lathe(B, [[0, 0.004, 0.015, 0, -0.002], [0.17, 0.003, 0.01, 0, -0.004], [0.205, 0, 0, 0, -0.006]], 4, SLOT.metal, R().steel);
    },
    sickle: B => {
      lathe(B, [[-0.12, 0.015, 0.015], [0.03, 0.017, 0.017]], 6, SLOT.wood, R().wood, { cap0: true });
      const pts = [];
      for (let i = 0; i <= 8; i++) { const a = -0.6 + i / 8 * 3.1; pts.push([0, 0.18 + 0.15 * Math.sin(a), -0.1 + 0.15 * Math.cos(a)]); }
      pts.unshift([0, 0.02, 0]);
      for (let i = 0; i < pts.length - 1; i++) obox(B, pts[i], pts[i + 1], X, 0.004, i === 0 ? 0.012 : 0.016 - i * 0.0012, SLOT.metal, R().steel);
    },
    sword: B => {
      lathe(B, [[-0.13, 0.016, 0.016], [0, 0.018, 0.018]], 6, SLOT.leather, R().leather);
      ell(B, [0, -0.145, 0], [0.024, 0.02, 0.024], 6, 3, SLOT.metal, R().iron);
      obox(B, [0, 0.005, -0.09], [0, 0.005, 0.09], X, 0.012, 0.012, SLOT.metal, R().iron);
      lathe(B, [[0.012, 0.006, 0.026], [0.55, 0.005, 0.02], [0.66, 0, 0]], 4, SLOT.metal, R().steel);
    },
    arrow: B => {
      lathe(B, [[0, 0.0045, 0.0045], [0.72, 0.0045, 0.0045]], 4, SLOT.wood, R().wood, { cap0: true });
      obox(B, [0, 0.72, 0], [0, 0.8, 0], X, 0.012, 0.003, SLOT.metal, R().iron);
      for (const s of [-1, 1]) obox(B, [0.012 * s, 0.03, 0], [0.012 * s, 0.13, 0], [0, 0, 1], 0.001, 0.012, SLOT.cloth, R().linen);
    },
    bolt: B => {
      lathe(B, [[0, 0.007, 0.007], [0.34, 0.007, 0.007]], 4, SLOT.wood, R().wood, { cap0: true });
      obox(B, [0, 0.33, 0], [0, 0.4, 0], X, 0.012, 0.006, SLOT.metal, R().iron);
      for (const s of [-1, 1]) obox(B, [0.01 * s, 0.01, 0], [0.01 * s, 0.07, 0], [0, 0, 1], 0.001, 0.01, SLOT.leather, R().leather);
    },
    taxe: B => {
      lathe(B, [[-0.06, 0.013, 0.013], [0.36, 0.012, 0.012]], 6, SLOT.wood, R().wood, { cap0: true, cap1: true });
      obox(B, [0, 0.31, 0.02], [0, 0.31, -0.09], X, 0.009, 0.034, SLOT.metal, R().iron);
      obox(B, [0, 0.26, -0.095], [0, 0.37, -0.095], X, 0.006, 0.01, SLOT.metal, R().steel);
    },
    javelin: B => {
      lathe(B, [[0, 0.011, 0.011], [1.3, 0.01, 0.01]], 6, SLOT.wood, R().wood, { cap0: true });
      lathe(B, [[1.28, 0.014, 0.014], [1.33, 0.016, 0.016], [1.45, 0, 0]], 6, SLOT.metal, R().iron);
    },
    bow: B => {
      const pt = y => [0, y, 0.12 * (y / 0.66) * (y / 0.66)];
      for (let i = 0; i < 8; i++) {
        const y0 = -0.66 + i * 0.165, y1 = y0 + 0.165, w = 0.011 + 0.006 * (1 - Math.abs((y0 + y1) / 2) / 0.66);
        obox(B, pt(y0), pt(y1), X, w, 0.008, SLOT.wood, R().wood);
      }
      obox(B, pt(-0.66), pt(0.66), X, 0.0015, 0.0015, SLOT.cloth, R().linen);
      obox(B, [0, -0.06, 0], [0, 0.06, 0], X, 0.016, 0.014, SLOT.leather, R().leather);
    },
    crossbow: B => {
      obox(B, [0, -0.18, 0.01], [0, 0.55, 0.01], X, 0.022, 0.026, SLOT.wood, R().wood);
      for (const s of [-1, 1]) obox(B, [0, 0.5, 0], [0.3 * s, 0.46, 0.05], [0, 0, 1], 0.012, 0.012, SLOT.metal, R().iron);
      obox(B, [-0.3, 0.46, 0.05], [0.3, 0.46, 0.05], [0, 0, 1], 0.0015, 0.0015, SLOT.cloth, R().linen);
      obox(B, [0, 0.0, -0.03], [0, 0.0, -0.09], X, 0.006, 0.01, SLOT.metal, R().iron);
    },
    cart: B => cartBody(B, false),
    cartIron: B => cartBody(B, true),
    cartWheel: B => {
      const N = 12, r = 0.55;
      for (let i = 0; i < N; i++) {
        const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
        obox(B, [0, Math.sin(a0) * r, Math.cos(a0) * r], [0, Math.sin(a1) * r, Math.cos(a1) * r], X, 0.04, 0.045, SLOT.wood, R().wood);
      }
      for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI; obox(B, [0, Math.sin(a) * (r - 0.04), Math.cos(a) * (r - 0.04)], [0, -Math.sin(a) * (r - 0.04), -Math.cos(a) * (r - 0.04)], X, 0.022, 0.022, SLOT.wood, R().wood); }
      box(B, [0, 0, 0], [0.09, 0.08, 0.08], SLOT.metal, R().iron);
    },
    sack: B => { ell(B, [0, 0.2, 0], [0.32, 0.22, 0.42], 7, 4, SLOT.main, R().linen); box(B, [0, 0.3, 0.42], [0.08, 0.06, 0.05], SLOT.main, R().linen); },
    bolt: B => { obox(B, [-0.45, 0.17, 0], [0.45, 0.17, 0], [0, 1, 0], 0.17, 0.17, SLOT.cloth, R().wool); obox(B, [-0.47, 0.17, 0], [0.47, 0.17, 0], [0, 1, 0], 0.05, 0.05, SLOT.wood, R().wood); },
    cask: B => { lathe(B, [[0, 0.2, 0.2], [0.2, 0.25, 0.25], [0.4, 0.26, 0.26], [0.6, 0.25, 0.25], [0.8, 0.2, 0.2]], 8, SLOT.wood, R().wood, { cap0: true, cap1: true }); for (const y of [0.12, 0.68]) lathe(B, [[y - 0.02, 0.24, 0.24], [y + 0.02, 0.24, 0.24]], 8, SLOT.metal, R().iron); },
    crate: B => { box(B, [0, 0.22, 0], [0.32, 0.22, 0.26], SLOT.wood, R().wood); for (const x of [-0.2, 0.2]) box(B, [x, 0.22, 0.265], [0.03, 0.22, 0.01], SLOT.dark, R().wood); box(B, [0, 0.46, 0], [0.1, 0.02, 0.1], SLOT.accent, R().linen); },
    ore: B => { box(B, [0, 0.2, 0], [0.34, 0.2, 0.3], SLOT.wood, R().wood); for (let i = 0; i < 6; i++) ell(B, [(i % 3 - 1) * 0.18, 0.42 + (i % 2) * 0.04, (Math.floor(i / 3) - 0.5) * 0.25], [0.12, 0.08, 0.11], 5, 3, SLOT.dark, R().iron); },
    ingots: B => { for (let i = 0; i < 9; i++) box(B, [((i % 3) - 1) * 0.15, 0.05 + Math.floor(i / 3) * 0.1, 0], [0.065, 0.045, 0.4], SLOT.metal, R().iron); obox(B, [-0.24, 0.16, 0.2], [0.24, 0.16, 0.2], [0, 1, 0], 0.02, 0.16, SLOT.leather, R().leather); },
    silverChest: B => { box(B, [0, 0.25, 0], [0.4, 0.25, 0.28], SLOT.wood, R().wood); box(B, [0, 0.53, 0], [0.42, 0.04, 0.3], SLOT.metal, R().iron); for (const x of [-0.25, 0.25]) box(B, [x, 0.27, 0], [0.04, 0.27, 0.3], SLOT.metal, R().iron); box(B, [0, 0.35, -0.29], [0.06, 0.07, 0.02], SLOT.accent, R().iron); },
    trunk: B => {
      lathe(B, [[0, 1.3, 1.3], [0.08, 1.05, 1.05], [0.5, 0.8, 0.8], [0.85, 0.5, 0.5], [1, 0.15, 0.15]], 8, SLOT.wood, R().wood, { cap0: true, cap1: true });
      lathe(B, [[0.09, 1.06, 1.06], [0.13, 1.06, 1.06]], 8, SLOT.accent, R().linen);
      obox(B, [0.75, 0.04, 0], [1.0, 0.04, 0], [0, 1, 0], 0.5, 0.25, SLOT.dark, R().wood);
      for (const [y, a] of [[0.45, 0.6], [0.6, 2.4], [0.72, 4.1], [0.82, 5.3]]) obox(B, [0, y, 0], [Math.cos(a) * 2.6, y + 0.08, Math.sin(a) * 2.6], [0, 1, 0], 0.25, 0.25, SLOT.wood, R().wood);
    },
    bells: B => { obox(B, [-0.22, 0, 0], [0.22, 0, 0], [0, 1, 0], 0.015, 0.015, SLOT.leather, R().leather); for (const x of [-0.15, 0, 0.15]) lathe(B, [[-0.06, 0.035, 0.035], [-0.02, 0.03, 0.03], [0, 0.012, 0.012]], 6, SLOT.accent, R().iron, { cap0: true }); },
    pit: B => {
      box(B, [0, 0.005, 0], [0.55, 0.005, 0.55], SLOT.dark, R().wood);
      for (const [x, z, a] of [[-0.6, 0, 0], [0.6, 0, 0], [0, -0.6, 1.57], [0, 0.6, 1.57]]) obox(B, [x - Math.sin(a) * 0.55, 0.03, z - Math.cos(a) * 0.55], [x + Math.sin(a) * 0.55, 0.05, z + Math.cos(a) * 0.55], [0, 1, 0], 0.03, 0.025, SLOT.wood, R().wood);
      for (let i = 0; i < 7; i++) { const x = ((i * 0.37) % 1 - 0.5) * 0.8, z = ((i * 0.61) % 1 - 0.5) * 0.8; obox(B, [x, -0.05, z], [x * 0.9, 0.16, z * 0.9], X, 0.012, 0.012, SLOT.wood, R().wood); }
      for (let i = 0; i < 9; i++) { const a = i * 0.7, r = 0.2 + (i % 3) * 0.12; obox(B, [Math.cos(a) * r, 0.02, Math.sin(a) * r], [Math.cos(a + 1.2) * (r + 0.15), 0.03, Math.sin(a + 1.2) * (r + 0.15)], [0, 1, 0], 0.012, 0.008, SLOT.main, R().wood); }
    },
    snare: B => {
      for (let i = 0; i < 10; i++) { const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2; obox(B, [Math.cos(a0) * 0.22, 0.03, Math.sin(a0) * 0.22], [Math.cos(a1) * 0.22, 0.03, Math.sin(a1) * 0.22], [0, 1, 0], 0.006, 0.006, SLOT.cloth, R().linen); }
      obox(B, [0.22, 0.03, 0], [0.62, 0.36, 0], [0, 0, 1], 0.006, 0.006, SLOT.cloth, R().linen);
      obox(B, [0.62, -0.1, 0], [0.62, 0.42, 0], X, 0.02, 0.02, SLOT.wood, R().wood);
    },
    ladders: B => {
      for (let k = 0; k < 2; k++) {
        const y = 0.08 + k * 0.1, z = (k - 0.5) * 0.2;
        for (const s of [-0.28, 0.28]) obox(B, [-2.6, y, z + s], [2.6, y, z + s], [0, 1, 0], 0.045, 0.045, SLOT.wood, R().wood);
        for (let i = 0; i < 7; i++) { const x = -2.4 + i * 0.8; obox(B, [x, y, z - 0.28], [x, y, z + 0.28], [0, 1, 0], 0.02, 0.02, SLOT.wood, R().wood); }
      }
    },
    siegeLadder: B => {
      for (const s of [-0.32, 0.32]) obox(B, [0, 0, s], [0, 10.6, s], X, 0.06, 0.05, SLOT.wood, R().wood);
      for (let i = 0; i < 26; i++) { const y = 0.3 + i * 0.4; obox(B, [0, y, -0.32], [0, y, 0.32], [0, 1, 0], 0.025, 0.025, SLOT.wood, R().wood); }
      for (const s of [-0.32, 0.32]) obox(B, [0, 10.6, s], [0.3, 10.75, s], X, 0.04, 0.04, SLOT.metal, R().iron);
    },
    gateDoor: B => {
      for (let i = 0; i < 8; i++) { const z = -2.75 + i * 0.786; box(B, [0, 3, z], [0.14, 3, 0.38], SLOT.wood, R().wood); }
      for (const y of [0.9, 3, 5.1]) box(B, [-0.2, y, 0], [0.06, 0.16, 3.05], SLOT.metal, R().iron);
      for (const z of [-2.2, 2.2]) obox(B, [-0.22, 0.9, z], [-0.22, 5.1, z * 0.1], X, 0.05, 0.12, SLOT.wood, R().wood);
      for (let i = 0; i < 12; i++) box(B, [-0.27, 0.9 + (i % 3) * 2.1, -2.6 + Math.floor(i / 3) * 1.73], [0.04, 0.05, 0.05], SLOT.metal, R().iron);
    },
    ram: B => {
      obox(B, [-2.4, 0.9, 0], [2.5, 0.9, 0], [0, 1, 0], 0.26, 0.26, SLOT.wood, R().wood);
      for (const x of [-1.6, 0, 1.6]) for (const s of [-1, 1]) obox(B, [x, 0, s * 0.8], [x, 1.6, 0], X, 0.06, 0.06, SLOT.wood, R().wood);
      obox(B, [-2, 1.62, 0], [2, 1.62, 0], [0, 1, 0], 0.08, 0.08, SLOT.wood, R().wood);
      box(B, [2.6, 0.9, 0], [0.12, 0.3, 0.3], SLOT.metal, R().iron);
    },
    herb: B => { for (let i = 0; i < 6; i++) { const a = i * 1.05; ell(B, [Math.cos(a) * 0.14, 0.12 + (i % 2) * 0.06, Math.sin(a) * 0.14], [0.12, 0.1, 0.12], 5, 3, SLOT.main, R().wood); } for (let i = 0; i < 5; i++) { const a = i * 1.3; ell(B, [Math.cos(a) * 0.1, 0.24, Math.sin(a) * 0.1], [0.03, 0.03, 0.03], 4, 2, SLOT.accent, R().linen); } },
    cacheStone: B => { ell(B, [0, 0.3, 0], [0.55, 0.38, 0.45], 7, 4, SLOT.dark, R().iron); box(B, [0.3, 0.42, 0.36], [0.12, 0.05, 0.02], SLOT.accent, R().linen); box(B, [0.33, 0.33, 0.37], [0.03, 0.1, 0.02], SLOT.accent, R().linen); },
    bucket: B => { lathe(B, [[0, 0.11, 0.11], [0.26, 0.14, 0.14]], 8, SLOT.wood, R().wood, { cap0: true }); for (const y of [0.05, 0.21]) lathe(B, [[y - 0.012, 0.145, 0.145], [y + 0.012, 0.145, 0.145]], 8, SLOT.metal, R().iron); obox(B, [-0.14, 0.26, 0], [0.14, 0.26, 0], [0, 1, 0], 0.006, 0.006, SLOT.metal, R().iron); },
    chair: B => {
      box(B, [0, 0.5, 0], [0.22, 0.025, 0.22], SLOT.wood, R().wood);
      box(B, [0, 0.74, 0.22], [0.22, 0.22, 0.02], SLOT.wood, R().wood);
      for (const s of [-1, 1]) {
        for (let i = 0; i < 10; i++) {
          const a0 = i / 10 * Math.PI * 2, a1 = (i + 1) / 10 * Math.PI * 2, r = 0.3;
          obox(B, [0.27 * s, 0.32 + Math.sin(a0) * r, 0.06 + Math.cos(a0) * r], [0.27 * s, 0.32 + Math.sin(a1) * r, 0.06 + Math.cos(a1) * r], X, 0.018, 0.02, SLOT.wood, R().wood);
        }
        obox(B, [0.27 * s, 0.32, -0.24], [0.27 * s, 0.32, 0.36], X, 0.012, 0.012, SLOT.metal, R().iron);
        obox(B, [0.27 * s, 0.02, 0.06], [0.27 * s, 0.62, 0.06], X, 0.012, 0.012, SLOT.metal, R().iron);
        obox(B, [0.24 * s, 0.45, -0.3], [0.24 * s, 0.05, -0.33], X, 0.014, 0.014, SLOT.wood, R().wood);
        obox(B, [0.22 * s, 0.6, 0.24], [0.22 * s, 1.0, 0.3], X, 0.014, 0.014, SLOT.wood, R().wood);
        obox(B, [0.22 * s, 1.0, 0.3], [0.22 * s, 1.0, 0.42], X, 0.016, 0.016, SLOT.leather, R().leather);
      }
      box(B, [0, 0.12, -0.34], [0.16, 0.015, 0.06], SLOT.wood, R().wood);
    },
    torch: B => {
      lathe(B, [[-0.1, 0.017, 0.017], [0.48, 0.02, 0.02]], 6, SLOT.wood, R().wood, { cap0: true });
      lathe(B, [[0.44, 0.035, 0.035], [0.5, 0.045, 0.045], [0.58, 0.04, 0.04], [0.6, 0, 0]], 6, SLOT.dark, R().linen, { cap0: true });
      lathe(B, [[0.58, 0.04, 0.04], [0.7, 0.03, 0.03], [0.82, 0, 0]], 5, SLOT.bandage, R().skin);
    },
    crutch: B => {
      lathe(B, [[0, 0.016, 0.016], [1.18, 0.019, 0.019]], 6, SLOT.wood, R().wood, { cap0: true, cap1: true });
      obox(B, [-0.08, 1.2, 0], [0.08, 1.2, 0], [0, 1, 0], 0.025, 0.03, SLOT.leather, R().leather);
      obox(B, [0, 0.78, 0], [0, 0.78, -0.11], [1, 0, 0], 0.015, 0.015, SLOT.wood, R().wood);
    },
    axe: B => {
      lathe(B, [[-0.12, 0.017, 0.017], [0.63, 0.016, 0.016]], 6, SLOT.wood, R().wood, { cap0: true, cap1: true });
      obox(B, [0, 0.55, 0.035], [0, 0.55, -0.12], X, 0.011, 0.045, SLOT.metal, R().iron);
      obox(B, [0, 0.48, -0.13], [0, 0.63, -0.13], X, 0.007, 0.012, SLOT.metal, R().steel);
    },
    mace: B => {
      lathe(B, [[-0.12, 0.017, 0.017], [0.44, 0.016, 0.016]], 6, SLOT.wood, R().wood, { cap0: true });
      ell(B, [0, 0.49, 0], [0.05, 0.055, 0.05], 6, 4, SLOT.metal, R().iron);
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2, o = [Math.cos(a), 0, Math.sin(a)];
        obox(B, [o[0] * 0.03, 0.45, o[2] * 0.03], [o[0] * 0.03, 0.55, o[2] * 0.03], [-o[2], 0, o[0]], 0.006, 0.038, SLOT.metal, R().iron);
      }
    },
    spear: B => {
      lathe(B, [[-0.6, 0.017, 0.017], [1.58, 0.016, 0.016]], 6, SLOT.wood, R().wood, { cap0: true });
      lathe(B, [[1.55, 0.021, 0.021], [1.63, 0.016, 0.016]], 6, SLOT.metal, R().iron);
      lathe(B, [[1.63, 0.006, 0.03], [1.75, 0.005, 0.024], [1.86, 0, 0]], 4, SLOT.metal, R().steel);
    },
    bardiche: B => {
      lathe(B, [[-0.25, 0.02, 0.02], [1.4, 0.019, 0.019]], 6, SLOT.wood, R().wood, { cap0: true, cap1: true });
      obox(B, [0, 0.8, -0.075], [0, 1.4, -0.11], X, 0.007, 0.065, SLOT.metal, R().steel);
      for (const y of [0.88, 1.12]) obox(B, [0, y, 0], [0, y, -0.03], X, 0.012, 0.016, SLOT.metal, R().iron);
    },
    shield: B => {
      const start = B.a.length;
      lathe(B, [[-0.016, 0.3, 0.3], [0.0, 0.3, 0.3], [0.02, 0.22, 0.22], [0.03, 0, 0]], 12, SLOT.accent, R().felt);
      lathe(B, [[-0.016, 0, 0], [-0.016, 0.3, 0.3]], 12, SLOT.wood, R().wood);
      lathe(B, [[-0.018, 0.307, 0.307], [0.004, 0.307, 0.307]], 12, SLOT.metal, R().iron);
      ell(B, [0, 0.032, 0], [0.06, 0.03, 0.06], 8, 3, SLOT.metal, R().iron);
      turnFrom(B, start, p => [p[0], p[2], -p[1]]);
    }
  };

  const STRAW = {
    'straw.head': B => {
      ell(B, [0, 0.19, 0], [0.09, 0.105, 0.095], 8, 5, SLOT.main, R().linen);
      lathe(B, [[0.075, 0.048, 0.048], [0.1, 0.056, 0.056]], 8, SLOT.accent, R().felt);
    },
    'straw.chest': B => {
      lathe(B, [[0, 0.12, 0.09], [0.1, 0.14, 0.1], [0.28, 0.15, 0.1], [0.33, 0.1, 0.07], [0.37, 0.05, 0.05]], 9, SLOT.skin, R().straw);
      lathe(B, [[0.1, 0.146, 0.106], [0.22, 0.153, 0.107]], 9, SLOT.main, R().linen);
      obox(B, [-0.22, 0.3, 0], [0.22, 0.3, 0], [0, 0, 1], 0.018, 0.018, SLOT.wood, R().wood);
    },
    'straw.belly': B => {
      lathe(B, [[-0.1, 0.1, 0.08], [0.2, 0.12, 0.09]], 9, SLOT.skin, R().straw, { cap0: true });
      lathe(B, [[0.04, 0.122, 0.092], [0.08, 0.124, 0.094]], 9, SLOT.accent, R().felt);
      box(B, [0, -0.42, 0], [0.04, 0.5, 0.04], SLOT.wood, R().wood);
    },
    'straw.arm': B => {
      lathe(B, [[0.03, 0.05, 0.05], [-0.3, 0.045, 0.045]], 7, SLOT.skin, R().straw, { cap0: true, cap1: true });
      lathe(B, [[-0.27, 0.048, 0.048], [-0.24, 0.048, 0.048]], 7, SLOT.accent, R().felt);
    },
    'straw.fore': B => {
      lathe(B, [[-0.37, 0.028, 0.028], [-0.3, 0.04, 0.04], [0, 0.045, 0.045]], 7, SLOT.skin, R().straw, { cap0: true, cap1: true });
      lathe(B, [[-0.31, 0.043, 0.043], [-0.28, 0.043, 0.043]], 7, SLOT.accent, R().felt);
    }
  };

  const STUMP_OF = Object.freeze({ fresh: 'stump', bandaged: 'stump.bandage', healed: 'stump.healed' });
  const discUv = reg => p => cell(reg, K.clamp(0.5 + p[0] * 0.5, 0, 1), K.clamp(0.5 + p[2] * 0.5, 0, 1));
  const STUMPS = {
    stump: B => lathe(B, [[0, 1, 1], [0.08, 0.75, 0.75], [0.14, 0, 0]], 9, SLOT.dark, R().flesh, { uvOf: discUv(R().flesh) }),
    'stump.healed': B => lathe(B, [[0, 1, 1], [0.25, 0.7, 0.7], [0.4, 0, 0]], 9, SLOT.skin, R().skin),
    'stump.bandage': B => lathe(B, [[-0.25, 1.06, 1.06], [0.05, 1.08, 1.08], [0.3, 0.8, 0.8], [0.42, 0.2, 0.2]], 9, SLOT.bandage, R().linen, { cap1: true })
  };

  const tubeZ = (B, rings, sides, slot, reg, o) => { const s0 = B.a.length; lathe(B, rings.map(r => [r[0], r[1], r[2], r[3] || 0, -(r[4] || 0)]), sides, slot, reg, o); turnFrom(B, s0, p => [p[0], -p[2], p[1]]); };
  const tubeNZ = (B, rings, sides, slot, reg, o) => { const s0 = B.a.length; lathe(B, rings.map(r => [r[0], r[1], r[2], r[3] || 0, r[4] || 0]), sides, slot, reg, o); turnFrom(B, s0, p => [p[0], p[2], -p[1]]); };
  const furOf = s => ({ fur: 'fur', spots: 'spots', patches: 'patches', feather: 'feather', skin: 'skin' }[s.look.tex] || 'fur');

  function beastPart(kind, part, sex) {
    const s = K.Beasts.SPECIES[kind], D = s.body, B = builder(), rg = R(), fur = rg[furOf(s)], belly = s.look.tex === 'patches' ? rg.patches : rg.fur, h = D.head;
    const coat = (lo, back) => c => c[2] > D.ry * lo ? SLOT.main : back !== undefined && c[2] < -D.ry * back ? SLOT.hair : SLOT.skin;
    if (part === 'chest') {
      const hump = kind === 'bear' ? 1.12 : kind === 'ox' ? 1.06 : 1;
      tubeZ(B, [[-D.ry * 0.62, D.rx * 0.45, D.ry * 0.5, 0, -D.ry * 0.05], [-D.ry * 0.35, D.rx * 0.86, D.ry * 0.86], [0, D.rx * 0.98, D.ry * hump, 0, D.ry * (hump - 1)], [D.L * 0.3, D.rx, D.ry * 0.97], [D.L * 0.52, D.rx * 0.97, D.ry * 0.94]], 9, SLOT.skin, fur, { slotOf: coat(0.5, kind === 'boar' || kind === 'wolf' ? 0.8 : undefined), cap0: true });
      if (s.mane) box(B, [0, D.ry * 0.95, -D.ry * 0.1], [0.02, 0.05, D.ry * 0.5], SLOT.hair, rg.hair);
    } else if (part === 'croup') {
      tubeZ(B, [[-D.L * 0.5, D.rx * 0.97, D.ry * 0.94], [-D.L * 0.15, D.rx * 0.97, D.ry * 0.93], [0, D.rx * 0.92, D.ry * 0.88], [D.ry * 0.35, D.rx * 0.72, D.ry * 0.72, 0, 0.02], [D.ry * 0.6, D.rx * 0.28, D.ry * 0.32, 0, 0.03], [D.ry * 0.66, 0.001, 0.001, 0, 0.03]], 9, SLOT.skin, fur, { slotOf: coat(0.5, kind === 'boar' || kind === 'wolf' ? 0.8 : undefined) });
      if (kind === 'deer' || kind === 'goat') ell(B, [0, 0.02, D.ry * 0.5], [D.rx * 0.5, D.ry * 0.45, 0.04], 6, 3, SLOT.main, rg.fur);
      if (kind === 'cow') ell(B, [0, -D.ry * 0.8, -D.L * 0.15], [0.09, 0.07, 0.11], 6, 3, SLOT.accent, rg.skin);
    } else if (part === 'neck') {
      lathe(B, [[-0.03, D.rx * 0.62, D.ry * 0.56], [D.neck * 0.5, D.rx * 0.5, D.ry * 0.46], [D.neck + 0.02, D.rx * 0.42, D.ry * 0.4]], 8, SLOT.skin, fur, { slotOf: c => c[2] < -D.ry * 0.3 ? SLOT.main : SLOT.skin });
      if (s.mane) box(B, [0, D.neck * 0.5, D.ry * 0.42], [0.025, D.neck * 0.55, 0.06], SLOT.hair, rg.hair);
      if (kind === 'chicken') box(B, [0, D.neck * 0.5, -0.02], [0.04, D.neck * 0.5, 0.05], SLOT.skin, fur);
    } else if (part === 'head') {
      const wide = kind === 'bear' ? 1.25 : kind === 'boar' || kind === 'pig' ? 1.1 : 1;
      ell(B, [0, h * 0.14, 0.02], [h * 0.3 * wide, h * 0.3, h * 0.32], 8, 4, SLOT.skin, fur);
      const snout = { wolf: [0.24, 0.13, 0.1], dog: [0.24, 0.14, 0.11], fox: [0.2, 0.09, 0.07], hare: [0.2, 0.16, 0.14], bear: [0.24, 0.17, 0.14], boar: [0.22, 0.16, 0.15], pig: [0.22, 0.16, 0.15], deer: [0.2, 0.12, 0.09], goat: [0.2, 0.12, 0.09], cow: [0.25, 0.17, 0.16], horse: [0.22, 0.12, 0.11], ox: [0.25, 0.18, 0.17] }[kind];
      if (snout) {
        tubeNZ(B, [[0, h * snout[0], h * snout[0], 0, h * 0.06], [h * 0.55, h * snout[1] * 1.3, h * snout[1] * 1.2, 0, 0.0], [h, h * snout[2], h * snout[2], 0, -h * 0.03]], 8, SLOT.skin, fur, { cap1: true, slotOf: c => c[2] < -h * 0.04 && c[1] > h * 0.4 ? SLOT.main : SLOT.skin });
        box(B, [0, -h * 0.02, -h * 1.0], [h * snout[2] * 0.8, h * snout[2] * 0.6, 0.012], SLOT.accent, rg.skin);
      } else if (s.beak) {
        wedge(B, [[-h * 0.15, h * 0.05, -h * 0.25], [h * 0.15, h * 0.05, -h * 0.25], [h * 0.15, h * 0.22, -h * 0.25], [-h * 0.15, h * 0.22, -h * 0.25]], [0, h * 0.08, -h * (kind === 'eagle' ? 0.85 : 0.75)], SLOT.accent, rg.skin);
      }
      for (const sx of [-1, 1]) {
        box(B, [sx * h * 0.24 * wide, h * 0.22, -h * 0.18], [h * 0.035, h * 0.035, h * 0.03], SLOT.dark, rg.slit);
        if (s.ears === 'pointy') wedge(B, [[sx * h * 0.12, h * 0.38, 0], [sx * h * 0.24, h * 0.36, 0], [sx * h * 0.24, h * 0.36, 0.05], [sx * h * 0.12, h * 0.38, 0.05]], [sx * h * 0.22, h * (kind === 'fox' ? 0.78 : 0.68), 0.04], SLOT.skin, fur);
        else if (s.ears === 'round') ell(B, [sx * h * 0.26, h * 0.4, 0.03], [h * 0.08, h * 0.08, h * 0.04], 6, 3, SLOT.skin, fur);
        else if (s.ears === 'long') lathe(B, [[h * 0.3, h * 0.07, h * 0.03, sx * h * 0.12, 0.03], [h * 1.1, h * 0.06, h * 0.025, sx * h * 0.16, 0.06], [h * 1.3, 0, 0, sx * h * 0.17, 0.07]], 6, SLOT.skin, fur, { cap0: true });
        else if (s.ears === 'drop') wedge(B, [[sx * h * 0.2, h * 0.36, -0.01], [sx * h * 0.3, h * 0.33, -0.01], [sx * h * 0.3, h * 0.33, 0.04], [sx * h * 0.2, h * 0.36, 0.04]], [sx * h * 0.36, h * 0.05, 0.01], SLOT.hair, fur);
        else if (s.ears === 'side') box(B, [sx * h * 0.38, h * 0.3, 0.02], [h * 0.12, h * 0.04, h * 0.06], SLOT.skin, fur);
        if (s.horns === 'goat') { const p0 = [sx * h * 0.12, h * 0.42, -0.02]; let q = p0; for (let k = 1; k <= 4; k++) { const n = [sx * h * (0.12 + k * 0.04), h * (0.42 + k * 0.12 - k * k * 0.012), 0.02 + k * h * 0.12]; obox(B, q, n, X, 0.014 - k * 0.002, 0.014 - k * 0.002, SLOT.metal, rg.wood); q = n; } }
        if (s.horns === 'cow' || s.horns === 'ox') { const L2 = s.horns === 'ox' ? 0.45 : 0.25; obox(B, [sx * h * 0.24, h * 0.36, 0.02], [sx * h * (0.24 + L2), h * (0.42 + L2 * 0.4), -h * 0.06], [0, 0, 1], 0.018, 0.018, SLOT.metal, rg.wood); }
        if (s.antlers && sex !== 'f') {
          const base = [sx * h * 0.14, h * 0.4, 0.0], top = [sx * h * 0.5, h * 1.7, h * 0.4];
          obox(B, base, top, [0, 0, 1], 0.014, 0.014, SLOT.metal, rg.wood);
          for (const k of [0.35, 0.6, 0.85]) { const m = [base[0] + (top[0] - base[0]) * k, base[1] + (top[1] - base[1]) * k, base[2] + (top[2] - base[2]) * k]; obox(B, m, [m[0] + sx * 0.02, m[1] + h * 0.35, m[2] - h * 0.3], [0, 0, 1], 0.01, 0.01, SLOT.metal, rg.wood); }
        }
        if (s.tusks && sex !== 'f') obox(B, [sx * h * 0.12, -h * 0.03, -h * 0.75], [sx * h * 0.2, h * 0.14, -h * 0.85], X, 0.01, 0.01, SLOT.metal, rg.smooth);
      }
      if (s.comb) box(B, [0, h * 0.5, -h * 0.05], [0.008, h * 0.18, h * 0.2], SLOT.hair, rg.skin);
    } else if (part === 'tail') {
      if (s.brush || kind === 'wolf' || kind === 'dog') lathe(B, [[-0.01, 0.025, 0.025], [D.tail * 0.4, s.brush ? 0.06 : 0.04, s.brush ? 0.06 : 0.04], [D.tail * 0.85, s.brush ? 0.05 : 0.035, s.brush ? 0.05 : 0.035], [D.tail, 0, 0]], 6, kind === 'fox' ? SLOT.skin : SLOT.skin, fur, { cap0: true, slotOf: c => kind === 'fox' && c[1] > D.tail * 0.85 ? SLOT.main : SLOT.skin });
      else if (kind === 'horse') lathe(B, [[0, 0.04, 0.04], [D.tail * 0.3, 0.06, 0.05], [D.tail, 0.05, 0.03], [D.tail * 1.05, 0, 0]], 6, SLOT.hair, rg.hair, { cap0: true });
      else if (kind === 'cow' || kind === 'ox') { lathe(B, [[0, 0.02, 0.02], [D.tail * 0.85, 0.012, 0.012]], 5, SLOT.skin, fur, { cap0: true }); ell(B, [0, D.tail * 0.92, 0], [0.035, 0.08, 0.035], 5, 3, SLOT.hair, rg.hair); }
      else if (s.bird) box(B, [0, D.tail * 0.5, 0], [D.rx * 0.6, D.tail * 0.5, 0.012], SLOT.hair, fur);
      else ell(B, [0, D.tail * 0.5, 0], [Math.max(0.025, D.tail * 0.45), Math.max(0.03, D.tail * 0.6), Math.max(0.025, D.tail * 0.4)], 6, 3, kind === 'deer' || kind === 'hare' ? SLOT.main : SLOT.skin, fur);
    } else {
      const front = part[1] === 'f', up = part.endsWith('Up'), u = front ? D.fu : D.hu, l = front ? D.fl : D.hl, r = D.leg, bird = s.bird;
      if (bird && front) {
        const span = up ? D.fu : D.fl, chord = up ? D.L * 0.75 : D.L * 0.6;
        obox(B, [0, 0, 0], [0, -span, chord * 0.2], [0, 0, 1], chord * 0.5, 0.012, SLOT.skin, fur);
        if (!up) obox(B, [0, -span * 0.4, 0], [0, -span, chord * 0.4], [0, 0, 1], chord * 0.35, 0.01, SLOT.hair, fur);
      } else if (up) {
        const thick = kind === 'bear' ? 1.5 : 1.3;
        lathe(B, [[0.03, r * thick, r * thick * 1.15], [-u * 0.5, r * 1.1, r * 1.25], [-u - 0.01, r * 0.85, r * 0.9]], 7, bird ? SLOT.accent : SLOT.skin, bird ? rg.skin : fur, { cap0: true });
      } else {
        lathe(B, [[0.01, r * 0.85, r * 0.9], [-l * 0.8, r * 0.7, r * 0.75], [-l + (s.hooves ? 0.06 : 0.03), r * 0.68, r * 0.72]], 7, bird ? SLOT.accent : SLOT.skin, bird ? rg.skin : fur, { slotOf: c => !bird && c[1] < -l * 0.5 && (kind === 'fox' || kind === 'deer' || kind === 'horse') ? SLOT.hair : bird ? SLOT.accent : SLOT.skin });
        if (s.hooves) box(B, [0, -l + 0.03, -r * 0.1], [r * 0.85, 0.03, r * 0.95], SLOT.accent, rg.smooth);
        else if (bird) for (const a of [-0.5, 0, 0.5]) obox(B, [0, -l, 0], [Math.sin(a) * 0.05, -l, -Math.cos(a) * 0.05], [0, 1, 0], 0.006, 0.004, SLOT.accent, rg.skin);
        else box(B, [0, -l + 0.02, -r * 0.6], [r * 1.0, 0.025, r * 1.5], SLOT.skin, fur);
      }
    }
    return B;
  }

  const BEAST_PARTS = ['head', 'neck', 'chest', 'croup', 'tail', 'lfUp', 'lfLo', 'rfUp', 'rfLo', 'lhUp', 'lhLo', 'rhUp', 'rhLo'];

  function beastLook(kit) {
    const s = K.Beasts.SPECIES[kit.beast], cut = kit.cut || {}, out = [], key = p => 'b.' + kit.beast + '.' + p + (p === 'head' && s.antlers && kit.fig === 'f' ? '.f' : '');
    BEAST_PARTS.forEach((p, i) => {
      if (p === 'head' && cut.head) return;
      if (i >= 5) {
        const leg = p.slice(0, 2), front = leg[1] === 'f', up = p.endsWith('Up');
        if (!s.bird || !front) {
          if (cut[leg] === 'up') { if (up) out.push(['stump', i, capAt([0, 0, 0], [0, -1, 0], s.body.leg * 1.3)]); return; }
          if (cut[leg] === 'lo' && !up) { out.push(['stump', i - 1, capAt([0, -(front ? s.body.fu : s.body.hu), 0], [0, -1, 0], s.body.leg * 1.1)]); return; }
        }
      }
      out.push([key(p), i]);
    });
    if (cut.head) out.push(['stump', 1, capAt([0, s.body.neck, 0], [0, 1, 0], s.body.rx * 0.5)]);
    return out;
  }

  const OUTFITS = ['elf.m', 'elf.f', 'guard.m', 'guard.f', 'villain.m', 'town.m', 'town.f'];
  const LIMBS = ['elf', 'guard', 'villain', 'town.m', 'town.f'];

  function recipes() {
    const list = [];
    for (const race of ['human', 'elf']) for (const fig of ['m', 'f']) list.push(['head.' + race + '.' + fig, () => head(race, fig)]);
    for (const h of Object.keys(HAIR)) list.push(['hair.' + h, () => { const B = builder(); HAIR[h](B); return B; }]);
    list.push(['beard', beard]);
    for (const h of Object.keys(HATS)) list.push(['hat.' + h, () => { const B = builder(); HATS[h](B); return B; }]);
    for (const o of OUTFITS) {
      const [side, fig] = o.split('.');
      list.push(['chest.' + o, () => chest(side, fig)], ['belly.' + o, () => belly(side, fig)]);
    }
    for (const l of LIMBS) list.push(['arm.' + l, () => arm(l)], ['fore.' + l, () => fore(l)], ['fore.' + l + '.fist', () => fore(l, true)], ['thigh.' + l, () => thigh(l)], ['shin.' + l, () => shin(l)]);
    list.push(['fore.iron', ironFore], ['fore.hook', hookFore], ['fore.carved', carvedFore], ['fore.hinge', hingeFore], ['shin.iron', ironShin], ['shin.peg', peg], ['shin.willow', willowShin], ['shin.hinge', hingeShin]);
    for (const a of Object.keys(ARMOR)) list.push([a, ARMOR[a]]);
    for (const w of Object.keys(WEAPON_MESH)) list.push(['w.' + w, () => { const B = builder(); WEAPON_MESH[w](B); return B; }]);
    for (const s of Object.keys(STRAW)) list.push([s, () => { const B = builder(); STRAW[s](B); return B; }]);
    for (const s of Object.keys(STUMPS)) list.push([s, () => { const B = builder(); STUMPS[s](B); return B; }]);
    if (K.Beasts) for (const kind of Object.keys(K.Beasts.SPECIES)) {
      for (const part of BEAST_PARTS) list.push(['b.' + kind + '.' + part, () => beastPart(kind, part, 'm')]);
      if (K.Beasts.SPECIES[kind].antlers) list.push(['b.' + kind + '.head.f', () => beastPart(kind, 'head', 'f')]);
    }
    return list;
  }

  let LIB = null;
  function library() {
    if (LIB) return LIB;
    const meshes = {}, chunks = [];
    let base = 0;
    for (const [key, make] of recipes()) {
      const B = make(), count = B.a.length / STRIDE, cls = CLASSES.find(c => c >= count);
      if (!cls) throw new Error('mesh too large: ' + key + ' ' + count);
      meshes[key] = { base, count, cls, tris: count / 3 };
      chunks.push(B.a);
      base += count;
    }
    const data = new Float32Array(base * STRIDE);
    let o = 0;
    for (const c of chunks) { data.set(c, o); o += c.length; }
    LIB = { meshes, data, verts: base, stride: STRIDE };
    return LIB;
  }

  const outfit = kit => kit.side + '.' + kit.fig;
  const limbSet = kit => kit.side === 'town' ? 'town.' + kit.fig : kit.side;

  const capAt = (o, dir, s) => {
    const y = norm(dir), x = Math.abs(y[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], z = norm(cross(x, y)), xx = cross(y, z);
    return [xx[0] * s, xx[1] * s, xx[2] * s, y[0] * s, y[1] * s, y[2] * s, z[0] * s, z[1] * s, z[2] * s, o[0], o[1], o[2]];
  };
  const PARENT_CAP = {
    head: [1, [0, 0.36, 0], [0, 1, 0], 0.05], lArm: [1, [-0.185, 0.3, 0], [-1, 0, 0], 0.055], rArm: [1, [0.185, 0.3, 0], [1, 0, 0], 0.055],
    lFore: [3, [0, -0.3, 0], [0, -1, 0], 0.045], rFore: [4, [0, -0.3, 0], [0, -1, 0], 0.045],
    lThigh: [2, [-0.095, -0.03, 0], [0, -1, 0], 0.08], rThigh: [2, [0.095, -0.03, 0], [0, -1, 0], 0.08],
    lShin: [7, [0, -0.42, 0], [0, -1, 0], 0.058], rShin: [8, [0, -0.42, 0], [0, -1, 0], 0.058]
  };
  const ROOT_CAP = {
    head: [[0, -0.02, 0], [0, -1, 0], 0.048], lArm: [[0, 0.03, 0], [0, 1, 0], 0.055], rArm: [[0, 0.03, 0], [0, 1, 0], 0.055],
    lFore: [[0, 0, 0], [0, 1, 0], 0.045], rFore: [[0, 0, 0], [0, 1, 0], 0.045], lThigh: [[0, 0.03, 0], [0, 1, 0], 0.08], rThigh: [[0, 0.03, 0], [0, 1, 0], 0.08],
    lShin: [[0, 0, 0], [0, 1, 0], 0.058], rShin: [[0, 0, 0], [0, 1, 0], 0.058]
  };

  function strawLook(kit) {
    const cut = kit.cut || {}, out = [], P = K.Body.PARTS;
    const add = (key, i) => { if (!cut[P[i]]) out.push([key, i]); };
    add('straw.head', 0);
    add('straw.chest', 1);
    add('straw.belly', 2);
    add('straw.arm', 3);
    add('straw.arm', 4);
    if (!cut.lArm) add('straw.fore', 5);
    if (!cut.rArm) add('straw.fore', 6);
    return out;
  }

  function look(kit) {
    if (kit.side === 'straw') return strawLook(kit);
    const out = [], cut = kit.cut || {}, pros = kit.pros || {}, race = K.Data.SIDES[kit.side].race, P = K.Body.PARTS;
    const has = i => !cut[P[i]];
    const add = (key, i) => { if (has(i)) out.push([key, i]); };
    for (let i = 0; i < 11; i++) {
      const name = P[i], par = K.Body.PARENT[i];
      if (cut[name] && par >= 0 && has(par) && PARENT_CAP[name]) {
        const [on, o, dir, s] = PARENT_CAP[name];
        out.push([STUMP_OF[cut[name]] || 'stump.healed', on, capAt(o, dir, s)]);
      }
      if (has(i) && par >= 0 && cut[P[par]] && ROOT_CAP[name] && !pros[name]) {
        const [o, dir, s] = ROOT_CAP[name];
        out.push([STUMP_OF[cut[P[par]]] || 'stump.healed', i, capAt(o, dir, s)]);
      }
    }
    add('head.' + race + '.' + kit.fig, 0);
    if (kit.hair && kit.hair !== 'bald') add('hair.' + kit.hair, 0);
    if (kit.beard) add('beard', 0);
    if (kit.head) add('hat.' + kit.head, 0);
    add('chest.' + outfit(kit), 1);
    add('belly.' + outfit(kit), 2);
    const ls = limbSet(kit);
    for (const [i, part] of [[3, 'lArm'], [4, 'rArm']]) add('arm.' + ls, i);
    for (const [i, part] of [[5, 'lFore'], [6, 'rFore']]) add(pros[part] ? 'fore.' + pros[part] : 'fore.' + ls, i);
    for (const i of [7, 8]) add('thigh.' + ls, i);
    for (const [i, part] of [[9, 'lShin'], [10, 'rShin']]) add(pros[part] ? 'shin.' + pros[part] : 'shin.' + ls, i);
    for (const a of kit.armor || []) {
      if (a === 'mail') { add('mail.chest', 1); add('mail.belly', 2); add('mail.arm', 3); add('mail.arm', 4); }
      else if (a === 'plate') add('plate', 1);
      else if (a === 'collar') add('collar', 1);
      else if (a === 'bracers') { for (const [i, part] of [[5, 'lFore'], [6, 'rFore']]) if (!pros[part]) add('bracer', i); }
      else if (a === 'greaves') { for (const [i, part] of [[9, 'lShin'], [10, 'rShin']]) if (!pros[part]) add('greave', i); }
    }
    return out;
  }

  const packColor = c => (Math.round(K.clamp(c[0], 0, 1) * 255) * 65536) + (Math.round(K.clamp(c[1], 0, 1) * 255) * 256) + Math.round(K.clamp(c[2], 0, 1) * 255);

  const ONE = { sx: 1, sy: 1 };
  const compose = (fr, b, fig, loc, out) => {
    const sx = fig.sx, sy = fig.sy;
    const ax = [fr[b] * sx, fr[b + 1] * sx, fr[b + 2] * sx], ay = [fr[b + 3] * sy, fr[b + 4] * sy, fr[b + 5] * sy], az = [fr[b + 6] * sx, fr[b + 7] * sx, fr[b + 8] * sx];
    const o = [fr[b + 9], fr[b + 10], fr[b + 11]];
    if (!loc) {
      for (let r = 0; r < 3; r++) { out[r * 4] = ax[r]; out[r * 4 + 1] = ay[r]; out[r * 4 + 2] = az[r]; out[r * 4 + 3] = o[r]; }
      return;
    }
    const col = c => [ax[0] * loc[c] + ay[0] * loc[c + 1] + az[0] * loc[c + 2], ax[1] * loc[c] + ay[1] * loc[c + 1] + az[1] * loc[c + 2], ax[2] * loc[c] + ay[2] * loc[c + 1] + az[2] * loc[c + 2]];
    const cx = col(0), cy = col(3), cz = col(6), co = col(9);
    for (let r = 0; r < 3; r++) { out[r * 4] = cx[r]; out[r * 4 + 1] = cy[r]; out[r * 4 + 2] = cz[r]; out[r * 4 + 3] = o[r] + co[r]; }
  };
  const eyeFlags = kit => (kit.eyes && kit.eyes.l ? 8 : 0) + (kit.eyes && kit.eyes.r ? 16 : 0);

  function pack(items, opts) {
    const lib = library(), o = opts || {}, parts = o.parts || null, buckets = new Map();
    let n = 0;
    const put = (m, fr, b, fig, loc, pal, face, metal) => {
      if (!buckets.has(m.cls)) buckets.set(m.cls, []);
      buckets.get(m.cls).push([m, fr, b, fig, loc, pal, face, metal]);
      n++;
    };
    for (const it of items) {
      const kit = it.kit;
      const pal = [packColor(kit.skin), packColor(kit.hairColor), packColor(kit.main), packColor(kit.accent)];
      const face = (kit.face || 0) + (kit.fig === 'f' ? 4 : 0) + eyeFlags(kit), metal = packColor(kit.metal);
      if (it.frames) {
        const fig = kit.beast ? ONE : K.Body.figure(kit), fr = it.frames;
        const only = it.parts || parts, fists = it.fist || null;
        for (const [key, part, loc] of kit.beast ? beastLook(kit) : look(kit)) {
          if (only && !only.includes(part)) continue;
          const m = fists && fists.includes(part) && lib.meshes[key + '.fist'] || lib.meshes[key];
          put(m, fr, part * 12, fig, loc || null, pal, face, metal);
        }
      }
      for (const [key, frame] of it.gear || []) put(lib.meshes[key], frame, 0, ONE, null, pal, face, metal);
    }
    const data = o.out && o.out.length >= n * INST ? o.out : new Float32Array(Math.max(n, 16) * INST * (o.grow ? 2 : 1));
    const segs = [];
    let k = 0;
    for (const cls of CLASSES) {
      const list = buckets.get(cls);
      if (!list) continue;
      segs.push({ verts: cls, start: k, count: list.length });
      for (const [m, fr, b, fig, loc, pal, face, metal] of list) {
        const w = k * INST;
        compose(fr, b, fig, loc, M12);
        for (let i = 0; i < 12; i++) data[w + i] = M12[i];
        data[w + 12] = pal[0]; data[w + 13] = pal[1]; data[w + 14] = pal[2]; data[w + 15] = pal[3];
        data[w + 16] = m.base; data[w + 17] = m.count; data[w + 18] = face; data[w + 19] = metal;
        k++;
      }
    }
    return { data, segs, n };
  }

  const M12 = new Float64Array(12);
  const trisOf = kit => look(kit).reduce((s, [key]) => s + library().meshes[key].tris, 0);

  K.Models = { SLOT, STRIDE, CLASSES, INST, OUTFITS, LIMBS, library, look, beastLook, pack, packColor, trisOf };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
