(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const ICONS = S.ICONS;
  const A = S.art201;
  const TAU = Math.PI * 2;

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }
  const ic = fn => () => mk(24, 20, fn);
  const txt = (b, t, x, y, c) => S.font.draw(b, t, x, y, c, C.black);

  function head(P, x, y, ramp, o) {
    P.part(P.ell(x, y, 6, 6), ramp, { b: 3 });
    for (const ex of [-2, 2]) P.px(x + ex, y - 1, C.pupil);
    if (o && o.mouth) P.part(P.ell(x, y + 3, 2.4, 1.4), C.red, { b: 1, sh: 0, hi: 0 });
  }

  Object.assign(ICONS, {
    key21: ic(P => A.windKey(P, 12, 12, 0.72)),
    betty21: ic(P => A.betty(P, 12, 20, 0.27, {})),
    maze21: ic(P => A.maze(P, 12, 17, 0.9, false)),
    mary21: ic(P => A.maze(P, 12, 18, 0.9, true)),
    tags21: ic(P => A.tags(P, 12, 17, 1)),
    can21: ic(P => A.can(P, 9, 17, 0.9, true)),
    record21: ic(P => A.record(P, 12, 19, 0.95)),
    pest21: ic(P => A.horse(P, 11, 19, 'pest', 0.62)),
    death21: ic(P => A.horse(P, 11, 19, 'death', 0.62)),
    war21: ic(P => A.horse(P, 11, 19, 'war', 0.62)),
    famine21: ic(P => A.horse(P, 11, 19, 'famine', 0.62)),
    sock21: ic(P => A.sock(P, 10, 19, 1, false)),
    coal21: ic(P => A.sock(P, 10, 19.4, 0.92, true)),
    snow21: ic(P => A.snowball(P, 12, 18, 1.3)),
    globe21: ic(P => A.globe(P, 12, 19.6, 0.88, 0, 0)),
    globef21: ic(P => A.globe(P, 12, 19.6, 0.88, 3, 0.4)),
    jglove21: ic(P => A.rglove(P, 12, 18, 1.15)),
    bath21: ic(P => A.footbath(P, 12, 16, 0.75, 0.5)),
    watch21: ic(P => A.stopwatch(P, 12, 19, 1.05)),
    parcel21: ic(P => A.parcel(P, 12, 18, 0.9, 0)),
    moai21: ic(P => {
      P.part(P.rect(6, 15, 12, 4), C.stone, { b: 2 });
      P.part(P.path('M 8 15 L 7 5 Q 12 1 17 5 L 16 15 Z'), C.stone, { b: 3 });
      P.part(P.rect(8, 6, 8, 2), C.stone, { b: 1, sh: 0, hi: 0 });
      P.line(12, 8, 12, 11, C.stone[1]);
      P.line(10, 13, 14, 13, C.stone[1]);
    }),
    quiet21: ic((P, b) => { P.part(P.rect(4, 6, 16, 12), C.sand, { b: 3 }); P.line(12, 6, 12, 18, C.red[3]); P.line(4, 11, 20, 11, C.red[3]); txt(b, 'Ш', 15, 0, C.grey[5]); }),
    gift21: ic(P => {
      P.part(P.rect(5, 8, 14, 11), C.red, { b: 3 });
      P.part(P.rect(4, 6, 16, 4), C.red, { b: 4 });
      P.part(P.rect(11, 6, 3, 13), C.gold, { b: 4, sh: 0 });
      P.part(P.ell(9, 4, 3, 2), C.gold, { b: 4 });
      P.part(P.ell(15, 4, 3, 2), C.gold, { b: 4 });
    }),
    robot21: ic(P => A.robotHead(new Pen(P.b).at(12, 19, 0.36), 0, 0, { mode: 'face', eye: true })),
    office21: ic(P => {
      P.part(P.rect(3, 3, 18, 15), C.brick, { b: 3 });
      P.part(P.rect(6, 6, 12, 7), C.sky, { b: 3, sh: 0 });
      P.line(12, 6, 12, 13, C.oak[1]);
    }),
    note21: ic(P => {
      for (const x of [7, 15]) { P.part(P.ell(x, 15, 3, 2.2, -0.4), C.pink, { b: 4, sh: 0 }); P.line(x + 2.4, 15, x + 2.4, 4, C.black); }
      P.part(P.rect(9, 3, 9, 2.4), C.black, { b: 0, sh: 0, hi: 0 });
    }),
    math21: ic((P, b) => { P.part(P.rect(3, 3, 18, 14), C.night, { b: 1 }); txt(b, '2x2', 5, 6, C.grey[5]); }),
    heart21: ic(P => P.part(P.path('M 12 18 Q 2 10 4 6 Q 7 1 12 6 Q 17 1 20 6 Q 22 10 12 18 Z'), C.red, { b: 3 })),
    clock21: ic(P => { P.part(P.ell(12, 10, 8, 8), C.cream, { b: 4 }); P.line(12, 10, 12, 4, C.black); P.line(12, 10, 16, 12, C.black); }),
    fool21: ic(P => {
      P.part(P.path('M 12 18 Q 4 12 5 8 Q 7 4 12 8 Q 17 4 19 8 Q 20 12 12 18 Z'), C.pink, { b: 3 });
      P.part(P.poly([6, 7, 3, 1, 9, 5]), C.gold, { b: 3, sh: 0 });
      P.part(P.poly([18, 7, 21, 1, 15, 5]), C.green, { b: 3, sh: 0 });
      P.px(3, 1, C.gold[4]); P.px(21, 1, C.gold[4]);
    }),
    punch21: ic(P => A.rglove(P, 12, 18, 1.2)),
    star21: ic(P => P.part(P.poly([12, 1, 15, 8, 22, 8, 16.6, 12.6, 19, 19, 12, 15, 5, 19, 7.4, 12.6, 2, 8, 9, 8]), C.gold, { b: 4 })),
    foot21: ic(P => { P.part(P.ell(12, 12, 6, 8), C.pale, { b: 3 }); for (let i = 0; i < 5; i++) P.part(P.ell(7 + i * 2.6, 3.4 + Math.abs(i - 2) * 0.6, 1.2, 1.2), C.pale, { b: 3, sh: 0 }); }),
    quiz21: ic((P, b) => { P.part(P.rect(2, 2, 20, 16), C.wood, { b: 2 }); P.part(P.rect(4, 4, 16, 12), C.night, { b: 1, sh: 0 }); txt(b, '?', 9, 5, C.lamp); }),
    cake21: ic(P => {
      P.part(P.rect(4, 10, 16, 8), C.pink, { b: 3 });
      P.part(P.rect(4, 8, 16, 3), C.cream, { b: 4, sh: 0 });
      for (const x of [8, 12, 16]) { P.line(x, 3, x, 8, C.sky[3]); P.px(x, 2, C.lamp); }
    }),
    zap21: ic(P => { for (let i = 0; i < 4; i++) P.line(2, 4 + i * 4, 22, 2 + i * 4, C.neonA); P.part(P.rect(0, 0, 3, 20), C.grey, { b: 2 }); P.part(P.rect(21, 0, 3, 20), C.grey, { b: 2 }); }),
    car21: ic(P => {
      P.part(P.path('M 2 14 L 4 9 L 8 9 L 11 5 L 17 5 L 20 9 L 22 10 L 22 14 Z'), C.red, { b: 3 });
      P.part(P.rect(12, 6, 4, 3), C.sky, { b: 4, sh: 0 });
      P.part(P.ell(7, 15, 2.6, 2.6), C.night, { b: 1 });
      P.part(P.ell(18, 15, 2.6, 2.6), C.night, { b: 1 });
    }),
    elmer21: ic(P => {
      P.part(P.ell(12, 13, 6, 6), C.blue, { b: 3 });
      P.part(P.ell(12, 6, 5, 5), C.blue, { b: 4 });
      P.px(10, 5, C.eye); P.px(14, 5, C.eye);
      P.part(P.ell(12, 8, 1.6, 1.2), C.red, { b: 3, sh: 0, hi: 0 });
    }),
    flag21: ic(P => {
      P.line(5, 2, 5, 19, C.grey[4]);
      for (let y = 0; y < 4; y++) for (let x = 0; x < 6; x++) P.part(P.rect(6 + x * 2.4, 2 + y * 2.4, 2.4, 2.4), (x + y) % 2 ? C.grey : C.night, { b: (x + y) % 2 ? 5 : 1, sh: 0, hi: 0, ol: 0 });
    }),
    again21: ic(P => {
      P.curve('M 18 6 Q 12 0 6 5 Q 2 10 6 15 Q 12 19 17 14', C.neonB);
      P.curve('M 18 7 Q 12 1 7 5 Q 3 10 7 14 Q 12 18 16 13', C.neonB);
      P.part(P.poly([14, 3, 21, 4, 18, 10]), [C.neonB, C.neonB, C.neonB, C.neonB, C.neonB], { b: 3, sh: 0 });
    }),
    sleigh21: ic(P => A.sleigh(new Pen(P.b).at(13, 17, 0.2), 0, 0, {})),
    pole21: ic(P => { A.pole(P, 12, 19, 16); }),
    home21: ic(P => {
      P.part(P.rect(5, 9, 14, 10), C.brick, { b: 3 });
      P.part(P.poly([3, 10, 12, 2, 21, 10]), C.red, { b: 2 });
      P.part(P.rect(10, 13, 4, 6), C.oak, { b: 2, sh: 0 });
    }),
    decree21: ic(P => {
      P.part(P.poly([4, 2, 18, 2, 18, 18, 4, 18]), C.cream, { b: 4, sh: 1 });
      for (let i = 0; i < 4; i++) P.line(6, 5 + i * 2.6, 16, 5 + i * 2.6, C.cream[1]);
      P.part(P.ell(14, 15, 3.4, 3), C.red, { b: 3, sh: 0 });
    }),
    up21: ic(P => { P.part(P.poly([12, 2, 20, 11, 15, 11, 15, 18, 9, 18, 9, 11, 4, 11]), C.sky, { b: 3 }); }),
    cry21: ic(P => { head(P, 12, 10, C.skin, { mouth: true }); P.line(10, 10, 9, 17, C.sky[3]); P.line(14, 10, 15, 17, C.sky[3]); }),
    log21: ic(P => { P.part(P.rect(3, 2, 18, 16), C.night, { b: 1 }); for (let i = 0; i < 4; i++) P.line(5, 5 + i * 3, 12 + (i % 2) * 6, 5 + i * 3, C.neonB); }),
    wish21: ic(P => {
      P.part(P.poly([4, 2, 20, 2, 20, 18, 4, 18]), C.cream, { b: 4 });
      for (let i = 0; i < 4; i++) { P.px(6, 5 + i * 3, C.red[3]); P.line(8, 5 + i * 3, 18, 5 + i * 3, C.cream[1]); }
    }),
    bulb21: ic(P => { P.part(P.ell(12, 8, 6, 6), C.yellow, { b: 4 }); P.part(P.rect(9, 13, 6, 5), C.grey, { b: 3 }); }),
    bill21: ic((P, b) => { P.part(P.poly([4, 2, 20, 2, 20, 18, 4, 18]), C.grey, { b: 5 }); txt(b, '$', 8, 5, C.green[2]); P.line(6, 15, 18, 15, C.grey[2]); }),
    ferret21: ic(P => {
      P.part(P.rect(4, 7, 16, 10), C.red, { b: 3 });
      for (const x of [8, 16]) { P.part(P.ell(x, 5, 3, 3), C.oak, { b: 3 }); P.px(x, 4, C.pupil); }
    }),
    goo21: ic(P => {
      P.part(P.path('M 3 18 Q 2 8 12 4 Q 22 8 21 18 Z'), C.sky, { b: 3 });
      P.px(9, 10, C.yellow[4]); P.px(15, 10, C.yellow[4]);
    }),
    tube21: ic(P => { P.part(P.rect(9, 2, 6, 16), C.sky, { b: 4, sh: 0 }); P.part(P.ell(12, 17, 3, 2), C.slime, { b: 3, sh: 0 }); P.part(P.rect(8, 1, 8, 2), C.grey, { b: 3, sh: 0 }); }),
    leaf21: ic(P => S.art106.leaf(P, 12, 10, 1.1)),
    donkey21: ic(P => {
      P.part(P.ell(12, 12, 8, 5), C.grey, { b: 2 });
      P.part(P.ell(19, 7, 3.4, 3), C.grey, { b: 2 });
      P.line(18, 3, 17, 0, C.grey[2]); P.line(21, 3, 22, 0, C.grey[2]);
      for (const x of [7, 11, 14, 17]) P.line(x, 16, x, 19, C.grey[1]);
    }),
    ttt21: ic(P => {
      P.part(P.rect(2, 2, 20, 16), C.night, { b: 1 });
      for (const x of [9, 15]) P.line(x, 3, x, 17, C.neonB);
      for (const y of [7, 12]) P.line(3, y, 21, y, C.neonB);
      P.line(4, 3, 8, 6, C.neonA); P.line(8, 3, 4, 6, C.neonA);
      P.part(P.ell(18, 15, 1.8, 1.6), C.lamp, { b: 3, sh: 0, hi: 0, ol: 0 });
    }),
    mime21: ic(P => {
      P.part(P.ell(12, 10, 7, 8), C.grey, { b: 5 });
      P.line(8, 7, 10, 9, C.black); P.line(16, 7, 14, 9, C.black);
      P.line(9, 14, 15, 14, C.red[3]);
      P.part(P.rect(5, 1, 14, 3), C.night, { b: 1, sh: 0 });
    }),
    eyes21: ic(P => { for (let i = 0; i < 6; i++) { const x = 5 + (i % 3) * 7, y = 6 + Math.floor(i / 3) * 8; P.part(P.ell(x, y, 2.6, 2.2), C.eye, { b: 3, sh: 0, hi: 0 }); P.px(x, y, C.pupil); } }),
    tie21: ic(P => { P.part(P.poly([10, 2, 14, 2, 13, 5, 16, 15, 12, 19, 8, 15, 11, 5]), C.red, { b: 3 }); }),
    scream21: ic(P => { head(P, 12, 9, C.grey); P.part(P.ell(12, 13, 2.6, 3), C.night, { b: 0, sh: 0, hi: 0 }); }),
    sue21: ic((P, b) => { P.part(P.rect(3, 4, 18, 12), C.cream, { b: 4 }); txt(b, 'ЗИНА', 3, 6, C.red[2]); P.line(3, 9, 21, 12, C.black); }),
    you21: ic(P => { P.part(P.cap(4, 12, 18, 8, 2.4), C.skin, { b: 3 }); P.part(P.ell(19, 7, 2.4, 2.4), C.skin, { b: 3 }); })
  });

  for (const id of ['santa', 'evil', 'elfr', 'elfg', 'demon', 'gpast', 'gpres', 'gfut', 'stinky', 'mary', 'yjimmy', 'timmy', 'pedro', 'bug', 'lincoln', 'cops', 'fsam', 'fmax']) ICONS['f:' + id + '21'] = () => A.portrait(id);
  ICONS['f:flint21'] = ic(P => {
    P.part(P.rect(2, 2, 20, 16), C.teal, { b: 2 });
    P.part(P.ell(12, 10, 5, 4.4), C.night, { b: 0, sh: 0, hi: 0 });
    P.px(11, 9, C.skin[3]); P.px(13, 9, C.skin[3]);
    P.px(11, 10, C.pupil);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; P.line(12 + Math.cos(a) * 5, 10 + Math.sin(a) * 4.4, 12 + Math.cos(a) * 7, 10 + Math.sin(a) * 6, C.teal[1]); }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
