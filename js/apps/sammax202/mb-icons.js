(function (S) {
  'use strict';
  const { C, Buf, Pen } = S;
  const ICONS = S.ICONS;
  const TAU = Math.PI * 2;

  function mk(w, h, fn) { const b = new Buf(w, h); fn(new Pen(b), b); return b; }
  const ic = fn => () => mk(24, 20, fn);

  Object.assign(ICONS, {
    sandwich22: ic(P => {
      P.part(P.poly([3, 16, 21, 16, 12, 4]), C.stone, { b: 3 });
      P.part(P.poly([6, 14, 18, 14, 12, 6]), C.grey, { b: 2, sh: 0 });
      P.px(10, 10, C.red[3]);
      P.px(14, 11, C.green[3]);
    }),
    suntea22: ic(P => {
      P.part(P.rect(6, 4, 12, 14), C.yellow, { b: 3 });
      P.part(P.rect(7, 2, 10, 3), C.night, { b: 1, sh: 0 });
      P.line(9, 7, 9, 15, C.orange[2]);
      P.line(14, 7, 14, 15, C.orange[2]);
    }),
    youthwater22: ic(P => {
      P.part(P.rect(5, 5, 12, 12), C.stone, { b: 3 });
      P.part(P.rect(17, 7, 4, 8), C.stone, { b: 2, sh: 0 });
      P.part(P.rect(6, 6, 10, 6), C.sky, { b: 4, sh: 0, hi: 0 });
      P.px(9, 8, C.neonB);
      P.px(12, 9, C.grey[5]);
    }),
    seismic22: ic(P => {
      P.part(P.rect(4, 5, 16, 12), C.night, { b: 2 });
      P.part(P.ell(12, 11, 4, 4), C.sky, { b: 3, sh: 0 });
      P.line(12, 5, 12, 2, C.grey[5]);
      P.px(12, 1, C.neonA);
    }),
    rattle22: ic(P => {
      P.part(P.ell(12, 7, 6, 5), C.gold, { b: 4 });
      P.line(12, 12, 12, 18, C.gold[2]);
      P.px(12, 7, C.neonA);
    }),
    prophecy22: ic(P => {
      P.part(P.rect(5, 3, 14, 14), C.stone, { b: 3 });
      for (let i = 0; i < 3; i++) P.line(7, 6 + i * 4, 17, 6 + i * 4, C.stone[1]);
    }),
    flower22: ic(P => {
      P.part(P.ell(12, 10, 7, 7), C.red, { b: 4 });
      P.part(P.ell(12, 10, 3, 3), C.yellow, { b: 4, sh: 0 });
      P.line(12, 17, 12, 19, C.green[2]);
    }),
    pedrokey22: ic(P => {
      P.part(P.rect(11, 10, 2, 8), C.gold, { b: 3 });
      P.line(8, 4, 8, 10, C.gold[4]);
      P.line(16, 4, 16, 10, C.gold[4]);
      P.line(8, 10, 16, 10, C.gold[4]);
    }),
    spatula22: ic(P => {
      P.part(P.ell(12, 11, 8, 7), C.sky, { b: 3 });
      P.part(P.ell(12, 11, 4, 3), C.neonA, { b: 3, sh: 0 });
      P.part(P.rect(7, 17, 10, 2), C.gold, { b: 2 });
    }),
    beach22: ic(P => {
      P.part(P.rect(2, 12, 20, 6), C.sand, { b: 3 });
      P.part(P.poly([10, 14, 9, 4, 15, 4, 14, 14]), C.stone, { b: 2 });
      P.line(2, 17, 22, 17, C.sky[3]);
    }),
    volcano22: ic(P => {
      P.part(P.poly([2, 18, 9, 6, 15, 6, 22, 18]), C.stone, { b: 2 });
      P.part(P.ell(12, 6, 4, 2), C.red, { b: 2, sh: 0 });
      P.px(12, 3, C.grey[4]);
      P.px(13, 2, C.grey[3]);
    }),
    triangle22: ic(P => {
      P.part(P.poly([12, 2, 3, 17, 21, 17]), C.sky, { b: 3 });
      P.part(P.poly([12, 5, 6, 15, 18, 15]), C.night, { b: 1, sh: 0 });
      P.px(12, 10, C.neonB);
    }),
    moai_bernie22: ic(P => {
      P.part(P.poly([7, 18, 7, 4, 17, 4, 17, 18]), C.stone, { b: 3 });
      P.line(10, 9, 10, 17, C.sky[3]);
      P.line(14, 9, 14, 17, C.sky[3]);
    }),
    moai_billy22: ic(P => {
      P.part(P.poly([7, 18, 7, 4, 17, 4, 17, 18]), C.stone, { b: 3 });
      P.part(P.ell(12, 13, 3, 2), C.night, { b: 1, sh: 0 });
    }),
    moai_mort22: ic(P => {
      P.part(P.poly([7, 18, 7, 4, 17, 4, 17, 18]), C.stone, { b: 3 });
      P.line(9, 7, 15, 7, C.stone[1]);
      P.line(9, 13, 15, 13, C.stone[1]);
    }),
    pedro22: ic(P => {
      P.part(P.ell(12, 6, 10, 3), C.sand, { b: 3 });
      P.part(P.ell(12, 11, 4, 4), C.skin, { b: 3 });
      P.line(10, 13, 14, 13, C.night);
    }),
    lincoln22: ic(P => {
      P.part(P.rect(8, 2, 8, 8), C.night, { b: 2 });
      P.part(P.ell(12, 13, 4, 4), C.skin, { b: 3 });
      P.line(9, 15, 15, 15, C.night);
    }),
    sybil22: ic(P => {
      P.part(P.ell(12, 9, 6, 6), C.wood, { b: 3 });
      P.part(P.ell(12, 11, 4, 4), C.skin, { b: 3 });
      P.line(9, 10, 15, 10, C.night);
    }),
    bosco22: ic(P => {
      P.part(P.ell(12, 10, 6, 6), C.grey, { b: 4 });
      P.part(P.rect(9, 8, 6, 3), C.sky, { b: 2, sh: 0 });
    }),
    stinky22: ic(P => {
      P.part(P.ell(12, 11, 4, 4), C.skin, { b: 3 });
      P.part(P.rect(9, 4, 6, 4), C.grey, { b: 5, sh: 0 });
    }),
    gstinky22: ic(P => {
      P.part(P.ell(12, 11, 4, 4), C.skin, { b: 3 });
      P.part(P.rect(8, 6, 8, 3), C.night, { b: 2 });
      P.line(10, 13, 14, 13, C.grey[5]);
    }),
    bjimmy22: ic(P => {
      P.part(P.ell(12, 11, 4, 4), C.grey, { b: 3 });
      P.part(P.rect(9, 14, 6, 3), C.grey, { b: 5, sh: 0 });
    }),
    mary22: ic(P => {
      P.part(P.ell(12, 9, 4, 4), C.grey, { b: 3 });
      P.part(P.poly([8, 17, 16, 17, 12, 12]), C.rose, { b: 3 });
    }),
    surf22: ic(P => {
      P.part(P.poly([6, 17, 18, 17, 12, 2]), C.yellow, { b: 3 });
      P.line(12, 17, 12, 3, C.red[3]);
    }),
    kiss22: ic(P => {
      P.part(P.ell(9, 8, 4, 4), C.red, { b: 3 });
      P.part(P.ell(15, 8, 4, 4), C.red, { b: 3 });
      P.part(P.poly([5, 9, 19, 9, 12, 18]), C.red, { b: 3 });
    })
  });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
