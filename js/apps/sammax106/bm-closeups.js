(function (S) {
  'use strict';
  const { W, H, C, Pen, Buf, blit, font } = S;
  const E = S.EP106;
  const CLOSEUPS = S.CLOSEUPS;
  const { tvFrame, scanlines, screenMask, SCREEN } = S.tvArt;
  const A = S.art106;
  const { BOW } = A;
  const screenBuf = new Buf(W, H);
  const FULL = new S.Mask(0, 0, W, H);
  FULL.m.fill(1);
  const cache = new Map();

  function once(key, fn) {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  }

  function space(f, seed, n) {
    f.px.fill(C.night[0]);
    A.stars(f, FULL, seed, n || 120);
  }

  function moonGround(f, P, d, seed) {
    const ground = P.path(d);
    S.grad(f, ground, C.stone, (x, y) => 0.8 - (y - 136) / 130 + (S.hash(x >> 1, y >> 1, seed) - 0.5) * 0.14);
    ground.each((x, y) => { if (!ground.has(x, y - 1)) f.set(x, y, C.stone[4]); });
    return ground;
  }

  function moonDisc(P, x, y, r) {
    P.part(P.ell(x, y, r, r), C.stone, { b: 4 });
    for (const [dx, dy, k] of [[-0.36, -0.3, 0.24], [0.3, 0.1, 0.3], [-0.2, 0.44, 0.16], [0.42, -0.46, 0.12]]) P.part(P.ell(x + dx * r, y + dy * r, k * r, k * r * 0.8), C.stone, { b: 2, sh: 0, hi: 0, ol: C.stone[1] });
  }

  const talking = (g, who) => (g.speech.some(s => s.who === who) && Math.floor(g.time * 9) % 3 ? 1 : 0);

  CLOSEUPS.titlecard6 = function (f, g, cu) {
    const t = g.time - cu.t0;
    space(f, 7, 130);
    const P = new Pen(f);
    const bl = t > 2.6;
    A.earth(P, 262, 118, 30, { bliss: bl, ring: bl, k: Math.floor(g.time * 6) % 8 });
    moonGround(f, P, 'M 0 152 Q 80 140 160 148 Q 240 156 320 144 L 320 200 L 0 200 Z', 5);
    const sam = S.sprite('sam', { dir: 's' }, 1.5);
    const max = S.sprite('max', { dir: 's', act: 'grin' }, 1.5);
    const bob = Math.floor(t * 2.5) % 2 ? 3 : 0;
    blit(f, sam.buf, 148 - sam.ox, 198 - sam.oy);
    blit(f, max.buf, 84 - max.ox, 198 - max.oy - bob);
    S.bigText(f, 'SAM & MAX', 160, 8, 4, C.orange[3], C.yellow[4], 2);
    if (t > 1) S.bigText(f, cu.lines[1] || '', 160, 46, 2, C.sky[3], C.sky[4], 1);
    if (t > 1.8) S.bigText(f, cu.lines[2] || '', 160, 66, 2, C.pink[3], C.pink[4], 1);
  };

  CLOSEUPS.fly6 = function (f, g, cu) {
    const t = g.time - cu.t0;
    space(f, 21, 140);
    const dir = cu.moon ? -1 : 1;
    for (let i = 0; i < 46; i++) {
      const sp = 40 + (i % 5) * 36;
      const x = (((S.hash(i, 5, 1) * W - dir * t * sp) % W) + W) % W;
      const y = Math.floor(S.hash(i, 5, 2) * H);
      for (let k = 0; k < 2 + (i % 5); k++) f.set(Math.round(x + dir * k), y, k ? C.grey[3] : C.grey[5]);
    }
    const P = new Pen(f);
    const k = Math.min(1, t / 7);
    const bl = E.blissed(g);
    const ek = Math.floor(g.time * 6) % 8;
    if (cu.moon) {
      A.earth(P, 276, 150, 26 - k * 10, { bliss: bl, ring: bl, k: ek });
      moonDisc(P, 46, 52, 18 + k * 22);
    } else {
      moonDisc(P, 40, 150, 28 - k * 12);
      A.earth(P, 270, 58, 20 + k * 22, { bliss: bl, ring: bl, k: ek });
    }
    const car = once('desoto', () => S.LAYERS.street.desoto());
    const cx = 94 + Math.round(Math.sin(t * 1.3) * 5), cy = 82 + Math.round(Math.sin(t * 2.1) * 3);
    const flip = !cu.moon;
    const sam = S.sprite('sam', { dir: flip ? 'e' : 'w' }, 0.6);
    const max = S.sprite(E.husk(g) ? 'maxbliss6' : 'max', { dir: flip ? 'e' : 'w', act: E.husk(g) ? '' : 'grin', v: g.actors.max ? g.actors.max.v : '', t: g.time }, 0.6);
    const seat = x => (flip ? 134 - x : x);
    blit(f, sam.buf, cx + seat(80) - sam.ox, cy + 30 - sam.oy);
    blit(f, max.buf, cx + seat(62) - max.ox, cy + 27 - max.oy);
    blit(f, car, cx, cy, flip);
    for (let i = 0; i < 9; i++) {
      const fx = cx + seat(136 + ((i * 7 + Math.floor(t * 30)) % 22)), fy = cy + 24 + ((i * 5) % 9);
      f.set(fx, fy, i % 3 ? C.lamp : C.orange[3]);
      f.set(fx + dir, fy, C.orange[2]);
    }
  };

  function anchor(f, t) {
    const P = new Pen(f);
    P.part(P.rect(52, 112, 184, 30), C.wood, { b: 2 });
    const a = new Pen(f).at(96, 112, 1.6);
    a.part(a.ell(0, -22, 8.4, 9), C.hair, { b: 2 });
    a.part(a.rect(-14, -8, 28, 14), C.teal, { b: 3 });
    a.part(a.poly([-3, -8, 3, -8, 0, -2]), C.grey, { b: 5, sh: 0, hi: 0 });
    a.part(a.ell(0, -20, 6, 7), C.skin, { b: 3 });
    a.px(-2.4, -21, C.pupil); a.px(2.4, -21, C.pupil);
    if (Math.floor(t * 8) % 3) a.part(a.ell(0, -16, 2, 1.2), C.red, { b: 1, sh: 0, hi: 0 });
    else a.line(-1.6, -16, 1.6, -16, C.red[1]);
  }

  const PROGS = {
    hugh(f, t) {
      S.grad(f, screenMask(), C.sky, (x, y) => 0.25 + (y - 20) / 170);
      const P = new Pen(f);
      A.rainbow(P, 144, 142, 78, 5);
      const sp = S.sprite('hugh6', { dir: 's', talk: Math.floor(t * 8) % 3 ? 1 : 0, act: Math.floor(t / 2) % 2 ? 'magic' : '', t }, 1.25);
      blit(f, sp.buf, 144 - sp.ox, 146 - sp.oy);
      font.drawCentered(f, 'ЭМЕТИКА', 144, 24, C.lamp);
      if (Math.floor(t * 2) % 2) font.drawCentered(f, 'ВДОХ... ВЫДОХ...', 144, 130, C.grey[5]);
    },
    news(f, t) {
      S.grad(f, screenMask(), C.blue, (x, y) => 0.2 + (y - 20) / 200);
      const P = new Pen(f);
      P.part(P.rect(140, 38, 86, 58), C.night, { b: 1 });
      moonDisc(P, 168, 66, 16);
      A.rainbow(P, 200, 90, 18, 2);
      anchor(f, t);
      font.draw(f, 'НОВОСТИ 13', 56, 24, C.yellow[4]);
      font.draw(f, 'ЛУНА', 172, 98, C.grey[5]);
    },
    shop(f, t) {
      S.grad(f, screenMask(), C.lilac, (x, y) => 0.4 + (y - 20) / 240);
      const P = new Pen(f);
      const sp = S.sprite('harry6', { dir: 'e', act: Math.floor(t * 1.5) % 2 ? 'point' : '', talk: Math.floor(t * 8) % 3 ? 1 : 0 }, 1.5);
      blit(f, sp.buf, 106 - sp.ox, 142 - sp.oy);
      A.uni(P.scaled(186, 126, 2), 186, 126, Math.floor(t) % 2 ? C.yellow : C.red);
      font.drawCentered(f, 'СУВЕНИРЫ НА ЛУНЕ', 144, 24, C.lamp);
      if (Math.floor(t * 3) % 2) font.drawCentered(f, 'РОГАТИК ЗНАЕТ ВАШ ЦВЕТ', 144, 130, C.eye);
    },
    bliss(f, t) {
      const m = screenMask();
      const cx = 144, cy = 80;
      m.each((x, y) => {
        const r = Math.hypot(x - cx, (y - cy) * 1.3);
        f.set(x, y, C.cycle[((Math.floor(r * 0.16 - t * 5) % 8) + 8) % 8]);
      });
      S.art102.hughHead(new Pen(f).at(cx, cy + 10, 3), 0, 0, { talk: Math.floor(t * 8) % 3 ? 1 : 0 });
      font.drawCentered(f, 'Я ХЬЮ БЛИСС', 144, 24, C.eye);
      font.drawCentered(f, 'ВЫ ТОЖЕ', 144, 130, C.eye);
    },
    snow(f, t) {
      const seed = Math.floor(t * 14);
      screenMask().each((x, y) => f.set(x, y, S.hash(x, y, seed) > 0.5 ? C.grey[4] : C.grey[1]));
      if (Math.floor(t * 2) % 2) font.drawCentered(f, 'НЕТ СИГНАЛА', 144, 76, C.eye);
    },
    rerun(f, t) {
      PROGS.hugh(f, t);
      font.draw(f, 'ПОВТОР', 58, 36, C.grey[5]);
    }
  };

  CLOSEUPS.tv6 = function (f, g, cu) {
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

  CLOSEUPS.call6 = function (f, g, cu) {
    const P = new Pen(f);
    const left = P.poly([0, 0, 170, 0, 150, 200, 0, 200]);
    const right = P.poly([170, 0, 320, 0, 320, 200, 150, 200]);
    S.grad(f, left, [C.night[0], C.night[1], C.night[2], C.lilac[1]], (x, y) => y / 150);
    A.stars(f, left, 4, 50);
    const lw = P.poly([0, 120, 159, 120, 150, 200, 0, 200]);
    S.grad(f, lw, C.grey, (x, y) => 0.92 - (y - 120) / 400);
    BOW.forEach((r, i) => S.BG.lineIn(f, lw, 0, 150 + i, 160, 150 + i, r[3]));
    S.grad(f, right, C.plum, (x, y) => 0.3 + y / 380);
    right.each((x, y) => { if ((x + y * 2) % 23 === 0) f.set(x, y, S.DARKER[f.px[y * W + x]]); });
    P.part(P.rect(292, 20, 2, 120), C.oak, { b: 3, sh: 0 });
    P.part(P.poly([268, 22, 292, 21, 292, 40, 268, 39]), C.grey, { b: 5 });
    P.part(P.rect(268, 22.4, 6, 17), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.rect(286, 21.6, 6, 18), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
    A.leaf(P, 280, 31, 0.9);
    const abe = S.sprite('abehead6', { dir: 'e', talk: talking(g, 'lincoln'), act: cu.mood === 'angry' ? 'sad' : '', v: 'tal' }, 1.15);
    blit(f, abe.buf, 78 - abe.ox, 182 - abe.oy);
    P.part(P.cap(120, 74, 122, 94, 2.6), C.blue, { b: 2 });
    P.curve('M 122 96 Q 136 130 126 200', C.blue[1]);
    const act = cu.mood === 'swoon' ? 'swoon' : cu.mood === 'angry' ? 'shock' : cu.mood === 'wait' ? '' : 'phone';
    const syb = S.sprite('sybil6', { dir: 'w', act, talk: talking(g, 'sybil') }, 1.25);
    blit(f, syb.buf, 236 - syb.ox, 198 - syb.oy);
    for (let y = 0; y < H; y++) { const x = Math.round(170 - y * 0.1 + ((y >> 3) % 2 ? 3 : -3)); f.set(x, y, C.eye); f.set(x + 1, y, C.eye); f.set(x - 1, y, C.black); f.set(x + 2, y, C.black); }
    if (cu.mood === 'swoon') for (let i = 0; i < 5; i++) { const hx = 200 + i * 22, hy = 56 - ((g.time * 20 + i * 17) % 50); blit(f, once('heart', () => S.scaleBuf(S.icon('heart'), 0.5)), Math.round(hx), Math.round(hy)); }
  };

  CLOSEUPS.beam6 = function (f, g, cu) {
    const t = g.time - cu.t0;
    space(f, 31, 130);
    const P = new Pen(f);
    const on = t > (cu.delay || 0);
    const k = Math.floor(g.time * 6) % 8;
    A.earth(P, 214, 74, 50, { bliss: on && !cu.max, ring: on, k, max: on && !!cu.max });
    moonGround(f, P, 'M 0 160 Q 90 148 170 158 Q 250 166 320 154 L 320 200 L 0 200 Z', 8);
    P.part(P.rect(44, 118, 4, 44), C.grey, { b: 2, sh: 0 });
    P.part(P.rect(54, 118, 4, 44), C.grey, { b: 1, sh: 0 });
    for (let y = 122; y < 158; y += 10) { P.line(46, y, 55, y + 9, C.grey[3]); P.line(55, y, 46, y + 9, C.grey[2]); }
    P.part(P.ell(52, 112, 13, 8, -0.5), C.grey, { b: 4 });
    P.part(P.ell(55, 110, 8, 4.4, -0.5), C.grey, { b: 5, sh: 0, hi: 0, ol: C.grey[3] });
    if (on) A.beam(f, 66, 104, 174, 86, g.time, cu.max ? 3 : 4);
    if (on && cu.max) for (let i = 0; i < 12; i++) { const a = i * 0.524 + g.time; P.line(214 + Math.cos(a) * 54, 74 + Math.sin(a) * 54, 214 + Math.cos(a) * 62, 74 + Math.sin(a) * 62, C.eye); }
  };

  function maxEars(P, x, y, s) {
    const Q = P.scaled(x, y, s);
    const Wt = C.maxw;
    Q.part(Q.path(`M ${x - 7} ${y} Q ${x - 13} ${y - 11} ${x - 10.5} ${y - 22} Q ${x - 7} ${y - 25} ${x - 5} ${y - 19} Q ${x - 4} ${y - 10} ${x - 2.5} ${y - 2} Z`), Wt, { b: 3, sh: 1 });
    Q.part(Q.path(`M ${x + 7} ${y} Q ${x + 13} ${y - 11} ${x + 10.5} ${y - 22} Q ${x + 7} ${y - 25} ${x + 5} ${y - 19} Q ${x + 4} ${y - 10} ${x + 2.5} ${y - 2} Z`), Wt, { b: 3, sh: 1 });
  }

  CLOSEUPS.world6 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const max = cu.who === 'max';
    FULL.each((x, y) => {
      const a = Math.atan2(y - 96, x - 160);
      const k = (Math.floor(a / (Math.PI * 2) * 18 + t * (max ? 4 : 1) + 36) % 2);
      f.px[y * W + x] = max ? (k ? C.orange[2] : C.orange[3]) : (k ? C.sky[2] : C.sky[3]);
    });
    const P = new Pen(f);
    const faces = cu.faces || ['f:momma6', 'f:queen6', 'f:leonard6'];
    const n = faces.length;
    faces.forEach((id, i) => {
      const cx = Math.round(W * (i + 1) / (n + 1));
      const ic = once('face' + id, () => S.scaleBuf(S.icon(id), 3));
      const hop = max ? Math.round(Math.abs(Math.sin(t * 6 + i)) * 6) : Math.round(Math.sin(t * 1.4 + i) * 2);
      const y0 = 74 - hop;
      blit(f, ic, cx - 36, y0);
      if (max) {
        maxEars(P, cx, y0 + 8, 1.5);
        S.art.maxMouthFront(P.scaled(cx, y0 + 46, 1.3), cx, y0 + 46, true);
      } else A.halo(P, cx, y0 - 2, 22, Math.floor(g.time * 3 + i) % 3);
    });
    S.rectFill(f, 0, 150, W, 50, C.night[0]);
    for (let x = 0; x < W; x++) f.set(x, 150, max ? C.orange[4] : C.sky[4]);
  };

  const TITLE_ITEMS = ['Новая игра', 'Продолжить', 'Загрузить', 'Настройки', 'Выход'];

  E.TITLE = {
    items: TITLE_ITEMS,
    draw(f, t, hover, enabled) {
      space(f, 17, 130);
      const P = new Pen(f);
      A.earth(P, 250, 70, 34, { bliss: true, ring: true, k: Math.floor(t * 6) % 8 });
      moonGround(f, P, 'M 0 164 Q 80 152 170 160 Q 250 168 320 156 L 320 200 L 0 200 Z', 3);
      const hugh = S.sprite('hugh6', { dir: 's', act: Math.floor(t / 3) % 2 ? 'magic' : '', t, talk: 0 }, 0.9);
      blit(f, hugh.buf, 250 - hugh.ox, 112 - hugh.oy);
      const sam = S.sprite('sam', { dir: 'w', talk: Math.floor(t * 0.5) % 4 === 1 && Math.floor(t * 8) % 2 === 0 ? 1 : 0, blink: Math.floor(t * 2) % 9 === 0 }, 1.4);
      const max = S.sprite('max', { dir: 'w', act: 'grin', walk: -1 }, 1.4);
      blit(f, sam.buf, 276 - sam.ox, 196 - sam.oy);
      blit(f, max.buf, 214 - max.ox, 196 - max.oy - (Math.floor(t * 2.5) % 2 ? 3 : 0));
      S.bigText(f, 'SAM & MAX', 100, 6, 3, C.orange[3], C.yellow[4], 2);
      S.bigText(f, 'СВЕТЛАЯ СТОРОНА', 100, 32, 2, C.pink[3], C.pink[4], 1);
      S.bigText(f, 'ЛУНЫ', 100, 50, 2, C.pink[3], C.pink[4], 1);
      font.drawCentered(f, 'ЭПИЗОД 106', 100, 70, C.sky[4]);
      TITLE_ITEMS.forEach((s, i) => {
        const on = enabled[i];
        const col = !on ? C.grey[2] : hover === i ? C.yellow[4] : C.grey[5];
        font.draw(f, (hover === i && on ? '» ' : '  ') + s, 30, 86 + i * 14, col);
      });
      font.draw(f, '(c) 2000 LucasArts. Win 98 Edition', 4, 190, C.grey[2]);
    },
    hit(x, y) {
      for (let i = 0; i < TITLE_ITEMS.length; i++) if (x >= 26 && x < 150 && y >= 84 + i * 14 && y < 96 + i * 14) return i;
      return -1;
    }
  };

  E.CREDITS = [
    ['SAM & MAX', 3], ['СВЕТЛАЯ СТОРОНА ЛУНЫ', 2], ['', 1],
    ['По комиксам Стива Пёрселла', 1], ['', 1],
    ['Сэм, собака в костюме', 1], ['Макс, президент в трёх цветах', 1], ['', 1],
    ['В ролях', 2], ['Хью Блисс, колония бактерий', 1], ['Агент Суперболл на дверях', 1], ['Гарри Кротман за прилавком', 1], ['Голова Линкольна в роли влюблённого', 1], ['Королева Сибил в роли Канады', 1], ['Мамаша Боско в роли Боско', 1], ['Курт 286, Боб Белл,', 1], ['Бластер-Бахвал и Чиппи в роли К.О.П.С.', 1], ['Фило Пенниуорт со шляпой', 1], ['Джимми Два Зуба в шляпе', 1], ['Сержант Жучок на подушке', 1], ['Леонард Стейкчармер в шкафу', 1], ['', 1],
    ['Графика', 2], ['320 на 200 точек, 256 цветов', 1], ['Хью хватило бы семи', 1], ['', 1],
    ['Музыка', 2], ['Оркестр лунного модуля', 1], ['', 1],
    ['При съёмках не пострадала', 1], ['ни одна бактерия.', 1], ['Их прокипятили позже.', 1], ['', 1],
    ['Шесть дел закрыто.', 1], ['Шкаф полон.', 1], ['', 1],
    ['КОНЕЦ СЕЗОНА', 2], ['Спасибо, что играли.', 1]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
