(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit, ST = H.Ults.Stage;
  const { W, HGT, C } = H.UI_CONST;
  const { LW, LH, BAR, cl, lerp, eOut, eIn, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash, vignette } = K;
  const SKILL_FADE = 0.2;
  const buf = { cv: null };
  const FLOOR = LH - BAR;
  const RED = '#c41e2a', DEEP = '#7a1018', EDGE = '#ff9a2a', HOT = '#fff0c8', SUIT = '#1c1a20';
  const SUN = { x: 236, y: 74, r: 22 };

  const unsheathed = look => Object.assign({}, look, { acc: (look.acc || []).filter(a => !a.startsWith('greatsword')) });

  function blade(g, x, y, rot, len, a = 1, heat = 0) {
    if (len <= 0 || a <= 0) return;
    const w = Math.max(3, len * 0.1);
    g.save(); g.translate(x, y); g.rotate(rot);
    if (heat > 0) lighter(g, () => glow(g, len * 0.55, 0, len * 0.62, '#ff6a1a', 0.55 * heat * a));
    poly(g, rgba(SUIT, a), [-len * 0.2, -1.6, 0, -1.6, 0, 1.6, -len * 0.2, 1.6]);
    poly(g, rgba(SUIT, a), [-3, -w, 3, -w, 3, w, -3, w]);
    poly(g, rgba(DEEP, a), [3, -w * 0.55, len * 0.88, -w * 0.4, len, 0, len * 0.88, w * 0.55, 3, w * 0.55]);
    poly(g, rgba(RED, a), [3, -w * 0.55, len * 0.88, -w * 0.4, len, 0, 3, 0]);
    line(g, rgba(EDGE, a), 1.5, 5, w * 0.5, len * 0.9, w * 0.48);
    if (heat > 0) lighter(g, () => line(g, rgba(HOT, heat * a), 1, 5, w * 0.5, len * 0.9, w * 0.48));
    ell(g, rgba(EDGE, a), 0, 0, 1.8, 1.8);
    g.restore();
  }

  function eclipse(g, T, k, burst = 0, at = SUN) {
    const { x, y, r } = at;
    lighter(g, () => {
      glow(g, x, y, r * (2.6 + burst * 4), '#ff6a20', 0.4 + 0.5 * burst);
      glow(g, x, y, r * 1.45, '#ffd8a0', 0.55 + 0.45 * burst);
      for (let i = 0; i < 14; i++) {
        const q = i / 14 * Math.PI * 2 + T * 0.2, len = r * (1.35 + hx(i, 3, 17) * 0.6 + burst * 2.5);
        line(g, rgba('#ffc890', (0.25 + 0.5 * burst) * eOut(k)), 1, x + Math.cos(q) * r * 1.05, y + Math.sin(q) * r * 1.05, x + Math.cos(q) * len, y + Math.sin(q) * len);
      }
    });
    ell(g, '#fff0d0', x, y, r, r);
    ell(g, '#14060a', lerp(x + r * 2.3, x, eOut(k)), y, r * 0.97, r * 0.97);
    if (k >= 1) lighter(g, () => ring(g, rgba('#ffe4b8', 0.7 + 0.3 * burst), 1, x, y, r + 1));
  }

  function sky(g, T, dim = 0) {
    vgrad(g, 0, LH, [[0, '#12030a'], [0.42, '#4a0a12'], [0.7, '#b0301a'], [0.74, '#2a0a0a'], [1, '#14060a']]);
    poly(g, '#1e070a', [0, 168, 18, 150, 26, 156, 44, 138, 52, 150, 70, 146, 84, 160, 110, 154, 124, 166, 150, 160, 176, 168, 206, 150, 214, 158, 236, 144, 246, 154, 270, 152, 290, 162, 306, 148, LW, 156, LW, 178, 0, 178]);
    rect(g, '#14060a', 0, 176, LW, LH - 176);
    lighter(g, () => {
      for (let i = 0; i < 6; i++) {
        const x0 = hx(i, 1, 23) * LW, y0 = 184 + hx(i, 2, 23) * 24, f = 0.35 + 0.3 * Math.sin(T * 6 + i * 2);
        line(g, rgba('#ff5a1a', f), 1, x0, y0, x0 + 14 + hx(i, 3, 23) * 20, y0 + 3);
        line(g, rgba('#ff5a1a', f * 0.7), 1, x0 + 10, y0 + 2, x0 + 16, y0 + 8);
      }
    });
    if (dim) rect(g, rgba('#000000', dim), 0, 0, LW, LH);
  }

  function rails(g, k) {
    const vx = 30, vy = 168;
    line(g, '#4a1e1a', 2, 150, LH, vx + 3, vy);
    line(g, '#4a1e1a', 2, 250, LH, vx + 7, vy);
    for (let i = 0; i < 9; i++) {
      const q = Math.pow(i / 9, 1.6), y = lerp(LH, vy, q), x0 = lerp(140, vx, q), x1 = lerp(262, vx + 10, q);
      line(g, '#2e1210', Math.max(1, 3 * (1 - q)), x0, y, x1, y);
    }
    const tq = 0.55 + 0.4 * k;
    lighter(g, () => {
      for (let i = 0; i < 4; i++) {
        const q = Math.min(0.99, tq + i * 0.025), x = lerp(196, vx + 5, q), y = lerp(LH - 30, vy - 2, q), s = Math.max(1, 3 * (1 - q));
        rect(g, rgba('#ffe090', 0.9), Math.round(x), Math.round(y - s), Math.ceil(s * 1.6), Math.ceil(s));
        glow(g, x, y, 4 + s * 2, '#ffc060', 0.4);
      }
    });
  }

  function slash(g, cx, cy, dir, k, fade, sz = 1) {
    if (k <= 0 || fade <= 0) return;
    const x0 = cx - 74 * dir * sz, y0 = cy - 58 * sz, x1 = cx + 74 * dir * sz, y1 = cy + 48 * sz, mx = cx + 22 * dir * sz, my = cy - 26 * sz, n = 18, upto = eOut(k);
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const q = i / n * upto, a = (1 - q) * (1 - q), b = 2 * q * (1 - q), c = q * q;
      pts.push([a * x0 + b * mx + c * x1, a * y0 + b * my + c * y1]);
    }
    lighter(g, () => {
      g.lineCap = 'round';
      for (const [w, col, al] of [[14, '#ff5a10', 0.45], [7, EDGE, 0.8], [2, HOT, 1]]) {
        g.strokeStyle = rgba(col, al * fade); g.lineWidth = Math.max(1, w * sz); g.beginPath();
        pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.stroke();
      }
      g.lineCap = 'butt'; g.lineWidth = 1;
    });
  }

  function flameWave(g, T, cx, y, k, a) {
    if (k <= 0 || a <= 0) return;
    const half = LW * 0.6 * eOut(k);
    lighter(g, () => {
      rect(g, rgba('#ff5a10', 0.55 * a), cx - half, y - 6, half * 2, 26);
      rect(g, rgba(HOT, 0.8 * a), cx - half, y + 2, half * 2, 6);
      for (let x = -half; x < half; x += 9) {
        const h = 14 + 16 * hx(Math.round(x), 7, 31) + 6 * Math.sin(T * 14 + x * 0.3);
        poly(g, rgba(EDGE, 0.75 * a), [cx + x, y, cx + x + 4.5, y - h, cx + x + 9, y]);
      }
      glow(g, cx, y, half * 0.6, '#ff8a30', 0.6 * a);
    });
  }

  const ULT = {
    line: 'Наш путь здесь не закончится.', side: 'r', d: 1.6,
    sfx: [[0.05, 'tech'], [0.48, 'glint'], [0.86, 'whoosh'], [0.95, 'swing'], [1.1, 'swing'], [1.3, 'crit'], [1.34, 'rumble']],
    act(S, P) {
      const g = S.g, t = S.t, T = S.T, bare = unsheathed(P.look);
      if (t < 0.45) {
        const k = seg(t, 0, 0.45);
        sky(g, T);
        eclipse(g, T, k);
        rails(g, k);
        S.fig(P.look, 118, 216, { k: 2, tint: '#1a0408', ta: lerp(0.35, 0.7, k) });
        lighter(g, () => glow(g, 118, 98, 16, '#ff9a2a', 0.5 + 0.3 * Math.sin(T * 9)));
        K.embers(g, T, 30, 7, 0, LW, FLOOR, '#ffb060');
      } else if (t < 0.85) {
        const k = seg(t, 0.45, 0.85), open = eOut(seg(t, 0.5, 0.78));
        sky(g, T, 0.35);
        eclipse(g, T, 1);
        K.speedLines(g, T, 120, 150, 30, '#ff9a50', 0.35, 80);
        const hx0 = 196, hy0 = 196;
        blade(g, hx0, hy0, lerp(-1.5, -1.08, open), 170, 1, 0.4 + 0.6 * open);
        blade(g, hx0 - 4, hy0, lerp(-1.5, -1.98, open), 170 * open, open, open);
        g.save(); g.translate(120, FLOOR + 14);
        S.bust(bare, 0, 0, 180, { tint: t < 0.5 ? '#ffffff' : null });
        g.restore();
        const beat = 0.5 + 0.5 * Math.sin(k * Math.PI * 6);
        lighter(g, () => { glow(g, 120, FLOOR - 14, 18 + 14 * open, '#ff8a20', 0.6 + 0.4 * beat); glow(g, 120, FLOOR - 14, 5, HOT, 0.9); });
        K.embers(g, T, 40, 9, 0, LW, FLOOR, '#ffc070');
      } else if (t < 1.25) {
        const k = seg(t, 0.85, 1.25), c = ST.foeCenter(P), fly = eOut(seg(t, 0.85, 1.05));
        sky(g, T, 0.2);
        eclipse(g, T, 1);
        ST.foes(S, P, { flash: t > 0.98 ? 0.4 : 0 });
        K.hStreaks(g, T, 26, 5, -520, '#ffb070', 0.45, BAR, FLOOR);
        const x = lerp(30, c.x + 36, fly), y = lerp(250, c.y + 70, fly) - Math.sin(fly * Math.PI) * 40, rot = lerp(-0.35, 0.12, k);
        S.fig(bare, x, y, { k: 2, s: 0.82, rot });
        const swing = seg(t, 0.92, 1.2);
        blade(g, x + 18, y - 70, lerp(-2.3, 0.9, eOut(swing)), 120, 1, 0.8);
        slash(g, c.x, c.y - 10, 1, seg(t, 0.92, 1.04), 1 - seg(t, 1.14, 1.25) * 0.6);
        slash(g, c.x, c.y - 10, -1, seg(t, 1.06, 1.18), 1);
        K.sparks(g, T, c.x, c.y - 10, 12, 4, '#ffd080', 40);
      } else {
        const c = ST.foeCenter(P), drop = eIn(seg(t, 1.25, 1.32)), hit = seg(t, 1.32, 1.6), burst = eOut(seg(t, 1.34, 1.6));
        g.save();
        S.shake(t, hit > 0 ? 3 * (1 - hit) : 0);
        sky(g, T, 0.15 * (1 - burst));
        eclipse(g, T, 1, burst);
        ST.foes(S, P, { flash: hit > 0 ? 0.6 * (1 - hit) : 0 });
        const fy = lerp(76, c.y + 30, drop);
        if (hit < 0.6) {
          S.fig(bare, c.x - 26, fy + 44, { k: 2, s: 0.82, a: 1 - seg(hit, 0.3, 0.6) });
          blade(g, c.x, fy - 46, Math.PI / 2, 112, 1 - seg(hit, 0.3, 0.6), 1);
        }
        if (hit > 0) {
          const w = lerp(8, 22, eOut(hit));
          lighter(g, () => { rect(g, rgba('#ff6a10', 0.7 * (1 - hit * 0.5)), c.x - w, 0, w * 2, LH); rect(g, rgba(HOT, 0.9 * (1 - hit * 0.6)), c.x - w * 0.35, 0, w * 0.7, LH); });
          flameWave(g, T, c.x, c.y + 18, seg(t, 1.32, 1.5), 1 - seg(t, 1.5, 1.6) * 0.5);
        }
        K.embers(g, T, 70, 11, 0, LW, FLOOR, '#ffd070');
        g.restore();
        if (t >= 1.32 && t < 1.42) flash(g, '#ffffff', 1 - seg(t, 1.32, 1.42));
      }
      vignette(g, 0.4);
    }
  };

  function mainFoe(P) {
    if (!P.foes.length) return { x: 210, y: 150, s: 40 };
    const byX = P.foes.slice().sort((a, b) => a.x - b.x);
    return byX[Math.floor((byX.length - 1) / 2)];
  }

  const SKILL = {
    d: 1.2, sfx: [[0.02, 'whoosh'], [0.42, 'swing'], [0.52, 'swing'], [0.6, 'crit'], [0.92, 'rumble']],
    act(S, P) {
      const g = S.g, t = S.t, T = S.T, bare = unsheathed(P.look), m = mainFoe(P), my = m.y - m.s * 0.45;
      ST.backdrop(S, P, 0.55, '#2a0400');
      lighter(g, () => glow(g, m.x, my, 90, '#ff4a10', 0.25 + 0.25 * seg(t, 0.4, 0.6)));
      ST.foes(S, P, { flash: t > 0.58 && t < 0.8 ? 0.7 * (1 - seg(t, 0.58, 0.8)) : 0 });
      const dash = eOut(seg(t, 0, 0.38)), x = lerp(-40, m.x - 82, dash), y = 214;
      if (t < 0.4) {
        lighter(g, () => {
          for (let i = 1; i <= 6; i++) {
            const q = Math.max(0, dash - i * 0.06), px = lerp(-40, m.x - 82, q);
            line(g, rgba(i % 2 ? EDGE : '#ff5a10', 0.5 * (1 - i / 7)), 6 - i * 0.7, px - 10, y - 66 + i, px + 30, y - 52);
          }
        });
        K.hStreaks(g, T, 22, 3, 700, '#ffb070', 0.5, BAR, FLOOR);
      }
      const plant = seg(t, 0.85, 1.0), cut = seg(t, 0.4, 0.62);
      S.fig(bare, x, y, { k: 2, s: 0.78, rot: t < 0.4 ? 0.18 : lerp(0.1, 0, plant) });
      if (t < 0.4) blade(g, x - 4, y - 66, lerp(2.6, 2.9, dash), 96, 1, 0.7);
      else if (t < 0.85) blade(g, x + 18, y - 70, lerp(-1.9, 0.75, eOut(cut)), 104, 1, 1);
      else blade(g, x + 26, lerp(y - 70, y - 104, eOut(plant)), Math.PI / 2, 108, 1, 1 - plant * 0.5);
      slash(g, m.x, my, 1, seg(t, 0.4, 0.5), 1 - seg(t, 0.75, 0.95), 0.55);
      slash(g, m.x, my, -1, seg(t, 0.5, 0.6), 1 - seg(t, 0.75, 0.95), 0.55);
      if (t > 0.6) {
        const fly = eOut(seg(t, 0.6, 0.85));
        for (const f of P.foes) {
          if (f === m) continue;
          const fx = lerp(m.x, f.x, fly), fy = lerp(my, f.y - f.s * 0.45, fly) - Math.sin(fly * Math.PI) * 24;
          lighter(g, () => { glow(g, fx, fy, 14, '#ff7a20', 0.9); glow(g, fx, fy, 5, HOT, 1); });
          if (fly >= 1) K.sparks(g, t - 0.85, f.x, f.y - f.s * 0.45, 10, 6, '#ffb050', f.s * 0.6);
        }
        lighter(g, () => { glow(g, m.x, my, m.s * 0.9 * eOut(seg(t, 0.6, 0.8)), '#ff7a20', 0.9 * (1 - seg(t, 0.7, 1.1))); ring(g, rgba('#ffb060', 1 - seg(t, 0.6, 0.9)), 2, m.x, my, m.s * 0.8 * eOut(seg(t, 0.6, 0.9))); });
      }
      if (t > 0.88) {
        const k = seg(t, 0.88, 1.2);
        lighter(g, () => { g.strokeStyle = rgba(EDGE, 0.8 * (1 - k)); g.lineWidth = 2; g.beginPath(); g.ellipse(x + 26, y - 2, 20 + 50 * eOut(k), 4 + 10 * eOut(k), 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1; });
        K.embers(g, T, 26, 13, x - 40, x + 90, FLOOR, '#ffc070');
      }
      if (t > 0.6 && t < 0.68) flash(g, '#ffd0a0', 0.5 * (1 - seg(t, 0.6, 0.68)));
      vignette(g, 0.4);
    }
  };

  function coronaArc(g, k, a) {
    if (k <= 0 || a <= 0) return;
    const { x, y, r } = SUN, a0 = -Math.PI / 2, a1 = a0 + Math.PI * 2 * eOut(k);
    lighter(g, () => {
      for (const [w, col, al] of [[10, '#ff5a10', 0.5], [5, EDGE, 0.85], [2, HOT, 1]]) {
        g.strokeStyle = rgba(col, al * a); g.lineWidth = w; g.beginPath(); g.arc(x, y, r + 3, a0, a1); g.stroke();
      }
      g.lineWidth = 1;
      const hx1 = x + Math.cos(a1) * (r + 3), hy1 = y + Math.sin(a1) * (r + 3);
      glow(g, hx1, hy1, 12, HOT, a);
    });
  }

  const FUSION_SINGULARITY = {
    lines: [[1, 'Этот доспех… Я однажды уже видел его.'], [0, 'Тогда повторим урок. Теперь вместе.']], swap: 0.85, d: 1.9,
    sfx: [[0.1, 'tech'], [0.35, 'rumble'], [0.88, 'whoosh'], [1.0, 'swing'], [1.3, 'crit'], [1.34, 'rumble']],
    act(S, P) {
      const g = S.g, t = S.t, T = S.T, [Hi, We] = P.m, { x, y, r } = SUN;
      const cover = eOut(seg(t, 0.15, 0.8)), leap = eOut(seg(t, 0.85, 1.15)), ring1 = seg(t, 0.95, 1.3), fall = seg(t, 1.3, 1.9), dim = 0.2 * cover;
      sky(g, T, dim);
      lighter(g, () => { glow(g, x, y, r * (2.4 + fall * 3), cover > 0.9 ? '#ff7a20' : '#ffd8a0', 0.45 + 0.4 * fall); glow(g, x, y, r * 1.4, '#ffe8c0', 0.5); });
      ell(g, '#fff0d0', x, y, r, r);
      lighter(g, () => {
        for (let i = 0; i < 36; i++) {
          const ph = (T * 0.7 + hx(i, 1, 41)) % 1, a = hx(i, 2, 41) * Math.PI * 2 + ph * 4, rr = r + (1 - ph) * 90;
          rect(g, rgba(i % 3 ? '#c8a0ff' : '#ffe880', ph * cover * (1 - fall)), Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.7), 2, 1);
        }
      });
      ell(g, '#0c0410', x, y, lerp(2, r * 0.97, cover), lerp(2, r * 0.97, cover));
      lighter(g, () => ring(g, rgba('#c8a0ff', 0.6 * cover * (1 - fall)), 1, x, y, lerp(2, r * 0.97, cover) + 1));
      S.fig(We.look, 74, 262, { k: 2 });
      line(g, '#2a2a32', 3, 96, 176, 128, 70);
      lighter(g, () => { glow(g, 128, 70, 12, '#ffd850', 0.7 + 0.3 * Math.sin(T * 12)); if (cover < 1) line(g, rgba('#c8a0ff', 0.5 * (1 - cover)), 1, 128, 70, x, y); });
      if (t < 0.85) S.fig(Hi.look, 262, 262, { k: 2, flip: true });
      else if (t < 1.3) {
        const bare = unsheathed(Hi.look), hxp = lerp(262, x + 8, leap), hyp = lerp(262, y + 118, leap) - Math.sin(leap * Math.PI) * 30;
        S.fig(bare, hxp, hyp, { k: 2, s: lerp(1, 0.7, leap), flip: true, rot: lerp(0, -0.2, leap) });
        blade(g, hxp - 14, hyp - 62 * lerp(1, 0.7, leap), lerp(-1.2, -2.6, ring1), 86, 1, 0.9);
        K.hStreaks(g, T, 18, 5, -500, '#ffb070', 0.35, BAR, FLOOR);
      }
      coronaArc(g, ring1, 1 - seg(t, 1.3, 1.45));
      if (fall > 0) {
        const w = lerp(6, 20, eOut(fall)), fade = 1 - seg(t, 1.7, 1.9);
        lighter(g, () => {
          rect(g, rgba('#ff6a10', 0.7 * fade), x - w, y, w * 2, LH - y);
          rect(g, rgba('#c890ff', 0.45 * fade), x - w * 1.5, y, w * 0.6, LH - y);
          rect(g, rgba('#ffd850', 0.6 * fade), x + w * 0.9, y, w * 0.6, LH - y);
          rect(g, rgba(HOT, 0.9 * fade), x - w * 0.3, y, w * 0.6, LH - y);
          ring(g, rgba('#ffd070', 1 - fall), 3, x, FLOOR - 8, 20 + fall * 140);
          for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line(g, rgba('#ffe880', 1 - fall), 1, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a) * (r + 30 + fall * 80), y + Math.sin(a) * (r + 30 + fall * 80)); }
        });
        K.embers(g, T, 50, 11, 0, LW, FLOOR, '#ffd070');
        if (fall < 0.15) flash(g, '#fff0d0', 0.6 * (1 - fall / 0.15));
      }
      vignette(g, 0.35);
    }
  };

  function emptySuit(g, x, y, s, a) {
    const c = rgba('#2c2c36', a), d = rgba('#1c1c24', a);
    ell(g, c, x, y - 70 * s, 6 * s, 7 * s);
    poly(g, c, [x - 12 * s, y - 62 * s, x + 12 * s, y - 62 * s, x + 9 * s, y - 30 * s, x - 9 * s, y - 30 * s]);
    poly(g, d, [x - 9 * s, y - 30 * s, x - 1 * s, y - 30 * s, x - 3 * s, y, x - 8 * s, y]);
    poly(g, d, [x + 1 * s, y - 30 * s, x + 9 * s, y - 30 * s, x + 8 * s, y, x + 3 * s, y]);
    rect(g, rgba('#5a5a68', a), x - 1 * s, y - 72 * s, 2 * s, 2 * s);
  }

  function hall(g, T, beat) {
    vgrad(g, 0, LH, [[0, '#050308'], [0.6, '#140a10'], [1, '#08040a']]);
    for (let i = 0; i < 6; i++) {
      const q = i / 6, w = lerp(26, 6, q);
      rect(g, '#120a10', lerp(0, 120, q), lerp(20, 70, q), w, lerp(200, 90, q));
      rect(g, '#120a10', LW - lerp(0, 120, q) - w, lerp(20, 70, q), w, lerp(200, 90, q));
    }
    poly(g, '#0e070c', [0, LH, 120, 160, 200, 160, LW, LH]);
    for (let i = 4; i >= 0; i--) {
      const q = i / 5, s = lerp(0.95, 0.38, q), y = lerp(204, 162, q), a = lerp(0.8, 0.35, q);
      emptySuit(g, lerp(34, 116, q), y, s, a);
      emptySuit(g, LW - lerp(34, 116, q), y, s, a);
      lighter(g, () => { line(g, rgba('#ff3a1a', a * 0.35), 1, lerp(34, 116, q) + 10 * s, y - 60 * s, lerp(34, 116, q) + 8 * s, y - 32 * s); line(g, rgba('#ff3a1a', a * 0.35), 1, LW - lerp(34, 116, q) - 10 * s, y - 60 * s, LW - lerp(34, 116, q) - 8 * s, y - 32 * s); });
    }
    lighter(g, () => glow(g, 160, 120, 90, '#ff3a1a', 0.12 + 0.18 * beat));
  }

  function cupMini(g, T, x, y, s) {
    rect(g, '#5a3a24', x - 14 * s, y + 3 * s, 28 * s, 6 * s);
    poly(g, '#f2ece2', [x - 6 * s, y - 8 * s, x + 6 * s, y - 8 * s, x + 5 * s, y + 3 * s, x - 5 * s, y + 3 * s]);
    ring(g, '#f2ece2', Math.max(1, s), x + 7 * s, y - 3 * s, 2.6 * s);
    ell(g, '#4a2810', x, y - 8 * s, 5.5 * s, 1.4 * s);
    for (let i = 0; i < 3; i++) { const ph = (T * 0.6 + i / 3) % 1; ell(g, rgba('#ffffff', 0.25 * (1 - ph)), x + Math.sin(T * 2 + i) * 3 * s, y - 12 * s - ph * 22 * s, 3 * s, 2 * s); }
  }

  function finale(g, t, T, look, game, drawFig) {
    const S = H.Cine.stage(g, game, T), open = eOut(seg(t, 0.1, 0.6)), cx = 160, fy = 226, bare = unsheathed(look);
    S.t = t;
    sky(g, T);
    eclipse(g, T, 1, 0.25 + 0.15 * Math.sin(T * 2));
    blade(g, cx + 8, fy - 118, lerp(-1.5, -0.98, open), 150, 1, 0.5 + 0.5 * open);
    blade(g, cx - 8, fy - 118, lerp(-1.64, -2.16, open), 150 * open, open, open);
    lighter(g, () => glow(g, cx, fy - 90, 80, '#ff7a20', 0.25));
    ell(g, rgba('#000000', 0.4), cx, fy, 28, 5);
    if (drawFig) drawFig(S, bare, cx, fy); else S.fig(bare, cx, fy, { k: 2 });
    lighter(g, () => glow(g, cx, fy - 118, 6 + 3 * Math.sin(T * 6), '#ff9a2a', 0.8));
    K.embers(g, T, 40, 17, 0, LW, FLOOR, '#ffc070');
    if (t < 0.2) flash(g, '#ffffff', 0.7 * (1 - t / 0.2));
    vignette(g, 0.4);
  }

  const WARP = {
    d: 4.2, line: 'Алый урок начинается. Конспект писать не нужно.',
    sfx: [[0.2, 'rumble'], [1.05, 'glint'], [1.45, 'tech'], [2.6, 'whoosh'], [2.75, 'swing'], [3.1, 'crit']],
    act(S, P) {
      const g = S.g, t = S.t, T = S.T, WK = H.WarpIntro.KIT;
      if (t < 1.4) {
        const lit = seg(t, 1.05, 1.3), beat = Math.max(Math.pow(Math.max(0, Math.sin(T * 5)), 8) * (1 - lit), lit);
        WK.zoom(g, 160, 150, lerp(1, 1.12, eOut(t / 1.4)), () => {
          hall(g, T, beat);
          S.fig(P.look, 160, 226, { k: 2, tint: '#2a060a', ta: lerp(0.85, 0.2, lit) });
          lighter(g, () => { glow(g, 160, 108, 8 + 18 * beat, '#ff6a20', 0.4 + 0.6 * beat); glow(g, 160, 108, 3, HOT, 0.5 + 0.5 * beat); });
          const p = WK.fly(S, P, t, 0.4, 1.05, [300, 10], [160, 108], { lift: 20, s: 1.3, ease: eIn, trail: '#ffb070' });
          if (p && p.k >= 1) WK.twinkle(g, 160, 108, 7, 1 - seg(t, 1.05, 1.3));
          if (lit > 0) K.embers(g, T, 20, 19, 100, 220, 226, '#ff9a50');
        });
      } else if (t < 2.6) {
        const k = t - 1.4;
        vgrad(g, 0, LH, [[0, '#0e0408'], [1, '#2a0c0c']]);
        lighter(g, () => glow(g, 230, 110, 130, '#ff5a1a', 0.3 + 0.1 * Math.sin(T * 7)));
        K.embers(g, T, 30, 21, 120, LW, FLOOR, '#ffb060');
        S.bust(P.look, 216 + Math.round(k * 3), FLOOR + 8, 172, { v: k < 0.45 ? { closed: true } : null });
        lighter(g, () => { glow(g, 196, 104, 4, '#ffb050', 0.7 * seg(k, 0.45, 0.7)); glow(g, 232, 104, 4, '#ffb050', 0.7 * seg(k, 0.45, 0.7)); });
        cupMini(g, T, 70, 196, 2.4);
        H.WarpIntro.ticket(g, 108, 200, { s: 2, rot: -0.3, std: P.std, glow: 0.6 });
      } else {
        const PL = Object.assign({}, P);
        finale(g, t - 2.6, T, P.look, S.game, (S2, bare, x, y) => { PL.id = bare; WK.pose(S2, PL, { x, y }); });
      }
      WK.cuts(g, t, [1.4, 2.6]);
    },
    finale
  };

  const WIN = { x: 70, y: 22, w: 180, h: 150 }, WIN_SUN = { x: 160, y: 72, r: 20 };
  function windowClip(g, fn) {
    const { x, y, w, h } = WIN;
    g.save(); g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath(); g.clip(); fn(); g.restore();
  }

  function rack(g, x, y, lit) {
    rect(g, '#1a1418', x - 14, y - 4, 28, 4); rect(g, '#3a3036', x - 12, y - 6, 24, 2);
    rect(g, '#2a2228', x - 1, y - 78, 3, 74);
    rect(g, '#2a2228', x - 16, y - 70, 32, 3); rect(g, '#4a3e46', x - 16, y - 70, 32, 1);
    poly(g, '#2a2228', [x - 6, y - 82, x + 7, y - 82, x + 4, y - 74, x - 3, y - 74]);
    for (const dx of [-16, 15]) for (let i = 0; i < 4; i++) rect(g, i % 2 ? '#5a4e56' : '#3a3036', x + dx, y - 66 + i * 4, 2, 3);
    lighter(g, () => glow(g, x, y - 58, 10, '#ff5a1a', 0.25 + 0.5 * lit));
  }

  const EIDOLON = {
    title: 'Зал Хельхейма',
    aura: 'fire',
    paint(g) {
      vgrad(g, 0, LH, [[0, '#07040a'], [0.6, '#120a10'], [1, '#080408']]);
      windowClip(g, () => { sky(g, 0); eclipse(g, 0, 1, 0.2, WIN_SUN); });
      const { x, y, w, h } = WIN;
      g.strokeStyle = '#2a1a1e'; g.lineWidth = 6; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.stroke();
      g.strokeStyle = '#6a2a20'; g.lineWidth = 1; g.beginPath(); g.moveTo(x + 3, y + h); g.lineTo(x + 3, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2 - 3, Math.PI, 0); g.lineTo(x + w - 3, y + h); g.stroke();
      rect(g, '#2a1a1e', x + w / 2 - 2, y + 10, 4, h - 10); rect(g, '#2a1a1e', x, y + 92, w, 4);
      for (const cx of [26, 294]) { rect(g, '#140c10', cx - 10, 10, 20, 172); rect(g, '#2a1a1e', cx - 10, 10, 3, 172); }
      vgrad(g, 172, LH, [[0, '#1c0c10'], [1, '#0a0406']]);
      rect(g, '#3a1a18', 0, 172, LW, 2);
      for (let i = 0; i < 7; i++) { const q = i / 7; line(g, '#160a0c', 1, 160, 172, lerp(-200, 520, q), LH); }
      for (let i = 0; i < 4; i++) {
        const q = i / 4, s2 = lerp(0.95, 0.5, q), yy = lerp(206, 178, q);
        emptySuit(g, lerp(18, 58, q), yy, s2, lerp(0.9, 0.5, q));
        emptySuit(g, LW - lerp(18, 58, q), yy, s2, lerp(0.9, 0.5, q));
      }
      rect(g, '#3a2214', 64, 190, 34, 16); rect(g, '#5a3420', 64, 190, 34, 2); rect(g, '#24140c', 66, 194, 30, 10);
      cupMini(g, 0, 81, 182, 1.3);
      rack(g, 236, 206, 0);
      lighter(g, () => { glow(g, 160, 196, 70, '#ff4a1a', 0.14); for (let i = 0; i < 5; i++) { const x0 = 104 + i * 26, y0 = 196 + (i % 2) * 6; line(g, rgba('#ff5a1a', 0.5), 1, x0, y0, x0 + 14, y0 + 3); } });
    },
    decor(g, t) {
      lighter(g, () => {
        for (let i = 0; i < 8; i++) { const f = 0.25 + 0.25 * Math.sin(t * 3 + i * 1.3), q = (i % 4) / 4, xx = i < 4 ? lerp(18, 58, q) : LW - lerp(18, 58, q), yy = lerp(206, 178, q), s2 = lerp(0.95, 0.5, q); line(g, rgba('#ff3a1a', f), 1, xx + 10 * s2 * (i < 4 ? 1 : -1), yy - 60 * s2, xx + 8 * s2 * (i < 4 ? 1 : -1), yy - 32 * s2); }
        glow(g, 236, 148, 8 + 3 * Math.sin(t * 5), '#ff6a20', 0.5);
      });
      for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; ell(g, rgba('#ffffff', 0.25 * (1 - ph)), 81 + Math.sin(t * 2 + i) * 3, 176 - ph * 24, 3, 2); }
      K.embers(g, t, 26, 23, 0, LW, 210, '#ffb060');
    },
    life(g, t) {
      const ph = t % 6.5, k = ph < 1.4 ? ph / 1.4 : 0, a = Math.sin(k * Math.PI);
      windowClip(g, () => {
        eclipse(g, t, 1, a, WIN_SUN);
        if (k > 0) { slash(g, 160, 100, 1, seg(k, 0, 0.4), 1 - seg(k, 0.6, 1), 0.9); slash(g, 160, 100, -1, seg(k, 0.25, 0.65), 1 - seg(k, 0.7, 1), 0.9); }
      });
      if (k > 0) flameWave(g, t, 160, 196, seg(k, 0.5, 0.9), 0.6 * (1 - seg(k, 0.85, 1)));
    }
  };

  class SkillShow {
    constructor(ui, u, o = {}) {
      this.ui = ui; this.game = ui.game; this.u = u;
      const forced = o.outfit !== undefined, kit = H.CHARS[u.charId] || {}, el = H.ELEMENTS[u.elem] || H.ELEMENTS.phys;
      this.outfit = forced ? o.outfit : H.wornOutfit(u.charId, this.game);
      this.def = H.outfitCutOf(this.outfit, 'skill');
      this.P = { u, id: u.charId, elem: u.elem, col: el.col, name: o.name || (kit.skill && kit.skill.name) || '', look: H.outfitLook(this.outfit, this.game.state.gender), foes: o.foes || [], bg: o.bg || 'station' };
      this.beats = [{ id: 'act', d: this.def.d, sfx: this.def.sfx }];
      this.i = 0; this.t = 0; this.T = 0; this.cue = 0; this.fade = 0; this.done = false;
    }

    get length() { return this.def.d + SKILL_FADE; }
    get beat() { return this.beats[0]; }
    get fading() { return this.fade > 0; }

    tick(dt) {
      if (this.done) return;
      if (this.fade > 0) { this.fade += dt; if (this.fade >= SKILL_FADE) this.done = true; return; }
      this.t += dt; this.T += dt;
      const cues = this.def.sfx || [];
      while (this.cue < cues.length && cues[this.cue][0] <= this.t) this.ui.sfx(cues[this.cue++][1]);
      if (this.t >= this.def.d) this.fade = 0.001;
    }

    skip() { if (!this.fade) this.fade = 0.001; }

    render() {
      const cv = buf.cv || (buf.cv = G.mkCanvas(LW, LH)), g = cv.getContext('2d');
      g.save();
      g.imageSmoothingEnabled = false;
      const S = H.Cine.stage(g, this.game, this.T);
      S.t = Math.min(this.t, this.def.d); S.d = this.def.d;
      this.def.act(S, this.P);
      g.restore();
      if (this.t < 0.08) flash(g, '#ffffff', 0.6 * (1 - this.t / 0.08));
      H.Cine.dither(g);
      return cv;
    }

    draw(c) {
      const ui = this.ui, P = this.P, cv = this.render();
      c.save();
      c.globalAlpha = this.fade > 0 ? 1 - cl(this.fade / SKILL_FADE) : 1;
      c.imageSmoothingEnabled = false;
      c.drawImage(cv, 0, 0, W, HGT);
      c.fillStyle = '#000000'; c.fillRect(0, 0, W, BAR * 2); c.fillRect(0, HGT - BAR * 2, W, BAR * 2);
      c.fillStyle = rgba(P.col, 0.7); c.fillRect(0, BAR * 2 - 1, W, 1); c.fillRect(0, HGT - BAR * 2, W, 1);
      const k = eOut(cl(this.t / 0.25));
      c.globalAlpha *= k;
      ui.text('НАВЫК', 14 - (1 - k) * 60, 14, { size: 10, bold: true, col: G.light(P.col, 0.3) });
      ui.text(P.name, 14 - (1 - k) * 60, 28, { size: 14, bold: true, serif: true, col: C.gold });
      ui.text(P.u.name, W - 14, HGT - BAR * 2 + 16, { align: 'right', size: 11, bold: true, col: C.cream });
      c.restore();
      if (!this.fade) {
        ui.hints([['Esc', 'Пропустить']], W - 12, 20, { align: 'right' });
        ui.hit(0, 0, W, HGT, () => this.skip());
      }
    }
  }

  H.OUTFIT_CUTS = Object.assign(H.OUTFIT_CUTS || {}, {
    himeko_vermilion: { ult: ULT, skill: SKILL, fusions: { f_singularity: FUSION_SINGULARITY }, warp: WARP, eidolon: EIDOLON }
  });
  H.SkillShow = SkillShow;
  H.OutfitCutArt = { blade, eclipse, sky, rails, slash, flameWave, unsheathed, emptySuit, cupMini, finale };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
