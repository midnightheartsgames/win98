(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit, U = H.Ults, A = U.Art, BURST = U.BURST, TEAM_FX = U.TEAM_FX;
  const { W, HGT, C } = H.UI_CONST;
  const { LW, LH, BAR, cl, lerp, sm, eOut, eIn, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash, vignette } = K;
  const IN = 0.9, HIT = 0.85, TEAM = 0.75, FADE = 0.3;
  const FLOOR = LH - BAR;
  const SEAM = [200, 120];
  const buf = { cv: null };

  const fig = (S, m, x, y, o) => S.fig(m.look, x, y, Object.assign({ k: 2 }, o));

  function clipPoly(g, pts) {
    g.beginPath(); g.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
    g.closePath(); g.clip();
  }

  function duoIn(S, P) {
    const g = S.g, t = S.t, k = eOut(seg(t, 0, 0.36)), meet = seg(t, 0.3, 0.7), push = lerp(1, 1.06, sm(t / S.d));
    const halves = [[0, 0, SEAM[0], 0, SEAM[1], LH, 0, LH], [SEAM[0], 0, LW, 0, LW, LH, SEAM[1], LH]];
    P.m.forEach((m, i) => {
      const dir = i ? 1 : -1, home = i ? 228 : 94, x = lerp(home + dir * 250, home, k);
      g.save();
      clipPoly(g, halves[i]);
      vgrad(g, 0, LH, [[0, G.dark(m.col, 0.72)], [0.7, G.dark(m.col, 0.88)], [1, '#04050c']]);
      for (let j = 0; j < 6; j++) { const off = (((S.T * 280 * -dir) + j * 72) % 432 + 432) % 432 - 60; poly(g, rgba(m.col, 0.06 + 0.05 * (j % 2)), [off, 0, off + 22, 0, off - 90, LH, off - 112, LH]); }
      g.translate(Math.round(x), FLOOR + 12); g.scale(push, push);
      S.bust(m.look, 0, 0, 160, { tint: t < 0.09 ? '#ffffff' : null, flip: !i });
      g.restore();
    });
    lighter(g, () => {
      line(g, rgba('#ffffff', 0.55 + 0.45 * (1 - meet)), 2, SEAM[0], 0, SEAM[1], LH);
      if (t > 0.3) { glow(g, 160, 120, 30 + meet * 90, '#ffffff', 0.9 * (1 - meet)); ring(g, rgba('#ffffff', 1 - meet), 2, 160, 120, 8 + meet * 150); }
    });
    if (t > 0.3) K.sparks(g, S.T, 160, 120, 18, 5, '#fff0d0', 70);
    G.elemIcon(g, P.m[0].elem, 22, BAR + 18, 10);
    G.elemIcon(g, P.m[1].elem, LW - 22, BAR + 18, 10);
    vignette(g, 0.35);
  }

  function quadIn(S, P) {
    const g = S.g, t = S.t, n = P.m.length, k = eOut(seg(t, 0, 0.4)), meet = seg(t, 0.32, 0.72), wd = LW / n;
    P.m.forEach((m, i) => {
      const x0 = i * wd, pts = [x0 + 18, 0, x0 + wd + 18, 0, x0 + wd - 18, LH, x0 - 18, LH], dir = i % 2 ? 1 : -1;
      g.save();
      clipPoly(g, pts);
      vgrad(g, 0, LH, [[0, G.dark(m.col, 0.7)], [0.7, G.dark(m.col, 0.88)], [1, '#04050c']]);
      for (let j = 0; j < 4; j++) { const off = (((S.T * 220 * dir) + j * 60) % 240 + 240) % 240 - 60; rect(g, rgba(m.col, 0.06 + 0.04 * (j % 2)), Math.round(x0), Math.round(off), Math.round(wd), 18); }
      const y = lerp(FLOOR + 12 + dir * 170, FLOOR + 12, cl(k * 1.15 - i * 0.05));
      S.bust(m.look, x0 + wd / 2, y, 118, { tint: t < 0.09 ? '#ffffff' : null, flip: i < n / 2 });
      g.restore();
      lighter(g, () => line(g, rgba('#ffffff', 0.5 + 0.5 * (1 - meet)), 2, x0 + 18, 0, x0 - 18, LH));
      G.elemIcon(g, m.elem, x0 + wd / 2, BAR + 16, 8);
    });
    lighter(g, () => { if (t > 0.32) { glow(g, 160, 120, 30 + meet * 110, '#ffffff', 0.9 * (1 - meet)); ring(g, rgba('#ffffff', 1 - meet), 2, 160, 120, 8 + meet * 170); } });
    if (t > 0.32) K.sparks(g, S.T, 160, 120, 22, 9, '#fff0d0', 90);
    vignette(g, 0.35);
  }

  function heartFx(g, x, y, s, a) {
    ell(g, rgba('#ff7ab8', a), x - s * 0.5, y, s * 0.6, s * 0.6);
    ell(g, rgba('#ff7ab8', a), x + s * 0.5, y, s * 0.6, s * 0.6);
    poly(g, rgba('#ff7ab8', a), [x - s * 1.05, y + s * 0.2, x + s * 1.05, y + s * 0.2, x, y + s * 1.3]);
  }

  function circles(g, T, x, y, n, k, a) {
    for (let i = 0; i < n; i++) {
      const kk = eOut(cl((k - i * 0.16) / 0.4)), rx = (36 + i * 10) * kk, ry = (9 + i * 2.4) * kk, cy = y - i * 15, rot = T * (i % 2 ? -1.6 : 1.6);
      if (kk <= 0) continue;
      lighter(g, () => {
        g.strokeStyle = rgba(i % 2 ? '#ff6a5a' : '#ffb070', a * kk); g.lineWidth = 1;
        g.beginPath(); g.ellipse(x, cy, rx, ry, 0, 0, Math.PI * 2); g.stroke();
        g.beginPath(); g.ellipse(x, cy, rx * 0.76, ry * 0.76, 0, 0, Math.PI * 2); g.stroke();
        for (let j = 0; j < 10; j++) { const q = rot + j / 10 * Math.PI * 2; g.beginPath(); g.moveTo(x + Math.cos(q) * rx * 0.76, cy + Math.sin(q) * ry * 0.76); g.lineTo(x + Math.cos(q) * rx, cy + Math.sin(q) * ry); g.stroke(); }
      });
    }
  }

  function blast(g, T, x, y, k) {
    const r = 18 + 130 * eOut(k);
    lighter(g, () => { glow(g, x, y, r * 1.4, '#ff6a20', 0.9 * (1 - k * 0.6)); glow(g, x, y, r * 0.55, '#fff4d0', 1 - k); ring(g, rgba('#ffd8a0', 1 - k), 3, x, y, r); });
    for (let i = 0; i < 6; i++) ell(g, rgba(i % 2 ? '#5a3a2a' : '#8a5a3a', 0.55 * (1 - k * 0.8)), x + (hx(i, 3, 41) - 0.5) * r * 1.2, y - r * 0.3 - k * 60 * hx(i, 4, 41), r * 0.4 * (0.6 + hx(i, 5, 41)), r * 0.3);
    K.sparks(g, T, x, y, 22, 13, '#ffb050', 130);
  }

  function hitDuo(S, P) {
    const g = S.g, t = S.t, fo = P.foes, c = U.Stage.foeCenter(P), one = fo.length === 1;
    const z = lerp(one ? 2.1 : 1.6, one ? 1.75 : 1.3, eOut(t / S.d));
    g.save();
    S.shake(t, t < 0.45 ? 3.5 * (1 - t / 0.45) : 0);
    S.cam(lerp(c.x, 160, 0.2), c.y - 2, z, () => {
      U.Stage.backdrop(S, P);
      fo.forEach((f, i) => {
        const lt = t - 0.08 - i * 0.05, fl = lt > 0 ? Math.max(0, 1 - lt * 2.5) : 0, jit = lt > 0 && lt < 0.4 ? Math.sin(lt * 70) * 2 : 0;
        G.drawEnemy(g, f.u.data, f.x + jit, f.y, f.s, { t: S.T, flash: fl });
      });
      fo.forEach((f, i) => P.elems.forEach((el, j) => {
        const lt = t - 0.08 - i * 0.05 - j * 0.17;
        if (lt > 0) (BURST[el] || BURST.phys)(g, f.x, f.y - f.s * 0.45, f.s * (j ? 0.85 : 1), lt, i + j * 3);
      }));
    });
    g.restore();
    if (t < 0.22) flash(g, P.m[0].col, 0.45 * (1 - t / 0.22));
    if (t > 0.17 && t < 0.37) flash(g, P.m[1].col, 0.35 * (1 - (t - 0.17) / 0.2));
    vignette(g, 0.45);
  }

  function teamDuo(S, P, kind) {
    const g = S.g, t = S.t, list = P.allies, n = list.length;
    U.Stage.backdrop(S, P, 0.5, U.TEAM_TINT[kind]);
    S.cam(160, 150, lerp(1.14, 1, eOut(t / S.d)), () => {
      list.forEach((a, i) => {
        const x = 160 + (i - (n - 1) / 2) * 64, y = 214, lt = t - 0.05 - i * 0.07, mem = P.m.find(m => m.u === a.u);
        lighter(g, () => glow(g, x, y - 46, 40, mem ? mem.col : '#ffffff', mem ? 0.35 : 0.12));
        S.fig(a.look, x, y, { k: 1 });
        if (lt > 0) TEAM_FX[kind](g, x, y, lt, i, S.T);
      });
    });
    if (t < 0.2) flash(g, P.m[1].col, 0.4 * (1 - t / 0.2));
    vignette(g, 0.45);
  }

  function guitar(g, x, y, rot, flip) {
    g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.rotate(rot);
    ell(g, '#2a50d0', 0, 0, 15, 11); ell(g, '#2a50d0', -11, 0, 11, 9); rect(g, '#1a1a22', 4, -2, 50, 4); rect(g, '#d8d8e0', 52, -3, 8, 6);
    for (let s = 0; s < 3; s++) rect(g, 'rgba(255,255,255,0.7)', -10, -1 + s, 64, 1);
    g.restore();
  }

  function newspaper(g, x, y, rot, s, a) {
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    rect(g, rgba('#e8e2d0', a), -14, -10, 28, 20); rect(g, rgba('#1a1a22', a), -12, -8, 24, 3);
    for (let i = 0; i < 4; i++) rect(g, rgba('#5a5a64', a), -12 + (i % 2) * 13, -3 + Math.floor(i / 2) * 5, 11, 2);
    g.restore();
  }

  function banner(g, x, top, T, k) {
    rect(g, '#5a4a30', x - 1, top, 3, FLOOR - top);
    ell(g, '#d8b050', x, top - 2, 3, 3);
    for (let j = 0; j < 7; j++) {
      const x0 = x + 2 + j * 11, x1 = x0 + 11, o0 = Math.sin(j * 0.7 - T * 6) * 4 * j / 7, o1 = Math.sin((j + 1) * 0.7 - T * 6) * 4 * (j + 1) / 7, y0 = top + 4;
      poly(g, rgba(j % 2 ? '#e8ecf4' : '#f4f6fa', k), [x0, y0 + o0, x1, y0 + o1, x1, y0 + 64 + o1, x0, y0 + 64 + o0]);
      poly(g, rgba('#3a72d8', k), [x0, y0 + 24 + o0, x1, y0 + 24 + o1, x1, y0 + 40 + o1, x0, y0 + 40 + o0]);
      poly(g, rgba('#d8b050', k), [x0, y0 + 61 + o0, x1, y0 + 61 + o1, x1, y0 + 64 + o1, x0, y0 + 64 + o0]);
    }
  }

  function viewfinder(g, T) {
    const L = 24, T0 = BAR + 10, B0 = FLOOR - 10, R0 = LW - 24;
    for (const [x, y, sx, sy] of [[L, T0, 1, 1], [R0, T0, -1, 1], [L, B0, 1, -1], [R0, B0, -1, -1]]) { rect(g, '#ffffff', x, y, 18 * sx, 1); rect(g, '#ffffff', x, y, 1, 18 * sy); }
    if (Math.floor(T * 4) % 2) ell(g, '#ff4040', L + 10, T0 + 12, 3, 3);
  }

  const SHOWS = {
    f_express: {
      lines: [[0, 'Дань Хэн, рельсы готовы!'], [1, 'Тогда отправляемся.']], swap: 0.8, d: 1.7,
      sfx: [[0.1, 'glint'], [0.45, 'glint'], [0.8, 'whoosh'], [1.32, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, [Ma, Dh] = P.m, lay = eOut(seg(t, 0.1, 0.75)), dash = eIn(seg(t, 0.8, 1.3)), ry = 196;
        S.bg('space', S.T, { drift: 50 });
        K.expressSide(g, lerp(-40, 440, t / S.d), 84, 0.7, S.T, { cars: 3 });
        K.hStreaks(g, S.T, 16, 4, -300, '#c8e8ff', 0.3, BAR, FLOOR);
        const rx = 40 + (LW - 20) * lay;
        lighter(g, () => { line(g, rgba('#bfefff', 0.85), 2, 40, ry, rx, ry); line(g, rgba('#bfefff', 0.6), 1, 40, ry + 7, rx, ry + 7); glow(g, rx, ry, 16, '#8adfff', 0.8 * (1 - seg(t, 0.75, 0.9))); });
        for (let i = 0; 52 + i * 18 < rx; i++) A.crystal(g, 52 + i * 18, ry + 10, 8 + hx(i, 1, 7) * 6, -Math.PI / 2 + (hx(i, 2, 7) - 0.5) * 0.7, 0.85);
        fig(S, Ma, 70, 262);
        if (t < 0.8) fig(S, Dh, 160, 262);
        else {
          const hxp = lerp(160, 420, dash);
          lighter(g, () => {
            for (let j = 0; j < 4; j++) { g.strokeStyle = rgba('#7affc0', 0.55 - j * 0.1); g.lineWidth = 3 - j * 0.5; g.beginPath(); g.ellipse(hxp - 40 - j * 34, 150, 30 + j * 6, 10 + j * 3, 0, S.T * 10 + j, S.T * 10 + j + 4); g.stroke(); }
            g.lineWidth = 1;
            line(g, rgba('#c8fff0', 0.7), 6, 160, 150, hxp, 150);
          });
          fig(S, Dh, hxp, 262, { a: 1 - seg(t, 1.1, 1.3) });
          K.hStreaks(g, S.T, 24, 9, -700, '#c8fff0', 0.6, BAR, FLOOR);
        }
        if (t > 1.32) flash(g, '#d8fff0', 0.55 * (1 - seg(t, 1.32, 1.7)));
      }
    },
    f_photo: {
      lines: [[1, 'Все в кадр! Улыбаемся!'], [0, 'Сначала бита, потом улыбка.']], swap: 0.8, d: 1.75, team: 'shield',
      sfx: [[0.1, 'select'], [0.52, 'swing'], [0.9, 'shutter'], [1.25, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, [Tr, Ma] = P.m, snap = 0.9;
        if (t < snap) {
          const sw = eOut(seg(t, 0.4, 0.62));
          U.Stage.backdrop(S, P, 0.35, '#06223a');
          fig(S, Tr, 100, 262, { rot: lerp(-0.12, 0.16, sw) });
          if (t > 0.4 && t < 0.8) { const a = 1 - seg(t, 0.62, 0.8); lighter(g, () => { g.lineWidth = 8; g.strokeStyle = rgba('#ffe7a0', a * 0.5); g.beginPath(); g.arc(110, 150, 66, -2.4, lerp(-2.4, 0.3, sw)); g.stroke(); g.lineWidth = 1; }); }
          fig(S, Ma, 234, 262, { flip: true });
          rect(g, '#1a1a22', 196, 140, 20, 13); rect(g, '#d8d8e0', 196, 140, 20, 2); ell(g, '#3a5a8a', 200, 147, 4, 4); ell(g, '#c8e8ff', 199, 146, 1.5, 1.5);
          viewfinder(g, S.T);
          const k = 1 - eOut(t / 0.7), hw = 60 + k * 70, hh = 52 + k * 50, cx = 166, cy = 130;
          for (const [x, y, sx, sy] of [[cx - hw, cy - hh, 1, 1], [cx + hw, cy - hh, -1, 1], [cx - hw, cy + hh, 1, -1], [cx + hw, cy + hh, -1, -1]]) { rect(g, '#9affb0', Math.round(x), Math.round(y), 8 * sx, 1); rect(g, '#9affb0', Math.round(x), Math.round(y), 1, 8 * sy); }
          return;
        }
        const k = t - snap, dev = 1 - seg(k, 0.05, 0.4), frost = eOut(seg(k, 0.3, 0.8));
        vgrad(g, 0, LH, [[0, '#06101e'], [1, '#14304a']]);
        g.save(); g.translate(160, 124); g.rotate(-0.07 + 0.03 * eOut(seg(k, 0, 0.3)));
        rect(g, 'rgba(0,0,0,0.4)', -84, -70, 176, 150);
        rect(g, '#f4f0e6', -88, -74, 176, 150);
        g.save(); g.beginPath(); g.rect(-80, -66, 160, 112); g.clip();
        vgrad(g, -66, 46, [[0, '#2a4a7a'], [1, '#9ab8d8']], -80, 160);
        A.star5(g, 50, -40, 7, 0.3, '#fff2b0');
        S.fig(Tr.look, -32, 60, { k: 1, rot: 0.12 });
        S.fig(Ma.look, 30, 60, { k: 1, flip: true });
        if (dev > 0) rect(g, rgba('#ffffff', dev), -80, -66, 160, 112);
        g.restore();
        for (let i = 0; i < 3; i++) rect(g, '#8a8a9a', -60 + i * 44, 56, 30 - i * 6, 1);
        rect(g, '#d84a8a', 54, 54, 6, 6);
        for (const [x, y, r] of [[-88, -74, 0.6], [88, -74, 2.4], [-88, 76, -0.6], [88, 76, -2.4]]) for (let j = 0; j < 4; j++) A.crystal(g, x, y, (10 + j * 4) * frost, r + (j - 1.5) * 0.35, 0.9 * frost);
        g.restore();
        K.snowfall(g, S.T, 40, 6, { speed: 40, wind: 30 });
        if (k < 0.12) flash(g, '#ffffff', 1 - k / 0.12);
      }
    },
    f_singularity: {
      lines: [[1, 'Химико, я держу их.'], [0, 'Тогда добавим огня.']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'tech'], [0.4, 'rumble'], [0.9, 'warp'], [1.25, 'crit'], [1.3, 'rumble']],
      act(S, P) {
        const g = S.g, t = S.t, [Hi, We] = P.m, k = eOut(seg(t, 0.15, 0.8)), beam = eOut(seg(t, 0.9, 1.05)), boom = seg(t, 1.25, 1.8), x = 186, y = 84, r = lerp(2, 26, k) * (1 + boom * 0.4);
        S.bg('space', S.T, { planet: { x: 160, y: 360, r: 190, kind: 'jarilo' } });
        fig(S, We, 74, 262);
        line(g, '#2a2a32', 3, 96, 176, 128, 70);
        lighter(g, () => glow(g, 128, 70, 12, '#ffd850', 0.7 + 0.3 * Math.sin(S.T * 12)));
        fig(S, Hi, 262, 262, { flip: true });
        const hot = seg(t, 1.0, 1.3);
        lighter(g, () => {
          for (let i = 0; i < 40; i++) {
            const ph = (S.T * 0.7 + hx(i, 1, 41)) % 1, a = hx(i, 2, 41) * Math.PI * 2 + ph * 4, rr = r + (1 - ph) * 120;
            rect(g, rgba(i % 3 ? (hot > 0.5 ? '#ffb060' : '#c8a0ff') : '#ffe880', ph * k), Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.6), 2, 1);
          }
          glow(g, x, y, r * 3, hot > 0 ? '#ff7a20' : '#8a3aff', 0.5 * k);
          g.save(); g.translate(x, y); g.rotate(-0.25);
          for (let j = 0; j < 3; j++) { g.strokeStyle = rgba(hot > 0 ? (j ? '#ffd070' : '#fff0d0') : (j ? '#ffd890' : '#ffffff'), 0.8 * k); g.lineWidth = 3 - j; g.beginPath(); g.ellipse(0, 0, r * (2 + j * 0.3), r * (0.45 + j * 0.06), 0, S.T * 2 + j, S.T * 2 + j + 5.4); g.stroke(); }
          g.restore(); g.lineWidth = 1;
        });
        ell(g, '#000000', x, y, r * (1 - boom), r * (1 - boom));
        ring(g, rgba(hot > 0 ? '#ffb060' : '#ffffff', 0.7 * k), 1, x, y, r + 1);
        if (t > 0.9 && t < 1.4) { const w = lerp(2, 14, beam) * (1 - seg(t, 1.25, 1.4)); lighter(g, () => { rect(g, rgba('#ff8a30', 0.7), x - w, 0, w * 2, y); rect(g, '#fff0d0', x - w * 0.35, 0, w * 0.7, y); glow(g, x, y, 40, '#ffb060', 0.8 * beam); }); }
        if (boom > 0) {
          lighter(g, () => { ring(g, rgba('#ffd070', 1 - boom), 3, x, y, 20 + boom * 160); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line(g, rgba('#ffe880', 1 - boom), 1, x + Math.cos(a) * 20, y + Math.sin(a) * 20, x + Math.cos(a) * (40 + boom * 150), y + Math.sin(a) * (40 + boom * 150)); } });
          K.embers(g, S.T, 50, 11, 0, LW, FLOOR, '#ffd070');
          if (boom < 0.25) flash(g, '#fff0d0', 0.6 * (1 - boom / 0.25));
        }
      }
    },
    f_landau: {
      lines: [[1, 'Братишка, подыграешь?'], [0, 'Только в этот раз, сестра.']], swap: 0.8, d: 1.75, team: 'shield',
      sfx: [[0.1, 'strum'], [0.35, 'break'], [0.4, 'rumble'], [0.75, 'crit'], [1.05, 'crit'], [1.35, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, [Ge, Se] = P.m, punch = 0.35, k = eOut(seg(t, punch, punch + 0.4)), beats = [0.75, 1.05, 1.35];
        g.save();
        S.shake(t, t > punch && t < punch + 0.25 ? 3 : 0);
        S.bg('snow', S.T, {});
        rect(g, 'rgba(10,6,30,0.5)', 0, 0, LW, LH);
        const pulse = beats.reduce((a, b) => Math.max(a, t > b ? 1 - cl((t - b) / 0.22) : 0), 0);
        K.hexShield(g, 160, 118, 96 * k, 0.75 * k, S.T, pulse > 0 ? '#d8b0ff' : '#9ae0ff');
        const tips = [];
        for (let i = 0; i < 12; i++) {
          const x = i * 28 - 6, h = (56 + hx(i, 1, 51) * 70) * k, lit = pulse * (i % 3 === 0 ? 1 : 0.4);
          poly(g, rgba('#bfefff', 0.9), [x, FLOOR, x + 14, FLOOR - h, x + 28, FLOOR]);
          poly(g, rgba(lit > 0.2 ? '#e8c8ff' : '#ffffff', 0.7), [x + 10, FLOOR, x + 14, FLOOR - h, x + 16, FLOOR]);
          tips.push([x + 14, FLOOR - h]);
        }
        fig(S, Ge, 96, 262 + (t > punch ? 6 : 0));
        fig(S, Se, 232, 262, { flip: true });
        guitar(g, 214, 182, -0.55, true);
        g.restore();
        beats.forEach((b, i) => {
          if (t < b || t > b + 0.22) return;
          const tip = tips[(i * 5 + 2) % tips.length];
          A.bolt(g, 166, 156, tip[0], tip[1], Math.floor(S.T * 30) + i, Se.col, 2);
          lighter(g, () => { glow(g, tip[0], tip[1], 26, '#c07aff', 1 - (t - b) / 0.22); ring(g, rgba('#e0b0ff', 1 - (t - b) / 0.22), 2, 160, 118, 40 + (t - b) * 300); });
          flash(g, '#c07aff', 0.15 * (1 - (t - b) / 0.22));
        });
        K.snowfall(g, S.T, 70, 3, { speed: 60, wind: 40 });
        if (t > punch && t < punch + 0.18) flash(g, '#ffffff', 0.6 * (1 - (t - punch) / 0.18));
      }
    },
    f_wings: {
      lines: [[1, 'Броня, не отставай!'], [0, 'Как в детстве. Я за тобой.']], swap: 0.75, d: 1.75,
      sfx: [[0.1, 'confirm'], [0.32, 'crit'], [0.5, 'whoosh'], [0.95, 'swing'], [1.1, 'swing'], [1.25, 'swing'], [1.4, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, [Br, Se] = P.m, shot = 0.32;
        S.bg('under', S.T, { kind: 'town' });
        rect(g, 'rgba(16,6,36,0.55)', 0, 0, LW, LH);
        for (let i = 0; i < 26; i++) {
          const ph = S.T * 0.5 + hx(i, 1, 61) * 6, sw = seg(t, 0.45, 0.9), x = lerp(226, 160 + Math.cos(ph * 1.3 + i) * 150 * hx(i, 2, 61), sw), y = lerp(150, 120 + Math.sin(ph * 1.7 + i) * 70, sw);
          if (t > 0.45) A.butterfly(g, x, y, 3 + hx(i, 3, 61) * 3, S.T * 14 + i, i % 3 ? '#9a7aff' : '#d8c8ff', 0.85);
        }
        fig(S, Br, 86, 262);
        line(g, '#3a3a48', 3, 104, 150, 156, 140); rect(g, '#d8b050', 120, 146, 8, 3);
        if (t > shot && t < shot + 0.4) {
          const k = seg(t, shot, shot + 0.4), bx = lerp(156, 360, eIn(k));
          lighter(g, () => { glow(g, 158, 140, 16, '#7affc0', 1 - k); for (let j = 0; j < 3; j++) { g.strokeStyle = rgba('#7affc0', 0.8 - j * 0.2); g.lineWidth = 2; g.beginPath(); g.ellipse(bx - j * 22, 140, 10 + j * 4, 6 + j * 2, 0, S.T * 12 + j, S.T * 12 + j + 4); g.stroke(); } g.lineWidth = 1; line(g, rgba('#c8fff0', 0.6), 2, 156, 140, bx, 140); });
        }
        fig(S, Se, 226, 262, { a: 1 - seg(t, 0.45, 0.6) });
        K.glitch(g, S.T, 180, 70, 100, 140, seg(t, 0.35, 0.6) * (1 - seg(t, 0.6, 0.8)) * 0.9, 3);
        [[0.95, 20, BAR + 20, 300, FLOOR - 30], [1.1, 300, BAR + 10, 40, FLOOR - 10], [1.25, 0, 130, LW, 100]].forEach(([at, x0, y0, x1, y1]) => {
          if (t < at || t > at + 0.22) return;
          const a = 1 - (t - at) / 0.22, k = eOut(cl((t - at) / 0.06));
          lighter(g, () => { line(g, rgba('#8a7aff', a * 0.7), 7, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); line(g, rgba('#ffffff', a), 2, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); });
        });
        if (t > 1.4) {
          const a = 1 - seg(t, 1.4, 1.75);
          lighter(g, () => { line(g, rgba('#ffffff', a), 3, 70, BAR + 10, 270, FLOOR - 10); line(g, rgba('#ffffff', a), 3, 270, BAR + 10, 70, FLOOR - 10); glow(g, 170, 120, 90, '#8a7aff', a); glow(g, 170, 120, 40, '#7affc0', a * 0.6); });
        }
      }
    },
    f_underworld: {
      lines: [[1, 'Наташа, смотри, как Хук умеет!'], [0, 'Умница. Только не обожгись.']], swap: 0.75, d: 1.6, team: 'heal',
      sfx: [[0.1, 'confirm'], [0.4, 'steam'], [0.8, 'whoosh'], [1.1, 'break'], [1.2, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, [Na, Ho] = P.m, grow = eOut(seg(t, 0.15, 0.7)), toss = eIn(seg(t, 0.8, 1.1)), cure = eOut(seg(t, 1.1, 1.6));
        S.bg('under', S.T, { kind: 'town' });
        rect(g, 'rgba(20,8,0,0.35)', 0, 0, LW, LH);
        lighter(g, () => { glow(g, 92, 130, 70 + cure * 120, '#60ff90', 0.25 + 0.3 * cure); rect(g, rgba('#9affb8', 0.3), 130, 70, 14, 48); rect(g, rgba('#9affb8', 0.3), 113, 87, 48, 14); });
        fig(S, Na, 84, 262);
        fig(S, Ho, 236, 262);
        if (t < 1.1) {
          const fx = lerp(244, 360, toss), fy = lerp(64, -40, toss) + Math.sin(S.T * 9) * 2 * (1 - toss), r = 6 + grow * 18;
          lighter(g, () => { glow(g, fx, fy, r * 1.8, '#ff8a30', 0.9); glow(g, fx, fy, r * 0.6, '#fff0c0', 1); if (toss > 0) line(g, rgba('#ff7a20', 0.6), r, fx, fy, lerp(fx, 244, 0.3), lerp(fy, 64, 0.3)); });
          K.embers(g, S.T, 20, 13, fx - r, fx + r, fy + r, '#ffd070');
        } else {
          const k = seg(t, 1.1, 1.5);
          lighter(g, () => { glow(g, LW, 60, 120 * eOut(k), '#ff7a20', 0.9 * (1 - k)); ring(g, rgba('#ffd070', 1 - k), 3, LW - 10, 60, 20 + k * 120); });
          if (k < 0.25) flash(g, '#ffd0a0', 0.5 * (1 - k / 0.25));
        }
        for (let i = 0; i < 16; i++) { const ph = (S.T * 0.6 + hx(i, 1, 41)) % 1, x = Math.round(hx(i, 2, 41) * LW), y = Math.round(FLOOR - ph * 180), a = (1 - ph) * cure; rect(g, rgba('#c0ffd0', a), x - 3, y, 7, 1); rect(g, rgba('#c0ffd0', a), x, y - 3, 1, 7); }
        K.embers(g, S.T, 24, 7, 0, LW, FLOOR, '#ffb060');
      }
    },
    f_station: {
      lines: [[1, 'Станция готова, госпожа Герта!'], [0, 'Знаю. Это же моя станция.']], swap: 0.8, d: 1.75, team: 'speed',
      sfx: [[0.12, 'glint'], [0.35, 'glint'], [0.6, 'tech'], [1.1, 'break'], [1.2, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, [He, As] = P.m, ringK = eOut(seg(t, 0.5, 0.9)), out = eIn(seg(t, 1.1, 1.45));
        S.bg('space', S.T, { drift: 12, station: { x: 164, y: 92, s: 0.8 } });
        const pts = [[34, 52], [62, 40], [92, 56], [118, 46], [130, 76]];
        pts.forEach((p, i) => {
          const k = eOut(cl((t - 0.08 - i * 0.08) / 0.14));
          if (k <= 0) return;
          if (i) { const q = pts[i - 1]; lighter(g, () => line(g, rgba('#ffe0a0', 0.7), 1, q[0], q[1], lerp(q[0], p[0], k), lerp(q[1], p[1], k))); }
          lighter(g, () => glow(g, p[0], p[1], 10 * k, '#ffd070', 0.8));
          A.star5(g, p[0], p[1], 3 * k, S.T, '#fff4d0');
        });
        for (let i = 0; i < 12; i++) {
          const a = i / 12 * Math.PI * 2 + S.T * 3, rx = 90 + out * 240, ry = 26 + out * 90, x = 164 + Math.cos(a) * rx, y = 92 + Math.sin(a) * ry;
          A.crystal(g, x, y, 11, a + Math.PI / 2, 0.95 * ringK);
          if (out > 0) lighter(g, () => glow(g, x, y, 8, '#ff9a40', 0.6 * (1 - out)));
        }
        fig(S, As, 70, 262);
        fig(S, He, 254, 262, { flip: true });
        if (t > 1.2) {
          lighter(g, () => { for (let i = 0; i < 7; i++) { const ph = cl((t - 1.2 - i * 0.04) / 0.3), x = 320 - ph * 300, y = BAR + 14 + i * 22; if (ph > 0 && ph < 1) line(g, rgba(i % 2 ? '#ffb070' : '#c8f0ff', 1 - ph), 1, x, y, x + 40, y); } });
          flash(g, '#c8f0ff', 0.35 * (1 - seg(t, 1.1, 1.5)));
        }
      }
    },
    f_guards: {
      lines: [[1, 'Арлан, на тебя вся надежда.'], [0, 'Пост принят.']], swap: 0.75, d: 1.6, team: 'buff',
      sfx: [[0.1, 'confirm'], [0.3, 'buff'], [0.55, 'rumble'], [1.1, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, [Ar, As] = P.m, slam = 1.1, dn = eIn(seg(t, slam - 0.12, slam)), gold = eOut(seg(t, 0.2, 0.55));
        S.bg('station', S.T, { kind: 'hall' });
        rect(g, 'rgba(10,6,24,0.5)', 0, 0, LW, LH);
        lighter(g, () => { g.strokeStyle = rgba('#ffd060', 0.8 * gold); g.lineWidth = 2; g.beginPath(); g.ellipse(110, 206, 70 * gold, 12 * gold, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; glow(g, 110, 160, 60, '#ffd060', 0.25 * gold); });
        for (let j = 0; j < 4; j++) { const ph = (S.T * 1.1 + j / 4) % 1, px = 80 + j * 20, py = 170 - ph * 90; poly(g, rgba('#ffe080', (1 - ph) * gold), [px, py - 5, px + 4, py, px + 1.5, py, px + 1.5, py + 5, px - 1.5, py + 5, px - 1.5, py, px - 4, py]); }
        fig(S, As, 248, 262, { flip: true });
        lighter(g, () => glow(g, 222, 110, 14, '#ffd070', 0.5 + 0.4 * Math.sin(S.T * 10)));
        fig(S, Ar, 104, 262 + (t > slam ? 6 : 0));
        const ang = lerp(-1.35, 0.3, dn), px = 132, py = 210, L = 170, tx = px + Math.cos(ang) * L, ty = py + Math.sin(ang) * L;
        line(g, '#b8b8c4', 3, px, py, tx, ty);
        poly(g, '#e8e8f0', [tx, ty, tx + Math.cos(ang + 1.9) * 24, ty + Math.sin(ang + 1.9) * 24, tx + Math.cos(ang + 2.6) * 16, ty + Math.sin(ang + 2.6) * 16]);
        if (t < slam) {
          if (t > 0.55 && t < 0.8) A.bolt(g, 222, 110, tx, ty, Math.floor(S.T * 30), '#ffd070', 2);
          K.sparks(g, S.T * 2, tx, ty, 12, 6, '#e0b0ff', 22);
          lighter(g, () => glow(g, tx, ty, 16 + seg(t, 0.5, slam) * 22, Ar.col, 0.7));
        } else {
          const k = seg(t, slam, slam + 0.4);
          for (let i = 0; i < 6; i++) A.bolt(g, 300, FLOOR - 20, 300 + Math.cos(Math.PI + (i - 2.5) * 0.4) * 160 * eOut(k), FLOOR - 20 + Math.sin(Math.PI + (i - 2.5) * 0.4) * 50 * eOut(k), i * 5 + Math.floor(S.T * 20), Ar.col, 1);
          flash(g, '#e0c0ff', 0.5 * (1 - k));
        }
      }
    },
    f_rumor: {
      lines: [[1, 'По данным разведки, защита у них слабая.'], [0, 'Вот это заголовок для утренних газет!']], swap: 0.75, d: 1.6,
      sfx: [[0.1, 'select'], [0.3, 'select'], [0.5, 'select'], [0.8, 'whoosh'], [1.15, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, [Sa, Pe] = P.m, c = U.Stage.foeCenter(P), toss = seg(t, 0.75, 1.15), blast = seg(t, 1.15, 1.6);
        U.Stage.backdrop(S, P, 0.25, '#001020'); U.Stage.foes(S, P);
        lighter(g, () => { for (let x = 0; x < LW; x += 20) rect(g, 'rgba(74,162,234,0.1)', x, 0, 1, LH); for (let y = 0; y < LH; y += 20) rect(g, 'rgba(74,162,234,0.1)', 0, y, LW, 1); });
        P.foes.forEach((f, i) => {
          const k = eOut(cl((t - 0.2 - i * 0.12) / 0.2));
          if (k <= 0) return;
          const hw = f.s * (0.35 + (1 - k) * 0.4), cy = f.y - f.s * 0.45, hh = f.s * (0.42 + (1 - k) * 0.4);
          for (const [x, y, sx, sy] of [[f.x - hw, cy - hh, 1, 1], [f.x + hw, cy - hh, -1, 1], [f.x - hw, cy + hh, 1, -1], [f.x + hw, cy + hh, -1, -1]]) { rect(g, '#ff6a6a', Math.round(x), Math.round(y), 6 * sx, 1); rect(g, '#ff6a6a', Math.round(x), Math.round(y), 1, 6 * sy); }
          ell(g, '#ff6a6a', f.x + hw + 6, cy - hh + 4, 2, 2);
        });
        fig(S, Sa, 64, 262);
        for (let i = 0; i < 9; i++) {
          const lt = cl((toss - i * 0.06) / 0.6);
          if (lt <= 0) continue;
          const tx = c.x + (hx(i, 1, 5) - 0.5) * 120, ty = c.y + (hx(i, 2, 5) - 0.5) * 60, k = eOut(lt);
          newspaper(g, lerp(100, tx, k) + Math.sin(lt * 9 + i) * 8 * (1 - lt), lerp(130, ty, k) - Math.sin(Math.PI * lt) * 40, S.T * 6 + i, 1 - blast * 0.4, 1 - blast);
        }
        if (blast > 0) lighter(g, () => { for (let j = 0; j < 3; j++) { g.strokeStyle = rgba('#7affc0', 1 - blast); g.lineWidth = 2; g.beginPath(); g.ellipse(c.x, c.y, 20 + blast * 110 + j * 10, 8 + blast * 36 + j * 4, 0, S.T * 8 + j, S.T * 8 + j + 4); g.stroke(); } g.lineWidth = 1; glow(g, c.x, c.y, 80, '#5fe0a8', 1 - blast); });
        rect(g, '#0a1a2a', LW - 82, FLOOR - 74, 68, 68); rect(g, '#4aa2ea', LW - 82, FLOOR - 74, 68, 1); rect(g, '#4aa2ea', LW - 82, FLOOR - 7, 68, 1);
        g.save(); g.beginPath(); g.rect(LW - 80, FLOOR - 72, 64, 64); g.clip(); S.bust(Pe.look, LW - 48, FLOOR - 6, 64, { flip: true }); g.restore();
        if (blast > 0 && blast < 0.25) flash(g, '#ffffff', 0.5 * (1 - blast / 0.25));
      }
    },
    f_qlipoth: {
      lines: [[1, 'Ради Белобога. Ради всех.'], [0, 'Стена выстоит. Мы выстоим.']], swap: 0.8, d: 1.8, team: 'shield',
      sfx: [[0.1, 'shield'], [0.45, 'rumble'], [1.15, 'whoosh'], [1.35, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, [Tp, Br] = P.m, rise = eOut(seg(t, 0, 0.6)), throwK = eIn(seg(t, 1.15, 1.4));
        S.bg('void', S.T, { amber: rise });
        banner(g, 34, 46, S.T, rise);
        fig(S, Br, 82, 262);
        fig(S, Tp, 182, lerp(292, 262, rise));
        if (t < 1.15) {
          line(g, '#d8b060', 3, 226, 230, 234, 46);
          poly(g, '#fff0c0', [234, 30, 242, 52, 228, 50]);
          lighter(g, () => glow(g, 235, 44, 24, '#ff9a30', 0.6 + 0.3 * Math.sin(S.T * 20)));
          K.embers(g, S.T, 26, 7, 214, 240, 120, '#ffb040');
        } else {
          const sx = lerp(234, 380, throwK), sy = lerp(46, 230, throwK), ang = Math.atan2(184, 146);
          lighter(g, () => { line(g, rgba('#ff9a30', 0.8), 6, sx, sy, sx - Math.cos(ang) * 110, sy - Math.sin(ang) * 110); line(g, '#fff0c0', 2, sx, sy, sx - Math.cos(ang) * 55, sy - Math.sin(ang) * 55); glow(g, sx, sy, 30, '#ffb040', 0.9); });
        }
        K.embers(g, S.T, 40, 9, 0, LW, FLOOR, '#ffb050');
        if (t > 1.38) flash(g, '#ffa040', 0.6 * (1 - seg(t, 1.38, 1.8)));
      }
    },
    f_luofu: {
      lines: [[1, 'Яньцин, только без ран, ладно?'], [0, 'Ни царапины, обещаю!']], swap: 0.8, d: 1.75, team: 'heal',
      sfx: [[0.1, 'whoosh'], [0.35, 'glint'], [0.7, 'glint'], [1.05, 'whoosh'], [1.3, 'crit'], [1.35, 'heal']],
      act(S, P) {
        const g = S.g, t = S.t, [Ya, Ba] = P.m, rise = eOut(seg(t, 0.2, 0.75)), aim = sm(seg(t, 0.75, 1.0)), fly = eIn(seg(t, 1.05, 1.35)), rain = seg(t, 1.25, 1.75);
        vgrad(g, 0, LH, [[0, '#0c1a2e'], [1, '#4a7aa8']]);
        for (let i = 0; i < 6; i++) ell(g, 'rgba(210,235,255,0.12)', ((i * 70 + S.T * 20) % 400) - 40, BAR + 18 + (i % 3) * 22, 60, 12);
        K.snowfall(g, S.T, 40, 6, { speed: 30, wind: 20 });
        const by = 262 - 14 - Math.sin(S.T * 3) * 4;
        lighter(g, () => { for (let r = 0; r < 3; r++) { g.strokeStyle = rgba('#7af0e0', 0.5); g.lineWidth = 2; g.beginPath(); g.ellipse(86, 196, 50 + r * 16, 12 + r * 5, -0.1, S.T * 4 + r, S.T * 4 + r + 3.4); g.stroke(); } g.lineWidth = 1; });
        fig(S, Ba, 84, by);
        fig(S, Ya, 214, 262);
        for (let i = 0; i < 9; i++) {
          const a0 = -Math.PI / 2 + (i - 4) * 0.3, rot = lerp(a0, -0.12 + (i - 4) * 0.05, aim);
          const bx = 226 + Math.cos(a0) * 70 * rise, by2 = 140 + Math.sin(a0) * 70 * rise;
          A.sword(g, bx + Math.cos(rot) * fly * 300, by2 + Math.sin(rot) * fly * 300, rot, 28, rise);
        }
        if (rain > 0) for (let i = 0; i < 50; i++) { const ph = (S.T * 1.4 + hx(i, 1, 91)) % 1, x = hx(i, 2, 91) * LW, y = BAR + ph * (FLOOR - BAR); rect(g, rgba('#9af8e8', 0.7 * cl(rain * 4)), Math.round(x), Math.round(y), 1, 5); }
        if (t > 1.3) flash(g, '#c8f0ff', 0.4 * (1 - seg(t, 1.3, 1.6)));
      }
    },
    f_kids: {
      lines: [[1, 'Хук и Клара, вперёд!'], [0, 'Сварог, они с нами. Помоги!']], swap: 0.8, d: 1.8,
      sfx: [[0.1, 'confirm'], [0.4, 'rumble'], [0.85, 'steam'], [1.2, 'break'], [1.28, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, [Cl, Ho] = P.m, rise = eOut(seg(t, 0.2, 0.9)), hand = eIn(seg(t, 0.95, 1.2)), hit = seg(t, 1.2, 1.8);
        g.save();
        S.shake(t, t > 1.2 && t < 1.45 ? 3 : 0);
        U.Stage.backdrop(S, P, 0.62, '#0a0614');
        A.svarog(g, 164, lerp(LH + 220, FLOOR + 40, rise), 1, S.T, seg(t, 0.7, 0.95));
        fig(S, Cl, 84, 262);
        fig(S, Ho, 246, 262);
        lighter(g, () => glow(g, 262, 92, 10 + 6 * Math.sin(S.T * 9), '#ff8a30', 0.8));
        A.svarogHand(g, lerp(380, 172, hand), lerp(-70, 146, hand), 0.75);
        g.restore();
        if (hit > 0) {
          lighter(g, () => { glow(g, 172, 200, 130 * eOut(hit), '#ff7a20', 0.9 * (1 - hit)); ring(g, rgba('#ffd070', 1 - hit), 3, 172, 200, 20 + hit * 140); });
          K.sparks(g, S.T, 172, 200, 24, 9, '#ffb050', 90);
          for (let i = 0; i < 4; i++) { const x = 60 + i * 66, y = 70 + (i % 2) * 30, a = cl(hit * 3) * (1 - seg(hit, 0.7, 1)); ring(g, rgba('#ff4a8a', a), 1, x, y, 7); rect(g, rgba('#ff4a8a', a), x - 10, y, 20, 1); rect(g, rgba('#ff4a8a', a), x, y - 10, 1, 20); }
          if (hit < 0.2) flash(g, '#ffd0a0', 0.6 * (1 - hit / 0.2));
        }
      }
    },
    f_section6: {
      lines: [[1, 'Командир, цель в зоне.'], [0, 'Вижу. Один удар.']], swap: 0.8, d: 1.8,
      sfx: [[0.1, 'confirm'], [0.35, 'glint'], [0.6, 'break'], [0.95, 'swing'], [1.05, 'swing'], [1.25, 'crit'], [1.3, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, [Mi, Ya] = P.m, ringK = eOut(seg(t, 0.2, 0.6)), cut = seg(t, 0.9, 1.15), burst = seg(t, 1.25, 1.8);
        vgrad(g, 0, LH, [[0, '#08081c'], [0.6, '#221640'], [1, '#3a4a6a']]);
        K.snowfall(g, t > 0.9 && t < 1.25 ? 0.9 : S.T, 40, 4, { speed: 22, wind: -10 });
        poly(g, '#d8e4f2', [0, FLOOR - 20, LW, FLOOR - 30, LW, LH, 0, LH]);
        lighter(g, () => { ring(g, rgba('#c8b0ff', 0.8 * ringK), 2, 170, 130, 80 * ringK); ring(g, rgba('#6a4aa8', 0.6 * ringK), 1, 170, 130, 72 * ringK); });
        fig(S, Ya, 248, 262, { flip: true });
        fig(S, Mi, 78, 262, { a: t < 0.95 ? 1 : 1 - seg(t, 0.95, 1.05) });
        if (t > 0.55 && t < 1.0) for (let j = 0; j < 2; j++) A.bolt(g, 150 + j * 40, BAR, 160 + j * 20, 160, Math.floor(S.T * 22) + j * 9, '#c07aff', 2);
        [[0.95, 20, 150, 310, 110], [1.05, 20, 100, 310, 150]].forEach(([at, x0, y0, x1, y1]) => {
          if (t < at || t > at + 0.3) return;
          const a = 1 - (t - at) / 0.3, k = eOut(cl((t - at) / 0.06));
          lighter(g, () => { line(g, rgba('#8adfff', a * 0.7), 8, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); line(g, rgba('#ffffff', a), 2, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); });
        });
        if (cut > 0 && cut < 1) for (let j = 0; j < 6; j++) A.crystal(g, 120 + j * 22, 128 + (hx(j, 3, 91) - 0.5) * 30, 12 + hx(j, 4, 91) * 10, -Math.PI / 2 + (hx(j, 5, 91) - 0.5), 0.9 * cut);
        if (burst > 0) {
          lighter(g, () => { glow(g, 170, 130, 140 * eOut(burst), '#ff78d8', 0.8 * (1 - burst)); ring(g, rgba('#ffd0f4', 1 - burst), 3, 170, 130, 20 + burst * 150); ring(g, rgba('#8adfff', 1 - burst), 2, 170, 130, 10 + burst * 110); });
          K.sparks(g, S.T, 170, 130, 20, 13, '#ffb0e8', 100);
          if (burst < 0.2) flash(g, '#fff0fa', 0.6 * (1 - burst / 0.2));
        }
      }
    },
    f_elio: {
      lines: [[1, 'Защита взломана. Твой ход, Кафка.'], [0, 'Всё по сценарию. Спасибо, Волк.']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'select'], [0.3, 'select'], [0.5, 'select'], [0.9, 'glint'], [1.1, 'break'], [1.3, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Ka, Wo] = P.m, grid = eOut(seg(t, 0, 0.5)), strike = seg(t, 1.05, 1.8);
        vgrad(g, 0, LH, [[0, '#04041a'], [0.6, '#160a36'], [1, '#2a0a2a']]);
        for (let i = -10; i <= 10; i++) line(g, rgba('#7a8aff', 0.3 * grid), 1, 160 + i * 6, 140, 160 + i * 46, LH);
        for (let i = 0; i < 6; i++) { const k = ((i + (T * 0.8) % 1) / 6), y = 140 + (LH - 140) * k * k; line(g, rgba('#c08aff', (0.12 + 0.35 * k) * grid), 1, 0, y, LW, y); }
        A.web(g, 160, 70, 56 * eOut(seg(t, 0.4, 1.0)), cl((t - 0.3) * 3) * (1 - strike), T * 0.3);
        [[118, 40, 1], [160, 30, 2], [202, 44, 3]].forEach(([x, y, n], i) => A.hackWin(g, x - 30, y, 60, 26, 'УЯЗВИМОСТЬ', '#ffd040', seg(t, 0.2 + i * 0.15, 0.35 + i * 0.15) * (1 - strike), n, T));
        fig(S, Wo, 70, 262, {});
        fig(S, Ka, 250, 262, { flip: true });
        lighter(g, () => { glow(g, 92, 140, 18, '#7a6af0', 0.6); glow(g, 228, 128, 18, '#e070ff', 0.4 + 0.4 * seg(t, 0.8, 1.0)); });
        if (t > 0.8 && t < 1.15) for (let i = 0; i < 5; i++) lighter(g, () => line(g, rgba('#f4d8ff', 0.7), 1, 228, 128, 110 + i * 24, 60 + (i % 2) * 20));
        if (t > 1.05) {
          for (let j = 0; j < 5; j++) A.bolt(g, 90 + j * 36, BAR, 100 + j * 30 + Math.sin(T * 30 + j) * 5, FLOOR - 24, Math.floor(T * 24) + j * 7, '#c07aff', 3);
          lighter(g, () => { glow(g, 160, 120, 150, '#c07aff', 0.8 * (1 - strike)); ring(g, rgba('#ffd040', 1 - strike), 2, 160, 120, 20 + strike * 160); });
          if (t < 1.2) flash(g, '#f4e8ff', 0.6 * (1 - seg(t, 1.05, 1.2)));
        }
      }
    },
    f_mara: {
      lines: [[0, 'Блэйд, послушай меня.'], [1, 'Слышу. Не мешай.']], swap: 0.8, d: 1.8,
      sfx: [[0.1, 'glint'], [0.45, 'heal'], [0.95, 'swing'], [1.05, 'swing'], [1.25, 'crit'], [1.35, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Ka, Bl] = P.m, calm = eOut(seg(t, 0.3, 0.85)), cut = seg(t, 0.95, 1.8);
        vgrad(g, 0, LH, [[0, '#0a0206'], [0.5, calm > 0.5 ? '#2a0a24' : '#3a0a10'], [1, '#5a1418']]);
        lighter(g, () => glow(g, 230, 66, 64, calm > 0.5 ? '#c86aff' : '#ff4a32', 0.45));
        ell(g, '#c8322a', 230, 66, 28, 28); ell(g, rgba('#9a4ad8', calm * 0.6), 230, 66, 28, 28);
        poly(g, '#14060a', [0, FLOOR - 22, 90, FLOOR - 30, 200, FLOOR - 24, LW, FLOOR - 32, LW, LH, 0, LH]);
        fig(S, Bl, 152, 262, { tint: t < 0.3 ? '#ff3a2a' : null, ta: 0.35 });
        fig(S, Ka, 70, 262, { a: t < 0.95 ? 1 : 1 - seg(t, 0.95, 1.1) });
        if (t < 0.95) {
          for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2 + T * 2, r = 36 - calm * 20; rect(g, rgba(calm > 0.5 ? '#e0b8ff' : '#ff5a3a', 0.8), Math.round(154 + Math.cos(a) * r), Math.round(90 + Math.sin(a) * r * 0.6), 2, 2); }
          lighter(g, () => { glow(g, 152, 90, 30, '#ff3a2a', 0.5 * (1 - calm)); glow(g, 152, 90, 26, '#c86aff', 0.5 * calm); for (let i = 0; i < 4; i++) line(g, rgba('#f4d8ff', 0.6 * calm), 1, 86, 96, 144 + i * 4, 82 + i * 3); });
        }
        A.crackBlade(g, 172, 170 - calm * 50, -1.0 - calm * 0.4, 92, 1, 0.3 + 0.7 * calm);
        if (t > 0.95) {
          const a = 1 - seg(t, 1.4, 1.8);
          [[0.95, 30, BAR + 10, 300, FLOOR - 10], [1.05, 300, BAR + 10, 30, FLOOR - 10]].forEach(([at, x0, y0, x1, y1]) => {
            if (t < at) return;
            const k = eOut(cl((t - at) / 0.07));
            lighter(g, () => { line(g, rgba('#ff3a2a', 0.7 * a), 10, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); line(g, rgba('#ffe0d0', a), 2, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k)); });
          });
          if (t > 1.2) for (let i = 0; i < 10; i++) { const q = i / 10 * Math.PI * 2 + T, r = 30 + eOut(seg(t, 1.2, 1.6)) * 70; A.crackBlade(g, 170 + Math.cos(q) * r, 120 + Math.sin(q) * r * 0.6, q, 26, a, a); }
          if (t < 1.12) flash(g, '#ffd8d0', 0.5 * (1 - seg(t, 0.95, 1.12)));
        }
      }
    },
    f_trap: {
      lines: [[1, 'Казума, я всё залью!'], [0, 'Отлично. Заморозка!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'splash'], [0.45, 'splash'], [0.9, 'whoosh'], [1.15, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, [Kz, Aq] = P.m, pour = seg(t, 0.15, 0.85), frost = seg(t, 0.9, 1.8);
        vgrad(g, 0, LH, [[0, '#04101e'], [0.6, '#0a2440'], [1, '#081420']]);
        K.snowfall(g, S.T, 30, 7, { speed: 40, wind: 20, a: 0.5 });
        const h = (FLOOR - BAR) * cl(pour * 1.5);
        for (let i = 0; i < 10; i++) {
          const x = 140 + i * 15 + Math.sin(S.T * 5 + i) * 3;
          rect(g, rgba(frost > 0 ? '#dff6ff' : '#4a9ae8', 0.5 * (1 - frost * 0.3)), Math.round(x), BAR, 11, Math.round(h));
          rect(g, rgba('#bfe8ff', 0.4), Math.round(x + 2), BAR, 2, Math.round(h));
        }
        if (frost > 0) {
          for (let i = 0; i < 16; i++) { const x0 = 132 + i * 10, len = (20 + hx(i, 4, 63) * 34) * eOut(frost); poly(g, rgba('#effcff', 0.9), [x0 - 3, FLOOR - 4, x0, FLOOR - 4 - len, x0 + 3, FLOOR - 4]); }
          lighter(g, () => { line(g, rgba('#c8ffd8', 0.8 * (1 - frost)), 2, 70, 150, 200, 150); glow(g, 200, 150, 40 * frost, '#e8fbff', 0.7 * (1 - frost)); });
          if (frost < 0.15) flash(g, '#ffffff', 0.7 * (1 - frost / 0.15));
        }
        fig(S, Aq, 108, 262, {});
        fig(S, Kz, 52, 262, {});
      }
    },
    f_onme: {
      lines: [[1, 'Мегумин, бей прямо в меня!'], [0, 'С удовольствием! Взрыв!']], swap: 0.8, d: 1.8,
      sfx: [[0.1, 'glint'], [0.4, 'tech'], [0.95, 'rumble'], [1.1, 'break'], [1.18, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, [Me, Da] = P.m, cast = seg(t, 0.1, 0.9), beam = seg(t, 0.9, 1.05), bl = seg(t, 1.05, 1.8);
        vgrad(g, 0, LH, [[0, '#14060c'], [0.55, '#3a1418'], [1, '#1a0a0a']]);
        K.stars(g, S.T, 30, 4, 0.5, 110);
        circles(g, S.T, 222, 110, 3, cast, 0.9 * (1 - bl));
        if (beam > 0 && bl < 0.4) lighter(g, () => { rect(g, rgba('#fff4e0', 0.9), 218, BAR, 8, 150); glow(g, 222, 180, 30, '#ffffff', 0.8); });
        fig(S, Da, 222, 262, { v: bl > 0 ? { blush: true } : null });
        if (bl > 0) {
          blast(g, S.T, 222, 196, bl);
          for (let i = 0; i < 6; i++) { const ph = (S.T * 0.8 + i / 6) % 1; heartFx(g, 222 + (hx(i, 2, 88) - 0.5) * 60, 160 - ph * 60, 3, (1 - ph) * cl(bl * 3)); }
          if (bl < 0.15) flash(g, '#fff0e0', 0.9 * (1 - bl / 0.15));
        }
        fig(S, Me, 70, 262, {});
      }
    },
    f_blessing: {
      lines: [[3, 'Держу их! Все удары мне!'], [1, 'Благословение богини!'], [0, 'Мегумин, держи ману!'], [2, 'Чернее черноты… Взрыв!']], swaps: [0.7, 1.35, 2.0], d: 2.8, team: 'heal',
      sfx: [[0.1, 'shield'], [0.75, 'buff'], [1.4, 'glint'], [2.05, 'tech'], [2.35, 'rumble'], [2.42, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, [Kz, Aq, Me, Da] = P.m, hold = seg(t, 0, 0.7), bless = seg(t, 0.7, 1.35), feed = seg(t, 1.35, 2.0), bl = seg(t, 2.25, 2.8);
        vgrad(g, 0, LH, [[0, '#0a0614'], [0.6, '#2a1418'], [1, '#140a0a']]);
        K.stars(g, S.T, 36, 5, 0.5, 110);
        K.hexShield(g, 252, 190, 54 * eOut(hold), 0.6 * cl(hold * 2) * (1 - bl), S.T, '#ff9ac8');
        if (bless > 0) for (let i = 0; i < 4; i++) { const x = 40 + i * 70; lighter(g, () => { glow(g, x, 200, 34, '#ffe8a0', 0.5 * Math.sin(bless * Math.PI)); ring(g, rgba('#ffe8a0', 1 - bless), 1, x, 214, 10 + bless * 20); }); }
        if (feed > 0) lighter(g, () => { const x1 = lerp(46, 116, eOut(feed)); line(g, rgba('#9affb0', 0.8 * (1 - feed * 0.5)), 2, 46, 170, x1, 170); glow(g, x1, 170, 12, '#9affb0', 0.8); });
        if (t > 1.9) circles(g, S.T, 252, 104, 3, seg(t, 1.9, 2.3), 0.9 * (1 - bl));
        if (bl > 0) { blast(g, S.T, 252, 190, bl); if (bl < 0.15) flash(g, '#fff0e0', 0.9 * (1 - bl / 0.15)); }
        fig(S, Da, 252, 262, { v: t > 0.4 ? { blush: true } : null });
        fig(S, Aq, 186, 262, {});
        fig(S, Me, 116, 262, {});
        fig(S, Kz, 46, 262, {});
      }
    },
    f_dissonance: {
      lines: [[0, 'Держи темп.'], [1, 'Темп? Я играю без нот!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'glint'], [0.4, 'whoosh'], [0.8, 'break'], [1.05, 'ult'], [1.28, 'crit']],
      act(S, P) {
        const g = S.g, t = S.t, [Ph, Sc] = P.m, rise = eOut(seg(t, 0.15, 0.7)), burst = seg(t, 1.2, 1.8);
        vgrad(g, 0, LH, [[0, '#12020a'], [0.6, '#2a0a12'], [1, '#2a1006']]);
        const n = 150, hc = G.foeCanvas('hecate', n, Math.floor(S.T * 2.2) % 2);
        lighter(g, () => glow(g, 82, 110, 80, '#ff3a78', 0.4 * rise));
        g.save(); g.globalAlpha = 0.3 + 0.6 * rise; g.imageSmoothingEnabled = false; g.drawImage(hc, Math.round(82 - n / 2), Math.round(FLOOR + 30 - rise * 40 - n), n, n); g.restore();
        for (let j = 0; j < 3; j++) {
          const cx = 128 + j * 34, cy = 104 + (j % 2) * 22, k = eOut(seg(t, 0.35 + j * 0.08, 0.55 + j * 0.08)), b = seg(t, 0.8 + j * 0.1, 1.0 + j * 0.1);
          if (k <= 0 || b >= 1) continue;
          const a = k * (1 - b);
          lighter(g, () => { g.strokeStyle = rgba('#ffa050', 0.85 * a); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, 20 * k, 26 * k, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; glow(g, cx, cy, 24, '#ff7a3a', 0.35 * a); });
          if (b > 0) K.shards(g, b * 1.2, cx, cy, 10, 7 + j, '#ffb060', 30, '#fff0d0');
        }
        fig(S, Ph, 70, 262, {});
        fig(S, Sc, 254, 262, { flip: true });
        if (t > 0.3 && t < 1.25) for (let i = 0; i < 8; i++) {
          const ph = (S.T * 1.4 + i / 8) % 1, x = lerp(96, 170, ph), y = 70 + Math.sin(ph * 6 + i) * 30;
          lighter(g, () => glow(g, x, y, 6, i % 2 ? '#ff3a5a' : '#ffd060', 0.7 * (1 - ph)));
        }
        if (burst > 0) {
          lighter(g, () => { glow(g, 160, 112, 150 * eOut(burst), '#ff6a3a', 0.75 * (1 - burst)); ring(g, rgba('#ffd0dc', 1 - burst), 3, 160, 112, 20 + burst * 160); ring(g, rgba('#ffb060', 1 - burst), 2, 160, 112, 10 + burst * 120); });
          K.sparks(g, S.T, 160, 112, 20, 17, '#ff8a5a', 110);
          if (burst < 0.2) flash(g, '#fff0e8', 0.6 * (1 - burst / 0.2));
        }
      }
    }
  };

  class FusionShow extends U.Show {
    constructor(ui, members, o = {}) {
      super(ui, members[0], o);
      const f = H.FUSIONS[o.id], lookOf = a => G.lookOf(a.charId, this.game);
      const m = members.map(u => { const el = H.ELEMENTS[u.elem] || H.ELEMENTS.phys; return { u, look: lookOf(u), col: el.col, elem: u.elem, name: u.name }; });
      const elems = [...new Set(f.fx.filter(x => x.k === 'dmg').map(x => x.e))];
      this.id = o.id;
      this.def = SHOWS[o.id];
      this.P = {
        u: members[0], id: o.id, m, col: m[0].col, name: f.name, rar: Math.max(...members.map(u => (H.CHARS[u.charId] || {}).rarity || 4)),
        elems: elems.length ? elems : [m[0].elem], foes: o.foes || [], allies: (o.allies || members).map(a => ({ u: a, look: lookOf(a) })), bg: o.bg || 'station'
      };
      this.beats = [{ id: 'in', d: IN, sfx: [[0, 'ult'], [0.3, 'star4']] }, { id: 'act', d: this.def.d, sfx: this.def.sfx }];
      if (this.P.foes.length) this.beats.push({ id: 'hit', d: HIT, sfx: [[0.08, 'crit'], [0.25, 'crit'], [0.4, 'hit']] });
      if (this.def.team) this.beats.push({ id: 'team', d: TEAM, sfx: [[0.06, this.def.team === 'heal' ? 'heal' : this.def.team === 'shield' ? 'shield' : 'buff']] });
    }

    speech() {
      const b = this.beat;
      if (b.id !== 'act') return null;
      const swaps = this.def.swaps || [this.def.swap || b.d / 2];
      let i = 0;
      while (i < swaps.length && this.t >= swaps[i]) i++;
      const [who, text] = this.def.lines[Math.min(i, this.def.lines.length - 1)];
      return { m: this.P.m[who], text, since: this.t - (i ? swaps[i - 1] : 0) };
    }

    render() {
      const cv = buf.cv || (buf.cv = G.mkCanvas(LW, LH)), g = cv.getContext('2d'), b = this.beat;
      g.save();
      g.imageSmoothingEnabled = false;
      const S = H.Cine.stage(g, this.game, this.T);
      S.t = Math.min(this.t, b.d); S.d = b.d;
      if (b.id === 'in') (this.P.m.length > 2 ? quadIn : duoIn)(S, this.P);
      else if (b.id === 'act') this.def.act(S, this.P);
      else if (b.id === 'hit') hitDuo(S, this.P);
      else teamDuo(S, this.P, this.def.team);
      g.restore();
      if (this.i === 0 && this.t < 0.12) flash(g, '#ffffff', 1 - this.t / 0.12);
      else if (this.i > 0 && this.t < 0.08) flash(g, '#ffffff', 0.5 * (1 - this.t / 0.08));
      H.Cine.dither(g);
      return cv;
    }

    draw(c) {
      const ui = this.ui, P = this.P, b = this.beat, t = this.t, cv = this.render(), n = P.m.length;
      c.save();
      c.globalAlpha = this.fade > 0 ? 1 - cl(this.fade / FADE) : 1;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, 0, 0, W, HGT);
      c.fillStyle = '#000000'; c.fillRect(0, 0, W, BAR * 2); c.fillRect(0, HGT - BAR * 2, W, BAR * 2);
      P.m.forEach((m, i) => { c.fillStyle = rgba(m.col, 0.7); c.fillRect(i * W / n, BAR * 2 - 1, W / n, 1); c.fillRect(i * W / n, HGT - BAR * 2, W / n, 1); });
      if (b.id === 'in') {
        const k = eOut(cl((t - 0.12) / 0.3));
        c.globalAlpha *= k;
        const na = P.m.map(m => m.name).join('  +  ');
        ui.text(na, 14, 20, { size: 12, bold: true, col: C.cream });
        for (let i = 0; i < P.rar; i++) ui.diamond(14 + ui.measure(na, 12, true) + 12 + i * 11, 27, 4, P.rar >= 5 ? C.gold : '#c0a0ff');
        ui.text('СЛИЯНИЕ', W / 2, HGT - 54 + (1 - k) * 10, { align: 'center', size: 10, bold: true, col: C.pink });
        ui.text(P.name, W / 2, HGT - 40 + (1 - k) * 10, { align: 'center', size: 20, bold: true, serif: true, col: C.gold });
      } else {
        ui.text(P.name, 14, 22, { size: 11, bold: true, serif: true, col: C.gold });
        const sp = this.speech();
        if (sp && sp.since > 0.08) {
          c.globalAlpha *= cl((sp.since - 0.08) / 0.15);
          ui.text(sp.m.name, W / 2, HGT - BAR * 2 + 10, { align: 'center', size: 11, bold: true, serif: true, col: G.light(sp.m.col, 0.35) });
          ui.text(sp.text, W / 2, HGT - BAR * 2 + 27, { align: 'center', size: 13, col: C.cream });
        }
      }
      c.restore();
      if (!this.fade) {
        ui.hints([['Esc', 'Пропустить']], W - 12, 20, { align: 'right' });
        ui.hit(0, 0, W, HGT, () => this.skip());
      }
    }
  }

  H.Fusions = { SHOWS, Show: FusionShow, MODES: U.MODES };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
