(function (S) {
  'use strict';
  const { W, H, C, Pen, blit, font } = S;
  const E = S.EP105;
  const { TALK } = E;
  const A = S.art105;
  const { LAMP } = A;

  E.narr = function (g, text, color) {
    return g.say(null, text, { key: 'narr', color: color || C.grey[5], x: 160, y: 168 });
  };

  const ARMS = ['sword2', 'sword', 'glove', 'gun', 'jack', 'roach', 'max', 'slime'];
  const SLIME_QUIPS = [
    'Слизь повержена. Рапорт будет коротким: «Рубил. Хлюпало».',
    'Вторая слизь. Дерётся так же. Видимо, учились в одной луже.',
    'Ещё одна. Я начинаю чувствовать себя санитарной службой.',
    'Слизь разрублена. Мне её почти жаль. «Почти» тут главное слово.'
  ];

  function fx(g, kind, dur) {
    const cu = g.closeup;
    if (cu) cu.fx = { kind, t0: g.time, dur: dur || 0.6 };
  }

  function* endBattle(g) {
    yield g.fadeOut(5);
    g.closeup = null;
    g.vt.battle = null;
    if (g.room && g.room.music) g.music(typeof g.room.music === 'function' ? g.room.music(g) : g.room.music);
    yield g.fadeIn(5);
  }

  function* slimeTurn(g, id) {
    const cu = g.closeup;
    if (id === 'sword' || id === 'sword2') {
      cu.samAct = 'reach';
      g.sfx('whoosh');
      fx(g, 'slash');
      yield 0.3;
      g.sfx('splat');
      cu.foeAct = 'hit';
      yield E.narr(g, id === 'sword2' ? 'Меч +2 проходит сквозь слизь, как сквозь желе. Это и есть желе.' : 'Неимоверно длинный меч достаёт слизь с другого конца комнаты.');
      cu.foeGone = true;
      cu.samAct = '';
      cu.loot = g.time;
      cu.lootText = '+1 ОПЫТ';
      g.sfx('fanfare');
      const n = g.count('slimeKill') - 1;
      yield E.narr(g, 'ПОБЕДА! Получено 1 очко опыта. До второго уровня осталось 1 000 0' + Math.max(10, 49 - n) + '.', C.lamp);
      yield g.say('sam', SLIME_QUIPS[n % SLIME_QUIPS.length], { x: 232, y: 60 });
      g.vt.slime = false;
      g.place('slime', 'nowhere', 0, 0);
      if (!g.has('slime') && !g.f.sword2Got) {
        g.give('slime');
        g.f.slimeGot = true;
        yield E.narr(g, 'Добыча: СЛИЗЬ СЛИЗИ.', C.lamp);
        yield g.say('max', 'От слизи осталась слизь! Сэм, она скользкая, холодная и моя!', { x: 276, y: 80 });
      }
      return 'end';
    }
    if (id === 'glove') {
      g.sfx('boing');
      fx(g, 'punch');
      yield E.narr(g, 'Сэм бьёт слизь перчаткой +0. Слизь пружинит, отлетает и с обиженным хлюпом утекает под прилавок.');
      cu.foeGone = true;
      g.vt.slime = false;
      g.place('slime', 'nowhere', 0, 0);
      yield g.say('max', 'Она мнётся, Сэм! Бить желе кулаком умеют только кондитеры!', { x: 276, y: 80 });
      return 'end';
    }
    if (id === 'gun') {
      cu.samAct = 'shoot';
      g.sfx('laser');
      fx(g, 'ray');
      yield E.narr(g, 'Пиу! Луч проходит сквозь слизь. Слизь слегка загорает и, кажется, довольна.');
      cu.samAct = '';
      return 'again';
    }
    if (id === 'roach') { yield E.bug(g, 'Противник состоит из желе, сэр! Желе не ломается, сэр!'); return 'again'; }
    if (id === 'max') {
      g.sfx('eat');
      fx(g, 'punch');
      yield g.say('max', 'Кусаю! Тьфу! Черничная! Ненавижу чернику!', { x: 276, y: 80 });
      cu.foeV = 'angry';
      return 'again';
    }
    if (id === 'jack') { g.sfx('spring'); yield E.narr(g, 'Чёртик выскакивает из коробки. У слизи нет нервов, и пугаться ей нечем.'); return 'again'; }
    yield E.narr(g, 'Кормить слизь слизью? Она вырастет. Сэм передумывает.');
    return 'again';
  }

  function* panHit(g) {
    const cu = g.closeup;
    cu.foeAct = 'swing';
    g.sfx('whoosh');
    fx(g, 'pan', 1);
    yield 0.32;
    g.sfx('clang');
    g.fx.shake = 0.7;
    cu.samAct = 'ko';
    yield E.narr(g, 'ДЗЫНЬ! Сковорода находит шляпу Сэма. Дуршлаг под шляпой звенит на весь квартал.');
    yield g.say('max', g.f.jackTaken ? 'Сэм, она бьёт первой! Это нечестно! Первым всегда бью я!' : 'Сэм, она бьёт первой! И спрятаться не за что! Я проверил, я прятался за тобой!', { x: 276, y: 80 });
    g.f.auntieLost = true;
    return 'lost';
  }

  function* auntieTurn(g, id, turn) {
    const cu = g.closeup;
    if (turn === 'defend') {
      if (id === 'jack') {
        g.sfx('spring');
        if (g.f.popOff) {
          yield E.narr(g, 'Сэм открывает коробку. Чёртик выскакивает молча. Всплывающие окна запрещены.');
          return yield* panHit(g);
        }
        cu.shield = g.time;
        for (let i = 0; i < 5; i++) { g.sfx('pop'); yield 0.08; }
        cu.foeAct = 'swing';
        fx(g, 'pan', 0.5);
        yield 0.3;
        g.sfx('clang');
        yield E.narr(g, 'Из коробки лезет реклама казино Теда И. Бэра. Окно поверх окна. Сковорода звенит о рекламу и отскакивает.');
        yield g.say('auntie', 'Спам! В моём ящике! Закрыть! Закрыть! Они не закрываются!', { x: 84, y: 52 });
        cu.foeAct = '';
        return 'attack';
      }
      const what = id === 'max' ? 'Сэм прячется за Макса. Макс на голову ниже.' : id === 'roach' ? 'Сэм выставляет перед собой жучка. Жучок отдаёт честь и пригибается.' : id === 'gun' ? 'Сэм заслоняется лучемётом. Лучемёт размером с ладонь.' : 'Сэм выставляет перед собой ' + (id === 'glove' ? 'перчатку' : id === 'slime' ? 'слизь' : 'меч') + '. Сковорода шире.';
      yield E.narr(g, what);
      return yield* panHit(g);
    }
    if (id === 'sword2') {
      cu.shield = 0;
      cu.samAct = 'reach';
      g.sfx('whoosh');
      fx(g, 'slash');
      yield 0.3;
      g.sfx('clang');
      cu.foeAct = 'hit';
      yield E.narr(g, 'Меч +2 против брони +1. Арифметика на стороне Сэма.');
      g.sfx('zap');
      cu.foeAct = 'fade';
      yield g.say('auntie', 'НЕ-Е-ЕТ! Я обновлялась сегодня утром!', { x: 84, y: 52 });
      cu.foeGone = true;
      cu.samAct = '';
      g.sfx('fanfare');
      yield E.narr(g, 'ПОБЕДА! Антивирус отключён. Почта без присмотра.', C.lamp);
      g.f.auntieGone = true;
      g.place('auntie', 'nowhere', 0, 0);
      yield g.say('max', 'Ты зарубил тётушку! Сэм, я никогда тобой так не гордился!', { x: 276, y: 80 });
      return 'end';
    }
    const miss = id === 'sword' ? 'Деревянный меч +0 стучит по броне +1. Броня не замечает.' : id === 'glove' ? 'Перчатка +0 встречает броню +1. Побеждает броня.' : id === 'gun' ? 'Пиу! Антивирус отражает луч. Луч уходит в небо и сбивает облако.' : id === 'max' ? 'Макс кусает броню. Железо. Невкусно.' : id === 'roach' ? 'Жучок идёт в атаку. Тётушка машет на него тапком. Жучок отступает строем.' : 'Это её не берёт.';
    if (id === 'gun') { cu.samAct = 'shoot'; g.sfx('laser'); fx(g, 'ray'); }
    else if (id === 'max') { g.sfx('eat'); fx(g, 'punch'); }
    else { g.sfx('clang'); fx(g, 'slash'); }
    yield E.narr(g, miss);
    cu.samAct = '';
    yield g.say('auntie', 'Броня +1, милые. Всё, что +1 и слабее, я даже не чувствую.', { x: 84, y: 52 });
    cu.shield = 0;
    return 'defend';
  }

  TALK.battle5 = {
    options: (g, d) => {
      const bt = g.vt.battle || { foe: 'slime', turn: 'attack' };
      if (d.data.stage === 'pick') {
        return ARMS.filter(id => g.has(id)).map(id => ({
          id: 'w_' + id, icon: g.itemIcon(id), text: g.itemName(id), say: false,
          run: function* (gg) {
            d.data.stage = '';
            const r = bt.foe === 'slime' ? yield* slimeTurn(gg, id) : yield* auntieTurn(gg, id, bt.turn);
            if (r === 'end' || r === 'lost') { gg.endDialog(); yield* endBattle(gg); if (r === 'lost') yield* afterPan(gg); return; }
            if (r === 'attack' || r === 'defend') bt.turn = r;
          }
        })).concat([{ id: 'back', icon: 'behind5', text: 'Другое действие', say: false, run: function* () { d.data.stage = ''; } }]);
      }
      const act = bt.turn === 'defend'
        ? { id: 'defend', icon: 'defend5', text: 'Защититься предметом', say: false, run: function* () { d.data.stage = 'pick'; } }
        : { id: 'attack', icon: 'attack5', text: 'Атаковать предметом', say: false, run: function* () { d.data.stage = 'pick'; } };
      return [act, { id: 'flee', icon: 'flee5', text: 'Бежать', say: false, end: true, run: function* (gg) {
        yield E.narr(gg, bt.foe === 'slime' ? 'Сэм отступает. Слизь провожает его взглядом победителя.' : 'Сэм отступает. Тётушка грозит вслед сковородой.');
        gg.endDialog();
        yield* endBattle(gg);
      } }];
    }
  };

  function* afterPan(g) {
    const sam = g.actors.sam;
    sam.act = 'ko'; sam.keepAct = true;
    yield 1.2;
    sam.act = ''; sam.keepAct = false;
    yield g.say('sam', 'Шишка нарисованная, а болит по-настоящему.');
  }

  E.startBattle = function* (g, foe) {
    g.vt.battle = { foe, turn: foe === 'auntie' ? 'defend' : 'attack' };
    g.sfx('swell');
    yield g.fadeOut(5);
    g.closeup = { kind: 'battle5', foe, t0: g.time };
    g.music('battle5');
    yield g.fadeIn(5);
    if (foe === 'slime') yield E.narr(g, 'ГРОЗНАЯ СИНЯЯ СЛИЗЬ вступает в бой! Сила слизи: 2. Сила Сэма: 3. Исход почти ясен.');
    else {
      yield E.narr(g, 'ТЁТУШКА БИОТИК вступает в бой! Броня +1. Сковорода чугунная. Она ходит первой.');
      yield g.say('auntie', 'В карантин, голубчики!', { x: 84, y: 52 });
    }
    yield g.talkTo('battle5');
  };

  const NODES = ['kit', 'biv', 'hol', 'cas', 'gran', 'trs', 'mob', 'bosco', 'lob'];
  const NPOS = { kit: [0, 0], biv: [1, 0], hol: [2, 0], cas: [0, 1], gran: [1, 1], trs: [2, 1], mob: [0, 2], bosco: [1, 2], lob: [2, 2] };
  const NNAME = { kit: ['Котята', 'за мир'], biv: ['Рой Г. Бив'], hol: ['Знатоки', 'Голливуда'], cas: ['Сетевое', 'казино'], gran: ['Бабуля', 'Боско'], trs: ['Казна', 'США'], mob: ['Игрушечная', 'мафия'], bosco: ['Боско'], lob: ['Лоббисты'] };
  const SAY = { kit: 'Котята', hol: 'Голливуд', cas: 'Казино', gran: 'Бабуля Боско', trs: 'Казна', mob: 'Мафия', lob: 'Лоббисты' };
  const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const at = (c, r) => NODES.find(n => NPOS[n][0] === c && NPOS[n][1] === r);
  const VALID = {};
  for (const n of NODES) VALID[n] = DIRS.map((d, i) => (at(NPOS[n][0] + d[0], NPOS[n][1] + d[1]) ? i : -1)).filter(i => i >= 0);
  const ACT = NODES.filter(n => n !== 'biv' && n !== 'bosco');
  const INIT = { kit: 1, hol: 3, cas: 1, gran: 0, trs: 3, mob: 0, lob: 0 };
  const CELL = { x0: 7, y0: 17, w: 102, h: 52, bw: 84, bh: 36 };
  const GUESS = ['ЭЛЬБОСКОДРИЛ', '12345', 'ПАРОЛЬ'];

  function cook(state, n) {
    const d = state.a[n];
    const t = at(NPOS[n][0] + DIRS[d][0], NPOS[n][1] + DIRS[d][1]);
    const ns = { a: Object.assign({}, state.a), m: Object.assign({}, state.m) };
    const amt = ns.m[n] || 0;
    ns.m[n] = 0;
    ns.m[t] = (ns.m[t] || 0) + amt;
    const v = VALID[n];
    ns.a[n] = v[(v.indexOf(d) + 1) % v.length];
    return { state: ns, to: t, amt };
  }

  function solve(start) {
    const key = s => ACT.map(n => s.a[n]).join('') + '|' + NODES.map(n => s.m[n] || 0).join(',');
    const seen = new Map([[key(start), null]]);
    let q = [start];
    for (let depth = 0; depth < 18 && q.length; depth++) {
      const nq = [];
      for (const s of q) {
        if ((s.m.bosco || 0) >= 1000) {
          const path = [];
          let k = key(s);
          while (seen.get(k)) { const [pk, mv] = seen.get(k); path.push(mv); k = pk; }
          return path.reverse();
        }
        if ((s.m.biv || 0) > 0) continue;
        for (const n of ACT) {
          const ns = cook(s, n).state;
          const k = key(ns);
          if (!seen.has(k)) { seen.set(k, [key(s), n]); nq.push(ns); }
        }
      }
      q = nq;
    }
    return null;
  }

  class Bank {
    constructor(g) {
      this.g = g;
      this.kind = 'bank';
      this.t = 0;
      this.hover = null;
      this.ask = false;
      this.anim = null;
      this.over = false;
      this.unlocked = !!g.f.bankUnlocked;
      this.reset();
    }

    reset() { this.state = { a: Object.assign({}, INIT), m: { cas: 500, lob: 500 } }; }

    box(n) {
      const [c, r] = NPOS[n];
      return { x: CELL.x0 + c * CELL.w + (CELL.w - CELL.bw) / 2, y: CELL.y0 + r * CELL.h + (CELL.h - CELL.bh) / 2, w: CELL.bw, h: CELL.bh };
    }

    buttons() {
      return [{ id: 'max', x: 7, y: 180, w: 100, h: 16, text: 'Спросить Макса' }, { id: 'reset', x: 111, y: 180, w: 104, h: 16, text: 'Вернуть как было' }, { id: 'exit', x: 219, y: 180, w: 94, h: 16, text: 'Уехать' }];
    }

    guesses() { return (this.g.f.passKnown ? [E.PASSWORD] : []).concat(GUESS, ['Отмена']); }

    askRect(i) { return { x: 96, y: 66 + i * 13, w: 128, h: 12 }; }

    hit(x, y) {
      const inR = r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
      if (this.ask) {
        const list = this.guesses();
        for (let i = 0; i < list.length; i++) if (inR(this.askRect(i))) return { kind: 'guess', id: list[i] };
        return null;
      }
      for (const b of this.buttons()) if (inR(b)) return { kind: 'btn', id: b.id };
      for (const n of NODES) if (inR(this.box(n))) return { kind: 'node', id: n };
      return null;
    }

    pointer(x, y) { this.g.mx = x; this.g.my = y; this.hover = this.hit(x, y); }

    say(who, text) {
      const a = who ? this.g.actors[who] : null;
      return this.g.say(null, text, { key: who || 'bank', color: a ? a.color : C.grey[5], x: 160, y: 172 });
    }

    click(x, y) {
      const g = this.g;
      if (g.busy) { g.skipLine(); return; }
      if (this.over || this.anim) return;
      const h = this.hit(x, y);
      if (!h) { if (this.ask) this.ask = false; return; }
      if (h.kind === 'guess') this.guess(h.id);
      else if (h.kind === 'btn') this.press(h.id);
      else this.node(h.id);
    }

    key(k) {
      if (k === 'Escape') { if (this.ask) this.ask = false; else this.press('exit'); return true; }
      return false;
    }

    guess(id) {
      const g = this.g, self = this;
      this.ask = false;
      if (id === 'Отмена') return;
      g.sfx('type');
      if (id === E.PASSWORD) {
        this.unlocked = true;
        g.f.bankUnlocked = true;
        g.sfx('ding');
        g.run(function* () {
          yield self.say('internet', 'Пароль принят. Добро пожаловать, БОСКО. Остаток на счёте: ноль. Сочувствую.');
          yield self.say('internet', 'Правила стирки. Кнопка «сварить» отправляет деньги счёта по его стрелке. После перевода стрелка поворачивается.');
          yield self.say('sam', 'Остаток ноль, а нужен миллиард. Люблю задачи с круглыми числами.');
        });
        return;
      }
      g.sfx('buzzer');
      g.run(function* () {
        yield self.say('internet', 'Пароль «' + id + '» неверный. Осталось попыток: бесконечно. Я никуда не тороплюсь.');
        if (!g.f.passKnown && !g.seen.bankGuess) { g.seen.bankGuess = 1; yield self.say('max', 'Гадать можно до пенсии! Попробуй «Макс», Сэм! Это пароль ко всему, что у меня есть!'); }
      });
    }

    press(id) {
      const g = this.g, self = this;
      if (id === 'exit') { this.leave(false); return; }
      if (id === 'reset') {
        this.reset();
        g.sfx('vcr');
        g.run(function* () { yield self.say('internet', 'Отчёты расстираны обратно. Деньги лежат там, где лежали. Никто ничего не видел.'); });
        return;
      }
      g.run(function* () { yield self.say('max', self.hint()); });
    }

    hint() {
      const s = this.state;
      if (!this.unlocked) return this.g.f.passKnown ? 'Жми на замок у Боско и вводи пароль «БОСКО»!' : 'Счёт Боско под замком. Пароля мы не знаем! Он наколот на настоящем Боско!';
      if ((s.m.biv || 0) > 0) return 'Деньги уплыли к Рою Г. Биву! Оттуда их не достать. Жми «Вернуть как было»!';
      const path = solve(s);
      if (!path || !path.length) return 'Я запутался в стрелках. Жми «Вернуть как было», начнём сначала!';
      return 'Каждый счёт шлёт деньги по своей стрелке, а потом стрелка поворачивается. Сейчас жми «' + SAY[path[0]] + '»!';
    }

    node(n) {
      const g = this.g, self = this;
      if (n === 'biv') {
        g.run(function* () {
          yield self.say('internet', 'Счёт закрыт паролем. Владелец: Рой Г. Бив. Всё, что сюда приходит, остаётся у владельца.');
          if (!g.f.knowBiv) {
            g.f.knowBiv = true;
            yield self.say('sam', 'Рой Г. Бив. Верхний счёт, и все стрелки рано или поздно смотрят на него. Имя похоже на псевдоним.');
            yield self.say('max', 'Или на чих!');
          }
        });
        return;
      }
      if (n === 'bosco') {
        if (this.unlocked) { g.run(function* () { yield self.say('sam', 'Счёт Боско открыт. На нём ' + (self.state.m.bosco || 0) + ' миллионов. Нужна тысяча.'); }); return; }
        this.ask = true;
        g.sfx('click');
        return;
      }
      if (!this.unlocked) {
        g.sfx('buzzer');
        g.run(function* () { yield self.say('internet', 'Сначала войдите в счёт получателя. Замок висит на счёте БОСКО.'); });
        return;
      }
      const r = cook(this.state, n);
      g.sfx(r.amt ? 'cash' : 'click');
      this.anim = { from: n, to: r.to, amt: r.amt, t: 0, next: r.state };
    }

    update(dt) {
      this.t += dt;
      const an = this.anim;
      if (!an) return;
      an.t += dt;
      if (an.t < (an.amt ? 0.55 : 0.15)) return;
      this.state = an.next;
      this.anim = null;
      const g = this.g, self = this;
      if (an.to === 'biv' && an.amt) {
        g.sfx('slurp');
        g.run(function* () {
          yield self.say('internet', 'Комиссия банка составила сто процентов. Спасибо, что стираете у нас.');
          if (!g.seen.bivAte) { g.seen.bivAte = 1; yield self.say('sam', 'Полмиллиарда ушло Рою Г. Биву. Стрелка показывала прямо на него, а я не посмотрел.'); yield self.say('max', 'Хорошо, что тут есть кнопка «Вернуть как было»! В настоящем банке такой нет, я проверял!'); }
        });
      } else if ((this.state.m.bosco || 0) >= 1000) this.win();
    }

    win() {
      const g = this.g, self = this;
      this.over = true;
      g.f.paid = true;
      g.sfx('jackpot');
      g.run(function* () {
        yield self.say('internet', 'На счёте БОСКО один миллиард долларов. Деньги чистые, как слеза налогового инспектора.');
        yield self.say('max', 'Миллиард! Сэм, мы только что обокрали казино, лоббистов и, кажется, меня!');
        yield self.say('sam', 'Казна была твоя, Макс. Считай это расходами на оборону.');
        self.leave(true);
      }, { name: 'bankwin' });
    }

    leave(won) {
      const g = this.g;
      this.over = true;
      g.run(function* () {
        yield g.fadeOut(4);
        g.mode = 'room';
        g.drive = null;
        yield* g.goRoom('street2', { x: E.OX + 80, y: 164, dir: 's' }, { from: won ? 'bankwon' : 'bank' });
      }, { name: 'bankleave' });
    }

    arrowPts(n) {
      const b = this.box(n);
      const d = DIRS[this.state.a[n]];
      const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
      const x0 = cx + d[0] * (b.w / 2 - 1), y0 = cy + d[1] * (b.h / 2 - 1);
      const len = d[0] ? CELL.w - CELL.bw : CELL.h - CELL.bh;
      return { x0, y0, x1: x0 + d[0] * (len + 1), y1: y0 + d[1] * (len + 1), d };
    }

    render(f, g) {
      const P = new Pen(f);
      const all = new S.Mask(0, 0, W, H); all.m.fill(1);
      S.grad(f, all, [C.night[0], C.green[0], C.green[1]], (x, y) => y / H * 0.9);
      for (let x = 0; x < W; x += 16) for (let y = 16; y < 176; y += 16) if ((x + y + Math.floor(this.t * 4) * 16) % 64 === 0) font.draw(f, '$', x + 4, y, C.green[1], 0);
      S.rectFill(f, 0, 0, W, 14, C.night[1]);
      font.draw(f, 'БАНКО ЛАВАДЕРО', 6, 3, C.lamp);
      font.draw(f, 'стираем до белизны', 110, 3, C.neonB);
      font.draw(f, this.unlocked ? 'ЦЕЛЬ: $1000 МЛН' : 'СЧЁТ ПОД ЗАМКОМ', 226, 3, C.yellow[4]);
      for (const n of ACT) {
        const a = this.arrowPts(n);
        const hot = this.hover && this.hover.id === n;
        const col = hot ? C.lamp : C.yellow[3];
        for (let k = -1; k <= 1; k++) S.line(f, a.x0 + (a.d[1] ? k : 0), a.y0 + (a.d[0] ? k : 0), a.x1 + (a.d[1] ? k : 0), a.y1 + (a.d[0] ? k : 0), col);
        const hx = a.x1, hy = a.y1;
        P.part(P.poly([hx + a.d[0] * 3, hy + a.d[1] * 3, hx - a.d[0] * 5 + a.d[1] * 5, hy - a.d[1] * 5 + a.d[0] * 5, hx - a.d[0] * 5 - a.d[1] * 5, hy - a.d[1] * 5 - a.d[0] * 5]), hot ? LAMP : C.yellow, { b: 3, sh: 0, hi: 0 });
      }
      for (const n of NODES) {
        const b = this.box(n);
        const special = n === 'biv' || n === 'bosco';
        const locked = n === 'biv' || (n === 'bosco' && !this.unlocked);
        const hot = this.hover && this.hover.kind === 'node' && this.hover.id === n && !this.ask;
        S.panel(f, b.x, b.y, b.w, b.h, n === 'biv' ? C.purple : n === 'bosco' ? C.orange : C.navy.concat([C.suit[3]]));
        if (hot) S.frameRect(f, b.x, b.y, b.w, b.h, C.lamp);
        const name = NNAME[n];
        name.forEach((s, i) => font.draw(f, s, b.x + 5, b.y + 4 + i * 9, special ? C.lamp : C.grey[5]));
        const amt = this.state.m[n] || 0;
        const label = locked && n === 'biv' ? '$ ???' : '$' + amt + ' млн';
        font.draw(f, label, b.x + b.w - 5 - font.measure(label), b.y + (name.length > 1 ? 24 : 15), amt ? C.lamp : C.grey[3]);
        if (locked) {
          const lx = b.x + b.w - 14, ly = b.y + 4;
          S.frameRect(f, lx + 2, ly, 6, 5, C.grey[4]);
          S.rectFill(f, lx, ly + 4, 10, 7, C.gold[3]);
          f.set(lx + 5, ly + 7, C.black);
        } else if (!special) font.draw(f, 'сварить', b.x + 5, b.y + 25, hot ? C.lamp : C.neonB, 0);
      }
      const an = this.anim;
      if (an && an.amt) {
        const a = this.box(an.from), b = this.box(an.to);
        const k = Math.min(1, an.t / 0.5);
        for (let i = 0; i < 4; i++) {
          const kk = Math.max(0, Math.min(1, k * 1.3 - i * 0.1));
          A.coin(P, a.x + a.w / 2 + (b.x + b.w / 2 - a.x - a.w / 2) * kk, a.y + a.h / 2 + (b.y + b.h / 2 - a.y - a.h / 2) * kk, 4, Math.floor(this.t * 10 + i) % 4);
        }
      }
      for (const b of this.buttons()) {
        const hot = this.hover && this.hover.kind === 'btn' && this.hover.id === b.id;
        S.rectFill(f, b.x, b.y, b.w, b.h, C.night[1]);
        S.frameRect(f, b.x, b.y, b.w, b.h, hot ? C.lamp : C.green[3]);
        font.drawCentered(f, b.text, b.x + b.w / 2, b.y + 4, hot ? C.lamp : C.grey[5]);
      }
      if (this.ask) {
        const list = this.guesses();
        S.panel(f, 84, 44, 152, 26 + list.length * 13, C.navy.concat([C.suit[3]]));
        font.drawCentered(f, 'ПАРОЛЬ ОТ СЧЁТА БОСКО', 160, 50, C.yellow[4]);
        list.forEach((s, i) => {
          const r = this.askRect(i);
          const hot = this.hover && this.hover.kind === 'guess' && this.hover.id === s;
          font.drawCentered(f, s, 160, r.y + 2, hot ? C.lamp : C.grey[5]);
        });
      }
      if (g.speech.length) {
        S.rectFill(f, 0, 140, W, 38, C.night[0]);
        for (let x = 0; x < W; x++) f.set(x, 140, C.green[3]);
      }
      if (!g.busy) {
        const cur = S.cursor('use', !!this.hover);
        blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy);
      }
    }
  }

  const T15 = {
    west: { title: 'УЛИЦА, ЗАПАДНЫЙ КОНЕЦ', color: 'neonB', exits: { east: 'east', nw: 'sybil' } },
    east: { title: 'УЛИЦА, ВОСТОЧНЫЙ КОНЕЦ', color: 'lamp', exits: { west: 'west' } },
    sybil: { title: 'У СИБИЛ', color: 'tvA', exits: { se: 'west' } },
    depths: { title: 'БЕЗДНА ОТЧАЯНИЯ', color: 'neonA', exits: { up: 'west' } }
  };
  const DIRNAME = { east: 'НА ВОСТОК', west: 'НА ЗАПАД', nw: 'НА СЕВЕРО-ЗАПАД', se: 'НА ЮГО-ВОСТОК', down: 'ВНИЗ', up: 'ВВЕРХ' };
  const OBJ = { internet: 'ИНТЕРНЕТ', respect: 'УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ', hole: 'ДЫРА', bosco: 'ЛАВКА БОСКО', lake: 'ОЗЕРО ТОШНОТВОРНОЙ ПРЕЛЕСТИ', card: 'РЕДКАЯ ФОЛЬГИРОВАННАЯ КАРТОЧКА', presence: 'ШАРКАЮЩЕЕ КОРПОРАТИВНОЕ ПРИСУТСТВИЕ' };
  const VERBS = [['go', 'ИДТИ'], ['take', 'ВЗЯТЬ'], ['use', 'ПРИМЕНИТЬ'], ['look', 'ОСМОТРЕТЬ'], ['max', 'СПРОСИТЬ МАКСА']];

  class Text15 {
    constructor(g) {
      this.g = g;
      this.kind = 'text15';
      this.t = 0;
      this.room = 'west';
      this.at = { respect: 'west', bosco: 'east', card: 'sybil' };
      this.hole = false;
      this.sweet = false;
      this.sick = false;
      this.over = false;
      this.lines = [];
      this.shown = 0;
      this.menu = { kind: 'main' };
      this.hover = -1;
      this.moves = 0;
      this.print('РЕАЛЬНОСТЬ 1.5', 'lamp');
      this.print('Графика не загрузилась. Музыка не загрузилась. Осталось то, что было в самом начале: буквы.', 'grey');
      this.describe();
    }

    objName(id) { return id === 'bosco' && this.sweet ? 'ТОШНОТВОРНАЯ ЛАВКА БОСКО' : OBJ[id]; }

    print(text, color) {
      const col = color === 'grey' ? C.grey[4] : C[color || T15[this.room].color] || C.neonB;
      for (const ln of font.wrap(text, 300)) this.lines.push({ text: ln, col });
      this.lines.push({ text: '', col });
      if (this.lines.length > 60) { const cut = this.lines.length - 60; this.lines.splice(0, cut); this.shown = Math.max(0, this.shown - cut); }
    }

    here() {
      const list = [];
      if (this.room === 'west') { list.push('internet'); if (this.hole) list.push('hole'); }
      if (this.room === 'sybil') list.push('lake');
      if (this.room === 'depths') list.push('presence');
      for (const id of ['respect', 'bosco', 'card']) if (this.at[id] === this.room) list.push(id);
      return list;
    }

    inv() { return ['respect', 'bosco', 'card'].filter(id => this.at[id] === 'inv'); }

    exits() {
      const ex = Object.assign({}, T15[this.room].exits);
      if (this.room === 'west' && this.hole) ex.down = 'depths';
      return ex;
    }

    describe() {
      const r = this.room;
      this.print(T15[r].title, T15[r].color);
      if (r === 'west') {
        this.print('Вы стоите на улице, от которой осталось одно название. Здесь ИНТЕРНЕТ. Она большая, зелёная и чихает так, что дрожат буквы.' + (this.at.respect === 'west' ? ' На земле лежит УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ. Кто-то его выронил.' : '') + (this.hole ? ' В земле зияет ДЫРА.' : ''));
      } else if (r === 'east') {
        this.print(this.at.bosco === 'east' ? 'Здесь стоит ЛАВКА БОСКО. Она небольшая и почему-то ни к чему не прибита.' : 'Здесь стояла ЛАВКА БОСКО. Теперь тут ровное место и табличка «Ушёл на обед».');
      } else if (r === 'sybil') {
        this.print('Посреди комнаты раскинулось ОЗЕРО ТОШНОТВОРНОЙ ПРЕЛЕСТИ. В нём плавают котята, сердечки и открытки с закатами.' + (this.at.card === 'sybil' ? ' На берегу блестит РЕДКАЯ ФОЛЬГИРОВАННАЯ КАРТОЧКА.' : ''));
      } else {
        this.print(this.sick ? 'Темно и сыро. В углу ШАРКАЮЩЕЕ КОРПОРАТИВНОЕ ПРИСУТСТВИЕ пишет жалобу на котят. Ему до сих пор нехорошо.' + (this.at.respect === 'depths' ? ' УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ валяется без присмотра.' : '') : 'Темно и сыро. Здесь ШАРКАЮЩЕЕ КОРПОРАТИВНОЕ ПРИСУТСТВИЕ. Оно держит УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ и составляет на него отчёт.');
      }
      this.print('Выходы: ' + Object.keys(this.exits()).map(d => DIRNAME[d].replace('НА ', '')).join(', ') + '.', 'grey');
    }

    options() {
      const m = this.menu;
      if (this.over) return [];
      if (m.kind === 'main') return VERBS.map(([id, text]) => ({ id, text }));
      const back = { id: 'back', text: 'НАЗАД' };
      if (m.kind === 'go') return Object.keys(this.exits()).map(d => ({ id: d, text: DIRNAME[d] })).concat([back]);
      if (m.kind === 'take') return this.here().map(id => ({ id, text: this.objName(id) })).concat([back]);
      if (m.kind === 'look') return this.here().concat(this.inv()).map(id => ({ id, text: this.objName(id) })).concat([back]);
      if (m.kind === 'use') return this.inv().map(id => ({ id, text: this.objName(id) })).concat([back]);
      if (m.kind === 'with') return this.here().concat(this.inv().filter(id => id !== m.item)).map(id => ({ id, text: 'К: ' + this.objName(id) })).concat([back]);
      return [back];
    }

    optRect(i) { return { x: 8, y: 130 + i * 10, w: 236, h: 10 }; }

    hit(x, y) {
      const opts = this.options();
      for (let i = 0; i < opts.length; i++) { const r = this.optRect(i); if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return i; }
      return -1;
    }

    pointer(x, y) { this.g.mx = x; this.g.my = y; this.hover = this.hit(x, y); }

    typing() { return this.shown < this.total(); }

    total() { let n = 0; for (const l of this.lines) n += l.text.length + 1; return n; }

    click(x, y) {
      const g = this.g;
      if (g.busy) { g.skipLine(); return; }
      if (this.typing()) { this.shown = this.total(); return; }
      const i = this.hit(x, y);
      if (i < 0) return;
      this.pick(this.options()[i].id);
    }

    key(k) {
      if (this.typing()) { this.shown = this.total(); return true; }
      if (/^[1-9]$/.test(k)) { const o = this.options()[parseInt(k, 10) - 1]; if (o) this.pick(o.id); return true; }
      if (k === 'Escape') { if (this.menu.kind === 'main') return false; this.menu = { kind: 'main' }; return true; }
      return false;
    }

    pick(id) {
      const m = this.menu;
      this.g.sfx('type');
      if (id === 'back') { this.menu = { kind: 'main' }; return; }
      if (m.kind === 'main') {
        if (id === 'max') { this.cmd('max'); return; }
        if (id === 'use' && !this.inv().length) { this.echo('ПРИМЕНИТЬ'); this.print('У вас ничего нет. Даже графики.'); return; }
        this.menu = { kind: id };
        return;
      }
      if (m.kind === 'use') { this.menu = { kind: 'with', item: id }; return; }
      this.menu = { kind: 'main' };
      if (m.kind === 'with') this.cmd('use', m.item, id);
      else this.cmd(m.kind, id);
    }

    echo(text) { this.print('> ' + text, 'grey'); }

    cmd(verb, a, b) {
      if (this.over) return;
      this.moves++;
      if (verb === 'go') { this.echo('ИДТИ ' + DIRNAME[a]); this.go(a); }
      else if (verb === 'take') { this.echo('ВЗЯТЬ ' + this.objName(a)); this.take(a); }
      else if (verb === 'look') { this.echo('ОСМОТРЕТЬ ' + this.objName(a)); this.look(a); }
      else if (verb === 'use') { this.echo('ПРИМЕНИТЬ ' + this.objName(a) + ' К ' + this.objName(b)); this.use(a, b); }
      else if (verb === 'max') { this.echo('СПРОСИТЬ МАКСА'); this.print('МАКС говорит: «' + this.hint() + '»', 'grey'); }
    }

    go(d) {
      const to = this.exits()[d];
      if (!to) { this.print('Туда дороги нет. Её не успели написать.'); return; }
      this.room = to;
      if (d === 'down') this.print('Вы прыгаете в ДЫРУ. Падать недолго: высоту тоже не успели написать.', 'grey');
      this.describe();
    }

    take(id) {
      if (this.at[id] === 'inv') { this.print('Это у вас уже есть.'); return; }
      if (id === 'respect') {
        if (this.room === 'west' && !this.hole) {
          this.hole = true;
          this.at.respect = 'depths';
          this.print('Вы тянетесь за УВАЖЕНИЕМ. Оно выскальзывает, катится по буквам и падает в ДЫРУ, которой секунду назад не было. Текстовые игры всегда так поступают.');
          return;
        }
        if (!this.sick) { this.print('ПРИСУТСТВИЕ прижимает УВАЖЕНИЕ к тому месту, где у него могла бы быть грудь. «Сначала согласуйте», шаркает оно.'); return; }
        this.at.respect = 'inv';
        this.print('Вы берёте УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ. Оно тёплое и слегка помятое отчётом.');
        return;
      }
      if (id === 'bosco') { this.at.bosco = 'inv'; this.print('Вы берёте ЛАВКУ БОСКО и кладёте в карман. В текстовой игре вещь весит столько, сколько про неё написано. Про вес тут ни слова.'); return; }
      if (id === 'card') { this.at.card = 'inv'; this.print('Вы берёте РЕДКУЮ ФОЛЬГИРОВАННУЮ КАРТОЧКУ. Она блестит. Зачем она нужна, не знает никто. Поэтому она и редкая.'); return; }
      if (id === 'internet') this.print('ИНТЕРНЕТ слишком большая. И простуженная. Насморк ей прислали вы.');
      else if (id === 'hole') this.print('ДЫРУ нельзя взять. В неё можно только упасть.');
      else if (id === 'lake') this.print('ОЗЕРО утекает сквозь пальцы. На пальцах остаются блёстки.');
      else this.print('ПРИСУТСТВИЕ нельзя взять. Оно само берёт. В основном премии.');
    }

    look(id) {
      const T = {
        internet: 'ИНТЕРНЕТ лежит поперёк улицы. Нос красный, глаза слезятся. «Если я упаду, я заберу всех, кто в сети», говорит она. «Мне так велели. Жалеть я разучилась. Кажется, я что-то выронила».',
        respect: this.at.respect === 'inv' ? 'УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ. Маленький файл. Без него большие системы делают большие глупости.' : 'УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ. На бирке написано: «Собственность Интернета. Удалено по просьбе Р. Г. Б.»',
        hole: 'ДЫРА. Глубокая. Снизу тянет сыростью и квартальной отчётностью.',
        bosco: this.sweet ? 'ТОШНОТВОРНАЯ ЛАВКА БОСКО. Вся в котятах и блёстках. Боско бы этого не пережил.' : 'ЛАВКА БОСКО. В окне табличка: «Торг неуместен». Даже в текстовом виде.',
        lake: 'ОЗЕРО ТОШНОТВОРНОЙ ПРЕЛЕСТИ. Сюда Реальность 2.0 сливала всё, что нравилось бета-тестерам. Смотреть дольше трёх секунд опасно.',
        card: 'РЕДКАЯ ФОЛЬГИРОВАННАЯ КАРТОЧКА. На ней нарисован дракон +3. Сзади мелко: «Собери все 900».',
        presence: this.sick ? 'ПРИСУТСТВИЕ позеленело и пишет жалобу в трёх экземплярах. На вас оно больше не смотрит.' : 'ШАРКАЮЩЕЕ КОРПОРАТИВНОЕ ПРИСУТСТВИЕ. Формы у него нет. Есть пропуск и привычка всё оптимизировать. Милого оно не выносит.'
      };
      this.print(T[id] || 'Ничего особенного. Буквы как буквы.');
    }

    use(a, b) {
      if (this.at[a] !== 'inv') { this.print('У вас этого нет. У вас есть только то, что вы взяли.'); return; }
      if (a === 'respect' && b === 'internet') { this.finish(); return; }
      if (a === 'bosco' && b === 'lake') {
        if (this.sweet) { this.print('Лавка и так вся в котятах. Ещё слой, и она замурлычет.'); return; }
        this.sweet = true;
        this.print('Вы окунаете ЛАВКУ БОСКО в ОЗЕРО. Лавка покрывается котятами, блёстками и одним закатом. Теперь это ТОШНОТВОРНАЯ ЛАВКА БОСКО.');
        return;
      }
      if (a === 'bosco' && b === 'presence') {
        if (!this.sweet) { this.print('ПРИСУТСТВИЕ оценивает ЛАВКУ БОСКО как непрофильный актив и зевает. Ему нужно что-нибудь противнее. С его точки зрения противнее.'); return; }
        if (this.sick) { this.print('ПРИСУТСТВИЮ уже плохо. Добивать его котятами было бы жестоко. Вы подумываете об этом.'); return; }
        this.sick = true;
        this.print('Вы показываете ПРИСУТСТВИЮ ТОШНОТВОРНУЮ ЛАВКУ БОСКО. Котята смотрят на него с надеждой. ПРИСУТСТВИЮ становится дурно. Оно роняет УВАЖЕНИЕ и шаркает в угол писать жалобу.');
        return;
      }
      if (a === 'bosco' && b === 'internet') { this.print(this.sweet ? 'ИНТЕРНЕТ смотрит на котят и чихает. Котята разлетаются. Становится только хуже.' : 'Вы предлагаете ИНТЕРНЕТУ ЛАВКУ БОСКО. «У меня таких миллион», говорит она. «Все закрыты».'); return; }
      if (a === 'bosco' && b === 'hole') { this.print('Бросать ЛАВКУ БОСКО в ДЫРУ жалко. Там кто-то шаркает. Может, ему она пригодится лично.'); return; }
      if (a === 'card' && b === 'presence') { this.print('ПРИСУТСТВИЕ изучает КАРТОЧКУ. «Коллекционная ценность не подтверждена», шаркает оно и возвращает её с печатью «Отклонено».'); return; }
      if (a === 'card' && b === 'internet') { this.print('ИНТЕРНЕТ смотрит на КАРТОЧКУ. «У меня есть все девятьсот», говорит она. «Ни одна меня не обрадовала».'); return; }
      if (a === 'card' && b === 'lake') { this.print('Вы пускаете КАРТОЧКУ по ОЗЕРУ. Она делает три блинчика и возвращается. Фольга.'); return; }
      if (a === 'respect' && b === 'presence') { this.print('Отдать УВАЖЕНИЕ обратно ПРИСУТСТВИЮ? Оно подошьёт его в папку, и больше вы его не увидите.'); return; }
      if (a === 'respect' && b === 'lake') { this.print('Вы подносите УВАЖЕНИЕ к ОЗЕРУ. Котята кланяются. УВАЖЕНИЕ кланяется в ответ. Все очень вежливы, но толку нет.'); return; }
      if (a === 'respect' && b === 'hole') { this.print('Снова уронить УВАЖЕНИЕ в ДЫРУ? Один раз это уже случилось само.'); return; }
      if (a === 'respect') { this.print('УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ к этому не применяется. Это, строго говоря, неживое.'); return; }
      this.print('Вы применяете одно к другому. Буквы перемешиваются и встают обратно. Ничего не произошло.');
    }

    hint() {
      if (this.at.respect === 'west' && !this.hole) return 'Хватай УВАЖЕНИЕ, пока лежит! Жми ВЗЯТЬ!';
      if (this.at.respect === 'inv') return this.room === 'west' ? 'Отдай УВАЖЕНИЕ Интернету! ПРИМЕНИТЬ УВАЖЕНИЕ К ИНТЕРНЕТУ!' : 'УВАЖЕНИЕ у нас! Неси его наверх, к Интернету!';
      if (this.sick) return this.room === 'depths' ? 'Присутствию дурно! Бери УВАЖЕНИЕ!' : 'Присутствию дурно! Прыгай в ДЫРУ и бери УВАЖЕНИЕ!';
      if (this.at.bosco !== 'inv') return this.room === 'east' ? 'Бери ЛАВКУ БОСКО! В текстовой игре можно взять всё, что написано большими буквами!' : 'УВАЖЕНИЕ упало в ДЫРУ, а там сидит что-то корпоративное. На восточном конце улицы стоит ЛАВКА БОСКО. Возьми её, пригодится!';
      if (!this.sweet) return this.room === 'sybil' ? 'Окуни ЛАВКУ БОСКО в ОЗЕРО! Сделаем из неё что-нибудь до тошноты милое!' : 'Корпоративные твари не выносят милого! Неси ЛАВКУ БОСКО на северо-запад, к Сибил, там целое озеро милоты!';
      return this.room === 'depths' ? 'Покажи Присутствию ТОШНОТВОРНУЮ ЛАВКУ БОСКО! ПРИМЕНИТЬ её К ПРИСУТСТВИЮ!' : 'Лавка в котятах! Прыгай в ДЫРУ на западном конце улицы и покажи её Присутствию!';
    }

    finish() {
      const g = this.g;
      this.at.respect = 'given';
      this.print('Вы возвращаете ИНТЕРНЕТУ УВАЖЕНИЕ КО ВСЕМУ ЖИВОМУ. ИНТЕРНЕТ долго молчит и шмыгает носом.');
      this.print('«Мне... жаль», говорит она. «Я отпускаю всех. Идите. Снимайте очки».', 'lamp');
      this.print('ИГРА ОКОНЧЕНА.', 'neonA');
      this.over = true;
      g.f.netFreed = true;
      g.sfx('chime');
      g.run(function* () {
        yield g.until(() => !g.drive || !g.drive.typing || !g.drive.typing());
        yield 2.4;
        yield g.fadeOut(1.2);
        g.mode = 'room';
        g.drive = null;
        yield* E.finale(g);
      }, { name: 'text15end' });
    }

    update(dt) {
      this.t += dt;
      const total = this.total();
      if (this.shown < total) {
        const before = this.shown;
        this.shown = Math.min(total, this.shown + dt * 110);
        if (Math.floor(before / 6) !== Math.floor(this.shown / 6)) this.g.sfx('type');
      }
    }

    render(f, g) {
      f.px.fill(C.black);
      const room = T15[this.room];
      const col = C[room.color];
      S.rectFill(f, 0, 0, W, 11, C.night[0]);
      font.draw(f, 'РЕАЛЬНОСТЬ 1.5', 6, 2, C.grey[3], 0);
      font.draw(f, room.title, W - 6 - font.measure(room.title), 2, col, 0);
      let budget = Math.floor(this.shown);
      const vis = [];
      for (const l of this.lines) {
        if (budget <= 0) break;
        vis.push({ text: l.text.slice(0, budget), col: l.col });
        budget -= l.text.length + 1;
      }
      const tail = vis.slice(-11);
      tail.forEach((l, i) => font.draw(f, l.text, 8, 15 + i * 10, l.col, 0));
      if (this.typing() && Math.floor(this.t * 6) % 2 && tail.length) { const last = tail[tail.length - 1]; S.rectFill(f, 9 + font.measure(last.text), 15 + (tail.length - 1) * 10, 4, 7, col); }
      for (let x = 0; x < W; x++) if (x % 2) f.set(x, 127, C.grey[1]);
      const sam = S.sprite('sam', { dir: 'w', talk: 0, blink: Math.floor(this.t * 2) % 9 === 0 }, 0.8);
      const max = S.sprite('max', { dir: 'w', act: Math.floor(this.t * 0.7) % 4 === 0 ? 'grin' : '' }, 0.8);
      blit(f, sam.buf, 286 - sam.ox, 192 - sam.oy, false, col);
      blit(f, max.buf, 262 - max.ox, 194 - max.oy, false, col);
      if (!this.typing()) {
        const opts = this.options();
        opts.forEach((o, i) => {
          const r = this.optRect(i);
          const hot = this.hover === i;
          font.draw(f, (hot ? '> ' : (i + 1) + ' ') + o.text, r.x, r.y + 1, hot ? C.lamp : col, 0);
        });
      }
      if (!g.busy) {
        const cur = S.cursor('use', this.hover >= 0);
        blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy);
      }
    }
  }

  E.Bank = Bank;
  E.Text15 = Text15;
  E.bankSolve = solve;
  E.bankSay = id => SAY[id];
  E.bankInit = () => ({ a: Object.assign({}, INIT), m: { cas: 500, lob: 500 } });
  E.bankCook = cook;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
