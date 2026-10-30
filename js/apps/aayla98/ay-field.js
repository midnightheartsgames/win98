(function (A) {
  'use strict';
  const M = A.Maps, T = M.T, TS = M.TILE;
  const SPEED = { run: 100, walk: 60, sneak: 35 };
  const SENSE = { radius: 96, cool: 6, show: 5 };
  const SIGHT = { range: 80, half: Math.PI / 4 };
  const SENSE_NEAR = 40;
  const HEAR = { run: 48, walk: 24, sneak: 0 };
  const FORCE_RANGE = 5, PATROL = 30, CHASE = 70, CONTACT = 12, CALM = 3, CRATE = 160, JUMP_TIME = 0.6, DRIFT = 0.55, SHELTER = 24;
  const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const MOBILE = new Set(['enemy', 'watch']);
  const ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  const COMPASS = { E: 'right', W: 'left', N: 'up', S: 'down' };
  A.FIELD = { SPEED, SENSE, SIGHT, HEAR, FORCE_RANGE, PATROL, CHASE, CONTACT, CALM, DIRV, DRIFT, SHELTER };

  const angDiff = (a, b) => {
    let d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d);
  };
  const dirOfAngle = a => {
    const d = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (d < Math.PI / 4 || d >= Math.PI * 7 / 4) return 'right';
    if (d < Math.PI * 3 / 4) return 'down';
    if (d < Math.PI * 5 / 4) return 'left';
    return 'up';
  };

  A.Field = class {
    constructor(S, mapId, entry, at) {
      this.S = S;
      if (!S.field) S.field = { map: null, x: 0, y: 0, dir: 'up', maps: {} };
      this.load(mapId, entry, at);
    }

    mem(id) {
      const maps = this.S.field.maps;
      if (!maps[id]) maps[id] = { beat: {}, sensed: {}, taken: {}, objs: {}, tiles: {} };
      return maps[id];
    }

    load(mapId, entry, pos) {
      const map = M.parse(mapId), mem = this.mem(mapId);
      for (const [idx, code] of Object.entries(mem.tiles)) map.tiles[+idx] = code;
      this.map = map;
      for (const o of map.objects) {
        const st = mem.objs[o.id];
        if (st) Object.assign(o, st);
        o.ax = o.x * TS;
        o.ay = o.y * TS;
        if (MOBILE.has(o.type)) this.initEnemy(o);
        if (o.type === 'drift') Object.assign(o, { home: [o.x, o.y], k: 0, sign: 1, t: DRIFT * ((o.x + o.y) % 3) / 3 });
      }
      this.objs = [];
      this.sync();
      const at = map.entries[entry] || map.entries.start || map.entries['@'] || Object.values(map.entries)[0];
      this.p = { x: at[0] * TS + 8, y: at[1] * TS + 14, dir: 'up', moving: false, sneak: false, anim: 0, frame: 'idle0', jump: null, speed: 0 };
      if (pos) Object.assign(this.p, { x: pos.x, y: pos.y, dir: pos.dir || 'up' });
      this.storm = map.def.storm ? { phase: 'calm', t: map.def.storm.calm, heat: 0 } : null;
      this.timer = map.def.timer ? map.def.timer.sec * (map.def.timer.breath && A.Bonds.has(this.S, 'kit', 1) ? map.def.timer.breath : 1) : null;
      this.timerOut = false;
      this.trail = [];
      this.followers = [];
      this.refresh();
      this.senseCool = 0;
      this.senseShow = 0;
      this.wave = -1;
      this.visited = new Set();
      this.events = [{ type: 'enter', name: map.def.name }];
      this.S.field.map = mapId;
      this.save();
    }

    save() {
      Object.assign(this.S.field, { map: this.map.id, x: this.p.x, y: this.p.y, dir: this.p.dir });
    }

    get follower() {
      return this.followers[0] || null;
    }

    present(o) {
      const mem = this.mem(this.map.id), st = mem.objs[o.id];
      if (st && st.gone) return false;
      if (o.type === 'enemy' && mem.beat[o.id]) return false;
      if (!o.cond) return true;
      if (!o.condParsed) o.condParsed = A.Script.parseCond(o.cond);
      return A.Script.test(this.S, o.condParsed);
    }

    sync() {
      this.objs = this.map.objects.filter(o => this.present(o));
    }

    can(ability) {
      return A.Memory.can(this.S, ability);
    }

    refresh() {
      this.sync();
      const def = this.map.def, list = def.followers || (def.follower ? [def.follower] : []);
      const want = list.map(f => (typeof f === 'string' ? { look: f } : f)).filter(f => (!f.flag || this.S.flags[f.flag]) && (!f.cond || A.Script.test(this.S, A.Script.parseCond(f.cond))));
      const old = this.followers;
      this.followers = want.map(f => old.find(o => o.key === (f.id || f.look)) || Object.assign(this.spawnFollower(f.look), { key: f.id || f.look }));
    }

    spawnFollower(look) {
      const fl = { look, x: this.p.x, y: this.p.y + 1, dir: 'up', frame: 'idle0', anim: 0 };
      const back = [[0, 18], [0, -18], [18, 0], [-18, 0]].find(([ddx, ddy]) => !this.blocked(this.p.x + ddx, this.p.y + ddy));
      if (back) {
        fl.x = this.p.x + back[0];
        fl.y = this.p.y + back[1];
      }
      if (!this.trail.length) this.trail = [[fl.x, fl.y]];
      return fl;
    }

    remember(o, patch) {
      const mem = this.mem(this.map.id);
      mem.objs[o.id] = Object.assign(mem.objs[o.id] || {}, patch);
    }

    setTile(x, y, code) {
      this.map.tiles[y * this.map.w + x] = code;
      this.mem(this.map.id).tiles[y * this.map.w + x] = code;
    }

    tile(x, y) {
      if (x < 0 || y < 0 || x >= this.map.w || y >= this.map.h) return T.wall;
      return this.map.tiles[y * this.map.w + x];
    }

    bridgeDown() {
      return this.objs.some(o => o.type === 'bridge' && o.on);
    }

    tileSolid(x, y) {
      const t = this.tile(x, y);
      if (t === T.bridge) return !this.bridgeDown();
      return M.SOLID.has(t);
    }

    objAt(x, y, test) {
      return this.objs.find(o => !MOBILE.has(o.type) && o.x === x && o.y === y && (!test || test(o)));
    }

    objSolid(o) {
      if (o.hidden && o.type === 'fragile') return true;
      if (o.type === 'bridge' || o.type === 'gate') return !o.on;
      return o.type === 'crate' || o.type === 'npc' || o.type === 'lever' || o.type === 'brace' || o.type === 'fragile' || o.type === 'end' || o.type === 'cocoon' || o.type === 'drift' || !!o.solid;
    }

    walkable(x, y) {
      return !this.tileSolid(x, y) && !this.objAt(x, y, o => this.objSolid(o));
    }

    bodySpan(px, py) {
      return [Math.floor((px - 5) / TS), Math.floor((px + 4.999) / TS), Math.floor((py - 6) / TS), Math.floor((py - 0.001) / TS)];
    }

    blocked(px, py) {
      const [x0, x1, y0, y1] = this.bodySpan(px, py);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (!this.walkable(tx, ty)) return true;
      return false;
    }

    sightBlocked(x, y) {
      const t = this.tile(x, y);
      if (M.SIGHT.has(t)) return true;
      return !!this.objAt(x, y, o => o.type === 'crate' || o.type === 'brace' || (o.type === 'fragile') || (o.solid && o.type !== 'npc'));
    }

    playerTile() {
      return [Math.floor(this.p.x / TS), Math.floor((this.p.y - 3) / TS)];
    }

    initEnemy(o) {
      o.px = o.x * TS + 8;
      o.py = o.y * TS + 14;
      o.home = [o.px, o.py];
      o.angle = ANG[o.face || 'right'];
      o.route = (o.route || []).map(c => {
        let m;
        if ((m = /^([EWNS])(\d+)$/.exec(c))) return { kind: 'move', dir: COMPASS[m[1]], n: +m[2] };
        if ((m = /^w(\d+(?:\.\d+)?)$/.exec(c))) return { kind: 'wait', t: +m[1] };
        if ((m = /^t(up|down|left|right)$/.exec(c))) return { kind: 'turn', dir: m[1] };
        throw new Error('bad route command ' + c);
      });
      o.ri = 0;
      o.goal = null;
      o.wait = 0;
      o.mode = 'patrol';
      o.alert = 0;
      o.lost = 0;
      o.path = null;
      o.repath = 0;
      o.anim = 0;
    }

    input(i) {
      return Object.assign({ dx: 0, dy: 0, sneak: false, interact: false, sense: false, push: false, pull: false }, i || {});
    }

    step(dt, raw) {
      const inp = this.input(raw), p = this.p;
      this.senseCool = Math.max(0, this.senseCool - dt);
      this.senseShow = Math.max(0, this.senseShow - dt);
      if (this.wave >= 0) this.wave = this.wave + dt > 0.6 ? -1 : this.wave + dt;
      for (const o of this.objs) {
        if (o.type === 'crate' || o.type === 'fragile' || o.type === 'drift') {
          const tx = o.x * TS, ty = o.y * TS, k = (o.type === 'drift' ? TS / DRIFT : CRATE) * dt;
          o.ax += Math.max(-k, Math.min(k, tx - o.ax));
          o.ay += Math.max(-k, Math.min(k, ty - o.ay));
        }
        if (o.type === 'drift') this.drift(o, dt);
      }
      if (this.storm) this.weather(dt);
      if (this.timer !== null && !this.timerOut) {
        this.timer = Math.max(0, this.timer - dt);
        if (this.timer <= 0) {
          this.timerOut = true;
          this.events.push({ type: 'scene', label: this.map.def.timer.fail });
        }
      }
      if (p.jump) {
        const j = p.jump;
        j.t += dt;
        const f = Math.min(1, j.t / JUMP_TIME);
        p.x = j.from[0] + (j.to[0] - j.from[0]) * f;
        p.y = j.from[1] + (j.to[1] - j.from[1]) * f;
        p.lift = Math.sin(Math.PI * f) * 14;
        if (f >= 1) { p.jump = null; p.lift = 0; }
        this.moveFollower(dt, true);
        this.stepEnemies(dt);
        return;
      }
      let dx = inp.dx, dy = inp.dy;
      const len = Math.hypot(dx, dy);
      p.sneak = !!inp.sneak && this.can('sneak');
      p.moving = len > 0;
      p.speed = 0;
      if (p.moving) {
        dx /= len;
        dy /= len;
        p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        const speed = p.sneak ? SPEED.sneak : SPEED[this.map.def.pace] || SPEED.run;
        p.speed = speed;
        const nx = p.x + dx * speed * dt, ny = p.y + dy * speed * dt;
        const ox = p.x, oy = p.y;
        if (!this.blocked(nx, p.y)) p.x = nx;
        if (!this.blocked(p.x, ny)) p.y = ny;
        if (p.x !== ox || p.y !== oy) {
          this.trail.unshift([p.x, p.y]);
          if (this.trail.length > 60) this.trail.pop();
        } else p.moving = false;
      }
      p.anim += dt;
      p.frame = p.moving ? 'walk' + (Math.floor(p.anim * (p.sneak ? 5 : 8)) % 4) : 'idle' + (Math.floor(p.anim / 0.6) % 2);
      this.moveFollower(dt, p.moving);
      if (p.moving) this.triggers();
      if (inp.sense && this.can('sense') && this.sense()) this.coverForce();
      if (inp.push && this.can('push') && this.force('push')) this.coverForce();
      if (inp.pull && this.can('pull') && this.force('pull')) this.coverForce();
      if (inp.interact) this.interact();
      this.stepEnemies(dt);
      this.save();
    }

    moveFollower(dt) {
      this.followers.forEach((f, i) => {
        let acc = 0, target = null, prev = [this.p.x, this.p.y];
        for (const pt of this.trail) {
          acc += Math.hypot(pt[0] - prev[0], pt[1] - prev[1]);
          prev = pt;
          if (acc >= 18 * (i + 1)) { target = pt; break; }
        }
        f.anim += dt;
        if (target) {
          const ddx = target[0] - f.x, ddy = target[1] - f.y;
          if (Math.hypot(ddx, ddy) > 0.5) {
            f.dir = Math.abs(ddx) > Math.abs(ddy) ? (ddx > 0 ? 'right' : 'left') : (ddy > 0 ? 'down' : 'up');
            f.x = target[0];
            f.y = target[1];
            f.frame = 'walk' + (Math.floor(f.anim * 8) % 4);
            return;
          }
        }
        f.frame = 'idle' + (Math.floor(f.anim / 0.6) % 2);
      });
    }

    triggers() {
      const [tx, ty] = this.playerTile(), o = this.objs.find(q => q.type === 'trigger' && q.x === tx && q.y === ty);
      if (!o) return;
      this.objs.splice(this.objs.indexOf(o), 1);
      this.remember(o, { gone: true });
      this.events.push({ type: 'scene', label: o.label, obj: o.id, autosave: !!o.autosave });
    }

    drift(o, dt) {
      o.t -= dt;
      if (o.t > 0) return;
      o.t += DRIFT;
      const m = /^([EWNS])(\d+)$/.exec(o.lane), v = DIRV[COMPASS[m[1]]], n = +m[2];
      if ((o.sign > 0 && o.k >= n) || (o.sign < 0 && o.k <= 0)) o.sign = -o.sign;
      const nx = o.x + v[0] * o.sign, ny = o.y + v[1] * o.sign;
      if (!this.driftFree(o, nx, ny)) { o.sign = -o.sign; return; }
      o.x = nx;
      o.y = ny;
      o.k += o.sign;
    }

    driftFree(o, x, y) {
      const [x0, x1, y0, y1] = this.bodySpan(this.p.x, this.p.y);
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return false;
      if (this.tileSolid(x, y) && this.tile(x, y) !== T.pit) return false;
      return !this.objs.some(q => q !== o && !MOBILE.has(q.type) && q.x === x && q.y === y && this.objSolid(q));
    }

    sheltered() {
      return this.objs.some(o => o.type === 'shelter' && Math.hypot(o.x * TS + 8 - this.p.x, o.y * TS + 8 - this.p.y) <= SHELTER);
    }

    weather(dt) {
      const W = this.map.def.storm, s = this.storm;
      s.t -= dt;
      if (s.t <= 0) {
        s.phase = s.phase === 'calm' ? 'warn' : s.phase === 'warn' ? 'blow' : 'calm';
        s.t += W[s.phase];
        this.events.push({ type: 'storm', phase: s.phase });
      }
      if (s.phase !== 'blow' || this.sheltered()) { s.heat = Math.max(0, s.heat - dt * 2); return; }
      s.heat = Math.min(1, s.heat + dt);
      const a = this.S.party.find(m => m.id === 'aayla');
      if (!a) return;
      s.burn = (s.burn || 0) + W.hpPerSec * dt;
      if (s.burn >= 1) {
        const d = Math.floor(s.burn);
        s.burn -= d;
        a.hp = Math.max(1, a.hp - d);
        this.events.push({ type: 'scorch', hp: a.hp });
      }
    }

    ahead(dist) {
      const v = DIRV[this.p.dir];
      return [Math.floor((this.p.x + v[0] * dist) / TS), Math.floor((this.p.y - 3 + v[1] * dist) / TS)];
    }

    visible(o) {
      return !o.hidden || !!this.mem(this.map.id).sensed[o.id] || (!!o.calc && A.Bonds.has(this.S, 'ekria', 2));
    }

    verb(o) {
      if (!o || !this.visible(o)) return null;
      switch (o.type) {
        case 'npc': return 'Говорить';
        case 'examine': return 'Осмотреть';
        case 'clue': return this.follower && this.follower.look.startsWith('vos') ? 'Вос, прочти' : 'Осмотреть';
        case 'cache': return this.mem(this.map.id).taken[o.id] ? null : 'Взять';
        case 'meditate': return this.can('meditate') ? 'Медитировать' : null;
        case 'exit': return o.name;
        case 'end': return o.name;
        case 'scene': return o.name;
        case 'cocoon': return 'Осмотреть';
        case 'rest': return 'Отдохнуть';
        case 'duty': return this.mem(this.map.id).taken[o.id] ? null : o.verb || 'Работать';
        case 'screen': return o.verb || 'Слушать у ширмы';
        case 'repair': return this.mem(this.map.id).taken[o.id] ? null : o.verb || 'Починить';
        case 'lock': return 'Осмотреть';
        case 'fire': return 'Осмотреть';
        case 'spot': return !o.occupied && this.S.flags.retinue && (this.S.flags.placed || 0) < 2 ? 'Посадить анзата в засаду' : null;
        case 'lever': return 'Рычаг';
        case 'decoy': return this.mem(this.map.id).taken[o.id] ? null : o.verb;
        case 'gate': return o.on ? null : 'Осмотреть';
        case 'jump': {
          if (!this.can('jump')) return null;
          const v = DIRV[this.p.dir], s = [Math.sign(o.to[0]), Math.sign(o.to[1])];
          return v[0] === s[0] && v[1] === s[1] ? 'Прыжок' : null;
        }
      }
      return null;
    }

    target() {
      const [ax, ay] = this.ahead(14), [px, py] = this.playerTile();
      const front = this.objs.find(o => !MOBILE.has(o.type) && o.x === ax && o.y === ay && this.verb(o));
      if (front) return front;
      return this.objs.find(o => !MOBILE.has(o.type) && o.x === px && o.y === py && this.verb(o)) || null;
    }

    forceTarget() {
      const [px, py] = this.playerTile(), v = DIRV[this.p.dir];
      for (let i = 1; i <= FORCE_RANGE; i++) {
        const x = px + v[0] * i, y = py + v[1] * i;
        const o = this.objAt(x, y, q => ['crate', 'lever', 'bridge', 'brace', 'fragile', 'grab'].includes(q.type) && this.visible(q));
        if (o) return o;
        if (this.objAt(x, y, q => this.objSolid(q)) || M.SIGHT.has(this.tile(x, y))) return null;
      }
      return null;
    }

    forceVerbs(o) {
      if (!o) return [];
      switch (o.type) {
        case 'crate': return ['push', 'pull'];
        case 'lever': return ['push', 'pull'];
        case 'bridge': return [o.on ? 'push' : 'pull'];
        case 'brace': return ['push'];
        case 'fragile': return ['push'];
        case 'grab': return ['pull'];
      }
      return [];
    }

    prompt() {
      const t = this.target(), f = this.forceTarget();
      return { verb: this.verb(t), target: t, force: f, push: this.can('push') && this.forceVerbs(f).includes('push'), pull: this.can('pull') && this.forceVerbs(f).includes('pull') };
    }

    sense() {
      if (this.senseCool > 0) return false;
      this.senseCool = SENSE.cool;
      this.senseShow = SENSE.show;
      this.wave = 0;
      const mem = this.mem(this.map.id);
      let found = 0;
      for (const o of this.objs) {
        if (!o.hidden || mem.sensed[o.id]) continue;
        if (Math.hypot(o.x * TS + 8 - this.p.x, o.y * TS + 8 - (this.p.y - 6)) <= SENSE.radius) {
          mem.sensed[o.id] = true;
          if (o.flag) this.S.flags[o.flag] = true;
          found++;
        }
      }
      this.events.push({ type: 'sense', found });
      return true;
    }

    slide(o, d) {
      const mem = this.mem(this.map.id), [x0, x1, y0, y1] = this.bodySpan(this.p.x, this.p.y);
      let x = o.x, y = o.y, moved = 0;
      for (;;) {
        const nx = x + d[0], ny = y + d[1];
        if (nx >= x0 && nx <= x1 && ny >= y0 && ny <= y1) break;
        const t = this.tile(nx, ny);
        if (t === T.pit || (t === T.bridge && !this.bridgeDown())) {
          this.setTile(nx, ny, T.filled);
          o.x = nx;
          o.y = ny;
          o.gone = true;
          mem.objs[o.id] = { gone: true };
          this.objs.splice(this.objs.indexOf(o), 1);
          this.events.push({ type: 'fill', at: [nx, ny] });
          return moved + 1;
        }
        if (!this.walkable(nx, ny)) break;
        x = nx;
        y = ny;
        moved++;
      }
      o.x = x;
      o.y = y;
      this.remember(o, { x, y });
      return moved;
    }

    force(kind) {
      const o = this.forceTarget();
      if (!o || !this.forceVerbs(o).includes(kind)) return false;
      const v = DIRV[this.p.dir];
      if (o.type === 'crate') {
        const moved = this.slide(o, kind === 'push' ? v : [-v[0], -v[1]]);
        this.events.push({ type: kind, obj: o.id, moved });
        return moved > 0;
      }
      if (o.type === 'lever') return this.toggle(o);
      if (o.type === 'bridge') {
        if (kind === 'push' && this.onBridge()) return false;
        o.on = kind === 'pull';
        this.remember(o, { on: o.on });
        this.events.push({ type: 'bridge', on: o.on });
        return true;
      }
      if (o.type === 'brace') {
        const box = [this.p.x - 5, this.p.y - 6, this.p.x + 5, this.p.y];
        if (o.drop.some(([x, y]) => box[2] > x * TS && box[0] < x * TS + TS && box[3] > y * TS && box[1] < y * TS + TS)) {
          this.events.push({ type: 'blocked', why: 'stand' });
          return false;
        }
        const mem = this.mem(this.map.id), trapped = [];
        for (const [x, y] of o.drop) this.setTile(x, y, T.rubble);
        this.setTile(o.x, o.y, T.rubble);
        for (const e of this.objs.filter(q => q.type === 'enemy')) {
          const ex = Math.floor(e.px / TS), ey = Math.floor((e.py - 3) / TS);
          if (o.drop.some(([x, y]) => x === ex && y === ey)) { mem.beat[e.id] = 'trapped'; trapped.push(e.id); }
        }
        this.objs = this.objs.filter(q => q !== o && !trapped.includes(q.id));
        mem.objs[o.id] = { gone: true };
        this.events.push({ type: 'collapse', obj: o.id, trapped });
        return true;
      }
      if (o.type === 'fragile') {
        this.objs.splice(this.objs.indexOf(o), 1);
        this.mem(this.map.id).objs[o.id] = { gone: true };
        this.events.push({ type: 'break', obj: o.id });
        return true;
      }
      if (o.type === 'grab') {
        this.objs.splice(this.objs.indexOf(o), 1);
        this.mem(this.map.id).objs[o.id] = { gone: true };
        this.events.push({ type: 'scene', label: o.label, obj: o.id });
        return true;
      }
      return false;
    }

    toggle(o) {
      o.on = !o.on;
      this.remember(o, { on: o.on });
      const t = o.controls && this.objs.find(q => q.id === o.controls);
      if (t) { t.on = o.on; this.remember(t, { on: t.on }); }
      this.events.push({ type: 'lever', obj: o.id, on: o.on });
      return true;
    }

    onBridge() {
      const [x0, x1, y0, y1] = this.bodySpan(this.p.x, this.p.y);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (this.tile(x, y) === T.bridge) return true;
      return false;
    }

    interact() {
      const o = this.target();
      if (!o) return false;
      const mem = this.mem(this.map.id);
      if (o.type === 'screen') {
        const d = this.coverActive();
        if (d && this.watched()) this.events.push({ type: 'cover', add: d.seen, why: 'screen', obj: o.id });
        else this.events.push({ type: 'scene', label: o.label, obj: o.id });
        return true;
      }
      if (o.type === 'duty') {
        if (mem.taken[o.id]) return false;
        mem.taken[o.id] = true;
        const d = this.coverActive();
        this.events.push({ type: 'lines', lines: o.lines, name: o.name, obj: o.id });
        if (d) this.events.push({ type: 'cover', add: -d.duty, why: 'duty', obj: o.id });
        return true;
      }
      if (o.type === 'repair') {
        if (mem.taken[o.id]) return false;
        this.events.push({ type: 'repair', obj: o.id, puzzle: o.puzzle, name: o.name });
        return true;
      }
      if (o.type === 'decoy') {
        if (mem.taken[o.id]) return false;
        mem.taken[o.id] = true;
        const tx = o.to[0] * TS + 8, ty = o.to[1] * TS + 8;
        const fooled = this.objs.filter(e => e.type === 'enemy' && e.mode !== 'engaged' && Math.hypot(e.px - tx, e.py - ty) <= (o.range || 8) * TS);
        for (const e of fooled) {
          e.mode = 'look';
          e.lookT = o.sec || 10;
          e.angle = Math.atan2(ty - e.py, tx - e.px);
        }
        this.events.push({ type: 'lines', lines: o.lines, name: o.name, obj: o.id });
        this.events.push({ type: 'decoy', obj: o.id, fooled: fooled.map(e => e.id) });
        return true;
      }
      if (o.label && o.type !== 'trigger') {
        this.events.push({ type: 'scene', label: o.label, obj: o.id, autosave: !!o.autosave });
        return true;
      }
      switch (o.type) {
        case 'npc':
          this.events.push({ type: 'lines', lines: o.lines, name: o.name, look: o.look, obj: o.id });
          return true;
        case 'examine':
        case 'lock':
        case 'fire':
        case 'gate':
        case 'clue':
          this.events.push({ type: 'lines', lines: o.lines, name: o.name, obj: o.id });
          if (o.type === 'clue') this.S.flags['clue_' + this.map.id + '_' + o.id] = true;
          return true;
        case 'cache':
          mem.taken[o.id] = true;
          this.S.items[o.item] = (this.S.items[o.item] || 0) + 1;
          this.events.push({ type: 'lines', lines: o.lines, name: o.name, obj: o.id, item: o.item });
          return true;
        case 'meditate': {
          const first = !this.visited.has(o.id);
          this.visited.add(o.id);
          if (first) this.S.dark = Math.max(0, this.S.dark - 5);
          this.events.push({ type: 'meditate', obj: o.id, first });
          return true;
        }
        case 'exit':
          this.events.push({ type: 'exit', to: o.to, at: o.at });
          return true;
        case 'end':
          this.events.push({ type: 'end', lines: o.lines, obj: o.id });
          return true;
        case 'scene':
          this.events.push({ type: 'scene', label: o.label, obj: o.id });
          return true;
        case 'cocoon':
          this.events.push({ type: 'lines', lines: o.lines || M.COCOON, name: o.name || 'Кокон', obj: o.id });
          return true;
        case 'rest':
          this.events.push({ type: 'rest', obj: o.id });
          return true;
        case 'spot': {
          const n = (this.S.flags.placed || 0) + 1;
          o.occupied = true;
          this.remember(o, { occupied: true });
          this.S.flags.placed = n;
          this.S.flags['placed_a' + n] = true;
          this.S.flags.ambush_score = (this.S.flags.ambush_score || 0) + (o.score || 0);
          this.refresh();
          this.events.push({ type: 'placed', obj: o.id, score: o.score || 0, n });
          return true;
        }
        case 'lever':
          return this.toggle(o);
        case 'jump': {
          const tx = o.x + o.to[0], ty = o.y + o.to[1];
          if (!this.walkable(tx, ty)) return false;
          this.p.jump = { from: [this.p.x, this.p.y], to: [tx * TS + 8, ty * TS + 14], t: 0 };
          this.events.push({ type: 'jump', obj: o.id });
          this.coverForce();
          return true;
        }
      }
      return false;
    }

    fixed(id) {
      const o = this.objs.find(q => q.id === id), mem = this.mem(this.map.id);
      if (!o || o.type !== 'repair' || mem.taken[o.id]) return false;
      mem.taken[o.id] = true;
      if (o.flag) this.S.flags[o.flag] = true;
      this.S.credits = (this.S.credits || 0) + (o.pay || 0);
      this.events.push({ type: 'lines', lines: o.done, name: o.name, obj: o.id, pay: o.pay || 0 });
      const d = this.coverActive();
      if (d) this.events.push({ type: 'cover', add: -d.duty, why: 'duty', obj: o.id });
      this.refresh();
      return true;
    }

    coverActive() {
      const d = A.Cover.def(this.S);
      return d && this.map.def.cover === this.S.cover.id && !this.S.cover.exposed ? d : null;
    }

    forbidden() {
      const [x, y] = this.playerTile();
      return (this.map.def.forbid || []).some(([x0, y0, x1, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
    }

    watched() {
      return this.objs.some(o => o.type === 'watch' && !o.watch && this.canSee(o));
    }

    coverForce() {
      const d = this.coverActive();
      if (d && this.watched()) this.events.push({ type: 'cover', add: d.force, why: 'force' });
    }

    beast(e) {
      const g = A.GROUPS[e.group];
      return !!g && g.units.every(([type]) => (A.ENEMIES[type] || {}).kind === 'beast');
    }

    senses(e) {
      const g = A.GROUPS[e.group];
      return !!g && g.units.some(([type]) => (A.ENEMIES[type] || {}).senses) && !A.Bonds.has(this.S, 'tholme', 3);
    }

    sightRange(e) {
      if (!this.p.sneak) return SIGHT.range;
      if (A.Bonds.has(this.S, 'tholme', 2) && this.beast(e)) return 0;
      return A.Bonds.has(this.S, 'tholme', 1) ? SIGHT.range / 2 : SIGHT.range;
    }

    canSee(e) {
      const ex = e.px, ey = e.py - 8, px = this.p.x, py = this.p.y - 8;
      const d = Math.hypot(px - ex, py - ey);
      if (d > this.sightRange(e)) return false;
      if (d > 4 && angDiff(Math.atan2(py - ey, px - ex), e.angle) > SIGHT.half) return false;
      const n = Math.ceil(d / 4);
      for (let i = 1; i < n; i++) {
        const x = ex + (px - ex) * i / n, y = ey + (py - ey) * i / n;
        if (this.sightBlocked(Math.floor(x / TS), Math.floor(y / TS))) return false;
      }
      return true;
    }

    noise() {
      const p = this.p;
      if (!p.moving || p.sneak) return 0;
      return p.speed >= SPEED.run ? HEAR.run : HEAR.walk;
    }

    path(from, to) {
      const w = this.map.w, key = (x, y) => y * w + x, prev = new Map([[key(from[0], from[1]), -1]]), q = [from];
      while (q.length) {
        const [x, y] = q.shift();
        if (x === to[0] && y === to[1]) {
          const out = [];
          let k = key(x, y);
          while (k !== -1) { out.unshift([k % w, Math.floor(k / w)]); k = prev.get(k); }
          return out;
        }
        for (const [ddx, ddy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + ddx, ny = y + ddy, k = key(nx, ny);
          if (prev.has(k) || !this.walkable(nx, ny)) continue;
          prev.set(k, key(x, y));
          q.push([nx, ny]);
        }
      }
      return null;
    }

    walkTo(e, tx, ty, speed, dt) {
      const ddx = tx - e.px, ddy = ty - e.py, d = Math.hypot(ddx, ddy);
      if (d < 0.5) { e.px = tx; e.py = ty; return true; }
      const s = Math.min(d, speed * dt);
      e.px += ddx / d * s;
      e.py += ddy / d * s;
      e.angle = Math.atan2(ddy, ddx);
      e.anim += dt;
      return d <= speed * dt;
    }

    followPath(e, speed, dt) {
      if (!e.path || !e.path.length) return true;
      const [tx, ty] = e.path[0];
      if (this.walkTo(e, tx * TS + 8, ty * TS + 14, speed, dt)) e.path.shift();
      return !e.path.length;
    }

    stepEnemies(dt) {
      const p = this.p, noise = this.noise();
      for (const e of this.objs.filter(o => MOBILE.has(o.type))) {
        if (e.mode === 'engaged') continue;
        if (e.calm > 0) e.calm -= dt;
        const dist = Math.hypot(e.px - p.x, e.py - p.y);
        if (e.type === 'watch') { this.watchStep(e, dt, dist, noise); continue; }
        if (!p.jump && dist < CONTACT && !(e.calm > 0)) {
          const engaged = e.mode === 'alert' || e.mode === 'chase';
          const toP = Math.atan2(p.y - e.py, p.x - e.px);
          const behind = angDiff(toP, e.angle) > Math.PI / 2;
          const advantage = engaged || (e.hidden && !this.visible(e)) ? 'enemy' : behind ? 'party' : 'none';
          this.events.push({ type: 'encounter', obj: e.id, group: e.group, name: e.name, advantage });
          e.mode = 'engaged';
          continue;
        }
        const sees = !p.jump && (this.canSee(e) || (dist < SENSE_NEAR && this.senses(e)));
        if (e.mode === 'patrol' || e.mode === 'look' || e.mode === 'return') {
          if (sees) { e.mode = 'alert'; e.alert = 0.6; this.events.push({ type: 'spotted', obj: e.id }); continue; }
          if (noise && dist <= noise) { e.mode = 'look'; e.lookT = 1; e.angle = Math.atan2(p.y - e.py, p.x - e.px); }
        }
        if (e.mode === 'alert') {
          e.alert -= dt;
          e.angle = Math.atan2(p.y - e.py, p.x - e.px);
          if (e.alert <= 0) { e.mode = 'chase'; e.lost = 0; e.repath = 0; }
          continue;
        }
        if (e.mode === 'chase') {
          e.lost = sees ? 0 : e.lost + dt;
          if (e.lost > 3) {
            e.mode = 'return';
            e.path = this.path([Math.floor(e.px / TS), Math.floor((e.py - 3) / TS)], [Math.floor(e.home[0] / TS), Math.floor((e.home[1] - 3) / TS)]);
            continue;
          }
          e.repath -= dt;
          if (e.repath <= 0) {
            e.repath = 0.4;
            e.path = this.path([Math.floor(e.px / TS), Math.floor((e.py - 3) / TS)], this.playerTile());
            if (e.path) e.path.shift();
          }
          if (e.path && e.path.length) this.followPath(e, CHASE, dt);
          else this.walkTo(e, p.x, p.y, CHASE, dt);
          continue;
        }
        if (e.mode === 'look') {
          e.lookT -= dt;
          if (e.lookT <= 0) e.mode = 'patrol';
          continue;
        }
        if (e.mode === 'return') {
          if (this.followPath(e, PATROL, dt)) { e.mode = 'patrol'; e.ri = 0; e.goal = null; e.wait = 0; e.px = e.home[0]; e.py = e.home[1]; }
          continue;
        }
        this.patrol(e, dt);
      }
    }

    watchStep(e, dt, dist, noise) {
      const p = this.p;
      const covered = !e.watch && this.coverActive();
      if (!(e.calm > 0) && !p.jump && (covered ? this.forbidden() : !!e.watch) && (dist < CONTACT || this.canSee(e))) {
        e.calm = covered ? 3 : 4;
        e.mode = 'look';
        e.lookT = 1.2;
        e.angle = Math.atan2(p.y - e.py, p.x - e.px);
        if (covered) this.events.push({ type: 'cover', add: covered.seen, why: 'seen', obj: e.id });
        else this.events.push({ type: 'scene', label: e.watch, obj: e.id });
        return;
      }
      if (noise && dist <= noise && e.mode === 'patrol') {
        e.mode = 'look';
        e.lookT = 1;
        e.angle = Math.atan2(p.y - e.py, p.x - e.px);
      }
      if (e.mode === 'look') {
        e.lookT -= dt;
        if (e.lookT <= 0) e.mode = 'patrol';
        return;
      }
      this.patrol(e, dt);
    }

    patrol(e, dt) {
      if (!e.route.length) return;
      const c = e.route[e.ri];
      const next = () => { e.ri = (e.ri + 1) % e.route.length; e.goal = null; e.wait = 0; };
      if (c.kind === 'wait') {
        e.wait += dt;
        if (e.wait >= c.t) next();
        return;
      }
      if (c.kind === 'turn') {
        e.angle = ANG[c.dir];
        next();
        return;
      }
      if (!e.goal) {
        const v = DIRV[c.dir];
        e.goal = [e.px + v[0] * c.n * TS, e.py + v[1] * c.n * TS];
        e.angle = ANG[c.dir];
      }
      if (this.walkTo(e, e.goal[0], e.goal[1], PATROL, dt)) next();
    }

    resolve(id, how) {
      const mem = this.mem(this.map.id);
      mem.beat[id] = how || 'won';
      this.objs = this.objs.filter(o => o.id !== id);
      if (!this.objs.some(o => o.type === 'enemy')) {
        this.S.flags['clear_' + this.map.id] = true;
        this.sync();
      }
    }

    enemiesLeft() {
      return this.objs.filter(o => o.type === 'enemy').length;
    }

    release(id) {
      const e = this.objs.find(o => o.id === id);
      if (e) { e.mode = 'return'; e.calm = A.FIELD.CALM; e.path = this.path([Math.floor(e.px / TS), Math.floor((e.py - 3) / TS)], [Math.floor(e.home[0] / TS), Math.floor((e.home[1] - 3) / TS)]); }
    }

    take() {
      const out = this.events;
      this.events = [];
      return out;
    }

    static dirOfAngle(a) { return dirOfAngle(a); }
    static mobile(o) { return MOBILE.has(o.type); }
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
