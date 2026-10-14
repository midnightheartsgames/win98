(function (O) {
  'use strict';
  const B = { ROOT: 0, SPINE: 1, HEAD: 2, UAL: 3, LAL: 4, UAR: 5, LAR: 6, ULL: 7, LLL: 8, ULR: 9, LLR: 10, GUN: 11, BACK: 12, OFF: 13, ALT: 14 };
  const PARENT = [-1, 0, 1, 1, 3, 1, 5, 0, 7, 0, 9, 6, 1, 4, 6];
  O.BONES = B;
  O.BONE_PARENT = PARENT;
  const PI = Math.PI;
  const NOK = { hide: new Set() };

  function skel(h, o = {}) {
    const s = h / 1.8;
    const legs = o.legs || 1, broad = o.broad || 1, arms = o.arms || 1;
    const hip = 0.92 * s * legs;
    const sh = o.shY !== undefined ? o.shY : hip + 0.56 * s * (o.torso || 1);
    const neck = sh + (o.neck || 0.06) * s;
    const headR = (o.headR || 0.115) * s;
    const head = neck + headR + (o.neck ? o.neck * 0.83 : 0.05) * s;
    const sw = 0.2 * s * broad, hw = 0.1 * s * broad;
    const ua = 0.29 * s * arms, fa = 0.27 * s * arms;
    const th = (hip - 0.08 * s) * 0.52, sn = (hip - 0.08 * s) * 0.48;
    const S = { s, h, hip, waist: hip + 0.1 * s, chest: (hip + sh) / 2 + 0.06 * s, sh, neck, head, headR, sw, hw, ua, fa, th, sn, elbow: sh - ua, hand: sh - ua - fa, knee: hip - th, ankle: 0.08 * s, broad };
    S.J = [
      [0, hip, 0], [0, hip + 0.08 * s, 0], [0, neck, 0],
      [sw, sh, 0], [sw, S.elbow, 0], [-sw, sh, 0], [-sw, S.elbow, 0],
      [hw, hip, 0], [hw, S.knee, 0], [-hw, hip, 0], [-hw, S.knee, 0],
      [-sw, S.hand, 0], [0, S.chest, -0.14 * s], [sw, S.hand, 0], [-sw, S.hand, 0]
    ];
    return S;
  }
  O.skel = skel;

  function col(P, k, d) { const v = P[k]; return v === undefined ? d : v; }

  function limb(M, bone, a, b, r0, r1, c, seg) {
    M.bone(bone);
    M.tube([a, b], r0, c, { seg: seg || 7, r0, r1 });
    M.sphere(a[0], a[1], a[2], r0 * 1.02, r0 * 1.02, r0 * 1.02, c, { lat: 4, lon: 7 });
  }

  function gunFrame(M, bone, S, side, fn) {
    M.bone(bone);
    const x = side > 0 ? S.sw : -S.sw;
    M.at(x, S.hand, 0, PI / 2, 0, 0);
    fn();
    M.pop();
  }

  function headFront(S, fx, fy) {
    return 0.01 * S.s + S.headR * 0.98 * Math.sqrt(Math.max(0.05, 1 - (fx / 0.92) ** 2 - (fy / 1.08) ** 2));
  }

  function face(M, S, P, o = {}) {
    const R = S.headR, y0 = S.head;
    const skin = col(P, 'skin', 0xe8b898);
    M.bone(B.HEAD);
    const ey = o.eyeY === undefined ? 0.08 : o.eyeY;
    if (!o.noEyes) for (const sd of [-1, 1]) {
      const fx = sd * 0.34, z = headFront(S, fx, ey);
      M.box(fx * R, y0 + ey * R, z - R * 0.02, R * 0.27, R * 0.16, R * 0.1, col(P, 'sclera', 0xf2eee8));
      M.box(fx * R - sd * R * 0.02, y0 + ey * R - R * 0.01, z + R * 0.02, R * 0.13, R * 0.15, R * 0.06, col(P, 'eyes', 0x3a2a1c));
    }
    if (!o.noBrows) for (const sd of [-1, 1]) {
      const fx = sd * 0.34, fy = ey + 0.22;
      M.box(fx * R, y0 + fy * R, headFront(S, fx, fy) + R * 0.01, R * 0.34, R * 0.08, R * 0.09, col(P, 'brow', col(P, 'hair', 0x3a2a1c)), { rot: [0, 0, sd * -0.14] });
    }
    if (!o.noNose) M.box(0, y0 - R * 0.12, headFront(S, 0, -0.12) + R * 0.05, R * 0.15, R * 0.3, R * 0.16, skin, { bx: 1.3 });
    if (!o.noMouth) M.box(0, y0 - R * 0.47, headFront(S, 0, -0.47) - R * 0.01, R * (o.mouthW || 0.36), R * (o.mouthH || 0.08), R * 0.09, col(P, 'lip', 0xa0564a));
    if (!o.noEars) for (const sd of [-1, 1]) M.sphere(sd * R * 0.9, y0 + R * 0.02, -R * 0.05, R * 0.12, R * 0.22, R * 0.14, skin, { lat: 3, lon: 5 });
  }

  function human(M, S, P0, o = {}) {
    const s = S.s;
    const P = o.pal ? Object.assign({}, P0, o.pal) : P0;
    const skin = col(P, 'skin', 0xe8b898), top = col(P, 'top', 0x506080), pants = col(P, 'pants', 0x404650), boots = col(P, 'boots', 0x3a2a20), gloves = col(P, 'gloves', skin);
    const tw = (o.tw || 0.36) * s * S.broad, td = (o.td || 0.22) * s * (o.deep || 1);
    M.bone(B.ROOT);
    M.box(0, S.hip - 0.02 * s, 0, S.hw * 2 + (o.hipW || 0.15) * s, 0.2 * s, td * 1.02, col(P, 'hips', pants), { tx: 1.05, bx: 0.94 });
    M.bone(B.SPINE);
    if (!o.noTorso) {
      M.box(0, S.waist + 0.06 * s, 0, tw * (o.bellyW || 0.86), 0.2 * s, td * 0.95, col(P, 'belly', top), { tx: 1.08, bx: 0.96 });
      M.box(0, S.chest + 0.04 * s, 0.005 * s, tw, S.sh - S.chest + 0.1 * s, td, top, { tx: o.taper || 1.1, bx: 0.86 });
    }
    if (!o.noNeck) { M.bone(B.HEAD); M.cyl(0, S.neck + 0.02 * s, 0, 0.055 * s, 0.05 * s, 0.14 * s, 7, col(P, 'neck', skin)); }
    if (!o.noHead) {
      M.bone(B.HEAD);
      M.sphere(0, S.head, 0.01 * s, S.headR * 0.92, S.headR * 1.08, S.headR * 0.98, skin, { lat: 8, lon: 10 });
      if (!o.noFace) face(M, S, P, o.face || {});
    }
    const ar = (o.armR || 0.058) * s, fr = (o.foreR || 0.05) * s;
    for (const side of [1, -1]) {
      const x = side * S.sw;
      const UA = side > 0 ? B.UAL : B.UAR, LA = side > 0 ? B.LAL : B.LAR;
      if (!(o.noArm && o.noArm === side)) {
        const sleeve = col(P, side > 0 ? 'sleeveL' : 'sleeveR', col(P, 'sleeve', top));
        M.bone(UA);
        M.sphere(x * 1.02, S.sh - 0.01 * s, 0, ar * 1.45, ar * 1.3, ar * 1.35, col(P, 'shoulder', sleeve), { lat: 4, lon: 7 });
        limb(M, UA, [x, S.sh, 0], [x, S.elbow, 0], ar * 1.1, ar * 0.95, sleeve);
        limb(M, LA, [x, S.elbow, 0], [x, S.hand + 0.03 * s, 0], fr, fr * 0.85, col(P, side > 0 ? 'foreL' : 'foreR', col(P, 'fore', skin)));
        M.bone(LA);
        M.box(x, S.hand - 0.03 * s, 0.012 * s, 0.075 * s, 0.11 * s, 0.1 * s, gloves, { bx: 0.85, bz: 0.9 });
        M.box(x - side * 0.035 * s, S.hand - 0.02 * s, 0.045 * s, 0.025 * s, 0.07 * s, 0.03 * s, gloves, { rot: [0.3, 0, side * 0.4] });
      }
      if (!(o.noLeg && o.noLeg === side)) {
        const hx = side * S.hw;
        const UL = side > 0 ? B.ULL : B.ULR, LL = side > 0 ? B.LLL : B.LLR;
        const thR = (o.thighR || 0.085) * s, shR = (o.shinR || 0.065) * s;
        limb(M, UL, [hx, S.hip, 0], [hx, S.knee, 0], thR, thR * 0.78, col(P, 'thigh', pants));
        limb(M, LL, [hx, S.knee, 0], [hx, S.ankle + 0.05 * s, 0], shR, shR * 0.8, col(P, 'shin', pants));
        M.bone(LL);
        M.box(hx, S.ankle * 0.7, 0.045 * s, 0.12 * s, S.ankle * 1.5, 0.27 * s, boots, { tz: 0.85, tx: 0.9 });
      }
    }
  }

  function hairSpikes(M, S, c, n, o = {}) {
    M.bone(B.HEAD);
    const r = O.rng(o.seed || 7);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * PI * 2 + r() * 0.3;
      const up = 0.25 + r() * 0.6;
      const len = S.headR * (o.len || 0.9) * (0.7 + r() * 0.6);
      const cx = Math.cos(a) * S.headR * 0.55, cz = Math.sin(a) * S.headR * 0.55 - S.headR * (o.back || 0.15);
      M.at(cx, S.head + S.headR * (0.55 + up * 0.3), cz, Math.sin(a) * (1.2 - up), 0, -Math.cos(a) * (1.2 - up));
      M.cyl(0, len * 0.35, 0, S.headR * 0.24, S.headR * 0.13, len * 0.7, 4, c);
      M.cyl(0, len * 0.85, 0, S.headR * 0.13, 0, len * 0.3, 4, o.tip === undefined ? c : o.tip);
      M.pop();
    }
  }

  function hairCap(M, S, c, o = {}) {
    const R = S.headR;
    M.bone(B.HEAD);
    M.sphere(0, S.head + R * (o.lift === undefined ? 0.1 : o.lift), -R * (o.back === undefined ? 0.06 : o.back), R * (o.w || 1.0), R * (o.h || 0.98), R * (o.d || 1.06), c, { lat: 6, lon: 10, half: true });
    if (o.nape !== false) M.box(0, S.head - R * 0.15, -R * 0.55, R * 1.6, R * (o.napeH || 0.8), R * 0.8, c, { tx: 1.05, bx: 0.8, bz: 0.7 });
  }

  function shade(c, k) {
    const ch = sh => Math.min(255, Math.round(((c >> sh) & 255) * k));
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  }
  function blend(a, b, t) {
    const ch = sh => Math.round(((a >> sh) & 255) * (1 - t) + ((b >> sh) & 255) * t);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  }

  function spike(M, x, y, z, dx, dy, dz, len, r, c, o = {}) {
    const l = Math.hypot(dx, dy, dz) || 1;
    dx /= l; dy /= l; dz /= l;
    M.at(x, y, z, 0, Math.atan2(dx, dz), 0);
    M.at(0, 0, 0, Math.acos(Math.max(-1, Math.min(1, dy))), 0, 0);
    M.cyl(0, len / 2, 0, r, o.tip || 0, len, o.seg || 5, c, o);
    M.pop(); M.pop();
  }

  function lock(M, x, y, z, dx, dy, dz, len, w, d, c) {
    const l = Math.hypot(dx, dy, dz) || 1;
    dx /= l; dy /= l; dz /= l;
    M.at(x - dx * len * 0.12, y - dy * len * 0.12, z - dz * len * 0.12, 0, Math.atan2(dx, dz), 0);
    M.at(0, 0, 0, Math.acos(Math.max(-1, Math.min(1, dy))), 0, 0);
    M.box(0, len / 2, 0, w, len, d, c, { tx: 0.08, tz: 0.14, noBottom: true });
    M.pop(); M.pop();
  }

  const TRACER_HAIR = [
    [0.1, 0.95, 0.55, 0.3, 0.9, 0.3, 0.55, 0.5, 0.3, 1],
    [-0.25, 1.0, 0.3, -0.2, 0.75, -0.45, 0.65, 0.55, 0.34, 0], [0.15, 1.05, 0.25, 0.25, 0.8, -0.45, 0.72, 0.55, 0.34, 1], [0.5, 0.9, 0.15, 0.65, 0.65, -0.35, 0.62, 0.5, 0.3, 0],
    [-0.55, 0.85, 0.1, -0.65, 0.6, -0.35, 0.55, 0.48, 0.3, 0], [0, 1.0, -0.2, 0.05, 0.6, -0.8, 0.72, 0.6, 0.34, 1], [0.45, 0.8, -0.4, 0.55, 0.4, -0.75, 0.62, 0.5, 0.3, 0],
    [-0.45, 0.8, -0.4, -0.5, 0.4, -0.78, 0.62, 0.5, 0.3, 0], [0, 0.6, -0.8, 0, 0.2, -0.98, 0.55, 0.55, 0.3, 0],
    [0.5, 0.7, 0.7, -0.15, -0.45, 0.88, 0.55, 0.42, 0.24, 0], [0.2, 0.8, 0.78, -0.35, -0.55, 0.76, 0.65, 0.44, 0.24, 1], [-0.1, 0.8, 0.78, -0.5, -0.6, 0.62, 0.7, 0.44, 0.24, 0],
    [-0.4, 0.72, 0.7, -0.55, -0.75, 0.37, 0.72, 0.4, 0.22, 1], [-0.68, 0.5, 0.55, -0.3, -0.93, 0.2, 0.7, 0.34, 0.2, 0],
    [0.9, 0.4, 0, 0.2, -0.5, -0.85, 0.55, 0.4, 0.2, 0], [-0.88, 0.35, 0.25, -0.1, -0.97, 0.2, 0.55, 0.3, 0.18, 0],
    [-0.85, 0.45, -0.3, -0.3, -0.85, -0.45, 0.5, 0.36, 0.2, 0], [0.85, 0.45, -0.3, 0.3, -0.85, -0.45, 0.5, 0.36, 0.2, 0],
    [0.35, -0.1, -0.88, 0.2, -0.75, -0.6, 0.42, 0.38, 0.2, 0], [-0.35, -0.1, -0.88, -0.2, -0.75, -0.6, 0.42, 0.38, 0.2, 0], [0, -0.2, -0.95, 0, -0.8, -0.55, 0.42, 0.4, 0.2, 0]
  ];

  function tracerHead(M, S, P, K = NOK) {
    const s = S.s, R = S.headR, H = S.head, z0 = 0.01 * s;
    const hair = col(P, 'hair', 0x3e2618), hi = shade(hair, 1.4), lens = col(P, 'lens', 0xff8f2a), frame = col(P, 'goggles', 0xd8601a), skin = col(P, 'skin', 0xf4cfb0);
    const cf = (fx, fy) => z0 + R * 0.97 * Math.sqrt(Math.max(0.05, 1 - (fx / 0.92) ** 2 - ((fy - 0.06) / 1.02) ** 2));
    const jf = (fx, fy) => z0 + R * 0.08 + R * 0.84 * Math.sqrt(Math.max(0.05, 1 - (fx / 0.7) ** 2 - ((fy + 0.36) / 0.68) ** 2));
    M.bone(B.HEAD);
    M.sphere(0, H + R * 0.06, z0, R * 0.92, R * 1.02, R * 0.97, skin, { lat: 8, lon: 10 });
    M.sphere(0, H - R * 0.36, z0 + R * 0.08, R * 0.7, R * 0.68, R * 0.84, skin, { lat: 6, lon: 10 });
    face(M, S, P, { noEyes: true, noNose: true, noMouth: true, eyeY: 0.14 });
    M.bone(B.HEAD);
    M.box(0, H - R * 0.22, cf(0, -0.22) + R * 0.05, R * 0.13, R * 0.2, R * 0.13, skin, { bx: 1.25 });
    const my = H - R * 0.47, lip = col(P, 'lip', 0xc8766a);
    M.box(0, my, jf(0, -0.47), R * 0.26, R * 0.06, R * 0.08, lip);
    for (const sd of [-1, 1]) M.box(sd * R * 0.15, my + R * 0.025, jf(sd * 0.15, -0.44), R * 0.08, R * 0.05, R * 0.08, lip, { rot: [0, 0, sd * 0.5] });
    M.sphere(0, H + R * 0.1, -R * 0.02, R * 1.04, R * 1.07, R * 1.1, hair, { lat: 8, lon: 12, half: true, rot: [-0.3, 0, 0] });
    if (!K.hide.has('locks')) for (const [x, y, z, dx, dy, dz, len, w, d, h] of TRACER_HAIR) lock(M, x * R, H + y * R, z0 + z * R, dx, dy, dz, len * R, w * R, d * R, h ? hi : hair);
    const A = 1.3, N = 12, vy = H + R * 0.1;
    const pt = a => [Math.sin(a) * R, Math.cos(a) * R * 1.12 + z0];
    for (let i = 0; i < N; i++) {
      const a0 = -A + 2 * A * i / N, a1 = -A + 2 * A * (i + 1) / N, k = (a0 + a1) / 2 / A;
      const p0 = pt(a0), p1 = pt(a1);
      const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), h = R * 0.34 * (1 - 0.5 * k * k);
      M.with((p0[0] + p1[0]) / 2, vy - R * 0.03 * k * k, (p0[1] + p1[1]) / 2, 0, Math.atan2(-(p1[1] - p0[1]), p1[0] - p0[0]), 0, () => {
        M.box(0, 0, 0, len * 1.06, h, R * 0.05, lens, { emit: 0.3 });
        M.box(0, h / 2, -R * 0.005, len * 1.06, R * 0.045, R * 0.066, frame);
        M.box(0, -h / 2, -R * 0.005, len * 1.06, R * 0.03, R * 0.06, frame);
      });
    }
    for (const sd of [-1, 1]) {
      const p = pt(sd * 0.34);
      M.with(p[0], H + R * 0.09, p[1], 0, sd * 0.34, 0, () => {
        M.box(0, 0, R * 0.03, R * 0.15, R * 0.16, R * 0.02, col(P, 'eyes', 0x5a2a10));
        M.box(-sd * R * 0.03, R * 0.04, R * 0.042, R * 0.045, R * 0.045, R * 0.01, 0xfff0d0, { emit: 0.6 });
      });
      const e = pt(sd * A);
      M.cyl(e[0] + sd * R * 0.02, H + R * 0.05, e[1] - R * 0.08, R * 0.17, R * 0.17, R * 0.16, 10, col(P, 'bracer', 0xf0f2f5), { rot: [0, 0, PI / 2] });
      M.cyl(e[0] + sd * R * 0.1, H + R * 0.05, e[1] - R * 0.08, R * 0.09, R * 0.09, R * 0.02, 10, lens, { rot: [0, 0, PI / 2], emit: 0.4 });
    }
  }

  const H = {};

  H.tracer = function (M, S, P, K = NOK) {
    const s = S.s;
    const jacket = col(P, 'jacket', 0x8c929c), jd = shade(jacket, 0.78), pants = col(P, 'pants', 0xf28a1c), panel = shade(pants, 0.8), band = blend(pants, 0xfff2a0, 0.42);
    const plate = col(P, 'harness', 0xeef1f4), accent = col(P, 'accent', 0xffb02e), glow = col(P, 'glow', 0x5ad2ff), white = col(P, 'bracer', 0xf0f2f5), grey = col(P, 'bracer2', 0x8a929e), belt = col(P, 'belt', 0x3a3e46);
    human(M, S, P, { tw: 0.3, td: 0.19, taper: 1.12, thighR: 0.078, shinR: 0.056, armR: 0.048, foreR: 0.044, hipW: 0.09, bellyW: 0.72, noHead: true, pal: { top: jacket, belly: pants, sleeve: jacket, fore: white, thigh: pants, shin: pants, hips: pants, boots: col(P, 'boots', 0xf2f4f6), shoulder: jacket } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.03 * s, 0, 0.35 * s, 0.4 * s, 0.24 * s, jacket, { tx: 1.12, bx: 0.88 });
    M.box(0, S.chest - 0.13 * s, 0.114 * s, 0.14 * s, 0.13 * s, 0.02 * s, pants);
    for (const sd of [-1, 1]) {
      M.box(sd * 0.125 * s, S.chest + 0.02 * s, 0.112 * s, 0.075 * s, 0.38 * s, 0.03 * s, jd, { tx: 1.1, bx: 0.9 });
      M.box(sd * 0.087 * s, S.chest + 0.02 * s, 0.129 * s, 0.012 * s, 0.34 * s, 0.01 * s, shade(jacket, 1.2));
      M.with(sd * (S.sw - 0.015 * s), S.sh + 0.02 * s, 0.01 * s, 0, 0, sd * -0.25, () => {
        M.box(0, 0, 0, 0.06 * s, 0.03 * s, 0.09 * s, accent, { emit: 0.25 });
        M.box(0, 0.016 * s, 0, 0.03 * s, 0.008 * s, 0.06 * s, 0x2a2e36);
      });
    }
    const pz = 0.13 * s, py = S.chest + 0.06 * s;
    M.box(0, py, pz, 0.19 * s, 0.21 * s, 0.05 * s, plate, { tx: 0.78, bx: 0.7 });
    M.box(0, py, pz - 0.005 * s, 0.22 * s, 0.1 * s, 0.045 * s, plate);
    for (const sd of [-1, 1]) M.box(sd * 0.105 * s, py, pz, 0.03 * s, 0.06 * s, 0.04 * s, grey);
    M.torus(0, py, pz + 0.028 * s, 0.07 * s, 0.017 * s, grey, { rot: [PI / 2, 0, 0], seg: 14, seg2: 4 });
    M.cyl(0, py, pz + 0.026 * s, 0.058 * s, 0.058 * s, 0.02 * s, 14, glow, { rot: [PI / 2, 0, 0], emit: 1 });
    M.cyl(0, py, pz + 0.038 * s, 0.026 * s, 0.026 * s, 0.01 * s, 10, 0xe8fbff, { rot: [PI / 2, 0, 0], emit: 1 });
    M.cyl(0, S.sh + 0.06 * s, 0, 0.07 * s, 0.063 * s, 0.09 * s, 12, col(P, 'collar', 0xe8ecf0));
    M.torus(0, S.sh + 0.03 * s, -0.005 * s, 0.092 * s, 0.024 * s, jacket, { seg: 14, seg2: 4 });
    M.torus(0, S.sh + 0.035 * s, -0.005 * s, 0.1 * s, 0.012 * s, jd, { seg: 14, seg2: 3 });
    M.bone(B.ROOT);
    M.box(0, S.hip + 0.08 * s, 0, 0.31 * s, 0.045 * s, 0.21 * s, belt);
    for (const sd of [-1, 1]) {
      M.with(sd * 0.12 * s, S.hip + 0.02 * s, 0.07 * s, 0, 0, sd * 0.15, () => {
        M.box(0, -0.04 * s, 0, 0.02 * s, 0.1 * s, 0.015 * s, belt);
        M.torus(0, -0.1 * s, 0, 0.018 * s, 0.006 * s, grey, { rot: [PI / 2, 0, 0], seg: 8, seg2: 3 });
      });
    }
    for (const side of [1, -1]) {
      const x = side * S.sw;
      M.bone(side > 0 ? B.LAL : B.LAR);
      M.cyl(x, S.hand + 0.12 * s, 0.005 * s, 0.062 * s, 0.078 * s, 0.2 * s, 10, white);
      M.sphere(x, S.elbow - 0.01 * s, 0, 0.08 * s, 0.07 * s, 0.08 * s, white, { lat: 4, lon: 8 });
      M.box(x + side * 0.07 * s, S.elbow - 0.03 * s, 0, 0.02 * s, 0.07 * s, 0.05 * s, accent, { emit: 0.25 });
      M.box(x, S.hand + 0.1 * s, 0.072 * s, 0.03 * s, 0.08 * s, 0.012 * s, accent, { emit: 0.25 });
      M.cyl(x, S.hand + 0.035 * s, 0.005 * s, 0.064 * s, 0.064 * s, 0.03 * s, 10, grey);
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * S.hw, S.hip - 0.17 * s, 0.072 * s, 0.045 * s, 0.26 * s, 0.02 * s, band, { rot: [0, 0, side * 0.35] });
      M.box(side * S.hw, S.knee + 0.05 * s, 0.066 * s, 0.09 * s, 0.08 * s, 0.025 * s, panel);
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.box(side * S.hw, S.knee - 0.1 * s, 0.055 * s, 0.085 * s, 0.2 * s, 0.03 * s, panel, { bx: 0.8 });
      M.box(side * S.hw, 0.012 * s, 0.045 * s, 0.125 * s, 0.024 * s, 0.28 * s, col(P, 'sole', 0xf28a1c));
      M.box(side * S.hw, 0.05 * s, -0.06 * s, 0.125 * s, 0.06 * s, 0.06 * s, grey);
      M.box(side * (S.hw + 0.062 * s), 0.03 * s, -0.02 * s, 0.006 * s, 0.018 * s, 0.1 * s, glow, { emit: 1 });
    }
    M.bone(B.ULL);
    M.box(S.hw + 0.066 * s, S.hip - S.th * 0.42, 0.012 * s, 0.014 * s, S.th * 0.7, 0.05 * s, col(P, 'stripe', 0xfafafa));
    tracerHead(M, S, P, K);
    const pistol = () => {
      M.box(0, -0.05 * s, -0.01 * s, 0.045 * s, 0.12 * s, 0.065 * s, col(P, 'gunDark', 0x4a5058), { rot: [0.2, 0, 0] });
      M.box(0, 0.035 * s, 0.07 * s, 0.07 * s, 0.085 * s, 0.26 * s, col(P, 'gun', 0xe6e8ec), { tz: 0.75, tx: 0.9 });
      M.box(0, -0.005 * s, 0.06 * s, 0.05 * s, 0.03 * s, 0.1 * s, col(P, 'gunDark', 0x4a5058));
      M.box(0, 0.082 * s, 0.05 * s, 0.035 * s, 0.018 * s, 0.17 * s, glow, { emit: 1 });
      for (const sd of [-1, 1]) M.box(sd * 0.037 * s, 0.035 * s, 0.07 * s, 0.006 * s, 0.03 * s, 0.14 * s, glow, { emit: 1 });
      M.cyl(0, 0.035 * s, 0.205 * s, 0.024 * s, 0.024 * s, 0.03 * s, 8, accent, { rot: [PI / 2, 0, 0], emit: 0.3 });
    };
    gunFrame(M, B.GUN, S, -1, pistol);
    gunFrame(M, B.OFF, S, 1, pistol);
  };

  H.soldier = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const jacket = col(P, 'jacket', 0x2c4c9c), chest = col(P, 'chest', 0xe8e8ec), trim = col(P, 'trim', 0xc02a2a), shirt = col(P, 'shirt', 0x1c1c22), pouch = col(P, 'pouch', 0x2a2622);
    human(M, S, P, { tw: 0.4, td: 0.24, taper: 1.12, armR: 0.064, foreR: 0.056, thighR: 0.09, shinR: 0.068, noHead: true, pal: { top: jacket, belly: shirt, sleeve: jacket, fore: K.hide.has('sleeves') ? col(P, 'skin', 0xd8a888) : jacket } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.02 * s, 0, 0.45 * s, 0.5 * s, 0.28 * s, jacket, { tx: 1.1, bx: 0.95 });
    for (const sd of [-1, 1]) {
      M.box(sd * 0.105 * s, S.chest + 0.02 * s, 0.138 * s, 0.16 * s, 0.42 * s, 0.02 * s, chest, { tx: 1.05 });
      M.box(sd * 0.03 * s, S.chest + 0.02 * s, 0.148 * s, 0.018 * s, 0.42 * s, 0.012 * s, trim);
      M.box(sd * 0.19 * s, S.chest + 0.02 * s, 0.14 * s, 0.018 * s, 0.4 * s, 0.012 * s, trim);
    }
    M.box(0, S.chest + 0.02 * s, 0.146 * s, 0.035 * s, 0.44 * s, 0.012 * s, shirt);
    M.box(0, S.sh + 0.04 * s, -0.02 * s, 0.3 * s, 0.11 * s, 0.27 * s, jacket, { tx: 1.1 });
    const dz = -0.146 * s, dy = S.chest + 0.06 * s, x7 = 0.05 * s, x6 = -0.05 * s, st = 0.024 * s;
    if (!K.hide.has('number')) {
      M.box(x7, dy + 0.06 * s, dz, 0.08 * s, st, 0.012 * s, chest);
      M.box(x7 - 0.012 * s, dy - 0.008 * s, dz, st, 0.135 * s, 0.012 * s, chest, { rot: [0, 0, 0.36] });
      M.box(x6 + 0.03 * s, dy - 0.005 * s, dz, st, 0.13 * s, 0.012 * s, chest);
      for (const vy of [0.056, -0.004, -0.062]) M.box(x6, dy + vy * s, dz, 0.07 * s, st, 0.012 * s, chest);
      M.box(x6 - 0.03 * s, dy - 0.034 * s, dz, st, 0.07 * s, 0.012 * s, chest);
    }
    M.bone(B.UAL);
    M.cyl(S.sw, S.sh - 0.12 * s, 0, 0.072 * s, 0.072 * s, 0.05 * s, 8, col(P, 'band', 0xe8c030));
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.LAL : B.LAR);
      M.box(side * S.sw, S.hand - 0.01 * s, 0.05 * s, 0.07 * s, 0.05 * s, 0.03 * s, col(P, 'knuckle', 0x2a2a2e));
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * (S.hw + 0.075 * s), S.hip - 0.17 * s, 0.02 * s, 0.06 * s, 0.14 * s, 0.13 * s, pouch);
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.box(side * S.hw, S.knee - 0.02 * s, 0.07 * s, 0.11 * s, 0.12 * s, 0.05 * s, pouch);
    }
    M.bone(B.ROOT);
    M.box(0, S.hip + 0.07 * s, 0, 0.38 * s, 0.065 * s, 0.26 * s, pouch);
    M.box(0.08 * s, S.hip + 0.07 * s, 0.13 * s, 0.07 * s, 0.07 * s, 0.03 * s, col(P, 'buckle', 0x8a8e96));
    const hair = col(P, 'hair', 0xe8e8e4), mask = col(P, 'mask', 0x2e3036);
    M.bone(B.HEAD);
    if (!K.hide.has('head')) {
      M.sphere(0, S.head, 0.01 * s, R * 0.92, R * 1.08, R * 0.98, mask, { lat: 8, lon: 10 });
      M.sphere(0, S.head + R * 0.42, -R * 0.12, R * 0.97, R * 0.62, R * 0.97, hair, { lat: 6, lon: 10, half: true });
      hairSpikes(M, S, hair, 9, { len: 0.5, seed: 76, back: 0.2 });
      M.box(0, S.head - R * 0.25, R * 0.45, R * 1.62, R * 1.05, R * 1.0, mask, { tx: 1.02, bx: 0.78, bz: 0.9 });
      M.box(0, S.head + R * 0.16, headFront(S, 0, 0.16) + R * 0.08, R * 1.84, R * 0.28, R * 0.2, col(P, 'visor', 0xff3a2a), { emit: 1 });
      M.box(0, S.head - R * 0.5, headFront(S, 0, -0.5) + R * 0.12, R * 0.62, R * 0.44, R * 0.3, col(P, 'maskM', 0x8a929c));
      for (const sd of [-1, 1]) M.cyl(sd * R * 0.42, S.head - R * 0.52, headFront(S, sd * 0.42, -0.52) + R * 0.08, R * 0.14, R * 0.14, R * 0.18, 7, col(P, 'maskM', 0x8a929c), { rot: [PI / 2, 0, 0] });
      M.box(0, S.head - R * 0.72, R * 0.2, R * 0.8, R * 0.3, R * 0.9, shirt);
    }
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, -0.06 * s, 0, 0.05 * s, 0.14 * s, 0.07 * s, col(P, 'gunDark', 0x22262c));
      M.box(0, 0.03 * s, 0.14 * s, 0.09 * s, 0.13 * s, 0.62 * s, col(P, 'gun', 0x3a4048));
      M.box(0, 0.03 * s, 0.5 * s, 0.05 * s, 0.05 * s, 0.14 * s, col(P, 'gunDark', 0x22262c));
      M.box(0, 0.11 * s, 0.1 * s, 0.05 * s, 0.05 * s, 0.24 * s, col(P, 'gunDark', 0x22262c));
      M.box(0.047 * s, 0.04 * s, 0.16 * s, 0.01, 0.045 * s, 0.4 * s, col(P, 'glow', 0x60c8ff), { emit: 1 });
      M.box(-0.047 * s, 0.04 * s, 0.16 * s, 0.01, 0.045 * s, 0.4 * s, col(P, 'glow', 0x60c8ff), { emit: 1 });
      M.box(0, -0.02 * s, -0.12 * s, 0.07 * s, 0.1 * s, 0.18 * s, col(P, 'gun', 0x3a4048));
      M.box(0, -0.06 * s, 0.26 * s, 0.06 * s, 0.1 * s, 0.14 * s, col(P, 'gunDark', 0x22262c));
    });
  };

  H.mccree = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const serape = col(P, 'serape', 0xb0321e), pat = col(P, 'serape2', 0xf09a30), metal = col(P, 'metal', 0xb8c0c8), chaps = col(P, 'chaps', 0x9a7a52), leather = col(P, 'vest', 0x6a4a30);
    human(M, S, P, { tw: 0.38, td: 0.23, noArm: 1, face: { mouthW: 0.3 }, pal: { top: col(P, 'shirt', 0xb8ae98), belly: leather, sleeve: col(P, 'shirt', 0xb8ae98), fore: col(P, 'shirt', 0xb8ae98) } });
    M.bone(B.UAL);
    M.sphere(S.sw * 1.02, S.sh - 0.01 * s, 0, 0.085 * s, 0.075 * s, 0.08 * s, col(P, 'shirt', 0xb8ae98), { lat: 4, lon: 7 });
    limb(M, B.UAL, [S.sw, S.sh, 0], [S.sw, S.elbow, 0], 0.06 * s, 0.055 * s, col(P, 'shirt', 0xb8ae98));
    M.bone(B.LAL);
    M.tube([[S.sw, S.elbow, 0], [S.sw, S.hand + 0.04 * s, 0]], 0.036 * s, metal, { seg: 6 });
    for (const dz of [-0.022, 0.022]) M.box(S.sw, (S.elbow + S.hand) / 2 + 0.02 * s, dz * s, 0.02 * s, S.fa * 0.8, 0.014 * s, col(P, 'metalDark', 0x6a7078));
    M.box(S.sw, S.elbow - 0.02 * s, 0, 0.07 * s, 0.05 * s, 0.07 * s, metal);
    M.box(S.sw, S.hand - 0.03 * s, 0.01 * s, 0.07 * s, 0.1 * s, 0.09 * s, metal, { bx: 0.8 });
    for (let i = 0; i < 3; i++) M.box(S.sw + (i - 1) * 0.022 * s, S.hand - 0.1 * s, 0.03 * s, 0.014 * s, 0.06 * s, 0.014 * s, metal);
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.02 * s, 0.01 * s, 0.39 * s, 0.4 * s, 0.25 * s, col(P, 'shirt', 0xb8ae98), { tx: 1.08 });
    M.box(0, S.chest - 0.02 * s, 0.13 * s, 0.26 * s, 0.26 * s, 0.02 * s, col(P, 'plate', 0x9aa0a4));
    if (!K.hide.has('serape')) {
      for (const sd of [-1, 1]) M.box(sd * 0.17 * s, S.sh - 0.01 * s, 0, 0.26 * s, 0.05 * s, 0.31 * s, serape, { rot: [0, 0, -sd * 0.42] });
      M.box(0, S.sh + 0.03 * s, -0.01 * s, 0.18 * s, 0.06 * s, 0.29 * s, serape);
      M.box(0, S.chest - 0.08 * s, -0.145 * s, 0.5 * s, 0.42 * s, 0.05 * s, serape, { tx: 1.05, bx: 0.8 });
      M.box(0, S.chest - 0.28 * s, -0.15 * s, 0.4 * s, 0.035 * s, 0.055 * s, pat);
      for (const dy of [0.06, -0.08]) M.box(0, S.chest + dy * s, -0.172 * s, 0.34 * s, 0.022 * s, 0.01 * s, pat);
      M.box(0.14 * s, S.chest + 0.04 * s, 0.135 * s, 0.14 * s, 0.24 * s, 0.04 * s, serape, { bx: 0.7 });
      M.box(-0.12 * s, S.chest - 0.06 * s, 0.14 * s, 0.2 * s, 0.4 * s, 0.045 * s, serape, { rot: [0, 0, 0.1], bx: 0.75 });
      M.box(-0.13 * s, S.chest - 0.25 * s, 0.165 * s, 0.15 * s, 0.03 * s, 0.05 * s, pat);
      M.box(-0.12 * s, S.chest - 0.02 * s, 0.165 * s, 0.14 * s, 0.02 * s, 0.01 * s, pat, { rot: [0, 0, 0.1] });
    }
    M.bone(B.ROOT);
    M.box(0, S.hip + 0.08 * s, 0, 0.38 * s, 0.07 * s, 0.26 * s, col(P, 'belt', 0x4a3020));
    M.box(0, S.hip + 0.08 * s, 0.135 * s, 0.13 * s, 0.09 * s, 0.02 * s, col(P, 'buckle', 0xe0b840), { emit: 0.25 });
    for (let i = 0; i < 6; i++) M.box(-0.17 * s + i * 0.03 * s, S.hip + 0.02 * s, 0.1 * s + Math.sin(i) * 0.01 * s, 0.018 * s, 0.05 * s, 0.018 * s, col(P, 'gold', 0xd0a040));
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * (S.hw + 0.035 * s), S.hip - 0.2 * s, 0.02 * s, 0.12 * s, 0.42 * s, 0.2 * s, chaps, { bx: 0.9 });
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.sphere(side * S.hw, S.knee, 0.05 * s, 0.07 * s, 0.07 * s, 0.05 * s, col(P, 'knee', 0x9aa2ac), { lat: 4, lon: 6 });
      M.box(side * S.hw, S.ankle + 0.1 * s, 0.01 * s, 0.13 * s, 0.2 * s, 0.14 * s, col(P, 'boots', 0x5a3a22), { tx: 1.1 });
      M.torus(side * S.hw, S.ankle * 0.7, -0.1 * s, 0.03 * s, 0.008 * s, col(P, 'gold', 0xd0a040), { rot: [0, 0, PI / 2], seg: 8, seg2: 3 });
    }
    M.bone(B.HEAD);
    const beard = col(P, 'beard', 0x3a2618);
    M.box(0, S.head - R * 0.58, R * 0.55, R * 1.35, R * 0.62, R * 0.62, beard, { bx: 0.75 });
    M.box(0, S.head - R * 0.28, headFront(S, 0, -0.28) + R * 0.02, R * 0.62, R * 0.12, R * 0.1, beard);
    M.box(0, S.head - R * 0.15, -R * 0.62, R * 1.7, R * 0.9, R * 0.7, col(P, 'hair', 0x3a2618), { bx: 0.85 });
    if (!K.hide.has('cigar')) {
      M.cyl(R * 0.2, S.head - R * 0.45, R * 1.08, 0.012 * s, 0.012 * s, 0.1 * s, 5, col(P, 'cigar', 0x6a4a2a), { rot: [PI / 2, 0.35, 0] });
      M.box(R * 0.36, S.head - R * 0.45, R * 1.52, 0.014 * s, 0.014 * s, 0.01 * s, 0xff6020, { emit: 1 });
    }
    const hat = col(P, 'hat', 0x7a5232);
    M.with(0, S.head + R * 0.62, -R * 0.05, 0.1, 0, 0, () => {
      M.cyl(0, 0, 0, R * 2.3, R * 2.3, 0.025 * s, 14, hat);
      for (const sd of [-1, 1]) M.box(sd * R * 2.05, R * 0.14, 0, R * 0.5, 0.02 * s, R * 2.6, hat, { rot: [0, 0, sd * 0.5] });
      M.cyl(0, R * 0.42, 0, R * 1.02, R * 0.9, R * 0.85, 10, hat);
      M.box(0, R * 0.86, 0, R * 0.3, R * 0.06, R * 1.4, col(P, 'band', 0x3a2416));
      M.cyl(0, R * 0.13, 0, R * 1.05, R * 1.04, R * 0.18, 10, col(P, 'band', 0x3a2416));
    });
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, -0.06 * s, -0.02 * s, 0.045 * s, 0.13 * s, 0.07 * s, col(P, 'grip', 0x8a5a32), { rot: [0.25, 0, 0] });
      M.cyl(0, 0.03 * s, 0.04 * s, 0.048 * s, 0.048 * s, 0.075 * s, 8, col(P, 'gunDark', 0x3a3a40), { rot: [PI / 2, 0, 0] });
      M.box(0, 0.035 * s, 0.18 * s, 0.032 * s, 0.038 * s, 0.24 * s, col(P, 'gunDark', 0x3a3a40));
      M.box(0, 0.06 * s, 0.1 * s, 0.02 * s, 0.02 * s, 0.12 * s, col(P, 'gold', 0xd0a040));
      M.box(0, 0.005 * s, 0.13 * s, 0.022 * s, 0.02 * s, 0.14 * s, col(P, 'gold', 0xd0a040));
    });
  };

  H.junkrat = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const skin = col(P, 'skin', 0xd49a6a), shorts = col(P, 'shorts', 0x6e6a3a), camo = col(P, 'camo', 0x4a4826), arm = col(P, 'arm', 0xa8602a), grenade = col(P, 'grenade', 0xe08a20);
    human(M, S, P, { tw: 0.3, td: 0.18, taper: 1.08, noLeg: -1, noArm: -1, thighR: 0.072, shinR: 0.048, armR: 0.044, foreR: 0.038, face: K.hide.has('face') ? { noEyes: true, noNose: true, noMouth: true, noBrows: true, noEars: true } : { mouthW: 0.66, mouthH: 0.16, eyeY: 0.12 }, pal: { top: skin, belly: skin, sleeve: skin, thigh: shorts, lip: col(P, 'teeth', 0xf0e080), shin: skin } });
    M.bone(B.ROOT);
    M.box(0, S.hip - 0.08 * s, 0, 0.34 * s, 0.26 * s, 0.22 * s, shorts, { bx: 1.1 });
    for (const [x, y, z] of [[0.1, -0.02, 0.112], [-0.08, -0.12, 0.112], [0.05, -0.16, -0.112]]) M.box(x * s, S.hip + y * s, z * s, 0.08 * s, 0.07 * s, 0.01 * s, camo);
    M.box(0.06 * s, S.hip - 0.2 * s, 0.112 * s, 0.07 * s, 0.06 * s, 0.01 * s, col(P, 'patch', 0xa05a2a));
    M.box(0, S.hip + 0.06 * s, 0, 0.33 * s, 0.05 * s, 0.21 * s, col(P, 'belt', 0x5a3a20));
    M.bone(B.ULL);
    M.box(S.hw, S.hip - 0.2 * s, 0.01 * s, 0.17 * s, 0.34 * s, 0.17 * s, shorts, { bx: 1.15, bz: 1.1 });
    M.box(S.hw + 0.05 * s, S.hip - 0.24 * s, 0.07 * s, 0.07 * s, 0.1 * s, 0.05 * s, camo);
    M.bone(B.LLL);
    M.cyl(S.hw, S.ankle + 0.1 * s, 0, 0.056 * s, 0.056 * s, 0.14 * s, 7, col(P, 'sock', 0xb8b0a0));
    M.box(S.hw, S.ankle * 0.8, 0.04 * s, 0.13 * s, S.ankle * 1.7, 0.27 * s, col(P, 'boots', 0x4a3424), { tz: 0.85 });
    M.bone(B.ULR);
    M.box(-S.hw, S.hip - 0.2 * s, 0.01 * s, 0.17 * s, 0.34 * s, 0.17 * s, shorts, { bx: 1.15, bz: 1.1 });
    M.box(-S.hw, S.knee + 0.03 * s, 0, 0.11 * s, 0.09 * s, 0.11 * s, col(P, 'armDark', 0x4a3a30));
    M.bone(B.LLR);
    M.box(-S.hw, S.knee - 0.02 * s, 0, 0.09 * s, 0.08 * s, 0.09 * s, col(P, 'peg', 0x6a6e76));
    M.tube([[-S.hw, S.knee - 0.04 * s, 0], [-S.hw, S.ankle, 0.02 * s]], 0.022 * s, col(P, 'peg', 0x6a6e76), { seg: 6 });
    for (let i = 0; i < 4; i++) M.cyl(-S.hw, S.knee - 0.12 * s - i * 0.08 * s, 0.005 * s + i * 0.004 * s, 0.028 * s, 0.028 * s, 0.035 * s, 6, col(P, 'pegStripe', 0xf0c030));
    M.cyl(-S.hw, S.ankle * 0.5, 0.02 * s, 0.04 * s, 0.05 * s, S.ankle, 7, col(P, 'rubber', 0x2a2a2a));
    limb(M, B.UAR, [-S.sw, S.sh, 0], [-S.sw, S.elbow, 0], 0.046 * s, 0.042 * s, skin);
    M.bone(B.UAR);
    M.sphere(-S.sw * 1.02, S.sh - 0.01 * s, 0, 0.062 * s, 0.056 * s, 0.06 * s, skin, { lat: 4, lon: 7 });
    M.bone(B.LAR);
    M.box(-S.sw, S.elbow - 0.01 * s, 0, 0.08 * s, 0.06 * s, 0.08 * s, col(P, 'armDark', 0x4a3a30));
    M.tube([[-S.sw, S.elbow, 0], [-S.sw, S.hand + 0.04 * s, 0]], 0.042 * s, arm, { seg: 6 });
    for (const dz of [-0.03, 0.03]) M.box(-S.sw, (S.elbow + S.hand) / 2, dz * s, 0.03 * s, S.fa * 0.7, 0.012 * s, col(P, 'armDark', 0x4a3a30));
    M.box(-S.sw, S.hand - 0.02 * s, 0.01 * s, 0.1 * s, 0.1 * s, 0.1 * s, arm);
    for (const dx of [-0.03, 0, 0.03]) M.box(-S.sw + dx * s, S.hand - 0.09 * s, 0.03 * s, 0.018 * s, 0.07 * s, 0.022 * s, col(P, 'armDark', 0x4a3a30));
    M.bone(B.LAL);
    M.cyl(S.sw, S.hand + 0.05 * s, 0, 0.046 * s, 0.046 * s, 0.04 * s, 7, col(P, 'wrist', 0x2a2a2e));
    M.bone(B.SPINE);
    for (let i = 0; i < 6; i++) {
      const f = i / 5;
      const x = -0.15 * s + f * 0.3 * s, y = S.sh - 0.04 * s - f * (S.sh - S.waist - 0.02 * s);
      M.cyl(x, y, 0.105 * s, 0.035 * s, 0.035 * s, 0.075 * s, 7, grenade, { rot: [0, 0, -0.93] });
      M.torus(x, y, 0.105 * s, 0.037 * s, 0.008 * s, col(P, 'band', 0x4a3a2a), { rot: [0, 0, -0.93], seg: 7, seg2: 3 });
    }
    M.box(0, S.chest - 0.02 * s, 0.098 * s, 0.05 * s, 0.5 * s, 0.015 * s, col(P, 'band', 0x4a3a2a), { rot: [0, 0, 0.64] });
    M.box(0, S.chest + 0.06 * s, -0.1 * s, 0.05 * s, 0.46 * s, 0.015 * s, col(P, 'band', 0x4a3a2a), { rot: [0, 0, -0.64] });
    M.bone(B.BACK);
    M.sphere(0.02 * s, S.chest + 0.08 * s, -0.24 * s, 0.13 * s, 0.13 * s, 0.1 * s, col(P, 'bomb', 0x2a2a30), { lat: 5, lon: 8 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; M.with(0.02 * s + Math.cos(a) * 0.12 * s, S.chest + 0.08 * s + Math.sin(a) * 0.12 * s, -0.24 * s, 0, 0, a - PI / 2, () => M.cyl(0, 0.04 * s, 0, 0.022 * s, 0, 0.08 * s, 4, col(P, 'spike', 0x9aa0a8))); }
    M.bone(B.HEAD);
    const hair = col(P, 'hair', 0xf0d060);
    if (!K.hide.has('hair')) M.sphere(0, S.head + R * 0.42, -R * 0.02, R * 0.95, R * 0.55, R * 0.95, hair, { lat: 4, lon: 8, half: true });
    if (!K.hide.has('hair') && !K.hide.has('spikes')) hairSpikes(M, S, hair, 14, { len: 1.35, seed: 9, back: 0.05, tip: col(P, 'hairTip', 0x2a2218) });
    if (!K.hide.has('face')) M.box(0, S.head - R * 0.6, R * 0.7, R * 0.5, R * 0.06, R * 0.1, col(P, 'soot', 0x7a5040));
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, -0.06 * s, -0.04 * s, 0.05 * s, 0.13 * s, 0.07 * s, col(P, 'grip', 0x7a4a2a));
      M.box(0, 0.02 * s, -0.12 * s, 0.06 * s, 0.1 * s, 0.2 * s, col(P, 'grip', 0x7a4a2a));
      M.cyl(0, 0.05 * s, 0.12 * s, 0.13 * s, 0.13 * s, 0.14 * s, 10, col(P, 'drum', 0x5a7a3a), { rot: [0, 0, PI / 2] });
      M.cyl(0.075 * s, 0.05 * s, 0.12 * s, 0.05 * s, 0.05 * s, 0.02 * s, 8, col(P, 'accent', 0xe0b030), { rot: [0, 0, PI / 2] });
      M.cyl(0, 0.05 * s, 0.34 * s, 0.07 * s, 0.08 * s, 0.4 * s, 8, col(P, 'barrel', 0x6a6a6a), { rot: [PI / 2, 0, 0] });
      M.box(0, 0.15 * s, 0.2 * s, 0.05 * s, 0.05 * s, 0.3 * s, col(P, 'accent', 0xe0b030));
    });
  };

  H.torbjorn = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const armor = col(P, 'armor', 0xb82a22), metal = col(P, 'metal', 0x6a6e76), metal2 = col(P, 'metal2', 0xa8aeb8), beard = col(P, 'beard', 0xf0e0a8);
    human(M, S, P, { tw: 0.5, td: 0.34, taper: 1.05, deep: 1.1, armR: 0.078, foreR: 0.074, thighR: 0.1, shinR: 0.088, noArm: 1, face: { noEyes: true, noMouth: true, noNose: true, noBrows: true }, pal: { top: armor, belly: metal, sleeve: col(P, 'skin', 0xf0b898), boots: col(P, 'boots', 0xa82a22), thigh: col(P, 'pants', 0x4a4e56), shin: armor, hips: col(P, 'pants', 0x4a4e56) } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.01 * s, 0.03 * s, 0.56 * s, 0.46 * s, 0.4 * s, armor, { tx: 1.05, bx: 0.95 });
    M.box(0, S.waist + 0.02 * s, 0.05 * s, 0.4 * s, 0.24 * s, 0.36 * s, metal, { bx: 0.9 });
    M.box(0.06 * s, S.waist + 0.02 * s, 0.232 * s, 0.14 * s, 0.1 * s, 0.01 * s, 0xf0f0f0);
    for (let i = 0; i < 3; i++) M.box(0, S.chest - 0.08 * s + i * 0.08 * s, 0.235 * s, 0.4 * s, 0.018 * s, 0.01 * s, col(P, 'armorDark', 0x7a1a16));
    M.sphere(-S.sw - 0.02 * s, S.sh + 0.02 * s, 0, 0.12 * s, 0.1 * s, 0.13 * s, armor, { lat: 4, lon: 8, half: true });
    M.sphere(S.sw + 0.03 * s, S.sh + 0.02 * s, 0, 0.16 * s, 0.13 * s, 0.16 * s, metal, { lat: 4, lon: 8, half: true });
    M.bone(B.BACK);
    for (const sd of [-1, 1]) {
      M.with(sd * 0.15 * s, S.sh + 0.08 * s, -0.24 * s, -0.12, 0, -sd * 0.12, () => {
        M.cyl(0, 0, 0, 0.08 * s, 0.085 * s, 0.5 * s, 8, col(P, 'stack', 0x8a8e96));
        M.cyl(0, 0.26 * s, 0, 0.095 * s, 0.09 * s, 0.05 * s, 8, metal);
        for (let i = 0; i < 3; i++) M.torus(0, -0.12 * s + i * 0.09 * s, 0, 0.086 * s, 0.01 * s, metal, { seg: 8, seg2: 3 });
        M.cyl(0, 0.29 * s, 0, 0.06 * s, 0.06 * s, 0.012 * s, 8, col(P, 'glow', 0xff8a20), { emit: 1 });
      });
    }
    M.bone(B.UAR);
    M.box(-S.sw - 0.06 * s, S.sh - 0.1 * s, 0.02 * s, 0.01 * s, 0.08 * s, 0.08 * s, col(P, 'tattoo', 0x3a4a6a));
    M.bone(B.LAR);
    M.cyl(-S.sw, S.hand + 0.1 * s, 0, 0.082 * s, 0.084 * s, 0.1 * s, 8, metal);
    limb(M, B.UAL, [S.sw, S.sh, 0], [S.sw, S.elbow, 0], 0.085 * s, 0.08 * s, metal);
    M.bone(B.LAL);
    M.tube([[S.sw, S.elbow, 0], [S.sw, S.hand + 0.06 * s, 0]], 0.1 * s, col(P, 'claw', 0xb82a22), { seg: 8 });
    M.cyl(S.sw, S.hand + 0.07 * s, 0, 0.11 * s, 0.1 * s, 0.05 * s, 8, metal);
    for (const sd of [-1, 1]) {
      M.with(S.sw + sd * 0.07 * s, S.hand - 0.02 * s, 0.02 * s, 0, 0, sd * 0.25, () => {
        M.box(0, -0.06 * s, 0, 0.05 * s, 0.14 * s, 0.07 * s, col(P, 'claw', 0xb82a22));
        M.box(-sd * 0.03 * s, -0.15 * s, 0, 0.08 * s, 0.05 * s, 0.07 * s, col(P, 'claw', 0xb82a22), { rot: [0, 0, sd * 0.6] });
        M.box(-sd * 0.07 * s, -0.17 * s, 0, 0.04 * s, 0.03 * s, 0.05 * s, metal);
      });
    }
    M.bone(B.HEAD);
    if (!K.hide.has('helmet')) {
      M.torus(0, S.head + R * 0.3, 0, R * 0.95, R * 0.14, col(P, 'helmet', 0x4a4e56), { seg: 12, seg2: 4 });
      M.box(0, S.head + R * 0.62, -R * 0.1, R * 0.4, R * 0.3, R * 1.6, col(P, 'helmet', 0x4a4e56));
    }
    if (!K.hide.has('goggles')) for (const sd of [-1, 1]) {
      M.cyl(sd * R * 0.38, S.head + R * 0.12, headFront(S, sd * 0.38, 0.12) + R * 0.08, R * 0.26, R * 0.26, R * 0.22, 8, metal, { rot: [PI / 2, 0, 0] });
      M.cyl(sd * R * 0.38, S.head + R * 0.12, headFront(S, sd * 0.38, 0.12) + R * 0.2, R * 0.19, R * 0.19, R * 0.03, 8, col(P, 'goggle', 0xff8a20), { rot: [PI / 2, 0, 0], emit: 1 });
    }
    M.box(0, S.head + R * 0.42, headFront(S, 0, 0.42), R * 1.2, R * 0.16, R * 0.16, beard);
    M.sphere(0, S.head - R * 0.62, R * 0.62, R * 1.2, R * 1.05, R * 0.72, beard, { lat: 5, lon: 9 });
    M.box(0, S.head - R * 1.6, R * 0.8, R * 1.5, R * 1.6, R * 0.62, beard, { bx: 0.55, tx: 1.05 });
    for (const sd of [-1, 1]) {
      M.tube([[sd * R * 0.5, S.head - R * 0.25, headFront(S, sd * 0.5, -0.25) + R * 0.1], [sd * R * 0.95, S.head - R * 0.9, R * 1.0], [sd * R * 0.9, S.head - R * 2.1, R * 0.95]], R * 0.16, beard, { seg: 5, r0: R * 0.2, r1: R * 0.1 });
      M.cyl(sd * R * 0.9, S.head - R * 2.2, R * 0.95, R * 0.1, R * 0.1, R * 0.12, 6, col(P, 'band', 0x8a6a3a));
    }
    M.sphere(0, S.head - R * 0.14, headFront(S, 0, -0.14) + R * 0.08, R * 0.2, R * 0.2, R * 0.18, col(P, 'skin', 0xf0b898), { lat: 4, lon: 6 });
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, -0.06 * s, 0, 0.06 * s, 0.14 * s, 0.08 * s, col(P, 'grip', 0x5a3a20));
      M.box(0, 0.05 * s, 0.14 * s, 0.13 * s, 0.15 * s, 0.4 * s, col(P, 'gun', 0xb82a22));
      M.cyl(0, 0.05 * s, 0.4 * s, 0.05 * s, 0.055 * s, 0.14 * s, 8, col(P, 'gunDark', 0x3a3a40), { rot: [PI / 2, 0, 0] });
      M.cyl(0, 0.13 * s, 0.08 * s, 0.05 * s, 0.05 * s, 0.12 * s, 8, metal2);
      M.box(0, 0.13 * s, 0.22 * s, 0.05 * s, 0.05 * s, 0.14 * s, col(P, 'glow', 0xff8a20), { emit: 1 });
    });
    gunFrame(M, B.ALT, S, -1, () => {
      M.box(0, 0.1 * s, 0, 0.04 * s, 0.42 * s, 0.04 * s, col(P, 'grip', 0x5a3a20));
      M.box(0, 0.32 * s, 0.05 * s, 0.16 * s, 0.14 * s, 0.28 * s, metal);
      M.box(0, 0.32 * s, 0.05 * s, 0.17 * s, 0.05 * s, 0.29 * s, col(P, 'armor', 0xb82a22));
    });
  };

  H.widowmaker = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const suit = col(P, 'suit', 0x5a2e8a), light = col(P, 'suitLight', 0xa878d8), dark = col(P, 'suitDark', 0x2a1a44), skin = col(P, 'skin', 0x9a96e0), hair = col(P, 'hair', 0x2a1838);
    human(M, S, P, { tw: 0.3, td: 0.18, taper: 1.22, thighR: 0.076, shinR: 0.054, armR: 0.044, foreR: 0.04, face: { noEyes: true }, pal: { top: suit, belly: suit, hips: suit, sleeve: skin, fore: col(P, 'gloves', 0x3a1e52), thigh: suit, shin: dark, boots: col(P, 'boots', 0x2a1a36) } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.04 * s, 0.01 * s, 0.33 * s, 0.3 * s, 0.22 * s, suit, { tx: 1.12, bx: 0.9 });
    M.box(0, S.chest + 0.1 * s, 0.112 * s, 0.1 * s, 0.2 * s, 0.01 * s, skin, { tx: 1.4, bx: 0.2 });
    for (const sd of [-1, 1]) M.box(sd * 0.15 * s, S.chest - 0.02 * s, 0.02 * s, 0.03 * s, 0.34 * s, 0.2 * s, light);
    M.box(0, S.waist + 0.02 * s, 0.1 * s, 0.2 * s, 0.05 * s, 0.01 * s, light);
    M.box(0, S.chest + 0.02 * s, -0.112 * s, 0.14 * s, 0.14 * s, 0.01 * s, dark);
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * (S.hw + 0.06 * s), (S.hip + S.knee) / 2, 0.01 * s, 0.03 * s, S.th * 0.8, 0.1 * s, light);
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.box(side * S.hw, S.ankle * 0.4, -0.08 * s, 0.03 * s, S.ankle * 0.9, 0.03 * s, dark);
      M.box(side * S.hw, S.knee - 0.02 * s, 0.06 * s, 0.09 * s, 0.1 * s, 0.05 * s, light);
    }
    M.bone(B.LAL);
    M.box(S.sw, S.hand + 0.1 * s, 0.03 * s, 0.07 * s, 0.1 * s, 0.08 * s, col(P, 'gunDark', 0x2a1a30));
    M.box(S.sw, S.hand + 0.1 * s, 0.075 * s, 0.03 * s, 0.03 * s, 0.02 * s, col(P, 'glow', 0xff60e0), { emit: 1 });
    M.bone(B.HEAD);
    M.sphere(0, S.head + R * 0.22, -R * 0.08, R * 1.0, R * 0.92, R * 1.04, hair, { lat: 6, lon: 10, half: true });
    M.box(0, S.head - R * 0.1, -R * 0.55, R * 1.6, R * 0.9, R * 0.8, hair, { bx: 0.8 });
    M.sphere(0, S.head + R * 0.7, -R * 0.75, R * 0.34, R * 0.34, R * 0.34, hair, { lat: 4, lon: 6 });
    M.tube([[0, S.head + R * 0.7, -R * 0.9], [0, S.head - R * 0.4, -R * 1.5], [0, S.sh - 0.1 * s, -0.16 * s], [0, S.chest - 0.12 * s, -0.17 * s], [0, S.waist - 0.02 * s, -0.14 * s]], R * 0.28, hair, { seg: 6, r0: R * 0.34, r1: R * 0.1 });
    const vy = S.head + R * 0.12, vz = headFront(S, 0, 0.12);
    if (!K.hide.has('visor')) {
      M.torus(0, vy + R * 0.02, 0.01 * s, R * 0.98, R * 0.07, col(P, 'visor', 0x5a3a8a), { seg: 12, seg2: 3 });
      M.box(0, vy, vz + R * 0.02, R * 1.6, R * 0.34, R * 0.16, col(P, 'visor', 0x5a3a8a));
      for (const sd of [-1, 1]) M.box(sd * R * 0.36, vy, vz + R * 0.11, R * 0.56, R * 0.22, R * 0.04, col(P, 'lens', 0xff50d0), { emit: 0.8 });
    }
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, -0.06 * s, 0, 0.04 * s, 0.12 * s, 0.06 * s, col(P, 'gunDark', 0x2a1a30));
      M.box(0, 0.02 * s, 0.08 * s, 0.07 * s, 0.11 * s, 0.5 * s, col(P, 'gun', 0x5a3a8a), { tz: 0.8 });
      M.cyl(0, 0.03 * s, 0.6 * s, 0.022 * s, 0.022 * s, 0.6 * s, 6, col(P, 'gunDark', 0x2a1a30), { rot: [PI / 2, 0, 0] });
      M.cyl(0, 0.12 * s, 0.12 * s, 0.032 * s, 0.032 * s, 0.26 * s, 7, col(P, 'gunDark', 0x2a1a30), { rot: [PI / 2, 0, 0] });
      M.box(0, 0.03 * s, -0.13 * s, 0.05 * s, 0.1 * s, 0.22 * s, col(P, 'gun', 0x5a3a8a));
      M.box(0.036 * s, 0.03 * s, 0.1 * s, 0.01, 0.03 * s, 0.3 * s, col(P, 'glow', 0xff60e0), { emit: 1 });
      M.box(-0.036 * s, 0.03 * s, 0.1 * s, 0.01, 0.03 * s, 0.3 * s, col(P, 'glow', 0xff60e0), { emit: 1 });
    });
  };

  H.reinhardt = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const ar = col(P, 'armor', 0xb4bac4), ar2 = col(P, 'armor2', 0x8a909a), dk = col(P, 'dark', 0x3a3e46), gold = col(P, 'gold', 0xd4a040), red = col(P, 'red', 0xc02a2a);
    human(M, S, P, { tw: 0.56, td: 0.36, taper: 1.2, armR: 0.1, foreR: 0.09, thighR: 0.12, shinR: 0.1, noHead: true, noNeck: true, pal: { top: ar, belly: ar2, sleeve: ar2, fore: ar, pants: dk, thigh: ar2, shin: ar, boots: ar, gloves: ar, shoulder: ar } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.05 * s, 0.02 * s, 0.62 * s, 0.55 * s, 0.42 * s, ar, { tx: 1.15, bx: 0.85 });
    M.box(0, S.chest + 0.12 * s, 0.225 * s, 0.34 * s, 0.24 * s, 0.03 * s, ar2, { bx: 0.6 });
    M.box(0, S.chest + 0.12 * s, 0.24 * s, 0.1 * s, 0.1 * s, 0.02 * s, gold, { emit: 0.15 });
    for (let i = 0; i < 3; i++) M.box(0, S.waist + 0.02 * s + i * 0.06 * s, 0.17 * s, 0.4 * s - i * 0.02 * s, 0.05 * s, 0.05 * s, i % 2 ? dk : ar2);
    for (const sd of [-1, 1]) {
      M.with(sd * (S.sw + 0.07 * s), S.sh + 0.05 * s, 0, 0, 0, sd * 0.25, () => {
        M.sphere(0, 0, 0, 0.22 * s, 0.15 * s, 0.22 * s, ar, { lat: 4, lon: 10, half: true });
        M.box(0, -0.02 * s, 0, 0.44 * s, 0.06 * s, 0.4 * s, ar2, { tx: 0.95 });
        M.box(sd * 0.1 * s, 0.1 * s, 0.1 * s, 0.14 * s, 0.03 * s, 0.1 * s, red);
        M.box(0, 0.14 * s, 0, 0.3 * s, 0.03 * s, 0.03 * s, gold);
      });
    }
    M.box(0, S.chest + 0.02 * s, -0.3 * s, 0.46 * s, 0.52 * s, 0.24 * s, dk, { tx: 0.9 });
    M.box(0, S.chest + 0.02 * s, -0.42 * s, 0.34 * s, 0.34 * s, 0.03 * s, ar2);
    for (const x of [-0.14, 0.14]) M.cyl(x * s, S.chest + 0.36 * s, -0.33 * s, 0.07 * s, 0.08 * s, 0.24 * s, 8, dk);
    M.cyl(0.2 * s, S.chest + 0.4 * s, -0.36 * s, 0.01 * s, 0.01 * s, 0.36 * s, 4, dk);
    M.bone(B.ROOT);
    M.box(0, S.hip - 0.05 * s, 0.02 * s, 0.48 * s, 0.3 * s, 0.4 * s, dk);
    M.box(0, S.hip - 0.2 * s, 0.19 * s, 0.26 * s, 0.26 * s, 0.05 * s, ar, { bx: 0.7 });
    M.box(0, S.hip - 0.1 * s, 0.215 * s, 0.26 * s, 0.03 * s, 0.01 * s, red);
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * (S.hw + 0.06 * s), S.hip - 0.12 * s, 0.02 * s, 0.14 * s, 0.26 * s, 0.26 * s, ar, { rot: [0, 0, side * 0.12] });
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.sphere(side * S.hw, S.knee, 0.08 * s, 0.1 * s, 0.1 * s, 0.08 * s, ar2, { lat: 4, lon: 7 });
      M.box(side * S.hw, S.ankle + 0.12 * s, 0.02 * s, 0.2 * s, 0.26 * s, 0.22 * s, ar, { tx: 1.1 });
      M.box(side * S.hw, S.ankle + 0.02 * s, 0.1 * s, 0.18 * s, 0.03 * s, 0.14 * s, red);
      M.bone(side > 0 ? B.LAL : B.LAR);
      M.box(side * S.sw, S.hand + 0.12 * s, 0.01 * s, 0.2 * s, 0.24 * s, 0.2 * s, ar2, { bx: 1.1 });
      M.box(side * S.sw, S.hand - 0.04 * s, 0.02 * s, 0.16 * s, 0.16 * s, 0.16 * s, ar);
    }
    M.bone(B.LAL);
    M.with(S.sw + 0.11 * s, S.hand + 0.13 * s, 0.02 * s, 0, 0, 0, () => {
      M.box(0, 0, 0, 0.05 * s, 0.26 * s, 0.22 * s, col(P, 'lion', 0xc8ccd4), { tz: 0.8 });
      M.box(0.03 * s, 0.02 * s, 0, 0.03 * s, 0.14 * s, 0.14 * s, ar2);
      for (const dz of [-0.04, 0.04]) M.box(0.05 * s, 0.05 * s, dz * s, 0.01 * s, 0.025 * s, 0.03 * s, red, { emit: 0.6 });
      M.box(0.05 * s, -0.06 * s, 0, 0.01 * s, 0.03 * s, 0.1 * s, gold);
    });
    M.bone(B.HEAD);
    M.cyl(0, S.neck + 0.05 * s, 0.01 * s, 0.13 * s, 0.11 * s, 0.14 * s, 8, dk);
    M.sphere(0, S.head + R * 0.1, -R * 0.02, R * 1.05, R * 1.12, R * 1.05, ar, { lat: 7, lon: 10 });
    M.box(0, S.head - R * 0.28, R * 0.55, R * 1.55, R * 1.05, R * 0.95, ar, { tx: 0.9, bx: 0.8, bz: 0.7 });
    M.box(0, S.head + R * 0.12, R * 1.02, R * 1.3, R * 0.14, R * 0.08, col(P, 'visor', 0x1e2228));
    M.box(0, S.head - R * 0.35, R * 1.0, R * 0.08, R * 0.6, R * 0.08, col(P, 'visor', 0x1e2228));
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) M.box(sd * R * (0.3 + i * 0.18), S.head - R * 0.45, R * (0.96 - i * 0.08), R * 0.06, R * 0.36, R * 0.06, col(P, 'visor', 0x1e2228));
    if (!K.hide.has('crest')) {
      M.box(0, S.head + R * 0.95, -R * 0.15, R * 0.18, R * 0.8, R * 2.2, col(P, 'crest', ar2), { tz: 0.6 });
      M.box(0, S.head + R * 1.3, R * 0.3, R * 0.14, R * 0.36, R * 0.9, col(P, 'crest', ar2), { tz: 0.3 });
    }
    M.box(0, S.head + R * 0.35, R * 1.0, R * 0.8, R * 0.08, R * 0.06, gold);
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, 0.15 * s, 0, 0.05 * s, 1.15 * s, 0.05 * s, dk);
      M.box(0, -0.4 * s, 0, 0.07 * s, 0.08 * s, 0.07 * s, gold);
      M.box(0, 0.76 * s, 0.02 * s, 0.34 * s, 0.34 * s, 0.56 * s, col(P, 'hammer', 0x9aa2ac));
      M.box(0, 0.76 * s, 0.02 * s, 0.36 * s, 0.1 * s, 0.58 * s, gold);
      for (const dz of [-0.2, 0.24]) M.box(0, 0.76 * s, dz * s, 0.36 * s, 0.36 * s, 0.04 * s, dk);
      M.cyl(0, 0.76 * s, -0.33 * s, 0.1 * s, 0.14 * s, 0.14 * s, 8, dk, { rot: [PI / 2, 0, 0] });
      M.cyl(0, 0.76 * s, -0.4 * s, 0.07 * s, 0.07 * s, 0.02 * s, 8, 0xff8a30, { rot: [PI / 2, 0, 0], emit: 1 });
      M.cyl(0, 0.76 * s, 0.33 * s, 0.15 * s, 0.15 * s, 0.1 * s, 8, dk, { rot: [PI / 2, 0, 0] });
      M.box(0.18 * s, 0.76 * s, 0.02 * s, 0.01 * s, 0.12 * s, 0.2 * s, red);
    });
  };

  H.roadhog = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const skin = col(P, 'skin', 0xc88c68), pants = col(P, 'pants', 0x4a5a70), camo = col(P, 'camo', 0x2e3a4c), camo2 = col(P, 'camo2', 0x7a8aa0), strap = col(P, 'strap', 0x2a2420), spike = col(P, 'spike', 0xa8acb4);
    human(M, S, P, { tw: 0.56, td: 0.4, taper: 1.05, deep: 1.2, armR: 0.1, foreR: 0.092, thighR: 0.14, shinR: 0.1, noHead: true, pal: { top: skin, belly: skin, sleeve: skin, fore: skin, thigh: pants, shin: pants, hips: pants, gloves: col(P, 'gloves', 0x2a2420), boots: col(P, 'boots', 0x2a2622) } });
    M.bone(B.SPINE);
    M.sphere(0, S.chest - 0.1 * s, 0.1 * s, 0.34 * s, 0.35 * s, 0.31 * s, skin, { lat: 7, lon: 12 });
    const tat = col(P, 'tattoo', 0xe8741a), tat2 = col(P, 'tattoo2', 0xf0c030);
    if (!K.hide.has('tattoo')) M.with(0, S.chest - 0.1 * s, 0.412 * s, -0.1, 0, 0, () => {
      for (let i = 0; i < 7; i++) {
        const a = (i - 3) * 0.28;
        M.box(Math.sin(a) * 0.07 * s, 0.05 * s + Math.cos(a) * 0.05 * s, 0, 0.045 * s, 0.15 * s - Math.abs(i - 3) * 0.025 * s, 0.02 * s, i % 2 ? tat2 : tat, { rot: [0, 0, -a], tx: 0.15 });
      }
      M.box(0, -0.02 * s, 0.004 * s, 0.12 * s, 0.06 * s, 0.02 * s, 0x7a7e86);
      for (const sd of [-1, 1]) M.box(sd * 0.12 * s, 0, 0, 0.13 * s, 0.035 * s, 0.018 * s, tat2, { rot: [0, 0, sd * 0.3], tx: 0.4 });
    });
    for (const sd of [-1, 1]) M.box(sd * 0.13 * s, S.chest + 0.08 * s, 0.1 * s, 0.07 * s, 0.62 * s, 0.44 * s, strap, { rot: [0, 0, sd * 0.36] });
    M.box(0, S.chest + 0.14 * s, 0.26 * s, 0.22 * s, 0.14 * s, 0.05 * s, strap);
    M.box(0, S.sh - 0.02 * s, -0.12 * s, 0.5 * s, 0.1 * s, 0.26 * s, strap);
    M.with(-S.sw - 0.05 * s, S.sh + 0.04 * s, 0, 0, 0, PI / 2 - 0.35, () => {
      M.torus(0, 0, 0, 0.14 * s, 0.075 * s, col(P, 'tire', 0x1e1e20), { seg: 12, seg2: 5 });
      for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; M.with(Math.cos(a) * 0.2 * s, 0, Math.sin(a) * 0.2 * s, 0, -a, -PI / 2, () => M.cyl(0, 0.04 * s, 0, 0.025 * s, 0, 0.08 * s, 4, spike)); }
    });
    M.sphere(S.sw + 0.05 * s, S.sh, 0, 0.17 * s, 0.12 * s, 0.17 * s, strap, { lat: 4, lon: 8, half: true });
    M.bone(B.BACK);
    M.with(-0.18 * s, S.chest - 0.12 * s, -0.3 * s, 0.25, 0, 0.2, () => {
      M.cyl(0, 0, 0, 0.1 * s, 0.1 * s, 0.34 * s, 9, col(P, 'tank', 0xe8c020));
      for (const dy of [-0.08, 0.08]) M.cyl(0, dy * s, 0, 0.104 * s, 0.104 * s, 0.03 * s, 9, 0x2a2a2a);
      M.cyl(0, 0.2 * s, 0, 0.04 * s, 0.05 * s, 0.06 * s, 7, 0x3a3a40);
    });
    M.bone(B.ROOT);
    M.box(0, S.hip + 0.03 * s, 0.03 * s, 0.58 * s, 0.14 * s, 0.48 * s, strap);
    M.box(0, S.hip + 0.03 * s, 0.27 * s, 0.24 * s, 0.09 * s, 0.02 * s, col(P, 'plate', 0xd8dce4));
    for (const [x, y, z] of [[0.18, -0.08, 0.23], [-0.16, -0.14, 0.22], [0.05, -0.18, -0.24], [-0.2, -0.02, -0.2]]) M.box(x * s, S.hip + y * s, z * s, 0.12 * s, 0.07 * s, 0.02 * s, camo);
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * (S.hw + 0.1 * s), S.hip - 0.2 * s, 0.04 * s, 0.03 * s, 0.1 * s, 0.1 * s, camo2);
      M.box(side * S.hw, S.hip - 0.3 * s, 0.13 * s, 0.1 * s, 0.08 * s, 0.03 * s, camo);
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.box(side * S.hw, S.knee - 0.02 * s, 0.09 * s, 0.14 * s, 0.14 * s, 0.06 * s, strap);
      for (const dx of [-0.04, 0.04]) M.with(side * S.hw + dx * s, S.knee - 0.02 * s, 0.13 * s, PI / 2, 0, 0, () => M.cyl(0, 0.03 * s, 0, 0.02 * s, 0, 0.06 * s, 4, spike));
      M.box(side * S.hw, S.ankle + 0.1 * s, 0.02 * s, 0.17 * s, 0.2 * s, 0.2 * s, col(P, 'boots', 0x2a2622), { tx: 1.1 });
    }
    M.bone(B.HEAD);
    M.cyl(0, S.neck + 0.03 * s, 0.02 * s, 0.13 * s, 0.12 * s, 0.1 * s, 8, skin);
    const mask = col(P, 'mask', 0x2a2a2e);
    const mz = 0.02 * s;
    M.sphere(0, S.head, mz, R * 1.08, R * 1.12, R * 1.06, mask, { lat: 7, lon: 10 });
    M.cyl(0, S.head - R * 0.3, mz + R * 1.15, R * 0.44, R * 0.52, R * 0.55, 9, col(P, 'snout', 0x4a4a50), { rot: [PI / 2, 0, 0] });
    M.cyl(0, S.head - R * 0.3, mz + R * 1.45, R * 0.36, R * 0.36, R * 0.1, 9, col(P, 'filter', 0x6a6a70), { rot: [PI / 2, 0, 0] });
    for (const sd of [-1, 1]) M.cyl(sd * R * 0.14, S.head - R * 0.3, mz + R * 1.51, R * 0.08, R * 0.08, R * 0.03, 6, 0x101012, { rot: [PI / 2, 0, 0] });
    for (const sd of [-1, 1]) {
      M.cyl(sd * R * 0.46, S.head + R * 0.22, mz + R * 0.98, R * 0.32, R * 0.32, R * 0.16, 9, col(P, 'rim', 0x6a6e76), { rot: [PI / 2, 0, 0] });
      M.cyl(sd * R * 0.46, S.head + R * 0.22, mz + R * 1.07, R * 0.25, R * 0.25, R * 0.02, 9, col(P, 'lens', 0xd8a040), { rot: [PI / 2, 0, 0], emit: 0.45 });
      M.sphere(sd * R * 0.8, S.head + R * 0.7, R * 0.2, R * 0.18, R * 0.3, R * 0.14, mask, { lat: 3, lon: 5, rot: [0, 0, sd * -0.5] });
    }
    M.torus(0, S.head - R * 0.05, 0.02 * s, R * 1.06, R * 0.07, strap, { seg: 12, seg2: 3 });
    const hair = col(P, 'hair', 0xc8c8c0);
    M.box(0, S.head + R * 0.95, -R * 0.3, R * 0.5, R * 0.3, R * 1.2, hair);
    M.tube([[0, S.head + R * 1.0, -R * 0.6], [0, S.head + R * 1.5, -R * 1.0], [0, S.head + R * 1.2, -R * 1.4]], R * 0.14, hair, { seg: 5 });
    M.box(0, S.head - R * 0.2, -R * 0.95, R * 1.2, R * 0.9, R * 0.3, hair);
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, -0.07 * s, -0.04 * s, 0.06 * s, 0.15 * s, 0.09 * s, col(P, 'grip', 0x5a3a20));
      M.box(0, 0.06 * s, 0.14 * s, 0.2 * s, 0.22 * s, 0.4 * s, col(P, 'gun', 0xa8904a));
      M.cyl(0, 0.08 * s, 0.46 * s, 0.1 * s, 0.12 * s, 0.34 * s, 8, col(P, 'barrel', 0x5a5a5e), { rot: [PI / 2, 0, 0] });
      M.cyl(0, 0.2 * s, 0.1 * s, 0.1 * s, 0.1 * s, 0.14 * s, 8, col(P, 'drum', 0x6a5a38), { rot: [0, 0, PI / 2] });
      M.box(0, -0.06 * s, 0.24 * s, 0.14 * s, 0.1 * s, 0.14 * s, col(P, 'red', 0xa03020));
    });
    gunFrame(M, B.OFF, S, 1, () => {
      M.box(0, 0.02 * s, 0.08 * s, 0.05 * s, 0.14 * s, 0.1 * s, col(P, 'hook', 0x8a8e94));
      M.torus(0, 0.02 * s, 0.22 * s, 0.08 * s, 0.02 * s, col(P, 'hook', 0x8a8e94), { rot: [0, 0, PI / 2], seg: 10 });
      M.cyl(0, 0.1 * s, 0.26 * s, 0.018 * s, 0, 0.08 * s, 4, col(P, 'hook', 0x8a8e94));
    });
  };

  H.winston = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const fur = col(P, 'fur', 0x383c4c), ar = col(P, 'armor', 0xe8eaee), ar2 = col(P, 'armor2', 0xb4b8c2), acc = col(P, 'accent', 0xe8c030), faceC = col(P, 'face', 0x5a6072);
    human(M, S, P, { tw: 0.58, td: 0.44, taper: 1.3, armR: 0.12, foreR: 0.105, thighR: 0.13, shinR: 0.1, noHead: true, pal: { top: fur, belly: fur, sleeve: fur, fore: fur, pants: fur, thigh: fur, shin: fur, hips: fur, gloves: col(P, 'hands', 0x2a2e3a), boots: col(P, 'hands', 0x2a2e3a), neck: fur } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.06 * s, 0.12 * s, 0.58 * s, 0.44 * s, 0.32 * s, ar, { tx: 1.1, bx: 0.85 });
    M.box(0, S.chest - 0.18 * s, 0.14 * s, 0.4 * s, 0.1 * s, 0.26 * s, ar2);
    M.box(-0.14 * s, S.chest + 0.08 * s, 0.285 * s, 0.1 * s, 0.03 * s, 0.01 * s, acc);
    M.cyl(0.14 * s, S.chest + 0.1 * s, 0.28 * s, 0.05 * s, 0.05 * s, 0.02 * s, 9, col(P, 'lens', 0xa8d8f0), { rot: [PI / 2, 0, 0], emit: 0.4 });
    for (const sd of [-1, 1]) {
      M.with(sd * (S.sw + 0.05 * s), S.sh + 0.05 * s, 0, 0, 0, sd * 0.3, () => {
        M.sphere(0, 0, 0, 0.21 * s, 0.15 * s, 0.22 * s, ar, { lat: 4, lon: 9, half: true });
        M.box(sd * 0.05 * s, 0.1 * s, 0.1 * s, 0.1 * s, 0.03 * s, 0.1 * s, acc);
      });
    }
    M.bone(B.BACK);
    M.box(0, S.chest + 0.14 * s, -0.36 * s, 0.5 * s, 0.5 * s, 0.24 * s, col(P, 'pack', 0xd8dce2), { tx: 0.9 });
    M.box(0, S.chest + 0.14 * s, -0.49 * s, 0.34 * s, 0.34 * s, 0.03 * s, col(P, 'packDark', 0x3a3e46));
    for (const x of [-0.16, 0.16]) {
      M.cyl(x * s, S.chest - 0.16 * s, -0.36 * s, 0.08 * s, 0.1 * s, 0.14 * s, 8, col(P, 'packDark', 0x3a3e46));
      M.cyl(x * s, S.chest + 0.46 * s, -0.4 * s, 0.07 * s, 0.07 * s, 0.14 * s, 8, col(P, 'pack', 0xd8dce2));
    }
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.LAL : B.LAR);
      M.cyl(side * S.sw, S.hand + 0.16 * s, 0.01 * s, 0.13 * s, 0.14 * s, 0.24 * s, 9, ar);
      M.box(side * S.sw, S.hand + 0.2 * s, 0.13 * s, 0.05 * s, 0.1 * s, 0.02 * s, acc);
      M.box(side * S.sw, S.hand - 0.05 * s, 0.03 * s, 0.14 * s, 0.14 * s, 0.14 * s, col(P, 'hands', 0x2a2e3a));
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.box(side * S.hw, (S.knee + S.ankle) / 2, 0.06 * s, 0.16 * s, S.sn * 0.8, 0.08 * s, ar, { bx: 0.85 });
      M.box(side * S.hw, (S.knee + S.ankle) / 2, 0.1 * s, 0.03 * s, S.sn * 0.6, 0.01 * s, acc);
    }
    M.bone(B.HEAD);
    const hz = 0.1 * s;
    M.sphere(0, S.head, hz, R * 1.2, R * 1.08, R * 1.1, fur, { lat: 7, lon: 10 });
    M.box(0, S.head + R * 0.42, hz + R * 0.85, R * 1.7, R * 0.3, R * 0.4, fur, { tz: 0.8 });
    M.sphere(0, S.head - R * 0.2, hz + R * 0.78, R * 0.88, R * 0.72, R * 0.6, faceC, { lat: 6, lon: 9 });
    M.sphere(0, S.head - R * 0.42, hz + R * 1.05, R * 0.62, R * 0.4, R * 0.42, faceC, { lat: 5, lon: 8 });
    for (const sd of [-1, 1]) M.box(sd * R * 0.14, S.head - R * 0.24, hz + R * 1.44, R * 0.12, R * 0.08, R * 0.06, 0x14161c);
    M.box(0, S.head - R * 0.6, hz + R * 1.43, R * 0.5, R * 0.06, R * 0.05, 0x14161c);
    const glass = col(P, 'glasses', 0x1a1a1e);
    for (const sd of [-1, 1]) {
      M.box(sd * R * 0.38, S.head + R * 0.14, hz + R * 1.33, R * 0.52, R * 0.4, R * 0.05, glass);
      M.box(sd * R * 0.38, S.head + R * 0.14, hz + R * 1.37, R * 0.4, R * 0.28, R * 0.02, col(P, 'lens', 0xa8d8f0), { emit: 0.35 });
      M.box(sd * R * 0.66, S.head + R * 0.16, hz + R * 0.9, R * 0.05, R * 0.06, R * 0.8, glass);
      M.box(sd * R * 0.36, S.head + R * 0.1, hz + R * 1.28, R * 0.12, R * 0.1, R * 0.02, 0x101014);
    }
    M.box(0, S.head + R * 0.14, hz + R * 1.36, R * 0.14, R * 0.06, R * 0.05, glass);
    for (const sd of [-1, 1]) M.sphere(sd * R * 1.12, S.head + R * 0.05, hz, R * 0.16, R * 0.24, R * 0.14, faceC, { lat: 3, lon: 5 });
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, 0.02 * s, 0.1 * s, 0.22 * s, 0.24 * s, 0.34 * s, col(P, 'gun', 0xdadde4));
      M.box(0, 0.16 * s, 0.06 * s, 0.1 * s, 0.06 * s, 0.24 * s, acc);
      for (let i = 0; i < 3; i++) M.torus(0, 0.02 * s, 0.3 * s + i * 0.06 * s, 0.085 * s, 0.022 * s, col(P, 'coil', 0x60c8ff), { rot: [PI / 2, 0, 0], seg: 8, seg2: 3, emit: 0.8 });
      M.cyl(0, 0.02 * s, 0.36 * s, 0.03 * s, 0.03 * s, 0.28 * s, 6, col(P, 'barrel', 0x5a5e66), { rot: [PI / 2, 0, 0] });
    });
  };

  H.lucio = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const shirt = col(P, 'shirt', 0x3aa040), armor = col(P, 'armor', 0x4a5ad0), a2 = col(P, 'armor2', 0x86e040), skin = col(P, 'skin', 0x6a4430);
    human(M, S, P, { tw: 0.32, td: 0.19, taper: 1.15, thighR: 0.078, shinR: 0.064, armR: 0.05, foreR: 0.046, face: { noEyes: true, noBrows: true }, pal: { top: shirt, belly: shirt, sleeve: skin, fore: skin, pants: col(P, 'pants', 0x2a2e40), thigh: col(P, 'pants', 0x2a2e40), shin: armor, boots: col(P, 'boots', 0x2a2e36), gloves: col(P, 'gloves', 0x2a2e36) } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.03 * s, 0.01 * s, 0.35 * s, 0.34 * s, 0.23 * s, shirt, { tx: 1.1 });
    M.box(0, S.chest + 0.14 * s, 0.1 * s, 0.3 * s, 0.1 * s, 0.05 * s, armor, { tx: 1.1 });
    M.box(0, S.chest + 0.02 * s, 0.121 * s, 0.1 * s, 0.1 * s, 0.01 * s, a2, { emit: 0.3 });
    M.box(0, S.chest + 0.04 * s, 0.126 * s, 0.05 * s, 0.03 * s, 0.01 * s, 0x1a1a1a);
    for (const sd of [-1, 1]) M.sphere(sd * (S.sw + 0.02 * s), S.sh + 0.02 * s, 0, 0.08 * s, 0.07 * s, 0.09 * s, armor, { lat: 4, lon: 8, half: true });
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.LAL : B.LAR);
      M.cyl(side * S.sw, S.hand + 0.1 * s, 0, 0.06 * s, 0.062 * s, 0.16 * s, 8, armor);
      M.cyl(side * S.sw, S.hand + 0.16 * s, 0, 0.064 * s, 0.064 * s, 0.03 * s, 8, a2, { emit: 0.3 });
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * (S.hw + 0.02 * s), S.hip - 0.18 * s, 0.03 * s, 0.14 * s, 0.24 * s, 0.14 * s, armor);
      M.box(side * (S.hw + 0.02 * s), S.hip - 0.26 * s, 0.1 * s, 0.1 * s, 0.03 * s, 0.01 * s, a2, { emit: 0.3 });
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.box(side * S.hw, S.knee - 0.1 * s, 0.03 * s, 0.11 * s, 0.26 * s, 0.13 * s, armor);
      M.box(side * S.hw, S.knee - 0.02 * s, 0.09 * s, 0.08 * s, 0.06 * s, 0.03 * s, a2, { emit: 0.3 });
      for (const z of [-0.08, 0.14]) M.cyl(side * S.hw, 0.04 * s, z * s, 0.045 * s, 0.045 * s, 0.06 * s, 8, col(P, 'wheel', 0x80ff60), { rot: [0, 0, PI / 2], emit: 0.5 });
    }
    M.bone(B.HEAD);
    const hair = col(P, 'hair', 0x5a5a2a), tips = col(P, 'tips', 0xc0d040);
    if (!K.hide.has('hair')) {
      M.sphere(0, S.head + R * 0.3, -R * 0.08, R * 0.98, R * 0.8, R * 1.02, col(P, 'hairBase', 0x2a2218), { lat: 6, lon: 10, half: true });
      for (let i = 0; i < 11; i++) {
        const a = i / 11 * PI * 2, rr = R * (0.2 + (i % 3) * 0.12);
        const bx = Math.cos(a) * rr, bz = Math.sin(a) * rr - R * 0.2;
        const ox = Math.cos(a) * R * 0.9, oz = Math.sin(a) * R * 0.7 - R * 0.9;
        M.tube([[bx, S.head + R * 0.95, bz], [bx * 1.4, S.head + R * 1.45, bz - R * 0.2], [ox, S.head + R * 1.2, oz], [ox * 1.1, S.head + R * 0.3, oz - R * 0.2]], R * 0.13, hair, { seg: 4 });
        M.sphere(ox * 1.1, S.head + R * 0.28, oz - R * 0.2, R * 0.13, R * 0.2, R * 0.13, tips, { lat: 3, lon: 4 });
      }
      M.box(0, S.head + R * 0.95, -R * 0.15, R * 0.8, R * 0.18, R * 0.8, col(P, 'band', 0x3aa040));
    }
    const vy = S.head + R * 0.12, vz = headFront(S, 0, 0.12);
    M.box(0, vy, vz + R * 0.05, R * 1.72, R * 0.3, R * 0.12, col(P, 'visor', 0x90ff40), { emit: 0.65 });
    for (const sd of [-1, 1]) M.box(sd * R * 0.9, vy, R * 0.3, R * 0.06, R * 0.16, R * 0.9, 0x2a2a2a);
    gunFrame(M, B.GUN, S, -1, () => {
      M.box(0, 0.0, 0.06 * s, 0.14 * s, 0.15 * s, 0.3 * s, col(P, 'gun', 0x60c040));
      M.box(0, 0.09 * s, 0.02 * s, 0.1 * s, 0.04 * s, 0.2 * s, col(P, 'accent', 0xf0d020));
      M.cyl(0, 0.0, 0.25 * s, 0.1 * s, 0.07 * s, 0.1 * s, 10, col(P, 'accent', 0xf0d020), { rot: [PI / 2, 0, 0], emit: 0.4 });
      M.cyl(0, 0.0, 0.3 * s, 0.07 * s, 0.07 * s, 0.02, 10, col(P, 'speaker', 0x202020), { rot: [PI / 2, 0, 0] });
    });
  };

  H.mercy = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const suit = col(P, 'suit', 0xf4f4f2), suit2 = col(P, 'suit2', 0xc8ccd4), gold = col(P, 'gold', 0xe8c050), orange = col(P, 'orange', 0xe06a2a), body = col(P, 'body', 0x2a2226);
    human(M, S, P, { tw: 0.31, td: 0.19, taper: 1.15, thighR: 0.076, shinR: 0.058, armR: 0.047, foreR: 0.042, pal: { top: suit, belly: body, sleeve: suit, fore: suit, pants: body, thigh: body, shin: col(P, 'boots', 0xf2f2f0), boots: col(P, 'boots', 0xf2f2f0), gloves: col(P, 'gloves', 0x2a2a30), hips: suit } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.04 * s, 0.01 * s, 0.35 * s, 0.34 * s, 0.23 * s, suit, { tx: 1.1, bx: 0.9 });
    M.box(0, S.sh - 0.02 * s, 0.05 * s, 0.3 * s, 0.07 * s, 0.2 * s, gold, { tx: 0.85 });
    M.box(0, S.chest + 0.05 * s, 0.118 * s, 0.07 * s, 0.07 * s, 0.01 * s, gold, { emit: 0.3 });
    M.box(0, S.chest - 0.08 * s, 0.1 * s, 0.06 * s, 0.16 * s, 0.01 * s, orange);
    M.bone(B.ROOT);
    M.box(0, S.hip + 0.03 * s, 0, 0.3 * s, 0.06 * s, 0.2 * s, gold);
    for (const [x, z, ry] of [[-0.12, -0.08, 0.25], [0.12, -0.08, -0.25], [0, -0.1, 0], [-0.16, 0.02, 0.9], [0.16, 0.02, -0.9]]) {
      M.with(x * s, S.hip - 0.02 * s, z * s, 0.12, ry, 0, () => {
        M.box(0, -0.2 * s, -0.02 * s, 0.1 * s, 0.44 * s, 0.018 * s, suit, { bx: 0.7 });
        M.box(0, -0.36 * s, -0.03 * s, 0.07 * s, 0.1 * s, 0.02 * s, orange);
      });
    }
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * S.hw, S.knee + 0.04 * s, 0.03 * s, 0.1 * s, 0.1 * s, 0.1 * s, suit2);
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.box(side * S.hw, S.knee - 0.03 * s, 0.06 * s, 0.08 * s, 0.07 * s, 0.03 * s, gold);
    }
    M.bone(B.BACK);
    const wing = col(P, 'wing', 0xd8dce4), feather = col(P, 'feather', 0xfff0a0);
    M.box(0, S.chest + 0.08 * s, -0.16 * s, 0.14 * s, 0.2 * s, 0.08 * s, suit2);
    if (!K.hide.has('wings')) for (const side of [1, -1]) {
      M.at(side * 0.08 * s, S.chest + 0.14 * s, -0.19 * s, 0, side * 0.35, side * 0.4);
      M.box(side * 0.28 * s, 0.1 * s, 0, 0.56 * s, 0.045 * s, 0.05 * s, wing);
      M.box(side * 0.55 * s, 0.02 * s, 0, 0.08 * s, 0.16 * s, 0.05 * s, wing);
      for (let i = 0; i < 5; i++) {
        M.with(side * (0.12 + i * 0.1) * s, 0.06 * s, 0, 0, 0, side * (0.1 + i * 0.12), () => {
          M.box(0, -0.2 * s + i * 0.015 * s, 0, 0.07 * s, 0.46 * s - i * 0.04 * s, 0.018 * s, wing, { bx: 0.5 });
          M.box(0, -0.2 * s + i * 0.015 * s, 0.012 * s, 0.035 * s, 0.4 * s - i * 0.04 * s, 0.01 * s, feather, { emit: 0.7, bx: 0.4 });
        });
      }
      M.pop();
    }
    M.bone(B.HEAD);
    const hair = col(P, 'hair', 0xf0d890);
    hairCap(M, S, hair, { lift: 0.12, napeH: 0.9 });
    for (let i = 0; i < 5; i++) M.with((i - 2) * R * 0.32, S.head + R * 0.6, R * 0.72, 1.2, 0, (i - 2) * 0.22, () => M.box(0, R * 0.2, 0, R * 0.34, R * 0.55, R * 0.14, hair, { tx: 0.4 }));
    for (const sd of [-1, 1]) M.tube([[sd * R * 0.82, S.head + R * 0.3, R * 0.35], [sd * R * 0.9, S.head - R * 0.4, R * 0.4], [sd * R * 0.8, S.head - R * 0.9, R * 0.3]], R * 0.14, hair, { seg: 4 });
    M.tube([[0, S.head + R * 0.35, -R * 0.95], [0, S.head - R * 0.35, -R * 1.35], [0, S.head - R * 1.1, -R * 1.2]], R * 0.24, hair, { seg: 5, r0: R * 0.28, r1: R * 0.12 });
    M.torus(0, S.head - R * 0.35, -R * 1.2, R * 0.16, R * 0.05, gold, { seg: 8, seg2: 3 });
    if (!K.hide.has('halo')) M.with(0, S.head + R * 0.9, -R * 0.35, -0.5, 0, 0, () => {
      M.torus(0, 0, 0, R * 0.78, R * 0.07, col(P, 'halo', 0xffe070), { seg: 14, seg2: 3, emit: 0.85 });
      M.box(0, 0, R * 0.78, R * 0.16, R * 0.16, R * 0.16, gold, { emit: 0.4 });
    });
    gunFrame(M, B.GUN, S, -1, () => {
      M.cyl(0, -0.05 * s, 0.2 * s, 0.02 * s, 0.02 * s, 0.95 * s, 6, col(P, 'staff', 0xf4f4f4), { rot: [PI / 2, 0, 0] });
      M.box(0, -0.05 * s, 0.66 * s, 0.1 * s, 0.1 * s, 0.14 * s, gold);
      for (const sd of [-1, 1]) M.box(sd * 0.07 * s, -0.05 * s, 0.62 * s, 0.1 * s, 0.03 * s, 0.1 * s, col(P, 'staff', 0xf4f4f4), { rot: [0, 0, sd * 0.4] });
      M.sphere(0, -0.05 * s, 0.76 * s, 0.05 * s, 0.05 * s, 0.05 * s, col(P, 'tip', 0x80e8ff), { emit: 1 });
    });
    gunFrame(M, B.ALT, S, -1, () => {
      M.box(0, -0.05 * s, 0, 0.04 * s, 0.1 * s, 0.06 * s, col(P, 'gun', 0xf0f0f0));
      M.box(0, 0.02 * s, 0.08 * s, 0.05 * s, 0.06 * s, 0.2 * s, col(P, 'gun', 0xf0f0f0));
      M.box(0, 0.05 * s, 0.1 * s, 0.02 * s, 0.02 * s, 0.14 * s, gold);
    });
  };

  H.zenyatta = function (M, S, P, K = NOK) {
    const s = S.s, R = S.headR;
    const metal = col(P, 'metal', 0xaab4ca), m2 = col(P, 'metal2', 0x6a7488), pants = col(P, 'pants', 0xe0b440), light = col(P, 'light', 0x6ac8ff), gold = col(P, 'gold', 0xd8b040);
    human(M, S, P, { tw: 0.28, td: 0.18, taper: 1.2, armR: 0.04, foreR: 0.036, thighR: 0.12, shinR: 0.1, noHead: true, pal: { skin: metal, top: metal, belly: m2, sleeve: metal, fore: metal, pants, thigh: pants, shin: pants, hips: pants, boots: metal, gloves: metal, neck: m2 } });
    M.bone(B.SPINE);
    M.box(0, S.chest + 0.01 * s, 0, 0.27 * s, 0.4 * s, 0.18 * s, metal, { tx: 1.22, bx: 0.8 });
    for (let i = 0; i < 4; i++) M.box(0, S.waist + 0.02 * s + i * 0.045 * s, 0.02 * s, 0.14 * s, 0.02 * s, 0.16 * s, m2);
    M.cyl(0, S.chest + 0.04 * s, 0.1 * s, 0.05 * s, 0.05 * s, 0.02, 8, light, { rot: [PI / 2, 0, 0], emit: 1 });
    M.box(0, S.sh + 0.01 * s, 0, 0.36 * s, 0.05 * s, 0.14 * s, m2, { tx: 0.8 });
    M.bone(B.ROOT);
    M.box(0, S.hip - 0.04 * s, 0, 0.46 * s, 0.26 * s, 0.36 * s, pants, { bx: 1.25 });
    M.box(0, S.hip + 0.08 * s, 0, 0.36 * s, 0.07 * s, 0.28 * s, col(P, 'belt', 0x3a3a44));
    M.box(0.04 * s, S.hip - 0.12 * s, 0.19 * s, 0.1 * s, 0.34 * s, 0.02 * s, col(P, 'sash', 0xa82a26), { bx: 1.3 });
    M.box(-0.03 * s, S.hip - 0.1 * s, 0.2 * s, 0.07 * s, 0.26 * s, 0.02 * s, col(P, 'sash', 0xa82a26), { bx: 1.2 });
    for (const side of [1, -1]) {
      M.bone(side > 0 ? B.ULL : B.ULR);
      M.box(side * S.hw, (S.hip + S.knee) / 2, 0.01 * s, 0.24 * s, S.th * 0.9, 0.24 * s, pants, { tx: 1.1, bx: 0.9 });
      M.bone(side > 0 ? B.LLL : B.LLR);
      M.box(side * S.hw, S.ankle + 0.18 * s, 0, 0.2 * s, 0.34 * s, 0.2 * s, col(P, 'pants2', 0xb88a28), { bx: 0.7 });
    }
    M.bone(B.HEAD);
    M.sphere(0, S.head + R * 0.05, 0, R * 0.92, R * 1.2, R * 0.98, metal, { lat: 8, lon: 10 });
    M.box(0, S.head - R * 0.25, R * 0.62, R * 1.2, R * 1.05, R * 0.5, col(P, 'face', 0x8a94aa), { tx: 0.9, bx: 0.7 });
    M.box(0, S.head - R * 0.72, R * 0.6, R * 0.6, R * 0.2, R * 0.46, gold);
    for (const [x, y] of [[-0.36, 0.2], [0.36, 0.2], [0, 0.78], [-0.4, 0.58], [0.4, 0.58], [-0.2, 0.95], [0.2, 0.95]]) M.box(x * R, S.head + y * R, headFront(S, x, y) * 1.05 + R * 0.02, R * 0.13, R * 0.13, R * 0.05, light, { emit: 1 });
    M.bone(B.BACK);
    for (let i = 0; i < 9; i++) {
      const a = PI * 0.5 + i / 9 * PI * 2;
      const x = Math.cos(a) * 0.42 * s, z = Math.sin(a) * 0.36 * s - 0.06 * s, y = S.sh + 0.08 * s - Math.sin(a) * 0.1 * s;
      M.sphere(x, y, z, 0.058 * s, 0.058 * s, 0.058 * s, col(P, 'orbs', 0xe8e0b8), { lat: 5, lon: 7 });
      M.torus(x, y, z, 0.06 * s, 0.011 * s, col(P, 'orbRim', 0xc8a040), { seg: 9, seg2: 3 });
    }
  };

  H.trainbot = function (M, S, P) {
    const s = S.s;
    const shell = col(P, 'shell', 0xe8e4dc), dark = col(P, 'frame', 0x3a3e46), accent = col(P, 'accent', 0xf08a30);
    human(M, S, P, { tw: 0.4, td: 0.26, armR: 0.06, foreR: 0.05, thighR: 0.1, shinR: 0.08, noHead: true, pal: { skin: dark, top: shell, belly: dark, sleeve: dark, fore: shell, pants: dark, boots: accent, gloves: dark } });
    M.bone(B.SPINE);
    M.box(0, S.chest, 0.02 * s, 0.44 * s, 0.34 * s, 0.3 * s, shell, { tx: 1.15 });
    M.cyl(0, S.chest, 0.17 * s, 0.1 * s, 0.1 * s, 0.03, 12, accent, { rot: [PI / 2, 0, 0] });
    M.cyl(0, S.chest, 0.18 * s, 0.05 * s, 0.05 * s, 0.03, 10, 0xffffff, { rot: [PI / 2, 0, 0] });
    M.bone(B.HEAD);
    M.sphere(0, S.head, 0, S.headR * 1.05, S.headR * 1.0, S.headR * 1.05, shell, { lat: 6, lon: 10 });
    M.box(0, S.head, S.headR * 0.85, S.headR * 1.3, S.headR * 0.42, S.headR * 0.3, dark);
    M.box(0, S.head, S.headR * 1.0, S.headR * 0.9, S.headR * 0.16, 0.02, col(P, 'eye', 0xff5020), { emit: 1 });
    M.cyl(S.headR * 0.7, S.head + S.headR * 0.9, 0, 0.012, 0.012, S.headR * 0.8, 4, dark, { rot: [0, 0, -0.3] });
  };

  O.HERO_MODEL = H;
  O.MODEL_KIT = { B, col, shade, blend, headFront, face, hairSpikes, hairCap, limb, spike, lock };

  const SKEL_OPTS = {
    tracer: { neck: 0.042 }, soldier: { broad: 1.05 }, mccree: { broad: 1.05 }, junkrat: { broad: 0.9, legs: 1.05 },
    torbjorn: { broad: 1.35, legs: 0.72, torso: 0.95, headR: 0.14 }, widowmaker: { broad: 0.9, legs: 1.08 },
    reinhardt: { broad: 1.35, headR: 0.1 }, roadhog: { broad: 1.45, headR: 0.1, legs: 0.92 },
    winston: { broad: 1.4, legs: 0.7, arms: 1.35, torso: 1.1, headR: 0.12 }, lucio: { broad: 0.95 }, mercy: { broad: 0.92, legs: 1.04 },
    zenyatta: { broad: 0.95, headR: 0.12 }, trainbot: { broad: 1.15, headR: 0.16 }
  };

  const PAL = {
    tracer: { skin: 0xf4cfb0, eyes: 0x5a2a10, hair: 0x3e2618, brow: 0x3e2618, jacket: 0x8c929c, collar: 0xe8ecf0, harness: 0xeef1f4, glow: 0x5ad2ff, pants: 0xf28a1c, stripe: 0xfafafa, boots: 0xf2f4f6, sole: 0xf28a1c, gloves: 0x3e4450, bracer: 0xf0f2f5, bracer2: 0x8a929e, accent: 0xffb02e, goggles: 0xd8601a, lens: 0xff8f2a, gun: 0xe6e8ec, gunDark: 0x4a5058, lip: 0xc8766a, belt: 0x3a3e46 },
    soldier: { skin: 0xd8a888, eyes: 0x4a6a98, hair: 0xe8e8e4, jacket: 0x2c4c9c, chest: 0xe8e8ec, trim: 0xc02a2a, shirt: 0x1c1c22, pants: 0x34363e, pouch: 0x2a2622, boots: 0x2a2624, gloves: 0xb02a24, band: 0xe8c030, mask: 0x2e3036, maskM: 0x8a929c, visor: 0xff3a2a, gun: 0x3a4048, gunDark: 0x22262c, glow: 0x60c8ff },
    mccree: { skin: 0xc8906a, eyes: 0x3a2616, hair: 0x3a2618, beard: 0x3a2618, hat: 0x7a5232, band: 0x3a2416, serape: 0xb0321e, serape2: 0xf09a30, shirt: 0xb8ae98, vest: 0x6a4a30, plate: 0x9aa0a4, belt: 0x4a3020, buckle: 0xe0b840, metal: 0xb8c0c8, gloves: 0x6a4a2a, chaps: 0x9a7a52, pants: 0x3a4a5e, knee: 0x9aa2ac, boots: 0x5a3a22, cigar: 0x6a4a2a, grip: 0x8a5a32, gunDark: 0x3a3a40, gold: 0xd0a040 },
    junkrat: { skin: 0xd49a6a, eyes: 0x2a2a2a, hair: 0xf0d060, hairTip: 0x2a2218, teeth: 0xf0e080, soot: 0x7a5040, shorts: 0x6e6a3a, camo: 0x4a4826, patch: 0xa05a2a, belt: 0x5a3a20, grenade: 0xe08a20, band: 0x4a3a2a, peg: 0x6a6e76, pegStripe: 0xf0c030, sock: 0xb8b0a0, boots: 0x4a3424, arm: 0xa8602a, armDark: 0x4a3a30, wrist: 0x2a2a2e, bomb: 0x2a2a30, spike: 0x9aa0a8, drum: 0x5a7a3a, grip: 0x7a4a2a, barrel: 0x6a6a6a, accent: 0xe0b030, gloves: 0xd49a6a },
    torbjorn: { skin: 0xf0b898, eyes: 0x2a2a2a, beard: 0xf0e0a8, armor: 0xb82a22, armorDark: 0x7a1a16, metal: 0x6a6e76, metal2: 0xa8aeb8, pants: 0x4a4e56, belt: 0x3a2a1e, boots: 0xa82a22, goggle: 0xff8a20, helmet: 0x4a4e56, tattoo: 0x3a4a6a, claw: 0xb82a22, gun: 0xb82a22, gunDark: 0x3a3a40, glow: 0xff8a20, grip: 0x5a3a20, stack: 0x8a8e96, gloves: 0x5a3a20, band: 0x8a6a3a },
    widowmaker: { skin: 0x9a96e0, eyes: 0xe8c850, lip: 0x6a3a9a, hair: 0x2a1838, suit: 0x5a2e8a, suitLight: 0xa878d8, suitDark: 0x2a1a44, gloves: 0x3a1e52, boots: 0x2a1a36, visor: 0x5a3a8a, lens: 0xff50d0, gun: 0x5a3a8a, gunDark: 0x2a1a30, glow: 0xff60e0 },
    reinhardt: { armor: 0xb4bac4, armor2: 0x8a909a, dark: 0x3a3e46, gold: 0xd4a040, red: 0xc02a2a, visor: 0x1e2228, hammer: 0x9aa2ac, lion: 0xc8ccd4 },
    roadhog: { skin: 0xc88c68, tattoo: 0xe8741a, tattoo2: 0xf0c030, pants: 0x4a5a70, camo: 0x2e3a4c, camo2: 0x7a8aa0, boots: 0x2a2622, spike: 0xa8acb4, strap: 0x2a2420, mask: 0x2a2a2e, snout: 0x4a4a50, lens: 0xd8a040, hair: 0xc8c8c0, tire: 0x1e1e20, tank: 0xe8c020, gun: 0xa8904a, barrel: 0x5a5a5e, drum: 0x6a5a38, red: 0xa03020, hook: 0x8a8e94, gloves: 0x2a2420, grip: 0x5a3a20 },
    winston: { fur: 0x383c4c, face: 0x5a6072, armor: 0xe8eaee, armor2: 0xb4b8c2, accent: 0xe8c030, glasses: 0x1a1a1e, lens: 0xa8d8f0, pack: 0xd8dce2, packDark: 0x3a3e46, gun: 0xdadde4, coil: 0x60c8ff, barrel: 0x5a5e66, hands: 0x2a2e3a },
    lucio: { skin: 0x6a4430, eyes: 0x2a1a10, hair: 0x5a5a2a, tips: 0xc0d040, shirt: 0x3aa040, armor: 0x4a5ad0, armor2: 0x86e040, visor: 0x90ff40, pants: 0x2a2e40, boots: 0x2a2e36, wheel: 0x80ff60, gloves: 0x2a2e36, gun: 0x60c040, accent: 0xf0d020, speaker: 0x202020, lip: 0x4a2a20 },
    mercy: { skin: 0xf2d0b8, eyes: 0x3a6aa8, hair: 0xf0d890, brow: 0xc8a860, suit: 0xf4f4f2, suit2: 0xc8ccd4, gold: 0xe8c050, orange: 0xe06a2a, body: 0x2a2226, boots: 0xf2f2f0, gloves: 0x2a2a30, wing: 0xd8dce4, feather: 0xfff0a0, halo: 0xffe070, staff: 0xf4f4f4, tip: 0x80e8ff, gun: 0xf0f0f0, lip: 0xd07a78 },
    zenyatta: { metal: 0xaab4ca, metal2: 0x6a7488, face: 0x8a94aa, gold: 0xd8b040, pants: 0xe0b440, pants2: 0xb88a28, sash: 0xa82a26, light: 0x6ac8ff, orbs: 0xe8e0b8, orbRim: 0xc8a040 }
  };
  O.PAL = PAL;
  O.HERO_TINT = {
    tracer: [0xf49a1a, 0x8a5632], soldier: [0x2c4c9c, 0xc02a2a], mccree: [0xb0321e, 0xf09a30], junkrat: [0xe08a20, 0xf0d060],
    torbjorn: [0xb82a22, 0xf0e0a8], widowmaker: [0x5a2e8a, 0xff50d0], reinhardt: [0x8a909a, 0xd4a040], roadhog: [0x4a5a70, 0xe8741a],
    winston: [0x4a5a8a, 0xe8c030], lucio: [0x3aa040, 0xf0d020], mercy: [0xe8c050, 0x5ab8ff], zenyatta: [0xe0b440, 0x6ac8ff]
  };

  const SKINS = {
    tracer: [['classic', 'Классика', 'common', {}], ['posh', 'Шик', 'rare', { jacket: 0x4a2a5a, pants: 0xe8e0f0, collar: 0xd8c8e8, stripe: 0x4a2a5a }], ['sporty', 'Спорт', 'rare', { jacket: 0x2a6a8a, pants: 0xd8e8f0, stripe: 0x2a6a8a }], ['neon', 'Неон', 'rare', { jacket: 0x202428, pants: 0x60ff90, glow: 0x80ff60, stripe: 0x202428 }], ['cherry', 'Вишня', 'rare', { jacket: 0x8a1a2a, pants: 0x1a1a1a, stripe: 0xd02a3a }], ['mod', 'Модница', 'epic', { jacket: 0xf0f0f0, pants: 0x2a4aa8, goggles: 0xd02a2a, hair: 0x1a1a1a, collar: 0x2a2a2a }], ['rocket', 'Ракета', 'epic', { jacket: 0x3a3a44, pants: 0xd0d0d0, collar: 0xf05020, stripe: 0xf05020 }], ['punk', 'Панк', 'legendary', { jacket: 0x2a2a2a, pants: 0x8a2a8a, hair: 0xe030a0, collar: 0x1a1a1a, harness: 0x9a9aa0, stripe: 0xe8e8e8, goggles: 0x2a2a2a, lens: 0xe030a0 }], ['slipstream', 'Пилот', 'legendary', { jacket: 0xe8e8e8, pants: 0x2a4a8a, collar: 0xc8b890, goggles: 0x2a4a8a, stripe: 0xe8c030, lens: 0x9ad8ff }]],
    soldier: [['classic', 'Классика', 'common', {}], ['olive', 'Олива', 'rare', { jacket: 0x4a5a2a, chest: 0xc8c0a0 }], ['stealth', 'Скрытность', 'rare', { jacket: 0x2a2a2e, chest: 0x3a3a40, visor: 0x40ff60, gloves: 0x2a2a2e, trim: 0x40ff60 }], ['desert', 'Пустыня', 'rare', { jacket: 0xb09060, chest: 0xe8dcc0, gloves: 0x8a6a40 }], ['smoke', 'Дым', 'rare', { jacket: 0x6a6a74, chest: 0xc8c8cc }], ['golden', 'Ветеран', 'epic', { jacket: 0x5a3a1a, chest: 0xd8b060, visor: 0xffc030, trim: 0xe8c040 }], ['bone', 'Кость', 'epic', { jacket: 0xe0dccc, chest: 0xf4f0e4, trim: 0x3a3a3a, gloves: 0x3a3a3a }], ['commando', 'Коммандос', 'legendary', { jacket: 0x3a4a2a, chest: 0x5a6a3a, mask: 0x3a3a2a, visor: 0xff8a20, hair: 0x5a4a30, gloves: 0x3a3a2a }], ['strike', 'Командир', 'legendary', { jacket: 0x1a2a5a, chest: 0xe8e8ec, trim: 0xe8c040, maskM: 0xd8d8d8, visor: 0x60c8ff, band: 0x60c8ff, hair: 0xe0c070 }]],
    mccree: [['classic', 'Классика', 'common', {}], ['wheat', 'Пшеница', 'rare', { serape: 0xc8a04a, hat: 0x8a6a3a, serape2: 0x7a4a2a }], ['sky', 'Небо', 'rare', { serape: 0x3a6aa8, hat: 0x3a3a3a, serape2: 0xe8e8e8 }], ['ochre', 'Охра', 'rare', { serape: 0xc86a20, pants: 0x3a3a3a }], ['sage', 'Шалфей', 'rare', { serape: 0x6a8a5a, hat: 0x5a4a3a }], ['ghost', 'Призрак', 'epic', { serape: 0xe8e8e8, hat: 0xe8e8e8, shirt: 0x3a3a3a, serape2: 0x8a8a8a }], ['lifeguard', 'Спасатель', 'epic', { serape: 0xd02a2a, hat: 0xf0e0b0, shirt: 0xf0f0f0, serape2: 0xf0f0f0 }], ['gambler', 'Игрок', 'legendary', { serape: 0x2a2a2a, shirt: 0x6a1a1a, hat: 0x1a1a1a, band: 0xd0a040, buckle: 0xe0e0e0, serape2: 0xd0a040 }], ['mystery', 'Незнакомец', 'legendary', { serape: 0x4a3a5a, shirt: 0x2a2a3a, hat: 0x2a2a3a, beard: 0x1a1a1a, serape2: 0x8a6aa8 }]],
    junkrat: [['classic', 'Классика', 'common', {}], ['toxic', 'Токсик', 'rare', { shorts: 0x5a8a3a, drum: 0x40c040, hair: 0xa0e060, camo: 0x3a6a2a }], ['fuse', 'Фитиль', 'rare', { shorts: 0xa84a2a, drum: 0xc05030, camo: 0x7a3018 }], ['bleached', 'Выцветший', 'rare', { shorts: 0xd8d0b0, drum: 0xc8c8c0, hair: 0xf8f8e0, camo: 0xb0a888 }], ['rust', 'Ржавый', 'rare', { shorts: 0x6a3a1a, drum: 0x8a4a2a, camo: 0x4a2410 }], ['firework', 'Фейерверк', 'epic', { shorts: 0x2a2a6a, drum: 0xd02a2a, accent: 0xf0f0f0, camo: 0x1a1a4a, grenade: 0xd02a2a }], ['jester', 'Шут', 'epic', { shorts: 0x8a2a8a, drum: 0x2a8a8a, hair: 0xe030a0, camo: 0x5a1a5a }], ['hayseed', 'Деревенщина', 'legendary', { shorts: 0x5a7aa8, skin: 0xe8b890, gloves: 0xe8b890, drum: 0xa87a4a, hair: 0xd8a040, camo: 0x3a5a88 }], ['scarecrow', 'Пугало', 'legendary', { shorts: 0x6a5a3a, hair: 0xc8a050, drum: 0x5a4a2a, teeth: 0xf0a020, camo: 0x4a3a20, grenade: 0xf0a020 }]],
    torbjorn: [['classic', 'Классика', 'common', {}], ['plains', 'Равнины', 'rare', { armor: 0x8a7a4a, boots: 0x8a7a4a, claw: 0x8a7a4a, gun: 0x8a7a4a, armorDark: 0x5a4a2a }], ['blood', 'Кровь', 'rare', { armor: 0x6a1a1a, boots: 0x6a1a1a, claw: 0x6a1a1a, gun: 0x6a1a1a }], ['cobalt', 'Кобальт', 'rare', { armor: 0x2a4a8a, boots: 0x2a4a8a, claw: 0x2a4a8a, gun: 0x2a4a8a, armorDark: 0x1a2a5a }], ['soot', 'Сажа', 'rare', { armor: 0x3a3a3a, boots: 0x2a2a2a, claw: 0x3a3a3a, gun: 0x3a3a3a, beard: 0x8a5a3a }], ['viking', 'Викинг', 'epic', { armor: 0x5a3a2a, boots: 0x5a3a2a, claw: 0xd0a040, gun: 0xd0a040, helmet: 0xa8a8b0, beard: 0xd8b060 }], ['blast', 'Литейщик', 'epic', { armor: 0x3a3a3a, boots: 0x3a3a3a, claw: 0xe07a20, gun: 0xe07a20, glow: 0xffc040, goggle: 0xffc040 }], ['chopper', 'Байкер', 'legendary', { armor: 0x1a1a1a, boots: 0x1a1a1a, claw: 0x8a8a90, gun: 0x8a8a90, helmet: 0x2a2a2a, beard: 0x8a8a8a, goggle: 0xff4020 }], ['ironclad', 'Броненосец', 'legendary', { armor: 0x5a5e66, boots: 0x3a3e46, claw: 0x3a3e46, gun: 0x3a3e46, helmet: 0x3a3e46, beard: 0xe0e0e0, armorDark: 0x2a2e36 }]],
    widowmaker: [['classic', 'Классика', 'common', {}], ['rose', 'Роза', 'rare', { suit: 0x8a2a4a, suitLight: 0xd07090, suitDark: 0x4a1024, gloves: 0x5a1a2a }], ['patina', 'Патина', 'rare', { suit: 0x2a6a5a, suitLight: 0x6ab0a0, suitDark: 0x103a30, gloves: 0x1a4a3a }], ['ciel', 'Небеса', 'rare', { suit: 0x3a6aa8, suitLight: 0x80b0e8, suitDark: 0x1a3a6a, gloves: 0x2a4a88 }], ['vert', 'Зелень', 'rare', { suit: 0x3a7a3a, suitLight: 0x80c080, suitDark: 0x1a4a1a, gloves: 0x2a5a2a }], ['tygr', 'Тигрица', 'epic', { suit: 0xc86a20, suitLight: 0xf0b060, suitDark: 0x2a2a2a, gloves: 0x2a2a2a, lens: 0xffa020, glow: 0xffa020 }], ['nuit', 'Ночь', 'epic', { suit: 0x1a1a2a, suitLight: 0x3a3a5a, suitDark: 0x0a0a14, gloves: 0x1a1a2a, lens: 0x60a0ff, glow: 0x60a0ff }], ['odile', 'Одиллия', 'legendary', { suit: 0x1a1a1a, suitLight: 0x4a4a4a, suitDark: 0x0a0a0a, hair: 0x0a0a0a, skin: 0xb8b0e8, gloves: 0x1a1a1a }], ['comtesse', 'Графиня', 'legendary', { suit: 0x6a0a1a, suitLight: 0xd0a040, suitDark: 0x2a0a0a, hair: 0x4a0a1a, gloves: 0x2a0a0a }]],
    reinhardt: [['classic', 'Классика', 'common', {}], ['brass', 'Латунь', 'rare', { armor: 0xc8a060, armor2: 0x9a7a40 }], ['cobalt', 'Кобальт', 'rare', { armor: 0x4a6aa8, armor2: 0x2a4a80 }], ['copper', 'Медь', 'rare', { armor: 0xb86a3a, armor2: 0x8a4a22 }], ['bundeswehr', 'Олива', 'rare', { armor: 0x5a6a4a, armor2: 0x3a4a2a }], ['wujing', 'Страж', 'epic', { armor: 0x8a1a1a, armor2: 0x5a0a0a, gold: 0xe0c050, red: 0xe0c050 }], ['paragon', 'Эталон', 'epic', { armor: 0xe8e8ec, armor2: 0xb8bcc4, gold: 0x3a6ad0, red: 0x3a6ad0 }], ['blackhardt', 'Чёрный рыцарь', 'legendary', { armor: 0x2a2a30, armor2: 0x1a1a1e, dark: 0x1a1a1e, visor: 0xff3020, gold: 0x8a1a1a, red: 0x8a1a1a, lion: 0x3a3a40 }], ['lionhardt', 'Лев', 'legendary', { armor: 0xd8b050, armor2: 0xa88030, gold: 0xf0f0f0, dark: 0x6a4a2a, visor: 0x6a4a2a, lion: 0xf0d080 }]],
    roadhog: [['classic', 'Классика', 'common', {}], ['kiwi', 'Киви', 'rare', { pants: 0x4a7a3a, camo: 0x2a4a1a, mask: 0x3a4a2a }], ['mud', 'Грязь', 'rare', { pants: 0x6a4a2a, camo: 0x3a2a14, mask: 0x4a3a2a }], ['stitched', 'Штопаный', 'rare', { pants: 0x5a3a6a, camo: 0x3a2044, mask: 0x3a2a4a }], ['sharkbait', 'Акула', 'rare', { pants: 0x2a4a7a, camo: 0x1a2a4a, mask: 0x2a3a5a }], ['toxic', 'Токсик', 'epic', { pants: 0x3a3a3a, camo: 0x2a5a1a, mask: 0x3a6a2a, lens: 0x80ff40 }], ['bloody', 'Мясник', 'epic', { pants: 0x3a1a1a, camo: 0x5a1a1a, mask: 0x5a1a1a, lens: 0xff2020 }], ['islander', 'Островитянин', 'legendary', { pants: 0xe8a020, camo: 0xc05a10, mask: 0x8a5a2a, strap: 0xe03a8a, lens: 0x40d0ff }], ['sanitarium', 'Санитар', 'legendary', { pants: 0xe0e0d8, camo: 0xb0b0a8, mask: 0xd8d8d0, strap: 0xc8c8c0, lens: 0xff3020 }]],
    winston: [['classic', 'Классика', 'common', {}], ['atmosphere', 'Атмосфера', 'rare', { armor: 0x8ab0e0, accent: 0x2a4a8a, pack: 0x8ab0e0 }], ['banana', 'Банан', 'rare', { armor: 0xf0d860, accent: 0x8a6a2a, pack: 0xf0d860 }], ['forest', 'Лес', 'rare', { armor: 0x6a8a5a, accent: 0x3a4a2a, pack: 0x6a8a5a }], ['red', 'Красный', 'rare', { armor: 0xc04a3a, accent: 0xf0f0f0, pack: 0xc04a3a }], ['frogston', 'Лягушка', 'epic', { armor: 0x4aa03a, fur: 0x2a4a2a, accent: 0xf0d020, pack: 0x4aa03a }], ['desert', 'Пустыня', 'epic', { armor: 0xd8c090, fur: 0x6a5a4a, accent: 0x8a4a2a, pack: 0xd8c090 }], ['yeti', 'Йети', 'legendary', { fur: 0xe8ecf0, armor: 0x8ab0d0, face: 0x8aa0c0, accent: 0x3a6a9a, pack: 0x8ab0d0 }], ['explorer', 'Исследователь', 'legendary', { fur: 0x5a4a3a, armor: 0xc8b890, accent: 0x6a4a2a, glasses: 0x8a6a2a, pack: 0xc8b890 }]],
    lucio: [['classic', 'Классика', 'common', {}], ['azul', 'Лазурь', 'rare', { armor: 0x3a8ae0, shirt: 0x2a6ab0, visor: 0x60c0ff, armor2: 0x60c0ff }], ['roxo', 'Фиолет', 'rare', { armor: 0x9a4ad8, shirt: 0x6a2aa0, visor: 0xd080ff, armor2: 0xd080ff }], ['vermelho', 'Алый', 'rare', { armor: 0xd83a3a, shirt: 0xa02a2a, visor: 0xff8060, armor2: 0xff8060 }], ['laranja', 'Апельсин', 'rare', { armor: 0xf08a20, shirt: 0xc06a10, visor: 0xffc060, armor2: 0xffc060 }], ['hippityhop', 'Прыг-скок', 'epic', { armor: 0xf0f0f0, shirt: 0xff60a0, armor2: 0xff60a0, accent: 0xff60a0 }], ['synaesthesia', 'Синестезия', 'epic', { armor: 0x2a2a4a, shirt: 0x1a1a2a, armor2: 0x60ffe0, accent: 0x60ffe0, visor: 0x60ffe0 }], ['ribbit', 'Лягушонок', 'legendary', { armor: 0x60d040, shirt: 0x3a8a20, hair: 0x60d040, armor2: 0xff6020, accent: 0xff6020, tips: 0xffe060 }], ['slapshot', 'Хоккеист', 'legendary', { armor: 0xd82a2a, shirt: 0xf0f0f0, boots: 0x2a2a2a, armor2: 0xf0f0f0, accent: 0xf0f0f0, visor: 0x80d0ff }]],
    mercy: [['classic', 'Классика', 'common', {}], ['celestial', 'Небесная', 'rare', { suit: 0xd8e8ff, gold: 0x6a9ad8, feather: 0xc0e0ff, orange: 0x6a9ad8 }], ['mist', 'Туман', 'rare', { suit: 0xe0e8e0, gold: 0x6aa06a, feather: 0xc0ffc0, orange: 0x6aa06a }], ['orchid', 'Орхидея', 'rare', { suit: 0xf0e0f8, gold: 0xb06ad0, feather: 0xf0c0ff, orange: 0xb06ad0 }], ['verdant', 'Зелень', 'rare', { suit: 0xe8f0e0, gold: 0x4a8a3a, feather: 0xd8ffb0, orange: 0x4a8a3a }], ['fortune', 'Удача', 'epic', { suit: 0xd02a2a, gold: 0xf0c040, feather: 0xffd060, orange: 0xf0c040 }], ['amber', 'Янтарь', 'epic', { suit: 0x3a3a3a, gold: 0xf0a020, feather: 0xffb040, orange: 0xf0a020 }], ['valkyrie', 'Валькирия', 'legendary', { suit: 0xf8f8f8, gold: 0xfff0a0, feather: 0xffffd0, halo: 0xffffff, hair: 0xfff0c0, orange: 0xfff0a0 }], ['devil', 'Бесовка', 'legendary', { suit: 0x2a1a1a, gold: 0x8a1a1a, feather: 0xd02020, halo: 0xff3010, hair: 0x2a1010, brow: 0x2a1010, wing: 0x3a0a0a, orange: 0x8a1a1a, boots: 0x2a1a1a }]],
    zenyatta: [['classic', 'Классика', 'common', {}], ['air', 'Воздух', 'rare', { pants: 0xd8e8f0, pants2: 0xa8b8c8, light: 0x60e0ff }], ['earth', 'Земля', 'rare', { pants: 0x8a6a3a, pants2: 0x5a4020, light: 0xf0c060 }], ['leaf', 'Лист', 'rare', { pants: 0x6aa04a, pants2: 0x3a6a2a, light: 0x80ff80 }], ['water', 'Вода', 'rare', { pants: 0x3a6ab0, pants2: 0x1a3a80, light: 0x60a0ff }], ['ascendant', 'Восходящий', 'epic', { pants: 0xf0f0f0, pants2: 0xc0c0c0, metal: 0xe8d890, light: 0xffe060 }], ['harmonious', 'Гармония', 'epic', { pants: 0x8a2a8a, pants2: 0x5a1a5a, metal: 0xa8b0c0, light: 0xff80ff }], ['nutcracker', 'Щелкунчик', 'legendary', { pants: 0xd02a2a, pants2: 0x8a1a1a, metal: 0xe8e0d0, face: 0xf0d0b0, light: 0x2a2a2a, orbRim: 0xe0e0e0 }], ['sunyatta', 'Сунятта', 'legendary', { pants: 0xf0a020, pants2: 0xb06010, metal: 0xd8a060, face: 0xa06030, light: 0xffff80, orbs: 0xd0a040 }]]
  };
  O.SKINS = {};
  for (const id in SKINS) O.SKINS[id] = SKINS[id].map(([sid, name, rar, pal]) => ({ id: sid, name, rar, pal }));

  const GLOSS = {
    tracer: { jacket: 0.15, harness: 0.5, bracer: 0.45, bracer2: 0.65, gun: 0.55, gunDark: 0.4, goggles: 0.5, lens: 0.95 },
    soldier: { jacket: 0.2, chest: 0.2, mask: 0.45, maskM: 0.7, visor: 0.9, gun: 0.45, gunDark: 0.35, buckle: 0.8 },
    mccree: { vest: 0.2, hat: 0.1, plate: 0.6, knee: 0.7, gunDark: 0.55, metal: 0.85, buckle: 0.9, gold: 0.9 },
    junkrat: { grenade: 0.4, bomb: 0.5, drum: 0.45, arm: 0.55, armDark: 0.4, peg: 0.7, barrel: 0.6, spike: 0.8 },
    torbjorn: { boots: 0.5, armorDark: 0.45, armor: 0.55, claw: 0.55, gun: 0.55, stack: 0.7, helmet: 0.7, metal: 0.8, metal2: 0.85, goggle: 0.9 },
    widowmaker: { gloves: 0.3, suit: 0.35, suitLight: 0.35, suitDark: 0.35, boots: 0.45, gun: 0.55, gunDark: 0.5, visor: 0.7, lens: 0.95 },
    reinhardt: { dark: 0.35, armor2: 0.75, armor: 0.8, hammer: 0.75, lion: 0.8, gold: 0.95, visor: 0.9 },
    roadhog: { mask: 0.35, snout: 0.45, drum: 0.4, gun: 0.45, tank: 0.55, barrel: 0.6, hook: 0.75, spike: 0.8, lens: 0.9 },
    winston: { pack: 0.5, packDark: 0.4, armor2: 0.55, armor: 0.55, gun: 0.6, barrel: 0.6, glasses: 0.6, lens: 0.95 },
    lucio: { speaker: 0.3, armor: 0.5, armor2: 0.5, gun: 0.5, visor: 0.9 },
    mercy: { boots: 0.35, suit: 0.3, suit2: 0.5, wing: 0.55, staff: 0.6, gun: 0.6, gold: 0.9 },
    zenyatta: { metal2: 0.7, metal: 0.7, face: 0.75, orbs: 0.8, gold: 0.9, orbRim: 0.9 }
  };
  O.HERO_GLOSS = GLOSS;
  function glossMap(heroId, P) {
    const m = new Map();
    for (const [k, g] of Object.entries(GLOSS[heroId] || {})) if (P[k] !== undefined) m.set(P[k], g);
    return m;
  }
  const kitOf = (heroId, skinId) => ((O.SKIN_KITS || {})[heroId] || {})[skinId] || null;

  O.buildHeroModel = function (heroId, skinId) {
    const def = O.HEROES[heroId];
    const S = skel(def.h, SKEL_OPTS[heroId] || {});
    const skin = (O.SKINS[heroId] || []).find(k => k.id === skinId) || { pal: {} };
    const P = Object.assign({}, PAL[heroId] || {}, skin.pal || {});
    const kit = kitOf(heroId, skinId);
    const M = new O.MB();
    M.glossMap = glossMap(heroId, P);
    H[heroId](M, S, P, { hide: new Set(kit && kit.hide || []) });
    if (kit && kit.add) { M.bone(B.ROOT); kit.add(M, S, P); }
    return { data: M.data(), S, heroId, skin: skinId };
  };

  const VM = {};
  function ext(a, b, k) {
    const d = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], l = Math.hypot(d[0], d[1], d[2]) || 1;
    return [a[0] + d[0] / l * k, a[1] + d[1] / l * k, a[2] + d[2] / l * k];
  }
  function vArm(M, P, bone, from, hand, r, sleeve, glove) {
    M.bone(bone);
    const end = [hand[0], hand[1] - 0.01, hand[2] + 0.07];
    M.tube([ext(from, end, 0.45), end], r || 0.05, sleeve, { seg: 6 });
    M.box(hand[0], hand[1], hand[2], 0.075, 0.09, 0.11, glove);
  }
  const sl = (P, d) => col(P, 'sleeve', col(P, 'top', d || 0x506080));
  const gl = (P) => col(P, 'gloves', col(P, 'skin', 0xe0b090));

  VM.tracer = (M, P) => {
    const white = col(P, 'bracer', 0xf0f2f5), accent = col(P, 'accent', 0xffb02e), glow = col(P, 'glow', 0x5ad2ff);
    for (const side of [1, -1]) {
      const b = side > 0 ? 0 : 1;
      vArm(M, P, b, [side * 0.32, -0.5, 0.15], [side * 0.2, -0.22, -0.38], 0.048, col(P, 'jacket', 0x8c929c), col(P, 'gloves', 0x3e4450));
      M.cyl(side * 0.215, -0.27, -0.25, 0.066, 0.052, 0.19, 9, white, { rot: [PI / 2 - 0.45, 0, 0] });
      M.cyl(side * 0.205, -0.235, -0.33, 0.056, 0.056, 0.02, 9, col(P, 'bracer2', 0x8a929e), { rot: [PI / 2 - 0.45, 0, 0] });
      M.box(side * 0.215, -0.215, -0.26, 0.022, 0.012, 0.09, accent, { rot: [-0.45, 0, 0], emit: 0.25 });
      M.box(side * 0.2, -0.16, -0.5, 0.055, 0.065, 0.22, col(P, 'gun', 0xe6e8ec), { tz: 0.8 });
      M.box(side * 0.2, -0.125, -0.5, 0.02, 0.015, 0.16, glow, { emit: 1 });
      M.box(side * 0.2, -0.2, -0.43, 0.04, 0.08, 0.05, col(P, 'gunDark', 0x4a5058));
      M.cyl(side * 0.2, -0.16, -0.62, 0.02, 0.02, 0.03, 8, accent, { rot: [PI / 2, 0, 0], emit: 0.3 });
    }
    M.bone(5);
    M.cyl(-0.12, -0.13, -0.44, 0.06, 0.06, 0.03, 12, 0xd0d8e0, { rot: [PI / 2, 0, 0] });
    M.cyl(-0.12, -0.13, -0.425, 0.035, 0.035, 0.01, 10, glow, { rot: [PI / 2, 0, 0], emit: 1 });
  };
  VM.soldier = (M, P) => {
    vArm(M, P, 0, [0.36, -0.5, 0.12], [0.16, -0.25, -0.36], 0.058, col(P, 'jacket', 0x2c4c9c), gl(P));
    vArm(M, P, 1, [-0.34, -0.52, 0.1], [0.1, -0.24, -0.66], 0.055, col(P, 'jacket', 0x2c4c9c), gl(P));
    M.bone(1);
    M.cyl(-0.26, -0.44, 0.0, 0.062, 0.062, 0.05, 8, col(P, 'band', 0xe8c030), { rot: [0.9, 0, -0.8] });
    M.bone(0);
    M.box(0.14, -0.18, -0.52, 0.08, 0.11, 0.62, col(P, 'gun', 0x3a4048));
    M.box(0.14, -0.18, -0.87, 0.05, 0.05, 0.12, col(P, 'gunDark', 0x22262c));
    M.box(0.184, -0.17, -0.52, 0.01, 0.03, 0.42, col(P, 'glow', 0x60c8ff), { emit: 1 });
    M.box(0.096, -0.17, -0.52, 0.01, 0.03, 0.42, col(P, 'glow', 0x60c8ff), { emit: 1 });
    M.box(0.14, -0.1, -0.47, 0.03, 0.04, 0.2, col(P, 'gunDark', 0x22262c));
    M.bone(4);
    M.box(0.14, -0.25, -0.62, 0.06, 0.1, 0.07, col(P, 'gunDark', 0x22262c));
    M.box(0.14, -0.21, -0.62, 0.064, 0.02, 0.074, col(P, 'glow', 0x60c8ff), { emit: 0.6 });
    M.bone(5);
    M.cyl(0.1, -0.2, -0.64, 0.05, 0.055, 0.12, 8, 0x3a4048);
    M.cyl(0.1, -0.13, -0.64, 0.035, 0.035, 0.03, 8, 0xffe060, { emit: 1 });
  };
  VM.mccree = (M, P) => {
    vArm(M, P, 0, [0.36, -0.52, 0.12], [0.18, -0.24, -0.36], 0.055, col(P, 'shirt', 0xb8ae98), col(P, 'gloves', 0x6a4a2a));
    vArm(M, P, 1, [-0.34, -0.55, 0.1], [-0.16, -0.3, -0.36], 0.04, col(P, 'metal', 0xb8c0c8), col(P, 'metal', 0xb8c0c8));
    M.bone(0);
    M.box(0.18, -0.24, -0.42, 0.04, 0.1, 0.06, col(P, 'grip', 0x8a5a32), { rot: [0.3, 0, 0] });
    M.box(0.18, -0.165, -0.6, 0.028, 0.03, 0.22, col(P, 'gunDark', 0x3a3a40));
    M.box(0.18, -0.14, -0.52, 0.015, 0.015, 0.1, col(P, 'gold', 0xd0a040));
    M.box(0.18, -0.2, -0.47, 0.03, 0.02, 0.09, col(P, 'gunDark', 0x3a3a40));
    M.bone(4);
    M.cyl(0.18, -0.17, -0.47, 0.04, 0.04, 0.07, 8, col(P, 'gunDark', 0x3a3a40), { rot: [PI / 2, 0, 0] });
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; M.cyl(0.18 + Math.cos(a) * 0.024, -0.17 + Math.sin(a) * 0.024, -0.432, 0.008, 0.008, 0.004, 5, col(P, 'gold', 0xd0a040), { rot: [PI / 2, 0, 0] }); }
    M.bone(5);
    M.cyl(-0.12, -0.24, -0.44, 0.045, 0.045, 0.03, 10, 0x5a5e66, { rot: [0, 0, PI / 2] });
    M.cyl(-0.1, -0.24, -0.44, 0.03, 0.03, 0.012, 8, 0xfff0c0, { rot: [0, 0, PI / 2], emit: 0.8 });
  };
  VM.junkrat = (M, P) => {
    vArm(M, P, 0, [0.36, -0.52, 0.1], [0.2, -0.28, -0.34], 0.042, col(P, 'arm', 0xa8602a), col(P, 'arm', 0xa8602a));
    vArm(M, P, 1, [-0.34, -0.55, 0.1], [0.04, -0.3, -0.58], 0.04, col(P, 'skin', 0xd49a6a), col(P, 'skin', 0xd49a6a));
    M.bone(1);
    M.cyl(-0.1, -0.36, -0.44, 0.045, 0.045, 0.04, 7, col(P, 'wrist', 0x2a2a2e), { rot: [1.1, 0.5, 0] });
    M.bone(0);
    M.cyl(0.14, -0.2, -0.72, 0.07, 0.08, 0.4, 8, col(P, 'barrel', 0x6a6a6a), { rot: [PI / 2, 0, 0] });
    M.box(0.14, -0.08, -0.56, 0.05, 0.05, 0.3, col(P, 'accent', 0xe0b030));
    M.box(0.14, -0.3, -0.42, 0.05, 0.1, 0.06, col(P, 'grip', 0x7a4a2a));
    M.bone(4);
    M.cyl(0.14, -0.2, -0.46, 0.12, 0.12, 0.14, 10, col(P, 'drum', 0x5a7a3a), { rot: [0, 0, PI / 2] });
    for (let i = 0; i < 5; i++) { const a = i / 5 * PI * 2; M.box(0.215, -0.2 + Math.sin(a) * 0.07, -0.46 + Math.cos(a) * 0.07, 0.01, 0.035, 0.035, col(P, 'accent', 0xe0b030)); }
    M.bone(5);
    M.cyl(0.0, -0.3, -0.56, 0.08, 0.07, 0.06, 10, 0x4a4e3a);
    M.sphere(0.0, -0.26, -0.56, 0.03, 0.03, 0.03, 0xff2010, { emit: 1, lat: 3, lon: 5 });
    M.bone(6);
    M.cyl(0.0, -0.3, -0.56, 0.1, 0.1, 0.03, 10, 0x6a6e76);
    for (const sd of [-1, 1]) M.box(0.0, -0.28, -0.56 + sd * 0.07, 0.17, 0.02, 0.015, 0x9aa0a8);
  };
  VM.torbjorn = (M, P) => {
    vArm(M, P, 2, [0.38, -0.55, 0.1], [0.2, -0.27, -0.34], 0.07, col(P, 'skin', 0xf0b898), col(P, 'gloves', 0x5a3a20));
    M.bone(0);
    M.box(0.2, -0.18, -0.52, 0.12, 0.12, 0.38, col(P, 'gun', 0xb82a22));
    M.cyl(0.2, -0.18, -0.74, 0.04, 0.045, 0.12, 8, col(P, 'gunDark', 0x3a3a40), { rot: [PI / 2, 0, 0] });
    M.box(0.2, -0.11, -0.47, 0.04, 0.04, 0.2, col(P, 'glow', 0xff8a20), { emit: 1 });
    M.bone(1);
    M.tube([ext([-0.38, -0.58, 0.15], [-0.24, -0.34, -0.35], 0.45), [-0.24, -0.34, -0.35]], 0.09, col(P, 'claw', 0xb82a22), { seg: 6 });
    for (let i = 0; i < 2; i++) M.box(-0.24 + (i - 0.5) * 0.09, -0.3, -0.48, 0.05, 0.05, 0.16, col(P, 'claw', 0xb82a22), { rot: [0.3, (i - 0.5) * 0.5, 0] });
    M.box(-0.24, -0.34, -0.36, 0.14, 0.09, 0.1, col(P, 'metal', 0x6a6e76));
    M.bone(3);
    M.box(0.2, -0.3, -0.36, 0.035, 0.035, 0.4, col(P, 'grip', 0x5a3a20), { rot: [0.9, 0, 0] });
    M.box(0.2, -0.13, -0.55, 0.14, 0.12, 0.22, col(P, 'metal', 0x6a6e76), { rot: [0.9, 0, 0] });
    M.bone(5);
    M.box(-0.24, -0.26, -0.5, 0.16, 0.13, 0.16, 0xb07a3a);
    M.box(-0.24, -0.18, -0.5, 0.08, 0.04, 0.08, 0x3a3a40);
    M.box(-0.24, -0.26, -0.415, 0.06, 0.03, 0.01, 0xff8a20, { emit: 1 });
    M.bone(6);
    M.box(-0.24, -0.28, -0.5, 0.14, 0.1, 0.12, 0xa87a40);
    M.box(-0.24, -0.22, -0.5, 0.09, 0.02, 0.08, 0xe07a20, { emit: 0.6 });
  };
  VM.widowmaker = (M, P) => {
    vArm(M, P, 0, [0.34, -0.5, 0.1], [0.14, -0.25, -0.34], 0.04, col(P, 'gloves', 0x3a1e52), col(P, 'gloves', 0x3a1e52));
    vArm(M, P, 1, [-0.3, -0.55, 0.1], [0.08, -0.24, -0.66], 0.038, col(P, 'gloves', 0x3a1e52), col(P, 'gloves', 0x3a1e52));
    M.bone(0);
    M.box(0.12, -0.18, -0.56, 0.06, 0.09, 0.55, col(P, 'gun', 0x5a3a8a));
    M.cyl(0.12, -0.17, -1.07, 0.018, 0.018, 0.5, 6, col(P, 'gunDark', 0x2a1a30), { rot: [PI / 2, 0, 0] });
    M.cyl(0.12, -0.1, -0.5, 0.03, 0.03, 0.25, 6, col(P, 'gunDark', 0x2a1a30), { rot: [PI / 2, 0, 0] });
    M.box(0.155, -0.17, -0.56, 0.01, 0.02, 0.32, col(P, 'glow', 0xff60e0), { emit: 1 });
    M.bone(4);
    M.box(0.12, -0.26, -0.5, 0.04, 0.1, 0.06, col(P, 'gunDark', 0x2a1a30));
    M.box(0.12, -0.23, -0.5, 0.044, 0.02, 0.064, col(P, 'glow', 0xff60e0), { emit: 0.6 });
    M.bone(5);
    M.sphere(0.08, -0.2, -0.64, 0.045, 0.035, 0.045, 0x4a2a5a, { lat: 4, lon: 6 });
    M.sphere(0.08, -0.17, -0.64, 0.022, 0.022, 0.022, 0xe050ff, { emit: 1, lat: 3, lon: 5 });
  };
  VM.reinhardt = (M, P) => {
    const ar = col(P, 'armor', 0xb4bac4), dk = col(P, 'dark', 0x3a3e46);
    M.bone(0);
    M.tube([ext([0.42, -0.62, 0.1], [0.3, -0.4, -0.3], 0.45), [0.3, -0.4, -0.3]], 0.09, ar, { seg: 6 });
    M.box(0.3, -0.36, -0.36, 0.13, 0.13, 0.13, col(P, 'armor2', 0x8a909a));
    M.box(0.34, -0.08, -0.52, 0.05, 0.9, 0.05, dk, { rot: [-0.5, 0, -0.25] });
    M.box(0.48, 0.22, -0.74, 0.36, 0.36, 0.56, col(P, 'hammer', 0x9aa2ac), { rot: [-0.5, 0, -0.25] });
    M.box(0.48, 0.22, -0.74, 0.38, 0.1, 0.58, col(P, 'gold', 0xd4a040), { rot: [-0.5, 0, -0.25] });
    M.bone(1);
    M.tube([ext([-0.44, -0.62, 0.1], [-0.3, -0.42, -0.3], 0.45), [-0.3, -0.42, -0.3]], 0.09, ar, { seg: 6 });
    M.box(-0.3, -0.38, -0.38, 0.18, 0.2, 0.18, col(P, 'armor2', 0x8a909a));
    M.box(-0.2, -0.38, -0.38, 0.03, 0.18, 0.14, col(P, 'lion', 0xc8ccd4));
    M.box(-0.18, -0.36, -0.38, 0.02, 0.03, 0.04, col(P, 'red', 0xc02a2a), { emit: 0.6 });
  };
  VM.roadhog = (M, P) => {
    vArm(M, P, 0, [0.4, -0.58, 0.12], [0.22, -0.3, -0.34], 0.08, col(P, 'skin', 0xc88c68), col(P, 'gloves', 0x2a2420));
    vArm(M, P, 1, [-0.38, -0.58, 0.15], [-0.2, -0.34, -0.46], 0.08, col(P, 'skin', 0xc88c68), col(P, 'gloves', 0x2a2420));
    M.bone(0);
    M.box(0.18, -0.2, -0.52, 0.2, 0.2, 0.4, col(P, 'gun', 0xa8904a));
    M.cyl(0.18, -0.18, -0.82, 0.1, 0.12, 0.3, 8, col(P, 'barrel', 0x5a5a5e), { rot: [PI / 2, 0, 0] });
    M.cyl(0.18, -0.06, -0.47, 0.09, 0.09, 0.16, 8, col(P, 'drum', 0x6a5a38), { rot: [0, 0, PI / 2] });
    M.box(0.18, -0.3, -0.57, 0.14, 0.08, 0.14, col(P, 'red', 0xa03020));
    M.bone(4);
    for (let i = 0; i < 4; i++) M.box(0.18 + (i % 2 - 0.5) * 0.04, -0.06 + (i > 1 ? 0.03 : 0), -0.47 + (i % 3 - 1) * 0.03, 0.05, 0.03, 0.04, [0x8a8e94, 0xb07a3a, 0x5a5e66][i % 3], { rot: [0, i, 0.3 * i] });
    M.bone(6);
    M.cyl(-0.18, -0.26, -0.5, 0.05, 0.05, 0.16, 8, col(P, 'tank', 0xe8c020));
    M.cyl(-0.18, -0.16, -0.5, 0.02, 0.025, 0.05, 6, 0x3a3a40);
  };
  VM.winston = (M, P) => {
    for (const side of [1, -1]) {
      const b = side > 0 ? 0 : 1;
      M.bone(b);
      M.tube([ext([side * 0.44, -0.62, 0.15], [side * 0.26, -0.36, -0.3], 0.45), [side * 0.26, -0.36, -0.3]], 0.1, col(P, 'fur', 0x383c4c), { seg: 6 });
      M.cyl(side * 0.26, -0.36, -0.3, 0.11, 0.12, 0.18, 8, col(P, 'armor', 0xe8eaee), { rot: [PI / 2 - 0.5, 0, 0] });
      M.box(side * 0.26, -0.33, -0.22, 0.03, 0.06, 0.02, col(P, 'accent', 0xe8c030));
      M.box(side * 0.24, -0.3, -0.45, 0.14, 0.12, 0.14, col(P, 'hands', 0x2a2e3a));
    }
    M.bone(5);
    M.cyl(-0.24, -0.26, -0.5, 0.06, 0.07, 0.12, 8, 0xd4d8e0);
    M.sphere(-0.24, -0.18, -0.5, 0.04, 0.04, 0.04, 0x80d0ff, { emit: 1, lat: 3, lon: 6 });
    M.bone(4);
    M.box(0, -0.33, -0.56, 0.24, 0.15, 0.32, col(P, 'gun', 0xdadde4), { tx: 0.8, tz: 0.85 });
    M.box(0, -0.25, -0.55, 0.1, 0.05, 0.24, col(P, 'accent', 0xe8c030));
    M.box(0, -0.36, -0.5, 0.26, 0.06, 0.2, col(P, 'barrel', 0x5a5e66));
    M.cyl(0, -0.31, -0.84, 0.03, 0.03, 0.26, 6, col(P, 'barrel', 0x5a5e66), { rot: [PI / 2, 0, 0] });
    for (let i = 0; i < 3; i++) M.torus(0, -0.31, -0.76 - i * 0.06, 0.07, 0.016, col(P, 'coil', 0x60c8ff), { rot: [PI / 2, 0, 0], seg: 8, seg2: 3, emit: 0.9 });
  };
  VM.lucio = (M, P) => {
    vArm(M, P, 0, [0.36, -0.52, 0.15], [0.22, -0.27, -0.34], 0.05, col(P, 'skin', 0x6a4430), col(P, 'gloves', 0x2a2e36));
    vArm(M, P, 1, [-0.36, -0.58, 0.15], [-0.22, -0.4, -0.4], 0.05, col(P, 'skin', 0x6a4430), col(P, 'gloves', 0x2a2e36));
    for (const b of [0, 1]) { M.bone(b); M.cyl(b ? -0.25 : 0.25, b ? -0.45 : -0.34, b ? -0.3 : -0.25, 0.058, 0.06, 0.14, 8, col(P, 'armor', 0x4a5ad0), { rot: [PI / 2 - 0.45, 0, 0] }); }
    M.bone(0);
    M.box(0.22, -0.2, -0.47, 0.13, 0.13, 0.3, col(P, 'gun', 0x60c040));
    M.bone(4);
    M.cyl(0.22, -0.2, -0.65, 0.1, 0.07, 0.1, 10, col(P, 'accent', 0xf0d020), { rot: [PI / 2, 0, 0], emit: 0.5 });
    M.cyl(0.22, -0.2, -0.7, 0.07, 0.07, 0.02, 10, col(P, 'speaker', 0x202020), { rot: [PI / 2, 0, 0] });
    for (let i = 0; i < 3; i++) { const a = i / 3 * PI * 2; M.box(0.22 + Math.cos(a) * 0.045, -0.2 + Math.sin(a) * 0.045, -0.712, 0.02, 0.02, 0.008, col(P, 'accent', 0xf0d020), { emit: 0.5 }); }
  };
  VM.mercy = (M, P) => {
    for (const b of [0, 3]) vArm(M, P, b, [0.36, -0.52, 0.15], [0.22, -0.28, -0.34], 0.045, col(P, 'suit', 0xf4f4f2), col(P, 'gloves', 0x2a2a30));
    vArm(M, P, 1, [-0.36, -0.58, 0.15], [-0.22, -0.42, -0.4], 0.045, col(P, 'suit', 0xf4f4f2), col(P, 'gloves', 0x2a2a30));
    M.bone(0);
    M.cyl(0.24, -0.2, -0.56, 0.018, 0.018, 0.9, 6, col(P, 'staff', 0xf4f4f4), { rot: [PI / 2 - 0.18, 0, 0] });
    M.box(0.25, -0.08, -0.96, 0.09, 0.09, 0.12, col(P, 'gold', 0xe8c050), { rot: [-0.18, 0, 0] });
    M.sphere(0.25, -0.05, -1.04, 0.045, 0.045, 0.045, col(P, 'tip', 0x80e8ff), { emit: 1 });
    M.bone(3);
    M.box(0.2, -0.2, -0.47, 0.05, 0.06, 0.22, col(P, 'gun', 0xf0f0f0));
    M.box(0.2, -0.25, -0.4, 0.04, 0.09, 0.05, col(P, 'gun', 0xf0f0f0));
    M.box(0.2, -0.17, -0.47, 0.02, 0.02, 0.16, col(P, 'gold', 0xe8c050));
    M.bone(4);
    M.box(0.2, -0.3, -0.41, 0.035, 0.07, 0.04, col(P, 'gun', 0xf0f0f0));
    M.box(0.2, -0.34, -0.41, 0.04, 0.012, 0.045, col(P, 'gold', 0xe8c050));
  };
  VM.zenyatta = (M, P) => {
    for (const side of [1, -1]) {
      M.bone(side > 0 ? 0 : 1);
      M.tube([ext([side * 0.34, -0.52, 0.12], [side * 0.2, -0.3, -0.36], 0.45), [side * 0.2, -0.3, -0.36]], 0.035, col(P, 'metal', 0xaab4ca), { seg: 5 });
      M.box(side * 0.2, -0.28, -0.42, 0.06, 0.08, 0.1, col(P, 'metal', 0xaab4ca));
    }
    for (const b of [2, 4]) {
      M.bone(b);
      M.sphere(0, -0.24, -0.62, 0.07, 0.07, 0.07, col(P, 'orbs', 0xe8e0b8), { lat: 5, lon: 8 });
      M.torus(0, -0.24, -0.62, 0.07, 0.012, col(P, 'orbRim', 0xc8a040), { seg: 10, seg2: 3 });
    }
  };
  O.VIEW_MODEL = VM;

  O.buildViewModel = function (heroId, skinId) {
    const skin = (O.SKINS[heroId] || []).find(k => k.id === skinId) || { pal: {} };
    const P = Object.assign({}, PAL[heroId] || {}, skin.pal || {});
    const M = new O.MB();
    M.glossMap = glossMap(heroId, P);
    (VM[heroId] || VM.soldier)(M, P);
    const kit = kitOf(heroId, skinId);
    if (kit && kit.vm) kit.vm(M, P);
    return { data: M.data(), heroId, skin: skinId };
  };
})(globalThis.Ow98 = globalThis.Ow98 || {});
