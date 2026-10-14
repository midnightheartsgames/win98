(function (S) {
  'use strict';
  const { W, H, clamp, RNG } = S;
  const VERBS = ['walk', 'look', 'use', 'talk'];
  S.ROOMS = S.ROOMS || {};
  S.ITEMS = S.ITEMS || {};
  S.TALK = S.TALK || {};
  S.LAYERS = S.LAYERS || {};
  const INV = { x: 2, y: 176, w: 28, h: 22 };
  const PANEL = { y: 146, h: 54, cw: 30, ch: 25, cols: 10, x0: 10 };
  const BAR = { y: 172, h: 28, cw: 30, x0: 6 };

  function inPoly(p, x, y) {
    let c = false;
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      const yi = p[i + 1], yj = p[j + 1];
      if ((yi > y) !== (yj > y) && x < (p[j] - p[i]) * (y - yi) / (yj - yi) + p[i]) c = !c;
    }
    return c;
  }

  function rectPoly(r) { return [r[0], r[1], r[0] + r[2], r[1], r[0] + r[2], r[1] + r[3], r[0], r[1] + r[3]]; }

  class Heap {
    constructor() { this.a = []; this.p = []; }
    get size() { return this.a.length; }
    push(v, pr) {
      const a = this.a, p = this.p;
      a.push(v); p.push(pr);
      let i = a.length - 1;
      while (i > 0) {
        const j = (i - 1) >> 1;
        if (p[j] <= pr) break;
        a[i] = a[j]; p[i] = p[j]; i = j;
      }
      a[i] = v; p[i] = pr;
    }
    pop() {
      const a = this.a, p = this.p;
      const top = a[0];
      const v = a.pop(), pr = p.pop();
      if (a.length) {
        let i = 0;
        for (;;) {
          let l = i * 2 + 1, r = l + 1, m = i;
          let mp = pr;
          if (l < a.length && p[l] < mp) { m = l; mp = p[l]; }
          if (r < a.length && p[r] < mp) { m = r; mp = p[r]; }
          if (m === i) break;
          a[i] = a[m]; p[i] = p[m]; i = m;
        }
        a[i] = v; p[i] = pr;
      }
      return top;
    }
  }

  class Actor {
    constructor(id, o) {
      this.id = id;
      this.costume = o.costume || id;
      this.name = o.name || id;
      this.room = o.room || null;
      this.x = o.x || 0; this.y = o.y || 0;
      this.dir = o.dir || 's';
      this.speed = o.speed || 64;
      this.stride = o.stride || 30;
      this.color = o.color || S.C.white;
      this.visible = o.visible !== false;
      this.path = null;
      this.walkPh = 0;
      this.act = ''; this.actT = 0;
      this.hypno = false; this.helmet = false; this.v = '';
      this.blinkT = 1 + Math.random() * 3; this.blink = false;
      this.talkT = 0; this.mouth = 0;
      this.follow = o.follow || null;
      this.scripted = false;
      this.scale = o.scale || null;
      this.z = o.z || 0;
      this.idleT = 2;
    }
  }

  class Game {
    constructor(o) {
      o = o || {};
      this.ep = o.ep || S;
      const scr = this.ep.SCREEN;
      this.W = scr ? scr.w : W; this.H = scr ? scr.h : H;
      this.player = this.ep.PLAYER || 'sam';
      this.buddy = this.ep.BUDDY === undefined ? 'max' : this.ep.BUDDY;
      this.seed = o.seed !== undefined ? o.seed : Math.floor(Math.random() * 1e9);
      this.rng = new RNG(this.seed);
      this.f = {};
      this.inv = [];
      this.used = {};
      this.seen = {};
      this.actors = {};
      this.roomId = null; this.room = null;
      this.camX = 0; this.camLock = null;
      this.tasks = [];
      this.speech = [];
      this.dialog = null;
      this.verb = 'walk'; this.held = null; this.invOpen = false;
      this.mx = this.W / 2; this.my = this.H / 2; this.hover = null;
      this.fade = 0; this.fadeTo = 0; this.fadeSpeed = 3;
      this.fx = { flip: 0, flipTo: 0, dream: false, dark: false, flash: 0, shake: 0, hypno: 0, tint: null };
      this.time = 0;
      this.textSpeed = 1;
      this.events = [];
      this.skipping = false;
      this.mode = 'room';
      this.drive = null;
      this.closeup = null;
      this.ended = false;
      this.grids = {};
      this.labelT = 0;
      this.hint = null;
      this.lastSay = '';
      this.log = [];
    }

    addActor(id, o) { const a = new Actor(id, o || {}); this.actors[id] = a; return a; }
    actor(id) { return this.actors[id]; }
    has(item) { return this.inv.includes(item); }
    give(item) {
      if (!this.inv.includes(item)) this.inv.push(item);
      this.sfx('pickup');
    }
    drop(item) {
      const i = this.inv.indexOf(item);
      if (i >= 0) this.inv.splice(i, 1);
      if (this.held === item) this.held = null;
    }
    swap(from, to) {
      const i = this.inv.indexOf(from);
      if (i >= 0) this.inv[i] = to; else this.inv.push(to);
      if (this.held === from) this.held = null;
    }
    sfx(id) { this.events.push({ t: 'sfx', id }); }
    music(id) { this.events.push({ t: 'music', id }); }
    count(key) { this.seen[key] = (this.seen[key] || 0) + 1; return this.seen[key]; }

    get busy() { return this.tasks.some(t => t.blocking && !(t.wait && t.wait.dialogWait)); }
    get cutscene() { return this.tasks.some(t => t.blocking && !t.walkPhase && !(t.wait && t.wait.dialogWait)); }

    run(fn, o) {
      o = o || {};
      const task = { it: null, wait: null, blocking: o.blocking !== false, name: o.name || '', walkPhase: !!o.walkPhase, dead: false };
      const it = typeof fn === 'function' ? fn.call(this, this, task) : fn;
      task.it = it;
      if (!it || typeof it.next !== 'function') return task;
      this.tasks.push(task);
      this.stepTask(task);
      return task;
    }

    stepTask(task) {
      for (let guard = 0; guard < 400; guard++) {
        if (task.dead) return;
        if (task.wait && !this.isDone(task.wait)) return;
        task.wait = null;
        let r;
        try {
          r = task.it.next();
        } catch (e) {
          task.dead = true;
          this.log.push('script error: ' + (e && e.message));
          if (typeof console !== 'undefined') console.error(e);
          return;
        }
        if (r.done) { task.dead = true; return; }
        task.wait = this.toWait(r.value);
      }
    }

    toWait(v) {
      if (v === null || v === undefined) return { frame: this.time };
      if (typeof v === 'number') return this.wait(v);
      if (Array.isArray(v)) return { all: v.map(x => this.toWait(x)) };
      if (typeof v === 'function') return { fn: v };
      return v;
    }

    isDone(w) {
      if (!w) return true;
      if (w.all) return w.all.every(x => this.isDone(x));
      if (w.fn) return !!w.fn(this);
      if (w.frame !== undefined) return this.time > w.frame;
      if (typeof w.done === 'function') return w.done(this);
      if (w.until !== undefined) return this.time >= w.until || this.skipping;
      return true;
    }

    wait(sec) { return { until: this.time + sec }; }
    until(fn) { return { fn }; }

    killTasks(pred) { for (const t of this.tasks) if (!pred || pred(t)) t.dead = true; this.tasks = this.tasks.filter(t => !t.dead); }

    textDur(text) { return (1.1 + String(text).length * 0.058) / this.textSpeed; }

    say(id, text, o) {
      o = o || {};
      const a = id ? this.actors[id] : null;
      const who = id || o.key || '*';
      for (const s of this.speech) if (s.who === who) s.cut = true;
      this.speech = this.speech.filter(s => s.who !== who);
      const sp = { who: id || o.key || '*', text: String(text), t: 0, dur: o.dur || this.textDur(text), color: o.color || (a ? a.color : S.C.white), x: o.x, y: o.y, done: g => sp.t >= sp.dur || g.skipping || sp.cut };
      this.speech.push(sp);
      this.lastSay = sp.text;
      this.log.push((id || o.key || '*') + ': ' + sp.text);
      if (this.log.length > 400) this.log.splice(0, 100);
      if (a) { a.talkT = sp.dur; }
      return sp;
    }

    *says(list) {
      for (const [id, text] of list) yield this.say(id, text);
    }

    grid() {
      const room = this.room;
      if (!room) return null;
      const walk = typeof room.walk === 'function' ? room.walk(this) : room.walk;
      const block = (typeof room.block === 'function' ? room.block(this) : room.block) || [];
      const key = this.roomId + '|' + JSON.stringify(walk) + '|' + JSON.stringify(block);
      if (this.grids[key]) return this.grids[key];
      const cs = 2, gw = Math.ceil(room.w / cs), gh = Math.ceil(this.H / cs);
      const m = new Uint8Array(gw * gh);
      for (let cy = 0; cy < gh; cy++) for (let cx = 0; cx < gw; cx++) {
        const px = cx * cs + 1, py = cy * cs + 1;
        let ok = false;
        for (const p of walk) if (inPoly(p, px, py)) { ok = true; break; }
        if (ok) for (const p of block) if (inPoly(p, px, py)) { ok = false; break; }
        m[cy * gw + cx] = ok ? 1 : 0;
      }
      const g = { cs, gw, gh, m };
      this.grids[key] = g;
      return g;
    }

    walkable(x, y) {
      const g = this.grid();
      if (!g) return false;
      const cx = Math.floor(x / g.cs), cy = Math.floor(y / g.cs);
      return cx >= 0 && cy >= 0 && cx < g.gw && cy < g.gh && g.m[cy * g.gw + cx] === 1;
    }

    nearestCell(g, x, y) {
      let cx = clamp(Math.floor(x / g.cs), 0, g.gw - 1), cy = clamp(Math.floor(y / g.cs), 0, g.gh - 1);
      if (g.m[cy * g.gw + cx]) return [cx, cy];
      let best = null, bd = Infinity;
      for (let r = 1; r < Math.max(g.gw, g.gh); r++) {
        for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= g.gw || ny >= g.gh || !g.m[ny * g.gw + nx]) continue;
          const d = dx * dx + dy * dy * 2.2;
          if (d < bd) { bd = d; best = [nx, ny]; }
        }
        if (best && r * r > bd) break;
      }
      return best;
    }

    snap(x, y) {
      const g = this.grid();
      const c = g && this.nearestCell(g, x, y);
      if (!c) return [x, y];
      if (g.m[Math.floor(y / g.cs) * g.gw + Math.floor(x / g.cs)] && Math.floor(x / g.cs) === c[0] && Math.floor(y / g.cs) === c[1]) return [x, y];
      return [c[0] * g.cs + 1, c[1] * g.cs + 1];
    }

    los(g, x0, y0, x1, y1) {
      const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
      for (let i = 0; i <= n; i++) {
        const t = n ? i / n : 0;
        const cx = Math.floor((x0 + (x1 - x0) * t) / g.cs), cy = Math.floor((y0 + (y1 - y0) * t) / g.cs);
        if (cx < 0 || cy < 0 || cx >= g.gw || cy >= g.gh || !g.m[cy * g.gw + cx]) return false;
      }
      return true;
    }

    findPath(x0, y0, x1, y1) {
      const g = this.grid();
      if (!g) return [[x1, y1]];
      const s = this.nearestCell(g, x0, y0), e = this.nearestCell(g, x1, y1);
      if (!s || !e) return null;
      const ex = e[0] * g.cs + 1, ey = e[1] * g.cs + 1;
      const inE = g.m[Math.floor(y1 / g.cs) * g.gw + Math.floor(x1 / g.cs)] && Math.floor(x1 / g.cs) === e[0] && Math.floor(y1 / g.cs) === e[1];
      const tx = inE ? x1 : ex, ty = inE ? y1 : ey;
      const sx0 = g.m[Math.floor(y0 / g.cs) * g.gw + Math.floor(x0 / g.cs)] ? x0 : s[0] * g.cs + 1;
      const sy0 = g.m[Math.floor(y0 / g.cs) * g.gw + Math.floor(x0 / g.cs)] ? y0 : s[1] * g.cs + 1;
      if (this.los(g, sx0, sy0, tx, ty)) return [[tx, ty]];
      const N = g.gw * g.gh;
      const cost = new Float32Array(N).fill(Infinity);
      const from = new Int32Array(N).fill(-1);
      const si = s[1] * g.gw + s[0], ei = e[1] * g.gw + e[0];
      const heap = new Heap();
      cost[si] = 0; heap.push(si, 0);
      const DX = [1, -1, 0, 0, 1, 1, -1, -1], DY = [0, 0, 1, -1, 1, -1, 1, -1];
      const DC = [1, 1, 1.6, 1.6, 1.5, 1.5, 1.5, 1.5];
      let found = false;
      while (heap.size) {
        const i = heap.pop();
        if (i === ei) { found = true; break; }
        const cx = i % g.gw, cy = (i / g.gw) | 0;
        for (let k = 0; k < 8; k++) {
          const nx = cx + DX[k], ny = cy + DY[k];
          if (nx < 0 || ny < 0 || nx >= g.gw || ny >= g.gh) continue;
          const j = ny * g.gw + nx;
          if (!g.m[j]) continue;
          if (k >= 4 && (!g.m[cy * g.gw + nx] || !g.m[ny * g.gw + cx])) continue;
          const nc = cost[i] + DC[k];
          if (nc < cost[j]) {
            cost[j] = nc; from[j] = i;
            const hx = Math.abs(nx - e[0]), hy = Math.abs(ny - e[1]);
            heap.push(j, nc + Math.max(hx, hy * 1.6));
          }
        }
      }
      if (!found) return null;
      const cells = [];
      for (let i = ei; i !== -1; i = from[i]) cells.push(i);
      cells.reverse();
      const pts = cells.map(i => [(i % g.gw) * g.cs + 1, ((i / g.gw) | 0) * g.cs + 1]);
      pts[pts.length - 1] = [tx, ty];
      const out = [];
      let cur = [sx0, sy0], k = 0;
      while (k < pts.length) {
        let far = k;
        for (let j = pts.length - 1; j > k; j--) if (this.los(g, cur[0], cur[1], pts[j][0], pts[j][1])) { far = j; break; }
        out.push(pts[far]);
        cur = pts[far];
        k = far + 1;
      }
      return out;
    }

    scaleAt(y) {
      const sc = this.room && this.room.scale;
      if (!sc) return 1;
      const t = clamp((y - sc[0]) / (sc[2] - sc[0]), 0, 1);
      return sc[1] + (sc[3] - sc[1]) * t;
    }

    actorScale(a) { return a.scale || this.scaleAt(a.y); }

    walkTo(id, x, y, o) {
      const a = this.actors[id];
      if (!a) return { done: () => true };
      o = o || {};
      if (a.room !== this.roomId || this.skipping || o.teleport) {
        const p = a.room === this.roomId && !o.free ? this.snap(x, y) : [x, y];
        a.x = p[0]; a.y = p[1]; a.path = null;
        return { done: () => true };
      }
      const path = o.free ? [[x, y]] : this.findPath(a.x, a.y, x, y);
      a.path = path && path.length ? path : null;
      a.speedMul = o.speed || (a.hypno && id === this.player ? 0.75 : 1);
      return { done: () => !a.path, actor: a };
    }

    face(id, dir) {
      const a = this.actors[id];
      if (a && dir) a.dir = dir;
    }

    faceTo(id, x) {
      const a = this.actors[id];
      if (a) a.dir = x < a.x ? 'w' : 'e';
    }

    anim(id, act, dur) {
      const a = this.actors[id];
      if (!a) return { done: () => true };
      a.act = act; a.actT = dur || 0;
      return { until: this.time + (dur || 0) };
    }

    place(id, room, x, y, dir) {
      const a = this.actors[id];
      if (!a) return;
      a.room = room; a.x = x; a.y = y; a.path = null;
      if (dir) a.dir = dir;
    }

    fadeOut(sp) { this.fadeTo = 1; this.fadeSpeed = sp || 3; return { fn: g => g.fade >= 1 || g.skipping }; }
    fadeIn(sp) { this.fadeTo = 0; this.fadeSpeed = sp || 3; return { fn: g => g.fade <= 0 || g.skipping }; }

    setRoom(id, pos) {
      const room = this.ep.ROOMS[id];
      if (!room) throw new Error('no room ' + id);
      if (this.room && this.room.leave) this.room.leave(this);
      this.killTasks(t => t.ambient);
      this.roomId = id; this.room = room;
      for (const s of this.speech) s.cut = true;
      this.speech = [];
      this.hover = null;
      this.invOpen = false;
      this.closeup = null;
      const sam = this.actors[this.player];
      if (pos && sam) this.place(this.player, id, pos.x, pos.y, pos.dir);
      const max = this.buddy ? this.actors[this.buddy] : null;
      if (max && max.follow && sam && sam.room === id && !this.f.maxAway) {
        const off = sam.dir === 'w' ? 18 : -18;
        const p = this.snap(sam.x + off, sam.y + 3);
        this.place(this.buddy, id, p[0], p[1], sam.dir);
      }
      this.camLock = null;
      this.centerCam(true);
      if (room.music) this.music(typeof room.music === 'function' ? room.music(this) : room.music);
      if (room.setup) room.setup(this);
      if (room.ambient) {
        const t = this.run(room.ambient, { blocking: false });
        t.ambient = true;
      }
      this.fx.dream = !!room.dream;
    }

    *goRoom(id, pos, o) {
      o = o || {};
      yield this.fadeOut(o.fade || 4);
      this.setRoom(id, pos);
      if (this.ep.ROOMS[id].enter) {
        const it = this.ep.ROOMS[id].enter(this, o.from);
        if (it && typeof it.next === 'function') {
          yield this.fadeIn(o.fade || 4);
          yield* it;
          return;
        }
      }
      yield this.fadeIn(o.fade || 4);
    }

    centerCam(now) {
      const room = this.room;
      if (!room) return;
      const W = this.W;
      if (room.w <= W) { this.camX = 0; return; }
      const sam = this.actors[this.player];
      let target = this.camLock !== null ? this.camLock : (sam && sam.room === this.roomId ? sam.x - W / 2 : this.camX);
      target = clamp(target, 0, room.w - W);
      if (now) this.camX = target;
      else this.camX += (target - this.camX) * Math.min(1, 0.12);
      if (Math.abs(target - this.camX) < 0.5) this.camX = target;
    }

    panTo(x) {
      this.camLock = x;
      return { fn: g => Math.abs(g.camX - clamp(x, 0, g.room.w - g.W)) < 1 || g.skipping };
    }

    update(dt) {
      dt = Math.min(dt, 0.1);
      this.time += dt;
      if (this.fade < this.fadeTo) this.fade = Math.min(this.fadeTo, this.fade + dt * this.fadeSpeed);
      else if (this.fade > this.fadeTo) this.fade = Math.max(this.fadeTo, this.fade - dt * this.fadeSpeed);
      if (this.skipping) { this.fade = this.fadeTo; }
      if (this.fx.flash > 0) this.fx.flash = Math.max(0, this.fx.flash - dt * 3);
      if (this.fx.shake > 0) this.fx.shake = Math.max(0, this.fx.shake - dt * 2);
      if (this.fx.flip !== this.fx.flipTo) this.fx.flip = S.approach(this.fx.flip, this.fx.flipTo, dt * 1.5);
      if (this.mode !== 'room' && this.drive && this.drive.update) this.drive.update(dt);
      for (const sp of this.speech) sp.t += dt;
      this.speech = this.speech.filter(sp => !(sp.t >= sp.dur || sp.cut || (this.skipping && sp.t > 0)));
      for (const id in this.actors) this.updateActor(this.actors[id], dt);
      const tasks = this.tasks.slice();
      for (const t of tasks) this.stepTask(t);
      this.tasks = this.tasks.filter(t => !t.dead);
      if (this.room && this.room.update) this.room.update(this, dt);
      this.centerCam(false);
      if (this.skipping && !this.cutscene) this.skipping = false;
      if (this.dialog && !this.busy && this.dialog.pending) this.dialog.pending = false;
      if (this.dialog && this.mode === 'room') this.pointer(this.mx, this.my);
    }

    updateActor(a, dt) {
      if (a.actT > 0) { a.actT -= dt; if (a.actT <= 0) { a.actT = 0; a.act = a.keepAct ? a.act : ''; } }
      a.blinkT -= dt;
      if (a.blinkT <= 0) { a.blink = !a.blink; a.blinkT = a.blink ? 0.12 : 2 + Math.random() * 3.5; }
      if (a.talkT > 0) {
        a.talkT -= dt;
        const sp = this.speech.find(s => s.who === a.id);
        if (!sp) a.talkT = 0;
        a.mouth = a.talkT > 0 ? (Math.floor(this.time * 9 + a.x) % 3 !== 0 ? 1 : 0) : 0;
      } else a.mouth = 0;
      if (a.path && this.skipping) {
        const last = a.path[a.path.length - 1];
        a.x = last[0]; a.y = last[1]; a.path = null;
      }
      if (a.path) {
        const target = a.path[0];
        const dx = target[0] - a.x, dy = target[1] - a.y;
        const d = Math.hypot(dx, dy);
        const sc = a.room === this.roomId ? this.actorScale(a) : 1;
        const ang = Math.atan2(dy, dx);
        const sp = a.speed * sc * (a.speedMul || 1) * Math.sqrt(Math.cos(ang) ** 2 + (0.62 * Math.sin(ang)) ** 2);
        const step = sp * dt;
        if (Math.abs(dx) > Math.abs(dy) * 1.1) a.dir = dx < 0 ? 'w' : 'e';
        else if (d > 0.5) a.dir = dy < 0 ? 'n' : 's';
        if (d <= step || d < 0.01) {
          a.x = target[0]; a.y = target[1];
          a.path.shift();
          if (!a.path.length) a.path = null;
        } else {
          a.x += dx / d * step; a.y += dy / d * step;
        }
        a.walkPh = (a.walkPh + step / (a.stride * sc)) % 1;
      }
      if (a.follow && !a.scripted && a.room === this.roomId) this.followLogic(a, dt);
    }

    followLogic(a, dt) {
      const lead = this.actors[a.follow];
      if (!lead || lead.room !== a.room || this.f.maxAway) return;
      const d = Math.hypot(lead.x - a.x, (lead.y - a.y) * 1.6);
      a.idleT -= dt;
      if (lead.path || d > 46) {
        if (a.idleT <= 0 || !a.path) {
          a.idleT = 0.35;
          if (d > 30) {
            const back = lead.dir === 'w' ? 20 : lead.dir === 'e' ? -20 : (a.x < lead.x ? -20 : 20);
            const p = this.snap(lead.x + back, lead.y + (lead.dir === 'n' ? 6 : lead.dir === 's' ? -4 : 3));
            const path = this.findPath(a.x, a.y, p[0], p[1]);
            a.path = path && path.length ? path : null;
            a.speedMul = d > 70 ? 1.35 : 1.05;
          }
        }
      } else if (!a.path) {
        const side = lead.dir === 'w' ? 1 : lead.dir === 'e' ? -1 : 0;
        if (side && (a.x - lead.x) * side < 6 && a.idleT <= 0) {
          a.idleT = 0.6;
          const p = this.snap(lead.x + side * 22, lead.y + 3);
          if (Math.abs(p[0] - a.x) > 6) {
            const path = this.findPath(a.x, a.y, p[0], p[1]);
            a.path = path && path.length ? path : null;
            a.speedMul = 1.1;
            return;
          }
        }
        if (Math.abs(lead.x - a.x) > 2) a.dir = lead.x < a.x ? 'w' : 'e';
        if (a.idleT <= 0) {
          a.idleT = 3 + Math.random() * 4;
          if (Math.random() < 0.35 && !a.act) { a.act = 'grin'; a.actT = 0.8; }
        }
      }
    }

    hotspots() {
      const room = this.room;
      if (!room) return [];
      const list = [];
      for (const h of room.hot || []) {
        if (h.when && !h.when(this)) continue;
        list.push(h);
      }
      return list;
    }

    hotName(h) { return typeof h.name === 'function' ? h.name(this) : h.name; }

    actorHot(a) {
      const room = this.room;
      if (!room) return null;
      const h = (room.actors && room.actors[a.id]) || (this.ep.ACTOR_HOT && this.ep.ACTOR_HOT[a.id]);
      if (!h) return null;
      if (h.when && !h.when(this)) return null;
      return h;
    }

    spriteFor(a) {
      const sc = this.actorScale(a);
      const pose = this.poseOf(a);
      return { spr: S.sprite(a.costume, pose, sc), sc, pose };
    }

    poseOf(a) {
      return { dir: a.dir, walk: a.path ? a.walkPh : -1, talk: a.mouth, act: a.act, blink: a.blink, hypno: a.hypno, helmet: a.helmet, v: a.v, t: this.time, upside: a.upside };
    }

    saveSpot() {
      const s = this.actors[this.player];
      return { x: s.x, y: s.y, dir: s.dir };
    }

    visibleActors() {
      return Object.values(this.actors).filter(a => a.room === this.roomId && a.visible);
    }

    hitActor(wx, wy) {
      const list = this.visibleActors().sort((p, q) => (q.y + q.z) - (p.y + p.z));
      for (const a of list) {
        const h = this.actorHot(a);
        if (!h) continue;
        const { spr } = this.spriteFor(a);
        if (!spr) continue;
        const sx = Math.round(wx - (a.x - spr.ox)), sy = Math.round(wy - (a.y - spr.oy));
        if (sx < 0 || sy < 0 || sx >= spr.buf.w || sy >= spr.buf.h) continue;
        if (spr.buf.px[sy * spr.buf.w + sx] || (h.pad && Math.abs(wx - a.x) < h.pad)) return { a, h };
      }
      return null;
    }

    hotArea(h) {
      const p = h.poly || rectPoly(h.rect);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (let i = 0; i < p.length; i += 2) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); }
      return (x1 - x0) * (y1 - y0);
    }

    hitHot(wx, wy) {
      let best = null, bestArea = Infinity;
      for (const h of this.hotspots()) {
        if (!inPoly(h.poly || rectPoly(h.rect), wx, wy)) continue;
        const a = this.hotArea(h);
        if (a <= bestArea) { best = h; bestArea = a; }
      }
      return best;
    }

    pick(x, y) {
      if (!this.room) return null;
      const wx = x + this.camX, wy = this.fx.flip > 0.5 ? this.H - 1 - y : y;
      const ha = this.hitActor(wx, wy);
      const hh = this.hitHot(wx, wy);
      if (ha && (!hh || !hh.over)) return { kind: 'actor', id: ha.a.id, h: ha.h, a: ha.a };
      if (hh) return { kind: 'hot', id: hh.id, h: hh };
      return null;
    }

    inBox(x, y, r) { return x >= r.x && y >= r.y && x < r.x + r.w && y < r.y + r.h; }

    boxHit(x, y) { return this.inBox(x, y, INV); }

    invSlot(x, y) {
      if (!this.invOpen || y < PANEL.y) return -1;
      const col = Math.floor((x - PANEL.x0) / PANEL.cw), row = Math.floor((y - PANEL.y - 3) / PANEL.ch);
      if (col < 0 || col >= PANEL.cols || row < 0 || row > 1) return -1;
      const i = row * PANEL.cols + col;
      return i < this.inv.length ? i : -1;
    }

    dialogOptions() {
      if (!this.dialog) return [];
      const conv = this.ep.TALK[this.dialog.id];
      const list = typeof conv.options === 'function' ? conv.options(this, this.dialog) : conv.options;
      return list.filter(o => (!o.when || o.when(this, this.dialog)) && !(o.once && this.used[this.dialog.id + '.' + o.id]));
    }

    dialogSlot(x, y) {
      if (!this.dialog || this.busy || y < BAR.y) return -1;
      const opts = this.dialogOptions();
      const x0 = Math.max(BAR.x0, Math.floor((this.W - opts.length * BAR.cw) / 2));
      const i = Math.floor((x - x0) / BAR.cw);
      return i >= 0 && i < opts.length ? i : -1;
    }

    pointer(x, y) {
      this.mx = x; this.my = y;
      this.hover = null;
      if (this.mode !== 'room') { if (this.drive && this.drive.pointer) this.drive.pointer(x, y); return; }
      if (this.dialog) {
        const i = this.dialogSlot(x, y);
        if (i >= 0) this.hover = { kind: 'opt', i, opt: this.dialogOptions()[i] };
        return;
      }
      if (this.cutscene) return;
      if (this.invOpen) {
        const i = this.invSlot(x, y);
        if (i >= 0) this.hover = { kind: 'inv', id: this.inv[i] };
        return;
      }
      if (this.boxHit(x, y)) { this.hover = { kind: 'box' }; return; }
      const p = this.pick(x, y);
      if (p) this.hover = p;
    }

    hoverLabel() {
      const h = this.hover;
      if (!h) return '';
      if (h.kind === 'inv') {
        const nm = this.itemName(h.id);
        if (this.held && this.held !== h.id) return this.itemName(this.held) + ' → ' + nm;
        return nm;
      }
      if (h.kind === 'box') return 'Коробка Сэма';
      if (h.kind === 'opt') return '';
      const nm = h.kind === 'actor' ? (h.h.name ? (typeof h.h.name === 'function' ? h.h.name(this) : h.h.name) : h.a.name) : this.hotName(h.h);
      if (this.held) return this.itemName(this.held) + ' → ' + nm;
      return nm;
    }

    itemName(id) { const it = this.ep.ITEMS[id]; return it ? (typeof it.name === 'function' ? it.name(this) : it.name) : id; }

    itemIcon(id) {
      const it = this.ep.ITEMS[id];
      if (!it || !it.icon) return id;
      return typeof it.icon === 'function' ? it.icon(this) : it.icon;
    }

    cycleVerb(dir) {
      if (this.held) { this.held = null; return; }
      const i = VERBS.indexOf(this.verb);
      this.verb = VERBS[(i + (dir || 1) + VERBS.length) % VERBS.length];
    }

    skipLine() {
      let any = false;
      for (const sp of this.speech) if (sp.t > 0.25) { sp.cut = true; any = true; }
      return any;
    }

    skip() {
      if (this.cutscene && !this.dialog) { this.skipping = true; this.speech = []; }
    }

    click(x, y, btn) {
      this.pointer(x, y);
      if (this.mode !== 'room') { if (this.drive && this.drive.click) this.drive.click(x, y, btn); return; }
      if (this.dialog) {
        if (this.busy) { this.skipLine(); return; }
        const i = this.dialogSlot(x, y);
        if (i >= 0) this.choose(this.dialogOptions()[i].id);
        return;
      }
      if (this.cutscene) { this.skipLine(); return; }
      if (btn === 2) {
        if (this.invOpen && this.invSlot(x, y) < 0 && this.held) { this.held = null; return; }
        this.cycleVerb(1);
        return;
      }
      if (this.speech.length) this.skipLine();
      if (this.invOpen) {
        const i = this.invSlot(x, y);
        if (i >= 0) {
          const id = this.inv[i];
          if (this.held && this.held !== id) { this.invOpen = false; this.perform('use', { kind: 'item', id }, this.held); this.held = null; return; }
          if (this.verb === 'look') { this.perform('look', { kind: 'item', id }); return; }
          if (this.verb === 'talk' && id === this.buddy) { this.invOpen = false; this.perform('talk', { kind: 'actor', id: this.buddy }); return; }
          this.held = this.held === id ? null : id;
          if (this.held) this.invOpen = false;
          return;
        }
        this.invOpen = false;
        if (this.boxHit(x, y) || y >= PANEL.y) return;
      }
      if (this.boxHit(x, y)) { this.invOpen = true; return; }
      const p = this.pick(x, y);
      if (this.held) {
        if (p) { const it = this.held; this.held = null; this.perform('use', p, it); }
        else this.held = null;
        return;
      }
      if (p && (this.verb !== 'walk' || p.h.exit || p.h.walkUse)) {
        this.perform(this.verb === 'walk' ? (p.h.exit ? 'exit' : 'use') : this.verb, p);
        return;
      }
      if (p && this.verb === 'walk' && p.h.walk && !p.h.exit) {
        const w = typeof p.h.walk === 'function' ? p.h.walk(this) : p.h.walk;
        if (w) this.walkPlayer(w[0], w[1]);
        return;
      }
      this.walkPlayer(x + this.camX, this.fx.flip > 0.5 ? this.H - 1 - y : y);
    }

    walkPlayer(x, y) {
      if (this.f.frozen) return;
      this.killTasks(t => t.walkPhase);
      const self = this;
      this.run(function* () { yield self.walkTo(self.player, x, y); }, { blocking: false, name: 'walk' });
    }

    targetInfo(p) {
      if (p.kind === 'item') return { h: this.ep.ITEMS[p.id] || {}, key: 'item.' + p.id, walk: null };
      const h = p.h || (p.kind === 'actor' ? this.actorHot(this.actors[p.id]) : null) || {};
      let w = typeof h.walk === 'function' ? h.walk(this) : h.walk;
      if (p.kind === 'actor' && w === undefined) {
        const a = this.actors[p.id];
        const side = this.actors[this.player].x < a.x ? -1 : 1;
        w = [a.x + side * (h.dist || 26), a.y + 1];
      }
      return { h, key: this.roomId + '.' + p.id, walk: w };
    }

    perform(verb, p, item) {
      if (this.busy || this.dialog) return false;
      if (typeof p === 'string') {
        const h = this.hotspots().find(q => q.id === p);
        const a = this.actors[p];
        if (h) p = { kind: 'hot', id: p, h };
        else if (a && a.room === this.roomId && this.actorHot(a)) p = { kind: 'actor', id: p, h: this.actorHot(a), a };
        else if (this.has(p)) p = { kind: 'item', id: p };
        else return false;
      }
      this.killTasks(t => t.walkPhase || t.name === 'walk');
      this.invOpen = false;
      const info = this.targetInfo(p);
      const self = this;
      const face = info.h.face;
      const walk = info.walk;
      this.run(function* (g, task) {
        if (walk && !(item && info.h.noWalkItem)) {
          yield self.walkTo(self.player, walk[0], walk[1]);
        }
        task.walkPhase = false;
        if (face) self.face(self.player, face);
        else if (p.kind === 'actor') self.faceTo(self.player, p.a ? p.a.x : self.actors[p.id].x);
        else if (p.kind === 'hot' && info.h.rect) { const cx = info.h.rect[0] + info.h.rect[2] / 2; if (Math.abs(cx - self.actors[self.player].x) > 8) self.faceTo(self.player, cx); }
        yield* self.dispatch(verb, p, info, item);
      }, { blocking: true, walkPhase: !!walk, name: 'act' });
      return true;
    }

    *dispatch(verb, p, info, item) {
      const h = info.h;
      let handler;
      if (item) {
        const it = this.ep.ITEMS[item] || {};
        if (p.kind === 'item') {
          const other = this.ep.ITEMS[p.id] || {};
          handler = (it.on && it.on[p.id]) || (other.on && other.on[item]) || (it.on && it.on['*']);
        } else handler = (h.items && (h.items[item] || h.items['*'])) || (it.on && it.on[p.id]);
        if (!handler) handler = this.genericItem(item, p);
      } else {
        if (verb === 'exit') handler = h.exit;
        else handler = h[verb];
        if (!handler && verb === 'use' && h.exit) handler = h.exit;
        if (!handler && verb === 'talk' && h.talkTo) handler = h.talkTo;
        if (!handler) handler = this.generic(verb, p);
      }
      yield* this.exec(handler, info.key + '.' + (item || verb));
    }

    *exec(handler, key) {
      if (handler === undefined || handler === null) return;
      if (typeof handler === 'string') { yield this.say(this.speaker(), handler); return; }
      if (Array.isArray(handler)) {
        const n = this.count(key) - 1;
        const line = handler[Math.min(n, handler.length - 1)];
        yield* this.exec(line, key + '#');
        return;
      }
      if (typeof handler === 'function') {
        const r = handler.call(this, this);
        if (r && typeof r.next === 'function') { yield* r; return; }
        if (typeof r === 'string' || Array.isArray(r)) yield* this.exec(r, key);
        return;
      }
      if (handler.room) { yield* this.goRoom(handler.room, handler, { from: this.roomId }); return; }
    }

    speaker() { return this.player; }

    generic(verb, p) {
      const G = this.ep.GENERIC || {};
      const list = (this.f.samHypno ? G.hypno : G[verb]) || ['Хм.'];
      return list[this.rng.int(list.length)];
    }

    genericItem(item, p) {
      const G = this.ep.GENERIC || {};
      if (this.f.samHypno) return (G.hypno || ['Хм.'])[this.rng.int((G.hypno || [1]).length)];
      const list = (G.items && G.items[item]) || G.useItem || ['Не думаю, что это сработает.'];
      return list[this.rng.int(list.length)];
    }

    talkTo(id) {
      const conv = this.ep.TALK[id];
      if (!conv) return { done: () => true };
      const self = this;
      const d = { id, stage: null, data: {} };
      this.dialog = d;
      if (conv.start) {
        this.run(function* () { yield* self.exec(conv.start, 'talk.' + id + '.start'); }, { blocking: true, name: 'dlg' });
      }
      return { fn: g => g.dialog !== d, dialogWait: true };
    }

    *converse(id) {
      yield this.talkTo(id);
    }

    endDialog() {
      const d = this.dialog;
      this.dialog = null;
      return d;
    }

    choose(optId) {
      if (!this.dialog || this.busy) return false;
      const d = this.dialog;
      const conv = this.ep.TALK[d.id];
      const opt = this.dialogOptions().find(o => o.id === optId);
      if (!opt) return false;
      this.used[d.id + '.' + opt.id] = (this.used[d.id + '.' + opt.id] || 0) + 1;
      const self = this;
      this.run(function* () {
        if (opt.say !== false && opt.text) yield self.say(opt.speaker || self.player, typeof opt.line === 'string' ? opt.line : opt.text);
        if (opt.run) yield* self.exec(opt.run, 'opt.' + d.id + '.' + opt.id);
        if (opt.end && self.dialog === d) {
          if (conv.end) yield* self.exec(conv.end, 'talk.' + d.id + '.end');
          if (self.dialog === d) self.dialog = null;
        }
      }, { blocking: true, name: 'dlg' });
      return true;
    }

    optionIds() { return this.dialogOptions().map(o => o.id); }

    saveState() {
      const actors = {};
      for (const [id, a] of Object.entries(this.actors)) {
        actors[id] = { room: a.room, x: Math.round(a.x * 10) / 10, y: Math.round(a.y * 10) / 10, dir: a.dir, visible: a.visible, hypno: a.hypno, helmet: a.helmet, v: a.v, act: a.keepAct ? a.act : '', keepAct: !!a.keepAct, follow: a.follow };
      }
      return { v: 1, seed: this.seed, room: this.roomId, f: JSON.parse(JSON.stringify(this.f)), inv: this.inv.slice(), used: Object.assign({}, this.used), seen: Object.assign({}, this.seen), actors, textSpeed: this.textSpeed, rngS: this.rng.s };
    }

    loadState(s) {
      this.seed = s.seed;
      this.rng = new RNG(s.rngS || s.seed);
      this.f = JSON.parse(JSON.stringify(s.f || {}));
      this.inv = (s.inv || []).slice();
      this.used = Object.assign({}, s.used || {});
      this.seen = Object.assign({}, s.seen || {});
      this.tasks = []; this.speech = []; this.dialog = null; this.held = null; this.invOpen = false;
      this.mode = 'room'; this.drive = null; this.skipping = false;
      for (const [id, st] of Object.entries(s.actors || {})) {
        const a = this.actors[id];
        if (!a) continue;
        Object.assign(a, { room: st.room, x: st.x, y: st.y, dir: st.dir, visible: st.visible, hypno: st.hypno, helmet: st.helmet, v: st.v || '', act: st.act || '', keepAct: !!st.keepAct, follow: st.follow || null, path: null, scripted: false });
      }
      this.fx = { flip: 0, flipTo: 0, dream: false, dark: false, flash: 0, shake: 0, hypno: 0, tint: null };
      this.fade = 1; this.fadeTo = 0;
      this.setRoom(s.room);
      if (this.ep.afterLoad) this.ep.afterLoad(this);
    }

    canSave() {
      const r = this.room;
      const blocked = r && (typeof r.noSave === 'function' ? r.noSave(this) : r.noSave);
      return this.mode === 'room' && !this.busy && !this.dialog && !this.ended && !blocked;
    }
  }

  Object.assign(S, { Game, Actor, VERBS, INV, PANEL, BAR, inPoly, rectPoly });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.SamMax = globalThis.SamMax || {});
