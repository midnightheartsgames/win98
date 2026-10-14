(function (S, B) {
  'use strict';
  const { Buf, Pen } = S;
  const C = B.C;
  const CACHE = new Map();
  const PW = 100, PH = 112;

  const skin = L => L.skin || C.skin;

  function eyes(P, o, L) {
    const ey = L.eyeY || 52;
    for (const sx of [-1, 1]) {
      const ex = 50 + sx * 11;
      if (o.blink) {
        P.curve(`M ${ex - 5} ${ey} Q ${ex} ${ey + 2} ${ex + 5} ${ey}`, skin(L)[0]);
        continue;
      }
      const k = L.eyeK || 1;
      P.part(P.ell(ex, ey, 5.2 * k, 3.4 * k), C.eye, { b: 0, sh: 0, hi: 0, ol: skin(L)[0] });
      P.part(P.ell(ex + sx * 0.4, ey + 0.3, 2.6 * k, 2.9 * k), L.iris, { b: 2, sh: 0, hi: 0, ol: 0 });
      P.part(P.ell(ex + sx * 0.4, ey + 0.4, 1.2, 1.4), C.pupil, { b: 0, sh: 0, hi: 0, ol: 0 });
      P.px(ex + sx * 0.4 - 1, ey - 1, C.snow[4]);
      P.curve(`M ${ex - 6} ${ey - 1} Q ${ex} ${ey - 5.5} ${ex + 6} ${ey - 1}`, skin(L)[0]);
    }
  }

  function brows(P, o, L) {
    const by = (L.eyeY || 52) - 8;
    const e = o.face || L.face || 'neutral';
    for (const sx of [-1, 1]) {
      const inner = e === 'worried' ? -2.5 : e === 'angry' ? 2.5 : 0;
      const x0 = 50 + sx * 4, x1 = 50 + sx * 17;
      const t = L.browT || L.browH || 2;
      if (L.arch) { const e = sx < 0 ? -1 : 1; P.curve(`M ${x0} ${by + 2} Q ${x0 + (x1 - x0) * 0.55} ${by - 5 - (inner > 0 ? 1 : 0)} ${x1 + e} ${by}`, L.brow); P.curve(`M ${x0} ${by + 3} Q ${x0 + (x1 - x0) * 0.55} ${by - 4} ${x1 + e} ${by + 1}`, L.brow); }
      else if (L.browH) {
        const pts = [x0, by + inner - 1, x1 + sx * 2, by - 3];
        for (let k = 0; k <= 4; k++) { const xx = x1 + sx * 2 + (x0 - x1 - sx * 2) * k / 4; const yy = by - 3 + (by + inner - 1 - (by - 3)) * k / 4 + t + (k % 2 ? 1.5 : 0); pts.push(xx, yy); }
        P.part(P.poly(pts), L.brow, { b: 1, sh: 0, hi: 0, ol: C.snow[1] });
      } else P.part(P.poly([x0, by + inner, x1, by - 1.5, x1, by - 1.5 + t, x0, by + t + inner]), L.brow, { b: 1, sh: 0, hi: 0, ol: 0 });
    }
  }

  function nose(P, L) {
    const ny = L.eyeY || 52;
    if (L.sharp) { P.part(P.path(`M 50 ${ny + 1} L 46 ${ny + 15} Q 50 ${ny + 17} 54 ${ny + 14} Z`), skin(L), { b: 3, sh: 0, hi: 1, ol: skin(L)[1] }); return; }
    P.curve(`M 51 ${ny + 1} Q 49 ${ny + 8} 52 ${ny + 12}`, skin(L)[1]);
    P.curve(`M 46 ${ny + 12} Q 49 ${ny + 15} 54 ${ny + 12}`, skin(L)[1]);
  }

  function mouth(P, o, L) {
    const my = (L.eyeY || 52) + 21;
    const e = o.face || L.face || 'neutral';
    if (o.talk) {
      P.part(P.ell(50, my, 6, 4), C.maroon, { b: 1, sh: 0, hi: 0, ol: skin(L)[0] });
      P.part(P.rect(46, my - 3, 8, 2), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
      return;
    }
    if (e === 'smile') P.curve(`M 43 ${my - 1} Q 50 ${my + 5} 57 ${my - 1}`, skin(L)[0]);
    else if (e === 'worried' || e === 'angry') P.curve(`M 44 ${my + 2} Q 50 ${my - 2} 56 ${my + 2}`, skin(L)[0]);
    else P.curve(`M 44 ${my} Q 50 ${my + 1.5} 56 ${my}`, skin(L)[0]);
    P.line(47, my + 4, 53, my + 4, skin(L)[2]);
    if (L.lips) P.curve(`M 45 ${my} Q 50 ${my - 1.5} 55 ${my}`, L.lips);
  }

  function head(P, o, L) {
    P.part(P.rect(41, 80, 18, 24), skin(L), { b: 2, sh: 0 });
    P.part(P.rect(41, 80, 18, 5), skin(L), { b: 1, sh: 0, hi: 0, ol: 0 });
    for (const sx of [-1, 1]) {
      const ek = L.earK || 1;
      P.part(P.ell(50 + sx * (25 + (ek - 1) * 6), 55, 4.5 * ek, 7 * ek), skin(L), { b: 2, sh: 0 });
      P.curve(`M ${50 + sx * (26 + (ek - 1) * 6)} ${55 - 4 * ek} Q ${50 + sx * (28 + (ek - 1) * 8)} ${55} ${50 + sx * (25 + (ek - 1) * 6)} ${55 + 4 * ek}`, skin(L)[1]);
    }
    const jaw = L.jaw || 0;
    P.part(P.path(`M 26 44 Q 26 18 50 17 Q 74 18 74 44 L ${73 + jaw} 60 Q ${70 + jaw} 77 58 84 Q 50 88 42 84 Q ${30 - jaw} 77 ${27 - jaw} 60 Z`), skin(L), { b: 3, sh: 2 });
    if (L.lines) for (const sx of [-1, 1]) P.curve(`M ${50 + sx * 17} 66 Q ${50 + sx * 14} 74 ${50 + sx * 8} 78`, skin(L)[2]);
    eyes(P, o, L);
    brows(P, o, L);
    nose(P, L);
    mouth(P, o, L);
  }

  function docMane(P) {
    const pts = [];
    const n = 22;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = Math.PI * (0.82 + t * 1.36);
      const side = Math.abs(Math.cos(a));
      const r = 1.18 + side * 0.32 + (i % 2 ? 0.2 + S.hash(i, 3, 7) * 0.22 : S.hash(i, 5, 7) * 0.08);
      pts.push(50 + Math.cos(a) * 25 * r * 1.08, 46 + Math.sin(a) * 28 * r * 0.92);
    }
    pts.push(82, 70, 18, 70);
    P.part(P.poly(pts), C.snow, { b: 3 });
    for (let i = 0; i < 9; i++) {
      const x = 22 + i * 7;
      P.curve(`M ${50 + (x - 50) * 0.3} ${20} Q ${x} ${12 + Math.abs(x - 50) * 0.2} ${x + (x - 50) * 0.5} ${30 + Math.abs(x - 50) * 0.5}`, C.snow[1]);
    }
  }

  function docTufts(P) {
    for (const s of [-1, 1]) {
      const pts = [50 + s * 21, 34];
      for (let i = 0; i < 5; i++) pts.push(50 + s * (33 + (i % 2 ? 0 : 7)), 38 + i * 6);
      pts.push(50 + s * 25, 68, 50 + s * 23, 52);
      P.part(P.poly(pts), C.snow, { b: 3, sh: 0 });
      P.curve(`M ${50 + s * 24} 40 Q ${50 + s * 32} 50 ${50 + s * 30} 62`, C.snow[1]);
    }
    for (const y of [24, 29]) P.curve(`M 38 ${y} Q 50 ${y - 3} 62 ${y}`, C.skin[2]);
  }

  const DOC = { iris: C.hair, brow: C.snow[4], browH: 4, eyeK: 1.25, lines: true, jaw: -2, hairBack: docMane, hair: docTufts };

  const LOOK = {
    edna: { bg: C.peri, iris: C.green, brow: C.black, arch: true, jaw: -3, lips: C.red[2], face: 'neutral',
      hairBack(P) {
        P.part(P.path('M 21 42 Q 17 64 20 80 Q 24 90 34 86 L 66 86 Q 76 90 80 80 Q 83 64 79 42 Z'), C.raven, { b: 2 });
        for (const s of [-1, 1]) P.curve(`M ${50 + s * 28} 80 Q ${50 + s * 24} 88 ${50 + s * 18} 84`, C.raven[3]);
      },
      clothes(P) {
        P.part(P.path('M 4 112 L 6 100 Q 14 90 32 88 L 68 88 Q 86 90 94 100 L 96 112 Z'), C.peri, { b: 3 });
        P.part(P.poly([38, 92, 62, 92, 56, 112, 44, 112]), C.grey, { b: 3, sh: 0 });
        for (let y = 98; y < 112; y += 4) P.line(43, y, 57, y, C.grey[1]);
        for (const s of [-1, 1]) P.part(P.poly([50 + s * 12, 92, 50 + s * 22, 90, 50 + s * 14, 112, 50 + s * 6, 112]), C.peri, { b: 4, sh: 0 });
      },
      front(P) {
        P.part(P.path('M 38 80 Q 50 84 62 80 L 63 93 Q 50 97 37 93 Z'), C.navy, { b: 2, sh: 0 });
        P.line(39, 86, 61, 86, C.navy[1]);
        P.part(P.ell(50, 94, 3.2, 3.2), C.gold, { b: 4 });
      },
      hair(P) {
        P.part(P.path('M 24 60 L 23 40 Q 24 22 50 20 Q 76 22 77 40 L 76 60 L 73 60 Q 73 44 66 37 L 34 37 Q 27 44 27 60 Z'), C.raven, { b: 2 });
        P.part(P.ell(46, 24, 22, 11), C.raven, { b: 2 });
        P.part(P.ell(70, 26, 9, 8), C.raven, { b: 2 });
        P.curve('M 28 24 Q 38 14 56 16', C.raven[4]);
        P.curve('M 34 28 Q 46 22 60 26', C.raven[3]);
        P.curve('M 64 22 Q 72 20 76 28', C.raven[3]);
        for (const d of ['M 27 44 Q 30 38 36 36', 'M 73 44 Q 70 38 64 36']) P.curve(d, C.raven[3]);
        for (const s of [-1, 1]) P.part(P.ell(50 + s * 25, 67, 2.6, 2.6), C.snow, { b: 4, sh: 0 });
      } },
    emmett: { bg: C.slate, iris: C.hair, brow: C.hair[1], eyeK: 1.3, jaw: -5, earK: 1.15, face: 'neutral',
      clothes(P) {
        P.part(P.path('M 4 112 L 6 100 Q 14 90 32 88 L 68 88 Q 86 90 94 100 L 96 112 Z'), C.snow, { b: 3 });
        P.part(P.path('M 10 112 L 12 102 Q 18 94 32 92 L 40 92 L 50 110 L 60 92 L 68 92 Q 82 94 88 102 L 90 112 Z'), C.teal, { b: 2 });
        for (let r = 0, y = 100; y < 116; r++, y += 9) for (let x = 16 + (r % 2) * 6; x < 86; x += 12) if (Math.abs(x - 50) > 8 + (110 - y) * 0.5) P.part(P.poly([x, y - 4, x + 5, y, x, y + 4, x - 5, y]), C.teal, { b: r % 2 ? 4 : 1, sh: 0, hi: 0, ol: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50, 92, 50 + s * 11, 86, 50 + s * 13, 96]), C.snow, { b: 4, sh: 0 });
      },
      front(P) {
        for (const s of [-1, 1]) P.part(P.poly([50, 94, 50 + s * 13, 88, 50 + s * 13, 101]), C.green, { b: 3, sh: 0 });
        for (const s of [-1, 1]) P.line(50 + s * 4, 93, 50 + s * 10, 91, C.green[1]);
        P.part(P.rect(47, 91, 6, 6), C.green, { b: 2, sh: 0 });
      },
      hair(P) {
        P.part(P.path('M 25 54 Q 20 22 50 14 Q 80 18 76 54 L 73 54 Q 73 42 68 36 Q 58 31 48 32 Q 36 33 30 38 Q 27 44 28 54 Z'), C.hair, { b: 3 });
        P.part(P.path('M 30 36 Q 30 14 54 9 Q 78 10 77 32 Q 70 24 56 26 Q 40 28 30 36 Z'), C.hair, { b: 3, sh: 0 });
        P.curve('M 35 28 Q 36 22 40 17', C.hair[0]);
        for (const d of ['M 42 22 Q 56 14 72 22', 'M 46 28 Q 60 22 74 30', 'M 27 46 Q 27 38 32 32', 'M 74 46 Q 74 38 70 34']) P.curve(d, C.hair[1]);
        P.curve('M 48 14 Q 60 11 70 16', C.hair[4]);
      } },
    kid: { bg: C.maroon, iris: C.raven, brow: C.raven[0], browT: 3, face: 'angry', jaw: 3, lines: true,
      clothes(P) {
        P.part(P.path('M 0 112 L 2 98 Q 10 88 30 86 L 70 86 Q 90 88 98 98 L 100 112 Z'), C.plum, { b: 3 });
        for (let x = 4; x < 98; x += 6) P.line(x, 90, x + (x - 50) * 0.04, 111, C.plum[4]);
      },
      front(P) {
        P.part(P.path('M 39 69 Q 44 65 50 67 Q 56 65 61 69 Q 56 70 50 69 Q 44 70 39 69 Z'), C.raven, { b: 2, sh: 0 });
        P.part(P.poly([38, 92, 62, 92, 50, 112]), C.snow, { b: 4, sh: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50, 94, 50 + s * 11, 86, 50 + s * 14, 96]), C.snow, { b: 4, sh: 0 });
        P.part(P.poly([46, 98, 54, 98, 55, 108, 50, 112, 45, 108]), C.red, { b: 3, sh: 0 });
        P.part(P.poly([46, 93, 54, 93, 53, 99, 47, 99]), C.red, { b: 2, sh: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50 + s * 14, 92, 50 + s * 24, 90, 50 + s * 20, 100, 50 + s * 24, 102, 50 + s * 6, 112, 50 + s * 3, 112]), C.plum, { b: 2, sh: 0 });
      },
      hair(P) {
        for (const s of [-1, 1]) P.part(P.path(`M ${50 + s * 25} 56 L ${50 + s * 26} 36 L ${50 + s * 18} 36 L ${50 + s * 22} 46 Z`), C.raven, { b: 2 });
        P.part(P.path('M 22 38 L 25 18 Q 36 8 46 12 L 50 16 L 54 12 Q 64 8 75 18 L 78 38 Z'), C.plum, { b: 2 });
        P.curve('M 40 12 Q 50 22 60 12', C.plum[0]);
        P.part(P.rect(22, 29, 56, 8), C.raven, { b: 2, sh: 0 });
        P.part(P.path('M 4 40 Q 20 32 50 33 Q 80 32 96 38 Q 94 44 80 42 Q 50 38 20 43 Q 6 46 4 40 Z'), C.plum, { b: 3 });
        P.curve('M 28 16 Q 36 10 44 12', C.plum[4]);
      } },
    artie: { bg: C.olive, iris: C.green, brow: C.hair[0], browT: 3, face: 'worried', jaw: -2, lines: true,
      clothes(P) {
        P.part(P.path('M 4 112 L 6 100 Q 14 90 32 88 L 68 88 Q 86 90 94 100 L 96 112 Z'), C.cream, { b: 3 });
        P.part(P.path('M 10 112 L 12 102 Q 18 94 32 92 L 40 92 L 50 110 L 60 92 L 68 92 Q 82 94 88 102 L 90 112 Z'), C.wood, { b: 2 });
        for (let y = 97; y < 112; y += 4) { const v = 10 - (y - 92) * 0.555; P.line(15, y, 50 - v - 1, y, C.wood[3]); P.line(50 + v + 1, y, 85, y, C.wood[3]); }
        for (let x = 16; x < 86; x += 5) { const dx = Math.abs(x - 50); P.line(x, dx < 10 ? 92 + (10 - dx) * 1.8 + 1 : 95, x, 111, C.wood[1]); }
      },
      front(P) {
        for (const s of [-1, 1]) P.part(P.poly([50, 94, 50 + s * 11, 86, 50 + s * 13, 97]), C.cream, { b: 4, sh: 0 });
        P.part(P.poly([46, 97, 54, 97, 55, 108, 50, 112, 45, 108]), C.green, { b: 3, sh: 0 });
        P.part(P.poly([46, 92, 54, 92, 53, 98, 47, 98]), C.green, { b: 2, sh: 0 });
        for (let y = 100; y < 110; y += 3) P.line(46 + (y - 100) * 0.1, y, 54 - (y - 100) * 0.1, y, C.green[4]);
        P.line(50, 99, 50, 110, C.green[1]);
      },
      hair(P) {
        P.part(P.path('M 25 52 Q 20 20 50 14 Q 80 16 77 52 L 74 50 Q 74 38 68 32 Q 56 28 46 30 Q 34 31 28 40 Z'), C.hair, { b: 1 });
        P.part(P.path('M 28 38 Q 24 12 50 9 Q 72 10 75 26 Q 62 18 50 22 Q 36 24 28 38 Z'), C.hair, { b: 1, sh: 0 });
        for (const d of ['M 32 30 Q 40 16 58 14', 'M 52 18 Q 64 16 72 24', 'M 27 46 Q 27 38 31 32']) P.curve(d, C.hair[0]);
        P.curve('M 38 16 Q 48 11 60 12', C.hair[3]);
      } },
    cueball: { bg: C.stone, iris: C.sky, brow: C.hair[2], browT: 4, face: 'angry', jaw: 5, lines: true, earK: 1.1,
      clothes(P) {
        P.part(P.path('M 0 112 L 1 96 Q 8 86 30 84 L 70 84 Q 92 86 99 96 L 100 112 Z'), C.tan, { b: 3 });
        P.part(P.poly([30, 88, 70, 88, 64, 112, 36, 112]), C.wood, { b: 2, sh: 0 });
        for (const y of [100, 108]) P.part(P.ell(50, y, 1.6, 1.6), C.wood, { b: 4, sh: 0, hi: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50 + s * 20, 86, 50 + s * 32, 88, 50 + s * 24, 98, 50 + s * 30, 100, 50 + s * 16, 112, 50 + s * 13, 112]), C.tan, { b: 2, sh: 0 });
      },
      front(P) {
        P.part(P.poly([38, 90, 62, 90, 50, 104]), C.snow, { b: 4, sh: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50, 92, 50 + s * 13, 84, 50 + s * 15, 95]), C.snow, { b: 4, sh: 0 });
        P.part(P.poly([46, 96, 54, 96, 55, 108, 50, 112, 45, 108]), C.maroon, { b: 3, sh: 0 });
        P.part(P.poly([46, 91, 54, 91, 53, 97, 47, 97]), C.maroon, { b: 2, sh: 0 });
      },
      hair(P) {
        P.part(P.path('M 18 42 Q 14 12 48 8 Q 86 8 84 40 Z'), C.wood, { b: 2 });
        for (const d of ['M 48 10 Q 30 18 22 38', 'M 48 10 Q 42 22 40 38', 'M 48 10 Q 58 22 62 38', 'M 48 10 Q 72 18 78 36']) P.curve(d, C.wood[1]);
        P.part(P.ell(48, 10, 2.4, 2.4), C.wood, { b: 3, sh: 0 });
        P.part(P.path('M 22 40 Q 50 30 80 38 Q 82 46 50 46 Q 22 48 22 40 Z'), C.wood, { b: 1 });
        P.curve('M 28 40 Q 50 34 74 40', C.wood[3]);
        P.curve('M 26 18 Q 34 12 44 11', C.wood[4]);
      } },
    matches: { bg: C.dusk, iris: C.hair, brow: C.raven[0], arch: true, face: 'worried', jaw: -4, lines: true,
      clothes(P) {
        P.part(P.path('M 4 112 L 6 100 Q 14 90 32 88 L 68 88 Q 86 90 94 100 L 96 112 Z'), C.sage, { b: 3 });
        P.part(P.poly([34, 90, 66, 90, 60, 112, 40, 112]), C.sage, { b: 1, sh: 0 });
        P.part(P.ell(50, 108, 1.6, 1.6), C.sage, { b: 4, sh: 0, hi: 0 });
      },
      front(P) {
        P.part(P.poly([40, 92, 60, 92, 50, 106]), C.mint, { b: 4, sh: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50, 94, 50 + s * 12, 86, 50 + s * 14, 98]), C.mint, { b: 4, sh: 0 });
        P.part(P.poly([46, 98, 54, 98, 55, 108, 50, 112, 45, 108]), C.teal, { b: 3, sh: 0 });
        P.part(P.poly([46, 93, 54, 93, 53, 99, 47, 99]), C.teal, { b: 2, sh: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50 + s * 14, 90, 50 + s * 24, 88, 50 + s * 20, 98, 50 + s * 24, 100, 50 + s * 10, 112, 50 + s * 7, 112]), C.sage, { b: 2, sh: 0 });
        P.part(P.poly([55, 73, 72, 66, 73, 68, 56, 75]), C.cream, { b: 4, sh: 0 });
        P.part(P.ell(73, 66.5, 2.2, 2), C.red, { b: 3, sh: 0, hi: 0 });
      },
      hair(P) {
        for (const s of [-1, 1]) P.part(P.path(`M ${50 + s * 25} 54 L ${50 + s * 26} 34 L ${50 + s * 17} 34 L ${50 + s * 22} 44 Z`), C.raven, { b: 2 });
        P.part(P.path('M 24 38 L 27 18 Q 37 8 46 12 L 50 16 L 54 12 Q 63 8 73 18 L 76 38 Z'), C.sage, { b: 3 });
        P.curve('M 40 12 Q 50 21 60 12', C.sage[1]);
        P.part(P.rect(24, 29, 52, 8), C.sage, { b: 0, sh: 0 });
        P.part(P.path('M 6 40 Q 22 32 50 33 Q 78 32 94 38 Q 92 44 78 42 Q 50 38 22 43 Q 8 46 6 40 Z'), C.sage, { b: 3 });
        P.curve('M 30 16 Q 38 10 46 12', C.sage[4]);
      } },
    parker: { bg: C.navy, skin: C.umber, iris: C.hair, brow: C.raven[0], browT: 3, face: 'worried', jaw: -1,
      clothes(P) {
        P.part(P.path('M 4 112 L 6 100 Q 14 90 32 88 L 68 88 Q 86 90 94 100 L 96 112 Z'), C.police, { b: 3 });
        for (const s of [-1, 1]) P.line(50 + s * 30, 89, 50 + s * 42, 97, C.gold[2]);
        const pts = [];
        for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 3.5 : 8; pts.push(28 + Math.cos(a) * r * 0.8, 100 + Math.sin(a) * r * 0.8); }
        P.part(P.poly(pts), C.gold, { b: 4, sh: 0 });
      },
      front(P) {
        P.part(P.poly([40, 92, 60, 92, 50, 106]), C.snow, { b: 4, sh: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50, 94, 50 + s * 12, 86, 50 + s * 14, 98]), C.snow, { b: 4, sh: 0 });
        P.part(P.poly([46, 98, 54, 98, 55, 108, 50, 112, 45, 108]), C.navy, { b: 3, sh: 0 });
        P.part(P.poly([46, 93, 54, 93, 53, 99, 47, 99]), C.navy, { b: 2, sh: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50 + s * 14, 90, 50 + s * 24, 88, 50 + s * 18, 112, 50 + s * 9, 112]), C.police, { b: 2, sh: 0 });
      },
      hair(P) {
        for (const s of [-1, 1]) P.part(P.path(`M ${50 + s * 25} 52 L ${50 + s * 26} 34 L ${50 + s * 19} 34 L ${50 + s * 22} 42 Z`), C.raven, { b: 2 });
        P.part(P.path('M 20 34 L 16 12 Q 50 -4 84 12 L 80 34 Z'), C.navy, { b: 3 });
        P.part(P.rect(22, 27, 56, 8), C.navy, { b: 1, sh: 0 });
        P.line(22, 27, 78, 27, C.gold[2]);
        P.part(P.path('M 25 35 L 75 35 Q 50 42 25 35 Z'), C.raven, { b: 2, sh: 0 });
        P.part(P.path('M 44 9 L 56 9 L 56 17 Q 50 22 44 17 Z'), C.gold, { b: 3, sh: 0 });
        P.curve('M 24 12 Q 36 4 48 3', C.navy[4]);
      } },
    ednaOld: { bg: C.olive, iris: C.teal, brow: C.snow[1], face: 'angry', lines: true, jaw: -4, sharp: true,
      clothes(P) {
        P.part(P.path('M 6 112 L 8 102 Q 16 92 32 90 L 68 90 Q 84 92 92 102 L 94 112 Z'), C.salmon, { b: 3 });
        for (let i = 0; i < 14; i++) P.part(P.ell(14 + (i * 37) % 72, 98 + (i * 13) % 12, 1.5, 1.5), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50, 92, 50 + s * 14, 86, 50 + s * 12, 98]), C.snow, { b: 4, sh: 0 });
        P.part(P.rect(47, 92, 6, 20), C.salmon, { b: 2, sh: 0 });
      },
      hair(P) {
        P.part(P.path('M 25 50 Q 22 16 50 14 Q 78 16 75 50 L 72 36 Q 64 26 50 26 Q 36 26 28 36 Z'), C.snow, { b: 2 });
        P.part(P.ell(50, 10, 13, 9), C.snow, { b: 3 });
        for (const d of ['M 34 22 Q 44 17 50 16', 'M 66 22 Q 56 17 50 16', 'M 44 8 Q 50 4 56 8']) P.curve(d, C.snow[1]);
        for (const s of [-1, 1]) P.part(P.poly([50 + s * 25, 62, 50 + s * 27, 68, 50 + s * 25, 76, 50 + s * 23, 68]), C.purple, { b: 3, sh: 0 });
      } },
    doc85: Object.assign({}, DOC, { bg: C.night, clothes(P) {
      P.part(P.path('M 2 112 L 4 100 Q 12 90 30 88 L 70 88 Q 88 90 96 100 L 98 112 Z'), C.snow, { b: 3 });
      P.part(P.poly([36, 88, 64, 88, 50, 108]), C.green, { b: 3, sh: 0 });
      P.part(P.poly([42, 88, 58, 88, 50, 98]), C.pink, { b: 4, sh: 0, hi: 0 });
      P.part(P.ell(24, 104, 7, 7), C.gold, { b: 4, sh: 0 });
      for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 - Math.PI / 2; P.part(P.poly([24, 104, 24 + Math.cos(a - 0.45) * 6, 104 + Math.sin(a - 0.45) * 6, 24 + Math.cos(a + 0.45) * 6, 104 + Math.sin(a + 0.45) * 6]), C.grey, { b: 0, sh: 0, hi: 0, ol: 0 }); }
    } }),
    doc31: Object.assign({}, DOC, { bg: C.slate, clothes(P) {
      P.part(P.path('M 2 112 L 4 100 Q 12 90 30 88 L 70 88 Q 88 90 96 100 L 98 112 Z'), C.mustard, { b: 3 });
      for (let x = 6; x < 96; x += 5) P.line(x, 96, x + 2, 112, C.mustard[1]);
      P.part(P.poly([34, 88, 66, 88, 60, 112, 40, 112]), C.red, { b: 3 });
      P.part(P.poly([42, 86, 58, 86, 50, 96]), C.snow, { b: 4, sh: 0 });
      P.part(P.poly([48, 90, 52, 90, 53, 112, 47, 112]), C.navy, { b: 3, sh: 0 });
    }, hair(P) {
      docTufts(P);
      P.part(P.ell(50, 18, 44, 7), C.khaki, { b: 3 });
      P.part(P.path('M 28 18 L 30 -2 Q 50 -8 70 -2 L 72 18 Z'), C.khaki, { b: 4 });
      P.part(P.rect(29, 9, 42, 6), C.hair, { b: 2, sh: 0 });
      for (let y = 0; y < 16; y += 3) P.line(30, y, 70, y, C.khaki[2]);
    } }),
    marty: {
      bg: C.denim, iris: C.sky, brow: C.hair[1],
      clothes(P) {
        P.part(P.path('M 2 112 L 4 100 Q 10 90 28 88 L 72 88 Q 90 90 96 100 L 98 112 Z'), C.denim, { b: 3 });
        P.part(P.poly([38, 89, 62, 89, 59, 112, 41, 112]), C.maroon, { b: 2, sh: 0 });
        for (const s of [-1, 1]) {
          P.part(P.poly([50 + s * 9, 88, 50 + s * 18, 90, 50 + s * 15, 112, 50 + s * 10, 112]), C.snow, { b: 3, sh: 0, hi: 0 });
          for (let y = 92; y < 112; y += 5) P.line(50 + s * 10, y, 50 + s * 16, y, C.sky[2]);
          P.line(50 + s * 13, 90, 50 + s * 13, 111, C.sky[2]);
          P.part(P.path(`M ${50 + s * 16} 88 Q ${50 + s * 30} 86 ${50 + s * 40} 96 L ${50 + s * 42} 112 L ${50 + s * 15} 112 Z`), C.vest, { b: 3 });
          for (let y = 96; y < 112; y += 6) P.line(50 + s * 18, y, 50 + s * 40, y, C.vest[1]);
        }
      },
      hair(P) {
        P.part(P.path('M 22 60 Q 16 16 50 11 Q 84 12 81 46 L 79 60 Q 76 40 70 33 Q 60 38 44 29 Q 35 37 29 42 L 27 60 Z'), C.hair, { b: 3 });
        P.part(P.path('M 44 29 Q 60 38 70 33 Q 76 40 79 52 Q 72 44 60 44 Q 50 42 44 29 Z'), C.hair, { b: 2, sh: 0 });
        for (const d of ['M 30 22 Q 44 14 62 18', 'M 26 34 Q 34 22 50 20', 'M 52 24 Q 66 26 76 38', 'M 24 48 Q 24 38 30 30']) P.curve(d, C.hair[1]);
        for (const d of ['M 36 18 Q 46 14 56 16', 'M 60 22 Q 70 26 74 34']) P.curve(d, C.hair[4]);
      }
    },
    george: {
      bg: C.olive, iris: C.hair, brow: C.snow[1], lines: true,
      clothes(P) {
        P.part(P.path('M 2 112 L 4 100 Q 12 90 30 88 L 70 88 Q 88 90 96 100 L 98 112 Z'), C.tan, { b: 3 });
        P.part(P.poly([38, 88, 62, 88, 54, 112, 46, 112]), C.red, { b: 2, sh: 0 });
        P.part(P.poly([44, 88, 56, 88, 50, 100]), C.skin, { b: 2, sh: 0, hi: 0 });
        for (const s of [-1, 1]) P.part(P.poly([50 + s * 6, 112, 50 + s * 12, 88, 50 + s * 22, 90, 50 + s * 14, 112]), C.tan, { b: 4, sh: 0 });
      },
      hair(P) {
        P.part(P.path('M 25 50 Q 24 18 50 15 Q 76 18 75 50 L 73 40 Q 68 27 54 27 Q 38 26 29 37 Z'), C.snow, { b: 2 });
        P.curve('M 38 18 Q 37 24 36 29', C.snow[0]);
        for (const d of ['M 40 20 Q 56 17 70 26', 'M 30 30 Q 34 22 38 20']) P.curve(d, C.snow[1]);
      }
    },
    biff: {
      bg: C.green, iris: C.hair, brow: C.tan[1], face: 'angry', jaw: 2,
      clothes(P) {
        P.part(P.path('M 0 112 L 2 98 Q 10 88 30 86 L 70 86 Q 90 88 98 98 L 100 112 Z'), C.green, { b: 3 });
        for (const s of [-1, 1]) P.line(50 + s * 30, 90, 50 + s * 42, 112, C.snow[4]);
        P.line(50, 94, 50, 112, C.green[1]);
      },
      front(P) {
        P.part(P.path('M 37 80 Q 50 76 63 80 L 66 108 Q 50 112 34 108 Z'), C.red, { b: 3, sh: 1 });
        for (let y = 83; y < 92; y += 3) P.line(38, y, 62, y, C.red[1]);
      },
      hair(P) {
        for (const s of [-1, 1]) P.part(P.path(`M ${50 + s * 25} 52 L ${50 + s * 26} 34 L ${50 + s * 18} 34 L ${50 + s * 22} 44 Z`), C.tan, { b: 3 });
        P.part(P.path('M 18 36 Q 18 6 50 4 Q 82 6 82 36 Z'), C.steel, { b: 3 });
        P.part(P.rect(16, 32, 68, 6), C.steel, { b: 1, sh: 0 });
        for (let i = -3; i <= 3; i++) P.part(P.ell(50 + i * 7, 22 - Math.abs(i) * 1.2, 1.8, 1.8), i % 2 ? C.ledG : C.ledR, { b: 0, sh: 0, hi: 0 });
        for (const s of [-1, 1]) {
          P.part(P.rect(50 + s * 22 - 6, -2, 12, 18), C.red, { b: 3, sh: 1 });
          P.part(P.rect(50 + s * 22 - 6, 5, 12, 3), C.snow, { b: 4, sh: 0, hi: 0, ol: 0 });
          P.line(50 + s * 22, 16, 50 + s * 10, 22, C.gold[2]);
        }
      }
    }
  };

  LOOK.marty31 = Object.assign({}, LOOK.marty, { bg: C.brick, clothes(P) {
    P.part(P.path('M 2 112 L 4 100 Q 10 90 28 88 L 72 88 Q 90 90 96 100 L 98 112 Z'), C.snow, { b: 3 });
    for (const s of [-1, 1]) {
      P.part(P.path(`M ${50 + s * 12} 90 Q ${50 + s * 28} 88 ${50 + s * 38} 96 L ${50 + s * 40} 112 L ${50 + s * 8} 112 Z`), C.cocoa, { b: 3 });
      P.part(P.poly([50, 100, 50 + s * 14, 84, 50 + s * 19, 98]), C.snow, { b: 4, sh: 0 });
    }
    P.part(P.poly([44, 88, 56, 88, 50, 102]), C.skin, { b: 2, sh: 0, hi: 0 });
    for (const y of [102, 108]) P.part(P.ell(42, y, 1.4, 1.4), C.cocoa, { b: 4, sh: 0, hi: 0 });
  } });

  LOOK.artieHat = Object.assign({}, LOOK.artie, { hair(P) {
    for (const s of [-1, 1]) P.part(P.path(`M ${50 + s * 25} 54 L ${50 + s * 26} 34 L ${50 + s * 16} 34 L ${50 + s * 21} 44 Z`), C.hair, { b: 1 });
    P.part(P.path('M 22 38 L 25 16 Q 36 8 46 12 L 50 16 L 54 12 Q 64 8 75 16 L 78 38 Z'), C.cream, { b: 3 });
    P.curve('M 40 12 Q 50 20 60 12', C.cream[1]);
    P.part(P.rect(22, 28, 56, 9), C.red, { b: 2, sh: 0 });
    for (const s of [-1, 1]) P.part(P.poly([70, 32, 70 + s * 7, 27, 70 + s * 7, 37]), C.red, { b: 3, sh: 0 });
    P.part(P.path('M 2 40 Q 20 31 50 33 Q 80 31 98 38 Q 96 45 80 43 Q 50 39 20 44 Q 4 47 2 40 Z'), C.cream, { b: 3 });
  } });

  function portrait(id, o) {
    o = o || {};
    const key = id + '|' + (o.talk ? 1 : 0) + (o.blink ? 1 : 0) + (o.face || '');
    if (CACHE.has(key)) return CACHE.get(key);
    const L = LOOK[id];
    const b = new Buf(PW, PH);
    const bg = L ? L.bg : C.slate;
    for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
      const t = Math.hypot((x - PW / 2) / PW, (y - PH * 0.42) / PH) * 3.4;
      const i = Math.max(0, Math.min(2, Math.floor(2 - t + S.BAYER[((y & 3) << 2) | (x & 3)] - 0.5)));
      b.px[y * PW + x] = bg[i];
    }
    if (L) {
      const P = new Pen(b);
      if (L.hairBack) L.hairBack(P);
      L.clothes(P);
      head(P, o, L);
      if (L.front) L.front(P);
      L.hair(P);
    }
    for (let x = 0; x < PW; x++) { b.set(x, 0, C.black); b.set(x, PH - 1, C.black); }
    for (let y = 0; y < PH; y++) { b.set(0, y, C.black); b.set(PW - 1, y, C.black); }
    if (CACHE.size > 200) CACHE.clear();
    CACHE.set(key, b);
    return b;
  }

  function drawer(id) {
    return (f, x, y, w, h, g) => {
      const a = g.actors[id];
      const sp = g.speech.find(q => q.who === id);
      const key = id === 'doc' ? ((g.f.chapter || 0) >= 3 ? 'doc31' : 'doc85') : id === 'artie' && a && a.v !== 'nohat' ? 'artieHat' : id === 'marty' && g.f.dressed ? 'marty31' : id;
      const b = portrait(key, { talk: sp && a && a.mouth, blink: a && a.blink, face: a && a.face });
      S.blit(f, b, x + Math.floor((w - PW) / 2), y + Math.floor((h - PH) / 2));
    };
  }

  B.portrait = portrait;
  B.portraitCache = CACHE;
  B.PORTRAIT = { w: PW, h: PH };
  B.PORTRAIT_LOOK = LOOK;
  B.portraitDrawer = drawer;
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
