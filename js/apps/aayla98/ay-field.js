(function (A) {
  'use strict';
  const M = A.Maps, T = M.T, TS = M.TILE;
  const SPEED = { run: 100, walk: 60, sneak: 35 };
  const SENSE = { radius: 96, cool: 6, show: 5 };
  const SIGHT = { range: 80, half: Math.PI / 4 };
  const HEAR = { run: 48, walk: 24, sneak: 0 };
  const FORCE_RANGE = 5, PATROL = 30, CHASE = 70, CONTACT = 12, CALM = 3, CRATE = 160, JUMP_TIME = 0.6;
  const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  const ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
  const COMPASS = { E: 'right', W: 'left', N: 'up', S: 'down' };
  A.FIELD = { SPEED, SENSE, SIGHT, HEAR, FORCE_RANGE, PATROL, CHASE, CONTACT, CALM, DIRV };

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
    constructor(S, mapId, entry) {
      this.S = S;
      if (!S.field) S.field = { map: null, x: 0, y: 0, dir: 'up', maps: {} };
      this.load(mapId, entry);
    }

    mem(id) {
      const maps = this.S.field.maps;
      if (!maps[id]) maps[id] = { beat: {}, sensed: {}, taken: {}, objs: {}, tiles: {} };
      return maps[id];
    }

    load(mapId, entry) {
      const map = M.parse(mapId), mem = this.mem(mapId);
      for (const [idx, code] of Object.entries(mem.tiles)) map.tiles[+idx] = code;
      this.map = map;
      this.objs = [];
      for (const o of map.objects) {
        const st = mem.objs[o.id];
        if (st && st.gone) continue;
        if (o.type === 'enemy' && mem.beat[o.id]) continue;
        if (st) Object.assign(o, st);
        o.ax = o.x * TS;
        o.ay = o.y * TS;
        if (o.type === 'enemy') this.initEnemy(o);
        this.objs.push(o);
      }
      const at = map.entries[entry] || map.entries.start || map.entries['@'] || Object.values(map.entries)[0];
      this.p = { x: at[0] * TS + 8, y: at[1] * TS + 14, dir: 'up', moving: false, sneak: false, anim: 0, frame: 'idle0', jump: null, speed: 0 };
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

    refresh() {
      const def = this.map.def, list = def.followers || (def.follower ? [def.follower] : []);
      const want = list.map(f => (typeof f === 'string' ? { look: f } : f)).filter(f => !f.flag || this.S.flags[f.flag]);
      const old = this.followers;
      this.followers = want.map(f => old.find(o => o.look === f.look) || this.spawnFollower(f.look));
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
      return this.objs.find(o => o.type !== 'enemy' && o.x === x && o.y === y && (!test || test(o)));
    }

    objSolid(o) {
      if (o.hidden && o.type === 'fragile') return true;
      if (o.type === 'bridge') return !o.on;
      return o.type === 'crate' || o.type === 'npc' || o.type === 'lever' || o.type === 'brace' || o.type === 'fragile' || o.type === 'end' || o.type === 'cocoon' || !!o.solid;
    }

    walkable(x, y) {
      return !this.tileSolid(x, y) && !this.objAt(x, y, o => this.objSolid(o));
    }

    blocked(px, py) {
      const x0 = Math.floor((px - 5) / TS), x1 = Math.floor((px + 4.999) / TS);
      const y0 = Math.floor((py - 6) / TS), y1 = Math.floor((py - 0.001) / TS);
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
        if (o.type === 'crate' || o.type === 'fragile') {
          const tx = o.x * TS, ty = o.y * TS, k = CRATE * dt;
          o.ax += Math.max(-k, Math.min(k, tx - o.ax));
          o.ay += Math.max(-k, Math.min(k, ty - o.ay));
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
      p.sneak = !!inp.sneak;
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
      if (inp.sense) this.sense();
      if (inp.push) this.force('push');
      if (inp.pull) this.force('pull');
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
      this.events.push({ type: 'scene', label: o.label, obj: o.id });
    }

    ahead(dist) {
      const v = DIRV[this.p.dir];
      return [Math.floor((this.p.x + v[0] * dist) / TS), Math.floor((this.p.y - 3 + v[1] * dist) / TS)];
    }

    visible(o) {
      return !o.hidden || !!this.mem(this.map.id).sensed[o.id];
    }

    verb(o) {
      if (!o || !this.visible(o)) return null;
      switch (o.type) {
        case 'npc': return 'Говорить';
        case 'examine': return 'Осмотреть';
        case 'clue': return this.follower && this.follower.look.startsWith('vos') ? 'Вос, прочти' : 'Осмотреть';
        case 'cache': return this.mem(this.map.id).taken[o.id] ? null : 'Взять';
        case 'meditate': return 'Медитировать';
        case 'exit': return o.name;
        case 'end': return o.name;
        case 'scene': return o.name;
        case 'cocoon': return 'Осмотреть';
        case 'lever': return 'Рычаг';
        case 'jump': {
          const v = DIRV[this.p.dir], s = [Math.sign(o.to[0]), Math.sign(o.to[1])];
          return v[0] === s[0] && v[1] === s[1] ? 'Прыжок' : null;
        }
      }
      return null;
    }

    target() {
      const [ax, ay] = this.ahead(14), [px, py] = this.playerTile();
      const front = this.objs.find(o => o.type !== 'enemy' && o.x === ax && o.y === ay && this.verb(o));
      if (front) return front;
      return this.objs.find(o => o.type !== 'enemy' && o.x === px && o.y === py && this.verb(o)) || null;
    }

    forceTarget() {
      const [px, py] = this.playerTile(), v = DIRV[this.p.dir];
      for (let i = 1; i <= FORCE_RANGE; i++) {
        const x = px + v[0] * i, y = py + v[1] * i;
        const o = this.objAt(x, y, q => ['crate', 'lever', 'bridge', 'brace', 'fragile'].includes(q.type) && this.visible(q));
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
      }
      return [];
    }

    prompt() {
      const t = this.target(), f = this.forceTarget();
      return { verb: this.verb(t), target: t, force: f, push: this.forceVerbs(f).includes('push'), pull: this.forceVerbs(f).includes('pull') };
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
          found++;
        }
      }
      this.events.push({ type: 'sense', found });
      return true;
    }

    slide(o, d) {
      const mem = this.mem(this.map.id), [px, py] = this.playerTile();
      let x = o.x, y = o.y, moved = 0;
      for (;;) {
        const nx = x + d[0], ny = y + d[1];
        if (nx === px && ny === py) break;
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
      const x0 = Math.floor((this.p.x - 5) / TS), x1 = Math.floor((this.p.x + 4.999) / TS), y = Math.floor((this.p.y - 1) / TS);
      for (let x = x0; x <= x1; x++) if (this.tile(x, y) === T.bridge) return true;
      return false;
    }

    interact() {
      const o = this.target();
      if (!o) return false;
      const mem = this.mem(this.map.id);
      switch (o.type) {
        case 'npc':
          this.events.push({ type: 'lines', lines: o.lines, name: o.name, look: o.look, obj: o.id });
          return true;
        case 'examine':
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
        case 'lever':
          return this.toggle(o);
        case 'jump': {
          const tx = o.x + o.to[0], ty = o.y + o.to[1];
          if (!this.walkable(tx, ty)) return false;
          this.p.jump = { from: [this.p.x, this.p.y], to: [tx * TS + 8, ty * TS + 14], t: 0 };
          this.events.push({ type: 'jump', obj: o.id });
          return true;
        }
      }
      return false;
    }

    canSee(e) {
      const ex = e.px, ey = e.py - 8, px = this.p.x, py = this.p.y - 8;
      const d = Math.hypot(px - ex, py - ey);
      if (d > SIGHT.range) return false;
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
      for (const e of this.objs.filter(o => o.type === 'enemy')) {
        if (e.mode === 'engaged') continue;
        if (e.calm > 0) e.calm -= dt;
        const dist = Math.hypot(e.px - p.x, e.py - p.y);
        if (!p.jump && dist < CONTACT && !(e.calm > 0)) {
          const engaged = e.mode === 'alert' || e.mode === 'chase';
          const toP = Math.atan2(p.y - e.py, p.x - e.px);
          const behind = angDiff(toP, e.angle) > Math.PI / 2;
          const advantage = engaged ? 'enemy' : behind ? 'party' : 'none';
          this.events.push({ type: 'encounter', obj: e.id, group: e.group, name: e.name, advantage });
          e.mode = 'engaged';
          continue;
        }
        const sees = !p.jump && this.canSee(e);
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
  };
})(globalThis.Aayla98 = globalThis.Aayla98 || {});
