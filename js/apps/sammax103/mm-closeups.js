(function (S) {
  'use strict';
  const { W, H, C, Pen, blit, font } = S;
  const E = S.EP103;
  const CLOSEUPS = S.CLOSEUPS;
  const { tvFrame, scanlines, screenMask, SCREEN, cached } = S.tvArt;
  const A = S.art103;
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];
  const screenBuf = new S.Buf(W, H);
  const noHat = cfg => Object.assign({}, cfg, { hat: null });

  function spiralBg(f, m, cx, cy, t) {
    m.each((x, y) => {
      const r = Math.hypot(x - cx, (y - cy) * 1.1);
      const k = Math.floor((r - t * 14) / 14);
      f.set(x, y, ((k % 2) + 2) % 2 ? C.purple[2] : C.pink[2]);
    });
  }

  CLOSEUPS.titlecard3 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const all = new S.Mask(0, 0, W, H); all.m.fill(1);
    spiralBg(f, all, 230, 130, t);
    const P = new Pen(f);
    A.bearMask(new Pen(f).at(230, 132, 2.1), 0, 0, A.MOB.lovey, {});
    P.part(P.poly([276, 140, 290, 108, 298, 112, 285, 144]), C.grey, { b: 4 });
    P.part(P.rect(290, 103, 5, 5), C.grey, { b: 2, sh: 0 });
    P.part(P.ell(280, 146, 9, 8, 0.4), C.grey, { b: 3 });
    for (const [dx, dy] of [[-3, -2], [2, -3], [3, 2], [-2, 3]]) P.part(P.ell(280 + dx, 146 + dy, 1.5, 1.5), C.grey, { b: 1, sh: 0, hi: 0, ol: 0 });
    P.part(P.poly([270, 151, 281, 153, 285, 176, 272, 178]), C.sand, { b: 3 });
    P.part(P.ell(276, 164, 9, 8), C.night, { b: 2 });
    P.part(P.cap(276, 170, 266, 200, 6, 8), C.stone, { b: 3 });
    const max = S.sprite('max', { dir: 's', act: 'grin' }, 1.6);
    blit(f, max.buf, 96 - max.ox, 200 - max.oy);
    const sam = S.sprite('sam', { dir: 's' }, 1.5);
    blit(f, sam.buf, 150 - sam.ox, 200 - sam.oy);
    S.bigText(f, 'SAM & MAX', 160, 10, 4, C.yellow[3], C.yellow[4], 2);
    if (t > 1) S.bigText(f, cu.lines[1] || '', 160, 48, 2, C.sky[3], C.sky[4], 1);
    if (t > 1.8) S.bigText(f, cu.lines[2] || '', 160, 68, 2, C.yellow[3], C.yellow[4], 1);
  };

  function stage(f, ramp) {
    S.grad(f, screenMask(), ramp || C.purple, (x, y) => 0.2 + (y - SCREEN.y0) / 200);
  }

  const PROGS = {
    ad(f, t) {
      stage(f);
      const P = new Pen(f);
      for (let i = 0; i < 3; i++) {
        const x = 90 + i * 54, y = 76 + Math.round(Math.sin(t * 6 + i) * 3);
        A.star(P, x, y, 26, 12, C.gold, 3);
        A.bearMask(new Pen(f).at(x, y + 3, 0.62), 0, 0, noHat([A.MOB.guard, A.MOB.chuckles, A.MOB.cuddly][i]), { talk: Math.floor(t * 6 + i) % 2 === 0 });
      }
      P.part(P.rect(84, 112, 120, 16), C.red, { b: 3 });
      font.drawCentered(f, 'БЕЗ МАФИИ!', 144, 116, Math.floor(t * 4) % 2 ? C.gold[4] : C.grey[5], 0);
      for (let i = 0; i < 12; i++) f.set(60 + ((i * 37 + Math.floor(t * 30)) % 170), 26 + (i * 13) % 20, C.lamp);
    },
    news(f, t) {
      const m = screenMask();
      S.grad(f, m, C.blue, (x, y) => 0.2 + (y - 20) / 200);
      const P = new Pen(f);
      P.part(P.rect(140, 38, 86, 58), C.sky, { b: 3 });
      S.art.sybilHead(new Pen(f).at(183, 76, 2.2), 0, 0, { talk: Math.floor(t * 8) % 3 !== 0, blink: Math.floor(t * 2) % 7 === 0 });
      P.part(P.rect(52, 112, 184, 30), C.wood, { b: 2 });
      const a = new Pen(f).at(96, 112, 1.6);
      a.part(a.ell(0, -14, 13, 10), C.navy, { b: 3 });
      a.part(a.rect(-14, -8, 28, 14), C.grey, { b: 3 });
      S.art.bradyHair(a.scaled(0, -24, 0.9), 0, -24);
      a.part(a.ell(0, -22, 6, 7), C.skin, { b: 3 });
      font.draw(f, 'НОВОСТИ 13', 56, 24, C.yellow[4]);
      font.draw(f, 'СУД В ПЯТНИЦУ', 142, 98, C.grey[5]);
    },
    meatball(f, t) {
      stage(f, C.plum);
      const P = new Pen(f);
      P.part(P.rect(112, 100, 64, 40), C.red, { b: 2 });
      P.part(P.rect(106, 96, 76, 6), C.gold, { b: 3 });
      const glass = P.rect(114, 40, 60, 56);
      S.grad(f, glass, C.sky, (x, y) => 0.6 + (y - 40) / 120);
      S.outerLine(f, glass, C.black);
      const Q = new Pen(f).at(144, 84, 2.2);
      Q.part(Q.path('M -12 0 Q -11 -8 0 -9 Q 11 -8 12 0 Z'), C.oak, { b: 3 });
      for (const cx of [-7, 0, 7]) Q.part(Q.ell(cx, 1.2, 3.6, 2.6), C.brick, { b: 2 });
      Q.part(Q.path('M -12 2 Q 0 0 12 2 L 11 5 Q 0 7 -11 5 Z'), C.oak, { b: 3 });
      for (let i = 0; i < 6; i++) { const a = t * 2 + i; f.set(Math.round(144 + Math.cos(a) * 34), Math.round(68 + Math.sin(a * 1.3) * 22), C.lamp); }
      font.drawCentered(f, 'ОРИГИНАЛ', 144, 26, C.gold[4]);
    },
    champ(f, t) {
      stage(f, C.green);
      const P = new Pen(f);
      for (let i = 0; i < 9; i++) P.part(P.ell(170 + (i % 3) * 14, 132 - Math.floor(i / 3) * 6, 9, 3), C.gold, { b: 3 });
      const glance = Math.floor(t * 0.8) % 3 === 1;
      A.leonardHead(new Pen(f).at(100, 78, 2.4), 0, 0, { look: glance ? 'up' : '', talk: Math.floor(t * 8) % 3 !== 0 });
      P.part(P.path('M 62 142 Q 64 112 100 106 Q 136 112 138 142 Z'), C.rose, { b: 1 });
      font.draw(f, 'ЧЕМПИОН КАЗИНО', 140, 26, C.gold[4]);
      font.draw(f, '10 000 000', 164, 108, C.gold[4]);
    },
    rerun(f, t) {
      PROGS.ad(f, t);
      font.draw(f, 'ПОВТОР', 58, 24, C.grey[5]);
    }
  };

  CLOSEUPS.tv3 = function (f, g, cu) {
    const t = g.time - cu.t0;
    tvFrame(f);
    screenBuf.px.fill(0);
    (PROGS[cu.prog] || PROGS.rerun)(screenBuf, t);
    for (let y = SCREEN.y0; y < SCREEN.y1; y++) for (let x = SCREEN.x0; x < SCREEN.x1; x++) {
      const c = screenBuf.px[y * W + x];
      if (c) f.px[y * W + x] = c;
    }
    scanlines(f);
  };

  CLOSEUPS.poker = function (f, g, cu) {
    const t = g.time - cu.t0;
    const bg = cached('poker103', W, H, (P, b) => {
      const all = new S.Mask(0, 0, W, H); all.m.fill(1);
      S.grad(b, all, C.night, (x, y) => 0.4 + y / H * 0.4);
      for (let x = 11; x < W; x += 22) for (let y = 14; y < 110; y += 14) P.part(P.poly([x, y - 4, x + 3, y, x, y + 4, x - 3, y]), C.purple, { b: 2, sh: 0, hi: 0, ol: 0 });
      P.part(P.rect(0, 104, W, 26), C.wood, { b: 1 });
      P.part(P.rect(236, 30, 70, 74), C.oak, { b: 1 });
      P.part(P.rect(240, 34, 62, 70), C.wood, { b: 2 });
      P.part(P.rect(236, 12, 70, 16), C.red, { b: 2 });
      S.BG.textOn(b, 'ДЛЯ СЕМЬИ', 245, 15, C.gold[4], 0);
    });
    blit(f, bg, 0, 0);
    A.bearMask(new Pen(f).at(40, 92, 1.6), 0, 0, A.MOB.cuddly, { talk: t < 0.8 });
    const P = new Pen(f);
    P.part(P.path('M 0 150 Q 8 118 40 116 Q 72 118 80 150 Z'), C.plum, { b: 3 });
    P.part(P.path('M 104 200 Q 108 124 160 116 Q 212 124 216 200 Z'), C.rose, { b: 1 });
    P.part(P.rect(146, 104, 28, 16), C.rose, { b: 1, sh: 1 });
    const glancing = cu.glance && g.time - cu.glance > 0.1 && g.time - cu.glance < 1.3;
    A.leonardHead(new Pen(f).at(160, 86, 2.5), 0, 0, { look: glancing ? 'up' : '', talk: false, blink: !glancing && Math.floor(t * 1.5) % 5 === 4 });
    if (cu.leo) A.card(new Pen(f), 160, 52, E.cards.RANKS[cu.leo.r], cu.leo.s, 1.5);
    const felt = P.path('M -10 200 Q 0 160 60 152 L 260 152 Q 320 160 330 200 Z');
    P.part(felt, C.green, { b: 2 });
    P.part(P.path('M -10 170 Q 0 156 60 150 L 260 150 Q 320 156 330 170 L 330 158 Q 320 146 260 143 L 60 143 Q 0 146 -10 158 Z'), C.wood, { b: 2 });
    for (let i = 0; i < 12; i++) P.part(P.ell(236 + (i % 4) * 12, 186 - Math.floor(i / 4) * 5, 7, 2.6), C.gold, { b: 3 });
    P.part(P.ell(96, 184, 7, 2.6), C.gold, { b: 3 });
    font.draw(f, '10 000 000', 228, 158, C.gold[4]);
    font.draw(f, '1', 94, 172, C.gold[4]);
    if (cu.reveal && cu.sam) {
      P.part(P.rect(8, 150, 58, 44), C.night, { b: 1 });
      font.draw(f, 'Моя карта', 11, 152, C.grey[5]);
      A.card(new Pen(f), 36, 177, E.cards.RANKS[cu.sam.r], cu.sam.s, 1);
    }
  };

  const REEL = ['bear', 'cherry', 'bell', 'seven', 'star', 'meat'];

  function reelSymbol(f, kind, x, y) {
    const P = new Pen(f);
    if (kind === 'bear') A.bearMask(new Pen(f).at(x, y + 1, 0.5), 0, 0, noHat(A.MOB.ted), {});
    else if (kind === 'cherry') { P.part(P.ell(x - 4, y + 4, 4, 4), C.red, { b: 3 }); P.part(P.ell(x + 4, y + 5, 4, 4), C.red, { b: 3 }); P.curve(`M ${x - 4} ${y} Q ${x} ${y - 10} ${x + 4} ${y + 1}`, C.green[2]); }
    else if (kind === 'bell') { P.part(P.path(`M ${x - 7} ${y + 6} Q ${x - 7} ${y - 8} ${x} ${y - 8} Q ${x + 7} ${y - 8} ${x + 7} ${y + 6} Z`), C.gold, { b: 3 }); P.part(P.ell(x, y + 7, 2, 2), C.gold, { b: 2, sh: 0 }); }
    else if (kind === 'seven') S.bigText(f, '7', x, y - 7, 2, C.red[3], C.red[4], 0);
    else if (kind === 'star') A.star(P, x, y, 9, 4, C.gold, 4);
    else { P.part(P.ell(x, y, 8, 7), C.brick, { b: 2 }); P.part(P.ell(x - 2, y - 2, 2, 1.5), C.brick, { b: 4, sh: 0, hi: 0, ol: 0 }); }
  }

  CLOSEUPS.slot = function (f, g, cu) {
    const t = g.time - cu.t0;
    const bg = cached('slot103', W, H, (P, b) => {
      const all = new S.Mask(0, 0, W, H); all.m.fill(1);
      S.grad(b, all, C.night, (x, y) => 0.5 + y / H * 0.3);
      P.part(P.rect(70, 20, 170, 180), C.red, { b: 2 });
      P.part(P.path('M 62 30 Q 155 -20 248 30 Z'), C.red, { b: 3 });
      A.bearMask(new Pen(b).at(155, 26, 1), 0, 0, noHat(A.MOB.ted), {});
      P.part(P.rect(84, 60, 142, 60), C.grey, { b: 1 });
      P.part(P.rect(84, 136, 142, 16), C.gold, { b: 3 });
      S.BG.textOn(b, 'МИШКА-БАНДИТ', 110, 139, C.red[1], 0);
      P.part(P.rect(104, 164, 102, 28), C.grey, { b: 1 });
      P.part(P.rect(110, 170, 90, 16), C.black, { b: 0, sh: 0, hi: 0 });
      P.part(P.rect(240, 90, 14, 30), C.grey, { b: 2 });
    });
    blit(f, bg, 0, 0);
    const P = new Pen(f);
    const stops = [1.0, 1.5, 2.0];
    for (let i = 0; i < 3; i++) {
      const x0 = 90 + i * 46;
      const win = P.rect(x0, 64, 40, 52);
      S.grad(f, win, C.grey, (x, y) => 0.95 - Math.abs(y - 90) / 90);
      const final = cu.meat ? 'meat' : 'bear';
      if (t < stops[i]) {
        const off = (t * 220 + i * 17) % 26;
        for (let k = -1; k < 3; k++) {
          const sy = 70 + k * 26 + off;
          if (sy < 60 || sy > 120) continue;
          reelSymbol(f, REEL[(Math.floor(t * 8.5) + k + i * 2) % REEL.length], x0 + 20, sy);
        }
      } else reelSymbol(f, final, x0 + 20, 90);
      S.outerLine(f, win, C.black);
    }
    const pull = t < 0.5 ? t / 0.5 : 0;
    P.part(P.cap(247, 90, 250, 50 + pull * 60, 2.4), C.grey, { b: 4, sh: 0 });
    P.part(P.ell(250, 46 + pull * 60, 6, 6), C.red, { b: 3 });
    if (t > 2.2) {
      font.drawCentered(f, 'ТЫ В ОГНЕ!', 155, 174, Math.floor(t * 6) % 2 ? C.orange[4] : C.yellow[4], 0);
      if (cu.meat && t > 2.6) {
        const Q = new Pen(f).at(155, 196, 2);
        Q.part(Q.path('M -12 0 Q -11 -8 0 -9 Q 11 -8 12 0 Z'), C.oak, { b: 3 });
        for (const cx of [-7, 0, 7]) Q.part(Q.ell(cx, 1.2, 3.6, 2.6), C.brick, { b: 2 });
      }
    }
  };

  function miniScene(f, i, x, y, w, h, t) {
    const P = new Pen(f);
    const m = P.rect(x, y, w, h);
    const ramps = [C.plum, C.olive, C.night, C.purple, C.sky, C.teal, C.rose, C.grey, C.pink, C.gold];
    S.grad(f, m, ramps[i], (xx, yy) => 0.3 + (yy - y) / h * 0.4);
    const cx = x + w / 2, by = y + h - 2;
    if (i === 0) { P.part(P.rect(cx - 2, by - 12, 14, 6), C.wood, { b: 2, sh: 0 }); S.art.sybilHead(new Pen(f).at(cx + 6, by - 17, 0.45), 0, 0, { blink: Math.floor(t) % 4 === 0 }); P.part(P.rect(cx - 16, by - 20, 5, 16), C.green, { b: 3, sh: 0 }); }
    else if (i === 1) A.bandaHead(new Pen(f).at(cx, by - 8, 0.45), 0, 0, {});
    else if (i === 2) { P.part(P.ell(cx, by - 5, 18, 4), C.green, { b: 2 }); A.leonardHead(new Pen(f).at(cx + 12, by - 13, 0.45), 0, 0, { look: Math.floor(t * 1.5) % 2 ? 'up' : '' }); }
    else if (i === 3) A.bearMask(new Pen(f).at(cx, by - 9, 0.34), 0, 0, A.MOB.lovey, {});
    else if (i === 4) { P.part(P.rect(x, by - 5, w, 5), C.asphalt, { b: 2, sh: 0, hi: 0 }); P.part(P.rect(cx - 10, by - 10, 20, 6), C.grey, { b: 0 }); f.set(Math.round(cx), by - 11, C.grey[5]); }
    else if (i === 5) { P.part(P.rect(cx - 4, by - 12, 10, 8), C.grey, { b: 2 }); P.part(P.ell(cx + 10, by - 3, 3, 2), C.rat, { b: 3, sh: 0 }); }
    else if (i === 6) { P.part(P.ell(cx, by - 3, 20, 3), C.red, { b: 3 }); P.part(P.rect(x + 2, y + 2, 6, h - 6), C.red, { b: 2, sh: 0 }); P.part(P.rect(x + w - 8, y + 2, 6, h - 6), C.red, { b: 2, sh: 0 }); }
    else if (i === 7) { for (let k = 0; k < 90; k++) f.set(x + Math.floor(S.hash(k, Math.floor(t * 12), 1) * w), y + Math.floor(S.hash(k, Math.floor(t * 12), 2) * h), S.hash(k, 3, Math.floor(t * 12)) > 0.5 ? C.grey[5] : C.grey[1]); font.drawCentered(f, 'НЕТ', cx, y + 4, C.red[4], C.black); }
    else if (i === 8) { P.part(P.rect(cx - 12, by - 8, 24, 8), C.pink, { b: 2 }); font.drawCentered(f, 'М!', cx, y + 3, C.pink[4], C.black); }
    else { A.bearMask(new Pen(f).at(cx - 6, by - 8, 0.3), 0, 0, noHat(A.MOB.ted), {}); for (let k = 0; k < 3; k++) f.set(Math.round(cx + 6 + k * 4), by - 4, C.cycle[(k + Math.floor(t * 6)) % 8]); }
  }

  CLOSEUPS.monitors = function (f, g, cu) {
    const t = g.time - cu.t0;
    const P = new Pen(f);
    const all = new S.Mask(0, 0, W, H); all.m.fill(1);
    S.grad(f, all, C.navy, (x, y) => 0.15 + y / H * 0.3);
    P.part(P.rect(12, 12, 296, 156), C.grey, { b: 1 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      const x = 20 + c * 57, y = 20 + r * 74;
      P.part(P.rect(x - 2, y - 2, 54, 68), C.grey, { b: 2 });
      miniScene(f, i, x, y, 50, 60, t);
      for (let yy = y; yy < y + 60; yy += 2) for (let xx = x; xx < x + 50; xx++) { const k = yy * W + xx; f.px[k] = S.DARKER[f.px[k]]; }
      if (cu.hi === i) S.frameRect(f, x - 3, y - 3, 56, 66, Math.floor(t * 4) % 2 ? C.yellow[4] : C.orange[3]);
      f.set(x + 48, y + 62, C.red[4]);
    }
  };

  CLOSEUPS.boom = function (f, g, cu) {
    const t = g.time - cu.t0;
    const P = new Pen(f);
    const all = new S.Mask(0, 0, W, H); all.m.fill(1);
    S.grad(f, all, [C.night[0], C.night[1], C.purple[1], C.plum[2], C.red[2], C.orange[3]], (x, y) => y / H * (t > 1.4 ? 1 : 0.6));
    const bld = P.rect(70, 70, 180, 90);
    if (t < 1.4) {
      P.part(bld, C.purple, { b: 2 });
      for (let i = 0; i < 8; i++) P.part(P.rect(84 + i * 20, 96, 10, 14), LAMP, { sh: 0, hi: 0 });
      A.bearMask(new Pen(f).at(160, 52, 1.3), 0, 0, noHat(A.MOB.ted), {});
      font.drawCentered(f, 'КАЗИНО ТЕДА И. БЭРА', 160, 76, C.neonA, C.black);
    } else {
      const k = Math.min(1, (t - 1.4) / 1.2);
      for (let i = 0; i < 9; i++) {
        const a = i / 9 * Math.PI * 2, r = 10 + k * 70 + (i % 3) * 8;
        P.part(P.ell(160 + Math.cos(a) * r * 0.8, 110 + Math.sin(a) * r * 0.5, 22 - k * 8, 18 - k * 6), i % 2 ? C.orange : C.gold, { b: 3, sh: 0 });
      }
      P.part(P.ell(160, 112, 40 + k * 30, 30 + k * 18), LAMP, { sh: 0, hi: 0 });
      A.bearMask(new Pen(f).at(160 + k * 60, 52 - k * 70, 1.3), 0, 0, noHat(A.MOB.ted), {});
      for (let i = 0; i < 14; i++) {
        const x = 160 + (S.hash(i, 1, 2) - 0.5) * 300 * k, y = 110 - S.hash(i, 3, 4) * 150 * k + k * k * 60;
        A.hypnoBear(new Pen(f), x, y, 0.5, {});
      }
    }
    P.part(P.rect(0, 160, W, 40), C.asphalt, { b: 1, sh: 0, hi: 0 });
    const car = S.LAYERS.street.desoto();
    blit(f, car, 20, 150);
    const sam = S.sprite('sam', { dir: 'e' }, 1);
    const max = S.sprite('max', { dir: 'e', act: 'grin' }, 1);
    blit(f, sam.buf, 190 - sam.ox, 196 - sam.oy);
    blit(f, max.buf, 214 - max.ox, 196 - max.oy - (Math.floor(t * 3) % 2 ? 2 : 0));
  };

  const TITLE_ITEMS = ['Новая игра', 'Продолжить', 'Загрузить', 'Настройки', 'Выход'];

  E.TITLE = {
    items: TITLE_ITEMS,
    draw(f, t, hover, enabled) {
      S.starfield(f, 31, [C.night[0], C.night[1], C.purple[1], C.plum[2], C.rose[2]]);
      const back = cached('title103', W, 120, (Q, b) => {
        for (let i = 0; i < 12; i++) {
          const x = i * 28 - 6, h = 22 + Math.floor(S.hash(i, 9, 1) * 34);
          Q.part(Q.rect(x, 120 - h, 26, h), C.night, { b: 1, sh: 0, hi: 0, ol: C.night[0] });
          for (let yy = 120 - h + 4; yy < 116; yy += 6) for (let xx = x + 3; xx < x + 23; xx += 5) if (S.hash(xx, yy, 5) > 0.6) b.set(xx, yy, C.lamp);
        }
        Q.part(Q.rect(150, 50, 140, 70), C.purple, { b: 1 });
        for (let i = 0; i < 8; i++) Q.part(Q.rect(158 + i * 16, 80, 8, 12), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
        A.bearMask(new Pen(b).at(235, 36, 1.2), 0, 0, noHat(A.MOB.ted), {});
        S.BG.textOn(b, 'КАЗИНО', 160, 62, C.neonA, C.black);
      });
      blit(f, back, 0, 54);
      const P = new Pen(f);
      P.part(P.rect(0, 172, W, 28), C.asphalt, { b: 1, sh: 0, hi: 0, ol: 0 });
      for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.25 + Math.sin(t * 0.6 + i) * 0.1; S.line(f, 235, 90, 235 + Math.cos(a) * 120, 90 + Math.sin(a) * 120, C.pink[3]); }
      S.BG.pool(f, 236, 188, 90, 18, 1.5);
      const sam = S.sprite('sam', { dir: 'w', talk: Math.floor(t * 0.5) % 4 === 1 && Math.floor(t * 8) % 2 === 0 ? 1 : 0, blink: Math.floor(t * 2) % 9 === 0 }, 1.45);
      const max = S.sprite('max', { dir: 'w', act: 'grin', walk: -1 }, 1.45);
      blit(f, sam.buf, 276 - sam.ox, 194 - sam.oy);
      blit(f, max.buf, 214 - max.ox, 194 - max.oy - (Math.floor(t * 2.5) % 2 ? 3 : 0));
      S.bigText(f, 'SAM & MAX', 100, 10, 3, C.orange[3], C.yellow[4], 2);
      S.bigText(f, 'КРОТ, МАФИЯ', 100, 38, 2, C.yellow[3], C.yellow[4], 1);
      S.bigText(f, 'И ФРИКАДЕЛЬКА', 100, 56, 2, C.yellow[3], C.yellow[4], 1);
      font.drawCentered(f, 'ЭПИЗОД 103', 100, 77, C.sky[4]);
      TITLE_ITEMS.forEach((s, i) => {
        const on = enabled[i];
        const col = !on ? C.grey[2] : hover === i ? C.yellow[4] : C.grey[5];
        font.draw(f, (hover === i && on ? '» ' : '  ') + s, 30, 96 + i * 14, col);
      });
      font.draw(f, '(c) 2000 LucasArts. Win 98 Edition', 4, 190, C.grey[2]);
    },
    hit(x, y) {
      for (let i = 0; i < TITLE_ITEMS.length; i++) if (x >= 26 && x < 150 && y >= 94 + i * 14 && y < 106 + i * 14) return i;
      return -1;
    }
  };

  E.CREDITS = [
    ['SAM & MAX', 3], ['КРОТ, МАФИЯ', 2], ['И ФРИКАДЕЛЬКА', 2], ['', 1],
    ['По комиксам Стива Пёрселла', 1], ['', 1],
    ['Сэм, собака в костюме', 1], ['Макс, гиперактивный кролик-нечто', 1], ['', 1],
    ['В ролях', 2], ['Гарри Кротман в роли Дона', 1], ['Чаклз в роли человека с планом Б', 1], ['Леонард Стейкчармер в роли шулера', 1], ['Лапочка, Обнимашка и охранник', 1], ['в ролях мишек без мафии', 1], ['Жан-Франсуа Банд-а-Пар, ранее Боско', 1], ['Сибил Пандемик, профессиональный свидетель', 1], ['Сержант Жучок в роли себя', 1], ['', 1],
    ['Графика', 2], ['320 на 200 точек, 256 цветов', 1], ['и ни одного оригинального сэндвича', 1], ['', 1],
    ['Музыка', 2], ['Ансамбль «Поющие мишки»', 1], ['', 1],
    ['При съёмках пострадала', 1], ['одна фабрика игрушек.', 1], ['Буфет не выжил.', 1], ['', 1],
    ['КОНЕЦ ЭПИЗОДА 103', 2], ['Продолжение следует...', 1]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
