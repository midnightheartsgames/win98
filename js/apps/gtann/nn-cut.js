(function (N) {
  'use strict';

  N.lineDur = t => N.clamp(1.3 + t.length * 0.058, 2.2, 7.5);

  const FRAMES = {
    cu: { d: 1.25, s: 0.42, h: 0.03, lh: -0.04, fov: 0.46 },
    mcu: { d: 1.9, s: 0.6, h: -0.02, lh: -0.13, fov: 0.58 },
    ms: { d: 3.1, s: 0.95, h: -0.22, lh: -0.36, fov: 0.7 },
    fs: { d: 5.6, s: 1.5, h: -0.45, lh: -0.72, fov: 0.8 }
  };
  const MOVE = { in: 0.22, out: 0.22, left: 1.2, right: 1.2, up: 1.4, down: 1.4, orbit: 0.45, pan: 0.3, zoom: 0.18 };

  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const flat = (dx, dz) => { const l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };

  N.cutOpts = o => {
    if (!o) return {};
    if (typeof o === 'object') return o;
    const r = {};
    for (const tok of String(o).split(' ')) {
      if (!tok) continue;
      if (tok[0] === '~') { r.via = tok.slice(1); continue; }
      const [g, to] = tok.split('>');
      if (g) r.g = g;
      if (to) r.to = to;
    }
    return r;
  };

  class Stage {
    constructor(g, run, cut) {
      this.g = g;
      this.w = g.world;
      this.m = run;
      this.cut = cut;
      this.moves = new Map();
      this.fires = [];
      this.aims = new Set();
      this.shown = new Set();
      this.lights = [];
    }

    ent(ref) {
      if (!ref) return null;
      if (typeof ref === 'object') return ref.kind ? ref : null;
      const t = ref[0] === '@' ? ref.slice(1) : ref;
      if (t === 'tyoma' || t === 'player') return this.w.player;
      const e = this.m && this.m.ents[t];
      if (e && !e.removed) return e;
      if (this.m) for (const q of Object.values(this.m.ents)) if (q && q.who === t && !q.removed) return q;
      return null;
    }

    pt(ref) {
      if (Array.isArray(ref)) { const q = this.cut.framePt(this.cut.anchor, [ref[0], ref[1], 0]); return { x: q[0], z: q[2] }; }
      if (typeof ref === 'string') {
        const e = this.ent(ref);
        if (e) return { x: e.x, z: e.z, e };
        const p = this.w.city.places[ref];
        return p ? { x: p.x, z: p.z } : null;
      }
      if (ref && ref.kind) return { x: ref.x, z: ref.z, e: ref };
      return ref || null;
    }

    look(ref) { const q = this.pt(ref); return q ? (q.e || q) : null; }

    walk(who, to, o = {}) {
      const p = this.ent(who), q = this.pt(to);
      if (!p || !q || p.dead) return this;
      const face = o.face ? this.look(o.face) : null;
      const spd = o.spd || (o.run ? 4.8 : 1.9);
      if (p.isPlayer) p.puppet = { x: q.x, z: q.z, run: !!o.run, spd, face, r: o.r };
      else {
        const inv = !!(p.ai && p.ai.invuln);
        p.ai = { mode: 'goto', x: q.x, z: q.z, run: !!o.run, spd, r: o.r || 0.4, mission: true, invuln: inv, then: { mode: 'idle', face } };
      }
      this.moves.set(p, { x: q.x, z: q.z, face, shot: this.cut ? this.cut.i : -1, keep: !!o.keep });
      return this;
    }

    settle(i) {
      for (const [p, m] of Array.from(this.moves)) {
        if (m.shot !== i || m.keep) continue;
        this.snap(p, m);
        this.moves.delete(p);
      }
    }

    snap(p, m) {
      const w = this.w;
      if (p.dead || p.removed) return;
      if (m.car) {
        if (!p.veh && !m.car.dead && !m.car.removed) {
          const drive = p.ai && p.ai.drive;
          w.seat(p, m.car, m.driver !== false && !m.car.driver);
          p.anim.board = null;
          if (drive && m.car.driver === p) m.car.ai = Object.assign({}, drive);
          p.ai = { mode: 'idle', mission: true };
        }
        return;
      }
      if (p.veh) return;
      if (Math.hypot(p.x - m.x, p.z - m.z) > 0.6) { p.x = m.x; p.z = m.z; p.y = w.city.groundY(m.x, m.z); p.vx = p.vz = 0; }
      if (m.face) p.yaw = N.yawOf(m.face.x - p.x, m.face.z - p.z);
      if (p.isPlayer) { if (p.puppet) { p.puppet.arrived = true; p.puppet.x = undefined; } }
      else if (p.ai && p.ai.mode === 'goto') p.ai = Object.assign({ mission: true, invuln: p.ai.invuln }, p.ai.then || { mode: 'idle' });
    }

    run(who, to, o) { return this.walk(who, to, Object.assign({ run: true }, o || {})); }

    face(who, target) {
      const p = this.ent(who), q = this.look(target);
      if (!p || !q || p.dead || p.veh || q === p) return this;
      if (p.isPlayer) { if (!p.puppet || p.puppet.arrived || p.puppet.x === undefined) p.puppet = { face: q }; else p.puppet.face = q; }
      else if (!p.ai || p.ai.mode !== 'goto') p.ai = Object.assign({ mission: true }, p.ai && p.ai.invuln ? { invuln: true } : {}, { mode: 'idle', face: q });
      else if (p.ai.then) p.ai.then.face = q;
      const m = this.moves.get(p);
      if (m) m.face = q;
      return this;
    }

    turn(who, yaw) { const p = this.ent(who); if (p) { p.yaw = yaw; if (p.isPlayer) p.puppet = { yaw }; } return this; }

    put(who, at, yaw) {
      const p = this.ent(who), q = this.pt(at);
      if (!p || !q) return this;
      if (p.veh) this.w.exitVehicle(p);
      p.x = q.x; p.z = q.z; p.y = this.w.city.groundY(q.x, q.z); p.vx = p.vz = 0;
      let face = null;
      if (yaw !== undefined) {
        if (typeof yaw === 'number') p.yaw = this.cut.anchor.yaw + yaw;
        else { face = this.look(yaw); if (face) p.yaw = N.yawOf(face.x - q.x, face.z - q.z); }
      }
      if (p.isPlayer) p.puppet = face ? { face } : null;
      else if (p.ai && p.ai.mode === 'goto') p.ai = Object.assign({ mission: true, invuln: p.ai.invuln }, { mode: 'idle', face });
      else if (p.ai && face) p.ai.face = face;
      this.moves.delete(p);
      return this;
    }

    gest(who, k, d) { const p = this.ent(who); if (p && p.anim && !p.dead) p.anim.gest = { k, t: 0, d: d || 0 }; return this; }

    calm(who) { const p = this.ent(who); if (p && p.anim) p.anim.gest = null; return this; }

    aim(who, target, on) {
      const p = this.ent(who);
      if (!p) return this;
      if (on === false) { this.aims.delete(p); p.anim.aim = 0; return this; }
      if (target) this.face(who, target);
      this.aims.add(p);
      return this;
    }

    blank(who, target, o = {}) {
      const p = this.ent(who);
      if (!p || p.dead || this.skipping) return this;
      this.aim(who, target);
      this.fires.push({ p, tgt: target, n: o.n || 6, rate: o.rate || 0.14, t: o.delay || 0, spread: o.spread === undefined ? 3 : o.spread, up: o.up || 0.6 });
      return this;
    }

    hide(who) { const p = this.ent(who); if (p) { p.hidden = true; this.shown.add(p); } return this; }

    show(who) { const p = this.ent(who); if (p) { p.hidden = false; this.shown.delete(p); } return this; }

    seat(who, car, driver) {
      const p = this.ent(who), v = this.ent(car);
      if (!p || !v || p.veh === v) return this;
      if (p.veh) this.w.unseat(p);
      this.w.seat(p, v, driver !== false);
      this.moves.delete(p);
      return this;
    }

    enter(who, car, o = {}) {
      const p = this.ent(who), v = this.ent(car);
      if (!p || !v || p.veh === v) return this;
      if (p.isPlayer) { this.seat(who, car, o.driver !== false); return this; }
      p.ai = { mode: 'enter', car: v, run: !!o.run, mission: true, invuln: !!(p.ai && p.ai.invuln), drive: o.drive || null };
      this.moves.set(p, { car: v, driver: o.driver, shot: this.cut ? this.cut.i : -1, keep: !!o.keep });
      return this;
    }

    exit(who) { const p = this.ent(who); if (p && p.veh) this.w.exitVehicle(p); return this; }

    drive(car, to, o = {}) {
      const v = this.ent(car);
      if (!v || v.dead) return this;
      const pts = (Array.isArray(to) && Array.isArray(to[0]) ? to : [to]).map(t => this.pt(t)).filter(Boolean);
      const path = o.road ? N.routeTo(this.w.city, [v.x, v.z], [pts[pts.length - 1].x, pts[pts.length - 1].z]) : pts.map(q => ({ x: q.x, z: q.z }));
      v.ai = { mode: 'route', path, speed: o.speed || 9, wp: 0, delay: o.delay || 0, wpR: o.r || 4 };
      v.lights = o.lights !== undefined ? o.lights : v.lights;
      return this;
    }

    park(car, at, yaw) {
      const v = this.ent(car), q = this.pt(at);
      if (!v || !q || v.dead) return this;
      v.ai = null;
      Object.assign(v, { x: q.x, z: q.z, y: this.w.city.groundY(q.x, q.z), vx: 0, vz: 0, vy: 0, wz: 0, spd: 0, pitch: 0, roll: 0 });
      if (yaw !== undefined) v.yaw = typeof yaw === 'number' ? this.cut.anchor.yaw + yaw : N.yawOf(this.pt(yaw).x - q.x, this.pt(yaw).z - q.z);
      v.ctl.thr = 0;
      v.ctl.hand = true;
      for (const p of [v.driver].concat(v.pass)) if (p) { p.x = v.x; p.z = v.z; p.yaw = v.yaw; }
      return this;
    }

    brake(car) { const v = this.ent(car); if (v) { v.ai = null; v.ctl.thr = 0; v.ctl.hand = true; } return this; }

    lamps(car, on) { const v = this.ent(car); if (v) v.lights = on !== false; return this; }

    horn(car) { const v = this.ent(car); if (v && !this.skipping) { v.horn = 0.6; this.w.emit({ t: 'horn', v }); } return this; }

    door(car, open) { const v = this.ent(car); if (v) { if (open) this.w.openDoor(v, -1); else this.w.closeDoor(v, -1); this.w.emit({ t: 'door', v, open: !!open }); } return this; }

    boom(at, r) {
      const q = this.pt(at);
      if (!q || this.skipping) return this;
      const y = this.w.city.groundY(q.x, q.z) + 0.5;
      this.w.emit({ t: 'explosion', x: q.x, y, z: q.z, r: r || 4 });
      return this;
    }

    sfx(kind, at) {
      if (this.skipping) return this;
      const q = at ? this.pt(at) : { x: this.w.player.x, z: this.w.player.z };
      if (q) this.w.emit({ t: 'sfx', k: kind, x: q.x, z: q.z });
      return this;
    }

    light(at, h, r, c) {
      const q = this.pt(at);
      if (!q) return this;
      this.lights.push({ x: q.x, y: this.w.city.groundY(q.x, q.z) + (h || 3), z: q.z, r: r || 10, c: c || [1.4, 1.2, 0.9] });
      this.g.cutLights = this.lights;
      return this;
    }

    tick(dt) {
      const w = this.w;
      for (const p of this.aims) if (!p.dead && !p.removed) { p.anim.aim = 1; p.anim.dance = 0; }
      for (let i = this.fires.length - 1; i >= 0; i--) {
        const f = this.fires[i];
        f.t -= dt;
        if (f.p.dead || f.p.removed) { this.fires.splice(i, 1); continue; }
        if (f.t > 0) continue;
        f.t = f.rate * (0.75 + Math.random() * 0.5);
        f.n--;
        const p = f.p, q = this.pt(f.tgt) || { x: p.x + Math.sin(p.yaw) * 20, z: p.z - Math.cos(p.yaw) * 20 };
        const m = w.muzzle(p);
        const tx = q.x + (Math.random() - 0.5) * f.spread, tz = q.z + (Math.random() - 0.5) * f.spread;
        const ty = w.city.groundY(tx, tz) + f.up + Math.random() * 1.4;
        const dx = tx - m.x, dy = ty - m.y, dz = tz - m.z, L = Math.hypot(dx, dy, dz) || 1;
        p.anim.action = 'shoot';
        p.anim.actionT = 0.1;
        p.anim.shot = 0;
        w.emit({ t: 'shot', w: p.weapon, x: m.x, y: m.y, z: m.z, dx: dx / L, dy: dy / L, dz: dz / L, p });
        w.emit({ t: 'tracer', x0: m.x, y0: m.y, z0: m.z, x1: tx, y1: ty, z1: tz, w: p.weapon });
        if (Math.random() < 0.45) w.emit({ t: 'spark', x: tx, y: ty, z: tz, ground: ty < w.city.groundY(tx, tz) + 0.3 });
        if (f.n <= 0) this.fires.splice(i, 1);
      }
    }

    finish() {
      const w = this.w;
      for (const [p, m] of this.moves) this.snap(p, m);
      this.moves.clear();
      for (const p of this.aims) if (!p.removed) p.anim.aim = 0;
      this.aims.clear();
      this.fires.length = 0;
      for (const p of this.shown) p.hidden = false;
      this.shown.clear();
      w.player.puppet = null;
      w.player.anim.gest = null;
      w.player.anim.speak = 0;
      this.g.cutLights = null;
    }
  }
  N.Stage = Stage;

  class Cut {
    constructor(g, step, run) {
      this.g = g;
      this.w = g.world;
      this.run = run;
      this.def = step;
      this.stage = new Stage(g, run, this);
      this.anchor = this.resolveAt(step.at || (run && run.def.marker) || 'hotel_door');
      this.shots = typeof step.shots === 'function' ? step.shots(run, this.stage) : step.shots;
      this.i = -1;
      this.t = 0;
      this.est = 1;
      this.side = step.side || 1;
      this.hidden = [];
      this.over = false;
      this.black = 0;
      this.w.truce = true;
      this.clearCrowd(step.clear === undefined ? 14 : step.clear);
      for (const tag of step.hide || []) { const e = this.stage.ent(tag); if (e) { e.hidden = true; this.hidden.push(e); } }
      if (step.cast) step.cast(this.stage, run);
      this.next();
    }

    resolveAt(at) {
      const w = this.w;
      if (typeof at === 'function') at = at(this.run, this.stage);
      if (typeof at === 'string') {
        const e = this.stage.ent(at);
        if (at[0] === '@' && e) return { x: e.x, z: e.z, yaw: e.kind === 'veh' ? e.yaw : e.yaw || 0, y: e.y };
        const p = w.city.places[at];
        if (p) return { x: p.x, z: p.z, yaw: p.yaw || 0, y: p.y };
        if (e) return { x: e.x, z: e.z, yaw: e.yaw || 0, y: e.y };
        return { x: w.player.x, z: w.player.z, yaw: w.player.yaw, y: w.player.y };
      }
      if (Array.isArray(at)) return { x: at[0], z: at[1], yaw: at[2] || 0 };
      return at;
    }

    framePt(A, q) {
      const f = q[0] || 0, r = q[1] || 0, h = q[2] || 0;
      const s = Math.sin(A.yaw), c = Math.cos(A.yaw);
      const x = A.x + f * s + r * c, z = A.z - f * c + r * s;
      const y0 = A.y !== undefined ? A.y : this.w.city.groundY(A.x, A.z);
      return [x, y0 + h, z];
    }

    clearCrowd(r) {
      if (!r) return;
      const w = this.w, A = this.anchor;
      for (const p of w.peds.slice()) if (!p.persistent && !p.isPlayer && !p.cop && !p.veh && Math.hypot(p.x - A.x, p.z - A.z) < r) w.removePed(p);
    }

    get shot() { return this.shots[this.i]; }

    next() {
      if (this.over) return;
      this.endShot();
      this.i++;
      if (this.i >= this.shots.length) { this.finish(); return; }
      const s = this.shots[this.i];
      this.t = 0;
      this.li = 0;
      this.cur = null;
      this.gap = s.pre !== undefined ? s.pre : 0.3;
      this.lastEnd = 0;
      this.lines = (typeof s.lines === 'function' ? s.lines(this.run) : s.lines) || [];
      this.est = Math.max(s.dur || 0, this.lines.reduce((a, l) => a + N.lineDur(l[1]) + 0.2, 0) + this.gap + 0.4);
      this.beats = (s.beats || []).map(b => ({ at: b[0], fn: b[1], done: false }));
      this.base = null;
      if (s.title) this.g.msg.title = { text: s.title, t: Math.max(3.2, this.est), cut: true };
      if (s.slow) this.w.slowmo = s.slow;
      if (s.side) this.side = s.side;
      this.fireBeats();
    }

    endShot() {
      const s = this.shots && this.shots[this.i];
      if (!s) return;
      const was = this.stage.skipping;
      this.stage.skipping = true;
      for (const b of this.beats || []) if (!b.done && b.at !== 'end') { b.done = true; b.fn(this.stage, this.run); }
      this.stage.skipping = was;
      for (const b of this.beats || []) if (!b.done && b.at === 'end') { b.done = true; b.fn(this.stage, this.run); }
      this.stage.settle(this.i);
      if (s.slow) this.w.slowmo = 1;
      if (this.cur && !this.cur.done) this.g.cutLine(this.cur);
      this.cur = null;
    }

    fireBeats() {
      for (const b of this.beats) {
        if (b.done) continue;
        if (typeof b.at === 'number' ? this.t >= b.at : typeof b.at === 'string' && b.at[0] === 'L' && this.li > +b.at.slice(1)) { b.done = true; b.fn(this.stage, this.run); }
      }
    }

    startLine() {
      const l = this.lines[this.li];
      const o = N.cutOpts(l[2]);
      this.cur = this.g.say(l[0], l[1], { cut: true, prio: 2, via: o.via || null });
      if (o.to) { this.stage.face(l[0], '@' + o.to); if (!o.via) this.stage.face(o.to, '@' + l[0]); }
      if (o.g) this.stage.gest(l[0], o.g, o.gd || Math.max(1.8, N.lineDur(l[1]) * 0.9));
      this.li++;
      this.fireBeats();
    }

    step(dt, inp) {
      if (this.over) return;
      const s = this.shot;
      if (!s) return;
      this.t += dt;
      this.fireBeats();
      this.stage.tick(dt);
      if (s.tick) s.tick(this.run, dt, this.stage);
      if (this.over) return;
      if (this.cur && this.cur.done) { this.cur = null; this.gap = s.gap !== undefined ? s.gap : 0.2; this.lastEnd = this.t; }
      if (!this.cur && this.li < this.lines.length) { this.gap -= dt; if (this.gap <= 0) this.startLine(); }
      if (inp && inp.skipAll && this.t > 0.2) { this.skipAll(); return; }
      if (inp && inp.skip && this.t > 0.25) {
        if (this.cur) { this.g.cutLine(this.cur); this.cur = null; this.gap = 0.12; this.lastEnd = this.t; }
        else if (this.li >= this.lines.length) { this.next(); return; }
        else this.gap = 0;
      }
      const fadeIn = s.fade === 'in' || s.fade === 'both', fadeOut = s.fade === 'out' || s.fade === 'both';
      this.black = Math.max(fadeIn ? 1 - N.clamp(this.t / 0.7, 0, 1) : 0, fadeOut ? N.clamp((this.t - this.est + 0.7) / 0.7, 0, 1) : 0);
      const done = this.li >= this.lines.length && !this.cur;
      if (done && this.t >= (s.dur || 0) && this.t >= this.lastEnd + (s.hold !== undefined ? s.hold : 0.4)) this.next();
    }

    skipAll() {
      if (this.over) return;
      this.stage.skipping = true;
      if (this.cur && !this.cur.done) this.g.cutLine(this.cur);
      this.cur = null;
      const run = (beats, i) => {
        for (const b of beats) if (!b.done) { b.done = true; b.fn(this.stage, this.run); }
        this.stage.settle(i);
      };
      if (this.shot) run(this.beats || [], this.i);
      for (let i = this.i + 1; i < this.shots.length; i++) {
        const s = this.shots[i];
        if (s.side) this.side = s.side;
        run((s.beats || []).map(b => ({ at: b[0], fn: b[1], done: false })), i);
      }
      this.i = this.shots.length;
      this.w.slowmo = 1;
      this.finish();
    }

    finish() {
      if (this.over) return;
      this.over = true;
      const s = this.shots && this.shots[this.i];
      if (s && s.slow) this.w.slowmo = 1;
      if (this.cur && !this.cur.done) this.g.cutLine(this.cur);
      this.stage.finish();
      for (const e of this.hidden) e.hidden = false;
      this.w.truce = false;
      this.black = 0;
      if (this.def.after) this.def.after(this.run, this.stage);
    }

    target(a) { return this.stage.ent(a); }

    head(p) {
      if (p.kind === 'veh') return [p.x, p.y + p.spec.shape.H * 0.75, p.z];
      const tall = (p.look && p.look.tall) || 1;
      if (p.veh) return [p.veh.x, p.veh.y + 1.12, p.veh.z];
      if (p.dead || p.state === 'down') return [p.x, p.y + 0.32, p.z];
      const gk = p.anim && p.anim.gest && p.anim.gest.k;
      const k = gk === 'kneel' || gk === 'crouch' || gk === 'duck' ? 1.18 : p.bench && p.ai && p.ai.mode === 'bench' ? 1.2 : 1.62;
      return [p.x, p.y + k * tall, p.z];
    }

    yawOf(p) { return p.kind === 'veh' ? p.yaw : p.veh ? p.veh.yaw : p.yaw || 0; }

    perp(a, b, side) {
      const [p, q] = a.id < b.id ? [a, b] : [b, a];
      const d = flat(q.x - p.x, q.z - p.z);
      return [-d[1] * side, d[0] * side];
    }

    clear(from, to) {
      const city = this.w.city, x = from[0], y = from[1], z = from[2];
      if (y < city.groundY(x, z) + 0.25) return false;
      let inside = false;
      city.hash.query(x - 0.3, z - 0.3, x + 0.3, z + 0.3, it => {
        if (it.circle || y >= it.y1 + 0.3 || y <= it.y0 - 0.5) return;
        if (it.poly ? N.pointInPoly(it.poly, x, z) || N.circlePoly(x, z, 0.3, it.poly) : x > it.x0 - 0.3 && x < it.x1 + 0.3 && z > it.z0 - 0.3 && z < it.z1 + 0.3) inside = true;
      });
      if (inside) return false;
      const dx = to[0] - x, dy = to[1] - y, dz = to[2] - z, L = Math.hypot(dx, dy, dz);
      if (L < 0.05) return true;
      const h = N.Phys.rayStatic(city, x, y, z, dx / L, dy / L, dz / L, L, this.w, true);
      if (h && h.t < L - 1.0) return false;
      for (const v of this.w.vehs) {
        if (v.removed || v.hidden || Math.abs(v.x - x) + Math.abs(v.z - z) > L + v.spec.hl + 4) continue;
        const s = Math.sin(v.yaw), c = Math.cos(v.yaw), hl = v.spec.hl + 0.3, hw = v.spec.hw + 0.3, top = v.y + v.spec.shape.H + 0.25;
        const tx = to[0] - v.x, tz = to[2] - v.z;
        if (Math.abs(tx * s - tz * c) < hl && Math.abs(tx * c + tz * s) < hw) continue;
        for (let k = 0; k <= L - 0.6; k += 0.35) {
          const px = x + dx / L * k - v.x, py = y + dy / L * k, pz = z + dz / L * k - v.z;
          if (py < top && Math.abs(px * s - pz * c) < hl && Math.abs(px * c + pz * s) < hw) return false;
        }
      }
      return true;
    }

    pick(make, sides, ks) {
      let first = null;
      for (const s of sides) for (const k of ks) {
        const c = make(s, k);
        if (!c) continue;
        if (!first) first = c;
        if (this.clear(c.from, c.to)) return c;
      }
      return first;
    }

    solve(c) {
      if (typeof c === 'function') return c(this.run, this);
      const side = c.side || this.side || 1;
      if (c.p) {
        const A = c.at ? this.resolveAt(c.at) : this.anchor;
        const make = (s, k) => {
          const p = [c.p[0], c.p[1] * s, c.p[2]], l = c.l || [0, 0, 1.5];
          const to = this.framePt(A, [l[0], l[1] * s, l[2]]);
          const from = mix(to, this.framePt(A, p), k);
          const out = { from, to, fov: c.fov || 0.9 };
          if (c.p2) { const l2 = c.l2 || l; out.to2 = this.framePt(A, [l2[0], l2[1] * s, l2[2]]); out.from2 = mix(out.to2, this.framePt(A, [c.p2[0], c.p2[1] * s, c.p2[2]]), k); out.fov2 = c.fov2 || out.fov; }
          return out;
        };
        return c.fixed ? make(1, 1) : this.pick(make, [1, -1], [1, 0.75, 0.55]);
      }
      const a = this.target(c.a), b = c.b ? this.target(c.b) : null;
      if (!a) return { from: [this.anchor.x, 30, this.anchor.z + 1], to: [this.anchor.x, 0, this.anchor.z], fov: 1 };
      const H = this.head(a);
      if (c.k in FRAMES) {
        const F = FRAMES[c.k];
        const bb = b && Math.hypot(b.x - a.x, b.z - a.z) > 0.4 ? b : null;
        const at = (s, k, extra) => {
          let dir = bb ? flat(bb.x - a.x, bb.z - a.z) : (() => { const y = this.yawOf(a); return [Math.sin(y), -Math.cos(y)]; })();
          const ang = (c.yaw || 0) + (extra || 0);
          if (ang) { const cs = Math.cos(ang), sn = Math.sin(ang); dir = [dir[0] * cs - dir[1] * sn, dir[0] * sn + dir[1] * cs]; }
          const pr = bb && !extra ? this.perp(a, bb, s) : [-dir[1] * s, dir[0] * s];
          const d = (c.d || F.d) * k, off = F.s * k;
          return {
            from: [H[0] + dir[0] * d + pr[0] * off, H[1] + F.h + (c.h || 0), H[2] + dir[1] * d + pr[1] * off],
            to: [H[0] + pr[0] * off * 0.12, H[1] + F.lh + (c.lh || 0), H[2] + pr[1] * off * 0.12],
            fov: c.fov || F.fov
          };
        };
        const best = this.pick((s, k) => at(s, k, 0), [side, -side], [1, 0.8, 0.62]);
        if (best && this.clear(best.from, best.to)) return best;
        for (const e of [0.5, -0.5, 1.0, -1.0, 1.6, -1.6]) for (const k of [1, 0.75, 0.55]) { const q = at(side, k, e); if (this.clear(q.from, q.to)) return q; }
        return best;
      }
      if (c.k === 'ots' && b) {
        const B = this.head(b);
        const make = (s, k, e) => {
          let dir = flat(H[0] - B[0], H[2] - B[2]);
          if (e) { const cs = Math.cos(e * s), sn = Math.sin(e * s); dir = [dir[0] * cs - dir[1] * sn, dir[0] * sn + dir[1] * cs]; }
          const pr = this.perp(a, b, s), back = (c.d || 0.9) * k, sh = 0.45 * Math.min(1, k + 0.2);
          return { from: [B[0] - dir[0] * back + pr[0] * sh, B[1] + 0.1 + (c.h || 0), B[2] - dir[1] * back + pr[1] * sh], to: [H[0], H[1] - 0.08 + (c.lh || 0), H[2]], fov: c.fov || 0.6 };
        };
        for (const e of [0, 0.3, -0.3]) for (const s of [side, -side]) for (const k of [1, 0.7, 0.5]) { const q = make(s, k, e); if (this.clear(q.from, q.to)) return q; }
        return this.solve(Object.assign({}, c, { k: 'mcu' }));
      }
      if (c.k === 'two' && b && Math.hypot(b.x - a.x, b.z - a.z) < 0.5) return this.solve(Object.assign({}, c, { k: 'ms', b: null }));
      if (c.k === 'two' && b) {
        const B = this.head(b);
        let sd = side;
        if (!c.side) {
          const ya = this.yawOf(a), yb = this.yawOf(b), fx = Math.sin(ya) + Math.sin(yb), fz = -Math.cos(ya) - Math.cos(yb), pr = this.perp(a, b, 1);
          sd = pr[0] * fx + pr[1] * fz >= 0 ? 1 : -1;
        }
        const make = (s, k, extra) => {
          let pr = this.perp(a, b, s);
          const ang = ((c.yaw || 0) + (extra || 0)) * s;
          if (ang) { const cs = Math.cos(ang), sn = Math.sin(ang); pr = [pr[0] * cs - pr[1] * sn, pr[0] * sn + pr[1] * cs]; }
          const L = Math.hypot(B[0] - H[0], B[2] - H[2]);
          const d = (c.d || Math.max(2.6, L * 1.3 + 1.3)) * k;
          const mx = (H[0] + B[0]) / 2, my = (H[1] + B[1]) / 2 - 0.25, mz = (H[2] + B[2]) / 2;
          return { from: [mx + pr[0] * d, my + 0.1 + (c.h || 0), mz + pr[1] * d], to: [mx, my + (c.lh || 0), mz], fov: c.fov || 0.82 };
        };
        const sees = q => this.clear(q.from, q.to) && this.clear(q.from, H) && this.clear(q.from, B);
        let near = null;
        for (const e of [0, 0.45, -0.45, 0.9, -0.9]) for (const s of [sd, -sd]) for (const k of [1, 0.8, 0.6]) {
          const q = make(s, k, e);
          if (sees(q)) return q;
          if (!near && this.clear(q.from, q.to)) near = q;
        }
        return near || this.solve(Object.assign({}, c, { k: 'ms', b }));
      }
      if (c.k === 'wide') {
        const make = (s, k) => {
          const y = this.yawOf(a) + (c.yaw || 0) * s, d = (c.d || 14) * k;
          const base = c.at ? this.resolveAt(c.at) : { x: a.x, z: a.z };
          const gy = a.y !== undefined ? a.y : this.w.city.groundY(base.x, base.z);
          return { from: [base.x + Math.sin(y) * d, gy + (c.h || 4), base.z - Math.cos(y) * d], to: [base.x, gy + (c.lh || 1.3), base.z], fov: c.fov || 0.85 };
        };
        return this.pick(make, [1, -1], [1, 0.75, 0.55]);
      }
      if (c.k === 'track') {
        const y = this.yawOf(a), s = Math.sin(y), co = Math.cos(y), o = c.o || [2.5, 1.4, 4], l = c.l || [0, 1, 0];
        const at = (q, hy) => [a.x + q[0] * co + q[2] * s, (a.y || 0) + q[1] + hy, a.z + q[0] * s - q[2] * co];
        return { from: at(o, 0), to: at(l, 0), fov: c.fov || 0.8 };
      }
      if (c.k === 'low') {
        const make = (s, k) => {
          const y = this.yawOf(a), dir = b ? flat(b.x - a.x, b.z - a.z) : [Math.sin(y), -Math.cos(y)];
          const pr = [-dir[1] * s, dir[0] * s], d = (c.d || 1.9) * k;
          return { from: [a.x + dir[0] * d + pr[0] * 0.7, a.y + (c.h || 0.45), a.z + dir[1] * d + pr[1] * 0.7], to: [H[0], H[1] + 0.05, H[2]], fov: c.fov || 0.72 };
        };
        return this.pick(make, [side, -side], [1, 0.75]);
      }
      if (c.k === 'pov' && b) { const B = this.head(b), y = this.yawOf(a); return { from: [H[0] + Math.sin(y) * 0.2, H[1] + 0.02, H[2] - Math.cos(y) * 0.2], to: [B[0], B[1] - 0.1, B[2]], fov: c.fov || 0.75 }; }
      if (c.k === 'top') return { from: [a.x + 0.4, a.y + (c.h || 14), a.z + 0.6], to: [a.x, a.y, a.z], fov: c.fov || 0.9 };
      return { from: [H[0] + 3, H[1] + 1, H[2] + 3], to: H, fov: 0.85 };
    }

    center(c) {
      const a = c.a && this.target(c.a), b = c.b && this.target(c.b);
      if (!a || c.p || c.k === 'track' || c.k === 'wide' || c.k === 'top') return null;
      const q = c.k === 'two' && b ? [(a.x + b.x) / 2, (a.z + b.z) / 2] : [a.x, a.z];
      return q;
    }

    camera() {
      const s = this.shot;
      if (!s || this.over) return null;
      const c = s.cam || { k: 'wide', a: 'tyoma' };
      if (!this.base || c.live || c.k === 'track') { this.base = this.solve(c); this.base.at = this.center(c); }
      const B = this.base;
      const k = N.smooth(0, 1, N.clamp(this.t / Math.max(0.5, this.est), 0, 1));
      let from = B.from2 ? mix(B.from, B.from2, k) : B.from.slice();
      let to = B.to2 ? mix(B.to, B.to2, k) : B.to.slice();
      const now = B.at && this.center(c);
      if (now) { const dx = now[0] - B.at[0], dz = now[1] - B.at[1]; from[0] += dx; from[2] += dz; to[0] += dx; to[2] += dz; }
      let fov = B.fov2 ? N.lerp(B.fov, B.fov2, k) : B.fov;
      const m = c.m, a = c.ma !== undefined ? c.ma : MOVE[m] || 0;
      if (m === 'in' || m === 'out') from = mix(from, to, (m === 'in' ? 1 : -1) * a * k);
      else if (m === 'left' || m === 'right') {
        const d = flat(to[0] - from[0], to[2] - from[2]), sg = (m === 'right' ? 1 : -1) * a * k;
        from = [from[0] - d[1] * sg, from[1], from[2] + d[0] * sg];
        to = [to[0] - d[1] * sg, to[1], to[2] + d[0] * sg];
      } else if (m === 'up' || m === 'down') { const sg = (m === 'up' ? 1 : -1) * a * k; from[1] += sg; to[1] += sg * 0.35; }
      else if (m === 'orbit') {
        const ang = a * k, dx = from[0] - to[0], dz = from[2] - to[2], cs = Math.cos(ang), sn = Math.sin(ang);
        from = [to[0] + dx * cs - dz * sn, from[1], to[2] + dx * sn + dz * cs];
      } else if (m === 'pan') {
        const ang = a * k, dx = to[0] - from[0], dz = to[2] - from[2], cs = Math.cos(ang), sn = Math.sin(ang);
        to = [from[0] + dx * cs - dz * sn, to[1], from[2] + dx * sn + dz * cs];
      } else if (m === 'zoom') fov *= 1 - a * k;
      if (c.hand) {
        const t = this.w.t, h = c.hand;
        from = [from[0] + Math.sin(t * 1.9) * h, from[1] + Math.sin(t * 2.7 + 1) * h * 0.6, from[2] + Math.cos(t * 1.6) * h];
        to = [to[0] + Math.sin(t * 1.3 + 2) * h * 0.8, to[1] + Math.sin(t * 2.1) * h * 0.5, to[2] + Math.cos(t * 1.1 + 1) * h * 0.8];
      }
      return { from, to, fov, interior: this.w.city.inside(from[0]) };
    }
  }
  N.Cut = Cut;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
