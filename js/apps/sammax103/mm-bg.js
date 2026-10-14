(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade, line, hash } = S;
  const BG = S.BG;
  const E = S.EP103;
  const L = E.LAYERS;
  const A = S.art103;
  const { vgrad, pool, dropShadow, textOn, sprite, vignette } = BG;
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];

  function star(P, cx, cy, r1, r2, ramp, b) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1; pts.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); }
    P.part(P.poly(pts), ramp, { b: b === undefined ? 3 : b });
  }

  function starWall(buf, m, ramp, seed) {
    m.each((x, y) => {
      const u = (x + 1000) % 26, v = (y + (Math.floor((x + 1000) / 26) % 2) * 13) % 26;
      const d = Math.abs(u - 13) + Math.abs(v - 13);
      if (d < 2.5 || (d < 4 && (u === 13 || v === 13))) buf.set(x, y, ramp[4]);
      else if (hash(x >> 1, y >> 1, seed) < 0.04) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]);
    });
  }

  function candyCarpet(buf, m, base, seed) {
    const cols = [C.pink[3], C.gold[4], C.sky[4], C.mint[4]];
    m.each((x, y) => {
      const k = (y - 110) / 90;
      const u = (x - 240) / Math.max(0.3, k), v = Math.log(Math.max(1, y - 112)) * 9;
      const cu = Math.floor((u + 4000) / 30), cv = Math.floor(v);
      const lu = ((u + 4000) % 30) / 30, lv = v - cv;
      let c = (cu + cv) % 2 ? base[2] : base[1];
      const dx = lu - 0.5, dy = (lv - 0.5) * 1.3;
      const r = Math.sqrt(dx * dx + dy * dy);
      if (r < 0.3) {
        const a = Math.atan2(dy, dx) + r * 18;
        c = Math.floor(a / 1.2 + 10) % 2 ? cols[Math.floor(hash(cu, cv, seed) * 4)] : base[4];
      }
      buf.set(x, y, c);
    });
  }

  BG.playland = function (buf) {
    const P = new Pen(buf);
    const W = 480;
    part(buf, P.rect(0, 0, W, 14), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
    for (let i = 0; i < 40; i++) buf.set(Math.floor(hash(i, 3, 1) * W), 1 + Math.floor(hash(i, 3, 2) * 11), hash(i, 3, 3) > 0.5 ? C.lamp : C.pink[4]);
    line(buf, 0, 13, W, 13, C.black);
    const wall = P.rect(0, 14, W, 116);
    vgrad(buf, wall, C.purple, 14, 130, 0.25, 0.6);
    starWall(buf, wall, C.purple, 5);
    part(buf, P.rect(0, 108, W, 22), C.plum, { b: 2 });
    for (let x = 6; x < W; x += 24) part(buf, P.rect(x, 112, 18, 14), C.plum, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(0, 106, W, 3), C.gold, { b: 3, sh: 0 });
    const floor = P.rect(0, 130, W, 70);
    candyCarpet(buf, floor, C.purple, 7);
    shade(buf, floor, 0, (x, y) => Math.max(0, (146 - y) / 18));
    part(buf, P.rect(0, 128, W, 3), C.gold, { b: 2, sh: 0, hi: 0 });
    const out = P.path('M 22 138 L 22 104 Q 22 84 44 84 Q 66 84 66 104 L 66 138 Z');
    vgrad(buf, out, [C.night[0], C.night[1], C.night[2], C.purple[1]], 84, 138, 0, 1);
    for (let i = 0; i < 9; i++) buf.set(24 + Math.floor(hash(i, 8, 1) * 40), 86 + Math.floor(hash(i, 8, 2) * 20), C.grey[5]);
    part(buf, P.rect(28, 118, 4, 20), C.grey, { b: 1, sh: 0, hi: 0 });
    part(buf, P.ell(30, 116, 3, 2), LAMP, { sh: 0, hi: 0 });
    part(buf, P.rect(40, 122, 26, 16), C.night, { b: 2, sh: 0, hi: 0 });
    for (let i = 0; i < 4; i++) buf.set(44 + i * 5, 126, C.lamp);
    const head = { head: C.oak, hb: 3, face: C.cream };
    for (const s of [-1, 1]) {
      part(buf, P.ell(44 + s * 32, 22, 13, 12.5), C.oak, { b: 3 });
      part(buf, P.ell(44 + s * 32, 23, 7.5, 7), C.cream, { b: 3, sh: 0, hi: 0, ol: 0 });
    }
    const face = P.path('M 4 138 Q 0 70 10 40 Q 44 18 78 40 Q 88 70 84 138 L 66 138 L 66 104 Q 66 84 44 84 Q 22 84 22 104 L 22 138 Z');
    part(buf, face, head.head, { b: 3 });
    const muzzle = P.path('M 12 132 Q 8 80 22 58 Q 34 52 44 64 Q 54 52 66 58 Q 80 80 76 132 L 66 132 L 66 104 Q 66 82 44 82 Q 22 82 22 104 L 22 132 Z');
    part(buf, muzzle, C.cream, { b: 4, sh: 1, ol: C.cream[1] });
    for (const s of [-1, 1]) {
      const ex = 44 + s * 17, ey = 50;
      part(buf, P.ell(ex, ey, 10, 11), C.eye, { sh: 0, hi: 0 });
      part(buf, P.ell(ex - s * 2, ey + 2, 3, 3.4), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
      buf.set(ex - s * 2 + 1, ey, C.eye);
      for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + s * (0.5 + k * 0.36); line(buf, ex + Math.cos(a) * 10, ey + Math.sin(a) * 11, ex + Math.cos(a) * 15, ey + Math.sin(a) * 16, C.black); }
    }
    part(buf, P.ell(44, 70, 7, 4.5), C.night, { b: 1, sh: 0 });
    buf.set(41, 68, C.grey[4]); buf.set(42, 68, C.grey[4]);
    part(buf, P.rect(36, 82, 7, 10), C.eye, { sh: 0, hi: 0, ol: C.grey[2] });
    part(buf, P.rect(45, 82, 7, 10), C.eye, { sh: 0, hi: 0, ol: C.grey[2] });
    part(buf, P.rect(96, 26, 44, 26), C.red, { b: 3 });
    part(buf, P.rect(98, 28, 40, 22), C.cream, { b: 4, sh: 0, hi: 0 });
    textOn(buf, 'БЕЗ', 108, 29, C.red[2], 0);
    textOn(buf, 'МАФИИ!', 100, 39, C.red[2], 0);
    part(buf, P.rect(246, 76, 32, 36), C.oak, { b: 2 });
    part(buf, P.rect(248, 78, 28, 32), C.cream, { b: 4, sh: 0, hi: 0 });
    textOn(buf, 'КАК', 252, 79, C.red[2], 0);
    for (let i = 0; i < 5; i++) line(buf, 251, 90 + i * 3.6, 272, 90 + i * 3.6, C.cream[1]);
    const heads = [[284, 'guard'], [334, 'chuckles'], [384, 'cuddly']];
    for (const [x, v] of heads) {
      star(P, x, 46, 30, 14, C.gold, 3);
      const cfg = Object.assign({}, A.MOB[v], { hat: null });
      A.bearMask(new Pen(buf).at(x, 50, 0.72), 0, 0, cfg, {});
    }
    for (let i = 0; i < 6; i++) {
      const x = 272 + i * 24, y = 16 + (i % 2) * 6;
      line(buf, x, 14, x, y, C.grey[3]);
      star(P, x, y + 3, 4, 2, C.gold, 4);
    }
    part(buf, P.path('M 454 14 Q 470 20 468 34 Q 460 26 450 28 Q 460 22 454 14 Z'), C.yellow, { b: 4 });
    part(buf, P.rect(416, 36, 64, 16), C.night, { b: 1 });
    textOn(buf, 'КАЗИНО', 424, 39, C.neonA, C.black);
    part(buf, P.rect(420, 54, 58, 86), C.night, { b: 0, sh: 0, hi: 0 });
    vgrad(buf, P.rect(424, 58, 50, 80), [C.purple[0], C.purple[1], C.plum[2], C.red[2], C.gold[3]], 58, 138, 0, 1);
    for (const [x0, dir] of [[420, 1], [478, -1]]) {
      part(buf, P.path(`M ${x0} 52 L ${x0 + dir * 22} 52 Q ${x0 + dir * 12} 90 ${x0 + dir * 8} 138 L ${x0} 138 Z`), C.purple, { b: 2 });
      for (let i = 1; i < 4; i++) line(buf, x0 + dir * i * 5, 54, x0 + dir * (i * 2.6), 136, C.purple[1]);
    }
    part(buf, P.rect(416, 50, 64, 4), C.gold, { b: 3, sh: 0 });
    for (const [x, c] of [[298, C.pink], [314, C.sky], [388, C.mint], [404, C.gold]]) {
      line(buf, x, 110, x + 2, 76, C.grey[4]);
      part(buf, P.ell(x + 2, 70, 6, 7.5), c, { b: 3 });
      buf.set(x, 66, C.grey[5]);
    }
    pool(buf, 44, 150, 50, 14, 0.9);
    pool(buf, 140, 30, 60, 40, 0.6);
    pool(buf, 334, 50, 110, 50, 0.7);
    pool(buf, 200, 150, 80, 14, 0.6);
    dropShadow(buf, 142, 150, 22, 3);
    dropShadow(buf, 202, 151, 24, 3);
    vignette(buf, 0.35, 240, 100);
  };

  Object.assign(L, {
    playland: {
      caseGlass: g => sprite(40, 70, (P, b) => {
        const stolen = g && g.f.meatStolen;
        P.part(P.rect(6, 40, 28, 30), C.gold, { b: 3 });
        P.part(P.rect(9, 44, 22, 22), C.gold, { b: 2, sh: 1, hi: 1 });
        textOn(b, 'ОРИГ.', 10, 50, C.gold[0], 0);
        P.part(P.rect(3, 36, 34, 5), C.gold, { b: 4, sh: 0 });
        const glass = P.rect(5, 4, 30, 32);
        S.grad(b, glass, C.sky, (x, y) => 0.55 + (y - 4) / 90 + (hash(x, y, 9) - 0.5) * 0.08);
        if (!stolen) {
          P.part(P.path('M 9 30 Q 10 22 20 21 Q 30 22 31 30 Z'), C.oak, { b: 3 });
          for (const cx of [13, 20, 27]) P.part(P.ell(cx, 31, 3.4, 2.6), C.brick, { b: 2 });
          P.part(P.path('M 9 32 Q 20 30 31 32 L 30 35 Q 20 37 10 35 Z'), C.oak, { b: 3 });
          P.part(P.rect(10, 32, 20, 1.2), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
        } else {
          P.part(P.ell(20, 32, 11, 2.2), C.grey, { b: 5, sh: 0 });
          for (let i = 0; i < 5; i++) b.set(12 + i * 4, 30 + (i % 2), C.oak[3]);
        }
        for (let i = 0; i < 3; i++) P.line(8 + i * 4, 34, 18 + i * 4, 6, C.sky[4]);
        S.outerLine(b, glass, C.black);
        P.part(P.rect(3, 0, 34, 5), C.gold, { b: 3 });
      }),
      whack: g => sprite(60, 98, (P, b) => {
        P.part(P.rect(11, 16, 38, 82), C.red, { b: 2 });
        P.part(P.rect(0, 1, 60, 19), C.gold, { b: 3 });
        textOn(b, 'ПРИХЛОПНИ', 4, 2, C.red[2], 0);
        textOn(b, 'КРЫСУ!', 15, 10, C.red[2], 0);
        P.part(P.rect(15, 24, 30, 26), C.grey, { b: 0 });
        const t = g ? g.time : 0;
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
          const hx = 20 + c * 10, hy = 32 + r * 11;
          P.part(P.ell(hx, hy + 3, 3.6, 1.6), C.night, { b: 0, sh: 0, hi: 0, ol: 0 });
          if (Math.floor(t * 2 + c * 3 + r * 5) % 5 === 0) P.part(P.ell(hx, hy, 2.6, 2.8), C.orange, { b: 3, sh: 0 });
        }
        P.part(P.rect(15, 54, 30, 10), C.red, { b: 3, sh: 1 });
        P.part(P.rect(27, 57, 6, 3), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
        textOn(b, '1 Ж', 19, 66, C.gold[4], C.black);
        P.part(P.rect(15, 78, 30, 14), C.red, { b: 1, sh: 1 });
        P.part(P.cap(45, 46, 51, 60, 1.6), C.grey, { b: 4, sh: 0 });
        P.part(P.poly([47, 38, 53, 42, 49, 48, 43, 44]), C.grey, { b: 2 });
      }),
      pit: () => sprite(112, 34, (P, b) => {
        P.part(P.path('M 2 30 L 6 6 Q 56 0 106 6 L 110 30 Q 56 34 2 30 Z'), C.sky, { b: 2 });
        const cols = [C.red, C.gold, C.blue, C.green, C.pink];
        for (let i = 0; i < 90; i++) {
          const x = 8 + hash(i, 4, 1) * 96, y = 7 + hash(i, 4, 2) * 12;
          P.part(P.ell(x, y, 2.6, 2.4), cols[i % 5], { b: 3, sh: 0 });
        }
        P.part(P.rect(4, 18, 104, 12), C.sky, { b: 3, sh: 1, hi: 0 });
        P.part(P.rect(34, 19, 44, 10), C.gold, { b: 4, sh: 0, hi: 0 });
        textOn(b, 'ШАРИКИ', 37, 20, C.red[2], 0);
      })
    }
  });

  function brassBust(buf, P, cx, cy) {
    const head = { head: C.gold, hb: 2, face: C.gold };
    const Q = new Pen(buf).at(cx, cy, 1.55);
    A.bearMask(Q, 0, 0, head, {});
    part(buf, P.ell(cx, cy + 1.5, 6.5, 5.6), C.grey, { b: 5, sh: 1, hi: 0 });
    part(buf, P.ell(cx - 1.6, cy - 0.4, 2.2, 1.8), C.eye, { sh: 0, hi: 0, ol: 0 });
    buf.set(cx + 2, cy + 3, C.grey[2]); buf.set(cx + 3, cy + 2, C.grey[2]);
    part(buf, P.path(`M ${cx - 24} ${cy + 26} Q ${cx - 26} ${cy + 36} ${cx - 18} ${cy + 40} L ${cx + 18} ${cy + 40} Q ${cx + 26} ${cy + 36} ${cx + 24} ${cy + 26} Q ${cx} ${cy + 20} ${cx - 24} ${cy + 26} Z`), C.gold, { b: 2 });
    part(buf, P.rect(cx - 16, cy + 40, 32, 30), C.stone, { b: 3 });
    part(buf, P.rect(cx - 19, cy + 40, 38, 4), C.stone, { b: 4, sh: 0 });
    part(buf, P.rect(cx - 19, cy + 66, 38, 4), C.stone, { b: 2, sh: 0 });
    part(buf, P.rect(cx - 12, cy + 50, 24, 9), C.gold, { b: 3, sh: 0 });
    textOn(buf, 'ТЕД', cx - 8, cy + 51, C.gold[0], 0);
  }

  BG.casino = function (buf) {
    const P = new Pen(buf);
    const W = 480;
    const wall = P.rect(0, 0, W, 128);
    vgrad(buf, wall, C.night, 0, 128, 0.35, 0.8);
    wall.each((x, y) => { if ((x + 1000) % 22 < 2) buf.set(x, y, C.purple[1]); });
    for (let x = 11; x < W; x += 22) for (let y = 34; y < 104; y += 14) {
      part(buf, P.poly([x, y - 4, x + 3, y, x, y + 4, x - 3, y]), C.purple, { b: 2, sh: 0, hi: 0, ol: 0 });
    }
    part(buf, P.rect(0, 0, W, 8), C.purple, { b: 1, sh: 0, hi: 0 });
    part(buf, P.rect(0, 8, W, 3), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(0, 104, W, 24), C.wood, { b: 1 });
    for (let x = 4; x < W; x += 20) part(buf, P.rect(x, 108, 14, 16), C.wood, { b: 1, sh: 1, hi: 1 });
    part(buf, P.rect(0, 102, W, 3), C.gold, { b: 3, sh: 0 });
    const floor = P.rect(0, 128, W, 72);
    floor.each((x, y) => {
      const k = (y - 100) / 100;
      const u = (x - 240) / Math.max(0.3, k), v = Math.log(Math.max(1, y - 110)) * 8;
      const cu = Math.floor((u + 4000) / 26), cv = Math.floor(v);
      const lu = ((u + 4000) % 26) / 26 - 0.5, lv = v - cv - 0.5;
      const dia = Math.abs(lu) + Math.abs(lv) < 0.22;
      buf.set(x, y, dia ? C.gold[2] : (cu + cv) % 2 ? C.red[1] : C.plum[1]);
    });
    shade(buf, floor, 0, (x, y) => Math.max(0, (144 - y) / 20));
    part(buf, P.rect(0, 126, W, 3), C.gold, { b: 2, sh: 0, hi: 0 });
    part(buf, P.rect(0, 38, 44, 92), C.night, { b: 0, sh: 0, hi: 0 });
    vgrad(buf, P.rect(4, 42, 36, 86), [C.purple[1], C.purple[2], C.pink[2], C.gold[3]], 42, 128, 0, 1);
    part(buf, P.path('M 0 36 L 16 36 Q 10 80 8 128 L 0 128 Z'), C.purple, { b: 2 });
    part(buf, P.path('M 44 36 L 30 36 Q 36 80 40 128 L 44 128 Z'), C.purple, { b: 2 });
    part(buf, P.rect(0, 32, 46, 5), C.gold, { b: 3, sh: 0 });
    brassBust(buf, P, 84, 60);
    S.bigText(buf, 'КАЗИНО', 228, 14, 2, C.pink[3], C.pink[4], 1);
    for (let i = 0; i < 13; i++) { buf.set(156 + i * 12, 12, C.lamp); buf.set(156 + i * 12, 32, C.lamp); }
    part(buf, P.rect(192, 42, 64, 44), C.gold, { b: 2 });
    const pic = P.rect(196, 46, 56, 36);
    vgrad(buf, pic, C.green, 46, 82, 0.2, 0.5);
    part(buf, P.ell(224, 76, 22, 5), C.green, { b: 1, sh: 0, hi: 0 });
    for (let i = 0; i < 3; i++) {
      const cfg = [A.MOB.lovey, A.MOB.cuddly, A.MOB.guard][i];
      A.bearMask(new Pen(buf).at(206 + i * 18, 64, 0.34), 0, 0, Object.assign({}, cfg, { hat: null }), {});
      part(buf, P.rect(202 + i * 18, 70, 8, 5), [C.stone, C.plum, C.grey][i], { b: 3, sh: 0, hi: 0 });
    }
    for (let i = 0; i < 4; i++) buf.set(212 + i * 6, 78, C.grey[5]);
    for (const cx of [150, 330]) {
      line(buf, cx, 11, cx, 20, C.gold[2]);
      part(buf, P.path(`M ${cx - 16} 22 L ${cx + 16} 22 L ${cx + 10} 32 L ${cx - 10} 32 Z`), C.gold, { b: 3 });
      for (let i = 0; i < 5; i++) part(buf, P.ell(cx - 12 + i * 6, 34, 1.6, 3), C.sky, { b: 4, sh: 0, hi: 0 });
      pool(buf, cx, 34, 36, 22, 1);
    }
    part(buf, P.rect(404, 44, 44, 96), C.oak, { b: 1 });
    part(buf, P.rect(408, 48, 36, 90), C.wood, { b: 2 });
    part(buf, P.rect(412, 54, 28, 34), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(412, 94, 28, 38), C.wood, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(418, 62, 16, 4), C.night, { b: 0, sh: 0, hi: 0 });
    part(buf, P.ell(438, 94, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    part(buf, P.rect(400, 24, 52, 18), C.red, { b: 2 });
    textOn(buf, 'ТОЛЬКО', 410, 25, C.gold[4], 0);
    textOn(buf, 'ДЛЯ СЕМЬИ', 403, 33, C.gold[4], 0);
    pool(buf, 84, 60, 40, 40, 0.7);
    pool(buf, 240, 150, 110, 26, 0.9);
    pool(buf, 426, 90, 30, 50, 0.4);
    vignette(buf, 0.5, 240, 110);
  };

  Object.assign(L, {
    casino: {
      table: () => sprite(160, 46, (P, b) => {
        P.part(P.ell(80, 16, 78, 15), C.wood, { b: 2 });
        P.part(P.ell(80, 15, 72, 12), C.green, { b: 2, sh: 0, hi: 0 });
        P.part(P.ell(80, 15, 60, 9), C.green, { b: 1, sh: 0, hi: 0, ol: C.green[3] });
        P.part(P.rect(60, 28, 40, 18), C.wood, { b: 1 });
        P.part(P.ell(80, 44, 26, 3), C.wood, { b: 1, sh: 0 });
        for (let i = 0; i < 5; i++) P.part(P.ell(120 + (i % 2) * 5, 13 - i * 1.6, 5, 2), C.gold, { b: 3, sh: 0 });
        P.part(P.ell(36, 16, 3.5, 1.6), C.gold, { b: 3, sh: 0 });
        P.part(P.rect(74, 8, 7, 9), C.grey, { b: 5, sh: 0, hi: 0 });
        P.part(P.rect(84, 8, 7, 9), C.red, { b: 2, sh: 0, hi: 0 });
      }),
      buffet: g => sprite(64, 44, (P, b) => {
        P.part(P.rect(2, 12, 60, 30), C.grey, { b: 5 });
        for (let x = 4; x < 60; x += 6) P.line(x, 26, x + 2, 41, C.grey[3]);
        P.part(P.rect(0, 10, 64, 5), C.grey, { b: 4, sh: 0 });
        P.part(P.ell(12, 8, 9, 3), C.grey, { b: 3 });
        for (let i = 0; i < 4; i++) P.part(P.cap(6 + i * 4, 6, 8 + i * 4, 4, 1.3), C.oak, { b: 3, sh: 0 });
        P.part(P.ell(32, 8, 9, 3), C.grey, { b: 3 });
        for (let i = 0; i < 5; i++) P.part(P.ell(26 + i * 3, 6 - (i % 2), 1.8, 1.6), C.brick, { b: 2, sh: 0 });
        P.part(P.ell(52, 8, 9, 3), C.grey, { b: 3 });
        P.curve('M 45 7 Q 50 3 52 7 Q 55 3 59 7', C.cheese[3]);
        P.part(P.rect(15, 17, 34, 10), C.red, { b: 3, sh: 0 });
        textOn(b, 'СЕМЬЯ', 18, 18, C.gold[4], 0);
        if (g && g.f.bugPlaced && !g.f.passwordKnown) { b.set(60, 12, C.fur[1]); b.set(61, 12, C.fur[1]); b.set(62, 11, C.fur[0]); }
      }),
      slot: g => sprite(34, 84, (P, b) => {
        const armless = g && g.f.meatStolen && !g.f.armBack;
        P.part(P.rect(2, 10, 26, 72), C.red, { b: 2 });
        P.part(P.path('M 0 12 Q 15 -2 30 12 Z'), C.red, { b: 3 });
        A.bearMask(new Pen(b).at(15, 12, 0.3), 0, 0, Object.assign({}, A.MOB.ted, { hat: null }), {});
        P.part(P.rect(5, 22, 20, 12), C.grey, { b: 5, sh: 0, hi: 0 });
        for (let i = 0; i < 3; i++) P.line(11 + i * 6, 22, 11 + i * 6, 33, C.grey[2]);
        P.part(P.ell(8, 28, 1.6, 1.8), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
        P.part(P.ell(14, 28, 1.6, 1.8), C.gold, { b: 3, sh: 0, hi: 0, ol: 0 });
        P.part(P.ell(20, 28, 1.6, 1.8), C.purple, { b: 3, sh: 0, hi: 0, ol: 0 });
        textOn(b, 'ТЕД', 7, 38, C.gold[4], C.black);
        P.part(P.rect(6, 50, 18, 6), C.grey, { b: 1 });
        P.part(P.rect(9, 52, 12, 2), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
        P.part(P.rect(4, 64, 22, 10), C.grey, { b: 3, sh: 1 });
        P.part(P.rect(26, 30, 5, 8), C.grey, { b: 2 });
        if (!armless) {
          P.part(P.cap(30, 34, 31, 14, 1.2), C.grey, { b: 4, sh: 0 });
          P.part(P.ell(31, 12, 2.8, 2.8), C.red, { b: 3 });
        }
      })
    }
  });

  S.art103.star = star;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
