(function (S) {
  'use strict';
  const { Geo, col, mulCol, SKIN_TONES, CAREERS, clamp } = S;
  const PI = Math.PI;

  function M4() { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function mul(a, b) {
    const o = new Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    return o;
  }
  function T(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; }
  function RX(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
  function RY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; }
  function RZ(a) { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; }
  function chain() { let m = arguments[0]; for (let i = 1; i < arguments.length; i++) m = mul(m, arguments[i]); return m; }

  function outfitOf(sim) {
    const L = sim.look;
    if (sim.outfit === 'none') return { top: 'none', tc: 'skin', bottom: 'none', bc: 'skin', shoes: 'skin', sleeves: 0 };
    if (sim.outfit === 'work' && sim.job) {
      const c = CAREERS[sim.job.c];
      if (c && c.outfit) return { top: c.outfit.top, tc: c.outfit.c, bottom: c.outfit.bottom, bc: c.outfit.b, shoes: '#1c1c20', sleeves: c.outfit.top === 'tshirt' ? 0 : 1, tie: c.outfit.top === 'jacket' ? '#8a2a2a' : null };
    }
    return (L.outfits && (L.outfits[sim.outfit] || L.outfits.everyday)) || { top: 'tshirt', tc: '#3a6ab8', bottom: 'jeans', bc: '#2c3a5a', shoes: '#3a2a1a', sleeves: 0 };
  }

  function dims(sim) {
    const age = sim.age;
    const base = { baby: 0.34, toddler: 0.5, child: 0.68, teen: 0.93, ya: 1, adult: 1, elder: 0.97 }[age] || 1;
    const head = { baby: 1.9, toddler: 1.5, child: 1.28, teen: 1.04, ya: 1, adult: 1, elder: 1 }[age] || 1;
    const fat = sim.look ? sim.look.fat || 0.3 : 0.3, fit = sim.look ? sim.look.fit || 0.4 : 0.4;
    const f = sim.gender === 'f';
    const preg = sim.preg ? Math.min(1, (S._gameT - sim.preg.t) / 4320) : 0;
    return { k: base, head, fat, fit, f, preg };
  }

  function buildParts(sim, atlas) {
    const d = dims(sim);
    const o = outfitOf(sim);
    const skin = col(typeof sim.look.skin === 'number' ? SKIN_TONES[sim.look.skin] || SKIN_TONES[1] : sim.look.skin);
    const C = x => x === 'skin' ? skin : col(x || '#888888');
    const tc = C(o.tc), bc = C(o.bc), shoe = o.shoes === 'skin' ? skin : C(o.shoes);
    const hairC = col(sim.look.hairC || '#3a2a1a');
    const eyes = col(sim.look.eyes || '#3a2a1a');
    const fatK = 1 + d.fat * 0.35 - d.fit * 0.06, limbK = 1 + d.fat * 0.25 + d.fit * 0.12;
    const P = {};
    const mk = () => new Geo(atlas);
    const topSkin = o.top === 'none' || o.top === 'tank' && false;
    const torsoC = o.top === 'none' ? skin : tc;
    const g = mk();
    const sw = (d.f ? 0.165 : 0.19) * fatK, hw = (d.f ? 0.155 : 0.145) * fatK;
    const tl = 0.5;
    g.cyl(0, 0, 0, tl * 0.55, hw, sw * 0.92, 8, torsoC, { ry0: 0.1 * fatK, ry1: 0.11 * fatK, noTop: true, bottom: true, cell: 'fabric' });
    g.cyl(0, 0, tl * 0.55, tl, sw * 0.92, sw * 0.85, 8, torsoC, { ry0: 0.11 * fatK, ry1: 0.1 * fatK, cell: 'fabric' });
    g.sphere(-sw * 0.85, 0, tl - 0.03, 0.065 * limbK, 0.07, 0.06, 6, 3, o.top === 'tank' || o.top === 'swim' || o.top === 'none' || o.top === 'dress' && !o.long ? skin : torsoC);
    g.sphere(sw * 0.85, 0, tl - 0.03, 0.065 * limbK, 0.07, 0.06, 6, 3, o.top === 'tank' || o.top === 'swim' || o.top === 'none' || o.top === 'dress' && !o.long ? skin : torsoC);
    if (o.top === 'tank' || o.top === 'swim' || (o.top === 'dress' && !o.long)) g.cyl(0, 0, tl - 0.06, tl + 0.005, sw * 0.6, sw * 0.5, 8, skin, { ry0: 0.1, ry1: 0.08 });
    if (d.f && d.k >= 0.9) { g.sphere(-0.055, 0.062 * fatK, tl * 0.72, 0.058, 0.034, 0.05, 6, 4, torsoC, { cell: 'fabric' }); g.sphere(0.055, 0.062 * fatK, tl * 0.72, 0.058, 0.034, 0.05, 6, 4, torsoC, { cell: 'fabric' }); }
    if (o.top === 'jacket') { g.panel(-0.05, 0.05, tl * 0.35, tl - 0.02, 0.112 * fatK, [0.95, 0.95, 0.95]); if (o.tie) g.panel(-0.02, 0.02, tl * 0.3, tl - 0.04, 0.115 * fatK, C(o.tie)); }
    if (o.top === 'robe') g.cyl(0, 0, -0.95, tl, 0.34, sw, 10, torsoC, { ry0: 0.3, cell: 'fabric' });
    if (d.preg > 0.05) g.sphere(0, 0.09 + d.preg * 0.06, tl * 0.3, 0.12 * (0.6 + d.preg * 0.5), 0.1 + d.preg * 0.08, 0.13, 8, 5, torsoC, { cell: 'fabric' });
    P.torso = g;
    const pv = mk();
    const lowC = o.top === 'dress' || o.top === 'swim' ? tc : o.bottom === 'none' ? skin : bc;
    pv.cyl(0, 0, -0.1, 0.02, hw * 1.02, hw, 8, lowC, { ry0: 0.105 * fatK, ry1: 0.1 * fatK, bottom: true, cell: 'fabric' });
    if (o.bottom === 'skirt' || o.top === 'dress' || o.top === 'robe') {
      const long = o.long || o.top === 'robe';
      pv.cyl(0, 0, long ? -0.85 : -0.4, 0.0, long ? 0.26 : 0.22, hw * 1.02, 10, o.top === 'dress' || o.top === 'robe' ? tc : bc, { ry0: long ? 0.24 : 0.2, ry1: 0.105 * fatK, cell: 'fabric', noTop: true });
    }
    P.pelvis = pv;
    const nk = mk();
    nk.cyl(0, 0, 0, 0.09, 0.045, 0.042, 6, skin);
    P.neck = nk;
    const hd = mk();
    const HR = 0.1;
    hd.sphere(0, 0.005, 0.12, HR, HR * 1.08, HR * 1.22, 8, 6, skin);
    hd.sphere(-0.035, 0.1, 0.14, 0.017, 0.008, 0.012, 4, 3, [0.97, 0.97, 0.97]);
    hd.sphere(0.035, 0.1, 0.14, 0.017, 0.008, 0.012, 4, 3, [0.97, 0.97, 0.97]);
    hd.sphere(-0.035, 0.106, 0.14, 0.009, 0.006, 0.009, 4, 3, eyes);
    hd.sphere(0.035, 0.106, 0.14, 0.009, 0.006, 0.009, 4, 3, eyes);
    hd.box(-0.055, 0.094, 0.162, -0.015, 0.104, 0.168, hairC);
    hd.box(0.015, 0.094, 0.162, 0.055, 0.104, 0.168, hairC);
    hd.box(-0.01, 0.1, 0.09, 0.01, 0.12, 0.12, mulCol(skin, 0.95));
    hd.box(-0.028, 0.098, 0.065, 0.028, 0.104, 0.074, d.f ? [0.72, 0.3, 0.32] : mulCol(skin, 0.7));
    hd.sphere(-0.1, 0, 0.12, 0.018, 0.03, 0.035, 4, 3, skin); hd.sphere(0.1, 0, 0.12, 0.018, 0.03, 0.035, 4, 3, skin);
    buildHair(hd, sim.look.hair, hairC, HR, sim.age === 'elder' && sim.gender === 'm');
    if (o.top === 'robe') hd.sphere(0, -0.01, 0.13, HR * 1.35, HR * 1.4, HR * 1.45, 8, 5, [0.08, 0.08, 0.1], { lat0: 0, lat1: PI * 0.62 });
    P.head = hd;
    const longSleeve = o.sleeves && o.top !== 'tank' && o.top !== 'none' && o.top !== 'swim' && !(o.top === 'dress' && !o.long);
    const shortSleeve = !longSleeve && ['tshirt', 'blouse', 'pajama', 'shirt', 'sweater', 'jacket'].includes(o.top);
    for (const side of ['L', 'R']) {
      const ua = mk();
      const r0 = 0.052 * limbK, r1 = 0.043 * limbK;
      if (longSleeve) ua.cyl(0, 0, -0.28, 0, r1, r0, 6, tc, { cell: 'fabric' });
      else if (shortSleeve) { ua.cyl(0, 0, -0.13, 0, r0 * 0.98, r0 * 1.05, 6, tc, { cell: 'fabric' }); ua.cyl(0, 0, -0.28, -0.13, r1, r0 * 0.95, 6, skin); }
      else ua.cyl(0, 0, -0.28, 0, r1, r0, 6, skin);
      P['ua' + side] = ua;
      const fa = mk();
      fa.cyl(0, 0, -0.25, 0, 0.034 * limbK, 0.041 * limbK, 6, longSleeve ? tc : skin, { cell: longSleeve ? 'fabric' : null });
      fa.sphere(0, 0.005, -0.285, 0.036, 0.028, 0.05, 5, 3, skin);
      P['fa' + side] = fa;
      const th = mk();
      const tr0 = 0.078 * limbK * (d.f ? 1.05 : 1), tr1 = 0.056 * limbK;
      const pants = o.bottom === 'pants' || o.bottom === 'jeans' || o.top === 'pajama' || o.top === 'robe';
      if (pants) th.cyl(0, 0, -0.44, 0, tr1, tr0, 6, bc, { cell: 'fabric' });
      else if (o.bottom === 'shorts') { th.cyl(0, 0, -0.2, 0, tr0 * 0.94, tr0 * 1.04, 6, bc, { cell: 'fabric' }); th.cyl(0, 0, -0.44, -0.2, tr1, tr0 * 0.92, 6, skin); }
      else if (o.bottom === 'trunks') { th.cyl(0, 0, -0.1, 0, tr0 * 0.98, tr0 * 1.03, 6, bc); th.cyl(0, 0, -0.44, -0.1, tr1, tr0 * 0.96, 6, skin); }
      else th.cyl(0, 0, -0.44, 0, tr1, tr0, 6, skin);
      P['th' + side] = th;
      const sh = mk();
      sh.cyl(0, 0, -0.42, 0, 0.042 * limbK, 0.052 * limbK, 6, pants ? bc : skin, { cell: pants ? 'fabric' : null });
      sh.box(-0.045, -0.04, -0.47, 0.045, 0.14, -0.4, shoe);
      P['sh' + side] = sh;
    }
    for (const k of Object.keys(P)) P[k] = P[k].toArray();
    return P;
  }

  function buildHair(g, style, c, R, balding) {
    const cap = (lat1, sx, sy, sz, dz) => g.sphere(0, -0.006, 0.13 + (dz || 0), R * (sx || 1.08), R * (sy || 1.14), R * (sz || 1.28), 8, 4, c, { lat0: 0, lat1 });
    switch (style) {
      case 'bald': if (!balding) return; g.sphere(0, -0.02, 0.1, R * 1.05, R * 1.08, R * 0.7, 8, 2, c, { lat0: PI * 0.45, lat1: PI * 0.62 }); return;
      case 'crew': cap(PI * 0.42, 1.05, 1.1, 1.26); return;
      case 'short': cap(PI * 0.5); g.box(-0.07, 0.075, 0.17, 0.07, 0.11, 0.22, c); return;
      case 'side': cap(PI * 0.5); g.box(-0.08, 0.07, 0.18, 0.05, 0.115, 0.235, c); g.sphere(0.03, 0.05, 0.24, 0.07, 0.07, 0.035, 6, 3, c); return;
      case 'spiky': cap(PI * 0.45); for (let i = 0; i < 7; i++) { const a = i / 7 * PI * 2; g.cyl(Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.2, 0.3, 0.03, 0.005, 4, c); } return;
      case 'long_m': cap(PI * 0.55); g.box(-0.1, -0.12, -0.02, 0.1, -0.02, 0.16, c); return;
      case 'afro': g.sphere(0, -0.02, 0.17, R * 1.55, R * 1.55, R * 1.45, 10, 6, c); return;
      case 'mohawk': cap(PI * 0.35, 1.02, 1.06, 1.22); g.box(-0.02, -0.12, 0.2, 0.02, 0.1, 0.3, c); return;
      case 'bob': g.sphere(0, -0.01, 0.13, R * 1.2, R * 1.22, R * 1.33, 8, 5, c, { lat0: 0, lat1: PI * 0.72 }); g.box(-0.07, 0.07, 0.18, 0.07, 0.12, 0.23, c); return;
      case 'long': g.sphere(0, -0.01, 0.13, R * 1.15, R * 1.2, R * 1.32, 8, 5, c, { lat0: 0, lat1: PI * 0.6 }); g.box(-0.11, -0.12, -0.2, 0.11, -0.01, 0.15, c); g.box(-0.12, -0.02, -0.1, -0.08, 0.06, 0.14, c); g.box(0.08, -0.02, -0.1, 0.12, 0.06, 0.14, c); return;
      case 'ponytail': cap(PI * 0.55); g.cyl(0, -0.13, -0.08, 0.14, 0.02, 0.045, 6, c); return;
      case 'bun': cap(PI * 0.52); g.sphere(0, -0.08, 0.24, 0.06, 0.06, 0.055, 6, 4, c); return;
      case 'short_f': g.sphere(0, -0.01, 0.13, R * 1.14, R * 1.18, R * 1.3, 8, 4, c, { lat0: 0, lat1: PI * 0.58 }); g.box(-0.08, 0.07, 0.17, 0.08, 0.115, 0.22, c); return;
      case 'pigtails': cap(PI * 0.55); g.sphere(-0.12, -0.02, 0.12, 0.04, 0.04, 0.07, 6, 4, c); g.sphere(0.12, -0.02, 0.12, 0.04, 0.04, 0.07, 6, 4, c); return;
      case 'curly': cap(PI * 0.6, 1.18, 1.2, 1.3); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; g.sphere(Math.cos(a) * 0.1, Math.sin(a) * 0.1 - 0.02, 0.12, 0.045, 0.045, 0.05, 5, 3, c); } return;
      default: cap(PI * 0.5);
    }
  }

  const PROPS = {};
  function propGeo(key, atlas) {
    if (PROPS[key]) return PROPS[key];
    const g = new Geo(atlas);
    const W = [0.95, 0.95, 0.93];
    switch (key) {
      case 'book': g.box(-0.07, -0.02, -0.1, 0.07, 0.02, 0.1, [0.6, 0.2, 0.2]); break;
      case 'paper': g.box(-0.1, -0.005, -0.14, 0.1, 0.005, 0.14, W, { cell: 'newspaper' }); break;
      case 'plate': case 'fork': g.cyl(0, 0.05, -0.02, 0.0, 0.1, 0.11, 8, W); g.sphere(0, 0.05, 0.01, 0.06, 0.05, 0.03, 5, 3, [0.8, 0.5, 0.3]); break;
      case 'cup': g.cyl(0, 0, -0.04, 0.05, 0.03, 0.035, 6, W); break;
      case 'chips': g.box(-0.05, -0.02, -0.07, 0.05, 0.02, 0.07, [0.9, 0.7, 0.2]); break;
      case 'phone': g.box(-0.02, -0.01, -0.05, 0.02, 0.01, 0.05, [0.2, 0.2, 0.25]); break;
      case 'bottle': g.cyl(0, 0, -0.08, 0.06, 0.025, 0.025, 6, [0.95, 0.95, 1]); g.cyl(0, 0, 0.06, 0.09, 0.02, 0.01, 5, [0.9, 0.7, 0.5]); break;
      case 'knife': g.box(-0.005, -0.01, -0.05, 0.005, 0.01, 0.12, [0.8, 0.82, 0.86]); break;
      case 'pan': g.cyl(0, 0.12, -0.02, 0.02, 0.1, 0.11, 8, [0.2, 0.2, 0.22]); g.beam([0, 0, 0], [0, 0.04, 0], 0.01, [0.2, 0.2, 0.2]); break;
      case 'brush': g.box(-0.008, -0.008, -0.03, 0.008, 0.008, 0.12, [0.7, 0.5, 0.3]); g.box(-0.012, -0.012, 0.12, 0.012, 0.012, 0.16, [0.2, 0.3, 0.8]); break;
      case 'rod': g.beam([0, 0, 0], [0, 0.9, 0.9], 0.012, [0.35, 0.25, 0.15]); g.beam([0, 0.9, 0.9], [0, 1.4, -0.9], 0.003, [0.9, 0.9, 0.9]); break;
      case 'guitar': g.sphere(0.02, 0.08, -0.05, 0.14, 0.05, 0.16, 8, 4, [0.78, 0.45, 0.16]); g.box(-0.02, 0.06, 0.05, 0.02, 0.1, 0.5, [0.25, 0.15, 0.08]); break;
      case 'baby': g.sphere(0, 0.05, 0, 0.1, 0.09, 0.16, 8, 5, [0.85, 0.9, 1]); g.sphere(0, 0.05, 0.17, 0.07, 0.07, 0.07, 6, 4, [0.95, 0.8, 0.7]); break;
      case 'bag': g.sphere(0, 0, -0.15, 0.13, 0.13, 0.16, 6, 4, [0.12, 0.12, 0.14]); break;
      case 'mop': g.beam([0, 0, 0.5], [0, 0.1, -0.8], 0.012, [0.6, 0.45, 0.3]); g.sphere(0, 0.1, -0.85, 0.1, 0.1, 0.05, 6, 3, [0.85, 0.85, 0.8]); break;
      case 'wrench': g.box(-0.01, -0.01, -0.02, 0.01, 0.01, 0.16, [0.7, 0.72, 0.76]); break;
      case 'sponge': g.box(-0.04, -0.02, -0.02, 0.04, 0.02, 0.02, [0.95, 0.85, 0.3]); break;
      case 'can': g.cyl(0, 0.05, -0.1, 0.05, 0.06, 0.06, 6, [0.3, 0.6, 0.35]); g.beam([0, 0.1, 0], [0, 0.22, 0.05], 0.01, [0.3, 0.6, 0.35]); break;
      case 'scythe': g.beam([0, 0, -0.9], [0, 0, 0.9], 0.02, [0.3, 0.22, 0.15]); g.beam([0, 0, 0.9], [0, 0.55, 0.75], 0.02, [0.8, 0.82, 0.86]); break;
      case 'hose': g.beam([0, 0, 0], [0, 0.4, 0], 0.03, [0.8, 0.15, 0.1]); break;
      case 'toy': g.box(-0.05, -0.05, -0.05, 0.05, 0.05, 0.05, [0.9, 0.3, 0.2]); break;
      case 'pizza': g.box(-0.18, -0.18, -0.03, 0.18, 0.18, 0.02, [0.85, 0.8, 0.7]); break;
      case 'ring': g.box(-0.03, -0.03, -0.03, 0.03, 0.03, 0.03, [0.9, 0.2, 0.3]); g.sphere(0, 0, 0.04, 0.012, 0.012, 0.012, 4, 3, [0.9, 0.95, 1], { e: 0.8 }); break;
      case 'diaper': g.box(-0.05, -0.03, -0.05, 0.05, 0.03, 0.05, W); break;
      default: g.box(-0.04, -0.04, -0.04, 0.04, 0.04, 0.04, W);
    }
    PROPS[key] = g.toArray();
    return PROPS[key];
  }

  const s = Math.sin;
  function base() { return { z: 0, lie: 0, pitch: 0, roll: 0, lean: 0, tw: 0, hp: 0, hy: 0, aL: [0, 0.08, 0.15], aR: [0, 0.08, 0.15], lL: [0, 0, 0], lR: [0, 0, 0], sit: 0, yaw: 0 }; }
  function walkPose(P, ph, amp, run) {
    P.lL = [amp * s(ph), 0.02, -Math.max(0, s(ph + 1.2)) * amp * 1.4 - 0.05];
    P.lR = [-amp * s(ph), 0.02, -Math.max(0, s(ph + 1.2 + PI)) * amp * 1.4 - 0.05];
    P.aL = [-amp * 0.8 * s(ph), 0.1, run ? 1.3 : 0.25];
    P.aR = [amp * 0.8 * s(ph), 0.1, run ? 1.3 : 0.25];
    P.bob = Math.abs(s(ph)) * (run ? 0.05 : 0.025);
    P.lean = run ? 0.18 : 0.03;
  }
  function sitPose(P) { P.sit = 1; P.lL = [1.5, 0.06, -1.5]; P.lR = [1.5, 0.06, -1.5]; P.aL = [0.35, 0.05, 0.6]; P.aR = [0.35, 0.05, 0.6]; }
  function armsForward(P, pitch, elbow) { P.aL = [pitch, -0.05, elbow]; P.aR = [pitch, -0.05, elbow]; }

  const ANIMS = {
    idle: (P, t) => { P.lean = 0.02 * s(t * 1.4); P.hy = 0.15 * s(t * 0.3); P.aL[0] = 0.04 * s(t * 1.4); P.aR[0] = 0.04 * s(t * 1.4 + 1); },
    walk: (P, t, sim) => walkPose(P, sim._ph || 0, 0.5, false),
    run: (P, t, sim) => walkPose(P, sim._ph || 0, 0.85, true),
    sit: (P, t) => { sitPose(P); P.lean = -0.08; P.hy = 0.2 * s(t * 0.25); },
    sit_watch: (P, t) => { sitPose(P); P.lean = -0.14; P.aL = [0.3, 0.2, 0.5]; P.aR = [0.3, 0.2, 0.5]; },
    sit_eat: (P, t) => { sitPose(P); P.lean = 0.12; P.aL = [0.9, -0.1, 0.9]; const k = Math.max(0, s(t * 1.6)); P.aR = [0.9 + k * 0.6, -0.15, 0.9 + k * 1.1]; P.prop = 'fork'; P.hp = 0.15; },
    sit_type: (P, t) => { sitPose(P); P.lean = 0.12; armsForward(P, 0.95, 0.95); P.aL[0] += 0.04 * s(t * 14); P.aR[0] += 0.04 * s(t * 13 + 1); P.hp = 0.05; },
    sit_read: (P, t) => { sitPose(P); P.lean = -0.02; armsForward(P, 0.7, 1.5); P.hp = 0.3; },
    sit_write: (P, t) => { sitPose(P); P.lean = 0.25; P.aL = [0.8, -0.1, 1.1]; P.aR = [0.85 + 0.05 * s(t * 8), -0.1, 1.2]; P.hp = 0.35; },
    sit_talk: (P, t) => { sitPose(P); P.aR = [0.6 + 0.2 * s(t * 3), 0.1, 1.0]; },
    chess: (P, t) => { sitPose(P); P.lean = 0.2; P.aL = [0.5, 0, 0.9]; const k = Math.max(0, s(t * 0.9) - 0.7) * 3; P.aR = [0.5 + k * 0.5, -0.1, 0.9]; P.hp = 0.3; },
    toilet: (P, t) => { sitPose(P); P.lean = 0.15; P.aL = [0.5, 0, 1.2]; P.aR = [0.5, 0, 1.2]; },
    lie: (P) => { P.lie = 1; P.aL = [0.1, 0.25, 0.2]; P.aR = [0.1, 0.25, 0.2]; P.hp = 0; },
    lie_awake: (P, t) => { P.lie = 1; P.aL = [2.6, 0.4, 1.8]; P.aR = [2.6, 0.4, 1.8]; P.hy = 0.2 * s(t * 0.4); },
    nap: (P) => { P.lie = 1; P.aL = [0.1, 0.25, 0.2]; P.aR = [0.3, 0.2, 1.2]; },
    pass_out: (P) => { P.lie = 2; P.aL = [2.9, 0.3, 0.2]; P.aR = [0.2, 0.6, 0.3]; P.lL = [0.1, 0.1, -0.3]; },
    dead: (P) => { P.lie = 1; P.aL = [0.1, 0.8, 0.1]; P.aR = [0.1, 0.8, 0.1]; },
    bath: (P) => { P.lie = 3; P.aL = [0.2, 0.2, 0.3]; P.aR = [0.2, 0.2, 0.3]; P.lL = [0.2, 0, -0.4]; P.lR = [0.2, 0, -0.4]; },
    woohoo: (P, t) => { P.lie = 1; P.aL = [2.2, 0.2, 1.2]; P.aR = [2.2, 0.2, 1.2]; P.bob = 0.03 * s(t * 5); },
    bench: (P, t) => { P.lie = 4; const k = (s(t * 2.5) + 1) / 2; P.aL = [PI / 2, 0.3, 1.6 * (1 - k)]; P.aR = [PI / 2, 0.3, 1.6 * (1 - k)]; P.lL = [1.4, 0.2, -1.5]; P.lR = [1.4, 0.2, -1.5]; },
    shower: (P, t) => { P.aL = [2.4 + 0.2 * s(t * 5), 0.3, 1.8]; P.aR = [2.3 + 0.2 * s(t * 5 + 1), 0.3, 1.9]; P.hp = -0.2; },
    stand_chop: (P, t) => { P.lean = 0.15; P.aL = [0.9, -0.1, 1.0]; const k = Math.abs(s(t * 7)); P.aR = [0.9 + k * 0.3, -0.1, 1.1 - k * 0.3]; P.hp = 0.4; },
    stand_cook: (P, t) => { P.lean = 0.12; P.aL = [0.7, -0.15, 1.1]; P.aR = [0.95 + 0.12 * s(t * 4), -0.05 + 0.12 * Math.cos(t * 4), 1.0]; P.hp = 0.35; },
    stand_wash: (P, t) => { P.lean = 0.2; P.aL = [0.8 + 0.1 * s(t * 5), -0.1, 1.1]; P.aR = [0.8 + 0.1 * s(t * 5 + 2), -0.1, 1.1]; P.hp = 0.45; },
    fridge: (P, t) => { P.aR = [1.35, 0, 0.3]; P.aL = [0.3, 0.1, 0.4]; P.hp = -0.05; },
    reach: (P, t) => { P.lean = 0.1; P.aR = [1.2, 0, 0.3]; },
    drink: (P, t) => { const k = Math.max(0, s(t * 1.2)); P.aR = [0.8 + k * 0.7, -0.2, 1.4 + k * 0.6]; P.prop = 'cup'; P.hp = -k * 0.3; },
    eat_stand: (P, t) => { P.aL = [0.8, -0.2, 1.3]; const k = Math.max(0, s(t * 1.6)); P.aR = [0.8 + k * 0.5, -0.2, 1.2 + k * 0.8]; },
    brush: (P, t) => { P.aR = [1.2, -0.3, 2.1 + 0.15 * s(t * 18)]; P.hp = 0.1; },
    mirror: (P, t) => { P.aR = [0.7 + 0.3 * s(t * 2.2), 0.2, 1.0]; P.aL = [0.5 + 0.2 * s(t * 1.7), 0.2, 0.9]; P.hy = 0.1 * s(t * 1.3); },
    look: (P, t) => { P.hp = -0.1; P.aL = [0.1, 0.1, 0.4]; P.aR = [0.2, 0.1, 1.9]; },
    watch: (P, t) => { P.aL = [0.1, 0.1, 0.3]; P.aR = [0.1, 0.1, 0.3]; P.hp = -0.05; },
    listen: (P, t) => { P.hy = 0.1 * s(t * 1.5); P.lean = 0.03 * s(t * 2); P.aL = [0.05, 0.1, 0.3]; P.aR = [0.05, 0.1, 0.3]; },
    dance: (P, t) => { const b = s(t * 6); P.bob = Math.abs(b) * 0.06; P.tw = 0.25 * s(t * 3); P.aL = [1.4 + 0.8 * b, 0.4, 1.0]; P.aR = [1.4 - 0.8 * b, 0.4, 1.0]; P.lL = [0.2 * b, 0.05, -0.3]; P.lR = [-0.2 * b, 0.05, -0.3]; P.hy = 0.3 * s(t * 3); },
    workout: (P, t) => { const k = (s(t * 5) + 1) / 2; P.bob = k * 0.1; P.aL = [0, 0.3 + k * 2.5, 0.1]; P.aR = [0, 0.3 + k * 2.5, 0.1]; P.lL = [0, 0.05 + k * 0.25, 0]; P.lR = [0, 0.05 + k * 0.25, 0]; },
    treadmill: (P, t) => walkPose(P, t * 9, 0.8, true),
    paint: (P, t) => { P.aL = [0.6, 0.2, 1.4]; P.aR = [1.3 + 0.2 * s(t * 3), -0.1 + 0.2 * Math.cos(t * 3), 0.5]; P.hp = 0.05; P.prop = 'brush'; },
    guitar: (P, t) => { P.aL = [1.0, 0.5, 1.2]; P.aR = [0.6, -0.3, 1.5 + 0.15 * s(t * 10)]; P.hp = 0.2; P.bob = Math.abs(s(t * 3)) * 0.015; P.prop = 'guitar'; },
    telescope: (P, t) => { P.lean = 0.35; P.hp = 0.1; P.aL = [1.0, 0, 0.9]; P.aR = [1.0, 0, 0.9]; },
    throw: (P, t) => { P.aR = [1.8 * Math.max(0, s(t * 3)), -0.2, 0.3]; },
    toddler_play: (P, t) => { P.sit = 2; P.lL = [1.5, 0.3, 0]; P.lR = [1.5, 0.3, 0]; P.aL = [0.8 + 0.4 * s(t * 4), 0.1, 0.4]; P.aR = [0.8 + 0.4 * s(t * 4 + 2), 0.1, 0.4]; },
    play_floor: (P, t) => { P.sit = 2; P.lL = [1.5, 0.35, -0.2]; P.lR = [1.5, 0.35, -0.2]; P.aL = [0.9 + 0.3 * s(t * 3), 0.1, 0.6]; P.aR = [0.9 + 0.3 * s(t * 3 + 1), 0.1, 0.6]; P.hp = 0.3; },
    swing: (P, t) => { sitPose(P); P.swing = 0.35 * s(t * 2.2); P.aL = [2.6, 0.1, 0.3]; P.aR = [2.6, 0.1, 0.3]; P.lL = [1.5 + 0.4 * s(t * 2.2), 0.05, -1.2]; P.lR = [1.5 + 0.4 * s(t * 2.2), 0.05, -1.2]; },
    climb: (P, t) => { P.aL = [2.8 + 0.3 * s(t * 4), 0.1, 0.5]; P.aR = [2.8 - 0.3 * s(t * 4), 0.1, 0.5]; P.lL = [0.5 + 0.4 * s(t * 4), 0, -0.8]; P.lR = [0.5 - 0.4 * s(t * 4), 0, -0.8]; P.bob = 0.3 + 0.1 * s(t * 4); },
    clean: (P, t) => { P.lean = 0.45; P.aR = [1.0 + 0.2 * s(t * 6), -0.2 + 0.2 * Math.cos(t * 6), 0.3]; P.aL = [0.4, 0.1, 0.4]; P.hp = 0.4; },
    mop: (P, t) => { P.lean = 0.2; P.aL = [0.7 + 0.2 * s(t * 4), -0.2, 0.9]; P.aR = [0.5 + 0.2 * s(t * 4), -0.2, 0.9]; P.tw = 0.2 * s(t * 4); },
    garden: (P, t) => { P.kneel = 1; P.lean = 0.35; P.aL = [0.9 + 0.2 * s(t * 3), 0, 0.3]; P.aR = [0.9 + 0.2 * s(t * 3 + 1.5), 0, 0.3]; P.hp = 0.5; },
    kneel: (P, t) => { P.kneel = 1; P.aL = [0.6, 0.1, 0.8]; P.aR = [0.9 + 0.2 * s(t * 2), 0.1, 0.7]; },
    kneel_a: (P, t) => ANIMS.kneel(P, t),
    water: (P, t) => { P.aR = [1.2, -0.2, 0.2]; P.aL = [0.2, 0.1, 0.4]; P.hp = 0.3; P.prop = 'can'; },
    repair: (P, t) => { P.kneel = 1; P.lean = 0.3; P.aR = [1.1 + 0.25 * s(t * 7), -0.1, 0.6]; P.aL = [0.9, 0.1, 0.8]; P.hp = 0.4; },
    shock: (P, t) => { P.aL = [1.2 + 0.3 * s(t * 30), 0.9, 0.1]; P.aR = [1.2 + 0.3 * s(t * 31), 0.9, 0.1]; P.bob = 0.05 * Math.abs(s(t * 25)); P.hp = -0.4; },
    fish: (P, t) => { const c = Math.max(0, s(t * 0.6) - 0.85) * 6; P.aL = [0.8 + c, -0.2, 0.9]; P.aR = [0.9 + c, -0.1, 0.8]; P.prop = 'rod'; },
    phone: (P, t) => { P.aR = [0.3, -0.5, 2.5]; P.aL = [0.2 + 0.2 * s(t * 2), 0.2, 0.7]; P.hy = 0.2 * s(t); },
    read_stand: (P, t) => { armsForward(P, 0.8, 1.4); P.hp = 0.35; },
    spin: (P, t) => { P.yaw = t * 18; P.aL = [0, 1.2, 0.2]; P.aR = [0, 1.2, 0.2]; },
    talk: (P, t) => { P.aR = [0.4 + 0.3 * s(t * 3.1), 0.15, 0.9 + 0.3 * s(t * 2.3)]; P.aL = [0.2 + 0.2 * s(t * 2.7 + 1), 0.15, 0.6]; P.hy = 0.1 * s(t * 1.7); P.hp = 0.05 * s(t * 2.9); },
    gesture_a: (P, t) => { P.aR = [0.9 + 0.5 * s(t * 3), 0.4, 0.6]; P.aL = [0.9 + 0.5 * s(t * 3 + 2), 0.4, 0.6]; P.hy = 0.1 * s(t * 2); },
    wave_a: (P, t) => { P.aR = [2.75, 0.35, 0.45 + 0.4 * s(t * 9)]; P.hy = 0.05 * s(t * 2); },
    wave_b: (P, t) => ANIMS.wave_a(P, t),
    funny_a: (P, t) => { P.aL = [0.3, 1.3, 2.4]; P.aR = [0.3, 1.3, 2.4]; P.hy = 0.35 * s(t * 5); P.bob = 0.03 * Math.abs(s(t * 6)); },
    flirt_a: (P, t) => { P.aL = [-0.1, 0.5, 1.9]; P.aR = [0.5 + 0.2 * s(t * 2), 0.1, 1.0]; P.lean = -0.05; P.hy = 0.15; P.hp = 0.1; },
    hug_a: (P, t) => { P.aL = [1.4, -0.5, 1.0]; P.aR = [1.4, -0.5, 1.0]; P.lean = 0.1; },
    hug_b: (P, t) => ANIMS.hug_a(P, t),
    kiss_a: (P, t) => { P.aL = [1.2, -0.4, 1.1]; P.aR = [1.2, -0.4, 1.1]; P.lean = 0.18; P.hp = 0.1; },
    kiss_b: (P, t) => ANIMS.kiss_a(P, t),
    highfive_a: (P, t) => { P.aR = [2.9, -0.2, 0.2]; },
    highfive_b: (P, t) => ANIMS.highfive_a(P, t),
    slap_a: (P, t) => { const k = s(t * 5); P.aR = [1.4, -0.5 + k * 1.3, 0.3]; },
    shove_a: (P, t) => { const k = Math.max(0, s(t * 4)); armsForward(P, 1.4, 1.2 - k * 1.1); P.lean = 0.1 + k * 0.15; },
    argue_a: (P, t) => { P.aL = [0.7 + 0.4 * s(t * 4), 0.7, 0.8]; P.aR = [0.7 + 0.4 * s(t * 4 + 1), 0.7, 0.8]; P.lean = 0.12; P.hp = -0.05; },
    tickle_a: (P, t) => { armsForward(P, 1.2 + 0.2 * s(t * 12), 0.8); P.lean = 0.2; },
    propose_a: (P, t) => { P.kneel = 1; P.aR = [1.3, -0.1, 0.4]; P.prop = 'ring'; P.hp = -0.2; },
    laugh: (P, t) => { P.lean = -0.18 + 0.05 * s(t * 9); P.aL = [0.5, -0.2, 1.3]; P.aR = [0.5, -0.2, 1.3]; P.hp = -0.3; },
    blush: (P, t) => { P.aL = [1.1, -0.4, 2.2]; P.aR = [1.1, -0.4, 2.2]; P.hp = 0.25; P.tw = 0.1 * s(t * 2); },
    swim: (P, t) => { P.aL = [1.3 + 0.45 * s(t * 4), 0.9, 0.5]; P.aR = [1.3 + 0.45 * s(t * 4 + PI), 0.9, 0.5]; P.lL = [0.35 * s(t * 6), 0.05, -0.35]; P.lR = [-0.35 * s(t * 6), 0.05, -0.35]; P.lean = 0.22; P.bob = 0.03 * s(t * 3); },
    cheer: (P, t) => { P.aL = [3.0, 0.3, 0.2]; P.aR = [3.0, 0.3, 0.2]; P.bob = Math.abs(s(t * 7)) * 0.08; },
    angry: (P, t) => { P.aL = [0.5, 0.4, 1.7 + 0.2 * s(t * 9)]; P.aR = [0.5, 0.4, 1.7 + 0.2 * s(t * 9 + 1)]; P.lean = 0.1; P.hp = 0.1; },
    hurt: (P, t) => { P.lean = -0.2; P.aL = [0.3, 0.6, 0.4]; P.aR = [1.0, -0.3, 2.0]; P.hp = -0.3; },
    reject: (P, t) => { P.aL = [0.8, -0.8, 1.6]; P.aR = [0.8, -0.8, 1.6]; P.lean = -0.1; P.hy = 0.4; },
    shrug: (P, t) => { P.aL = [0.3, 0.6, 1.4]; P.aR = [0.3, 0.6, 1.4]; P.hp = 0.1; },
    annoyed: (P, t) => { P.aL = [-0.2, 0.7, 1.7]; P.aR = [-0.2, 0.7, 1.7]; P.hy = 0.3; },
    embarrassed: (P, t) => { P.aR = [1.2, -0.3, 2.0]; P.hp = 0.4; },
    fight: (P, t) => { P.aL = [1.5 + 0.8 * s(t * 11), 0.4, 1.2]; P.aR = [1.5 + 0.8 * s(t * 12 + 2), 0.4, 1.2]; P.lL = [0.4 * s(t * 9), 0.2, -0.2]; P.bob = Math.abs(s(t * 8)) * 0.1; P.tw = 0.4 * s(t * 7); },
    panic: (P, t) => { P.aL = [2.6 + 0.4 * s(t * 12), 0.4, 0.3]; P.aR = [2.6 + 0.4 * s(t * 13), 0.4, 0.3]; P.bob = Math.abs(s(t * 10)) * 0.08; P.hy = 0.4 * s(t * 5); },
    cry: (P, t) => { P.aL = [1.2, -0.4, 2.1]; P.aR = [1.2, -0.4, 2.1]; P.hp = 0.35 + 0.05 * s(t * 8); P.lean = 0.1; },
    evil_laugh: (P, t) => { P.aL = [1.7, 0.6, 1.5]; P.aR = [1.7, 0.6, 1.5]; P.lean = -0.25 + 0.05 * s(t * 10); P.hp = -0.4; },
    feed: (P, t) => { P.aL = [0.8, -0.3, 1.5]; P.aR = [1.1, -0.1, 1.1 + 0.1 * s(t * 3)]; P.prop = 'bottle'; P.hp = 0.3; },
    rock: (P, t) => { P.aL = [0.9, -0.3, 1.5]; P.aR = [0.9, -0.3, 1.5]; P.tw = 0.2 * s(t * 1.6); P.hp = 0.3; },
    carry: (P, t) => { P.aL = [0.9, -0.3, 1.5]; P.aR = [0.9, -0.3, 1.5]; },
    reap: (P, t) => { P.aL = [1.2, 0.2, 0.9]; P.aR = [1.0 + 0.5 * s(t * 1.5), -0.2, 0.9]; P.prop = 'scythe'; },
    extinguish: (P, t) => { armsForward(P, 1.3, 0.5); P.tw = 0.2 * s(t * 2); P.prop = 'hose'; },
    steal: (P, t) => { P.kneel = 0.5; P.lean = 0.3; P.aR = [1.1 + 0.2 * s(t * 3), -0.2, 0.5]; P.hy = 0.5 * s(t * 1.2); },
    ghost: (P, t) => { P.bob = 0.25 + 0.1 * s(t * 1.5); P.aL = [0.4, 0.5, 0.3]; P.aR = [0.4, 0.5, 0.3]; P.lL = [0.2, 0, -0.3]; P.lR = [0.3, 0, -0.4]; },
    toddle: (P, t, sim) => walkPose(P, sim._ph || 0, 0.35, false),
    baby: (P, t) => { P.lie = 1; P.aL = [1.5 + 0.2 * s(t * 3), 0.3, 1.0]; P.aR = [1.5 + 0.2 * s(t * 3 + 1), 0.3, 1.0]; P.lL = [0.8, 0.2, -1.0]; P.lR = [0.8, 0.2, -1.0]; },
    baby_crib: (P, t) => ANIMS.baby(P, t),
    baby_held: (P, t) => { P.held = 1; P.aL = [1.2, 0.2, 1.0]; P.aR = [1.2, 0.2, 1.0]; P.lL = [0.9, 0.2, -0.8]; P.lR = [0.9, 0.2, -0.8]; }
  };
  const ALIASES = { sit_eat: 'sit_eat' };

  function poseOf(sim, rt, game) {
    const P = base();
    let name = sim.anim || 'idle';
    if (sim.engage && sim.engage.anim && !sim.seatOf && !sim.lieH) name = sim.engage.anim;
    if (sim.carriedBy) name = 'baby_held';
    else if (sim.isBaby) name = sim.anim === 'baby_crib' || sim.inCrib ? 'baby_crib' : 'baby';
    if (sim.ghost) name = 'ghost';
    if (name === 'walk' && sim.isToddler) name = 'toddle';
    if (sim.carry && (name === 'idle' || name === 'walk' || name === 'listen' || name === 'talk')) { const f = ANIMS[name] || ANIMS.idle; f(P, rt + (sim.id % 7), sim); ANIMS.carry(P, rt); P.prop = 'baby_carry'; return P; }
    const f = ANIMS[name] || (name.endsWith('_a') || name.endsWith('_b') ? ANIMS.talk : ANIMS.idle);
    f(P, rt + (sim.id % 7) * 0.7, sim);
    if (sim.age === 'elder' && !P.lie) { P.lean += 0.12; P.hp -= 0.08; }
    if (!P.prop && sim.prop && sim.prop !== 'baby') P.prop = sim.prop;
    return P;
  }

  function emitSim(dyn, sim, rt, atlas, opt) {
    opt = opt || {};
    const key = [sim.age, sim.gender, sim.outfit, sim.look && sim.look.hair, sim.look && sim.look.hairC, sim.look && sim.look.skin, JSON.stringify(sim.outfit === 'work' && sim.job ? sim.job.c : sim.look && sim.look.outfits && sim.look.outfits[sim.outfit] || ''), sim.preg ? Math.floor(Math.min(3, (S._gameT - sim.preg.t) / 1440)) : -1, sim.look && sim.look.fat].join('|');
    if (!sim._body || sim._body.key !== key) sim._body = { key, parts: buildParts(sim, atlas) };
    const parts = sim._body.parts;
    const d = dims(sim);
    const k = d.k;
    const P = opt.pose || poseOf(sim, rt, null);
    const hipH = 0.93;
    let root;
    const yaw = (opt.yaw !== undefined ? opt.yaw : sim.face) - PI / 2 + (P.yaw || 0);
    const x = opt.x !== undefined ? opt.x : sim.x, y = opt.y !== undefined ? opt.y : sim.y;
    const baseZ = opt.z || 0;
    if (P.lie) {
      const lieH = sim.lieH || (P.lie === 2 ? 0.02 : 0.02);
      const fx = Math.cos(yaw + PI / 2), fy = Math.sin(yaw + PI / 2);
      if (P.lie === 3) root = chain(T(x + fx * hipH * k * 0.55, y + fy * hipH * k * 0.55, baseZ + lieH + 0.12 * k), RZ(yaw), RX(PI * 0.32));
      else if (P.lie === 4) root = chain(T(x - fx * 0.2, y - fy * 0.2, baseZ + (sim.lieH || 0.45) + 0.1), RZ(yaw), RX(PI / 2), T(0, 0, -hipH * k));
      else if (P.lie === 2) root = chain(T(x + fx * hipH * k, y + fy * hipH * k, baseZ + lieH + 0.1 * k), RZ(yaw), RX(-PI / 2), RY(0.2));
      else root = chain(T(x + fx * hipH * k * 0.95, y + fy * hipH * k * 0.95, baseZ + lieH + 0.11 * k + (P.bob || 0)), RZ(yaw), RX(PI / 2));
    } else if (P.held) {
      root = chain(T(x, y, baseZ + (opt.heldZ || 1.0)), RZ(yaw), RX(PI * 0.42), T(0, 0, -hipH * k * 0.6));
    } else {
      let z = baseZ + (P.bob || 0);
      if (P.sit === 1) z += (sim.sitH || 0.45) + 0.08 * k - hipH * k;
      if (P.sit === 2) z += 0.09 * k - hipH * k;
      if (P.kneel) z -= 0.38 * k * P.kneel;
      root = chain(T(x, y, z), RZ(yaw));
      if (P.swing) root = chain(root, T(0, P.swing * 0.6, 0), RX(P.swing * 0.4));
    }
    const S_ = [k, 0, 0, 0, 0, k, 0, 0, 0, 0, k, 0, 0, 0, 0, 1];
    const pelvis = chain(root, T(0, 0, hipH * k), RX(P.pitch || 0), RY(P.roll || 0));
    const pelvisS = mul(pelvis, S_);
    const torso = chain(pelvisS, RX(P.lean || 0), RZ(P.tw || 0));
    const hs = d.head;
    const neck = chain(torso, T(0, 0, 0.5));
    const headM = chain(neck, T(0, 0, 0.07), RZ(P.hy || 0), RX(-(P.hp || 0)), [hs, 0, 0, 0, 0, hs, 0, 0, 0, 0, hs, 0, 0, 0, 0, 1]);
    const out = [];
    out.push([parts.pelvis, pelvisS]);
    out.push([parts.torso, torso]);
    out.push([parts.neck, neck]);
    out.push([parts.head, headM]);
    const shW = d.f ? 0.18 : 0.205;
    let handR = null, handL = null;
    for (const side of ['L', 'R']) {
      const sg = side === 'L' ? -1 : 1;
      const a = side === 'L' ? P.aL : P.aR;
      const sh = chain(torso, T(sg * shW, 0, 0.47), RX(a[0]), RY(-sg * a[1]));
      const el = chain(sh, T(0, 0, -0.28), RX(a[2]));
      out.push([parts['ua' + side], sh]);
      out.push([parts['fa' + side], el]);
      const hand = chain(el, T(0, 0.02, -0.29));
      if (side === 'R') handR = hand; else handL = hand;
      const l = side === 'L' ? P.lL : P.lR;
      let hp = l[0], kn = l[2];
      if (P.kneel) { if (side === 'L') { hp = 1.55; kn = -1.55; } else { hp = -0.2; kn = -1.5; } }
      const hip = chain(pelvisS, T(sg * 0.095, 0, -0.04), RX(hp), RY(-sg * l[1]));
      const knee = chain(hip, T(0, 0, -0.44), RX(kn));
      out.push([parts['th' + side], hip]);
      out.push([parts['sh' + side], knee]);
    }
    for (const [arr, m] of out) pushXform(dyn, arr, m, opt.tint, opt.alpha);
    if (P.prop && P.prop !== 'baby_carry' && handR) {
      const pk = P.prop === 'fork' ? 'plate' : P.prop;
      const arr = propGeo(pk, atlas);
      let m = chain(handR, RX(-PI / 2));
      if (pk === 'guitar') m = chain(torso, T(0.02, 0.16, 0.2), RY(-1.0));
      if (pk === 'baby') m = chain(torso, T(0, 0.2, 0.25), RX(PI * 0.45));
      if (pk === 'rod') m = chain(handR, RX(-PI * 0.2));
      if (pk === 'scythe') m = chain(handR, RX(-0.3));
      pushXform(dyn, arr, m, opt.tint, opt.alpha);
    }
    const headTop = [headM[12] + headM[8] * 0.3, headM[13] + headM[9] * 0.3, headM[14] + headM[10] * 0.3];
    return { head: headTop, hand: handR ? [handR[12], handR[13], handR[14]] : [x, y, 1], torso: [torso[12], torso[13], torso[14]], carryPos: [torso[12] + torso[4] * 0.3, torso[13] + torso[5] * 0.3, torso[14] + 0.2 * k], k };
  }

  function pushXform(dyn, arr, m, tint, alpha) {
    const out = dyn.data;
    for (let i = 0; i < arr.length; i += 12) {
      const x = arr[i], y = arr[i + 1], z = arr[i + 2], nx = arr[i + 3], ny = arr[i + 4], nz = arr[i + 5];
      out.push(m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14],
        m[0] * nx + m[4] * ny + m[8] * nz, m[1] * nx + m[5] * ny + m[9] * nz, m[2] * nx + m[6] * ny + m[10] * nz,
        tint ? arr[i + 6] * tint[0] : arr[i + 6], tint ? arr[i + 7] * tint[1] : arr[i + 7], tint ? arr[i + 8] * tint[2] : arr[i + 8], alpha !== undefined ? alpha : arr[i + 9], arr[i + 10], arr[i + 11]);
    }
  }

  Object.assign(S, { emitSim, poseOf, ANIMS, outfitOf, propGeo, buildSimParts: buildParts, mat4: { mul, T, RX, RY, RZ, chain }, pushXform });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
