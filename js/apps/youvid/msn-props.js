(function () {
  const { M4, V3, rgb } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, lerp, clamp } = K;

  const COL = {
    wood: 0x6c3a24, woodDk: 0x4a2618, metal: 0x34322f, metalHi: 0x4c4a46, scope: 0x5f5d46, scopeDk: 0x3f3e2f, cap: 0x1c1b19, lens: 0x0e1418,
    brass: 0xc9a14e, brassDk: 0x8a6a2a, blade: 0xbab6ae, bladeDk: 0x7a7670, handle: 0x4a3020, pommel: 0x8a8678, blood: 0x86201a,
    mug: 0xece9e2, coffee: 0x2a1a10, pot: 0x575b5c, potLid: 0xc0582a, glass: 0xd8dccc, liquid: 0xe2be3a, lid: 0xb8b4a8,
    suit: 0x7c7e86, suitDk: 0x5c5e66, shirtB: 0xe8e4dc, tie: 0xa8302c, skinB: 0xe2ab88, shoe: 0x2a2420, spring: 0x9a9a96,
    phone: 0x2a2826, cord: 0x1e1c1a, hook: 0x8a8882, box: 0xd2ccbe, boxDk: 0xaaa496,
    tray: 0x9a9890, trayDk: 0x6a6862, butt: 0xd8cbb0, brush: 0xe06878, bristle: 0xf2f0ea,
    van: 0xc9b08a, vanDk: 0x8c7656, tyre: 0x222020, chrome: 0xb8b8b0, glassDk: 0x2a3034, red: 0xb83026, rim: 0x6a6a66,
    wheel: 0x262422, wheelHi: 0x3a3836, shade: 0x3a3a3a, bulb: 0xfff2d0, clockRim: 0x8a7e7a
  };

  const METAL = { spec: [0.5, 24], rim: 0.6 };
  const WOOD = { spec: [0.22, 12], rim: 0.5 };
  const CERAMIC = { spec: [0.5, 30], rim: 0.6 };
  const PLASTIC = { spec: [0.3, 16], rim: 0.6 };

  function cyl(b, from, to, r, col, sides, opts) {
    const d = V3.sub(to, from);
    const len = V3.len(d);
    const y = V3.mul(d, 1 / len);
    let x = V3.cross(y, Math.abs(y[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0]);
    x = V3.norm(x);
    const z = V3.cross(x, y);
    const M = new Float32Array([x[0], x[1], x[2], 0, y[0], y[1], y[2], 0, z[0], z[1], z[2], 0, from[0], from[1], from[2], 1]);
    b.push(M);
    const r0 = Array.isArray(r) ? r[0] : r, r1 = Array.isArray(r) ? r[1] : r;
    b.prism(sides || 12, r0, r0, 0, r1, r1, len, col, Object.assign({ capBottom: true }, opts || {}));
    b.pop();
    return b;
  }

  function loftZ(b, secs, sides, col, caps) {
    const p = (s, a) => [C(a) * s[2], s[1] + S(a) * s[3], s[0]];
    const n = (s, a) => V3.norm([C(a) / s[2], S(a) / s[3], 0]);
    for (let j = 0; j < secs.length - 1; j++) {
      const s0 = secs[j], s1 = secs[j + 1];
      for (let i = 0; i < sides; i++) {
        const a0 = (i / sides) * PI * 2, a1 = ((i + 1) / sides) * PI * 2;
        b.quad(p(s0, a0), p(s1, a0), p(s1, a1), p(s0, a1), s0[4] || col, null, [n(s0, a0), n(s1, a0), n(s1, a1), n(s0, a1)]);
      }
    }
    if (caps !== false) {
      [secs[0], secs[secs.length - 1]].forEach((s, k) => {
        const c = [0, s[1], s[0]];
        const nz = [0, 0, k ? 1 : -1];
        for (let i = 0; i < sides; i++) b.tri(c, p(s, (i / sides) * PI * 2), p(s, ((i + 1) / sides) * PI * 2), s[4] || col, null, [nz, nz, nz]);
      });
    }
    return b;
  }

  function torus(b, R, r, n, m, col, a0, a1) {
    const s0 = a0 === undefined ? 0 : a0, s1 = a1 === undefined ? PI * 2 : a1;
    const pt = (i, j) => {
      const u = lerp(s0, s1, i / n), v = (j / m) * PI * 2;
      const cx = C(u) * R, cy = S(u) * R;
      const nn = [C(u) * C(v), S(u) * C(v), S(v)];
      return { p: [cx + nn[0] * r, cy + nn[1] * r, nn[2] * r], n: nn };
    };
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < m; j++) {
        const a = pt(i, j), c = pt(i + 1, j), d = pt(i + 1, j + 1), e = pt(i, j + 1);
        b.quad(a.p, c.p, d.p, e.p, col, null, [a.n, c.n, d.n, e.n]);
      }
    }
    return b;
  }

  function buildRifle(b) {
    const W = COL.wood, WD = COL.woodDk;
    loftZ(b, [[-0.45, -0.045, 0.021, 0.07, COL.cap], [-0.44, -0.045, 0.021, 0.07], [-0.3, -0.035, 0.022, 0.06], [-0.16, -0.024, 0.02, 0.043], [-0.09, -0.024, 0.018, 0.034],
      [-0.02, -0.012, 0.02, 0.028], [0.12, -0.01, 0.02, 0.024], [0.3, -0.008, 0.019, 0.021], [0.345, -0.006, 0.015, 0.016]], 14, W);
    b.push(M4.translate(0, -0.055, -0.06), M4.rotX(0.32));
    b.box(0.034, 0.075, 0.04, WD);
    b.pop();
    loftZ(b, [[-0.08, 0.022, 0.016, 0.016], [0.17, 0.022, 0.016, 0.016]], 14, COL.metal);
    loftZ(b, [[0.17, 0.022, 0.0095, 0.0095], [0.9, 0.022, 0.0082, 0.0082], [0.9, 0.022, 0.0108, 0.0108], [0.975, 0.022, 0.0108, 0.0108]], 12, COL.metal);
    b.at(0, 0.022, 0.976, h => K.discXY(h, 0, 0, 0, 0.0055, 10, rgb(0x050505, 0.6)));
    cyl(b, [-0.016, 0.03, -0.03], [-0.052, 0.022, -0.04], 0.0045, COL.metalHi, 8);
    b.at(-0.056, 0.021, -0.041, h => h.ellipsoid(0.009, 0.009, 0.009, 8, 6, COL.metalHi));
    K.tube(b, [[0, -0.022, -0.045], [0, -0.05, -0.04], [0, -0.056, 0.0], [0, -0.04, 0.03], [0, -0.022, 0.035]], [0.0035, 0.0035, 0.0035, 0.0035, 0.0035], 6, COL.metal);
    b.push(M4.translate(0, -0.03, -0.012), M4.rotX(0.3));
    b.box(0.005, 0.03, 0.006, COL.metalHi);
    b.pop();
    const sy = 0.088;
    loftZ(b, [[-0.115, sy, 0.0235, 0.0235, COL.scopeDk], [-0.1, sy, 0.0235, 0.0235], [-0.04, sy, 0.022, 0.022], [-0.03, sy, 0.0165, 0.0165], [0.19, sy, 0.0165, 0.0165],
      [0.22, sy, 0.024, 0.024], [0.3, sy, 0.0265, 0.0265], [0.31, sy, 0.0265, 0.0265, COL.scopeDk]], 18, COL.scope);
    [-0.07, -0.05, 0.25, 0.27].forEach(z => loftZ(b, [[z, sy, 0.0245, 0.0245], [z + 0.006, sy, 0.0245, 0.0245]], 18, COL.scopeDk));
    b.at(0, sy, 0.3105, h => K.discXY(h, 0, 0, 0, 0.022, 16, rgb(COL.lens, 0.2)));
    b.at(0, sy, -0.1155, h => { h.push(M4.rotY(PI)); K.discXY(h, 0, 0, 0, 0.02, 16, rgb(COL.lens, 0.2)); h.pop(); });
    cyl(b, [0, sy + 0.012, 0.08], [0, sy + 0.032, 0.08], 0.0095, COL.scopeDk, 12);
    cyl(b, [-0.012, sy, 0.08], [-0.032, sy, 0.08], 0.0095, COL.scopeDk, 12);
    [0.005, 0.15].forEach(z => {
      b.at(0, 0.052, z, h => h.box(0.022, 0.036, 0.022, COL.metal));
      loftZ(b, [[z - 0.012, sy, 0.0195, 0.0195], [z + 0.012, sy, 0.0195, 0.0195]], 14, COL.metal);
    });
    b.at(0, 0.044, 0.08, h => h.box(0.018, 0.012, 0.2, COL.metal));
    const loop = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * PI;
      loop.push([0.004 * S(i), sy + 0.017 + S(a) * 0.045, lerp(0.02, 0.15, i / 12) + C(a) * 0.012]);
    }
    K.tube(b, loop, loop.map(() => 0.0022), 5, COL.cap);
    b.push(M4.translate(0, sy + 0.027, 0.312), M4.rotX(-0.25));
    b.prism(16, 0.028, 0.028, 0, 0.028, 0.028, 0.006, COL.cap, { capBottom: true });
    b.pop();
    b.at(0, sy + 0.055, 0.315, h => { h.push(M4.rotX(PI / 2 - 0.15)); h.prism(16, 0.028, 0.028, 0, 0.028, 0.028, 0.005, COL.cap, { capBottom: true }); h.pop(); });
    [[0.26, -0.03], [-0.3, -0.105]].forEach(([z, y]) => {
      b.push(M4.translate(0, y, z), M4.rotY(PI / 2));
      torus(b, 0.012, 0.0022, 10, 4, COL.metalHi);
      b.pop();
    });
    return b;
  }

  const RIFLE_GRIPS = {
    R: { at: [0, -0.05, -0.055], fingers: [0, -0.45, 1], palm: [1, 0, 0], pose: 'trigger' },
    L: { at: [0, -0.024, 0.24], fingers: [-0.3, 0.05, 1], palm: [0.4, 1, 0], pose: 'grip' },
    Lunder: { at: [0, -0.035, 0.2], fingers: [1, 0, 0.2], palm: [0, 1, 0], pose: 'grip' },
    bolt: { at: [-0.056, 0.021, -0.041], fingers: [-0.2, -0.3, 1], palm: [1, 0, 0], pose: 'pinch' },
    carry: { at: [0, 0.0, 0.05], fingers: [1, 0, 0], palm: [0, -1, 0], pose: 'grip' }
  };

  function buildKukri(b, bloody) {
    cyl(b, [0, -0.13, 0], [0, -0.005, 0], [0.013, 0.015], COL.handle, 10);
    b.at(0, -0.135, 0, h => h.ellipsoid(0.016, 0.012, 0.018, 10, 6, COL.pommel));
    b.at(0, -0.002, 0, h => h.box(0.02, 0.008, 0.05, COL.pommel));
    const prof = [];
    for (let i = 0; i <= 14; i++) {
      const k = i / 14;
      const y = k * 0.34;
      const bend = 0.09 * k * k;
      const width = 0.014 + 0.05 * S(Math.min(1, k * 1.25) * PI * 0.92) * (1 - Math.pow(k, 6));
      prof.push({ y, spine: -0.012 + bend - 0.004, edge: -0.012 + bend + width * (k > 0.97 ? 0.2 : 1) });
    }
    const th = 0.0035;
    for (let i = 0; i < prof.length - 1; i++) {
      const a = prof[i], c = prof[i + 1];
      const col = bloody && i > 2 ? COL.blood : COL.blade;
      const colE = bloody && i > 1 ? 0x9a2a22 : COL.bladeDk;
      [-1, 1].forEach(s => {
        b.quad([s * th, a.y, a.spine], [s * th, c.y, c.spine], [s * 0.0008, c.y, c.edge], [s * 0.0008, a.y, a.edge], [rgb(col), rgb(col), rgb(colE), rgb(colE)], null, [[s, 0, 0], [s, 0, 0], [s, 0, 0], [s, 0, 0]]);
      });
      b.quad([-th, a.y, a.spine], [th, a.y, a.spine], [th, c.y, c.spine], [-th, c.y, c.spine], COL.bladeDk, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
    }
    return b;
  }

  function buildMug(b) {
    const n = 22;
    const R = 0.04, Hh = 0.096;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * PI * 2, a1 = ((i + 1) / n) * PI * 2;
      const p = (a, y, r) => [S(a) * r, y, C(a) * r];
      const u0 = i / n, u1 = (i + 1) / n;
      b.quad(p(a0, 0, R), p(a1, 0, R), p(a1, Hh, R), p(a0, Hh, R), 0xffffff, [[u0, 0], [u1, 0], [u1, 1], [u0, 1]], [[S(a0), 0, C(a0)], [S(a1), 0, C(a1)], [S(a1), 0, C(a1)], [S(a0), 0, C(a0)]]);
      b.quad(p(a0, Hh, R), p(a1, Hh, R), p(a1, Hh, R * 0.9), p(a0, Hh, R * 0.9), 0xb4b0a8, [[0.02, 0.98], [0.02, 0.98], [0.02, 0.98], [0.02, 0.98]]);
      b.quad(p(a1, 0.012, R * 0.9), p(a0, 0.012, R * 0.9), p(a0, Hh, R * 0.9), p(a1, Hh, R * 0.9), 0xd8d4cc, [[0.02, 0.98], [0.02, 0.98], [0.02, 0.98], [0.02, 0.98]]);
    }
    b.at(0, Hh * 0.72, 0, h => h.prism(18, R * 0.9, R * 0.9, 0, R * 0.9, R * 0.9, 0.001, COL.coffee));
    b.push(M4.translate(-R - 0.012, Hh * 0.52, 0), M4.rotY(PI / 2), M4.rotZ(PI / 2));
    torus(b, 0.026, 0.0065, 12, 6, 0xe6e2da, -PI / 2, PI / 2);
    b.pop();
    return b;
  }

  function buildPot(b) {
    b.ellipsoid(0.08, 0.07, 0.08, 18, 10, COL.pot);
    b.at(0, 0.055, 0, h => h.prism(18, 0.05, 0.05, 0, 0.045, 0.045, 0.03, COL.pot, { capTop: false }));
    b.at(0, 0.08, 0, h => h.prism(18, 0.052, 0.052, 0, 0.05, 0.05, 0.022, COL.potLid));
    b.at(0, 0.106, 0, h => h.ellipsoid(0.012, 0.01, 0.012, 8, 5, COL.potLid));
    K.tube(b, [[0.05, 0.09, 0], [0.11, 0.08, 0], [0.12, 0.02, 0], [0.09, -0.03, 0], [0.07, -0.035, 0]], [0.008, 0.009, 0.009, 0.008, 0.007], 8, COL.potLid);
    b.at(-0.075, 0.075, 0, h => h.box(0.03, 0.01, 0.022, COL.potLid));
    return b;
  }

  function buildJarGlass(b) {
    b.prism(16, 0.036, 0.036, 0, 0.036, 0.036, 0.095, COL.glass, { capTop: false, capBottom: true });
    return b;
  }

  function buildJarFill(b, level) {
    b.prism(16, 0.032, 0.032, 0.004, 0.032, 0.032, 0.004 + 0.085 * level, COL.liquid, { capBottom: true });
    b.at(0, 0.095, 0, h => h.prism(16, 0.038, 0.038, 0, 0.038, 0.038, 0.014, COL.lid, { capBottom: true }));
    return b;
  }

  function buildBobbleBase(b) {
    b.at(0, 0.0221, 0, h => { h.push(M4.rotX(-PI / 2)); K.discXY(h, 0, 0, 0, 0.046, 24, rgb(0xffffff)); h.pop(); });
    return b;
  }

  function buildBobbleBody(b) {
    b.prism(24, 0.05, 0.05, 0, 0.046, 0.046, 0.022, 0x1e1c1a, { capTop: false, capBottom: true });
    [-1, 1].forEach(s => {
      b.at(s * 0.011, 0.022, 0.004, h => h.box(0.016, 0.01, 0.026, COL.shoe));
      cyl(b, [s * 0.011, 0.026, 0], [s * 0.011, 0.085, 0], [0.0085, 0.0095], COL.suit, 8);
    });
    b.at(0, 0.115, 0, h => h.box(0.05, 0.065, 0.032, COL.suit));
    b.at(0, 0.143, 0.001, h => h.box(0.052, 0.012, 0.034, COL.suitDk));
    b.at(0, 0.128, 0.0165, h => { h.push(M4.rotZ(0)); h.box(0.016, 0.03, 0.002, COL.shirtB); h.pop(); });
    b.at(0, 0.124, 0.0178, h => h.box(0.007, 0.034, 0.002, COL.tie));
    [-1, 1].forEach(s => {
      cyl(b, [s * 0.03, 0.143, 0], [s * 0.034, 0.093, 0.004], [0.008, 0.0072], COL.suit, 8);
      b.at(s * 0.034, 0.088, 0.005, h => h.ellipsoid(0.007, 0.008, 0.007, 8, 5, COL.skinB));
    });
    cyl(b, [0, 0.148, 0], [0, 0.16, 0], 0.006, COL.spring, 8);
    return b;
  }

  function buildBobbleHead(b) {
    const n = 24, m = 14;
    const rx = 0.043, ry = 0.054, rz = 0.044;
    for (let j = 0; j < m; j++) {
      for (let i = 0; i < n; i++) {
        const pt = (ii, jj) => {
          const th = (jj / m) * PI, ph = (ii / n) * PI * 2 - PI;
          const nn = [S(th) * S(ph), C(th), S(th) * C(ph)];
          const flat = 1 + 0.12 * Math.pow(S(th), 6);
          return { p: [nn[0] * rx * flat, nn[1] * ry, nn[2] * rz * flat], n: V3.norm([nn[0] / rx, nn[1] / ry, nn[2] / rz]), uv: [(ph + PI) / (2 * PI), 1 - jj / m] };
        };
        const q = [pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1)];
        b.quad(q[0].p, q[1].p, q[2].p, q[3].p, 0xffffff, q.map(v => v.uv), q.map(v => v.n));
      }
    }
    return b;
  }

  function buildBobbleFeatures(b) {
    [-1, 1].forEach(s => b.at(s * 0.044, 0.002, -0.003, h => h.ellipsoid(0.006, 0.014, 0.01, 8, 5, 0xd8a080)));
    b.at(0, -0.008, 0.044, h => h.ellipsoid(0.008, 0.012, 0.009, 8, 5, 0xdca07c));
    return b;
  }

  function buildPhoneBox(b) {
    b.at(0, 0.0, 0, h => h.box(0.32, 0.36, 0.13, 0xffffff, { faces: { front: 0xffffff, back: COL.boxDk, left: COL.box, right: COL.box, top: COL.box, bottom: COL.boxDk } }));
    b.at(0.02, -0.29, -0.01, h => h.box(0.24, 0.22, 0.11, COL.box));
    b.at(-0.1, -0.21, 0.02, h => h.box(0.12, 0.012, 0.12, COL.boxDk));
    b.at(-0.165, 0.02, 0.03, h => h.box(0.012, 0.06, 0.03, COL.hook));
    b.at(-0.18, 0.05, 0.03, h => h.box(0.03, 0.01, 0.03, COL.hook));
    b.at(0.0, 0.205, 0.0, h => h.box(0.34, 0.05, 0.145, COL.boxDk));
    return b;
  }

  function buildHandset(b) {
    K.tube(b, [[0, 0.0, 0], [0, 0.05, 0.012], [0, 0.11, 0.016], [0, 0.16, 0.012], [0, 0.205, 0]], [0.011, 0.012, 0.012, 0.012, 0.011], 8, COL.phone);
    [[0, 0.215, 0.0, -0.5], [0, -0.01, 0.0, 0.5]].forEach(([x, y, z, a], i) => {
      b.push(M4.translate(x, y, z), M4.rotX(a - PI / 2));
      b.prism(16, 0.017, 0.017, 0, 0.027, 0.027, 0.03, COL.phone, { capTop: true, capBottom: true });
      if (i === 1) {
        for (let k = 0; k < 7; k++) {
          const ang = (k / 7) * PI * 2;
          const r = k === 6 ? 0 : 0.014;
          b.at(S(ang) * r * (k === 6 ? 0 : 1), 0.0305, C(ang) * r * (k === 6 ? 0 : 1), h => h.prism(8, 0.0032, 0.0032, 0, 0.0032, 0.0032, 0.0008, 0x0a0a0a));
        }
      }
      b.pop();
    });
    return b;
  }

  function buildCasing(b) {
    b.prism(10, 0.0062, 0.0062, 0, 0.0058, 0.0058, 0.052, COL.brass, { capBottom: true, capTop: false });
    b.prism(10, 0.0068, 0.0068, -0.003, 0.0068, 0.0068, 0.0, COL.brassDk, { capBottom: true });
    b.at(0, 0.052, 0, h => h.prism(10, 0.0058, 0.0058, 0, 0.0058, 0.0058, 0.0004, 0x2a1a0a));
    return b;
  }

  function buildToothbrush(b) {
    b.at(0, 0.08, 0, h => h.box(0.011, 0.17, 0.008, COL.brush));
    b.at(0, 0.16, 0.009, h => h.box(0.01, 0.026, 0.012, COL.bristle));
    return b;
  }

  function buildTray(b) {
    b.prism(20, 0.075, 0.075, 0, 0.08, 0.08, 0.022, COL.tray, { capBottom: true, capTop: false });
    b.prism(20, 0.066, 0.066, 0.008, 0.07, 0.07, 0.022, COL.trayDk, { capBottom: false, capTop: false });
    b.at(0, 0.008, 0, h => h.prism(20, 0.066, 0.066, 0, 0.066, 0.066, 0.001, COL.trayDk));
    cyl(b, [-0.05, 0.016, -0.02], [-0.1, 0.03, -0.035], 0.006, COL.butt, 8);
    return b;
  }

  function buildClock(b) {
    b.push(M4.rotX(PI / 2));
    b.prism(24, 0.13, 0.13, -0.025, 0.13, 0.13, 0.0, COL.clockRim, { capBottom: true, capTop: false });
    b.pop();
    return b;
  }

  function buildClockFace(b) {
    K.discXY(b, 0, 0, 0.001, 0.12, 24, rgb(0xffffff));
    return b;
  }

  function buildWheel(b) {
    torus(b, 0.19, 0.014, 32, 8, COL.wheel);
    [[0, -1], [0.87, 0.5], [-0.87, 0.5]].forEach(([x, y]) => cyl(b, [x * 0.02, y * 0.02, 0.0], [x * 0.18, y * 0.18, 0.01], 0.012, COL.wheelHi, 8));
    b.at(0, 0, -0.01, h => { h.push(M4.rotX(PI / 2)); h.prism(16, 0.045, 0.045, -0.02, 0.04, 0.04, 0.02, COL.wheelHi, { capBottom: true }); h.pop(); });
    cyl(b, [0, 0, -0.02], [0, 0, -0.5], 0.025, COL.wheel, 12);
    return b;
  }

  function buildVan(b) {
    const L = 4.6, Wd = 2.15, Hb = 2.45;
    b.at(0, 0.55 + Hb / 2, -0.4, h => h.box(Wd, Hb, L * 0.72, 0xffffff, { faces: { front: COL.van, back: 0xffffff, left: 0xffffff, right: 0xffffff, top: COL.vanDk, bottom: COL.vanDk } }));
    b.at(0, 1.25, L * 0.36 - 0.4 + 0.6, h => h.box(Wd * 0.96, 1.4, 1.2, COL.van));
    b.at(0, 0.45, 0, h => h.box(Wd * 0.94, 0.3, L, COL.vanDk));
    [[-1, -1.7], [1, -1.7], [-1, 1.5], [1, 1.5]].forEach(([s, z]) => {
      b.push(M4.translate(s * (Wd / 2 - 0.12), 0.4, z), M4.rotZ(PI / 2));
      b.prism(14, 0.4, 0.4, -0.16, 0.4, 0.4, 0.16, COL.tyre, { capBottom: true });
      b.at(0, s * 0.165, 0, h => h.prism(10, 0.18, 0.18, -0.005, 0.18, 0.18, 0.005, COL.rim));
      b.pop();
    });
    const zb = -0.4 - L * 0.36 - 0.01;
    [-0.62, -0.38].forEach(x => {
      b.at(x, 1.8, zb - 0.06, h => h.box(0.05, 2.2, 0.05, COL.chrome));
    });
    for (let i = 0; i < 9; i++) b.at(-0.5, 0.85 + i * 0.25, zb - 0.06, h => h.box(0.26, 0.03, 0.03, COL.chrome));
    b.at(0.35, 2.15, zb - 0.005, h => h.box(0.5, 0.36, 0.02, COL.glassDk));
    b.at(0.35, 1.25, zb - 0.005, h => h.box(0.7, 1.3, 0.02, COL.vanDk));
    [[0.75, 0.95], [0.75, 1.2]].forEach(([x, y]) => b.at(x, y, zb - 0.01, h => { h.push(M4.rotX(PI / 2)); h.prism(12, 0.07, 0.07, 0, 0.07, 0.07, 0.03, COL.red); h.pop(); }));
    b.at(0, 0.62, zb - 0.1, h => h.box(Wd * 1.02, 0.18, 0.14, 0x3a3836));
    return b;
  }

  function buildLamp(b) {
    b.prism(20, 0.05, 0.05, 0.02, 0.2, 0.2, -0.1, COL.shade, { capTop: true });
    cyl(b, [0, 0.02, 0], [0, 0.6, 0], 0.008, COL.shade, 6);
    return b;
  }

  function buildBulb(b) {
    b.at(0, -0.08, 0, h => h.ellipsoid(0.17, 0.02, 0.17, 18, 4, rgb(COL.bulb, 1)));
    return b;
  }

  function build(r) {
    const mk = (fn) => K.mesh(r, fn);
    return {
      rifle: mk(buildRifle),
      kukri: mk(b => buildKukri(b, false)),
      kukriBloody: mk(b => buildKukri(b, true)),
      mug: mk(buildMug),
      pot: mk(buildPot),
      jarGlass: mk(buildJarGlass),
      jarFull: mk(b => buildJarFill(b, 0.82)),
      jarLow: mk(b => buildJarFill(b, 0.45)),
      jarEmpty: mk(b => buildJarFill(b, 0.02)),
      bobbleBase: mk(buildBobbleBase),
      bobbleBody: mk(buildBobbleBody),
      bobbleHead: mk(buildBobbleHead),
      bobbleFeatures: mk(buildBobbleFeatures),
      phoneBox: mk(buildPhoneBox),
      phoneFront: mk(b => b.quad([-0.16, -0.18, 0.0651], [0.16, -0.18, 0.0651], [0.16, 0.18, 0.0651], [-0.16, 0.18, 0.0651], 0xffffff, [[0, 0], [1, 0], [1, 1], [0, 1]], [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]])),
      handset: mk(buildHandset),
      casing: mk(buildCasing),
      toothbrush: mk(buildToothbrush),
      tray: mk(buildTray),
      clock: mk(buildClock),
      clockFace: mk(buildClockFace),
      wheel: mk(buildWheel),
      van: mk(buildVan),
      vanSide: mk(b => b.box(1, 1, 1, 0xffffff)),
      lamp: mk(buildLamp),
      bulb: mk(buildBulb),
      cord: null,
      r
    };
  }

  function grip(side, M) {
    const g = RIFLE_GRIPS[side];
    return { pos: M4.point(M, g.at), fingers: V3.norm(M4.dir(M, g.fingers)), palm: V3.norm(M4.dir(M, g.palm)), pose: g.pose };
  }

  function muzzle(M) {
    return { p: M4.point(M, [0, 0.022, 0.99]), d: V3.norm(M4.dir(M, [0, 0, 1])) };
  }

  function scopeEye(M) {
    return M4.point(M, [0, 0.088, -0.13]);
  }

  function drawRifle(fx, P, M, opts) {
    fx.draw(P.rifle, M, Object.assign({}, METAL, opts || {}));
  }

  function drawKukri(fx, P, M, bloody, opts) {
    fx.draw(bloody ? P.kukriBloody : P.kukri, M, Object.assign({}, METAL, opts || {}));
  }

  function drawMug(fx, P, M, T) {
    fx.draw(P.mug, M, Object.assign({ texture: T('mug') }, CERAMIC));
  }

  function drawJar(fx, P, M, fill) {
    fx.draw(fill === 'low' ? P.jarLow : fill === 'empty' ? P.jarEmpty : P.jarFull, M, { spec: [0.6, 30], rim: 0.6 });
    fx.draw(P.jarGlass, M, { spec: [0.9, 40], rim: 1.2, alpha: 0.3, blend: true });
  }

  function drawBobble(fx, P, M, nod, T) {
    fx.draw(P.bobbleBase, M, Object.assign({ texture: T('bobbleBase') }, PLASTIC));
    fx.draw(P.bobbleBody, M, PLASTIC);
    const n = nod || [0, 0, 0];
    const HM = M4.chain(M, M4.translate(0, 0.162, 0), M4.rotZ(n[2]), M4.rotX(n[0]), M4.rotY(n[1]), M4.translate(0, 0.05, 0.004));
    fx.draw(P.bobbleHead, HM, Object.assign({ texture: T('bobbleFace') }, PLASTIC));
    fx.draw(P.bobbleFeatures, HM, PLASTIC);
  }

  function cordPoints(a, b, sag, n) {
    const pts = [];
    const L = V3.len(V3.sub(b, a));
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const p = V3.lerp(a, b, k);
      p[1] -= S(k * PI) * (sag === undefined ? 0.25 : sag) * L;
      pts.push(p);
    }
    return pts;
  }

  function cordMesh(fx, P) {
    if (!P.cord) P.cord = { mesh: fx.dyn(), data: null, idx: null, n: 24, sides: 6 };
    return P.cord;
  }

  function drawCord(fx, P, pts, r, col) {
    const cord = cordMesh(fx, P);
    const n = pts.length, sides = cord.sides;
    if (!cord.data || cord.count !== n) {
      cord.data = new Float32Array(n * (sides + 1) * 12);
      const idx = [];
      for (let j = 0; j < n - 1; j++) {
        for (let i = 0; i < sides; i++) {
          const a = j * (sides + 1) + i, b = a + 1, c = a + sides + 2, d = a + sides + 1;
          idx.push(a, b, c, a, c, d);
        }
      }
      cord.idx = new Uint16Array(idx);
      cord.count = n;
      cord.mesh.update(cord.data, cord.idx);
    }
    const c = rgb(col || COL.cord);
    let w = 0;
    for (let j = 0; j < n; j++) {
      const prev = pts[Math.max(0, j - 1)], next = pts[Math.min(n - 1, j + 1)];
      const dir = V3.norm(V3.sub(next, prev));
      let side = V3.cross(dir, [0, 1, 0]);
      if (V3.len(side) < 1e-3) side = [1, 0, 0];
      side = V3.norm(side);
      const up = V3.cross(side, dir);
      for (let i = 0; i <= sides; i++) {
        const a = (i / sides) * PI * 2;
        const nn = V3.add(V3.mul(side, C(a)), V3.mul(up, S(a)));
        const p = V3.add(pts[j], V3.mul(nn, r));
        cord.data.set([p[0], p[1], p[2], nn[0], nn[1], nn[2], c[0], c[1], c[2], 0, 0, 0], w);
        w += 12;
      }
    }
    cord.mesh.update(cord.data);
    fx.draw(cord.mesh, null, { spec: [0.3, 12], rim: 0.5 });
  }

  window.MsnProps = { COL, METAL, WOOD, CERAMIC, PLASTIC, RIFLE_GRIPS, build, grip, muzzle, scopeEye, drawRifle, drawKukri, drawMug, drawJar, drawBobble, cordPoints, drawCord, cyl, torus, loftZ };
})();
