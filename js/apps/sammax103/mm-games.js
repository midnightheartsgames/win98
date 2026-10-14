(function (S) {
  'use strict';
  const { W, H, C, Pen, blit, font, COLORS } = S;
  const E = S.EP103;
  const HOLES = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) HOLES.push({ x: 104 + c * 56, y: 78 + r * 40 });
  const GOAL = 20, TIME = 45;

  function ratFace(P, x, y, sing, t, hit) {
    const R = sing ? C.orange : C.yellow;
    P.part(P.ell(x - 8, y - 9, 4.4, 4.6), R, { b: 3 });
    P.part(P.ell(x + 8, y - 9, 4.4, 4.6), R, { b: 3 });
    P.part(P.ell(x - 8, y - 9, 2.4, 2.6), C.pink, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(x + 8, y - 9, 2.4, 2.6), C.pink, { b: 3, sh: 0, hi: 0, ol: 0 });
    P.part(P.ell(x, y, 10, 9.5), R, { b: 3 });
    if (hit) {
      for (const ex of [-4, 4]) { P.line(x + ex - 2, y - 4, x + ex + 2, y, C.black); P.line(x + ex - 2, y, x + ex + 2, y - 4, C.black); }
    } else {
      for (const ex of [-4, 4]) { P.part(P.ell(x + ex, y - 2, 2, 2.4), C.eye, { sh: 0, hi: 0 }); P.px(x + ex, y - 1.5, C.pupil); }
    }
    P.part(P.ell(x, y + 3, 2.2, 1.6), C.pink, { b: 3, sh: 0 });
    for (const s of [-1, 1]) { P.line(x + s * 3, y + 3, x + s * 12, y + 1, R[1]); P.line(x + s * 3, y + 4, x + s * 12, y + 6, R[1]); }
    if (sing && !hit) {
      P.part(P.ell(x, y + 7, 3, 2 + Math.abs(Math.sin(t * 9)) * 1.5), C.red, { b: 1, sh: 0, hi: 0 });
      for (let i = 0; i < 2; i++) {
        const nx = x + 8 + i * 7, ny = y - 16 - ((t * 20 + i * 6) % 12);
        P.part(P.ell(nx, ny + 4, 1.8, 1.4), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0 });
        P.line(nx + 1.5, ny + 4, nx + 1.5, ny - 1, C.lamp);
      }
    } else {
      P.part(P.rect(x - 2, y + 5.5, 1.8, 2.4), C.eye, { sh: 0, hi: 0, ol: C.grey[2] });
      P.part(P.rect(x + 0.2, y + 5.5, 1.8, 2.4), C.eye, { sh: 0, hi: 0, ol: C.grey[2] });
    }
  }

  class WhackRats {
    constructor(g) {
      this.g = g;
      this.kind = 'arcade';
      this.t = 0;
      this.left = TIME;
      this.score = 0;
      this.rats = [];
      this.spawnT = 0.6;
      this.over = false;
      this.hover = null;
      this.flash = [];
      this.msg = '';
      this.msgT = 0;
    }

    rnd() { return this.g.rng.next(); }

    update(dt) {
      if (this.over) return;
      this.t += dt;
      this.left -= dt;
      this.msgT = Math.max(0, this.msgT - dt);
      this.spawnT -= dt;
      if (this.spawnT <= 0) {
        this.spawnT = 0.45 + this.rnd() * 0.5;
        const free = HOLES.map((h, i) => i).filter(i => !this.rats.some(r => r.hole === i));
        if (free.length) {
          const hole = free[this.g.rng.int(free.length)];
          this.rats.push({ hole, sing: this.rnd() < 0.62, t: 0, life: 1.0 + this.rnd() * 0.6, hit: 0 });
          if (this.rats[this.rats.length - 1].sing) this.g.sfx('ratsing');
        }
      }
      for (const r of this.rats) { r.t += dt; if (r.hit) r.hit += dt; }
      this.rats = this.rats.filter(r => (r.hit ? r.hit < 0.35 : r.t < r.life));
      this.flash = this.flash.filter(f => (f.t += dt) < 0.2);
      if (this.score >= GOAL) this.finish(true);
      else if (this.left <= 0) this.finish(false);
    }

    ratAt(x, y) {
      for (const r of this.rats) {
        if (r.hit) continue;
        const h = HOLES[r.hole];
        const up = Math.min(1, r.t / 0.15, (r.life - r.t) / 0.15);
        if (Math.abs(x - h.x) < 13 && y > h.y - 12 - up * 14 && y < h.y + 6) return r;
      }
      return null;
    }

    exitRect() { return { x: 266, y: 6, w: 48, h: 14 }; }

    click(x, y) {
      if (this.over) return;
      const e = this.exitRect();
      if (x >= e.x && x < e.x + e.w && y >= e.y && y < e.y + e.h) { this.finish(false, true); return; }
      this.g.sfx('gun');
      this.flash.push({ x, y, t: 0 });
      const r = this.ratAt(x, y);
      if (!r) return;
      r.hit = 0.001;
      if (r.sing) { this.score++; this.g.sfx('whack'); }
      else { this.msg = 'ЭТА НЕ ПОЁТ!'; this.msgT = 1; this.g.sfx('buzzer'); }
    }

    pointer(x, y) { this.g.mx = x; this.g.my = y; }

    key(k) {
      if (k === 'Escape') { this.finish(false, true); return true; }
      return false;
    }

    finish(won, quit) {
      if (this.over) return;
      this.over = true;
      const g = this.g;
      const score = this.score;
      g.mode = 'room';
      g.drive = null;
      g.music('playland');
      g.run(function* () {
        if (won) {
          g.sfx('jackpot');
          yield g.say(null, 'ДВАДЦАТЬ ПОЮЩИХ КРЫС! ПРИЗ!', { key: 'arcade', color: C.gold[4], x: 196, y: 50 });
          if (!g.has('magnet') && !g.f.cameraOut) {
            g.give('magnet');
            g.f.whackWon = true;
            yield g.say('sam', 'Приз: магнит на холодильник с головой Теда И. Бэра. Двадцать крыс пали, чтобы я получил магнит. Такова цена искусства.');
          } else yield g.say('sam', 'Приз тот же магнит. Второй мне не нужен. Автомат обиделся и выдал купон на улыбку.');
        } else if (quit) {
          yield g.say('sam', 'Хватит. Жетон пропал, крысы поют дальше.');
        } else {
          g.sfx('buzzer');
          yield g.say('sam', 'Время вышло. ' + score + ' из двадцати. Поющие крысы оказались быстрее собаки.');
          if (!g.seen.whackTip) { g.seen.whackTip = 1; yield g.say('max', 'Сэм, ты палил по молчунам! Жёлтые молчат и ни в чём не виноваты! Пели оранжевые!'); }
        }
      }, { name: 'whackend' });
    }

    render(f, g) {
      const P = new Pen(f);
      f.px.fill(C.night[0]);
      P.part(P.rect(40, 24, 240, 170), C.purple, { b: 1 });
      const field = P.rect(46, 30, 228, 158);
      S.grad(f, field, C.green, (x, y) => 0.3 + ((Math.floor(x / 16) + Math.floor(y / 16)) % 2) * 0.12 + (y - 30) / 700);
      for (let i = 0; i < HOLES.length; i++) {
        const h = HOLES[i];
        P.part(P.ell(h.x, h.y + 4, 16, 6), C.night, { b: 0, sh: 0, hi: 0 });
      }
      for (const r of this.rats) {
        const h = HOLES[r.hole];
        const up = r.hit ? Math.max(0, 1 - r.hit * 3) : Math.min(1, r.t / 0.15, (r.life - r.t) / 0.15);
        const y = h.y + 2 - up * 16;
        const tmp = new S.Buf(40, 44);
        ratFace(new Pen(tmp).at(20, 26, 1), 0, 0, r.sing, r.t, !!r.hit);
        for (let yy = 0; yy < tmp.h; yy++) {
          const ty = Math.round(y - 26 + yy);
          if (ty > h.y + 4) continue;
          for (let xx = 0; xx < tmp.w; xx++) { const c = tmp.px[yy * tmp.w + xx]; if (c) f.set(Math.round(h.x - 20 + xx), ty, c); }
        }
        P.part(P.path(`M ${h.x - 16} ${h.y + 4} Q ${h.x} ${h.y + 11} ${h.x + 16} ${h.y + 4} L ${h.x + 16} ${h.y + 7} Q ${h.x} ${h.y + 13} ${h.x - 16} ${h.y + 7} Z`), C.green, { b: 1, sh: 0, hi: 0 });
      }
      for (const fl of this.flash) { P.part(P.ell(fl.x, fl.y, 4, 4), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0, ol: 0 }); }
      S.rectFill(f, 0, 0, W, 22, C.night[1]);
      font.draw(f, 'ПРИХЛОПНИ КРЫСУ!', 6, 7, C.gold[4]);
      font.draw(f, 'ПОЮЩИХ: ' + this.score + '/' + GOAL, 118, 7, C.orange[4]);
      font.draw(f, 'ВРЕМЯ: ' + Math.max(0, Math.ceil(this.left)), 200, 7, this.left < 10 ? C.red[4] : C.grey[5]);
      const e = this.exitRect();
      S.rectFill(f, e.x, e.y, e.w, e.h, C.red[1]);
      S.frameRect(f, e.x, e.y, e.w, e.h, C.gold[3]);
      font.drawCentered(f, 'ВЫХОД', e.x + e.w / 2, e.y + 3, C.grey[5]);
      if (this.msgT > 0) font.drawCentered(f, this.msg, 160, 186, C.yellow[4]);
      if (!g.busy) {
        const cur = { buf: S.icon('crosshair'), hx: 7, hy: 7 };
        blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy);
      }
    }
  }

  E.payToken = function (g) {
    if (g.has('token')) { g.drop('token'); return 'token'; }
    if (g.has('tokens')) return 'sack';
    return null;
  };

  E.startWhack = function* (g) {
    const how = E.payToken(g);
    if (!how) { yield g.say('sam', 'Автомат хочет жетон. Бесплатно крысы не поют.'); return; }
    if (how === 'sack') yield g.say('sam', 'Один жетон из десяти миллионов. Мешок даже не похудел.');
    g.sfx('chips');
    yield g.fadeOut(4);
    g.mode = 'arcade';
    g.drive = new WhackRats(g);
    g.music('mobchase');
    yield g.fadeIn(4);
  };

  const BUG_TAPES = {
    cuddly: [['cuddly', 'Сдаю?'], ['cuddly', 'Сдаю? Сдаю. Сдаю!'], ['cuddly', 'Раздаю. О! Раздаю! ...Сдаю?']],
    bosco: [['bosco', 'Держись, Боско. Ещё неделя в берете, и можно будет снова быть Боско.'], ['bosco', 'Нон. Нон! НОН. Надо тренировать «нон». Покупатели уже привыкают.']],
    sybil: [['sybil', 'Спокойно, Сибил. Вдох. Кофе. Выдох. Кофе.'], ['sybil', 'Если выживу, стану кем-нибудь безопасным. Сапёром.']],
    lovey: [['lovey', 'Я бы хотел быть Чаклзом. Чаклзу дают распоряжаться. Лапочке дают только жетоны.']],
    leonard: [['leonard', 'Мама, я опять выиграл. Да, мама, честно. Мне помогает нос.']],
    guard: [['guard', 'Пароль. Пароль. Пароль... А какой у меня пароль? А, у меня нет пароля. Я охранник.']],
    chuckles: [['chuckles', 'Дону Теду нравится быть доном. Пусть нравится. Недолго.']],
    jimmy: [['jimmy', 'Туз за жетон. Жетон за сыр. Сыр за нору побольше. Бизнес растёт.']],
    password: [['chuckles', E.PASSWORD]]
  };
  E.BUG_TAPES = BUG_TAPES;

  E.bugReplay = function* (g, rec) {
    const tape = BUG_TAPES[rec] || [];
    for (const [who, text] of tape) {
      const a = g.actors[who];
      yield g.say(null, text, { key: 'bugplay', color: a ? a.color : COLORS.roach });
    }
    yield g.say(null, 'Конец записи, сэр!', { key: 'roachvoice', color: COLORS.roach });
  };

  E.bugPlant = function* (g, who) {
    const roach = g.actors.roach;
    const a = g.actors[who];
    if (!a) return;
    yield g.say('sam', 'Жучок, задание: слушать и запоминать.');
    yield g.say(null, 'Есть, сэр!', { key: 'roachvoice', color: COLORS.roach });
    g.drop('roach');
    g.place('roach', g.roomId, g.actors.sam.x + 8, g.actors.sam.y, 'e');
    roach.visible = true; roach.scripted = true;
    yield g.walkTo('roach', a.x + 10, a.y + 1, { free: true, speed: 1.5 });
    roach.visible = false;
    yield 1.4;
    g.place('roach', g.roomId, a.x + 10, a.y + 1, 'w');
    roach.visible = true;
    yield g.walkTo('roach', g.actors.sam.x + 6, g.actors.sam.y, { free: true, speed: 1.5 });
    g.place('roach', 'nowhere', 0, 0);
    roach.scripted = false;
    g.give('roach');
    g.f.bugRec = who;
    yield g.say(null, 'Разведка завершена, сэр! Докладываю!', { key: 'roachvoice', color: COLORS.roach });
    yield* E.bugReplay(g, who);
  };

  E.trialDone = function* (g) {
    const f = g.f;
    const n = (f.sybilDone ? 1 : 0) + (f.boscoDone ? 1 : 0) + (f.meatDone ? 1 : 0);
    if (n >= 3) {
      yield g.say('max', 'Все три поручения! Сэм, мы почти мафия! Чаклз должен нам по перстню!');
      yield g.say('sam', 'Убили подругу, запугали знакомого и нашли бутерброд. Карьера в мафии складывается быстрее, чем в полиции.');
    } else if (n === 2) yield g.say('max', 'Два есть! Осталось одно! Я уже чувствую перстень на пальце!');
    else yield g.say('max', 'Одно поручение готово! Мы на верном пути к преступной жизни!');
  };

  E.WhackRats = WhackRats;
  E.ratFace = ratFace;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
