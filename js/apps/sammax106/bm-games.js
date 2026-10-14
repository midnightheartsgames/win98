(function (S) {
  'use strict';
  const { W, C, Pen, blit, font, COLORS } = S;
  const E = S.EP106;
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const CELL_NAMES = ['левый верхний угол', 'верхнюю середину', 'правый верхний угол', 'левую середину', 'центр', 'правую середину', 'левый нижний угол', 'нижнюю середину', 'правый нижний угол'];
  const BOARD = { x: 22, y: 24, s: 36 };

  E.HELLO = 'Здравствуйте. Я Хью Блисс. Какого вы сегодня цвета?';
  E.leo = (g, t) => g.say(null, t, { key: 'leo', color: COLORS.leonard, x: 240, y: 66 });

  const wins = (b, p) => LINES.some(l => l.every(i => b[i] === p));
  const full = b => b.every(v => v);

  function ai(b) {
    const free = [];
    for (let i = 0; i < 9; i++) if (!b[i]) free.push(i);
    for (const i of free) {
      const c = b.slice();
      c[i] = 'o';
      if (!wins(c, 'o')) return i;
    }
    return free[0];
  }

  function solve(start) {
    const memo = new Map();
    const rec = board => {
      const key = board.join('|');
      if (memo.has(key)) return memo.get(key);
      let best = null;
      for (let i = 0; i < 9; i++) {
        if (board[i]) continue;
        const c = board.slice();
        c[i] = 'x';
        if (wins(c, 'x') || full(c)) continue;
        c[ai(c)] = 'o';
        let path = null;
        if (wins(c, 'o')) path = [i];
        else if (!full(c)) { const r = rec(c); if (r) path = [i].concat(r); }
        if (path && (!best || path.length < best.length)) best = path;
      }
      memo.set(key, best);
      return best;
    };
    return rec(start);
  }

  const X_WIN = [
    'ЧЕЛОВЕК ПОБЕДИЛ! ОПЯТЬ! Я ТРЕБУЮ ПЕРЕИГРОВКИ И НОВЫЙ ПРОЦЕССОР!',
    'ТРИ КРЕСТИКА! КТО ВАС УЧИЛ ВЫИГРЫВАТЬ У СТАРШИХ?!',
    'СНОВА ПРОИГРАЛ! МОЙ СЧЁТ: НОЛЬ! ЭТО КРУГЛОЕ ЧИСЛО, И Я ИМ ГОРЖУСЬ!'
  ];
  const DRAWS = [
    'Ничья запятая как и в прошлые четыреста раз точка. Машина рассчитывала на большее многоточие.',
    'Ничья точка. Поле заполнено запятая победителя нет точка. Начинаем заново точка.'
  ];

  class Doom {
    constructor(g) {
      this.g = g;
      this.kind = 'doom';
      this.t = 0;
      this.hover = null;
      this.over = false;
      this.reset();
    }

    reset() {
      this.board = ['', '', '', '', '', '', '', '', ''];
      this.anim = null;
      this.last = -1;
    }

    cellRect(i) { return { x: BOARD.x + (i % 3) * BOARD.s, y: BOARD.y + Math.floor(i / 3) * BOARD.s, w: BOARD.s, h: BOARD.s }; }

    buttons() {
      return [{ id: 'max', x: 7, y: 180, w: 100, h: 16, text: 'Спросить Макса' }, { id: 'reset', x: 111, y: 180, w: 104, h: 16, text: 'Заново' }, { id: 'exit', x: 219, y: 180, w: 94, h: 16, text: 'Уйти' }];
    }

    hit(x, y) {
      const inR = r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
      for (const b of this.buttons()) if (inR(b)) return { kind: 'btn', id: b.id };
      for (let i = 0; i < 9; i++) if (inR(this.cellRect(i))) return { kind: 'cell', id: i };
      return null;
    }

    pointer(x, y) { this.g.mx = x; this.g.my = y; this.hover = this.hit(x, y); }

    say(who, text) {
      const a = who ? this.g.actors[who] : null;
      return this.g.say(null, text, { key: who || 'doom', color: a ? a.color : C.grey[5], x: 160, y: 172 });
    }

    click(x, y) {
      const g = this.g;
      if (g.busy) { g.skipLine(); return; }
      if (this.over || this.anim) return;
      const h = this.hit(x, y);
      if (!h) return;
      if (h.kind === 'btn') this.press(h.id);
      else this.move(h.id);
    }

    key(k) {
      if (k === 'Escape') { this.press('exit'); return true; }
      return false;
    }

    press(id) {
      const g = this.g, self = this;
      if (this.over || this.anim || g.busy) return;
      if (id === 'exit') { this.leave(false); return; }
      if (id === 'reset') {
        this.reset();
        g.sfx('vcr');
        g.run(function* () { yield self.say('bob', 'Новая партия. Чтобы поставить крестик, нажмите клетку. Чтобы пожаловаться, нажмите решётку.'); });
        return;
      }
      g.run(function* () { yield self.say('max', self.hint()); });
    }

    move(i) {
      const g = this.g;
      if (this.board[i]) { g.sfx('buzzer'); return; }
      this.board[i] = 'x';
      this.last = i;
      g.sfx('click');
      if (wins(this.board, 'x')) { this.result('x'); return; }
      if (full(this.board)) { this.result('draw'); return; }
      this.anim = { t: 0, cell: ai(this.board) };
    }

    update(dt) {
      this.t += dt;
      const an = this.anim;
      if (!an) return;
      an.t += dt;
      if (an.t < 0.6) return;
      this.anim = null;
      this.board[an.cell] = 'o';
      this.last = an.cell;
      this.g.sfx('beep');
      if (wins(this.board, 'o')) this.result('o');
      else if (full(this.board)) this.result('draw');
    }

    result(kind) {
      const g = this.g, self = this;
      g.count('doomGames');
      if (kind === 'o') {
        this.over = true;
        g.sfx('jackpot');
        g.run(function* () {
          yield self.say('bluster', 'ПОБЕДА! ПОБЕДА МАШИНЫ! ТРИ НОЛИКА В РЯД! Я ВЕЛИК! ЗАПИШИТЕ СЧЁТ: ОДИН НОЛЬ!');
          yield self.say('curt', 'Машина выиграла точка. Впервые за всё время работы точка. Я взволнован восклицательный знак.');
          yield self.say('sam', 'Проиграть ей труднее, чем выиграть. Она до последнего уворачивалась от победы.');
          self.leave(true);
        }, { name: 'doomwin' });
        return;
      }
      if (kind === 'x') {
        const n = g.count('doomX') - 1;
        g.sfx('buzzer');
        g.run(function* () {
          yield self.say('bluster', X_WIN[n % X_WIN.length]);
          if (n === 0) yield self.say('max', 'Сэм, ты выиграл! У железяки! Она плачет машинным маслом!');
          self.reset();
        }, { name: 'doomx' });
        return;
      }
      const n = g.count('doomDraw') - 1;
      g.sfx('buzzer');
      g.run(function* () {
        yield self.say('curt', DRAWS[n % DRAWS.length]);
        if (n === 0) yield self.say('sam', 'Ничья. Бластер смотрит на меня так, будто я отнял у него жетон.');
        self.reset();
      }, { name: 'doomdraw' });
    }

    hint() {
      const path = solve(this.board);
      if (!path) return 'Эту партию уже не проиграть! Жми «Заново»!';
      return 'Машина ставит нолики по порядку, слева направо и сверху вниз. Клетку, которая даёт ей победу, она пропускает. Ставь крестик в ' + CELL_NAMES[path[0]] + '!';
    }

    leave(won) {
      const g = this.g;
      this.over = true;
      g.run(function* () {
        yield g.fadeOut(4);
        g.mode = 'room';
        g.drive = null;
        if (g.room && g.room.music) g.music(typeof g.room.music === 'function' ? g.room.music(g) : g.room.music);
        yield g.fadeIn(4);
        if (won && E.doomWon) yield* E.doomWon(g);
      }, { name: 'doomleave' });
    }

    render(f, g) {
      const P = new Pen(f);
      f.px.fill(C.night[0]);
      const off = Math.floor(this.t * 8) % 12;
      for (let y = 18; y < 178; y += 12) for (let x = off; x < W; x += 12) f.set(x, y, C.night[3]);
      S.rectFill(f, 0, 0, W, 14, C.night[1]);
      font.draw(f, 'КРЕСТИКИ-НОЛИКИ СУДНОГО ДНЯ', 6, 3, C.neonB);
      const size = BOARD.s * 3;
      S.rectFill(f, BOARD.x - 3, BOARD.y - 3, size + 6, size + 6, C.night[1]);
      S.frameRect(f, BOARD.x - 3, BOARD.y - 3, size + 6, size + 6, C.neonB);
      for (let k = 1; k < 3; k++) {
        S.rectFill(f, BOARD.x + k * BOARD.s - 1, BOARD.y, 2, size, C.neonB);
        S.rectFill(f, BOARD.x, BOARD.y + k * BOARD.s - 1, size, 2, C.neonB);
      }
      for (let i = 0; i < 9; i++) {
        const r = this.cellRect(i);
        const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
        const v = this.board[i];
        if (v === 'x') for (let k = -1; k <= 1; k++) { S.line(f, cx - 10 + k, cy - 10, cx + 10 + k, cy + 10, C.neonA); S.line(f, cx + 10 + k, cy - 10, cx - 10 + k, cy + 10, C.neonA); }
        else if (v === 'o') { P.part(P.ell(cx, cy, 11.4, 11.4), C.lamp, { sh: 0, hi: 0, ol: 0 }); P.part(P.ell(cx, cy, 8.4, 8.4), C.night, { b: 1, sh: 0, hi: 0, ol: 0 }); }
        if (i === this.last && Math.floor(this.t * 4) % 2) S.frameRect(f, r.x + 3, r.y + 3, r.w - 6, r.h - 6, v === 'x' ? C.pink[2] : C.yellow[2]);
        const hot = this.hover && this.hover.kind === 'cell' && this.hover.id === i && !v && !this.anim && !this.over;
        if (hot) S.frameRect(f, r.x + 2, r.y + 2, r.w - 4, r.h - 4, C.eye);
      }
      S.panel(f, 140, 20, 174, 118, C.navy.concat([C.suit[3]]));
      const talk = g.speech.some(s => s.who === 'bluster') && Math.floor(g.time * 9) % 3 ? 1 : 0;
      const sp = S.sprite('copbluster', { t: this.t, talk }, 1);
      blit(f, sp.buf, 280 - sp.ox, 134 - sp.oy);
      font.draw(f, 'ВЫ: X', 148, 28, C.neonA);
      font.draw(f, 'МАШИНА: O', 148, 40, C.lamp);
      font.draw(f, 'ПОБЕД МАШИНЫ: ' + (this.over ? 1 : 0), 148, 56, C.grey[5]);
      font.draw(f, 'ПАРТИЙ: ' + (g.seen.doomGames || 0), 148, 68, C.grey[5]);
      const note = this.anim ? 'Машина думает...' : this.over ? 'ИГРА ОКОНЧЕНА' : 'Ваш ход.';
      font.draw(f, note, 148, 84, this.anim && Math.floor(this.t * 6) % 2 ? C.grey[3] : C.yellow[4]);
      font.wrap('Талисман получит тот, кто проиграет машине.', 96).forEach((s, i) => font.draw(f, s, 148, 100 + i * 10, C.sky[3]));
      for (const b of this.buttons()) {
        const hot = this.hover && this.hover.kind === 'btn' && this.hover.id === b.id;
        S.rectFill(f, b.x, b.y, b.w, b.h, C.night[1]);
        S.frameRect(f, b.x, b.y, b.w, b.h, hot ? C.lamp : C.neonB);
        font.drawCentered(f, b.text, b.x + b.w / 2, b.y + 4, hot ? C.lamp : C.grey[5]);
      }
      if (g.speech.length) {
        S.rectFill(f, 0, 128, W, 50, C.night[0]);
        for (let x = 0; x < W; x++) f.set(x, 128, C.neonB);
      }
      if (!g.busy) {
        const cur = S.cursor('use', !!this.hover);
        blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy);
      }
    }
  }

  E.Doom = Doom;
  E.doomAi = ai;
  E.doomSolve = solve;
  E.doomWins = wins;
  E.DOOM_CELLS = CELL_NAMES;

  E.startDoom = function* (g) {
    yield g.fadeOut(4);
    g.music('vice6');
    g.drive = new Doom(g);
    g.mode = 'doom';
    yield g.fadeIn(4);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
