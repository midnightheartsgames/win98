(function (S) {
  'use strict';
  const { C } = S;
  const A = S.art201;
  const TAU = Math.PI * 2;
  const METAL = C.stone;
  const HORSE = { pest: C.green, death: C.grey, war: C.red, famine: C.cream };

  function robotHead(P, x, y, o) {
    const mode = o.mode || 'back';
    P.part(P.rect(x - 22, y - 30, 44, 32), METAL, { b: 3 });
    P.part(P.rect(x - 24, y - 33, 48, 5), METAL, { b: 4, sh: 0 });
    P.part(P.cap(x, y - 33, x + 4, y - 46, 1.4), C.grey, { b: 2, sh: 0 });
    P.part(P.ell(x + 4, y - 47, 3, 3), o.eye === false ? C.red : [C.neonA, C.neonA, C.neonA, C.neonA, C.neonA], { b: 3, sh: 0 });
    for (const ex of [-24, 24]) P.part(P.ell(x + ex, y - 14, 4, 7), METAL, { b: 2 });
    if (mode === 'back') {
      for (let i = 0; i < 4; i++) P.line(x - 16, y - 22 + i * 5, x + 16, y - 22 + i * 5, METAL[1]);
      for (const sx of [-18, 18]) for (const sy of [-26, -4]) P.px(x + sx, y + sy, METAL[4]);
      return;
    }
    const tilt = mode === 'think' ? -4 : 0;
    const vis = P.rect(x - 17, y - 24 + tilt, 34, 9);
    P.part(vis, C.night, { b: 1, sh: 0 });
    const lit = mode === 'think' ? C.red[1] : C.neonA;
    for (let i = 0; i < 2; i++) P.part(P.ell(x - 7 + i * 14, y - 19.6 + tilt, 4.4, 3), [lit, lit, lit, lit, lit], { b: 3, sh: 0, hi: 0, ol: 0 });
    const g = P.rect(x - 14, y - 10, 28, 9);
    P.part(g, METAL, { b: 1, sh: 0 });
    for (let i = 0; i < 7; i++) P.line(x - 12 + i * 4, y - 9, x - 12 + i * 4, y - 3 + (o.talk && i % 2 ? -2 : 0), METAL[3]);
    if (mode === 'think') {
      const k = o.k || 0;
      for (let i = 0; i < 3; i++) {
        const a = k * 0.9 + i * TAU / 3;
        P.part(P.ell(x + 28 + i * 5 + Math.cos(a) * 2, y - 20 - i * 7 + Math.sin(a) * 2, 1.8 + i * 0.6, 1.8 + i * 0.6), C.cream, { b: 4, sh: 0, hi: 0 });
      }
      S.bigText(P.b, '?', Math.round(P.X(x + 46)), Math.round(P.Y(y - 46)), 2, C.lamp, C.yellow[4], 1);
    }
  }

  function robot(P, x, y, o) {
    o = o || {};
    const k = o.k || 0;
    const R = METAL;
    for (const sx of [-26, 26]) {
      P.part(P.rect(x + sx - 9, y - 70, 18, 66), R, { b: 2 });
      for (let i = 0; i < 5; i++) P.line(x + sx - 9, y - 66 + i * 13, x + sx + 9, y - 66 + i * 13, R[1]);
      P.part(P.poly([x + sx - 16, y, x + sx + 16, y, x + sx + 12, y - 10, x + sx - 12, y - 10]), C.grey, { b: 2 });
    }
    P.part(P.rect(x - 42, y - 80, 84, 14), C.grey, { b: 2 });
    const body = P.path(`M ${x - 48} ${y - 80} L ${x - 54} ${y - 142} Q ${x} ${y - 156} ${x + 54} ${y - 142} L ${x + 48} ${y - 80} Z`);
    P.part(body, R, { b: 3 });
    if (o.body === 'back') {
      P.part(P.rect(x - 30, y - 140, 60, 52), R, { b: 2, sh: 1 });
      for (const sx of [-26, 26]) for (const sy of [-136, -92]) P.part(P.ell(x + sx, y + sy, 1.6, 1.6), R, { b: 4, sh: 0, hi: 0 });
      if (o.key !== false) {
        P.part(P.rect(x - 3, y - 122, 6, 10), C.gold, { b: 2, sh: 0 });
        const sp = Math.sin(k * 0.8);
        P.part(P.path(`M ${x - 18 * sp - 3} ${y - 134} Q ${x - 20 * sp} ${y - 124} ${x} ${y - 120} Q ${x + 20 * sp} ${y - 124} ${x + 18 * sp + 3} ${y - 134} Q ${x} ${y - 128} ${x - 18 * sp - 3} ${y - 134} Z`), C.gold, { b: 3 });
      } else {
        P.part(P.ell(x, y - 118, 4, 3), C.night, { b: 0, sh: 0, hi: 0 });
      }
    } else {
      P.part(P.rect(x - 26, y - 134, 52, 34), C.night, { b: 1 });
      for (let i = 0; i < 6; i++) P.line(x - 22, y - 128 + i * 5, x + 22, y - 128 + i * 5, C.grey[1]);
      const lv = Math.floor((k * 3) % 5);
      for (let i = 0; i < 5; i++) P.part(P.rect(x - 20 + i * 9, y - 106 - (i <= lv ? 6 : 2), 6, i <= lv ? 6 : 2), [C.neonB, C.neonB, C.neonB, C.neonB, C.neonB], { b: 3, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(x, y - 88, 6, 5), C.red, { b: 3 });
    }
    const swing = Math.sin(k * 0.7) * 6;
    for (const sx of [-1, 1]) {
      const ax = x + sx * 54, ay = y - 136;
      const hx = ax + sx * 14, hy = ay + 50 + (sx > 0 ? swing : -swing);
      P.part(P.cap(ax, ay, hx, hy, 6, 5), C.grey, { b: 2 });
      P.part(P.path(`M ${hx - 8} ${hy} L ${hx - 10} ${hy + 14} L ${hx - 4} ${hy + 8} L ${hx} ${hy + 16} L ${hx + 4} ${hy + 8} L ${hx + 10} ${hy + 14} L ${hx + 8} ${hy} Z`), R, { b: 2 });
    }
    robotHead(P, x, y - 150, { mode: o.head || 'face', eye: o.eye, k, talk: o.talk });
  }

  function wreck(P, x, y, o) {
    o = o || {};
    const R = METAL;
    P.part(P.poly([x - 150, y, x + 150, y, x + 140, y - 10, x - 140, y - 10]), C.grey, { b: 1, sh: 0 });
    P.part(P.rect(x - 140, y - 30, 40, 24), R, { b: 3 });
    P.part(P.rect(x - 136, y - 26, 32, 8), C.night, { b: 1, sh: 0 });
    for (let i = 0; i < 2; i++) P.part(P.ell(x - 128 + i * 14, y - 22, 3.4, 2.2), C.red, { b: 1, sh: 0, hi: 0 });
    P.part(P.cap(x - 140, y - 30, x - 152, y - 44, 1.4), C.grey, { b: 2, sh: 0 });
    const body = P.path(`M ${x - 98} ${y - 6} L ${x - 96} ${y - 36} Q ${x - 10} ${y - 46} ${x + 70} ${y - 36} L ${x + 72} ${y - 6} Z`);
    P.part(body, R, { b: 3 });
    if (o.ring) {
      P.part(P.rect(x - 60, y - 40, 104, 28), C.night, { b: 1, sh: 0 });
      P.part(P.rect(x - 58, y - 18, 100, 5), C.sky, { b: 2, sh: 0 });
      for (let i = 0; i < 3; i++) P.line(x - 58, y - 36 + i * 7, x + 42, y - 36 + i * 7, [C.red[3], C.grey[5], C.blue[3]][i]);
      for (const px of [x - 58, x + 42]) P.part(P.rect(px - 2, y - 38, 4, 24), C.grey, { b: 4, sh: 0 });
      P.part(P.rect(x - 20, y - 52, 34, 12), C.gold, { b: 3 });
      S.font.draw(P.b, 'РИНГ', Math.round(P.X(x - 16)), Math.round(P.Y(y - 50)), C.red[1], 0);
    } else {
      P.part(P.rect(x - 60, y - 36, 104, 24), C.night, { b: 1 });
    }
    for (const sx of [80, 120]) {
      P.part(P.rect(x + sx - 10, y - 26, 30, 18), R, { b: 2 });
      P.part(P.poly([x + sx + 20, y - 4, x + sx + 34, y - 4, x + sx + 34, y - 30, x + sx + 20, y - 30]), C.grey, { b: 2 });
    }
    P.part(P.rect(x + 145, y - 24, 12, 18), C.cream, { b: 4, sh: 0 });
    for (const [dx, dy] of [[-80, -60], [20, -66], [60, -58]]) for (let i = 0; i < 3; i++) P.px(x + dx + i * 2, y + dy - i * 3, C.grey[2 + (i % 2)]);
  }

  function windKey(P, x, y, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.rect(x - 2, y - 4, 16, 4), C.gold, { b: 3, sh: 0 });
    Q.part(Q.path(`M ${x - 12} ${y - 10} Q ${x - 14} ${y - 2} ${x - 4} ${y - 2} Q ${x - 14} ${y - 2} ${x - 12} ${y + 6} Q ${x - 2} ${y + 4} ${x - 2} ${y - 2} Q ${x - 2} ${y - 8} ${x - 12} ${y - 10} Z`), C.gold, { b: 3 });
    Q.part(Q.ell(x - 8, y - 2, 2, 2), C.night, { b: 0, sh: 0, hi: 0 });
    Q.part(Q.rect(x + 12, y - 6, 3, 8), C.gold, { b: 2, sh: 0 });
  }

  function horse(P, x, y, kind, s) {
    const Q = P.scaled(x, y, s || 1);
    const R = HORSE[kind] || C.grey;
    Q.part(Q.rect(x - 9, y - 3, 18, 3), C.wood, { b: 2, sh: 0 });
    Q.part(Q.cap(x - 6, y - 4, x - 7, y - 10, 1), R, { b: 2, sh: 0 });
    Q.part(Q.cap(x + 5, y - 4, x + 6, y - 10, 1), R, { b: 2, sh: 0 });
    Q.part(Q.ell(x, y - 12, 8, 3.6), R, { b: 3 });
    Q.part(Q.cap(x + 6, y - 13, x + 10, y - 19, 2, 1.6), R, { b: 3 });
    Q.part(Q.ell(x + 11, y - 19, 2.6, 1.6), R, { b: 3, sh: 0 });
    Q.part(Q.cap(x - 8, y - 13, x - 11, y - 8, 1.2), R, { b: 2, sh: 0 });
    Q.part(Q.cap(x - 1, y - 15, x, y - 22, 1.8), R, { b: 4 });
    Q.part(Q.ell(x, y - 24, 2, 2), kind === 'death' ? C.grey : C.skin, { b: 4, sh: 0 });
    if (kind === 'death') { Q.line(x - 3, y - 30, x - 3, y - 14, C.wood[2]); Q.curve(`M ${x - 3} ${y - 30} Q ${x + 3} ${y - 32} ${x + 5} ${y - 27}`, C.grey[5]); }
    if (kind === 'war') Q.line(x + 2, y - 22, x + 7, y - 31, C.grey[5]);
    if (kind === 'famine') { Q.line(x - 4, y - 25, x + 4, y - 25, C.gold[3]); Q.line(x - 4, y - 25, x - 4, y - 22, C.gold[3]); Q.line(x + 4, y - 25, x + 4, y - 22, C.gold[3]); Q.part(Q.ell(x - 5, y - 13, 2.4, 2.4), C.gold, { b: 4 }); }
    if (kind === 'pest') for (const [dx, dy] of [[-3, -27], [3, -28], [5, -25]]) Q.px(x + dx, y + dy, C.slime[4]);
  }

  function maze(P, x, y, s, mary) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.poly([x - 11, y, x + 11, y, x + 11, y - 10, x - 11, y - 10]), C.oak, { b: 3 });
    Q.part(Q.poly([x - 11, y - 10, x + 11, y - 10, x + 7, y - 14, x - 15, y - 14]), C.oak, { b: 4, sh: 0 });
    Q.line(x - 13, y - 12, x + 3, y - 12, C.oak[1]);
    Q.line(x + 3, y - 12, x + 3, y - 10.6, C.oak[1]);
    Q.part(Q.rect(x - 11, y - 6, 4, 6), C.night, { b: 0, sh: 0, hi: 0 });
    if (mary) { Q.part(Q.ell(x + 2, y - 15, 2.4, 2), C.rat, { b: 3, sh: 0 }); Q.px(x + 3, y - 15.4, C.pupil); Q.part(Q.ell(x + 0.4, y - 17.4, 1, 1), C.pink, { b: 4, sh: 0, hi: 0, ol: 0 }); }
  }

  function can(P, x, y, s, full) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.path(`M ${x - 7} ${y} L ${x - 8} ${y - 11} Q ${x} ${y - 13} ${x + 8} ${y - 11} L ${x + 7} ${y} Z`), C.green, { b: 3 });
    Q.part(Q.cap(x + 7, y - 6, x + 15, y - 13, 1.4, 1), C.green, { b: 2, sh: 0 });
    Q.part(Q.ell(x + 16, y - 14, 2.4, 1.4, -0.6), C.green, { b: 4, sh: 0 });
    Q.curve(`M ${x - 7} ${y - 11} Q ${x - 12} ${y - 18} ${x - 3} ${y - 16}`, C.green[1]);
    if (full) { Q.px(x + 17, y - 11, C.sky[4]); Q.px(x + 18, y - 9, C.sky[3]); }
  }

  function record(P, x, y, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.rect(x - 9, y - 18, 18, 18), C.red, { b: 2 });
    Q.part(Q.ell(x + 4, y - 9, 8, 8), C.night, { b: 1 });
    S.outline(Q.b, Q.ell(x + 4, y - 9, 5, 5), C.night[2]);
    Q.part(Q.ell(x + 4, y - 9, 2, 2), C.yellow, { b: 3, sh: 0 });
    Q.part(Q.poly([x - 7, y - 4, x - 4, y - 14, x - 1, y - 4]), C.night, { b: 1, sh: 0 });
    Q.px(x - 5, y - 15, C.yellow[3]); Q.px(x - 3, y - 15, C.yellow[3]);
  }

  function sock(P, x, y, s, coal) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.path(`M ${x - 4} ${y - 16} L ${x + 3} ${y - 16} L ${x + 3} ${y - 6} Q ${x + 10} ${y - 5} ${x + 9} ${y} L ${x - 2} ${y} Q ${x - 5} ${y - 2} ${x - 4} ${y - 6} Z`), C.pink, { b: 3 });
    Q.part(Q.rect(x - 4.4, y - 17.6, 8, 3), C.grey, { b: 5, sh: 0 });
    for (const [dx, dy] of [[0, -11], [4, -3]]) Q.part(Q.ell(x + dx, y + dy, 1.4, 1.2), C.teal, { b: 4, sh: 0, hi: 0 });
    if (coal) for (const [dx, dy] of [[-2, -19], [1, -20], [3, -18.4]]) Q.part(Q.ell(x + dx, y + dy, 2, 1.8), C.night, { b: 1, sh: 0 });
  }

  function snowball(P, x, y, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.ell(x, y - 6, 6, 5.6), C.yellow, { b: 4 });
    for (const [dx, dy] of [[-2, -8], [2, -5], [-1, -3]]) Q.px(x + dx, y + dy, C.cheese[3]);
  }

  function globe(P, x, y, s, n, t) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.poly([x - 8, y, x + 8, y, x + 6, y - 4, x - 6, y - 4]), C.wood, { b: 3 });
    const ball = Q.ell(x, y - 12, 9, 9);
    Q.part(ball, C.sky, { b: 3, sh: 0, hi: 1 });
    Q.part(Q.poly([x - 4, y - 7, x + 4, y - 7, x + 4, y - 11, x, y - 14, x - 4, y - 11]), C.cream, { b: 4, sh: 0 });
    Q.part(Q.ell(x, y - 6.4, 7, 1.6), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    const cols = [C.orchid[4], C.gold[4], C.grey[3]];
    for (let i = 0; i < (n || 0); i++) {
      const a = (t || 0) * 2 + i * TAU / 3;
      Q.part(Q.ell(x + Math.cos(a) * 4.4, y - 14 + Math.sin(a) * 2.4, 1.6, 2), [cols[i], cols[i], cols[i], cols[i], cols[i]], { b: 3, sh: 0, hi: 0, ol: 0 });
    }
    for (let i = 0; i < 6; i++) Q.px(x - 6 + ((i * 5 + Math.floor((t || 0) * 4)) % 12), y - 18 + ((i * 3) % 9), C.grey[5]);
  }

  function tags(P, x, y, s) {
    const Q = P.scaled(x, y, s || 1);
    for (let i = 0; i < 3; i++) {
      const ox = x - 6 + i * 2, oy = y - 2 - i * 2;
      Q.part(Q.poly([ox, oy, ox + 12, oy, ox + 14, oy - 4, ox + 12, oy - 8, ox, oy - 8]), C.cream, { b: 4, sh: 0 });
      Q.part(Q.ell(ox + 11, oy - 4, 1, 1), C.night, { b: 0, sh: 0, hi: 0 });
    }
    Q.line(x + 4, y - 10, x + 8, y - 14, C.red[3]);
    Q.part(Q.ell(x - 1, y - 6, 2, 1.6), C.red, { b: 3, sh: 0 });
  }

  function rglove(P, x, y, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.ell(x, y - 8, 7, 6.4), C.red, { b: 3 });
    Q.part(Q.ell(x - 6, y - 9, 3, 3.4), C.red, { b: 3 });
    Q.part(Q.rect(x - 4, y - 3, 9, 3), C.grey, { b: 5, sh: 0 });
    Q.line(x - 3, y - 9, x + 4, y - 10, C.gold[4]);
  }

  function betty(P, x, y, s, o) {
    o = o || {};
    const Q = P.scaled(x, y, s || 1);
    const act = o.act || 'guard';
    const by = act === 'ko' ? 0 : -Math.abs(Math.sin((o.t || 0) * 6)) * 1.4;
    if (act === 'ko') {
      Q.part(Q.ell(x, y - 5, 18, 5), C.pink, { b: 3 });
      Q.part(Q.ell(x - 18, y - 7, 7, 6), C.skin, { b: 3 });
      Q.part(Q.path(`M ${x - 26} ${y - 9} Q ${x - 22} ${y - 18} ${x - 12} ${y - 12} Z`), C.yellow, { b: 3 });
      Q.line(x - 20, y - 9, x - 17, y - 6, C.black); Q.line(x - 20, y - 6, x - 17, y - 9, C.black);
      return;
    }
    Q.part(Q.cap(x - 5, y - 24, x - 7, y - 2, 3, 2.4), C.skin, { b: 3, sh: 1 });
    Q.part(Q.cap(x + 5, y - 24, x + 7, y - 2, 3, 2.4), C.skin, { b: 3, sh: 1 });
    Q.part(Q.ell(x - 7, y - 1, 4.4, 2), C.red, { b: 3, sh: 0 });
    Q.part(Q.ell(x + 7, y - 1, 4.4, 2), C.red, { b: 3, sh: 0 });
    Q.part(Q.path(`M ${x - 11} ${y - 50 + by} Q ${x - 13} ${y - 36} ${x - 11} ${y - 22} L ${x + 11} ${y - 22} Q ${x + 13} ${y - 36} ${x + 11} ${y - 50 + by} Z`), C.pink, { b: 3 });
    Q.part(Q.rect(x - 12, y - 30, 24, 6), C.red, { b: 3, sh: 0 });
    Q.part(Q.rect(x - 4, y - 46 + by, 8, 6), C.grey, { b: 1, sh: 0 });
    Q.px(x, y - 43 + by, C.neonA);
    let la = [x - 12, y - 52 + by], ra = [x + 12, y - 52 + by];
    if (act === 'punch') ra = [x + 30, y - 50 + by];
    if (act === 'block') { la = [x - 6, y - 62 + by]; ra = [x + 6, y - 62 + by]; }
    if (act === 'hit') { la = [x - 18, y - 64]; ra = [x + 18, y - 64]; }
    Q.part(Q.cap(x - 9, y - 48 + by, la[0], la[1], 2.6, 2.2), C.skin, { b: 3, sh: 0 });
    Q.part(Q.cap(x + 9, y - 48 + by, ra[0], ra[1], 2.6, 2.2), C.skin, { b: 3, sh: 0 });
    Q.part(Q.ell(la[0], la[1], 5, 4.6), C.red, { b: 3 });
    Q.part(Q.ell(ra[0], ra[1], 5, 4.6), C.red, { b: 3 });
    const hy = y - 62 + by + (act === 'hit' ? 3 : 0);
    Q.part(Q.ell(x, hy, 8, 8), C.skin, { b: 3 });
    Q.part(Q.path(`M ${x - 9} ${hy - 1} Q ${x - 10} ${hy - 12} ${x} ${hy - 12} Q ${x + 10} ${hy - 12} ${x + 9} ${hy - 1} Q ${x + 6} ${hy - 7} ${x} ${hy - 7} Q ${x - 6} ${hy - 7} ${x - 9} ${hy - 1} Z`), C.yellow, { b: 3 });
    for (const ex of [-3, 3]) {
      if (act === 'hit') { Q.line(x + ex - 1.4, hy - 1.4, x + ex + 1.4, hy + 1.4, C.black); Q.line(x + ex - 1.4, hy + 1.4, x + ex + 1.4, hy - 1.4, C.black); }
      else { Q.part(Q.ell(x + ex, hy, 1.8, 2.2), C.eye, { b: 3, sh: 0, hi: 0 }); Q.px(x + ex, hy, C.pupil); }
    }
    Q.part(Q.ell(x, hy + 4.4, 2.6, 1.2), C.red, { b: 3, sh: 0, hi: 0 });
  }

  function boxRat(P, x, y, s, o) {
    o = o || {};
    const Q = P.scaled(x, y, s || 1);
    const R = o.ramp || C.rat;
    const act = o.act || 'guard';
    const by = -Math.abs(Math.sin((o.t || 0) * 5)) * 1.4;
    if (act === 'ko') {
      Q.part(Q.ell(x, y - 4, 16, 4.4), R, { b: 3 });
      Q.part(Q.ell(x + 16, y - 6, 6, 5), R, { b: 3 });
      Q.line(x + 14, y - 8, x + 17, y - 5, C.black); Q.line(x + 14, y - 5, x + 17, y - 8, C.black);
      return;
    }
    Q.part(Q.cap(x - 4, y - 14, x - 14, y - 6, 1.6, 0.8), C.pink, { b: 2, sh: 0 });
    Q.part(Q.ell(x - 4, y - 2, 4, 2), R, { b: 2, sh: 0 });
    Q.part(Q.ell(x + 4, y - 2, 4, 2), R, { b: 2, sh: 0 });
    Q.part(Q.ell(x, y - 18 + by, 10, 14), R, { b: 3 });
    Q.part(Q.rect(x - 10, y - 14, 20, 7), o.shorts || C.blue, { b: 3, sh: 0 });
    let la = [x - 12, y - 30 + by], ra = [x + 12, y - 30 + by];
    if (act === 'wind') ra = [x + 20, y - 44 + by];
    if (act === 'punch') ra = [x - 30, y - 28 + by];
    if (act === 'taunt') { la = [x - 16, y - 50 + by]; ra = [x + 16, y - 50 + by]; }
    if (act === 'stun' || act === 'hit') { la = [x - 18, y - 22]; ra = [x + 18, y - 22]; }
    Q.part(Q.cap(x - 8, y - 26 + by, la[0], la[1], 2.4, 2), R, { b: 3, sh: 0 });
    Q.part(Q.cap(x + 8, y - 26 + by, ra[0], ra[1], 2.4, 2), R, { b: 3, sh: 0 });
    Q.part(Q.ell(la[0], la[1], 5, 4.6), C.red, { b: 3 });
    Q.part(Q.ell(ra[0], ra[1], 5, 4.6), C.red, { b: 3 });
    const hx = x, hy = y - 38 + by;
    Q.part(Q.ell(hx, hy, 8, 7), R, { b: 3 });
    Q.part(Q.ell(hx - 6, hy - 7, 3.4, 3.6), R, { b: 3 });
    Q.part(Q.ell(hx + 6, hy - 7, 3.4, 3.6), R, { b: 3 });
    Q.part(Q.path(`M ${hx - 4} ${hy + 1} L ${hx - 14} ${hy + 4} L ${hx - 4} ${hy + 6} Z`), R, { b: 3, sh: 0 });
    Q.px(hx - 14, hy + 4, C.pink[3]);
    for (const ex of [-3, 3]) {
      if (act === 'stun' || act === 'hit') { Q.line(hx + ex - 1.4, hy - 2, hx + ex + 1.4, hy + 0.6, C.black); Q.line(hx + ex - 1.4, hy + 0.6, hx + ex + 1.4, hy - 2, C.black); }
      else Q.px(hx + ex, hy - 1, C.pupil);
    }
    Q.line(hx - 3, hy + 4, hx - 1, hy + 4, C.eye);
    if (o.label) S.font.drawCentered(Q.b, o.label, Math.round(Q.X(x)), Math.round(Q.Y(y + 4)), C.grey[5]);
  }

  function footbath(P, x, y, s, k) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.path(`M ${x - 14} ${y - 10} L ${x + 14} ${y - 10} L ${x + 11} ${y} L ${x - 11} ${y} Z`), C.sky, { b: 3 });
    Q.part(Q.ell(x, y - 10, 14, 3), C.teal, { b: 3, sh: 0 });
    for (let i = 0; i < 2; i++) { const fx = x - 6 + i * 10 + Math.sin((k || 0) + i * 2) * 2; Q.part(Q.poly([fx - 3, y - 11, fx + 2, y - 12, fx + 3, y - 10, fx + 2, y - 8.6]), C.orange, { b: 3, sh: 0 }); Q.px(fx + 2, y - 11, C.eye); }
  }

  function stopwatch(P, x, y, s) {
    const Q = P.scaled(x, y, s || 1);
    Q.part(Q.ell(x, y - 8, 7, 7), C.gold, { b: 3 });
    Q.part(Q.ell(x, y - 8, 5, 5), C.grey, { b: 5, sh: 0, hi: 0 });
    Q.line(x, y - 8, x + 2, y - 11, C.black); Q.line(x, y - 8, x, y - 12, C.red[3]);
    Q.part(Q.rect(x - 1.4, y - 17, 3, 2.6), C.gold, { b: 3, sh: 0 });
  }

  function parcel(P, x, y, s, k) {
    const Q = P.scaled(x, y, s || 1);
    const j = k ? (Math.floor(k) % 2) : 0;
    Q.part(Q.rect(x - 10 + j, y - 14, 20, 14), C.sand, { b: 3 });
    Q.line(x + j, y - 14, x + j, y, C.wood[1]);
    Q.line(x - 10 + j, y - 7, x + 10 + j, y - 7, C.wood[1]);
    Q.part(Q.rect(x - 7 + j, y - 12, 6, 3), C.cream, { b: 4, sh: 0 });
    if (j) { Q.line(x - 14, y - 16, x - 12, y - 14, C.lamp); Q.line(x + 13, y - 16, x + 11, y - 14, C.lamp); }
  }

  function crate(P, x, y, o) {
    o = o || {};
    P.part(P.rect(x - 22, y - 30, 44, 30), C.oak, { b: 2 });
    for (let i = 0; i < 3; i++) P.line(x - 22, y - 24 + i * 9, x + 22, y - 24 + i * 9, C.oak[1]);
    P.line(x - 22, y - 30, x + 22, y, C.oak[1]);
    P.part(P.rect(x - 17, y - 22, 34, 10), C.cream, { b: 4, sh: 0 });
    S.font.draw(P.b, o.label || 'САТАНЕ', Math.round(P.X(x - 15)), Math.round(P.Y(y - 21)), C.red[1], 0);
    if (o.slime !== false) for (let i = 0; i < 6; i++) { const sx = x - 20 + i * 8; P.line(sx, y - 30, sx, y - 30 + 3 + ((i * 5) % 7), C.slime[3]); P.px(sx, y - 26 + ((i * 5) % 7), C.slime[4]); }
    if (o.open) { P.part(P.poly([x - 24, y - 30, x + 24, y - 30, x + 28, y - 40, x - 20, y - 40]), C.oak, { b: 3 }); }
    if (o.santa) { P.part(P.ell(x, y - 33, 10, 6), C.red, { b: 3 }); A.santaHead(P.scaled(x, y - 40, 0.8), x, y - 40, { v: 'evil', blink: true }); }
  }

  function sleigh(P, x, y, o) {
    o = o || {};
    P.part(P.path(`M ${x - 46} ${y} L ${x + 40} ${y} Q ${x + 54} ${y} ${x + 52} ${y - 10}`), C.grey, { b: 4, sh: 0 });
    S.outline(P.b, P.path(`M ${x - 46} ${y} L ${x + 40} ${y} Q ${x + 54} ${y} ${x + 52} ${y - 10} L ${x + 50} ${y - 10} Q ${x + 50} ${y - 2} ${x + 40} ${y - 2} L ${x - 46} ${y - 2} Z`), C.grey[3]);
    for (const sx of [-30, 20]) P.part(P.rect(x + sx, y - 10, 3, 9), C.grey, { b: 3, sh: 0 });
    P.part(P.path(`M ${x - 44} ${y - 10} Q ${x - 50} ${y - 34} ${x - 34} ${y - 36} L ${x + 26} ${y - 30} Q ${x + 40} ${y - 30} ${x + 40} ${y - 18} L ${x + 36} ${y - 10} Z`), C.red, { b: 3 });
    P.part(P.rect(x - 34, y - 28, 50, 4), C.gold, { b: 3, sh: 0 });
    P.part(P.rect(x - 44, y - 46, 18, 24), C.grey, { b: 1 });
    P.part(P.rect(x - 40, y - 60, 8, 14), C.grey, { b: 2, sh: 0 });
    P.part(P.rect(x - 41, y - 62, 10, 3), C.grey, { b: 3, sh: 0 });
    P.part(P.rect(x - 41, y - 36, 10, 8), o.lit ? [C.orange[3], C.orange[4], C.lamp, C.lamp, C.lamp] : C.night, { b: 1, sh: 0 });
    if (o.lit) for (let i = 0; i < 4; i++) P.px(x - 39 + i * 2, y - 64 - ((i * 3 + (o.k || 0)) % 6), C.grey[3 + (i % 2)]);
  }

  function topiary(P, x, y, big) {
    if (!big) {
      P.part(P.rect(x - 5, y - 6, 10, 6), C.brick, { b: 3 });
      P.part(P.ell(x, y - 10, 5, 5), C.green, { b: 3 });
      return;
    }
    P.part(P.rect(x - 7, y - 10, 14, 10), C.brick, { b: 3 });
    P.part(P.rect(x - 2, y - 120, 4, 112), C.wood, { b: 2, sh: 0 });
    for (let i = 0; i < 6; i++) {
      const cy = y - 20 - i * 20, r = 16 - i * 1.4;
      P.part(P.ell(x + (i % 2 ? 3 : -3), cy, r, 10), C.green, { b: 3 });
      for (let k = 0; k < 4; k++) P.px(x - r + 4 + k * r / 2, cy - 2 + (k % 2) * 3, C.green[4]);
    }
  }

  function tree(P, x, y, o) {
    o = o || {};
    P.part(P.rect(x - 5, y - 12, 10, 12), C.wood, { b: 2 });
    for (let i = 0; i < 4; i++) {
      const top = y - 24 - i * 22, w = 42 - i * 9;
      P.part(P.poly([x - w, top + 16, x + w, top + 16, x, top - 18]), C.green, { b: 2 + (i % 2) });
    }
    const cols = [C.red, C.gold, C.sky, C.pink];
    for (let i = 0; i < 14; i++) { const t = i / 14; const yy = y - 18 - t * 84; const xx = x + Math.sin(i * 2.3) * (40 - t * 34); P.part(P.ell(xx, yy, 2.2, 2.2), cols[i % 4], { b: 3, sh: 0 }); }
    P.part(P.poly([x - 6, y - 106, x, y - 114, x + 6, y - 106, x + 4, y - 99, x, y - 103, x - 4, y - 99]), C.gold, { b: 4, sh: 0 });
  }

  function dispenser(P, x, y, o) {
    o = o || {};
    const k = o.k || 0;
    const B = C.green;
    P.part(P.ell(x, y - 40, 34, 26), B, { b: 3 });
    for (let i = 0; i < 3; i++) P.line(x - 30 + i * 4, y - 56 + i * 10, x + 30 - i * 4, y - 56 + i * 10, B[1]);
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) P.part(P.cap(x + sx * 24, y - 30 + i * 8, x + sx * 40, y - 16 + i * 8, 1.6, 1.2), B, { b: 2, sh: 0 });
    P.part(P.ell(x, y - 70, 14, 10), B, { b: 4 });
    for (const ex of [-6, 6]) { P.part(P.ell(x + ex, y - 72, 4, 4), C.red, { b: 3 }); P.px(x + ex, y - 73, C.eye); }
    P.part(P.cap(x - 6, y - 80, x - 14, y - 94, 1, 0.8), B, { b: 2, sh: 0 });
    P.part(P.cap(x + 6, y - 80, x + 14, y - 94, 1, 0.8), B, { b: 2, sh: 0 });
    P.part(P.rect(x - 10, y - 18, 20, 12), C.night, { b: 1 });
    if (o.gift) { const gy = y - 10 + Math.min(10, (k % 3) * 4); P.part(P.rect(x - 6, gy - 8, 12, 8), C.red, { b: 3 }); P.line(x, gy - 8, x, gy, C.gold[4]); }
  }

  function pole(P, x, y, h) {
    const top = y - (h || 110);
    const m = P.rect(x - 4, top, 8, h || 110);
    P.part(m, C.grey, { b: 5 });
    m.each((px, py) => { if (P.b.px[py * P.b.w + px] !== C.black && ((py - px) & 7) < 4) P.b.set(px, py, C.red[3]); });
    P.part(P.ell(x, top - 3, 6, 6), C.gold, { b: 4 });
    P.part(P.ell(x, y, 12, 3), C.grey, { b: 2 });
  }

  function plane(P, x, y, o) {
    o = o || {};
    P.line(x, y - 20, x, y - 8, C.grey[3]);
    P.part(P.ell(x, y, 16, 4), C.olive, { b: 3 });
    P.part(P.poly([x - 4, y - 1, x + 6, y - 1, x + 2, y + 9, x - 8, y + 9]), C.olive, { b: 2 });
    P.part(P.poly([x - 4, y - 1, x + 6, y - 1, x + 2, y - 11, x - 8, y - 11]), C.olive, { b: 4 });
    P.part(P.poly([x - 16, y, x - 22, y - 7, x - 18, y]), C.olive, { b: 3 });
    P.part(P.ell(x + 15, y, 2, 3.6), C.grey, { b: 4, sh: 0 });
    P.part(P.ell(x + 2, y - 2, 3, 2), C.sky, { b: 4, sh: 0 });
    P.part(P.ell(x, y + 4, 3, 1.4), C.red, { b: 2, sh: 0, hi: 0 });
    if (o.ball) P.part(P.ell(x, y + 6, 2.6, 2.6), C.night, { b: 2 });
  }

  function cannon(P, x, y) {
    P.part(P.ell(x - 6, y - 4, 5, 5), C.wood, { b: 3 });
    P.part(P.ell(x + 6, y - 4, 5, 5), C.wood, { b: 3 });
    P.part(P.cap(x - 8, y - 9, x + 12, y - 20, 4.4, 3.6), C.night, { b: 2 });
    P.part(P.ell(x + 13, y - 21, 3, 3), C.night, { b: 0, sh: 0, hi: 0 });
  }

  function trampoline(P, x, y, k) {
    for (const sx of [-16, 16]) P.part(P.rect(x + sx - 1.4, y - 8, 3, 8), C.grey, { b: 2, sh: 0 });
    P.part(P.ell(x, y - 9 + (k ? 1.6 : 0), 18, 3.6), C.blue, { b: 3 });
    S.outline(P.b, P.ell(x, y - 9, 19, 4.4), C.red[3]);
  }

  function pounder(P, x, y, swing) {
    P.part(P.rect(x - 10, y - 8, 20, 8), C.sky, { b: 3 });
    P.part(P.rect(x - 2, y - 40, 4, 32), C.wood, { b: 2, sh: 0 });
    const a = swing ? 1.3 : 0;
    const hx = x - Math.sin(a) * 30, hy = y - 40 + (1 - Math.cos(a)) * 30;
    P.part(P.cap(x, y - 40, hx, hy - 4, 1.6), C.wood, { b: 3, sh: 0 });
    P.part(P.ell(hx, hy - 6, 9, 5, a), C.orange, { b: 3 });
    P.px(hx + 4, hy - 8, C.eye); P.px(hx + 4, hy - 7, C.pupil);
    P.part(P.poly([hx - 6, hy - 6, hx - 12, hy - 11, hx - 12, hy - 1]), C.orange, { b: 2, sh: 0 });
  }

  function portal(f, cx, cy, kind, t, ry) {
    const cols = { past: [C.sand[2], C.oak[3], C.cream[4]], present: [C.green[2], C.red[3], C.gold[4]], future: [C.purple[2], C.night[2], C.sky[4]] }[kind] || [C.grey[2], C.grey[3], C.grey[5]];
    const rx = 22, r2 = ry || 34;
    for (let y = -r2; y <= r2; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx) + (y * y) / (r2 * r2);
      if (d > 1) continue;
      const a = Math.atan2(y / r2, x / rx) + d * 6 - t * 3;
      const v = (Math.sin(a * 3) + 1) / 2;
      const c = d > 0.86 ? C.black : cols[v < 0.33 ? 0 : v < 0.75 ? 1 : 2];
      f.set(Math.round(cx + x), Math.round(cy + y), c);
    }
  }

  function jelly(P, x, y) {
    P.part(P.ell(x, y - 2, 16, 4), C.grey, { b: 4 });
    P.part(P.path(`M ${x - 12} ${y - 4} Q ${x - 12} ${y - 16} ${x} ${y - 16} Q ${x + 12} ${y - 16} ${x + 12} ${y - 4} Z`), C.sky, { b: 3 });
    for (const ex of [-4, 4]) { P.part(P.ell(x + ex, y - 10, 2, 2), C.yellow, { b: 4, sh: 0 }); P.px(x + ex, y - 10, C.red[2]); }
    P.part(P.ell(x + 6, y - 6, 1.6, 1.2), C.orange, { b: 3, sh: 0, hi: 0 });
    P.part(P.ell(x - 7, y - 6, 1.4, 1), C.green, { b: 3, sh: 0, hi: 0 });
  }

  function cooler(P, x, y, o) {
    o = o || {};
    if (o.gone) {
      P.part(P.ell(x, y - 2, 12, 3), C.night, { b: 0, sh: 0, hi: 0 });
      for (let i = 0; i < 5; i++) P.px(x - 8 + i * 4, y - 6 - (i % 2) * 3, C.grey[2]);
      return;
    }
    P.part(P.rect(x - 8, y - 40, 16, 40), C.grey, { b: 4 });
    P.part(P.rect(x - 6, y - 30, 12, 6), C.grey, { b: 2, sh: 0 });
    P.part(P.rect(x - 2, y - 26, 3, 3), C.blue, { b: 3, sh: 0 });
    const jug = P.path(`M ${x - 9} ${y - 40} L ${x - 9} ${y - 62} Q ${x} ${y - 68} ${x + 9} ${y - 62} L ${x + 9} ${y - 40} Z`);
    S.grad(P.b, jug, C.sky, (px, py) => 0.4 + (py - (y - 66)) / 60);
    S.outerLine(P.b, jug, C.black);
    const k = o.k || 0;
    const fx = x + Math.sin(k * 0.6) * 3;
    P.part(P.ell(fx, y - 52, 3.6, 2.4), C.orange, { b: 3, sh: 0 });
    P.part(P.poly([fx - 3, y - 52, fx - 7, y - 55, fx - 7, y - 49]), C.orange, { b: 3, sh: 0 });
    P.line(fx + 1, y - 53.4, fx + 3, y - 52.6, C.black);
    P.px(fx + 2, y - 52, C.red[3]);
    for (let i = 0; i < 2; i++) P.px(fx + 4 + i, y - 58 - ((k + i * 3) % 6), C.grey[5]);
  }

  Object.assign(A, { robot, robotHead, wreck, windKey, horse, maze, can, record, sock, snowball, globe, tags, rglove, betty, boxRat, footbath, stopwatch, parcel, crate, sleigh, topiary, tree, dispenser, pole, plane, cannon, trampoline, pounder, portal, jelly, cooler, HORSE });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
