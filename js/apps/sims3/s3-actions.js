(function (S) {
  'use strict';
  const { OBJECTS, DX, DY, clamp, footprint, TER, NEED_KEYS } = S;

  const SEAT_H = { chair_cheap: 0.46, chair_wood: 0.46, chair_office: 0.48, armchair: 0.42, armchair_lux: 0.42, recliner: 0.44, loveseat: 0.42, sofa_cheap: 0.42, sofa_mid: 0.42, sofa_lux: 0.42, bench_park: 0.45, picnic_table: 0.45, toilet: 0.42, toilet_lux: 0.42, chess: 0.45 };
  const BED_H = { bed_single: 0.5, bed_single_mid: 0.52, bed_double: 0.5, bed_double_mid: 0.55, bed_double_lux: 0.6, loveseat: 0.42, sofa_cheap: 0.42, sofa_mid: 0.42, sofa_lux: 0.42, recliner: 0.5, crib: 0.45 };

  function walkSpeed(sim) {
    let v = 1.45;
    if (sim.age === 'child') v *= 0.9;
    if (sim.age === 'toddler') v *= (sim.tskills.walk || 0) >= 1 ? 0.55 : 0.35;
    if (sim.age === 'elder') v *= 0.8;
    if (sim.preg && sim.preg.days >= 2) v *= 0.85;
    if (sim.hasMood('exhausted')) v *= 0.85;
    return v;
  }

  const ACTS = {};
  function defAct(key, o) { o.key = key; ACTS[key] = o; return o; }

  function frontTiles(world, ob) {
    const def = OBJECTS[ob.t];
    const lv = ob.lv || 0;
    if (def.poolEdge) { const bx = ob.x - DX[ob.r], by = ob.y - DY[ob.r]; return world.walkable(bx, by) ? [[bx, by, 0]] : []; }
    if (ob.layer === 'wall') {
      if (world.walkable(ob.x, ob.y, lv)) return [[ob.x, ob.y, lv]];
      const fx = ob.x + DX[ob.r], fy = ob.y + DY[ob.r];
      return world.walkable(fx, fy, lv) && world.edgeOpen(ob.x, ob.y, fx, fy, lv) ? [[fx, fy, lv]] : [];
    }
    if (ob.layer === 'surf') {
      const base = world.surfaceBase(ob.x, ob.y, lv);
      const r = base ? base.r : ob.r;
      const out = [];
      const bd = base ? OBJECTS[base.t] : null;
      if (bd && (bd.table || base.t === 'table_end' || base.t === 'table_coffee' || base.t === 'picnic_table')) {
        for (let k = 0; k < 4; k++) { const nx = ob.x + DX[k], ny = ob.y + DY[k]; if (world.walkable(nx, ny, lv) && world.edgeOpen(ob.x, ob.y, nx, ny, lv)) out.push([nx, ny, lv]); }
        return out;
      }
      const fx = ob.x + DX[r], fy = ob.y + DY[r];
      if (world.walkable(fx, fy, lv) && world.edgeOpen(ob.x, ob.y, fx, fy, lv)) out.push([fx, fy, lv]);
      return out;
    }
    const tiles = world.footTiles(def, ob.x, ob.y, ob.r);
    const set = new Set(tiles.map(t => t[0] + ',' + t[1]));
    const out = [];
    for (const [tx, ty] of tiles) {
      const fx = tx + DX[ob.r], fy = ty + DY[ob.r];
      if (set.has(fx + ',' + fy)) continue;
      if ((ob.layer === 'occ' ? world.walkable(fx, fy, lv) : world.walkable(fx, fy, lv) || (world.objAt(fx, fy, 'occ', lv) === null && world.hasFloor(fx, fy, lv))) && world.edgeOpen(tx, ty, fx, fy, lv)) out.push([fx, fy, lv]);
    }
    return out;
  }

  function adjTiles(world, ob, diag) {
    const def = OBJECTS[ob.t];
    const lv = ob.lv || 0;
    if (def.poolEdge) return frontTiles(world, ob);
    const tiles = ob.layer === 'wall' || ob.layer === 'surf' ? [[ob.x, ob.y]] : world.footTiles(def, ob.x, ob.y, ob.r);
    const set = new Set(tiles.map(t => t[0] + ',' + t[1]));
    const out = [], seen = new Set();
    for (const [tx, ty] of tiles) {
      for (let k = 0; k < 4; k++) {
        const nx = tx + DX[k], ny = ty + DY[k];
        const key = nx + ',' + ny;
        if (set.has(key) || seen.has(key)) continue;
        seen.add(key);
        if (world.walkable(nx, ny, lv) && world.edgeOpen(tx, ty, nx, ny, lv)) out.push([nx, ny, lv]);
      }
      if (diag) {
        for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          const nx = tx + dx, ny = ty + dy, key = nx + ',' + ny;
          if (set.has(key) || seen.has(key)) continue;
          seen.add(key);
          if (world.walkable(nx, ny, lv) && !world.wallBetween(tx, ty, nx, ty, lv) && !world.wallBetween(tx, ty, tx, ny, lv)) out.push([nx, ny, lv]);
        }
      }
    }
    if (ob.layer === 'ground' && world.walkable(ob.x, ob.y, lv)) out.unshift([ob.x, ob.y, lv]);
    return out;
  }

  function goalDist(g, sim) { return Math.hypot(g[0] + 0.5 - sim.x, g[1] + 0.5 - sim.y) + Math.abs((g[2] || 0) - (sim.lv || 0)) * 12; }

  function localPos(ob, u, v) {
    const def = OBJECTS[ob.t];
    const f = footprint(def, ob.r);
    const cx = ob.x + f[0] / 2, cy = ob.y + f[1] / 2;
    const w = S.localToWorld(ob.r, u, v);
    return [cx + w[0], cy + w[1]];
  }

  function seatSpots(ob) {
    const def = OBJECTS[ob.t];
    const w = def.size[0];
    const out = [];
    const face = S.dirAngle(ob.r);
    if (ob.t === 'chess') {
      out.push({ pos: localPos(ob, -1, 0), face: S.dirAngle((ob.r + 1) % 4), i: 0 });
      out.push({ pos: localPos(ob, 1, 0), face: S.dirAngle((ob.r + 3) % 4), i: 1 });
      return out;
    }
    if (ob.t === 'picnic_table') {
      out.push({ pos: localPos(ob, -0.5, -0.75), face: S.dirAngle((ob.r + 2) % 4), i: 0 });
      out.push({ pos: localPos(ob, 0.5, -0.75), face: S.dirAngle((ob.r + 2) % 4), i: 1 });
      out.push({ pos: localPos(ob, -0.5, 0.75), face, i: 2 });
      out.push({ pos: localPos(ob, 0.5, 0.75), face, i: 3 });
      return out;
    }
    for (let i = 0; i < w; i++) {
      const u = -w / 2 + 0.5 + i;
      out.push({ pos: localPos(ob, u, -0.05), face, i });
    }
    return out;
  }

  function bedSpots(ob) {
    const def = OBJECTS[ob.t];
    const face = S.dirAngle(ob.r);
    if (def.double) return [{ pos: localPos(ob, -0.5, -0.1), face, i: 0 }, { pos: localPos(ob, 0.5, -0.1), face, i: 1 }];
    if (def.size[0] >= 2) return [{ pos: localPos(ob, 0, 0), face: S.dirAngle((ob.r + 1) % 4), i: 0 }];
    return [{ pos: localPos(ob, 0, def.size[1] > 1 ? -0.1 : 0), face, i: 0 }];
  }

  function exitTile(world, sim) {
    const lv = sim.lv || 0;
    const e = sim.enterFrom;
    if (e && (e[2] || 0) === lv && world.walkable(e[0], e[1], lv) && Math.hypot(e[0] + 0.5 - sim.x, e[1] + 0.5 - sim.y) < 3) return e;
    const x0 = Math.floor(sim.x), y0 = Math.floor(sim.y);
    for (let k = 0; k < 4; k++) {
      const nx = x0 + DX[k], ny = y0 + DY[k];
      if (world.walkable(nx, ny, lv) && world.edgeOpen(x0, y0, nx, ny, lv)) return [nx, ny, lv];
    }
    if (world.walkable(x0, y0, lv)) return [x0, y0, lv];
    return world.nearestWalkable(x0, y0, 3, null, lv);
  }

  class Action {
    constructor(game, sim, def, target, opt) {
      this.game = game; this.sim = sim; this.def = def; this.key = def.key;
      this.target = target; this.opt = opt || {};
      this.name = this.opt.name || (typeof def.name === 'function' ? def.name(sim, target, game) : def.name);
      this.icon = this.opt.icon || def.icon || 'm_hand';
      this.user = !!this.opt.user;
      this.auto = !this.user;
      this.gen = null; this.dt = 0; this.cancelled = false; this.done = false; this.ok = true;
      this.reserved = []; this.t0 = game.t; this.status = '';
      this.outfitBefore = null;
    }
    start() { this.gen = this.def.run(this, this.sim, this.target, this.opt); }
    step(dt) {
      this.dt = dt;
      if (!this.gen) this.start();
      let r;
      try { r = this.gen.next(); } catch (e) { if (this.game.debug) console.error(e); r = { done: true }; this.ok = false; }
      if (r.done) { this.finish(); return true; }
      return false;
    }
    finish() {
      if (this.done) return;
      this.done = true;
      for (const [ob, slot] of this.reserved) if (ob.use[slot] === this.sim.id) delete ob.use[slot];
      const sim = this.sim;
      sim.censor = false;
      if (sim.anim !== 'dead') { sim.anim = 'idle'; sim.animT = 0; }
      sim.sitH = 0; sim.lieH = 0; sim.prop = sim.carry ? 'baby' : null;
      sim.path = null;
      if (sim.ride) { const r = sim.ride; sim.x = r[0] + 0.5; sim.y = r[1] + 0.5; sim.lv = r[2] || 0; sim.zOff = 0; sim.hidden = false; sim.ride = null; sim.lot = this.game.world.lotAt(r[0], r[1]); }
      if (this.outfitBefore) { sim.outfit = this.outfitBefore; this.outfitBefore = null; }
      if (sim.seatOf) {
        const p = exitTile(this.game.world, sim);
        if (p) { sim.x = p[0] + 0.5; sim.y = p[1] + 0.5; }
        sim.seatOf = null;
      }
      if (!this.ok && this.game.t - this.t0 < 1) sim.failN = (sim.failN || 0) + 1; else if (this.ok) sim.failN = 0;
      sim.lastActs = sim.lastActs || {};
      if (this.ok) sim.lastActs[this.key] = this.game.t;
      if (this.def.end) this.def.end(this, sim, this.target, this.opt);
    }
    cancel() { this.cancelled = true; }
    reserve(ob, slot) {
      const cur = ob.use[slot];
      if (cur && cur !== this.sim.id) {
        const other = this.game.sims.get(cur);
        const busy = other && !other.dead && other.queue.some(a => a.reserved.some(r => r[0] === ob && r[1] === slot));
        if (busy) return false;
      }
      ob.use[slot] = this.sim.id;
      this.reserved.push([ob, slot]);
      return true;
    }
    free(ob, slot) { if (ob.use[slot] === this.sim.id) delete ob.use[slot]; }
    anim(name, prop) { this.sim.anim = name; this.sim.animT = 0; if (prop !== undefined) this.sim.prop = prop; }
    think(icon, min) { this.sim.bubble = { icon, until: this.game.t + (min || 2) }; }
    say(icon, min) { this.sim.balloon = { icon, until: this.game.t + (min || 2) }; }
    note(ev) { this.game.note(this.sim, ev); }
    face(x, y) { this.sim.face = Math.atan2(y - this.sim.y, x - this.sim.x); }
    faceObj(ob) { const c = this.game.world.center(ob); this.face(c[0], c[1]); }
    changeOutfit(kind, temp) {
      if (this.sim.outfit === kind) return;
      if (temp && !this.outfitBefore) this.outfitBefore = this.sim.outfit;
      this.sim.outfit = kind;
    }

    *wait(min) {
      let t = 0;
      while (t < min && !this.cancelled) { yield; t += this.dt; }
    }
    *walk(goals, opt) {
      opt = opt || {};
      const sim = this.sim, world = this.game.world;
      if (!goals || !goals.length) { this.ok = false; return false; }
      for (let attempt = 0; attempt < 3; attempt++) {
        const sx = Math.floor(sim.x), sy = Math.floor(sim.y);
        const path = world.findPath(sx, sy, goals, { ignoreObj: opt.ignoreObj, lv: sim.lv || 0 });
        if (!path) { if (!this.user) { this.ok = false; return false; } this.think('m_route', 3); this.ok = false; return false; }
        if (!opt.noCar && path.length > 46 && this.sim.age !== 'toddler' && !opt.walkOnly && !(sim.lv || 0)) {
          const dest = path[path.length - 1];
          const destLot = world.lotAt(dest[0], dest[1]);
          if (destLot >= 0 && destLot !== world.lotAt(sx, sy)) {
            const ok = yield* this.drive(destLot, goals);
            return ok;
          }
        }
        sim.path = path;
        sim.pathI = 1;
        const speed = walkSpeed(sim) * (opt.run ? 1.9 : 1);
        this.anim(opt.run ? 'run' : 'walk');
        let blocked = false;
        while (sim.pathI < path.length) {
          if (this.cancelled && !opt.noCancel) { sim.path = null; this.ok = false; return false; }
          let step = speed * this.dt;
          while (step > 0 && sim.pathI < path.length) {
            const node = path[sim.pathI];
            const tx = node[0], ty = node[1], tl = node[2] || 0;
            if (tl !== (sim.lv || 0)) {
              const prev = path[sim.pathI - 1];
              const link = world.linkOf(world.li(prev[0], prev[1], prev[2] || 0), world.li(tx, ty, tl));
              if (!link) { blocked = true; break; }
              yield* this.traverse(link, prev, node);
              sim.pathI++;
              step = 0;
              if (sim.pathI < path.length) {
                const nn = path[sim.pathI];
                if ((nn[2] || 0) === tl && !world.walkable(nn[0], nn[1], tl) && !goals.some(g => g[0] === nn[0] && g[1] === nn[1] && (g[2] || 0) === tl)) blocked = true;
              }
              break;
            }
            const px = tx + 0.5, py = ty + 0.5;
            const dx = px - sim.x, dy = py - sim.y;
            const d = Math.hypot(dx, dy);
            if (d > 0.001) sim.face = Math.atan2(dy, dx);
            if (d <= step) {
              sim.x = px; sim.y = py; step -= d; sim.pathI++;
              if (sim.pathI < path.length) {
                const nn = path[sim.pathI];
                const nl = nn[2] || 0;
                if (nl === tl && !(nn[0] === tx && nn[1] === ty) && !world.walkable(nn[0], nn[1], nl) && !goals.some(g => g[0] === nn[0] && g[1] === nn[1] && (g[2] || 0) === nl)) { blocked = true; break; }
              }
            } else { sim.x += dx / d * step; sim.y += dy / d * step; step = 0; }
          }
          sim.lot = world.lotAt(Math.floor(sim.x), Math.floor(sim.y));
          if (blocked) break;
          yield;
        }
        sim.path = null;
        if (!blocked) { this.anim('idle'); return true; }
      }
      this.ok = false;
      return false;
    }
    *traverse(link, from, to) {
      const sim = this.sim, world = this.game.world;
      const fl = from[2] || 0, tl = to[2] || 0;
      const sx = from[0] + 0.5, sy = from[1] + 0.5, ex = to[0] + 0.5, ey = to[1] + 0.5;
      sim.ride = [to[0], to[1], tl];
      if (link.kind === 'stairs') {
        const up = tl > fl;
        const dist = Math.hypot(ex - sx, ey - sy);
        const dur = dist / (walkSpeed(sim) * 0.75);
        sim.lv = Math.min(fl, tl);
        sim.face = Math.atan2(ey - sy, ex - sx);
        this.anim('walk');
        let t = 0;
        while (t < dur) {
          yield;
          t += this.dt;
          const k = clamp(t / dur, 0, 1);
          sim.x = sx + (ex - sx) * k; sim.y = sy + (ey - sy) * k;
          let zf = clamp((k * dist - 0.5) / Math.max(0.5, dist - 1), 0, 1);
          if (!up) zf = 1 - zf;
          sim.zOff = zf * S.WALL_H;
        }
      } else {
        const e = world.elevInfo(link.ob);
        const hx = e.shaft[0] + 0.5, hy = e.shaft[1] + 0.5;
        this.anim('idle');
        link.ob.st.ride = (link.ob.st.ride || 0) + 1;
        yield* this.glide(hx, hy, Math.atan2(sy - hy, sx - hx), 0.45);
        sim.hidden = true;
        let t = 0;
        const dur = 1.2 + 0.7 * Math.abs(tl - fl);
        while (t < dur) { yield; t += this.dt; }
        sim.lv = tl;
        sim.hidden = false;
        sim.x = hx; sim.y = hy;
        yield* this.glide(ex, ey, Math.atan2(ey - hy, ex - hx), 0.45);
        link.ob.st.ride = Math.max(0, (link.ob.st.ride || 1) - 1);
      }
      sim.x = ex; sim.y = ey; sim.lv = tl; sim.zOff = 0; sim.ride = null;
      sim.lot = world.lotAt(to[0], to[1]);
      this.anim('walk');
    }
    *drive(destLot, goals) {
      const game = this.game, world = game.world, sim = this.sim;
      const here = world.lotAt(Math.floor(sim.x), Math.floor(sim.y));
      const fromLot = world.lots[here];
      let curb = fromLot ? fromLot.curb : null;
      if (!curb) {
        const p = world.nearestWalkable(sim.x - 0.5, sim.y - 0.5, 20, (x, y) => world.ter(x, y) === TER.walk);
        curb = p || [Math.floor(sim.x), Math.floor(sim.y)];
      }
      const cg = world.walkable(curb[0], curb[1]) ? [curb] : [world.nearestWalkable(curb[0], curb[1], 4) || curb];
      const okWalk = yield* this.walk(cg, { noCar: true });
      if (!okWalk) return false;
      const dl = world.lots[destLot];
      const car = game.spawnCar(sim, fromLot ? fromLot.lane : [cg[0][0], cg[0][1]], dl.lane, this.opt.carKind || 'car');
      if (!car) {
        const ok = yield* this.walk(goals, { noCar: true });
        return ok;
      }
      this.anim('idle');
      while (!car.boarded) { if (this.cancelled) { game.removeCar(car); return false; } yield; }
      sim.hidden = true; sim.inCar = car.id;
      while (!car.arrived) { yield; }
      sim.hidden = false; sim.inCar = null;
      const exit = world.walkable(dl.curb[0], dl.curb[1]) ? dl.curb : world.nearestWalkable(dl.curb[0], dl.curb[1], 5) || dl.curb;
      sim.x = exit[0] + 0.5; sim.y = exit[1] + 0.5; sim.lv = 0; sim.lot = world.lotAt(exit[0], exit[1]);
      car.leave = true;
      if (this.opt.visit) game.onArriveLot(sim, destLot);
      const ok = yield* this.walk(goals, { noCar: true });
      return ok;
    }
    *walkToObj(ob, mode, opt) {
      const world = this.game.world;
      let goals = mode === 'front' ? frontTiles(world, ob) : adjTiles(world, ob, mode === 'near');
      if (mode === 'front' && !goals.length && ob.layer !== 'surf') goals = adjTiles(world, ob, false);
      if (!goals.length) { this.think('m_route', 3); this.ok = false; this.sim.noRoute = this.sim.noRoute || {}; this.sim.noRoute[ob.id] = this.game.t; return false; }
      const sim = this.sim;
      goals.sort((a, b) => goalDist(a, sim) - goalDist(b, sim));
      const ok = yield* this.walk(goals, opt);
      if (ok) this.faceObj(ob);
      else { sim.noRoute = sim.noRoute || {}; sim.noRoute[ob.id] = this.game.t; }
      return ok;
    }
    *glide(x, y, face, dur) {
      const sim = this.sim;
      const sx = sim.x, sy = sim.y;
      dur = dur || 0.35;
      let t = 0;
      while (t < dur) {
        yield;
        t += this.dt;
        const k = clamp(t / dur, 0, 1);
        sim.x = sx + (x - sx) * k; sim.y = sy + (y - sy) * k;
      }
      if (face !== undefined) sim.face = face;
    }
    *glideIn(x, y, face, dur) {
      this.sim.enterFrom = [Math.floor(this.sim.x), Math.floor(this.sim.y), this.sim.lv || 0];
      yield* this.glide(x, y, face, dur);
    }
    *loop(maxMin, perMin, until, opt) {
      let t = 0;
      opt = opt || {};
      while (t < maxMin) {
        if (this.cancelled && !opt.noCancel) break;
        yield;
        const dt = Math.min(this.dt, maxMin - t);
        t += dt;
        if (perMin) perMin(dt, t);
        if (until && until(t)) break;
      }
      return t;
    }
    *sitOn(ob, pref) {
      const game = this.game, world = game.world, sim = this.sim;
      const spots = seatSpots(ob);
      let spot = null;
      const order = spots.slice().sort((a, b) => Math.hypot(a.pos[0] - sim.x, a.pos[1] - sim.y) - Math.hypot(b.pos[0] - sim.x, b.pos[1] - sim.y));
      if (pref !== undefined && spots[pref]) order.unshift(spots[pref]);
      for (const s of order) if (this.reserve(ob, 'seat' + s.i)) { spot = s; break; }
      if (!spot) { this.ok = false; return null; }
      let goals = adjTiles(world, ob, false);
      goals.sort((a, b) => Math.hypot(a[0] + 0.5 - spot.pos[0], a[1] + 0.5 - spot.pos[1]) - Math.hypot(b[0] + 0.5 - spot.pos[0], b[1] + 0.5 - spot.pos[1]));
      goals = goals.slice(0, 4);
      const ok = yield* this.walk(goals, { ignoreObj: ob.id });
      if (!ok) { this.free(ob, 'seat' + spot.i); return null; }
      this.face(spot.pos[0], spot.pos[1]);
      sim.enterFrom = [Math.floor(sim.x), Math.floor(sim.y), sim.lv || 0];
      yield* this.glide(spot.pos[0], spot.pos[1], spot.face, 0.4);
      sim.sitH = SEAT_H[ob.t] || 0.45;
      sim.seatOf = ob.id;
      this.anim('sit');
      if ((OBJECTS[ob.t].seat || 0) >= 7) sim.addMood('comfy', game.t);
      return spot;
    }
    *standUp() {
      const sim = this.sim, world = this.game.world;
      if (!sim.seatOf) return;
      const p = exitTile(world, sim);
      sim.sitH = 0; sim.lieH = 0;
      this.anim('idle');
      if (p) yield* this.glide(p[0] + 0.5, p[1] + 0.5, undefined, 0.3);
      sim.seatOf = null;
    }
    *intoObj(ob, u, v, faceDir) {
      const world = this.game.world;
      const goals = frontTiles(world, ob).concat(adjTiles(world, ob, false));
      if (!goals.length) { this.ok = false; return false; }
      const sim = this.sim;
      goals.sort((a, b) => goalDist(a, sim) - goalDist(b, sim));
      const ok = yield* this.walk(goals.slice(0, 5), { ignoreObj: ob.id });
      if (!ok) return false;
      const p = localPos(ob, u || 0, v || 0);
      this.face(p[0], p[1]);
      sim.enterFrom = [Math.floor(sim.x), Math.floor(sim.y), sim.lv || 0];
      yield* this.glide(p[0], p[1], faceDir !== undefined ? faceDir : S.dirAngle(ob.r), 0.35);
      sim.seatOf = ob.id;
      return true;
    }
  }

  Object.assign(S, { Action, ACTS, defAct, frontTiles, adjTiles, seatSpots, bedSpots, localPos, walkSpeed, goalDist, SEAT_H, BED_H });
  if (typeof module !== 'undefined' && module.exports) module.exports = S;
})(globalThis.Sims3 = globalThis.Sims3 || {});
