(function (H) {
  'use strict';
  const G = H.Gfx;
  const { fine, star4, slab, thick } = G.iconHelp;
  const D = (c, k) => G.dark(c, k), L = (c, k) => G.light(c, k);

  const PB = { cloth: '#1f2231', cloth2: '#33384e', slate: '#4a5274', slateHi: '#7880a4', red: '#8e3a32', orange: '#e85a24', cream: '#e4d8b8', gold: '#c8a656', navy: '#2a3266', pin: '#b4c2dc' };
  const MK = { lea: '#8e6450', dark: '#5a3a2e', hi: '#b48a70', deep: '#3a2420', teal: '#38c4c0', wheat: '#ecc454', silver: '#c8ccd6', cream: '#ece0c4' };
  const KN = { white: '#f2efe8', silver: '#d6d1c6', shade: '#b4aa96', dark: '#6e6658', gold: '#e2bc52', goldD: '#9a7a30', red: '#d0342a' };
  const TH = { cob: '#2440a8', cobD: '#142672', white: '#f6f4f0', whiteS: '#c4c8da', pink: '#ff4c9c', gold: '#e8c050', black: '#1c1c26' };
  const FS = { plum: '#5e3038', plumD: '#2e161c', cop: '#d48c68', copD: '#8a4a36', copHi: '#f8cca4', red: '#d0402c', redD: '#8a1e14', orange: '#f49034', lens: '#3a0c12' };
  const GL = { fur: '#f6f0e6', furS: '#c6c2d6', navy: '#1f1e3c', blue: '#3a5ccc', gold: '#e2ba4c', ivory: '#f2e4c2', lilac: '#8884a4', mesh: '#dce6f6' };
  const mir = pts => pts.map((v, i) => i % 2 ? v : 32 - v);
  const BD = { vio: '#4c2eb4', vioD: '#2a1672', vioL: '#8c68dc', lav: '#cacef0', white: '#f6f6fc', flame: '#ffe070', silver: '#c6cae0' };
  const EG = { sil: '#9c9eb6', silD: '#5c5e78', silL: '#d6d8e6', white: '#fbf9f4', peri: '#6a62a4', periL: '#8c86c4', tan: '#c8a088', tanD: '#8a6a58', gold: '#e2c272', fA: '#f8c890', fB: '#f0a0b8', fC: '#6a72cc' };
  const GN = { white: '#eef8fc', whiteS: '#b6c6d8', cyan: '#1ce4fa', cyanD: '#0a94c4', cyanL: '#b0faff', grey: '#4c505c', bronze: '#bc8a5c', vio: '#7a6ae8' };

  const WL = { kh: '#bca98d', khD: '#857560', dark: '#2a2420', rust: '#6a4a3a', red: '#c83a32', gold: '#d8b050', teal: '#40d0c8', cream: '#ece2cc', pink: '#d86a78', brass: '#c89a50' };
  const CH = { black: '#201a1a', blackL: '#3e3434', white: '#f8f6f2', whiteS: '#c6c2ba', gold: '#dcc492', goldD: '#9a846a' };

  function sun(p, x, y, r, col) {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.2, c = Math.cos(a), s = Math.sin(a); p.poly(col, [x + c * r * 0.6 - s * r * 0.22, y + s * r * 0.6 + c * r * 0.22, x + c * r * 1.15, y + s * r * 1.15, x + c * r * 0.6 + s * r * 0.22, y + s * r * 0.6 - c * r * 0.22]); }
    p.ell(col, x, y, r * 0.66, r * 0.66);
    p.ell(CH.white, x, y, r * 0.4, r * 0.4);
    p.ell(col, x, y, r * 0.2, r * 0.2);
  }

  function dots(p, col, x0, y0, x1, y1, step) { fine(p, () => { for (let y = y0; y <= y1; y += step) for (let x = x0 + ((y - y0) / step % 2) * step / 2; x <= x1; x += step) p.ell(col, x, y, 0.45, 0.45); }); }

  function championBoot(p, x, y, dark) {
    const c = dark ? CH.blackL : CH.black;
    p.poly(c, [x, y, x + 7.6, y, x + 8, y + 18, x + 13.6, y + 20, x + 14.4, y + 23.6, x, y + 23.6]);
    p.poly(L(c, 0.12), [x, y, x + 2.4, y, x + 2.4, y + 21, x, y + 21]);
    fine(p, () => { for (let i = 0; i < 6; i++) { p.poly(CH.gold, slab(x + 2.4, y + 1.6 + i * 2.8, x + 6.6, y + 3.6 + i * 2.8, 0.35)); p.poly(CH.gold, slab(x + 6.6, y + 1.6 + i * 2.8, x + 2.4, y + 3.6 + i * 2.8, 0.35)); } });
    if (p.u < 0.99) p.rect(CH.gold, x + 4, y + 1, 1.2, 16);
    p.poly(dark ? CH.whiteS : CH.white, [x + 3, y + 23.6, x + 9, y + 19.6, x + 13.6, y + 20, x + 14.4, y + 23.6]);
    p.rect(CH.white, x, y + 23, 14.4, 1.2);
  }

  function wastelandGreave(p, x, y, dark) {
    const k = dark ? WL.khD : WL.kh, c = dark ? WL.khD : WL.cream;
    p.poly(D(k, 0.2), [x + 1, y + 6, x + 10, y + 6, x + 10.6, y + 20, x + 15.6, y + 21.4, x + 16, y + 25, x, y + 25]);
    p.poly(c, [x + 1, y + 6, x + 9.4, y + 6, x + 9.6, y + 19, x + 15, y + 21, x + 15.4, y + 24, x + 1, y + 24]);
    p.ell(k, x + 5.4, y + 7.6, 6.2, 5);
    p.ell(L(k, 0.25), x + 4, y + 6.2, 3, 2);
    p.poly(WL.red, [x + 9.4, y + 4.6, x + 14.6, y + 0.6, x + 11.4, y + 7.4]);
    p.poly(WL.gold, [x + 9.6, y + 12, x + 11.6, y + 12, x + 11.6, y + 19, x + 9.6, y + 19]);
    p.rect(WL.dark, x + 1, y + 23.6, 15, 1.4);
    p.poly(WL.red, [x + 15.4, y + 21.6, x + 18.4, y + 21, x + 15.8, y + 23.6]);
  }

  const PL = { st: '#353164', stM: '#5a4c94', stL: '#9a8cd0', stP: '#c8b0ec', vo: '#2e8a8a', voL: '#78d4cc', isl: '#4e8a52', islL: '#8ab478', sea: '#1e5c6c', sa: '#3d365c', saL: '#8697c2', sun: '#f4a060', sunL: '#fde0c0', gold: '#e8c07a', pink: '#f0a8b8', silver: '#d6d8e8', silD: '#8c8ea8', lav: '#a89cc0', sand: '#e3cca5', sandD: '#a88a62', blue: '#3a5a9c', shell: '#f6f2ea' };

  function curve(pts, n) {
    const out = [];
    for (let i = 0; i + 2 < pts.length; i += 2) {
      const p0 = i ? [(pts[i - 2] + pts[i]) / 2, (pts[i - 1] + pts[i + 1]) / 2] : [pts[0], pts[1]];
      const p2 = i + 4 < pts.length ? [(pts[i] + pts[i + 2]) / 2, (pts[i + 1] + pts[i + 3]) / 2] : [pts[i + 2], pts[i + 3]];
      const c = i ? [pts[i], pts[i + 1]] : [(pts[0] + pts[2]) / 2, (pts[1] + pts[3]) / 2];
      for (let k = 0; k < n; k++) { const t = k / n; out.push((1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p2[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p2[1]); }
    }
    out.push(pts[pts.length - 2], pts[pts.length - 1]);
    return out;
  }

  function orb(p, cx, cy, r, base, rim, inner) {
    p.ell(rim, cx + 0.6, cy + 0.8, r + 0.8, r + 0.8);
    p.ell(base, cx, cy, r, r);
    const disc = [];
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; disc.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    p.clipPoly(disc, inner);
    p.clipPoly(disc, () => { p.ell('#ffffff', cx - r * 0.42, cy - r * 0.5, r * 0.36, r * 0.16, -0.7); fine(p, () => p.ell('#ffffff', cx + r * 0.5, cy + r * 0.56, r * 0.18, r * 0.08, -0.7)); });
  }

  function arcPoly(cx, cy, rx0, ry0, rx1, ry1, a0, a1, n) {
    const pts = [], k = n || 12;
    for (let i = 0; i <= k; i++) { const a = (a0 + (a1 - a0) * i / k) * Math.PI / 180; pts.push(cx + Math.cos(a) * rx1, cy + Math.sin(a) * ry1); }
    for (let i = k; i >= 0; i--) { const a = (a0 + (a1 - a0) * i / k) * Math.PI / 180; pts.push(cx + Math.cos(a) * rx0, cy + Math.sin(a) * ry0); }
    return pts;
  }

  function feather(p, x0, y0, x1, y1, w) {
    const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, nx = -uy * w, ny = ux * w;
    const at = t => [x0 + ux * len * t, y0 + uy * len * t];
    const leaf = (t0, t1, col) => { const [ax, ay] = at(t0), [bx, by] = at(t1), [mx, my] = at((t0 + t1) / 2), sw = Math.sin(Math.PI * Math.min(0.92, (t0 + t1) / 2)); p.poly(col, [ax, ay, mx + nx * sw, my + ny * sw, bx, by, mx - nx * sw, my - ny * sw]); };
    p.poly(D(EG.fC, 0.35), [x0, y0, x0 + ux * len * 0.5 + nx * 1.2, y0 + uy * len * 0.5 + ny * 1.2, x1, y1, x0 + ux * len * 0.5 - nx * 1.2, y0 + uy * len * 0.5 - ny * 1.2]);
    leaf(0, 0.55, EG.fA); leaf(0.3, 0.85, EG.fB); leaf(0.62, 1, EG.fC);
  }

  function bandBoot(p, x, y, dark) {
    const c = dark ? BD.vioD : BD.vio;
    p.poly(c, [x + 1, y + 1, x + 8.6, y + 1, x + 9, y + 13, x + 14.6, y + 15.4, x + 15, y + 19.4, x, y + 19.4]);
    p.poly(D(c, 0.3), [x + 6, y + 1, x + 8.6, y + 1, x + 9, y + 13, x + 6.4, y + 13.6]);
    fine(p, () => { for (let i = 0; i < 4; i++) { p.poly(BD.lav, slab(x + 2, y + 3 + i * 2.6, x + 6.6, y + 5 + i * 2.6, 0.35)); p.poly(BD.lav, slab(x + 6.6, y + 3 + i * 2.6, x + 2, y + 5 + i * 2.6, 0.35)); } });
    if (p.u < 0.99) p.rect(BD.lav, x + 4, y + 2, 1.4, 11);
    p.poly(dark ? BD.silver : BD.white, [x + 8.6, y + 14, x + 14.6, y + 15.4, x + 15.4, y + 19.4, x + 8.4, y + 19.4]);
    p.poly(BD.silver, [x + 11, y + 14.8, x + 14.6, y + 15.6, x + 13, y + 19.4]);
    p.rect(BD.vioL, x - 0.6, y + 19.4, 16.4, 2.6);
    p.rect(BD.vioD, x - 0.6, y + 21.4, 16.4, 1.4);
    p.ell(BD.lav, x + 4.4, y + 1, 2.2, 1.4); p.ell(BD.lav, x + 2, y - 0.6, 1.4, 1.4); p.ell(BD.lav, x + 6.6, y - 0.6, 1.4, 1.4);
  }

  function eagleGaiter(p, x, y, dark) {
    const c = dark ? EG.silD : EG.peri;
    p.poly(c, [x, y + 3, x + 9, y + 3, x + 9.4, y + 17, x + 14.4, y + 19.4, x + 14.8, y + 23, x, y + 23]);
    fine(p, () => { for (let i = 0; i < 3; i++) { p.poly(D(c, 0.3), slab(x, y + 6 + i * 4.4, x + 9, y + 10 + i * 4.4, 0.3)); p.poly(D(c, 0.3), slab(x + 9, y + 6 + i * 4.4, x, y + 10 + i * 4.4, 0.3)); } });
    for (let i = 0; i < 4; i++) p.ell(EG.white, x + 1 + i * 2.6, y + 3, 2, 1.8);
    p.poly(EG.silL, [x + 2.6, y + 7, x + 7, y + 7, x + 7, y + 15, x + 4.8, y + 18.6, x + 2.6, y + 15]);
    p.poly(EG.sil, [x + 4.8, y + 7, x + 7, y + 7, x + 7, y + 15, x + 4.8, y + 18.6]);
    p.poly(EG.tan, slab(x - 0.6, y + 12, x + 10, y + 16.4, 0.9));
    p.rect(D(c, 0.4), x, y + 22, 14.8, 1.4);
  }

  function geniusBoot(p, x, y, dark) {
    const w = dark ? GN.whiteS : GN.white;
    p.poly(w, [x, y + 6, x + 9, y + 6, x + 9.4, y + 12, x + 15.4, y + 13, x + 17.4, y + 17, x + 17.4, y + 21.4, x + 1, y + 21.4, x, y + 18]);
    p.poly(D(w, 0.12), [x + 6, y + 6, x + 9, y + 6, x + 9.4, y + 14, x + 6.6, y + 15]);
    p.poly(GN.cyanD, [x - 0.6, y + 0.4, x + 9.6, y + 0.4, x + 9.6, y + 6.6, x - 0.6, y + 6.6]);
    p.poly(dark ? GN.cyanD : GN.cyan, [x, y + 0.8, x + 9, y + 0.8, x + 9, y + 6, x, y + 6]);
    p.ell(GN.cyanL, x + 4.5, y + 3.4, 2, 2); p.ell(dark ? GN.cyanD : GN.cyan, x + 4.5, y + 3.4, 1.2, 1.2);
    p.poly(GN.bronze, [x + 9.4, y + 14, x + 12, y + 14.8, x + 10.6, y + 17, x + 8.6, y + 16.4]);
    p.rect(GN.vio, x + 1, y + 20.4, 16.4, 1.4);
    p.rect(GN.grey, x + 1, y + 21.6, 16.4, 1.2);
    p.poly(GN.grey, [x + 3, y + 22.8, x + 6, y + 22.8, x + 5, y + 24.4, x + 3.6, y + 24.4]);
    p.poly(GN.grey, [x + 12, y + 22.8, x + 15, y + 22.8, x + 14, y + 24.4, x + 12.6, y + 24.4]);
  }

  function passerbyBoot(p, x, y, c) {
    p.poly(c, [x, y + 2, x + 8, y + 2, x + 8.4, y + 16, x + 14, y + 18, x + 15, y + 22, x, y + 22]);
    p.poly(D(c, 0.35), [x + 5.5, y + 2, x + 8, y + 2, x + 8.4, y + 16, x + 14, y + 18, x + 15, y + 22, x + 5.5, y + 22]);
    p.rect(PB.cloth2, x, y + 20.6, 15, 1.6);
    p.rect(PB.orange, x, y + 13, 8.4, 1.6);
    p.rect(D(PB.orange, 0.25), x + 0.4, y + 16.4, 9.6, 1.4);
    p.poly(PB.gold, [x - 0.6, y + 0.6, x + 8.6, y + 0.6, x + 8.2, y + 5, x + 4, y + 6.6, x - 0.2, y + 5]);
    p.poly(PB.cream, [x - 0.6, y + 0.6, x + 8.6, y + 0.6, x + 8.4, y + 2.2, x - 0.4, y + 2.2]);
    p.ell(PB.red, x + 4, y + 3.8, 1.3, 1.3);
  }

  function musketeerBoot(p, x, y, c, front) {
    p.poly(c, [x, y + 4, x + 8.6, y + 4, x + 8.8, y + 15.6, x + 14.6, y + 17.6, x + 15.6, y + 22, x, y + 22]);
    p.poly(MK.hi, [x + 6.6, y + 16, x + 8.8, y + 15.6, x + 14.6, y + 17.6, x + 15.6, y + 22, x + 9, y + 22]);
    p.poly(D(c, 0.3), [x + 5.8, y + 4, x + 8.6, y + 4, x + 8.8, y + 15.6, x + 6.4, y + 16]);
    p.rect(MK.deep, x, y + 20.8, 15.6, 1.6);
    p.poly(MK.hi, [x - 2.6, y + 4, x + 11.2, y + 4, x + 10.2, y - 0.4, x - 1.6, y - 0.4]);
    for (let i = 0; i < 8; i++) p.poly(i % 2 ? MK.lea : MK.hi, [x - 2.6 + i * 1.75, y + 3.8, x - 1 + i * 1.75, y + 3.8, x - 1.8 + i * 1.75, y + 8.4]);
    if (front) { p.rect(MK.teal, x + 1, y + 8.6, 6.6, 1); p.rect(MK.teal, x + 1, y + 11, 6.6, 1); p.poly(MK.wheat, [x + 4.3, y + 8, x + 5.6, y + 10.2, x + 4.3, y + 12.4, x + 3, y + 10.2]); }
  }

  function thiefBoot(p, x, y, dark) {
    const c = dark ? TH.cobD : TH.cob;
    p.poly(c, [x, y + 3, x + 7.4, y + 3, x + 7.6, y + 17, x, y + 17]);
    p.poly(D(c, 0.3), [x + 5, y + 3, x + 7.4, y + 3, x + 7.6, y + 17, x + 5, y + 17]);
    p.clipPoly([x, y + 3, x + 7.6, y + 3, x + 7.6, y + 17, x, y + 17], () => { p.poly(TH.pink, slab(x - 1, y + 15, x + 9, y + 6, 0.8)); p.poly(TH.pink, slab(x - 1, y + 8, x + 9, y + 15, 0.6)); });
    p.poly(dark ? TH.whiteS : TH.white, [x - 1, y + 0.6, x + 8.4, y + 0.6, x + 8, y + 4.4, x - 0.6, y + 4.4]);
    p.poly(dark ? TH.whiteS : TH.white, [x, y + 17, x + 7.6, y + 17, x + 13.4, y + 20.4, x + 14, y + 23, x + 4, y + 23, x + 2.4, y + 25.6, x + 1, y + 25.6]);
    p.poly(TH.gold, [x + 1, y + 23, x + 2.6, y + 23, x + 2.2, y + 25.6, x + 1, y + 25.6]);
    fine(p, () => { for (const k of [1.4, 4]) p.ell(TH.gold, x + k, y + 2.4, 0.6, 0.6); });
  }

  function hunterBoot(p, x, y, dark) {
    const f = dark ? GL.furS : GL.fur;
    p.poly(f, [x, y + 3, x + 9, y + 3, x + 9.4, y + 18, x + 14, y + 20, x + 14.4, y + 23, x, y + 23]);
    p.poly(GL.navy, [x + 1.6, y + 6, x + 7.6, y + 6, x + 7.6, y + 16.6, x + 1.6, y + 16.6]);
    p.poly(GL.blue, [x + 1.6, y + 6, x + 7.6, y + 6, x + 7.6, y + 7.4, x + 1.6, y + 7.4]);
    p.poly(GL.gold, [x + 3.2, y + 11, x + 4.6, y + 9.6, x + 6, y + 11, x + 6, y + 12.6, x + 4.6, y + 14, x + 3.2, y + 12.6]);
    p.ell(GL.navy, x + 4.6, y + 11.8, 0.8, 0.8);
    for (let i = 0; i < 5; i++) { p.ell(D(f, 0.12), x + 1 + i * 3.2, y + 23.4, 2.4, 1.8); p.ell(f, x + 0.6 + i * 3.2, y + 22.8, 2.2, 1.6); }
    for (let i = 0; i < 4; i++) p.ell(f, x + 0.8 + i * 2.6, y + 3, 1.8, 1.6);
    if (!dark) p.poly(GL.ivory, [x + 9.4, y + 9, x + 11, y + 9.4, x + 10, y + 14]);
  }

  function knightGreave(p, x, y) {
    p.poly(KN.shade, [x, y + 5, x + 8, y + 5, x + 8.4, y + 18, x + 13.6, y + 20, x + 14.6, y + 23, x, y + 23]);
    p.poly(KN.silver, [x, y + 5, x + 5.4, y + 5, x + 5.6, y + 18, x + 11, y + 19.6, x + 12, y + 23, x, y + 23]);
    p.poly(KN.white, [x + 0.8, y + 5, x + 2.6, y + 5, x + 2.6, y + 21, x + 0.8, y + 21]);
    for (const k of [10, 14]) p.rect(KN.dark, x, y + k, 8.2, 0.9);
    p.poly(KN.gold, [x + 9.6, y + 19, x + 14.6, y + 21.6, x + 15.6, y + 23.4, x + 9.6, y + 23.4]);
    p.poly(KN.gold, [x - 1.2, y + 5.6, x + 9.2, y + 5.6, x + 8, y + 2, x + 4, y + 3.4, x + 1.6, y - 1.4]);
    p.poly(KN.goldD, [x + 4, y + 3.4, x + 8, y + 2, x + 9.2, y + 5.6, x + 4, y + 5.6]);
    p.rect(KN.goldD, x - 0.4, y + 22.4, 15, 1.2);
  }

  const PIECES = {
    passerby: {
      head(p) {
        p.poly(D(PB.pin, 0.35), [4, 30, 18.6, 9.6, 21.4, 11.6]);
        p.poly(PB.pin, [4, 30, 18.6, 9.6, 20, 10.6]);
        fine(p, () => p.poly('#eef2fa', [5, 28.6, 18.8, 10, 19.2, 10.4]));
        for (const [x, y, r] of [[17.6, 7.6, -1.1], [22, 5.6, -0.5], [25.6, 8.8, 0.15]]) {
          p.ell(D(PB.cream, 0.3), x + 0.6, y + 0.6, 5.2, 2.3, r);
          p.ell(PB.cream, x, y, 5, 2.1, r);
          fine(p, () => p.ell(PB.gold, x, y, 3.6, 0.5, r));
        }
        p.ell(PB.gold, 20.6, 10.6, 2.2, 2.2);
        p.ell(PB.navy, 24.6, 12.8, 3.6, 2, 0.5);
        p.ell(PB.navy, 17.4, 14.2, 3.2, 1.8, -0.7);
        p.ell(L(PB.navy, 0.3), 24, 12.2, 2, 0.8, 0.5);
        thick(p, PB.navy, [21, 12.4, 23.4, 17.6, 25.4, 21.4], 1.8);
        thick(p, D(PB.navy, 0.2), [20.4, 12.8, 20.6, 17.6, 21.6, 22.4], 1.5);
        p.ell('#f2f2f6', 23.4, 17.6, 1.2, 1.2); p.ell('#f2f2f6', 20.6, 18.2, 1, 1);
        p.ell(D(PB.orange, 0.35), 26.4, 24.2, 2.6, 2.6);
        p.ell(PB.orange, 26, 23.8, 2.4, 2.4);
        p.ell('#ffd0a0', 25.2, 23, 0.8, 0.8);
      },
      hands(p) {
        p.poly(D(PB.slate, 0.45), slab(5.4, 25.6, 25.6, 7.4, 5.2));
        p.poly(PB.slate, slab(5, 24.6, 25, 6.6, 4.4));
        p.poly(PB.slateHi, slab(3.6, 23, 23.6, 5, 1.1));
        fine(p, () => p.poly(D(PB.slate, 0.25), slab(6.6, 26, 26.4, 8.2, 0.5)));
        p.poly(D(PB.slate, 0.5), slab(3.4, 26.2, 6.4, 23.4, 4.6));
        p.poly(D(PB.slate, 0.5), slab(23.4, 8.2, 26.4, 5.6, 4.6));
        p.poly(D(PB.gold, 0.35), [15.4, 9.6, 21, 14.4, 16.4, 21.6, 10.4, 16.8]);
        p.poly(PB.gold, [15, 9.6, 20.2, 14, 16, 20.6, 10.6, 16.4]);
        p.poly(PB.cream, [15, 9.6, 20.2, 14, 15.6, 14.6]);
        p.ell(PB.red, 15.4, 15.2, 1.6, 1.6);
        thick(p, PB.orange, [3.8, 15, 2.6, 10.6, 5.6, 7.4, 9.6, 9.2, 10.6, 13.2], 1.4);
        thick(p, PB.orange, [24.2, 17.4, 27.6, 20.6, 26.6, 25.4, 22.6, 27.6], 1.4);
        p.ell(D(PB.orange, 0.2), 3.8, 15.6, 1.4, 1.4); p.ell(D(PB.orange, 0.2), 22.4, 27.8, 1.4, 1.4);
      },
      body(p) {
        const coat = [6.6, 8, 11.6, 4.6, 16, 7.4, 20.4, 4.6, 25.6, 8, 27, 18, 26.4, 29.4, 21.6, 28, 18.6, 30, 15.6, 27.4, 12.6, 30.6, 10.6, 27.6, 7.8, 30.4, 7, 26.4, 5.4, 18];
        p.poly(PB.cloth, coat);
        p.clipPoly(coat, () => { p.poly(PB.cloth2, [5, 6, 11.6, 4.6, 9, 30, 4, 30]); p.poly(D(PB.cloth, 0.3), [21, 4, 30, 6, 30, 31, 20, 31]); });
        p.poly(D(PB.slate, 0.1), [4.4, 9.4, 8.4, 6.2, 9.4, 15.6, 5.2, 17]);
        p.poly(D(PB.slate, 0.4), [27.6, 9.4, 23.6, 6.2, 22.6, 15.6, 26.8, 17]);
        p.poly(PB.cream, [11.6, 4.6, 16, 7.4, 20.4, 4.6, 19.6, 8.6, 16, 11, 12.4, 8.6]);
        p.poly(D(PB.cream, 0.3), [16, 7.4, 20.4, 4.6, 19.6, 8.6, 16, 11]);
        p.poly(D(PB.red, 0.35), [9.6, 6.8, 13.2, 6, 26.6, 25.6, 23, 27]);
        p.poly(PB.red, [9.6, 6.4, 12.6, 5.8, 25.6, 24.6, 22.8, 25.6]);
        p.poly(PB.cream, [14.4, 12.6, 18.2, 11.8, 20.2, 16.6, 16.4, 17.6]);
        fine(p, () => { p.rect(PB.gold, 15.6, 13.4, 1.2, 1.2); p.rect(PB.gold, 17.4, 15.4, 1.2, 1.2); p.rect(PB.orange, 16.6, 14.4, 1, 1); });
        for (const x of [21.4, 23.4]) { p.rect(PB.gold, x, 25.4, 0.9, 3.4); p.rect(PB.orange, x - 0.2, 28.6, 1.3, 1.2); }
      },
      feet(p) {
        passerbyBoot(p, 14.4, 1, PB.cloth2);
        passerbyBoot(p, 5.4, 6.6, PB.cloth);
        fine(p, () => p.rect('#4a5070', 5.6, 9.6, 1, 10));
      }
    },
    musketeer: {
      head(p) {
        p.ell(D(MK.lea, 0.2), 16, 15.4, 12.4, 3.6, -0.06);
        thick(p, D(MK.wheat, 0.3), [21.4, 13, 23.8, 7, 26.4, 1.6], 1);
        for (let i = 0; i < 5; i++) {
          const t = i / 4, x = 22.6 + t * 3.6, y = 9.6 - t * 7.6;
          p.ell(MK.wheat, x - 1.2, y, 1.1, 1.8, -0.5); p.ell(L(MK.wheat, 0.25), x + 1, y - 0.6, 1.1, 1.8, 0.4);
        }
        p.poly(MK.lea, [9.2, 16, 9.4, 7, 12.6, 3, 16.4, 5.2, 20, 2.8, 23, 6.4, 23.4, 15.4]);
        p.poly(MK.hi, [9.2, 16, 9.4, 7, 12.6, 3, 13.8, 4, 12, 15.6]);
        p.poly(D(MK.lea, 0.3), [20, 2.8, 23, 6.4, 23.4, 15.4, 20.2, 15.6]);
        p.poly(MK.dark, [13.8, 4, 16.4, 5.2, 18.8, 3.8, 16.4, 9]);
        p.poly(MK.teal, [9.2, 12.4, 23.3, 11.4, 23.4, 14.8, 9.3, 15.8]);
        p.poly(D(MK.teal, 0.35), [9.3, 14.6, 23.4, 13.6, 23.4, 14.8, 9.3, 15.8]);
        p.rect(MK.silver, 12, 12, 2.4, 3.2); p.rect(MK.silver, 15.2, 11.8, 2.4, 3.2);
        fine(p, () => { p.rect('#7a8090', 12, 13.3, 2.4, 0.6); p.rect('#7a8090', 15.2, 13.1, 2.4, 0.6); });
        const brim = [1.6, 11.6, 5, 16.4, 10, 19.6, 16, 21, 22, 19.6, 27, 16.4, 30.4, 10.6, 26.6, 14, 22, 15.6, 16, 16.2, 10, 15.6, 5.4, 14.2];
        p.poly(MK.deep, brim.map((v, i) => v + (i % 2 ? 1.4 : 0)));
        p.poly(MK.lea, brim);
        p.poly(MK.hi, [1.6, 11.6, 5, 16.4, 10, 19.6, 16, 21, 16, 19.6, 10, 18.2, 5.6, 15.2]);
        p.poly(D(MK.lea, 0.25), [30.4, 10.6, 27, 16.4, 22, 19.6, 22, 18, 26.4, 15]);
        p.ell(MK.deep, 7.6, 17, 1, 0.8);
      },
      hands(p) {
        const glove = (dx, dy, c) => {
          p.poly(c, [6 + dx, 29 + dy, 4 + dx, 21 + dy, 8 + dx, 14 + dy, 15 + dx, 11 + dy, 21 + dx, 13 + dy, 19 + dx, 22 + dy, 13 + dx, 28.6 + dy]);
          for (const [x, y, r] of [[13, 7.4, -0.5], [16.6, 6.6, -0.3], [20, 7.6, -0.1], [22.6, 10, 0.3]]) p.ell(c, x + dx, y + dy, 1.9, 4.4, r);
          p.ell(c, 5.6 + dx, 15.6 + dy, 1.8, 3.8, 0.9);
        };
        glove(6, -2, MK.dark);
        glove(0, 2, MK.lea);
        p.poly(MK.hi, [5.4, 23, 8, 16, 13, 13.2, 9, 18]);
        p.poly(D(MK.lea, 0.3), [19, 24, 21, 15, 23, 18, 21, 25]);
        p.poly(MK.deep, slab(4, 27.6, 12.6, 31, 3.2));
        p.poly(MK.dark, slab(4, 26.8, 12.6, 30.2, 2.8));
        for (const k of [-1.2, 1.2]) p.poly(MK.teal, slab(4.4 + k * 0.4, 27 + k, 12.2 + k * 0.4, 30.2 + k, 0.45));
        p.poly(MK.wheat, [8.2, 26.8, 9.6, 28.4, 8.4, 30.4, 7, 28.8]);
      },
      body(p) {
        const cape = [5, 13, 9.6, 9, 16, 8, 22.4, 9, 27, 13, 28.4, 25.6, 22, 29.6, 16, 28, 10, 29.6, 3.6, 25.6];
        p.poly(MK.dark, cape.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(MK.lea, cape);
        p.clipPoly(cape, () => { p.poly(D(MK.lea, 0.28), [17, 6, 30, 6, 30, 31, 19, 31]); p.poly(MK.hi, [4, 24, 9, 9, 11, 10, 8, 26]); });
        p.poly(MK.dark, [9.4, 10.6, 11, 4.6, 16, 2.4, 21, 4.6, 22.6, 10.6]);
        p.poly(MK.lea, [9.8, 10, 11.4, 4.8, 16, 2.8, 20.4, 4.8, 21.8, 10]);
        p.poly(MK.hi, [9.8, 10, 11.4, 4.8, 16, 2.8, 14, 5.4, 12.2, 9.6]);
        fine(p, () => { p.rect(MK.dark, 15.6, 3.6, 0.8, 5); p.rect(MK.dark, 18.6, 5, 0.8, 4); });
        p.poly(MK.cream, [9.6, 10.6, 16, 8.6, 22.4, 10.6, 20.6, 14, 16, 12.6, 11.4, 14]);
        p.poly(D(MK.cream, 0.25), [16, 12.6, 20.6, 14, 22.4, 10.6, 21, 11.6]);
        p.poly(MK.deep, [15.6, 13, 17, 13, 15.8, 28.4, 14.4, 28.4]);
        p.poly(MK.cream, [14.4, 28.4, 15.8, 22, 15.8, 28.4]);
        thick(p, D(MK.wheat, 0.25), [19.6, 13.4, 20.6, 19, 20.4, 24], 1.8);
        thick(p, MK.wheat, [19.4, 13, 20.2, 18.6, 20, 23.6], 1.2);
        p.rect(MK.teal, 18.8, 23.4, 2.6, 1.2); p.rect(MK.teal, 18.8, 25.6, 2.6, 1.2);
        p.poly(MK.wheat, [18.6, 24.6, 21.6, 24.6, 22.2, 28.4, 18, 28.4]);
        fine(p, () => { for (let i = 0; i < 4; i++) p.rect(MK.dark, 9 + i * 1.2, 15 + i * 3.4, 0.8, 2.2); });
      },
      feet(p) {
        musketeerBoot(p, 13.6, 2, MK.dark, false);
        musketeerBoot(p, 5, 6.4, MK.lea, true);
        p.ell(MK.silver, 7, 28.4, 1.6, 1.6);
        fine(p, () => p.ell('#7a8090', 7, 28.4, 0.7, 0.7));
      }
    },
    knight: {
      head(p) {
        p.ell(KN.shade, 17, 16.4, 12.6, 12.4);
        p.ell(KN.white, 16.4, 15.6, 12, 11.8);
        for (let i = 0; i < 11; i++) { const a = Math.PI * (0.95 + i * 0.12), x = 16.4 + Math.cos(a) * 10.4, y = 15.6 + Math.sin(a) * 10.2; p.ell(KN.shade, x + 0.5, y + 0.6, 2.4, 2.4); p.ell(KN.white, x, y, 2.2, 2.2); }
        fine(p, () => { for (const [x, y] of [[20, 7], [24, 10], [22, 14], [25.6, 15]]) p.ell(KN.shade, x, y, 1.6, 0.6, 0.6); });
        p.poly(KN.gold, [26.4, 6, 30.6, 2.6, 28.4, 8.6]); p.poly(KN.gold, [7.2, 4.4, 4.4, 0.8, 9.6, 3.4]);
        p.ell(KN.goldD, 12.4, 18.6, 6.6, 8.2, 0.12);
        p.ell(KN.gold, 12, 18, 6.2, 7.8, 0.12);
        p.ell(L(KN.gold, 0.35), 10.4, 15.6, 2.4, 3.6, 0.2);
        p.poly(KN.goldD, [8.4, 16.4, 11.2, 17.4, 11, 18, 8.4, 17.2]);
        p.poly(KN.goldD, [13.6, 17.6, 16, 16.8, 16.2, 17.4, 13.8, 18.4]);
        p.poly(KN.goldD, [12.4, 18.6, 13.4, 22.2, 12, 22.4]);
        p.rect(KN.goldD, 10.6, 24, 3.6, 0.9);
        p.ell(KN.shade, 25.6, 19.6, 4, 5.4, 0.2);
        p.ell(KN.white, 25.2, 19, 3.6, 5, 0.2);
        fine(p, () => { for (let i = 0; i < 3; i++) p.rect(KN.shade, 23.6, 16.6 + i * 2, 3.6, 0.6); });
        p.poly(KN.gold, [7, 27, 26, 25.6, 26.6, 27.6, 7.4, 29.4]);
        fine(p, () => star4(p, KN.white, 17, 27.4, 1.6, 0.5));
      },
      hands(p) {
        p.ell(KN.dark, 16, 19.6, 13.2, 9);
        p.ell(KN.shade, 16, 19, 12.8, 8.6);
        p.ell(KN.silver, 15.6, 18.2, 12.4, 7.8);
        p.ell(KN.white, 12, 13.6, 7, 2.2, -0.15);
        G.iconHelp.hole(p, 16.2, 20.6, 8.6, 4.4);
        p.clipPoly([0, 22, 32, 22, 32, 32, 0, 32], () => { p.ell(KN.shade, 16, 20.6, 12.6, 7.4); G.iconHelp.hole(p, 16.2, 20.4, 8.8, 4.4); });
        fine(p, () => { for (const x of [7, 10.6, 21.4, 25]) p.rect(KN.shade, x, 23.2, 1.2, 1.6); });
        p.ell(KN.goldD, 16, 10.6, 5.6, 4.4);
        p.ell(KN.gold, 15.8, 10, 5.2, 4);
        p.ell('#7a1810', 15.8, 9.6, 3.6, 2.8);
        p.ell(KN.red, 15.5, 9.2, 3.2, 2.4);
        p.ell('#ffb0a0', 14.4, 8.4, 1.2, 0.8);
      },
      body(p) {
        const plate = [9, 8, 13, 5.6, 19, 5.6, 23, 8, 24.6, 17, 22, 27.6, 10, 27.6, 7.4, 17];
        p.poly(KN.shade, plate.map((v, i) => v + (i % 2 ? 0.8 : 0.6)));
        p.poly(KN.silver, plate);
        p.clipPoly(plate, () => { p.poly(KN.shade, [16, 4, 30, 4, 30, 30, 16, 30]); p.poly(KN.white, [8, 10, 12, 7, 13.6, 24, 9.6, 22]); });
        p.poly(KN.gold, [13, 5.6, 19, 5.6, 18, 8, 14, 8]);
        p.poly(KN.gold, [10, 26.2, 22, 26.2, 22, 27.8, 10, 27.8]);
        p.rect(KN.goldD, 15.6, 9, 0.9, 16);
        fine(p, () => { star4(p, KN.gold, 12.4, 13, 1.6, 0.5); star4(p, KN.gold, 20, 13, 1.6, 0.5); star4(p, KN.gold, 16, 21.4, 1.8, 0.5); });
        p.ell(KN.dark, 7.4, 10.2, 5.2, 4.6, -0.3); p.ell(KN.white, 7, 9.6, 4.8, 4.2, -0.3); p.ell(KN.gold, 7, 9.6, 1.6, 1.6);
        for (const [x, y, r] of [[27.6, 6, -0.9], [29, 10, -0.4], [28.6, 14.4, 0.1]]) { p.ell(KN.shade, x + 0.4, y + 0.6, 2, 4.6, r); p.ell(KN.white, x, y, 1.8, 4.4, r); }
        p.ell(KN.dark, 24.6, 10.2, 5, 4.6, 0.3); p.ell(KN.silver, 24.2, 9.6, 4.6, 4.2, 0.3); p.ell(KN.gold, 24.2, 9.6, 1.6, 1.6);
      },
      feet(p) {
        knightGreave(p, 13.4, 2.6);
        knightGreave(p, 4.6, 6.4);
      }
    },
    thief: {
      head(p) {
        const mask = [0.6, 7.4, 7.6, 10.4, 13.6, 10.6, 16, 12.6, 18.4, 10.6, 24.4, 10.4, 31.4, 7.4, 29.4, 16.6, 23, 22.4, 16, 19.4, 9, 22.4, 2.6, 16.6];
        p.poly(TH.cobD, mask.map((v, i) => v + (i % 2 ? 1.2 : 0.4)));
        p.poly(TH.cob, mask);
        p.clipPoly(mask, () => {
          p.poly(TH.white, [0, 0, 16, 0, 16, 32, 0, 32]);
          p.poly(TH.whiteS, [0, 18, 16, 16.4, 16, 32, 0, 32]);
          p.poly(TH.pink, slab(17, 10, 30, 21, 0.9));
          p.poly(TH.pink, slab(17, 20, 30, 10, 0.9));
          p.poly(TH.cobD, [16, 17, 32, 15, 32, 32, 16, 32]);
        });
        p.poly(TH.black, [5.6, 13.6, 9, 13.4, 12.6, 15.4, 10.4, 17.6, 6.6, 16.6]);
        p.poly(TH.black, mir([5.6, 13.6, 9, 13.4, 12.6, 15.4, 10.4, 17.6, 6.6, 16.6]));
        fine(p, () => { for (const [x, y] of [[4.4, 13.6], [6.4, 11], [5.6, 19], [11.6, 21]]) p.ell(TH.gold, x, y, 0.7, 0.7); });
        p.poly(TH.gold, [0.6, 7.4, 0.2, 2.6, 3.6, 8.6]);
        p.poly(TH.gold, [16, 19.6, 14.8, 24.4, 17.2, 24.4]);
      },
      hands(p) {
        const glove = (dx, dy, back) => {
          const pal = back ? [TH.whiteS, TH.cobD] : [TH.white, TH.cob];
          p.poly(pal[0], mir([6 + dx, 28.6 + dy, 4.4 + dx, 21 + dy, 8 + dx, 15 + dy, 14.6 + dx, 12.6 + dy, 19.6 + dx, 14.6 + dy, 18 + dx, 22 + dy, 12.6 + dx, 28 + dy]));
          for (const [x, y, r] of [[13, 8.6, -0.45], [16.2, 8, -0.25], [19.2, 9, -0.05], [21.4, 11.4, 0.3]]) p.ell(pal[0], 32 - x - dx, y + dy, 1.6, 4, -r);
          p.ell(pal[0], 32 - 5.6 - dx, 16.6 + dy, 1.6, 3.4, -0.9);
          p.poly(pal[1], mir([7.6 + dx, 22 + dy, 10 + dx, 16 + dy, 16.6 + dx, 14.4 + dy, 17 + dx, 20.6 + dy, 12 + dx, 25.4 + dy]));
          if (!back) p.clipPoly(mir([7.6 + dx, 22 + dy, 10 + dx, 16 + dy, 16.6 + dx, 14.4 + dy, 17 + dx, 20.6 + dy, 12 + dx, 25.4 + dy]), () => { p.poly(TH.pink, slab(32 - 8, 16, 32 - 17, 24, 0.7)); p.poly(TH.pink, slab(32 - 9, 25, 32 - 16, 15, 0.7)); });
          p.poly(pal[1], slab(32 - 3.6 - dx, 26.4 + dy, 32 - 10.4 - dx, 30.4 + dy, 2.4));
        };
        glove(-5, -3, true);
        glove(0, 1, false);
        fine(p, () => { for (const k of [0, 1, 2]) p.ell(TH.gold, 32 - 5.6 - k * 2.2, 28 + k * 1.3, 0.6, 0.6); });
      },
      body(p) {
        p.ell(D(TH.whiteS, 0.2), 16.6, 15, 13.2, 9.2);
        p.ell(TH.white, 16, 14, 12.8, 8.8);
        p.ell(TH.cob, 16.2, 12.6, 9.8, 5.6);
        p.clipPoly([0, 0, 32, 0, 32, 32, 0, 32], () => { p.poly(TH.pink, slab(9, 9, 23, 16, 0.6)); p.poly(TH.pink, slab(9, 16, 23, 9, 0.6)); });
        G.iconHelp.hole(p, 16.4, 12, 8.4, 4.2);
        fine(p, () => { for (let i = 0; i < 9; i++) { const a = Math.PI * (0.1 + i * 0.1), x = 16 + Math.cos(a) * 11.2, y = 14.6 + Math.sin(a) * 7.4; p.ell(TH.gold, x, y, 0.8, 0.8); } });
        p.rect(D(TH.gold, 0.3), 14, 20.6, 5, 3.6);
        p.rect(TH.gold, 14.4, 21, 4.2, 2.8);
        p.rect(TH.white, 15.4, 21.8, 2.2, 1.2);
        p.poly(TH.black, [3.6, 18, 9.4, 19.4, 10.4, 24.4, 8.6, 30.4, 7.4, 25.6, 5.4, 30.4, 4.8, 25, 1.6, 28.6, 2.6, 22.6]);
        p.poly('#4a4a5c', [3.6, 18, 9.4, 19.4, 9, 21, 4.2, 20.2]);
      },
      feet(p) {
        thiefBoot(p, 14.4, 1.4, true);
        thiefBoot(p, 6, 5.2, false);
      }
    },
    firesmith: {
      head(p) {
        thick(p, FS.redD, [4, 16, 2.6, 22, 6, 27.6, 13, 28.6, 20, 26.4], 2.2);
        thick(p, FS.red, [4, 15.4, 2.8, 21.6, 6.2, 27, 13, 28, 20, 25.8], 1.4);
        for (const [x, y] of [[10.6, 13.4], [22.4, 11.2]]) {
          p.ell(FS.copD, x + 0.6, y + 0.8, 7, 7);
          p.ell(FS.cop, x, y, 6.6, 6.6);
          p.ell(FS.copHi, x - 1.6, y - 2.4, 3.6, 2, -0.5);
          p.ell(FS.copD, x, y, 4.6, 4.6);
          p.ell(FS.lens, x, y, 4, 4);
          p.ell(FS.redD, x + 0.8, y + 1, 2.6, 2.6);
          p.ell('#ffd0c0', x - 1.4, y - 1.4, 1.2, 0.9);
          fine(p, () => { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.ell(FS.copHi, x + Math.cos(a) * 5.6, y + Math.sin(a) * 5.6, 0.5, 0.5); } });
        }
        p.poly(FS.cop, [16, 11.4, 17.4, 10.4, 17.6, 13, 16, 14]);
        p.rect(FS.copD, 27.6, 4.6, 2, 3.4); p.rect(FS.copD, 4.6, 6.4, 2, 3.4);
        p.poly('#d8b050', [14, 20.6, 17, 22, 16, 25, 13, 23.6]);
        p.poly('#d8b050', [17.6, 24.4, 20.4, 25.6, 19.6, 28.6, 16.8, 27.6]);
      },
      hands(p) {
        p.ell(FS.copD, 18.6, 20.4, 11.4, 8.8, -0.35);
        p.ell(FS.cop, 18, 19.6, 11, 8.4, -0.35);
        p.ell(FS.copHi, 13.6, 14.6, 5, 2, -0.6);
        G.iconHelp.hole(p, 18.6, 19.6, 7.4, 5, -0.35);
        p.clipPoly([0, 20, 32, 14, 32, 32, 0, 32], () => { p.ell(D(FS.cop, 0.15), 18, 19.6, 11, 8.4, -0.35); G.iconHelp.hole(p, 18.4, 19.4, 7.6, 5.2, -0.35); });
        fine(p, () => { for (const [x, y] of [[24, 25], [27, 21], [12, 26], [20, 27]]) p.ell(FS.copD, x, y, 1, 0.6); });
        const flame = [6, 26, 3.4, 18.6, 5.4, 12, 4.6, 6, 8.4, 9.6, 9.4, 2, 12.6, 9, 14.4, 6.6, 13.6, 14, 12, 20, 9.6, 25];
        p.poly(FS.redD, flame.map((v, i) => v + (i % 2 ? 0.8 : 0.6)));
        p.poly(FS.red, flame);
        p.poly(FS.orange, [7, 22, 6, 17, 7.6, 12, 9.6, 15, 10.6, 11, 11.4, 16, 9.6, 21]);
        p.poly('#ffe0a0', [8.2, 18.6, 8.4, 15.6, 9.6, 17, 10.2, 15.4, 9.8, 19]);
      },
      body(p) {
        thick(p, '#c8a878', [11.4, 6, 8.6, 1], 1.5);
        thick(p, '#8a6a48', [20.6, 6, 24.4, 1], 1.5);
        const apron = [10.6, 5, 21.4, 5, 22.4, 12, 26.4, 15, 26.4, 26, 22, 30, 10, 30, 5.6, 26, 5.6, 15, 9.6, 12];
        p.poly(FS.plumD, apron.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(FS.plum, apron);
        p.clipPoly(apron, () => {
          p.poly(L(FS.plum, 0.15), [4, 14, 12, 12, 10, 31, 4, 31]);
          p.poly(D(FS.plum, 0.3), [20, 10, 30, 10, 30, 31, 21, 31]);
          fine(p, () => { for (const k of [0, 1]) { p.poly(FS.plumD, slab(4, 17 + k * 6, 28, 29 + k * 6, 0.3)); p.poly(FS.plumD, slab(4, 29 + k * 6, 28, 17 + k * 6, 0.3)); } });
          const fl = [4, 16, 8, 12.6, 10, 15, 12.6, 11, 15, 14.6, 17.4, 10.6, 20, 14.6, 23, 11, 25, 15, 28, 13.4, 28, 19, 4, 19];
          p.poly(FS.redD, fl.map((v, i) => v + (i % 2 ? 0.8 : 0)));
          p.poly(FS.red, fl);
          p.poly(FS.orange, [8, 17.4, 10, 15.6, 12.6, 16.8, 15, 15.4, 17.4, 16.8, 20, 15.6, 23, 16.8, 23, 17.6, 8, 17.6]);
        });
        for (const [x, y] of [[11.6, 6.6], [20.4, 6.6], [7.6, 26], [24.4, 26]]) p.ell('#d8b050', x, y, 0.9, 0.9);
        for (let i = 0; i < 3; i++) { p.rect(D(FS.plumD, 0.1), 26 + i * 1.6, 17.6, 1.4, 6.6); p.rect('#a8a0a0', 26.2 + i * 1.6, 16.6, 1, 1.4); }
      },
      feet(p) {
        thick(p, FS.plumD, [20, 3, 28, 9.6, 26, 22], 1.8);
        p.poly(D(FS.copD, 0.2), slab(21.4, 9, 10, 22, 2.2));
        p.poly(FS.copD, slab(21, 8.4, 9.6, 21.4, 1.6));
        p.poly('#5a4a46', slab(25, 11.4, 13.6, 24.6, 1.2));
        const knee = [14.6, 6.6, 19.6, 1.6, 27, 3.4, 28.6, 8, 24, 13.4];
        p.poly(FS.copD, knee.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(FS.cop, knee);
        p.poly(FS.copHi, [15.6, 6.4, 19.8, 2.4, 23.4, 3.2, 18.6, 7.6]);
        p.poly(FS.plumD, slab(15.4, 8.4, 24.6, 12.6, 0.6));
        fine(p, () => { for (const [x, y] of [[18.4, 10.4], [24.4, 6.2], [21.4, 11.6]]) p.ell(FS.copD, x, y, 0.6, 0.6); });
        p.rect('#d8b050', 14.4, 15.4, 2.6, 2.6);
        const flame = [12.6, 22, 13.6, 27.6, 10.6, 30.6, 6, 30.4, 2.6, 27, 4.6, 26.6, 2.6, 22.6, 6, 24.4, 6.4, 19.6, 9.4, 22.4];
        p.poly(FS.redD, flame.map((v, i) => v + (i % 2 ? 0.8 : 0.6)));
        p.poly(FS.red, flame);
        p.poly(FS.orange, [10.6, 24.6, 11, 27.6, 9.2, 29.4, 6.6, 28.6, 7.6, 25.6]);
        p.ell('#ffe0a0', 8.6, 27.4, 1, 0.8);
      }
    },
    glacial: {
      head(p) {
        p.ell(GL.furS, 16.8, 15.6, 13.4, 12.4);
        p.ell(GL.fur, 16.2, 14.8, 13, 12);
        p.ell(GL.fur, 7, 4.6, 3, 3); p.ell(GL.furS, 7, 4.8, 1.6, 1.6);
        p.ell(GL.fur, 24.6, 3.6, 3, 3); p.ell(GL.furS, 24.6, 3.8, 1.6, 1.6);
        fine(p, () => { for (const [x, y] of [[20, 7], [25, 11], [23, 16], [27, 19], [12, 6]]) p.ell(GL.furS, x, y, 1.6, 0.5, 0.5); });
        p.ell(GL.blue, 20.4, 9, 1.4, 1, 0.4); p.ell(GL.blue, 27, 14, 1.4, 1, 0.4);
        p.ell(GL.navy, 12, 13.4, 3, 2, -0.3);
        p.poly(GL.navy, [4.4, 16, 18, 15, 19, 25, 14, 28.4, 6, 27, 3.4, 22]);
        p.poly(GL.gold, [7, 17.6, 15.6, 17, 15, 20.6, 11, 22.4, 7.6, 21]);
        p.poly(GL.blue, [9, 18.4, 14, 18, 13.4, 20, 10, 20.6]);
        p.poly(D(GL.navy, 0.3), [6.6, 23, 16.6, 22.6, 15, 26.4, 7.4, 26.4]);
        for (const x of [7.6, 10.4, 13.2]) p.poly(GL.ivory, [x, 22.6, x + 2, 22.6, x + 1, 25.4]);
        p.poly(GL.ivory, [4, 15, 6.4, 15.4, 3.2, 21]); p.poly(GL.ivory, [18.6, 14.2, 20.6, 15, 20.6, 20.4]);
        for (const [x, y] of [[20, 28], [23.4, 27], [26.6, 25]]) { p.poly(GL.ivory, [x - 1, y - 1, x + 1, y - 1, x, y + 3.4]); p.ell(GL.gold, x, y - 1.4, 0.8, 0.8); }
        thick(p, GL.blue, [2, 27, 4.6, 29.6, 8.4, 29], 1.2);
      },
      hands(p) {
        p.poly(D(GL.navy, 0.2), slab(15, 17, 27, 5, 5.4));
        p.poly(GL.navy, slab(15, 16.4, 26.4, 5, 4.8));
        p.poly(GL.blue, slab(15.6, 13.4, 23.6, 5.4, 1.6));
        p.poly(GL.gold, slab(17.4, 14.4, 19.4, 12.4, 4.8));
        p.poly(GL.navy, slab(17.8, 14, 19, 12.8, 2.8));
        p.poly(GL.fur, slab(25.4, 6.4, 28.4, 3.4, 5));
        const hand = [16.6, 12.6, 20.6, 19, 16, 24.6, 11.6, 27, 6.4, 28.6, 3, 26.6, 4.6, 22.4, 2.6, 19.6, 6, 16.6, 10.4, 14.4];
        p.poly(GL.furS, hand.map((v, i) => v + (i % 2 ? 0.8 : 0.6)));
        p.poly(GL.fur, hand);
        for (const [x, y] of [[3.4, 18.4], [2, 22.6], [3, 26.6], [6.4, 28.8]]) { p.ell(GL.furS, x + 0.5, y + 0.6, 2.2, 1.7, -0.5); p.ell(GL.fur, x, y, 2.1, 1.6, -0.5); }
        fine(p, () => { for (const [x, y] of [[8, 19], [11, 18], [10, 22], [13.6, 21], [7, 24], [14, 16]]) p.ell(GL.furS, x, y, 1.2, 0.8, -0.6); });
        for (const [x, y, a] of [[3, 26.8, 0.6], [2.4, 20, 0.2], [6.2, 28.8, 1.1]]) p.poly(GL.ivory, [x, y, x - 2.6 * Math.cos(a), y + 2.6 * Math.sin(a) - 1, x - 0.8, y + 1.2]);
        p.ell(GL.gold, 18.8, 22.4, 1, 1);
        p.poly(GL.ivory, [19, 23, 21, 23, 20, 27]);
      },
      body(p) {
        const cape = [7.6, 9, 24.6, 9, 27.6, 22, 24, 30, 18, 26.4, 14, 30.4, 9, 26.4, 4.4, 24];
        p.poly(D(GL.mesh, 0.25), cape.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(GL.mesh, cape);
        p.clipPoly(cape, () => {
          p.poly(GL.fur, [4, 8, 12, 8, 10, 32, 3, 32]);
          p.poly(D(GL.mesh, 0.15), [19, 8, 30, 8, 30, 32, 21, 32]);
          fine(p, () => { for (let i = 0; i < 6; i++) { p.poly(D(GL.mesh, 0.2), slab(10 + i * 3, 12, 6 + i * 3, 30, 0.25)); p.poly(D(GL.mesh, 0.2), slab(10 + i * 3, 12, 14 + i * 3, 30, 0.25)); } });
        });
        for (let i = 0; i < 7; i++) { p.ell(GL.furS, 6.4 + i * 3.4, 8.6 + (i % 2) * 0.8, 3, 2.8); p.ell(GL.fur, 6 + i * 3.4, 7.6 + (i % 2) * 0.8, 2.8, 2.6); }
        p.poly(GL.fur, [24, 4, 29.6, 2, 27, 7]);
        thick(p, GL.blue, [11, 11.4, 16, 12.6, 21, 11.4], 1.6);
        thick(p, GL.blue, [16, 12.6, 14.6, 17.4], 1.2);
        p.poly(GL.gold, [14.4, 10.4, 17.6, 10.4, 18.4, 13, 16, 14.6, 13.6, 13]);
        for (const [x, y] of [[9.4, 13], [21.6, 13.4], [24.4, 12]]) { p.poly(GL.ivory, [x - 0.9, y, x + 0.9, y, x, y + 4]); p.ell(GL.gold, x, y - 0.4, 0.7, 0.7); }
      },
      feet(p) {
        hunterBoot(p, 14.4, 1.6, true);
        hunterBoot(p, 4.6, 5.6, false);
      }
    },
    thunder: {
      head(p) {
        const lens = (cx, cy, s) => [cx - 6.4 * s, cy - 4 * s, cx + 5.6 * s, cy - 4.6 * s, cx + 6.4 * s, cy + 1 * s, cx + 3 * s, cy + 6 * s, cx - 2.6 * s, cy + 6 * s, cx - 6.6 * s, cy + 1.6 * s];
        for (const [cx, cy, s] of [[9.4, 15.6, 1], [23, 14.4, 0.92]]) {
          const L0 = lens(cx, cy, s);
          p.poly(BD.silver, L0.map((v, i) => v + (i % 2 ? (v > cy ? 0.9 : -0.9) : (v > cx ? 0.9 : -0.9))));
          p.poly(BD.vio, L0);
          p.clipPoly(L0, () => { p.poly(BD.vioL, [0, cy, 32, cy - 2, 32, 32, 0, 32]); p.poly(BD.lav, [0, cy + 3.4, 32, cy + 1.4, 32, 32, 0, 32]); p.poly(BD.white, [cx - 5, cy - 3, cx - 2, cy - 3.4, cx - 6, cy + 3]); });
        }
        p.poly(BD.silver, [15.4, 11.2, 17.6, 11, 17.6, 12.2, 15.4, 12.4]);
        p.poly(BD.silver, [29, 11, 31.6, 10.4, 31.6, 11.8, 29.4, 12.2]);
        p.poly(BD.silver, [2.4, 12.4, 0.4, 13.2, 0.4, 14.4, 2.6, 13.6]);
        const bolt = [24, 5, 29.6, 3.6, 25.6, 10, 29.4, 9.6, 20.6, 19.4, 24, 12, 20.4, 12.4];
        p.poly(BD.vioD, bolt.map((v, i) => v + (i % 2 ? 0.8 : 0.6)));
        p.poly(BD.white, bolt);
        p.poly(BD.flame, [26.6, 4.2, 27.6, 0.6, 29.4, 2.4, 30.6, 0.4, 31, 4, 29.6, 3.6]);
      },
      hands(p) {
        p.ell(BD.vioD, 16.6, 18.6, 12.6, 9.4, -0.3);
        p.ell(BD.vio, 16, 18, 12.2, 9, -0.3);
        G.iconHelp.hole(p, 16.4, 18, 7.6, 4.8, -0.3);
        fine(p, () => { for (let i = 0; i < 14; i++) { const a = i * Math.PI / 7, x = 16 + Math.cos(a) * 10 * Math.cos(-0.3) - Math.sin(a) * 6.9 * Math.sin(-0.3), y = 18 + Math.cos(a) * 10 * Math.sin(-0.3) + Math.sin(a) * 6.9 * Math.cos(-0.3); p.poly(i % 2 ? BD.vioL : BD.vioD, [x, y - 1.4, x + 1.4, y, x, y + 1.4, x - 1.4, y]); } });
        p.clipPoly([0, 19, 32, 12, 32, 32, 0, 32], () => { p.ell(BD.vioL, 15.6, 17.4, 12.2, 9, -0.3); G.iconHelp.hole(p, 16.4, 17.8, 8.6, 5.6, -0.3); });
        const bolt = [8.6, 1.4, 13.6, 1, 10, 6.6, 13.4, 6.4, 5.4, 15.4, 8.4, 8.4, 5, 8.6];
        p.poly(BD.vioD, bolt.map((v, i) => v + (i % 2 ? 0.8 : 0.6)));
        p.poly(BD.white, bolt);
        p.poly(BD.flame, [3.4, 8, 2.6, 4.4, 4.6, 5.6, 4.6, 2.4, 6.8, 5.6, 5.4, 8.6]);
        p.rect(BD.silver, 6.4, 14, 2.4, 2.4);
      },
      body(p) {
        const coat = [8, 6, 13, 4, 16, 8, 19, 4, 24, 6, 29, 14, 27.4, 27, 23, 26, 23, 30, 9, 30, 9, 26, 4.6, 27, 3, 14];
        p.poly(BD.vioD, coat.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(BD.vio, coat);
        p.clipPoly(coat, () => { p.poly(D(BD.vio, 0.3), [17, 4, 32, 4, 32, 32, 17, 32]); p.poly(BD.vioL, [3, 14, 8, 6, 9.6, 6, 6, 27]); });
        p.poly(BD.lav, [13, 4, 16, 8, 13.6, 16, 10.6, 9]);
        p.poly(D(BD.lav, 0.25), [19, 4, 16, 8, 18.4, 16, 21.4, 9]);
        p.poly(BD.vioD, [16, 8, 18.4, 16, 16, 30, 15.4, 16]);
        const bolt = [9.8, 13, 14, 12.4, 11.6, 18, 14, 17.8, 8.6, 27, 10.2, 20.4, 7.6, 20.8];
        p.poly(BD.white, bolt);
        fine(p, () => { for (const [x, y] of [[5, 11], [6.4, 8.6], [27, 11], [25.6, 8.6], [11, 28.6], [21, 28.6]]) p.poly(BD.silver, [x, y - 1, x + 1, y + 0.6, x - 1, y + 0.6]); });
        p.poly(BD.flame, [11.6, 4.4, 11, 0.8, 13, 2.4, 13.4, 0.4, 14.6, 3.4, 13, 4.6]);
        p.poly(BD.flame, mir([11.6, 4.4, 11, 0.8, 13, 2.4, 13.4, 0.4, 14.6, 3.4, 13, 4.6]));
      },
      feet(p) {
        bandBoot(p, 15, 2.6, true);
        bandBoot(p, 4.4, 6.8, false);
        p.poly(BD.flame, [19.6, 25, 19, 21.6, 20.6, 22.6, 21.4, 20.4, 22.4, 23.6, 21, 25.4]);
      }
    },
    eagle: {
      head(p) {
        for (let i = 0; i < 6; i++) { const a = Math.PI * (0.25 + i * 0.13); p.ell(EG.silL, 17 + Math.cos(a) * 9.4, 17 + Math.sin(a) * 8.4, 3.4, 3.2); p.ell(EG.white, 16.6 + Math.cos(a) * 9.4, 16.4 + Math.sin(a) * 8.4, 3.2, 3); }
        feather(p, 18, 13, 29.4, 2, 2.6);
        feather(p, 20, 15, 31, 9, 2.4);
        const helm = [5, 20, 4, 12, 8, 6, 15, 4, 22, 6.6, 25, 12, 24.4, 19, 19, 22.6, 12, 22.4, 7.6, 26.6];
        p.poly(EG.silD, helm.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(EG.sil, helm);
        p.clipPoly(helm, () => { p.poly(EG.silL, [3, 4, 14, 3, 9, 16, 3, 18]); p.poly(D(EG.sil, 0.2), [19, 4, 30, 4, 30, 26, 18, 26]); });
        p.poly(EG.silD, [4, 15.4, 22.6, 14.4, 22, 18, 5.4, 19.4]);
        p.poly('#262a40', [5.6, 16, 21.4, 15.2, 21, 17.4, 6.4, 18.6]);
        p.poly(EG.gold, [5, 20, 7.6, 26.6, 9, 21.6]);
        fine(p, () => { p.poly(EG.silD, slab(12, 8, 19, 10.6, 0.4)); p.poly(EG.silD, slab(13, 11, 18, 12.4, 0.4)); });
        feather(p, 9, 10, 15.6, 0.6, 2.2);
      },
      hands(p) {
        const plates = 9;
        for (let i = 0; i < plates; i++) {
          const a = Math.PI * (0.35 + i * 1.3 / plates), x = 16 + Math.cos(a) * 9.4, y = 17 + Math.sin(a) * 9;
          p.ell(EG.silD, x + 0.6, y + 0.6, 3.6, 2.2, a + 1.57);
          p.ell(i % 2 ? EG.sil : EG.silL, x, y, 3.4, 2, a + 1.57);
        }
        for (let i = 0; i < 6; i++) { const a = Math.PI * (0.45 + i * 0.16); p.ell(EG.white, 16 + Math.cos(a) * 6.4, 17 + Math.sin(a) * 6.2, 1.8, 1.6); }
        p.ell(EG.gold, 24.6, 23.4, 1.6, 1.2);
        feather(p, 9, 9, 22, 2, 2.6);
        feather(p, 8, 11, 17.6, 6.6, 2);
        p.ell(EG.gold, 8.6, 10, 1.4, 1.4);
      },
      body(p) {
        p.ell(EG.tanD, 16.4, 15.4, 13, 8.4);
        p.ell(EG.tan, 16, 14.6, 12.6, 8);
        G.iconHelp.hole(p, 16.2, 14.4, 8.4, 4.4);
        fine(p, () => { for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, x = 16 + Math.cos(a) * 10.4, y = 14.6 + Math.sin(a) * 6.2; p.ell(EG.tanD, x, y, 0.6, 0.6); } });
        thick(p, EG.peri, [9, 21, 7.6, 27.6, 10, 30.4], 1.4);
        thick(p, EG.peri, [23.6, 20, 25.6, 27, 23, 30.4], 1.4);
        feather(p, 12, 20, 4.6, 30.4, 2.2);
        feather(p, 15, 21, 13, 31, 2.2);
        feather(p, 18, 21, 20.6, 31, 2);
        p.rect(EG.silD, 11.4, 2.6, 9.6, 9.6);
        p.rect(EG.white, 12, 3.2, 8.4, 8.4);
        p.rect(EG.fC, 13.4, 4.6, 5.6, 5.6);
        p.rect(EG.white, 14.6, 5.8, 3.2, 3.2);
        fine(p, () => p.rect(EG.fC, 15.6, 6.8, 1.2, 1.2));
        p.ell(EG.silL, 16, 22.4, 1.8, 1.8);
      },
      feet(p) {
        eagleGaiter(p, 14.6, 1.2, true);
        eagleGaiter(p, 4.6, 5.4, false);
        feather(p, 13.4, 13, 21.6, 4.6, 2);
      }
    },
    genius: {
      head(p) {
        const band = arcPoly(16, 24, 9.4, 10.4, 15, 16.4, 196, 344, 14);
        p.poly(GN.bronze, band.map((v, i) => v + (i % 2 ? 1 : 0.4)));
        p.poly(GN.cyanD, band);
        p.clipPoly(band, () => { p.poly(GN.cyan, [0, 0, 32, 0, 32, 13, 0, 15]); p.poly(GN.cyanL, [0, 0, 32, 0, 32, 9, 0, 11]); });
        p.ell(GN.white, 14.6, 12.6, 3.6, 3.4);
        p.ell(GN.cyan, 14.6, 12.6, 2.4, 2.2);
        p.rect(GN.white, 14.1, 10, 1, 5.2);
        fine(p, () => { p.rect(GN.white, 12.6, 11, 0.7, 3.2); p.rect(GN.white, 15.9, 11, 0.7, 3.2); });
        const panel = arcPoly(16, 24, 9.4, 10.4, 15.4, 16.8, 300, 346, 5);
        p.poly(GN.white, panel);
        p.clipPoly(panel, () => { fine(p, () => { for (let i = 0; i < 4; i++) p.poly(GN.whiteS, slab(22 + i * 2.4, 8, 26 + i * 2.4, 22, 0.25)); }); p.poly(GN.whiteS, [26, 18, 32, 14, 32, 30, 26, 30]); });
        p.poly(GN.grey, [3, 18, 1.6, 25, 3, 25.4, 4.6, 19]);
        p.poly(GN.grey, [27.8, 22, 29, 30, 30.4, 29.6, 29.4, 21.4]);
        p.rect(GN.bronze, 1, 24.6, 2.6, 1.4);
      },
      hands(p) {
        const hand = [3.6, 21, 13, 12, 22.6, 14.6, 19, 25, 10.6, 28.6];
        p.poly(GN.whiteS, hand.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(GN.white, hand);
        fine(p, () => { for (let i = 0; i < 4; i++) p.poly(GN.whiteS, slab(9 + i * 3, 15 + i * 1.6, 13 + i * 3, 24 + i * 1.2, 0.3)); });
        p.poly(GN.bronze, [17, 21, 21, 17, 22.4, 19, 19.4, 23]);
        for (let i = 0; i < 4; i++) { const x = 4.6 + i * 2, y = 21.6 + i * 2.2; p.ell(GN.grey, x - 0.4, y + 0.4, 2, 2); p.ell(GN.whiteS, x - 1, y + 1, 1.8, 1.8); p.ell(GN.cyanD, x - 1.2, y + 1.2, 1, 1); }
        p.poly(GN.bronze, slab(18.6, 10.6, 26.4, 4.4, 5.8));
        p.poly(GN.cyanD, slab(19.4, 10.4, 26.6, 4.6, 5));
        p.poly(GN.cyan, slab(19, 9.6, 26.2, 3.8, 3.6));
        p.ell(GN.white, 22.8, 7, 2.4, 2.4); p.ell(GN.cyan, 22.8, 7, 1.5, 1.5); p.rect(GN.white, 22.4, 5, 0.8, 4);
        p.poly(GN.white, [14, 11.6, 19.4, 12.4, 16.4, 16.4]);
      },
      body(p) {
        const suit = [9, 4, 23, 4, 28, 8, 29.6, 24, 25.6, 24.6, 24, 12, 23.4, 29, 8.6, 29, 8, 12, 6.4, 24.6, 2.4, 24, 4, 8];
        p.poly(GN.whiteS, suit.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(GN.white, suit);
        p.clipPoly(suit, () => {
          p.poly(GN.whiteS, [23, 4, 32, 4, 32, 30, 22, 30]);
          fine(p, () => { for (let i = 0; i < 4; i++) { p.poly(GN.white, slab(23 + i * 2, 6, 27 + i * 2, 24, 0.25)); p.poly(D(GN.whiteS, 0.15), slab(29 - i * 2, 6, 25 - i * 2, 24, 0.25)); } });
          p.poly(GN.cyanD, [10, 4, 22, 4, 13, 20, 8, 18]);
          p.poly(GN.cyan, [11, 4, 21, 4, 13, 18, 9, 16.6]);
        });
        p.ell(GN.white, 14, 10.6, 3, 3); p.ell(GN.cyan, 14, 10.6, 1.9, 1.9); p.rect(GN.white, 13.6, 8.6, 0.8, 4);
        p.poly(GN.bronze, [4, 8, 9, 4, 9.6, 5.4, 5, 9.2]);
        p.poly(GN.bronze, mir([4, 8, 9, 4, 9.6, 5.4, 5, 9.2]));
        p.poly(GN.cyanD, [3, 23.6, 6.6, 24.4, 6.4, 26, 2.8, 25.4]);
        p.poly(GN.cyanD, [25.4, 24.2, 29.6, 23.6, 29.8, 25.2, 25.6, 26]);
        p.rect(GN.grey, 15.4, 23, 1.2, 6);
      },
      feet(p) {
        geniusBoot(p, 13, 1.4, true);
        geniusBoot(p, 2.6, 5.4, false);
      }
    },
    wastelander: {
      head(p) {
        thick(p, WL.dark, [9, 24, 7, 28.6, 12, 30.6, 20, 30, 25.6, 27], 2.4);
        thick(p, WL.rust, [9, 23.6, 7.2, 28, 12, 30, 20, 29.4, 25.4, 26.4], 1.2);
        const helm = [4, 18, 4.6, 10, 9, 4.6, 16, 3, 23, 4.6, 27.6, 10, 28.4, 18, 25, 24, 7.4, 24];
        p.poly(WL.khD, helm.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(WL.kh, helm);
        p.clipPoly(helm, () => { p.poly(L(WL.kh, 0.2), [2, 2, 12, 2, 6, 20, 2, 20]); p.poly(WL.khD, [20, 2, 32, 2, 32, 26, 22, 26]); });
        p.poly(WL.gold, slab(10, 4, 22, 13, 1.1)); p.poly(WL.gold, slab(10, 13, 22, 4, 1.1));
        p.poly(WL.gold, [26, 6, 31, 2.6, 28.6, 9]); p.poly(WL.gold, [27.8, 12, 32, 11, 28.4, 15]);
        p.ell(WL.dark, 16.6, 18.6, 5.6, 5.4);
        p.ell(WL.rust, 16.4, 18.2, 4.4, 4.2);
        fine(p, () => { for (let i = -1; i <= 1; i++) p.rect(WL.dark, 13.4, 17.6 + i * 1.8, 6, 0.8); });
        p.ell(WL.brass, 16.4, 18.2, 1.4, 1.4);
        p.rect(WL.dark, 4.4, 12, 6.8, 6.4);
        p.rect(WL.red, 5.4, 13, 4.8, 4.4);
        p.rect('#ff9a8a', 6, 13.6, 1.6, 1.2);
      },
      hands(p) {
        thick(p, WL.dark, [5, 26, 3, 20, 5, 13], 2.6);
        thick(p, WL.dark, [26, 7, 29, 12, 27, 19], 2.6);
        const box = [4, 14, 22, 4, 29, 17, 11, 27.6];
        p.poly(D(WL.brass, 0.4), box.map((v, i) => v + (i % 2 ? 1.2 : 0.6)));
        p.poly(WL.kh, box);
        p.poly(L(WL.kh, 0.2), [4, 14, 22, 4, 23, 5.6, 5.2, 15.6]);
        p.poly(D(WL.kh, 0.25), [29, 17, 11, 27.6, 10.4, 26.2, 28, 15.6]);
        const scr = [8.6, 14.6, 20.4, 8, 24, 14.6, 12.2, 21.4];
        p.poly(WL.dark, scr.map((v, i) => v + (i % 2 ? 0.6 : 0)));
        p.poly('#14383a', scr);
        p.poly(WL.teal, [10, 15.6, 13, 13.4, 14.4, 16.4, 16.4, 11.4, 18, 15.4, 20, 12.4, 22.6, 14, 22.6, 14.8, 20.2, 13.6, 18, 16.8, 16.4, 13.4, 14.4, 18, 13, 14.8, 10.6, 16.4]);
        p.ell(WL.dark, 24.4, 20.6, 2.6, 2.6);
        p.ell(WL.red, 24.2, 20.4, 2, 2);
        p.rect(WL.brass, 23.6, 18.6, 1.2, 1.4);
        fine(p, () => { for (let i = 0; i < 3; i++) p.rect(WL.rust, 7 + i * 1.6, 20 + i * 0.8, 0.8, 2.4); });
      },
      body(p) {
        const skirt = [9, 18, 23, 18, 25.6, 29.6, 6.4, 29.6];
        p.poly(D(WL.pink, 0.35), skirt.map((v, i) => v + (i % 2 ? 0.8 : 0.4)));
        p.poly(WL.pink, skirt);
        p.clipPoly(skirt, () => { for (let i = 0; i < 7; i++) p.poly(D(WL.pink, 0.25), [8 + i * 2.8, 18, 9 + i * 2.8, 18, 8.6 + i * 3.1, 30, 7.4 + i * 3.1, 30]); });
        p.rect(WL.dark, 8.4, 17, 15.4, 2.4);
        p.ell(WL.gold, 16, 18.2, 1.6, 1.6); p.ell(WL.dark, 16, 18.2, 0.8, 0.8);
        const cloak = [5, 18.4, 8, 8, 12, 4, 16, 2.6, 20, 4, 24, 8, 27.6, 18.4, 21, 15.6, 16, 17, 11, 15.6];
        p.poly(D(WL.cream, 0.3), cloak.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(WL.cream, cloak);
        p.clipPoly(cloak, () => { p.poly(D(WL.cream, 0.18), [17, 0, 32, 0, 32, 20, 18, 20]); });
        p.poly(D(WL.cream, 0.35), [12.6, 6, 16, 4.4, 19.4, 6, 16, 9.4]);
        p.poly(WL.rust, slab(10, 9.4, 13, 17, 0.6));
        p.poly(WL.dark, [26.4, 13, 31, 10.4, 28, 15]);
        thick(p, WL.dark, [16, 19.4, 15, 26, 17, 29], 0.8);
      },
      feet(p) {
        wastelandGreave(p, 13.6, 0.6, true);
        wastelandGreave(p, 3.6, 5.4, false);
        thick(p, WL.brass, [3, 20, 1.6, 23, 3.4, 25.4], 1);
      }
    },
    champion: {
      head(p) {
        const frame = [5, 9, 9, 3.6, 16, 2, 23, 3.6, 27, 9, 27.6, 19, 25, 26.6, 20, 29.6, 12, 29.6, 7, 26.6, 4.4, 19];
        p.poly(CH.blackL, frame.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(CH.black, frame);
        p.clipPoly(frame, () => { p.poly(CH.white, [0, 0, 32, 0, 32, 10, 0, 10]); p.poly(CH.whiteS, [20, 0, 32, 0, 32, 10, 22, 10]); });
        dots(p, CH.white, 6, 13, 10, 25, 2);
        dots(p, CH.white, 22.6, 13, 26.6, 25, 2);
        p.ell(CH.blackL, 16, 17.6, 6.4, 7.6);
        G.iconHelp.hole(p, 16, 17.6, 5.4, 6.6);
        p.poly(CH.gold, [5, 9.6, 27, 9.6, 27.2, 11.2, 4.8, 11.2]);
        sun(p, 16, 6.4, 3.4, CH.gold);
        thick(p, CH.gold, [12, 2.6, 11, 0.6], 0.7); thick(p, CH.gold, [20, 2.6, 21, 0.6], 0.7);
        p.poly(CH.gold, [12.6, 28, 19.4, 28, 18, 30.6, 14, 30.6]);
      },
      hands(p) {
        const glove = (x, y, dark) => {
          const c = dark ? CH.blackL : CH.black;
          p.ell(D(c, 0.3), x + 0.6, y + 0.8, 7.6, 6.8, -0.4);
          p.ell(c, x, y, 7.4, 6.6, -0.4);
          p.ell(L(c, 0.25), x - 2.6, y - 2.6, 3, 1.6, -0.6);
          p.ell(c, x - 6, y + 2.4, 2.4, 3.6, 0.5);
          dots(p, CH.white, x - 1, y - 4, x + 4, y - 1, 1.8);
          p.poly(D(c, 0.2), slab(x + 3, y + 3.4, x + 4.6, y + 5, 4.4));
          p.poly(dark ? CH.whiteS : CH.white, slab(x + 4, y + 4.4, x + 8, y + 8.4, 4));
          sun(p, x + 6, y + 6.4, 2, CH.gold);
        };
        glove(19.6, 9.6, true);
        glove(12.4, 17.6, false);
        thick(p, CH.white, [21, 25, 23.4, 28.6, 26.4, 27.4], 0.7);
      },
      body(p) {
        const guard = [7, 6, 12, 3.6, 16, 6, 20, 3.6, 25, 6, 26.6, 18, 22, 28, 16, 29.4, 10, 28, 5.4, 18];
        p.poly(CH.blackL, guard.map((v, i) => v + (i % 2 ? 1 : 0.6)));
        p.poly(CH.black, guard);
        const front = [9.4, 7.4, 12.4, 5.6, 16, 8, 19.6, 5.6, 22.6, 7.4, 23.6, 18, 20, 25.6, 16, 26.6, 12, 25.6, 8.4, 18];
        p.poly(CH.white, front);
        p.clipPoly(front, () => p.poly(CH.whiteS, [18, 0, 32, 0, 32, 32, 18, 32]));
        p.poly(CH.gold, [9.4, 7.4, 12.4, 5.6, 16, 8, 19.6, 5.6, 22.6, 7.4, 22.6, 8.6, 19.6, 7, 16, 9.4, 12.4, 7, 9.4, 8.6]);
        sun(p, 16, 16.4, 5.2, CH.gold);
        p.poly(CH.goldD, [12, 25.6, 16, 26.6, 20, 25.6, 19.6, 27, 16, 28, 12.4, 27]);
        fine(p, () => { p.rect(CH.white, 6.6, 20, 1, 1); p.rect(CH.white, 24.4, 20, 1, 1); });
      },
      feet(p) {
        championBoot(p, 15, 1.2, true);
        championBoot(p, 5.6, 5.4, false);
      }
    },
    station: {
      sphere(p) {
        const facets = [];
        for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 + 0.3; facets.push(16 + Math.cos(a) * 13.4, 16.6 + Math.sin(a) * 13.4); }
        p.poly(D(PL.st, 0.3), facets.map((v, i) => v + (i % 2 ? 0.8 : 0.6)));
        p.poly(PL.st, facets);
        p.clipPoly(facets, () => {
          p.poly(PL.stM, [16, 16.6, 3, 10, 9, 3.4, 20, 3.6]);
          p.poly(PL.stL, [16, 16.6, 9, 3.4, 3, 10]);
          p.poly(D(PL.stM, 0.2), [16, 16.6, 29, 22, 22, 29.4, 13, 30]);
          p.poly(PL.stM, [16, 16.6, 3, 23, 13, 30]);
          p.poly(PL.silver, [11, 22, 14.6, 8, 16.4, 8, 17.4, 15, 24, 13, 24.4, 15, 18, 18, 19.4, 24]);
          p.poly(PL.silD, [16.4, 8, 17.4, 15, 24, 13, 24.4, 15, 18, 18, 19.4, 24, 16, 23]);
          p.rect(PL.silver, 15, 3, 1, 5);
          fine(p, () => { for (const [a, b, c, d] of [[3, 10, 20, 3.6], [16, 16.6, 3, 10], [16, 16.6, 29, 22], [16, 16.6, 3, 23], [20, 3.6, 29, 22]]) p.poly(PL.stP, slab(a, b, c, d, 0.22)); });
          p.ell('#ff6a8a', 21.4, 17.6, 1.4, 1.4);
          p.ell('#ffd0dc', 21.2, 17.4, 0.6, 0.6);
        });
        p.poly('#ffffff', [7, 6, 10.6, 4.4, 8.4, 9]);
        star4(p, '#ffffff', 27.4, 4.6, 4.4, 1);
        star4(p, PL.stP, 4.4, 26.6, 2.6, 0.7);
      },
      rope(p) {
        const path = curve([4.4, 27, 11, 21, 19, 24.4, 27, 18.6, 25, 10.6, 16, 11.4, 10, 6.6], 6);
        const wob = s => path.map((v, i) => v + (i % 2 ? Math.sin(i * 0.9) * s : Math.cos(i * 0.9) * s));
        thick(p, PL.gold, wob(0.9), 1.1);
        thick(p, PL.pink, wob(-0.9), 1);
        fine(p, () => thick(p, '#fff4e0', path, 0.4));
        p.ell(D(PL.blue, 0.3), 5, 26.6, 4.2, 2.6, -0.4);
        thick(p, '#6a8ae8', [1.4, 27.6, 3, 24.6, 6.6, 24.4, 8.4, 26.4, 6.4, 28.6, 3.6, 28], 1);
        thick(p, '#b0c8ff', [3.4, 26.6, 5, 25.6, 6.4, 26.6], 0.7);
        p.ell('#ffffff', 5, 26.6, 1.1, 0.9);
        p.ell(D('#e8904a', 0.3), 25.6, 17.6, 3, 3);
        p.ell('#e8904a', 25.4, 17.2, 2.6, 2.6);
        p.ell('#ffd0a0', 24.6, 16.4, 0.9, 0.9);
        p.poly(PL.silver, slab(20.6, 19.4, 30.4, 15, 0.5));
        p.ell('#ffe070', 16, 23.4, 1.4, 1.4); p.ell(PL.pink, 20.4, 10.6, 1.2, 1.2);
        p.poly('#ffffff', [1, 2.4, 11.6, 6.6, 10.6, 7.6]);
        p.ell(PL.silver, 9.4, 6.2, 1.8, 1.8); p.ell(PL.silD, 9.4, 6.2, 0.8, 0.8);
        star4(p, '#ffffff', 28, 26, 2.8, 0.7);
      }
    },
    vonwacq: {
      sphere(p) {
        orb(p, 16, 15, 12.4, PL.voL, D(PL.vo, 0.4), () => {
          p.poly(PL.vo, [0, 0, 32, 0, 32, 12, 0, 14]);
          p.poly(PL.sea, [0, 16, 32, 15, 32, 32, 0, 32]);
          p.ell(D(PL.isl, 0.3), 16.4, 16.4, 9, 3.6);
          p.ell(PL.isl, 16, 15.4, 8.6, 3.4);
          p.ell(PL.islL, 13.4, 13.6, 4.4, 2.6);
          for (const [x, y] of [[11, 13.4], [14, 12.6], [18, 12.8], [20.6, 14]]) p.ell(D(PL.isl, 0.25), x, y, 1.4, 1.8);
        });
        const wave = [2.6, 24, 6, 21, 9.4, 23.6, 13, 21, 16, 23.6, 19, 21, 22.6, 23.6, 26, 21, 29.4, 24, 27, 28.6, 22, 30.4, 16, 31, 10, 30.4, 5, 28.6];
        p.poly(PL.silD, wave.map((v, i) => v + (i % 2 ? 0.8 : 0.4)));
        p.poly(PL.silver, wave);
        fine(p, () => { for (const x of [6, 13, 19, 26]) { p.ell(PL.silD, x, 24.6, 1.4, 1.4); p.ell(PL.silver, x - 0.4, 24.2, 0.8, 0.8); } });
        p.poly('#ffffff', [7, 26.4, 25, 26, 24, 27.2, 8, 27.6]);
      },
      rope(p) {
        const path = curve([3, 6.6, 9, 10, 8, 18, 14, 24, 22, 22.6, 27, 14.6, 29, 22], 6);
        thick(p, PL.sandD, path.map((v, i) => v + (i % 2 ? 0.8 : 0.4)), 3.8);
        thick(p, '#e8c486', path, 3.4);
        thick(p, PL.blue, path.map((v, i) => v + (i % 2 ? 0.2 : 0.2)), 1.2);
        fine(p, () => { for (let i = 4; i < path.length - 2; i += 10) p.ell('#ffffff', path[i], path[i + 1], 0.6, 0.6); });
        for (const [x, y] of [[8.6, 14], [20.6, 23.4]]) { p.ell(D(PL.shell, 0.25), x + 0.4, y + 0.5, 1.8, 1.4); p.ell(PL.shell, x, y, 1.7, 1.3); }
        const sc = [27.4, 23.4, 24.6, 20, 25, 17, 27.4, 16, 29.8, 17, 30.4, 20];
        p.poly(D(PL.shell, 0.3), sc.map((v, i) => v + (i % 2 ? 0.6 : 0.4)));
        p.poly(PL.shell, sc);
        fine(p, () => { for (const k of [-1.6, 0, 1.6]) p.poly(D(PL.shell, 0.3), slab(27.4, 23, 27.4 + k, 16.6, 0.25)); });
        p.poly(PL.shell, [0.6, 5, 5, 4, 6.4, 7, 2, 8.6]);
        p.poly('#e87a5a', [2, 5, 3.2, 4.6, 3.6, 8, 2.4, 8.2]);
      }
    },
    salsotto: {
      sphere(p) {
        orb(p, 16, 15.4, 12.4, PL.sa, D(PL.sa, 0.4), () => {
          p.poly(PL.sun, [0, 0, 18, 0, 10, 32, 0, 32]);
          p.poly(PL.sunL, [0, 6, 10, 0, 14, 0, 4, 20, 0, 22]);
          p.poly('#ffffff', [0, 9, 5, 4, 7, 6, 1, 15]);
          p.poly(PL.saL, [18, 0, 21, 0, 13, 32, 10, 32]);
          fine(p, () => { for (const [x, y] of [[22, 6], [26, 10], [24, 22], [20, 25]]) p.rect('#ffffff', x, y, 0.8, 0.8); });
        });
        p.poly('#2a2440', [0.6, 18.4, 31.4, 13, 31.6, 16.4, 1, 21.6]);
        p.poly(PL.silD, [0.6, 18.4, 31.4, 13, 31.4, 14.2, 0.8, 19.6]);
        for (let i = 0; i < 8; i++) p.rect('#ffd070', 3 + i * 3.4, 18.2 - i * 0.6, 1.4, 1);
        p.poly(PL.silD, [14, 28, 18, 28, 16, 31.6]);
      },
      rope(p) {
        const path = curve([5, 4, 3, 11, 9, 15, 20, 10, 27, 14, 26, 22, 18, 21, 15, 27], 6);
        thick(p, D(PL.lav, 0.4), path.map((v, i) => v + (i % 2 ? 0.7 : 0.3)), 2.6);
        thick(p, PL.lav, path, 2.4);
        thick(p, PL.silver, path.map((v, i) => v + (i % 2 ? -0.7 : -0.3)), 0.8);
        fine(p, () => { for (let i = 6; i < path.length - 2; i += 12) p.poly(D(PL.lav, 0.3), slab(path[i] - 1, path[i + 1] - 1, path[i] + 1, path[i + 1] + 1, 0.3)); });
        p.rect(PL.silD, 12.4, 11.6, 3, 2.2); p.rect(PL.silver, 12.8, 12, 2.2, 1.4);
        p.ell(D(PL.gold, 0.3), 15.4, 27.6, 3.4, 3.2);
        p.ell(PL.gold, 15, 27.2, 3, 2.8);
        p.ell(L(PL.gold, 0.3), 14.2, 26.4, 1.2, 0.8);
        for (const [x, y, r] of [[2, 1.6, -0.9], [5.6, 0.6, -0.3], [9, 1.6, 0.4]]) { p.ell(PL.shell, x, y, 1.2, 3, r); }
        p.ell(PL.silD, 5.4, 4.6, 3, 3);
        p.ell(PL.silver, 5.2, 4.4, 2.6, 2.6);
        G.iconHelp.hole(p, 5.2, 4.4, 1.4, 1.4);
        p.ell(PL.gold, 6.4, 2.4, 1, 1);
      }
    }
  };

  for (const [set, slots] of Object.entries(PIECES)) G.RELIC_PIECE[set] = slots;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
