(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade, line, hash } = S;
  const BG = S.BG;
  const L = S.EP102.LAYERS;
  const { vgrad, planks, pool, dropShadow, textOn, sprite, vignette, lineIn } = BG;
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];

  function plaque(buf, P, x, y, w, l1, l2, ramp) {
    part(buf, P.rect(x, y, w, l2 ? 19 : 11), ramp || C.gold, { b: 3 });
    part(buf, P.rect(x + 2, y + 2, w - 4, (l2 ? 19 : 11) - 4), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
    textOn(buf, l1, x + Math.floor((w - S.font.measure(l1)) / 2), y + 2, C.yellow[4], 0);
    if (l2) textOn(buf, l2, x + Math.floor((w - S.font.measure(l2)) / 2), y + 10, C.yellow[3], 0);
  }

  function studioDoor(buf, P, x, y, w, h, ramp) {
    part(buf, P.rect(x - 3, y - 3, w + 6, h + 3), C.grey, { b: 2 });
    part(buf, P.rect(x, y, w, h), ramp, { b: 2 });
    part(buf, P.rect(x + 4, y + 5, w - 8, h * 0.38), ramp, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(x + 4, y + h * 0.5, w - 8, h * 0.44), ramp, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(x + w - 6, y + h * 0.5, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
  }

  function spotlights(buf, P, w, step, y0) {
    part(buf, P.rect(0, 0, w, y0), C.grey, { b: 1, sh: 0, hi: 0 });
    line(buf, 0, y0, w, y0, C.black);
    for (let x = step / 2; x < w; x += step) {
      part(buf, P.path(`M ${x - 7} ${y0} L ${x + 7} ${y0} L ${x + 5} ${y0 + 7} L ${x - 5} ${y0 + 7} Z`), C.grey, { b: 1 });
      part(buf, P.ell(x, y0 + 7, 4, 1.6), LAMP, { sh: 0, hi: 0 });
    }
  }

  BG.warp = function (buf) {
    const P = new Pen(buf);
    const W = 560;
    const wall = P.rect(0, 0, W, 134);
    vgrad(buf, wall, C.navy, 0, 134, 0.5, 0.95);
    shade(buf, wall, 0, (x, y) => (x % 44 === 0 ? 0.9 : x % 44 === 1 ? 0.4 : 0) + (y > 96 && y < 100 ? 0.6 : 0));
    wall.each((x, y) => { if (y > 100 && y < 128 && (x + y * 3) % 9 === 0) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]); });
    part(buf, P.rect(0, 96, W, 4), C.gold, { b: 2, sh: 0, hi: 1 });
    spotlights(buf, P, W, 70, 9);
    part(buf, P.rect(0, 128, W, 7), C.wood, { b: 1, sh: 0, hi: 1 });
    const floor = P.rect(0, 134, W, 66);
    floor.each((x, y) => {
      const k = (y - 60) / 140;
      const u = Math.floor(((x - 280) / k + 4000) / 30), v = Math.floor(Math.log(y - 120) * 7);
      buf.set(x, y, (u + v) % 2 ? C.stone[3] : C.stone[2]);
    });
    shade(buf, floor, 0, (x, y) => Math.max(0, (148 - y) / 20));
    const runner = P.poly([214, 140, W, 140, W, 200, 206, 200]);
    part(buf, runner, C.red, { b: 2, sh: 0, hi: 0 });
    part(buf, P.poly([220, 144, W, 144, W, 196, 214, 196]), C.red, { b: 1, sh: 0, hi: 0, ol: C.gold[2] });
    part(buf, P.rect(4, 46, 46, 90), C.grey, { b: 2 });
    for (const dx of [8, 29]) {
      const gl = P.rect(dx, 52, 17, 80);
      grad(buf, gl, C.sky, (x, y) => 0.25 + (y - 52) / 140 + (hash(x, y, 4) - 0.5) * 0.12);
      S.outerLine(buf, gl, C.black);
      for (let i = 0; i < 3; i++) line(buf, dx + 2 + i * 4, 128, dx + 15, 60 + i * 12, C.sky[4]);
    }
    part(buf, P.rect(22, 92, 3, 10), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(30, 92, 3, 10), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(6, 34, 42, 10), C.red, { b: 3 });
    textOn(buf, 'ВЫХОД', 12, 36, C.grey[5], 0);
    S.bigText(buf, 'WARP', 128, 20, 4, C.orange[3], C.yellow[4], 2);
    part(buf, P.rect(72, 54, 112, 11), C.night, { b: 1 });
    textOn(buf, 'ТЕЛЕСТУДИЯ WARP', 84, 56, C.sky[4], 0);
    for (let i = 0; i < 8; i++) {
      const a = -Math.PI / 2 + (i - 3.5) * 0.24;
      lineIn(buf, wall, 128 + Math.cos(a) * 58, 36 + Math.sin(a) * 30, 128 + Math.cos(a) * 70, 36 + Math.sin(a) * 36, C.gold[3]);
    }
    const posters = [[56, 'МАЙРА!', C.purple, C.pink[4]], [146, 'КОВБОИ', C.oak, C.cream[4]]];
    for (const [x, , r] of posters) {
      part(buf, P.rect(x, 70, 40, 40), C.grey, { b: 4 });
      part(buf, P.rect(x + 2, 72, 36, 36), r, { b: 2, sh: 0, hi: 0 });
    }
    const pm = new Pen(buf).at(76, 86, 0.44);
    S.art102.myraBust(pm, 45);
    S.art102.myraHead(pm, 0, 0, { talk: true });
    for (const [x, t, , tc] of posters) textOn(buf, t, x + 20 - Math.floor(S.font.measure(t) / 2), 98, tc, C.black);
    part(buf, P.path('M 158 88 Q 166 80 174 88 L 172 90 L 160 90 Z'), C.oak, { b: 2 });
    part(buf, P.ell(166, 90, 11, 2), C.oak, { b: 2 });
    const doors = [[250, 'КОВБОИ', 'ИЗ ЦЕНТРА', C.oak], [316, 'ГОТОВИМ', 'НЕ ГЛЯДЯ', C.teal], [382, 'ПОЗОРНЫЙ', 'ИДОЛ', C.purple], [448, 'КТО НЕ', 'МИЛЛИОНЕР?', C.blue]];
    for (const [x, l1, l2, r] of doors) {
      studioDoor(buf, P, x, 62, 34, 70, r);
      plaque(buf, P, x - 12, 38, 58, l1, l2);
      part(buf, P.ell(x + 17, 34, 3, 3), C.grey, { b: 1 });
    }
    part(buf, P.rect(500, 44, 56, 90), C.gold, { b: 2 });
    part(buf, P.rect(504, 50, 23, 84), C.plum, { b: 2 });
    part(buf, P.rect(529, 50, 23, 84), C.plum, { b: 2 });
    for (const dx of [506, 531]) for (let i = 0; i < 3; i++) part(buf, P.rect(dx + 3, 58 + i * 24, 13, 18), C.plum, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(524, 92, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    part(buf, P.ell(531, 92, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(512, 74, 32, 8), C.grey, { b: 1 });
    part(buf, P.rect(515, 76, 26, 4), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
    part(buf, P.rect(494, 16, 68, 24), C.plum, { b: 1 });
    textOn(buf, 'МАЙРА!', 510, 18, C.pink[4], C.black);
    for (let i = 0; i < 11; i++) { buf.set(497 + i * 6, 18, C.lamp); buf.set(497 + i * 6, 37, C.lamp); }
    textOn(buf, 'ИДЁТ ЭФИР', 502, 28, C.gold[4], 0);
    pool(buf, 130, 40, 90, 40, 0.8);
    for (const x of [100, 170, 240, 310, 380, 450, 520]) pool(buf, x, 150, 40, 10, 0.5);
    dropShadow(buf, 155, 152, 40, 3);
    vignette(buf, 0.35, 280, 100);
  };

  Object.assign(L, {
    warp: {
      rope: () => sprite(36, 40, P => {
        for (const x of [4, 30]) {
          P.part(P.rect(x - 1.5, 6, 3, 30), C.gold, { b: 3, sh: 0 });
          P.part(P.ell(x, 5, 3, 3), C.gold, { b: 4 });
          P.part(P.ell(x, 36, 5, 2), C.gold, { b: 2 });
        }
        P.part(P.path('M 4 9 Q 17 22 30 9 L 30 12 Q 17 25 4 12 Z'), C.red, { b: 2 });
      }),
      desk: () => sprite(80, 44, (P, b) => {
        P.part(P.poly([2, 10, 76, 6, 78, 14, 0, 18]), C.wood, { b: 4 });
        P.part(P.poly([0, 18, 78, 14, 78, 44, 0, 44]), C.wood, { b: 2 });
        P.part(P.rect(6, 22, 66, 14), C.gold, { b: 2, sh: 0, hi: 1 });
        textOn(b, 'ПРИЁМНАЯ', 15, 25, C.night[1], 0);
        P.part(P.rect(54, 0, 14, 8), C.grey, { b: 1 });
        P.part(P.rect(56, 1, 10, 5), C.sky, { b: 3, sh: 0, hi: 0 });
        P.part(P.ell(20, 6, 4, 2), C.grey, { b: 5, sh: 0 });
      }),
      chair: () => sprite(30, 40, (P, b) => {
        P.line(4, 38, 24, 18, C.oak[1]); P.line(24, 38, 4, 18, C.oak[1]);
        P.part(P.rect(3, 16, 22, 4), C.night, { b: 2, sh: 0 });
        P.part(P.rect(3, 2, 22, 11), C.night, { b: 2 });
        textOn(b, 'РЕЖ.', 6, 3, C.grey[5], 0);
        P.part(P.rect(2, 2, 2, 20), C.oak, { b: 3, sh: 0 });
        P.part(P.rect(24, 2, 2, 20), C.oak, { b: 3, sh: 0 });
      }),
      camera: () => sprite(40, 70, P => {
        P.line(20, 34, 6, 68, C.grey[1]); P.line(20, 34, 34, 68, C.grey[1]); P.line(20, 34, 20, 68, C.grey[1]);
        P.part(P.rect(6, 12, 28, 20), C.grey, { b: 1 });
        P.part(P.rect(0, 16, 8, 12), C.grey, { b: 0 });
        P.part(P.ell(3, 22, 3, 4), C.sky, { b: 3, sh: 0, hi: 0 });
        P.part(P.ell(13, 8, 6, 6), C.grey, { b: 2 });
        P.part(P.ell(27, 8, 6, 6), C.grey, { b: 2 });
        P.part(P.rect(30, 14, 3, 3), C.red, { b: 4, sh: 0, hi: 0 });
      })
    }
  });

  BG.sitcom = function (buf) {
    const P = new Pen(buf);
    const all = P.rect(0, 0, 320, 200);
    vgrad(buf, all, C.night, 0, 200, 0.05, 0.25);
    const wall = P.rect(28, 12, 276, 118);
    vgrad(buf, wall, C.cheese, 12, 130, 0.62, 0.38);
    wall.each((x, y) => {
      const u = (x + 4) % 26, v = (y + (Math.floor((x + 4) / 26) % 2) * 14) % 28;
      if (Math.abs(u - 13) + Math.abs(v - 14) * 0.7 < 3.2) buf.set(x, y, C.oak[2]);
      else if (u === 0) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]);
    });
    part(buf, P.rect(28, 12, 276, 6), C.wood, { b: 2, sh: 0 });
    part(buf, P.rect(28, 108, 276, 22), C.wood, { b: 2 });
    for (let x = 36; x < 300; x += 20) part(buf, P.rect(x, 112, 14, 14), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(24, 10, 4, 122), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(304, 10, 4, 122), C.grey, { b: 1, sh: 0 });
    const win = P.rect(130, 28, 60, 54);
    vgrad(buf, win, C.sky, 28, 82, 0.2, 0.7);
    BG.cityView(buf, P.rect(130, 50, 60, 32), 130, 50, 190, 82, 11, false);
    S.outerLine(buf, win, C.black);
    part(buf, P.rect(128, 26, 64, 4), C.wood, { b: 3 });
    part(buf, P.rect(126, 82, 68, 5), C.wood, { b: 3 });
    line(buf, 160, 30, 160, 82, C.wood[1]);
    for (const [x0, x1] of [[118, 136], [184, 202]]) {
      part(buf, P.path(`M ${x0} 22 L ${x1} 22 Q ${x1 - 2} 60 ${x1 + (x0 < 150 ? -4 : 4)} 96 L ${x0 + (x0 < 150 ? 0 : 2)} 96 Z`), C.red, { b: 2 });
      for (let i = 1; i < 4; i++) line(buf, x0 + i * 4.5, 24, x0 + i * 4.5, 94, C.red[1]);
    }
    part(buf, P.rect(114, 20, 92, 4), C.gold, { b: 3, sh: 0 });
    part(buf, P.path('M 58 40 Q 50 30 46 34 Q 52 36 56 44 Z M 82 40 Q 90 30 94 34 Q 88 36 84 44 Z'), C.cream, { b: 4 });
    part(buf, P.path('M 58 38 Q 70 34 82 38 Q 84 50 76 58 L 64 58 Q 56 50 58 38 Z'), C.cream, { b: 4 });
    part(buf, P.ell(65, 45, 2.5, 3), C.grey, { b: 0, sh: 0, hi: 0 });
    part(buf, P.ell(75, 45, 2.5, 3), C.grey, { b: 0, sh: 0, hi: 0 });
    part(buf, P.rect(66, 52, 8, 2), C.grey, { b: 1, sh: 0, hi: 0 });
    for (let i = 0; i < 3; i++) {
      const x = 216 + i * 14;
      part(buf, P.rect(x - 1, 44, 2, 6), C.oak, { b: 1, sh: 0 });
      part(buf, P.ell(x, 55, 8, 2), [C.oak, C.wood, C.sand][i], { b: 3 });
      part(buf, P.path(`M ${x - 5} 55 Q ${x - 5} 48 ${x} 48 Q ${x + 5} 48 ${x + 5} 55 Z`), [C.oak, C.wood, C.sand][i], { b: 3 });
    }
    part(buf, P.path('M 232 72 Q 244 62 256 72 Q 244 84 232 72 Z'), C.oak, { b: 1, sh: 0 });
    part(buf, P.ell(244, 72, 7, 6), C.sand, { b: 3, sh: 0, hi: 0, ol: C.oak[1] });
    part(buf, P.rect(260, 40, 38, 92), C.grey, { b: 2 });
    part(buf, P.rect(263, 44, 32, 88), C.wood, { b: 2 });
    part(buf, P.rect(267, 50, 24, 32), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(267, 88, 24, 38), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(290, 88, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(272, 58, 14, 6), C.gold, { b: 3, sh: 0 });
    textOn(buf, '12', 274, 58, C.black, 0);
    const floor = P.poly([20, 130, 312, 130, 320, 146, 320, 200, 0, 200, 0, 146]);
    planks(buf, floor, 160, 40, C.oak, { step: 22 });
    part(buf, P.ell(158, 170, 112, 20), C.red, { b: 2 });
    part(buf, P.ell(158, 170, 98, 15), C.gold, { b: 2, sh: 0, hi: 0 });
    part(buf, P.ell(158, 170, 88, 12), C.red, { b: 3, sh: 0, hi: 0 });
    for (let i = 0; i < 12; i++) buf.set(80 + i * 14, 170 + (i % 2 ? 2 : -2), C.gold[4]);
    part(buf, P.rect(0, 40, 22, 96), C.night, { b: 1, sh: 0, hi: 0 });
    part(buf, P.rect(2, 44, 18, 90), C.grey, { b: 0 });
    part(buf, P.rect(0, 30, 35, 9), C.red, { b: 3 });
    textOn(buf, 'ВЫХОД', 2, 31, C.grey[5], 0);
    pool(buf, 160, 60, 120, 60, 0.7);
    pool(buf, 160, 170, 140, 30, 0.6);
    vignette(buf, 0.6, 160, 110);
  };

  Object.assign(L, {
    sitcom: {
      sign: g => sprite(92, 14, (P, b) => {
        const on = g && g.f.take && g.f.take.laughT && g.time - g.f.take.laughT < 1.4;
        P.part(P.rect(0, 0, 92, 13), C.grey, { b: 0 });
        textOn(b, 'АПЛОДИСМЕНТЫ', 8, 3, on ? C.neonA : C.red[1], 0);
        if (on) for (let i = 0; i < 8; i++) b.set(4 + i * 12, 1, C.lamp);
      }),
      couch: () => sprite(92, 46, P => {
        P.part(P.path('M 4 30 Q 2 8 14 6 L 78 6 Q 90 8 88 30 Z'), C.green, { b: 2 });
        for (let i = 0; i < 3; i++) P.part(P.rect(12 + i * 23, 10, 21, 18), C.green, { b: 2, sh: 1, hi: 1 });
        P.part(P.rect(2, 26, 88, 12), C.green, { b: 3 });
        P.part(P.ell(6, 26, 6, 9), C.green, { b: 3 });
        P.part(P.ell(86, 26, 6, 9), C.green, { b: 3 });
        P.part(P.rect(6, 38, 4, 7), C.wood, { b: 1, sh: 0 });
        P.part(P.rect(82, 38, 4, 7), C.wood, { b: 1, sh: 0 });
        P.part(P.poly([30, 16, 50, 14, 54, 26, 28, 28]), C.red, { b: 3 });
        for (let i = 0; i < 3; i++) P.line(32 + i * 7, 17, 34 + i * 7, 27, C.cream[4]);
      }),
      lamp: () => sprite(18, 70, P => {
        P.part(P.rect(8, 12, 2.5, 52), C.gold, { b: 2, sh: 0 });
        P.part(P.ell(9, 65, 7, 2.6), C.gold, { b: 2 });
        P.part(P.ell(9, 11, 3, 2.6), LAMP, { sh: 0, hi: 0 });
      }),
      lampshade: () => sprite(22, 16, P => {
        P.part(P.poly([1, 12, 21, 12, 17, 1, 5, 1]), C.cream, { b: 3 });
        for (let i = 0; i < 7; i++) P.line(2 + i * 3, 12, 2 + i * 3, 14, C.gold[3]);
        P.line(4, 7, 18, 7, C.red[3]);
      }),
      table: () => sprite(56, 34, P => {
        P.part(P.poly([2, 8, 54, 6, 55, 12, 1, 14]), C.wood, { b: 3 });
        P.part(P.rect(5, 12, 3, 21), C.wood, { b: 2, sh: 0 });
        P.part(P.rect(47, 12, 3, 21), C.wood, { b: 2, sh: 0 });
        P.part(P.poly([4, 13, 52, 11, 52, 18, 4, 20]), C.red, { b: 3, sh: 0 });
        for (let i = 0; i < 6; i++) P.part(P.rect(6 + i * 8, 12 - (i % 2) * 0.5, 4, 7), C.grey, { b: 5, sh: 0, hi: 0, ol: C.red[1] });
      }),
      plates: () => sprite(24, 12, P => {
        for (let i = 0; i < 3; i++) P.part(P.ell(12, 8 - i * 2, 10, 3), C.grey, { b: 5, sh: 0 });
        P.curve('M 4 3 Q 12 0 20 3', C.blue[4]);
      }),
      cowpie: () => sprite(20, 8, P => {
        P.part(P.ell(10, 5, 9, 3), C.oak, { b: 1 });
        P.part(P.ell(10, 3.5, 6, 2.2), C.oak, { b: 2, sh: 0 });
        P.part(P.ell(10, 2, 3, 1.3), C.oak, { b: 2, sh: 0 });
        P.px(6, 1, C.grey[3]); P.px(14, 0, C.grey[3]);
      }),
      camera: () => sprite(56, 82, (P, b) => {
        P.part(P.poly([22, 44, 8, 82, 14, 82, 26, 50]), C.grey, { b: 1, sh: 0 });
        P.part(P.poly([34, 44, 50, 82, 44, 82, 30, 50]), C.grey, { b: 1, sh: 0 });
        P.part(P.rect(8, 16, 42, 28), C.grey, { b: 1 });
        P.part(P.rect(0, 22, 10, 16), C.grey, { b: 0 });
        P.part(P.ell(4, 30, 3.5, 5), C.sky, { b: 3, sh: 0, hi: 0 });
        P.part(P.ell(20, 10, 8, 8), C.grey, { b: 2 });
        P.part(P.ell(40, 10, 8, 8), C.grey, { b: 2 });
        P.part(P.rect(42, 20, 4, 4), C.red, { b: 4, sh: 0, hi: 0 });
        textOn(b, '1', 26, 26, C.grey[4], 0);
      })
    }
  });

  BG.cooking = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 130);
    vgrad(buf, wall, C.mint, 0, 130, 0.75, 0.45);
    wall.each((x, y) => { if (x % 12 === 0 || y % 12 === 0) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]); });
    spotlights(buf, P, 320, 64, 5);
    part(buf, P.rect(84, 16, 152, 26), C.orange, { b: 3 });
    part(buf, P.rect(87, 19, 146, 20), C.cream, { b: 4, sh: 0, hi: 0 });
    textOn(buf, 'ГОТОВИМ НЕ ГЛЯДЯ', 104, 21, C.red[2], 0);
    part(buf, P.path('M 120 34 Q 132 26 144 34 Q 132 42 120 34 Z'), C.eye, { sh: 0, hi: 0 });
    part(buf, P.ell(132, 34, 2.5, 2.5), C.blue, { b: 2, sh: 0, hi: 0 });
    line(buf, 118, 40, 146, 28, C.red[3]); line(buf, 118, 41, 146, 29, C.red[3]);
    textOn(buf, 'для холостяков', 156, 30, C.oak[1], 0);
    for (let s = 0; s < 3; s++) {
      const y = 50 + s * 22;
      part(buf, P.rect(24, y + 16, 64, 4), C.wood, { b: 3 });
      for (let i = 0; i < 6; i++) {
        const x = 27 + i * 10;
        const kind = Math.floor(hash(i, s, 5) * 3);
        const r = [C.red, C.yellow, C.blue, C.pink, C.green, C.orange][(i + s * 2) % 6];
        if (kind === 0) P.part(P.rect(x, y + 5, 7, 11), r, { b: 3, sh: 1 });
        else if (kind === 1) P.part(P.poly([x + 1, y + 16, x + 1, y + 7, x + 3, y + 3, x + 5, y + 3, x + 7, y + 7, x + 7, y + 16]), r, { b: 3, sh: 1 });
        else P.part(P.poly([x, y + 16, x + 1, y + 8, x + 7, y + 8, x + 8, y + 16]), r, { b: 2, sh: 1 });
      }
    }
    part(buf, P.rect(250, 56, 56, 72), C.grey, { b: 3 });
    part(buf, P.rect(256, 64, 44, 8), C.grey, { b: 1, sh: 0 });
    for (let i = 0; i < 4; i++) part(buf, P.ell(262 + i * 11, 68, 2.4, 2.4), C.grey, { b: 4, sh: 0 });
    part(buf, P.rect(256, 78, 44, 42), C.grey, { b: 2 });
    part(buf, P.rect(262, 86, 32, 22), C.orange, { b: 1, sh: 0, hi: 0 });
    part(buf, P.rect(262, 80, 32, 3), C.grey, { b: 4, sh: 0 });
    textOn(buf, 'ДУХОВКА', 258, 110, C.grey[1], 0);
    part(buf, P.rect(0, 30, 22, 104), C.grey, { b: 1 });
    part(buf, P.rect(2, 34, 18, 98), C.grey, { b: 0 });
    const floor = P.rect(0, 130, 320, 70);
    floor.each((x, y) => {
      const k = (y - 70) / 130;
      const u = Math.floor(((x - 160) / k + 4000) / 22), v = Math.floor(Math.log(y - 118) * 7);
      buf.set(x, y, (u + v) % 2 ? C.cream[3] : C.red[2]);
    });
    shade(buf, floor, 0, (x, y) => Math.max(0, (144 - y) / 18));
    part(buf, P.rect(0, 126, 320, 5), C.wood, { b: 1, sh: 0, hi: 1 });
    pool(buf, 160, 40, 110, 40, 0.8);
    pool(buf, 170, 160, 130, 30, 0.6);
    vignette(buf, 0.5, 160, 100);
  };

  Object.assign(L, {
    cooking: {
      counter: () => sprite(150, 52, (P, b) => {
        P.part(P.poly([2, 16, 148, 14, 150, 22, 0, 24]), C.grey, { b: 4 });
        P.part(P.poly([0, 24, 150, 22, 150, 52, 0, 52]), C.red, { b: 2 });
        for (let i = 0; i < 5; i++) P.part(P.rect(6 + i * 29, 28, 25, 20), C.red, { b: 2, sh: 1, hi: 1 });
        P.part(P.ell(40, 14, 12, 4), C.stone, { b: 3 });
        P.part(P.ell(40, 13, 9, 2.4), C.stone, { b: 1, sh: 0, hi: 0 });
        P.line(36, 13, 44, 4, C.grey[4]);
        for (const [x, r] of [[80, C.yellow], [92, C.pink], [104, C.green], [116, C.blue]]) {
          P.part(P.rect(x, 6, 7, 10), r, { b: 3 });
          P.part(P.rect(x + 1.5, 4, 4, 2.5), C.grey, { b: 4, sh: 0 });
        }
        textOn(b, '?', 82, 8, C.black, 0);
      }),
      mask: () => sprite(18, 14, P => {
        P.line(9, 0, 9, 4, C.grey[3]);
        P.part(P.ell(9, 8, 8, 4), C.night, { b: 2 });
        P.part(P.ell(5, 8, 2.4, 1.6), C.night, { b: 1, sh: 0, hi: 0 });
        P.part(P.ell(13, 8, 2.4, 1.6), C.night, { b: 1, sh: 0, hi: 0 });
      }),
      camera: () => L.sitcom.camera()
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
