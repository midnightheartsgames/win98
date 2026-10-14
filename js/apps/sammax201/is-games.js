(function (S) {
  'use strict';
  const { W, H, C, Pen, blit, font } = S;
  const E = S.EP201;
  const A = S.art201;
  const LET = ['А', 'Б', 'В', 'Г'];
  const TAU = Math.PI * 2;

  function button(f, b, hot) {
    S.rectFill(f, b.x, b.y, b.w, b.h, C.night[1]);
    S.frameRect(f, b.x, b.y, b.w, b.h, hot ? C.lamp : b.col || C.neonB);
    font.drawCentered(f, b.text, b.x + b.w / 2, b.y + 4, hot ? C.lamp : C.grey[5]);
  }
  const inR = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

  function leaveMode(g, after) {
    g.run(function* () {
      yield g.fadeOut(4);
      g.mode = 'room';
      g.drive = null;
      if (g.room && g.room.music) g.music(typeof g.room.music === 'function' ? g.room.music(g) : g.room.music);
      yield g.fadeIn(4);
      if (after) yield* after(g);
    }, { name: 'modeleave' });
  }

  const QUESTIONS = [
    { q: 'В каком году кончилась война тысяча восемьсот двенадцатого года?', a: ['В тысяча восемьсот двенадцатом.', 'В тысяча восемьсот пятнадцатом.', 'В тот вечер, когда я танцевала с Наполеоном.', 'Она ещё идёт.'], right: 1, vain: 2 },
    { q: 'Какой день недели идёт между вторником и четвергом?', a: ['День, когда я обедала с президентом.', 'Пятница.', 'Среда.', 'Суббота.'], right: 2, vain: 0 },
    { q: 'Какую траву кладут в соус песто?', a: ['Базилик.', 'Ромашку, которую мне подарил знаменитый дирижёр.', 'Укроп.', 'Лавровый лист.'], right: 0, vain: 1 }
  ];
  const BUG = 3;

  function judge(qn, abe, sam) {
    const Q = QUESTIONS[qn];
    const picks = { sybil: Q.right, bug: BUG, lincoln: abe, sam };
    const taken = new Set(Object.values(picks));
    for (let i = 0; i < 4; i++) if (!taken.has(i)) return { letter: i, winner: null };
    const winner = Object.keys(picks).find(k => picks[k] === Q.vain && k !== 'sybil' && k !== 'bug') || null;
    return { letter: Q.vain, winner: picks.sam === Q.vain ? 'sam' : winner };
  }

  function quizSolve(qn) {
    const Q = QUESTIONS[qn];
    const free = [0, 1, 2, 3].find(i => i !== Q.right && i !== BUG && i !== Q.vain);
    return { abe: free, sam: Q.vain };
  }

  class Quiz {
    constructor(g) {
      this.g = g;
      this.kind = 'quiz';
      this.t = 0;
      this.qn = 0;
      this.abe = -1;
      this.sam = -1;
      this.hover = null;
      this.over = false;
      this.wait = false;
    }

    buttons() {
      return [{ id: 'max', x: 6, y: 182, w: 100, h: 15, text: 'Спросить Макса' }, { id: 'go', x: 110, y: 182, w: 100, h: 15, text: 'Отвечаем!', col: C.neonA }, { id: 'exit', x: 214, y: 182, w: 100, h: 15, text: 'Уйти' }];
    }

    slot(row, i) { return { x: 150 + i * 40, y: row ? 160 : 142, w: 34, h: 14 }; }

    hit(x, y) {
      for (const b of this.buttons()) if (inR(b, x, y)) return { kind: 'btn', id: b.id };
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) if (inR(this.slot(r, i), x, y)) return { kind: r ? 'sam' : 'abe', id: i };
      return null;
    }

    pointer(x, y) { this.g.mx = x; this.g.my = y; this.hover = this.hit(x, y); }

    say(who, text) {
      const a = who ? this.g.actors[who] : null;
      return this.g.say(null, text, { key: who || 'quiz', color: a ? a.color : C.grey[5], x: 160, y: 132 });
    }

    click(x, y) {
      const g = this.g;
      if (g.busy) { g.skipLine(); return; }
      if (this.over) return;
      const h = this.hit(x, y);
      if (!h) return;
      if (h.kind === 'abe') { this.abe = h.id; g.sfx('click'); return; }
      if (h.kind === 'sam') { this.sam = h.id; g.sfx('click'); return; }
      this.press(h.id);
    }

    key(k) {
      if (k === 'Escape') { this.press('exit'); return true; }
      return false;
    }

    press(id) {
      const g = this.g, self = this;
      if (this.over || g.busy) return;
      if (id === 'exit') { this.over = true; leaveMode(g); return; }
      if (id === 'max') { g.run(function* () { yield self.say('max', self.hint()); }); return; }
      if (this.abe < 0 || this.sam < 0) { g.sfx('buzzer'); g.run(function* () { yield self.say('stinky', 'Сначала шепните Линкольну и выберите свой ответ, Сэмбо!'); }); return; }
      this.answer();
    }

    hint() {
      const Q = QUESTIONS[this.qn];
      const s = quizSolve(this.qn);
      return 'Сибил скажет правильный ответ, это ' + LET[Q.right] + '! Жучок скажет Г! Стинки засчитает букву, которую никто не назвал! Если заняты все четыре, она выберет ответ про себя! Он под буквой ' + LET[s.sam] + '! Бери его себе, а Линкольну шепни ' + LET[s.abe] + '!';
    }

    answer() {
      const g = this.g, self = this;
      const r = judge(this.qn, this.abe, this.sam);
      g.run(function* () {
        yield self.say('lincoln', 'Мой ответ, сударыня: ' + LET[self.abe] + '.');
        yield self.say('sam', 'Мой ответ: ' + LET[self.sam] + '.');
        g.sfx('cymbal');
        yield 0.4;
        if (r.winner === 'sam') {
          g.sfx('ding');
          yield self.say('stinky', 'Правильный ответ... ' + LET[r.letter] + '! Там же была я! Сэм-Макс угадал!');
          self.qn++;
          self.abe = -1; self.sam = -1;
          if (self.qn >= QUESTIONS.length) {
            self.over = true;
            g.sfx('fanfare');
            yield self.say('stinky', 'Три из трёх?! Так не бывает! В правилах этого не было!');
            leaveMode(g, E.quizWon);
            return;
          }
          yield self.say('stinky', 'Следующий вопрос!');
          return;
        }
        g.sfx('buzzer');
        if (r.winner === 'lincoln') {
          yield self.say('stinky', 'Правильный ответ ' + LET[r.letter] + ', там была я! Очко господину президенту!');
          yield self.say('lincoln', 'Сэр, я сожалею. Я лишь повторил то, что вы шепнули.');
        } else yield self.say('stinky', 'Правильный ответ: ' + LET[r.letter] + '! Какая жалость, никто не угадал!');
        yield self.say('stinky', 'Викторина окончена! Приз остаётся у Стинки! Как всегда!');
        self.over = true;
        g.count('quizLost');
        leaveMode(g);
      }, { name: 'quizanswer' });
    }

    update(dt) { this.t += dt; }

    render(f, g) {
      f.px.fill(C.mint[0]);
      for (let y = 0; y < H; y += 2) for (let x = (y >> 1) % 4; x < W; x += 4) f.set(x, y, C.teal[0]);
      S.rectFill(f, 0, 0, W, 14, C.pink[1]);
      font.drawCentered(f, 'ВИКТОРИНА У СТИНКИ', W / 2, 3, C.lamp);
      font.draw(f, 'Вопрос ' + Math.min(this.qn + 1, 3) + ' из 3', 236, 3, C.grey[5]);
      const Q = QUESTIONS[Math.min(this.qn, 2)];
      S.panel(f, 4, 18, W - 8, 34, C.navy.concat([C.suit[3]]));
      font.wrap(Q.q, 300).forEach((s, i) => font.draw(f, s, 10, 22 + i * 10, C.grey[5]));
      const who = (i) => {
        const out = [];
        if (Q.right === i) out.push('Сибил');
        if (BUG === i) out.push('Жучок');
        if (this.abe === i) out.push('Линкольн');
        if (this.sam === i) out.push('Сэм');
        return out.join(', ');
      };
      for (let i = 0; i < 4; i++) {
        const y = 56 + i * 20;
        S.rectFill(f, 6, y, W - 12, 18, i % 2 ? C.night[1] : C.night[0]);
        font.draw(f, LET[i] + ')', 10, y + 2, C.neonA);
        font.wrap(Q.a[i], 196).slice(0, 2).forEach((s, k) => font.draw(f, s, 24, y + 1 + k * 8, C.grey[5]));
        const w = who(i);
        if (w) font.draw(f, w, 226, y + 5, C.lamp);
      }
      font.draw(f, 'Шепнуть Линкольну:', 8, 145, C.sky[4]);
      font.draw(f, 'Мой ответ:', 8, 163, C.orange[4]);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) {
        const s = this.slot(r, i);
        const on = r ? this.sam === i : this.abe === i;
        const hot = this.hover && this.hover.kind === (r ? 'sam' : 'abe') && this.hover.id === i;
        S.rectFill(f, s.x, s.y, s.w, s.h, on ? (r ? C.orange[2] : C.sky[1]) : C.night[1]);
        S.frameRect(f, s.x, s.y, s.w, s.h, hot ? C.lamp : on ? C.grey[5] : C.grey[2]);
        font.drawCentered(f, LET[i], s.x + s.w / 2, s.y + 3, C.grey[5]);
      }
      for (const b of this.buttons()) button(f, b, this.hover && this.hover.kind === 'btn' && this.hover.id === b.id);
      if (g.speech.length) { S.rectFill(f, 0, 54, W, 84, C.night[0]); for (let x = 0; x < W; x++) { f.set(x, 54, C.pink[3]); f.set(x, 137, C.pink[3]); } }
      if (!g.busy) { const cur = S.cursor('use', !!this.hover); blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy); }
    }
  }

  E.QUESTIONS = QUESTIONS;
  E.quizJudge = judge;
  E.quizSolve = quizSolve;
  E.Quiz = Quiz;
  E.startQuiz = function* (g) {
    yield g.fadeOut(4);
    g.music('quiz21');
    g.drive = new Quiz(g);
    g.mode = 'quiz21';
    yield g.fadeIn(4);
  };

  const FOES = [
    { name: 'Кривой Хвост', ramp: C.rat, shorts: C.blue, speed: 1 },
    { name: 'Бабуля Зуб', ramp: C.stone, shorts: C.green, speed: 1.2 },
    { name: 'Джимми Два Зуба', ramp: C.rat, shorts: C.red, speed: 1.45 }
  ];

  class Box {
    constructor(g) {
      this.g = g;
      this.kind = 'box';
      this.t = 0;
      this.bout = 0;
      this.hover = null;
      this.over = false;
      this.reset();
    }

    reset() {
      this.hp = 3;
      this.foeHp = 3;
      this.st = 'guard';
      this.stT = 1.4;
      this.me = 'guard';
      this.meT = 0;
      this.flash = 0;
      this.pause = 1.2;
    }

    buttons() {
      return [{ id: 'punch', x: 6, y: 182, w: 74, h: 15, text: 'Удар', col: C.neonA }, { id: 'block', x: 84, y: 182, w: 74, h: 15, text: 'Блок' }, { id: 'max', x: 162, y: 182, w: 96, h: 15, text: 'Спросить Макса' }, { id: 'exit', x: 262, y: 182, w: 52, h: 15, text: 'Уйти' }];
    }

    hit(x, y) { for (const b of this.buttons()) if (inR(b, x, y)) return { kind: 'btn', id: b.id }; return null; }
    pointer(x, y) { this.g.mx = x; this.g.my = y; this.hover = this.hit(x, y); }
    say(who, text) { const a = who ? this.g.actors[who] : null; return this.g.say(null, text, { key: who || 'box', color: a ? a.color : C.grey[5], x: 160, y: 30 }); }

    click(x, y) {
      if (this.g.busy && !this.over) { const h = this.hit(x, y); if (h && (h.id === 'punch' || h.id === 'block')) { this.press(h.id); return; } this.g.skipLine(); return; }
      const h = this.hit(x, y);
      if (h) this.press(h.id);
    }

    key(k) {
      if (k === 'Escape') { this.press('exit'); return true; }
      if (k === 'ArrowUp' || k === ' ' || k === 'z') { this.press('punch'); return true; }
      if (k === 'ArrowDown' || k === 'x') { this.press('block'); return true; }
      return false;
    }

    press(id) {
      const g = this.g, self = this;
      if (this.over) return;
      if (id === 'exit') { this.over = true; leaveMode(g); return; }
      if (id === 'max') { if (!g.busy) g.run(function* () { yield self.say('max', self.hint()); }); return; }
      if (this.pause > 0 || this.me === 'hit') return;
      if (id === 'block') { this.me = 'block'; this.meT = 0.55; return; }
      if (this.me === 'punch') return;
      this.me = 'punch';
      this.meT = 0.3;
      g.sfx('whoosh');
      if (this.st === 'taunt' || this.st === 'stun') {
        this.foeHp--;
        g.sfx('punch');
        this.flash = 0.2;
        if (this.foeHp <= 0) { this.st = 'ko'; this.stT = 99; this.boutWon(); return; }
        this.st = 'hit'; this.stT = 0.45;
      } else g.sfx('thud');
    }

    hint() {
      if (this.st === 'wind') return 'Он замахивается! Жми «Блок»!';
      if (this.st === 'taunt' || this.st === 'stun') return 'Он открылся! Бей! Жми «Удар»!';
      return 'Он закрылся! В закрытого бить бесполезно! Жди, пока он поднимет руки к публике или пока ты не отобьёшь его замах, и тогда бей!';
    }

    nextFoe() {
      const g = this.g, F = FOES[this.bout];
      if (this.st === 'hit' || this.st === 'guard' || this.st === 'stun') {
        const r = g.rng.next();
        if (r < 0.55) { this.st = 'wind'; this.stT = 0.95 / F.speed; }
        else { this.st = 'taunt'; this.stT = 0.85 / F.speed; }
        return;
      }
      if (this.st === 'wind') {
        if (this.me === 'block') { this.st = 'stun'; this.stT = 1.0 / F.speed; g.sfx('clang'); return; }
        this.hp--;
        this.me = 'hit'; this.meT = 0.5;
        g.sfx('punch');
        this.flash = 0.25;
        if (this.hp <= 0) { this.boutLost(); return; }
        this.st = 'guard'; this.stT = 1.1 / F.speed;
        return;
      }
      this.st = 'guard'; this.stT = (0.9 + g.rng.next() * 0.6) / F.speed;
    }

    boutWon() {
      const g = this.g, self = this;
      g.sfx('bell');
      g.count('boxWins');
      const last = this.bout >= FOES.length - 1;
      g.run(function* () {
        if (last) {
          self.over = true;
          g.sfx('cheer');
          yield self.say('jimmy', 'Нокаут... Меня... Кукла...');
          leaveMode(g, E.boxWon);
          return;
        }
        yield self.say('jimmy', self.bout === 0 ? 'Кривой Хвост лежит! Следующая: Бабуля Зуб! Не смотрите, что старая, кусается как молодая!' : 'Бабуля в ауте! Ну всё, начальник. Теперь выхожу я!');
        self.bout++;
        self.reset();
      }, { name: 'boxnext' });
    }

    boutLost() {
      const g = this.g, self = this;
      g.sfx('bell');
      g.count('boxLost');
      this.pause = 99;
      g.run(function* () {
        yield self.say('jimmy', 'Кукла лежит! Раз, два... Ладно, вставай, кукла, бой переигрываем. Мне нужны зрители.');
        self.reset();
      }, { name: 'boxlost' });
    }

    update(dt) {
      this.t += dt;
      if (this.flash > 0) this.flash -= dt;
      if (this.over) return;
      if (this.meT > 0) { this.meT -= dt; if (this.meT <= 0) this.me = 'guard'; }
      if (this.pause > 0) { if (!this.g.busy && this.pause < 50) this.pause -= dt; return; }
      if (this.st === 'ko') return;
      this.stT -= dt;
      if (this.stT <= 0) this.nextFoe();
    }

    render(f, g) {
      const P = new Pen(f);
      S.grad(f, P.rect(0, 0, W, 120), C.night, (x, y) => 0.2 + y / 200);
      for (let i = 0; i < 40; i++) { const x = (i * 37) % W, y = 20 + (i * 13) % 70; f.set(x, y, Math.floor(this.t * 3 + i) % 4 ? C.grey[2] : C.lamp); }
      S.rectFill(f, 0, 120, W, 62, C.sky[1]);
      for (let x = 0; x < W; x++) { f.set(x, 120, C.sky[3]); f.set(x, 181, C.sky[0]); }
      for (let i = 0; i < 3; i++) S.line(f, 0, 78 + i * 12, W, 78 + i * 12, [C.red[3], C.grey[5], C.blue[3]][i]);
      for (const px of [6, 312]) S.rectFill(f, px, 70, 4, 60, C.grey[4]);
      const F = FOES[this.bout];
      const foeAct = this.st === 'wind' ? 'wind' : this.st === 'taunt' ? 'taunt' : this.st === 'stun' ? 'stun' : this.st === 'hit' ? 'hit' : this.st === 'ko' ? 'ko' : 'guard';
      const swing = this.st === 'wind' && this.stT < 0.25 ? 'punch' : foeAct;
      A.boxRat(P, 210, 168, F.speed > 1.4 ? 1.6 : 1.45, { act: swing, ramp: F.ramp, shorts: F.shorts, t: this.t });
      A.betty(P, 110, 172, 1.05, { act: this.me === 'hit' ? 'hit' : this.me === 'punch' ? 'punch' : this.me === 'block' ? 'block' : 'guard', t: this.t });
      if (this.flash > 0) for (let i = 0; i < 6; i++) S.line(f, 160, 110, 160 + Math.cos(i) * 20, 110 + Math.sin(i) * 14, C.lamp);
      S.rectFill(f, 0, 0, W, 14, C.night[1]);
      font.draw(f, 'БЕТТИ', 4, 3, C.pink[4]);
      for (let i = 0; i < 3; i++) S.rectFill(f, 44 + i * 10, 4, 8, 6, i < this.hp ? C.neonA : C.grey[1]);
      font.draw(f, F.name.toUpperCase(), 160, 3, C.grey[5]);
      for (let i = 0; i < 3; i++) S.rectFill(f, 290 + i * 10 - 30, 4, 8, 6, i < this.foeHp ? C.neonB : C.grey[1]);
      font.draw(f, 'РАУНД ' + (this.bout + 1) + ' ИЗ 3', 120, 16, C.lamp);
      const tip = this.st === 'wind' ? 'ЗАМАХ!' : this.st === 'taunt' ? 'РУКИ К ПУБЛИКЕ!' : this.st === 'stun' ? 'ОШЕЛОМЛЁН!' : '';
      if (tip && Math.floor(this.t * 6) % 2) font.drawCentered(f, tip, 210, 46, C.lamp);
      for (const b of this.buttons()) button(f, b, this.hover && this.hover.kind === 'btn' && this.hover.id === b.id);
      if (!g.busy || !this.over) { const cur = S.cursor('use', !!this.hover); blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy); }
    }
  }

  E.Box = Box;
  E.BOX_FOES = FOES;
  E.startBox = function* (g) {
    yield g.fadeOut(4);
    g.music('ring21');
    g.drive = new Box(g);
    g.mode = 'box21';
    yield g.fadeIn(4);
  };

  const ARENA = { x: 4, y: 16, w: 312, h: 150 };
  const NEED = 20, DOLLS = 30, TIME = 60;

  class Race {
    constructor(g) {
      this.g = g;
      this.kind = 'race';
      this.hover = null;
      this.over = false;
      this.start();
    }

    start() {
      const g = this.g;
      this.t = 0;
      this.left = TIME;
      this.score = 0;
      this.done = false;
      this.car = { x: 160, y: 150, a: -Math.PI / 2, v: 96 };
      this.steer = 0;
      this.dolls = [];
      for (let i = 0; i < DOLLS; i++) this.dolls.push({ x: ARENA.x + 14 + g.rng.next() * (ARENA.w - 28), y: ARENA.y + 10 + g.rng.next() * (ARENA.h - 60), a: g.rng.next() * TAU, alive: true, k: g.rng.next() * 6 });
      this.target = null;
    }

    buttons() {
      if (this.done) return [{ id: 'again', x: 60, y: 120, w: 96, h: 16, text: 'Ещё заезд' }, { id: 'exit', x: 164, y: 120, w: 96, h: 16, text: 'Уйти' }];
      return [{ id: 'max', x: 6, y: 182, w: 100, h: 15, text: 'Спросить Макса' }, { id: 'exit', x: 262, y: 182, w: 52, h: 15, text: 'Уйти' }];
    }

    hit(x, y) { for (const b of this.buttons()) if (inR(b, x, y)) return { kind: 'btn', id: b.id }; return null; }

    pointer(x, y) {
      this.g.mx = x; this.g.my = y;
      this.hover = this.hit(x, y);
      if (inR(ARENA, x, y)) this.target = { x, y };
    }

    say(who, text) { const a = who ? this.g.actors[who] : null; return this.g.say(null, text, { key: who || 'race', color: a ? a.color : C.grey[5], x: 160, y: 100 }); }

    click(x, y) {
      const h = this.hit(x, y);
      if (h) { this.press(h.id); return; }
      if (this.g.busy) this.g.skipLine();
    }

    key(k) {
      if (k === 'Escape') { this.press('exit'); return true; }
      if (k === 'ArrowLeft') { this.steer = -0.35; this.target = null; return true; }
      if (k === 'ArrowRight') { this.steer = 0.35; this.target = null; return true; }
      return false;
    }

    press(id) {
      const g = this.g, self = this;
      if (this.over) return;
      if (id === 'exit') { this.over = true; leaveMode(g); return; }
      if (id === 'again') { this.start(); g.sfx('engine'); return; }
      if (id === 'max' && !g.busy) g.run(function* () { yield self.say('max', 'Веди мышкой, Сэм! Машина едет за стрелкой! Куклы удирают от машины, загоняй их в угол и дави!'); });
    }

    update(dt) {
      if (this.over || this.done) return;
      const g = this.g;
      this.t += dt;
      this.left = Math.max(0, this.left - dt);
      const c = this.car;
      let turn = 0;
      if (this.target) {
        const want = Math.atan2(this.target.y - c.y, this.target.x - c.x);
        let d = want - c.a;
        while (d > Math.PI) d -= TAU;
        while (d < -Math.PI) d += TAU;
        if (Math.hypot(this.target.x - c.x, this.target.y - c.y) > 6) turn = Math.max(-1, Math.min(1, d * 3));
      }
      if (this.steer) { turn = Math.sign(this.steer); this.steer = S.approach(this.steer, 0, dt); }
      c.a += turn * 3.4 * dt;
      c.x += Math.cos(c.a) * c.v * dt;
      c.y += Math.sin(c.a) * c.v * dt;
      if (c.x < ARENA.x + 8 || c.x > ARENA.x + ARENA.w - 8) { c.x = Math.max(ARENA.x + 8, Math.min(ARENA.x + ARENA.w - 8, c.x)); c.a = Math.PI - c.a; g.sfx('bonk'); }
      if (c.y < ARENA.y + 8 || c.y > ARENA.y + ARENA.h - 8) { c.y = Math.max(ARENA.y + 8, Math.min(ARENA.y + ARENA.h - 8, c.y)); c.a = -c.a; g.sfx('bonk'); }
      for (const d of this.dolls) {
        if (!d.alive) continue;
        const dx = d.x - c.x, dy = d.y - c.y, dist = Math.hypot(dx, dy);
        if (dist < 10) { d.alive = false; this.score++; g.sfx('splat'); continue; }
        let sp = 22;
        if (dist < 50) { d.a = Math.atan2(dy, dx) + Math.sin(this.t * 3 + d.k) * 0.6; sp = 44; }
        else d.a += Math.sin(this.t * 1.7 + d.k) * dt * 1.5;
        d.x += Math.cos(d.a) * sp * dt;
        d.y += Math.sin(d.a) * sp * dt;
        if (d.x < ARENA.x + 4 || d.x > ARENA.x + ARENA.w - 4) { d.x = Math.max(ARENA.x + 4, Math.min(ARENA.x + ARENA.w - 4, d.x)); d.a = Math.PI - d.a; }
        if (d.y < ARENA.y + 4 || d.y > ARENA.y + ARENA.h - 4) { d.y = Math.max(ARENA.y + 4, Math.min(ARENA.y + ARENA.h - 4, d.y)); d.a = -d.a; }
      }
      const self = this;
      if (this.score >= NEED) {
        this.over = true;
        g.sfx('fanfare');
        g.run(function* () { yield self.say('bluster', 'ДВАДЦАТЬ! РЕКОРД! ВЫКЛЮЧАЙТЕ РЕАЛЬНОСТЬ!'); leaveMode(g, E.raceWon); }, { name: 'racewin' });
        return;
      }
      if (this.left <= 0) {
        this.done = true;
        g.sfx('buzzer');
        g.count('raceLost');
        g.run(function* () { yield self.say('bob', 'Время вышло. Кукол раздавлено: ' + self.score + '. Чтобы попробовать ещё раз, нажмите «Ещё заезд».'); }, { name: 'racelost' });
      }
    }

    render(f, g) {
      const P = new Pen(f);
      f.px.fill(C.night[0]);
      S.grad(f, P.rect(ARENA.x, ARENA.y, ARENA.w, ARENA.h), C.asphalt, (x, y) => 0.3 + (S.hash(x >> 1, y >> 1, 3) - 0.5) * 0.15);
      for (let x = ARENA.x + 20; x < ARENA.x + ARENA.w; x += 40) for (let y = ARENA.y; y < ARENA.y + ARENA.h; y += 3) f.set(x, y, C.neonB);
      for (let y = ARENA.y + 30; y < ARENA.y + ARENA.h; y += 50) for (let x = ARENA.x; x < ARENA.x + ARENA.w; x += 3) f.set(x, y, C.green[2]);
      S.frameRect(f, ARENA.x - 1, ARENA.y - 1, ARENA.w + 2, ARENA.h + 2, C.neonB);
      for (const d of this.dolls) {
        const x = Math.round(d.x), y = Math.round(d.y);
        if (!d.alive) { P.part(P.ell(x, y, 5, 2), C.blue, { b: 2, sh: 0, hi: 0 }); continue; }
        const hop = Math.floor(this.t * 8 + d.k) % 2;
        P.part(P.ell(x, y - 3 - hop, 4, 5), C.blue, { b: 3 });
        P.part(P.ell(x, y - 9 - hop, 3.4, 3.2), C.blue, { b: 4 });
        P.px(x - 1, y - 10 - hop, C.eye); P.px(x + 1, y - 10 - hop, C.eye);
        P.part(P.ell(x, y - 8 - hop, 1.2, 1), C.red, { b: 3, sh: 0, hi: 0, ol: 0 });
      }
      const c = this.car;
      const ca = Math.cos(c.a), sa = Math.sin(c.a);
      const pt = (fx, fy) => [c.x + ca * fx - sa * fy, c.y + sa * fx + ca * fy];
      const body = [pt(11, -5), pt(11, 5), pt(-11, 6), pt(-11, -6)].flat();
      P.part(P.poly(body), C.red, { b: 3 });
      P.part(P.poly([pt(4, -4), pt(4, 4), pt(-4, 4), pt(-4, -4)].flat()), C.sky, { b: 3, sh: 0 });
      const hood = pt(9, 0);
      A.horse(P, Math.round(hood[0]), Math.round(hood[1]) + 2, 'death', 0.35);
      S.rectFill(f, 0, 0, W, 14, C.night[1]);
      font.draw(f, 'К.О.П.С. РЕАЛЬНОСТЬ', 4, 3, C.neonB);
      font.draw(f, 'КУКЛЫ: ' + this.score + ' / ' + NEED, 160, 3, C.lamp);
      font.draw(f, 'ВРЕМЯ: ' + Math.ceil(this.left), 256, 3, this.left < 10 && Math.floor(this.t * 4) % 2 ? C.neonA : C.grey[5]);
      S.rectFill(f, 0, 168, W, 32, C.night[1]);
      font.draw(f, 'Машина едет за стрелкой мыши.', 112, 172, C.grey[4]);
      if (this.done) { S.panel(f, 40, 60, 240, 84, C.navy.concat([C.suit[3]])); font.drawCentered(f, 'ВРЕМЯ ВЫШЛО', 160, 72, C.lamp); font.drawCentered(f, 'Кукол: ' + this.score + ' из ' + NEED, 160, 90, C.grey[5]); }
      for (const b of this.buttons()) button(f, b, this.hover && this.hover.kind === 'btn' && this.hover.id === b.id);
      const cur = S.cursor(this.done ? 'use' : 'walk', !!this.hover);
      blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy);
    }
  }

  E.Race = Race;
  E.RACE = { ARENA, NEED, DOLLS, TIME };
  E.startRace = function* (g) {
    yield g.fadeOut(4);
    g.music('garage21');
    g.drive = new Race(g);
    g.mode = 'race21';
    yield g.fadeIn(4);
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
