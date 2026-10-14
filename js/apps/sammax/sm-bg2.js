(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade, fill, line, hash, font } = S;
  const BG = S.BG, LAYERS = S.LAYERS;
  const { vgrad, bricks, planks, pool, dropShadow, textOn, sprite, vignette, lineIn } = BG;

  function stripes(buf, m, a, b, w) {
    m.each((x, y) => buf.set(x, y, Math.floor((x - y * 0.2) / w) % 2 ? a : b));
  }

  function windowPane(P, x, y, w, h, o) {
    o = o || {};
    const b = P.b;
    part(b, P.rect(x - 3, y - 3, w + 6, h + 6), o.frame || C.stone, { b: 3 });
    const glass = P.rect(x, y, w, h);
    grad(b, glass, o.glass || C.sky, (px, py) => 0.2 + (py - y) / h * 0.5 + (hash(px, py, 3) - 0.5) * 0.15);
    if (o.lit) grad(b, glass, [C.orange[3], C.yellow[3], C.lamp], (px, py) => 0.3 + (py - y) / h * 0.4);
    for (let i = 0; i < 3; i++) line(b, x + 2 + i * 4, y + h - 2, x + w - 2, y + 2 + i * 4, o.lit ? C.yellow[4] : C.sky[4]);
    line(b, x + w / 2, y, x + w / 2, y + h, o.frame ? o.frame[1] : C.stone[1]);
    line(b, x, y + h / 2, x + w, y + h / 2, o.frame ? o.frame[1] : C.stone[1]);
    S.outerLine(b, glass, C.black);
    part(b, P.rect(x - 5, y + h + 2, w + 10, 4), o.frame || C.stone, { b: 4, sh: 0 });
  }

  BG.street = function (buf) {
    const P = new Pen(buf);
    const sky = P.rect(0, 0, 640, 80);
    vgrad(buf, sky, C.sky, 0, 80, 0.7, 0.3);
    const syb = P.poly([0, 6, 152, 10, 152, 140, 0, 140]);
    vgrad(buf, syb, C.rose, 6, 140, 0.8, 0.35);
    shade(buf, syb, 0, (x, y) => hash(Math.floor(x / 3), Math.floor(y / 3), 8) < 0.12 ? 0.6 : 0);
    part(buf, P.poly([0, 2, 156, 6, 156, 12, 0, 9]), C.plum, { b: 3 });
    part(buf, P.rect(0, 56, 152, 5), C.plum, { b: 3, sh: 0 });
    windowPane(P, 14, 16, 30, 32, { frame: C.plum });
    windowPane(P, 62, 16, 30, 32, { frame: C.plum, lit: true });
    windowPane(P, 110, 16, 30, 32, { frame: C.plum });
    windowPane(P, 10, 84, 42, 40, { frame: C.plum, lit: true });
    part(buf, P.poly([18, 120, 26, 104, 34, 120]), C.green, { b: 2 });
    part(buf, P.rect(22, 118, 8, 6), C.brick, { b: 3, sh: 0 });
    part(buf, P.poly([56, 64, 108, 64, 112, 76, 52, 76]), C.pink, { b: 3 });
    stripes(buf, P.poly([57, 65, 107, 65, 111, 75, 53, 75]), C.pink[3], C.grey[5], 4);
    S.outerLine(buf, P.poly([57, 65, 107, 65, 111, 75, 53, 75]), C.black);
    const door = P.rect(66, 78, 32, 62);
    part(buf, door, C.purple, { b: 2 });
    part(buf, P.rect(70, 84, 24, 22), C.purple, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(82, 94, 7, 7), C.sky, { b: 3, sh: 0 });
    part(buf, P.rect(70, 110, 24, 24), C.purple, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(93, 112, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(102, 88, 36, 20), C.gold, { b: 3 });
    textOn(buf, 'Д-Р', 112, 90, C.gold[0], 0);
    textOn(buf, 'СИБИЛ', 105, 98, C.gold[0], 0);
    part(buf, P.rect(4, 44, 144, 11), C.plum, { b: 1 });
    textOn(buf, 'ПСИХОТЕРАПИЯ', 32, 46, C.gold[4], C.black);
    part(buf, P.rect(152, 0, 6, 140), C.grey, { b: 2, sh: 0 });
    const ob = P.rect(158, 0, 236, 140);
    bricks(buf, ob, 10, 5, C.brick, C.brick[0], 3);
    shade(buf, ob, 0, (x, y) => y < 8 ? 0.8 : 0);
    part(buf, P.rect(156, 62, 240, 7), C.stone, { b: 3 });
    windowPane(P, 196, 12, 48, 42, { frame: C.oak });
    for (let i = 0; i < 4; i++) part(buf, P.rect(196, 12 + i * 3, 48, 2), C.sand, { b: 3, sh: 0, hi: 0, ol: C.sand[0] });
    textOn(buf, 'SAM & MAX', 198, 34, C.gold[3], C.black);
    windowPane(P, 302, 12, 48, 42, { frame: C.oak });
    const gw = P.rect(184, 76, 70, 62);
    part(buf, gw, C.stone, { b: 2, sh: 0, hi: 0 });
    bricks(buf, P.rect(186, 78, 66, 58), 10, 5, C.stone, C.stone[0], 7);
    const st = P.rect(274, 126, 58, 14);
    part(buf, st, C.stone, { b: 3 });
    line(buf, 276, 131, 330, 131, C.stone[1]); line(buf, 276, 135, 330, 135, C.stone[1]);
    part(buf, P.rect(282, 118, 42, 9), C.stone, { b: 4 });
    part(buf, P.rect(286, 60, 34, 60), C.green, { b: 1 });
    part(buf, P.rect(290, 64, 26, 24), C.green, { b: 1, sh: 1, hi: 1 });
    part(buf, P.rect(290, 92, 26, 24), C.green, { b: 1, sh: 1, hi: 1 });
    part(buf, P.ell(313, 90, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(282, 54, 42, 6), C.stone, { b: 3 });
    textOn(buf, '12', 298, 55, C.black, 0);
    part(buf, P.rect(344, 80, 42, 50), C.oak, { b: 2 });
    for (let i = 0; i < 4; i++) part(buf, P.poly([342, 84 + i * 12, 388, 80 + i * 12, 388, 88 + i * 12, 342, 92 + i * 12]), C.oak, { b: 3, sh: 1 });
    part(buf, P.rect(394, 0, 6, 140), C.grey, { b: 2, sh: 0 });
    const bw = P.rect(400, 18, 164, 122);
    vgrad(buf, bw, C.stone, 18, 140, 0.55, 0.3);
    shade(buf, bw, 0, (x, y) => (y % 12 === 0 || (x + (Math.floor(y / 12) % 2) * 12) % 24 === 0) ? 0.7 : 0);
    part(buf, P.poly([398, 16, 566, 16, 566, 22, 398, 22]), C.stone, { b: 1 });
    part(buf, P.rect(404, 24, 156, 30), C.navy, { b: 1 });
    S.bigText(buf, "BOSCO'S", 482, 27, 2, C.red[3], C.orange[4], 1);
    textOn(buf, 'МАГАЗИН НЕУДОБСТВ', 434, 45, C.yellow[3], C.black);
    windowPane(P, 408, 66, 50, 58, { frame: C.stone, glass: C.teal });
    part(buf, P.rect(412, 72, 18, 24), C.yellow, { b: 3 });
    textOn(buf, 'СЫР', 414, 80, C.red[2], 0);
    part(buf, P.rect(434, 76, 20, 30), C.grey, { b: 5 });
    textOn(buf, 'EYE', 436, 80, C.red[2], 0);
    textOn(buf, '-BO', 436, 90, C.red[2], 0);
    windowPane(P, 510, 66, 50, 58, { frame: C.stone, glass: C.teal });
    textOn(buf, 'OPEN', 518, 72, C.neonA, C.black);
    part(buf, P.rect(514, 90, 42, 14), C.orange, { b: 3 });
    textOn(buf, '-0%', 522, 93, C.black, 0);
    part(buf, P.rect(466, 62, 36, 78), C.grey, { b: 1 });
    part(buf, P.rect(470, 66, 28, 50), C.teal, { b: 1, sh: 0 });
    for (let i = 0; i < 6; i++) line(buf, 472 + i * 5, 66, 472 + i * 5, 115, C.grey[3]);
    part(buf, P.rect(492, 118, 4, 4), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(530, 58, 10, 6), C.grey, { b: 2 });
    buf.set(538, 60, C.red[4]);
    const al = P.rect(564, 0, 76, 140);
    vgrad(buf, al, C.night, 0, 140, 0.6, 0.15);
    bricks(buf, P.rect(572, 0, 68, 138), 10, 5, [C.night[0], C.night[1], C.night[2], C.night[3], C.night[4]], C.black, 5);
    shade(buf, al, 0, (x, y) => 0.3 + y / 400);
    for (let i = 0; i < 4; i++) {
      part(buf, P.rect(588, 14 + i * 26, 46, 3), C.grey, { b: 1, sh: 0 });
      for (let k = 0; k < 6; k++) line(buf, 590 + k * 8, 14 + i * 26, 590 + k * 8, 6 + i * 26, C.grey[1]);
    }
    part(buf, P.rect(566, 0, 4, 140), C.grey, { b: 1, sh: 0 });
    const walk = P.rect(0, 138, 640, 30);
    grad(buf, walk, C.stone, (x, y) => 0.55 + (y - 138) / 90 + (hash(Math.floor(x / 2), Math.floor(y / 2), 4) - 0.5) * 0.1);
    for (let x = 0; x < 640; x += 30) lineIn(buf, walk, x + 8, 138, x - 4, 168, C.stone[1]);
    lineIn(buf, walk, 0, 152, 640, 152, C.stone[2]);
    part(buf, P.rect(0, 136, 640, 3), C.stone, { b: 2, sh: 0, hi: 0 });
    part(buf, P.rect(0, 166, 640, 5), C.stone, { b: 1, sh: 0, hi: 1 });
    const road = P.rect(0, 171, 640, 29);
    grad(buf, road, C.asphalt, (x, y) => 0.55 - (y - 171) / 120 + (hash(x, y, 6) - 0.5) * 0.2);
    for (let x = 20; x < 640; x += 60) part(buf, P.rect(x, 194, 26, 3), C.yellow, { b: 3, sh: 0, hi: 0, ol: 0 });
    part(buf, P.ell(470, 184, 12, 3), C.grey, { b: 1 });
    for (const [x, y] of [[120, 150], [330, 160], [520, 146]]) { line(buf, x, y, x + 5, y + 3, C.stone[1]); line(buf, x + 5, y + 3, x + 9, y + 2, C.stone[1]); }
    part(buf, P.ell(250, 158, 10, 2.5), C.red, { b: 1, sh: 0, hi: 0, ol: 0 });
    dropShadow(buf, 300, 140, 40, 3);
    pool(buf, 172, 150, 40, 12, 0.6);
    pool(buf, 440, 150, 40, 12, 0.6);
    vignette(buf, 0.35, 320, 110);
  };

  function whitewall(Q, cx, cy) {
    Q.part(Q.ell(cx, cy, 9.5, 9.5), C.grey, { b: 0 });
    Q.part(Q.ell(cx, cy, 6.5, 6.5), C.grey, { b: 5, sh: 0, hi: 0 });
    Q.part(Q.ell(cx, cy, 4.5, 4.5), C.grey, { b: 1, sh: 0 });
    for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - 0.3; Q.line(cx, cy, cx + Math.cos(a) * 3.5, cy + Math.sin(a) * 3.5, C.grey[3]); }
    Q.part(Q.ell(cx, cy, 1.4, 1.4), C.grey, { b: 4, sh: 0, ol: 0 });
  }

  function desoto(P, x, y) {
    const Q = new Pen(P.b).at(x, y);
    Q.part(Q.poly([44, 16, 50, 5, 57, 5, 56, 16]), C.sky, { b: 3, sh: 0 });
    Q.line(50, 5, 57, 5, C.grey[5]);
    Q.line(49, 7, 45, 15, C.grey[4]);
    Q.part(Q.path('M 57 16 L 58 12 Q 64 9 70 12 L 71 16 Z M 75 16 L 76 12 Q 82 9 88 12 L 89 16 Z'), C.red, { b: 2, sh: 1 });
    Q.line(59, 14, 62, 9, C.grey[1]);
    Q.part(Q.rect(56, 14, 40, 2), C.red, { b: 1, sh: 0, hi: 0, ol: 0 });
    Q.part(Q.path('M 92 16 L 94 13 L 108 13 L 110 15 Z'), C.cream, { b: 3, sh: 0 });
    Q.part(Q.path('M 0 31 L -1 22 Q 0 18 6 17 L 26 16 Q 30 12 38 14 L 40 16 L 110 15 L 128 3 L 131 5 L 130 17 L 131 31 L 115 31 Q 104 16 93 31 L 33 31 Q 22 16 11 31 Z'), C.grey, { b: 0, sh: 1 });
    Q.part(Q.poly([51, 16, 90, 16, 92, 31, 48, 31]), C.grey, { b: 5, sh: 1 });
    Q.line(6, 19, 118, 19, C.red[3]);
    Q.line(118, 19, 124, 13, C.red[3]);
    for (const [px, py] of [[12, 18], [13, 20], [14, 18], [115, 18], [116, 20], [117, 18]]) Q.px(px, py, C.red[3]);
    Q.part(Q.poly([65, 21, 70, 20, 75, 21, 76, 25, 70, 30, 64, 25]), C.grey, { b: 3, sh: 0, ol: C.red[1] });
    Q.part(Q.ell(70, 24.5, 2, 2), C.grey, { b: 0, sh: 0, ol: 0 });
    Q.part(Q.path('M 26 16 Q 30 12 38 14 L 38 16 Z'), C.grey, { b: 1, sh: 0 });
    Q.part(Q.rect(36, 29, 58, 2), C.grey, { b: 4, sh: 0, hi: 0 });
    Q.part(Q.rect(-2, 25, 10, 4), C.grey, { b: 4, sh: 0 });
    Q.part(Q.rect(121, 24, 11, 4), C.grey, { b: 4, sh: 0 });
    Q.part(Q.rect(0, 26, 3, 2), C.orange, { b: 4, sh: 0, hi: 0, ol: 0 });
    Q.part(Q.ell(2.5, 21, 2.5, 2.5), C.grey, { b: 4, sh: 0 });
    Q.part(Q.ell(2.5, 21, 1.3, 1.3), C.eye, { sh: 0, hi: 0, ol: 0 });
    Q.part(Q.rect(127, 8, 3, 8), C.red, { b: 3, sh: 0 });
    whitewall(Q, 22, 32);
    whitewall(Q, 104, 32);
  }

  function sedan(P, x, y, ramp) {
    const b = P.b;
    part(b, P.path(`M ${x} ${y + 26} L ${x + 3} ${y + 16} L ${x + 20} ${y + 14} L ${x + 30} ${y + 3} L ${x + 64} ${y + 3} L ${x + 76} ${y + 14} L ${x + 100} ${y + 16} L ${x + 102} ${y + 26} Z`), ramp, { b: 2 });
    part(b, P.poly([x + 32, y + 5, x + 46, y + 5, x + 46, y + 13, x + 25, y + 13]), C.sky, { b: 3, sh: 0 });
    part(b, P.poly([x + 50, y + 5, x + 62, y + 5, x + 72, y + 13, x + 50, y + 13]), C.sky, { b: 3, sh: 0 });
    part(b, P.rect(x + 1, y + 21, 101, 3), C.grey, { b: 4, sh: 0 });
    for (const wx of [x + 20, x + 82]) { part(b, P.ell(wx, y + 26, 8, 8), C.grey, { b: 0 }); part(b, P.ell(wx, y + 26, 3.5, 3.5), C.grey, { b: 4, sh: 0 }); }
    part(b, P.rect(x + 98, y + 16, 4, 4), C.red, { b: 4, sh: 0 });
  }

  Object.assign(LAYERS, {
    street: {
      desoto: () => sprite(134, 44, P => desoto(P, 3, 2)),
      redcar: () => sprite(108, 38, P => sedan(P, 3, 3, C.red)),
      spray: () => sprite(8, 12, P => { P.part(P.rect(1, 3, 5, 8), C.green, { b: 3 }); P.part(P.rect(2, 0, 3, 3), C.grey, { b: 4, sh: 0 }); }),
      lamp: () => sprite(20, 112, P => {
        P.part(P.rect(8, 10, 4, 100), C.grey, { b: 1, sh: 0 });
        P.part(P.rect(5, 104, 10, 7), C.grey, { b: 1, sh: 0 });
        P.part(P.path('M 2 12 L 18 12 L 14 2 L 6 2 Z'), C.grey, { b: 1 });
        P.part(P.rect(6, 9, 8, 4), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
      }),
      hydrant: () => sprite(14, 20, P => {
        P.part(P.rect(3, 6, 8, 12), C.red, { b: 3 });
        P.part(P.ell(7, 6, 4.5, 3), C.red, { b: 3 });
        P.part(P.rect(0, 9, 14, 4), C.red, { b: 2 });
        P.part(P.rect(2, 17, 10, 3), C.red, { b: 1, sh: 0 });
      }),
      mailbox: () => sprite(20, 30, P => {
        P.part(P.path('M 2 26 L 2 8 Q 10 0 18 8 L 18 26 Z'), C.blue, { b: 2 });
        P.part(P.rect(5, 12, 10, 2), C.grey, { b: 0, sh: 0, hi: 0 });
        P.part(P.rect(6, 26, 8, 4), C.blue, { b: 1, sh: 0 });
        textOn(P.b, 'US', 6, 17, C.grey[5], 0);
      }),
      oldGraffiti: g => sprite(66, 58, (P, b) => {
        const ruined = g && g.f.graffitiRuined && !g.f.specsFixed;
        P.part(P.ell(33, 24, 22, 12), C.slime, { b: 3 });
        P.part(P.ell(33, 24, 9, 9), C.eye, { sh: 0, hi: 0 });
        P.part(P.ell(33, 24, 4.5, 4.5), C.blue, { b: 2, sh: 0, hi: 0 });
        textOn(b, 'EYE-BO!', 12, 42, C.slime[4], C.slime[0]);
        for (let i = 0; i < 6; i++) line(b, 10 + i * 9, 50 + (i % 2) * 2, 10 + i * 9, 56, C.slime[2]);
        if (ruined) {
          P.part(P.ell(34, 26, 24, 16), C.green, { b: 3, sh: 0, hi: 0, ol: C.green[1] });
          P.part(P.ell(26, 22, 3, 3), C.black, { b: 0, sh: 0, hi: 0 });
          P.part(P.ell(42, 22, 3, 3), C.black, { b: 0, sh: 0, hi: 0 });
          P.curve('M 22 30 Q 34 40 46 30', C.black);
          textOn(b, 'МАКС', 18, 44, C.yellow[4], C.black);
        }
      }),
      newGraffiti: () => sprite(44, 50, (P, b) => {
        P.part(P.poly([6, 6, 38, 4, 40, 30, 4, 34]), C.pink, { b: 3, sh: 0, hi: 0 });
        textOn(b, 'EYE', 10, 10, C.yellow[4], C.black);
        textOn(b, '-BO', 14, 20, C.yellow[4], C.black);
        for (let i = 0; i < 4; i++) line(b, 8 + i * 9, 34, 8 + i * 9, 44, C.pink[2]);
      }),
      vanShadow: () => sprite(90, 10, P => { P.part(P.ell(45, 5, 42, 4), C.night, { b: 0, sh: 0, hi: 0, ol: 0 }); })
    }
  });

  BG.bosco = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 124);
    vgrad(buf, wall, C.olive, 0, 124, 0.25, 0.6);
    shade(buf, wall, 0, (x, y) => (y % 16 === 15) ? 0.6 : 0);
    part(buf, P.rect(0, 0, 320, 6), C.olive, { b: 1, sh: 0, hi: 0 });
    for (const lx of [70, 200]) {
      part(buf, P.rect(lx, 6, 50, 5), C.grey, { b: 4, sh: 0 });
      part(buf, P.rect(lx + 2, 9, 46, 3), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
    }
    const floor = P.poly([0, 124, 320, 124, 320, 200, 0, 200]);
    floor.each((x, y) => {
      const vx = 160, vy = 20;
      const k = (y - vy) / (200 - vy);
      const u = Math.floor(((x - vx) / k + 1000) / 26), v = Math.floor(Math.log(y - 110) * 6);
      buf.set(x, y, (u + v) % 2 ? C.cream[3] : C.green[2]);
    });
    shade(buf, floor, 0, (x, y) => Math.max(0, (140 - y) / 30));
    part(buf, P.rect(0, 120, 320, 5), C.wood, { b: 1, sh: 0, hi: 1 });
    part(buf, P.rect(4, 30, 42, 110), C.grey, { b: 1 });
    part(buf, P.rect(8, 34, 34, 56), C.sky, { b: 2, sh: 0 });
    textOn(buf, 'ВЫХОД', 9, 92, C.red[4], C.black);
    for (let i = 0; i < 5; i++) line(buf, 10 + i * 7, 34, 10 + i * 7, 89, C.grey[2]);
    part(buf, P.rect(36, 106, 4, 8), C.gold, { b: 3, sh: 0 });
    for (let s = 0; s < 3; s++) {
      const y = 28 + s * 30;
      part(buf, P.rect(56, y + 20, 76, 5), C.wood, { b: 3 });
      for (let i = 0; i < 8; i++) {
        const x = 58 + i * 8.6;
        const kind = Math.floor(hash(i, s, 3) * 5);
        const h = 8 + Math.floor(hash(i, s, 4) * 10);
        const ramps = [C.red, C.blue, C.yellow, C.green, C.orange];
        if (kind < 3) P.part(P.rect(x, y + 20 - h, 7, h), ramps[(i + s) % 5], { b: 3, sh: 1 });
        else P.part(P.poly([x + 2, y + 20, x + 2, y + 20 - h + 4, x + 3, y + 20 - h, x + 5, y + 20 - h, x + 6, y + 20 - h + 4, x + 6, y + 20]), ramps[(i * 3 + s) % 5], { b: 2, sh: 1 });
      }
    }
    part(buf, P.rect(56, 110, 76, 14), C.wood, { b: 2 });
    part(buf, P.rect(174, 96, 18, 26), C.oak, { b: 3 });
    part(buf, P.ell(183, 96, 9, 3), C.oak, { b: 4, sh: 0 });
    line(buf, 174, 104, 192, 104, C.oak[1]);
    line(buf, 174, 113, 192, 113, C.oak[1]);
    part(buf, P.rect(138, 40, 32, 72), C.teal, { b: 2 });
    part(buf, P.rect(142, 44, 24, 30), C.teal, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(142, 78, 24, 30), C.teal, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(146, 32, 16, 8), C.grey, { b: 5 });
    textOn(buf, 'WC', 148, 33, C.blue[2], 0);
    part(buf, P.ell(163, 78, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(186, 14, 56, 12), C.red, { b: 3 });
    textOn(buf, 'НЕ СЛОНЯТЬСЯ!', 188, 16, C.grey[5], C.black);
    part(buf, P.rect(96, 1, 92, 11), C.yellow, { b: 3 });
    textOn(buf, 'ТОРГ НЕУМЕСТЕН', 142 - Math.floor(S.font.measure('ТОРГ НЕУМЕСТЕН') / 2), 3, C.black, 0);
    part(buf, P.rect(244, 22, 72, 44), C.wood, { b: 1 });
    for (let i = 0; i < 6; i++) buf.set(250 + i * 11, 28, C.grey[4]);
    part(buf, P.rect(248, 48, 32, 14), C.gold, { b: 3 });
    textOn(buf, 'ХИТ!', 254, 50, C.black, 0);
    part(buf, P.rect(286, 30, 26, 30), C.red, { b: 2 });
    textOn(buf, 'SAFE', 288, 38, C.grey[5], 0);
    part(buf, P.rect(40, 4, 44, 14), C.grey, { b: 2 });
    textOn(buf, 'АНТИВОР', 42, 5, C.red[4], 0);
    part(buf, P.rect(42, 20, 8, 8), C.grey, { b: 3 });
    for (let i = 0; i < 4; i++) line(buf, 50 + i * 5, 22 + (i % 2) * 4, 55 + i * 5, 26 - (i % 2) * 4, C.grey[4]);
    pool(buf, 95, 12, 60, 30, 0.8);
    pool(buf, 225, 12, 60, 30, 0.8);
    pool(buf, 150, 170, 150, 40, 0.5);
    vignette(buf, 0.9);
  };

  Object.assign(LAYERS, {
    bosco: {
      counter: () => sprite(104, 70, P => {
        P.part(P.poly([4, 16, 102, 12, 102, 26, 0, 30]), C.oak, { b: 4 });
        P.part(P.poly([0, 30, 102, 26, 102, 70, 0, 70]), C.oak, { b: 2 });
        for (let i = 0; i < 4; i++) P.part(P.rect(6 + i * 24, 36, 20, 28), C.oak, { b: 2, sh: 1, hi: 1 });
        P.part(P.poly([58, 0, 84, 0, 88, 14, 54, 16]), C.grey, { b: 2 });
        P.part(P.rect(62, 2, 18, 5), C.slime, { b: 3, sh: 0, hi: 0 });
        textOn(P.b, '$$$', 64, 2, C.black, 0);
        P.part(P.rect(18, 8, 18, 9), C.yellow, { b: 4, sh: 0 });
      }),
      table: () => sprite(44, 30, P => {
        P.part(P.poly([2, 8, 42, 6, 42, 12, 2, 14]), C.wood, { b: 3 });
        P.part(P.rect(5, 12, 3, 17), C.wood, { b: 2, sh: 0 });
        P.part(P.rect(36, 12, 3, 17), C.wood, { b: 2, sh: 0 });
      }),
      cheese: () => sprite(24, 16, P => {
        P.part(P.ell(12, 11, 10, 4.5), C.orange, { b: 3 });
        P.part(P.rect(2, 6, 20, 5), C.orange, { b: 3, sh: 0 });
        P.part(P.ell(12, 6, 10, 4), C.orange, { b: 4, sh: 0 });
      }),
      stand: () => sprite(28, 64, (P, b) => {
        P.part(P.rect(12, 20, 4, 44), C.grey, { b: 2, sh: 0 });
        P.part(P.rect(4, 60, 20, 4), C.grey, { b: 1, sh: 0 });
        P.part(P.rect(1, 2, 26, 24), C.red, { b: 3 });
        P.part(P.ell(14, 11, 9, 5), C.eye, { sh: 0, hi: 0 });
        P.part(P.ell(14, 11, 3.5, 3.5), C.blue, { b: 2, sh: 0, hi: 0 });
        textOn(b, 'FREE', 5, 17, C.yellow[4], C.black);
        for (let i = 0; i < 3; i++) P.part(P.rect(4 + i * 7, 28 + i, 6, 9), C.grey, { b: 0, sh: 0 });
      }),
      launcher: () => sprite(40, 16, P => {
        P.part(P.poly([2, 6, 28, 4, 29, 10, 3, 12]), C.olive, { b: 2 });
        P.part(P.ell(30, 7, 5, 5.5), C.olive, { b: 3 });
        P.part(P.poly([8, 11, 13, 11, 12, 16, 7, 16]), C.wood, { b: 2, sh: 0 });
      }),
      tag: () => sprite(30, 12, (P, b) => { P.part(P.rect(0, 0, 30, 11), C.grey, { b: 5 }); textOn(b, '10 000$', 2, 2, C.red[2], 0); }),
      glovearm: g => sprite(90, 40, P => {
        const ext = g && g.f.punchT ? Math.max(0, 1 - Math.abs(g.time - g.f.punchT - 0.25) * 4) : 0;
        const len = 8 + ext * 60;
        for (let i = 0; i < 6; i++) P.line(4 + i * len / 6, 8 + (i % 2 ? -4 : 4), 4 + (i + 1) * len / 6, 8 + (i % 2 ? 4 : -4), C.grey[4]);
        P.part(P.ell(10 + len, 10, 8, 7), C.red, { b: 3 });
        P.part(P.ell(6 + len, 8, 3, 3.5), C.red, { b: 3 });
      }),
      wcOpen: () => sprite(34, 74, P => {
        P.part(P.rect(1, 1, 32, 72), C.black, { b: 0, sh: 0, hi: 0 });
        P.part(P.rect(3, 3, 28, 68), C.teal, { b: 0, sh: 0, hi: 0, ol: 0 });
      })
    }
  });

  Object.assign(BG, { desoto, sedan, windowPane });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
