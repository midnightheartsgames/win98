(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const ICONS = S.ICONS;
  const A = S.art102;

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }
  const lamp = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];

  function letter(ch, ramp) {
    return () => mk(24, 20, (P, b) => {
      P.part(P.ell(12, 10, 9, 8), ramp, { b: 2 });
      S.font.drawCentered(b, ch, 12, 7, C.grey[5]);
    });
  }

  function swatch(ramp) {
    return () => mk(24, 20, P => {
      P.part(P.path('M 12 2 Q 21 4 20 12 Q 19 18 12 18 Q 4 18 4 11 Q 4 3 12 2 Z'), ramp, { b: 3 });
      P.part(P.ell(9, 7, 2.2, 1.6), ramp, { b: 4, sh: 0, hi: 0, ol: 0 });
    });
  }

  function polaroid(color) {
    return () => mk(24, 20, (P, b) => {
      P.part(P.poly([3, 2, 21, 1, 22, 19, 4, 20]), C.grey, { b: 5 });
      P.part(P.rect(6, 4, 13, 10), C.sky, { b: 2, sh: 0, hi: 0 });
      const skin = A.HUGH_SKIN[color] || C.skin;
      P.part(P.ell(9, 9, 2, 2.3), C.fur, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(8, 11, 3, 3), C.suit, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(13, 10.5, 1.5, 1.8), C.maxw, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(16.5, 8.2, 1.6, 2), skin, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(15, 10, 3, 4), C.cream, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.px(16.5, 6, C.hair[3]);
      b.set(9, 16, C.grey[2]); b.set(12, 16, C.grey[2]); b.set(15, 16, C.grey[2]);
    });
  }

  Object.assign(ICONS, {
    cream: () => mk(24, 20, P => {
      P.part(P.rect(8, 6, 8, 13), C.teal, { b: 3 });
      P.part(P.rect(8, 10, 8, 4), C.grey, { b: 5, sh: 0, hi: 0 });
      P.part(P.rect(9.5, 3, 5, 3), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(18, 4, 3.5, 2.6), C.grey, { b: 5, sh: 0 });
      P.part(P.ell(20, 7, 2.4, 2), C.grey, { b: 5, sh: 0 });
      P.px(11, 12, C.red[3]); P.px(13, 12, C.red[3]);
    }),
    lampshade: () => mk(24, 20, P => {
      P.part(P.poly([4, 16, 20, 16, 16, 3, 8, 3]), C.cream, { b: 3 });
      for (let i = 0; i < 6; i++) P.line(5 + i * 3, 16, 5 + i * 3, 18, C.gold[3]);
      P.line(7, 9, 17, 9, C.red[3]);
    }),
    plate: () => mk(24, 20, P => {
      P.part(P.ell(12, 11, 10, 6), C.grey, { b: 5 });
      P.part(P.ell(12, 11, 6.5, 3.6), C.grey, { b: 4, sh: 0, hi: 0, ol: C.grey[3] });
      P.curve('M 5 10 Q 12 6 19 10', C.blue[4]);
    }),
    vtape: () => mk(24, 20, (P, b) => {
      P.part(P.rect(2, 4, 20, 13), C.grey, { b: 0 });
      P.part(P.rect(4, 5, 16, 6), C.red, { b: 3, sh: 0, hi: 0 });
      S.font.draw(b, 'MC', 7, 5, C.grey[5], 0);
      P.part(P.ell(8, 14, 1.8, 1.8), C.grey, { b: 3, sh: 0, hi: 0 });
      P.part(P.ell(16, 14, 1.8, 1.8), C.grey, { b: 3, sh: 0, hi: 0 });
    }),
    pinkcake: () => mk(24, 20, P => {
      P.part(P.rect(3, 9, 18, 9), C.pink, { b: 3 });
      P.part(P.path('M 3 9 Q 12 3 21 9 L 21 11 Q 12 7 3 11 Z'), C.pink, { b: 4, sh: 0 });
      for (const [x, y] of [[6, 13], [11, 15], [16, 12], [18, 16]]) P.px(x, y, C.neonB);
      P.px(12, 5, C.neonA);
    }),
    kcake: () => mk(24, 20, P => {
      P.part(P.rect(3, 9, 18, 9), C.pink, { b: 3 });
      P.part(P.path('M 2 9 Q 12 2 22 9 L 22 12 Q 19 11 18 15 Q 16 11 13 12 Q 11 16 9 12 Q 6 11 5 14 Q 3 11 2 12 Z'), C.red, { b: 2 });
      P.px(10, 6, C.red[4]); P.px(15, 6, C.red[4]);
    }),
    lyrics: () => mk(24, 20, (P, b) => {
      P.part(P.poly([4, 2, 19, 2, 20, 19, 5, 19]), C.cream, { b: 4 });
      for (let i = 0; i < 4; i++) P.line(7, 6 + i * 3.4, 17, 6 + i * 3.4, C.cream[1]);
      S.font.draw(b, '?', 13, 3, C.blue[2], 0);
      S.font.draw(b, '?', 8, 10, C.blue[2], 0);
    }),
    cards: () => mk(24, 20, (P, b) => {
      P.part(P.poly([3, 7, 15, 3, 18, 13, 6, 17]), C.blue, { b: 2 });
      P.part(P.poly([6, 5, 19, 5, 19, 16, 6, 16]), C.blue, { b: 3 });
      S.font.draw(b, '$', 10, 6, C.gold[3], 0);
    }),
    coin: () => mk(24, 20, (P, b) => {
      P.part(P.ell(12, 10, 7, 7), C.stone, { b: 4 });
      P.part(P.ell(12, 10, 5, 5), C.stone, { b: 3, sh: 0, hi: 0, ol: C.stone[2] });
      S.font.drawCentered(b, '50', 12, 7, C.stone[1], 0);
    }),
    stamps: () => mk(24, 20, (P, b) => {
      P.part(P.poly([2, 5, 20, 3, 22, 16, 4, 18]), C.green, { b: 3 });
      P.part(P.poly([5, 7, 18, 6, 19, 14, 6, 15]), C.mint, { b: 4, sh: 0, hi: 0 });
      S.font.draw(b, '$', 7, 7, C.green[1], 0);
      S.font.draw(b, 'M', 12, 7, C.green[1], 0);
    }),
    modulator: () => mk(24, 20, P => {
      P.part(P.ell(15, 7, 6, 6.4), C.pink, { b: 3 });
      P.part(P.ell(13, 5, 1.6, 1.2), C.pink, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.curve('M 15 13 Q 17 15 13 16 Q 9 16 11 13 Q 13 10 8 12', C.yellow[3]);
      P.part(P.rect(3, 12, 6, 7), C.grey, { b: 4 });
      P.part(P.rect(4, 10, 3, 3), C.orange, { b: 3, sh: 0 });
    }),
    photo_: polaroid(''), photo_red: polaroid('red'), photo_green: polaroid('green'), photo_blue: polaroid('blue'),
    paper: () => mk(24, 20, (P, b) => {
      P.part(P.poly([2, 3, 21, 2, 22, 18, 3, 19]), C.cream, { b: 4 });
      P.part(P.rect(4, 4, 16, 3), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(9, 12, 4, 1.8), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(9, 10.8, 1.8, 1.3), C.sky, { b: 3, sh: 0, hi: 0 });
      P.part(P.ell(16, 12, 2, 2.4), C.slime, { b: 3, sh: 0 });
      for (let i = 0; i < 2; i++) P.line(4, 16 + i * 1.5, 20, 16 + i * 1.5, C.cream[1]);
    }),
    contract: () => mk(24, 20, P => {
      P.part(P.poly([4, 2, 19, 2, 20, 19, 5, 19]), C.grey, { b: 5 });
      for (let i = 0; i < 4; i++) P.line(7, 5 + i * 2.4, 17, 5 + i * 2.4, C.grey[2]);
      P.part(P.ell(15, 15, 3, 3), C.gold, { b: 3 });
      P.curve('M 6 16 Q 8 13 10 16 L 12 14', C.blue[2]);
    }),
    chef: () => mk(24, 20, P => {
      P.part(P.path('M 6 12 Q 2 4 8 4 Q 10 0 14 2 Q 19 1 19 6 Q 22 10 17 12 Z'), C.grey, { b: 5 });
      P.part(P.rect(7, 12, 10, 5), C.grey, { b: 5, sh: 1 });
    }),
    tophat: () => mk(24, 20, P => {
      P.part(P.rect(7, 2, 10, 13), C.night, { b: 1 });
      P.part(P.ell(12, 15, 10, 2.6), C.night, { b: 1 });
      P.part(P.rect(7, 11, 10, 2), C.grey, { b: 2, sh: 0, hi: 0 });
    }),
    crown: () => mk(24, 20, P => {
      P.part(P.poly([3, 16, 3, 5, 8, 10, 12, 3, 16, 10, 21, 5, 21, 16]), C.gold, { b: 3 });
      P.part(P.ell(12, 13, 1.6, 1.6), C.red, { b: 3, sh: 0, hi: 0 });
    }),
    halo: () => mk(24, 20, P => {
      P.part(P.ell(12, 7, 9, 3.2), lamp, { sh: 0, hi: 0 });
      P.part(P.ell(12, 7, 5.5, 1.5), C.gold, { b: 1, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(12, 15, 4, 4), C.grey, { b: 5 });
    }),
    juggle: () => mk(24, 20, P => {
      for (const [x, y] of [[5, 12], [12, 5], [19, 12]]) P.part(P.ell(x, y, 4, 1.8), C.grey, { b: 5 });
      P.curve('M 5 10 Q 12 -2 19 10', C.grey[3]);
    }),
    beard: () => mk(24, 20, P => {
      P.part(P.path('M 4 4 Q 6 16 12 18 Q 18 16 20 4 Q 16 9 12 8 Q 8 9 4 4 Z'), C.grey, { b: 5 });
      P.part(P.ell(8, 6, 2.6, 2), C.grey, { b: 5, sh: 0 });
      P.part(P.ell(16, 6, 2.6, 2), C.grey, { b: 5, sh: 0 });
    }),
    cow: () => { const b = new Buf(24, 20); const P = new Pen(b).at(12, 11, 0.95); A.cowHead(P, 0, 0, {}); return b; },
    noodles: () => mk(24, 20, P => {
      P.part(P.path('M 3 9 L 21 9 Q 20 18 12 18 Q 4 18 3 9 Z'), C.red, { b: 3 });
      for (let i = 0; i < 4; i++) P.curve(`M ${6 + i * 3} 9 Q ${8 + i * 3} 3 ${6 + i * 3} 1`, C.cheese[3]);
      P.line(15, 1, 20, 8, C.oak[2]); P.line(17, 1, 21, 7, C.oak[2]);
    }),
    toothpaste: () => mk(24, 20, (P, b) => {
      P.part(P.poly([3, 8, 18, 6, 19, 13, 3, 13]), C.sky, { b: 3 });
      P.part(P.rect(18, 8, 4, 4), C.grey, { b: 4, sh: 0 });
      S.font.draw(b, 'S', 7, 6, C.red[3], 0);
    }),
    mic: () => mk(24, 20, P => {
      P.part(P.cap(12, 9, 12, 19, 1.6), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(12, 6, 4.5, 5), C.grey, { b: 3 });
      for (let i = 0; i < 3; i++) P.line(9, 4 + i * 2, 15, 4 + i * 2, C.grey[1]);
    }),
    banjo: () => mk(24, 20, P => {
      P.part(P.ell(8, 12, 6.5, 6.5), C.oak, { b: 3 });
      P.part(P.ell(8, 12, 5, 5), C.cream, { b: 4, sh: 0, hi: 0 });
      P.part(P.poly([12, 9, 21, 2, 22, 4, 13, 11]), C.wood, { b: 2, sh: 0 });
      P.line(8, 12, 21, 3, C.grey[3]);
    }),
    toaster: () => mk(24, 20, P => {
      P.part(P.poly([3, 18, 3, 8, 6, 5, 18, 5, 21, 8, 21, 18]), C.grey, { b: 4 });
      P.part(P.rect(7, 3, 4, 4), C.oak, { b: 3, sh: 0 });
      P.part(P.rect(13, 3, 4, 4), C.oak, { b: 3, sh: 0 });
      P.part(P.rect(20, 11, 3, 2), C.grey, { b: 1, sh: 0 });
    }),
    camera: () => mk(24, 20, P => {
      P.part(P.rect(3, 6, 18, 12), C.grey, { b: 1 });
      P.part(P.rect(6, 3, 6, 4), C.grey, { b: 2, sh: 0 });
      P.part(P.ell(12, 12, 4, 4), C.grey, { b: 0, sh: 0 });
      P.part(P.ell(12, 12, 2, 2), C.sky, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(17, 7, 2, 2), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
    }),
    pot: () => mk(24, 20, P => {
      P.part(P.poly([4, 8, 20, 8, 19, 18, 5, 18]), C.stone, { b: 3 });
      P.part(P.rect(2, 7, 20, 3), C.stone, { b: 4, sh: 0 });
      P.curve('M 8 5 Q 10 2 8 0', C.grey[4]); P.curve('M 14 5 Q 16 2 14 0', C.grey[4]);
    }),
    cup: () => mk(24, 20, P => {
      P.part(P.poly([6, 4, 18, 4, 15, 18, 9, 18]), C.sky, { b: 3 });
      P.part(P.poly([7, 6, 17, 6, 16, 10, 8, 10]), C.slime, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.line(15, 4, 19, 0, C.red[3]);
    }),
    oven: () => mk(24, 20, P => {
      P.part(P.rect(3, 3, 18, 15), C.grey, { b: 4 });
      P.part(P.rect(6, 8, 12, 8), C.orange, { b: 3, sh: 0, hi: 0 });
      for (let i = 0; i < 3; i++) P.part(P.ell(8 + i * 4, 5, 1.2, 1.2), C.grey, { b: 1, sh: 0, hi: 0, ol: 0 });
    }),
    feel: () => mk(24, 20, (P, b) => {
      P.part(P.ell(12, 13, 6, 5.5), C.fur, { b: 3 });
      for (let i = 0; i < 4; i++) P.part(P.cap(8 + i * 2.7, 10, 7 + i * 3, 3 + Math.abs(i - 1.5), 1.3), C.fur, { b: 3, sh: 0 });
      S.font.draw(b, '?', 17, 1, C.yellow[4]);
    }),
    yes: () => mk(24, 20, P => P.part(P.path('M 4 11 L 8 7 L 11 11 L 18 3 L 21 7 L 11 17 Z'), C.green, { b: 3 })),
    no: () => mk(24, 20, P => { P.part(P.cap(5, 4, 19, 16, 2.4), C.red, { b: 3 }); P.part(P.cap(19, 4, 5, 16, 2.4), C.red, { b: 3 }); }),
    ans_a: letter('A', C.blue), ans_b: letter('B', C.blue), ans_c: letter('C', C.blue), ans_d: letter('D', C.blue),
    sw_red: swatch(C.red), sw_green: swatch(C.slime), sw_blue: swatch(C.sky), sw_skin: swatch(C.skin),
    mind: () => mk(24, 20, P => {
      P.part(P.ell(12, 11, 8, 7), C.pink, { b: 3 });
      P.curve('M 6 10 Q 9 6 12 10 Q 15 6 18 10', C.pink[1]);
      P.curve('M 7 14 Q 12 11 17 14', C.pink[1]);
      for (const [x, y] of [[3, 3], [21, 4], [2, 16]]) P.px(x, y, C.cycle[x % 8]);
    })
  });

  for (const id of ['myra', 'hugh', 'director', 'philo', 'featherly', 'bessy', 'lord', 'rat', 'bear']) ICONS['f:' + id] = () => A.portrait(id);
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
