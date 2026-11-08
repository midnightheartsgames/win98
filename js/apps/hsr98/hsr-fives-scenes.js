(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit, A = H.Ults.Art, E = H.Eidolons, F = H.FoursScenes, WI = H.WarpIntro;
  const { LW, LH, BAR, cl, lerp, sm, eOut, eIn, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash } = K;
  const { zoom, cuts, stand, hand, pose, fly, twinkle } = WI.KIT;
  const FLOOR = LH - BAR, CX = WI.CARD.x;
  const hero = (S, look, x, y, o) => S.fig(look, x, y, Object.assign({ k: 2 }, o));

  function luofuNight(g, T, horizon, pal) {
    const p = pal || ['#0a0618', '#2a1640', '#5a3a6a'];
    vgrad(g, 0, horizon, [[0, p[0]], [0.65, p[1]], [1, p[2]]]);
    K.stars(g, T, 40, 61, 0.7, horizon * 0.8);
    for (let i = 0; i < 7; i++) {
      const x = 4 + i * 48, h = 28 + hx(i, 4, 17) * 44;
      rect(g, '#140c22', x + 9, horizon - h, 16, h);
      for (let k = 0; k < 3; k++) { const y = horizon - h + k * (h / 3), w = 28 - k * 4; poly(g, '#1e1430', [x + 17 - w / 2 - 4, y + 4, x + 17, y - 6, x + 17 + w / 2 + 4, y + 4]); }
      if (i % 2) lighter(g, () => glow(g, x + 17, horizon - h * 0.5, 6, '#ffb060', 0.35));
    }
    for (let i = 0; i < 5; i++) { const ph = (T * 0.05 + hx(i, 5, 17)) % 1; F.lanternR(g, 20 + hx(i, 6, 17) * 280, horizon - 20 - ph * 90, 0.6, T, i, true); }
  }

  function lordGiant(g, x, y, s, a, T, glare) {
    if (a <= 0) return;
    g.save(); g.globalAlpha *= cl(a); g.translate(x, y); g.scale(s, s);
    lighter(g, () => glow(g, 0, -70, 90, '#9a6aff', 0.45));
    const V = ['#2a1858', '#4a2e90', '#7a5ad0', '#b49aff'];
    poly(g, V[0], [-34, -84, 34, -84, 46, -20, 30, 0, -30, 0, -46, -20]);
    poly(g, V[1], [-28, -80, 28, -80, 36, -26, 0, -6, -36, -26]);
    poly(g, V[2], [-12, -74, 12, -74, 16, -40, 0, -30, -16, -40]);
    poly(g, V[0], [-62, -88, -30, -96, -26, -70, -48, -60, -66, -70]);
    poly(g, V[0], [62, -88, 30, -96, 26, -70, 48, -60, 66, -70]);
    poly(g, V[3], [-60, -88, -34, -94, -33, -88, -58, -82]);
    poly(g, V[3], [60, -88, 34, -94, 33, -88, 58, -82]);
    poly(g, V[1], [-18, -128, 18, -128, 24, -98, 0, -86, -24, -98]);
    poly(g, V[2], [-14, -122, 14, -122, 17, -100, 0, -92, -17, -100]);
    for (let i = 0; i < 9; i++) { const q = -Math.PI * 0.98 + i * 0.245, r0 = 16, r1 = 34 + (i % 2) * 8; poly(g, V[1], [Math.cos(q) * r0, -112 + Math.sin(q) * r0 * 0.8, Math.cos(q + 0.1) * r1, -116 + Math.sin(q + 0.1) * r1, Math.cos(q + 0.2) * r0, -112 + Math.sin(q + 0.2) * r0 * 0.8]); }
    lighter(g, () => { ell(g, rgba('#ffffff', 0.9), -6, -110, 3, 1.4); ell(g, rgba('#ffffff', 0.9), 6, -110, 3, 1.4); glow(g, 0, -110, 14, '#e8d8ff', 0.4 + (glare || 0)); });
    poly(g, '#d8b048', [56, -150, 62, -146, 10, 6, 4, 2]);
    lighter(g, () => { poly(g, rgba('#f4eaff', 0.95), [54, -168, 70, -158, 62, -138, 52, -146]); glow(g, 60, -152, 22, '#c8a8ff', 0.6 + (glare || 0)); });
    g.restore();
  }

  function waterDragon(g, x0, y0, x1, y1, k, a, T, lift) {
    if (a <= 0 || k <= 0) return;
    const n = 26, pts = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n * k, x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(u * Math.PI) * (lift || 60) + Math.sin(u * 14 - T * 6) * 8;
      pts.push([x, y]);
    }
    lighter(g, () => {
      for (let i = 0; i < pts.length - 1; i++) {
        const w = 2 + 9 * Math.sin((i / n) * Math.PI) * (i > n * k * 0.8 ? 0.7 : 1);
        line(g, rgba('#3ad0c8', 0.55 * a), w + 4, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
        line(g, rgba('#c8fff4', 0.8 * a), Math.max(1, w * 0.4), pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      }
      const hd = pts[pts.length - 1], pv = pts[pts.length - 2], ang = Math.atan2(hd[1] - pv[1], hd[0] - pv[0]);
      g.save(); g.translate(hd[0], hd[1]); g.rotate(ang);
      poly(g, rgba('#7ae8e0', a), [12, 0, -4, -7, -10, 0, -4, 7]);
      poly(g, rgba('#e8fffc', a), [-2, -6, -16, -16, -6, -4]); poly(g, rgba('#e8fffc', a), [-2, 6, -16, 16, -6, 4]);
      ell(g, rgba('#ffffff', a), 4, -2, 1.5, 1.5);
      g.restore();
      glow(g, hd[0], hd[1], 26, '#7ae8e0', 0.5 * a);
    });
  }

  function divRing(g, x, y, r, T, a) {
    if (a <= 0) return;
    lighter(g, () => {
      for (let k = 0; k < 3; k++) {
        const rr = r * (0.55 + k * 0.25), rot = T * (k % 2 ? -0.5 : 0.4) + k;
        g.strokeStyle = rgba(k === 1 ? '#f0c8ff' : '#c8a8ff', 0.6 * a); g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2); g.stroke();
        for (let i = 0; i < 8; i++) {
          const q = rot + i * Math.PI / 4, cx = x + Math.cos(q) * rr, cy = y + Math.sin(q) * rr;
          g.save(); g.translate(cx, cy); g.rotate(q + Math.PI / 2);
          for (let b = 0; b < 3; b++) { const broken = (i >> b) & 1; if (broken) { rect(g, rgba('#ffe8ff', a), -4, -3 + b * 3, 3, 1.5); rect(g, rgba('#ffe8ff', a), 1, -3 + b * 3, 3, 1.5); } else rect(g, rgba('#ffe8ff', a), -4, -3 + b * 3, 8, 1.5); }
          g.restore();
        }
      }
      g.lineWidth = 1;
      glow(g, x, y, r * 0.5, '#c8a8ff', 0.3 * a);
    });
  }

  function thirdEye(g, x, y, s, open, a) {
    if (a <= 0) return;
    lighter(g, () => glow(g, x, y, 16 * s, '#ff9ae0', 0.6 * a));
    poly(g, rgba('#2a1030', a), [x - 9 * s, y, x, y - 5 * s * open, x + 9 * s, y, x, y + 5 * s * open]);
    if (open > 0.2) { ell(g, rgba('#ffd060', a), x, y, 3 * s, 3 * s * open); ell(g, rgba('#1a0a20', a), x, y, 1.2 * s, 1.6 * s * open); }
  }

  function bigMoon(g, x, y, r, a) {
    lighter(g, () => glow(g, x, y, r * 1.8, '#c8dcff', 0.4 * (a == null ? 1 : a)));
    ell(g, rgba('#e8f0ff', a == null ? 1 : a), x, y, r, r);
    ell(g, rgba('#c8d4ec', (a == null ? 1 : a) * 0.6), x - r * 0.3, y - r * 0.2, r * 0.22, r * 0.18);
    ell(g, rgba('#c8d4ec', (a == null ? 1 : a) * 0.5), x + r * 0.25, y + r * 0.3, r * 0.15, r * 0.12);
  }

  function iceBloom(g, x, y, r, a) {
    if (a <= 0) return;
    lighter(g, () => { for (let i = 0; i < 6; i++) A.crystal(g, x, y, r * (0.7 + 0.3 * (i % 2)), i * Math.PI / 3 - Math.PI / 2, a); glow(g, x, y, r, '#a8e0ff', 0.4 * a); });
  }

  function coin(g, x, y, r, a) {
    ell(g, rgba('#8a5a10', a), x, y + 1, r, r * 0.9);
    ell(g, rgba('#ffd060', a), x, y, r, r * 0.9);
    rect(g, rgba('#b88020', a), Math.round(x - 0.5), Math.round(y - r * 0.5), 1, Math.max(1, Math.round(r)));
  }

  function chart(g, x, y, w, h, k, col) {
    const pts = [0, 0.7, 0.18, 0.55, 0.32, 0.62, 0.5, 0.35, 0.66, 0.42, 0.82, 0.15, 1, 0];
    const n = Math.max(2, Math.floor(pts.length / 2 * k));
    g.strokeStyle = col || '#7aff9a'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < n; i++) { const px = x + pts[i * 2] * w, py = y + pts[i * 2 + 1] * h; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke(); g.lineWidth = 1;
    if (k >= 1) poly(g, col || '#7aff9a', [x + w + 6, y, x + w - 4, y - 4, x + w - 2, y + 6]);
  }

  function tailSpirit(g, x, y, s, T, a) {
    if (a <= 0) return;
    const n = 18, pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, q = -0.4 + u * 3.6 + Math.sin(T * 2 + u * 3) * 0.12; pts.push([x + Math.cos(q) * (12 + u * 26) * s * (1 - u * 0.3), y - u * 70 * s - Math.sin(q) * 10 * s, (14 - u * 10) * s]); }
    lighter(g, () => {
      glow(g, x, y - 36 * s, 56 * s, '#5affb0', 0.35 * a);
      for (let i = 0; i < pts.length - 1; i++) {
        const [px, py, w] = pts[i], [qx, qy] = pts[i + 1];
        line(g, rgba('#2ad890', 0.45 * a), w * 1.6, px, py, qx, qy);
        line(g, rgba('#a8ffd8', 0.6 * a), Math.max(1, w * 0.6), px, py, qx, qy);
        if (i % 3 === 0) { const fl = Math.sin(T * 9 + i) * 3 * s; poly(g, rgba('#c8ffe8', 0.5 * a), [px - w * 0.4, py, px + fl, py - w * 1.4, px + w * 0.4, py]); }
      }
    });
    const [hx0, hy0, hw] = pts[n];
    ell(g, rgba('#e8fff4', a), hx0, hy0, hw * 1.4, hw * 1.2);
    ell(g, rgba('#1a3a2a', a), hx0 - hw * 0.5, hy0 - hw * 0.1, 1.6 * s, 2 * s); ell(g, rgba('#1a3a2a', a), hx0 + hw * 0.5, hy0 - hw * 0.1, 1.6 * s, 2 * s);
    poly(g, rgba('#1a3a2a', a), [hx0 - 2 * s, hy0 + hw * 0.5, hx0 + 2 * s, hy0 + hw * 0.5, hx0, hy0 + hw * 0.8]);
  }

  function talisman(g, x, y, rot, a, s) {
    const k = s || 1;
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha *= cl(a == null ? 1 : a);
    rect(g, '#f0d870', -4 * k, -9 * k, 8 * k, 18 * k);
    rect(g, '#c8302a', -2 * k, -6 * k, 4 * k, 1.5 * k); rect(g, '#c8302a', -0.7 * k, -6 * k, 1.4 * k, 10 * k); rect(g, '#c8302a', -2.5 * k, 1 * k, 5 * k, 1.5 * k); ell(g, '#c8302a', 0, 6 * k, 1.8 * k, 1.8 * k);
    g.restore();
  }

  function rose(g, x, y, r, col, a) {
    const c = col || '#d8303a';
    for (let i = 0; i < 5; i++) { const q = i / 5 * Math.PI * 2; ell(g, rgba(c, a == null ? 1 : a), x + Math.cos(q) * r * 0.45, y + Math.sin(q) * r * 0.45, r * 0.55, r * 0.45, q); }
    ell(g, rgba(H.Gfx.dark(c, 0.3), a == null ? 1 : a), x, y, r * 0.4, r * 0.4);
    ell(g, rgba(H.Gfx.light(c, 0.3), a == null ? 1 : a), x - r * 0.1, y - r * 0.15, r * 0.18, r * 0.14);
  }

  function petals(g, T, n, seed, col, x0, x1, y0, y1, wind) {
    for (let i = 0; i < n; i++) {
      const ph = (T * (0.2 + hx(i, seed, 3) * 0.2) + hx(i, seed, 4)) % 1;
      const x = lerp(x0, x1, (hx(i, seed, 5) + ph * (wind || 0.4)) % 1), y = lerp(y0, y1, ph);
      ell(g, rgba(col, 0.8 * Math.sin(ph * Math.PI)), x, y, 2, 1.2, T * 3 + i);
    }
  }

  function plasterBust(g, x, y, s) {
    poly(g, '#d8d4cc', [x - 16 * s, y, x + 16 * s, y, x + 12 * s, y - 10 * s, x - 12 * s, y - 10 * s]);
    rect(g, '#e8e4dc', x - 6 * s, y - 16 * s, 12 * s, 7 * s);
    ell(g, '#efebe4', x, y - 26 * s, 10 * s, 12 * s);
    ell(g, '#c8c4bc', x - 3 * s, y - 27 * s, 2 * s, 1 * s); ell(g, '#c8c4bc', x + 3 * s, y - 27 * s, 2 * s, 1 * s);
    for (let i = 0; i < 6; i++) ell(g, '#a8c870', x - 10 * s + i * 4 * s, y - 36 * s + Math.abs(i - 2.5) * 1.5 * s, 2.4 * s, 1.4 * s, 0.4);
  }

  function chalkboard(g, x, y, w, h, k, T) {
    rect(g, '#3a2a1a', x - 3, y - 3, w + 6, h + 6); rect(g, '#1e3a2a', x, y, w, h);
    const lines = ['P → Q', 'Q → R', '∴ P → R', 'x² + y² = r²', 'cogito ergo sum'];
    g.save(); g.font = 'bold 8px Georgia, serif'; g.fillStyle = 'rgba(240,240,230,0.85)'; g.textBaseline = 'top';
    lines.forEach((t, i) => { const shown = Math.floor(t.length * cl(k * lines.length - i)); if (shown > 0) g.fillText(t.slice(0, shown), x + 6, y + 6 + i * 11); });
    g.restore();
  }

  function gardenSky(g, horizon) { vgrad(g, 0, horizon, [[0, '#1a0a20'], [0.6, '#5a1a30'], [1, '#c8604a']]); }

  function irisField(g, T, y0, n, a) {
    for (let i = 0; i < n; i++) {
      const x = hx(i, 7, 23) * LW, y = y0 + hx(i, 8, 23) * (LH - y0), sw = Math.sin(T * 1.5 + i) * 1.5;
      line(g, rgba('#2a4a2a', a), 1, x, y, x + sw, y - 10);
      ell(g, rgba('#f4f4f8', a), x + sw, y - 12, 2.6, 3.2); ell(g, rgba('#c8c8e0', a), x + sw - 1.5, y - 11, 1.6, 2.2);
    }
  }

  const ULTS = {
    jingyuan: {
      line: 'Блистательный дух, внемли моим словам.', side: 'l', v: { mouth: 'open' }, d: 1.6, sfx: [[0.1, 'tech'], [0.35, 'ult'], [0.9, 'crit'], [1.05, 'crit'], [1.2, 'crit'], [1.35, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.15, 0.8)), strike = seg(t, 0.85, 1.5);
        luofuNight(g, T, 170);
        vgrad(g, 170, LH, [[0, '#2a1a3a'], [1, '#120a1c']]);
        lordGiant(g, 200, 250 - rise * 40, 1.25, rise, T, strike > 0 ? 0.4 : 0);
        hero(S, P.look, 96, 262);
        if (strike > 0) for (let i = 0; i < 4; i++) { const k = seg(strike, i * 0.18, i * 0.18 + 0.4); if (k > 0 && k < 1) A.bolt(g, 275, 40, 40 + i * 70 + hx(i, 2, 9) * 30, FLOOR, Math.floor(T * 20) + i, '#c8a8ff', 3); }
        if (strike > 0 && strike < 0.12) flash(g, '#f0e4ff', 0.6 * (1 - strike / 0.12));
      }
    },
    luocha: {
      line: 'Мертвецы восстанут!', side: 'r', d: 1.5, sfx: [[0.1, 'glint'], [0.4, 'whoosh'], [0.9, 'ult'], [1.15, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, bloom = eOut(seg(t, 0.3, 0.9)), sweep = seg(t, 0.9, 1.4);
        vgrad(g, 0, LH, [[0, '#04100e'], [0.6, '#0e2a24'], [1, '#1a3a30']]);
        irisField(g, T, 170, 40, 0.9);
        F.coffin(g, 250, 200, 64, 120);
        lighter(g, () => glow(g, 250, 90, 70 * bloom, '#f0d070', 0.5 * bloom));
        if (bloom > 0) A.flower(g, 250, 90, 26 * bloom, T * 0.6, '#f8e8a0', bloom);
        hero(S, P.look, 110, 262);
        if (sweep > 0) lighter(g, () => { for (let i = 0; i < 6; i++) { const y = 40 + i * 26, x = lerp(250, -20, eOut(sweep)); line(g, rgba(i % 2 ? '#f0d070' : '#1a1418', 1 - sweep), 3, 250, 90, x, y); } });
        if (sweep > 0 && sweep < 0.15) flash(g, '#fff4c8', 0.5 * (1 - sweep / 0.15));
      }
    },
    imbibitor: {
      line: 'Пробудись, дремлющая чешуя.', side: 'l', d: 1.6, sfx: [[0.1, 'splash'], [0.45, 'whoosh'], [0.95, 'ult'], [1.15, 'splash'], [1.3, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, coil = seg(t, 0.25, 1.1), dive = seg(t, 1.05, 1.5);
        vgrad(g, 0, LH, [[0, '#020a12'], [0.5, '#0a2a36'], [1, '#0e4a52']]);
        bigMoon(g, 250, 50, 22, 0.7);
        for (let i = 0; i < 8; i++) { const y = 150 + i * 8; line(g, rgba('#7ae8e0', 0.12 + 0.05 * Math.sin(T * 2 + i)), 1, 0, y, LW, y + Math.sin(T + i) * 2); }
        lighter(g, () => poly(g, 'rgba(200,240,255,0.12)', [235, 60, 265, 60, 300, 210, 200, 210]));
        hero(S, P.look, 100, 262);
        waterDragon(g, -20, 200, 330, 110, eOut(coil), 1 - dive * 0.6, T, 90);
        if (dive > 0) { lighter(g, () => { ring(g, rgba('#c8fff4', 1 - dive), 3, 250, 160, 10 + dive * 90); glow(g, 250, 160, 50, '#7ae8e0', 0.6 * (1 - dive)); }); K.sparks(g, T, 250, 160, 20, 7, '#c8fff4', 60 * dive); }
        if (dive > 0 && dive < 0.15) flash(g, '#e0fffc', 0.5 * (1 - dive / 0.15));
      }
    },
    fuxuan: {
      line: 'Всё сущее подчиняется своим законам...', side: 'r', d: 1.5, sfx: [[0.1, 'glint'], [0.4, 'scan'], [0.8, 'ult'], [1.1, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, ringK = eOut(seg(t, 0.15, 0.8)), eye = seg(t, 0.6, 1.0), fall = seg(t, 1.0, 1.5);
        vgrad(g, 0, LH, [[0, '#08041a'], [0.6, '#1e0e3a'], [1, '#3a1a50']]);
        K.stars(g, T, 80, 63, 0.9);
        divRing(g, 160, 100, 100 * ringK, T, ringK);
        thirdEye(g, 160, 60, 2.2, eye, eye);
        hero(S, P.look, 160, 262);
        if (fall > 0) lighter(g, () => { for (let i = 0; i < 12; i++) { const x = 20 + i * 26, k = seg(fall, i * 0.03, 0.6 + i * 0.03); line(g, rgba('#f0c8ff', 0.8 * (1 - k)), 2, x, -10 + k * 60, x - 20, -10 + k * 220); } });
        if (fall > 0 && fall < 0.12) flash(g, '#f4e8ff', 0.5 * (1 - fall / 0.12));
      }
    },
    jingliu: {
      line: 'Всё станет явным... в лунном пламени!', side: 'l', d: 1.6, sfx: [[0.1, 'glint'], [0.5, 'whoosh'], [0.95, 'swing'], [1.1, 'crit'], [1.3, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, moon = eOut(seg(t, 0, 0.7)), cut = seg(t, 0.95, 1.35), bloom = seg(t, 1.1, 1.6);
        vgrad(g, 0, LH, [[0, '#02040e'], [0.6, '#0a1430'], [1, '#1a2a50']]);
        bigMoon(g, 200, 90 - moon * 20, 60 + moon * 10, 0.9);
        vgrad(g, 180, LH, [[0, '#a8c8ec'], [1, '#5a7aa8']]);
        K.snowfall(g, T, 26, 19, { speed: 24, wind: 8, a: 0.7 });
        hero(S, P.look, 100, 262);
        if (cut > 0) lighter(g, () => { g.lineWidth = 10; g.strokeStyle = rgba('#c8e8ff', (1 - cut) * 0.7); g.beginPath(); g.arc(170, 120, 110, -2.4, lerp(-2.4, 0.6, eOut(cut))); g.stroke(); g.lineWidth = 2; g.strokeStyle = rgba('#ffffff', 1 - cut); g.stroke(); g.lineWidth = 1; });
        for (let i = 0; i < 4; i++) iceBloom(g, 200 + i * 28, 90 + (i % 2) * 40, 20, bloom * (1 - seg(t, 1.45, 1.6)));
        if (cut > 0 && cut < 0.15) flash(g, '#e8f4ff', 0.5 * (1 - cut / 0.15));
      }
    },
    topaz: {
      line: 'Рынок слишком непредсказуем...', side: 'r', d: 1.5, team: 'buff', sfx: [[0.1, 'select'], [0.4, 'sparkle'], [0.8, 'ticket'], [1.1, 'confirm']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, grow = eOut(seg(t, 0.25, 0.9)), stampK = seg(t, 0.95, 1.2);
        vgrad(g, 0, LH, [[0, '#2a1006'], [0.6, '#8a4a10'], [1, '#e8a040']]);
        for (let i = 0; i < 6; i++) { const x = i * 56, h = 60 + hx(i, 2, 29) * 80; rect(g, '#3a1a08', x, FLOOR - h, 40, h); for (let k = 0; k < 6; k++) rect(g, k % 2 ? '#ffd890' : '#5a3010', x + 6, FLOOR - h + 8 + k * 12, 28, 4); }
        chart(g, 30, 30, 120, 60, seg(t, 0.3, 1.0), '#9affa8');
        hero(S, P.look, 110, 262);
        S.foe('trotter', 230, 200, Math.round(50 + grow * 50));
        for (let i = 0; i < 18; i++) { const ph = (T * 0.8 + hx(i, 1, 31)) % 1; coin(g, 160 + hx(i, 2, 31) * 160, -10 + ph * 220, 3, grow * Math.sin(ph * Math.PI)); }
        F.stamp(g, 230, 70, 1.1, 'ПРИБЫЛЬ', stampK, '#d8302a');
      }
    },
    huohuo: {
      line: 'Зверь или демон, я всех сокрушу!', side: 'l', d: 1.5, team: 'buff', sfx: [[0.1, 'whoosh'], [0.45, 'ult'], [0.9, 'glint'], [1.1, 'buff']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, grow = eOut(seg(t, 0.2, 0.8)), fly0 = seg(t, 0.8, 1.4);
        vgrad(g, 0, LH, [[0, '#06140e'], [0.6, '#123a2a'], [1, '#2a5a40']]);
        for (let i = 0; i < 9; i++) F.lanternR(g, 18 + i * 36, 14, 0.9, T, i, i % 3 !== 1);
        tailSpirit(g, 170, 220, 1 + grow * 1.4, T, grow);
        hero(S, P.look, 90, 262, { v: { closed: t < 0.5 } });
        for (let i = 0; i < 6; i++) { const k = seg(fly0, i * 0.06, 0.5 + i * 0.06); if (k > 0 && k < 1) talisman(g, lerp(150, 330, eOut(k)), lerp(110, 30 + i * 30, k), k * 6, 1 - k * 0.3, 1.3); }
      }
    },
    argenti: {
      line: 'Пока не увижу это сияние ещё раз...', side: 'r', d: 1.6, sfx: [[0.1, 'glint'], [0.4, 'strum'], [0.95, 'swing'], [1.1, 'crit'], [1.3, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, beam = eOut(seg(t, 0.2, 0.8)), thrust = seg(t, 0.95, 1.35);
        gardenSky(g, LH);
        lighter(g, () => poly(g, rgba('#fff0d0', 0.25 * beam), [130, 0, 190, 0, 260, FLOOR, 60, FLOOR]));
        for (let i = 0; i < 9; i++) rose(g, 10 + i * 36, FLOOR - 4 + (i % 2) * 6, 7, '#d8303a');
        petals(g, T, 40, 11, '#ff5a6a', 0, LW, -10, LH, 0.6);
        hero(S, P.look, 120, 262);
        if (thrust > 0) lighter(g, () => { const x = lerp(150, 330, eOut(thrust)); line(g, rgba('#ffe8f0', 1 - thrust * 0.5), 4, 150, 130, x, 110); glow(g, x, 110, 30, '#ff8aa0', 0.8 * (1 - thrust)); for (let i = 0; i < 12; i++) rose(g, x - i * 14, 110 + Math.sin(i + T * 4) * 10, 3, '#ff5a6a', 1 - thrust); });
        if (thrust > 0 && thrust < 0.12) flash(g, '#fff0f4', 0.5 * (1 - thrust / 0.12));
      }
    },
    ratio: {
      line: 'Знание обличает истину и... заблуждение.', side: 'l', d: 1.5, sfx: [[0.1, 'select'], [0.35, 'text'], [0.7, 'text'], [1.0, 'crit'], [1.2, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, write = seg(t, 0.1, 0.9), proof = seg(t, 0.95, 1.4);
        vgrad(g, 0, LH, [[0, '#0e0a1a'], [1, '#2a2040']]);
        chalkboard(g, 150, 24, 150, 90, write, T);
        plasterBust(g, 270, 200, 1.4);
        hero(S, P.look, 90, 262);
        if (proof > 0) lighter(g, () => { const k = eOut(proof); g.strokeStyle = rgba('#ffd860', 1 - proof * 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(160, 190); g.lineTo(lerp(160, 290, k), lerp(190, 60, k)); g.lineTo(lerp(160, 300, k), 190); g.closePath(); g.stroke(); g.lineWidth = 1; glow(g, 230, 130, 60 * k, '#ffd860', 0.5 * (1 - proof)); });
        if (proof > 0 && proof < 0.12) flash(g, '#fff8e0', 0.5 * (1 - proof / 0.12));
      }
    }
  };

  const FUS = {
    f_quintet: {
      lines: [[0, 'Давно не виделись... наставник.'], [1, 'Луна прольёт свет на правду.']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'glint'], [0.5, 'tech'], [1.0, 'swing'], [1.2, 'crit'], [1.4, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Jy, Jl] = P.m, rise = eOut(seg(t, 0.2, 0.9)), cut = seg(t, 1.0, 1.5);
        vgrad(g, 0, LH, [[0, '#04041a'], [0.7, '#1a1a40'], [1, '#2a2a5a']]);
        bigMoon(g, 240, 60, 34, 0.8);
        lordGiant(g, 80, 240, 1.0, rise * 0.7, T);
        hero(S, Jy.look, 80, 262); hero(S, Jl.look, 240, 262, { flip: true });
        if (cut > 0) { lighter(g, () => { g.lineWidth = 8; g.strokeStyle = rgba('#c8e8ff', (1 - cut) * 0.8); g.beginPath(); g.arc(160, 130, 100, -2.6, lerp(-2.6, 0.4, eOut(cut))); g.stroke(); g.lineWidth = 1; }); A.bolt(g, 100, 20, 200, 150, Math.floor(T * 20), '#c8a8ff', 3); }
        if (cut > 0 && cut < 0.12) flash(g, '#eef0ff', 0.5 * (1 - cut / 0.12));
      }
    },
    f_guard: {
      lines: [[0, 'Помни, Яньцин: сначала думай, потом делай.'], [1, 'Генерала можно не беспокоить!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'swing'], [0.5, 'swing'], [0.9, 'tech'], [1.2, 'crit'], [1.4, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Jy, Yq] = P.m, swords = seg(t, 0.2, 1.1), bolt = seg(t, 1.1, 1.5);
        luofuNight(g, T, 170, ['#0a1430', '#2a3a6a', '#6a6a9a']);
        vgrad(g, 170, LH, [[0, '#2a2a40'], [1, '#14141e']]);
        hero(S, Jy.look, 80, 262); hero(S, Yq.look, 240, 262, { flip: true });
        for (let i = 0; i < 6; i++) { const q = T * 2 + i * Math.PI / 3, r = 30 + swords * 40; A.sword(g, 240 + Math.cos(q) * r, 110 + Math.sin(q) * r * 0.5, q + Math.PI / 2, 26, swords * (1 - bolt)); }
        if (bolt > 0) for (let i = 0; i < 3; i++) A.bolt(g, 80, 20, 180 + i * 50, FLOOR, Math.floor(T * 22) + i, '#c8a8ff', 3);
      }
    },
    f_divination: {
      lines: [[0, 'Цинцюэ? А я знала, что ты не в архиве.'], [1, 'Удар наудачу!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'scan'], [0.5, 'select'], [0.7, 'select'], [1.1, 'crit'], [1.3, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Fx, Qq] = P.m, ringK = eOut(seg(t, 0.1, 0.8)), deal = seg(t, 0.6, 1.3);
        vgrad(g, 0, LH, [[0, '#0a061a'], [1, '#2a1a40']]);
        K.stars(g, T, 60, 71, 0.8);
        divRing(g, 160, 100, 90 * ringK, T, ringK);
        hero(S, Fx.look, 80, 262); hero(S, Qq.look, 240, 262, { flip: true });
        for (let i = 0; i < 4; i++) { const k = eOut(seg(deal, i * 0.15, 0.5 + i * 0.15)); F.tile(g, lerp(240, 110 + i * 34, k), lerp(110, 100 + Math.sin(i + T) * 6, k), 1.6, i % 3, (1 - k) * 4, k); }
      }
    },
    f_vidyadhara: {
      lines: [[0, 'Не бойтесь.'], [1, 'Прими-ка витаминку.']], swap: 0.85, d: 1.8, team: 'heal',
      sfx: [[0.1, 'splash'], [0.5, 'whoosh'], [1.0, 'crit'], [1.3, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Il, Bl] = P.m, coil = seg(t, 0.2, 1.2);
        vgrad(g, 0, LH, [[0, '#020e14'], [1, '#0e4a52']]);
        bigMoon(g, 160, 40, 18, 0.6);
        hero(S, Il.look, 80, 262); hero(S, Bl.look, 240, 262, { flip: true });
        waterDragon(g, 20, 190, 300, 90, eOut(coil), 1, T, 70);
        if (t > 1.2) for (let i = 0; i < 12; i++) { const ph = (T * 0.8 + hx(i, 1, 81)) % 1; F.cross(g, hx(i, 2, 81) * LW, FLOOR - ph * 150, 1, (1 - ph) * cl((t - 1.2) * 3)); }
      }
    },
    f_tenlords: {
      lines: [[0, 'Госпожа Ханья, тоже бессонная ночь?..'], [1, 'Именем и волей десяти владык...']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'select'], [0.5, 'confirm'], [0.95, 'debuff'], [1.25, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Hh, Ha] = P.m, w = seg(t, 0.2, 0.8), bind = seg(t, 0.9, 1.4);
        vgrad(g, 0, LH, [[0, '#06100c'], [1, '#1a2a24']]);
        rect(g, '#efe6d0', 120, 20, 80, 110);
        F.brush(g, [130, 40, 160, 44, 190, 36, 170, 70, 140, 90, 186, 100], w, '#1a1418', 3);
        F.stamp(g, 168, 112, 1, 'НОША', seg(t, 0.75, 0.9), '#d83a3a');
        tailSpirit(g, 70, 220, 1.2, T, seg(t, 0.3, 0.9));
        for (let i = 0; i < 3; i++) F.chain(g, [0, LW, 160][i], [60, 70, 0][i], 250, 120, bind, '#d8d0f0');
        hero(S, Hh.look, 70, 262); hero(S, Ha.look, 240, 262, { flip: true });
      }
    }
  };

  function intro5(o) {
    return {
      d: 4.2, line: o.line, sfx: o.sfx,
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        if (t < 1.5) {
          o.scene(g, T, 0, S, P, t);
          fly(S, P, t, 0.2, 1.3, o.from || [20, 30], o.to || [160, 150], { lift: o.lift == null ? 30 : o.lift, s: 1.3, trail: o.trail });
        } else if (t < 2.8) {
          const k = t - 1.5;
          o.scene(g, T, 1, S, P, k);
          S.bust(P.id, 112, FLOOR + 8, 168, { v: k > 0.7 ? { mouth: 'open' } : k < 0.4 ? { closed: true } : null });
          const hold = eOut(seg(k, 0, 0.4));
          WI.ticket(g, lerp(250, 222, hold), lerp(40, 124, hold), { s: 1.6, rot: 0.2 * (1 - hold), std: P.std, glow: 0.7 });
          if (o.near) o.near(g, T, k, S, P);
        } else {
          const k = t - 2.8;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.3)), () => {
            o.scene(g, T, 2, S, P, k);
            stand(g, o.col);
            pose(S, P);
            const h = hand(P, 1);
            WI.ticket(g, h.x + 4, h.y - 4, { s: 0.8, rot: 0.15, std: P.std, glow: 0.5 });
            if (o.after) o.after(g, T, k, S, P);
          });
        }
        cuts(g, t, [1.5, 2.8]);
      }
    };
  }

  const WARP = {
    jingyuan: intro5({
      line: 'Цзин Юань, генерал Лофу. Оставим церемонии.', col: '#b48aff', trail: '#e0d0ff',
      sfx: [[0.2, 'select'], [0.9, 'glint'], [1.55, 'whoosh'], [2.1, 'tech'], [2.4, 'crit'], [2.8, 'star5']],
      scene(g, T, ph, S, P, k) {
        luofuNight(g, T, ph === 2 ? 190 : 170);
        vgrad(g, ph === 2 ? 190 : 170, LH, [[0, '#2a1a3a'], [1, '#120a1c']]);
        if (ph === 0) { rect(g, '#3a2a1a', 120, 168, 80, 6); rect(g, '#e8dcc0', 128, 160, 64, 8); for (let i = 0; i < 9; i++) ell(g, i % 2 ? '#1a1a1a' : '#f4f0e8', 132 + (i % 5) * 12, 162 + Math.floor(i / 5) * 4, 2.4, 1.2); }
        if (ph === 2) lordGiant(g, CX + 70, 226, 0.9, 0.55 + 0.1 * Math.sin(T * 2), T);
      },
      after(g, T) { if (Math.floor(T * 3) % 4 === 0) A.bolt(g, CX + 120, 20, CX + 90, 120, Math.floor(T * 10), '#c8a8ff', 2); }
    }),
    luocha: intro5({
      line: 'Лоча, странствующий торговец. Всего лишь прохожу мимо.', col: '#f0d070', trail: '#fff4c8', from: [300, 20], to: [150, 150],
      sfx: [[0.2, 'step'], [0.8, 'glint'], [1.55, 'whoosh'], [2.2, 'heal'], [2.8, 'star5']],
      scene(g, T, ph) {
        vgrad(g, 0, LH, [[0, '#04100e'], [0.6, '#0e2a24'], [1, '#1a3a30']]);
        K.stars(g, T, 30, 83, 0.5, 120);
        irisField(g, T, 160, 36, 0.9);
        F.coffin(g, ph === 2 ? 70 : 240, 206, 58, 110);
        if (ph !== 1) A.flower(g, ph === 2 ? 70 : 240, 80, 14, T * 0.4, '#f8e8a0', 0.8);
      }
    }),
    imbibitor: intro5({
      line: 'Не волнуйся, я всё тот же Дань Хэн.', col: '#7ae8e0', trail: '#c8fff4', from: [20, 200], to: [170, 140], lift: 60,
      sfx: [[0.2, 'splash'], [0.9, 'whoosh'], [1.55, 'glint'], [2.2, 'splash'], [2.8, 'star5']],
      scene(g, T, ph, S, P, k) {
        vgrad(g, 0, LH, [[0, '#020a12'], [0.5, '#0a2a36'], [1, '#0e4a52']]);
        bigMoon(g, 250, 46, 20, 0.6);
        for (let i = 0; i < 8; i++) { const y = 160 + i * 7; line(g, rgba('#7ae8e0', 0.12 + 0.05 * Math.sin(T * 2 + i)), 1, 0, y, LW, y + Math.sin(T + i) * 2); }
        if (ph === 0) waterDragon(g, -20, 210, 340, 120, seg(k, 0.1, 1.2), 0.8, T, 70);
        if (ph === 2) waterDragon(g, -10, 190, 330, 70, 1, 0.45, T, 50);
      }
    }),
    fuxuan: intro5({
      line: 'Фу Сюань. Это наша двадцать вторая первая встреча.', col: '#c8a8ff', trail: '#f0d8ff', from: [160, -10], to: [160, 120], lift: 0,
      sfx: [[0.2, 'scan'], [0.9, 'glint'], [1.55, 'select'], [2.2, 'glint'], [2.8, 'star5']],
      scene(g, T, ph, S, P, k) {
        vgrad(g, 0, LH, [[0, '#08041a'], [0.6, '#1e0e3a'], [1, '#3a1a50']]);
        K.stars(g, T, 70, 85, 0.9);
        divRing(g, ph === 2 ? CX : 160, ph === 2 ? 120 : 110, ph === 1 ? 70 : 90, T, ph === 0 ? seg(k, 0, 0.8) : 0.7);
        if (ph === 0) thirdEye(g, 160, 60, 2, seg(k, 0.6, 1.2), seg(k, 0.5, 0.8));
      }
    }),
    jingliu: intro5({
      line: 'Цзинлю. Притворись, что мы не встречались.', col: '#a8d8ff', trail: '#e8f4ff', from: [300, 30], to: [150, 150],
      sfx: [[0.2, 'glint'], [0.9, 'whoosh'], [1.55, 'swing'], [2.2, 'glint'], [2.8, 'star5']],
      scene(g, T, ph) {
        vgrad(g, 0, LH, [[0, '#02040e'], [0.6, '#0a1430'], [1, '#1a2a50']]);
        bigMoon(g, ph === 2 ? CX + 40 : 230, 70, ph === 1 ? 44 : 56, 0.85);
        vgrad(g, 186, LH, [[0, '#a8c8ec'], [1, '#5a7aa8']]);
        K.snowfall(g, T, 24, 21, { speed: 22, wind: 6, a: 0.7 });
        if (ph !== 1) { A.sword(g, 60, 200, -1.9, 30, 0.8); A.sword(g, 80, 206, -1.3, 18, 0.6); }
      }
    }),
    topaz: intro5({
      line: 'Топаз, отдел стратегических инвестиций. Добрый день!', col: '#ffd060', trail: '#fff0b0',
      sfx: [[0.2, 'ticket'], [0.9, 'sparkle'], [1.55, 'select'], [2.2, 'confirm'], [2.8, 'star5']],
      scene(g, T, ph, S) {
        vgrad(g, 0, LH, [[0, '#2a1006'], [0.6, '#8a4a10'], [1, '#e8a040']]);
        for (let i = 0; i < 6; i++) { const x = i * 56, h = 60 + hx(i, 2, 29) * 80; rect(g, '#3a1a08', x, FLOOR - h, 40, h); for (let k = 0; k < 6; k++) rect(g, k % 2 ? '#ffd890' : '#5a3010', x + 6, FLOOR - h + 8 + k * 12, 28, 4); }
        for (let i = 0; i < 10; i++) { const ph2 = (T * 0.5 + hx(i, 3, 37)) % 1; coin(g, 20 + hx(i, 4, 37) * 280, ph2 * 200, 2.6, Math.sin(ph2 * Math.PI)); }
        if (ph === 2) S.foe('trotter', CX + 60, 232, 46);
        if (ph === 0) S.foe('trotter', 250, 206, 40);
      }
    }),
    huohuo: intro5({
      line: 'П-привет, я Хохо, новая судья Комиссии десяти владык.', col: '#5affb0', trail: '#c8ffe0', from: [20, 200], to: [160, 140], lift: 40,
      sfx: [[0.2, 'whoosh'], [0.9, 'glint'], [1.55, 'whoosh'], [2.2, 'buff'], [2.8, 'star5']],
      scene(g, T, ph, S, P, k) {
        vgrad(g, 0, LH, [[0, '#06140e'], [0.6, '#123a2a'], [1, '#2a5a40']]);
        for (let i = 0; i < 9; i++) F.lanternR(g, 18 + i * 36, 14, 0.9, T, i, i % 3 !== 1);
        for (let i = 0; i < 5; i++) talisman(g, 30 + i * 66, 60 + Math.sin(T * 2 + i) * 6, Math.sin(T + i) * 0.3, 0.8, 1.2);
        if (ph === 2) tailSpirit(g, CX - 40, 230, 1.1, T, 0.8);
        if (ph === 0) tailSpirit(g, 160, 210, 0.8 + seg(k, 0, 1.2) * 0.6, T, seg(k, 0.2, 0.9));
      }
    }),
    argenti: intro5({
      line: 'Аргенти. Этой розой я хочу выразить своё почтение.', col: '#ff8aa0', trail: '#ffd0d8', from: [300, 20], to: [160, 150],
      sfx: [[0.2, 'strum'], [0.9, 'glint'], [1.55, 'whoosh'], [2.2, 'glint'], [2.8, 'star5']],
      scene(g, T, ph) {
        gardenSky(g, LH);
        lighter(g, () => poly(g, 'rgba(255,240,208,0.16)', [140, 0, 180, 0, 250, FLOOR, 70, FLOOR]));
        for (let i = 0; i < 9; i++) rose(g, 10 + i * 36, FLOOR - 4 + (i % 2) * 6, 7, '#d8303a');
        petals(g, T, 30, 13, '#ff5a6a', 0, LW, -10, LH, 0.5);
      },
      after(g, T) { rose(g, CX + 46, 110, 6, '#d8303a'); }
    }),
    ratio: intro5({
      line: 'Доктор Рацио. Порой я веду себя словно глупец.', col: '#ffd860', trail: '#fff4c0', from: [40, 20], to: [200, 120], lift: 10,
      sfx: [[0.2, 'select'], [0.9, 'text'], [1.55, 'text'], [2.2, 'glint'], [2.8, 'star5']],
      scene(g, T, ph, S, P, k) {
        vgrad(g, 0, LH, [[0, '#0e0a1a'], [1, '#2a2040']]);
        chalkboard(g, ph === 2 ? 20 : 150, 24, 130, 80, ph === 0 ? seg(k, 0, 1.4) : 1, T);
        plasterBust(g, ph === 2 ? 290 : 60, 206, 1.3);
      }
    }),
    danheng: {
      d: 3.2, line: 'Дань Хэн. Я охраняю экспресс и веду его базу данных.',
      sfx: [[0.3, 'whoosh'], [1.2, 'glint'], [1.6, 'select'], [2.2, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T;
        const car = () => {
          vgrad(g, 0, LH, [[0, '#1a1410'], [1, '#2a2018']]);
          for (let i = 0; i < 5; i++) { rect(g, '#3a2a1e', 8 + i * 64, 30, 56, 130); for (let k = 0; k < 8; k++) rect(g, ['#5a3a2a', '#2a3a5a', '#6a5a2a', '#3a5a3a'][(i + k) % 4], 12 + i * 64, 36 + k * 15, 48, 11); }
          rect(g, '#4a3424', 0, 160, LW, 80);
        };
        if (t < 1.1) {
          car();
          fly(S, P, t, 0.2, 0.95, [300, 40], [150, 150], { lift: 20, s: 1.2, trail: '#c8fff4' });
        } else if (t < 2.1) {
          const k = t - 1.1;
          car();
          S.bust(P.id, 120, FLOOR + 8, 160, { v: k > 0.6 ? { mouth: 'open' } : null });
          rect(g, '#efe6d0', 200, 70, 50, 70); rect(g, '#c8bca0', 204, 76, 42, 2); rect(g, '#c8bca0', 204, 84, 36, 2); rect(g, '#c8bca0', 204, 92, 40, 2);
          WI.ticket(g, 225, 118, { s: 1.4, rot: 0.1, std: P.std });
        } else {
          const k = t - 2.1;
          zoom(g, CX, 150, lerp(1.1, 1, eOut(k / 1.0)), () => {
            car();
            stand(g, '#5ad8a8');
            pose(S, P);
            const h = hand(P, 1);
            WI.ticket(g, h.x + 4, h.y - 6, { s: 0.8, rot: 0.2, std: P.std, glow: 0.5 });
          });
        }
        cuts(g, t, [1.1, 2.1]);
      }
    }
  };

  const EID = {
    jingyuan: {
      title: 'Доска в Обители', aura: 'elec',
      frags: [
        ['Взмах крушит скалы', 'Облачные Рыцари поднялись из пепла Бедствия огня. Клятва Охоты жива до сих пор.'],
        ['Фаланга заслоняет солнце', 'Он держит пост почти сто лет. Так долго генералы обычно не живут.'],
        ['Удар рассекает свет', 'Младенцем он выбрал игрушечный меч. Родители ждали учёного.'],
        ['Клинок роняет звёзды', 'Квадратная доска и круглые фигуры. Провидица видит его ходы на сорок восемь вперёд.'],
        ['Опыт побеждает смерть', 'Заоблачный квинтет распался меньше чем за сто лет. Остались воспоминания.'],
        ['Слава поражает врагов', 'Его зовут Дремлющим генералом. Сяньчжоу много лет живёт в мире.']
      ],
      paint(g, X, live) {
        luofuNight(g, 0, 170, ['#0a0618', '#2a1640', '#5a3a6a']);
        rect(g, '#2a1a24', 0, 170, LW, 70); rect(g, '#4a2a2a', 0, 170, LW, 3);
        rect(g, '#5a3a24', 190, 176, 92, 8); rect(g, '#3a2414', 196, 184, 6, 22); rect(g, '#3a2414', 270, 184, 6, 22);
        rect(g, '#e8dcc0', 200, 168, 72, 9);
        for (let i = 0; i < 10; i++) ell(g, i % 2 ? '#1a1a1a' : '#f4f0e8', 206 + (i % 5) * 14, 170 + Math.floor(i / 5) * 4, 2.6, 1.3);
        if (!live) lordGiant(g, 70, 200, 0.75, 0.35, 0);
      },
      decor(g, t) { lighter(g, () => { for (let i = 0; i < 3; i++) glow(g, 40 + i * 120, 120, 14, '#ffb060', 0.25 + 0.1 * Math.sin(t * 3 + i)); }); },
      life(g, t) { lordGiant(g, 70, 200, 0.75, 0.35 + 0.1 * Math.sin(t * 2), t); if (Math.floor(t * 2) % 5 === 0) A.bolt(g, 120, 0, 90, 120, Math.floor(t * 6), '#c8a8ff', 1); }
    },
    luocha: {
      title: 'Гроб у святилища', aura: 'imag',
      frags: [
        ['Омовение живых', 'Странствующий торговец с гробом за спиной. Бедствие застало его на «Лофу».'],
        ['Дар очищения', 'Он обещал не изучать запретное долголетие. Подпись поставлена.'],
        ['Попытка дурака', 'Местные не знали гробов. «Это инструмент для торговли», отвечал он.'],
        ['Тяжесть короны', 'Одежда родного мира напоминает ему о пути, который предстоит пройти.'],
        ['Метка жертвенности', 'Он помнит, как люди лезли повыше, чтобы увидеть гибель города.'],
        ['Прах к праху', 'Гроб молчит. Лоча дал обещание, а про себя произнёс иную клятву.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#04100e'], [0.6, '#0e2a24'], [1, '#1a3a30']]);
        K.stars(g, 0, 40, 91, 0.5, 120);
        irisField(g, 0, 150, 50, 0.95);
        F.coffin(g, 250, 206, 66, 124);
        if (!live) A.flower(g, 250, 74, 16, 0, '#f8e8a0', 0.9);
      },
      decor(g, t) { lighter(g, () => glow(g, 250, 74, 30, '#f0d070', 0.2 + 0.08 * Math.sin(t * 2))); },
      life(g, t) { A.flower(g, 250, 74, 16 + Math.sin(t * 2) * 2, t * 0.3, '#f8e8a0', 0.9); petals(g, t, 14, 21, '#f8f0c8', 0, LW, 0, LH, 0.3); }
    },
    imbibitor: {
      title: 'Сон в яйце видьядхара', aura: 'imag',
      frags: [
        ['Окутанный небесами', 'Ему снится алтарь и жертвенная песнь, призывающая дождь.'],
        ['Знамёна владычества', 'Он усмирил яростного дракона в Чешуйчатом ущелье. Настал мир на сотни лет.'],
        ['Облачное знамя', 'Во сне он смотрит на поле битвы свысока, и сердце становится глыбой льда.'],
        ['Красота лёгкого ветра', 'Он раздвигает волны, чтобы похоронить старого друга или создать новую жизнь.'],
        ['Падение гордыни', 'Цепи из кораллового золота. Судьи читают приговор, а он хранит безмолвие.'],
        ['Возвращение дракона', 'Он принял корону из рогов. И навсегда останется лишь самим собой.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#020a12'], [0.5, '#0a2a36'], [1, '#0e4a52']]);
        bigMoon(g, 260, 44, 20, 0.7);
        poly(g, '#04141a', [0, 0, 70, 0, 50, 90, 20, 150, 0, 170]);
        poly(g, '#04141a', [LW, 0, 250, 0, 280, 80, 300, 160, LW, 180]);
        for (let i = 0; i < 9; i++) { const y = 170 + i * 7; line(g, rgba('#7ae8e0', 0.15), 1, 0, y, LW, y); }
        if (!live) waterDragon(g, -10, 200, 330, 90, 1, 0.5, 0, 60);
      },
      decor(g, t) { for (let i = 0; i < 9; i++) { const y = 170 + i * 7; line(g, rgba('#c8fff4', 0.08 + 0.06 * Math.sin(t * 2 + i)), 1, 0, y, LW, y + Math.sin(t + i) * 2); } },
      life(g, t) { waterDragon(g, -10, 200, 330, 90, 1, 0.5, t, 60); }
    },
    fuxuan: {
      title: 'Матрица предвидения', aura: 'quant',
      frags: [
        ['Власть над жизнью', 'В библиотеке слепой старец спросил её: «Что ты хочешь знать?»'],
        ['Предзнаменование', 'Она попросила «око», чтобы видеть яснее. Так она стала прорицательницей.'],
        ['Неблагоприятный день', 'Учитель в поношенном плаще пилота. Вместо руки деревянный протез.'],
        ['Счастливая звезда', 'Годы в Комиссии «Юйцюэ» стали самыми счастливыми. Они спорили обо всём.'],
        ['Мастер сокрытого', 'Матрица выдаёт один и тот же ответ. Никто не выберет поражение.'],
        ['Зерно истины', 'Она ждёт обещанной генералом отставки. Этот день всё ещё кажется далёким.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#08041a'], [0.6, '#1e0e3a'], [1, '#3a1a50']]);
        K.stars(g, 0, 90, 93, 0.9);
        rect(g, '#1a1030', 0, 184, LW, 56); rect(g, '#4a3070', 0, 184, LW, 2);
        if (!live) divRing(g, 160, 96, 84, 0, 0.6);
      },
      decor(g, t) { K.stars(g, t, 20, 95, 0.5, 180); },
      life(g, t) { divRing(g, 160, 96, 84, t, 0.6); thirdEye(g, 160, 40, 1.6, 0.6 + 0.4 * Math.sin(t), 0.7); }
    },
    jingliu: {
      title: 'Луна над застывшей рекой', aura: 'ice',
      frags: [
        ['Атака ворот Тяньгуань', 'Меч из глыбы льда, лёгкий, как луч лунного света. Первый урок.'],
        ['Тень новолуния', 'Двенадцать Порхающих мечей вырываются на свободу, будто штормовой ливень.'],
        ['Взгляд полумесяца', 'Классом для второго урока стало поле боя, учителями стали враги.'],
        ['Ночной фонарь', 'Ремесленник в чёрном картузе вонзил меч в землю по самую рукоять.'],
        ['Тьма и Медведица', 'Некогда мечи были её единственными соратниками. Потом появились друзья.'],
        ['Затмение и пустота', 'Лезвие в трещинах. Этим мечом она погубила самого близкого друга.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#02040e'], [0.6, '#0a1430'], [1, '#1a2a50']]);
        bigMoon(g, 230, 70, 50, 0.85);
        vgrad(g, 180, LH, [[0, '#a8c8ec'], [1, '#5a7aa8']]);
        for (let i = 0; i < 6; i++) poly(g, '#d8e8f8', [20 + i * 52, 186, 28 + i * 52, 176, 36 + i * 52, 186]);
        A.sword(g, 70, 206, -1.8, 34, 0.9);
      },
      decor(g, t) { lighter(g, () => glow(g, 230, 70, 70, '#c8dcff', 0.15 + 0.05 * Math.sin(t))); },
      life(g, t) { K.snowfall(g, t, 22, 23, { speed: 18, wind: 6, a: 0.8 }); for (let i = 0; i < 3; i++) iceBloom(g, 160 + i * 50, 196, 8, 0.4 + 0.3 * Math.sin(t * 2 + i)); }
    },
    topaz: {
      title: 'Рабочее место Топаз', aura: 'fire',
      frags: [
        ['Рынок будущего', 'Самая молодая сотрудница отдела. Пожизненный контракт уже подписан.'],
        ['Гибкое управление', 'Высшие баллы по актуарным расчётам. Тест по бизнес-этике она пропустила.'],
        ['Хватай крупное', 'Питомцев приносить нельзя. С ними её производительность выросла на 27%.'],
        ['Инфляция спроса', 'Счетовод чует запах денег. Она берёт его во все заграничные поездки.'],
        ['Механизмы поощрения', 'Её краеугольный камень: топаз возврата долгов. Она в Десяти каменных сердцах.'],
        ['Прощальный вечер', 'Прощальная вечеринка Деворского. Все заняты, но кто-то стучит в дверь.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#2a1006'], [0.6, '#8a4a10'], [1, '#e8a040']]);
        for (let i = 0; i < 6; i++) { const x = i * 56, h = 60 + hx(i, 2, 29) * 80; rect(g, '#3a1a08', x, 196 - h, 40, h); for (let k = 0; k < 6; k++) rect(g, k % 2 ? '#ffd890' : '#5a3010', x + 6, 196 - h + 8 + k * 12, 28, 4); }
        rect(g, '#4a2a14', 0, 196, LW, 44); rect(g, '#6a3a1a', 180, 176, 110, 10); rect(g, '#2a1a10', 190, 186, 6, 30); rect(g, '#2a1a10', 276, 186, 6, 30);
        rect(g, '#1a1a22', 200, 150, 40, 26); rect(g, '#3aa8ff', 203, 153, 34, 18);
        chart(g, 205, 156, 28, 12, 1, '#9affa8');
      },
      decor(g, t) { for (let i = 0; i < 8; i++) { const ph = (t * 0.3 + hx(i, 3, 39)) % 1; coin(g, 20 + hx(i, 4, 39) * 280, ph * 200, 2.4, Math.sin(ph * Math.PI) * 0.8); } },
      life(g, t) { const S2 = H.Cine.stage(g, null, t); S2.foe('trotter', 120 + Math.sin(t * 2) * 8, 210 - Math.abs(Math.sin(t * 4)) * 8, 44); }
    },
    huohuo: {
      title: 'Хвост и талисман', aura: 'wind',
      frags: [
        ['Пристанище зла', 'Огонёк у дороги почти погас. Ей стало его жалко, и он сел ей на хвост.'],
        ['Дух в хвосте', 'Госпожа Ханья сказала беречь печать как зеницу ока.'],
        ['Пламя для мотыльков', 'Одноклассники смеялись над девочкой, у которой горит хвост.'],
        ['Сплетённая жизнь', 'Её талисманы хороши против звёздных духов. Сама она их не пробовала.'],
        ['Указ десяти владык', 'Она боится призраков и должна их ловить. Уволиться смелости не хватает.'],
        ['Общая судьба', '«Только я могу её ругать!» Хвост вступается за неё сам.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#06140e'], [0.6, '#123a2a'], [1, '#2a5a40']]);
        for (let i = 0; i < 9; i++) F.lanternR(g, 18 + i * 36, 14, 0.9, 0, i, i % 3 !== 1);
        rect(g, '#1a2a20', 0, 186, LW, 54); rect(g, '#3a5a40', 0, 186, LW, 2);
        if (!live) for (let i = 0; i < 4; i++) talisman(g, 40 + i * 80, 80, 0, 0.8, 1.4);
      },
      decor(g, t) { lighter(g, () => { for (let i = 0; i < 9; i++) if (i % 3 !== 1) glow(g, 18 + i * 36, 20, 12, '#ffb060', 0.2 + 0.1 * Math.sin(t * 4 + i)); }); },
      life(g, t) { for (let i = 0; i < 4; i++) talisman(g, 40 + i * 80, 80 + Math.sin(t * 2 + i) * 6, Math.sin(t + i) * 0.2, 0.8, 1.4); tailSpirit(g, 270, 214, 0.9, t, 0.7); }
    },
    argenti: {
      title: 'Сад Красоты', aura: 'phys',
      frags: [
        ['Изъян в царстве эстетики', 'Война в родном городе. Под каменной плитой он нашёл окарину.'],
        ['Смирение агата', 'Он спас ребёнка из пламени и получил в благодарность драгоценную окарину.'],
        ['Путь к славе', 'Старый мастер учил видеть Красоту в благочестии. Это образ жизни.'],
        ['Подношение горна', 'Копьё и непреклонный дух против соблазнов Триады демонов.'],
        ['Где-то идёт снег', 'Он поклялся хранить смирение, милосердие и справедливость.'],
        ['Твоё великолепие', 'Слухи о смерти Идрилы ползут по космосу. Он верен своей клятве.']
      ],
      paint(g, X, live) {
        gardenSky(g, LH);
        lighter(g, () => poly(g, 'rgba(255,240,208,0.14)', [140, 0, 180, 0, 250, 200, 70, 200]));
        rect(g, '#2a0e14', 0, 196, LW, 44);
        for (let i = 0; i < 10; i++) rose(g, 8 + i * 34, 196 + (i % 2) * 6, 7, '#d8303a');
      },
      decor(g, t) { lighter(g, () => glow(g, 160, 30, 50, '#fff0d0', 0.12 + 0.05 * Math.sin(t))); },
      life(g, t) { petals(g, t, 26, 31, '#ff5a6a', 0, LW, -10, LH, 0.5); }
    },
    ratio: {
      title: 'Аудитория Гильдии', aura: 'imag',
      frags: [
        ['Гордыня и падение', 'Восемь документальных фильмов и десяток мемуаров. Ни один не убедителен.'],
        ['Божественное в деталях', 'Профессор Ронд хранит рекомендательное письмо в Высшую академию истины.'],
        ['Познай самого себя', 'Высшая ученическая степень. Такого не было две янтарные эры.'],
        ['Незнание - порок', 'Нус ни разу не взглянула в его сторону. Это обсуждают до сих пор.'],
        ['Так идут к звёздам', 'Он прячет лицо под гипсовой головой. Лицо на удивление красиво.'],
        ['Правда побеждает всё', '«Когда со мной соглашаются, у меня чувство, что я ошибаюсь».']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#0e0a1a'], [1, '#2a2040']]);
        rect(g, '#2a2034', 0, 190, LW, 50); rect(g, '#4a3a5a', 0, 190, LW, 2);
        chalkboard(g, 150, 24, 150, 90, 1, 0);
        plasterBust(g, 60, 200, 1.6);
      },
      decor(g, t) { lighter(g, () => glow(g, 225, 70, 60, '#f0f0e0', 0.08 + 0.04 * Math.sin(t))); },
      life(g, t) { const k = (t * 0.25) % 1; g.strokeStyle = rgba('#ffd860', 0.7); g.lineWidth = 1.5; g.beginPath(); g.moveTo(170, 150); g.lineTo(lerp(170, 260, k), lerp(150, 120, k)); g.stroke(); g.lineWidth = 1; }
    }
  };

  const grad = (c, x, y, w, h, stops) => { const gr = c.createLinearGradient(0, y, 0, y + h); stops.forEach(([k, col]) => gr.addColorStop(k, col)); c.fillStyle = gr; c.fillRect(x, y, w, h); };
  const radial = (c, x, y, r, col) => { const gr = c.createRadialGradient(x, y, 2, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); };
  const dots = (c, n, seed, x, y, w, h, col, t, drift) => { for (let i = 0; i < n; i++) { const ph = (t * (drift || 0.04) + G.hash(i, seed, 3)) % 1; c.fillStyle = col; c.fillRect(Math.round(x + G.hash(i, seed, 1) * w), Math.round(y + ((G.hash(i, seed, 2) + ph) % 1) * h), 2, 2); } };
  const scaled = (c, bx, by, bw, bh, fn) => { c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip(); c.translate(bx, by); c.scale(bw / LW, bh / LH); fn(c); c.restore(); };

  const BACKDROPS = {
    jingyuan(c, bx, by, bw, bh, mx, my, t) {
      scaled(c, bx, by, bw, bh, g => { luofuNight(g, t, 190); vgrad(g, 190, LH, [[0, '#2a1a3a'], [1, '#120a1c']]); lordGiant(g, (mx - bx) * LW / bw + 50, 230, 1.2, 0.35 + 0.05 * Math.sin(t * 2), t); });
      if (Math.floor(t * 1.5) % 6 === 0) { c.strokeStyle = 'rgba(220,200,255,0.6)'; c.lineWidth = 2; c.beginPath(); let x = mx + 120, y = by; c.moveTo(x, y); for (let i = 0; i < 6; i++) { x += (G.hash(i, Math.floor(t), 5) - 0.5) * 40; y += 30; c.lineTo(x, y); } c.stroke(); c.lineWidth = 1; }
    },
    luocha(c, bx, by, bw, bh, mx, my, t) {
      const ox = bw > 640 ? 44 : 0;
      scaled(c, bx, by, bw, bh, g => { vgrad(g, 0, LH, [[0, '#04100e'], [0.6, '#0e2a24'], [1, '#1a3a30']]); K.stars(g, t, 50, 97, 0.5, 120); irisField(g, t, 170, 70, 0.9); F.coffin(g, (mx - bx) * LW / bw + 80, 214, 70, 130); });
      radial(c, mx + 130, my - 50, 70, 'rgba(240,210,110,0.3)');
      dots(c, 20, 41, bx + 240 + ox, by, bw - 240 - ox, bh, 'rgba(248,232,160,0.7)', t, 0.05);
    },
    imbibitor(c, bx, by, bw, bh, mx, my, t) {
      scaled(c, bx, by, bw, bh, g => { vgrad(g, 0, LH, [[0, '#020a12'], [0.5, '#0a2a36'], [1, '#0e4a52']]); bigMoon(g, (mx - bx) * LW / bw + 70, 50, 26, 0.7); for (let i = 0; i < 10; i++) { const y = 170 + i * 7; line(g, rgba('#7ae8e0', 0.12 + 0.05 * Math.sin(t * 2 + i)), 1, 0, y, LW, y + Math.sin(t + i) * 2); } waterDragon(g, 120, 210, 330, 60, 1, 0.35, t, 50); });
    },
    fuxuan(c, bx, by, bw, bh, mx, my, t) {
      scaled(c, bx, by, bw, bh, g => { vgrad(g, 0, LH, [[0, '#08041a'], [0.6, '#1e0e3a'], [1, '#3a1a50']]); K.stars(g, t, 100, 99, 0.9); divRing(g, (mx - bx) * LW / bw, 100, 96, t * 0.6, 0.55); thirdEye(g, (mx - bx) * LW / bw, 22, 1.6, 0.7 + 0.3 * Math.sin(t), 0.8); });
    },
    jingliu(c, bx, by, bw, bh, mx, my, t) {
      scaled(c, bx, by, bw, bh, g => { vgrad(g, 0, LH, [[0, '#02040e'], [0.6, '#0a1430'], [1, '#1a2a50']]); bigMoon(g, (mx - bx) * LW / bw, 90, 64, 0.85); vgrad(g, 196, LH, [[0, '#a8c8ec'], [1, '#5a7aa8']]); K.snowfall(g, t, 40, 25, { speed: 16, wind: 5, a: 0.7 }); });
    },
    topaz(c, bx, by, bw, bh, mx, my, t) {
      const ox = bw > 640 ? 44 : 0, nBld = Math.ceil((bw - 240 - ox) / 30);
      grad(c, bx, by, bw, bh, [[0, '#2a1006'], [0.6, '#8a4a10'], [1, '#e8a040']]);
      radial(c, mx + 60, my + 40, 140, 'rgba(255,190,80,0.45)');
      for (let i = 0; i < nBld; i++) { const x = bx + 240 + ox + i * 30, h = 70 + G.hash(i, 3, 7) * 120; c.fillStyle = '#3a1a08'; c.fillRect(x, by + bh - h, 24, h); for (let k = 0; k < 8; k++) { c.fillStyle = (i + k) % 3 ? '#5a3010' : '#ffd890'; c.fillRect(x + 4, by + bh - h + 8 + k * 14, 16, 4); } }
      for (let i = 0; i < 22; i++) { const ph = (t * 0.25 + G.hash(i, 9, 2)) % 1, x = bx + 250 + ox + G.hash(i, 9, 3) * (bw - 250 - ox), y = by + ph * bh; c.fillStyle = '#8a5a10'; c.beginPath(); c.ellipse(x, y + 1, 4, 3.5, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ffd060'; c.beginPath(); c.ellipse(x, y, 4, 3.5, 0, 0, Math.PI * 2); c.fill(); }
    },
    huohuo(c, bx, by, bw, bh, mx, my, t) {
      scaled(c, bx, by, bw, bh, g => { vgrad(g, 0, LH, [[0, '#06140e'], [0.6, '#123a2a'], [1, '#2a5a40']]); for (let i = 0; i < 9; i++) F.lanternR(g, 18 + i * 36, 14, 0.9, t, i, i % 3 !== 1); for (let i = 0; i < 6; i++) talisman(g, 150 + i * 28, 60 + Math.sin(t * 1.5 + i) * 8 + (i % 2) * 30, Math.sin(t + i) * 0.3, 0.7, 1.2); tailSpirit(g, (mx - bx) * LW / bw + 70, 236, 1.4, t, 0.55); });
    },
    argenti(c, bx, by, bw, bh, mx, my, t) {
      scaled(c, bx, by, bw, bh, g => { gardenSky(g, LH); lighter(g, () => poly(g, 'rgba(255,240,208,0.16)', [(mx - bx) * LW / bw - 20, 0, (mx - bx) * LW / bw + 20, 0, (mx - bx) * LW / bw + 80, LH, (mx - bx) * LW / bw - 80, LH])); for (let i = 0; i < 12; i++) rose(g, 130 + i * 16, 226 + (i % 2) * 5, 6, '#d8303a'); petals(g, t, 40, 33, '#ff5a6a', 120, LW, -10, LH, 0.5); });
    },
    ratio(c, bx, by, bw, bh, mx, my, t) {
      scaled(c, bx, by, bw, bh, g => { vgrad(g, 0, LH, [[0, '#0e0a1a'], [1, '#2a2040']]); chalkboard(g, 128, 20, 70, 80, 1, t); plasterBust(g, 300, 236, 1.8); });
      c.strokeStyle = 'rgba(255,216,96,0.35)'; c.lineWidth = 1.5;
      const k = (t * 0.2) % 1; c.beginPath(); c.moveTo(mx + 70, my + 120); c.lineTo(mx + 70 + 80 * k, my + 40); c.lineTo(mx + 150, my + 120); c.closePath(); c.stroke(); c.lineWidth = 1;
    }
  };

  const look = id => G.lookOf(id, null);
  const CONE_ART = {
    beforedawn(b) {
      b.sky(['#0a0618', '#2a1640', '#6a3a5a']);
      b.stars(30, 3, 0, 60);
      b.rect('#2a1a24', 0, 104, 100, 36);
      b.rect('#5a3a24', 40, 98, 50, 6);
      b.figure(look('jingyuan'), 46, 78, 100);
      b.poly('#d8b048', [70, 54, 74, 52, 76, 56, 72, 58]);
      b.glow(72, 55, 8, 'rgba(255,220,140,0.5)');
    },
    coffin(b) {
      b.sky(['#04100e', '#0e2a24', '#1a3a30']);
      for (let i = 0; i < 18; i++) { const x = (i * 37) % 100, y = 100 + (i * 13) % 38; b.ell('#f4f4f8', x, y, 2.4, 3); }
      b.poly('#1a1418', [60, 30, 86, 30, 92, 48, 84, 120, 62, 120, 54, 48]);
      b.rect('#c8a050', 72, 36, 2, 80);
      b.figure(look('luocha'), 34, 76, 110);
      b.glow(73, 22, 16, 'rgba(240,210,110,0.5)');
    },
    brighter(b) {
      b.sky(['#020406', '#0a141a', '#0e2a30']);
      b.poly('rgba(220,240,255,0.18)', [40, 0, 60, 0, 80, 140, 20, 140]);
      for (let i = 0; i < 5; i++) b.rect('#1a2a2a', 4 + i * 20, 0, 3, 140);
      b.figure(look('imbibitor'), 50, 74, 112);
    },
    shuteyes(b) {
      b.sky(['#08041a', '#1e0e3a', '#3a1a50']);
      b.stars(50, 5, 0, 140);
      b.ring('rgba(200,170,255,0.5)', 50, 50, 34, 34, 0.8);
      b.ring('rgba(240,200,255,0.4)', 50, 50, 24, 24, 0.6);
      b.figure(look('fuxuan'), 50, 82, 104, {});
    },
    ownsword(b) {
      b.sky(['#02040e', '#0a1430', '#1a2a50']);
      b.ell('#e8f0ff', 64, 36, 22, 22);
      b.glow(64, 36, 36, 'rgba(200,220,255,0.4)');
      b.rect('#a8c8ec', 0, 110, 100, 30);
      b.line('#c8d8f0', [20, 120, 34, 104], 1.2); b.line('#c8d8f0', [30, 124, 38, 112], 0.8);
      b.figure(look('jingliu'), 44, 76, 112);
    },
    blissful(b) {
      b.sky(['#3a2010', '#8a5a2a', '#e8b070']);
      b.rect('#5a3a20', 0, 100, 100, 40);
      b.figure(look('topaz'), 50, 92, 90, { rot: -1.3 });
      for (let i = 0; i < 4; i++) { b.ell('#e8b030', 22 + i * 18, 106 - (i % 2) * 6, 7, 6); b.ell('#fff0a0', 20 + i * 18, 104 - (i % 2) * 6, 2.5, 2); b.ell('#141418', 24 + i * 18, 104 - (i % 2) * 6, 1, 1); }
    },
    fright(b) {
      b.sky(['#06140e', '#123a2a', '#2a5a40']);
      b.rect('#3a2a1a', 60, 10, 34, 120); b.rect('#5a4028', 64, 14, 26, 112);
      b.glow(40, 90, 22, 'rgba(90,255,176,0.5)');
      b.figure(look('huohuo'), 40, 80, 96);
    },
    gaze(b) {
      b.sky(['#1a0a20', '#5a1a30', '#c8604a']);
      b.poly('rgba(255,240,208,0.2)', [40, 0, 60, 0, 90, 140, 10, 140]);
      for (let i = 0; i < 6; i++) b.ell('#d8303a', 8 + i * 17, 126, 5, 4);
      b.figure(look('argenti'), 50, 78, 108);
      b.glow(50, 14, 20, 'rgba(255,240,220,0.5)');
    },
    baptism(b) {
      b.sky(['#e8e0d0', '#c8d8e0', '#8ab0c8']);
      b.ell('#f4f4f8', 50, 108, 44, 14);
      b.ell('#8ac8e8', 50, 104, 38, 9);
      b.bust(look('ratio'), 46, 92, 40);
      b.ell('#efebe4', 82, 40, 8, 9);
      b.rect('#d8d4cc', 76, 48, 12, 6);
      for (let i = 0; i < 5; i++) b.ell('rgba(255,255,255,0.7)', 20 + i * 14, 98 - (i % 2) * 4, 2, 2);
    }
  };

  Object.assign(H.Ults.SHOWS, ULTS);
  Object.assign(H.Fusions.SHOWS, FUS);
  Object.assign(WI.SHOWS, WARP);
  Object.assign(E.SCENES, EID);
  Object.assign(G.CONE_SCENES, CONE_ART);
  H.FivesScenes = { ULTS, FUS, WARP, EID, BACKDROPS, CONE_ART, intro5, luofuNight, lordGiant, waterDragon, divRing, thirdEye, bigMoon, iceBloom, coin, chart, tailSpirit, talisman, rose, petals, plasterBust, chalkboard, irisField };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
