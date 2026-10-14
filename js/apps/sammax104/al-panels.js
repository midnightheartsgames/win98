(function (S) {
  'use strict';
  const { W, C, Pen, blit, font } = S;
  const E = S.EP104;
  const B = S.art104bg;
  const inRect = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

  function button(f, r, text, hov, ramp) {
    const P = new Pen(f);
    P.part(P.rect(r.x, r.y, r.w, r.h), ramp, { b: hov ? 3 : 2 });
    font.drawCentered(f, text, r.x + Math.floor(r.w / 2), r.y + Math.floor((r.h - 7) / 2), hov ? C.yellow[4] : C.grey[5]);
  }

  class Panel {
    constructor(g, kind) { this.g = g; this.kind = kind; this.hover = null; this.t = 0; }
    update(dt) { this.t += dt; }
    pointer(x, y) { this.g.mx = x; this.g.my = y; this.hover = this.hit(x, y); }
    key(k) {
      if (k !== 'Escape') return false;
      this.close();
      return true;
    }
    close(after) {
      const g = this.g;
      if (g.drive !== this) return;
      g.mode = 'room';
      g.drive = null;
      g.sfx('click');
      const it = after || this.after();
      if (it) g.run(it, { name: 'panel' });
    }
    after() { return null; }
    click(x, y) {
      const g = this.g;
      if (g.busy) { g.skipLine(); return; }
      const h = this.hit(x, y);
      if (h !== null) this.pick(h);
    }
    cursor(f) {
      const g = this.g;
      if (g.busy) return;
      const cur = S.cursor('use', this.hover !== null);
      blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy);
    }
  }

  const CAL = { x: 62, y: 44, cw: 28, ch: 23 };
  const CAL_CLOSE = { x: 200, y: 176, w: 58, h: 15 };
  const WEEK = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  const dayCell = d => ({ x: CAL.x + ((d - 1) % 7) * CAL.cw, y: CAL.y + Math.floor((d - 1) / 7) * CAL.ch, w: CAL.cw, h: CAL.ch });

  class CalendarPanel extends Panel {
    constructor(g) { super(g, 'calendar'); this.prev = g.f.today; }
    hit(x, y) {
      if (inRect(CAL_CLOSE, x, y)) return 0;
      for (let d = 1; d <= 30; d++) if (inRect(dayCell(d), x, y)) return d;
      return null;
    }
    pick(d) {
      const g = this.g;
      if (d === 0) { this.close(); return; }
      if (g.f.today === d) return;
      g.f.today = d;
      g.sfx('rip');
    }
    after() { return E.onCalendar(this.g, this.prev); }
    render(f, g) {
      f.px.fill(C.night[1]);
      const P = new Pen(f);
      P.part(P.rect(54, 4, 212, 192), C.grey, { b: 5 });
      P.part(P.rect(54, 4, 212, 24), C.red, { b: 3, sh: 0 });
      for (let x = 66; x < 262; x += 18) P.part(P.ell(x, 5, 2.4, 2.4), C.grey, { b: 1, sh: 0 });
      S.bigText(f, 'АПРЕЛЬ', 160, 9, 2, C.grey[5], C.eye, 1);
      WEEK.forEach((w, i) => font.drawCentered(f, w, CAL.x + i * CAL.cw + CAL.cw / 2, 33, i > 4 ? C.red[2] : C.grey[1], 0));
      for (let d = 1; d <= 30; d++) {
        const r = dayCell(d);
        const hol = E.HOLIDAYS[d];
        const today = g.f.today === d;
        P.part(P.rect(r.x, r.y, r.w - 1, r.h - 1), C.grey, { b: this.hover === d ? 4 : 5, sh: 0, hi: 0, ol: C.grey[3] });
        font.draw(f, String(d), r.x + 3, r.y + 2, hol ? C.red[3] : C.grey[1], 0);
        if (hol) P.part(P.ell(r.x + 21, r.y + 5, 2, 2), C.red, { b: 3, sh: 0, hi: 0 });
        if (today) {
          P.part(P.poly([r.x + 3, r.y + 11, r.x + 24, r.y + 10, r.x + 25, r.y + 20, r.x + 4, r.y + 21]), C.yellow, { b: 4 });
          P.line(r.x + 7, r.y + 14, r.x + 21, r.y + 13.4, C.yellow[1]);
          P.line(r.x + 7, r.y + 17, r.x + 17, r.y + 16.6, C.yellow[1]);
          P.part(P.ell(r.x + 14, r.y + 10, 1.6, 1.6), C.red, { b: 4, sh: 0, hi: 0 });
        }
      }
      const d = typeof this.hover === 'number' && this.hover > 0 ? this.hover : g.f.today;
      const hol = E.HOLIDAYS[d];
      font.draw(f, d + ' апреля' + (hol ? ': ' + hol.name : '') + (d === g.f.today ? ' (сегодня)' : ''), 62, 164, hol ? C.red[2] : C.grey[1], 0);
      font.draw(f, 'Щёлкни по дню: листок', 62, 176, C.grey[2], 0);
      font.draw(f, '«Сегодня» переедет.', 62, 185, C.grey[2], 0);
      button(f, CAL_CLOSE, 'ЗАКРЫТЬ', this.hover === 0, C.navy);
      this.cursor(f);
    }
  }

  const ROW = { x: 38, y: 66, w: 244, h: 18, step: 20 };
  const BUD_CLOSE = { x: 224, y: 172, w: 58, h: 15 };

  E.budgetRows = function (g) {
    const rows = [
      { id: 'hall', name: 'Зал Независимости', age: '1753 год' },
      { id: 'alamo', name: 'Аламо', age: '1718 год' },
      { id: 'liberty', name: 'Статуя Свободы', age: '1886 год' }
    ];
    if (g.f.tikiDated) rows.push({ id: 'sybil', name: 'Контора Сибил', age: '2000 лет' });
    if (g.f.weeniesDated) rows.push({ id: 'bosco', name: 'Лавка Боско', age: 'мел. период' });
    return rows;
  };

  class BudgetPanel extends Panel {
    constructor(g) { super(g, 'budget'); this.rows = E.budgetRows(g); }
    rowRect(i) { return { x: ROW.x, y: ROW.y + i * ROW.step, w: ROW.w, h: ROW.h }; }
    hit(x, y) {
      if (inRect(BUD_CLOSE, x, y)) return -1;
      for (let i = 0; i < this.rows.length; i++) if (inRect(this.rowRect(i), x, y)) return i;
      return null;
    }
    pick(i) {
      if (i === -1) { this.close(); return; }
      this.close(E.onBudget(this.g, this.rows[i].id));
    }
    render(f, g) {
      f.px.fill(C.wood[1]);
      const P = new Pen(f);
      P.part(P.rect(24, 6, 272, 188), C.green, { b: 1 });
      P.part(P.rect(30, 10, 260, 180), C.cream, { b: 4 });
      P.line(160, 10, 160, 14, C.cream[1]);
      S.bigText(f, 'ФОНД ПРЕЗИДЕНТА', 160, 15, 2, C.green[1], C.green[2], 0);
      font.drawCentered(f, 'Исторические места. В фонде: 100 млн $', 160, 36, C.wood[1], 0);
      font.draw(f, 'МЕСТО', 44, 53, C.red[2], 0);
      font.draw(f, 'ВОЗРАСТ', 150, 53, C.red[2], 0);
      font.draw(f, 'ВЫДЕЛЕНО', 276 - font.measure('ВЫДЕЛЕНО'), 53, C.red[2], 0);
      P.line(38, 62, 282, 62, C.cream[1]);
      this.rows.forEach((row, i) => {
        const r = this.rowRect(i);
        const paid = g.f.budget === row.id;
        if (paid || this.hover === i) P.part(P.rect(r.x, r.y, r.w, r.h), paid ? C.mint : C.cream, { b: paid ? 4 : 3, sh: 0, hi: 0, ol: this.hover === i ? C.red[3] : 0 });
        font.draw(f, row.name, 44, r.y + 5, C.wood[0], 0);
        font.draw(f, row.age, 150, r.y + 5, C.wood[2], 0);
        const sum = paid ? '100 млн $' : '0 $';
        font.draw(f, sum, 276 - font.measure(sum), r.y + 5, paid ? C.green[1] : C.grey[2], 0);
        P.line(38, r.y + r.h, 282, r.y + r.h, C.cream[2]);
      });
      font.draw(f, 'Фонд выдаётся одному', 38, 170, C.wood[2], 0);
      font.draw(f, 'месту. Щёлкни по строке.', 38, 179, C.wood[2], 0);
      button(f, BUD_CLOSE, 'ЗАКРЫТЬ', this.hover === -1, C.navy);
      this.cursor(f);
    }
  }

  const VIEW = { x: 142, y: 26, w: 168, h: 112 };
  const LIST = { x: 8, y: 30, w: 126, h: 20, step: 23 };
  const FIRE = { x: 150, y: 158, w: 84, h: 30 };
  const EXIT = { x: 250, y: 166, w: 60, h: 18 };
  const at = { x: 226, y: 136 };

  E.targets = function (g) {
    const f = g.f;
    const first = !f.beaconTaken ? { id: 'bosco', name: 'Маяк 1: лавка Боско' } : !f.beaconOn ? { id: 'pocket', name: 'Маяк 1: рядом' } : { id: 'lincoln', name: 'Маяк 1: шоссе 95' };
    return [first, { id: 'antarctica', name: 'Маяк 2: Антарктида' }, { id: 'krypton', name: 'Маяк 3: Криптон' }, { id: 'kremlin', name: 'Маяк 4: Кремль' }];
  };

  const FEED = {
    bosco(f, t) {
      const P = new Pen(f);
      S.grad(f, P.rect(0, 0, VIEW.w, VIEW.h), C.olive, (x, y) => 0.3 + y / 300);
      for (let i = 0; i < 3; i++) P.part(P.rect(6, 12 + i * 22, 70, 4), C.wood, { b: 2, sh: 0 });
      for (let i = 0; i < 12; i++) P.part(P.rect(8 + (i % 6) * 11, 4 + Math.floor(i / 6) * 22, 8, 8), [C.red, C.gold, C.blue, C.green][i % 4], { b: 3, sh: 0 });
      P.part(P.rect(84, 70, 84, 42), C.wood, { b: 2 });
      P.part(P.rect(84, 66, 84, 6), C.wood, { b: 3, sh: 0 });
      const b = S.sprite('boscov', { dir: 's', blink: Math.floor(t * 2) % 6 === 0, v: Math.floor(t * 0.8) % 2 ? 'wary' : 'wary2' }, 0.8);
      const tmp = new S.Buf(VIEW.w, VIEW.h);
      blit(tmp, b.buf, 126 - b.ox, 102 - b.oy);
      for (let y = 0; y < 70; y++) for (let x = 0; x < VIEW.w; x++) { const c = tmp.px[y * VIEW.w + x]; if (c) f.px[y * VIEW.w + x] = c; }
      P.part(P.rect(98, 56, 22, 12), C.grey, { b: 2 });
      font.draw(f, 'HOT', 101, 58, C.yellow[4], 0);
      P.part(P.poly([0, 84, 60, 96, 60, 112, 0, 112]), C.yellow, { b: 3 });
      font.draw(f, 'АКДИКС', 4, 100, C.red[1], 0);
    },
    pocket(f, t) {
      const P = new Pen(f);
      S.grad(f, P.rect(0, 0, VIEW.w, VIEW.h), C.suit, (x, y) => 0.12 + ((x + y * 2) % 9 === 0 ? 0.2 : 0));
      P.part(P.ell(40, 90, 5, 3), C.oak, { b: 3, sh: 0 });
      P.part(P.ell(120, 100, 8, 4), C.pink, { b: 2 });
      P.part(P.ell(120, 100, 2.6, 1.4), C.oak, { b: 1, sh: 0, hi: 0 });
      font.drawCentered(f, 'ТЕМНО. ТКАНЬ. КРОШКИ.', 84, 50, C.suit[3], 0);
    },
    lincoln(f, t) {
      const P = new Pen(f);
      const bob = Math.round(Math.abs(Math.sin(t * 2.4)) * 5);
      S.grad(f, P.rect(0, 0, VIEW.w, 60 + bob), [C.purple[1], C.plum[2], C.rose[3], C.orange[3]], (x, y) => y / 66);
      P.part(P.rect(0, 58 + bob, VIEW.w, 60), C.olive, { b: 2, sh: 0, hi: 0, ol: 0 });
      P.part(P.poly([76, 58 + bob, 92, 58 + bob, 150, 112, 18, 112]), C.asphalt, { b: 2, sh: 0, hi: 0 });
      for (let i = 0; i < 5; i++) P.part(P.rect(10 + i * 34, 46 + bob - (i % 2) * 6, 22, 12 + (i % 2) * 6), C.night, { b: 1, sh: 0, hi: 0 });
      P.part(P.path('M -10 112 Q 20 84 70 92 Q 110 96 130 112 Z'), C.cream, { b: 3 });
      P.part(P.path('M 120 112 Q 130 70 150 66 Q 172 70 178 112 Z'), C.cream, { b: 2 });
    },
    antarctica(f, t) {
      const P = new Pen(f);
      S.grad(f, P.rect(0, 0, VIEW.w, VIEW.h), C.sky, (x, y) => 0.5 + y / 220);
      P.part(P.path('M 0 70 L 30 50 L 60 64 L 100 40 L 140 62 L 168 52 L 168 112 L 0 112 Z'), B.WHITE, { b: 2 });
      const Q = new Pen(f).at(84, 110, 2.6);
      Q.part(Q.ell(0, -8, 5, 8), C.night, { b: 1 });
      Q.part(Q.ell(0.6, -7, 3.2, 6), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
      Q.part(Q.ell(0, -17, 3.6, 3.4), C.night, { b: 1 });
      Q.part(Q.poly([-2, -16.4, 2, -16.4, 0, -13]), C.orange, { b: 3, sh: 0 });
      const blink = Math.floor(t * 2) % 5 === 0;
      if (!blink) { Q.px(-1.6, -18, C.eye); Q.px(1.6, -18, C.eye); }
    },
    krypton(f, t) {
      const P = new Pen(f);
      S.grad(f, P.rect(0, 0, VIEW.w, VIEW.h), C.night, (x, y) => 0.1 + y / 400);
      for (let i = 0; i < 40; i++) f.set(Math.floor(S.hash(i, 5, 1) * VIEW.w), Math.floor(S.hash(i, 5, 2) * VIEW.h), i % 3 ? C.grey[5] : C.yellow[4]);
      for (let i = 0; i < 9; i++) {
        const a = i * 0.7 + t * 0.2, r = 16 + (i % 3) * 12;
        const x = 84 + Math.cos(a) * r * 1.4, y = 56 + Math.sin(a) * r * 0.8;
        P.part(P.poly([x, y - 5, x + 6, y, x + 1, y + 6, x - 5, y + 1]), C.slime, { b: 2 + (i % 2), sh: 0 });
      }
    },
    kremlin(f, t) {
      const k = Math.floor(t * 12);
      for (let y = 0; y < VIEW.h; y++) for (let x = 0; x < VIEW.w; x++) f.px[y * VIEW.w + x] = S.hash(x, y, k) > 0.5 ? C.grey[4] : C.grey[1];
      const P = new Pen(f);
      P.part(P.rect(44, 46, 80, 18), C.night, { b: 0 });
      font.drawCentered(f, 'НЕТ СИГНАЛА', 84, 51, C.red[4], 0);
    }
  };

  const NOTE = {
    bosco: 'ЦЕЛЬ НА МЕСТЕ',
    pocket: 'ЦЕЛЬ СЛИШКОМ БЛИЗКО',
    lincoln: 'ЦЕЛЬ ДВИЖЕТСЯ',
    antarctica: 'ЦЕЛЬ НА МЕСТЕ',
    krypton: 'ЦЕЛЬ ОЧЕНЬ ДАЛЕКО',
    kremlin: 'МАЯК НЕ ОТВЕЧАЕТ'
  };

  class TargetPanel extends Panel {
    constructor(g) {
      super(g, 'target');
      this.list = E.targets(g);
      this.sel = 0;
      this.feed = new S.Buf(VIEW.w, VIEW.h);
      this.seen();
    }
    rowRect(i) { return { x: LIST.x, y: LIST.y + i * LIST.step, w: LIST.w, h: LIST.h }; }
    hit(x, y) {
      if (inRect(FIRE, x, y)) return 'fire';
      if (inRect(EXIT, x, y)) return 'exit';
      for (let i = 0; i < this.list.length; i++) if (inRect(this.rowRect(i), x, y)) return i;
      return null;
    }
    seen() {
      const g = this.g, id = this.list[this.sel].id;
      if (id === 'bosco' && !g.f.knowBeacon) {
        g.f.knowBeacon = true;
        g.run(function* () {
          yield g.say('sam', 'Прилавок Боско. Вид из-за стопки консервов, с высоты ценника.', at);
          yield g.say('sam', 'На его лавку с самого начала наведена ракета. Он был прав, и мне с этим жить.', at);
          yield g.say('max', 'У ракеты есть любимчики! Сэм, я президент, я сам хочу выбирать, кого она любит!', at);
        }, { name: 'panelsay' });
      } else if (id === 'pocket' && !g.seen.pocketCam) {
        g.seen.pocketCam = 1;
        g.run(function* () { yield g.say('sam', 'Первый маяк теперь показывает подкладку моего пиджака.', at); }, { name: 'panelsay' });
      } else if (id === 'lincoln' && !g.seen.abeCam) {
        g.seen.abeCam = 1;
        g.run(function* () { yield g.say('sam', 'Первый маяк едет на Линкольне. Картинка трясётся в такт шагам.', at); }, { name: 'panelsay' });
      }
    }
    pick(h) {
      const g = this.g;
      if (h === 'exit') { this.close(); return; }
      if (h === 'fire') { this.close(E.onFire(g, this.list[this.sel].id)); return; }
      if (this.sel === h) return;
      this.sel = h;
      g.sfx('beep');
      this.seen();
    }
    key(k) {
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        if (!this.g.busy) this.pick((this.sel + (k === 'ArrowDown' ? 1 : this.list.length - 1)) % this.list.length);
        return true;
      }
      return super.key(k);
    }
    render(f, g) {
      f.px.fill(C.night[0]);
      const P = new Pen(f);
      P.part(P.rect(2, 2, 316, 196), C.grey, { b: 1 });
      P.part(P.rect(6, 6, 308, 16), C.night, { b: 1, sh: 0 });
      font.draw(f, 'ПРИЦЕЛЬНЫЙ КОМПЬЮТЕР', 12, 10, C.mint[4], 0);
      font.draw(f, 'ШАХТА 1: ГОТОВА', 314 - 6 - font.measure('ШАХТА 1: ГОТОВА'), 10, Math.floor(this.t * 2) % 2 ? C.neonB : C.mint[3], 0);
      this.list.forEach((tg, i) => {
        const r = this.rowRect(i);
        const on = this.sel === i;
        P.part(P.rect(r.x, r.y, r.w, r.h), on ? C.teal : C.night, { b: on ? 2 : 1, sh: 0, hi: 0, ol: this.hover === i ? C.yellow[4] : C.black });
        font.draw(f, tg.name, r.x + 5, r.y + 6, on ? C.lamp : C.mint[3], 0);
      });
      font.draw(f, '1. Выбрать цель.', 10, 130, C.grey[3], 0);
      font.draw(f, '2. Нажать «Огонь».', 10, 140, C.grey[3], 0);
      const id = this.list[this.sel].id;
      this.feed.px.fill(C.black);
      FEED[id](this.feed, this.t, g);
      P.part(P.rect(VIEW.x - 3, VIEW.y - 3, VIEW.w + 6, VIEW.h + 6), C.night, { b: 0 });
      blit(f, this.feed, VIEW.x, VIEW.y);
      for (let y = VIEW.y; y < VIEW.y + VIEW.h; y += 2) for (let x = VIEW.x; x < VIEW.x + VIEW.w; x++) { const k = y * W + x; f.px[k] = S.DARKER[f.px[k]]; }
      if (id !== 'kremlin' && id !== 'pocket') {
        const cx = VIEW.x + VIEW.w / 2, cy = VIEW.y + VIEW.h / 2;
        for (let i = 6; i < 22; i++) { f.set(cx + i, cy, C.neonA); f.set(cx - i, cy, C.neonA); f.set(cx, cy + i, C.neonA); f.set(cx, cy - i, C.neonA); }
      }
      font.draw(f, 'КАМЕРА МАЯКА', VIEW.x + 3, VIEW.y + 3, C.lamp, C.black);
      font.draw(f, NOTE[id], VIEW.x, VIEW.y + VIEW.h + 6, id === 'kremlin' || id === 'pocket' ? C.red[4] : C.mint[4], 0);
      const hovF = this.hover === 'fire';
      P.part(P.rect(FIRE.x, FIRE.y, FIRE.w, FIRE.h), C.red, { b: hovF ? 4 : 3 });
      P.part(P.rect(FIRE.x + 3, FIRE.y + 3, FIRE.w - 6, FIRE.h - 6), C.red, { b: hovF ? 3 : 2, sh: 1, hi: 1 });
      S.bigText(f, 'ОГОНЬ', FIRE.x + FIRE.w / 2, FIRE.y + 8, 2, C.grey[5], C.eye, 1);
      button(f, EXIT, 'ВЫХОД', this.hover === 'exit', C.navy);
      this.cursor(f);
    }
  }

  E.panels = {
    calendar(g) { g.mode = 'panel'; g.drive = new CalendarPanel(g); return g.drive; },
    budget(g) { g.mode = 'panel'; g.drive = new BudgetPanel(g); return g.drive; },
    target(g) { g.mode = 'panel'; g.drive = new TargetPanel(g); return g.drive; }
  };
  Object.assign(E, { Panel, CalendarPanel, BudgetPanel, TargetPanel });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
