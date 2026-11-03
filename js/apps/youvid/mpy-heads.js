(function () {
  const { M4, V3, rgb, rand } = window.P3D;
  const K = window.YouVidKit;
  const { PI, S, C, clamp, lerp } = K;

  const g2 = (x, s) => Math.exp(-(x / s) * (x / s));
  const smooth = (e0, e1, x) => { const k = clamp((x - e0) / (e1 - e0), 0, 1); return k * k * (3 - 2 * k); };

  const SKIN_MAT = { spec: [0.12, 9], rim: 1.0 };
  const CLOTH_MAT = { spec: [0.08, 6], rim: 0.85 };
  const EYE_MAT = { spec: [0.9, 60], rim: 0.2 };
  const GLASS_MAT = { spec: [1.2, 70], rim: 0.4 };

  function table(rows) {
    return (x) => {
      const n = rows.length;
      if (x <= rows[0][0]) return rows[0][1];
      if (x >= rows[n - 1][0]) return rows[n - 1][1];
      let i = 0;
      while (i < n - 2 && x > rows[i + 1][0]) i++;
      const p0 = rows[Math.max(0, i - 1)], p1 = rows[i], p2 = rows[i + 1], p3 = rows[Math.min(n - 1, i + 2)];
      const h = p2[0] - p1[0];
      const t = (x - p1[0]) / h;
      const m1 = (p2[1] - p0[1]) / (p2[0] - p0[0]) * h;
      const m2 = (p3[1] - p1[1]) / (p3[0] - p1[0]) * h;
      const t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * p1[1] + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2[1] + (t3 - t2) * m2;
    };
  }

  const YT = table([[-1.571, -0.128], [-1.25, -0.126], [-0.95, -0.116], [-0.7, -0.098], [-0.45, -0.068], [-0.2, -0.03], [0.05, 0.008], [0.3, 0.044], [0.6, 0.076], [0.9, 0.096], [1.2, 0.113], [1.571, 0.12]]);
  const HW = table([[-1.571, 0.022], [-1.25, 0.045], [-0.95, 0.058], [-0.7, 0.063], [-0.45, 0.066], [-0.2, 0.069], [0.05, 0.071], [0.3, 0.072], [0.6, 0.067], [0.9, 0.053], [1.2, 0.033], [1.571, 0.0]]);
  const DF = table([[-1.571, 0.03], [-1.25, 0.07], [-0.95, 0.086], [-0.7, 0.084], [-0.45, 0.087], [-0.2, 0.088], [0.05, 0.087], [0.3, 0.09], [0.6, 0.086], [0.9, 0.07], [1.2, 0.046], [1.571, 0.0]]);
  const DB = table([[-1.571, 0.02], [-1.0, 0.046], [-0.5, 0.068], [0.0, 0.086], [0.5, 0.092], [0.95, 0.072], [1.3, 0.04], [1.571, 0.0]]);

  const TYPES = {
    spy: { kw: 0.95, kh: 1.03, kd: 1.0, jaw: 0.95, chin: 1.2, nose: 0.036, noseW: 0.14, skin: 0xd8a07c, mask: { red: 0x4a1e1a, blu: 0x26304c }, brow: 0x2a2220, noEars: true, browRidge: 0.012 },
    medic: { kw: 1.0, kh: 1.04, kd: 1.02, jaw: 1.0, chin: 1.45, nose: 0.032, noseW: 0.16, skin: 0xe6b792, hair: 0x1c1a1c, brow: 0x1c1a1c, glasses: 'round' },
    sniper: { kw: 0.93, kh: 1.05, kd: 1.0, jaw: 0.88, chin: 1.15, nose: 0.036, noseW: 0.14, skin: 0xd09a72, stubble: 0xb48464, hair: 0x4a3426, brow: 0x3a2a20, glasses: 'aviator', hat: true }
  };

  const EYE_A = 0.35, EYE_P = 0.16, EYE_R = 0.0118, LIP_P = -0.56;

  function rawPt(T, a, p) {
    const sa = S(a), ca = C(a);
    const jawZone = smooth(-0.2, -0.6, p) * (1 - smooth(-1.1, -1.4, p));
    const q = 0.16 * jawZone;
    const hw = HW(p) * T.kw * lerp(1, T.jaw, jawZone);
    const d = ca > 0 ? DF(p) * T.kd : DB(p) * T.kd;
    const chin = ca > 0 ? 0.008 * (T.chin - 1) * g2(p + 1.0, 0.25) * ca * ca : 0;
    return [sa * hw * (1 + q * ca * ca), YT(p) * T.kh, ca * d * (1 + q * sa * sa) + chin];
  }

  function normalAt(T, a, p) {
    const e = 0.004;
    const n = V3.cross(V3.sub(rawPt(T, a + e, p), rawPt(T, a - e, p)), V3.sub(rawPt(T, a, Math.min(p + e, 1.569)), rawPt(T, a, Math.max(p - e, -1.569))));
    const l = V3.len(n);
    return l > 1e-9 ? V3.mul(n, 1 / l) : V3.norm(rawPt(T, a, p));
  }

  function relief(T, a, p) {
    const A = Math.abs(a);
    let h = 0;
    const prof = (smooth(0.15, 0.02, p) * 0.5 + smooth(0.02, -0.3, p) * 0.5) * (1 - smooth(-0.33, -0.39, p));
    const width = T.noseW * (0.75 + 0.45 * smooth(0.05, -0.3, p));
    h += T.nose * prof * g2(a, width);
    h += T.nose * 0.22 * g2(a, 0.1) * g2(p + 0.29, 0.05);
    h += 0.005 * g2(A - 0.11, 0.045) * g2(p + 0.32, 0.04);
    h += (T.browRidge || 0.007) * g2(A - 0.3, 0.17) * g2(p - 0.29, 0.05);
    h += 0.004 * g2(a, 0.1) * g2(p - 0.27, 0.05);
    h += 0.006 * g2(A - 0.62, 0.15) * g2(p + 0.05, 0.1);
    h -= 0.004 * g2(A - 0.5, 0.12) * g2(p + 0.3, 0.12);
    h += 0.011 * g2(a, 0.26) * g2(p - (LIP_P + 0.05), 0.035);
    h += 0.012 * g2(a, 0.23) * g2(p - (LIP_P - 0.055), 0.035);
    h -= 0.007 * g2(a, 0.22) * g2(p - (LIP_P - 0.14), 0.045);
    h += 0.02 * T.chin * g2(a, 0.32) * g2(p + 0.98, 0.15);
    h -= 0.012 * g2(A - EYE_A, 0.1) * g2(p - EYE_P, 0.065);
    h += 0.006 * g2(A - EYE_A, 0.14) * g2(p - (EYE_P - 0.13), 0.05);
    return h;
  }

  function surf(T, a, p) {
    return V3.add(rawPt(T, a, p), V3.mul(normalAt(T, a, p), relief(T, a, p)));
  }

  function regionCol(T, kind, a, p, team) {
    const A = Math.abs(a);
    if (kind === 'spy') {
      const eyeHole = Math.hypot((A - EYE_A) / 0.17, (p - EYE_P) / 0.09) < 1;
      const lower = A < 0.46 && p < -0.1 && p > -1.3 && Math.cos(a) > 0.3;
      const bridge = A < 0.13 && p < 0.24 && p > -0.4;
      return eyeHole || lower || bridge ? T.skin : T.mask[team || 'red'];
    }
    if (kind === 'medic') {
      const hairline = 0.6 - 0.1 * smooth(0.4, 1.4, A);
      if (p > hairline || (Math.cos(a) < -0.1 && p > -0.25)) return T.hair;
      if (A > 1.2 && A < 1.6 && p > -0.05 && p < 0.42) return T.hair;
      if (Math.hypot((A - 0.33) / 0.14, (p - 0.3) / 0.028) < 1) return T.brow;
      return T.skin;
    }
    if (kind === 'sniper') {
      if (A > 1.15 && A < 1.62 && p > -0.4 && p < 0.35) return T.hair;
      if (p > 0.55 || (Math.cos(a) < -0.2 && p > -0.2)) return T.hair;
      if (Math.hypot((A - 0.33) / 0.14, (p - 0.3) / 0.028) < 1) return T.brow;
      if (p < -0.36 && Math.cos(a) > 0.2 && !(A < 0.28 && p > LIP_P - 0.1 && p < LIP_P + 0.06)) return T.stubble;
      return T.skin;
    }
    return T.skin;
  }

  function buildHead(b, kind, team) {
    const T = TYPES[kind];
    const NU = 48, NV = 34;
    const P = (i, j) => [(i / NU) * PI * 2 - PI, -1.565 + (3.13 * j) / NV];
    for (let j = 0; j < NV; j++) {
      for (let i = 0; i < NU; i++) {
        const q = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
        b.quad(...q.map(([a, p]) => surf(T, a, p)), q.map(([a, p]) => rgb(regionCol(T, kind, a, p, team))), null, q.map(([a, p]) => normalAt(T, a, p)));
      }
    }
    if (!T.noEars) [-1, 1].forEach(s => {
      const e = surf(T, s * 1.52, 0.06);
      const col = kind === 'spy' ? T.mask[team || 'red'] : T.skin;
      b.at(e[0] + s * 0.002, e[1], e[2] - 0.006, h => { h.push(M4.rotY(s * 0.25)); h.ellipsoid(0.008, 0.024, 0.016, 10, 6, col); h.pop(); });
    });
    return b;
  }

  function eyeFrame(T, s) {
    const a = s * EYE_A, p = EYE_P;
    const q = rawPt(T, a, p);
    const n = normalAt(T, a, p);
    const c = V3.sub(q, V3.mul(n, EYE_R * 0.75));
    const z = V3.norm([s * 0.12, 0.02, 1]);
    const x = V3.norm(V3.cross([0, 1, 0], z));
    return { c, x, y: V3.cross(z, x), z };
  }

  function frameM(f) {
    return new Float32Array([f.x[0], f.x[1], f.x[2], 0, f.y[0], f.y[1], f.y[2], 0, f.z[0], f.z[1], f.z[2], 0, f.c[0], f.c[1], f.c[2], 1]);
  }

  function buildEye(b) {
    b.ellipsoid(1, 1, 1, 14, 10, 0xf4f2ec, { colorAt: p => (p[2] > 0.9 ? 0x141210 : p[2] > 0.72 ? 0x4a3828 : 0xf4f2ec) });
    return b;
  }

  function buildLid(b, col) {
    K.spherePatch(b, 1.12, 1.12, 1.12, -1.3, 1.3, 0.0, 1.5, 12, 6, col);
    return b;
  }

  function buildMouth(b) {
    K.discXY(b, 0, 0, 0, 1, 20, rgb(0x2a0c0a));
    return b;
  }

  function buildTeeth(b) {
    b.box(1, 0.35, 0.2, 0xf4f0e4);
    return b;
  }

  function buildGlasses(b, kind) {
    const torusAt = (h, R, r, col) => {
      for (let i = 0; i < 20; i++) {
        const a0 = (i / 20) * PI * 2, a1 = ((i + 1) / 20) * PI * 2;
        const p0 = [C(a0) * R, S(a0) * R, 0], p1 = [C(a1) * R, S(a1) * R, 0];
        K.tube(h, [p0, p1], [r, r], 5, col);
      }
    };
    if (kind === 'round') {
      [-1, 1].forEach(s => b.at(s * 0.033, 0, 0, h => { torusAt(h, 0.021, 0.0022, 0x2a2826); }));
      b.at(0, 0.003, 0.002, h => h.box(0.022, 0.003, 0.003, 0x2a2826));
      [-1, 1].forEach(s => b.at(s * 0.057, 0, -0.045, h => h.box(0.003, 0.003, 0.09, 0x2a2826)));
    } else {
      [-1, 1].forEach(s => b.at(s * 0.034, 0, 0, h => {
        h.push(M4.scale(1.15, 0.9, 1));
        torusAt(h, 0.022, 0.0022, 0xc8b070);
        h.pop();
      }));
      b.at(0, 0.012, 0.0, h => h.box(0.026, 0.003, 0.003, 0xc8b070));
      [-1, 1].forEach(s => b.at(s * 0.06, 0.004, -0.045, h => h.box(0.003, 0.003, 0.09, 0xc8b070)));
    }
    return b;
  }

  function buildLensPair(b, kind) {
    [-1, 1].forEach(s => b.at(s * (kind === 'round' ? 0.033 : 0.034), 0, -0.001, h => {
      if (kind !== 'round') h.push(M4.scale(1.15, 0.9, 1));
      h.ellipsoid(0.02, 0.02, 0.002, 14, 4, 0xffffff);
      if (kind !== 'round') h.pop();
    }));
    return b;
  }

  function buildHat(b) {
    const brim = 0x6a4e34, crown = 0x7a5a3c, band = 0x3a2a20;
    b.push(M4.translate(0, 0.075, -0.004));
    b.prism(26, 0.175, 0.16, -0.004, 0.17, 0.155, 0.006, brim, { capBottom: true });
    b.prism(22, 0.088, 0.096, 0.004, 0.078, 0.086, 0.07, crown, {});
    b.prism(22, 0.09, 0.098, 0.006, 0.09, 0.098, 0.022, band, { capTop: false });
    b.at(0, 0.07, 0, h => h.ellipsoid(0.078, 0.022, 0.086, 16, 6, crown));
    b.at(0, 0.075, 0, h => h.box(0.02, 0.012, 0.13, 0x5a4230));
    b.pop();
    return b;
  }

  function buildBust(b, kind, team) {
    const suit = team === 'blu' ? 0x2c3654 : 0x5a2a24, suitDk = team === 'blu' ? 0x1e2640 : 0x3e1c18;
    const shirt = team === 'blu' ? 0x3c5486 : 0x8a3a30, tie = 0x141214;
    const neckCol = kind === 'spy' ? TYPES.spy.mask[team || 'red'] : kind === 'medic' ? TYPES.medic.skin : TYPES.sniper.skin;
    b.prism(16, 0.055, 0.05, -0.06, 0.05, 0.046, 0.11, neckCol, {});
    if (kind === 'spy') {
      b.prism(18, 0.068, 0.062, -0.07, 0.062, 0.058, 0.0, shirt, {});
      b.push(M4.translate(0, -0.04, 0.05), M4.rotX(-0.1));
      b.box(0.03, 0.04, 0.01, tie);
      b.at(0, -0.12, -0.004, h => { h.push(M4.rotX(0.1)); h.box(0.036, 0.2, 0.008, tie); h.pop(); });
      b.pop();
      [-1, 1].forEach(s => {
        b.push(M4.translate(s * 0.05, -0.1, 0.06), M4.rotZ(s * 0.35), M4.rotX(-0.15));
        b.box(0.05, 0.16, 0.014, suitDk);
        b.pop();
      });
      b.at(0, -0.26, -0.01, h => h.ellipsoid(0.22, 0.24, 0.13, 20, 12, suit));
      b.at(0, -0.1, -0.01, h => h.ellipsoid(0.2, 0.09, 0.12, 20, 10, suit));
    } else if (kind === 'medic') {
      b.prism(18, 0.066, 0.06, -0.07, 0.06, 0.056, 0.0, 0x8aa8c8, {});
      b.push(M4.translate(0, -0.06, 0.055));
      b.box(0.028, 0.03, 0.01, 0x2a3040);
      b.at(0, -0.1, -0.003, h => h.box(0.034, 0.17, 0.008, 0x2a3040));
      b.pop();
      b.at(0, -0.26, -0.01, h => h.ellipsoid(0.22, 0.24, 0.13, 20, 12, 0xb4c0cc));
      b.at(0, -0.1, -0.01, h => h.ellipsoid(0.2, 0.09, 0.12, 20, 10, 0xb4c0cc));
      [-1, 1].forEach(s => { b.push(M4.translate(s * 0.06, -0.08, 0.07), M4.rotZ(s * 0.4)); b.box(0.05, 0.13, 0.012, 0xd8dcde); b.pop(); });
    } else {
      b.at(0, -0.26, -0.01, h => h.ellipsoid(0.21, 0.24, 0.13, 20, 12, 0x4a6aa8));
      b.at(0, -0.1, -0.01, h => h.ellipsoid(0.19, 0.09, 0.12, 20, 10, 0x4a6aa8));
      b.prism(18, 0.064, 0.06, -0.07, 0.06, 0.056, 0.0, 0x4a6aa8, {});
    }
    return b;
  }

  function build(r, fx) {
    const mk = (fn) => K.mesh(r, fn);
    const P = { r, heads: {}, busts: {}, eye: mk(buildEye), mouth: mk(buildMouth), teeth: mk(buildTeeth), hat: mk(buildHat), lidSkin: {}, glasses: {}, lenses: {}, eyes: {} };
    Object.keys(TYPES).forEach(kind => {
      const T = TYPES[kind];
      P.eyes[kind] = [eyeFrame(T, -1), eyeFrame(T, 1)];
      P.lidSkin[kind] = { red: mk(b => buildLid(b, kind === 'spy' ? T.mask.red : T.skin)), blu: mk(b => buildLid(b, kind === 'spy' ? T.mask.blu : T.skin)) };
      if (T.glasses) {
        P.glasses[kind] = mk(b => buildGlasses(b, T.glasses));
        P.lenses[kind] = mk(b => buildLensPair(b, T.glasses));
      }
    });
    return P;
  }

  function head(P, kind, team) {
    const key = kind + '|' + (team || 'red');
    if (!P.heads[key]) P.heads[key] = K.mesh(P.r, b => buildHead(b, kind, team));
    return P.heads[key];
  }

  function bust(P, kind, team) {
    const key = kind + '|' + (team || 'red');
    if (!P.busts[key]) P.busts[key] = K.mesh(P.r, b => buildBust(b, kind, team));
    return P.busts[key];
  }

  function draw(fx, P, kind, H, face, opts) {
    const o = opts || {};
    const T = TYPES[kind];
    const team = o.team || 'red';
    const tint = o.tint ? { tint: o.tint } : {};
    const skin = Object.assign({}, SKIN_MAT, tint);
    fx.draw(head(P, kind, team), H, skin);
    const F = face || {};
    const blink = clamp(F.blink || 0, 0, 1);
    const lidU = F.lidU === undefined ? 0.45 : F.lidU;
    const look = F.look || [0, 0];
    P.eyes[kind].forEach(f => {
      const EM = M4.mul(H, frameM(f));
      fx.draw(P.eye, M4.chain(EM, M4.rotY(clamp(look[0], -0.5, 0.5)), M4.rotX(-clamp(look[1], -0.4, 0.4)), M4.scale(EYE_R, EYE_R, EYE_R)), Object.assign({}, EYE_MAT, tint));
      const edge = lerp(lerp(-0.05, 0.62, lidU) - (F.browDown || 0) * 0.15, -0.15, blink);
      fx.draw(P.lidSkin[kind][team], M4.chain(EM, M4.rotX(-edge), M4.scale(EYE_R, EYE_R, EYE_R)), Object.assign({ spec: [0.08, 8], rim: 0.2 }, tint));
    });
    const lip = surf(T, 0, LIP_P);
    const n = normalAt(T, 0, LIP_P);
    const jaw = clamp(F.jaw || 0, 0, 1.2);
    const smile = clamp(F.smile || F.smileL || 0, 0, 1);
    const mw = 0.024 + smile * 0.01 + (F.wide || 0) * 0.006, mh = 0.0016 + jaw * 0.017;
    const MM = M4.chain(H, M4.translate(lip[0], lip[1] - mh * 0.35 - smile * 0.002, lip[2] + 0.0045), M4.rotX(-Math.atan2(n[1], n[2]) * 0.6));
    fx.draw(P.mouth, M4.mul(MM, M4.scale(mw, mh, 1)), { rim: 0, spec: [0, 1] });
    if (jaw > 0.2 || smile > 0.5) fx.draw(P.teeth, M4.chain(MM, M4.translate(0, mh * 0.55, -0.001), M4.scale(mw * 1.5, 0.018, 0.004)), { spec: [0.4, 20], rim: 0.1 });
    if (T.glasses && !o.noGlasses) {
      const GM = M4.chain(H, M4.translate(0, rawPt(T, 0, EYE_P)[1] + 0.002, rawPt(T, 0.33, EYE_P)[2] + 0.016));
      fx.draw(P.glasses[kind], GM, { spec: [0.7, 30], rim: 0.5 });
      fx.draw(P.lenses[kind], GM, Object.assign({}, GLASS_MAT, { blend: true, alpha: T.glasses === 'round' ? 0.25 : 0.7, tint: T.glasses === 'round' ? [0.8, 0.86, 0.9] : [1, 0.78, 0.25] }));
    }
    if (T.hat && !o.noHat) fx.draw(P.hat, H, CLOTH_MAT);
  }

  function drawBust(fx, P, kind, M, team, tint) {
    fx.draw(bust(P, kind, team), M, Object.assign({}, CLOTH_MAT, { rim: 0.35 }, tint ? { tint } : {}));
  }

  function point(kind, H, a, p, lift) {
    const T = TYPES[kind];
    return M4.point(H, V3.add(surf(T, a, p), V3.mul(normalAt(T, a, p), lift || 0)));
  }

  window.MpyHeads = { TYPES, LIP_P, EYE_P, build, draw, drawBust, head, point, surf };
})();
