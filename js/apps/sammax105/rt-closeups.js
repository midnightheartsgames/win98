(function (S) {
  'use strict';
  const { W, H, C, Pen, Buf, blit, font } = S;
  const E = S.EP105;
  const CLOSEUPS = S.CLOSEUPS;
  const { tvFrame, scanlines, screenMask, SCREEN } = S.tvArt;
  const A = S.art105;
  const BG = S.BG;
  const { GLOW, LAMP, NEON_G, NEON_R } = A;
  const screenBuf = new Buf(W, H);
  const SKY = [C.night[0], C.night[1], C.purple[1], C.purple[2], C.pink[2]];

  function synth(f, t, horizon, speed) {
    const m = new S.Mask(0, 0, W, horizon); m.m.fill(1);
    S.grad(f, m, SKY, (x, y) => y / horizon);
    for (let i = 0; i < 50; i++) f.set(Math.floor(S.hash(i, 8, 1) * W), Math.floor(S.hash(i, 8, 2) * horizon * 0.7), S.hash(i, 8, 3) > 0.5 ? C.lamp : C.tvA);
    for (let y = horizon; y < H; y++) f.px.fill(C.night[0], y * W, y * W + W);
    BG.netGrid(f, horizon, H - 1, 160, C.pink[2], 44, (t * (speed === undefined ? 2 : speed)) % 1);
    for (let x = 0; x < W; x++) f.set(x, horizon, C.tvA);
  }

  function heroes(f, t, sx, mx, y, s) {
    const hop = Math.floor(t * 3) % 2 ? 2 : 0;
    const sam = S.sprite('sam', { dir: 's' }, s);
    const max = S.sprite('max', { dir: 's', act: 'grin' }, s);
    blit(f, sam.buf, sx - sam.ox, y - sam.oy);
    blit(f, max.buf, mx - max.ox, y - max.oy - hop);
    A.visor(new Pen(f).at(sx, y, s), 0, -55.4, 7.4);
    A.visor(new Pen(f).at(mx, y - hop, s), 0, -26.6, 7);
  }

  CLOSEUPS.titlecard5 = function (f, g, cu) {
    const t = g.time - cu.t0;
    synth(f, t, 120);
    const P = new Pen(f);
    P.part(P.ell(160, 120, 40, 40), LAMP, { sh: 0, hi: 0, ol: 0 }).each((x, y) => { if (y >= 120 || Math.floor((y - 80) / 4) % 2) f.set(x, y, y >= 120 ? C.night[0] : C.pink[3]); });
    BG.netGrid(f, 120, H - 1, 160, C.pink[2], 44, (t * 2) % 1);
    heroes(f, t, 212, 108, 198, 1.5);
    S.bigText(f, 'SAM & MAX', 160, 8, 4, C.orange[3], C.yellow[4], 2);
    if (t > 1) S.bigText(f, cu.lines[1] || '', 160, 46, 2, C.sky[3], C.sky[4], 1);
    if (t > 1.8) S.bigText(f, cu.lines[2] || '', 160, 66, 3, C.pink[3], C.pink[4], 2);
  };

  const PROGS = {
    crisis(f, t) {
      S.grad(f, screenMask(), C.blue, (x, y) => 0.2 + (y - 20) / 200);
      const P = new Pen(f);
      P.part(P.rect(140, 38, 86, 58), C.sky, { b: 3 });
      P.part(P.rect(152, 46, 30, 46), C.grey, { b: 3 });
      P.part(P.rect(156, 50, 22, 12), GLOW, { b: 3, sh: 0, hi: 0 });
      P.part(P.rect(158, 68, 18, 3), C.night, { b: 0, sh: 0, hi: 0 });
      for (let i = 0; i < 6; i++) A.coin(P, 186 + ((i * 7 + t * 34) % 34), 60 + ((i * 11 + t * 40) % 30), 3, Math.floor(t * 8 + i) % 4);
      P.part(P.rect(52, 112, 184, 30), C.wood, { b: 2 });
      const a = new Pen(f).at(96, 112, 1.6);
      a.part(a.ell(0, -22, 8, 9), C.night, { b: 2 });
      a.part(a.rect(-14, -8, 28, 14), C.grey, { b: 3 });
      a.part(a.poly([-2, -8, 2, -8, 0, -1]), C.red, { b: 3, sh: 0, hi: 0 });
      a.part(a.ell(0, -20, 6, 7), C.skin, { b: 3 });
      A.visor(a, 0, -21, 6.2);
      if (Math.floor(t * 8) % 3) a.part(a.ell(0, -15.6, 2, 1.2), C.red, { b: 1, sh: 0, hi: 0 });
      font.draw(f, 'НОВОСТИ 13', 56, 24, C.yellow[4]);
      font.draw(f, 'СБОЙ', 172, 98, C.grey[5]);
    },
    ad20(f, t) {
      const m = screenMask();
      S.grad(f, m, SKY, (x, y) => (y - 20) / 130);
      const b = new Buf(W, H);
      BG.netGrid(b, 96, 141, 144, C.pink[2], 30, (t * 2) % 1);
      m.each((x, y) => { const c = b.px[y * W + x]; if (c) f.set(x, y, c); });
      const sp = S.sprite('internet', { t, talk: Math.floor(t * 8) % 3 ? 1 : 0 }, 1.1);
      blit(f, sp.buf, 144 - sp.ox, 112 - sp.oy);
      font.drawCentered(f, 'РЕАЛЬНОСТЬ 2.0', 144, 24, C.lamp);
      if (Math.floor(t * 3) % 2) font.drawCentered(f, 'ЛУЧШЕ НАСТОЯЩЕЙ', 144, 128, C.neonB);
    },
    bank(f, t) {
      S.grad(f, screenMask(), C.green, (x, y) => 0.25 + (y - 20) / 240);
      const P = new Pen(f);
      P.part(P.rect(110, 44, 68, 80), C.grey, { b: 5 });
      P.part(P.rect(114, 48, 60, 12), C.grey, { b: 3 });
      for (let i = 0; i < 3; i++) P.part(P.ell(122 + i * 9, 54, 2.4, 2.4), [C.red, C.gold, C.sky][i], { b: 3, sh: 0 });
      P.part(P.ell(144, 92, 24, 24), C.grey, { b: 2 });
      P.part(P.ell(144, 92, 19, 19), C.sky, { b: 2, sh: 0, hi: 0 });
      for (let i = 0; i < 5; i++) {
        const a = t * 5 + i * 1.256;
        const x = 144 + Math.cos(a) * 11, y = 92 + Math.sin(a) * 11;
        P.part(P.rect(x - 4, y - 2.4, 8, 4.8), C.slime, { b: 3, sh: 0 });
        f.set(Math.round(x), Math.round(y), C.green[1]);
      }
      font.drawCentered(f, 'БАНКО ЛАВАДЕРО', 144, 24, C.lamp);
      font.drawCentered(f, 'СТИРАЕМ ДО БЕЛИЗНЫ', 144, 130, C.grey[5]);
    },
    auntie(f, t) {
      S.grad(f, screenMask(), C.pink, (x, y) => 0.3 + (y - 20) / 260);
      const swing = Math.floor(t * 2) % 2;
      const sp = S.sprite('auntie', { dir: 'e', act: swing ? 'swing' : '', t }, 1.05);
      blit(f, sp.buf, 110 - sp.ox, 142 - sp.oy);
      const P = new Pen(f);
      const Q = P.scaled(190, 120, 2.4);
      A.pixBug(Q, 190, 122 + (swing ? 6 : 0));
      if (swing) for (let i = 0; i < 3; i++) P.line(176 + i * 8, 96, 180 + i * 8, 104, C.lamp);
      font.drawCentered(f, 'ТЁТУШКА БИОТИК', 144, 24, C.lamp);
      font.drawCentered(f, 'ПОЧТА ПОД ЗАМКОМ', 144, 130, C.grey[5]);
    },
    rerun(f, t) {
      PROGS.ad20(f, t);
      font.draw(f, 'ПОВТОР', 58, 36, C.grey[5]);
    }
  };

  CLOSEUPS.tv5 = function (f, g, cu) {
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

  const FOES = {
    slime: { name: 'ГРОЗНАЯ СИНЯЯ СЛИЗЬ', power: 2, costume: 'slime5', scale: 2.6, x: 92, y: 146 },
    auntie: { name: 'ТЁТУШКА БИОТИК', power: 9, costume: 'auntie', scale: 1.02, x: 84, y: 156 }
  };
  E.FOES = FOES;

  CLOSEUPS.battle5 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const foe = FOES[cu.foe];
    const all = new S.Mask(0, 0, W, H); all.m.fill(1);
    S.grad(f, all, cu.foe === 'slime' ? [C.night[0], C.night[1], C.slime[0], C.slime[1]] : [C.night[0], C.night[1], C.plum[1], C.plum[2]], (x, y) => y / 150);
    for (let y = 112; y < H; y++) f.px.fill(C.night[0], y * W, y * W + W);
    BG.netGrid(f, 112, H - 1, 160, cu.foe === 'slime' ? C.slime[2] : C.pink[2], 40, 0);
    for (let x = 0; x < W; x++) f.set(x, 112, C.tvA);
    const P = new Pen(f);
    S.panel(f, 4, 4, 152, 28, C.navy.concat([C.suit[3]]));
    font.draw(f, foe.name, 10, 8, C.yellow[4]);
    font.draw(f, 'СИЛА ' + foe.power + (cu.foe === 'auntie' ? '  БРОНЯ +1' : ''), 10, 19, C.grey[5]);
    S.panel(f, 164, 4, 152, 28, C.navy.concat([C.suit[3]]));
    font.draw(f, 'СЭМ И МАКС', 170, 8, C.yellow[4]);
    font.draw(f, 'СИЛА 3  УРОВЕНЬ 1', 170, 19, C.grey[5]);
    const fxT = cu.fx ? g.time - cu.fx.t0 : 9;
    const fx = cu.fx && fxT < (cu.fx.dur || 0.6) ? cu.fx.kind : '';
    if (!cu.foeGone) {
      const hitJ = fx === 'slash' || fx === 'ray' || fx === 'punch' ? Math.round(Math.sin(fxT * 50) * 3) : 0;
      const sp = S.sprite(foe.costume, { dir: 'e', act: cu.foeAct || '', t: g.time, talk: g.speech.some(s => s.who === cu.foe) && Math.floor(g.time * 9) % 3 ? 1 : 0, v: cu.foeV || '' }, foe.scale);
      blit(f, sp.buf, foe.x + hitJ - sp.ox, foe.y - sp.oy);
    }
    const samAct = cu.samAct || '';
    const sam = S.sprite('sam', { dir: samAct === 'ko' ? 'e' : 'w', act: samAct, t: g.time, talk: g.speech.some(s => s.who === 'sam') && Math.floor(g.time * 9) % 3 ? 1 : 0 }, 1.25);
    const max = S.sprite('max', { dir: 'w', act: fx === 'punch' ? 'punch' : '', talk: g.speech.some(s => s.who === 'max') && Math.floor(g.time * 9) % 3 ? 1 : 0 }, 1.25);
    blit(f, max.buf, 276 - max.ox, 160 - max.oy);
    blit(f, sam.buf, 232 - sam.ox, 156 - sam.oy);
    if (fx === 'slash') {
      for (let i = 0; i < 3; i++) P.curve(`M ${foe.x - 26 + i * 8} ${foe.y - 70 + i * 6} Q ${foe.x + 10} ${foe.y - 40} ${foe.x + 30 - i * 6} ${foe.y - 4 - i * 4}`, fxT < 0.2 ? C.lamp : C.grey[5]);
    } else if (fx === 'ray') {
      for (let k = 0; k < 3; k++) S.line(f, 206, 110 + k, foe.x + 10, foe.y - 30 + k, k === 1 ? C.lamp : C.tvA);
    } else if (fx === 'pan') {
      const k = Math.min(1, fxT / 0.3);
      A.pan(P, 120 + k * 80, 84 + k * 20, 0.4);
      if (k >= 1) for (let i = 0; i < 5; i++) { const a = i * 1.256; P.line(226 + Math.cos(a) * 8, 96 + Math.sin(a) * 8, 226 + Math.cos(a) * 16, 96 + Math.sin(a) * 16, C.lamp); }
    } else if (fx === 'punch') {
      for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4; P.line(foe.x + 20 + Math.cos(a) * 6, foe.y - 30 + Math.sin(a) * 6, foe.x + 20 + Math.cos(a) * 14, foe.y - 30 + Math.sin(a) * 14, C.yellow[4]); }
    }
    if (cu.shield) {
      const n = Math.min(9, Math.floor((g.time - cu.shield) * 24));
      for (let i = 0; i < n; i++) A.popup(P, 150 + (i % 3) * 10 + ((i * 7) % 5), 48 + Math.floor(i / 3) * 30 + (i % 2) * 6, 30, 26, i);
    }
    if (cu.loot && g.time - cu.loot < 1.6) {
      const k = g.time - cu.loot;
      font.drawCentered(f, cu.lootText || '', foe.x, Math.round(foe.y - 50 - k * 14), C.lamp);
    }
  };

  function carSprite(cols, plate, flip) {
    const raw = new Buf(140, 46);
    A.netCar(new Pen(raw), raw, 4, 3, cols, '');
    const out = new Buf(140, 46);
    blit(out, raw, 0, 0, flip);
    const px = flip ? 140 - 4 - 86 : 4 + 56;
    const P = new Pen(out);
    P.part(P.rect(px, 22, 30, 10), C.cream, { b: 4 });
    BG.textOn(out, plate.toUpperCase(), px + 5, 23, C.navy[0], 0);
    return out;
  }

  const carCache = new Map();
  function car(cols, plate) {
    const key = cols.join('') + plate;
    if (!carCache.has(key)) carCache.set(key, carSprite(cols, plate, true));
    return carCache.get(key);
  }

  CLOSEUPS.firewall5 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const all = new S.Mask(0, 0, W, 132); all.m.fill(1);
    S.grad(f, all, SKY, (x, y) => y / 132);
    for (let i = 0; i < 40; i++) f.set(Math.floor(S.hash(i, 4, 1) * W), Math.floor(S.hash(i, 4, 2) * 90), C.lamp);
    for (let y = 132; y < H; y++) f.px.fill(y < 176 ? C.night[1] : C.night[0], y * W, y * W + W);
    for (let x = 0; x < W; x++) { f.set(x, 132, C.tvA); f.set(x, 176, C.tvB); if ((x + Math.floor(t * 60)) % 24 < 12) f.set(x, 154, C.lamp); }
    const P = new Pen(f);
    const WX = 214;
    const back = P.rect(WX, 0, 30, 176);
    BG.bricks(f, back, 10, 5, C.orchid, C.orchid[0], 3);
    P.part(P.rect(WX - 2, 96, 34, 80), C.night, { b: 0, sh: 0, hi: 0 });
    const scan = cu.scan && g.time - cu.scan.t0 < 1.2 ? cu.scan : null;
    const beam = scan ? (scan.ok ? NEON_G : NEON_R) : GLOW;
    for (let y = 100; y < 174; y += 3) { f.set(WX + 2 + (y % 2), y, beam[2]); f.set(WX + 26 - (y % 2), y, beam[2]); }
    P.part(P.rect(WX - 6, 86, 42, 11), C.night, { b: 1 });
    BG.textOn(f, 'ФАЙРВОЛ', WX - 4, 88, scan ? (scan.ok ? C.neonB : C.neonA) : C.lamp, 0);
    for (let i = 0; i < 16; i++) {
      const fy = (i * 11 + Math.floor(t * 30)) % 176;
      const side = i % 2 ? WX - 4 : WX + 30;
      const h = 8 + (i * 5) % 9;
      if (fy > 84 && fy < 100) continue;
      P.part(P.path(`M ${side} ${fy} Q ${side + (i % 2 ? -7 : 7)} ${fy - h * 0.5} ${side + (i % 2 ? -2 : 2)} ${fy - h} Q ${side + (i % 2 ? -1 : 1)} ${fy - h * 0.4} ${side + (i % 2 ? 3 : -3)} ${fy - 2} Z`), i % 3 ? C.orange : C.yellow, { b: 3, sh: 0, hi: 0, ol: 0 });
    }
    for (let i = 0; i < 6; i++) { const fx = WX + 2 + i * 5; const h = 8 + Math.floor((Math.sin(t * 9 + i * 2) + 1) * 5); P.part(P.poly([fx - 3, 4, fx, 4 - h * 0.4, fx + 3, 4]), C.orange, { b: 3, sh: 0, hi: 0, ol: 0 }); }
    const draw = (c, x, y) => blit(f, car(c.cols, c.plate), Math.round(x), Math.round(y));
    for (const c of cu.cars || []) {
      const x = -150 + (t - c.at) * 110;
      if (x > -150 && x < W + 10) draw(c, x, 126);
    }
    if (cu.own) {
      const o = cu.own;
      const k = t - o.at;
      let x = -150 + k * 110, y = 126;
      if (!o.ok) {
        const stopX = WX - 150;
        if (x > stopX) { const over = k - (stopX + 150) / 110; x = stopX; y = 126 + Math.min(1, Math.max(0, over - 1) * 1.2) * 30; }
      }
      if (x > -150 && x < W + 10) draw(o, x, y);
    }
    if (scan) font.drawCentered(f, scan.text, 160, 36, scan.ok ? C.neonB : C.neonA);
  };

  CLOSEUPS.netdrive5 = function (f, g, cu) {
    const t = g.time - cu.t0;
    synth(f, t, 118, 5);
    const P = new Pen(f);
    const k = Math.min(1, t / (cu.dur || 3));
    const s = 0.4 + k * 1.4;
    const bw = 116 * s, bh = 20 * s;
    P.part(P.rect(160 - bw / 2, 84 - bh, bw, bh), C.night, { b: 1 });
    if (s > 0.9) font.drawCentered(f, cu.text || '', 160, Math.round(84 - bh / 2 - 4), Math.floor(t * 4) % 2 ? C.neonB : C.lamp);
    P.line(160 - bw / 2 + 4, 84, 160 - bw / 2 + 4, 118, C.lilac[2]);
    P.line(160 + bw / 2 - 4, 84, 160 + bw / 2 - 4, 118, C.lilac[2]);
    blit(f, car(cu.cols, E.PLATE), 90, 140 + Math.round(Math.sin(t * 14)));
    for (let i = 0; i < 5; i++) { const x = (t * 300 + i * 70) % 360 - 20; S.line(f, x, 186, x + 18, 186, C.tvA); }
  };

  CLOSEUPS.crash5 = function (f, g, cu) {
    const t = g.time - cu.t0;
    const dead = Math.min(1, t / (cu.dur || 3));
    const seed = Math.floor(t * 14);
    for (let i = 0; i < f.px.length; i++) if (S.hash(i % W, (i / W) | 0, seed) < dead * 0.9) f.px[i] = C.black;
    const P = new Pen(f);
    for (let i = 0; i < 26 * (1 - dead) + 4; i++) {
      const x = Math.floor(S.hash(i, seed, 1) * W), y = Math.floor(S.hash(i, seed, 2) * H);
      const w = 8 + Math.floor(S.hash(i, seed, 3) * 60), h = 2 + Math.floor(S.hash(i, seed, 4) * 10);
      S.rectFill(f, x, y, w, h, C.cycle[i % 8]);
    }
    if (dead < 0.85 && seed % 3) { S.rectFill(f, 60, 86, 200, 24, C.blue[1]); font.drawCentered(f, 'НЕПОПРАВИМАЯ ОШИБКА', 160, 90, C.grey[5]); font.drawCentered(f, 'В МОДУЛЕ «ВСЁ»', 160, 100, C.grey[5]); }
  };

  const TITLE_ITEMS = ['Новая игра', 'Продолжить', 'Загрузить', 'Настройки', 'Выход'];

  E.TITLE = {
    items: TITLE_ITEMS,
    draw(f, t, hover, enabled) {
      synth(f, t, 124, 1);
      const sp = S.sprite('internet', { t, talk: Math.floor(t * 0.5) % 4 === 1 && Math.floor(t * 8) % 2 ? 1 : 0 }, 1.3);
      blit(f, sp.buf, 236 - sp.ox, 96 - sp.oy);
      heroes(f, t, 262, 206, 196, 1.4);
      S.bigText(f, 'SAM & MAX', 100, 10, 3, C.orange[3], C.yellow[4], 2);
      S.bigText(f, 'РЕАЛЬНОСТЬ 2.0', 100, 40, 2, C.pink[3], C.pink[4], 1);
      font.drawCentered(f, 'ЭПИЗОД 105', 100, 62, C.sky[4]);
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
    ['SAM & MAX', 3], ['РЕАЛЬНОСТЬ 2.0', 2], ['', 1],
    ['По комиксам Стива Пёрселла', 1], ['', 1],
    ['Сэм, собака в костюме', 1], ['Макс, президент и кролик-нечто', 1], ['', 1],
    ['В ролях', 2], ['Интернет в роли хозяйки', 1], ['Курт 286, Боб Белл,', 1], ['Бластер-Бахвал и Чиппи в роли К.О.П.С.', 1], ['Тётушка Биотик, антивирус со сковородой', 1], ['Интернет-волшебник, точно не Хью Блисс', 1], ['Эльбоскодрил, ранее Боско', 1], ['Сибил Пандемик, бета-тестер', 1], ['Джимми Два Зуба в роли снаряда', 1], ['Сержант Жучок в роли ошибки', 1], ['', 1],
    ['Графика', 2], ['320 на 200 точек, 256 цветов', 1], ['в Реальности 2.0 те же 256, только громче', 1], ['', 1],
    ['Музыка', 2], ['Хор пожилых систем', 1], ['', 1],
    ['При съёмках пострадал', 1], ['один Интернет.', 1], ['Его уже чинят.', 1], ['', 1],
    ['КОНЕЦ ЭПИЗОДА 105', 2], ['Продолжение следует...', 1]
  ];

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
