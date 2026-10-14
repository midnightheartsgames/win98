(function (H) {
  'use strict';
  const E = H.Eidolons, S = E.SCENES, G = H.Gfx;
  const K = H.Cine.Kit;
  const { LW, LH, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, lerp } = K;

  function arch(g, x, y, w, h, col) {
    rect(g, col, x, y + w / 2, w, h - w / 2);
    ell(g, col, x + w / 2, y + w / 2, w / 2, w / 2);
  }
  function clipArch(g, x, y, w, h, fn) {
    g.save(); g.beginPath();
    g.moveTo(x, y + h); g.lineTo(x, y + w / 2); g.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); g.lineTo(x + w, y + h); g.closePath();
    g.clip(); fn(); g.restore();
  }
  function clipRect(g, x, y, w, h, fn) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(); g.restore(); }
  function sky(g, x, y, w, h, seed, n, warm) {
    vgrad(g, y, y + h, [[0, warm ? '#0c0a24' : '#04061a'], [1, warm ? '#2a1640' : '#141a40']], x, w);
    for (let i = 0; i < n; i++) {
      const sx = x + Math.floor(hx(i, seed, 2) * w), sy = y + Math.floor(hx(seed, i, 3) * h);
      rect(g, rgba(hx(i, seed, 5) > 0.8 ? '#ffe8c0' : '#e8f0ff', 0.35 + 0.65 * hx(i, seed, 1)), sx, sy, hx(i, seed, 7) > 0.92 ? 2 : 1, 1);
    }
  }
  function twinkle(g, t, x, y, w, h, seed, n) {
    lighter(g, () => {
      for (let i = 0; i < n; i++) {
        const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + hx(i, seed, 4) * 3) + i * 1.7);
        const sx = x + Math.floor(hx(i, seed, 8) * w), sy = y + Math.floor(hx(seed, i, 9) * h);
        rect(g, rgba('#ffffff', tw * 0.8), sx, sy, 1, 1);
        if (tw > 0.85) { rect(g, rgba('#c8e0ff', (tw - 0.85) * 4), sx - 1, sy, 3, 1); rect(g, rgba('#c8e0ff', (tw - 0.85) * 4), sx, sy - 1, 1, 3); }
      }
    });
  }
  function lampGlow(g, t, x, y, r, col, seed) {
    lighter(g, () => glow(g, x, y, r * (1 + 0.06 * Math.sin(t * 7 + seed) + 0.04 * Math.sin(t * 13.1 + seed)), col, 0.5));
  }
  function frameBox(g, x, y, w, h, wood, mat) {
    rect(g, '#1a0c08', x - 1, y - 1, w + 2, h + 2);
    rect(g, wood, x, y, w, h);
    rect(g, K.rgba('#ffffff', 0.25), x, y, w, 1);
    rect(g, mat || '#f4ecd8', x + 2, y + 2, w - 4, h - 4);
  }
  function photo(g, x, y, w, h, fn) {
    rect(g, '#1a1418', x - 1, y - 1, w + 2, h + 2);
    rect(g, '#f6f2e8', x, y, w, h);
    clipRect(g, x + 1, y + 1, w - 2, h - 4, () => fn(x + 1, y + 1, w - 2, h - 4));
  }
  function sprite(X, who, dir, frame, x, y, v) { X.S.sprite(who, dir, frame, x, y, v ? { v } : {}); }
  function shine(g, x, y, s, a) {
    lighter(g, () => { rect(g, rgba('#ffffff', a), x - s, y, s * 2 + 1, 1); rect(g, rgba('#ffffff', a), x, y - s, 1, s * 2 + 1); glow(g, x, y, s * 1.6, '#ffffff', a * 0.6); });
  }
  function carpet(g, y0, top, bottom, trim) {
    vgrad(g, y0, LH, [[0, top], [1, bottom]]);
    g.strokeStyle = rgba(trim, 0.3); g.lineWidth = 1;
    for (let i = -7; i <= 7; i++) { g.beginPath(); g.moveTo(153 + i * 18, y0); g.lineTo(153 + i * 70, LH); g.stroke(); }
    for (let r = 0; r < 4; r++) for (let i = -5; i <= 5; i++) { const y = y0 + 12 + r * 18, x = 153 + i * (36 + r * 12); poly(g, rgba(trim, 0.38), [x, y - 3, x + 5, y, x, y + 3, x - 5, y]); }
  }
  function sofa(g, x, y, w, col, hi) {
    rect(g, '#1a0a08', x - 1, y - 1, w + 2, 34);
    rect(g, col, x, y, w, 22);
    rect(g, hi, x + 2, y - 6, w - 4, 8);
    rect(g, K.rgba('#000000', 0.25), x, y + 14, w, 8);
    rect(g, '#b8904a', x, y + 22, w, 2);
    rect(g, '#3a1a10', x + 3, y + 24, 4, 8); rect(g, '#3a1a10', x + w - 7, y + 24, 4, 8);
  }

  S.march = {
    title: 'Вагон-салон',
    aura: 'ice',
    frags: [
      ['Глыба льда', 'Март нашли в глыбе льда посреди космоса. Имя ей дали по дню находки.'],
      ['Фотоаппарат', 'Камера всегда при ней. Март снимает всё, что хочет запомнить.'],
      ['Гирлянда снимков', 'Снимки экипажа над окном вагона-салона.'],
      ['Снимок Ярило-VI', 'Снежная планета из космоса. Этим снимком Март убеждала Гепарда.'],
      ['Лук', 'Её оружие. Ледяные стрелы для врагов и щит для друзей.'],
      ['Фото на память', 'Общий снимок у монумента в день присяги Брони.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#2a120c'], [0.55, '#3c1a12'], [1, '#1c0a08']]);
      for (let x = 0; x < LW; x += 16) rect(g, rgba('#000000', 0.12), x, 22, 1, 128);
      rect(g, '#1e0c08', 0, 0, LW, 20); rect(g, '#c89a50', 0, 19, LW, 2); rect(g, '#6a4a22', 0, 21, LW, 1);
      for (const [wx, ww] of [[14, 72], [116, 84], [232, 72]]) {
        arch(g, wx - 5, 24, ww + 10, 108, '#6a4420');
        arch(g, wx - 3, 26, ww + 6, 104, '#9a6a30');
        clipArch(g, wx, 29, ww, 100, () => {
          sky(g, wx, 29, ww, 100, wx, 70, wx === 116);
          if (wx === 116) {
            lighter(g, () => glow(g, 186, 96, 30, '#9ad0ff', 0.35));
            ell(g, '#c8dcee', 186, 96, 13, 13); ell(g, '#eef6ff', 183, 92, 8, 8); ell(g, '#8aa8c8', 190, 100, 6, 4);
          }
        });
        rect(g, '#c89a50', wx - 5, 128, ww + 10, 3);
        rect(g, rgba('#ffffff', 0.08), wx + ww / 2, 30, 1, 98);
      }
      for (const lx of [100, 216]) {
        rect(g, '#7a5020', lx - 1, 44, 3, 22); ell(g, '#d8a050', lx + 0.5, 44, 4, 2);
        ell(g, '#ffe6a8', lx + 0.5, 70, 5, 6); rect(g, '#b8904a', lx - 4, 63, 10, 2);
        lighter(g, () => glow(g, lx + 0.5, 70, 22, '#ffd890', 0.45));
      }
      rect(g, '#4a2016', 0, 131, LW, 20); rect(g, '#c89a50', 0, 131, LW, 2);
      for (let x = 4; x < LW; x += 32) rect(g, '#5a2a1c', x, 136, 24, 11);
      carpet(g, 150, '#6a1a22', '#2e080c', '#d8b060');
      sofa(g, 12, 116, 86, '#e8dcc4', '#f4ecdc');
      sofa(g, 228, 116, 84, '#e8dcc4', '#f4ecdc');
      g.strokeStyle = '#3a2a1c'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(118, 34); g.quadraticCurveTo(158, 58, 198, 34); g.stroke();
      const pics = [[122, 37, '#f4e6ee'], [134, 43, '#c9282e'], [146, 47, '#1f2127'], [158, 48, '#6b4b35']];
      pics.forEach(([px, py, hair], i) => {
        photo(g, px, py, 9, 11, (x, y, w, h) => { vgrad(g, y, y + h, [[0, '#8ab0d8'], [1, '#e8eef8']], x, w); ell(g, hair, x + w / 2, y + 4, 3, 3); ell(g, '#f6dcc8', x + w / 2, y + 5, 2, 2); rect(g, i % 2 ? '#25232a' : '#8cc4ee', x + 1, y + 7, w - 2, 2); });
        rect(g, '#d8b060', px + 4, py - 2, 1, 2);
      });
      photo(g, 168, 36, 20, 18, (x, y, w, h) => {
        rect(g, '#030614', x, y, w, h);
        for (let i = 0; i < 9; i++) rect(g, '#ffffff', x + Math.floor(hx(i, 1, 3) * w), y + Math.floor(hx(i, 2, 3) * h), 1, 1);
        ell(g, '#dce8f4', x + w / 2, y + h / 2 + 1, 6, 6); ell(g, '#ffffff', x + w / 2 - 1, y + h / 2, 3, 3); ell(g, '#9ab0c8', x + w / 2 + 2, y + h / 2 + 3, 3, 2);
      });
      rect(g, '#d8b060', 177, 33, 2, 3);
      rect(g, '#2a1a12', 96, 110, 26, 6); rect(g, '#c89a50', 96, 110, 26, 1);
      rect(g, '#1c2a3a', 100, 98, 18, 12); rect(g, '#5ac2d6', 101, 99, 16, 10); rect(g, '#8ae0f0', 101, 99, 16, 2);
      ell(g, '#1c2a3a', 109, 104, 4, 4); ell(g, '#4a7a9a', 109, 104, 3, 3); ell(g, '#cfeefa', 108, 103, 1, 1);
      rect(g, '#f0f0f4', 113, 100, 3, 2); rect(g, '#2a3a4a', 102, 96, 5, 2);
      lighter(g, () => glow(g, 112, 166, 22, '#9ad8ff', 0.35));
      poly(g, '#7ab8e0', [100, 176, 98, 160, 104, 150, 118, 148, 126, 156, 126, 174]);
      poly(g, '#b8e2f8', [102, 172, 101, 160, 106, 152, 116, 151, 121, 156, 112, 160, 110, 172]);
      poly(g, '#e8f8ff', [104, 160, 108, 154, 114, 153, 108, 158]);
      poly(g, '#4a88b8', [118, 148, 126, 156, 126, 174, 120, 176, 121, 158]);
      rect(g, rgba('#ffffff', 0.7), 105, 162, 1, 6); rect(g, rgba('#ffffff', 0.5), 116, 163, 1, 4);
      poly(g, '#d8f0ff', [96, 177, 104, 172, 112, 177, 122, 173, 128, 178, 96, 180]);
      g.strokeStyle = '#5a9ae8'; g.lineWidth = 2;
      g.beginPath(); g.arc(196, 105, 17, -1.2, 1.2); g.stroke();
      g.strokeStyle = '#cfe8ff'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(196 + Math.cos(-1.2) * 17, 105 + Math.sin(-1.2) * 17); g.lineTo(196 + Math.cos(1.2) * 17, 105 + Math.sin(1.2) * 17); g.stroke();
      rect(g, '#ffffff', 211, 103, 3, 4); rect(g, '#2a3a5a', 211, 104, 3, 2);
      line(g, '#e8f4ff', 1, 203, 112, 220, 92); poly(g, '#9ad8ff', [220, 92, 217, 92, 220, 89]);
      rect(g, '#5a3a20', 196, 168, 28, 3); rect(g, '#7a5430', 196, 167, 28, 1); rect(g, '#3a2414', 208, 171, 4, 12); rect(g, '#3a2414', 202, 182, 16, 2);
      frameBox(g, 199, 148, 22, 18, '#c89a50', '#f6f0e2');
      clipRect(g, 201, 150, 18, 14, () => {
        vgrad(g, 150, 164, [[0, '#f0b070'], [1, '#fff0d0']], 201, 18);
        rect(g, '#e8eef6', 201, 160, 18, 4);
        [['#f4e6ee', 203], ['#8e8884', 207], ['#1f2127', 211], ['#b9b9c6', 215]].forEach(([hc, px]) => { ell(g, hc, px, 155, 1.6, 1.6); rect(g, '#2a2a34', px - 1, 157, 3, 4); });
      });
      if (!live) sprite(X, 'pompom', 'left', 0, 284, 196);
    },
    decor(g, t) {
      twinkle(g, t, 116, 29, 84, 98, 3, 26);
      twinkle(g, t, 14, 29, 72, 98, 5, 14);
      twinkle(g, t, 232, 29, 72, 98, 7, 14);
      lampGlow(g, t, 100.5, 70, 20, '#ffd890', 1);
      lampGlow(g, t, 216.5, 70, 20, '#ffd890', 2);
      lighter(g, () => { for (let i = 0; i < 10; i++) { const ph = (t * 0.06 + hx(i, 2, 9)) % 1; rect(g, rgba('#ffe8c0', 0.5 * Math.sin(ph * Math.PI)), Math.floor(70 + hx(i, 3, 9) * 180), Math.floor(140 - ph * 100), 1, 1); } });
      shine(g, 112, 151, 2, 0.4 + 0.4 * Math.sin(t * 2.3));
    },
    life(g, t, X) {
      for (const [wx, ww] of [[14, 72], [116, 84], [232, 72]]) clipArch(g, wx, 29, ww, 100, () => K.hStreaks(g, t, 10, wx, 160, '#b8d0ff', 0.55, 32, 126));
      const walk = (t * 18) % 120, x = 300 - Math.abs(walk - 60), dir = walk < 60 ? 'left' : 'right';
      sprite(X, 'pompom', dir, Math.floor(t * 6) % 4, x, 196);
      const f = (t % 5.2);
      if (f < 0.16) { const a = 1 - f / 0.16; K.flash(g, '#ffffff', 0.35 * a); lighter(g, () => glow(g, 109, 104, 24, '#ffffff', a)); }
    }
  };

  function crate(g, x, y, w, h, col, band) {
    rect(g, '#0c0e16', x - 1, y - 1, w + 2, h + 2);
    rect(g, col, x, y, w, h);
    rect(g, rgba('#ffffff', 0.16), x, y, w, 1);
    rect(g, rgba('#000000', 0.28), x, y + h - 2, w, 2);
    rect(g, band || '#b8964e', x, y + 3, w, 2);
    rect(g, band || '#b8964e', x, y + h - 6, w, 2);
    rect(g, rgba('#000000', 0.2), x + w - 3, y, 3, h);
  }
  function perspFloor(g, y0, top, bottom, col, a) {
    vgrad(g, y0, LH, [[0, top], [1, bottom]]);
    g.strokeStyle = rgba(col, a); g.lineWidth = 1;
    for (let i = -9; i <= 9; i++) { g.beginPath(); g.moveTo(153 + i * 14, y0); g.lineTo(153 + i * 58, LH); g.stroke(); }
    for (let i = 1; i < 7; i++) { const y = y0 + Math.pow(i / 7, 1.6) * (LH - y0); g.beginPath(); g.moveTo(0, y); g.lineTo(LW, y); g.stroke(); }
  }
  function monitor(g, x, y, w, h, scr, frame) {
    rect(g, '#0a0c14', x - 1, y - 1, w + 2, h + 2);
    rect(g, frame || '#3a4258', x, y, w, h);
    rect(g, scr, x + 2, y + 2, w - 4, h - 4);
    rect(g, rgba('#ffffff', 0.18), x + 2, y + 2, w - 4, 1);
  }
  function panelWall(g, x, y, w, h, col, step) {
    for (let px = x; px < x + w; px += step) { rect(g, col, px + 1, y, step - 2, h); rect(g, rgba('#ffffff', 0.06), px + 1, y, step - 2, 1); }
  }
  function bookshelf(g, x, y, w, h, seed, pal) {
    rect(g, '#1c120a', x - 1, y, w + 2, h);
    rect(g, '#4a3220', x, y, w, h);
    for (let r = 0; r * 22 + 22 <= h - 2; r++) {
      const sy = y + 3 + r * 22;
      rect(g, '#160e08', x + 3, sy, w - 6, 18);
      let bx = x + 4, i = 0;
      while (bx < x + w - 7) {
        const bw = 3 + Math.floor(hx(i, r + seed, 5) * 4), bh = 10 + Math.floor(hx(i, r + seed, 6) * 7), col = pal[Math.floor(hx(i, r + seed, 7) * pal.length)];
        if (hx(i, r + seed, 8) > 0.9) { bx += 4; i++; continue; }
        rect(g, col, bx, sy + 18 - bh, bw, bh); rect(g, rgba('#ffffff', 0.2), bx, sy + 18 - bh, 1, bh); rect(g, rgba('#000000', 0.25), bx + bw - 1, sy + 18 - bh, 1, bh);
        bx += bw + 1; i++;
      }
      rect(g, '#6a4a2a', x + 1, sy + 18, w - 2, 3); rect(g, '#8a6a40', x + 1, sy + 18, w - 2, 1);
    }
  }
  function cane(g, x, y, h, col, head) {
    rect(g, col, x - 1, y - h, 2, h);
    rect(g, rgba('#ffffff', 0.25), x - 1, y - h, 1, h);
    ell(g, head, x + 2, y - h, 4, 2); rect(g, head, x - 2, y - h, 4, 3);
  }
  function eye(g, x, y, s, open) {
    lighter(g, () => glow(g, x, y, 34 * s, '#ff3a10', 0.4));
    ell(g, '#ff5a1a', x, y, 15 * s, 9 * s);
    ell(g, '#ffd080', x, y, 12 * s, 7 * s * Math.max(0.15, open));
    ell(g, '#1a0404', x, y, 9 * s, 6 * s * Math.max(0.1, open));
    ell(g, '#ff2010', x, y, 1.6 * s, 5 * s * Math.max(0.1, open));
  }
  function blackHole(g, x, y, r, t) {
    lighter(g, () => glow(g, x, y, r * 3, '#9a5aff', 0.45));
    g.save(); g.translate(x, y); g.rotate(-0.35 + (t || 0) * 0.4);
    g.strokeStyle = '#e8d0ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, r * 2.1, r * 0.55, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = '#b07aff'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, r * 2.6, r * 0.75, 0, 0, Math.PI * 2); g.stroke();
    g.restore();
    ell(g, '#000000', x, y, r, r);
    g.strokeStyle = '#fff4ff'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, r + 0.5, 0, Math.PI * 2); g.stroke();
    g.save(); g.translate(x, y); g.rotate(-0.35 + (t || 0) * 0.4);
    g.strokeStyle = '#ffe8ff'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, 0, r * 2.1, r * 0.55, 0, 0.15, Math.PI - 0.15); g.stroke();
    g.restore();
  }
  function hexes(g, x, y, r, col, a) {
    g.strokeStyle = rgba(col, a); g.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const ang = i / 6 * Math.PI * 2, cx = i === 6 ? x : x + Math.cos(ang) * r * 0.62, cy = i === 6 ? y : y + Math.sin(ang) * r * 0.62, hr = r * 0.34;
      g.beginPath();
      for (let k = 0; k <= 6; k++) { const q = k / 6 * Math.PI * 2 + Math.PI / 6; if (k) g.lineTo(cx + Math.cos(q) * hr, cy + Math.sin(q) * hr); else g.moveTo(cx + Math.cos(q) * hr, cy + Math.sin(q) * hr); }
      g.stroke();
    }
  }

  S.trail = {
    title: 'Платформа станции «Герта»',
    aura: 'phys',
    frags: [
      ['Мусорный бак', 'Мусорный бак станции «Герта». Заглянуть в него было делом чести.'],
      ['Бита', 'Бита Разрушения. «Снова с битой? Тебе идёт», сказала Химико.'],
      ['Стелларон', 'Стелларон в тебе стабилен и ничего вокруг не искажает. Так говорит Вельт.'],
      ['Ярило-VI', 'Снежная планета. К ней Экспресс отправился сразу после станции.'],
      ['Копьё Клипота', 'Огонь Сохранения. Эту силу ты {получил|получила} от Клипота.'],
      ['Звёздный экспресс', 'Химико предложила ехать со Звёздным экспрессом. Ты {согласился|согласилась}.']
    ],
    paint(g) {
      vgrad(g, 0, LH, [[0, '#121830'], [0.5, '#232b4a'], [1, '#10142a']]);
      rect(g, '#2a3252', 0, 0, LW, 19);
      for (let i = 0; i < 6; i++) rect(g, '#d8e8ff', 10 + i * 54, 15, 32, 2);
      rect(g, '#c9a45c', 0, 19, LW, 2);
      rect(g, '#060a16', 5, 23, 310, 94);
      clipRect(g, 7, 25, 306, 90, () => {
        sky(g, 7, 25, 306, 90, 21, 150, false);
        lighter(g, () => { glow(g, 60, 60, 80, '#5a3aa0', 0.35); glow(g, 250, 70, 90, '#2a5aa0', 0.32); glow(g, 150, 40, 50, '#7a4ac0', 0.2); });
        K.planet(g, 176, 46, 14, 'jarilo', 0);
        K.stellaron(g, 144, 45, 5, 0, 1);
      });
      for (let i = 0; i <= 8; i++) { const x = Math.round(4 + i * 38.5); rect(g, '#8a6e3a', x, 23, 4, 95); rect(g, '#d8b868', x + 1, 23, 1, 95); }
      rect(g, '#d8b868', 3, 21, 314, 3); rect(g, '#8a6e3a', 3, 116, 314, 3);
      vgrad(g, 119, 152, [[0, '#2e3656'], [1, '#1a2038']]);
      panelWall(g, 0, 124, LW, 20, '#363f62', 20);
      rect(g, '#5af0ff', 0, 147, LW, 1); rect(g, rgba('#5af0ff', 0.3), 0, 148, LW, 2);
      perspFloor(g, 151, '#3a4262', '#121628', '#d8b868', 0.28);
      poly(g, '#1a1e2c', [172, 170, LW, 170, LW, 190, 164, 190]);
      for (let x = 168; x < LW; x += 9) rect(g, '#3a3020', x, 172, 3, 16);
      rect(g, '#d8b868', 168, 175, 152, 1); rect(g, '#d8b868', 165, 184, 155, 1);
      g.save(); g.translate(240, 167); g.scale(-0.82, 0.82); K.expressSide(g, 0, 0, 1, 0, { cars: 2 }); g.restore();
      crate(g, 6, 150, 40, 30, '#4a4a58'); crate(g, 12, 122, 30, 28, '#5a5a6a'); crate(g, 48, 160, 26, 22, '#3e3e4c');
      monitor(g, 54, 124, 26, 18, '#1a6a8a');
      ell(g, '#0c0e18', 112, 180, 14, 3);
      rect(g, '#5a6278', 101, 154, 22, 25); rect(g, '#7a8298', 102, 154, 9, 25); rect(g, '#9aa2b8', 103, 155, 2, 23);
      for (let x = 105; x < 122; x += 4) rect(g, rgba('#000000', 0.18), x, 157, 1, 20);
      rect(g, '#e8c040', 101, 165, 22, 3);
      ell(g, '#3a4258', 112, 154, 12, 3); ell(g, '#8a92a8', 112, 152, 12, 3); rect(g, '#2a3040', 108, 148, 8, 3);
      poly(g, '#f0ece0', [104, 152, 108, 146, 112, 151]); poly(g, '#e8d070', [114, 151, 119, 147, 121, 152]);
      crate(g, 94, 114, 30, 24, '#5a5a6a');
      g.save(); g.translate(104, 130); g.rotate(0.55);
      rect(g, '#2a2a30', -1.5, -7, 3, 10); ell(g, '#2a2a30', 0, 3, 2.6, 1.6);
      poly(g, '#d8b47a', [-1.5, -7, 1.5, -7, 3.6, -36, -3.6, -36]); ell(g, '#e8c890', 0, -36, 3.6, 2);
      rect(g, '#f4dca8', -1, -32, 1, 24); rect(g, '#e2b64a', -2, -9, 4, 1);
      g.restore();
      g.save(); g.translate(210, 124); g.rotate(-0.22);
      lighter(g, () => glow(g, 0, -34, 22, '#ff9a40', 0.55));
      rect(g, '#7a3a14', -1.5, -36, 3, 40); rect(g, '#e8a040', -0.5, -36, 1, 40);
      poly(g, '#ffd27a', [0, -52, 4.5, -40, 0, -36, -4.5, -40]); poly(g, '#ffffff', [0, -50, 1.5, -42, 0, -38]);
      rect(g, '#e2b64a', -3, -37, 6, 2); poly(g, '#ff7a30', [-3, -35, 3, -35, 0, -28]);
      g.restore();
      rect(g, '#2a3040', 300, 118, 4, 54); ell(g, '#d8e8ff', 302, 118, 6, 3);
      lighter(g, () => glow(g, 302, 120, 24, '#b8d8ff', 0.4));
    },
    decor(g, t) {
      twinkle(g, t, 7, 25, 306, 90, 23, 40);
      clipRect(g, 7, 25, 306, 90, () => K.stellaron(g, 144, 45, 5, t, 0.55));
      lighter(g, () => { for (let i = 0; i < 9; i++) { const ph = (t * 0.7 + hx(i, 1, 33)) % 1; rect(g, rgba('#ffb060', 1 - ph), Math.floor(200 + hx(i, 2, 33) * 12), Math.floor(84 - ph * 22), 1, 1); } });
      rect(g, rgba('#5af0ff', 0.5 + 0.4 * Math.sin(t * 3)), 58, 128, 6, 2);
      rect(g, rgba('#ff5a6a', 0.5 + 0.5 * Math.sin(t * 5)), 70, 132, 3, 2);
      lighter(g, () => glow(g, 302, 120, 20 + 3 * Math.sin(t * 6), '#b8d8ff', 0.25));
    },
    life(g, t) {
      const ct = t % 9;
      if (ct < 1.6) clipRect(g, 7, 25, 306, 90, () => { const k = ct / 1.6, x = lerp(330, -20, k), y = lerp(32, 92, k); lighter(g, () => { line(g, rgba('#c8e8ff', 0.75), 1, x, y, x + 28, y - 5); glow(g, x, y, 6, '#ffffff', 0.9); }); });
      K.smoke(g, t, 224, 182, 4, 16, '#d8dce8', 0.35);
      lighter(g, () => { glow(g, 196, 162, 16 + 4 * Math.sin(t * 2.4), '#c8ecff', 0.5); g.save(); g.globalAlpha = 0.18 + 0.1 * Math.sin(t * 2.4); poly(g, '#c8ecff', [196, 160, 120, 150, 120, 176]); g.restore(); });
    }
  };

  S.danheng = {
    title: 'Архив Экспресса',
    aura: 'wind',
    frags: [
      ['Постель в архиве', 'Дань Хэн живёт прямо в архиве и спит на полу, между стеллажами.'],
      ['Терминал', 'Банк данных Экспресса. Здесь Дань Хэн найдёт любую запись.'],
      ['Стеллажи', 'Записи о мирах, где побывал Экспресс. Дань Хэн ведёт их сам.'],
      ['Звёздный путь', 'За иллюминатором рельсы Экспресса. Они ведут к следующему миру.'],
      ['Копьё', 'Копьё Дань Хэна. О своём прошлом он говорить не любит.'],
      ['Эфирный дракон', 'Его абсолютная техника. Вода принимает облик дракона.']
    ],
    paint(g) {
      vgrad(g, 0, LH, [[0, '#0a1618'], [0.6, '#162a2c'], [1, '#0a1214']]);
      for (let x = 0; x < LW; x += 12) rect(g, rgba('#000000', 0.14), x, 20, 1, 130);
      rect(g, '#0c1a1c', 0, 0, LW, 18); rect(g, '#3f9c8c', 0, 17, LW, 2); rect(g, '#1c3a38', 0, 19, LW, 1);
      const pal = ['#3f9c8c', '#c8b070', '#5a6a9a', '#8a4a3a', '#d8d0b8', '#2a6a5a', '#4a5a4a'];
      bookshelf(g, 0, 22, 90, 134, 1, pal);
      bookshelf(g, 228, 22, 92, 134, 7, pal);
      bookshelf(g, 122, 22, 42, 46, 4, pal);
      ell(g, '#1c2a2c', 180, 46, 17, 17); ell(g, '#8a7a50', 180, 46, 15, 15); ell(g, '#c8b070', 180, 46, 14, 14);
      g.save(); g.beginPath(); g.arc(180, 46, 12, 0, Math.PI * 2); g.clip();
      sky(g, 166, 32, 28, 28, 11, 24, false);
      lighter(g, () => { glow(g, 186, 40, 14, '#7ad8ff', 0.35); g.strokeStyle = 'rgba(255,214,120,0.9)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(166, 58); g.quadraticCurveTo(178, 46, 194, 36); g.stroke(); g.strokeStyle = 'rgba(255,240,190,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(166, 54); g.quadraticCurveTo(176, 44, 192, 33); g.stroke(); });
      g.restore();
      rect(g, rgba('#ffffff', 0.35), 172, 38, 3, 1); rect(g, rgba('#ffffff', 0.25), 171, 39, 1, 3);
      rect(g, '#2a3a3a', 120, 72, 80, 2);
      lighter(g, () => glow(g, 160, 80, 60, '#7ad8c8', 0.12));
      rect(g, '#3a2a1c', 94, 118, 36, 4); rect(g, '#5a4028', 94, 118, 36, 1); rect(g, '#2a1c12', 96, 122, 3, 26); rect(g, '#2a1c12', 125, 122, 3, 26);
      monitor(g, 97, 94, 30, 23, '#0a2a24', '#5a6a6a');
      for (let i = 0; i < 5; i++) rect(g, rgba('#7af0c8', 0.8 - i * 0.12), 101, 99 + i * 3, 8 + Math.floor(hx(i, 3, 3) * 14), 1);
      rect(g, '#2a3a3a', 104, 117, 16, 2);
      vgrad(g, 156, LH, [[0, '#2a1c14'], [1, '#120a06']]);
      for (let y = 160; y < LH; y += 8) rect(g, rgba('#000000', 0.25), 0, y, LW, 1);
      g.strokeStyle = rgba('#000000', 0.25); g.lineWidth = 1;
      for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(153 + i * 16, 156); g.lineTo(153 + i * 60, LH); g.stroke(); }
      ell(g, '#1c3a38', 153, 206, 96, 18); ell(g, '#24504a', 153, 204, 90, 15); ell(g, rgba('#3f9c8c', 0.35), 153, 204, 80, 12);
      rect(g, '#0c1a1c', 98, 176, 30, 4);
      rect(g, '#e8ece4', 98, 166, 30, 10); rect(g, '#3f9c8c', 108, 166, 20, 10); rect(g, '#2a6a5a', 108, 172, 20, 4);
      rect(g, '#f4f6f0', 99, 163, 10, 6); rect(g, rgba('#000000', 0.15), 99, 168, 10, 1);
      rect(g, '#c8d0c8', 98, 175, 30, 1);
      g.save(); g.translate(214, 152); g.rotate(0.16);
      rect(g, '#1a1414', -1, -78, 2, 82); rect(g, '#3a2e2e', -1, -78, 1, 82);
      poly(g, '#e8f0f4', [0, -96, 3.5, -82, 0, -78, -3.5, -82]); poly(g, '#ffffff', [0, -94, 1, -84, 0, -80]);
      rect(g, '#c8b070', -2.5, -78, 5, 2);
      poly(g, '#3fb8a0', [-1, -76, 1, -76, 3, -62, -3, -62]); poly(g, '#2a8a78', [0, -76, 3, -62, 0, -64]);
      g.restore();
      lighter(g, () => glow(g, 208, 166, 24, '#3fd0c0', 0.4));
      ell(g, '#14504a', 208, 178, 16, 4); ell(g, '#3fb8a8', 208, 177, 12, 2.5);
      g.strokeStyle = '#7af0e0'; g.lineWidth = 3; g.beginPath(); g.moveTo(200, 177); g.bezierCurveTo(190, 166, 222, 162, 206, 150); g.stroke();
      g.strokeStyle = '#d8fff8'; g.lineWidth = 1; g.beginPath(); g.moveTo(201, 176); g.bezierCurveTo(192, 166, 220, 162, 205, 151); g.stroke();
      poly(g, '#7af0e0', [200, 152, 212, 146, 220, 150, 212, 154, 204, 156]);
      poly(g, '#d8fff8', [210, 146, 214, 140, 213, 147]); poly(g, '#d8fff8', [214, 147, 220, 142, 217, 149]);
      rect(g, '#0a2a28', 214, 149, 2, 1);
    },
    decor(g, t) {
      for (let i = 0; i < 5; i++) rect(g, rgba('#7af0c8', 0.35 + 0.3 * Math.sin(t * 4 + i)), 101, 99 + ((i + Math.floor(t * 3)) % 5) * 3, 6 + Math.floor(hx(i, Math.floor(t * 3), 3) * 16), 1);
      lighter(g, () => { for (let i = 0; i < 14; i++) { const ph = (t * 0.05 + hx(i, 2, 19)) % 1; rect(g, rgba('#d8fff0', 0.5 * Math.sin(ph * Math.PI)), Math.floor(100 + hx(i, 3, 19) * 120), Math.floor(150 - ph * 120), 1, 1); } });
      g.save(); g.beginPath(); g.arc(180, 46, 12, 0, Math.PI * 2); g.clip(); twinkle(g, t, 166, 32, 28, 28, 13, 8); g.restore();
      lighter(g, () => glow(g, 208, 166, 20 + 3 * Math.sin(t * 2), '#3fd0c0', 0.25));
    },
    life(g, t) {
      lighter(g, () => {
        for (let i = 0; i < 3; i++) { const ph = (t * 0.6 + i / 3) % 1; g.strokeStyle = rgba('#7af0e0', 0.6 * (1 - ph)); g.lineWidth = 1; g.beginPath(); g.ellipse(208, 177, 8 + ph * 18, 2 + ph * 4, 0, 0, Math.PI * 2); g.stroke(); }
        const sway = Math.sin(t * 1.6) * 4;
        g.strokeStyle = rgba('#a8fff0', 0.6); g.lineWidth = 2; g.beginPath(); g.moveTo(206, 176); g.bezierCurveTo(186 + sway, 160, 228 - sway, 158, 208 + sway * 0.5, 146); g.stroke();
        for (let i = 0; i < 8; i++) { const ph = (t * 0.8 + i / 8) % 1; rect(g, rgba('#d8fff8', 1 - ph), Math.floor(200 + Math.sin(i * 2 + t) * 10), Math.floor(176 - ph * 34), 1, 1); }
      });
      g.save(); g.beginPath(); g.arc(180, 46, 12, 0, Math.PI * 2); g.clip(); K.hStreaks(g, t, 6, 5, 90, '#c8f0ff', 0.6, 34, 58); g.restore();
    }
  };

  S.himeko = {
    title: 'Кабина Экспресса',
    aura: 'fire',
    frags: [
      ['Чемодан', 'Дорожный чемодан Химико. В бою он превращается в пилу.'],
      ['Кофе', 'Химико сама варит кофе и угощает каждого, кто заглянет.'],
      ['Звёздная карта', 'Освоение для неё значит исследовать, понимать, утверждать и связывать.'],
      ['Эмблема Освоения', 'Экспресс создал Акивили, Эон Освоения.'],
      ['Гаечный ключ', 'Экспресс застрял разбитым на её родной планете. Химико его починила.'],
      ['Орбитальная пушка', 'Луч с Экспресса отсёк руку Двигателю созидания.']
    ],
    paint(g) {
      vgrad(g, 0, LH, [[0, '#1c0c08'], [0.6, '#341810'], [1, '#160806']]);
      rect(g, '#140806', 0, 0, LW, 16); rect(g, '#d8a040', 0, 15, LW, 2);
      g.save(); g.beginPath(); g.moveTo(10, 120); g.lineTo(10, 40); g.quadraticCurveTo(160, 6, 310, 40); g.lineTo(310, 120); g.closePath(); g.clip();
      sky(g, 0, 18, LW, 110, 31, 160, true);
      lighter(g, () => { glow(g, 270, 70, 70, '#ff8a4a', 0.25); glow(g, 60, 50, 70, '#6a3ab0', 0.3); });
      K.planet(g, 266, 92, 22, 'blue', 0);
      lighter(g, () => { g.strokeStyle = 'rgba(255,214,120,0.85)'; g.lineWidth = 2; g.beginPath(); g.moveTo(130, 124); g.quadraticCurveTo(190, 90, 258, 84); g.stroke(); g.strokeStyle = 'rgba(255,240,200,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(150, 124); g.quadraticCurveTo(200, 96, 260, 88); g.stroke(); });
      g.restore();
      g.strokeStyle = '#8a5a24'; g.lineWidth = 4; g.beginPath(); g.moveTo(10, 120); g.lineTo(10, 40); g.quadraticCurveTo(160, 6, 310, 40); g.lineTo(310, 120); g.stroke();
      g.strokeStyle = '#e8b860'; g.lineWidth = 1; g.beginPath(); g.moveTo(12, 120); g.lineTo(12, 41); g.quadraticCurveTo(160, 8, 308, 41); g.lineTo(308, 120); g.stroke();
      for (const x of [86, 236]) { rect(g, '#8a5a24', x - 2, 22, 4, 100); rect(g, '#e8b860', x - 1, 22, 1, 100); }
      lighter(g, () => {
        g.strokeStyle = 'rgba(122,232,255,0.75)'; g.lineWidth = 1;
        for (const r of [6, 11, 15]) { g.beginPath(); g.ellipse(144, 45, r, r * 0.6, -0.3, 0, Math.PI * 2); g.stroke(); }
        g.beginPath(); g.moveTo(130, 52); g.lineTo(140, 42); g.lineTo(150, 47); g.lineTo(158, 37); g.stroke();
        for (const [x, y] of [[130, 52], [140, 42], [150, 47], [158, 37], [144, 45]]) glow(g, x, y, 3, '#c8f8ff', 0.9);
      });
      ell(g, '#5a3a14', 176, 44, 13, 13); ell(g, '#e8c060', 176, 44, 12, 12); ell(g, '#8a5a1c', 176, 44, 9, 9); ell(g, '#f8e098', 176, 44, 8, 8);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; poly(g, '#8a5a1c', [176 + Math.cos(a) * 2, 44 + Math.sin(a) * 2, 176 + Math.cos(a + 0.2) * 7, 44 + Math.sin(a + 0.2) * 7, 176 + Math.cos(a - 0.2) * 7, 44 + Math.sin(a - 0.2) * 7]); }
      ell(g, '#ffffff', 174, 42, 2, 1.5);
      rect(g, '#2a1408', 0, 120, LW, 34); rect(g, '#e8b860', 0, 120, LW, 2); rect(g, '#6a3a18', 0, 124, LW, 26);
      for (let i = 0; i < 14; i++) { const x = 8 + i * 22; rect(g, '#1a0a06', x, 128, 14, 8); rect(g, ['#ffd070', '#7ae8ff', '#ff6a4a', '#9aff9a'][i % 4], x + 2 + (i % 3) * 3, 130, 3, 3); rect(g, '#c8a060', x, 140, 14, 2); }
      rect(g, '#5a3010', 96, 106, 30, 14); rect(g, '#8a5020', 96, 106, 30, 2);
      rect(g, '#b87a3a', 100, 90, 12, 16); rect(g, '#e0a050', 100, 90, 4, 16); ell(g, '#5a3010', 106, 90, 6, 2); rect(g, '#3a1c08', 112, 94, 4, 2); rect(g, '#3a1c08', 115, 94, 2, 6);
      rect(g, '#f4ecdc', 114, 100, 8, 6); rect(g, '#3a1c08', 115, 100, 6, 2); rect(g, '#f4ecdc', 122, 101, 2, 3);
      perspFloor(g, 154, '#5a1a1a', '#200606', '#e8b860', 0.25);
      ell(g, '#140404', 112, 180, 16, 3);
      rect(g, '#1a0606', 97, 140, 30, 40); rect(g, '#9a1c22', 98, 141, 28, 38); rect(g, '#c8282e', 98, 141, 10, 38);
      rect(g, '#d9a73a', 98, 141, 28, 2); rect(g, '#d9a73a', 98, 177, 28, 2); rect(g, '#d9a73a', 98, 158, 28, 2);
      for (const [x, y] of [[98, 141], [124, 141], [98, 176], [124, 176]]) rect(g, '#f8e098', x, y, 3, 3);
      rect(g, '#2a1408', 106, 136, 12, 5); rect(g, '#1a0606', 108, 138, 8, 3);
      for (let y = 144; y < 176; y += 4) poly(g, '#e8e8f0', [127, y, 130, y + 2, 127, y + 4]);
      rect(g, '#3a3a44', 194, 112, 30, 10); rect(g, '#c8282e', 194, 110, 30, 3); rect(g, '#5a5a64', 196, 114, 26, 2);
      g.save(); g.translate(206, 108); g.rotate(-0.6);
      rect(g, '#a8b0bc', -1.5, -22, 3, 24); rect(g, '#e0e6ee', -1.5, -22, 1, 24);
      ell(g, '#a8b0bc', 0, -24, 5, 4); ell(g, '#3a2c20', 1, -26, 2.5, 2.5); ell(g, '#a8b0bc', 0, 3, 3, 3); ell(g, '#3a2c20', 0, 3, 1.5, 1.5);
      g.restore();
      rect(g, '#3a1c0c', 194, 156, 30, 22); rect(g, '#8a5a24', 194, 156, 30, 2); rect(g, '#1a0a04', 196, 160, 26, 14);
      ell(g, '#2a1408', 203, 167, 6, 6); ell(g, '#ff8a3a', 203, 167, 5, 5); ell(g, '#ffd8a0', 202, 166, 2, 2);
      rect(g, '#5a3010', 213, 150, 3, 18); ell(g, '#c83a2a', 214.5, 150, 4, 4); ell(g, '#ff9a8a', 213.5, 149, 1.5, 1.5);
      lighter(g, () => glow(g, 203, 167, 16, '#ff6a20', 0.5));
      rect(g, '#e8b860', 197, 175, 24, 1);
    },
    decor(g, t) {
      for (let i = 0; i < 14; i++) { const on = Math.sin(t * (2 + i * 0.37) + i) > 0; if (on) lighter(g, () => glow(g, 8 + i * 22 + 3 + (i % 3) * 3, 131, 4, ['#ffd070', '#7ae8ff', '#ff6a4a', '#9aff9a'][i % 4], 0.8)); }
      K.smoke(g, t, 117, 98, 4, 10, '#f4ecdc', 0.35);
      lighter(g, () => { g.strokeStyle = 'rgba(122,232,255,0.6)'; g.lineWidth = 1; const a = t * 0.8; g.beginPath(); g.ellipse(144, 45, 15, 9, -0.3, a, a + 1.2); g.stroke(); glow(g, 144 + Math.cos(a) * 11, 45 + Math.sin(a) * 6, 3, '#ffffff', 0.9); });
      lighter(g, () => glow(g, 203, 167, 12 + 3 * Math.sin(t * 4), '#ff6a20', 0.35));
      twinkle(g, t, 20, 30, 280, 86, 37, 30);
    },
    life(g, t) {
      const ph = t % 6.5;
      if (ph < 1.1) {
        const k = ph / 1.1, a = Math.sin(k * Math.PI);
        g.save(); g.beginPath(); g.moveTo(10, 120); g.lineTo(10, 40); g.quadraticCurveTo(160, 6, 310, 40); g.lineTo(310, 120); g.closePath(); g.clip();
        lighter(g, () => { g.lineWidth = 6 * a; g.strokeStyle = rgba('#ffb060', 0.9 * a); g.beginPath(); g.moveTo(320, 30); g.lineTo(262, 96); g.stroke(); g.lineWidth = 2 * a; g.strokeStyle = rgba('#ffffff', a); g.stroke(); glow(g, 262, 96, 30 * a, '#ffd090', 0.8 * a); });
        g.restore();
        lighter(g, () => glow(g, 203, 167, 26, '#ff8a3a', 0.6 * a));
      }
      g.save(); g.beginPath(); g.moveTo(10, 120); g.lineTo(10, 40); g.quadraticCurveTo(160, 6, 310, 40); g.lineTo(310, 120); g.closePath(); g.clip();
      K.hStreaks(g, t, 10, 41, 70, '#ffe0c0', 0.35, 26, 116);
      g.restore();
    }
  };

  S.welt = {
    title: 'Грузовой отсек станции',
    aura: 'imag',
    frags: [
      ['Трость', 'Трость Вельта. С ней он управляется с гравитацией.'],
      ['Гравитационная тюрьма', 'Его техника: враги замедлены и отброшены назад.'],
      ['Взгляд Нанука', 'После боя в пустоте прозвучал чужой голос: «ОНИ уже заметили тебя».'],
      ['Чёрная дыра', 'Синтетическая чёрная дыра. Абсолютная техника Вельта.'],
      ['Зверь Судного дня', 'Зверь Судного дня ждал в грузовом отсеке. Здесь его и одолели.'],
      ['Спокойный Стелларон', 'Вельт успокоил Стелларон в тебе, и ты {пришёл|пришла} в себя.']
    ],
    paint(g, X) {
      vgrad(g, 0, LH, [[0, '#07060e'], [0.55, '#16122a'], [1, '#08060e']]);
      g.save(); g.beginPath(); g.moveTo(96, 18); g.lineTo(228, 18); g.lineTo(216, 76); g.lineTo(196, 70); g.lineTo(170, 84); g.lineTo(140, 72); g.lineTo(112, 80); g.closePath(); g.clip();
      sky(g, 90, 14, 140, 72, 51, 60, false);
      lighter(g, () => glow(g, 160, 50, 60, '#5a2a8a', 0.4));
      eye(g, 144, 44, 0.9, 1);
      blackHole(g, 176, 46, 6, 0);
      g.restore();
      g.strokeStyle = '#3a2a5a'; g.lineWidth = 2; g.beginPath(); g.moveTo(96, 18); g.lineTo(112, 80); g.lineTo(140, 72); g.lineTo(170, 84); g.lineTo(196, 70); g.lineTo(216, 76); g.lineTo(228, 18); g.stroke();
      poly(g, '#14102a', [0, 0, 96, 18, 112, 80, 0, 120]); poly(g, '#14102a', [LW, 0, 228, 18, 216, 76, LW, 120]);
      rect(g, '#1a1628', 0, 0, LW, 16);
      for (let i = 0; i < 5; i++) rect(g, '#4a3a8a', 14 + i * 64, 14, 30, 2);
      panelWall(g, 0, 84, 96, 70, '#1c1830', 16); panelWall(g, 224, 84, 96, 70, '#1c1830', 16);
      vgrad(g, 150, LH, [[0, '#1c1630'], [1, '#08060e']]);
      g.strokeStyle = 'rgba(160,90,255,0.22)'; g.lineWidth = 1;
      for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(153 + i * 12, 150); g.lineTo(153 + i * 60, LH); g.stroke(); }
      for (let i = 1; i < 6; i++) { const y = 150 + Math.pow(i / 6, 1.7) * 90; g.beginPath(); g.moveTo(0, y); g.lineTo(LW, y); g.stroke(); }
      crate(g, 10, 120, 44, 32, '#3a3448', '#6a5a9a'); crate(g, 40, 150, 34, 28, '#2e2a3e', '#6a5a9a');
      for (const [x, y, s] of [[60, 60, 5], [30, 90, 4], [262, 54, 6], [292, 96, 4], [80, 32, 3]]) poly(g, '#3a3450', [x - s, y, x, y - s, x + s * 1.2, y - 1, x + s * 0.6, y + s]);
      X.S.foe('doomsday', 266, 196, 92, { tint: '#140c26', ta: 0.62 });
      lighter(g, () => { g.strokeStyle = 'rgba(176,122,255,0.7)'; g.lineWidth = 1; for (const r of [10, 15]) { g.beginPath(); g.ellipse(112, 106, r + 2, r * 0.45, 0.2, 0, Math.PI * 2); g.stroke(); } glow(g, 112, 104, 20, '#8a4aff', 0.4); });
      for (const [x, y, s, c] of [[104, 100, 4, '#5a5068'], [118, 96, 3, '#6a6078'], [114, 110, 5, '#4a4258'], [102, 112, 2, '#7a7090']]) { poly(g, c, [x - s, y, x - 1, y - s, x + s, y - 1, x + 1, y + s]); rect(g, rgba('#ffffff', 0.3), x - 1, y - s + 1, 1, 1); }
      ell(g, '#0a0812', 112, 180, 10, 2.5);
      lighter(g, () => { glow(g, 112, 176, 14, '#8a4aff', 0.45); g.strokeStyle = 'rgba(176,122,255,0.7)'; g.lineWidth = 1; g.beginPath(); g.ellipse(112, 178, 9, 2.5, 0, 0, Math.PI * 2); g.stroke(); });
      cane(g, 112, 179, 32, '#2a2226', '#c8a050');
      lighter(g, () => { glow(g, 208, 162, 20, '#9ad8ff', 0.5); g.strokeStyle = 'rgba(176,122,255,0.85)'; g.lineWidth = 1; for (const [r, a] of [[11, 0.3], [14, -0.4]]) { g.beginPath(); g.ellipse(208, 162, r, r * 0.4, a, 0, Math.PI * 2); g.stroke(); } });
      ell(g, '#101830', 208, 162, 4, 4); ell(g, '#e8ffff', 208, 162, 2.4, 2.4);
      ell(g, '#0a0812', 208, 180, 12, 2.5);
    },
    decor(g, t) {
      for (const [x, y, s, c, ph] of [[104, 100, 4, '#7a6a98', 0], [118, 96, 3, '#8a80a8', 1], [114, 110, 5, '#6a6080', 2]]) { const dy = Math.round(Math.sin(t * 1.4 + ph) * 1.5); rect(g, rgba('#c8a8ff', 0.5), x - 1, y - s + 1 + dy, 2, 1); }
      lighter(g, () => { const p = 0.5 + 0.5 * Math.sin(t * 2); glow(g, 112, 104, 18 + p * 4, '#8a4aff', 0.25); glow(g, 208, 162, 14 + p * 4, '#9ad8ff', 0.3); });
      lighter(g, () => { for (let i = 0; i < 12; i++) { const ph = (t * 0.3 + hx(i, 1, 23)) % 1; rect(g, rgba('#c8a8ff', 0.6 * Math.sin(ph * Math.PI)), Math.floor(96 + hx(i, 2, 23) * 132), Math.floor(80 - ph * 30), 1, 1); } });
    },
    life(g, t) {
      g.save(); g.beginPath(); g.moveTo(96, 18); g.lineTo(228, 18); g.lineTo(216, 76); g.lineTo(196, 70); g.lineTo(170, 84); g.lineTo(140, 72); g.lineTo(112, 80); g.closePath(); g.clip();
      blackHole(g, 176, 46, 6, t);
      const open = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.7));
      eye(g, 144, 44, 0.9, open);
      g.restore();
      for (let i = 0; i < 6; i++) { const a = t * 0.6 + i * 1.05, x = 112 + Math.cos(a) * 15, y = 106 + Math.sin(a) * 6; poly(g, i % 2 ? '#7a7090' : '#5a5068', [x - 2, y, x, y - 2, x + 2, y, x, y + 2]); }
      lighter(g, () => { const f = Math.floor(t * 8); if (hx(f, 2, 29) > 0.6) { g.strokeStyle = 'rgba(200,160,255,0.8)'; g.lineWidth = 1; g.beginPath(); let x = 196 + hx(f, 3, 29) * 24, y = 150; g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (hx(s, f, 31) - 0.5) * 10; y += 5; g.lineTo(x, y); } g.stroke(); } });
    }
  };

  S.asta = {
    title: 'Главный пульт станции',
    aura: 'stars',
    frags: [
      ['Отчёты', 'Себя Аста называет скорее экономкой: сотрудники, отчёты, Гильдия эрудитов.'],
      ['Пульт', 'Отсюда Аста руководила обороной станции от Легиона.'],
      ['Созвездия', 'Аста с радостью покажет созвездия любому, кто спросит.'],
      ['Письма Герте', 'Герта на письма не отвечает. Аста всё равно пишет.'],
      ['Щит станции', 'Герта прислала код, и щит восстанавливается втрое быстрее.'],
      ['Арлан на посту', 'Аста была к Арлану добра, и он пошёл за ней на станцию.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#0e1430'], [0.55, '#1c2650'], [1, '#0c1028']]);
      rect(g, '#1a2244', 0, 0, LW, 18); for (let i = 0; i < 5; i++) rect(g, '#d8e8ff', 16 + i * 64, 15, 32, 2); rect(g, '#c9a45c', 0, 18, LW, 2);
      for (const [x, w] of [[4, 88], [228, 88]]) { rect(g, '#060a18', x, 26, w, 72); clipRect(g, x + 2, 28, w - 4, 68, () => sky(g, x + 2, 28, w - 4, 68, x, 50, false)); rect(g, '#b8964e', x, 24, w, 3); rect(g, '#b8964e', x, 96, w, 3); for (let i = 1; i < 3; i++) rect(g, '#8a6e3a', x + i * w / 3, 26, 2, 72); }
      rect(g, '#0a0e1c', 112, 24, 96, 58); rect(g, '#b8964e', 110, 22, 100, 2); rect(g, '#b8964e', 110, 82, 100, 2);
      vgrad(g, 26, 80, [[0, '#0a2a5a'], [1, '#1a5a9a']], 114, 92);
      for (let i = 0; i < 30; i++) rect(g, rgba('#c8e8ff', 0.3 + 0.5 * hx(i, 2, 9)), 114 + Math.floor(hx(i, 3, 9) * 44), 28 + Math.floor(hx(i, 4, 9) * 50), 1, 1);
      g.strokeStyle = '#d8f4ff'; g.lineWidth = 1; g.beginPath(); g.moveTo(132, 52); g.lineTo(140, 40); g.lineTo(150, 44); g.lineTo(156, 34); g.moveTo(140, 40); g.lineTo(144, 56); g.stroke();
      for (const [x, y] of [[132, 52], [140, 40], [150, 44], [156, 34], [144, 56]]) { rect(g, '#ffffff', x - 1, y, 3, 1); rect(g, '#ffffff', x, y - 1, 1, 3); }
      rect(g, '#0e2a4a', 162, 30, 42, 46); rect(g, '#2a5a8a', 162, 30, 42, 6); rect(g, '#d8f0ff', 165, 32, 20, 2);
      for (let i = 0; i < 3; i++) { const y = 40 + i * 11; rect(g, '#f4ecd8', 166, y, 12, 8); poly(g, '#c8b898', [166, y, 172, y + 5, 178, y]); rect(g, '#9ad0ff', 181, y + 2, 18, 1); rect(g, '#9ad0ff', 181, y + 5, 12, 1); }
      rect(g, '#ff5a5a', 176, 38, 4, 4);
      rect(g, '#141c38', 0, 98, LW, 56); panelWall(g, 0, 102, LW, 46, '#1e2848', 24);
      rect(g, '#1a2244', 94, 98, 34, 26); rect(g, '#2e3a66', 96, 100, 30, 22); monitor(g, 98, 101, 14, 10, '#1a6a9a'); monitor(g, 113, 101, 11, 10, '#1a8a6a');
      for (let i = 0; i < 6; i++) rect(g, ['#ff6a4a', '#ffd070', '#7ae8ff'][i % 3], 99 + i * 4, 115, 2, 2);
      rect(g, '#3a4466', 120, 112, 2, 8); ell(g, '#ff4a4a', 121, 111, 2, 2);
      lighter(g, () => glow(g, 208, 104, 20, '#80e0ff', 0.4));
      rect(g, '#141c38', 194, 92, 28, 26); rect(g, '#0a2a3a', 196, 94, 24, 22);
      hexes(g, 208, 105, 14, '#b8f4ff', 0.85);
      perspFloor(g, 154, '#2a3352', '#0e1226', '#d8b868', 0.25);
      rect(g, '#2a2a3a', 98, 170, 28, 3); rect(g, '#1a1a2a', 100, 173, 2, 8); rect(g, '#1a1a2a', 122, 173, 2, 8);
      rect(g, '#5a4a30', 100, 152, 20, 18); rect(g, '#f4f0e6', 102, 154, 16, 14); rect(g, '#c8b898', 102, 154, 16, 2);
      for (let i = 0; i < 4; i++) rect(g, '#8a8aa0', 104, 158 + i * 3, 10 - (i % 2) * 3, 1);
      rect(g, '#c0c0c8', 106, 151, 8, 3);
      rect(g, '#1a2244', 110, 164, 16, 6); rect(g, '#5ac8f0', 111, 165, 14, 4);
      rect(g, '#2a3252', 194, 136, 30, 46); rect(g, '#3a4466', 196, 138, 26, 42); rect(g, '#5af0ff', 196, 137, 26, 1);
      ell(g, '#0a0e1c', 208, 181, 9, 2);
      if (!live) X.S.sprite('arlan', 'down', 0, 208, 182);
    },
    decor(g, t) {
      for (let i = 0; i < 6; i++) if (Math.sin(t * 3 + i * 1.3) > 0) lighter(g, () => glow(g, 100 + i * 4, 116, 3, ['#ff6a4a', '#ffd070', '#7ae8ff'][i % 3], 0.9));
      rect(g, rgba('#ffffff', 0.08 + 0.05 * Math.sin(t * 9)), 114, 26 + Math.floor((t * 20) % 54), 92, 1);
      twinkle(g, t, 6, 28, 84, 68, 41, 12); twinkle(g, t, 230, 28, 84, 68, 43, 12);
      if (Math.sin(t * 4) > 0) rect(g, '#ff8a8a', 176, 38, 4, 4);
    },
    life(g, t, X) {
      lighter(g, () => {
        const a = t * 0.5;
        g.strokeStyle = 'rgba(216,244,255,0.8)'; g.lineWidth = 1; g.beginPath();
        const pts = [[-12, 8], [-4, -4], [6, 0], [12, -10], [0, 12]].map(([x, y]) => [144 + x * Math.cos(a) - y * Math.sin(a) * 0.4, 45 + y * Math.cos(a * 0.7) + x * Math.sin(a) * 0.3]);
        g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < 4; i++) g.lineTo(pts[i][0], pts[i][1]); g.moveTo(pts[1][0], pts[1][1]); g.lineTo(pts[4][0], pts[4][1]); g.stroke();
        for (const [x, y] of pts) glow(g, x, y, 3, '#ffffff', 0.8);
        const p = (t * 0.7) % 1; hexes(g, 208, 105, 14 + p * 6, '#b8f4ff', 0.6 * (1 - p));
      });
      X.S.sprite('arlan', ['down', 'left', 'down', 'right'][Math.floor(t / 1.7) % 4], 0, 208, 182);
    }
  };

  S.arlan = {
    title: 'Зона хранения',
    aura: 'elec',
    frags: [
      ['Бинты', 'Раны Арлан считает ерундой и просит не рассказывать о них Асте.'],
      ['Аптечка', 'Арлан бережёт других и забывает о своих ранах.'],
      ['Тревожная лампа', 'Система безопасности отказала, и Легион пришёл почти сразу.'],
      ['Склад диковин', 'Станцию строили как склад диковин Герты. Его Арлан тоже охраняет.'],
      ['Пост охраны', 'Арлан глава Отдела безопасности. Он винит себя, что проглядел Легион.'],
      ['Аста на связи', 'Об Асте Арлан говорит тепло. Она была к нему добра.']
    ],
    paint(g, X) {
      vgrad(g, 0, LH, [[0, '#0e1018'], [0.6, '#1c2030'], [1, '#0a0c14']]);
      rect(g, '#20242e', 0, 0, LW, 22);
      for (let x = 0; x < LW; x += 40) { rect(g, '#3a3e4a', x, 6, 34, 5); rect(g, '#5a5e6a', x, 6, 34, 1); }
      rect(g, '#4a4e5a', 0, 22, LW, 3); rect(g, '#6a6e7a', 0, 22, LW, 1);
      rect(g, '#2a2e3a', 128, 25, 64, 3);
      rect(g, '#3a3e4a', 138, 28, 12, 10); ell(g, '#5a1010', 144, 42, 8, 6); ell(g, '#ff3a2a', 144, 41, 6, 4.5); ell(g, '#ffb0a0', 142, 39, 2, 1.5);
      lighter(g, () => glow(g, 144, 44, 26, '#ff2a1a', 0.5));
      rect(g, '#2a2e3a', 160, 50, 34, 3); rect(g, '#4a4e5a', 160, 50, 34, 1);
      for (const [x, col] of [[164, '#b07aff'], [176, '#7af0c8'], [186, '#ffb050']]) { rect(g, rgba('#a8d8ff', 0.25), x - 3, 30, 8, 20); ell(g, col, x + 1, 40, 2.5, 3); rect(g, '#6a6e7a', x - 4, 29, 10, 2); lighter(g, () => glow(g, x + 1, 40, 8, col, 0.5)); }
      for (const [x, y, w, h, c] of [[2, 40, 50, 46, '#3a3e4c'], [6, 86, 44, 40, '#4a4a58'], [54, 70, 36, 34, '#3e4250'], [52, 104, 40, 50, '#4a4a58'], [228, 40, 46, 50, '#3a3e4c'], [270, 30, 48, 60, '#4a4a58'], [232, 90, 40, 64, '#3e4250'], [274, 92, 46, 62, '#4a4a58']]) crate(g, x, y, w, h, c, '#8a7a4e');
      rect(g, '#16182a', 92, 60, 136, 94); panelWall(g, 92, 62, 136, 90, '#1c2032', 17);
      rect(g, '#5a2020', 92, 60, 136, 2);
      rect(g, '#f0f0f2', 98, 92, 24, 18); rect(g, '#d0d0d8', 98, 107, 24, 3); rect(g, '#2a8a4a', 108, 95, 4, 12); rect(g, '#2a8a4a', 104, 99, 12, 4); rect(g, '#5a5a64', 106, 89, 8, 3);
      rect(g, '#2a2e3a', 194, 92, 30, 28); monitor(g, 196, 94, 12, 10, '#1a5a3a'); monitor(g, 210, 94, 12, 10, '#5a1a1a'); rect(g, '#3a3e4a', 196, 108, 26, 10);
      for (let i = 0; i < 5; i++) rect(g, ['#ff4a4a', '#ffd070', '#4aff8a'][i % 3], 198 + i * 5, 112, 2, 2);
      perspFloor(g, 154, '#2a2e3e', '#0e1018', '#8a7a4e', 0.25);
      for (let x = 0; x < LW; x += 24) poly(g, rgba('#e8c040', 0.35), [x, 154, x + 10, 154, x + 4, 160, x - 6, 160]);
      crate(g, 96, 160, 30, 20, '#3a3e4c', '#8a7a4e');
      rect(g, '#f4f0e8', 100, 154, 10, 6); ell(g, '#e8e4dc', 105, 157, 5, 3); ell(g, '#c8c4bc', 105, 157, 2, 1.5);
      g.strokeStyle = '#f4f0e8'; g.lineWidth = 2; g.beginPath(); g.moveTo(110, 158); g.quadraticCurveTo(118, 150, 124, 160); g.stroke();
      rect(g, '#2a2e3a', 200, 154, 16, 26); rect(g, '#1a1c26', 206, 178, 4, 4);
      monitor(g, 194, 140, 28, 22, '#16304a', '#4a4e5a');
      X.S.bust('asta', 208, 160, 20);
      rect(g, rgba('#80c8ff', 0.18), 196, 142, 24, 18);
    },
    decor(g, t) {
      const a = 0.5 + 0.5 * Math.sin(t * 6);
      lighter(g, () => glow(g, 144, 44, 22 + a * 10, '#ff2a1a', 0.3 + a * 0.3));
      for (let i = 0; i < 6; i++) if (hx(i, Math.floor(t * 10), 3) > 0.7) rect(g, rgba('#c8f0ff', 0.6), 196 + Math.floor(hx(i, 2, Math.floor(t * 10)) * 24), 142 + Math.floor(hx(i, 3, Math.floor(t * 10)) * 18), 2, 1);
      K.sparks(g, t, 228, 64, 6, 7, '#ffd070', 14);
      rect(g, rgba('#ffffff', 0.12), 196, 142 + Math.floor((t * 24) % 18), 24, 1);
    },
    life(g, t) {
      lighter(g, () => {
        g.save(); g.translate(144, 44);
        for (const s of [0, Math.PI]) { g.save(); g.rotate(t * 2.4 + s); g.fillStyle = 'rgba(255,60,40,0.16)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(150, -16); g.lineTo(150, 16); g.closePath(); g.fill(); g.restore(); }
        g.restore();
      });
      if (Math.sin(t * 7) > 0.2) rect(g, rgba('#ffffff', 0.25), 196, 142, 24, 18);
      lighter(g, () => { const f = Math.floor(t * 9); if (hx(f, 4, 13) > 0.5) { g.strokeStyle = 'rgba(190,150,255,0.85)'; g.lineWidth = 1; g.beginPath(); let x = 98 + hx(f, 5, 13) * 26, y = 112; g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (hx(s, f, 17) - 0.5) * 8; y += 4; g.lineTo(x, y); } g.stroke(); } });
    }
  };

  S.herta = {
    title: 'Хранилище диковин',
    aura: 'puppet',
    frags: [
      ['Кукла', 'Кукла Герты. Ростом она меньше тебя, как заметила Химико.'],
      ['Витрина с диковинами', 'Диковины Герты. Она берётся только за то, что ей интересно.'],
      ['Номер 83', 'Герта состоит в Обществе гениев. Её номер 83.'],
      ['Модель станции', 'Станция «Герта» одно из её брошенных увлечений.'],
      ['Запасные куклы', 'Сама Герта приходит редко. Чаще присылает куклу.'],
      ['Новая загадка', 'Ей интересно, как Стелларон оказался в живом теле.']
    ],
    paint(g, X, live) {
      hertaWall(g);
      rect(g, '#1a1028', 0, 0, LW, 18); rect(g, '#c9a45c', 0, 17, LW, 2);
      for (let i = 0; i < 4; i++) { const x = 30 + i * 80; ell(g, '#2a1a3a', x, 18, 14, 4); lighter(g, () => glow(g, x, 22, 30, '#c8a0ff', 0.25)); }
      rect(g, '#3a2a14', 130, 30, 30, 26); rect(g, '#e0b860', 131, 31, 28, 24); rect(g, '#2a1c3a', 134, 34, 22, 18);
      g.font = 'bold 13px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f4dc98'; g.fillText('83', 145, 44);
      for (let i = 0; i < 5; i++) { ell(g, '#c8a050', 132 + i * 2, 54 - i * 4, 2, 1); ell(g, '#c8a050', 158 - i * 2, 54 - i * 4, 2, 1); }
      rect(g, '#2a1c3a', 160, 56, 34, 4); rect(g, '#c9a45c', 160, 56, 34, 1);
      ell(g, rgba('#c8e8ff', 0.22), 177, 42, 13, 15); rect(g, rgba('#c8e8ff', 0.22), 164, 42, 26, 14);
      g.save(); g.translate(177, 46); g.scale(0.22, 0.22); K.hertaStation(g, 0, 0, 1, 0); g.restore();
      rect(g, rgba('#ffffff', 0.35), 168, 32, 1, 18); rect(g, '#5a4a6a', 166, 55, 22, 2);
      for (const [x, y, w, h] of [[8, 60, 34, 52], [46, 70, 30, 44], [234, 60, 32, 52], [272, 70, 34, 44]]) {
        rect(g, '#2a1c3a', x - 2, y + h, w + 4, 30); rect(g, '#c9a45c', x - 2, y + h, w + 4, 2);
        rect(g, rgba('#c8e0ff', 0.14), x, y, w, h); rect(g, rgba('#ffffff', 0.3), x + 2, y + 2, 1, h - 4);
        const col = ['#7af0c8', '#ffb050', '#ff7ab0', '#9a8aff'][Math.floor(hx(x, y, 3) * 4)];
        poly(g, col, [x + w / 2, y + h - 22, x + w / 2 + 7, y + h - 12, x + w / 2, y + h - 2, x + w / 2 - 7, y + h - 12]);
        lighter(g, () => glow(g, x + w / 2, y + h - 12, 14, col, 0.45));
      }
      rect(g, '#2a1c3a', 96, 118, 30, 30); rect(g, '#c9a45c', 96, 118, 30, 2);
      rect(g, rgba('#c8e0ff', 0.16), 98, 92, 26, 26); rect(g, '#c9a45c', 97, 91, 28, 1); rect(g, rgba('#ffffff', 0.35), 100, 94, 1, 22);
      poly(g, '#ffd060', [104, 108, 111, 98, 118, 108, 111, 114]); poly(g, '#fff0b0', [106, 107, 111, 100, 111, 112]);
      lighter(g, () => glow(g, 111, 106, 14, '#ffd060', 0.5));
      perspFloor(g, 154, '#2a1a40', '#0e0818', '#c9a45c', 0.22);
      ell(g, '#3a2050', 153, 206, 92, 16); ell(g, rgba('#c8a0ff', 0.2), 153, 204, 84, 12);
      ell(g, '#0a0612', 112, 180, 11, 2.5);
      X.S.sprite('herta', 'down', 0, 112, 180);
      rect(g, '#2a1c3a', 192, 116, 32, 4); rect(g, '#c9a45c', 192, 116, 32, 1);
      if (!live) { X.S.sprite('herta', 'down', 0, 202, 116); X.S.sprite('herta', 'left', 0, 216, 116); }
      rect(g, '#3a2a4a', 198, 172, 22, 8); ell(g, '#5a4a6a', 209, 172, 11, 3); ell(g, '#7af0ff', 209, 171, 6, 2);
      lighter(g, () => { g.fillStyle = 'rgba(122,240,255,0.16)'; g.beginPath(); g.moveTo(203, 171); g.lineTo(196, 146); g.lineTo(222, 146); g.lineTo(215, 171); g.closePath(); g.fill(); });
      ell(g, rgba('#9af0ff', 0.55), 209, 150, 4, 4); rect(g, rgba('#9af0ff', 0.55), 205, 154, 8, 12);
      lighter(g, () => glow(g, 209, 158, 5, '#e8ffff', 0.9));
    },
    decor(g, t) {
      for (const [x, y, w, h] of [[8, 60, 34, 52], [46, 70, 30, 44], [234, 60, 32, 52], [272, 70, 34, 44]]) lighter(g, () => glow(g, x + w / 2, y + h - 12, 10 + 3 * Math.sin(t * 2 + x), ['#7af0c8', '#ffb050', '#ff7ab0', '#9a8aff'][Math.floor(hx(x, y, 3) * 4)], 0.35));
      lighter(g, () => glow(g, 111, 106, 10 + 3 * Math.sin(t * 3), '#ffd060', 0.4));
      rect(g, rgba('#9af0ff', 0.12 + 0.1 * Math.sin(t * 11)), 196, 146 + Math.floor((t * 16) % 24), 26, 1);
    },
    life(g, t, X) {
      const dirs = ['down', 'right', 'up', 'left'];
      X.S.sprite('herta', dirs[Math.floor(t * 6) % 4], 0, 202, 116);
      X.S.sprite('herta', dirs[Math.floor(t * 6 + 2) % 4], 0, 216, 116);
      lighter(g, () => { const a = t * 1.5; for (let i = 0; i < 6; i++) { const q = a + i * 1.05; rect(g, rgba('#9af0ff', 0.8), Math.floor(209 + Math.cos(q) * 10), Math.floor(158 + Math.sin(q) * 3), 1, 1); } glow(g, 209, 158, 6 + 2 * Math.sin(t * 4), '#e8ffff', 0.8); });
    }
  };

  function house(g, x, base, w, h, col, mode, roof, seed) {
    const lit = mode === 'n' ? '#ffd070' : mode === 's' ? '#fff0c0' : '#ffe4a0', sh = (c, k) => G.shade(c, k);
    rect(g, col, x, base - h, w, h);
    rect(g, sh(col, -0.25), x + w - 4, base - h, 4, h);
    poly(g, sh(col, -0.35), [x - 3, base - h, x + w / 2, base - h - (roof || 14), x + w + 3, base - h]);
    poly(g, mode === 's' ? '#f8f0e0' : '#f0f4fa', [x - 3, base - h, x + w / 2, base - h - (roof || 14), x + w + 3, base - h, x + w / 2, base - h - (roof || 14) + 4]);
    rect(g, sh(col, 0.2), x - 2, base - h + 2, w + 4, 2);
    const cols = Math.max(1, Math.floor((w - 6) / 10)), rows = Math.max(1, Math.floor((h - 14) / 16));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const on = hx(x + c + (seed || 0), r, 3) > (mode === 'n' ? 0.35 : 0.5);
      rect(g, on ? lit : sh(col, -0.5), x + 5 + c * 10, base - h + 10 + r * 16, 5, 8);
      rect(g, '#f4f8fc', x + 4 + c * 10, base - h + 18 + r * 16, 7, 1);
    }
  }
  function street(g, mode, y0, seed) {
    const pal = mode === 'n' ? ['#1c2438', '#242c44', '#1a2032', '#2a3048'] : mode === 's' ? ['#9a7a64', '#b08a6a', '#8a6a58', '#a8826a'] : ['#6a7890', '#7a8498', '#5e6a80', '#8a90a4'];
    let x = -6;
    for (let i = 0; x < LW + 10; i++) {
      const w = 34 + Math.floor(hx(i, 1, seed) * 24), h = 50 + Math.floor(hx(i, 2, seed) * 60);
      house(g, x, y0, w, h, pal[i % 4], mode, 12 + hx(i, 3, seed) * 10, seed);
      x += w + 4;
    }
  }
  function lamppost(g, x, y, h, col) {
    rect(g, '#1a1a22', x - 1, y - h, 2, h); rect(g, '#2a2a34', x - 4, y - h - 4, 8, 5); rect(g, col || '#ffe8a0', x - 2, y - h + 1, 4, 3);
    lighter(g, () => glow(g, x, y - h + 2, 16, col || '#ffe8a0', 0.45));
  }
  function snowFloor(g, y0, warm) {
    vgrad(g, y0, LH, warm ? [[0, '#f0e4d4'], [1, '#c8b8a8']] : [[0, '#dce6f0'], [1, '#aab8cc']]);
    for (let i = 0; i < 26; i++) ell(g, rgba(warm ? '#b89a80' : '#8a9ab8', 0.28), hx(i, 3, 7) * LW, y0 + 6 + hx(i, 4, 7) * (LH - y0 - 6), 14 + hx(i, 5, 7) * 30, 2 + hx(i, 6, 7) * 3);
    rect(g, warm ? '#fff8ec' : '#f4f8fc', 0, y0, LW, 3);
  }
  function woodWall(g, top, bot, plank, seam) {
    vgrad(g, 0, LH, [[0, top], [1, bot]]);
    for (let x = 0; x < LW; x += 22) { rect(g, plank, x, 24, 20, 136); rect(g, seam, x + 20, 24, 2, 136); rect(g, rgba('#ffffff', 0.05), x, 24, 1, 136); }
  }
  function plankFloor(g, y0, a, b, seam) {
    vgrad(g, y0, LH, [[0, a], [1, b]]);
    g.strokeStyle = seam; g.lineWidth = 1;
    for (let i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(153 + i * 16, y0); g.lineTo(153 + i * 54, LH); g.stroke(); }
  }
  function flame(g, x, y, s, col, hi) {
    poly(g, col, [x, y - 10 * s, x + 5 * s, y - 2 * s, x + 4 * s, y + 4 * s, x, y + 6 * s, x - 4 * s, y + 4 * s, x - 5 * s, y - 2 * s]);
    poly(g, hi, [x, y - 5 * s, x + 2.5 * s, y + 1 * s, x, y + 4 * s, x - 2.5 * s, y + 1 * s]);
  }
  function hangLamp(g, x, y, len, shade, light) {
    rect(g, '#2a1a0e', x, 0, 1, y - len + len);
    poly(g, shade, [x - 7, y + 6, x + 8, y + 6, x + 4, y, x - 3, y]);
    ell(g, light, x + 0.5, y + 7, 4, 2);
    lighter(g, () => { glow(g, x + 0.5, y + 8, 26, light, 0.55); g.fillStyle = rgba(light, 0.08); g.beginPath(); g.moveTo(x - 7, y + 6); g.lineTo(x - 30, y + 70); g.lineTo(x + 31, y + 70); g.lineTo(x + 8, y + 6); g.closePath(); g.fill(); });
  }

  S.natasha = {
    title: 'Клиника Подземья',
    aura: 'heal',
    frags: [
      ['Кушетка', 'Здесь ты {очнулся|очнулась} после побега и {проспал|проспала} целые сутки.'],
      ['Шкаф с лекарствами', 'Лекарств в Подземье вечно не хватает.'],
      ['Лампа', 'Врач в Подземье она одна. Свет в клинике горит допоздна.'],
      ['Вывеска клиники', 'Клиника Наташи в Городке Булыжник.'],
      ['Знамя «Дикого огня»', '«Дикий огонь» возглавляет Наташа. Олег её заместитель.'],
      ['Пациенты', 'Люди в Подземье часто болеют. Наташа принимает всех.']
    ],
    paint(g, X, live) {
      woodWall(g, '#1a0e08', '#3a2414', '#4a2e1a', '#3a2212');
      rect(g, '#2a1a0e', 0, 0, LW, 24); rect(g, '#6a4a2a', 0, 22, LW, 3);
      for (const x of [40, 120, 200, 280]) rect(g, '#3a2414', x, 0, 8, 24);
      rect(g, '#2a1a0e', 226, 40, 64, 56); rect(g, '#6a4a2a', 224, 38, 68, 3); rect(g, '#6a4a2a', 224, 95, 68, 3);
      clipRect(g, 228, 42, 60, 52, () => { vgrad(g, 42, 94, [[0, '#0c0604'], [1, '#3a2414']], 228, 60); for (let i = 0; i < 4; i++) { const hx0 = 230 + i * 15, hh = 20 + hx(i, 1, 3) * 16; rect(g, '#5a3a24', hx0, 94 - hh, 13, hh); rect(g, '#ffb050', hx0 + 4, 94 - hh + 6, 4, 4); } });
      rect(g, '#6a4a2a', 257, 40, 2, 56);
      hangLamp(g, 144, 34, 34, '#2a3a2a', '#ffd890');
      rect(g, '#2a1a0e', 175, 26, 2, 10);
      rect(g, '#3a2414', 162, 34, 30, 24); rect(g, '#f0ece2', 164, 36, 26, 20); rect(g, '#2a8a4a', 175, 38, 4, 16); rect(g, '#2a8a4a', 169, 44, 16, 4);
      rect(g, '#2a1a0e', 94, 86, 34, 38); rect(g, '#6a4a2a', 94, 86, 34, 2);
      for (let s = 0; s < 3; s++) { rect(g, '#5a3a24', 96, 96 + s * 10, 30, 1); for (let i = 0; i < 5; i++) { const c = ['#8ac8a0', '#e8e0c8', '#c86a4a', '#6aa0d8', '#d8c870'][(i + s) % 5]; rect(g, c, 98 + i * 6, 89 + s * 10, 4, 7); rect(g, rgba('#ffffff', 0.4), 98 + i * 6, 89 + s * 10, 1, 7); } }
      rect(g, rgba('#c8e0ff', 0.15), 95, 87, 32, 36); rect(g, '#6a4a2a', 110, 87, 2, 36);
      rect(g, '#6a1818', 196, 84, 26, 34); rect(g, '#9a2a24', 198, 84, 22, 32); poly(g, '#9a2a24', [198, 116, 209, 122, 220, 116]);
      flame(g, 209, 100, 1.2, '#ffb040', '#fff0a0'); rect(g, '#2a1a0e', 194, 82, 30, 3);
      plankFloor(g, 156, '#4a2e1a', '#2a180c', rgba('#000000', 0.25));
      rect(g, '#5a3a24', 96, 166, 32, 4); rect(g, '#3a2414', 98, 170, 3, 10); rect(g, '#3a2414', 124, 170, 3, 10);
      rect(g, '#e8e4dc', 96, 158, 32, 8); rect(g, '#c8c0b0', 96, 164, 32, 2); rect(g, '#f8f4ec', 97, 154, 10, 6); rect(g, '#a8c8e0', 110, 158, 18, 6);
      rect(g, '#5a3a24', 190, 168, 34, 4); rect(g, '#3a2414', 192, 172, 3, 8); rect(g, '#3a2414', 220, 172, 3, 8);
      if (!live) { X.S.sprite('miner', 'left', 0, 200, 168); X.S.sprite('kid', 'left', 0, 216, 170); }
      rect(g, '#3a2414', 20, 120, 60, 6); rect(g, '#5a3a24', 20, 120, 60, 2); rect(g, '#2a1a0e', 24, 126, 4, 34); rect(g, '#2a1a0e', 72, 126, 4, 34);
      rect(g, '#e8e0c8', 30, 114, 18, 6); rect(g, '#c8b898', 52, 112, 8, 8); rect(g, '#8a8a90', 62, 110, 10, 10); ell(g, '#5a5a60', 67, 110, 5, 2);
      rect(g, '#4a2e1a', 296, 104, 22, 56); rect(g, '#5a3a24', 298, 106, 18, 52); ell(g, '#d8b060', 300, 134, 1.5, 1.5);
    },
    decor(g, t) {
      lighter(g, () => glow(g, 144.5, 42, 22 + 2 * Math.sin(t * 9) + Math.sin(t * 23) * 1.2, '#ffd890', 0.3));
      K.smoke(g, t, 67, 106, 3, 8, '#e8e0d0', 0.3);
      lighter(g, () => { for (let i = 0; i < 10; i++) { const ph = (t * 0.05 + hx(i, 2, 7)) % 1; rect(g, rgba('#ffe8c0', 0.5 * Math.sin(ph * Math.PI)), Math.floor(120 + hx(i, 3, 7) * 50), Math.floor(50 + ph * 100), 1, 1); } });
      lighter(g, () => glow(g, 209, 100, 10 + 2 * Math.sin(t * 7), '#ffb040', 0.35));
    },
    life(g, t, X) {
      clipRect(g, 228, 42, 60, 52, () => { for (let i = 0; i < 4; i++) if (Math.sin(t * 1.3 + i * 2) > -0.2) lighter(g, () => glow(g, 236 + i * 15, 94 - 14 - hx(i, 1, 3) * 10, 4, '#ffb050', 0.8)); });
      X.S.sprite('miner', Math.sin(t * 0.7) > 0 ? 'left' : 'down', 0, 200, 168); X.S.sprite('kid', Math.sin(t * 1.1 + 1) > 0.3 ? 'up' : 'left', Math.floor(t * 2) % 2, 216, 170);
      flame(g, 209, 100, 1.2 + 0.08 * Math.sin(t * 8), '#ffc050', '#fff0a0');
    }
  };

  S.serval = {
    title: 'Мастерская «Нейвервинтер»',
    aura: 'notes',
    frags: [
      ['Обогреватель', 'Сломанный уличный обогреватель. С него и началось ваше знакомство.'],
      ['Геоядро', 'Обогреватели Белобога работают на геоядре из Подземья.'],
      ['Вывеска', 'Мастерская «Нейвервинтер». Хозяйка здесь Сервал.'],
      ['Чертежи', 'Когда-то она была среди Архитекторов, пока Коколия её не выгнала.'],
      ['Гитара', 'Гитара Сервал всегда под рукой.'],
      ['Медиатор', 'Медиатор Сервал. На нём выцарапано «Г.».']
    ],
    paint(g) {
      woodWall(g, '#1c1814', '#3a2c20', '#3a2c20', '#2a2018');
      rect(g, '#2a2018', 0, 0, LW, 24); rect(g, '#8a7050', 0, 22, LW, 2);
      rect(g, '#141824', 8, 34, 70, 52); rect(g, '#8a7050', 6, 32, 74, 3); rect(g, '#8a7050', 6, 85, 74, 3);
      clipRect(g, 10, 36, 66, 48, () => { vgrad(g, 36, 84, [[0, '#6a7890'], [1, '#c8d4e4']], 10, 66); house(g, 12, 84, 26, 30, '#7a8498', 'd', 10, 3); house(g, 44, 84, 30, 38, '#6a7890', 'd', 10, 5); });
      rect(g, '#8a7050', 42, 34, 2, 52);
      rect(g, '#2a2420', 230, 34, 80, 60); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) rect(g, '#1a1612', 234 + i * 12, 38 + j * 14, 2, 2);
      for (const [x, y, w, h] of [[236, 44, 4, 26], [248, 40, 10, 4], [262, 46, 3, 22], [272, 42, 12, 12], [290, 48, 4, 24], [240, 76, 20, 4]]) rect(g, '#8a8e96', x, y, w, h);
      rect(g, '#3a2414', 128, 30, 32, 24); rect(g, '#5a3a24', 129, 31, 30, 22); rect(g, '#d8b060', 129, 31, 30, 1);
      ring(g, '#d8c070', 2, 137, 42, 5); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; rect(g, '#d8c070', 137 + Math.cos(a) * 7 - 1, 42 + Math.sin(a) * 7 - 1, 2, 2); }
      for (let i = 0; i < 3; i++) rect(g, '#e8dcc0', 146, 36 + i * 5, 10 - i * 2, 2);
      rect(g, '#2a1a0e', 143, 26, 1, 5); rect(g, '#2a1a0e', 152, 26, 1, 5);
      for (const [x, y, w, h, r] of [[162, 32, 18, 22, -0.08], [176, 36, 16, 20, 0.1]]) {
        g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(r);
        rect(g, '#2a4a8a', -w / 2, -h / 2, w, h); rect(g, rgba('#ffffff', 0.6), -w / 2 + 2, -h / 2 + 3, w - 4, 1);
        g.strokeStyle = 'rgba(220,236,255,0.8)'; g.lineWidth = 1; g.strokeRect(-w / 2 + 3.5, -h / 2 + 6.5, w - 8, h - 10);
        g.beginPath(); g.arc(0, 2, 3, 0, Math.PI * 2); g.stroke();
        rect(g, '#c83a3a', -1, -h / 2 - 1, 2, 2);
        g.restore();
      }
      rect(g, '#3a2c20', 94, 118, 34, 4); rect(g, '#8a7050', 94, 118, 34, 1);
      rect(g, rgba('#c8e0ff', 0.25), 102, 94, 18, 24); rect(g, '#6a6a72', 100, 92, 22, 3); rect(g, '#6a6a72', 100, 116, 22, 2);
      poly(g, '#ff6a2a', [104, 114, 108, 100, 112, 96, 116, 104, 118, 114]); poly(g, '#ffc070', [107, 112, 110, 101, 113, 104, 115, 112]);
      lighter(g, () => glow(g, 111, 106, 16, '#ff7a30', 0.55));
      g.save(); g.translate(208, 106); g.rotate(-0.35);
      rect(g, '#2a2420', -1, -30, 3, 22); rect(g, '#e8e8f0', -0.5, -30, 1, 22);
      rect(g, '#1a1a22', -2, -34, 5, 5);
      ell(g, '#e8eaf4', 0, -2, 7, 6); ell(g, '#e8eaf4', 1, 7, 9, 8); ell(g, '#3553c9', 1, 7, 6, 5); ell(g, '#e8eaf4', 1, 7, 3, 2);
      rect(g, '#2a2420', -1, -6, 3, 14); rect(g, '#d8b060', -3, 10, 7, 1);
      g.restore();
      plankFloor(g, 156, '#4a3a2c', '#261c14', rgba('#000000', 0.22));
      ell(g, '#5a2a24', 153, 206, 90, 16);
      rect(g, '#5a5a64', 100, 146, 22, 34); rect(g, '#7a7a84', 102, 146, 8, 34); rect(g, '#3a3a44', 100, 146, 22, 3); ell(g, '#8a8a94', 111, 146, 11, 3);
      for (let y = 152; y < 176; y += 3) rect(g, '#2a2a30', 104, y, 15, 1);
      rect(g, '#ff7a3a', 106, 162, 10, 6); rect(g, '#3a3a44', 112, 158, 4, 8);
      line(g, '#ffd070', 1, 120, 150, 126, 145);
      rect(g, '#1a1a1e', 196, 154, 28, 26); rect(g, '#3a3a40', 198, 156, 24, 18); ell(g, '#2a2a30', 210, 165, 8, 8); ell(g, '#5a5a64', 210, 165, 3.5, 3.5);
      for (let k = 0; k < 4; k++) ell(g, '#d8d0b0', 201 + k * 6, 177, 1.2, 1.2);
      poly(g, '#e0b040', [206, 152, 214, 152, 210, 158]); rect(g, '#2a1a0e', 209, 154, 1, 1);
      g.strokeStyle = '#1a1a1e'; g.lineWidth = 1; g.beginPath(); g.moveTo(222, 170); g.quadraticCurveTo(232, 140, 214, 116); g.stroke();
      rect(g, '#6a4a2e', 4, 126, 80, 10); rect(g, '#8a6a44', 4, 126, 80, 2); rect(g, '#4a3420', 8, 136, 5, 26); rect(g, '#4a3420', 74, 136, 5, 26);
      for (const [x, c] of [[12, '#4a6a8a'], [28, '#c8a060'], [46, '#c83a2a'], [62, '#6a6a72']]) rect(g, c, x, 118, 12, 8);
      hangLamp(g, 54, 26, 0, '#2a2420', '#ffd08a');
    },
    decor(g, t) {
      K.sparks(g, t, 40, 120, 8, 3, '#ffd070', 16);
      lighter(g, () => { glow(g, 54.5, 34, 20 + 2 * Math.sin(t * 8), '#ffd08a', 0.3); glow(g, 111, 165, 12 + 3 * Math.sin(t * 2), '#ff7a3a', 0.4); glow(g, 111, 106, 12 + 3 * Math.sin(t * 3), '#ff7a30', 0.35); });
    },
    life(g, t) {
      lighter(g, () => {
        const v = Math.sin(t * 30) * 1.2;
        g.strokeStyle = 'rgba(200,230,255,0.7)'; g.lineWidth = 1;
        for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(200 + i, 74 + i * 0.4); g.quadraticCurveTo(205 + v * (i % 2 ? 1 : -1), 92, 210 + i, 110); g.stroke(); }
        const p = 0.5 + 0.5 * Math.sin(t * 12);
        glow(g, 210, 165, 10 + p * 6, '#9ad0ff', 0.3);
        g.strokeStyle = rgba('#9ad0ff', 0.5 * p); g.beginPath(); g.arc(210, 165, 9 + p * 3, 0, Math.PI * 2); g.stroke();
      });
      for (let i = 0; i < 4; i++) { const ph = (t * 0.3 + i / 4) % 1, x = Math.round(214 + Math.sin(ph * 6 + i) * 10 + ph * 20), y = Math.round(150 - ph * 60); rect(g, rgba('#ffe8a0', Math.sin(ph * Math.PI)), x, y, 3, 2); rect(g, rgba('#ffe8a0', Math.sin(ph * Math.PI)), x + 2, y - 6, 1, 7); }
    }
  };

  S.gepard = {
    title: 'Ворота Белобога',
    aura: 'ice',
    frags: [
      ['Щит', 'Щит Среброгривых стражей. Гепард не сдаётся даже побеждённым.'],
      ['Пост у ворот', 'По уставу солдат ждёт на посту, если приказы расходятся.'],
      ['Стена Белобога', 'Архитекторы построили город под защитой Клипота Сохраняющего.'],
      ['Знамя Среброгривых', 'Присяга Среброгривых велит беречь народ Белобога.'],
      ['Кулак мерзлоты', 'Удар Гепарда замораживает врага.'],
      ['Стражи', 'Гепард открыл ворота. Стражи задержат чудовищ.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, 150, [[0, '#6a7c9c'], [0.6, '#b8c6da'], [1, '#e0e8f2']]);
      for (let l = 0; l < 2; l++) { g.fillStyle = ['#9aaac4', '#b4c2d6'][l]; g.beginPath(); g.moveTo(0, 130); for (let x = 0; x <= LW; x += 10) g.lineTo(x, 70 + l * 16 - hx(x, l, 5) * 26 - Math.sin(x * 0.03 + l) * 8); g.lineTo(LW, 130); g.fill(); }
      rect(g, '#5a6478', 0, 66, LW, 84); rect(g, '#6a7488', 0, 62, LW, 6);
      for (let x = 0; x < LW; x += 12) rect(g, '#5a6478', x, 56, 7, 7);
      for (let x = 0; x < LW; x += 16) for (let y = 74; y < 146; y += 9) rect(g, rgba('#000000', 0.12), x + ((y / 9) % 2) * 8, y, 14, 1);
      for (const tx of [20, 252]) { rect(g, '#4a5468', tx, 30, 44, 120); poly(g, '#3a4458', [tx - 4, 30, tx + 22, 8, tx + 48, 30]); poly(g, '#eef2f8', [tx - 4, 30, tx + 22, 8, tx + 48, 30, tx + 22, 13]); for (let i = 0; i < 3; i++) rect(g, '#ffd880', tx + 8 + i * 12, 46, 4, 6); }
      rect(g, '#3a4458', 126, 30, 34, 36); for (let x = 126; x < 160; x += 8) rect(g, '#3a4458', x, 24, 5, 7);
      rect(g, '#2a3040', 136, 38, 4, 16); ell(g, '#ffb040', 138, 36, 3, 4); ell(g, '#fff0a0', 138, 36, 1.5, 2);
      lighter(g, () => glow(g, 138, 36, 16, '#ffb040', 0.5));
      rect(g, '#2a3040', 176, 22, 2, 40);
      if (!live) gepardBanner(g, 0);
      rect(g, '#2a2a34', 132, 88, 44, 62); ell(g, '#2a2a34', 154, 88, 22, 16);
      clipRect(g, 136, 80, 36, 70, () => { vgrad(g, 70, 150, [[0, '#ffd890'], [1, '#fff0d0']], 136, 36); for (let i = 0; i < 3; i++) house(g, 136 + i * 13, 150, 11, 26 + i * 8, '#c8a080', 's', 6, i); });
      rect(g, '#5a6478', 134, 88, 3, 62); rect(g, '#5a6478', 171, 88, 3, 62);
      lighter(g, () => glow(g, 154, 118, 40, '#ffd890', 0.4));
      rect(g, '#3a4458', 98, 96, 26, 30); poly(g, '#2a3448', [95, 96, 111, 86, 127, 96]); poly(g, '#eef2f8', [95, 96, 111, 86, 127, 96, 111, 90]);
      rect(g, '#1a2030', 104, 104, 14, 14); rect(g, '#ffd880', 106, 106, 10, 6); rect(g, '#2d5bd3', 98, 120, 26, 3);
      rect(g, '#d8b050', 120, 100, 2, 8); ell(g, '#ffe8a0', 121, 109, 2, 2);
      for (const [x, y, h] of [[196, 108, 16], [204, 100, 22], [212, 106, 14], [218, 112, 10], [200, 116, 8]]) { poly(g, '#a8e0f8', [x, y + h, x + 3, y, x + 6, y + h]); rect(g, '#f0fcff', x + 2, y + 3, 1, h - 4); }
      lighter(g, () => glow(g, 207, 110, 18, '#bfefff', 0.45));
      snowFloor(g, 150, false);
      ell(g, '#8a9ab8', 112, 180, 14, 3);
      poly(g, '#e8ecf4', [100, 150, 124, 150, 126, 166, 112, 182, 98, 166]); poly(g, '#2d5bd3', [103, 153, 121, 153, 122, 165, 112, 177, 102, 165]);
      poly(g, '#d8b050', [112, 156, 117, 164, 112, 172, 107, 164]); rect(g, '#d8b050', 100, 150, 24, 2);
      rect(g, '#f4f8fc', 98, 178, 30, 3);
      X.S.sprite('guard', 'down', 0, 200, 176); X.S.sprite('guard', 'left', 0, 216, 172);
      for (const [x, y] of [[60, 190], [270, 196], [300, 170]]) { poly(g, '#c8d4e4', [x - 10, y, x, y - 5, x + 12, y]); }
    },
    decor(g, t) {
      K.snowfall(g, t, 90, 61, { speed: 22, wind: 12, a: 0.85 });
      lighter(g, () => glow(g, 138, 36, 12 + 3 * Math.sin(t * 9) + Math.sin(t * 21), '#ffb040', 0.4));
      lighter(g, () => glow(g, 154, 118, 30 + 4 * Math.sin(t * 1.5), '#ffd890', 0.2));
    },
    life(g, t) {
      const w = Math.sin(t * 3);
      gepardBanner(g, w);
      K.snowfall(g, t, 70, 63, { speed: 60, wind: 120, streak: true, a: 0.5 });
      for (const [x, y, d] of [[200, 152, 0], [216, 148, 1.3]]) { const ph = ((t + d) % 2.6) / 2.6; if (ph < 0.5) ell(g, rgba('#ffffff', 0.5 * (1 - ph * 2)), x + 4 + ph * 8, y - ph * 6, 2 + ph * 6, 1.5 + ph * 3); }
    }
  };

  S.bronya = {
    title: 'Монумент Вечной зимы',
    aura: 'wind',
    frags: [
      ['Медаль', 'Свою медаль Броня отдала мальчишке из развалин.'],
      ['Старая игрушка', 'Игрушка из приюта. Броня выросла там, пока её не взяла к себе Коколия.'],
      ['Клипотов форт', 'Резиденция Верховного хранителя. Здесь жила её мать.'],
      ['Монумент', 'Монумент Вечной зимы. Здесь Броня приняла присягу.'],
      ['Письмо', 'Письмо Брони. Она хотела честно поговорить с матерью.'],
      ['Присяга', 'Броня стала девятнадцатым Верховным хранителем Белобога.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, 170, [[0, '#e88a60'], [0.45, '#f8c890'], [1, '#fff0d0']]);
      lighter(g, () => glow(g, 250, 60, 120, '#fff0c0', 0.5));
      g.fillStyle = '#c89a8a'; g.beginPath(); g.moveTo(96, 90); g.lineTo(110, 66); g.lineTo(128, 60); g.lineTo(166, 60); g.lineTo(180, 70); g.lineTo(190, 90); g.fill();
      rect(g, '#9a7a8a', 132, 36, 22, 30); poly(g, '#7a5a6a', [128, 36, 143, 18, 158, 36]); rect(g, '#9a7a8a', 124, 46, 8, 20); rect(g, '#9a7a8a', 154, 46, 8, 20);
      poly(g, '#7a5a6a', [122, 46, 128, 36, 134, 46]); poly(g, '#7a5a6a', [152, 46, 158, 36, 164, 46]);
      for (let i = 0; i < 3; i++) rect(g, '#fff0b0', 138 + i * 5, 42, 2, 4); ell(g, '#fff0b0', 143, 30, 2, 2);
      lighter(g, () => glow(g, 143, 40, 20, '#fff0c0', 0.35));
      street(g, 's', 170, 21);
      rect(g, rgba('#fff0d0', 0.18), 0, 60, LW, 110);
      for (const lx of [40, 132, 250, 300]) lamppost(g, lx, 170, 32, '#fff0b0');
      poly(g, '#6a5a4a', [168, 170, 186, 170, 182, 60, 172, 60]); rect(g, '#8a7a6a', 172, 60, 3, 110);
      rect(g, '#5a4a3a', 162, 150, 30, 20); rect(g, '#8a7a6a', 160, 148, 34, 3); rect(g, '#7a6a5a', 166, 120, 22, 4);
      g.strokeStyle = '#6a5a4a'; g.lineWidth = 4; g.beginPath(); g.arc(177, 44, 13, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; rect(g, '#6a5a4a', 177 + Math.cos(a) * 16 - 2, 44 + Math.sin(a) * 16 - 2, 4, 4); }
      for (const [dx, h, w] of [[-4, 30, 6], [3, 24, 5], [-9, 18, 4], [8, 16, 4]]) poly(g, '#7ad0f0', [177 + dx, 60 - h, 177 + dx + w, 60 - h + 7, 177 + dx + w - 1, 60, 177 + dx - 1, 60]);
      rect(g, '#d8f8ff', 175, 34, 1, 22);
      lighter(g, () => glow(g, 177, 46, 18, '#7ad8ff', 0.35));
      snowFloor(g, 170, true);
      rect(g, '#6a4a3a', 96, 118, 32, 3); rect(g, '#8a6a4a', 96, 118, 32, 1); rect(g, '#4a3428', 98, 121, 3, 12); rect(g, '#4a3428', 123, 121, 3, 12); rect(g, '#5a3a2c', 96, 110, 32, 3);
      ell(g, '#b8865a', 110, 112, 5, 5); ell(g, '#b8865a', 110, 104, 4, 4); ell(g, '#b8865a', 106, 100, 1.6, 1.6); ell(g, '#b8865a', 114, 100, 1.6, 1.6); rect(g, '#1a1010', 108, 103, 1, 1); rect(g, '#1a1010', 111, 103, 1, 1); ell(g, '#e8c8a0', 110, 113, 2.5, 2.5); rect(g, '#3a72d8', 107, 107, 6, 1);
      ell(g, '#b89a80', 112, 176, 10, 2);
      rect(g, '#d83040', 108, 160, 4, 8); rect(g, '#3a72d8', 112, 160, 3, 8); ell(g, '#e0b848', 111, 172, 5, 5); ell(g, '#fff0a0', 110, 171, 2.5, 2.5); rect(g, '#a88a30', 109, 174, 4, 1);
      lighter(g, () => glow(g, 111, 172, 9, '#ffe080', 0.45));
      rect(g, '#2a2a34', 206, 96, 3, 74); rect(g, '#3a3a48', 200, 104, 15, 18); rect(g, '#f4ecdc', 202, 106, 11, 8); poly(g, '#d8c8a8', [202, 106, 207.5, 110, 213, 106]); ell(g, '#c83a3a', 207.5, 111, 1.6, 1.6);
      if (!live) { X.S.sprite('townsman', 'up', 0, 198, 174); X.S.sprite('miner', 'up', 0, 212, 176); X.S.sprite('townswoman', 'up', 0, 224, 172); }
    },
    decor(g, t) {
      K.snowfall(g, t, 50, 71, { speed: 14, wind: 6, a: 0.7 });
      lighter(g, () => { glow(g, 177, 46, 14 + 3 * Math.sin(t * 2), '#7ad8ff', 0.3); for (const lx of [40, 132, 250, 300]) glow(g, lx, 140, 10 + 2 * Math.sin(t * 3 + lx), '#fff0b0', 0.25); });
    },
    life(g, t, X) {
      lighter(g, () => { for (let i = 0; i < 6; i++) { g.save(); g.translate(250, 60); g.rotate(0.9 + i * 0.22 + Math.sin(t * 0.5) * 0.04); rect(g, rgba('#fff4d0', 0.07), 0, -3, 320, 6); g.restore(); } });
      X.S.sprite('townsman', 'up', Math.floor(t * 2) % 2, 198, 174); X.S.sprite('miner', Math.sin(t) > 0.6 ? 'left' : 'up', 0, 212, 176); X.S.sprite('townswoman', 'up', Math.floor(t * 2 + 1) % 2, 224, 172);
    }
  };

  function rockCeiling(g, seed, c1, c2) {
    for (let i = 0; i < 26; i++) { const x = i * 13 - 6, h = 14 + hx(i, seed, 41) * 34; poly(g, i % 2 ? c1 : c2, [x, 0, x + 17, 0, x + 11, h, x + 4, h * 0.8]); }
  }
  function pipe(g, x0, y0, x1, y1, w, col) {
    g.strokeStyle = '#140c10'; g.lineWidth = w + 2; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    g.strokeStyle = col; g.lineWidth = w; g.stroke();
    g.strokeStyle = rgba('#ffffff', 0.18); g.lineWidth = 1; g.beginPath(); g.moveTo(x0, y0 - w / 2 + 1); g.lineTo(x1, y1 - w / 2 + 1); g.stroke();
  }
  function butterfly(g, x, y, s, col, flap) {
    const f = flap == null ? 1 : flap;
    poly(g, col, [x, y, x - 5 * s * f, y - 5 * s, x - 6 * s * f, y + 1 * s, x - 2 * s * f, y + 2 * s]);
    poly(g, col, [x, y, x + 5 * s * f, y - 5 * s, x + 6 * s * f, y + 1 * s, x + 2 * s * f, y + 2 * s]);
    poly(g, rgba('#ffffff', 0.5), [x, y, x - 3 * s * f, y - 3 * s, x - 1 * s * f, y]);
    rect(g, '#1a1030', x, y - 2 * s, 1, 4 * s);
  }
  function gear(g, x, y, r, col, teeth, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    for (let k = 0; k < teeth; k++) { const a = k / teeth * Math.PI * 2; g.save(); g.rotate(a); rect(g, col, -r * 0.16, -r - r * 0.22, r * 0.32, r * 0.3); g.restore(); }
    ell(g, col, 0, 0, r, r); ell(g, G.shade(col, -0.35), 0, 0, r * 0.55, r * 0.55); ell(g, G.shade(col, 0.3), 0, 0, r * 0.2, r * 0.2);
    g.restore();
  }
  function lantern(g, x, y, s, body, light) {
    rect(g, '#2a1a10', x - 0.5, y - 8 * s, 1, 6 * s);
    ell(g, body, x, y + 2 * s, 5 * s, 6 * s); rect(g, '#d8b050', x - 3 * s, y - 3 * s, 6 * s, 1.5 * s); rect(g, '#d8b050', x - 3 * s, y + 7 * s, 6 * s, 1.5 * s);
    rect(g, '#f0c040', x - 0.5, y + 8 * s, 1, 4 * s);
    lighter(g, () => glow(g, x, y + 2 * s, 12 * s, light, 0.5));
  }
  function cloud(g, x, y, s, col, hi) {
    for (const [dx, dy, r] of [[-10, 2, 7], [-3, -2, 9], [7, 0, 8], [13, 3, 5]]) ell(g, col, x + dx * s, y + dy * s, r * s, r * s * 0.75);
    for (const [dx, dy, r] of [[-4, -4, 5], [6, -3, 4]]) ell(g, hi, x + dx * s, y + dy * s, r * s, r * s * 0.6);
  }

  S.seele = {
    title: 'Ночь в Подземье',
    aura: 'butterfly',
    frags: [
      ['Припасы', 'Зеле ходила за припасами в Заклёпочный городок.'],
      ['Фонари Булыжника', 'Городок Булыжник. Дом Зеле в Подземье.'],
      ['Своды Подземья', 'Неба в Подземье нет. Только своды и свет ламп.'],
      ['Закрытый проход', 'Надземье отозвало стражей и закрыло проход. Зеле это помнит.'],
      ['Знак «Дикого огня»', 'Зеле из «Дикого огня». Олега она зовёт шефом.'],
      ['Бабочка и лезвие', 'Её абсолютная техника. Бабочки слетаются к лезвию косы.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#08040e'], [0.5, '#1c1030'], [1, '#2a1a24']]);
      rockCeiling(g, 1, '#120a18', '#1a1022');
      for (const [y, c] of [[30, '#3a2a3a'], [40, '#2e2230']]) { rect(g, c, 0, y, LW, 5); rect(g, G.shade(c, 0.3), 0, y, LW, 1); }
      rect(g, '#2a1a2a', 143, 0, 2, 34); poly(g, '#3a2a3a', [136, 38, 152, 38, 148, 32, 140, 32]); ell(g, '#ffd890', 144, 40, 4, 2.5);
      lighter(g, () => glow(g, 144, 42, 22, '#ffc070', 0.55));
      rect(g, '#1a1220', 160, 22, 34, 30); rect(g, '#3a2e44', 162, 24, 30, 26);
      for (let x = 165; x < 192; x += 6) rect(g, '#5a4a64', x, 24, 2, 26);
      rect(g, '#5a4a64', 162, 34, 30, 2); rect(g, '#7a6a84', 162, 24, 30, 1);
      poly(g, '#c83a3a', [173, 30, 181, 30, 181, 44, 173, 44]); rect(g, '#2a1a2a', 176, 36, 2, 4);
      line(g, '#6a5a74', 1, 160, 22, 150, 4); line(g, '#6a5a74', 1, 194, 22, 204, 4);
      for (let i = 0; i < 9; i++) {
        const x = i * 36 - 6, h = 44 + hx(i, 2, 43) * 44, y = 166 - h, c = ['#3a2440', '#2e1c34', '#44284a'][i % 3];
        if (x > 100 && x < 200) continue;
        rect(g, c, x, y, 32, h); poly(g, G.shade(c, -0.3), [x - 2, y, x + 16, y - 10, x + 34, y]);
        rect(g, '#ffb050', x + 6, y + 10, 6, 7); rect(g, hx(i, 3, 3) > 0.4 ? '#ffb050' : '#1a1020', x + 20, y + 10, 6, 7); rect(g, '#140c18', x + 12, y + h - 18, 8, 18);
      }
      pipe(g, 0, 60, 96, 60, 5, '#5a4a5a'); pipe(g, 224, 70, LW, 70, 6, '#5a4a5a'); pipe(g, 300, 70, 300, 166, 5, '#4a3a4a');
      rect(g, '#2a1a2a', 196, 88, 28, 32); rect(g, '#3a2840', 198, 90, 24, 28);
      flame(g, 210, 104, 1.1, '#ff7a3a', '#ffd070'); rect(g, '#d8b050', 202, 114, 16, 2);
      vgrad(g, 166, LH, [[0, '#3a2830'], [1, '#1a1018']]);
      for (let i = 0; i < 30; i++) rect(g, rgba('#000000', 0.22), hx(i, 1, 44) * LW, 170 + hx(i, 2, 44) * 60, 10, 2);
      lamppost(g, 112, 124, 34, '#ffc070');
      rect(g, '#2a1a20', 104, 120, 16, 4);
      crate(g, 96, 158, 18, 16, '#5a4030', '#8a6a40'); crate(g, 112, 162, 16, 14, '#4a3428', '#8a6a40'); crate(g, 102, 146, 14, 12, '#6a4a34', '#8a6a40');
      g.save(); g.translate(206, 178); g.rotate(-0.25);
      rect(g, '#2a2440', -1, -44, 2, 46); rect(g, '#5a5490', -1, -44, 1, 46);
      poly(g, '#d8d0f8', [-1, -44, 18, -48, 24, -40, 6, -40]); poly(g, '#8a70ea', [2, -42, 20, -46, 22, -42]);
      g.restore();
      if (!live) for (const [x, y, c] of [[196, 150, '#8a6aff'], [222, 140, '#b48aff'], [214, 162, '#6a4ae0']]) butterfly(g, x, y, 1, c, 1);
      lighter(g, () => glow(g, 208, 150, 20, '#9a7aff', 0.4));
    },
    decor(g, t) {
      lighter(g, () => { glow(g, 144, 42, 18 + 2 * Math.sin(t * 7), '#ffc070', 0.3); glow(g, 112, 92, 12 + 2 * Math.sin(t * 5), '#ffc070', 0.3); });
      K.smoke(g, t, 300, 66, 4, 18, '#8a7a8a', 0.3);
      for (let i = 0; i < 3; i++) { const a = t * 1.2 + i * 2, x = 60 + i * 90 + Math.sin(a) * 14, y = 110 + Math.cos(a * 1.3) * 10; butterfly(g, x, y, 0.8, i % 2 ? '#b48aff' : '#8a6aff', 0.4 + 0.6 * Math.abs(Math.sin(t * 8 + i))); }
      flame(g, 210, 104, 1.1 + 0.06 * Math.sin(t * 9), '#ff7a3a', '#ffd070');
    },
    life(g, t) {
      for (let i = 0; i < 9; i++) { const a = t * (0.6 + i * 0.07) + i * 0.7, r = 10 + i * 2.2, x = 208 + Math.cos(a) * r, y = 148 + Math.sin(a * 1.4) * r * 0.5 - i; butterfly(g, x, y, 0.9, ['#8a6aff', '#b48aff', '#6a4ae0'][i % 3], 0.3 + 0.7 * Math.abs(Math.sin(t * 9 + i))); }
      const gl = (t % 3) / 3;
      if (gl < 0.2) lighter(g, () => glow(g, 210 + gl * 60, 136, 6, '#ffffff', 1 - gl * 5));
      lighter(g, () => { for (let i = 0; i < 9; i++) { const x = i * 36 + 10, on = Math.sin(t * 0.9 + i * 2.1) > -0.3; if (x > 100 && x < 200) continue; if (on) glow(g, x, 140, 6, '#ffb050', 0.4); } });
    }
  };

  S.sampo = {
    title: 'Лавка слухов',
    aura: 'coins',
    frags: [
      ['Сугроб', 'В сугробе на окраинах вы его и нашли.'],
      ['Консервы', 'Сампо торгует картами, консервами и слухами.'],
      ['Вывеска со слухами', 'Слухи в Белобоге самый ходовой товар. Скажешь погромче, и они сбываются.'],
      ['Карта', 'Карта Белобога. Сампо продаст и её.'],
      ['Дымовая шашка', 'Сампо утащил вас в дыму, а заодно и Броню.'],
      ['Сейчас рванёт!', 'Абсолютная техника Сампо. Взрыв по всем врагам сразу.']
    ],
    paint(g) {
      vgrad(g, 0, 170, [[0, '#5a6a88'], [1, '#aab8cc']]);
      street(g, 'd', 168, 33);
      lamppost(g, 40, 168, 32); lamppost(g, 290, 168, 32);
      snowFloor(g, 168, false);
      rect(g, '#5a3a24', 92, 100, 4, 72); rect(g, '#5a3a24', 128, 100, 4, 72);
      for (let i = 0; i < 6; i++) poly(g, i % 2 ? '#b02b46' : '#f0e8dc', [88 + i * 8, 96, 96 + i * 8, 96, 98 + i * 8, 106, 90 + i * 8, 106]);
      rect(g, '#5a3a24', 88, 94, 48, 3);
      rect(g, '#6a4a2e', 90, 120, 44, 10); rect(g, '#8a6a44', 90, 120, 44, 2);
      for (const [x, y, c] of [[98, 110, '#c83a3a'], [106, 110, '#3a8ac8'], [114, 110, '#c8a040'], [102, 102, '#3a8ac8'], [110, 102, '#c83a3a'], [122, 112, '#6a9a4a']]) { rect(g, '#8a8a94', x, y, 7, 9); rect(g, c, x, y + 2, 7, 4); ell(g, '#c8c8d0', x + 3.5, y, 3.5, 1); }
      rect(g, '#3a2a1c', 140, 22, 2, 14); rect(g, '#3a2a1c', 130, 34, 30, 2);
      rect(g, '#2a1a10', 132, 36, 26, 20); rect(g, '#f4ead0', 133, 37, 24, 18);
      poly(g, '#ffffff', [136, 40, 148, 40, 148, 47, 142, 47, 139, 50, 139, 47, 136, 47]); g.strokeStyle = '#2a2a34'; g.lineWidth = 1; g.strokeRect(136.5, 40.5, 11, 6);
      rect(g, '#b02b46', 150, 44, 5, 8); rect(g, '#b02b46', 150, 41, 5, 2); rect(g, '#b02b46', 151, 53, 3, 2);
      rect(g, '#5a5e6a', 162, 30, 30, 26); rect(g, '#e8dcc0', 164, 32, 26, 22);
      g.strokeStyle = '#8a6a44'; g.lineWidth = 1; for (const y of [38, 46]) { g.beginPath(); g.moveTo(164, y); g.lineTo(190, y + 2); g.stroke(); } g.beginPath(); g.moveTo(172, 32); g.lineTo(174, 54); g.moveTo(182, 32); g.lineTo(180, 54); g.stroke();
      rect(g, '#5a8ac8', 176, 40, 8, 5); poly(g, '#c83a3a', [168, 48, 171, 44, 174, 48, 171, 52]); rect(g, '#d83030', 185, 34, 2, 2);
      ell(g, '#c8d4e4', 112, 174, 18, 9); ell(g, '#e8eef6', 112, 170, 16, 8); ell(g, '#ffffff', 108, 166, 10, 5);
      rect(g, '#1e1e24', 116, 156, 6, 10); rect(g, '#1e1e24', 116, 154, 10, 4); rect(g, '#2a2a34', 117, 164, 4, 2);
      rect(g, '#5a4030', 196, 112, 22, 10); rect(g, '#7a5a40', 196, 112, 22, 2); rect(g, '#4a3424', 198, 122, 18, 20);
      ell(g, '#3a3a44', 207, 106, 6, 6); rect(g, '#5a5a64', 206, 98, 2, 4); ell(g, '#ffd070', 207, 97, 1.5, 1.5);
      ell(g, rgba('#c8c8d0', 0.75), 214, 94, 8, 6); ell(g, rgba('#e8e8f0', 0.7), 220, 88, 6, 5); ell(g, rgba('#d8d8e0', 0.6), 210, 86, 5, 4);
      rect(g, '#8a2a1a', 196, 160, 28, 18); rect(g, '#c83a2a', 196, 160, 28, 3); rect(g, '#f0d070', 196, 168, 28, 2);
      for (const [x, c] of [[200, '#3a8ac8'], [206, '#d8c040'], [212, '#c83a6a'], [218, '#6ac84a']]) { rect(g, c, x, 146, 3, 14); poly(g, '#f0f0f0', [x - 1, 146, x + 4, 146, x + 1.5, 141]); }
      line(g, '#3a2a1c', 1, 213, 146, 216, 140); lighter(g, () => glow(g, 216, 139, 5, '#ffd070', 0.9));
    },
    decor(g, t) {
      K.snowfall(g, t, 60, 81, { speed: 18, wind: 8, a: 0.75 });
      K.smoke(g, t, 214, 92, 4, 12, '#d8d8e0', 0.4);
      lighter(g, () => glow(g, 216, 139, 4 + 2 * Math.abs(Math.sin(t * 15)), '#ffd070', 0.8));
    },
    life(g, t) {
      for (let k = 0; k < 2; k++) {
        const ph = ((t + k * 1.6) % 3.2) / 3.2, x = 200 + k * 60, peak = 30 + k * 12;
        if (ph < 0.35) { const y = lerp(150, peak, ph / 0.35); lighter(g, () => { rect(g, rgba('#ffe0a0', 0.9), x, Math.floor(y), 1, 4); glow(g, x, y, 3, '#ffd070', 0.8); }); }
        else if (ph < 0.75) { const q = (ph - 0.35) / 0.4; lighter(g, () => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, r = q * 20; rect(g, rgba(['#ff6a8a', '#ffd070', '#7ae8ff'][(i + k) % 3], 1 - q), Math.floor(x + Math.cos(a) * r), Math.floor(peak + Math.sin(a) * r + q * q * 8), 2, 2); } glow(g, x, peak, 18 * (1 - q), '#fff0c0', 0.6 * (1 - q)); }); }
      }
    }
  };

  S.hook = {
    title: 'Логово «Кротов»',
    aura: 'fire',
    frags: [
      ['Бочка', 'Хук скажет, где Сампо, только если выиграть у неё в прятки.'],
      ['Значок «Кротов»', 'Значок банды. Хук однажды потеряла такой же.'],
      ['Флаг «Кротов»', 'Детская банда из Подземья. Предводительница у неё Хук.'],
      ['Фонарь', 'Под землёй без фонаря никуда.'],
      ['Бойцовский клуб', 'Хук привела вас в Бойцовский клуб, где Дань Хэн победил робота.'],
      ['Ура Хук!', '«Ура Хук!» Так Хук вступила в команду.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#0c0806'], [0.55, '#2a1c12'], [1, '#1a120c']]);
      rockCeiling(g, 3, '#1a120c', '#22180e');
      for (let i = 0; i < 7; i++) { const x = i * 48 - 8, w = 44, h = 70 + hx(i, 2, 9) * 30, c = ['#4a3a2c', '#3e3024', '#54402e'][i % 3]; rect(g, c, x, 156 - h, w, h); for (let k = 0; k < 4; k++) rect(g, rgba('#000000', 0.2), x + 2, 156 - h + 8 + k * 16, w - 4, 1); rect(g, rgba('#ffffff', 0.08), x, 156 - h, w, 1); }
      for (const [x, y, w, h, c] of [[10, 60, 30, 24, '#6a5a4a'], [56, 52, 22, 30, '#5a6a6a'], [246, 56, 34, 22, '#6a4a3a'], [284, 64, 28, 30, '#5a5a6a']]) { rect(g, c, x, y, w, h); rect(g, rgba('#000000', 0.25), x, y + h - 3, w, 3); for (let k = 0; k < 3; k++) ell(g, '#8a8a90', x + 4 + k * 10, y + 3, 1, 1); }
      rect(g, '#3a2a1c', 128, 26, 32, 2);
      poly(g, '#e8d070', [130, 28, 158, 28, 156, 56, 146, 52, 132, 56]); poly(g, '#c8a840', [146, 28, 158, 28, 156, 56, 146, 52]);
      ell(g, '#6a5a50', 144, 40, 7, 6); ell(g, '#f4ecdc', 144, 43, 4, 3); ell(g, '#1a1010', 141, 38, 1.2, 1.2); ell(g, '#1a1010', 147, 38, 1.2, 1.2); ell(g, '#e87a8a', 144, 42, 1.5, 1); ell(g, '#5a4a40', 138, 35, 2, 2); ell(g, '#5a4a40', 150, 35, 2, 2);
      rect(g, '#2a1a10', 175, 22, 1, 14); lantern(g, 175.5, 44, 1.6, '#3a2a1c', '#ffb050');
      ell(g, '#ffd080', 175.5, 47, 4, 4);
      rect(g, '#5a3a24', 94, 90, 34, 28); rect(g, '#7a5a3a', 94, 90, 34, 2); for (const [x, y] of [[96, 94], [124, 94], [96, 114], [124, 114]]) rect(g, '#2a1a10', x, y, 2, 2);
      ell(g, '#e2b232', 111, 104, 9, 9); ell(g, '#b08a20', 111, 104, 7, 7); ell(g, '#f4ecdc', 111, 105, 4.5, 3.5); ell(g, '#4b474e', 111, 101, 5, 3); rect(g, '#1a1010', 109, 104, 1, 1); rect(g, '#1a1010', 113, 104, 1, 1);
      rect(g, '#2a1c12', 196, 88, 28, 32); rect(g, '#e8dcc0', 198, 90, 24, 28); rect(g, '#c83a2a', 198, 90, 24, 6);
      rect(g, '#5a5a64', 205, 100, 10, 10); rect(g, '#ff4a3a', 207, 103, 2, 1); rect(g, '#ff4a3a', 211, 103, 2, 1); rect(g, '#5a5a64', 203, 110, 14, 6);
      g.strokeStyle = '#2a1a10'; g.lineWidth = 2; g.beginPath(); g.moveTo(200, 112); g.lineTo(206, 106); g.moveTo(220, 112); g.lineTo(214, 106); g.stroke();
      plankFloor(g, 156, '#3a2a1c', '#1a120a', rgba('#000000', 0.25));
      ell(g, '#120a06', 112, 180, 13, 3);
      rect(g, '#6a4a2a', 101, 150, 22, 30); rect(g, '#8a6a3a', 101, 150, 7, 30); for (const y of [154, 164, 174]) rect(g, '#3a3a40', 100, y, 24, 2);
      ell(g, '#5a3a20', 112, 150, 11, 3); ell(g, '#2a1a10', 112, 150, 9, 2);
      rect(g, '#e9d243', 108, 144, 8, 5); rect(g, '#4b474e', 107, 142, 10, 3);
      if (!live) { X.S.sprite('kid', 'down', 0, 202, 176); X.S.sprite('kid', 'left', 0, 218, 172, ); }
      lighter(g, () => glow(g, 175, 50, 40, '#ffb050', 0.25));
    },
    decor(g, t) {
      lighter(g, () => glow(g, 175.5, 48, 14 + 3 * Math.sin(t * 6) + Math.sin(t * 17), '#ffb050', 0.4));
      lighter(g, () => { for (let i = 0; i < 12; i++) { const ph = (t * 0.06 + hx(i, 2, 11)) % 1; rect(g, rgba('#ffd8a0', 0.45 * Math.sin(ph * Math.PI)), Math.floor(60 + hx(i, 3, 11) * 200), Math.floor(60 + ph * 100), 1, 1); } });
      if (Math.sin(t * 3) > 0.7) { rect(g, '#ff8a7a', 207, 103, 2, 1); rect(g, '#ff8a7a', 211, 103, 2, 1); }
    },
    life(g, t, X) {
      const j1 = Math.abs(Math.sin(t * 6)) * 4, j2 = Math.abs(Math.sin(t * 6 + 1.6)) * 4;
      ell(g, '#120a06', 202, 177, 6, 1.5); ell(g, '#120a06', 218, 173, 6, 1.5);
      X.S.sprite('kid', 'down', Math.floor(t * 6) % 2, 202, 176 - Math.round(j1)); X.S.sprite('kid', 'left', Math.floor(t * 6 + 1) % 2, 218, 172 - Math.round(j2));
      lighter(g, () => { for (let i = 0; i < 8; i++) { const ph = (t * 0.9 + i / 8) % 1; rect(g, rgba(['#ffd070', '#ff8a5a', '#7ae8ff'][i % 3], 1 - ph), Math.floor(196 + hx(i, 1, 3) * 30), Math.floor(150 - ph * 30), 2, 2); } });
    }
  };

  S.pela = {
    title: 'Штаб разведки',
    aura: 'ice',
    frags: [
      ['Документы', 'Офицер разведки Среброгривых. Бумаги у неё в образцовом порядке.'],
      ['Папки с делами', 'Архив разведки Среброгривых стражей.'],
      ['Карта Белобога', '«Путешествие по истории Белобога». Экскурсию ведёт Пела.'],
      ['Окно в метель', 'Откуда взялась Вечная зима, учёные Белобога не знают до сих пор.'],
      ['Снимок у монумента', '«Сфотографируете меня у монумента? Хороший кадр».'],
      ['Шестерня', 'Шестерня на монументе означает знание и силу промышленности.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#1a2034'], [0.6, '#2a3250'], [1, '#141a2a']]);
      for (let x = 0; x < LW; x += 16) rect(g, rgba('#ffffff', 0.04), x, 22, 1, 134);
      rect(g, '#141a2a', 0, 0, LW, 20); rect(g, '#d2aa52', 0, 19, LW, 2);
      rect(g, '#e8e4dc', 126, 26, 36, 32); rect(g, '#c8c0b0', 126, 26, 36, 2);
      clipRect(g, 128, 29, 32, 28, () => {
        vgrad(g, 29, 57, [[0, '#d8e4ec'], [1, '#c8d4dc']], 128, 32);
        g.strokeStyle = '#7a8aa0'; g.lineWidth = 1; g.beginPath(); g.ellipse(144, 43, 12, 10, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(144, 43, 6, 5, 0, 0, Math.PI * 2); g.stroke();
        for (const [x, y] of [[140, 36], [150, 46], [134, 48], [146, 42]]) rect(g, '#5a6a80', x, y, 3, 2);
        rect(g, '#d83030', 145, 41, 2, 2); rect(g, '#2d6bd2', 136, 34, 2, 2); rect(g, '#d83030', 152, 50, 2, 2);
      });
      rect(g, '#3a3020', 162, 24, 32, 34); rect(g, '#d2aa52', 162, 24, 32, 1);
      clipRect(g, 164, 26, 28, 30, () => { vgrad(g, 26, 56, [[0, '#5a6a88'], [1, '#c8d4e4']], 164, 28); for (let i = 0; i < 3; i++) house(g, 164 + i * 10, 56, 8, 10 + i * 4, '#7a8498', 'd', 4, i); });
      rect(g, '#3a3020', 177, 24, 2, 34); rect(g, '#3a3020', 162, 40, 32, 2);
      rect(g, '#2a2418', 94, 86, 34, 36); rect(g, '#d2aa52', 94, 86, 34, 1);
      for (let s = 0; s < 3; s++) { rect(g, '#5a4a30', 95, 97 + s * 12, 32, 1); for (let i = 0; i < 6; i++) { const c = ['#2d6bd2', '#e8e4dc', '#c8a050', '#5a7a5a'][(i + s) % 4]; rect(g, c, 97 + i * 5, 88 + s * 12, 4, 9); rect(g, rgba('#000000', 0.2), 97 + i * 5, 95 + s * 12, 4, 2); } }
      rect(g, '#2a2418', 194, 92, 30, 24); rect(g, '#d2aa52', 195, 93, 28, 22); rect(g, '#f8f0e0', 197, 95, 24, 18);
      clipRect(g, 198, 96, 22, 14, () => { vgrad(g, 96, 110, [[0, '#f8c890'], [1, '#fff0d0']], 198, 22); g.strokeStyle = '#6a5a4a'; g.lineWidth = 1.5; g.beginPath(); g.arc(214, 102, 4, 0, Math.PI * 2); g.stroke(); poly(g, '#7ad0f0', [214, 98, 216, 104, 213, 106]); ell(g, '#35358e', 204, 102, 2, 2); rect(g, '#f0f0f2', 202, 104, 4, 5); rect(g, '#1c1c24', 202, 99, 4, 2); });
      perspFloor(g, 154, '#3a3020', '#1a140c', '#d2aa52', 0.18);
      rect(g, '#5a4028', 60, 150, 120, 8); rect(g, '#7a5a38', 60, 150, 120, 2); rect(g, '#4a3420', 64, 158, 6, 24); rect(g, '#4a3420', 170, 158, 6, 24);
      for (let i = 0; i < 4; i++) { rect(g, '#f4f0e6', 98 + i, 142 - i * 2, 22, 8); rect(g, rgba('#000000', 0.12), 98 + i, 149 - i * 2, 22, 1); }
      rect(g, '#2d6bd2', 102, 134, 14, 1); rect(g, '#8a8aa0', 102, 137, 10, 1);
      rect(g, '#5a3a20', 120, 140, 6, 8); ell(g, '#c83a3a', 123, 148, 4, 1.5); rect(g, '#2a2420', 121, 136, 4, 4);
      ell(g, '#f0ece2', 104, 148, 4, 1.2); ell(g, '#c83a3a', 104, 148, 2.5, 0.8);
      ell(g, '#5a4a3a', 208, 172, 12, 2);
      if (!live) { gear(g, 208, 160, 10, '#8a7a6a', 10, 0); for (const [dx, h] of [[-3, 14], [2, 10]]) poly(g, '#7ad0f0', [208 + dx, 160 - h, 208 + dx + 3, 160 - h + 4, 208 + dx + 2, 160, 208 + dx - 1, 160]); }
      rect(g, '#2a2418', 196, 170, 24, 3);
      rect(g, '#2a2418', 230, 60, 80, 90); for (let s = 0; s < 4; s++) { rect(g, '#5a4a30', 232, 80 + s * 20, 76, 2); for (let i = 0; i < 12; i++) rect(g, ['#2d6bd2', '#e8e4dc', '#c8a050'][(i + s) % 3], 234 + i * 6, 64 + s * 20, 5, 15); }
      lamppost(g, 140, 136, 0, '#ffe8a0');
    },
    decor(g, t) {
      clipRect(g, 164, 26, 28, 30, () => K.snowfall(g, t, 30, 91, { speed: 30, wind: 40, streak: true, a: 0.8 }));
      lighter(g, () => glow(g, 140, 134, 14 + 2 * Math.sin(t * 6), '#ffe8a0', 0.3));
      lighter(g, () => glow(g, 208, 156, 10 + 2 * Math.sin(t * 2), '#7ad8ff', 0.3));
    },
    life(g, t) {
      clipRect(g, 164, 26, 28, 30, () => { K.snowfall(g, t, 60, 93, { speed: 50, wind: 120, streak: true, a: 0.9 }); K.flash(g, '#e8f0f8', 0.1 + 0.08 * Math.sin(t * 1.7)); });
      gear(g, 208, 160, 10, '#8a7a6a', 10, t * 0.6);
      for (const [dx, h] of [[-3, 14], [2, 10]]) poly(g, '#7ad0f0', [208 + dx, 160 - h, 208 + dx + 3, 160 - h + 4, 208 + dx + 2, 160, 208 + dx - 1, 160]);
      const p = (t * 0.5) % 1; if (p < 0.12) rect(g, rgba('#ffffff', 0.5 * (1 - p / 0.12)), 197, 95, 24, 18);
    }
  };

  S.clara = {
    title: 'Поселение Сварога',
    aura: 'svarog',
    frags: [
      ['Магнитные буры', 'Клара собирала магнитные буры. Сварог хранит об этом записи.'],
      ['Шестерни', 'Роботы Сварога взяли зону добычи под контроль.'],
      ['Ядро печи', 'Сварог ушёл с Кларой защищать Ядро печи.'],
      ['Архив Сварога', 'Из архива ясно: учёные давно знали, откуда все беды.'],
      ['Модуль памяти', 'Удалить записи о Кларе Сварог отказался. Это память о семье.'],
      ['Сварог', 'Клара и Сварог лучшие друзья. Он её не обидит.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#0a0a0e'], [0.6, '#1c1618'], [1, '#2a2020']]);
      for (let i = 0; i < 4; i++) { const x = 20 + i * 76, r = 14 + (i % 2) * 8; if (x > 110 && x < 200) continue; gear(g, x, 40 + (i % 2) * 14, r, '#2e2e38', 10, 0); }
      for (const y of [80, 92]) { rect(g, '#4a3a34', 0, y, LW, 5); rect(g, '#6a5a4a', 0, y, LW, 1); }
      rect(g, '#2a2224', 126, 24, 36, 34); rect(g, '#3a3034', 128, 26, 32, 30); ell(g, '#ff7a30', 144, 42, 11, 10); ell(g, '#ffd080', 144, 42, 7, 6); ell(g, '#fff8e0', 144, 42, 3, 3);
      lighter(g, () => glow(g, 144, 42, 30, '#ff7a30', 0.6));
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; rect(g, '#5a4a44', 144 + Math.cos(a) * 14 - 1.5, 42 + Math.sin(a) * 13 - 1.5, 3, 3); }
      rect(g, '#141418', 162, 26, 32, 30); rect(g, '#2a0a0a', 164, 28, 28, 26);
      for (let i = 0; i < 6; i++) rect(g, rgba('#ff4030', 0.85 - i * 0.1), 166, 31 + i * 4, 6 + Math.floor(hx(i, 1, 7) * 18), 1);
      rect(g, '#ff6a50', 166, 52, 3, 1);
      rect(g, '#2a2224', 94, 86, 34, 36);
      if (!live) { gear(g, 104, 98, 8, '#6a5a50', 9, 0.2); gear(g, 118, 108, 6, '#7a6a5a', 8, 0.5); gear(g, 106, 114, 4, '#5a4a44', 7, 0); }
      vgrad(g, 156, LH, [[0, '#3a3034'], [1, '#18141a']]);
      for (let x = 0; x < LW; x += 24) rect(g, '#2a2226', x, 156, 1, 84);
      rect(g, '#2a2224', 0, 120, 92, 36); rect(g, '#ff7a30', 18, 132, 50, 18); rect(g, '#ffd080', 24, 136, 38, 10);
      lighter(g, () => glow(g, 43, 140, 40, '#ff6a20', 0.45));
      for (const [x, y] of [[100, 172], [108, 166], [116, 172], [112, 158], [104, 160], [120, 164]]) { poly(g, '#8a8e96', [x - 4, y + 6, x + 4, y + 6, x, y - 4]); poly(g, '#c8ccd4', [x - 1, y + 4, x + 1, y + 4, x, y - 2]); rect(g, '#d84030', x - 4, y + 5, 8, 2); }
      X.S.foe('svarog_b', 262, 214, 120);
      ell(g, '#2a3a4a', 206, 104, 9, 9); ell(g, '#40c8ff', 206, 104, 6, 6); ell(g, '#d8f8ff', 205, 103, 2.5, 2.5);
      rect(g, '#5a6a7a', 198, 96, 16, 2); rect(g, '#5a6a7a', 198, 112, 16, 2);
      lighter(g, () => glow(g, 206, 104, 16, '#40c8ff', 0.5));
    },
    decor(g, t) {
      lighter(g, () => { glow(g, 144, 42, 22 + 4 * Math.sin(t * 5), '#ff7a30', 0.35); glow(g, 43, 140, 30 + 5 * Math.sin(t * 3), '#ff6a20', 0.3); });
      K.sparks(g, t, 43, 132, 8, 9, '#ffb060', 20);
      for (let i = 0; i < 6; i++) rect(g, rgba('#ff4030', 0.4 + 0.4 * Math.sin(t * 6 + i)), 166, 31 + i * 4, 4, 1);
      lighter(g, () => glow(g, 206, 104, 12 + 3 * Math.sin(t * 2.5), '#40c8ff', 0.35));
    },
    life(g, t) {
      gear(g, 104, 98, 8, '#6a5a50', 9, 0.2 + t); gear(g, 118, 108, 6, '#7a6a5a', 8, 0.5 - t * 1.33); gear(g, 106, 114, 4, '#5a4a44', 7, t * 2);
      lighter(g, () => { const sx = 250 + Math.sin(t * 0.8) * 30; g.fillStyle = 'rgba(255,46,142,0.14)'; g.beginPath(); g.moveTo(262, 107); g.lineTo(sx - 30, 230); g.lineTo(sx + 30, 230); g.closePath(); g.fill(); });
    }
  };

  S.ruanmei = {
    title: 'Лунное окно',
    aura: 'petal',
    frags: [
      ['Пирожные', 'Жуань Мэй не откажется от пирожного к чаю.'],
      ['Пяльцы', 'Вышивка на пяльцах. Стежок к стежку, без спешки.'],
      ['Ветка сливы', 'Белая слива цветёт под луной.'],
      ['Луна', 'Полная луна в круглом окне.'],
      ['Пробирки', 'Образцы. Жуань Мэй всегда возьмёт образец.'],
      ['Лепестки на воде', 'Лепестки на воде, отдых во сне. Её абсолютная техника.']
    ],
    paint(g) {
      vgrad(g, 0, LH, [[0, '#0c1a20'], [0.6, '#16303a'], [1, '#0a1418']]);
      for (let x = 0; x < LW; x += 18) rect(g, rgba('#000000', 0.15), x, 0, 1, 156);
      ell(g, '#1a2a30', 160, 66, 64, 64); ell(g, '#3a5a5a', 160, 66, 60, 60); ell(g, '#dcb75c', 160, 66, 57, 57);
      g.save(); g.beginPath(); g.arc(160, 66, 55, 0, Math.PI * 2); g.clip();
      vgrad(g, 10, 122, [[0, '#0a1430'], [1, '#2a4a6a']], 100, 120);
      for (let i = 0; i < 40; i++) rect(g, rgba('#e8f0ff', 0.3 + 0.6 * hx(i, 3, 5)), 105 + Math.floor(hx(i, 1, 5) * 110), 12 + Math.floor(hx(i, 2, 5) * 100), 1, 1);
      lighter(g, () => glow(g, 176, 44, 30, '#fff8e0', 0.5));
      ell(g, '#f8f4e0', 176, 44, 11, 11); ell(g, '#e8e0c4', 179, 41, 3, 2); ell(g, '#e8e0c4', 172, 47, 2, 2);
      g.strokeStyle = rgba('#3a5a5a', 0.85); g.lineWidth = 1;
      for (let k = -4; k <= 4; k++) { g.beginPath(); g.moveTo(160 + k * 12, 10); g.lineTo(160 + k * 12, 122); g.stroke(); g.beginPath(); g.moveTo(100, 66 + k * 12); g.lineTo(220, 66 + k * 12); g.stroke(); }
      g.restore();
      g.strokeStyle = '#3a2a24'; g.lineWidth = 3; g.beginPath(); g.moveTo(96, 30); g.quadraticCurveTo(124, 40, 150, 34); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.moveTo(130, 37); g.quadraticCurveTo(140, 48, 156, 52); g.stroke(); g.beginPath(); g.moveTo(140, 35); g.lineTo(148, 26); g.stroke();
      for (const [x, y] of [[132, 36], [140, 30], [150, 34], [147, 26], [144, 46], [154, 52], [124, 40], [136, 44]]) { ell(g, '#f8f4f0', x, y, 2.5, 2.5); ell(g, '#f7c9d4', x, y, 1, 1); }
      rect(g, '#2a3a3a', 0, 128, LW, 4); rect(g, '#dcb75c', 0, 128, LW, 1);
      for (const x of [10, 34, 58]) { rect(g, '#1c3a3a', x, 40, 22, 86); rect(g, '#dcb75c', x, 40, 22, 1); rect(g, '#dcb75c', x, 125, 22, 1); g.strokeStyle = rgba('#dcb75c', 0.45); g.lineWidth = 1; g.strokeRect(x + 3.5, 44.5, 15, 77); }
      ell(g, '#f7c9d4', 22, 70, 5, 4); ell(g, '#f8f4f0', 46, 92, 4, 3); ell(g, '#f7c9d4', 64, 60, 4, 3);
      g.strokeStyle = '#3a2a24'; g.lineWidth = 1; g.beginPath(); g.moveTo(14, 110); g.quadraticCurveTo(30, 80, 46, 92); g.quadraticCurveTo(58, 72, 70, 58); g.stroke();
      for (const [x, y] of [[262, 90], [292, 80]]) { rect(g, '#2a1a10', x, 20, 1, y - 26); ell(g, '#c83a3a', x + 0.5, y, 6, 8); rect(g, '#dcb75c', x - 4, y - 8, 9, 2); rect(g, '#dcb75c', x - 4, y + 7, 9, 2); rect(g, '#f0c040', x, y + 9, 1, 6); lighter(g, () => glow(g, x + 0.5, y, 16, '#ff9a6a', 0.45)); }
      rect(g, '#2a1a14', 250, 116, 50, 12); rect(g, '#4a2a20', 254, 104, 14, 12); ell(g, '#e8e0d0', 261, 104, 7, 2); ell(g, '#6a4a3a', 286, 108, 8, 8); rect(g, '#3a5a2a', 284, 96, 4, 8); ell(g, '#f8f4f0', 283, 94, 3, 2); ell(g, '#f7c9d4', 290, 92, 3, 2);
      rect(g, '#5a3a2a', 100, 88, 3, 34); rect(g, '#5a3a2a', 120, 88, 3, 34); rect(g, '#5a3a2a', 98, 120, 28, 3);
      ell(g, '#8a5a3a', 112, 100, 11, 11); ell(g, '#f4f0e8', 112, 100, 9, 9);
      for (const [x, y, c] of [[109, 98, '#3f8f9b'], [114, 102, '#f7c9d4'], [112, 96, '#dcb75c']]) ell(g, c, x, y, 2, 2);
      g.strokeStyle = '#2e7f8b'; g.lineWidth = 1; g.beginPath(); g.moveTo(106, 104); g.quadraticCurveTo(110, 99, 117, 103); g.stroke();
      rect(g, '#2a2420', 194, 104, 30, 4); rect(g, '#dcb75c', 194, 104, 30, 1);
      for (let i = 0; i < 5; i++) { const x = 197 + i * 6, c = ['#7af0c8', '#ff9ab0', '#9ad0ff', '#f0e070', '#c8a0ff'][i]; rect(g, rgba('#e8f8ff', 0.4), x, 88, 4, 16); rect(g, c, x, 96, 4, 8); rect(g, '#5a4a40', x - 1, 87, 6, 2); }
      lighter(g, () => glow(g, 208, 98, 16, '#9af0e0', 0.35));
      plankFloor(g, 156, '#24343a', '#0e181c', rgba('#000000', 0.25));
      rect(g, '#4a2a20', 94, 166, 34, 4); rect(g, '#6a4030', 94, 166, 34, 1); rect(g, '#3a2018', 98, 170, 3, 10); rect(g, '#3a2018', 121, 170, 3, 10);
      ell(g, '#f4f0e8', 111, 164, 12, 3);
      for (const [x, c] of [[104, '#f7c9d4'], [111, '#f8f0d8'], [118, '#c8e8d0']]) { ell(g, c, x, 160, 3.5, 3); ell(g, '#ffffff', x - 1, 159, 1, 1); }
      rect(g, '#dcb75c', 110, 154, 2, 3);
      ell(g, '#1a2a2a', 208, 168, 17, 6); ell(g, '#3a7a7a', 208, 167, 15, 5); ell(g, '#8ad8d0', 208, 166, 12, 3.5);
      for (const [x, y] of [[202, 166], [212, 165], [208, 168]]) { ell(g, '#f8f0f2', x, y, 2, 1.2); ell(g, '#f7c9d4', x, y, 0.8, 0.6); }
    },
    decor(g, t) {
      for (let i = 0; i < 10; i++) { const ph = (t * 0.08 + hx(i, 1, 51)) % 1, x = 100 + hx(i, 2, 51) * 140 + Math.sin(t + i) * 8, y = 30 + ph * 140; rect(g, rgba(i % 2 ? '#f8f4f0' : '#f7c9d4', Math.sin(ph * Math.PI) * 0.9), Math.floor(x), Math.floor(y), 2, 1); }
      lighter(g, () => glow(g, 176, 44, 26 + 2 * Math.sin(t * 0.7), '#fff8e0', 0.2));
      lighter(g, () => { for (let i = 0; i < 3; i++) { const ph = (t * 0.4 + i / 3) % 1; g.strokeStyle = rgba('#d8fff8', 0.5 * (1 - ph)); g.lineWidth = 1; g.beginPath(); g.ellipse(208, 166, 4 + ph * 10, 1 + ph * 3, 0, 0, Math.PI * 2); g.stroke(); } });
    },
    life(g, t) {
      g.save(); g.beginPath(); g.arc(160, 66, 55, 0, Math.PI * 2); g.clip();
      const cx = ((t * 6) % 160) + 90; cloud(g, cx, 52, 0.8, rgba('#8aa0c0', 0.5), rgba('#c8d8f0', 0.4));
      g.restore();
      for (let i = 0; i < 5; i++) { const ph = (t * 0.6 + i / 5) % 1; rect(g, rgba(['#7af0c8', '#ff9ab0', '#9ad0ff', '#f0e070', '#c8a0ff'][i], 1 - ph), 198 + i * 6, Math.floor(102 - ph * 8), 1, 1); }
      for (let i = 0; i < 4; i++) { const a = t * 0.5 + i * 1.6, x = 208 + Math.cos(a) * 9, y = 166 + Math.sin(a) * 2.5; ell(g, '#f8f0f2', x, y, 2, 1.2); }
    }
  };

  S.bailu = {
    title: 'Аптечная терраса на Лофу',
    aura: 'heal',
    frags: [
      ['Тыква эликсира', '«Тыква эликсира!» Раз за бой Байлу не даёт союзнику пасть.'],
      ['Шкаф с травами', 'Сотни ящичков с травами. Байлу знает, что лежит в каждом.'],
      ['Облака Лофу', 'Песнь среди облаков. Так зовётся её лечащий навык.'],
      ['Фонари', 'Красные фонари Сяньчжоу «Лофу».'],
      ['Зонтик', 'Прогулка под дождём. Её техника дарит Оживление всей команде.'],
      ['Громовой прыжок', 'Благодатный громовой прыжок. Её абсолютная техника.']
    ],
    paint(g) {
      vgrad(g, 0, 160, [[0, '#4a8ac8'], [0.6, '#a8d0e8'], [1, '#e8f0e0']]);
      for (const [x, y, s] of [[40, 70, 1.4], [260, 50, 1.6], [300, 100, 1.2], [150, 100, 1.1]]) cloud(g, x, y, s, '#f4f8fc', '#ffffff');
      for (const [x, h] of [[20, 70], [60, 50], [250, 60], [290, 80]]) { rect(g, '#8aa0b0', x, 140 - h, 18, h); poly(g, '#5a7a8a', [x - 6, 140 - h, x + 9, 140 - h - 10, x + 24, 140 - h]); }
      cloud(g, 144, 46, 1.1, '#ffffff', '#f4f8ff');
      poly(g, '#8a5a3a', [130, 38, 158, 38, 154, 44, 134, 44]); rect(g, '#c83a2a', 140, 32, 8, 6); poly(g, '#d8b048', [138, 32, 150, 32, 144, 28]);
      rect(g, '#7a1a1a', 0, 0, LW, 14); poly(g, '#5a1010', [0, 14, LW, 14, LW, 20, 0, 20]);
      for (let x = 0; x < LW; x += 10) rect(g, '#d8b048', x, 18, 6, 2);
      poly(g, '#7a1a1a', [-10, 0, 20, 0, -10, 30]); poly(g, '#7a1a1a', [330, 0, 300, 0, 330, 30]);
      for (const x of [168, 186]) { rect(g, '#2a1a10', x, 20, 1, 10); lantern(g, x + 0.5, 38, 1.3, '#d82a2a', '#ff8a5a'); }
      for (const x of [2, 222]) { rect(g, '#8a2a20', x, 20, 10, 140); rect(g, '#b83a2a', x + 2, 20, 3, 140); }
      rect(g, '#5a3a24', 92, 84, 36, 40); rect(g, '#7a5030', 92, 84, 36, 2);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { rect(g, '#9a6a40', 94 + c * 8, 87 + r * 9, 7, 8); rect(g, '#d8b048', 97 + c * 8, 90 + r * 9, 2, 1); }
      rect(g, '#8a5a3a', 0, 140, LW, 20); rect(g, '#b07a4a', 0, 140, LW, 2);
      for (let x = 0; x < LW; x += 14) { rect(g, '#6a4028', x, 124, 3, 16); } rect(g, '#8a5a3a', 0, 122, LW, 3);
      vgrad(g, 160, LH, [[0, '#c8b898'], [1, '#8a7a60']]);
      g.strokeStyle = rgba('#6a5a40', 0.4); g.lineWidth = 1; for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(153 + i * 16, 160); g.lineTo(153 + i * 58, LH); g.stroke(); }
      for (let i = 1; i < 5; i++) { const y = 160 + Math.pow(i / 5, 1.5) * 80; g.beginPath(); g.moveTo(0, y); g.lineTo(LW, y); g.stroke(); }
      ell(g, '#5a4a30', 112, 179, 12, 3);
      ell(g, '#d8a040', 112, 170, 10, 9); ell(g, '#e8b850', 112, 158, 6, 6); rect(g, '#8a5a2a', 110, 150, 4, 4); ell(g, '#f8d880', 109, 167, 3, 4);
      rect(g, '#c83a2a', 106, 163, 12, 2); rect(g, '#c83a2a', 113, 165, 2, 6);
      g.save(); g.translate(208, 116); g.rotate(-0.3);
      poly(g, '#e8d8c0', [0, -24, 14, -14, 0, -18, -14, -14]); poly(g, '#c8a880', [0, -24, 14, -14, 0, -18]);
      rect(g, '#5a3a24', -0.5, -22, 1.5, 26); ell(g, '#5a3a24', 1, 4, 2, 1);
      g.restore();
      ell(g, '#8a8070', 208, 178, 12, 3); rect(g, '#9a9488', 200, 162, 16, 14); poly(g, '#aaa498', [198, 162, 218, 162, 214, 156, 202, 156]);
      ell(g, '#7a90a8', 208, 150, 6, 5); poly(g, '#7a90a8', [204, 146, 202, 140, 206, 145]); poly(g, '#7a90a8', [212, 146, 214, 140, 210, 145]); rect(g, '#2a3a4a', 206, 149, 1, 1); rect(g, '#2a3a4a', 210, 149, 1, 1);
      lighter(g, () => glow(g, 208, 152, 14, '#b8a8ff', 0.4));
    },
    decor(g, t) {
      for (const x of [168, 186]) lighter(g, () => glow(g, x + 0.5 + Math.sin(t * 1.5 + x) * 1, 41, 10 + 2 * Math.sin(t * 4 + x), '#ff8a5a', 0.35));
      clipRect(g, 190, 60, 40, 60, () => { for (let i = 0; i < 14; i++) { const ph = (t * 1.6 + hx(i, 1, 61)) % 1; line(g, rgba('#c8e0ff', 0.6), 1, 194 + hx(i, 2, 61) * 30, 64 + ph * 54, 192 + hx(i, 2, 61) * 30, 68 + ph * 54); } });
      cloud(g, 144 + Math.sin(t * 0.4) * 3, 46, 1.1, rgba('#ffffff', 0.4), rgba('#ffffff', 0.3));
    },
    life(g, t) {
      const f = Math.floor(t * 7);
      if (hx(f, 2, 71) > 0.45) lighter(g, () => { g.strokeStyle = 'rgba(200,180,255,0.95)'; g.lineWidth = 1; g.beginPath(); let x = 208, y = 146; g.moveTo(x, y); for (let s = 0; s < 4; s++) { x += (hx(s, f, 73) - 0.5) * 12; y -= 6; g.lineTo(x, y); } g.stroke(); glow(g, 208, 150, 18, '#c8b8ff', 0.5); });
      const sk = ((t * 10) % 380) - 40; g.save(); g.translate(sk, 70 + Math.sin(t) * 3); poly(g, '#8a5a3a', [-12, 0, 12, 0, 9, 4, -9, 4]); rect(g, '#c83a2a', -3, -5, 6, 5); g.restore();
      lighter(g, () => { for (let i = 0; i < 6; i++) { const ph = (t * 0.4 + i / 6) % 1; rect(g, rgba('#a8ffc8', Math.sin(ph * Math.PI) * 0.8), Math.floor(104 + hx(i, 3, 75) * 16), Math.floor(160 - ph * 26), 1, 1); } });
    }
  };

  S.yanqing = {
    title: 'Площадка Облачных Рыцарей',
    aura: 'swords',
    frags: [
      ['Чучело', 'Тренировочное чучело. Яньцин не любит ждать соперника.'],
      ['Стойка с мечами', 'Яньцин может часами рассказывать о мечах.'],
      ['Знамя Облачных Рыцарей', 'Яньцин лейтенант Облачных Рыцарей Лофу.'],
      ['Облака Лофу', 'Над площадкой плывут облака и небесные лодки.'],
      ['Истинный меч', 'Истинный меч. Его техника усиливает удары по крепким врагам.'],
      ['Единение души и стали', 'Яньцин и его мечи. Удар, и следом ещё один, ледяной.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, 150, [[0, '#3a7ac8'], [0.6, '#9ac8ec'], [1, '#e0eef8']]);
      for (const [x, y, s] of [[30, 40, 1.4], [280, 60, 1.5], [180, 46, 1.2], [70, 96, 1], [250, 110, 1.1]]) cloud(g, x, y, s, '#ffffff', '#f4f8ff');
      for (const [x, h, w] of [[10, 80, 22], [46, 56, 16], [262, 70, 20], [296, 94, 18]]) { rect(g, '#8aa4c0', x, 140 - h, w, h); poly(g, '#3a5a7a', [x - 5, 140 - h, x + w / 2, 140 - h - 12, x + w + 5, 140 - h]); poly(g, '#d8b050', [x + w / 2 - 1, 140 - h - 12, x + w / 2 + 1, 140 - h - 12, x + w / 2, 140 - h - 18]); }
      g.save(); g.translate(178, 50); poly(g, '#8a5a3a', [-12, 0, 12, 0, 9, 4, -9, 4]); rect(g, '#3c5478', -4, -6, 8, 6); poly(g, '#d8b050', [-6, -6, 6, -6, 0, -10]); g.restore();
      rect(g, '#3a2a1c', 136, 22, 2, 40);
      poly(g, '#3c5478', [138, 26, 158, 26, 158, 54, 148, 50, 138, 54]); rect(g, '#d8b050', 138, 26, 20, 2);
      g.strokeStyle = '#f2f2f4'; g.lineWidth = 1.5; g.beginPath(); g.arc(148, 38, 5, Math.PI * 0.2, Math.PI * 1.8); g.stroke(); line(g, '#d8b050', 1, 148, 30, 148, 47);
      rect(g, '#e8e4dc', 0, 136, LW, 24); rect(g, '#b8b0a0', 0, 136, LW, 2);
      for (let x = 4; x < LW; x += 12) { rect(g, '#d8d4cc', x, 118, 4, 18); rect(g, '#f4f0e8', x, 118, 4, 2); } rect(g, '#c8c0b0', 0, 120, LW, 2);
      rect(g, '#5a3a24', 96, 92, 32, 4); rect(g, '#5a3a24', 96, 112, 32, 4); rect(g, '#3a2414', 98, 96, 3, 26); rect(g, '#3a2414', 123, 96, 3, 26);
      for (let i = 0; i < 4; i++) { const x = 103 + i * 6; rect(g, '#cfe6f6', x, 80, 2, 22); rect(g, '#ffffff', x, 80, 1, 22); rect(g, '#d8b050', x - 1, 101, 4, 2); rect(g, ['#3c5478', '#2a2a34', '#8a2a2a', '#3c5478'][i], x, 103, 2, 6); }
      vgrad(g, 160, LH, [[0, '#d8d4c8'], [1, '#a8a498']]);
      g.strokeStyle = rgba('#8a8478', 0.5); g.lineWidth = 1; for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(153 + i * 16, 160); g.lineTo(153 + i * 58, LH); g.stroke(); }
      for (let i = 1; i < 5; i++) { const y = 160 + Math.pow(i / 5, 1.5) * 80; g.beginPath(); g.moveTo(0, y); g.lineTo(LW, y); g.stroke(); }
      g.strokeStyle = rgba('#3c5478', 0.35); g.lineWidth = 2; g.beginPath(); g.ellipse(153, 200, 100, 22, 0, 0, Math.PI * 2); g.stroke();
      rect(g, '#6a4a2a', 110, 150, 4, 30); rect(g, '#8a6a3a', 102, 156, 20, 3);
      ell(g, '#c8a878', 112, 148, 6, 6); rect(g, '#a88a5a', 106, 154, 12, 14); g.strokeStyle = '#6a4a2a'; g.lineWidth = 1; g.beginPath(); g.moveTo(106, 160); g.lineTo(118, 160); g.moveTo(108, 154); g.lineTo(116, 168); g.stroke();
      ell(g, '#8a8478', 112, 180, 10, 2.5);
      rect(g, '#8a8478', 198, 108, 20, 12); rect(g, '#a8a498', 198, 108, 20, 2); rect(g, '#6a6458', 196, 118, 24, 3);
      rect(g, '#cfe6f6', 207, 84, 3, 24); rect(g, '#ffffff', 207, 84, 1, 24); poly(g, '#cfe6f6', [207, 84, 210, 84, 208.5, 79]); rect(g, '#d8b050', 204, 104, 9, 2);
      lighter(g, () => glow(g, 208, 94, 12, '#9ad8ff', 0.3));
      if (!live) for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.5, x = 208 + Math.cos(a) * 11, y = 160 + Math.sin(a) * 4; g.save(); g.translate(x, y); g.rotate(-0.4); rect(g, '#cfe6f6', -1, -12, 2, 14); rect(g, '#d8b050', -3, 2, 6, 1); g.restore(); }
      lighter(g, () => glow(g, 208, 158, 10, '#9ad8ff', 0.16));
      ell(g, '#8a8478', 208, 178, 14, 3);
    },
    decor(g, t) {
      g.save(); const w = Math.sin(t * 2.6); poly(g, rgba('#3c5478', 0.5), [158, 26, 158 + w * 1.5, 54, 148, 50 + w]); g.restore();
      lighter(g, () => { glow(g, 208, 94, 9 + 2 * Math.sin(t * 3), '#9ad8ff', 0.2); for (let i = 0; i < 6; i++) { const ph = (t * 0.5 + i / 6) % 1; rect(g, rgba('#e8fbff', 1 - ph), Math.floor(204 + hx(i, 1, 81) * 10), Math.floor(104 - ph * 20), 1, 1); } });
      for (const [x, y, s, sp] of [[30, 40, 1.4, 3], [280, 60, 1.5, 2]]) cloud(g, x + Math.sin(t * 0.2 * sp) * 4, y, s, rgba('#ffffff', 0.35), rgba('#ffffff', 0.25));
    },
    life(g, t) {
      for (let i = 0; i < 4; i++) { const a = t * 1.4 + i * Math.PI / 2, x = 208 + Math.cos(a) * 14, y = 156 + Math.sin(a) * 5 - 4; g.save(); g.translate(x, y); g.rotate(-0.4 + Math.cos(a) * 0.3); rect(g, '#e8fbff', -1, -12, 2, 14); rect(g, '#d8b050', -3, 2, 6, 1); g.restore(); }
      const sk = ((t * 14) % 400) - 40; g.save(); g.translate(sk, 30 + Math.sin(t * 0.8) * 3); poly(g, '#8a5a3a', [-10, 0, 10, 0, 8, 3, -8, 3]); rect(g, '#3c5478', -3, -5, 6, 5); g.restore();
    }
  };

  S.miyabi = {
    title: 'Памятник в снегу',
    aura: 'ice',
    frags: [
      ['Ледяное лихо', 'Мияби с детства читала стихи о холоде. Их смысл открылся ей в бою.'],
      ['Дыхательная техника', 'Каков меч, таково и сердце. Главный принцип школы Хосими.'],
      ['Боевая подготовка', 'Совещание? Нет, Мияби лучше потренируется.'],
      ['Излом стужи', 'Стихи в бою выравнивают дыхание. Мияби всегда спокойна.'],
      ['Годовщина', 'Цветы у памятника. Пальцы касаются имени на камне.'],
      ['Дар фехтования', 'Если бог фехтования существует, он благоволит Хосими Мияби.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, 150, [[0, '#04081a'], [0.7, '#14244a'], [1, '#2a4068']]);
      for (let i = 0; i < 50; i++) rect(g, rgba('#e8f0ff', 0.3 + 0.6 * hx(i, 4, 61)), Math.floor(hx(i, 5, 61) * LW), Math.floor(hx(6, i, 61) * 90), 1, 1);
      lighter(g, () => glow(g, 252, 36, 34, '#c8dcff', 0.45));
      ell(g, '#eef4ff', 252, 36, 13, 13); ell(g, '#c8d4ec', 256, 32, 3, 2.4); ell(g, '#c8d4ec', 248, 41, 2, 2);
      poly(g, '#1a2440', [0, 118, 40, 96, 90, 110, 140, 90, 190, 104, 250, 86, LW, 102, LW, 150, 0, 150]);
      rect(g, '#8a1a22', 52, 84, 3, 26); rect(g, '#8a1a22', 76, 84, 3, 26); rect(g, '#a8242c', 48, 82, 34, 3); rect(g, '#1a1a22', 46, 80, 38, 2); rect(g, '#a8242c', 50, 89, 30, 2);
      g.strokeStyle = '#1a1418'; g.lineWidth = 2; g.beginPath(); g.moveTo(26, 150); g.lineTo(30, 70); g.stroke();
      g.lineWidth = 1; for (const [x0, y0, x1, y1] of [[29, 96, 12, 78], [29, 86, 44, 66], [30, 76, 20, 58], [44, 66, 50, 58]]) { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
      vgrad(g, 146, LH, [[0, '#d8e4f2'], [1, '#9cb0c8']]);
      for (let i = 0; i < 8; i++) ell(g, rgba('#ffffff', 0.5), 20 + i * 40 + hx(i, 2, 62) * 10, 160 + hx(i, 3, 62) * 50, 14, 2);
      rect(g, '#3a4250', 170, 96, 44, 62); rect(g, '#4a5262', 172, 98, 40, 58); poly(g, '#3a4250', [166, 96, 192, 84, 218, 96]);
      rect(g, '#5a6272', 172, 98, 40, 2);
      for (let i = 0; i < 4; i++) rect(g, '#2a303c', 186, 108 + i * 10, 12, 2);
      rect(g, '#2a303c', 160, 156, 64, 8); rect(g, '#eef4fc', 160, 154, 64, 3);
      for (const [x, c] of [[180, '#f2f0f4'], [186, '#f6c8d4'], [192, '#f2f0f4'], [198, '#e8a8b8']]) { rect(g, '#3a6a3a', x, 146, 1, 10); ell(g, c, x, 145, 3, 2.4); }
      rect(g, '#2a2a30', 116, 140, 10, 18); rect(g, '#3a3a44', 114, 138, 14, 3); rect(g, '#ffd080', 118, 144, 6, 6);
      lighter(g, () => glow(g, 121, 147, 22, '#ffb860', 0.5));
      if (!live) for (const [x, y] of [[88, 70], [236, 66], [140, 54]]) { lighter(g, () => glow(g, x, y, 10, '#5ab8ff', 0.6)); poly(g, '#a8e0ff', [x, y - 7, x + 3, y, x, y + 3, x - 3, y]); }
      ell(g, '#c8d4e4', 192, 200, 40, 4);
    },
    decor(g, t) {
      K.snowfall(g, t, 46, 3, { speed: 16, wind: -6 });
      lighter(g, () => glow(g, 121, 147, 16 + 3 * Math.sin(t * 6) + 2 * Math.sin(t * 11.3), '#ffb860', 0.35));
    },
    life(g, t) {
      for (let i = 0; i < 3; i++) {
        const x = 90 + i * 74 + Math.sin(t * 0.7 + i * 2) * 16, y = 66 - i * 4 + Math.sin(t * 1.3 + i) * 8;
        lighter(g, () => glow(g, x, y, 10, '#5ab8ff', 0.5 + 0.2 * Math.sin(t * 4 + i)));
        poly(g, '#a8e0ff', [x, y - 7 - Math.sin(t * 6 + i) * 1.5, x + 3, y, x, y + 3, x - 3, y]);
      }
      for (let i = 0; i < 5; i++) { const ph = (t * 0.15 + i / 5) % 1, x = 186 + Math.sin(t + i * 1.7) * 40 * ph, y = 144 - ph * 90; ell(g, rgba(i % 2 ? '#f6c8d4' : '#ffffff', 1 - ph), x, y, 1.6, 1); }
    }
  };

  S.yanagi = {
    title: 'Кабинет Секции 6',
    aura: 'elec',
    frags: [
      ['Познать врага', 'Распознать слабость врага значит обезопасить себя.'],
      ['Приспособляемость', 'Янаги разберётся с любой бедой. Мияби верит ей больше, чем себе.'],
      ['Стиль Цукисиро', 'В Секции 6 служат чокнутые гении. Нормальная там одна Янаги.'],
      ['Гроссмейстер', 'Янаги быстро собирает сведения и сразу принимает решение.'],
      ['«Мама» демонёнка', 'Янаги опекает Сокаку. Даже когда та откусила онигири командира.'],
      ['Чужая кровь', 'Чужая кровь дала Янаги новую жизнь. За всё чужое приходится платить.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#120c1e'], [0.6, '#1e1630'], [1, '#0e0a16']]);
      rect(g, '#0a0812', 24, 18, 120, 92); vgrad(g, 20, 108, [[0, '#0c1030'], [1, '#2a1a4a']], 26, 116);
      for (let i = 0; i < 26; i++) { const x = 28 + Math.floor(hx(i, 1, 71) * 112), h = 12 + Math.floor(hx(i, 2, 71) * 40); rect(g, '#141228', x, 108 - h, 8, h); if (hx(i, 3, 71) > 0.4) rect(g, rgba('#ffd890', 0.7), x + 2, 108 - h + 4, 2, 1); }
      ell(g, '#f4f0ff', 118, 36, 9, 9); ell(g, '#2a1a4a', 122, 33, 8, 8);
      rect(g, '#3a2e44', 22, 16, 124, 3); rect(g, '#3a2e44', 22, 108, 124, 3); rect(g, '#3a2e44', 82, 18, 2, 90);
      ell(g, '#2a2234', 220, 40, 17, 17); ell(g, '#f2eee6', 220, 40, 14, 14);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; rect(g, '#2a2234', Math.round(220 + Math.sin(a) * 11), Math.round(40 - Math.cos(a) * 11), 1, 1); }
      if (!live) { line(g, '#2a2234', 1.5, 220, 40, 220, 31); line(g, '#2a2234', 1, 220, 40, 227, 44); }
      g.save(); g.translate(286, 150); g.rotate(-0.12); rect(g, '#2a2a34', -1, -136, 3, 140); poly(g, '#d8dce8', [-2, -136, 4, -136, 1, -164]); rect(g, '#60e0ff', -2, -96, 5, 4); g.restore();
      vgrad(g, 150, LH, [[0, '#2a2030'], [1, '#14101a']]);
      rect(g, '#3a2a24', 40, 132, 220, 8); rect(g, '#5a4234', 40, 132, 220, 2); rect(g, '#2a1e1a', 48, 140, 6, 60); rect(g, '#2a1e1a', 246, 140, 6, 60);
      for (let s = 0; s < 3; s++) for (let i = 0; i < 6 + s * 2; i++) rect(g, i % 2 ? '#e8e4dc' : '#f4f2ec', 58 + s * 30, 128 - i * 2, 22, 2);
      rect(g, '#2a2a30', 150, 98, 46, 34); rect(g, '#1a3a4a', 154, 102, 38, 24); rect(g, '#3a3a44', 166, 132, 14, 2);
      for (let i = 0; i < 4; i++) rect(g, rgba('#60e0ff', 0.7), 158, 106 + i * 5, 10 + Math.floor(hx(i, 4, 71) * 22), 1);
      rect(g, '#3a3a44', 212, 104, 2, 28); poly(g, '#4a4a58', [204, 104, 222, 104, 218, 96, 208, 96]);
      lighter(g, () => glow(g, 213, 112, 30, '#ffe0a0', 0.4));
      ell(g, '#e8e0d8', 232, 130, 12, 3); for (const [x, y] of [[226, 126], [234, 125], [238, 128]]) { ell(g, '#c88a5a', x, y, 4, 3); ell(g, '#e0a878', x - 1, y - 1, 2, 1.4); }
      rect(g, '#f4f0ea', 118, 124, 8, 8); rect(g, '#c8bca8', 118, 124, 8, 2);
      ell(g, '#18121e', 150, 214, 120, 8);
    },
    decor(g, t) {
      lighter(g, () => { glow(g, 213, 112, 24 + 2 * Math.sin(t * 9) * (Math.sin(t * 2.3) > 0.9 ? 3 : 0.3), '#ffe0a0', 0.25); glow(g, 173, 114, 20, '#60e0ff', 0.2 + 0.1 * Math.sin(t * 3)); });
      for (let i = 0; i < 4; i++) rect(g, rgba('#9af0ff', 0.4 + 0.4 * Math.sin(t * 5 + i)), 158, 106 + i * 5, 4, 1);
    },
    life(g, t) {
      line(g, '#2a2234', 1.5, 220, 40, 220 + Math.sin(t * 0.1) * 9, 40 - Math.cos(t * 0.1) * 9);
      line(g, '#c83040', 1, 220, 40, 220 + Math.sin(t * 2) * 12, 40 - Math.cos(t * 2) * 12);
      for (let i = 0; i < 4; i++) { const ph = (t * 0.4 + i / 4) % 1; rect(g, rgba('#ffffff', 0.5 * (1 - ph)), Math.round(121 + Math.sin(t * 2 + i) * 2), Math.round(122 - ph * 16), 1, 1); }
      const pg = (t * 0.3) % 1; g.save(); g.translate(76 + pg * 40, 122 - Math.sin(pg * Math.PI) * 30); g.rotate(pg * 3); rect(g, rgba('#f4f2ec', 1 - pg), -5, -1, 10, 2); g.restore();
    }
  };

  function lycoris(g, x, y, r, col, sway) {
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.52 + (sway || 0);
      line(g, col, 1, x, y, x + Math.cos(a - 0.3) * r * 0.7, y + Math.sin(a - 0.3) * r * 0.7);
      line(g, col, 1, x + Math.cos(a - 0.3) * r * 0.7, y + Math.sin(a - 0.3) * r * 0.7, x + Math.cos(a) * r, y + Math.sin(a) * r);
      line(g, col, 1, x + Math.cos(a) * r, y + Math.sin(a) * r, x + Math.cos(a + 0.9) * r * 0.75, y + Math.sin(a + 0.9) * r * 0.75);
    }
    for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.45 + (sway || 0); rect(g, rgba('#ffc8d4', 0.9), Math.round(x + Math.cos(a) * r * 1.3), Math.round(y + Math.sin(a) * r * 1.3), 1, 1); }
    line(g, '#2a4a24', 1, x, y, x, y + r * 1.6);
  }

  S.phrolova = {
    title: 'Потерянная даль',
    aura: 'quant',
    seams: 'gold',
    frags: [
      ['Ключ к тайнам преисподней', 'Ключ от комнаты песен. Сюда Фролова пускает только тех, кто умеет слушать.'],
      ['Нить к жизни за гранью', 'Красная лента держит её на этом берегу. Фролова не даёт ей порваться.'],
      ['Кинжал от наваждений', 'Один взмах, и сон рвётся. Иногда наваждение нужно отрезать самой.'],
      ['Факел на пути', 'Свет у края сцены. Он горит для тех, кто ещё не нашёл дорогу.'],
      ['Развилка судьбы', 'Две дороги из Остины. Фролова выбрала ту, что не ведёт назад.'],
      ['Ночь ухода из покоя', 'Последний поклон. Трещины в статуе давно стали её частью.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#12020a'], [0.55, '#3a0814'], [1, '#14020a']]);
      for (let i = 0; i < 11; i++) {
        const x = 104 + i * 10, top = 14 + Math.abs(i - 5) * 7;
        rect(g, '#4a2a0e', x, top, 7, 150 - top); rect(g, '#c8963a', x + 1, top, 3, 150 - top); rect(g, '#f2d488', x + 1, top, 1, 150 - top);
        ell(g, '#1a0c06', x + 3.5, top + 3, 2.6, 1.6);
      }
      lighter(g, () => glow(g, 152, 96, 90, '#ff3a6a', 0.22));
      for (const s of [-1, 1]) {
        const ex = s < 0 ? 0 : LW;
        for (let k = 0; k < 5; k++) { const x0 = ex - s * k * 14, x1 = x0 - s * 20; poly(g, k % 2 ? '#6a0a1a' : '#8e1226', [x0, 0, x1, 0, x1 - s * 8, LH, x0, LH]); }
        rect(g, '#d8a848', s < 0 ? 0 : LW - 72, 2, 72, 3);
      }
      poly(g, '#200408', [0, 150, LW, 150, LW, LH, 0, LH]);
      ell(g, '#3a0a14', 160, 196, 130, 26);
      g.lineWidth = 1.4; g.strokeStyle = '#c8963a'; g.beginPath(); g.ellipse(160, 196, 128, 25, 0, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1; g.strokeStyle = rgba('#d8a848', 0.8); g.beginPath(); g.ellipse(160, 196, 70, 14, 0, 0, Math.PI * 2); g.stroke();
      lighter(g, () => { poly(g, rgba('#ffe0e8', 0.12), [144, 0, 176, 0, 214, 196, 106, 196]); });
      for (let i = 0; i < 26; i++) lycoris(g, 8 + i * 12 + hx(i, 3, 71) * 6, 222 + (i % 3) * 6, 5 + (i % 3), i % 4 ? '#e0203c' : '#ff4a68', 0);
      rect(g, '#c8963a', 104, 160, 14, 3); ell(g, '#c8963a', 102, 161, 4, 4); ell(g, '#3a0814', 102, 161, 2, 2); rect(g, '#c8963a', 114, 163, 2, 4); rect(g, '#c8963a', 110, 163, 2, 3);
      line(g, '#d01e3a', 1, 118, 161, 124, 172); line(g, '#d01e3a', 1, 124, 172, 120, 178);
      ell(g, '#c81e3a', 112, 104, 6, 3, 0.5); ell(g, '#c81e3a', 112, 104, 6, 3, -0.5); ell(g, '#8a0e22', 112, 104, 2, 2);
      line(g, '#c81e3a', 1.4, 112, 106, 106, 118); line(g, '#c81e3a', 1.4, 112, 106, 118, 117);
      line(g, rgba('#f0e0c8', 0.7), 0.6, 130, 36, 158, 36);
      poly(g, '#d8dce8', [138, 54, 150, 34, 152, 35, 141, 55]); rect(g, '#3a2a1a', 136, 54, 5, 3); ell(g, '#c8963a', 138, 57, 2, 1.4);
      rect(g, '#5a3a14', 174, 46, 4, 12); poly(g, '#c8963a', [170, 46, 182, 46, 180, 42, 172, 42]);
      if (!live) { lighter(g, () => glow(g, 176, 36, 12, '#ffb050', 0.7)); poly(g, '#ffd060', [176, 28, 180, 38, 176, 42, 172, 38]); poly(g, '#fff4c0', [176, 33, 178, 38, 176, 40, 174, 38]); }
      rect(g, '#4a2a14', 207, 98, 2, 20); poly(g, '#d8b878', [196, 98, 206, 98, 206, 103, 196, 103, 193, 100.5]); poly(g, '#d8b878', [210, 104, 220, 104, 223, 106.5, 220, 109, 210, 109]);
      lighter(g, () => glow(g, 210, 158, 12, '#ffe8c0', 0.4));
      ell(g, '#fff0d0', 210, 158, 6, 6); ell(g, '#3a0814', 213, 156, 5, 5);
      lycoris(g, 206, 172, 7, '#ff2a4a', 0);
    },
    decor(g, t) {
      for (let i = 0; i < 18; i++) { const ph = (t * 0.12 + hx(i, 4, 72)) % 1, x = hx(i, 5, 72) * LW + Math.sin(t + i) * 10, y = ph * LH; ell(g, i % 2 ? '#ff3a5a' : '#b81830', x, y, 1.6, 0.8, t + i); }
      lighter(g, () => glow(g, 176, 36, 10 + 2 * Math.sin(t * 7) + Math.sin(t * 13.1), '#ffb050', 0.5));
      poly(g, '#ffd060', [176, 28 - Math.sin(t * 9), 180, 38, 176, 42, 172, 38]);
      lighter(g, () => poly(g, rgba('#ffe0e8', 0.05 + 0.03 * Math.sin(t * 2)), [144, 0, 176, 0, 214, 196, 106, 196]));
    },
    life(g, t) {
      const k = 0.5 + 0.5 * Math.sin(t * 1.6);
      lighter(g, () => { ring(g, rgba('#ff4aa8', 0.35 + 0.25 * k), 1.4, 152, 40, 30 + 3 * k); glow(g, 152, 40, 24, '#ff4aa8', 0.25 * k); });
      for (let i = 0; i < 10; i++) { const a = t * 0.8 + i * 0.63, r = 70 + 10 * Math.sin(t + i); ell(g, rgba(i % 2 ? '#ff4a68' : '#ffd0dc', 0.8), 152 + Math.cos(a) * r, 120 + Math.sin(a) * r * 0.4, 1.4, 0.8, a); }
    }
  };

  S.scar = {
    title: 'Сказка о чёрном ягнёнке',
    aura: 'fire',
    frags: [
      ['Чёрные ножи', 'Ножи по карманам. Скар достаёт их раньше, чем заканчивает фразу.'],
      ['Серьга-лилия', 'Золотая лилия вниз головой. Подарок, о котором он не рассказывает.'],
      ['Сказка на ночь', 'Мама читала ему сказки. В её версии ягнята всегда были добрыми.'],
      ['Костёр в Цичи', 'Белые ягнята пляшут у огня и славят пастуха. Чёрный стоит в тени.'],
      ['Элизиум', 'Сцена из сот. Отсюда не выйти, пока Скар не доскажет историю.'],
      ['Аберрантный кошмар', 'Козлиный жнец под кожей. Новая жизнь растёт из выжженной земли.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#04040c'], [0.5, '#160a12'], [1, '#2a1008']]);
      for (let i = 0; i < 60; i++) rect(g, rgba('#ffffff', 0.3 + 0.6 * hx(i, 6, 73)), Math.floor(hx(i, 7, 73) * LW), Math.floor(hx(7, i, 73) * 90), 1, 1);
      ell(g, '#f2ead0', 268, 30, 11, 11); ell(g, '#160a12', 273, 27, 10, 10);
      for (let i = 0; i < 7; i++) {
        const hx0 = 6 + i * 46 + (i % 2) * 8, hw = 36 + (i % 3) * 6, hh = 30 + (i % 2) * 12, base = 150;
        poly(g, '#0c0608', [hx0, base, hx0, base - hh, hx0 + hw / 2, base - hh - 16, hx0 + hw, base - hh, hx0 + hw, base]);
        if (i % 2 === 0) rect(g, '#ff9a40', hx0 + hw / 2 - 3, base - hh + 8, 6, 6);
      }
      poly(g, '#160a08', [0, 150, LW, 150, LW, LH, 0, LH]);
      for (let x = 0; x < LW; x += 12) rect(g, '#22120a', x, 138, 3, 12);
      rect(g, '#22120a', 0, 141, LW, 2);
      lighter(g, () => glow(g, 160, 196, 80, '#ff8a2a', 0.45));
      if (!live) for (let i = 0; i < 5; i++) poly(g, i % 2 ? '#ffb040' : '#ff5a1a', [150 + i * 5 - 4, 200, 152 + i * 5, 176 - (i % 3) * 6, 154 + i * 5 + 4, 200]);
      rect(g, '#3a2418', 146, 200, 28, 3);
      for (let i = 0; i < 8; i++) {
        const a = Math.PI * (0.08 + i * 0.12), x = 160 + Math.cos(a) * 92, y = 214 - Math.sin(a) * 14;
        if (Math.abs(x - 152) < 30) continue;
        ell(g, '#ece8e0', x, y, 6, 4); ell(g, '#ece8e0', x + 5, y - 3, 2.6, 2.4); rect(g, '#3a3436', x - 4, y + 3, 1, 4); rect(g, '#3a3436', x + 3, y + 3, 1, 4);
      }
      ell(g, '#141014', 236, 226, 7, 5); ell(g, '#141014', 242, 222, 3, 3); rect(g, '#ffd040', 243, 221, 1, 1); rect(g, '#141014', 232, 230, 1, 5); rect(g, '#141014', 239, 230, 1, 5);
      for (const [x, y, r] of [[104, 176, 0.3], [112, 172, -0.2], [120, 178, 0.15]]) { g.save(); g.translate(x, y); g.rotate(r); rect(g, '#1a181c', -1, -14, 2, 14); rect(g, '#c8242e', -1.4, -1, 2.8, 4); g.restore(); }
      ell(g, '#d8b040', 112, 100, 3, 4); poly(g, '#d8b040', [108, 102, 116, 102, 112, 112]); poly(g, '#d8b040', [104, 98, 109, 100, 108, 104]); poly(g, '#d8b040', [120, 98, 115, 100, 116, 104]); rect(g, '#b08a30', 111, 92, 2, 6);
      poly(g, '#efe6d0', [128, 40, 144, 36, 160, 40, 160, 56, 144, 52, 128, 56]); line(g, '#8a7a60', 1, 144, 36, 144, 52);
      for (const [x, y] of [[134, 46], [140, 44], [150, 46]]) ell(g, '#f8f4ec', x, y, 2.4, 1.6); ell(g, '#1a1418', 155, 48, 2.4, 1.6);
      line(g, '#3a2a1a', 1, 176, 24, 176, 34); rect(g, '#3a2a1a', 171, 34, 10, 2); rect(g, '#3a2a1a', 171, 48, 10, 2); rect(g, rgba('#ffd890', 0.4), 172, 36, 8, 12);
      if (!live) { lighter(g, () => glow(g, 176, 42, 12, '#ff9a40', 0.6)); poly(g, '#ffb040', [176, 37, 179, 44, 176, 47, 173, 44]); }
      const hexAt = (x, y, r, col) => { const pts = []; for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; pts.push(x + Math.cos(a) * r, y + Math.sin(a) * r); } poly(g, col, pts); };
      lighter(g, () => glow(g, 208, 104, 14, '#ff8a3a', 0.5)); hexAt(208, 104, 9, '#ff9a50'); hexAt(208, 104, 6, '#2a1008'); hexAt(208, 104, 3, '#ffd8a0');
      ell(g, '#d8d2cc', 208, 168, 6, 8); poly(g, '#8e8884', [204, 172, 212, 172, 210, 178, 206, 178]); rect(g, '#1c1a20', 205, 165, 2, 2); rect(g, '#1c1a20', 209, 165, 2, 2);
      for (const s of [-1, 1]) { line(g, '#1c1a20', 2.4, 208 + s * 4, 162, 208 + s * 11, 158); line(g, '#1c1a20', 2.2, 208 + s * 11, 158, 208 + s * 13, 166); line(g, '#1c1a20', 1.8, 208 + s * 13, 166, 208 + s * 9, 168); }
    },
    decor(g, t) {
      for (let i = 0; i < 5; i++) poly(g, i % 2 ? '#ffb040' : '#ff5a1a', [150 + i * 5 - 4, 200, 152 + i * 5 + Math.sin(t * 9 + i) * 1.5, 176 - (i % 3) * 6 - 4 * Math.sin(t * 8 + i * 1.7), 154 + i * 5 + 4, 200]);
      for (let i = 0; i < 16; i++) { const ph = (t * 0.5 + hx(i, 8, 74)) % 1; rect(g, rgba(i % 2 ? '#ffb060' : '#ff6a20', 1 - ph), Math.round(146 + hx(i, 9, 74) * 28 + Math.sin(t * 2 + i) * 6), Math.round(196 - ph * 120), 1, 1); }
      lighter(g, () => glow(g, 176, 42, 10 + 2 * Math.sin(t * 7), '#ff9a40', 0.5));
      poly(g, '#ffb040', [176, 37 - Math.sin(t * 9), 179, 44, 176, 47, 173, 44]);
    },
    life(g, t) {
      for (let i = 0; i < 6; i++) { const a = Math.PI * (0.1 + i * 0.16) + t * 0.2, x = 160 + Math.cos(a) * 92, y = 214 - Math.sin(a) * 14 - Math.abs(Math.sin(t * 4 + i)) * 2; ell(g, '#ece8e0', x, y, 6, 4); ell(g, '#ece8e0', x + 5, y - 3, 2.6, 2.4); }
      g.save(); g.beginPath(); g.ellipse(152, 140, 70, 96, 0, 0, Math.PI * 2); g.clip();
      g.strokeStyle = rgba('#ff7a3a', 0.12 + 0.08 * Math.sin(t * 2)); g.lineWidth = 1;
      for (let r = -8; r <= 8; r++) for (let q = -6; q <= 6; q++) { const x = 152 + q * 15, y = 140 + r * 17.3 + (q % 2 ? 8.7 : 0); g.beginPath(); for (let k = 0; k <= 6; k++) { const a = k * Math.PI / 3; if (k) g.lineTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10); else g.moveTo(x + 10, y); } g.stroke(); }
      g.restore();
    }
  };

  function cabbage(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    ell(g, '#3a7a2a', 0, 0, 7 * s, 6 * s); ell(g, '#6ab84a', -1 * s, -1 * s, 5.6 * s, 4.6 * s); ell(g, '#a8e07a', -2 * s, -2 * s, 2.6 * s, 2 * s);
    line(g, '#2a5a1e', 1, -5 * s, 0, 5 * s, 0);
    rect(g, '#ffffff', Math.round(2 * s), Math.round(-2 * s), 2, 2); rect(g, '#141414', Math.round(2.5 * s), Math.round(-1.6 * s), 1, 1);
    g.restore();
  }

  S.kazuma = {
    title: 'Гильдия Акселя',
    aura: 'coins',
    frags: [
      ['Кружка шипучки', 'Аква заказывает шипучку в долг. Платит, как всегда, Казума.'],
      ['Лук и стрелы', 'Прицельная стрельба: дальность от ловкости, точность от удачи.'],
      ['Доска заданий', 'Гигантские жабы, капуста, нежить. На каждое задание у отряда своя беда.'],
      ['Герб гильдии', 'Гильдия Акселя. С этого города начинал путь каждый искатель.'],
      ['Чунчунмару', 'Короткая катана. Имя придумала Мегумин, спорить было бесполезно.'],
      ['Карта искателя', 'Всё среднее, кроме удачи. Луна посоветовала ему стать торговцем.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#2a1a10'], [0.55, '#3a2416'], [1, '#1a100a']]);
      for (let x = 0; x < LW; x += 22) { rect(g, '#24160c', x, 0, 2, 150); rect(g, rgba('#ffd8a0', 0.05), x + 2, 0, 1, 150); }
      rect(g, '#1c1008', 0, 18, LW, 6); rect(g, '#1c1008', 0, 146, LW, 4);
      poly(g, '#3a2414', [0, 150, LW, 150, LW, LH, 0, LH]);
      for (let i = 0; i < 9; i++) rect(g, '#2e1c10', 0, 158 + i * 10, LW, 1);
      for (const lx of [40, 280]) { line(g, '#1a1008', 1, lx, 24, lx, 40); ell(g, '#e8b040', lx, 46, 6, 7); if (!live) lighter(g, () => glow(g, lx, 46, 26, '#ffb040', 0.45)); }
      for (const [tx, ty] of [[30, 190], [250, 196]]) { ell(g, '#5a3a20', tx + 22, ty, 30, 8); rect(g, '#3a2414', tx + 18, ty, 8, 26); }
      rect(g, '#5a3a20', 98, 176, 30, 4); rect(g, '#3a2414', 102, 180, 4, 30); rect(g, '#3a2414', 120, 180, 4, 30);
      rect(g, '#c8ccd8', 106, 158, 12, 18); rect(g, '#eef0f6', 108, 160, 8, 14); rect(g, '#f4c040', 108, 165, 8, 9); ell(g, '#fff6e0', 112, 160, 5, 2); rect(g, '#c8ccd8', 118, 162, 3, 8);
      for (let i = 0; i < 4; i++) rect(g, '#fff8c0', 109 + i * 2, 166 + (i % 2) * 3, 1, 1);
      g.save(); g.translate(112, 104); g.rotate(-0.5);
      g.strokeStyle = '#6a4424'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, 13, -1.2, 1.2); g.stroke(); g.lineWidth = 1;
      line(g, '#e8e0d0', 1, Math.cos(-1.2) * 13, Math.sin(-1.2) * 13, Math.cos(1.2) * 13, Math.sin(1.2) * 13);
      for (let i = 0; i < 3; i++) { line(g, '#d8dce8', 1, -4 + i * 3, -12, -4 + i * 3, 12); poly(g, '#e8ecf4', [-5 + i * 3, -14, -3 + i * 3, -14, -4 + i * 3, -17]); }
      g.restore();
      rect(g, '#5a3a20', 128, 28, 34, 30); rect(g, '#b48a5a', 130, 30, 30, 26);
      for (const [nx, ny, c] of [[132, 32, '#e8dcc0'], [146, 33, '#d8ccaa'], [134, 44, '#e2d6b6'], [148, 45, '#ead8b0']]) { rect(g, c, nx, ny, 10, 9); rect(g, '#b83030', nx + 4, ny, 2, 2); rect(g, rgba('#5a4028', 0.6), nx + 2, ny + 4, 6, 1); }
      poly(g, '#7a2a24', [166, 26, 188, 26, 188, 56, 177, 50, 166, 56]); poly(g, '#a83a2e', [168, 28, 186, 28, 186, 52, 177, 47, 168, 52]);
      ell(g, '#d8b050', 177, 38, 6, 6); poly(g, '#7a2a24', [177, 33, 180, 38, 177, 43, 174, 38]);
      rect(g, '#3a2414', 196, 112, 26, 3);
      g.save(); g.translate(208, 104); g.rotate(-0.15);
      rect(g, '#d8dce4', -14, -2, 24, 3); rect(g, '#ffffff', -14, -2, 24, 1); rect(g, '#c8a040', 10, -4, 2, 7); rect(g, '#2a2022', 12, -2, 10, 3); rect(g, '#6a2a24', 13, -2, 1, 3); rect(g, '#6a2a24', 16, -2, 1, 3);
      g.restore();
      rect(g, '#5a3a20', 194, 176, 32, 4);
      g.save(); g.translate(208, 168); g.rotate(-0.08);
      rect(g, '#e8dcc0', -10, -7, 20, 14); rect(g, '#2f7438', -10, -7, 20, 3);
      for (let i = 0; i < 4; i++) { rect(g, rgba('#5a4028', 0.6), -8, -2 + i * 2.4, 8, 1); rect(g, i === 3 ? '#d8b040' : '#6a8aa0', 1, -2 + i * 2.4, i === 3 ? 8 : 4, 1); }
      g.restore();
      rect(g, '#5a3a20', 198, 180, 4, 30); rect(g, '#5a3a20', 218, 180, 4, 30);
    },
    decor(g, t) {
      for (const lx of [40, 280]) lighter(g, () => glow(g, lx, 46, 24 + 3 * Math.sin(t * 7 + lx), '#ffb040', 0.4));
      for (let i = 0; i < 6; i++) { const ph = (t * 0.6 + i / 6) % 1; rect(g, rgba('#fff8c0', 1 - ph), 109 + (i % 4) * 2, Math.round(172 - ph * 14), 1, 1); }
      for (let i = 0; i < 10; i++) { const ph = (t * 0.08 + hx(i, 3, 91)) % 1; rect(g, rgba('#ffe8b0', 0.4 * Math.sin(ph * Math.PI)), Math.round(hx(i, 4, 91) * LW), Math.round(30 + ph * 110), 1, 1); }
    },
    life(g, t) {
      for (let i = 0; i < 7; i++) { const ph = (t * 0.5 + i / 7) % 1, x = 30 + i * 40, y = 150 - Math.sin(ph * Math.PI) * 30; ell(g, rgba('#f2c040', 0.9 * Math.sin(ph * Math.PI)), x, y, 2, 2); rect(g, rgba('#fff4b0', Math.sin(ph * Math.PI)), x - 0.5, y - 0.5, 1, 1); }
    }
  };

  S.aqua = {
    title: 'Озеро и клетка',
    aura: 'ice',
    frags: [
      ['Бутылка шипучки', 'Аква спит в обнимку с бутылкой и пьёт так, чтобы не очистить вино губами.'],
      ['Веера для трюка', '«Красота природы»: из вееров бьют струи воды. Денег за трюки Аква не берёт.'],
      ['Голуби', 'Аква держит голубей для представлений. Казума жалуется на шум.'],
      ['Перьевая мантия', 'Божественная реликвия. Спасает от любых недугов, но не от боли.'],
      ['Клетка у озера', 'Аква очищала озеро, сидя в клетке, пока ящеры грызли прутья.'],
      ['Цветок на голове', 'Финал трюка: на голове вырастает цветок и рассыпает лепестки.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, 140, [[0, '#4a8ad8'], [1, '#bfe4f8']]);
      for (const [cx, cy, r] of [[60, 40, 22], [250, 30, 18], [200, 60, 14]]) { ell(g, '#f4faff', cx, cy, r, r * 0.45); ell(g, '#ffffff', cx - r * 0.3, cy - 3, r * 0.6, r * 0.35); }
      poly(g, '#3a7a4a', [0, 120, 40, 104, 90, 112, 140, 100, 200, 110, 260, 98, LW, 108, LW, 140, 0, 140]);
      poly(g, '#2a5a3a', [0, 132, 70, 122, 150, 128, 230, 120, LW, 126, LW, 140, 0, 140]);
      vgrad(g, 140, LH, [[0, '#4aa0d8'], [1, '#1a5a9a']]);
      for (let i = 0; i < 14; i++) rect(g, rgba('#e8f8ff', 0.4), Math.round(hx(i, 2, 33) * LW), 150 + Math.floor(hx(i, 3, 33) * 80), 6 + Math.floor(hx(i, 4, 33) * 10), 1);
      rect(g, '#8a6a40', 96, 172, 34, 6); rect(g, '#6a4a28', 96, 178, 34, 2);
      rect(g, '#2a6a3a', 106, 152, 8, 20); rect(g, '#3a8a4a', 107, 153, 2, 18); rect(g, '#2a6a3a', 108, 146, 4, 7); rect(g, '#d8b050', 107, 145, 6, 2); ell(g, '#e8f4ff', 110, 160, 2, 4);
      for (const [fx, fy, r] of [[104, 106, -0.5], [120, 104, 0.5]]) {
        g.save(); g.translate(fx, fy); g.rotate(r);
        poly(g, '#f2bcd8', [0, 0, -9, -10, -3, -13, 3, -13, 9, -10]); for (let i = -2; i <= 2; i++) line(g, '#c87aa8', 1, 0, 0, i * 3.6, -11);
        if (!live) for (let i = 0; i < 4; i++) rect(g, rgba('#bfe8ff', 0.9), Math.round(-3 + i * 2), Math.round(-15 - i * 2), 1, 3);
        g.restore();
      }
      if (!live) for (const [px, py] of [[136, 40], [150, 48]]) { ell(g, '#eef0f4', px, py, 5, 3); poly(g, '#d8dce4', [px - 2, py, px - 9, py - 4, px - 6, py + 1]); poly(g, '#d8dce4', [px + 2, py, px + 9, py - 4, px + 6, py + 1]); ell(g, '#eef0f4', px + 5, py - 2, 2, 2); rect(g, '#e8a040', px + 7, py - 2, 2, 1); }
      g.save(); g.translate(176, 46); g.rotate(-0.2);
      for (let i = 0; i < 6; i++) poly(g, rgba('#f6c8e0', 0.75 - i * 0.08), [-16 + i * 6, -6 + Math.sin(i) * 3, -10 + i * 6, -8 + Math.sin(i + 1) * 3, -10 + i * 6, 6 + Math.sin(i + 1) * 3, -16 + i * 6, 8 + Math.sin(i) * 3]);
      g.restore();
      rect(g, '#4a4a54', 194, 92, 28, 2); rect(g, '#4a4a54', 194, 124, 28, 2);
      for (let i = 0; i < 6; i++) rect(g, '#5a5a64', 195 + i * 5, 92, 2, 34);
      ell(g, rgba('#1a4a7a', 0.6), 208, 126, 18, 3);
      if (!live) { ell(g, '#3a5a2a', 230, 124, 8, 3); rect(g, '#f4f4e8', 224, 122, 2, 1); rect(g, '#f4f4e8', 227, 122, 2, 1); }
      rect(g, '#b8683a', 200, 168, 16, 12); rect(g, '#d88a4a', 200, 168, 16, 3); rect(g, '#5a3a20', 202, 166, 12, 3);
      line(g, '#3a8a3a', 1, 208, 166, 208, 156);
      if (!live) { for (let i = 0; i < 5; i++) { const q = i / 5 * Math.PI * 2; ell(g, '#f8a8c8', 208 + Math.cos(q) * 4, 153 + Math.sin(q) * 4, 3, 2, q); } ell(g, '#f8e070', 208, 153, 2, 2); }
    },
    decor(g, t) {
      for (let i = 0; i < 14; i++) { const x = (hx(i, 2, 33) * LW + t * 6 * (0.5 + hx(i, 5, 33))) % LW; rect(g, rgba('#e8f8ff', 0.3 + 0.3 * Math.sin(t * 2 + i)), Math.round(x), 150 + Math.floor(hx(i, 3, 33) * 80), 6 + Math.floor(hx(i, 4, 33) * 10), 1); }
      for (const [fx, fy, r] of [[104, 106, -0.5], [120, 104, 0.5]]) { g.save(); g.translate(fx, fy); g.rotate(r); for (let i = 0; i < 5; i++) { const ph = (t * 1.6 + i / 5) % 1; rect(g, rgba('#bfe8ff', 1 - ph), Math.round(-4 + i * 2), Math.round(-14 - ph * 12), 1, 2); } g.restore(); }
      ell(g, '#3a5a2a', 230 + Math.sin(t * 1.4) * 3, 124, 8, 3); rect(g, '#f4f4e8', 224 + Math.round(Math.sin(t * 1.4) * 3), 122, 2, 1);
    },
    life(g, t) {
      for (let i = 0; i < 2; i++) { const a = t * 1.1 + i * 3, px = 143 + Math.cos(a) * 16, py = 44 + Math.sin(a) * 6; ell(g, '#eef0f4', px, py, 5, 3); const w = Math.sin(t * 14 + i) * 4; poly(g, '#d8dce4', [px - 2, py, px - 9, py - 3 - w, px - 6, py + 1]); poly(g, '#d8dce4', [px + 2, py, px + 9, py - 3 - w, px + 6, py + 1]); }
      for (let i = 0; i < 5; i++) { const q = i / 5 * Math.PI * 2 + t; ell(g, '#f8a8c8', 208 + Math.cos(q) * 4, 153 + Math.sin(q) * 4, 3, 2, q); }
      ell(g, '#f8e070', 208, 153, 2, 2);
      for (let i = 0; i < 6; i++) { const ph = (t * 0.4 + i / 6) % 1; ell(g, rgba('#f8a8c8', 1 - ph), 208 + Math.sin(ph * 6 + i) * 12, 150 + ph * 30, 1.6, 1); }
    }
  };

  S.megumin = {
    title: 'Холм у старого замка',
    aura: 'fire',
    frags: [
      ['Чомусуке', 'Чёрная кошка с крыльями и красным крестом. Бегает от Даркнесс, царапает Акву.'],
      ['Посох с манатитом', 'В навершии парит красный манатит высшей пробы. Без посоха взрыв тоже выйдет.'],
      ['Магический круг', 'Чернее черноты, темнее тьмы. Свои слова в заклинании делают взрыв сильнее.'],
      ['Старый замок', 'Мегумин взрывала его каждый день. Генерал Вердия, живший там, долго терпел.'],
      ['Тетрадь побед', 'Счёт побед над Юн-юн. Мегумин записывает каждую, даже нечестную.'],
      ['Сто очков', 'Казума носит её домой на спине и ставит оценку каждому взрыву.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, 150, [[0, '#2a1438'], [0.5, '#a8443a'], [1, '#f0a050']]);
      ell(g, '#ffd890', 250, 120, 16, 16);
      poly(g, '#4a2a2a', [0, 130, 60, 112, 120, 120, 170, 96, 230, 108, 290, 100, LW, 110, LW, 150, 0, 150]);
      poly(g, '#2a1a1a', [150, 100, 158, 84, 166, 84, 166, 72, 172, 72, 172, 84, 180, 84, 186, 100]);
      rect(g, '#3a2222', 166, 60, 6, 14); poly(g, '#3a2222', [164, 60, 169, 52, 174, 60]); rect(g, '#2a1a1a', 186, 78, 8, 22); poly(g, '#2a1a1a', [185, 78, 190, 70, 195, 78]);
      if (!live) lighter(g, () => glow(g, 176, 40, 40, '#ff6a5a', 0.3));
      g.save(); g.translate(144, 44);
      g.strokeStyle = '#ff6a5a'; g.lineWidth = 1;
      g.beginPath(); g.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.ellipse(0, 0, 10, 3.4, 0, 0, Math.PI * 2); g.stroke();
      for (let i = 0; i < 8; i++) { const q = i / 8 * Math.PI * 2; line(g, '#ffb070', 1, Math.cos(q) * 10, Math.sin(q) * 3.4, Math.cos(q) * 14, Math.sin(q) * 5); }
      g.restore();
      poly(g, '#3a3a2a', [0, 150, LW, 150, LW, LH, 0, LH]);
      for (let i = 0; i < 60; i++) { const gx = hx(i, 2, 71) * LW, gy = 154 + hx(i, 3, 71) * 80; line(g, '#5a6a3a', 1, gx, gy, gx + 1, gy - 4); }
      ell(g, '#141018', 112, 172, 7, 6); ell(g, '#141018', 117, 166, 4.6, 4.2); poly(g, '#141018', [114, 163, 115, 158, 117, 162]); poly(g, '#141018', [118, 162, 120, 158, 121, 163]);
      poly(g, '#2a2030', [106, 168, 98, 160, 104, 170]); poly(g, '#2a2030', [118, 170, 128, 162, 122, 172]);
      rect(g, '#d8303a', 116, 164, 2, 1); rect(g, '#d8303a', 116.5, 163.5, 1, 2); rect(g, '#ffd040', 115, 166, 1, 1); rect(g, '#ffd040', 119, 166, 1, 1);
      g.save(); g.translate(112, 104); g.rotate(0.2);
      rect(g, '#6a4424', -1, -6, 3, 22); g.strokeStyle = '#6a4424'; g.lineWidth = 2; g.beginPath(); g.arc(-4, -8, 6, -0.2, 3.6); g.stroke(); g.lineWidth = 1;
      if (!live) { lighter(g, () => glow(g, -4, -9, 9, '#ff4a5a', 0.6)); poly(g, '#e8243a', [-4, -13, -1, -9, -4, -5, -7, -9]); }
      g.restore();
      rect(g, '#3a2a4a', 196, 98, 22, 16); rect(g, '#f2eadc', 198, 100, 18, 12); line(g, '#6a5a7a', 1, 207, 100, 207, 112);
      for (let i = 0; i < 4; i++) { rect(g, '#3a3040', 199, 102 + i * 2.6, 6, 1); rect(g, '#c83030', 209, 102 + i * 2.6, 1 + (i % 3), 1); rect(g, '#c83030', 211, 102 + i * 2.6, 1, 1); }
      g.save(); g.translate(208, 166); g.rotate(0.1);
      rect(g, '#5a3a20', -1, 2, 2, 14); rect(g, '#f2eadc', -11, -8, 22, 12); rect(g, '#c83030', -11, -8, 22, 2);
      g.font = 'bold 8px serif'; g.fillStyle = '#3a2410'; g.textAlign = 'center'; g.fillText('100', 0, 2); g.textAlign = 'left';
      g.restore();
    },
    decor(g, t) {
      lighter(g, () => glow(g, 176, 40, 36 + 6 * Math.sin(t * 2), '#ff6a5a', 0.3));
      g.save(); g.translate(144, 44); g.rotate(0);
      lighter(g, () => { for (let i = 0; i < 8; i++) { const q = t * 1.5 + i / 8 * Math.PI * 2; rect(g, rgba('#ffd0a0', 0.8), Math.round(Math.cos(q) * 12), Math.round(Math.sin(q) * 4), 1, 1); } });
      g.restore();
      lighter(g, () => glow(g, 108, 95, 8 + 2 * Math.sin(t * 5), '#ff4a5a', 0.6));
      poly(g, '#e8243a', [108, 90 + Math.sin(t * 3), 111, 94, 108, 98 + Math.sin(t * 3), 105, 94]);
      for (let i = 0; i < 8; i++) { const ph = (t * 0.3 + i / 8) % 1; rect(g, rgba('#ffb070', 1 - ph), Math.round(150 + hx(i, 2, 72) * 50), Math.round(100 - ph * 40), 1, 1); }
    },
    life(g, t) {
      const k = 0.5 + 0.5 * Math.sin(t * 0.9), r = 10 + 24 * k;
      lighter(g, () => { glow(g, 176, 86, r * 1.6, '#ff6a20', 0.5 * k); glow(g, 176, 86, r * 0.5, '#fff0c0', 0.6 * k); ring(g, rgba('#ffd8a0', 0.7 * (1 - k)), 2, 176, 86, r * 1.4); });
      ell(g, '#141018', 112, 172, 7, 6); ell(g, '#141018', 117, 166 + Math.sin(t * 3) * 0.6, 4.6, 4.2);
      const w = Math.sin(t * 6) * 3; poly(g, '#2a2030', [106, 168, 98, 160 - w, 104, 170]); poly(g, '#2a2030', [118, 170, 128, 162 - w, 122, 172]);
    }
  };

  S.darkness = {
    title: 'Капустная страда',
    aura: 'phys',
    frags: [
      ['Двуручный меч', 'Сила у Даркнесс огромная, но меч почти никогда не попадает по цели.'],
      ['Летающая капуста', 'В капустную страду Даркнесс закрыла собой других искателей от кочанов.'],
      ['Ворота Акселя', 'Город начинающих искателей. Здесь Даркнесс попросилась в отряд Казумы.'],
      ['Знамя Дастинесс', 'Знатный род, верный короне. Своего имени Лалатина Даркнесс стесняется.'],
      ['Подвеска Эрис', 'Род Дастинесс поколениями служит ордену Эрис. Даркнесс молится каждый день.'],
      ['Красные заколки', 'Заколки-кресты по бокам чёлки. Хвост перевязан косой.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, 140, [[0, '#6ab0e8'], [1, '#d8eef8']]);
      for (const [cx, cy, r] of [[50, 30, 20], [280, 46, 16]]) { ell(g, '#ffffff', cx, cy, r, r * 0.4); }
      rect(g, '#b8a888', 96, 60, 128, 80); for (let x = 96; x < 224; x += 12) rect(g, '#a89878', x, 60, 1, 80);
      for (let x = 96; x < 224; x += 16) rect(g, '#b8a888', x, 54, 8, 6);
      poly(g, '#8a7a5a', [128, 140, 128, 62, 160, 62, 160, 140]); arch(g, 132, 92, 24, 48, '#3a2a1a');
      rect(g, '#9a8a6a', 128, 26, 32, 36); for (let x = 128; x < 160; x += 8) rect(g, '#9a8a6a', x, 20, 5, 6); rect(g, '#2a2018', 140, 36, 8, 12);
      rect(g, '#5a4a3a', 176, 24, 2, 40);
      poly(g, '#e8c040', [178, 26, 192, 28, 192, 52, 185, 48, 178, 52]); poly(g, '#2a2a34', [178, 30, 192, 32, 192, 36, 178, 34]);
      rect(g, '#c8ccd8', 182, 38, 6, 6); poly(g, '#d03030', [185, 36, 186, 41, 185, 46, 184, 41]);
      poly(g, '#5a8a3a', [0, 140, LW, 140, LW, LH, 0, LH]);
      for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) { const x = 12 + i * 36 + (r % 2) * 18, y = 150 + r * 22; if (x > 90 && x < 230 && y > 140 && y < 200) continue; cabbage(g, x, y, 0.9); }
      g.save(); g.translate(112, 168); g.rotate(0.15);
      rect(g, '#c8ccd8', -2, -26, 4, 30); rect(g, '#ffffff', -2, -26, 1, 30); rect(g, '#d8b050', -9, 4, 18, 3); rect(g, '#2a2228', -2, 7, 4, 10); ell(g, '#d8b050', 0, 18, 3, 3);
      g.restore();
      ell(g, rgba('#000000', 0.3), 112, 174, 10, 3);
      if (!live) cabbage(g, 112, 104, 1.3, -0.3);
      g.save(); g.translate(208, 104);
      line(g, '#c8a040', 1, -4, -10, 0, -2); line(g, '#c8a040', 1, 4, -10, 0, -2);
      ell(g, '#e8c040', 0, 3, 5, 6); ell(g, '#fff0b0', -1, 1, 2, 3); poly(g, '#d8dce8', [0, -1, 2, 3, 0, 7, -2, 3]);
      if (!live) lighter(g, () => glow(g, 0, 3, 12, '#ffe880', 0.5));
      g.restore();
      for (const [cx, cy] of [[202, 166], [214, 168]]) { rect(g, '#d03030', cx - 1, cy - 5, 3, 10); rect(g, '#d03030', cx - 4, cy - 2, 9, 3); rect(g, '#ff8080', cx, cy - 4, 1, 3); }
      ell(g, rgba('#000000', 0.25), 208, 173, 12, 2);
    },
    decor(g, t) {
      for (let i = 0; i < 6; i++) { const ph = (t * 0.35 + i / 6) % 1; cabbage(g, -20 + ph * 360, 40 + i * 14 + Math.sin(t * 3 + i) * 6, 0.6, t * 3 + i); }
      lighter(g, () => glow(g, 208, 107, 10 + 2 * Math.sin(t * 4), '#ffe880', 0.45));
      poly(g, '#e8c040', [178, 26, 192, 28 + Math.sin(t * 4) * 2, 192, 52 + Math.sin(t * 4) * 2, 185, 48, 178, 52]);
    },
    life(g, t) {
      const x = 112 + Math.sin(t * 1.3) * 8, y = 104 + Math.cos(t * 1.7) * 6;
      cabbage(g, x, y, 1.3, t * 2);
      for (let i = 0; i < 5; i++) { const ph = (t * 0.6 + i / 5) % 1; ell(g, rgba('#ff7ab8', 1 - ph), 160 + (hx(i, 2, 93) - 0.5) * 40, 110 - ph * 50, 1.6, 1.6); }
    }
  };

  function coat(g, x, y, col, lining, len) {
    poly(g, col, [x - 9, y + 4, x + 9, y + 4, x + 12, y + len, x - 12, y + len]);
    poly(g, lining, [x - 2, y + 6, x + 2, y + 6, x + 4, y + len, x - 4, y + len]);
    rect(g, G.shade(col, 0.25), x - 9, y + 4, 18, 2);
    line(g, '#2a2228', 1, x, y - 2, x, y + 4); ring(g, '#8a8090', 1, x, y - 4, 2);
  }

  function spider(g, x, y) {
    ell(g, '#1a1018', x, y, 2.4, 2); ell(g, '#1a1018', x, y - 2.4, 1.6, 1.4);
    for (let i = 0; i < 4; i++) { line(g, '#1a1018', 1, x - 1, y - 0.5 + i * 0.6, x - 4, y - 2 + i * 1.6); line(g, '#1a1018', 1, x + 1, y - 0.5 + i * 0.6, x + 4, y - 2 + i * 1.6); }
  }

  S.kafka = {
    title: 'Ложа в опере',
    aura: 'elec',
    frags: [
      ['Da Capo', 'С начала. На сцене снова поднимают занавес.'],
      ['Fortississimo', 'Громче некуда. Оркестр играет в полную силу.'],
      ['Capriccio', 'Скрипка ждёт в футляре. Пули послушнее, но играть Кафка умеет.'],
      ['Recitativo', 'Шёпот духа. «Послушай...» Этому голосу не возражают.'],
      ['Doloroso', 'Бархатные пальто красивы и хрупки. Ухаживать за ними трудно.'],
      ['Leggiero', 'Легко и тихо. Сценарий Элио исполняется точно.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#14040c'], [0.6, '#2a0818'], [1, '#12040a']]);
      for (let x = 0; x < LW; x += 14) rect(g, rgba('#000000', 0.18), x, 0, 2, 170);
      rect(g, '#0a0206', 60, 24, 200, 110);
      vgrad(g, 24, 134, [[0, '#1a0812'], [1, '#3a1220']], 62, 196);
      for (let i = 0; i < 10; i++) { const x = 62 + i * 20; poly(g, i % 2 ? '#6a1228' : '#8a1a34', [x, 24, x + 20, 24, x + 22, 48 + (i % 3) * 4, x - 2, 48 + (i % 3) * 4]); }
      poly(g, '#7a1630', [62, 24, 88, 24, 74, 134, 62, 134]); poly(g, '#7a1630', [258, 24, 232, 24, 246, 134, 258, 134]);
      rect(g, '#2a1218', 96, 108, 128, 10); rect(g, '#d8b050', 96, 108, 128, 2);
      lighter(g, () => poly(g, rgba('#ffe0f0', 0.16), [150, 24, 170, 24, 200, 110, 120, 110]));
      for (let i = 0; i < 5; i++) { const x = 116 + i * 22; rect(g, '#14060c', x, 94, 6, 14); ell(g, '#14060c', x + 3, 92, 3.4, 3.4); }
      rect(g, '#d8b050', 56, 20, 208, 4); rect(g, '#d8b050', 56, 134, 208, 4);
      rect(g, '#d8b050', 160, 0, 1, 14);
      for (let i = 0; i < 5; i++) { ell(g, '#d8b050', 146 + i * 7, 16, 2.4, 1.4); }
      ell(g, '#c8a040', 160, 14, 16, 4);
      rect(g, '#3a0c1a', 0, 150, LW, 6); rect(g, '#d8b050', 0, 150, LW, 2);
      for (let x = 6; x < LW; x += 14) { rect(g, '#5a1424', x, 156, 6, 18); rect(g, '#d8b050', x, 156, 6, 1); }
      vgrad(g, 174, LH, [[0, '#2a0a14'], [1, '#14040a']]);
      rect(g, '#d8b050', 0, 174, LW, 2);
      rect(g, '#2a2228', 270, 40, 3, 124); rect(g, '#2a2228', 258, 40, 28, 3); rect(g, '#2a2228', 262, 162, 20, 3);
      coat(g, 262, 46, '#22202a', '#6a1e48', 64); coat(g, 280, 48, '#4a1a2e', '#d8b050', 58);
      rect(g, '#1a0e14', 18, 186, 64, 30); rect(g, '#3a2026', 20, 188, 60, 26);
      poly(g, '#1a1418', [22, 178, 76, 178, 80, 190, 18, 190]);
      poly(g, '#6a3a2a', [28, 176, 70, 172, 74, 182, 32, 186]); ell(g, '#8a5032', 48, 178, 10, 4, -0.1);
      for (let i = 0; i < 4; i++) line(g, '#e8d8c0', 0.6, 38 + i * 4, 176, 60 + i * 4, 174);
      rect(g, '#2a1218', 210, 188, 46, 24); rect(g, '#1a0a10', 214, 190, 38, 4);
      ell(g, '#0a0608', 233, 186, 16, 4); ell(g, '#2a2228', 233, 186, 5, 1.6); ell(g, '#d83a5a', 233, 186, 2, 0.8);
      line(g, '#c8ccd4', 1, 248, 180, 238, 186);
      if (!live) { line(g, rgba('#f0dcff', 0.6), 1, 120, 0, 120, 70); spider(g, 120, 72); }
      lighter(g, () => glow(g, 160, 30, 30, '#ffd8a0', 0.35));
    },
    decor(g, t) {
      lighter(g, () => { glow(g, 160, 30, 24 + 2 * Math.sin(t * 6), '#ffd8a0', 0.25); poly(g, rgba('#ffe0f0', 0.06 + 0.04 * Math.sin(t * 1.3)), [150 + Math.sin(t * 0.7) * 20, 24, 170 + Math.sin(t * 0.7) * 20, 24, 200, 110, 120, 110]); });
      for (let i = 0; i < 5; i++) { const ph = (t * 0.2 + i / 5) % 1; rect(g, rgba('#ffb8e0', Math.sin(ph * Math.PI)), Math.round(110 + i * 24 + Math.sin(t + i) * 4), Math.round(104 - ph * 70), 2, 2); }
    },
    life(g, t) {
      const y = 70 + Math.sin(t * 0.9) * 10, x = 120 + Math.sin(t * 1.3) * 3;
      line(g, rgba('#f0dcff', 0.6), 1, 120, 0, x, y - 2); spider(g, x, y);
      g.save(); g.translate(233, 186); g.rotate(t * 3); rect(g, '#5a4048', -6, -0.5, 12, 1); g.restore();
      if (Math.sin(t * 2.3) > 0.97) lighter(g, () => line(g, '#d890ff', 1, 150, 30, 140, 60));
    }
  };

  function arcade(g, x, y, scr, glowCol) {
    rect(g, '#141428', x, y, 34, 66); rect(g, '#22224a', x + 2, y + 2, 30, 62);
    poly(g, '#2a2a5a', [x, y, x + 34, y, x + 30, y - 8, x + 4, y - 8]);
    rect(g, glowCol, x + 4, y - 6, 26, 4);
    rect(g, '#0a0a14', x + 4, y + 8, 26, 20); rect(g, scr, x + 5, y + 9, 24, 18);
    rect(g, '#3a3a6a', x + 2, y + 32, 30, 6); ell(g, '#ff5a8a', x + 10, y + 34, 2, 1.4); ell(g, '#50dcff', x + 22, y + 34, 2, 1.4);
  }

  S.silverwolf = {
    title: 'Подвал с автоматами',
    aura: 'quant',
    frags: [
      ['Социальная инженерия', 'Ресторан с одной работницей и подвал с автоматами. Тут прошло её детство.'],
      ['Бот-сеть', 'Друг, Повелитель демонов, Прислужник и Раб. Её команда живёт в Прометее.'],
      ['Полезная нагрузка', '«Понг». Две линии и светящийся шар. Играть можно целый день.'],
      ['Порт перенаправления', 'В рейтингах всех автоматов осталось только её имя.'],
      ['Брутфорс', 'Никакая защита не устоит. Даже на станции «Герта».'],
      ['Оверлейная сеть', 'Редактирование эфира. Данные реальности можно подправить.']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#06061a'], [0.6, '#120c2e'], [1, '#08061a']]);
      for (let y = 0; y < 150; y += 12) rect(g, rgba('#000000', 0.2), 0, y, LW, 1);
      rect(g, '#1a1430', 0, 0, LW, 18); for (let x = 0; x < LW; x += 40) rect(g, '#2a2248', x, 0, 2, 18);
      line(g, '#ff5ab8', 2, 20, 30, 120, 30); line(g, '#50dcff', 2, 200, 26, 300, 26);
      rect(g, '#2a1a3a', 136, 38, 48, 30); rect(g, '#ff5ab8', 138, 40, 44, 26); rect(g, '#2a1a3a', 140, 42, 40, 22);
      g.fillStyle = '#ffd8f0'; g.font = 'bold 13px Tahoma, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('ИГРЫ', 160, 54);
      arcade(g, 16, 92, live ? '#0a1a3a' : '#0a1a3a', '#ff5ab8');
      arcade(g, 56, 96, '#1a0a2a', '#50dcff');
      arcade(g, 236, 94, '#0a2a1a', '#ffd040');
      arcade(g, 276, 90, '#2a0a1a', '#7a6af0');
      if (!live) { rect(g, '#e8ecff', 22, 108, 1, 6); rect(g, '#e8ecff', 44, 112, 1, 6); rect(g, '#ffffff', 32, 110, 2, 2); }
      vgrad(g, 158, LH, [[0, '#1a1430'], [1, '#0a0818']]);
      for (let i = 0; i < 8; i++) line(g, rgba('#7a6af0', 0.25), 1, 160 + (i - 3.5) * 10, 158, 160 + (i - 3.5) * 60, LH);
      rect(g, '#2a2440', 104, 168, 112, 8); rect(g, '#3a3460', 104, 168, 112, 2); rect(g, '#1a1428', 110, 176, 6, 30); rect(g, '#1a1428', 204, 176, 6, 30);
      rect(g, '#0a0a14', 118, 140, 40, 28); rect(g, '#1a2a5a', 120, 142, 36, 22); rect(g, '#2a2440', 134, 164, 8, 4);
      for (let i = 0; i < 4; i++) rect(g, rgba('#50dcff', 0.7), 123, 146 + i * 4, 8 + Math.floor(hx(i, 3, 61) * 20), 1);
      rect(g, '#0a0a14', 162, 146, 30, 22); rect(g, '#2a1a4a', 164, 148, 26, 16);
      g.save(); g.translate(188, 166); g.rotate(-0.15); rect(g, '#2a2a40', -12, -3, 24, 6); rect(g, '#7a6af0', -12, -3, 24, 1); rect(g, '#1a1a28', -10, 3, 5, 6); rect(g, '#50dcff', 6, -2, 3, 2); g.restore();
      ell(g, '#5a4a9a', 70, 196, 26, 10); ell(g, '#7a6ab8', 66, 192, 18, 6);
      ell(g, '#ffd8e8', 56, 186, 6, 4); ell(g, '#c8b8ff', 80, 188, 5, 3.4);
      lighter(g, () => { glow(g, 160, 54, 40, '#ff5ab8', 0.3); glow(g, 40, 110, 24, '#50dcff', 0.25); });
    },
    decor(g, t) {
      lighter(g, () => { glow(g, 160, 54, 34 + 4 * Math.sin(t * 8) * (Math.sin(t * 1.7) > 0.8 ? 1 : 0.2), '#ff5ab8', 0.2); });
      for (const [x, y, c] of [[61, 105, '#ff5ab8'], [241, 103, '#ffd040'], [281, 99, '#7a6af0']]) for (let i = 0; i < 3; i++) rect(g, rgba(c, 0.4 + 0.4 * Math.sin(t * 5 + i + x)), x + i * 7, y + 6 + i * 4, 5, 2);
      for (let i = 0; i < 4; i++) rect(g, rgba('#9af0ff', 0.4 + 0.4 * Math.sin(t * 4 + i)), 123, 146 + i * 4, 4, 1);
    },
    life(g, t) {
      const px = 22 + Math.abs(((t * 18) % 40) - 20), py = 102 + Math.abs(((t * 11) % 32) - 16) * 0.5;
      rect(g, '#e8ecff', 22, 102 + Math.sin(t * 2) * 3 + 4, 1, 6); rect(g, '#e8ecff', 44, 102 + Math.sin(t * 2 + 1) * 3 + 4, 1, 6);
      rect(g, '#ffffff', Math.round(px), Math.round(py + 4), 2, 2);
      for (let i = 0; i < 6; i++) { const ph = (t * 0.3 + i / 6) % 1; rect(g, rgba(i % 2 ? '#7a6af0' : '#50dcff', Math.sin(ph * Math.PI)), Math.round(120 + hx(i, 5, 61) * 80), Math.round(140 - ph * 100), 3, 3); }
    }
  };

  function graveSword(g, x, y, h, rot, tassel, sway) {
    g.save(); g.translate(x, y); g.rotate(rot);
    rect(g, '#4a4650', -1, -h, 3, h); rect(g, '#8a8690', -1, -h, 1, h);
    rect(g, '#1a1418', -5, -h - 2, 11, 2); rect(g, '#2a2026', -1, -h - 10, 3, 8); rect(g, '#c8a050', -1, -h - 11, 3, 1);
    if (tassel) poly(g, '#c8302a', [0, -h - 6, 2, -h - 6, 3 + (sway || 0), -h + 6, -1 + (sway || 0), -h + 6]);
    g.restore();
  }

  S.blade = {
    title: 'Кладбище мечей',
    aura: 'swords',
    frags: [
      ['Каждый год', 'Каждый год он привозил сюда несколько новых мечей.'],
      ['Последний миг', 'Он видел последний миг каждого владельца этих мечей.'],
      ['Расколотый клинок', 'Старинный меч в трещинах, как тело и разум владельца.'],
      ['Мара', 'Когда приходит Мара, он меняется.'],
      ['Шёпот Кафки', '«Послушай, Блэйдик, расслабься». Даже Мара слушает её голос.'],
      ['Недоступная сторона', 'Когда же сюда привезут и его меч?']
    ],
    paint(g, X, live) {
      vgrad(g, 0, LH, [[0, '#0a0206'], [0.5, '#3a0a10'], [1, '#6a1414']]);
      for (let i = 0; i < 30; i++) rect(g, rgba('#ffd8c8', 0.2 + 0.4 * hx(i, 4, 71)), Math.floor(hx(i, 5, 71) * LW), Math.floor(hx(6, i, 71) * 80), 1, 1);
      lighter(g, () => glow(g, 230, 58, 60, '#ff4a32', 0.5));
      ell(g, '#c8322a', 230, 58, 26, 26); ell(g, '#e04a36', 225, 53, 20, 20);
      poly(g, '#2a0a0e', [0, 130, 50, 116, 110, 126, 170, 110, 240, 124, LW, 112, LW, 170, 0, 170]);
      poly(g, '#14060a', [0, 160, 80, 150, 160, 158, 240, 148, LW, 156, LW, LH, 0, LH]);
      for (let i = 0; i < 16; i++) graveSword(g, 10 + i * 20 + hx(i, 1, 72) * 8, 158 + hx(i, 2, 72) * 30, 18 + hx(i, 3, 72) * 20, (hx(i, 4, 72) - 0.5) * 0.5, i % 4 === 1, 0);
      rect(g, '#3a3036', 140, 138, 30, 24); poly(g, '#3a3036', [140, 138, 155, 128, 170, 138]); rect(g, '#2a2228', 146, 144, 18, 2); rect(g, '#2a2228', 146, 150, 14, 2);
      for (const [x, c] of [[132, '#c8202e'], [178, '#d8303a'], [186, '#c8202e']]) { rect(g, '#2a4a2a', x, 154, 1, 8); for (let k = 0; k < 5; k++) line(g, c, 1, x, 154, x + Math.cos(k * 1.25) * 4, 154 + Math.sin(k * 1.25) * 3 - 2); }
      if (!live) graveSword(g, 200, 196, 50, 0.12, true, 0);
      ell(g, '#0a0204', 160, 214, 110, 8);
    },
    decor(g, t) {
      lighter(g, () => glow(g, 230, 58, 54 + 3 * Math.sin(t * 1.5), '#ff4a32', 0.2));
      for (let i = 0; i < 18; i++) { const ph = (t * 0.08 + hx(i, 7, 72)) % 1; rect(g, i % 3 ? '#ff7a5a' : '#ffd8c8', Math.round((hx(i, 8, 72) * 340 - ph * 90 + 340) % 340 - 10), Math.round(ph * LH), 2, 1); }
    },
    life(g, t) {
      graveSword(g, 200, 196, 50, 0.12, true, Math.sin(t * 2) * 2);
      lighter(g, () => { for (let i = 0; i < 4; i++) line(g, rgba('#ff4a2a', 0.5 + 0.5 * Math.sin(t * 3 + i)), 1, 202 + i * 1.4, 186 - i * 11, 204 + i * 1.4, 180 - i * 11); glow(g, 204, 170, 14, '#ff3a2a', 0.3 + 0.2 * Math.sin(t * 3)); });
    }
  };

  function gepardBanner(g, w) {
    poly(g, '#2d5bd3', [178, 24, 194, 24 + w, 194, 52 + w, 186, 47 + w * 0.6, 178, 52]); poly(g, '#1a3a9a', [186, 24 + w * 0.5, 194, 24 + w, 194, 52 + w, 186, 47 + w * 0.6]);
    rect(g, '#d8b050', 178, 24, 16, 2); poly(g, '#d8b050', [186, 30 + w * 0.5, 190, 36 + w * 0.5, 186, 42 + w * 0.5, 182, 36 + w * 0.5]); poly(g, '#ffffff', [186, 32 + w * 0.5, 188, 36 + w * 0.5, 186, 40 + w * 0.5, 184, 36 + w * 0.5]);
  }

  function hertaWall(g) {
    vgrad(g, 0, LH, [[0, '#0e0818'], [0.6, '#24143a'], [1, '#0c0614']]);
    for (let x = 0; x < LW; x += 20) { rect(g, rgba('#000000', 0.2), x, 20, 1, 136); rect(g, rgba('#c8a0ff', 0.05), x + 1, 20, 1, 136); }
  }

})(globalThis.Hsr98 = globalThis.Hsr98 || {});
