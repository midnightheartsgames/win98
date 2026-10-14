(function (H) {
  'use strict';
  const K = H.Cine.Kit, P = H.Personas;
  const { LW, LH, BAR, cl, lerp, eOut, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash } = K;
  const FLOOR = LH - BAR;
  const hero = (S, look, x, y, o) => S.fig(look, x, y, Object.assign({ k: 2 }, o));

  function zig(g, x0, y0, x1, y1, seed, col, w, a) {
    if (a <= 0) return;
    lighter(g, () => {
      for (const [ww, c] of [[w + 4, rgba(col, 0.4 * a)], [Math.max(1, w - 1), rgba('#ffffff', a)]]) {
        g.strokeStyle = c; g.lineWidth = ww; g.beginPath(); g.moveTo(x0, y0);
        for (let i = 1; i < 7; i++) { const k = i / 7; g.lineTo(lerp(x0, x1, k) + (hx(i, seed, 3) - 0.5) * 24, lerp(y0, y1, k)); }
        g.lineTo(x1, y1); g.stroke();
      }
    });
  }
  function petals(g, T, n, seed, col, a) {
    for (let i = 0; i < n; i++) { const ph = (T * 0.4 + hx(i, 1, seed)) % 1, x = hx(i, 2, seed) * LW + Math.sin(T * 2 + i) * 8; g.save(); g.globalAlpha = cl(a == null ? 1 : a); g.translate(x, ph * LH); g.rotate(T * 2 + i); ell(g, i % 3 ? col : '#ffffff', 0, 0, 2.4, 1.3); g.restore(); }
  }
  function swirl(g, T, cx, cy, r0, r1, col, a, n) {
    lighter(g, () => { for (let k = 0; k < (n || 4); k++) { g.strokeStyle = rgba(col, a * (1 - k * 0.15)); g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, r0 + k * (r1 - r0) / (n || 4), (r0 + k * (r1 - r0) / (n || 4)) * 0.3, T * 3 + k, 0, Math.PI * 1.4); g.stroke(); } });
  }
  function spikes(g, x0, x1, y, h, k, seed) {
    for (let i = 0; i < 9; i++) { const x = lerp(x0, x1, i / 8), hh = h * (0.6 + 0.4 * hx(i, seed, 2)) * eOut(cl(k * 2 - i / 9)); if (hh <= 0) continue; poly(g, '#bfe8ff', [x - hh * 0.2, y, x, y - hh, x + hh * 0.2, y]); poly(g, '#ffffff', [x - hh * 0.05, y, x, y - hh, x + hh * 0.07, y - hh * 0.3]); }
  }
  function fireWall(g, T, x0, x1, y, h, a) {
    lighter(g, () => { glow(g, (x0 + x1) / 2, y - h * 0.4, (x1 - x0) * 0.6, '#ff6a20', 0.45 * a); for (let i = 0; i < 14; i++) { const x = lerp(x0, x1, i / 13), fh = h * (0.5 + 0.5 * hx(i, Math.floor(T * 10), 31)); poly(g, rgba(i % 2 ? '#ffb040' : '#ff4a1a', a), [x - 9, y, x + Math.sin(T * 8 + i) * 4, y - fh, x + 9, y]); } });
  }
  function grid(g, col, a) { for (let x = 0; x < LW; x += 16) rect(g, rgba(col, a), x, 0, 1, LH); for (let y = 0; y < LH; y += 16) rect(g, rgba(col, a), 0, y, LW, 1); }
  function reticle(g, x, y, r, col, a) { lighter(g, () => { ring(g, rgba(col, a), 1.5, x, y, r); line(g, rgba(col, a), 1, x - r - 6, y, x - r + 4, y); line(g, rgba(col, a), 1, x + r - 4, y, x + r + 6, y); line(g, rgba(col, a), 1, x, y - r - 6, x, y - r + 4); line(g, rgba(col, a), 1, x, y + r - 4, x, y + r + 6); }); }
  function bunny(g, x, y, s) {
    g.save(); g.translate(x, y); g.scale(s, s);
    ell(g, '#f4f0ec', 0, 0, 10, 9); ell(g, '#f4f0ec', -5, -14, 3, 9, -0.2); ell(g, '#f4f0ec', 5, -14, 3, 9, 0.2);
    ell(g, '#ffb0c0', -5, -13, 1.2, 6, -0.2); ell(g, '#ffb0c0', 5, -13, 1.2, 6, 0.2); ell(g, '#1e1e22', -3, -1, 1, 1); ell(g, '#1e1e22', 3, -1, 1, 1);
    g.restore();
  }

  const ULTS = {
    yu: {
      line: 'Мириады истин!', side: 'r', d: 1.6, sfx: [[0.1, 'glint'], [0.5, 'ult'], [1.0, 'crit'], [1.1, 'break']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.1, 0.7)), fan = seg(t, 0.9, 1.5);
        vgrad(g, 0, LH, [[0, '#0a0818'], [0.6, '#3a2a10'], [1, '#8a6a20']]);
        lighter(g, () => glow(g, 120, 100, 120, '#ffd850', 0.4 * rise));
        P.draw(g, 'okami', 120, FLOOR + 10 + (1 - rise) * 60, 160, { a: rise, t: T, swing: lerp(-0.4, 0.8, fan) });
        hero(S, P2.look, 70, 262);
        if (fan > 0) lighter(g, () => { for (let i = 0; i < 9; i++) { const a = -0.5 + i * 0.12, len = 320 * eOut(fan); poly(g, rgba(i % 2 ? '#fff4c0' : '#ffd850', 0.55 * (1 - seg(t, 1.3, 1.7))), [140, 90, 140 + Math.cos(a) * len, 90 + Math.sin(a) * len, 140 + Math.cos(a + 0.05) * len, 90 + Math.sin(a + 0.05) * len]); } });
        if (t > 1.0 && t < 1.2) flash(g, '#fff8e0', 0.6 * (1 - seg(t, 1.0, 1.2)));
      }
    },
    yosuke: {
      line: 'Гарудайн! Сдувай их!', side: 'l', d: 1.5, sfx: [[0.1, 'whoosh'], [0.5, 'ult'], [0.9, 'whoosh'], [1.1, 'crit']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.05, 0.6)), gust = seg(t, 0.7, 1.4);
        vgrad(g, 0, LH, [[0, '#04140c'], [1, '#1a5a3a']]);
        P.draw(g, 'jiraiya', 110, FLOOR + 10 + (1 - rise) * 50, 152, { a: rise, t: T * 3 });
        hero(S, P2.look, 60, 262);
        swirl(g, T * 2, 230, 140, 20, 40 + 120 * gust, '#8affc8', 0.8 * (1 - seg(t, 1.3, 1.5)), 6);
        for (let i = 0; i < 20; i++) { const ph = (T * 2 + hx(i, 1, 41)) % 1; poly(g, rgba(i % 2 ? '#5a9a3a' : '#c8e8a0', gust), [140 + ph * 200, 60 + hx(i, 2, 41) * 140, 146 + ph * 200, 58 + hx(i, 2, 41) * 140, 144 + ph * 200, 63 + hx(i, 2, 41) * 140]); }
      }
    },
    chie: {
      line: 'Галактический пинок!', side: 'r', d: 1.5, sfx: [[0.1, 'swing'], [0.55, 'crit'], [0.6, 'break'], [1.1, 'glint']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, kick = seg(t, 0.4, 0.6), fly = seg(t, 0.6, 1.3);
        vgrad(g, 0, LH, [[0, '#04061a'], [1, '#2a3a6a']]);
        for (let i = 0; i < 40; i++) rect(g, rgba('#ffffff', 0.3 + 0.5 * hx(i, 3, 43)), Math.floor(hx(i, 4, 43) * LW), Math.floor(hx(4, i, 43) * 150), 1, 1);
        P.draw(g, 'tomoe', 220, FLOOR + 10, 136, { a: 0.7, swing: lerp(0.4, -0.6, kick) });
        g.save(); g.translate(110, 262); g.rotate(-0.5 * eOut(kick) * (1 - seg(t, 1.0, 1.3))); hero(S, P2.look, 0, 0); g.restore();
        if (kick > 0) lighter(g, () => { g.strokeStyle = rgba('#ffffff', 0.9 * (1 - fly)); g.lineWidth = 4; g.beginPath(); g.arc(110, 262, 90, -1.7, -0.6); g.stroke(); });
        if (fly > 0) { const x = lerp(190, 300, fly), y = lerp(150, 20, eOut(fly)); lighter(g, () => { line(g, rgba('#bfe8ff', 0.8), 3, 190, 150, x, y); glow(g, x, y, 14, '#ffffff', 0.9); }); }
        if (t > 1.15) lighter(g, () => { const s = 6 + 4 * Math.sin(T * 20); poly(g, '#ffffff', [300, 20 - s, 302, 18, 300 + s, 20, 302, 22, 300, 20 + s, 298, 22, 300 - s, 20, 298, 18]); });
      }
    },
    yukiko: {
      line: 'Пламя Коноханы!', side: 'l', d: 1.6, team: 'heal', sfx: [[0.1, 'glint'], [0.5, 'ult'], [0.9, 'steam'], [1.2, 'heal']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.05, 0.6)), wave = seg(t, 0.7, 1.3);
        vgrad(g, 0, LH, [[0, '#1a0610'], [1, '#5a1420']]);
        P.draw(g, 'sakuya', 200, FLOOR + 10 + (1 - rise) * 50, 152, { a: rise, t: T });
        hero(S, P2.look, 80, 262);
        fireWall(g, T, lerp(320, 0, eOut(wave)), LW, FLOOR + 4, 70, wave * (1 - seg(t, 1.4, 1.6)));
        petals(g, T, 30, 45, '#ff9ac0', rise);
      }
    },
    kanji: {
      line: 'Первобытная сила!', side: 'r', d: 1.6, sfx: [[0.1, 'rumble'], [0.6, 'swing'], [0.85, 'break'], [0.9, 'crit']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.05, 0.55)), slam = seg(t, 0.75, 0.9), sh = slam > 0 && slam < 1 ? Math.sin(T * 80) * 4 : 0;
        g.save(); g.translate(sh, 0);
        vgrad(g, 0, LH, [[0, '#0a0606'], [1, '#3a2010']]);
        lighter(g, () => glow(g, 200, 100, 110, '#ffd040', 0.35 * rise));
        P.draw(g, 'mikazuchi', 200, FLOOR + 10 + (1 - rise) * 50, 160, { a: rise, swing: lerp(-0.4, 1.4, eOut(slam)) });
        hero(S, P2.look, 80, 262);
        if (slam > 0) { for (let i = 0; i < 8; i++) { const a = -Math.PI * (0.05 + i * 0.12); line(g, '#ffd040', 2, 250, FLOOR, 250 + Math.cos(a) * 90 * slam, FLOOR + Math.sin(a) * 14 * slam); } zig(g, 250, 0, 250, FLOOR, 5, '#ffd040', 3, 1 - seg(t, 1.0, 1.4)); }
        g.restore();
        if (slam > 0) flash(g, '#fff4c0', 0.6 * (1 - seg(t, 0.85, 1.05)));
      }
    },
    rise: {
      line: 'Третий глаз! Вижу всё.', side: 'l', d: 1.6, team: 'buff', sfx: [[0.1, 'tech'], [0.5, 'ult'], [0.9, 'select'], [1.1, 'buff']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0.05, 0.6)), scan = seg(t, 0.6, 1.3);
        vgrad(g, 0, LH, [[0, '#04061a'], [1, '#2a0a3a']]);
        grid(g, '#ff6ab0', 0.12 * rise);
        P.draw(g, 'himiko', 210, FLOOR + 10 + (1 - rise) * 50, 152, { a: rise, t: T });
        hero(S, P2.look, 80, 262);
        lighter(g, () => { for (let i = 0; i < 4; i++) { const q = (T * 0.9 + i / 4) % 1; ring(g, rgba('#ffd850', (1 - q) * 0.7 * rise), 1.5, 210, 60, 10 + q * 180); } });
        if (scan > 0) [[60, 70], [150, 50], [250, 90]].forEach(([x, y], i) => reticle(g, x, y, 12 + 6 * Math.sin(T * 6 + i), '#ff6ab0', scan * (1 - seg(t, 1.4, 1.6))));
      }
    }
  };

  const FUS = {
    f_partners: {
      lines: [[0, 'Ёсуке, вперёд!'], [1, 'Партнёр, я с тобой!']], swap: 0.8, d: 1.8, sfx: [[0.1, 'glint'], [0.6, 'whoosh'], [0.95, 'crit'], [1.2, 'ult'], [1.4, 'break']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, [Yu, Yo] = P2.m, k = eOut(seg(t, 0.1, 0.6)), go = seg(t, 0.9, 1.5);
        vgrad(g, 0, LH, [[0, '#0a0818'], [1, '#1a3a2a']]);
        P.draw(g, 'izanagi', 90, FLOOR + 10, 144, { a: k, swing: lerp(-0.4, 0.8, go) });
        P.draw(g, 'jiraiya', 230, FLOOR + 10, 136, { a: k, t: T * 3 });
        hero(S, Yu.look, 60, 262); hero(S, Yo.look, 260, 262);
        if (go > 0) { zig(g, 160, 0, 160, 150, 7, '#c08aff', 3, 1 - seg(t, 1.5, 1.8)); swirl(g, T * 2, 160, 150, 10, 30 + 90 * go, '#8affc8', 0.8 * (1 - seg(t, 1.5, 1.8)), 5); }
        if (t > 1.35) { const a = 1 - seg(t, 1.6, 1.8); for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2 + T; ell(g, rgba(i % 2 ? '#e8e4dc' : '#bcb6ac', a), 160 + Math.cos(an) * 50, 140 + Math.sin(an) * 22, 18, 14); } }
      }
    },
    f_friends: {
      lines: [[0, 'Юкико, прикрой меня!'], [1, 'Как всегда, Чие.']], swap: 0.8, d: 1.8, team: 'heal', sfx: [[0.1, 'swing'], [0.6, 'break'], [0.9, 'ult'], [1.2, 'steam'], [1.5, 'heal']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, [Ch, Yk] = P2.m, ice = seg(t, 0.4, 0.9), fire = seg(t, 0.9, 1.5);
        vgrad(g, 0, LH, [[0, '#06101e'], [0.5, '#2a1020'], [1, '#4a1420']]);
        P.draw(g, 'tomoe', 80, FLOOR + 10, 136, { a: 0.85, swing: lerp(0.4, -0.5, ice) });
        P.draw(g, 'sakuya', 240, FLOOR + 10, 136, { a: 0.85, t: T });
        hero(S, Ch.look, 110, 262); hero(S, Yk.look, 210, 262);
        spikes(g, 20, 300, FLOOR + 2, 50, ice, 3);
        fireWall(g, T, 0, LW, FLOOR + 4, 60 * fire, fire * (1 - seg(t, 1.6, 1.8)));
        petals(g, T, 24, 47, '#ff9ac0', fire);
      }
    },
    f_emperor: {
      lines: [[1, 'Канджи, цель слева!'], [0, 'Понял. Сшиваю!']], swap: 0.8, d: 1.8, sfx: [[0.1, 'tech'], [0.5, 'select'], [0.9, 'debuff'], [1.2, 'swing'], [1.35, 'break']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, [Kj, Ri] = P2.m, scan = seg(t, 0.1, 0.7), sew = seg(t, 0.7, 1.1), slam = seg(t, 1.15, 1.35);
        vgrad(g, 0, LH, [[0, '#0a0418'], [1, '#2a1410']]);
        grid(g, '#ff6ab0', 0.1);
        P.draw(g, 'himiko', 250, FLOOR + 10, 128, { a: 0.8, t: T });
        P.draw(g, 'mikazuchi', 90, FLOOR + 10, 144, { a: 0.9, swing: lerp(-0.4, 1.4, eOut(slam)) });
        hero(S, Kj.look, 130, 262); hero(S, Ri.look, 230, 262);
        reticle(g, 60, 90, 14, '#ff6ab0', scan * (1 - sew)); reticle(g, 160, 80, 14, '#ff6ab0', scan * (1 - sew));
        if (sew > 0) lighter(g, () => { g.strokeStyle = rgba('#fff4f8', 0.9); g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i <= 10; i++) { const x = lerp(60, 160, i / 10), y = lerp(90, 80, i / 10) + (i % 2 ? -6 : 6); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); });
        if (slam > 0) { zig(g, 110, 0, 110, 90, 9, '#ffd040', 3, 1 - seg(t, 1.4, 1.8)); flash(g, '#fff4c0', 0.5 * (1 - seg(t, 1.2, 1.45))); }
      }
    },
    f_fools: foolsShow(),
    f_fools_p: foolsShow()
  };

  function foolsShow() {
    return {
      lines: [[0, 'Ты тоже Шут?'], [1, 'Я есть ты. Ты есть я.']], swap: 0.8, d: 1.8, sfx: [[0.1, 'glint'], [0.6, 'ticket'], [1.0, 'ult'], [1.2, 'crit'], [1.3, 'break']],
      act(S, P2) {
        const g = S.g, t = S.t, T = S.T, [Tr, Yu] = P2.m, card = seg(t, 0.2, 0.9), go = seg(t, 1.0, 1.5);
        vgrad(g, 0, LH, [[0, '#04051a'], [1, '#1a2a6a']]);
        for (let i = 0; i < 2; i++) { const x = lerp(i ? 280 : 40, i ? 190 : 130, eOut(card)), y = 70; g.save(); g.translate(x, y); g.rotate(T * 2 * (i ? -1 : 1)); rect(g, '#efe2b0', -12, -18, 24, 36); rect(g, '#1a2a8a', -10, -16, 20, 32); g.font = 'bold 10px Georgia, serif'; g.fillStyle = '#f2e4b0'; g.textAlign = 'center'; g.fillText('0', 0, 4); g.textAlign = 'left'; g.restore(); }
        P.draw(g, 'izanagi', 220, FLOOR + 10, 144, { a: 0.85, swing: lerp(-0.4, 0.8, go) });
        hero(S, Tr.look, 90, 262); hero(S, Yu.look, 180, 262);
        if (go > 0) { zig(g, 160, 0, 160, 140, 11, '#c08aff', 3, 1 - seg(t, 1.5, 1.8)); lighter(g, () => ring(g, rgba('#ffd850', 1 - go), 3, 160, 70, 10 + go * 120)); }
      }
    };
  }

  const E = H.Eidolons;
  function town(g, warm) {
    vgrad(g, 0, LH, warm ? [[0, '#2a1820'], [1, '#5a3020']] : [[0, '#04061a'], [1, '#141c3a']]);
    for (let i = 0; i < 9; i++) { const x = i * 38 - 6, h = 40 + hx(i, 3, 61) * 50; rect(g, warm ? '#1a0e10' : '#080a1c', x, 160 - h, 34, h + 80); poly(g, warm ? '#1a0e10' : '#080a1c', [x - 4, 160 - h, x + 17, 146 - h, x + 38, 160 - h]); if (hx(i, 4, 61) > 0.4) rect(g, '#f4d880', x + 12, 170 - h, 6, 6); }
    rect(g, warm ? '#2a1a14' : '#1a1a24', 0, 200, LW, 40);
  }
  function personaBack(g, id, x, a, t) { P.draw(g, id, x, 214, 150, { a, t: t || 0 }); }

  const EID = {
    yu: {
      title: 'Туман над Инабой', aura: 'elec',
      frags: [
        ['Переезд', 'Год у дяди Доджимы в тихом городке.'],
        ['Полуночный канал', 'В дождливую полночь экран показал чужое лицо.'],
        ['Дикая карта', 'Одна душа и много масок. Каждая настоящая.'],
        ['Команда расследования', 'Друзья, которых он нашёл в тумане.'],
        ['Нанако', '«Братик, ты ведь вернёшься?»'],
        ['Изанаги-но-Оками', 'Свет, который разгоняет любой туман.']
      ],
      paint(g, X, live) {
        town(g, false);
        rect(g, '#2a2a30', 200, 150, 46, 38); rect(g, '#d8c070', 204, 154, 38, 26);
        if (!live) personaBack(g, 'izanagi', 92, 0.55);
        rect(g, 'rgba(216,192,112,0.18)', 0, 120, LW, 120);
      },
      decor(g, t) { for (let i = 0; i < 40; i++) { const x = (hx(i, 1, 63) * 340 + t * 10) % 340 - 10, y = (hx(1, i, 63) * 260 + t * 140 + i * 7) % 260 - 10; line(g, rgba('#9ab4e0', 0.5), 1, x, y, x - 2, y + 7); } lighter(g, () => rect(g, rgba('#fff0a0', 0.08 + 0.04 * Math.sin(t * 9)), 204, 154, 38, 26)); },
      life(g, t) { lighter(g, () => glow(g, 92, 120, 70, '#ffd850', 0.3 + 0.1 * Math.sin(t * 2))); personaBack(g, 'okami', 92, 0.9, t); }
    },
    yosuke: {
      title: 'Джунс на закате', aura: 'wind',
      frags: [
        ['Новенький из города', 'Сын управляющего «Джунс» и главный скучающий Инабы.'],
        ['Сенпай', 'Он так и не сказал Саки, что чувствовал.'],
        ['Мусорный бак', 'Велосипед, поворот, бак. Классика.'],
        ['Напарник', 'Он искал не приключения. Он искал того, кто будет рядом.'],
        ['Наушники', 'Музыка громче, чтобы не слышать тишину городка.'],
        ['Сусаноо', 'Ветер, который больше не бежит от скуки.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#f0a060'], [0.6, '#c86a50'], [1, '#4a2a30']]);
        rect(g, '#d8d4cc', 10, 70, 140, 130); rect(g, '#c8242e', 10, 70, 140, 26);
        g.save(); g.font = 'bold 16px Georgia, serif'; g.fillStyle = '#ffffff'; g.textAlign = 'center'; g.fillText('ДЖУНС', 80, 89); g.textAlign = 'left'; g.restore();
        rect(g, '#3a2a30', 0, 200, LW, 40);
        if (!live) personaBack(g, 'jiraiya', 92, 0.55);
      },
      decor(g, t) { for (let i = 0; i < 14; i++) { const ph = (t * 0.3 + hx(i, 1, 65)) % 1; poly(g, rgba(i % 2 ? '#7a9a4a' : '#c8e8a0', 0.8), [ph * 340 - 10, 40 + hx(i, 2, 65) * 140, ph * 340 - 4, 38 + hx(i, 2, 65) * 140, ph * 340 - 6, 43 + hx(i, 2, 65) * 140]); } },
      life(g, t) { swirl(g, t, 92, 150, 20, 70, '#8affc8', 0.5, 4); personaBack(g, 'susanoo', 92, 0.9, t); }
    },
    chie: {
      title: 'Говядина в дождь', aura: 'ice',
      frags: [
        ['Кунг-фу', 'Фильмы о мастерах боя в ночь на субботу.'],
        ['Говядина «Айи»', 'Мегачаша в дождь. До последнего кусочка.'],
        ['Защитница', 'Она защищает Юкико. Или себя?'],
        ['Зависть', 'Красота подруги колола глаза.'],
        ['Обещание', 'Стать сильной по-настоящему и защищать город.'],
        ['Судзука Гонгэн', 'Сила, которой не нужно чужое слабое место.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#f0b070'], [1, '#f8dca0']]);
        rect(g, '#7a9a5a', 0, 130, LW, 30); vgrad(g, 150, 190, [[0, '#6a8aa8'], [1, '#4a6a88']]); rect(g, '#8a7a5a', 0, 190, LW, 50);
        rect(g, '#6a4a2a', 40, 140, 12, 60); rect(g, '#8a6a3a', 32, 148, 28, 8);
        if (!live) personaBack(g, 'tomoe', 92, 0.55);
      },
      decor(g, t) { lighter(g, () => glow(g, 250, 60, 40, '#fff0c0', 0.5 + 0.1 * Math.sin(t))); for (let i = 0; i < 16; i++) { const ph = (t * 0.3 + hx(i, 1, 67)) % 1; rect(g, rgba('#ffffff', Math.sin(Math.PI * ph) * 0.8), Math.round(hx(i, 2, 67) * LW), Math.round(LH - ph * LH), 1, 1); } },
      life(g, t) { spikes(g, 40, 150, 214, 34, 1, 5); personaBack(g, 'suzuka', 92, 0.9, t); }
    },
    yukiko: {
      title: 'Гостиница «Амаги»', aura: 'fire',
      frags: [
        ['Наследница', 'Гостиница ждала её с самого детства.'],
        ['Красный кардиган', 'Как птица в золотой клетке.'],
        ['Приступ смеха', 'Над глупой шуткой Чие она смеётся до слёз.'],
        ['Принц на коне', 'Она ждала, что кто-то её увезёт.'],
        ['Своя дорога', 'Она осталась, но уже по своей воле.'],
        ['Аматэрасу', 'Солнце, которое светит само.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#1a1428'], [1, '#3a2a30']]);
        poly(g, '#2a1a14', [0, 70, 120, 26, 240, 70]); rect(g, '#5a3a24', 10, 70, 220, 130);
        for (let i = 0; i < 5; i++) rect(g, '#f2e4c0', 20 + i * 42, 90, 34, 60);
        rect(g, '#6a6a70', 0, 200, LW, 40);
        if (!live) personaBack(g, 'sakuya', 92, 0.55);
      },
      decor(g, t) { for (const x of [40, 200]) { lighter(g, () => glow(g, x, 110, 22, '#ffb060', 0.5 + 0.15 * Math.sin(t * 5 + x))); ell(g, '#e85a2a', x, 110, 8, 11); } petals(g, t, 14, 69, '#ff9ac0', 0.8); },
      life(g, t) { fireWall(g, t, 30, 160, 214, 36, 0.6); personaBack(g, 'amaterasu', 92, 0.9, t); }
    },
    kanji: {
      title: 'Ткани Тацуми', aura: 'phys',
      frags: [
        ['Гроза района', 'Байкеры бегут от одного его имени.'],
        ['Мама', 'Он бережёт лавку и мамин покой.'],
        ['Вязаный зайчик', 'Стежки ровные, как у мастера.'],
        ['Страх', 'Что скажут, если узнают, что он шьёт?'],
        ['Принятие', 'Он такой, какой есть. Этого достаточно.'],
        ['Рокутэн Мао', 'Гнев, который больше не прячет доброту.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#1a1018'], [1, '#3a2418']]);
        for (let i = 0; i < 4; i++) { const x = i * 46; rect(g, '#2a1a14', x, 20, 42, 120); for (let j = 0; j < 4; j++) rect(g, ['#c8243a', '#3a6ac8', '#e8d070', '#f2ece0'][(i + j) % 4], x + 3, 26 + j * 28, 36, 22); }
        rect(g, '#5a3a26', 0, 200, LW, 40);
        bunny(g, 60, 196, 1.6);
        if (!live) personaBack(g, 'mikazuchi', 92, 0.55);
      },
      decor(g, t) { lighter(g, () => glow(g, 120, 60, 50, '#ffd890', 0.35 + 0.05 * Math.sin(t * 2))); for (let i = 0; i < 8; i++) { const ph = (t * 0.4 + hx(i, 1, 71)) % 1; rect(g, rgba('#ffe8f0', Math.sin(Math.PI * ph)), Math.round(20 + hx(i, 2, 71) * 160), Math.round(200 - ph * 150), 1, 1); } },
      life(g, t) { if (Math.floor(t * 3) % 2) zig(g, 110, 0, 92, 110, 13, '#ffd040', 2, 0.6); personaBack(g, 'rokuten', 92, 0.9, t); }
    },
    rise: {
      title: 'Рисетт на паузе', aura: 'imag',
      frags: [
        ['Рисетт', 'Улыбка, которую знает вся страна.'],
        ['Тофу «Марукю»', 'Бабушкина лавка, где можно просто дышать.'],
        ['Очки', 'Маскировка, которая никого не обманывает.'],
        ['Настоящая я', 'Под маской тоже есть лицо.'],
        ['Навигатор', 'Её голос ведёт команду сквозь туман.'],
        ['Кандзэон', 'Видеть всё и всё равно улыбаться.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#0a0418'], [1, '#2a0a2a']]);
        for (const [x, a] of [[40, 0.3], [140, -0.1]]) poly(g, 'rgba(255,154,216,0.14)', [x - 8, 0, x + 8, 0, x + 50 + a * 60, 200, x - 50 + a * 60, 200]);
        rect(g, '#1a0a1e', 0, 200, LW, 40); rect(g, '#ff6ab0', 0, 200, LW, 2);
        if (!live) personaBack(g, 'himiko', 92, 0.55);
      },
      decor(g, t) { for (let i = 0; i < 20; i++) { const x = 6 + i * 16, y = 226 + Math.sin(t * 5 + i) * 3; line(g, i % 3 ? '#ff8ac8' : '#7ae0ff', 2, x, y, x + Math.sin(t * 5 + i) * 3, y - 8); } },
      life(g, t) { lighter(g, () => { for (let i = 0; i < 3; i++) { const q = (t * 0.6 + i / 3) % 1; ring(g, rgba('#ffd850', (1 - q) * 0.5), 1, 92, 90, 10 + q * 80); } }); personaBack(g, 'kanzeon', 92, 0.9, t); }
    }
  };

  Object.assign(H.Ults.SHOWS, ULTS);
  Object.assign(H.Fusions.SHOWS, FUS);
  Object.assign(E.SCENES, EID);
  H.InabaScenes = { ULTS, FUS, EID };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
