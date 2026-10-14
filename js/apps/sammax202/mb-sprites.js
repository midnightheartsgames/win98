(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;

  function moaiBase(P, x, y, kind, o) {
    const St = C.stone;
    P.part(P.path(`M ${x - 22} ${y + 24} L ${x - 20} ${y - 28} Q ${x} ${y - 38} ${x + 20} ${y - 28} L ${x + 22} ${y + 24} Z`), St, { b: 3 });
    P.part(P.rect(x - 18, y - 22, 36, 6), St, { b: 2, sh: 0, hi: 0 });
    P.part(P.poly([x - 5, y - 16, x + 5, y - 16, x + 8, y + 6, x - 8, y + 6]), St, { b: 3, sh: 1 });
    P.part(P.rect(x - 9, y + 4, 18, 5), St, { b: 2 });
    if (kind === 'bernie') {
      P.line(x - 12, y - 12, x - 5, y - 14, C.stone[1]);
      P.line(x + 5, y - 14, x + 12, y - 12, C.stone[1]);
      P.px(x - 8, y - 10, C.pupil);
      P.px(x + 8, y - 10, C.pupil);
      P.curve(`M ${x - 9} ${y + 16} Q ${x} ${y + 11} ${x + 9} ${y + 16}`, C.stone[1]);
      if (!o.happy) {
        for (const ex of [-8, 8]) {
          P.line(x + ex, y - 8, x + ex, y + 26, C.sky[3]);
          P.line(x + ex - 1, y + 2, x + ex - 1, y + 26, C.sky[4]);
        }
      }
    } else if (kind === 'billy') {
      P.line(x - 12, y - 15, x - 5, y - 13, C.stone[1]);
      P.line(x + 5, y - 13, x + 12, y - 15, C.stone[1]);
      P.px(x - 8, y - 11, C.pupil);
      P.px(x + 8, y - 11, C.pupil);
      if (o.serious) {
        P.line(x - 8, y + 15, x + 8, y + 15, C.stone[1]);
      } else {
        P.part(P.ell(x, y + 15, 8, 5), C.night, { b: 1, sh: 0, hi: 0 });
        P.curve(`M ${x - 9} ${y + 13} Q ${x} ${y + 20} ${x + 9} ${y + 13}`, C.stone[2]);
      }
    } else {
      P.line(x - 12, y - 14, x - 4, y - 14, C.stone[1]);
      P.line(x + 4, y - 14, x + 12, y - 14, C.stone[1]);
      P.px(x - 8, y - 11, C.pupil);
      P.px(x + 8, y - 11, C.pupil);
      if (o.talk) P.part(P.ell(x, y + 15, 6, 3), C.night, { b: 1, sh: 0, hi: 0 });
      else P.line(x - 8, y + 15, x + 8, y + 15, C.stone[1]);
    }
  }

  COSTUMES.moai_bernie = {
    h: 80, w: 60,
    draw(P, o) { moaiBase(P, 0, -40, 'bernie', o); }
  };

  COSTUMES.moai_billy = {
    h: 80, w: 60,
    draw(P, o) { moaiBase(P, 0, -40, 'billy', o); }
  };

  COSTUMES.moai_mort = {
    h: 80, w: 60,
    draw(P, o) { moaiBase(P, 0, -40, 'mort', o); }
  };

  COSTUMES.pedro22 = {
    h: 68, w: 38,
    draw(P, o) {
      const act = o.act || '';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-4 - w * 2, -14, -5 - w * 3, -2, 2.5, 2.2), C.night, { b: 2 });
      P.part(P.cap(4 + w * 2, -14, 5 + w * 3, -2, 2.5, 2.2), C.night, { b: 3 });
      P.part(P.ell(0, -25, 10, 13), C.night, { b: 2 });
      P.part(P.rect(-8, -32, 16, 12), C.night, { b: 2 });
      P.part(P.rect(-2, -32, 4, 12), C.grey, { b: 5, sh: 0 });
      P.part(P.ell(0, -31, 3, 2), C.red, { b: 3, sh: 0 });
      P.part(P.rect(-8, -20, 16, 2), C.red, { b: 3, sh: 0 });
      P.part(P.ell(0, -42, 6, 6), C.skin, { b: 3 });
      P.part(P.path('M -5 -38 Q 0 -36 5 -38 Q 6 -40 4 -40 Q 0 -38 -4 -40 Z'), C.night, { b: 1 });
      for (const ex of [-2, 2]) P.px(ex, -43, C.pupil);
      if (o.talk) P.part(P.ell(0, -39, 2, 1.2), C.red, { b: 1, sh: 0, hi: 0 });
      P.part(P.ell(0, -48, 16, 3.5), C.sand, { b: 3 });
      P.part(P.poly([-8, -48, 8, -48, 5, -57, -5, -57]), C.sand, { b: 4 });
      P.part(P.rect(-6, -50, 12, 2), C.red, { b: 3, sh: 0 });
      let la = [-8, -23], ra = [8, -23];
      if (act === 'trumpet' || !act) {
        la = [-6, -38]; ra = [14, -36];
        P.part(P.poly([10, -37, 24, -39, 26, -44, 26, -34]), C.gold, { b: 4, sh: 0 });
        P.part(P.rect(6, -38, 10, 3), C.gold, { b: 3 });
      }
      P.part(P.cap(-6, -30, la[0], la[1], 2.2, 1.8), C.night, { b: 2 });
      P.part(P.cap(6, -30, ra[0], ra[1], 2.2, 1.8), C.night, { b: 3 });
      P.part(P.ell(la[0], la[1], 2, 2), C.skin, { b: 3, sh: 0 });
      P.part(P.ell(ra[0], ra[1], 2, 2), C.skin, { b: 3, sh: 0 });
    }
  };

  COSTUMES.bjimmy22 = {
    h: 34, w: 22,
    draw(P, o) {
      P.part(P.ell(0, -10, 8, 9), C.grey, { b: 2 });
      P.part(P.rect(-7, -8, 14, 8), C.grey, { b: 5, sh: 0 });
      P.part(P.rect(-6, -3, 12, 3), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.ell(0, -22, 6, 6), C.grey, { b: 3 });
      P.part(P.poly([-4, -26, -8, -32, -3, -27]), C.grey, { b: 3 });
      P.part(P.poly([4, -26, 8, -32, 3, -27]), C.grey, { b: 3 });
      P.part(P.ell(0, -20, 2, 1.5), C.rose, { b: 3, sh: 0 });
      P.part(P.rect(-1, -18, 2, 2.5), C.grey, { b: 5, sh: 0, hi: 0 });
      for (const ex of [-2, 2]) P.px(ex, -23, C.pupil);
      if (o.talk) P.part(P.ell(0, -17, 2, 1), C.red, { b: 1, sh: 0, hi: 0 });
      P.part(P.cap(5, -16, 12, -22, 1.6, 1.4), C.grey, { b: 3 });
      P.part(P.ell(13, -24, 4, 4), C.gold, { b: 4, sh: 0 });
    }
  };

  COSTUMES.mary22 = {
    h: 46, w: 24,
    draw(P, o) {
      P.part(P.poly([-7, -4, 7, -4, 4, -18, -4, -18]), C.rose, { b: 3 });
      P.part(P.rect(-4, -12, 8, 8), C.grey, { b: 5, sh: 0 });
      P.part(P.ell(0, -26, 5, 5), C.grey, { b: 3 });
      P.part(P.poly([-3, -30, -7, -35, -2, -30]), C.grey, { b: 3 });
      P.part(P.poly([3, -30, 7, -35, 2, -30]), C.grey, { b: 3 });
      for (const ex of [-2, 2]) P.px(ex, -27, C.pupil);
      P.part(P.ell(0, -24, 2, 1.4), C.rose, { b: 3, sh: 0 });
      if (o.talk) P.part(P.ell(0, -22, 1.8, 1), C.red, { b: 1, sh: 0, hi: 0 });
      P.part(P.cap(4, -16, 8, -14, 1.4, 1.2), C.grey, { b: 3 });
      P.part(P.ell(10, -14, 3, 2), C.sand, { b: 3 });
    }
  };

  COSTUMES.lincoln22 = {
    h: 96, w: 36,
    draw(P, o) {
      P.part(P.cap(-4, -28, -5, -4, 3.5, 3), C.night, { b: 2 });
      P.part(P.cap(4, -28, 5, -4, 3.5, 3), C.night, { b: 3 });
      P.part(P.rect(-8, -58, 16, 32), C.orange, { b: 3 });
      P.part(P.ell(-3, -48, 2, 2), C.yellow, { b: 4, sh: 0 });
      P.part(P.ell(3, -40, 2, 2), C.yellow, { b: 4, sh: 0 });
      P.part(P.ell(-2, -34, 2, 2), C.yellow, { b: 4, sh: 0 });
      P.part(P.ell(0, -68, 6.5, 8), C.skin, { b: 3 });
      P.part(P.path('M -6 -68 Q -7 -60 0 -58 Q 7 -60 6 -68 Z'), C.night, { b: 1 });
      for (const ex of [-2.5, 2.5]) P.px(ex, -70, C.pupil);
      P.part(P.rect(-1, -69, 2, 4), C.skin, { b: 4, sh: 0 });
      if (o.talk) P.part(P.ell(0, -63, 2.4, 1.4), C.red, { b: 1, sh: 0, hi: 0 });
      P.part(P.rect(-10, -78, 20, 2.5), C.night, { b: 1 });
      P.part(P.rect(-6, -96, 12, 18), C.night, { b: 2 });
    }
  };

  COSTUMES.sybil22 = {
    h: 72, w: 32,
    draw(P, o) {
      P.part(P.poly([-8, -6, 8, -6, 6, -34, -6, -34]), C.lilac, { b: 3 });
      P.part(P.ell(0, -42, 6, 6.5), C.skin, { b: 3 });
      P.part(P.ell(0, -45, 8, 4), C.wood, { b: 3 });
      for (const ex of [-2.5, 2.5]) P.px(ex, -43, C.pupil);
      P.part(P.rect(-4, -45, 8, 2), C.night, { b: 1, sh: 0 });
      if (o.talk) P.part(P.ell(0, -38, 2, 1.2), C.red, { b: 1, sh: 0, hi: 0 });
      P.part(P.cap(6, -30, 11, -24, 2, 1.6), C.skin, { b: 3 });
      P.part(P.rect(10, -28, 6, 8), C.oak, { b: 2 });
      P.part(P.rect(11, -27, 4, 6), C.grey, { b: 5, sh: 0, hi: 0 });
    }
  };

  COSTUMES.bosco22 = {
    h: 76, w: 36,
    draw(P, o) {
      P.part(P.rect(-10, -48, 20, 44), C.grey, { b: 4 });
      P.line(-9, -36, 9, -36, C.night);
      P.line(-9, -24, 9, -24, C.night);
      P.part(P.ell(0, -56, 8, 8), C.grey, { b: 4 });
      P.part(P.rect(-5, -59, 10, 4), C.sky, { b: 3, sh: 0 });
      P.line(0, -64, 0, -74, C.grey[5]);
      P.part(P.ell(0, -75, 2, 2), C.red, { b: 3, sh: 0 });
      if (o.talk) P.part(P.rect(-3, -53, 6, 2), C.night, { b: 1 });
    }
  };

  COSTUMES.stinky22 = {
    h: 70, w: 30,
    draw(P, o) {
      P.part(P.rect(-7, -42, 14, 38), C.night, { b: 2 });
      P.part(P.rect(-5, -38, 10, 30), C.grey, { b: 5, sh: 0 });
      P.part(P.ell(0, -49, 5.5, 6), C.skin, { b: 3 });
      P.part(P.ell(0, -52, 7, 3), C.night, { b: 1 });
      for (const ex of [-2, 2]) P.px(ex, -50, C.pupil);
      if (o.talk) P.part(P.ell(0, -45, 2, 1.2), C.red, { b: 1, sh: 0, hi: 0 });
    }
  };

  COSTUMES.gstinky22 = {
    h: 66, w: 32,
    draw(P, o) {
      P.part(P.rect(-8, -36, 16, 32), C.night, { b: 2 });
      P.part(P.ell(0, -46, 6, 6.5), C.skin, { b: 3 });
      P.part(P.path('M -5 -46 Q 0 -38 5 -46 Z'), C.grey, { b: 5 });
      for (const ex of [-2, 2]) P.px(ex, -48, C.pupil);
      if (o.talk) P.part(P.ell(0, -42, 2, 1.2), C.red, { b: 1, sh: 0, hi: 0 });
      P.part(P.rect(-7, -54, 14, 4), C.night, { b: 1 });
      P.part(P.rect(-6, -58, 12, 5), C.night, { b: 2 });
      P.part(P.rect(-1, -56, 2, 2), C.gold, { b: 4, sh: 0 });
    }
  };

  COSTUMES.spatula22 = {
    h: 48, w: 36,
    draw(P, o) {
      P.part(P.poly([-12, -4, 12, -4, 8, -14, -8, -14]), C.gold, { b: 3 });
      P.part(P.ell(0, -26, 14, 14), C.sky, { b: 4, sh: 0 });
      P.part(P.ell(0, -25, 6, 4), C.neonA, { b: 3, sh: 0 });
      P.part(P.poly([4, -25, 9, -28, 9, -22]), C.neonA, { b: 2, sh: 0 });
      P.px(-2, -26, C.pupil);
      if (Math.floor((o.t || 0) * 4) % 2) {
        P.px(2, -32, C.grey[5]);
        P.px(-1, -36, C.grey[5]);
      }
    }
  };

  COSTUMES.moai_feet = {
    h: 54, w: 90,
    draw(P, o) {
      const St = C.stone;
      P.part(P.rect(-40, -18, 36, 18), St, { b: 2 });
      P.part(P.rect(4, -18, 36, 18), St, { b: 2 });
      for (let i = 0; i < 4; i++) {
        P.part(P.ell(-34 + i * 8, -2, 4, 3.5), St, { b: 3 });
        P.part(P.ell(10 + i * 8, -2, 4, 3.5), St, { b: 3 });
      }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
