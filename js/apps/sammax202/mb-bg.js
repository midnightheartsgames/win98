(function (S) {
  'use strict';
  const { C, Buf, Pen, part, shade, grad, hash, line } = S;
  const BG = S.BG;
  const A = S.art202;
  const { vgrad, pool, textOn, bricks, vignette } = BG;
  const STREET_W = 880;

  function pavement(buf, w) {
    const P = new Pen(buf);
    const walk = P.rect(0, 138, w, 30);
    grad(buf, walk, C.stone, (x, y) => 0.55 + (y - 138) / 90 + (hash(Math.floor(x / 2), Math.floor(y / 2), 4) - 0.5) * 0.1);
    for (let x = 0; x < w; x += 30) line(buf, x + 8, 138, x - 4, 168, C.stone[1]);
    line(buf, 0, 152, w, 152, C.stone[2]);
    part(buf, P.rect(0, 136, w, 3), C.stone, { b: 2, sh: 0, hi: 0 });
    part(buf, P.rect(0, 166, w, 5), C.stone, { b: 1, sh: 0, hi: 1 });
    const road = P.rect(0, 171, w, 29);
    grad(buf, road, C.asphalt, (x, y) => 0.55 - (y - 171) / 120 + (hash(x, y, 6) - 0.5) * 0.2);
    for (let x = 20; x < w; x += 60) part(buf, P.rect(x, 194, 26, 3), C.yellow, { b: 3, sh: 0, hi: 0, ol: 0 });
  }

  BG.office22 = function (buf, o) {
    BG.office(buf);
    const P = new Pen(buf);
    if (o && o.closetOpen) {
      part(buf, P.rect(220, 36, 50, 96), C.night, { b: 1 });
      for (let y = 64; y <= 112; y += 24) part(buf, P.rect(222, y, 46, 3), C.wood, { b: 2 });
    }
    const win = P.rect(100, 30, 64, 66);
    grad(buf, win, C.sky, (x, y) => 0.35 + (y - 30) / 100);
    if (o && o.portalGlow) {
      for (let i = 0; i < 12; i++) {
        const px = 104 + (i * 17) % 56;
        const py = 36 + (i * 23) % 52;
        buf.set(px, py, C.neonB);
      }
    }
  };

  BG.street22 = function (buf, o) {
    const base = new Buf(640, 200, 1);
    BG.street(base);
    const P = new Pen(buf);
    vgrad(buf, P.rect(0, 0, STREET_W, 200), C.sky, 0, 80, 0.7, 0.3);
    const copy = (sx0, sx1, dx) => {
      for (let y = 0; y < 138; y++) for (let x = sx0; x < sx1; x++) buf.px[y * buf.w + x + dx] = base.px[y * 640 + x];
    };
    copy(0, 640, 0);
    copy(152, 392, 640);
    pavement(buf, STREET_W);
    part(buf, P.rect(556, 44, 144, 11), C.rose, { b: 3 });
    textOn(buf, 'СИБИЛ. СЛУЖБА ЗНАКОМСТВ', 562, 46, C.grey[5], 0);
    part(buf, P.rect(250, 44, 130, 11), C.grey, { b: 2 });
    textOn(buf, 'БОСКО. БУНКЕР 2.0', 268, 46, C.neonA, 0);
    part(buf, P.rect(720, 38, 120, 14), C.pink, { b: 2 });
    textOn(buf, 'У СТИНКИ. ДЕЛИКАТЕСЫ', 726, 41, C.night, 0);
  };

  BG.sybil22 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 134);
    vgrad(buf, wall, C.rose, 0, 134, 0.85, 0.4);
    const floor = P.poly([0, 134, 320, 134, 320, 200, 0, 200]);
    grad(buf, floor, C.wood, (x, y) => 0.5 + (y - 134) / 130);
    part(buf, P.rect(0, 130, 320, 5), C.wood, { b: 2, sh: 0 });
    part(buf, P.rect(20, 20, 60, 40), C.lilac, { b: 3 });
    textOn(buf, 'ТЕСТ НА', 28, 26, C.night, 0);
    textOn(buf, 'СОВМЕСТИМОСТЬ', 22, 38, C.night, 0);
    part(buf, P.ell(50, 50, 4, 4), C.red, { b: 4, sh: 0 });
    part(buf, P.rect(180, 80, 100, 52), C.oak, { b: 3 });
    part(buf, P.rect(170, 76, 120, 6), C.wood, { b: 4 });
    vignette(buf, 0.85);
  };

  BG.bosco22 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 132);
    vgrad(buf, wall, C.grey, 0, 132, 0.85, 0.3);
    for (let x = 0; x < 320; x += 32) line(buf, x, 0, x, 132, C.grey[3]);
    const floor = P.poly([0, 132, 320, 132, 320, 200, 0, 200]);
    grad(buf, floor, C.stone, (x, y) => 0.45 + (y - 132) / 120);
    part(buf, P.rect(0, 128, 320, 5), C.night, { b: 1, sh: 0 });
    for (let y = 20; y <= 80; y += 30) {
      part(buf, P.rect(10, y, 100, 5), C.wood, { b: 2 });
      for (let x = 16; x < 100; x += 18) part(buf, P.rect(x, y - 12, 12, 12), C.teal, { b: 2 });
    }
    part(buf, P.rect(160, 86, 120, 46), C.night, { b: 2 });
    part(buf, P.rect(150, 82, 140, 6), C.grey, { b: 3 });
    textOn(buf, 'ЗОНА БЕЗ ТРЕУГОЛЬНИКОВ', 165, 96, C.neonA, 0);
    vignette(buf, 0.85);
  };

  BG.stinky22 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 132);
    vgrad(buf, wall, C.mint, 0, 132, 0.25, 0.7);
    part(buf, P.rect(0, 70, 320, 4), C.pink, { b: 3, sh: 0 });
    const floor = P.poly([0, 132, 320, 132, 320, 200, 0, 200]);
    floor.each((x, y) => { const k = (Math.floor(x / 14) + Math.floor((y - 132) / 9)) % 2; buf.set(x, y, k ? C.grey[5] : C.pink[2]); });
    shade(buf, floor, 0, (x, y) => (y - 132) / 260);
    part(buf, P.rect(0, 128, 320, 5), C.pink, { b: 2, sh: 0 });
    part(buf, P.rect(212, 12, 104, 54), C.night, { b: 1 });
    textOn(buf, 'МЕНЮ ОСТРОВА', 222, 14, C.lamp, 0);
    const menu = ['Гранитный сэндвич', 'Солнечный чай', 'Пемзовый десерт', 'Вулканический сыр'];
    menu.forEach((m, i) => textOn(buf, m, 216, 24 + i * 9, C.grey[5], 0));
    const counter = P.poly([178, 106, 320, 106, 320, 150, 178, 150]);
    part(buf, counter, C.pink, { b: 2 });
    part(buf, P.rect(176, 100, 144, 7), C.grey, { b: 4 });
    vignette(buf, 0.9);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
