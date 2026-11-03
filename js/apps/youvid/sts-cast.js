(function () {
  const { M4, V3, shade, rand, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp, mesh, tube } = K;
  const Rig = window.YouVidRig;
  const { loft, ring } = Rig;

  const DIMS = {
    heavy: { hipX: 0.14, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.13, neckY: 0.345, shX: 0.25, shY: 0.235, upper: 0.31, fore: 0.27, headY: 0.155, head: 0.112 },
    mid: { hipX: 0.12, hipY: -0.05, thigh: 0.46, shin: 0.45, chestY: 0.12, neckY: 0.325, shX: 0.225, shY: 0.225, upper: 0.3, fore: 0.27, headY: 0.145, head: 0.106 },
    slim: { hipX: 0.11, hipY: -0.05, thigh: 0.47, shin: 0.46, chestY: 0.12, neckY: 0.32, shX: 0.215, shY: 0.225, upper: 0.31, fore: 0.27, headY: 0.14, head: 0.104 }
  };

  const RINGS = {
    heavy: [[-0.3, 0.22, 0.19, 0.03], [-0.24, 0.3, 0.26, 0.08], [-0.14, 0.345, 0.3, 0.11], [-0.03, 0.355, 0.305, 0.1], [0.07, 0.345, 0.275, 0.065], [0.15, 0.33, 0.245, 0.03], [0.22, 0.31, 0.215, 0.0], [0.28, 0.275, 0.19, -0.015], [0.33, 0.215, 0.155, -0.02], [0.36, 0.145, 0.115, -0.012], [0.38, 0.1, 0.09, 0.0]],
    mid: [[-0.28, 0.19, 0.145, 0.015], [-0.18, 0.215, 0.16, 0.03], [-0.06, 0.225, 0.165, 0.03], [0.06, 0.232, 0.158, 0.02], [0.16, 0.24, 0.15, 0.01], [0.24, 0.235, 0.138, 0.0], [0.3, 0.19, 0.115, -0.01], [0.335, 0.12, 0.085, -0.008], [0.35, 0.085, 0.07, 0.0]],
    slim: [[-0.28, 0.165, 0.12, 0.005], [-0.16, 0.17, 0.12, 0.005], [-0.04, 0.18, 0.122, 0.008], [0.08, 0.2, 0.128, 0.006], [0.18, 0.218, 0.13, 0.0], [0.26, 0.215, 0.12, -0.006], [0.31, 0.17, 0.1, -0.01], [0.335, 0.105, 0.078, -0.006], [0.35, 0.08, 0.066, 0.0]]
  };

  const PEOPLE = {
    vlad: {
      body: 'heavy', skin: 0xd9ae9e, hair: 0x4a3626, hairHi: 0x5e4632, style: 'short', beard: 0x46322a, full: true,
      brow: '#3e2c22', iris: '#5d6a74', jaw: 0.16,
      outfits: {
        polo: { top: 'polo', col: 0x2a4652, ink: '#d8dde6', ink2: '#b48ca4', sleeve: 'short', legs: 0x23242a, foot: 'bare', girth: [0.76, 0.8] },
        puffer: { top: 'puffer', col: 0x1c1d22, sleeve: 'long', legs: 0x23242a, foot: 'shoe', girth: [0.86, 0.86] },
        towel: { top: 'skin', sleeve: 'none', legs: 'towel', towel: 0x2a3e8c, foot: 'bare', tattoo: true },
        swim: { top: 'skin', sleeve: 'none', legs: 0x1c1c22, short: true, foot: 'bare', tattoo: true },
        shorts: { top: 'polo', col: 0x2a4652, ink: '#d8dde6', ink2: '#b48ca4', sleeve: 'short', legs: 0x1c1c22, short: true, foot: 'bare', girth: [0.76, 0.8] },
        bra: { top: 'tee', col: 0x223a78, print: 'skull', sleeve: 'short', legs: 0x23242a, foot: 'shoe', bra: true, tattoo: true },
        hoodie: { top: 'hoodie', col: 0x1c1c20, lining: 0x6a6a70, strings: 0x8a8a90, sleeve: 'long', legs: 0x23242a, foot: 'shoe', girth: [0.88, 0.86] },
        santa: { top: 'tee', col: 0x18181c, print: 'chest', sleeve: 'short', legs: 0x23242a, foot: 'shoe', hat: 'santa', tattoo: true, girth: [0.9, 0.88] },
        zip: { top: 'zip', col: 0x18181c, inner: 0xb81e24, sleeve: 'long', legs: 0x22283a, foot: 'shoe', girth: [0.82, 0.82] },
        greece: { top: 'hoodie', col: 0x1a2440, lining: 0x1a2440, strings: 0x7ac8e8, sleeve: 'long', legs: 0x141418, foot: 'shoe', hat: 'cap', girth: [0.8, 0.84] }
      }
    },
    yellow: {
      body: 'heavy', skin: 0xdfae9a, hair: 0x9a8a78, hairHi: 0xaa9a88, style: 'buzz', beard: null, stubble: 'rgba(120, 96, 80, 0.35)',
      brow: '#8a7060', iris: '#6a7480', jaw: 0.1, lipstick: true, ears: 1.35, girth: [0.82, 0.86],
      outfits: { tee: { top: 'tee', col: 0xf2c414, print: 'yellow', sleeve: 'short', legs: 0x141416, foot: 'shoe', tattoo: true } }
    },
    leather: {
      body: 'mid', skin: 0xd8a890, hair: 0x5a4434, hairHi: 0x6a5242, style: 'thin', beard: null, stubble: 'rgba(90, 70, 56, 0.3)',
      brow: '#4a3628', iris: '#4a4038', jaw: 0.08,
      outfits: { jacket: { top: 'leather', col: 0x3e2a20, sleeve: 'long', legs: 0x6c8cb4, foot: 'shoe', shoe: 0x18181a } }
    },
    young: {
      body: 'mid', skin: 0xe0b098, hair: 0x5a4030, hairHi: 0x6e523e, style: 'crew', beard: null, stubble: 'rgba(110, 80, 60, 0.32)',
      brow: '#4a3424', iris: '#5a6470', jaw: 0.12,
      outfits: { top: { top: 'tee', col: 0x6c6a56, sleeve: 'long', legs: 0x2a2a30, foot: 'shoe', tattoo: true } }
    },
    party: {
      body: 'slim', skin: 0xe2b49e, hair: 0x2a1e18, hairHi: 0x3a2a20, style: 'crew', beard: null, stubble: 'rgba(60, 44, 36, 0.25)',
      brow: '#2a1e18', iris: '#3a3028', jaw: 0.06,
      outfits: { jacket: { top: 'jacket', col: 0x141418, sleeve: 'long', legs: 0x18181c, foot: 'shoe' } }
    },
    beanie: {
      body: 'mid', skin: 0xdcaa94, hair: 0x3a2a20, hairHi: 0x4a3828, style: 'crew', beard: 0x3e2c22, stubble: 'rgba(70, 50, 40, 0.5)',
      brow: '#3a2a20', iris: '#4a4038', jaw: 0.12,
      outfits: { jacket: { top: 'jacket', col: 0x18181c, sleeve: 'long', legs: 0x18181c, foot: 'shoe', hat: 'beanie' } }
    },
    ren: {
      body: 'heavy', skin: 0xe8b4a4, hair: 0x2a1e18, hairHi: 0x3a2a20, style: 'messy', beard: null, stubble: 'rgba(60, 40, 34, 0.55)',
      brow: '#2a1e18', iris: '#3a3028', jaw: 0.1,
      outfits: { bare: { top: 'skin', sleeve: 'none', legs: 0x23242a, foot: 'bare', tribal: true } }
    },
    ginger: {
      body: 'slim', skin: 0xe8bca8, hair: 0x9a4a24, hairHi: 0xb05a2c, style: 'messy', beard: null, stubble: 'rgba(160, 90, 50, 0.3)',
      brow: '#8a4424', iris: '#5a6a74', jaw: 0.06,
      outfits: { vest: { top: 'vest', col: 0x141416, inner: 0xb81e2a, sleeve: 'long', sleeveCol: 0xb81e2a, legs: 0x1c1c22, foot: 'shoe' } }
    },
    stripe: {
      body: 'mid', skin: 0xe2b6a0, hair: 0x2a2018, hairHi: 0x3a2c22, style: 'crew', beard: null, stubble: 'rgba(60, 46, 36, 0.25)',
      brow: '#2a2018', iris: '#3a3028', jaw: 0.08, glasses: true,
      outfits: { sweater: { top: 'sweater', col: 0x16161a, band: 0x7ac0e4, sleeve: 'long', legs: 0x2a3a5a, foot: 'shoe' } }
    },
    specs: {
      body: 'mid', skin: 0xdcaa94, hair: 0x3a2c22, hairHi: 0x4a3828, style: 'crew', beard: null, stubble: 'rgba(80, 60, 46, 0.4)',
      brow: '#3a2c22', iris: '#3a3028', jaw: 0.1, glasses: true,
      outfits: { polo: { top: 'tee', col: 0x2c58b4, collar: true, sleeve: 'short', legs: 0x2a3a5a, foot: 'shoe' } }
    },
    longhair: {
      body: 'slim', skin: 0xd8a88e, hair: 0x4a3424, hairHi: 0x5e4430, style: 'long', beard: null, stubble: 'rgba(80, 60, 44, 0.35)',
      brow: '#3a2a1e', iris: '#4a4038', jaw: 0.1, necklace: true,
      outfits: { tee: { top: 'tee', col: 0x5a7ec8, sleeve: 'short', legs: 0x4a6a94, foot: 'shoe' } }
    }
  };

  const EYES = ['open', 'half', 'shut', 'squint', 'wide'];
  const BROWS = ['flat', 'up', 'furrow', 'sad'];
  const MOUTHS = ['shut', 'talk', 'open', 'shout', 'smile', 'laugh', 'pout', 'grimace'];
  const GAZES = { c: [0, 0], l: [-5, 0], r: [5, 0], d: [0, 4.5], u: [0, -4], m: [0, 2] };
  const FACE = { Y0: -1.0, Y1: 1.0, P0: -1.15, P1: 0.45 };

  function headDir(yaw, pit) {
    return [S(yaw) * C(pit), S(pit), C(yaw) * C(pit)];
  }

  function headPt(R, jaw, yaw, pit, k) {
    const n = headDir(yaw, pit);
    const low = Math.max(0, -n[1]);
    const front = Math.max(0, n[2]);
    const x = n[0] * R * 0.8 * (1 + jaw * low * (1 - 0.7 * low));
    const y = n[1] * R * (n[1] > 0 ? 1.04 : 1.12);
    const z = n[2] * R * (n[2] > 0 ? 0.92 + 0.18 * low * front * front : 0.88);
    const s = k || 1;
    return [x * s, y * s, z * s];
  }

  function headNormal(R, jaw, yaw, pit) {
    const e = 0.01;
    const a = headPt(R, jaw, yaw - e, pit), b = headPt(R, jaw, yaw + e, pit), c = headPt(R, jaw, yaw, pit - e), d = headPt(R, jaw, yaw, pit + e);
    const n = V3.norm(V3.cross(V3.sub(b, a), V3.sub(d, c)));
    return V3.dot(n, headPt(R, jaw, yaw, pit)) < 0 ? V3.mul(n, -1) : n;
  }

  function headPatch(b, P, R, y0, y1, p0, p1, nu, nv, k, col, uvFn) {
    const kk = typeof k === 'function' ? k : () => k;
    for (let j = 0; j < nv; j++) {
      for (let i = 0; i < nu; i++) {
        const ya = y0 + (y1 - y0) * (i / nu), yb = y0 + (y1 - y0) * ((i + 1) / nu);
        const pa = p0 + (p1 - p0) * (j / nv), pb = p0 + (p1 - p0) * ((j + 1) / nv);
        const v = [[ya, pa], [yb, pa], [yb, pb], [ya, pb]];
        const ks = v.map(([y, p]) => kk(y, p));
        if (ks.some(x => x === null)) continue;
        const pts = v.map(([y, p], q) => headPt(R, P.jaw, y, p, ks[q]));
        const ns = v.map(([y, p]) => headNormal(R, P.jaw, y, p));
        const cols = typeof col === 'function' ? v.map(([y, p]) => rgb(col(y, p))) : col;
        b.quad(pts[0], pts[1], pts[2], pts[3], cols, uvFn ? v.map(([y, p]) => uvFn(y, p)) : null, ns);
      }
    }
  }

  function inBeard(yaw, pit) {
    const a = Math.abs(yaw);
    if (a > 1.75) return false;
    if (pit < -0.62) return true;
    return a > 1.05 && pit < 0.05 - 0.25 * clamp((1.6 - a) / 0.5, 0, 1);
  }

  function buildHead(b, P, R) {
    headPatch(b, P, R, -PI, PI, -PI / 2, PI / 2, 22, 14, 1, (y, p) => {
      if (P.full && inBeard(y, p)) return P.beard;
      return headDir(y, p)[1] < -0.72 ? shade(P.skin, 0.88) : P.skin;
    });
    b.at(0, -R * 0.2, R * 0.93, h => h.ellipsoid(R * 0.11, R * 0.19, R * 0.14, 7, 5, shade(P.skin, 0.96)));
    [-1, 1].forEach(s => b.at(s * R * 0.075, -R * 0.33, R * 0.93, h => h.ellipsoid(R * 0.055, R * 0.045, R * 0.05, 5, 4, shade(P.skin, 0.92))));
    const ear = P.ears || 1;
    [-1, 1].forEach(s => b.at(s * R * 0.79, -R * 0.08, -R * 0.06, h => h.ellipsoid(R * 0.09 * ear, R * 0.23 * ear, R * 0.15 * ear, 7, 5, shade(P.skin, 0.9))));
  }

  function buildBeard(b, P, R) {
    if (!P.full) return;
    headPatch(b, P, R, -1.7, 1.7, -1.5, -0.55, 16, 6, (y, p) => {
      if (!inBeard(y, p) && p > -0.6) return null;
      const chin = clamp((-0.6 - p) / 0.8, 0, 1) * Math.max(0, C(y));
      return 1.03 + 0.1 * chin;
    }, (y, p) => (Math.abs(y) < 0.4 && p < -1.1 ? shade(P.beard, 0.9) : P.beard));
  }

  const HAIRLINES = {
    buzz: (a) => (a < 0.6 ? 0.78 : a < 1.4 ? 0.78 - 0.5 * ((a - 0.6) / 0.8) : 0.28 - 0.7 * clamp((a - 1.4) / 1.2, 0, 1)),
    thin: (a) => (a < 0.5 ? 0.95 : a < 1.2 ? 0.95 - 0.55 * ((a - 0.5) / 0.7) : 0.4 - 0.75 * clamp((a - 1.2) / 1.2, 0, 1)),
    crew: (a) => (a < 0.55 ? 0.72 : a < 1.2 ? 0.72 - 0.38 * ((a - 0.55) / 0.65) : 0.34 - 0.8 * clamp((a - 1.2) / 1.3, 0, 1)),
    short: (a) => (a < 0.55 ? 0.66 : a < 1.15 ? 0.66 - 0.3 * ((a - 0.55) / 0.6) : 0.36 - 0.85 * clamp((a - 1.15) / 1.3, 0, 1)),
    messy: (a) => (a < 0.6 ? 0.6 : a < 1.2 ? 0.6 - 0.25 * ((a - 0.6) / 0.6) : 0.35 - 0.9 * clamp((a - 1.2) / 1.3, 0, 1)),
    long: (a) => (a < 0.5 ? 0.7 : a < 1.2 ? 0.7 - 0.45 * ((a - 0.5) / 0.7) : 0.25 - 1.0 * clamp((a - 1.2) / 1.0, 0, 1))
  };

  const HAIR_PUFF = { buzz: 0.012, thin: 0.02, crew: 0.05, short: 0.06, messy: 0.09, long: 0.06, slick: 0.035 };

  function buildHair(b, P, R, style) {
    const line = HAIRLINES[style] || HAIRLINES.short;
    const puff = HAIR_PUFF[style] || 0.05;
    const g = rand(P.hair & 0xffff);
    const nu = 26, nv = 8;
    const scale = (yaw, pit) => {
      const top = clamp((pit - 0.2) / 1.2, 0, 1);
      const front = Math.max(0, C(yaw));
      const sweep = style === 'slick' ? -0.015 * front : 0;
      return 1.015 + puff * (0.4 + 0.6 * top) + sweep + (style === 'messy' ? 0.025 * S(yaw * 5 + pit * 7) : 0);
    };
    for (let i = 0; i < nu; i++) {
      const ya = -PI + (2 * PI * i) / nu, yb = -PI + (2 * PI * (i + 1)) / nu;
      const ha = line(Math.abs(ya)), hb = line(Math.abs(yb));
      for (let j = 0; j < nv; j++) {
        const ka = j / nv, kb = (j + 1) / nv;
        const p = (h, k) => h + (PI / 2 - h) * k;
        const v = [[ya, p(ha, ka)], [yb, p(hb, ka)], [yb, p(hb, kb)], [ya, p(ha, kb)]];
        const pts = v.map(([y, pp]) => headPt(R, P.jaw, y, pp, scale(y, pp)));
        const ns = v.map(([y, pp]) => headNormal(R, P.jaw, y, pp));
        const col = (i * 3 + j * 5) % 11 === 0 ? P.hairHi : P.hair;
        b.quad(pts[0], pts[1], pts[2], pts[3], col, null, ns);
      }
      const e0 = headPt(R, P.jaw, ya, ha, scale(ya, ha)), e1 = headPt(R, P.jaw, yb, hb, scale(yb, hb));
      const i0 = headPt(R, P.jaw, ya, ha - 0.03, 1.0), i1 = headPt(R, P.jaw, yb, hb - 0.03, 1.0);
      b.quad(i0, i1, e1, e0, shade(P.hair, 0.82));
    }
    if (style === 'crew' || style === 'short' || style === 'messy') {
      const n = style === 'messy' ? 34 : 18;
      for (let i = 0; i < n; i++) {
        const yaw = style === 'messy' ? -PI + g() * 2 * PI : -0.8 + g() * 1.6;
        const pit = (style === 'messy' ? 0.62 + 0.25 * Math.abs(C(yaw)) : 0.75) + g() * 0.45;
        const p = headPt(R, P.jaw, yaw, pit, scale(yaw, pit) - 0.01);
        b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotX(-1.0 - g() * 0.5 + (style === 'messy' ? (g() - 0.5) * 0.6 : 0)), M4.rotZ((g() - 0.5) * 0.8));
        b.prism(4, 0.014 + g() * 0.008, 0.008, 0, 0.003, 0.003, 0.02 + g() * (style === 'messy' ? 0.04 : 0.016), g() < 0.35 ? P.hairHi : P.hair);
        b.pop();
      }
    }
    if (style === 'long') {
      for (let i = 0; i < 22; i++) {
        const yaw = PI * 0.42 + (i / 21) * PI * 1.16;
        const top = headPt(R, P.jaw, yaw, 0.15, 1.06);
        const out = V3.norm([S(yaw), 0, C(yaw)]);
        const low = V3.add(top, [out[0] * 0.03, -0.2 - 0.04 * S(i * 1.7), out[2] * 0.03 - 0.02]);
        tube(b, [top, V3.lerp(top, low, 0.5), low], [0.02, 0.022, 0.012], 5, i % 4 === 0 ? P.hairHi : P.hair);
      }
    }
  }

  function buildCap(b, P, R) {
    const col = 0x141416;
    headPatch(b, P, R, -PI, PI, 0.12, PI / 2, 18, 6, 1.14, col);
    for (let i = 0; i < 10; i++) {
      const a0 = -0.95 + (1.9 * i) / 10, a1 = -0.95 + (1.9 * (i + 1)) / 10;
      const e0 = headPt(R, P.jaw, a0, 0.16, 1.14), e1 = headPt(R, P.jaw, a1, 0.16, 1.14);
      const o0 = V3.add(e0, [S(a0) * 0.05, -0.012, C(a0) * 0.08]), o1 = V3.add(e1, [S(a1) * 0.05, -0.012, C(a1) * 0.08]);
      b.quad(e0, e1, o1, o0, shade(col, 0.85));
    }
    b.at(0, R * 1.15, 0, h => h.ellipsoid(R * 0.09, R * 0.05, R * 0.09, 6, 3, shade(col, 1.3)));
  }

  function buildBeanie(b, P, R) {
    const col = 0xc81e1e;
    headPatch(b, P, R, -PI, PI, 0.18, PI / 2, 18, 7, (y, p) => 1.16 + 0.04 * clamp((p - 0.6) / 0.9, 0, 1), col);
    headPatch(b, P, R, -PI, PI, 0.06, 0.4, 18, 2, 1.2, shade(col, 0.92), (y, p) => [(y + PI) / (2 * PI), (p - 0.06) / 0.34]);
  }

  function buildSanta(b, P, R) {
    const red = 0xc01818, fur = 0xf2eeea;
    headPatch(b, P, R, -PI, PI, 0.25, 1.0, 18, 3, 1.14, red);
    b.push(M4.translate(0, R * 0.85, -R * 0.05), M4.rotX(-0.18), M4.rotZ(0.45));
    b.prism(10, R * 0.9, R * 0.88, 0, R * 0.45, R * 0.45, R * 0.9, red);
    b.push(M4.translate(0, R * 0.9, 0), M4.rotZ(0.9));
    b.prism(10, R * 0.45, R * 0.45, 0, R * 0.06, R * 0.06, R * 1.2, red);
    b.at(0, R * 1.25, 0, h => h.ellipsoid(R * 0.24, R * 0.24, R * 0.24, 8, 5, fur));
    b.pop();
    b.pop();
    headPatch(b, P, R, -PI, PI, 0.1, 0.38, 20, 2, 1.22, fur);
    b.at(0, R * 0.45, R * 1.18, h => h.ellipsoid(R * 0.16, R * 0.12, R * 0.04, 8, 4, 0x2a8a3a));
  }

  function buildGlasses(b, P, R) {
    const col = 0x18181a;
    [-1, 1].forEach(s => {
      const c = headPt(R, P.jaw, s * 0.36, 0.06, 1.13);
      b.push(M4.translate(c[0], c[1], c[2]), M4.rotY(s * 0.3));
      [[0, 0.022, 0.05, 0.005], [0, -0.022, 0.05, 0.005], [0.026, 0, 0.005, 0.045], [-0.026, 0, 0.005, 0.045]].forEach(([x, y, w, h]) => b.at(x, y, 0, q => q.box(w, h, 0.005, col)));
      b.pop();
      const hinge = headPt(R, P.jaw, s * 0.7, 0.07, 1.1);
      const back = headPt(R, P.jaw, s * 1.3, 0.05, 1.02);
      tube(b, [hinge, back], [0.0025, 0.0025], 4, col);
    });
    const l = headPt(R, P.jaw, -0.14, 0.08, 1.16), rr = headPt(R, P.jaw, 0.14, 0.08, 1.16);
    tube(b, [l, rr], [0.003, 0.003], 4, col);
  }

  function blob(ctx, x, y, rx, ry, col, alpha) {
    const gr = ctx.createRadialGradient(x, y, 0, x, y, 1);
    gr.addColorStop(0, `rgba(${col},${alpha})`);
    gr.addColorStop(1, `rgba(${col},0)`);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    ctx.translate(-x, -y);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x, y, 1, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function rgbStr(hex, k) {
    return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255].map(v => Math.min(255, Math.round(v * k))).join(',');
  }

  function paintSkin(ctx, P) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, `rgb(${rgbStr(P.skin, 1)})`);
    grad.addColorStop(0.8, `rgb(${rgbStr(P.skin, 1)})`);
    grad.addColorStop(1, `rgb(${rgbStr(P.skin, 0.88)})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
    const sh = rgbStr(P.skin, 0.66);
    blob(ctx, 80, 60, 30, 20, sh, 0.32);
    blob(ctx, 176, 60, 30, 20, sh, 0.32);
    blob(ctx, 140, 104, 9, 20, sh, 0.32);
    blob(ctx, 128, 127, 16, 6, sh, 0.38);
    blob(ctx, 128, 176, 20, 7, sh, 0.28);
    blob(ctx, 128, 216, 70, 22, sh, 0.2);
    blob(ctx, 72, 116, 22, 16, '255,206,190', 0.2);
    blob(ctx, 184, 116, 22, 16, '255,206,190', 0.2);
    blob(ctx, 118, 96, 7, 16, '255,226,212', 0.26);
    if (P.stubble) {
      ctx.fillStyle = P.stubble;
      ctx.beginPath();
      ctx.moveTo(0, 130);
      ctx.quadraticCurveTo(40, 150, 70, 168);
      ctx.quadraticCurveTo(100, 136, 128, 138);
      ctx.quadraticCurveTo(156, 136, 186, 168);
      ctx.quadraticCurveTo(216, 150, 256, 130);
      ctx.lineTo(256, 256);
      ctx.lineTo(0, 256);
      ctx.closePath();
      ctx.fill();
    }
    if (P.full) {
      const bc = rgbStr(P.beard, 1);
      ctx.fillStyle = `rgba(${bc},0.95)`;
      ctx.beginPath();
      ctx.moveTo(0, 104);
      ctx.quadraticCurveTo(22, 150, 62, 168);
      ctx.quadraticCurveTo(96, 150, 128, 146);
      ctx.quadraticCurveTo(160, 150, 194, 168);
      ctx.quadraticCurveTo(234, 150, 256, 104);
      ctx.lineTo(256, 256);
      ctx.lineTo(0, 256);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(${rgbStr(P.beard, 1.25)},0.4)`;
      for (let i = 0; i < 26; i++) ctx.fillRect(20 + ((i * 37) % 216), 160 + ((i * 53) % 90), 3, 7);
    }
    if (P.lipstick) {
      blob(ctx, 128, 112, 20, 16, '214,40,50', 0.75);
      blob(ctx, 70, 120, 26, 20, '220,60,70', 0.45);
      blob(ctx, 186, 120, 26, 20, '220,60,70', 0.45);
    }
  }

  function drawFace(P, key) {
    const [eyes, brows, mouth, gaze] = key.split('|');
    return (ctx, w, h) => {
      ctx.save();
      ctx.scale(w / 256, h / 256);
      paintSkin(ctx, P);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const ey = 62, mx = 128, my = 156;
      const g = GAZES[gaze] || GAZES.c;
      [[80, -1], [176, 1]].forEach(([x, s]) => {
        let outer = 38, inner = 40, arch = -6;
        if (brows === 'up') { outer = 30; inner = 31; arch = -9; }
        if (brows === 'furrow') { outer = 32; inner = 48; arch = -3; }
        if (brows === 'sad') { outer = 42; inner = 30; arch = -4; }
        ctx.strokeStyle = P.brow;
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(x + s * 27, outer);
        ctx.quadraticCurveTo(x + s * 4, Math.min(outer, inner) + arch, x - s * 22, inner);
        ctx.stroke();
        if (eyes === 'shut' || eyes === 'squint') {
          ctx.strokeStyle = '#2a1a16';
          ctx.lineWidth = eyes === 'squint' ? 4.5 : 3.5;
          ctx.beginPath();
          const sag = eyes === 'shut' ? 5 : -3;
          ctx.moveTo(x - 19, ey + 1);
          ctx.quadraticCurveTo(x, ey + sag + 1, x + 19, ey + 1);
          ctx.stroke();
          if (eyes === 'squint') {
            ctx.strokeStyle = `rgba(${rgbStr(P.skin, 0.55)},0.7)`;
            ctx.lineWidth = 2;
            [4, 9].forEach(d => {
              ctx.beginPath();
              ctx.moveTo(x + s * 18, ey + d - 4);
              ctx.lineTo(x + s * 26, ey + d);
              ctx.stroke();
            });
          }
          return;
        }
        const ry = { wide: 10, open: 7.4, half: 4.6 }[eyes] || 7.4;
        ctx.fillStyle = '#f0e8e2';
        ctx.beginPath();
        ctx.ellipse(x, ey, 18, ry, 0, 0, PI * 2);
        ctx.fill();
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(x, ey, 18, ry, 0, 0, PI * 2);
        ctx.clip();
        ctx.fillStyle = P.iris;
        ctx.beginPath();
        ctx.arc(x + g[0], ey + g[1] + (eyes === 'half' ? 1.5 : 0), 7.2, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0c0807';
        ctx.beginPath();
        ctx.arc(x + g[0], ey + g[1] + (eyes === 'half' ? 1.5 : 0), 3, 0, PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillRect(x + g[0] + 1.5, ey + g[1] - 3.5, 2.2, 2.2);
        if (eyes === 'half') {
          ctx.fillStyle = `rgb(${rgbStr(P.skin, 0.9)})`;
          ctx.fillRect(x - 20, ey - ry - 1, 40, ry * 0.9);
        }
        ctx.restore();
        ctx.strokeStyle = '#2a1a16';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 19, ey + 1);
        ctx.quadraticCurveTo(x, ey - ry - 3, x + 19, ey + 1);
        ctx.stroke();
      });
      ctx.fillStyle = `rgba(${rgbStr(P.skin, 0.6)},0.45)`;
      ctx.beginPath();
      ctx.ellipse(128, 121, 11, 4, 0, 0, PI * 2);
      ctx.fill();
      const lip = P.lipstick ? '#c41e2a' : `rgb(${rgbStr(P.skin, 0.66)})`;
      ctx.lineWidth = P.lipstick ? 7 : 4;
      ctx.strokeStyle = lip;
      ctx.fillStyle = '#3a1414';
      if (mouth === 'shut') {
        ctx.beginPath();
        ctx.moveTo(mx - 30, my);
        ctx.quadraticCurveTo(mx, my + 4, mx + 30, my);
        ctx.stroke();
      } else if (mouth === 'pout') {
        ctx.beginPath();
        ctx.ellipse(mx, my + 2, 13, 9, 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
      } else if (mouth === 'smile' || mouth === 'laugh') {
        ctx.beginPath();
        ctx.moveTo(mx - 28, my - 6);
        ctx.quadraticCurveTo(mx, my + (mouth === 'laugh' ? 26 : 12), mx + 28, my - 6);
        if (mouth === 'laugh') {
          ctx.quadraticCurveTo(mx, my + 2, mx - 28, my - 6);
          ctx.fill();
          ctx.fillStyle = '#ece4dc';
          ctx.beginPath();
          ctx.moveTo(mx - 22, my - 3);
          ctx.quadraticCurveTo(mx, my + 2, mx + 22, my - 3);
          ctx.lineTo(mx + 19, my + 4);
          ctx.quadraticCurveTo(mx, my + 7, mx - 19, my + 4);
          ctx.closePath();
          ctx.fill();
        }
        ctx.stroke();
      } else if (mouth === 'grimace') {
        ctx.beginPath();
        ctx.moveTo(mx - 34, my);
        ctx.quadraticCurveTo(mx, my - 10, mx + 34, my);
        ctx.quadraticCurveTo(mx, my + 18, mx - 34, my);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ece4dc';
        ctx.fillRect(mx - 26, my - 4, 52, 5);
        ctx.fillRect(mx - 22, my + 4, 44, 4);
      } else {
        const sz = { talk: [22, 11], open: [28, 21], shout: [34, 34] }[mouth] || [22, 11];
        ctx.beginPath();
        ctx.ellipse(mx, my + sz[1] * 0.35, sz[0], sz[1], 0, 0, PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#ece4dc';
        ctx.fillRect(mx - sz[0] * 0.65, my + sz[1] * 0.35 - sz[1] + 2, sz[0] * 1.3, Math.max(2.5, sz[1] * 0.22));
        if (mouth !== 'talk') {
          ctx.fillStyle = '#9a4a4a';
          ctx.beginPath();
          ctx.ellipse(mx, my + sz[1] * 0.95, sz[0] * 0.6, sz[1] * 0.32, 0, 0, PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    };
  }

  function faceKey(f) {
    const e = EYES.includes(f.eyes) ? f.eyes : 'open';
    const b = BROWS.includes(f.brows) ? f.brows : 'flat';
    const m = MOUTHS.includes(f.mouth) ? f.mouth : 'shut';
    const g = GAZES[f.gaze] ? f.gaze : 'c';
    return [e, b, m, g].join('|');
  }

  function shell(b, rings, sides, colAt, uv) {
    const y0 = rings[0][0], y1 = rings[rings.length - 1][0];
    const ang = (i) => (i / sides) * PI * 2 + PI;
    const pt = (r, i) => [S(ang(i)) * r[1], r[0], r[3] + C(ang(i)) * r[2]];
    const nr = (r, i, slope) => V3.norm([S(ang(i)) / r[1], slope, C(ang(i)) / r[2]]);
    for (let j = 0; j < rings.length - 1; j++) {
      const r0 = rings[j], r1 = rings[j + 1];
      const dy = r1[0] - r0[0];
      if (Math.abs(dy) < 1e-6) continue;
      const slope = (((r0[1] + r0[2]) - (r1[1] + r1[2])) / 2) / dy;
      const v0 = (r0[0] - y0) / (y1 - y0), v1 = (r1[0] - y0) / (y1 - y0);
      for (let i = 0; i < sides; i++) {
        const c0 = rgb(colAt(r0[0])), c1 = rgb(colAt(r1[0]));
        const uvs = uv ? [[i / sides, v0], [(i + 1) / sides, v0], [(i + 1) / sides, v1], [i / sides, v1]] : null;
        b.quad(pt(r0, i), pt(r0, i + 1), pt(r1, i + 1), pt(r1, i), [c0, c0, c1, c1], uvs, [nr(r0, i, slope), nr(r0, i + 1, slope), nr(r1, i + 1, slope), nr(r1, i, slope)]);
      }
    }
    return b;
  }

  function scaleRings(rings, sx, sz) {
    return rings.map(([y, rx, rz, cz]) => [y, rx * sx, rz * sz, cz * sz]);
  }

  function chestAt(rings, y) {
    for (let i = 0; i < rings.length - 1; i++) {
      const a = rings[i], b = rings[i + 1];
      if (y <= b[0]) {
        const k = clamp((y - a[0]) / (b[0] - a[0]), 0, 1);
        return { rx: lerp(a[1], b[1], k), rz: lerp(a[2], b[2], k), cz: lerp(a[3], b[3], k) };
      }
    }
    const l = rings[rings.length - 1];
    return { rx: l[1], rz: l[2], cz: l[3] };
  }

  function hexCss(hex, k) {
    return `rgb(${rgbStr(hex, k === undefined ? 1 : k)})`;
  }

  function topTex(P, O) {
    return (ctx, w, h) => {
      const col = O.top === 'skin' ? P.skin : O.col;
      ctx.fillStyle = hexCss(col);
      ctx.fillRect(0, 0, w, h);
      const fx = (u) => u * w, fy = (v) => (1 - v) * h;
      const front = w / 2;
      if (O.top === 'polo') {
        for (let i = 0; i < 14; i++) {
          const y = fy(0.04 + i * 0.07);
          ctx.fillStyle = O.ink;
          ctx.fillRect(0, y, w, h * 0.011);
          ctx.fillStyle = O.ink2;
          ctx.fillRect(0, y + h * 0.021, w, h * 0.007);
        }
        ctx.fillStyle = hexCss(col, 0.8);
        ctx.fillRect(front - w * 0.012, fy(0.98), w * 0.024, h * 0.2);
        ctx.fillStyle = '#d0d0d4';
        [0.86, 0.9, 0.94].forEach(v => { ctx.beginPath(); ctx.arc(front, fy(v), h * 0.006, 0, PI * 2); ctx.fill(); });
      } else if (O.top === 'tee') {
        if (O.print === 'skull') {
          ctx.fillStyle = 'rgba(10, 12, 24, 0.75)';
          ctx.beginPath();
          ctx.ellipse(front + w * 0.075, fy(0.66), w * 0.05, h * 0.09, 0.3, 0, PI * 2);
          ctx.fill();
          ctx.fillRect(front + w * 0.03, fy(0.78), w * 0.09, h * 0.04);
        } else if (O.print === 'yellow') {
          ctx.fillStyle = 'rgba(60, 50, 20, 0.6)';
          ctx.font = `bold ${Math.round(h * 0.035)}px Arial, sans-serif`;
          ctx.save();
          ctx.translate(front + w * 0.1, fy(0.64));
          ctx.rotate(PI / 2);
          ctx.fillText('ЕБАТОРИЯ', 0, 0);
          ctx.restore();
        } else if (O.print === 'chest') {
          ctx.strokeStyle = 'rgba(200, 200, 205, 0.6)';
          ctx.lineWidth = 2;
          ctx.strokeRect(front + w * 0.05, fy(0.72), w * 0.04, h * 0.05);
        }
        if (O.collar) {
          ctx.fillStyle = hexCss(col, 0.75);
          ctx.fillRect(front - w * 0.01, fy(0.98), w * 0.02, h * 0.14);
        }
      } else if (O.top === 'hoodie') {
        ctx.fillStyle = hexCss(col, 0.82);
        ctx.beginPath();
        ctx.moveTo(front - w * 0.11, fy(0.12));
        ctx.lineTo(front + w * 0.11, fy(0.12));
        ctx.lineTo(front + w * 0.08, fy(0.36));
        ctx.lineTo(front - w * 0.08, fy(0.36));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = hexCss(col, 0.7);
        ctx.fillRect(0, fy(0.07), w, h * 0.07);
      } else if (O.top === 'leather') {
        ctx.fillStyle = 'rgba(255, 220, 190, 0.08)';
        for (let i = 0; i < 6; i++) ctx.fillRect(front - w * 0.2 + i * w * 0.08, fy(0.95), w * 0.02, h * 0.85);
        ctx.fillStyle = '#9a9a9e';
        ctx.fillRect(front + w * 0.012, fy(0.97), w * 0.006, h * 0.9);
        ctx.fillStyle = hexCss(col, 0.7);
        ctx.fillRect(0, fy(0.06), w, h * 0.06);
        ctx.fillStyle = '#1a1416';
        ctx.beginPath();
        ctx.moveTo(front - w * 0.04, fy(1));
        ctx.lineTo(front + w * 0.04, fy(1));
        ctx.lineTo(front + w * 0.012, fy(0.8));
        ctx.closePath();
        ctx.fill();
      } else if (O.top === 'puffer') {
        ctx.strokeStyle = hexCss(col, 0.55);
        ctx.lineWidth = h * 0.012;
        for (let i = 1; i < 9; i++) {
          ctx.beginPath();
          ctx.moveTo(0, fy(i / 9));
          ctx.lineTo(w, fy(i / 9));
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        for (let i = 0; i < 9; i++) ctx.fillRect(0, fy((i + 0.7) / 9), w, h * 0.02);
        ctx.fillStyle = '#5a5a60';
        ctx.fillRect(front - w * 0.003, fy(1), w * 0.006, h);
      } else if (O.top === 'jacket') {
        ctx.fillStyle = '#4a4a50';
        ctx.fillRect(front - w * 0.003, fy(1), w * 0.006, h);
        ctx.fillStyle = hexCss(col, 1.4);
        ctx.fillRect(0, fy(0.08), w, h * 0.05);
      } else if (O.top === 'zip') {
        ctx.fillStyle = hexCss(O.inner);
        ctx.beginPath();
        ctx.moveTo(front - w * 0.07, fy(1));
        ctx.lineTo(front + w * 0.07, fy(1));
        ctx.lineTo(front + w * 0.035, fy(0.15));
        ctx.lineTo(front - w * 0.035, fy(0.15));
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#5a5a60';
        [-1, 1].forEach(s => ctx.fillRect(front + s * w * 0.045 - w * 0.003, fy(0.95), w * 0.006, h * 0.8));
      } else if (O.top === 'sweater') {
        ctx.fillStyle = hexCss(O.band);
        ctx.fillRect(0, fy(0.7), w, h * 0.07);
        ctx.fillStyle = hexCss(col, 1.5);
        ctx.fillRect(0, fy(0.06), w, h * 0.06);
      } else if (O.top === 'vest') {
        ctx.fillStyle = hexCss(O.inner);
        ctx.fillRect(front - w * 0.06, fy(1), w * 0.12, h * 0.35);
        ctx.fillStyle = hexCss(col, 1.6);
        [-1, 1].forEach(s => ctx.fillRect(front + s * w * 0.13 - w * 0.012, fy(1), w * 0.024, h * 0.9));
      } else if (O.top === 'skin') {
        const dark = rgbStr(P.skin, 0.68);
        [-1, 1].forEach(s => {
          blob(ctx, front + s * w * 0.075, fy(0.66), w * 0.012, h * 0.012, '150,90,80', 0.9);
          blob(ctx, front + s * w * 0.07, fy(0.7), w * 0.06, h * 0.05, dark, 0.35);
        });
        blob(ctx, front, fy(0.3), w * 0.008, h * 0.014, '120,70,60', 0.9);
        blob(ctx, front, fy(0.2), w * 0.2, h * 0.12, dark, 0.25);
        if (P.full) {
          ctx.fillStyle = `rgba(${rgbStr(P.beard, 1)},0.35)`;
          const g = rand(3);
          for (let i = 0; i < 220; i++) ctx.fillRect(front + (g() - 0.5) * w * 0.16, fy(0.62 + g() * 0.3), 2, 3);
        }
        if (O.tattoo) {
          ctx.fillStyle = 'rgba(40, 40, 50, 0.7)';
          ctx.beginPath();
          ctx.ellipse(front + w * 0.09, fy(0.86), w * 0.02, h * 0.025, 0, 0, PI * 2);
          ctx.fill();
        }
        if (O.tribal) {
          ctx.fillStyle = '#1c1a20';
          const cx = front + w * 0.21;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(cx - w * 0.04, fy(0.98 - i * 0.07));
            ctx.quadraticCurveTo(cx + w * 0.05, fy(0.95 - i * 0.07), cx + w * 0.02, fy(0.88 - i * 0.07));
            ctx.quadraticCurveTo(cx + w * 0.0, fy(0.93 - i * 0.07), cx - w * 0.04, fy(0.98 - i * 0.07));
            ctx.fill();
          }
        }
      }
    };
  }

  function armTex(P, O, part) {
    return (ctx, w, h) => {
      ctx.fillStyle = hexCss(P.skin);
      ctx.fillRect(0, 0, w, h);
      const ink = 'rgba(36, 34, 44, 0.82)';
      if (part === 'fore' && O.tattoo) {
        ctx.fillStyle = ink;
        const g = rand(5);
        for (let i = 0; i < 5; i++) {
          const y = h * (0.15 + i * 0.15);
          ctx.beginPath();
          ctx.moveTo(w * 0.35, y);
          ctx.quadraticCurveTo(w * (0.45 + g() * 0.2), y + h * 0.1, w * 0.68, y + h * 0.02);
          ctx.quadraticCurveTo(w * 0.52, y + h * 0.05, w * 0.35, y);
          ctx.fill();
        }
      }
      if (part === 'upper' && (O.tribal || O.tattoo)) {
        ctx.fillStyle = ink;
        for (let i = 0; i < 4; i++) {
          const y = h * (0.2 + i * 0.16);
          ctx.beginPath();
          ctx.moveTo(w * 0.3, y);
          ctx.quadraticCurveTo(w * 0.6, y - h * 0.08, w * 0.72, y + h * 0.06);
          ctx.quadraticCurveTo(w * 0.5, y + h * 0.02, w * 0.3, y);
          ctx.fill();
        }
      }
    };
  }

  function buildTorso(b, rings) {
    shell(b, rings, 20, () => 0xffffff, true);
  }

  function buildTorsoExtras(b, rings, O) {
    const top = rings[rings.length - 1];
    if (O.top === 'polo' || O.collar) {
      for (let i = 0; i < 12; i++) {
        const a0 = -PI * 0.7 + (PI * 1.4 * i) / 12, a1 = -PI * 0.7 + (PI * 1.4 * (i + 1)) / 12;
        const p = (a, r, y) => [S(a) * r, y, top[3] - 0.01 + C(a) * r * 0.9];
        b.quad(p(a0, top[1] * 0.85, top[0] - 0.01), p(a1, top[1] * 0.85, top[0] - 0.01), p(a1, top[1] * 1.05, top[0] - 0.04), p(a0, top[1] * 1.05, top[0] - 0.04), shade(O.col, 0.82));
      }
    }
    if (O.top === 'hoodie') {
      const H = O.col;
      b.at(0, top[0] - 0.04, -0.07, h => h.ellipsoid(0.15, 0.08, 0.1, 10, 5, shade(H, 0.9)));
      b.at(0, top[0] - 0.02, -0.02, h => h.ellipsoid(0.11, 0.05, 0.08, 10, 4, O.lining));
      [-1, 1].forEach(s => {
        const z = chestAt(rings, 0.18).rz + chestAt(rings, 0.18).cz;
        tube(b, [[s * 0.045, top[0] - 0.02, z - 0.01], [s * 0.05, 0.12, z + 0.012], [s * 0.052, 0.04, z + 0.01]], [0.006, 0.006, 0.005], 4, O.strings);
      });
    }
    if (O.top === 'leather' || O.top === 'puffer' || O.top === 'jacket' || O.top === 'zip') {
      const tall = O.top === 'puffer' ? 0.07 : 0.045;
      loft(b, [ring(top[0] - 0.03, top[1] * 1.1, top[2] * 1.15, top[3], shade(O.col, 0.95)), ring(top[0] + tall, top[1] * 1.08, top[2] * 1.1, top[3] - 0.005, shade(O.col, 1.05))], 14);
    }
    if (O.top === 'vest') {
      b.at(0, top[0] - 0.03, -0.06, h => h.ellipsoid(0.13, 0.07, 0.09, 10, 5, O.inner));
    }
  }

  function buildBra(b, rings) {
    const W = 0xf4f2f0;
    const c = chestAt(rings, 0.16);
    [-1, 1].forEach(s => {
      const x = s * c.rx * 0.34;
      const z = c.cz + Math.sqrt(Math.max(0, 1 - (x / c.rx) ** 2)) * c.rz;
      b.push(M4.translate(x, 0.16, z - 0.045), M4.rotY(s * 0.32));
      b.ellipsoid(0.11, 0.09, 0.08, 12, 7, W);
      b.pop();
      const strapTop = [s * 0.13, 0.38, rings[rings.length - 1][3] + 0.02];
      tube(b, [[x + s * 0.02, 0.2, z + 0.01], [s * 0.15, 0.33, z * 0.6], strapTop, [s * 0.13, 0.33, -0.12], [s * 0.15, 0.12, -c.rz * 0.95]], [0.008, 0.008, 0.008, 0.008, 0.008], 4, W);
    });
    loft(b, [ring(0.04, c.rx * 1.02, c.rz * 1.03, c.cz, W), ring(0.065, c.rx * 1.025, c.rz * 1.035, c.cz, W)], 18);
  }

  function buildPelvis(b, P, O) {
    const big = P.body === 'heavy';
    const col = O.legs === 'towel' ? O.towel : O.legs;
    loft(b, [ring(-0.17, big ? 0.17 : 0.14, big ? 0.14 : 0.11, -0.01, col), ring(-0.09, big ? 0.23 : 0.17, big ? 0.19 : 0.14, -0.01, col), ring(-0.01, big ? 0.26 : 0.185, big ? 0.21 : 0.15, 0.0, col), ring(0.07, big ? 0.26 : 0.18, big ? 0.21 : 0.145, 0.01, col)], 14, { capBottom: true, capTop: true });
    if (O.legs === 'towel') {
      loft(b, [ring(-0.62, 0.3, 0.27, 0.03, shade(O.towel, 0.9)), ring(-0.4, 0.29, 0.26, 0.03, O.towel), ring(-0.12, 0.28, 0.25, 0.03, O.towel), ring(0.04, 0.275, 0.24, 0.04, shade(O.towel, 1.08)), ring(0.07, 0.25, 0.22, 0.04, shade(O.towel, 1.08))], 18, { capBottom: false });
    }
  }

  function legCol(O, P) {
    return O.legs === 'towel' ? P.skin : O.legs;
  }

  function buildThigh(b, D, P, O) {
    const col = legCol(O, P);
    const big = P.body === 'heavy' ? 1.18 : 1;
    if (O.short && O.legs !== 'towel') {
      loft(b, [ring(-D.thigh - 0.02, 0.07, 0.075, 0, P.skin), ring(-D.thigh * 0.55, 0.085 * big, 0.09 * big, 0, P.skin), ring(-D.thigh * 0.5, 0.11 * big, 0.115 * big, 0, col), ring(0.05, 0.13 * big, 0.13 * big, 0, col)], 10, { capBottom: true, capTop: true });
      return;
    }
    loft(b, [ring(-D.thigh - 0.02, 0.07, 0.075, 0, col), ring(-0.3, 0.095 * big, 0.1 * big, 0, col), ring(-0.12, 0.115 * big, 0.12 * big, 0.005, col), ring(0.05, 0.125 * big, 0.125 * big, 0, col)], 10, { capBottom: true, capTop: true });
  }

  function buildShin(b, D, P, O) {
    const col = O.short || O.legs === 'towel' ? P.skin : O.legs;
    b.ellipsoid(0.07, 0.068, 0.075, 8, 5, col);
    loft(b, [ring(-D.shin + 0.02, 0.05, 0.055, 0, col), ring(-0.3, 0.062, 0.068, 0, col), ring(-0.12, 0.07, 0.075, 0.005, col), ring(0, 0.07, 0.075, 0, col)], 10, { capBottom: true });
  }

  function buildFoot(b, P, O) {
    const col = O.foot === 'bare' ? P.skin : (O.shoe || 0x1a1a1c);
    b.at(0, -0.035, 0, h => h.ellipsoid(0.045, 0.04, 0.05, 7, 4, col));
    b.push(M4.translate(0, -0.06, 0.055));
    b.box(O.foot === 'bare' ? 0.08 : 0.095, 0.05, 0.19, col);
    b.pop();
  }

  function buildUpperSkin(b, D, O) {
    const W = 0xffffff;
    if (O.sleeve === 'none') loft(b, [ring(-D.upper - 0.01, 0.052, 0.055, 0, W), ring(-0.15, 0.064, 0.066, 0, W), ring(0, 0.075, 0.075, 0, W)], 10, { capBottom: true, uv: true });
    else if (O.sleeve !== 'long') loft(b, [ring(-D.upper - 0.01, 0.05, 0.053, 0, W), ring(-0.17, 0.06, 0.062, 0, W), ring(-0.12, 0.064, 0.066, 0, W)], 10, { capBottom: true, uv: true });
  }

  function buildUpperCloth(b, D, P, O) {
    const sleeve = O.sleeveCol || O.col;
    if (O.sleeve === 'none') {
      b.ellipsoid(0.08, 0.075, 0.08, 9, 5, P.skin);
      return;
    }
    b.ellipsoid(0.085, 0.08, 0.085, 9, 5, sleeve);
    if (O.sleeve === 'long') loft(b, [ring(-D.upper - 0.015, 0.066, 0.068, 0, sleeve), ring(-0.15, 0.076, 0.078, 0, sleeve), ring(0.03, 0.08, 0.082, 0, sleeve)], 10, { capBottom: true });
    else loft(b, [ring(-0.16, 0.08, 0.083, 0, sleeve), ring(-0.06, 0.084, 0.086, 0, sleeve), ring(0.03, 0.08, 0.082, 0, sleeve)], 10, { capBottom: true });
  }

  function buildForeSkin(b, D, O) {
    const W = 0xffffff;
    if (O.sleeve !== 'long') loft(b, [ring(-D.fore + 0.005, 0.036, 0.04, 0, W), ring(-0.17, 0.046, 0.05, 0, W), ring(0, 0.052, 0.054, 0, W)], 10, { capBottom: true, uv: true });
  }

  function buildForeCloth(b, D, P, O) {
    const long = O.sleeve === 'long';
    const col = O.sleeveCol || O.col;
    b.ellipsoid(0.055, 0.055, 0.055, 8, 5, long ? col : P.skin);
    if (!long) return;
    loft(b, [ring(-D.fore + 0.005, 0.042, 0.046, 0, col), ring(-0.17, 0.05, 0.054, 0, col), ring(0, 0.056, 0.058, 0, col)], 10, { capBottom: true });
    b.at(0, -D.fore + 0.03, 0, h => h.prism(10, 0.048, 0.05, -0.025, 0.046, 0.048, 0.02, shade(col, 0.78)));
  }

  function buildHand(b, P, side, grip) {
    const sk = P.skin;
    const inward = side === 'L' ? -1 : 1;
    b.at(0, -0.042, 0, h => h.box(0.03, 0.082, 0.08, sk));
    if (grip === 'fist') {
      b.at(inward * 0.014, -0.09, 0.004, h => h.box(0.05, 0.046, 0.076, sk));
    } else if (grip === 'point' || grip === 'horns') {
      b.at(inward * 0.014, -0.09, 0.004, h => h.box(0.048, 0.044, 0.074, sk));
      b.push(M4.translate(0, -0.1, 0.028));
      b.at(0, -0.035, 0, h => h.box(0.02, 0.07, 0.018, sk));
      b.pop();
      if (grip === 'horns') {
        b.push(M4.translate(0, -0.1, -0.03));
        b.at(0, -0.03, 0, h => h.box(0.018, 0.06, 0.016, sk));
        b.pop();
      }
    } else if (grip === 'hold') {
      b.push(M4.translate(inward * 0.02, -0.088, 0), M4.rotZ(inward * 0.9));
      b.at(0, -0.024, 0, h => h.box(0.022, 0.05, 0.074, sk));
      b.pop();
    } else if (grip === 'spread') {
      [-0.027, -0.009, 0.009, 0.027].forEach((z, i) => {
        b.push(M4.translate(0, -0.082, z), M4.rotX((i - 1.5) * 0.18));
        b.at(0, -0.035, 0, h => h.box(0.018, 0.07, 0.015, sk));
        b.pop();
      });
    } else {
      b.at(0, -0.106, 0, h => h.box(0.024, 0.06, 0.074, sk));
      b.at(0, -0.14, 0, h => h.box(0.02, 0.022, 0.066, shade(sk, 0.97)));
    }
    b.push(M4.translate(inward * 0.012, -0.03, 0.046), M4.rotX(grip === 'fist' ? -0.2 : -0.55));
    b.at(0, -0.024, 0, h => h.box(0.021, 0.048, 0.021, sk));
    b.pop();
  }

  function buildNecklace(b, rings) {
    const top = rings[rings.length - 1];
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const a = -PI * 0.75 + (PI * 1.5 * i) / 14;
      const drop = Math.max(0, C(a)) * 0.11;
      pts.push([S(a) * top[1] * 1.05, top[0] - 0.01 - drop, top[3] + C(a) * top[2] * 1.18 + Math.max(0, C(a)) * 0.03]);
    }
    tube(b, pts, pts.map(() => 0.004), 4, 0x2a2420);
    b.at(0, top[0] - 0.13, top[3] + top[2] * 1.18 + 0.03, h => h.box(0.025, 0.035, 0.012, 0x6a5a48));
  }

  const GRIPS = ['open', 'fist', 'point', 'horns', 'hold', 'spread'];

  function buildPerson(r, who, cache) {
    const P = PEOPLE[who];
    const D = DIMS[P.body];
    const R = D.head;
    const faces = {};
    const out = {
      P, D,
      faceTex: (key) => {
        if (!faces[key]) faces[key] = r.texture(256, drawFace(P, key), { clamp: true });
        return faces[key];
      },
      head: mesh(r, b => buildHead(b, P, R)),
      beard: P.full ? mesh(r, b => buildBeard(b, P, R)) : null,
      face: mesh(r, b => headPatch(b, P, R, FACE.Y0, FACE.Y1, FACE.P0, FACE.P1, 16, 14, 1.006, [1, 1, 1, 0], (y, p) => [(y - FACE.Y0) / (FACE.Y1 - FACE.Y0), (p - FACE.P0) / (FACE.P1 - FACE.P0)])),
      hair: {},
      glasses: P.glasses ? mesh(r, b => buildGlasses(b, P, R)) : null,
      neck: mesh(r, b => loft(b, [ring(-0.07, P.body === 'heavy' ? 0.11 : 0.085, P.body === 'heavy' ? 0.105 : 0.08, 0.012, P.skin), ring(0.1, 0.082, 0.078, 0.022, P.skin)], 10)),
      hands: {},
      outfits: {},
      hats: {}
    };
    out.hairFor = (style) => {
      if (!out.hair[style]) out.hair[style] = mesh(r, b => buildHair(b, P, R, style));
      return out.hair[style];
    };
    out.hatFor = (kind) => {
      if (!out.hats[kind]) out.hats[kind] = mesh(r, b => (kind === 'cap' ? buildCap : kind === 'beanie' ? buildBeanie : buildSanta)(b, P, R));
      return out.hats[kind];
    };
    out.handFor = (side, grip) => {
      const key = side + grip;
      if (!out.hands[key]) out.hands[key] = mesh(r, b => buildHand(b, P, side, grip));
      return out.hands[key];
    };
    out.outfitFor = (name) => {
      if (out.outfits[name]) return out.outfits[name];
      const O = P.outfits[name];
      const girth = O.girth || P.girth;
      const big = girth ? scaleRings(RINGS[P.body], girth[0], girth[1]) : RINGS[P.body];
      const rings = O.top === 'skin' ? scaleRings(big, 1, 1.04) : O.top === 'puffer' ? scaleRings(big, 1.08, 1.1) : O.top === 'hoodie' || O.top === 'leather' || O.top === 'zip' || O.top === 'jacket' || O.top === 'vest' ? scaleRings(big, 1.04, 1.06) : big;
      const tex = cache(`${who}:${name}:top`, () => r.texture(512, topTex(P, O), { clamp: true }));
      const upperTex = cache(`${who}:${name}:upper`, () => r.texture(64, armTex(P, O, 'upper'), { clamp: true }));
      const foreTex = cache(`${who}:${name}:fore`, () => r.texture(64, armTex(P, O, 'fore'), { clamp: true }));
      out.outfits[name] = {
        O, rings, tex, upperTex, foreTex,
        torso: mesh(r, b => buildTorso(b, rings)),
        extras: mesh(r, b => buildTorsoExtras(b, rings, O)),
        bra: O.bra ? mesh(r, b => buildBra(b, rings)) : null,
        necklace: P.necklace ? mesh(r, b => buildNecklace(b, rings)) : null,
        pelvis: mesh(r, b => buildPelvis(b, P, O)),
        thigh: mesh(r, b => buildThigh(b, D, P, O)),
        shin: mesh(r, b => buildShin(b, D, P, O)),
        foot: mesh(r, b => buildFoot(b, P, O)),
        upperSkin: mesh(r, b => buildUpperSkin(b, D, O)),
        upperCloth: mesh(r, b => buildUpperCloth(b, D, P, O)),
        foreSkin: mesh(r, b => buildForeSkin(b, D, O)),
        foreCloth: mesh(r, b => buildForeCloth(b, D, P, O))
      };
      return out.outfits[name];
    };
    return out;
  }

  function build(r) {
    const people = {};
    const shared = {};
    const cache = (key, fn) => {
      if (!shared[key]) shared[key] = fn();
      return shared[key];
    };
    return {
      get(who) {
        if (!people[who]) people[who] = buildPerson(r, who, cache);
        return people[who];
      }
    };
  }

  function outfitOf(who, pose) {
    const P = PEOPLE[who];
    return pose.outfit && P.outfits[pose.outfit] ? pose.outfit : Object.keys(P.outfits)[0];
  }

  function solve(who, pose) {
    return Rig.solve(pose, DIMS[PEOPLE[who].body]);
  }

  function draw(r, V, who, m, pose, opts) {
    const o = opts || {};
    const person = V.get(who);
    const P = person.P;
    const name = outfitOf(who, pose);
    const F = person.outfitFor(name);
    const O = F.O;
    const pass = (extra) => Object.assign({}, o.tint ? { tint: o.tint } : {}, o.flat ? { flat: o.flat, alpha: o.alpha } : {}, extra || {});
    const top = o.part !== 'rest', rest = o.part !== 'top';
    if (top) {
      r.draw(F.torso, m.chest, pass({ texture: F.tex }));
      r.draw(F.extras, m.chest, pass());
      ['L', 'R'].forEach(s => { if (!pose['hide' + s]) r.draw(F.upperCloth, m['upper' + s], pass()); });
    }
    if (!rest) return;
    r.draw(F.pelvis, m.pelvis, pass());
    if (F.bra) r.draw(F.bra, m.chest, pass());
    if (F.necklace) r.draw(F.necklace, m.chest, pass());
    r.draw(person.neck, m.neck, pass());
    if (!o.noHead) {
      const hm = m.head;
      r.draw(person.head, hm, pass());
      if (person.beard) r.draw(person.beard, hm, pass());
      if (!o.flat) r.draw(person.face, hm, pass({ texture: person.faceTex(faceKey(pose)) }));
      const hat = pose.hat === undefined ? O.hat : pose.hat;
      const style = pose.hair || P.style;
      if (!(hat === 'santa' || hat === 'beanie')) r.draw(person.hairFor(style), hm, pass());
      if (hat) r.draw(person.hatFor(hat), hm, pass());
      if (person.glasses && pose.glasses !== false) r.draw(person.glasses, hm, pass());
    }
    ['L', 'R'].forEach(s => {
      if (!pose['hide' + s]) {
        r.draw(F.upperSkin, m['upper' + s], pass({ texture: F.upperTex }));
        r.draw(F.foreSkin, m['fore' + s], pass({ texture: F.foreTex }));
        r.draw(F.foreCloth, m['fore' + s], pass());
        const grip = GRIPS.includes(pose['g' + s]) ? pose['g' + s] : 'open';
        r.draw(person.handFor(s, grip), m['hand' + s], pass());
      }
      if (!pose.noLegs) {
        r.draw(F.thigh, m['thigh' + s], pass());
        r.draw(F.shin, m['shin' + s], pass());
        r.draw(F.foot, m['foot' + s], pass());
      }
    });
  }

  function handPoint(m, side, local) {
    return M4.point(m['hand' + side], local || [0, -0.09, 0.0]);
  }

  window.StsCast = { DIMS, PEOPLE, EYES, BROWS, MOUTHS, GAZES, build, solve, draw, faceKey, outfitOf, headPt, handPoint };
})();
