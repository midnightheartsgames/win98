(function (A) {
  'use strict';
  const near = (a, b, r) => (a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) < r * r;
  const kind = f => A.FLIGHT.foes[f.kind];
  const LIVE = ['in', 'fight', 'aim', 'dive'];

  A.Flight = class {
    constructor(opts) {
      const def = A.FLIGHTS[opts.id], K = A.FLIGHT;
      if (!def) throw new Error('unknown flight ' + opts.id);
      const diff = A.DIFFICULTY[opts.difficulty] || A.DIFFICULTY.normal;
      this.id = opts.id;
      this.def = def;
      this.rnd = A.rng(opts.seed || 1);
      this.dmgK = diff.dmg;
      this.hpK = diff.hp;
      const max = Math.round(def.shields * (opts.help ? K.help : 1));
      this.leakMax = def.goal.leak ? Math.round(def.goal.leak * (opts.help ? K.help : 1)) : 0;
      this.ship = { x: K.w / 2, y: K.ship.bottom - 20, shield: max, max, cool: 0, dash: 0, dashCool: 0, dx: 0, dy: -1, ddx: 0, ddy: -1, inv: 1, ion: 0 };
      this.t = 0;
      this.scroll = 0;
      this.speed = def.scroll;
      this.shots = [];
      this.bolts = [];
      this.foes = [];
      this.events = [];
      this.plan = def.timeline.map(([at, op, ...args]) => ({ at, op, args }));
      this.next = 0;
      this.stats = { kills: 0, leaked: 0, hits: 0, dashes: 0, shots: 0, assists: 0 };
      this.assistT = def.assist ? def.assist.every : 0;
      this.boss = null;
      this.base = null;
      this.dome = false;
      this.dived = false;
      this.ended = false;
      this.closing = 0;
      this.over = null;
      this.reason = null;
    }

    emit(e) {
      this.events.push(e);
    }

    take() {
      const out = this.events;
      this.events = [];
      return out;
    }

    radio(pair) {
      if (pair) this.emit({ type: 'radio', who: pair[0], text: pair[1] });
    }

    foe(id) {
      const k = A.FLIGHT.foes[id], hp = k.hp ? Math.max(1, Math.round(k.hp * this.hpK)) : 0;
      return { kind: id, x: 0, y: -12, vx: 0, vy: 0, r: k.r, hp, max: hp, t: 0, wait: 0, flash: 0, fire: k.cadence ? k.cadence * (0.5 + this.rnd()) : 0, mode: 'path' };
    }

    step(dt, inp) {
      if (this.over) return;
      this.t += dt;
      this.scroll += this.speed * dt;
      while (this.next < this.plan.length && this.plan[this.next].at <= this.t) this.run(this.plan[this.next++]);
      const b = this.base;
      if (b && b.y < b.ty) {
        b.y = Math.min(b.ty, b.y + Math.max(this.speed, 30) * dt);
        if (b.y >= b.ty) {
          this.speed = 0;
          this.emit({ type: 'base' });
        }
      }
      this.fly(dt, inp || {});
      if (this.def.assist) this.assist(dt);
      for (const f of this.foes) if (!f.gone) this.move(f, dt);
      this.travel(dt);
      this.collide();
      this.foes = this.foes.filter(f => !f.gone);
      this.judge(dt);
    }

    run(e) {
      const a = e.args;
      switch (e.op) {
        case 'radio': this.radio(a); break;
        case 'wave': this.wave(a[0], a[1], a[2], a[3] || {}); break;
        case 'spires': this.scatter('spire', a[0], a[1]); break;
        case 'geysers': this.scatter('geyser', a[0], a[1]); break;
        case 'orbs': this.orbs(a[0], a[1]); break;
        case 'boss': this.bossIn(a[0]); break;
        case 'base': this.raise(); break;
        case 'kamikaze': this.kamikaze(); break;
        case 'retreat': this.retreat(); break;
        case 'end': this.ended = true; break;
        default: throw new Error('unknown flight step ' + e.op);
      }
    }

    wave(id, pattern, n, o) {
      const W = A.FLIGHT.w, sp = o.speed || this.def.foeSpeed || 70;
      for (let i = 0; i < n; i++) {
        const f = this.foe(id);
        if (pattern === 'line') {
          f.x = W * (i + 1) / (n + 1);
          f.vy = sp;
        } else if (pattern === 'vee') {
          const k = i - (n - 1) / 2;
          f.x = W / 2 + k * (o.gap || 22);
          f.y = -12 - Math.abs(k) * 16;
          f.vy = sp;
        } else if (pattern === 'column') {
          f.x = o.x === undefined ? 60 + this.rnd() * 200 : o.x;
          f.wait = i * (o.gap || 0.45);
          f.vy = sp;
          f.wob = o.wob || 0;
        } else if (pattern === 'sweep') {
          const left = o.side !== 'right';
          f.x = left ? -12 : W + 12;
          f.y = (o.y || 40) + i * 4;
          f.wait = i * (o.gap || 0.35);
          f.vx = (left ? 1 : -1) * (o.speed || 95);
          f.vy = o.drop || 18;
        } else if (pattern === 'dive') {
          f.x = 30 + this.rnd() * (W - 60);
          f.wait = i * (o.gap || 0.7);
          f.mode = 'dive';
          f.sp = o.speed || 140;
        } else if (pattern === 'hover') {
          f.x = W * (i + 1) / (n + 1);
          f.y = -14;
          f.mode = 'hover';
          f.ty = (o.y || 50) + (i % 2) * 18;
          f.stay = o.stay || 10;
          f.ph = this.rnd() * 6;
        } else throw new Error('unknown wave pattern ' + pattern);
        this.foes.push(f);
      }
    }

    scatter(id, n, dur) {
      const W = A.FLIGHT.w;
      for (let i = 0; i < n; i++) {
        const f = this.foe(id);
        f.wait = (i + this.rnd() * 0.8) * dur / n;
        f.x = 20 + this.rnd() * (W - 40);
        f.mode = 'ground';
        if (id === 'spire') {
          f.r = 8 + Math.floor(this.rnd() * 6);
          f.y = -f.r - 4;
          f.seed = Math.floor(this.rnd() * 1000);
        } else f.y = 30 + this.rnd() * 110;
        this.foes.push(f);
      }
    }

    orbs(n, dur) {
      const W = A.FLIGHT.w, b = A.FLIGHT.bolts.ion;
      for (let i = 0; i < n; i++) {
        this.bolts.push({ x: 20 + this.rnd() * (W - 40), y: -8, vx: (this.rnd() - 0.5) * 30, vy: b.speed, r: b.r, dmg: b.dmg, ion: true, type: 'ion', wait: (i + this.rnd() * 0.8) * dur / n });
      }
    }

    bossIn(pass) {
      let f = this.boss;
      if (!f) {
        f = this.boss = this.foe('bok');
        f.mode = 'boss';
        f.y = -30;
        this.foes.push(f);
      }
      if (f.phase === 'down' || f.phase === 'dead') return;
      const P = this.def.boss.passes[pass - 1];
      Object.assign(f, { pass, P, phase: 'in', pt: 0, ft: 0, x: A.FLIGHT.w / 2, y: Math.min(f.y, -30), fire: 1.2, diveT: P.dive || 0, cadence: P.cadence, spread: P.spread });
      this.emit({ type: 'boss', pass });
    }

    raise() {
      const B = this.def.base;
      this.base = { y: -B.h, ty: B.y };
      this.dome = true;
      for (const [ox, oy] of B.cannons) {
        const f = this.foe('cannon');
        Object.assign(f, { mode: 'mount', ox, oy, x: ox, y: this.base.y + oy });
        this.foes.push(f);
      }
    }

    kamikaze() {
      const f = this.foe('wing'), K = A.FLIGHT;
      Object.assign(f, { mode: 'streak', x: K.w - 30, y: K.h + 10, tx: K.w / 2, ty: this.base ? this.base.y + this.def.base.dome.dy : 40, ang: -Math.PI / 2 });
      this.foes.push(f);
    }

    assist(dt) {
      const P = this.def.assist, s = this.ship;
      if (this.ended || this.closing) return;
      this.assistT -= dt;
      if (this.assistT > 0) return;
      const list = this.foes.filter(f => kind(f).fighter && !(f.wait > 0) && f.mode !== 'leave' && !f.marked && f.y > 50 && f.y < 190);
      if (!list.length) {
        this.assistT = 0.5;
        return;
      }
      const target = list.sort((a, b) => Math.abs(b.x - s.x) - Math.abs(a.x - s.x))[0], w = this.foe('ally');
      this.assistT = this.t >= P.after ? P.then : P.every;
      target.marked = true;
      Object.assign(w, { mode: 'escort', x: target.x, y: A.FLIGHT.h + 12, target, shotT: 0 });
      this.foes.push(w);
    }

    retreat() {
      for (const f of this.foes) {
        if (!kind(f).fighter) continue;
        if (f.wait > 0) f.gone = true;
        else {
          f.mode = 'leave';
          f.left = true;
        }
      }
    }

    fly(dt, inp) {
      const s = this.ship, K = A.FLIGHT, S = K.ship, def = this.def;
      s.inv = Math.max(0, s.inv - dt);
      s.ion = Math.max(0, s.ion - dt);
      s.cool = Math.max(0, s.cool - dt);
      s.dashCool = Math.max(0, s.dashCool - dt);
      let dx = A.clamp(inp.dx || 0, -1, 1), dy = A.clamp(inp.dy || 0, -1, 1);
      const len = Math.hypot(dx, dy);
      if (len > 1) {
        dx /= len;
        dy /= len;
      }
      if (len > 0) {
        const n = Math.hypot(dx, dy);
        s.dx = dx / n;
        s.dy = dy / n;
      }
      if (inp.dash && s.dashCool <= 0 && s.ion <= 0 && s.dash <= 0) {
        s.dash = S.dash;
        s.dashCool = S.dashCool;
        s.inv = Math.max(s.inv, S.dashInv);
        s.ddx = s.dx;
        s.ddy = s.dy;
        this.stats.dashes++;
        this.emit({ type: 'dash' });
      }
      let v = def.speed * (s.ion > 0 ? S.ionSlow : 1);
      if (s.dash > 0) {
        s.dash -= dt;
        dx = s.ddx;
        dy = s.ddy;
        v = def.speed * S.dashSpeed;
      }
      s.x = A.clamp(s.x + dx * v * dt, S.side, K.w - S.side);
      s.y = A.clamp(s.y + dy * v * dt, S.top, S.bottom);
      if (inp.fire && s.cool <= 0 && !this.closing) {
        s.cool = def.cadence;
        this.shots.push({ x: s.x - K.shot.gap, y: s.y - 6 }, { x: s.x + K.shot.gap, y: s.y - 6 });
        this.stats.shots++;
        this.emit({ type: 'fire' });
      }
    }

    move(f, dt) {
      if (f.wait > 0) {
        f.wait -= dt;
        return;
      }
      f.t += dt;
      if (f.flash > 0) f.flash -= dt;
      const K = A.FLIGHT, s = this.ship;
      switch (f.mode) {
        case 'path':
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          if (f.wob) f.x += Math.cos(f.t * 2) * f.wob * dt;
          break;
        case 'ground':
          f.y += this.speed * dt;
          break;
        case 'mount':
          f.x = f.ox;
          f.y = this.base.y + f.oy;
          break;
        case 'dive':
          if (f.t < 0.5) f.y += 40 * dt;
          else {
            if (!f.aimed) {
              const a = Math.atan2(s.y - f.y, s.x - f.x);
              f.vx = Math.cos(a) * f.sp;
              f.vy = Math.max(f.sp * 0.6, Math.sin(a) * f.sp);
              f.aimed = true;
            }
            f.x += f.vx * dt;
            f.y += f.vy * dt;
          }
          break;
        case 'hover':
          if (f.t > f.stay) {
            f.mode = 'leave';
            break;
          }
          f.y += (f.ty - f.y) * Math.min(1, dt * 1.6);
          f.x = A.clamp(f.x + Math.sin(f.t * 0.9 + f.ph) * 60 * dt, 16, K.w - 16);
          break;
        case 'leave':
          f.vy = Math.max(-160, Math.min(f.vy, 0) - 320 * dt);
          f.y += f.vy * dt;
          f.x += f.vx * dt;
          break;
        case 'streak':
          this.streak(f, dt);
          break;
        case 'escort': {
          const tg = f.target;
          if (tg && !tg.gone) {
            f.x += (tg.x - f.x) * Math.min(1, dt * 6);
            if (f.y - tg.y < 46) {
              f.shotT = 0.15;
              f.tx = tg.x;
              f.ty = tg.y;
              this.kill(tg, true);
              f.target = null;
            }
          }
          f.shotT = Math.max(0, f.shotT - dt);
          f.y -= 210 * dt;
          if (f.y < -20) f.gone = true;
          break;
        }
        case 'boss':
          this.bossMove(f, dt);
          break;
      }
      if (f.kind === 'geyser') {
        const g = K.foes.geyser;
        f.on = f.t >= g.warn;
        if (f.t >= g.warn + g.burst) f.gone = true;
      }
      if (f.mode !== 'boss' && f.mode !== 'mount' && f.mode !== 'streak' && f.mode !== 'escort') this.edge(f);
      this.shoot(f, dt);
    }

    edge(f) {
      const K = A.FLIGHT;
      if (f.y > K.h + 16) {
        f.gone = true;
        if (kind(f).fighter && !f.left && this.def.goal.type === 'hold') this.leak(f);
      } else if ((f.y < -50 || f.x < -30 || f.x > K.w + 30) && (f.mode === 'leave' || f.t > 1)) f.gone = true;
    }

    leak(f) {
      this.stats.leaked++;
      this.emit({ type: 'leak', x: f.x });
      if (this.stats.leaked === 1) this.radio(this.def.leak);
    }

    shoot(f, dt) {
      const k = kind(f);
      if (!k.fire || this.closing || f.gone || f.mode === 'leave') return;
      if (f.mode === 'boss' && f.phase !== 'fight') return;
      if (f.y < 6 || f.y > A.FLIGHT.h * 0.7) return;
      f.fire -= dt;
      if (f.fire > 0) return;
      f.fire = (f.cadence || k.cadence) * (0.8 + 0.4 * this.rnd());
      const s = this.ship, a = Math.atan2(s.y - f.y, s.x - f.x);
      if (k.fire === 'burst') for (let i = 0; i < 3; i++) this.bolt(f, a, k.bolt, i * 0.16);
      else if (k.fire === 'spread') {
        const n = f.spread || 3;
        for (let i = 0; i < n; i++) this.bolt(f, a + (i - (n - 1) / 2) * 0.26, k.bolt, 0);
      } else this.bolt(f, a, k.bolt, 0);
      this.emit({ type: 'enemyFire', kind: f.kind, x: f.x, y: f.y });
    }

    bolt(f, a, type, wait) {
      const b = A.FLIGHT.bolts[type];
      this.bolts.push({ x: f.x, y: f.y + 4, vx: Math.cos(a) * b.speed, vy: Math.sin(a) * b.speed, r: b.r, dmg: b.dmg, ion: !!b.ion, type, wait });
    }

    streak(f, dt) {
      const dx = f.tx - f.x, dy = f.ty - f.y, d = Math.hypot(dx, dy), v = 90 * dt;
      if (d <= v) {
        f.gone = true;
        this.dome = false;
        this.emit({ type: 'boom', x: f.tx, y: f.ty, size: 3, kind: 'wing' });
        this.emit({ type: 'shieldDown' });
        this.radio(this.def.base.down);
        return;
      }
      f.x += dx / d * v;
      f.y += dy / d * v;
      f.ang = Math.atan2(dy, dx);
    }

    bossMove(f, dt) {
      const K = A.FLIGHT, B = this.def.boss, P = f.P;
      f.pt += dt;
      if (f.phase === 'in') {
        f.y += 90 * dt;
        if (f.y >= B.y) {
          f.y = B.y;
          f.phase = 'fight';
        }
      } else if (f.phase === 'fight') {
        f.ft += dt;
        const tx = K.w / 2 + Math.sin(f.ft * 0.9) * 110;
        f.x += (tx - f.x) * Math.min(1, dt * 3);
        f.y = B.y + Math.sin(f.ft * 1.7) * 8;
        if (P.dive) {
          f.diveT -= dt;
          if (f.diveT <= 0) {
            f.phase = 'aim';
            f.at = 0.8;
            if (!this.dived) {
              this.dived = true;
              this.radio(B.dive);
            }
            this.emit({ type: 'dive', x: f.x });
          }
        }
        if (P.time && f.pt >= P.time) this.bossOut(f);
      } else if (f.phase === 'aim') {
        f.at -= dt;
        if (f.at <= 0) f.phase = 'dive';
      } else if (f.phase === 'dive') {
        f.y += 250 * dt;
        if (f.y > K.h + 30) {
          f.y = -30;
          f.phase = 'in';
          f.diveT = P.dive;
        }
      } else if (f.phase === 'out') {
        f.y -= 150 * dt;
        if (f.y < -40) f.phase = 'away';
      } else if (f.phase === 'down') {
        f.downT -= dt;
        f.y += 60 * dt;
        f.x += 25 * dt;
        f.spin = (f.spin || 0) + dt * 6;
        if (f.downT <= 0) {
          f.phase = 'dead';
          f.gone = true;
        }
      }
    }

    bossHit(f) {
      const P = f.P, floor = Math.ceil(f.max * P.until);
      if (P.until > 0 && f.hp <= floor) {
        f.hp = floor;
        this.bossOut(f);
      } else if (f.hp <= 0) {
        f.hp = 0;
        f.phase = 'down';
        f.downT = 2.2;
        this.radio(this.def.boss.down);
        this.emit({ type: 'bossDown', x: f.x, y: f.y });
      }
    }

    bossOut(f) {
      if (!LIVE.includes(f.phase)) return;
      f.phase = 'out';
      this.radio(f.P.out);
      this.emit({ type: 'bossOut', pass: f.pass });
    }

    hittable(f) {
      if (f.wait > 0 || f.gone || !f.max || kind(f).decor) return false;
      if (f.mode === 'boss') return LIVE.includes(f.phase);
      return true;
    }

    solid(f) {
      if (f.wait > 0 || f.gone) return false;
      const k = kind(f);
      if (k.decor || k.ground) return false;
      if (f.kind === 'geyser') return !!f.on;
      if (f.mode === 'boss') return LIVE.includes(f.phase);
      return true;
    }

    travel(dt) {
      const K = A.FLIGHT;
      for (const p of this.shots) p.y -= K.shot.speed * dt;
      this.shots = this.shots.filter(p => p.y > -8);
      for (const b of this.bolts) {
        if (b.wait > 0) {
          b.wait -= dt;
          continue;
        }
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      }
      this.bolts = this.bolts.filter(b => !b.gone && b.y < K.h + 8 && b.y > -16 && b.x > -8 && b.x < K.w + 8);
    }

    collide() {
      const K = A.FLIGHT, s = this.ship;
      for (const p of this.shots) {
        for (const f of this.foes) {
          if (f.kind === 'spire' && f.wait <= 0 && near(p, f, f.r)) {
            p.gone = true;
            this.emit({ type: 'spark', x: p.x, y: p.y });
            break;
          }
          if (!this.hittable(f) || !near(p, f, f.r + 2)) continue;
          p.gone = true;
          if (f.kind === 'cannon' && this.dome) this.emit({ type: 'splash', x: p.x, y: p.y });
          else this.damage(f, K.shot.dmg);
          break;
        }
      }
      this.shots = this.shots.filter(p => !p.gone);
      if (s.inv > 0 || this.closing) return;
      for (const b of this.bolts) {
        if (b.wait > 0 || !near(b, s, b.r + K.ship.r)) continue;
        b.gone = true;
        this.hurt(b.dmg, b.ion ? 'ion' : 'bolt');
        return;
      }
      for (const f of this.foes) {
        if (!this.solid(f) || !near(f, s, f.r + K.ship.r)) continue;
        this.hurt(kind(f).crash, f.kind);
        if (kind(f).fighter) this.kill(f);
        return;
      }
    }

    damage(f, n) {
      f.hp -= n;
      f.flash = 0.08;
      if (f.mode === 'boss') return this.bossHit(f);
      if (f.hp <= 0) this.kill(f);
    }

    kill(f, ally) {
      f.gone = true;
      if (ally) this.stats.assists++;
      else if (kind(f).fighter) this.stats.kills++;
      this.emit({ type: 'boom', x: f.x, y: f.y, size: f.kind === 'cannon' ? 2 : 1, kind: f.kind });
      if (f.kind === 'cannon' && !this.foes.some(o => o !== f && o.kind === 'cannon' && !o.gone)) this.radio(this.def.base.done);
    }

    hurt(dmg, why) {
      const s = this.ship, S = A.FLIGHT.ship, n = Math.max(1, Math.round(dmg * this.dmgK));
      s.shield = Math.max(0, s.shield - n);
      s.inv = S.inv;
      if (why === 'ion') s.ion = S.ion;
      this.stats.hits++;
      this.emit({ type: 'hurt', n, why, x: s.x, y: s.y });
    }

    judge(dt) {
      if (this.closing > 0) {
        this.closing -= dt;
        if (this.closing <= 0) this.finish('win');
        return;
      }
      if (this.ship.shield <= 0) return this.finish('lose', 'ship');
      const g = this.def.goal;
      if (g.type === 'hold' && this.stats.leaked > this.leakMax) return this.finish('lose', 'city');
      if (this.won()) {
        this.closing = A.FLIGHT.closing;
        this.emit({ type: 'goal' });
      }
    }

    won() {
      const g = this.def.goal;
      if (g.type === 'boss') return !!this.boss && this.boss.phase === 'dead';
      if (g.type === 'cannons') return !!this.base && !this.foes.some(f => f.kind === 'cannon');
      return this.ended && !this.foes.some(f => kind(f).fighter);
    }

    finish(over, reason) {
      this.over = over;
      this.reason = reason || null;
      this.emit({ type: 'over', over, reason: this.reason });
    }

    cannons() {
      return this.foes.filter(f => f.kind === 'cannon').length;
    }
  };

  A.Flight.voice = (def, who) => def.voices[who] || A.CAST[who] || null;

  const T = 256;
  const DASH_KEYS = ['ShiftLeft', 'ShiftRight', 'KeyX'];
  const FIRE_KEYS = ['Space', 'Enter'];

  const rects = (g, list, x, y) => {
    for (const [dx, dy, w, h, c] of list) {
      g.fillStyle = c;
      g.fillRect(Math.round(x + dx), Math.round(y + dy), w, h);
    }
  };

  const line = (g, x0, y0, x1, y1, c, w) => {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    g.fillStyle = c;
    for (let i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), w || 1, w || 1);
  };

  const disc = (g, cx, cy, r, c) => {
    g.fillStyle = c;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y));
      g.fillRect(Math.round(cx - w), Math.round(cy + y), 2 * w + 1, 1);
    }
  };

  const ring = (g, cx, cy, rx, ry, c, step) => {
    g.fillStyle = c;
    const n = Math.ceil(Math.max(rx, ry) * 6.3 / (step || 1));
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2;
      g.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
    }
  };

  const wedge = () => {
    const out = [];
    for (let i = 0; i < 16; i++) {
      const w = 2 + 2 * Math.floor(i / 2);
      out.push([-w / 2, -9 + i, w, 1, i < 2 ? '#f0ece0' : '#d0ccc0']);
    }
    out.push([-1, -6, 2, 12, '#b8b4a8'], [-7, 4, 3, 2, '#c83a2a'], [4, 4, 3, 2, '#c83a2a'], [-1, -3, 2, 3, '#6ab0e0'], [3, -1, 2, 2, '#4a8ad0']);
    return out;
  };

  const SHIPS = {
    inferno: [[-2, -8, 4, 2, '#b8a890'], [-4, -6, 8, 10, '#8a4a36'], [2, -6, 2, 10, '#6a3426'], [-8, -1, 4, 7, '#7a3e2c'], [4, -1, 4, 7, '#6a3426'], [-2, -5, 4, 3, '#9ad8f0'], [-2, -5, 1, 1, '#ffffff'], [-4, 4, 8, 3, '#5a2a1e']],
    delta7: wedge(),
    eta2: [[-2, -6, 4, 11, '#8a3a26'], [-11, -2, 8, 6, '#7a3020'], [3, -2, 8, 6, '#7a3020'], [-11, -2, 8, 2, '#b05a3a'], [3, -2, 8, 2, '#b05a3a'], [-11, 3, 8, 1, '#4a1a10'], [3, 3, 8, 1, '#4a1a10'], [-3, -1, 1, 3, '#5a2216'], [2, -1, 1, 3, '#5a2216'], [-1, -5, 2, 3, '#9ad0f0']],
    wing: [[-2, -6, 4, 11, '#3a5a8a'], [-11, -2, 8, 6, '#2e4a74'], [3, -2, 8, 6, '#2e4a74'], [-11, -2, 8, 2, '#6a8ac0'], [3, -2, 8, 2, '#6a8ac0'], [-1, -5, 2, 3, '#c8e0f0']],
    barc: [[-2, -8, 4, 15, '#d8d8d0'], [-4, -2, 8, 6, '#b8b8b0'], [-1, -7, 2, 3, '#e0b020'], [-5, 1, 2, 4, '#5a5a62'], [3, 1, 2, 4, '#5a5a62'], [-2, -1, 4, 3, '#6fa8dc'], [-1, 5, 2, 2, '#3a3a40']],
    arc170: [[-2, -8, 4, 14, '#d8d0c0'], [-12, -1, 10, 4, '#c8c0b0'], [2, -1, 10, 4, '#c8c0b0'], [-12, -1, 10, 1, '#a83a2a'], [2, -1, 10, 1, '#a83a2a'], [-1, -7, 2, 3, '#7ab0d0'], [-12, 3, 2, 3, '#8a8478'], [10, 3, 2, 3, '#8a8478']]
  };
  const ENGINES = { inferno: [[-7, 6], [5, 6], [-1, 7]], delta7: [[-3, 7], [1, 7]], eta2: [[-1, 5]], wing: [[-1, 5]], barc: [[-1, 7]], arc170: [[-1, 6]] };
  const VULTURE = [[-2, -4, 4, 8, '#a8987a'], [-1, 4, 2, 2, '#c8b898'], [-8, -4, 6, 2, '#8a7a5e'], [2, -4, 6, 2, '#8a7a5e'], [-7, 1, 5, 2, '#7a6a50'], [2, 1, 5, 2, '#7a6a50'], [-8, -4, 1, 2, '#4a3a2a'], [7, -4, 1, 2, '#4a3a2a'], [-1, -1, 2, 2, '#ff5a3a']];
  const BOK = [[-4, -8, 8, 16, '#3a2a2a'], [-10, -2, 6, 8, '#2e2222'], [4, -2, 6, 8, '#2e2222'], [-10, 4, 6, 2, '#a82a1a'], [4, 4, 6, 2, '#a82a1a'], [-1, -8, 2, 14, '#4a3434'], [-2, 3, 4, 3, '#e8a050'], [-3, -9, 2, 2, '#ff6a2a'], [1, -9, 2, 2, '#ff6a2a']];
  const BOOM = ['#ffffff', '#ffe08a', '#ff9a3a', '#c84a1a', '#5a5a5a'];

  const TILES = {
    kintan(r, put) {
      put(0, 0, 320, T, '#1a1210');
      for (let i = 0; i < 1600; i++) put(r() * 320, r() * T, 1 + Math.floor(r() * 2), 1, r() < 0.5 ? '#231912' : '#110b08');
      for (let i = 0; i < 12; i++) {
        const x = r() * 320, y = r() * T, w = 24 + r() * 50, h = 6 + Math.floor(r() * 8);
        for (let k = -h; k <= h; k++) {
          const ww = w * Math.sqrt(1 - (k / h) * (k / h));
          put(x - ww, y + k, ww * 2, 1, k < -h * 0.4 ? '#34241a' : '#281c15');
        }
      }
      for (let i = 0; i < 10; i++) {
        let x = r() * 320, y = r() * T, a = r() * 6.3;
        for (let k = 0; k < 70; k++) {
          a += (r() - 0.5) * 0.9;
          x += Math.cos(a) * 1.4;
          y += Math.sin(a) * 1.4;
          put(x, y, 2, 1, '#7a200a');
          if (r() < 0.35) put(x, y, 1, 1, '#ff8a2a');
        }
      }
      for (let i = 0; i < 5; i++) {
        const x = r() * 320, y = r() * T, rr = 3 + Math.floor(r() * 3);
        for (let k = -rr; k <= rr; k++) {
          const w = Math.floor(Math.sqrt(rr * rr - k * k));
          put(x - w, y + k, w * 2 + 1, 1, '#c84a14');
          if (Math.abs(k) < rr - 1) put(x - w + 1, y + k, Math.max(1, w * 2 - 1), 1, '#ffb050');
        }
      }
    },
    kamino(r, put) {
      put(0, 0, 320, T, '#15303b');
      for (let i = 0; i < 1400; i++) put(r() * 320, r() * T, 1 + Math.floor(r() * 3), 1, r() < 0.5 ? '#1a3844' : '#112832');
      for (let i = 0; i < 280; i++) {
        const x = r() * 320, y = r() * T, w = 4 + r() * 10;
        put(x, y, w, 1, '#24505e');
        if (r() < 0.6) put(x + 1, y - 1, Math.max(1, w * 0.5), 1, '#4a8494');
      }
      for (let i = 0; i < 70; i++) put(r() * 320, r() * T, 1, 1, '#b8d4dc');
    },
    felucia(r, put) {
      put(0, 0, 320, T, '#1c3a24');
      for (let i = 0; i < 1500; i++) put(r() * 320, r() * T, 1 + Math.floor(r() * 3), 1, r() < 0.5 ? '#244a2c' : '#16301c');
      for (let i = 0; i < 40; i++) {
        const x = r() * 320, y = r() * T, rr = 2 + Math.floor(r() * 4);
        for (let k = -rr; k <= rr; k++) {
          const w = Math.floor(Math.sqrt(rr * rr - k * k));
          put(x - w, y + k, w * 2 + 1, 1, r() < 0.5 ? '#c86a9a' : '#e0a040');
        }
      }
      for (let i = 0; i < 4; i++) {
        let x = r() * 320, y = 0, a = Math.PI / 2;
        while (y < T) {
          a = A.clamp(a + (r() - 0.5) * 0.4, 1.1, 2.0);
          x += Math.cos(a) * 1.4;
          y += Math.sin(a) * 1.4;
          put(x - 1, y, 3, 1, '#2a5a6a');
        }
      }
      for (let i = 0; i < 90; i++) put(r() * 320, r() * T, 1, 1, '#b8f0a0');
    },
    saleucami(r, put) {
      put(0, 0, 320, T, '#2a1610');
      for (let i = 0; i < 1500; i++) put(r() * 320, r() * T, 1 + Math.floor(r() * 2), 1, r() < 0.5 ? '#341c12' : '#1c0f0a');
      for (let i = 0; i < 26; i++) {
        let x = r() * 320, y = r() * T, a = r() * 6.3;
        for (let k = 0; k < 30; k++) {
          a += (r() - 0.5) * 1.2;
          x += Math.cos(a) * 1.5;
          y += Math.sin(a) * 1.5;
          put(x, y, 1, 1, '#140906');
        }
      }
      for (let i = 0; i < 3; i++) {
        let x = 40 + r() * 240, y = 0, a = Math.PI / 2;
        while (y < T) {
          a = A.clamp(a + (r() - 0.5) * 0.5, 0.9, 2.2);
          x += Math.cos(a) * 1.4;
          y += Math.sin(a) * 1.4;
          put(x - 1, y, 4, 1, '#8a260c');
          put(x, y, 2, 1, '#e8601e');
          if (r() < 0.2) put(x, y, 1, 1, '#ffd070');
        }
      }
    }
  };

  const makeTile = look => {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = T;
    const g = c.getContext('2d'), r = A.rng(look.length * 977 + 13);
    const put = (x, y, w, h, col) => {
      g.fillStyle = col;
      const X = Math.round(((x % 320) + 320) % 320), Y = Math.round(((y % T) + T) % T), ww = Math.max(1, Math.round(w)), hh = Math.max(1, Math.round(h));
      for (const ox of [0, -320]) for (const oy of [0, -T]) g.fillRect(X + ox, Y + oy, ww, hh);
      if (X + ww > 320) for (const oy of [0, -T]) g.fillRect(X - 320, Y + oy, ww, hh);
      if (Y + hh > T) for (const ox of [0, -320]) g.fillRect(X + ox, Y - T, ww, hh);
    };
    TILES[look](r, put);
    return c;
  };

  A.FlightView = class {
    constructor(ui, opts) {
      this.ui = ui;
      this.f = opts.flight;
      this.onEnd = opts.onEnd;
      this.defeats = opts.defeats || 0;
      this.sound = ui.vn ? ui.vn.sound : new A.Audio(ui);
      this.mode = 'intro';
      this.t = 0;
      this.radio = null;
      this.queue = [];
      this.fx = [];
      this.trail = [];
      this.hits = [];
      this.sel = 0;
      this.dashQ = false;
      this.shake = 0;
      this.flash = 0;
      this.lightning = 0;
      this.nextLightning = 4;
      this.leakT = 0;
      this.shotN = 0;
      this.tile = null;
    }

    key(code) {
      const ok = FIRE_KEYS.includes(code), back = code === 'Escape';
      if (this.mode === 'intro') {
        if (ok) {
          this.mode = 'fly';
          this.sound.sfx('ignite');
        }
        return !back;
      }
      if (this.mode === 'fly') {
        if (DASH_KEYS.includes(code)) this.dashQ = true;
        return !back;
      }
      if (this.mode === 'result') {
        const opts = this.options(), up = code === 'ArrowUp' || code === 'KeyW', down = code === 'ArrowDown' || code === 'KeyS';
        if (up || down) {
          this.sel = (this.sel + (up ? -1 : 1) + opts.length) % opts.length;
          this.sound.blip(900);
          return true;
        }
        if (ok) {
          opts[this.sel].act();
          return true;
        }
        return !back;
      }
      return false;
    }

    click(x, y, button) {
      if (button === 2) return this.key('Escape');
      for (let i = this.hits.length - 1; i >= 0; i--) {
        const h = this.hits[i];
        if (x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) return h.fn();
      }
      if (this.mode === 'intro') this.key('Enter');
    }

    hover(x, y) {
      for (const h of this.hits) if (h.hover && x >= h.x && y >= h.y && x < h.x + h.w && y < h.y + h.h) h.hover();
    }

    options() {
      if (this.f.over === 'win') return [{ label: 'Дальше', act: () => this.end({ over: 'win', stats: this.f.stats }) }];
      const opts = [{ label: 'Повторить полёт', act: () => this.end({ over: 'lose', help: false }) }];
      if (A.DIFFICULTY[this.ui.vn ? this.ui.vn.state.difficulty || 'normal' : 'normal'].help && this.defeats + 1 >= 2) opts.push({ label: this.f.def.goal.type === 'hold' ? 'Повторить с Помощью Силы: щиты и предел прорыва +50 %' : 'Повторить с Помощью Силы: щиты +50 %', act: () => this.end({ over: 'lose', help: true }) });
      return opts;
    }

    end(r) {
      if (this.done) return;
      this.done = true;
      this.mode = 'done';
      this.onEnd(r);
    }

    input() {
      const h = this.ui.held(), on = (...c) => c.some(k => h.has(k));
      const inp = {
        dx: (on('ArrowRight', 'KeyD') ? 1 : 0) - (on('ArrowLeft', 'KeyA') ? 1 : 0),
        dy: (on('ArrowDown', 'KeyS') ? 1 : 0) - (on('ArrowUp', 'KeyW') ? 1 : 0),
        fire: on(...FIRE_KEYS),
        dash: this.dashQ
      };
      this.dashQ = false;
      return inp;
    }

    update(dt) {
      this.t += dt;
      if (this.mode !== 'fly') return;
      const f = this.f;
      f.step(dt, this.input());
      for (const e of f.take()) this.onEvent(e);
      const s = f.ship;
      if (s.dash > 0) this.trail.push({ x: s.x, y: s.y, t: 0.18 });
      for (const p of this.trail) p.t -= dt;
      this.trail = this.trail.filter(p => p.t > 0);
      if (f.boss && f.boss.phase === 'down' && Math.random() < 0.6) this.puff(f.boss.x, f.boss.y);
      for (const o of f.foes) if (o.mode === 'streak' && Math.random() < 0.8) this.puff(o.x, o.y + 4);
      for (const p of this.fx) {
        p.t += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      this.fx = this.fx.filter(p => p.t < p.life);
      this.shake = Math.max(0, this.shake - dt);
      this.flash = Math.max(0, this.flash - dt);
      this.leakT = Math.max(0, this.leakT - dt);
      this.lightning = Math.max(0, this.lightning - dt);
      if (f.def.look === 'kamino') {
        this.nextLightning -= dt;
        if (this.nextLightning <= 0) {
          this.lightning = 0.12;
          this.nextLightning = 6 + Math.random() * 7;
        }
      }
      if (this.radio) {
        this.radio.t -= dt;
        if (this.radio.t <= 0) this.radio = null;
      }
      if (!this.radio && this.queue.length) this.say(this.queue.shift());
      if (f.over) {
        if (f.reason === 'ship') {
          this.burst(s.x, s.y, 30, 70, 0.9, BOOM);
          this.flash = 0.2;
        }
        this.mode = 'result';
        this.sel = 0;
        this.sound.sfx(f.over === 'win' ? 'win' : 'lose');
      }
    }

    say(e) {
      const v = A.Flight.voice(this.f.def, e.who) || { name: e.who, plate: '#6a6a7a' };
      this.radio = { name: v.name, plate: v.plate || '#6a6a7a', text: e.text, t: Math.max(3, e.text.length * 0.065) };
      this.sound.blip(v.pitch || 600);
    }

    burst(x, y, n, speed, life, colors) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, v = speed * (0.3 + Math.random() * 0.7);
        this.fx.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: life * (0.5 + Math.random() * 0.5), colors, size: Math.random() < 0.3 ? 2 : 1 });
      }
    }

    puff(x, y) {
      this.fx.push({ x: x + (Math.random() - 0.5) * 6, y, vx: (Math.random() - 0.5) * 10, vy: -20 - Math.random() * 10, t: 0, life: 0.9, colors: ['#8a8a8a', '#6a6a6a', '#4a4a4a', '#3a3a3a'], size: 2 });
    }

    onEvent(e) {
      switch (e.type) {
        case 'radio':
          if (this.radio) this.queue.push(e);
          else this.say(e);
          break;
        case 'fire':
          if (this.shotN++ % 2 === 0) this.sound.blip(1500);
          break;
        case 'boom':
          this.burst(e.x, e.y, e.size === 3 ? 44 : e.size === 2 ? 20 : 10, e.size === 3 ? 90 : 50, e.size === 3 ? 1 : 0.6, BOOM);
          this.fx.push({ x: e.x, y: e.y, vx: 0, vy: 0, t: 0, life: 0.1, ring: e.size === 3 ? 14 : e.size === 2 ? 9 : 5 });
          this.sound.sfx(e.size > 1 ? 'rocks' : 'hit');
          if (e.size === 3) {
            this.flash = 0.35;
            this.shake = 0.4;
          }
          break;
        case 'spark':
          this.burst(e.x, e.y, 3, 30, 0.2, ['#ffe0a0', '#c8a070']);
          break;
        case 'splash':
          this.burst(e.x, e.y, 4, 30, 0.3, ['#ffffff', '#bfe8ff', '#6aaaff']);
          this.sound.blip(2000);
          break;
        case 'hurt':
          this.shake = 0.2;
          this.burst(e.x, e.y, 6, 40, 0.35, e.why === 'ion' ? ['#ffffff', '#bfe8ff', '#4a8aff'] : ['#ffffff', '#ffd08a', '#ff6a3a']);
          this.sound.sfx(e.why === 'ion' ? 'lightning' : 'hit');
          break;
        case 'dash':
          this.sound.sfx('force');
          break;
        case 'leak':
          this.leakT = 0.5;
          this.burst(e.x, 232, 8, 40, 0.5, BOOM);
          this.sound.sfx('down');
          break;
        case 'shieldDown':
          this.sound.sfx('lightning');
          break;
        case 'bossDown':
          this.burst(e.x, e.y, 16, 60, 0.6, BOOM);
          this.sound.sfx('rocks');
          break;
        case 'dive':
          this.sound.blip(300);
          break;
      }
    }

    draw(gfx) {
      const g = gfx.lg, f = this.f;
      if (!this.tile) this.tile = makeTile(f.def.look);
      const off = Math.floor(f.scroll) % T;
      g.drawImage(this.tile, 0, off - T);
      g.drawImage(this.tile, 0, off);
      if (f.def.look === 'saleucami') this.drawBase(g);
      for (const o of f.foes) if (!(o.wait > 0) && (o.kind === 'spire' || o.kind === 'geyser' || o.kind === 'cannon')) this.drawFoe(g, o);
      if (f.dome && f.base) this.drawDome(g);
      this.drawShadow(g);
      for (const o of f.foes) if (!(o.wait > 0) && o.kind !== 'spire' && o.kind !== 'geyser' && o.kind !== 'cannon') this.drawFoe(g, o);
      this.drawTelegraph(g);
      for (const p of f.shots) {
        g.fillStyle = '#ffb030';
        g.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 5);
        g.fillStyle = '#fff4c0';
        g.fillRect(Math.round(p.x), Math.round(p.y), 1, 5);
      }
      this.drawShip(g);
      for (const b of f.bolts) if (!(b.wait > 0)) this.drawBolt(g, b);
      this.drawFx(g);
      if (f.def.look === 'kamino') this.drawKamino(g);
      if (f.def.look === 'kintan') this.drawAsh(g);
      if (this.flash > 0) {
        g.fillStyle = `rgba(255,255,255,${(this.flash * 1.6).toFixed(2)})`;
        g.fillRect(0, 0, A.LW, A.LH);
      }
      const G = gfx.g, sx = this.shake > 0 ? Math.round((Math.random() - 0.5) * 6) : 0, sy = this.shake > 0 ? Math.round((Math.random() - 0.5) * 6) : 0;
      if (sx || sy) {
        G.fillStyle = '#000';
        G.fillRect(0, 0, A.W, A.H);
      }
      G.imageSmoothingEnabled = false;
      G.drawImage(gfx.low, 0, 0, A.LW, A.LH, sx, sy, A.W, A.H);
      this.hits = [];
      this.hud(G);
      if (this.mode === 'intro') this.drawIntro(G);
      if (this.mode === 'result') this.drawResult(G);
    }

    drawShadow(g) {
      const s = this.f.ship;
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fillRect(Math.round(s.x) - 4, Math.round(s.y) + 9, 9, 3);
    }

    drawShip(g) {
      const f = this.f, s = f.ship, id = f.def.ship;
      for (const p of this.trail) {
        g.globalAlpha = p.t * 2.5;
        rects(g, SHIPS[id], p.x, p.y);
      }
      g.globalAlpha = 1;
      if (f.reason === 'ship' || (s.inv > 0 && s.dash <= 0 && !f.closing && Math.floor(this.t * 18) % 2)) return;
      const fl = Math.floor(this.t * 20) % 2;
      rects(g, SHIPS[id], s.x, s.y);
      for (const [ex, ey] of ENGINES[id]) {
        g.fillStyle = fl ? '#ffd070' : '#ff8a30';
        g.fillRect(Math.round(s.x + ex), Math.round(s.y + ey + 1), 2, 2 + fl);
      }
      if (s.ion > 0) for (let i = 0; i < 3; i++) {
        g.fillStyle = i % 2 ? '#bfe8ff' : '#4a8aff';
        g.fillRect(Math.round(s.x + (Math.random() - 0.5) * 18), Math.round(s.y + (Math.random() - 0.5) * 14), 1, 1);
      }
    }

    drawFoe(g, o) {
      const x = Math.round(o.x), y = Math.round(o.y);
      if (o.kind === 'vulture') {
        rects(g, VULTURE, x, y);
        if (o.flash > 0) disc(g, x, y, 3, '#ffffff');
      } else if (o.kind === 'tri') {
        for (const a of [Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6]) {
          line(g, x, y, x + Math.cos(a) * 8, y + Math.sin(a) * 8, '#6a6a7a', 2);
          g.fillStyle = '#9a9aaa';
          g.fillRect(Math.round(x + Math.cos(a) * 9) - 1, Math.round(y + Math.sin(a) * 9) - 1, 2, 2);
        }
        disc(g, x, y, 3, o.flash > 0 ? '#ffffff' : '#4a4a58');
        g.fillStyle = '#ff3a2a';
        g.fillRect(x - 1, y - 1, 2, 2);
      } else if (o.kind === 'bok') {
        if (o.phase === 'away') return;
        if (o.phase === 'down' && Math.floor(this.t * 12) % 2) {
          rects(g, BOK.map(([dx, dy, w, h]) => [dy, dx, h, w, '#2a1a1a']), x, y);
          return;
        }
        rects(g, BOK, x, y);
        if (o.flash > 0) disc(g, x, y, 4, '#ffffff');
      } else if (o.kind === 'cannon') {
        const s = this.f.ship, a = Math.atan2(s.y - o.y, s.x - o.x);
        disc(g, x, y, 8, '#4a4a52');
        disc(g, x - 1, y - 1, 6, '#5e5e68');
        line(g, x, y, x + Math.cos(a) * 11, y + Math.sin(a) * 11, '#26262c', 2);
        if (o.fire < 0.6) disc(g, Math.round(x + Math.cos(a) * 11), Math.round(y + Math.sin(a) * 11), 2, '#8ad8ff');
        if (o.flash > 0) disc(g, x, y, 4, '#ffffff');
      } else if (o.kind === 'spire' && this.f.def.look === 'felucia') {
        const r = o.r;
        disc(g, x + 2, y + 4, r, 'rgba(0,0,0,0.35)');
        disc(g, x, y, r, o.seed % 2 ? '#a83a6a' : '#c87a2a');
        disc(g, x - 1, y - 1, Math.max(2, r - 3), o.seed % 2 ? '#d85a8a' : '#e8a04a');
        for (let i = 0; i < 4; i++) disc(g, x + Math.round(Math.cos(i * 1.7 + o.seed) * r * 0.5), y + Math.round(Math.sin(i * 1.7 + o.seed) * r * 0.5), 1, '#f8e8c8');
      } else if (o.kind === 'spire') {
        const r = o.r, k = o.seed % 5, lumps = [[-0.45, 0.25, 0.6], [0.4, 0.3, 0.55], [0.05, -0.35, 0.65], [-0.2, 0.45, 0.5]];
        disc(g, x + 2, y + 4, r, 'rgba(0,0,0,0.35)');
        for (const [ax, ay, ar] of lumps) disc(g, x + Math.round(ax * r * (1 + k * 0.08)), y + Math.round(ay * r), Math.max(2, Math.round(ar * r)), '#1c1411');
        for (const [ax, ay, ar] of lumps) disc(g, x + Math.round(ax * r * (1 + k * 0.08)) - 1, y + Math.round(ay * r) - 1, Math.max(1, Math.round(ar * r) - 2), '#2c211b');
        disc(g, x - 2, y - Math.round(r * 0.45), Math.max(1, Math.round(r * 0.35)), '#46362b');
        g.fillStyle = '#5e4a3a';
        g.fillRect(x - 3, y - Math.round(r * 0.7), 3, 1);
        g.fillStyle = '#b8401a';
        g.fillRect(x + Math.round(r * 0.3), y + Math.round(r * 0.55), 2, 1);
      } else if (o.kind === 'geyser') {
        const G = A.FLIGHT.foes.geyser;
        if (!o.on) {
          const p = 0.6 + 0.4 * Math.sin(this.t * 18);
          disc(g, x, y, Math.round(o.r * 0.5), '#5a1a0a');
          ring(g, x, y, o.r * p, o.r * p, '#ff6a1a', 2);
        } else {
          const k = 1 - (o.t - G.warn) / G.burst;
          disc(g, x, y, o.r, '#ff7a24');
          disc(g, x, y, Math.max(2, Math.round(o.r * 0.6 * (0.5 + k))), '#ffd060');
          for (let i = 0; i < 4; i++) {
            g.fillStyle = '#ffb040';
            g.fillRect(Math.round(x + (Math.random() - 0.5) * o.r * 2.6), Math.round(y + (Math.random() - 0.5) * o.r * 2.6), 2, 2);
          }
        }
      } else if (o.kind === 'ally') {
        rects(g, SHIPS[this.f.def.ally || 'delta7'], x, y);
        if (o.shotT > 0) {
          line(g, x - 4, y - 8, o.tx - 2, o.ty, '#ffb030');
          line(g, x + 4, y - 8, o.tx + 2, o.ty, '#ffb030');
        }
      } else if (o.kind === 'wing') {
        rects(g, SHIPS.wing, x, y);
        g.fillStyle = '#ff8a30';
        g.fillRect(x - 6, y - 1, 3, 3);
      }
    }

    drawTelegraph(g) {
      const b = this.f.boss;
      if (!b || b.phase !== 'aim') return;
      g.fillStyle = `rgba(255,60,40,${(0.45 + 0.3 * Math.sin(this.t * 24)).toFixed(2)})`;
      for (let y = Math.round(b.y) + 12; y < A.LH; y += 6) {
        g.fillRect(Math.round(b.x) - 11, y, 2, 3);
        g.fillRect(Math.round(b.x) + 10, y, 2, 3);
      }
    }

    drawBolt(g, b) {
      const x = Math.round(b.x), y = Math.round(b.y);
      if (b.type === 'ion') {
        const p = Math.floor(this.t * 14) % 2;
        disc(g, x, y, b.r, '#2a5aff');
        disc(g, x, y, b.r - 2 + p, '#bfe8ff');
        return;
      }
      const s = b.type === 'heavy' ? 4 : 3;
      g.fillStyle = '#ff3a2a';
      g.fillRect(x - (s >> 1), y - (s >> 1), s, s);
      g.fillStyle = '#ffe0c0';
      g.fillRect(x, y, 1, 1);
    }

    drawFx(g) {
      for (const p of this.fx) {
        if (p.ring) {
          disc(g, p.x, p.y, Math.round(p.ring * (0.6 + p.t / p.life)), '#fff4d0');
          continue;
        }
        const c = p.colors[Math.min(p.colors.length - 1, Math.floor(p.t / p.life * p.colors.length))];
        g.fillStyle = c;
        g.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      }
    }

    drawBase(g) {
      const f = this.f, b = f.base;
      if (!b) return;
      const y = Math.round(b.y), cx = 160, cy = y + 30;
      for (let k = -40; k <= 40; k++) {
        const w = Math.round(150 * Math.sqrt(1 - (k / 40) * (k / 40)));
        g.fillStyle = Math.abs(k) > 36 ? '#4a2a1a' : '#1e0e0a';
        g.fillRect(cx - w, cy + k, 2 * w, 1);
      }
      ring(g, cx, cy, 150, 40, '#6a4028', 1);
      ring(g, cx, cy, 140, 34, '#6a1e0a', 2);
      for (const [ox, oy] of f.def.base.cannons) line(g, cx, y + 22, ox, y + oy, '#2e2e38', 3);
      g.fillStyle = '#3a3a46';
      g.fillRect(cx - 30, y + 4, 60, 40);
      g.fillStyle = '#4a4a58';
      g.fillRect(cx - 22, y + 8, 44, 30);
      g.fillStyle = '#5a5a68';
      g.fillRect(cx - 30, y + 4, 60, 2);
      disc(g, cx, y + 22, 10, '#5a5a68');
      disc(g, cx, y + 22, 5, f.dome ? '#8ad8ff' : '#ff6a2a');
      if (!f.dome && Math.random() < 0.5) this.puff(cx + (Math.random() - 0.5) * 16, y + 20);
    }

    drawDome(g) {
      const f = this.f, D = f.def.base.dome, cy = Math.round(f.base.y + D.dy);
      g.fillStyle = 'rgba(110,170,255,0.13)';
      for (let k = -D.ry; k <= D.ry; k++) {
        const w = Math.round(D.rx * Math.sqrt(1 - (k / D.ry) * (k / D.ry)));
        g.fillRect(160 - w, cy + k, 2 * w, 1);
      }
      ring(g, 160, cy, D.rx, D.ry, 'rgba(170,220,255,0.7)', 3);
      const band = (this.t * 30) % (D.ry * 2) - D.ry;
      const w = Math.round(D.rx * Math.sqrt(Math.max(0, 1 - (band / D.ry) * (band / D.ry))));
      g.fillStyle = 'rgba(200,235,255,0.25)';
      g.fillRect(160 - w, Math.round(cy + band), 2 * w, 1);
    }

    drawKamino(g) {
      g.fillStyle = 'rgba(170,200,214,0.55)';
      for (let i = 0; i < 70; i++) {
        const x = ((i * 53.3 + this.t * 60) % 340) - 10, y = ((i * 97.7 + this.t * 380) % 260) - 10;
        g.fillRect(Math.round(x), Math.round(y), 1, 4);
      }
      g.fillStyle = '#0c1c24';
      g.fillRect(0, 232, A.LW, 8);
      for (let x = 12; x < A.LW; x += 44) {
        g.fillStyle = '#6a7a80';
        g.fillRect(x - 6, 232, 1, 8);
        g.fillRect(x + 6, 232, 1, 8);
        for (let k = 0; k <= 8; k++) {
          const w = Math.floor(Math.sqrt(64 - k * k));
          g.fillStyle = k > 5 ? '#e8f0f2' : '#c4d0d4';
          g.fillRect(x - w, 233 - k, 2 * w + 1, 1);
        }
        g.fillStyle = '#2a6a7a';
        g.fillRect(x - 5, 230, 10, 1);
      }
      if (this.leakT > 0) {
        g.fillStyle = `rgba(255,60,40,${this.leakT.toFixed(2)})`;
        g.fillRect(0, 222, A.LW, 18);
      }
      if (this.lightning > 0 && Math.floor(this.lightning * 40) % 2) {
        g.fillStyle = 'rgba(220,240,255,0.35)';
        g.fillRect(0, 0, A.LW, A.LH);
      }
    }

    drawAsh(g) {
      g.fillStyle = 'rgba(120,104,92,0.7)';
      for (let i = 0; i < 26; i++) {
        const x = ((i * 71.7 + this.t * (14 + (i % 3) * 6)) % 330) - 5, y = ((i * 43.1 + this.t * 70) % 250) - 5;
        g.fillRect(Math.round(x), Math.round(y), 1, 1);
      }
    }

    label(id) {
      return id === 'move' && this.ui.device === 'pad' ? 'Стик' : A.Input.label(id, this.ui.device);
    }

    goal() {
      const f = this.f, g = f.def.goal;
      if (g.type === 'boss') {
        const b = f.boss;
        return [g.text, b ? 'Бок: ' + Math.ceil(100 * b.hp / b.max) + ' %' : 'Бок ещё не догнал'];
      }
      if (g.type === 'hold') return [g.text, `Сбито: ${f.stats.kills}`, `Прорвалось: ${f.stats.leaked}, предел ${f.leakMax}`];
      if (g.type === 'survive') {
        const end = (f.def.timeline.find(a => a[1] === 'end') || [0])[0];
        return [g.text, `До реки: ${Math.max(0, Math.ceil(end - f.t))} с`, `Сбито: ${f.stats.kills}`];
      }
      if (!f.base) return [g.text, 'Цитадель впереди'];
      return [g.text, f.dome ? 'Щит базы стоит' : `Пушек осталось: ${f.cannons()} из ${f.def.base.cannons.length}`];
    }

    hud(g) {
      const F = A.Font, K = A.UIKit, f = this.f, s = f.ship, S = A.FLIGHT.ship, def = f.def;
      const w = Math.max(220, F.measure('bold', def.shipName) + 24);
      K.bevel(g, 12, 12, w, 58, 'rgba(14,12,28,0.86)', '#7a8ab0', '#20283a');
      F.draw(g, 'bold', def.shipName, 22, 15, K.GOLD, K.SHADOW);
      const k = s.shield / s.max;
      g.fillStyle = '#1a1a2a';
      g.fillRect(22, 36, 140, 10);
      g.fillStyle = k > 0.5 ? '#6ad8ff' : k > 0.25 ? '#e8c84a' : '#ff5a3a';
      g.fillRect(22, 36, Math.round(140 * k), 10);
      F.draw(g, 'text', 'Щиты ' + s.shield, 170, 33, K.INK, K.SHADOW);
      const ready = s.dashCool <= 0 && s.ion <= 0;
      g.fillStyle = '#1a1a2a';
      g.fillRect(22, 54, 60, 6);
      g.fillStyle = ready ? '#c8f0ff' : '#4a6a7a';
      g.fillRect(22, 54, Math.round(60 * (1 - s.dashCool / S.dashCool)), 6);
      F.draw(g, 'text', s.ion > 0 ? 'Ионный удар!' : 'Рывок', 90, 49, s.ion > 0 ? '#8ad8ff' : ready ? K.INK : '#7a8a9a', K.SHADOW);
      const lines = this.goal(), gw = Math.max(...lines.map((l, i) => F.measure(i ? 'text' : 'bold', l))) + 24;
      K.bevel(g, A.W - 12 - gw, 12, gw, 14 + lines.length * 18, 'rgba(14,12,28,0.86)', '#b09a6a', '#3a2a18');
      lines.forEach((l, i) => F.draw(g, i ? 'text' : 'bold', l, A.W - gw, 16 + i * 18, i ? K.INK : K.GOLD, K.SHADOW));
      if (this.mode === 'fly' && f.t < 6) {
        const L = id => this.label(id), t = `${L('move')}: полёт    ${L('fire')}: огонь    ${L('dash')}: рывок`, tw = F.measure('text', t) + 28;
        K.bevel(g, Math.round(320 - tw / 2), 84, tw, 24, 'rgba(20,14,32,0.88)', '#8a7a60', '#2a2018');
        F.draw(g, 'text', t, Math.round(320 - F.measure('text', t) / 2), 88, K.INK, K.SHADOW);
      }
      const r = this.radio;
      if (r) {
        const text = F.wrap('text', r.text, 560), h = 26 + text.length * 18, top = A.H - 4 - h;
        K.bevel(g, 12, top, 616, h, 'rgba(10,14,20,0.9)', '#6a8a9a', '#1a2a30');
        const nw = F.measure('bold', r.name) + 16;
        g.fillStyle = r.plate;
        g.fillRect(22, top + 5, nw, 18);
        F.draw(g, 'bold', r.name, 30, top + 6, '#ffffff', K.SHADOW);
        text.forEach((l, i) => F.draw(g, 'text', l, 30, top + 24 + i * 18, '#d8f0f8', K.SHADOW));
      }
    }

    drawIntro(g) {
      const F = A.Font, K = A.UIKit, def = this.f.def, L = id => this.label(id);
      const lines = [['Корабль: ' + def.shipName, K.INK], ['Цель: ' + def.goal.text, K.INK], [`${L('move')}: полёт, ${L('fire')}: огонь, ${L('dash')}: рывок`, '#c8d8e8'], ['Щиты держат удары. Если они кончатся, полёт начнётся сначала.', '#c8d8e8'], [`${L('ok')}: взлёт`, K.GOLD]];
      const w = Math.max(...lines.map(l => F.measure('text', l[0]))) + 56, h = 48 + lines.length * 20, x = Math.round(320 - w / 2), y = 150;
      K.bevel(g, x, y, w, h, 'rgba(14,10,24,0.95)', '#d8b884', '#4a3020');
      F.draw(g, 'bold', def.name, Math.round(320 - F.measure('bold', def.name) / 2), y + 12, K.GOLD, K.SHADOW);
      lines.forEach(([l, c], i) => F.draw(g, 'text', l, x + 28, y + 38 + i * 20, c, K.SHADOW));
      this.hits.push({ x, y, w, h, fn: () => this.key('Enter') });
    }

    drawResult(g) {
      const F = A.Font, K = A.UIKit, f = this.f, win = f.over === 'win', lines = [];
      const time = Math.floor(f.t / 60) + ':' + String(Math.floor(f.t % 60)).padStart(2, '0');
      if (win) {
        lines.push(['Время в воздухе: ' + time, K.INK], [`Щиты: ${f.ship.shield} из ${f.ship.max}`, K.INK]);
        if (f.stats.kills) lines.push(['Сбито истребителей: ' + f.stats.kills, K.INK]);
        if (f.def.goal.type === 'hold') lines.push([`Прорвалось к Типоке: ${f.stats.leaked}`, K.INK]);
      } else lines.push([f.reason === 'city' ? 'Слишком много истребителей прорвалось к Типоке.' : 'Щиты кончились, корабль подбит.', K.INK], ['Полёт начнётся сначала.', K.INK]);
      const opts = this.options();
      const w = Math.max(320, ...lines.map(l => F.measure('text', l[0]) + 48), ...opts.map(o => F.measure('text', o.label) + 72));
      const h = 56 + lines.length * 18 + opts.length * 20, x = Math.round(320 - w / 2), y = Math.round(180 - h / 2);
      K.bevel(g, x, y, w, h, 'rgba(14,10,24,0.96)', '#d8b884', '#4a3020');
      const title = win ? 'Полёт окончен' : 'Полёт сорван';
      F.draw(g, 'bold', title, Math.round(320 - F.measure('bold', title) / 2), y + 10, win ? K.GOLD : '#ff8a6a', K.SHADOW);
      lines.forEach(([l, c], i) => F.draw(g, 'text', l, x + 24, y + 34 + i * 18, c, K.SHADOW));
      opts.forEach((o, i) => {
        const oy = y + 40 + lines.length * 18 + i * 20, on = i === this.sel;
        if (on) {
          g.fillStyle = 'rgba(244,191,106,0.2)';
          g.fillRect(x + 20, oy - 2, w - 40, 18);
        }
        F.draw(g, 'text', (on ? '> ' : '  ') + o.label, x + 24, oy, on ? '#fff4d8' : K.INK, K.SHADOW);
        this.hits.push({ x: x + 20, y: oy - 2, w: w - 40, h: 18, hover: () => { this.sel = i; }, fn: () => { this.sel = i; o.act(); } });
      });
    }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
