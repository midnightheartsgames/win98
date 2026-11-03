(function () {
  const { M4, V3, rgb } = window.P3D;
  const Cast = window.P3DCccCast;
  const { R, HER, HIM, NECK_TOP, headPoint, sideLocks, backHair, band } = Cast;

  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const NB = [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]];

  Object.assign(Cast.PEOPLE, {
    haruhi: { skin: 0xfbe4d2, iris: ['#3a1806', '#9c5a26', '#eaae60'], lash: '#2a1610', brow: '#4a2a1c', lip: '#d8787a', mouth: '#8a2e3a', shape: 'sharp', eyeScale: 1.16 },
    yuki: { skin: 0xfae8dc, iris: ['#3a2410', '#8e6434', '#d2a666'], lash: '#2a2632', brow: '#6a6478', lip: '#d08a88', mouth: '#8a3a44', shape: 'round', eyeScale: 1.12 },
    mizuki: { skin: 0xf8e0cc, iris: ['#2a160c', '#6e4428', '#b07a50'], lash: '#2a1a12', brow: '#3e2a1e', lip: '#c87a74', mouth: '#7e3436', shape: 'soft', eyeScale: 1.0 },
    mai: { skin: 0xfae2d0, iris: ['#3a1c0c', '#8a4e2a', '#cc8a58'], lash: '#3a2016', brow: '#7a4430', lip: '#d07c78', mouth: '#86343a', shape: 'soft', eyeScale: 1.08 },
    kyon: { skin: 0xf4d8c2, iris: ['#2a1608', '#6a4224', '#a8784c'], lash: '#2a1a12', brow: '#4a3020', lip: '#c07a6a', mouth: '#7a3a34', shape: 'soft', eyeScale: 0.92 }
  });

  Object.assign(Cast.HAIR, {
    haruhi: { mid: 0x5c3b2c, hi: 0x7e5642, dark: 0x3a251c },
    yuki: { mid: 0x7f7b93, hi: 0xa4a0b8, dark: 0x58546c },
    mizuki: { mid: 0x4c3326, hi: 0x6c4a36, dark: 0x30211a },
    mai: { mid: 0x9c5a3a, hi: 0xc07a52, dark: 0x6c3a24 },
    kyon: { mid: 0x6a4632, hi: 0x8c6248, dark: 0x46301f },
    stuTail: { mid: 0x6a4430, hi: 0x8a5e46, dark: 0x442c1e },
    stuLong: { mid: 0x2a2228, hi: 0x463c46, dark: 0x181418 },
    stuBob: { mid: 0x7a4c32, hi: 0x9a6a4a, dark: 0x523222 }
  });

  function ponytail(b, H) {
    const p = headPoint(PI, 0.15, 1.12);
    b.push(M4.translate(p[0], p[1], p[2]), M4.rotX(0.35));
    b.prism(8, 0.03, 0.03, -0.02, 0.032, 0.032, 0.02, 0xe0407a, { capTop: false });
    b.prism(8, 0.045, 0.04, -0.3, 0.028, 0.028, -0.02, H.mid, { capBottom: true, capTop: false });
    b.pop();
  }

  Object.assign(Cast.SHELLS, {
    haruhi: {
      low: (y) => lerp(lerp(0.2 + (Math.abs(y) < 0.14 ? 0.07 : 0), -0.74, band(y, 0.5, 1.0)), -0.9, band(y, 1.7, 2.4)),
      tip: (y) => (Math.abs(y) < 0.55 ? 0.15 : 0.12), k: 1.1, flare: 0.13,
      extra: (head, back, H) => {
        sideLocks(head, H, 0.98, 0.19, 0.06, false);
        backHair(back, H, 0.2, 0.28, false, 0.22);
      }
    },
    yuki: {
      low: (y) => lerp(lerp(0.12, -0.5, band(y, 0.55, 1.0)), -0.78, band(y, 1.6, 2.4)),
      tip: () => 0.07, k: 1.08, flare: 0.1,
      extra: (head, back, H) => sideLocks(head, H, 0.98, 0.12, 0.05, false)
    },
    mizuki: {
      low: (y) => lerp(lerp(0.26, -0.3, band(y, 0.5, 1.1)), -0.72, band(y, 1.7, 2.5)),
      tip: () => 0.11, k: 1.09, flare: 0.14
    },
    mai: {
      low: (y) => lerp(lerp(0.2, -0.55, band(y, 0.5, 1.0)), -0.85, band(y, 1.6, 2.4)),
      tip: () => 0.11, k: 1.09, flare: 0.2,
      extra: (head, back, H) => sideLocks(head, H, 0.95, 0.22, 0.055, false)
    },
    kyon: {
      low: (y) => lerp(lerp(0.3, -0.28, band(y, 0.5, 1.2)), -0.74, band(y, 1.7, 2.5)),
      tip: () => 0.16, k: 1.11, flare: 0.2
    },
    stuTail: {
      low: (y) => lerp(lerp(0.2, -0.45, band(y, 0.5, 1.0)), -0.6, band(y, 1.6, 2.4)),
      tip: () => 0.08, k: 1.08, flare: 0.06,
      extra: (head, back, H) => ponytail(head, H)
    },
    stuLong: {
      low: (y) => lerp(lerp(0.16, -0.95, band(y, 0.62, 0.74)), -0.95, band(y, 1.5, 2.2)),
      tip: () => 0.05, k: 1.08, flare: 0.05,
      extra: (head, back, H) => {
        sideLocks(head, H, 0.86, 0.36, 0.05, false);
        backHair(back, H, 0.62, 0.27, false, 0.1);
      }
    },
    stuBob: {
      low: (y) => lerp(lerp(0.18, -0.62, band(y, 0.5, 1.0)), -0.8, band(y, 1.6, 2.4)),
      tip: () => 0.09, k: 1.09, flare: 0.16
    }
  });

  function earLeaf(b, s) {
    const segs = [[0, 0.026, 0], [0.11, 0.04, s * 0.004], [0.2, 0.038, s * 0.04], [0.28, 0.004, s * 0.1]];
    for (let i = 0; i < segs.length - 1; i++) {
      const [y0, w0, x0] = segs[i];
      const [y1, w1, x1] = segs[i + 1];
      const z0 = -0.004 - 0.012 * (y0 / 0.28), z1 = -0.004 - 0.012 * (y1 / 0.28);
      b.quad([x0 - w0, y0, z0 - 0.006], [x0 + w0, y0, z0 - 0.006], [x1 + w1, y1, z1 - 0.006], [x1 - w1, y1, z1 - 0.006], 0x3a3036, null, NB);
      b.quad([x0 + w0 * 0.62, y0 + 0.01, z0 + 0.002], [x0 - w0 * 0.62, y0 + 0.01, z0 + 0.002], [x1 - w1 * 0.6, y1, z1 + 0.002], [x1 + w1 * 0.6, y1, z1 + 0.002], 0x5a4a54, null, NZ);
      b.quad([x0 + w0, y0, z0 - 0.002], [x0 - w0, y0, z0 - 0.002], [x1 - w1, y1, z1 - 0.002], [x1 + w1, y1, z1 - 0.002], 0x463a42, null, NZ);
    }
  }

  function bunnyEars(b) {
    [-1, 1].forEach(s => {
      const base = headPoint(s * 0.4, 1.0, 1.13);
      b.push(M4.translate(base[0], base[1], base[2]), M4.rotZ(-s * 0.22), M4.rotX(-0.1));
      b.box(0.05, 0.03, 0.022, 0x3a3036);
      earLeaf(b, s);
      b.pop();
    });
  }

  const BAND_Y = 0xe8b030, BAND_D = 0xc08820;

  function bandPoint(th, k) {
    const rx = R * 0.88 * k, ry = R * 0.94 * k, rz = R * 0.9 * k;
    return [S(th) * rx, C(th) * ry * 0.93, C(th) * rz * 0.36 - 0.006];
  }

  function headband(b) {
    const n = 16, w = 0.012;
    for (let i = 0; i < n; i++) {
      const a = -1.62 + (3.24 * i) / n, c = -1.62 + (3.24 * (i + 1)) / n;
      const pa = bandPoint(a, 1.15), pc = bandPoint(c, 1.15);
      const up = [0, -0.35, 0.94];
      const off = (p, k) => [p[0] + up[0] * w * k, p[1] + up[1] * w * k, p[2] + up[2] * w * k];
      const na = V3.norm(pa), nc = V3.norm(pc);
      b.quad(off(pa, -1), off(pc, -1), off(pc, 1), off(pa, 1), i % 4 === 1 ? BAND_D : BAND_Y, null, [na, nc, nc, na]);
    }
    [-1, 1].forEach(s => {
      const p = bandPoint(s * 1.62, 1.15);
      b.push(M4.translate(p[0] + s * 0.004, p[1] - 0.012, p[2]), M4.rotY(s * PI / 2));
      [-1, 1].forEach(k => b.at(k * 0.018, 0.005, 0, (h) => h.ellipsoid(0.019, 0.012, 0.005, 8, 4, BAND_Y)));
      b.ellipsoid(0.008, 0.009, 0.007, 6, 4, BAND_D);
      [[-0.008, 0.14], [0.01, -0.12]].forEach(([x, tilt]) => {
        b.push(M4.translate(x, -0.006, 0.002), M4.rotZ(tilt));
        b.quad([-0.006, 0, 0], [0.006, 0, 0], [0.007, -0.1, 0.008], [-0.005, -0.1, 0.008], BAND_Y, null, NZ);
        b.quad([0.006, 0, -0.002], [-0.006, 0, -0.002], [-0.005, -0.1, 0.006], [0.007, -0.1, 0.006], BAND_D, null, NB);
        b.pop();
      });
      b.pop();
    });
  }

  const HAT = 0x463e50, HAT_DARK = 0x2a2532;

  function witchHat(b) {
    b.push(M4.translate(0, R * 0.6, -0.008), M4.rotX(0.12));
    const n = 22, r0 = 0.118, r1 = 0.33;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const d0 = 0.035 + 0.018 * S(a0 * 3 + 0.6), d1 = 0.035 + 0.018 * S(a1 * 3 + 0.6);
      const nm = [0, 1, 0];
      b.quad([S(a0) * r0, 0, C(a0) * r0], [S(a1) * r0, 0, C(a1) * r0], [S(a1) * r1, -d1, C(a1) * r1], [S(a0) * r1, -d0, C(a0) * r1], i % 3 ? HAT : HAT_DARK, null, [nm, nm, nm, nm]);
    }
    b.prism(14, r0 + 0.004, r0 + 0.004, -0.004, r0 * 0.96, r0 * 0.96, 0.03, HAT_DARK, { capTop: false });
    const segs = [[0.11, 0.118, 0.094, 0.06], [0.1, 0.094, 0.066, 0.3], [0.09, 0.066, 0.038, 0.42], [0.08, 0.038, 0.004, 0.55]];
    let pushes = 0;
    segs.forEach(([h, ra, rb, tilt]) => {
      b.push(M4.rotX(-tilt));
      b.prism(12, ra, ra, 0, rb, rb, h, HAT, { capTop: rb < 0.01 });
      b.push(M4.translate(0, h - 0.004, 0));
      pushes += 2;
    });
    for (let i = 0; i < pushes; i++) b.pop();
    b.pop();
  }

  function cloak(col, inner) {
    return (b) => {
      const n = 14, skip = [0, 1, 12, 13];
      b.prism(n, 0.36, 0.3, -0.86, 0.205, 0.135, 0.385, col, { capTop: false, skip });
      b.prism(n, 0.352, 0.292, -0.855, 0.198, 0.128, 0.38, inner, { capTop: false, skip });
      b.prism(n, 0.205, 0.135, 0.385, 0.075, 0.068, 0.47, col, { capTop: false, skip: [0, 13] });
      b.prism(n, 0.084, 0.076, 0.44, 0.118, 0.108, 0.62, col, { capTop: false, skip: [0, 1, 12, 13] });
      b.prism(n, 0.08, 0.072, 0.44, 0.112, 0.102, 0.615, inner, { capTop: false, skip: [0, 1, 12, 13] });
      [-1, 1].forEach(s => b.at(s * 0.024, 0.43, 0.07, (h) => h.ellipsoid(0.024, 0.015, 0.008, 8, 4, 0x221e28)));
      b.at(0, 0.43, 0.074, (h) => h.ellipsoid(0.01, 0.011, 0.008, 6, 4, 0x18151c));
      [-1, 1].forEach(s => b.quad([s * 0.004, 0.425, 0.076], [s * 0.016, 0.425, 0.076], [s * 0.03, 0.36, 0.09], [s * 0.016, 0.36, 0.09], 0x221e28, null, NZ));
    };
  }

  const UNI_WHITE = 0xf3f2ee, UNI_BLUE = 0x86aed0, UNI_STRIPE = 0x8a2a3c, UNI_RIBBON = 0xb0303e, UNI_SKIRT = 0x63809f, UNI_SOCK = 0x2a3448;

  function sailor(b, d) {
    const top = d.torso + 0.01;
    [-1, 1].forEach(s => {
      const neck = [s * 0.034, top, 0.058], shoulder = [s * 0.138, top - 0.03, 0.02], tip = [0, 0.215, 0.114];
      b.tri([0, top - 0.004, 0.064], neck, tip, UNI_BLUE, null, [[0, 0.3, 1], [0, 0.3, 1], [0, 0.3, 1]]);
      b.tri(neck, shoulder, tip, UNI_BLUE, null, [[s * 0.3, 0.4, 1], [s * 0.3, 0.4, 1], [s * 0.3, 0.4, 1]]);
      const e0 = [s * 0.126, top - 0.03, 0.03], e1 = [s * 0.012, 0.228, 0.117];
      b.quad([e0[0], e0[1], e0[2] + 0.003], [e0[0] - s * 0.012, e0[1] + 0.004, e0[2] + 0.004], [e1[0] - s * 0.006, e1[1] + 0.01, e1[2] + 0.002], [e1[0], e1[1], e1[2] + 0.002], UNI_STRIPE, null, NZ);
      b.quad([s * 0.17, top - 0.04, 0.0], [s * 0.15, top - 0.03, 0.04], [s * 0.12, top - 0.03, -0.12], [s * 0.15, top - 0.05, -0.11], UNI_BLUE);
    });
    b.quad([0.13, top - 0.02, -d.depth * 0.9], [-0.13, top - 0.02, -d.depth * 0.9], [-0.125, 0.24, -d.depth * 1.08], [0.125, 0.24, -d.depth * 1.08], UNI_BLUE, null, NB);
    b.quad([0.112, top - 0.035, -d.depth * 0.93], [-0.112, top - 0.035, -d.depth * 0.93], [-0.108, 0.255, -d.depth * 1.1], [0.108, 0.255, -d.depth * 1.1], UNI_STRIPE, null, NB);
    b.quad([0.1, top - 0.045, -d.depth * 0.95], [-0.1, top - 0.045, -d.depth * 0.95], [-0.096, 0.265, -d.depth * 1.12], [0.096, 0.265, -d.depth * 1.12], UNI_BLUE, null, NB);
    [-1, 1].forEach(s => b.at(s * 0.022, 0.232, 0.124, (h) => h.ellipsoid(0.022, 0.013, 0.008, 8, 4, UNI_RIBBON)));
    b.at(0, 0.232, 0.127, (h) => h.ellipsoid(0.009, 0.011, 0.008, 6, 4, shade(UNI_RIBBON, 0.8)));
    [-1, 1].forEach(s => b.quad([s * 0.004, 0.226, 0.128], [s * 0.016, 0.226, 0.128], [s * 0.026, 0.15, 0.124], [s * 0.012, 0.15, 0.124], UNI_RIBBON, null, NZ));
  }

  function shade(c, k) {
    const v = rgb(c);
    return [Math.min(1, v[0] * k), Math.min(1, v[1] * k), Math.min(1, v[2] * k), v[3]];
  }

  const ring = (y, r, h, col) => (b) => b.prism(12, r, r, y - h / 2, r, r, y + h / 2, col, { capTop: false });
  const cuffStripes = [ring(-0.183, 0.0315, 0.004, UNI_STRIPE), ring(-0.197, 0.0315, 0.004, UNI_STRIPE)];

  function uniform(person, skin, hair, extra) {
    return Object.assign({
      person, skin, hair, bust: 0.45,
      torso: { body: UNI_WHITE },
      torsoExtras: [sailor],
      hips: UNI_SKIRT,
      skirt: { type: 'pleat', col: UNI_SKIRT, dark: shade(UNI_SKIRT, 0.82) },
      arm: { upper: [[0, 1, UNI_WHITE]], fore: [[0, 0.16, UNI_BLUE], [0.16, 1, UNI_WHITE]], foreExtras: cuffStripes },
      leg: { thigh: [[0, 1, skin]], shin: [[0, 0.82, UNI_SOCK], [0.82, 1, skin]], shoe: { type: 'sneaker', col: 0xeceef2, sole: 0xc0c4cc } }
    }, extra || {});
  }

  const BLAZER = 0x2c4250, TROUSER = 0x4a5262, SHIRT = 0xf2f2ee, TIE = 0xa02a34;

  function blazerFront(b, d) {
    const top = d.torso - 0.01;
    b.tri([-0.05, top, 0.086], [0.05, top, 0.086], [0, 0.2, 0.124], SHIRT, null, [[0, 0.2, 1], [0, 0.2, 1], [0, 0.2, 1]]);
    b.quad([-0.011, top - 0.03, 0.094], [0.011, top - 0.03, 0.094], [0.016, 0.17, 0.128], [-0.014, 0.17, 0.128], TIE, null, NZ);
    b.at(0, top - 0.02, 0.092, (h) => h.box(0.026, 0.02, 0.01, shade(TIE, 0.8)));
    [-1, 1].forEach(s => {
      b.quad([s * 0.05, top, 0.088], [s * 0.085, top - 0.015, 0.075], [s * 0.02, 0.19, 0.127], [s * 0.004, 0.2, 0.126], shade(BLAZER, 0.78), null, NZ);
      b.quad([s * 0.04, top + 0.03, 0.04], [s * 0.065, top + 0.03, 0.0], [s * 0.05, top - 0.01, 0.02], [s * 0.03, top - 0.01, 0.07], SHIRT);
    });
    [0.12, 0.06].forEach(y => b.at(0.018, y, 0.124, (h) => h.ellipsoid(0.007, 0.007, 0.004, 6, 3, 0xc8b070)));
  }

  function student(person, skin, hair, extra) {
    return Object.assign({
      person, body: 'him', skin, hair,
      torso: { body: BLAZER },
      torsoExtras: [blazerFront],
      hips: TROUSER,
      arm: { upper: [[0, 1, BLAZER]], fore: [[0, 0.08, SHIRT], [0.08, 1, BLAZER]] },
      leg: { thigh: [[0, 1, TROUSER]], shin: [[0, 1, TROUSER]], shoe: { type: 'sneaker', col: 0x5a3a28, sole: 0x3a2418 } }
    }, extra || {});
  }

  const HARUHI_SKIN = 0xfbe4d2, LEO = 0x1c1820, TIGHTS = 0x3e3034;

  function bunnyCollar(b, d) {
    b.prism(12, 0.04, 0.038, NECK_TOP - 0.05, 0.039, 0.037, NECK_TOP - 0.02, 0xfafafa, { capTop: false });
    [-1, 1].forEach(s => b.at(s * 0.019, NECK_TOP - 0.042, 0.04, (h) => h.ellipsoid(0.02, 0.012, 0.007, 8, 4, 0x16141a)));
    b.at(0, NECK_TOP - 0.042, 0.044, (h) => h.ellipsoid(0.008, 0.009, 0.007, 6, 4, 0x0e0c10));
    b.prism(12, d.chest * 1.035, d.depth * 1.02, 0.315, d.chest * 1.03, d.depth * 0.9, 0.33, 0x2a242e, { capTop: false });
  }

  function strap(col) {
    return (b, d) => {
      const pts = [[0.13, d.torso * 0.94, 0.0], [0.07, 0.32, 0.112], [-0.04, 0.16, 0.122], [-0.13, 0.02, 0.1]];
      for (let i = 0; i < pts.length - 1; i++) {
        const p = pts[i], q = pts[i + 1];
        b.quad([p[0] - 0.018, p[1] - 0.012, p[2] + 0.006], [p[0] + 0.018, p[1] + 0.012, p[2] + 0.006], [q[0] + 0.018, q[1] + 0.012, q[2] + 0.006], [q[0] - 0.018, q[1] - 0.012, q[2] + 0.006], col, null, NZ);
      }
      b.quad([0.15, d.torso * 0.94, 0.0], [0.11, d.torso * 0.94, 0.02], [0.1, 0.25, -0.11], [0.14, 0.25, -0.1], col);
    };
  }

  const apron = (b, d) => {
    b.quad([-0.085, 0.3, 0.112], [0.085, 0.3, 0.112], [0.15, -0.3, 0.16], [-0.15, -0.3, 0.16], 0xe0703a, null, NZ);
    [-1, 1].forEach(s => b.quad([s * 0.08, 0.3, 0.11], [s * 0.095, 0.3, 0.11], [s * 0.06, d.torso + 0.02, 0.04], [s * 0.045, d.torso + 0.02, 0.05], 0xe0703a, null, NZ));
  };

  const FORMS = {
    haruhiBunny: {
      person: 'haruhi', skin: HARUHI_SKIN, hair: 'haruhi', bust: 0.85,
      torso: { waist: LEO, chest: LEO, top: HARUHI_SKIN, shoulder: HARUHI_SKIN, neck: HARUHI_SKIN },
      torsoExtras: [bunnyCollar, strap(0x3a2620)],
      hips: LEO,
      hipExtras: [(b) => b.at(0, -0.03, -0.112, (h) => h.ellipsoid(0.048, 0.046, 0.042, 8, 5, 0xfafafa))],
      arm: { upper: [[0, 1, HARUHI_SKIN]], fore: [[0, 0.2, 0xfafafa], [0.2, 1, HARUHI_SKIN]], foreExtras: [ring(-0.17, 0.034, 0.008, 0x16141a)] },
      leg: { thigh: [[0, 1, TIGHTS]], shin: [[0, 1, TIGHTS]], shoe: { type: 'heel', col: 0x141216, sole: 0x141216 } },
      gear: [bunnyEars, headband]
    },
    yukiWitch: uniform('yuki', 0xfae8dc, 'yuki', {
      bust: 0.3, scale: 0.97,
      torsoExtras: [sailor, cloak(0x48424f, 0x2a2630), strap(0x2a2630)],
      gear: [witchHat]
    }),
    mizukiBass: uniform('mizuki', 0xf8e0cc, 'mizuki', { scale: 1.0, torsoExtras: [sailor, strap(0x202024)] }),
    maiDrums: uniform('mai', 0xfae2d0, 'mai', { scale: 1.04 }),
    kyon: student('kyon', 0xf4d8c2, 'kyon'),
    capeBoy: student('crowd', 0xf0d4bc, 'stuBob', { torsoExtras: [blazerFront, cloak(0x6e6e74, 0x4a4a50)] }),
    boyBlack: student('crowd', 0xf2d4bc, 'black'),
    boyBrown: student('crowd', 0xeccaae, 'brown'),
    boyBob: student('crowd', 0xf0d0b8, 'stuBob', { scale: 0.97 }),
    girlTail: uniform('crowd', 0xf8e2d0, 'stuTail', { scale: 0.96 }),
    girlLong: uniform('crowd', 0xfae6d6, 'stuLong', { scale: 0.95 }),
    girlBob: uniform('crowd', 0xf6dcc8, 'stuBob', { scale: 0.94 }),
    stallGirl: uniform('crowd', 0xf8e2d0, 'stuTail', { scale: 0.95, torsoExtras: [sailor, apron] }),
    stallLong: uniform('crowd', 0xfae6d6, 'stuLong', { scale: 0.94, torsoExtras: [sailor, apron] }),
    teacher: {
      person: 'crowd', body: 'him', skin: 0xeccab0, hair: 'black', glasses: 0x2a2a2a,
      torso: { body: 0xf0f0ee, chest: 0xb03030 },
      torsoExtras: [(b) => b.quad([-0.02, 0.44, 0.09], [0.02, 0.44, 0.09], [0.012, 0.2, 0.124], [-0.012, 0.2, 0.124], 0x30406a, null, NZ)],
      hips: 0x5a5a62,
      arm: { upper: [[0, 1, 0xf0f0ee]], fore: [[0, 1, 0xf0f0ee]] },
      leg: { thigh: [[0, 1, 0x5a5a62]], shin: [[0, 1, 0x5a5a62]], shoe: { type: 'sneaker', col: 0x2a2a2a, sole: 0x1a1a1a } }
    }
  };
  Object.assign(Cast.FORMS, FORMS);

  function slab(b, cx, cy, rx, ry, z0, z1, top, side, n) {
    const k = n || 16;
    const pt = (i) => { const a = (i / k) * PI * 2; return [cx + C(a) * rx, cy + S(a) * ry, a]; };
    for (let i = 0; i < k; i++) {
      const p = pt(i), q = pt(i + 1);
      b.tri([cx, cy, z1], [p[0], p[1], z1], [q[0], q[1], z1], top, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      b.tri([cx, cy, z0], [q[0], q[1], z0], [p[0], p[1], z0], side, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1]]);
      const np = [C(p[2]), S(p[2]), 0], nq = [C(q[2]), S(q[2]), 0];
      b.quad([p[0], p[1], z0], [q[0], q[1], z0], [q[0], q[1], z1], [p[0], p[1], z1], side, null, [np, nq, nq, np]);
    }
  }

  function flat(b, cx, cy, rx, ry, z, col, n) {
    const k = n || 16;
    for (let i = 0; i < k; i++) {
      const a0 = (i / k) * PI * 2, a1 = ((i + 1) / k) * PI * 2;
      b.tri([cx, cy, z], [cx + C(a0) * rx, cy + S(a0) * ry, z], [cx + C(a1) * rx, cy + S(a1) * ry, z], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
  }

  function neckAndHead(b, o) {
    const x0 = o.neck0, x1 = o.neck1;
    b.at((x0 + x1) / 2, 0, 0.024, (h) => h.box(x1 - x0, 0.05, 0.022, o.neckCol));
    b.at((x0 + x1) / 2, 0, 0.0365, (h) => h.box(x1 - x0, 0.046, 0.003, o.board));
    for (let x = x0 + 0.05; x < x1 - 0.02; x += 0.07) b.at(x, 0, 0.0385, (h) => h.box(0.008, 0.008, 0.001, 0xe8e4d8));
    b.push(M4.translate(x1, 0, 0.026), M4.rotY(0.18));
    b.at(o.headLen / 2, o.headOff || 0, 0, (h) => h.box(o.headLen, o.headW, 0.016, o.headCol));
    o.tuners.forEach(([x, y]) => b.at(x, y, -0.012, (h) => h.prism(6, 0.007, 0.007, -0.01, 0.007, 0.007, 0.01, 0xd8d8d0)));
    b.pop();
    for (let i = 0; i < o.strings; i++) {
      const y = (i - (o.strings - 1) / 2) * (0.036 / (o.strings - 1));
      b.quad([o.bridge, y - 0.0009, 0.041], [x1, y * 0.85 - 0.0009, 0.041], [x1, y * 0.85 + 0.0009, 0.041], [o.bridge, y + 0.0009, 0.041], [0.9, 0.9, 0.88, 0.5], null, NZ);
    }
  }

  function lesPaul(b, o) {
    slab(b, -0.07, 0, 0.165, 0.158, -0.026, 0.026, o.edge, o.edge, 18);
    slab(b, 0.085, 0.02, 0.112, 0.112, -0.026, 0.026, o.edge, o.edge, 16);
    flat(b, -0.07, 0, 0.14, 0.135, 0.0275, o.mid, 18);
    flat(b, 0.085, 0.02, 0.092, 0.092, 0.0275, o.mid, 16);
    flat(b, -0.06, 0.005, 0.085, 0.08, 0.029, o.center, 16);
    flat(b, 0.07, 0.015, 0.05, 0.05, 0.029, o.center, 12);
    if (o.guard) flat(b, 0.02, -0.07, o.guardR || 0.075, 0.042, 0.0305, o.guard, 12);
    [0.075, -0.015].forEach(x => b.at(x, 0, 0.033, (h) => h.box(0.03, 0.068, 0.008, o.pickup)));
    b.at(-0.075, 0, 0.033, (h) => h.box(0.014, 0.07, 0.008, 0xc8c8c0));
    b.at(-0.11, 0, 0.032, (h) => h.box(0.012, 0.06, 0.006, 0xc8c8c0));
    [[-0.12, -0.075], [-0.165, -0.06], [-0.135, -0.11], [-0.18, -0.095]].forEach(([x, y]) => b.at(x, y, 0.032, (h) => h.prism(8, 0.011, 0.011, -0.004, 0.01, 0.01, 0.006, 0xd8b048)));
    neckAndHead(b, { neck0: 0.15, neck1: 0.6, neckCol: o.neckCol || 0x5a2a16, board: 0x2a1810, headLen: 0.15, headW: 0.082, headCol: o.headCol, tuners: [[0.03, 0.05], [0.07, 0.05], [0.11, 0.05], [0.03, -0.05], [0.07, -0.05], [0.11, -0.05]], strings: 6, bridge: -0.11 });
  }

  function precisionBass(b) {
    const body = 0x1f7d72, dark = 0x14584f, guard = 0xf2f0ea;
    slab(b, -0.09, 0, 0.17, 0.16, -0.026, 0.026, body, dark, 18);
    slab(b, 0.06, 0.005, 0.13, 0.13, -0.026, 0.026, body, dark, 16);
    slab(b, 0.17, 0.085, 0.075, 0.045, -0.026, 0.026, body, dark, 12);
    slab(b, 0.14, -0.085, 0.065, 0.042, -0.026, 0.026, body, dark, 12);
    flat(b, -0.03, 0.035, 0.115, 0.085, 0.0275, guard, 14);
    flat(b, 0.07, 0.04, 0.07, 0.06, 0.0275, guard, 12);
    b.at(-0.0, -0.01, 0.031, (h) => h.box(0.03, 0.05, 0.007, 0x18181a));
    b.at(-0.13, 0, 0.031, (h) => h.box(0.03, 0.07, 0.008, 0xc8c8c0));
    [[-0.17, -0.09], [-0.12, -0.105]].forEach(([x, y]) => b.at(x, y, 0.031, (h) => h.prism(8, 0.012, 0.012, -0.004, 0.011, 0.011, 0.007, 0xc8c8c0)));
    neckAndHead(b, { neck0: 0.18, neck1: 0.8, neckCol: 0xd8b478, board: 0xc8a068, headLen: 0.17, headW: 0.07, headOff: 0.01, headCol: 0xd8b478, tuners: [[0.03, 0.045], [0.07, 0.045], [0.11, 0.045], [0.15, 0.045]], strings: 4, bridge: -0.13 });
  }

  Object.assign(Cast.PROPS, {
    gtrHaruhi: (b) => lesPaul(b, { edge: 0x4a1a0e, mid: 0x9a3e18, center: 0xd88a3a, guard: 0xeee6d2, pickup: 0x1a1a1a, headCol: 0x2a1610 }),
    gtrYuki: (b) => lesPaul(b, { edge: 0xd8d4ca, mid: 0xefece4, center: 0xf4f2ec, guard: 0x16141a, guardR: 0.11, pickup: 0x1a1a1a, headCol: 0xefece4, neckCol: 0x3a2418 }),
    bass: precisionBass,
    mic: (b) => {
      b.prism(8, 0.014, 0.014, -0.14, 0.019, 0.019, 0, 0x2a2a2e, { capBottom: true });
      b.at(0, 0.03, 0, (h) => h.ellipsoid(0.028, 0.032, 0.028, 10, 6, 0xb8bcc4));
    },
    stick: (b) => {
      b.prism(6, 0.007, 0.007, -0.06, 0.009, 0.009, 0.36, 0xd8b880, { capBottom: true });
      b.at(0, 0.365, 0, (h) => h.ellipsoid(0.01, 0.014, 0.01, 6, 4, 0xe8d0a0));
    },
    finger: (b) => b.at(0, -0.02, 0, (h) => h.box(0.016, 0.05, 0.016, 0xf4d8c2))
  });

  const RIGS = {
    gtrHaruhi: { at: [-0.04, -0.03, 0.15], rot: [-0.06, -0.22, 0.4], strum: [0.0, 0.03, 0.05], fret: [0.3, 0.54] },
    gtrYuki: { at: [-0.04, -0.02, 0.15], rot: [-0.06, -0.25, 0.48], strum: [0.0, 0.03, 0.05], fret: [0.3, 0.54] },
    bass: { at: [-0.02, -0.05, 0.15], rot: [-0.05, -0.2, 0.36], strum: [0.02, 0.03, 0.05], fret: [0.34, 0.62] }
  };

  function rigMatrix(id) {
    const g = RIGS[id];
    return M4.chain(M4.translate(g.at[0], g.at[1], g.at[2]), M4.rotX(g.rot[0]), M4.rotY(g.rot[1]), M4.rotZ(g.rot[2]));
  }

  function dimsOf(form) {
    const spec = Cast.FORMS[form];
    return spec && spec.body === 'him' ? HIM : HER;
  }

  function handAt(d, side, a) {
    const k = side === 'L' ? 1 : -1;
    const up = M4.chain(M4.translate(k * d.shoulder, d.torso * 0.9, 0), M4.rotY(k * a[1]), M4.rotZ(k * a[2]), M4.rotX(-a[0]));
    const fo = M4.chain(up, M4.translate(0, -d.upper, 0), M4.rotX(-a[3]));
    return { hand: M4.point(fo, [0, -d.fore - 0.035, 0.004]), elbow: M4.point(up, [0, -d.upper, 0]) };
  }

  const SEEDS = [[0.6, -0.4, 0.3, 1.2], [1.0, 0.2, 0.2, 1.5], [0.3, -0.9, 0.4, 1.8], [1.4, 0.5, 0.5, 0.9], [0.2, 0.3, 0.6, 0.6]];
  const ikCache = {};

  function ik(form, side, target, hint) {
    const key = form + side + target.map(v => v.toFixed(3)).join(',');
    if (ikCache[key]) return ikCache[key];
    const d = dimsOf(form);
    const k = side === 'L' ? 1 : -1;
    const cost = (a) => {
      const h = handAt(d, side, a);
      let c = V3.len(V3.sub(h.hand, target)) * 10;
      const e = h.elbow;
      if (Math.abs(e[0]) < d.chest * 0.9 && e[2] > -d.depth && e[2] < d.depth * 1.3 && e[1] < d.torso && e[1] > -0.1) c += 0.6;
      if (k * e[0] < d.shoulder * 0.7) c += 0.3 * (d.shoulder * 0.7 - k * e[0]) * 10;
      if (a[3] < 0 || a[3] > 2.6) c += 2;
      if (hint) c += 0.06 * V3.len(V3.sub(a.slice(0, 3), hint.slice(0, 3))) + 0.03 * Math.abs(a[3] - hint[3]);
      return c;
    };
    let best = null;
    (hint ? [hint].concat(SEEDS) : SEEDS).forEach(seed => {
      const a = seed.slice();
      let c = cost(a), step = 0.4;
      for (let it = 0; it < 90 && step > 0.002; it++) {
        let moved = false;
        for (let j = 0; j < 4; j++) {
          [step, -step].forEach(dv => {
            const b2 = a.slice();
            b2[j] += dv;
            const c2 = cost(b2);
            if (c2 < c) { c = c2; a[j] = b2[j]; moved = true; }
          });
        }
        if (!moved) step *= 0.5;
      }
      if (!best || c < best.c) best = { a, c };
    });
    ikCache[key] = best.a;
    return best.a;
  }

  function applyArm(p, side, a) {
    p['sh' + side] = [a[0], a[1], a[2]];
    p['el' + side] = [a[3], 0, 0];
    return p;
  }

  function mixArm(a, b2, w) {
    return a.map((v, i) => lerp(v, b2[i], w));
  }

  function rigPoint(id, local) {
    return M4.point(rigMatrix(id), local);
  }

  const FRET_STEPS = 6;
  const chains = {};

  function chainFor(form, id) {
    const key = form + ':' + id;
    if (chains[key]) return chains[key];
    const g = RIGS[id];
    const up = ik(form, 'R', rigPoint(id, [g.strum[0], g.strum[1] + 0.035, g.strum[2]]));
    const down = ik(form, 'R', rigPoint(id, [g.strum[0], g.strum[1] - 0.035, g.strum[2]]), up);
    const frets = [];
    for (let i = 0; i <= FRET_STEPS; i++) frets.push(ik(form, 'L', rigPoint(id, [lerp(g.fret[0], g.fret[1], i / FRET_STEPS), -0.012, 0]), frets[i - 1]));
    chains[key] = { up, down, frets };
    return chains[key];
  }

  function play(p, form, id, opts) {
    const g = RIGS[id];
    const o = opts || {};
    const ch = chainFor(form, id);
    const strum = clamp(o.strum === undefined ? 0.5 : o.strum, 0, 1);
    applyArm(p, 'R', mixArm(ch.down, ch.up, 0.5 + (strum - 0.5) * (o.range === undefined ? 1 : o.range)));
    const f = clamp(o.fret === undefined ? 0.3 : o.fret, 0, 1) * FRET_STEPS;
    const fi = Math.min(FRET_STEPS - 1, Math.floor(f));
    applyArm(p, 'L', mixArm(ch.frets[fi], ch.frets[fi + 1], f - fi));
    return { id, part: 'torso', at: g.at, rot: g.rot };
  }

  function reach(p, form, side, local, hint) {
    return applyArm(p, side, ik(form, side, local, hint));
  }

  function invRigid(m) {
    const sx = Math.hypot(m[0], m[1], m[2]);
    const k = 1 / (sx * sx);
    const r = [m[0] * k, m[4] * k, m[8] * k, 0, m[1] * k, m[5] * k, m[9] * k, 0, m[2] * k, m[6] * k, m[10] * k, 0, 0, 0, 0, 1];
    const t = [m[12], m[13], m[14]];
    r[12] = -(r[0] * t[0] + r[4] * t[1] + r[8] * t[2]);
    r[13] = -(r[1] * t[0] + r[5] * t[1] + r[9] * t[2]);
    r[14] = -(r[2] * t[0] + r[6] * t[1] + r[10] * t[2]);
    return new Float32Array(r);
  }

  window.P3DGodKnowsCast = { FORMS, RIGS, rigMatrix, rigPoint, ik, play, reach, applyArm, mixArm, invRigid, handAt, dimsOf };
})();
