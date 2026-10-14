(function (S) {
  'use strict';
  const { C } = S;
  const A = S.art202 = {};
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;

  A.portal = function (P, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    const pulse = Math.sin(t * 4) * 3;
    const r = 26 + pulse;
    P.part(P.poly([x, y - r * 1.3, x - r, y + r * 0.8, x + r, y + r * 0.8]), C.sky, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.poly([x, y - (r - 6) * 1.3, x - (r - 6), y + (r - 6) * 0.8, x + (r - 6), y + (r - 6) * 0.8]), C.night, { b: 2, sh: 0 });
    for (let i = 0; i < 6; i++) {
      const a = t * 3 + i * TAU / 6;
      const d = 8 + (i % 3) * 5;
      P.px(x + Math.cos(a) * d, y + Math.sin(a) * d, C.neonB);
      P.px(x + Math.cos(-a) * (d + 3), y + Math.sin(-a) * (d + 3), C.neonA);
    }
  };

  A.fountainGrotto = function (P, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    P.part(P.ell(x, y, 48, 20), C.stone, { b: 3 });
    P.part(P.ell(x, y - 2, 40, 15), C.sky, { b: 2, sh: 0 });
    for (let i = 0; i < 5; i++) {
      const bx = x - 20 + i * 10 + Math.sin(t * 3 + i) * 3;
      const by = y - 3 + Math.cos(t * 4 + i) * 2;
      P.px(bx, by, C.grey[5]);
      P.px(bx, by - 1, C.neonB);
    }
    P.part(P.path(`M ${x - 4} ${y - 18} Q ${x} ${y - 32} ${x + 4} ${y - 18} Z`), C.sky, { b: 4, sh: 0, hi: 0 });
  };

  A.volcanoAltar = function (P, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    P.part(P.poly([x - 30, y, x + 30, y, x + 24, y - 24, x - 24, y - 24]), C.stone, { b: 3 });
    P.part(P.rect(x - 26, y - 28, 52, 6), C.stone, { b: 4 });
    const glow = Math.sin(t * 5) > 0 ? C.neonA : C.orange[3];
    P.line(x - 20, y - 21, x + 20, y - 21, glow);
    P.line(x - 16, y - 12, x + 16, y - 12, glow);
  };

  A.tikiTorch = function (P, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    P.part(P.rect(x - 2, y - 40, 4, 40), C.wood, { b: 2 });
    P.part(P.poly([x - 5, y - 40, x + 5, y - 40, x + 3, y - 48, x - 3, y - 48]), C.wood, { b: 3 });
    const f = Math.sin(t * 12) * 2;
    P.part(P.ell(x + f, y - 53, 4, 7), C.yellow, { b: 3, sh: 0 });
    P.part(P.ell(x + f * 0.6, y - 52, 2.5, 4.5), C.red, { b: 2, sh: 0 });
  };

  A.palmTree = function (P, x, y) {
    P.part(P.path(`M ${x - 5} ${y} Q ${x - 12} ${y - 50} ${x - 3} ${y - 100} L ${x + 4} ${y - 100} Q ${x - 4} ${y - 50} ${x + 5} ${y} Z`), C.wood, { b: 3 });
    for (const d of [-1, 1]) {
      P.part(P.path(`M ${x} ${y - 98} Q ${x + d * 35} ${y - 110} ${x + d * 55} ${y - 85} Q ${x + d * 30} ${y - 95} ${x} ${y - 98} Z`), C.green, { b: 3 });
      P.part(P.path(`M ${x} ${y - 98} Q ${x + d * 25} ${y - 125} ${x + d * 40} ${y - 115} Q ${x + d * 20} ${y - 110} ${x} ${y - 98} Z`), C.green, { b: 3 });
    }
    P.part(P.ell(x - 4, y - 96, 4, 4), C.wood, { b: 2 });
    P.part(P.ell(x + 3, y - 95, 4, 4), C.wood, { b: 2 });
  };

  A.surfboard = function (P, x, y) {
    P.part(P.poly([x - 6, y, x + 6, y, x + 5, y - 45, x, y - 56, x - 5, y - 45]), C.yellow, { b: 3 });
    P.line(x, y, x, y - 54, C.red[3]);
    P.line(x - 3, y - 20, x + 3, y - 20, C.sky[3]);
  };

  A.seismicDevice = function (P, x, y, o) {
    o = o || {};
    const t = o.t || 0;
    P.part(P.rect(x - 10, y - 18, 20, 18), C.night, { b: 2 });
    P.part(P.ell(x, y - 10, 6, 6), C.sky, { b: 2, sh: 0 });
    P.line(x - 6, y - 24, x + 6, y - 24, C.grey[5]);
    P.line(x, y - 18, x, y - 26, C.grey[5]);
    if (Math.sin(t * 8) > 0) P.px(x, y - 27, C.neonA);
  };

  COSTUMES.portal22 = {
    h: 60, w: 60,
    draw(P, o) { A.portal(P, 0, -30, o); }
  };

  COSTUMES.fountain22 = {
    h: 50, w: 96,
    draw(P, o) { A.fountainGrotto(P, 0, -10, o); }
  };

  COSTUMES.altar22 = {
    h: 50, w: 70,
    draw(P, o) { A.volcanoAltar(P, 0, -12, o); }
  };

  COSTUMES.tiki22 = {
    h: 64, w: 20,
    draw(P, o) { A.tikiTorch(P, 0, 0, o); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
