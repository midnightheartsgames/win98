(function (S) {
  'use strict';
  const { C, Pen, blit, font, COLORS } = S;
  const E = S.EP103;
  const { zToY, roadHalf, PLAYER_Z, spr } = S.driveMath;
  const A = S.art103;
  const MIRROR = { x: 110, y: 4, w: 100, h: 38 };

  class MobChase extends S.Drive {
    constructor(g) {
      super(g, 'mob');
      this.music = 'mobchase';
      this.siren = true;
      this.tool = 'gun';
      this.mob = { d: 0.95, lane: 0, x: 0, laneT: 1.5, hits: 0, shootT: 2.5, muzzle: 0, ramT: 0 };
      this.boards = [];
      this.boardT = 1.2;
      this.won = false;
      this.from = g.roomId;
    }

    *begin() {
      const g = this.g;
      yield g.say('max', 'Они за нами! Розовый лимузин с мишками! Смотри в зеркало!', { x: 160, y: 96 });
      yield g.say('sam', 'Шины у них пуленепробиваемые. Так написано на бампере. Мафия любит хвастаться.', { x: 160, y: 96 });
      yield g.say('max', 'Зато щиты «Без мафии» висят на честном слове! А честное слово у мафии сам знаешь какое!', { x: 160, y: 96 });
    }

    say(text, who) {
      return this.g.say(who || 'sam', text, { x: 160, y: 96 });
    }

    boardScreen(b) {
      const y = zToY(b.z), s = PLAYER_Z / b.z;
      const half = roadHalf(y) * 1.1;
      const cx = 160 - this.x * roadHalf(y) * 0.22;
      return { cx, y, s, x0: cx - half, x1: cx + half, y0: y - 64 * s, y1: y - 40 * s };
    }

    update(dt) {
      if (this.done) return;
      const g = this.g;
      this.t += dt;
      this.x += (this.lane - this.x) * Math.min(1, dt * 7);
      if (this.paused) return;
      this.scroll += this.speed * dt;
      if (this.kind === 'travel') {
        this.left -= dt;
        if (this.left <= 0) this.arrive();
        return;
      }
      const m = this.mob;
      m.muzzle = Math.max(0, m.muzzle - dt);
      m.ramT = Math.max(0, m.ramT - dt);
      m.d = Math.max(0, m.d - dt * 0.12);
      if (m.d <= 0.04) {
        m.d = 0.55;
        m.ramT = 0.4;
        g.sfx('crash');
        g.fx.shake = 0.6;
        if (!g.seen.ram) { g.seen.ram = 1; g.run(function* () { yield g.say('max', 'Они нас таранят! Сэм, это личное!', { x: 160, y: 96 }); }); }
      }
      m.laneT -= dt;
      if (m.laneT <= 0) { m.laneT = 0.7 + this.rnd() * 0.7; m.lane = this.lane; }
      m.x += (m.lane - m.x) * Math.min(1, dt * 2.5);
      m.shootT -= dt;
      if (m.shootT <= 0) { m.shootT = 2.4 + this.rnd() * 2; m.muzzle = 0.35; g.sfx('tommy'); }
      this.boardT -= dt;
      if (this.boardT <= 0) { this.boardT = 3.0 + this.rnd() * 1.4; this.boards.push({ z: 70, fall: 0, where: '' }); }
      for (const b of this.boards) {
        b.z -= this.speed * dt;
        if (b.fall) b.fall += dt;
        if (b.where === 'ahead' && !b.hitUs && b.z < PLAYER_Z + 0.8) {
          b.hitUs = true;
          g.sfx('crash');
          g.fx.shake = 0.8;
          m.d = Math.max(0.05, m.d - 0.3);
          g.run(function* () { yield g.say('max', 'Мы въехали в собственный щит! Мафия ближе!', { x: 160, y: 96 }); });
        }
      }
      this.boards = this.boards.filter(b => b.z > -40 && !(b.where === 'ahead' && b.z < 1));
    }

    shoot(x, y) {
      const g = this.g, self = this, m = this.mob;
      g.sfx('gun');
      g.fx.flash = 0.25;
      if (this.kind !== 'mob' || this.won) return;
      for (const b of this.boards.slice().sort((p, q) => p.z - q.z)) {
        if (b.fall || b.z < PLAYER_Z - 0.2 || b.z > 40) continue;
        const r = this.boardScreen(b);
        if (x < r.x0 || x > r.x1 || y < r.y0 - 4 || y > r.y1 + 4) continue;
        b.fall = 0.01;
        g.sfx('clang');
        if (b.z > PLAYER_Z + 5) {
          b.where = 'ahead';
          g.run(function* () { yield g.say('max', 'Рано! Щит падает перед нами!', { x: 160, y: 96 }); });
          return;
        }
        b.where = 'behind';
        if (m.d < 0.42) { this.hitMob(); return; }
        g.run(function* () { yield g.say('max', 'Мимо! Они далеко, объехали! Подпусти их ближе!', { x: 160, y: 96 }); });
        return;
      }
      g.run(function* () { yield g.say('max', ['Мимо!', 'По щитам, Сэм! По щитам над дорогой!', 'Бампер у них бронированный! Щиты!'][g.count('mobmiss') % 3], { x: 160, y: 96 }); });
    }

    hitMob() {
      const g = this.g, m = this.mob, self = this;
      m.hits++;
      m.d = 1.25;
      g.sfx('crash');
      g.fx.shake = 0.6;
      if (m.hits === 1) {
        g.run(function* () {
          yield g.say('max', 'Крышу снесло! У них теперь кабриолет!', { x: 160, y: 96 });
          yield self.say('Кабриолет с мишками. Ещё один щит, и останется просто куча мишек.');
        });
        return;
      }
      this.win();
    }

    honk() {
      const g = this.g, self = this;
      g.sfx('horn');
      g.run(function* () { yield self.say('Би-би! Мафия сигналит в ответ. Из автомата.'); });
    }

    megaphone() {
      const g = this.g, self = this;
      g.sfx('megaphone');
      g.run(function* () {
        yield self.say('Игрушечная мафия! Прижмитесь к обочине! Вольная полиция!');
        yield g.say(null, 'Сдаю?', { key: 'mob', color: COLORS.cuddly, x: 160, y: 50 });
      });
    }

    selectTool(t) {
      const g = this.g;
      if (t === 'exit' && this.kind === 'mob') { g.run(function* () { yield g.say('max', 'Нельзя! Они на хвосте!', { x: 160, y: 96 }); }); return; }
      super.selectTool(t);
    }

    win() {
      const g = this.g, self = this;
      this.won = true;
      this.paused = true;
      g.run(function* () {
        g.sfx('crash');
        g.fx.shake = 1.2;
        self.mob.crashed = true;
        yield g.say('max', 'Второй щит! Они в кювете! Мишки катятся по полю!', { x: 160, y: 96 });
        yield self.say('Мафия отстала. Вся семья в кювете, а Дон остался дома один.');
        g.f.chaseWon = true;
        self.done = true;
        yield g.fadeOut(2);
        g.mode = 'room';
        g.drive = null;
        yield* g.goRoom('backroom', { x: 60, y: 172, dir: 'e' });
      }, { name: 'mobwin' });
    }

    objects(f) {
      const objs = super.objects(f);
      for (const b of this.boards) {
        if (b.where === 'behind' && b.z < PLAYER_Z) continue;
        objs.push({ z: b.z + 0.05, draw: () => this.drawBoard(f, b) });
      }
      return objs;
    }

    drawBoard(f, b) {
      const r = this.boardScreen(b);
      const P = new Pen(f);
      const s = r.s;
      if (b.where === 'ahead' && b.fall > 0.5) {
        P.part(P.poly([r.x0, r.y - 4 * s, r.x1, r.y - 4 * s, r.x1 - 6 * s, r.y + 2 * s, r.x0 + 6 * s, r.y + 2 * s]), C.gold, { b: 2 });
        return;
      }
      const drop = b.fall ? Math.min(1, b.fall * 2) : 0;
      const dy = drop * 40 * s;
      for (const px of [r.x0, r.x1]) P.part(P.rect(px - 2 * s, r.y - 66 * s, 4 * s + 1, 66 * s), C.grey, { b: 1, sh: 0, hi: 0 });
      P.part(P.rect(r.x0, r.y0 + dy, r.x1 - r.x0, r.y1 - r.y0), C.gold, { b: 3 });
      P.part(P.rect(r.x0 + 3 * s, r.y0 + dy + 3 * s, r.x1 - r.x0 - 6 * s, r.y1 - r.y0 - 6 * s), C.purple, { b: 2, sh: 0, hi: 0 });
      if (s > 0.25) {
        A.bearMask(new Pen(f).at(r.cx - (r.x1 - r.x0) * 0.3, (r.y0 + r.y1) / 2 + dy + 2 * s, s * 0.55), 0, 0, Object.assign({}, A.MOB.ted, { hat: null }), {});
        if (s > 0.45) font.drawCentered(f, 'БЕЗ МАФИИ!', Math.round(r.cx + (r.x1 - r.x0) * 0.12), Math.round((r.y0 + r.y1) / 2 + dy - 4), C.gold[4]);
      }
    }

    drawMirror(f) {
      const m = this.mob, R = MIRROR;
      const P = new Pen(f);
      P.part(P.rect(R.x - 3, R.y - 2, R.w + 6, R.h + 4), C.grey, { b: 1 });
      const inner = P.rect(R.x, R.y, R.w, R.h);
      S.grad(f, inner, [C.purple[1], C.plum[2], C.rose[3]], (x, y) => (y - R.y) / R.h * 0.6);
      const road = P.poly([R.x + R.w * 0.46, R.y + 8, R.x + R.w * 0.54, R.y + 8, R.x + R.w, R.y + R.h, R.x, R.y + R.h]);
      S.grad(f, road, C.asphalt, (x, y) => 0.3 + (y - R.y) / R.h * 0.4);
      for (const b of this.boards) {
        if (b.where !== 'behind' || b.z > PLAYER_Z) continue;
        const k = Math.min(1, (PLAYER_Z - b.z) / 30);
        const w = (1 - k) * 80 + 10, yy = R.y + R.h - (1 - k) * 8 - k * 26 + Math.min(1, b.fall * 2) * 10 * (1 - k);
        P.part(P.rect(R.x + R.w / 2 - w / 2, yy - 6 * (1 - k * 0.6), w, 6 * (1 - k * 0.6) + 1), C.gold, { b: 3, sh: 0 });
      }
      if (!m.crashed) {
        const close = 1 - Math.min(1.3, m.d) / 1.3;
        const s = 0.28 + close * 0.42;
        const x = R.x + R.w / 2 - (m.x - this.x) * 18;
        const y = R.y + R.h - 2 + close * 6;
        const sp = spr('mobcar', { v: m.hits ? 'topless' : '', frame: m.muzzle > 0 ? 1 : 0 }, s);
        const tmp = new S.Buf(f.w, f.h);
        blit(tmp, sp.buf, Math.round(x - sp.ox), Math.round(y - sp.oy));
        for (let yy = R.y; yy < R.y + R.h; yy++) for (let xx = R.x; xx < R.x + R.w; xx++) { const c = tmp.px[yy * f.w + xx]; if (c) f.px[yy * f.w + xx] = c; }
      }
      S.frameRect(f, R.x - 1, R.y - 1, R.w + 2, R.h + 2, C.black);
    }

    drawTools(f, g) {
      super.drawTools(f, g);
      if (this.kind !== 'mob') return;
      this.drawMirror(f);
      const d = Math.max(0, Math.min(1, this.mob.d / 1.2));
      font.draw(f, 'Мафия:', 4, 4, C.grey[5]);
      S.rectFill(f, 44, 6, 60, 5, C.grey[1]);
      S.rectFill(f, 44, 6, Math.round(60 * (1 - d)), 5, d < 0.35 ? C.red[4] : C.orange[3]);
      font.draw(f, 'Щиты: ' + this.mob.hits + '/2', 228, 4, C.gold[4]);
    }
  }

  E.DEST = {
    street: { name: 'Прямая и Узкая улица', x: 96, y: 118, when: () => true, room: 'street', pos: { x: 80, y: 164, dir: 's' } },
    casino: { name: 'Казино Теда И. Бэра', x: 236, y: 64, when: g => g.f.caseOpen, room: 'playland', pos: { x: 44, y: 172, dir: 'e' } },
    chase: { name: 'Погоня за мафией', x: 184, y: 118, when: g => g.f.inducted && !g.f.chaseWon, start: g => new MobChase(g) }
  };

  E.startMobChase = function* (g) {
    yield g.fadeOut(3);
    g.mode = 'drive';
    g.drive = new MobChase(g);
    g.music('mobchase');
    yield g.fadeIn(3);
    yield* g.drive.begin();
  };

  E.MobChase = MobChase;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
