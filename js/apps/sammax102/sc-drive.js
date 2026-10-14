(function (S) {
  'use strict';
  const { C, Pen, blit, font, COSTUMES } = S;
  const E = S.EP102;
  const { zToY, roadHalf, PLAYER_Z, spr } = S.driveMath;

  COSTUMES.ratcarRear = {
    h: 48, w: 70,
    draw(R, o) {
      const P = R.scaled(0, 0, 1.4);
      const tilt = o.frame === 1 ? 2 : 0;
      P.part(P.path(`M -22 -4 L -23 ${-14 - tilt} Q -22 -19 -16 -19 L 16 -19 Q 22 -19 23 ${-14 + tilt} L 22 -4 Z`), C.red, { b: 3 });
      for (const [x, k] of [[-10, 0], [0, 1], [10, 2]]) {
        P.part(P.ell(x, -23 - (k === 1 ? 2 : 0), 4, 3.6), k === 1 ? C.rat : C.pink, { b: 3 });
        P.part(P.ell(x - 3, -26 - (k === 1 ? 2 : 0), 1.8, 2), C.rat, { b: 3, sh: 0 });
        P.part(P.ell(x + 3, -26 - (k === 1 ? 2 : 0), 1.8, 2), C.rat, { b: 3, sh: 0 });
      }
      P.part(P.rect(15, -30, 5, 9), C.teal, { b: 3, sh: 0 });
      P.part(P.rect(15.5, -32, 4, 2.2), C.grey, { b: 5, sh: 0 });
      P.part(P.rect(-20, -13, 7, 4), C.orange, { b: 4, sh: 0 });
      P.part(P.rect(13, -13, 7, 4), C.orange, { b: 4, sh: 0 });
      P.part(P.rect(-6, -10, 12, 5), C.grey, { b: 5, sh: 0 });
      font.drawCentered(P.b, 'БХ', P.X(0), P.Y(-10), C.black, 0);
      P.part(P.rect(-21, -5, 9, 6), C.grey, { b: 0 });
      P.part(P.rect(12, -5, 9, 6), C.grey, { b: 0 });
      P.part(P.ell(-4, -2, 1.6, 1.6), C.grey, { b: 1, sh: 0 });
      P.part(P.ell(4, -2, 1.6, 1.6), C.grey, { b: 1, sh: 0 });
    }
  };

  COSTUMES.manhole = {
    h: 20, w: 60,
    draw(P) {
      P.part(P.ell(0, -4, 22, 5), C.grey, { b: 0 });
      P.part(P.ell(0, -4.5, 18, 3.6), C.night, { b: 0, sh: 0, hi: 0 });
      P.part(P.ell(26, -5, 8, 2.6), C.stone, { b: 2 });
      P.part(P.poly([-30, -2, -26, -16, -22, -2]), C.orange, { b: 3, sh: 0 });
      P.part(P.rect(-29, -9, 6, 2), C.grey, { b: 5, sh: 0, hi: 0, ol: 0 });
    }
  };

  COSTUMES.trashcan = {
    h: 12, w: 10,
    draw(P) {
      P.part(P.rect(-4, -10, 8, 10), C.stone, { b: 3 });
      P.part(P.ell(0, -10, 4, 1.4), C.stone, { b: 4, sh: 0 });
      P.line(-2, -8, -2, -2, C.stone[1]); P.line(2, -8, 2, -2, C.stone[1]);
    }
  };

  class RatChase extends S.Drive {
    constructor(g) {
      super(g, 'rats');
      this.music = 'rats';
      this.siren = true;
      this.rat = { lane: 0, x: 0, z: 14, target: 10, moveT: 2.5, stunT: 0, dropT: 3, fall: 0 };
      this.holes = [];
      this.holeT = 1.2;
      this.trash = [];
      this.won = false;
      this.from = g.roomId;
    }

    *begin() {
      const g = this.g;
      yield g.say('max', 'Вон они! Крысиный хот-род!', { x: 160, y: 58 });
      yield g.say('sam', 'Колёса у них с пуговицу. По колёсам стрелять бесполезно.', { x: 160, y: 58 });
      yield g.say('max', 'Стреляй им в бок, Сэм! Их занесёт! Видишь люки впереди? Загони крыс в люк!', { x: 160, y: 58 });
    }

    freeLanes(z0, z1, skip) {
      return [-1, 0, 1].filter(l => l !== skip && !this.holes.some(h => h.lane === l && h.z > z0 && h.z < z1));
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
      const r = this.rat;
      if (r.fall) {
        r.fall += dt;
        if (r.fall > 0.9 && !this.won) this.win();
        return;
      }
      r.stunT = Math.max(0, r.stunT - dt);
      r.moveT -= dt;
      if (!r.stunT) {
        const danger = this.holes.some(h => h.lane === r.lane && h.z > r.z - 0.5 && h.z - r.z < 8);
        if (danger || r.moveT <= 0) {
          r.moveT = 2 + this.rnd() * 2.5;
          const lanes = this.freeLanes(r.z - 1, r.z + 10, r.lane);
          if (lanes.length) r.lane = lanes[g.rng.int(lanes.length)];
        }
      }
      r.x += (r.lane - r.x) * Math.min(1, dt * (r.stunT ? 6 : 3));
      r.target = Math.max(10, r.target - dt * 2);
      r.z += (r.target - r.z) * Math.min(1, dt * 1.4);
      this.holeT -= dt;
      if (this.holeT <= 0) {
        this.holeT = 2.4 + this.rnd() * 1.6;
        this.holes.push({ lane: g.rng.int(3) - 1, x: 0, z: 70 });
        this.holes[this.holes.length - 1].x = this.holes[this.holes.length - 1].lane;
      }
      for (const h of this.holes) {
        h.z -= this.speed * dt;
        if (!r.fall && Math.abs(h.z - r.z) < 0.9 && Math.abs(r.x - h.lane) < 0.35) { r.fall = 0.01; r.fx = h.lane; g.sfx('clang'); }
        if (!h.bumped && Math.abs(h.z - PLAYER_Z) < 0.8 && Math.abs(this.x - h.lane) < 0.4) { h.bumped = true; g.sfx('clang'); g.fx.shake = 0.5; }
      }
      this.holes = this.holes.filter(h => h.z > 1);
      r.dropT -= dt;
      if (r.dropT <= 0 && r.z > 9 && !r.stunT) {
        r.dropT = 1.8 + this.rnd() * 1.4;
        this.trash.push({ lane: r.lane, x: r.x, z: r.z - 1 });
        g.sfx('thump');
      }
      for (const c of this.trash) {
        c.z -= dt * 13;
        if (!c.hit && Math.abs(c.z - PLAYER_Z) < 1.3 && Math.abs(c.x - this.x) < 0.5) {
          c.hit = true;
          r.target = Math.min(32, r.target + 12);
          g.sfx('crash');
          g.fx.shake = 0.6;
        }
      }
      this.trash = this.trash.filter(c => c.z > 1 && !c.hit);
    }

    shoot(x, y) {
      const g = this.g, r = this.rat, self = this;
      g.sfx('gun');
      g.fx.flash = 0.25;
      if (this.kind !== 'rats' || r.fall) return;
      const p = this.carScreen(r);
      const s = p.s;
      if (x < p.x - 34 * s || x > p.x + 34 * s || y < p.y - 46 * s || y > p.y + 3) {
        g.run(function* () { yield g.say('max', ['Мимо!', 'Бей в борт, Сэм! В борт!', 'Промазал! Они смеются! Я слышу, как они смеются!'][g.count('ratmiss') % 3], { x: 160, y: 58 }); });
        return;
      }
      if (r.z > 20) { g.run(function* () { yield self.say('Слишком далеко. Надо подъехать ближе.'); }); return; }
      const dir = x < p.x ? 1 : -1;
      const nl = Math.max(-1, Math.min(1, r.lane + dir));
      g.sfx('pop');
      r.stunT = 1.6;
      if (nl === r.lane) { g.fx.shake = 0.2; g.run(function* () { yield g.say(null, 'Эй! Не по бордюру!', { key: 'rats', color: S.COLORS.rat, x: 160, y: 90 }); }); return; }
      r.lane = nl;
      if (!g.seen.ratPush) { g.seen.ratPush = 1; g.run(function* () { yield g.say('max', 'Их занесло! Ещё! Прямо в люк!', { x: 160, y: 58 }); }); }
    }

    honk() {
      const g = this.g, self = this;
      g.sfx('horn');
      g.run(function* () { yield self.say('Би-би! Крысы сигналят в ответ. Громче нас.'); });
    }

    megaphone() {
      const g = this.g, self = this;
      g.sfx('megaphone');
      g.run(function* () {
        yield self.say('Бритые хвосты, прижмитесь к обочине! Вольная полиция!');
        yield g.say(null, 'Сам прижимайся, начальник!', { key: 'rats', color: S.COLORS.rat, x: 160, y: 90 });
      });
    }

    leave() {
      if (!this.won && this.kind === 'rats') {
        const g = this.g;
        g.run(function* () { yield g.say('max', 'Уходят! Ладно, догоним в следующий раз!', { x: 160, y: 58 }); });
      }
      super.leave();
    }

    win() {
      const g = this.g, self = this;
      this.won = true;
      this.paused = true;
      g.run(function* () {
        g.fx.shake = 1;
        yield g.say('max', 'Прямо в люк! Три очка!', { x: 160, y: 58 });
        yield g.say(null, 'Ладно, начальник, забирай свою пену! Она всё равно мятная!', { key: 'jimmy', color: S.COLORS.jimmy, x: 160, y: 96 });
        g.sfx('pickup');
        g.give('cream');
        g.f.chaseWon = true;
        yield self.say('Пена вернулась. Теперь она наша. Боско, думаю, не обидится. Лорд тем более.');
        self.paused = false;
        self.leave();
      }, { name: 'ratwin' });
    }

    objects(f) {
      const objs = super.objects(f);
      const r = this.rat;
      for (const h of this.holes) objs.push({ z: h.z + 0.3, draw: () => { const p = this.carScreen(h); const sp = spr('manhole', {}, p.s); blit(f, sp.buf, Math.round(p.x - sp.ox), Math.round(p.y - sp.oy)); } });
      for (const c of this.trash) objs.push({ z: c.z, draw: () => { const p = this.carScreen(c); const sp = spr('trashcan', {}, p.s * 1.4); blit(f, sp.buf, Math.round(p.x - sp.ox), Math.round(p.y - sp.oy)); } });
      if (this.kind === 'rats' && !(r.fall > 0.6)) {
        objs.push({ z: r.z, draw: () => {
          const p = this.carScreen(r);
          const sink = r.fall ? r.fall * 26 * p.s : 0;
          const sp = spr('ratcarRear', { frame: r.stunT > 0 && Math.floor(this.t * 12) % 2 ? 1 : 0 }, p.s * (r.fall ? 1 - r.fall * 0.6 : 1));
          blit(f, sp.buf, Math.round(p.x - sp.ox), Math.round(p.y - sp.oy + sink));
        } });
      }
      return objs;
    }

    drawTools(f, g) {
      super.drawTools(f, g);
      if (this.kind !== 'rats') return;
      const d = Math.max(0, Math.min(1, (this.rat.z - 9) / 24));
      font.draw(f, 'Крысы:', 4, 4, C.grey[5]);
      S.rectFill(f, 44, 6, 60, 5, C.grey[1]);
      S.rectFill(f, 44, 6, Math.round(60 * (1 - d)), 5, d < 0.4 ? C.green[4] : C.orange[3]);
    }
  }

  E.DEST = {
    street: { name: 'Прямая и Узкая улица', x: 96, y: 118, when: () => true, room: 'street', pos: { x: 80, y: 164, dir: 's' } },
    warp: { name: 'Телестудия WARP', x: 236, y: 64, when: g => g.f.caseOpen, room: 'warp', pos: { x: 40, y: 172, dir: 'e' } },
    rats: { name: 'Погоня за крысами', x: 184, y: 118, when: g => g.f.creamStolen && !g.f.chaseWon, start: g => new RatChase(g) }
  };

  E.RatChase = RatChase;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
