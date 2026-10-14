(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const ICONS = S.ICONS;
  const A = S.art106;
  const { BOW } = A;
  const TAU = Math.PI * 2;

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }

  function disc(P, x, y, r, t) {
    P.part(P.ell(x, y, r + 1.4, r + 1.4), C.gold, { b: 2 });
    for (let i = 0; i < 7; i++) {
      const a0 = t + i * TAU / 7, a1 = t + (i + 1) * TAU / 7;
      const pts = [x, y];
      for (let k = 0; k <= 3; k++) { const a = a0 + (a1 - a0) * k / 3; pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      P.part(P.poly(pts), BOW[i], { b: 3, sh: 0, hi: 0, ol: 0 });
    }
  }

  Object.assign(ICONS, {
    maxbliss6: () => A.portrait('maxbliss'),
    uniyel6: () => mk(24, 20, P => A.uni(P.scaled(11, 19.6, 0.82), 11, 19.6, C.yellow)),
    unired6: () => mk(24, 20, P => A.uni(P.scaled(11, 19.6, 0.82), 11, 19.6, C.red)),
    case6: () => mk(24, 20, P => A.caseArt(P, 12, 18, false)),
    gastro6: () => mk(24, 20, P => A.talisman(P, 12, 12, 'gastro', 6.4)),
    lead6: () => mk(24, 20, P => A.talisman(P, 12, 12, 'lead', 6.4)),
    spoon6: () => mk(24, 20, P => A.talisman(P, 12, 12, 'spoon', 6.4)),
    mtal6: () => mk(24, 20, P => A.talisman(P, 12, 12, 'mtal', 6.4)),
    hat6: () => mk(24, 20, P => A.hat(P, 12, 19, false, 1.12)),
    hatrat6: () => mk(24, 20, P => A.hat(P, 12, 19.8, true, 0.98)),
    deed6: () => mk(24, 20, P => {
      P.part(P.poly([3, 3, 21, 2, 21, 17, 3, 18]), C.cream, { b: 4, sh: 1 });
      P.part(P.rect(5, 4.4, 5, 4), C.blue, { b: 2, sh: 0, hi: 0, ol: 0 });
      for (let i = 0; i < 2; i++) P.line(11, 5 + i * 2, 19, 5 + i * 2, C.red[3]);
      for (let i = 0; i < 3; i++) P.line(5, 10.4 + i * 2, 19 - i * 3, 10.4 + i * 2, C.cream[1]);
      P.part(P.ell(17, 14.4, 2.4, 2.2), C.red, { b: 3, sh: 0 });
      P.curve('M 3 12 Q 6 13 5 15 Q 7 16 6 18', C.cream[0]);
    }),
    cad6: () => mk(24, 20, (P, b) => {
      P.part(P.rect(2, 4, 20, 12), C.pistachio, { b: 3 });
      P.part(P.rect(3.6, 5.6, 16.8, 8.8), C.pistachio, { b: 4, sh: 0, hi: 0, ol: C.pistachio[1] });
      A.leaf(P, 15, 10, 0.6);
      S.font.draw(b, '$', 5, 6, C.green[1], 0);
    }),
    remote6: () => mk(24, 20, P => A.remote(P, 11, 17.4, 0.86)),
    key6: () => mk(24, 20, P => {
      P.part(P.rect(10, 5, 11, 2.4), C.gold, { b: 3, sh: 0 });
      P.part(P.rect(16, 7, 2, 3), C.gold, { b: 3, sh: 0 });
      P.part(P.rect(19, 7, 2, 4), C.gold, { b: 3, sh: 0 });
      P.part(P.ell(7, 6, 4.6, 4.6), C.gold, { b: 3 });
      P.part(P.ell(7, 6, 1.7, 1.7), C.night, { b: 0, sh: 0, hi: 0 });
      P.line(7, 10, 8, 13, C.grey[3]);
      P.part(P.poly([3, 12.6, 14, 12.6, 14, 19, 3, 19]), C.cream, { b: 4, sh: 0 });
      P.line(5, 15, 12, 15, C.red[2]);
      P.line(5, 17, 10, 17, C.cream[1]);
    }),
    saw6: () => mk(24, 20, P => {
      P.part(P.poly([2, 6, 17, 4, 17, 11, 2, 11]), C.grey, { b: 4, sh: 0 });
      for (let i = 0; i < 6; i++) P.part(P.poly([2 + i * 2.5, 11, 4.5 + i * 2.5, 11, 3.2 + i * 2.5, 14]), C.grey, { b: 4, sh: 0, hi: 0 });
      P.part(P.poly([17, 2, 23, 3, 23, 13, 17, 14]), C.wood, { b: 3 });
      P.part(P.rect(19, 6, 2, 4), C.wood, { b: 0, sh: 0, hi: 0, ol: 0 });
    }),
    decree6: () => mk(24, 20, P => {
      P.part(P.poly([4, 2, 18, 2, 18, 18, 4, 18]), C.cream, { b: 4, sh: 1 });
      for (let i = 0; i < 4; i++) P.line(6, 5 + i * 2.6, 16, 5 + i * 2.6, C.cream[1]);
      P.part(P.ell(14, 15, 3.4, 3), C.red, { b: 3, sh: 0 });
      P.part(P.rect(16, 6, 6, 5), C.wood, { b: 2 });
      P.part(P.rect(18, 2, 2, 4), C.wood, { b: 3, sh: 0 });
    }),
    moon6: () => mk(24, 20, P => {
      P.part(P.ell(12, 10, 8.4, 8.4), C.stone, { b: 4 });
      for (const [x, y, r] of [[9, 7, 2], [15, 11, 2.6], [10, 14, 1.4]]) P.part(P.ell(x, y, r, r * 0.8), C.stone, { b: 2, sh: 0, hi: 0, ol: C.stone[1] });
    }),
    earth6: () => mk(24, 20, P => A.earth(P, 12, 10, 8.4, {})),
    rainbow6: () => mk(24, 20, P => A.rainbow(P, 12, 17, 10, 1.3)),
    beam6: () => mk(24, 20, (P, b) => {
      A.beam(b, 6, 5, 17, 14, 0, 1.6);
      P.part(P.ell(5, 4, 3.6, 3.6), C.stone, { b: 4 });
      A.earth(P, 18, 15, 4.4, {});
    }),
    micro6: () => mk(24, 20, P => A.micro(P.scaled(12, 17, 0.8), 12, 17, true)),
    doom6: () => mk(24, 20, P => {
      P.part(P.rect(2, 1, 20, 18), C.night, { b: 1 });
      for (const x of [9, 15]) P.line(x, 3, x, 16, C.neonB);
      for (const y of [7, 12]) P.line(4, y, 19, y, C.neonB);
      P.line(5, 3, 7, 5, C.neonA); P.line(7, 3, 5, 5, C.neonA);
      P.line(16, 13, 18, 15, C.neonA); P.line(18, 13, 16, 15, C.neonA);
      for (const [x, y] of [[12, 9], [6, 14]]) { P.px(x, y - 1, C.lamp); P.px(x - 1, y, C.lamp); P.px(x + 1, y, C.lamp); P.px(x, y + 1, C.lamp); }
    }),
    wheel6: () => mk(24, 20, P => { disc(P, 12, 10, 7.6, 0.4); P.part(P.ell(12, 10, 1.4, 1.4), C.gold, { b: 4, sh: 0 }); }),
    leaf6: () => mk(24, 20, P => A.leaf(P, 12, 10, 1.4)),
    crown6: () => mk(24, 20, P => {
      P.part(P.poly([3, 16, 2, 5, 7.4, 10, 12, 3, 16.6, 10, 22, 5, 21, 16]), C.gold, { b: 3 });
      P.part(P.rect(3, 15, 18, 3), C.gold, { b: 2, sh: 0 });
      P.px(12, 9, C.red[3]); P.px(7, 13, C.sky[3]); P.px(17, 13, C.sky[3]);
    }),
    germ6: () => mk(24, 20, P => {
      P.part(P.ell(8, 12, 5.4, 4.6), C.slime, { b: 3 });
      P.part(P.ell(16, 8, 4.6, 4.2), C.mint, { b: 3 });
      P.part(P.ell(16, 15.4, 3.4, 3), C.teal, { b: 3 });
      for (const [x, y] of [[6.6, 11], [9.6, 11], [15, 7], [17.4, 7], [15.4, 15], [17, 15]]) P.px(x, y, C.lamp);
      for (const [x, y] of [[3, 5], [21, 3], [11, 3], [22, 12]]) P.px(x, y, C.slime[4]);
    }),
    hockey6: () => mk(24, 20, P => {
      P.part(P.cap(18, 2, 8, 14, 1.2), C.oak, { b: 3, sh: 0 });
      P.part(P.poly([8, 13, 9.6, 15.4, 3, 18.4, 2, 16]), C.oak, { b: 3, sh: 0 });
      P.part(P.ell(17, 16.4, 3.6, 1.8), C.night, { b: 1 });
    }),
    fox6: () => mk(24, 20, P => {
      P.part(P.poly([4, 3, 9, 8, 5, 10]), C.orange, { b: 2 });
      P.part(P.poly([20, 3, 15, 8, 19, 10]), C.orange, { b: 2 });
      P.part(P.path('M 4 8 Q 12 4 20 8 Q 18 14 12 18 Q 6 14 4 8 Z'), C.orange, { b: 3 });
      P.part(P.path('M 7 12 Q 12 12 17 12 Q 15 15 12 18 Q 9 15 7 12 Z'), C.cream, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.px(9, 10, C.pupil); P.px(15, 10, C.pupil);
      P.part(P.ell(12, 16.4, 1.2, 1), C.black, { b: 0, sh: 0, hi: 0 });
    }),
    level6: () => mk(24, 20, P => {
      BOW.forEach((r, i) => P.part(P.rect(5, 16.6 - i * 2.4, 14, 2.4), r, { b: 3, sh: 0, hi: 0, ol: 0 }));
      S.outerLine(P.b, P.rect(5, 2.2, 14, 16.8), C.black);
      P.part(P.poly([20, 3, 23, 1, 23, 5]), C.grey, { b: 5, sh: 0 });
    }),
    poster6: () => mk(24, 20, (P, b) => {
      P.part(P.rect(3, 1, 18, 18), C.night, { b: 1 });
      P.part(P.ell(8, 6, 3, 3), C.stone, { b: 4, sh: 0 });
      A.beam(b, 9, 8, 15, 13, 0, 1);
      A.earth(P, 16, 14, 3.4, {});
    }),
    door6: () => mk(24, 20, P => {
      P.part(P.rect(5, 1, 14, 18), C.stone, { b: 2 });
      for (const [x, y] of [[7, 3], [16, 3], [7, 16], [16, 16]]) P.px(x, y, C.stone[4]);
      P.part(P.ell(12, 9, 2.4, 2.4), C.red, { b: 3, sh: 0 });
    }),
    meter6: () => mk(24, 20, P => A.meter(P.scaled(6, 19.4, 0.44), 6, 19.4, true))
  });

  for (const id of ['hugh', 'superball', 'harry', 'abe', 'philo', 'momma', 'queen', 'leonard', 'cops', 'jimmy', 'green']) ICONS['f:' + id + '6'] = () => A.portrait(id);

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
