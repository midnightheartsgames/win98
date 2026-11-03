(function (P) {
  'use strict';
  const { clamp, dist, rng, weighted, pick, hash, FLOOR, USE_Y, TUNE, ITEMS, STATIONS, TABLES, TABLE_KINDS, QUEUE, GATE, TAKEAWAY, DECOR, TYPES, TUTORIAL, TEXT, EXTRAS, DRINKS, FOOD } = P;
  const CELL = 8;
  const HERO_R = 9;

  class Grid {
    constructor(w, h) {
      this.w = Math.ceil(w / CELL);
      this.h = Math.ceil(h / CELL);
      this.b = new Uint8Array(this.w * this.h).fill(1);
    }

    open(x0, y0, x1, y1) {
      for (let cy = 0; cy < this.h; cy++) {
        const py = cy * CELL + CELL / 2;
        if (py < y0 || py >= y1) continue;
        for (let cx = 0; cx < this.w; cx++) {
          const px = cx * CELL + CELL / 2;
          if (px >= x0 && px < x1) this.b[cy * this.w + cx] = 0;
        }
      }
    }

    close(x0, y0, x1, y1) {
      const cx0 = Math.max(0, Math.floor(x0 / CELL)), cy0 = Math.max(0, Math.floor(y0 / CELL));
      const cx1 = Math.min(this.w - 1, Math.floor((x1 - 0.001) / CELL)), cy1 = Math.min(this.h - 1, Math.floor((y1 - 0.001) / CELL));
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) this.b[cy * this.w + cx] = 1;
    }

    freeCell(cx, cy) { return cx >= 0 && cy >= 0 && cx < this.w && cy < this.h && !this.b[cy * this.w + cx]; }

    free(x, y) { return this.freeCell(Math.floor(x / CELL), Math.floor(y / CELL)); }

    los(ax, ay, bx, by) {
      const n = Math.ceil(Math.hypot(bx - ax, by - ay) / 3);
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        if (!this.free(ax + (bx - ax) * t, ay + (by - ay) * t)) return false;
      }
      return true;
    }

    nearest(x, y) {
      const sx = Math.floor(x / CELL), sy = Math.floor(y / CELL);
      if (this.freeCell(sx, sy)) return { cx: sx, cy: sy };
      let best = null, bd = Infinity;
      for (let r = 1; r < 40 && !best; r++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dx = -r; dx <= r; dx++) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
            const cx = sx + dx, cy = sy + dy;
            if (!this.freeCell(cx, cy)) continue;
            const d = Math.hypot((cx + 0.5) * CELL - x, (cy + 0.5) * CELL - y);
            if (d < bd) { bd = d; best = { cx, cy }; }
          }
        }
      }
      return best;
    }

    path(ax, ay, bx, by) {
      if (this.free(ax, ay) && this.free(bx, by) && this.los(ax, ay, bx, by)) return [{ x: bx, y: by }];
      const s = this.nearest(ax, ay), g = this.nearest(bx, by);
      if (!s || !g) return [{ x: bx, y: by }];
      const W = this.w, N = this.w * this.h;
      const gs = new Float32Array(N).fill(Infinity);
      const from = new Int32Array(N).fill(-1);
      const closed = new Uint8Array(N);
      const heap = [];
      const push = (i, f) => {
        heap.push([f, i]);
        let k = heap.length - 1;
        while (k > 0) {
          const p = (k - 1) >> 1;
          if (heap[p][0] <= heap[k][0]) break;
          [heap[p], heap[k]] = [heap[k], heap[p]];
          k = p;
        }
      };
      const pop = () => {
        const top = heap[0], last = heap.pop();
        if (heap.length) {
          heap[0] = last;
          let k = 0;
          for (;;) {
            const l = 2 * k + 1, r = l + 1;
            let m = k;
            if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
            if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
            if (m === k) break;
            [heap[m], heap[k]] = [heap[k], heap[m]];
            k = m;
          }
        }
        return top;
      };
      const hfun = (cx, cy) => { const dx = Math.abs(cx - g.cx), dy = Math.abs(cy - g.cy); return Math.max(dx, dy) + 0.4142 * Math.min(dx, dy); };
      const si = s.cy * W + s.cx, gi = g.cy * W + g.cx;
      gs[si] = 0;
      push(si, hfun(s.cx, s.cy));
      let found = false;
      while (heap.length) {
        const [, i] = pop();
        if (closed[i]) continue;
        closed[i] = 1;
        if (i === gi) { found = true; break; }
        const cx = i % W, cy = (i / W) | 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = cx + dx, ny = cy + dy;
            if (!this.freeCell(nx, ny)) continue;
            if (dx && dy && (!this.freeCell(cx + dx, cy) || !this.freeCell(cx, cy + dy))) continue;
            const ni = ny * W + nx;
            if (closed[ni]) continue;
            const ng = gs[i] + (dx && dy ? 1.4142 : 1);
            if (ng < gs[ni]) { gs[ni] = ng; from[ni] = i; push(ni, ng + hfun(nx, ny)); }
          }
        }
      }
      if (!found) return [{ x: bx, y: by }];
      const cells = [];
      for (let i = gi; i !== -1; i = from[i]) cells.push({ x: (i % W + 0.5) * CELL, y: (((i / W) | 0) + 0.5) * CELL });
      cells.reverse();
      if (this.free(bx, by)) cells[cells.length - 1] = { x: bx, y: by };
      const out = [];
      let cur = { x: ax, y: ay }, k = 0;
      while (k < cells.length) {
        let far = k;
        for (let j = cells.length - 1; j > k; j--) {
          if (this.los(cur.x, cur.y, cells[j].x, cells[j].y)) { far = j; break; }
        }
        out.push(cells[far]);
        cur = cells[far];
        k = far + 1;
      }
      return out;
    }
  }

  function dirOf(dx, dy, prev) {
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return prev;
    if (Math.abs(dx) > Math.abs(dy) * 0.9) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'down' : 'up';
  }

  function stepAlong(ent, speed, dt) {
    let budget = speed * dt;
    let moved = false;
    while (budget > 0 && ent.path.length) {
      const p = ent.path[0];
      const dx = p.x - ent.x, dy = p.y - ent.y;
      const d = Math.hypot(dx, dy);
      if (d <= budget) {
        ent.x = p.x; ent.y = p.y;
        ent.path.shift();
        budget -= d;
        if (d > 0.01) ent.dir = dirOf(dx, dy, ent.dir);
      } else {
        ent.x += dx / d * budget;
        ent.y += dy / d * budget;
        ent.dir = dirOf(dx, dy, ent.dir);
        budget = 0;
      }
      moved = true;
    }
    return moved;
  }

  const QUEUE_OFFSETS = [[[0, 0]], [[-11, -2], [12, 2]], [[-15, -3], [5, 1], [22, 4]], [[-15, -5], [8, -3], [-5, 9], [17, 11]]];

  class Game {
    constructor(opts = {}) {
      this.level = opts.level || P.LEVELS[0];
      this.seed = (opts.seed === undefined ? 1 : opts.seed) >>> 0;
      this.up = Object.assign({}, opts.upgrades || {});
      this.relaxed = !!opts.relaxed;
      this.noTips = !!opts.noTips;
      this.items = new Set(this.level.items);
      this.t = 0;
      this.phase = 'play';
      this.endT = 0;
      this.events = [];
      this.nextId = 1;
      this.flags = {};
      this.shownTips = new Set();
      this.modal = null;
      this.tipQueue = [];
      this.stats = { sales: 0, tips: 0, bonus: 0, penalty: 0, served: 0, lost: 0, turned: 0, groups: 0, bestCombo: 0, burnt: 0, fast: 0, vipOk: 0 };
      this.money = 0;
      this.combo = { n: 0, last: -99 };
      this.buildStations();
      this.buildTables();
      this.buildGrid();
      const kz = this.st.kazan;
      this.hero = {
        x: kz.use.x, y: USE_Y + 14, dir: 'down', path: [], queue: [], cur: null, busy: null,
        hands: [null, null], manual: { x: 0, y: 0 }, walkT: 0, moving: false
      };
      this.groups = [];
      this.queue = [];
      this.schedule = this.makeSchedule();
      this.spawnIdx = 0;
      this.clock = 0;
      this.tut = this.level.tutorial && !opts.skipTutorial ? { i: 0 } : null;
      this.updateTutorial();
    }

    get upKazanCap() { return TUNE.kazan.cap + 2 * (this.up.kazan || 0); }
    get heroSpeed() { return TUNE.heroSpeed * (1 + 0.12 * (this.up.boots || 0)); }
    get chopMult() { return [1, 0.8, 0.64][this.up.pchak || 0]; }
    get kazanMult() { return [1, 0.85, 0.72][this.up.saxaul || 0]; }
    get brewTime() { return TUNE.tea.brew * (this.up.samovar ? 0.6 : 1); }
    get bakeTime() { return TUNE.tandoor.bake * (this.up.tandoor ? 0.75 : 1); }
    get burnWindow() { return TUNE.tandoor.burnWindow * (this.up.tandoor ? 1.5 : 1); }
    get tipMult() { return this.up.sign ? 1.25 : 1; }

    emit(e) { this.events.push(e); }
    drain() { const e = this.events; this.events = []; return e; }
    sfx(id) { this.emit({ t: 'sfx', id }); }
    pop(x, y, text, col) { this.emit({ t: 'pop', x, y, text, col: col || 'white' }); }
    nope(text, x, y) { this.emit({ t: 'nope', text, x: x === undefined ? this.hero.x : x, y: y === undefined ? this.hero.y - 60 : y }); }

    buildStations() {
      this.st = {};
      this.stations = [];
      for (const d of STATIONS) {
        if (d.need.length && !d.need.some(i => this.items.has(i))) continue;
        const s = Object.assign({}, d, { use: { x: d.x + d.w / 2, y: USE_Y }, rect: { x: d.x, y: 92, w: d.w, h: 122 } });
        if (s.kind === 'kazan') Object.assign(s, { state: 'ready', t: 0, portions: Math.min(this.level.kazanStart === undefined ? 6 : this.level.kazanStart, this.upKazanCap), rect: { x: d.x, y: 84, w: d.w, h: 130 } });
        if (s.kind === 'tea') Object.assign(s, { state: 'empty', t: 0, count: 0 });
        if (s.kind === 'compote') Object.assign(s, { servings: TUNE.compote.servings });
        if (s.kind === 'tandoor') Object.assign(s, { state: 'empty', t: 0, load: null });
        if (s.kind === 'stock') Object.assign(s, { count: 0 });
        if (s.kind === 'pass') Object.assign(s, { item: null });
        if (s.kind === 'kazan' && s.portions <= 0) s.state = 'empty';
        this.st[s.id] = s;
        this.stations.push(s);
      }
    }

    buildTables() {
      this.tables = [];
      this.tab = {};
      for (const d of TABLES) {
        if (!this.level.tables.includes(d.id)) continue;
        const k = TABLE_KINDS[d.kind];
        const t = {
          id: d.id, n: d.n, kind: d.kind, cap: k.cap, x: d.x, y: d.y,
          rect: { x: d.x + k.rect[0], y: d.y + k.rect[1], w: k.rect[2], h: k.rect[3] },
          hit: { x: d.x + k.hit[0], y: d.y + k.hit[1], w: k.hit[2], h: k.hit[3] },
          use: { x: d.x + k.use[0], y: d.y + k.use[1] },
          bubble: { x: d.x + k.bubble[0], y: d.y + k.bubble[1] },
          seats: k.seats.map(s => ({ x: d.x + s.dx, y: d.y + s.dy, dir: s.dir, pose: s.pose })),
          group: null, dirty: false, food: [], mess: 0
        };
        this.tables.push(t);
        this.tab[t.id] = t;
      }
    }

    buildGrid() {
      const g = new Grid(P.W, P.H);
      g.open(FLOOR.x0, FLOOR.y0, FLOOR.x1, FLOOR.y1);
      g.open(-8, 488, FLOOR.x0 + 8, 530);
      for (const t of this.tables) g.close(t.rect.x - HERO_R, t.rect.y - HERO_R, t.rect.x + t.rect.w + HERO_R, t.rect.y + t.rect.h + HERO_R);
      for (const d of DECOR) g.close(d.x - HERO_R, d.y - HERO_R, d.x + d.w + HERO_R, d.y + d.h + HERO_R);
      this.grid = g;
    }

    makeSchedule() {
      const L = this.level;
      const r = rng(this.seed ^ hash('schedule' + L.n));
      const list = [];
      for (const [start, count, dur] of L.waves) {
        for (let i = 0; i < count; i++) {
          const gap = count > 1 ? dur / (count - 1) : 0;
          const jit = count > 1 ? (r() - 0.5) * gap * 0.3 : 0;
          list.push({ t: Math.max(0.5, start + gap * i + jit), type: weighted(r, L.mix) });
        }
      }
      for (const s of L.special || []) list.push({ t: s.at, type: s.type, plov: s.plov, special: true });
      list.sort((a, b) => a.t - b.t);
      for (const e of list) {
        const T = TYPES[e.type];
        const lo = Math.min(T.size[0], L.sizeMax), hi = Math.min(T.size[1], L.sizeMax);
        e.size = lo + Math.floor(r() * (hi - lo + 1));
        e.order = this.makeOrder(r, e.type, e.size, e.plov);
        e.second = !T.vip && !T.courier && L.second > 0 && r() < L.second * T.second;
        e.order2 = e.second ? this.makeSecond(r, e.type) : null;
        if (e.order2 && !e.order2.length) { e.second = false; e.order2 = null; }
        e.seed = Math.floor(r() * 1e9);
      }
      return list;
    }

    available(list) { return list.filter(i => this.items.has(i)); }

    makeOrder(r, type, size, plovN) {
      const L = this.level, T = TYPES[type];
      if (T.courier) return new Array(plovN || 2).fill('plov');
      const items = ['plov'];
      if (size >= 3 && r() < T.big) items.push('plov');
      const ex = this.available(EXTRAS), dr = this.available(DRINKS);
      const pickFrom = (pool, weights) => {
        const w = {};
        for (const i of pool) w[i] = (weights && weights[i]) || 0.5;
        return weighted(r, w);
      };
      if (T.vip) {
        if (ex.length) items.push(pickFrom(ex, T.extras));
        if (dr.length) items.push(pickFrom(dr, T.drinks));
        return items;
      }
      const extras = [];
      const pe = L.extra * T.extra;
      if (ex.length && r() < pe) extras.push(pickFrom(ex, T.extras));
      if (size >= 3 && ex.length > 1 && r() < pe * 0.6) {
        const rest = ex.filter(i => !extras.includes(i));
        if (rest.length) extras.push(pickFrom(rest, T.extras));
      }
      let drink = null;
      if (dr.length && r() < L.drink * T.drink) drink = pickFrom(dr, T.drinks);
      const out = items.concat(extras);
      if (drink) out.push(drink);
      const cap = Math.min(L.maxItems, size + 1);
      while (out.length > cap) {
        const k = out.findIndex((i, n) => n > 0 && EXTRAS.includes(i));
        out.splice(k >= 0 ? k : out.length - 1, 1);
      }
      return out;
    }

    makeSecond(r, type) {
      const T = TYPES[type];
      const out = [];
      const dr = this.available(DRINKS), ex = this.available(['samsa', 'non']);
      if (dr.length) {
        const w = {};
        for (const i of dr) w[i] = (T.drinks[i] || 0.5);
        out.push(weighted(r, w));
      }
      if (ex.length && (!out.length || r() < 0.3)) out.push(pick(r, ex));
      return out;
    }

    update(dt) {
      if (this.phase === 'end') return;
      if (this.modal) return;
      this.t += dt;
      this.updateSpawns(dt);
      this.updateStations(dt);
      this.updateHero(dt);
      this.updateGroups(dt);
      this.updateTutorial();
      this.updateTips();
      if (this.phase === 'play' && this.spawnIdx >= this.schedule.length && !this.groups.length) {
        this.phase = 'ending';
        this.endT = 1.4;
      }
      if (this.phase === 'ending') {
        this.endT -= dt;
        if (this.endT <= 0) this.finish();
      }
    }

    finish() {
      this.phase = 'end';
      const L = this.level;
      const mid = Math.round((L.target + L.expert) / 2 / 10) * 10;
      this.result = {
        money: this.money,
        stars: this.money >= L.expert ? 3 : this.money >= mid ? 2 : this.money >= L.target ? 1 : 0,
        passed: this.money >= L.target,
        mid,
        stats: Object.assign({}, this.stats)
      };
      this.emit({ t: 'end', result: this.result });
    }

    holding() { return this.spawnIdx > 0 && !!(this.tut && this.tutStep() && this.tutStep().hold); }

    updateSpawns(dt) {
      if (!this.holding()) this.clock += dt;
      while (this.spawnIdx < this.schedule.length && this.schedule[this.spawnIdx].t <= this.clock) {
        this.spawn(this.schedule[this.spawnIdx]);
        this.spawnIdx++;
      }
    }

    spawn(e) {
      const T = TYPES[e.type];
      const g = {
        id: this.nextId++, type: e.type, T, size: e.size, vip: !!T.vip, courier: !!T.courier,
        state: 'arrive', t: 0, patience: TUNE.hearts, members: [], table: null, slot: -1,
        order: null, pending: e.order.slice(), pending2: e.order2 ? e.order2.slice() : null,
        round: 0, bill: 0, fastUntil: 0, line: null, lineT: 0, lineCd: 3 + (e.seed % 7), mood: 'ok', seed: e.seed,
        angryT: 0, served: []
      };
      this.stats.groups++;
      for (let i = 0; i < e.size; i++) {
        g.members.push({ i, x: GATE.x - i * 16, y: GATE.y + (i % 2) * 8, dir: 'right', path: [], pose: 'walk', seat: null, walkT: Math.random() * 10, look: { type: e.type, seed: (e.seed + i * 7919) >>> 0, idx: i, kid: e.type === 'family' && i >= 2 } });
      }
      this.groups.push(g);
      this.flags['type:' + e.type] = true;
      if (e.size >= 3) this.flags['size:3'] = true;
      if (g.courier) {
        g.state = 'toTake';
        this.walkGroup(g, [{ x: TAKEAWAY.x, y: TAKEAWAY.y }]);
        this.sfx('arrive');
        return;
      }
      const cap = TUNE.queueCap;
      if (this.queue.length >= cap && !g.vip) {
        g.state = 'turned';
        this.stats.turned++;
        this.stats.lost++;
        this.pop(40, 470, 'Мест нет!', 'red');
        this.walkGroupOut(g);
        this.resetCombo();
        return;
      }
      if (g.vip) this.queue.unshift(g); else this.queue.push(g);
      if (this.queue.length > cap) {
        const out = this.queue.pop();
        out.state = 'turned';
        this.stats.turned++;
        this.stats.lost++;
        this.walkGroupOut(out);
      }
      this.layoutQueue();
      this.sfx(g.vip ? 'vip' : 'arrive');
    }

    layoutQueue() {
      this.queue.forEach((g, k) => {
        g.slot = k;
        const q = QUEUE[k];
        const offs = QUEUE_OFFSETS[g.size - 1];
        g.members.forEach((m, i) => {
          const tx = q.x + offs[i][0], ty = q.y + offs[i][1];
          if (Math.hypot(m.tx - tx, m.ty - ty) < 1 && (m.path.length || Math.hypot(m.x - tx, m.y - ty) < 1)) return;
          m.tx = tx; m.ty = ty;
          m.path = this.grid.path(m.x, m.y, tx, ty);
        });
      });
    }

    walkGroup(g, targets) {
      g.members.forEach((m, i) => {
        const tg = targets[Math.min(i, targets.length - 1)];
        const tx = tg.x + (targets.length === 1 ? (i - (g.size - 1) / 2) * 16 : 0), ty = tg.y;
        m.tx = tx; m.ty = ty;
        m.path = this.grid.path(m.x, m.y, tx, ty);
        if (!this.grid.free(tx, ty)) m.path.push({ x: tx, y: ty });
        m.pose = 'walk';
      });
    }

    walkGroupOut(g) {
      g.members.forEach((m, i) => {
        m.seat = null;
        m.pose = 'walk';
        const p = this.grid.path(m.x, m.y, 4, 508 + (i % 2) * 8);
        p.push({ x: GATE.x - 10 - i * 10, y: 508 + (i % 2) * 8 });
        m.path = p;
        m.tx = GATE.x; m.ty = 508;
      });
    }

    groupPos(g) {
      if (g.table) return { x: g.table.bubble.x, y: g.table.bubble.y };
      const xs = g.members.map(m => m.x), ys = g.members.map(m => m.y);
      return { x: xs.reduce((a, b) => a + b, 0) / xs.length, y: Math.min(...ys) - 74 };
    }

    say(g, list, force) {
      if (!list || !list.length) return;
      if (!force && g.lineT > 0) return;
      g.line = list[Math.floor(Math.random() * list.length)];
      g.lineT = 2.6;
    }

    decayRate(g) {
      const L = this.level, D = TUNE.decay;
      let base = 0;
      if (g.state === 'arrive' || g.state === 'queue') base = D.queue * (this.up.radio ? 0.7 : 1);
      else if (g.courier && g.state === 'waitFood') base = D.courier;
      else if (g.state === 'waitOrder') base = D.waitOrder;
      else if (g.state === 'waitFood') base = D.waitFood;
      else if (g.state === 'waitPay') base = D.waitPay;
      if (!base) return 0;
      if (g.table && this.up.kurpacha) base *= 0.8;
      return base * g.T.decay * (L.decay || 1) * (this.relaxed ? 0.65 : 1);
    }

    updateGroups(dt) {
      for (const g of this.groups.slice()) {
        g.t += dt;
        if (g.lineT > 0) g.lineT -= dt;
        if (g.angryT > 0) g.angryT -= dt;
        let moving = false;
        for (const m of g.members) {
          m.walkT += dt;
          const sp = TUNE.guestSpeed * g.T.walk * (g.state === 'angry' ? 1.35 : 1) * (m.look.kid ? 1.1 : 1);
          if (m.path.length) { stepAlong(m, sp, dt); moving = true; m.pose = 'walk'; }
          else if (m.seat) { m.pose = m.seat.pose; m.dir = m.seat.dir; }
          else if (m.pose === 'walk') { m.pose = 'stand'; if (g.state === 'queue' || g.state === 'arrive') m.dir = 'right'; }
        }
        const rate = this.decayRate(g);
        if (rate) {
          const before = g.patience;
          g.patience = Math.max(0, g.patience - rate * dt);
          if (before > 2 && g.patience <= 2) { g.mood = 'impatient'; if (g.state === 'waitFood' && g.order && g.order.need.includes('plov')) this.say(g, TEXT.lines.waitPlov, true); }
          if (before > 1 && g.patience <= 1) { g.mood = 'angry'; g.angryT = 1.2; this.sfx('grumble'); }
          if (g.patience <= 0) { this.leaveAngry(g); continue; }
          if (g.patience > 2) g.mood = 'ok';
        }
        g.lineCd -= dt;
        if (g.lineCd <= 0) {
          g.lineCd = 7 + Math.random() * 9;
          if (g.type === 'business' && g.state !== 'leave') this.say(g, TEXT.lines.business);
          else if (g.type === 'critic' && g.state === 'eat') this.say(g, TEXT.lines.critic);
          else if (g.type === 'courier' && g.state === 'waitFood') this.say(g, TEXT.lines.courier);
          else if (g.type === 'family' && g.state === 'waitFood' && g.patience < 3.5) this.say(g, TEXT.lines.kid);
        }
        switch (g.state) {
          case 'arrive':
            if (!moving) g.state = 'queue';
            break;
          case 'toTake':
            if (!moving) {
              g.state = 'waitFood';
              g.order = { items: g.pending.slice(), need: g.pending.slice(), round: 1 };
              g.round = 1;
              g.fastUntil = this.t + TUNE.fastBase + TUNE.fastItem * g.order.items.length;
              g.members.forEach(m => { m.dir = 'right'; });
              this.say(g, TEXT.lines.courier, true);
            }
            break;
          case 'toTable':
            if (!moving) { g.state = 'menu'; g.t = 0; }
            break;
          case 'menu':
            if (g.t >= TUNE.read * g.T.read) { g.state = 'waitOrder'; g.t = 0; this.sfx('hand'); }
            break;
          case 'eat':
            if (g.t >= g.eatTime) {
              g.t = 0;
              if (g.pending2 && g.round === 1) {
                g.state = 'waitOrder';
                g.pending = g.pending2;
                g.pending2 = null;
                this.flags.second = true;
                this.secondTable = g.table;
                this.sfx('hand');
              } else {
                g.state = 'waitPay';
                this.sfx('bill');
              }
              if (g.table) g.table.food = g.table.food.map(f => Object.assign(f, { eaten: true }));
            }
            break;
          case 'leave':
          case 'angry':
          case 'turned':
            if (!moving) this.removeGroup(g);
            break;
        }
      }
    }

    removeGroup(g) {
      this.groups = this.groups.filter(x => x !== g);
      this.queue = this.queue.filter(x => x !== g);
      if (this.selected === g) this.selected = null;
    }

    leaveAngry(g) {
      const wasQueue = this.queue.includes(g);
      this.queue = this.queue.filter(x => x !== g);
      const pos = this.groupPos(g);
      let pen = TUNE.angryPerHead * g.size;
      if (g.vip) pen = TUNE.vipFail;
      if (g.courier) pen = TUNE.courierFail;
      this.money -= pen;
      this.stats.penalty += pen;
      this.stats.lost++;
      this.pop(pos.x, pos.y, '−' + P.money(pen), 'red');
      this.say(g, TEXT.lines.angry, true);
      this.sfx('angry');
      this.emit({ t: 'angry', x: pos.x, y: pos.y + 40 });
      this.resetCombo();
      if (g.table) {
        const tb = g.table;
        tb.group = null;
        tb.dirty = tb.food.length > 0 || g.round > 0;
        if (!tb.dirty) tb.food = [];
        g.table = null;
      }
      g.state = 'angry';
      g.mood = 'angry';
      this.walkGroupOut(g);
      if (wasQueue) this.layoutQueue();
      if (this.selected === g) this.selected = null;
    }

    resetCombo() { this.combo.n = 0; this.combo.last = -99; }

    tickCombo(x, y) {
      if (this.t - this.combo.last <= TUNE.comboWindow) this.combo.n = Math.min(TUNE.comboMax, this.combo.n + 1);
      else this.combo.n = 1;
      this.combo.last = this.t;
      this.stats.bestCombo = Math.max(this.stats.bestCombo, this.combo.n);
      if (this.combo.n >= 2) {
        const bonus = TUNE.comboStep * this.combo.n;
        this.money += bonus;
        this.stats.bonus += bonus;
        this.emit({ t: 'combo', n: this.combo.n, bonus, x, y });
      }
    }

    comboLeft() { return Math.max(0, TUNE.comboWindow - (this.t - this.combo.last)) / TUNE.comboWindow; }

    seat(gid, tid) {
      const g = this.groups.find(x => x.id === gid);
      const tb = this.tab[tid];
      if (!g || !tb || !this.queue.includes(g)) return false;
      const failAt = (msg) => { this.nope(msg, tb.bubble.x, tb.bubble.y + 30); return false; };
      if (tb.group) return failAt(TEXT.nope.taken);
      if (tb.dirty) return failAt(TEXT.nope.dirty);
      if (g.size > tb.cap) return failAt(TEXT.nope.small);
      this.queue = this.queue.filter(x => x !== g);
      g.table = tb;
      tb.group = g;
      tb.food = [];
      g.state = 'toTable';
      g.t = 0;
      g.patience = Math.min(TUNE.hearts, g.patience + TUNE.bonus.seat);
      g.members.forEach((m, i) => {
        const s = tb.seats[i];
        m.seat = s;
        m.path = this.grid.path(m.x, m.y, s.x, s.y + 14);
        m.path.push({ x: s.x, y: s.y });
      });
      this.layoutQueue();
      this.flags.seat = true;
      this.sfx('seat');
      this.tickCombo(tb.bubble.x, tb.bubble.y);
      if (this.selected === g) this.selected = null;
      return true;
    }

    freeHand() { return this.hero.hands.indexOf(null); }
    handCount(item) { return this.hero.hands.filter(h => h === item).length; }
    give(item) { const i = this.freeHand(); if (i < 0) return false; this.hero.hands[i] = item; return true; }
    takeFromHands(item) { const i = this.hero.hands.lastIndexOf(item); if (i < 0) return false; this.hero.hands[i] = null; return true; }
    heldFood() { return this.hero.hands.filter(h => h && FOOD.includes(h)); }

    targetInfo(id) {
      if (this.st[id]) return { kind: 'station', s: this.st[id], use: this.st[id].use, face: 'up' };
      if (this.tab[id]) return { kind: 'table', tb: this.tab[id], use: this.tab[id].use, face: 'up' };
      if (/^g\d+$/.test(id)) {
        const g = this.groups.find(x => x.id === +id.slice(1));
        if (g && g.courier) return { kind: 'courier', g, use: { x: TAKEAWAY.x + 30, y: TAKEAWAY.y }, face: 'left' };
      }
      if (/^floor:/.test(id)) {
        const [x, y] = id.slice(6).split(',').map(Number);
        return { kind: 'floor', use: { x, y }, face: null };
      }
      return null;
    }

    click(id) {
      const info = this.targetInfo(id);
      if (!info) return false;
      const h = this.hero;
      if (h.queue.length >= TUNE.queueMax) { this.nope('Ошпаз помнит только пять дел'); return false; }
      h.queue.push({ id });
      this.emit({ t: 'queued', id });
      return true;
    }

    clearQueue() {
      const h = this.hero;
      h.queue = [];
      if (h.cur && !h.busy) { h.cur = null; h.path = []; }
    }

    setMove(x, y) {
      const h = this.hero;
      h.manual.x = x; h.manual.y = y;
      if ((x || y) && (h.queue.length || h.cur) && !h.busy) { h.queue = []; h.cur = null; h.path = []; }
    }

    focus() {
      const h = this.hero;
      let best = null, bd = 40;
      const test = (id, use) => {
        const d = dist(h.x, h.y, use.x, use.y);
        if (d < bd) { bd = d; best = id; }
      };
      for (const s of this.stations) test(s.id, s.use);
      for (const t of this.tables) test(t.id, t.use);
      for (const g of this.groups) if (g.courier && g.state === 'waitFood') test('g' + g.id, { x: TAKEAWAY.x + 30, y: TAKEAWAY.y });
      for (const g of this.queue) {
        const q = QUEUE[g.slot];
        if (q && dist(h.x, h.y, q.x + 36, q.y) < 44 && dist(h.x, h.y, q.x + 36, q.y) < bd + 6) { bd = dist(h.x, h.y, q.x + 36, q.y); best = 'q' + g.id; }
      }
      return best;
    }

    interact() {
      const h = this.hero;
      if (h.busy) return null;
      const id = this.focus();
      if (!id) return null;
      if (id[0] === 'q') return { select: +id.slice(1) };
      h.queue = [];
      h.cur = { id };
      h.path = [];
      this.arrive();
      return { acted: id };
    }

    updateHero(dt) {
      const h = this.hero;
      h.moving = false;
      if (h.busy) {
        h.busy.t += dt;
        if (h.busy.t >= h.busy.dur) {
          const b = h.busy;
          h.busy = null;
          b.apply();
        }
        return;
      }
      if (h.manual.x || h.manual.y) {
        const len = Math.hypot(h.manual.x, h.manual.y) || 1;
        const sp = this.heroSpeed * dt;
        const nx = h.x + h.manual.x / len * sp, ny = h.y + h.manual.y / len * sp;
        if (this.grid.free(nx, h.y)) h.x = nx;
        if (this.grid.free(h.x, ny)) h.y = ny;
        h.dir = dirOf(h.manual.x, h.manual.y, h.dir);
        h.moving = true;
        h.walkT += dt;
        return;
      }
      if (!h.cur && h.queue.length) {
        h.cur = h.queue.shift();
        const info = this.targetInfo(h.cur.id);
        if (!info) { h.cur = null; return; }
        h.path = this.grid.path(h.x, h.y, info.use.x, info.use.y);
      }
      if (h.cur) {
        if (h.path.length) {
          stepAlong(h, this.heroSpeed, dt);
          h.moving = true;
          h.walkT += dt;
        }
        if (!h.path.length) this.arrive();
      }
    }

    arrive() {
      const h = this.hero;
      const cur = h.cur;
      h.cur = null;
      const info = this.targetInfo(cur.id);
      if (!info) return;
      if (info.face) h.dir = info.face;
      if (info.kind === 'floor') return;
      const res = this.perform(cur.id, info);
      if (!res) return;
      if (res.fail) { this.nope(res.fail); this.sfx('nope'); return; }
      h.busy = { id: cur.id, t: 0, dur: res.dur, anim: res.anim || 'use', apply: res.apply };
      if (res.sfx) this.sfx(res.sfx);
    }

    perform(id, info) {
      if (info.kind === 'station') return this.stationAct(info.s);
      if (info.kind === 'table') return this.tableAct(info.tb);
      if (info.kind === 'courier') return this.courierAct(info.g);
      return null;
    }

    stationAct(s) {
      const A = TUNE.act, N = TEXT.nope;
      const free = this.freeHand() >= 0;
      switch (s.kind) {
        case 'kazan': return this.kazanAct(s);
        case 'chop':
          if (!free) return { fail: N.handsFull };
          return {
            dur: (s.item === 'veg' ? A.chopVeg : A.chopSalad) * this.chopMult, anim: 'chop', sfx: 'chop',
            apply: () => { this.give(s.item); this.flags[s.item === 'veg' ? 'veg' : 'salad'] = true; this.sfx('plate'); }
          };
        case 'tea':
          if (s.state === 'empty') return { dur: A.teaBrew, anim: 'pour', sfx: 'pour', apply: () => { s.state = 'brew'; s.t = this.brewTime; } };
          if (s.state === 'brew') return { fail: N.brewing };
          if (!free) return { fail: N.handsFull };
          return { dur: A.teaTake, anim: 'take', apply: () => { if (s.state !== 'ready' || !this.give(s.item)) return; s.count--; if (s.count <= 0) s.state = 'empty'; this.sfx('cup'); } };
        case 'compote':
          if (s.servings <= 0) return { dur: A.compoteRefill, anim: 'pour', sfx: 'pour', apply: () => { s.servings = TUNE.compote.servings; } };
          if (!free) return { fail: N.handsFull };
          return { dur: A.compotePour, anim: 'pour', sfx: 'pour', apply: () => { s.servings--; this.give('compote'); } };
        case 'tandoor':
          if (s.state === 'empty') {
            const load = this.tandoorLoad();
            return { dur: A.tandoorLoad, anim: 'bake', sfx: 'whoosh', apply: () => { s.state = 'bake'; s.t = this.bakeTime; s.load = load; this.flags.tandoorLoad = true; } };
          }
          if (s.state === 'bake') return { fail: N.baking };
          if (s.state === 'done') {
            const cap = TUNE.tandoor.stockCap;
            for (const [k, n] of Object.entries(s.load)) {
              const stock = this.st[k === 'samsa' ? 'stockSamsa' : 'stockNon'];
              if (stock && stock.count + n > cap) return { fail: N.stockFull };
            }
            return {
              dur: A.tandoorTake, anim: 'bake', apply: () => {
                if (s.state !== 'done') return;
                for (const [k, n] of Object.entries(s.load)) {
                  const stock = this.st[k === 'samsa' ? 'stockSamsa' : 'stockNon'];
                  if (stock) stock.count += n;
                }
                s.state = 'empty'; s.load = null;
                this.sfx('plate');
              }
            };
          }
          return { dur: A.tandoorClean, anim: 'clean', sfx: 'scrub', apply: () => { s.state = 'empty'; s.load = null; } };
        case 'stock':
          if (s.count <= 0) return { fail: N.emptyStock };
          if (!free) return { fail: N.handsFull };
          return { dur: A.stockTake, anim: 'take', apply: () => { if (s.count > 0) { s.count--; this.give(s.item); this.sfx('plate'); } } };
        case 'pass': {
          const h = this.hero;
          if (s.item) {
            if (!free) return { fail: N.handsFull };
            return { dur: A.passTake, anim: 'take', apply: () => { if (s.item && this.give(s.item)) { s.item = null; this.sfx('plate'); } } };
          }
          const k = h.hands[1] ? 1 : h.hands[0] ? 0 : -1;
          if (k < 0) return { fail: N.passEmpty };
          return { dur: A.passPut, anim: 'take', apply: () => { if (!s.item && h.hands[k]) { s.item = h.hands[k]; h.hands[k] = null; this.flags.pass = true; this.sfx('plate'); } } };
        }
        case 'bin': {
          const h = this.hero;
          const k = h.hands[1] ? 1 : h.hands[0] ? 0 : -1;
          if (k < 0) return { fail: N.nothing };
          return { dur: A.bin, anim: 'take', apply: () => { const it = h.hands[k]; h.hands[k] = null; this.pop(s.use.x, s.use.y - 70, 'Выброшено: ' + ITEMS[it].short, 'grey'); this.sfx('bin'); } };
        }
      }
      return null;
    }

    tandoorLoad() {
      const hasS = this.items.has('samsa'), hasN = this.items.has('non');
      if (hasS && hasN) return { samsa: 2, non: 2 };
      if (hasS) return { samsa: 4 };
      return { non: 4 };
    }

    kazanAct(s) {
      const A = TUNE.act, N = TEXT.nope, K = TUNE.kazan;
      const m = this.kazanMult;
      switch (s.state) {
        case 'empty':
          return { dur: A.kazanStart, anim: 'stir', sfx: 'sizzle', apply: () => { if (s.state !== 'empty') return; s.state = 'fry'; s.t = K.fry * m; this.flags.kazanStart = true; } };
        case 'needVeg':
          if (!this.hero.hands.includes('veg')) return { fail: N.needVeg };
          return { dur: A.kazanVeg, anim: 'stir', sfx: 'sizzle', apply: () => { if (s.state !== 'needVeg' || !this.takeFromHands('veg')) return; s.state = 'zirvak'; s.t = K.zirvak * m; this.flags.kazanVeg = true; } };
        case 'needRice':
          return { dur: A.kazanRice, anim: 'stir', sfx: 'rice', apply: () => { if (s.state !== 'needRice') return; s.state = 'steam'; s.t = K.steam * m; this.flags.rice = true; } };
        case 'ready':
          if (this.freeHand() < 0) return { fail: N.handsFull };
          return {
            dur: A.kazanTake, anim: 'take', apply: () => {
              if (s.state !== 'ready' || s.portions <= 0 || !this.give('plov')) return;
              s.portions--;
              this.flags.takePlov = true;
              this.sfx('plate');
              if (s.portions <= 0) { s.state = 'empty'; this.flags.kazanEmpty = true; }
            }
          };
        case 'burnt':
          return { dur: A.kazanClean, anim: 'clean', sfx: 'scrub', apply: () => { s.state = 'empty'; } };
        default:
          return { fail: N.busyKazan };
      }
    }

    updateStations(dt) {
      const K = TUNE.kazan;
      const kz = this.st.kazan;
      if (kz) {
        const was = kz.state;
        if (['fry', 'zirvak', 'steam', 'needVeg', 'needRice'].includes(kz.state)) kz.t -= dt;
        if (kz.state === 'fry' && kz.t <= 0) { kz.state = 'needVeg'; kz.t = K.vegWindow; kz.win = K.vegWindow; this.sfx('ding'); }
        else if (kz.state === 'zirvak' && kz.t <= 0) { kz.state = 'needRice'; kz.t = K.riceWindow; kz.win = K.riceWindow; this.sfx('ding'); }
        else if (kz.state === 'steam' && kz.t <= 0) { kz.state = 'ready'; kz.portions = this.upKazanCap; this.sfx('ready'); this.pop(kz.use.x, 110, 'Плов готов!', 'gold'); }
        else if ((kz.state === 'needVeg' || kz.state === 'needRice') && kz.t <= 0) {
          kz.state = 'burnt';
          this.money -= TUNE.burnKazan;
          this.stats.penalty += TUNE.burnKazan;
          this.stats.burnt++;
          this.pop(kz.use.x, 110, 'Сгорело! −' + TUNE.burnKazan, 'red');
          this.sfx('burn');
        }
        if (was !== kz.state) this.emit({ t: 'kazan', state: kz.state });
      }
      for (const s of this.stations) {
        if (s.kind === 'tea' && s.state === 'brew') {
          s.t -= dt;
          if (s.t <= 0) { s.state = 'ready'; s.count = TUNE.tea.pots; this.sfx('ding'); }
        }
        if (s.kind === 'tandoor') {
          if (s.state === 'bake') {
            s.t -= dt;
            if (s.t <= 0) { s.state = 'done'; s.t = this.burnWindow; s.win = s.t; this.sfx('ding'); }
          } else if (s.state === 'done') {
            s.t -= dt;
            if (s.t <= 0) {
              s.state = 'burnt';
              this.money -= TUNE.burnTandoor;
              this.stats.penalty += TUNE.burnTandoor;
              this.stats.burnt++;
              this.pop(s.use.x, 110, 'Подгорело! −' + TUNE.burnTandoor, 'red');
              this.sfx('burn');
            }
          }
        }
      }
    }

    tableAct(tb) {
      const A = TUNE.act, N = TEXT.nope;
      const g = tb.group;
      if (!g) {
        if (!tb.dirty) return { fail: N.clean };
        return {
          dur: A.clean, anim: 'clean', sfx: 'dishes', apply: () => {
            if (!tb.dirty || tb.group) return;
            tb.dirty = false; tb.food = [];
            this.flags.clean = true;
            this.tickCombo(tb.bubble.x, tb.bubble.y);
          }
        };
      }
      switch (g.state) {
        case 'toTable': return { fail: N.walking };
        case 'menu': return { fail: N.reading };
        case 'eat': return { fail: N.eating };
        case 'waitOrder':
          return { dur: A.order, anim: 'order', sfx: 'paper', apply: () => { if (g.state === 'waitOrder' && tb.group === g) this.takeOrder(g); } };
        case 'waitFood': return this.deliverAct(g, tb.bubble);
        case 'waitPay':
          return { dur: A.pay, anim: 'pay', apply: () => { if (g.state === 'waitPay' && tb.group === g) this.collect(g); } };
      }
      return null;
    }

    courierAct(g) {
      if (g.state !== 'waitFood') return { fail: TEXT.nope.walking };
      return this.deliverAct(g, this.groupPos(g));
    }

    deliverAct(g, at) {
      const N = TEXT.nope;
      const held = this.heldFood();
      if (!held.length) return { fail: N.nothing };
      const need = g.order.need.slice();
      const give = [];
      for (const it of held) {
        const k = need.indexOf(it);
        if (k >= 0) { give.push(it); need.splice(k, 1); }
      }
      if (!give.length) return { fail: N.notOrdered };
      return {
        dur: TUNE.act.deliver * give.length, anim: 'serve', apply: () => {
          if (g.state !== 'waitFood') return;
          for (const it of give) {
            const k = g.order.need.indexOf(it);
            if (k < 0 || !this.takeFromHands(it)) continue;
            g.order.need.splice(k, 1);
            g.bill += ITEMS[it].price;
            g.patience = Math.min(TUNE.hearts, g.patience + TUNE.bonus.deliver);
            if (g.table) g.table.food.push({ item: it, eaten: false });
            g.served.push(it);
            this.flags.deliver = true;
            if (it === 'plov') this.flags.deliverPlov = true;
          }
          this.sfx('serve');
          this.emit({ t: 'hearts', x: at.x, y: at.y + 20 });
          this.tickCombo(at.x, at.y);
          if (!g.order.need.length) this.orderDone(g, at);
        }
      };
    }

    orderDone(g, at) {
      const price = g.order.items.reduce((s, it) => s + ITEMS[it].price, 0);
      if (this.t <= g.fastUntil) {
        const fast = Math.round(price * TUNE.fastPct / 10) * 10;
        this.money += fast;
        this.stats.bonus += fast;
        this.stats.fast++;
        this.pop(at.x, at.y - 12, 'Быстро! +' + P.money(fast), 'gold');
      }
      if (g.courier) { this.collect(g); return; }
      g.state = 'eat';
      g.t = 0;
      g.eatTime = (TUNE.eatBase + TUNE.eatItem * g.order.items.length) * (g.T.eat || 1);
      g.patience = Math.min(TUNE.hearts, g.patience + TUNE.bonus.eat);
      g.mood = 'ok';
    }

    takeOrder(g) {
      g.round++;
      g.order = { items: g.pending.slice(), need: g.pending.slice(), round: g.round };
      g.pending = [];
      g.state = 'waitFood';
      g.t = 0;
      g.patience = Math.min(TUNE.hearts, g.patience + TUNE.bonus.order);
      g.fastUntil = this.t + TUNE.fastBase + TUNE.fastItem * g.order.items.length;
      this.flags.order = true;
      for (const it of g.order.items) this.flags['item:' + it] = true;
      const pos = this.groupPos(g);
      this.tickCombo(pos.x, pos.y);
    }

    collect(g) {
      const pos = this.groupPos(g);
      const mood = clamp(g.patience / TUNE.hearts, 0, 1);
      const tip = Math.round(TUNE.tipPerHead * g.size * g.T.tip * Math.pow(mood, 1.5) * this.tipMult / 5) * 5;
      const bill = g.bill;
      this.money += bill + tip;
      this.stats.sales += bill;
      this.stats.tips += tip;
      this.stats.served++;
      this.emit({ t: 'cash', x: pos.x, y: pos.y + 20, amount: bill, tip });
      this.sfx('coins');
      if (g.vip && g.patience >= 4) {
        this.money += TUNE.vipBonus;
        this.stats.bonus += TUNE.vipBonus;
        this.stats.vipOk++;
        this.pop(pos.x, pos.y - 30, 'Пять звёзд в «Ош-хабар»! +' + P.money(TUNE.vipBonus), 'gold');
        this.sfx('fanfare');
      }
      this.say(g, g.type === 'elder' ? TEXT.lines.elder : TEXT.lines.happy, true);
      this.flags.pay = true;
      if (g.table) {
        const tb = g.table;
        tb.group = null;
        tb.dirty = true;
        g.table = null;
      }
      if (!g.courier) this.tickCombo(pos.x, pos.y);
      g.state = 'leave';
      g.mood = 'happy';
      this.walkGroupOut(g);
    }

    updateTutorial() {
      if (!this.tut) return;
      for (;;) {
        const s = TUTORIAL[this.tut.i];
        if (!s) { this.tut = null; this.modal = null; return; }
        if (s.click) {
          if (!this.tut.acked) { this.modal = { kind: 'tut', step: s, text: TEXT.tut[s.id] }; return; }
          this.tut.acked = false;
          this.tut.i++;
          this.modal = null;
          continue;
        }
        if (s.until && this.flags[s.until]) { this.tut.i++; continue; }
        if (s.trigger && !this.tutCond(s.trigger)) return;
        return;
      }
    }

    tutCond(c) {
      const kz = this.st.kazan;
      if (c === 'kazanEmpty') return kz.state === 'empty';
      if (c === 'needVeg') return kz.state === 'needVeg';
      if (c === 'needRice') return kz.state === 'needRice';
      return true;
    }

    tutStep() {
      if (!this.tut) return null;
      const s = TUTORIAL[this.tut.i];
      if (!s) return null;
      if (s.trigger && !this.tutCond(s.trigger)) return null;
      return s;
    }

    tutText() { const s = this.tutStep(); return s ? TEXT.tut[s.id] : null; }

    ack() {
      if (!this.modal) return;
      if (this.modal.kind === 'tut') { this.tut.acked = true; this.modal = null; this.updateTutorial(); return; }
      this.modal = null;
      this.updateTips();
    }

    updateTips() {
      if (this.noTips || this.modal || this.tut) return;
      for (const tip of this.level.tips || []) {
        if (this.shownTips.has(tip.id)) continue;
        let ok = false;
        if (tip.when === 'start') ok = this.t > 0.6;
        else if (tip.when === 'handsFull') ok = this.hero.hands[0] && this.hero.hands[1] && this.t > 5;
        else ok = !!this.flags[tip.when];
        if (!ok) continue;
        this.shownTips.add(tip.id);
        this.modal = { kind: 'tip', tip, text: TEXT.tips[tip.id], arrow: tip.arrow };
        return;
      }
    }

    arrowPos(name) {
      if (!name) return null;
      if (this.st[name]) { const s = this.st[name]; return { x: s.use.x, y: s.rect.y + 4 }; }
      if (name === 'queue') {
        const g = this.queue.find(x => x.type === 'critic') || this.queue.find(x => x.type === 'business') || this.queue[0];
        const q = g ? QUEUE[g.slot] : QUEUE[0];
        return { x: q.x + 4, y: q.y - 62 };
      }
      if (name === 'firstTable') {
        const g = this.groups.find(x => x.table) || null;
        const tb = g ? g.table : this.tables.find(t => t.dirty);
        return tb ? { x: tb.x, y: tb.bubble.y + 6 } : null;
      }
      if (name === 'dirtyTable') { const tb = this.tables.find(t => t.dirty); return tb ? { x: tb.x, y: tb.bubble.y + 6 } : null; }
      if (name === 'firstTopchan') { const tb = this.tables.find(t => t.kind === 'topchan'); return tb ? { x: tb.x, y: tb.bubble.y + 6 } : null; }
      if (name === 'secondTable') { const tb = this.secondTable; return tb ? { x: tb.x, y: tb.bubble.y + 6 } : null; }
      if (name === 'courier') { const g = this.groups.find(x => x.courier); return g ? { x: g.members[0].x, y: g.members[0].y - 70 } : { x: TAKEAWAY.x, y: TAKEAWAY.y - 70 }; }
      return null;
    }

    describe(id) {
      const info = this.targetInfo(id);
      if (!info) return null;
      if (info.kind === 'station') {
        const s = info.s;
        const name = s.name;
        let act = '';
        if (s.kind === 'kazan') act = { empty: 'заложить мясо', fry: 'мясо жарится', needVeg: 'добавить морковь с луком', zirvak: 'зирвак томится', needRice: 'засыпать рис', steam: 'плов под крышкой', ready: 'взять ляган (' + s.portions + ')', burnt: 'отчистить' }[s.state];
        else if (s.kind === 'chop') act = s.item === 'veg' ? 'нарезать морковь с луком' : 'нарезать ачичук';
        else if (s.kind === 'tea') act = { empty: 'заварить', brew: 'заваривается', ready: 'взять чайник (' + s.count + ')' }[s.state];
        else if (s.kind === 'compote') act = s.servings > 0 ? 'налить (' + s.servings + ')' : 'наполнить банку';
        else if (s.kind === 'tandoor') act = { empty: 'загрузить', bake: 'печётся', done: 'вынуть в корзины', burnt: 'отчистить' }[s.state];
        else if (s.kind === 'stock') act = s.count > 0 ? 'взять (' + s.count + ')' : 'пусто';
        else if (s.kind === 'pass') act = s.item ? 'взять: ' + ITEMS[s.item].short : 'поставить';
        else if (s.kind === 'bin') act = 'выбросить';
        return name + ': ' + act;
      }
      if (info.kind === 'table') {
        const tb = info.tb, g = tb.group;
        const head = 'Стол ' + tb.n + (tb.kind === 'topchan' ? ' (топчан)' : '');
        if (!g) return head + ': ' + (tb.dirty ? 'убрать посуду' : 'свободен');
        const st = { toTable: 'гости идут', menu: 'гости выбирают', waitOrder: 'принять заказ', waitFood: 'подать заказ', eat: 'гости едят', waitPay: 'получить деньги' }[g.state] || '';
        return head + ': ' + st;
      }
      if (info.kind === 'courier') return 'Тойчи: отдать плов';
      return null;
    }

    targets() {
      const out = [];
      for (const s of this.stations) out.push({ id: s.id, kind: 'station', rect: s.rect });
      for (const t of this.tables) out.push({ id: t.id, kind: 'table', rect: t.hit });
      for (const g of this.groups) {
        if (g.courier && (g.state === 'waitFood' || g.state === 'toTake')) {
          const m = g.members[0];
          out.push({ id: 'g' + g.id, kind: 'courier', rect: { x: m.x - 20, y: m.y - 62, w: 40, h: 68 } });
        }
      }
      for (const g of this.queue) {
        const xs = g.members.map(m => m.x), ys = g.members.map(m => m.y);
        const x0 = Math.min(...xs) - 16, x1 = Math.max(...xs) + 16, y0 = Math.min(...ys) - 58, y1 = Math.max(...ys) + 6;
        out.push({ id: 'q' + g.id, kind: 'queue', group: g, rect: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } });
      }
      return out;
    }

    targetAt(x, y) {
      const list = this.targets();
      let best = null;
      for (const t of list) {
        if (!P.inRect(x, y, t.rect)) continue;
        const pri = t.kind === 'queue' ? 3 : t.kind === 'courier' ? 2 : 1;
        const area = t.rect.w * t.rect.h;
        if (!best || pri > best.pri || (pri === best.pri && area < best.area)) best = { t, pri, area };
      }
      return best ? best.t : null;
    }
  }

  class Bot {
    constructor(game, opts = {}) {
      this.g = game;
      this.slow = opts.slow || 0;
      this.wait = 0;
      this.r = rng(opts.seed || 7);
    }

    tick(dt) {
      const g = this.g;
      if (g.modal) { g.ack(); return; }
      this.seatAll();
      const h = g.hero;
      if (h.busy || h.cur || h.queue.length) { this.wait = this.slow * (0.5 + this.r()); return; }
      if (this.wait > 0) { this.wait -= dt; return; }
      const act = this.choose();
      if (act) for (const id of [].concat(act)) g.click(id);
    }

    seatAll() {
      const g = this.g;
      for (const grp of g.queue.slice().sort((a, b) => (b.vip - a.vip) || (a.patience - b.patience))) {
        const free = g.tables.filter(t => !t.group && !t.dirty && t.cap >= grp.size).sort((a, b) => a.cap - b.cap || g.hero.y - a.y);
        if (free.length) g.seat(grp.id, free[0].id);
      }
    }

    urgent(list) { return list.sort((a, b) => a.patience - b.patience)[0]; }

    waitingGroups() { return this.g.groups.filter(x => x.state === 'waitFood' && x.order); }

    choose() {
      const g = this.g, h = g.hero, st = g.st;
      const free = g.freeHand() >= 0;
      const food = g.heldFood();
      const waiting = this.waitingGroups();
      const passFree = () => g.stations.find(s => s.kind === 'pass' && !s.item);
      const tid = grp => (grp.courier ? 'g' + grp.id : grp.table.id);
      for (const it of food) {
        const cands = waiting.filter(x => x.order.need.includes(it));
        if (!cands.length) continue;
        const target = this.urgent(cands);
        if (free && target.patience > 1.5) {
          const rest = target.order.need.slice();
          for (const f of food) { const k = rest.indexOf(f); if (k >= 0) rest.splice(k, 1); }
          for (const r of rest) {
            const src = this.ready(r);
            if (src) return src;
          }
        }
        return tid(target);
      }
      const kz = st.kazan;
      if (kz.state === 'burnt' || kz.state === 'empty' || kz.state === 'needRice') return 'kazan';
      if (kz.state === 'needVeg') {
        if (h.hands.includes('veg')) return 'kazan';
        if (free) return 'prepVeg';
        const pf = passFree();
        if (pf) return pf.id;
      }
      const td = st.tandoor;
      if (td && td.state === 'burnt') return 'tandoor';
      if (td && td.state === 'done' && this.tandoorFits(td) && td.t < 7) return 'tandoor';
      const dirty = g.tables.filter(t => t.dirty && !t.group);
      const stuck = g.queue.filter(q => !g.tables.some(t => !t.group && !t.dirty && t.cap >= q.size));
      if (stuck.length) {
        const fit = dirty.filter(t => stuck.some(q => t.cap >= q.size));
        if (fit.length) return this.nearest(fit).id;
      }
      if (food.length && !free) {
        const pf = passFree();
        return pf ? pf.id : 'bin';
      }
      const pay = g.tables.filter(t => t.group && t.group.state === 'waitPay');
      if (pay.length) return this.urgent(pay.map(t => t.group)).table.id;
      const ord = g.tables.filter(t => t.group && t.group.state === 'waitOrder');
      if (ord.length) return this.urgent(ord.map(t => t.group)).table.id;
      const needs = [];
      for (const grp of waiting.sort((a, b) => a.patience - b.patience)) {
        const need = grp.order.need.slice();
        for (const it of food) { const k = need.indexOf(it); if (k >= 0) need.splice(k, 1); }
        for (const it of need) needs.push(it);
      }
      for (const it of needs) {
        const pass = g.stations.find(s => s.kind === 'pass' && s.item === it);
        if (pass && free) return pass.id;
        const src = this.source(it);
        if (src) return this.double(src, it, needs);
      }
      if (kz.state === 'fry' && !h.hands.includes('veg') && free) return 'prepVeg';
      if (kz.state === 'ready' && kz.portions <= 1 && free && passFree()) return 'kazan';
      for (const s of g.stations) {
        if (s.kind === 'tea' && s.state === 'empty') return s.id;
        if (s.kind === 'compote' && s.servings <= 0) return s.id;
        if (s.kind === 'tandoor') {
          if (s.state === 'done' && this.tandoorFits(s)) return s.id;
          if (s.state === 'empty' && this.stockLow()) return s.id;
        }
      }
      if (dirty.length) return this.nearest(dirty).id;
      return null;
    }

    ready(it) {
      const g = this.g, st = g.st;
      const pass = g.stations.find(s => s.kind === 'pass' && s.item === it);
      if (pass) return pass.id;
      if (it === 'plov') return st.kazan.state === 'ready' ? 'kazan' : null;
      if (it === 'teaBlack' || it === 'teaGreen') return st[it] && st[it].state === 'ready' ? it : null;
      if (it === 'compote') return st.compote && st.compote.servings > 0 ? 'compote' : null;
      if (it === 'samsa') return st.stockSamsa && st.stockSamsa.count > 0 ? 'stockSamsa' : null;
      if (it === 'non') return st.stockNon && st.stockNon.count > 0 ? 'stockNon' : null;
      return null;
    }

    double(src, it, needs) {
      const g = this.g, h = g.hero, s = g.st[src];
      if (h.hands[0] || h.hands[1] || needs.filter(x => x === it).length < 2) return src;
      if (s.kind === 'kazan' && s.state === 'ready' && s.portions >= 2) return [src, src];
      if (s.kind === 'stock' && s.count >= 2) return [src, src];
      if (s.kind === 'compote' && s.servings >= 2) return [src, src];
      if (s.kind === 'tea' && s.state === 'ready' && s.count >= 2) return [src, src];
      if (s.kind === 'chop') return [src, src];
      return src;
    }

    tandoorFits(s) {
      const g = this.g;
      for (const [k, n] of Object.entries(s.load || {})) {
        const stock = g.st[k === 'samsa' ? 'stockSamsa' : 'stockNon'];
        if (stock && stock.count + n > P.TUNE.tandoor.stockCap) return false;
      }
      return true;
    }

    stockLow() {
      const g = this.g;
      return ['stockSamsa', 'stockNon'].some(id => g.st[id] && g.st[id].count < 2);
    }

    source(it) {
      const g = this.g, st = g.st;
      const free = g.freeHand() >= 0;
      if (it === 'plov') {
        const kz = st.kazan;
        if (kz.state === 'ready' && free) return 'kazan';
        if (kz.state === 'empty') return 'kazan';
        return null;
      }
      if (it === 'teaBlack' || it === 'teaGreen') {
        const s = st[it];
        if (s.state === 'empty') return it;
        if (s.state === 'ready' && free) return it;
        return null;
      }
      if (it === 'compote') {
        const s = st.compote;
        if (s.servings <= 0) return 'compote';
        return free ? 'compote' : null;
      }
      if (it === 'achichuk') return free ? 'prepSalad' : null;
      if (it === 'samsa' || it === 'non') {
        const stock = st[it === 'samsa' ? 'stockSamsa' : 'stockNon'];
        if (stock.count > 0 && free) return stock.id;
        const td = st.tandoor;
        if (td.state === 'empty') return 'tandoor';
        if (td.state === 'done' && this.tandoorFits(td)) return 'tandoor';
        if (td.state === 'burnt') return 'tandoor';
        return null;
      }
      return null;
    }

    nearest(list) {
      const h = this.g.hero;
      return list.slice().sort((a, b) => dist(h.x, h.y, a.use.x, a.use.y) - dist(h.x, h.y, b.use.x, b.use.y))[0];
    }
  }

  function simulate(level, opts = {}) {
    const game = new Game(Object.assign({ level }, opts));
    const bot = new Bot(game, opts);
    const dt = 1 / 30;
    let n = 0;
    while (game.phase !== 'end' && n < 30 * 60 * 20) {
      bot.tick(dt);
      game.update(dt);
      game.drain();
      n++;
    }
    return { game, result: game.result, frames: n };
  }

  Object.assign(P, { Grid, Game, Bot, simulate, CELL, dirOf });
  if (typeof module !== 'undefined' && module.exports) module.exports = P;
})(globalThis.Plov = globalThis.Plov || {});
