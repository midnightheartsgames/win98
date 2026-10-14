(function (O) {
  'use strict';
  const { B, col, shade, headFront, face, hairCap, spike, lock } = O.MODEL_KIT;
  const PI = Math.PI;
  const STEEL = 0xc8ccd4, BRASS = 0xc8a040, WHITE = 0xf4f2ec, INK = 0x14121a;

  function studs(M, x0, y0, z, x1, y1, n, c, r) {
    for (let i = 0; i < n; i++) {
      const k = n > 1 ? i / (n - 1) : 0.5;
      M.box(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, z, r, r, r, c, { gloss: 0.9 });
    }
  }

  function strap(M, a, b, w, d, c, o = {}) {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1;
    const u = [(b[0] - a[0]) / l, (b[1] - a[1]) / l, (b[2] - a[2]) / l];
    let n = o.n || [0, 0, 1];
    if (Math.abs(n[0] * u[0] + n[1] * u[1] + n[2] * u[2]) > 0.98) n = [1, 0, 0];
    const k = n[0] * u[0] + n[1] * u[1] + n[2] * u[2];
    const z = [n[0] - u[0] * k, n[1] - u[1] * k, n[2] - u[2] * k], zl = Math.hypot(z[0], z[1], z[2]);
    z[0] /= zl; z[1] /= zl; z[2] /= zl;
    const x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]];
    M.push([x[0], x[1], x[2], 0, u[0], u[1], u[2], 0, z[0], z[1], z[2], 0, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, 1]);
    M.box(0, 0, 0, w, l, d, c, o);
    M.pop();
  }

  function feather(M, len, w, c, spine, o = {}) {
    M.box(0, len / 2, 0, w, len, w * 0.18, c, { tx: 0.25, bx: 0.5, emit: o.emit, gloss: o.gloss });
    if (spine !== undefined) M.box(0, len * 0.45, w * 0.1, w * 0.12, len * 0.85, w * 0.08, spine, { emit: o.emit });
  }

  function flame(M, x, y, z, h, c1, c2) {
    M.box(x, y, z, h * 0.35, h, 0.006, c1, { tx: 0.1, emit: 0.2 });
    M.box(x + h * 0.14, y - h * 0.12, z + 0.002, h * 0.22, h * 0.7, 0.006, c2, { tx: 0.1, emit: 0.3 });
    M.box(x - h * 0.13, y - h * 0.2, z + 0.002, h * 0.2, h * 0.55, 0.006, c2, { tx: 0.1, emit: 0.3 });
  }

  const K = {};

  K.tracer = {
    punk: {
      hide: ['locks'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head, z0 = 0.01 * s;
        const hair = col(P, 'hair', 0xe030a0), hi = shade(hair, 1.35), metal = col(P, 'harness', 0x9a9aa0);
        M.bone(B.HEAD);
        for (let i = 0; i < 8; i++) {
          const th = 0.95 - i * 0.34;
          const y = H + R * 0.12 + Math.cos(th) * R * 1.02, z = z0 + Math.sin(th) * R * 1.05;
          spike(M, 0, y, z, 0, Math.cos(th) + 0.35, Math.sin(th) - 0.25, R * (0.95 - Math.abs(i - 3) * 0.08), R * 0.24, i % 2 ? hi : hair, { seg: 4 });
          if (i > 0 && i < 7) for (const sd of [-1, 1]) spike(M, sd * R * 0.22, y - R * 0.05, z, sd * 0.35, Math.cos(th) + 0.3, Math.sin(th) - 0.2, R * 0.6, R * 0.17, hair, { seg: 4 });
        }
        lock(M, R * 0.25, H + R * 0.8, R * 0.75, -0.3, -0.6, 0.75, R * 0.6, R * 0.42, R * 0.22, hi);
        lock(M, -R * 0.1, H + R * 0.82, R * 0.78, -0.45, -0.6, 0.65, R * 0.62, R * 0.42, R * 0.22, hair);
        M.bone(B.SPINE);
        M.torus(0, S.sh + 0.075 * s, 0, 0.066 * s, 0.014 * s, INK, { seg: 14, seg2: 4 });
        for (let i = 0; i < 9; i++) {
          const a = -PI * 0.75 + i / 8 * PI * 1.5;
          spike(M, Math.sin(a) * 0.075 * s, S.sh + 0.075 * s, Math.cos(a) * 0.075 * s, Math.sin(a), 0.1, Math.cos(a), 0.03 * s, 0.009 * s, metal, { gloss: 0.9 });
        }
        for (const sd of [-1, 1]) {
          for (let i = 0; i < 3; i++) spike(M, sd * (S.sw - 0.03 * s), S.sh + 0.04 * s, (i - 1) * 0.045 * s, sd * 0.5, 1, 0, 0.05 * s, 0.013 * s, metal, { gloss: 0.9 });
          studs(M, sd * 0.125 * s, S.chest - 0.14 * s, 0.131 * s, sd * 0.125 * s, S.chest + 0.16 * s, 6, metal, 0.014 * s);
        }
        M.box(0.1 * s, S.chest - 0.02 * s, 0.13 * s, 0.006 * s, 0.05 * s, 0.006 * s, metal, { rot: [0, 0, 0.5], gloss: 0.9 });
        M.bone(B.ROOT);
        for (let i = 0; i < 6; i++) M.torus(-0.14 * s + i * 0.018 * s, S.hip + 0.02 * s - Math.sin(i / 5 * PI) * 0.06 * s, 0.1 * s, 0.009 * s, 0.003 * s, metal, { rot: [PI / 2, 0, i % 2 ? PI / 2 : 0], seg: 6, seg2: 3, gloss: 0.9 });
      }
    },
    slipstream: {
      hide: ['locks'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const cap = col(P, 'collar', 0xc8b890), dark = shade(cap, 0.6), blue = col(P, 'pants', 0x2a4a8a), gold = col(P, 'stripe', 0xe8c030), hair = col(P, 'hair', 0x3e2618);
        M.bone(B.HEAD);
        M.sphere(0, H + R * 0.12, -R * 0.03, R * 1.1, R * 1.1, R * 1.14, cap, { lat: 8, lon: 12, half: true });
        M.box(0, H - R * 0.2, -R * 0.62, R * 1.8, R * 1.05, R * 0.8, cap, { bx: 0.85 });
        for (let i = 0; i < 5; i++) M.box(0, H + R * (0.95 - i * 0.02), R * (0.55 - i * 0.35), R * 0.18, R * 0.08, R * 0.3, dark);
        for (const sd of [-1, 1]) {
          M.box(sd * R * 1.02, H - R * 0.3, R * 0.05, R * 0.24, R * 0.95, R * 0.7, cap, { bx: 0.8 });
          M.cyl(sd * R * 1.14, H - R * 0.1, R * 0.05, R * 0.2, R * 0.2, R * 0.08, 10, dark, { rot: [0, 0, PI / 2] });
        }
        M.box(0, H - R * 0.8, R * 0.3, R * 1.7, R * 0.09, R * 0.14, dark);
        for (const [x, dx] of [[0.32, -0.25], [-0.02, -0.4], [-0.36, 0.1]]) lock(M, R * x, H + R * 0.48, R * 0.98, dx, -0.8, 0.45, R * 0.36, R * 0.32, R * 0.14, hair);
        M.bone(B.SPINE);
        M.torus(0, S.sh + 0.04 * s, 0, 0.1 * s, 0.035 * s, cap, { seg: 14, seg2: 5 });
        for (const sd of [-1, 1]) M.box(sd * 0.075 * s, S.chest - 0.02 * s, 0.13 * s, 0.03 * s, 0.4 * s, 0.012 * s, blue);
        M.box(0, S.chest - 0.14 * s, 0.134 * s, 0.2 * s, 0.03 * s, 0.012 * s, blue);
        M.cyl(-0.11 * s, S.chest + 0.1 * s, 0.13 * s, 0.03 * s, 0.03 * s, 0.01 * s, 10, gold, { rot: [PI / 2, 0, 0], gloss: 0.8 });
        M.box(-0.11 * s, S.chest + 0.1 * s, 0.137 * s, 0.05 * s, 0.012 * s, 0.006 * s, blue);
        for (const sd of [-1, 1]) {
          M.bone(sd > 0 ? B.UAL : B.UAR);
          M.box(sd * (S.sw + 0.045 * s), S.sh - 0.08 * s, 0, 0.012 * s, 0.07 * s, 0.07 * s, blue);
          M.box(sd * (S.sw + 0.05 * s), S.sh - 0.08 * s, 0, 0.006 * s, 0.03 * s, 0.03 * s, gold);
        }
      }
    }
  };

  K.soldier = {
    commando: {
      hide: ['sleeves'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const band = 0xa8281e, jacket = col(P, 'jacket', 0x3a4a2a);
        M.bone(B.HEAD);
        M.torus(0, H + R * 0.42, -R * 0.02, R * 0.98, R * 0.1, band, { seg: 14, seg2: 4, rot: [-0.12, 0, 0] });
        M.box(0, H + R * 0.4, -R * 1.02, R * 0.3, R * 0.25, R * 0.2, band);
        for (const sd of [-1, 1]) M.box(sd * R * 0.14, H + R * 0.05, -R * 1.15, R * 0.18, R * 0.7, R * 0.05, band, { rot: [0.35, 0, sd * 0.3], tx: 0.7 });
        M.bone(B.SPINE);
        const dir = [Math.sin(0.62), Math.cos(0.62)];
        strap(M, [0.17 * s, S.sh - 0.02 * s, 0.14 * s], [-0.16 * s, S.waist - 0.02 * s, 0.14 * s], 0.055 * s, 0.02 * s, 0x3a2a1a);
        for (let i = -4; i <= 4; i++) {
          const t = i * 0.055 * s;
          M.box(0.005 * s + dir[0] * t, S.chest - 0.03 * s + dir[1] * t, 0.155 * s, 0.05 * s, 0.018 * s, 0.018 * s, BRASS, { rot: [0, 0, -0.62], gloss: 0.9 });
        }
        strap(M, [-0.06 * s, S.sh + 0.03 * s, 0.13 * s], [0.02 * s, S.sh - 0.1 * s, 0.15 * s], 0.006 * s, 0.006 * s, STEEL, { gloss: 0.9 });
        M.box(0.025 * s, S.sh - 0.13 * s, 0.152 * s, 0.03 * s, 0.045 * s, 0.006 * s, STEEL, { gloss: 0.95 });
        for (const sd of [-1, 1]) {
          M.bone(sd > 0 ? B.UAL : B.UAR);
          M.torus(sd * S.sw, S.elbow + 0.04 * s, 0, 0.068 * s, 0.022 * s, jacket, { seg: 10, seg2: 4 });
        }
      }
    },
    strike: {
      hide: ['head', 'number'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const skin = col(P, 'skin', 0xd8a888), hair = col(P, 'hair', 0xe0c070), trim = col(P, 'trim', 0xe8c040), jacket = col(P, 'jacket', 0x1a2a5a);
        M.bone(B.HEAD);
        M.sphere(0, H, 0.01 * s, R * 0.92, R * 1.08, R * 0.98, skin, { lat: 8, lon: 10 });
        M.box(0, H - R * 0.62, R * 0.35, R * 1.0, R * 0.42, R * 0.8, skin, { bx: 0.8, bz: 0.85 });
        face(M, S, P, { mouthW: 0.4 });
        M.bone(B.HEAD);
        hairCap(M, S, hair, { lift: 0.16, napeH: 0.65, w: 0.98 });
        M.box(0, H + R * 0.74, R * 0.28, R * 1.12, R * 0.26, R * 0.62, hair, { rot: [-0.22, 0, 0], tx: 0.8, tz: 0.7 });
        for (const sd of [-1, 1]) M.box(sd * R * 0.88, H - R * 0.05, R * 0.2, R * 0.12, R * 0.45, R * 0.3, hair);
        M.bone(B.SPINE);
        M.cyl(0, S.sh + 0.06 * s, 0, 0.1 * s, 0.095 * s, 0.1 * s, 12, jacket, { caps: false });
        M.box(0, S.sh + 0.07 * s, 0.09 * s, 0.1 * s, 0.08 * s, 0.02 * s, col(P, 'chest', 0xe8e8ec));
        for (const sd of [-1, 1]) {
          M.box(sd * (S.sw + 0.01 * s), S.sh + 0.045 * s, 0, 0.17 * s, 0.03 * s, 0.15 * s, trim, { gloss: 0.8 });
          for (let i = 0; i < 5; i++) M.cyl(sd * (S.sw + 0.085 * s), S.sh + 0.005 * s, (i - 2) * 0.03 * s, 0.009 * s, 0.009 * s, 0.07 * s, 4, trim, { gloss: 0.6 });
        }
        M.torus(0.1 * s, S.chest + 0.1 * s, 0.155 * s, 0.035 * s, 0.008 * s, trim, { rot: [PI / 2, 0, 0], seg: 12, seg2: 3, gloss: 0.9 });
        for (let i = 0; i < 5; i++) M.box(0.1 * s, S.chest + 0.1 * s, 0.158 * s, 0.008 * s, 0.03 * s, 0.005 * s, trim, { rot: [0, 0, i / 5 * PI * 2] });
      }
    }
  };

  K.mccree = {
    gambler: {
      hide: ['serape'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const coat = col(P, 'serape', 0x2a2a2a), gold = col(P, 'serape2', 0xd0a040), shirt = col(P, 'shirt', 0x6a1a1a);
        M.bone(B.SPINE);
        M.box(0, S.chest + 0.02 * s, -0.118 * s, 0.43 * s, 0.46 * s, 0.035 * s, coat);
        for (const sd of [-1, 1]) {
          M.box(sd * 0.17 * s, S.chest + 0.02 * s, 0.01 * s, 0.09 * s, 0.46 * s, 0.26 * s, coat);
          M.box(sd * 0.12 * s, S.chest + 0.03 * s, 0.135 * s, 0.1 * s, 0.42 * s, 0.022 * s, coat, { rot: [0, 0, -sd * 0.14] });
          M.box(sd * 0.085 * s, S.chest + 0.12 * s, 0.148 * s, 0.018 * s, 0.24 * s, 0.01 * s, gold, { rot: [0, 0, -sd * 0.3] });
          M.box(sd * (S.sw - 0.02 * s), S.sh + 0.01 * s, 0, 0.15 * s, 0.05 * s, 0.29 * s, coat);
        }
        M.box(0, S.chest - 0.03 * s, 0.13 * s, 0.13 * s, 0.3 * s, 0.02 * s, 0x241416);
        for (let i = 0; i < 4; i++) M.box(0, S.chest + 0.08 * s - i * 0.065 * s, 0.142 * s, 0.014 * s, 0.014 * s, 0.008 * s, gold, { gloss: 0.9 });
        for (const sd of [-1, 1]) M.box(sd * 0.022 * s, S.sh - 0.03 * s, 0.14 * s, 0.04 * s, 0.022 * s, 0.012 * s, shirt, { rot: [0, 0, sd * 0.4] });
        strap(M, [0.01 * s, S.chest - 0.02 * s, 0.145 * s], [0.07 * s, S.chest - 0.09 * s, 0.14 * s], 0.005 * s, 0.005 * s, gold, { gloss: 0.9 });
        M.bone(B.ROOT);
        M.box(0, S.hip - 0.22 * s, -0.125 * s, 0.4 * s, 0.48 * s, 0.03 * s, coat, { rot: [0.14, 0, 0], bx: 1.1 });
        for (const sd of [-1, 1]) M.box(sd * 0.175 * s, S.hip - 0.2 * s, -0.02 * s, 0.03 * s, 0.44 * s, 0.2 * s, coat, { rot: [0, 0, sd * 0.07] });
        M.box(0, S.hip - 0.45 * s, -0.16 * s, 0.4 * s, 0.02 * s, 0.035 * s, gold, { rot: [0.14, 0, 0] });
        M.bone(B.HEAD);
        M.with(0, H + R * 0.62, -R * 0.05, 0.1, 0, 0, () => {
          for (const [x, ry, rz, red] of [[0.72, 0.85, 0.2, 1], [0.95, 1.2, 0.35, 0]]) {
            M.with(R * x, R * 0.42, R * (0.95 - x * 0.35), 0, ry, rz, () => {
              M.box(0, 0, 0, R * 0.32, R * 0.46, R * 0.02, WHITE);
              M.box(0, 0, R * 0.014, R * 0.1, R * 0.1, R * 0.01, red ? 0xc02020 : INK);
            });
          }
        });
      }
    },
    mystery: {
      hide: ['serape', 'cigar'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const coat = col(P, 'serape', 0x4a3a5a), band = col(P, 'serape2', 0x8a6aa8), dark = shade(coat, 0.75);
        M.bone(B.HEAD);
        M.box(0, H - R * 0.48, R * 0.72, R * 1.95, R * 0.95, R * 0.72, band, { bx: 0.78, tz: 1.05 });
        M.box(0, H - R * 1.05, R * 0.82, R * 0.6, R * 0.6, R * 0.1, band, { rot: [0, 0, PI / 4] });
        M.box(0, H - R * 0.08, R * 1.06, R * 1.7, R * 0.06, R * 0.06, shade(band, 0.7));
        M.bone(B.SPINE);
        M.box(0, S.sh - 0.02 * s, 0, 0.54 * s, 0.11 * s, 0.35 * s, coat, { bx: 1.08 });
        M.box(0, S.chest - 0.04 * s, -0.14 * s, 0.46 * s, 0.52 * s, 0.035 * s, coat);
        for (const sd of [-1, 1]) {
          M.box(sd * 0.2 * s, S.chest - 0.02 * s, 0.005 * s, 0.04 * s, 0.5 * s, 0.3 * s, coat);
          M.box(sd * 0.13 * s, S.chest - 0.02 * s, 0.135 * s, 0.1 * s, 0.5 * s, 0.02 * s, coat, { rot: [0, 0, -sd * 0.08] });
          M.box(sd * 0.09 * s, S.chest + 0.18 * s, 0.15 * s, 0.06 * s, 0.16 * s, 0.012 * s, dark, { rot: [0, 0, -sd * 0.45] });
        }
        M.bone(B.ROOT);
        M.box(0, S.hip - 0.36 * s, -0.14 * s, 0.46 * s, 0.76 * s, 0.03 * s, coat, { rot: [0.08, 0, 0], bx: 1.15 });
        for (const sd of [-1, 1]) M.box(sd * 0.2 * s, S.hip - 0.34 * s, -0.01 * s, 0.03 * s, 0.72 * s, 0.26 * s, coat, { rot: [0, 0, sd * 0.06] });
        for (let i = 0; i < 6; i++) M.box(-0.2 * s + i * 0.08 * s, S.hip - 0.76 * s - (i % 3) * 0.03 * s, -0.17 * s, 0.06 * s, 0.1 * s + (i % 2) * 0.05 * s, 0.025 * s, coat, { rot: [0.08, 0, (i - 2.5) * 0.06], bx: 0.4 });
      }
    }
  };

  K.junkrat = {
    hayseed: {
      hide: ['spikes'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const straw = 0xd8b868, denim = col(P, 'shorts', 0x5a7aa8), hair = col(P, 'hair', 0xd8a040);
        M.bone(B.HEAD);
        M.with(0, H + R * 0.6, -R * 0.08, -0.15, 0, 0.08, () => {
          M.cyl(0, 0, 0, R * 2.2, R * 2.2, 0.02 * s, 16, straw);
          M.cyl(0, R * 0.42, 0, R * 1.0, R * 0.88, R * 0.8, 12, straw);
          M.cyl(0, R * 0.1, 0, R * 1.02, R * 1.0, R * 0.18, 12, 0x8a3a2a);
          for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2 + 0.3; spike(M, Math.sin(a) * R * 2.1, 0, Math.cos(a) * R * 2.1, Math.sin(a), -0.15, Math.cos(a), R * 0.35, R * 0.04, straw, { seg: 3 }); }
        });
        for (const sd of [-1, 1]) spike(M, sd * R * 0.85, H + R * 0.3, -R * 0.2, sd, -0.2, -0.3, R * 0.8, R * 0.2, hair, { seg: 4 });
        spike(M, R * 0.25, H - R * 0.55, headFront(S, 0.25, -0.55), 0.5, -0.1, 1, R * 1.4, R * 0.04, straw, { seg: 3, tip: R * 0.03 });
        M.bone(B.SPINE);
        M.box(0, S.chest - 0.07 * s, 0.1 * s, 0.2 * s, 0.2 * s, 0.022 * s, denim);
        M.box(0, S.chest - 0.04 * s, 0.113 * s, 0.08 * s, 0.07 * s, 0.006 * s, shade(denim, 0.8));
        for (const sd of [-1, 1]) {
          M.box(sd * 0.075 * s, S.chest + 0.12 * s, 0.098 * s, 0.035 * s, 0.2 * s, 0.014 * s, denim);
          M.box(sd * 0.075 * s, S.chest + 0.04 * s, -0.098 * s, 0.035 * s, 0.4 * s, 0.014 * s, denim, { rot: [0, 0, sd * 0.25] });
          M.cyl(sd * 0.075 * s, S.chest + 0.03 * s, 0.113 * s, 0.013 * s, 0.013 * s, 0.008 * s, 8, BRASS, { rot: [PI / 2, 0, 0], gloss: 0.9 });
          M.box(sd * 0.075 * s, S.sh + 0.005 * s, 0, 0.035 * s, 0.012 * s, 0.2 * s, denim);
        }
        M.box(0, S.sh - 0.02 * s, 0.085 * s, 0.1 * s, 0.1 * s, 0.015 * s, 0xc03020, { rot: [0, 0, PI / 4] });
      }
    },
    scarecrow: {
      hide: ['hair', 'face'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const sack = 0xa8885a, rope = 0x6a5030, straw = col(P, 'hair', 0xc8a050), glow = col(P, 'teeth', 0xf0a020), hat = col(P, 'camo', 0x4a3a20);
        M.bone(B.HEAD);
        M.sphere(0, H + R * 0.02, 0.01 * s, R * 1.12, R * 1.18, R * 1.12, sack, { lat: 8, lon: 10 });
        M.torus(0, H - R * 0.92, 0.01 * s, R * 0.62, R * 0.12, rope, { seg: 10, seg2: 4 });
        for (const sd of [-1, 1]) {
          M.box(sd * R * 0.4, H + R * 0.18, R * 1.03, R * 0.44, R * 0.3, R * 0.06, glow, { emit: 1, rot: [0, sd * 0.35, sd * 0.25], tx: 0.5 });
          M.box(sd * R * 0.4, H + R * 0.18, R * 1.0, R * 0.58, R * 0.42, R * 0.04, INK, { rot: [0, sd * 0.35, sd * 0.25], tx: 0.6 });
        }
        M.box(0, H - R * 0.45, R * 1.02, R * 1.0, R * 0.07, R * 0.05, INK, { rot: [0.35, 0, 0] });
        for (let i = 0; i < 6; i++) M.box((i - 2.5) * R * 0.17, H - R * 0.45, R * 1.03, R * 0.04, R * 0.26, R * 0.04, INK, { rot: [0.35, 0, (i % 2 ? 1 : -1) * 0.15] });
        M.with(0.1 * R, H + R * 0.95, -R * 0.1, -0.12, 0, -0.12, () => {
          M.cyl(0, 0, 0, R * 1.9, R * 1.9, 0.025 * s, 14, hat);
          M.cyl(0, R * 0.62, 0, R * 0.95, R * 0.5, R * 1.25, 10, hat);
          M.with(0, R * 1.2, 0, -0.6, 0, 0, () => M.cyl(0, R * 0.5, 0, R * 0.5, 0, R * 1.1, 8, hat));
          M.cyl(0, R * 0.15, 0, R * 0.97, R * 0.95, R * 0.2, 10, rope);
          M.box(R * 0.55, R * 0.55, R * 0.6, R * 0.35, R * 0.35, R * 0.04, sack, { rot: [0, 0.6, 0.2] });
        });
        const tuft = (bone, x, y, z, n, up) => {
          M.bone(bone);
          for (let i = 0; i < n; i++) { const a = i / n * PI * 2; spike(M, x + Math.sin(a) * 0.04 * s, y, z + Math.cos(a) * 0.04 * s, Math.sin(a), up, Math.cos(a), 0.09 * s, 0.012 * s, straw, { seg: 3 }); }
        };
        tuft(B.SPINE, 0, S.sh + 0.04 * s, 0, 9, 0.3);
        tuft(B.LAL, S.sw, S.hand + 0.05 * s, 0, 6, -0.6);
        tuft(B.LAR, -S.sw, S.hand + 0.06 * s, 0, 6, -0.6);
        tuft(B.LLL, S.hw, S.ankle + 0.18 * s, 0, 6, -0.4);
      }
    }
  };

  K.torbjorn = {
    chopper: {
      hide: ['helmet'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const cap = col(P, 'helmet', 0x2a2a2a), leather = 0x3a2a20, metal = col(P, 'metal', 0x6a6e76);
        M.bone(B.HEAD);
        M.sphere(0, H + R * 0.15, -R * 0.05, R * 1.06, R * 0.95, R * 1.1, cap, { lat: 6, lon: 12, half: true });
        M.box(0, H + R * 0.72, R * 0.78, R * 0.42, R * 0.34, R * 0.08, WHITE, { rot: [-0.7, 0, 0] });
        for (const sd of [-1, 1]) M.box(sd * R * 0.1, H + R * 0.74, R * 0.83, R * 0.1, R * 0.1, R * 0.04, INK, { rot: [-0.7, 0, 0] });
        for (const sd of [-1, 1]) M.box(sd * R * 0.14, H + R * 0.05, -R * 1.2, R * 0.16, R * 0.7, R * 0.05, cap, { rot: [0.35, 0, sd * 0.3], tx: 0.6 });
        M.bone(B.SPINE);
        for (const sd of [-1, 1]) {
          M.box(sd * 0.17 * s, S.chest + 0.02 * s, 0.236 * s, 0.17 * s, 0.44 * s, 0.02 * s, leather);
          studs(M, sd * 0.1 * s, S.chest - 0.16 * s, 0.25 * s, sd * 0.1 * s, S.chest + 0.18 * s, 5, STEEL, 0.02 * s);
          for (let i = 0; i < 6; i++) M.box(sd * (0.1 + i * 0.027) * s, S.chest - 0.24 * s, 0.24 * s, 0.012 * s, 0.07 * s, 0.006 * s, leather, { rot: [0, 0, (i - 2.5) * 0.08] });
          flame(M, sd * 0.25 * s, S.chest - 0.05 * s, 0.232 * s, 0.13 * s, 0xe05a18, 0xf0c030);
        }
        for (let i = 0; i < 9; i++) {
          const k = i / 8;
          M.torus(0.2 * s - k * 0.4 * s, S.sh - 0.02 * s - k * 0.36 * s, 0.26 * s, 0.018 * s, 0.006 * s, STEEL, { rot: [PI / 2, 0, i % 2 ? 0.9 : -0.6], seg: 6, seg2: 3, gloss: 0.9 });
        }
        for (let i = 0; i < 3; i++) spike(M, -S.sw - 0.02 * s + (i - 1) * 0.02 * s, S.sh + 0.08 * s, (i - 1) * 0.06 * s, -0.4, 1, 0, 0.1 * s, 0.025 * s, metal, { gloss: 0.8 });
      }
    },
    ironclad: {
      hide: ['helmet', 'goggles'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const helm = col(P, 'helmet', 0x3a3e46), armor = col(P, 'armor', 0x5a5e66), dark = col(P, 'armorDark', 0x2a2e36), glow = col(P, 'goggle', 0xff8a20);
        M.bone(B.HEAD);
        M.cyl(0, H + R * 0.2, R * 0.05, R * 1.1, R * 1.02, R * 1.5, 12, helm, { gloss: 0.75 });
        M.sphere(0, H + R * 0.94, R * 0.05, R * 1.02, R * 0.5, R * 1.02, helm, { lat: 4, lon: 12, half: true, gloss: 0.75 });
        M.box(0, H + R * 1.3, 0, R * 0.16, R * 0.3, R * 1.8, dark, { tz: 0.6 });
        M.box(0, H + R * 0.25, R * 1.1, R * 1.4, R * 0.13, R * 0.06, glow, { emit: 1 });
        M.box(0, H + R * 0.25, R * 1.09, R * 1.55, R * 0.26, R * 0.05, INK);
        for (let i = 0; i < 4; i++) M.box((i - 1.5) * R * 0.22, H - R * 0.2, R * 1.12, R * 0.07, R * 0.3, R * 0.03, INK);
        for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; M.sphere(Math.sin(a) * R * 1.1, H - R * 0.48, R * 0.05 + Math.cos(a) * R * 1.1, R * 0.07, R * 0.07, R * 0.07, STEEL, { lat: 3, lon: 4, gloss: 0.9 }); }
        M.bone(B.SPINE);
        for (const sd of [-1, 1]) {
          for (let k = 0; k < 2; k++) M.box(sd * (S.sw + 0.05 * s + k * 0.02 * s), S.sh + 0.07 * s - k * 0.07 * s, 0, 0.24 * s, 0.07 * s, 0.3 * s - k * 0.02 * s, k ? dark : armor, { rot: [0, 0, sd * (0.25 + k * 0.1)], gloss: 0.7 });
          studs(M, sd * (S.sw - 0.02 * s), S.sh + 0.12 * s, 0.12 * s, sd * (S.sw + 0.12 * s), S.sh + 0.07 * s, 3, STEEL, 0.025 * s);
        }
        M.box(0, S.chest + 0.06 * s, 0.24 * s, 0.34 * s, 0.22 * s, 0.03 * s, dark, { bx: 0.8, gloss: 0.7 });
        studs(M, -0.14 * s, S.chest + 0.15 * s, 0.26 * s, 0.14 * s, S.chest + 0.15 * s, 5, STEEL, 0.02 * s);
        M.box(0, S.chest + 0.04 * s, 0.258 * s, 0.1 * s, 0.1 * s, 0.01 * s, glow, { emit: 0.8, rot: [0, 0, PI / 4] });
      }
    }
  };

  K.widowmaker = {
    odile: {
      hide: ['visor'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const suit = col(P, 'suit', 0x1a1a1a), light = col(P, 'suitLight', 0x4a4a4a), dark = col(P, 'suitDark', 0x0a0a0a), eyes = col(P, 'eyes', 0xe8c850);
        M.bone(B.HEAD);
        for (const sd of [-1, 1]) {
          const fx = sd * 0.34, z = headFront(S, fx, 0.1);
          M.box(fx * R, H + R * 0.1, z - R * 0.01, R * 0.42, R * 0.24, R * 0.08, INK, { rot: [0, 0, sd * -0.2] });
          M.box(fx * R, H + R * 0.08, z + R * 0.02, R * 0.2, R * 0.11, R * 0.06, eyes, { emit: 0.6 });
        }
        M.torus(0, H + R * 0.5, -R * 0.02, R * 0.96, R * 0.05, 0xc8c8d8, { seg: 14, seg2: 3, rot: [-0.25, 0, 0], gloss: 0.9 });
        M.box(0, H + R * 0.78, R * 0.86, R * 0.16, R * 0.2, R * 0.08, 0xb040ff, { emit: 0.8, rot: [0, 0, PI / 4] });
        for (let i = 0; i < 9; i++) {
          const a = (i - 4) * 0.28;
          M.with(Math.sin(a) * R * 0.8, H + R * 0.7, Math.cos(a) * R * 0.45 - R * 0.1, -0.35 + Math.abs(i - 4) * 0.05, a, -a * 0.5, () => feather(M, R * (1.3 - Math.abs(i - 4) * 0.12), R * 0.34, i % 2 ? dark : suit, light));
        }
        M.bone(B.ROOT);
        M.cyl(0, S.hip - 0.02 * s, 0, 0.3 * s, 0.14 * s, 0.05 * s, 18, dark);
        for (let layer = 0; layer < 2; layer++) {
          for (let i = 0; i < 18; i++) {
            const a = (i + layer * 0.5) / 18 * PI * 2;
            M.with(Math.sin(a) * 0.13 * s, S.hip - 0.03 * s - layer * 0.025 * s, Math.cos(a) * 0.12 * s, 0, a, 0, () => {
              M.at(0, 0, 0, 0.12 + layer * 0.12, 0, 0);
              M.box(0, 0, 0.12 * s, 0.11 * s, 0.012 * s, 0.24 * s, layer ? light : suit, { tx: 0.7, bx: 0.7 });
              M.pop();
            });
          }
        }
        M.bone(B.SPINE);
        for (const sd of [-1, 1]) for (let i = 0; i < 4; i++) M.with(sd * (S.sw - 0.02 * s), S.sh + 0.02 * s, (i - 1.5) * 0.04 * s, 0, 0, sd * (-0.6 - i * 0.25), () => feather(M, 0.12 * s, 0.035 * s, dark, light));
      }
    },
    comtesse: {
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const suit = col(P, 'suit', 0x6a0a1a), gold = col(P, 'suitLight', 0xd0a040), dark = col(P, 'suitDark', 0x2a0a0a);
        M.bone(B.HEAD);
        M.with(-R * 0.18, H + R * 0.98, R * 0.05, 0.12, 0, 0.22, () => {
          M.cyl(0, 0, 0, R * 1.55, R * 1.55, 0.02 * s, 16, dark);
          M.cyl(0, R * 0.25, 0, R * 0.78, R * 0.72, R * 0.5, 12, dark);
          M.cyl(0, R * 0.08, 0, R * 0.8, R * 0.79, R * 0.14, 12, gold, { gloss: 0.8 });
          for (let i = 0; i < 7; i++) {
            const k = i / 6;
            M.with(R * (0.55 - k * 1.3), R * (0.45 + Math.sin(k * PI) * 0.45), -R * (0.3 + k * 0.5), 0, 0, 1.2 - k * 1.8, () => feather(M, R * 0.7, R * 0.3, i % 2 ? WHITE : 0xe8dcc8));
          }
        });
        M.bone(B.SPINE);
        for (let i = 0; i < 3; i++) M.box(0, S.sh - 0.03 * s - i * 0.045 * s, 0.118 * s + i * 0.004 * s, 0.1 * s - i * 0.015 * s, 0.05 * s, 0.03 * s, WHITE, { tx: 0.6 });
        for (const sd of [-1, 1]) {
          for (let i = 0; i < 3; i++) M.box(sd * 0.055 * s, S.chest + 0.02 * s - i * 0.07 * s, 0.117 * s, 0.018 * s, 0.018 * s, 0.01 * s, gold, { gloss: 0.9 });
          M.box(sd * (S.sw - 0.01 * s), S.sh + 0.035 * s, 0, 0.11 * s, 0.03 * s, 0.12 * s, gold, { gloss: 0.8 });
        }
        M.bone(B.ROOT);
        M.box(0, S.hip - 0.28 * s, -0.12 * s, 0.34 * s, 0.56 * s, 0.02 * s, suit, { rot: [0.2, 0, 0], bx: 1.4 });
        M.box(0, S.hip - 0.55 * s, -0.18 * s, 0.46 * s, 0.03 * s, 0.03 * s, gold, { rot: [0.2, 0, 0] });
        for (const sd of [-1, 1]) {
          M.box(sd * 0.16 * s, S.hip - 0.26 * s, -0.03 * s, 0.02 * s, 0.52 * s, 0.2 * s, suit, { rot: [0, 0, sd * 0.15], bz: 1.3 });
          M.box(sd * 0.2 * s, S.hip - 0.52 * s, -0.03 * s, 0.025 * s, 0.03 * s, 0.26 * s, gold, { rot: [0, 0, sd * 0.15] });
        }
      }
    }
  };

  K.reinhardt = {
    blackhardt: {
      hide: ['crest'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const ar = col(P, 'armor', 0x2a2a30), ar2 = col(P, 'armor2', 0x1a1a1e), glow = col(P, 'visor', 0xff3020), cape = col(P, 'red', 0x8a1a1a);
        M.bone(B.HEAD);
        for (const sd of [-1, 1]) M.box(sd * R * 0.3, H + R * 0.12, R * 1.07, R * 0.42, R * 0.07, R * 0.02, glow, { emit: 1, rot: [0, 0, sd * 0.12] });
        for (let i = 0; i < 5; i++) {
          const th = 0.55 - i * 0.42;
          spike(M, 0, H + R * 0.1 + Math.cos(th) * R * 1.05, -R * 0.02 + Math.sin(th) * R * 1.05, 0, 1, Math.sin(th) * 0.8 - 0.3, R * (1.05 - Math.abs(i - 1.5) * 0.14), R * 0.17, ar2, { seg: 4, gloss: 0.7 });
        }
        for (const sd of [-1, 1]) {
          spike(M, sd * R * 0.95, H + R * 0.45, -R * 0.05, sd, 0.9, -0.2, R * 0.9, R * 0.2, ar2, { seg: 5, gloss: 0.7 });
          spike(M, sd * R * 1.5, H + R * 0.95, -R * 0.15, sd * 0.2, 1, -0.3, R * 0.6, R * 0.1, ar2, { seg: 5, gloss: 0.7 });
        }
        M.bone(B.SPINE);
        for (const sd of [-1, 1]) {
          M.with(sd * (S.sw + 0.07 * s), S.sh + 0.05 * s, 0, 0, 0, sd * 0.25, () => {
            for (let i = 0; i < 3; i++) spike(M, sd * 0.05 * s, 0.13 * s, (i - 1) * 0.1 * s, sd * 0.4, 1, (i - 1) * 0.3, 0.2 * s - Math.abs(i - 1) * 0.05 * s, 0.035 * s, ar2, { seg: 5, gloss: 0.7 });
          });
        }
        M.bone(B.BACK);
        for (let i = 0; i < 7; i++) {
          const x = (i - 3) * 0.085 * s, len = 0.9 * s - (i % 3) * 0.14 * s - Math.abs(i - 3) * 0.05 * s;
          M.with(x, S.sh + 0.05 * s, -0.47 * s, 0.1, 0, (i - 3) * 0.03, () => M.box(0, -len / 2, 0, 0.09 * s, len, 0.015 * s, cape, { bx: 0.5 }));
        }
        for (const side of [1, -1]) {
          M.bone(side > 0 ? B.LLL : B.LLR);
          spike(M, side * S.hw, S.knee + 0.02 * s, 0.15 * s, 0, 0.3, 1, 0.14 * s, 0.03 * s, ar, { seg: 5, gloss: 0.7 });
        }
      }
    },
    lionhardt: {
      hide: ['crest'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const mane = col(P, 'lion', 0xf0d080), ar2 = col(P, 'armor2', 0xa88030), dark = col(P, 'dark', 0x6a4a2a), deep = shade(mane, 0.78);
        M.bone(B.HEAD);
        for (let row = 0; row < 3; row++) {
          const n = 11 + row * 2;
          for (let i = 0; i < n; i++) {
            const a = 0.95 + i / (n - 1) * (PI * 2 - 1.9);
            const y = H - R * 0.35 + row * R * 0.55;
            const rr = R * (1.12 - row * 0.12);
            spike(M, Math.sin(a) * rr, y, Math.cos(a) * rr - R * 0.05, Math.sin(a), 0.25 + row * 0.35, Math.cos(a) - 0.2, R * (0.95 - row * 0.15), R * 0.3, (i + row) % 2 ? mane : deep, { seg: 4 });
          }
        }
        for (const sd of [-1, 1]) spike(M, sd * R * 0.6, H + R * 1.0, R * 0.15, sd * 0.35, 1, 0.1, R * 0.45, R * 0.22, mane, { seg: 4 });
        M.bone(B.SPINE);
        const cz = 0.245 * s, cy = S.chest + 0.12 * s;
        M.torus(0, cy, cz, 0.11 * s, 0.035 * s, deep, { rot: [PI / 2, 0, 0], seg: 12, seg2: 4, gloss: 0.8 });
        M.sphere(0, cy, cz, 0.085 * s, 0.1 * s, 0.05 * s, mane, { lat: 5, lon: 8, gloss: 0.8 });
        for (const sd of [-1, 1]) M.box(sd * 0.03 * s, cy + 0.02 * s, cz + 0.045 * s, 0.03 * s, 0.012 * s, 0.01 * s, dark);
        M.box(0, cy - 0.03 * s, cz + 0.05 * s, 0.035 * s, 0.04 * s, 0.02 * s, ar2, { gloss: 0.8 });
        M.bone(B.BACK);
        M.with(0, S.sh + 0.03 * s, -0.47 * s, 0.1, 0, 0, () => {
          M.box(0, -0.5 * s, 0, 0.56 * s, 1.0 * s, 0.018 * s, 0x8a2418, { bx: 1.3 });
          M.box(0, -1.0 * s, 0.004 * s, 0.72 * s, 0.04 * s, 0.02 * s, ar2, { gloss: 0.8 });
        });
      }
    }
  };

  K.roadhog = {
    islander: {
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head, mz = 0.02 * s;
        const mask = col(P, 'mask', 0x8a5a2a);
        const flowers = [0xff5a8a, 0xffe040, WHITE, 0xff8a30];
        M.bone(B.SPINE);
        for (let i = 0; i < 18; i++) {
          const a = i / 18 * PI * 2, c = Math.cos(a);
          M.sphere(Math.sin(a) * 0.23 * s, S.sh + 0.04 * s - Math.max(0, c) * 0.08 * s, c * 0.21 * s + 0.03 * s, 0.038 * s, 0.03 * s, 0.038 * s, flowers[i % 4], { lat: 3, lon: 6 });
        }
        M.bone(B.HEAD);
        M.box(0, H + R * 0.55, mz + R * 0.98, R * 1.7, R * 0.22, R * 0.3, shade(mask, 0.75));
        for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) M.box(sd * R * (0.12 + i * 0.2), H - R * 0.72, mz + R * 1.2, R * 0.14, R * 0.26, R * 0.12, WHITE);
        for (let i = 0; i < 7; i++) {
          const a = (i - 3) * 0.3;
          M.with(Math.sin(a) * R * 0.4, H + R * 0.95, -R * 0.1, -0.2, 0, -a, () => feather(M, R * (1.4 - Math.abs(i - 3) * 0.15), R * 0.28, i % 2 ? 0x3a8a3a : 0x5aa84a, 0x2a6a2a));
        }
        M.bone(B.ROOT);
        for (let i = 0; i < 22; i++) {
          const a = i / 22 * PI * 2;
          M.with(Math.sin(a) * 0.31 * s, S.hip - 0.05 * s, Math.cos(a) * 0.27 * s + 0.03 * s, 0, a, 0, () => M.box(0, -0.16 * s, 0.02 * s, 0.07 * s, 0.34 * s, 0.012 * s, i % 2 ? 0x6a9a3a : 0x8aaa4a, { bx: 0.4, rot: [-0.15, 0, 0] }));
        }
      }
    },
    sanitarium: {
      hide: ['tattoo'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head, mz = 0.02 * s;
        const jacket = col(P, 'pants', 0xe0e0d8), strapC = shade(col(P, 'strap', 0xc8c8c0), 0.7);
        M.bone(B.SPINE);
        M.sphere(0, S.chest - 0.1 * s, 0.1 * s, 0.355 * s, 0.365 * s, 0.325 * s, jacket, { lat: 7, lon: 12 });
        M.box(0, S.chest + 0.12 * s, 0, 0.6 * s, 0.26 * s, 0.44 * s, jacket, { tx: 0.9 });
        for (const dy of [0.12, -0.04, -0.2]) {
          const r = 0.36 * s * Math.sqrt(Math.max(0.1, 1 - (dy / 0.37) ** 2));
          M.torus(0, S.chest - 0.1 * s + dy * s, 0.1 * s, r, 0.02 * s, strapC, { seg: 16, seg2: 3 });
          M.box(0, S.chest - 0.1 * s + dy * s, 0.1 * s + r * 0.92, 0.07 * s, 0.05 * s, 0.03 * s, STEEL, { gloss: 0.9 });
        }
        for (const sd of [-1, 1]) {
          M.bone(sd > 0 ? B.UAL : B.UAR);
          M.torus(sd * S.sw, S.elbow + 0.08 * s, 0, 0.1 * s, 0.018 * s, strapC, { seg: 10, seg2: 3 });
          M.bone(sd > 0 ? B.LAL : B.LAR);
          M.box(sd * S.sw, S.hand + 0.1 * s, 0.1 * s, 0.03 * s, 0.26 * s, 0.01 * s, strapC);
          M.box(sd * S.sw, S.hand - 0.05 * s, 0.1 * s, 0.04 * s, 0.03 * s, 0.015 * s, STEEL, { gloss: 0.9 });
        }
        M.bone(B.HEAD);
        const cz = mz + R * 1.62, cy = H - R * 0.3;
        M.torus(0, cy, cz, R * 0.58, R * 0.05, 0x8a8e94, { rot: [PI / 2, 0, 0], seg: 12, seg2: 3, gloss: 0.9 });
        for (let i = 0; i < 5; i++) M.box((i - 2) * R * 0.24, cy, cz, R * 0.05, R * 1.1 * Math.sqrt(1 - ((i - 2) / 2.4) ** 2), R * 0.05, 0x8a8e94, { gloss: 0.9 });
        M.box(0, cy, cz, R * 1.1, R * 0.05, R * 0.05, 0x8a8e94, { gloss: 0.9 });
        for (const sd of [-1, 1]) strap(M, [sd * R * 0.5, cy, cz - R * 0.1], [sd * R * 1.02, H - R * 0.1, 0], R * 0.1, R * 0.05, strapC, { n: [sd, 0, 0] });
      }
    }
  };

  K.winston = {
    yeti: {
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head, hz = 0.1 * s;
        const fur = col(P, 'fur', 0xe8ecf0), furD = shade(fur, 0.85), ice = 0xbfe8ff;
        M.bone(B.HEAD);
        for (let i = 0; i < 7; i++) {
          const th = 0.6 - i * 0.35;
          spike(M, (i % 2 ? 0.12 : -0.12) * R, H + Math.cos(th) * R * 1.05, hz + Math.sin(th) * R * 1.1, 0, 1, Math.sin(th) - 0.5, R * 0.8, R * 0.25, i % 2 ? fur : furD, { seg: 4 });
        }
        for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) spike(M, sd * R * 1.15, H - R * (0.2 + i * 0.3), hz - R * 0.2, sd, -0.3, -0.2, R * 0.6, R * 0.2, fur, { seg: 4 });
        M.bone(B.SPINE);
        for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) {
          const a = (i - 2) * 0.35;
          spike(M, sd * (S.sw + 0.12 * s), S.sh - 0.05 * s, Math.sin(a) * 0.18 * s, sd, -0.5, Math.sin(a), 0.18 * s, 0.05 * s, i % 2 ? fur : furD, { seg: 4 });
        }
        M.bone(B.BACK);
        for (let i = 0; i < 5; i++) spike(M, (i - 2) * 0.1 * s, S.chest + 0.42 * s, -0.36 * s, (i - 2) * 0.2, 1, -0.3, 0.14 * s + (i % 2) * 0.06 * s, 0.03 * s, ice, { seg: 4, emit: 0.35, gloss: 0.9 });
        for (const side of [1, -1]) {
          M.bone(side > 0 ? B.LAL : B.LAR);
          for (let i = 0; i < 4; i++) spike(M, side * (S.sw + 0.1 * s), S.elbow - 0.04 * s - i * 0.05 * s, -0.05 * s, side, -0.6, -0.4, 0.14 * s, 0.04 * s, fur, { seg: 4 });
          M.bone(side > 0 ? B.LLL : B.LLR);
          for (let i = 0; i < 4; i++) { const a = i / 4 * PI * 2; spike(M, side * S.hw + Math.sin(a) * 0.1 * s, S.knee - 0.08 * s, Math.cos(a) * 0.1 * s, Math.sin(a), -0.7, Math.cos(a), 0.12 * s, 0.04 * s, furD, { seg: 4 }); }
        }
      }
    },
    explorer: {
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head, hz = 0.1 * s;
        const khaki = col(P, 'armor', 0xc8b890), band = col(P, 'accent', 0x6a4a2a), leather = 0x6a4a2a;
        M.bone(B.HEAD);
        M.sphere(0, H + R * 0.6, hz + R * 0.05, R * 1.28, R * 0.85, R * 1.38, khaki, { lat: 6, lon: 12, half: true });
        M.cyl(0, H + R * 0.6, hz + R * 0.05, R * 1.8, R * 1.62, R * 0.1, 16, khaki, { sz: 1.15 });
        M.cyl(0, H + R * 0.72, hz + R * 0.05, R * 1.3, R * 1.3, R * 0.2, 14, band, { sz: 1.07 });
        M.sphere(0, H + R * 1.45, hz + R * 0.05, R * 0.14, R * 0.1, R * 0.14, band, { lat: 3, lon: 6 });
        M.bone(B.SPINE);
        M.torus(0, S.sh + 0.03 * s, 0.1 * s, 0.17 * s, 0.05 * s, 0xb03a2a, { seg: 12, seg2: 4 });
        M.box(0.06 * s, S.sh - 0.1 * s, 0.28 * s, 0.07 * s, 0.18 * s, 0.03 * s, 0xb03a2a, { rot: [0, 0, 0.2], bx: 0.6 });
        strap(M, [0.28 * s, S.sh + 0.02 * s, 0.25 * s], [-0.26 * s, S.waist, 0.2 * s], 0.04 * s, 0.02 * s, leather);
        for (const sd of [-1, 1]) M.cyl(sd * 0.05 * s, S.chest - 0.08 * s, 0.32 * s, 0.035 * s, 0.035 * s, 0.1 * s, 8, 0x2a2a2e, { rot: [PI / 2, 0, 0], gloss: 0.6 });
        M.box(0, S.chest - 0.08 * s, 0.32 * s, 0.05 * s, 0.03 * s, 0.05 * s, 0x2a2a2e);
        M.bone(B.ROOT);
        M.box(-0.34 * s, S.hip + 0.02 * s, 0.05 * s, 0.1 * s, 0.22 * s, 0.26 * s, leather, { tx: 0.9 });
        M.box(-0.39 * s, S.hip + 0.07 * s, 0.05 * s, 0.02 * s, 0.1 * s, 0.24 * s, shade(leather, 0.8));
        M.box(-0.4 * s, S.hip + 0.03 * s, 0.05 * s, 0.015 * s, 0.03 * s, 0.03 * s, BRASS, { gloss: 0.9 });
      }
    }
  };

  K.lucio = {
    ribbit: {
      hide: ['hair'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const hood = col(P, 'armor', 0x60d040), shirt = col(P, 'shirt', 0x3a8a20), belly = col(P, 'tips', 0xffe060);
        M.bone(B.HEAD);
        M.sphere(0, H + R * 0.12, -R * 0.05, R * 1.14, R * 1.14, R * 1.18, hood, { lat: 8, lon: 12, half: true });
        M.box(0, H - R * 0.2, -R * 0.62, R * 1.9, R * 1.0, R * 0.8, hood, { bx: 0.85 });
        M.torus(0, H + R * 0.1, R * 0.05, R * 1.08, R * 0.08, shirt, { seg: 14, seg2: 3, rot: [-1.2, 0, 0] });
        for (const sd of [-1, 1]) {
          const x = sd * R * 0.5, y = H + R * 1.0, z = R * 0.3;
          M.sphere(x, y, z, R * 0.38, R * 0.36, R * 0.36, WHITE, { lat: 5, lon: 8 });
          M.torus(x, y - R * 0.05, z, R * 0.37, R * 0.06, hood, { seg: 10, seg2: 3 });
          M.sphere(x + sd * R * 0.04, y + R * 0.02, z + R * 0.3, R * 0.14, R * 0.18, R * 0.08, INK, { lat: 3, lon: 6 });
        }
        for (const [x, z] of [[0.5, -0.7], [-0.4, -0.85], [0.1, -1.05]]) M.cyl(x * R, H + R * 0.3, z * R, R * 0.2, R * 0.2, R * 0.04, 8, shirt, { rot: [PI / 2 - 0.4, 0, 0] });
        M.bone(B.SPINE);
        M.box(0, S.chest - 0.08 * s, 0.117 * s, 0.18 * s, 0.14 * s, 0.01 * s, belly, { bx: 0.7 });
      }
    },
    slapshot: {
      hide: ['hair'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const helm = col(P, 'armor', 0xd82a2a), white = col(P, 'shirt', 0xf0f0f0), cage = 0xd8dce4;
        M.bone(B.HEAD);
        M.sphere(0, H + R * 0.15, -R * 0.04, R * 1.13, R * 1.08, R * 1.2, helm, { lat: 8, lon: 12, half: true, gloss: 0.7 });
        M.box(0, H - R * 0.15, -R * 0.7, R * 1.9, R * 0.8, R * 0.6, helm, { gloss: 0.7 });
        for (let i = 0; i < 3; i++) M.box((i - 1) * R * 0.35, H + R * 1.05, -R * 0.1, R * 0.12, R * 0.12, R * 1.2, INK);
        for (const sd of [-1, 1]) {
          M.box(sd * R * 1.04, H - R * 0.08, R * 0.1, R * 0.2, R * 0.75, R * 0.7, helm, { gloss: 0.7 });
          M.box(sd * R * 0.95, H - R * 0.45, R * 0.72, R * 0.06, R * 0.06, R * 0.9, cage, { gloss: 0.9 });
          M.box(sd * R * 0.95, H + R * 0.05, R * 0.72, R * 0.06, R * 0.06, R * 0.9, cage, { gloss: 0.9 });
        }
        for (const x of [-0.5, -0.17, 0.17, 0.5]) M.box(x * R, H - R * 0.35, R * 1.16, R * 0.05, R * 1.1, R * 0.05, cage, { gloss: 0.9 });
        for (const y of [0.05, -0.35, -0.75]) M.box(0, H + y * R, R * 1.15, R * 1.2, R * 0.05, R * 0.05, cage, { gloss: 0.9 });
        M.bone(B.SPINE);
        for (const sd of [-1, 1]) {
          M.sphere(sd * (S.sw + 0.03 * s), S.sh + 0.03 * s, 0, 0.12 * s, 0.1 * s, 0.14 * s, helm, { lat: 4, lon: 10, half: true, gloss: 0.6 });
          M.box(sd * (S.sw + 0.03 * s), S.sh + 0.1 * s, 0, 0.03 * s, 0.03 * s, 0.24 * s, white);
          M.bone(sd > 0 ? B.UAL : B.UAR);
          for (const dy of [0.12, 0.16]) M.torus(sd * S.sw, S.sh - dy * s, 0, 0.056 * s, 0.01 * s, white, { seg: 10, seg2: 3 });
          M.bone(B.SPINE);
        }
        for (const [x, y, w, h] of [[-0.03, 0.02, 0.018, 0.1], [0.01, -0.02, 0.07, 0.018], [0.03, 0.02, 0.018, 0.1], [0.03, -0.05, 0.018, 0.06]]) M.box(x * s, S.chest + y * s, 0.12 * s, w * s, h * s, 0.008 * s, white);
      }
    }
  };

  K.mercy = {
    valkyrie: {
      hide: ['halo'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const gold = col(P, 'gold', 0xfff0a0), feat = col(P, 'feather', 0xffffd0), wing = col(P, 'wing', 0xd8dce4), tip = col(P, 'tip', 0x80e8ff);
        M.bone(B.HEAD);
        M.torus(0, H + R * 0.45, -R * 0.02, R * 1.0, R * 0.08, gold, { seg: 14, seg2: 3, rot: [-0.15, 0, 0], gloss: 0.9 });
        M.box(0, H + R * 0.55, R * 0.98, R * 0.2, R * 0.3, R * 0.08, tip, { emit: 1, rot: [0, 0, PI / 4] });
        for (const sd of [-1, 1]) {
          for (let i = 0; i < 4; i++) M.with(sd * R * 1.0, H + R * 0.55, -R * 0.1, -0.35, 0, sd * (-0.35 - i * 0.28), () => feather(M, R * (1.2 - i * 0.18), R * 0.26, gold, feat, { emit: 0.35, gloss: 0.8 }));
        }
        M.bone(B.BACK);
        for (const side of [1, -1]) {
          M.at(side * 0.08 * s, S.chest + 0.22 * s, -0.23 * s, 0, side * 0.2, side * 0.95);
          M.box(side * 0.26 * s, 0.08 * s, 0, 0.52 * s, 0.04 * s, 0.045 * s, wing, { gloss: 0.6 });
          for (let i = 0; i < 4; i++) {
            M.with(side * (0.14 + i * 0.11) * s, 0.06 * s, 0, 0, 0, side * (0.15 + i * 0.1), () => {
              M.box(0, -0.22 * s, 0, 0.065 * s, 0.5 * s - i * 0.05 * s, 0.016 * s, wing, { bx: 0.5, gloss: 0.6 });
              M.box(0, -0.22 * s, 0.011 * s, 0.032 * s, 0.44 * s - i * 0.05 * s, 0.01 * s, feat, { emit: 0.8, bx: 0.4 });
            });
          }
          M.pop();
        }
      }
    },
    devil: {
      hide: ['wings', 'halo'],
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const horn = 0x3a0a0a, bone = col(P, 'wing', 0x3a0a0a), skin = shade(col(P, 'feather', 0xd02020), 0.55), suit = col(P, 'suit', 0x2a1a1a);
        M.bone(B.HEAD);
        for (const sd of [-1, 1]) {
          let p = [sd * R * 0.45, H + R * 0.72, R * 0.35];
          for (const [dx, dy, dz, len, r0, r1] of [[0.45, 1, 0.1, 0.5, 0.2, 0.14], [0.35, 0.55, -0.6, 0.45, 0.14, 0.08], [0.05, -0.1, -1, 0.35, 0.08, 0]]) {
            const l = Math.hypot(dx, dy, dz);
            spike(M, p[0], p[1], p[2], sd * dx, dy, dz, R * len, R * r0, horn, { seg: 6, tip: R * r1, gloss: 0.7 });
            p = [p[0] + sd * dx / l * R * len, p[1] + dy / l * R * len, p[2] + dz / l * R * len];
          }
        }
        M.bone(B.ROOT);
        const hp = S.hip;
        M.tube([[0, hp - 0.02 * s, -0.12 * s], [0.03 * s, hp - 0.25 * s, -0.24 * s], [0.1 * s, hp - 0.55 * s, -0.25 * s], [0.2 * s, hp - 0.72 * s, -0.12 * s], [0.26 * s, hp - 0.7 * s, 0]], 0.018 * s, suit, { seg: 5, r0: 0.024 * s, r1: 0.012 * s });
        M.with(0.29 * s, hp - 0.69 * s, 0.05 * s, 0, 0, -0.6, () => {
          M.box(0, 0, 0, 0.07 * s, 0.07 * s, 0.015 * s, horn, { rot: [0, 0, PI / 4] });
          M.box(0, 0.05 * s, 0, 0.025 * s, 0.05 * s, 0.015 * s, horn, { tx: 0.1 });
        });
        M.bone(B.BACK);
        for (const side of [1, -1]) {
          M.at(side * 0.08 * s, S.chest + 0.14 * s, -0.19 * s, 0, side * 0.35, side * 0.4);
          const X = v => side * v * s;
          const W = [X(0.5), 0.1 * s, 0], root = [X(0.06), 0.02 * s, 0];
          const tips = [[X(0.78), -0.08 * s, -0.02 * s], [X(0.66), -0.36 * s, -0.02 * s], [X(0.42), -0.52 * s, 0], [X(0.16), -0.4 * s, 0]];
          M.tube([root, W], 0.022 * s, bone, { seg: 5 });
          M.tube([W, [X(0.62), 0.24 * s, 0]], 0.016 * s, bone, { seg: 4 });
          for (const t of tips) M.tube([W, t], 0.01 * s, bone, { seg: 4 });
          const chain = [[X(0.62), 0.24 * s, 0]].concat(tips, [root]);
          for (let i = 0; i < chain.length - 1; i++) {
            const a = chain[i], b = chain[i + 1];
            const mid = [(a[0] + b[0]) / 2 + (W[0] - (a[0] + b[0]) / 2) * 0.25, (a[1] + b[1]) / 2 + (W[1] - (a[1] + b[1]) / 2) * 0.25, 0];
            M.tri(W, a, mid, skin); M.tri(W, mid, b, skin);
          }
          M.pop();
        }
      }
    }
  };

  K.zenyatta = {
    nutcracker: {
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const red = col(P, 'pants', 0xd02a2a), gold = col(P, 'gold', 0xd8b040), faceC = col(P, 'face', 0xf0d0b0);
        M.bone(B.HEAD);
        M.cyl(0, H + R * 1.4, -R * 0.02, R * 0.82, R * 0.9, R * 1.5, 12, INK);
        M.cyl(0, H + R * 0.72, -R * 0.02, R * 0.86, R * 0.86, R * 0.16, 12, gold, { gloss: 0.9 });
        M.cyl(0, H + R * 2.1, -R * 0.02, R * 0.92, R * 0.92, R * 0.1, 12, gold, { gloss: 0.9 });
        M.box(0, H + R * 1.35, R * 0.86, R * 0.4, R * 0.4, R * 0.06, gold, { rot: [0, 0, PI / 4], gloss: 0.9 });
        M.sphere(0, H + R * 2.45, -R * 0.02, R * 0.25, R * 0.35, R * 0.25, WHITE, { lat: 4, lon: 6 });
        M.cyl(0, H + R * 2.2, -R * 0.02, R * 0.12, R * 0.12, R * 0.3, 6, red);
        for (const sd of [-1, 1]) {
          M.box(sd * R * 0.26, H - R * 0.38, R * 0.95, R * 0.5, R * 0.2, R * 0.14, WHITE, { rot: [0, 0, sd * 0.28], tx: 0.7 });
          M.cyl(sd * R * 0.48, H - R * 0.05, R * 0.82, R * 0.14, R * 0.14, R * 0.02, 8, 0xe06060, { rot: [PI / 2, 0, 0] });
        }
        M.box(0, H - R * 0.82, R * 0.72, R * 1.0, R * 0.38, R * 0.45, faceC);
        M.box(0, H - R * 0.66, R * 0.96, R * 0.7, R * 0.05, R * 0.03, INK);
        M.box(0, H - R * 0.98, R * 0.75, R * 0.8, R * 0.2, R * 0.4, WHITE);
        M.bone(B.SPINE);
        for (const sd of [-1, 1]) {
          M.box(sd * (S.sw + 0.02 * s), S.sh + 0.04 * s, 0, 0.13 * s, 0.03 * s, 0.12 * s, gold, { gloss: 0.9 });
          for (let i = 0; i < 4; i++) M.cyl(sd * (S.sw + 0.07 * s), S.sh, (i - 1.5) * 0.028 * s, 0.008 * s, 0.008 * s, 0.07 * s, 4, gold);
          M.box(0, S.chest + 0.02 * s, 0.095 * s, 0.04 * s, 0.42 * s, 0.01 * s, WHITE, { rot: [0, 0, sd * 0.6] });
        }
      }
    },
    sunyatta: {
      add(M, S, P) {
        const s = S.s, R = S.headR, H = S.head;
        const sun = col(P, 'light', 0xffff80), gold = 0xffb030;
        M.bone(B.HEAD);
        const cy = H + R * 0.15, cz = -R * 1.15;
        M.cyl(0, cy, cz, R * 0.62, R * 0.62, 0.02 * s, 16, 0xffd040, { rot: [PI / 2, 0, 0], emit: 0.9 });
        M.torus(0, cy, cz, R * 0.72, R * 0.06, gold, { rot: [PI / 2, 0, 0], seg: 16, seg2: 3, emit: 0.6 });
        for (let i = 0; i < 14; i++) {
          const a = i / 14 * PI * 2, rr = R * (i % 2 ? 1.05 : 1.2);
          M.with(Math.cos(a) * rr, cy + Math.sin(a) * rr, cz - 0.005 * s, 0, 0, a - PI / 2, () => M.box(0, 0, 0, R * 0.2, R * (i % 2 ? 0.6 : 0.95), R * 0.03, i % 2 ? 0xffd040 : gold, { emit: 0.75, tx: 0.08 }));
        }
        M.cyl(0, H + R * 0.62, headFront(S, 0, 0.62) + R * 0.03, R * 0.16, R * 0.16, R * 0.02, 10, sun, { rot: [PI / 2, 0, 0], emit: 1 });
        M.torus(0, H + R * 0.45, R * 0.05, R * 0.95, R * 0.05, gold, { seg: 14, seg2: 3, rot: [-0.2, 0, 0], gloss: 0.9 });
        M.bone(B.SPINE);
        M.box(0, S.chest + 0.02 * s, 0.1 * s, 0.05 * s, 0.4 * s, 0.01 * s, col(P, 'pants2', 0xb06010), { rot: [0, 0, 0.55] });
      }
    }
  };

  O.SKIN_KITS = K;
})(globalThis.Ow98 = globalThis.Ow98 || {});
