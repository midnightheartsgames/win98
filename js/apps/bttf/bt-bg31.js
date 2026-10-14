(function (S, B) {
  'use strict';
  const { Pen } = S;
  const C = B.C;
  const { dfill, part, clock, bricks, sash, signText } = B.BG;
  const WARM = [C.cream[2], C.cream[3], C.cream[4], C.glow, C.glow];

  function awning(P, x0, y, n, w, a, b) {
    for (let i = 0; i < n; i++) part(P, P.poly([x0 + i * w, y, x0 + (i + 1) * w, y, x0 + (i + 1) * w + 2, y + 14, x0 + i * w + 2, y + 14]), i % 2 ? a : b, { b: 3, sh: 0 });
    for (let i = 0; i < n; i++) part(P, P.path(`M ${x0 + i * w + 2} ${y + 14} Q ${x0 + i * w + w / 2 + 2} ${y + 20} ${x0 + (i + 1) * w + 2} ${y + 14} Z`), i % 2 ? a : b, { b: 2, sh: 0 });
  }

  function gasLamp(P, x, y) {
    part(P, P.rect(x - 2, y, 4, 304 - y), C.raven, { b: 2, sh: 0 });
    part(P, P.rect(x - 5, 296, 10, 8), C.raven, { b: 2, sh: 0 });
    part(P, P.path(`M ${x - 7} ${y - 4} L ${x + 7} ${y - 4} L ${x + 5} ${y - 20} L ${x - 5} ${y - 20} Z`), C.cream, { b: 3, sh: 0, hi: 0 });
    part(P, P.poly([x - 9, y - 20, x + 9, y - 20, x, y - 28]), C.raven, { b: 2, sh: 0 });
  }

  function paintArthur31(b) {
    const P = new Pen(b);
    dfill(b, 0, 0, b.w, 200, C.sky, (x, y) => 0.78 - y / 200 * 0.36);
    for (let x = 400; x < b.w + 30; x += 30) part(P, P.ell(x + S.hash(x, 2, 4) * 12, 128, 24, 18 + S.hash(x, 3, 4) * 8), C.green, { b: 1, sh: 0 });
    part(P, P.rect(540, 40, 40, 90), C.cream, { b: 2, sh: 1 });
    part(P, P.poly([534, 42, 560, 18, 586, 42]), C.stone, { b: 2, sh: 0 });
    clock(P, 560, 66, 12, C.cream, 0.18);

    bricks(P, b, 0, 70, 232, 306, C.brick, 0.42);
    part(P, P.rect(0, 64, 232, 10), C.stone, { b: 2, sh: 0 });
    for (let x = 22; x < 220; x += 56) sash(P, x, 100, 30, 46, C.cream, C.sky);
    bricks(P, b, 232, 24, 412, 306, C.tan, 0.47);
    part(P, P.rect(228, 18, 188, 10), C.stone, { b: 2, sh: 0 });
    for (const x of [252, 364]) sash(P, x, 44, 30, 46, C.cream, C.sky);
    part(P, P.rect(272, 90, 136, 10), C.stone, { b: 3, sh: 0 });
    part(P, P.rect(274, 98, 132, 80), C.cream, { b: 3, sh: 1 });
    part(P, P.rect(282, 102, 116, 66), C.sky, { b: 1, sh: 0, hi: 1 });
    for (const x of [320, 360]) P.line(x, 102, x, 168, C.cream[2]);
    for (const s of [-1, 1]) part(P, P.path(`M ${340 + s * 58} 102 Q ${340 + s * 36} 130 ${340 + s * 52} 168 L ${340 + s * 58} 168 Z`), C.snow, { b: 3, sh: 0 });
    for (let x = 290; x < 396; x += 8) b.set(x, 104, C.snow[2]);
    part(P, P.rect(270, 176, 140, 6), C.stone, { b: 3, sh: 0 });
    bricks(P, b, 412, 120, b.w, 306, C.brick, 0.34);
    part(P, P.rect(408, 114, b.w, 10), C.stone, { b: 2, sh: 0 });
    for (const x of [440, 540]) sash(P, x, 140, 34, 36, C.cream, C.sky);

    part(P, P.rect(34, 196, 192, 110), C.green, { b: 1, sh: 0 });
    part(P, P.rect(40, 200, 180, 20), C.green, { b: 0, sh: 0, hi: 0 });
    signText(b, 'БИЛЬЯРДНАЯ', 136, 205, C.cream[4]);
    part(P, P.ell(56, 210, 8, 8), C.raven, { b: 1, sh: 0 });
    part(P, P.ell(56, 210, 4, 4), C.snow, { b: 4, sh: 0, hi: 0 });
    signText(b, '8', 56, 207, C.black);
    for (const x0 of [44, 156]) {
      part(P, P.rect(x0, 228, 60, 62), C.night, { b: 2, sh: 0, hi: 1 });
      for (const lx of [x0 + 16, x0 + 44]) { P.line(lx, 228, lx, 238, C.raven[2]); part(P, P.poly([lx - 8, 246, lx + 8, 246, lx + 4, 238, lx - 4, 238]), C.green, { b: 3, sh: 0 }); dfill(b, lx - 12, 246, lx + 12, 270, WARM, (x, y) => 0.5 - Math.abs(x - lx) / 12 * 0.4 - (y - 246) / 24 * 0.4); }
      part(P, P.rect(x0 + 6, 274, 48, 10), C.green, { b: 3, sh: 0 });
    }
    part(P, P.rect(110, 232, 40, 72), C.wood, { b: 2, sh: 0 });
    part(P, P.rect(116, 238, 28, 26), C.night, { b: 2, sh: 0, hi: 1 });

    part(P, P.rect(240, 186, 136, 10), C.stone, { b: 3, sh: 0 });
    for (const x of [244, 354]) { part(P, P.rect(x, 194, 14, 110), C.cream, { b: 3, sh: 1 }); part(P, P.rect(x - 3, 194, 20, 6), C.cream, { b: 4, sh: 0 }); part(P, P.rect(x - 3, 296, 20, 8), C.cream, { b: 2, sh: 0 }); }
    part(P, P.rect(266, 204, 80, 100), C.wood, { b: 2, sh: 1 });
    for (const x0 of [270, 308]) { part(P, P.rect(x0, 210, 34, 42), C.wood, { b: 1, sh: 0 }); part(P, P.rect(x0, 258, 34, 40), C.wood, { b: 1, sh: 0 }); }
    part(P, P.rect(282, 214, 48, 18), C.night, { b: 3, sh: 0, hi: 1 });
    part(P, P.rect(286, 236, 40, 14), C.gold, { b: 3, sh: 0 });
    signText(b, '10', 306, 238, C.hair[0]);
    part(P, P.ell(338, 280, 2.5, 2.5), C.gold, { b: 4, sh: 0 });
    part(P, P.rect(372, 240, 14, 20), C.gold, { b: 2, sh: 0 });
    part(P, P.ell(379, 252, 2.5, 2.5), C.stone, { b: 3, sh: 0 });

    part(P, P.rect(416, 196, 192, 110), C.cream, { b: 3, sh: 1 });
    part(P, P.rect(422, 200, 180, 20), C.wood, { b: 1, sh: 0 });
    signText(b, 'ПЕКАРНЯ «ВЭЛЛИ»', 512, 205, C.gold[4]);
    awning(P, 418, 222, 8, 24, C.snow, C.red);
    part(P, P.rect(426, 244, 104, 50), C.night, { b: 2, sh: 0, hi: 1 });
    signText(b, 'СВЕЖИЙ ХЛЕБ', 478, 250, C.gold[4]);
    signText(b, 'С 1905', 478, 262, C.cream[3]);
    for (let i = 0; i < 5; i++) part(P, P.ell(442 + i * 18, 284, 8, 5), C.tan, { b: 3, sh: 0 });
    part(P, P.rect(546, 242, 48, 62), C.wood, { b: 2, sh: 1 });
    part(P, P.rect(552, 250, 36, 22), C.night, { b: 2, sh: 0, hi: 1 });
    P.line(562, 250, 570, 262, C.raven[3]); P.line(578, 250, 570, 262, C.raven[3]);
    part(P, P.rect(546, 262, 48, 12), C.snow, { b: 4, sh: 0 });
    signText(b, 'ЗАКРЫТО', 570, 264, C.red[1]);

    dfill(b, 0, 304, b.w, 392, C.stone, (x, y) => 0.52 - (y - 304) / 88 * 0.1 + (S.hash(x >> 1, y >> 1, 5) - 0.5) * 0.1);
    for (let x = 0; x < b.w; x += 40) P.line(x, 304, x - 14, 392, C.stone[1]);
    part(P, P.rect(-2, 390, b.w + 4, 8), C.stone, { b: 3, sh: 0 });
    dfill(b, 0, 398, b.w, b.h, C.stone, (x, y) => 0.24 + (S.hash(x >> 1, y >> 1, 6) - 0.5) * 0.1);
    for (let y = 404; y < b.h; y += 10) for (let x = (y / 10 % 2) * 10; x < b.w; x += 20) P.line(x, y, x, y + 8, C.stone[0]);
    for (let y = 404; y < b.h; y += 10) P.line(0, y, b.w - 1, y, C.stone[0]);
    gasLamp(P, 618, 140);
    part(P, P.rect(226, 280, 18, 24), C.red, { b: 2, sh: 1 });
    part(P, P.ell(235, 280, 9, 4), C.red, { b: 3, sh: 0 });
    for (const [x, y] of [[300, 340], [470, 360], [90, 330]]) part(P, P.poly([x, y, x + 6, y - 2, x + 8, y + 3, x + 1, y + 4]), C.cream, { b: 3, sh: 0 });
  }

  const SQ_LAMPS = [30, 472, 832, 1206, 1544];

  function lamp31(P, b, x, night) {
    gasLamp(P, x, 230);
    if (night) dfill(b, x - 24, 194, x + 24, 242, WARM, (xx, yy) => { const d = Math.hypot((xx - x) / 24, (yy - 218) / 24); return d < 1 && S.hash(xx, yy, 1) > d * 1.25 ? 0.5 - d * 0.5 : -1; });
    part(P, P.rect(x - 4, 212, 8, 12), night ? [C.glow, C.glow, C.glow, C.glow, C.glow] : C.cream, { b: 3, sh: 0, hi: 0 });
  }

  function windows(P, b, x0, x1, y, w, h, gap, night, litFn) {
    for (let x = x0; x + w <= x1; x += w + gap) {
      const lit = night && litFn && litFn(x);
      part(P, P.rect(x - 2, y - 2, w + 4, h + 6), C.cream, { b: 3, sh: 0 });
      part(P, P.rect(x, y, w, h), lit ? WARM : night ? C.night : C.sky, { b: lit ? 2 : night ? 1 : 2, sh: 0, hi: lit ? 0 : 1 });
      P.line(x, y + h / 2, x + w, y + h / 2, C.cream[2]);
      P.line(x + w / 2, y, x + w / 2, y + h, C.cream[2]);
    }
  }

  function paintSquare31(b, night) {
    const P = new Pen(b);
    if (night) {
      dfill(b, 0, 0, b.w, 240, C.night, (x, y) => 0.12 + y / 240 * 0.3);
      for (let i = 0; i < 120; i++) b.set(Math.floor(S.hash(i, 1, 9) * b.w), Math.floor(S.hash(i, 2, 9) * 150), C.snow[i % 4 ? 2 : 4]);
      part(P, P.ell(700, 46, 16, 16), [C.cream[3], C.cream[4], C.glow, C.glow, C.glow], { b: 2, sh: 0, hi: 0 });
      part(P, P.ell(708, 42, 14, 14), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
    } else {
      dfill(b, 0, 0, b.w, 240, C.sky, (x, y) => 0.82 - y / 240 * 0.38);
      for (const [x, y, w] of [[180, 40, 90], [520, 60, 70], [1100, 36, 110], [1420, 70, 80]]) for (let k = 0; k < 4; k++) part(P, P.ell(x + k * w * 0.25, y + (k % 2) * 4, w * 0.22, 10), C.snow, { b: 4, sh: 1, hi: 0, ol: 0 });
    }
    for (let x = -20; x < b.w + 30; x += 34) part(P, P.ell(x + S.hash(x, 2, 4) * 12, 176, 26, 22 + S.hash(x, 3, 4) * 12), C.green, { b: night ? 0 : 1, sh: 0, hi: 0, ol: 0 });
    const lit = night ? 0.18 : 0.42;

    bricks(P, b, 40, 130, 272, 306, C.brick, lit);
    part(P, P.rect(34, 122, 244, 12), C.stone, { b: 2, sh: 0 });
    windows(P, b, 56, 270, 146, 26, 30, 22, night, x => x < 200);
    part(P, P.rect(132, 196, 76, 14), C.stone, { b: 3, sh: 0 });
    signText(b, 'ПОЛИЦИЯ', 170, 199, C.navy[1]);
    part(P, P.rect(80, 190, 46, 40), night ? WARM : C.night, { b: night ? 1 : 1, sh: 0, hi: 0 });
    for (let x = 84; x < 126; x += 6) P.line(x, 190, x, 229, C.raven[2]);
    P.line(80, 210, 125, 210, C.raven[2]);
    part(P, P.rect(146, 214, 48, 92), C.stone, { b: 3, sh: 0 });
    part(P, P.rect(150, 220, 40, 85), C.wood, { b: 2, sh: 1 });
    P.line(170, 220, 170, 304, C.wood[0]);
    for (const x of [140, 200]) { part(P, P.rect(x - 1, 214, 2, 12), C.raven, { b: 2, sh: 0 }); part(P, P.ell(x, 210, 5, 5), night ? [C.sky[3], C.sky[4], C.glow, C.glow, C.glow] : C.sky, { b: 3, sh: 0, hi: 0 }); }
    part(P, P.rect(140, 300, 60, 6), C.stone, { b: 3, sh: 0 });

    bricks(P, b, 276, 150, 468, 306, C.tan, lit + 0.06);
    part(P, P.rect(272, 144, 200, 10), C.stone, { b: 2, sh: 0 });
    part(P, P.rect(286, 160, 172, 40), C.green, { b: 1, sh: 0 });
    part(P, P.rect(290, 164, 164, 32), C.cream, { b: 4, sh: 0 });
    signText(b, 'СТОЛОВАЯ', 372, 167, C.green[1]);
    signText(b, 'СЕСТЁР МИЛОСЕРДИЯ', 372, 180, C.green[1]);
    for (const x0 of [288, 404]) { part(P, P.rect(x0, 222, 54, 56), night ? C.night : C.sky, { b: night ? 1 : 2, sh: 0, hi: 1 }); for (let x = x0 + 6; x < x0 + 54; x += 12) P.line(x, 222, x, 277, C.cream[2]); part(P, P.rect(x0 - 2, 276, 58, 6), C.cream, { b: 3, sh: 0 }); }
    part(P, P.rect(346, 214, 52, 92), C.stone, { b: 3, sh: 0 });
    part(P, P.rect(350, 220, 44, 85), C.maroon, { b: 2, sh: 1 });
    part(P, P.rect(358, 228, 28, 22), night ? C.night : C.sky, { b: 2, sh: 0, hi: 1 });
    part(P, P.ell(388, 266, 2.5, 2.5), C.gold, { b: 4, sh: 0 });

    dfill(b, 470, 250, 836, 306, C.green, (x, y) => (night ? 0.08 : 0.28) + (S.hash(x >> 1, y >> 1, 4) - 0.5) * 0.25);
    part(P, P.rect(470, 296, 366, 12), C.stone, { b: 2, sh: 0 });
    for (let x = 476; x < 832; x += 20) part(P, P.rect(x, 290, 8, 8), C.stone, { b: 3, sh: 0 });
    part(P, P.rect(522, 196, 16, 104), C.wood, { b: 1, sh: 1 });
    part(P, P.path('M 524 220 Q 506 214 498 198'), C.wood, { b: 1 });
    for (const [x, y, rx, ry] of [[530, 150, 52, 40], [500, 120, 34, 30], [560, 116, 36, 32], [530, 96, 34, 26], [486, 168, 26, 22], [576, 166, 28, 24]]) part(P, P.ell(x, y, rx, ry), C.green, { b: night ? 1 : 2, sh: 1 });
    for (let i = 0; i < 40; i++) b.set(492 + Math.floor(S.hash(i, 1, 2) * 76), 84 + Math.floor(S.hash(i, 2, 2) * 100), C.green[night ? 2 : 4]);

    part(P, P.rect(604, 272, 162, 34), C.cream, { b: 3, sh: 1 });
    for (let x = 610; x < 762; x += 8) { P.line(x, 278, x + 6, 300, C.cream[1]); P.line(x + 6, 278, x, 300, C.cream[1]); }
    for (const x of [608, 650, 718, 760]) part(P, P.rect(x - 3, 172, 6, 102), C.cream, { b: 4, sh: 1 });
    for (let x = 610; x < 760; x += 6) P.line(x, 252, x, 270, C.cream[3]);
    P.line(606, 252, 764, 252, C.cream[4]);
    for (let i = 0; i < 6; i++) part(P, P.path(`M ${606 + i * 26} 174 Q ${619 + i * 26} 186 ${632 + i * 26} 174 Z`), [C.red, C.snow, C.navy][i % 3], { b: 3, sh: 0 });
    part(P, P.poly([590, 176, 685, 116, 780, 176]), C.green, { b: night ? 0 : 1, sh: 1 });
    for (let i = 1; i < 6; i++) P.line(685, 116, 590 + i * 32, 176, C.green[0]);
    P.line(685, 116, 685, 92, C.raven[2]);
    part(P, P.poly([686, 92, 706, 98, 686, 104]), C.red, { b: 3, sh: 0 });

    part(P, P.rect(836, 140, 180, 166), C.cream, { b: night ? 1 : 3, sh: 1 });
    part(P, P.poly([830, 142, 925, 92, 1020, 142]), C.cream, { b: night ? 2 : 4, sh: 0 });
    part(P, P.rect(830, 140, 190, 8), C.cream, { b: night ? 1 : 2, sh: 0 });
    clock(P, 925, 120, 14, C.cream, night ? 0.95 : 0.4);
    if (night) dfill(b, 912, 108, 938, 132, [C.cream[3], C.cream[4], C.glow, C.glow, C.glow], (x, y) => Math.hypot(x - 925, y - 120) < 10 ? 0.3 : -1);
    if (night) clock(P, 925, 120, 14, C.cream, 0.95);
    for (const x of [862, 892, 958, 988]) { part(P, P.rect(x - 6, 152, 12, 140), C.cream, { b: night ? 2 : 4, sh: 1 }); for (let k = -3; k <= 3; k += 3) P.line(x + k, 156, x + k, 290, C.cream[night ? 1 : 2]); }
    part(P, P.rect(900, 210, 56, 96), C.stone, { b: 2, sh: 0 });
    part(P, P.rect(905, 215, 46, 90), C.wood, { b: 2, sh: 1 });
    P.line(928, 215, 928, 304, C.wood[0]);
    signText(b, 'СУД', 925, 196, C.hair[0]);
    for (let i = 0; i < 3; i++) part(P, P.rect(846 + i * 4, 292 + i * 5, 160 - i * 8, 5), C.cream, { b: night ? 1 : 3, sh: 0 });

    dfill(b, 1018, 160, 1114, 306, C.stone, (x, y) => lit + 0.15 + (S.hash(x >> 2, y >> 2, 5) - 0.5) * 0.1);
    part(P, P.rect(1014, 154, 104, 8), C.stone, { b: 1, sh: 0 });
    part(P, P.rect(1023, 173, 84, 28), C.wood, { b: 1, sh: 0 });
    signText(b, 'ГЕЙЛ, ЗЕМЕКИС', 1065, 176, C.gold[4]);
    signText(b, 'И ФАЙН', 1065, 188, C.gold[4]);
    windows(P, b, 1030, 1110, 214, 30, 40, 14, night, () => false);
    part(P, P.rect(1050, 266, 30, 40), C.wood, { b: 2, sh: 1 });

    dfill(b, 1118, 166, 1206, 306, C.pink, (x, y) => lit + 0.05 + (S.hash(x >> 2, y >> 2, 6) - 0.5) * 0.1);
    part(P, P.rect(1114, 160, 96, 8), C.stone, { b: 2, sh: 0 });
    part(P, P.rect(1124, 176, 76, 18), C.raven, { b: 2, sh: 0 });
    signText(b, 'МЕХА ЛАМОНТА', 1162, 180, C.cream[4]);
    part(P, P.rect(1126, 206, 72, 70), night ? C.night : C.sky, { b: night ? 1 : 2, sh: 0, hi: 1 });
    part(P, P.path('M 1150 214 Q 1162 208 1174 214 L 1182 270 L 1142 270 Z'), C.wood, { b: 3, sh: 0 });
    part(P, P.ell(1162, 214, 6, 5), C.cream, { b: 3, sh: 0 });
    part(P, P.rect(1150, 280, 24, 26), C.wood, { b: 2, sh: 0 });

    dfill(b, 1208, 150, 1344, 306, C.char, (x, y) => 0.1 + (S.hash(x >> 1, y >> 1, 7) - 0.5) * 0.25 + (y > 250 ? 0.08 : 0));
    for (const [x0, y0, x1, y1] of [[1214, 150, 1240, 210], [1290, 160, 1336, 206], [1250, 186, 1300, 160]]) { P.line(x0, y0, x1, y1, C.raven[0]); P.line(x0 + 1, y0, x1 + 1, y1, C.wood[1]); }
    for (let y = 214; y < 300; y += 9) part(P, P.rect(1218, y, 116, 7), C.plank, { b: night ? 1 : 2, sh: 0 });
    for (const [a, c] of [[[1218, 216, 1334, 296], 0], [[1218, 296, 1334, 216], 1]]) part(P, P.poly([a[0], a[1], a[0] + 6, a[1], a[2], a[3], a[2] - 6, a[3]]), C.plank, { b: night ? 2 : 3, sh: 0 });
    part(P, P.rect(1252, 244, 50, 14), C.snow, { b: 4, sh: 0 });
    signText(b, 'ЗАКРЫТО', 1277, 247, C.red[1]);
    for (const x of [1206, 1344]) dfill(b, x - 10, 150, x + 10, 306, C.raven, (xx, yy) => S.hash(xx, yy, 3) < 0.35 - Math.abs(xx - x) / 30 ? 0.2 : -1);
    for (let i = 0; i < 18; i++) part(P, P.ell(1214 + S.hash(i, 1, 4) * 124, 302 + S.hash(i, 2, 4) * 4, 4 + S.hash(i, 3, 4) * 6, 3), C.char, { b: 1, sh: 0 });

    bricks(P, b, 1346, 166, 1424, 306, C.tan, lit + 0.04);
    part(P, P.path('M 1350 196 L 1350 178 Q 1386 160 1420 178 L 1420 196 Z'), C.green, { b: 2, sh: 0 });
    signText(b, 'КАНЦТОВАРЫ', 1385, 182, C.cream[4]);
    part(P, P.poly([1348, 204, 1422, 204, 1426, 220, 1344, 220]), C.purple, { b: 2, sh: 0 });
    part(P, P.rect(1354, 224, 62, 50), night ? C.night : C.sky, { b: night ? 1 : 2, sh: 0, hi: 1 });
    part(P, P.rect(1374, 278, 22, 28), C.wood, { b: 2, sh: 0 });

    bricks(P, b, 1426, 150, 1600, 306, C.brick, lit);
    part(P, P.rect(1422, 144, 178, 10), C.stone, { b: 2, sh: 0 });
    part(P, P.rect(1436, 164, 98, 30), C.snow, { b: 4, sh: 0 });
    signText(b, 'ПАРИКМАХЕРСКАЯ', 1485, 168, C.navy[1]);
    signText(b, 'О’МЭЛЛИ И СЫНОВЬЯ', 1485, 180, C.red[1]);
    part(P, P.rect(1440, 202, 72, 56), night ? C.night : C.sky, { b: night ? 1 : 2, sh: 0, hi: 1 });
    part(P, P.rect(1518, 196, 10, 64), C.snow, { b: 4, sh: 0 });
    for (let y = 198; y < 258; y += 8) P.line(1519, y, 1527, y + 6, C.red[2]);
    part(P, P.ell(1523, 194, 6, 4), C.gold, { b: 3, sh: 0 });
    part(P, P.rect(1444, 266, 24, 40), C.wood, { b: 2, sh: 0 });
    part(P, P.rect(1544, 196, 54, 76), C.cream, { b: 3, sh: 0 });
    part(P, P.rect(1548, 200, 46, 68), C.navy, { b: 2, sh: 0 });
    part(P, P.path('M 1552 252 Q 1570 228 1590 250 L 1584 256 Q 1570 244 1556 258 Z'), C.steel, { b: 3, sh: 0 });
    part(P, P.poly([1568, 236, 1574, 224, 1578, 238]), C.steel, { b: 3, sh: 0 });
    signText(b, 'АКУЛА', 1571, 204, C.red[3]);

    dfill(b, 0, 306, b.w, 336, C.stone, (x, y) => (night ? 0.3 : 0.55) + (S.hash(x >> 1, y >> 1, 5) - 0.5) * 0.08);
    for (let x = 0; x < b.w; x += 40) P.line(x, 306, x - 6, 336, C.stone[1]);
    part(P, P.rect(-2, 334, b.w + 4, 6), C.stone, { b: 3, sh: 0 });
    dfill(b, 0, 340, b.w, b.h, C.tan, (x, y) => (night ? 0.1 : 0.3) + (S.hash(x >> 1, y >> 1, 6) - 0.5) * 0.1 + (night ? SQ_LAMPS.reduce((v, lx) => v + Math.max(0, 0.35 - Math.hypot((x - lx) / 120, (y - 360) / 40) * 0.35), 0) : 0));
    for (let y = 346; y < b.h; y += 8) { P.line(0, y, b.w - 1, y, C.tan[0]); for (let x = (y / 8 % 2) * 8; x < b.w; x += 16) P.line(x, y, x, y + 7, C.tan[0]); }
    for (const lx of SQ_LAMPS) lamp31(P, b, lx, night);

    part(P, P.rect(1460, 360, 44, 8), C.wood, { b: 3, sh: 0 });
    part(P, P.rect(1462, 324, 40, 38), C.wood, { b: 2, sh: 1 });
    for (const x of [1462, 1498]) part(P, P.rect(x, 366, 6, 38), C.wood, { b: 1, sh: 0 });
    part(P, P.rect(1456, 400, 52, 6), C.wood, { b: 2, sh: 0 });
  }

  function barrel(P, x, y, rx, ry) {
    part(P, P.ell(x, y, rx, ry), C.wood, { b: 2, sh: 1 });
    for (const k of [-0.55, 0.55]) P.line(x - rx + 1, y + ry * k, x + rx - 1, y + ry * k, C.steel[1]);
    for (let i = -2; i <= 2; i++) P.line(x + i * rx * 0.35, y - ry + 2, x + i * rx * 0.38, y + ry - 2, C.wood[1]);
  }

  function paintKitchen31(b) {
    const P = new Pen(b);
    const L = [{ x: 400, y: 60, rx: 420, ry: 300, k: 0.4 }];
    dfill(b, 0, 0, b.w, 150, C.mint, (x, y) => 0.15 + B.BG.light(L, x, y) * 0.7 + (S.hash(x >> 2, y >> 2, 3) - 0.5) * 0.06);
    part(P, P.rect(-2, 146, b.w + 4, 8), C.wood, { b: 2, sh: 0 });
    dfill(b, 0, 154, b.w, 304, C.cream, (x, y) => 0.3 + B.BG.light(L, x, y) * 0.55);
    for (let y = 160; y < 304; y += 12) P.line(0, y, b.w - 1, y, C.cream[1]);
    for (let y = 154; y < 304; y += 12) for (let x = (y / 12 % 2) * 6; x < b.w; x += 12) P.line(x, y, x, y + 11, C.cream[1]);
    part(P, P.rect(-2, 298, b.w + 4, 8), C.green, { b: 1, sh: 0 });
    dfill(b, 0, 306, b.w, b.h, C.plank, (x, y) => 0.22 + B.BG.light([{ x: 400, y: 330, rx: 460, ry: 200, k: 0.4 }], x, y) + (S.hash(x >> 1, y, 4) - 0.5) * 0.1);
    for (let y = 316; y < b.h; y += 14) { P.line(0, y, b.w - 1, y, C.plank[0]); for (let x = (y * 7) % 90; x < b.w; x += 90) P.line(x, y - 13, x, y, C.plank[0]); }

    for (const y of [16, 30]) { part(P, P.rect(-2, y, b.w + 4, 8), C.red, { b: 2, sh: 1 }); for (let x = 60; x < b.w; x += 140) part(P, P.rect(x, y - 2, 6, 12), C.red, { b: 1, sh: 0 }); }
    part(P, P.rect(740, 36, 24, 266), C.red, { b: 2, sh: 1 });
    for (const y of [80, 160, 240]) part(P, P.rect(736, y, 32, 6), C.red, { b: 1, sh: 0 });
    P.line(400, 0, 400, 50, C.raven[2]);
    dfill(b, 360, 40, 440, 100, [C.cream[3], C.cream[4], C.glow, C.glow, C.glow], (x, y) => { const d = Math.hypot((x - 400) / 40, (y - 58) / 34); return d < 1 && S.hash(x, y, 2) > d * 1.2 ? 0.5 - d * 0.5 : -1; });
    part(P, P.ell(400, 56, 6, 8), [C.glow, C.glow, C.glow, C.glow, C.glow], { b: 2, sh: 0, hi: 0 });
    part(P, P.rect(396, 46, 8, 5), C.steel, { b: 2, sh: 0 });

    part(P, P.rect(196, 86, 128, 58), C.wood, { b: 2, sh: 0 });
    part(P, P.rect(202, 92, 116, 46), C.char, { b: 1, sh: 0, hi: 0 });
    signText(b, 'СУП ДНЯ', 260, 96, C.snow[3]);
    signText(b, 'КАПУСТНЫЙ', 260, 112, C.snow[2]);
    signText(b, '5 ЦЕНТОВ', 260, 124, C.snow[2]);

    for (const y of [112, 156]) { part(P, P.rect(340, y + 30, 140, 5), C.wood, { b: 3, sh: 0 }); for (let i = 0; i < 9; i++) { const x = 344 + i * 15, h = 14 + (i % 3) * 4, c = [C.red, C.green, C.cream, C.gold][i % 4]; part(P, P.rect(x, y + 30 - h, 11, h), c, { b: 3, sh: 1 }); P.line(x + 1, y + 30 - h + 4, x + 9, y + 30 - h + 4, C.snow[3]); } }

    part(P, P.rect(60, 140, 46, 70), C.wood, { b: 3, sh: 1 });
    for (const x of [72, 94]) part(P, P.ell(x, 152, 7, 7), C.gold, { b: 3, sh: 0 });
    part(P, P.rect(76, 166, 14, 16), C.raven, { b: 2, sh: 0 });
    part(P, P.rect(56, 176, 8, 16), C.raven, { b: 2, sh: 0 });
    P.curve('M 60 192 Q 50 200 64 206', C.raven[2]);
    P.line(106, 170, 114, 164, C.raven[2]);
    part(P, P.ell(116, 162, 3, 3), C.wood, { b: 3, sh: 0 });

    part(P, P.rect(2, 186, 40, 116), C.wood, { b: 2, sh: 1 });
    for (const y of [190, 246]) { part(P, P.rect(6, y, 32, 50), C.wood, { b: 3, sh: 0 }); part(P, P.rect(30, y + 20, 6, 10), C.gold, { b: 3, sh: 0 }); }

    part(P, P.rect(40, 256, 120, 8), C.plank, { b: 3, sh: 0 });
    for (const x of [46, 150]) part(P, P.rect(x, 264, 6, 40), C.plank, { b: 2, sh: 0 });
    part(P, P.ell(84, 254, 12, 4), C.snow, { b: 4, sh: 0 });
    part(P, P.ell(84, 253, 8, 2), C.olive, { b: 3, sh: 0, hi: 0, ol: 0 });
    part(P, P.path('M 104 300 L 108 250 Q 110 236 124 234 L 140 236 Q 150 240 148 252 L 146 300 Z'), C.stone, { b: 2, sh: 1 });
    part(P, P.ell(116, 230, 11, 10), C.skin, { b: 2, sh: 0 });
    part(P, P.path('M 104 228 Q 106 214 118 214 Q 132 214 130 228 Z'), C.stone, { b: 1, sh: 0 });
    part(P, P.rect(100, 226, 32, 4), C.stone, { b: 1, sh: 0 });
    P.line(106, 244, 92, 252, C.stone[1]);

    part(P, P.rect(280, 170, 110, 50), C.raven, { b: 2, sh: 0 });
    for (const x of [300, 350]) { part(P, P.ell(x, 172, 16, 4), C.raven, { b: 3, sh: 0 }); }
    part(P, P.rect(330, 150, 44, 26), C.steel, { b: 2, sh: 1 });
    part(P, P.ell(352, 150, 22, 5), C.steel, { b: 3, sh: 0 });
    for (let i = 0; i < 3; i++) P.curve(`M ${340 + i * 10} 144 Q ${336 + i * 10} 132 ${344 + i * 10} 120`, C.snow[2]);


    part(P, P.rect(486, 168, 30, 134), C.wood, { b: 1, sh: 0 });
    part(P, P.rect(490, 172, 22, 126), C.char, { b: 1, sh: 0, hi: 0 });
    for (const x of [496, 506]) P.line(x, 0, x, 300, C.tan[3]);
    part(P, P.rect(490, 260, 22, 6), C.wood, { b: 3, sh: 0 });

    part(P, P.rect(520, 160, 100, 142), C.steel, { b: 2, sh: 0 });
    part(P, P.rect(524, 164, 92, 134), C.char, { b: 1, sh: 0, hi: 0 });
    for (const y of [196, 236, 276]) part(P, P.rect(522, y, 96, 5), C.steel, { b: 3, sh: 0 });
    for (const [x, y] of [[540, 180], [572, 186], [600, 182]]) part(P, P.rect(x, y, 16, 16), C.tan, { b: 3, sh: 1 });

    part(P, P.rect(636, 166, 78, 138), C.wood, { b: 2, sh: 0 });
    for (const x0 of [640, 676]) part(P, P.rect(x0, 170, 34, 130), C.mint, { b: 2, sh: 1 });
    part(P, P.ell(675, 200, 15, 15), C.steel, { b: 3, sh: 0 });
    part(P, P.ell(675, 200, 11, 11), C.night, { b: 2, sh: 0, hi: 1 });
    for (const x0 of [640, 676]) part(P, P.rect(x0 + 4, 268, 26, 6), C.steel, { b: 3, sh: 0 });

    part(P, P.rect(396, 318, 168, 10), C.plank, { b: 3, sh: 1 });
    part(P, P.rect(400, 328, 160, 26), C.cream, { b: 4, sh: 0 });
    for (let x = 404; x < 556; x += 10) part(P, P.path(`M ${x} 328 L ${x + 10} 328 L ${x + 5} 350 Z`), C.cream, { b: 3, sh: 0, hi: 0, ol: 0 });
    signText(b, 'ДЛЯ БЕДНЫХ', 480, 334, C.red[1]);
    for (const x of [406, 548]) part(P, P.rect(x, 354, 6, 18), C.plank, { b: 2, sh: 0 });
  }

  function paintCounter(b) {
    const P = new Pen(b);
    part(P, P.rect(0, 10, 308, 12), C.wood, { b: 3, sh: 1 });
    part(P, P.rect(4, 22, 300, 76), C.wood, { b: 1, sh: 1 });
    for (let x = 20; x < 304; x += 48) part(P, P.rect(x, 30, 36, 60), C.wood, { b: 2, sh: 0 });
    for (let i = 0; i < 4; i++) part(P, P.ell(34 + i * 4, 6 - i * 4 + 12, 12, 4), C.snow, { b: 4, sh: 0 });
    part(P, P.rect(264, 0, 30, 10), C.steel, { b: 3, sh: 0 });
  }

  function paintRoof31(b) {
    const P = new Pen(b);
    dfill(b, 0, 0, b.w, 200, C.sky, (x, y) => 0.85 - y / 200 * 0.35);
    for (const [x, y, w] of [[90, 30, 80], [470, 50, 100]]) for (let k = 0; k < 4; k++) part(P, P.ell(x + k * w * 0.25, y + (k % 2) * 4, w * 0.22, 9), C.snow, { b: 4, sh: 1, hi: 0, ol: 0 });
    bricks(P, b, 0, 120, 150, 230, C.brick, 0.42);
    part(P, P.rect(0, 114, 154, 8), C.stone, { b: 2, sh: 0 });
    for (const x of [16, 62, 108]) part(P, P.rect(x, 136, 24, 30), C.sky, { b: 2, sh: 0, hi: 1 });
    part(P, P.rect(430, 110, 210, 120), C.cream, { b: 3, sh: 1 });
    part(P, P.poly([424, 112, 535, 60, 646, 112]), C.cream, { b: 4, sh: 0 });
    clock(P, 535, 90, 13, C.cream, 0.42);
    for (const x of [452, 494, 576, 618]) part(P, P.rect(x - 5, 120, 10, 110), C.cream, { b: 4, sh: 1 });
    bricks(P, b, 150, 150, 300, 230, C.tan, 0.48);
    part(P, P.rect(160, 160, 130, 26), C.green, { b: 1, sh: 0 });
    part(P, P.rect(164, 164, 122, 18), C.cream, { b: 4, sh: 0 });
    signText(b, 'СТОЛОВАЯ', 225, 168, C.green[1]);
    for (const [x, y, rx, ry] of [[40, 220, 70, 46], [10, 180, 40, 34], [90, 186, 44, 36], [600, 226, 60, 40]]) part(P, P.ell(x, y, rx, ry), C.green, { b: 2, sh: 1 });
    dfill(b, 0, 230, b.w, b.h, C.green, (x, y) => 0.25 + (y - 230) / 250 * 0.25 + (S.hash(x >> 1, y >> 1, 4) - 0.5) * 0.25);
    part(P, P.poly([-10, 480, 150, 340, 230, 340, 120, 480]), C.tan, { b: 2, sh: 0, hi: 0 });
    part(P, P.poly([500, 480, 420, 340, 500, 340, 650, 480]), C.tan, { b: 2, sh: 0, hi: 0 });

    for (const x of [96, 200, 320, 440, 544]) part(P, P.rect(x - 4, 316, 8, 110), C.cream, { b: 4, sh: 1 });
    part(P, P.poly([70, 420, 570, 420, 600, 440, 40, 440]), C.cream, { b: 3, sh: 0 });
    for (let x = 60; x < 584; x += 10) { P.line(x, 440, x + 8, 470, C.cream[1]); P.line(x + 8, 440, x, 470, C.cream[1]); }
    part(P, P.poly([40, 440, 600, 440, 600, 472, 40, 472]), C.cream, { b: 2, sh: 0, hi: 0, ol: 0 });
    for (let x = 46; x < 596; x += 12) { P.line(x, 442, x + 10, 470, C.cream[1]); P.line(x + 10, 442, x, 470, C.cream[1]); }
    for (let x = 80; x < 560; x += 6) P.line(x, 384, x, 418, C.cream[3]);
    P.line(78, 384, 562, 384, C.cream[4]);

    const eave = [[30, 300], [150, 334], [490, 334], [610, 300]];
    part(P, P.poly([320, 118, ...eave.flat()]), C.green, { b: 1, sh: 1 });
    for (let k = 1; k < 9; k++) {
      const t = k / 9;
      const pts = eave.map(([x, y]) => [320 + (x - 320) * t, 118 + (y - 118) * t]);
      for (let i = 1; i < pts.length; i++) P.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], C.green[0]);
      for (let i = 1; i < pts.length; i++) for (let u = 0.1 + (k % 2) * 0.05; u < 1; u += 0.1) { const x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u; P.line(x, y, x, y + 4 + t * 6, C.green[0]); }
    }
    for (const [x, y] of eave) P.line(320, 118, x, y, C.green[2]);
    part(P, P.poly([24, 298, 150, 332, 490, 332, 616, 298, 616, 306, 490, 342, 150, 342, 24, 306]), C.cream, { b: 3, sh: 0 });
    for (let i = 0; i < 12; i++) { const x = 40 + i * 48, y = i < 3 ? 312 + i * 9 : i > 8 ? 342 - (i - 8) * 9 : 342; part(P, P.path(`M ${x} ${y} Q ${x + 24} ${y + 14} ${x + 48} ${y} Z`), [C.red, C.snow, C.navy][i % 3], { b: 3, sh: 0 }); }

    part(P, P.ell(320, 118, 7, 5), C.cream, { b: 3, sh: 0 });
    part(P, P.rect(318, 30, 4, 90), C.steel, { b: 3, sh: 0 });
    part(P, P.ell(320, 28, 4, 4), C.gold, { b: 4, sh: 0 });
    for (let i = 0; i < 7; i++) P.line(322, 34 + i * 4, 380 + (i % 2) * 2, 34 + i * 4 + 2, i % 2 ? C.snow[4] : C.red[2]);
    for (let i = 0; i < 7; i++) P.line(322, 35 + i * 4, 380 + (i % 2) * 2, 35 + i * 4 + 2, i % 2 ? C.snow[3] : C.red[1]);
    part(P, P.rect(322, 34, 24, 14), C.navy, { b: 2, sh: 0, hi: 0 });
    for (let i = 0; i < 8; i++) b.set(325 + (i % 4) * 5, 37 + (i >> 2) * 6, C.snow[4]);
  }

  function paintLab31(b) {
    const P = new Pen(b);
    const L = [{ x: 320, y: 70, rx: 360, ry: 300, k: 0.45 }, { x: 110, y: 60, rx: 160, ry: 140, k: 0.25 }];
    dfill(b, 0, 0, b.w, 306, C.plank, (x, y) => 0.18 + B.BG.light(L, x, y) * 0.6 + (S.hash(x >> 1, y >> 3, 3) - 0.5) * 0.08);
    for (let x = 0; x < b.w; x += 22) P.line(x, 0, x, 305, C.plank[0]);
    for (const y of [0, 34]) part(P, P.rect(-2, y, b.w + 4, 14), C.wood, { b: 1, sh: 1 });
    for (let x = 30; x < b.w; x += 120) part(P, P.rect(x, 0, 12, 48), C.wood, { b: 1, sh: 0 });
    part(P, P.rect(-2, 296, b.w + 4, 10), C.wood, { b: 2, sh: 0 });
    dfill(b, 0, 306, b.w, b.h, C.wood, (x, y) => 0.2 + B.BG.light([{ x: 320, y: 360, rx: 380, ry: 180, k: 0.45 }], x, y) + (S.hash(x >> 1, y, 4) - 0.5) * 0.1);
    for (let y = 318; y < b.h; y += 16) { P.line(0, y, b.w - 1, y, C.wood[0]); for (let x = (y * 5) % 110; x < b.w; x += 110) P.line(x, y - 15, x, y, C.wood[0]); }

    part(P, P.rect(232, 54, 54, 34), C.wood, { b: 2, sh: 0 });
    dfill(b, 236, 58, 282, 84, C.dusk, (x, y) => 0.55 + (y - 58) / 26 * 0.35);
    P.line(259, 58, 259, 84, C.wood[1]);
    for (const lx of [150, 470]) {
      P.line(lx, 48, lx, 76, C.raven[2]);
      part(P, P.poly([lx - 14, 88, lx + 14, 88, lx + 6, 76, lx - 6, 76]), C.green, { b: 2, sh: 0 });
      dfill(b, lx - 40, 88, lx + 40, 150, WARM, (x, y) => { const d = Math.hypot((x - lx) / 40, (y - 88) / 60); return d < 1 && S.hash(x, y, 3) > d * 1.3 ? 0.45 - d * 0.45 : -1; });
    }

    part(P, P.rect(56, 86, 168, 98), C.wood, { b: 2, sh: 0 });
    part(P, P.rect(60, 90, 160, 90), C.char, { b: 1, sh: 0, hi: 0 });
    for (const [t, y] of [['H(A) = A-1 H A', 96], ['ДЕЛЬТА T = 88', 110], ['ЗАДАЧА ИВАНОВА', 124]]) signText(b, t, 140, y, C.snow[3]);
    P.curve('M 86 128 Q 88 118 140 118 Q 194 118 194 128 Q 192 138 140 138 Q 88 138 86 128', C.snow[2]);
    P.line(70, 150, 120, 150, C.snow[2]); P.line(120, 150, 132, 160, C.snow[2]); P.line(132, 160, 70, 160, C.snow[2]); P.line(70, 150, 70, 160, C.snow[2]);
    P.curve('M 150 168 Q 180 140 210 166', C.snow[2]);

    part(P, P.rect(420, 120, 160, 70), C.navy, { b: 2, sh: 0 });
    for (let x = 424; x < 578; x += 10) P.line(x, 122, x, 188, C.navy[1]);
    P.line(436, 156, 520, 156, C.snow[3]); P.line(520, 146, 520, 166, C.snow[3]); P.line(520, 146, 560, 156, C.snow[3]); P.line(520, 166, 560, 156, C.snow[3]);
    for (let x = 440; x < 516; x += 8) P.line(x, 150, x + 4, 162, C.snow[3]);
    signText(b, 'РАКЕТНЫЙ БУР', 500, 126, C.snow[4]);
    for (const [x, y] of [[424, 124], [574, 124], [424, 184], [574, 184]]) b.set(x, y, C.red[2]);

    part(P, P.rect(18, 200, 30, 36), C.cream, { b: 4, sh: 0 });
    signText(b, 'ИЮНЬ', 33, 202, C.red[1]);
    signText(b, '1931', 33, 214, C.hair[0]);
    part(P, P.ell(240, 128, 14, 14), C.raven, { b: 2, sh: 0 });
    for (const [r, c] of [[11, C.red], [7, C.cream], [3, C.red]]) part(P, P.ell(240, 128, r, r), c, { b: 3, sh: 0, hi: 0 });
    P.line(246, 120, 254, 112, C.steel[3]);

    part(P, P.rect(396, 210, 130, 6), C.wood, { b: 3, sh: 0 });
    for (let i = 0; i < 10; i++) part(P, P.rect(400 + i * 12, 186 + (i % 3) * 3, 10, 24 - (i % 3) * 3), [C.red, C.navy, C.green, C.tan, C.maroon][i % 5], { b: 2, sh: 1 });
    part(P, P.rect(470, 236, 40, 30), C.wood, { b: 2, sh: 0 });
    part(P, P.rect(474, 228, 32, 10), C.cream, { b: 4, sh: 0 });
    signText(b, 'СОВР.', 490, 229, C.red[1]);

    part(P, P.rect(36, 236, 188, 10), C.green, { b: 2, sh: 1 });
    P.line(130, 236, 130, 245, C.snow[3]); P.line(36, 240, 224, 240, C.snow[2]);
    part(P, P.rect(126, 222, 8, 14), C.snow, { b: 3, sh: 0 });
    for (const x of [44, 210]) part(P, P.rect(x, 246, 8, 58), C.wood, { b: 1, sh: 0 });

    for (const [x0, x1] of [[268, 290], [312, 298], [352, 306]]) P.line(x0, 298, x1, 240, C.steel[2]);
    part(P, P.ell(300, 222, 30, 26), C.gold, { b: 2, sh: 1 });
    part(P, P.ell(300, 200, 22, 8), C.gold, { b: 3, sh: 0 });
    part(P, P.ell(300, 226, 10, 10), C.cream, { b: 4, sh: 0, hi: 0 });
    P.line(300, 226, 306, 220, C.red[2]);
    part(P, P.rect(298, 172, 4, 26), C.steel, { b: 3, sh: 0 });
    for (const x of [270, 330]) part(P, P.rect(x - 6, 258, 12, 40), C.steel, { b: 2, sh: 0 });
    dfill(b, 280, 248, 320, 262, [C.red[2], C.red[3], C.cream[3], C.cream[4], C.glow], (x, y) => S.hash(x, y, 9) > 0.4 ? 0.5 + S.hash(x, y, 8) * 0.5 : -1);
    part(P, P.poly([228, 268, 262, 254, 262, 290, 228, 280]), C.wood, { b: 2, sh: 0 });
    for (let x = 234; x < 260; x += 5) P.line(x, 262, x, 284, C.wood[1]);
    part(P, P.rect(214, 270, 16, 6), C.wood, { b: 1, sh: 0 });
    part(P, P.rect(330, 146, 4, 60), C.wood, { b: 1, sh: 0 });
    part(P, P.rect(366, 146, 4, 60), C.wood, { b: 1, sh: 0 });
    part(P, P.ell(350, 152, 22, 18), C.salmon, { b: 3, sh: 1 });
    P.curve('M 332 160 Q 310 180 304 196', C.raven[2]);
    part(P, P.rect(340, 250, 44, 34), C.mint, { b: 2, sh: 0, hi: 1 });
    dfill(b, 343, 256, 381, 282, C.green, (x, y) => 0.55 + (S.hash(x, y, 5) - 0.5) * 0.6);
    for (let i = 0; i < 6; i++) b.set(346 + Math.floor(S.hash(i, 1, 6) * 32), 258 + Math.floor(S.hash(i, 2, 6) * 20), C.glow);
    for (const [x, h] of [[388, 30], [402, 24], [414, 34]]) { part(P, P.rect(x - 5, 298 - h, 10, h), C.mint, { b: 3, sh: 0, hi: 1 }); part(P, P.rect(x - 2, 292 - h, 4, 8), C.mint, { b: 2, sh: 0 }); }
    part(P, P.ell(400, 220, 22, 22), C.snow, { b: 4, sh: 0 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; part(P, P.poly([400, 220, 400 + Math.cos(a) * 20, 220 + Math.sin(a) * 20, 400 + Math.cos(a + 0.39) * 20, 220 + Math.sin(a + 0.39) * 20]), k % 2 ? C.red : C.snow, { b: 3, sh: 0, hi: 0, ol: 0 }); }
    part(P, P.ell(400, 220, 4, 4), C.steel, { b: 2, sh: 0 });
    P.line(400, 242, 394, 298, C.steel[1]); P.line(400, 242, 406, 298, C.steel[1]);
    P.curve('M 330 220 Q 340 240 350 250', C.steel[3]);
    P.curve('M 378 254 Q 388 240 396 236', C.steel[3]);

    part(P, P.rect(556, 56, 68, 248), C.wood, { b: 1, sh: 0 });
    for (let i = 0; i < 12; i++) { const y = 286 - i * 19; part(P, P.rect(562 + i * 1, y, 56 - i * 2, 6), C.plank, { b: 3, sh: 0 }); }
    P.line(560, 300, 600, 60, C.wood[3]);
    dfill(b, 566, 58, 614, 80, WARM, (x, y) => S.hash(x, y, 4) > (y - 58) / 22 ? 0.4 : -1);
  }

  function paintDrill(b) {
    const P = new Pen(b);
    part(P, P.rect(4, 8, 66, 14), C.steel, { b: 3, sh: 1 });
    part(P, P.poly([70, 6, 96, 15, 70, 24]), C.steel, { b: 2, sh: 0 });
    for (let x = 72; x < 94; x += 4) P.line(x, 8 + (x - 70) * 0.3, x + 3, 22 - (x - 70) * 0.3, C.steel[0]);
    for (const x of [14, 40]) part(P, P.rect(x, 6, 4, 18), C.red, { b: 2, sh: 0 });
    part(P, P.poly([4, 8, 0, 2, 0, 28, 4, 22]), C.red, { b: 2, sh: 0 });
  }

  const WY = 60;

  function blitClip(dst, spr, dx, dy, rx, ry, rw, rh) {
    const src = spr.buf;
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const v = src.px[y * src.w + x];
      if (!v) continue;
      const X = dx + x, Y = dy + y;
      if (X >= rx && X < rx + rw && Y >= ry && Y < ry + rh) dst.set(X, Y, v);
    }
  }

  function bars(P, x, y, w, h) {
    for (let k = x + 6; k < x + w; k += 10) part(P, P.rect(k - 1, y, 3, h), C.steel, { b: 2, sh: 0 });
    part(P, P.rect(x, y + h / 2 - 1, w, 3), C.steel, { b: 2, sh: 0 });
  }

  function wheel(P, x, y, r) {
    part(P, P.ell(x, y, r, r), C.raven, { b: 1, sh: 0 });
    part(P, P.ell(x, y, r * 0.55, r * 0.55), C.steel, { b: 2, sh: 0 });
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; P.line(x, y, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, C.steel[0]); }
    part(P, P.ell(x, y, r * 0.15, r * 0.15), C.gold, { b: 3, sh: 0 });
  }

  function star(P, x, y, r) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.42 : r; pts.push(x + Math.cos(a) * q, y + Math.sin(a) * q); }
    part(P, P.poly(pts), C.gold, { b: 3, sh: 1 });
  }

  function paintNight(b) {
    const P = new Pen(b);
    dfill(b, 0, 0, b.w, b.h, C.night, (x, y) => 0.08 + y / b.h * 0.3);
    for (let i = 0; i < 60; i++) b.set(Math.floor(S.hash(i, 3, 3) * b.w), Math.floor(S.hash(i, 7, 3) * 200), C.snow[i % 3 ? 2 : 4]);
    part(P, P.ell(560, 50, 14, 14), [C.cream[3], C.cream[4], C.glow, C.glow, C.glow], { b: 2, sh: 0, hi: 0 });
    for (let x = -40; x < b.w + 60; x += 70) part(P, P.ell(x, 300, 90, 40 + S.hash(x, 1, 6) * 30), C.night, { b: 2, sh: 0, hi: 0, ol: 0 });
  }

  function road(f, g, side) {
    const t = g.time;
    if (side === 'b') {
      for (let y = 300; y < f.h; y++) {
        const z = (y - 300) / 180, half = 30 + z * 400;
        for (let x = 0; x < f.w; x++) f.px[y * f.w + x] = Math.abs(x - 320) < half ? (S.BAYER[((y & 3) << 2) | (x & 3)] < 0.4 + z * 0.3 ? C.stone[1] : C.stone[0]) : C.green[z > 0.5 ? 1 : 0];
      }
      for (let k = 0; k < 6; k++) {
        const z = ((k + t * 2.4) % 6) / 6, y = 300 + 180 * z * z, w = 1 + z * 5, h = 2 + z * 16;
        S.rectFill(f, Math.round(320 - w / 2), Math.round(y), Math.round(w), Math.round(h), C.gold[3]);
        for (const s of [-1, 1]) {
          const x = 320 + s * (60 + 520 * z * z), ph = 40 + 260 * z * z;
          S.rectFill(f, Math.round(x - 1 - z * 3), Math.round(y - ph), Math.round(2 + z * 6), Math.round(ph), C.wood[1]);
          S.rectFill(f, Math.round(x - 8 - z * 20), Math.round(y - ph), Math.round(16 + z * 40), Math.round(2 + z * 4), C.wood[1]);
        }
      }
      return;
    }
    const dir = side === 'l' ? -1 : 1, sh = Math.floor(t * 420) * dir;
    for (let y = 318; y < 336; y++) for (let x = 0; x < f.w; x++) { const u = ((x + sh) % 640 + 640) % 640; f.px[y * f.w + x] = S.hash(u >> 3, y >> 2, 7) > 0.45 ? C.green[1] : C.green[0]; }
    for (let y = 336; y < f.h; y++) for (let x = 0; x < f.w; x++) { const u = ((x + sh) % 64 + 64) % 64; f.px[y * f.w + x] = S.hash(u, y, 5) > 0.7 ? C.stone[1] : C.stone[0]; }
    for (let x = -96; x < f.w + 96; x += 96) { const xx = ((x - sh) % 96 + 96) % 96 + x - x % 96 - 96; S.rectFill(f, xx, 452, 48, 4, C.gold[3]); }
    for (let x = 0; x < f.w + 300; x += 300) {
      const xx = Math.round(((x - sh * 0.6) % 900 + 900) % 900 - 150);
      S.rectFill(f, xx, 150, 6, 170, C.wood[1]);
      S.rectFill(f, xx - 18, 158, 42, 4, C.wood[1]);
    }
  }

  function paintWagonBack(b, st) {
    const P = new Pen(b);
    const y = v => v - WY;
    wheel(P, 186, y(430), 30); wheel(P, 454, y(430), 30);
    if (st.open) {
      for (const [x0, x1] of [[100, 170], [470, 540]]) { part(P, P.poly([x0, y(96), x1, y(90), x1, y(400), x0, y(392)]), C.navy, { b: 2, sh: 1 }); }
    }
    part(P, P.path(`M 150 ${y(420)} L 150 ${y(96)} Q 150 ${y(70)} 180 ${y(70)} L 460 ${y(70)} Q 490 ${y(70)} 490 ${y(96)} L 490 ${y(420)} Z`), C.navy, { b: 2, sh: 1 });
    if (st.open) {
      part(P, P.rect(170, y(90), 300, 312), C.raven, { b: 1, sh: 0, hi: 0 });
      for (const x of [178, 404]) part(P, P.rect(x, y(300), 58, 16), C.wood, { b: 2, sh: 0 });
      part(P, P.rect(280, y(110), 80, 40), C.night, { b: 2, sh: 0, hi: 0 });
      if (st.kidGun) { part(P, P.rect(290, y(128), 40, 8), C.plum, { b: 2, sh: 0 }); part(P, P.rect(326, y(126), 18, 6), C.steel, { b: 1, sh: 0 }); part(P, P.ell(330, y(132), 4, 4), C.skin, { b: 3, sh: 0 }); }
      part(P, P.rect(316, y(268), 8, 8), C.steel, { b: 2, sh: 0 });
      const doc = S.sprite('bt_doc31', { dir: 's', act: st.free ? 'hold' : 'sit', walk: -1 }, 1);
      S.blit(b, doc.buf, 410 - Math.round(doc.ox), y(st.free ? 396 : 380) - Math.round(doc.oy));
      if (!st.free) { P.curve(`M 404 ${y(312)} Q 360 ${y(290)} 320 ${y(272)}`, C.steel[3]); P.curve(`M 404 ${y(314)} Q 362 ${y(296)} 320 ${y(274)}`, C.steel[1]); }
      if (st.gunFloor) { part(P, P.rect(220, y(372), 30, 8), C.steel, { b: 2, sh: 0 }); part(P, P.rect(220, y(372), 8, 14), C.wood, { b: 2, sh: 0 }); }
    } else {
      for (const x0 of [170, 322]) part(P, P.rect(x0, y(90), 148, 312), C.navy, { b: 3, sh: 1 });
      P.line(320, y(90), 320, y(400), C.navy[0]);
      part(P, P.rect(250, y(100), 140, 60), C.raven, { b: 1, sh: 0, hi: 0 });
      const doc = S.sprite('bt_doc31', { dir: 's', walk: -1 }, 1);
      blitClip(b, doc, 320 - Math.round(doc.ox), y(100) + 8, 250, y(100), 140, 60);
      bars(P, 250, y(100), 140, 60);
      part(P, P.rect(296, y(204), 48, 8), C.steel, { b: 2, sh: 0 });
      if (st.lock) { part(P, P.path(`M 310 ${y(204)} Q 320 ${y(186)} 330 ${y(204)}`), C.gold, { b: 2 }); part(P, P.rect(306, y(204), 28, 24), C.gold, { b: 3, sh: 1 }); part(P, P.ell(320, y(214), 3, 3), C.raven, { b: 1, sh: 0 }); }
      star(P, 245, y(290), 26); star(P, 395, y(290), 26);
    }
    for (const x of [158, 470]) part(P, P.rect(x, y(360), 12, 20), C.red, { b: 4, sh: 0 });
    part(P, P.rect(130, y(420), 380, 16), C.steel, { b: 2, sh: 1 });
    part(P, P.rect(290, y(392), 60, 20), C.cream, { b: 4, sh: 0 });
    signText(b, '1931', 320, y(396), C.navy[1]);
  }

  function paintWagonSide(b, left, st) {
    const P = new Pen(b);
    const y = v => v - WY;
    const X = x => left ? 640 - x : x;
    const R = (x, yy, w, h) => P.rect(left ? 640 - x - w : x, yy, w, h);
    part(P, P.path(`M ${X(20)} ${y(390)} L ${X(20)} ${y(100)} Q ${X(20)} ${y(80)} ${X(44)} ${y(80)} L ${X(392)} ${y(80)} L ${X(392)} ${y(390)} Z`), C.navy, { b: 2, sh: 1 });
    for (let x = 40; x < 380; x += 40) P.line(X(x), y(84), X(x), y(386), C.navy[1]);
    for (const x of [60, 270]) { part(P, R(x, y(112), 64, 40), C.raven, { b: 1, sh: 0, hi: 0 }); bars(P, left ? 640 - x - 64 : x, y(112), 64, 40); }
    star(P, X(200), y(200), 34);
    signText(b, 'ПОЛИЦИЯ', X(200), y(244), C.gold[4]);
    signText(b, 'ХИЛЛ-ВЭЛЛИ', X(200), y(258), C.gold[3]);
    part(P, P.path(`M ${X(392)} ${y(390)} L ${X(392)} ${y(96)} L ${X(560)} ${y(96)} Q ${X(590)} ${y(100)} ${X(596)} ${y(190)} L ${X(640)} ${y(220)} L ${X(640)} ${y(390)} Z`), C.navy, { b: 3, sh: 1 });
    part(P, R(424, y(110), 140, 72), C.raven, { b: 1, sh: 0, hi: 0 });
    part(P, R(420, y(186), 4, 160), C.navy, { b: 1, sh: 0 });
    part(P, R(500, y(250), 16, 6), C.steel, { b: 3, sh: 0 });
    if (left) {
      const kid = S.sprite('bt_kid', { dir: 'w', walk: -1 }, 1);
      blitClip(b, kid, 150 - Math.round(kid.ox), y(110) + 4, 76, y(110), 140, 72);
      part(P, P.rect(76, y(170), 140, 12), C.wood, { b: 2, sh: 0 });
      if (st.keys) { part(P, P.ell(186, y(168), 5, 5), C.gold, { b: 4, sh: 0 }); P.line(186, y(172), 190, y(178), C.gold[3]); }
      part(P, P.ell(X(300), y(300), 46, 46), C.raven, { b: 1, sh: 0 });
      part(P, P.ell(X(300), y(300), 26, 26), st.hubcap ? C.steel : C.raven, { b: st.hubcap ? 4 : 2, sh: 1 });
      if (!st.hubcap) for (let k = 0; k < 6; k++) b.set(Math.round(X(300) + Math.cos(k) * 16), Math.round(y(300) + Math.sin(k) * 16), C.steel[2]);
    } else {
      if (st.antenna) { part(P, R(196, y(30), 4, 52), C.steel, { b: 3, sh: 0 }); part(P, P.ell(X(198), y(30), 4, 4), C.steel, { b: 3, sh: 0 }); }
      part(P, R(196, y(76), 12, 6), C.steel, { b: 2, sh: 0 });
      if (st.box) { part(P, R(360, y(262), 80, 48), C.wood, { b: 2, sh: 1 }); part(P, R(390, y(256), 20, 8), C.steel, { b: 2, sh: 0 }); P.line(X(360), y(276), X(440), y(276), C.wood[0]); }
    }
    part(P, P.rect(0, y(396), 640, 12), C.steel, { b: 2, sh: 1 });
    part(P, R(596, y(260), 44, 50), C.navy, { b: 2, sh: 0 });
    for (let k = 0; k < 4; k++) P.line(X(604 + k * 8), y(266), X(604 + k * 8), y(304), C.steel[3]);
    part(P, P.ell(X(628), y(240), 10, 10), [C.cream[3], C.cream[4], C.glow, C.glow, C.glow], { b: 2, sh: 0, hi: 0 });
    wheel(P, X(110), y(420), 40); wheel(P, X(540), y(420), 40);
  }

  B.BG31 = { paintArthur31, paintSquare31, paintKitchen31, paintCounter, paintRoof31, paintLab31, paintDrill, paintNight, road, paintWagonBack, paintWagonSide, WY, barrel, awning, gasLamp, WARM };
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
