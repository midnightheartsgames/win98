(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade, line, hash } = S;
  const BG = S.BG;
  const L = S.EP102.LAYERS;
  const { vgrad, pool, dropShadow, textOn, sprite, vignette, lineIn } = BG;
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];

  function curtain(buf, P, x0, x1, y0, y1, ramp) {
    const m = P.poly([x0, y0, x1, y0, x1 - (x1 > 160 ? -6 : 6), y1, x0, y1]);
    part(buf, m, ramp, { b: 2 });
    for (let x = x0 + 4; x < x1; x += 6) lineIn(buf, m, x, y0, x + (x1 > 160 ? 3 : -3), y1, ramp[1]);
  }

  function bulbs(buf, x0, y0, x1, y1, step) {
    for (let x = x0; x <= x1; x += step) { buf.set(x, y0, C.lamp); buf.set(x, y1, C.lamp); }
    for (let y = y0; y <= y1; y += step) { buf.set(x0, y, C.lamp); buf.set(x1, y, C.lamp); }
  }

  BG.idol = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 124);
    vgrad(buf, wall, C.purple, 0, 124, 0.05, 0.45);
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + (i - 4) * 0.28;
      const m = P.poly([160, 70, 160 + Math.cos(a - 0.05) * 260, 70 + Math.sin(a - 0.05) * 260, 160 + Math.cos(a + 0.05) * 260, 70 + Math.sin(a + 0.05) * 260]).and(wall);
      S.light(buf, m, 0.8);
    }
    for (let i = 0; i < 40; i++) buf.set(Math.floor(hash(i, 9, 1) * 320), Math.floor(hash(i, 9, 2) * 60), hash(i, 9, 3) > 0.5 ? C.lamp : C.pink[4]);
    part(buf, P.rect(70, 8, 180, 34), C.night, { b: 1 });
    bulbs(buf, 72, 10, 247, 39, 5);
    S.bigText(buf, 'ПОЗОРНЫЙ ИДОЛ', 160, 17, 2, C.pink[3], C.pink[4], 1);
    curtain(buf, P, 0, 40, 0, 150, C.red);
    curtain(buf, P, 280, 320, 0, 150, C.red);
    part(buf, P.rect(0, 0, 320, 6), C.red, { b: 1, sh: 0 });
    const stage = P.poly([30, 118, 290, 118, 300, 150, 20, 150]);
    grad(buf, stage, C.blue, (x, y) => 0.25 + (y - 118) / 90 + (hash(x >> 2, y >> 1, 3) - 0.5) * 0.06);
    S.outline(buf, stage, C.black);
    for (let i = 0; i < 9; i++) lineIn(buf, stage, 60 + i * 26, 118, 44 + i * 30, 150, C.blue[1]);
    part(buf, P.rect(0, 150, 320, 12), C.gold, { b: 2 });
    for (let i = 0; i < 18; i++) buf.set(28 + i * 15, 156, C.lamp);
    for (let i = 0; i < 3; i++) part(buf, P.rect(20 - i * 2, 148 + i * 6, 42 + i * 4, 6), C.blue, { b: 3 - (i % 2), sh: 0 });
    part(buf, P.poly([112, 142, 160, 142, 162, 150, 110, 150]), C.grey, { b: 1 });
    textOn(buf, 'ЛЮК', 126, 142, C.red[4], 0);
    part(buf, P.ell(136, 156, 9, 5), C.grey, { b: 1 });
    const win = P.ell(136, 156, 7, 3.6);
    grad(buf, win, C.slime, (x, y) => 0.4 + (y - 153) / 12);
    part(buf, P.poly([133, 158, 137, 153, 138, 158]), C.grey, { b: 3, sh: 0, hi: 0, ol: 0 });
    const floor = P.rect(0, 162, 320, 38);
    grad(buf, floor, C.night, (x, y) => 0.2 + (y - 162) / 90 + (hash(x >> 1, y >> 1, 7) - 0.5) * 0.08);
    for (let x = 0; x < 320; x += 24) lineIn(buf, floor, x, 162, x - 10, 200, C.night[0]);
    part(buf, P.rect(0, 34, 22, 104), C.grey, { b: 1 });
    part(buf, P.rect(2, 38, 18, 98), C.grey, { b: 0 });
    part(buf, P.rect(0, 26, 35, 9), C.red, { b: 3 });
    textOn(buf, 'ВЫХОД', 2, 27, C.grey[5], 0);
    pool(buf, 136, 130, 70, 24, 1.0);
    pool(buf, 262, 128, 60, 22, 0.6);
    vignette(buf, 0.5, 160, 110);
  };

  Object.assign(L, {
    idol: {
      judges: g => sprite(96, 40, (P, b) => {
        P.part(P.poly([2, 4, 94, 2, 96, 10, 0, 12]), C.gold, { b: 3 });
        P.part(P.poly([0, 12, 96, 10, 96, 40, 0, 40]), C.pink, { b: 2 });
        for (let i = 0; i < 12; i++) b.set(4 + i * 8, 26, C.lamp);
        P.part(P.rect(12, 14, 30, 9), C.night, { b: 1 });
        textOn(b, 'СПЕКС', 14, 15, C.yellow[4], 0);
        P.part(P.rect(54, 14, 36, 9), C.night, { b: 1 });
        textOn(b, g && g.f.whizzerGone ? 'ПУСТО' : 'УИЗЗЕР', 56, 15, C.teal[4], 0);
        for (const x of [30, 70]) { P.part(P.rect(x - 4, -6 + 6, 8, 5), C.grey, { b: 5, sh: 0 }); }
      }),
      mic: () => sprite(12, 44, P => {
        P.part(P.rect(5, 8, 2, 34), C.grey, { b: 1, sh: 0 });
        P.part(P.ell(6, 42, 5, 1.6), C.grey, { b: 1 });
        P.part(P.ell(6, 5, 3, 4), C.grey, { b: 3 });
        P.line(4, 4, 8, 4, C.grey[1]); P.line(4, 6, 8, 6, C.grey[1]);
      }),
      stand: g => sprite(20, 46, P => {
        P.part(P.rect(9, 12, 2, 32), C.grey, { b: 1, sh: 0 });
        P.part(P.ell(10, 44, 7, 1.6), C.grey, { b: 1 });
        P.part(P.poly([1, 4, 19, 2, 19, 13, 1, 15]), C.grey, { b: 1 });
        if (!(g && g.f.lyricsTaken)) {
          P.part(P.poly([3, 3, 17, 1, 17, 11, 3, 13]), C.cream, { b: 4, sh: 0 });
          for (let i = 0; i < 3; i++) P.line(5, 5 + i * 2.5, 15, 4 + i * 2.5, C.cream[1]);
        }
      }),
      trapdoor: () => sprite(52, 22, P => {
        P.part(P.poly([2, 0, 50, 0, 52, 8, 0, 8]), C.night, { b: 0 });
        P.part(P.rect(4, 8, 44, 14), C.slime, { b: 3 });
        P.part(P.poly([20, 18, 26, 10, 28, 18]), C.grey, { b: 3, sh: 0 });
        for (let i = 0; i < 5; i++) P.px(8 + i * 9, 10 + (i % 2) * 3, C.slime[4]);
      })
    }
  });

  BG.quiz = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 132);
    vgrad(buf, wall, C.night, 0, 132, 0.1, 0.55);
    for (let r = 150; r > 20; r -= 18) {
      const ring = S.ellipseMask(160, 66, r, r * 0.55, 0).minus(S.ellipseMask(160, 66, r - 3, r * 0.55 - 2, 0)).and(wall);
      S.fill(buf, ring, r % 36 === 6 ? C.blue[2] : C.purple[2]);
    }
    part(buf, P.rect(116, 10, 88, 104), C.gold, { b: 2 });
    part(buf, P.rect(120, 14, 80, 96), C.night, { b: 1, sh: 0, hi: 0 });
    const sums = ['1 000 000', '500 000', '250 000', '64 000', '16 000', '4 000', '1 000', '500', '100'];
    sums.forEach((t, i) => {
      const y = 17 + i * 10;
      if (i === 0) part(buf, P.rect(122, y - 1, 76, 9), C.gold, { b: 3, sh: 0, hi: 0, ol: 0 });
      textOn(buf, t, 190 - S.font.measure(t), y, i === 0 ? C.black : C.gold[4], 0);
      textOn(buf, String(9 - i), 126, y, i === 0 ? C.black : C.gold[2], 0);
    });
    part(buf, P.rect(0, 0, 320, 6), C.grey, { b: 1, sh: 0 });
    for (const x of [30, 90, 230, 290]) { part(buf, P.ell(x, 6, 6, 3), C.grey, { b: 1 }); part(buf, P.ell(x, 8, 3, 1.4), LAMP, { sh: 0, hi: 0 }); }
    part(buf, P.rect(26, 20, 86, 12), C.blue, { b: 1 });
    textOn(buf, 'КТО НИКОГДА НЕ', 30, 22, C.gold[4], 0);
    part(buf, P.rect(208, 20, 110, 12), C.blue, { b: 1 });
    textOn(buf, 'СТАНЕТ МИЛЛИОНЕРОМ', 211, 22, C.gold[4], 0);
    const floor = P.rect(0, 132, 320, 68);
    grad(buf, floor, C.blue, (x, y) => 0.12 + (y - 132) / 200 + (hash(x >> 1, y >> 1, 2) - 0.5) * 0.06);
    const disc = P.ell(160, 168, 120, 22);
    part(buf, disc, C.blue, { b: 2 });
    part(buf, P.ell(160, 168, 100, 16), C.blue, { b: 1, sh: 0, hi: 0 });
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; buf.set(Math.round(160 + Math.cos(a) * 110), Math.round(168 + Math.sin(a) * 19), C.lamp); }
    part(buf, P.rect(0, 128, 320, 4), C.gold, { b: 2, sh: 0 });
    part(buf, P.rect(0, 40, 22, 96), C.grey, { b: 1 });
    part(buf, P.rect(2, 44, 18, 90), C.grey, { b: 0 });
    part(buf, P.rect(0, 34, 35, 9), C.red, { b: 3 });
    textOn(buf, 'ВЫХОД', 2, 35, C.grey[5], 0);
    pool(buf, 80, 150, 40, 14, 0.8);
    pool(buf, 242, 150, 40, 14, 0.8);
    pool(buf, 160, 60, 60, 60, 0.5);
    vignette(buf, 0.6, 160, 100);
  };

  Object.assign(L, {
    quiz: {
      host: g => sprite(46, 48, (P, b) => {
        P.part(P.poly([4, 6, 42, 6, 38, 48, 8, 48]), C.blue, { b: 2 });
        P.part(P.poly([2, 0, 44, 0, 44, 7, 2, 7]), C.gold, { b: 3 });
        P.part(P.rect(12, 2, 22, 3), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
        if (g && g.f.cardsIn && !g.f.cardsSwapped) P.part(P.rect(15, -0.5 + 1, 16, 2), C.blue, { b: 4, sh: 0, hi: 0, ol: 0 });
        if (g && g.f.cardsSwapped) P.part(P.rect(15, 0.5, 16, 2), C.cream, { b: 4, sh: 0, hi: 0, ol: 0 });
        for (let i = 0; i < 5; i++) b.set(10 + i * 6, 16, C.lamp);
        textOn(b, 'ХЬЮ', 13, 26, C.gold[4], 0);
      }),
      player: () => sprite(46, 48, (P, b) => {
        P.part(P.poly([4, 6, 42, 6, 38, 48, 8, 48]), C.purple, { b: 2 });
        P.part(P.poly([2, 0, 44, 0, 44, 7, 2, 7]), C.gold, { b: 3 });
        for (let i = 0; i < 4; i++) P.part(P.rect(6 + i * 9, 1.5, 7, 3.5), [C.red, C.green, C.blue, C.yellow][i], { b: 3, sh: 0, hi: 0 });
        for (let i = 0; i < 5; i++) b.set(10 + i * 6, 16, C.lamp);
        textOn(b, 'ИГРОК', 10, 26, C.gold[4], 0);
      })
    }
  });

  BG.myra = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 128);
    vgrad(buf, wall, C.plum, 0, 128, 0.2, 0.6);
    wall.each((x, y) => { if ((x + 3 * y) % 23 === 0) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]); });
    const sky = P.rect(150, 40, 150, 72);
    vgrad(buf, sky, [C.night[1], C.purple[2], C.plum[3], C.rose[3], C.orange[3]], 40, 112, 0.05, 0.95);
    BG.cityView(buf, P.rect(150, 70, 150, 42), 150, 70, 300, 112, 21, true);
    S.outerLine(buf, sky, C.black);
    part(buf, P.rect(146, 36, 158, 5), C.gold, { b: 3 });
    for (let x = 146; x < 304; x += 12) part(buf, P.rect(x, 41, 4, 71), C.gold, { b: 2, sh: 0, hi: 0 });
    part(buf, P.rect(84, 4, 156, 30), C.night, { b: 1 });
    bulbs(buf, 86, 6, 237, 31, 5);
    S.bigText(buf, 'МАЙРА!', 162, 10, 3, C.pink[3], C.pink[4], 1);
    for (const x of [30, 110]) {
      part(buf, P.rect(x - 14, 60, 28, 50), C.pink, { b: 2 });
      part(buf, P.ell(x, 60, 14, 8), C.pink, { b: 3 });
      for (let i = 0; i < 3; i++) part(buf, P.rect(x - 10, 70 + i * 12, 20, 8), C.pink, { b: 2, sh: 1, hi: 1 });
    }
    part(buf, P.path('M 306 110 Q 300 90 310 80 Q 318 92 314 110 Z'), C.green, { b: 2 });
    part(buf, P.rect(302, 108, 16, 12), C.gold, { b: 2 });
    const floor = P.rect(0, 128, 320, 72);
    grad(buf, floor, C.wood, (x, y) => 0.3 + (y - 128) / 150 + (hash(x >> 3, y >> 2, 5) - 0.5) * 0.1);
    for (let y = 132; y < 200; y += 7) lineIn(buf, floor, 0, y, 320, y + 2, C.wood[1]);
    part(buf, P.ell(160, 150, 150, 18), C.red, { b: 2 });
    part(buf, P.ell(160, 150, 136, 14), C.gold, { b: 2, sh: 0, hi: 0 });
    part(buf, P.ell(160, 150, 126, 11), C.red, { b: 3, sh: 0, hi: 0 });
    part(buf, P.rect(0, 124, 320, 5), C.gold, { b: 2, sh: 0 });
    part(buf, P.rect(278, 120, 38, 28), C.grey, { b: 1 });
    for (let i = 0; i < 6; i++) buf.set(283 + i * 5, 126, [C.red[4], C.green[4], C.yellow[4]][i % 3]);
    part(buf, P.rect(282, 132, 30, 10), C.grey, { b: 0 });
    pool(buf, 160, 20, 100, 30, 0.8);
    pool(buf, 100, 140, 90, 24, 0.7);
    pool(buf, 230, 140, 70, 24, 0.7);
    vignette(buf, 0.6, 160, 90);
  };

  Object.assign(L, {
    myra: {
      couch: () => sprite(112, 52, P => {
        P.part(P.path('M 4 36 Q 2 8 16 6 L 96 6 Q 110 8 108 36 Z'), C.purple, { b: 3 });
        for (let i = 0; i < 3; i++) P.part(P.rect(14 + i * 28, 10, 26, 22), C.purple, { b: 3, sh: 1, hi: 1 });
        P.part(P.ell(6, 34, 7, 11), C.purple, { b: 3 });
        P.part(P.ell(106, 34, 7, 11), C.purple, { b: 3 });
      }),
      couchFront: () => sprite(112, 28, P => {
        P.part(P.rect(2, 2, 108, 19), C.purple, { b: 2 });
        P.part(P.rect(6, 21, 5, 6), C.gold, { b: 2, sh: 0 });
        P.part(P.rect(101, 21, 5, 6), C.gold, { b: 2, sh: 0 });
        P.part(P.ell(6, 6, 7, 6), C.purple, { b: 3 });
        P.part(P.ell(106, 6, 7, 6), C.purple, { b: 3 });
      }),
      desk: () => sprite(100, 50, (P, b) => {
        P.part(P.poly([4, 6, 96, 4, 100, 14, 0, 16]), C.gold, { b: 3 });
        P.part(P.poly([0, 16, 100, 14, 98, 50, 2, 50]), C.pink, { b: 2 });
        P.part(P.ell(50, 32, 14, 10), C.gold, { b: 3 });
        S.font.drawCentered(b, 'M', 50, 28, C.pink[1], 0);
        P.curve('M 96 18 Q 104 40 118 44', C.grey[1]);
      }),
      glass: g => sprite(12, 16, P => {
        if (g && g.f.wet) {
          P.part(P.poly([2, 14, 4, 10, 6, 13, 8, 9, 10, 14]), C.sky, { b: 4, sh: 0 });
          return;
        }
        P.part(P.poly([2, 1, 10, 1, 9, 15, 3, 15]), C.sky, { b: 4, sh: 0, hi: 0 });
        P.part(P.poly([3, 6, 9, 6, 8.6, 14, 3.4, 14]), C.blue, { b: 3, sh: 0, hi: 0, ol: 0 });
        P.px(4, 3, C.grey[5]);
      }),
      puddle: () => sprite(56, 10, P => {
        P.part(P.path('M 2 5 Q 10 0 24 2 Q 40 0 54 4 Q 46 9 28 8 Q 12 10 2 5 Z'), C.sky, { b: 3, sh: 0 });
        P.px(14, 4, C.grey[5]); P.px(36, 3, C.grey[5]);
      }),
      banjo: g => sprite(26, 56, P => {
        P.part(P.poly([4, 54, 13, 36, 22, 54]), C.grey, { b: 1, sh: 0 });
        if (g && g.f.banjoPlaying) return;
        P.part(P.ell(13, 38, 9, 9), C.oak, { b: 3 });
        P.part(P.ell(13, 38, 7, 7), C.cream, { b: 4, sh: 0, hi: 0 });
        P.part(P.rect(11.5, 2, 3, 30), C.wood, { b: 2, sh: 0 });
        P.part(P.rect(10, 0, 6, 5), C.wood, { b: 3, sh: 0 });
        P.line(13, 4, 13, 44, C.grey[4]);
      }),
      crowd: g => sprite(320, 34, P => {
        const free = g && g.f.crowdFree;
        for (let row = 0; row < 2; row++) for (let i = 0; i < 12; i++) {
          const x = 8 + i * 27 + row * 13, y = 14 + row * 12;
          const tone = [C.skin, C.dskin, C.fur, C.cream][(i + row) % 4];
          if (free && (i + row) % 3 !== 0) continue;
          P.part(P.ell(x, y, 8, 8), [C.night, C.hair, C.fur, C.grey][(i * 3 + row) % 4], { b: 2 });
          P.part(P.ell(x, y + 6, 6, 4), tone, { b: 2, sh: 0 });
          if ((i + row) % 2 === 0) {
            P.part(P.rect(x + 5, y - 2, 9, 7), [C.red, C.blue, C.gold, C.green][(i + row) % 4], { b: 3 });
            P.line(x + 9.5, y - 2, x + 9.5, y + 5, C.gold[4]);
          }
        }
      })
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
