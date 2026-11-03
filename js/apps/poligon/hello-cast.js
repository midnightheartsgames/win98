(function () {
  const { M4, V3, Builder, rgb } = window.P3D;
  const Cast = window.P3DCccCast;
  const UTS = window.P3DUhnTissCast;
  const { R, headPoint, headNormal, headPatch, sideLocks, backHair, band } = Cast;

  const PI = Math.PI;
  const S = Math.sin;
  const C = Math.cos;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const NZ = [[0, 0, 1], [0, 0, 1], [0, 0, 1], [0, 0, 1]];
  const NB = [[0, 0, -1], [0, 0, -1], [0, 0, -1], [0, 0, -1]];
  const HX = 0.88, HY = 0.94, HZ = 0.9;

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
    paint: UTS.paintFace, eyeW: 1, eyeH: 0.9, irisR: 7.4, lashW: 2.6, browW: 6, mouthW: 1, lipFull: 0.85,
    iris: ['#120804', '#36200e', '#5e3c22'], lash: '#120c0a', brow: '#141010', mouth: '#4a1416'
  }, o);
  const maleLip = (skin) => mixc(skin, 0x9a4a40, 0.18);

  const SINGER_SKIN = 0xe4b892;
  const GIRL_SKIN = 0xf0cfb4;
  const DANCER_SKINS = [0xefc9ab, 0xe6bb98, 0xf3d4ba, 0xdcac86, 0xeac2a0];
  const DANCER_LIPS = [0xd0606e, 0xc84f60, 0xd8727e, 0xbc5462, 0xcc6070];

  Object.assign(Cast.PEOPLE, {
    khSinger: person({ skin: SINGER_SKIN, lipHex: maleLip(SINGER_SKIN), eyeW: 1.02, eyeH: 0.84, irisR: 7.2, browW: 7, mouthW: 1.12 }),
    khGirl: person({ skin: GIRL_SKIN, lipHex: 0xc85866, lipFull: 1, mouthW: 0.92, eyeH: 0.95, irisR: 7.8, lashW: 3.2, browW: 4.6, brow: '#2a1a12', liner: true, lashes: true, blush: true })
  });
  DANCER_SKINS.forEach((skin, i) => {
    Cast.PEOPLE['khDancer' + i] = person({
      skin, lipHex: DANCER_LIPS[i], lipFull: 0.95, mouthW: 0.9, eyeH: 0.92 + 0.03 * (i % 2), irisR: 7.8, lashW: 3, browW: 4.4,
      brow: '#1e1410', liner: i % 2 === 0, lashes: true, blush: true
    });
  });

  Object.assign(Cast.HAIR, {
    khSinger: { mid: 0x171319, hi: 0x211b22, dark: 0x110d12 },
    khGirl: { mid: 0x2c1c16, hi: 0x4a3226, dark: 0x170e0a },
    khLoose: { mid: 0x141216, hi: 0x2c2832, dark: 0x09080b },
    khLooseB: { mid: 0x24181a, hi: 0x3e2c2a, dark: 0x120c0c },
    khWave: { mid: 0x24181a, hi: 0x3e2c2a, dark: 0x120c0c },
    khWaveB: { mid: 0x141216, hi: 0x2c2832, dark: 0x09080b },
    khTail: { mid: 0x141216, hi: 0x2c2832, dark: 0x09080b },
    khBraid: { mid: 0x161214, hi: 0x2e2a30, dark: 0x0a090b },
    khBun: { mid: 0x24181a, hi: 0x3e2c2a, dark: 0x120c0c }
  });

  function strand(b, col, yaw, w, pTop, pTip, kTop, kTip, curl) {
    const pMid = lerp(pTop, pTip, 0.55), kMid = lerp(kTop, kTip, 0.5) + 0.015;
    const a = headPoint(yaw - w, pTop, kTop), c = headPoint(yaw + w, pTop, kTop);
    const d = headPoint(yaw + w * 0.6 + curl * 0.4, pMid, kMid), e = headPoint(yaw - w * 0.6 + curl * 0.4, pMid, kMid);
    const tip = headPoint(yaw + curl, pTip, kTip);
    const n0 = headNormal(yaw, pTop), n1 = headNormal(yaw, pMid), n2 = headNormal(yaw + curl, pTip);
    b.quad(a, c, d, e, col, null, [n0, n0, n1, n1]);
    b.tri(e, d, tip, col, null, [n1, n1, n2]);
  }

  function singerTop(b, H) {
    [[-0.32, 0.1], [0.0, 0.11], [0.3, 0.1]].forEach(([yaw, w], i) => strand(b, i === 1 ? H.hi : H.mid, yaw, w, 0.66, 0.92, 1.09, 1.13, 0.06));
  }

  function middlePart(b, H) {
    for (let i = 0; i < 7; i++) {
      const p0 = 0.5 + i * 0.12, p1 = p0 + 0.12;
      const a = headPoint(-0.012, p0, 1.1), c = headPoint(0.012, p0, 1.1), d = headPoint(0.012, p1, 1.1), e = headPoint(-0.012, p1, 1.1);
      const n = headNormal(0, p0);
      b.quad(a, c, d, e, H.dark, null, [n, n, n, n]);
    }
  }

  function ponytail(b, H) {
    const p = headPoint(PI, 0.62, 1.08);
    b.push(M4.translate(p[0], p[1], p[2] - 0.01), M4.rotX(0.5));
    b.prism(8, 0.026, 0.026, -0.02, 0.026, 0.026, 0.02, 0x2a2a30, { capTop: false });
    b.prism(9, 0.03, 0.026, -0.42, 0.046, 0.04, -0.02, H.mid, { capBottom: true, capTop: false });
    b.at(0, -0.2, -0.012, (h) => h.prism(7, 0.044, 0.02, -0.16, 0.05, 0.022, 0.0, H.hi, { capTop: false }));
    b.pop();
  }

  function braid(b, H) {
    const p = headPoint(PI, -0.35, 1.04);
    b.push(M4.translate(p[0], p[1], p[2] - 0.01), M4.rotX(0.08));
    for (let i = 0; i < 10; i++) {
      const r = 0.026 - i * 0.0013;
      b.at(S(i * 1.9) * 0.004, -0.02 - i * 0.042, 0, (h) => h.ellipsoid(r, 0.026, r * 0.85, 7, 4, i % 2 ? H.mid : H.hi));
    }
    b.at(0, -0.46, 0, (h) => h.prism(6, 0.012, 0.012, -0.08, 0.02, 0.02, 0, H.dark, { capBottom: true }));
    b.pop();
  }

  function bun(b, H) {
    const p = headPoint(PI * 0.9, 1.0, 1.08);
    b.at(p[0], p[1] + 0.01, p[2], (h) => {
      h.ellipsoid(0.052, 0.045, 0.05, 9, 5, H.mid);
      h.at(0.01, 0.02, 0.01, (c) => c.ellipsoid(0.032, 0.026, 0.03, 7, 4, H.hi));
    });
  }

  const longLow = (front) => (y) => lerp(lerp(front - 0.45 * clamp(Math.abs(y) / 0.55, 0, 1), -0.74, band(y, 0.6, 1.0)), -0.95, band(y, 1.6, 2.4));
  const sideLow = (y) => lerp(lerp(0.34 + 0.16 * clamp(y / 0.6, -1, 1), -0.76, band(y, 0.58, 1.02)), -0.95, band(y, 1.6, 2.4));
  const tightLow = (y) => lerp(lerp(0.42 - 0.08 * Math.abs(y), -0.42, band(y, 0.5, 1.05)), -0.6, band(y, 1.6, 2.4));

  Object.assign(Cast.SHELLS, {
    khSinger: {
      low: (y) => lerp(lerp(0.66 - 0.12 * Math.min(1, Math.abs(y) / 0.5), 0.1, band(y, 0.45, 1.1)), -0.42, band(y, 1.7, 2.6)),
      tip: () => 0.012, k: 1.09, flare: 0.0,
      extra: (head, back, H) => singerTop(head, H)
    },
    khGirl: {
      low: longLow(0.54), tip: (y) => (Math.abs(y) < 0.6 ? 0.04 : 0.1), k: 1.09, flare: 0.08,
      extra: (head, back, H) => {
        middlePart(head, H);
        sideLocks(head, H, 0.9, 0.36, 0.064, false);
        backHair(back, H, 0.62, 0.26, false, 0.06);
      }
    },
    khLoose: {
      low: longLow(0.5), tip: (y) => (Math.abs(y) < 0.6 ? 0.04 : 0.1), k: 1.09, flare: 0.08,
      extra: (head, back, H) => {
        middlePart(head, H);
        sideLocks(head, H, 0.9, 0.44, 0.064, false);
        backHair(back, H, 0.72, 0.26, false, 0.08);
      }
    },
    khWave: {
      low: sideLow, tip: (y) => (Math.abs(y) < 0.6 ? 0.08 : 0.12), k: 1.1, flare: 0.1,
      extra: (head, back, H) => {
        sideLocks(head, H, 0.94, 0.4, 0.07, true);
        backHair(back, H, 0.62, 0.28, true, 0.2);
      }
    },
    khTail: {
      low: tightLow, tip: () => 0.03, k: 1.06, flare: 0.03,
      extra: (head, back, H) => ponytail(head, H)
    },
    khBraid: {
      low: tightLow, tip: () => 0.03, k: 1.06, flare: 0.03,
      extra: (head, back, H) => {
        middlePart(head, H);
        braid(head, H);
      }
    },
    khBun: {
      low: longLow(0.46), tip: () => 0.05, k: 1.08, flare: 0.06,
      extra: (head, back, H) => {
        bun(head, H);
        sideLocks(head, H, 0.92, 0.36, 0.06, true);
        backHair(back, H, 0.46, 0.3, true, 0.12);
      }
    }
  });
  Cast.SHELLS.khLooseB = Cast.SHELLS.khLoose;
  Cast.SHELLS.khWaveB = Cast.SHELLS.khWave;

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

  function loop(b, outer, inner, z, col) {
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length;
      b.quad([outer[i][0], outer[i][1], z], [outer[j][0], outer[j][1], z], [inner[j][0], inner[j][1], z], [inner[i][0], inner[i][1], z], col, null, NZ);
    }
  }

  function fill(b, pts, z, col) {
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      b.tri([0, 0, z], [pts[i][0], pts[i][1], z], [pts[j][0], pts[j][1], z], col, null, [[0, 0, 1], [0, 0, 1], [0, 0, 1]]);
    }
  }

  function bar(b, a, c, w, col) {
    const d = V3.sub(c, a);
    const len = V3.len(d);
    b.push(M4.translate((a[0] + c[0]) / 2, (a[1] + c[1]) / 2, (a[2] + c[2]) / 2), M4.rotY(Math.atan2(d[0], d[2])), M4.rotX(-Math.asin(d[1] / len)));
    b.box(w, w, len, col);
    b.pop();
  }

  function frames(hw, hh, rad, rim, frame, lens) {
    return (b) => {
      [-1, 1].forEach(s => {
        const p = headPoint(s * 0.31, -0.11, 1.1);
        b.push(M4.translate(p[0], p[1], p[2] + 0.008), M4.rotY(s * 0.22));
        const outer = roundRect(hw, hh, rad, 3), inner = roundRect(hw - rim, hh - rim, Math.max(0.002, rad - rim * 0.6), 3);
        loop(b, outer, inner, 0, frame);
        if (lens) fill(b, inner, -0.002, lens);
        b.pop();
      });
      const y = headPoint(0, -0.11, 1.1)[1];
      [-1, 1].forEach(s => bar(b, [s * 0.072, y + 0.006, 0.112], [s * 0.112, y + 0.008, -0.035], 0.005, frame));
      const m = headPoint(0, -0.06, 1.13);
      b.at(m[0], m[1], m[2] + 0.006, (h) => h.box(0.022, 0.006, 0.006, frame));
    };
  }

  function hoops(col) {
    return (b) => {
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * R * 0.9, -R * 0.42 - 0.018, -0.004), M4.rotZ(PI / 2));
        for (let i = 0; i < 12; i++) {
          const a0 = (i / 12) * PI * 2, a1 = ((i + 1) / 12) * PI * 2;
          b.at(0, 0, 0, (h) => h.quad([C(a0) * 0.02, -0.002, S(a0) * 0.02], [C(a1) * 0.02, -0.002, S(a1) * 0.02], [C(a1) * 0.02, 0.002, S(a1) * 0.02], [C(a0) * 0.02, 0.002, S(a0) * 0.02], col, null, [[C(a0), 0, S(a0)], [C(a1), 0, S(a1)], [C(a1), 0, S(a1)], [C(a0), 0, S(a0)]]));
        }
        b.pop();
      });
    };
  }

  function crewNeck(col) {
    return (b, d) => b.prism(12, 0.052, 0.05, d.torso - 0.035, 0.046, 0.044, d.torso + 0.012, col, { capTop: false });
  }

  function suitV(lapel, shirt, tie, deep) {
    return (b, d) => {
      const top = d.torso - 0.01;
      b.tri([-0.05, top, 0.08], [0.05, top, 0.08], [0, deep, 0.118], shirt, null, [[0, 0.2, 1], [0, 0.2, 1], [0, 0.2, 1]]);
      b.quad([-0.01, top - 0.03, 0.09], [0.01, top - 0.03, 0.09], [0.014, deep + 0.02, 0.122], [-0.012, deep + 0.02, 0.122], tie, null, NZ);
      b.at(0, top - 0.02, 0.088, (h) => h.box(0.024, 0.02, 0.01, shade(tie, 0.8)));
      [-1, 1].forEach(s => b.quad([s * 0.05, top, 0.082], [s * 0.098, top - 0.02, 0.07], [s * 0.026, deep - 0.012, 0.122], [s * 0.004, deep, 0.121], lapel, null, NZ));
      b.at(0.022, deep - 0.05, 0.118, (h) => h.ellipsoid(0.007, 0.007, 0.004, 6, 3, 0x0e0e10));
      [-1, 1].forEach(s => b.at(s * 0.085, 0.07, 0.086, (h) => h.box(0.06, 0.006, 0.01, lapel)));
    };
  }

  function coatHem(col, len) {
    return (b) => b.prism(14, 0.165, 0.14, -len, 0.13, 0.108, 0.08, col, { capTop: false, skip: [0, 13] });
  }

  function belt(col, buckle) {
    return (b, d) => {
      b.prism(14, d.waist * 1.14, d.depth * 1.01, 0.05, d.waist * 1.14, d.depth * 1.01, 0.085, col, { capTop: false });
      b.at(0, 0.067, d.depth * 1.02, (h) => h.box(0.05, 0.034, 0.008, buckle));
      b.at(0, 0.067, d.depth * 1.03, (h) => h.box(0.03, 0.016, 0.006, col));
    };
  }

  function wristRing(col, w, h) {
    return (b, d) => b.prism(10, w, w * 0.9, -d.fore + 0.01, w, w * 0.9, -d.fore + 0.01 + h, col, { capTop: false });
  }

  function watch(strap, face) {
    return (b, d) => {
      wristRing(strap, 0.034, 0.026)(b, d);
      b.at(0.033, -d.fore + 0.023, 0, (h) => h.box(0.012, 0.04, 0.04, face));
      b.at(0.04, -d.fore + 0.023, 0, (h) => h.box(0.002, 0.03, 0.03, [0.12, 0.14, 0.16, 0.25]));
    };
  }

  function jacketFront(tee, dark) {
    return (b, d) => {
      const ys = [0.0, 0.12, 0.26, 0.36], zs = [0.095, 0.092, 0.103, 0.083], ws = [0.04, 0.044, 0.048, 0.04];
      for (let i = 0; i < 3; i++) {
        const n = V3.norm([0, zs[i] - zs[i + 1], ys[i + 1] - ys[i]]);
        b.quad([-ws[i], ys[i], zs[i]], [ws[i], ys[i], zs[i]], [ws[i + 1], ys[i + 1], zs[i + 1]], [-ws[i + 1], ys[i + 1], zs[i + 1]], tee, null, [n, n, n, n]);
      }
      [-1, 1].forEach(s => {
        b.quad([s * 0.035, d.torso, 0.062], [s * 0.105, d.torso - 0.025, 0.05], [s * 0.08, d.torso - 0.11, 0.096], [s * 0.044, d.torso - 0.085, 0.1], dark, null, NZ);
        b.at(s * 0.068, 0.25, 0.104, (h) => h.box(0.054, 0.046, 0.008, dark));
        b.at(s * 0.068, 0.268, 0.109, (h) => h.ellipsoid(0.005, 0.005, 0.003, 5, 3, 0xe8e2d8));
        b.at(s * 0.052, 0.1, 0.098, (h) => h.ellipsoid(0.006, 0.006, 0.004, 5, 3, 0xe8e2d8));
      });
    };
  }

  function teeHem(col) {
    return (b, d) => b.prism(14, 0.128, d.depth * 1.08, 0.02, d.waist * 1.16, d.depth * 1.03, 0.085, col, { capTop: false });
  }

  function baggy(col) {
    return (b, d) => b.prism(10, 0.046, 0.048, -d.fore + 0.03, 0.05, 0.05, -0.02, col, { capTop: false });
  }

  const plain = (col) => [[0, 1, col]];
  const SNEAKER = (col, sole) => ({ type: 'sneaker', col, sole: sole || 0xf2f2f2 });

  const TEE = 0xf4f3ef;
  const BLACK = 0x18181b;
  const CHARCOAL = 0x3c3f45;
  const CHARCOAL_DK = 0x2c2e33;
  const PINK = 0xe8457c;
  const PINK_DK = 0xc8346a;
  const SILVER = shine(0xc8ccd2, 0.12);
  const GOLD = shine(0xe0b450, 0.2);

  const FORMS = {
    khSinger: {
      person: 'khSinger', body: 'him', skin: SINGER_SKIN, hair: 'khSinger',
      gear: [UTS.nose(SINGER_SKIN, 1.02), frames(0.032, 0.022, 0.008, 0.0045, SILVER, null)],
      torso: { body: TEE, neck: SINGER_SKIN },
      torsoExtras: [crewNeck(TEE)],
      hips: BLACK,
      hipExtras: [belt(0x0e0e10, SILVER)],
      arm: { upper: [[0, 0.5, SINGER_SKIN], [0.5, 1, TEE]], fore: plain(SINGER_SKIN), foreExtras: [wristRing(SILVER, 0.033, 0.01)] },
      armL: { foreExtras: [watch(0x9aa0a8, SILVER)] },
      leg: { thigh: plain(BLACK), shin: plain(BLACK), flare: 0.024, shoe: SNEAKER(0x141416, 0xf0f0ee) }
    },
    khGirl: {
      person: 'khGirl', skin: GIRL_SKIN, hair: 'khGirl', bust: 0.35,
      gear: [UTS.nose(GIRL_SKIN, 0.82), frames(0.036, 0.027, 0.01, 0.007, shine(0x9a6a36, 0.05), [0.08, 0.06, 0.05, 0.12]), hoops(GOLD)],
      torso: { body: CHARCOAL, shoulder: CHARCOAL, neck: GIRL_SKIN },
      torsoExtras: [suitV(CHARCOAL_DK, 0xeef0f2, 0x121214, 0.17)],
      hips: CHARCOAL,
      hipExtras: [coatHem(CHARCOAL, 0.2)],
      arm: { upper: plain(CHARCOAL), fore: [[0, 0.1, 0xeef0f2], [0.1, 1, CHARCOAL]], foreExtras: [baggy(CHARCOAL)] },
      armL: { foreExtras: [baggy(CHARCOAL), watch(0x2a1a12, GOLD)] },
      leg: { thigh: plain(CHARCOAL), shin: plain(CHARCOAL), flare: 0.03, shoe: { type: 'flat', col: 0x111113 } }
    }
  };

  const DANCER_HAIR = ['khLoose', 'khTail', 'khWave', 'khBraid', 'khBun', 'khWaveB', 'khLooseB', 'khTail', 'khBraid', 'khLoose'];
  const DANCER_SCALE = [0.98, 1.0, 0.96, 1.01, 0.97, 0.99, 1.0, 0.95, 0.99, 0.97];
  const DANCER_IDS = DANCER_HAIR.map((hair, i) => {
    const id = 'khDancer' + i;
    const who = 'khDancer' + (i % DANCER_SKINS.length);
    const skin = DANCER_SKINS[i % DANCER_SKINS.length];
    FORMS[id] = {
      person: who, skin, hair, bust: 0.3, scale: DANCER_SCALE[i],
      gear: [UTS.nose(skin, 0.8)],
      torso: { body: PINK, shoulder: PINK, neck: skin },
      torsoExtras: [jacketFront(TEE, PINK_DK)],
      hips: PINK,
      hipExtras: [teeHem(TEE)],
      arm: { upper: plain(PINK), fore: plain(PINK), foreExtras: [baggy(PINK)] },
      leg: { thigh: plain(PINK), shin: plain(PINK), flare: 0.032, shoe: SNEAKER(0xf6f6f4, 0xdedcd8) }
    };
    return id;
  });
  Object.assign(Cast.FORMS, FORMS);

  function phone(b) {
    b.box(0.07, 0.145, 0.009, 0x1a1a1e);
    b.at(0, 0, 0.0048, (h) => h.box(0.064, 0.138, 0.001, [0.1, 0.12, 0.16, 0.3]));
    b.at(-0.018, 0.05, -0.0055, (h) => h.box(0.026, 0.03, 0.004, 0x2a2a2e));
    b.at(-0.018, 0.056, -0.008, (h) => h.prism(8, 0.005, 0.005, -0.002, 0.005, 0.005, 0.002, 0x08080a));
  }

  function instant(b) {
    const body = 0x8ec6d6, dark = 0x6aa4b6;
    b.box(0.118, 0.122, 0.066, body);
    b.at(0, 0.056, 0, (h) => h.box(0.12, 0.012, 0.068, shade(body, 1.06)));
    b.push(M4.translate(0.004, -0.01, 0.033), M4.rotX(PI / 2));
    b.prism(14, 0.034, 0.034, 0, 0.032, 0.032, 0.018, dark, { capTop: false });
    b.prism(14, 0.026, 0.026, 0.0, 0.026, 0.026, 0.02, 0x2a2e32);
    b.at(0, 0.021, 0, (h) => h.disc(0.017, 12, [0.12, 0.16, 0.22, 0.35]));
    b.pop();
    b.at(-0.042, 0.04, 0.034, (h) => h.box(0.03, 0.022, 0.004, [0.95, 0.95, 0.92, 0.4]));
    b.at(0.04, 0.042, 0.034, (h) => h.box(0.016, 0.014, 0.004, 0x1a1c20));
    b.at(0.06, 0.036, 0, (h) => h.box(0.006, 0.01, 0.02, 0xf2f2f0));
    for (let i = 0; i < 8; i++) {
      const a0 = -0.2 + (i / 8) * 1.6, a1 = -0.2 + ((i + 1) / 8) * 1.6;
      b.quad([0.064 + S(a0) * 0.02, 0.03 - (1 - C(a0)) * 0.12 - i * 0.012, C(a0) * 0.01], [0.064 + S(a1) * 0.02, 0.03 - (1 - C(a1)) * 0.12 - (i + 1) * 0.012, C(a1) * 0.01], [0.068 + S(a1) * 0.02, 0.03 - (1 - C(a1)) * 0.12 - (i + 1) * 0.012, C(a1) * 0.01], [0.068 + S(a0) * 0.02, 0.03 - (1 - C(a0)) * 0.12 - i * 0.012, C(a0) * 0.01], 0xf4f4f2, null, [[1, 0, 0], [1, 0, 0], [1, 0, 0], [1, 0, 0]]);
    }
  }

  Object.assign(Cast.PROPS, { khPhone: phone, khInstant: instant });

  function goldFrame(b) {
    const gold = 0xd8b058, deep = 0xa07a32, lite = 0xf0d48a;
    const ow = 0.47, oh = 0.37, iw = 0.35, ih = 0.25, d = 0.05;
    const ring = (w0, h0, w1, h1, z0, z1, col, n) => {
      const pa = [[-w0, -h0], [w0, -h0], [w0, h0], [-w0, h0]], pb = [[-w1, -h1], [w1, -h1], [w1, h1], [-w1, h1]];
      for (let i = 0; i < 4; i++) {
        const j = (i + 1) % 4;
        b.quad([pa[i][0], pa[i][1], z0], [pa[j][0], pa[j][1], z0], [pb[j][0], pb[j][1], z1], [pb[i][0], pb[i][1], z1], col, null, [n, n, n, n]);
      }
    };
    ring(ow, oh, ow - 0.04, oh - 0.04, 0, d, gold, [0, 0, 1]);
    ring(ow - 0.04, oh - 0.04, iw + 0.03, ih + 0.03, d, d * 0.7, lite, [0, 0, 1]);
    ring(iw + 0.03, ih + 0.03, iw, ih, d * 0.7, d * 0.2, deep, [0, 0, 1]);
    ring(ow, oh, iw, ih, 0, 0, shade(gold, 0.8), [0, 0, -1]);
    [[-ow, -oh, ow, -oh], [ow, -oh, ow, oh], [ow, oh, -ow, oh], [-ow, oh, -ow, -oh]].forEach(([x0, y0, x1, y1]) => {
      const n = V3.norm([y1 - y0, -(x1 - x0), 0]);
      b.quad([x0, y0, 0], [x1, y1, 0], [x1, y1, d], [x0, y0, d], shade(gold, 0.9), null, [n, n, n, n]);
    });
    for (let i = 0; i < 14; i++) {
      const f = i / 13;
      [[lerp(-ow + 0.02, ow - 0.02, f), oh - 0.02], [lerp(-ow + 0.02, ow - 0.02, f), -oh + 0.02]].forEach(([x, y]) => b.at(x, y, d + 0.004, (h) => h.ellipsoid(0.012, 0.01, 0.006, 5, 3, lite)));
    }
    [[-ow + 0.02, oh - 0.02], [ow - 0.02, oh - 0.02], [-ow + 0.02, -oh + 0.02], [ow - 0.02, -oh + 0.02]].forEach(([x, y]) => b.at(x, y, d + 0.008, (h) => h.ellipsoid(0.032, 0.032, 0.012, 8, 4, lite)));
  }

  function macroArm(skin, sleeve, cuff, thumb) {
    const b = new Builder();
    b.push(M4.rotZ(-PI / 2));
    b.prism(12, 0.044, 0.04, -0.42, 0.032, 0.03, 0.0, skin, { capBottom: true });
    if (sleeve) b.prism(12, 0.056, 0.052, -0.43, 0.05, 0.047, -0.075, sleeve, { capBottom: true });
    if (cuff) b.prism(12, 0.047, 0.044, -0.085, 0.044, 0.041, -0.045, cuff, { capTop: false });
    b.pop();
    b.at(0.05, 0, 0, (h) => h.box(0.09, 0.024, 0.074, skin));
    [-0.027, -0.009, 0.009, 0.027].forEach((z, i) => {
      const len = [0.058, 0.07, 0.066, 0.052][i];
      b.at(0.095 + len / 2, 0.0, z, (h) => h.box(len, 0.016, 0.015, skin));
      b.at(0.095 + len, -0.001, z, (h) => h.ellipsoid(0.008, 0.008, 0.0075, 5, 3, shade(skin, 1.04)));
    });
    const tz = thumb || 1;
    b.push(M4.translate(0.03, 0.0, tz * 0.04), M4.rotY(-tz * 0.75));
    b.at(0.03, 0, 0, (h) => h.box(0.055, 0.017, 0.018, skin));
    b.pop();
    return b;
  }

  const CAR_WHITE = 0xf0efea;
  const TRIM = 0x26272b;
  const INSIDE = 0x9d968a;
  const FLOOR = 0x2a2a2d;
  const SEAT = 0xc4b8a4;
  const DASH = 0x2c2e32;
  const CAR = { floor: 0.3, belt: 0.95, wheelR: 0.33, axles: [1.45, -1.32], track: 0.84, door: [-0.36, 0.84], hinge: [0.915, 0.84] };

  const HOOD = [[2.36, 0.8, 0.3, 0.5, 0.58], [2.3, 0.86, 0.24, 0.54, 0.68], [2.12, 0.89, 0.22, 0.6, 0.76], [1.6, 0.91, 0.22, 0.66, 0.83], [0.92, 0.91, 0.22, 0.72, 0.9]];
  const CABIN = [[0.92, 0.91, 0.22, 0.8, 0.95], [0.84, 0.912, 0.22, 0.8, 0.95], [0.2, 0.915, 0.22, 0.8, 0.95], [-0.36, 0.914, 0.22, 0.8, 0.95], [-1.18, 0.91, 0.22, 0.8, 0.97]];
  const DECK = [[-1.18, 0.91, 0.22, 0.8, 0.98], [-1.6, 0.91, 0.22, 0.79, 0.985], [-2.1, 0.89, 0.24, 0.74, 0.96], [-2.3, 0.86, 0.3, 0.64, 0.86], [-2.36, 0.8, 0.36, 0.56, 0.74]];

  function profile(st, open) {
    const [, w, yb, ys, yt] = st;
    const p = [[-(w - 0.05), yb], [w - 0.05, yb], [w, yb + 0.1], [w, ys], [w - 0.08, yt]];
    if (open) p.push([w - 0.11, yt], [w - 0.11, CAR.floor], [-(w - 0.11), CAR.floor], [-(w - 0.11), yt]);
    p.push([-(w - 0.08), yt], [-w, ys], [-w, yb + 0.1]);
    return p;
  }

  function segColor(open, i, n) {
    if (i === 0) return 0x1e1f22;
    if (!open) return CAR_WHITE;
    if (i === 4 || i === 8) return TRIM;
    if (i === 5 || i === 7) return INSIDE;
    if (i === 6) return FLOOR;
    return CAR_WHITE;
  }

  function loft(b, stations, open, skipSide) {
    for (let k = 0; k + 1 < stations.length; k++) {
      const A = profile(stations[k], open), B = profile(stations[k + 1], open);
      const za = stations[k][0], zb = stations[k + 1][0];
      const gap = skipSide && skipSide(za, zb);
      for (let i = 0; i < A.length; i++) {
        const j = (i + 1) % A.length;
        if (gap && i >= 1 && i <= 5) continue;
        const dx = A[j][0] - A[i][0], dy = A[j][1] - A[i][1];
        const n = V3.norm([dy, -dx, 0]);
        b.quad([A[i][0], A[i][1], za], [A[j][0], A[j][1], za], [B[j][0], B[j][1], zb], [B[i][0], B[i][1], zb], segColor(open, i, A.length), null, [n, n, n, n]);
      }
    }
  }

  function cap(b, st, dir) {
    const p = profile(st, false);
    const cy = (st[2] + st[4]) / 2;
    const n = [0, 0, dir];
    for (let i = 0; i < p.length; i++) {
      const j = (i + 1) % p.length;
      b.tri([0, cy, st[0]], [p[i][0], p[i][1], st[0]], [p[j][0], p[j][1], st[0]], CAR_WHITE, null, [n, n, n]);
    }
  }

  function seat(b, x, z, w, back, tall) {
    b.at(x, 0.4, z, (h) => h.box(w * 0.94, 0.1, 0.46, shade(SEAT, 0.78)));
    b.at(x, 0.48, z + 0.02, (h) => h.ellipsoid(w * 0.5, 0.065, 0.26, 10, 4, SEAT));
    [-1, 1].forEach(s => b.at(x + s * w * 0.4, 0.5, z, (h) => h.ellipsoid(w * 0.12, 0.07, 0.25, 6, 3, shade(SEAT, 0.92))));
    b.push(M4.translate(x, 0.52, z - 0.24), M4.rotX(-0.22));
    b.at(0, tall * 0.45, -0.05, (h) => h.box(w * 0.92, tall * 0.9, 0.1, SEAT));
    b.at(0, tall * 0.9, -0.05, (h) => h.ellipsoid(w * 0.46, 0.07, 0.065, 10, 4, SEAT));
    [-1, 1].forEach(s => b.at(s * w * 0.4, tall * 0.45, 0.0, (h) => h.ellipsoid(w * 0.1, tall * 0.42, 0.06, 6, 4, shade(SEAT, 0.92))));
    b.at(0, tall * 0.45, 0.002, (h) => h.box(w * 0.56, tall * 0.74, 0.012, shade(SEAT, 0.9)));
    if (back) {
      [-1, 1].forEach(s => b.at(s * 0.06, tall * 0.95, -0.06, (h) => h.box(0.014, 0.1, 0.014, SILVER)));
      b.at(0, tall + 0.1, -0.06, (h) => h.ellipsoid(w * 0.3, 0.1, 0.06, 10, 5, SEAT));
    }
    b.pop();
  }

  function arch(b, z, s) {
    const n = [s, 0, 0];
    for (let i = 0; i < 10; i++) {
      const a0 = (i / 10) * PI, a1 = ((i + 1) / 10) * PI;
      const x = s * 0.918;
      b.quad([x, 0.33 + S(a0) * 0.37, z + C(a0) * 0.37], [x, 0.33 + S(a1) * 0.37, z + C(a1) * 0.37], [x, 0.33 + S(a1) * 0.43, z + C(a1) * 0.43], [x, 0.33 + S(a0) * 0.43, z + C(a0) * 0.43], 0x1c1c1f, null, [n, n, n, n]);
    }
  }

  function carBody() {
    const b = new Builder();
    loft(b, HOOD, false);
    loft(b, CABIN, true, (za, zb) => za === 0.84 || (za === 0.2 && zb === -0.36));
    loft(b, DECK, false);
    cap(b, HOOD[0], 1);
    cap(b, DECK[DECK.length - 1], -1);
    b.quad([-0.8, CAR.floor, 0.92], [0.8, CAR.floor, 0.92], [0.8, 0.9, 0.92], [-0.8, 0.9, 0.92], DASH, null, NB);
    b.quad([-0.8, CAR.floor, -1.18], [0.8, CAR.floor, -1.18], [0.8, 0.97, -1.18], [-0.8, 0.97, -1.18], INSIDE, null, NZ);
    b.at(0, 0.76, 0.8, (h) => h.box(1.6, 0.26, 0.26, DASH));
    b.at(0.38, 0.92, 0.74, (h) => h.box(0.36, 0.08, 0.16, shade(DASH, 0.85)));
    b.at(0, 0.62, 0.5, (h) => h.box(0.2, 0.34, 0.36, shade(DASH, 1.1)));
    b.at(0, 0.62, -0.3, (h) => h.box(0.18, 0.16, 0.6, shade(DASH, 1.2)));
    b.at(0.0, 0.8, 0.94, (h) => h.box(0.3, 0.14, 0.01, [0.2, 0.22, 0.26, 0.2]));
    seat(b, 0.38, 0.0, 0.5, true, 0.62);
    seat(b, -0.38, 0.0, 0.5, true, 0.62);
    seat(b, 0.36, -0.82, 0.46, false, 0.5);
    seat(b, -0.36, -0.82, 0.46, false, 0.5);
    [-1, 1].forEach(s => {
      bar(b, [s * 0.82, 0.93, 0.9], [s * 0.72, 1.37, 0.38], 0.045, TRIM);
      b.at(s * 0.68, 0.61, 2.3, (h) => h.ellipsoid(0.15, 0.06, 0.06, 8, 4, [0.92, 0.94, 0.96, 0.45]));
      b.at(s * 0.68, 0.61, 2.33, (h) => h.ellipsoid(0.07, 0.035, 0.03, 6, 3, [1, 1, 0.96, 0.8]));
      b.at(s * 0.7, 0.8, -2.355, (h) => h.box(0.26, 0.12, 0.02, [0.78, 0.08, 0.1, 0.45]));
      b.at(s * 0.7, 0.8, -2.36, (h) => h.box(0.12, 0.05, 0.02, [1, 0.5, 0.3, 0.6]));
      b.push(M4.translate(s * 0.98, 1.0, 0.8), M4.rotY(s * 0.2));
      b.box(0.1, 0.08, 0.06, CAR_WHITE);
      b.at(-s * 0.03, 0, -0.032, (h) => h.box(0.08, 0.065, 0.004, [0.6, 0.66, 0.72, 0.35]));
      b.pop();
      b.at(s * 0.93, 0.18, 0.06, (h) => h.box(0.04, 0.06, 1.9, 0x1e1f22));
      arch(b, CAR.axles[0], s);
      arch(b, CAR.axles[1], s);
    });
    b.at(-0.92, 0.82, -0.2, (h) => h.box(0.01, 0.018, 0.1, SILVER));
    bar(b, [-0.72, 1.37, 0.38], [0.72, 1.37, 0.38], 0.05, TRIM);
    b.at(0, 0.48, 2.37, (h) => h.box(0.62, 0.14, 0.02, 0x1a1b1e));
    b.at(0, 0.48, 2.385, (h) => h.box(0.6, 0.02, 0.01, SILVER));
    b.at(0, 0.28, 2.33, (h) => h.box(1.5, 0.12, 0.08, 0x2a2b2e));
    b.at(0, 0.36, -2.36, (h) => h.box(1.5, 0.12, 0.06, 0x2a2b2e));
    b.at(0, 1.33, 0.45, (h) => h.box(0.24, 0.06, 0.02, 0x1a1b1e));
    return b;
  }

  function carDoor() {
    const b = new Builder();
    const [z0, z1] = CAR.door;
    const w = 0.914;
    const pts = [[w - 0.05, 0.22], [w, 0.32], [w, 0.8], [w - 0.08, 0.95], [w - 0.11, 0.95], [w - 0.11, 0.32]];
    const cols = [CAR_WHITE, CAR_WHITE, CAR_WHITE, TRIM, INSIDE, 0x1e1f22];
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      const n = V3.norm([pts[j][1] - pts[i][1], -(pts[j][0] - pts[i][0]), 0]);
      b.quad([pts[i][0], pts[i][1], z0], [pts[j][0], pts[j][1], z0], [pts[j][0], pts[j][1], z1], [pts[i][0], pts[i][1], z1], cols[i], null, [n, n, n, n]);
    }
    const cx = w - 0.055, cy = 0.6;
    [[z0, -1], [z1, 1]].forEach(([z, s]) => {
      for (let i = 0; i < pts.length; i++) {
        const j = (i + 1) % pts.length;
        b.tri([cx, cy, z], [pts[i][0], pts[i][1], z], [pts[j][0], pts[j][1], z], INSIDE, null, [[0, 0, s], [0, 0, s], [0, 0, s]]);
      }
    });
    b.at(w + 0.006, 0.82, z0 + 0.18, (h) => h.box(0.012, 0.02, 0.11, SILVER));
    b.at(w - 0.13, 0.72, (z0 + z1) / 2, (h) => h.box(0.04, 0.05, 0.6, shade(INSIDE, 0.8)));
    return b;
  }

  function carGlass() {
    const b = new Builder();
    const n = V3.norm([0, 0.8, 0.6]);
    b.quad([-0.8, 0.93, 0.9], [0.8, 0.93, 0.9], [0.7, 1.35, 0.4], [-0.7, 1.35, 0.4], [1, 1, 1, 0.2], [[0, 0], [1, 0], [1, 1], [0, 1]], [n, n, n, n]);
    return b;
  }

  function carWheel() {
    const b = new Builder();
    b.push(M4.rotZ(PI / 2));
    b.prism(16, CAR.wheelR, CAR.wheelR, -0.1, CAR.wheelR, CAR.wheelR, 0.1, 0x161618, { capTop: false, capBottom: true });
    b.prism(16, CAR.wheelR * 0.94, CAR.wheelR * 0.94, -0.105, CAR.wheelR, CAR.wheelR, -0.1, 0x222225, { capTop: false });
    b.pop();
    b.at(-0.101, 0, 0, (h) => {
      h.push(M4.rotZ(PI / 2));
      h.disc(CAR.wheelR * 0.66, 16, SILVER, 0);
      h.pop();
    });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * PI * 2;
      b.push(M4.translate(-0.104, 0, 0), M4.rotX(a));
      b.at(0, CAR.wheelR * 0.33, 0, (h) => h.box(0.006, CAR.wheelR * 0.56, 0.035, 0x5a5e66));
      b.pop();
    }
    b.at(-0.106, 0, 0, (h) => h.box(0.01, 0.06, 0.06, shine(0xdde0e4, 0.2)));
    return b;
  }

  function steering() {
    const b = new Builder();
    const r = 0.17, n = 18;
    for (let i = 0; i < n; i++) {
      const am = ((i + 0.5) / n) * PI * 2;
      b.push(M4.translate(C(am) * r, S(am) * r, 0), M4.rotZ(am));
      b.box(0.024, (2 * PI * r) / n + 0.006, 0.03, 0x1c1c1f);
      b.pop();
    }
    b.box(0.07, 0.06, 0.05, 0x2a2b2e);
    [0, PI * 0.9, PI * 0.1].forEach((a, i) => {
      const len = i === 0 ? r : r;
      b.push(M4.rotZ(i === 0 ? -PI / 2 : a));
      b.at(len / 2, 0, 0, (h) => h.box(len, 0.03, 0.016, 0x2a2b2e));
      b.pop();
    });
    b.at(0, 0, -0.16, (h) => h.box(0.05, 0.05, 0.3, 0x222326));
    return b;
  }

  const BLOOM = {
    white: [0xf6f4ee, 0xe8e6de], cream: [0xf4ead6, 0xe6d6b8], red: [0xd21e32, 0xa8121e], rose: [0xec5a8a, 0xc8366a], peony: [0xf08ab0, 0xe06a98],
    blush: [0xf8c0cc, 0xeaa0b0], yellow: [0xf6c83a, 0xe0a020], orange: [0xf08a36, 0xd06a1e], blue: [0x9ac8f0, 0x6aa0dc], lilac: [0xc8a0e0, 0xa680c8]
  };
  const LEAF = [0x3e6a2e, 0x4e7c38, 0x2e5424];

  function head(b, x, y, z, r, kind) {
    const [c0, c1] = BLOOM[kind];
    b.at(x, y, z, (h) => h.ellipsoid(r, r * 0.8, r, 6, 3, c1));
    b.at(x, y + r * 0.42, z, (h) => h.ellipsoid(r * 0.62, r * 0.36, r * 0.62, 6, 2, c0));
  }

  function leaf(b, x, y, z, a, len, col) {
    const d = [C(a) * len, 0.02, S(a) * len];
    const w = [-S(a) * len * 0.28, 0, C(a) * len * 0.28];
    b.quad([x, y, z], [x + d[0] * 0.5 + w[0], y + 0.012, z + d[2] * 0.5 + w[2]], [x + d[0], y + d[1], z + d[2]], [x + d[0] * 0.5 - w[0], y + 0.012, z + d[2] * 0.5 - w[2]], col, null, [[0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]]);
  }

  function bouquet(b, cx, cy, cz, kinds, n, spread, seed) {
    let s = seed;
    const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < n; i++) {
      const a = rnd() * PI * 2, rr = Math.sqrt(rnd()) * spread;
      const x = cx + C(a) * rr * 1.2, z = cz + S(a) * rr * 0.8, y = cy + (1 - rr / spread) * 0.06 + rnd() * 0.03;
      head(b, x, y, z, 0.03 + rnd() * 0.022, kinds[i % kinds.length]);
    }
    for (let i = 0; i < Math.ceil(n * 0.8); i++) {
      const a = rnd() * PI * 2, rr = spread * (0.7 + rnd() * 0.5);
      leaf(b, cx + C(a) * rr * 0.6, cy - 0.01, cz + S(a) * rr * 0.5, a, 0.08 + rnd() * 0.05, LEAF[i % 3]);
    }
  }

  function hoodBouquet(b, x, z, kinds, n, seed, stems) {
    bouquet(b, x, 0.93, z, kinds, n, 0.09, seed);
    for (let i = 0; i < 6; i++) bar(b, [x + (i - 2.5) * 0.012, 0.91, z - 0.04], [x + (i - 2.5) * 0.02 + stems[0], 0.9, z - 0.04 + stems[1]], 0.008, 0x4a7a30);
  }

  function carFlowers() {
    const b = new Builder();
    hoodBouquet(b, -0.48, 1.2, ['white', 'white', 'cream'], 11, 3, [0.08, -0.26]);
    hoodBouquet(b, 0.5, 1.16, ['peony', 'rose', 'peony', 'blush'], 9, 11, [-0.14, -0.24]);
    leaf(b, 0.42, 0.93, 1.02, -2.2, 0.16, LEAF[1]);
    leaf(b, 0.58, 0.93, 1.0, -1.6, 0.18, LEAF[0]);
    [
      [-0.45, 0.66, -0.78, ['red', 'red', 'rose'], 14, 0.18],
      [0.0, 0.7, -0.84, ['yellow', 'orange', 'red'], 12, 0.16],
      [0.42, 0.66, -0.8, ['peony', 'blush', 'rose'], 13, 0.18],
      [-0.3, 0.86, -1.02, ['blue', 'white', 'lilac'], 10, 0.15],
      [0.3, 0.88, -1.04, ['red', 'peony', 'yellow'], 11, 0.16],
      [0.0, 0.98, -1.2, ['rose', 'white', 'orange'], 10, 0.2],
      [-0.6, 0.94, -1.25, ['peony', 'red'], 8, 0.14],
      [0.62, 0.94, -1.24, ['blue', 'blush'], 8, 0.14]
    ].forEach(([x, y, z, kinds, n, sp], i) => bouquet(b, x, y, z, kinds, n, sp, 17 + i * 13));
    return b;
  }

  const SEATS = { driver: [0.38, 0.0], passenger: [-0.38, 0.0], hipY: 0.62 };

  window.P3DHelloCast = {
    FORMS, DANCER_IDS, CAR, SEATS, PEOPLE_IDS: ['khSinger', 'khGirl'],
    carBody, carDoor, carGlass, carWheel, carFlowers, steering, goldFrame, macroArm, bouquet,
    SKINS: { singer: SINGER_SKIN, girl: GIRL_SKIN },
    COLORS: { PINK, PINK_DK, TEE, BLACK, CHARCOAL, CAR_WHITE }
  };
})();
