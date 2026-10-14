(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade, line, hash } = S;
  const BG = S.BG;
  const E = S.EP106;
  const L = E.LAYERS;
  const A = S.art106;
  const { vgrad, pool, textOn, sprite, dropShadow, vignette, lineIn } = BG;
  const { LAMP, GLOW, BOW, NEON_R } = A;

  const lay = (room, arts) => { L[room] = Object.assign(L[room] || {}, arts); };
  const flat = (buf, m, c) => part(buf, m, c, { b: 0, sh: 0, hi: 0, ol: 0 });

  function crater(buf, P, x, y, rx, ry) {
    part(buf, P.ell(x, y, rx, ry), C.stone, { b: 1, sh: 0, hi: 0, ol: 0 });
    part(buf, P.ell(x, y + ry * 0.24, rx * 0.84, ry * 0.7), C.stone, { b: 2, sh: 0, hi: 0, ol: 0 });
    P.curve(`M ${x - rx} ${y} Q ${x} ${y - ry * 1.5} ${x + rx} ${y}`, C.stone[4]);
  }

  function tube(buf, P, x, w, h) {
    const m = P.rect(x, 0, w, h);
    grad(buf, m, C.sky, (px) => 0.5 + Math.sin((px - x) / w * Math.PI) * 0.45);
    for (let y = 8; y < h - 8; y += 12) {
      const r = BOW[Math.floor(y / 12) % 7];
      for (let px = x; px < x + w; px++) { const dy = Math.round(Math.sin((px - x) / w * Math.PI) * 3); buf.set(px, y + dy, r[3]); buf.set(px, y + dy + 1, r[2]); }
    }
    line(buf, x, 0, x, h, C.black); line(buf, x + w, 0, x + w, h, C.black);
    line(buf, x + 3, 0, x + 3, h, C.sky[4]);
    part(buf, P.rect(x - 4, h - 6, w + 8, 8), C.gold, { b: 2 });
    part(buf, P.path(`M ${x + 8} ${h - 6} L ${x + 8} ${h - 44} Q ${x + w / 2} ${h - 58} ${x + w - 8} ${h - 44} L ${x + w - 8} ${h - 6} Z`), C.night, { b: 2, sh: 0, hi: 0 });
  }

  function tiles(buf, m, vx, vy, y0, size, a, b) {
    m.each((x, y) => {
      const k = (y - vy) / (200 - vy);
      const u = Math.floor(((x - vx) / k + 8000) / size), v = Math.floor(Math.log(y - y0) * 5.4);
      buf.set(x, y, (u + v) % 2 ? a : b);
    });
  }

  BG.moon6 = function (buf) {
    const P = new Pen(buf);
    const sky = P.rect(0, 0, 640, 132);
    flat(buf, sky, C.night);
    A.stars(buf, sky, 6, 190);
    for (const [x, y, w, h] of [[34, 124, 40, 18], [250, 121, 56, 14], [420, 122, 44, 20]]) part(buf, P.poly([x, y, x + w * 0.4, y - h, x + w * 0.62, y - h * 0.5, x + w, y]), C.stone, { b: 2, sh: 0, hi: 0, ol: 0 });
    const ground = P.path('M 0 124 Q 70 114 150 121 Q 230 128 300 118 Q 380 110 470 120 Q 560 128 640 116 L 640 200 L 0 200 Z');
    grad(buf, ground, C.stone, (x, y) => 0.8 - (y - 116) / 170 + (hash(x >> 1, y >> 1, 12) - 0.5) * 0.14);
    ground.each((x, y) => { if (!ground.has(x, y - 1)) buf.set(x, y, C.stone[4]); });
    for (const [x, y, rx, ry] of [[60, 136, 14, 3], [126, 143, 8, 2], [290, 184, 24, 5], [430, 190, 26, 5], [536, 186, 16, 4], [330, 140, 7, 1.6]]) crater(buf, P, x, y, rx, ry);
    part(buf, P.ell(230, 150, 25, 4), C.stone, { b: 0, sh: 0, hi: 0, ol: 0 });
    for (const [x, y] of [[170, 172], [176, 177]]) part(buf, P.ell(x, y, 3, 1.4), C.stone, { b: 1, sh: 0, hi: 0, ol: 0 });

    const vc = P.path('M 306 148 L 306 86 Q 306 64 328 64 L 418 64 Q 440 64 440 86 L 440 148 Z');
    part(buf, vc, C.grey, { b: 4 });
    for (let x = 328; x < 440; x += 22) lineIn(buf, vc, x, 66, x, 147, C.grey[3]);
    BOW.forEach((r, i) => lineIn(buf, vc, 307, 126 + i, 439, 126 + i, r[3]));
    part(buf, P.rect(310, 68, 126, 12), C.purple, { b: 2 });
    textOn(buf, 'ЦЕНТР ДЛЯ ПОСЕТИТЕЛЕЙ', 313, 70, C.lamp, 0);
    part(buf, P.path('M 352 148 L 352 96 Q 352 86 362 86 L 376 86 Q 386 86 386 96 L 386 148 Z'), C.grey, { b: 2 });
    part(buf, P.rect(356, 92, 26, 40), C.night, { b: 2, sh: 0, hi: 0 });
    A.rainbow(P, 369, 122, 9, 1.2);
    part(buf, P.ell(382, 138, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    BG.windowPane(P, 400, 92, 30, 24, { frame: C.grey, lit: true });
    for (const x of [406, 416, 425]) part(buf, P.ell(x, 111, 3, 3.4), C.sky, { b: 3, sh: 0 });
    part(buf, P.rect(318, 90, 26, 30), C.night, { b: 1 });
    A.earth(P, 331, 101, 7, {});
    textOn(buf, '$', 328, 110, C.lamp, 0);
    dropShadow(buf, 373, 150, 72, 4);

    part(buf, P.rect(456, 24, 3, 126), C.grey, { b: 2, sh: 0 });
    part(buf, P.rect(464, 24, 3, 126), C.grey, { b: 1, sh: 0 });
    for (let y = 30; y < 146; y += 12) { line(buf, 458, y, 464, y + 10, C.grey[3]); line(buf, 464, y, 458, y + 10, C.grey[2]); }
    part(buf, P.rect(452, 146, 20, 5), C.grey, { b: 1 });
    part(buf, P.ell(456, 18, 9, 6, -0.6), C.grey, { b: 4 });
    part(buf, P.ell(454, 17, 5, 3, -0.6), C.grey, { b: 5, sh: 0, hi: 0, ol: C.grey[3] });
    line(buf, 454, 17, 445, 9, C.grey[1]);
    part(buf, P.ell(444, 8, 2.2, 2.2), NEON_R, { b: 3, sh: 0, hi: 0 });

    const dome = P.ell(586, 150, 116, 108).and(P.rect(464, 30, 190, 120));
    grad(buf, dome, [C.night[1], C.night[2], C.night[3], C.lilac[1], C.lilac[2]], (x, y) => (y - 42) / 124 + (hash(x >> 1, y >> 1, 3) - 0.5) * 0.12);
    for (let k = -3; k <= 3; k++) { const pts = S.flattenPath(`M 586 43 Q ${586 + k * 42} 84 ${586 + k * 35} 150`)[0]; for (let i = 2; i < pts.length; i += 2) lineIn(buf, dome, pts[i - 2], pts[i - 1], pts[i], pts[i + 1], C.lilac[3]); }
    for (const y of [78, 112]) { const pts = S.flattenPath(`M 470 ${y + 10} Q 586 ${y - 14} 702 ${y + 10}`)[0]; for (let i = 2; i < pts.length; i += 2) lineIn(buf, dome, pts[i - 2], pts[i - 1], pts[i], pts[i + 1], C.lilac[3]); }
    S.outline(buf, dome, C.lilac[4]);
    A.rainbow(P, 520, 138, 16, 2);
    part(buf, P.rect(468, 138, 172, 12), C.grey, { b: 4 });
    BOW.forEach((r, i) => line(buf, 469, 141 + i, 640, 141 + i, r[3]));
    A.rainbow(P, 589, 102, 21, 1.2);
    part(buf, P.path('M 572 148 L 572 102 Q 572 86 589 86 Q 606 86 606 102 L 606 148 Z'), C.grey, { b: 3 });
    part(buf, P.path('M 576 148 L 576 104 Q 576 91 589 91 Q 602 91 602 104 L 602 148 Z'), C.night, { b: 1, sh: 0 });
    part(buf, P.ell(589, 112, 6, 6), C.sky, { b: 2, sh: 0 });
    part(buf, P.rect(488, 120, 3, 28), C.grey, { b: 2, sh: 0 });
    part(buf, P.rect(554, 120, 3, 28), C.grey, { b: 2, sh: 0 });
    part(buf, P.rect(482, 108, 80, 13), C.purple, { b: 2 });
    textOn(buf, 'ПУЗЫРЬ ПОКОЯ', 487, 111, C.lamp, 0);
    dropShadow(buf, 560, 151, 80, 4);

    for (const [x, y, w] of [[300, 196, 30], [606, 194, 40], [4, 188, 18]]) part(buf, P.poly([x, y + 8, x + w * 0.2, y - 6, x + w * 0.6, y - 9, x + w, y + 8]), C.stone, { b: 2 });
  };

  lay('moon', {
    desoto: () => S.LAYERS.street.desoto(),
    lander: g => A.landerSprite({ open: !!(g && g.f.landerOpen), fire: !!(g && g.vt.fireT && g.time < g.vt.fireT), k: g ? Math.floor(g.time * 10) % 4 : 0 }),
    earth: g => sprite(72, 64, P => {
      const bl = !!(g && E.blissed(g));
      A.earth(P, 36, 38, 22, { bliss: bl, ring: bl, k: g ? Math.floor(g.time * 4) % 8 : 0, max: !!(g && g.f.boiled) });
    }),
    caseUnder: g => sprite(24, 24, P => A.caseArt(P, 12, 20, !!(g && g.f.caseBroken))),
    spoontal: g => sprite(14, 16, P => {
      A.talisman(P, 7, 10, 'spoon', 4);
      if (g && Math.floor(g.time * 3) % 2) { P.px(12, 3, C.eye); P.px(11, 4, C.lamp); }
    }),
    flag: () => sprite(26, 42, P => {
      P.part(P.rect(2, 2, 2, 40), C.grey, { b: 4, sh: 0 });
      P.part(P.rect(4, 3, 20, 13), C.grey, { b: 5 });
      for (let i = 0; i < 4; i++) P.line(5, 5 + i * 3, 22, 5 + i * 3, C.red[3]);
      P.part(P.rect(5, 4, 8, 6), C.blue, { b: 2, sh: 0, hi: 0, ol: 0 });
    }),
    wreck: () => sprite(60, 34, P => A.satellite(P, 30, 30, true))
  });

  BG.shop6 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 128);
    vgrad(buf, wall, C.grey, 0, 128, 0.98, 0.74);
    for (let x = 52; x < 320; x += 54) line(buf, x, 8, x, 124, C.grey[3]);
    part(buf, P.rect(0, 0, 320, 8), C.lilac, { b: 3, sh: 0, hi: 0 });
    for (const lx of [90, 230]) { part(buf, P.rect(lx, 8, 44, 4), C.grey, { b: 4, sh: 0 }); part(buf, P.rect(lx + 2, 10, 40, 3), LAMP, { sh: 0, hi: 0 }); }
    BOW.forEach((r, i) => line(buf, 0, 112 + i, 320, 112 + i, r[3]));
    const floor = P.rect(0, 126, 320, 74);
    tiles(buf, floor, 160, 40, 112, 30, C.lilac[4], C.grey[5]);
    shade(buf, floor, 0, (x, y) => Math.max(0, (140 - y) / 30));
    part(buf, P.rect(0, 122, 320, 5), C.lilac, { b: 2, sh: 0, hi: 1 });

    part(buf, P.rect(4, 40, 40, 108), C.grey, { b: 2 });
    const glass = P.rect(9, 46, 30, 46);
    flat(buf, glass, C.night);
    A.stars(buf, glass, 3, 9);
    S.outerLine(buf, glass, C.black);
    textOn(buf, 'ВЫХОД', 9, 96, C.red[4], C.black);
    part(buf, P.rect(36, 108, 4, 8), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(46, 30, 6, 120), C.stone, { b: 3 });
    part(buf, P.rect(0, 25, 52, 7), C.stone, { b: 3 });
    part(buf, P.ell(25, 28, 2.4, 2.2), C.red, { b: 1, sh: 0 });

    part(buf, P.rect(58, 18, 94, 70), C.lilac, { b: 3 });
    const win = P.rect(62, 22, 86, 62);
    flat(buf, win, C.night);
    A.stars(buf, win, 9, 30);
    part(buf, P.path('M 62 72 Q 100 64 148 70 L 148 84 L 62 84 Z'), C.stone, { b: 3, sh: 0, hi: 0, ol: 0 });
    A.earth(P, 126, 42, 9, {});
    S.outerLine(buf, win, C.black);
    line(buf, 105, 22, 105, 83, C.lilac[1]);

    part(buf, P.rect(56, 100, 96, 6), C.lilac, { b: 4 });
    part(buf, P.rect(58, 106, 92, 21), C.lilac, { b: 2 });
    for (const x of [66, 82, 98]) A.uni(P.scaled(x, 100, 0.56), x, 100, C.yellow);
    for (const x of [118, 131, 144]) { part(buf, P.ell(x, 94, 5, 5), C.sky, { b: 3 }); part(buf, P.rect(x - 4, 97, 8, 3), C.oak, { b: 2, sh: 0 }); buf.set(x - 1, 93, C.eye); buf.set(x + 2, 95, C.eye); }
    part(buf, P.rect(60, 109, 46, 10), C.cream, { b: 4, sh: 0 });
    textOn(buf, 'РОГАТИК', 62, 110, C.purple[2], 0);

    part(buf, P.rect(160, 20, 52, 62), C.oak, { b: 2 });
    const post = P.rect(163, 23, 46, 44);
    flat(buf, post, C.night);
    part(buf, P.ell(173, 33, 6, 6), C.stone, { b: 4, sh: 0 });
    A.beam(buf, 177, 38, 196, 54, 0, 1.6);
    A.earth(P, 198, 56, 7, {});
    part(buf, P.rect(163, 68, 46, 11), C.cream, { b: 4, sh: 0, hi: 0 });
    textOn(buf, 'ПЛАН $5', 165, 70, C.red[2], 0);

    for (const x of [162, 190]) {
      part(buf, P.rect(x, 124, 18, 26), C.grey, { b: 4 });
      part(buf, P.rect(x - 2, 121, 22, 4), C.grey, { b: 5, sh: 0 });
      part(buf, P.rect(x + 3, 132, 12, 6), C.gold, { b: 3, sh: 0 });
      dropShadow(buf, x + 9, 151, 13, 2.4);
    }
    S.outline(buf, P.path('M 192 120 L 192 110 Q 192 103 199 103 Q 206 103 206 110 L 206 120'), C.sky[4]);

    part(buf, P.rect(232, 12, 76, 12), C.purple, { b: 2 });
    textOn(buf, 'ЭМЕТИКА', 250, 14, C.lamp, 0);
    part(buf, P.rect(224, 26, 92, 72), C.lilac, { b: 2 });
    for (let s = 0; s < 3; s++) {
      const y = 30 + s * 23;
      part(buf, P.rect(226, y + 18, 88, 3), C.lilac, { b: 1, sh: 0 });
      for (let i = 0; i < 12; i++) {
        const h = 13 + Math.floor(hash(i, s, 4) * 5);
        const x = 228 + i * 7;
        if (hash(i, s, 9) < 0.18) continue;
        part(buf, P.rect(x, y + 18 - h, 6, h), C.grey, { b: 5, sh: 0, hi: 0 });
        line(buf, x + 1, y + 21 - h, x + 4, y + 21 - h, BOW[(i + s * 2) % 7][3]);
        line(buf, x + 1, y + 23 - h, x + 4, y + 23 - h, C.purple[3]);
      }
    }
    pool(buf, 112, 12, 60, 30, 0.7);
    pool(buf, 252, 12, 60, 30, 0.7);
    pool(buf, 150, 170, 150, 36, 0.5);
    vignette(buf, 0.6);
  };

  lay('shop', {
    counter: () => sprite(104, 72, (P, b) => {
      P.part(P.poly([4, 16, 102, 12, 102, 26, 0, 30]), C.grey, { b: 5 });
      P.part(P.poly([0, 30, 102, 26, 102, 72, 0, 72]), C.lilac, { b: 3 });
      BOW.forEach((r, i) => P.line(1, 44 + i, 101, 41 + i, r[3]));
      P.part(P.poly([58, 0, 84, 0, 88, 14, 54, 16]), C.grey, { b: 2 });
      P.part(P.rect(62, 2, 18, 5), GLOW, { b: 3, sh: 0, hi: 0 });
      for (let i = 0; i < 3; i++) P.part(P.rect(14 + i * 1.4, 9 - i * 3.4, 22, 4), C.grey, { b: 5, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(16 + i * 1.4, 11 - i * 3.4, 34 + i * 1.4, 11 - i * 3.4, C.purple[3]);
      textOn(b, 'КАССА', 36, 54, C.purple[1], 0);
    }),
    case: () => sprite(24, 24, P => A.caseArt(P, 12, 20, false)),
    lamp: g => sprite(10, 8, P => {
      const on = !!(g && g.vt.alarmT && g.time < g.vt.alarmT && Math.floor(g.time * 8) % 2);
      P.part(P.ell(5, 4, 3.4, 3), on ? NEON_R : C.red, { b: on ? 3 : 1, sh: 0, hi: 0 });
    })
  });

  BG.blister6 = function (buf) {
    const P = new Pen(buf);
    const sky = P.rect(0, 0, 640, 100);
    vgrad(buf, sky, [C.night[0], C.night[0], C.night[1], C.night[2], C.lilac[1]], 0, 100, 0, 0.98);
    A.stars(buf, sky, 14, 170);
    for (let k = -8; k <= 8; k++) P.curve(`M 320 -40 Q ${320 + k * 46} 20 ${320 + k * 42} 98`, C.night[3]);
    for (const y of [20, 56]) P.curve(`M 0 ${y + 16} Q 320 ${y - 18} 640 ${y + 16}`, C.night[3]);
    const wall = P.rect(0, 96, 640, 56);
    vgrad(buf, wall, C.grey, 96, 152, 0.96, 0.74);
    for (let x = 40; x < 640; x += 60) line(buf, x, 100, x, 148, C.grey[3]);
    part(buf, P.rect(0, 94, 640, 5), C.lilac, { b: 3, sh: 0 });
    BOW.forEach((r, i) => line(buf, 0, 137 + i, 640, 137 + i, r[3]));
    const floor = P.rect(0, 150, 640, 50);
    tiles(buf, floor, 320, 96, 140, 34, C.mint[4], C.cream[4]);
    shade(buf, floor, 0, (x, y) => Math.max(0, (160 - y) / 24));
    part(buf, P.rect(0, 148, 640, 4), C.lilac, { b: 2, sh: 0, hi: 1 });

    part(buf, P.path('M 6 154 L 6 70 Q 6 50 26 50 Q 46 50 46 70 L 46 154 Z'), C.grey, { b: 3 });
    const lock = P.path('M 11 154 L 11 72 Q 11 56 26 56 Q 41 56 41 72 L 41 154 Z');
    flat(buf, lock, C.night);
    A.stars(buf, lock, 5, 12);
    S.outerLine(buf, lock, C.black);
    part(buf, P.rect(8, 36, 36, 11), C.red, { b: 2 });
    textOn(buf, 'ВЫХОД', 11, 38, C.grey[5], 0);

    part(buf, P.rect(130, 78, 22, 44), C.blue, { b: 2 });
    part(buf, P.rect(133, 81, 16, 8), C.grey, { b: 5, sh: 0, hi: 0 });
    part(buf, P.cap(134, 96, 134, 110, 2.2), C.grey, { b: 1 });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) buf.set(141 + c * 3, 95 + r * 3, C.grey[5]);
    part(buf, P.rect(140, 108, 8, 3), C.grey, { b: 0, sh: 0, hi: 0 });
    P.curve('M 134 110 Q 128 124 138 120', C.grey[1]);

    line(buf, 186, 0, 186, 36, C.grey[3]); line(buf, 270, 0, 270, 36, C.grey[3]);
    part(buf, P.rect(174, 34, 108, 25), C.night, { b: 1 });
    textOn(buf, 'КРЕСТИКИ-НОЛИКИ', 185, 37, C.neonB, 0);
    textOn(buf, 'СУДНОГО ДНЯ', 197, 47, C.neonA, 0);
    part(buf, P.ell(232, 164, 92, 9), C.purple, { b: 2, sh: 0, hi: 0 });
    part(buf, P.ell(232, 164, 84, 7), C.purple, { b: 3, sh: 0, hi: 0, ol: 0 });

    tube(buf, P, 338, 44, 156);

    part(buf, P.rect(450, 144, 26, 8), C.red, { b: 2 });
    part(buf, P.rect(448, 140, 30, 5), C.red, { b: 3 });
    for (let x = 451; x < 476; x += 3) buf.set(x, 151, C.gold[3]);
    part(buf, P.ell(496, 176, 10, 3.4), C.purple, { b: 2 });
    part(buf, P.ell(496, 175, 7, 2), C.purple, { b: 3, sh: 0, hi: 0, ol: 0 });
    for (const [x, y, r] of [[70, 188, C.pink], [400, 190, C.sky], [560, 188, C.yellow]]) part(buf, P.ell(x, y, 16, 4), r, { b: 3, sh: 0, hi: 0 });

    part(buf, P.rect(544, 132, 26, 18), C.stone, { b: 3 });
    part(buf, P.rect(541, 129, 32, 4), C.stone, { b: 4, sh: 0 });
    const G = C.gold;
    part(buf, P.cap(553, 108, 553, 129, 2.4), G, { b: 2, sh: 1 });
    part(buf, P.cap(561, 108, 561, 129, 2.4), G, { b: 3, sh: 1 });
    part(buf, P.path('M 549 72 Q 545 92 550 112 L 564 112 Q 569 92 565 72 Q 557 68 549 72 Z'), G, { b: 3 });
    P.line(551, 76, 563, 104, G[1]);
    part(buf, P.cap(550, 74, 552, 50, 2.2, 1.8), G, { b: 3, sh: 1 });
    part(buf, P.cap(564, 74, 562, 50, 2.2, 1.8), G, { b: 3, sh: 1 });
    part(buf, P.ell(557, 62, 5.4, 6.4), G, { b: 3 });
    part(buf, P.path('M 551 60 Q 551 52 557 53 Q 563 52 563 60 Q 557 56 551 60 Z'), G, { b: 2, sh: 0 });
    buf.set(555, 62, G[0]); buf.set(559, 62, G[0]);
    P.curve('M 554 65 Q 557 68 560 65', G[0]);
    part(buf, P.rect(546, 136, 22, 9), C.cream, { b: 4, sh: 0 });
    textOn(buf, 'ХЬЮ', 548, 137, C.purple[2], 0);

    part(buf, P.rect(520, 136, 4, 14), C.red, { b: 2 });
    part(buf, P.rect(522, 146, 118, 3), C.purple, { b: 3, sh: 0 });
    for (let x = 526; x < 640; x += 8) line(buf, x, 149, x, 152, C.grey[2]);
    part(buf, P.rect(608, 70, 3, 78), C.grey, { b: 2, sh: 0 });
    part(buf, P.rect(634, 70, 3, 78), C.grey, { b: 2, sh: 0 });
    part(buf, P.rect(602, 58, 38, 13), C.purple, { b: 2 });
    textOn(buf, 'ГОРКИ', 606, 60, C.lamp, 0);
    part(buf, P.rect(529, 128, 3, 22), C.grey, { b: 2, sh: 0 });
    part(buf, P.rect(526, 125, 9, 4), C.grey, { b: 1, sh: 0 });
    part(buf, P.ell(530.5, 123, 4.4, 3.4), C.red, { b: 3 });
    pool(buf, 320, 176, 300, 30, 0.4);
  };

  lay('blister', {
    earth: g => L.moon.earth(g),
    spork: g => sprite(76, 118, P => {
      if (g && g.f.sporkBent) {
        P.part(P.cap(7, 34, 22, 20, 2, 2), C.grey, { b: 4, sh: 1 });
        A.spork(P, 22, 20, 38, 112);
      } else A.spork(P, 7, 34, 66, 8);
    }),
    hat: () => sprite(24, 24, P => A.hat(P, 12, 22, true, 1)),
    car: () => sprite(36, 20, P => A.coasterCar(P, 18, 18))
  });

  BG.vest6 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 152);
    vgrad(buf, wall, [C.night[1], C.night[2], C.purple[1], C.purple[2], C.lilac[2]], 0, 152, 0.04, 0.96);
    for (const [x, h, r, t] of [[84, 58, C.orchid, -2], [104, 88, C.lilac, 2], [124, 44, C.pink, -1], [276, 60, C.lilac, -3], [296, 96, C.orchid, 2], [312, 46, C.pink, 1]]) A.crystalShard(P, x, 152, h, r, t);
    const floor = P.rect(0, 150, 320, 50);
    vgrad(buf, floor, C.lilac, 150, 200, 0.78, 0.3);
    for (let i = 0; i < 7; i++) lineIn(buf, floor, 150 + i * 14, 152, 110 + i * 26, 200, BOW[i][1]);
    part(buf, P.rect(0, 148, 320, 4), C.purple, { b: 2, sh: 0, hi: 1 });

    part(buf, P.rect(144, 22, 112, 130), C.gold, { b: 2 });
    const door = P.rect(150, 30, 100, 122);
    part(buf, door, C.stone, { b: 2 });
    part(buf, P.rect(156, 36, 42, 110), C.stone, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(202, 36, 42, 110), C.stone, { b: 2, sh: 1, hi: 1 });
    for (let y = 40; y < 146; y += 13) for (const x of [159, 195, 205, 241]) buf.set(x, y, C.stone[4]);
    part(buf, P.ell(200, 86, 11, 11), C.stone, { b: 1 });
    textOn(buf, 'Pb', 194, 82, C.stone[4], 0);
    part(buf, P.rect(171, 7, 58, 13), C.purple, { b: 1 });
    textOn(buf, 'ХЬЮ БЛИСС', 174, 10, C.lamp, 0);
    tube(buf, P, 14, 44, 156);
    for (const x of [134, 266]) {
      part(buf, P.poly([x - 3, 78, x + 3, 78, x + 2, 86, x - 2, 86]), C.gold, { b: 2 });
      part(buf, P.poly([x, 58, x + 5, 70, x, 80, x - 5, 70]), LAMP, { sh: 0, hi: 0 });
      pool(buf, x, 70, 22, 24, 0.9);
    }
    pool(buf, 200, 168, 100, 22, 0.5);
    vignette(buf, 0.8);
  };

  lay('vest', {
    xray: g => sprite(84, 108, (P, b) => {
      const k = g ? Math.floor(g.time * 5) % 3 : 0;
      for (let y = 0; y < 108; y++) for (let x = 0; x < 84; x++) b.px[y * 84 + x] = (y + k) % 3 === 0 ? C.night[2] : C.night[1];
      const bent = !!(g && g.vt.sconceT);
      const fall = bent ? Math.min(1, (g.time - g.vt.sconceT) * 1.6) : 0;
      P.part(P.rect(2, 8, 5, 18), C.tvB, { sh: 0, hi: 0, ol: C.tvA });
      if (bent) { P.curve('M 7 16 Q 26 16 34 34', C.tvA); P.curve('M 7 18 Q 24 18 32 35', C.tvB); S.outline(b, P.ell(38, 38, 7, 3.4, 0.9), C.tvA); }
      else { P.line(7, 16, 34, 18, C.tvA); P.line(7, 18, 34, 20, C.tvB); S.outline(b, P.ell(42, 21, 9, 3.6), C.tvA); }
      const by = 12 + fall * fall * 62;
      S.outline(b, P.ell(42, by, 7.4, 7.4), C.eye);
      P.px(40, by - 2, C.eye); P.px(43, by - 2, C.eye); P.px(41.4, by + 1, C.eye);
      if (!bent) for (let y = 28; y < 80; y += 4) b.set(42, y, C.tvB);
      P.part(P.rect(16, 82 + (fall >= 1 ? 3 : 0), 52, 15), C.tvB, { sh: 0, hi: 0, ol: C.tvA });
      S.font.draw(b, 'ОТКРЫТЬ', 20, 86 + (fall >= 1 ? 3 : 0), C.eye, 0);
      S.frameRect(b, 0, 0, 84, 108, C.tvA);
    }),
    open: () => sprite(100, 122, (P, b) => {
      const m = P.rect(10, 0, 80, 122);
      S.grad(b, m, [C.tvB, C.tvA, C.glow], (x, y) => 0.3 + (1 - Math.abs(x - 50) / 40) * 0.7);
      for (let i = 0; i < 7; i++) lineIn(b, m, 50, 20, 14 + i * 12, 122, BOW[i][3]);
      P.part(P.rect(0, 0, 10, 122), C.stone, { b: 2 });
      P.part(P.rect(90, 0, 10, 122), C.stone, { b: 2 });
    })
  });

  BG.sanctum6 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 480, 152);
    vgrad(buf, wall, [C.night[0], C.night[1], C.purple[0], C.purple[1], C.night[2]], 0, 152, 0.04, 0.96);
    for (const [x, h, r, t] of [[176, 70, C.night.slice(1), 3], [196, 46, C.lilac, -1], [286, 52, C.lilac, 2], [304, 84, C.night.slice(1), -3], [372, 64, C.purple, 2], [392, 40, C.orchid, -2], [466, 92, C.night.slice(1), -2]]) A.crystalShard(P, x, 152, h, r, t);
    const floor = P.rect(0, 150, 480, 50);
    vgrad(buf, floor, C.night, 150, 200, 0.8, 0.3);
    for (let i = 0; i < 7; i++) lineIn(buf, floor, 222 + i * 6, 152, 150 + i * 30, 200, BOW[i][1]);
    part(buf, P.rect(0, 148, 480, 4), C.purple, { b: 1, sh: 0, hi: 1 });

    part(buf, P.rect(56, 6, 100, 58), C.gold, { b: 2 });
    const win = P.rect(60, 10, 92, 50);
    flat(buf, win, C.night);
    A.stars(buf, win, 11, 26);
    S.outerLine(buf, win, C.black);

    part(buf, P.rect(2, 34, 52, 118), C.gold, { b: 2 });
    part(buf, P.rect(6, 40, 44, 112), C.stone, { b: 2 });
    part(buf, P.rect(10, 44, 36, 104), C.stone, { b: 2, sh: 1, hi: 1 });
    for (let y = 48; y < 146; y += 12) { buf.set(12, y, C.stone[4]); buf.set(43, y, C.stone[4]); }
    part(buf, P.ell(44, 100, 2, 2), C.red, { b: 3, sh: 0 });

    part(buf, P.poly([222, 0, 258, 0, 250, 24, 230, 24]), C.grey, { b: 2 });
    part(buf, P.ell(240, 25, 8, 3), LAMP, { sh: 0, hi: 0 });
    part(buf, P.rect(204, 138, 72, 14), C.grey, { b: 2 });
    part(buf, P.rect(212, 132, 56, 7), C.grey, { b: 3 });
    for (let i = 0; i < 7; i++) part(buf, P.rect(210 + i * 9, 142, 6, 5), BOW[i], { b: 3, sh: 0, hi: 0 });
    P.curve('M 276 146 Q 300 150 318 140', C.grey[1]);
    P.curve('M 204 146 Q 186 150 170 142', C.grey[1]);

    part(buf, P.rect(312, 100, 56, 52), C.grey, { b: 1 });
    part(buf, P.rect(316, 104, 26, 18), GLOW, { b: 3, sh: 0, hi: 0 });
    for (let i = 0; i < 6; i++) line(buf, 318 + i * 4, 120, 318 + i * 4, 120 - 3 - ((i * 5) % 11), BOW[i][3]);
    for (let i = 0; i < 8; i++) buf.set(346 + (i % 4) * 5, 106 + Math.floor(i / 4) * 5, [C.neonA, C.neonB, C.lamp][i % 3]);
    part(buf, P.rect(346, 126, 18, 8), C.grey, { b: 0, sh: 0, hi: 0 });

    part(buf, P.path('M 396 96 Q 396 56 430 56 Q 464 56 464 96 Z'), C.grey, { b: 4 });
    for (let i = 0; i < 7; i++) {
      const a0 = Math.PI + i * Math.PI / 7, a1 = Math.PI + (i + 1) * Math.PI / 7;
      part(buf, P.poly([430, 94, 430 + Math.cos(a0) * 30, 94 + Math.sin(a0) * 34, 430 + Math.cos(a1) * 30, 94 + Math.sin(a1) * 34]), BOW[6 - i], { b: 3, sh: 0, hi: 0, ol: 0 });
    }
    line(buf, 430, 93, 456, 84, C.black); line(buf, 430, 94, 456, 85, C.black);
    part(buf, P.ell(430, 94, 3, 3), C.grey, { b: 1 });
    part(buf, P.rect(399, 98, 62, 12), C.night, { b: 1 });
    textOn(buf, 'БЛАЖЕНСТВО', 401, 100, C.lamp, 0);
    pool(buf, 240, 96, 60, 70, 0.7);
    pool(buf, 240, 170, 130, 24, 0.5);
    vignette(buf, 0.7, 240, 110);
  };

  function cabinet(P, x, y, o) {
    o = o || {};
    const R = C.purple;
    if (o.saw) {
      P.part(P.rect(x - 25, y - 28, 46, 5), C.grey, { b: 4, sh: 0 });
      for (let i = 0; i < 11; i++) P.part(P.poly([x - 25 + i * 4, y - 23, x - 21 + i * 4, y - 23, x - 23 + i * 4, y - 20.6]), C.grey, { b: 4, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(x + 21, y - 31, 6, 11), C.wood, { b: 3 });
    }
    P.part(P.rect(x - 16, y - 82, 32, 12), R, { b: 2 });
    P.part(P.rect(x - 16, y - 71, 5, 38), R, { b: 2 });
    P.part(P.rect(x + 11, y - 71, 5, 38), R, { b: 2 });
    P.part(P.rect(x - 16, y - 34, 32, 8), R, { b: 2 });
    P.part(P.rect(x - 16, y - 19, 32, 19), R, { b: 2 });
    P.part(P.rect(x - 16, y - 26.4, 5, 8), R, { b: 1, sh: 0 });
    P.part(P.rect(x + 11, y - 26.4, 5, 8), R, { b: 1, sh: 0 });
    P.part(P.rect(x - 18, y - 84, 36, 3), C.gold, { b: 3, sh: 0 });
    P.part(P.rect(x - 18, y - 2, 36, 3), C.gold, { b: 2, sh: 0 });
    for (const [dx, dy] of [[-9, -78], [6, -76], [-6, -12], [8, -8], [0, -30]]) { P.px(x + dx, y + dy, C.lamp); P.px(x + dx + 1, y + dy, C.yellow[3]); P.px(x + dx, y + dy - 1, C.yellow[3]); }
  }

  function crystalFront(f, x, y) {
    const P = new Pen(f);
    P.line(x - 10, y - 46, x + 2, y - 44, C.eye);
    P.line(x - 8, y - 76, x - 10, y - 46, C.eye);
    P.line(x + 2, y - 44, x, y - 3, C.sky[4]);
    P.line(x - 16, y - 12, x - 20, y - 50, C.sky[4]);
    P.line(x + 17, y - 12, x + 19, y - 54, C.sky[3]);
    for (let i = 0; i < 5; i++) { f.set(x + 9 + (i % 2), y - 60 + i * 9, C.eye); f.set(x - 14, y - 40 + i * 6, C.eye); }
  }

  lay('sanctum', {
    crystal: g => sprite(50, 90, P => A.crystal(P, 25, 88, 1, !!(g && g.f.beam && !g.f.boiled)))
  });

  Object.assign(A, { cabinet, crystalFront });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
