(function (H) {
  'use strict';
  const K = H.Cine.Kit, CU = H.Cine.closeup, TWO = H.Cine.two;
  const { LW, LH, BAR, lerp, sm, eOut, seg, hx, rgba, glow, lighter, poly, rect, ell, line, ring, flash, vignette, vgrad, speedLines, BG } = K;
  const LOW = LH - BAR + 6;
  const woodDragon = (g, T) => {
    const at = s => [50 + 130 * s + 34 * Math.sin(s * 7.5), 206 - 112 * s + 20 * Math.sin(s * 11)];
    for (const [col, extra] of [['#10120a', 3], ['#5e6236', 0]]) {
      for (let i = 0; i < 44; i++) { const a = at(i / 44), b = at((i + 1) / 44); line(g, col, 22 - 14 * (i / 44) + extra, a[0], a[1], b[0], b[1]); }
    }
    for (let i = 0; i < 44; i += 2) { const s = i / 44, [x, y] = at(s); rect(g, '#8a8e50', x - 3, y - (11 - 7 * s), 6, 2); rect(g, rgba('#d8e870', 0.6 + 0.4 * Math.sin(T * 3 + i)), x - 1, y - 1, 2, 2); }
    const [x, y] = at(1);
    for (const [a, b, c, d] of [[x + 6, y - 12, x + 22, y - 34], [x + 15, y - 24, x + 6, y - 38], [x + 2, y - 12, x + 10, y - 30]]) { line(g, '#141608', 5, a, b, c, d); line(g, '#5a5e34', 2, a, b, c, d); }
    poly(g, '#141608', [x + 12, y - 12, x - 26, y - 6, x - 30, y + 4, x - 6, y + 8, x + 12, y + 8]);
    poly(g, '#5e6236', [x + 10, y - 10, x - 24, y - 5, x - 27, y + 3, x - 6, y + 6, x + 10, y + 6]);
    poly(g, '#141608', [x - 4, y + 8, x - 26, y + 8, x - 6, y + 14, x + 8, y + 10]);
    rect(g, '#e8ff90', x - 8, y - 6, 4, 3);
    line(g, '#d8e870', 1, x - 26, y + 2, x - 44, y - 10);
    for (const [sx, cx, cy] of [[0.28, -14, 16], [0.62, 16, 14]]) { const [px, py] = at(sx); line(g, '#141608', 6, px, py, px + cx, py + cy); line(g, '#5a5e34', 2, px, py, px + cx, py + cy); }
    lighter(g, () => glow(g, x - 6, y - 4, 16, '#e8ff90', 0.7));
  };

  Object.assign(BG, {
    lf_prison(g, t) {
      vgrad(g, 0, LH, [[0, '#06060c'], [0.6, '#120c14'], [1, '#1e0e10']]);
      for (let i = 0; i < 7; i++) { const x = 20 + i * 46; rect(g, '#0c0a12', x, 0, 14, LH); rect(g, '#1a1620', x, 0, 2, LH); }
      rect(g, '#16101a', 0, 182, LW, 58);
      for (let x = 0; x < LW; x += 28) rect(g, '#22181e', x, 182, 1, 58);
      lighter(g, () => { glow(g, 160, 96, 110, '#a02030', 0.28 + 0.06 * Math.sin(t * 2)); glow(g, 160, 30, 60, '#50c8d0', 0.12); });
      for (const x of [112, 208]) { line(g, '#3a3640', 2, x, 0, 160 + (x - 160) * 0.4, 110); line(g, '#5a5660', 1, x, 0, 160 + (x - 160) * 0.4, 110); }
      vignette(g, 0.7);
    },
    lf_void(g, t) {
      vgrad(g, 0, LH, [[0, '#04060e'], [1, '#101a30']]);
      for (let i = 0; i < 70; i++) {
        const y = ((hx(i, 7, 3) * LH - t * (6 + hx(i, 8, 3) * 12)) % LH + LH) % LH;
        rect(g, rgba('#c02840', 0.4 * hx(i, 9, 3)), Math.floor(hx(i, 6, 3) * LW), Math.floor(y), 1, 2);
      }
      vignette(g, 0.75, '#000008');
    },
    lf_hangar(g, t) {
      vgrad(g, 0, LH, [[0, '#06142a'], [0.6, '#123a64'], [1, '#0a2038']]);
      for (let x = 10; x < LW; x += 64) { rect(g, '#0a1c34', x, 0, 18, 170); rect(g, '#1e3e62', x, 0, 2, 170); rect(g, '#58d8c0', x + 8, 40, 2, 90); }
      rect(g, '#1c3048', 0, 170, LW, 70);
      for (let x = 0; x < LW; x += 40) line(g, '#46a8a0', 1, x, 170, x + (x - 160) * 0.6, 240);
      lighter(g, () => glow(g, 160, 60, 110, '#58d8c0', 0.14 + 0.03 * Math.sin(t * 2)));
    },
    lf_forge(g, t) {
      vgrad(g, 0, LH, [[0, '#0e1848'], [0.6, '#2a4a8a'], [1, '#141e50']]);
      for (let i = 0; i < 50; i++) rect(g, rgba('#ffffff', 0.25 + 0.5 * hx(i, 3, 11)), Math.floor(hx(i, 1, 11) * LW), Math.floor(hx(i, 2, 11) * 120), 1, 1);
      for (const [a, b, c, d, w] of [[40, 180, 130, 90, 10], [280, 180, 190, 90, 10], [20, 110, 120, 70, 6], [300, 110, 200, 70, 6], [90, 10, 150, 60, 5], [240, 8, 170, 60, 5]]) line(g, '#1a1420', w, a, b, c, d);
      ell(g, '#8a6a34', 160, 74, 42, 46); ell(g, '#c8a050', 160, 72, 36, 40); ell(g, '#3a2a18', 160, 74, 26, 30);
      lighter(g, () => { glow(g, 160, 74, 60 + Math.sin(t * 3) * 6, '#ffd060', 0.5); });
      ell(g, '#fff4b8', 160, 74, 9, 11);
      line(g, '#1a1420', 6, 110, 40, 210, 110); line(g, '#1a1420', 6, 210, 40, 110, 110); line(g, 'rgba(88,240,224,0.6)', 2, 60, 110, 260, 60);
      rect(g, '#1c3450', 0, 176, LW, 64); for (let x = 0; x < LW; x += 40) line(g, '#3ec8d8', 1, x, 176, x + (x - 160) * 0.5, 240);
      vignette(g, 0.45);
    },
    lf_furnace(g, t) {
      vgrad(g, 0, LH, [[0, '#06140f'], [0.6, '#123a2c'], [1, '#0a1c16']]);
      for (let x = 8; x < LW; x += 62) { rect(g, '#0a1c16', x, 0, 16, 176); rect(g, '#2a4a3c', x, 0, 1, 176); }
      for (const h of [176]) rect(g, '#22302a', 0, h, LW, 64);
      for (let x = 0; x < LW; x += 40) line(g, '#b89a4a', 1, x, 176, x + (x - 160) * 0.5, 240);
      rect(g, '#4e3a1a', 120, 112, 80, 64); rect(g, '#8a6a34', 124, 112, 72, 4); rect(g, '#14100c', 140, 128, 40, 48);
      lighter(g, () => { glow(g, 160, 96, 70 + Math.sin(t * 5) * 6, '#ff8a30', 0.5); glow(g, 160, 150, 40, '#ffd060', 0.4); });
      for (let i = 0; i < 26; i++) { const k = (t * 0.7 + hx(i, 1, 13)) % 1, x = 160 + Math.sin(t * 3 + i) * 22 * k, y = 130 - k * 130; rect(g, rgba(k < 0.4 ? '#ffd060' : '#ff8a30', 0.9 * (1 - k)), x, y, 8 - k * 5, 8); }
      vignette(g, 0.55);
    },
    lf_altar(g, t) {
      vgrad(g, 0, LH, [[0, '#23364c'], [0.5, '#48687e'], [0.7, '#7c94a4'], [1, '#3e4c58']]);
      for (let i = 0; i < 7; i++) { const x = ((hx(i, 2, 21) * (LW + 160) - t * (3 + i)) % (LW + 160) + LW + 160) % (LW + 160) - 80; ell(g, rgba('#16283c', 0.5), x, 26 + hx(i, 3, 21) * 80, 60 + hx(i, 4, 21) * 40, 12); }
      rect(g, '#3e4c58', 0, 104, LW, 40); rect(g, '#56646e', 0, 104, LW, 2);
      rect(g, '#2a3640', 262, 40, 34, 90); rect(g, '#566470', 264, 40, 8, 90); rect(g, '#2a3640', 36, 72, 30, 60); rect(g, '#566470', 38, 72, 7, 60);
      for (const [a, b, c, d, w] of [[150, 112, 120, 60, 12], [120, 60, 190, 40, 9], [190, 40, 150, 20, 6], [150, 80, 220, 90, 5]]) { line(g, '#2a2e24', w, a, b, c, d); line(g, '#d8e870', 1, a, b, c, d); }
      for (let y = 112; y < 176; y += 7) { rect(g, '#3e4e5c', 90 - (y - 112) * 0.5, y, 140 + (y - 112), 5); rect(g, '#5a6a78', 90 - (y - 112) * 0.5, y, 140 + (y - 112), 1); }
      rect(g, '#7c8c98', 0, 176, LW, 64); for (let x = 0; x < LW; x += 44) line(g, '#4ac0f0', 1, x, 176, x + (x - 160) * 0.4, 240);
      vignette(g, 0.42);
    },
    lf_ocean(g, t) {
      vgrad(g, 0, LH, [[0, '#3e6484'], [0.5, '#7ca0b4'], [0.56, '#1e5a8a'], [1, '#123e68']]);
      for (let i = 0; i < 24; i++) { const y = 136 + hx(i, 2, 23) * 100, x = ((hx(i, 3, 23) * (LW + 60) - t * (10 + y * 0.1)) % (LW + 60) + LW + 60) % (LW + 60) - 30; rect(g, rgba('#7ac8e8', 0.5), x, y, 18 + hx(i, 4, 23) * 26, 1); }
      for (const [x, h] of [[42, 40], [250, 62], [292, 30]]) { rect(g, '#2a3a48', x, 134 - h, 22, h + 6); rect(g, '#4a5a68', x, 134 - h, 5, h + 6); }
      vignette(g, 0.3);
    },
    lf_skyharbor(g, t) {
      vgrad(g, 0, LH, [[0, '#04081e'], [0.55, '#14205a'], [0.8, '#3a3a78'], [1, '#6a4a70']]);
      for (let i = 0; i < 90; i++) rect(g, rgba('#ffffff', 0.25 + 0.6 * hx(i, 3, 43)), Math.floor(hx(i, 1, 43) * LW), Math.floor(hx(i, 2, 43) * 150), 1, 1);
      for (const [x, y, r] of [[60, 70, 26], [250, 40, 18]]) lighter(g, () => glow(g, x, y, r, '#7a9ae8', 0.14));
      for (const [x, w, h] of [[0, 60, 36], [52, 44, 52], [92, 36, 28], [190, 48, 40], [236, 40, 60], [272, 48, 34]]) { rect(g, '#0c1030', x, 208 - h, w, h + 4); poly(g, '#0c1030', [x - 6, 208 - h, x + w / 2, 208 - h - 10, x + w + 6, 208 - h]); for (let a = x + 5; a < x + w - 4; a += 9) rect(g, rgba('#ffc060', 0.7), a, 216 - h, 3, 4); }
      rect(g, '#141a40', 0, 206, LW, 34);
      for (let x = 0; x < LW; x += 44) line(g, '#3e5a90', 1, x, 206, x + (x - 160) * 0.4, 240);
      vignette(g, 0.5, '#000010');
    },
    lf_rootsbg(g, t) {
      vgrad(g, 0, LH, [[0, '#020403'], [0.7, '#0c1a10'], [1, '#141c0c']]);
      for (const [a, b, c, d, w] of [[0, 20, 120, 120, 12], [320, 20, 200, 120, 12], [80, 0, 150, 110, 9], [240, 0, 170, 110, 9], [160, 0, 160, 100, 14], [20, 160, 130, 150, 7], [300, 160, 190, 150, 7]]) { line(g, '#141608', w, a, b, c, d); line(g, '#2a2e1c', Math.max(1, w - 6), a, b - 1, c, d - 1); }
      lighter(g, () => glow(g, 160, 96, 120, '#c8f070', 0.14 + 0.03 * Math.sin(t * 2)));
      for (let i = 0; i < 44; i++) { const y = ((hx(i, 7, 31) * LH - t * (5 + hx(i, 8, 31) * 12)) % LH + LH) % LH; rect(g, rgba('#d8f080', 0.25 + 0.5 * hx(i, 9, 31)), Math.floor(hx(i, 6, 31) * LW), Math.floor(y), 2, 2); }
      rect(g, '#1c1e12', 0, 190, LW, 50);
      for (let x = 0; x < LW; x += 44) line(g, '#c8e070', 1, x, 190, x + (x - 160) * 0.4, 240);
      vignette(g, 0.62, '#000200');
    },
    lf_delve(g, t) {
      vgrad(g, 0, LH, [[0, '#060a1c'], [0.7, '#10183a'], [1, '#0a1028']]);
      for (let x = 12; x < LW; x += 60) { rect(g, '#0a1024', x, 0, 16, 176); rect(g, '#1a2a44', x, 0, 1, 176); }
      rect(g, '#141e38', 0, 176, LW, 64);
      for (const [a, b, c, d, w] of [[0, 150, 60, 120, 8], [320, 140, 262, 110, 8], [30, 176, 90, 150, 5]]) line(g, '#120e18', w, a, b, c, d);
      lighter(g, () => glow(g, 160, 120, 90, '#7a9ad0', 0.1 + 0.02 * Math.sin(t * 2)));
      vignette(g, 0.7);
    },
    lf_matrix(g, t) {
      vgrad(g, 0, LH, [[0, '#0c0e38'], [0.6, '#2a2a80'], [1, '#141c50']]);
      for (let i = 0; i < 70; i++) rect(g, rgba('#ffffff', 0.2 + 0.6 * hx(i, 3, 9)), Math.floor(hx(i, 1, 9) * LW), Math.floor(hx(i, 2, 9) * 170), 1, 1);
      rect(g, '#1e6a8a', 150, 0, 20, 90); for (let y = 6; y < 90; y += 10) rect(g, '#58f0e0', 150, y, 20, 2);
      lighter(g, () => glow(g, 160, 60, 70, '#58f0e0', 0.25));
      rect(g, '#1a2a68', 0, 170, LW, 70);
      for (const r of [130, 96, 62]) ring(g, rgba('#58f0e0', 0.5), 1, 160, 206, r);
      vignette(g, 0.5);
    },
    lf_plaza(g, t) {
      vgrad(g, 0, LH, [[0, '#0a1238'], [0.5, '#283a8c'], [0.72, '#4a3e80'], [1, '#20224a']]);
      for (let i = 0; i < 60; i++) rect(g, rgba('#ffffff', 0.25 + 0.5 * hx(i, 3, 5)), Math.floor(hx(i, 1, 5) * LW), Math.floor(hx(i, 2, 5) * 150), 1, 1);
      for (let i = 0; i < 4; i++) ring(g, rgba('#8a9ae8', 0.12), 2, 210, 40, 60 + i * 34 + Math.sin(t * 0.5 + i) * 2);
      for (const x of [34, 96, 274]) for (let y = 12; y < 140; y += 12) rect(g, rgba('#ffe0a0', 0.5 + 0.3 * Math.sin(t * 2 + y)), x + (y % 5), y, 3, 7);
      poly(g, '#1a1a38', [0, 170, 0, 104, 44, 88, 86, 104, 86, 170]); poly(g, '#1a1a38', [236, 170, 236, 112, 278, 96, 320, 110, 320, 170]);
      rect(g, '#ffc878', 14, 124, 12, 18); rect(g, '#ffc878', 54, 124, 12, 18); rect(g, '#ffc878', 252, 126, 14, 18); rect(g, '#ffc878', 290, 126, 14, 18);
      rect(g, '#1e1a2a', 156, 84, 8, 86); line(g, '#1e1a2a', 4, 160, 110, 118, 66); line(g, '#1e1a2a', 4, 160, 100, 204, 60);
      for (const [x, y, r] of [[116, 62, 26], [160, 46, 34], [206, 56, 26]]) { ell(g, '#3e9a9a', x, y + 2, r, r * 0.6); ell(g, '#9af0e0', x, y, r - 2, r * 0.55); }
      lighter(g, () => glow(g, 160, 54, 70, '#8affe8', 0.18));
      rect(g, '#2a2e58', 0, 170, LW, 70);
      ell(g, '#3e4478', 160, 206, 136, 28); ring(g, '#e0b458', 1, 160, 206, 132);
      vignette(g, 0.45);
    },
    lf_sky(g, t) {
      vgrad(g, 0, LH, [[0, '#2c6cc0'], [0.6, '#74b4ea'], [1, '#d4ecfa']]);
      for (let i = 0; i < 8; i++) {
        const x = ((hx(i, 2, 7) * (LW + 120) - t * (8 + i * 2)) % (LW + 120) + LW + 120) % (LW + 120) - 60, y = 40 + hx(i, 3, 7) * 130;
        ell(g, 'rgba(255,255,255,0.75)', x, y, 34 + hx(i, 4, 7) * 22, 7); ell(g, 'rgba(255,255,255,0.5)', x + 16, y - 4, 22, 5);
      }
      for (let i = 0; i < 6; i++) { const x = 10 + i * 56, w = 22 + hx(i, 5, 7) * 18, h = 60 + hx(i, 6, 7) * 90; rect(g, rgba('#3c6c9e', 0.5), x, LH - BAR - h, w, h); for (let y = LH - BAR - h + 8; y < LH - BAR; y += 14) rect(g, rgba('#2a4e78', 0.5), x - 3, y, w + 6, 3); }
    }
  });

  function skiff(g, x, y, s, t) {
    g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(s, s);
    poly(g, '#f0f4f8', [-48, 4, -30, -8, 40, -8, 52, 2, 40, 10, -30, 10]);
    rect(g, '#c8452a', -30, 4, 70, 3);
    poly(g, '#3e7e86', [-20, -8, -14, -20, 22, -20, 28, -8]);
    for (let i = 0; i < 4; i++) rect(g, '#7fffd4', -12 + i * 9, -17, 6, 6);
    lighter(g, () => glow(g, -52, 3, 12 + Math.sin(t * 20) * 2, '#7fffd4', 0.8));
    g.restore();
  }

  const CINES = {
    c_lf_shackle: {
      music: 'mystery',
      shots: [
        { d: 3.2, sub: [[0.3, '=Лофу Сяньчжоу|Дом кандалов']], draw: S => { S.bg('lf_prison', S.T); S.fig('blade', 160, 170, { s: 1.1 }); S.fig('jingyuan', lerp(40, 70, sm(S.t / 3.2)), 214); S.fig('yanqing', lerp(14, 40, sm(S.t / 3.2)), 220); } },
        { d: 2.4, sub: [[0.2, 'jingyuan|Яньцин']], draw: CU('lf_prison', 'jingyuan', { side: 'l' }) },
        { d: 2.2, sub: [[0.2, 'yanqing|Да, генерал?']], draw: CU('lf_prison', 'yanqing', { side: 'r', flip: true }) },
        { d: 2.8, sub: [[0.2, 'jingyuan|Присмотрись-ка к этому человеку.']], draw: CU('lf_prison', 'jingyuan', { side: 'l', push: 1.08 }) },
        { d: 2.6, sub: [[0.2, 'jingyuan|Ты меня помнишь?']], draw: TWO('lf_prison', 'jingyuan', 'blade') },
        { d: 2.2, sub: [[0.2, 'blade|Помню.']], draw: CU('lf_prison', 'blade', { side: 'r', tint: '#40060c', ta: 0.2 }) },
        { d: 2.4, sub: [[0.2, 'blade|Из пяти людей...']], draw: CU('lf_prison', 'blade', { side: 'r', tint: '#40060c', ta: 0.25, push: 1.1 }) },
        { d: 2.4, sub: [[0.2, 'blade|трое должны заплатить.']], draw: CU('lf_prison', 'blade', { side: 'r', tint: '#40060c', ta: 0.3, push: 1.14 }) },
        { d: 3.0, sub: [[0.3, 'blade|Цзин Юань, ты не один из них.']], draw: CU('lf_prison', 'blade', { size: 150, tint: '#40060c', ta: 0.35, push: 1.08 }) }
      ]
    },

    c_lf_nightmare: {
      music: 'threat',
      shots: [
        { d: 2.6, sub: [[0.2, 'blade|Из пяти людей']], draw: CU('lf_void', 'blade', { tint: '#180830', ta: 0.3, size: 140 }) },
        { d: 2.4, sub: [[0.2, 'blade|трое должны заплатить.']], draw: CU('lf_void', 'blade', { tint: '#180830', ta: 0.35, size: 150, push: 1.1 }) },
        { d: 2.6, sub: [[0.2, 'blade|Ты один из них.']], sfx: [[1.4, 'hit']], draw: S => { CU('lf_void', 'blade', { tint: '#300810', ta: 0.4, size: 168, push: 1.16 })(S); flash(S.g, '#ffffff', seg(S.t, 2.2, 2.6)); } },
        { d: 2.6, sfx: [[1.2, 'door'], [1.7, 'door']], draw: S => { const g = S.g; vgrad(g, 0, LH, [[0, '#0e0c16'], [1, '#1e1824']]); rect(g, '#2a2230', 0, 170, LW, 70); S.bust('danheng', 160, LOW, 136, { tint: '#101030', ta: 0.3 }); lighter(g, () => glow(g, 280, 110, 60, '#ffe0a0', 0.12)); vignette(g, 0.55); } }
      ]
    },

    c_lf_kafka: {
      music: 'mystery',
      shots: [
        { d: 2.8, sfx: [[0.3, 'glint']], sub: [[0.4, 'kafka|Давненько не виделись, друзья со Звёздного экспресса.']], draw: S => { S.bg('parlor', S.T); const a = sm(S.t / 0.8); lighter(S.g, () => glow(S.g, 160, 120, 90, '#b070ff', 0.3 * a)); S.fig('kafka', 160, 206, { a: 0.75 * a, tint: '#b890ff', ta: 0.3 }); for (let y = BAR; y < LH - BAR; y += 3) rect(S.g, rgba('#c8a0ff', 0.08), 110, y, 100, 1); S.fig('himeko', 60, 216, {}); S.fig('welt', 262, 216, { flip: true }); } },
        { d: 2.2, sub: [[0.2, 'kafka|Я Кафка.']], draw: CU('parlor', 'kafka', { tint: '#b890ff', ta: 0.25 }) },
        { d: 3.0, sub: [[0.2, 'kafka|Хм, удачно я время выбрала. Все здесь...'], [1.8, 'kafka|Ну, почти все.']], draw: CU('parlor', 'kafka', { tint: '#b890ff', ta: 0.25, side: 'r', flip: true }) },
        { d: 3.0, sub: [[0.2, 'himeko|Нет нужды представляться...'], [1.6, 'himeko|Охотники за Стелларонами.']], draw: CU('parlor', 'himeko', { side: 'l' }) },
        { d: 3.0, sub: [[0.2, 'kafka|Химико, верно?'], [1.4, 'kafka|Прошу прощения, что помешала вашему собранию.']], draw: TWO('parlor', 'himeko', 'kafka', { vr: null }) },
        { d: 3.0, sub: [[0.2, 'kafka|Но выслушав мою просьбу'], [1.5, 'kafka|вы простите мне мою дерзость.']], draw: CU('parlor', 'kafka', { tint: '#b890ff', ta: 0.2, push: 1.1 }) },
        { d: 3.2, sub: [[0.2, 'kafka|Хочу попросить вас'], [1.4, 'kafka|...изменить пункт назначения.']], draw: CU('parlor', 'kafka', { tint: '#b890ff', ta: 0.2, size: 156, push: 1.12 }) }
      ]
    },

    c_lf_warp: {
      music: 'express',
      shots: [
        { d: 2.4, sub: [[0.2, 'pompom|Поезд вот-вот совершит гиперпрыжок.']], draw: CU('parlor', 'pompom', {}) },
        ...['5', '4', '3', '2'].map((n, i) => ({ d: 1, sub: [[0.05, 'pompom|' + n]], draw: S => { S.bg('space', S.T); K.expressSide(S.g, 160, 130, 1 + i * 0.12, S.T, {}); speedLines(S.g, S.T, 160, 120, 20 + i * 12, '#c8e4ff', 0.25 + i * 0.1, 60 - i * 8); } })),
        { d: 2.0, sub: [[0.05, 'pompom|1']], sfx: [[0.2, 'warp']], draw: S => { const g = S.g; S.bg('space', S.T); speedLines(g, S.T, 160, 120, 70, '#ffffff', 0.7, 20); lighter(g, () => glow(g, 160, 120, 40 + S.t * 90, '#c8f0ff', 0.9)); flash(g, '#ffffff', seg(S.t, 1.3, 2)); } },
        { d: 3.4, fadeIn: '#ffffff', draw: S => { const g = S.g, t = S.t; S.bg('space', S.T); K.planet(g, 250, 60, 34, 'gas', S.T); for (const [x, y, w, h] of [[92, 60, 136, 110], [120, 34, 80, 40]]) { rect(g, '#2c3a52', x, y, w, h); rect(g, '#46566e', x, y, w, 3); } rect(g, '#1a2638', 136, 96, 48, 74); lighter(g, () => { glow(g, 160, 130, 44, '#7fffd4', 0.45); ring(g, rgba('#7fffd4', 0.6), 2, 160, 130, 26 + Math.sin(S.T * 3) * 2); }); K.expressSide(g, lerp(-40, 150, eOut(t / 3)), 200, 0.8, S.T, {}); } }
      ]
    },

    c_lf_fuxuan: {
      music: 'mystery',
      shots: [
        { d: 2.6, sub: [[0.2, 'kafka|Наконец-то.']], sfx: [[1.2, 'hit'], [1.5, 'hit'], [1.8, 'hit']], draw: S => { const g = S.g, t = S.t; S.bg('lf_hangar', S.T); S.fig('kafka', 150, 214, { k: 1 }); if (t > 1.1) for (let i = 0; i < 6; i++) { const y = 150 - ((t - 1.1) * 240 + i * 30) % 140; line(g, rgba('#ffe8a0', 0.9), 2, 158 + i * 3, y, 156 + i * 3, y - 14); lighter(g, () => glow(g, 158, 150, 8 + Math.sin(S.T * 40) * 2, '#ffd080', 0.8)); } } },
        { d: 2.6, sub: [[0.3, 'fuxuan|Жалкий трюк.']], sfx: [[0.5, 'shield']], draw: S => { const g = S.g, t = S.t, y = lerp(30, 118, eOut(t / 1.2)); S.bg('lf_hangar', S.T); lighter(g, () => { glow(g, 160, y, 54, '#c0a0ff', 0.5); for (let i = 0; i < 3; i++) ring(g, rgba('#e0c8ff', 0.7 - i * 0.18), 1, 160, y, 26 + i * 12 + Math.sin(S.T * 3 + i) * 2); }); S.fig('fuxuan', 160, y + 60, {}); for (let i = 0; i < 8; i++) { const a = i * 0.8 + S.T, r = 48 + (t * 30) % 20; rect(g, rgba('#ffe8a0', 0.8), 160 + Math.cos(a) * r, y + Math.sin(a) * r, 3, 1); } } },
        { d: 3.4, sub: [[0.2, 'fuxuan|Каждый ваш шаг'], [1.1, 'fuxuan|был предвиден'], [2.1, 'fuxuan|всевидящим оком.']], draw: CU('lf_hangar', 'fuxuan', { size: 140, push: 1.1, fx: S => lighter(S.g, () => { for (let i = 0; i < 3; i++) ring(S.g, rgba('#e0c8ff', 0.3), 1, 160, 92, 40 + i * 22 + Math.sin(S.T * 2 + i) * 3); }) }) },
        { d: 3.2, sub: [[0.2, 'fuxuan|Фу Сюань, Комиссия по предсказаниям.'], [1.7, 'fuxuan|Я займусь преступником.']], draw: TWO('lf_hangar', 'kafka', 'fuxuan') }
      ]
    },

    c_lf_bailu: {
      music: 'threat',
      shots: [
        { d: 2.8, sfx: [[1.4, 'shock']], draw: S => { const t = S.t; S.bg('lf_plaza', S.T); S.fig('xz_man', 60, 206, { flip: true }); S.fig('xz_woman', 262, 208, {}); S.fig('knight', 160 + Math.sin(S.T * 30) * Math.min(2, t), 216, { tint: '#20c070', ta: H.clamp((t - 1) * 0.3, 0, 0.5) }); } },
        { d: 2.2, sfx: [[0.2, 'shock']], draw: CU('lf_plaza', 'knight', { size: 140, tint: '#0a5a30', ta: 0.45, push: 1.12, fx: S => lighter(S.g, () => glow(S.g, 160, 96, 80, '#40ff90', 0.22 + 0.1 * Math.sin(S.T * 18))) }) },
        { d: 2.4, sub: [[0.3, 'bailu|Всем отойти!']], draw: S => { const t = S.t; S.bg('lf_plaza', S.T); S.fig('knight', 222, 216, { tint: '#20c070', ta: 0.4 }); S.fig('bailu', lerp(-30, 110, eOut(t / 0.7)), 218, {}); if (t < 0.7) speedLines(S.g, 160, 120, 0.5, S.T); } },
        { d: 2.6, sub: [[0.3, 'bailu|Скорее! Дайте ему лекарство и уложите его!']], sfx: [[0.2, 'hit']], draw: S => { const t = S.t, g = S.g; S.bg('lf_plaza', S.T); S.fig('bailu', 150, 218, {}); S.fig('knight', lerp(190, 262, eOut(t / 0.5)), 220, { rot: lerp(0, 1.45, eOut(t / 0.5)), tint: '#20c070', ta: 0.3 }); if (t < 0.25) flash(g, '#c8f0ff', 0.7 * (1 - t / 0.25)); } },
        { d: 3.2, sub: [[0.3, 'bailu|То есть...'], [1.5, 'bailu|Уложите... их всех!']], sfx: [[1.5, 'shock']], draw: S => { const t = S.t; S.bg('lf_plaza', S.T); S.foe('mara', lerp(-30, 56, sm(t / 1.5)), 216, 92, {}); S.foe('mara', lerp(350, 264, sm(t / 1.5)), 216, 92, { flip: true }); S.fig('bailu', 160, 222, {}); } }
      ]
    },

    c_lf_matrix: {
      music: 'mystery',
      shots: [
        { d: 2.6, sub: [[0.3, 'fuxuan|Восстань!']], sfx: [[0.3, 'shield']], draw: S => { const g = S.g, t = S.t; S.bg('lf_matrix', S.T); S.fig('kafka', 160, 216, {}); lighter(g, () => { for (let i = 0; i < 4; i++) ring(g, rgba('#58f0e0', 0.8 - i * 0.15), 2, 160, 120, 20 + i * 28 + t * 30); glow(g, 160, 60, 70 + t * 20, '#7affe8', 0.4); }); } },
        { d: 2.6, sub: [[0.3, 'fuxuan|Ты поэтому здесь?']], draw: CU('lf_matrix', 'fuxuan', { size: 150, push: 1.08, fx: S => lighter(S.g, () => { glow(S.g, 160, 72, 26 + Math.sin(S.T * 6) * 4, '#e0c8ff', 0.7); for (let i = 0; i < 3; i++) ring(S.g, rgba('#e0c8ff', 0.35), 1, 160, 72, 30 + i * 18); }) }) },
        { d: 2.4, sub: [[0.3, 'fuxuan|Ради этого?']], draw: S => { const g = S.g, t = S.t; S.bg('lf_void', S.T); for (let i = 0; i < 40; i++) { const a = hx(i, 3, 2) * 6.28 + t * 0.4, r = 20 + hx(i, 4, 2) * 120; rect(g, rgba('#c8fff4', 0.6), 160 + Math.cos(a) * r, 110 + Math.sin(a) * r * 0.7, 2, 2); } lighter(g, () => glow(g, 160, 110, 40 + t * 24, '#ffffff', 0.6)); } },
        { d: 2.8, sub: [[0.4, 'kafka|А что? Не ожидала?']], draw: TWO('lf_matrix', 'fuxuan', 'kafka') }
      ]
    },

    c_lf_kafka_talk: {
      music: 'mystery',
      shots: [
        { d: 3.2, sub: [[0.4, 'kafka|Знаешь, {name}, даже Эона можно убить.']], draw: CU('lf_void', 'kafka', { size: 150, push: 1.1, tint: '#200a30', ta: 0.2, fx: S => { const g = S.g; lighter(g, () => { glow(g, 60, 60, 40, '#c8a0ff', 0.3); glow(g, 262, 86, 26, '#ff8a60', 0.3); glow(g, 40, 150, 20, '#8ad0ff', 0.3); }); } }) }
      ]
    },

    c_lf_arbor: {
      music: 'mystery',
      shots: [
        { d: 3.2, sfx: [[0.4, 'shock']], draw: S => { const g = S.g, t = S.t, k = sm(t / 2.6), h = lerp(10, 150, k); S.bg('lf_sky', 0); rect(g, 'rgba(36,20,90,0.55)', 0, 0, LW, LH); rect(g, '#2a1a34', 156, 190 - h, 8, h); line(g, '#2a1a34', 4, 160, 190 - h * 0.5, 160 - 50 * k, 190 - h * 0.85); line(g, '#2a1a34', 4, 160, 190 - h * 0.6, 160 + 54 * k, 190 - h * 0.9); for (const [dx, dy, r] of [[-50, 0.85, 24], [0, 1, 32], [54, 0.9, 24]]) { ell(g, '#7a9a50', 160 + dx * k, 190 - h * dy + 2, r * k, r * 0.6 * k); ell(g, '#c8e870', 160 + dx * k, 190 - h * dy, r * k - 1, r * 0.55 * k); } rect(g, '#1a2a68', 0, 190, LW, 50); lighter(g, () => glow(g, 160, 190 - h, 70 * k + 10, '#d8f080', 0.3)); } },
        { d: 2.4, sub: [[0.4, 'kafka|Вперёд, Блэйдик.']], sfx: [[0.2, 'hit']], draw: S => { const g = S.g, t = S.t; S.bg('lf_matrix', S.T); S.fig('knight', lerp(120, 60, eOut(t / 0.4)), 220, { rot: lerp(0, -1.3, eOut(t / 0.4)) }); S.fig('knight', lerp(200, 262, eOut(t / 0.4)), 220, { rot: lerp(0, 1.3, eOut(t / 0.4)) }); S.fig('kafka', 160, 216, {}); if (t < 0.25) flash(g, '#e0c8ff', 0.7 * (1 - t / 0.25)); } },
        { d: 2.2, sfx: [[0.4, 'hit']], draw: S => { const g = S.g, t = S.t; S.bg('lf_matrix', S.T); S.fig('blade', lerp(360, 220, eOut(t / 0.5)), 216, { flip: true, tint: '#40060c', ta: 0.15 }); S.fig('kafka', 130, 216, {}); lighter(g, () => glow(g, lerp(360, 220, eOut(t / 0.5)), 120, 40, '#ff4060', 0.3)); } },
        { d: 2.8, sub: [[0.3, 'kafka|Осталось ещё два места.']], draw: S => { const t = S.t; S.bg('lf_sky', 0); S.g.fillStyle = 'rgba(36,20,90,0.55)'; S.g.fillRect(0, 0, LW, LH); S.fig('kafka', 120, lerp(150, 330, sm((t - 1) / 1.6)), { rot: 0.25 }); S.fig('blade', 210, lerp(130, 330, sm((t - 1.2) / 1.4)), { flip: true, rot: -0.2 }); } }
      ]
    },

    c_lf_xueyi: {
      music: 'mystery',
      shots: [
        { d: 3.2, sub: [[0.3, 'luocha|Ты можешь ощутить дискомфорт или онемение, но больно не будет... Постарайся не двигаться.']], draw: TWO('lf_delve', 'luocha', 'xueyi') },
        { d: 3.0, sub: [[0.3, 'xueyi|Ничего не получится... У меня механическое тело - нет ни плоти, ни крови.']], sfx: [[0.6, 'shield']], draw: CU('lf_delve', 'xueyi', { size: 140, side: 'r', flip: true, fx: S => { const g = S.g; lighter(g, () => { glow(g, 120, 130, 30 + S.t * 18, '#ffe89a', 0.5); for (let i = 0; i < 16; i++) { const a = hx(i, 3, 4) * 6.28 + S.T * 1.4, r = 16 + hx(i, 4, 4) * 60; rect(g, rgba('#fff4b8', 0.8), 120 + Math.cos(a) * r, 130 + Math.sin(a) * r * 0.7, 2, 2); } }); } }) },
        { d: 3.4, sub: [[0.3, 'luocha|Неважно, механика или органика - мы в любом случае имеем дело со сложными веществами.'], [1.9, 'luocha|Надеюсь, ты с пониманием отнесёшься к моим методам...']], draw: CU('lf_delve', 'luocha', { size: 140, side: 'l', push: 1.08 }) }
      ]
    },

    c_lf_deer: {
      music: 'threat',
      shots: [
        { d: 2.8, sub: [[0.3, 'welt|Осторожнее.']], sfx: [[0.3, 'shock']], draw: S => { const g = S.g, t = S.t, k = sm(t / 2.4); S.bg('lf_forge', S.T); for (let i = 0; i < 6; i++) { const x = 70 + i * 36, h = 40 + hx(i, 3, 5) * 70; line(g, '#1a1420', 6, x, 210, 160 + (x - 160) * (1 - k) * 0.7, 210 - h * k); line(g, '#ffd060', 1, x, 210, 160 + (x - 160) * (1 - k) * 0.7, 210 - h * k); } lighter(g, () => glow(g, 160, 170, 30 + k * 50, '#ffd060', 0.3 + k * 0.3)); } },
        { d: 2.8, sub: [[0.3, 'welt|Эта штука меняет форму...']], sfx: [[0.2, 'hit']], draw: S => { const g = S.g, t = S.t, k = sm(t / 1.4); S.bg('lf_forge', S.T); S.foe('ebon', 160, 222, Math.round(lerp(90, 170, k)), { tint: '#000000', ta: 1 - k }); lighter(g, () => glow(g, 160, 150, 70, '#ffd060', 0.26)); if (t < 0.25) flash(g, '#fff4b8', 0.7 * (1 - t / 0.25)); } },
        { d: 2.2, sfx: [[0.3, 'shock']], draw: S => { const g = S.g; S.bg('lf_forge', S.T); S.foe('ebon', 160, 240, 230, {}); lighter(g, () => { glow(g, 78, 92, 16, '#ffd060', 0.7); glow(g, 118, 92, 16, '#ffd060', 0.7); }); } }
      ]
    },

    c_lf_deer_end: {
      music: 'mystery',
      shots: [
        { d: 2.6, sfx: [[0.2, 'hit']], draw: S => { const t = S.t; S.bg('lf_forge', S.T); S.foe('ebon', 160, lerp(222, 232, sm(t / 1.2)), 170, { rot: lerp(0, 0.2, sm(t / 1.2)), tint: '#000000', ta: lerp(0, 0.5, t / 2.6) }); } },
        { d: 3.6, draw: S => { const g = S.g, t = S.t, k = sm(t / 2.8); S.bg('lf_forge', S.T); S.foe('ebon', 160, 232, 170, { a: 1 - k, rot: 0.2, tint: '#7a5a2a', ta: k }); for (let i = 0; i < 70; i++) { const a = hx(i, 3, 6) * 6.28, r = (10 + hx(i, 4, 6) * 150) * k, x = 160 + Math.cos(a) * r + t * 30 * hx(i, 5, 6), y = 170 + Math.sin(a) * r * 0.6 - t * 18 * hx(i, 6, 6); rect(g, rgba(i % 3 ? '#c8843c' : '#e8c860', Math.max(0, 1 - k * 0.5)), x, y, 3, 2); } } }
      ]
    },

    c_lf_reveal: {
      music: 'threat',
      shots: [
        { d: 2.8, sub: [[0.3, 'tingyun|Какая жалость.'], [1.4, 'tingyun|Я бы хотела понаблюдать чуть дольше.']], draw: S => { S.bg('lf_furnace', S.T); S.foe('mara', 214, 224, 118, {}); S.fig('tingyun', 122, 220, {}); } },
        { d: 3.4, sub: [[0.2, 'tingyun|Раз у тебя уже есть дар Изобилия,'], [1.7, 'tingyun|то ты наверняка выдержишь и благословение']], sfx: [[1.7, 'shock']], draw: S => { const g = S.g, k = sm((S.t - 1.5) / 1.6); S.bg('lf_furnace', S.T); S.foe('mara', 214, 224, 118, { a: 1 - k }); S.foe('reaver', 214, 224, Math.round(lerp(110, 136, k)), { a: k, tint: '#a040ff', ta: 0.3 * (1 - k) }); S.fig('tingyun', 156, 220, {}); lighter(g, () => glow(g, 186, 130, 24 + 34 * k, '#c060ff', 0.3 + 0.4 * k)); } },
        { d: 2.2, sub: [[0.4, 'tingyun=???|Разрушения?']], draw: CU('lf_furnace', 'tingyun', { size: 156, push: 1.1, tint: '#2a0a3a', ta: 0.3 }) },
        { d: 1.8, sub: [[0.15, 'march|Госпожа Тинъюнь!']], draw: CU('lf_furnace', 'march', { size: 140, side: 'r', flip: true, push: 1.06 }) },
        { d: 2.6, sfx: [[0.9, 'hit'], [1.1, 'shock']], draw: S => { const g = S.g, t = S.t, snap = sm((t - 0.85) / 0.12); S.bg('lf_furnace', S.T); S.fig('tingyun', 160, 222, { rot: snap * 0.22 }); if (t > 1) { const k = sm((t - 1) / 1.4); lighter(g, () => { glow(g, 160, 118, 20 + 70 * k, '#ff5a20', 0.3 + 0.5 * k); glow(g, 160, 130, 10 + 40 * k, '#ffd060', 0.5 + 0.4 * k); }); for (let i = 0; i < 34; i++) { const n = (S.T * 1.3 + hx(i, 2, 17)) % 1, x = 160 + Math.sin(S.T * 4 + i) * 26 * n * k, y = 150 - n * 150 * k; rect(g, rgba(n < 0.4 ? '#ffe89a' : '#ff6a20', 0.9 * (1 - n)), x, y, 7 - n * 4, 8); } } } },
        { d: 3.0, sfx: [[0.2, 'shock']], draw: S => { const g = S.g, t = S.t, k = sm(t / 1.6); S.bg('lf_furnace', S.T); lighter(g, () => { glow(g, 160, 100, 90 + 40 * k, '#ff4a20', 0.6); glow(g, 160, 110, 50 + 20 * k, '#ffd060', 0.7); }); for (let i = 0; i < 70; i++) { const n = (S.T * 1.1 + hx(i, 3, 19)) % 1, x = 160 + (hx(i, 4, 19) - 0.5) * 90 * (0.4 + n), y = 200 - n * 200; rect(g, rgba(n < 0.3 ? '#fff4b8' : n < 0.6 ? '#ffb040' : '#ff5a20', 0.95 * (1 - n * 0.8)), x, y, 8 - n * 5, 10); } S.fig('tingyun', 160, lerp(222, 256, k), { a: 1 - k, rot: 0.22, tint: '#ff5a20', ta: k }); flash(g, '#ffffff', seg(t, 0, 0.2) < 1 ? 0.5 * (1 - seg(t, 0, 0.2)) : 0); } },
        { d: 3.6, sub: [[0.4, 'phantylia=???|Благодетели,'], [1.7, 'phantylia=???|позвольте представиться ещё раз...']], draw: S => { const g = S.g, k = sm(S.t / 1.2); S.bg('lf_void', S.T); lighter(g, () => { glow(g, 160, 96, 110, '#ff5a20', 0.3 * k); glow(g, 160, 120, 60, '#a040ff', 0.3 * k); }); S.foe('phantylia', 160, 214, 190, { a: k, tint: '#000000', ta: 0.72 }); ell(g, rgba('#ffe89a', k), 146, 88, 3, 2); ell(g, rgba('#ffe89a', k), 174, 88, 3, 2); vignette(g, 0.7); } }
      ]
    },

    c_lf_terrace: {
      music: 'threat',
      shots: [
        { d: 3.4, sfx: [[0.2, 'warp']], draw: S => { S.bg('lf_ocean', S.T); skiff(S.g, lerp(-70, 190, eOut(S.t / 3.4)), 118 + Math.sin(S.T * 2) * 3, 0.9, S.T); } },
        { d: 3.2, draw: S => { const g = S.g; S.bg('lf_ocean', S.T * 2); skiff(g, 160, 120 + Math.sin(S.T * 2) * 3, 1.8, S.T); S.bust('danheng', 116, 112, 34, {}); speedLines(g, S.T, 160, 120, 10, '#ffffff', 0.16, 90); } },
        { d: 3.0, draw: S => { const t = S.t; S.bg('lf_altar', S.T); skiff(S.g, lerp(80, 230, sm(t / 3)), lerp(214, 200, sm(t / 3)), 0.8, S.T); } }
      ]
    },

    c_lf_blade: {
      music: 'threat',
      shots: [
        { d: 2.4, sub: [[0.2, 'blade|Хватит прятаться.']], draw: CU('lf_altar', 'blade', { size: 140, side: 'r', flip: true, tint: '#40060c', ta: 0.2, push: 1.08 }) },
        { d: 2.6, sub: [[0.3, 'blade|Покажи свой'], [1.2, 'blade|истинный облик!']], sfx: [[1.3, 'hit']], draw: S => { const g = S.g, t = S.t, k = eOut((t - 1.1) / 0.3); S.bg('lf_altar', S.T); S.fig('danheng', 130, 220, {}); S.fig('blade', lerp(300, 170, k), 220, { flip: true, tint: '#40060c', ta: 0.15 }); if (t > 1.2) { line(g, '#e0e4ec', 3, 170, 150, 104, 142); lighter(g, () => glow(g, 130, 148, 24 + (t - 1.2) * 20, '#ff4060', 0.5)); } if (t > 1.2 && t < 1.45) flash(g, '#ffffff', 0.7 * (1 - (t - 1.2) / 0.25)); } },
        { d: 3.2, sfx: [[0.3, 'shock'], [1.4, 'warp']], draw: S => { const g = S.g, t = S.t, k = sm((t - 1) / 1.3); S.bg('lf_altar', S.T); lighter(g, () => { for (let i = 0; i < 4; i++) ring(g, rgba('#4ad8c8', 0.7 - i * 0.14), 2, 160, 134, 18 + i * 24 + t * 34); glow(g, 160, 130, 40 + 60 * k, '#7affe8', 0.55); }); for (let i = 0; i < 40; i++) { const a = hx(i, 2, 25) * 6.28 + S.T * 1.6, r = 20 + hx(i, 3, 25) * 80; rect(g, rgba('#c8fff4', 0.8), 160 + Math.cos(a) * r, 130 + Math.sin(a) * r * 0.7, 2, 3); } S.fig('danheng', 160, 220, { a: 1 - k }); S.fig('imbibitor', 160, 220, { a: k }); } },
        { d: 2.2, sub: [[0.2, 'yanqing|Стоять!'], [1.1, 'yanqing|Ты...']], draw: CU('lf_altar', 'yanqing', { size: 136, side: 'l', push: 1.06 }) },
        { d: 3.4, sub: [[0.2, 'blade|Юноша, расскажу подробнее.'], [1.5, 'blade|За твоей спиной стоит грешник, совершивший непростительную мерзость...']], draw: TWO('lf_altar', 'yanqing', 'blade') },
        { d: 3.4, sub: [[0.2, 'blade|Он предал Сяньчжоу и поверг это место в хаос,'], [1.7, 'blade|за что стал вечным изгнанником.']], draw: CU('lf_altar', 'imbibitor', { size: 150, push: 1.08, fx: S => lighter(S.g, () => glow(S.g, 160, 90, 74, '#4ad8c8', 0.16)) }) },
        { d: 3.2, sub: [[0.2, 'blade|Верховный старейшина видьядхара,'], [1.6, 'blade|Пожиратель Луны!']], sfx: [[1.6, 'shock']], draw: CU('lf_altar', 'imbibitor', { size: 172, push: 1.14, fx: S => lighter(S.g, () => { glow(S.g, 160, 80, 90, '#7affe8', 0.22); for (let i = 0; i < 3; i++) ring(S.g, rgba('#7affe8', 0.25), 1, 160, 90, 50 + i * 28 + Math.sin(S.T * 2 + i) * 3); }) }) },
        { d: 2.8, sub: [[0.3, 'blade|Ты что же, считаешь, что лишь Охотники за Стелларонами смогли проникнуть на Сяньчжоу?']], draw: CU('lf_altar', 'blade', { size: 136, side: 'r', flip: true, tint: '#40060c', ta: 0.25 }) },
        { d: 3.0, sub: [[0.3, 'yanqing|В таком случае я заберу вас обоих и передам на суд генералу!']], sfx: [[0.4, 'glint']], draw: S => { const g = S.g; S.bg('lf_altar', S.T); S.fig('yanqing', 160, 222, { s: 1.15 }); for (let i = 0; i < 4; i++) { const a = S.T * 1.4 + i * 1.57, x = 160 + Math.cos(a) * 70, y = 120 + Math.sin(a) * 26; line(g, '#c8f0ff', 2, x, y - 14, x, y + 12); rect(g, '#e0b458', x - 3, y + 12, 7, 2); } lighter(g, () => glow(g, 160, 120, 80, '#a8e0ff', 0.16)); } }
      ]
    },

    c_lf_sea: {
      music: 'mystery',
      shots: [
        { d: 3.0, sfx: [[0.6, 'shock']], draw: S => { const g = S.g, t = S.t; S.bg('lf_ocean', S.T); S.fig('imbibitor', 160, 214, {}); lighter(g, () => { for (let i = 0; i < 4; i++) ring(g, rgba('#7affe8', 0.7 - i * 0.14), 2, 160, 130, 16 + i * 26 + t * 36); glow(g, 160, 120, 40 + t * 22, '#4ad8c8', 0.5); }); for (let i = 0; i < 30; i++) { const a = hx(i, 2, 33) * 6.28 + S.T * 2, r = 20 + hx(i, 3, 33) * 86; rect(g, rgba('#c8fff4', 0.8), 160 + Math.cos(a) * r, 120 + Math.sin(a) * r * 0.6, 2, 3); } } },
        { d: 3.6, sfx: [[0.2, 'warp'], [1.8, 'shock']], draw: S => { const g = S.g, gap = lerp(0, 170, sm(S.t / 3.2)); vgrad(g, 0, LH, [[0, '#0a1a2c'], [1, '#1e3448']]); rect(g, '#34404c', 0, 170, LW, 70); for (let x = 0; x < LW; x += 40) line(g, '#4ac0f0', 1, x, 170, x + (x - 160) * 0.5, 240); for (const side of [-1, 1]) { const x0 = side < 0 ? 0 : 160 + gap, w = 160 - gap; if (w <= 0) continue; rect(g, '#14607e', x0, 0, w, LH); for (let i = 0; i < 22; i++) { const px = x0 + hx(i, 4 + side, 35) * w, y = (hx(i, 5, 35) * LH + S.T * (60 + hx(i, 6, 35) * 90)) % LH; rect(g, rgba(i % 3 ? '#6ad0d8' : '#dcfff8', 0.7), px, y, 2, 16 + hx(i, 7, 35) * 26); } rect(g, '#dcfff8', side < 0 ? x0 + w - 3 : x0, 0, 3, LH); } S.fig('imbibitor', 160, 214, {}); lighter(g, () => glow(g, 160, 130, 44, '#4ad8c8', 0.45)); } },
        { d: 3.6, draw: S => { const g = S.g; vgrad(g, 0, LH, [[0, '#06121e'], [0.5, '#143048'], [1, '#2a4a60']]); rect(g, '#3e4e5c', 90, 120, 140, 120); for (let y = 124; y < 240; y += 10) rect(g, '#566672', 92 - (y - 120) * 0.45, y, 136 + (y - 120) * 0.9, 2); for (const side of [-1, 1]) { poly(g, '#14607e', side < 0 ? [0, 0, 118, 110, 80, 240, 0, 240] : [320, 0, 202, 110, 240, 240, 320, 240]); for (let i = 0; i < 26; i++) { const k = hx(i, 3, 37), y = (hx(i, 4, 37) * 240 + S.T * (40 + k * 70)) % 240, x = side < 0 ? k * (118 - 30 * Math.abs(y - 110) / 130) : 320 - k * (118 - 30 * Math.abs(y - 110) / 130); rect(g, rgba(i % 3 ? '#6ad0d8' : '#dcfff8', 0.65), x, y, 2, 14); } } for (const [x, y, s] of [[112, 150, 1], [208, 150, 1], [130, 118, 0.7], [190, 118, 0.7]]) { rect(g, '#2a3640', x - 5 * s, y, 10 * s, 50 * s); lighter(g, () => glow(g, x, y - 4, 16 * s, '#7affc8', 0.7)); rect(g, '#7affc8', x - 3 * s, y - 12 * s, 6 * s, 12 * s); } lighter(g, () => glow(g, 160, 96, 46, '#e8fff4', 0.5)); S.fig('imbibitor', 160, 226, {}); vignette(g, 0.4); } }
      ]
    },

    c_lf_rootseal: {
      music: 'threat',
      shots: [
        { d: 2.8, sfx: [[1.2, 'shock']], draw: S => { const g = S.g, k = sm(S.t / 2.4); S.bg('lf_rootsbg', S.T); woodDragon(g, S.T); S.fig('imbibitor', 250, 228, {}); lighter(g, () => glow(g, 250, 170, 16 + 44 * k, '#7affe8', 0.3 * k)); } },
        { d: 2.2, sfx: [[0.2, 'warp']], draw: S => { const g = S.g, t = S.t; S.bg('lf_rootsbg', S.T); lighter(g, () => { glow(g, 160, 110, 40 + t * 120, '#e8ffc8', 0.8); for (let i = 0; i < 3; i++) ring(g, rgba('#d8f080', 0.6), 2, 160, 110, 20 + i * 30 + t * 70); }); flash(g, '#ffffff', seg(t, 1.5, 2.2)); } }
      ]
    },

    c_lf_undying: {
      music: 'threat',
      shots: [
        { d: 3.0, sfx: [[0.6, 'shock']], draw: S => { const g = S.g, k = sm(S.t / 2.6); S.bg('lf_rootsbg', S.T); S.fig('tingyun', 160, lerp(226, 170, k), { tint: '#a0c060', ta: 0.3 * k }); for (let i = 0; i < 8; i++) { const x = 90 + i * 20; line(g, '#141608', 6, x, 240, 160 + (x - 160) * (1 - k) * 0.7, lerp(240, 150, k)); line(g, '#d8f080', 1, x, 240, 160 + (x - 160) * (1 - k) * 0.7, lerp(240, 150, k)); } lighter(g, () => glow(g, 160, 150, 30 + 70 * k, '#c8f070', 0.5)); } },
        { d: 3.2, sfx: [[0.2, 'shock'], [1.6, 'hit']], draw: S => { const g = S.g, t = S.t, k = sm(t / 2.8); S.bg('lf_rootsbg', S.T); S.foe('phantylia', 160, lerp(320, 236, k), Math.round(lerp(120, 220, k)), { tint: '#000000', ta: 0.9 - 0.7 * k }); lighter(g, () => glow(g, 160, 110, 50 + 80 * k, '#c8f070', 0.3 + 0.3 * k)); if (t < 0.3) flash(g, '#e8ffc8', 0.6 * (1 - t / 0.3)); } },
        { d: 2.8, draw: S => { const g = S.g; S.bg('lf_rootsbg', S.T); S.foe('phantylia', 160, 240, 236, {}); lighter(g, () => { for (let i = 0; i < 3; i++) ring(g, rgba('#d8f080', 0.3), 1, 160, 110, 70 + i * 26 + Math.sin(S.T * 2 + i) * 3); }); } }
      ]
    },

    c_lf_undying_end: {
      music: 'threat',
      shots: [
        { d: 3.2, sub: [[0.2, 'phantylia|Ха-ха-ха-ха-ха-ха!'], [1.5, 'phantylia|Интересно, если генерал Сяньчжоу станет Рейнджером пустоты,']], sfx: [[0.3, 'shock']], draw: S => { S.bg('lf_rootsbg', S.T); S.foe('phantylia2', 160, 240, 236, {}); S.fig('jingyuan', 160, 226, { tint: '#a040ff', ta: 0.3 }); lighter(S.g, () => glow(S.g, 160, 150, 60, '#a040ff', 0.5)); } },
        { d: 3.0, sub: [[0.2, 'phantylia|погрязнет ли Лофу в хаосе?'], [1.6, 'phantylia|Разрушение так удивительно...']], draw: S => { const g = S.g; S.bg('lf_rootsbg', S.T); S.bust('jingyuan', 160, LOW, 150, { tint: '#3a1060', ta: 0.4 }); lighter(g, () => { for (let i = 0; i < 16; i++) { const a = hx(i, 3, 39) * 6.28 + S.T * 2, r = 30 + hx(i, 4, 39) * 70; rect(g, rgba('#c060ff', 0.8), 160 + Math.cos(a) * r, 110 + Math.sin(a) * r * 0.7, 3, 3); } }); } },
        { d: 2.4, sub: [[0.3, 'jingyuan|Ха-ха...'], [1.2, 'phantylia|Что ты такое?']], draw: CU('lf_rootsbg', 'jingyuan', { size: 156, push: 1.1, tint: '#3a1060', ta: 0.18, fx: S => lighter(S.g, () => glow(S.g, 160, 90, 64, '#ffd060', 0.3)) }) },
        { d: 2.2, sub: [[0.2, 'jingyuan|Дань Хэн! Давай!']], sfx: [[0.3, 'glint']], draw: CU('lf_rootsbg', 'jingyuan', { size: 172, push: 1.14, fx: S => lighter(S.g, () => glow(S.g, 160, 80, 90, '#ffd060', 0.4)) }) },
        { d: 2.6, sfx: [[0.3, 'hit'], [0.6, 'shock']], draw: S => { const g = S.g, t = S.t, k = eOut(t / 0.5); S.bg('lf_rootsbg', S.T); S.foe('phantylia2', 160, 240, 236, { flash: t < 0.8 ? 0.6 : 0 }); S.fig('imbibitor', lerp(-20, 120, k), lerp(90, 200, k), { rot: -0.3 }); line(g, '#7affe8', 4, lerp(-20, 120, k), lerp(90, 200, k) - 60, 180, 120); lighter(g, () => { glow(g, 170, 130, 30 + t * 60, '#7affe8', 0.7); glow(g, 150, 130, 20 + t * 40, '#ffd060', 0.6); }); if (t < 0.25) flash(g, '#ffffff', 0.8 * (1 - t / 0.25)); } },
        { d: 3.4, sub: [[0.2, 'phantylia|Неплохо, генерал Охоты.'], [1.7, 'phantylia|Я утратила лишь плоть, созданную походя,']], draw: S => { const g = S.g, k = sm(S.t / 3.2); S.bg('lf_rootsbg', S.T); S.foe('phantylia2', 160, lerp(240, 300, k), 236, { a: 1 - k * 0.7, tint: '#000000', ta: 0.5 }); for (let i = 0; i < 40; i++) { const a = hx(i, 3, 41) * 6.28, r = (10 + hx(i, 4, 41) * 150) * k; rect(g, rgba(i % 2 ? '#a040ff' : '#d8f080', 1 - k * 0.6), 160 + Math.cos(a) * r, 120 + Math.sin(a) * r * 0.7 - k * 30, 3, 3); } } },
        { d: 3.2, sub: [[0.2, 'phantylia|...и ты!'], [1.0, 'phantylia|Долго ли ещё продержишься?'], [2.1, 'phantylia|Разрушение Сяньчжоу близко.']], draw: S => { S.bg('lf_void', S.T); lighter(S.g, () => glow(S.g, 160, 110, 70, '#ff5a20', 0.3)); S.fig('tingyun', 160, 214, { a: 0.55 + 0.1 * Math.sin(S.T * 5), tint: '#ff5a20', ta: 0.5 }); } },
        { d: 5.0, sub: [[0.2, 'jingyuan|Прочь,'], [1.0, 'jingyuan|Слуга Разрушения.'], [2.1, 'jingyuan|И передай Легиону,'], [3.1, 'jingyuan|месть Охоты'], [3.9, 'jingyuan|настигнет.']], draw: CU('lf_rootsbg', 'jingyuan', { size: 150, push: 1.08, fx: S => lighter(S.g, () => glow(S.g, 160, 90, 70, '#ffe89a', 0.22)) }) }
      ]
    },

    c_lf_digest: {
      music: 'foresight',
      shots: [
        { d: 2.6, sub: [[0.2, 'fuxuan|Бедствие Стелларона,']], sfx: [[0.3, 'shock']], draw: S => { const g = S.g; S.bg('lf_void', S.T); lighter(g, () => { glow(g, 160, 110, 70 + Math.sin(S.T * 4) * 6, '#ff3040', 0.6); for (let i = 0; i < 12; i++) { const a = i * 0.524 + S.T * 0.4; line(g, rgba('#ff6040', 0.7), 2, 160, 110, 160 + Math.cos(a) * 90, 110 + Math.sin(a) * 70); } }); ell(g, '#1a0408', 160, 110, 18, 18); ring(g, '#ff9060', 2, 160, 110, 20); } },
        { d: 2.6, sub: [[0.2, 'fuxuan|восстание Учеников Санктус Медикус,']], draw: S => { S.bg('lf_furnace', S.T); S.foe('danshu', 160, 228, 170, {}); S.foe('mara', 62, 232, 110, { tint: '#000000', ta: 0.3 }); S.foe('mara', 262, 232, 110, { tint: '#000000', ta: 0.3, flip: true }); } },
        { d: 2.6, sub: [[0.2, 'fuxuan|возрождение Древа,']], sfx: [[0.4, 'warp']], draw: S => { const g = S.g, k = sm(S.t / 2.2); S.bg('lf_rootsbg', S.T); line(g, '#141608', 26, 160, 240, 160, 100); line(g, '#3a3e24', 18, 160, 240, 160, 100); for (const [x, y, w] of [[60, 50, 10], [110, 26, 8], [210, 26, 8], [260, 50, 10], [40, 100, 7], [280, 100, 7]]) { const ex = lerp(160, x, k), ey = lerp(120, y, k); line(g, '#141608', w + 3, 160, 130, ex, ey); line(g, '#5e6236', w, 160, 130, ex, ey); lighter(g, () => glow(g, ex, ey, 14, '#d8f080', 0.5)); } } },
        { d: 3.4, sub: [[0.2, 'fuxuan|а вдобавок к этому и вторжение'], [1.6, 'fuxuan|Легиона Антиматерии на Лофу...']], sfx: [[0.3, 'hit']], draw: S => { const g = S.g; S.bg('lf_ocean', S.T); S.foe('reaver', 76, 232, 130, {}); S.foe('reaver', 244, 232, 130, { flip: true }); S.foe('phantylia2', 160, 240, 200, { a: 0.92 }); lighter(g, () => glow(g, 160, 120, 90, '#a040ff', 0.22)); } }
      ]
    },

    c_lf_ceremony: {
      music: 'serene',
      shots: [
        { d: 4.2, draw: S => { const g = S.g, k = sm(S.t / 3.8); S.bg('lf_skyharbor', S.T); const y = lerp(190, 110, k); skiff(g, 160, y, 0.6, S.T); rect(g, '#f4efe2', 158, y - 22, 4, 12); poly(g, '#3a6ad0', [160, y - 40, 170, y - 30, 160, y - 22, 150, y - 30]); line(g, '#f4efe2', 1, 160, y - 22, 160, y - 12); lighter(g, () => glow(g, 160, y, 26, '#ffd890', 0.45)); for (const x of [40, 80, 120, 200, 240, 280]) S.fig(x % 80 ? 'xz_woman' : 'xz_man', x, 240, { s: 0.45, a: 0.9, tint: '#0c1030', ta: 0.6 }); } },
        { d: 4.6, draw: S => { const g = S.g, T = S.T; S.bg('lf_skyharbor', T); for (let i = 0; i < 26; i++) { const k = (hx(i, 1, 45) + S.t * (0.05 + 0.03 * hx(i, 2, 45))) % 1, x = 30 + hx(i, 3, 45) * 260 + Math.sin(T + i) * 6, y = 200 - k * 190, r = 1 + (1 - k) * 2; rect(g, rgba('#ffe8b0', 1 - k * 0.7), x, y, r, r); lighter(g, () => glow(g, x, y, 5 + (1 - k) * 8, '#ffc060', 0.3 * (1 - k))); } } },
        { d: 4.0, draw: CU('lf_skyharbor', 'yukong', { side: 'l', size: 148, push: 1.05, fx: S => lighter(S.g, () => { const k = sm(S.t / 3.6); glow(S.g, lerp(250, 270, k), lerp(70, 34, k), 8, '#ffe8b0', 0.8 * (1 - k * 0.6)); }) }) },
        { d: 4.4, draw: S => { const g = S.g, k = sm(S.t / 4); S.bg('lf_skyharbor', S.T); S.fig('yukong', 80, 232, { s: 0.7, tint: '#0c1030', ta: 0.45 }); lighter(g, () => glow(g, 220, 60, 12 - 8 * k, '#ffe8b0', 0.9 - 0.8 * k)); } }
      ]
    },

    c_lf_prison: {
      music: 'mystery',
      shots: [
        { d: 2.8, sub: [[0.2, 'jingyuan|Сюда входят'], [1.0, 'jingyuan|лишь тюремщики'], [1.9, 'jingyuan|и узники.']], draw: S => { S.bg('lf_prison', S.T); S.fig('luocha', 160, 214, { flip: true }); S.fig('jingyuan', 268, 226, {}); } },
        { d: 3.0, sub: [[0.2, 'jingyuan|Кем будешь ты?'], [1.2, 'luocha|Ни тем ни другим. Я всего лишь заплутавший странник.']], draw: TWO('lf_prison', 'jingyuan', 'luocha') },
        { d: 4.6, sub: [[0.2, 'jingyuan|Каков спектакль! Стелларон, Древо амброзии, Ученики Санктус Медикус, Лорд Опустошитель...'], [2.2, 'jingyuan|В череде опасностей'], [3.0, 'jingyuan|почти удалось отвлечь внимание']], draw: CU('lf_prison', 'jingyuan', { side: 'l', size: 148, push: 1.06 }) },
        { d: 4.2, sub: [[0.2, 'jingyuan|от краеугольного вопроса...'], [1.3, 'jingyuan|Те, кто принёс Стелларон на Сяньчжоу...'], [2.6, 'jingyuan|Что ими движило?']], draw: CU('lf_prison', 'jingyuan', { side: 'l', size: 164, push: 1.08 }) },
        { d: 4.0, sub: [[0.2, 'jingyuan|Сдашься ли ты,'], [1.2, 'jingyuan|или получишь по заслугам,'], [2.4, 'jingyuan|Мерзость Яоши?']], sfx: [[2.4, 'shock']], draw: S => { const g = S.g; S.bg('lf_prison', S.T); S.fig('luocha', 160, 214, { flip: true }); lighter(g, () => glow(g, 160, 120, 40 + S.t * 18, '#ffd060', 0.25)); } },
        { d: 4.4, sub: [[0.2, 'luocha|Генерал, вы правы - источником моей силы является Изобилие.'], [2.1, 'luocha|Но я таков же, как вы.'], [3.2, 'luocha|Мы оба враги Яоши.']], draw: CU('lf_prison', 'luocha', { side: 'r', flip: true, size: 150, push: 1.06, fx: S => lighter(S.g, () => glow(S.g, 224, 110, 54, '#ffe8a0', 0.2)) }) },
        { d: 3.4, sub: [[0.2, 'jingliu|Так точно, генерал.'], [1.5, 'jingliu|Не стойте у нас на пути.']], sfx: [[0.2, 'glint']], draw: S => { const g = S.g; S.bg('lf_prison', S.T); lighter(g, () => { glow(g, 160, 60, 60, '#9ad8ff', 0.3); line(g, rgba('#c8f0ff', 0.8), 2, 80, 0, 200, 240); }); S.fig('jingliu', 160, 226, {}); } },
        { d: 5.0, sub: [[0.2, 'jingliu|Воскрешение Древа амброзии - дурной знак.'], [1.9, 'jingliu|Пришла пора для Сяньчжоу избрать новый Путь.'], [3.4, 'jingliu|Повелитель Небесной Дуги, Творительница Чумы, Творитель Руин...']], draw: CU('lf_prison', 'jingliu', { size: 150, push: 1.06, fx: S => lighter(S.g, () => glow(S.g, 160, 90, 64, '#9ad8ff', 0.18)) }) },
        { d: 4.6, sub: [[0.2, 'jingliu|Это шахматная партия Эонов.'], [1.4, 'jingliu|Если ты не с победителями - ты проиграешь.'], [2.8, 'jingliu|На этот раз']], draw: CU('lf_prison', 'jingliu', { size: 166, push: 1.08, fx: S => lighter(S.g, () => glow(S.g, 160, 90, 74, '#9ad8ff', 0.22)) }) },
        { d: 2.8, sub: [[0.3, 'jingliu|мы уложим Изобилие в могилу.']], sfx: [[1.4, 'glint']], draw: S => { const g = S.g, t = S.t; S.bg('lf_prison', S.T); S.fig('jingliu', 110, 226, {}); S.fig('luocha', 214, 214, { flip: true }); lighter(g, () => glow(g, 160, 110, 30 + t * 30, '#c8f0ff', 0.3)); flash(g, '#000000', seg(t, 1.9, 2.8)); } }
      ]
    },

    c_lf_luocha: {
      music: 'mystery',
      shots: [
        { d: 2.6, sfx: [[0.3, 'heal']], sub: [[0.3, 'sushang|А?']], draw: S => { const g = S.g; S.bg('lf_sky', S.T); rect(g, '#8a93a0', 0, 170, LW, 70); S.fig('danheng', 96, 214, {}); S.fig('sushang', 140, 216, {}); lighter(g, () => glow(g, 118, 150, 60 + S.t * 30, '#ffe4a0', 0.5)); for (let i = 0; i < 14; i++) { const y = 200 - ((S.T * 30 + i * 13) % 100); rect(g, rgba('#fff0b0', 0.7), 90 + hx(i, 2, 9) * 60, y, 2, 2); } } },
        { d: 3.2, draw: S => { const g = S.g, t = S.t; S.bg('lf_sky', S.T); rect(g, '#8a93a0', 0, 170, LW, 70); rect(g, '#2a1e18', lerp(300, 214, eOut(t / 2)), 96, 34, 118); rect(g, '#c8a050', lerp(300, 214, eOut(t / 2)) + 4, 100, 26, 4); rect(g, '#c8a050', lerp(300, 214, eOut(t / 2)) + 4, 206, 26, 4); S.fig('luocha', lerp(280, 190, eOut(t / 2)), 216, { flip: true }); } }
      ]
    },

    c_lf_skiff: {
      music: 'express',
      shots: [
        { d: 2.6, sfx: [[0.2, 'warp']], draw: S => { S.bg('lf_sky', S.T); skiff(S.g, lerp(-60, 170, eOut(S.t / 2.6)), 136 + Math.sin(S.T * 2) * 3, 1.2, S.T); } },
        { d: 2.4, draw: S => { S.bg('lf_sky', S.T * 2); skiff(S.g, 160, 120 + Math.sin(S.T * 3) * 4, 1.9, S.T); speedLines(S.g, S.T, 160, 120, 14, '#ffffff', 0.25, 90); S.bust('tingyun', 112, 118, 34, {}); } },
        { d: 2.4, draw: S => { const g = S.g, t = S.t; S.bg('lf_sky', S.T); for (let i = 0; i < 3; i++) { const x = 60 + i * 96; rect(g, '#e6e2d4', x, 150, 70, 60); poly(g, '#3e444c', [x - 8, 150, x + 12, 132, x + 58, 132, x + 78, 150]); rect(g, '#c4482e', x - 8, 150, 86, 3); } skiff(g, lerp(100, 240, sm(t / 2.4)), lerp(80, 136, sm(t / 2.4)), lerp(1.4, 0.7, sm(t / 2.4)), S.T); } }
      ]
    }
  };

  Object.assign(H.Cine.CINES, CINES);

  function worldStill(id, cx, cy, actors) {
    let cv = null;
    return S => {
      if (!cv) {
        const G = H.Gfx, L = H.mapLayout(id), map = { id, def: L.def, w: L.w, h: L.h, tiles: L.tiles, ents: [] }, TS = G.TS;
        cv = G.mkCanvas(640, 480);
        const c = cv.getContext('2d'), px = cx * TS - 320, py = cy * TS - 240;
        G.drawMap(c, map, px, py, 0, 640, 480);
        const draws = actors.map(([who, x, y, dir]) => ({ y, fn: () => G.drawSprite(c, G.lookOf(who, S.game), dir, 0, x * TS - px, y * TS - py) }));
        for (const sp of G.mapLayer(map).sprites || []) if (!sp.if) draws.push({ y: sp.sort, fn: () => H.Train.drawSprite(c, sp, sp.x * TS - px, sp.y * TS - py, 0) });
        draws.sort((a, b) => a.y - b.y).forEach(d => d.fn());
      }
      S.g.drawImage(cv, 0, 0, LW, LH);
    };
  }
  Object.assign(H.Cine.STILLS, {
    lf_seat: worldStill('lf_seat', 10.5, 7, [['jingyuan', 10, 4, 'down'], ['fuxuan', 8, 7, 'up'], ['yanqing', 13, 7, 'up']]),
    lf_jade: worldStill('lf_sanctum', 14, 9, [['qingque', 13, 8, 'down'], ['xz_woman', 12, 10, 'right'], ['xz_man', 14, 11, 'up']]),
    lfs_cloud: worldStill('lf_cloud', 23, 60, []),
    lfs_haven: worldStill('lf_haven', 34, 20, []),
    lfs_astrum: worldStill('lf_astrum', 13, 12, []),
    lfs_navalia: worldStill('lf_navalia', 40, 8, []),
    lfs_sanctum: worldStill('lf_sanctum', 22, 18, []),
    lfs_divination: worldStill('lf_divination', 25, 28, []),
    lfs_matrix: worldStill('lf_matrix', 23, 20, []),
    lfs_artisan: worldStill('lf_artisan', 17, 22, []),
    lfs_delve: worldStill('lf_delve', 11, 9, []),
    lfs_alchemy: worldStill('lf_alchemy', 28, 34, []),
    lfs_evemist: worldStill('lf_evemist', 26, 18, []),
    lfs_terrace: worldStill('lf_terrace', 13, 7.5, []),
    lfs_scale: worldStill('lf_scale', 52, 17, []),
    lfs_roots: worldStill('lf_roots', 14, 11, []),
    lfs_alley: worldStill('lf_alley', 13, 9, [])
  });
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
