(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit, E = H.Eidolons, WI = H.WarpIntro, intro5 = H.FivesScenes.intro5;
  const { LW, LH, BAR, cl, lerp, eOut, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash } = K;
  const FLOOR = LH - BAR;
  const hero = (S, look, x, y, o) => S.fig(look, x, y, Object.assign({ k: 2 }, o));

  const buffers = {};
  function paintBuffer(c, key, bx, by, bw, bh, fn) {
    const buf = buffers[key] || (buffers[key] = G.mkCanvas(LW, LH));
    fn(buf.getContext('2d'));
    const was = c.imageSmoothingEnabled;
    c.imageSmoothingEnabled = false;
    c.drawImage(buf, bx, by, bw, bh);
    c.imageSmoothingEnabled = was;
  }

  function fallingStars(g, T, n, seed, a) {
    for (let i = 0; i < n; i++) {
      const ph = (T * (0.12 + hx(i, 1, seed) * 0.16) + hx(i, 2, seed)) % 1, x = hx(i, 3, seed) * LW + 40 - ph * 90, y = ph * 150 - 10, k = (1 - ph) * a;
      line(g, rgba('#e8dcff', k * 0.6), 1, x, y, x + 12, y - 12);
      rect(g, rgba('#ffffff', k), Math.round(x) - 1, Math.round(y) - 1, 2, 2);
    }
  }

  function towerNight(g, T, horizon) {
    vgrad(g, 0, horizon, [[0, '#07061c'], [0.6, '#1c1444'], [1, '#43296e']]);
    K.stars(g, T, 46, 141, 0.8, horizon * 0.9);
    lighter(g, () => { glow(g, 70, 60, 90, '#7a4ad8', 0.22); glow(g, 250, 40, 70, '#4a6ae8', 0.16); });
    rect(g, '#120e2a', 254, horizon - 118, 30, 118);
    poly(g, '#120e2a', [248, horizon - 118, 290, horizon - 118, 269, horizon - 150]);
    ell(g, '#2a2252', 269, horizon - 92, 10, 10);
    ring(g, '#b8a4ec', 1, 269, horizon - 92, 10);
    line(g, '#e8dcff', 1, 269, horizon - 92, 269 + Math.cos(T * 0.4) * 7, horizon - 92 + Math.sin(T * 0.4) * 7);
    line(g, '#e8dcff', 1, 269, horizon - 92, 269 + Math.cos(T * 0.07) * 4, horizon - 92 + Math.sin(T * 0.07) * 4);
    fallingStars(g, T, 7, 143, 0.9);
    vgrad(g, horizon, LH, [[0, '#2a2050'], [1, '#100c24']]);
    rect(g, '#6a58a8', 0, horizon, LW, 1);
  }

  function runeRing(g, x, y, r, rot, col, a) {
    if (a <= 0 || r <= 1) return;
    ring(g, rgba(col, a), 1.4, x, y, r);
    ring(g, rgba(col, a * 0.5), 1, x, y, r * 0.82);
    for (let i = 0; i < 12; i++) {
      const an = rot + i / 12 * Math.PI * 2, x0 = x + Math.cos(an) * r * 0.84, y0 = y + Math.sin(an) * r * 0.84, x1 = x + Math.cos(an) * r * 0.98, y1 = y + Math.sin(an) * r * 0.98;
      line(g, rgba(col, a), i % 3 ? 1 : 2, x0, y0, x1, y1);
    }
  }

  function iceSpear(g, x, y, s, a) {
    if (a <= 0) return;
    poly(g, rgba('#7ab8e8', a), [x, y - 30 * s, x + 5 * s, y - 6 * s, x, y + 6 * s, x - 5 * s, y - 6 * s]);
    poly(g, rgba('#e0f4ff', a), [x, y - 24 * s, x + 2 * s, y - 6 * s, x, y + 2 * s, x - 2 * s, y - 6 * s]);
  }

  function dollRow(g, S, y, turn) {
    const look = G.lookOf('herta', null);
    for (let i = 0; i < 5; i++) hero(S, look, 40 + i * 42, y, { k: 1, flip: i % 2 === 0 ? turn < 0.5 : turn >= 0.5 });
  }

  function mirror(g, x, y, r, T, broken) {
    ell(g, '#8a7ac8', x, y, r + 3, r * 1.3 + 3);
    ell(g, '#10183c', x, y, r, r * 1.3);
    lighter(g, () => glow(g, x, y, r * 1.2, '#9ac8ff', 0.2 + 0.05 * Math.sin(T * 2)));
    if (!broken) return;
    for (let i = 0; i < 6; i++) line(g, 'rgba(220,240,255,0.7)', 1, x, y, x + Math.cos(i * 1.05 + 0.3) * r, y + Math.sin(i * 1.05 + 0.3) * r * 1.3);
  }

  function goldSky(g, T, horizon) {
    vgrad(g, 0, horizon, [[0, '#4a2412'], [0.5, '#b4682a'], [1, '#f2c47a']]);
    lighter(g, () => { glow(g, 240, 50, 80, '#ffe8b0', 0.45); glow(g, 60, 90, 60, '#ffb070', 0.2); });
    for (let i = 0; i < 6; i++) {
      const x = ((hx(i, 1, 161) * 360 + T * (4 + i)) % 380) - 30, y = 30 + hx(i, 2, 161) * (horizon - 80), w = 24 + hx(i, 3, 161) * 26;
      ell(g, 'rgba(255,236,200,0.5)', x, y, w, w * 0.28);
      ell(g, 'rgba(255,246,224,0.55)', x + w * 0.3, y - 3, w * 0.5, w * 0.2);
    }
    vgrad(g, horizon, LH, [[0, '#d8a860'], [1, '#6a3c1c']]);
    rect(g, '#fff0c8', 0, horizon, LW, 1);
  }

  function seeds(g, T, n, seed, a) {
    for (let i = 0; i < n; i++) {
      const ph = (T * (0.06 + hx(i, 1, seed) * 0.08) + hx(i, 2, seed)) % 1, x = ((hx(i, 3, seed) * LW + ph * 120) % (LW + 20)) - 10, y = LH - 40 - ph * 170 + Math.sin(T + i) * 5, k = a * Math.sin(ph * Math.PI);
      line(g, rgba('#fff8e4', k * 0.7), 1, x, y, x - 1, y + 4);
      for (let j = 0; j < 5; j++) { const an = j / 5 * Math.PI - Math.PI; rect(g, rgba('#ffffff', k), Math.round(x + Math.cos(an) * 2), Math.round(y + Math.sin(an) * 2), 1, 1); }
    }
  }

  function petalFlower(g, x, y, r, a) {
    if (a <= 0) return;
    for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2 - 0.3; ell(g, rgba('#fffaf0', a), x + Math.cos(an) * r * 0.68, y + Math.sin(an) * r * 0.68, r * 0.54, r * 0.54); }
    ell(g, rgba('#5a7ae8', a), x, y, r * 0.3, r * 0.3);
  }

  function toyHouse(g, x, y, s, open) {
    rect(g, '#f4e0b8', x - 26 * s, y - 40 * s, 52 * s, 40 * s);
    poly(g, '#c8402e', [x - 32 * s, y - 40 * s, x, y - 66 * s, x + 32 * s, y - 40 * s]);
    rect(g, '#8ac0e8', x + 8 * s, y - 32 * s, 12 * s, 12 * s);
    rect(g, '#fff8e0', x + 13 * s, y - 32 * s, 2 * s, 12 * s);
    rect(g, '#2a1408', x - 16 * s, y - 28 * s, 16 * s, 28 * s);
    if (open > 0) lighter(g, () => glow(g, x - 8 * s, y - 14 * s, (18 + open * 120) * s, '#ffe08a', 0.75 * open));
    poly(g, '#7a4a24', [x - 16 * s, y - 28 * s, x - 16 * s + 16 * s * (1 - open * 0.8), y - 28 * s, x - 16 * s + 16 * s * (1 - open * 0.8), y, x - 16 * s, y]);
  }

  function letter(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot);
    rect(g, '#fff4d8', -9 * s, -6 * s, 18 * s, 12 * s);
    poly(g, '#e8cc90', [-9 * s, -6 * s, 0, 2 * s, 9 * s, -6 * s]);
    ell(g, '#c8302a', 0, 1 * s, 2 * s, 2 * s);
    g.restore();
  }

  const ULTS = {
    theherta: {
      line: 'Любопытство, знаете ли, опасная штука.', side: 'l', d: 1.6, sfx: [[0.1, 'tech'], [0.35, 'ult'], [0.85, 'whoosh'], [1.05, 'crit'], [1.2, 'crit'], [1.35, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, rise = eOut(seg(t, 0, 0.7)), fall = seg(t, 0.85, 1.45);
        towerNight(g, T, 180);
        lighter(g, () => glow(g, 210, 104, 40 + rise * 70, '#9a7aff', 0.32 * rise));
        runeRing(g, 210, 104, 26 + rise * 62, T * 0.8, '#c8a8ff', rise * 0.9);
        runeRing(g, 210, 104, 14 + rise * 34, -T * 1.2, '#e8dcff', rise * 0.75);
        hero(S, P.look, 96, 262);
        for (let i = 0; i < 8; i++) {
          const k = seg(fall, i * 0.07, i * 0.07 + 0.42);
          if (k > 0) iceSpear(g, 150 + hx(i, 1, 151) * 150, lerp(-34, 164 + hx(i, 2, 151) * 24, k), 1 + hx(i, 3, 151) * 0.5, cl(1.3 - k));
        }
        if (fall > 0 && fall < 0.14) flash(g, '#e8f0ff', 0.55 * (1 - fall / 0.14));
      }
    },
    tribbie: {
      line: 'Вперёд, оседлав западный ветер~', side: 'r', d: 1.6, sfx: [[0.1, 'glint'], [0.35, 'whoosh'], [0.7, 'ult'], [1.05, 'sparkle'], [1.25, 'crit'], [1.4, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, open = eOut(seg(t, 0.6, 1.1)), wash = seg(t, 0.95, 1.5);
        goldSky(g, T, 180);
        toyHouse(g, 212, 200, 1.5, open);
        hero(S, P.look, 96, 262);
        hero(S, P.look, 40, 250, { k: 1, tint: '#7a3a18', ta: 0.75, a: cl(seg(t, 0, 0.3) * 0.9) });
        hero(S, P.look, 152, 250, { k: 1, tint: '#7a3a18', ta: 0.75, a: cl(seg(t, 0.15, 0.45) * 0.9), flip: true });
        for (let i = 0; i < 10; i++) petalFlower(g, 120 + hx(i, 1, 171) * 190, lerp(200, 40 + hx(i, 2, 171) * 110, seg(wash, i * 0.04, i * 0.04 + 0.6)), 4 + hx(i, 3, 171) * 3, wash * cl(1.5 - wash));
        seeds(g, T, 14, 173, 0.9);
        if (wash > 0 && wash < 0.16) flash(g, '#fff2c8', 0.5 * (1 - wash / 0.16));
      }
    }
  };

  const WARP = {
    theherta: intro5({
      line: 'Человек, женщина, молода, красива, очаровательна.', col: '#b48cff', trail: '#e8dcff', from: [300, 24], to: [150, 150],
      sfx: [[0.2, 'select'], [0.85, 'glint'], [1.55, 'whoosh'], [2.2, 'tech'], [2.8, 'star5']],
      scene(g, T, ph, S) {
        towerNight(g, T, ph === 2 ? 190 : 170);
        if (ph === 0) dollRow(g, S, 176, cl(T * 0.5 % 1));
        if (ph === 2) { mirror(g, 70, 118, 26, T, true); runeRing(g, 160, 150, 92, T * 0.3, '#b48cff', 0.35); }
      },
      after(g, T) { fallingStars(g, T, 5, 147, 0.8); }
    }),
    tribbie: intro5({
      line: 'Мы Трибби, посланник, что передаёт предсказания~', col: '#ffd890', trail: '#fff4d8', from: [20, 20], to: [160, 150],
      sfx: [[0.2, 'select'], [0.85, 'sparkle'], [1.55, 'whoosh'], [2.2, 'glint'], [2.8, 'star5']],
      scene(g, T, ph, S, P) {
        goldSky(g, T, ph === 2 ? 192 : 172);
        seeds(g, T, ph === 2 ? 16 : 10, 175, 0.9);
        if (ph === 0) {
          for (let i = 0; i < 3; i++) hero(S, P.look, 110 + i * 50, 176, { k: 1, tint: '#6a3414', ta: 0.8, flip: i === 2 });
          letter(g, ((T * 40) % 360) - 20, 60 + Math.sin(T * 2) * 8, 1, Math.sin(T * 3) * 0.3);
        }
        if (ph === 2) for (let i = 0; i < 12; i++) petalFlower(g, 8 + i * 28 + (i % 2) * 6, 196 + (i % 3) * 8, 4, 0.9);
      },
      after(g, T) { letter(g, 262, 92 + Math.sin(T * 1.6) * 5, 1.1, 0.2); }
    })
  };

  const EID = {
    theherta: {
      title: 'Башня на краю космоса', aura: 'ice',
      frags: [
        ['Ночь, когда упали звёзды', 'Часовая башня на краю космоса. Там она разгадывает вселенную, будто колдует.'],
        ['Ветер в замочной скважине', 'Калейдоскоп детских лет. На этикетке три раза написано: НЕ СМОТРЕТЬ.'],
        ['Дверь в лето', 'Симпозиум почтил её минутой молчания. Потом она сама вышла к трибуне.'],
        ['Шестнадцатый ключ', 'Трое моют полы, двое поливают цветы. Шестая кукла варит кофе.'],
        ['Горькое лекарство правды', 'Она зажала нос и вознесла хвалу Эонам. Попытка провалена.'],
        ['Сладкая приманка ответа', 'Вселенная задаёт Эонам вопросы. Пусть теперь они спрашивают её.']
      ],
      paint(g, X, live) {
        towerNight(g, 0, 176);
        rect(g, '#3a2c64', 30, 176, 140, 4);
        mirror(g, 62, 122, 24, 0, false);
        for (let i = 0; i < 6; i++) { rect(g, '#2a2050', 100 + i * 12, 158, 7, 18); ell(g, '#c8bce4', 103.5 + i * 12, 154, 4, 4); }
        if (!live) runeRing(g, 200, 96, 44, 0, '#c8a8ff', 0.6);
      },
      decor(g, t) { lighter(g, () => glow(g, 62, 122, 34, '#9ac8ff', 0.16 + 0.06 * Math.sin(t * 2))); fallingStars(g, t, 5, 149, 0.7); },
      life(g, t) { runeRing(g, 200, 96, 44 + Math.sin(t) * 3, t * 0.6, '#c8a8ff', 0.75); runeRing(g, 200, 96, 26, -t * 0.9, '#e8dcff', 0.6); }
    },
    tribbie: {
      title: 'Письмо на западном ветру', aura: 'quant',
      frags: [
        ['Зачерпывание сахара', 'Посланник разделился на тысячу тел и отправился в дальний путь.'],
        ['Проводник по сновидениям', 'Сны становятся всё туманнее. Дороги и чёрное небо, но кто-то бежит рядом.'],
        ['Сокровище утреннего сияния', 'Дева Янусополиса. За десять лет мы обошли почти весь Амфореус.'],
        ['Спокойствие связи', 'Правители хотели скрыть наши лица за церемониями. Мы остались с больными.'],
        ['Час начала чудес', 'Маленькая Аги боялась темноты и тащила нас на кухню за вчерашним хлебом.'],
        ['Путь к светлому будущему', 'Прорвись сквозь тьму этого мира к светлому будущему.']
      ],
      paint(g, X, live) {
        goldSky(g, 2, 176);
        toyHouse(g, 232, 176, 1.1, 0);
        for (let i = 0; i < 14; i++) petalFlower(g, 8 + i * 23, 188 + (i % 3) * 12, 4.4, 1);
        if (!live) letter(g, 92, 84, 1.3, -0.2);
      },
      decor(g, t) { seeds(g, t, 12, 177, 0.85); lighter(g, () => glow(g, 240, 50, 64, '#fff0c0', 0.2 + 0.06 * Math.sin(t * 1.4))); },
      life(g, t) { letter(g, 92 + Math.sin(t * 0.7) * 26, 84 + Math.sin(t * 1.3) * 10, 1.3, Math.sin(t) * 0.25); lighter(g, () => glow(g, 216, 160, 30, '#ffe08a', 0.3 + 0.1 * Math.sin(t * 2))); }
    }
  };

  const BACKDROPS = {
    theherta(c, bx, by, bw, bh, t) {
      paintBuffer(c, 'theherta', bx, by, bw, bh, g => {
        towerNight(g, t, 196);
        runeRing(g, 226, 92, 74, t * 0.25, '#b48cff', 0.42);
      });
    },
    tribbie(c, bx, by, bw, bh, t) {
      paintBuffer(c, 'tribbie', bx, by, bw, bh, g => {
        goldSky(g, t, 200);
        for (let i = 0; i < 14; i++) petalFlower(g, 8 + i * 23, 212 + (i % 3) * 9, 4.4, 1);
        seeds(g, t, 16, 179, 0.9);
      });
    }
  };

  for (const [id, sh] of Object.entries(ULTS)) H.labPut(H.Ults.SHOWS, id, sh);
  for (const [id, sh] of Object.entries(WARP)) H.labPut(WI.SHOWS, id, sh);
  for (const [id, sc] of Object.entries(EID)) H.labPut(E.SCENES, id, sc);
  H.LabScenes = { ULTS, WARP, EID, BACKDROPS };
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
