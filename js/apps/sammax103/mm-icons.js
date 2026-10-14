(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const ICONS = S.ICONS;
  const A = S.art103;

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];

  function tokenDisc(P, x, y, r) {
    P.part(P.ell(x, y, r, r * 0.92), C.gold, { b: 3 });
    P.part(P.ell(x, y, r * 0.66, r * 0.6), C.gold, { b: 2, sh: 0, hi: 0, ol: C.gold[1] });
    P.part(P.ell(x - r * 0.3, y - r * 0.32, r * 0.2, r * 0.2), C.gold, { b: 2, sh: 0, hi: 0, ol: C.gold[1] });
    P.part(P.ell(x + r * 0.3, y - r * 0.32, r * 0.2, r * 0.2), C.gold, { b: 2, sh: 0, hi: 0, ol: C.gold[1] });
    P.px(x, y + r * 0.1, C.gold[0]);
  }

  Object.assign(ICONS, {
    token: () => mk(24, 20, P => tokenDisc(P, 12, 10, 7.5)),
    tokens: () => mk(24, 20, (P, b) => {
      P.part(P.path('M 5 19 Q 1 12 6 8 L 8 6 L 6 2 L 18 2 L 16 6 L 18 8 Q 23 12 19 19 Z'), C.sand, { b: 3 });
      P.line(8, 6, 16, 6, C.sand[0]);
      tokenDisc(P, 12, 13, 4.2);
      tokenDisc(P, 4, 16, 2.8);
      tokenDisc(P, 20, 17, 2.6);
    }),
    ace: () => mk(24, 20, P => A.card(P, 12, 10, 'A', 's', 0.95)),
    deck: () => mk(24, 20, P => {
      P.part(P.poly([5, 4, 17, 2, 19, 17, 7, 19]), C.red, { b: 2 });
      P.part(P.poly([7, 5, 15, 4, 16.5, 15, 8.5, 16]), C.red, { b: 3, sh: 0, hi: 0, ol: C.red[4] });
      A.card(P, 15, 10, 'K', 'h', 0.8);
    }),
    magnet: () => mk(24, 20, P => {
      A.bearMask(P.scaled(12, 11, 0.5), 12, 11, A.MOB.ted, {});
      P.part(P.rect(4, 17, 16, 2), C.grey, { b: 1, sh: 0, hi: 0 });
    }),
    roach: () => { const b = new Buf(24, 20); const sp = S.sprite('roach', { dir: 'e' }, 1.25); S.blit(b, sp.buf, 11 - sp.ox, 15 - sp.oy); return b; },
    bearbox: () => mk(24, 20, P => {
      P.part(P.rect(3, 8, 18, 11), C.pink, { b: 3 });
      P.part(P.rect(2, 6, 20, 4), C.pink, { b: 4, sh: 0 });
      P.part(P.rect(10.5, 6, 3, 13), C.gold, { b: 3, sh: 0, hi: 0 });
      P.part(P.path('M 12 6 Q 6 0 5 4 Q 6 7 12 6 Z M 12 6 Q 18 0 19 4 Q 18 7 12 6 Z'), C.gold, { b: 3, sh: 0 });
      P.part(P.ell(6, 13, 2.2, 2.2), C.purple, { b: 3, sh: 0 });
    }),
    mug: () => mk(24, 20, P => {
      P.part(P.poly([5, 4, 17, 4, 16, 19, 6, 19]), C.grey, { b: 5 });
      P.part(P.path('M 16 7 Q 22 7 21 12 Q 20 16 15.5 15 L 15.7 13 Q 19 13.4 19 11 Q 19 9 16 9 Z'), C.grey, { b: 4, sh: 0 });
      P.part(P.ell(11, 4.5, 5.5, 1.4), C.oak, { b: 1, sh: 0, hi: 0 });
      P.part(P.rect(7, 10, 8, 3), C.gold, { b: 3, sh: 0, hi: 0, ol: 0 });
    }),
    kmug: () => mk(24, 20, P => {
      P.part(P.poly([5, 4, 17, 4, 16, 19, 6, 19]), C.grey, { b: 5 });
      P.part(P.path('M 16 7 Q 22 7 21 12 Q 20 16 15.5 15 L 15.7 13 Q 19 13.4 19 11 Q 19 9 16 9 Z'), C.grey, { b: 4, sh: 0 });
      P.part(P.ell(11, 4.5, 5.5, 1.6), C.red, { b: 2, sh: 0, hi: 0 });
      P.part(P.path('M 6 4 Q 7 8 8 6 Q 9 10 10 5 L 10 4 Z'), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(7, 10, 8, 3), C.gold, { b: 3, sh: 0, hi: 0, ol: 0 });
    }),
    capgun: () => mk(24, 20, P => {
      P.part(P.poly([3, 7, 19, 6, 19, 9.5, 10, 10, 9, 12, 7, 17, 3, 17, 4, 10]), C.grey, { b: 4 });
      P.part(P.ell(10.5, 10.5, 2.4, 2.1), C.grey, { b: 3, sh: 0 });
      P.part(P.rect(19, 6, 3, 3.5), C.orange, { b: 3, sh: 0, hi: 0 });
      P.part(P.poly([4, 11, 7.5, 11, 6.5, 17, 3.5, 17]), C.sand, { b: 3, sh: 0 });
    }),
    arm: () => mk(24, 20, P => {
      P.part(P.cap(5, 17, 16, 5, 1.6), C.grey, { b: 4, sh: 0 });
      P.part(P.ell(17.5, 4, 3.6, 3.4), C.red, { b: 3 });
      P.part(P.rect(2, 15, 7, 4), C.grey, { b: 2 });
    }),
    screwdriver: () => mk(24, 20, P => {
      P.part(P.cap(3, 16, 10, 10, 2.8, 2.4), C.green, { b: 3 });
      P.part(P.cap(10, 10, 20, 3, 0.9), C.grey, { b: 4, sh: 0 });
      P.line(4, 15, 9, 11, C.green[4]);
    }),
    voicebox: () => mk(24, 20, P => {
      P.part(P.rect(4, 4, 16, 13), C.green, { b: 3 });
      P.part(P.ell(10, 10.5, 4, 4), C.grey, { b: 1, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(7.5, 8.5 + i * 2, 12.5, 8.5 + i * 2, C.grey[3]);
      P.part(P.rect(15, 6, 3, 3), C.red, { b: 4, sh: 0, hi: 0 });
      P.part(P.rect(15, 11, 3, 3), C.gold, { b: 3, sh: 0, hi: 0 });
    }),
    firebear: () => mk(24, 20, P => {
      A.hypnoBear(P, 11, 19, 0.82, {});
      P.part(P.path('M 19 12 Q 16 8 19 3 Q 20 6 22 7 Q 23 10 21 12 Z'), C.orange, { b: 3, sh: 0 });
      P.part(P.path('M 19.6 11.4 Q 18.6 9 20 7.2 Q 21.4 9 20.6 11.4 Z'), LAMP, { sh: 0, hi: 0, ol: 0 });
    }),
    rug: () => mk(24, 20, P => {
      P.part(P.poly([2, 12, 22, 12, 21, 19, 3, 19]), C.purple, { b: 3 });
      for (let i = 0; i < 5; i++) P.px(5 + i * 3.5, 15.5, C.gold[4]);
      P.part(P.rect(3, 1, 7, 11), C.purple, { b: 2 });
      P.part(P.rect(14, 1, 7, 11), C.purple, { b: 2 });
      P.part(P.rect(2, 0, 20, 2), C.gold, { b: 3, sh: 0 });
      P.line(6, 2, 6, 11, C.purple[1]); P.line(17, 2, 17, 11, C.purple[1]);
    }),
    cannoli: () => mk(24, 20, P => {
      P.part(P.cap(4, 14, 19, 6, 4.2, 4), C.oak, { b: 3 });
      P.part(P.ell(4, 14, 3, 3.4, 0.5), C.cream, { b: 4, sh: 0 });
      P.part(P.ell(19, 6, 3, 3.4, 0.5), C.cream, { b: 4, sh: 0 });
      P.px(10, 9, C.oak[1]); P.px(13, 11, C.oak[1]);
    }),
    gavel: () => mk(24, 20, P => {
      P.part(P.cap(8, 16, 16, 7, 1.4), C.wood, { b: 3, sh: 0 });
      P.part(P.cap(10, 3, 20, 11, 3.2), C.wood, { b: 2 });
      P.part(P.rect(2, 16, 12, 3), C.wood, { b: 3 });
    }),
    coffee: () => mk(24, 20, P => {
      P.part(P.poly([6, 8, 18, 8, 16, 18, 8, 18]), C.grey, { b: 5 });
      P.part(P.ell(12, 8.5, 6, 1.6), C.oak, { b: 1, sh: 0, hi: 0 });
      P.curve('M 9 6 Q 11 3 9 0', C.grey[4]); P.curve('M 14 6 Q 16 3 14 0', C.grey[4]);
    }),
    mama: () => mk(24, 20, P => {
      P.part(P.ell(12, 16, 8, 5), C.pink, { b: 3 });
      P.part(P.ell(12, 8, 5, 5.5), C.skin, { b: 3 });
      for (const cx of [7.5, 10.5, 13.5, 16.5]) P.part(P.ell(cx, 3.5, 1.8, 1.8), C.grey, { b: 4, sh: 0 });
      P.px(10, 8, C.pupil); P.px(14, 8, C.pupil);
      P.part(P.ell(12, 11, 1.6, 0.8), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
    }),
    chips: () => mk(24, 20, P => {
      for (let i = 0; i < 4; i++) P.part(P.ell(9, 16 - i * 2.6, 6, 2.2), [C.red, C.blue, C.green, C.gold][i], { b: 3 });
      tokenDisc(P, 18, 8, 4);
    }),
    fold: () => mk(24, 20, P => {
      P.part(P.poly([4, 16, 10, 2, 16, 4, 12, 18]), C.grey, { b: 5 });
      P.part(P.poly([8, 18, 16, 5, 21, 8, 15, 19]), C.grey, { b: 4 });
      P.part(P.cap(3, 12, 20, 12, 1.4), C.red, { b: 3, sh: 0 });
    }),
    sandwich: () => mk(24, 20, P => {
      P.part(P.path('M 2 12 Q 3 7 12 6 Q 21 7 22 12 Z'), C.oak, { b: 3 });
      for (const cx of [6, 11, 16]) P.part(P.ell(cx, 13.2, 3, 2.4), C.brick, { b: 2 });
      P.part(P.path('M 2 14 Q 12 12 22 14 L 21 17 Q 12 19 3 17 Z'), C.oak, { b: 3 });
      P.part(P.rect(3, 14, 18, 1.2), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(9, 8.5, 1.6, 0.9), C.oak, { b: 4, sh: 0, hi: 0, ol: 0 });
    }),
    mole: () => mk(24, 20, P => A.moleHead(P.scaled(11, 12, 0.66), 11, 12, {})),
    fire: () => mk(24, 20, P => {
      P.part(P.path('M 12 19 Q 4 17 5 10 Q 6 5 10 2 Q 10 7 13 8 Q 13 4 16 3 Q 20 9 19 14 Q 18 18 12 19 Z'), C.orange, { b: 3 });
      P.part(P.path('M 12 18 Q 8 16 9 12 Q 10 9 12 8 Q 13 11 15 12 Q 16 16 12 18 Z'), LAMP, { sh: 0, hi: 0, ol: 0 });
    }),
    monitors: () => mk(24, 20, P => {
      P.part(P.rect(1, 2, 22, 16), C.grey, { b: 1 });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) P.part(P.rect(3 + c * 6.6, 4 + r * 6.6, 5, 5), C.teal, { b: 3, sh: 0, hi: 0 });
    }),
    flag: () => mk(24, 20, P => {
      P.part(P.rect(3, 2, 1.6, 17), C.grey, { b: 2, sh: 0 });
      P.part(P.rect(5, 3, 5, 10), C.blue, { b: 3, sh: 0 });
      P.part(P.rect(10, 3, 5, 10), C.grey, { b: 5, sh: 0 });
      P.part(P.rect(15, 3, 5, 10), C.red, { b: 3, sh: 0 });
    }),
    whack: () => mk(24, 20, P => {
      P.part(P.ell(12, 16, 9, 3), C.night, { b: 0, sh: 0 });
      P.part(P.ell(12, 10, 5.5, 6), C.orange, { b: 3 });
      P.part(P.ell(8, 5, 2, 2.2), C.orange, { b: 3 });
      P.part(P.ell(16, 5, 2, 2.2), C.orange, { b: 3 });
      P.px(10, 9, C.pupil); P.px(14, 9, C.pupil);
      P.part(P.ell(12, 13, 1.6, 1.1), C.pink, { b: 3, sh: 0, hi: 0 });
    }),
    envelope: () => mk(24, 20, P => {
      P.part(P.rect(3, 5, 18, 12), C.cream, { b: 4 });
      P.curve('M 3 5 L 12 12 L 21 5', C.cream[1]);
      S.font.draw(P.b, '99', 13, 11, C.red[3], 0);
    }),
    waves: () => mk(24, 20, P => {
      P.part(P.rect(2, 8, 20, 10), C.teal, { b: 2 });
      for (let i = 0; i < 3; i++) P.curve(`M 2 ${10 + i * 3} Q 7 ${8 + i * 3} 12 ${10 + i * 3} Q 17 ${12 + i * 3} 22 ${10 + i * 3}`, C.teal[4]);
      P.part(P.ell(12, 5, 3, 2.6), C.cream, { b: 4 });
    }),
    eyelid: () => mk(24, 20, P => {
      P.part(P.path('M 2 10 Q 12 2 22 10 Q 12 18 2 10 Z'), C.eye, { sh: 0, hi: 0 });
      P.part(P.ell(12, 10, 3.4, 3.4), C.fur, { b: 2, sh: 0, hi: 0 });
      P.part(P.path('M 2 10 Q 12 1 22 10 Q 12 7 2 10 Z'), C.skin, { b: 3, sh: 0 });
      P.part(P.ell(19, 16, 2.6, 2.6), C.gold, { b: 3, sh: 0 });
    }),
    scarecrow: () => mk(24, 20, P => {
      P.part(P.rect(11, 8, 3, 12), C.oak, { b: 4, sh: 0 });
      P.part(P.poly([6, 9, 18, 9, 17, 16, 7, 16]), C.red, { b: 3 });
      P.part(P.cap(3, 10, 21, 10, 1.4), C.oak, { b: 4, sh: 0 });
      P.part(P.ell(12.5, 6, 3.8, 3.4), C.sand, { b: 4 });
      P.px(11, 6, C.pupil); P.px(14, 6, C.pupil);
      P.part(P.poly([7, 3.4, 18, 3.4, 15.5, 0, 9.5, 0]), C.gold, { b: 3 });
      P.part(P.ell(20, 3, 2.4, 1.6), C.night, { b: 3, sh: 0 });
      P.part(P.poly([21, 3, 24, 2, 22, 4]), C.orange, { b: 3, sh: 0, ol: 0 });
    }),
    limbo: () => mk(24, 20, P => {
      P.part(P.rect(2, 3, 3, 16), C.sand, { b: 4, sh: 0 });
      P.part(P.rect(19, 3, 3, 16), C.sand, { b: 4, sh: 0 });
      P.part(P.rect(2, 12, 20, 2.4), C.red, { b: 4, sh: 0 });
      P.part(P.ell(12, 17, 3, 2.2), C.pink, { b: 4, sh: 0 });
      P.part(P.ell(12, 18.6, 4, 1.2), C.skin, { b: 3, sh: 0 });
    }),
    keyhole: () => mk(24, 20, P => {
      P.part(P.rect(5, 2, 14, 17), C.gold, { b: 3 });
      P.part(P.ell(12, 8, 2.4, 2.4), C.night, { b: 0, sh: 0, hi: 0 });
      P.part(P.poly([10.6, 9, 13.4, 9, 14.4, 15, 9.6, 15]), C.night, { b: 0, sh: 0, hi: 0 });
    }),
    newspaper: () => mk(24, 20, (P, b) => {
      P.part(P.poly([2, 3, 21, 2, 22, 18, 3, 19]), C.cream, { b: 4 });
      P.part(P.rect(4, 4, 16, 3), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(15, 12, 2.4, 2.8), C.slime, { b: 3, sh: 0 });
      for (let i = 0; i < 4; i++) P.line(4, 9 + i * 2.2, 11, 9 + i * 2.2, C.cream[1]);
    }),
    slot: () => mk(24, 20, P => {
      P.part(P.rect(3, 2, 15, 17), C.red, { b: 3 });
      P.part(P.rect(5, 6, 11, 6), C.grey, { b: 5, sh: 0, hi: 0 });
      for (let i = 0; i < 3; i++) P.part(P.ell(7 + i * 3.6, 9, 1.2, 1.4), [C.red, C.gold, C.purple][i], { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.cap(19, 14, 20, 5, 0.9), C.grey, { b: 4, sh: 0 });
      P.part(P.ell(20, 4, 2.2, 2.2), C.red, { b: 3, sh: 0 });
    })
  });

  for (const id of ['lovey', 'cuddly', 'guard', 'chuckles', 'ted', 'harry', 'leonard', 'banda', 'roach', 'hbear']) ICONS['f:' + id] = () => A.portrait(id);
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
