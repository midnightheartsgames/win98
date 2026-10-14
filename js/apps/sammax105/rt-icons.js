(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const ICONS = S.ICONS;
  const A = S.art105;
  const E = S.EP105;
  const { GLOW, NEON_G } = A;

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }

  function sword(P, x0, y0, x1, y1, blade, hilt) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    P.part(P.cap(x0 + ux * 5, y0 + uy * 5, x1, y1, 1.7, 0.7), blade, { b: 4, sh: 0 });
    P.part(P.cap(x0 + ux * 4 - uy * 3.4, y0 + uy * 4 + ux * 3.4, x0 + ux * 4 + uy * 3.4, y0 + uy * 4 - ux * 3.4, 1.1), hilt, { b: 3, sh: 0 });
    P.part(P.cap(x0, y0, x0 + ux * 3.4, y0 + uy * 3.4, 1.3), hilt, { b: 2, sh: 0 });
  }

  function cannon(P, x, y, s, rat) {
    const Q = P.scaled(x, y, s);
    Q.part(Q.ell(x - 5, y + 5, 4.4, 4.4), C.wood, { b: 2 });
    Q.part(Q.ell(x - 5, y + 5, 1.6, 1.6), C.grey, { b: 3, sh: 0, hi: 0 });
    Q.part(Q.poly([x - 9, y - 1, x + 9, y - 5, x + 10, y + 1, x - 8, y + 5]), C.grey, { b: 1 });
    Q.part(Q.ell(x - 8.6, y + 2, 3, 3.4), C.grey, { b: 1 });
    Q.part(Q.rect(x + 8, y - 6, 2.6, 8.4), C.gold, { b: 3, sh: 0 });
    Q.part(Q.rect(x - 2, y - 3.6, 2, 7.4), C.gold, { b: 3, sh: 0 });
    if (rat) {
      Q.part(Q.ell(x + 12.4, y - 3, 2.8, 2.6), C.rat, { b: 3 });
      Q.part(Q.ell(x + 11.4, y - 5.8, 1.5, 1.6), C.rat, { b: 3, sh: 0 });
      Q.px(x + 13.4, y - 3.6, C.pupil);
      Q.part(Q.ell(x + 15, y - 2.4, 1, 0.9), C.pink, { b: 3, sh: 0, hi: 0, ol: 0 });
    }
  }

  function gogglesArt(P, x, y, s) {
    const Q = P.scaled(x, y, s);
    Q.part(Q.path(`M ${x - 10} ${y - 1} Q ${x} ${y - 9} ${x + 10} ${y - 1} L ${x + 9} ${y + 1} Q ${x} ${y - 6} ${x - 9} ${y + 1} Z`), C.grey, { b: 0, sh: 0, hi: 0 });
    Q.part(Q.path(`M ${x - 10} ${y - 3} L ${x + 10} ${y - 3} L ${x + 11} ${y + 5} L ${x + 2} ${y + 5} L ${x} ${y + 3} L ${x - 2} ${y + 5} L ${x - 11} ${y + 5} Z`), C.grey, { b: 1 });
    Q.part(Q.rect(x - 8.4, y - 1, 16.8, 3.6), GLOW, { b: 3, sh: 0, hi: 0, ol: 0 });
    Q.px(x - 7, y - 0.4, C.eye);
  }

  function jackBox(P, x, y, s, open) {
    const Q = P.scaled(x, y, s);
    Q.part(Q.rect(x - 7, y - 2, 14, 11), C.purple, { b: 3 });
    Q.part(Q.rect(x - 7, y - 2, 14, 2.4), C.purple, { b: 4, sh: 0, hi: 0 });
    Q.part(Q.poly([x - 2, y + 2, x, y, x + 2, y + 2, x, y + 5]), C.gold, { b: 3, sh: 0, hi: 0 });
    Q.part(Q.cap(x + 7, y + 3, x + 10.4, y + 3, 0.8), C.grey, { b: 3, sh: 0 });
    Q.part(Q.ell(x + 10.6, y + 1, 1.4, 1.4), C.red, { b: 3, sh: 0 });
    if (open) {
      for (let i = 0; i < 4; i++) Q.line(x - 2 + (i % 2) * 4, y - 3 - i * 2, x + 2 - (i % 2) * 4, y - 5 - i * 2, C.grey[4]);
      Q.part(Q.ell(x, y - 13, 3.6, 3.4), C.cream, { b: 4 });
      Q.part(Q.poly([x - 4, y - 15, x, y - 21, x + 4, y - 15]), C.red, { b: 3 });
      Q.px(x - 1.2, y - 13.4, C.pupil); Q.px(x + 1.2, y - 13.4, C.pupil);
      Q.px(x, y - 11.6, C.red[3]);
    } else {
      Q.part(Q.poly([x - 8, y - 2, x + 8, y - 2, x + 6, y - 5, x - 6, y - 5]), C.purple, { b: 2 });
    }
  }

  function snotRag(P, x, y) {
    P.part(P.path(`M ${x - 9} ${y - 5} L ${x + 8} ${y - 7} L ${x + 9} ${y + 6} L ${x + 3} ${y + 4} L ${x - 2} ${y + 7} L ${x - 8} ${y + 5} Z`), C.grey, { b: 5, sh: 1 });
    P.line(x - 6, y - 2, x + 6, y - 3.4, C.sky[2]);
    P.line(x - 6, y + 2, x + 6, y + 0.6, C.sky[2]);
    P.part(P.ell(x, y, 4, 3), C.slime, { b: 3, sh: 0 });
    P.part(P.ell(x + 3, y + 3, 1.6, 2.2), C.slime, { b: 3, sh: 0, hi: 0 });
    P.px(x - 1, y - 1, C.slime[4]);
  }

  function sickFace(P, x, y) {
    P.part(P.ell(x, y, 6.6, 6.4), NEON_G, { sh: 0, hi: 0 });
    P.line(x - 4, y - 2, x - 1.6, y - 1, C.black);
    P.line(x + 4, y - 2, x + 1.6, y - 1, C.black);
    P.part(P.ell(x, y + 1.4, 1.8, 1.6), C.red, { b: 3, sh: 0, hi: 0 });
    P.curve(`M ${x - 3} ${y + 4.6} Q ${x} ${y + 3} ${x + 3} ${y + 4.6}`, C.black);
    P.px(x + 2, y + 3, C.sky[4]);
    P.part(P.poly([x - 1, y - 8, x - 6, y - 11, x - 6, y - 6]), C.pink, { b: 3, sh: 0 });
    P.part(P.poly([x + 1, y - 8, x + 6, y - 11, x + 6, y - 6]), C.pink, { b: 3, sh: 0 });
    P.part(P.ell(x, y - 8, 1.5, 1.5), C.pink, { b: 4, sh: 0 });
  }

  function paintCan(P, x, y, ramp, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.rect(x - 4, y - 4, 8, 9), C.grey, { b: 4 });
    Q.part(Q.ell(x, y - 4, 4, 1.6), ramp, { b: 3 });
    Q.part(Q.rect(x - 4, y - 1, 8, 3), ramp, { b: 3, sh: 0, hi: 0, ol: 0 });
    Q.part(Q.path(`M ${x + 2} ${y - 4} Q ${x + 5} ${y - 3} ${x + 4.4} ${y + 1} L ${x + 3} ${y - 1} Z`), ramp, { b: 3, sh: 0, hi: 0, ol: 0 });
  }

  Object.assign(ICONS, {
    raygun5: () => mk(24, 20, P => {
      P.part(P.poly([3, 7, 15, 6, 15, 10, 9, 10.4, 8, 12, 7, 17, 3, 17, 4, 10]), C.sky, { b: 3 });
      P.part(P.ell(17, 8, 3, 3.4), C.orange, { b: 3 });
      P.part(P.ell(20.4, 8, 1.6, 2), GLOW, { b: 3, sh: 0, hi: 0 });
      P.part(P.ell(10, 5, 2.6, 1.8), C.red, { b: 3, sh: 0 });
      P.px(5, 9, C.yellow[4]); P.px(7, 9, C.yellow[4]);
    }),
    pixbug5: () => mk(24, 20, P => {
      const Q = P.scaled(12, 12, 2.2);
      A.pixBug(Q, 12, 14);
    }),
    ratcannon5: () => mk(24, 20, P => cannon(P, 10, 11, 1, true)),
    cannon5: () => mk(24, 20, P => cannon(P, 11, 11, 1, false)),
    vrchip5: () => mk(24, 20, P => {
      for (let i = 0; i < 4; i++) { P.part(P.rect(6 + i * 3.4, 3, 1.6, 3), C.grey, { b: 4, sh: 0, hi: 0 }); P.part(P.rect(6 + i * 3.4, 14, 1.6, 3), C.grey, { b: 4, sh: 0, hi: 0 }); }
      P.part(P.rect(4, 5.4, 16, 9.2), C.night, { b: 1 });
      P.part(P.ell(7, 8, 1, 1), C.grey, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.line(9, 12, 17, 12, C.neonB); P.line(12, 9, 17, 9, C.neonB);
    }),
    vrgoggles5: () => mk(24, 20, P => gogglesArt(P, 12, 10, 1)),
    binoc5: () => mk(24, 20, P => {
      for (const x of [7, 17]) {
        P.part(P.poly([x - 3, 5, x + 3, 5, x + 4.4, 16, x - 4.4, 16]), C.grey, { b: 1 });
        P.part(P.ell(x, 16, 4.4, 2), C.sky, { b: 3, sh: 0 });
        P.part(P.rect(x - 2.4, 3, 4.8, 2.4), C.grey, { b: 2, sh: 0 });
      }
      P.part(P.rect(9, 8, 6, 3), C.grey, { b: 2, sh: 0 });
    }),
    magnifier5: () => mk(24, 20, P => {
      P.part(P.cap(13, 12, 20, 18, 1.6), C.wood, { b: 3, sh: 0 });
      P.part(P.ell(9, 8, 7, 7), C.gold, { b: 3 });
      P.part(P.ell(9, 8, 5, 5), GLOW, { b: 3, sh: 0, hi: 0 });
      P.line(6, 6, 8, 4, C.eye);
    }),
    snotrag5: () => mk(24, 20, P => snotRag(P, 12, 10)),
    netcold5: () => mk(24, 20, P => sickFace(P, 12, 12)),
    goldcoins5: () => mk(24, 20, P => {
      A.coin(P, 8, 13, 5, 0); A.coin(P, 15, 11, 5, 0); A.coin(P, 12, 6, 5, 0);
    }),
    woodsword5: () => mk(24, 20, P => sword(P, 3, 17, 21, 2, C.oak, C.wood)),
    plus2sword5: () => mk(24, 20, (P, b) => {
      sword(P, 3, 17, 18, 3, C.sky, C.gold);
      S.font.draw(b, '+2', 14, 11, C.yellow[4]);
    }),
    slimeslime5: () => mk(24, 20, P => {
      P.part(P.path('M 3 17 Q 1 13 5 11 Q 7 6 12 8 Q 17 5 19 10 Q 23 13 21 17 Z'), C.sky, { b: 3 });
      P.part(P.ell(9, 11, 2, 1.2), C.sky, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(18, 5, 1.6, 2), C.sky, { b: 3, sh: 0 });
    }),
    jackbox5: () => mk(24, 20, P => jackBox(P, 11, 9, 1, false)),
    paintkit5: () => mk(24, 20, P => {
      P.part(P.rect(2, 9, 20, 9), C.oak, { b: 3 });
      const ramps = [C.red, C.orange, C.yellow, C.green, C.sky, C.blue, C.purple];
      ramps.forEach((r, i) => P.part(P.rect(3 + i * 2.6, 10, 2.4, 7), r, { b: 3, sh: 0, hi: 0, ol: 0 }));
      P.part(P.cap(6, 8, 18, 2, 1), C.wood, { b: 3, sh: 0 });
      P.part(P.cap(17, 2.6, 20, 1, 1.6), C.cream, { b: 4, sh: 0 });
    }),
    decree5: () => mk(24, 20, P => {
      P.part(P.poly([4, 2, 18, 2, 18, 18, 4, 18]), C.cream, { b: 4, sh: 1 });
      for (let i = 0; i < 4; i++) P.line(6, 5 + i * 2.6, 16, 5 + i * 2.6, C.cream[1]);
      P.part(P.ell(14, 15, 3.4, 3), C.red, { b: 3, sh: 0 });
      P.part(P.rect(16, 6, 6, 5), C.wood, { b: 2 });
      P.part(P.rect(18, 2, 2, 4), C.wood, { b: 3, sh: 0 });
    }),
    net5: () => mk(24, 20, P => {
      P.part(P.ell(12, 10, 8.4, 8.4), C.blue, { b: 2 });
      P.curve('M 3.6 10 L 20.4 10', C.sky[4]);
      P.curve('M 12 1.6 Q 6 10 12 18.4', C.sky[4]);
      P.curve('M 12 1.6 Q 18 10 12 18.4', C.sky[4]);
      P.curve('M 5 5.6 Q 12 8 19 5.6', C.sky[4]);
      P.curve('M 5 14.4 Q 12 12 19 14.4', C.sky[4]);
    }),
    surge5: () => mk(24, 20, P => P.part(P.poly([13, 1, 5, 11, 11, 11, 8, 19, 19, 7, 12.6, 7]), C.yellow, { b: 3 })),
    email5: () => mk(24, 20, P => {
      P.part(P.rect(11, 12, 2.4, 8), C.grey, { b: 2, sh: 0 });
      P.part(P.path('M 4 13 L 4 7 Q 4 2 12 2 Q 20 2 20 7 L 20 13 Z'), C.blue, { b: 3 });
      P.part(P.rect(7, 8, 10, 1.6), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(19.4, 3, 1.4, 5), C.red, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(19.4, 3, 3.4, 2.4), C.red, { b: 3, sh: 0, hi: 0 });
    }),
    armor5: () => mk(24, 20, (P, b) => {
      P.part(P.path('M 4 3 L 20 3 Q 20 14 12 19 Q 4 14 4 3 Z'), C.stone, { b: 4 });
      S.font.draw(b, '+1', 8, 6, C.red[3], 0);
    }),
    pan5: () => mk(24, 20, P => A.pan(P, 4, 16, -0.6)),
    bank5: () => mk(24, 20, (P, b) => {
      P.part(P.poly([2, 8, 12, 2, 22, 8]), C.stone, { b: 4 });
      P.part(P.rect(3, 16, 18, 3), C.stone, { b: 3 });
      for (const x of [5, 10.4, 16]) P.part(P.rect(x, 8, 3, 8), C.stone, { b: 4, sh: 1 });
      S.font.draw(b, '$', 10, 3, C.green[2], 0);
    }),
    lock5: () => mk(24, 20, P => {
      P.curve('M 8 10 L 8 6 Q 8 2 12 2 Q 16 2 16 6 L 16 10', C.grey[4]);
      P.curve('M 9 10 L 9 6 Q 9 3 12 3 Q 15 3 15 6 L 15 10', C.grey[2]);
      P.part(P.rect(5, 9, 14, 10), C.gold, { b: 3 });
      P.part(P.ell(12, 13, 1.6, 1.6), C.night, { b: 0, sh: 0, hi: 0 });
      P.part(P.rect(11.2, 13, 1.6, 3.4), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
    }),
    behind5: () => mk(24, 20, P => {
      P.curve('M 6 16 L 6 8 Q 6 3 12 3 Q 18 3 18 8 L 18 13', C.orange[3]);
      P.curve('M 7 16 L 7 8 Q 7 4 12 4 Q 17 4 17 8 L 17 13', C.orange[4]);
      P.part(P.poly([13, 12, 22, 12, 17.6, 18]), C.orange, { b: 3 });
    }),
    elfear5: () => mk(24, 20, P => {
      P.part(P.path('M 4 16 Q 6 9 12 8 L 22 2 Q 17 11 14 16 Q 9 19 4 16 Z'), C.dskin, { b: 3 });
      P.curve('M 8 14 Q 11 11 17 7', C.dskin[1]);
    }),
    potion5: () => mk(24, 20, P => {
      P.part(P.ell(12, 13, 6.4, 5.6), C.grey, { b: 5, sh: 1 });
      P.part(P.path('M 6.4 13 Q 12 10.6 17.6 13 Q 17 18 12 18.4 Q 7 18 6.4 13 Z'), C.slime, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(10, 3, 4, 5.4), C.grey, { b: 5, sh: 0 });
      P.part(P.rect(9.6, 1.4, 4.8, 2.4), C.oak, { b: 3, sh: 0 });
      P.px(10, 15, C.slime[4]); P.px(14, 14, C.slime[4]);
    }),
    magic5: () => mk(24, 20, P => {
      P.part(P.cap(4, 17, 15, 6, 1.2), C.night, { b: 2, sh: 0 });
      P.part(P.cap(14, 7, 16, 5, 1.3), C.grey, { b: 5, sh: 0 });
      for (const [x, y, c] of [[19, 3, 0], [21, 8, 2], [14, 1, 4], [20, 12, 6], [10, 3, 1]]) { P.px(x, y, C.cycle[c]); P.px(x + 1, y, C.cycle[c]); P.px(x, y + 1, C.cycle[c]); }
    }),
    level5: () => mk(24, 20, (P, b) => {
      P.part(P.poly([12, 1, 20, 9, 15, 9, 15, 13, 9, 13, 9, 9, 4, 9]), C.green, { b: 3 });
      S.font.draw(b, '40', 8, 13, C.yellow[4]);
    }),
    firewall5: () => mk(24, 20, P => {
      P.part(P.rect(2, 9, 20, 10), C.brick, { b: 2 });
      for (let r = 0; r < 3; r++) { P.line(2, 12 + r * 3, 22, 12 + r * 3, C.brick[0]); for (let i = 0; i < 4; i++) P.line(5 + i * 5 + (r % 2) * 2, 9 + r * 3, 5 + i * 5 + (r % 2) * 2, 12 + r * 3, C.brick[0]); }
      for (const x of [5, 11, 17]) P.part(P.path(`M ${x} 9 Q ${x - 3} 5 ${x} 1 Q ${x + 1} 4 ${x + 3} 5 Q ${x + 4} 8 ${x + 2} 9 Z`), C.orange, { b: 3, sh: 0 });
    }),
    attack5: () => mk(24, 20, P => {
      sword(P, 3, 17, 20, 3, C.grey, C.gold);
      sword(P, 21, 17, 4, 3, C.grey, C.gold);
    }),
    defend5: () => mk(24, 20, P => {
      P.part(P.path('M 4 2 L 20 2 Q 20 13 12 19 Q 4 13 4 2 Z'), C.blue, { b: 3 });
      P.part(P.path('M 12 2 L 20 2 Q 20 13 12 19 Z'), C.blue, { b: 2, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(12, 9, 2.4, 2.4), C.gold, { b: 3, sh: 0 });
    }),
    flee5: () => mk(24, 20, P => {
      P.part(P.ell(14, 4, 2.6, 2.6), C.fur, { b: 3 });
      P.part(P.cap(13, 7, 10, 12, 2), C.suit, { b: 3, sh: 0 });
      P.part(P.cap(10, 12, 15, 17, 1.3), C.suit, { b: 2, sh: 0 });
      P.part(P.cap(10, 12, 4, 15, 1.3), C.suit, { b: 2, sh: 0 });
      P.part(P.cap(12, 8, 17, 10, 1.1), C.suit, { b: 3, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(18 + i, 13 + i * 2, 22, 13 + i * 2, C.grey[4]);
    }),
    wrench5: () => mk(24, 20, P => {
      P.part(P.cap(5, 16, 15, 7, 1.6), C.grey, { b: 4, sh: 0 });
      P.part(P.cap(15, 7, 15.4, 2.4, 1.5), C.grey, { b: 4, sh: 0 });
      P.part(P.cap(15, 7, 20, 7.6, 1.5), C.grey, { b: 4, sh: 0 });
      P.part(P.ell(5, 16.4, 2.4, 2.4), C.grey, { b: 3 });
    }),
    book5: () => mk(24, 20, P => {
      P.part(P.poly([3, 4, 12, 6, 12, 18, 3, 16]), C.cream, { b: 4 });
      P.part(P.poly([21, 4, 12, 6, 12, 18, 21, 16]), C.cream, { b: 3 });
      for (let i = 0; i < 3; i++) { P.line(5, 8 + i * 2.6, 10, 9 + i * 2.6, C.cream[1]); P.line(14, 9 + i * 2.6, 19, 8 + i * 2.6, C.cream[1]); }
    })
  });

  E.PAINTS.forEach((p, i) => { ICONS['paint5_' + i] = () => mk(24, 20, P => paintCan(P, 12, 10, C[p.ramp], 1.7)); });
  for (const id of ['sybil5', 'jimmy5', 'cops']) ICONS['f:' + id] = () => A.portrait(id);
  for (const id of ['internet', 'wizard', 'auntie', 'elfbot']) ICONS['f:' + id] = () => A.portrait2(id);

  Object.assign(A, { sword, cannon, gogglesArt, jackBox });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
