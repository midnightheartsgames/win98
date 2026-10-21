(function (C) {
  'use strict';
  const { T, PH, clamp, approach, sign, overlap } = C;
  const STEP = 1 / 120;
  const SOLID = '#CX<>';
  const ONEWAY = '=-';
  const ENTITY_CH = 'PEKoFMhdlbrsumnVfxqZ@?';
  const DECOR_CH = 'Yy%J';

  function parseLevel(def) {
    const rows = def.map;
    const h = rows.length, w = Math.max(...rows.map(r => r.length));
    const tiles = new Array(w * h).fill('.');
    const ents = [], decor = [];
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < w; x++) {
        const ch = row[x] || '.';
        if (ENTITY_CH.includes(ch)) {
          ents.push({ ch, cx: x, cy: y });
          tiles[y * w + x] = ch === 'V' || ch === 'f' ? '#' : '.';
          if (ch === 'x') tiles[y * w + x] = '#';
        } else if (DECOR_CH.includes(ch)) {
          decor.push({ ch, cx: x, cy: y });
        } else if (ch === ' ' || ch === ':') {
          tiles[y * w + x] = ch === ':' ? ':' : '.';
        } else {
          tiles[y * w + x] = ch;
        }
      }
    }
    ents.filter(e => e.ch === '?').sort((a, b) => a.cx - b.cx || a.cy - b.cy).forEach((e, i) => { e.sign = i; });
    return { w, h, tiles, ents, decor, def };
  }

  const at = (lv, cx, cy) => (cx < 0 || cx >= lv.w ? '#' : cy < 0 || cy >= lv.h ? '.' : lv.tiles[cy * lv.w + cx]);

  class Game {
    constructor(def, opts = {}) {
      this.def = def;
      this.opts = opts;
      this.lv = parseLevel(def);
      this.t = 0;
      this.acc = 0;
      this.events = [];
      this.ents = [];
      this.crumble = new Map();
      this.lives = opts.lives || C.START_LIVES;
      this.coins = 0;
      this.coinsTotal = 0;
      this.bonusCoins = 0;
      this.fish = false;
      this.hasFish = false;
      this.state = 'play';
      this.stateT = 0;
      this.deaths = 0;
      this.flick = 0;
      this.shake = 0;
      this.pressed = { jump: false, dash: false };
      this.scroll = def.scroll ? { speed: def.scroll.speed, x: (def.scroll.from || 0) * T, to: (def.scroll.to || this.lv.w) * T - C.W, wait: def.scroll.delay || 0 } : null;
      this.cam = { x: 0, y: 0 };
      this.spawnAll();
      this.snapCamera();
    }

    emit(t, x, y, extra) { this.events.push(Object.assign({ t, x, y }, extra)); }
    drain() { const e = this.events; this.events = []; return e; }

    tile(cx, cy) { return at(this.lv, cx, cy); }

    solidAt(cx, cy) {
      const ch = at(this.lv, cx, cy);
      if (!SOLID.includes(ch)) return false;
      if (ch === 'X') return false;
      if (ch === 'C') { const c = this.crumble.get(cy * this.lv.w + cx); return !(c && c.gone > 0); }
      return true;
    }

    oneWayAt(cx, cy) {
      const ch = at(this.lv, cx, cy);
      if (ONEWAY.includes(ch)) return true;
      if (ch === 't') return this.flickOn(0);
      if (ch === 'T') return this.flickOn(1);
      return false;
    }

    flickOn(phase) {
      const p = this.def.flicker || 1.6;
      const k = Math.floor(this.t / p) % 2;
      return k === phase;
    }

    flickWarn(phase) {
      const p = this.def.flicker || 1.6;
      const k = Math.floor(this.t / p) % 2;
      return k === phase && (this.t % p) > p - 0.35;
    }

    spawnAll() {
      const lv = this.lv;
      for (const s of lv.ents) {
        const x = s.cx * T, y = s.cy * T;
        switch (s.ch) {
          case 'P': this.start = { x: x + 1, y: y + T - PH.h }; break;
          case 'E': this.add({ type: 'exit', x: x, y: y - T, w: T, h: T * 2 }); break;
          case 'K': this.add({ type: 'check', x: x, y: y + 4, w: T, h: 12, on: false }); break;
          case 'o': this.add({ type: 'coin', x: x + 3, y: y + 3, w: 10, h: 10 }); this.coinsTotal++; break;
          case 'F': this.add({ type: 'fish', x: x - 2, y: y - 6, w: 20, h: 22 }); this.hasFish = true; break;
          case 'M': this.add({ type: 'milk', x: x + 2, y: y + 6, w: 12, h: 10 }); break;
          case 'h': this.walker('hen', x, y, 14, 14, 24, 1); break;
          case 'd': this.walker('dog', x, y, 22, 18, 34, 2); break;
          case 'l': this.walker('wolf', x, y, 24, 18, 50, 2); break;
          case 's': this.walker('sheep', x, y, 26, 18, 12, 0); break;
          case 'b': this.add({ type: 'bird', x: x + 2, y: y + 4, w: 14, h: 10, x0: x + 2, y0: y + 4, hp: 1, hostile: true, ph: (s.cx * 0.7) % 6.28, range: 40 }); break;
          case 'r': this.add({ type: 'diver', x: x + 2, y: y + 4, w: 14, h: 10, x0: x + 2, y0: y + 4, hp: 1, hostile: true, st: 'idle', st_t: 0, cd: 0 }); break;
          case 'u': this.add({ type: 'butterfly', x: x + 4, y: y + 4, w: 10, h: 10, x0: x + 4, y0: y + 4, ph: s.cx }); break;
          case 'm': this.mover(s, 'h'); break;
          case 'n': this.mover(s, 'v'); break;
          case 'V': this.add({ type: 'vent', x: x, y: y, w: T, h: T, ph: (s.cx * 0.37) % 1, top: this.columnTop(s.cx, s.cy, 3) }); break;
          case 'f': this.add({ type: 'fan', x: x, y: y, w: T, h: T, top: this.columnTop(s.cx, s.cy, 7) }); break;
          case 'x': this.add({ type: 'dropper', x: x, y: y, w: T, h: T, ph: (s.cx * 0.53) % 1, period: 2.4, bottom: this.columnBottom(s.cx, s.cy) }); break;
          case 'q': this.add({ type: 'lane', x: x, y: y, w: T, h: T, dir: -1, next: 1 + (s.cx % 3) * 0.7 }); break;
          case 'Z': this.add({ type: 'van', x: x, y: y + T - 40, w: 72, h: 40, hp: 3, st: 'enter', st_t: 0, vx: 0, side: -1, speed: 70, x0: (this.def.arena ? this.def.arena[0] : 1) * T, x1: (this.def.arena ? this.def.arena[1] : this.lv.w - 1) * T, solidTop: true, hostile: false }); break;
          case '@': this.add({ type: 'cage', x: x - 4, y: y - 8, w: 24, h: 24, open: false, kitten: this.def.rescue }); break;
          case '?': this.add({ type: 'sign', x: x, y: y, w: T, h: T, sign: s.sign }); break;
        }
      }
      if (!this.start) this.start = { x: T, y: T };
      this.checkpoint = { x: this.start.x, y: this.start.y };
      this.player = this.makePlayer(this.start.x, this.start.y);
    }

    add(e) {
      e.alive = true; e.t = 0;
      if (e.vx === undefined) e.vx = 0;
      if (e.vy === undefined) e.vy = 0;
      this.ents.push(e);
      return e;
    }

    walker(type, x, y, w, h, speed, hp) {
      return this.add({ type, x: x + (T - w) / 2, y: y + T - h, w, h, speed, hp, dir: -1, hostile: hp > 0, onGround: false, st: 'walk', st_t: 0, bouncy: type === 'sheep' });
    }

    mover(s, axis) {
      const lv = this.lv;
      let a = 0, b = 0;
      if (axis === 'h') {
        for (let x = s.cx - 1; x >= 0; x--) if (at(lv, x, s.cy) === ':') { a = x - s.cx; break; }
        for (let x = s.cx + 1; x < lv.w; x++) if (at(lv, x, s.cy) === ':') { b = x - s.cx; break; }
        if (!a && !b) b = 4;
      } else {
        for (let y = s.cy - 1; y >= 0; y--) if (at(lv, s.cx, y) === ':') { a = y - s.cy; break; }
        for (let y = s.cy + 1; y < lv.h; y++) if (at(lv, s.cx, y) === ':') { b = y - s.cy; break; }
        if (!a && !b) a = -4;
      }
      const x = s.cx * T, y = s.cy * T;
      const span = (b - a) * T;
      return this.add({ type: 'plat', axis, x: x - T, y, w: T * 3, h: 8, ox: x - T, oy: y, a: a * T, b: b * T, u: -a * T, d: 1, speed: 42, wait: 0, solidTop: true, span });
    }

    columnTop(cx, cy, max) {
      let n = 0;
      for (let y = cy - 1; y >= 0 && n < max; y--, n++) if (this.solidAt(cx, y)) break;
      return (cy - n) * T;
    }

    columnBottom(cx, cy) {
      for (let y = cy + 1; y < this.lv.h; y++) if (this.solidAt(cx, y) || this.oneWayAt(cx, y)) return y * T;
      return this.lv.h * T;
    }

    makePlayer(x, y) {
      return { x, y, w: PH.w, h: PH.h, vx: 0, vy: 0, face: 1, onGround: false, coyote: 0, buffer: 0, dashT: 0, dashDir: 1, dashReady: true, dashCool: 0, wall: 0, wallCoy: 0, wallSide: 0, wallLock: 0, lockDir: 0, dropT: 0, invul: 0, ride: null, prevBottom: y + PH.h, landV: 0, hurtT: 0, fan: false, idle: 0, conv: 0 };
    }

    update(dt, input) {
      this.lastInput = input;
      if (input.jumpPressed) this.pressed.jump = true;
      if (input.dashPressed) this.pressed.dash = true;
      this.acc = Math.min(this.acc + dt, 0.1);
      while (this.acc >= STEP) {
        this.acc -= STEP;
        this.step(STEP, input);
      }
    }

    step(dt, input) {
      this.t += dt;
      this.stateT += dt;
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt);
      const jp = this.pressed.jump, dp = this.pressed.dash;
      this.pressed.jump = false; this.pressed.dash = false;
      this.updateCrumble(dt);
      for (const e of this.ents) if (e.alive) this.updateEnt(e, dt);
      if (this.state === 'play') {
        this.updatePlayer(dt, input, jp, dp);
        this.interact(dt);
        if (this.scroll) this.updateScroll(dt);
      } else if (this.state === 'dying') {
        const p = this.player;
        p.vy = Math.min(p.vy + PH.gFall * dt, PH.maxFall);
        p.y += p.vy * dt;
        if (this.stateT > 1.0) this.respawn();
      } else if (this.state === 'clear' || this.state === 'rescue') {
        const p = this.player;
        if (!p.onGround) { p.vy = Math.min(p.vy + PH.gFall * dt, PH.maxFall); this.moveY(p, p.vy * dt); }
        p.vx = approach(p.vx, 0, PH.fricG * dt);
        this.moveX(p, p.vx * dt);
      }
      this.ents = this.ents.filter(e => e.alive || e.keep);
      this.updateCamera(dt);
    }

    updateScroll(dt) {
      const s = this.scroll, p = this.player;
      if (s.wait > 0) s.wait -= dt;
      else s.x = Math.min(s.to, s.x + s.speed * dt);
      if (p.x + p.w > s.x + C.W - 4) { p.x = s.x + C.W - 4 - p.w; if (p.vx > 0) p.vx = 0; }
      if (p.x < s.x + 6) this.kill('caught');
    }

    updateCrumble(dt) {
      for (const [k, c] of this.crumble) {
        if (c.gone > 0) {
          c.gone -= dt;
          if (c.gone <= 0) {
            const cx = k % this.lv.w, cy = Math.floor(k / this.lv.w);
            const box = { x: cx * T, y: cy * T, w: T, h: T };
            if (overlap(box, this.player)) c.gone = 0.2; else this.crumble.delete(k);
          }
        } else if (c.shake > 0) {
          c.shake -= dt;
          if (c.shake <= 0) { c.gone = 3.2; this.emit('crumble', (k % this.lv.w) * T + 8, Math.floor(k / this.lv.w) * T + 8); }
        }
      }
    }

    touchCrumble(cx, cy) {
      if (at(this.lv, cx, cy) !== 'C') return;
      const k = cy * this.lv.w + cx;
      if (!this.crumble.has(k)) { this.crumble.set(k, { shake: 0.45, gone: 0 }); this.emit('shake', cx * T + 8, cy * T + 8); }
    }

    moveX(b, dx) {
      if (!dx) return 0;
      b.x += dx;
      const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.01) / T);
      if (dx > 0) {
        const cx = Math.floor((b.x + b.w - 0.01) / T);
        for (let cy = y0; cy <= y1; cy++) if (this.solidAt(cx, cy)) { b.x = cx * T - b.w; return 1; }
      } else {
        const cx = Math.floor(b.x / T);
        for (let cy = y0; cy <= y1; cy++) if (this.solidAt(cx, cy)) { b.x = (cx + 1) * T; return -1; }
      }
      return 0;
    }

    moveY(b, dy, ignoreOneWay) {
      b.onGround = false;
      if (!dy) dy = 0.0001;
      const oldBottom = b.y + b.h;
      b.y += dy;
      const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.01) / T);
      if (dy > 0) {
        const cy = Math.floor((b.y + b.h - 0.01) / T);
        for (let cx = x0; cx <= x1; cx++) {
          if (this.solidAt(cx, cy) || (!ignoreOneWay && this.oneWayAt(cx, cy) && oldBottom <= cy * T + 0.5)) {
            b.y = cy * T - b.h; b.onGround = true; b.groundCx = cx; b.groundCy = cy;
            return 1;
          }
        }
      } else {
        const cy = Math.floor(b.y / T);
        for (let cx = x0; cx <= x1; cx++) if (this.solidAt(cx, cy)) { b.y = (cy + 1) * T; return -1; }
      }
      return 0;
    }

    groundAhead(e, dir) {
      const fx = dir > 0 ? e.x + e.w + 1 : e.x - 1;
      const cx = Math.floor(fx / T), cy = Math.floor((e.y + e.h + 2) / T);
      return this.solidAt(cx, cy) || this.oneWayAt(cx, cy);
    }

    wallAhead(e, dir) {
      const fx = dir > 0 ? e.x + e.w + 1 : e.x - 1;
      const cx = Math.floor(fx / T), cy = Math.floor((e.y + e.h - 4) / T);
      return this.solidAt(cx, cy);
    }

    solidSide(b, dir) {
      const fx = dir > 0 ? b.x + b.w + 0.5 : b.x - 0.5;
      const cx = Math.floor(fx / T);
      return this.solidAt(cx, Math.floor((b.y + 2) / T)) || this.solidAt(cx, Math.floor((b.y + b.h - 3) / T));
    }

    updatePlayer(dt, input, jp, dp) {
      const p = this.player;
      p.prevBottom = p.y + p.h;
      const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
      if (jp) p.buffer = PH.buffer; else p.buffer = Math.max(0, p.buffer - dt);
      p.coyote = p.onGround ? PH.coyote : Math.max(0, p.coyote - dt);
      p.wallCoy = Math.max(0, p.wallCoy - dt);
      p.invul = Math.max(0, p.invul - dt);
      p.dashCool = Math.max(0, p.dashCool - dt);
      p.wallLock = Math.max(0, p.wallLock - dt);
      p.dropT = Math.max(0, p.dropT - dt);
      p.hurtT = Math.max(0, p.hurtT - dt);

      if (p.ride && p.ride.alive) {
        const r = p.ride;
        if (r.dx) this.moveX(p, r.dx);
        if (r.dy) { p.y += r.dy; if (r.dy < 0 && this.ceilingHit(p)) p.ride = null; }
      }

      if (dp && p.dashReady && p.dashCool <= 0 && p.hurtT <= 0) {
        p.dashT = PH.dashT;
        p.dashDir = dir || p.face;
        p.face = p.dashDir;
        p.dashReady = false;
        p.dashCool = PH.dashCool;
        p.wall = 0;
        if (!p.onGround) p.vy = -PH.dashLift;
        this.emit('dash', p.x + p.w / 2, p.y + p.h / 2, { dir: p.dashDir });
      }

      if (p.dashT > 0) {
        p.dashT -= dt;
        p.vx = p.dashDir * PH.dashV;
        if (p.dashT <= 0) p.vx = p.dashDir * Math.max(PH.run, PH.dashV * 0.62);
      } else if (p.hurtT > 0) {
        p.vx = approach(p.vx, 0, PH.fricA * dt);
      } else {
        const d = p.wallLock > 0 ? p.lockDir : dir;
        const target = d * PH.run;
        if (d && Math.abs(p.vx) > PH.run && sign(p.vx) === d) p.vx = approach(p.vx, target, PH.overRun * dt);
        else if (d) p.vx = approach(p.vx, target, (p.onGround ? PH.accG : PH.accA) * dt * (sign(p.vx) !== d && p.vx ? 1.6 : 1));
        else p.vx = approach(p.vx, 0, (p.onGround ? PH.fricG : PH.fricA) * dt);
        if (dir && p.wallLock <= 0) p.face = dir;
      }

      if (p.buffer > 0 && p.hurtT <= 0) {
        const onOneWay = p.onGround && !this.solidUnder(p) && !p.ride;
        if (input.down && onOneWay) {
          p.dropT = 0.22; p.buffer = 0; p.y += 1; p.onGround = false; p.coyote = 0;
        } else if (p.onGround || p.coyote > 0) {
          p.vy = -PH.jumpV; p.onGround = false; p.coyote = 0; p.buffer = 0; p.ride = null; p.dashT = 0;
          this.emit('jump', p.x + p.w / 2, p.y + p.h);
        } else if (p.wall || p.wallCoy > 0) {
          const side = p.wall || p.wallSide;
          p.vx = -side * PH.wallJumpVX; p.vy = -PH.wallJumpVY;
          p.wallLock = PH.wallLock; p.lockDir = -side; p.face = -side;
          p.wall = 0; p.wallCoy = 0; p.buffer = 0; p.dashT = 0;
          this.emit('walljump', p.x + (side > 0 ? p.w : 0), p.y + p.h / 2, { dir: -side });
        }
      }

      p.fan = this.inFan(p);
      if (p.dashT > 0) {
        if (p.onGround) p.vy = 0;
      } else if (p.fan) {
        p.vy = Math.max(-PH.fanMax, p.vy - PH.fanLift * dt);
      } else {
        const g = p.vy < 0 ? (input.jump || p.hurtT > 0 ? PH.g : PH.gCut) : PH.gFall;
        p.vy = Math.min(p.vy + g * dt, PH.maxFall);
        if (p.wall && p.vy > PH.wallSlide) p.vy = approach(p.vy, PH.wallSlide, 2400 * dt);
      }

      let conv = 0;
      if (p.onGround && p.groundCx !== undefined) {
        const gch = at(this.lv, p.groundCx, p.groundCy);
        if (gch === '<') conv = -PH.conveyor; else if (gch === '>') conv = PH.conveyor;
      }
      p.conv = conv;

      const hitX = this.moveX(p, (p.vx + conv) * dt);
      if (hitX && p.dashT > 0) { p.dashT = 0; p.vx = 0; this.emit('bonk', p.x + (hitX > 0 ? p.w : 0), p.y + p.h / 2); }
      if (hitX && p.hurtT <= 0) p.vx = 0;

      const wasGround = p.onGround;
      const fallV = p.vy;
      const ry = this.moveY(p, p.vy * dt, p.dropT > 0);
      if (ry < 0) p.vy = Math.max(0, p.vy);
      if (ry > 0) p.vy = 0;
      if (!p.onGround) this.landOnBodies(p);
      else p.ride = null;
      if (p.onGround && p.groundCx !== undefined && !p.ride) {
        this.touchCrumble(p.groundCx, p.groundCy);
        const x1 = Math.floor((p.x + p.w - 0.01) / T);
        if (x1 !== p.groundCx) this.touchCrumble(x1, p.groundCy);
      }
      if (p.onGround && !wasGround) {
        p.landV = fallV;
        p.dashReady = true;
        if (fallV > 120) this.emit('land', p.x + p.w / 2, p.y + p.h, { v: fallV });
      }
      if (p.onGround) p.dashReady = p.dashReady || p.dashCool <= 0;

      const prevWall = p.wall;
      p.wall = 0;
      if (!p.onGround && p.dashT <= 0 && p.hurtT <= 0 && p.wallLock <= 0.05 && dir && this.solidSide(p, dir) && p.vy > -120) {
        p.wall = dir; p.wallSide = dir; p.dashReady = true; p.face = dir;
        if (!prevWall) this.emit('cling', p.x + (dir > 0 ? p.w : 0), p.y + p.h / 2, { dir });
      }
      if (prevWall && !p.wall) p.wallCoy = PH.wallCoyote;

      if (p.onGround && !dir && Math.abs(p.vx) < 5) p.idle += dt; else p.idle = 0;
      this.hazards(p);
    }

    solidUnder(p) {
      const cy = Math.floor((p.y + p.h + 1) / T);
      const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 0.01) / T);
      for (let cx = x0; cx <= x1; cx++) if (this.solidAt(cx, cy)) return true;
      return false;
    }

    ceilingHit(p) {
      const cy = Math.floor(p.y / T);
      const x0 = Math.floor(p.x / T), x1 = Math.floor((p.x + p.w - 0.01) / T);
      for (let cx = x0; cx <= x1; cx++) if (this.solidAt(cx, cy)) { p.y = (cy + 1) * T; return true; }
      return false;
    }

    landOnBodies(p) {
      if (p.vy < 0 || p.dropT > 0) return;
      const bottom = p.y + p.h;
      for (const e of this.ents) {
        if (!e.alive || !(e.solidTop || e.bouncy)) continue;
        const top = this.topOf(e);
        if (p.x + p.w <= e.x + 1 || p.x >= e.x + e.w - 1) continue;
        if (p.prevBottom <= top + 1.5 && bottom >= top) {
          if (e.bouncy) {
            p.y = top - p.h;
            p.vy = -(this.inputJumpHeld ? PH.bounceHeld : PH.bounceV);
            p.dashReady = true; p.coyote = 0;
            e.squash = 0.25;
            this.emit('bounce', p.x + p.w / 2, top, { who: e.type });
            return;
          }
          p.y = top - p.h; p.vy = 0; p.onGround = true; p.ride = e; p.groundCx = undefined;
          p.dashReady = true;
          return;
        }
      }
    }

    topOf(e) {
      if (e.type === 'sheep') return e.y + 2;
      return e.y;
    }

    inFan(p) {
      for (const e of this.ents) {
        if (e.type !== 'fan') continue;
        if (p.x + p.w > e.x + 1 && p.x < e.x + e.w - 1 && p.y + p.h > e.top && p.y < e.y) return true;
      }
      return false;
    }

    hazards(p) {
      const x0 = Math.floor((p.x + 2) / T), x1 = Math.floor((p.x + p.w - 2) / T);
      const y0 = Math.floor(p.y / T), y1 = Math.floor((p.y + p.h - 0.01) / T);
      for (let cy = y0; cy <= y1; cy++) {
        for (let cx = x0; cx <= x1; cx++) {
          const ch = at(this.lv, cx, cy);
          if (ch === '^' && p.y + p.h > cy * T + 8) this.hurt(cx * T + 8, 'spike');
          if (ch === 'w' || (ch === '~' && p.y + p.h > cy * T + 7)) { this.kill('drown'); return; }
        }
      }
      if (p.y > this.lv.h * T + 24) this.kill('fall');
    }

    hurt(fromX, why) {
      const p = this.player;
      if (p.invul > 0 || this.state !== 'play') return;
      this.lives--;
      this.deaths++;
      if (this.lives <= 0) { this.lives = 0; this.state = 'over'; this.stateT = 0; this.emit('over', p.x, p.y); return; }
      const d = p.x + p.w / 2 < fromX ? -1 : 1;
      p.vx = d * PH.hurtVX; p.vy = -PH.hurtVY; p.invul = PH.invul; p.hurtT = 0.32; p.dashT = 0; p.wall = 0; p.onGround = false; p.ride = null;
      this.shake = 0.25;
      this.emit('hurt', p.x + p.w / 2, p.y + p.h / 2, { why });
    }

    kill(why) {
      if (this.state !== 'play') return;
      const p = this.player;
      this.lives--;
      this.deaths++;
      this.emit(why === 'drown' ? 'drown' : 'die', p.x + p.w / 2, p.y + p.h / 2, { why });
      if (this.lives <= 0) { this.lives = 0; this.state = 'over'; this.stateT = 0; this.emit('over', p.x, p.y); return; }
      this.state = 'dying'; this.stateT = 0;
      p.vy = why === 'fall' ? 0 : -220; p.vx = 0;
    }

    respawn() {
      const p = this.makePlayer(this.checkpoint.x, this.checkpoint.y);
      p.invul = 1.0;
      p.face = this.player.face;
      this.player = p;
      this.state = 'play'; this.stateT = 0;
      if (this.scroll) { this.scroll.x = clamp(this.checkpoint.x - 90, (this.def.scroll.from || 0) * T, this.scroll.to); this.scroll.wait = 1.2; }
      for (const e of this.ents) if (e.type === 'van' && e.hp > 0) this.resetVan(e);
      this.snapCamera();
      this.emit('respawn', p.x, p.y);
    }

    interact() {
      const p = this.player;
      for (const e of this.ents) {
        if (!e.alive || e.dying) continue;
        if (e.type === 'van') { this.vanContact(e, p); continue; }
        if (!overlap(p, e)) continue;
        switch (e.type) {
          case 'coin':
            e.alive = false; this.coins++;
            this.emit('coin', e.x + 5, e.y + 5);
            if (this.coins % C.COINS_PER_LIFE === 0) this.gainLife(e);
            break;
          case 'milk': e.alive = false; this.gainLife(e, true); break;
          case 'fish': e.alive = false; this.fish = true; this.emit('fish', e.x + 10, e.y + 10); break;
          case 'butterfly': e.alive = false; this.bonusCoins += 3; this.emit('butterfly', e.x + 5, e.y + 5); break;
          case 'check':
            if (!e.on) {
              for (const o of this.ents) if (o.type === 'check') o.on = false;
              e.on = true; this.checkpoint = { x: e.x + 1, y: e.y + 12 - PH.h };
              this.emit('check', e.x + 8, e.y);
            }
            break;
          case 'exit': this.finish('clear'); break;
          case 'cage':
            if (!e.open) { e.open = true; e.keep = true; this.finish('rescue', e); }
            break;
          case 'kitten':
            if (e.st === 'sit') { e.st = 'saved'; this.finish('rescue', e); }
            break;
          case 'brick': case 'car': case 'steam':
            this.hurt(e.x + e.w / 2, e.type);
            break;
          case 'vent':
            break;
          default:
            if (e.hostile) this.fight(p, e);
        }
      }
      for (const e of this.ents) {
        if (e.type === 'vent' && e.alive && this.ventOn(e)) {
          const col = { x: e.x + 3, y: e.top, w: e.w - 6, h: e.y - e.top };
          if (overlap(p, col)) this.hurt(e.x + 8, 'steam');
        }
        if (e.type === 'car' && e.alive && !e.dying) {
          const side = { x: e.x + 2, y: e.y + 6, w: e.w - 4, h: e.h - 6 };
          if (overlap(p, side) && !(p.ride === e)) this.hurt(e.x + e.w / 2, 'car');
        }
      }
    }

    gainLife(e, milk) {
      if (this.lives < C.MAX_LIVES) { this.lives++; this.emit('life', e.x + 6, e.y, { milk: !!milk }); }
      else this.emit(milk ? 'milkfull' : 'coinfull', e.x + 6, e.y);
    }

    fight(p, e) {
      if (e.hitT > 0) return;
      const stomp = p.vy > 40 && p.prevBottom <= e.y + 7;
      if (p.dashT > 0 || stomp) {
        this.hitEnemy(e, stomp ? 'stomp' : 'pounce');
        if (stomp) {
          p.y = e.y - p.h; p.vy = -(this.inputJumpHeld ? PH.stompHeld : PH.stompV);
        } else {
          p.vy = -220; p.dashT = 0; p.vx = -p.dashDir * 40;
        }
        p.dashReady = true; p.dashCool = 0;
      } else if (p.invul <= 0) {
        if (e.st === 'stun') return;
        this.hurt(e.x + e.w / 2, e.type);
      }
    }

    hitEnemy(e, how) {
      e.hp--;
      e.hitT = 0.35;
      this.emit('stomp', e.x + e.w / 2, e.y, { how, who: e.type });
      if (e.hp <= 0) {
        e.dying = true; e.keep = true; e.deadT = 0; e.vy = -150; e.vx = sign(e.x - this.player.x) * 50 || 40;
        this.emit('kill', e.x + e.w / 2, e.y + e.h / 2, { who: e.type });
      } else {
        e.st = 'stun'; e.st_t = 0.9; e.vx = 0;
      }
    }

    finish(kind, e) {
      if (this.state !== 'play') return;
      this.state = kind; this.stateT = 0;
      this.emit(kind, e ? e.x + e.w / 2 : this.player.x, e ? e.y : this.player.y, { kitten: e && e.kitten });
    }

    updateEnt(e, dt) {
      e.t += dt;
      if (e.hitT > 0) e.hitT -= dt;
      if (e.squash > 0) e.squash -= dt;
      if (e.dying) {
        e.deadT += dt; e.vy += PH.gFall * dt; e.x += e.vx * dt; e.y += e.vy * dt;
        if (e.deadT > 1.2) { e.alive = false; e.keep = false; }
        return;
      }
      const fn = ENT[e.type];
      if (fn) fn.call(this, e, dt);
    }

    ventOn(e) {
      const k = (this.t / 2.6 + e.ph) % 1;
      return k > 0.62;
    }

    ventWarn(e) {
      const k = (this.t / 2.6 + e.ph) % 1;
      return k > 0.45 && k <= 0.62;
    }

    walk(e, dt, speed, turnAtEdges) {
      e.vy = Math.min(e.vy + PH.gFall * dt, PH.maxFall);
      const blocked = this.moveX(e, e.dir * speed * dt);
      this.moveY(e, e.vy * dt);
      if (e.onGround) e.vy = 0;
      if (blocked || (e.onGround && turnAtEdges && !this.groundAhead(e, e.dir))) e.dir = -e.dir;
    }

    resetVan(v) {
      v.st = 'drive'; v.st_t = 0; v.side = v.x > (v.x0 + v.x1) / 2 ? -1 : 1;
    }

    vanContact(v, p) {
      if (v.st === 'broken') return;
      const body = { x: v.x + 2, y: v.y + 4, w: v.w - 4, h: v.h - 4 };
      const cage = { x: v.x + v.w / 2 - 14, y: v.y - 18, w: 28, h: 18 };
      if (overlap(p, cage)) {
        const stomp = p.vy > 0 && p.prevBottom <= cage.y + 7;
        if ((stomp || p.dashT > 0) && v.st === 'expose' && !(v.hitT > 0)) {
          v.hp--; v.hitT = 1; this.shake = 0.4;
          p.vy = -PH.stompHeld; p.dashT = 0; p.dashReady = true; p.y = Math.min(p.y, cage.y - p.h);
          this.emit('bosshit', cage.x + 14, cage.y, { hp: v.hp });
          if (v.hp <= 0) { v.st = 'broken'; v.st_t = 0; this.emit('vanbreak', v.x + v.w / 2, v.y); }
          else { v.st = 'hit'; v.st_t = 0; v.speed *= 1.3; }
        } else if (stomp) {
          p.vy = -PH.stompV; p.y = cage.y - p.h; p.dashReady = true;
          this.emit('clank', cage.x + 14, cage.y);
        } else if (p.dashT > 0) {
          p.dashT = 0; p.vx = -p.dashDir * 80; p.vy = -160;
          this.emit('clank', cage.x + 14, cage.y);
        }
        return;
      }
      if (overlap(p, body) && Math.abs(v.vx) > 1 && p.ride !== v) this.hurt(v.x + v.w / 2, 'van');
    }
  }

  const ENT = {
    hen(e, dt) {
      e.st_t -= dt;
      if (e.st === 'peck') { if (e.st_t <= 0) { e.st = 'walk'; e.st_t = 1.5 + (e.x % 7) * 0.3; } e.vy = Math.min(e.vy + PH.gFall * dt, PH.maxFall); this.moveY(e, e.vy * dt); return; }
      if (e.st_t <= 0) { e.st = 'peck'; e.st_t = 0.8; }
      this.walk(e, dt, e.speed, true);
    },
    dog(e, dt) {
      const p = this.player;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2), dy = p.y + p.h - (e.y + e.h);
      e.st_t -= dt;
      if (e.st === 'stun') { this.walk(e, dt, 0, true); if (e.st_t <= 0) { e.st = 'walk'; } return; }
      if (e.st === 'walk') {
        this.walk(e, dt, e.speed, true);
        if (this.state === 'play' && Math.abs(dx) < (e.angry ? 200 : 110) && Math.abs(dy) < 28 && (sign(dx) === e.dir || e.angry)) { e.st = 'alert'; e.st_t = e.angry ? 0.25 : 0.45; e.dir = sign(dx) || e.dir; this.emit('bark', e.x + e.w / 2, e.y); }
      } else if (e.st === 'alert') {
        this.walk(e, dt, 0, true);
        if (e.st_t <= 0) { e.st = 'charge'; e.st_t = 1.4; }
      } else if (e.st === 'charge') {
        const before = e.dir;
        this.walk(e, dt, e.speed * 3.3, true);
        if (e.dir !== before || e.st_t <= 0) { e.st = 'walk'; e.st_t = 0; }
      }
    },
    wolf(e, dt) {
      const p = this.player;
      const dx = p.x + p.w / 2 - (e.x + e.w / 2), dy = p.y + p.h - (e.y + e.h);
      e.st_t -= dt;
      if (e.st === 'stun') { this.walk(e, dt, 0, true); if (e.st_t <= 0) e.st = 'walk'; return; }
      if (e.st === 'walk') {
        this.walk(e, dt, e.speed, true);
        if (this.state === 'play' && Math.abs(dx) < 90 && Math.abs(dx) > 16 && dy > -60 && dy < 24 && e.onGround && !(e.cd > 0)) {
          e.st = 'crouch'; e.st_t = 0.38; e.dir = sign(dx) || e.dir; this.emit('growl', e.x + e.w / 2, e.y);
        }
        if (e.cd > 0) e.cd -= dt;
      } else if (e.st === 'crouch') {
        this.walk(e, dt, 0, true);
        if (e.st_t <= 0) { e.st = 'leap'; e.vy = -250; e.lvx = e.dir * 150; this.emit('howl', e.x + e.w / 2, e.y); }
      } else if (e.st === 'leap') {
        e.vy = Math.min(e.vy + PH.gFall * dt, PH.maxFall);
        if (this.moveX(e, e.lvx * dt)) e.lvx = 0;
        this.moveY(e, e.vy * dt);
        if (e.onGround) { e.vy = 0; e.st = 'walk'; e.cd = 1.1; }
      }
    },
    sheep(e, dt) {
      e.st_t -= dt;
      if (e.st === 'graze') { if (e.st_t <= 0) { e.st = 'walk'; e.st_t = 2 + (e.x % 5); } this.walk(e, dt, 0, true); return; }
      if (e.st_t <= 0) { e.st = 'graze'; e.st_t = 1.6; }
      this.walk(e, dt, e.speed, true);
    },
    bird(e, dt) {
      if (e.st === 'stun') { e.st = 'fly'; }
      const k = e.t * 1.1 + e.ph;
      const nx = e.x0 + Math.sin(k) * e.range;
      e.dir = Math.cos(k) >= 0 ? 1 : -1;
      if (!e.range) e.dir = this.player.x < e.x ? -1 : 1;
      e.x = nx;
      e.y = e.y0 + Math.sin(e.t * 2.6 + e.ph) * 5;
    },
    diver(e, dt) {
      const p = this.player;
      e.st_t -= dt; e.cd -= dt;
      const px = p.x + p.w / 2, py = p.y + p.h / 2;
      if (e.st === 'idle' || e.st === 'stun') {
        e.st = 'idle';
        e.x = e.x0 + Math.sin(e.t * 1.7) * 6; e.y = e.y0 + Math.sin(e.t * 2.9) * 3;
        e.dir = px < e.x ? -1 : 1;
        if (this.state === 'play' && e.cd <= 0 && Math.abs(px - e.x) < 70 && py > e.y + 10 && py - e.y < 130) { e.st = 'warn'; e.st_t = 0.42; this.emit('screech', e.x + 7, e.y); }
      } else if (e.st === 'warn') {
        if (e.st_t <= 0) {
          const dx = px - (e.x + 7), dy = py - (e.y + 5), l = Math.hypot(dx, dy) || 1;
          e.vx = dx / l * 175; e.vy = dy / l * 175; e.st = 'dive'; e.st_t = 1.1; e.dir = sign(e.vx) || e.dir;
        }
      } else if (e.st === 'dive') {
        e.x += e.vx * dt; e.y += e.vy * dt;
        const cx = Math.floor((e.x + 7) / T), cy = Math.floor((e.y + 10) / T);
        if (e.st_t <= 0 || this.solidAt(cx, cy)) { e.st = 'back'; }
      } else if (e.st === 'back') {
        const dx = e.x0 - e.x, dy = e.y0 - e.y, l = Math.hypot(dx, dy);
        e.dir = sign(dx) || e.dir;
        if (l < 2) { e.st = 'idle'; e.cd = 1.2; e.t = 0; }
        else { const s = Math.min(l, 85 * dt); e.x += dx / l * s; e.y += dy / l * s; }
      }
    },
    butterfly(e, dt) {
      e.x = e.x0 + Math.sin(e.t * 0.9 + e.ph) * 14 + Math.sin(e.t * 2.3) * 4;
      e.y = e.y0 + Math.sin(e.t * 1.7 + e.ph) * 8;
    },
    plat(e, dt) {
      const ox = e.x, oy = e.y;
      if (e.wait > 0) { e.wait -= dt; e.dx = 0; e.dy = 0; return; }
      e.u += e.d * e.speed * dt;
      const len = e.b - e.a;
      if (e.u >= len) { e.u = len; e.d = -1; e.wait = 0.35; }
      if (e.u <= 0) { e.u = 0; e.d = 1; e.wait = 0.35; }
      const off = e.a + e.u;
      if (e.axis === 'h') e.x = e.ox + off; else e.y = e.oy + off;
      e.dx = e.x - ox; e.dy = e.y - oy;
    },
    dropper(e, dt) {
      const k = (this.t / e.period + e.ph) % 1;
      const was = e.k || 0;
      e.k = k;
      e.warn = k > 0.7;
      if (was < 0.999 && was > k) {
        this.add({ type: 'brick', x: e.x + 3, y: e.y + T, w: 10, h: 8, vy: 0, keep: false, bottom: e.bottom });
        this.emit('brickfall', e.x + 8, e.y + T);
      }
    },
    brick(e, dt) {
      e.vy = Math.min(e.vy + 900 * dt, 420);
      e.y += e.vy * dt;
      if (e.y + e.h >= e.bottom) { e.alive = false; this.emit('brick', e.x + 5, e.bottom); }
    },
    lane(e, dt) {
      e.next -= dt;
      const p = this.player;
      if (e.next <= 0) {
        e.next = 3.6;
        if (Math.abs(p.x - e.x) < 420) {
          this.add({ type: 'car', x: e.x + (e.dir > 0 ? -40 : 0), y: e.y + T - 15, w: 40, h: 15, vx: e.dir * 150, solidTop: true, tint: Math.floor(this.t * 7) % 3, life: 6 });
          this.emit('car', e.x, e.y);
        }
      }
    },
    car(e, dt) {
      e.life -= dt;
      const ox = e.x;
      e.x += e.vx * dt;
      const fx = e.vx > 0 ? e.x + e.w : e.x;
      if (this.solidAt(Math.floor(fx / T), Math.floor((e.y + e.h - 4) / T))) { e.alive = false; this.emit('carout', fx, e.y); }
      e.dx = e.x - ox; e.dy = 0;
      if (e.life <= 0 || e.x < -60 || e.x > this.lv.w * T + 60) e.alive = false;
    },
    vent() { },
    fan() { },
    van(v, dt) {
      v.st_t += dt;
      if (v.hitT > 0) v.hitT -= dt;
      const ox = v.x;
      const leftStop = v.x0 + 8, rightStop = v.x1 - v.w - 8;
      if (v.st === 'enter') {
        v.vx = 0;
        if (v.st_t > 1.2) { v.st = 'drive'; v.st_t = 0; v.side = -1; }
      } else if (v.st === 'drive') {
        const target = v.side < 0 ? leftStop : rightStop;
        v.vx = sign(target - v.x) * v.speed;
        v.x += v.vx * dt;
        if ((v.vx < 0 && v.x <= target) || (v.vx > 0 && v.x >= target)) { v.x = target; v.vx = 0; v.st = 'stop'; v.st_t = 0; }
      } else if (v.st === 'stop') {
        v.vx = 0;
        if (v.st_t > 0.5 && !v.spawned) {
          v.spawned = true;
          const n = 1 + (3 - v.hp);
          for (let i = 0; i < n; i++) {
            const d = this.walker('dog', v.side < 0 ? v.x + v.w : v.x - 22, v.y + v.h - T, 22, 18, 40, 2);
            d.x = v.side < 0 ? v.x + v.w + 4 + i * 26 : v.x - 26 - i * 26;
            d.y = v.y + v.h - 18;
            d.dir = -v.side; d.angry = true;
            if (d.x < v.x0 || d.x + d.w > v.x1) d.x = clamp(d.x, v.x0, v.x1 - d.w);
          }
          this.emit('doors', v.x + v.w / 2, v.y);
        }
        if (v.st_t > 0.9) { v.st = 'expose'; v.st_t = 0; this.emit('expose', v.x + v.w / 2, v.y - 18); }
      } else if (v.st === 'expose') {
        if (v.st_t > 3.4) { v.st = 'drive'; v.st_t = 0; v.side = -v.side; v.spawned = false; this.emit('honk', v.x + v.w / 2, v.y); }
      } else if (v.st === 'hit') {
        if (v.st_t > 1.0) { v.st = 'drive'; v.st_t = 0; v.side = -v.side; v.spawned = false; this.emit('honk', v.x + v.w / 2, v.y); }
      } else if (v.st === 'broken') {
        v.vx = 0;
        if (v.st_t > 1.0 && !v.freed) {
          v.freed = true;
          const k = this.add({ type: 'kitten', x: v.x + v.w / 2 - 8, y: v.y - 30, w: 16, h: 14, vy: -200, st: 'jump', kitten: this.def.rescue, keep: true, dir: v.side > 0 ? -1 : 1 });
          k.onGround = false;
        }
      }
      v.dx = v.x - ox; v.dy = 0;
    },
    kitten(e, dt) {
      if (e.st === 'jump') {
        e.vy = Math.min(e.vy + PH.gFall * dt, PH.maxFall);
        this.moveX(e, e.dir * 50 * dt);
        this.moveY(e, e.vy * dt);
        if (e.onGround) { e.vy = 0; e.st = 'sit'; this.emit('meow', e.x + 8, e.y); }
      }
    }
  };

  Game.prototype.updateCamera = function (dt) {
    const p = this.player, cam = this.cam;
    const lw = this.lv.w * T, lh = this.lv.h * T;
    if (this.scroll) {
      cam.x = this.scroll.x;
    } else {
      const look = p.face * 28;
      cam.tx = (cam.tx === undefined ? p.x + look : cam.tx + (p.x + look - cam.tx) * Math.min(1, dt * 3));
      const tx = cam.tx + p.w / 2 - C.W / 2;
      cam.x += (tx - cam.x) * Math.min(1, dt * 9);
    }
    const ground = p.onGround || p.wall || this.state !== 'play';
    if (ground || p.y + p.h > cam.ay || p.y < cam.ay - 150) cam.ay = p.y + p.h;
    const ty = cam.ay - C.H * 0.62;
    cam.y += (ty - cam.y) * Math.min(1, dt * (p.vy > 200 ? 10 : 5));
    cam.x = clamp(cam.x, 0, Math.max(0, lw - C.W));
    cam.y = clamp(cam.y, 0, Math.max(0, lh - C.H));
  };

  Game.prototype.snapCamera = function () {
    const p = this.player, cam = this.cam;
    cam.tx = p.x + p.face * 28;
    cam.ay = p.y + p.h;
    cam.x = this.scroll ? this.scroll.x : clamp(p.x + p.w / 2 - C.W / 2 + p.face * 28, 0, Math.max(0, this.lv.w * T - C.W));
    cam.y = clamp(p.y + p.h - C.H * 0.62, 0, Math.max(0, this.lv.h * T - C.H));
  };

  Object.defineProperty(Game.prototype, 'inputJumpHeld', { get() { return !!(this.lastInput && this.lastInput.jump); } });

  C.Sim = { Game, parseLevel, at, STEP, SOLID, ONEWAY };
})(globalThis.Catniss = globalThis.Catniss || {});
