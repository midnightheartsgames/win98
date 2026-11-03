(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit;
  const { LW, LH, hx, lerp, sm, eOut, seg, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring } = K;
  const TW = 160, TH = 120, POWER = 0.35, SWITCH = 0.3, OSD = 1.3;
  const SHOWS = {};

  function caption(g, s, x, y, o = {}) {
    g.font = (o.italic ? 'italic ' : '') + (o.bold === false ? '' : 'bold ') + (o.size || 16) + 'px Arial, sans-serif';
    g.textAlign = o.align || 'left'; g.textBaseline = 'top';
    if (o.shadow !== false) { g.fillStyle = o.shadow || '#000000'; g.fillText(s, x + 2, y + 2); }
    g.fillStyle = o.col || '#ffffff'; g.fillText(s, x, y);
  }

  function textWidth(g, s, size) {
    g.font = 'bold ' + size + 'px Arial, sans-serif';
    const m = g.measureText(s);
    return (m && m.width) || s.length * size * 0.6;
  }

  function ticker(g, s, y, h, t, speed, bg, col) {
    rect(g, bg, 0, y, LW, h);
    const w = textWidth(g, s, h - 4) + 40, x0 = -((t * speed) % w);
    for (let x = x0; x < LW; x += w) caption(g, s, x, y + 2, { size: h - 4, col, shadow: false });
  }

  const osds = new Map();
  function osd(ch) {
    let d = osds.get(ch);
    if (d) return d;
    const cv = G.mkCanvas(TW, TH), g = cv.getContext('2d');
    g.font = 'bold 15px "Courier New", monospace'; g.textAlign = 'right'; g.textBaseline = 'top';
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { g.fillStyle = '#002000'; g.fillText(ch, TW - 12 + dx, 8 + dy); }
    g.fillStyle = '#48ff60'; g.fillText(ch, TW - 12, 8);
    d = g.getImageData(0, 0, TW, TH).data;
    osds.set(ch, d);
    return d;
  }

  function skyline(g, y0, seed, col, win) {
    for (let i = 0; i < 22; i++) {
      const w = 12 + Math.floor(hx(i, seed, 1) * 14), x = i * 15 - 6 + Math.floor(hx(i, seed, 2) * 6), h = 30 + Math.floor(hx(i, seed, 3) * 60);
      rect(g, col, x, y0 - h, w, h + 60);
      for (let r = 0; r < h / 7 - 1; r++) for (let c = 0; c < w / 5 - 1; c++) if (hx(i * 31 + c, r, seed) > 0.62) rect(g, win, x + 2 + c * 5, y0 - h + 4 + r * 7, 2, 3);
    }
  }

  function fan(g, x, y, s, hair, shirt, ears) {
    ell(g, shirt, x, y + 16 * s, 15 * s, 12 * s);
    ell(g, hair, x, y, 9 * s, 10 * s);
    if (ears) for (const d of [-1, 1]) { poly(g, '#f4f2f6', [x + d * 3 * s, y - 7 * s, x + d * 10 * s, y - 20 * s, x + d * 10 * s, y - 5 * s]); poly(g, '#f2a0b8', [x + d * 5 * s, y - 8 * s, x + d * 9 * s, y - 15 * s, x + d * 9 * s, y - 7 * s]); }
  }

  function cosplayer(g, x, y, t) {
    poly(g, '#3ab8b0', [x - 13, y - 50, x + 13, y - 50, x + 17, y - 6, x - 17, y - 6]);
    rect(g, '#d8d4e0', x - 5, y - 48, 10, 30);
    rect(g, '#20202a', x - 9, y - 8, 7, 8); rect(g, '#20202a', x + 2, y - 8, 7, 8);
    ell(g, '#f2d8c8', x, y - 60, 8, 9);
    ell(g, '#4a3a5a', x, y - 64, 10, 8); rect(g, '#4a3a5a', x - 10, y - 64, 20, 22);
    ell(g, '#f2d8c8', x, y - 58, 6, 6);
    for (const d of [-1, 1]) poly(g, '#4a3a5a', [x + d * 3, y - 70, x + d * 11, y - 82, x + d * 10, y - 66]);
    g.save(); g.translate(x + 16, y - 30); g.rotate(-0.5 + Math.sin(t * 3) * 0.08); rect(g, '#b08850', -2, -34, 4, 40); rect(g, '#d8c070', -6, 4, 12, 3); g.restore();
  }

  function bruiser(g, x, y, t, i, hold) {
    const bob = Math.round(Math.sin(t * 2 + i * 1.3) * 1.5), u = y - 34 + bob;
    poly(g, '#26304c', [x - 18, y, x + 18, y, x + 16, y - 36, x - 16, y - 36]);
    for (let k = 0; k < 3; k++) rect(g, '#1a2238', x - 10 + k * 9, y - 32, 2, 32);
    poly(g, '#44567e', [x - 20, u, x + 20, u, x + 25, u - 34, x - 25, u - 34]);
    ell(g, '#44567e', x, u - 33, 25, 7);
    poly(g, '#e8e4dc', [x - 7, u - 38, x + 7, u - 38, x, u - 24]);
    rect(g, '#c89878', x - 5, u - 44, 10, 7);
    ell(g, '#d8a888', x, u - 52, 11, 12);
    ell(g, '#1a1a1e', x, u - 60, 12, 6);
    rect(g, '#f4f4f0', x - 12, u - 59, 24, 3);
    rect(g, '#2a1a14', x - 5, u - 52, 3, 2); rect(g, '#2a1a14', x + 2, u - 52, 3, 2);
    if (hold) {
      rect(g, '#3a4a70', x - 22, u - 28, 8, 18); rect(g, '#3a4a70', x + 14, u - 28, 8, 18);
      rect(g, '#0e0e12', x - 12, u - 20, 24, 14); rect(g, ['#e8c040', '#f2f2f6', '#c8303a'][i % 3], x - 9, u - 17, 18, 6);
      rect(g, '#c89878', x - 15, u - 14, 5, 5); rect(g, '#c89878', x + 10, u - 14, 5, 5);
    }
  }

  function foxfire(g, x, y, s, t, a) {
    if (a <= 0) return;
    lighter(g, () => glow(g, x, y, 22 * s, '#5ab8ff', 0.6 * a));
    const f = Math.sin(t * 9) * 2 * s;
    poly(g, rgba('#a8e0ff', a), [x - 7 * s, y + 6 * s, x + 7 * s, y + 6 * s, x + 4 * s, y - 6 * s, x + f, y - 18 * s, x - 4 * s, y - 6 * s]);
    poly(g, rgba('#f0fbff', a), [x - 3 * s, y + 4 * s, x + 3 * s, y + 4 * s, x + f * 0.5, y - 8 * s]);
  }

  SHOWS.miyabi = [
    {
      key: 'news', ch: '06', len: 2.6, light: '#9060ff',
      fx: { noise: 0.06, ghost: 0.22, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#0a0820'], [0.55, '#2a1440'], [1, '#120a1c']]);
        const cx = 228, cy = 112, R = 66 + Math.sin(t * 2.2) * 2, cut = seg(t, 1.05, 1.3), heal = seg(t, 1.3, 2.4);
        lighter(g, () => glow(g, cx, cy, R * 1.6, '#a040ff', 0.4 * (1 - heal * 0.7)));
        ell(g, '#05030a', cx, cy, R * (1 - heal * 0.25), R * 0.9 * (1 - heal * 0.25));
        for (let i = 0; i < 5; i++) ring(g, rgba('#6a30b0', 0.45 * (1 - heal)), 1, cx, cy, R * (0.25 + 0.14 * i + 0.04 * Math.sin(t * 3 + i)));
        ring(g, rgba('#d080ff', 0.8 * (1 - heal * 0.8)), 3, cx, cy, R * (1 - heal * 0.25));
        skyline(g, 186, 11, '#0c0a16', rgba('#ffd890', 0.75));
        rect(g, '#14121e', 30, 166, 100, 40); rect(g, '#2a2638', 30, 164, 100, 3);
        G.drawFigure(g, X.look, 84, 166, 1);
        if (cut > 0) {
          const fade = 1 - seg(t, 1.3, 2.0), x1 = lerp(104, 312, cut), y1 = lerp(150, 50, cut);
          lighter(g, () => { glow(g, x1, y1, 26, '#9ad8ff', 0.7 * fade); line(g, rgba('#b8ecff', fade), 6, 104, 150, x1, y1); });
          line(g, rgba('#ffffff', fade), 2, 104, 150, x1, y1);
        }
        if (heal > 0) lighter(g, () => glow(g, cx, cy, 90, '#e8f6ff', 0.5 * (1 - heal)));
        rect(g, '#c81e28', 10, 10, 112, 20); ell(g, Math.floor(t * 2) % 2 ? '#ffffff' : '#ff9090', 21, 20, 4, 4);
        caption(g, 'ПРЯМОЙ ЭФИР', 30, 13, { size: 13, shadow: false });
        rect(g, '#0c1e5a', 0, 182, LW, 30); rect(g, '#e8c040', 0, 182, 8, 30);
        caption(g, 'ОХОТНИЦА КАВЕРН В ДЕЛЕ', 16, 186, { size: 18 });
        ticker(g, 'СЕКЦИЯ 6 · КАВЕРНА В ДЕЛОВОМ КВАРТАЛЕ ЗАКРЫТА · ХОСИМИ МИЯБИ ·', 212, 18, t, 70, '#e8e8f0', '#10142a');
      }
    },
    {
      key: 'fanclub', ch: 'AV', len: 2.8, light: '#ffb0a0',
      fx: { noise: 0.08, chroma: 1, wobble: 0.8, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.3) * 3), Math.round(Math.sin(t * 1.7 + 1) * 2));
        vgrad(g, -10, LH + 10, [[0, '#3a2232'], [1, '#5a3a40']], -10, LW + 20);
        rect(g, '#e85a8a', 14, 6, 230, 30); rect(g, '#ff8ab0', 14, 6, 230, 3);
        caption(g, 'ФАН-КЛУБ МИЯБИ', 129, 11, { size: 20, align: 'center', col: '#fff4f8', shadow: '#8a2a4a' });
        line(g, '#2a1a20', 1, -10, 42, LW + 10, 42);
        for (let i = 0; i < 18; i++) poly(g, ['#e8c040', '#2a8a86', '#f2f2f6'][i % 3], [i * 19, 42, i * 19 + 12, 42, i * 19 + 6, 52]);
        lighter(g, () => glow(g, 160, 110, 100, '#fff0d0', 0.4));
        rect(g, '#6a4a3a', 30, 166, 260, 6); rect(g, '#2a1a20', 30, 172, 260, 20);
        G.drawFigure(g, X.look, 128, 168, 1.25);
        cosplayer(g, 200, 168, t);
        if (t > 1.2) { const k = eOut(seg(t, 1.2, 1.4)); caption(g, '?', 150, 58 - 6 * k, { size: 24, col: rgba('#ffffff', k) }); }
        for (let i = 0; i < 8; i++) {
          const x = 14 + i * 42, y = 216 + (i % 2) * 5, wave = Math.sin(t * 6 + i * 1.7);
          if (i % 3 !== 1) { line(g, '#f2d8c8', 4, x + 8, y + 6, x + 14 + wave * 6, y - 26); lighter(g, () => line(g, rgba(i % 2 ? '#40f0e0' : '#ff70b0', 0.9), 3, x + 14 + wave * 6, y - 26, x + 17 + wave * 9, y - 42)); }
          fan(g, x, y, 1.3, ['#2a1a14', '#16161c', '#5a3a20'][i % 3], ['#3a3a58', '#5a2a3a', '#2a4a3a'][i % 3], i % 2 === 0);
        }
        for (let i = 0; i < 3; i++) { const p = (t * 1.3 + i * 0.37) % 1; if (p < 0.08) lighter(g, () => glow(g, 40 + hx(i, Math.floor(t * 1.3), 7) * 240, 70 + hx(Math.floor(t * 1.3), i, 7) * 80, 50, '#ffffff', 0.8)); }
        g.restore();
        caption(g, 'ДОСТОВЕРНЫЙ КОСПЛЕЙ!', 160, 176, { size: 19, align: 'center', col: '#ffe840' });
        caption(g, '► PLAY', 12, LH - 26, { size: 16 });
        caption(g, '0:47:' + String(12 + Math.floor(t)).padStart(2, '0'), LW - 12, LH - 26, { size: 16, align: 'right' });
      }
    },
    {
      key: 'rental', ch: '21', len: 2.6, light: '#ffc060',
      fx: { noise: 0.05, chroma: 1, wobble: 0.3, hum: 1 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#0a0e1e'], [1, '#1a1a30']]);
        rect(g, '#3a3442', 0, 28, LW, 176);
        rect(g, '#14101a', 16, 36, 200, 34);
        const neon = hx(Math.floor(t * 9), 2, 51) > 0.86 ? 0.35 : 1;
        lighter(g, () => glow(g, 116, 53, 90, '#ff5aa8', 0.3 * neon));
        caption(g, 'ВИДЕОПРОКАТ', 116, 42, { size: 22, align: 'center', col: rgba('#ffb0d8', neon), shadow: rgba('#ff3a90', 0.8 * neon) });
        rect(g, '#ffe0a0', 16, 80, 150, 96);
        for (let r = 0; r < 4; r++) { rect(g, '#8a6a4a', 16, 102 + r * 22, 150, 2); for (let c = 0; c < 24; c++) rect(g, ['#c8303a', '#2a5a9a', '#e8c040', '#2a2a30', '#3a8a5a'][Math.floor(hx(c, r, 52) * 5)], 20 + c * 6, 84 + r * 22, 4, 17); }
        lighter(g, () => glow(g, 90, 128, 80, '#ffd890', 0.25));
        rect(g, '#4a3a2a', 176, 92, 36, 112); rect(g, '#ffe8b0', 182, 98, 24, 50);
        rect(g, '#4a4450', 0, 204, LW, 36);
        lighter(g, () => glow(g, 200, 180, 130, '#ffd890', 0.28));
        G.drawFigure(g, X.look, 160, 206, 0.95);
        g.save(); g.translate(176, 152); g.rotate(-0.2); rect(g, '#f4f4f0', -6, -8, 14, 18); rect(g, '#c8303a', -4, -5, 10, 3); g.restore();
        const walk = eOut(seg(t, 0.4, 2.0));
        for (let i = 0; i < 3; i++) bruiser(g, 236 + i * 34, 218, t, i, true);
        bruiser(g, lerp(LW + 40, 236 + 3 * 34, walk), 218 - Math.round(Math.abs(Math.sin(t * 9)) * (1 - walk) * 3), t, 3, true);
        rect(g, '#e8c040', 0, 222, LW, 18);
        caption(g, 'КАССЕТЫ НАПРОКАТ · ВСЮ НОЧЬ', 160, 224, { size: 14, align: 'center', col: '#1a1408', shadow: false });
        caption(g, 'РЕКЛАМА', 14, 10, { size: 12, col: '#c8c8d0' });
      }
    },
    {
      key: 'letter', ch: '', len: 3.4, light: '#ffb070',
      fx: { noise: 0.025, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, LH, [[0, '#1a2440'], [0.6, '#3a4a6a'], [1, '#8a9ab8']]);
        for (let i = 0; i < 9; i++) poly(g, '#16203a', [i * 40 - 10, 120, i * 40 + 12, 60 + hx(i, 1, 53) * 30, i * 40 + 34, 120]);
        rect(g, '#16203a', 0, 118, LW, 20);
        rect(g, '#3a4250', 96, 26, 128, 160); rect(g, '#4a5262', 100, 30, 120, 152);
        rect(g, '#eef4fc', 96, 22, 128, 7);
        for (let i = 0; i < 6; i++) ell(g, '#eef4fc', 104 + i * 22, 29, 7, 3 + (i % 2) * 2);
        for (let i = 0; i < 5; i++) rect(g, '#2e3440', 130, 56 + i * 18, 60, 3);
        rect(g, '#2e3440', 76, 180, 168, 24); rect(g, '#eef4fc', 76, 178, 168, 5);
        const fl = 0.85 + 0.1 * Math.sin(t * 7) + 0.05 * Math.sin(t * 13.3);
        rect(g, '#2a2a30', 34, 150, 22, 36); rect(g, '#3a3a44', 30, 146, 30, 5); rect(g, '#ffd080', 39, 158, 12, 14);
        lighter(g, () => glow(g, 45, 165, 50 * fl, '#ffb860', 0.55));
        for (const [x, c] of [[108, '#f2f0f4'], [118, '#f6c8d4'], [126, '#f2f0f4'], [252, '#e8a8b8'], [260, '#f2f0f4']]) { line(g, '#3a6a3a', 2, x, 196, x + 2, 170); ell(g, c, x + 2, 168, 6, 5); ell(g, rgba('#ffffff', 0.6), x, 166, 2, 2); }
        g.save(); g.translate(186, 168); g.rotate(-0.1);
        rect(g, '#c8c0b0', -46, -28, 94, 60); rect(g, '#f4f0e6', -48, -30, 94, 60);
        line(g, '#d8d0c0', 1, -48, -30, -1, 2); line(g, '#d8d0c0', 1, 46, -30, -1, 2);
        caption(g, 'Матушке', -36, 4, { size: 18, italic: true, bold: false, col: '#2a3a5a', shadow: false });
        g.rotate(0.28); g.strokeStyle = '#c8303a'; g.lineWidth = 2; g.strokeRect(6, -30, 40, 15);
        caption(g, 'ВОЗВРАТ', 26, -28, { size: 9, align: 'center', col: '#c8303a', shadow: false });
        g.restore();
        K.snowfall(g, t, 60, 7, { speed: 14, wind: -5 });
        foxfire(g, 160 + Math.sin(t * 1.1) * 6, 112 + Math.sin(t * 2) * 4, 1.1, t, seg(t, 1.4, 2.2));
      }
    }
  ];

  function paperStack(g, x, y, n, w) {
    for (let i = 0; i < n; i++) rect(g, i % 2 ? '#d8d4cc' : '#f2f0ea', x + (hx(i, x, 61) - 0.5) * 3, y - i * 3, w, 3);
  }

  function carnation(g, x, y, col, s) {
    line(g, '#3a6a3a', 2 * s, x, y + 10 * s, x + 1, y + 34 * s);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; ell(g, col, x + Math.cos(a) * 4 * s, y + Math.sin(a) * 3 * s, 4 * s, 3.4 * s); }
    ell(g, G.light(col, 0.3), x, y - 1, 3 * s, 2.4 * s);
  }

  function glasses(g, x, y, glint) {
    g.strokeStyle = '#2a2a32'; g.lineWidth = 2;
    g.strokeRect(x - 22, y - 7, 18, 12); g.strokeRect(x + 4, y - 7, 18, 12);
    line(g, '#2a2a32', 2, x - 4, y - 2, x + 4, y - 2);
    line(g, '#2a2a32', 2, x - 22, y - 5, x - 34, y + 4); line(g, '#2a2a32', 2, x + 22, y - 5, x + 30, y + 6);
    rect(g, rgba('#c8e0ff', 0.25), x - 21, y - 6, 16, 10); rect(g, rgba('#c8e0ff', 0.25), x + 5, y - 6, 16, 10);
    if (glint > 0) lighter(g, () => { glow(g, x + 13, y - 2, 18, '#c070ff', 0.8 * glint); line(g, rgba('#f0d8ff', glint), 1, x + 7, y - 4, x + 19, y); });
  }

  function soukaku(g, x, y, bun) {
    poly(g, '#9a9a9a', [x - 16, y, x + 16, y, x + 12, y - 38, x - 12, y - 38]);
    rect(g, '#7a7a7a', x - 16, y - 6, 32, 6);
    ell(g, '#f2f2f2', x, y - 48, 13, 13);
    rect(g, '#f2f2f2', x - 13, y - 48, 26, 18);
    ell(g, '#c8c8c8', x + 4, y - 44, 7, 6);
    ell(g, '#5a5a5a', x + 8, y - 58, 9, 7);
    poly(g, '#5a5a5a', [x + 2, y - 62, x + 5, y - 78, x + 8, y - 62]); poly(g, '#5a5a5a', [x + 10, y - 62, x + 16, y - 76, x + 16, y - 58]);
    if (bun) { ell(g, '#d8d8d8', x + 18, y - 28, 7, 6); ell(g, '#ffffff', x + 16, y - 30, 3, 2); }
  }

  SHOWS.yanagi = [
    {
      key: 'interview', ch: '03', len: 2.8, light: '#90b0ff',
      fx: { noise: 0.05, ghost: 0.14, chroma: 1, wobble: 0.3 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#1a2a5a'], [1, '#0a1430']]);
        for (let i = 0; i < 4; i++) ring(g, rgba('#4a6ab0', 0.5 - i * 0.1), 6, 160, 110, 40 + i * 26);
        lighter(g, () => { for (const x of [40, 160, 280]) glow(g, x, 0, 60, '#e8f0ff', 0.35); });
        rect(g, '#2a1414', 92, 6, 136, 24); caption(g, 'АПЛОДИСМЕНТЫ', 160, 10, { size: 15, align: 'center', col: '#7a3a3a', shadow: false });
        G.drawFigure(g, X.look, 116, 196, 1.4);
        ell(g, '#0a0a10', 268, 168, 34, 40); ell(g, '#14141c', 262, 126, 20, 22);
        rect(g, '#c8ccd8', 20, 160, 210, 30); rect(g, '#e8ecf4', 20, 158, 210, 4);
        rect(g, '#2a2a32', 150, 140, 3, 20); ell(g, '#3a3a44', 151, 138, 4, 5);
        rect(g, '#0c1e5a', 0, 178, 230, 22); rect(g, '#d8b050', 0, 178, 6, 22);
        caption(g, 'ЦУКИСИРО ЯНАГИ · СЕКЦИЯ 6', 12, 181, { size: 15 });
        rect(g, 'rgba(0,0,0,0.75)', 0, 204, LW, 36);
        const sub = t < 1.4 ? ['«Спасательным кругом', 'был пончик».'] : ['«Это была шутка.', 'Почему вы не смеётесь?..»'];
        sub.forEach((s, i) => caption(g, s, 160, 206 + i * 16, { size: 14, align: 'center', col: '#ffffff' }));
      }
    },
    {
      key: 'film', ch: 'AV', len: 2.8, light: '#e0c890',
      fx: { noise: 0.06, chroma: 1, wobble: 0.5 },
      paint(g, t) {
        const f = Math.floor(t * 18), weave = Math.round((hx(f, 1, 63) - 0.5) * 2);
        g.save(); g.translate(0, weave);
        if (t < 0.9) {
          rect(g, '#1a140c', 0, -4, LW, LH + 8);
          g.strokeStyle = '#c8b088'; g.lineWidth = 2; g.strokeRect(30, 40, 260, 150);
          caption(g, 'ВЫБОР ЗАМ. КОМАНДИРА', 160, 54, { size: 16, align: 'center', col: '#c8b088', shadow: false });
          caption(g, 'ЧАЙНИК', 160, 90, { size: 40, align: 'center', col: '#f2e2c0', shadow: '#4a3a20' });
          caption(g, 'авторское кино · 3 ч 40 мин', 160, 148, { size: 15, align: 'center', col: '#c8b088', shadow: false, bold: false });
        } else {
          vgrad(g, -4, 150, [[0, '#6a5a44'], [1, '#8a7656']], 0, LW);
          rect(g, '#b8a47e', 196, 24, 90, 76); rect(g, '#5a4a36', 196, 24, 90, 4); rect(g, '#5a4a36', 239, 24, 4, 76); rect(g, '#5a4a36', 196, 60, 90, 4);
          ell(g, '#d8c8a0', 70, 50, 16, 16); line(g, '#3a2e20', 2, 70, 50, 70, 40); line(g, '#3a2e20', 2, 70, 50, 70 + Math.sin(t * 0.05) * 8, 52);
          vgrad(g, 150, LH + 4, [[0, '#4a3c2a'], [1, '#2a2218']], 0, LW);
          rect(g, '#3a2e20', 0, 148, LW, 4);
          ell(g, '#2a2218', 160, 168, 46, 6);
          ell(g, '#5a4c3a', 160, 140, 38, 30); ell(g, '#7a6a52', 152, 130, 18, 12); rect(g, '#3a2e20', 140, 104, 40, 6); ell(g, '#3a2e20', 160, 104, 8, 4);
          g.strokeStyle = '#3a2e20'; g.lineWidth = 4; g.beginPath(); g.arc(160, 116, 30, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
          poly(g, '#5a4c3a', [194, 140, 214, 118, 220, 122, 200, 148]);
          for (let i = 0; i < 4; i++) { const ph = (t * 0.25 + i / 4) % 1; ell(g, rgba('#e8dcc0', 0.5 * (1 - ph)), 220 + Math.sin(ph * 6 + i) * 6 + ph * 10, 112 - ph * 70, 4 + ph * 10, 3 + ph * 6); }
          caption(g, '...', 160, 206, { size: 18, align: 'center', col: '#f2e2c0' });
        }
        g.restore();
        for (let i = 0; i < 3; i++) if (hx(f, i, 64) > 0.5) rect(g, rgba('#f2e8d0', 0.5), Math.floor(hx(i, f, 65) * LW), 0, 1, LH);
        for (let i = 0; i < 6; i++) if (hx(f, i, 66) > 0.6) ell(g, rgba('#0a0806', 0.7), hx(i, f, 67) * LW, hx(f, i, 68) * LH, 1 + hx(i, f, 69) * 2, 1 + hx(f, i, 70) * 2);
        rect(g, rgba('#000000', 0.15 * hx(f, 9, 71)), 0, 0, LW, LH);
        caption(g, '► PLAY', 12, LH - 26, { size: 16 });
      }
    },
    {
      key: 'cctv', ch: '12', len: 2.8, light: '#90ffa8',
      fx: { noise: 0.09, wobble: 0.3, hum: 1 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#4a4a4a'], [1, '#2a2a2a']]);
        rect(g, '#3a3a3a', 0, 0, LW, 70); rect(g, '#5a5a5a', 0, 70, LW, 3);
        ell(g, '#e8e8e8', 200, 36, 14, 14); ell(g, '#3a3a3a', 200, 36, 12, 12); line(g, '#e8e8e8', 2, 200, 36, 200, 28); line(g, '#e8e8e8', 2, 200, 36, 206, 40);
        poly(g, '#6a6a6a', [20, 150, 300, 150, 270, 110, 50, 110]);
        poly(g, '#4a4a4a', [20, 150, 300, 150, 300, 160, 20, 160]);
        paperStack(g, 64, 116, 12, 30); paperStack(g, 98, 114, 8, 26); paperStack(g, 214, 114, 14, 30); paperStack(g, 248, 116, 9, 28);
        G.drawFigure(g, X.look, 170, 150, 1.05);
        rect(g, '#2a2a2a', 140, 112, 50, 30); rect(g, '#a8a8a8', 144, 116, 42, 22);
        for (let i = 0; i < 4; i++) rect(g, '#5a5a5a', 148, 120 + i * 4, 8 + Math.floor(hx(i, Math.floor(t * 6), 72) * 28), 1);
        lighter(g, () => glow(g, 165, 128, 40, '#ffffff', 0.25));
        rect(g, '#8a8a8a', 22, 168, 54, 14); for (let i = 0; i < 4; i++) ell(g, '#c8c8c8', 30 + i * 12, 166, 5, 4);
        const sneak = seg(t, 0.2, 2.2), x = lerp(-20, 64, sneak), got = t > 2.2;
        if (got) ell(g, '#8a8a8a', 66, 166, 5, 4);
        soukaku(g, got ? 64 - (t - 2.2) * 30 : x, 204, got);
        g.globalCompositeOperation = 'saturation'; rect(g, '#808080', 0, 0, LW, LH);
        g.globalCompositeOperation = 'multiply'; rect(g, '#b8ffc8', 0, 0, LW, LH);
        g.globalCompositeOperation = 'source-over';
        caption(g, 'КАМ 06 · ОФИС СЕКЦИИ 6', 12, 10, { size: 13, col: '#e8ffe8' });
        if (Math.floor(t * 2) % 2) { ell(g, '#ff3030', 18, LH - 17, 5, 5); caption(g, 'REC', 28, LH - 25, { size: 14, col: '#e8ffe8' }); }
        caption(g, '03:12:' + String(40 + Math.floor(t * 3)).padStart(2, '0'), LW - 12, LH - 25, { size: 15, align: 'right', col: '#e8ffe8' });
      }
    },
    {
      key: 'desk', ch: '', len: 3.4, light: '#ffc8a0',
      fx: { noise: 0.025, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, 120, [[0, '#f0a890'], [0.6, '#ffd8a8'], [1, '#fff0d0']]);
        for (let i = 0; i < 12; i++) rect(g, '#6a5048', 0, 6 + i * 10, LW, 4);
        rect(g, '#4a3830', 0, 0, LW, 6);
        poly(g, '#7a5a44', [0, 120, LW, 120, LW, LH, 0, LH]);
        for (let i = 0; i < 5; i++) poly(g, rgba('#ffe0b0', 0.18), [40 + i * 60, 120, 70 + i * 60, 120, 40 + i * 60, LH, 10 + i * 60, LH]);
        rect(g, '#d8d0c8', 24, 92, 26, 34); rect(g, '#a8c8d8', 26, 96, 22, 28);
        const cols = ['#d83048', '#f2a0b0', '#f6f2f4', '#e8607a', '#c82838'];
        for (let i = 0; i < 14; i++) carnation(g, 20 + i * 21 + hx(i, 1, 73) * 8, 70 + hx(i, 2, 73) * 30 + Math.sin(t * 1.2 + i) * 1.2, cols[i % cols.length], 1.2);
        for (const [x, w] of [[30, 44], [262, 40]]) { poly(g, '#e8e4d8', [x, 128, x + w, 128, x + w - 8, 104, x + 8, 104]); rect(g, '#c8303a', x + 4, 116, w - 8, 3); }
        g.save(); g.translate(120, 176); g.rotate(-0.06);
        rect(g, '#d8d0c0', -52, -32, 106, 70); rect(g, '#fbf8ee', -54, -34, 106, 70);
        poly(g, '#3a5ac8', [-30, -8, -16, 28, -44, 28]); ell(g, '#f2c8a8', -30, -16, 9, 9); rect(g, '#e88a8a', -40, -26, 20, 6);
        g.strokeStyle = '#1a1a2a'; g.lineWidth = 2; g.strokeRect(-37, -19, 6, 4); g.strokeRect(-29, -19, 6, 4);
        poly(g, '#e8607a', [10, 4, 20, 28, 0, 28]); ell(g, '#f2c8a8', 10, -2, 7, 7); rect(g, '#d8d8e0', 3, -9, 14, 5);
        poly(g, '#c8303a', [4, -8, 6, -20, 9, -8]); poly(g, '#c8303a', [12, -8, 16, -19, 17, -7]);
        caption(g, 'НАГИ', 26, -28, { size: 18, col: '#e8402a', shadow: false });
        g.restore();
        ell(g, '#e8e4dc', 268, 176, 18, 6); rect(g, '#e8e4dc', 250, 156, 36, 20); ell(g, '#a87a4a', 268, 156, 17, 4);
        for (let i = 0; i < 3; i++) { const ph = (t * 0.4 + i / 3) % 1; ell(g, rgba('#ffffff', 0.35 * (1 - ph)), 266 + Math.sin(ph * 5 + i) * 4, 150 - ph * 26, 3 + ph * 4, 2 + ph * 3); }
        glasses(g, 236, 200, seg(t, 1.8, 2.1) * (1 - seg(t, 2.4, 3.0)));
      }
    }
  ];

  function speedLines(g, x, y, t, col, n) {
    for (let i = 0; i < n; i++) {
      const a = hx(i, 1, 74) * Math.PI * 2, r0 = 40 + ((hx(i, 2, 74) * 200 + t * 300) % 200), r1 = r0 + 30 + hx(i, 3, 74) * 60;
      line(g, col, 1 + Math.floor(hx(i, 4, 74) * 3), x + Math.cos(a) * r0, y + Math.sin(a) * r0, x + Math.cos(a) * r1, y + Math.sin(a) * r1);
    }
  }

  function hero(g, x, y, t) {
    const sway = Math.sin(t * 10) * 3;
    poly(g, '#8a1420', [x - 6, y - 50, x + 4, y - 50, x - 46 + sway, y - 10, x - 40 + sway, y + 6]);
    poly(g, '#d8263a', [x - 14, y - 52, x + 14, y - 52, x + 10, y - 14, x - 10, y - 14]);
    poly(g, '#f2c040', [x - 10, y - 46, x + 10, y - 46, x, y - 30]);
    poly(g, '#2a2a3a', [x - 10, y - 14, x - 2, y - 14, x - 14, y + 18, x - 24, y + 14]);
    poly(g, '#2a2a3a', [x + 2, y - 14, x + 10, y - 14, x + 26, y + 6, x + 18, y + 12]);
    ell(g, '#f2f2f6', x, y - 62, 11, 11); poly(g, '#3aa8f0', [x - 9, y - 64, x + 11, y - 66, x + 9, y - 58, x - 7, y - 58]);
    poly(g, '#f2c040', [x - 4, y - 72, x, y - 86, x + 4, y - 72]);
    line(g, '#d8263a', 6, x + 12, y - 48, x + 40, y - 70);
    lighter(g, () => { glow(g, x + 48, y - 78, 30, '#80e0ff', 0.7); line(g, '#c8f4ff', 4, x + 40, y - 70, x + 110, y - 140); });
  }

  function trainSketch(g, x, y, j) {
    const L = (x0, y0, x1, y1) => line(g, '#3a3a42', 3, x0 + j(1), y0 + j(2), x1 + j(3), y1 + j(4));
    L(x, y, x + 70, y); L(x + 70, y, x + 76, y - 20); L(x + 76, y - 20, x + 40, y - 30); L(x + 40, y - 30, x, y - 30); L(x, y - 30, x, y);
    L(x + 46, y - 30, x + 46, y - 44); L(x + 46, y - 44, x + 58, y - 44); L(x + 58, y - 44, x + 58, y - 26);
    for (let i = 0; i < 3; i++) { g.strokeStyle = '#3a3a42'; g.lineWidth = 3; g.beginPath(); g.arc(x + 14 + i * 20 + j(5 + i), y + 4, 6, 0, Math.PI * 2); g.stroke(); }
    L(x - 70, y, x - 4, y); L(x - 70, y - 26, x - 4, y - 26); L(x - 70, y, x - 70, y - 26);
    g.lineWidth = 3; for (let i = 0; i < 3; i++) g.strokeRect(x - 64 + i * 20 + j(9 + i), y - 20, 12, 9);
  }

  SHOWS.welt = [
    {
      key: 'arahato', ch: '08', len: 2.6, light: '#ff8a60',
      fx: { noise: 0.13, ghost: 0.3, chroma: 2, wobble: 0.7 },
      paint(g, t) {
        if (t < 1.5) {
          vgrad(g, 0, LH, [[0, '#f2a030'], [1, '#d8402a']]);
          speedLines(g, 150, 130, t, '#fff2d0', 46);
          lighter(g, () => glow(g, 150, 130, 110, '#ffffff', 0.35));
          hero(g, 140 + t * 14, 170 - t * 6, t);
          caption(g, 'ДО ПОСЛЕДНЕЙ ЗВЕЗДЫ!', 160, 204, { size: 18, align: 'center', col: '#ffffff', shadow: '#5a1010' });
        } else {
          const k = eOut(seg(t, 1.5, 1.8));
          vgrad(g, 0, LH, [[0, '#1a1a4a'], [1, '#3a1a5a']]);
          speedLines(g, 160, 100, t * 0.3, rgba('#f2c040', 0.6), 30);
          g.save(); g.translate(160, 96); g.scale(lerp(2.4, 1, k), lerp(2.4, 1, k));
          poly(g, '#f2c040', [0, -50, 12, -14, 50, -14, 18, 8, 30, 46, 0, 22, -30, 46, -18, 8, -50, -14, -12, -14]);
          caption(g, 'АРАХАТО', 0, -14, { size: 34, align: 'center', col: '#d8263a', shadow: '#f2f2f6' });
          g.restore();
          caption(g, 'СЕРИЯ 26', 160, 160, { size: 18, align: 'center', col: rgba('#f2f2f6', k) });
        }
      }
    },
    {
      key: 'homevideo', ch: 'AV', len: 2.8, light: '#c080ff',
      fx: { noise: 0.08, chroma: 1, wobble: 0.8, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.1) * 3), Math.round(Math.sin(t * 1.5 + 2) * 2));
        vgrad(g, -10, 150, [[0, '#4a2a22'], [1, '#6a4030']], -10, LW + 20);
        for (const x of [20, 120, 220]) { rect(g, '#2a1810', x, 24, 80, 64); rect(g, '#0a0a20', x + 4, 28, 72, 56); for (let i = 0; i < 6; i++) rect(g, '#e8f0ff', x + 4 + ((hx(i, x, 75) * 72 + t * 60) % 72), 30 + hx(x, i, 75) * 50, 2, 1); }
        rect(g, '#5a2a24', -10, 150, LW + 20, 100); rect(g, '#7a3a30', -10, 150, LW + 20, 4);
        const bx = 166, by = 104;
        lighter(g, () => glow(g, bx, by, 56, '#a050ff', 0.7));
        ell(g, '#05030a', bx, by, 13, 13); ring(g, rgba('#d0a0ff', 0.9), 3, bx, by, 16 + Math.sin(t * 8));
        [['#f2f2f6', 0], ['#c8a060', 2.1], ['#3a6ad8', 4.2]].forEach(([c, a0], i) => { const a = a0 + t * 2.4, x = bx + Math.cos(a) * 46, y = by + Math.sin(a) * 16; if (i === 2) rect(g, c, x - 10, y - 7, 20, 14); else { rect(g, c, x - 7, y - 8, 14, 16); ell(g, '#ffffff', x, y - 8, 7, 3); } });
        G.drawFigure(g, X.look, 136, 200, 1.25);
        G.drawFigure(g, X.lookOf('march'), 250, 204, 1.15, { flip: true });
        g.restore();
        caption(g, '«Господин Янг просто невероятен!»', 160, 206, { size: 15, align: 'center', col: '#ffe840' });
        if (Math.floor(t * 2) % 2) { ell(g, '#ff3030', 18, 18, 5, 5); caption(g, 'REC', 28, 10, { size: 15 }); }
      }
    },
    {
      key: 'linetest', ch: '24', len: 2.8, light: '#f2eee2',
      fx: { noise: 0.04, wobble: 0.3, hum: 0.6 },
      paint(g, t) {
        const f = Math.floor(t * 8), j = k => (hx(f, k, 76) - 0.5) * 1.6;
        rect(g, '#f2eee2', 0, 0, LW, LH);
        for (const x of [130, 160, 190]) ell(g, '#c8c4b8', x, 12, x === 160 ? 5 : 8, 4);
        for (let i = 0; i < 14; i++) { const x = hx(i, 1, 77) * LW, y = 30 + hx(i, 2, 77) * 150; line(g, '#9aa8c8', 1, x - 3, y, x + 3, y); line(g, '#9aa8c8', 1, x, y - 3, x, y + 3); }
        line(g, '#9ab8e0', 1, 0, 150, LW, 120);
        g.save(); g.translate(210 + j(20), 100 + Math.sin(t * 1.5) * 4); g.rotate(0.3 + t * 0.08);
        g.strokeStyle = '#3a3a42'; g.lineWidth = 3; g.scale(1.4, 1.4);
        g.beginPath(); g.moveTo(-26, 0); g.lineTo(-10, -12); g.lineTo(26, -8); g.lineTo(30, 4); g.lineTo(-10, 10); g.closePath(); g.stroke();
        g.strokeRect(-4, -6, 10, 6); line(g, '#3a3a42', 2, -30, 2, -40 + j(21), 4);
        g.restore();
        const train = lerp(-120, 80, sm(seg(t, 0.8, 2.4)));
        trainSketch(g, train, 160, j);
        for (let i = 0; i < 4; i++) { const ph = (t * 0.8 + i / 4) % 1; g.strokeStyle = '#6a6a72'; g.lineWidth = 2; g.beginPath(); g.arc(train + 52 - ph * 30, 112 - ph * 26, 4 + ph * 8, 0, Math.PI * 2); g.stroke(); }
        caption(g, 'ЛАЙН-ТЕСТ', 12, 24, { size: 17, col: '#c8303a', shadow: false });
        caption(g, '«Где кончается одно приключение...»', 160, 198, { size: 16, align: 'center', col: '#3a3a42', shadow: false });
        caption(g, 'сц. 3 · кадр ' + String(f).padStart(3, '0'), LW - 12, LH - 22, { size: 15, align: 'right', col: '#3a5ac8', shadow: false });
      }
    },
    {
      key: 'album', ch: '', len: 3.4, light: '#ffb070',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, 110, [[0, '#0a0a20'], [1, '#1a1a3a']]);
        for (let i = 0; i < 30; i++) { const x = (hx(i, 1, 78) * LW + t * 40 * (0.5 + hx(i, 2, 78))) % LW; rect(g, rgba('#e8f0ff', 0.5 + 0.5 * hx(i, 3, 78)), x, 6 + hx(i, 4, 78) * 96, 3, 1); }
        rect(g, '#3a2418', 0, 0, LW, 6); rect(g, '#3a2418', 0, 104, LW, 8); rect(g, '#3a2418', 156, 0, 8, 110);
        vgrad(g, 110, LH, [[0, '#5a3424'], [1, '#3a2016']]);
        lighter(g, () => glow(g, 40, 120, 80, '#ffc070', 0.35));
        poly(g, '#e8e0cc', [40, 130, 160, 124, 160, 226, 44, 232]); poly(g, '#f2ecd8', [160, 124, 280, 130, 276, 232, 160, 226]);
        line(g, '#b8ac90', 2, 160, 124, 160, 226);
        for (const [x, y] of [[74, 154], [118, 162], [92, 196]]) { ring(g, '#6a6a72', 1, x, y, 10); line(g, '#6a6a72', 1, x - 12, y + 24, x, y + 11); line(g, '#6a6a72', 1, x, y + 11, x + 12, y + 24); }
        g.save(); g.beginPath(); g.rect(172, 140, 94, 72); g.clip();
        vgrad(g, 140, 212, [[0, '#f0a050'], [0.6, '#f8d090'], [1, '#c87040']], 172, 94);
        ell(g, '#fff0c0', 220, 186, 14, 14);
        for (let i = 0; i < 9; i++) { const h = 14 + hx(i, 1, 79) * 26; rect(g, '#6a3a2a', 172 + i * 11, 212 - h, 10, h); }
        for (let i = 0; i < 3; i++) { const x = 186 + ((t * 10 + i * 30) % 90), y = 156 + i * 6; line(g, '#5a2a1a', 1, x - 3, y - 2, x, y); line(g, '#5a2a1a', 1, x, y, x + 3, y - 2); }
        g.restore();
        g.strokeStyle = '#8a7a5a'; g.lineWidth = 1; g.strokeRect(172, 140, 94, 72);
        caption(g, 'дом', 176, 214, { size: 14, italic: true, bold: false, col: '#5a4a3a', shadow: false });
        g.save(); g.translate(140, 214); g.rotate(-0.5); rect(g, '#2a2a30', -30, -2, 60, 4); poly(g, '#e8c890', [30, -2, 38, 0, 30, 2]); g.restore();
        line(g, '#1e1e24', 4, 296, 236, 306, 70);
        const gl = 0.5 + 0.5 * Math.sin(t * 2);
        lighter(g, () => glow(g, 306, 66, 24, '#a070ff', 0.3 + 0.3 * gl));
        poly(g, '#d8b050', [306, 52, 310, 62, 320, 64, 312, 70, 314, 80, 306, 74, 298, 80, 300, 70, 292, 64, 302, 62]);
      }
    }
  ];

  function sawBlade(g, x, y, r, col, rot) {
    const pts = [];
    for (let i = 0; i < 24; i++) { const a = rot + i / 24 * Math.PI * 2, rr = i % 2 ? r : r * 0.82; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    poly(g, col, pts);
    ell(g, '#000000', x, y, r * 0.22, r * 0.22);
  }

  function chalk(g, pts, k, col, w) {
    const n = Math.max(1, Math.floor((pts.length / 2 - 1) * k));
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 1; i <= n; i++) g.lineTo(pts[i * 2], pts[i * 2 + 1]);
    g.stroke(); g.lineCap = 'butt';
  }

  const ROUTE = (() => {
    const p = [];
    for (let i = 0; i <= 40; i++) { const u = i / 40, a = Math.PI * (1.15 - 1.5 * u); p.push(110 + Math.cos(a) * (40 + u * 30) + u * u * 150, 120 + Math.sin(a) * (34 + u * 10) - u * u * 40); }
    return p;
  })();

  SHOWS.himeko = [
    {
      key: 'coffee', ch: '05', len: 2.8, light: '#ffb060',
      fx: { noise: 0.07, ghost: 0.2, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#5a3020'], [1, '#2a1610']]);
        lighter(g, () => glow(g, 150, 100, 120, '#ffc070', 0.3));
        caption(g, 'КОФЕ ОТ ХИМИКО', 128, 10, { size: 22, align: 'center', col: '#ffe0a0', shadow: '#3a1a0a' });
        rect(g, '#3a2418', 0, 170, LW, 70); rect(g, '#6a4430', 0, 168, LW, 4);
        G.drawFigure(g, X.look, 74, 176, 1.25);
        rect(g, '#2a2a30', 104, 62, 26, 30); poly(g, '#2a2a30', [130, 70, 142, 78, 130, 82]); rect(g, '#d8b050', 104, 60, 26, 4);
        const pour = seg(t, 0.3, 0.6) * (1 - seg(t, 2.0, 2.3));
        if (pour > 0) line(g, '#1a0c06', 3, 141, 80, 146, 132);
        ell(g, '#e8e4dc', 146, 160, 20, 5); rect(g, '#f2f0ea', 132, 132, 28, 26); ell(g, '#f2f0ea', 146, 158, 14, 4);
        ell(g, '#1a0c06', 146, 132, 13, 3);
        for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; ell(g, rgba('#ffffff', 0.4 * (1 - ph)), 146 + Math.sin(ph * 6 + i) * 5, 124 - ph * 36, 3 + ph * 5, 2 + ph * 3); }
        G.drawFigure(g, X.lookOf('danheng'), 252, 176, 1.2, { flip: true });
        if (t > 1.3) { const k = eOut(seg(t, 1.3, 1.5)); rect(g, rgba('#f2f2f6', k), 200, 40, 104, 26); poly(g, rgba('#f2f2f6', k), [244, 66, 256, 66, 250, 74]); caption(g, '«Неплохо.»', 252, 45, { size: 15, align: 'center', col: rgba('#1a1a22', k), shadow: false }); }
        rect(g, '#14100a', 0, 200, LW, 40); rect(g, '#d8b050', 0, 200, LW, 2);
        caption(g, 'ТОЛЬКО ЧЁРНЫЙ', 160, 204, { size: 17, align: 'center', col: '#ffe0a0' });
        caption(g, 'чем горше, тем лучше', 160, 222, { size: 13, align: 'center', col: '#c8a878', bold: false });
      }
    },
    {
      key: 'lecture', ch: '02', len: 2.8, light: '#80c0a0',
      fx: { noise: 0.06, chroma: 1, wobble: 0.3, hum: 0.8 },
      paint(g, t) {
        rect(g, '#3a2a1a', 0, 0, LW, LH);
        vgrad(g, 8, 200, [[0, '#24483a'], [1, '#1a3a2e']], 8, 304);
        for (let i = 0; i < 20; i++) ell(g, rgba('#ffffff', 0.04), hx(i, 1, 80) * LW, 20 + hx(i, 2, 80) * 170, 20, 6);
        caption(g, 'Динамика межзвёздной', 18, 12, { size: 17, col: '#f2f2ea', shadow: false });
        caption(g, 'навигации', 18, 32, { size: 17, col: '#f2f2ea', shadow: false });
        ell(g, '#f2e8a0', 70, 118, 12, 12);
        g.strokeStyle = rgba('#f2f2ea', 0.7); g.lineWidth = 1.5; g.beginPath(); g.ellipse(70, 118, 44, 34, 0, 0, Math.PI * 2); g.stroke();
        const pa = t * 1.2; ell(g, '#a8d8f0', 70 + Math.cos(pa) * 44, 118 + Math.sin(pa) * 34, 5, 5);
        for (const [x, y] of [[264, 64], [286, 92], [250, 104]]) { line(g, '#f2f2ea', 2, x - 5, y, x + 5, y); line(g, '#f2f2ea', 2, x, y - 5, x, y + 5); }
        chalk(g, ROUTE, seg(t, 0.3, 2.2), '#f2e8a0', 3);
        caption(g, 'Δv = v₂ − v₁', 40, 164, { size: 16, col: '#f2f2ea', shadow: false, bold: false });
        caption(g, 'грав. манёвр', 210, 156, { size: 15, col: '#c8e8d8', shadow: false });
        rect(g, '#5a4a3a', 8, 196, 304, 6); rect(g, '#f2f2ea', 60, 194, 14, 3);
        rect(g, '#0c2a5a', 0, 212, LW, 28); rect(g, '#d8b050', 0, 212, 6, 28);
        caption(g, 'УЧЕБНЫЙ КАНАЛ · ЛЕКЦИЯ 1', 14, 216, { size: 16 });
      }
    },
    {
      key: 'xray', ch: '11', len: 2.8, light: '#60a0ff',
      fx: { noise: 0.08, chroma: 1, wobble: 0.3 },
      paint(g, t) {
        rect(g, '#04060c', 0, 0, LW, LH);
        for (let i = 0; i < 12; i++) rect(g, '#10182a', ((i * 30 - t * 40) % 360 + 360) % 360 - 20, 188, 2, 30);
        rect(g, '#1a2238', 0, 186, LW, 3); rect(g, '#1a2238', 0, 218, LW, 3);
        const sx = lerp(340, 70, eOut(seg(t, 0, 0.8)));
        g.save(); g.translate(sx, 0);
        g.strokeStyle = '#f0a040'; g.lineWidth = 3; g.strokeRect(0, 70, 180, 112); g.strokeRect(70, 56, 40, 14);
        rect(g, rgba('#f0a040', 0.12), 0, 70, 180, 112);
        sawBlade(g, 46, 120, 30, '#3ad0c0', t * 0.3);
        rect(g, '#2a8ad8', 90, 84, 70, 10); ell(g, '#2a8ad8', 162, 89, 9, 9); ell(g, '#04060c', 166, 89, 4, 4);
        rect(g, '#2a8ad8', 94, 150, 56, 18); rect(g, '#3ad0c0', 98, 154, 48, 10);
        const sat = t > 1.1, bx = sat ? 120 + Math.sin(t * 5) * 22 : 120, by = sat ? 124 + Math.cos(t * 7) * 10 : 124;
        rect(g, '#e8e060', bx - 8, by - 6, 16, 12); rect(g, '#3a8af0', bx - 26, by - 4, 16, 8); rect(g, '#3a8af0', bx + 10, by - 4, 16, 8); line(g, '#e8e060', 1, bx, by - 6, bx + 4, by - 14);
        g.restore();
        caption(g, 'ДОСМОТР БАГАЖА', 12, 12, { size: 16, col: '#c8d8f0' });
        if (t > 1.2 && Math.floor(t * 4) % 2) { rect(g, '#c8202a', 70, 34, 180, 22); caption(g, 'ОБЪЕКТ ДВИЖЕТСЯ', 160, 37, { size: 15, align: 'center', col: '#ffffff', shadow: false }); }
        caption(g, 'ВЛАДЕЛЕЦ: ХИМИКО', 12, LH - 22, { size: 16, col: '#c8d8f0' });
      }
    },
    {
      key: 'shore', ch: '', len: 3.6, light: '#90a8ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, 130, [[0, '#04061a'], [1, '#1a2a5a']]);
        for (let i = 0; i < 50; i++) rect(g, rgba('#e8f0ff', 0.3 + 0.6 * hx(i, 1, 81)), hx(i, 2, 81) * LW, hx(i, 3, 81) * 120, 1, 1);
        const fall = [0.5, 1.0, 1.5, 1.9, 2.1, 2.25, 2.35];
        fall.forEach((t0, i) => { const k = seg(t, t0, t0 + 0.5); if (k > 0 && k < 1) { const x = 60 + i * 34 + k * 60, y = 10 + i * 4 + k * 70; lighter(g, () => { line(g, rgba('#ffe8c0', 1 - k * 0.5), i < 3 ? 4 : 2, x, y, x - 34, y - 34); glow(g, x, y, i < 3 ? 12 : 7, '#fff2d0', 0.9 * (1 - k * 0.5)); }); } });
        const flash = seg(t, 2.6, 2.75) * (1 - seg(t, 2.8, 3.5));
        lighter(g, () => glow(g, 230, 128, 120, '#ffffff', 0.9 * flash));
        vgrad(g, 128, 176, [[0, '#14244a'], [1, '#0a1430']]);
        for (let i = 0; i < 10; i++) rect(g, rgba('#a8c8ff', 0.25 + 0.2 * Math.sin(t * 2 + i)), (i * 37 + t * 12) % LW, 136 + (i % 4) * 9, 18, 1);
        poly(g, '#2a2420', [0, 190, 120, 172, LW, 168, LW, LH, 0, LH]);
        g.save(); g.translate(236, 168); g.rotate(-0.12);
        rect(g, '#3a2a28', -50, -34, 96, 34); rect(g, '#5a3a30', -50, -34, 96, 4);
        for (let i = 0; i < 4; i++) rect(g, rgba('#ffd890', 0.15 + 0.5 * flash), -42 + i * 22, -26, 12, 10);
        rect(g, '#3a2a28', 46, -26, 30, 26); rect(g, '#3a2a28', 60, -40, 8, 14);
        g.restore();
        for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; ell(g, rgba('#e8f0ff', 0.5 * (1 - ph)), 200 + i * 30, 172, 10 + ph * 20, 2); }
        G.drawFigure(g, X.look, 92, 214, 0.8);
        const n = fall.filter(x => t > x + 0.2).length, words = ['один', 'два', 'три'];
        if (n) caption(g, words.slice(0, Math.min(3, n)).join('... ') + '...', LW - 12, LH - 22, { size: 17, align: 'right', col: '#c8d8f0' });
      }
    }
  ];

  function miner(g, x, y, t, i) {
    const swing = Math.sin(t * 4 + i * 2);
    poly(g, '#6a5440', [x - 12, y, x + 12, y, x + 10, y - 34, x - 10, y - 34]); rect(g, '#4a3a2c', x - 12, y - 14, 24, 4);
    ell(g, '#8a5a3a', x, y - 42, 8, 9); rect(g, '#3a3a40', x - 9, y - 52, 18, 6);
    lighter(g, () => glow(g, x, y - 52, 16, '#ffb050', 0.6));
    g.save(); g.translate(x + 6, y - 28); g.rotate(-0.8 + swing * 0.6); rect(g, '#5a3a24', -1, -24, 3, 26); poly(g, '#8a8a90', [-8, -26, 10, -22, -6, -20]); g.restore();
  }

  function butterfly(g, x, y, t, a) {
    if (a <= 0) return;
    const f = Math.abs(Math.sin(t * 14));
    lighter(g, () => glow(g, x, y, 14, '#b070ff', 0.5 * a));
    poly(g, rgba('#9a50e8', a), [x, y, x - 10 * f, y - 9, x - 8 * f, y + 2]);
    poly(g, rgba('#9a50e8', a), [x, y, x + 10 * f, y - 9, x + 8 * f, y + 2]);
    poly(g, rgba('#d8a8ff', a), [x, y, x - 6 * f, y + 7, x + 6 * f, y + 7]);
  }

  SHOWS.bronya = [
    {
      key: 'speech', ch: '01', len: 2.8, light: '#a0c0ff',
      fx: { noise: 0.07, ghost: 0.22, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#3a4660'], [1, '#6a7488']]);
        for (let i = 0; i < 8; i++) { const h = 50 + hx(i, 1, 82) * 50; rect(g, '#2a3248', i * 42 - 6, 110 - h, 36, h + 20); for (let w = 0; w < 4; w++) rect(g, rgba('#ffd890', 0.5), i * 42 + 2 + (w % 2) * 14, 120 - h + Math.floor(w / 2) * 14, 6, 6); poly(g, '#e8eef6', [i * 42 - 8, 110 - h, i * 42 + 12, 100 - h, i * 42 + 32, 110 - h]); }
        rect(g, '#2a4a9a', 30, 10, 200, 28); rect(g, '#d8b050', 30, 36, 200, 2);
        ell(g, '#f2c040', 50, 24, 9, 9);
        caption(g, 'ПРАЗДНИК СОЛНЦА', 138, 14, { size: 17, align: 'center', col: '#f2f2f6', shadow: '#10204a' });
        G.drawFigure(g, X.look, 160, 186, 1.3);
        poly(g, '#2a4a9a', [118, 132, 202, 132, 196, 186, 124, 186]); rect(g, '#d8dce4', 118, 130, 84, 4);
        ell(g, '#d8dce4', 160, 156, 12, 12); ell(g, '#2a4a9a', 160, 156, 8, 8); poly(g, '#d8dce4', [160, 146, 163, 156, 160, 166, 157, 156]);
        for (let i = 0; i < 9; i++) { const x = 8 + i * 38, y = 192 + (i % 2) * 6; ell(g, '#3a3a48', x, y + 18, 16, 14); ell(g, ['#5a4a3a', '#2a2a30', '#8a7a6a'][i % 3], x, y, 9, 10); rect(g, '#6a7a98', x - 9, y - 10, 18, 4); }
        K.snowfall(g, t, 50, 9, { speed: 20, wind: -6 });
        rect(g, 'rgba(0,0,0,0.7)', 0, 208, LW, 32);
        caption(g, '«Я хочу вернуть празднику', 160, 209, { size: 14, align: 'center' });
        caption(g, 'его исконный смысл»', 160, 224, { size: 14, align: 'center' });
      }
    },
    {
      key: 'bulletin', ch: '03', len: 2.8, light: '#7090c0',
      fx: { noise: 0.06, chroma: 1, wobble: 0.3, hum: 0.7 },
      paint(g, t) {
        rect(g, '#1a2434', 0, 0, LW, LH);
        for (let i = 0; i < 7; i++) { g.strokeStyle = rgba('#5a7090', 0.4); g.lineWidth = 1; g.beginPath(); g.ellipse(120 + i * 6, 120 - i * 4, 140 - i * 16, 70 - i * 8, 0.2, 0, Math.PI * 2); g.stroke(); }
        for (let x = 0; x < LW; x += 40) rect(g, rgba('#5a7090', 0.25), x, 0, 1, LH);
        for (let y = 0; y < LH; y += 40) rect(g, rgba('#5a7090', 0.25), 0, y, LW, 1);
        rect(g, '#0c1420', 0, 0, LW, 30);
        caption(g, 'СВОДКА СТРАЖЕЙ', 12, 6, { size: 17, col: '#c8d8f0' });
        poly(g, '#d8dce4', [70, 196, 74, 186, 78, 196, 88, 196, 80, 202, 84, 212, 74, 206, 64, 212, 68, 202, 60, 196]);
        caption(g, 'Белобог', 92, 196, { size: 14, col: '#d8dce4' });
        caption(g, 'СЕВЕРНЫЕ РУИНЫ', 176, 44, { size: 15, col: '#a8b8d0' });
        const route = [], k = seg(t, 0.2, 1.6);
        for (let i = 0; i <= 20; i++) { const u = i / 20; route.push(76 + u * 150 + Math.sin(u * 5) * 14, 186 - u * 110); }
        chalk(g, route, k, '#3a8af0', 3);
        const idx = Math.floor(k * 20), ux = route[idx * 2], uy = route[idx * 2 + 1], lost = t > 1.9;
        if (t > 1.6) { line(g, '#e8303a', 3, 210, 84, 226, 100); line(g, '#e8303a', 3, 226, 84, 210, 100); }
        rect(g, '#0c1420', ux - 16, uy - 10, 32, 20); g.strokeStyle = lost ? '#e8303a' : '#3a8af0'; g.lineWidth = 2; g.strokeRect(ux - 16, uy - 10, 32, 20);
        caption(g, lost ? '9' : '10', ux, uy - 8, { size: 15, align: 'center', col: lost && Math.floor(t * 4) % 2 ? '#e8303a' : '#f2f2f6', shadow: false });
        if (t > 1.6) caption(g, 'ЗАСАДА ФРАГМЕНТУМА', 160, 214, { size: 15, align: 'center', col: '#e8a0a0' });
      }
    },
    {
      key: 'underworld', ch: 'AV', len: 2.8, light: '#ffa050',
      fx: { noise: 0.09, chroma: 1, wobble: 0.8, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 1.9) * 2), Math.round(Math.sin(t * 2.6) * 2));
        vgrad(g, -10, LH + 10, [[0, '#14100c'], [1, '#2a1e14']], -10, LW + 20);
        for (let i = 0; i < 10; i++) poly(g, '#1e1610', [i * 36 - 10, 0, i * 36 + 30, 0, i * 36 + 10, 20 + hx(i, 1, 83) * 30]);
        for (const [x, y] of [[60, 50], [180, 40], [290, 60]]) { line(g, '#3a2a20', 1, x, 0, x, y); lighter(g, () => glow(g, x, y + 4, 34, '#ffb050', 0.5)); ell(g, '#ffd080', x, y + 4, 4, 5); }
        rect(g, '#5a4430', -10, 190, LW + 20, 60);
        rect(g, '#4a3a2a', 196, 168, 60, 22); rect(g, '#2a2018', 200, 190, 8, 8); rect(g, '#2a2018', 244, 190, 8, 8);
        for (let i = 0; i < 5; i++) { lighter(g, () => glow(g, 206 + i * 10, 166, 10, '#60c0ff', 0.5)); ell(g, '#80d0ff', 206 + i * 10, 166, 4, 3); }
        for (let i = 0; i < 3; i++) miner(g, 40 + i * 50, 196, t, i);
        G.drawFigure(g, X.look, 284, 200, 1.05, { flip: true });
        rect(g, 'rgba(20,16,12,0.55)', 266, 96, 38, 30);
        g.restore();
        caption(g, 'ПОДЗЕМЬЕ. СМЕНА 14 ЧАСОВ', 12, 10, { size: 15, col: '#ffe0b0' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'bench', ch: '', len: 3.6, light: '#c8b0ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const clear = sm(seg(t, 1.0, 2.4));
        vgrad(g, 0, 170, [[0, '#2a2a48'], [1, '#8a7a98']]);
        g.save(); g.globalAlpha = clear;
        vgrad(g, 0, 170, [[0, '#0a1430'], [1, '#3a5a9a']]);
        for (let i = 0; i < 40; i++) rect(g, rgba('#f2f4ff', 0.4 + 0.6 * hx(i, 1, 84)), hx(i, 2, 84) * LW, hx(i, 3, 84) * 120, 1, 1);
        lighter(g, () => { for (let i = 0; i < 3; i++) glow(g, 80 + i * 80, 50 + Math.sin(t + i) * 6, 60, ['#60f0c0', '#80a0ff', '#c080ff'][i], 0.25); });
        g.restore();
        g.save(); g.globalAlpha = 1 - clear;
        ell(g, '#2a2a32', 160, -30, 300, 80); ell(g, '#5a5a66', 160, -38, 290, 70);
        rect(g, '#7a7a88', 0, 30, LW, 4);
        for (let i = 0; i < 14; i++) { rect(g, '#1e1e26', 4 + i * 23, 36, 3, 8); lighter(g, () => glow(g, 14 + i * 23, 34, 5, '#ff6040', 0.6)); }
        g.restore();
        for (let i = 0; i < 7; i++) { const h = 30 + hx(i, 1, 85) * 30; rect(g, '#2a2638', i * 48, 170 - h, 40, h); }
        rect(g, '#3a3444', 0, 168, LW, 72);
        G.drawFigure(g, X.look, 160, 204, 0.85);
        rect(g, '#d8c8a8', 100, 182, 120, 12); rect(g, '#b8a888', 100, 194, 120, 4); rect(g, '#a89878', 108, 198, 10, 26); rect(g, '#a89878', 202, 198, 10, 26);
        butterfly(g, 200 + Math.sin(t * 2) * 20, 120 + Math.cos(t * 3) * 10, t, seg(t, 2.4, 2.9));
      }
    }
  ];

  function firework(g, x, y, t0, t, col) {
    const k = seg(t, t0, t0 + 0.9);
    if (k <= 0 || k >= 1) return;
    lighter(g, () => {
      glow(g, x, y, 50 * k + 10, col, 0.7 * (1 - k));
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = 54 * eOut(k); rect(g, rgba(col, 1 - k * 0.8), x + Math.cos(a) * r - 2, y + Math.sin(a) * r + k * 10 - 2, 4, 4); line(g, rgba(col, 0.5 * (1 - k)), 2, x + Math.cos(a) * r * 0.6, y + Math.sin(a) * r * 0.6 + k * 6, x + Math.cos(a) * r, y + Math.sin(a) * r + k * 10); }
    });
  }

  function helmet(g, x, y, fist, t, i) {
    ell(g, '#3a4a6a', x, y + 18, 16, 12);
    ell(g, '#c8d0e0', x, y, 10, 10); rect(g, '#2a3450', x - 7, y - 1, 14, 4); poly(g, '#e8eef6', [x - 2, y - 10, x, y - 20, x + 2, y - 10]);
    if (fist) { const up = Math.abs(Math.sin(t * 6 + i)) * 6; line(g, '#3a4a6a', 4, x + 10, y + 10, x + 14, y - 14 - up); ell(g, '#d8b8a0', x + 14, y - 16 - up, 4, 4); }
  }

  function pot(g, x, y, k, bloom) {
    poly(g, '#a85a3a', [x - 14, y - 20, x + 14, y - 20, x + 10, y, x - 10, y]); rect(g, '#c86a44', x - 16, y - 24, 32, 5);
    const lean = (1 - k) * 1.9, tx = x + Math.sin(lean) * 26, ty = y - 24 - Math.cos(lean) * 26;
    g.strokeStyle = '#4a7a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 24); g.quadraticCurveTo(x, y - 40, tx, ty); g.stroke();
    ell(g, '#5a8a3a', x - 6, y - 32, 5, 2, -0.5); ell(g, '#5a8a3a', x + 6, y - 30, 5, 2, 0.5);
    if (bloom > 0) { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ell(g, rgba('#e8a0d0', bloom), tx + Math.cos(a) * 5 * bloom, ty + Math.sin(a) * 5 * bloom, 4 * bloom, 3 * bloom); } ell(g, '#f2d050', tx, ty, 2.5 * bloom, 2.5 * bloom); }
    else ell(g, '#7a8a4a', tx, ty, 3, 4);
  }

  SHOWS.gepard = [
    {
      key: 'parade', ch: '04', len: 2.8, light: '#ffd890',
      fx: { noise: 0.07, ghost: 0.2, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#0a1028'], [1, '#2a3450']]);
        firework(g, 60, 50, 0.1, t, '#ffd060'); firework(g, 250, 40, 0.6, t, '#80c0ff'); firework(g, 140, 30, 1.2, t, '#ff8080'); firework(g, 90, 60, 1.8, t, '#c0ffc0'); firework(g, 230, 56, 2.1, t, '#ffd060');
        rect(g, '#2a3a6a', 30, 150, 260, 14); rect(g, '#d8b050', 30, 148, 260, 3);
        G.drawFigure(g, X.lookOf('cocolia'), 112, 150, 1.15, { flip: true });
        G.drawFigure(g, X.look, 196, 150, 1.25);
        const gl = seg(t, 0.8, 1.4);
        lighter(g, () => { glow(g, 178, 112, 22, '#80d0ff', 0.7 * gl); glow(g, 214, 112, 22, '#80d0ff', 0.7 * gl); });
        for (let i = 0; i < 30; i++) { const y = (hx(i, 1, 86) * LH + t * 40 * (0.5 + hx(i, 2, 86))) % LH; rect(g, ['#ffd060', '#ff6080', '#80c0ff', '#f2f2f6'][i % 4], hx(i, 3, 86) * LW + Math.sin(t * 3 + i) * 4, y, 3, 2); }
        for (let i = 0; i < 9; i++) helmet(g, 12 + i * 37, 196 + (i % 2) * 6, i % 2 === 0, t, i);
        rect(g, '#0c1e5a', 0, 214, 230, 26); rect(g, '#d8b050', 0, 214, 6, 26);
        caption(g, 'ПАРАД ПОБЕДЫ · Г. ЛАНДАУ', 12, 218, { size: 16 });
      }
    },
    {
      key: 'concert', ch: '07', len: 2.8, light: '#ff70c0',
      fx: { noise: 0.07, chroma: 2, wobble: 0.5, hum: 0.5 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#14081e'], [1, '#2a0c2a']]);
        lighter(g, () => { for (let i = 0; i < 4; i++) { const a = Math.sin(t * 1.6 + i * 1.7) * 0.4; poly(g, rgba(['#ff60c0', '#60a0ff', '#ffd060', '#ff60c0'][i], 0.22), [40 + i * 80, 0, 56 + i * 80, 0, 160 + Math.sin(a) * 120 + 40, 170, 160 + Math.sin(a) * 120 - 20, 170]); } });
        for (const x of [16, 268]) { rect(g, '#14141a', x, 80, 36, 90); ring(g, '#3a3a44', 4, x + 18, 106, 10); ring(g, '#3a3a44', 4, x + 18, 146, 13); }
        rect(g, '#2a1a2a', 0, 166, LW, 10);
        G.drawFigure(g, X.lookOf('serval'), 160, 168, 1.3);
        g.save(); g.translate(150, 118); g.rotate(-0.5); ell(g, '#c8303a', 0, 0, 14, 10); rect(g, '#2a2a30', 10, -3, 34, 5); rect(g, '#1a1a20', 42, -5, 8, 9); g.restore();
        lighter(g, () => { for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i / 4) % 1; caption(g, '♪', 180 + i * 18 + Math.sin(ph * 6) * 6, 120 - ph * 80, { size: 18, col: rgba('#ffd0f0', 1 - ph), shadow: false }); } });
        for (let i = 0; i < 9; i++) helmet(g, 12 + i * 37, 200 + (i % 2) * 6, true, t, i);
        caption(g, 'СЕРВАЛ · ЖИВОЙ КОНЦЕРТ', 12, 10, { size: 16, col: '#ffd0f0' });
        if (t > 1.4) {
          const k = eOut(seg(t, 1.4, 1.6));
          rect(g, '#f2f2f6', 214, 128 + (1 - k) * 120, 96, 82); rect(g, '#1a2238', 217, 131 + (1 - k) * 120, 90, 76);
          G.drawPortrait(g, X.look, 226, 136 + (1 - k) * 120, 72);
          caption(g, '♪', 290, 140 + (1 - k) * 120, { size: 16, col: '#ffd060' });
        }
      }
    },
    {
      key: 'kids', ch: '09', len: 2.8, light: '#ffe070',
      fx: { noise: 0.05, chroma: 1, wobble: 0.3 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#70c8f0'], [1, '#c8f0ff']]);
        ell(g, '#ffd040', 270, 70, 24, 24); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + t * 0.5; line(g, '#ffd040', 4, 270 + Math.cos(a) * 30, 70 + Math.sin(a) * 30, 270 + Math.cos(a) * 40, 70 + Math.sin(a) * 40); }
        const word = 'УРОК ДЛЯ ЮНЫХ СТРАЖЕЙ', cols = ['#e8303a', '#2a7ad8', '#3aa848', '#e8a020'];
        rect(g, '#ffffff', 8, 6, 250, 28); let x = 14;
        for (let i = 0; i < word.length; i++) { const ch = word[i], y = 10 + Math.sin(t * 4 + i * 0.6) * 1.5; caption(g, ch, x, y, { size: 18, col: cols[i % 4], shadow: false }); x += textWidth(g, ch, 18) + 1; }
        rect(g, '#5ac85a', 0, 170, LW, 70);
        G.drawFigure(g, X.look, 106, 178, 1.3);
        for (let i = 0; i < 3; i++) fan(g, 200 + i * 34, 176 + (i % 2) * 4, 1.0, ['#5a3a20', '#e8c060', '#2a1a14'][i], ['#e8303a', '#2a7ad8', '#e8a020'][i], false);
        rect(g, '#5a5a66', 160, 100, 30, 4); ell(g, '#3a3a44', 160, 102, 6, 9); ell(g, '#3a3a44', 190, 102, 6, 9);
        ell(g, '#d8303a', 230, 100, 10, 10); rect(g, '#5a3a20', 229, 86, 2, 6); ell(g, '#5aa83a', 234, 88, 5, 2);
        rect(g, 'rgba(0,0,0,0.65)', 0, 206, LW, 34);
        caption(g, '«Больше заниматься спортом', 160, 207, { size: 14, align: 'center' });
        caption(g, 'и правильно питаться».', 160, 222, { size: 14, align: 'center' });
      }
    },
    {
      key: 'flowers', ch: '', len: 3.6, light: '#c8e0ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t) {
        rect(g, '#4a3a30', 0, 0, LW, LH);
        vgrad(g, 20, 150, [[0, '#8aa0c0'], [1, '#c8d8ec']], 40, 240);
        K.snowfall(g, t, 40, 11, { speed: 18, wind: -4, h: 150 });
        rect(g, '#4a3a30', 0, 0, 40, 160); rect(g, '#4a3a30', 280, 0, 40, 160); rect(g, '#4a3a30', 0, 0, LW, 20); rect(g, '#5a4a3e', 156, 20, 8, 130);
        for (let i = 0; i < 16; i++) ell(g, rgba('#ffffff', 0.35), 46 + hx(i, 1, 87) * 228, 140 + hx(i, 2, 87) * 10, 6 + hx(i, 3, 87) * 8, 3);
        rect(g, '#d8d0c4', 20, 150, 280, 12); rect(g, '#b8b0a4', 20, 162, 280, 4);
        pot(g, 80, 150, 0.15, 0); pot(g, 240, 150, 0.25, 0);
        const rise = sm(seg(t, 0.8, 2.2));
        pot(g, 160, 150, rise, seg(t, 2.0, 2.8));
        g.save(); g.translate(206, 196); g.rotate(-0.08); rect(g, '#f2e870', -34, -16, 68, 32); caption(g, 'Полей!', 0, -12, { size: 14, align: 'center', col: '#3a3020', shadow: false }); caption(g, '— С.', 14, 2, { size: 12, align: 'center', col: '#3a3020', shadow: false }); g.restore();
        poly(g, '#8a9aa8', [40, 200, 80, 200, 76, 230, 44, 230]); line(g, '#8a9aa8', 4, 78, 206, 104, 192);
      }
    }
  ];

  function robot(g, x, y, s, body, t, i) {
    const bob = Math.round(Math.sin(t * 3 + i) * 1.5);
    rect(g, '#2a2a30', x - 8 * s, y - 10 * s, 5 * s, 10 * s); rect(g, '#2a2a30', x + 3 * s, y - 10 * s, 5 * s, 10 * s);
    rect(g, body, x - 14 * s, y - 34 * s + bob, 28 * s, 24 * s); rect(g, G.dark(body, 0.3), x - 14 * s, y - 14 * s + bob, 28 * s, 4 * s);
    rect(g, G.light(body, 0.2), x - 11 * s, y - 52 * s + bob, 22 * s, 16 * s);
    ell(g, '#1a1a20', x, y - 44 * s + bob, 6 * s, 6 * s);
    lighter(g, () => glow(g, x, y - 44 * s + bob, 8 * s, '#60e0ff', 0.7));
    ell(g, '#a0f0ff', x, y - 44 * s + bob, 2.5 * s, 2.5 * s);
    line(g, '#5a5a66', 2, x, y - 52 * s + bob, x, y - 60 * s + bob); ell(g, '#e8303a', x, y - 61 * s + bob, 2.5 * s, 2.5 * s);
  }

  SHOWS.clara = [
    {
      key: 'moles', ch: '06', len: 2.8, light: '#ffc080',
      fx: { noise: 0.09, ghost: 0.2, chroma: 1, wobble: 0.6 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a2018'], [1, '#4a3828']]);
        for (let i = 0; i < 6; i++) rect(g, '#3a2c20', i * 60, 0, 30, LH);
        rect(g, '#c8a878', 30, 12, 210, 44); rect(g, '#a88858', 30, 52, 210, 4);
        caption(g, 'КРОТЫ', 135, 14, { size: 22, align: 'center', col: '#3a2010', shadow: false });
        caption(g, 'новости Подземья', 135, 36, { size: 13, align: 'center', col: '#3a2010', shadow: false });
        G.drawFigure(g, X.lookOf('hook'), 86, 196, 1.25);
        const peek = sm(seg(t, 1.0, 1.5)) * (1 - sm(seg(t, 2.2, 2.6)));
        g.save(); g.beginPath(); g.rect(150, 0, LW, 196); g.clip();
        G.drawFigure(g, X.look, lerp(330, 290, peek), 196, 1.1);
        g.restore();
        rect(g, '#5a5a70', 196, 170, 10, 26); rect(g, '#5a5a70', 238, 170, 10, 26); rect(g, '#3a3a48', 190, 190, 22, 6); rect(g, '#3a3a48', 232, 190, 22, 6);
        poly(g, '#6a3a2a', [174, 174, 270, 174, 262, 90, 182, 90]); poly(g, '#7a4a34', [196, 92, 248, 92, 240, 70, 204, 70]);
        for (let i = 0; i < 3; i++) ell(g, '#d8b050', 222, 110 + i * 20, 3, 3);
        ell(g, '#6a6a80', 172, 150, 9, 9); ell(g, '#6a6a80', 272, 150, 9, 9);
        rect(g, '#2a2a30', 196, 56, 52, 14); rect(g, '#3a3a44', 188, 68, 68, 4);
        lighter(g, () => glow(g, 222, 82, 10, '#ff2e8e', 0.6 + 0.3 * Math.sin(t * 5)));
        rect(g, '#14100c', 0, 196, LW, 44);
        caption(g, 'Задание дня: прятки!', 160, 202, { size: 17, align: 'center', col: '#ffe0a0' });
        caption(g, 'Роботам надеть одежду побольше', 160, 222, { size: 13, align: 'center', col: '#c8a878' });
      }
    },
    {
      key: 'family', ch: 'AV', len: 2.8, light: '#ffe0b0',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.2) * 2), Math.round(Math.sin(t * 1.4 + 1) * 2));
        vgrad(g, -10, LH + 10, [[0, '#3a3a40'], [1, '#5a5048']], -10, LW + 20);
        for (let i = 0; i < 8; i++) poly(g, '#4a4a52', [i * 44 - 10, 150, i * 44 + 20, 100 + hx(i, 1, 88) * 30, i * 44 + 40, 150]);
        rect(g, '#6a5a48', -10, 150, LW + 20, 100);
        robot(g, 50, 196, 1.6, '#c87a3a', t, 0);
        robot(g, 120, 200, 1.1, '#5a9ac8', t, 1);
        G.drawFigure(g, X.look, 172, 204, 1.15);
        robot(g, 250, 198, 1.9, '#7a8a5a', t, 2);
        g.restore();
        caption(g, 'Перкинс', 50, 202, { size: 13, align: 'center', col: '#ffe8a0' });
        caption(g, 'Тимми', 120, 204, { size: 13, align: 'center', col: '#ffe8a0' });
        caption(g, 'дядюшка Тоби', 250, 204, { size: 13, align: 'center', col: '#ffe8a0' });
        const cd = 3 - Math.floor(t / 0.7);
        if (cd > 0) caption(g, String(cd), 160, 40, { size: 40, align: 'center', col: '#ffffff' });
        else { lighter(g, () => glow(g, 160, 120, 200, '#ffffff', 0.9 * (1 - seg(t, 2.1, 2.5)))); caption(g, 'СЕМЬЯ!', 160, 30, { size: 30, align: 'center', col: '#ffe840' }); }
        if (Math.floor(t * 2) % 2) { ell(g, '#ff3030', 18, LH - 17, 5, 5); caption(g, 'REC', 28, LH - 25, { size: 14 }); }
      }
    },
    {
      key: 'log', ch: '13', len: 3.0, light: '#ff3070',
      fx: { noise: 0.07, chroma: 1, wobble: 0.3, hum: 0.6 },
      paint(g, t, X) {
        rect(g, '#0a0408', 0, 0, LW, LH);
        for (let i = 0; i < 9; i++) poly(g, '#2a1018', [i * 40 - 20, 200, i * 40 + 10, 120 + hx(i, 1, 89) * 50, i * 40 + 44, 200]);
        for (let i = 0; i < 14; i++) rect(g, '#3a1820', hx(i, 2, 89) * LW, 150 + hx(i, 3, 89) * 50, 10 + hx(i, 4, 89) * 20, 4);
        rect(g, '#1a0a10', 0, 196, LW, 44);
        G.drawFigure(g, X.look, 160, 196, 0.7);
        g.globalCompositeOperation = 'saturation'; rect(g, '#808080', 0, 0, LW, LH);
        g.globalCompositeOperation = 'multiply'; rect(g, '#ff7090', 0, 0, LW, LH);
        g.globalCompositeOperation = 'source-over';
        const lock = eOut(seg(t, 0.2, 0.9)), r = lerp(90, 34, lock);
        g.strokeStyle = '#ff4080'; g.lineWidth = 2;
        for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(160 + dx * r, 160 + dy * r - dy * 12); g.lineTo(160 + dx * r, 160 + dy * r); g.lineTo(160 + dx * r - dx * 12, 160 + dy * r); g.stroke(); }
        const sy = 100 + ((t * 70) % 110);
        lighter(g, () => rect(g, rgba('#ff4080', 0.5), 100, sy, 120, 2));
        caption(g, 'ЖУРНАЛ СВАРОГА', 12, 10, { size: 15, col: '#ff80a8' });
        const lines = ['ОБЪЕКТ: ДЕВОЧКА, 2-3 ГОДА', 'ПОВРЕЖДЕНИЙ: НЕТ', 'ПЛАЧ: 3 Ч 07 МИН', 'ИМЯ: КЛАРА'];
        lines.forEach((s, i) => { if (t > 0.9 + i * 0.4) caption(g, s, 12, 32 + i * 18, { size: 13, col: '#ff80a8' }); });
        if (t > 2.6) caption(g, 'ВЫВОД: ЗАБРАТЬ НА БАЗУ', 160, 214, { size: 15, align: 'center', col: '#ffffff' });
      }
    },
    {
      key: 'coat', ch: '', len: 3.6, light: '#ffb070',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a1e18'], [1, '#14100c']]);
        lighter(g, () => glow(g, 70, 70, 90, '#ffb860', 0.45 * (0.9 + 0.1 * Math.sin(t * 5))));
        rect(g, '#3a2a20', 62, 40, 16, 24); rect(g, '#ffd080', 64, 58, 12, 10);
        rect(g, '#3a2c22', 0, 214, LW, 26);
        H.Ults.Art.svarog(g, 190, 250, 0.9, t, 0.35);
        poly(g, '#a8202a', [146, 250, 234, 250, 226, 112, 154, 112]);
        poly(g, '#c8303a', [154, 114, 226, 114, 234, 134, 146, 134]);
        line(g, '#6a1018', 2, 190, 134, 190, 250);
        for (let i = 0; i < 4; i++) ell(g, '#d8b050', 182, 150 + i * 22, 3, 3);
        rect(g, '#7a1a22', 160, 72, 60, 6); rect(g, '#8a2028', 170, 50, 40, 24); rect(g, '#d8b050', 170, 68, 40, 4);
        ell(g, '#e8dcc8', 190, 168, 50, 16); ell(g, '#d8c8b0', 190, 176, 50, 8);
        g.save(); g.translate(234, 168); g.rotate(-Math.PI / 2);
        G.drawFigure(g, X.lookOf('clara'), 0, 0, 0.75);
        g.restore();
        rect(g, '#a8202a', 140, 180, 104, 12); rect(g, '#8a1a22', 140, 190, 104, 3);
        ell(g, '#6a6a80', 138, 184, 9, 9); ell(g, '#6a6a80', 246, 184, 9, 9);
        for (let i = 0; i < 3; i++) { const ph = (t * 0.35 + i / 3) % 1; caption(g, 'z', 132 - ph * 20, 120 - ph * 40, { size: 12 + ph * 8, col: rgba('#f2e8d8', 1 - ph), shadow: false }); }
      }
    }
  ];

  function blade(g, x, y, len, ang, col, w) {
    g.save(); g.translate(x, y); g.rotate(ang);
    poly(g, col, [0, -w, len, 0, 0, w]);
    rect(g, '#d8b050', -3, -w - 3, 3, w * 2 + 6); rect(g, '#3a2a20', -14, -w * 0.6, 11, w * 1.2);
    g.restore();
  }

  function junk(g, x, y, s) {
    poly(g, '#3a2e44', [x - 30 * s, y, x + 30 * s, y, x + 22 * s, y + 8 * s, x - 22 * s, y + 8 * s]);
    poly(g, '#d8d0b8', [x - 2 * s, y - 2, x - 2 * s, y - 26 * s, x + 16 * s, y - 4 * s]);
    lighter(g, () => glow(g, x - 30 * s, y + 4 * s, 8 * s, '#60c0ff', 0.6));
  }

  SHOWS.yanqing = [
    {
      key: 'review', ch: '15', len: 2.8, light: '#80c8ff',
      fx: { noise: 0.07, ghost: 0.2, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#060c24'], [1, '#1a2a50']]);
        for (let i = 0; i < 40; i++) rect(g, rgba('#e8f0ff', 0.4 + 0.5 * hx(i, 1, 90)), hx(i, 2, 90) * LW, hx(i, 3, 90) * 140, 1, 1);
        for (let i = 0; i < 5; i++) junk(g, ((40 + i * 66 + t * 12) % 360) - 20, 30 + (i % 2) * 22, 0.8 + (i % 3) * 0.2);
        rect(g, '#2a2a40', 40, 160, 240, 12); rect(g, '#d8b050', 40, 158, 240, 3);
        G.drawFigure(g, X.look, 160, 162, 1.3);
        for (let i = 0; i < 5; i++) { const a = t * 2.2 + i / 5 * Math.PI * 2, x = 160 + Math.cos(a) * 60, y = 100 + Math.sin(a) * 22; lighter(g, () => glow(g, x, y, 12, '#80e0ff', 0.6)); blade(g, x, y, 26, a + Math.PI / 2, '#d8f4ff', 3); }
        for (let i = 0; i < 9; i++) { const x = 12 + i * 37, y = 200 + (i % 2) * 6; fan(g, x, y, 1.2, '#1a1a20', '#8a2a2a', false); ell(g, '#1a1a20', x, y - 12, 5, 4); rect(g, '#d8b050', x - 2, y - 12, 4, 2); rect(g, '#d8b050', x - 16, y + 10, 32, 3); }
        caption(g, 'СМОТР ЗВЁЗДНЫХ ВОЙСК', 12, 10, { size: 16, col: '#c8e0ff' });
        rect(g, '#5a1a1a', 0, 214, 270, 26); rect(g, '#d8b050', 0, 214, 6, 26);
        caption(g, 'ЛЕЙТЕНАНТ ЯНЬЦИН · ЛОФУ', 12, 218, { size: 16 });
      }
    },
    {
      key: 'shop', ch: '22', len: 2.8, light: '#ffc040',
      fx: { noise: 0.06, chroma: 2, wobble: 0.4, hum: 0.5 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#a81e1e'], [1, '#5a0c0c']]);
        for (let i = 0; i < 6; i++) ring(g, rgba('#f2c040', 0.25), 3, 160, 110, 30 + i * 30 + (t * 30) % 30);
        caption(g, 'КОМИССИЯ ПО РЕМЁСЛАМ', 12, 10, { size: 16, col: '#ffe8a0', shadow: '#3a0a0a' });
        const names = ['Остроцвет', 'Тальник', 'Кроволист'];
        names.forEach((n, i) => {
          const x = 36 + i * 76, y = 140;
          rect(g, '#3a1a10', x - 20, y, 40, 8);
          blade(g, x, y - 4, 70 - i * 6, -Math.PI / 2, ['#e8f4ff', '#c8e8d8', '#f2d8d8'][i], 3 + i);
          caption(g, n, x, y + 12, { size: 13, align: 'center', col: '#ffe8a0' });
        });
        G.drawFigure(g, X.look, 274, 192, 1.2);
        const k = 1 + 0.1 * Math.sin(t * 10);
        g.save(); g.translate(196, 76); g.scale(k, k); g.rotate(-0.2);
        const pts = []; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? 36 : 26; pts.push(Math.cos(a) * r, Math.sin(a) * r); }
        poly(g, '#f2e040', pts); caption(g, 'КУПИ', 0, -16, { size: 13, align: 'center', col: '#a81e1e', shadow: false }); caption(g, 'ДВА!', 0, -1, { size: 15, align: 'center', col: '#a81e1e', shadow: false });
        g.restore();
        const money = Math.max(0, Math.round(1200 - seg(t, 0.4, 2.4) * 1200));
        rect(g, '#1a0606', 0, 210, LW, 30);
        caption(g, 'кошелёк: ' + money + ' кр.', LW - 12, 216, { size: 16, align: 'right', col: money ? '#ffe8a0' : '#ff8080' });
        caption(g, 'ЗВОНИТЕ!', 12, 216, { size: 16, col: '#f2e040' });
      }
    },
    {
      key: 'dossier', ch: '31', len: 3.0, light: '#ffb040',
      fx: { noise: 0.05, wobble: 0.3, hum: 0.6 },
      paint(g, t, X) {
        rect(g, '#0c0a06', 0, 0, LW, LH);
        g.strokeStyle = '#3a2a10'; g.lineWidth = 2; g.strokeRect(8, 8, 304, 224);
        caption(g, 'АРХИВ ОБЛАЧНЫХ РЫЦАРЕЙ', 18, 16, { size: 15, col: '#ffb040', shadow: false });
        line(g, '#ffb040', 1, 18, 36, 240, 36);
        rect(g, '#2a2010', 22, 50, 84, 96);
        G.drawPortrait(g, X.look, 28, 56, 72);
        g.globalCompositeOperation = 'saturation'; rect(g, '#808080', 22, 50, 84, 96);
        g.globalCompositeOperation = 'multiply'; rect(g, '#ffb040', 22, 50, 84, 96);
        g.globalCompositeOperation = 'source-over';
        const rows = [['ИМЯ', 'ЯНЬЦИН'], ['ЗВАНИЕ', 'ЛЕЙТЕНАНТ'], ['ЗАЧИСЛЕН', 'РЕБЁНКОМ'], ['РОДИТЕЛИ', 'НЕИЗВЕСТНО']];
        rows.forEach(([a, b], i) => {
          const t0 = 0.3 + i * 0.5, n = Math.floor(seg(t, t0, t0 + 0.4) * b.length);
          if (t < t0) return;
          caption(g, a + ':', 118, 54 + i * 24, { size: 14, col: '#a87a30', shadow: false });
          caption(g, b.slice(0, n) + (n < b.length && Math.floor(t * 8) % 2 ? '█' : ''), 212, 54 + i * 24, { size: 14, col: i === 3 ? '#ffd890' : '#ffb040', shadow: false });
        });
        if (t > 2.4) caption(g, 'ПОРУЧИТЕЛЬ: ГЕНЕРАЛ ЦЗИН ЮАНЬ', 160, 176, { size: 14, align: 'center', col: '#ffd890', shadow: false });
        if (Math.floor(t * 2) % 2) rect(g, '#ffb040', 18, 210, 10, 14);
      }
    },
    {
      key: 'room', ch: '', len: 3.6, light: '#c8d8ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a2a3a'], [1, '#1a1a24']]);
        rect(g, '#0e1430', 214, 20, 86, 80); ell(g, '#f2f0e0', 270, 50, 14, 14); rect(g, '#5a3a24', 214, 20, 86, 4); rect(g, '#5a3a24', 214, 96, 86, 4); rect(g, '#5a3a24', 255, 20, 4, 80);
        lighter(g, () => glow(g, 270, 50, 40, '#c8d8ff', 0.3));
        rect(g, '#4a2e1c', 18, 26, 170, 8); rect(g, '#4a2e1c', 18, 66, 170, 8); rect(g, '#4a2e1c', 18, 106, 170, 8);
        for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) blade(g, 34 + i * 56 + k * 10, 22 + r * 40, 40, 0.0, ['#d8e8f8', '#c8e8d8', '#f2d8d8'][(r + i) % 3], 2);
        rect(g, '#3a2418', 0, 176, LW, 64);
        G.drawFigure(g, X.look, 120, 210, 1.15);
        const sh = (t * 0.6) % 1;
        blade(g, 150, 160, 70, -0.15, '#e8f4ff', 3);
        lighter(g, () => glow(g, 160 + sh * 60, 158 - sh * 9, 8, '#ffffff', 0.8));
        rect(g, '#5a3a24', 200, 190, 100, 8);
        ell(g, '#8a6a3a', 222, 186, 10, 7); for (let i = 0; i < 3; i++) ell(g, '#d8b050', 238 + i * 6, 188, 3, 2);
        g.save(); g.translate(270, 180); g.rotate(0.08); rect(g, '#f2ecd8', -24, -14, 50, 28);
        caption(g, 'На еду.', 0, -12, { size: 12, align: 'center', col: '#3a2a1a', shadow: false });
        caption(g, '— Цзин Юань', 0, 1, { size: 9, align: 'center', col: '#3a2a1a', shadow: false });
        g.restore();
      }
    }
  ];

  function teletext(g, s, x, y, col, bg) {
    g.font = 'bold 16px Arial, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'top';
    if (bg) { const w = g.measureText(s); rect(g, bg, x - 2, y - 1, ((w && w.width) || s.length * 9.6) + 4, 19); }
    g.fillStyle = col; g.fillText(s, x, y);
  }

  function mentor(g, x, y, reach) {
    poly(g, '#2a2a3a', [x - 13, y, x + 13, y, x + 9, y - 40, x - 9, y - 40]);
    ell(g, '#d8b898', x, y - 48, 8, 9); rect(g, '#1a1a24', x - 9, y - 58, 18, 6);
    line(g, '#2a2a3a', 5, x + 6, y - 34, x + 14, y - 34 - reach * 26);
  }

  SHOWS.bailu = [
    {
      key: 'clinic', ch: '10', len: 2.8, light: '#90e0c0',
      fx: { noise: 0.07, ghost: 0.2, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#9ad8c0'], [1, '#5aa890']]);
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { rect(g, '#7a5a3a', 14 + c * 22, 20 + r * 30, 20, 26); rect(g, '#a8805a', 16 + c * 22, 22 + r * 30, 16, 20); ell(g, '#d8b050', 24 + c * 22, 32 + r * 30, 2, 2); }
        rect(g, '#6a4a30', 0, 178, LW, 62);
        G.drawFigure(g, X.look, 96, 190, 1.25);
        rect(g, '#d8f0ff', 128, 150, 22, 28); ell(g, '#f2a0c0', 134, 160, 4, 3); ell(g, '#f2e060', 142, 166, 4, 3); ell(g, '#a0e0ff', 136, 170, 4, 3); rect(g, '#c8a060', 126, 146, 26, 6);
        const second = t >= 1.4, k = eOut(seg(t, second ? 1.4 : 0.3, second ? 1.65 : 0.55));
        g.save(); g.translate(234, 98); g.scale(k, k); g.rotate(second ? 0.04 : -0.04);
        rect(g, '#fbf8ee', -66, -54, 132, 108); rect(g, '#c8303a', -66, -54, 132, 18);
        caption(g, 'НАЗНАЧЕНИЕ', 0, -52, { size: 13, align: 'center', col: '#ffffff', shadow: false });
        if (second) { ell(g, '#f2d060', -2, 0, 20, 20); ell(g, '#fbf8ee', 8, -6, 18, 18); caption(g, 'Высыпайтесь', 0, 26, { size: 16, align: 'center', col: '#2a3a5a', shadow: false }); }
        else { poly(g, '#a8d8f0', [-14, -18, 14, -18, 10, 18, -10, 18]); rect(g, '#5ab0e8', -12, -4, 24, 20); caption(g, 'Пейте больше воды', 0, 26, { size: 14, align: 'center', col: '#2a3a5a', shadow: false }); }
        g.restore();
        caption(g, 'ПРИЁМ У БАЙЛУ', 12, 200, { size: 20, col: '#fbf8ee', shadow: '#2a4a3a' });
      }
    },
    {
      key: 'teletext', ch: 'TXT', len: 3.0, light: '#60f0f0',
      fx: { noise: 0.05, chroma: 1, wobble: 0.3 },
      paint(g, t) {
        rect(g, '#000000', 0, 0, LW, LH);
        teletext(g, 'P128 КОМИССИЯ ПО АЛХИМИИ', 8, 8, '#000000', '#40e0f0');
        for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) if (hx(r, c, 91) > 0.45) rect(g, ['#40e040', '#e0e040'][r % 2], 250 + c * 10, 36 + r * 10, 9, 9);
        const rows = [['ИСТОРИЯ БОЛЕЗНИ 128/39', '#f0f040'], ['ПАЦИЕНТ: ЦЗИН ЮАНЬ', '#ffffff'], ['ЖАЛОБА: ВЕКИ ТЯЖЁЛЫЕ', '#ffffff'], ['ДИАГНОЗ: ПЕРЕРАБОТКА', '#ff6060'], ['НАЗНАЧЕНИЕ:', '#40e040'], ['- ГРУДИНКА С ЧЕСНОКОМ', '#40e0f0'], ['- КУРИЦА В ОСТРОМ СОУСЕ', '#40e0f0'], ['- ТОФУ', '#40e0f0'], ['ВРАЧ: БАЙЛУ', '#f040f0']];
        const shown = Math.floor(seg(t, 0.1, 2.2) * rows.length + 0.5);
        rows.slice(0, shown).forEach(([s, c], i) => teletext(g, s, 8, 40 + i * 20, c));
        teletext(g, 'ДАЛЕЕ: P129 СЛАДОСТИ', 8, LH - 22, '#000000', '#f040f0');
      }
    },
    {
      key: 'gourmet', ch: '27', len: 2.8, light: '#ffb070',
      fx: { noise: 0.06, chroma: 1, wobble: 0.4, hum: 0.6 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#1a0e24'], [1, '#3a1a2a']]);
        for (let i = 0; i < 6; i++) { const x = 20 + i * 52, y = 30 + (i % 2) * 8; line(g, '#3a2a1a', 1, x, 0, x, y - 10); ell(g, '#d8303a', x, y, 10, 12); lighter(g, () => glow(g, x, y, 24, '#ffa040', 0.5)); }
        rect(g, '#5a3020', 12, 70, 170, 26); caption(g, 'САД ГУРМАНОВ', 97, 74, { size: 17, align: 'center', col: '#ffe0a0', shadow: '#2a1008' });
        rect(g, '#7a4a2a', 12, 150, 170, 40);
        const st = 30 + 50 * (0.5 + 0.5 * Math.sin(t * 3));
        rect(g, '#8a6a4a', 96 - st, 112, 4, 40); rect(g, '#8a6a4a', 96 + st, 112, 4, 40);
        g.strokeStyle = '#f2a0c8'; g.lineWidth = 10; g.beginPath(); g.moveTo(98 - st, 122); g.quadraticCurveTo(98, 150 - st * 0.2, 98 + st, 122); g.stroke();
        g.strokeStyle = '#ffd0e8'; g.lineWidth = 3; g.beginPath(); g.moveTo(98 - st, 120); g.quadraticCurveTo(98, 146 - st * 0.2, 98 + st, 120); g.stroke();
        rect(g, '#5a5a6a', 214, 90, 106, 150); for (let r = 0; r < 6; r++) rect(g, '#4a4a58', 214, 96 + r * 24, 106, 2);
        rect(g, '#7a7a88', 210, 84, 114, 8);
        const climb = seg(t, 0.2, 1.4);
        G.drawFigure(g, X.look, lerp(300, 236, climb), 86 + Math.round(Math.abs(Math.sin(t * 8)) * 2 * (1 - climb)), 0.9);
        if (t > 1.4) { const r = eOut(seg(t, 1.4, 1.8)); mentor(g, 240, 236, r); mentor(g, 284, 236, r); }
        rect(g, '#1a0a12', 0, 206, 210, 34);
        caption(g, 'НЕБЕСНАЯ ТЯНУЧКА', 12, 208, { size: 15, col: '#ffd0e8' });
        caption(g, 'новинка!', 12, 224, { size: 12, col: '#ffe0a0', bold: false });
        if (t > 1.8) caption(g, '«Поставьте меня на землю!»', 160, 180, { size: 14, align: 'center', col: '#ffffff' });
      }
    },
    {
      key: 'water', ch: '', len: 3.8, light: '#60b0ff',
      fx: { noise: 0.02, wobble: 0.25 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a7ac8'], [0.6, '#123a7a'], [1, '#06143a']]);
        lighter(g, () => { for (let i = 0; i < 5; i++) { const x = 40 + i * 64 + Math.sin(t * 0.6 + i) * 10; poly(g, rgba('#a8e0ff', 0.12), [x - 8, 0, x + 14, 0, x + 50, LH, x + 10, LH]); } });
        for (let i = 0; i < 8; i++) { const y = 6 + ((i * 5 + t * 3) % 10); line(g, rgba('#d8f4ff', 0.35), 1, i * 44, y, i * 44 + 30, y + 3); }
        const dk = seg(t, 1.0, 2.8);
        if (dk > 0) {
          g.save(); g.globalAlpha = 0.55 * dk;
          const x0 = lerp(360, -120, seg(t, 1.0, 3.8)), yb = i => 186 + Math.sin(i * 0.5 + t * 2) * 14;
          g.strokeStyle = '#7ac0e8'; g.lineWidth = 20; g.lineCap = 'round'; g.beginPath();
          for (let i = 0; i <= 22; i++) { const x = x0 + 20 + i * 12; if (i) g.lineTo(x, yb(i)); else g.moveTo(x, yb(i)); }
          g.stroke(); g.lineCap = 'butt';
          for (let i = 2; i <= 20; i += 3) poly(g, '#a8e0ff', [x0 + 14 + i * 12, yb(i) - 8, x0 + 20 + i * 12, yb(i) - 20, x0 + 26 + i * 12, yb(i) - 8]);
          ell(g, '#7ac0e8', x0 + 8, yb(0) - 2, 22, 14);
          poly(g, '#d8f0ff', [x0 + 10, yb(0) - 12, x0 + 22, yb(0) - 34, x0 + 20, yb(0) - 10]); poly(g, '#d8f0ff', [x0 + 18, yb(0) - 10, x0 + 34, yb(0) - 30, x0 + 28, yb(0) - 6]);
          lighter(g, () => glow(g, x0 + 2, yb(0) - 4, 10, '#e8fbff', 0.9));
          g.restore();
        }
        g.save(); g.translate(160, 140 + Math.sin(t * 1.2) * 4); g.rotate(Math.sin(t * 0.8) * 0.08);
        G.drawFigure(g, X.look, 0, 60, 1.15);
        g.restore();
        for (let i = 0; i < 10; i++) { const ph = (t * (0.3 + hx(i, 1, 92) * 0.3) + hx(i, 2, 92)) % 1; ring(g, rgba('#d8f4ff', 0.8 * (1 - ph)), 1, 150 + hx(i, 3, 92) * 30 + Math.sin(ph * 8 + i) * 4, 90 - ph * 90, 1.5 + hx(i, 4, 92) * 2.5); }
      }
    }
  ];

  function headAt(look, x, foot, s) {
    const [ex, ey] = G.figEye(look, 1), [lx] = G.figEye(look, -1);
    return { x: x + ((ex + lx) / 2 - G.FIG_W / 2) * s, y: foot - G.FIG_FOOT * s + ey * s };
  }

  function camera(g, x, y, flash) {
    rect(g, '#2a2a34', x - 12, y - 8, 24, 16); ell(g, '#5a5a6a', x, y, 6, 6); ell(g, '#a8c8f0', x, y, 3, 3); rect(g, '#f2c0d8', x + 6, y - 11, 6, 3);
    if (flash > 0) lighter(g, () => glow(g, x - 8, y - 10, 60, '#ffffff', flash));
  }

  SHOWS.march = [
    {
      key: 'fashion', ch: '17', len: 2.8, light: '#ffb0d8',
      fx: { noise: 0.07, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a0e2a'], [1, '#4a1a3a']]);
        lighter(g, () => { for (const x of [60, 160, 260]) poly(g, rgba('#ffd0f0', 0.18), [x - 10, 0, x + 10, 0, x + 50, 170, x - 50, 170]); });
        poly(g, '#3a2a3a', [130, 100, 190, 100, 260, 210, 60, 210]); poly(g, '#f2c0d8', [150, 100, 170, 100, 200, 210, 120, 210]);
        caption(g, 'МОДА ЭКСПРЕССА', 12, 10, { size: 17, col: '#ffd0f0', shadow: '#5a1a3a' });
        const second = t >= 1.4, walk = seg(t, second ? 1.4 : 0, second ? 2.8 : 1.4), s = lerp(0.9, 1.4, walk), foot = lerp(150, 206, walk);
        const pl = X.lookOf('pompom');
        G.drawFigure(g, pl, 160, foot, s);
        const h = { x: 160, y: foot + (56 - G.FIG_FOOT) * s };
        if (second) { ell(g, '#5a3a2a', h.x, h.y - 12 * s, 16 * s, 8 * s); rect(g, '#7a5a3a', h.x - 16 * s, h.y - 8 * s, 32 * s, 4 * s); rect(g, '#c8303a', h.x - 14 * s, h.y + 16 * s, 28 * s, 5 * s); }
        else { ell(g, '#3a6ad8', h.x + 2 * s, h.y - 14 * s, 13 * s, 6 * s); ell(g, '#f2e060', h.x + 12 * s, h.y - 18 * s, 3 * s, 3 * s); rect(g, '#f2e060', h.x - 12 * s, h.y + 16 * s, 24 * s, 4 * s); }
        G.drawFigure(g, X.look, 274, 210, 1.1, { flip: true });
        camera(g, 256, 140, Math.max(0, 1 - ((t * 1.6) % 1) * 6));
        rect(g, '#0c1e5a', 0, 212, 240, 28); rect(g, '#f2c0d8', 0, 212, 6, 28);
        caption(g, second ? 'ПОМ-ПОМ · ЯРИЛО-VI' : 'ПОМ-ПОМ · СТАНЦИЯ «ГЕРТА»', 12, 217, { size: 15 });
      }
    },
    {
      key: 'versions', ch: 'AV', len: 3.0, light: '#a8d8ff',
      fx: { noise: 0.08, chroma: 1, wobble: 0.8, track: 1 },
      paint(g, t, X) {
        const i = Math.min(2, Math.floor(t / 1.0)), lt = t - i, k = eOut(seg(lt, 0, 0.2));
        const bg = ['#5a2a6a', '#1a3a5a', '#2a4a6a'][i];
        vgrad(g, 0, LH, [[0, bg], [1, G.dark(bg, 0.5)]]);
        g.save(); g.translate((1 - k) * 320, 0);
        const foot = 210, s = 1.4, L = X.look;
        if (i === 2) { lighter(g, () => glow(g, 160, 130, 90, '#a8e0ff', 0.4)); poly(g, rgba('#c8ecff', 0.75), [110, 60, 210, 54, 226, 200, 96, 208]); }
        G.drawFigure(g, L, 160, foot, s);
        const h = headAt(L, 160, foot, s);
        if (i === 0) { poly(g, '#f2c040', [h.x - 14, h.y - 22, h.x - 10, h.y - 34, h.x - 4, h.y - 26, h.x, h.y - 38, h.x + 4, h.y - 26, h.x + 10, h.y - 34, h.x + 14, h.y - 22]); ell(g, '#e83040', h.x, h.y - 28, 2.5, 2.5); }
        if (i === 1) { poly(g, '#1a1a20', [h.x - 24, h.y - 18, h.x + 24, h.y - 18, h.x + 14, h.y - 32, h.x - 14, h.y - 32]); rect(g, '#f2f2f6', h.x - 3, h.y - 28, 6, 5); rect(g, '#1a1a20', h.x + 2, h.y - 3, 9, 7); line(g, '#1a1a20', 1, h.x - 14, h.y - 8, h.x + 14, h.y - 6); }
        if (i === 2) caption(g, '?', 222, 70, { size: 40, col: '#ffffff', shadow: '#2a4a6a' });
        g.restore();
        rect(g, 'rgba(0,0,0,0.7)', 0, 10, LW, 46);
        caption(g, 'КТО Я?', 160, 12, { size: 18, align: 'center', col: '#ffe840' });
        caption(g, ['версия 12: принцесса', 'версия 41: космическая пиратка', 'версия 67: ...'][i], 160, 33, { size: 15, align: 'center', col: '#ffffff' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'polaroid', ch: '', len: 3.6, light: '#ffd8b0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, 130, [[0, '#06081c'], [1, '#141a3a']]);
        for (let i = 0; i < 40; i++) { const x = (hx(i, 1, 93) * LW + t * 30 * (0.4 + hx(i, 2, 93))) % LW; rect(g, rgba('#e8f0ff', 0.4 + 0.6 * hx(i, 3, 93)), x, 8 + hx(i, 4, 93) * 116, 2, 1); }
        rect(g, '#3a2418', 0, 0, LW, 8); rect(g, '#3a2418', 0, 124, LW, 10);
        for (const [x, y, d] of [[0, 8, 1], [LW, 8, -1]]) for (let i = 0; i < 5; i++) poly(g, rgba('#d8f0ff', 0.6), [x, y + i * 6, x + d * (24 - i * 4), y, x, y + i * 6 + 10]);
        vgrad(g, 134, LH, [[0, '#5a3a2a'], [1, '#3a2418']]);
        lighter(g, () => glow(g, 60, 150, 90, '#ffc070', 0.3));
        for (const [x, y, r] of [[30, 160, -0.2], [74, 170, 0.15], [44, 196, 0.05]]) { g.save(); g.translate(x, y); g.rotate(r); rect(g, '#f2f0ea', -18, -20, 36, 42); rect(g, '#5a7aa8', -15, -17, 30, 28); g.restore(); }
        camera(g, 270, 196, 0);
        g.save(); g.translate(170, 158); g.rotate(-0.06);
        rect(g, '#d8d4cc', -54, -58, 112, 128); rect(g, '#fbf8f0', -56, -60, 112, 128);
        rect(g, '#20222a', -48, -52, 96, 86);
        g.save(); g.beginPath(); g.rect(-48, -52, 96, 86); g.clip();
        g.globalAlpha = sm(seg(t, 0.4, 2.6));
        vgrad(g, -52, 34, [[0, '#3a2a40'], [1, '#6a4a3a']], -48, 96);
        [['himeko', -30], ['welt', -10], ['danheng', 12], ['march', 32]].forEach(([id, x]) => G.drawFigure(g, X.lookOf(id), x, 40, 0.7));
        g.restore();
        caption(g, 'не забыть!', 0, 42, { size: 15, align: 'center', col: '#3a4a8a', shadow: false });
        g.restore();
      }
    }
  ];

  function cabbage(g, x, y, s, t, i) {
    const f = Math.sin(t * 16 + i) * 5 * s;
    poly(g, '#f2f2f6', [x - 8 * s, y - 2 * s, x - 22 * s, y - 10 * s - f, x - 12 * s, y + 4 * s]);
    poly(g, '#f2f2f6', [x + 8 * s, y - 2 * s, x + 22 * s, y - 10 * s - f, x + 12 * s, y + 4 * s]);
    ell(g, '#5aa83a', x, y, 11 * s, 10 * s); ell(g, '#8ad05a', x - 2 * s, y - 2 * s, 7 * s, 6 * s);
    line(g, '#3a7a2a', 1, x, y - 8 * s, x, y + 8 * s);
    rect(g, '#1a1a20', x - 4 * s, y - 2 * s, 2 * s, 2 * s); rect(g, '#1a1a20', x + 2 * s, y - 2 * s, 2 * s, 2 * s);
  }

  function hand(g, x, y, kind, col) {
    ell(g, col, x, y + 6, 14, 12);
    if (kind === 0) for (let i = 0; i < 4; i++) ell(g, G.dark(col, 0.15), x - 9 + i * 6, y - 4, 3.5, 4);
    if (kind === 1) for (let i = 0; i < 4; i++) rect(g, col, x - 11 + i * 6, y - 22, 5, 22);
    if (kind === 2) { g.save(); g.translate(x, y - 2); for (const a of [-0.3, 0.3]) { g.save(); g.rotate(a); rect(g, col, -2.5, -22, 5, 22); g.restore(); } g.restore(); }
    if (kind) rect(g, col, x + 10, y - 2, 8, 5);
  }

  SHOWS.kazuma = [
    {
      key: 'cabbage', ch: '13', len: 2.8, light: '#a0e070',
      fx: { noise: 0.07, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#70b8f0'], [1, '#c8e8ff']]);
        for (let i = 0; i < 6; i++) { const h = 40 + hx(i, 1, 94) * 30; rect(g, '#b89a7a', i * 56 - 4, 180 - h, 48, h); poly(g, '#a8402a', [i * 56 - 8, 180 - h, i * 56 + 20, 162 - h, i * 56 + 48, 180 - h]); }
        rect(g, '#7aa84a', 0, 176, LW, 64);
        for (let i = 0; i < 9; i++) { const ph = (t * 0.6 + i / 9) % 1; cabbage(g, ((i * 41 + t * 70) % 360) - 20, 40 + i * 9 + Math.sin(ph * 6 + i) * 10, 0.9 + (i % 3) * 0.2, t, i); }
        G.drawFigure(g, X.look, 150, 206, 1.2);
        g.save(); g.translate(176, 120); g.rotate(-0.6 + Math.sin(t * 5) * 0.4);
        rect(g, '#7a5a3a', -2, 0, 4, 54); g.strokeStyle = '#e8e4dc'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -14, 14, 18, 0, 0, Math.PI * 2); g.stroke();
        line(g, '#e8e4dc', 1, -14, -14, 14, -14); line(g, '#e8e4dc', 1, 0, -32, 0, 4);
        g.restore();
        rect(g, '#c8303a', 10, 10, 112, 20); caption(g, 'НОВОСТИ АКСЕЛЯ', 66, 13, { size: 12, align: 'center', shadow: false });
        rect(g, '#0c3a1a', 0, 210, LW, 30); rect(g, '#f2e060', 0, 210, 6, 30);
        caption(g, 'УРОЖАЙ КАПУСТЫ УЛЕТАЕТ!', 14, 215, { size: 17 });
      }
    },
    {
      key: 'rps', ch: '22', len: 3.0, light: '#ffd040',
      fx: { noise: 0.07, chroma: 2, wobble: 0.5, hum: 0.5 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a1a5a'], [1, '#5a2a7a']]);
        for (let i = 0; i < 16; i++) { const on = (Math.floor(t * 6) + i) % 2; ell(g, on ? '#f2e060' : '#6a5a2a', 10 + i * 20, 46, 4, 4); }
        caption(g, 'КАМЕНЬ, НОЖНИЦЫ, БУМАГА', 12, 10, { size: 16, col: '#f2e060', shadow: '#2a0a3a' });
        rect(g, '#3a2a6a', 30, 176, 90, 40); rect(g, '#3a2a6a', 200, 176, 90, 40); rect(g, '#f2e060', 30, 174, 90, 3); rect(g, '#f2e060', 200, 174, 90, 3);
        G.drawFigure(g, X.look, 75, 180, 1.1);
        G.drawFigure(g, X.lookOf('aqua'), 245, 180, 1.1, { flip: true });
        const round = Math.floor(t / 0.6), mine = round % 3, theirs = (mine + 2) % 3, pop = 1 + 0.25 * (1 - seg(t % 0.6, 0, 0.15));
        lighter(g, () => { glow(g, 116, 96, 26, '#f2e060', 0.4); glow(g, 204, 96, 26, '#ff8080', 0.3); });
        g.save(); g.translate(116, 100); g.scale(pop, pop); hand(g, 0, 0, mine, '#f2d0b0'); g.restore();
        g.save(); g.translate(204, 100); g.scale(pop, pop); hand(g, 0, 0, theirs, '#f8e0d0'); g.restore();
        rect(g, '#0a0a14', 110, 140, 100, 30); g.strokeStyle = '#f2e060'; g.strokeRect(110, 140, 100, 30);
        caption(g, (6 + round) + ' : 0', 160, 145, { size: 18, align: 'center', col: '#f2e060', shadow: false });
        rect(g, '#14081e', 0, 218, LW, 22);
        caption(g, 'КАЗУМА', 75, 220, { size: 15, align: 'center', col: '#a0e070' }); caption(g, 'АКВА', 245, 220, { size: 15, align: 'center', col: '#80c8ff' });
        if (t > 2.2) caption(g, '«Нечестно!»', 245, 64, { size: 15, align: 'center', col: '#ffffff' });
      }
    },
    {
      key: 'room', ch: '', len: 3.6, light: '#7090d8',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, LH, [[0, '#14162a'], [1, '#0a0a14']]);
        rect(g, '#1a2a5a', 210, 24, 90, 70); for (let i = 0; i < 18; i++) rect(g, rgba('#ffd890', 0.6 * hx(i, 1, 95)), 214 + hx(i, 2, 95) * 82, 50 + hx(i, 3, 95) * 40, 3, 2);
        rect(g, '#3a3a4a', 210, 24, 90, 3); rect(g, '#3a3a4a', 253, 24, 3, 70); rect(g, '#3a3a4a', 210, 92, 90, 3);
        rect(g, '#2a2a3a', 30, 30, 50, 66); rect(g, '#c83a5a', 34, 34, 42, 58); ell(g, '#f2e0d0', 55, 56, 10, 10); poly(g, '#3a5ab0', [40, 92, 70, 92, 62, 66, 48, 66]);
        rect(g, '#3a2a20', 20, 150, 150, 8); rect(g, '#2a1e18', 26, 158, 6, 60); rect(g, '#2a1e18', 158, 158, 6, 60);
        rect(g, '#1a1a20', 60, 96, 70, 52); rect(g, '#2a4a8a', 64, 100, 62, 42); rect(g, '#1a1a20', 88, 148, 14, 4);
        lighter(g, () => glow(g, 95, 120, 70, '#6a90ff', 0.35 + 0.05 * Math.sin(t * 7)));
        caption(g, 'ОФЛАЙН', 95, 114, { size: 13, align: 'center', col: '#c8d8ff', shadow: false });
        rect(g, '#3a3a6a', 180, 172, 140, 40); rect(g, '#5a5a8a', 180, 168, 140, 8);
        g.save(); g.translate(244, 156); g.rotate(-0.12); g.scale(1.4, 1.4);
        rect(g, '#14141c', -28, -18, 58, 38); rect(g, '#d8303a', -26, -16, 54, 14);
        caption(g, '1-Й ВЫПУСК', 1, -15, { size: 11, align: 'center', col: '#ffffff', shadow: false });
        caption(g, 'ОНЛАЙН-ИГРА', 1, 2, { size: 10, align: 'center', col: '#f2e060', shadow: false });
        const sh = (t * 0.4) % 1; lighter(g, () => line(g, rgba('#ffffff', 0.6), 2, -28 + sh * 70, -18, -40 + sh * 70, 20));
        g.restore();
        rect(g, '#3a2e26', 176, 110, 6, 60); rect(g, '#3a2e26', 150, 140, 32, 6);
        poly(g, '#2a8a3a', [160, 104, 196, 104, 194, 146, 162, 146]); poly(g, '#2a8a3a', [160, 106, 148, 110, 146, 150, 156, 150]); poly(g, '#2a8a3a', [196, 106, 206, 110, 206, 150, 196, 150]);
        rect(g, '#f2f2f6', 150, 112, 2, 36); rect(g, '#f2f2f6', 202, 112, 2, 36); line(g, '#1a5a2a', 1, 178, 104, 178, 146); poly(g, '#1e6a2e', [170, 104, 186, 104, 178, 112]);
        caption(g, '19:42', 150, 70, { size: 14, col: '#ff4040', shadow: false });
      }
    }
  ];

  function fountain(g, x, y, t) {
    ell(g, '#8a94a8', x, y, 52, 10); ell(g, '#5a7ab0', x, y - 2, 46, 7);
    rect(g, '#a8b0c0', x - 6, y - 40, 12, 38); ell(g, '#a8b0c0', x, y - 40, 18, 5);
    for (let i = 0; i < 6; i++) { const ph = (t * 1.2 + i / 6) % 1, d = i % 2 ? 1 : -1; ell(g, rgba('#c8e0ff', 0.8 * (1 - ph)), x + d * ph * 30, y - 44 + ph * ph * 40 - ph * 20, 2, 2); }
  }

  SHOWS.sampo = [
    {
      key: 'interview', ch: '05', len: 2.8, light: '#a0c0ff',
      fx: { noise: 0.07, ghost: 0.2, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#5a6a88'], [1, '#9aa4b8']]);
        for (let i = 0; i < 7; i++) { const h = 60 + hx(i, 1, 96) * 40; rect(g, '#3a4460', i * 48 - 4, 130 - h, 44, h + 20); for (let w = 0; w < 4; w++) rect(g, rgba('#ffd890', 0.5), i * 48 + 4 + (w % 2) * 18, 140 - h + Math.floor(w / 2) * 16, 7, 8); }
        rect(g, '#7a8498', 0, 140, LW, 100);
        fountain(g, 160, 150, t);
        G.drawFigure(g, X.look, 160 + Math.sin(t * 3) * 6, 152, 0.75);
        if (Math.floor(t * 3) % 2) line(g, '#f2d8c8', 3, 170 + Math.sin(t * 3) * 6, 100, 178 + Math.sin(t * 3) * 6, 88);
        G.drawFigure(g, X.lookOf('townswoman'), 80, 212, 1.25);
        rect(g, '#1a1a20', 98, 128, 4, 18); ell(g, '#3a3a44', 100, 126, 5, 6);
        G.drawFigure(g, X.lookOf('townsman'), 240, 212, 1.25, { flip: true });
        const rage = Math.abs(Math.sin(t * 12)) * 2;
        lighter(g, () => glow(g, 240, 100, 26, '#ff4030', 0.35));
        for (let i = 0; i < 3; i++) { const ph = (t * 1.5 + i / 3) % 1; ell(g, rgba('#ffffff', 0.6 * (1 - ph)), 230 + i * 10 + rage, 80 - ph * 26, 3 + ph * 4, 2 + ph * 3); }
        rect(g, '#c81e28', 10, 10, 112, 20); caption(g, 'ПРЯМОЙ ЭФИР', 66, 13, { size: 13, align: 'center', shadow: false });
        rect(g, '#0c1e5a', 0, 186, 250, 22); caption(g, 'КРИСТАЛЬНЫЕ ВЕДОМОСТИ', 10, 189, { size: 15 });
        rect(g, 'rgba(0,0,0,0.75)', 0, 212, LW, 28);
        caption(g, '«Этот синеволосый гад!..»', 160, 217, { size: 16, align: 'center' });
      }
    },
    {
      key: 'wanted', ch: '01', len: 3.0, light: '#e8d8a0',
      fx: { noise: 0.06, chroma: 1, wobble: 0.3, hum: 0.6 },
      paint(g, t, X) {
        rect(g, '#2a3450', 0, 0, LW, LH);
        rect(g, '#e8dcc0', 20, 24, 150, 190); rect(g, '#c8bca0', 20, 24, 150, 4);
        caption(g, 'РОЗЫСК', 95, 32, { size: 22, align: 'center', col: '#a81e1e', shadow: false });
        rect(g, '#3a3a44', 40, 62, 110, 110);
        G.drawPortrait(g, X.look, 59, 72, 72);
        g.globalCompositeOperation = 'saturation'; rect(g, '#808080', 40, 62, 110, 110);
        g.globalCompositeOperation = 'source-over';
        const v = Math.floor(t / 0.75) % 4;
        if (v === 1) { rect(g, '#1a1a20', 66, 66, 58, 8); rect(g, '#1a1a20', 76, 50, 38, 18); }
        if (v === 2) { poly(g, '#3a2a1a', [80, 120, 95, 114, 110, 120, 104, 124, 95, 120, 86, 124]); }
        if (v === 3) { ell(g, '#d8b050', 95, 82, 40, 22); for (let i = 0; i < 8; i++) ell(g, '#c8a040', 60 + i * 10, 96 + (i % 2) * 4, 6, 8); }
        caption(g, 'НАГРАДА', 95, 180, { size: 15, align: 'center', col: '#3a2a1a', shadow: false });
        G.drawFigure(g, X.lookOf('guard'), 262, 214, 1.15);
        caption(g, 'ПРИМЕТЫ:', 182, 54, { size: 15, col: '#f2e8c8' });
        caption(g, 'синие волосы', 182, 74, { size: 14, col: '#c8d8f0', bold: false });
        caption(g, '(или парик)', 182, 92, { size: 14, col: '#c8d8f0', bold: false });
        rect(g, 'rgba(0,0,0,0.75)', 0, 214, LW, 26);
        caption(g, '«У вас дома есть парики?»', 160, 218, { size: 15, align: 'center' });
      }
    },
    {
      key: 'bread', ch: '', len: 3.6, light: '#ffb060',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, LH, [[0, '#1a140e'], [1, '#2a1e14']]);
        for (let i = 0; i < 6; i++) poly(g, '#140e0a', [i * 60 - 10, 0, i * 60 + 40, 0, i * 60 + 16, 24 + hx(i, 1, 97) * 20]);
        const fl = 0.9 + 0.1 * Math.sin(t * 7) + 0.05 * Math.sin(t * 13);
        rect(g, '#d8d0b8', 54, 92, 10, 28); ell(g, '#ffd080', 59, 88, 4, 7 * fl);
        lighter(g, () => glow(g, 59, 96, 90 * fl, '#ffb050', 0.5));
        rect(g, '#4a3424', 0, 140, LW, 100); rect(g, '#5a4230', 0, 138, LW, 4);
        ell(g, '#e8dcc0', 168, 182, 130, 30);
        const days = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'], k = seg(t, 0.3, 1.6);
        days.forEach((d, i) => {
          const x = 70 + i * 32, y = 178 + (i % 2) * 6, sp = (i - 3) * 6 * k;
          ell(g, '#b8803a', x + sp, y, 11, 8); ell(g, '#d8a860', x + sp - 2, y - 2, 7, 5);
          caption(g, d, x + sp, y + 10, { size: 12, align: 'center', col: '#5a4030', shadow: false });
        });
        for (let i = 0; i < 4; i++) { rect(g, '#5a8ab0', 250 + i * 12, 100, 8, 26); rect(g, '#f2f2f6', 251 + i * 12, 106, 6, 6); rect(g, '#2a2a30', 250 + i * 12, 96, 8, 4); }
        caption(g, 'для Н.', 270, 130, { size: 12, align: 'center', col: '#c8b8a0', shadow: false });
      }
    }
  ];

  function dog(g, x, y, s, t, o = {}) {
    const lift = o.lift || 0, wag = Math.sin(t * (o.wag || 10)) * 0.5;
    g.save(); g.translate(x + 26 * s, y - 8 * s); g.rotate(-0.6 + wag); ell(g, '#e8e4dc', 0, -8 * s, 4 * s, 10 * s); g.restore();
    ell(g, '#eeeae2', x, y - 10 * s, 26 * s, 14 * s); ell(g, '#9a948a', x + 8 * s, y - 16 * s, 10 * s, 6 * s);
    const hx0 = x - 24 * s, hy0 = y - 16 * s - lift * 14 * s;
    ell(g, '#f2eee6', hx0, hy0, 14 * s, 12 * s);
    ell(g, '#6a6258', hx0 - 11 * s, hy0 + 2 * s, 5 * s, 9 * s); ell(g, '#6a6258', hx0 + 11 * s, hy0 + 2 * s, 5 * s, 9 * s);
    ell(g, '#1a1a1e', hx0, hy0 + 6 * s, 3 * s, 2.4 * s);
    if (o.closed) { line(g, '#1a1a1e', 1.5, hx0 - 7 * s, hy0 - 1 * s, hx0 - 3 * s, hy0); line(g, '#1a1a1e', 1.5, hx0 + 3 * s, hy0, hx0 + 7 * s, hy0 - 1 * s); }
    else { ell(g, '#1a1a1e', hx0 - 5 * s, hy0 - 1 * s, 2 * s, 2.4 * s); ell(g, '#1a1a1e', hx0 + 5 * s, hy0 - 1 * s, 2 * s, 2.4 * s); }
    if (o.tongue) ell(g, '#e87890', hx0 - 2 * s, hy0 + 11 * s, 3 * s, 4 * s);
  }

  function frisbee(g, x, y, a) {
    lighter(g, () => glow(g, x, y, 14, '#60e0ff', 0.7 * a));
    ell(g, rgba('#a0f0ff', a), x, y, 9, 3);
  }

  SHOWS.arlan = [
    {
      key: 'findpeppy', ch: '19', len: 2.8, light: '#80c0ff',
      fx: { noise: 0.06, ghost: 0.16, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#1a2a4a'], [1, '#2a3a5a']]);
        for (let i = 0; i < 5; i++) rect(g, '#2a3a5a', i * 70, 40, 4, 140);
        rect(g, '#14203a', 0, 30, LW, 10); rect(g, '#3a4a6a', 0, 180, LW, 60);
        for (const [x, w, h] of [[30, 50, 40], [96, 40, 56], [226, 60, 44], [270, 40, 30]]) { rect(g, '#5a5a6a', x, 180 - h, w, h); rect(g, '#7a7a8a', x, 180 - h, w, 3); rect(g, '#f2c040', x + 4, 186 - h, 10, 3); }
        rect(g, '#3a6a3a', 190, 140, 20, 40); ell(g, '#5aa84a', 200, 130, 18, 16);
        const found = t > 1.6;
        if (!found) { g.save(); g.translate(138, 172); g.rotate(-0.6 + Math.sin(t * 10) * 0.4); ell(g, '#e8e4dc', 0, -6, 4, 8); g.restore(); }
        else dog(g, 150, 182, 0.8, t, { tongue: true });
        const mx = found ? 136 : 60 + ((t * 120) % 200), my = found ? 162 : 120 + Math.sin(t * 3) * 20;
        g.strokeStyle = '#f2e060'; g.lineWidth = 3; g.beginPath(); g.arc(mx, my, 20, 0, Math.PI * 2); g.stroke(); line(g, '#f2e060', 4, mx + 14, my + 14, mx + 28, my + 28);
        G.drawFigure(g, X.look, 270, 214, 1.15, { flip: true });
        rect(g, '#c8303a', 10, 8, 140, 22); caption(g, 'НАЙДИ ПЕППИ', 80, 11, { size: 15, align: 'center', shadow: false });
        rect(g, '#0c1e3a', 0, 214, LW, 26);
        caption(g, found ? 'ПОБЕДА АРЛАНА: 9 ИЗ 9' : 'ВЫПУСК 9 · ПОИСК...', 12, 218, { size: 16, col: found ? '#f2e060' : '#c8d8f0' });
      }
    },
    {
      key: 'cameras', ch: '04', len: 3.0, light: '#70a0e0',
      fx: { noise: 0.08, chroma: 1, wobble: 0.3, hum: 0.6 },
      paint(g, t, X) {
        rect(g, '#05080e', 0, 0, LW, LH);
        const cells = [[6, 6], [162, 6], [6, 122], [162, 122]], cw = 152, ch = 112;
        cells.forEach(([x, y], i) => {
          g.save(); g.beginPath(); g.rect(x, y, cw, ch); g.clip();
          vgrad(g, y, y + ch, [[0, '#3a5478'], [1, '#22324e']], x, cw);
          poly(g, '#4a6488', [x, y + ch, x + cw, y + ch, x + cw * 0.7, y + ch * 0.45, x + cw * 0.3, y + ch * 0.45]);
          rect(g, '#5a7098', x + cw * 0.3, y + ch * 0.2, cw * 0.4, ch * 0.25);
          for (let k = 0; k < 3; k++) rect(g, rgba('#a8d0ff', 0.4), x + cw * 0.32 + k * cw * 0.12, y + 6, cw * 0.06, 3);
          if (i === 3) {
            G.drawFigure(g, X.look, x + 46, y + ch - 6, 0.75);
            const ph = (t * 0.7) % 1, fx = lerp(x + 58, x + 120, ph), fy = y + 50 - Math.sin(ph * Math.PI) * 30;
            frisbee(g, fx, fy, 1);
            dog(g, lerp(x + 140, x + 112, seg(ph, 0.6, 1)), y + ch - 6 - Math.abs(Math.sin(ph * Math.PI * 2)) * 12 * seg(ph, 0.6, 1), 0.5, t, { tongue: true, wag: 18 });
          }
          g.globalCompositeOperation = 'saturation'; rect(g, '#808080', x, y, cw, ch);
          g.globalCompositeOperation = 'multiply'; rect(g, '#d0e4ff', x, y, cw, ch);
          g.globalCompositeOperation = 'source-over';
          caption(g, 'КАМ ' + (i + 1), x + 6, y + 4, { size: 11, col: '#c8e0ff' });
          g.restore();
          g.strokeStyle = i === 3 && Math.floor(t * 3) % 2 ? '#f2e060' : '#3a4a6a'; g.lineWidth = 2; g.strokeRect(x, y, cw, ch);
        });
        caption(g, '02:47', 306, 218, { size: 13, align: 'right', col: '#c8e0ff' });
      }
    },
    {
      key: 'puppy', ch: '', len: 3.6, light: '#ffc080',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, LH, [[0, '#3a2418'], [1, '#1e120c']]);
        rect(g, '#5a2a2a', 0, 0, LW, 90); for (let i = 0; i < 8; i++) rect(g, '#6a3434', 10 + i * 40, 0, 2, 90);
        rect(g, '#d8b050', 0, 88, LW, 4);
        lighter(g, () => glow(g, 260, 50, 100, '#ffc070', 0.45));
        ell(g, '#8a3a4a', 150, 196, 150, 50); ell(g, '#a84a5a', 150, 190, 140, 42);
        const lift = sm(seg(t, 1.2, 2.0));
        dog(g, 150, 200, 1.6, t, { lift, closed: lift < 0.5, tongue: t > 2.1 && Math.floor(t * 5) % 2 === 0, wag: lift > 0.5 ? 9 : 0.5 });
        const reach = eOut(seg(t, 0.3, 1.2));
        g.save(); g.translate(lerp(-40, 84, reach), 200);
        rect(g, '#3a3a4a', -170, -11, 150, 22); rect(g, '#f2f2f6', -24, -12, 6, 24);
        ell(g, '#e8c0a0', -6, 0, 16, 11);
        for (let i = 0; i < 4; i++) ell(g, '#e8c0a0', 12 + (i === 0 ? -4 : 0), -8 + i * 5, 8, 3);
        g.restore();
      }
    }
  ];

  function flap(g, x, y, s, t, flip) {
    const n = s.length;
    for (let i = 0; i < n; i++) {
      const cx = x + i * 13, spin = flip > 0 && hx(i, Math.floor(t * 12), 98) < flip;
      rect(g, '#14141a', cx, y, 12, 18); rect(g, '#000000', cx, y + 8, 12, 1);
      const ch = spin ? 'АБВГДЕЖЗИКЛМНОПРСТУ'[Math.floor(hx(i, Math.floor(t * 20), 99) * 19)] : s[i];
      caption(g, ch, cx + 6, y + 1, { size: 14, align: 'center', col: '#f2e8a0', shadow: false });
    }
  }

  SHOWS.danheng = [
    {
      key: 'database', ch: '16', len: 2.8, light: '#70e0a0',
      fx: { noise: 0.06, ghost: 0.15, chroma: 1, wobble: 0.4 },
      paint(g, t) {
        rect(g, '#04120a', 0, 0, LW, LH);
        caption(g, 'БАЗА ДАННЫХ ЭКСПРЕССА', 12, 10, { size: 16, col: '#70f0a0', shadow: false });
        line(g, '#2a8a4a', 1, 12, 32, 240, 32);
        const nodes = [['Ярило-VI', 60, 70], ['«Герта»', 230, 66], ['Стелларон', 150, 120], ['Лофу', 70, 170], ['Экспресс', 240, 168]];
        const links = [[0, 2], [1, 2], [2, 4], [3, 2], [3, 4], [0, 4]], k = seg(t, 0.3, 2.2) * links.length;
        links.forEach(([a, b], i) => { const f = Math.min(1, Math.max(0, k - i)); if (f <= 0) return; const [, x0, y0] = nodes[a], [, x1, y1] = nodes[b]; line(g, '#40c070', 2, x0, y0, lerp(x0, x1, f), lerp(y0, y1, f)); });
        nodes.forEach(([n, x, y], i) => { const on = k > i * 0.9; lighter(g, () => glow(g, x, y, 16, '#40f080', on ? 0.6 : 0.15)); ell(g, on ? '#a0ffc0' : '#2a6a40', x, y, 5, 5); caption(g, n, x, y + 8, { size: 13, align: 'center', col: on ? '#a0ffc0' : '#3a7a50', shadow: false }); });
        caption(g, 'записей: ' + (1024 + Math.floor(t * 40)), 12, LH - 22, { size: 13, col: '#70f0a0', shadow: false });
        if (Math.floor(t * 3) % 2) rect(g, '#70f0a0', 130, LH - 22, 8, 14);
      }
    },
    {
      key: 'spaceport', ch: '28', len: 3.0, light: '#f2e8a0',
      fx: { noise: 0.07, chroma: 1, wobble: 0.4, hum: 0.6 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#1a1e2a'], [1, '#2a2e3a']]);
        rect(g, '#0a0a10', 14, 14, 292, 118); rect(g, '#3a3a48', 14, 14, 292, 3);
        caption(g, 'ОТПРАВЛЕНИЕ', 22, 18, { size: 13, col: '#c8c8d8', shadow: false });
        const rows = [['ЛОФУ', 'ОТМЕНЁН'], ['МАСКИ', 'ПОСАДКА'], ['КУДА УГОДНО', 'ПОСАДКА']];
        rows.forEach(([a, b], i) => { flap(g, 22, 40 + i * 28, a, t, i === 2 ? 1 - seg(t, 0.4, 1.4) : 0); caption(g, b, 296, 42 + i * 28, { size: 13, align: 'right', col: i === 0 ? '#ff6060' : '#60f080', shadow: false }); });
        rect(g, '#3a3e4a', 0, 196, LW, 44);
        for (let i = 0; i < 6; i++) { const x = ((i * 60 + t * 20) % 380) - 30; G.drawFigure(g, X.lookOf(i % 2 ? 'townsman' : 'townswoman'), x, 212, 0.75); }
        const walk = seg(t, 0.4, 2.8);
        G.drawFigure(g, X.look, lerp(30, 250, walk), 222, 1.05);
      }
    },
    {
      key: 'dawn', ch: '', len: 3.6, light: '#ffc890',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const sun = sm(seg(t, 0, 3.0));
        vgrad(g, 0, LH, [[0, '#1a1a2a'], [1, '#2a2218']]);
        g.save(); g.globalAlpha = sun; vgrad(g, 0, LH, [[0, '#4a3a3a'], [1, '#6a4a2a']]); g.restore();
        rect(g, '#0e1020', 196, 20, 100, 80);
        g.save(); g.globalAlpha = sun; vgrad(g, 20, 100, [[0, '#ffb070'], [1, '#ffe0b0']], 196, 100); g.restore();
        rect(g, '#3a2a20', 196, 20, 100, 4); rect(g, '#3a2a20', 244, 20, 4, 80); rect(g, '#3a2a20', 196, 98, 100, 4);
        lighter(g, () => poly(g, rgba('#ffd8a0', 0.25 * sun), [196, 100, 296, 100, 220, 240, 60, 240]));
        for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) rect(g, ['#7a3a2a', '#2a4a6a', '#5a5a3a', '#3a2a4a'][(r + i) % 4], 14 + i * 18, 24 + r * 34, 14, 28);
        rect(g, '#2a1e18', 0, 150, LW, 90);
        rect(g, '#d8d0c0', 40, 186, 170, 22); rect(g, '#8a8aa8', 40, 196, 60, 12);
        g.save(); g.translate(206, 196); g.rotate(-Math.PI / 2); G.drawFigure(g, X.look, 0, 0, 1.05); g.restore();
        rect(g, '#5a4a6a', 136, 188, 78, 18); rect(g, '#6a5a7a', 136, 188, 78, 3);
        for (let i = 0; i < 5; i++) rect(g, ['#7a3a2a', '#2a4a6a', '#5a5a3a'][i % 3], 220 + i * 4, 210 - i * 8, 30, 8);
        const peek = sm(seg(t, 1.6, 2.4));
        rect(g, '#3a2a20', 290, 104, 30, 90);
        if (peek > 0) { g.save(); g.beginPath(); g.rect(260, 100, 30, 100); g.clip(); G.drawFigure(g, X.lookOf('pompom'), lerp(310, 284, peek), 196, 1.0); g.restore(); }
        for (let i = 0; i < 3; i++) { const ph = (t * 0.35 + i / 3) % 1; caption(g, 'z', 70 - ph * 10, 176 - ph * 30, { size: 12 + ph * 6, col: rgba('#f2e8d8', (1 - ph) * (1 - peek)), shadow: false }); }
      }
    }
  ];

  function bubble(g, x, y, s, a, tail) {
    if (a <= 0) return;
    const w = textWidth(g, s, 13) + 14;
    g.save(); g.globalAlpha = a;
    rect(g, '#fbf8f0', x - w / 2, y, w, 22); poly(g, '#fbf8f0', [x - 5, y + 22, x + 5, y + 22, x + tail, y + 30]);
    caption(g, s, x, y + 4, { size: 13, align: 'center', col: '#2a1a1a', shadow: false });
    g.restore();
  }

  function telescope(g, x, y, s, ang, col) {
    g.save(); g.translate(x, y);
    line(g, '#3a2a20', 3 * s, 0, 0, -12 * s, 30 * s); line(g, '#3a2a20', 3 * s, 0, 0, 12 * s, 30 * s); line(g, '#3a2a20', 3 * s, 0, 0, 0, 30 * s);
    g.rotate(ang); rect(g, col, -6 * s, -5 * s, 40 * s, 10 * s); rect(g, G.light(col, 0.3), 30 * s, -6 * s, 8 * s, 12 * s); rect(g, G.dark(col, 0.3), -12 * s, -3 * s, 8 * s, 6 * s);
    g.restore();
  }

  SHOWS.asta = [
    {
      key: 'society', ch: '07', len: 2.8, light: '#f2c890',
      fx: { noise: 0.06, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#5a2a2a'], [1, '#2a1414']]);
        for (let i = 0; i < 5; i++) { rect(g, '#7a3a34', 20 + i * 64, 30, 40, 130); rect(g, '#d8b050', 20 + i * 64, 30, 40, 3); }
        lighter(g, () => { for (let i = 0; i < 3; i++) glow(g, 60 + i * 100, 30, 40, '#ffe0a0', 0.4); });
        rect(g, '#3a1a1a', 0, 170, LW, 70);
        G.drawFigure(g, X.look, 160, 206, 1.25);
        const rel = [['townsman', 50], ['townswoman', 104], ['townsman', 268]];
        rel.forEach(([id, x], i) => G.drawFigure(g, X.lookOf(id), x, 206, 1.05, { flip: x > 160 }));
        const lines = ['Нельзя так!', 'Скажи иначе!', 'Нет, вот так!'];
        lines.forEach((s, i) => bubble(g, [56, 116, 262][i], [34, 74, 40][i], s, seg(t, 0.3 + i * 0.4, 0.45 + i * 0.4), [-6, -4, 6][i]));
        rect(g, '#14081e', 0, 210, LW, 30); rect(g, '#d8b050', 0, 210, 6, 30);
        caption(g, 'СВЕТСКАЯ ХРОНИКА', 14, 216, { size: 17, col: '#f2d8a0' });
      }
    },
    {
      key: 'observatory', ch: '33', len: 3.0, light: '#a080ff',
      fx: { noise: 0.06, chroma: 1, wobble: 0.3, hum: 0.5 },
      paint(g, t, X) {
        rect(g, '#04030c', 0, 0, LW, LH);
        lighter(g, () => { glow(g, 150, 120, 120, '#7a50d8', 0.75); glow(g, 116, 98, 70, '#e070b0', 0.6); glow(g, 196, 142, 80, '#50a0ff', 0.6); glow(g, 150, 120, 30, '#ffffff', 0.5); });
        for (let i = 0; i < 70; i++) rect(g, rgba('#e8f0ff', 0.3 + 0.7 * hx(i, 1, 100)), hx(i, 2, 100) * LW, hx(i, 3, 100) * LH, 1, 1);
        const lock = eOut(seg(t, 0.2, 1.2)), cx = lerp(240, 150, lock), cy = lerp(60, 120, lock);
        g.strokeStyle = '#a0f0c0'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 30, 0, Math.PI * 2); g.stroke();
        line(g, '#a0f0c0', 1, cx - 44, cy, cx - 34, cy); line(g, '#a0f0c0', 1, cx + 34, cy, cx + 44, cy); line(g, '#a0f0c0', 1, cx, cy - 44, cx, cy - 34); line(g, '#a0f0c0', 1, cx, cy + 34, cx, cy + 44);
        caption(g, 'ТЕЛЕСКОП «НЬЮЛ ИМАН»', 12, 10, { size: 14, col: '#a0f0c0', shadow: false });
        if (t > 1.2) caption(g, 'ПРЕДЗВЁЗДНОЕ ОБЛАКО · 100 А.Е.', 12, 28, { size: 12, col: '#a0f0c0', shadow: false });
        const pip = eOut(seg(t, 1.6, 1.9));
        if (pip > 0) {
          const px = 200, py = 136 + (1 - pip) * 120;
          rect(g, '#a0f0c0', px - 2, py - 2, 108, 84); rect(g, '#14203a', px, py, 104, 80);
          rect(g, '#2a3a5a', px, py + 50, 104, 30); rect(g, '#3a4a6a', px + 60, py + 22, 30, 28);
          G.drawFigure(g, X.look, px + 36, py + 76, 0.6);
          if (Math.floor(t * 2) % 2) ell(g, '#ff3030', px + 96, py + 8, 3, 3);
          caption(g, 'КАМ: НАБЛЮДЕНИЕ', px + 4, py + 2, { size: 9, col: '#a0f0c0', shadow: false });
        }
      }
    },
    {
      key: 'balcony', ch: '', len: 3.6, light: '#b0c0ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, 160, [[0, '#06081c'], [1, '#1a2244']]);
        for (let i = 0; i < 60; i++) { const tw = 0.5 + 0.5 * Math.sin(t * (1 + hx(i, 4, 101) * 3) + i); rect(g, rgba('#f2f4ff', (0.3 + 0.7 * hx(i, 1, 101)) * tw), hx(i, 2, 101) * LW, hx(i, 3, 101) * 140, hx(i, 5, 101) > 0.9 ? 2 : 1, 1); }
        const shoot = seg(t, 2.0, 2.5);
        if (shoot > 0 && shoot < 1) lighter(g, () => line(g, rgba('#ffffff', 1 - shoot), 2, 80 + shoot * 120, 30 + shoot * 40, 60 + shoot * 120, 20 + shoot * 40));
        rect(g, '#4a3a30', 0, 0, 70, 200); rect(g, '#ffd890', 12, 30, 44, 70); rect(g, '#4a3a30', 32, 30, 4, 70);
        lighter(g, () => glow(g, 34, 66, 70, '#ffc070', 0.5));
        for (let i = 0; i < 3; i++) ell(g, '#2a2020', 22 + i * 12, 86, 4, 5);
        rect(g, '#5a4a40', 60, 186, LW, 6); for (let i = 0; i < 14; i++) rect(g, '#5a4a40', 66 + i * 18, 160, 4, 30); rect(g, '#6a5a50', 60, 156, LW, 6);
        rect(g, '#3a2e28', 0, 192, LW, 48);
        G.drawFigure(g, X.look, 150, 200, 0.85);
        telescope(g, 196, 150, 1.1, -0.7, '#c8a050');
      }
    }
  ];

  SHOWS.herta = [
    {
      key: 'interview', ch: '83', len: 3.0, light: '#c8a0ff',
      fx: { noise: 0.06, ghost: 0.16, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a1a4a'], [1, '#14102a']]);
        for (let i = 0; i < 6; i++) ring(g, rgba('#8a6ad8', 0.35 - i * 0.05), 3, 220, 90, 20 + i * 22);
        lighter(g, () => glow(g, 160, 0, 120, '#f0e0ff', 0.3));
        rect(g, '#3a2a5a', 100, 160, 200, 12); rect(g, '#d8c8f8', 100, 158, 200, 3);
        G.drawFigure(g, X.lookOf('townsman'), 66, 214, 1.25);
        line(g, '#2a2a30', 3, 80, 128, 104, 110); ell(g, '#3a3a44', 106, 108, 5, 6);
        G.drawFigure(g, X.look, 222, 172, 1.3, { flip: true });
        rect(g, 'rgba(0,0,0,0.75)', 0, 196, LW, 44);
        const q = t < 1.5;
        caption(g, q ? '«Что побудило вас' : '«Мне стало некуда', 160, 199, { size: 15, align: 'center', col: q ? '#c8d8f0' : '#ffffff' });
        caption(g, q ? 'создать этот оазис?»' : 'складывать вещи».', 160, 218, { size: 15, align: 'center', col: q ? '#c8d8f0' : '#ffffff' });
        caption(g, 'ОБЩЕСТВО ГЕНИЕВ · № 83', 12, 10, { size: 14, col: '#d8c8f8' });
      }
    },
    {
      key: 'puppets', ch: '9', len: 3.0, light: '#a0a8ff',
      fx: { noise: 0.07, chroma: 1, wobble: 0.3, hum: 0.5 },
      paint(g, t, X) {
        rect(g, '#05040c', 0, 0, LW, LH);
        const bgs = ['#3a2a5a', '#2a3a5a', '#4a2a3a', '#2a4a3a', '#3a3a2a', '#2a4a4a'];
        const say = ['Нет, спасибо.', 'Не-а.', 'Скучно.', 'До свидания.', 'Продолжайте.', 'Неинтересно.'];
        for (let i = 0; i < 6; i++) {
          const x = 4 + (i % 3) * 105, y = 4 + Math.floor(i / 3) * 117, on = t > i * 0.25;
          g.save(); g.beginPath(); g.rect(x, y, 102, 113); g.clip();
          vgrad(g, y, y + 113, [[0, bgs[i]], [1, G.dark(bgs[i], 0.5)]], x, 102);
          rect(g, G.dark(bgs[i], 0.3), x, y + 92, 102, 21);
          if (on) G.drawFigure(g, X.look, x + 51, y + 114, 0.95);
          if (on) { rect(g, 'rgba(0,0,0,0.6)', x, y, 102, 20); caption(g, say[i], x + 51, y + 3, { size: 13, align: 'center', col: '#ffffff', shadow: false }); }
          g.restore();
          g.strokeStyle = '#6a5a9a'; g.lineWidth = 2; g.strokeRect(x, y, 102, 113);
        }
      }
    },
    {
      key: 'manuscript', ch: '', len: 3.6, light: '#ffd8a8',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, LH, [[0, '#1a1428'], [1, '#0e0a16']]);
        lighter(g, () => glow(g, 250, 60, 110, '#ffd8a0', 0.45));
        rect(g, '#2a2034', 236, 30, 4, 50); poly(g, '#3a2e48', [222, 30, 254, 30, 246, 14, 230, 14]);
        rect(g, '#3a2a24', 0, 120, LW, 120);
        g.save(); g.translate(150, 172); g.rotate(-0.05);
        rect(g, '#d8d0c0', -98, -64, 200, 130); rect(g, '#fbf6ea', -100, -66, 200, 130);
        caption(g, 'Глава 2', -84, -58, { size: 17, italic: true, bold: false, col: '#2a2440', shadow: false });
        for (let i = 0; i < 4; i++) { const w = [150, 160, 120, 140][i]; g.strokeStyle = '#3a3460'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= w; x += 4) { const y = -30 + i * 20 + Math.sin(x * 0.5 + i) * 2; if (x) g.lineTo(-84 + x, y); else g.moveTo(-84, y); } g.stroke(); }
        const k = seg(t, 0.4, 2.0), w = 130 * k;
        g.strokeStyle = '#3a3460'; g.lineWidth = 2; g.beginPath();
        for (let x = 0; x <= w; x += 4) { const y = 50 + Math.sin(x * 0.5 + 7) * 2; if (x) g.lineTo(-84 + x, y); else g.moveTo(-84, y); }
        g.stroke();
        if (t > 2.4) line(g, '#a8303a', 2, -86, 50 + (t > 2.6 ? 0 : 4), lerp(-86, 50, seg(t, 2.4, 2.8)), 48);
        g.restore();
        const px = 66 + (t < 2.0 ? 130 * seg(t, 0.4, 2.0) : 130), py = 222;
        g.save(); g.translate(px, py); g.rotate(-0.7); rect(g, '#1a1a24', -2, -40, 5, 42); poly(g, '#d8b050', [-2, 2, 3, 2, 0, 8]); g.restore();
        ell(g, '#1a1a24', 280, 200, 14, 6); rect(g, '#1a1a24', 268, 186, 24, 14);
      }
    }
  ];

  function guitar(g, x, y, ang, col) {
    g.save(); g.translate(x, y); g.rotate(ang);
    ell(g, col, 0, 0, 14, 10); ell(g, col, -12, 0, 10, 8); ell(g, '#1a1a20', 2, 0, 3, 3);
    rect(g, '#3a2a20', 10, -2, 36, 4); rect(g, '#1a1a20', 44, -4, 8, 8);
    g.restore();
  }

  SHOWS.serval = [
    {
      key: 'workshop', ch: '14', len: 2.8, light: '#ffb060',
      fx: { noise: 0.07, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#3a2a3a'], [1, '#1a1220']]);
        rect(g, '#14101a', 20, 14, 200, 36); g.strokeStyle = '#ff7ab8'; g.lineWidth = 2; g.strokeRect(22, 16, 196, 32);
        caption(g, '«НЕЙВЕРВИНТЕР»', 120, 21, { size: 18, align: 'center', col: '#ffb0d8', shadow: '#5a1a3a' });
        rect(g, '#4a3a30', 0, 160, LW, 80); rect(g, '#6a5040', 0, 158, LW, 4);
        const items = [['обогреватель', '#c86a3a'], ['касса', '#6a8a9a'], ['диктофон', '#5a5a6a']];
        items.forEach(([n, c], i) => { const x = 30 + i * 52, fixed = t > 0.6 + i * 0.5; rect(g, c, x, 124, 40, 34); rect(g, G.dark(c, 0.3), x + 4, 128, 32, 10); if (fixed) { lighter(g, () => glow(g, x + 20, 140, 22, '#80ff90', 0.5)); caption(g, '✓', x + 20, 100, { size: 18, align: 'center', col: '#80ff90' }); } else for (let k = 0; k < 2; k++) line(g, '#c8c8d0', 1, x + 10 + k * 16, 122, x + 14 + k * 16, 114); });
        G.drawFigure(g, X.look, 252, 196, 1.25, { flip: true });
        guitar(g, 236, 140, -0.6, '#c8303a');
        rect(g, '#14081e', 0, 210, LW, 30);
        caption(g, 'Свободна в любое время!', 160, 214, { size: 17, align: 'center', col: '#ffe0f0' });
      }
    },
    {
      key: 'rehearsal', ch: 'AV', len: 3.0, light: '#ff70c0',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.4) * 2), Math.round(Math.sin(t * 1.6) * 2));
        vgrad(g, -10, LH + 10, [[0, '#1a0c1e'], [1, '#2a1424']], -10, LW + 20);
        lighter(g, () => { glow(g, 100, 60, 80, '#ff60c0', 0.35); glow(g, 230, 60, 80, '#60a0ff', 0.3); });
        rect(g, '#2a1a24', -10, 170, LW + 20, 80);
        for (const [x, r] of [[270, 18], [244, 12], [296, 12]]) { ell(g, '#3a3a48', x, 150, r, r * 0.4); ell(g, '#c8c8d8', x, 148, r, r * 0.3); }
        ell(g, '#5a2a3a', 270, 178, 22, 18); ell(g, '#f2f2f6', 270, 178, 16, 13); rect(g, '#d8b050', 236, 136, 2, 30); ell(g, '#d8b050', 237, 136, 10, 2);
        g.save(); g.translate(270, 196); g.rotate(-0.06); rect(g, '#fbf8ee', -48, -12, 96, 30); caption(g, 'НЕ ТРОГАТЬ!', 0, -10, { size: 14, align: 'center', col: '#c8303a', shadow: false }); caption(g, '— Пела', 20, 4, { size: 11, align: 'center', col: '#3a3a44', shadow: false }); g.restore();
        G.drawFigure(g, X.look, 110, 206, 1.25);
        guitar(g, 112, 150, -0.4 + Math.sin(t * 8) * 0.05, '#c8303a');
        G.drawFigure(g, X.lookOf('pela'), 196, 206, 1.05, { flip: true });
        rect(g, '#1a1a24', 168, 152, 52, 10); for (let i = 0; i < 8; i++) rect(g, '#f2f2f6', 170 + i * 6, 152, 5, 6);
        lighter(g, () => { for (let i = 0; i < 4; i++) { const ph = (t * 0.7 + i / 4) % 1; caption(g, '♪', 80 + i * 20 + Math.sin(ph * 6) * 6, 120 - ph * 70, { size: 16, col: rgba('#ffd0f0', 1 - ph), shadow: false }); } });
        g.restore();
        caption(g, '«МЕХАНИЧЕСКАЯ ГОРЯЧКА»', 12, 10, { size: 14, col: '#ffd0f0' });
        caption(g, 'репетиция · 02:10', 12, 28, { size: 12, col: '#c8a8c0', bold: false });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'toolbox', ch: '', len: 3.6, light: '#80c8ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, LH, [[0, '#1a1620'], [1, '#0e0c12']]);
        for (let i = 0; i < 8; i++) { rect(g, '#2a2430', 10 + i * 38, 20, 2, 60); line(g, '#4a4a58', 3, 4 + i * 38, 40 + (i % 3) * 8, 18 + i * 38, 70); }
        lighter(g, () => glow(g, 70, 120, 80, '#ffc070', 0.35));
        rect(g, '#4a3a30', 0, 150, LW, 90); rect(g, '#6a5040', 0, 148, LW, 4);
        g.save(); g.translate(64, 130); g.rotate(-0.08);
        rect(g, '#c8c0a8', -26, -34, 52, 64); rect(g, '#4a5a7a', -22, -30, 44, 46);
        ell(g, '#d8b898', -8, -14, 7, 8); ell(g, '#d8b898', 10, -12, 7, 8); rect(g, '#2a3a5a', -16, -6, 16, 20); rect(g, '#6a4a5a', 3, -4, 16, 18);
        rect(g, '#c8c0a8', -22, 18, 44, 10);
        g.restore();
        const power = sm(seg(t, 0.8, 2.4));
        rect(g, '#a8302a', 150, 150, 110, 50); rect(g, '#c8403a', 150, 146, 110, 8); rect(g, '#5a5a66', 186, 136, 38, 10);
        g.save(); g.beginPath(); g.rect(150, 154, 110, 46); g.clip();
        for (let i = 0; i < 5; i++) line(g, ['#d8b050', '#5a8ab0', '#c8c8d0'][i % 3], 2, 160 + i * 20, 200, 170 + i * 18, 160);
        g.restore();
        lighter(g, () => { glow(g, 205, 172, 30 + 40 * power, '#60c0ff', 0.7 * power); if (power > 0.7) { g.strokeStyle = rgba('#a0e0ff', (power - 0.7) * 2.5); g.lineWidth = 2; g.beginPath(); g.arc(205, 172, 70, Math.PI, Math.PI * 2); g.stroke(); } });
        ell(g, '#a0e8ff', 205, 172, 10 * power + 2, 10 * power + 2);
        caption(g, 'для Гепарда', 205, 208, { size: 13, align: 'center', col: '#c8b8a0', shadow: false });
      }
    }
  ];

  function teddy(g, x, y, s, stitch) {
    ell(g, '#a8784a', x, y, 14 * s, 16 * s); ell(g, '#c8986a', x, y + 4 * s, 8 * s, 9 * s);
    ell(g, '#a8784a', x, y - 20 * s, 11 * s, 10 * s); ell(g, '#a8784a', x - 9 * s, y - 28 * s, 4 * s, 4 * s); ell(g, '#a8784a', x + 9 * s, y - 28 * s, 4 * s, 4 * s);
    ell(g, '#1a1a1e', x - 4 * s, y - 21 * s, 1.5 * s, 1.5 * s); ell(g, '#1a1a1e', x + 4 * s, y - 21 * s, 1.5 * s, 1.5 * s); ell(g, '#3a2a20', x, y - 16 * s, 2.5 * s, 2 * s);
    ell(g, '#a8784a', x - 14 * s, y - 2 * s, 5 * s, 8 * s); ell(g, '#a8784a', x + 14 * s, y - 2 * s, 5 * s, 8 * s);
    for (let i = 0; i < stitch; i++) line(g, '#f2f2f6', 1.5, x - 6 * s + i * 4 * s, y - 6 * s, x - 4 * s + i * 4 * s, y + 2 * s);
  }

  function bed(g, x, y, w, kid) {
    rect(g, '#d8d4cc', x, y, w, 14); rect(g, '#8a8aa0', x, y + 14, w, 4); rect(g, '#5a5a6a', x, y + 18, 4, 16); rect(g, '#5a5a6a', x + w - 4, y + 18, 4, 16);
    ell(g, '#f2f0ea', x + 14, y - 2, 12, 6);
    if (kid) { ell(g, '#d8b898', x + 14, y - 6, 7, 6); ell(g, kid, x + 14, y - 10, 8, 4); rect(g, '#7a9ac8', x + 22, y - 6, w - 26, 10); }
  }

  SHOWS.natasha = [
    {
      key: 'graduation', ch: '18', len: 2.8, light: '#f2d8a0',
      fx: { noise: 0.06, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#4a3a5a'], [1, '#2a2034']]);
        for (let i = 0; i < 5; i++) { rect(g, '#5a4a6a', 30 + i * 60, 20, 14, 140); rect(g, '#d8c8e8', 26 + i * 60, 18, 22, 4); }
        rect(g, '#3a2a40', 40, 150, 240, 14); rect(g, '#d8b050', 40, 148, 240, 3);
        G.drawFigure(g, X.lookOf('townswoman'), 96, 152, 1.15);
        G.drawFigure(g, X.look, 204, 152, 1.2, { flip: true });
        const give = eOut(seg(t, 0.3, 0.8));
        g.save(); g.translate(lerp(120, 166, give), 108); g.rotate(-0.2); rect(g, '#f2ecd8', -10, -4, 22, 8); rect(g, '#c8303a', -2, -5, 4, 10); g.restore();
        for (let i = 0; i < 8; i++) { const x = 18 + i * 40; ell(g, '#2a2030', x, 214, 16, 12); ell(g, ['#5a4a3a', '#2a2a30', '#8a7a6a'][i % 3], x, 196, 9, 10); }
        rect(g, '#0c1e5a', 0, 168, 220, 22); rect(g, '#d8b050', 0, 168, 6, 22);
        caption(g, 'ВЫПУСК МЕДФАКА · С ОТЛИЧИЕМ', 12, 171, { size: 14 });
        rect(g, 'rgba(0,0,0,0.75)', 0, 214, LW, 26);
        caption(g, t < 1.5 ? '«Любая больница возьмёт тебя»' : '«Я хочу вернуться в Подземье»', 160, 218, { size: 15, align: 'center', col: t < 1.5 ? '#c8d8f0' : '#ffffff' });
      }
    },
    {
      key: 'teddy', ch: 'AV', len: 3.0, light: '#ffc890',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.1) * 2), Math.round(Math.sin(t * 1.5 + 1) * 2));
        vgrad(g, -10, LH + 10, [[0, '#3a2e24'], [1, '#2a2018']], -10, LW + 20);
        for (const [x, y] of [[60, 30], [200, 26]]) { line(g, '#2a2018', 1, x, 0, x, y); lighter(g, () => glow(g, x, y + 6, 40, '#ffc070', 0.45)); ell(g, '#ffd890', x, y + 4, 5, 6); }
        bed(g, 6, 120, 90, null); bed(g, 230, 124, 90, null);
        rect(g, '#5a4434', -10, 170, LW + 20, 80);
        G.drawFigure(g, X.look, 104, 206, 1.2);
        rect(g, '#7a5a40', 120, 174, 64, 6); rect(g, '#5a4030', 126, 180, 4, 22); rect(g, '#5a4030', 174, 180, 4, 22);
        teddy(g, 150, 152, 1.4, Math.min(5, Math.floor(seg(t, 0.4, 2.4) * 6)));
        const nx = 150 - 6 * 1.4 + Math.min(5, Math.floor(seg(t, 0.4, 2.4) * 6)) * 4 * 1.4;
        line(g, '#c8c8d0', 1, nx, 146, nx + 10, 128); ell(g, '#e8e8f0', nx + 10, 128, 1.5, 1.5);
        for (let i = 0; i < 4; i++) fan(g, 196 + i * 30, 206 + (i % 2) * 4, 0.9 + (i % 2) * 0.1, ['#5a3a20', '#e8c060', '#2a1a14', '#8a4a2a'][i], ['#c8303a', '#3a8ad8', '#e8a020', '#5aa83a'][i], false);
        g.restore();
        caption(g, 'КЛИНИКА · ЯСЛИ', 12, 10, { size: 14, col: '#ffe0b0' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'ward', ch: '', len: 3.6, light: '#c8b0a0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t) {
        vgrad(g, 0, LH, [[0, '#1a1418'], [1, '#100c0e']]);
        bed(g, 10, 104, 96, '#2a1a14'); bed(g, 120, 100, 96, '#e8c060'); bed(g, 230, 104, 84, '#8a4a2a');
        teddy(g, 186, 92, 0.8, 5);
        rect(g, '#2a2018', 0, 150, LW, 90);
        const fl = 0.92 + 0.08 * Math.sin(t * 6);
        rect(g, '#3a3a44', 240, 160, 8, 26); poly(g, '#5a5a6a', [230, 160, 258, 160, 252, 150, 236, 150]);
        lighter(g, () => glow(g, 244, 170, 70 * fl, '#ffc070', 0.5));
        rect(g, '#5a4434', 60, 196, 240, 8);
        g.save(); g.translate(150, 190); g.rotate(-0.04); rect(g, '#f6f0e2', -60, -28, 120, 56);
        caption(g, 'Дорогие мама и папа!', -54, -25, { size: 13, col: '#2a2440', shadow: false });
        const k = seg(t, 0.4, 2.6), tail = 'Я нужна людям.';
        caption(g, tail.slice(0, Math.floor(k * tail.length)), -54, 6, { size: 15, col: '#2a2440', shadow: false });
        for (let i = 0; i < 2; i++) line(g, '#8a8aa8', 1, -52, -6 + i * 4, 30, -6 + i * 4);
        g.restore();
        for (let i = 0; i < 3; i++) { const ph = (t * 0.3 + i / 3) % 1; caption(g, 'z', 140 + i * 6 - ph * 8, 84 - ph * 20, { size: 10 + ph * 5, col: rgba('#c8c0d8', 1 - ph), shadow: false }); }
      }
    }
  ];

  function drillbot(g, x, y, s, t, punch) {
    rect(g, '#3a3a40', x - 30 * s, y - 14 * s, 60 * s, 14 * s); for (let i = 0; i < 5; i++) ell(g, '#2a2a30', x - 24 * s + i * 12 * s, y - 7 * s, 5 * s, 5 * s);
    rect(g, '#c8902a', x - 26 * s, y - 56 * s, 52 * s, 42 * s); rect(g, '#a8701a', x - 26 * s, y - 20 * s, 52 * s, 6 * s);
    rect(g, '#5a5a66', x - 18 * s, y - 50 * s, 36 * s, 16 * s); lighter(g, () => glow(g, x, y - 42 * s, 10 * s, '#ff5030', 0.8)); rect(g, '#ff8060', x - 10 * s, y - 45 * s, 20 * s, 5 * s);
    const ext = punch * 40 * s;
    rect(g, '#7a7a88', x + 24 * s, y - 40 * s, 14 * s + ext, 10 * s);
    poly(g, '#d8d8e0', [x + 38 * s + ext, y - 46 * s, x + 38 * s + ext, y - 24 * s, x + 62 * s + ext, y - 35 * s]);
    for (let i = 0; i < 3; i++) line(g, '#8a8a98', 1, x + 42 * s + ext + i * 6 * s, y - 42 * s + i * 2 * s, x + 46 * s + ext + i * 6 * s, y - 28 * s - i * 2 * s);
  }

  function salamander(g, x, y, s) {
    ell(g, '#c8602a', x, y, 16 * s, 5 * s); ell(g, '#c8602a', x + 16 * s, y - 2 * s, 6 * s, 4 * s);
    poly(g, '#c8602a', [x - 14 * s, y, x - 32 * s, y + 4 * s, x - 14 * s, y + 3 * s]);
    for (const [dx, dy] of [[-8, 4], [8, 4], [-8, -4], [8, -4]]) line(g, '#a8481a', 2, x + dx * s, y + dy * s * 0.5, x + dx * s * 1.4, y + dy * s * 1.4);
    ell(g, '#1a1a1e', x + 19 * s, y - 3 * s, 1.2 * s, 1.2 * s);
  }

  SHOWS.hook = [
    {
      key: 'drill', ch: '42', len: 2.8, light: '#ffb040',
      fx: { noise: 0.07, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#3a1a5a'], [1, '#1a0c2a']]);
        speedLines(g, 220, 120, t * 0.4, rgba('#c8a0ff', 0.4), 24);
        rect(g, '#2a1a1a', 0, 196, LW, 44);
        const punch = Math.max(0, Math.sin(t * 4)) ** 4;
        drillbot(g, 120, 198, 1.6, t, punch);
        G.drawFigure(g, X.look, 118, 110, 1.0);
        if (punch > 0.6) { caption(g, 'БАМ!', 270, 70, { size: 24, align: 'center', col: '#ffe040', shadow: '#a8301a' }); lighter(g, () => glow(g, 250, 120, 40, '#ffe040', 0.6 * punch)); }
        rect(g, '#14081e', 0, 4, LW, 26);
        caption(g, 'ХУК ВЕЛИКИЙ МРАК', 10, 7, { size: 15, col: '#e0c0ff' });
        rect(g, 'rgba(0,0,0,0.75)', 0, 212, LW, 28);
        caption(g, '«Разящий железный кулак!»', 160, 216, { size: 16, align: 'center', col: '#ffe040' });
      }
    },
    {
      key: 'diary', ch: 'AV', len: 3.2, light: '#f2e8c8',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t) {
        rect(g, '#5a3a2a', 0, 0, LW, LH);
        g.save(); g.translate(160, 122); g.rotate(-0.03);
        rect(g, '#d8d0b8', -128, -108, 260, 220); rect(g, '#fbf6e2', -130, -110, 260, 220);
        for (let i = 0; i < 9; i++) line(g, '#a8c8e8', 1, -120, -76 + i * 22, 120, -76 + i * 22);
        line(g, '#e8a0a0', 1, -100, -110, -100, 110);
        const ink = '#14206a', w = (s, x, y, sz) => caption(g, s, x, y, { size: sz || 16, col: ink, shadow: false });
        w('Погода: холодень.', -94, -96);
        w('Настроение: хорошее.', -94, -74);
        w('Я разбила', -94, -40);
        const words = [['приборок', 0.5], ['проборок', 1.2], ['пробирок', 1.9]];
        words.forEach(([s, t0], i) => {
          if (t < t0) return;
          const x = 6, y = -40 + i * 22;
          const n = Math.floor(seg(t, t0, t0 + 0.4) * s.length);
          w(s.slice(0, n), x, y);
          if (i < 2 && t > t0 + 0.55) line(g, '#d8202a', 3, x - 2, y + 10, x + textWidth(g, s, 16) + 2, y + 7);
        });
        w('старой ведьмы...', -94, 32);
        ell(g, '#5a4a3a', 84, 64, 16, 12); ell(g, '#5a4a3a', 72, 54, 5, 5); ell(g, '#5a4a3a', 96, 54, 5, 5); ell(g, '#e8a0a0', 84, 70, 4, 3); ell(g, '#1a1a1e', 78, 62, 1.5, 1.5); ell(g, '#1a1a1e', 90, 62, 1.5, 1.5);
        caption(g, 'Кроты!', 84, 80, { size: 12, align: 'center', col: '#5a4a3a', shadow: false });
        g.restore();
        caption(g, 'ДНЕВНИК ХУК', 12, LH - 22, { size: 14, col: '#ffe0b0' });
      }
    },
    {
      key: 'salamander', ch: '', len: 3.6, light: '#ff9050',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#14100c'], [1, '#2a1e14']]);
        for (let i = 0; i < 9; i++) poly(g, '#1e1610', [i * 38 - 10, 0, i * 38 + 28, 0, i * 38 + 8, 30 + hx(i, 1, 102) * 30]);
        g.save(); g.translate(240, 80); g.rotate(0.06);
        rect(g, '#f2ecd8', -36, -30, 72, 64); rect(g, '#c8c0a8', -36, -30, 72, 3);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ell(g, '#e8607a', Math.cos(a) * 9, -6 + Math.sin(a) * 9, 7, 5); }
        ell(g, '#f2d050', 0, -6, 5, 5); line(g, '#3a8a3a', 3, 0, 4, 0, 26);
        caption(g, 'цветёт раз в год', 0, 22, { size: 9, align: 'center', col: '#5a4a3a', shadow: false });
        g.restore();
        rect(g, '#3a2c20', 0, 190, LW, 50);
        const fl = 0.9 + 0.1 * Math.sin(t * 9) + 0.06 * Math.sin(t * 17);
        for (let i = 0; i < 5; i++) ell(g, '#5a5a60', 110 + i * 22, 188, 12, 7);
        lighter(g, () => { glow(g, 154, 176, 60 * fl, '#ff8030', 0.6); for (let i = 0; i < 3; i++) poly(g, rgba(['#ffd060', '#ff8030', '#ffe0a0'][i], 0.8), [134 + i * 14, 186, 146 + i * 14, 186, 140 + i * 14 + Math.sin(t * 9 + i) * 3, 160 - i * 4 * fl]); });
        rect(g, '#4a4a50', 118, 166, 80, 4);
        salamander(g, 158, 158, 1.7);
        for (let i = 0; i < 3; i++) { const ph = (t * 0.4 + i / 3) % 1; ell(g, rgba('#c8c0b8', 0.4 * (1 - ph)), 150 + Math.sin(ph * 5 + i) * 6, 150 - ph * 40, 3 + ph * 6, 2 + ph * 4); }
        G.drawFigure(g, X.look, 62, 214, 1.1);
      }
    }
  ];

  function book(g, x, y, w, h, col, ang) {
    g.save(); g.translate(x, y); g.rotate(ang || 0);
    rect(g, col, -w / 2, -h / 2, w, h); rect(g, '#f2ecd8', w / 2 - 3, -h / 2 + 2, 3, h - 4); rect(g, G.light(col, 0.3), -w / 2 + 4, -h / 2 + 6, w - 10, 3);
    g.restore();
  }

  SHOWS.pela = [
    {
      key: 'recruit', ch: '20', len: 3.0, light: '#a0c0e8',
      fx: { noise: 0.06, ghost: 0.16, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a3450'], [1, '#1a2034']]);
        rect(g, '#3a4466', 0, 0, LW, 30); caption(g, 'НАБОР В РАЗВЕДКУ', 12, 7, { size: 15, col: '#c8d8f0' });
        rect(g, '#4a3a30', 30, 150, 110, 10); rect(g, '#4a3a30', 200, 150, 110, 10);
        G.drawFigure(g, X.look, 86, 180, 1.2);
        const doze = seg(t, 1.2, 2.4);
        [210, 262].forEach((x, i) => { G.drawFigure(g, X.lookOf('guard'), x + 20, 180, 1.0, { flip: true }); if (doze > 0.3) for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k / 2 + i * 0.3) % 1; caption(g, 'z', x + 28 - ph * 6, 70 - ph * 20, { size: 10 + ph * 6, col: rgba('#f2f2f6', (1 - ph) * doze), shadow: false }); } });
        rect(g, 'rgba(0,0,0,0.75)', 0, 196, LW, 44);
        const lines = ['«Глава V, пункт 23,', 'статья 1, параграф 7...»'], k = seg(t, 0.2, 1.6);
        caption(g, lines[0].slice(0, Math.floor(Math.min(1, k * 2) * lines[0].length)), 160, 199, { size: 15, align: 'center' });
        if (k > 0.5) caption(g, lines[1].slice(0, Math.floor((k - 0.5) * 2 * lines[1].length)), 160, 218, { size: 15, align: 'center' });
      }
    },
    {
      key: 'fanmeet', ch: 'AV', len: 3.0, light: '#ffd0a0',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 1.9) * 2), Math.round(Math.sin(t * 2.4) * 2));
        vgrad(g, -10, LH + 10, [[0, '#3a2a24'], [1, '#2a1c18']], -10, LW + 20);
        rect(g, '#e8dcc0', 30, 14, 200, 40); rect(g, '#5a7ab0', 30, 14, 200, 4);
        caption(g, 'ПРИКЛЮЧЕНИЯ', 130, 18, { size: 15, align: 'center', col: '#2a3a6a', shadow: false });
        caption(g, 'В СНЕЖНОЙ СТРАНЕ', 130, 34, { size: 14, align: 'center', col: '#2a3a6a', shadow: false });
        lighter(g, () => glow(g, 160, 70, 90, '#ffd890', 0.35));
        rect(g, '#5a4434', -10, 168, LW + 20, 80);
        for (let i = 0; i < 4; i++) { const x = 34 + i * 38 + (i > 1 ? 146 : 0); G.drawFigure(g, X.lookOf(['townswoman', 'townsman', 'kid', 'townswoman'][i]), x, 204, 0.95, { flip: i > 1 }); book(g, x + (i > 1 ? -10 : 10), 150, 14, 18, ['#3a6aa8', '#c8303a', '#3a8a5a', '#8a5ab0'][i], -0.1); }
        G.drawFigure(g, X.look, 160, 210, 1.15);
        const hide = sm(seg(t, 1.4, 1.8));
        book(g, 160, lerp(150, 98, hide), 30, 38, '#3a6aa8', 0);
        g.restore();
        rect(g, '#c8303a', 10, LH - 52, 120, 20); caption(g, 'ПО ПРИГЛАШЕНИЯМ', 70, LH - 49, { size: 11, align: 'center', shadow: false });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'library', ch: '', len: 3.6, light: '#ffd8a0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#24180e'], [1, '#140e08']]);
        for (let r = 0; r < 4; r++) { rect(g, '#3a2818', 0, 30 + r * 34, 200, 4); for (let i = 0; i < 16; i++) rect(g, ['#7a3a2a', '#2a4a6a', '#5a5a3a', '#3a2a4a', '#6a4a2a'][(r * 3 + i) % 5], 4 + i * 12, 34 + r * 34 - 26 + (i % 3) * 2, 10, 26 - (i % 3) * 2); }
        rect(g, '#0e1430', 214, 24, 90, 90); K.snowfall(g, t, 30, 13, { speed: 14, wind: -4, h: 114 });
        rect(g, '#24180e', 0, 0, 214, 24); rect(g, '#24180e', 304, 0, 16, 120); rect(g, '#24180e', 214, 114, 106, 10); rect(g, '#3a2818', 256, 24, 4, 90);
        rect(g, '#4a3020', 0, 168, LW, 72); rect(g, '#5a4030', 0, 166, LW, 4);
        const fl = 0.95 + 0.05 * Math.sin(t * 5);
        rect(g, '#3a3a44', 268, 140, 6, 26); poly(g, '#5a7a5a', [254, 140, 288, 140, 280, 128, 262, 128]);
        lighter(g, () => glow(g, 200, 150, 110 * fl, '#ffc870', 0.45));
        G.drawFigure(g, X.look, 130, 214, 1.15);
        book(g, 146, 150, 30, 22, '#3a6aa8', 0.05 + Math.sin(t * 0.8) * 0.02);
        for (let i = 0; i < 4; i++) book(g, 222, 162 - i * 8, 40, 8, ['#3a6aa8', '#3a6aa8', '#c8303a', '#3a6aa8'][i], 0.03 * (i % 2 ? 1 : -1));
        rect(g, '#f2d0e0', 190, 180, 14, 22); poly(g, '#f2d0e0', [190, 182, 192, 174, 196, 182]); poly(g, '#f2d0e0', [198, 182, 202, 174, 204, 182]); ell(g, '#1a1a1e', 195, 192, 1.4, 1.4); ell(g, '#1a1a1e', 200, 192, 1.4, 1.4);
        const flipK = (t * 0.5) % 1;
        if (flipK < 0.3) { g.save(); g.translate(146, 150); g.scale(1 - flipK * 6, 1); rect(g, '#f6f0e0', 0, -10, 14, 20); g.restore(); }
      }
    }
  ];

  function typed(s, k) { return s.slice(0, Math.floor(Math.max(0, Math.min(1, k)) * s.length)); }

  function phone(g, x, y, w, h, col) {
    rect(g, '#1a1a22', x, y, w, h); rect(g, col || '#6ad0ff', x + 3, y + 5, w - 6, h - 12); rect(g, '#3a3a44', x + w / 2 - 4, y + h - 5, 8, 2);
  }

  function smiley(g, x, y, r) {
    ell(g, '#ffd040', x, y, r, r); ell(g, '#2a1a10', x - r * 0.35, y - r * 0.2, r * 0.12, r * 0.18); ell(g, '#2a1a10', x + r * 0.35, y - r * 0.2, r * 0.12, r * 0.18);
    g.strokeStyle = '#2a1a10'; g.lineWidth = Math.max(1, r * 0.12); g.beginPath(); g.arc(x, y + r * 0.05, r * 0.5, 0.3, Math.PI - 0.3); g.stroke(); g.lineWidth = 1;
  }

  function skiff(g, x, y, s, col) {
    poly(g, col || '#5a6a8a', [x - 16 * s, y, x + 16 * s, y, x + 11 * s, y + 6 * s, x - 11 * s, y + 6 * s]);
    rect(g, '#d8b060', x - s, y - 10 * s, 2 * s, 10 * s); poly(g, '#e8eef8', [x + s, y - 11 * s, x + 11 * s, y - 4 * s, x + s, y - 3 * s]);
  }

  function anchorDesk(g, look, label) {
    rect(g, '#1a2a4a', 0, 150, 150, 60); rect(g, '#2a4070', 0, 150, 150, 4);
    G.drawFigure(g, look, 70, 196, 1.15);
    rect(g, '#0e1a34', 0, 196, 150, 20);
    caption(g, label, 8, 198, { size: 13, col: '#c8d8f0', shadow: false });
  }

  function fishman(g, x, y, s) {
    ell(g, '#4a8a9a', x, y - 30 * s, 16 * s, 24 * s); ell(g, '#6aaabb', x, y - 52 * s, 12 * s, 11 * s);
    for (const d of [-1, 1]) poly(g, '#3a7a8a', [x + d * 10 * s, y - 56 * s, x + d * 20 * s, y - 60 * s, x + d * 12 * s, y - 48 * s]);
    ell(g, '#ffffff', x - 4 * s, y - 54 * s, 2.4 * s, 2.4 * s); ell(g, '#1a1a1e', x - 4 * s, y - 54 * s, 1.2 * s, 1.2 * s);
    for (let i = 0; i < 3; i++) rect(g, '#2a5a6a', x + 4 * s, y - 50 * s + i * 3 * s, 4 * s, 1);
  }

  function noodles(g, x, y) {
    ell(g, '#c8302a', x, y, 12, 5); ell(g, '#f2e6c8', x, y - 2, 10, 3);
    for (let i = 0; i < 3; i++) line(g, '#f2e6c8', 1, x - 4 + i * 4, y - 3, x - 2 + i * 3, y - 18);
    line(g, '#8a5a2a', 1, x + 6, y - 6, x + 14, y - 22); line(g, '#8a5a2a', 1, x + 8, y - 5, x + 17, y - 20);
  }

  SHOWS.lynx = [
    {
      key: 'expedition', ch: '12', len: 2.8, light: '#a0c8ff',
      fx: { noise: 0.06, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#1a2a4a'], [1, '#0e1a30']]);
        rect(g, '#d8e4f0', 160, 30, 150, 110); rect(g, '#8aa0c0', 160, 30, 150, 3);
        for (let i = 0; i < 5; i++) poly(g, '#a8b8d0', [170 + i * 28, 130, 184 + i * 28, 70 + (i % 2) * 14, 198 + i * 28, 130]);
        const k = seg(t, 0.3, 2.2);
        for (let i = 0; i < 12 * k; i++) rect(g, '#d83a3a', 176 + i * 10, 120 - Math.sin(i * 0.7) * 20 - i * 3, 4, 3);
        F.tent(g, 290, 76, 0.7, false);
        anchorDesk(g, X.lookOf('townswoman'), 'НОВОСТИ БЕЛОБОГА');
        G.drawFigure(g, X.look, 230, 150, 0.9);
        rect(g, '#0c1e5a', 0, 214, LW, 26); rect(g, '#e8c040', 0, 214, 8, 26);
        caption(g, 'ВЫХОД ЗА СТЕНУ', 14, 217, { size: 18 });
      }
    },
    {
      key: 'survival', ch: 'AV', len: 3.0, light: '#ffd0a0',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        g.save(); g.translate(Math.round(Math.sin(t * 2.1) * 2), Math.round(Math.sin(t * 1.6) * 2));
        F.snowNight(g, t, 150);
        F.tent(g, 250, 168, 1.4, true);
        G.drawFigure(g, X.look, 120, 200, 1.2);
        F.can(g, 156, 176, 1.8, 0.2);
        const steps = ['1. КОНСЕРВЫ', '2. ПЕЧКА', '3. СПАЛЬНИК'];
        steps.forEach((s, i) => { const a = seg(t, 0.4 + i * 0.6, 0.6 + i * 0.6); if (a > 0) caption(g, s, 14, 20 + i * 24, { size: 18, col: rgba('#ffffff', a) }); });
        g.restore();
        caption(g, 'ВЫЖИВАНИЕ ЗА СТЕНОЙ', 12, LH - 46, { size: 16, col: '#bfe8ff' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'aurora', ch: '', len: 3.6, light: '#80ffc0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        F.snowNight(g, t, 170);
        F.tent(g, 70, 196, 1.6, true);
        G.drawFigure(g, X.look, 170, 214, 1.1);
        phone(g, 200, 120, 40, 64, '#0e1a30');
        lighter(g, () => { g.strokeStyle = rgba('#6affb8', 0.8); g.lineWidth = 3; g.beginPath(); for (let x = 0; x <= 34; x += 4) { const y = 140 + Math.sin(x * 0.2 + t * 2) * 6; if (x) g.lineTo(203 + x, y); else g.moveTo(203, y); } g.stroke(); g.lineWidth = 1; });
        if (t > 1.6) smiley(g, 220, 166, 7 * eOut(seg(t, 1.6, 1.9)));
        K.snowfall(g, t, 20, 17, { speed: 12, wind: 6, a: 0.7 });
      }
    }
  ];

  SHOWS.luka = [
    {
      key: 'fight', ch: '36', len: 2.8, light: '#ff9060',
      fx: { noise: 0.07, ghost: 0.2, chroma: 1, wobble: 0.5 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#0e0608'], [1, '#2a1010']]);
        lighter(g, () => poly(g, 'rgba(255,230,200,0.14)', [130, 0, 190, 0, 260, 200, 60, 200]));
        F.ropes(g, 130);
        G.drawFigure(g, X.look, 120, 196, 1.25);
        G.drawFigure(g, X.lookOf('miner'), 220, 196, 1.3, { flip: true });
        const hit = seg(t, 1.3, 1.5) * (1 - seg(t, 1.5, 1.8));
        F.gauntlet(g, 160 + hit * 30, 120, 1.2, 0, hit);
        if (hit > 0.5) K.sparks(g, t, 200, 120, 14, 3, '#ffd090', 40);
        rect(g, '#c81e28', 10, 10, 160, 22); caption(g, 'ФИНАЛ ТУРНИРА', 18, 13, { size: 16, shadow: false });
        rect(g, '#1a1a22', 0, 210, LW, 30); caption(g, 'БОЙЦОВСКИЙ КЛУБ ПОДЗЕМЬЯ', 10, 213, { size: 16, col: '#ffd890' });
      }
    },
    {
      key: 'kids', ch: 'AV', len: 3.0, light: '#ffc890',
      fx: { noise: 0.08, chroma: 1, wobble: 0.8, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.3) * 2), Math.round(Math.sin(t * 1.9) * 2));
        vgrad(g, -10, LH + 10, [[0, '#2a1e18'], [1, '#3a2a20']], -10, LW + 20);
        rect(g, '#4a3424', -10, 190, LW + 20, 60);
        rect(g, '#3a2a20', 250, 0, 2, 120); ell(g, '#8a3a2a', 251, 140, 14, 26);
        G.drawFigure(g, X.look, 110, 206, 1.2);
        for (let i = 0; i < 3; i++) { const jab = Math.sin(t * 6 + i * 2) > 0.6 ? 4 : 0; G.drawFigure(g, X.lookOf('kid'), 170 + i * 26 + jab, 210, 0.8, { flip: true }); }
        g.restore();
        rect(g, 'rgba(0,0,0,0.7)', 0, 4, 200, 26); caption(g, typed('ДЕРЖИ КУЛАК ВОТ ТАК!', seg(t, 0.2, 1.4)), 8, 8, { size: 16 });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'anvil', ch: '', len: 3.6, light: '#ffa060',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#1a0e08'], [1, '#2a1a10']]);
        for (let i = 0; i < 4; i++) { rect(g, '#3a2414', 10 + i * 30, 30, 26, 120); for (let k = 0; k < 4; k++) rect(g, '#6a6a74', 14 + i * 30, 40 + k * 28, 18, 4); }
        rect(g, '#4a3020', 0, 190, LW, 50);
        rect(g, '#2a2a30', 196, 160, 60, 14); rect(g, '#3a3a44', 210, 174, 30, 20); rect(g, '#5a5a64', 196, 160, 60, 3);
        G.drawFigure(g, X.look, 170, 214, 1.15);
        const strike = (t * 1.4) % 1;
        if (strike < 0.12) { K.sparks(g, t, 226, 160, 16, Math.floor(t * 1.4), '#ffb060', 50); lighter(g, () => glow(g, 226, 160, 40, '#ff8a30', 0.6)); }
        lighter(g, () => glow(g, 280, 60, 50, '#ff7a30', 0.25 + 0.05 * Math.sin(t * 4)));
      }
    }
  ];

  SHOWS.sushang = [
    {
      key: 'patrol', ch: '23', len: 2.8, light: '#ffb0a0',
      fx: { noise: 0.06, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        F.xianzhou(g, t, 150);
        vgrad(g, 150, LH, [[0, '#c8a888'], [1, '#8a6a4a']]);
        G.drawFigure(g, X.look, 120, 206, 1.15);
        G.drawFigure(g, X.lookOf('townswoman'), 180, 206, 1.05, { flip: true });
        rect(g, '#8a5a2a', 130, 150, 28, 20); rect(g, '#6a4220', 130, 150, 28, 3);
        rect(g, '#0c1e5a', 0, 190, LW, 26); rect(g, '#e8c040', 0, 190, 8, 26);
        caption(g, 'ДОБРОЕ ДЕЛО ДНЯ', 14, 193, { size: 18 });
        ticker(g, 'ОБЛАЧНЫЕ РЫЦАРИ ПАТРУЛИРУЮТ БОЛЬШУЮ ЯРМАРКУ · НОВОБРАНЕЦ СУШАН ·', 216, 18, t, 70, '#e8e8f0', '#10142a');
      }
    },
    {
      key: 'teahouse', ch: 'AV', len: 3.0, light: '#ffc870',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        g.save(); g.translate(Math.round(Math.sin(t * 2) * 2), Math.round(Math.sin(t * 2.6) * 2));
        vgrad(g, -10, LH + 10, [[0, '#2a1410'], [1, '#4a2a1a']], -10, LW + 20);
        [40, 140, 240].forEach((x, i) => F.lanternR(g, x, 10, 1.1, t, i, true));
        F.counter(g, 150, 150, 170);
        G.drawFigure(g, X.lookOf('townsman'), 230, 150, 1.1, { flip: true });
        G.drawFigure(g, X.look, 80, 210, 1.15);
        const lean = sm(seg(t, 1.2, 2.0));
        if (lean > 0) caption(g, '!', 96, 80 - 6 * lean, { size: 20, col: rgba('#ffe060', lean) });
        g.restore();
        caption(g, 'ЗАОБЛАЧНЫЙ КВИНТЕТ', 12, 12, { size: 16, col: '#ffd890' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'letter', ch: '', len: 3.6, light: '#ffd8a0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#1e140c'], [1, '#120c08']]);
        rect(g, '#5a3a24', 0, 168, LW, 72); rect(g, '#6a4a30', 0, 166, LW, 4);
        lighter(g, () => glow(g, 250, 120, 90, '#ffc870', 0.5));
        rect(g, '#3a3a44', 262, 120, 6, 46); poly(g, '#e8d8a0', [248, 120, 282, 120, 274, 104, 256, 104]);
        rect(g, '#f2ecd8', 132, 120, 116, 44);
        caption(g, typed('Матушка, отец!', seg(t, 0.3, 1.4)), 138, 124, { size: 14, col: '#2a1a10', shadow: false });
        if (t > 1.8) { caption(g, 'поменяюсь', 138, 143, { size: 13, col: '#2a1a10', shadow: false }); line(g, '#c8302a', 2, 138, 150, 212, 148); if (t > 2.4) caption(g, 'изменюсь', 150, 150, { size: 12, col: '#c8302a', shadow: false }); }
        G.drawFigure(g, X.look, 110, 214, 1.15);
        rect(g, '#f2f2ea', 40, 120, 8, 90); rect(g, '#8a2a1a', 38, 116, 12, 6);
      }
    }
  ];

  SHOWS.xueyi = [
    {
      key: 'wanted', ch: '44', len: 2.8, light: '#c0a0ff',
      fx: { noise: 0.06, ghost: 0.2, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#0a0610'], [1, '#1a0e1e']]);
        rect(g, '#efe6d0', 150, 24, 150, 150);
        caption(g, 'РОЗЫСК', 225, 30, { size: 22, align: 'center', col: '#c83a3a', shadow: false });
        ell(g, '#2a1a24', 225, 100, 30, 34); caption(g, '?', 225, 82, { size: 30, align: 'center', col: '#c8b0ff', shadow: false });
        caption(g, 'ПОРАЖЁН МАРОЙ', 225, 146, { size: 14, align: 'center', col: '#2a1a24', shadow: false });
        F.chain(g, 150, 24, 300, 24, 1, '#5a5a6a'); F.chain(g, 150, 174, 300, 174, 1, '#5a5a6a');
        G.drawFigure(g, X.look, 70, 210, 1.2);
        rect(g, '#2a0a1a', 0, 210, LW, 30); caption(g, 'КОМИССИЯ ДЕСЯТИ ВЛАДЫК', 10, 213, { size: 16, col: '#e8d0ff' });
      }
    },
    {
      key: 'novel', ch: 'AV', len: 3.0, light: '#e0c0ff',
      fx: { noise: 0.1, chroma: 1, wobble: 0.8, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2) * 2), Math.round(Math.sin(t * 2.7) * 2));
        vgrad(g, -10, LH + 10, [[0, '#0a0610'], [1, '#2a1430']], -10, LW + 20);
        const k = sm(seg(t, 0.2, 1.4));
        G.drawFigure(g, X.look, 160, 210, 1.3, { alpha: 0.4 + 0.6 * k });
        for (const x of [116, 204]) line(g, rgba('#d8d0f0', 0.8 * k), 1, x, 0, x + (x < 160 ? 26 : -26), 120);
        g.restore();
        caption(g, 'РАБОТА', 160, 20, { size: 22, align: 'center', col: '#f2e8ff' });
        caption(g, 'НЕ ДЛЯ КУКОЛ', 160, 46, { size: 18, align: 'center', col: '#c8b0ff' });
        if (t > 1.6) caption(g, 'ПО РЕАЛЬНЫМ СОБЫТИЯМ', 160, 214, { size: 14, align: 'center', col: rgba('#ffffff', seg(t, 1.6, 1.9)) });
      }
    },
    {
      key: 'halfday', ch: '', len: 3.6, light: '#c8b0ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#2a1a3a'], [0.6, '#6a3a5a'], [1, '#2a1a24']]);
        F.xianzhou(g, t, 140, ['#2a1a3a', '#6a3a5a', '#a86a6a']);
        rect(g, '#3a2a30', 0, 196, LW, 44);
        G.drawFigure(g, X.lookOf('hanya'), 190, 214, 1.1, { flip: true });
        G.drawFigure(g, X.look, 140, 214, 1.1);
        lighter(g, () => glow(g, 165, 150, 60, '#ffd8b0', 0.18));
        const k = (t / 3.6) * Math.PI;
        ell(g, '#f2ecd8', 280, 40, 16, 16); line(g, '#2a1a10', 2, 280, 40, 280 + Math.cos(k - Math.PI / 2) * 11, 40 + Math.sin(k - Math.PI / 2) * 11);
      }
    }
  ];

  SHOWS.tingyun = [
    {
      key: 'fair', ch: '25', len: 2.8, light: '#ffd080',
      fx: { noise: 0.06, ghost: 0.16, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        F.xianzhou(g, t, 140, ['#f2c8a0', '#f8e4c8', '#e0e8d0']);
        vgrad(g, 140, LH, [[0, '#b89a7a'], [1, '#7a5a3a']]);
        F.counter(g, 150, 160, 170);
        for (let i = 0; i < 4; i++) { const x = ((i * 48 + t * 60) % 200) + 150; rect(g, ['#3a8a6a', '#e8c070', '#c84a3a', '#5a7ab0'][i], x, 140, 26, 20); caption(g, '−20%', x + 13, 124, { size: 11, align: 'center', col: '#c8302a', shadow: false }); }
        G.drawFigure(g, X.look, 80, 206, 1.2);
        F.fan(g, 104, 150, 16, -2.6 + Math.sin(t * 3) * 0.3, -1.2 + Math.sin(t * 3) * 0.3, '#e8d8a8', '#d8b050');
        rect(g, '#7a1a1a', 0, 0, 230, 30); caption(g, 'БОЛЬШАЯ ЯРМАРКА', 10, 5, { size: 18, col: '#ffe8a0' });
      }
    },
    {
      key: 'deal', ch: '38', len: 3.0, light: '#a0e0ff',
      fx: { noise: 0.06, ghost: 0.12, chroma: 1, wobble: 0.5, hum: 0.6 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#0a2030'], [1, '#14303a']]);
        rect(g, '#5a3a24', 60, 170, 200, 12); rect(g, '#3a2414', 70, 182, 6, 30); rect(g, '#3a2414', 244, 182, 6, 30);
        G.drawFigure(g, X.look, 90, 200, 1.15);
        fishman(g, 230, 200, 1.4);
        for (let i = 0; i < 4; i++) { const ph = (t * 0.8 + i / 4) % 1; ring(g, rgba('#bfefff', 1 - ph), 1, 214, 120 - ph * 40, 2 + ph * 3); }
        rect(g, '#f2ecd8', 140, 150, 40, 24);
        const st = eOut(seg(t, 1.6, 1.8));
        F.stamp(g, 160, 160, lerp(2, 0.6, st), 'ДА', st, '#c8302a');
        caption(g, 'СДЕЛКА ВЕКА', 12, 12, { size: 18, col: '#bfe8ff' });
      }
    },
    {
      key: 'tail', ch: '', len: 3.6, light: '#ffd0a0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#1e140c'], [1, '#140e08']]);
        rect(g, '#5a3a24', 0, 176, LW, 64);
        F.lanternR(g, 250, 60, 1.4, t, 0, true);
        rect(g, '#6a4a30', 180, 150, 100, 26); rect(g, '#4a3020', 230, 156, 40, 16); rect(g, '#f2ecd8', 236, 158, 20, 8);
        G.drawFigure(g, X.look, 110, 214, 1.15);
        const k = (t * 0.9) % 1, sway = Math.sin(t * 1.5) * 3;
        ell(g, '#b8743a', 142 + sway, 176, 13, 24); ell(g, '#d89a5a', 139 + sway, 170, 8, 17); ell(g, '#f6f0e6', 144 + sway, 152, 8, 8);
        rect(g, '#5a3a1a', 150 + sway, 158 + k * 30, 12, 4); for (let i = 0; i < 4; i++) rect(g, '#5a3a1a', 151 + sway + i * 3, 162 + k * 30, 1, 4);
      }
    }
  ];

  SHOWS.hanya = [
    {
      key: 'verdict', ch: '47', len: 2.8, light: '#e8d0a0',
      fx: { noise: 0.06, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#0e0a10'], [1, '#2a1a1e']]);
        const open = eOut(seg(t, 0.1, 0.8));
        rect(g, '#efe6d0', 140, 30, 170 * open, 140);
        if (open > 0.9) F.brush(g, [150, 50, 190, 54, 230, 48, 270, 56, 160, 90, 210, 96, 260, 88, 170, 130, 240, 136], seg(t, 0.8, 2.0), '#1a1418', 3);
        F.stamp(g, 270, 150, 0.8, 'КАРА', seg(t, 2.0, 2.2), '#c83a3a');
        G.drawFigure(g, X.look, 70, 210, 1.2);
        rect(g, '#1a0a0e', 0, 210, LW, 30); caption(g, 'ВЕРДИКТ ВЫНЕСЕН', 10, 213, { size: 18, col: '#f2e0c0' });
      }
    },
    {
      key: 'diary', ch: 'AV', len: 3.0, light: '#f2e8c8',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.1) * 2), Math.round(Math.sin(t * 1.7) * 2));
        vgrad(g, -10, LH + 10, [[0, '#2a2018'], [1, '#1a140e']], -10, LW + 20);
        rect(g, '#f2ecd8', 30, 30, 260, 170); rect(g, '#c8b890', 158, 30, 4, 170);
        const lines = ['Сегодня: три допроса.', 'Сестре рассказать', 'про небо над гротом.'];
        lines.forEach((s, i) => caption(g, typed(s, seg(t, 0.2 + i * 0.7, 0.9 + i * 0.7)), 40, 50 + i * 30, { size: 14, col: '#2a1a10', shadow: false }));
        G.drawFigure(g, X.look, 240, 196, 1.0, { flip: true });
        g.restore();
        caption(g, 'ДНЕВНИК', 12, LH - 46, { size: 16, col: '#f2e0c0' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'vigil', ch: '', len: 3.6, light: '#c8b0ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#08060c'], [1, '#1a1018']]);
        rect(g, '#1a1018', 0, 200, LW, 40);
        F.coffin(g, 210, 214, 120, 70);
        F.lanternR(g, 290, 50, 1.3, t, 0, false); lighter(g, () => glow(g, 290, 58, 18, '#8affd0', 0.4 + 0.05 * Math.sin(t * 3)));
        G.drawFigure(g, X.look, 100, 214, 1.15);
        rect(g, '#f2ecd8', 120, 160, 26, 18); rect(g, '#c8b890', 132, 160, 2, 18);
        rect(g, '#c8a050', 160, 188, 10, 14); ell(g, '#8affd0', 165, 188, 4, 2);
      }
    }
  ];

  SHOWS.qingque = [
    {
      key: 'tournament', ch: '60', len: 2.8, light: '#80ffb0',
      fx: { noise: 0.06, ghost: 0.16, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#06140c'], [1, '#14301e']]);
        rect(g, '#2a6a3a', 120, 140, 190, 60); rect(g, '#1a4a28', 120, 140, 190, 4);
        for (let i = 0; i < 6; i++) F.tile(g, 140 + i * 28, 168, 1.6, i, 0);
        G.drawFigure(g, X.look, 70, 210, 1.2);
        rect(g, '#0a1a10', 150, 20, 150, 60); caption(g, 'СЧЁТ', 225, 24, { size: 14, align: 'center', col: '#9affc0', shadow: false });
        caption(g, String(Math.min(60, Math.floor(seg(t, 0.4, 2.0) * 60))), 225, 42, { size: 26, align: 'center', col: '#ffffff', shadow: false });
        rect(g, '#0c1e5a', 0, 212, LW, 28); caption(g, 'НЕБЕСНЫЙ НЕФРИТ: ТУРНИР', 10, 215, { size: 16 });
      }
    },
    {
      key: 'rules', ch: 'AV', len: 3.0, light: '#ffe8a0',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.2) * 2), Math.round(Math.sin(t * 1.8) * 2));
        vgrad(g, -10, LH + 10, [[0, '#1a2a1e'], [1, '#2a3a28']], -10, LW + 20);
        rect(g, '#1a3a24', 10, 20, 200, 120); rect(g, '#3a5a3a', 10, 20, 200, 4);
        ['НОЛЬ ИНИЦИАТИВЫ', 'НОЛЬ ОТКАЗОВ', 'НОЛЬ ОТВЕТСТВ.'].forEach((s, i) => { const a = seg(t, 0.3 + i * 0.6, 0.5 + i * 0.6); if (a > 0) caption(g, s, 18, 34 + i * 32, { size: 17, col: rgba('#f2f2e0', a), shadow: false }); });
        G.drawFigure(g, X.look, 260, 206, 1.15, { flip: true });
        g.restore();
        caption(g, 'РАБОТА В УДОВОЛЬСТВИЕ', 12, LH - 46, { size: 16, col: '#bfffd0' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'nap', ch: '', len: 3.6, light: '#ffd8a0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#1e1810'], [1, '#14100a']]);
        for (let r = 0; r < 3; r++) for (let i = 0; i < 14; i++) rect(g, ['#7a3a2a', '#2a4a6a', '#5a5a3a', '#3a6a4a'][(r + i) % 4], 4 + i * 14, 20 + r * 36, 12, 30);
        rect(g, '#5a3a24', 0, 168, LW, 72); rect(g, '#6a4a30', 0, 166, LW, 4);
        G.drawFigure(g, X.look, 150, 214, 1.15);
        for (let i = 0; i < 4; i++) book(g, 200, 160 - i * 9, 44, 8, ['#3a6a4a', '#8a3a2a', '#3a6a4a', '#c8a050'][i], 0.03 * (i % 2 ? 1 : -1));
        F.tile(g, 96, 172, 1.4, 2, 0.2);
        for (let k = 0; k < 2; k++) { const ph = (t * 0.5 + k / 2) % 1; caption(g, 'z', 170 - ph * 6, 100 - ph * 24, { size: 10 + ph * 8, col: rgba('#f2f2f6', 1 - ph), shadow: false }); }
      }
    }
  ];

  SHOWS.yukong = [
    {
      key: 'airshow', ch: '26', len: 2.8, light: '#a0c8ff',
      fx: { noise: 0.06, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#4a6aa8'], [0.7, '#a8c4e8'], [1, '#e8d8b0']]);
        for (let i = 0; i < 5; i++) { const x = ((t * 90 + i * 30) % 420) - 50, y = 40 + Math.abs(i - 2) * 14; skiff(g, x, y, 1.3, '#5a6a8a'); lighter(g, () => line(g, rgba('#ffffff', 0.6), 2, x - 60, y + 2, x - 16, y + 2)); }
        G.drawFigure(g, X.look, 80, 210, 1.2);
        rect(g, '#0c1e5a', 0, 212, LW, 28); rect(g, '#e8c040', 0, 212, 8, 28);
        caption(g, 'КОМИССИЯ ПО ПОЛЁТАМ', 14, 216, { size: 17 });
      }
    },
    {
      key: 'ace', ch: 'AV', len: 3.0, light: '#ffc890',
      fx: { noise: 0.1, chroma: 1, wobble: 0.9, track: 1 },
      paint(g, t, X) {
        g.save(); g.translate(Math.round(Math.sin(t * 2.4) * 3), Math.round(Math.sin(t * 1.5) * 2));
        vgrad(g, -10, LH + 10, [[0, '#4a3a24'], [1, '#2a1e14']], -10, LW + 20);
        for (let i = 0; i < 6; i++) { const x = 30 + i * 50, on = Math.floor(t * 4 + i) % 2; rect(g, '#1a1a1e', x, 60, 14, 34); ell(g, on ? '#ff3a2a' : '#5a1a14', x + 7, 70, 4, 4); ell(g, '#3a2a10', x + 7, 84, 4, 4); }
        const x = lerp(-40, 360, (t / 3.0));
        skiff(g, x, 120, 1.8, '#c84a2a');
        lighter(g, () => line(g, rgba('#ffd890', 0.6), 3, x - 80, 122, x - 24, 122));
        g.restore();
        caption(g, 'АС ОГНЕННАЯ ЛИСИЦА', 12, 10, { size: 17, col: '#ffe0b0' });
        caption(g, '6 РАЗ НА КРАСНЫЙ', 12, 32, { size: 14, col: '#ffb090' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'kites', ch: '', len: 3.6, light: '#ffd8a0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#3a2a5a'], [0.6, '#c87a6a'], [1, '#e8b080']]);
        rect(g, '#5a3a24', 0, 196, LW, 44); rect(g, '#7a5a3a', 0, 196, LW, 3);
        G.drawFigure(g, X.look, 110, 214, 1.15);
        for (let i = 0; i < 3; i++) { const k = seg(t, 0.2 + i * 0.7, 3.4); if (k <= 0) continue; const x = 140 + i * 50 + Math.sin(t + i) * 6, y = lerp(170, 30 + i * 10, eOut(k)); F.kite(g, x, y, 1, ['#d84a3a', '#e8b040', '#f2ece0'][i], t, i); }
      }
    }
  ];

  SHOWS.guinaifen = [
    {
      key: 'stream', ch: '52', len: 2.8, light: '#ff9070',
      fx: { noise: 0.06, ghost: 0.14, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#1a0a14'], [1, '#3a1418']]);
        for (let i = 0; i < 6; i++) F.lanternR(g, 20 + i * 36, 8, 1, t, i, true);
        G.drawFigure(g, X.look, 110, 210, 1.25);
        const fire = seg(t, 1.0, 1.8) * (1 - seg(t, 1.8, 2.4));
        if (fire > 0) lighter(g, () => { for (let i = 0; i < 6; i++) poly(g, rgba(i % 2 ? '#ffb040' : '#ff5a20', fire), [130, 110, 200 + i * 6, 96 + Math.sin(t * 20 + i) * 10, 200 + i * 6, 120 + Math.sin(t * 18 + i) * 10]); glow(g, 190, 110, 40, '#ff7a30', fire * 0.7); });
        rect(g, 'rgba(0,0,0,0.6)', 222, 30, 94, 130);
        ['+1', 'ещё!', 'донат', 'Гуй!!', '+1'].forEach((m, i) => { if (t > 0.3 + i * 0.4) caption(g, m, 228, 36 + i * 22, { size: 14, col: i === 2 ? '#ffd040' : '#f2ece0', shadow: false }); });
        rect(g, '#c81e28', 10, 10, 80, 22); caption(g, '● ЭФИР', 16, 13, { size: 15, shadow: false });
      }
    },
    {
      key: 'boulder', ch: 'AV', len: 3.2, light: '#ffc890',
      fx: { noise: 0.09, chroma: 1, wobble: 0.8, track: 1 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        g.save(); g.translate(Math.round(Math.sin(t * 2) * 2), Math.round(Math.sin(t * 2.4) * 2));
        F.xianzhou(g, t, 150, ['#3a1a2a', '#8a3a3a', '#d8805a']);
        vgrad(g, 150, LH, [[0, '#6a4a3a'], [1, '#3a2a20']]);
        G.drawFigure(g, X.look, 110, 210, 1.15);
        const smash = seg(t, 1.0, 1.15);
        if (smash < 1) rect(g, '#6a7a6a', 80, 150, 60, 16); else { rect(g, '#6a7a6a', 70, 160, 26, 14); rect(g, '#6a7a6a', 120, 162, 24, 12); }
        if (t > 1.6) { G.drawFigure(g, X.lookOf('sushang'), lerp(330, 230, eOut(seg(t, 1.6, 2.0))), 210, 1.15, { flip: true }); caption(g, 'СТОЙ!', 240, 90, { size: 20, col: '#ff6a5a' }); }
        if (t > 2.4) K.smoke(g, t, 160, 180, 7, 60, '#e8e8f0', 0.7);
        g.restore();
        caption(g, 'ПЕРЕУЛОК: БЕЗ ЦЕНЗУРЫ', 12, 10, { size: 15, col: '#ffe0b0' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'noodles', ch: '', len: 3.6, light: '#ffb070',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        const F = H.FoursScenes;
        vgrad(g, 0, LH, [[0, '#120810'], [1, '#2a1410']]);
        for (let i = 0; i < 4; i++) F.lanternR(g, 40 + i * 80, 14, 1.1, t, i, i !== 2);
        rect(g, '#3a2a20', 0, 196, LW, 44);
        rect(g, '#6a4a2a', 130, 176, 60, 20);
        G.drawFigure(g, X.look, 160, 214, 1.1);
        noodles(g, 196, 172);
        F.hoop(g, 70, 170, 20, t * 0.4, 0.35);
        phone(g, 236, 168, 22, 30, '#1a2a4a');
        caption(g, '0', 247, 176, { size: 10, align: 'center', col: '#f2ece0', shadow: false });
      }
    }
  ];

  function cassette(g, x, y, w, h, lines, k) {
    rect(g, '#1a1a20', x, y, w, h); rect(g, '#2a2a32', x + 4, y + 4, w - 8, h - 8);
    rect(g, '#f2eee0', x + 10, y + 8, w - 20, h * 0.5);
    rect(g, '#d84a3a', x + 10, y + 8, w - 20, 4);
    lines.forEach((s, i) => caption(g, typed(s, k * lines.length - i), x + 16, y + 15 + i * 18, { size: 16, col: '#2a2a3a', shadow: false }));
    for (const d of [0.32, 0.68]) { ell(g, '#0e0e12', x + w * d, y + h * 0.78, 9, 9); ell(g, '#c8ccd4', x + w * d, y + h * 0.78, 4, 4); }
  }

  SHOWS.anby = [
    {
      key: 'promo', ch: '27', len: 2.8, light: '#ffc080',
      fx: { noise: 0.07, ghost: 0.18, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a1a3a'], [1, '#140c1c']]);
        rect(g, '#3a2a4a', 0, 18, LW, 160); rect(g, '#2a1e38', 0, 168, LW, 10);
        rect(g, '#f0c040', 16, 26, 288, 34);
        for (let i = 0; i < 24; i++) ell(g, (i + Math.floor(t * 6)) % 3 ? '#fff4c0' : '#c88a20', 22 + i * 12, 29, 2, 2);
        caption(g, 'КИНОТЕАТР', LW / 2, 36, { size: 20, align: 'center', col: '#3a1a10', shadow: false });
        rect(g, '#e8e4dc', 224, 70, 76, 100); rect(g, '#1a2a5a', 228, 74, 68, 92);
        caption(g, 'ПУЛЬС', 262, 80, { size: 16, align: 'center', col: '#ff5a5a' });
        g.strokeStyle = '#ff5a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(232, 130); g.lineTo(248, 130); g.lineTo(254, 116); g.lineTo(262, 146); g.lineTo(268, 124); g.lineTo(274, 130); g.lineTo(292, 130); g.stroke(); g.lineWidth = 1;
        G.drawFigure(g, X.look, 128, 212, 1.25);
        for (let i = 0; i < 3; i++) rect(g, '#f6f4ee', 146 + i * 3, 150 - i * 2, 14, 18);
        bubble(g, 156, 70, 'А В ФИНАЛЕ ОН…', seg(t, 0.5, 0.7), -14);
        const plug = seg(t, 1.3, 1.6);
        for (const [x, hair] of [[40, '#3a2a20'], [74, '#c8a060']]) {
          fan(g, x, 176, 1.3, hair, '#4a5a7a', false);
          if (plug > 0) for (const d of [-1, 1]) ell(g, '#e8c8b0', x + d * 11, 172 - 6 * plug, 4, 5);
        }
        rect(g, '#5a0e1a', 0, 214, LW, 26); rect(g, '#f0c040', 0, 214, 8, 26);
        caption(g, 'ПРЕМЬЕРА: «ПУЛЬС»', 14, 217, { size: 18 });
      }
    },
    {
      key: 'pulse', ch: 'AV', len: 3.0, light: '#ff9a60',
      fx: { noise: 0.08, chroma: 1, wobble: 0.7, track: 1 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#3a1e4a'], [0.55, '#e8783a'], [1, '#f2b05a']]);
        lighter(g, () => glow(g, 160, 150, 80, '#ffd890', 0.6));
        ell(g, '#ffe4a0', 160, 150, 30, 30);
        g.save(); g.translate(0, 26); skyline(g, 196, 7, '#7a3a48', '#ffc070'); g.restore();
        rect(g, '#0c0608', 0, 190, LW, 50); rect(g, '#2a1418', 0, 190, LW, 3);
        const k = sm(seg(t, 0.2, 1.6));
        for (const d of [-1, 1]) {
          const x = 160 + d * lerp(70, 22, k), s = 1.5;
          lighter(g, () => glow(g, x, 140, 34, '#ffb060', 0.35));
          ell(g, '#0c0608', x, 112, 9 * s, 10 * s); poly(g, '#0c0608', [x - 14 * s, 190, x + 14 * s, 190, x + 11 * s, 126, x - 11 * s, 126]);
          poly(g, '#0c0608', [x - d * 8, 136, x - d * 8, 144, x - d * lerp(40, 20, k), 148, x - d * lerp(40, 20, k), 140]);
        }
        const end = seg(t, 1.8, 2.3);
        if (end > 0) caption(g, 'КОНЕЦ', LW / 2, 60, { size: 26, align: 'center', col: rgba('#fff4e0', end) });
        rect(g, '#f4f4f6', 206, 10, 104, 84); rect(g, '#1e1014', 209, 13, 98, 78);
        rect(g, '#7a1a24', 209, 70, 98, 21);
        g.save(); g.beginPath(); g.rect(209, 13, 98, 78); g.clip();
        G.drawBust(g, X.look, 226, 18, 1.0);
        for (let i = 0; i < 3; i++) { const y = 50 + ((t * 40 + i * 13) % 34); ell(g, '#8ac8ff', 248 - (i % 2) * 2, y, 1.6, 2.4); ell(g, '#8ac8ff', 268 + (i % 2) * 2, y + 6, 1.6, 2.4); }
        g.restore();
        caption(g, 'ПУЛЬС · ФИНАЛ', 12, LH - 46, { size: 16, col: '#ffe0c0' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'tape', ch: '', len: 3.6, light: '#8ab0ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#0c1024'], [1, '#161a30']]);
        rect(g, '#1a2040', 12, 14, 110, 80); rect(g, '#2a3058', 12, 14, 110, 4);
        g.save(); g.beginPath(); g.rect(16, 18, 102, 72); g.clip();
        vgrad(g, 18, 90, [[0, '#101838'], [1, '#2a2a58']], 16, 102);
        skyline(g, 92, 13, '#0a0e20', '#f0d070');
        ell(g, '#f4f0d8', 96, 34, 8, 8);
        g.restore();
        rect(g, '#2a3058', 66, 14, 3, 80); rect(g, '#2a3058', 12, 52, 110, 3);
        rect(g, '#5a3a44', 120, 112, 150, 34); rect(g, '#6a4a54', 120, 104, 150, 12); rect(g, '#4a2e38', 116, 104, 8, 46); rect(g, '#4a2e38', 266, 104, 8, 46);
        g.save(); g.translate(144, 122); g.rotate(-Math.PI / 2); G.drawFigure(g, X.lookOf('nicole'), 0, 0, 0.85); g.restore();
        poly(g, '#6a5a9a', [170, 108, 262, 104, 266, 134, 168, 140]);
        poly(g, '#7a6aaa', [170, 108, 262, 104, 262, 110, 170, 114]);
        lighter(g, () => poly(g, 'rgba(160,190,255,0.10)', [20, 94, 120, 94, 240, 240, 0, 240]));
        G.drawBust(g, X.look, 206, 78, 1.7);
        rect(g, '#3a2a24', 196, 182, 124, 58); rect(g, '#4a362e', 196, 182, 124, 6);
        const pen = 0.2 + 0.8 * seg(t, 0.4, 2.8);
        cassette(g, 26, 150, 150, 84, ['МУЗЫКА ДЛЯ', 'ПРОГУЛОК'], pen);
        const px = 46 + Math.min(118, pen * 118), py = 174 + (pen > 0.55 ? 18 : 0);
        line(g, '#1a1a20', 3, px, py, px + 16, py - 22);
        ell(g, '#e8c8b0', px + 18, py - 24, 6, 5);
      }
    }
  ];

  function bunnyLogo(g, x, y, s, col) {
    for (const d of [-1, 1]) { poly(g, col, [x + d * 4 * s, y - 8 * s, x + d * 10 * s, y - 30 * s, x + d * 15 * s, y - 28 * s, x + d * 11 * s, y - 6 * s]); poly(g, '#ffffff', [x + d * 6.5 * s, y - 10 * s, x + d * 10.5 * s, y - 25 * s, x + d * 12 * s, y - 24 * s, x + d * 9.5 * s, y - 9 * s]); }
    ell(g, col, x, y, 14 * s, 12 * s);
    ell(g, '#1a1a22', x - 5 * s, y - 2 * s, 2 * s, 2.4 * s); ell(g, '#1a1a22', x + 5 * s, y - 2 * s, 2 * s, 2.4 * s);
    poly(g, '#1a1a22', [x - 2 * s, y + 3 * s, x + 2 * s, y + 3 * s, x, y + 5 * s]);
  }

  SHOWS.nicole = [
    {
      key: 'ad', ch: '09', len: 2.8, light: '#ff9ac8',
      fx: { noise: 0.07, ghost: 0.2, chroma: 1, wobble: 0.4, hum: 0.6 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#ff7ab8'], [1, '#c84a8a']]);
        for (let i = 0; i < 9; i++) rect(g, 'rgba(255,255,255,0.08)', i * 40 - ((t * 30) % 40), 0, 18, LH);
        bunnyLogo(g, 268, 70, 1.6, '#f4f4f6');
        caption(g, 'ХИТРЫЕ ЗАЙЦЫ', 14, 14, { size: 24, col: '#fff4c0', shadow: '#5a1030' });
        const a1 = seg(t, 0.3, 0.5), a2 = seg(t, 0.9, 1.1), blink = Math.floor(t * 4) % 2 === 0 || t < 1.6;
        if (a1 > 0) caption(g, 'НАЙДЁМ КОТА', 116, 64, { size: 20, col: rgba('#ffffff', a1), shadow: '#5a1030' });
        if (a2 > 0) caption(g, 'ИЛИ ОТОМСТИМ', 116, 92, { size: 20, col: rgba('#ffffff', a2), shadow: '#5a1030' });
        if (t > 1.6 && blink) { rect(g, '#ffe040', 112, 128, 196, 30); caption(g, 'БЫЛА БЫ ЦЕНА!', 210, 133, { size: 20, align: 'center', col: '#5a1030', shadow: false }); }
        ell(g, '#5a1a3a', 62, 150, 50, 66); ell(g, '#7a2a52', 62, 150, 44, 60);
        G.drawFigure(g, X.look, 62, 214, 1.25);
        rect(g, '#2e2e34', 92, 176, 30, 22); ell(g, '#c8a050', 107, 187, 6, 6); ell(g, '#2e2e34', 107, 187, 4, 4);
        rect(g, '#1a1a22', 0, 214, LW, 26);
        caption(g, 'ТЕЛ. 2-15-33', 14, 217, { size: 18, col: '#ff9ac8' });
      }
    },
    {
      key: 'news', ch: '14', len: 3.0, light: '#a8c0ff',
      fx: { noise: 0.06, ghost: 0.15, chroma: 1, wobble: 0.3 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#1a2440'], [1, '#0e1428']]);
        rect(g, '#0a0e18', 164, 22, 148, 108); rect(g, '#d83a3a', 164, 22, 148, 3);
        g.save(); g.beginPath(); g.rect(166, 26, 144, 102); g.clip();
        rect(g, '#141824', 166, 26, 144, 102); rect(g, '#2a2c34', 166, 92, 144, 36);
        for (let i = 0; i < 6; i++) rect(g, '#e8d070', 170 + i * 26 - ((t * 60) % 26), 108, 12, 2);
        const vx = 236 + Math.sin(t * 9) * 1.5;
        rect(g, '#3a3c48', vx - 44, 66, 88, 30); rect(g, '#4a4c58', vx - 30, 54, 54, 16);
        rect(g, '#9ab8d8', vx - 26, 57, 22, 11); rect(g, '#9ab8d8', vx, 57, 20, 11);
        ell(g, '#f2a0b2', vx - 16, 62, 6, 5); ell(g, '#f2a0b2', vx - 21, 66, 3, 6); ell(g, '#f2a0b2', vx - 11, 66, 3, 6);
        for (const x of [vx - 30, vx + 28]) ell(g, '#101016', x, 96, 9, 9);
        const fl = 1 - seg(t, 0.3, 0.6);
        if (fl > 0) rect(g, rgba('#ffffff', 0.8 * fl), 166, 26, 144, 102);
        g.strokeStyle = '#ff3a3a'; g.lineWidth = 2; g.strokeRect(vx - 30, 52, 28, 20); g.lineWidth = 1;
        g.restore();
        caption(g, '140 КМ/Ч', 170, 30, { size: 16, col: '#ff5a5a' });
        anchorDesk(g, X.lookOf('townswoman'), 'НОВОСТИ НЬЮ-ЭРИДУ');
        ticker(g, 'ВОДИТЕЛЬ БЕЗ ПРАВ СНОВА ОТОРВАЛСЯ ОТ ПОГОНИ   ', 214, 26, t, 70, '#5a0e1a', '#ffffff');
      }
    },
    {
      key: 'sun', ch: '', len: 3.6, light: '#ffe0a0',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#2a2632'], [1, '#1a1820']]);
        rect(g, '#3a3440', 0, 0, LW, 150); rect(g, '#24202a', 0, 150, LW, 90);
        for (let x = 0; x < LW; x += 32) rect(g, '#342e3a', x, 0, 1, 150);
        rect(g, '#5a5060', 196, 24, 96, 86); rect(g, '#8a8098', 200, 28, 88, 78);
        vgrad(g, 28, 106, [[0, '#ffd890'], [1, '#f0a860']], 200, 88);
        rect(g, '#5a5060', 242, 28, 4, 78); rect(g, '#5a5060', 200, 64, 88, 4);
        const k = sm(seg(t, 0.4, 1.4)), mx = 200, my = 122;
        lighter(g, () => { poly(g, 'rgba(255,224,150,0.18)', [246, 66, 262, 66, mx + 6, my + 2, mx - 6, my - 2]); if (k > 0) poly(g, rgba('#fff0b0', 0.22 * k), [mx - 4, my - 2, mx + 4, my + 2, lerp(mx, 74, k) + 18, lerp(my, 60, k) + 10, lerp(mx, 74, k) - 18, lerp(my, 60, k) - 10]); });
        g.save(); g.translate(14, 128); g.scale(1.35, 1.35); bed(g, 0, 0, 110, '#8a6a4a'); g.restore();
        const sx = lerp(mx, 74, k), sy = lerp(my, 60, k);
        if (k > 0) lighter(g, () => { glow(g, sx, sy, 26 * k, '#fff2b0', 0.8); ell(g, rgba('#fff8d8', k), sx, sy, 10, 10); });
        const kid = Object.assign({}, X.lookOf('kid'), { hair: '#f2a0b2', hairHi: '#ffc8d4' });
        G.drawFigure(g, kid, 188, 222, 1.35);
        rect(g, '#c8d4e0', mx - 7, my - 6, 9, 12); rect(g, '#f4f8ff', mx - 5, my - 4, 5, 8);
        if (t > 1.6) { const a = seg(t, 1.6, 2.0); ell(g, rgba('#2a1a14', a), 29, 114, 1.6, 1.6); ell(g, rgba('#2a1a14', a), 37, 114, 1.6, 1.6); g.strokeStyle = rgba('#3a2a20', a); g.lineWidth = 1.5; g.beginPath(); g.arc(33, 117, 3.4, 0.3, Math.PI - 0.3); g.stroke(); g.lineWidth = 1; }
        for (let i = 0; i < 10; i++) lighter(g, () => ell(g, 'rgba(255,240,200,0.5)', 210 + hx(i, 2, 9) * 70, 40 + ((t * 8 + hx(i, 3, 9) * 60) % 60), 1, 1));
      }
    }
  ];

  function starShape(g, x, y, r, col) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    poly(g, col, pts);
  }

  function starKnight(g, x, y, s, t) {
    const sway = Math.sin(t * 3) * 2 * s;
    poly(g, '#c8283a', [x - 10 * s, y - 60 * s, x + 10 * s, y - 60 * s, x + 22 * s + sway, y, x - 22 * s + sway, y]);
    poly(g, '#e8ecf4', [x - 12 * s, y - 62 * s, x + 12 * s, y - 62 * s, x + 10 * s, y - 24 * s, x - 10 * s, y - 24 * s]);
    rect(g, '#d8b050', x - 12 * s, y - 30 * s, 24 * s, 4 * s);
    rect(g, '#2a2c3a', x - 9 * s, y - 24 * s, 7 * s, 24 * s); rect(g, '#2a2c3a', x + 2 * s, y - 24 * s, 7 * s, 24 * s);
    ell(g, '#e8ecf4', x, y - 72 * s, 10 * s, 11 * s);
    rect(g, '#1a1c2a', x - 7 * s, y - 75 * s, 14 * s, 5 * s);
    starShape(g, x, y - 48 * s, 6 * s, '#ffd040');
    poly(g, '#ffd040', [x - 3 * s, y - 82 * s, x, y - 92 * s, x + 3 * s, y - 82 * s]);
  }

  function motorbike(g, x, y, s, col) {
    for (const d of [-1, 1]) { ell(g, '#101014', x + d * 22 * s, y, 11 * s, 11 * s); ell(g, '#5a5c66', x + d * 22 * s, y, 5 * s, 5 * s); }
    poly(g, col, [x - 22 * s, y - 4 * s, x - 6 * s, y - 16 * s, x + 14 * s, y - 16 * s, x + 24 * s, y - 2 * s, x + 6 * s, y - 2 * s]);
    rect(g, '#c8ccd4', x + 12 * s, y - 24 * s, 3 * s, 10 * s); rect(g, '#c8ccd4', x + 8 * s, y - 25 * s, 10 * s, 2 * s);
    rect(g, '#2a2a30', x - 14 * s, y - 20 * s, 16 * s, 5 * s);
  }

  SHOWS.billy = [
    {
      key: 'knight', ch: '11', len: 2.8, light: '#ffd070',
      fx: { noise: 0.07, ghost: 0.2, chroma: 1, wobble: 0.4 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#0a0a24'], [1, '#2a1a3a']]);
        for (let i = 0; i < 4; i++) { const k = ((t * 0.7 + i * 0.27) % 1); lighter(g, () => line(g, rgba('#ffe8a0', 1 - k), 2, 40 + i * 70 + k * 60, k * 90, 10 + i * 70 + k * 60, k * 90 - 30)); }
        skyline(g, 200, 21, '#141228', '#5a4a8a');
        const hit = seg(t, 1.2, 1.5);
        ell(g, '#6a2a8a', 236, 160, 44, 38); ell(g, '#8a3aaa', 230, 150, 30, 24);
        for (let i = 0; i < 5; i++) poly(g, '#f4f0e8', [212 + i * 9, 172, 216 + i * 9, 182, 220 + i * 9, 172]);
        ell(g, '#ffe040', 222, 146, 5, 5); ell(g, '#ffe040', 244, 146, 5, 5);
        starKnight(g, 96, 206, 1.45, t);
        if (hit > 0) lighter(g, () => { line(g, rgba('#fff4b0', 1), 6 * (1 - hit) + 2, 122, 132, 214, 152); glow(g, 214, 152, 40 * hit, '#ffe080', 0.8 * (1 - hit)); for (let i = 0; i < 5; i++) starShape(g, 214 + Math.cos(i * 1.3) * 40 * hit, 152 + Math.sin(i * 1.3) * 30 * hit, 5, rgba('#ffe060', 1 - hit)); });
        rect(g, '#0e0e2a', 0, 0, LW, 30); rect(g, '#ffd040', 0, 28, LW, 2);
        caption(g, 'ЗВЁЗДНЫЙ РЫЦАРЬ', 12, 6, { size: 20, col: '#ffd040' });
        rect(g, '#c8283a', 0, 214, 150, 26);
        caption(g, 'РЕЙТИНГ 11,8%', 10, 217, { size: 18 });
      }
    },
    {
      key: 'outer', ch: 'AV', len: 3.0, light: '#e8b070',
      fx: { noise: 0.1, chroma: 1, wobble: 0.8, track: 1 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#c89a6a'], [0.6, '#e8c08a'], [1, '#8a6a4a']]);
        ell(g, '#f8e0b0', 250, 70, 26, 26);
        for (let i = 0; i < 3; i++) poly(g, '#a07a5a', [i * 140 - 40, 150, i * 140 + 40, 96 + i * 8, i * 140 + 130, 150]);
        rect(g, '#5a4a3a', 0, 150, LW, 90);
        for (let i = 0; i < 7; i++) rect(g, '#e8d8a0', ((i * 60 - t * 160) % 420 + 420) % 420 - 50, 192, 30, 4);
        const bx = 140 + Math.sin(t * 2) * 3;
        motorbike(g, bx, 186, 1.6, '#c8283a');
        G.drawBust(g, X.look, bx - 52, 74, 1.2);
        const fl = t * 9;
        poly(g, '#d8283a', [bx - 18, 122, bx - 10, 128, bx - 70 - Math.sin(fl) * 6, 118 + Math.sin(fl * 1.3) * 5, bx - 92, 128 + Math.sin(fl) * 7, bx - 64, 132]);
        rect(g, '#2a1a10', 196, 118, 110, 30); rect(g, '#e8c040', 198, 120, 106, 26);
        caption(g, 'ЧЕМПИОН', 251, 124, { size: 18, align: 'center', col: '#2a1a10', shadow: false });
        caption(g, 'ОБЪЕЗДНАЯ', 12, LH - 46, { size: 16, col: '#fff0d0' });
        caption(g, '► PLAY', 12, LH - 24, { size: 16 });
      }
    },
    {
      key: 'repair', ch: '', len: 3.6, light: '#9ab8ff',
      fx: { noise: 0.02, wobble: 0.15 },
      paint(g, t, X) {
        vgrad(g, 0, LH, [[0, '#10141e'], [1, '#1a1e2a']]);
        for (let y = 20; y < 150; y += 26) rect(g, '#1e2432', 0, y, LW, 2);
        rect(g, '#2a2e3a', 8, 30, 110, 120); for (let i = 0; i < 4; i++) rect(g, '#3a3e4a', 8, 50 + i * 26, 110, 3);
        for (let i = 0; i < 3; i++) { rect(g, '#5a5c66', 18 + i * 32, 36, 6, 14); rect(g, '#8a8c96', 14 + i * 32, 34, 14, 4); }
        rect(g, '#2a2c34', 26, 92, 70, 52); rect(g, '#141824', 30, 96, 62, 40);
        vgrad(g, 96, 136, [[0, '#2a2a5a'], [1, '#141432']], 30, 62);
        starShape(g, 61, 116, 12 + Math.sin(t * 4) * 2, '#ffd040');
        lighter(g, () => glow(g, 61, 116, 40, '#ffe080', 0.25));
        G.drawBust(g, X.look, 160, 66, 1.9);
        rect(g, '#3a2a24', 120, 186, 200, 54); rect(g, '#4a362e', 120, 186, 200, 5);
        rect(g, '#f2eee0', 124, 150, 150, 70); rect(g, '#d8d4c8', 124, 150, 150, 3);
        caption(g, 'РЕМОНТ: 500', 132, 158, { size: 18, col: '#3a3a44', shadow: false });
        const k = seg(t, 1.0, 1.6);
        if (k > 0) line(g, '#d83a3a', 4, 130, 172, 130 + 136 * k, 166);
        if (t > 1.8) caption(g, 'ОПЛАЧЕНО. Н.', 132, 188, { size: 18, col: rgba('#c8287a', seg(t, 1.8, 2.2)), shadow: false });
        rect(g, '#c8b49a', 284, 168, 26, 32); rect(g, '#e8d8c0', 284, 168, 26, 5); rect(g, '#7a4a2a', 288, 176, 18, 14);
        for (let i = 0; i < 3; i++) { const y = 160 - ((t * 20 + i * 9) % 26); lighter(g, () => ell(g, 'rgba(220,230,255,0.35)', 293 + i * 4 + Math.sin(t * 3 + i) * 3, y, 3, 4)); }
      }
    }
  ];

  const VIG = (() => {
    const v = new Float32Array(TW * TH);
    for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
      const dx = (x + 0.5) / TW * 2 - 1, dy = (y + 0.5) / TH * 2 - 1;
      v[y * TW + x] = 1 - 0.45 * Math.min(1, (dx ** 4 + dy ** 4) * 0.7);
    }
    return v;
  })();

  const cx = x => (x < 0 ? 0 : x >= TW ? TW - 1 : x);

  function crt(s, d, t, fx, st, od) {
    let seed = ((Math.floor(t * 30) + 1) * 2654435761) >>> 0;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const f = Math.floor(t * 24), nz0 = fx.noise || 0, gh = fx.ghost || 0, ch = fx.chroma || 0, wob = fx.wobble || 0, hum = fx.hum || 0;
    const trackY = fx.track ? (t * 26) % (TH + 40) - 20 : -999;
    const tearOn = fx.track && hx(f >> 3, 3, 41) > 0.6, tearY = Math.floor(hx(f >> 3, 4, 41) * TH);
    const pw = st.power, half = TH / 2 * eOut(seg(pw, 0.25, 1)), wid = TW / 2 * eOut(seg(pw, 0, 0.25)), boost = 1 + 1.6 * (1 - seg(pw, 0.4, 1));
    for (let y = 0; y < TH; y++) {
      const ry = y - st.roll, row = (((ry % TH) + TH) % TH) * TW * 4, vbar = st.roll > 0 && ry < 0 && ry >= -6;
      const tr = trackY > -999 ? Math.max(0, 1 - Math.abs(y - trackY) / 5) : 0;
      const dx = Math.round(wob * Math.sin(y * 0.4 + t * 11) + (tr > 0 ? (rnd() - 0.5) * 18 * tr : 0) + (tearOn && y >= tearY && y < tearY + 8 ? 5 - (y - tearY) * 0.6 : 0) + (st.snow > 0 ? (rnd() - 0.5) * 12 * st.snow : 0));
      const band = hum ? 1 - hum * 0.25 * Math.pow(Math.max(0, Math.sin((y / TH - t * 0.35) * Math.PI * 2)), 3) : 1;
      const lineK = (y & 1 ? 0.8 : 1) * band * boost, nz = Math.min(1, nz0 + tr * 0.7 + st.snow);
      const inY = pw >= 1 || Math.abs(y + 0.5 - TH / 2) <= Math.max(0.6, half), thin = pw < 1 && half < 1.5;
      for (let x = 0; x < TW; x++) {
        const o = (y * TW + x) * 4;
        d[o + 3] = 255;
        if (!inY || (pw < 1 && Math.abs(x + 0.5 - TW / 2) > wid)) { d[o] = d[o + 1] = d[o + 2] = 0; continue; }
        let r, g, b;
        if (thin) r = g = b = 255;
        else if (vbar) r = g = b = 8;
        else {
          const sx = x - dx, a = row + cx(sx) * 4;
          r = s[row + cx(sx + ch) * 4]; g = s[a + 1]; b = s[row + cx(sx - ch) * 4 + 2];
          if (gh) { const j = row + cx(sx - 8) * 4; r += s[j] * gh; g += s[j + 1] * gh; b += s[j + 2] * gh; }
        }
        if (nz > 0 && !thin) { const n = rnd() * 255; r += (n - r) * nz; g += (n - g) * nz; b += (n + 8 - b) * nz; }
        const k = lineK * VIG[y * TW + x];
        r *= k; g *= k; b *= k;
        if (od && od[o + 3]) { const a = od[o + 3] / 255; r += (od[o] - r) * a; g += (od[o + 1] - g) * a; b += (od[o + 2] - b) * a; }
        d[o] = r; d[o + 1] = g; d[o + 2] = b;
      }
    }
  }

  function has(id) { return !!SHOWS[id]; }

  function at(id, t) {
    const list = SHOWS[id];
    if (t < POWER) return { i: 0, lt: 0, power: Math.max(0, t) / POWER, snow: 0, roll: 0 };
    const total = list.reduce((s, p) => s + p.len, 0);
    let u = (t - POWER) % total, i = 0;
    while (i < list.length - 1 && u >= list[i].len) { u -= list[i].len; i++; }
    const k = t - POWER < list[0].len ? 0 : 1 - seg(u, 0, SWITCH);
    return { i, lt: u, power: 1, snow: k, roll: k > 0 ? Math.round(TH * 0.9 * sm(k)) : 0 };
  }

  let work = null;
  function buffers() {
    if (work) return work;
    const big = G.mkCanvas(LW, LH), small = G.mkCanvas(TW, TH);
    work = { big, small, tex: { w: TW, h: TH, d: new Uint8ClampedArray(TW * TH * 4), wrap: false }, id: null, t: null };
    return work;
  }

  function screen(id, t, game) {
    const B = buffers();
    if (B.id === id && B.t === t) return B.tex;
    const st = at(id, t), p = SHOWS[id][st.i], g = B.big.getContext('2d');
    g.save();
    g.imageSmoothingEnabled = false; g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    rect(g, '#000000', 0, 0, LW, LH);
    p.paint(g, st.lt, { look: G.lookOf(id, game), lookOf: k => G.sceneLookOf(k, game), game });
    g.restore();
    const sg = B.small.getContext('2d');
    sg.imageSmoothingEnabled = true;
    sg.drawImage(B.big, 0, 0, LW, LH, 0, 0, TW, TH);
    crt(sg.getImageData(0, 0, TW, TH).data, B.tex.d, t, p.fx, st, p.ch && st.power >= 1 && st.lt < OSD ? osd(p.ch) : null);
    B.id = id; B.t = t;
    return B.tex;
  }

  function light(id, t) {
    const st = at(id, t), p = SHOWS[id][st.i];
    return { col: st.snow > 0.5 ? '#c8d0e0' : p.light, a: (0.2 + 0.15 * st.snow) * st.power };
  }

  H.SignalTV = { SHOWS, has, at, screen, light, TW, TH, POWER, SWITCH };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
