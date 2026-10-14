(function (S) {
  'use strict';
  const { C } = S;
  const COSTUMES = S.COSTUMES;
  const TAU = Math.PI * 2;
  const HUGH_SKIN = { '': C.skin, red: C.red, green: C.slime, blue: C.sky };

  function lordHead(P, x, y, o) {
    S.art.boscoHead(P, x, y, o);
    P.part(P.path(`M ${x - 8} ${y + 5.5} Q ${x - 4} ${y + 3} ${x} ${y + 5} Q ${x + 4} ${y + 3} ${x + 8} ${y + 5.5} Q ${x + 10.5} ${y + 3.5} ${x + 11} ${y + 1.5} Q ${x + 9} ${y + 7.5} ${x + 4} ${y + 7} Q ${x} ${y + 7.4} ${x - 4} ${y + 7} Q ${x - 9} ${y + 7.5} ${x - 11} ${y + 1.5} Q ${x - 10.5} ${y + 3.5} ${x - 8} ${y + 5.5} Z`), C.night, { b: 1, sh: 0, hi: 1 });
    P.part(P.ell(x + 4.5, y, 3.1, 3.1), C.grey, { b: 5, sh: 0, hi: 0, ol: C.gold[3] });
    if (!o.blink) P.px(x + 4.5, y, C.pupil);
    P.curve(`M ${x + 7.4} ${y + 1} Q ${x + 10} ${y + 8} ${x + 8} ${y + 16}`, C.gold[3]);
    if (o.act !== 'bow') {
      P.part(P.ell(x, y - 9.5, 14, 3.2), C.night, { b: 1, sh: 0 });
      P.part(P.path(`M ${x - 9} ${y - 10} Q ${x - 10} ${y - 22} ${x} ${y - 22.5} Q ${x + 10} ${y - 22} ${x + 9} ${y - 10} Z`), C.night, { b: 1 });
      P.part(P.rect(x - 9, y - 13.5, 18, 2.6), C.grey, { b: 2, sh: 0, hi: 0 });
    }
  }

  COSTUMES.lord = {
    h: 92, w: 44,
    draw(P, o) {
      const act = o.act || '';
      const K = C.dskin;
      P.part(P.cap(-6, -27, -6.5, -4, 4.5, 4), C.sand, { b: 1, sh: 1 });
      P.part(P.cap(6, -27, 6.5, -4, 4.5, 4), C.sand, { b: 1, sh: 1 });
      P.part(P.ell(-7, -2, 5, 2.4), C.oak, { b: 0, sh: 0 });
      P.part(P.ell(7, -2, 5, 2.4), C.oak, { b: 0, sh: 0 });
      const coat = P.path('M -16 -53 Q -22 -40 -17 -22 L 17 -22 Q 22 -40 16 -53 Z');
      P.part(coat, C.olive, { b: 3 });
      coat.each((x, y) => { if (((x - P.X(0) + 64) % 5 === 0 || (y + 64) % 5 === 0) && P.b.px[y * P.b.w + x] !== C.black) P.b.set(x, y, C.olive[1]); });
      P.part(P.poly([-5, -53, 5, -53, 0, -40]), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.poly([-3.5, -51, 0, -49, 3.5, -51, 3.5, -47, 0, -49, -3.5, -47]), C.red, { b: 3, sh: 0, hi: 0 });
      P.line(0, -40, 0, -24, C.olive[1]);
      for (const by of [-36, -30]) P.px(1.5, by, C.gold[3]);
      P.part(P.rect(-4, -58, 8, 5), K, { b: 2, sh: 0 });
      const arm = (sx, ex, ey) => {
        P.part(P.cap(sx, -49, (sx + ex) / 2, (-49 + ey) / 2, 3.8, 3.4), C.olive, { b: 3, sh: 1 });
        P.part(P.cap((sx + ex) / 2, (-49 + ey) / 2, ex, ey, 3.2, 2.8), C.olive, { b: 3, sh: 1 });
        P.part(P.ell(ex, ey + 1, 3.4, 3), K, { b: 3, sh: 1 });
      };
      if (act === 'give') { arm(-15, -30, -40); arm(15, 19, -29); }
      else if (act === 'point') { arm(-15, -19, -29); arm(15, 24, -64); }
      else if (act === 'shrug') { arm(-15, -24, -48); arm(15, 24, -48); }
      else if (act === 'bow') { arm(-15, -19, -29); arm(15, 22, -44); }
      else { arm(-15, -19, -29); arm(15, 19, -29); }
      if (act === 'bow') {
        P.part(P.ell(24, -52, 9, 2.4), C.night, { b: 1, sh: 0 });
        P.part(P.path('M 17 -52 Q 17 -62 24 -62.5 Q 31 -62 31 -52 Z'), C.night, { b: 1 });
      }
      lordHead(P, 0, act === 'bow' ? -64 : -66, o);
    }
  };

  function ratHead(P, x, y, o, bald) {
    const R = C.rat;
    P.part(P.ell(x - 2.5, y - 3.5, 2.2, 2.4), R, { b: 2, sh: 1 });
    P.part(P.ell(x, y, 4.4, 3.8), R, { b: 3 });
    if (bald) P.part(P.path(`M ${x - 3.6} ${y - 1.5} Q ${x - 1} ${y - 4.4} ${x + 3} ${y - 2.6} Q ${x} ${y - 1.4} ${x - 3.6} ${y - 1.5} Z`), C.pink, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.poly([x + 2, y - 2.6, x + 9.5, y + 0.2, x + 8.6, y + 2.3, x + 2, y + 3]), R, { b: 3, sh: 1 });
    P.part(P.ell(x + 9.2, y + 0.8, 1.3, 1.1), C.pink, { b: 3, sh: 0 });
    P.part(P.ell(x - 0.4, y - 4.3, 2.4, 2.8), R, { b: 3, sh: 1 });
    P.px(x - 0.4, y - 4, C.pink[3]);
    if (o.blink) P.px(x + 2.8, y - 1, C.black);
    else { P.px(x + 2.8, y - 1.3, C.pupil); P.px(x + 2.8, y - 0.4, C.pupil); P.px(x + 3.5, y - 1.3, C.eye); }
    P.line(x + 1, y - 2.4, x + 4, y - 1.8, C.black);
    P.line(x + 7, y + 1, x + 11.5, y - 1, R[1]);
    P.line(x + 7, y + 1.6, x + 11.5, y + 2.6, R[1]);
    if (o.talk) P.part(P.ell(x + 5.5, y + 3, 1.6, 0.9), C.red, { b: 1, sh: 0, hi: 0 });
    if (bald) P.px(x - 1, y - 2.5, C.pink[4]);
  }

  COSTUMES.skinrat = {
    h: 24, w: 16,
    draw(P, o) {
      const act = o.act || '';
      const R = C.rat;
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-4, -3, -13, -7 + w, 1, 0.6), C.pink, { b: 2, sh: 0 });
      P.part(P.cap(-1.5, -5, -2.5 - w * 2, -0.5, 1.4, 1.2), R, { b: 2, sh: 0 });
      P.part(P.cap(1.5, -5, 2.5 + w * 2, -0.5, 1.4, 1.2), R, { b: 3, sh: 0 });
      P.part(P.ell(-2.5 - w * 2, -0.4, 2, 0.9), C.pink, { b: 3, sh: 0 });
      P.part(P.ell(3.2 + w * 2, -0.4, 2, 0.9), C.pink, { b: 3, sh: 0 });
      P.part(P.ell(-0.5, -9, 4.8, 5.4, 0.15), C.grey, { b: 0 });
      P.line(0.6, -13, 1.6, -5, C.grey[2]);
      P.px(-2.5, -11, C.grey[3]); P.px(2.6, -10, C.grey[3]);
      const arm = act === 'grab' ? [7, -13] : act === 'cheer' ? [5, -19] : [5, -6 - w];
      P.part(P.cap(2, -11, arm[0], arm[1], 1.3, 1.1), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(arm[0] + 0.5, arm[1], 1.2, 1.1), C.pink, { b: 3, sh: 0 });
      ratHead(P, 2.8, -16.5, o, true);
    }
  };

  COSTUMES.ratcar = {
    h: 26, w: 52,
    draw(P, o) {
      const spin = o.anim || 0;
      P.part(P.path('M -24 -5 L -24 -12 Q -20 -15 -12 -15 L -6 -15 L -2 -21 L 10 -21 L 14 -15 L 22 -13 Q 26 -12 26 -8 L 26 -5 Z'), C.red, { b: 3 });
      for (const [fx, fy] of [[8, -10], [13, -9], [18, -8]]) P.part(P.poly([fx - 3, fy + 1, fx + 2, fy - 3, fx + 1, fy + 1]), C.orange, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.part(P.poly([-1, -20, 9, -20, 12, -15, -4, -15]), C.sky, { b: 3, sh: 0 });
      for (const [hx, hy, k] of [[-12, -19, 0], [-5, -22, 1], [3, -24, 2]]) {
        P.part(P.ell(hx, hy, 3.4, 3), k === 2 ? C.rat : C.pink, { b: 3 });
        P.part(P.poly([hx + 1.5, hy - 1.5, hx + 6.5, hy + 0.3, hx + 1.5, hy + 2]), C.rat, { b: 3, sh: 0 });
        P.px(hx + 1.6, hy - 1, C.pupil);
        P.part(P.ell(hx - 1.5, hy - 3, 1.6, 1.8), C.rat, { b: 3, sh: 0 });
      }
      P.part(P.rect(-21, -27, 5, 8), C.teal, { b: 3, sh: 0 });
      P.part(P.rect(-20.5, -29, 4, 2.2), C.grey, { b: 5, sh: 0 });
      for (const [wx, r] of [[-15, 6], [16, 4.6]]) {
        P.part(P.ell(wx, -4, r, r), C.grey, { b: 0 });
        P.part(P.ell(wx, -4, r * 0.45, r * 0.45), C.gold, { b: 3, sh: 0, hi: 0 });
        const a = spin * 0.9 + wx;
        P.line(wx + Math.cos(a) * r * 0.8, -4 + Math.sin(a) * r * 0.8, wx - Math.cos(a) * r * 0.8, -4 - Math.sin(a) * r * 0.8, C.grey[2]);
      }
      P.part(P.rect(-28, -9, 4, 2.5), C.grey, { b: 3, sh: 0 });
    },
    anim: o => o.walk >= 0 ? Math.floor(o.walk * 4) : 0
  };

  function directorHead(P, x, y, o) {
    const Hh = C.night;
    P.part(P.path(`M ${x - 8} ${y + 4} Q ${x - 9.5} ${y - 10} ${x} ${y - 10.5} Q ${x + 9.5} ${y - 10} ${x + 8} ${y + 4} L ${x + 5} ${y + 5} L ${x + 5} ${y - 3} L ${x - 5} ${y - 3} L ${x - 5} ${y + 5} Z`), Hh, { b: 2 });
    P.part(P.ell(x, y, 5.8, 7), C.skin, { b: 3 });
    P.part(P.path(`M ${x - 6.5} ${y - 2} Q ${x - 6} ${y - 9.5} ${x} ${y - 9} Q ${x + 6} ${y - 9.5} ${x + 6.5} ${y - 2} L ${x + 5.5} ${y - 4.5} L ${x + 2} ${y - 3.2} L ${x - 1} ${y - 4.6} L ${x - 4} ${y - 3.2} Z`), Hh, { b: 3 });
    for (const ex of [-2.6, 2.6]) {
      P.part(P.rect(x + ex - 2.3, y - 1.6, 4.6, 3.4), C.grey, { b: 5, sh: 0, hi: 0 });
      if (o.blink) P.line(x + ex - 1.2, y, x + ex + 1.2, y, C.black);
      else { P.px(x + ex, y - 0.4, C.pupil); P.px(x + ex, y + 0.5, C.pupil); }
    }
    P.px(x, y - 0.2, C.black);
    P.line(x, y + 1.5, x + 0.7, y + 3, C.skin[1]);
    if (o.talk) P.part(P.ell(x, y + 4.4, 2, 1.4), C.red, { b: 1, sh: 0, hi: 0 });
    else P.line(x - 1.8, y + 4.4, x + 1.8, y + 4.4, C.red[2]);
    P.curve(`M ${x - 7.5} ${y - 1} Q ${x - 9} ${y - 12} ${x} ${y - 12.5} Q ${x + 9} ${y - 12} ${x + 7.5} ${y - 1}`, C.grey[2]);
    P.part(P.ell(x + 7.5, y - 0.5, 1.8, 2.4), C.grey, { b: 1, sh: 0 });
    P.curve(`M ${x + 7} ${y + 1} Q ${x + 6} ${y + 5.5} ${x + 2.5} ${y + 5.2}`, C.grey[1]);
    P.part(P.ell(x + 2.5, y + 5.2, 0.9, 0.9), C.grey, { b: 0, sh: 0, hi: 0 });
  }

  COSTUMES.director = {
    h: 78, w: 30,
    draw(P, o) {
      const act = o.act || '';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-3, -30, -3.5 - w * 3, -4, 2.8, 2.3), C.stone, { b: 1, sh: 1 });
      P.part(P.cap(3, -30, 3.5 + w * 3, -4, 2.8, 2.3), C.stone, { b: 1, sh: 1 });
      P.part(P.ell(-4.5 - w * 3, -2, 3.4, 1.7), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(4.5 + w * 3, -2, 3.4, 1.7), C.grey, { b: 0, sh: 0 });
      P.part(P.path('M -8 -59 Q -10.5 -46 -8.5 -29 L 8.5 -29 Q 10.5 -46 8 -59 Z'), C.night, { b: 2 });
      P.line(-8, -31, 8, -31, C.night[3]);
      P.part(P.rect(-3.2, -64, 6.4, 6), C.night, { b: 3, sh: 0 });
      let la = [-11, -38], ra = [11, -37];
      if (act === 'write') { la = [-4, -45]; ra = [5, -44]; }
      if (act === 'clap') { la = [-9, -80]; ra = [9, -78]; }
      if (act === 'photo') { la = [-4, -68]; ra = [5, -68]; }
      if (act === 'point') ra = [20, -55];
      if (act === 'shout') { la = [-4, -70]; ra = [4, -70]; }
      P.part(P.cap(-7.5, -57, la[0], la[1], 2.1, 1.8), C.night, { b: 2, sh: 0 });
      P.part(P.cap(7.5, -57, ra[0], ra[1], 2.1, 1.8), C.night, { b: 2, sh: 0 });
      if (act === 'clap') {
        P.part(P.rect(-9, -89, 18, 10), C.grey, { b: 1 });
        P.part(P.poly([-9, -90, 9, -94, 9.5, -91.5, -8.5, -87.5]), C.grey, { b: 5, sh: 0 });
        for (let i = 0; i < 4; i++) P.line(-6 + i * 4.5, -89.5 - i, -4 + i * 4.5, -90.2 - i, C.black);
        P.line(-7, -83, 7, -83, C.grey[4]);
      } else if (act === 'photo') {
        P.part(P.rect(-6, -73, 12, 9), C.grey, { b: 4 });
        P.part(P.ell(0, -69, 3, 3), C.grey, { b: 0, sh: 0 });
        P.part(P.ell(0, -69, 1.4, 1.4), C.sky, { b: 3, sh: 0, hi: 0, ol: 0 });
        P.part(P.rect(3, -72.5, 2, 1.5), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      } else if (act !== 'shout') {
        P.part(P.poly([la[0] - 5, la[1] - 7, la[0] + 4, la[1] - 8, la[0] + 5, la[1] + 5, la[0] - 4, la[1] + 6]), C.oak, { b: 3 });
        P.part(P.poly([la[0] - 3.5, la[1] - 5, la[0] + 3, la[1] - 5.8, la[0] + 3.6, la[1] + 4, la[0] - 2.8, la[1] + 4.4]), C.grey, { b: 5, sh: 0, hi: 0 });
        for (let i = 0; i < 3; i++) P.line(la[0] - 2, la[1] - 3 + i * 2.4, la[0] + 2.5, la[1] - 3.4 + i * 2.4, C.grey[2]);
      }
      if (act !== 'photo' && act !== 'clap') {
        P.part(P.ell(la[0], la[1] + 1, 2, 1.9), C.skin, { b: 3, sh: 0 });
        P.part(P.ell(ra[0], ra[1] + 1, 2, 1.9), C.skin, { b: 3, sh: 0 });
      }
      if (act === 'write') P.line(ra[0], ra[1], ra[0] - 3, ra[1] - 5, C.yellow[3]);
      directorHead(P, 0, act === 'photo' ? -76 : -71, o);
    }
  };

  function chickenHead(P, x, y, o, featherly) {
    const F = C.cream;
    P.part(P.path(`M ${x - 3} ${y - 7} Q ${x - 2} ${y - 11} ${x} ${y - 9} Q ${x + 1} ${y - 12} ${x + 3} ${y - 9.5} Q ${x + 5} ${y - 11} ${x + 5} ${y - 7} Z`), C.red, { b: 3, sh: 0 });
    P.part(P.ell(x, y - 2, 5.5, 6.5), F, { b: 3 });
    const open = o.talk || o.act === 'shock' || o.act === 'eat';
    P.part(P.poly([x + 4, y - 3.5, x + 10.5, y - 1.5, x + 4.5, y + (open ? -0.8 : 0.2)]), C.orange, { b: 3, sh: 0 });
    if (open) P.part(P.poly([x + 4.5, y + 0.4, x + 9, y + 1.8, x + 4, y + 2.4]), C.orange, { b: 2, sh: 0 });
    P.part(P.ell(x + 4.8, y + 3.4, 1.4, 2.2), C.red, { b: 3, sh: 0 });
    if (o.blink) P.line(x + 0.6, y - 3, x + 3, y - 3, C.black);
    else if (o.act === 'shock') { P.part(P.ell(x + 1.8, y - 3, 1.8, 1.8), C.eye, { sh: 0, hi: 0 }); P.px(x + 1.8, y - 3, C.pupil); }
    else { P.px(x + 1.8, y - 3.4, C.pupil); P.px(x + 1.8, y - 2.5, C.pupil); P.px(x + 1.1, y - 3.4, C.eye); }
    if (featherly) {
      P.part(P.ell(x + 1.8, y - 3, 2.4, 2.1), C.eye, { sh: 0, hi: 0, ol: C.grey[1] });
      if (!o.blink) P.px(x + 2.2, y - 3, C.pupil);
      P.line(x - 0.6, y - 3.4, x - 4.5, y - 4.4, C.grey[1]);
    }
  }

  COSTUMES.philo = {
    h: 52, w: 26,
    draw(P, o) {
      const act = o.act || '';
      const F = C.cream;
      const fe = o.v === 'featherly';
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      const bob = act === 'eat' ? 6 : 0;
      P.part(P.cap(-2, -11, -3 - w * 2, -1, 0.9, 0.8), C.orange, { b: 3, sh: 0 });
      P.part(P.cap(2, -11, 3 + w * 2, -1, 0.9, 0.8), C.orange, { b: 3, sh: 0 });
      for (const [fx, s] of [[-3 - w * 2, -1], [3 + w * 2, 1]]) { P.line(fx, -0.5, fx + 2.5 * s, -0.2, C.orange[2]); P.line(fx, -0.5, fx - 1 * s, 0.2, C.orange[2]); }
      P.part(P.path('M -9 -24 Q -12 -30 -10 -34 Q -8 -31 -6 -30 Z'), F, { b: 2, sh: 0 });
      const puff = act === 'shock' ? 1.8 : 0;
      P.part(P.ell(0, -18, 8 + puff, 8.5 + puff), F, { b: 3 });
      if (fe) {
        P.part(P.path('M -7 -24 Q -9 -16 -6 -10 L 6 -10 Q 9 -16 7 -24 Q 0 -27 -7 -24 Z'), C.olive, { b: 3 });
        P.line(0, -25, 0, -11, C.olive[1]);
        for (const by of [-21, -17, -13]) P.px(0.8, by, C.gold[3]);
        P.part(P.poly([-3, -27.5, 0, -26, 3, -27.5, 3, -24.5, 0, -26, -3, -24.5]), C.red, { b: 3, sh: 0, hi: 0 });
      }
      let wing = [8, -16];
      if (act === 'pull') wing = [16, -18];
      if (act === 'bow') wing = [9, -24];
      if (act === 'shock') wing = [13, -27];
      if (act === 'eat') wing = [10, -15];
      P.part(P.path(`M 3 -22 Q ${wing[0] + 4} ${wing[1] - 3} ${wing[0] + 2} ${wing[1] + 3} Q ${wing[0] - 3} ${wing[1] + 5} 2 -14 Z`), fe ? C.olive : F, { b: fe ? 3 : 2, sh: 1 });
      if (act === 'shock') P.part(P.path('M -3 -22 Q -16 -30 -14 -21 Q -10 -16 -2 -15 Z'), fe ? C.olive : F, { b: 2, sh: 1 });
      P.part(P.cap(0, -25, 1.5 + bob * 0.4, -30 + bob, 3, 2.4), F, { b: 3, sh: 1 });
      chickenHead(P, 2 + bob * 0.6, -34 + bob, o, fe);
    }
  };

  function cowHead(P, x, y, o) {
    const W = C.grey;
    const moo = o.act === 'moo';
    P.part(P.poly([x - 3, y - 7, x - 8, y - 12, x - 6.5, y - 13.5, x - 1.5, y - 8.5]), C.cream, { b: 4, sh: 0 });
    P.part(P.poly([x + 3, y - 8, x + 6, y - 14, x + 7.8, y - 13, x + 5.5, y - 7]), C.cream, { b: 4, sh: 0 });
    P.part(P.ell(x - 6.5, y - 5, 3.8, 2, -0.5), W, { b: 4, sh: 0 });
    P.part(P.ell(x, y - 2, 6.5, 7.5, 0.25), W, { b: 5 });
    P.part(P.ell(x - 2.5, y - 5, 2.6, 3, 0.4), C.night, { b: 1, sh: 0, hi: 0 });
    P.part(P.ell(x + 4.5, y + 3.5 + (moo ? 1 : 0), 5, 4, 0.35), C.pink, { b: 3 });
    P.px(x + 3, y + 3, C.pink[1]); P.px(x + 6.5, y + 3.8, C.pink[1]);
    if (moo) P.part(P.ell(x + 5, y + 6.8, 3, 1.5), C.red, { b: 1, sh: 0, hi: 0 });
    if (o.blink) P.line(x + 1, y - 4, x + 3.5, y - 4, C.black);
    else { P.part(P.ell(x + 2.4, y - 4, 1.6, 1.8), C.eye, { sh: 0, hi: 0 }); P.px(x + 2.8, y - 3.8, C.pupil); }
    P.line(x + 0.8, y - 6.6, x + 3.8, y - 6.2, C.grey[2]);
  }

  COSTUMES.bessy = {
    h: 50, w: 64,
    draw(P, o) {
      const W = C.grey;
      const v = o.v || '';
      const chew = o.anim ? 0.6 : 0;
      for (const [lx, b] of [[-17, 3], [-11, 4], [11, 3], [17, 4]]) {
        P.part(P.cap(lx, -16, lx + (lx > 0 ? 0.5 : -0.5), -3, 2.4, 2), W, { b, sh: 1 });
        P.part(P.rect(lx - 2.2, -3.4, 4.4, 3.4), C.night, { b: 1, sh: 0 });
      }
      P.part(P.cap(-23, -24, -27, -12, 1, 0.8), W, { b: 3, sh: 0 });
      P.part(P.ell(-27.5, -10.5, 1.8, 2.6), C.night, { b: 1, sh: 0 });
      const body = P.path('M -24 -27 Q -25 -14 -18 -13 L 18 -13 Q 24 -14 23 -26 Q 20 -33 0 -33 Q -20 -33 -24 -27 Z');
      P.part(body, W, { b: 5 });
      for (const [sx, sy, rx, ry, r] of [[-13, -25, 6, 4.5, 0.3], [4, -28, 5, 3.5, -0.2], [12, -19, 4.5, 3.6, 0.6], [-4, -17, 3.4, 2.4, 0]]) {
        const m = P.ell(sx, sy, rx, ry, r).and(body);
        S.part(P.b, m, C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
      }
      S.outline(P.b, body, C.black);
      P.part(P.ell(4, -12.5, 5, 2.4), C.pink, { b: 3, sh: 0 });
      P.part(P.cap(18, -27, 24, -33 + chew, 4.5, 4), W, { b: 5, sh: 1 });
      P.part(P.rect(20, -29, 4, 3), C.gold, { b: 3, sh: 0 });
      P.part(P.ell(22, -24.5, 2, 2.2), C.gold, { b: 3, sh: 0 });
      cowHead(P, 27, -36 + chew, o);
      if (v === 'lampshade') {
        P.part(P.poly([19, -46, 34, -46, 31, -57, 22, -57]), C.cream, { b: 3 });
        for (let i = 0; i < 6; i++) P.line(19.5 + i * 2.8, -46, 19.5 + i * 2.8, -44, C.gold[3]);
        P.line(22, -52, 31, -52, C.red[3]);
      } else if (v === 'plate') {
        P.part(P.ell(26, -47, 8.5, 3), C.grey, { b: 5, sh: 0 });
        P.part(P.ell(26, -47, 5.5, 1.8), C.grey, { b: 4, sh: 0, hi: 0, ol: C.grey[3] });
        P.px(20, -51, C.yellow[4]); P.px(33, -50, C.yellow[4]); P.px(27, -52, C.yellow[4]);
      } else if (v === 'cream') {
        P.part(P.path('M 24 -33 Q 25 -24 30 -22 Q 35 -24 36 -31 Q 33 -27 30 -28 Q 27 -27 24 -33 Z'), C.grey, { b: 5, sh: 0 });
        P.part(P.ell(26, -30, 2.4, 2), C.grey, { b: 5, sh: 0, hi: 0 });
        P.part(P.ell(33, -30, 2.4, 2), C.grey, { b: 5, sh: 0, hi: 0 });
      }
    },
    anim: o => o.act === 'moo' ? 2 : Math.floor((o.t || 0) * 2.5) % 2
  };

  function hughHead(P, x, y, o) {
    const K = HUGH_SKIN[o.v || ''] || C.skin;
    P.part(P.path(`M ${x - 7} ${y + 6} Q ${x - 11} ${y - 4} ${x - 6} ${y - 11} Q ${x} ${y - 15} ${x + 6} ${y - 11} Q ${x + 11} ${y - 4} ${x + 7} ${y + 6} Q ${x + 5} ${y + 1} ${x} ${y + 1} Q ${x - 5} ${y + 1} ${x - 7} ${y + 6} Z`), C.hair, { b: 3 });
    P.part(P.ell(x, y - 1, 5.8, 8), K, { b: 3 });
    P.part(P.path(`M ${x - 6} ${y - 4} Q ${x} ${y - 13} ${x + 6} ${y - 4} Q ${x + 3} ${y - 8} ${x} ${y - 7.5} Q ${x - 3} ${y - 8} ${x - 6} ${y - 4} Z`), C.hair, { b: 4 });
    for (const ex of [-2.4, 2.4]) {
      if (o.blink || o.act === 'magic') P.curve(`M ${x + ex - 1.4} ${y - 2} Q ${x + ex} ${y - 3} ${x + ex + 1.4} ${y - 2}`, C.black);
      else { P.px(x + ex, y - 2.2, C.pupil); P.px(x + ex, y - 1.4, C.pupil); }
    }
    P.line(x, y - 1, x + 0.6, y + 1.6, K[1]);
    P.part(P.path(`M ${x - 3.4} ${y + 4} Q ${x} ${y + 12.5} ${x + 3.4} ${y + 4} Q ${x} ${y + 6} ${x - 3.4} ${y + 4} Z`), C.hair, { b: 3, sh: 0 });
    if (o.talk) P.part(P.ell(x, y + 3.6, 2.2, 1.2), C.red, { b: 1, sh: 0, hi: 0 });
    else P.curve(`M ${x - 2.4} ${y + 3.2} Q ${x} ${y + 4.6} ${x + 2.4} ${y + 3.2}`, C.black);
  }

  COSTUMES.hugh = {
    h: 84, w: 30,
    draw(P, o) {
      const act = o.act || '';
      const K = HUGH_SKIN[o.v || ''] || C.skin;
      const w = o.walk >= 0 ? Math.sin(o.walk * TAU) : 0;
      P.part(P.cap(-3.5, -32, -4 - w * 3, -4, 3, 2.6), C.cream, { b: 3, sh: 1 });
      P.part(P.cap(3.5, -32, 4 + w * 3, -4, 3, 2.6), C.cream, { b: 3, sh: 1 });
      P.part(P.ell(-5 - w * 3, -2, 3.6, 1.8), C.sand, { b: 2, sh: 0 });
      P.part(P.ell(5 + w * 3, -2, 3.6, 1.8), C.sand, { b: 2, sh: 0 });
      P.part(P.path('M -9 -64 Q -12 -50 -9.5 -30 L 9.5 -30 Q 12 -50 9 -64 Z'), C.cream, { b: 3 });
      P.part(P.poly([-3, -64, 3, -64, 0, -55]), K, { b: 3, sh: 0, hi: 0 });
      P.part(P.poly([-9, -60, -6, -63, 8, -34, 5, -31]), C.purple, { b: 3, sh: 0 });
      for (let i = 0; i < 4; i++) P.px(-5 + i * 3.2, -55 + i * 6.4, C.cycle[i * 2]);
      let la = [-12, -41], ra = [12, -41];
      if (act === 'magic') { la = [-17, -70]; ra = [17, -70]; }
      if (act === 'card') { la = [-5, -48]; ra = [6, -47]; }
      if (act === 'think') { ra = [4, -71]; }
      P.part(P.cap(-8.5, -61, la[0], la[1], 2.3, 2), C.cream, { b: 3, sh: 0 });
      P.part(P.cap(8.5, -61, ra[0], ra[1], 2.3, 2), C.cream, { b: 3, sh: 0 });
      P.part(P.ell(la[0], la[1] + 1, 2.1, 2), K, { b: 3, sh: 0 });
      P.part(P.ell(ra[0], ra[1] + 1, 2.1, 2), K, { b: 3, sh: 0 });
      if (act === 'magic') for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + (o.t || 0) * 2; P.px(Math.cos(a) * 16, -70 + Math.sin(a) * 6, C.cycle[i]); }
      if (act === 'card') { P.part(P.rect(-3, -54, 8, 6), C.grey, { b: 5, sh: 0 }); P.line(-1.5, -51.5, 3.5, -51.5, C.grey[2]); }
      P.part(P.rect(-2.2, -68, 4.4, 5), K, { b: 2, sh: 0 });
      hughHead(P, 0, -76, o);
    }
  };

  function myraHive(P, x, y) {
    const H = C.orchid;
    const tip = P.path(`M ${x - 4.6} ${y - 19.4} Q ${x - 1} ${y - 23.2} ${x + 1.6} ${y - 27} Q ${x + 5.2} ${y - 27.6} ${x + 6.8} ${y - 24.6} Q ${x + 5.4} ${y - 25} ${x + 4.4} ${y - 23.4} Q ${x + 5} ${y - 21} ${x + 3} ${y - 18.6} Z`);
    const dome = P.path(`M ${x - 8.6} ${y + 2.6} C ${x - 11.4} ${y - 2} ${x - 11.6} ${y - 10} ${x - 9.8} ${y - 15} C ${x - 7.8} ${y - 20.4} ${x - 3.6} ${y - 22.4} ${x + 0.2} ${y - 22.2} C ${x + 4.4} ${y - 22.2} ${x + 9.4} ${y - 20} ${x + 10.6} ${y - 14.2} C ${x + 11.8} ${y - 8} ${x + 11.4} ${y - 1.6} ${x + 8.8} ${y + 2.6} L ${x + 5} ${y - 2} L ${x - 5} ${y - 2} Z`);
    P.part(dome.union(tip), H, { b: 3 });
    P.curve(`M ${x - 10} ${y - 6} Q ${x - 8} ${y - 17} ${x + 0.4} ${y - 19.8} Q ${x + 3.6} ${y - 21} ${x + 4.4} ${y - 24}`, H[2]);
    P.curve(`M ${x + 10.4} ${y - 5} Q ${x + 10} ${y - 14} ${x + 3.8} ${y - 16.8}`, H[2]);
  }

  function myraFrizz(P, x, y) {
    const H = C.orchid;
    for (let i = -6; i <= 6; i++) {
      const tx = x + i * 2.2, ty = y - 26 + Math.abs(i) * 1.6 - (i % 2 ? 2.6 : 0);
      P.part(P.cap(x + i * 1.3, y - 4, tx, ty, 1.8, 1), H, { b: 3, sh: 0 });
      P.px(tx, ty, C.grey[1]);
    }
    P.part(P.ell(x, y - 5, 9.4, 6.4), H, { b: 3 });
    for (const [sx, sy] of [[-4, -30], [1, -32], [5, -30]]) P.px(x + sx, y + sy, C.grey[3]);
  }

  function myraHead(P, x, y, o) {
    const K = C.pale, H = C.orchid;
    const fried = o.act === 'fried' || o.act === 'frazzled';
    const faint = o.act === 'faint';
    if (fried) myraFrizz(P, x, y); else myraHive(P, x, y);
    P.part(P.ell(x, y + 1, 6.8, 9.1), K, { b: 3 });
    P.curve(`M ${x - 3.4} ${y + 8.2} Q ${x} ${y + 9.6} ${x + 3.4} ${y + 8.2}`, K[2]);
    P.part(P.path(`M ${x - 7.8} ${y - 1.6} Q ${x - 7.6} ${y - 8.4} ${x - 1} ${y - 9.4} Q ${x + 6.4} ${y - 9.6} ${x + 8.6} ${y - 1} Q ${x + 7} ${y - 4.4} ${x + 3.6} ${y - 5.4} Q ${x - 1.6} ${y - 6.6} ${x - 5} ${y - 6.4} Q ${x - 7} ${y - 6} ${x - 7.8} ${y - 1.6} Z`), H, { b: 3, ol: H[1] });
    for (const s of [-1, 1]) P.part(P.ell(x + s * 7.8, y + 5, 2.3, 2.3), H, { b: 3, sh: 1 });
    const ey = y - 2;
    const tiny = Math.abs(P.sx) < 0.6;
    for (const ex of [-2.9, 2.9]) {
      if (tiny) { P.px(x + ex, ey, faint || o.blink ? C.black : o.hypno ? C.cycle[Math.floor((o.t || 0) * 8 + ex) & 7] : C.green[2]); continue; }
      P.curve(`M ${x + ex - 2} ${ey - 3} Q ${x + ex} ${ey - 4.4} ${x + ex + 2.2} ${ey - 3.2}`, H[1]);
      if (faint || o.blink) P.line(x + ex - 1.6, ey, x + ex + 1.6, ey, C.black);
      else if (o.act === 'fried') { P.line(x + ex - 1.4, ey - 1.2, x + ex + 1.4, ey + 1.2, C.black); P.line(x + ex - 1.4, ey + 1.2, x + ex + 1.4, ey - 1.2, C.black); }
      else if (o.hypno) S.art.spiral(P, x + ex, ey, 2.2, o.t);
      else {
        P.part(P.ell(x + ex, ey, 2, 1.6), C.eye, { sh: 0, hi: 0 });
        P.part(P.ell(x + ex + 0.3, ey + 0.2, 1, 1.1), C.green, { b: 3, sh: 0, hi: 0, ol: 0 });
        P.px(x + ex + 0.3, ey + 0.2, C.pupil);
        P.curve(`M ${x + ex - 2.2} ${ey - 0.4} Q ${x + ex} ${ey - 2.2} ${x + ex + 2.2} ${ey - 0.4}`, H[1]);
      }
    }
    for (const s of [-1, 1]) P.part(P.ell(x + s * 4.4, y + 2.6, 1.5, 0.9), C.rose, { b: 4, sh: 0, hi: 0, ol: 0 });
    P.line(x + 0.6, y - 1, x + 1.3, y + 1.8, K[2]);
    P.part(P.ell(x + 1, y + 2.6, 1.6, 1.1), K, { b: 3, sh: 1, hi: 0, ol: K[1] });
    if (o.talk && !faint) {
      P.part(P.path(`M ${x - 4} ${y + 4.8} Q ${x} ${y + 3.8} ${x + 4} ${y + 4.8} Q ${x + 3} ${y + 9.4} ${x} ${y + 9.4} Q ${x - 3} ${y + 9.4} ${x - 4} ${y + 4.8} Z`), C.red, { b: 1, sh: 0, hi: 0 });
      P.line(x - 2.6, y + 5.6, x + 2.6, y + 5.6, C.eye);
    } else {
      P.part(P.path(`M ${x - 3.6} ${y + 5.2} Q ${x} ${y + 3.8} ${x + 3.6} ${y + 5.2} Q ${x} ${y + 8} ${x - 3.6} ${y + 5.2} Z`), C.rose, { b: 3, sh: 0, hi: 0 });
      P.line(x - 2.8, y + 5.4, x + 2.8, y + 5.4, C.rose[1]);
      P.px(x + 0.4, y + 6, C.eye);
    }
  }

  COSTUMES.myra = {
    h: 108, w: 40,
    draw(P, o) {
      const act = o.act || '';
      const K = C.pale, T = C.pistachio, H = C.orchid;
      const arm = (sx, sy, hx, hy) => {
        P.part(P.cap(sx, sy, hx, hy, 3.3, 2.7), T, { b: 3, sh: 0 });
        P.part(P.cap(sx + (hx - sx) * 0.78, sy + (hy - sy) * 0.78, hx, hy, 2.9, 2.8), T, { b: 2, sh: 0, hi: 0 });
        P.part(P.ell(hx, hy + 1, 2.5, 2.4), K, { b: 3, sh: 0 });
      };
      if (act === 'faint') {
        P.part(P.path('M -14 -40 Q -16 -26 -12 -12 L 12 -12 Q 16 -26 14 -40 Q 0 -44 -14 -40 Z'), T, { b: 3 });
        arm(-11, -38, -18, -30);
        arm(11, -38, 19, -32);
        myraHead(P, 2, -40, o);
        return;
      }
      P.part(P.ell(-6.2, -2.2, 4.6, 2.2), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(6.2, -2.2, 4.6, 2.2), C.grey, { b: 0, sh: 0 });
      P.part(P.path('M -14 -42 L 14 -42 Q 15.4 -34 12.6 -26 L 10 -3.6 L 1.8 -3.6 L 0.3 -25 L -1.8 -3.6 L -10 -3.6 L -12.6 -26 Q -15.4 -34 -14 -42 Z'), C.grey, { b: 1, sh: 1 });
      P.part(P.path('M -15 -65 Q -18.5 -52 -15 -41 L 15 -41 Q 18.5 -52 15 -65 Q 8 -69 0 -69 Q -8 -69 -15 -65 Z'), T, { b: 3 });
      for (const s of [-1, 1]) {
        P.part(P.ell(s * 5.6, -55.5, 6.2, 5.4), T, { b: 3, sh: 1, hi: 1, ol: 0 });
        P.curve(`M ${s * 11} -52 Q ${s * 5.6} -49 ${s * 0.6} -51.4`, T[1]);
      }
      P.part(P.rect(-14.6, -44, 29.2, 3.4), T, { b: 2, sh: 0, hi: 0 });
      for (let rx = -12; rx <= 12; rx += 2) P.line(rx, -43.5, rx, -41.2, T[1]);
      P.part(P.rect(-4.8, -74, 9.6, 8.4), T, { b: 3, sh: 1 });
      for (const rx of [-3, -1, 1, 3]) P.line(rx, -73, rx, -66.4, T[2]);
      for (let i = 0; i <= 8; i++) {
        const u = i / 4 - 1, bx = u * 8.6, by = -66.2 + (1 - u * u) * 4.6;
        if (Math.abs(u) < 0.4) P.part(P.ell(bx, by + 0.6, 0.9, 1.6, u * 0.8), H, { b: 3, sh: 0, hi: 0, ol: H[1] });
        else P.part(P.ell(bx, by, 1.3, 1.3), H, { b: 3, sh: 0, ol: H[1] });
      }
      P.part(P.path('M 0 -55.6 Q -3.4 -57.8 -2.6 -59.6 Q -1.4 -61 0 -59.6 Q 1.4 -61 2.6 -59.6 Q 3.4 -57.8 0 -55.6 Z'), H, { b: 4, sh: 0 });
      let la = [-17, -44], ra = [16, -46];
      if (act === 'gift') { la = [-22, -80]; ra = [22, -80]; }
      if (act === 'point') ra = [26, -64];
      if (act === 'up') ra = [12, -94];
      if (act === 'hug') { la = [-4, -58]; ra = [4, -60]; }
      if (act === 'wave') ra = [-24, -70];
      if (act === 'fried') { la = [-20, -52]; ra = [20, -52]; }
      arm(-12, -62, la[0], la[1]);
      arm(12, -62, ra[0], ra[1]);
      if (act !== 'fried' && act !== 'gift') {
        P.part(P.cap(ra[0], ra[1] + 1, ra[0] + 1, ra[1] - 6, 1.3), C.grey, { b: 1, sh: 0 });
        P.part(P.ell(ra[0] + 1.2, ra[1] - 7.5, 2.2, 2.4), C.grey, { b: 3, sh: 0 });
      }
      myraHead(P, 0, -80, o);
    }
  };

  COSTUMES.bear = {
    h: 22, w: 18,
    draw(P, o) {
      const B = C.blue;
      const fried = o.act === 'fried';
      const ramp = fried ? C.night : B;
      P.part(P.ell(-4, -3, 3, 2.4), ramp, { b: 3 });
      P.part(P.ell(4, -3, 3, 2.4), ramp, { b: 3 });
      P.part(P.ell(0, -8, 5.5, 5.5), ramp, { b: 3 });
      P.part(P.ell(0, -7, 3, 3), fried ? C.grey : C.sky, { b: 4, sh: 0, hi: 0 });
      P.part(P.ell(-6, -9, 2, 2.6), ramp, { b: 3, sh: 0 });
      P.part(P.ell(6, -9, 2, 2.6), ramp, { b: 3, sh: 0 });
      P.part(P.ell(-4.2, -19.5, 2.2, 2.2), ramp, { b: 3 });
      P.part(P.ell(4.2, -19.5, 2.2, 2.2), ramp, { b: 3 });
      P.part(P.ell(0, -15, 5.2, 4.8), ramp, { b: 3 });
      P.part(P.ell(0, -13.2, 2.4, 1.7), fried ? C.grey : C.sky, { b: 4, sh: 0, hi: 0 });
      P.px(0, -13.8, C.black);
      for (const ex of [-2.2, 2.2]) {
        if (fried) { P.px(ex - 0.6, -16.6, C.black); P.px(ex + 0.6, -15.4, C.black); P.px(ex + 0.6, -16.6, C.black); P.px(ex - 0.6, -15.4, C.black); }
        else { P.px(ex, -16, C.cycle[(o.anim || 0) % 8]); P.px(ex + 0.6, -16, C.cycle[((o.anim || 0) + 3) % 8]); P.px(ex, -15.4, C.cycle[((o.anim || 0) + 5) % 8]); }
      }
      if (!fried) P.part(P.poly([-3, -11, 0, -10, 3, -11, 3, -9, 0, -10, -3, -9]), C.red, { b: 3, sh: 0, hi: 0 });
      else {
        P.part(P.ell(3, -5, 2.4, 2), C.cream, { b: 4, sh: 0 });
        P.part(P.ell(-2, -21.5, 1.6, 1.4), C.cream, { b: 4, sh: 0 });
        P.px(-5, -22, C.grey[3]); P.px(6, -21, C.grey[3]);
      }
    },
    anim: o => o.act === 'fried' ? 0 : Math.floor((o.t || 0) * 5) % 8
  };

  function myraBust(P, depth) {
    const T = C.pistachio;
    const torso = P.path('M -15 15 Q -18.5 28 -15 39 L 15 39 Q 18.5 28 15 15 Q 8 11 0 11 Q -8 11 -15 15 Z').and(P.rect(-20, 0, 40, depth));
    P.part(torso, T, { b: 3, sh: 0 });
    P.part(P.rect(-4.8, 6, 9.6, 8.4), T, { b: 3, sh: 0 });
    for (let i = 0; i <= 6; i++) { const u = i / 3 - 1; P.part(P.ell(u * 8.2, 14 + (1 - u * u) * 4.4, 1.3, 1.3), C.orchid, { b: 3, sh: 0, hi: 0, ol: C.orchid[1] }); }
  }

  function myraBadge(b) {
    const P = new S.Pen(b);
    const H = C.orchid, K = C.pale;
    P.part(P.path('M 5 15 C 3 12 2.6 7 4.6 4.4 C 6.4 2 9.6 1.4 11.6 2 Q 13 0.2 16.4 0.4 Q 18.4 0.8 18.8 2.8 Q 17.8 2.2 16.8 2.8 C 19.8 4.4 21.2 8.4 20.4 11.6 C 20.2 13 19.8 14.4 19 15 L 16 10 L 8 10 Z'), H, { b: 3 });
    P.curve('M 5 11 Q 5.8 5 11.4 3.6 Q 14.4 3 15.6 1.6', H[2]);
    P.part(P.ell(12, 13.4, 4.9, 5.6), K, { b: 3 });
    P.part(P.path('M 7.2 12 Q 7.2 7.8 11 7.4 Q 15.6 7 17 11.4 Q 15.4 9.6 13.4 9.6 Q 10 9.4 7.2 12 Z'), H, { b: 3, ol: H[1] });
    P.part(P.ell(6.6, 15.6, 1.5, 1.5), H, { b: 4, sh: 0 });
    P.part(P.ell(17.6, 15.6, 1.5, 1.5), H, { b: 4, sh: 0 });
    for (const ex of [9, 14]) { b.set(ex, 11, H[1]); b.set(ex + 1, 11, H[1]); b.set(ex, 12, C.eye); b.set(ex + 1, 12, C.green[3]); }
    b.set(12, 13, K[1]); b.set(12, 14, K[1]);
    b.set(9, 14, C.rose[4]); b.set(15, 14, C.rose[4]);
    for (let mx = 10; mx <= 14; mx++) b.set(mx, 16, C.rose[2]);
    b.set(12, 17, C.eye);
  }

  function portrait(id) {
    const b = new S.Buf(24, 20);
    const o = { talk: false, blink: false };
    const put = (cos, pose, s, x, y) => { const sp = S.sprite(cos, pose, s); S.blit(b, sp.buf, x - sp.ox, y - sp.oy); };
    if (id === 'myra') myraBadge(b);
    else if (id === 'hugh') { const P = new S.Pen(b).at(12, 12, 0.85); hughHead(P, 0, 0, o); }
    else if (id === 'director') { const P = new S.Pen(b).at(12, 12, 0.95); directorHead(P, 0, 0, o); }
    else if (id === 'philo') { const P = new S.Pen(b).at(10, 15, 1.05); chickenHead(P, 0, 0, o, false); }
    else if (id === 'featherly') { const P = new S.Pen(b).at(10, 15, 1.05); chickenHead(P, 0, 0, o, true); }
    else if (id === 'bessy') { const P = new S.Pen(b).at(10, 12, 0.95); cowHead(P, 0, 0, o); }
    else if (id === 'lord') { const P = new S.Pen(b).at(12, 13, 0.62); lordHead(P, 0, 0, o); }
    else if (id === 'rat') { const P = new S.Pen(b).at(9, 12, 1.2); ratHead(P, 0, 0, o, true); }
    else if (id === 'bear') put('bear', { t: 0 }, 0.85, 12, 19);
    return b;
  }

  S.art102 = { lordHead, ratHead, directorHead, chickenHead, cowHead, hughHead, myraHead, myraBust, portrait, HUGH_SKIN };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
