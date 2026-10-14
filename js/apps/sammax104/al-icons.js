(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const ICONS = S.ICONS;
  const A = S.art104;

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }
  const RED = [C.neonA, C.neonA, C.neonA, C.neonA, C.neonA];

  function sheet(P, ramp, b) {
    P.part(P.poly([4, 2, 20, 2, 20, 18, 4, 18]), ramp, { b });
  }

  Object.assign(ICONS, {
    poster4: () => mk(24, 20, P => {
      sheet(P, C.olive, 3);
      P.part(P.ell(10, 8, 3.4, 3.8), C.skin, { b: 3, sh: 0 });
      P.part(P.poly([5.6, 5.6, 14.4, 5.6, 13, 2.8, 7, 2.8]), C.olive, { b: 1, sh: 0 });
      P.part(P.cap(13, 11, 19, 8, 1.3), C.skin, { b: 3, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(6, 14 + i * 1.6, 18 - i * 3, 14 + i * 1.6, C.grey[5]);
    }),
    delivery: () => mk(24, 20, (P, b) => {
      P.part(P.rect(1, 4, 22, 12), C.cream, { b: 4 });
      for (let i = 0; i < 7; i++) { b.set(3 + i * 3, 5, C.cycle[i]); b.set(3 + i * 3, 14, C.cycle[(i + 3) % 8]); }
      P.part(P.rect(4, 8, 8, 4), C.purple, { b: 3, sh: 0 });
      P.part(P.poly([12, 9, 16, 9, 18, 11, 18, 12, 12, 12]), C.purple, { b: 2, sh: 0 });
      b.set(7, 13, C.black); b.set(15, 13, C.black);
      b.set(12, 3, C.grey[2]);
    }),
    nofeed: () => mk(24, 20, P => {
      P.part(P.rect(10.5, 12, 3, 8), C.wood, { b: 2, sh: 0 });
      P.part(P.rect(2, 1, 20, 13), C.plum, { b: 3 });
      P.part(P.cap(6, 9, 17, 9, 1.8), C.grey, { b: 4, sh: 0 });
      P.line(12, 7, 12, 4, C.grey[5]);
      P.line(12, 4, 15, 4, C.grey[5]);
      P.line(4, 3, 20, 12, C.red[4]);
    }),
    flyer: () => mk(24, 20, P => {
      sheet(P, C.cream, 4);
      P.part(P.rect(5, 3, 14, 3), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(9.5, 7, 5, 6), C.night, { b: 1, sh: 0 });
      P.part(P.rect(7.5, 12.4, 9, 1.4), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
      P.line(7, 16, 17, 16, C.cream[1]);
    }),
    ribbon: () => mk(24, 20, P => {
      P.part(P.poly([8, 9, 12, 9, 9, 19, 7, 16, 4, 17]), C.red, { b: 2, sh: 0 });
      P.part(P.poly([12, 9, 16, 9, 20, 17, 17, 16, 15, 19]), C.red, { b: 2, sh: 0 });
      P.part(P.ell(12, 7, 6.4, 6), C.red, { b: 3 });
      P.part(P.ell(12, 7, 3, 2.8), C.gold, { b: 3, sh: 0, hi: 0 });
    }),
    dater: () => mk(24, 20, P => {
      P.part(P.poly([2, 5, 17, 4, 17, 10, 9, 11, 8, 18, 3, 18]), C.teal, { b: 3 });
      P.part(P.rect(17, 5, 5, 4), C.grey, { b: 1, sh: 0 });
      P.part(P.rect(5, 6.4, 8, 3), C.night, { b: 1, sh: 0, hi: 0 });
      P.px(7, 7.6, C.neonB); P.px(9, 7.6, C.neonB);
      P.px(22, 7, C.neonB);
    }),
    serum: () => mk(24, 20, P => {
      P.part(P.poly([7, 19, 7, 9, 10, 6, 10, 2, 14, 2, 14, 6, 17, 9, 17, 19]), C.sky, { b: 4 });
      P.part(P.rect(9.6, 0, 4.8, 3), C.red, { b: 3, sh: 0 });
      P.part(P.rect(8.4, 11, 7.2, 5), C.grey, { b: 5, sh: 0, hi: 0 });
      P.line(9.6, 13.4, 14.4, 13.4, C.grey[2]);
    }),
    beacon: () => mk(24, 20, P => {
      P.part(P.rect(6, 9, 12, 9), C.olive, { b: 2 });
      P.part(P.rect(8, 12, 8, 3), C.olive, { b: 0, sh: 0, hi: 0 });
      P.line(12, 9, 12, 5, C.grey[4]);
      P.part(P.ell(12, 4, 2.4, 2.4), RED, { sh: 0, hi: 0 });
      P.curve('M 6 5 Q 4 3 6 1', C.neonA);
      P.curve('M 18 5 Q 20 3 18 1', C.neonA);
    }),
    head: () => mk(24, 20, (P, b) => A.presHead(new Pen(b).at(12, 11, 0.62), 0, 0, { v: 'dead' })),
    law: () => mk(24, 20, P => {
      P.part(P.poly([5, 3, 19, 3, 19, 17, 5, 17]), C.cream, { b: 4 });
      P.part(P.ell(5, 3.6, 2.2, 1.8), C.cream, { b: 3, sh: 0 });
      P.part(P.ell(19, 16.6, 2.2, 1.8), C.cream, { b: 3, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(8, 6 + i * 2.6, 16, 6 + i * 2.6, C.cream[1]);
      P.part(P.ell(15, 14, 2.6, 2.6), C.red, { b: 3, sh: 0 });
    }),
    whitehouse: () => mk(24, 20, P => {
      P.part(P.rect(1, 10, 22, 9), C.grey, { b: 5 });
      P.part(P.poly([5, 10, 12, 4, 19, 10]), C.grey, { b: 5 });
      for (const x of [8, 10.6, 13.4, 16]) P.line(x, 11, x, 17, C.grey[3]);
      P.part(P.rect(10.6, 14, 2.8, 5), C.wood, { b: 2, sh: 0, hi: 0 });
      P.line(12, 4, 12, 0, C.grey[2]);
      P.part(P.rect(12.6, 0, 5, 3), C.red, { b: 3, sh: 0, hi: 0 });
      for (const x of [3, 5, 19, 21]) P.px(x, 13, C.navy[2]);
    }),
    baby: () => mk(24, 20, P => {
      P.part(P.ell(12, 10, 7.6, 7.4), C.skin, { b: 4 });
      P.curve('M 11 3 Q 13 0 14 3', C.skin[1]);
      P.px(9, 8, C.pupil); P.px(15, 8, C.pupil);
      P.part(P.ell(12, 13, 3.4, 2.8), C.sky, { b: 3 });
      P.part(P.ell(12, 13, 1.2, 1), C.sky, { b: 1, sh: 0, hi: 0, ol: 0 });
    }),
    paw: () => mk(24, 20, P => {
      P.part(P.ell(12, 13, 5, 4.4), C.fur, { b: 2 });
      for (const [x, y] of [[5.4, 7.6], [9.6, 4.4], [14.4, 4.4], [18.6, 7.6]]) P.part(P.ell(x, y, 2.2, 2.6), C.fur, { b: 2 });
    }),
    hold: () => mk(24, 20, P => {
      P.part(P.rect(5, 1, 14, 2.4), C.wood, { b: 3, sh: 0 });
      P.part(P.rect(5, 16.6, 14, 2.4), C.wood, { b: 3, sh: 0 });
      P.part(P.poly([6.4, 3.4, 17.6, 3.4, 12.8, 10, 17.6, 16.6, 6.4, 16.6, 11.2, 10]), C.sky, { b: 4 });
      P.part(P.poly([8.6, 5, 15.4, 5, 12, 9]), C.yellow, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.poly([9, 15.6, 15, 15.6, 12, 13]), C.yellow, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.line(12, 9, 12, 13, C.yellow[3]);
    }),
    voice: () => mk(24, 20, P => {
      P.part(P.poly([3, 8, 8, 8, 13, 3, 13, 17, 8, 12, 3, 12]), C.oak, { b: 3 });
      P.curve('M 15 7 Q 17.5 10 15 13', C.lamp);
      P.curve('M 17.5 4.6 Q 22 10 17.5 15.4', C.lamp);
    }),
    rainbow: () => mk(24, 20, P => {
      [C.red, C.orange, C.yellow, C.green, C.blue, C.purple].forEach((r, i) => P.part(P.path(`M ${2 + i * 1.5} 17 Q ${2 + i * 1.5} ${3 + i * 1.5} 12 ${3 + i * 1.5} Q ${22 - i * 1.5} ${3 + i * 1.5} ${22 - i * 1.5} 17 Z`), r, { b: 3, sh: 0, hi: 0, ol: i ? 0 : C.black }));
      P.part(P.path('M 11 17 Q 11 12 12 12 Q 13 12 13 17 Z'), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.line(2, 17, 22, 17, C.black);
    }),
    book: () => mk(24, 20, (P, b) => {
      P.part(P.poly([4, 3, 18, 2, 20, 17, 6, 18]), C.pink, { b: 3 });
      P.part(P.poly([4, 3, 6, 18, 4.6, 17, 3, 4]), C.grey, { b: 5, sh: 0 });
      for (let i = 0; i < 5; i++) b.set(8 + i * 2, 7, C.cycle[i]);
      P.part(P.ell(12.6, 12, 3, 3), C.sky, { b: 3, sh: 0, hi: 0 });
    }),
    magic: () => mk(24, 20, P => {
      P.part(P.cap(4, 17, 15, 6, 1.2), C.night, { b: 1, sh: 0 });
      P.part(P.cap(14, 7, 16, 5, 1.3), C.grey, { b: 5, sh: 0 });
      A.starShape(P, 18.4, 4, 3.6, 1.5, C.gold, 4);
      for (const [x, y] of [[8, 4], [21, 11], [12, 12]]) P.px(x, y, C.lamp);
    }),
    ushanka: () => mk(24, 20, P => {
      P.part(P.poly([2, 9, 5, 9, 6, 18, 3, 18]), C.asphalt, { b: 2 });
      P.part(P.poly([19, 9, 22, 9, 21, 18, 18, 18]), C.asphalt, { b: 2 });
      P.part(P.path('M 4 9 L 5 3 Q 12 0 19 3 L 20 9 Z'), C.asphalt, { b: 1 });
      P.part(P.path('M 3 12 Q 12 9 21 12 L 20.4 7 Q 12 4 3.6 7 Z'), C.asphalt, { b: 3, sh: 1 });
      A.starShape(P, 12, 8.6, 3, 1.3, C.red, 3);
    }),
    dish: () => mk(24, 20, P => {
      P.part(P.rect(11, 12, 2.4, 6), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(12, 18, 5, 1.6), C.grey, { b: 1 });
      P.part(P.ell(11, 8, 9, 6, -0.5), C.grey, { b: 4 });
      P.part(P.ell(12, 7.4, 6, 3.6, -0.5), C.grey, { b: 5, sh: 0, hi: 0, ol: C.grey[3] });
      P.line(12, 7.4, 19, 1.4, C.grey[1]);
      P.part(P.ell(19, 1.6, 1.5, 1.5), C.red, { b: 3, sh: 0, hi: 0 });
    }),
    weenie: () => mk(24, 20, P => {
      P.part(P.cap(4, 12, 20, 9, 4.2), C.oak, { b: 4 });
      P.part(P.cap(3, 10, 21, 7, 2.4), C.stone, { b: 3 });
      P.curve('M 6 9 Q 8 7 10 8.6 Q 12 10 14 7.8 Q 16 6 18 7.4', C.yellow[3]);
    }),
    matryoshka: () => mk(24, 20, P => {
      P.part(P.path('M 6 18 Q 4 10 9 7 Q 8 1 12 1 Q 16 1 15 7 Q 20 10 18 18 Z'), C.red, { b: 3 });
      P.part(P.ell(12, 5, 2.6, 2.6), C.skin, { b: 4, sh: 0 });
      P.px(11, 5, C.pupil); P.px(13, 5, C.pupil);
      P.part(P.ell(12, 13, 3, 3.4), C.yellow, { b: 3, sh: 0 });
      P.px(12, 13, C.red[2]);
    }),
    flag4: () => mk(24, 20, P => {
      P.part(P.rect(3, 1, 1.8, 18), C.grey, { b: 2, sh: 0 });
      P.part(P.rect(5, 2, 16, 11), C.red, { b: 3 });
      A.starShape(P, 10, 7, 3.2, 1.3, C.gold, 4);
    }),
    missile: () => mk(24, 20, P => {
      P.part(P.poly([7.4, 14, 9.6, 5, 12, 0, 14.4, 5, 16.6, 14]), C.grey, { b: 5 });
      P.part(P.poly([12, 1, 14, 5, 15.8, 13.4, 12, 13.4]), C.grey, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.path('M 8.6 14 Q 9 18 12 20 Q 15 18 15.4 14 Z'), C.orange, { b: 3, sh: 0 });
      P.part(P.path('M 10.6 14 Q 11 16.6 12 18 Q 13 16.6 13.4 14 Z'), RED, { sh: 0, hi: 0, ol: 0 });
    }),
    church: () => mk(24, 20, P => {
      P.part(P.rect(5, 10, 14, 9), C.cream, { b: 4 });
      P.part(P.poly([3, 10, 12, 4, 21, 10]), C.brick, { b: 3 });
      P.part(P.rect(10.6, 13, 2.8, 6), C.wood, { b: 2, sh: 0 });
      P.line(12, 4, 12, 0, C.gold[3]);
      P.line(10, 1.6, 14, 1.6, C.gold[3]);
    }),
    barrel: () => mk(24, 20, P => {
      P.part(P.path('M 6 3 L 18 3 Q 20 10 18 18 L 6 18 Q 4 10 6 3 Z'), C.yellow, { b: 3 });
      P.line(5.4, 7, 18.6, 7, C.yellow[1]);
      P.line(5.4, 14, 18.6, 14, C.yellow[1]);
      P.part(P.ell(12, 10.4, 2.6, 2.6), C.night, { b: 0, sh: 0, hi: 0 });
      P.px(11, 10, C.yellow[4]); P.px(13, 10, C.yellow[4]);
      P.part(P.ell(19, 17, 3, 1.6), C.slime, { b: 3, sh: 0 });
    }),
    bread: () => mk(24, 20, P => {
      P.part(P.path('M 3 16 Q 2 6 12 6 Q 22 6 21 16 Z'), C.oak, { b: 3 });
      for (const x of [8, 12, 16]) P.line(x - 1, 8, x + 1, 12, C.oak[4]);
      P.line(3, 16, 21, 16, C.oak[1]);
    }),
    issues: () => mk(24, 20, P => {
      P.part(P.poly([6, 8, 18, 8, 17, 19, 7, 19]), C.wood, { b: 2 });
      P.part(P.rect(4, 6, 16, 3), C.wood, { b: 3, sh: 0 });
      P.part(P.ell(12, 13, 2.6, 2.4), C.gold, { b: 3, sh: 0 });
      P.line(9, 6, 8, 2, C.grey[2]);
      P.line(15, 6, 16, 2, C.grey[2]);
      P.part(P.ell(8, 1.6, 1.4, 1.6), C.grey, { b: 4, sh: 0 });
      P.part(P.ell(16, 1.6, 1.4, 1.6), C.grey, { b: 4, sh: 0 });
    }),
    card: () => mk(24, 20, P => {
      P.part(P.poly([3, 5, 19, 3, 21, 15, 5, 17]), C.grey, { b: 5 });
      for (let i = 0; i < 3; i++) P.line(6 + i * 0.4, 8 + i * 3, 17 + i * 0.4, 6.6 + i * 3, C.grey[1]);
    }),
    soda: () => mk(24, 20, P => {
      P.part(P.poly([8, 19, 8, 8, 10, 5, 10, 1, 14, 1, 14, 5, 16, 8, 16, 19]), C.orange, { b: 3 });
      P.part(P.rect(9.6, 0, 4.8, 2), C.grey, { b: 4, sh: 0 });
      P.part(P.rect(9, 10, 6, 5), C.grey, { b: 5, sh: 0, hi: 0 });
      for (const [x, y] of [[18, 6], [20, 3], [5, 5]]) P.px(x, y, C.grey[5]);
    }),
    wc: () => mk(24, 20, (P, b) => {
      P.part(P.rect(5, 1, 14, 18), C.oak, { b: 3 });
      P.part(P.rect(7, 3, 10, 7), C.grey, { b: 5, sh: 0 });
      S.font.draw(b, 'W', 8, 4, C.blue[2], 0);
      P.part(P.ell(7.6, 12, 1.2, 1.2), C.gold, { b: 3, sh: 0, hi: 0 });
    }),
    bed: () => mk(24, 20, P => {
      P.part(P.rect(2, 4, 3, 14), C.wood, { b: 2 });
      P.part(P.rect(19, 9, 3, 9), C.wood, { b: 2 });
      P.part(P.rect(4, 11, 16, 5), C.blue, { b: 3 });
      P.part(P.ell(8, 10, 3.4, 2), C.grey, { b: 5 });
    }),
    mountain: () => mk(24, 20, P => {
      P.part(P.poly([1, 18, 6, 7, 10, 4, 15, 3, 19, 6, 23, 18]), C.stone, { b: 3 });
      for (const x of [7.6, 11, 14.4, 17.8]) { P.part(P.ell(x, 9.4, 1.6, 2), C.stone, { b: 4, sh: 0 }); P.px(x, 9, C.stone[1]); }
      P.part(P.poly([1, 18, 4, 15, 8, 17, 14, 15, 23, 18]), C.green, { b: 2, sh: 0 });
    }),
    calendar: () => mk(24, 20, P => {
      P.part(P.rect(3, 3, 18, 16), C.grey, { b: 5 });
      P.part(P.rect(3, 3, 18, 5), C.red, { b: 3, sh: 0 });
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) P.px(6 + c * 4, 11 + r * 3, r === 1 && c === 2 ? C.red[3] : C.grey[2]);
      P.part(P.ell(7.6, 3, 1, 1.6), C.grey, { b: 1, sh: 0, hi: 0 });
      P.part(P.ell(16.4, 3, 1, 1.6), C.grey, { b: 1, sh: 0, hi: 0 });
    })
  });

  for (const id of ['superball', 'agentc', 'pres', 'lincoln', 'boscov']) ICONS['f:' + id] = () => A.portrait(id);
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
