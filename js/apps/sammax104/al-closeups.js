(function (S) {
  'use strict';
  const { W, H, C, Pen, blit, font } = S;
  const E = S.EP104;
  const CLOSEUPS = S.CLOSEUPS;
  const { tvFrame, scanlines, screenMask, SCREEN, cached } = S.tvArt;
  const A = S.art104;
  const B = S.art104bg;
  const LAMP = A.LAMP;
  const screenBuf = new S.Buf(W, H);

  function fillAll(f, ramp, fn) {
    const all = new S.Mask(0, 0, f.w, f.h);
    all.m.fill(1);
    S.grad(f, all, ramp, fn);
  }

  function stripes(P, y0, y1, n) {
    const h = (y1 - y0) / n;
    for (let i = 0; i < n; i++) P.part(P.rect(0, y0 + i * h, W, h + 1), i % 2 ? C.grey : C.red, { b: i % 2 ? 5 : 3, sh: 0, hi: 0, ol: 0 });
  }

  function flame(P, x, y, s, t) {
    const k = 1 + Math.sin(t * 40) * 0.15;
    P.part(P.path(`M ${x - 5 * s} ${y} Q ${x - 7 * s} ${y + 12 * s * k} ${x} ${y + 26 * s * k} Q ${x + 7 * s} ${y + 12 * s * k} ${x + 5 * s} ${y} Z`), C.orange, { b: 3, sh: 0 });
    P.part(P.path(`M ${x - 2.6 * s} ${y} Q ${x - 3 * s} ${y + 8 * s * k} ${x} ${y + 15 * s * k} Q ${x + 3 * s} ${y + 8 * s * k} ${x + 2.6 * s} ${y} Z`), LAMP, { sh: 0, hi: 0, ol: 0 });
  }

  function smoke(P, x, y, r, t, n) {
    for (let i = 0; i < n; i++) {
      const a = i * 2.4 + t * 0.7, d = r * (0.4 + (i % 3) * 0.3);
      P.part(P.ell(x + Math.cos(a) * d * 1.6, y + Math.sin(a) * d * 0.4 - (i % 2) * 3, r * (0.5 + (i % 4) * 0.12), r * 0.42), C.grey, { b: 4 + (i % 2), sh: 1, hi: 0, ol: 0 });
    }
  }

  function boom(P, x, y, k) {
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2, r = 8 + k * 54 + (i % 3) * 7;
      P.part(P.ell(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.5, Math.max(4, 20 - k * 8), Math.max(3, 16 - k * 6)), i % 2 ? C.orange : C.gold, { b: 3, sh: 0 });
    }
    P.part(P.ell(x, y, 30 + k * 26, 22 + k * 16), LAMP, { sh: 0, hi: 0 });
  }

  function missile(P, x, y, s, t, down) {
    const Q = new Pen(P.b).at(x, y, s);
    if (down) Q.sy = -s;
    B.obelisk(Q, 0, -40, 0, 5, B.WHITE);
    flame(Q, 0, 0, 1, t);
  }

  CLOSEUPS.titlecard4 = function (f, g, cu) {
    const t = g.time - cu.t0;
    fillAll(f, C.blue, (x, y) => 0.25 + y / H * 0.5);
    const P = new Pen(f);
    for (let i = 0; i < 26; i++) A.starShape(P, 12 + (i * 53) % 300, 8 + (i * 29) % 90, 3, 1.3, C.grey, 5);
    stripes(P, 132, 200, 6);
    A.lincolnHead(new Pen(f).at(268, 124, 2.3), 0, 0, { v: t > 2.6 ? 'rage' : '', anim: Math.floor(t * 6) % 2 });
    const max = S.sprite('max', { dir: 's', act: 'grin' }, 1.3);
    blit(f, max.buf, 40 - max.ox, 198 - max.oy);
    const sam = S.sprite('sam', { dir: 's' }, 1.3);
    blit(f, sam.buf, 88 - sam.ox, 198 - sam.oy);
    S.bigText(f, 'SAM & MAX', 130, 8, 4, C.yellow[3], C.yellow[4], 2);
    if (t > 1) S.bigText(f, cu.lines[1] || '', 110, 46, 2, C.sky[3], C.sky[4], 1);
    if (t > 1.8) S.bigText(f, cu.lines[2] || '', 110, 66, 2, C.grey[5], C.eye, 1);
    if (t > 2.6) S.bigText(f, cu.lines[3] || '', 110, 86, 2, C.red[3], C.orange[4], 1);
  };

  function caption(f, text, col) {
    const P = new Pen(f);
    P.part(P.rect(SCREEN.x0, 124, SCREEN.x1 - SCREEN.x0, 18), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
    font.drawCentered(f, text, 144, 129, col || C.yellow[4], 0);
  }

  function lectern(f, t, who, cap) {
    S.grad(f, screenMask(), C.blue, (x, y) => 0.25 + (y - SCREEN.y0) / 240);
    const P = new Pen(f);
    for (const x of [70, 218]) {
      P.line(x, 30, x, 124, C.gold[2]);
      P.part(P.path(`M ${x + 1} 32 L ${x + 14} 36 Q ${x + 12} 66 ${x + 8} 96 L ${x + 1} 94 Z`), x < 100 ? C.blue : C.red, { b: 3 });
    }
    P.part(P.path('M 106 124 Q 110 84 144 80 Q 178 84 182 124 Z'), C.navy, { b: 2 });
    P.part(P.poly([138, 82, 150, 82, 144, 98]), C.grey, { b: 5, sh: 0, hi: 0 });
    P.part(P.poly([142, 84, 146, 84, 147, 100, 144, 104, 141, 100]), C.red, { b: 3, sh: 0, hi: 0 });
    const talk = Math.floor(t * 7) % 3 !== 0;
    if (who === 'max') {
      const m = S.sprite('max', { act: 'head', blink: Math.floor(t * 2) % 7 === 0 }, 1.8);
      blit(f, m.buf, 144 - m.ox, 86 - m.oy);
    } else A.presHead(new Pen(f).at(144, 58, 2.1), 0, 0, { talk });
    P.part(P.poly([116, 104, 172, 104, 176, 124, 112, 124]), C.wood, { b: 2 });
    P.part(P.ell(144, 114, 9, 7), C.gold, { b: 3 });
    P.part(P.ell(144, 114, 5, 4), C.blue, { b: 2, sh: 0, hi: 0 });
    P.line(128, 104, 124, 94, C.grey[1]);
    P.line(160, 104, 164, 94, C.grey[1]);
    P.part(P.ell(124, 93, 2, 2.4), C.grey, { b: 3, sh: 0 });
    P.part(P.ell(164, 93, 2, 2.4), C.grey, { b: 3, sh: 0 });
    caption(f, cap);
  }

  const PROGS = {
    laws(f, t) { lectern(f, t, 'pres', 'ОБРАЩЕНИЕ К НАЦИИ'); },
    hugs(f, t) { lectern(f, t, 'pres', 'ЧЕТВЕРГ: ОБНИМИСЬ'); },
    exam(f, t) { lectern(f, t, 'pres', 'ЭКЗАМЕН НА РАДОСТЬ'); },
    interp(f, t) { lectern(f, t, 'pres', 'НУЖНЫ ПЕРЕВОДЧИКИ'); },
    rerun(f, t) { lectern(f, t, 'pres', 'ПОВТОР'); },
    maxtv(f, t) { lectern(f, t, 'max', 'ПРЕЗИДЕНТ МАКС'); },
    bears(f, t) {
      S.grad(f, screenMask(), C.sky, (x, y) => 0.3 + (y - SCREEN.y0) / 200);
      const P = new Pen(f);
      P.part(P.rect(84, 92, 120, 32), B.WHITE, { b: 2 });
      for (let x = 90; x < 200; x += 12) P.part(P.rect(x, 96, 5, 28), B.WHITE, { b: 1, sh: 0 });
      P.part(P.path('M 116 92 Q 118 56 144 52 Q 170 56 172 92 Z'), B.WHITE, { b: 2 });
      P.part(P.rect(140, 40, 8, 14), B.WHITE, { b: 2 });
      P.line(144, 40, 144, 30, C.grey[2]);
      for (let i = 0; i < 5; i++) S.art103.hypnoBear(new Pen(f), 78 + i * 33, 122 + Math.round(Math.sin(t * 5 + i) * 2), 0.62, { t: t + i });
      caption(f, 'ПОДАРОК КОНГРЕССУ');
    },
    adabe(f, t) {
      S.grad(f, screenMask(), C.cream, (x, y) => 0.5 + (y - SCREEN.y0) / 300);
      const P = new Pen(f);
      B.bunting(P, 52, 236, 20, 7);
      A.lincolnHead(new Pen(f).at(144, 98, 1.6), 0, 0, { talk: Math.floor(t * 5) % 2 === 0 });
      caption(f, 'ЭЙБ. ОН УЖЕ БЫЛ', C.cream[4]);
    },
    admax(f, t) {
      S.grad(f, screenMask(), C.red, (x, y) => 0.3 + (y - SCREEN.y0) / 260);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + t; S.line(f, 144, 78, Math.round(144 + Math.cos(a) * 120), Math.round(78 + Math.sin(a) * 90), C.orange[3]); }
      const m = S.sprite('max', { act: 'head' }, 2.6);
      blit(f, m.buf, 144 - m.ox, 112 - m.oy + (Math.floor(t * 6) % 2));
      caption(f, 'МАКС. ОДИН ЗАКОН', C.grey[5]);
    },
    rampage(f, t) {
      S.grad(f, screenMask(), [C.purple[1], C.plum[2], C.rose[3], C.orange[3]], (x, y) => (y - SCREEN.y0) / 120);
      const P = new Pen(f);
      P.part(P.poly([52, 142, 236, 142, 170, 84, 118, 84]), C.asphalt, { b: 2, sh: 0, hi: 0 });
      for (let i = 0; i < 6; i++) P.part(P.rect(58 + i * 30, 72 - (i % 3) * 6, 20, 14 + (i % 3) * 6), C.night, { b: 1, sh: 0, hi: 0 });
      const step = Math.floor(t * 3) % 2;
      const sp = S.sprite('lincoln', { dir: 's', act: 'rage', walk: (t * 0.7) % 1, anim: step }, 0.55);
      blit(f, sp.buf, 144 - sp.ox, 122 - sp.oy + step);
      P.part(P.rect(54, 22, 46, 12), C.red, { b: 3 });
      font.draw(f, 'СРОЧНО', 58, 24, C.grey[5], 0);
      caption(f, 'МЕМОРИАЛ ИДЁТ НА СЕВЕР');
    }
  };

  CLOSEUPS.tv4 = function (f, g, cu) {
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

  CLOSEUPS.memorial = function (f, g, cu) {
    const t = g.time - cu.t0;
    const bg = cached('memorial104', W, H, (P, b) => {
      fillAll(b, C.stone, (x, y) => 0.25 + y / H * 0.35);
      for (const x of [6, 46, 246, 286]) {
        P.part(P.rect(x, 14, 28, 176), C.cream, { b: 3 });
        for (let i = 1; i < 5; i++) P.line(x + i * 5.6, 18, x + i * 5.6, 186, C.cream[2]);
        P.part(P.rect(x - 3, 8, 34, 8), C.cream, { b: 4, sh: 0 });
      }
      P.part(P.rect(0, 0, W, 10), C.cream, { b: 2, sh: 0 });
      P.part(P.rect(0, 186, W, 14), C.cream, { b: 2, sh: 0, hi: 1 });
      P.part(P.rect(98, 60, 124, 126), C.cream, { b: 2 });
      P.part(P.rect(108, 40, 104, 30), C.cream, { b: 3 });
      S.BG.pool(b, 160, 100, 90, 80, 0.8);
    });
    blit(f, bg, 0, 0);
    const P = new Pen(f);
    const awake = t > 1.4;
    const up = t > 2.6 ? Math.min(1, (t - 2.6) / 1.2) : 0;
    const sp = S.sprite('lincoln', { dir: 's', act: up > 0.6 ? 'point' : '', v: awake ? 'rage' : '', anim: Math.floor(t * 6) % 2 }, 1.05);
    const feet = Math.round(232 - up * 30);
    blit(f, sp.buf, 160 - sp.ox, feet - sp.oy);
    if (up < 1) {
      P.part(P.rect(98, 150 + up * 50, 124, 50), C.cream, { b: 3 });
      P.part(P.rect(88, 132 + up * 60, 22, 68), C.cream, { b: 3 });
      P.part(P.rect(210, 132 + up * 60, 22, 68), C.cream, { b: 3 });
    }
    if (awake && t < 2.6) for (const s of [-1, 1]) for (const k of [0, 1]) S.line(f, 160 + s * 4 + k, feet - 115, 160 + s * (30 + (t - 1.4) * 60) + k, 196, k ? C.orange[3] : C.yellow[3]);
    font.drawCentered(f, 'МЕМОРИАЛ ЛИНКОЛЬНА', 160, 20, C.cream[4]);
  };

  CLOSEUPS.launch = function (f, g, cu) {
    const t = g.time - cu.t0;
    const bg = cached('launch104', W, H, (P, b) => {
      fillAll(b, C.sky, (x, y) => 0.25 + y / H * 0.75);
      for (const [cx, cy, rx] of [[60, 30, 34], [250, 22, 40], [180, 52, 22]]) { S.fill(b, P.ell(cx, cy, rx, rx * 0.26), C.eye); S.fill(b, P.ell(cx + rx * 0.3, cy - 3, rx * 0.5, rx * 0.22), C.eye); }
      for (let i = 0; i < 9; i++) B.tree(b, P, 10 + i * 38, 112 + (i % 2) * 4, 16 + (i % 3) * 3, i + 20);
      P.part(P.rect(0, 120, W, 80), C.green, { b: 2, sh: 0, hi: 0, ol: 0 });
      const pool = P.poly([130, 200, 190, 200, 170, 132, 150, 132]);
      S.grad(b, pool, C.teal, (x, y) => 0.4 + (y - 132) / 160);
      S.outline(b, pool, C.black);
      P.part(P.ell(160, 130, 26, 5), C.stone, { b: 3 });
      P.part(P.ell(160, 130, 17, 3), C.night, { b: 0, sh: 0, hi: 0 });
    });
    blit(f, bg, 0, 0);
    const P = new Pen(f);
    const rise = t > 0.6 ? Math.pow(t - 0.6, 2) * 46 : 0;
    const y = 130 - rise + (t < 0.6 ? Math.round(Math.sin(t * 60)) : 0);
    if (y > -140) {
      if (t > 0.3) flame(P, 160, y, 2.2, t);
      B.obelisk(P, 160, y - 112, y, 11, B.WHITE);
    }
    smoke(P, 160, 134, 14 + Math.min(30, t * 22), t, 9);
    if (cu.n > 1 && t > 2.2) B.obelisk(P, 160, 130 - Math.min(112, (t - 2.2) * 80), 130, 11, B.WHITE);
    font.draw(f, 'ШАХТА 1', 8, 8, C.red[3]);
  };

  function penguin(P, x, y, up) {
    P.part(P.ell(x, y - 7, 4.4, 7.4), C.night, { b: 1 });
    P.part(P.ell(x + 0.6, y - 6, 2.8, 5.4), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(x, y - 15 - (up ? 1 : 0), 3.2, 3), C.night, { b: 1 });
    P.part(P.poly([x + 2, y - 15.6 - (up ? 2 : 0), x + 6, y - 14.6 - (up ? 3 : 0), x + 2, y - 13.6]), C.orange, { b: 3, sh: 0 });
    P.px(x + 1, y - 16 - (up ? 1 : 0), C.eye);
    P.part(P.ell(x - 1.6, y, 2.4, 1.2), C.orange, { b: 3, sh: 0 });
    P.part(P.ell(x + 2.4, y, 2.4, 1.2), C.orange, { b: 3, sh: 0 });
  }

  const IMPACT = {
    antarctica(f, t, cu) {
      fillAll(f, C.sky, (x, y) => 0.4 + y / H * 0.6);
      const P = new Pen(f);
      P.part(P.path('M 0 120 L 40 86 L 70 108 L 120 70 L 170 110 L 230 80 L 280 112 L 320 96 L 320 200 L 0 200 Z'), B.WHITE, { b: 2 });
      P.part(P.rect(0, 140, W, 60), B.WHITE, { b: 3, sh: 0, hi: 0, ol: 0 });
      const hit = cu.phase !== 'fly';
      for (const [x, y] of [[70, 176], [104, 186], [236, 180], [268, 190]]) penguin(P, x, y, hit);
      if (!hit) missile(P, 170, -30 + t * 130, 1.6, t, true);
      else {
        const Q = new Pen(f).at(170, 128, 1.6);
        Q.sy = -1.6;
        B.obelisk(Q, 0, -26, 0, 5, B.WHITE);
        P.part(P.ell(170, 166, 24, 6), B.WHITE, { b: 4, sh: 1 });
        const k = Math.min(1, (t1(cu, t)) / 0.8);
        if (k < 1) smoke(P, 170, 160 - k * 10, 10 + k * 16, t, 7);
      }
    },
    krypton(f, t) {
      S.starfield(f, 17, [C.night[0], C.night[1], C.purple[1], C.night[2]]);
      const P = new Pen(f);
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9, r = 12 + (i % 3) * 9;
        const x = 250 + Math.cos(a) * r * 1.5, y = 50 + Math.sin(a) * r;
        P.part(P.poly([x, y - 6, x + 8, y - 1, x + 3, y + 8, x - 6, y + 2]), C.slime, { b: 2 + (i % 2), sh: 0 });
      }
      font.draw(f, 'КРИПТОН', 230, 96, C.slime[4]);
      const x = 40 + t * 9, y = 150 - t * 3;
      const Q = new Pen(f).at(x, y, 1.3);
      Q.part(Q.poly([-40, -5, -12, -3.1, 0, 0, -12, 3.1, -40, 5]), B.WHITE, { b: 2 });
      Q.part(Q.path(`M -40 -4 Q -${52 + Math.sin(t * 40) * 4} 0 -40 4 Z`), C.orange, { b: 3, sh: 0 });
      font.draw(f, '26 000 000 ЛЕТ', 8, 186, C.mint[4]);
    },
    bosco(f, t, cu) {
      const bg = cached('impactbosco104', W, H, (P, b) => {
        fillAll(b, [C.purple[1], C.plum[2], C.rose[3], C.orange[3]], (x, y) => y / 150);
        const wall = P.rect(60, 96, 200, 104);
        P.part(wall, C.brick, { b: 2 });
        S.BG.bricks(b, wall, 12, 6, C.brick, C.brick[0], 5);
        P.part(P.rect(60, 84, 200, 14), C.red, { b: 2 });
        S.BG.textOn(b, 'НАРОДНЫЙ СКЛАД НЕУДОБСТВ', 82, 87, C.gold[4], 0);
        P.part(P.rect(140, 128, 40, 72), C.wood, { b: 2 });
        P.part(P.rect(78, 120, 46, 40), C.sky, { b: 1 });
        P.part(P.rect(196, 120, 46, 40), C.sky, { b: 1 });
        P.part(P.rect(212, 70, 5, 16), C.grey, { b: 2, sh: 0 });
        P.part(P.ell(214, 62, 18, 12, -0.5), C.grey, { b: 4 });
        P.part(P.ell(216, 61, 13, 8, -0.5), C.grey, { b: 5, sh: 0, hi: 0, ol: C.grey[3] });
        P.line(216, 61, 230, 46, C.grey[1]);
        P.part(P.rect(0, 190, W, 10), C.asphalt, { b: 2, sh: 0, hi: 0, ol: 0 });
      });
      blit(f, bg, 0, 0);
      const P = new Pen(f);
      f.set(230, 46, C.neonB); f.set(231, 45, C.neonB);
      const hit = cu.phase !== 'fly';
      const mx = 110 + Math.min(t, 1.3) * 8, my = -30 + Math.min(t, 1.3) * 46;
      if (!hit) { missile(P, mx, my, 1.4, t, true); return; }
      const k = t1(cu, t);
      if (k < 0.5) for (let i = -1; i <= 1; i++) S.line(f, 230, 46 + i, Math.round(mx), Math.round(my + 20) + i, C.neonB);
      if (k > 0.3 && k < 2) boom(P, mx, my + 20, Math.min(1, (k - 0.3) / 1.2) * 0.5);
      if (k >= 1.4) smoke(P, mx, my + 16, 16, t, 8);
    },
    lincoln(f, t, cu) {
      const bg = cached('impactabe104', W, H, (P, b) => {
        fillAll(b, [C.purple[1], C.plum[2], C.rose[3], C.orange[3], C.yellow[3]], (x, y) => y / 110);
        for (let i = 0; i < 9; i++) {
          const x = i * 38 - 8, h = 20 + (i * 17) % 26;
          P.part(P.rect(x, 110 - h, 30, h), C.night, { b: 1, sh: 0, hi: 0 });
          for (let yy = 114 - h; yy < 106; yy += 7) for (let xx = x + 4; xx < x + 26; xx += 8) b.set(xx, yy, C.cycle[(xx + yy) % 8]);
        }
        P.part(P.rect(0, 108, W, 92), C.olive, { b: 2, sh: 0, hi: 0, ol: 0 });
        P.part(P.poly([130, 108, 190, 108, 300, 200, 20, 200]), C.asphalt, { b: 2, sh: 0, hi: 0 });
        for (let i = 0; i < 5; i++) P.part(P.poly([159 - i, 112 + i * 18, 161 + i, 112 + i * 18, 162 + i * 1.4, 122 + i * 18, 158 - i * 1.4, 122 + i * 18]), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
      });
      blit(f, bg, 0, 0);
      const P = new Pen(f);
      if (cu.phase === 'rubble') {
        for (const [x, y, w, h] of [[60, 168, 40, 22], [96, 176, 30, 18], [200, 170, 46, 24], [238, 180, 30, 16], [130, 182, 60, 14]]) P.part(P.poly([x, y + h, x + 4, y, x + w - 6, y + 3, x + w, y + h]), C.cream, { b: 2 + (x % 2) });
        A.lincolnHead(new Pen(f).at(152, 148, 1.5), 0, 0, { blink: true });
        const ch = S.sprite('agentc', { act: 'sit', dir: 'e' }, 0.9);
        blit(f, ch.buf, 250 - ch.ox, 190 - ch.oy);
        for (let i = 0; i < 3; i++) { const a = t * 3 + i * 2.1; P.part(P.ell(250 + Math.cos(a) * 10, 136 + Math.sin(a) * 3, 1.6, 1.6), C.yellow, { b: 4, sh: 0, hi: 0 }); }
        if (Math.floor(t * 3) % 2) f.set(262, 146, C.neonB);
        smoke(P, 160, 120, 22, t, 8);
        return;
      }
      if (cu.phase === 'hit') {
        boom(P, 160, 110, Math.min(1, t1(cu, t) / 1.6));
        return;
      }
      const step = Math.floor(t * 3) % 2;
      const sp = S.sprite('lincoln', { dir: 's', act: 'rage', walk: (t * 0.7) % 1, anim: step }, 0.95);
      blit(f, sp.buf, 160 - sp.ox, 190 - sp.oy + step);
      const ch = S.sprite('agentc', { act: 'sit', dir: 's' }, 0.45);
      blit(f, ch.buf, 183 - ch.ox, 108 - ch.oy + step);
      if (Math.floor(t * 5) % 2) P.part(P.ell(140, 112 + step, 2.2, 2.2), [C.neonA, C.neonA, C.neonA, C.neonA, C.neonA], { sh: 0, hi: 0 });
      if (t > 2) missile(P, 300 - Math.min(140, (t - 2) * 30), -30 + Math.min(80, (t - 2) * 18), 1.3, t, true);
    }
  };

  function t1(cu, t) { return cu.t1 === undefined ? t : t - (cu.t1 - cu.t0); }

  CLOSEUPS.impact = function (f, g, cu) {
    (IMPACT[cu.target] || IMPACT.antarctica)(f, g.time - cu.t0, cu);
  };

  CLOSEUPS.periscope = function (f, g, cu) {
    const t = g.time - cu.t0;
    const view = cached('periscope104', W, H, (P, b) => {
      fillAll(b, C.sky, (x, y) => 0.4 + y / 120 * 0.5);
      P.part(P.rect(96, 52, 128, 44), B.WHITE, { b: 2 });
      P.part(P.poly([130, 52, 160, 36, 190, 52]), B.WHITE, { b: 2 });
      for (const x of [140, 152, 166, 178]) P.part(P.rect(x, 56, 3, 38), B.WHITE, { b: 1, sh: 0 });
      P.part(P.rect(0, 94, W, 16), C.green, { b: 2, sh: 0, hi: 0, ol: 0 });
      const water = P.rect(0, 108, W, 92);
      S.grad(b, water, C.teal, (x, y) => 0.35 + (y - 108) / 200 + (S.hash(x >> 2, y, 6) < 0.18 ? 0.15 : 0));
    });
    blit(f, view, 0, 0);
    const P = new Pen(f);
    const bob = Math.round(Math.sin(t * 2) * 2);
    P.part(P.ell(190, 132 + bob, 46, 12), C.red, { b: 3 });
    const j = S.sprite('jimmy', { dir: 'w', talk: Math.floor(t * 7) % 3 === 0 ? 1 : 0 }, 3);
    blit(f, j.buf, 190 - j.ox, 136 + bob - j.oy);
    P.part(P.path(`M 144 ${132 + bob} Q 190 ${150 + bob} 236 ${132 + bob} L 236 ${136 + bob} Q 190 ${156 + bob} 144 ${136 + bob} Z`), C.red, { b: 2, sh: 0 });
    P.part(P.poly([214, 100 + bob, 226, 100 + bob, 222, 116 + bob, 218, 116 + bob]), C.orange, { b: 3 });
    P.line(220, 100 + bob, 224, 88 + bob, C.grey[5]);
    P.part(P.ell(224, 86 + bob, 5, 2), C.pink, { b: 3, sh: 0 });
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const d = Math.hypot(x - 160, (y - 100) * 1.15);
      if (d > 96) f.px[y * W + x] = C.black;
      else if (d > 93) f.px[y * W + x] = C.grey[1];
    }
    for (let i = -80; i <= 80; i += 8) { f.set(160 + i, 100, C.black); f.set(160, 100 + Math.round(i * 0.8), C.black); }
    font.draw(f, 'ПЕРИСКОП', 8, 8, C.mint[4]);
  };

  const TITLE_ITEMS = ['Новая игра', 'Продолжить', 'Загрузить', 'Настройки', 'Выход'];

  E.TITLE = {
    items: TITLE_ITEMS,
    draw(f, t, hover, enabled) {
      const back = cached('title104', W, H, (P, b) => {
        fillAll(b, [C.night[1], C.blue[1], C.blue[2], C.sky[1], C.sky[2]], (x, y) => y / 170);
        for (let i = 0; i < 40; i++) b.set(Math.floor(S.hash(i, 41, 1) * W), Math.floor(S.hash(i, 41, 2) * 90), C.grey[5]);
        B.obelisk(P, 306, 96, 172, 5, B.WHITE);
      });
      const house = cached('titlehouse104', W, H, P => {
        P.part(P.rect(150, 132, 170, 40), B.WHITE, { b: 2 });
        P.part(P.rect(206, 120, 58, 52), B.WHITE, { b: 1, sh: 0 });
        P.part(P.poly([200, 120, 235, 104, 270, 120]), B.WHITE, { b: 2 });
        for (const x of [210, 224, 242, 256]) P.part(P.rect(x, 122, 4, 50), B.WHITE, { b: 2, sh: 0 });
        for (const x of [158, 172, 186, 278, 292]) P.part(P.rect(x, 140, 8, 12), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
        P.part(P.rect(0, 172, W, 28), C.green, { b: 1, sh: 0, hi: 0, ol: 0 });
      });
      blit(f, back, 0, 0);
      const step = Math.floor(t * 1.5) % 2;
      const abe = S.sprite('lincoln', { dir: 's', act: 'rage', anim: Math.floor(t * 6) % 2 }, 0.8);
      blit(f, abe.buf, 236 - abe.ox, 176 - abe.oy + step);
      blit(f, house, 0, 0);
      S.BG.pool(f, 246, 190, 80, 14, 1.2);
      const sam = S.sprite('sam', { dir: 'w', talk: Math.floor(t * 0.5) % 4 === 1 && Math.floor(t * 8) % 2 === 0 ? 1 : 0, blink: Math.floor(t * 2) % 9 === 0 }, 1.35);
      const max = S.sprite('max', { dir: 'w', act: 'grin', walk: -1 }, 1.35);
      blit(f, sam.buf, 286 - sam.ox, 196 - sam.oy);
      blit(f, max.buf, 238 - max.ox, 196 - max.oy - (Math.floor(t * 2.5) % 2 ? 3 : 0));
      S.bigText(f, 'SAM & MAX', 100, 10, 3, C.orange[3], C.yellow[4], 2);
      S.bigText(f, 'ЭЙБ ЛИНКОЛЬН', 100, 38, 2, C.grey[5], C.eye, 1);
      S.bigText(f, 'ДОЛЖЕН УМЕРЕТЬ!', 100, 56, 2, C.red[3], C.orange[4], 1);
      font.drawCentered(f, 'ЭПИЗОД 104', 100, 77, C.sky[4]);
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
    ['SAM & MAX', 3], ['ЭЙБ ЛИНКОЛЬН', 2], ['ДОЛЖЕН УМЕРЕТЬ!', 2], ['', 1],
    ['По комиксам Стива Пёрселла', 1], ['', 1],
    ['Сэм, собака в костюме', 1], ['Макс, президент Соединённых Штатов', 1], ['', 1],
    ['В ролях', 2], ['Президент в роли куклы', 1], ['Чаклз в роли Папы-Медведя', 1], ['Агент Суперболл в роли двери', 1], ['Мемориал Линкольна в роли кандидата', 1], ['Губернаторы трёх Дакот', 1], ['В. И. Босковорский, ранее Боско', 1], ['Сибил Пандемик, даты на заказ', 1], ['Хью Блисс в роли радуги', 1], ['Джимми Два Зуба в отпуске', 1], ['Сержант Жучок в роли голоса', 1], ['', 1],
    ['Графика', 2], ['320 на 200 точек, 256 цветов', 1], ['и один оттенок мрамора', 1], ['', 1],
    ['Музыка', 2], ['Хор Секретной службы', 1], ['', 1],
    ['При съёмках израсходовано', 1], ['три монумента Вашингтона.', 1], ['Пингвины не пострадали.', 1], ['', 1],
    ['КОНЕЦ ЭПИЗОДА 104', 2], ['Продолжение следует...', 1]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
