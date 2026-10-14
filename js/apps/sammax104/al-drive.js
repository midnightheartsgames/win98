(function (S) {
  'use strict';
  const { C, blit, font, COLORS } = S;
  const E = S.EP104;
  const { zToY, roadHalf, laneX, PLAYER_Z, spr } = S.driveMath;
  const BEACON = { x: 290, y: 45, w: 28, h: 22 };
  const NEAR = 18, CLOSE = 21, FAR = 46, GIANT = 2.2;
  const WRECKS = ['red', 'green', 'blue', 'yellow', 'grey'];
  const at = { x: 160, y: 58 };

  class LincolnChase extends S.Drive {
    constructor(g) {
      super(g, 'abe');
      this.music = 'abechase';
      this.siren = true;
      this.abe = { z: FAR, target: FAR, lane: 0, x: 0, moveT: 2.5, kickT: 2.2, stepT: 0.6 };
      this.wrecks = [];
      this.tool = g.has('beacon') ? 'beacon' : 'steer';
      this.won = false;
    }

    *begin() {
      const g = this.g;
      yield g.say('max', 'Вон он! Топчет шоссе! За ним все города смотрят в одну точку!', at);
      if (g.has('beacon')) {
        yield g.say('sam', 'Подъеду ближе. Я уворачиваюсь от машин, ты бросаешь.', at);
        yield g.say('max', 'Маяк у меня в лапе! Только покажи, в какую лопатку!', at);
      } else yield g.say('sam', 'Остановить его нам нечем. Пока мы можем только проводить его взглядом.', at);
    }

    say(text, who) { return this.g.say(who || 'sam', text, at); }

    abeScreen() {
      const a = this.abe;
      const y = zToY(a.z);
      return { x: laneX(a.x, y) - this.x * roadHalf(y) * 0.22, y, s: PLAYER_Z / a.z * GIANT };
    }

    abeBox() {
      const p = this.abeScreen();
      return { x0: p.x - 34 * p.s, x1: p.x + 34 * p.s, y0: p.y - 152 * p.s, y1: p.y };
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
      const a = this.abe;
      a.moveT -= dt;
      if (a.moveT <= 0) {
        a.moveT = 2.4 + this.rnd() * 2;
        const lanes = [-1, 0, 1].filter(l => l !== a.lane);
        a.lane = lanes[g.rng.int(lanes.length)];
      }
      a.x += (a.lane - a.x) * Math.min(1, dt * 1.6);
      a.target = Math.max(11, a.target - dt * 2.6);
      a.z += (a.target - a.z) * Math.min(1, dt * 1.5);
      a.stepT -= dt;
      if (a.stepT <= 0) { a.stepT = 0.62; if (a.z < 30) { g.sfx('stomp'); g.fx.shake = Math.max(g.fx.shake, 0.25); } }
      a.kickT -= dt;
      if (a.kickT <= 0 && a.z > CLOSE) {
        a.kickT = 1.5 + this.rnd() * 1.4;
        this.wrecks.push({ x: a.x, z: a.z - 1, color: WRECKS[g.rng.int(WRECKS.length)] });
        g.sfx('thump');
      }
      for (const w of this.wrecks) {
        w.z -= dt * 13;
        if (!w.hit && w.z < PLAYER_Z + 1.5 && w.z > PLAYER_Z - 1.5 && Math.abs(w.x - this.x) < 0.55) {
          w.hit = true;
          a.target = Math.min(FAR, a.target + 13);
          g.sfx('crash');
          g.fx.shake = 0.8;
          if (!g.seen.wreckHit) { g.seen.wreckHit = 1; g.run(function* () { yield g.say('max', 'Он пинает в нас машины! Объезжай их, Сэм, мы отстаём!', at); }); }
        }
      }
      this.wrecks = this.wrecks.filter(w => w.z > 1 && !w.hit);
    }

    toolAt(x, y) {
      if (this.g.has('beacon') && x >= BEACON.x && x < BEACON.x + BEACON.w && y >= BEACON.y && y < BEACON.y + BEACON.h) return 'beacon';
      return super.toolAt(x, y);
    }

    key(k) {
      if (k === '6' && this.g.has('beacon')) { this.selectTool('beacon'); return true; }
      return super.key(k);
    }

    click(x, y, btn) {
      const g = this.g;
      if (this.tool === 'beacon' && !g.busy && btn !== 2 && !this.toolAt(x, y) && !this.paused && !this.done && this.kind === 'abe') { this.throwBeacon(x, y); return; }
      super.click(x, y, btn);
    }

    throwBeacon(x, y) {
      const g = this.g, a = this.abe;
      if (!g.has('beacon')) { this.tool = 'steer'; return; }
      const b = this.abeBox();
      const onTarget = x >= b.x0 - 4 && x <= b.x1 + 4 && y >= b.y0 - 4 && y <= b.y1 + 4;
      g.sfx('whoosh');
      if (!onTarget) { g.run(function* () { yield g.say('max', 'Мимо! Маяк вернулся. Он у меня на резинке, я предусмотрительный.', at); }); return; }
      if (a.z > NEAR) { g.run(function* () { yield g.say('max', 'Далеко! Кролики не катапульты, Сэм! Подъезжай ближе!', at); }); return; }
      this.win();
    }

    win() {
      const g = this.g, self = this;
      this.won = true;
      this.paused = true;
      g.drop('beacon');
      g.f.beaconOn = true;
      g.sfx('clang');
      g.run(function* () {
        yield g.say('max', 'Попал! Прямо между лопаток! Мигает!', at);
        yield g.say(null, 'ЛИНКОЛЬН ЧУЯТЬ КОМАРА!', { key: 'abefar', color: COLORS.lincoln, x: 160, y: 40 });
        yield self.say('Он принял маяк за комара. Комар мигает красным и весит как приговор.');
        self.tool = 'steer';
        self.wrecks = [];
        self.kind = 'travel';
        self.dest = 'lawn';
        self.left = 2;
        self.paused = false;
      }, { name: 'abewin' });
    }

    leave() {
      this.wrecks = [];
      super.leave();
    }

    shoot() {
      const g = this.g, self = this;
      g.sfx('gun');
      g.fx.flash = 0.25;
      if (this.kind !== 'abe') return;
      g.run(function* () { yield self.say(['Пуля отскочила от мрамора. Где-то на обочине стало одним дорожным знаком меньше.', 'Шесть метров камня. Револьвер для него вроде комара.'][g.count('abeshot') % 2]); });
    }

    honk() {
      const g = this.g, self = this;
      g.sfx('horn');
      if (this.kind !== 'abe') return;
      g.run(function* () { yield self.say('Би-би! Он не уступает дорогу. Он её доедает.'); });
    }

    megaphone() {
      const g = this.g, self = this;
      g.sfx('megaphone');
      if (this.kind !== 'abe') return;
      g.run(function* () {
        yield self.say('Авраам Линкольн! Прижмитесь к обочине! Вольная полиция!');
        yield g.say(null, 'ЛИНКОЛЬН КРУШИТЬ!', { key: 'abefar', color: COLORS.lincoln, x: 160, y: 40 });
      });
    }

    objects(f) {
      const objs = super.objects(f);
      for (const w of this.wrecks) objs.push({ z: w.z, draw: () => {
        const p = this.carScreen(w);
        const sp = spr('carRear', { v: w.color, frame: 1 }, p.s);
        blit(f, sp.buf, Math.round(p.x - sp.ox), Math.round(p.y - sp.oy));
      } });
      if (this.kind === 'abe' || this.won) objs.push({ z: this.abe.z, draw: () => {
        const p = this.abeScreen();
        const sp = spr('lincoln', { dir: 'n', walk: (this.t * 0.8) % 1, v: this.g.f.beaconOn ? 'beacon' : '' }, p.s);
        blit(f, sp.buf, Math.round(p.x - sp.ox), Math.round(p.y - sp.oy));
      } });
      return objs;
    }

    drawTools(f, g) {
      if (g.has('beacon')) {
        const on = this.tool === 'beacon', hov = this.hover === 'beacon';
        S.rectFill(f, BEACON.x, BEACON.y, BEACON.w, BEACON.h, C.black);
        S.frameRect(f, BEACON.x, BEACON.y, BEACON.w, BEACON.h, on ? C.yellow[4] : hov ? C.orange[4] : C.orange[2]);
        blit(f, S.icon('beacon'), BEACON.x + 2, BEACON.y + 1);
        if (hov) font.draw(f, 'Маяк', 286 - font.measure('Маяк'), BEACON.y + 6, C.grey[5]);
      }
      super.drawTools(f, g);
      if (this.kind !== 'abe') return;
      const d = Math.max(0, Math.min(1, (this.abe.z - 11) / (FAR - 11)));
      font.draw(f, 'Линкольн:', 4, 4, C.grey[5]);
      S.rectFill(f, 62, 6, 60, 5, C.grey[1]);
      S.rectFill(f, 62, 6, Math.round(60 * (1 - d)), 5, this.abe.z <= NEAR ? C.green[4] : C.orange[3]);
      if (this.abe.z <= NEAR && g.has('beacon') && !g.busy) font.draw(f, 'Бросай маяк!', 130, 4, Math.floor(this.t * 4) % 2 ? C.yellow[4] : C.orange[4]);
    }
  }

  E.DEST = {
    street: { name: 'Прямая и Узкая улица', x: 96, y: 118, when: () => true, room: 'street', pos: { x: 80, y: 164, dir: 's' } },
    lawn: { name: 'Белый дом, Вашингтон', x: 236, y: 64, when: g => g.f.caseOpen, room: 'lawn', pos: { x: 112, y: 146, dir: 'e' } },
    chase: { name: 'Шоссе 95: Линкольн', x: 184, y: 118, when: g => g.f.rampage && !g.f.beaconOn, start: g => new LincolnChase(g) }
  };

  E.LincolnChase = LincolnChase;
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
