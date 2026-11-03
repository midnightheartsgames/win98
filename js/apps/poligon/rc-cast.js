(function () {
  const { M4, V3, rgb } = window.P3D;
  const Cast = window.P3DCccCast;
  const Step = window.P3DStepCast;
  const { R, headPoint, headNormal, band, sideLocks } = Cast;

  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const lerp = (a, b, k) => a + (b - a) * k;
  const glow = (c, k) => { const v = rgb(c); return [v[0], v[1], v[2], k === undefined ? 0.9 : k]; };
  const mixc = (a, b, k) => { const x = rgb(a), y = rgb(b); return [lerp(x[0], y[0], k), lerp(x[1], y[1], k), lerp(x[2], y[2], k), lerp(x[3], y[3], k)]; };
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const NB = [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]];

  const SKIN = 0xfde7dc;
  const PALE = 0xe2dfec;
  const WHITE = 0xfbfaf7;
  const IVORY = 0xebe5da;
  const SILVER = 0xc6ced8;
  const BLACK = 0x1f1d26;
  const INK = 0x121118;
  const GLOSS = 0x17171f;
  const WINE = 0x8e1a32;
  const WINE_DARK = 0x5a0b1e;
  const CRIMSON = 0xb42840;
  const RED = 0xcc1e2e;
  const GOLD = [0.94, 0.76, 0.3, 0.14];
  const TEAL = 0x2cc4b8;
  const MINT = 0x8adcc6;
  const HOT = 0xf03e8e;
  const YELLOW = 0xf4d43c;
  const GREEN = 0x2e9a58;
  const FISH = 0x34323c;
  const FUR = 0xfdfcfa;

  const FACE = { paint: Step.paintFace, pupil: '#05282c', lash: '#1a2a30', lashHex: 0x1a2a30, brow: '#24807c', mouth: '#a82e48', lip: '#f2949e' };
  Object.assign(Cast.PEOPLE, {
    miku: Object.assign({}, FACE, { skin: SKIN, iris: ['#05484f', '#16a4a8', '#8af2ea'] }),
    mikuDoll: Object.assign({}, FACE, { skin: PALE, iris: ['#46040e', '#bc1628', '#ff7c7c'], pupil: '#260208', lash: '#1c1424', lashHex: 0x1c1424, brow: '#5c4c9c', mouth: '#7c2a48', lip: '#c4a2ba' }),
    mikuMint: Object.assign({}, FACE, { skin: SKIN, iris: ['#560a36', '#cc3a88', '#ffa8d2'] })
  });

  const HAIRS = {
    miku: { mid: 0x2ec0b6, hi: 0x76e4da, dark: 0x158a82 },
    mikuBlue: { mid: 0x2b58b6, hi: 0x5286dc, dark: 0x173472 },
    mikuDoll: { mid: 0x6a56c8, hi: 0x8c86ea, dark: 0x3c2c88, tip: 0x5cc2f4 }
  };
  Object.assign(Cast.HAIR, HAIRS, { mikuBun: HAIRS.miku });

  const TAIL = { yaw: 2.28, pit: 0.5, k: 1.1, len: 1.12 };

  function strand(b, col, yaw, w, pTop, pTip, kTop, kTip, curl) {
    const pMid = lerp(pTop, pTip, 0.55), kMid = lerp(kTop, kTip, 0.5) + 0.025;
    const a = headPoint(yaw - w, pTop, kTop), c = headPoint(yaw + w, pTop, kTop);
    const d = headPoint(yaw + w * 0.62 + curl * 0.4, pMid, kMid), e = headPoint(yaw - w * 0.62 + curl * 0.4, pMid, kMid);
    const tip = headPoint(yaw + curl, pTip, kTip);
    const n0 = headNormal(yaw, pTop), n1 = headNormal(yaw, pMid), n2 = headNormal(yaw + curl, pTip);
    b.quad(a, c, d, e, col, null, [n0, n0, n1, n1]);
    b.tri(e, d, tip, col, null, [n1, n1, n2]);
  }

  function fringe(b, H) {
    [[-0.64, 0.1, 0.04], [-0.46, 0.1, -0.02], [-0.28, 0.1, 0.03], [-0.1, 0.09, -0.04], [0.08, 0.09, 0.02], [0.26, 0.1, -0.03], [0.44, 0.1, 0.03], [0.62, 0.1, 0.05]].forEach(([yaw, w, tip], i) => {
      strand(b, i % 3 === 1 ? H.hi : i % 2 ? H.dark : H.mid, yaw, w, 0.6, tip, 1.16, 1.12, -yaw * 0.07);
    });
    [-1, 1].forEach(s => strand(b, H.mid, s * 0.86, 0.12, 0.42, -0.52, 1.14, 1.14, s * 0.05));
    sideLocks(b, H, 0.98, 0.34, 0.058, false);
  }

  function bun(b, H) {
    b.at(0, R * 0.5, -R * 0.82, (h) => {
      h.ellipsoid(0.072, 0.066, 0.064, 10, 6, H.mid);
      h.at(0, 0.0, 0.0, (c) => c.prism(12, 0.074, 0.068, -0.012, 0.074, 0.068, 0.012, H.dark, { capTop: false }));
    });
  }

  const lowEdge = (y) => lerp(lerp(0.2, -0.42, band(y, 0.5, 1.0)), -0.66, band(y, 1.6, 2.4));
  const tipEdge = (y) => (Math.abs(y) < 0.5 ? 0.08 : 0.06) + 0.04 * Math.abs(S(y * 6));
  ['miku', 'mikuBlue', 'mikuDoll'].forEach(id => {
    Cast.SHELLS[id] = { low: lowEdge, tip: tipEdge, k: 1.13, flare: 0.08, extra: (head, back, H) => fringe(head, H) };
  });
  Cast.SHELLS.mikuBun = { low: lowEdge, tip: tipEdge, k: 1.13, flare: 0.08, extra: (head, back, H) => { fringe(head, H); bun(head, H); } };

  function onHead(b, yaw, pit, k, fn) {
    const p = headPoint(yaw, pit, k);
    b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(yaw), M4.rotX(-pit));
    fn(b);
    b.pop();
  }

  function rose(b, r, col, dark) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      b.at(S(a) * r * 0.5, C(a) * r * 0.5, 0, (h) => h.ellipsoid(r * 0.56, r * 0.56, r * 0.3, 7, 4, col));
    }
    b.at(0, 0, r * 0.2, (h) => h.ellipsoid(r * 0.52, r * 0.52, r * 0.38, 8, 4, dark || col));
    b.at(0, 0, r * 0.4, (h) => h.ellipsoid(r * 0.28, r * 0.28, r * 0.22, 6, 3, col));
  }

  function bowShape(b, w, col, tails) {
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * w * 0.55, 0, 0), M4.rotZ(s * 0.3));
      b.ellipsoid(w * 0.55, w * 0.34, w * 0.18, 8, 4, col);
      b.pop();
      if (tails) {
        b.push(M4.translate(s * w * 0.12, -w * 0.1, 0.002), M4.rotZ(s * 0.25));
        b.quad([-w * 0.14, 0, 0], [w * 0.14, 0, 0], [w * 0.2, -tails, 0.01], [-w * 0.08, -tails, 0.01], col, null, NZ);
        b.pop();
      }
    });
    b.ellipsoid(w * 0.2, w * 0.22, w * 0.16, 6, 4, col);
  }

  function ties(kind) {
    return (b) => [-1, 1].forEach(s => onHead(b, s * TAIL.yaw, TAIL.pit, TAIL.k, (h) => {
      if (kind === 'rose') {
        [[-0.02, 0.022, 0.032], [0.026, 0.01, 0.028], [-0.004, -0.026, 0.03]].forEach(([x, y, r]) => h.at(x, y, 0.016, (c) => rose(c, r, CRIMSON, WINE_DARK)));
        [[0.04, -0.03, 0.6], [-0.042, -0.014, -0.7]].forEach(([x, y, a]) => h.push(M4.translate(x, y, 0.01), M4.rotZ(a)).at(0, 0, 0, (c) => c.ellipsoid(0.012, 0.024, 0.004, 5, 3, 0x2a5a2e)).pop());
      } else if (kind === 'bow') {
        h.at(0, 0, 0.018, (c) => bowShape(c, 0.07, INK, 0.07));
      } else if (kind === 'pom') {
        h.at(0, 0, 0.02, (c) => c.ellipsoid(0.03, 0.03, 0.028, 8, 5, FUR));
      } else if (kind === 'flower') {
        h.at(0, 0, 0.016, (c) => rose(c, 0.03, WHITE, IVORY));
      } else {
        const col = kind === 'append' ? 0x2a2a32 : 0x3a3d46;
        h.box(0.056, 0.082, 0.04, col);
        h.at(0, 0, 0.021, (c) => c.box(0.036, 0.052, 0.004, glow(kind === 'append' ? 0xff3848 : TEAL)));
        h.at(0, 0.046, 0.0, (c) => c.box(0.05, 0.01, 0.036, 0x2a2c34));
      }
    }));
  }

  function crown(b) {
    onHead(b, 0.45, 0.95, 1.07, (h) => {
      h.push(M4.rotX(PI / 2 - 0.28), M4.rotZ(-0.22), M4.scale(0.66));
      h.prism(12, 0.05, 0.048, 0, 0.053, 0.051, 0.024, GOLD, { capTop: false, capBottom: true });
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2;
        const nm = [S(a), 0.2, C(a)];
        h.push(M4.translate(S(a) * 0.053, 0.024, C(a) * 0.051), M4.rotY(a));
        h.tri([-0.016, 0, 0], [0.016, 0, 0], [0, 0.042, 0], GOLD, null, [nm, nm, nm]);
        h.at(0, 0.046, 0, (c) => c.ellipsoid(0.007, 0.007, 0.007, 5, 3, WHITE));
        h.pop();
      }
      [[0, RED], [PI * 2 / 3, 0x2a8a5a], [-PI * 2 / 3, RED]].forEach(([a, col]) => h.at(S(a) * 0.055, 0.012, C(a) * 0.053, (c) => c.ellipsoid(0.009, 0.009, 0.006, 6, 3, col)));
      h.pop();
    });
  }

  function headset(col, light) {
    return (b) => [-1, 1].forEach(s => onHead(b, s * PI / 2, -0.04, 1.12, (h) => {
      h.push(M4.rotX(PI / 2));
      h.prism(12, 0.044, 0.05, -0.022, 0.042, 0.048, 0.02, col, { capBottom: true });
      h.at(0, 0.021, 0, (c) => c.prism(12, 0.028, 0.033, 0, 0.026, 0.031, 0.004, glow(light)));
      h.pop();
    }));
  }

  function phones(col, cap) {
    return (b) => {
      [-1, 1].forEach(s => onHead(b, s * PI / 2, -0.06, 1.13, (h) => {
        h.push(M4.rotX(PI / 2));
        h.prism(14, 0.056, 0.062, -0.026, 0.054, 0.06, 0.026, col, { capBottom: true });
        h.at(0, 0.027, 0, (c) => c.prism(14, 0.036, 0.04, 0, 0.034, 0.038, 0.004, cap));
        h.pop();
      }));
      const n = 12;
      for (let i = 0; i < n; i++) {
        const a0 = -PI / 2 + (i / n) * PI, a1 = -PI / 2 + ((i + 1) / n) * PI;
        const p = (a, z) => [S(a) * R * 0.95 * 1.2, C(a) * R * 0.98 * 1.2 - 0.004, z];
        b.quad(p(a0, -0.014), p(a1, -0.014), p(a1, 0.014), p(a0, 0.014), col, null, [[S((a0 + a1) / 2), C((a0 + a1) / 2), 0], [S((a0 + a1) / 2), C((a0 + a1) / 2), 0], [S((a0 + a1) / 2), C((a0 + a1) / 2), 0], [S((a0 + a1) / 2), C((a0 + a1) / 2), 0]]);
      }
    };
  }

  function earmuffs(b) {
    [-1, 1].forEach(s => onHead(b, s * PI / 2, -0.06, 1.14, (h) => h.ellipsoid(0.05, 0.058, 0.04, 10, 6, FUR)));
  }

  function santaHat(b) {
    b.push(M4.rotZ(0.16), M4.rotX(-0.22));
    b.prism(16, R * 1.08, R * 1.1, R * 0.36, R * 1.0, R * 1.02, R * 0.66, FUR, { capTop: false });
    b.prism(14, R * 0.98, R * 1.0, R * 0.62, R * 0.55, R * 0.55, R * 1.25, RED, { capTop: false });
    b.push(M4.translate(0, R * 1.22, 0), M4.rotZ(-1.0));
    b.prism(10, R * 0.56, R * 0.56, 0, 0.012, 0.012, 0.16, RED);
    b.at(0, 0.17, 0, (h) => h.ellipsoid(0.034, 0.034, 0.034, 8, 5, FUR));
    b.pop();
    b.at(R * 0.62, R * 0.62, R * 0.8, (h) => {
      h.ellipsoid(0.016, 0.016, 0.01, 6, 3, RED);
      [-1, 1].forEach(s => h.push(M4.translate(s * 0.018, 0.01, 0), M4.rotZ(s * 0.5)).at(0, 0, 0, (c) => c.ellipsoid(0.02, 0.01, 0.004, 5, 3, GREEN)).pop());
    });
    b.pop();
  }

  function cap(b) {
    b.push(M4.rotZ(-0.12), M4.rotX(-0.12));
    b.prism(16, R * 1.12, R * 1.15, R * 0.42, R * 1.08, R * 1.1, R * 0.92, INK, { capTop: false });
    b.prism(16, R * 1.08, R * 1.1, R * 0.92, R * 1.2, R * 1.08, R * 1.02, INK);
    b.prism(16, R * 1.16, R * 1.19, R * 0.44, R * 1.15, R * 1.18, R * 0.6, RED, { capTop: false });
    b.at(0, R * 0.48, R * 1.16, (h) => {
      h.push(M4.rotX(0.32));
      h.box(0.19, 0.012, 0.1, INK, { base: true });
      h.pop();
    });
    b.at(0, R * 0.66, R * 1.12, (h) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2, a1 = a + PI / 5, a2 = a + (PI * 2) / 5;
        h.tri([0, 0, 0.004], [S(a) * 0.018, C(a) * 0.018, 0.004], [S(a1) * 0.008, C(a1) * 0.008, 0.004], GOLD, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        h.tri([0, 0, 0.004], [S(a1) * 0.008, C(a1) * 0.008, 0.004], [S(a2) * 0.018, C(a2) * 0.018, 0.004], GOLD, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    });
    b.pop();
  }

  function veil(b) {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const fa = i / n - 0.5, fb = (i + 1) / n - 0.5;
      const top = (f) => [f * 0.2, R * 0.66, -R * 0.82 - 0.035 + Math.abs(f) * 0.04];
      const mid = (f) => [f * 0.42, -0.16, -0.17 - 0.03 * C(f * PI)];
      const bot = (f) => [f * 0.62, -0.62, -0.25 - 0.04 * C(f * PI)];
      const col = i % 2 ? WHITE : [0.95, 0.95, 0.96, 0.25];
      b.quad(top(fa), top(fb), mid(fb), mid(fa), col, null, NB);
      b.quad(mid(fa), mid(fb), bot(fb), bot(fa), col, null, NB);
    }
    [-1, 1].forEach(s => onHead(b, s * 2.6, 0.62, 1.16, (h) => h.ellipsoid(0.022, 0.022, 0.014, 6, 3, WHITE)));
  }

  function wreath(b) {
    for (let i = 0; i < 13; i++) {
      const yaw = -PI * 0.86 + (i / 12) * PI * 1.72;
      const col = i % 3 === 0 ? 0x2ab8a8 : i % 3 === 1 ? MINT : 0x58cfc0;
      onHead(b, yaw, 0.6, 1.13, (h) => {
        rose(h, 0.024, col, mixc(col, 0x0a4a44, 0.35));
        h.push(M4.translate(0.022, -0.008, -0.004), M4.rotZ(0.9)).at(0, 0, 0, (c) => c.ellipsoid(0.008, 0.016, 0.003, 5, 3, 0x2a7a50)).pop();
      });
    }
  }

  function lily(b) {
    onHead(b, 1.05, 0.42, 1.14, (h) => {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * PI * 2;
        h.push(M4.rotZ(a), M4.translate(0, 0.016, 0.006), M4.rotX(-0.35));
        h.ellipsoid(0.009, 0.02, 0.004, 5, 3, WHITE);
        h.pop();
      }
      h.at(0, 0, 0.01, (c) => c.ellipsoid(0.006, 0.006, 0.006, 5, 3, YELLOW));
    });
  }

  function fins(b) {
    [-1, 1].forEach(s => onHead(b, s * PI / 2, 0.06, 1.12, (h) => {
      [[0.55, 0.13], [0.95, 0.1], [0.2, 0.08]].forEach(([a, len]) => {
        h.push(M4.translate(0, 0.012, 0.03), M4.rotZ(-s * a), M4.rotX(0.5));
        h.prism(3, 0.02, 0.006, 0, 0.003, 0.002, len, glow(0x5ff0ff, 0.7), { phase: PI / 2 });
        h.pop();
      });
      h.push(M4.rotX(PI / 2));
      h.prism(10, 0.04, 0.046, -0.02, 0.038, 0.044, 0.024, 0x2a2c36, { capBottom: true });
      h.pop();
    }));
  }

  function profile(d, y) {
    const cz = d.depth * 1.04;
    if (y < 0.12) return [lerp(d.waist * 1.1, d.waist, (y + 0.02) / 0.14), lerp(d.depth * 0.95, d.depth * 0.9, (y + 0.02) / 0.14)];
    if (y < 0.26) return [lerp(d.waist, d.chest, (y - 0.12) / 0.14), lerp(d.depth * 0.9, cz, (y - 0.12) / 0.14)];
    if (y < 0.34) return [lerp(d.chest, d.chest * 1.02, (y - 0.26) / 0.08), lerp(cz, d.depth * 0.85, (y - 0.26) / 0.08)];
    return [lerp(d.chest * 1.02, 0.085, (y - 0.34) / (d.torso - 0.34)), lerp(d.depth * 0.85, 0.06, (y - 0.34) / (d.torso - 0.34))];
  }

  function surface(d, a, y, k) {
    const [rx, rz] = profile(d, y);
    return [S(a) * rx * k, y, C(a) * rz * k];
  }

  function wrap(b, d, ys, k, col, o) {
    const opt = o || {};
    const a0 = opt.a0 === undefined ? -PI : opt.a0, a1 = opt.a1 === undefined ? PI : opt.a1;
    const n = opt.n || 16;
    for (let j = 0; j < ys.length - 1; j++) {
      for (let i = 0; i < n; i++) {
        const u0 = lerp(a0, a1, i / n), u1 = lerp(a0, a1, (i + 1) / n), m = (u0 + u1) / 2;
        const nm = V3.norm([S(m), 0.1, C(m)]);
        b.quad(surface(d, u0, ys[j], k), surface(d, u1, ys[j], k), surface(d, u1, ys[j + 1], k), surface(d, u0, ys[j + 1], k), typeof col === 'function' ? col(i, j) : col, null, [nm, nm, nm, nm]);
      }
    }
  }

  function onTorso(d, x, y, k, back) {
    const [rx, rz] = profile(d, y);
    const f = Math.min(0.995, Math.abs(x) / (rx * k));
    const z = rz * k * Math.sqrt(1 - f * f);
    return [x, y, back ? -z : z];
  }

  function strap(b, d, path, w, k, col, back) {
    const nm = back ? NB : NZ;
    for (let i = 0; i < path.length - 1; i++) {
      const [x0, y0] = path[i], [x1, y1] = path[i + 1];
      const dir = V3.norm([x1 - x0, y1 - y0, 0]);
      const nx = -dir[1] * w, ny = dir[0] * w;
      b.quad(onTorso(d, x0 - nx, y0 - ny, k, back), onTorso(d, x1 - nx, y1 - ny, k, back), onTorso(d, x1 + nx, y1 + ny, k, back), onTorso(d, x0 + nx, y0 + ny, k, back), col, null, nm);
    }
  }

  function bowOnTorso(d, x, y, w, col, tails) {
    return (b) => {
      const p = onTorso(d, x, y, 1.08, false);
      b.at(p[0], p[1], p[2] + 0.008, (h) => bowShape(h, w, col, tails));
    };
  }

  const skirtPt = (a, r, y) => [S(a) * r, y, C(a) * r * 0.86];

  function skirtRing(b, o) {
    const n = o.n || 24;
    const a0 = o.a0 === undefined ? -PI : o.a0, a1 = o.a1 === undefined ? PI : o.a1;
    for (let i = 0; i < n; i++) {
      const u0 = lerp(a0, a1, i / n), u1 = lerp(a0, a1, (i + 1) / n), um = (u0 + u1) / 2;
      const t0 = o.top(u0), t1 = o.top(u1), h0 = o.hem(u0, i), h1 = o.hem(u1, i + 1);
      const bulge = o.bulge || 0;
      const m0 = [lerp(t0[0], h0[0], 0.5) + bulge, lerp(t0[1], h0[1], 0.5)], m1 = [lerp(t1[0], h1[0], 0.5) + bulge, lerp(t1[1], h1[1], 0.5)];
      const col = typeof o.col === 'function' ? o.col(i) : o.col;
      const nm = V3.norm([S(um), 0.3, C(um)]);
      const ns = [nm, nm, nm, nm];
      b.quad(skirtPt(u0, t0[0], t0[1]), skirtPt(u1, t1[0], t1[1]), skirtPt(u1, m1[0], m1[1]), skirtPt(u0, m0[0], m0[1]), col, null, ns);
      b.quad(skirtPt(u0, m0[0], m0[1]), skirtPt(u1, m1[0], m1[1]), skirtPt(u1, h1[0], h1[1]), skirtPt(u0, h0[0], h0[1]), col, null, ns);
      if (o.trim) {
        const [th, tc] = o.trim;
        b.quad(skirtPt(u0, h0[0], h0[1]), skirtPt(u1, h1[0], h1[1]), skirtPt(u1, h1[0] + 0.006, h1[1] - th), skirtPt(u0, h0[0] + 0.006, h0[1] - th), tc, null, ns);
      }
    }
  }

  const backness = (a) => (1 - C(a)) / 2;
  const zig = (amp) => (i) => (i % 2 ? amp : 0);

  function scarletSkirt(b) {
    skirtRing(b, { top: () => [0.14, 0.075], hem: (a, i) => [0.23 + zig(0.012)(i), -0.1 - 0.03 * backness(a) + zig(0.012)(i)], col: (i) => (i % 2 ? WINE : CRIMSON), bulge: 0.015 });
    skirtRing(b, { top: () => [0.17, -0.03], hem: (a, i) => [0.27 + zig(0.014)(i), -0.19 - 0.05 * backness(a) + zig(0.016)(i)], col: (i) => (i % 2 ? CRIMSON : WINE), bulge: 0.012, trim: [0.012, INK] });
    skirtRing(b, { top: () => [0.2, -0.12], hem: (a, i) => [0.3 + zig(0.012)(i), -0.25 - 0.07 * backness(a) + zig(0.014)(i)], col: (i) => (i % 2 ? WINE_DARK : WINE), bulge: 0.01, trim: [0.014, INK] });
  }

  function sundressSkirt(b) {
    skirtRing(b, { n: 28, top: () => [0.14, 0.075], hem: (a, i) => [0.3 + 0.01 * S(a * 5) + zig(0.008)(i), -0.6 - 0.04 * backness(a) + 0.012 * S(a * 7)], col: (i) => (i % 2 ? WHITE : IVORY), bulge: 0.03 });
  }

  function brideSkirt(b) {
    const k = (a) => Math.pow(backness(a), 1.6);
    skirtRing(b, { n: 28, top: () => [0.14, 0.075], hem: (a, i) => [0.27 + 0.13 * k(a) + zig(0.01)(i), lerp(-0.2, -0.86, k(a))], col: (i) => (i % 2 ? WHITE : IVORY), bulge: 0.03 });
    skirtRing(b, { n: 20, a0: -1.6, a1: 1.6, top: () => [0.2, -0.06], hem: (a, i) => [0.28 + zig(0.016)(i), -0.22 + zig(0.016)(i)], col: (i) => (i % 2 ? WHITE : 0xf4eff0), bulge: 0.01 });
  }

  function blackSkirt(b) {
    skirtRing(b, { top: () => [0.14, 0.075], hem: (a, i) => [0.27 + zig(0.012)(i), -0.2 - 0.02 * backness(a)], col: (i) => (i % 2 ? BLACK : 0x2a2832), bulge: 0.015 });
    skirtRing(b, { top: (a) => [0.265, -0.19 - 0.02 * backness(a)], hem: (a, i) => [0.285 + zig(0.01)(i), -0.235 - 0.02 * backness(a) + zig(0.012)(i)], col: WHITE });
  }

  function appendSkirt(b) {
    for (let i = 0; i < 6; i++) {
      const a = PI * 0.3 + (i / 5) * PI * 1.4;
      const col = glow(0x5af2c4, 0.75);
      const edge = 0x20262a;
      const p0 = skirtPt(a - 0.24, 0.15, 0.05), p1 = skirtPt(a + 0.24, 0.15, 0.05);
      const p2 = skirtPt(a + 0.2, 0.22, -0.1), p3 = skirtPt(a, 0.26, -0.2), p4 = skirtPt(a - 0.2, 0.22, -0.1);
      const nm = V3.norm([S(a), 0.2, C(a)]);
      b.quad(p0, p1, p2, p4, col, null, [nm, nm, nm, nm]);
      b.tri(p4, p2, p3, col, null, [nm, nm, nm]);
      b.quad(p1, skirtPt(a + 0.26, 0.152, 0.05), skirtPt(a + 0.22, 0.225, -0.1), p2, edge, null, [nm, nm, nm, nm]);
    }
  }

  function pleatSkirt(b) {
    skirtRing(b, { n: 20, top: () => [0.135, 0.075], hem: (a, i) => [0.24 + (i % 2 ? 0.014 : -0.008), -0.2 - 0.015 * backness(a)], col: (i) => (i % 2 ? 0x1b1a22 : 0x2c2a36), bulge: 0.008 });
  }

  function santaSkirt(b) {
    skirtRing(b, { top: () => [0.14, 0.075], hem: (a, i) => [0.27 + zig(0.008)(i), -0.19 - 0.02 * backness(a)], col: (i) => (i % 2 ? RED : 0xb8182a), bulge: 0.016 });
    b.at(0, -0.2, 0, (h) => h.prism(18, 0.285, 0.248, -0.03, 0.29, 0.252, 0.018, FUR));
  }

  function gothicSkirt(b) {
    skirtRing(b, { top: () => [0.15, 0.075], hem: (a, i) => [0.25 + zig(0.012)(i), -0.08 - 0.02 * backness(a) + zig(0.012)(i)], col: (i) => (i % 2 ? BLACK : INK), bulge: 0.02 });
    skirtRing(b, { top: () => [0.22, -0.04], hem: (a, i) => [0.29 + zig(0.014)(i), -0.15 + zig(0.016)(i)], col: (i) => (i % 2 ? WHITE : IVORY), bulge: 0.01 });
    skirtRing(b, { top: () => [0.25, -0.1], hem: (a, i) => [0.32 + zig(0.014)(i), -0.22 - 0.02 * backness(a) + zig(0.016)(i)], col: (i) => (i % 2 ? BLACK : 0x2a2632), bulge: 0.01, trim: [0.018, WHITE] });
  }

  function mintSkirt(b) {
    skirtRing(b, { top: () => [0.15, -0.16], hem: (a, i) => [0.31 + zig(0.012)(i), -0.42 + zig(0.014)(i)], col: (i) => (i % 2 ? MINT : 0x6ccdb2) });
    skirtRing(b, { n: 26, top: () => [0.14, 0.075], hem: (a, i) => [0.3 + zig(0.01)(i), -0.37 - 0.02 * backness(a)], col: (i) => (i % 2 ? WHITE : IVORY), bulge: 0.025, trim: [0.012, TEAL] });
  }

  function shinR(d, y) {
    const f = (y + d.shin) / d.shin;
    return [lerp(0.032, 0.044, f) + 0.003, lerp(0.034, 0.046, f) + 0.003];
  }

  function laces(col) {
    return (b, d) => {
      const y0 = -d.shin + 0.04, y1 = -0.1, n = 5, w = 0.0045;
      for (let i = 0; i < n; i++) {
        const ya = lerp(y0, y1, i / n), yb = lerp(y0, y1, (i + 1) / n);
        [-1, 1].forEach(s => {
          let prev = null;
          for (let q = 0; q <= 4; q++) {
            const a = lerp(s * 1.25, -s * 1.25, q / 4), y = lerp(ya, yb, q / 4);
            const [rx, rz] = shinR(d, y);
            const p = [S(a) * rx, y, C(a) * rz];
            if (prev) {
              const nm = V3.norm([S(a), 0, C(a)]);
              b.quad([prev[0], prev[1] - w, prev[2]], [p[0], p[1] - w, p[2]], [p[0], p[1] + w, p[2]], [prev[0], prev[1] + w, prev[2]], col, null, [nm, nm, nm, nm]);
            }
            prev = p;
          }
        });
      }
      b.prism(12, shinR(d, y1)[0], shinR(d, y1)[1], y1 - 0.006, shinR(d, y1)[0], shinR(d, y1)[1], y1 + 0.006, col, { capTop: false });
      b.at(0.012, y1 + 0.004, shinR(d, y1)[1] * 0.7, (h) => bowShape(h, 0.034, col, 0.03));
    };
  }

  const ringAt = (y, r, h, col, rz) => (b) => b.prism(12, r, rz || r, y - h / 2, r, rz || r, y + h / 2, col, { capTop: false });
  const garter = (col, f) => (b, d) => {
    const y = lerp(-d.thigh, 0.03, f), r = lerp(0.045, 0.072, f) + 0.004;
    b.prism(12, r, r * 1.04, y - 0.007, r, r * 1.04, y + 0.007, col, { capTop: false });
  };

  const bell = (y0, y1, r0, r1, col, edge) => (b) => {
    b.prism(14, r0, r0, y0, r1, r1 * 0.95, y1, col, { capTop: false, capBottom: false });
    if (edge) b.prism(14, r1, r1 * 0.95, y1, r1 + 0.004, r1 * 0.95 + 0.004, y1 - 0.01, edge, { capTop: false, capBottom: false });
  };

  const corsage = (col) => (b, d) => {
    [[0, 0.03], [2.1, 0.026], [4.2, 0.028]].forEach(([a, r]) => b.at(S(a) * 0.036, -d.fore + 0.04, C(a) * 0.036, (h) => h.ellipsoid(r * 0.7, r * 0.6, r * 0.7, 6, 4, col)));
    b.at(0, -d.fore + 0.025, 0.04, (h) => h.ellipsoid(0.012, 0.012, 0.012, 5, 3, 0xf8a020));
  };

  function scarletTop(b, d) {
    wrap(b, d, [0.305, 0.338], 1.035, WINE_DARK, { a0: -1.4, a1: 1.4, n: 10 });
    for (let i = 0; i < 4; i++) {
      const y0 = 0.135 + i * 0.044, y1 = y0 + 0.044;
      strap(b, d, [[-0.022, y0], [0.022, y1]], 0.0035, 1.045, INK);
      strap(b, d, [[0.022, y0], [-0.022, y1]], 0.0035, 1.045, INK);
    }
    strap(b, d, [[-0.05, 0.325], [0.0, 0.362], [0.032, 0.392]], 0.0065, 1.03, WINE);
    strap(b, d, [[0.05, 0.325], [0.0, 0.362], [-0.032, 0.392]], 0.0065, 1.03, WINE);
    b.prism(12, 0.04, 0.038, d.torso + 0.025, 0.04, 0.038, d.torso + 0.05, WINE, { capTop: false });
    b.at(0, d.torso + 0.036, 0.04, (h) => h.ellipsoid(0.011, 0.009, 0.007, 6, 3, WINE_DARK));
    wrap(b, d, [-0.02, 0.03], 1.06, WINE_DARK, { n: 16 });
  }

  function sundressTop(b, d) {
    [false, true].forEach(back => [-1, 1].forEach(s => strap(b, d, [[s * 0.062, 0.33], [s * 0.07, 0.37], [s * 0.074, 0.398]], 0.004, 1.04, WHITE, back)));
    wrap(b, d, [0.318, 0.338], 1.04, IVORY, { a0: -1.5, a1: 1.5, n: 10 });
  }

  function brideTop(b, d) {
    wrap(b, d, [0.318, 0.345], 1.06, (i) => (i % 2 ? WHITE : 0xf2eeee), { a0: -1.5, a1: 1.5, n: 14 });
    [-0.05, -0.02, 0.02, 0.05].forEach(x => strap(b, d, [[x, 0.04], [x * 1.2, 0.32]], 0.0022, 1.04, IVORY));
    wrap(b, d, [-0.01, 0.055], 1.07, HOT, { n: 16 });
    const p = onTorso(d, -0.09, 0.03, 1.1, false);
    b.at(p[0] - 0.01, p[1], p[2] + 0.01, (h) => {
      h.push(M4.rotY(-0.5));
      bowShape(h, 0.11, HOT, 0.0);
      [-1, 1].forEach(s => {
        h.push(M4.translate(s * 0.012, -0.02, 0.004), M4.rotZ(s * 0.18));
        h.quad([-0.016, 0, 0], [0.016, 0, 0], [0.03, -0.3, 0.02], [-0.004, -0.3, 0.02], HOT, null, NZ);
        h.pop();
      });
      h.pop();
    });
  }

  function blackTop(b, d) {
    const top = d.torso;
    [-1, 1].forEach(s => {
      const n = [[s * 0.3, 0.3, 1], [s * 0.3, 0.3, 1], [s * 0.3, 0.3, 1]];
      b.tri([s * 0.006, top - 0.002, 0.066], [s * 0.074, top - 0.02, 0.052], [s * 0.03, top - 0.066, 0.086], WHITE, null, n);
    });
    b.prism(12, 0.039, 0.037, top + 0.0, 0.038, 0.036, top + 0.03, WHITE, { capTop: false });
    b.at(0, top - 0.035, 0.088, (h) => bowShape(h, 0.05, INK, 0.05));
    [0.24, 0.18, 0.12].forEach(y => { const p = onTorso(d, 0, y, 1.03, false); b.at(p[0], p[1], p[2], (h) => h.ellipsoid(0.006, 0.006, 0.003, 5, 3, 0x6a6a74)); });
  }

  function sleekTop(b, d) {
    [-0.034, 0.034].forEach(x => strap(b, d, [[x, -0.01], [x * 0.9, 0.2], [x * 1.4, 0.36]], 0.0035, 1.04, SILVER));
    strap(b, d, [[-0.12, 0.27], [0, 0.31], [0.12, 0.27]], 0.0035, 1.045, SILVER);
    b.prism(12, 0.042, 0.04, d.torso + 0.07, 0.042, 0.04, d.torso + 0.085, SILVER, { capTop: false });
    b.at(0, 0.2, d.depth * 1.04 + 0.004, (h) => h.ellipsoid(0.012, 0.012, 0.004, 6, 3, glow(0x5ff0ff, 0.8)));
  }

  function appendTop(b, d) {
    b.prism(12, 0.041, 0.039, d.torso + 0.06, 0.041, 0.039, d.torso + 0.072, glow(0x46e8d0, 0.7), { capTop: false });
    strap(b, d, [[0, 0.385], [0, 0.3]], 0.008, 1.04, glow(0x46e8d0, 0.55));
    wrap(b, d, [-0.02, 0.012], 1.05, 0x23232b, { n: 16 });
  }

  function suitTop(b, d) {
    const top = d.torso;
    b.tri(onTorso(d, -0.05, 0.395, 1.035, false), onTorso(d, 0.05, 0.395, 1.035, false), onTorso(d, 0, 0.22, 1.035, false), WHITE, null, [[0, 0.2, 1], [0, 0.2, 1], [0, 0.2, 1]]);
    strap(b, d, [[0, 0.385], [0, 0.24], [0, 0.2]], 0.009, 1.045, INK);
    [-1, 1].forEach(s => strap(b, d, [[s * 0.055, 0.39], [s * 0.035, 0.27], [s * 0.004, 0.16]], 0.012, 1.05, 0x2c2b36));
    const p = onTorso(d, 0.085, 0.29, 1.08, false);
    b.at(p[0], p[1], p[2], (h) => rose(h, 0.018, RED, 0x8a1020));
    b.prism(12, 0.039, 0.037, top + 0.0, 0.038, 0.036, top + 0.03, WHITE, { capTop: false });
  }

  function santaTop(b, d) {
    b.prism(16, d.chest * 1.0, d.depth * 1.25, 0.335, 0.075, 0.066, d.torso + 0.02, FUR, { capTop: false });
    b.prism(16, d.chest * 1.08, d.depth * 1.3, 0.31, d.chest * 1.0, d.depth * 1.25, 0.338, FUR, { capTop: false });
    const p = onTorso(d, 0, 0.34, 1.32, false);
    b.at(p[0], p[1] - 0.01, p[2] + 0.004, (h) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2, a1 = a + PI / 5, a2 = a + (PI * 2) / 5;
        h.tri([0, 0, 0.004], [S(a) * 0.024, C(a) * 0.024, 0.004], [S(a1) * 0.01, C(a1) * 0.01, 0.004], GOLD, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        h.tri([0, 0, 0.004], [S(a1) * 0.01, C(a1) * 0.01, 0.004], [S(a2) * 0.024, C(a2) * 0.024, 0.004], GOLD, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    });
    [-1, 1].forEach(s => { const q = onTorso(d, s * 0.03, 0.27, 1.12, false); b.at(q[0], q[1], q[2] + 0.01, (h) => h.ellipsoid(0.017, 0.017, 0.016, 8, 4, FUR)); });
    wrap(b, d, [-0.02, 0.02], 1.06, 0x7a1018, { n: 16 });
  }

  function gothicTop(b, d) {
    const top = d.torso;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2, a1 = ((i + 1) / 12) * PI * 2;
      const r0 = 0.041, r1 = 0.07;
      const nm = V3.norm([S((a + a1) / 2), 0.5, C((a + a1) / 2)]);
      b.quad([S(a) * r0, top + 0.06, C(a) * r0], [S(a1) * r0, top + 0.06, C(a1) * r0], [S(a1) * r1, top + 0.03 - (i % 2) * 0.012, C(a1) * r1], [S(a) * r1, top + 0.03 - (i % 2 ? 0 : 0.012), C(a) * r1], WHITE, null, [nm, nm, nm, nm]);
    }
    for (let i = 0; i < 5; i++) {
      const y0 = 0.13 + i * 0.042, y1 = y0 + 0.038;
      [-1, 1].forEach(s => b.tri(onTorso(d, 0, y0, 1.05, false), onTorso(d, 0, y1, 1.05, false), onTorso(d, s * 0.04, (y0 + y1) / 2 - 0.006, 1.05, false), WHITE, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]));
    }
    b.at(0, top + 0.02, 0.07, (h) => bowShape(h, 0.05, INK, 0.04));
    for (let i = 0; i < 3; i++) {
      const y0 = 0.0 + i * 0.035, y1 = y0 + 0.035;
      strap(b, d, [[-0.02, y0], [0.02, y1]], 0.003, 1.05, WHITE);
      strap(b, d, [[0.02, y0], [-0.02, y1]], 0.003, 1.05, WHITE);
    }
  }

  function punkTop(b, d) {
    wrap(b, d, [0.13, 0.15], 1.04, 0x2c2c36, { n: 16 });
    wrap(b, d, [0.318, 0.338], 1.04, 0x2c2c36, { a0: -1.6, a1: 1.6, n: 10 });
    b.prism(12, 0.039, 0.037, d.torso + 0.03, 0.039, 0.037, d.torso + 0.052, INK, { capTop: false });
    b.at(0, d.torso + 0.03, 0.04, (h) => h.prism(8, 0.01, 0.01, -0.004, 0.01, 0.01, 0.004, SILVER, { capTop: false }));
  }

  function punkBelt(b, d) {
    b.prism(14, 0.13, d.depth * 1.08, 0.04, 0.124, d.depth * 1.04, 0.075, 0x2a1e18, { capTop: false });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2;
      b.at(S(a) * 0.132, 0.057, C(a) * d.depth * 1.1, (h) => h.ellipsoid(0.006, 0.006, 0.006, 4, 2, SILVER));
    }
    b.at(0.06, 0.13, 0.085, (h) => {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * PI * 2, a1 = a + PI / 5, a2 = a + (PI * 2) / 5;
        h.tri([0, 0, 0.002], [S(a) * 0.014, C(a) * 0.014, 0.002], [S(a1) * 0.006, C(a1) * 0.006, 0.002], INK, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        h.tri([0, 0, 0.002], [S(a1) * 0.006, C(a1) * 0.006, 0.002], [S(a2) * 0.014, C(a2) * 0.014, 0.002], INK, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
      }
    });
  }

  function mintTop(b, d) {
    wrap(b, d, [0.15, 0.18], 1.045, MINT, { n: 16 });
    wrap(b, d, [0.318, 0.346], 1.065, (i) => (i % 2 ? WHITE : 0xf0f6f4), { a0: -1.6, a1: 1.6, n: 14 });
    bowOnTorso(d, 0, 0.165, 0.05, 0x5cc8b0, 0.05)(b);
    const p = onTorso(d, 0, 0.3, 1.1, false);
    b.at(p[0], p[1], p[2], (h) => rose(h, 0.02, 0x2ab8a8, 0x15766c));
  }

  const scarletCuff = (b, d) => {
    bell(-0.09, -d.fore - 0.01, 0.034, 0.064, WINE, INK)(b);
    bell(-0.15, -d.fore - 0.03, 0.044, 0.074, CRIMSON, INK)(b);
  };

  function micMesh(b) {
    const L = MIC_LEN;
    b.prism(8, 0.012, 0.012, 0.03, 0.0105, 0.0105, L - 0.11, IVORY, { capBottom: true, capTop: false });
    b.at(0, 0.025, 0, (h) => h.ellipsoid(0.019, 0.026, 0.019, 8, 4, SILVER));
    for (let i = 0; i < 4; i++) b.at(0, 0.33 + i * 0.26, 0, (h) => h.ellipsoid(0.016, 0.024, 0.016, 8, 4, SILVER));
    for (let i = 0; i < 26; i++) {
      const y0 = 0.08 + i * 0.048, y1 = y0 + 0.05, a0 = i * 0.95, a1 = a0 + 0.95;
      const r = 0.0135;
      const nm = [S(a0), 0, C(a0)];
      b.quad([S(a0) * r, y0, C(a0) * r], [S(a1) * r, y1, C(a1) * r], [S(a1) * r, y1 + 0.012, C(a1) * r], [S(a0) * r, y0 + 0.012, C(a0) * r], 0xf0d8e4, null, [nm, nm, nm, nm]);
    }
    b.at(0, L - 0.11, 0, (h) => h.prism(10, 0.012, 0.012, 0, 0.026, 0.026, 0.04, SILVER, { capTop: true }));
    b.at(0, L - 0.055, 0, (h) => h.ellipsoid(0.028, 0.034, 0.028, 10, 6, [0.86, 0.88, 0.92, 0.25]));
    b.push(M4.translate(0, L - 0.012, 0), M4.rotX(-PI / 2));
    rose(b, 0.052, glow(0xff5cb6, 0.85), glow(0xe02c8a, 0.8));
    b.pop();
    [-1, 1].forEach(s => {
      b.push(M4.translate(s * 0.028, L - 0.06, 0), M4.rotZ(-s * 1.0));
      b.ellipsoid(0.01, 0.026, 0.004, 5, 3, 0x2f7a46);
      b.pop();
    });
  }

  const MIC_LEN = 1.42;

  const TAIL_W = (f) => (f < 0.07 ? lerp(0.028, 0.068, f / 0.07) : f < 0.45 ? lerp(0.068, 0.084, (f - 0.07) / 0.38) : f < 0.84 ? lerp(0.084, 0.054, (f - 0.45) / 0.39) : lerp(0.054, 0.005, (f - 0.84) / 0.16));
  const SIDES = 8;

  function tailMesh(b, pts, lat, H) {
    const n = pts.length;
    const rings = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)];
      const T = V3.norm(V3.sub(c, a));
      let W = V3.sub(lat, V3.mul(T, V3.dot(lat, T)));
      if (V3.len(W) < 1e-4) W = Math.abs(T[0]) < 0.9 ? V3.cross(T, [1, 0, 0]) : V3.cross(T, [0, 0, 1]);
      W = V3.norm(W);
      const N = V3.cross(T, W);
      const w = TAIL_W(i / (n - 1)), h = w * 0.42;
      const ring = [];
      for (let j = 0; j < SIDES; j++) {
        const an = (j / SIDES) * PI * 2;
        const cw = C(an), sw = S(an);
        ring.push({ p: V3.add(pts[i], V3.add(V3.mul(W, cw * w), V3.mul(N, sw * h))), n: V3.norm(V3.add(V3.mul(W, cw / w), V3.mul(N, sw / h))) });
      }
      rings.push(ring);
    }
    const shadeOf = (j, f) => {
      const base = H.tip ? mixc(H.mid, H.tip, Math.min(1, f * 1.15)) : rgb(H.mid);
      if (j % 4 === 1) return mixc(base, H.tip ? mixc(H.hi, H.tip, f) : H.hi, 0.55);
      if (j % 4 === 3) return mixc(base, H.dark, 0.45);
      return base;
    };
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < SIDES; j++) {
        const j2 = (j + 1) % SIDES;
        const f0 = i / (n - 1), f1 = (i + 1) / (n - 1);
        const c0 = shadeOf(j, f0), c1 = shadeOf(j, f1);
        b.quad(rings[i][j].p, rings[i][j2].p, rings[i + 1][j2].p, rings[i + 1][j].p, [c0, c0, c1, c1], null, [rings[i][j].n, rings[i][j2].n, rings[i + 1][j2].n, rings[i + 1][j].n]);
      }
    }
  }

  const BARE = (shoe) => ({ thigh: [[0, 1, SKIN]], shin: [[0, 1, SKIN]], shoe });
  const HEEL = (col) => ({ type: 'heel', col, sole: col });
  const BOOT = (col, sole) => ({ type: 'boot', col, sole: sole || col });

  const FORMS = {
    mikuScarlet: {
      person: 'miku', skin: SKIN, hair: 'miku', bust: 0.5, scale: 0.98,
      torso: { waist: WINE, chest: WINE, top: SKIN, shoulder: SKIN, neck: SKIN }, torsoExtras: [scarletTop],
      hips: WINE, skirt: { build: scarletSkirt },
      arm: { upper: [[0, 0.1, WINE], [0.1, 1, SKIN]], fore: [[0, 1, SKIN]], hand: SKIN, foreExtras: [scarletCuff] },
      leg: Object.assign(BARE(HEEL(RED)), { shinExtras: [laces(RED)] }),
      gear: [ties('rose'), crown], tails: { hair: 'miku' }
    },
    mikuSundress: {
      person: 'miku', skin: SKIN, hair: 'miku', bust: 0.5, scale: 0.98,
      torso: { waist: WHITE, chest: WHITE, top: SKIN, shoulder: SKIN, neck: SKIN }, torsoExtras: [sundressTop],
      hips: WHITE, skirt: { build: sundressSkirt },
      arm: { upper: [[0, 1, SKIN]], fore: [[0, 1, SKIN]], hand: SKIN, foreExtras: [ringAt(-0.17, 0.034, 0.012, 0x3ab07a)] },
      leg: BARE({ type: 'flat', col: SKIN, sole: 0xeec8b8 }),
      gear: [ties('flower'), phones(0xd42838, 0x2a2a30), lily], tails: { hair: 'miku' }
    },
    mikuBride: {
      person: 'miku', skin: SKIN, hair: 'mikuBun', bust: 0.5, scale: 0.98,
      torso: { waist: WHITE, chest: WHITE, top: SKIN, shoulder: SKIN, neck: SKIN }, torsoExtras: [brideTop],
      hips: WHITE, skirt: { build: brideSkirt },
      arm: { upper: [[0, 0.32, WHITE], [0.32, 1, SKIN]], fore: [[0, 1, WHITE]], hand: WHITE, foreExtras: [corsage(YELLOW)] },
      leg: { thigh: [[0, 0.8, WHITE], [0.8, 1, SKIN]], shin: [[0, 1, WHITE]], shoe: HEEL(WHITE) },
      gear: [veil, phones(0xd8dce4, 0xa8b0bc)], tails: null
    },
    mikuBlack: {
      person: 'miku', skin: SKIN, hair: 'miku', bust: 0.5, scale: 0.98,
      torso: { waist: BLACK, chest: BLACK, top: BLACK, shoulder: SKIN, neck: SKIN }, torsoExtras: [blackTop],
      hips: BLACK, skirt: { build: blackSkirt },
      arm: { upper: [[0, 1, SKIN]], fore: [[0, 0.82, BLACK], [0.82, 1, SKIN]], hand: SKIN, foreExtras: [bell(-0.03, -0.07, 0.036, 0.046, BLACK)] },
      leg: { thigh: [[0, 0.7, BLACK], [0.7, 1, SKIN]], shin: [[0, 1, BLACK]], shoe: { type: 'flat', col: INK, sole: 0x2c2c32 } },
      gear: [ties('classic'), headset(0x34363e, TEAL)], tails: { hair: 'miku' }
    },
    mikuSleek: {
      person: 'miku', skin: SKIN, hair: 'miku', bust: 0.5, scale: 0.98,
      torso: { waist: GLOSS, chest: GLOSS, top: GLOSS, shoulder: GLOSS, neck: GLOSS }, torsoExtras: [sleekTop],
      hips: GLOSS, skirt: null,
      arm: { upper: [[0, 1, GLOSS]], fore: [[0, 1, WHITE]], hand: WHITE, upperExtras: [ringAt(-0.24, 0.04, 0.01, SILVER)] },
      leg: { thigh: [[0, 1, GLOSS]], shin: [[0, 1, GLOSS]], shoe: BOOT(GLOSS), thighExtras: [garter(SILVER, 0.7)] },
      gear: [ties('classic'), fins], tails: { hair: 'miku' }
    },
    mikuAppend: {
      person: 'miku', skin: SKIN, hair: 'miku', bust: 0.5, scale: 0.98,
      torso: { waist: SILVER, chest: SILVER, top: SILVER, shoulder: SKIN, neck: SILVER }, torsoExtras: [appendTop],
      hips: INK, skirt: { build: appendSkirt },
      arm: { upper: [[0, 0.82, INK], [0.82, 1, SKIN]], fore: [[0, 1, INK]], hand: INK, upperExtras: [ringAt(-0.04, 0.04, 0.006, glow(0x46e8d0, 0.6))] },
      leg: { thigh: [[0, 0.72, 0x2a2a32], [0.72, 0.9, SKIN], [0.9, 1, INK]], shin: [[0, 1, 0x2a2a32]], shoe: BOOT(0x1e1e24) },
      hipExtras: [(b) => b.at(0.112, 0.0, 0.04, (h) => { h.push(M4.rotY(1.1)); h.prism(14, 0.03, 0.03, -0.004, 0.03, 0.03, 0.006, glow(0xff2838, 0.8)); h.pop(); })],
      gear: [ties('append'), headset(0x2c2e36, 0xff3848)], tails: { hair: 'miku' }
    },
    mikuSuit: {
      person: 'miku', skin: SKIN, hair: 'mikuBlue', bust: 0.5, scale: 0.98,
      torso: { waist: BLACK, chest: BLACK, top: BLACK, shoulder: BLACK, neck: SKIN }, torsoExtras: [suitTop],
      hips: BLACK, skirt: { build: pleatSkirt },
      arm: { upper: [[0, 1, BLACK]], fore: [[0, 0.1, WHITE], [0.1, 1, BLACK]], hand: SKIN },
      leg: { thigh: [[0, 1, SKIN]], shin: [[0, 0.78, INK], [0.78, 1, SKIN]], shoe: { type: 'flat', col: INK, sole: 0x2c2c32 } },
      gear: [ties('classic')], tails: { hair: 'mikuBlue' }
    },
    mikuSanta: {
      person: 'miku', skin: SKIN, hair: 'miku', bust: 0.5, scale: 0.98,
      torso: { waist: RED, chest: RED, top: RED, shoulder: RED, neck: SKIN }, torsoExtras: [santaTop],
      hips: RED, skirt: { build: santaSkirt },
      arm: { upper: [[0, 0.3, RED], [0.3, 0.86, SKIN], [0.86, 1, RED]], fore: [[0, 1, RED]], hand: RED, upperExtras: [ringAt(-0.17, 0.05, 0.03, FUR)] },
      leg: { thigh: [[0, 0.62, WHITE], [0.62, 1, SKIN]], shin: [[0, 0.42, RED], [0.42, 1, WHITE]], shoe: BOOT(RED, 0x8a1018), thighExtras: [garter(GREEN, 0.6)], shinExtras: [ringAt(-0.21, 0.05, 0.03, FUR)] },
      gear: [ties('pom'), santaHat, earmuffs], tails: { hair: 'miku' }
    },
    mikuGothic: {
      person: 'mikuDoll', skin: PALE, hair: 'mikuDoll', bust: 0.5, scale: 0.98,
      torso: { waist: BLACK, chest: BLACK, top: BLACK, shoulder: BLACK, neck: PALE }, torsoExtras: [gothicTop],
      hips: BLACK, skirt: { build: gothicSkirt },
      arm: { upper: [[0, 1, BLACK]], fore: [[0, 1, BLACK]], hand: WHITE, foreExtras: [bell(-0.12, -0.24, 0.036, 0.078, WHITE, IVORY)] },
      leg: { thigh: [[0, 0.7, INK], [0.7, 1, PALE]], shin: [[0, 1, INK]], shoe: BOOT(INK, 0x30303a) },
      gear: [ties('bow'), headset(0x1c1c24, 0x9a6aff)], tails: { hair: 'mikuDoll' }
    },
    mikuPunk: {
      person: 'miku', skin: SKIN, hair: 'miku', bust: 0.5, scale: 0.98,
      torso: { waist: SKIN, chest: INK, top: SKIN, shoulder: SKIN, neck: SKIN }, torsoExtras: [punkTop],
      hips: INK, hipExtras: [punkBelt], skirt: null,
      arm: { upper: [[0, 1, SKIN]], fore: [[0, 0.72, INK], [0.72, 1, SKIN]], hand: INK },
      leg: { thigh: [[0, 0.8, FISH], [0.8, 1, INK]], shin: [[0, 0.58, INK], [0.58, 0.82, 0x3a3a44], [0.82, 1, FISH]], shoe: BOOT(INK, 0x2a2a30) },
      gear: [ties('classic'), cap, headset(0x1c1c22, RED)], tails: { hair: 'miku' }
    },
    mikuMint: {
      person: 'mikuMint', skin: SKIN, hair: 'miku', bust: 0.5, scale: 0.98,
      torso: { waist: WHITE, chest: WHITE, top: SKIN, shoulder: SKIN, neck: SKIN }, torsoExtras: [mintTop],
      hips: WHITE, skirt: { build: mintSkirt },
      arm: { upper: [[0, 0.28, WHITE], [0.28, 1, SKIN]], fore: [[0, 1, WHITE]], hand: SKIN, foreExtras: [bell(-0.04, -0.26, 0.04, 0.09, WHITE, MINT), corsage(0x4ac6b4)] },
      leg: { thigh: [[0, 0.74, WHITE], [0.74, 1, SKIN]], shin: [[0, 1, WHITE]], shoe: HEEL(WHITE), thighExtras: [garter(MINT, 0.74)] },
      gear: [wreath, phones(0xf060a8, 0xfad0e4)], tails: { hair: 'miku' }
    }
  };
  Object.assign(Cast.FORMS, FORMS);

  window.P3DRomeoCast = { FORMS, HAIRS, TAIL, MIC_LEN, micMesh, tailMesh };
})();
