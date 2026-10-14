(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade, line, hash, fill } = S;
  const BG = S.BG;
  const E = S.EP104;
  const L = E.LAYERS;
  const A = S.art104;
  const { vgrad, pool, dropShadow, textOn, sprite, vignette } = BG;
  const LAMP = A.LAMP;
  const WHITE = [C.grey[3], C.grey[4], C.grey[5], C.eye, C.eye];

  function tree(buf, P, x, y, r, seed) {
    part(buf, P.rect(x - 1.5, y, 3, r * 0.9), C.wood, { b: 1, sh: 0, hi: 0 });
    for (let i = 0; i < 5; i++) {
      const a = hash(i, seed, 1) * 6.28, d = r * 0.5 * hash(i, seed, 2);
      part(buf, P.ell(x + Math.cos(a) * d, y - r * 0.2 + Math.sin(a) * d * 0.7, r * 0.72, r * 0.62), C.green, { b: 1 + (i % 2), sh: 1, hi: 1 });
    }
  }

  function pane(buf, P, x, y, w, h) {
    part(buf, P.rect(x - 2, y - 2, w + 4, h + 4), WHITE, { b: 1 });
    const glass = P.rect(x, y, w, h);
    grad(buf, glass, C.navy, (px, py) => 0.35 + (py - y) / h * 0.45);
    line(buf, x + w / 2, y, x + w / 2, y + h, C.grey[4]);
    line(buf, x, y + h / 2, x + w, y + h / 2, C.grey[4]);
    line(buf, x + 2, y + h - 3, x + w - 4, y + 2, C.sky[2]);
  }

  function usFlag(buf, m, x0, y0) {
    m.each((x, y) => {
      if (buf.px[y * buf.w + x] === C.black) return;
      const canton = x - x0 < 9 && y - y0 < 7;
      buf.set(x, y, canton ? ((x + y) % 3 === 0 ? C.grey[5] : C.blue[2]) : (Math.floor((y - y0) / 2) % 2 ? C.grey[5] : C.red[3]));
    });
  }

  function bunting(P, x0, x1, y, drop) {
    const n = Math.max(1, Math.round((x1 - x0) / 22));
    const step = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      const a = x0 + i * step, b = a + step, mid = (a + b) / 2;
      P.part(P.path(`M ${a} ${y} Q ${mid} ${y + drop * 2.2} ${b} ${y} Z`), C.blue, { b: 3, sh: 0, hi: 0 });
      P.part(P.path(`M ${a + 1.6} ${y} Q ${mid} ${y + drop * 1.5} ${b - 1.6} ${y} Z`), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
      P.part(P.path(`M ${a + 3.4} ${y} Q ${mid} ${y + drop * 0.8} ${b - 3.4} ${y} Z`), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
    }
  }

  function obelisk(P, x, top, base, wd, ramp) {
    P.part(P.poly([x - wd, base, x - wd * 0.62, top + wd * 1.6, x, top, x + wd * 0.62, top + wd * 1.6, x + wd, base]), ramp, { b: 2 });
    P.part(P.poly([x, top, x + wd * 0.62, top + wd * 1.6, x + wd, base, x, base]), ramp, { b: 1, sh: 0, hi: 0, ol: 0 });
  }

  BG.lawn = function (buf) {
    const P = new Pen(buf);
    const W = 640;
    const sky = P.rect(0, 0, W, 100);
    vgrad(buf, sky, C.sky, 0, 100, 0.3, 0.98);
    for (const [cx, cy, rx] of [[70, 22, 30], [126, 30, 18], [470, 16, 34], [560, 28, 22], [610, 14, 16]]) {
      fill(buf, P.ell(cx, cy, rx, rx * 0.26), C.eye);
      fill(buf, P.ell(cx + rx * 0.3, cy - 3, rx * 0.5, rx * 0.22), C.eye);
    }
    obelisk(P, 44, 4, 78, 5, WHITE);
    for (let i = 0; i < 17; i++) tree(buf, P, 10 + i * 40 + hash(i, 7, 3) * 12, 74 + hash(i, 7, 4) * 10, 17 + hash(i, 7, 5) * 7, i + 3);
    part(buf, P.rect(0, 100, W, 30), C.green, { b: 1, sh: 0, hi: 0, ol: 0 });
    for (let x = 4; x < W; x += 13) part(buf, P.ell(x + hash(x, 3, 2) * 4, 101, 8, 5), C.green, { b: 1, sh: 0, hi: 1, ol: 0 });
    part(buf, P.rect(146, 36, 368, 6), WHITE, { b: 1 });
    for (let x = 150; x < 512; x += 6) line(buf, x, 37, x, 40, C.grey[3]);
    const body = P.rect(150, 42, 360, 88);
    part(buf, body, WHITE, { b: 2 });
    shade(buf, body, 0, (x, y) => (y > 118 ? 0.5 : 0) + (hash(x >> 2, y >> 2, 11) < 0.04 ? 0.5 : 0));
    line(buf, 150, 78, 510, 78, C.grey[4]);
    for (const x of [160, 186, 212, 238, 406, 432, 458, 484]) pane(buf, P, x, 50, 14, 20);
    for (const x of [160, 458, 484]) pane(buf, P, x, 88, 14, 24);
    part(buf, P.rect(258, 42, 144, 88), WHITE, { b: 1, sh: 0, hi: 0 });
    part(buf, P.poly([252, 42, 330, 14, 408, 42]), WHITE, { b: 2 });
    part(buf, P.poly([266, 39, 330, 19, 394, 39]), WHITE, { b: 1, sh: 0, hi: 0 });
    part(buf, P.ell(330, 31, 6, 4.5), WHITE, { b: 2, sh: 0 });
    part(buf, P.rect(254, 42, 152, 6), WHITE, { b: 2 });
    part(buf, P.rect(300, 66, 60, 62), WHITE, { b: 2 });
    part(buf, P.path('M 306 74 Q 330 56 354 74 Z'), C.sky, { b: 3, sh: 0 });
    for (let i = 0; i < 5; i++) line(buf, 330, 74, 310 + i * 10, 66 + Math.abs(i - 2) * 3, C.grey[4]);
    const door = P.rect(308, 76, 44, 52);
    part(buf, door, C.wood, { b: 2 });
    part(buf, P.rect(311, 80, 17, 20), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(332, 80, 17, 20), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(311, 104, 17, 20), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(332, 104, 17, 20), C.wood, { b: 2, sh: 1, hi: 1 });
    line(buf, 330, 76, 330, 127, C.wood[0]);
    part(buf, P.ell(327, 103, 1.4, 1.4), C.gold, { b: 3, sh: 0 });
    part(buf, P.ell(333, 103, 1.4, 1.4), C.gold, { b: 3, sh: 0 });
    for (const x of [264, 288, 364, 388]) {
      part(buf, P.rect(x, 48, 9, 78), WHITE, { b: 2 });
      line(buf, x + 3, 50, x + 3, 124, C.grey[4]);
      part(buf, P.rect(x - 2, 46, 13, 4), WHITE, { b: 2, sh: 0 });
      part(buf, P.rect(x - 2, 124, 13, 4), WHITE, { b: 1, sh: 0 });
    }
    line(buf, 330, 48, 330, 58, C.black);
    part(buf, P.rect(327, 57, 7, 8), C.gold, { b: 3 });
    part(buf, P.rect(329, 59, 3, 4), LAMP, { sh: 0, hi: 0, ol: 0 });
    line(buf, 330, 14, 330, 0, C.grey[2]);
    usFlag(buf, P.part(P.rect(331, 1, 20, 11), C.red, { b: 3 }), 331, 1);
    part(buf, P.poly([244, 128, 416, 128, 426, 138, 234, 138]), C.stone, { b: 4 });
    line(buf, 240, 132, 420, 132, C.stone[2]);
    line(buf, 237, 135, 423, 135, C.stone[2]);
    part(buf, P.rect(194, 82, 32, 48), WHITE, { b: 1 });
    part(buf, P.rect(198, 86, 24, 44), C.grey, { b: 3 });
    part(buf, P.rect(201, 90, 18, 16), C.grey, { b: 3, sh: 1, hi: 1 });
    part(buf, P.rect(201, 110, 18, 16), C.grey, { b: 3, sh: 1, hi: 1 });
    part(buf, P.ell(219, 108, 1.4, 1.4), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(230, 90, 32, 22), C.cream, { b: 4 });
    part(buf, P.rect(232, 92, 28, 18), C.cream, { b: 4, sh: 0, hi: 0, ol: C.red[3] });
    textOn(buf, 'НЕ', 241, 93, C.red[2], 0);
    textOn(buf, 'КЛЕЙ', 235, 101, C.red[2], 0);
    part(buf, P.rect(414, 62, 38, 9), C.red, { b: 2 });
    textOn(buf, 'ТЕЛЕФ.', 417, 63, C.gold[4], 0);
    part(buf, P.rect(416, 70, 34, 62), C.blue, { b: 2 });
    const booth = P.rect(420, 74, 26, 54);
    grad(buf, booth, C.sky, (x, y) => 0.5 + (y - 74) / 140 + (hash(x, y, 4) - 0.5) * 0.08);
    S.outerLine(buf, booth, C.black);
    part(buf, P.rect(427, 86, 12, 20), C.grey, { b: 1 });
    part(buf, P.rect(429, 89, 8, 5), C.grey, { b: 4, sh: 0, hi: 0 });
    for (let i = 0; i < 6; i++) buf.set(430 + (i % 3) * 3, 97 + Math.floor(i / 3) * 3, C.grey[4]);
    part(buf, P.cap(441, 88, 441, 100, 1.6), C.grey, { b: 0, sh: 0 });
    line(buf, 433, 74, 433, 128, C.blue[1]);
    for (const [x, w] of [[152, 40], [232, 26], [404, 12], [452, 58]]) {
      for (let k = 0; k < w; k += 9) part(buf, P.ell(x + k + 4, 124, 7, 6), C.green, { b: 2, sh: 1, hi: 1 });
    }
    const lawn = P.rect(0, 130, W, 70);
    grad(buf, lawn, C.green, (x, y) => 0.42 + (y - 130) / 300 + (Math.floor((x + y * 1.6) / 26) % 2 ? 0.07 : 0) + (hash(x >> 1, y >> 1, 5) - 0.5) * 0.06);
    part(buf, P.poly([286, 138, 374, 138, 404, 200, 266, 200]), C.sand, { b: 3, sh: 0, hi: 0 });
    for (let i = 0; i < 60; i++) { const x = 270 + hash(i, 9, 1) * 130, y = 140 + hash(i, 9, 2) * 58; if (buf.get(Math.round(x), Math.round(y)) === C.sand[3]) buf.set(Math.round(x), Math.round(y), C.sand[hash(i, 9, 3) > 0.5 ? 2 : 4]); }
    part(buf, P.poly([0, 152, 140, 152, 150, 200, 0, 200]), C.asphalt, { b: 2, sh: 0, hi: 0 });
    line(buf, 0, 152, 140, 152, C.stone[3]);
    part(buf, P.ell(210, 181, 60, 13), C.stone, { b: 3 });
    const water = P.ell(210, 181, 56, 10.5);
    grad(buf, water, C.teal, (x, y) => 0.45 + (y - 170) / 40 + (hash(x >> 2, y, 6) < 0.2 ? 0.15 : 0));
    S.outline(buf, water, C.black);
    for (let i = 0; i < 5; i++) line(buf, 176 + i * 16, 178 + (i % 2) * 5, 184 + i * 16, 178 + (i % 2) * 5, C.teal[4]);
    part(buf, P.rect(470, 114, 2, 24), C.grey, { b: 2, sh: 0 });
    part(buf, P.rect(457, 103, 28, 14), C.yellow, { b: 3 });
    textOn(buf, 'СЛУГ', 460, 106, C.black, 0);
    for (let k = 0; k < 9; k++) part(buf, P.ell(500 + k * 17, 128, 10, 8), C.green, { b: 1 + (k % 2), sh: 1, hi: 1 });
    for (const [x, c] of [[176, C.red[3]], [188, C.yellow[4]], [244, C.pink[3]], [412, C.red[3]], [470, C.yellow[4]], [492, C.pink[3]]]) { buf.set(x, 127, c); buf.set(x + 3, 125, c); buf.set(x + 6, 128, c); }
    dropShadow(buf, 330, 139, 90, 4, 1);
    pool(buf, 330, 100, 40, 40, 0.5);
    vignette(buf, 0.3, 320, 110);
  };

  Object.assign(L, {
    lawn: {
      desoto: () => S.LAYERS.street.desoto(),
      mailbox: () => sprite(26, 32, P => {
        P.part(P.poly([10, 30, 13, 16, 17, 16, 15, 30]), C.grey, { b: 1, sh: 0 });
        P.part(P.path('M 2 18 L 5 6 Q 14 -2 22 8 L 23 20 Z'), C.blue, { b: 2 });
        P.part(P.rect(8, 10, 10, 2), C.grey, { b: 0, sh: 0, hi: 0 });
        P.line(4, 19, 22, 21, C.blue[0]);
        textOn(P.b, 'US', 9, 13, C.grey[5], 0);
      }),
      nofeed: () => sprite(24, 24, (P, b) => {
        P.part(P.rect(10, 12, 3, 12), C.wood, { b: 2, sh: 0 });
        P.part(P.rect(0, 0, 24, 14), C.plum, { b: 3 });
        textOn(b, 'НЕ', 7, 0, C.grey[5], 0);
        P.part(P.cap(5, 10, 17, 10, 1.6), C.grey, { b: 4, sh: 0 });
        P.line(12, 8, 12, 6, C.grey[4]);
        P.line(12, 6, 14, 6, C.grey[4]);
      }),
      golf: () => sprite(14, 32, P => {
        P.part(P.rect(3, 2, 1.6, 30), C.grey, { b: 5, sh: 0 });
        P.part(P.poly([5, 2, 13, 5, 5, 9]), C.red, { b: 3 });
        S.font.draw(P.b, '9', 6, 3, C.grey[5], 0);
      }),
      periscope: g => sprite(10, 18, P => {
        const k = g ? Math.floor(g.time * 0.7) % 2 : 0;
        P.part(P.rect(3, 4, 3, 14), C.grey, { b: 2, sh: 0 });
        P.part(P.rect(k ? 3 : 0, 0, 7, 5), C.grey, { b: 2 });
        P.px(k ? 8 : 1, 2, C.sky[4]);
      }),
      stage: g => sprite(136, 54, (Q, b) => {
        const P = new Pen(b).at(0, 14, 1);
        const wreck = g && g.f.rampage;
        P.part(P.poly([2, 10, 132, 8, 136, 18, 0, 20]), C.wood, { b: 3 });
        P.part(P.poly([0, 20, 136, 18, 136, 40, 0, 40]), C.blue, { b: 2 });
        bunting(P, 2, 134, 20, 6);
        if (wreck) {
          P.part(P.ell(40, 13, 15, 4.6), C.night, { b: 0, sh: 0, hi: 0 });
          P.part(P.ell(66, 14, 15, 4.6), C.night, { b: 0, sh: 0, hi: 0 });
          P.part(P.poly([86, 10, 100, -6, 106, 10]), C.wood, { b: 2 });
          P.part(P.poly([104, 12, 118, 4, 124, 13]), C.wood, { b: 3 });
          return;
        }
        P.part(P.poly([38, 12, 62, 12, 60, -4, 40, -4]), C.wood, { b: 2 });
        P.part(P.rect(44, 0, 12, 8), C.blue, { b: 3, sh: 0, hi: 0 });
        P.px(50, 4, C.gold[4]);
        P.line(44, -4, 42, -10, C.grey[1]);
        P.line(56, -4, 58, -10, C.grey[1]);
        P.part(P.ell(42, -11, 1.6, 2), C.grey, { b: 3, sh: 0 });
        P.part(P.ell(58, -11, 1.6, 2), C.grey, { b: 3, sh: 0 });
      }),
      cuestand: g => sprite(30, 46, (P, b) => {
        const top = g ? g.f.cards[0] : 'life';
        P.line(8, 46, 15, 22, C.grey[1]);
        P.line(22, 46, 15, 22, C.grey[1]);
        P.line(15, 22, 15, 44, C.grey[1]);
        P.part(P.rect(2, 3, 27, 21), C.grey, { b: 4 });
        P.part(P.rect(0, 0, 27, 21), top === 'delivery' ? C.cream : top === 'poster' ? C.olive : top === 'nofeed' ? C.plum : C.grey, { b: top === 'poster' || top === 'nofeed' ? 3 : top === 'delivery' ? 4 : 5 });
        const ink = top === 'poster' || top === 'nofeed' ? C.grey[5] : C.grey[1];
        for (let i = 0; i < 4; i++) P.line(3, 4 + i * 4, top === 'life' ? 23 : 12 + ((i * 7) % 11), 4 + i * 4, ink);
        if (top === 'delivery') for (let i = 0; i < 6; i++) P.px(2 + i * 4.4, 18, C.cycle[i]);
        if (top === 'nofeed') P.part(P.cap(7, 16, 19, 16, 1.6), C.grey, { b: 4, sh: 0 });
        if (top === 'poster') P.part(P.ell(20, 14, 3, 3), C.skin, { b: 3, sh: 0 });
      }),
      flyers: () => sprite(18, 10, P => {
        for (let i = 0; i < 3; i++) P.part(P.rect(1 + i, 5 - i * 2, 14, 4), C.cream, { b: 4, sh: 0 });
        P.part(P.rect(5, 1, 6, 2), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      }),
      poll: g => sprite(52, 44, (P, b) => {
        const p = g ? E.poll(g) : { lin: 80, max: 5, none: 15 };
        P.part(P.rect(24, 30, 4, 14), C.grey, { b: 1, sh: 0 });
        P.part(P.rect(0, 0, 52, 32), C.grey, { b: 1 });
        P.part(P.rect(2, 2, 48, 28), C.night, { b: 0, sh: 0, hi: 0 });
        [['ЭЙБ', p.lin, C.sand[4]], ['МАКС', p.max, C.grey[5]], ['НИКТО', p.none, C.yellow[3]]].forEach(([name, n, col], i) => {
          S.font.draw(b, name, 4, 3 + i * 9, col, 0);
          S.font.draw(b, String(n), 48 - S.font.measure(String(n)), 3 + i * 9, col, 0);
        });
      }),
      steps: () => sprite(64, 20, P => {
        for (const [x, y] of [[0, 8], [36, 0]]) {
          P.part(P.ell(x + 12, y + 6, 12, 5), C.green, { b: 0, sh: 0, hi: 0 });
          P.part(P.ell(x + 12, y + 5, 10, 3.6), C.olive, { b: 1, sh: 0, hi: 0, ol: 0 });
        }
      })
    }
  });

  function rivets(buf, x0, y0, x1, y1, step) {
    for (let y = y0; y <= y1; y += step) for (let x = x0; x <= x1; x += step) buf.set(x, y, C.stone[4]);
  }

  BG.oval = function (buf) {
    const P = new Pen(buf);
    const W = 480;
    const wall = P.rect(0, 0, W, 130);
    vgrad(buf, wall, C.cream, 0, 130, 0.62, 0.82);
    wall.each((x, y) => { if ((x + 1000) % 24 === 0 && y > 10 && y < 104) buf.set(x, y, C.cream[2]); });
    part(buf, P.rect(0, 0, W, 9), C.cream, { b: 4, sh: 0, hi: 0 });
    line(buf, 0, 9, W, 9, C.cream[1]);
    for (let x = 4; x < W; x += 10) buf.set(x, 5, C.cream[2]);
    part(buf, P.rect(0, 104, W, 24), C.cream, { b: 3, sh: 0, hi: 1 });
    for (let x = 6; x < W; x += 30) part(buf, P.rect(x, 108, 22, 16), C.cream, { b: 3, sh: 1, hi: 1 });
    part(buf, P.rect(0, 126, W, 5), C.oak, { b: 2, sh: 0, hi: 1 });
    part(buf, P.rect(188, 12, 154, 12), C.gold, { b: 2 });
    for (let x = 192; x < 340; x += 10) part(buf, P.path(`M ${x} 24 Q ${x + 5} 31 ${x + 10} 24 Z`), C.gold, { b: 2, sh: 0 });
    for (const x of [198, 246, 294]) {
      part(buf, P.rect(x - 3, 24, 44, 84), WHITE, { b: 2 });
      const glass = P.rect(x, 27, 38, 78);
      grad(buf, glass, C.sky, (px, py) => 0.35 + (py - 27) / 110);
      const green = P.rect(x, 82, 38, 23);
      grad(buf, green, C.green, (px, py) => 0.35 + (hash(px >> 1, py >> 1, 3) - 0.5) * 0.3);
      part(buf, P.ell(x + 12, 80, 9, 7), C.green, { b: 1, sh: 0, hi: 1, ol: 0 });
      part(buf, P.ell(x + 28, 83, 8, 6), C.green, { b: 2, sh: 0, hi: 1, ol: 0 });
      line(buf, x + 19, 27, x + 19, 105, C.grey[4]);
      line(buf, x, 52, x + 38, 52, C.grey[4]);
      line(buf, x, 78, x + 38, 78, C.grey[4]);
      S.outerLine(buf, glass, C.black);
    }
    for (const [x, d] of [[188, 1], [342, -1]]) {
      part(buf, P.path(`M ${x} 22 L ${x + d * 12} 22 Q ${x + d * 7} 70 ${x + d * 5} 126 L ${x} 126 Z`), C.gold, { b: 2 });
      for (let i = 1; i < 3; i++) line(buf, x + d * i * 4, 24, x + d * i * 2, 124, C.gold[1]);
    }
    line(buf, 180, 30, 180, 128, C.gold[2]);
    part(buf, P.ell(180, 29, 1.8, 1.8), C.gold, { b: 4, sh: 0 });
    part(buf, P.path('M 181 32 L 187 34 Q 186 70 183 98 L 177 96 Q 175 60 181 32 Z'), C.blue, { b: 2 });
    for (let i = 0; i < 4; i++) buf.set(181, 46 + i * 12, C.gold[4]);
    line(buf, 350, 30, 350, 128, C.gold[2]);
    part(buf, P.ell(350, 29, 1.8, 1.8), C.gold, { b: 4, sh: 0 });
    usFlag(buf, P.part(P.path('M 344 32 L 351 34 Q 354 66 353 98 L 346 96 Q 342 60 344 32 Z'), C.red, { b: 3 }), 340, 32);
    part(buf, P.rect(2, 28, 40, 102), WHITE, { b: 1 });
    part(buf, P.rect(5, 31, 34, 99), WHITE, { b: 2 });
    part(buf, P.rect(9, 36, 26, 40), WHITE, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(9, 82, 26, 42), WHITE, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(35, 80, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(56, 22, 40, 50), C.gold, { b: 3 });
    const pic = P.rect(60, 26, 32, 42);
    vgrad(buf, pic, C.wood, 26, 68, 0.1, 0.5);
    part(buf, P.path('M 64 68 Q 66 52 76 50 Q 86 52 88 68 Z'), C.navy, { b: 1 });
    part(buf, P.poly([73, 52, 79, 52, 76, 60]), C.grey, { b: 5, sh: 0, hi: 0 });
    part(buf, P.ell(76, 43, 5.4, 6.4), C.skin, { b: 3 });
    part(buf, P.path('M 69 44 Q 68 33 76 33 Q 84 33 83 44 Q 86 46 85 50 Q 82 46 82 41 Q 76 38 70 41 Q 70 46 67 50 Q 66 46 69 44 Z'), C.grey, { b: 5 });
    buf.set(74, 43, C.pupil); buf.set(78, 43, C.pupil);
    line(buf, 74, 47, 78, 47, C.skin[1]);
    part(buf, P.rect(106, 98, 24, 32), C.stone, { b: 3 });
    part(buf, P.rect(103, 96, 30, 4), C.stone, { b: 4, sh: 0 });
    part(buf, P.ell(118, 86, 6, 9), C.gold, { b: 2 });
    part(buf, P.path('M 113 84 Q 100 76 98 62 Q 106 68 114 72 Z'), C.gold, { b: 3 });
    part(buf, P.path('M 123 84 Q 136 76 138 62 Q 130 68 122 72 Z'), C.gold, { b: 3 });
    part(buf, P.ell(118, 73, 3.4, 3.6), C.grey, { b: 5 });
    part(buf, P.poly([120, 73, 124, 74.4, 120, 75.6]), C.gold, { b: 4, sh: 0, hi: 0 });
    buf.set(118, 72, C.pupil);
    part(buf, P.poly([108, 93, 114, 92, 114, 94, 111, 95, 111, 97, 108, 97]), C.grey, { b: 1, sh: 0 });
    part(buf, P.rect(122, 92, 7, 5), C.green, { b: 3, sh: 0 });
    buf.set(125, 94, C.green[0]);
    part(buf, P.rect(400, 36, 32, 94), C.oak, { b: 2 });
    part(buf, P.rect(404, 40, 24, 90), C.oak, { b: 3 });
    part(buf, P.rect(407, 58, 18, 28), C.oak, { b: 3, sh: 1, hi: 1 });
    part(buf, P.rect(407, 92, 18, 32), C.oak, { b: 3, sh: 1, hi: 1 });
    part(buf, P.rect(408, 43, 16, 10), C.grey, { b: 5 });
    textOn(buf, 'WC', 410, 44, C.blue[2], 0);
    part(buf, P.ell(407, 90, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(436, 28, 42, 102), C.stone, { b: 1 });
    const steel = P.rect(440, 32, 36, 98);
    part(buf, steel, C.stone, { b: 2 });
    rivets(buf, 443, 36, 473, 126, 10);
    steel.each((x, y) => { if (y >= 76 && y < 84) buf.set(x, y, Math.floor((x + y) / 5) % 2 ? C.yellow[3] : C.night[1]); });
    part(buf, P.rect(442, 96, 6, 12), C.grey, { b: 4 });
    part(buf, P.rect(432, 4, 48, 22), C.red, { b: 2 });
    textOn(buf, 'ВОЕННАЯ', 435, 6, C.gold[4], 0);
    textOn(buf, 'КОМНАТА', 435, 15, C.gold[4], 0);
    const floor = P.rect(0, 131, W, 69);
    grad(buf, floor, C.blue, (x, y) => 0.3 + (y - 131) / 260 + (hash(x >> 1, y >> 1, 8) - 0.5) * 0.05);
    part(buf, P.rect(0, 131, W, 3), C.blue, { b: 1, sh: 0, hi: 0, ol: 0 });
    for (let x = 12; x < W; x += 22) { buf.set(x, 140, C.gold[3]); buf.set(x + 11, 194, C.gold[3]); }
    const seal = P.ell(240, 176, 84, 19);
    part(buf, seal, C.gold, { b: 2 });
    part(buf, P.ell(240, 176, 76, 16), C.blue, { b: 2, sh: 0, hi: 0, ol: C.gold[1] });
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; buf.set(Math.round(240 + Math.cos(a) * 66), Math.round(176 + Math.sin(a) * 13), C.grey[5]); }
    part(buf, P.path('M 240 168 Q 222 164 212 172 Q 226 172 234 178 L 236 184 L 244 184 L 246 178 Q 254 172 268 172 Q 258 164 240 168 Z'), C.gold, { b: 3, sh: 0 });
    part(buf, P.ell(240, 170, 2.6, 2.4), C.grey, { b: 5, sh: 0 });
    for (const x of [217, 265, 313]) pool(buf, x, 150, 26, 16, 0.5);
    dropShadow(buf, 118, 131, 18, 3);
    vignette(buf, 0.55, 240, 110);
  };

  function calendarArt(P, b, today, w, h) {
    P.part(P.rect(0, 0, w, h), C.grey, { b: 5 });
    P.part(P.rect(0, 0, w, 9), C.red, { b: 3, sh: 0, hi: 0 });
    textOn(b, 'АПРЕЛЬ', P.X(Math.floor((w - S.font.measure('АПРЕЛЬ')) / 2)), P.Y(1), C.grey[5], 0);
    const cw = (w - 2) / 7, ch = (h - 11) / 5;
    for (let d = 1; d <= 30; d++) {
      const col = (d - 1) % 7, row = Math.floor((d - 1) / 7);
      const x = 1 + col * cw, y = 10 + row * ch;
      if (d === today) P.part(P.rect(x, y, cw - 0.4, ch - 0.4), C.yellow, { b: 3, sh: 0, hi: 0 });
      else b.set(Math.round(x + cw / 2), Math.round(y + ch / 2), E.HOLIDAYS[d] ? C.red[3] : C.grey[2]);
    }
  }

  Object.assign(L, {
    oval: {
      chair: g => sprite(60, 78, P => {
        P.part(P.path('M 6 76 L 3 22 Q 3 2 30 2 Q 57 2 57 22 L 54 76 Z'), C.red, { b: 2 });
        P.part(P.path('M 10 72 L 8 24 Q 8 8 30 8 Q 52 8 52 24 L 50 72 Z'), C.red, { b: 3, sh: 1, hi: 1 });
        for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) P.px(16 + k * 14, 18 + i * 13, C.red[1]);
      }),
      desk: g => sprite(136, 50, (P, b) => {
        const f = g ? g.f : {};
        P.part(P.poly([6, 4, 130, 2, 136, 14, 0, 16]), C.wood, { b: 3 });
        P.part(P.poly([0, 16, 136, 14, 136, 50, 0, 50]), C.wood, { b: 2 });
        for (const x of [6, 50, 94]) P.part(P.rect(x, 20, 38, 26), C.wood, { b: 2, sh: 1, hi: 1 });
        P.part(P.ell(69, 32, 9, 8), C.wood, { b: 3, sh: 1, hi: 1 });
        P.part(P.path('M 69 28 Q 62 26 59 30 Q 64 30 67 33 L 71 33 Q 74 30 79 30 Q 76 26 69 28 Z'), C.gold, { b: 3, sh: 0 });
        P.part(P.rect(106, 3, 14, 7), C.night, { b: 2 });
        P.part(P.cap(107, 2, 119, 2, 1.8), C.night, { b: 2 });
        P.px(112, 6, C.neonA);
        P.part(P.poly([56, 5, 78, 4, 80, 11, 58, 12]), C.green, { b: 1 });
        P.part(P.poly([58, 6, 76, 5, 77, 9, 59, 10]), C.green, { b: 2, sh: 0, hi: 0, ol: 0 });
        P.px(67, 7, C.gold[4]); P.px(69, 7, C.gold[4]);
        P.part(P.rect(36, 6, 12, 5), C.grey, { b: 5, sh: 0 });
        if (!f.ribbonTaken) {
          P.part(P.ell(20, 8, 3.6, 3), C.red, { b: 3 });
          P.part(P.poly([17, 9, 20, 9, 18, 14, 15, 13]), C.red, { b: 2, sh: 0 });
          P.part(P.poly([20, 9, 23, 9, 25, 13, 22, 14]), C.red, { b: 2, sh: 0 });
        }
        P.part(P.rect(86, 7, 14, 4), C.gold, { b: 3, sh: 0 });
      }),
      globe: g => sprite(36, 50, P => {
        const open = g && g.f.globeOpen;
        P.part(P.rect(16, 30, 4, 16), C.wood, { b: 2, sh: 0 });
        P.part(P.ell(18, 47, 11, 3), C.wood, { b: 2 });
        if (open) {
          P.part(P.path('M 3 22 Q 3 36 18 36 Q 33 36 33 22 Z'), C.sky, { b: 2 });
          P.part(P.ell(18, 22, 15, 4), C.night, { b: 1, sh: 0 });
          for (const x of [10, 16, 22, 27]) { P.part(P.rect(x, 14, 4.4, 8), C.orange, { b: 3 }); P.part(P.rect(x + 0.6, 13, 3.2, 1.6), C.grey, { b: 4, sh: 0, hi: 0 }); }
          P.part(P.path('M 3 20 Q 0 6 12 2 Q 8 12 6 21 Z'), C.sky, { b: 3 });
          return;
        }
        P.part(P.ell(18, 20, 15, 15), C.sky, { b: 2 });
        P.part(P.path('M 8 12 Q 14 8 17 14 Q 19 20 13 24 Q 8 22 8 12 Z'), C.green, { b: 3, sh: 0 });
        P.part(P.path('M 21 16 Q 27 14 28 21 Q 26 28 22 26 Z'), C.green, { b: 3, sh: 0 });
        P.curve('M 4 20 Q 18 25 32 20', C.sky[0]);
        P.curve('M 18 5 Q 24 20 18 35', C.sky[0]);
      }),
      easel: g => sprite(44, 78, (P, b) => {
        P.line(8, 78, 20, 8, C.wood[1]);
        P.line(36, 78, 24, 8, C.wood[1]);
        P.line(22, 8, 22, 70, C.wood[1]);
        const Q = new Pen(b).at(2, 8, 1);
        calendarArt(Q, b, g ? g.f.today : 12, 40, 44);
        P.part(P.rect(2, 52, 40, 3), C.wood, { b: 2, sh: 0 });
      }),
      head: () => sprite(30, 30, (P, b) => {
        A.presHead(new Pen(b).at(15, 17, 0.85), 0, 0, { v: 'dead' });
        P.part(P.rect(12, 26, 6, 3), C.oak, { b: 3, sh: 0 });
      })
    }
  });

  S.art104bg = { tree, pane, usFlag, bunting, obelisk, calendarArt, WHITE };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
