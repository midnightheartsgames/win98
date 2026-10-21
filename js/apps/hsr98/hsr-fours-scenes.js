(function (H) {
  'use strict';
  const K = H.Cine.Kit, A = H.Ults.Art, E = H.Eidolons;
  const { LW, LH, BAR, cl, lerp, eOut, eIn, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash } = K;
  const FLOOR = LH - BAR;
  const hero = (S, look, x, y, o) => S.fig(look, x, y, Object.assign({ k: 2 }, o));

  function xianzhou(g, T, horizon, pal) {
    const p = pal || ['#f2b8a8', '#f8dcc8', '#c8e4e0'];
    vgrad(g, 0, horizon, [[0, p[0]], [0.6, p[1]], [1, p[2]]]);
    for (let i = 0; i < 6; i++) { const x = ((i * 70 + T * 6) % 420) - 50, y = 22 + (i % 3) * 14; ell(g, 'rgba(255,255,255,0.35)', x, y, 34, 6); }
    for (let i = 0; i < 7; i++) {
      const x = 8 + i * 48, h = 30 + hx(i, 2, 13) * 40, base = horizon;
      rect(g, '#6a8a8a', x + 8, base - h, 18, h);
      for (let k = 0; k < 3; k++) { const y = base - h + k * (h / 3), w = 30 - k * 4; poly(g, '#3a5a5a', [x + 17 - w / 2 - 4, y + 4, x + 17, y - 6, x + 17 + w / 2 + 4, y + 4]); }
    }
    for (let i = 0; i < 3; i++) { const x = ((T * 14 + i * 120) % 420) - 50, y = 40 + i * 18; poly(g, '#7a5a3a', [x - 12, y, x + 12, y, x + 8, y + 4, x - 8, y + 4]); rect(g, '#d8b050', x - 1, y - 8, 2, 8); poly(g, '#f2ece0', [x + 1, y - 8, x + 9, y - 3, x + 1, y - 2]); }
  }

  function snowNight(g, T, horizon) {
    vgrad(g, 0, horizon, [[0, '#04081a'], [0.7, '#0e1c34'], [1, '#2a3a54']]);
    K.stars(g, T, 50, 21, 0.8, horizon);
    lighter(g, () => {
      for (let b = 0; b < 3; b++) {
        g.strokeStyle = rgba(b === 1 ? '#ff8ad8' : '#6affb8', 0.18 + 0.06 * Math.sin(T + b)); g.lineWidth = 10 - b * 2;
        g.beginPath();
        for (let x = 0; x <= LW; x += 8) { const y = 40 + b * 16 + Math.sin(x * 0.02 + T * 0.7 + b * 2) * 14; if (x) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
      }
      g.lineWidth = 1;
    });
    vgrad(g, horizon, LH, [[0, '#c8d8ec'], [1, '#8aa0c0']]);
  }

  function tent(g, x, y, s, lit) {
    poly(g, '#c8483a', [x - 24 * s, y, x, y - 30 * s, x + 24 * s, y]);
    poly(g, '#8a2a24', [x, y - 30 * s, x + 24 * s, y, x + 6 * s, y]);
    poly(g, lit ? '#ffd890' : '#2a1410', [x - 5 * s, y, x, y - 12 * s, x + 5 * s, y]);
    if (lit) lighter(g, () => glow(g, x, y - 6 * s, 22 * s, '#ffc870', 0.4));
  }

  function can(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    rect(g, '#9aa4b0', -5 * s, -7 * s, 10 * s, 14 * s); rect(g, '#d84a3a', -5 * s, -3 * s, 10 * s, 6 * s); rect(g, '#f2e6c8', -3 * s, -2 * s, 6 * s, 3 * s);
    ell(g, '#c8ccd4', 0, -7 * s, 5 * s, 1.6 * s);
    g.restore();
  }

  function cross(g, x, y, s, a) { rect(g, rgba('#a0ffb8', a), Math.round(x - 3 * s), Math.round(y - s), Math.round(6 * s), Math.max(1, Math.round(2 * s))); rect(g, rgba('#a0ffb8', a), Math.round(x - s), Math.round(y - 3 * s), Math.max(1, Math.round(2 * s)), Math.round(6 * s)); }

  function gauntlet(g, x, y, s, rot, heat) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    rect(g, '#3a3c48', -20, -9, 22, 18); rect(g, '#8a8e9c', -20, -9, 22, 4); rect(g, '#d8402a', -6, -9, 3, 18);
    rect(g, '#5a5e6c', 2, -12, 18, 24); rect(g, '#a8acb8', 2, -12, 18, 5);
    for (let i = 0; i < 4; i++) rect(g, '#2a2c34', 4 + i * 4, -12, 1, 24);
    ell(g, '#d8402a', -12, 0, 3, 3);
    if (heat) lighter(g, () => glow(g, 12, 0, 22, '#ff7a3a', heat));
    g.restore();
  }

  function ropes(g, y0, col) {
    for (let r = 0; r < 3; r++) { const y = y0 + r * 14; line(g, col || '#e04a3a', 2, 0, y, LW, y - 6); }
    for (const x of [14, 306]) { rect(g, '#1a1a22', x - 4, y0 - 10, 8, 56); rect(g, '#d8d8e0', x - 4, y0 - 10, 8, 3); }
  }

  function phoenix(g, x, y, s, a, T) {
    if (a <= 0) return;
    lighter(g, () => {
      glow(g, x, y, 60 * s, '#ff7a3a', 0.45 * a);
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
          const q = -0.3 - i * 0.22 + Math.sin(T * 6) * 0.08, len = (60 - i * 6) * s;
          poly(g, rgba(i % 2 ? '#ffb040' : '#ff5a2a', 0.7 * a), [x, y, x + sd * Math.cos(q) * len, y + Math.sin(q) * len, x + sd * Math.cos(q + 0.14) * len * 0.8, y + Math.sin(q + 0.14) * len * 0.8]);
        }
      }
      poly(g, rgba('#fff0c0', a), [x - 4 * s, y + 4 * s, x, y - 14 * s, x + 4 * s, y + 4 * s]);
      for (let i = 0; i < 3; i++) poly(g, rgba('#ff8a3a', 0.6 * a), [x - 3 * s + i * 3 * s, y + 4 * s, x - 10 * s + i * 10 * s, y + 46 * s + Math.sin(T * 5 + i) * 4, x + 3 * s + i * 2 * s, y + 6 * s]);
    });
  }

  function chain(g, x0, y0, x1, y1, k, col) {
    const n = 16, len = Math.hypot(x1 - x0, y1 - y0) * k;
    if (len <= 1) return;
    const a = Math.atan2(y1 - y0, x1 - x0);
    for (let i = 0; i < n; i++) {
      const d = i / n * len;
      if (d > len) break;
      g.save(); g.translate(x0 + Math.cos(a) * d, y0 + Math.sin(a) * d); g.rotate(a + (i % 2 ? Math.PI / 2 : 0));
      g.strokeStyle = col || '#c8ccd8'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 0, 4, 2, 0, 0, Math.PI * 2); g.stroke();
      g.restore();
    }
    g.lineWidth = 1;
  }

  function fan(g, x, y, r, a0, a1, col, rim) {
    const n = 7;
    for (let i = 0; i < n; i++) { const q0 = lerp(a0, a1, i / n), q1 = lerp(a0, a1, (i + 1) / n); poly(g, i % 2 ? col : G_light(col), [x, y, x + Math.cos(q0) * r, y + Math.sin(q0) * r, x + Math.cos(q1) * r, y + Math.sin(q1) * r]); }
    g.strokeStyle = rim || '#d8b050'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, a0, a1); g.stroke(); g.lineWidth = 1;
    ell(g, rim || '#d8b050', x, y, 2, 2);
  }
  function G_light(c) { return H.Gfx.light(c, 0.25); }

  function tile(g, x, y, s, suit, rot, a) {
    const col = ['#3aa86a', '#3a7ad8', '#d83a3a'][suit % 3];
    g.save(); g.translate(x, y); g.rotate(rot || 0); if (a != null) g.globalAlpha *= cl(a);
    rect(g, '#2a6a4a', -6 * s, -8 * s, 12 * s, 16 * s); rect(g, '#f4f0e0', -5 * s, -8 * s, 10 * s, 14 * s);
    if (suit % 3 === 0) { rect(g, col, -3 * s, -6 * s, 2 * s, 9 * s); rect(g, col, 1 * s, -6 * s, 2 * s, 9 * s); }
    else if (suit % 3 === 1) { ell(g, col, 0, -1 * s, 3.4 * s, 3.4 * s); ell(g, '#f4f0e0', 0, -1 * s, 1.4 * s, 1.4 * s); }
    else { rect(g, col, -3 * s, -5 * s, 6 * s, 1.2 * s); rect(g, col, -0.6 * s, -5 * s, 1.2 * s, 8 * s); rect(g, col, -3 * s, -1 * s, 6 * s, 1.2 * s); rect(g, col, -3 * s, 2 * s, 6 * s, 1.2 * s); }
    g.restore();
  }

  function kite(g, x, y, s, col, T, i) {
    g.save(); g.translate(x, y); g.rotate(Math.sin(T * 2 + i) * 0.15);
    poly(g, col, [0, -12 * s, 8 * s, 0, 0, 14 * s, -8 * s, 0]);
    poly(g, H.Gfx.light(col, 0.3), [0, -12 * s, 8 * s, 0, 0, 0]);
    line(g, '#f2ece0', 1, 0, -12 * s, 0, 14 * s); line(g, '#f2ece0', 1, -8 * s, 0, 8 * s, 0);
    g.strokeStyle = rgba('#f2ece0', 0.8); g.beginPath(); g.moveTo(0, 14 * s);
    for (let k = 1; k <= 5; k++) g.lineTo(Math.sin(T * 4 + k + i) * 4 * s, 14 * s + k * 6 * s);
    g.stroke();
    g.restore();
  }

  function hoop(g, x, y, r, T, a) {
    lighter(g, () => {
      g.strokeStyle = rgba('#ffd060', a); g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1;
      for (let i = 0; i < 10; i++) { const q = i / 10 * Math.PI * 2 + T * 3, fx = x + Math.cos(q) * r, fy = y + Math.sin(q) * r; poly(g, rgba(i % 2 ? '#ffb040' : '#ff5a20', a), [fx - 3, fy, fx + Math.cos(q) * 4, fy + Math.sin(q) * 4 - 6, fx + 3, fy]); }
    });
  }

  function firework(g, x, y, k, col, seed) {
    if (k <= 0 || k >= 1) return;
    lighter(g, () => { for (let i = 0; i < 14; i++) { const q = i / 14 * Math.PI * 2 + seed, r = eOut(k) * 40; rect(g, rgba(i % 2 ? col : '#fff4c0', 1 - k), Math.round(x + Math.cos(q) * r), Math.round(y + Math.sin(q) * r + k * k * 12), 2, 2); } glow(g, x, y, 20, col, 0.5 * (1 - k)); });
  }

  function brush(g, pts, k, col, w) {
    const n = Math.max(2, Math.floor(pts.length / 2 * k));
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath();
    for (let i = 0; i < n; i++) { const x = pts[i * 2], y = pts[i * 2 + 1]; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke(); g.lineWidth = 1; g.lineCap = 'butt';
  }

  function stamp(g, x, y, s, text, a, col) {
    if (a <= 0) return;
    g.save(); g.translate(x, y); g.rotate(-0.12); g.scale(s, s); g.globalAlpha *= a;
    g.strokeStyle = col || '#d83a3a'; g.lineWidth = 3; g.strokeRect(-34, -14, 68, 28); g.lineWidth = 1;
    g.fillStyle = col || '#d83a3a'; g.font = 'bold 15px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 1);
    g.restore();
  }

  function coffin(g, x, y, w, h) {
    poly(g, '#1a1418', [x - w * 0.4, y - h, x + w * 0.4, y - h, x + w * 0.5, y - h * 0.7, x + w * 0.35, y, x - w * 0.35, y, x - w * 0.5, y - h * 0.7]);
    poly(g, '#2a2228', [x - w * 0.34, y - h + 3, x + w * 0.34, y - h + 3, x + w * 0.42, y - h * 0.7, x + w * 0.3, y - 3, x - w * 0.3, y - 3, x - w * 0.42, y - h * 0.7]);
    rect(g, '#c8a050', x - 1, y - h + 6, 2, h - 12); rect(g, '#c8a050', x - w * 0.18, y - h * 0.7, w * 0.36, 2);
  }

  function counter(g, x, y, w) {
    rect(g, '#5a2a1a', x, y, w, 30); rect(g, '#8a3a22', x, y, w, 4); rect(g, '#d8b050', x, y + 4, w, 1);
    for (let i = 0; i < w; i += 16) rect(g, '#4a2214', x + i, y + 8, 1, 22);
  }

  function lanternR(g, x, y, s, T, i, lit) {
    line(g, '#3a2a20', 1, x, y - 10 * s, x, y);
    ell(g, '#c8302a', x, y + 6 * s, 6 * s, 8 * s); rect(g, '#d8b050', x - 4 * s, y - 1 * s, 8 * s, 2 * s); rect(g, '#d8b050', x - 4 * s, y + 13 * s, 8 * s, 2 * s);
    rect(g, '#d8b050', x - 0.5, y + 15 * s, 1, 6 * s);
    if (lit) lighter(g, () => glow(g, x, y + 6 * s, 14 * s, '#ffb060', 0.45 + 0.1 * Math.sin(T * 4 + i)));
  }

  const ULTS = {
    lynx: {
      line: 'Для сложного случая испробуем всё!', side: 'r', d: 1.4, team: 'heal', sfx: [[0.1, 'whoosh'], [0.5, 'glint'], [0.9, 'heal'], [1.15, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, toss = seg(t, 0.35, 0.9);
        snowNight(g, T, 170);
        tent(g, 60, 176, 1.2, true);
        K.snowfall(g, T, 30, 7, { speed: 30, wind: 20, a: 0.7 });
        hero(S, P.look, 170, 262);
        for (let i = 0; i < 4; i++) {
          const k = seg(t, 0.35 + i * 0.08, 0.9 + i * 0.08);
          if (k <= 0 || k >= 1) continue;
          can(g, lerp(190, 40 + i * 80, k), lerp(140, 60, k) + Math.sin(k * Math.PI) * -40, 1.2, k * 9);
        }
        if (t > 0.85) for (let i = 0; i < 16; i++) { const ph = (T * 0.7 + hx(i, 1, 31)) % 1; cross(g, hx(i, 2, 31) * LW, FLOOR - ph * 160, 1, (1 - ph) * cl((t - 0.85) * 4)); }
        if (toss > 0 && toss < 0.2) flash(g, '#e8fff0', 0.3 * (1 - toss / 0.2));
      }
    },
    luka: {
      line: 'Полюбуемся на летящие искры!', side: 'l', v: { mouth: 'open' }, d: 1.5, sfx: [[0.1, 'tech'], [0.45, 'swing'], [0.6, 'swing'], [0.75, 'swing'], [1.05, 'crit'], [1.15, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, up = seg(t, 1.0, 1.5);
        vgrad(g, 0, LH, [[0, '#0a0408'], [0.6, '#2a0c10'], [1, '#14060a']]);
        lighter(g, () => poly(g, 'rgba(255,230,200,0.12)', [130, 0, 190, 0, 250, FLOOR, 70, FLOOR]));
        ropes(g, 150);
        hero(S, P.look, 110, 262 - (t > 1.0 ? 10 * Math.sin(up * Math.PI) : 0));
        [0.45, 0.6, 0.75, 0.9].forEach((at, i) => { if (t < at || t > at + 0.18) return; const k = (t - at) / 0.18; gauntlet(g, lerp(150, 230, eOut(k)), 120 + (i % 2 ? -14 : 10), 1.2, 0, 1 - k); lighter(g, () => ring(g, rgba('#ffd0a0', 1 - k), 2, 236, 118 + (i % 2 ? -14 : 10), 6 + k * 20)); });
        if (up > 0) {
          gauntlet(g, lerp(160, 210, eOut(up)), lerp(170, 50, eOut(up)), 1.6, -1.2, 1 - up * 0.5);
          for (let i = 0; i < 26; i++) { const q = -Math.PI / 2 + (hx(i, 1, 17) - 0.5) * 1.6, r = eOut(up) * (40 + hx(i, 2, 17) * 120); rect(g, rgba(i % 3 ? '#ff7a3a' : '#ffe0a0', 1 - up), Math.round(210 + Math.cos(q) * r), Math.round(60 + Math.sin(q) * r), 2, 2); }
          if (up < 0.2) flash(g, '#ffe0c0', 0.5 * (1 - up / 0.2));
        }
      }
    },
    sushang: {
      line: 'Форма Тайсюй! Феникс, восстань!', side: 'r', v: { mouth: 'open' }, d: 1.55, sfx: [[0.1, 'glint'], [0.45, 'ult'], [0.95, 'swing'], [1.1, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.3, 0.9)), cut = seg(t, 0.95, 1.35);
        vgrad(g, 0, LH, [[0, '#2a0a10'], [0.6, '#8a2a1a'], [1, '#f2a060']]);
        for (let i = 0; i < 20; i++) { const ph = (T * 0.4 + hx(i, 1, 23)) % 1; ell(g, rgba('#ffd0c0', 0.7 * Math.sin(ph * Math.PI)), hx(i, 2, 23) * LW, LH - ph * LH, 2, 1.2); }
        phoenix(g, 200, 130 - rise * 30, 1.3, rise * (1 - seg(t, 1.3, 1.55)), T);
        hero(S, P.look, 120, 262);
        if (cut > 0) {
          lighter(g, () => { g.lineWidth = 8; g.strokeStyle = rgba('#ffd890', (1 - cut) * 0.7); g.beginPath(); g.arc(150, 150, 120, -2.6, lerp(-2.6, 0.3, eOut(cut))); g.stroke(); g.lineWidth = 2; g.strokeStyle = rgba('#ffffff', 1 - cut); g.stroke(); g.lineWidth = 1; });
          if (cut < 0.25) flash(g, '#fff0d0', 0.5 * (1 - cut / 0.25));
        }
      }
    },
    xueyi: {
      line: 'Мара должна быть уничтожена!', side: 'l', d: 1.5, sfx: [[0.1, 'debuff'], [0.4, 'tech'], [0.95, 'break'], [1.1, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, bind = seg(t, 0.25, 0.85), strike = seg(t, 0.95, 1.4);
        vgrad(g, 0, LH, [[0, '#08040e'], [0.7, '#1e0a26'], [1, '#0a0410']]);
        for (let i = 0; i < 5; i++) { const x = 40 + i * 64; rect(g, '#14081a', x, 0, 10, FLOOR); rect(g, '#3a1a3a', x, 0, 2, FLOOR); }
        lighter(g, () => glow(g, 230, 110, 70, '#8a7aff', 0.25 + 0.2 * bind));
        for (let i = 0; i < 4; i++) chain(g, [0, LW, 0, LW][i], [40, 50, 190, 200][i], 230, 110, bind, '#d8d0f0');
        hero(S, P.look, 96, 262);
        if (strike > 0) {
          const x = lerp(140, 228, eIn(cl(strike * 2)));
          poly(g, '#e8e4f8', [x, 108, x - 40, 104, x - 40, 112]); rect(g, '#c8a050', x - 46, 104, 6, 8);
          if (strike > 0.5) { const k = (strike - 0.5) * 2; lighter(g, () => { ring(g, rgba('#c8b0ff', 1 - k), 3, 230, 110, 10 + k * 90); for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2; line(g, rgba('#ffffff', 1 - k), 1, 230, 110, 230 + Math.cos(q) * 60 * k, 110 + Math.sin(q) * 60 * k); } }); if (k < 0.25) flash(g, '#e8e0ff', 0.5 * (1 - k / 0.25)); }
        }
      }
    },
    tingyun: {
      line: 'Добрый знак! Все за одного!', side: 'r', d: 1.45, sfx: [[0.1, 'glint'], [0.5, 'confirm'], [0.85, 'star4'], [1.1, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, open = eOut(seg(t, 0.2, 0.7)), bloom = seg(t, 0.8, 1.45);
        vgrad(g, 0, LH, [[0, '#0a1a14'], [0.6, '#2a4a2a'], [1, '#6a5a2a']]);
        for (let i = 0; i < 6; i++) { const x = ((i * 60 + T * 20) % 380) - 30, y = 40 + (i % 3) * 30; for (let k = 0; k < 3; k++) ell(g, 'rgba(255,240,200,0.18)', x + k * 10, y - (k % 2) * 4, 12, 6); }
        hero(S, P.look, 120, 262);
        fan(g, 170, 150, 46 * open, -2.6, -2.6 + 2.2 * open, '#e8d8a8', '#d8b050');
        if (bloom > 0) {
          for (let i = 0; i < 4; i++) A.bolt(g, 170, 110, 230 + i * 20, 30 + i * 10, Math.floor(T * 24) + i, P.col, 2);
          for (let i = 0; i < 18; i++) { const q = i / 18 * Math.PI * 2 + T, r = eOut(bloom) * (40 + hx(i, 2, 29) * 70); lighter(g, () => glow(g, 200 + Math.cos(q) * r, 110 + Math.sin(q) * r * 0.6, 5, '#ffe080', 0.8 * (1 - bloom))); }
          if (bloom < 0.2) flash(g, '#fff4d0', 0.4 * (1 - bloom / 0.2));
        }
      }
    },
    hanya: {
      line: 'Повеление десяти владык записано!', side: 'l', d: 1.5, sfx: [[0.1, 'select'], [0.35, 'whoosh'], [0.7, 'whoosh'], [1.05, 'confirm'], [1.15, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, w = seg(t, 0.25, 0.95), st = eOut(seg(t, 1.0, 1.2));
        vgrad(g, 0, LH, [[0, '#0c0a10'], [1, '#2a1a20']]);
        rect(g, '#efe6d0', 150, 26, 140, 150); rect(g, '#c8b890', 150, 26, 140, 4); rect(g, '#c8b890', 150, 172, 140, 4);
        for (let r = 0; r < 6; r++) rect(g, 'rgba(120,100,80,0.25)', 160, 40 + r * 22, 120, 1);
        brush(g, [170, 50, 200, 52, 230, 60, 214, 80, 186, 96, 210, 104, 250, 100, 262, 120, 232, 140, 196, 150, 270, 156], w, '#1a1418', 4);
        stamp(g, 236, 140, lerp(2.4, 1, st), 'УКАЗ', st, '#d83a3a');
        hero(S, P.look, 90, 262);
        lighter(g, () => glow(g, 120, 150, 30, '#e8d0a0', 0.4 * w));
      }
    },
    qingque: {
      line: 'Ну же! Да! Кажется, это... победа!', side: 'r', v: { mouth: 'open' }, d: 1.55, sfx: [[0.1, 'select'], [0.3, 'select'], [0.5, 'select'], [0.7, 'select'], [1.0, 'star4'], [1.15, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, win = seg(t, 0.95, 1.55);
        vgrad(g, 0, LH, [[0, '#06140c'], [0.7, '#14301e'], [1, '#2a1a10']]);
        rect(g, '#2a6a3a', 30, 150, 260, 60); rect(g, '#1a4a28', 30, 150, 260, 4); rect(g, '#5a3a20', 30, 206, 260, 8);
        for (let i = 0; i < 4; i++) { const k = eOut(seg(t, 0.3 + i * 0.2, 0.5 + i * 0.2)); tile(g, lerp(160, 112 + i * 32, k), lerp(-20, 172, k), 2, 1, (1 - k) * 4, k); }
        hero(S, P.look, 250, 262, { flip: true });
        if (win > 0) {
          for (let i = 0; i < 30; i++) { const q = -Math.PI / 2 + (hx(i, 1, 37) - 0.5) * 2.4, r = eOut(win) * (30 + hx(i, 2, 37) * 140); tile(g, 160 + Math.cos(q) * r, 150 + Math.sin(q) * r, 1, i % 3, T * 4 + i, 1 - win); }
          lighter(g, () => glow(g, 160, 170, 90, '#9affc0', 0.5 * (1 - win)));
          if (win < 0.2) flash(g, '#f0fff4', 0.45 * (1 - win / 0.2));
        }
      }
    },
    yukong: {
      line: 'Облачные змеи, стройся!', side: 'l', d: 1.55, sfx: [[0.1, 'whoosh'], [0.5, 'glint'], [0.95, 'swing'], [1.05, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.1, 0.7)), shot = seg(t, 0.95, 1.4);
        vgrad(g, 0, LH, [[0, '#2a4a8a'], [0.7, '#8ab0e0'], [1, '#e8d8a8']]);
        for (let i = 0; i < 6; i++) ell(g, 'rgba(255,255,255,0.4)', ((i * 70 + T * 10) % 400) - 40, 160 + (i % 2) * 20, 50, 10);
        for (let i = 0; i < 7; i++) { const x = 170 + (i - 3) * 22 + Math.abs(i - 3) * 6, y = lerp(260, 60 + Math.abs(i - 3) * 12, rise); kite(g, x, y, 1, i % 2 ? '#e8b040' : '#d84a3a', T, i); }
        hero(S, P.look, 80, 262);
        g.strokeStyle = '#6a3a1a'; g.lineWidth = 2; g.beginPath(); g.arc(98, 150, 26, -1.2, 1.2); g.stroke(); g.lineWidth = 1;
        if (shot > 0) {
          const x = lerp(120, 330, eIn(shot));
          lighter(g, () => { line(g, rgba('#ffe080', 0.9 * (1 - shot * 0.5)), 4, 110, 150, x, 150 - shot * 60); glow(g, x, 150 - shot * 60, 20, '#ffd850', 0.9); });
          if (shot < 0.2) flash(g, '#fff4c0', 0.35 * (1 - shot / 0.2));
        }
      }
    },
    guinaifen: {
      line: 'Смотрите и изумляйтесь!', side: 'r', v: { mouth: 'open' }, d: 1.55, sfx: [[0.1, 'confirm'], [0.4, 'whoosh'], [0.8, 'crit'], [1.0, 'break'], [1.2, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, spin = seg(t, 0.2, 0.9), boom = seg(t, 0.8, 1.55);
        vgrad(g, 0, LH, [[0, '#1a0a14'], [0.6, '#3a1418'], [1, '#2a1410']]);
        for (let i = 0; i < 9; i++) lanternR(g, 20 + i * 36, 18, 1, T, i, true);
        hero(S, P.look, 160, 262);
        hoop(g, 160, 150, 40 + 10 * Math.sin(T * 3), T * (1 + spin * 4), cl(spin * 2));
        for (let i = 0; i < 5; i++) firework(g, 40 + i * 60, 60 + (i % 2) * 30, seg(t, 0.8 + i * 0.12, 1.3 + i * 0.12), ['#ff6a3a', '#ffd040', '#ff8ad8', '#8affc0', '#8ad8ff'][i], i);
        K.embers(g, T, 30, 41, 20, 300, FLOOR, '#ffb060');
        if (boom > 0 && boom < 0.15) flash(g, '#ffe0b0', 0.4 * (1 - boom / 0.15));
      }
    }
  };

  const FUS = {
    f_landau3: {
      lines: [[0, 'Чур, на привале не ссориться.'], [1, 'Строй держать! Щиты поднять!'], [2, 'Ландау, играем на бис!']], swaps: [0.8, 1.6], d: 2.6, team: 'shield',
      sfx: [[0.1, 'glint'], [0.6, 'shield'], [1.2, 'crit'], [1.5, 'crit'], [1.9, 'heal'], [2.2, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Ly, Ge, Se] = P.m, wall = eOut(seg(t, 0.5, 1.0)), riff = seg(t, 1.2, 2.0);
        snowNight(g, T, 168);
        tent(g, 160, 178, 1.3, true);
        K.hexShield(g, 160, 150, 120 * wall, 0.5 * wall, T, '#9ad8ff');
        hero(S, Ge.look, 160, 262); hero(S, Ly.look, 72, 262); hero(S, Se.look, 248, 262, { flip: true });
        if (riff > 0) for (let i = 0; i < 3; i++) A.bolt(g, 248, 120, 60 + i * 100, BAR, Math.floor(T * 24) + i, '#c07aff', 2);
        if (t > 1.9) for (let i = 0; i < 14; i++) { const ph = (T * 0.8 + hx(i, 1, 51)) % 1; cross(g, hx(i, 2, 51) * LW, FLOOR - ph * 150, 1, (1 - ph) * cl((t - 1.9) * 3)); }
      }
    },
    f_ring: {
      lines: [[0, 'Хук, кулак держи вот так!'], [1, 'Смотри, туда! Я тоже умею!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'tech'], [0.4, 'swing'], [0.6, 'swing'], [1.0, 'whoosh'], [1.35, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Lu, Ho] = P.m, jab = seg(t, 0.3, 0.9), fire = seg(t, 0.95, 1.4);
        vgrad(g, 0, LH, [[0, '#0a0408'], [1, '#2a0c08']]);
        ropes(g, 150);
        hero(S, Lu.look, 90, 262); hero(S, Ho.look, 200, 262, { flip: true });
        if (jab > 0 && jab < 1) gauntlet(g, lerp(130, 250, eOut(jab)), 120, 1.2, 0, 1 - jab);
        if (fire > 0) { const x = lerp(220, 260, fire), y = lerp(60, 130, eIn(fire)); lighter(g, () => { glow(g, x, y, 26, '#ff8a30', 0.9); glow(g, x, y, 10, '#fff0c0', 1); }); }
        if (t > 1.35) { const k = seg(t, 1.35, 1.8); lighter(g, () => { glow(g, 260, 130, 90 * eOut(k), '#ff6a20', 1 - k); ring(g, rgba('#ffd070', 1 - k), 3, 260, 130, 10 + k * 80); }); }
      }
    },
    f_alley: {
      lines: [[1, 'Шаншан, выход на бис!'], [0, 'Малышка Гуй, держи ритм!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'confirm'], [0.5, 'crit'], [0.8, 'crit'], [1.1, 'ult'], [1.4, 'swing']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Su, Gu] = P.m, show = seg(t, 0.2, 1.0), slash = seg(t, 1.1, 1.6);
        xianzhou(g, T, 150, ['#3a1a2a', '#8a3a3a', '#d8805a']);
        vgrad(g, 150, LH, [[0, '#6a4a3a'], [1, '#3a2a20']]);
        for (let i = 0; i < 4; i++) firework(g, 50 + i * 70, 50 + (i % 2) * 20, seg(t, 0.4 + i * 0.15, 0.9 + i * 0.15), ['#ff6a3a', '#ffd040', '#ff8ad8', '#8affc0'][i], i);
        hoop(g, 220, 150, 30, T * 3, show);
        hero(S, Gu.look, 220, 262, { flip: true }); hero(S, Su.look, 100, 262);
        phoenix(g, 160, 110, 0.9, slash * (1 - seg(t, 1.5, 1.8)), T);
      }
    },
    f_judges: {
      lines: [[0, 'Сестра, цель записана.'], [1, 'Приговор будет исполнен.']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'select'], [0.5, 'confirm'], [0.95, 'debuff'], [1.25, 'break'], [1.4, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Ha, Xu] = P.m, w = seg(t, 0.2, 0.8), bind = seg(t, 0.9, 1.3), hit = seg(t, 1.25, 1.7);
        vgrad(g, 0, LH, [[0, '#08040e'], [1, '#2a1420']]);
        rect(g, '#efe6d0', 120, 20, 80, 110);
        brush(g, [130, 40, 160, 44, 190, 36, 170, 70, 140, 90, 186, 100], w, '#1a1418', 3);
        stamp(g, 168, 112, 1, 'НОША', seg(t, 0.75, 0.9), '#d83a3a');
        for (let i = 0; i < 3; i++) chain(g, [0, LW, 160][i], [60, 70, 0][i], 250, 120, bind, '#d8d0f0');
        hero(S, Ha.look, 70, 262); hero(S, Xu.look, 220, 262, { flip: true });
        if (hit > 0) { lighter(g, () => { ring(g, rgba('#c8b0ff', 1 - hit), 3, 250, 120, 10 + hit * 80); glow(g, 250, 120, 50, '#8a7aff', 0.6 * (1 - hit)); }); if (hit < 0.2) flash(g, '#e8e0ff', 0.4 * (1 - hit / 0.2)); }
      }
    },
    f_helm: {
      lines: [[0, 'Тинъюнь, держи курс.'], [1, 'Как прикажете, госпожа Юйкун!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'whoosh'], [0.5, 'glint'], [0.95, 'swing'], [1.1, 'crit'], [1.3, 'confirm']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Yu, Ti] = P.m, rise = eOut(seg(t, 0.1, 0.7)), shot = seg(t, 0.95, 1.4);
        vgrad(g, 0, LH, [[0, '#2a4a8a'], [1, '#e8d8a8']]);
        for (let i = 0; i < 5; i++) kite(g, 120 + i * 30, lerp(260, 50 + Math.abs(i - 2) * 14, rise), 0.9, i % 2 ? '#e8b040' : '#d84a3a', T, i);
        hero(S, Yu.look, 80, 262); hero(S, Ti.look, 240, 262, { flip: true });
        fan(g, 222, 150, 30, -2.2, -0.8, '#e8d8a8', '#d8b050');
        if (shot > 0) { const x = lerp(110, 330, eIn(shot)); lighter(g, () => { line(g, rgba('#ffe080', 0.9), 3, 100, 150, x, 140 - shot * 50); glow(g, x, 140 - shot * 50, 18, '#ffd850', 0.9); }); A.bolt(g, 222, 140, x, 140 - shot * 50, Math.floor(T * 24), '#c07aff', 1); }
      }
    },
    f_table: {
      lines: [[0, 'Ставлю всё на Малышку Гуй!'], [1, 'Тогда смотри, не моргай!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'select'], [0.3, 'select'], [0.6, 'confirm'], [1.0, 'crit'], [1.3, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Qq, Gu] = P.m, deal = seg(t, 0.1, 0.8), show = seg(t, 0.9, 1.6);
        vgrad(g, 0, LH, [[0, '#06140c'], [1, '#2a1a10']]);
        rect(g, '#2a6a3a', 20, 170, 150, 40);
        for (let i = 0; i < 4; i++) { const k = eOut(seg(deal, i * 0.2, 0.4 + i * 0.2)); tile(g, lerp(100, 40 + i * 30, k), lerp(-20, 182, k), 1.6, 2, (1 - k) * 3, k); }
        hero(S, Qq.look, 70, 262); hero(S, Gu.look, 230, 262, { flip: true });
        hoop(g, 230, 140, 30, T * 2, show);
        for (let i = 0; i < 3; i++) firework(g, 200 + i * 40, 50 + i * 12, seg(t, 1.0 + i * 0.15, 1.5 + i * 0.15), ['#ff6a3a', '#9affc0', '#ffd040'][i], i);
      }
    }
  };

  const EID = {
    lynx: {
      title: 'Привал под сиянием', aura: 'quant',
      frags: [
        ['Утро перед походом', 'Спальный мешок, непромокаемый каремат. Всё готово, пора выдвигаться.'],
        ['Полдень с горелкой', 'Сервал переделала для неё ледоруб и разрисовала фляжку.'],
        ['Лавинный детектор', 'Ветер в долине Кандор предвещает метель. В ущелье не ночуют.'],
        ['Вечер у костра', 'Щелчок, отправить. В ответ приходит стакан тёплого молока.'],
        ['Чай под сиянием', 'Северное сияние разлилось по небу. Пела ответит смайликом.'],
        ['Рассвет над чертежами', 'Хочешь сделать, делай. Так у Ландау принято.']
      ],
      paint(g, X, live) {
        snowNight(g, 0, 176);
        tent(g, 70, 184, 1.4, true);
        rect(g, '#5a3a2a', 196, 188, 30, 4); rect(g, '#3a2a20', 198, 192, 3, 14); rect(g, '#3a2a20', 222, 192, 3, 14);
        can(g, 40, 200, 1.4); can(g, 54, 204, 1.2, 0.4);
        poly(g, '#8a5a2a', [104, 206, 116, 206, 112, 198]); lighter(g, () => glow(g, 110, 196, 18, '#ffa040', 0.5));
        if (!live) for (let i = 0; i < 12; i++) rect(g, '#ffffff', Math.round(hx(i, 1, 3) * LW), Math.round(hx(i, 2, 3) * 170), 1, 1);
      },
      decor(g, t) {
        lighter(g, () => { for (let b = 0; b < 2; b++) { g.strokeStyle = rgba(b ? '#ff8ad8' : '#6affb8', 0.12 + 0.06 * Math.sin(t + b)); g.lineWidth = 8; g.beginPath(); for (let x = 0; x <= LW; x += 8) { const y = 44 + b * 18 + Math.sin(x * 0.02 + t * 0.7 + b * 2) * 14; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); } g.lineWidth = 1; });
        lighter(g, () => glow(g, 110, 196, 16 + 2 * Math.sin(t * 9), '#ffb050', 0.4));
      },
      life(g, t) { K.snowfall(g, t, 24, 9, { speed: 20, wind: 12, a: 0.8 }); for (let i = 0; i < 3; i++) { const ph = (t * 0.4 + i / 3) % 1; ell(g, rgba('#ffffff', 0.4 * (1 - ph)), 110 + Math.sin(t + i) * 3, 190 - ph * 30, 3 + ph * 4, 2 + ph * 2); } }
    },
    luka: {
      title: 'Ринг Бойцовского клуба', aura: 'phys',
      frags: [
        ['Непрерывный бой', 'Мастерская отца, стальной молот, искры перед глазами.'],
        ['Враг слаб, а я силён', 'Олег зашёл поболтать. О его сыне.'],
        ['Рождённый для ринга', 'Он прыгнул между топором и ребёнком. Рука осталась на поле боя.'],
        ['Несмотря ни на что', 'Первый финал проигран. Золотой пояс он возьмёт честно.'],
        ['Дух Дикого Огня', 'Пока есть те, кого надо защищать, он будет драться.'],
        ['Аплодисменты чемпиону', 'Где аплодисменты? Летят искры.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#0e0608'], [0.7, '#2a1010'], [1, '#14080a']]);
        for (let i = 0; i < 12; i++) ell(g, '#1a0c0e', 14 + i * 28, 70 + (i % 2) * 6, 12, 14);
        rect(g, '#3a1a1a', 0, 168, LW, 40); rect(g, '#5a2a24', 0, 168, LW, 3);
        ropes(g, 120);
        rect(g, '#d8b050', 24, 40, 70, 16); rect(g, '#8a6a2a', 24, 56, 70, 3);
        g.save(); g.font = 'bold 9px Georgia, serif'; g.fillStyle = '#2a1a0a'; g.textAlign = 'center'; g.fillText('ЧЕМПИОН', 59, 51); g.restore();
        if (!live) gauntlet(g, 60, 150, 1.2, -0.3, 0);
      },
      decor(g, t) { lighter(g, () => poly(g, rgba('#ffe0c0', 0.08 + 0.03 * Math.sin(t * 2)), [130, 0, 180, 0, 220, 200, 90, 200])); for (let i = 0; i < 6; i++) { const ph = (t * 0.5 + i / 6) % 1; ell(g, rgba('#ffffff', 0.15 * Math.sin(ph * Math.PI)), 20 + i * 50, 80 - ph * 20, 8, 3); } },
      life(g, t) { gauntlet(g, 60, 150 + Math.sin(t * 3) * 3, 1.2, -0.3 + Math.sin(t * 3) * 0.1, 0.4 + 0.3 * Math.sin(t * 6)); if (Math.sin(t * 2.2) > 0.9) for (let i = 0; i < 6; i++) rect(g, '#ffb060', 70 + i * 4, 130 - i * 3, 2, 2); }
    },
    sushang: {
      title: 'Чайная «Неспящий граф»', aura: 'phys',
      frags: [
        ['Искусное сечение', 'Меч Сюаньюань передают из поколения в поколение.'],
        ['Закалённое тело', 'Мама учила с раннего утра. В школе её звали Засоней Сушан.'],
        ['Древний стиль меча', 'Золото преходяще, клятва же на века.'],
        ['Острый ум', 'Рыжая фокусница исчезла в дыму хлопушек.'],
        ['Воля Тайсюй', 'Письмо родителям: опасный элемент задержан. Почти без преувеличений.'],
        ['Добродетель как вода', 'Каждый день доброе дело. Когда-нибудь о ней сложат легенду.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#2a1410'], [1, '#4a2a1a']]);
        for (let i = 0; i < 4; i++) { rect(g, '#6a2a1a', i * 90, 20, 10, 170); }
        rect(g, '#3a1a10', 0, 18, LW, 10); rect(g, '#d8b050', 0, 28, LW, 2);
        [50, 130, 210, 290].forEach((x, i) => lanternR(g, x, 30, 1.1, 0, i, true));
        counter(g, 0, 170, LW);
        rect(g, '#d8c8a0', 24, 150, 20, 20); ell(g, '#8a5a2a', 34, 150, 10, 3);
        rect(g, '#2a1a10', 60, 120, 40, 50); rect(g, '#f2e6c8', 64, 124, 32, 22);
        if (!live) phoenix(g, 230, 100, 0.6, 0.15, 0);
      },
      decor(g, t) { for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; ell(g, rgba('#ffffff', 0.35 * (1 - ph)), 34 + Math.sin(t + i) * 3, 144 - ph * 30, 2 + ph * 3, 1.5 + ph * 2); } },
      life(g, t) { phoenix(g, 230, 100, 0.6, 0.35 + 0.15 * Math.sin(t * 2), t); }
    },
    xueyi: {
      title: 'Дом кандалов', aura: 'quant',
      frags: [
        ['Двеша, отвращение', 'Отыскать, заковать, наказать, допросить. Ей досталось первое.'],
        ['Клеша, бедствие', 'Её тело из плоти рассеялось пеплом. Теперь она кукла.'],
        ['Дуккха, неприятность', 'Каждый арест даёт ей полдня в мире живых.'],
        ['Карма, действие', 'Боли нет. Только тихий звон повреждённых деталей.'],
        ['Дэва, порабощение', 'Хохо снова собирает её. «В следующий раз подбери что-нибудь покрепче».'],
        ['Сансара, блуждание', 'Сестра ждёт у гроба. Это она помнит.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#06040a'], [1, '#1a0e1e']]);
        for (let i = 0; i < 6; i++) { const x = 10 + i * 56; rect(g, '#120a16', x, 0, 14, 200); rect(g, '#2a1a2e', x, 0, 2, 200); }
        rect(g, '#1a1020', 0, 196, LW, 44);
        coffin(g, 60, 196, 70, 60);
        for (let i = 0; i < 3; i++) chain(g, 0, 40 + i * 30, 120, 30 + i * 20, 1, '#5a5a6a');
        lanternR(g, 250, 40, 1.2, 0, 0, false);
      },
      decor(g, t) { lighter(g, () => glow(g, 250, 46, 14 + Math.sin(t * 4) * 2, '#8affd0', 0.35)); for (let i = 0; i < 10; i++) { const ph = (t * 0.2 + hx(i, 1, 5)) % 1; rect(g, rgba('#c8b0ff', Math.sin(ph * Math.PI) * 0.6), Math.round(hx(i, 2, 5) * LW), Math.round(200 - ph * 160), 1, 1); } },
      life(g, t) { chain(g, 0, 150, 120 + Math.sin(t * 2) * 20, 180, 1, '#d8d0f0'); lighter(g, () => glow(g, 60, 166, 30, '#8a7aff', 0.2 + 0.1 * Math.sin(t * 3))); }
    },
    tingyun: {
      title: 'Лавка на Большой ярмарке', aura: 'elec',
      frags: [
        ['Весенний ветер', 'Избегай конфликта, когда можешь, убеждай тех, кого можешь убедить.'],
        ['Благодарный получатель', 'Сделка с Хрустальным дворцом и новый союзник альянса.'],
        ['Наследие зимородка', 'Резной веер из шести пластин вместо меча.'],
        ['Находчивость', 'Самшитовая расчёска и шёлк. Хвост должен быть пушистым.'],
        ['Лиса-кокетка', 'В «Неспящем графе» она смотрит, как люди пьют чай и бросают кости.'],
        ['Мир приносит богатство', 'Записка в ящике стола. Вернётся, сожжёт.']
      ],
      paint(g, X, live) {
        xianzhou(g, 0, 140, ['#f2c8a0', '#f8e4c8', '#e0e8d0']);
        vgrad(g, 140, LH, [[0, '#b89a7a'], [1, '#7a5a3a']]);
        rect(g, '#7a2a1a', 0, 60, 120, 10); rect(g, '#d8b050', 0, 70, 120, 2);
        for (let i = 0; i < 3; i++) { rect(g, '#5a3a24', 6 + i * 38, 72, 34, 90); for (let k = 0; k < 3; k++) rect(g, ['#3a8a6a', '#e8c070', '#c84a3a'][(i + k) % 3], 10 + i * 38, 78 + k * 26, 26, 18); }
        counter(g, 0, 170, 130);
        for (let i = 0; i < 5; i++) ell(g, '#e8c050', 30 + i * 18, 168, 4, 2);
        lanternR(g, 220, 70, 1.1, 0, 0, true); lanternR(g, 290, 76, 1.1, 0, 1, true);
        if (!live) fan(g, 104, 160, 18, -2.8, -1.4, '#e8d8a8', '#d8b050');
      },
      decor(g, t) { for (let i = 0; i < 8; i++) { const ph = (t * 0.25 + i / 8) % 1; poly(g, rgba('#ffd8e0', Math.sin(ph * Math.PI)), [ph * 340 - 10, 40 + hx(i, 2, 7) * 90, ph * 340 - 6, 38 + hx(i, 2, 7) * 90, ph * 340 - 8, 43 + hx(i, 2, 7) * 90]); } },
      life(g, t) { const a = Math.sin(t * 2) * 0.4; fan(g, 104, 160, 18, -2.8 + a, -1.4 + a, '#e8d8a8', '#d8b050'); if (Math.sin(t * 3.1) > 0.95) A.bolt(g, 104, 150, 140, 120, Math.floor(t * 20), '#c07aff', 1); }
    },
    hanya: {
      title: 'Зал кармы', aura: 'phys',
      frags: [
        ['Одно сердце', 'Отыскать, заковать, наказать, допросить. Ей досталось допрашивать.'],
        ['Два взгляда', 'Кистью оракула она записывает назначенную кару.'],
        ['Три искушения', 'Чужие жизни проходят сквозь неё волнами. Она остаётся каплей.'],
        ['Четыре истины', 'Ауруматон записывает вердикт быстрее, чем видит глаз.'],
        ['Пять скандх', 'Вино забвения на вкус как масло для шарниров.'],
        ['Шесть заслуг', 'Сестра приходит сама. Позволь ещё немного послужить тебе.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#0e0a10'], [1, '#2a1a1e']]);
        for (let i = 0; i < 8; i++) { const x = i * 42; rect(g, '#1a1216', x, 0, 4, 190); }
        rect(g, '#efe6d0', 14, 40, 110, 130); for (let r = 0; r < 7; r++) rect(g, 'rgba(120,100,80,0.3)', 22, 54 + r * 16, 94, 1);
        brush(g, [24, 60, 60, 64, 90, 58, 70, 90, 40, 110, 94, 120, 110, 150], 1, '#1a1418', 3);
        stamp(g, 92, 150, 0.8, 'КАРМА', 0.9, '#c83a3a');
        rect(g, '#2a1a1e', 0, 190, LW, 50);
        coffin(g, 270, 196, 60, 50);
      },
      decor(g, t) { for (let i = 0; i < 12; i++) { const ph = (t * 0.15 + hx(i, 1, 9)) % 1; rect(g, rgba('#e8d0a0', Math.sin(ph * Math.PI) * 0.6), Math.round(hx(i, 2, 9) * LW), Math.round(190 - ph * 170), 1, 1); } },
      life(g, t) { const k = (t * 0.3) % 1; brush(g, [130, 70, 160, 74, 190, 66, 170, 100], k, rgba('#1a1418', 0.7), 3); lighter(g, () => glow(g, 70, 100, 50, '#e8d0a0', 0.15 + 0.05 * Math.sin(t * 2))); }
    },
    qingque: {
      title: 'Игорный дом в обед', aura: 'quant',
      frags: [
        ['Пешка становится ферзём', 'Шестьдесят баллов. С первого курса до выпуска.'],
        ['Сладкий сон на доске', 'Превосходство тяжкий труд. Так написали в выпускном альбоме.'],
        ['Костям доверяй', 'В Комиссии по предсказаниям она всегда хуже всех. Её это устраивает.'],
        ['Последняя кость', '«Небесный нефрит» вернули из архивов. Ради собственного досуга.'],
        ['Отвергнутая удача', 'Ноль инициативы, ноль отказов, ноль ответственности.'],
        ['Победа неизбежна', 'Рано или поздно нужная кость сама окажется в руке.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#14100a'], [1, '#2a2214']]);
        for (let i = 0; i < 3; i++) { rect(g, '#3a2a1a', 4 + i * 44, 30, 40, 140); for (let k = 0; k < 5; k++) rect(g, ['#8a3a2a', '#3a6a4a', '#c8a050'][(i + k) % 3], 8 + i * 44, 36 + k * 26, 32, 20); }
        rect(g, '#2a6a3a', 0, 168, 140, 30); rect(g, '#1a4a28', 0, 168, 140, 3);
        for (let i = 0; i < 6; i++) tile(g, 20 + i * 18, 182, 1, i, 0);
        rect(g, '#3a2a1a', 0, 198, LW, 42);
        rect(g, '#d8c8a0', 230, 130, 50, 36); rect(g, '#efe2c0', 234, 134, 42, 28);
      },
      decor(g, t) { lighter(g, () => glow(g, 60, 20, 40, '#ffd890', 0.25 + 0.05 * Math.sin(t))); for (let i = 0; i < 2; i++) { const ph = (t * 0.3 + i / 2) % 1; ell(g, rgba('#ffffff', 0.3 * (1 - ph)), 250 + i * 12, 128 - ph * 26, 2 + ph * 3, 1.5 + ph * 2); } },
      life(g, t) { for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; tile(g, 60 + i * 30, 170 - Math.sin(ph * Math.PI) * 40, 1.1, i, ph * 6); } }
    },
    yukong: {
      title: 'Змеи над причалом', aura: 'imag',
      frags: [
        ['Воздушный маршал', 'В рассказах стариков она шесть раз подряд проскочила на красный.'],
        ['Приказ подняться ввысь', 'Генерал звал её Хулиганкой. Потом её прозвали Асом.'],
        ['Шквальный залп', 'Держи крепче оружие, я верну тебя на Сяньчжоу.'],
        ['Эхо ласкового ветра', 'После той битвы из лётчиков вернулась только она.'],
        ['Точный и стремительный', 'Воздушные змеи в память о пилотах, которые уже не взлетят.'],
        ['Раскат свиста тетивы', 'Она совершит последний в своей жизни полёт.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#4a6aa8'], [0.6, '#a8c4e8'], [1, '#e8d8b0']]);
        for (let i = 0; i < 5; i++) ell(g, 'rgba(255,255,255,0.45)', 20 + i * 70, 60 + (i % 2) * 20, 40, 9);
        rect(g, '#6a4a2a', 0, 184, LW, 56); rect(g, '#8a6a3a', 0, 184, LW, 3);
        for (let i = 0; i < 6; i++) rect(g, '#4a3220', 10 + i * 56, 188, 6, 30);
        poly(g, '#7a5a3a', [30, 176, 120, 176, 110, 186, 40, 186]); rect(g, '#d8b050', 70, 150, 2, 26); poly(g, '#f2ece0', [72, 150, 100, 164, 72, 170]);
        if (!live) for (let i = 0; i < 4; i++) kite(g, 40 + i * 50, 40 + (i % 2) * 24, 0.8, i % 2 ? '#e8b040' : '#d84a3a', 0, i);
      },
      decor(g, t) { for (let i = 0; i < 5; i++) ell(g, 'rgba(255,255,255,0.2)', ((i * 80 + t * 8) % 400) - 40, 30 + (i % 3) * 16, 30, 6); },
      life(g, t) { for (let i = 0; i < 4; i++) kite(g, 40 + i * 50 + Math.sin(t + i) * 6, 40 + (i % 2) * 24 + Math.sin(t * 1.3 + i) * 5, 0.8, i % 2 ? '#e8b040' : '#d84a3a', t, i); }
    },
    guinaifen: {
      title: 'Переулок ауруматонов', aura: 'fire',
      frags: [
        ['Лапша вверх ногами', 'Гвиневра. Имя на манер Сяньчжоу придумала Шаншан.'],
        ['Свист и зубная щётка', 'Принцесса из замка стала уличной артисткой. Так вышло.'],
        ['Булыжник на груди', 'Если можете дать денег, давайте! Если нет, в следующий раз!'],
        ['Копьё у шеи', 'Стрим Малышки Гуй: сегодня поём сяньчжоуские народные песни.'],
        ['Глотание меча', 'Сушан её лучшая подруга. Почти названая сестра.'],
        ['Ловля пуль', 'Шоу должно продолжаться!']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#1a0a14'], [0.6, '#3a1418'], [1, '#2a1a14']]);
        for (let i = 0; i < 4; i++) { rect(g, '#2a1416', i * 84, 40, 76, 150); rect(g, '#d8b050', i * 84 + 8, 56, 20, 30); }
        for (let i = 0; i < 9; i++) lanternR(g, 18 + i * 36, 18, 1, 0, i, true);
        rect(g, '#4a3024', 0, 186, LW, 54);
        rect(g, '#2a2a30', 24, 140, 36, 46); rect(g, '#4ad8ff', 28, 144, 28, 20);
        g.save(); g.font = 'bold 7px Arial, sans-serif'; g.fillStyle = '#ff3a3a'; g.fillText('• ЭФИР', 30, 172); g.restore();
        rect(g, '#7a3a1a', 80, 176, 30, 10);
        if (!live) hoop(g, 96, 150, 18, 0, 0.6);
      },
      decor(g, t) { lighter(g, () => { for (let i = 0; i < 9; i++) glow(g, 18 + i * 36, 24, 12, '#ffb060', 0.25 + 0.1 * Math.sin(t * 4 + i)); }); K.embers(g, t, 12, 43, 60, 140, 186, '#ffb060'); },
      life(g, t) { hoop(g, 96, 150 + Math.sin(t * 3) * 6, 18, t, 0.9); firework(g, 240, 60, (t * 0.5) % 1, '#ffd040', Math.floor(t * 0.5)); }
    }
  };

  Object.assign(H.Ults.SHOWS, ULTS);
  Object.assign(H.Fusions.SHOWS, FUS);
  Object.assign(E.SCENES, EID);
  H.FoursScenes = { ULTS, FUS, EID, xianzhou, snowNight, tent, can, gauntlet, ropes, phoenix, chain, fan, tile, kite, hoop, firework, brush, stamp, coffin, counter, lanternR, cross };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
