(function (S, B) {
  'use strict';
  const { Buf, blit, rectFill, frameRect, scaleBuf } = S;
  const C = B.C;
  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  function big(f, text, cx, y, k, col, ol) {
    const F = B.font;
    const w = F.measure(text) + 4;
    const b = new Buf(w, 16);
    F.draw(b, text, 2, 1, col, ol);
    const z = scaleBuf(b, k);
    blit(f, z, Math.round(cx - z.w / 2), y);
    return z.h;
  }

  function cursor(f, g) {
    const c = B.cursor('arrow', false);
    blit(f, c.buf, Math.round(g.mx), Math.round(g.my));
  }

  function bevel(f, x, y, w, h, ramp) {
    rectFill(f, x, y, w, h, ramp[1]);
    for (let xx = x; xx < x + w; xx++) { f.set(xx, y, ramp[3]); f.set(xx, y + h - 1, ramp[0]); }
    for (let yy = y; yy < y + h; yy++) { f.set(x, yy, ramp[3]); f.set(x + w - 1, yy, ramp[0]); }
    frameRect(f, x - 1, y - 1, w + 2, h + 2, C.black);
  }

  function* play(g, drive) {
    drive.g = g;
    g.drive = drive;
    g.mode = drive.kind;
    yield { fn: gg => gg.mode === 'room' || gg.drive !== drive };
    return drive.result;
  }

  function close(drive, result) {
    const g = drive.g;
    drive.result = result;
    if (g && g.drive === drive) { g.drive = null; g.mode = 'room'; g.pointer(g.mx, g.my); }
  }

  class Card {
    constructor(title, lines, o) {
      o = o || {};
      this.kind = 'card';
      this.title = title || '';
      this.lines = lines || [];
      this.t = 0;
      this.dur = o.dur || 2.2 + this.lines.join(' ').length * 0.045;
      this.bg = o.bg || C.night;
      this.art = o.art || null;
      this.textY = o.textY || 140;
    }
    update(dt) {
      this.t += dt;
      if (this.g.skipping || this.t >= this.dur / (this.g.textSpeed || 1)) close(this);
    }
    click() { if (this.t > 0.35) close(this); }
    key(k) { if (k === 'Escape' || k === ' ' || k === 'Enter') { close(this); return true; } return false; }
    render(f) {
      for (let y = 0; y < f.h; y++) for (let x = 0; x < f.w; x++) {
        const v = y / f.h * 2.2 + S.BAYER[((y & 3) << 2) | (x & 3)] - 0.5;
        f.px[y * f.w + x] = this.bg[Math.max(0, Math.min(this.bg.length - 1, Math.floor(v)))];
      }
      if (this.art) this.art(f, this.t);
      let y = this.textY;
      if (this.title) y += big(f, this.title, 320, 110, 2, C.gold[4]) + 10;
      for (const line of this.lines) {
        for (const l of B.font.wrap(line, 520)) { B.font.drawCentered(f, l, 320, y, C.snow[4], this.art ? C.black : undefined); y += 16; }
        y += 6;
      }
    }
  }

  class Doc {
    constructor(pages) {
      this.kind = 'doc';
      this.pages = pages;
      this.i = 0;
      this.t = 0;
    }
    update(dt) { this.t += dt; if (this.g.skipping) close(this); }
    click() { if (this.t < 0.2) return; this.i++; this.t = 0; if (this.i >= this.pages.length) close(this, true); }
    key(k) { if (k === 'Escape') { close(this, true); return true; } if (k === ' ' || k === 'Enter') { this.click(); return true; } return false; }
    render(f) {
      const p = this.pages[Math.min(this.i, this.pages.length - 1)];
      rectFill(f, 0, 0, f.w, f.h, C.wood[0]);
      for (let y = 0; y < f.h; y += 2) for (let x = (y >> 1) & 1; x < f.w; x += 2) f.px[y * f.w + x] = C.wood[1];
      p(f, this.g);
      if (this.pages.length > 1) B.font.drawCentered(f, (this.i + 1) + ' / ' + this.pages.length, 320, 458, C.cream[3]);
      cursor(f, this.g);
    }
  }

  const SIDE = [
    ['ЖАРА НЕ СПАДАЕТ', 'Термометр у суда снова показал девяносто. Мороженщики довольны.'],
    ['ТРЕЗВЫЙ ВЗГЛЯД', 'Общество трезвости ищет новое место для собраний. Церковь отказала.'],
    ['ВЫСТАВКА НАУКИ', 'Научная выставка Хилл-Вэлли откроется осенью. Обещают автомобиль будущего.'],
    ['БЕЙСБОЛ', 'Городская команда проиграла соседям восемь к трём. Тренер молчит.']
  ];

  function halftone(f, x0, y0, w, h, src) {
    const P = B.PAL.PALETTE;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = src ? src(x, y) : 0;
      const c = v ? P[v] : [200, 190, 160];
      const l = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255;
      const d = S.BAYER[((y & 3) << 2) | (x & 3)];
      f.px[(y0 + y) * f.w + x0 + x] = l < d * 0.9 ? C.hair[0] : l < 0.2 + d * 0.6 ? C.cream[1] : C.cream[3];
    }
  }

  function mugBuf() { return B.portrait('doc31', { face: 'worried' }); }

  function mug(f, x, y) {
    const p = mugBuf();
    halftone(f, x + 10, y + 8, 100, 112, (xx, yy) => p.px[yy * p.w + xx]);
    rectFill(f, x + 22, y + 112, 76, 16, C.cream[4]);
    frameRect(f, x + 22, y + 112, 76, 16, C.hair[0]);
    S.font.drawCentered(f, 'К. САГАН', x + 60, y + 115, C.hair[0], 0);
  }

  function columnText(f, x, y, w, h) {
    let yy = y;
    for (let i = 0; yy < y + h; i++, yy += 6) {
      const k = S.hash(i, x, 3);
      rectFill(f, x, yy, Math.round(w * (i % 7 === 6 ? 0.5 : 0.82 + k * 0.18)), 2, C.cream[1]);
    }
  }

  function paper(f, o) {
    const x0 = 70, y0 = 12, w = 500, h = 440;
    rectFill(f, x0, y0, w, h, C.cream[3]);
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { const n = S.hash(x, y, 11); if (n < 0.05) f.px[y * f.w + x] = C.cream[2]; else if (n > 0.995) f.px[y * f.w + x] = C.cream[1]; }
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + 6; x++) if (S.hash(x, y >> 2, 2) < 0.5) f.px[y * f.w + x] = C.cream[2];
    frameRect(f, x0, y0, w, h, C.hair[0]);
    big(f, 'ХИЛЛ-ВЭЛЛИ ТЕЛЕГРАФ', 320, y0 + 8, 2, C.hair[0], 0);
    for (const [bx, t1, t2] of [[x0 + 10, 'ЦЕНА', '5 ЦЕНТОВ'], [x0 + w - 80, 'ОСН.', '1871']]) { frameRect(f, bx, y0 + 8, 70, 28, C.hair[0]); S.font.drawCentered(f, t1, bx + 35, y0 + 11, C.hair[1], 0); S.font.drawCentered(f, t2, bx + 35, y0 + 22, C.hair[0], 0); }
    for (const yy of [y0 + 42, y0 + 44, y0 + 58]) S.line(f, x0 + 10, yy, x0 + w - 10, yy, C.hair[0]);
    S.font.drawCentered(f, (o.date || '') + '.   УТРЕННИЙ ВЫПУСК', 320, y0 + 47, C.hair[1], 0);
    let y = y0 + 66;
    for (const l of B.font.wrap(o.head, 210)) { big(f, l, 320, y, 2, C.hair[0], 0); y += 28; }
    S.line(f, x0 + 10, y + 2, x0 + w - 10, y + 2, C.hair[0]);
    y += 10;
    const colL = x0 + 12, colW = 316, sideX = x0 + 340, sideW = w - 352;
    let ty = y;
    if (o.photo) { frameRect(f, colL, ty, 122, 132, C.hair[0]); o.photo(f, colL + 1, ty + 1); }
    const tx = o.photo ? colL + 132 : colL, tw = o.photo ? colW - 132 : colW;
    for (const l of B.font.wrap(o.text, tw)) { B.font.draw(f, l, tx, ty, C.hair[0], 0); ty += 14; }
    ty = Math.max(ty, o.photo ? y + 140 : ty) + 6;
    columnText(f, colL, ty, colW, y0 + h - 12 - ty);
    S.line(f, sideX - 8, y, sideX - 8, y0 + h - 10, C.hair[1]);
    let sy = y;
    for (const [hd, tx2] of SIDE) {
      if (sy > y0 + h - 70) break;
      S.font.drawCentered(f, hd, sideX + sideW / 2, sy, C.hair[0], 0);
      sy += 12;
      for (const l of S.font.wrap(tx2, sideW)) { S.font.draw(f, l, sideX, sy, C.hair[1], 0); sy += 9; }
      columnText(f, sideX, sy + 2, sideW, 18);
      sy += 30;
      S.line(f, sideX, sy - 6, sideX + sideW, sy - 6, C.cream[1]);
    }
  }

  const PAPERS = {
    v1: [
      (f) => paper(f, { date: 'Воскресенье, 14 июня 1931', head: 'ПОДЖИГАТЕЛЬ БАРА УБИТ', text: 'Прошлой ночью толпа ворвалась в полицейский участок Хилл-Вэлли и вытащила из камеры арестованного за поджог подпольного бара. Задержанный называл себя Карлом Саганом. Полиция не сумела остановить нападавших. Свидетели говорят о людях в шляпах и о машине без номеров.' }),
      (f) => paper(f, { date: 'Воскресенье, 14 июня 1931', head: 'КАРЛ САГАН УБИТ!', text: 'Человек, назвавшийся Карлом Саганом, погиб от рук гангстеров. Он ждал суда за пожар в баре на площади. Личность его так и не установлена.', photo: mug })
    ],
    v2: [
      (f) => paper(f, { date: 'Воскресенье, 14 июня 1931', head: 'ФУРГОН ПЕРЕХВАЧЕН. ПОДОЗРЕВАЕМЫЙ УБИТ!', text: 'Прошлой ночью тюремный фургон, в котором перевозили Карла Сагана, угнали по дороге из города. Утром фургон нашли пустым. Полиция считает, что Сагана убили люди, которые мстили за сгоревший бар.', photo: mug })
    ],
    young: [
      (f) => paper(f, { date: 'Суббота, 13 июня 1931', head: 'КАРЛ САГАН ПРЕДСТАНЕТ ПЕРЕД СУДОМ', photo: mug, text: 'Незнакомец, которого задержали у сгоревшего бара на площади, обвиняется в поджоге. Сам он называет себя Карлом Саганом и о прошлом не говорит.' })
    ]
  };

  function notebookPage(f) {
    const P = new S.Pen(f);
    rectFill(f, 150, 24, 350, 432, C.cream[4]);
    for (let y = 24; y < 456; y++) for (let x = 150; x < 500; x++) if (S.hash(x, y, 9) < 0.03) f.px[y * f.w + x] = C.cream[3];
    frameRect(f, 150, 24, 350, 432, C.hair[0]);
    for (let y = 64; y < 450; y += 18) S.line(f, 160, y, 492, y, C.sky[3]);
    S.line(f, 196, 26, 196, 454, C.red[3]);
    for (let y = 38; y < 450; y += 22) { P.part(P.ell(150, y, 9, 5), C.steel, { b: 3, sh: 0, hi: 1 }); f.set(158, y, C.black); }
    const lines = ['25 октября 1985', 'СДЕЛАТЬ:', 'Бронежилет!!!', 'Выгулять Эйнштейна перед опытом', 'Проверить контуры: залипают', 'Напомнить Марти про камеру!', '', '1,21 гигаватт / 88 миль в час', 't = 1:20 → 1:21'];
    lines.forEach((l, i) => B.font.draw(f, l, 206 + (i % 3 === 2 ? 2 : 0), 48 + i * 18, i < 2 ? C.red[1] : C.navy[1], 0));
    const sx = 220, sy = 270;
    S.line(f, sx, sy + 40, sx + 30, sy + 26, C.navy[1]); S.line(f, sx + 30, sy + 26, sx + 70, sy + 6, C.navy[1]); S.line(f, sx + 70, sy + 6, sx + 120, sy + 6, C.navy[1]);
    S.line(f, sx + 120, sy + 6, sx + 150, sy + 22, C.navy[1]); S.line(f, sx + 150, sy + 22, sx + 166, sy + 24, C.navy[1]); S.line(f, sx + 166, sy + 24, sx + 166, sy + 42, C.navy[1]); S.line(f, sx, sy + 42, sx + 166, sy + 42, C.navy[1]);
    for (const cx of [sx + 34, sx + 134]) { P.part(P.ell(cx, sy + 44, 11, 11), C.cream, { b: 4, sh: 0, hi: 0, ol: C.navy[1] }); }
    B.font.draw(f, 'DMC-12', sx + 60, sy + 52, C.navy[1], 0);
    const fx = 400, fy = 300;
    frameRect(f, fx, fy, 60, 70, C.navy[1]);
    for (const [x, y] of [[fx + 30, fy + 14], [fx + 14, fy + 54], [fx + 46, fy + 54]]) { S.line(f, fx + 30, fy + 36, x, y, C.navy[1]); P.part(P.ell(x, y, 4, 4), C.cream, { b: 4, sh: 0, hi: 0, ol: C.navy[1] }); }
    B.font.draw(f, 'ПОТОК!', fx + 4, fy + 74, C.red[1], 0);
    for (let k = 0; k < 64; k++) { const a = k / 64 * Math.PI * 2, r = 30 + (k % 3); f.set(Math.round(430 + Math.cos(a) * r), Math.round(90 + Math.sin(a) * r * 0.8), C.tan[2]); }
  }

  function photoPage(f) {
    rectFill(f, 190, 40, 260, 380, C.snow[4]);
    frameRect(f, 190, 40, 260, 380, C.black);
    const p = B.portrait('george', { face: 'smile' });
    const z = scaleBuf(p, 2);
    const PAL = B.PAL.PALETTE, SEP = [C.hair[0], C.tan[0], C.tan[1], C.tan[2], C.tan[3], C.tan[4], C.cream[4]];
    for (let y = 0; y < 224; y++) for (let x = 0; x < 200; x++) {
      const v = z.px[y * z.w + x];
      const c = v ? PAL[v] : [180, 160, 120];
      const l = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255;
      f.px[(60 + y) * f.w + 220 + x] = SEP[Math.max(0, Math.min(SEP.length - 1, Math.round(l * (SEP.length - 1) + S.BAYER[((y & 3) << 2) | (x & 3)] - 0.5)))];
    }
    rectFill(f, 236, 250, 72, 40, C.navy[2]);
    frameRect(f, 236, 250, 72, 40, C.black);
    S.font.drawCentered(f, 'ПРИШЕЛЕЦ', 272, 258, C.gold[4], 0);
    S.font.drawCentered(f, 'С ПЛУТОНА', 272, 270, C.gold[4], 0);
    B.font.drawCentered(f, 'Джордж Макфлай', 320, 300, C.navy[1], 0);
    B.font.drawCentered(f, '«Пришелец с Плутона»', 320, 318, C.navy[1], 0);
    B.font.drawCentered(f, 'Автограф для Марти, 1985', 320, 380, C.hair[1], 0);
  }

  function seg(f, x, y, d, col, w, h) {
    const on = [0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07, 0x7f, 0x6f][d] || 0;
    const t = 3;
    const S7 = [[t, 0, w - 2 * t, t], [w - t, t, t, h / 2 - t], [w - t, h / 2, t, h / 2 - t], [t, h - t, w - 2 * t, t], [0, h / 2, t, h / 2 - t], [0, t, t, h / 2 - t], [t, h / 2 - 1, w - 2 * t, t]];
    for (let i = 0; i < 7; i++) rectFill(f, x + S7[i][0], y + S7[i][1], S7[i][2], S7[i][3], on & (1 << i) ? col : C.grey[0]);
  }

  function ledText(f, s, x, y, col) {
    const b = new Buf(B.font.measure(s) + 2, 14);
    B.font.draw(b, s, 1, 0, col, 0);
    blit(f, scaleBuf(b, 2), x, y);
  }

  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'E'];

  class Circuits {
    constructor(o) {
      this.kind = 'circuits';
      this.present = o.present;
      this.last = o.last;
      this.digits = '';
      this.t = 0;
      this.msg = '';
      this.hover = -1;
    }
    keyAt(x, y) {
      const col = Math.floor((x - 440) / 52), row = Math.floor((y - 300) / 40);
      if (col < 0 || col > 2 || row < 0 || row > 3 || x - 440 - col * 52 > 46 || y - 300 - row * 40 > 34) return -1;
      return row * 3 + col;
    }
    update(dt) { this.t += dt; if (this.g.skipping) close(this, null); }
    pointer(x, y) { this.hover = this.keyAt(x, y); }
    click(x, y) { const i = this.keyAt(x, y); if (i >= 0) this.press(KEYS[i]); else if (y < 40 && x > 560) close(this, null); }
    key(k) {
      if (k === 'Escape') { close(this, null); return true; }
      if (/^[0-9]$/.test(k)) { this.press(k); return true; }
      if (k === 'Backspace') { this.digits = this.digits.slice(0, -1); return true; }
      if (k === 'Enter') { this.press('E'); return true; }
      return false;
    }
    press(k) {
      this.g.sfx('beep');
      if (k === 'C') { this.digits = ''; return; }
      if (k === 'E') {
        if (this.digits.length < 8) { this.msg = 'MM DD YYYY'; return; }
        const d = this.parse();
        close(this, d);
        return;
      }
      if (this.digits.length < 12) this.digits += k;
    }
    parse() {
      const s = this.digits.padEnd(12, ' ');
      const num = (a, b, def) => { const v = s.slice(a, b).trim(); return v.length === b - a ? parseInt(v, 10) : def; };
      return { m: num(0, 2, 0), d: num(2, 4, 0), y: num(4, 8, 0), h: num(8, 10, 4), min: num(10, 12, 0) };
    }
    row(f, y, label, col, v, blank, garbage) {
      bevel(f, 30, y, 580, 70, C.grey);
      B.font.drawCentered(f, label, 320, y + 56, C.snow[3], 0);
      const cells = [[50, 3], [140, 2], [200, 4], [314, 1], [360, 2], [420, 2]];
      const vals = garbage ? ['888', '88', '8888', '', '88', '88'] : blank ? ['', '', '', '', '', ''] : v;
      cells.forEach(([x, n], i) => {
        rectFill(f, x - 4, y + 10, n * 16 + 8, 34, C.black);
        const sv = vals[i] || '';
        if (i === 0) { if (sv) ledText(f, sv, x, y + 14, col); return; }
        if (i === 3) { if (sv) B.font.draw(f, sv, x, y + 14, col, 0); return; }
        for (let k = 0; k < sv.length; k++) if (sv[k] !== ' ') seg(f, x + k * 16, y + 14, parseInt(sv[k], 10), col, 12, 24);
      });
    }
    render(f) {
      rectFill(f, 0, 0, f.w, f.h, C.steel[0]);
      for (let y = 0; y < f.h; y += 3) S.line(f, 0, y, f.w - 1, y, C.steel[1]);
      const s = this.digits.padEnd(12, ' ');
      const m = parseInt(s.slice(0, 2), 10);
      const dest = [m >= 1 && m <= 12 ? MONTHS[m - 1] : s.slice(0, 2).trim(), s.slice(2, 4), s.slice(4, 8), s.length > 8 && s.slice(8, 10).trim() ? (parseInt(s.slice(8, 10), 10) >= 12 ? 'PM' : 'AM') : '', s.slice(8, 10), s.slice(10, 12)];
      if (this.digits.length < 12 && Math.floor(this.t * 3) % 2 === 0) { }
      this.row(f, 20, 'DESTINATION TIME', C.ledR, dest, false, false);
      this.row(f, 110, 'PRESENT TIME', C.ledG, this.present, false, false);
      this.row(f, 200, 'LAST TIME DEPARTED', C.ledY, this.last || [], !this.last && !this.garbage, this.last === 'garbage' && Math.floor(this.t * 6) % 2 === 0);
      bevel(f, 430, 290, 168, 172, C.slate);
      KEYS.forEach((k, i) => {
        const x = 440 + (i % 3) * 52, y = 300 + Math.floor(i / 3) * 40;
        bevel(f, x, y, 46, 34, i === this.hover ? C.vest : C.steel);
        B.font.drawCentered(f, k === 'C' ? 'СБРОС' : k === 'E' ? 'ВВОД' : k, x + 23, y + 11, C.snow[4], 0);
      });
      B.font.draw(f, 'Цифрами: месяц, день, год, часы, минуты', 40, 304, C.snow[3], 0);
      B.font.draw(f, 'Enter: ввести   Esc: выйти', 40, 324, C.snow[3], 0);
      if (this.msg) B.font.draw(f, this.msg, 40, 350, C.ledY, 0);
      bevel(f, 570, 4, 64, 22, C.steel);
      B.font.drawCentered(f, 'Выход', 602, 9, C.snow[4], 0);
      cursor(f, this.g);
    }
  }

  const FUEL_ST = [
    { id: 'fire', name: 'Мехи', x: 110, y: 300, w: 120, h: 90, ramp: C.red },
    { id: 'gas', name: 'Клапан', x: 110, y: 120, w: 120, h: 90, ramp: C.sky },
    { id: 'food', name: 'Корм', x: 410, y: 120, w: 120, h: 90, ramp: C.green },
    { id: 'crank', name: 'Колесо', x: 410, y: 300, w: 120, h: 90, ramp: C.gold }
  ];

  const FUEL_LINES = {
    fire: [['Закон, может, и', 'ГОРИТ', 'в твоём сердце, отец, но не в моём!'], ['У меня от этих бумаг', 'ЖАР', 'по всей спине.'], ['Ты говоришь о долге, а у меня внутри', 'ПЛАМЯ', '!']],
    gas: [['Хватит на меня', 'ДАВИТЬ', ', отец!'], ['Мне иногда надо', 'ВЫПУСТИТЬ', 'пар, понимаешь?'], ['Ещё немного, и', 'ДАВЛЕНИЕ', 'меня разорвёт.']],
    food: [['Не знаю, что тебя', 'ГРЫЗЁТ', ', но пусть оно сядет на диету.'], ['Я сыт по горло твоей', 'ЕДОЙ', 'для ума!'], ['Ты меня', 'КОРМИШЬ', 'одними параграфами.']],
    crank: [['Может, мне в', 'МОЛНИЮ', 'встать? Тебе полегчает?'], ['У тебя всё', 'КРУТИТСЯ', 'вокруг суда.'], ['Между нами давно проскочила', 'ИСКРА', ', и не та.']]
  };
  const DECOYS = [['Не смей', 'ДАВИТЬ', 'на жалость, Эмметт!', 'gas'], ['В этом доме', 'ГОРИТ', 'свет до полуночи. Твоя работа?', 'fire'], ['Хватит', 'КРУТИТЬ', ', отвечай прямо!', 'crank'], ['Ты опять без', 'ЕДЫ', 'просидел весь день в подвале?', 'food']];

  class Fuel {
    constructor(rng) {
      this.kind = 'fuel';
      this.rng = rng;
      this.done = 0;
      this.mistakes = 0;
      this.t = 0;
      this.cur = null;
      this.gap = 1.2;
      this.out = 0;
      this.used = {};
      this.hover = -1;
      this.queue = [];
      this.flash = null;
      this.ended = false;
    }
    round() { return Math.min(3, Math.floor(this.done / 3)); }
    next() {
      const r = this.round();
      const decoy = r >= 2 && this.rng.next() < 0.35;
      if (decoy) {
        const d = DECOYS[this.rng.int(DECOYS.length)];
        this.cur = { who: 'judge', parts: d.slice(0, 3), st: d[3], t: 0, win: 2.4 - r * 0.2 };
        return;
      }
      const st = FUEL_ST[this.rng.int(4)].id;
      const pool = FUEL_LINES[st];
      const k = (this.used[st] = ((this.used[st] || 0) + 1)) % pool.length;
      this.cur = { who: 'emmett', parts: pool[k], st, t: 0, win: [4.2, 3.4, 2.8, 2.2][r] };
    }
    update(dt) {
      this.t += dt;
      if (this.g.skipping) { this.g.skipping = false; }
      if (this.out > 0) { this.out -= dt; return; }
      if (this.flash) { this.flash.t -= dt; if (this.flash.t <= 0) this.flash = null; }
      if (!this.cur) { this.gap -= dt; if (this.gap <= 0) this.next(); return; }
      this.cur.t += dt;
      if (this.cur.t >= this.cur.win) {
        if (this.cur.who === 'emmett') this.miss();
        this.cur = null; this.gap = 0.6;
      }
    }
    miss() {
      this.mistakes++;
      this.out = 2.2;
      this.flash = { text: 'Огонь погас! Эмметт: «Слушайте меня! Отец пусть говорит что хочет!»', t: 2.2 };
      this.g.sfx('hiss');
    }
    hit(i) {
      if (this.out > 0 || !this.cur) return;
      const st = FUEL_ST[i].id;
      if (this.cur.who === 'judge' || st !== this.cur.st) { this.cur = null; this.gap = 0.8; this.miss(); return; }
      this.done++;
      this.g.sfx({ fire: 'bellows', gas: 'hiss', food: 'plop', crank: 'wheel' }[st]);
      this.cur = null; this.gap = 0.7;
      if (this.done >= 12) close(this, { clean: this.mistakes === 0, mistakes: this.mistakes });
    }
    stAt(x, y) { return FUEL_ST.findIndex(s => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h); }
    pointer(x, y) { this.hover = this.stAt(x, y); }
    click(x, y) { const i = this.stAt(x, y); if (i >= 0) this.hit(i); }
    key(k) {
      const i = ['1', '2', '3', '4'].indexOf(k);
      if (i >= 0) { this.hit(i); return true; }
      return k === 'Escape';
    }
    render(f) {
      rectFill(f, 0, 0, f.w, f.h, C.plank[0]);
      for (let y = 0; y < f.h; y += 4) S.line(f, 0, y, f.w - 1, y, C.plank[1]);
      const P = new S.Pen(f);
      P.part(P.ell(320, 260, 70, 60), C.steel, { b: 2 });
      P.part(P.ell(320, 250, 40, 28), this.out > 0 ? C.grey : C.vest, { b: 3, sh: 0 });
      FUEL_ST.forEach((s, i) => {
        bevel(f, s.x, s.y, s.w, s.h, i === this.hover ? s.ramp : C.wood);
        B.font.drawCentered(f, (i + 1) + '. ' + s.name, s.x + s.w / 2, s.y + 38, C.snow[4]);
        S.line(f, s.x + (s.x < 320 ? s.w : 0), s.y + s.h / 2, 320 + (s.x < 320 ? -60 : 60), 260, C.steel[3]);
      });
      bevel(f, 40, 30, 560, 18, C.grey);
      rectFill(f, 42, 32, Math.round(556 * this.done / 12), 14, C.ledG);
      for (const p of [0.25, 0.5, 0.75]) S.line(f, 42 + Math.round(556 * p), 30, 42 + Math.round(556 * p), 47, C.snow[4]);
      if (this.cur) {
        const col = this.cur.who === 'emmett' ? C.teal[4] : C.olive[4];
        const who = this.cur.who === 'emmett' ? 'Эмметт: ' : 'Судья (сверху): ';
        const [a, w, b] = this.cur.parts;
        const F = B.font;
        const total = F.measure(who + a + ' ' + w + ' ' + b);
        let x = Math.round(320 - total / 2);
        x = F.draw(f, who + a + ' ', x, 420, col) + 2;
        x = F.draw(f, w, x, 420, C.gold[4]) + 2;
        F.draw(f, (b[0] === ',' || b[0] === '!' || b[0] === '.' ? '' : ' ') + b, x, 420, col);
      }
      if (this.flash) B.font.drawCentered(f, this.flash.text, 320, 446, C.red[4]);
      B.font.drawCentered(f, 'Слушай Эмметта. Клавиши 1–4 или щелчок по посту.', 320, 60, C.cream[3]);
      cursor(f, this.g);
    }
  }

  function* card(g, title, lines, o) { return yield* play(g, new Card(title, lines, o)); }
  function* doc(g, pages) { g.sfx('paper'); return yield* play(g, new Doc(pages)); }

  B.games = { play, close, Card, Doc, Circuits, Fuel, card, doc, PAPERS, paper, mug, notebookPage, photoPage, big, MONTHS, FUEL_ST, FUEL_LINES, DECOYS };
  if (typeof module !== 'undefined' && module.exports) module.exports = B;
})(globalThis.SamMax, globalThis.BTTF = globalThis.BTTF || {});
