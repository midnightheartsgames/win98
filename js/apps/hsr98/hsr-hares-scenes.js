(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit, E = H.Eidolons;
  const { LW, LH, BAR, lerp, eOut, eIn, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, flash } = K;
  const FLOOR = LH - BAR;
  const hero = (S, look, x, y, o) => S.fig(look, x, y, Object.assign({ k: 2 }, o));
  const RED = '#c8282e', VIOLET = '#c88aff', VOLT = '#d8f040', GOLD = '#ffd040';
  const lookOf = id => H.CHARS[id].look;

  function star(g, x, y, r, col) {
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    poly(g, col, pts);
  }

  function bolt(g, x0, y0, x1, y1, seed, a) {
    let px = x0, py = y0;
    lighter(g, () => {
      for (let i = 1; i <= 7; i++) {
        const k = i / 7, nx = i === 7 ? x1 : lerp(x0, x1, k) + (hx(i, seed, 7) - 0.5) * 24, ny = lerp(y0, y1, k);
        line(g, rgba(VOLT, 0.5 * a), 6, px, py, nx, ny); line(g, rgba('#ffffff', a), 2, px, py, nx, ny);
        px = nx; py = ny;
      }
    });
  }

  function fieldDome(g, x, y, r, a, T) {
    if (a <= 0 || r <= 0) return;
    const gr = g.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, rgba('#1a0828', 0.9 * a)); gr.addColorStop(0.6, rgba('#6a2aa8', 0.5 * a)); gr.addColorStop(1, rgba(VIOLET, 0));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * 0.6, 0, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 14; i++) { const k = (T * 0.8 + hx(i, 1, 23)) % 1, an = hx(i, 2, 23) * Math.PI * 2; ell(g, rgba(i % 3 ? '#e8c8ff' : '#ff7ac8', a * (1 - k)), x + Math.cos(an) * r * (1 - k), y + Math.sin(an) * r * 0.6 * (1 - k), 1.6, 1.6); }
  }

  function coin(g, x, y, r, spin) {
    ell(g, '#8a6a20', x, y, r * Math.max(0.2, Math.abs(Math.cos(spin))), r);
    ell(g, '#ffd060', x, y, r * 0.8 * Math.max(0.2, Math.abs(Math.cos(spin))), r * 0.8);
  }

  function caseGun(g, x, y, s, open) {
    g.save(); g.translate(x, y); g.scale(s, s);
    rect(g, '#2e2e34', -16, -10, 32, 20); rect(g, '#3e3e46', -16, -10, 32, 4);
    ell(g, '#c8a050', 0, 1, 6, 6); ell(g, '#2e2e34', 0, 1, 4, 4);
    if (open > 0) { rect(g, '#26262c', 16, -5, 22 * open, 9); rect(g, '#e8602a', 14 + 22 * open, -5, 3, 9); }
    g.restore();
  }

  function stage(g, T, tint) {
    vgrad(g, 0, LH, [[0, '#06061a'], [0.6, '#141632'], [1, '#0c0c1e']]);
    for (let i = 0; i < 9; i++) rect(g, '#20223a', 12 + i * 36, 0, 3, 14);
    if (tint) lighter(g, () => poly(g, rgba(tint, 0.16), [LW / 2 - 14, 0, LW / 2 + 14, 0, LW / 2 + 100, FLOOR, LW / 2 - 100, FLOOR]));
    rect(g, '#16182c', 0, FLOOR - 6, LW, 6);
  }

  const ULTS = {
    billy: {
      line: 'Сияй, звёздный свет!', side: 'l', d: 1.6, sfx: [[0.05, 'ult'], [0.45, 'swing'], [0.7, 'crit'], [0.85, 'crit'], [1.0, 'crit'], [1.35, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, spin = seg(t, 0.4, 1.3), burst = seg(t, 1.2, 1.6);
        stage(g, T, GOLD);
        lighter(g, () => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + T * 0.5; poly(g, rgba('#ffe090', 0.08), [160, 110, 160 + Math.cos(a) * 320, 110 + Math.sin(a) * 320, 160 + Math.cos(a + 0.12) * 320, 110 + Math.sin(a + 0.12) * 320]); } });
        hero(S, lookOf('billy'), 160, FLOOR + 22, { flip: Math.floor(spin * 6) % 2 === 1 });
        if (spin > 0 && spin < 1) for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2 + spin * 6, r = 30 + ((spin * 4 + i * 0.13) % 1) * 160;
          star(g, 160 + Math.cos(a) * r, 110 + Math.sin(a) * r * 0.6, 4, rgba(GOLD, 1 - r / 200));
          lighter(g, () => glow(g, 160 + Math.cos(a) * 26, 110 + Math.sin(a) * 16, 8, '#fff4c0', 0.6));
        }
        if (burst > 0) lighter(g, () => { glow(g, 160, 110, 120 * burst, GOLD, 0.6 * (1 - burst)); for (let i = 0; i < 16; i++) star(g, 160 + Math.cos(i * 0.4) * 140 * eOut(burst), 110 + Math.sin(i * 0.4) * 90 * eOut(burst), 5, rgba('#fff4a0', 1 - burst)); });
        if (t < 0.25) flash(g, '#ffe8a0', 0.5 * (1 - t / 0.25));
      }
    },
    nicole: {
      line: 'Ха~ Пока-пока! Бум!', side: 'r', d: 1.6, sfx: [[0.05, 'lever'], [0.4, 'tech'], [0.75, 'debuff'], [1.2, 'break'], [1.3, 'chest']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, open = eOut(seg(t, 0.1, 0.35)), fly = seg(t, 0.4, 0.75), pull = seg(t, 0.75, 1.2), boom = seg(t, 1.2, 1.6);
        stage(g, T, VIOLET);
        hero(S, lookOf('nicole'), 80, FLOOR + 22);
        caseGun(g, 112, 130, 1.4, open);
        const gx = lerp(150, 240, fly), gy = 124 - Math.sin(fly * Math.PI) * 50;
        if (fly > 0 && fly < 1) { ell(g, '#3a3a44', gx, gy, 6, 6); ell(g, VIOLET, gx, gy, 3, 3); }
        fieldDome(g, 240, FLOOR - 30, 90 * eOut(pull), pull > 0 ? 1 - boom * 0.6 : 0, T);
        for (let i = 0; i < 6; i++) { const k = eIn(pull), a = hx(i, 3, 29) * Math.PI * 2; if (pull > 0 && boom < 1) rect(g, '#5a5a66', Math.round(240 + Math.cos(a) * 120 * (1 - k)), Math.round(FLOOR - 30 + Math.sin(a) * 60 * (1 - k)), 6, 4); }
        if (boom > 0) lighter(g, () => { glow(g, 240, FLOOR - 30, 110 * boom, VIOLET, 0.8 * (1 - boom)); for (let i = 0; i < 10; i++) coin(g, 240 + Math.cos(i * 0.63) * 120 * eOut(boom), FLOOR - 30 + Math.sin(i * 0.63) * 70 * eOut(boom), 4, T * 8 + i); });
        if (boom > 0 && boom < 0.2) flash(g, '#e8c8ff', 0.5 * (1 - boom / 0.2));
      }
    },
    anby: {
      line: 'Устраняю цель.', side: 'l', d: 1.5, sfx: [[0.05, 'tech'], [0.35, 'buff'], [0.8, 'whoosh'], [0.95, 'crit'], [1.1, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, charge = seg(t, 0.1, 0.75), dash = seg(t, 0.75, 1.0), strike = seg(t, 0.95, 1.5);
        stage(g, T, VOLT);
        const x = lerp(70, 260, eIn(dash));
        if (dash > 0 && dash < 1) lighter(g, () => { for (let i = 0; i < 6; i++) line(g, rgba(VOLT, 0.6 * (1 - dash)), 2, x - 30 - i * 26, 96 + i * 6, x - 4, 100 + i * 4); });
        hero(S, lookOf('anby'), x, FLOOR + 22, { a: dash > 0 && dash < 1 ? 0.6 : 1 });
        if (charge > 0 && dash <= 0) { lighter(g, () => glow(g, 96, 120, 10 + 26 * charge, VOLT, 0.5 + 0.4 * charge)); for (let i = 0; i < 3; i++) bolt(g, 96, 120, 96 + Math.cos(T * 9 + i * 2) * 30, 120 + Math.sin(T * 9 + i * 2) * 30, Math.floor(T * 20) + i, charge); }
        if (strike > 0) { bolt(g, 270, -10, 250, FLOOR - 20, Math.floor(T * 20), 1 - strike); lighter(g, () => glow(g, 250, FLOOR - 30, 80 * strike, VOLT, 0.7 * (1 - strike))); }
        if (strike > 0 && strike < 0.15) flash(g, '#f4ffd0', 0.55 * (1 - strike / 0.15));
      }
    }
  };

  const FUS = {
    f_hares: {
      lines: [[0, 'Работаем, зайцы! Счёт потом!'], [1, 'Цель определена.'], [2, 'Звёздные рыцари, вперёд!']], swaps: [0.8, 1.6], d: 2.6,
      sfx: [[0.1, 'lever'], [0.5, 'debuff'], [0.95, 'tech'], [1.2, 'break'], [1.7, 'crit'], [1.9, 'crit'], [2.1, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Ni, An, Bi] = P.m, pull = seg(t, 0.3, 0.9), zap = seg(t, 0.95, 1.4), fire = seg(t, 1.6, 2.4);
        stage(g, T);
        fieldDome(g, 250, FLOOR - 26, 80 * eOut(pull), pull, T);
        hero(S, Ni.look, 60, FLOOR + 22); hero(S, An.look, 130, FLOOR + 22); hero(S, Bi.look, 200, FLOOR + 22);
        if (zap > 0) bolt(g, 260, -10, 250, FLOOR - 26, Math.floor(T * 20), 1 - zap);
        if (fire > 0) for (let i = 0; i < 6; i++) { const k = (fire * 3 + i * 0.17) % 1; star(g, lerp(214, 250, k), lerp(110, FLOOR - 30, k) + (i - 3) * 4, 4, rgba(GOLD, 1 - k)); }
        if (fire > 0.9) lighter(g, () => glow(g, 250, FLOOR - 26, 60, GOLD, 0.6));
      }
    },
    f_starknight: {
      lines: [[1, 'Включаю главную тему.'], [0, 'Мираж… звёздного света!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'select'], [0.4, 'strum'], [0.7, 'strum'], [1.0, 'ult'], [1.2, 'crit'], [1.45, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Bi, An] = P.m, play = seg(t, 0.2, 0.9), shot = seg(t, 1.0, 1.6);
        stage(g, T, GOLD);
        hero(S, An.look, 90, FLOOR + 22); hero(S, Bi.look, 200, FLOOR + 22, { flip: true });
        rect(g, '#2a2a32', 104, 132, 30, 18); rect(g, '#1a1a20', 108, 136, 22, 8); ell(g, '#c8ccd4', 113, 140, 3, 3); ell(g, '#c8ccd4', 125, 140, 3, 3);
        for (let i = 0; i < 5; i++) { const k = (play * 2 + i * 0.2) % 1; if (play > 0) { const nx = 120 + i * 14 + k * 20, ny = 120 - k * 50; ell(g, rgba(GOLD, 1 - k), nx, ny, 3, 2.4); rect(g, rgba(GOLD, 1 - k), nx + 2, ny - 9, 1, 9); } }
        if (shot > 0) lighter(g, () => { for (let i = 0; i < 10; i++) { const a = -0.6 + i * 0.12, r = 20 + shot * 130; star(g, 200 + Math.cos(Math.PI + a) * -r, 110 + Math.sin(a) * r * 0.5, 5, rgba(GOLD, 1 - shot)); } glow(g, 200, 110, 30, '#fff4c0', 0.7 * (1 - shot)); });
      }
    },
    f_katana: {
      lines: [[0, 'Новичком ты была куда милее.'], [1, 'Я уже не тот новичок.']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'debuff'], [0.5, 'whoosh'], [0.9, 'glint'], [1.15, 'crit'], [1.3, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Ni, Mi] = P.m, toss = seg(t, 0.35, 0.85), cut = seg(t, 1.05, 1.5);
        stage(g, T, '#8adfff');
        fieldDome(g, 160, FLOOR - 26, 110, 0.7, T);
        hero(S, Ni.look, 70, FLOOR + 22); hero(S, Mi.look, 250, FLOOR + 22, { flip: true });
        if (toss > 0 && toss < 1) { const kx = lerp(96, 236, toss), ky = 110 - Math.sin(toss * Math.PI) * 60; g.save(); g.translate(kx, ky); g.rotate(toss * 9); rect(g, '#1e1e26', -16, -1.5, 32, 3); rect(g, '#d8b050', -4, -2.5, 3, 5); g.restore(); }
        if (cut > 0) lighter(g, () => { line(g, rgba('#ffffff', 1 - cut), 4, 0, 60 + 120 * cut, LW, 40 + 120 * cut); line(g, rgba('#8adfff', 1 - cut), 10, 0, 60 + 120 * cut, LW, 40 + 120 * cut); for (let i = 0; i < 12; i++) ell(g, rgba('#e8f8ff', 1 - cut), hx(i, 1, 31) * LW, 40 + hx(i, 2, 31) * 140 + cut * 30, 1.5, 1.5); });
        if (cut > 0 && cut < 0.15) flash(g, '#e8f8ff', 0.5 * (1 - cut / 0.15));
      }
    }
  };

  const EID = {
    billy: {
      title: 'Ночь у ремонтной стойки', aura: 'stars',
      frags: [
        ['Блестящий выход', 'Для злодеев они слишком честные: выстроились, как мишени на стрельбище.'],
        ['Бродячий стрелок', 'Звёздные рыцари не бегут. Это смена позиции для лучшего прицела.'],
        ['Учения Звёздных рыцарей', 'Не бросай тренировки и расти дальше. Билли верит в это всерьёз.'],
        ['Звёздная баллистика', 'Разрывные пули своей работы. Он хотел, чтобы они выглядели пафоснее.'],
        ['Забытая технология', 'Детали, каких больше не делают. И счета за обслуживание им под стать.'],
        ['Звёздный герой', '«Энби, подрубай главную тему!» Первая в её списке запрещённых фраз.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#0c1018'], [1, '#1a1e2a']]);
        for (let y = 24; y < 150; y += 28) rect(g, '#1c2230', 0, y, LW, 2);
        rect(g, '#2a2e3a', 12, 30, 130, 120); for (let i = 0; i < 4; i++) rect(g, '#3a3e4a', 12, 52 + i * 26, 130, 3);
        for (let i = 0; i < 4; i++) { rect(g, '#5a5c66', 22 + i * 30, 36, 6, 14); rect(g, '#8a8c96', 18 + i * 30, 34, 14, 4); }
        rect(g, '#2a2c34', 34, 92, 72, 54); rect(g, '#141824', 38, 96, 64, 42);
        rect(g, '#3a2a24', 0, 176, LW, 64); rect(g, '#4a362e', 0, 176, LW, 5);
        for (const [x, r] of [[196, -0.1], [236, 0.12]]) { g.save(); g.translate(x, 188); g.rotate(r); rect(g, '#2a2c34', -4, -3, 40, 6); rect(g, '#4a4c56', -6, -5, 10, 10); rect(g, '#c8283a', 10, -3, 4, 6); g.restore(); }
        rect(g, '#c8b49a', 284, 160, 22, 28); rect(g, '#7a4a2a', 288, 168, 14, 12);
        if (!live) star(g, 70, 117, 10, '#c8a030');
      },
      decor(g, t) { lighter(g, () => glow(g, 70, 117, 36, '#ffe080', 0.18 + 0.08 * Math.sin(t * 3))); },
      life(g, t) {
        star(g, 70, 117, 10 + Math.sin(t * 4) * 2, GOLD);
        for (let i = 0; i < 3; i++) { const y = 154 - ((t * 18 + i * 9) % 24); lighter(g, () => ell(g, 'rgba(220,230,255,0.35)', 294 + Math.sin(t * 3 + i) * 3, y, 3, 4)); }
      }
    },
    nicole: {
      title: 'Окно в приюте', aura: 'coins',
      frags: [
        ['Суперзаряженная бомба', '«Я всех усилила! Вперёд!» И сразу счёт за боеприпасы.'],
        ['Зарядное устройство', 'Даже секунда стоит денег. А можно премию? Хоть десять процентов?'],
        ['Заячья хитрость', 'Ни одна лиса не перехитрит эту зайку. С деньгами выходит хуже.'],
        ['Расширение территории', 'Поле шире на три метра. Окупится примерно через десять тысяч лет.'],
        ['Деловая звезда', 'Лицо восходящей звезды бизнеса. Клиенты вносят её в чёрный список.'],
        ['Заражённое поле', 'Когда-то она выманила у новичка Мияби катану. Вернула даром.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#2a2632'], [1, '#1a1820']]);
        rect(g, '#3a3440', 0, 0, LW, 160); rect(g, '#24202a', 0, 160, LW, 80);
        for (let x = 0; x < LW; x += 32) rect(g, '#342e3a', x, 0, 1, 160);
        rect(g, '#5a5060', 186, 26, 110, 96); rect(g, '#8a8098', 190, 30, 102, 88);
        vgrad(g, 30, 118, [[0, '#ffd890'], [1, '#f0a860']], 190, 102);
        rect(g, '#5a5060', 239, 30, 4, 88); rect(g, '#5a5060', 190, 72, 102, 4);
        rect(g, '#d8d4cc', 30, 150, 130, 16); rect(g, '#8a8aa0', 30, 166, 130, 4); rect(g, '#5a5a6a', 30, 170, 4, 18); rect(g, '#5a5a6a', 156, 170, 4, 18);
        ell(g, '#f2f0ea', 46, 148, 14, 6); rect(g, '#7a9ac8', 56, 144, 100, 10);
        rect(g, '#c8d4e0', 214, 160, 10, 14); rect(g, '#f4f8ff', 216, 162, 6, 10);
        if (!live) ell(g, '#fff0b0', 84, 96, 10, 10);
      },
      decor(g, t) { lighter(g, () => { for (let i = 0; i < 12; i++) ell(g, 'rgba(255,240,200,0.5)', 200 + hx(i, 2, 9) * 90, 40 + ((t * 8 + hx(i, 3, 9) * 70) % 70), 1, 1); }); },
      life(g, t) {
        const x = 84 + Math.sin(t * 1.3) * 6, y = 96 + Math.cos(t * 1.1) * 3;
        lighter(g, () => { poly(g, 'rgba(255,240,180,0.16)', [218, 166, 222, 170, x + 10, y + 6, x - 10, y - 6]); glow(g, x, y, 26, '#fff2b0', 0.8); });
        ell(g, '#fff8d8', x, y, 10, 10);
      }
    },
    anby: {
      title: 'Музыка для прогулок', aura: 'notes',
      frags: [
        ['Режим быстрой зарядки', 'Заряжай минуту, сражайся час. Так написано на аккумуляторе.'],
        ['Прицельная разрядка', '«Удар током сразу вырубает». По крайней мере, в кино всегда так.'],
        ['Хорошая подготовка', 'Военная выучка видна в каждом шаге. Откуда она, никто не знает.'],
        ['Электропроводность', 'Опытный рейдер каверн создаёт возможности для товарищей.'],
        ['Опыт улиц', 'Работа на «Хитрых зайцев» закаляет тело. И учит считать денни.'],
        ['Зарядное поле', 'Чужие реплики она знает наизусть. Музыку для прогулок пишет сама.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#0a0e22'], [1, '#161a30']]);
        rect(g, '#1a2040', 14, 16, 140, 96); rect(g, '#2a3058', 14, 16, 140, 4);
        vgrad(g, 20, 108, [[0, '#101838'], [1, '#2a2a58']], 18, 132);
        for (let i = 0; i < 12; i++) { const w = 8 + hx(i, 1, 37) * 10, h = 20 + hx(i, 2, 37) * 50; rect(g, '#0a0e20', 18 + i * 11, 108 - h, w, h); }
        if (!live) for (let i = 0; i < 20; i++) rect(g, '#f0d070', 22 + hx(i, 3, 37) * 126, 50 + hx(i, 4, 37) * 54, 2, 2);
        rect(g, '#3a2a24', 0, 172, LW, 68); rect(g, '#4a362e', 0, 172, LW, 5);
        rect(g, '#1a1a20', 40, 180, 110, 50); rect(g, '#f2eee0', 48, 186, 94, 22); rect(g, '#d84a3a', 48, 186, 94, 3);
        g.save(); g.font = 'bold 11px Arial, sans-serif'; g.fillStyle = '#2a2a3a'; g.fillText('МУЗЫКА ДЛЯ', 54, 199); g.fillText('ПРОГУЛОК', 54, 207); g.restore();
        for (const d of [0.3, 0.7]) { ell(g, '#0e0e12', 40 + 110 * d, 220, 7, 7); ell(g, '#c8ccd4', 40 + 110 * d, 220, 3, 3); }
        g.strokeStyle = '#1e2024'; g.lineWidth = 4; g.beginPath(); g.arc(240, 176, 22, Math.PI, 0); g.stroke(); g.lineWidth = 1;
        for (const x of [218, 262]) { ell(g, '#1e2024', x, 178, 8, 10); ell(g, '#d8a830', x, 178, 5, 7); }
      },
      decor(g, t) { lighter(g, () => { for (let i = 0; i < 20; i++) { const k = 0.5 + 0.5 * Math.sin(t * 2 + i); rect(g, rgba('#f0d070', 0.4 + 0.5 * k), 22 + hx(i, 3, 37) * 126, 50 + hx(i, 4, 37) * 54, 2, 2); } }); },
      life(g, t) {
        for (let i = 0; i < 6; i++) { const ph = (t * 0.3 + hx(i, 5, 37)) % 1, x = 230 + hx(i, 6, 37) * 40 + Math.sin(t + i) * 6, y = 160 - ph * 90; ell(g, rgba(VOLT, 1 - ph), x, y, 3, 2.4); rect(g, rgba(VOLT, 1 - ph), x + 2, y - 9, 1, 9); }
      }
    }
  };

  const CONE_ART = {
    starlight(b) {
      b.sky(['#0a0a2a', '#1a1a4a', '#2a1a3a']);
      b.stars(24, 53, 0, 80);
      b.rect('#2a2c34', 8, 96, 84, 14); b.rect('#3a3c46', 8, 96, 84, 3); b.rect('#2a2c34', 70, 106, 14, 26); b.rect('#c8283a', 30, 98, 30, 3);
      b.ell('#e8ecf4', 40, 62, 10, 11); b.rect('#1a1c2a', 33, 59, 14, 5);
      b.poly('#c8283a', [30, 74, 50, 74, 58, 96, 22, 96]);
      b.poly('#e8ecf4', [32, 72, 48, 72, 46, 94, 34, 94]);
      b.poly('#ffd040', [40, 76, 42, 81, 47, 81, 43, 84, 45, 89, 40, 86, 35, 89, 37, 84, 33, 81, 38, 81]);
      b.poly('#ffd040', [37, 51, 40, 42, 43, 51]);
      b.glow(40, 62, 30, 'rgba(255,224,128,0.4)');
    },
    vault(b) {
      b.sky(['#2a1a3a', '#4a2a5a', '#6a3a6a']);
      b.rect('#3a2a20', 0, 110, 100, 30);
      b.rect('#5a3a20', 18, 62, 64, 48); b.rect('#7a5028', 18, 62, 64, 6); b.rect('#c8a050', 46, 80, 8, 10);
      b.poly('#5a3a20', [16, 62, 84, 62, 78, 40, 22, 40]); b.rect('#c8a050', 16, 60, 68, 3);
      for (let i = 0; i < 9; i++) { const x = 14 + i * 9, y = 112 + (i % 3) * 6; b.ell('#8a6a20', x, y, 4, 4); b.ell('#ffd060', x, y, 3, 3); }
      for (let i = 0; i < 5; i++) { b.ell('#8a6a20', 30 + i * 10, 58 - (i % 2) * 4, 4, 4); b.ell('#ffd060', 30 + i * 10, 58 - (i % 2) * 4, 3, 3); }
      b.glow(50, 56, 34, 'rgba(200,138,255,0.35)');
    },
    battery(b) {
      b.sky(['#0a1408', '#16241a', '#24301e']);
      b.rect('#2a2c32', 30, 40, 40, 80); b.rect('#3a3c44', 30, 40, 40, 4); b.rect('#5a5c66', 42, 32, 16, 8);
      b.rect('#141618', 36, 50, 28, 62); b.rect('#d8f040', 36, 80, 28, 32);
      b.poly('#ffffff', [54, 52, 40, 76, 50, 76, 44, 96, 60, 70, 50, 70]);
      b.rect('#e8602a', 66, 60, 8, 14);
      b.glow(50, 80, 40, 'rgba(216,240,64,0.4)');
    }
  };

  Object.assign(H.Ults.SHOWS, ULTS);
  Object.assign(H.Fusions.SHOWS, FUS);
  Object.assign(E.SCENES, EID);
  Object.assign(G.CONE_SCENES, CONE_ART);
  if (H.SignalKit) Object.assign(H.SignalKit.QUOTES, { billy: 'Звёздный рыцарь не знает поражений, ха-ха-ха!', nicole: 'Мудрый выбор! Но мои услуги стоят недёшево!', anby: 'Энби из «Хитрых зайцев» на позиции.' });

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
