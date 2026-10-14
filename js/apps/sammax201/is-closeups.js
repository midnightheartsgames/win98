(function (S) {
  'use strict';
  const { W, H, C, Pen, Buf, blit, font } = S;
  const E = S.EP201;
  const CLOSEUPS = S.CLOSEUPS;
  const { tvFrame, scanlines, screenMask } = S.tvArt;
  const A = S.art201;
  const screenBuf = new Buf(W, H);
  const cache = new Map();

  function once(key, fn) {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  }

  function snowSky(f, seed, t) {
    S.BG.nightSky(f, W, H);
    for (let i = 0; i < 70; i++) {
      const x = Math.floor((S.hash(i, seed, 1) * W + Math.sin(t + i) * 6 + W) % W);
      const y = Math.floor((S.hash(i, seed, 2) * H + t * (16 + (i % 5) * 7)) % H);
      f.set(x, y, i % 3 ? C.grey[5] : C.glow);
    }
  }

  function spr(f, id, pose, s, x, y) {
    const sp = S.sprite(id, pose, s);
    if (sp) blit(f, sp.buf, Math.round(x - sp.ox), Math.round(y - sp.oy));
  }

  function cityLine(f, P, y0, seed) {
    for (let x = 0, k = 0; x < W; k++) {
      const bw = 14 + Math.floor(S.hash(k, seed, 1) * 22), bh = 20 + Math.floor(S.hash(k, seed, 2) * 50);
      P.part(P.rect(x, y0 - bh, bw, bh + 80), C.night, { b: 1, sh: 0, hi: 0, ol: 0 });
      for (let wy = y0 - bh + 4; wy < y0 - 2; wy += 6) for (let wx = x + 3; wx < x + bw - 2; wx += 5) if (S.hash(wx, wy, seed) > 0.55) f.set(wx, wy, C.lamp);
      S.BG.snowCap(f, x, x + bw, y0 - bh);
      x += bw + 1;
    }
  }

  CLOSEUPS.titlecard21 = function (f, g, cu) {
    const t = g.time - cu.t0;
    snowSky(f, 7, t);
    const P = new Pen(f);
    cityLine(f, P, 150, 4);
    S.BG.snowGround(f, W, 150);
    A.robot(new Pen(f).at(250, 196, 0.62), 0, 0, { body: 'front', head: 'face', k: Math.floor(t * 3), eye: true });
    spr(f, 'sam', { dir: 's' }, 1.4, 112, 196);
    spr(f, 'max', { dir: 's', act: 'grin' }, 1.4, 66, 196 - (Math.floor(t * 2.5) % 2 ? 3 : 0));
    S.bigText(f, 'SAM & MAX', 160, 8, 4, C.orange[3], C.yellow[4], 2);
    if (t > 1) S.bigText(f, cu.lines[1] || '', 160, 46, 2, C.sky[3], C.sky[4], 1);
    if (t > 1.8) S.bigText(f, cu.lines[2] || '', 160, 66, 2, C.red[3], C.pink[4], 1);
  };

  CLOSEUPS.fly21 = function (f, g, cu) {
    const t = g.time - cu.t0;
    snowSky(f, 21, t * 3);
    const P = new Pen(f);
    const k = Math.min(1, t / 6);
    if (cu.north) {
      S.BG.snowGround(f, W, 176 - Math.round(k * 20));
      A.pole(P, 270, 176 - Math.round(k * 20), 40 + k * 30);
    } else cityLine(f, P, 196 - Math.round(k * 40), 9);
    const car = once('desoto', () => S.LAYERS.street.desoto());
    const cx = 94 + Math.round(Math.sin(t * 1.3) * 5), cy = 70 + Math.round(Math.sin(t * 2.1) * 3);
    const flip = !cu.north;
    const seat = x => (flip ? 134 - x : x);
    spr(f, 'sam', { dir: flip ? 'e' : 'w' }, 0.6, cx + seat(80), cy + 30);
    spr(f, 'max', { dir: flip ? 'e' : 'w', act: 'grin' }, 0.6, cx + seat(62), cy + 27);
    blit(f, car, cx, cy, flip);
    for (let i = 0; i < 9; i++) {
      const fx = cx + seat(136 + ((i * 7 + Math.floor(t * 30)) % 22)), fy = cy + 24 + ((i * 5) % 9);
      f.set(fx, fy, i % 3 ? C.lamp : C.orange[3]);
    }
  };

  const PROGS = {
    news(f, t, g) {
      S.grad(f, screenMask(), C.blue, (x, y) => 0.2 + (y - 20) / 200);
      const P = new Pen(f);
      P.part(P.rect(130, 34, 96, 70), C.night, { b: 1 });
      if (g.f.robotDown) A.wreck(new Pen(f).at(178, 100, 0.28), 0, 0, { ring: true });
      else A.robot(new Pen(f).at(178, 102, 0.34), 0, 0, { body: 'front', head: 'face', k: Math.floor(t * 3), eye: true });
      P.part(P.rect(66, 40, 54, 70), C.navy, { b: 2 });
      P.part(P.ell(93, 58, 9, 10), C.skin, { b: 3 });
      P.part(P.rect(80, 70, 26, 30), C.grey, { b: 2 });
      if (Math.floor(t * 8) % 3) P.part(P.ell(93, 63, 2.4, 1.4), C.red, { b: 1, sh: 0, hi: 0 });
      font.drawCentered(f, 'НОВОСТИ', 144, 118, C.lamp);
    },
    poppers(f, t) {
      S.grad(f, screenMask(), C.pink, (x, y) => 0.3 + (y - 20) / 180);
      const P = new Pen(f);
      P.part(P.rect(54, 108, 182, 34), C.red, { b: 2 });
      ['specs', 'whizzer', 'peepers'].forEach((id, i) => spr(f, id, { dir: 's', act: Math.floor(t * 2 + i) % 2 ? 'dance' : 'sing', t }, 0.9, 92 + i * 52, 130));
      font.drawCentered(f, 'СОДА-ПОПЕРЫ', 144, 26, C.lamp);
      font.drawCentered(f, 'ПОВТОР', 144, 36, C.grey[5]);
    },
    stinky(f, t) {
      S.grad(f, screenMask(), C.mint, (x, y) => 0.5 + (y - 20) / 200);
      spr(f, 'stinky21', { dir: 's', act: Math.floor(t * 1.5) % 2 ? 'point' : 'host', talk: Math.floor(t * 8) % 3 ? 1 : 0 }, 1.2, 144, 144);
      font.drawCentered(f, 'У СТИНКИ', 144, 26, C.neonA);
    },
    news2(f, t, g) { PROGS.news(f, t, g); },
    rerun(f, t) {
      S.grad(f, screenMask(), C.sky, (x, y) => 0.3 + (y - 20) / 160);
      A.parcel(new Pen(f), 144, 110, 3, t * 4);
      font.drawCentered(f, 'БОСКО-ТЕХ', 144, 30, C.green[1]);
    }
  };

  CLOSEUPS.tv21 = function (f, g, cu) {
    const t = g.time - cu.t0;
    tvFrame(f);
    screenBuf.px.fill(0);
    (PROGS[cu.prog] || PROGS.rerun)(screenBuf, t, g);
    for (let y = 20; y < 142; y++) for (let x = 52; x < 236; x++) {
      const c = screenBuf.px[y * W + x];
      if (c) f.px[y * W + x] = c;
    }
    scanlines(f);
  };

  CLOSEUPS.song21 = function (f, g) {
    const t = g.time;
    const P = new Pen(f);
    S.grad(f, P.rect(0, 0, W, H), C.plum, (x, y) => 0.15 + y / 320 + (S.hash(x >> 3, y >> 3, 2) - 0.5) * 0.1);
    for (let i = 0; i < 12; i++) {
      const a = t * 0.6 + i * Math.PI / 6;
      S.line(f, 160, 92, 160 + Math.cos(a) * 200, 92 + Math.sin(a) * 200, i % 2 ? C.plum[1] : C.purple[1]);
    }
    P.part(P.ell(160, 120, 92, 22), C.wood, { b: 2 });
    const disc = P.ell(160, 112, 76, 18);
    P.part(disc, C.night, { b: 1, sh: 0 });
    for (let r = 20; r < 74; r += 8) S.outline(f, P.ell(160, 112, r, r * 0.24), C.night[2]);
    P.part(P.ell(160, 112, 14, 4), C.red, { b: 3, sh: 0 });
    const k = Math.floor(t * 8) % 8;
    P.px(160 + Math.cos(k * Math.PI / 4) * 10, 112 + Math.sin(k * Math.PI / 4) * 2.4, C.gold[4]);
    P.part(P.cap(250, 70, 214, 108, 2), C.gold, { b: 3, sh: 0 });
    P.part(P.path('M 250 70 Q 270 30 300 16 Q 312 40 280 64 Z'), C.gold, { b: 3 });
    const st = g.vt.song ? g.vt.song.stage : 0;
    for (let i = 0; i < 4; i++) A.horse(P, 40 + i * 26, 190, E.HORSES[i], 1);
    font.draw(f, 'КУПЛЕТ ' + Math.min(4, st + 1) + ' ИЗ 4', 8, 6, C.lamp);
    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 22, y = 40 + Math.sin(t * 3 + i) * 6;
      P.part(P.ell(x, y + 6, 2.4, 1.8, -0.4), C.pink, { b: 4, sh: 0 });
      P.line(x + 2, y + 6, x + 2, y - 2, C.pink[4]);
      if (i % 2) P.line(x + 2, y - 2, x + 5, y, C.pink[4]);
    }
  };

  CLOSEUPS.future21 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const P = new Pen(f);
    S.grad(f, P.rect(0, 0, W, 120), C.red, (x, y) => 0.1 + y / 160);
    for (let y = 120; y < H; y++) for (let x = 0; x < W; x++) {
      const v = Math.sin(x / 9 + t * 2 + y / 5) + Math.sin(y / 4 - t * 3);
      f.set(x, y, v > 1.1 ? C.lamp : v > 0.2 ? C.orange[4] : v > -0.6 ? C.orange[3] : C.red[3]);
    }
    for (const [cx, r] of [[60, 50], [250, 70]]) P.part(P.path(`M ${cx - r} 120 L ${cx - r / 3} ${120 - r * 0.8} L ${cx + r / 4} ${120 - r * 0.5} L ${cx + r} 120 Z`), C.stone, { b: 1 });
    P.part(P.path('M 120 150 Q 150 132 196 140 Q 210 156 190 162 Q 150 168 124 160 Z'), C.stone, { b: 2 });
    const st = cu.stage || 0;
    if (st === 0) {
      spr(f, 'fsam21', { dir: 'w', talk: g.speech.some(s => s.who === 'fsam') && Math.floor(g.time * 9) % 3 ? 1 : 0 }, 0.9, 172, 152);
      spr(f, 'fmax21', { dir: 'w', talk: g.speech.some(s => s.who === 'fmax') && Math.floor(g.time * 9) % 3 ? 1 : 0 }, 0.9, 148, 152);
      const k = Math.min(1, t / 2.5);
      A.sleigh(new Pen(f).at(-40 + k * 110, 100, 0.8), 0, 0, { lit: true, k: Math.floor(t * 8) });
      spr(f, 'sam', { dir: 'e' }, 0.5, -60 + k * 110, 86);
      spr(f, 'max', { dir: 'e', act: 'grin' }, 0.5, -76 + k * 110, 84);
    } else {
      const k = Math.min(1, (g.time - (cu.t1 || (cu.t1 = g.time))) / 3);
      const x = 70 + k * 300;
      A.sleigh(new Pen(f).at(x, 100 - k * 40, 0.8), 0, 0, { lit: true, k: Math.floor(t * 8) });
      for (const [id, dx, s] of [['sam', -10, 0.5], ['max', -26, 0.5], ['fsam21', 6, 0.45], ['fmax21', -40, 0.45]]) spr(f, id, { dir: 'e' }, s, x + dx, 86 - k * 40);
    }
    font.drawCentered(f, 'РОЖДЕСТВО. ЧЕРЕЗ ДВАДЦАТЬ ЛЕТ', W / 2, 6, C.lamp);
  };

  CLOSEUPS.deliver21 = function (f, g, cu) {
    const t = g.time - cu.t0;
    snowSky(f, 33, t * 2);
    const P = new Pen(f);
    cityLine(f, P, 170, 12);
    const x = 360 - (t * 40) % 480;
    A.sleigh(new Pen(f).at(x, 80 + Math.sin(t * 2) * 6, 0.8), 0, 0, { lit: true, k: Math.floor(t * 8) });
    spr(f, 'sam', { dir: 'w' }, 0.45, x + 8, 68 + Math.sin(t * 2) * 6);
    spr(f, 'max', { dir: 'w', act: 'grin' }, 0.45, x - 4, 66 + Math.sin(t * 2) * 6);
    spr(f, 'elf21', { v: 'green', dir: 'w' }, 0.6, x + 20, 70 + Math.sin(t * 2) * 6);
    ['specs', 'whizzer', 'peepers'].forEach((id, i) => spr(f, id, { dir: 'w' }, 0.4, x + 30 + i * 9, 70 + Math.sin(t * 2) * 6));
    for (let i = 0; i < 6; i++) {
      const gx = x + 20 + i * 18, gy = 96 + ((t * 60 + i * 23) % 80);
      P.part(P.rect(gx - 3, gy - 3, 6, 6), [C.red, C.gold, C.blue][i % 3], { b: 3 });
    }
    S.BG.snowGround(f, W, 190);
  };

  const TITLE_ITEMS = ['Новая игра', 'Продолжить', 'Загрузить', 'Настройки', 'Выход'];
  E.TITLE = {
    items: TITLE_ITEMS,
    draw(f, t, hover, enabled) {
      snowSky(f, 17, t);
      const P = new Pen(f);
      S.BG.snowGround(f, W, 160);
      A.pole(P, 280, 164, 70);
      spr(f, 'santa21', { dir: 'w', act: Math.floor(t / 2) % 2 ? 'shoot' : '', t, v: 'evil' }, 1, 252, 166);
      spr(f, 'sam', { dir: 'w', blink: Math.floor(t * 2) % 9 === 0 }, 1.3, 210, 196);
      spr(f, 'max', { dir: 'w', act: 'grin' }, 1.3, 170, 196 - (Math.floor(t * 2.5) % 2 ? 3 : 0));
      S.bigText(f, 'SAM & MAX', 100, 6, 3, C.orange[3], C.yellow[4], 2);
      S.bigText(f, 'ПОЛЯРНАЯ', 100, 32, 2, C.sky[3], C.sky[4], 1);
      S.bigText(f, 'СТАНЦИЯ САНТА', 100, 50, 2, C.red[3], C.pink[4], 1);
      font.drawCentered(f, 'ЭПИЗОД 201', 100, 70, C.grey[5]);
      TITLE_ITEMS.forEach((s, i) => {
        const on = enabled[i];
        const col = !on ? C.grey[2] : hover === i ? C.yellow[4] : C.grey[5];
        font.draw(f, (hover === i && on ? '» ' : '  ') + s, 30, 86 + i * 14, col);
      });
      font.draw(f, '(c) 2000 LucasArts. Win 98 Edition', 4, 190, C.grey[3]);
    },
    hit(x, y) {
      for (let i = 0; i < TITLE_ITEMS.length; i++) if (x >= 26 && x < 150 && y >= 84 + i * 14 && y < 96 + i * 14) return i;
      return -1;
    }
  };

  E.CREDITS = [
    ['SAM & MAX', 3], ['ПОЛЯРНАЯ СТАНЦИЯ САНТА', 2], ['', 1],
    ['По комиксам Стива Пёрселла', 1], ['', 1],
    ['Сэм, собака в костюме', 1], ['Макс, гиперактивный кролик-нечто', 1], ['', 1],
    ['Дизайн и сценарий', 2], ['Отдел вольной полиции', 1], ['', 1],
    ['Графика', 2], ['320 на 200 точек, 256 цветов', 1], ['и немного снега', 1], ['', 1],
    ['Музыка', 2], ['Джаз-банд «Де Сото»', 1], ['и пластинка из шкафа Санты', 1], ['', 1],
    ['Особая благодарность', 2], ['Маймтрону 9000 за офис', 1], ['Зелёному эльфу за слёзы', 1], ['Стинки за носок', 1], ['Сержанту Жучку за строй', 1], ['Педро за песню', 1], ['', 1],
    ['Мистер Лопатка', 2], ['любимая рыбка, вице-кулер', 1], ['', 1],
    ['Ни один эльф не пострадал.', 1], ['Один демон стал холодцом.', 1], ['', 1],
    ['КОНЕЦ ЭПИЗОДА 201', 2], ['Продолжение следует...', 1]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
