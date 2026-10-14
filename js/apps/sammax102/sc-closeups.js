(function (S) {
  'use strict';
  const { W, H, C, Pen, blit, font } = S;
  const E = S.EP102;
  const CLOSEUPS = S.CLOSEUPS;
  const { tvFrame, scanlines, screenMask, SCREEN, cached } = S.tvArt;
  const A = S.art102;
  const LAMP = [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp];

  const screenBuf = new S.Buf(W, H);

  function stage(f) {
    S.grad(f, screenMask(), C.plum, (x, y) => 0.2 + (y - SCREEN.y0) / 200);
  }

  function logo(f, t) {
    const P = new Pen(f);
    P.part(P.rect(90, 24, 108, 14), C.night, { b: 1 });
    font.drawCentered(f, 'МАЙРА!', 144, 27, Math.floor(t * 4) % 2 ? C.pink[4] : C.pink[3], 0);
  }

  function myraAt(f, x, y, s, pose) {
    const sp = S.sprite('myra', pose, s);
    blit(f, sp.buf, Math.round(x - sp.ox), Math.round(y - sp.oy));
  }

  function audience(f, t, y0, free) {
    const P = new Pen(f);
    for (let i = 0; i < 9; i++) {
      const x = 60 + i * 21, y = y0 + (i % 2) * 4;
      P.part(P.ell(x, y, 8, 7), [C.night, C.hair, C.fur][i % 3], { b: 2 });
      if (!free) { P.px(x - 3, y + 3, C.cycle[(i + Math.floor(t * 6)) % 8]); P.px(x + 3, y + 3, C.cycle[(i + 3 + Math.floor(t * 6)) % 8]); }
      if (i % 2 === 0) P.part(P.rect(x + 3, y - 6, 7, 6), [C.red, C.blue, C.gold][i % 3], { b: 3 });
    }
  }

  function desk(f, x, y, w) {
    const P = new Pen(f);
    P.part(P.poly([x, y, x + w, y, x + w - 4, y + 30, x + 4, y + 30]), C.pink, { b: 2 });
    P.part(P.rect(x - 2, y - 4, w + 4, 6), C.gold, { b: 3 });
  }

  const PROGS = {
    myra(f, t) {
      stage(f);
      myraAt(f, 150, 146, 0.98, { act: Math.floor(t * 1.2) % 2 ? 'gift' : '', talk: Math.floor(t * 8) % 3 !== 0, hypno: true, t });
      desk(f, 112, 106, 76);
      for (let i = 0; i < 4; i++) {
        const k = (t * 0.7 + i * 0.25) % 1;
        const P = new Pen(f);
        const x = 144 + (i - 1.5) * 30 * k, y = 70 - Math.sin(k * Math.PI) * 30 + k * 60;
        P.part(P.rect(x - 5, y - 4, 10, 8), [C.red, C.blue, C.gold, C.green][i], { b: 3 });
        P.line(x, y - 4, x, y + 4, C.gold[4]);
      }
      audience(f, t, 132, false);
      logo(f, t);
    },
    rules(f, t) {
      stage(f);
      logo(f, t);
      myraAt(f, 96, 142, 0.95, { act: 'point', talk: Math.floor(t * 8) % 3 !== 0, t });
      const P = new Pen(f);
      P.part(P.rect(140, 46, 88, 86), C.night, { b: 1 });
      font.draw(f, 'ЗВЕЗДА', 160, 50, C.gold[4]);
      const icons = [['vtape', 'РОЛЬ'], ['contract', 'ПЕСНЯ'], ['paper', 'СКАНДАЛ']];
      icons.forEach(([id, label], i) => {
        if (t < 0.8 + i * 1.2) return;
        blit(f, S.icon(id), 146, 62 + i * 22);
        font.draw(f, label, 174, 67 + i * 22, C.grey[5]);
      });
    },
    bear(f, t) {
      stage(f);
      myraAt(f, 144, 204, 1.5, { act: 'hug', talk: Math.floor(t * 8) % 3 !== 0, hypno: true, t });
      const sp = S.sprite('bear', { t }, 2.2);
      blit(f, sp.buf, Math.round(150 - sp.ox), Math.round(140 - sp.oy));
      logo(f, t);
    },
    glass(f, t) {
      const m = screenMask();
      S.grad(f, m, [C.grey[1], C.grey[2], C.stone[2], C.stone[3]], (x, y) => 0.2 + (y - SCREEN.y0) / 180);
      font.draw(f, 'АРХИВ, 1994', 58, 24, C.grey[5]);
      const P = new Pen(f);
      const s = new Pen(f).at(96, 142, 1.3);
      s.part(s.path('M -14 0 Q -18 -30 -10 -44 L 10 -44 Q 18 -30 14 0 Z'), C.red, { b: 2 });
      s.part(s.ell(0, -54, 7, 8), C.skin, { b: 3 });
      s.part(s.ell(0, -62, 9, 6), C.gold, { b: 3 });
      s.part(s.ell(0, -48, 3, 2.4), C.red, { b: 1, sh: 0, hi: 0 });
      s.part(s.cap(-8, -40, -22, -58, 2.4), C.skin, { b: 3, sh: 0 });
      for (let i = 0; i < 4; i++) P.curve(`M ${118 + i * 8} ${70 - i * 3} Q ${124 + i * 8} ${76 - i * 3} ${118 + i * 8} ${82 - i * 3}`, C.yellow[4]);
      desk(f, 150, 110, 70);
      if (t < 2.2) {
        P.part(P.poly([180, 88, 190, 88, 189, 108, 181, 108]), C.sky, { b: 4, sh: 0, hi: 0 });
        P.part(P.poly([181, 96, 189, 96, 188.6, 107, 181.4, 107]), C.blue, { b: 3, sh: 0, hi: 0, ol: 0 });
      } else {
        for (let i = 0; i < 9; i++) P.px(172 + (i * 7) % 26, 94 + (i * 5) % 16, C.sky[4]);
        P.part(P.ell(185, 110, 14, 2.4), C.sky, { b: 3, sh: 0 });
      }
    },
    faint(f, t) {
      stage(f);
      logo(f, t);
      const P = new Pen(f);
      P.part(P.rect(58, 42, 64, 50), C.grey, { b: 4 });
      P.part(P.rect(61, 45, 58, 44), C.green, { b: 3, sh: 0, hi: 0 });
      const cow = S.sprite('bessy', { dir: 'e', t: 0 }, 0.8);
      blit(f, cow.buf, Math.round(90 - cow.ox), Math.round(86 - cow.oy));
      P.part(P.ell(104, 56, 4, 3.4), C.red, { b: 3, sh: 0, hi: 0 });
      if (t < 2.4) myraAt(f, 176, 150, 1, { act: 'up', talk: Math.floor(t * 8) % 2 === 0, t });
      else myraAt(f, 176, 140, 1, { act: 'faint', t });
      desk(f, 136, 112, 84);
    },
    rerun(f, t) {
      stage(f);
      myraAt(f, 150, 146, 0.98, { talk: Math.floor(t * 8) % 3 !== 0, hypno: true, t });
      desk(f, 112, 106, 76);
      audience(f, t, 132, false);
      logo(f, t);
      font.draw(f, 'ПОВТОР', 58, 42, C.grey[5]);
    },
    sitcom(f, t) {
      const m = screenMask();
      S.grad(f, m, C.cheese, (x, y) => 0.55 - (y - SCREEN.y0) / 300);
      const P = new Pen(f);
      P.part(P.rect(52, 112, 184, 30), C.oak, { b: 2, sh: 0 });
      const cow = S.sprite('bessy', { dir: 'w', v: 'lampshade', t }, 1.1);
      blit(f, cow.buf, Math.round(144 - cow.ox), Math.round(136 - cow.oy));
      const sam = S.sprite('sam', { dir: 'e', talk: Math.floor(t * 7) % 3 === 0 ? 1 : 0 }, 0.9);
      blit(f, sam.buf, Math.round(82 - sam.ox), Math.round(140 - sam.oy));
      const ph = S.sprite('philo', { dir: 'w', v: 'featherly', act: t % 3 < 1.5 ? 'eat' : '', t }, 1.1);
      blit(f, ph.buf, Math.round(206 - ph.ox), Math.round(140 - ph.oy));
      P.part(P.rect(96, 22, 96, 11), C.grey, { b: 0 });
      font.drawCentered(f, 'АПЛОДИСМЕНТЫ', 144, 23, Math.floor(t * 3) % 2 ? C.neonA : C.red[1], 0);
    }
  };

  CLOSEUPS.tv2 = function (f, g, cu) {
    const t = g.time - cu.t0;
    tvFrame(f);
    screenBuf.px.fill(0);
    (PROGS[cu.prog] || PROGS.rerun)(screenBuf, t);
    for (let y = SCREEN.y0; y < SCREEN.y1; y++) for (let x = SCREEN.x0; x < SCREEN.x1; x++) {
      const c = screenBuf.px[y * W + x];
      if (c) f.px[y * W + x] = c;
    }
    scanlines(f);
  };

  CLOSEUPS.paper = function (f, g, cu) {
    const b = cached('paper102', W, H, (P, buf) => {
      const all = new S.Mask(0, 0, W, H); all.m.fill(1);
      S.grad(buf, all, C.wood, (x, y) => 0.25 + y / H * 0.3);
      P.part(P.poly([46, 6, 276, 4, 280, 196, 42, 198]), C.cream, { b: 4 });
      P.part(P.rect(52, 10, 222, 26), C.red, { b: 3 });
      font.drawCentered(buf, 'ВЕСТНИК', 163, 13, C.grey[5], C.black);
      font.drawCentered(buf, 'ИНОПЛАНЕТНЫХ ТРЕУГОЛЬНИКОВ', 163, 24, C.yellow[4], C.black);
      font.drawCentered(buf, 'ПЁС, КРОЛИК', 163, 42, C.black, 0);
      font.drawCentered(buf, 'И ЗЕЛЁНЫЙ НЕЗНАКОМЕЦ', 163, 52, C.black, 0);
      P.part(P.rect(78, 66, 170, 92), C.grey, { b: 5 });
      P.part(P.rect(84, 72, 158, 78), C.sky, { b: 2, sh: 0, hi: 0 });
      const sam = S.sprite('sam', { dir: 's' }, 1);
      blit(buf, sam.buf, 120 - sam.ox, 148 - sam.oy);
      const max = S.sprite('max', { dir: 's', act: 'grin' }, 1);
      blit(buf, max.buf, 156 - max.ox, 148 - max.oy);
      const hugh = S.sprite('hugh', { dir: 'w', v: 'green' }, 0.95);
      blit(buf, hugh.buf, 206 - hugh.ox, 150 - hugh.oy);
      P.part(P.ell(230, 84, 10, 3), C.grey, { b: 3 });
      P.part(P.ell(230, 81, 5, 3), C.sky, { b: 3, sh: 0 });
      font.drawCentered(buf, 'Кто третий лишний? Стр. 2', 163, 162, C.grey[1], 0);
      for (let i = 0; i < 3; i++) S.line(buf, 60, 176 + i * 6, 266, 176 + i * 6, C.cream[1]);
    });
    blit(f, b, 0, 0);
  };

  CLOSEUPS.titlecard2 = function (f, g, cu) {
    const t = g.time - cu.t0;
    S.starfield(f, 17, [C.night[0], C.purple[1], C.plum[2], C.rose[3]]);
    const P = new Pen(f);
    P.part(P.rect(96, 150, 128, 14), C.grey, { b: 0 });
    font.drawCentered(f, 'АПЛОДИСМЕНТЫ', 160, 153, Math.floor(t * 3) % 2 ? C.neonA : C.red[2], 0);
    const sam = S.sprite('sam', { dir: 's' }, 1.4);
    const max = S.sprite('max', { dir: 's', act: 'grin' }, 1.4);
    S.BG.pool(f, 160, 190, 110, 20, 1.4);
    blit(f, sam.buf, 190 - sam.ox, 198 - sam.oy);
    blit(f, max.buf, 124 - max.ox, 198 - max.oy - (Math.floor(t * 3) % 2 ? 2 : 0));
    S.bigText(f, 'SAM & MAX', 160, 16, 4, C.orange[3], C.yellow[4], 2);
    if (t > 1) S.bigText(f, cu.lines[1] || '', 160, 56, 2, C.sky[3], C.sky[4], 1);
    if (t > 1.8) S.bigText(f, cu.lines[2] || '', 160, 76, 3, C.pink[3], C.pink[4], 2);
  };

  const TITLE_ITEMS = ['Новая игра', 'Продолжить', 'Загрузить', 'Настройки', 'Выход'];

  E.TITLE = {
    items: TITLE_ITEMS,
    draw(f, t, hover, enabled) {
      S.starfield(f, 23, [C.night[0], C.night[1], C.purple[1], C.plum[2], C.rose[2]]);
      const back = cached('title102', W, 110, (Q, b) => {
        for (let i = 0; i < 12; i++) {
          const x = i * 28 - 6, h = 24 + Math.floor(S.hash(i, 5, 1) * 36);
          Q.part(Q.rect(x, 110 - h, 26, h), C.night, { b: 1, sh: 0, hi: 0, ol: C.night[0] });
          for (let yy = 110 - h + 4; yy < 106; yy += 6) for (let xx = x + 3; xx < x + 23; xx += 5) if (S.hash(xx, yy, 7) > 0.6) b.set(xx, yy, C.lamp);
        }
        Q.part(Q.rect(200, 18, 60, 92), C.plum, { b: 1 });
        Q.part(Q.rect(196, 10, 68, 14), C.night, { b: 1 });
        S.BG.textOn(b, 'WARP', 218, 12, C.orange[3], C.black);
        Q.part(Q.rect(226, 0, 2, 10), C.grey, { b: 1, sh: 0 });
        for (let yy = 30; yy < 104; yy += 12) for (let xx = 206; xx < 256; xx += 10) Q.part(Q.rect(xx, yy, 6, 7), LAMP, { sh: 0, hi: 0 });
      });
      blit(f, back, 0, 64);
      const P = new Pen(f);
      P.part(P.rect(0, 172, W, 28), C.asphalt, { b: 1, sh: 0, hi: 0, ol: 0 });
      for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.25 + Math.sin(t * 0.6 + i) * 0.1; S.line(f, 232, 74, 232 + Math.cos(a) * 120, 74 + Math.sin(a) * 120, C.yellow[3]); }
      S.BG.pool(f, 236, 188, 90, 18, 1.5);
      const sam = S.sprite('sam', { dir: 'w', talk: Math.floor(t * 0.5) % 4 === 1 && Math.floor(t * 8) % 2 === 0 ? 1 : 0, blink: Math.floor(t * 2) % 9 === 0 }, 1.45);
      const max = S.sprite('max', { dir: 'w', act: 'grin', walk: -1 }, 1.45);
      blit(f, sam.buf, 276 - sam.ox, 194 - sam.oy);
      blit(f, max.buf, 214 - max.ox, 194 - max.oy - (Math.floor(t * 2.5) % 2 ? 3 : 0));
      S.bigText(f, 'SAM & MAX', 100, 12, 3, C.orange[3], C.yellow[4], 2);
      S.bigText(f, 'СИТУАЦИЯ:', 100, 40, 2, C.pink[3], C.pink[4], 1);
      S.bigText(f, 'КОМЕДИЯ', 100, 58, 2, C.pink[3], C.pink[4], 1);
      font.drawCentered(f, 'ЭПИЗОД 102', 100, 77, C.sky[4]);
      TITLE_ITEMS.forEach((s, i) => {
        const on = enabled[i];
        const col = !on ? C.grey[2] : hover === i ? C.yellow[4] : C.grey[5];
        font.draw(f, (hover === i && on ? '» ' : '  ') + s, 30, 96 + i * 14, col);
      });
      font.draw(f, '(c) 2000 LucasArts. Win 98 Edition', 4, 190, C.grey[2]);
    },
    hit(x, y) {
      for (let i = 0; i < TITLE_ITEMS.length; i++) if (x >= 26 && x < 150 && y >= 94 + i * 14 && y < 106 + i * 14) return i;
      return -1;
    }
  };

  E.CREDITS = [
    ['SAM & MAX', 3], ['СИТУАЦИЯ: КОМЕДИЯ', 2], ['', 1],
    ['По комиксам Стива Пёрселла', 1], ['', 1],
    ['Сэм, собака в костюме', 1], ['Макс, гиперактивный кролик-нечто', 1], ['', 1],
    ['В ролях', 2], ['Майра Стамп в роли самой себя', 1], ['Фило Пенниуорт в роли мистера Фезерли', 1], ['Корова Бесси в роли нашего повара', 1], ['Хью Блисс, синий по желанию', 1], ['Лорд Рамплботтом, ранее Боско', 1], ['', 1],
    ['Телестудия WARP', 2], ['Режиссёр, продюсер, оператор,', 1], ['гримёр, осветитель и буфет', 1], ['Режиссёрша', 1], ['', 1],
    ['Графика', 2], ['320 на 200 точек, 256 цветов', 1], ['и один зелёный человек', 1], ['', 1],
    ['Спонсор эпизода', 2], ['Зубная паста «Серьёзная»', 1], ['', 1],
    ['При съёмках не пострадала', 1], ['ни одна корова.', 1], ['Курица немного обиделась.', 1], ['', 1],
    ['КОНЕЦ ЭПИЗОДА 102', 2], ['Продолжение следует...', 1]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
