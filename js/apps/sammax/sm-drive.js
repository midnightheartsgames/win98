(function (S) {
  'use strict';
  const { W, H, C, Buf, Pen, blit, font, COSTUMES } = S;
  const HZ = 66, H0 = 496;
  const zToY = z => HZ + H0 / Math.max(0.5, z);
  const roadHalf = y => 2 + (y - HZ) / (200 - HZ) * 150;
  const laneX = (lane, y) => 160 + lane * roadHalf(y) * 0.62;
  const PLAYER_Z = 4.6;
  const TOOLS = ['steer', 'gun', 'megaphone', 'horn', 'exit'];
  const TOOL_NAMES = { steer: 'Руль', gun: 'Пистолет', megaphone: 'Мегафон', horn: 'Гудок', exit: 'Вернуться' };
  const TOOL_Y = 70;
  const CAR_COLORS = ['red', 'green', 'blue', 'yellow', 'grey'];
  const RAMP = { red: C.red, green: C.green, blue: C.blue, yellow: C.gold, grey: C.stone };

  COSTUMES.carRear = {
    h: 40, w: 70,
    draw(P, o) {
      const r = RAMP[o.v] || C.red;
      P.part(P.path('M -30 -4 L -31 -20 Q -30 -26 -24 -26 L 24 -26 Q 30 -26 31 -20 L 30 -4 Z'), r, { b: 2 });
      P.part(P.path('M -20 -26 L -16 -38 L 16 -38 L 20 -26 Z'), r, { b: 3 });
      P.part(P.poly([-15, -36, 15, -36, 18, -27, -18, -27]), C.sky, { b: 2, sh: 0 });
      P.part(P.rect(-31, -9, 62, 4), C.grey, { b: 4, sh: 0 });
      P.part(P.rect(-6, -18, 12, 6), C.grey, { b: 5, sh: 0 });
      P.part(P.rect(-28, -20, 8, 6), C.red, { b: 4, sh: 0 });
      if (o.frame === 1) { P.part(P.rect(20, -20, 8, 6), C.grey, { b: 0, sh: 0 }); P.line(21, -19, 27, -15, C.grey[3]); P.line(21, -15, 27, -19, C.grey[3]); }
      else P.part(P.rect(20, -20, 8, 6), C.red, { b: 4, sh: 0 });
      P.part(P.rect(-28, -5, 10, 6), C.grey, { b: 0 });
      P.part(P.rect(18, -5, 10, 6), C.grey, { b: 0 });
    }
  };

  COSTUMES.vanRear = {
    h: 60, w: 70,
    draw(P, o) {
      P.part(P.rect(-30, -56, 60, 50), C.cream, { b: 3 });
      P.line(0, -54, 0, -8, C.cream[1]);
      P.part(P.ell(0, -36, 16, 10), C.eye, { sh: 0, hi: 0 });
      P.part(P.ell(0, -36, 6, 6), C.blue, { b: 2, sh: 0, hi: 0 });
      P.px(0, -36, C.pupil);
      P.part(P.rect(-31, -9, 62, 4), C.grey, { b: 3, sh: 0 });
      P.part(P.rect(-29, -24, 6, 8), C.red, { b: 4, sh: 0 });
      P.part(P.rect(23, -24, 6, 8), C.red, { b: 4, sh: 0 });
      const flat = o.frame || 0;
      P.part(P.rect(-28, -6 + (flat & 1 ? 2 : 0), 12, flat & 1 ? 5 : 8), C.grey, { b: 0 });
      P.part(P.rect(16, -6 + (flat & 2 ? 2 : 0), 12, flat & 2 ? 5 : 8), C.grey, { b: 0 });
    }
  };

  COSTUMES.desotoRear = {
    h: 56, w: 100,
    draw(P, o) {
      P.part(P.poly([-24, -50, 24, -50, 28, -38, -28, -38]), C.sky, { b: 2, sh: 0 });
      P.line(-24, -50, 24, -50, C.grey[5]);
      P.part(P.ell(0, -38, 4, 2.5), o.frame ? [C.neonA, C.neonA, C.neonA, C.neonA, C.neonA] : C.red, { b: 1, sh: 0 });
      S.art.samHat(P.scaled(-9, -40, 0.62), -9, 15);
      P.part(P.cap(14, -40, 16, -54, 2, 1.4), C.maxw, { b: 3, sh: 0 });
      P.part(P.cap(18, -40, 21, -53, 2, 1.4), C.maxw, { b: 3, sh: 0 });
      P.part(P.path('M -34 -30 L -33 -37 Q -19 -40 -4 -37 L -3 -30 Z M 3 -30 L 4 -37 Q 19 -40 33 -37 L 34 -30 Z'), C.red, { b: 2, sh: 1 });
      P.part(P.rect(-32, -33, 64, 4), C.cream, { b: 3, sh: 0 });
      P.part(P.poly([-46, -22, -45, -48, -37, -28]), C.grey, { b: 1, sh: 0 });
      P.part(P.poly([46, -22, 45, -48, 37, -28]), C.grey, { b: 1, sh: 0 });
      P.part(P.path('M -44 -6 L -46 -22 L -40 -30 L 40 -30 L 46 -22 L 44 -6 Z'), C.grey, { b: 0, sh: 1 });
      P.line(-38, -25, 38, -25, C.red[3]);
      P.px(-45, -44, C.red[3]); P.px(45, -44, C.red[3]);
      P.part(P.rect(-46, -12, 92, 5), C.grey, { b: 4, sh: 0 });
      P.part(P.rect(-45, -27, 5, 12), C.red, { b: 3, sh: 0 });
      P.part(P.rect(40, -27, 5, 12), C.red, { b: 3, sh: 0 });
      P.part(P.rect(-7, -20, 14, 6), C.gold, { b: 3, sh: 0 });
      P.line(-4, -17, 4, -17, C.gold[0]);
      P.part(P.rect(-42, -8, 12, 8), C.grey, { b: 0 });
      P.part(P.rect(30, -8, 12, 8), C.grey, { b: 0 });
    }
  };

  COSTUMES.crate = {
    h: 24, w: 24,
    draw(P) {
      P.part(P.rect(-10, -18, 20, 18), C.oak, { b: 3 });
      P.line(-10, -18, 10, 0, C.oak[1]); P.line(10, -18, -10, 0, C.oak[1]);
      P.part(P.rect(-4, -12, 8, 5), C.red, { b: 3, sh: 0, hi: 0 });
    }
  };

  function spr(id, o, s) {
    const q = Math.max(0.05, Math.round(s * 20) / 20);
    return S.sprite(id, o, q);
  }

  const DEST = {
    street: { name: 'Прямая и Узкая улица', x: 96, y: 118, when: () => true, room: 'street', pos: { x: 80, y: 164, dir: 's' } },
    patrol: { name: 'Шоссе: патрулирование', x: 236, y: 64, when: g => g.f.caseOpen, start: g => new Drive(g, 'patrol') },
    home: { name: 'Приют Брэди Калчера', x: 254, y: 150, when: g => g.f.homeKnown, room: 'homegate', pos: { x: 124, y: 182, dir: 'e' } }
  };
  const destsOf = g => g.ep.DEST;
  const destFor = (g, room) => Object.keys(destsOf(g)).find(id => destsOf(g)[id].room === room) || Object.keys(destsOf(g)).find(id => destsOf(g)[id].room);

  const mapCache = { b: null };
  function mapBg() {
    if (mapCache.b) return mapCache.b;
    const b = new Buf(W, H, C.sand[3]);
    const P = new Pen(b);
    const all = new S.Mask(0, 0, W, H); all.m.fill(1);
    S.grad(b, all, C.cream, (x, y) => 0.55 + (S.hash(x >> 1, y >> 1, 3) - 0.5) * 0.12 - Math.hypot(x - 160, y - 100) / 900);
    P.part(P.path('M 0 150 Q 60 130 110 150 Q 170 175 210 130 Q 250 90 320 100 L 320 112 Q 256 104 220 140 Q 176 188 108 162 Q 60 144 0 164 Z'), C.sky, { b: 3 });
    P.part(P.ell(60, 60, 34, 22), C.green, { b: 3 });
    for (let i = 0; i < 9; i++) P.part(P.ell(40 + (i % 3) * 18, 48 + Math.floor(i / 3) * 12, 5, 4), C.green, { b: 2, sh: 0 });
    for (let x = 14; x < 320; x += 22) S.line(b, x, 8, x - 6, 196, C.cream[1]);
    for (let y = 16; y < 200; y += 20) S.line(b, 4, y, 316, y + 4, C.cream[1]);
    P.part(P.path('M 150 200 L 180 120 Q 200 70 240 64 L 320 50 L 320 58 L 244 72 Q 206 80 188 124 L 160 200 Z'), C.orange, { b: 3 });
    P.part(P.path('M 230 172 Q 256 136 290 160 L 290 172 Z'), C.olive, { b: 3 });
    S.bigText(b, 'КАРТА ГОРОДА', 160, 6, 2, C.red[3], C.orange[4], 1);
    font.draw(b, 'Куда едем?', 8, 186, C.wood[1], 0);
    mapCache.b = b;
    return b;
  }

  class MapScreen {
    constructor(g) { this.g = g; this.hover = null; this.kind = 'map'; }
    dests() { return Object.entries(destsOf(this.g)).filter(([, d]) => d.when(this.g)); }
    hit(x, y) {
      for (const [id, d] of this.dests()) if (Math.abs(x - d.x) < 12 && Math.abs(y - d.y) < 12) return id;
      if (x > 250 && y > 182) return 'cancel';
      return null;
    }
    pointer(x, y) { this.hover = this.hit(x, y); }
    click(x, y) {
      const id = this.hit(x, y);
      if (!id) return;
      this.choose(id);
    }
    choose(id) {
      const g = this.g;
      const d = destsOf(g)[id];
      if (id === 'cancel') { g.mode = 'room'; g.drive = null; return; }
      if (!d || !d.when(g)) return;
      g.sfx('horn');
      g.drive = d.start ? d.start(g) : new Drive(g, 'travel', id);
      g.mode = 'drive';
      g.music(g.drive.music || 'drive');
      if (g.drive.begin) g.run(g.drive.begin.bind(g.drive), { name: 'drivebegin' });
    }
    update() {}
    render(f, g) {
      blit(f, mapBg(), 0, 0);
      for (const [id, d] of this.dests()) {
        const hov = this.hover === id;
        const P = new Pen(f);
        P.part(P.ell(d.x, d.y, 5, 5), hov ? C.yellow : C.red, { b: 3 });
        P.part(P.cap(d.x, d.y + 4, d.x, d.y + 10, 1), C.grey, { b: 1, sh: 0 });
        const lw = font.measure(d.name);
        font.draw(f, d.name, Math.max(2, Math.min(W - 2 - lw, d.x - lw / 2)), d.y - 16, hov ? C.yellow[4] : C.grey[5]);
      }
      const here = destsOf(g)[destFor(g, g.roomId)];
      const ic = S.icon('car');
      blit(f, ic, here.x - 12, here.y + 8);
      font.draw(f, 'Отмена', 262, 186, this.hover === 'cancel' ? C.yellow[4] : C.grey[5]);
      const cur = S.cursor('use', !!this.hover);
      blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy);
    }
  }

  class Drive {
    constructor(g, kind, dest) {
      this.g = g; this.kind = kind; this.dest = dest; this.from = g.roomId;
      this.t = 0; this.scroll = 0; this.speed = 9;
      this.lane = 0; this.x = 0;
      this.tool = 'steer';
      this.cars = []; this.crates = [];
      this.hover = null;
      this.spawnT = 1;
      this.paused = false;
      this.msg = null;
      this.van = null;
      this.done = false;
      this.hits = 0;
      this.vanTires = 0;
      this.panel = null;
      this.siren = kind !== 'travel';
      if (kind === 'chase') {
        this.van = { lane: 0, z: 40, target: 40, flat: 0, moveT: 2, dropT: 3 };
      }
      if (kind === 'patrol') for (let i = 0; i < 3; i++) this.spawnCar(18 + i * 16);
      if (kind === 'travel') this.left = 2.8;
    }

    rnd() { return this.g.rng.next(); }

    spawnCar(z) {
      const lane = this.g.rng.int(3) - 1;
      if (this.cars.some(c => c.lane === lane && Math.abs(c.z - z) < 6)) return;
      this.cars.push({ lane, z, v: 3 + this.rnd() * 3, color: CAR_COLORS[this.g.rng.int(CAR_COLORS.length)], broken: false, pulled: false, x: lane, id: Math.floor(this.rnd() * 1e6) });
    }

    say(text, who) {
      const g = this.g;
      return g.say(who || 'sam', text, { x: 160, y: 58 });
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
      if (this.kind === 'patrol') {
        this.spawnT -= dt;
        if (this.spawnT <= 0 && this.cars.length < 5) { this.spawnCar(60 + this.rnd() * 20); this.spawnT = 1.5 + this.rnd() * 2; }
        for (const c of this.cars) {
          c.z += (c.v - this.speed) * dt * (c.pulled ? 0 : 1);
          c.x += (c.lane - c.x) * Math.min(1, dt * 3);
          if (c.z < PLAYER_Z + 3 && Math.abs(c.x - this.x) < 0.6 && c.z > 1) {
            c.z = PLAYER_Z + 8; c.v = this.speed + 1;
            g.sfx('crash'); g.fx.shake = 0.5;
          }
        }
        this.cars = this.cars.filter(c => c.z > 0.6 && c.z < 90);
        return;
      }
      if (this.kind === 'chase') {
        const v = this.van;
        v.moveT -= dt;
        if (v.moveT <= 0) {
          v.moveT = 2 + this.rnd() * 2.5;
          const choices = [-1, 0, 1].filter(l => l !== v.lane);
          v.lane = choices[g.rng.int(choices.length)];
        }
        v.x = v.x === undefined ? v.lane : v.x + (v.lane - v.x) * Math.min(1, dt * 2.5);
        v.target = Math.max(8, v.target - dt * 2.4);
        v.z += (v.target - v.z) * Math.min(1, dt * 1.5);
        v.dropT -= dt;
        if (v.dropT <= 0 && v.z > 10) {
          v.dropT = 1.4 + this.rnd() * 1.3;
          this.crates.push({ lane: v.lane, x: v.x, z: v.z - 1, spin: 0 });
          g.sfx('thump');
        }
        for (const c of this.crates) {
          c.z -= dt * 14;
          if (!c.hit && c.z < PLAYER_Z + 1.5 && c.z > PLAYER_Z - 1.5 && Math.abs(c.x - this.x) < 0.55) {
            c.hit = true; this.hits++;
            v.target = Math.min(44, v.target + 14);
            g.sfx('crash'); g.fx.shake = 0.7;
          }
        }
        this.crates = this.crates.filter(c => c.z > 1 && !c.hit);
      }
    }

    steer(dir) {
      if (this.paused || this.done) return;
      this.lane = Math.max(-1, Math.min(1, this.lane + dir));
    }

    key(k) {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A' || k === 'ф' || k === 'Ф') { this.steer(-1); return true; }
      if (k === 'ArrowRight' || k === 'd' || k === 'D' || k === 'в' || k === 'В') { this.steer(1); return true; }
      const i = ['1', '2', '3', '4', '5'].indexOf(k);
      if (i >= 0) { this.selectTool(TOOLS[i]); return true; }
      if (k === 'Escape') return false;
      return false;
    }

    toolRect(i) { return { x: 290, y: TOOL_Y + i * 25, w: 28, h: 22 }; }

    toolAt(x, y) {
      for (let i = 0; i < TOOLS.length; i++) {
        const r = this.toolRect(i);
        if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return TOOLS[i];
      }
      return null;
    }

    pointer(x, y) {
      this.hover = this.toolAt(x, y);
      this.g.mx = x; this.g.my = y;
    }

    selectTool(t) {
      const g = this.g;
      if (this.paused || this.g.busy) return;
      if (t === 'exit') {
        if (this.kind === 'chase') { g.run(function* () { yield g.say('max', 'Нельзя! Мы упустим фургон!', { x: 160, y: 58 }); }); return; }
        this.leave();
        return;
      }
      if (t === 'horn') { this.honk(); return; }
      if (t === 'megaphone') { this.megaphone(); return; }
      this.tool = t;
    }

    click(x, y, btn) {
      const g = this.g;
      if (g.busy) { g.skipLine(); return; }
      if (btn === 2) { this.tool = 'steer'; return; }
      const t = this.toolAt(x, y);
      if (t) { this.selectTool(t); return; }
      if (this.paused || this.done) return;
      if (this.tool === 'steer') { this.steer(x < 160 + this.x * 60 - 20 ? -1 : x > 160 + this.x * 60 + 20 ? 1 : 0); return; }
      if (this.tool === 'gun') { this.shoot(x, y); return; }
      if (this.tool === 'megaphone') { this.megaphone(); return; }
    }

    carScreen(c) {
      const y = zToY(c.z);
      return { x: laneX(c.x, y) - this.x * roadHalf(y) * 0.22, y, s: PLAYER_Z / c.z };
    }

    lightRects(c) {
      const p = this.carScreen(c);
      const s = p.s;
      return [
        { side: 0, x0: p.x - 28 * s, x1: p.x - 20 * s, y0: p.y - 20 * s, y1: p.y - 14 * s },
        { side: 1, x0: p.x + 20 * s, x1: p.x + 28 * s, y0: p.y - 20 * s, y1: p.y - 14 * s }
      ];
    }

    shoot(x, y) {
      const g = this.g;
      g.sfx('gun'); g.fx.flash = 0.25;
      const self = this;
      if (this.kind === 'patrol') {
        for (const c of this.cars.slice().sort((a, b) => a.z - b.z)) {
          if (c.z > 26 || c.pulled) continue;
          for (const r of this.lightRects(c)) {
            const pad = 3 + 3 * (PLAYER_Z / c.z);
            if (x >= r.x0 - pad && x <= r.x1 + pad && y >= r.y0 - pad && y <= r.y1 + pad) {
              if (c.broken) { g.run(function* () { yield self.say('Она уже разбита. Второй раз будет вандализм.'); }); return; }
              c.broken = true;
              g.sfx('pop');
              g.run(function* () {
                yield self.say('Ой. У вас, кажется, разбита задняя фара.');
                if (!g.seen.lightHint) { g.seen.lightHint = 1; yield g.say('max', 'Нарушитель! Хватай его, Сэм! Кричи в мегафон!', { x: 160, y: 58 }); }
              });
              return;
            }
          }
        }
        g.run(function* () { yield g.say('max', ['Мимо!', 'Промазал!', 'Сэм, целься в задние фары! Красные такие!'][g.count('driveMiss') % 3], { x: 160, y: 58 }); });
        return;
      }
      if (this.kind === 'chase') {
        const v = this.van;
        const p = this.carScreen(v);
        const s = p.s;
        const tires = [{ bit: 1, x0: p.x - 28 * s, x1: p.x - 16 * s }, { bit: 2, x0: p.x + 16 * s, x1: p.x + 28 * s }];
        for (const t of tires) {
          if (x >= t.x0 - 2 && x <= t.x1 + 2 && y >= p.y - 8 * s - 3 && y <= p.y + 3) {
            if (v.z > 16) { g.run(function* () { yield self.say('Слишком далеко. Надо подобраться поближе.'); }); return; }
            if (v.flat & t.bit) return;
            v.flat |= t.bit;
            g.sfx('tire');
            if (v.flat === 3) { this.win(); return; }
            g.run(function* () { yield g.say('max', 'Одна есть! Давай вторую!', { x: 160, y: 58 }); });
            return;
          }
        }
        g.run(function* () { yield g.say('max', v.z > 16 ? 'Далеко, Сэм! Подъезжай поближе! И не собирай ящики лицом!' : 'Целься в колёса, Сэм!', { x: 160, y: 58 }); });
      }
    }

    ahead() {
      return this.cars.filter(c => !c.pulled && Math.abs(c.x - this.x) < 0.5 && c.z > PLAYER_Z && c.z < 26).sort((a, b) => a.z - b.z)[0] || null;
    }

    honk() {
      const g = this.g;
      g.sfx('horn');
      if (this.kind !== 'patrol') {
        if (this.kind === 'chase') { const self = this; g.run(function* () { yield self.say('Би-би! Фургон не реагирует. Видимо, водитель смотрит в глаза.'); }); }
        return;
      }
      const c = this.ahead();
      if (c) {
        const free = [-1, 0, 1].filter(l => l !== c.lane && !this.cars.some(o => o !== c && o.lane === l && Math.abs(o.z - c.z) < 6));
        if (free.length) c.lane = free[this.g.rng.int(free.length)];
      }
    }

    megaphone() {
      const g = this.g;
      g.sfx('megaphone');
      const self = this;
      if (this.kind === 'chase') { g.run(function* () { yield self.say('Фургон «Ай-Бо», прижмитесь к обочине!'); yield g.say(null, 'Смотрите в глаза!', { key: 'driver', color: S.COLORS.driver, x: 160, y: 40 }); }); return; }
      const c = this.ahead();
      if (!c) {
        const side = this.cars.find(o => o.broken && !o.pulled && o.z > PLAYER_Z && o.z < 30);
        g.run(function* () { yield self.say(side ? 'Нарушитель в соседнем ряду. Надо пристроиться прямо за ним.' : 'Внимание, граждане! ...Никого. Даже обидно.'); });
        return;
      }
      if (!c.broken) {
        g.run(function* () {
          yield self.say('Прижмитесь к обочине! ...Хм. А за что? У него всё в порядке.');
          if (!g.seen.megaHint) { g.seen.megaHint = 1; yield g.say('max', 'Так сделай, чтобы было не в порядке! Пистолет у тебя для красоты?', { x: 160, y: 58 }); }
        });
        return;
      }
      if (g.f.gotCash) { g.run(function* () { yield self.say('Прижмитесь к обочине! ...Ладно, езжайте. Нам хватит одного штрафа за день.'); }); c.broken = false; return; }
      c.pulled = true;
      this.pullOver(c);
    }

    pullOver(c) {
      const g = this.g;
      this.paused = true;
      const self = this;
      g.run(function* () {
        yield self.say('Прижмитесь к обочине! Вольная полиция!');
        self.panel = { kind: 'driver', color: c.color };
        const drv = t => g.say(null, t, { key: 'driver', color: S.COLORS.driver, x: 160, y: 44 });
        yield drv('В чём дело, офицер?');
        yield self.say('У вас разбита задняя фара.');
        yield drv('Что?! Она была целая пять секунд назад!');
        yield self.say('Все так говорят. Штраф десять тысяч долларов. Наличными.');
        yield drv('Десять тысяч?! ...Ладно, берите! Всё берите! Только не заглядывайте в багажник!');
        g.give('cash');
        g.f.gotCash = true;
        g.sfx('cash');
        yield g.say('max', 'Сэм, по-моему, он грабитель банков.', { x: 160, y: 58 });
        yield self.say('Ерунда, Макс. Грабители банков всегда включают поворотники.');
        self.panel = null;
        self.cars = self.cars.filter(o => o !== c);
        self.paused = false;
        yield self.say('Теперь к Боско за гранатомётом. Жму на иконку с домом.');
      });
    }

    win() {
      const g = this.g;
      this.paused = true;
      const self = this;
      g.run(function* () {
        g.sfx('crash');
        g.fx.shake = 1;
        self.van.spin = true;
        yield g.say('max', 'Попали! Он вертится! Он улетает в кусты!', { x: 160, y: 58 });
        yield 1.2;
        g.f.vanChased = true;
        g.f.vanCrashed = true;
        g.f.homeKnown = true;
        self.done = true;
        g.mode = 'room';
        g.drive = null;
        g.music('home');
        yield* g.goRoom('homegate', { x: 124, y: 182, dir: 'e' });
        yield g.say('sam', '«Приют Брэди Калчера для бывших детских звёзд». Вот куда свозят кассеты.');
        yield g.say('max', 'И бывших звёзд! Склад и зрители в одном месте!');
        yield g.say('sam', 'Водитель фургона сбежал за ворота. Похоже, сюда пускают только пациентов.');
      }, { name: 'chasewin' });
    }

    leave() {
      const g = this.g;
      this.kind = 'travel';
      this.dest = destFor(g, this.from);
      this.left = 1.5;
      g.sfx('horn');
      this.cars = [];
    }

    arrive() {
      const g = this.g;
      this.done = true;
      const d = destsOf(g)[this.dest];
      g.run(function* () {
        yield g.fadeOut(3);
        g.mode = 'room';
        g.drive = null;
        yield* g.goRoom(d.room, d.pos);
      }, { name: 'arrive' });
    }

    render(f, g) {
      this.renderRoad(f);
      const objs = this.objects(f);
      objs.sort((a, b) => b.z - a.z);
      for (const o of objs) o.draw();
      const me = spr('desotoRear', { frame: this.siren && Math.floor(this.t * 6) % 2 }, 1);
      blit(f, me.buf, Math.round(160 + this.x * 70 - me.ox), Math.round(196 - me.oy + (Math.floor(this.t * 12) % 2)));
      if (this.panel) this.drawPanel(f);
      this.drawTools(f, g);
    }

    renderRoad(f) {
      const px = f.px;
      const skyTop = [C.purple[1], C.plum[2], C.rose[3], C.orange[3]];
      for (let y = 0; y < HZ; y++) {
        const t = y / HZ * (skyTop.length - 1);
        const i = Math.floor(t);
        for (let x = 0; x < W; x++) px[y * W + x] = S.dith(x, y, t - i) ? skyTop[Math.min(i + 1, skyTop.length - 1)] : skyTop[i];
      }
      const off = Math.floor(-this.x * 14);
      for (let x = 0; x < W; x++) {
        const k = Math.floor((x + off + 1000) / 14);
        const h = 8 + Math.floor(S.hash(k, 9, 1) * 22);
        for (let y = HZ - h; y < HZ; y++) px[y * W + x] = C.night[1];
        if ((x + off) % 5 === 2) for (let y = HZ - h + 3; y < HZ - 2; y += 4) if (S.hash(k, y, 2) > 0.55) px[y * W + x] = C.lamp;
      }
      for (let y = HZ; y < H; y++) {
        const z = H0 / (y - HZ + 0.5);
        const stripe = Math.floor((z + this.scroll) / 2.2) % 2 === 0;
        const half = roadHalf(y);
        const cx = 160 - this.x * half * 0.62 * 0.35;
        const grass = stripe ? C.olive[2] : C.olive[3];
        for (let x = 0; x < W; x++) {
          const dx = Math.abs(x - cx);
          let c;
          if (dx > half * 1.12) c = grass;
          else if (dx > half) c = stripe ? C.red[3] : C.grey[5];
          else {
            c = S.dith(x, y, (y - HZ) / 300) ? C.asphalt[3] : C.asphalt[2];
            const lane = Math.abs(dx - half * 0.31);
            if (lane < Math.max(0.6, half * 0.012) && stripe) c = C.grey[5];
          }
          px[y * W + x] = c;
        }
      }
    }

    objects(f) {
      const objs = [];
      for (let k = 0; k < 8; k++) {
        const z = ((k * 11 - this.scroll) % 88 + 88) % 88 + 2;
        const y = zToY(z), s = PLAYER_Z / z;
        for (const side of [-1, 1]) objs.push({ z, draw: () => {
          const x = 160 - this.x * roadHalf(y) * 0.22 + side * roadHalf(y) * 1.25;
          const m = new Pen(f);
          m.part(m.rect(x - 1.5 * s, y - 60 * s, 3 * s + 1, 60 * s), C.grey, { b: 1, sh: 0, hi: 0 });
          m.part(m.rect(x - (side > 0 ? 10 : 0) * s, y - 62 * s, 10 * s + 1, 3 * s + 1), C.grey, { b: 1, sh: 0, hi: 0 });
          m.part(m.rect(x + (side > 0 ? -10 : 7) * s, y - 60 * s, 3 * s + 1, 2 * s + 1), [C.lamp, C.lamp, C.lamp, C.lamp, C.lamp], { sh: 0, hi: 0, ol: 0 });
        } });
      }
      for (const c of this.cars) objs.push({ z: c.z, draw: () => { const p = this.carScreen(c); const sp = spr('carRear', { v: c.color, frame: c.broken ? 1 : 0 }, p.s); blit(f, sp.buf, Math.round(p.x - sp.ox), Math.round(p.y - sp.oy)); } });
      for (const c of this.crates) objs.push({ z: c.z, draw: () => { const p = this.carScreen(c); const sp = spr('crate', {}, p.s); blit(f, sp.buf, Math.round(p.x - sp.ox), Math.round(p.y - sp.oy)); } });
      if (this.van) objs.push({ z: this.van.z, draw: () => { const p = this.carScreen(this.van); const sp = spr('vanRear', { frame: this.van.flat }, p.s); blit(f, sp.buf, Math.round(p.x - sp.ox), Math.round(p.y - sp.oy)); } });
      return objs;
    }

    drawPanel(f) {
      S.panel(f, 90, 70, 140, 70, C.navy.concat([C.suit[3]]));
      const P = new Pen(f);
      P.part(P.rect(100, 78, 120, 54), C.sky, { b: 2, sh: 0 });
      P.part(P.ell(160, 118, 22, 20), C.skin, { b: 3 });
      P.part(P.path('M 138 108 Q 160 88 182 108 L 182 100 Q 160 84 138 100 Z'), C.grey, { b: 1 });
      P.part(P.rect(136, 98, 48, 6), C.grey, { b: 1 });
      P.part(P.ell(152, 114, 3, 3), C.eye, { sh: 0, hi: 0 }); P.px(152, 114, C.pupil);
      P.part(P.ell(168, 114, 3, 3), C.eye, { sh: 0, hi: 0 }); P.px(168, 114, C.pupil);
      P.part(P.path('M 146 124 Q 160 118 174 124 Q 160 128 146 124 Z'), C.grey, { b: 0 });
      P.part(P.rect(106, 118, 22, 14), C.sand, { b: 3 });
      font.draw(f, '$', 113, 120, C.green[2], 0);
    }

    drawTools(f, g) {
      const ids = { steer: 'car', gun: 'gun', megaphone: 'megaphone', horn: 'horn', exit: 'house' };
      for (let i = 0; i < TOOLS.length; i++) {
        const r = this.toolRect(i);
        const t = TOOLS[i];
        const on = this.tool === t, hov = this.hover === t;
        S.rectFill(f, r.x, r.y, r.w, r.h, C.black);
        S.frameRect(f, r.x, r.y, r.w, r.h, on ? C.yellow[4] : hov ? C.orange[4] : C.orange[2]);
        const ic = S.icon(ids[t]);
        blit(f, ic, r.x + 2, r.y + 1);
      }
      const label = this.hover ? TOOL_NAMES[this.hover] : null;
      if (label) font.draw(f, label, 286 - font.measure(label), TOOL_Y + TOOLS.indexOf(this.hover) * 25 + 6, C.grey[5]);
      if (this.kind === 'chase' && this.van) {
        const d = Math.max(0, Math.min(1, (this.van.z - 8) / 36));
        font.draw(f, 'Фургон:', 4, 4, C.grey[5]);
        S.rectFill(f, 50, 6, 60, 5, C.grey[1]);
        S.rectFill(f, 50, 6, Math.round(60 * (1 - d)), 5, d < 0.25 ? C.green[4] : C.orange[3]);
      }
      if (this.kind === 'travel') font.drawCentered(f, 'В пути...', 160, 6, C.grey[5]);
      if (this.kind === 'patrol' && !g.busy && !g.f.gotCash) font.draw(f, 'Патрулирование', 4, 4, C.grey[5]);
      if (!g.busy && this.kind !== 'travel') {
        const tool = this.tool;
        const cur = tool === 'gun' ? { buf: S.icon('crosshair'), hx: 7, hy: 7 } : S.cursor('use', !!this.hover);
        blit(f, cur.buf, g.mx - cur.hx, g.my - cur.hy);
      }
    }
  }

  S.ICONS.megaphone = () => { const b = new Buf(24, 20); const P = new Pen(b); P.part(P.poly([4, 8, 10, 8, 20, 2, 20, 18, 10, 12, 4, 12]), C.grey, { b: 4 }); P.part(P.rect(6, 12, 3, 5), C.grey, { b: 1, sh: 0 }); return b; };
  S.ICONS.horn = () => { const b = new Buf(24, 20); const P = new Pen(b); P.part(P.ell(8, 10, 5, 5), C.red, { b: 3 }); P.part(P.poly([10, 8, 20, 3, 20, 17, 10, 12]), C.gold, { b: 3 }); return b; };
  S.ICONS.house = () => { const b = new Buf(24, 20); const P = new Pen(b); P.part(P.poly([3, 9, 12, 2, 21, 9]), C.red, { b: 3 }); P.part(P.rect(5, 9, 14, 9), C.brick, { b: 3 }); P.part(P.rect(10, 12, 4, 6), C.oak, { b: 2, sh: 0 }); return b; };
  S.ICONS.crosshair = () => { const b = new Buf(15, 15); for (let i = 0; i < 15; i++) { if (Math.abs(i - 7) > 1) { b.set(i, 7, C.red[4]); b.set(7, i, C.red[4]); } } for (let a = 0; a < 24; a++) b.set(Math.round(7 + Math.cos(a / 24 * Math.PI * 2) * 5), Math.round(7 + Math.sin(a / 24 * Math.PI * 2) * 5), C.black); return b; };

  S.openMap = function* (g) {
    yield g.say('sam', g.roomId === 'homegate' ? 'Садимся в машину.' : 'В машину, Макс.');
    g.mode = 'map';
    g.drive = new MapScreen(g);
  };

  S.startDrive = function* (g, kind) {
    yield g.fadeOut(3);
    g.mode = 'drive';
    g.drive = new Drive(g, kind);
    g.music(kind === 'chase' ? 'finale' : 'drive');
    yield g.fadeIn(3);
    if (kind === 'chase') {
      yield g.say('max', 'Вон он! Уворачивайся от ящиков, Сэм! Стрелками или рулём!', { x: 160, y: 58 });
      yield g.say('sam', 'Подберусь поближе и прострелю ему шины.', { x: 160, y: 58 });
    }
  };

  S.Drive = Drive;
  S.MapScreen = MapScreen;
  S.DEST = DEST;
  S.driveMath = { zToY, roadHalf, laneX, PLAYER_Z, TOOLS, TOOL_NAMES, DEST, spr };
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
