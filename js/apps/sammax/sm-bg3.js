(function (S) {
  'use strict';
  const { C, Pen, part, grad, shade, line, hash } = S;
  const BG = S.BG, LAYERS = S.LAYERS;
  const { vgrad, planks, pool, dropShadow, textOn, sprite, vignette } = BG;

  BG.sybil = function (buf, o) {
    o = o || {};
    const P = new Pen(buf);
    const dream = !!o.dream;
    const wallR = dream ? C.teal : C.plum;
    const wall = P.poly([0, 0, 320, 0, 320, 122, 0, 122]);
    vgrad(buf, wall, wallR, 0, 122, 0.2, 0.6);
    wall.each((x, y) => {
      const u = (x + 1000) % 18, v = (y + (Math.floor((x + 1000) / 18) % 2) * 11) % 22;
      if ((u - 9) * (u - 9) / 16 + (v - 11) * (v - 11) / 36 < 1 && (u - 9) * (u - 9) / 9 + (v - 11) * (v - 11) / 20 > 1) buf.set(x, y, S.DARKER[buf.px[y * buf.w + x]]);
    });
    part(buf, P.rect(0, 0, 320, 7), wallR, { b: 1, sh: 0, hi: 0 });
    part(buf, P.rect(0, 96, 320, 4), C.oak, { b: 3, sh: 0 });
    const floor = P.poly([0, 122, 320, 122, 320, 200, 0, 200]);
    planks(buf, floor, 160, 30, dream ? C.lilac : C.oak, { step: 18 });
    part(buf, P.rect(0, 118, 320, 5), C.oak, { b: 1, sh: 0, hi: 1 });
    const rug = P.ell(160, 162, 118, 26);
    part(buf, rug, dream ? C.pink : C.red, { b: 2 });
    part(buf, P.ell(160, 162, 104, 20), dream ? C.pink : C.red, { b: 3, sh: 0, hi: 0 });
    part(buf, P.ell(160, 162, 80, 14), C.gold, { b: 2, sh: 0, hi: 0 });
    part(buf, P.ell(160, 162, 70, 11), dream ? C.pink : C.red, { b: 2, sh: 0, hi: 0 });
    part(buf, P.rect(4, 36, 38, 112), C.oak, { b: 2 });
    part(buf, P.rect(8, 40, 30, 50), C.oak, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(8, 94, 30, 50), C.oak, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(35, 94, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    const dips = [[56, 26, 'ПСИХОЛОГ'], [84, 22, 'ТАТУ'], [112, 28, 'ПОГРУЗЧИК'], [140, 24, 'СОМЕЛЬЕ']];
    for (const [x, y] of dips) {
      part(buf, P.rect(x, y, 24, 18), C.gold, { b: 3 });
      part(buf, P.rect(x + 2, y + 2, 20, 14), C.cream, { b: 4, sh: 0, hi: 0 });
      for (let i = 0; i < 3; i++) line(buf, x + 5, y + 6 + i * 3, x + 19, y + 6 + i * 3, C.cream[1]);
      part(buf, P.ell(x + 18, y + 14, 2, 2), C.red, { b: 3, sh: 0, hi: 0 });
    }
    part(buf, P.rect(170, 22, 50, 98), C.wood, { b: 2 });
    for (let s = 0; s < 4; s++) {
      const y = 28 + s * 22;
      part(buf, P.rect(172, y + 18, 46, 3), C.wood, { b: 1, sh: 0 });
      for (let i = 0; i < 9; i++) {
        const h = 11 + Math.floor(hash(i, s, 2) * 6);
        const r = [C.red, C.blue, C.green, C.gold, C.purple][(i + s * 2) % 5];
        P.part(P.rect(174 + i * 5, y + 18 - h, 4.5, h), r, { b: 2, sh: 0, hi: 1 });
      }
    }
    const win = P.rect(232, 26, 40, 54);
    grad(buf, win, dream ? C.purple : C.sky, (x, y) => 0.2 + (y - 26) / 80);
    for (let i = 0; i < 12; i++) part(buf, P.rect(232, 26 + i * 4, 40, 2), dream ? C.lilac : C.cream, { b: 3, sh: 0, hi: 0, ol: C.cream[0] });
    S.outerLine(buf, win, C.black);
    part(buf, P.rect(228, 80, 48, 4), C.oak, { b: 3 });
    part(buf, P.rect(282, 30, 34, 90), dream ? C.lilac : C.oak, { b: 2 });
    part(buf, P.rect(286, 34, 26, 38), dream ? C.lilac : C.oak, { b: 2, sh: 1, hi: 1 });
    part(buf, P.rect(286, 76, 26, 40), dream ? C.lilac : C.oak, { b: 2, sh: 1, hi: 1 });
    part(buf, P.ell(288, 78, 1.8, 1.8), C.gold, { b: 3, sh: 0 });
    part(buf, P.poly([248, 120, 262, 120, 260, 104, 250, 104]), C.brick, { b: 3 });
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.38;
      P.part(P.cap(255, 104, 255 + Math.cos(a) * 18, 104 + Math.sin(a) * 22, 2.5, 1), C.green, { b: 2, sh: 0 });
    }
    pool(buf, 206, 74, 36, 40, 0.8);
    pool(buf, 160, 150, 120, 30, 0.6);
    if (!dream) vignette(buf, 0.9);
  };

  Object.assign(LAYERS, {
    sybil: {
      couch: g => sprite(100, 44, P => {
        const r = g && g.fx.dream ? C.pink : C.teal;
        P.part(P.path('M 4 26 Q 2 8 14 6 Q 20 6 22 18 L 90 20 Q 96 20 96 28 L 96 36 L 4 36 Z'), r, { b: 2 });
        P.part(P.poly([22, 20, 94, 22, 94, 30, 22, 30]), r, { b: 3 });
        P.part(P.rect(6, 36, 4, 7), C.wood, { b: 1, sh: 0 });
        P.part(P.rect(88, 36, 4, 7), C.wood, { b: 1, sh: 0 });
        for (let i = 0; i < 4; i++) P.px(34 + i * 16, 25, r[1]);
      }),
      chair: g => sprite(46, 56, P => {
        const r = g && g.fx.dream ? C.gold : C.purple;
        P.part(P.path('M 6 40 L 4 8 Q 4 2 12 2 L 34 2 Q 42 2 42 8 L 40 40 Z'), r, { b: 2 });
        P.part(P.poly([4, 30, 42, 30, 44, 46, 2, 46]), r, { b: 3 });
        P.part(P.rect(0, 22, 8, 22), r, { b: 2 });
        P.part(P.rect(38, 22, 8, 22), r, { b: 2 });
        P.part(P.rect(4, 46, 4, 9), C.wood, { b: 1, sh: 0 });
        P.part(P.rect(38, 46, 4, 9), C.wood, { b: 1, sh: 0 });
      }),
      lamp: () => sprite(24, 60, P => {
        P.part(P.path('M 2 18 L 22 18 L 17 2 L 7 2 Z'), C.gold, { b: 3 });
        P.part(P.rect(11, 18, 3, 36), C.gold, { b: 1, sh: 0 });
        P.part(P.ell(12, 56, 8, 3), C.gold, { b: 2 });
      }),
      closetOpen: () => sprite(38, 94, P => {
        P.part(P.rect(1, 1, 36, 92), C.black, { b: 0, sh: 0, hi: 0 });
        P.part(P.rect(3, 3, 32, 88), C.wood, { b: 0, sh: 0, hi: 0, ol: 0 });
        P.part(P.rect(3, 30, 32, 2), C.wood, { b: 2, sh: 0 });
        P.part(P.poly([6, 34, 16, 34, 18, 60, 4, 60]), C.pink, { b: 3 });
      })
    }
  });

  BG.homegate = function (buf) {
    const P = new Pen(buf);
    const sky = P.rect(0, 0, 320, 150);
    vgrad(buf, sky, [C.night[1], C.purple[1], C.purple[2], C.plum[3], C.rose[3], C.orange[3], C.orange[4]], 0, 150, 0, 1);
    for (let i = 0; i < 40; i++) buf.set(Math.floor(hash(i, 4, 1) * 320), Math.floor(hash(i, 4, 2) * 50), C.grey[5]);
    const hill = P.path('M 0 120 Q 80 70 170 84 Q 250 60 320 90 L 320 150 L 0 150 Z');
    part(buf, hill, C.night, { b: 2, sh: 0, hi: 1 });
    part(buf, P.poly([150, 86, 250, 80, 252, 118, 148, 120]), C.pink, { b: 2 });
    part(buf, P.poly([140, 88, 200, 62, 260, 84]), C.plum, { b: 2 });
    for (let i = 0; i < 6; i++) part(buf, P.rect(158 + i * 15, 92, 7, 10), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
    part(buf, P.ell(200, 72, 7, 5), C.eye, { sh: 0, hi: 0 });
    part(buf, P.ell(200, 72, 3, 3), C.blue, { b: 2, sh: 0, hi: 0 });
    const hedge = P.path('M 0 126 Q 10 118 20 126 Q 30 116 40 126 Q 50 118 60 126 Q 70 116 80 126 Q 90 118 100 126 Q 110 118 120 126 L 120 150 L 0 150 Z');
    part(buf, hedge, C.green, { b: 1 });
    const ground = P.rect(0, 148, 320, 52);
    grad(buf, ground, C.stone, (x, y) => 0.25 + (y - 148) / 80);
    for (let i = 0; i < 7; i++) {
      const cx = 24 + i * 44, cy = 164 + (i % 2) * 18;
      const pts = [];
      for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? 3 : 7; pts.push(cx + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r * 0.6); }
      part(buf, P.ell(cx, cy, 16, 5), C.pink, { b: 1, sh: 0, hi: 0 });
      part(buf, P.poly(pts), C.gold, { b: 3, sh: 0, hi: 0 });
    }
    part(buf, P.rect(176, 36, 12, 114), C.stone, { b: 3 });
    part(buf, P.rect(300, 36, 12, 114), C.stone, { b: 3 });
    part(buf, P.ell(182, 32, 8, 6), C.stone, { b: 4 });
    part(buf, P.ell(306, 32, 8, 6), C.stone, { b: 4 });
    part(buf, P.ell(182, 26, 4, 5), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
    part(buf, P.ell(306, 26, 4, 5), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
    part(buf, P.path('M 184 46 Q 244 18 304 46 L 304 54 Q 244 28 184 54 Z'), C.gold, { b: 2 });
    part(buf, P.rect(150, 4, 168, 22), C.plum, { b: 1 });
    textOn(buf, 'ПРИЮТ БРЭДИ КАЛЧЕРА', 172, 6, C.red[4], C.black);
    textOn(buf, 'для бывших детских звёзд', 160, 15, C.gold[4], C.black);
    part(buf, P.rect(114, 76, 52, 76), C.red, { b: 2 });
    part(buf, P.poly([110, 78, 170, 78, 162, 64, 118, 64]), C.gold, { b: 3 });
    part(buf, P.rect(122, 90, 36, 30), C.sky, { b: 2, sh: 0 });
    part(buf, P.rect(124, 124, 32, 10), C.grey, { b: 1 });
    part(buf, P.rect(128, 127, 24, 3), C.black, { b: 0, sh: 0, hi: 0, ol: 0 });
    part(buf, P.rect(112, 65, 56, 10), C.cream, { b: 4, sh: 0 });
    textOn(buf, 'ПРИЁМНАЯ', 116, 67, C.red[2], 0);
    part(buf, P.rect(90, 110, 4, 42), C.grey, { b: 1, sh: 0 });
    part(buf, P.path('M 78 112 L 78 98 Q 92 90 106 98 L 106 112 Z'), C.blue, { b: 3 });
    textOn(buf, 'БЛАНКИ', 80, 101, C.grey[5], C.black);
    dropShadow(buf, 140, 152, 30, 3);
    pool(buf, 182, 46, 30, 30, 0.8);
    pool(buf, 306, 46, 30, 30, 0.8);
  };

  Object.assign(LAYERS, {
    homegate: {
      gate: g => sprite(116, 100, P => {
        const open = g && g.f.gateOpen;
        const bar = (x0, x1) => {
          for (let x = x0; x <= x1; x += 8) { P.part(P.rect(x, 10, 3, 88), C.grey, { b: 1, sh: 0 }); P.part(P.poly([x - 1, 10, x + 1.5, 2, x + 4, 10]), C.gold, { b: 3, sh: 0 }); }
          P.part(P.rect(x0 - 2, 26, x1 - x0 + 7, 4), C.grey, { b: 1, sh: 0 });
          P.part(P.rect(x0 - 2, 84, x1 - x0 + 7, 4), C.grey, { b: 1, sh: 0 });
          if (x1 - x0 > 20) {
            const cx = (x0 + x1) / 2 + 1;
            P.part(P.ell(cx, 56, 13, 8), C.grey, { b: 1, sh: 0 });
            P.part(P.ell(cx, 56, 4.5, 4.5), C.gold, { b: 3, sh: 0 });
          }
        };
        if (open) { bar(2, 10); bar(104, 112); }
        else { bar(2, 50); bar(58, 112); }
      }),
      forms: () => sprite(20, 10, P => { for (let i = 0; i < 3; i++) P.part(P.rect(2 + i, 1 + i * 2, 14, 6), C.grey, { b: 5, sh: 0 }); }),
      desoto: () => S.LAYERS.street.desoto(),
      van: () => sprite(88, 50, P => {
        P.part(P.poly([4, 42, 6, 10, 60, 8, 72, 20, 84, 24, 84, 42]), C.cream, { b: 2 });
        P.part(P.poly([61, 10, 70, 20, 61, 20]), C.sky, { b: 2, sh: 0 });
        P.part(P.ell(30, 26, 9, 6), C.eye, { sh: 0, hi: 0 });
        P.part(P.ell(30, 26, 3.5, 3.5), C.blue, { b: 2, sh: 0, hi: 0 });
        P.part(P.ell(20, 44, 6, 3), C.grey, { b: 0 });
        P.part(P.ell(70, 44, 6, 3), C.grey, { b: 0 });
        P.line(40, 12, 50, 30, C.black); P.line(50, 30, 44, 38, C.black);
        for (let i = 0; i < 4; i++) P.part(P.rect(8 + i * 12, 46, 10, 4), C.oak, { b: 3 });
      })
    }
  });

  BG.studio = function (buf) {
    const P = new Pen(buf);
    const wall = P.rect(0, 0, 320, 148);
    vgrad(buf, wall, C.night, 0, 148, 0.1, 0.5);
    for (let x = 0; x < 320; x += 20) part(buf, P.rect(x, 0, 10, 148), C.purple, { b: 1, sh: 0, hi: 0, ol: 0 });
    shade(buf, wall, 0, (x, y) => 0.4 + (1 - y / 148) * 0.6);
    part(buf, P.rect(0, 0, 320, 10), C.grey, { b: 1, sh: 0 });
    for (let i = 0; i < 6; i++) {
      const x = 30 + i * 52;
      part(buf, P.path(`M ${x - 7} 10 L ${x + 7} 10 L ${x + 5} 20 L ${x - 5} 20 Z`), C.grey, { b: 1 });
      part(buf, P.ell(x, 20, 4, 2), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
    }
    part(buf, P.path('M 70 60 Q 160 -6 250 60 Q 160 126 70 60 Z'), C.gold, { b: 2 });
    part(buf, P.path('M 84 60 Q 160 6 236 60 Q 160 114 84 60 Z'), C.grey, { b: 0, sh: 0, hi: 0 });
    for (let i = 0; i < 10; i++) {
      const a = Math.PI + i * Math.PI / 9;
      line(buf, 160 + Math.cos(a) * 92, 60 + Math.sin(a) * 60, 160 + Math.cos(a) * 104, 60 + Math.sin(a) * 70, C.gold[3]);
    }
    textOn(buf, 'ГИПНОТРОН', 134, 108, C.gold[4], C.black);
    const stage = P.poly([40, 122, 280, 122, 296, 146, 24, 146]);
    part(buf, stage, C.red, { b: 2 });
    part(buf, P.poly([40, 118, 280, 118, 280, 124, 40, 124]), C.red, { b: 3, sh: 0 });
    for (let i = 0; i < 12; i++) buf.set(52 + i * 20, 134, C.gold[4]);
    const floor = P.rect(0, 146, 320, 54);
    floor.each((x, y) => buf.set(x, y, ((Math.floor((x - 160) / ((y - 90) * 0.4)) + Math.floor(y / 7)) % 2) ? C.grey[1] : C.grey[0]));
    part(buf, P.rect(248, 54, 64, 90), C.navy, { b: 1, sh: 0, hi: 0, ol: C.black });
    grad(buf, P.rect(250, 56, 60, 86), C.navy, (x, y) => 0.15 + (hash(x, y, 1) - 0.5) * 0.1 + (y - 56) / 260);
    part(buf, P.rect(252, 104, 56, 18), C.grey, { b: 1 });
    for (let i = 0; i < 6; i++) buf.set(256 + i * 9, 110, [C.red[4], C.green[4], C.yellow[4]][i % 3]);
    part(buf, P.rect(246, 142, 68, 4), C.grey, { b: 2, sh: 0 });
    for (const [x, h] of [[18, 70], [54, 64]]) {
      part(buf, P.rect(x, 146 - h + 12, 3, h - 12), C.grey, { b: 1, sh: 0 });
      part(buf, P.rect(x - 8, 146 - h, 18, 12), C.grey, { b: 1 });
      part(buf, P.ell(x - 9, 146 - h + 6, 4, 4), C.grey, { b: 3, sh: 0 });
    }
    pool(buf, 160, 128, 120, 20, 0.9);
  };

  Object.assign(LAYERS, {
    studio: {
      seats: () => sprite(320, 30, P => {
        for (let i = 0; i < 11; i++) {
          const x = 4 + i * 29;
          P.part(P.path(`M ${x} 30 L ${x} 10 Q ${x} 2 ${x + 12} 2 Q ${x + 24} 2 ${x + 24} 10 L ${x + 24} 30 Z`), C.red, { b: 2 });
          P.part(P.rect(x + 3, 6, 18, 12), C.red, { b: 3, sh: 1 });
        }
      }),
      chair: g => sprite(34, 50, P => {
        P.part(P.rect(4, 4, 26, 20), C.grey, { b: 1 });
        P.part(P.rect(6, 6, 22, 16), C.red, { b: 3, sh: 0 });
        textOn(P.b, 'ЗВЕЗДА', 6, 11, C.gold[4], 0);
        P.part(P.rect(2, 30, 30, 5), C.oak, { b: 3 });
        P.line(4, 34, 30, 49, C.oak[1]); P.line(30, 34, 4, 49, C.oak[1]);
        if (g && g.f.maxStrapped) { P.part(P.rect(2, 22, 30, 3), C.oak, { b: 1, sh: 0 }); }
      }),
      glass: () => sprite(70, 94, P => {
        const b = P.b;
        for (let x = 0; x < 70; x++) { b.set(x, 0, C.grey[3]); b.set(x, 1, C.black); b.set(x, 92, C.black); b.set(x, 93, C.grey[3]); }
        for (let y = 0; y < 94; y++) { b.set(0, y, C.grey[3]); b.set(1, y, C.black); b.set(68, y, C.black); b.set(69, y, C.grey[3]); }
        for (let k = 0; k < 3; k++) for (let i = 0; i < 26; i++) b.set(8 + k * 18 + i, 60 - i * 2 + k * 8, C.sky[4]);
      })
    }
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
