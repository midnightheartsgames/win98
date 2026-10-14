(function (S) {
  'use strict';
  const { C, Pen, part, shade, grad, hash, line } = S;
  const BG = S.BG;
  const E = S.EP201;
  const L = E.LAYERS;
  const A = S.art201;
  const { vgrad, pool, textOn, sprite, bricks, vignette, planks, snowCap, garland } = BG;
  const POLE_W = 720;
  const WORKSHOP_W = 560;

  function nightSky(buf, w, h) {
    const P = new Pen(buf);
    vgrad(buf, P.rect(0, 0, w, h), C.night, 0, h, 0.15, 0.95);
    for (let i = 0; i < w / 3; i++) {
      const x = Math.floor(hash(i, 7, 1) * w), y = Math.floor(hash(i, 7, 2) * h * 0.8);
      buf.set(x, y, hash(i, 7, 3) > 0.7 ? C.grey[5] : C.grey[3]);
    }
    for (let band = 0; band < 3; band++) for (let x = 0; x < w; x++) {
      const y0 = 14 + band * 9 + Math.sin(x / 37 + band * 1.7) * 7 + Math.sin(x / 13 + band) * 2;
      for (let k = 0; k < 6; k++) {
        const y = Math.round(y0 + k);
        if (y < 0 || y >= h) continue;
        const t = 1 - k / 6;
        if (S.dith(x, y, t * 0.75)) buf.set(x, y, band === 1 ? C.mint[3] : C.teal[3]);
      }
    }
  }

  function snowGround(buf, w, y0) {
    const P = new Pen(buf);
    const g = P.rect(0, y0, w, 200 - y0);
    grad(buf, g, C.sky, (x, y) => 0.95 - (y - y0) / 260 + (hash(x >> 2, y >> 1, 11) - 0.5) * 0.06);
    g.each((x, y) => { if (hash(x, y, 31) < 0.012) buf.set(x, y, C.glow); });
    for (let x = 0; x < w; x++) buf.set(x, y0, C.grey[5]);
  }

  BG.pole21 = function (buf) {
    const P = new Pen(buf);
    nightSky(buf, POLE_W, 140);
    for (const [cx, r] of [[80, 70], [220, 50], [620, 80], [690, 40]]) {
      const hill = P.ell(cx, 132, r, r * 0.45);
      grad(buf, hill, C.stone, (x, y) => 0.6 - (y - 100) / 200);
    }
    snowGround(buf, POLE_W, 126);
    const wall = P.rect(262, 52, 258, 98);
    planks(buf, wall, 390, -40, C.wood, { step: 9 });
    for (let y = 56; y < 150; y += 8) line(buf, 262, y, 520, y, C.wood[1]);
    const roof = P.poly([248, 56, 534, 56, 498, 14, 284, 14]);
    part(buf, roof, C.red, { b: 2 });
    for (let x = 250; x < 534; x += 10) line(buf, x, 56, 284 + (x - 250) * 0.76, 14, C.red[1]);
    part(buf, P.poly([244, 58, 538, 58, 536, 52, 246, 52]), C.grey, { b: 5, sh: 0 });
    snowCap(buf, 286, 498, 14);
    for (let x = 248; x < 536; x++) if (hash(x, 1, 5) < 0.5) buf.set(x, 58 + Math.floor(hash(x, 2, 5) * 3), C.grey[5]);
    part(buf, P.rect(300, 0, 22, 34), C.brick, { b: 3 });
    bricks(buf, P.rect(301, 1, 20, 32), 6, 3, C.brick, C.brick[0], 4);
    snowCap(buf, 298, 324, 1);
    part(buf, P.rect(358, 70, 66, 14), C.cream, { b: 4 });
    textOn(buf, 'МАСТЕРСКАЯ', 362, 72, C.red[1], 0);
    for (const px of [362, 414]) {
      const m = P.rect(px, 90, 6, 60);
      part(buf, m, C.grey, { b: 5 });
      m.each((x, y) => { if (buf.px[y * buf.w + x] !== C.black && ((y + x) & 7) < 4) buf.set(x, y, C.red[3]); });
    }
    const door = P.rect(372, 92, 38, 58);
    part(buf, door, C.red, { b: 2 });
    part(buf, P.rect(376, 96, 30, 22), C.red, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(391, 124, 9, 9), C.green, { b: 2 });
    part(buf, P.ell(391, 124, 4, 4), C.red, { b: 2, sh: 0 });
    part(buf, P.ell(404, 128, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    for (const wx of [282, 318, 470]) {
      const win = P.rect(wx, 92, 26, 26);
      grad(buf, win, [C.orange[2], C.orange[3], C.lamp, C.lamp, C.lamp], (x, y) => 0.4 + (y - 92) / 50);
      line(buf, wx + 13, 92, wx + 13, 118, C.wood[1]);
      line(buf, wx, 105, wx + 26, 105, C.wood[1]);
      S.outerLine(buf, win, C.black);
      snowCap(buf, wx - 2, wx + 28, 92);
    }
    const sw = P.rect(444, 22, 34, 26);
    grad(buf, sw, [C.orange[2], C.orange[3], C.lamp, C.lamp, C.lamp], (x, y) => 0.3 + (y - 22) / 40);
    S.outerLine(buf, sw, C.black);
    line(buf, 461, 22, 461, 48, C.wood[1]);
    snowCap(buf, 442, 480, 22);
    part(buf, P.rect(688, 96, 4, 44), C.grey, { b: 4, sh: 0 });
    part(buf, P.rect(656, 96, 62, 12), C.cream, { b: 4 });
    textOn(buf, 'СЕВ. ПОЛЮС', 658, 98, C.blue[2], 0);
    const stand = P.rect(568, 104, 52, 40);
    part(buf, stand, C.yellow, { b: 2 });
    part(buf, P.rect(556, 94, 76, 12), C.cream, { b: 4 });
    textOn(buf, 'ЖЁЛТЫЙ СНЕГ', 559, 96, C.yellow[1], 0);
    part(buf, P.rect(574, 118, 40, 22), C.wood, { b: 3 });
    for (let i = 0; i < 5; i++) part(buf, P.ell(580 + i * 7, 117 - (i % 2) * 2, 3.4, 3), C.yellow, { b: 4 });
    for (let x = 262; x < 520; x++) buf.set(x, 150, C.wood[0]);
    pool(buf, 391, 160, 70, 18, 0.5);
    pool(buf, 461, 70, 30, 30, 0.6);
    for (const [x, y] of [[120, 170], [300, 186], [520, 176], [650, 166]]) BG.dropShadow(buf, x, y, 26, 3, 0.4);
  };

  BG.workshop21 = function (buf) {
    const P = new Pen(buf);
    const W = WORKSHOP_W;
    const wall = P.rect(0, 0, W, 134);
    planks(buf, wall, 280, -200, C.oak, { step: 12 });
    shade(buf, wall, 0, (x, y) => 0.5 - y / 400);
    part(buf, P.rect(0, 0, W, 12), C.wood, { b: 1 });
    S.outline(buf, P.ell(300, 26, 152, 10), C.grey[2]);
    S.outline(buf, P.ell(300, 26, 150, 9), C.grey[4]);
    for (const sx of [150, 450]) part(buf, P.rect(sx, 0, 3, 18), C.grey, { b: 2, sh: 0 });
    part(buf, P.rect(150, 92, 12, 14), C.grey, { b: 3 });
    part(buf, P.rect(153, 95, 6, 5), C.red, { b: 3, sh: 0, hi: 0 });
    line(buf, 156, 92, 156, 26, C.grey[2]);
    const floor = P.poly([0, 134, W, 134, W, 200, 0, 200]);
    planks(buf, floor, 280, 60, C.wood, { step: 22 });
    part(buf, P.rect(0, 130, W, 5), C.wood, { b: 1, sh: 0 });
    for (const wx of [254, 330]) {
      const win = P.rect(wx, 38, 34, 30);
      vgrad(buf, win, C.night, 38, 68, 0.3, 0.7);
      for (let i = 0; i < 6; i++) buf.set(wx + 4 + i * 5, 44 + (i % 3) * 7, C.grey[5]);
      line(buf, wx + 17, 38, wx + 17, 68, C.wood[1]);
      S.outerLine(buf, win, C.black);
      snowCap(buf, wx, wx + 34, 67);
    }
    for (const sy of [46, 74]) {
      part(buf, P.rect(96, sy, 92, 4), C.wood, { b: 3, sh: 0 });
      for (let i = 0; i < 6; i++) {
        const tx = 102 + i * 15;
        const kind = (i + sy) % 3;
        if (kind === 0) part(buf, P.rect(tx, sy - 9, 9, 9), [C.red, C.blue, C.gold][i % 3], { b: 3 });
        else if (kind === 1) part(buf, P.ell(tx + 4, sy - 5, 4.4, 4.4), [C.green, C.pink, C.sky][i % 3], { b: 3 });
        else { part(buf, P.rect(tx, sy - 12, 8, 12), C.grey, { b: 4 }); part(buf, P.ell(tx + 4, sy - 14, 3, 3), C.skin, { b: 3 }); }
      }
    }
    part(buf, P.rect(4, 66, 34, 68), C.red, { b: 2 });
    part(buf, P.rect(8, 72, 26, 26), C.red, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(32, 104, 1.6, 1.6), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(40, 92, 8, 12), C.grey, { b: 4 });
    part(buf, P.rect(42, 95, 4, 4), C.red, { b: 3, sh: 0, hi: 0 });
    for (let i = 0; i < 7; i++) {
      const sx = 488 + i * 6, sy = 134 - i * 7;
      part(buf, P.rect(sx, sy - 4, 14, 4), C.wood, { b: 3, sh: 0 });
    }
    const door = P.rect(520, 40, 34, 46);
    part(buf, door, C.wood, { b: 1 });
    part(buf, P.rect(524, 44, 26, 18), C.wood, { b: 2, sh: 1, hi: 1 });
    for (const [x, y] of [[528, 48], [540, 54], [534, 66], [546, 72], [525, 76]]) part(buf, P.ell(x, y, 1.6, 1.6), C.night, { b: 0, sh: 0, hi: 0 });
    part(buf, P.rect(514, 86, 44, 3), C.wood, { b: 3, sh: 0 });
    garland(buf, 0, W, 4, 6, 1);
    garland(buf, 96, 190, 40, 3, 2);
    pool(buf, 300, 40, 260, 50, 0.6);
    pool(buf, 300, 160, 240, 30, 0.5);
    vignette(buf, 0.7, 280, 110);
  };

  BG.santa21 = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 136);
    vgrad(buf, wall, C.red, 0, 136, 0.3, 0.55);
    wall.each((x, y) => { if (((x >> 3) + (y >> 3)) % 2 === 0 && (x % 8 === 4) && (y % 8 === 4)) buf.set(x, y, C.gold[2]); });
    part(buf, P.rect(0, 0, 320, 8), C.wood, { b: 1 });
    part(buf, P.rect(0, 128, 320, 8), C.wood, { b: 2, sh: 0 });
    const floor = P.poly([0, 136, 320, 136, 320, 200, 0, 200]);
    planks(buf, floor, 160, 40, C.wood, { step: 20 });
    part(buf, P.ell(170, 172, 110, 18), C.green, { b: 2 });
    S.outline(buf, P.ell(170, 172, 104, 15), C.gold[3]);
    part(buf, P.rect(6, 60, 54, 76), C.brick, { b: 3 });
    bricks(buf, P.rect(8, 62, 50, 72), 8, 4, C.brick, C.brick[0], 9);
    part(buf, P.rect(16, 96, 34, 40), C.night, { b: 0, sh: 0, hi: 0 });
    for (let i = 0; i < 5; i++) part(buf, P.poly([20 + i * 6, 136, 23 + i * 6, 120 - (i % 2) * 6, 26 + i * 6, 136]), C.orange, { b: 3, sh: 0, hi: 0, ol: 0 });
    part(buf, P.rect(2, 56, 62, 6), C.wood, { b: 3 });
    part(buf, P.rect(18, 0, 30, 58), C.brick, { b: 2 });
    bricks(buf, P.rect(19, 0, 28, 56), 8, 4, C.brick, C.brick[0], 6);
    part(buf, P.rect(72, 24, 44, 112), C.wood, { b: 2 });
    for (let i = 0; i < 4; i++) {
      part(buf, P.rect(74, 48 + i * 22, 40, 3), C.wood, { b: 3, sh: 0 });
      for (let k = 0; k < 6; k++) part(buf, P.rect(76 + k * 6, 34 + i * 22, 5, 14), [C.green, C.navy, C.red, C.gold, C.plum, C.teal][(k + i) % 6], { b: 2, sh: 0 });
    }
    const win = P.rect(130, 26, 40, 46);
    vgrad(buf, win, C.night, 26, 72, 0.3, 0.7);
    for (let i = 0; i < 5; i++) buf.set(134 + i * 8, 32 + (i % 3) * 9, C.grey[5]);
    line(buf, 150, 26, 150, 72, C.wood[1]);
    S.outerLine(buf, win, C.black);
    part(buf, P.rect(126, 70, 48, 5), C.wood, { b: 3 });
    const door = P.rect(282, 40, 34, 96);
    part(buf, door, C.wood, { b: 1 });
    part(buf, P.rect(286, 46, 26, 38), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(286, 90, 26, 38), C.wood, { b: 2, sh: 1, hi: 1 });
    for (const [x, y] of [[292, 56], [304, 64], [298, 100], [308, 110], [290, 118]]) part(buf, P.ell(x, y, 1.8, 1.8), C.lamp, { b: 3, sh: 0, hi: 0, ol: C.night[1] });
    part(buf, P.rect(198, 10, 70, 30), C.gold, { b: 2 });
    const pic = P.rect(202, 14, 62, 22);
    vgrad(buf, pic, C.sky, 14, 36, 0.6, 0.3);
    part(buf, P.ell(220, 30, 8, 6), C.red, { b: 3 });
    part(buf, P.ell(244, 30, 9, 7), C.grey, { b: 5 });
    part(buf, P.ell(244, 24, 4, 4), C.grey, { b: 5 });
    pool(buf, 160, 60, 140, 60, 0.4);
    pool(buf, 32, 124, 40, 20, 1.2);
    vignette(buf, 0.9);
  };

  BG.past21 = function (buf) {
    BG.office(buf, {});
    const P = new Pen(buf);
    const wall = P.poly([36, 13, 260, 9, 260, 122, 36, 122]);
    wall.each((x, y) => {
      const v = buf.px[y * buf.w + x];
      if (!S.C.teal.includes(v)) return;
      const fx = (x + (Math.floor(y / 12) % 2) * 6) % 12, fy = y % 12;
      if ((fx === 5 || fx === 6) && (fy === 5 || fy === 6)) buf.set(x, y, C.rose[3]);
      else if (fx === 6 && (fy === 4 || fy === 7)) buf.set(x, y, C.green[2]);
    });
    const glass = P.poly([280, 38, 302, 31, 302, 86, 280, 88]);
    grad(buf, glass, C.sky, (x, y) => 0.55 + (y - 31) / 120 + (hash(x, y, 2) - 0.5) * 0.2);
    S.outerLine(buf, glass, C.black);
    part(buf, P.rect(232, 14, 24, 22), C.cream, { b: 4 });
    textOn(buf, '1980', 234, 16, C.red[2], 0);
    for (let i = 0; i < 3; i++) for (let k = 0; k < 4; k++) buf.set(236 + k * 5, 27 + i * 3, C.grey[2]);
  };

  const lay = (room, arts) => { L[room] = Object.assign(L[room] || {}, arts); };

  lay('pole', {
    sleigh: g => sprite(130, 76, P => A.sleigh(P, 62, 74, { lit: !!(g && g.f.futureDone), k: g ? Math.floor(g.time * 8) : 0 })),
    topiary: g => sprite(40, 132, P => A.topiary(P, 20, 130, !!(g && g.f.topiary))),
    desoto: () => S.LAYERS.street.desoto(),
    post: () => sprite(14, 24, P => { P.part(P.rect(5, 2, 4, 22), C.grey, { b: 4 }); P.part(P.ell(7, 2, 3, 3), C.gold, { b: 4 }); }),
    jelly: () => sprite(36, 20, P => A.jelly(P, 18, 18))
  });

  lay('workshop', {
    recplayer: g => sprite(48, 60, P => {
      P.part(P.rect(4, 36, 40, 24), C.wood, { b: 2 });
      P.part(P.rect(2, 30, 44, 7), C.wood, { b: 3 });
      P.part(P.ell(22, 30, 16, 3.6), C.night, { b: 1 });
      if (g && g.f.recordSet) { P.part(P.ell(22, 29, 13, 2.8), C.night, { b: 2, sh: 0 }); P.part(P.ell(22, 29, 3, 1), C.red, { b: 3, sh: 0 }); }
      P.part(P.cap(36, 30, 40, 22, 1.4), C.gold, { b: 3, sh: 0 });
      P.part(P.path('M 38 22 Q 30 6 16 2 Q 30 0 44 8 Q 46 16 40 22 Z'), C.gold, { b: 3 });
    }),
    redpc: g => sprite(44, 50, P => {
      P.part(P.rect(2, 32, 40, 18), C.wood, { b: 2 });
      P.part(P.rect(6, 6, 32, 26), C.red, { b: 2 });
      const scr = P.rect(9, 9, 26, 18);
      P.part(scr, C.night, { b: 1, sh: 0, hi: 0 });
      const k = g ? Math.floor(g.time * 2) % 3 : 0;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) P.part(P.rect(11 + i * 6, 11 + j * 5, 4, 3), (i + j + k) % 4 ? C.grey : C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(10, 34, 24, 5), C.grey, { b: 3, sh: 0 });
    }),
    tree: g => sprite(110, 130, P => {
      A.tree(P, 55, 128);
      if (!(g && g.f.bettyGot)) A.betty(P, 30, 128, 0.42, {});
      if (!(g && g.f.mazeGot)) A.maze(P, 80, 128, 0.9, false);
      P.part(P.rect(58, 118, 12, 10), C.blue, { b: 3 });
      P.line(64, 118, 64, 128, C.gold[4]);
    }),
    pole: g => sprite(70, 130, P => {
      A.pole(P, 35, 126, 118);
      const at = { pest: [12, 128], death: [26, 130], war: [44, 130], famine: [58, 128] };
      for (const id of E.HORSES) if (g && g.f[id + 'Set']) A.horse(P, at[id][0], at[id][1], id, 0.8);
      if (g && E.placed(g) === 4 && !g.f.demonOut) for (let i = 0; i < 8; i++) { const a = g.time * 2 + i * Math.PI / 4; P.px(35 + Math.cos(a) * 30, 118 + Math.sin(a) * 6, C.slime[4]); }
    }),
    dispenser: g => sprite(90, 100, P => A.dispenser(P, 45, 98, { gift: !!(g && g.vt.giftT && g.time < g.vt.giftT), k: g ? g.time * 6 : 0 })),
    greenpc: g => sprite(30, 46, P => {
      P.part(P.rect(2, 28, 26, 18), C.wood, { b: 2 });
      P.part(P.rect(3, 6, 24, 22), C.green, { b: 2 });
      P.part(P.rect(6, 9, 18, 14), C.night, { b: 1, sh: 0, hi: 0 });
      const k = g ? Math.floor(g.time * 3) % 2 : 0;
      for (let i = 0; i < 3; i++) P.line(8, 12 + i * 4, 16 + ((i + k) % 2) * 5, 12 + i * 4, C.neonB);
    }),
    tags: g => sprite(30, 30, P => {
      P.part(P.rect(2, 16, 26, 4), C.wood, { b: 3 });
      P.part(P.rect(4, 20, 3, 10), C.wood, { b: 2, sh: 0 });
      P.part(P.rect(23, 20, 3, 10), C.wood, { b: 2, sh: 0 });
      if (!(g && g.f.tagsGot)) A.tags(P, 14, 16, 0.9);
    }),
    crate: g => sprite(64, 50, P => A.crate(P, 30, 48, { santa: !!(g && g.f.santaDown), open: !!(g && g.f.demonOut), label: 'САНТЕ' })),
    cannon: () => sprite(34, 26, P => A.cannon(P, 14, 24)),
    tramp: g => sprite(44, 16, P => A.trampoline(P, 22, 14, g && g.vt.finale && g.vt.finale.bounce > g.time)),
    pounder: g => sprite(70, 56, P => A.pounder(P, 50, 54, !!(g && (g.f.santaDown || (g.vt.finale && g.vt.finale.swing > g.time)))))
  });

  lay('santa', {
    podium: () => sprite(36, 56, P => {
      P.part(P.poly([8, 54, 28, 54, 24, 18, 12, 18]), C.wood, { b: 2 });
      P.part(P.poly([2, 18, 34, 18, 30, 10, 6, 10]), C.wood, { b: 3 });
      P.part(P.poly([6, 16, 30, 16, 28, 8, 8, 8]), C.cream, { b: 4, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(10, 10 + i * 2, 26, 10 + i * 2, C.cream[1]);
    }),
    stuffer: g => sprite(46, 84, (P, b) => {
      P.part(P.rect(4, 20, 38, 62), C.grey, { b: 3 });
      P.part(P.path('M 8 20 L 2 2 L 44 2 L 38 20 Z'), C.grey, { b: 4 });
      P.part(P.rect(5, 30, 36, 14), C.night, { b: 1, sh: 0 });
      S.font.draw(b, 'ЧУЛКИ', 8, 33, C.neonB, 0);
      P.part(P.rect(14, 56, 18, 10), C.night, { b: 0, sh: 0, hi: 0 });
      P.part(P.ell(10, 72, 3, 3), C.red, { b: 3 });
      P.part(P.ell(36, 72, 3, 3), C.green, { b: 3 });
      if (g && g.vt.stuffT && g.time < g.vt.stuffT) for (let i = 0; i < 4; i++) P.px(16 + i * 4, 6 - (Math.floor(g.time * 8) + i) % 4, C.grey[5]);
    }),
    record: g => sprite(16, 20, P => { if (!(g && g.f.recordGot)) A.record(P, 8, 19, 0.8); }),
    chair: () => sprite(40, 50, P => {
      P.part(P.rect(4, 4, 30, 40), C.green, { b: 2 });
      P.part(P.rect(2, 30, 36, 8), C.green, { b: 3 });
      P.part(P.rect(4, 38, 4, 12), C.wood, { b: 2, sh: 0 });
      P.part(P.rect(30, 38, 4, 12), C.wood, { b: 2, sh: 0 });
    }),
    topiarytop: g => sprite(40, 30, P => { if (g && g.f.topiary) { P.part(P.ell(20, 22, 18, 10), C.green, { b: 3 }); for (let k = 0; k < 4; k++) P.px(8 + k * 8, 20 + (k % 2) * 3, C.green[4]); } })
  });

  lay('past', {
    armchair: () => sprite(56, 50, P => {
      P.part(P.rect(6, 4, 44, 36), C.plum, { b: 2 });
      P.part(P.rect(0, 16, 12, 30), C.plum, { b: 3 });
      P.part(P.rect(44, 16, 12, 30), C.plum, { b: 3 });
      P.part(P.rect(8, 28, 40, 12), C.plum, { b: 3 });
      for (let i = 0; i < 4; i++) P.part(P.ell(14 + i * 9, 12, 2, 2), C.pink, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(6, 44, 4, 6), C.wood, { b: 2, sh: 0 });
      P.part(P.rect(46, 44, 4, 6), C.wood, { b: 2, sh: 0 });
    }),
    knit: () => sprite(24, 14, P => {
      P.part(P.ell(10, 8, 8, 5), C.sky, { b: 3 });
      P.line(4, 2, 18, 12, C.grey[4]); P.line(18, 2, 6, 13, C.grey[4]);
    }),
    maze: () => sprite(30, 22, P => A.maze(P, 15, 20, 1, false)),
    tvglow: g => sprite(30, 24, P => {
      const k = g ? Math.floor(g.time * 4) % 3 : 0;
      const col = k === 1 ? C.tvA : C.tvB;
      P.part(P.rect(0, 0, 30, 24), [col, col, col, col, col], { b: 3, sh: 0, hi: 0, ol: 0 });
      for (let i = 0; i < 3; i++) P.part(P.ell(8 + i * 7, 14, 2.6, 4), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(15, 9, 4, 3), C.pink, { b: 3, sh: 0, hi: 0, ol: 0 });
    })
  });

  Object.assign(BG, { nightSky, snowGround, POLE_W, WORKSHOP_W });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
