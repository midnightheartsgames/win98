(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade, line, hash } = S;
  const BG = S.BG;
  const E = S.EP103;
  const L = E.LAYERS;
  const A = S.art103;
  const { vgrad, pool, dropShadow, textOn, sprite, vignette, lineIn } = BG;
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];

  BG.backroom = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 126);
    vgrad(buf, wall, C.navy, 0, 126, 0.2, 0.7);
    wall.each((x, y) => { if (hash(x >> 2, y >> 2, 3) < 0.07) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]); });
    part(buf, P.rect(0, 0, 320, 7), C.night, { b: 1, sh: 0, hi: 0 });
    part(buf, P.rect(0, 78, 320, 4), [C.tvB, C.tvB, C.tvA, C.tvA, C.tvA], { sh: 0, hi: 0, ol: 0 });
    pool(buf, 160, 80, 180, 18, 1.2);
    part(buf, P.rect(0, 118, 320, 9), C.night, { b: 2, sh: 0, hi: 1 });
    const floor = P.rect(0, 126, 320, 74);
    floor.each((x, y) => {
      const k = (y - 100) / 100;
      const u = (x - 160) / Math.max(0.3, k), v = Math.log(Math.max(1, y - 112)) * 7;
      const cu = Math.floor((u + 4000) / 24), cv = Math.floor(v);
      buf.set(x, y, (cu + cv) % 2 ? C.navy[1] : C.purple[1]);
    });
    shade(buf, floor, 0, (x, y) => Math.max(0, (140 - y) / 20));
    part(buf, P.rect(0, 20, 38, 108), C.night, { b: 1 });
    part(buf, P.rect(4, 26, 30, 100), C.wood, { b: 1 });
    part(buf, P.rect(8, 32, 22, 40), C.wood, { b: 1, sh: 1, hi: 1 });
    part(buf, P.rect(8, 78, 22, 44), C.wood, { b: 1, sh: 1, hi: 1 });
    part(buf, P.ell(28, 78, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(44, 12, 124, 62), C.wood, { b: 2 });
    const board = P.rect(47, 15, 118, 56);
    grad(buf, board, C.night, (x, y) => 0.2 + (hash(x, y, 5) - 0.5) * 0.1);
    const cols = [['РЭКЕТ', 50], ['ТОТАЛ.', 88], ['РАЗВЛ.', 126]];
    for (const [t, x] of cols) textOn(buf, t, x, 17, C.grey[4], 0);
    line(buf, 47, 27, 165, 27, C.grey[3]);
    line(buf, 86, 17, 86, 70, C.grey[3]);
    line(buf, 124, 17, 124, 70, C.grey[3]);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
      const y = 31 + r * 10, x = 51 + c * 38;
      textOn(buf, String(1000 * ((r * 3 + c) % 7 + 1)), x, y, C.grey[4], 0);
      if (hash(r, c, 2) > 0.6) line(buf, x - 1, y + 4, x + 22, y + 4, C.red[3]);
    }
    part(buf, P.rect(174, 16, 34, 44), C.gold, { b: 3 });
    const pic = P.rect(177, 19, 28, 38);
    vgrad(buf, pic, C.plum, 19, 57, 0.2, 0.6);
    A.bearMask(new Pen(buf).at(191, 34, 0.46), 0, 0, A.MOB.ted, {});
    part(buf, P.rect(183, 45, 16, 12), C.purple, { b: 3, sh: 0, hi: 0 });
    part(buf, P.rect(180, 60, 22, 7), C.gold, { b: 3, sh: 0 });
    textOn(buf, 'ДОН', 184, 60, C.gold[0], 0);
    part(buf, P.rect(216, 12, 70, 62), C.grey, { b: 1 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
      const x = 219 + c * 13.2, y = 16 + r * 28;
      part(buf, P.rect(x, y, 11, 24), C.grey, { b: 2, sh: 0 });
      part(buf, P.rect(x + 1, y + 2, 9, 16), [C.tvB, C.tvB, C.tvA, C.tvA, C.tvA], { sh: 0, hi: 0, ol: 0 });
      buf.set(x + 5, y + 21, C.red[4]);
    }
    part(buf, P.rect(286, 44, 34, 96), C.stone, { b: 1 });
    part(buf, P.rect(290, 50, 26, 88), C.stone, { b: 2 });
    for (let y = 56; y < 136; y += 10) for (let x = 293; x < 316; x += 8) part(buf, P.ell(x, y, 1, 1), C.stone, { b: 4, sh: 0, hi: 0, ol: 0 });
    part(buf, P.rect(288, 64, 30, 20), C.gold, { b: 3 });
    textOn(buf, 'ВХОДА', 290, 65, C.red[2], 0);
    textOn(buf, 'НЕТ', 295, 74, C.red[2], 0);
    part(buf, P.rect(290, 96, 5, 10), C.grey, { b: 4, sh: 0 });
    part(buf, P.rect(40, 84, 84, 44), C.wood, { b: 1 });
    for (let s = 0; s < 3; s++) {
      part(buf, P.rect(42, 96 + s * 12, 80, 2), C.wood, { b: 3, sh: 0 });
      for (let i = 0; i < 6; i++) {
        const x = 45 + i * 13, y = 86 + s * 12;
        part(buf, P.rect(x, y, 11, 10), [C.pink, C.purple, C.gold][(i + s) % 3], { b: 3 });
        part(buf, P.rect(x + 4.5, y, 2, 10), C.gold, { b: 4, sh: 0, hi: 0, ol: 0 });
      }
    }
    part(buf, P.rect(226, 86, 54, 4), C.grey, { b: 2, sh: 0 });
    for (let i = 0; i < 3; i++) {
      const hx = 236 + i * 17;
      line(buf, hx, 90, hx, 94, C.grey[3]);
      A.bearMask(new Pen(buf).at(hx, 106, 0.4), 0, 0, Object.assign({}, [A.MOB.lovey, A.MOB.guard, A.MOB.cuddly][i], { hat: null }), {});
    }
    pool(buf, 172, 110, 60, 30, 0.7);
    pool(buf, 250, 40, 40, 36, 0.6);
    vignette(buf, 0.8, 160, 110);
  };

  Object.assign(L, {
    backroom: {
      desk: g => sprite(96, 44, (P, b) => {
        P.part(P.poly([4, 10, 92, 8, 96, 16, 0, 18]), C.oak, { b: 3 });
        P.part(P.poly([0, 18, 96, 16, 96, 44, 0, 44]), C.oak, { b: 1 });
        for (let i = 0; i < 3; i++) P.part(P.rect(8 + i * 28, 22, 22, 18), C.oak, { b: 1, sh: 1, hi: 1 });
        P.part(P.rect(8, 4, 14, 7), C.night, { b: 2 });
        P.part(P.cap(9, 3, 21, 3, 2), C.night, { b: 2 });
        P.part(P.rect(30, 6, 20, 5), C.grey, { b: 5, sh: 0 });
        P.part(P.ell(72, 8, 11, 3), C.grey, { b: 5 });
        if (g && g.f.meatDone && !g.f.inducted) {
          P.part(P.path('M 63 7 Q 64 3 72 2.6 Q 80 3 81 7 Z'), C.oak, { b: 3 });
          for (const cx of [66, 72, 78]) P.part(P.ell(cx, 7.4, 2.4, 1.8), C.brick, { b: 2, sh: 0 });
        }
      })
    }
  });

  BG.factory = function (buf) {
    const P = new Pen(buf);
    const W = 480;
    const wall = P.rect(0, 0, W, 136);
    vgrad(buf, wall, C.teal, 0, 136, 0.15, 0.5);
    wall.each((x, y) => {
      if ((x + 1000) % 40 === 0 || y % 24 === 0) buf.set(x, y, C.teal[0]);
      else if ((x + 1000) % 40 === 3 && y % 12 === 6) buf.set(x, y, C.teal[3]);
    });
    part(buf, P.rect(0, 0, W, 10), C.night, { b: 1, sh: 0, hi: 0 });
    for (const y of [12, 18]) part(buf, P.rect(0, y, W, 4), C.stone, { b: 2, sh: 0 });
    for (let x = 30; x < W; x += 70) part(buf, P.rect(x, 10, 5, 12), C.stone, { b: 1, sh: 0 });
    const win = P.rect(24, 28, 144, 50);
    BG.cityView(buf, win, 24, 28, 168, 78, 23, true);
    for (let x = 24; x <= 168; x += 24) line(buf, x, 28, x, 78, C.stone[1]);
    line(buf, 24, 53, 168, 53, C.stone[1]);
    S.outerLine(buf, win, C.black);
    part(buf, P.rect(20, 78, 152, 4), C.stone, { b: 3, sh: 0 });
    part(buf, P.rect(0, 130, W, 7), C.stone, { b: 1, sh: 0, hi: 1 });
    const floor = P.rect(0, 136, W, 64);
    grad(buf, floor, C.stone, (x, y) => 0.25 + (y - 136) / 150 + (hash(x >> 1, y >> 1, 6) - 0.5) * 0.08);
    for (let x = -40; x < W + 40; x += 36) lineIn(buf, floor, 240 + (x - 240) * 0.5, 136, x, 200, C.stone[1]);
    floor.each((x, y) => { if (y > 186 && y < 191 && Math.floor((x - y) / 6) % 2 === 0) buf.set(x, y, C.yellow[3]); else if (y > 186 && y < 191) buf.set(x, y, C.night[1]); });
    part(buf, P.rect(92, 44, 46, 88), C.grey, { b: 3 });
    part(buf, P.ell(115, 44, 23, 7), C.grey, { b: 4 });
    for (let y = 56; y < 128; y += 14) line(buf, 93, y, 137, y, C.grey[1]);
    part(buf, P.cap(138, 60, 172, 60, 3), C.stone, { b: 2, sh: 0 });
    part(buf, P.cap(176, 0, 176, 58, 4), C.stone, { b: 2 });
    part(buf, P.cap(198, 0, 198, 62, 7), C.stone, { b: 3 });
    part(buf, P.path('M 178 62 L 218 62 L 226 86 L 170 86 Z'), C.stone, { b: 3 });
    part(buf, P.ell(198, 86, 28, 4), C.night, { b: 0, sh: 0 });
    part(buf, P.rect(184, 66, 28, 8), C.gold, { b: 3, sh: 0 });
    textOn(buf, 'БРАК', 187, 66, C.black, 0);
    part(buf, P.rect(194, 98, 9, 22), C.red, { b: 3 });
    part(buf, P.rect(195, 94, 7, 5), C.grey, { b: 2, sh: 0 });
    part(buf, P.cap(202, 96, 206, 104, 1), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(192, 106, 13, 3), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    part(buf, P.rect(190, 88, 17, 2), C.grey, { b: 1, sh: 0 });
    for (const bx of [191, 205]) part(buf, P.rect(bx, 90, 2, 32), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(262, 58, 42, 50), C.green, { b: 2 });
    part(buf, P.rect(266, 62, 34, 20), C.green, { b: 3, sh: 1, hi: 1 });
    for (let i = 0; i < 4; i++) buf.set(270 + i * 8, 90, [C.red[4], C.gold[4], C.neonB, C.red[4]][i]);
    part(buf, P.path('M 274 108 L 292 108 L 288 116 L 278 116 Z'), C.green, { b: 1 });
    textOn(buf, 'ГОЛОС', 267, 66, C.lamp, C.black);
    part(buf, P.rect(318, 10, 14, 24), C.yellow, { b: 2 });
    part(buf, P.path('M 338 92 L 378 92 L 374 114 L 342 114 Z'), C.orange, { b: 3 });
    for (let i = 0; i < 7; i++) part(buf, P.rect(342 + i * 4.5, 88 + (i % 2), 4, 4), C.red, { b: 3, sh: 0 });
    textOn(buf, 'БЛОКИ', 343, 100, C.orange[0], 0);
    part(buf, P.rect(440, 44, 40, 96), C.stone, { b: 1 });
    part(buf, P.rect(446, 50, 30, 88), C.stone, { b: 2 });
    part(buf, P.rect(446, 58, 32, 9), C.red, { b: 3 });
    textOn(buf, 'ВЫХОД', 448, 58, C.grey[5], 0);
    part(buf, P.rect(448, 94, 5, 10), C.grey, { b: 4, sh: 0 });
    part(buf, P.rect(390, 26, 40, 40), C.gold, { b: 3 });
    part(buf, P.rect(393, 29, 34, 34), C.night, { b: 1, sh: 0, hi: 0 });
    textOn(buf, 'ОТДЕЛ', 395, 31, C.gold[4], 0);
    textOn(buf, 'КАЧЕСТВА', 391, 41, C.gold[4], 0);
    textOn(buf, '98%', 402, 51, C.red[4], 0);
    dropShadow(buf, 115, 134, 26, 3);
    pool(buf, 96, 52, 80, 40, 0.5);
    pool(buf, 300, 60, 110, 50, 0.6);
    vignette(buf, 0.6, 240, 110);
  };

  Object.assign(L, {
    factory: {
      belt: g => sprite(252, 34, (P, b) => {
        P.part(P.rect(0, 6, 252, 12), C.grey, { b: 1 });
        const off = g ? Math.floor(g.time * 12) % 8 : 0;
        for (let x = -8 + off; x < 252; x += 8) P.line(x, 7, x + 3, 16, C.grey[2]);
        P.part(P.rect(0, 16, 252, 5), C.stone, { b: 2, sh: 0 });
        for (let x = 6; x < 252; x += 14) P.part(P.ell(x, 19, 2.4, 2.4), C.stone, { b: 4, sh: 0 });
        for (let x = 10; x < 252; x += 40) P.part(P.rect(x, 21, 5, 13), C.stone, { b: 1, sh: 0 });
      }),
      bin: () => sprite(38, 26, P => {
        P.part(P.poly([1, 4, 37, 4, 34, 25, 4, 25]), C.blue, { b: 2 });
        for (let i = 0; i < 5; i++) A.hypnoBear(P, 7 + i * 6, 10 + (i % 2) * 2, 0.4, {});
        P.part(P.rect(1, 12, 36, 13), C.blue, { b: 3, sh: 1 });
        textOn(P.b, 'ГОТОВО', 3, 15, C.grey[5], 0);
      }),
      bench: () => sprite(78, 36, P => {
        P.part(P.poly([2, 6, 76, 4, 78, 12, 0, 14]), C.wood, { b: 3 });
        P.part(P.rect(4, 14, 4, 22), C.stone, { b: 1, sh: 0 });
        P.part(P.rect(70, 14, 4, 22), C.stone, { b: 1, sh: 0 });
        P.part(P.rect(6, 28, 66, 3), C.stone, { b: 1, sh: 0 });
      }),
      bandit: g => sprite(34, 58, (P, b) => {
        const open = g && g.f.boxOut;
        P.part(P.rect(3, 8, 26, 48), C.red, { b: 2 });
        P.part(P.path('M 1 10 Q 16 -3 31 10 Z'), C.red, { b: 3 });
        P.part(P.rect(6, 18, 20, 10), C.grey, { b: 5, sh: 0, hi: 0 });
        for (let i = 0; i < 3; i++) P.line(12 + i * 6, 18, 12 + i * 6, 27, C.grey[2]);
        P.part(P.rect(27, 24, 5, 8), C.grey, { b: 2 });
        if (open) {
          P.part(P.rect(6, 32, 20, 16), C.night, { b: 0, sh: 0, hi: 0 });
          for (let i = 0; i < 4; i++) P.line(8 + i * 5, 34, 10 + i * 4, 46, [C.red[4], C.gold[4], C.sky[4], C.green[4]][i]);
          P.part(P.poly([26, 32, 33, 36, 33, 50, 26, 48]), C.red, { b: 3 });
        } else {
          P.part(P.rect(6, 32, 20, 16), C.red, { b: 3, sh: 1, hi: 1 });
          for (const [x, y] of [[8, 34], [24, 34], [8, 46], [24, 46]]) P.px(x, y, C.grey[4]);
        }
        P.part(P.poly([2, 44, 10, 42, 11, 49, 3, 51]), C.cream, { b: 4, sh: 0 });
        P.line(4, 46, 9, 45, C.red[3]);
      }),
      screwdriver: () => sprite(20, 8, P => {
        P.part(P.cap(2, 5, 9, 4, 2.2, 2), C.green, { b: 3 });
        P.part(P.cap(9, 4, 18, 3, 0.8), C.grey, { b: 4, sh: 0 });
      }),
      lever: g => sprite(24, 56, P => {
        const down = g && g.f.leverDown;
        P.part(P.rect(8, 20, 8, 36), C.stone, { b: 2 });
        P.part(P.rect(4, 50, 16, 6), C.stone, { b: 1, sh: 0 });
        P.part(P.rect(6, 16, 12, 8), C.red, { b: 2 });
        if (down) { P.part(P.cap(12, 20, 22, 32, 1.6), C.grey, { b: 4, sh: 0 }); P.part(P.ell(22, 33, 3, 3), C.red, { b: 3 }); }
        else { P.part(P.cap(12, 20, 20, 5, 1.6), C.grey, { b: 4, sh: 0 }); P.part(P.ell(20, 4, 3, 3), C.red, { b: 3 }); }
      }),
      robot: g => sprite(70, 90, P => {
        const f = g ? g.f : {};
        const ph = g ? (g.time * 0.8) % 1 : 0;
        const toHopper = ph < 0.5;
        const k = toHopper ? ph * 2 : 2 - ph * 2;
        const ex = 36 + k * 20, ey = 52 + Math.sin(k * Math.PI) * -8;
        P.part(P.rect(18, 0, 14, 10), C.yellow, { b: 2 });
        P.part(P.cap(25, 10, 25, 30, 4), C.yellow, { b: 3 });
        P.part(P.ell(25, 30, 5, 5), C.grey, { b: 2 });
        P.part(P.cap(25, 30, ex, ey, 3.4, 3), C.yellow, { b: 3 });
        P.part(P.ell(ex, ey, 3.4, 3.4), C.grey, { b: 2 });
        P.part(P.cap(ex, ey, ex - 2, ey + 8, 1.2), C.grey, { b: 1, sh: 0 });
        P.part(P.cap(ex, ey, ex + 2, ey + 8, 1.2), C.grey, { b: 1, sh: 0 });
        if (toHopper && k > 0.9 || !toHopper) P.part(P.rect(ex - 2, ey + 7, 4, 4), f.boxIn && !f.bearReady ? C.green : C.red, { b: 3, sh: 0 });
      }),
      gauge: g => sprite(26, 26, P => {
        const p = g ? (g.f.pressure || 0) : 0;
        P.part(P.ell(13, 13, 12, 12), C.grey, { b: 4 });
        P.part(P.ell(13, 13, 9.5, 9.5), C.grey, { b: 5, sh: 0, hi: 0 });
        for (let i = 0; i < 7; i++) {
          const a = Math.PI * (0.8 + i * 1.4 / 6);
          P.line(13 + Math.cos(a) * 7, 13 + Math.sin(a) * 7, 13 + Math.cos(a) * 9, 13 + Math.sin(a) * 9, i > 4 ? C.red[3] : C.grey[1]);
        }
        const a = Math.PI * (0.8 + Math.min(1, p) * 1.4);
        P.line(13, 13, 13 + Math.cos(a) * 8, 13 + Math.sin(a) * 8, C.red[3]);
        P.part(P.ell(13, 13, 1.5, 1.5), C.grey, { b: 1, sh: 0 });
      })
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
