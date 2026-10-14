(function (S, B) {
  'use strict';
  const { Pen, BAYER } = S;
  const C = B.C;

  function dfill(b, x0, y0, x1, y1, ramp, fn) {
    const n = ramp.length - 1;
    for (let y = Math.max(0, y0); y < Math.min(b.h, y1); y++) for (let x = Math.max(0, x0); x < Math.min(b.w, x1); x++) {
      const v = fn(x, y);
      if (v < 0) continue;
      const t = Math.max(0, Math.min(n, v * n));
      const i = Math.floor(t);
      b.px[y * b.w + x] = ramp[Math.min(n, i + (t - i > BAYER[((y & 3) << 2) | (x & 3)] ? 1 : 0))];
    }
  }

  function light(lights, x, y) {
    let v = 0;
    for (const L of lights) v += L.k * Math.max(0, 1 - Math.hypot((x - L.x) / L.rx, (y - L.y) / L.ry));
    return v;
  }

  function part(P, m, ramp, o) { return P.part(m, ramp, Object.assign({ b: 2 }, o || {})); }

  function clock(P, x, y, r, ramp, t) {
    part(P, P.ell(x, y, r, r), ramp, { b: 2 });
    part(P, P.ell(x, y, r - 2, r - 2), C.cream, { b: 4, sh: 1, hi: 0 });
    const a = t * Math.PI * 2, m = t * 12 * Math.PI * 2;
    P.line(x, y, x + Math.sin(a) * (r - 5), y - Math.cos(a) * (r - 5), C.black);
    P.line(x, y, x + Math.sin(m) * (r - 3), y - Math.cos(m) * (r - 3), C.grey[1]);
    for (let i = 0; i < 12; i += 3) P.px(x + Math.sin(i / 12 * Math.PI * 2) * (r - 3), y - Math.cos(i / 12 * Math.PI * 2) * (r - 3), C.grey[0]);
  }

  function catClock(P, x, y) {
    part(P, P.path(`M ${x - 8} ${y - 12} L ${x - 6} ${y - 22} L ${x - 2} ${y - 15} L ${x + 2} ${y - 15} L ${x + 6} ${y - 22} L ${x + 8} ${y - 12} Q ${x + 10} ${y} ${x + 6} ${y + 2} L ${x + 6} ${y + 30} L ${x - 6} ${y + 30} L ${x - 6} ${y + 2} Q ${x - 10} ${y} ${x - 8} ${y - 12} Z`), C.grey, { b: 0, sh: 0 });
    for (const sx of [-1, 1]) { part(P, P.ell(x + sx * 3.5, y - 8, 3, 3.5), C.eye, { b: 0, sh: 0, hi: 0 }); P.px(x + sx * 3.5 + 1, y - 8, C.pupil); }
    part(P, P.ell(x, y + 14, 5, 5), C.cream, { b: 4, sh: 0, hi: 0 });
    part(P, P.path(`M ${x - 2} ${y + 30} Q ${x - 9} ${y + 40} ${x - 3} ${y + 48}`), C.grey, { b: 0 });
  }

  function pendulum(P, x, y, w, h, ramp) {
    part(P, P.rect(x, y, w, h), ramp, { b: 2 });
    clock(P, x + w / 2, y + w / 2 + 2, w / 2 - 2, C.gold, 0.31);
    P.line(x + w / 2, y + w + 2, x + w / 2, y + h - 12, C.gold[3]);
    part(P, P.ell(x + w / 2, y + h - 10, 4, 4), C.gold, { b: 3 });
  }

  function portrait(P, x, y, kind) {
    part(P, P.rect(x, y, 38, 50), C.gold, { b: 2 });
    part(P, P.rect(x + 4, y + 4, 30, 42), C.olive, { b: 0, sh: 0, hi: 0 });
    part(P, P.path(`M ${x + 6} ${y + 46} Q ${x + 19} ${y + 32} ${x + 32} ${y + 46} Z`), kind === 'franklin' ? C.wood : C.grey, { b: 1, sh: 0, hi: 0 });
    const hair = { newton: [C.snow, 3, 12, 34], franklin: [C.snow, 2, 11, 30], edison: [C.grey, 3, 9, 20], einstein: [C.snow, 4, 14, 26] }[kind];
    part(P, P.path(`M ${x + 19 - hair[2]} ${y + hair[3]} Q ${x + 19 - hair[2] - 2} ${y + 7} ${x + 19} ${y + 8} Q ${x + 19 + hair[2] + 2} ${y + 7} ${x + 19 + hair[2]} ${y + hair[3]} Z`), hair[0], { b: hair[1] });
    part(P, P.ell(x + 19, y + 23, 7, 9), C.skin, { b: 3, sh: 1 });
    P.px(x + 16, y + 21, C.pupil); P.px(x + 22, y + 21, C.pupil);
    P.line(x + 17, y + 28, x + 21, y + 28, C.skin[1]);
    if (kind === 'einstein') part(P, P.rect(x + 14, y + 25, 10, 2), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
  }

  function signText(b, text, cx, y, col) { S.font.drawCentered(b, text, cx, y, col, 0); }

  function paintLab(b) {
    const P = new Pen(b);
    const lights = [{ x: 470, y: 120, rx: 330, ry: 230, k: 0.55 }, { x: 900, y: 170, rx: 260, ry: 200, k: 0.3 }, { x: 200, y: 160, rx: 240, ry: 200, k: 0.28 }];
    dfill(b, 0, 0, b.w, 50, C.wood, (x, y) => 0.12 + y / 50 * 0.25 + light(lights, x, y) * 0.3);
    for (let x = 30; x < b.w; x += 70) part(P, P.rect(x, 0, 16, 42), C.wood, { b: 1, sh: 1 });
    part(P, P.rect(-2, 40, b.w + 4, 12), C.wood, { b: 2, sh: 1 });
    dfill(b, 0, 52, b.w, 300, C.cream, (x, y) => 0.18 + light(lights, x, y) + (S.hash(x >> 2, y >> 2, 3) - 0.5) * 0.12);
    for (const x of [96, 336, 572, 1038]) part(P, P.rect(x, 52, 12, 250), C.wood, { b: 2, sh: 1 });
    part(P, P.rect(0, 198, b.w, 9), C.wood, { b: 2, sh: 1 });
    part(P, P.rect(0, 294, b.w, 12), C.wood, { b: 1, sh: 0 });
    dfill(b, 0, 306, b.w, b.h, C.khaki, (x, y) => 0.25 + light([{ x: 560, y: 380, rx: 520, ry: 200, k: 0.55 }], x, y) + (S.hash(x, y, 7) - 0.5) * 0.18);
    part(P, P.poly([380, 352, 790, 352, 840, 446, 330, 446]), C.maroon, { b: 2, sh: 0, hi: 0 });
    part(P, P.poly([396, 360, 774, 360, 816, 438, 352, 438]), C.maroon, { b: 1, sh: 0, hi: 0, ol: C.gold[1] });
    for (let i = 0; i < 6; i++) part(P, P.ell(420 + i * 66, 399, 12, 6), C.gold, { b: 1, sh: 0, hi: 0, ol: 0 });

    part(P, P.rect(20, 128, 70, 178), C.wood, { b: 2 });
    part(P, P.rect(28, 138, 54, 42), C.cream, { b: 4, sh: 1, hi: 0 });
    for (const yy of [152, 166]) P.line(28, yy, 82, yy, C.wood[1]);
    P.line(55, 138, 55, 180, C.wood[1]);
    part(P, P.rect(22, 192, 66, 30), C.snow, { b: 3, sh: 1 });
    signText(b, 'РАСПРОДАЖА', 55, 197, C.red[2]);
    signText(b, '14 МАЯ 1986', 55, 209, C.navy[2]);
    part(P, P.ell(80, 240, 3, 3), C.gold, { b: 3 });

    part(P, P.rect(112, 248, 216, 10), C.plank, { b: 3 });
    for (const x of [118, 314]) part(P, P.rect(x, 258, 8, 50), C.plank, { b: 2 });
    part(P, P.rect(124, 228, 26, 20), C.steel, { b: 2 });
    part(P, P.rect(158, 218, 14, 30), C.gold, { b: 2 });
    part(P, P.ell(165, 214, 10, 6), C.cream, { b: 3 });
    part(P, P.rect(182, 232, 30, 16), C.red, { b: 2 });
    part(P, P.rect(214, 236, 22, 12), C.navy, { b: 3 });
    part(P, P.rect(288, 226, 30, 22), C.teal, { b: 2 });
    for (const x of [130, 186, 216, 292]) part(P, P.rect(x, 250, 8, 5), C.cream, { b: 4, sh: 0, hi: 0 });
    portrait(P, 132, 72, 'newton');
    portrait(P, 182, 72, 'franklin');
    portrait(P, 232, 72, 'edison');
    portrait(P, 282, 72, 'einstein');
    part(P, P.rect(343, 210, 22, 34), C.snow, { b: 4, sh: 1, hi: 0 });
    for (let y = 216; y < 240; y += 4) P.line(346, y, 361, y, C.grey[3]);

    part(P, P.rect(384, 58, 92, 110), C.wood, { b: 2 });
    dfill(b, 390, 64, 470, 162, C.gold, (x, y) => 0.55 + (y - 64) / 98 * 0.4);
    part(P, P.rect(390, 64, 80, 34), C.cream, { b: 4, sh: 1, hi: 0 });
    for (const x of [404, 420, 436, 452]) part(P, P.rect(x - 1, 98, 3, 64), C.steel, { b: 1, sh: 0, hi: 0, ol: 0 });
    pendulum(P, 362, 64, 20, 92, C.wood);
    clock(P, 498, 66, 14, C.wood, 0.1);
    catClock(P, 498, 112);
    clock(P, 538, 74, 11, C.grey, 0.62);
    clock(P, 532, 130, 9, C.gold, 0.85);
    part(P, P.path('M 528 168 Q 524 150 534 148 Q 544 150 540 168 Z'), C.olive, { b: 2 });
    clock(P, 418, 184, 8, C.steel, 0.45);
    pendulum(P, 544, 160, 22, 70, C.plank);
    part(P, P.rect(360, 236, 214, 12), C.plank, { b: 3 });
    for (const x of [366, 562]) part(P, P.rect(x, 248, 8, 56), C.plank, { b: 2 });
    part(P, P.rect(378, 214, 26, 22), C.steel, { b: 2 });
    clock(P, 391, 225, 8, C.gold, 0.2);
    part(P, P.rect(420, 218, 40, 18), C.wood, { b: 2 });
    part(P, P.rect(476, 222, 14, 14), C.gold, { b: 3 });
    clock(P, 520, 226, 9, C.red, 0.7);

    part(P, P.path('M 590 310 L 590 214 Q 590 186 620 186 Q 650 186 650 214 L 650 310 Z'), C.wood, { b: 2 });
    part(P, P.path('M 598 300 L 598 218 Q 598 196 620 196 Q 642 196 642 218 L 642 300 Z'), C.maroon, { b: 1, sh: 0 });
    for (let i = 0; i < 9; i++) { const a = Math.PI * (0.1 + i * 0.1); P.part(P.ell(620 - Math.cos(a) * 19, 220 - Math.sin(a) * 19 + 8, 2, 2), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 }); b.set(Math.round(620 - Math.cos(a) * 19), Math.round(228 - Math.sin(a) * 19), C.cycle[i % C.cycle.length]); }
    part(P, P.rect(604, 232, 32, 20), C.cream, { b: 4, sh: 1 });
    for (let i = 0; i < 7; i++) { P.line(606 + i * 4, 236, 606 + i * 4, 248, C.cycle[(i + 2) % C.cycle.length]); }
    part(P, P.rect(604, 262, 32, 30), C.gold, { b: 2, sh: 0 });
    for (let y = 266; y < 290; y += 4) P.line(606, y, 633, y, C.wood[1]);

    part(P, P.rect(670, 286, 100, 20), C.wood, { b: 2 });
    for (const x of [674, 758]) part(P, P.rect(x, 306, 8, 4), C.wood, { b: 1 });
    part(P, P.rect(680, 222, 80, 64), C.wood, { b: 3 });
    part(P, P.rect(688, 230, 54, 46), C.grey, { b: 1, sh: 0 });
    dfill(b, 691, 233, 739, 273, [C.tvB, C.tvA], (x, y) => 0.3 + 0.5 * Math.max(0, 1 - Math.hypot(x - 715, y - 250) / 30));
    for (const y of [238, 256]) part(P, P.ell(751, y, 4, 4), C.steel, { b: 3 });
    P.line(712, 222, 700, 200, C.steel[3]);
    P.line(718, 222, 734, 198, C.steel[3]);

    part(P, P.rect(776, 290, 52, 18), C.wood, { b: 2 });
    part(P, P.rect(778, 246, 48, 44), C.teal, { b: 3, sh: 1, ol: C.slate[1] });
    dfill(b, 781, 250, 823, 287, C.teal, (x, y) => 0.4 + (y - 250) / 37 * 0.2);
    part(P, P.ell(802, 274, 9, 7), C.red, { b: 3 });
    part(P, P.path('M 793 272 L 786 266 L 789 264 L 794 268 Z'), C.red, { b: 3, sh: 0 });
    part(P, P.ell(802, 266, 4, 2), C.red, { b: 4, sh: 0 });
    for (let i = 0; i < 4; i++) part(P, P.ell(790 + i * 9, 258 - (i % 2) * 5, 1.4, 1.4), C.snow, { b: 4, sh: 0, hi: 0, ol: C.teal[2] });

    part(P, P.rect(838, 88, 122, 220), C.grey, { b: 0, sh: 1 });
    part(P, P.ell(899, 196, 52, 52), C.sky, { b: 2, sh: 1 });
    part(P, P.ell(899, 196, 47, 47), C.steel, { b: 1, sh: 1 });
    dfill(b, 855, 152, 944, 241, C.steel, (x, y) => { const d = Math.hypot(x - 899, y - 196); return d > 46 ? -1 : 0.15 + 0.5 * Math.abs(Math.sin(d / 7)) * (1 - d / 46); });
    part(P, P.ell(899, 196, 10, 10), C.grey, { b: 0, sh: 0 });
    for (const [x, y] of [[856, 108], [942, 108], [856, 290], [942, 290]]) { part(P, P.ell(x, y, 9, 9), C.sky, { b: 2 }); part(P, P.ell(x, y, 6, 6), C.steel, { b: 1, sh: 0 }); }
    part(P, P.rect(962, 112, 78, 196), C.grey, { b: 0, sh: 1 });
    part(P, P.rect(966, 120, 70, 30), C.grey, { b: 1, sh: 0 });
    for (let i = 0; i < 3; i++) { part(P, P.rect(970 + i * 22, 124, 18, 22), C.cream, { b: 3, sh: 0 }); P.line(979 + i * 22, 143, 975 + i * 22 + i * 3, 130, C.red[2]); }
    for (let i = 0; i < 3; i++) { part(P, P.ell(980 + i * 21, 251, 8, 8), C.steel, { b: 3 }); P.line(980 + i * 21, 251, 980 + i * 21, 244, C.black); }
    for (let y = 270; y < 300; y += 5) P.line(970, y, 1032, y, C.grey[2]);
    for (let y = 160; y < 230; y += 6) P.line(970, y, 1032, y, C.grey[1]);
    b.set(1030, 128, C.ledR); b.set(1030, 134, C.ledG);

    part(P, P.rect(1050, 118, 62, 190), C.wood, { b: 1 });
    dfill(b, 1056, 124, 1106, 306, C.wood, (x, y) => 0.05 + (y - 124) / 180 * 0.18);
    for (const y of [160, 210, 260]) part(P, P.rect(1058, y, 46, 5), C.plank, { b: 2, sh: 0 });
    part(P, P.rect(1062, 146, 10, 14), C.teal, { b: 2, sh: 0 });
    part(P, P.rect(1080, 196, 16, 14), C.cream, { b: 2, sh: 0 });

    P.line(470, 0, 470, 40, C.grey[1]);
    part(P, P.path('M 452 58 Q 470 36 488 58 Z'), C.gold, { b: 3 });
    part(P, P.ell(470, 59, 7, 3), C.lamp, { b: 0, sh: 0, hi: 0, ol: 0 });
  }

  function paintBack(b) {
    const P = new Pen(b);
    const lights = [{ x: 330, y: 150, rx: 320, ry: 220, k: 0.5 }];
    dfill(b, 0, 0, b.w, 50, C.wood, (x, y) => 0.12 + y / 50 * 0.25);
    for (let x = 10; x < b.w; x += 70) part(P, P.rect(x, 0, 16, 42), C.wood, { b: 1, sh: 1 });
    part(P, P.rect(-2, 40, b.w + 4, 12), C.wood, { b: 2, sh: 1 });
    dfill(b, 0, 52, b.w, 300, C.cream, (x, y) => 0.15 + light(lights, x, y) + (S.hash(x >> 2, y >> 2, 4) - 0.5) * 0.12);
    for (const x of [90, 300, 500]) part(P, P.rect(x, 52, 12, 250), C.wood, { b: 2, sh: 1 });
    part(P, P.rect(0, 198, b.w, 9), C.wood, { b: 2, sh: 1 });
    part(P, P.rect(0, 294, b.w, 12), C.wood, { b: 1, sh: 0 });
    dfill(b, 0, 306, b.w, b.h, C.khaki, (x, y) => 0.2 + light([{ x: 330, y: 380, rx: 360, ry: 180, k: 0.5 }], x, y) + (S.hash(x, y, 8) - 0.5) * 0.18);

    part(P, P.rect(10, 118, 62, 190), C.wood, { b: 1 });
    dfill(b, 16, 124, 66, 306, C.wood, (x, y) => 0.12 + (y - 124) / 180 * 0.2);
    part(P, P.rect(118, 118, 86, 152), C.plank, { b: 2 });
    for (const y of [150, 190, 230]) part(P, P.rect(122, y, 78, 6), C.plank, { b: 3, sh: 0 });
    for (const [x, y, c] of [[128, 136, C.teal], [146, 132, C.sky], [170, 138, C.gold], [130, 176, C.red], [160, 172, C.cream], [182, 178, C.green], [136, 214, C.steel], [168, 212, C.olive]]) part(P, P.path(`M ${x} ${y + 14} L ${x + 3} ${y + 4} L ${x + 3} ${y} L ${x + 7} ${y} L ${x + 7} ${y + 4} L ${x + 10} ${y + 14} Z`), c, { b: 3 });
    part(P, P.rect(132, 244, 60, 26), C.wood, { b: 2 });

    part(P, P.rect(230, 60, 58, 120), C.snow, { b: 4, sh: 1, hi: 0 });
    for (let y = 66; y < 176; y += 5) P.line(236, y, 282, y, (y / 5) % 3 ? C.grey[3] : C.grey[2]);
    part(P, P.rect(240, 180, 38, 14), C.snow, { b: 3, sh: 1 });

    part(P, P.rect(520, 140, 90, 120), C.tan, { b: 2 });
    part(P, P.rect(528, 196, 74, 64), C.tan, { b: 3 });
    P.line(528, 228, 602, 228, C.tan[1]);
    part(P, P.rect(540, 108, 52, 32), C.plank, { b: 3 });
    part(P, P.ell(566, 100, 18, 10), C.steel, { b: 2 });

    part(P, P.rect(196, 300, 268, 30), C.green, { b: 2 });
    P.line(198, 302, 462, 302, C.snow[4]);
    P.line(330, 302, 330, 328, C.snow[4]);
    for (const x of [206, 444]) part(P, P.rect(x, 330, 12, 34), C.wood, { b: 2 });
    for (const [x, y, w, h] of [[206, 286, 28, 16], [242, 280, 22, 22], [272, 288, 18, 14], [356, 284, 26, 18], [390, 290, 30, 12], [428, 282, 24, 20]]) part(P, P.rect(x, y, w, h), C.cream, { b: 3, sh: 1 });
    for (const x of [296, 352]) part(P, P.path(`M ${x - 3} 302 L ${x - 3} 292 Q ${x} 286 ${x + 3} 292 L ${x + 3} 302 Z`), C.olive, { b: 3, sh: 0 });
    part(P, P.rect(318, 296, 24, 6), C.cream, { b: 4, sh: 0 });
  }

  function paintYard(b, evening) {
    const P = new Pen(b);
    dfill(b, 0, 0, b.w, 250, C.dusk, (x, y) => evening ? 0.04 + y / 250 * 0.5 : 0.18 + y / 250 * 0.82);
    if (evening) for (let i = 0; i < 40; i++) b.set(Math.floor(S.hash(i, 1, 8) * b.w), Math.floor(S.hash(i, 2, 8) * 120), C.snow[3]);
    for (let i = 0; i < 4; i++) part(P, P.ell(200 + i * 170, 50 + (i % 2) * 30, 70, 6), C.dusk, { b: evening ? 1 : 3, sh: 0, hi: 0, ol: 0 });
    for (let x = 240; x < b.w; x += 40) {
      const h = 14 + S.hash(x, 5, 2) * 22;
      part(P, P.rect(x, 232 - h, 34, h + 6), C.stone, { b: evening ? 0 : 1, sh: 0, hi: 0, ol: 0 });
    }
    for (let x = 236; x < b.w + 20; x += 26) part(P, P.ell(x + S.hash(x, 6, 2) * 10, 236, 18, 12 + S.hash(x, 7, 2) * 8), C.green, { b: 0, sh: 0, hi: 0, ol: 0 });
    dfill(b, 236, 236, b.w, 306, C.olive, (x, y) => 0.2 + (y - 236) / 70 * 0.25 + (S.hash(x >> 1, y >> 1, 3) - 0.5) * 0.3 - (evening ? 0.15 : 0));
    for (const x of [540, 612]) { part(P, P.rect(x, 238, 14, 36), C.brick, { b: 1, sh: 1 }); part(P, P.rect(x - 2, 234, 18, 6), C.stone, { b: 2, sh: 0 }); }
    for (let x = 250; x < b.w; x += 22) P.line(x, 306, x + 3, 292 - S.hash(x, 8, 2) * 8, C.olive[3]);

    part(P, P.rect(738, 30, 6, 276), C.wood, { b: 1, sh: 0 });
    part(P, P.rect(720, 46, 42, 4), C.wood, { b: 1, sh: 0 });
    for (const [x0, y0, y1] of [[722, 48, 84], [740, 48, 92], [758, 48, 80]]) P.curve(`M ${x0} ${y0} Q ${x0 - 300} ${y1} ${-10} ${y0 + 20}`, C.black);

    for (let x = 240; x <= b.w; x += 90) part(P, P.rect(x, 188, 5, 118), C.steel, { b: 2, sh: 0 });
    P.line(240, 190, b.w, 190, C.steel[3]);
    for (let y = 194; y < 306; y++) for (let x = 242; x < b.w; x++) if ((x + y) % 8 === 0 || (x - y + 800) % 8 === 0) b.set(x, y, C.steel[evening ? 2 : 3]);

    dfill(b, 0, 306, b.w, b.h, C.stone, (x, y) => 0.38 - (y - 306) / 174 * 0.12 + (S.hash(x >> 1, y >> 1, 2) - 0.5) * 0.16 - Math.max(0, 0.1 - Math.hypot((x - 600) / 90, (y - 440) / 18) * 0.1) - (evening ? 0.12 : 0));
    for (const c of ['M 360 320 L 380 350 L 372 380 L 400 420', 'M 700 330 L 680 370 L 690 410', 'M 60 330 L 90 360 L 84 400']) P.curve(c, C.stone[0]);

    part(P, P.poly([-12, 108, 118, 60, 248, 108, 248, 118, -12, 118]), C.stone, { b: 1, sh: 0 });
    for (let y = 72; y < 116; y += 6) P.line(Math.max(-12, 118 - (y - 60) * 2.7), y, Math.min(248, 118 + (y - 60) * 2.7), y, C.stone[0]);
    dfill(b, 0, 118, 236, 306, C.cream, (x, y) => (evening ? 0.18 : 0.42) + x / 236 * 0.12 - (y < 132 ? 0.15 : 0) + (S.hash(x >> 1, y >> 1, 4) - 0.5) * 0.1);
    for (let x = 6; x < 236; x += 12) P.line(x, 118, x, 305, C.cream[1]);
    part(P, P.rect(90, 116, 86, 190), C.wood, { b: 1, sh: 0 });
    for (const x0 of [96, 133]) {
      part(P, P.rect(x0, 120, 37, 184), C.plank, { b: evening ? 1 : 2, sh: 1 });
      for (let x = x0 + 6; x < x0 + 37; x += 6) P.line(x, 156, x, 302, C.plank[0]);
      for (const wx of [x0 + 4, x0 + 20]) part(P, P.rect(wx, 128, 13, 18), C.dusk, { b: evening ? 1 : 3, sh: 0, hi: 1 });
      P.line(x0 + 2, 300, x0 + 35, 160, C.plank[1]);
      P.line(x0 + 2, 156, x0 + 35, 156, C.plank[1]);
    }
    part(P, P.rect(116, 104, 34, 12), C.cream, { b: 4, sh: 0 });
    signText(b, '1646', 133, 106, C.black);
    part(P, P.rect(18, 150, 54, 42), C.wood, { b: 1, sh: 0 });
    part(P, P.rect(22, 154, 46, 34), C.dusk, { b: evening ? 1 : 3, sh: 0, hi: 1 });
    P.line(45, 154, 45, 188, C.wood[1]); P.line(22, 171, 68, 171, C.wood[1]);
    part(P, P.rect(184, 134, 10, 12), C.steel, { b: 1, sh: 0 });
    if (evening) dfill(b, 164, 128, 214, 190, [C.cream[1], C.cream[2], C.cream[3], C.cream[4], C.glow], (x, y) => { const d = Math.hypot((x - 189) / 25, (y - 146) / 30); return d < 1 ? 0.75 - d * 0.7 : -1; });
    part(P, P.rect(186, 140, 6, 6), evening ? [C.glow, C.glow, C.glow, C.glow, C.glow] : C.cream, { b: 4, sh: 0, hi: 0 });
    for (const [x, h] of [[194, 34], [216, 30]]) {
      part(P, P.rect(x - 10, 306 - h, 20, h), C.steel, { b: 2, sh: 1 });
      for (let y = 310 - h; y < 304; y += 6) P.line(x - 9, y, x + 9, y, C.steel[1]);
      part(P, P.ell(x, 306 - h, 11, 3), C.steel, { b: 3, sh: 0 });
    }
    part(P, P.rect(172, 292, 16, 14), C.wood, { b: 3, sh: 0 });
    for (const x of [-6, 40, 238]) part(P, P.ell(x, 302, 20, 14), C.green, { b: 1, sh: 0 });
  }

  function paintDeLorean(b, o) {
    const P = new Pen(b);
    P.part(P.path('M 4 74 L 6 58 Q 10 52 30 50 L 94 42 L 124 18 L 176 16 L 212 30 L 238 34 L 246 44 L 246 76 L 4 78 Z'), C.steel, { b: 3, sh: 1 });
    for (let y = 46; y < 74; y += 3) P.line(8, y, 244, y, C.steel[2]);
    P.part(P.poly([4, 68, 246, 68, 246, 78, 4, 78]), C.stone, { b: 0, sh: 0, hi: 0 });
    P.part(P.poly([100, 42, 126, 22, 172, 20, 182, 42]), C.night, { b: 2, sh: 0, hi: 1 });
    P.line(118, 30, 132, 24, C.steel[4]);
    for (let i = 0; i < 6; i++) P.line(180 + i * 5, 20 + i * 2, 186 + i * 5, 32 + i * 1, C.black);
    P.line(96, 44, 186, 44, C.steel[1]);
    for (const x of [96, 186]) P.line(x, 44, x, 68, C.steel[1]);
    P.part(P.rect(222, 46, 22, 14), C.stone, { b: 1, sh: 0 });
    for (let x = 224; x < 244; x += 3) P.line(x, 47, x, 59, C.black);
    P.curve('M 200 64 Q 220 70 244 64', C.ledY);
    P.part(P.rect(220, 20, 18, 16), C.snow, { b: 3, sh: 1 });
    P.part(P.ell(229, 20, 9, 3), C.snow, { b: 4, sh: 0 });
    P.part(P.rect(238, 62, 8, 6), C.cream, { b: 4, sh: 0 });
    for (const x of [52, 196]) {
      P.part(P.ell(x, 82, 20, 18), C.raven, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(x, 84, 16, 15), C.stone, { b: 0, sh: 0 });
      P.part(P.ell(x, 84, 8, 7), C.steel, { b: 3, sh: 0 });
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; P.line(x, 84, x + Math.cos(a) * 7, 84 + Math.sin(a) * 6, C.steel[1]); }
    }
    if (o.dog) { P.part(P.ell(146, 32, 9, 8), C.cream, { b: 3, sh: 0 }); P.part(P.ell(140, 28, 4, 6), C.cream, { b: 1, sh: 0 }); b.set(150, 31, C.black); }
    if (o.frost) {
      for (let i = 0; i < 420; i++) { const x = 6 + Math.floor(S.hash(i, 1, 3) * 238), y = 16 + Math.floor(S.hash(i, 2, 3) * 60); if (b.px[y * b.w + x]) b.set(x, y, C.snow[S.hash(i, 3, 3) > 0.5 ? 4 : 3]); }
      for (let x = 12; x < 240; x += 9) P.line(x, 78, x, 80 + Math.floor(S.hash(x, 4, 3) * 4), C.snow[3]);
      for (const x0 of [40, 120, 200]) P.curve(`M ${x0} 14 Q ${x0 + 10} 4 ${x0 - 4} -2`, C.snow[2]);
    }
  }

  function paintCar(b, on) {
    const P = new Pen(b);
    dfill(b, 0, 0, b.w, b.h, C.char, (x, y) => 0.18 + (S.hash(x >> 2, y >> 2, 5) - 0.5) * 0.08 + (y > 300 ? 0.06 : 0));
    for (const [d, c] of [['M 0 14 Q 300 40 640 10', C.red[2]], ['M 0 24 Q 320 46 640 20', C.ledY], ['M 0 32 Q 280 52 640 30', C.navy[3]], ['M 200 0 Q 230 120 210 200', C.red[1]], ['M 470 0 Q 500 120 520 200', C.ledY]]) { P.curve(d, c); }
    dfill(b, 20, 120, 140, 320, C.dusk, (x, y) => 0.25 + (y - 120) / 200 * 0.7);
    for (let x = 24; x < 140; x += 8) P.line(x, 250, x, 320, C.steel[3]);
    P.line(20, 250, 140, 250, C.steel[3]);
    part(P, P.rect(30, 230, 40, 90), C.cream, { b: 1, sh: 0, hi: 0 });
    part(P, P.path('M 10 110 L 150 110 L 150 330 L 140 330 L 140 120 L 20 120 L 20 330 L 10 330 Z'), C.steel, { b: 2, sh: 0 });
    part(P, P.poly([10, 110, 150, 110, 120, 20, 30, 20]), C.steel, { b: 3, sh: 1 });
    for (let y = 30; y < 108; y += 4) P.line(26, y, 134, y, C.steel[2]);
    part(P, P.rect(150, 40, 380, 160), C.char, { b: 1, sh: 0, hi: 0 });
    for (let x = 160; x < 530; x += 24) P.curve(`M ${x} 42 Q ${x + 8} 120 ${x - 4} 198`, [C.red[1], C.ledY, C.navy[2], C.green[2]][(x / 24) % 4 | 0]);
    part(P, P.rect(540, 40, 90, 120), C.steel, { b: 2, sh: 1 });
    part(P, P.rect(550, 56, 70, 92), C.night, { b: 0, sh: 0, hi: 0 });
    for (const [x, y] of [[585, 70], [560, 120], [610, 120]]) { P.line(585, 100, x, y, C.glow); P.line(586, 100, x + 1, y, C.cycle[2]); part(P, P.ell(x, y, 6, 6), [C.cream[3], C.cream[4], C.glow, C.glow, C.glow], { b: 2, sh: 0, hi: 0, ol: C.black }); }
    part(P, P.rect(548, 44, 74, 8), C.red, { b: 2, sh: 0, hi: 0 });
    signText(b, 'DISCONNECT', 585, 44, C.snow[4]);
    part(P, P.rect(552, 150, 66, 8), C.red, { b: 2, sh: 0, hi: 0 });
    signText(b, 'SHIELD EYES', 585, 150, C.snow[4]);
    part(P, P.rect(200, 196, 330, 284), C.char, { b: 2, sh: 1 });
    part(P, P.rect(226, 206, 188, 88), C.stone, { b: 1, sh: 0 });
    const rows = [['DESTINATION TIME', on ? '--- -- ---- --:--' : '', C.ledR], ['PRESENT TIME', on ? 'MAY 14 1986 07:27' : '', C.ledG], ['LAST TIME DEPARTED', on ? '888 88 8888 88:88' : '', C.ledY]];
    rows.forEach(([label, val, col], i) => {
      const y = 210 + i * 28;
      part(P, P.rect(232, y + 8, 176, 14), C.raven, { b: 0, sh: 0, hi: 0, ol: C.stone[3] });
      if (val) signText(b, val, 320, y + 11, col);
      signText(b, label, 320, y, C.cream[3]);
    });
    part(P, P.rect(430, 236, 70, 56), C.steel, { b: 1, sh: 0 });
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) part(P, P.rect(438 + c * 20, 240 + r * 12, 14, 9), C.steel, { b: 3, sh: 0 });
    part(P, P.rect(300, 300, 40, 26), C.stone, { b: 2, sh: 0 });
    part(P, P.rect(316, on ? 303 : 311, 8, 12), C.steel, { b: 4, sh: 0 });
    b.set(306, 306, on ? C.ledR : C.stone[1]);
    part(P, P.path('M 150 480 L 160 340 Q 170 326 220 326 L 280 330 L 296 480 Z'), C.char, { b: 2, sh: 1 });
    for (let x = 176; x < 280; x += 18) P.line(x, 340, x + 4, 478, C.char[0]);
    part(P, P.path('M 430 480 L 444 300 Q 452 290 520 290 L 628 296 L 640 480 Z'), C.char, { b: 2, sh: 1 });
    for (let x = 460; x < 630; x += 20) P.line(x, 300, x + 4, 478, C.char[0]);
    part(P, P.rect(354, 360, 10, 60), C.steel, { b: 2, sh: 0 });
    part(P, P.ell(359, 358, 9, 9), C.raven, { b: 0, sh: 0 });
    for (let i = 0; i < 18; i++) b.set(212 + Math.floor(S.hash(i, 1, 7) * 300), 330 + Math.floor(S.hash(i, 2, 7) * 20), [C.ledR, C.ledG, C.ledY][i % 3]);
  }

  function paintCourt(b, w) {
    const P = new Pen(b);
    part(P, P.rect(2, 10, w - 4, 18), C.cream, { b: 3, sh: 1 });
    part(P, P.poly([2, 11, w / 2, 1, w - 2, 11]), C.cream, { b: 4 });
    for (let x = 6; x < w - 4; x += 6) P.line(x, 14, x, 26, C.cream[1]);
  }

  const MALL_LAMPS = [250, 610, 905];
  const BRIGHT = [C.cream[3], C.cream[4], C.glow, C.glow, C.glow];

  function mallLight(x, y) {
    let v = 0;
    for (const lx of MALL_LAMPS) {
      v += 0.75 * Math.max(0, 1 - Math.hypot((x - lx) / 170, (y - 300) / 46));
      if (y > 300) v += 0.5 * Math.max(0, 1 - Math.abs(x - lx) / (5 + (y - 300) * 0.04)) * Math.max(0, 1 - (y - 300) / 170);
    }
    return v;
  }

  function pine(P, x, y, h, ramp) {
    for (let i = 0; i < 4; i++) {
      const w = h * (0.2 + i * 0.1), ty = y - h + i * h * 0.22;
      part(P, P.poly([x, ty, x + w, ty + h * 0.34, x - w, ty + h * 0.34]), ramp, { b: 1, sh: 0 });
    }
    part(P, P.rect(x - 2, y - h * 0.06, 4, h * 0.08), C.wood, { b: 0, sh: 0, hi: 0 });
  }

  function paintMall(b, storm, noTrails) {
    const P = new Pen(b);
    if (storm) {
      dfill(b, 0, 0, b.w, 170, C.dusk, (x, y) => Math.max(0, 0.12 + y / 170 * 0.22 + 0.14 * Math.sin(x / 37 + y / 23) * Math.cos(x / 71 - y / 17) + 0.06 * Math.sin(x / 13 - y / 9)));
    } else {
      dfill(b, 0, 0, b.w, 170, C.night, (x, y) => 0.08 + y / 170 * 0.42);
      for (let i = 0; i < 70; i++) b.set(Math.floor(S.hash(i, 1, 5) * b.w), Math.floor(S.hash(i, 2, 5) * 130), C.snow[i % 3 ? 2 : 4]);
    }
    for (let x = -20; x < b.w + 40; x += 34) part(P, P.ell(x + S.hash(x, 3, 1) * 16, 162, 26, 18 + S.hash(x, 4, 1) * 10), C.green, { b: 0, sh: 0, hi: 0, ol: 0 });
    dfill(b, 0, 158, b.w, 264, C.stone, (x, y) => 0.32 + mallLight(x, y + 60) * 0.35 - (y < 172 ? 0.22 : 0));
    part(P, P.rect(-2, 156, b.w + 4, 14), C.stone, { b: 1, sh: 0, hi: 0 });
    part(P, P.rect(30, 118, 190, 146), C.cream, { b: 1, sh: 1, hi: 0 });
    part(P, P.rect(30, 118, 190, 10), C.cream, { b: 0, sh: 0, hi: 0 });
    for (let x = 50; x < 210; x += 40) part(P, P.rect(x, 180, 22, 50), C.night, { b: 2, sh: 0, hi: 0 });
    part(P, P.rect(700, 108, 236, 156), C.cream, { b: 1, sh: 1, hi: 0 });
    part(P, P.rect(700, 108, 236, 10), C.cream, { b: 0, sh: 0, hi: 0 });
    part(P, P.rect(760, 148, 120, 116), C.brick, { b: 1, sh: 1, hi: 0 });
    for (let y = 156; y < 262; y += 8) P.line(762, y, 878, y, C.brick[0]);
    signText(b, 'ДЖ. П. ПИННИ', 818, 128, C.snow[4]);
    part(P, P.rect(788, 226, 64, 38), BRIGHT, { b: 1, sh: 0, hi: 0 });
    for (let x = 796; x < 852; x += 14) P.line(x, 226, x, 263, C.stone[1]);
    part(P, P.rect(370, 196, 220, 16), C.navy, { b: 1, sh: 0 });
    signText(b, 'РУБАРБИСОНС', 480, 198, C.cream[4]);
    part(P, P.rect(400, 216, 160, 48), BRIGHT, { b: 1, sh: 0, hi: 0 });
    for (let x = 400; x <= 560; x += 20) P.line(x, 216, x, 263, C.stone[1]);
    P.line(400, 240, 560, 240, C.stone[2]);
    for (const x of [270, 320, 620, 670]) part(P, P.rect(x, 190, 30, 44), C.night, { b: 3, sh: 0, hi: 0 });
    for (const x of [236, 344, 600, 690]) pine(P, x, 266, 84, C.green);
    for (let x = 10; x < b.w; x += 46) if (x < 380 || x > 580) part(P, P.ell(x + 12, 254, 16, 12), C.green, { b: 1, sh: 0 });
    part(P, P.rect(-2, 262, b.w + 4, 8), C.stone, { b: 0, sh: 0, hi: 0 });

    dfill(b, 0, 270, b.w, b.h, C.stone, (x, y) => 0.04 + (y - 270) / 210 * 0.1 + mallLight(x, y) * 0.55 + (S.hash(x >> 1, y, 4) - 0.5) * 0.08);
    for (let x = -60; x < b.w + 60; x += 64) { P.line(x, 282, x - 8, 300, C.stone[3]); P.line(x + 20, 336, x + 6, 372, C.stone[3]); P.line(x + 34, 440, x + 12, 480, C.stone[3]); }
    for (let x = 0; x < b.w; x += 2) { b.set(x, 300, C.stone[2]); b.set(x + 1, 372, C.stone[2]); }

    for (const lx of MALL_LAMPS) {
      part(P, P.rect(lx - 2, 90, 4, 206), C.steel, { b: 1, sh: 0 });
      part(P, P.rect(lx - 22, 88, 44, 4), C.steel, { b: 1, sh: 0 });
      for (const s of [-1, 1]) {
        const hx = lx + s * 18;
        if (!storm) dfill(b, hx - 16, 84, hx + 16, 110, [C.night[2], C.steel[2], C.cream[3], C.cream[4], C.glow], (x, y) => { const d = Math.hypot((x - hx) / 16, (y - 94) / 14); return d < 1 ? 0.9 - d * 0.75 : -1; });
        part(P, P.rect(hx - 6, 86, 12, 6), C.steel, { b: 2, sh: 0 });
        P.line(hx - 4, 92, hx + 4, 92, C.glow);
      }
      part(P, P.rect(lx - 6, 290, 12, 8), C.stone, { b: 2, sh: 0 });
    }

    if (!noTrails) for (let x = 512; x < 712; x++) for (const y0 of [392, 412]) {
      b.set(x, y0 + 2, C.black);
      b.set(x, y0 - 1, C.cycle[(x + y0) % 8]);
      b.set(x, y0, C.cycle[(x + y0 + 2) % 8]);
      b.set(x, y0 + 1, C.cycle[(x + y0 + 5) % 8]);
      if (S.hash(x, y0, 6) > 0.7) { const h = 2 + Math.floor(S.hash(x, y0, 7) * 5); for (let k = 2; k < h; k++) b.set(x, y0 - k, C.cycle[(x + k) % 8]); }
    }

    if (storm) {
      const bolt = [[620, 0], [600, 40], [630, 62], [596, 110], [618, 120], [590, 160]];
      for (let i = 1; i < bolt.length; i++) { P.line(bolt[i - 1][0] + 1, bolt[i - 1][1], bolt[i][0] + 1, bolt[i][1], C.dusk[4]); P.line(bolt[i - 1][0], bolt[i - 1][1], bolt[i][0], bolt[i][1], C.glow); }
      for (let i = 0; i < 520; i++) { const x = Math.floor(S.hash(i, 8, 2) * (b.w + 60)), y = Math.floor(S.hash(i, 9, 2) * b.h); P.line(x, y, x - 4, y + 10, i % 3 ? C.stone[3] : C.snow[2]); }
    }
  }

  function paintMallSign(b, lone) {
    const P = new Pen(b);
    for (const x of [34, 166]) part(P, P.rect(x, 70, 8, 34), C.steel, { b: 1, sh: 0 });
    part(P, P.rect(10, 18, 186, 54), C.stone, { b: 1, sh: 0 });
    part(P, P.rect(54, 22, 138, 30), BRIGHT, { b: 1, sh: 0, hi: 0, ol: C.stone[0] });
    signText(b, lone ? 'ОДИНОКАЯ СОСНА' : 'ДВЕ СОСНЫ', 123, 30, C.black);
    part(P, P.rect(74, 54, 98, 14), C.stone, { b: 0, sh: 0, hi: 0 });
    signText(b, lone ? '1:22 AM' : '1:20 AM', 123, 55, C.ledR);
    for (const [x, h] of (lone ? [[32, 50]] : [[24, 46], [40, 52]])) {
      for (let i = 0; i < 3; i++) { const w = 6 + i * 4, ty = 70 - h + i * 12; part(P, P.poly([x, ty, x + w, ty + 18, x - w, ty + 18]), C.green, { b: 3, sh: 0 }); }
    }
  }

  function bricks(P, b, x0, y0, x1, y1, ramp, lit) {
    dfill(b, x0, y0, x1, y1, ramp, (x, y) => lit + (S.hash(x >> 3, y >> 2, 6) - 0.5) * 0.12);
    for (let y = y0 + 4; y < y1; y += 5) { P.line(x0, y, x1 - 1, y, ramp[0]); for (let x = x0 + ((y >> 2) % 2) * 6; x < x1; x += 12) P.line(x, y - 4, x, y - 1, ramp[0]); }
  }

  function sash(P, x, y, w, h, frame, glass) {
    part(P, P.rect(x - 3, y - 3, w + 6, h + 8), frame, { b: 3, sh: 0 });
    part(P, P.rect(x, y, w, h), glass, { b: 2, sh: 0, hi: 1 });
    P.line(x, y + h / 2, x + w, y + h / 2, frame[2]);
    P.line(x + w / 2, y, x + w / 2, y + h, frame[2]);
    P.line(x + 3, y + h - 4, x + w * 0.4, y + 3, glass[4]);
  }

  function neon(b, text, cx, y) {
    S.font.drawCentered(b, text, cx + 1, y + 1, C.night[1], 0);
    for (let i = 0; i < text.length; i++) S.font.drawCentered(b, text[i], cx - text.length * 3 + i * 6 + 3, y, C.cycle[i % 6], 0);
  }

  function paintStreet86(b) {
    const P = new Pen(b);
    dfill(b, 0, 0, b.w, 200, C.sky, (x, y) => 0.75 - y / 200 * 0.35);
    for (let x = 600; x < b.w + 30; x += 30) part(P, P.ell(x + S.hash(x, 2, 4) * 12, 128, 24, 18 + S.hash(x, 3, 4) * 8), C.green, { b: 1, sh: 0 });
    part(P, P.rect(780, 40, 40, 90), C.cream, { b: 2, sh: 1 });
    part(P, P.poly([774, 42, 800, 18, 826, 42]), C.stone, { b: 2, sh: 0 });
    clock(P, 800, 66, 12, C.cream, 0.6);
    bricks(P, b, 0, 70, 252, 306, C.brick, 0.4);
    part(P, P.rect(0, 64, 252, 10), C.stone, { b: 2, sh: 0 });
    for (let x = 22; x < 240; x += 56) sash(P, x, 100, 30, 46, C.cream, C.sky);
    bricks(P, b, 252, 24, 620, 306, C.tan, 0.45);
    part(P, P.rect(248, 18, 376, 10), C.stone, { b: 2, sh: 0 });
    for (const x of [276, 360, 610 - 52]) sash(P, x, 44, 32, 46, C.cream, C.sky);
    for (const x of [276, 360]) sash(P, x, 126, 32, 46, C.cream, C.sky);
    part(P, P.rect(460, 100, 120, 10), C.stone, { b: 3, sh: 0 });
    part(P, P.rect(462, 108, 116, 80), C.cream, { b: 3, sh: 1 });
    part(P, P.rect(470, 112, 100, 64), C.sky, { b: 1, sh: 0, hi: 1 });
    for (let y = 114; y < 132; y += 3) P.line(471, y, 569, y, C.cream[3]);
    for (const x of [502, 536]) P.line(x, 112, x, 176, C.cream[2]);
    part(P, P.rect(458, 186, 124, 6), C.stone, { b: 3, sh: 0 });
    bricks(P, b, 620, 120, b.w, 306, C.brick, 0.32);
    part(P, P.rect(616, 114, b.w, 10), C.stone, { b: 2, sh: 0 });
    for (const x of [660, 760, 860]) sash(P, x, 140, 34, 36, C.cream, C.sky);

    part(P, P.rect(34, 196, 212, 110), C.night, { b: 1, sh: 0 });
    part(P, P.rect(40, 200, 200, 22), C.night, { b: 0, sh: 0, hi: 0 });
    neon(b, 'ЗВЁЗДНАЯ БАЗА ЗЕРО', 140, 205);
    for (const [x, c] of [[48, C.red], [92, C.teal], [190, C.purple]]) { part(P, P.rect(x, 230, 36, 60), C.night, { b: 2, sh: 0, hi: 1 }); part(P, P.rect(x + 6, 236, 24, 32), c, { b: 3, sh: 0 }); part(P, P.ell(x + 18, 250, 6, 6), [C.cream[3], C.cream[4], C.glow, C.glow, C.glow], { b: 2, sh: 0, hi: 0 }); }
    part(P, P.rect(136, 232, 44, 72), C.night, { b: 3, sh: 0, hi: 1 });
    P.line(158, 232, 158, 303, C.steel[2]);

    part(P, P.rect(434, 186, 172, 10), C.stone, { b: 3, sh: 0 });
    for (const x of [440, 576]) { part(P, P.rect(x, 194, 16, 110), C.cream, { b: 3, sh: 1 }); part(P, P.rect(x - 3, 194, 22, 6), C.cream, { b: 4, sh: 0 }); part(P, P.rect(x - 3, 296, 22, 8), C.cream, { b: 2, sh: 0 }); }
    part(P, P.rect(474, 206, 92, 98), C.night, { b: 1, sh: 0, hi: 0 });
    for (let x = 478; x < 566; x += 8) P.line(x, 206, x, 303, C.steel[1]);
    for (let y = 214; y < 300; y += 14) for (let x = 478; x < 562; x += 8) { P.line(x, y, x + 4, y + 7, C.steel[1]); P.line(x + 8, y, x + 4, y + 7, C.steel[1]); }
    part(P, P.rect(456, 240, 16, 24), C.gold, { b: 2, sh: 0 });
    part(P, P.ell(464, 258, 2.5, 2.5), C.stone, { b: 3, sh: 0 });
    P.line(459, 246, 469, 246, C.black);

    part(P, P.rect(636, 196, 228, 110), C.cream, { b: 3, sh: 1 });
    part(P, P.rect(644, 200, 212, 22), C.snow, { b: 4, sh: 0 });
    signText(b, 'ВИННЫЙ A1', 750, 206, C.red[2]);
    for (const x0 of [650, 770]) {
      part(P, P.rect(x0, 236, 80, 60), C.night, { b: 2, sh: 0, hi: 1 });
      for (let x = x0 + 6; x < x0 + 80; x += 10) P.line(x, 236, x, 295, C.steel[3]);
      for (let i = 0; i < 6; i++) part(P, P.poly([x0 - 4 + i * 15, 224, x0 + 11 + i * 15, 224, x0 + 11 + i * 15, 236, x0 - 4 + i * 15, 236]), i % 2 ? C.snow : C.green, { b: 3, sh: 0 });
    }
    part(P, P.rect(734, 238, 32, 66), C.wood, { b: 2, sh: 0 });

    dfill(b, 0, 304, b.w, 392, C.stone, (x, y) => 0.5 - (y - 304) / 88 * 0.1 + (S.hash(x >> 1, y >> 1, 5) - 0.5) * 0.1);
    for (let x = 0; x < b.w; x += 48) P.line(x, 304, x - 16, 392, C.stone[1]);
    part(P, P.rect(-2, 390, b.w + 4, 8), C.stone, { b: 3, sh: 0 });
    dfill(b, 0, 398, b.w, b.h, C.char, (x, y) => 0.3 + (S.hash(x >> 1, y >> 1, 6) - 0.5) * 0.12);
    for (let x = 0; x < b.w; x += 60) part(P, P.rect(x, 448, 34, 3), C.gold, { b: 3, sh: 0, hi: 0, ol: 0 });
    part(P, P.rect(608, 262, 4, 42), C.steel, { b: 1, sh: 0 });
    part(P, P.rect(603, 248, 14, 16), C.steel, { b: 2, sh: 0 });
    b.set(608, 254, C.ledR);
    part(P, P.rect(300, 278, 24, 26), C.red, { b: 2, sh: 1 });
    part(P, P.ell(312, 278, 12, 5), C.red, { b: 3, sh: 0 });
    for (const s of [-1, 1]) part(P, P.rect(312 + s * 14 - 3, 284, 6, 6), C.red, { b: 2, sh: 0 });
    part(P, P.rect(900, 254, 40, 50), C.green, { b: 2, sh: 1 });
    for (let x = 906; x < 938; x += 6) P.line(x, 260, x, 302, C.green[0]);
    part(P, P.ell(920, 254, 21, 5), C.green, { b: 3, sh: 0 });
    for (const [x, y] of [[360, 330], [580, 360], [820, 340], [130, 370], [700, 380]]) part(P, P.poly([x, y, x + 6, y - 2, x + 8, y + 3, x + 1, y + 4]), C.snow, { b: 3, sh: 0 });
  }

  function paintFlat86(b) {
    const P = new Pen(b);
    dfill(b, 0, 0, b.w, 300, C.green, (x, y) => 0.32 + light([{ x: 410, y: 150, rx: 360, ry: 260, k: 0.25 }], x, y) + (S.hash(x >> 2, y >> 2, 3) - 0.5) * 0.08);
    for (let y = 12; y < 296; y += 24) for (let x = ((y / 24) % 2) * 16 + 8; x < b.w; x += 32) { b.set(x, y, C.pink[3]); b.set(x - 1, y, C.pink[2]); b.set(x + 1, y, C.pink[2]); b.set(x, y - 1, C.pink[2]); b.set(x, y + 1, C.cream[4]); }
    part(P, P.rect(-2, 292, b.w + 4, 10), C.wood, { b: 2, sh: 0 });
    dfill(b, 0, 302, b.w, b.h, C.maroon, (x, y) => 0.3 + (y - 302) / 178 * 0.15 + (S.hash(x >> 1, y >> 1, 7) - 0.5) * 0.12);
    part(P, P.poly([120, 360, 680, 360, 740, 470, 60, 470]), C.maroon, { b: 1, sh: 0, hi: 0, ol: C.gold[1] });

    part(P, P.rect(292, 62, 236, 176), C.cream, { b: 3, sh: 1 });
    dfill(b, 302, 72, 518, 228, C.sky, (x, y) => 0.8 - (y - 72) / 156 * 0.4);
    part(P, P.rect(330, 150, 80, 78), C.brick, { b: 1, sh: 0 });
    part(P, P.rect(430, 170, 70, 58), C.cream, { b: 2, sh: 0 });
    for (let y = 74; y < 132; y += 3) P.line(303, y, 517, y, C.cream[3]);
    part(P, P.rect(302, 130, 216, 4), C.cream, { b: 2, sh: 0 });
    for (const x of [372, 448]) part(P, P.rect(x, 72, 6, 156), C.cream, { b: 3, sh: 0 });
    part(P, P.rect(284, 236, 252, 10), C.cream, { b: 4, sh: 0 });
    for (const x of [300, 500]) P.line(x, 134, x - 4, 180, C.cream[2]);

    part(P, P.rect(40, 150, 70, 100), C.snow, { b: 3, sh: 1 });
    for (let x = 46; x < 106; x += 7) P.line(x, 154, x, 246, C.snow[1]);
    part(P, P.ell(104, 160, 6, 6), C.red, { b: 3, sh: 0 });

    for (const [x, y, w, h] of [[144, 84, 34, 42], [188, 80, 40, 30], [236, 86, 30, 38], [190, 120, 36, 46], [148, 134, 30, 30]]) { part(P, P.rect(x, y, w, h), C.gold, { b: 2, sh: 0 }); part(P, P.rect(x + 3, y + 3, w - 6, h - 6), C.tan, { b: 3, sh: 0, hi: 0 }); part(P, P.ell(x + w / 2, y + h / 2, w / 5, h / 4), C.tan, { b: 1, sh: 0, hi: 0, ol: 0 }); }

    part(P, P.rect(140, 196, 180, 6), C.wood, { b: 3, sh: 0 });
    for (const x of [150, 176, 206, 290]) { part(P, P.path(`M ${x} 196 L ${x - 3} 184 L ${x + 9} 184 L ${x + 6} 196 Z`), C.gold, { b: 3, sh: 0 }); part(P, P.ell(x + 3, 182, 7, 3), C.gold, { b: 4, sh: 0 }); }
    part(P, P.rect(232, 284, 76, 20), C.wood, { b: 2, sh: 0 });
    part(P, P.rect(238, 230, 64, 54), C.wood, { b: 2, sh: 1 });
    part(P, P.rect(244, 236, 40, 40), C.stone, { b: 1, sh: 0, hi: 1 });
    for (const x of [288, 290]) b.set(x, 252, C.ledR);
    P.line(256, 230, 240, 206, C.steel[3]); P.line(272, 230, 290, 204, C.steel[3]);

    part(P, P.rect(116, 268, 100, 8), C.wood, { b: 3, sh: 0 });
    for (const x of [120, 206]) part(P, P.rect(x, 276, 6, 28), C.wood, { b: 2, sh: 0 });
    part(P, P.rect(140, 250, 50, 20), C.stone, { b: 2, sh: 1 });
    part(P, P.rect(146, 244, 38, 8), C.snow, { b: 4, sh: 0 });
    part(P, P.ell(204, 262, 10, 6), C.teal, { b: 3, sh: 1 });
    part(P, P.ell(204, 258, 10, 4), C.gold, { b: 3, sh: 0 });

    part(P, P.rect(604, 104, 162, 132), C.wood, { b: 2, sh: 0 });
    part(P, P.rect(612, 112, 146, 124), C.cream, { b: 3, sh: 0 });
    for (let y = 116; y < 236; y += 10) for (let x = 612 + ((y / 10) % 2) * 5; x < 758; x += 10) part(P, P.rect(x, y, 5, 5), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
    part(P, P.rect(660, 140, 60, 50), C.steel, { b: 3, sh: 0 });
    part(P, P.ell(690, 134, 12, 9), C.red, { b: 3, sh: 1 });
    part(P, P.rect(684, 122, 12, 5), C.red, { b: 2, sh: 0 });
    part(P, P.poly([700, 132, 712, 124, 714, 128, 702, 136]), C.red, { b: 2, sh: 0 });

    part(P, P.path('M 556 312 L 560 262 Q 562 246 580 246 L 742 246 Q 760 246 762 262 L 766 312 Z'), C.green, { b: 2, sh: 1 });
    part(P, P.rect(552, 278, 218, 34), C.green, { b: 3, sh: 1 });
    for (const [x, y, w, h, c] of [[572, 258, 40, 24, C.cream], [618, 254, 36, 28, C.snow], [664, 260, 44, 22, C.cream], [714, 256, 34, 26, C.tan], [590, 286, 50, 18, C.cream], [680, 288, 60, 16, C.snow]]) { part(P, P.rect(x, y, w, h), c, { b: 3, sh: 1 }); for (let yy = y + 4; yy < y + h; yy += 4) P.line(x + 2, yy, x + w - 2, yy, c[1]); }
    for (const [x, y] of [[520, 330], [540, 360], [770, 336]]) { part(P, P.rect(x, y, 34, 26), C.tan, { b: 2, sh: 1 }); P.line(x, y + 6, x + 34, y + 6, C.tan[0]); }
    part(P, P.rect(458, 352, 62, 8), C.wood, { b: 3, sh: 0 });
    part(P, P.rect(464, 360, 50, 34), C.wood, { b: 2, sh: 1 });
    P.line(466, 376, 512, 376, C.wood[0]);
    part(P, P.ell(340, 352, 22, 6), C.wood, { b: 3, sh: 0 });
    part(P, P.rect(336, 356, 8, 30), C.wood, { b: 2, sh: 0 });
    part(P, P.ell(334, 344, 7, 6), C.snow, { b: 4, sh: 0 });
    for (const x of [346, 354]) part(P, P.ell(x, 348, 3, 2), C.snow, { b: 4, sh: 0 });
  }

  function binocView(withBiff) {
    return (f, t) => {
      const P = new Pen(f);
      dfill(f, 0, 0, f.w, 200, C.sky, (x, y) => 0.8 - y / 200 * 0.3);
      part(P, P.rect(0, 70, 170, 330), C.cream, { b: 3, sh: 1 });
      for (const x of [20, 70, 120]) part(P, P.rect(x, 90, 24, 310), C.cream, { b: 4, sh: 1 });
      part(P, P.poly([-10, 72, 85, 20, 180, 72]), C.cream, { b: 2, sh: 0 });
      bricks(P, f, 170, 60, 640, 400, C.brick, 0.42);
      part(P, P.rect(170, 52, 470, 14), C.stone, { b: 2, sh: 0 });
      part(P, P.rect(230, 110, 300, 60), C.navy, { b: 2, sh: 0 });
      for (let i = 0; i < 3; i++) { const w = 8 + i * 6, ty = 116 + i * 12; part(P, P.poly([262, ty, 262 + w, ty + 20, 262 - w, ty + 20]), C.green, { b: 3, sh: 0 }); }
      neon(f, 'ВИДЕО ВЭЛЛИ', 400, 134);
      part(P, P.rect(230, 200, 300, 200), C.night, { b: 1, sh: 0, hi: 1 });
      for (let x = 240; x < 520; x += 46) { part(P, P.rect(x, 210, 36, 54), [C.red, C.teal, C.purple, C.gold, C.green, C.navy][(x / 46 | 0) % 6], { b: 3, sh: 0 }); }
      part(P, P.rect(350, 280, 70, 120), C.night, { b: 2, sh: 0, hi: 1 });
      if (withBiff) {
        part(P, P.rect(236, 176, 150, 14), C.gold, { b: 3, sh: 0 });
        S.font.drawCentered(f, 'ПЕРЕСТРОЕНО В ФЕВРАЛЕ 1932', 311, 179, C.hair[0], 0);
        const spr = S.sprite('bt_biff', { dir: 's', act: 'hold', walk: -1, t }, 1.3);
        S.blit(f, spr.buf, 440 - Math.round(spr.ox), 404 - Math.round(spr.oy));
      }
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
        const d = Math.min(Math.hypot(x - 222, y - 210) / 196, Math.hypot(x - 418, y - 210) / 196);
        if (d > 1) f.px[y * f.w + x] = C.black;
        else if (d > 0.93) f.px[y * f.w + x] = (x + y) & 1 ? C.black : C.stone[0];
      }
    };
  }

  B.BG = { paintLab, paintBack, paintYard, paintDeLorean, paintCar, paintCourt, paintMall, paintMallSign, paintStreet86, paintFlat86, binocView, dfill, light, part, clock, pine, bricks, sash, neon, signText };
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
