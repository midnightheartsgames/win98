(function (H) {
  'use strict';
  const G = H.Gfx, K = H.Cine.Kit, E = H.Eidolons;
  const { LW, LH, BAR, cl, lerp, eOut, eIn, seg, hx, rgba, vgrad, glow, lighter, poly, rect, ell, line, ring, flash } = K;
  const FLOOR = LH - BAR;
  const hero = (S, look, x, y, o) => S.fig(look, x, y, Object.assign({ k: 2 }, o));
  const RED = '#e0304a', PINK = '#ff6aa8', BLUE = '#4a90e0';
  const pinkOf = () => H.CHARS.amanda.pinkLook || H.CHARS.amanda.look;
  const studentOf = () => H.CHARS.makoto.studentLook || H.CHARS.makoto.look;

  function heart(g, x, y, r) {
    g.beginPath();
    g.moveTo(x, y + r * 0.95);
    g.bezierCurveTo(x - r * 1.35, y + r * 0.05, x - r * 0.95, y - r * 1.05, x, y - r * 0.4);
    g.bezierCurveTo(x + r * 0.95, y - r * 1.05, x + r * 1.35, y + r * 0.05, x, y + r * 0.95);
    g.closePath();
  }

  function wand(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    rect(g, '#ff7ab8', -1, 0, 2, 28);
    poly(g, '#fbf4f8', [-4, -1, -14, -8, -11, 1]); poly(g, '#fbf4f8', [4, -1, 14, -8, 11, 1]);
    heart(g, 0, -2, 6); g.fillStyle = '#c5883d'; g.fill();
    heart(g, 0, -2, 4.6); g.fillStyle = '#ff4a96'; g.fill();
    g.restore();
  }

  function device(g, x, y, s, T) {
    g.save(); g.translate(x, y); g.scale(s, s);
    rect(g, '#1a1a22', -10, -6, 20, 12); rect(g, '#3a3a48', -9, -5, 18, 10);
    for (let i = 0; i < 4; i++) { const on = Math.floor(T * 6 + i) % 3 === 0; rect(g, on ? ['#ff3a5a', '#5ae8f8', '#ffd060', '#7aff8a'][i] : '#2a2a30', -7 + i * 4, -2, 2, 2); }
    rect(g, '#8a8a98', -2, -10, 1, 4);
    g.restore();
  }

  function portal(g, x, y, r, a, T) {
    if (r <= 0 || a <= 0) return;
    const gr = g.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, rgba('#0a0008', a)); gr.addColorStop(0.7, rgba('#3a0418', 0.9 * a)); gr.addColorStop(1, rgba(RED, 0.6 * a));
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r * 0.7, r, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = rgba(RED, a); g.lineWidth = 3; g.beginPath(); g.ellipse(x, y, r * 0.7, r, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1;
    for (let i = 0; i < 6; i++) { const an = T * 3 + i; line(g, rgba('#ffd0dc', a), 1, x + Math.cos(an) * r * 0.75, y + Math.sin(an) * r * 1.05, x + Math.cos(an + 0.3) * r * 0.75, y + Math.sin(an + 0.3) * r * 1.05); }
  }

  function gynoid(S, x, y, size, o) { S.foe('gynoid', x, y, size, o || {}); }

  function chains(g, x, y, r, a) {
    if (a <= 0) return;
    g.strokeStyle = rgba('#e8f2ff', a); g.lineWidth = 2;
    for (let i = 0; i < 10; i++) { const an = i / 10 * Math.PI * 2; g.beginPath(); g.ellipse(x + Math.cos(an) * r, y + Math.sin(an) * r * 0.5, 4, 2.6, an + (i % 2) * 1.5, 0, Math.PI * 2); g.stroke(); }
    g.lineWidth = 1;
  }

  function hall(g, T, tint) {
    vgrad(g, 0, LH, [[0, '#06061a'], [0.6, '#16123a'], [1, '#0e0a20']]);
    for (let i = 0; i < 10; i++) rect(g, '#2a2a40', 10 + i * 32, 0, 3, 16);
    rect(g, '#1a1a2c', 0, 14, LW, 3);
    if (tint) lighter(g, () => poly(g, rgba(tint, 0.18), [LW / 2 - 14, 0, LW / 2 + 14, 0, LW / 2 + 90, FLOOR, LW / 2 - 90, FLOOR]));
    rect(g, '#1c1834', 0, FLOOR - 6, LW, 6);
    for (let i = 0; i < 28; i++) { const x = 4 + i * 12, y = FLOOR + 6 + (i % 2) * 4, hop = Math.abs(Math.sin(T * 6 + i)) * 2; ell(g, '#0a0816', x, y - hop, 5, 5); rect(g, '#0a0816', x - 6, y + 3 - hop, 12, 14); }
  }

  const ULTS = {
    makoto: {
      line: 'Мяу. Эта блестяшка моя.', side: 'r', d: 1.5, team: 'speed', sfx: [[0.05, 'snap'], [0.12, 'ult'], [0.5, 'tech'], [0.85, 'warp'], [1.25, 'whoosh']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, open = eOut(seg(t, 0.6, 1.0)), step = seg(t, 1.0, 1.4);
        hall(g, T, RED);
        portal(g, 210, FLOOR - 70, 70 * open, open * (1 - seg(t, 1.35, 1.5)), T);
        hero(S, P.look, lerp(120, 205, eIn(step)), FLOOR + 22, { a: 1 - seg(t, 1.15, 1.4) });
        device(g, 150 - 30 * step, 120, 1.6, T);
        if (t < 0.4) lighter(g, () => glow(g, 136, 110, 50 * (1 - t / 0.4), RED, 0.9));
        if (t > 0.04 && t < 0.25) flash(g, '#ff3a5a', 0.6 * (1 - seg(t, 0.04, 0.25)));
      }
    },
    amanda: {
      line: 'За сим… любовь… восторжествует!', side: 'l', d: 1.6, team: 'shield', sfx: [[0.05, 'sparkle'], [0.4, 'shield'], [0.7, 'shield'], [1.0, 'shield'], [1.35, 'star4']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, up = eOut(seg(t, 0.05, 0.4)), blush = seg(t, 1.1, 1.5);
        vgrad(g, 0, LH, [[0, '#2a0a24'], [0.6, '#5a1a44'], [1, '#2a0a20']]);
        lighter(g, () => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + T * 0.4; poly(g, rgba('#ff9ad0', 0.1), [160, 100, 160 + Math.cos(a) * 300, 100 + Math.sin(a) * 300, 160 + Math.cos(a + 0.14) * 300, 100 + Math.sin(a + 0.14) * 300]); } });
        [70, 250, 120, 200].forEach((x, i) => {
          const k = eOut(seg(t, 0.35 + i * 0.15, 0.7 + i * 0.15));
          if (k <= 0) return;
          g.save(); heart(g, x, FLOOR - 40, 34 * k); g.lineWidth = 2; g.strokeStyle = rgba('#ff5aa0', k); g.stroke(); g.fillStyle = rgba('#ff8ac8', 0.35 * k); g.fill(); g.restore();
        });
        hero(S, pinkOf(), 160, FLOOR + 22);
        wand(g, 186, lerp(110, 54, up), 1.4, 0.2);
        if (blush > 0) { ell(g, rgba('#ff5a7a', 0.7 * blush), 154, 92, 3, 1.6); ell(g, rgba('#ff5a7a', 0.7 * blush), 166, 92, 3, 1.6); }
      }
    },
    talleah: {
      line: 'Excelsior! Наглая воровка не сбежит!', side: 'l', d: 1.6, sfx: [[0.05, 'scan'], [0.3, 'glint'], [0.55, 'tech'], [1.0, 'crit'], [1.1, 'crit'], [1.3, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, charge = seg(t, 0.5, 0.95), fire = seg(t, 0.95, 1.35);
        vgrad(g, 0, LH, [[0, '#06081e'], [0.6, '#0e1a3a'], [1, '#081024']]);
        K.stars(g, T, 40, 51, 0.8, FLOOR);
        for (let i = 0; i < 5; i++) { const k = eOut(seg(t, 0.05 + i * 0.06, 0.35 + i * 0.06)); if (k > 0) { lighter(g, () => glow(g, 40 + i * 60, FLOOR - 40, 30 * (1 - k), BLUE, 0.8)); gynoid(S, 40 + i * 60, FLOOR + 10, 90, { a: k }); } }
        hero(S, P.look, 70, FLOOR + 22);
        const bx = 104, by = 120;
        lighter(g, () => glow(g, bx, by, 6 + 16 * charge, '#5ab8ff', 0.4 + 0.6 * charge));
        if (fire > 0) lighter(g, () => { for (let i = 0; i < 6; i++) { const ty = 60 + i * 22; line(g, rgba('#7ad0ff', 1 - fire), 3, i === 0 ? bx : 40 + (i - 1) * 60, i === 0 ? by : FLOOR - 70, LW + 10, ty); } });
        if (t > 1.2) chains(g, 260, 110, 40, 1 - seg(t, 1.4, 1.6));
        if (fire > 0 && fire < 0.2) flash(g, '#c8e8ff', 0.5 * (1 - fire / 0.2));
      }
    }
  };

  const FUS = {
    f_ccc3: {
      lines: [[0, 'Выбрать только одну? Скучно.'], [1, 'Любовь… победит! Не смотрите!'], [2, 'Вперёд, друзья мои! Во имя правосудия!']], swaps: [0.8, 1.6], d: 2.6, team: 'shield',
      sfx: [[0.1, 'snap'], [0.5, 'lever'], [0.9, 'sparkle'], [1.3, 'scan'], [1.8, 'ult'], [2.1, 'break'], [2.3, 'clap']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Mk, , Tl] = P.m, meet = eOut(seg(t, 1.6, 2.0)), boom = seg(t, 2.0, 2.6);
        hall(g, T);
        const xs = [70, 160, 250], cols = [RED, PINK, BLUE];
        lighter(g, () => xs.forEach((x, i) => { const lit = seg(t, 0.3 + i * 0.4, 0.5 + i * 0.4); if (lit > 0) poly(g, rgba(cols[i], 0.25 * lit), [x - 6, 0, x + 6, 0, lerp(x + 40, 166, meet), lerp(FLOOR, 50, meet), lerp(x - 40, 154, meet), lerp(FLOOR, 50, meet)]); }));
        hero(S, Mk.look, 70, FLOOR + 22); hero(S, pinkOf(), 160, FLOOR + 22); hero(S, Tl.look, 250, FLOOR + 22, { flip: true });
        if (boom > 0) lighter(g, () => { glow(g, 160, 50, 60 * (1 - boom), '#ffd060', 0.8); for (let i = 0; i < 30; i++) { const a = hx(i, 1, 81) * Math.PI * 2, v = 20 + hx(i, 2, 81) * 120, px = 160 + Math.cos(a) * v * eOut(boom), py = 50 + Math.sin(a) * v * eOut(boom) + 30 * boom * boom; rect(g, rgba(cols[i % 3], 1 - boom), Math.round(px), Math.round(py), 2, 2); } });
      }
    },
    f_duel: {
      lines: [[1, 'Верни сокровище и сдавайся!'], [0, 'Ой, а я тебя знаю. Это Заступница!']], swap: 0.85, d: 1.8,
      sfx: [[0.1, 'scan'], [0.5, 'snap'], [0.9, 'tech'], [1.2, 'crit'], [1.35, 'crit'], [1.55, 'break']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [Mk, Tl] = P.m, shot = seg(t, 1.15, 1.5);
        vgrad(g, 0, LH, [[0, '#1a1430'], [0.6, '#2a2048'], [1, '#14102a']]);
        poly(g, '#3a1a2a', [0, LH, 120, 120, 200, 120, LW, LH]);
        hero(S, Mk.look, 80, FLOOR + 22); hero(S, Tl.look, 240, FLOOR + 22, { flip: true });
        if (t > 0.4) { lighter(g, () => { glow(g, 110, 120, 8, RED, 0.9); glow(g, 210, 120, 8, '#5ab8ff', 0.9); }); }
        if (shot > 0) lighter(g, () => { line(g, rgba('#ff5a7a', 1 - shot), 3, 110, 120, lerp(110, 290, shot), 116); line(g, rgba('#7ad0ff', 1 - shot), 3, 210, 120, lerp(210, 30, shot), 124); });
        if (shot > 0.5) chains(g, 160, 120, 60 * shot, 1 - shot);
      }
    },
    f_started: {
      lines: [[0, 'Земля в моей юри… юрисдикции!'], [1, 'Она первая начала!']], swap: 0.85, d: 1.8, team: 'shield',
      sfx: [[0.1, 'sparkle'], [0.45, 'scan'], [0.9, 'whoosh'], [1.2, 'crit'], [1.4, 'shield']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [, Tl] = P.m, turn = seg(t, 0.9, 1.1), hit = seg(t, 1.1, 1.5);
        hall(g, T, PINK);
        hero(S, pinkOf(), 100, FLOOR + 22, { flip: turn < 0.5 }); hero(S, Tl.look, 220, FLOOR + 22, { flip: turn < 0.5 ? false : true });
        if (t < 0.9) lighter(g, () => { glow(g, 128, 110, 10, PINK, 0.9); glow(g, 192, 110, 10, '#5ab8ff', 0.9); line(g, rgba('#ffffff', 0.5), 1, 128, 110, 192, 110); });
        if (hit > 0) lighter(g, () => { for (let i = 0; i < 2; i++) line(g, rgba(i ? '#7ad0ff' : '#ff9ad0', 1 - hit), 3, i ? 220 : 100, 110, i ? LW + 10 : -10, 80 + i * 40); });
        if (hit > 0.3) [100, 220].forEach(x => { g.save(); heart(g, x, FLOOR - 40, 34); g.lineWidth = 2; g.strokeStyle = rgba('#ff5aa0', hit); g.stroke(); g.restore(); });
      }
    },
    f_shut: {
      lines: [[0, 'Захлопни хлеборезку хоть на пять секунд!'], [1, 'Костюмчик маловат, красавица?']], swap: 0.9, d: 1.8, team: 'shield',
      sfx: [[0.1, 'shield'], [0.5, 'debuff'], [0.95, 'snap'], [1.2, 'crit'], [1.5, 'glint']],
      act(S, P) {
        const g = S.g, t = S.t, T = S.T, [, Mk] = P.m, cover = eOut(seg(t, 0.1, 0.5)), steal = seg(t, 1.0, 1.4);
        hall(g, T, RED);
        hero(S, pinkOf(), 110, FLOOR + 22);
        g.save(); heart(g, 210, FLOOR - 40, 40 * cover); g.lineWidth = 2; g.strokeStyle = rgba('#ff5aa0', cover); g.stroke(); g.fillStyle = rgba('#ff8ac8', 0.25 * cover); g.fill(); g.restore();
        hero(S, Mk.look, lerp(210, 260, eOut(steal)), FLOOR + 22, { flip: true });
        if (steal > 0) lighter(g, () => { glow(g, 280, 90, 20 * (1 - steal), RED, 0.9); for (let i = 0; i < 2; i++) { const k = seg(t, 1.3 + i * 0.1, 1.6 + i * 0.1); if (k > 0) glow(g, lerp(290, 250, k), lerp(70, 110, k), 5, '#ffd060', 1 - k); } });
      }
    }
  };

  const EID = {
    makoto: {
      title: 'Кошка на крыше', aura: 'imag',
      frags: [
        ['Студентка по обмену', 'С острова Кюсю, по документам. Акцента нет, английский идеальный.'],
        ['Котёнок у плеча', 'Сворачивается на соседнем сиденье и обещает не драть диван.'],
        ['Щелчок пальцами', 'Костюм связан с ней на молекулярном уровне. Одна вспышка, и она готова.'],
        ['Прибор с лампочками', 'Его собрал очень близкий ей человек из родного мира.'],
        ['Неправильная жизнь', 'Все миры, где она была, оказались неправильными. Этот её устраивает.'],
        ['С любовью, Макото', 'Меньше всего ей хочется, чтобы с ней перестали общаться.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#04041a'], [0.55, '#14103a'], [1, '#2a1a3a']]);
        if (!live) for (let i = 0; i < 40; i++) rect(g, '#ffffff', Math.round(hx(i, 1, 7) * LW), Math.round(hx(i, 2, 7) * 110), 1, 1);
        rect(g, '#0e0c1c', 0, 150, LW, 90);
        for (let r = 0; r < 4; r++) for (let i = 0; i < 26; i++) rect(g, rgba('#ffb040', 0.5 + 0.4 * hx(i, r, 9)), 4 + i * 12 + (r % 2) * 6, 170 + r * 16, 2, 2);
        rect(g, '#3a3450', 0, 140, LW, 14); rect(g, '#5a5470', 0, 140, LW, 2);
        rect(g, '#2a1a3a', 40, 112, 120, 28); rect(g, '#fb2894', 44, 116, 112, 2); rect(g, '#5ae8f8', 44, 136, 112, 1);
        g.save(); g.font = 'bold 14px Georgia, serif'; g.textAlign = 'center'; g.fillStyle = '#fb2894'; g.fillText('КОН-ТОН', 100, 132); g.restore();
        device(g, 272, 134, 1.4, 0);
      },
      decor(g, t) {
        lighter(g, () => { const k = 0.5 + 0.5 * Math.sin(t * 3); rect(g, rgba('#fb2894', 0.4 * k), 44, 116, 112, 2); glow(g, 100, 126, 50, '#fb2894', 0.12 * k); });
      },
      life(g, t) {
        lighter(g, () => glow(g, 250, 132, 8 + 2 * Math.sin(t * 4), '#ff2a3a', 0.8));
        device(g, 272, 134, 1.4, t);
      }
    },
    amanda: {
      title: 'Лавочка на солнце', aura: 'wind',
      frags: [
        ['Соседка с начальной школы', 'Шестнадцать лет знает Джейкоба и, как она говорит, научилась его терпеть.'],
        ['Смокинг на выпускной', 'Ни одного платья. Из спорта только фрисби-гольф в помещении.'],
        ['Звонок с работы', 'Звонок «с работы» значит вторжение. Они бывают примерно раз в месяц.'],
        ['Бог-О-Бог', 'Два года назад в лагере розовый медведь с корабля выбрал вожатых в Защитники.'],
        ['Блин блинский', 'В розовой форме ругаться нельзя, а рот сам благодарит за комплименты.'],
        ['Кто-то позаботится', 'Она бережёт целую планету. Иногда ей хочется, чтобы поберегли её.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, 150, [[0, '#5a9ae0'], [1, '#c8e0f4']]);
        rect(g, '#c8bca8', 0, 70, LW, 80);
        for (let r = 0; r < 3; r++) for (let c = 0; c < 10; c++) rect(g, '#ffe8b0', 10 + c * 31, 80 + r * 20, 16, 10);
        rect(g, '#8a8a92', 0, 150, LW, 90);
        for (const x of [30, 290]) { rect(g, '#b8b0a0', x - 12, 150, 24, 14); rect(g, '#c8c0b0', x - 9, 134, 18, 18); rect(g, '#c8c0b0', x - 5, 126, 10, 10); }
        for (const x of [70, 250]) { rect(g, '#7a5a3a', x - 2, 70, 4, 80); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; poly(g, '#3a8a4a', [x, 70, x + Math.cos(a) * 26, 70 + Math.sin(a) * 10 - 4, x + Math.cos(a + 0.3) * 22, 70 + Math.sin(a + 0.3) * 8]); } }
        rect(g, '#6a4a2a', 100, 196, 130, 8); rect(g, '#5a3a20', 106, 204, 6, 22); rect(g, '#5a3a20', 218, 204, 6, 22); rect(g, '#6a4a2a', 100, 172, 130, 6);
        poly(g, '#7a7a86', [196, 196, 200, 140, 218, 126, 242, 132, 250, 196]);
        ell(g, '#6a6a76', 226, 120, 16, 18);
        poly(g, '#2a9a4a', [120, 190, 146, 190, 144, 196, 122, 196]); ell(g, '#16161c', 128, 192, 3, 2); ell(g, '#16161c', 138, 192, 3, 2);
        rect(g, '#16161c', 160, 188, 10, 8); rect(g, '#5ab8ff', 161, 189, 8, 5);
      },
      decor(g, t) { lighter(g, () => glow(g, 300, 20, 60, '#fff4c0', 0.3 + 0.05 * Math.sin(t))); },
      life(g, t) {
        lighter(g, () => { for (let i = 0; i < 10; i++) { const ph = (t * 0.3 + hx(i, 1, 13)) % 1; rect(g, rgba(PINK, (1 - ph) * 0.8), Math.round(150 + hx(i, 2, 13) * 60), Math.round(170 - ph * 60), 2, 2); } });
      }
    },
    talleah: {
      title: 'Отряды по пять', aura: 'quant',
      frags: [
        ['Ваше Высочество', 'Так её зовут гиноиды. Джейкобу она предлагает звать её так же.'],
        ['Заступница Авии', 'Охраняла хранилище и упустила одно из трёх священных сокровищ.'],
        ['Excelsior!', 'Радуясь, она издаёт щёлкающие звуки. Смущаясь, тоже.'],
        ['Дверная ручка', 'Победила её с помощью землянина. Невероятно!'],
        ['88 гапулексовых часов', 'Столько она проспала в капсуле. И хочет ещё.'],
        ['Любовь без условий', 'На Земле из семьи не выкидывают. Как необычно и как обворожительно.']
      ],
      paint(g, X, live) {
        vgrad(g, 0, LH, [[0, '#1a2440'], [0.6, '#2a3a5a'], [1, '#141a2c']]);
        for (let x = 0; x < LW; x += 40) { rect(g, '#3a4a6a', x, 0, 4, 150); rect(g, '#5a6a8a', x + 4, 0, 1, 150); }
        rect(g, '#05061a', 0, 150, LW, 26);
        if (!live) for (let i = 0; i < 30; i++) rect(g, '#ffffff', Math.round(hx(i, 1, 17) * LW), 152 + Math.round(hx(i, 2, 17) * 22), 1, 1);
        rect(g, '#7a9ac8', 0, 150, LW, 1); rect(g, '#7a9ac8', 0, 176, LW, 1);
        rect(g, '#22304a', 0, 176, LW, 64);
        rect(g, '#2a3450', 228, 40, 70, 110); rect(g, '#0e1426', 236, 48, 54, 102);
        rect(g, '#5a7aa0', 248, 70, 30, 70); rect(g, rgba('#5aff9a', 0.55), 251, 76, 24, 60);
        for (let i = 0; i < 5; i++) X.S.foe('gynoid', 30 + i * 36, 148, 70);
      },
      decor(g, t) { lighter(g, () => { for (let x = 20; x < LW; x += 80) glow(g, x, 6, 30, '#9ac8ff', 0.15 + 0.05 * Math.sin(t * 2 + x)); }); },
      life(g, t) {
        for (let i = 0; i < 8; i++) { const ph = (t * 0.4 + hx(i, 1, 19)) % 1; ell(g, rgba('#c8ffe0', 0.7 * (1 - ph)), 254 + hx(i, 2, 19) * 18, 134 - ph * 56, 1.4, 1.4); }
        for (let i = 0; i < 10; i++) { const ph = (t * 0.15 + hx(i, 3, 19)) % 1; rect(g, '#ffffff', Math.round(ph * LW), 154 + Math.round(hx(i, 4, 19) * 18), 1, 1); }
      }
    }
  };

  const CONE_ART = {
    cccletter(b) {
      b.sky(['#e8d8b8', '#d8c4a0']);
      b.rect('#b8a888', 0, 96, 100, 44);
      b.rect('#f4f0f4', 6, 80, 88, 28); b.rect('#e0d8e4', 6, 104, 88, 4);
      b.rect('#6a4a1a', 30, 12, 40, 50); b.rect('#c8a040', 32, 14, 36, 46); b.rect('#2a2a34', 34, 16, 32, 42);
      b.ell('#3a3a40', 50, 40, 10, 12); b.ell('#4a4a52', 50, 46, 7, 6); b.ell('#f0ece0', 46, 37, 2, 1.6); b.ell('#f0ece0', 54, 37, 2, 1.6); b.ell('#14141a', 46.6, 37.2, 0.8, 0.8); b.ell('#14141a', 54.6, 37.2, 0.8, 0.8);
      b.poly('#f8f4ea', [34, 84, 66, 82, 68, 102, 32, 104]); b.poly('#e0d8c8', [34, 84, 50, 94, 66, 82]);
      b.ell('#e0304a', 50, 94, 5, 5); b.poly('#e0304a', [45, 93, 46, 87, 49, 91]); b.poly('#e0304a', [55, 93, 54, 87, 51, 91]);
      b.rect('#ffd060', 47.6, 93, 1.2, 1.2); b.rect('#ffd060', 51.4, 93, 1.2, 1.2);
    },
    cccmagic(b) {
      b.sky(['#e8c890', '#c89a60', '#8a6a40']);
      b.rect('#6a4a2a', 0, 104, 100, 36);
      for (let i = 0; i < 3; i++) { const x = 20 + i * 30; b.ell('#c8c8d8', x, 46, 6, 7); b.rect('#b8b8c8', x - 7, 52, 14, 40); b.rect('#a8a8b8', x - 6, 92, 5, 14); b.rect('#a8a8b8', x + 1, 92, 5, 14); }
      b.ell('#f0d080', 34, 104, 6, 7); b.rect('#4a6a8a', 29, 110, 10, 18);
      b.ell('#f2d8a8', 34, 100, 4, 4.4); b.ell('#e8c070', 34, 97, 5, 3);
      b.rect('#b89a6a', 54, 104, 12, 12); b.rect('#a88a5a', 55, 116, 10, 14); b.rect('#2a2a30', 56, 108, 8, 2);
      b.glow(50, 30, 40, 'rgba(255,240,200,0.4)');
    },
    cccpratia(b) {
      b.sky(['#2a0a4a', '#6a2a8a', '#c87ac8']);
      b.stars(20, 41, 0, 60);
      b.ell('#3a6a3a', 50, 140, 70, 30); b.poly('#c8b090', [44, 140, 56, 140, 54, 96, 46, 96]);
      for (let i = 0; i < 6; i++) { b.ell('#2a5a3a', 8 + i * 18, 96 - (i % 2) * 6, 10, 8); b.ell('#e87ac8', 8 + i * 18, 92 - (i % 2) * 6, 2, 2); }
      for (let i = 0; i < 5; i++) { const y = 106 + i * 7, s = 0.6 + i * 0.12; b.ell('#e2e5fa', 50, y, 3 * s, 3.4 * s); b.rect('#16203c', 50 - 2.6 * s, y - 1, 5.2 * s, 1.6 * s); b.rect('#e2e5fa', 50 - 2 * s, y + 3 * s, 4 * s, 5 * s); }
    },
    cccgorilla(b) {
      b.sky(['#2a2028', '#3a2a30']);
      b.rect('#6a4a1a', 14, 14, 72, 106); b.rect('#c8a040', 18, 18, 64, 98); b.rect('#2a2a34', 22, 22, 56, 90);
      b.ell('#3a3a40', 50, 66, 22, 26); b.ell('#4a4a52', 50, 78, 14, 12); b.ell('#2a2a30', 50, 52, 18, 8);
      b.ell('#f0ece0', 42, 62, 4.4, 3.6); b.ell('#f0ece0', 58, 62, 4.4, 3.6); b.ell('#14141a', 43.6, 62.4, 1.8, 1.8); b.ell('#14141a', 59.6, 62.4, 1.8, 1.8);
      b.ell('#1a1a1e', 46, 78, 1.6, 1.1); b.ell('#1a1a1e', 54, 78, 1.6, 1.1); b.rect('#1a1a1e', 44, 86, 12, 1);
    },
    cccbadge(b) {
      b.sky(['#d8d0e0', '#b8b0c8']);
      b.rect('#8a6a8a', 0, 70, 100, 70); b.rect('#a88aa8', 0, 70, 100, 4);
      b.rect('#2a4a8a', 8, 54, 30, 40); b.rect('#3a5aa0', 10, 56, 26, 14); b.rect('#1a2a5a', 18, 50, 10, 6);
      b.line('#2a3a8a', [52, 70, 60, 86, 68, 70], 1.6);
      b.rect('#14141e', 52, 86, 16, 20); b.rect('#f4f2ec', 53, 87, 14, 18); b.rect('#e0304a', 53, 87, 14, 3); b.rect('#ff6aa8', 53, 90, 14, 1.4); b.rect('#4a90e0', 53, 91.4, 14, 1.4);
      b.rect('#f2ecdc', 74, 84, 20, 26); b.rect('#c8243a', 74, 84, 20, 5);
      b.rect('#2a9a4a', 14, 100, 30, 24); b.rect('#16161c', 14, 100, 30, 5);
      b.rect('#f8f4f8', 52, 110, 30, 22); b.rect('#e26396', 52, 124, 30, 8);
    },
    cccstandee(b) {
      b.sky(['#2a2440', '#3a3058']);
      b.rect('#4a1a2a', 0, 104, 100, 36);
      b.poly('#2a1a3a', [62, 120, 90, 120, 88, 64, 92, 56, 76, 44, 60, 56, 64, 64]);
      b.ell('#c8a8d8', 76, 52, 6, 7); b.rect('#1a0a1a', 72, 54, 8, 1.2);
      b.rect('#b89060', 60, 118, 32, 2);
      b.figure(H.CHARS.talleah.look, 28, 92, 80);
      b.rect('#c8d0e0', 34, 70, 14, 4); b.ell('#5ab8ff', 40, 68, 3, 3);
      b.glow(42, 70, 8, 'rgba(90,184,255,0.6)');
    }
  };

  Object.assign(H.Ults.SHOWS, ULTS);
  Object.assign(H.Fusions.SHOWS, FUS);
  Object.assign(E.SCENES, EID);
  Object.assign(G.CONE_SCENES, CONE_ART);

  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hsr98 = globalThis.Hsr98 || {});
