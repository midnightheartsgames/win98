(function () {
  const { M4, V3, rgb } = window.P3D;
  const Cast = window.P3DCccCast;
  const UTS = window.P3DUhnTissCast;
  const GK = window.P3DGodKnowsCast;
  const { headPoint, headNormal, band } = Cast;

  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const NZ3 = [[0, 0.2, 1], [0, 0.2, 1], [0, 0.2, 1]];

  const mixc = (a, b, k) => {
    const x = rgb(a), y = rgb(b);
    return [lerp(x[0], y[0], k), lerp(x[1], y[1], k), lerp(x[2], y[2], k), 0];
  };
  const shade = (c, k) => {
    const v = rgb(c);
    return [Math.min(1, v[0] * k), Math.min(1, v[1] * k), Math.min(1, v[2] * k), v[3]];
  };
  const shine = (c, e) => {
    const v = rgb(c);
    return [v[0], v[1], v[2], e];
  };

  const person = (o) => Object.assign({
    paint: UTS.paintFace, eyeW: 1, eyeH: 1, irisR: 7.6, lashW: 2.6, browW: 6.4, mouthW: 1, lipFull: 0.8,
    iris: ['#2a1608', '#6a4224', '#a8784c'], lash: '#2a1a12', brow: '#3a2818', mouth: '#4a1416'
  }, o);
  const maleLip = (skin) => mixc(skin, 0xa83a3a, 0.32);

  const SINGER_SKIN = 0xf2d0b4;
  const KEYS_SKIN = 0xf6dcc8;
  const SYNTH_SKIN = 0xe8c4a4;
  const GIRL_SKIN = 0xf8dccb;
  const SILVER_SKIN = 0xf4d8cc;
  const TWIN_SKIN = 0xf8e0d6;

  Object.assign(Cast.PEOPLE, {
    rsSinger: person({ skin: SINGER_SKIN, lipHex: maleLip(SINGER_SKIN), eyeW: 1.05, irisR: 7.8, mouthW: 1.25, iris: ['#1a1008', '#4a3020', '#8a6040'], lash: '#141010', brow: '#141012', browW: 7 }),
    rsKeys: person({ skin: KEYS_SKIN, lipHex: maleLip(KEYS_SKIN), iris: ['#10283a', '#2a5a7a', '#6aa0c0'], brow: '#9a4a1e', freckles: true }),
    rsSynth: person({ skin: SYNTH_SKIN, lipHex: maleLip(SYNTH_SKIN), iris: ['#140a04', '#3a2210', '#6a4426'], brow: '#120c0a', stubble: 0x2a1a10 }),
    rsGirl: person({ skin: GIRL_SKIN, lipHex: 0xe2868a, eyeW: 1.12, eyeH: 1.22, irisR: 9, lashW: 3, browW: 4.6, brow: '#4a2a18', mouthW: 0.85, lipFull: 0.9, blush: true }),
    rsSilver: person({ skin: SILVER_SKIN, lipHex: 0xc83a6a, lipFull: 1.05, mouthW: 0.92, eyeW: 1.04, eyeH: 1.1, irisR: 8, iris: ['#0a1a2a', '#2a5a8a', '#7ab0e0'], lashW: 3.8, browW: 4.2, brow: '#3a2a3a', liner: true, lashes: true, shadow: 0x8a5ab0, blush: true }),
    rsTwin: person({ skin: TWIN_SKIN, lipHex: 0xd02a4a, mouthW: 0.9, eyeH: 1.08, irisR: 8, lashW: 3.6, browW: 4, brow: '#c89aa8', liner: true, lashes: true, blush: true })
  });

  Object.assign(Cast.HAIR, {
    rsSinger: { mid: 0x1a1614, hi: 0x3a3230, dark: 0x0c0a0a },
    rsSingerPoster: { mid: 0x1a1614, hi: 0x5a5250, dark: 0x0c0a0a },
    rsKeys: { mid: 0xb4602e, hi: 0xd8844a, dark: 0x7a3a18 },
    rsSynth: { mid: 0x221a16, hi: 0x40342c, dark: 0x120e0c },
    rsGirl: { mid: 0x4a2c1a, hi: 0x6a4428, dark: 0x2e1a0e },
    rsSilver: { mid: 0xc8409e, hi: 0xf088cc, dark: 0x7a2a8a },
    rsTwin: { mid: 0xf2ccd8, hi: 0xfff0f4, dark: 0xd0a4b4 }
  });

  function strand(b, col, yaw, w, pTop, pTip, kTop, kTip, curl) {
    const pMid = lerp(pTop, pTip, 0.55), kMid = lerp(kTop, kTip, 0.5) + 0.02;
    const a = headPoint(yaw - w, pTop, kTop), c = headPoint(yaw + w, pTop, kTop);
    const d = headPoint(yaw + w * 0.6 + curl * 0.4, pMid, kMid), e = headPoint(yaw - w * 0.6 + curl * 0.4, pMid, kMid);
    const tip = headPoint(yaw + curl, pTip, kTip);
    const n0 = headNormal(yaw, pTop), n1 = headNormal(yaw, pMid), n2 = headNormal(yaw + curl, pTip);
    b.quad(a, c, d, e, col, null, [n0, n0, n1, n1]);
    b.tri(e, d, tip, col, null, [n1, n1, n2]);
  }

  function quiff(b, H) {
    b.push(M4.translate(0, 0.104, 0.052), M4.rotX(-0.42));
    b.ellipsoid(0.088, 0.046, 0.08, 10, 5, H.mid);
    b.pop();
    b.push(M4.translate(0.012, 0.118, 0.096), M4.rotX(-0.7), M4.rotZ(-0.12));
    b.ellipsoid(0.062, 0.03, 0.05, 8, 4, H.hi);
    b.pop();
    [-1, 1].forEach(s => {
      const p = headPoint(s * 1.3, -0.26, 1.02);
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(s * 1.3));
      b.box(0.012, 0.056, 0.026, H.dark);
      b.pop();
    });
  }

  function featherFlicks(b, H) {
    [-1, 1].forEach(s => {
      [[1.25, 0.08], [1.55, 0.09], [1.9, 0.09]].forEach(([yaw, w], i) => strand(b, i % 2 ? H.hi : H.mid, s * yaw, w, -0.2, -0.62, 1.12, 1.28, s * 0.22));
    });
    [[-0.5, 0.11], [-0.25, 0.11], [0.0, 0.11], [0.25, 0.1]].forEach(([yaw, w], i) => strand(b, i % 2 ? H.mid : H.hi, yaw, w, 0.5, 0.16 + yaw * 0.12, 1.13, 1.16, 0.18));
  }

  function pigtails(b, H) {
    [-1, 1].forEach(s => {
      const p = headPoint(s * 1.95, -0.32, 1.06);
      b.push(M4.translate(p[0], p[1], p[2]), M4.rotY(s * 0.5), M4.rotZ(s * 0.18), M4.rotX(0.18));
      b.ellipsoid(0.026, 0.022, 0.026, 8, 4, [0.86, 0.12, 0.16, 0.12]);
      b.prism(8, 0.03, 0.03, -0.25, 0.012, 0.012, -0.012, H.mid, { capBottom: true });
      b.at(0, -0.24, 0, (h) => h.ellipsoid(0.014, 0.022, 0.014, 6, 3, H.dark));
      b.pop();
    });
  }

  const TINSEL = [[0.94, 0.42, 0.78, 0.3], [0.76, 0.16, 0.6, 0.3], [0.54, 0.3, 0.86, 0.3], [0.24, 0.42, 0.92, 0.3], [0.86, 0.86, 0.92, 0.35], [0.98, 0.56, 0.86, 0.3]];

  function tinsel(b) {
    for (let i = 0; i < 26; i++) {
      const yaw = -PI + (i / 26) * PI * 2 + 0.06 * S(i * 3.1);
      const front = Math.abs(yaw) < 0.75;
      const tip = front ? 0.18 + 0.06 * S(i * 1.7) : -0.42 - 0.18 * Math.abs(S(i * 2.3));
      strand(b, TINSEL[i % TINSEL.length], yaw, 0.1, 0.62, tip, 1.15, front ? 1.18 : 1.34, 0.18 * S(i * 1.3));
    }
    for (let i = 0; i < 18; i++) {
      const yaw = -PI + (i / 18) * PI * 2 + 0.11;
      strand(b, TINSEL[(i + 3) % TINSEL.length], yaw, 0.08, 1.1, Math.abs(yaw) < 0.75 ? 0.32 : -0.1, 1.22, 1.32, -0.2 * S(i * 2.1));
    }
  }

  Object.assign(Cast.SHELLS, {
    rsSinger: {
      low: (y) => lerp(lerp(0.4 - 0.08 * Math.abs(y), -0.16, band(y, 0.55, 1.15)), -0.72, band(y, 1.7, 2.5)),
      tip: () => 0.04, k: 1.08, flare: 0.04,
      extra: (head, back, H) => quiff(head, H)
    },
    rsKeys: {
      low: (y) => lerp(lerp(0.12 + 0.14 * clamp(y / 0.6, -1, 1), -0.42, band(y, 0.6, 1.2)), -0.85, band(y, 1.7, 2.5)),
      tip: (y) => (Math.abs(y) < 0.6 ? 0.1 : 0.12), k: 1.11, flare: 0.14,
      extra: (head, back, H) => featherFlicks(head, H)
    },
    rsSynth: {
      low: (y) => lerp(lerp(0.34, -0.2, band(y, 0.5, 1.2)), -0.72, band(y, 1.7, 2.5)),
      tip: () => 0.04, k: 1.07, flare: 0.03
    },
    rsGirl: {
      low: (y) => lerp(lerp(0.07, -0.66, band(y, 0.55, 0.9)), -0.95, band(y, 1.6, 2.4)),
      tip: (y) => (Math.abs(y) < 0.55 ? 0.05 : 0.08), k: 1.1, flare: 0.1,
      extra: (head, back, H) => pigtails(head, H)
    },
    rsSilver: {
      low: (y) => lerp(lerp(0.22, -0.48, band(y, 0.5, 1.0)), -0.6, band(y, 1.6, 2.4)),
      tip: () => 0.05, k: 1.12, flare: 0.1,
      extra: (head) => tinsel(head)
    },
    rsTwin: {
      low: (y) => lerp(lerp(0.06, -0.56, band(y, 0.55, 0.75)), -0.6, band(y, 1.6, 2.4)),
      tip: () => 0.02, k: 1.12, flare: 0.14
    }
  });
  Cast.SHELLS.rsSingerPoster = Cast.SHELLS.rsSinger;

  function roundRect(hw, hh, rad, n) {
    const pts = [];
    [[hw - rad, hh - rad, 0], [-(hw - rad), hh - rad, PI / 2], [-(hw - rad), -(hh - rad), PI], [hw - rad, -(hh - rad), PI * 1.5]].forEach(([cx, cy, a0]) => {
      for (let i = 0; i <= n; i++) {
        const a = a0 + (i / n) * (PI / 2);
        pts.push([cx + C(a) * rad, cy + S(a) * rad]);
      }
    });
    return pts;
  }

  function ring(b, outer, inner, z, col) {
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length;
      b.quad([outer[i][0], outer[i][1], z], [outer[j][0], outer[j][1], z], [inner[j][0], inner[j][1], z], [inner[i][0], inner[i][1], z], col, null, NZ);
    }
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length;
      const nm = V3.norm([outer[i][0] + outer[j][0], outer[i][1] + outer[j][1], 0]);
      b.quad([outer[i][0], outer[i][1], z - 0.007], [outer[j][0], outer[j][1], z - 0.007], [outer[j][0], outer[j][1], z], [outer[i][0], outer[i][1], z], col, null, [nm, nm, nm, nm]);
    }
  }

  function bar(b, a, c, w, col) {
    const d = V3.sub(c, a);
    const len = V3.len(d);
    b.push(M4.translate((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), M4.rotY(Math.atan2(d[0], d[2])), M4.rotX(-Math.asin(d[1] / len)));
    b.box(w, w, len, col);
    b.pop();
  }

  function temples(b, col, y) {
    [-1, 1].forEach(s => bar(b, [s * 0.074, y, 0.118], [s * 0.112, y + 0.006, -0.035], 0.006, col));
  }

  function tvGlasses(col, poster) {
    return (b) => {
      [-1, 1].forEach(s => {
        const p = headPoint(s * 0.31, -0.12, 1.1);
        b.push(M4.translate(p[0], p[1], p[2] + 0.008), M4.rotY(s * 0.24));
        ring(b, roundRect(0.035, 0.029, 0.011, 3), roundRect(0.026, 0.02, 0.006, 3), 0, col);
        if (poster) {
          ring(b, roundRect(0.041, 0.035, 0.014, 3), roundRect(0.035, 0.029, 0.011, 3), -0.001, 0x0a0a0c);
          const inner = roundRect(0.026, 0.02, 0.006, 3);
          for (let i = 0; i < inner.length; i++) {
            const j = (i + 1) % inner.length;
            b.tri([0, 0, -0.002], [inner[i][0], inner[i][1], -0.002], [inner[j][0], inner[j][1], -0.002], 0x16181e, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
          }
        }
        b.pop();
      });
      temples(b, col, headPoint(0, -0.12, 1.1)[1]);
      const m = headPoint(0, -0.07, 1.13);
      b.at(m[0], m[1], m[2] + 0.006, (h) => h.box(0.024, 0.007, 0.007, col));
    };
  }

  function catEye(s, k) {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * PI * 2;
      const x = C(a) * 0.033 * k, y = S(a) * (S(a) > 0 ? 0.021 : 0.017) * k;
      const lift = s * x > 0 && y > 0 ? 0.012 * Math.pow((s * x) / (0.033 * k), 2) * k : 0;
      pts.push([x, y + lift]);
    }
    return pts;
  }

  function catShades(frame, lens) {
    return (b) => {
      [-1, 1].forEach(s => {
        const p = headPoint(s * 0.31, -0.12, 1.1);
        b.push(M4.translate(p[0], p[1], p[2] + 0.008), M4.rotY(s * 0.24));
        const inner = catEye(s, 1), outer = catEye(s, 1.28);
        for (let i = 0; i < inner.length; i++) {
          const j = (i + 1) % inner.length;
          b.tri([0, 0.002, -0.002], [inner[i][0], inner[i][1], -0.002], [inner[j][0], inner[j][1], -0.002], lens, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
        }
        ring(b, outer, inner, 0, frame);
        b.pop();
      });
      temples(b, frame, headPoint(0, -0.12, 1.1)[1]);
      const m = headPoint(0, -0.07, 1.13);
      b.at(m[0], m[1], m[2] + 0.006, (h) => h.box(0.022, 0.008, 0.008, frame));
    };
  }

  function suitV(lapel, shirt, tie, deep) {
    return (b, d) => {
      const top = d.torso - 0.01;
      b.tri([-0.055, top, 0.084], [0.055, top, 0.084], [0, deep, 0.124], shirt, null, NZ3);
      if (tie) {
        b.quad([-0.011, top - 0.03, 0.094], [0.011, top - 0.03, 0.094], [0.016, deep + 0.02, 0.128], [-0.014, deep + 0.02, 0.128], tie, null, NZ);
        b.at(0, top - 0.02, 0.092, (h) => h.box(0.026, 0.02, 0.01, shade(tie, 0.8)));
      }
      [-1, 1].forEach(s => b.quad([s * 0.055, top, 0.086], [s * 0.092, top - 0.015, 0.074], [s * 0.022, deep - 0.01, 0.127], [s * 0.004, deep, 0.126], lapel, null, NZ));
      [0.11, 0.05].forEach(y => b.at(0.024, y, 0.124, (h) => h.ellipsoid(0.007, 0.007, 0.004, 6, 3, shade(lapel, 0.7))));
    };
  }

  function standCollar(col, placket) {
    return (b, d) => {
      b.prism(12, 0.058, 0.054, d.torso - 0.035, 0.052, 0.05, d.torso + 0.025, col, { capTop: false });
      b.quad([0.012, d.torso - 0.03, 0.098], [0.022, d.torso - 0.03, 0.098], [0.026, 0.0, 0.118], [0.016, 0.0, 0.118], placket, null, NZ);
      [0.36, 0.28, 0.2, 0.12, 0.04].forEach(y => b.at(0.02, y, 0.122, (h) => h.ellipsoid(0.006, 0.006, 0.004, 6, 3, 0xb8b8b0)));
    };
  }

  function coatHem(col, len) {
    return (b) => b.prism(14, 0.17, 0.15, -len, 0.13, 0.112, 0.08, col, { capTop: false, skip: [0, 13] });
  }

  function belt(col, y, rx, rz) {
    return (b) => b.prism(14, rx, rz, y - 0.014, rx, rz, y + 0.014, col, { capTop: false });
  }

  function bib(col) {
    return (b, d) => {
      b.quad([-0.075, 0.27, 0.098], [0.075, 0.27, 0.098], [0.085, 0.02, 0.106], [-0.085, 0.02, 0.106], col, null, NZ);
      b.at(0, 0.2, 0.101, (h) => h.box(0.07, 0.05, 0.004, shade(col, 0.82)));
      [-1, 1].forEach(s => {
        b.quad([s * 0.06, 0.27, 0.098], [s * 0.08, 0.27, 0.098], [s * 0.1, d.torso - 0.01, 0.03], [s * 0.08, d.torso - 0.01, 0.03], col, null, NZ);
        b.quad([s * 0.1, d.torso - 0.01, -0.03], [s * 0.08, d.torso - 0.01, -0.03], [s * 0.05, 0.12, -0.104], [s * 0.07, 0.12, -0.104], col, null, [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]]);
        b.at(s * 0.07, 0.262, 0.104, (h) => h.ellipsoid(0.008, 0.008, 0.004, 6, 3, 0xe8d070));
      });
    };
  }

  function shoulderPad(col, s) {
    return (b, d) => b.at(s * (d.shoulder + 0.004), d.torso * 0.93, 0, (h) => {
      h.push(M4.rotZ(-s * 0.35));
      h.ellipsoid(0.072, 0.034, 0.07, 10, 5, col);
      h.pop();
    });
  }

  function yokeV(col) {
    return (b, d) => {
      const top = d.torso - 0.02;
      [[1, 0.098], [-1, -0.098]].forEach(([dir, z]) => {
        const n = [[0, 0, dir], [0, 0, dir], [0, 0, dir], [0, 0, dir]];
        [-1, 1].forEach(s => b.quad([s * 0.13, top - 0.02, z * 0.82], [s * 0.07, top, z * 0.8], [s * 0.004, 0.13, z * 1.12], [s * 0.05, 0.13, z * 1.1], col, null, n));
      });
    };
  }

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

  function woodBass(b) {
    const body = 0xc89458, edge = 0x8a5a2a, guard = 0x16141a;
    slab(b, -0.09, 0, 0.17, 0.155, -0.024, 0.024, body, edge, 18);
    slab(b, 0.07, 0.01, 0.12, 0.12, -0.024, 0.024, body, edge, 16);
    slab(b, 0.18, 0.08, 0.07, 0.04, -0.024, 0.024, body, edge, 12);
    slab(b, -0.03, 0.03, 0.11, 0.08, 0.0245, 0.026, guard, guard, 14);
    b.at(-0.13, 0, 0.03, (h) => h.box(0.03, 0.07, 0.008, 0xc8c8c0));
    b.at(-0.02, -0.01, 0.03, (h) => h.box(0.028, 0.05, 0.008, 0x101012));
    b.at(0.5, 0, 0.022, (h) => h.box(0.64, 0.048, 0.022, 0xd8b478));
    b.at(0.5, 0, 0.034, (h) => h.box(0.64, 0.044, 0.003, 0x3a2414));
    for (let x = 0.24; x < 0.8; x += 0.07) b.at(x, 0, 0.0362, (h) => h.box(0.006, 0.042, 0.001, 0xe8e4d8));
    b.push(M4.translate(0.82, 0, 0.022), M4.rotY(0.18));
    b.at(0.08, 0.008, 0, (h) => h.box(0.17, 0.07, 0.016, 0xd8b478));
    [0.03, 0.07, 0.11, 0.15].forEach(x => b.at(x, 0.045, -0.012, (h) => h.prism(6, 0.007, 0.007, -0.01, 0.007, 0.007, 0.01, 0xd8d8d0)));
    b.pop();
    for (let i = 0; i < 4; i++) {
      const y = (i - 1.5) * 0.011;
      b.quad([-0.13, y - 0.0008, 0.039], [0.82, y * 0.85 - 0.0008, 0.039], [0.82, y * 0.85 + 0.0008, 0.039], [-0.13, y + 0.0008, 0.039], [0.9, 0.9, 0.88, 0.5], null, NZ);
    }
  }

  function vintageMic(b) {
    b.prism(10, 0.007, 0.007, -0.26, 0.008, 0.008, -0.05, 0x2a2a2e, { capBottom: true });
    b.at(0, -0.05, 0, (h) => h.box(0.03, 0.02, 0.03, 0x8a8e96));
    [-1, 1].forEach(s => b.at(s * 0.034, 0, 0, (h) => h.box(0.006, 0.06, 0.012, 0xb8bcc4)));
    b.push(M4.translate(0, 0.035, 0));
    b.ellipsoid(0.03, 0.05, 0.022, 12, 8, shine(0xc8ccd4, 0.18));
    for (let i = -3; i <= 3; i++) {
      [-1, 1].forEach(dir => b.quad([i * 0.0075 - 0.0018, -0.034, dir * 0.0225], [i * 0.0075 + 0.0018, -0.034, dir * 0.0225], [i * 0.0075 + 0.0018, 0.034, dir * 0.0225], [i * 0.0075 - 0.0018, 0.034, dir * 0.0225], 0x26262c, null, [[0, 0, dir], [0, 0, dir], [0, 0, dir], [0, 0, dir]]));
    }
    b.pop();
  }

  Object.assign(Cast.PROPS, { rsBass: woodBass, rsMic: vintageMic });
  GK.RIGS.rsBass = { at: [-0.02, -0.06, 0.16], rot: [-0.05, -0.2, 0.36], strum: [0.02, 0.03, 0.05], fret: [0.34, 0.62] };

  const RAINBOW = ['#e8343a', '#f49a2a', '#f4e04a', '#3ab04a', '#2a6ae0', '#8a3ad0'];

  Object.assign(Cast.PRINTS, {
    rsRainbow(ctx, w, h) {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#c8ccd6';
      ctx.fillRect(0, 0, w, h);
      const bw = w / RAINBOW.length;
      RAINBOW.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.moveTo(i * bw, 0);
        ctx.lineTo((i + 1) * bw, 0);
        ctx.lineTo(w / 2 + (i + 1 - RAINBOW.length / 2) * bw * 0.25, h);
        ctx.lineTo(w / 2 + (i - RAINBOW.length / 2) * bw * 0.25, h);
        ctx.closePath();
        ctx.fill();
      });
    }
  });

  const plain = (col) => [[0, 1, col]];
  const SNEAKER = (col, sole) => ({ type: 'sneaker', col, sole: sole || 0xf2f2f2 });
  const BOOT = (col) => ({ type: 'boot', col });
  const SHOE = (col) => ({ type: 'flat', col });

  const SUIT = 0x16161c;
  const SHIRT = 0xf4f2ec;
  const COAT = 0xeeeee6;
  const COAT_DK = 0xd6d6cc;
  const SILVER = shine(0xb4b8c6, 0.14);
  const SILVER_DK = shine(0x80848f, 0.1);
  const LEATHER = shine(0x18181e, 0.06);
  const GLITTER = shine(0xc6cad4, 0.2);
  const TIGHTS = mixc(SILVER_SKIN, 0xc8ccd8, 0.55);
  const PINK_PAD = shine(0xe0409a, 0.3);
  const BLUE_PAD = shine(0x3a58d0, 0.3);
  const DUNGAREE = 0xc81e26;
  const TUNIC = 0xa8389a;
  const YOKE = 0xd8202e;
  const TWIN_LEG = 0xd02838;

  const singer = (top, extra) => Object.assign({
    person: 'rsSinger', body: 'him', skin: SINGER_SKIN, hair: 'rsSinger',
    gear: [UTS.nose(SINGER_SKIN, 1.05), tvGlasses(shine(0xf6f6f2, 0.25))]
  }, top, extra || {});

  const FORMS = {
    rsSingerPoster: singer({
      hair: 'rsSingerPoster',
      gear: [UTS.nose(SINGER_SKIN, 1.05), tvGlasses(shine(0xf6f6f2, 0.25), true)],
      torso: { body: SUIT },
      torsoExtras: [suitV(0x0e0e12, SHIRT, 0x0e0e12, 0.21)],
      hips: SUIT,
      arm: { upper: plain(SUIT), fore: [[0, 0.08, SHIRT], [0.08, 1, SUIT]] },
      leg: { thigh: plain(SUIT), shin: plain(SUIT), shoe: SHOE(0x0e0e10) }
    }),
    rsSingerLab: singer({
      torso: { body: COAT },
      torsoExtras: [standCollar(COAT, COAT_DK)],
      hips: COAT,
      hipExtras: [coatHem(COAT, 0.14)],
      arm: { upper: plain(COAT), fore: plain(COAT) },
      leg: { thigh: plain(0xe4e4dc), shin: plain(0xe4e4dc), shoe: SHOE(0x2a2a2e) }
    }),
    rsSingerStudio: singer({
      torso: { body: SILVER },
      torsoExtras: [suitV(SILVER_DK, 0x1a1a20, null, 0.18)],
      hips: LEATHER,
      arm: { upper: plain(SILVER), fore: plain(SILVER) },
      leg: { thigh: plain(LEATHER), shin: plain(LEATHER), shoe: BOOT(0x101012) }
    }),
    rsKeysSilver: {
      person: 'rsKeys', body: 'him', skin: KEYS_SKIN, hair: 'rsKeys',
      torso: { body: SILVER },
      torsoExtras: [suitV(SILVER_DK, 0xf0e6dc, 0xd02a3a, 0.2)],
      hips: SILVER,
      arm: { upper: plain(SILVER), fore: plain(SILVER) },
      leg: { thigh: plain(SILVER), shin: plain(SILVER), shoe: BOOT(0x16161a) },
      gear: [UTS.nose(KEYS_SKIN)]
    },
    rsKeysLab: {
      person: 'rsKeys', body: 'him', skin: KEYS_SKIN, hair: 'rsKeys',
      torso: { body: COAT },
      torsoExtras: [standCollar(COAT, COAT_DK)],
      hips: COAT,
      hipExtras: [coatHem(COAT, 0.3)],
      arm: { upper: plain(COAT), fore: plain(COAT) },
      leg: { thigh: plain(0x3a3a44), shin: plain(0x3a3a44), shoe: SHOE(0x1a1a1e) },
      gear: [UTS.nose(KEYS_SKIN)]
    },
    rsSynth: {
      person: 'rsSynth', body: 'him', skin: SYNTH_SKIN, hair: 'rsSynth',
      torso: { body: LEATHER },
      torsoExtras: [suitV(shine(0x26262e, 0.08), SHIRT, null, 0.24)],
      hips: 0x141418,
      arm: { upper: plain(LEATHER), fore: plain(LEATHER) },
      leg: { thigh: plain(0x141418), shin: plain(0x141418), shoe: BOOT(0x0e0e10) },
      gear: [UTS.nose(SYNTH_SKIN, 1.05)]
    },
    rsGirl: {
      person: 'rsGirl', skin: GIRL_SKIN, hair: 'rsGirl', bust: 0, scale: 0.74,
      torso: { body: 0xf6f4ee },
      torsoExtras: [bib(DUNGAREE)],
      hips: DUNGAREE,
      arm: { upper: [[0, 0.55, GIRL_SKIN], [0.55, 1, 0xf6f4ee]], fore: plain(GIRL_SKIN) },
      leg: { thigh: plain(DUNGAREE), shin: plain(DUNGAREE), flare: 0.012, shoe: SNEAKER(0xf2f2f2, 0xc81e26) },
      gear: [UTS.nose(GIRL_SKIN, 0.7)]
    },
    rsSilver: {
      person: 'rsSilver', skin: SILVER_SKIN, hair: 'rsSilver', bust: 0.65,
      torso: { body: GLITTER, neck: SILVER_SKIN },
      torsoExtras: [shoulderPad(PINK_PAD, 1), shoulderPad(BLUE_PAD, -1), belt(shine(0xe0e2ea, 0.3), 0.02, 0.112, 0.1)],
      decal: ['rsRainbow', 0, 0.12, 0.1, 0.11, 0.14],
      hips: GLITTER,
      arm: { upper: plain(GLITTER), fore: plain(GLITTER), hand: SILVER_SKIN },
      leg: { thigh: [[0, 0.82, TIGHTS], [0.82, 1, GLITTER]], shin: [[0, 0.3, shine(0xd8dae4, 0.25)], [0.3, 1, TIGHTS]], shoe: BOOT(shine(0xd8dae4, 0.25)) },
      gear: [UTS.nose(SILVER_SKIN, 0.8)]
    },
    rsTwin: {
      person: 'rsTwin', skin: TWIN_SKIN, hair: 'rsTwin', bust: 0.5,
      torso: { body: TUNIC, neck: 0x3a1838 },
      torsoExtras: [yokeV(YOKE), belt(YOKE, 0.03, 0.106, 0.094)],
      hips: TUNIC,
      hipExtras: [(b) => b.prism(16, 0.17, 0.15, -0.17, 0.122, 0.1, 0.08, TUNIC, { capTop: false })],
      arm: { upper: plain(TUNIC), fore: plain(TUNIC), hand: TWIN_SKIN },
      leg: { thigh: plain(TWIN_LEG), shin: plain(TWIN_LEG), shoe: SHOE(0xb01c2a) },
      gear: [UTS.nose(TWIN_SKIN, 0.8), catShades(shine(0xf8f8f4, 0.3), [0.08, 0.06, 0.1, 0.2])]
    }
  };
  Object.assign(Cast.FORMS, FORMS);

  window.P3DRadioStarCast = { FORMS, PEOPLE_IDS: ['rsSinger', 'rsKeys', 'rsSynth', 'rsGirl', 'rsSilver', 'rsTwin'] };
})();
