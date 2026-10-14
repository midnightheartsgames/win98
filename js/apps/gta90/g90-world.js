(function (G) {
  'use strict';
  const { T, clamp, dist, dist2, wrapAngle, RNG, GR, VEHICLES, PEDS, WEAPONS, WEAPON_ORDER, PICKUPS, SKIN, HAIR, SHIRTS, PANTS, segDist, insideCar, localOf, pointAt } = G;

  const CELL = 128;
  const COOL = [0, 14, 22, 32, 48];
  const POLICE_WANT = [0, 1, 2, 4, 5];

  const TRAFFIC = {
    base: [['vaz2101', 4], ['vaz2106', 5], ['vaz2108', 2], ['vaz2109', 1.5], ['moskvich412', 3], ['moskvich2141', 1.5], ['zaz968', 3], ['gaz24', 2.5], ['taxi', 1.4], ['uaz469', 1], ['raf', 0.6], ['uaz452', 0.8], ['gaz53', 1.2], ['zil130', 0.7], ['kamaz', 0.3], ['liaz', 0.6], ['ikarus', 0.5], ['ziu', 0.5], ['gai', 0.35], ['police', 0.25], ['java', 0.4]],
    center: [['vaz2106', 4], ['vaz2108', 2.5], ['vaz2109', 2], ['moskvich2141', 1.5], ['gaz24', 4], ['taxi', 2.5], ['gaz3102', 1.2], ['mercedes', 0.4], ['zaz968', 1.5], ['raf', 1], ['liaz', 0.8], ['ikarus', 0.7], ['ziu', 0.8], ['gai', 0.5], ['police', 0.35], ['java', 0.4]],
    industry: [['gaz53', 3], ['zil130', 2], ['kamaz', 1], ['uaz452', 1.5], ['vaz2101', 3], ['vaz2106', 3], ['moskvich412', 2], ['zaz968', 2], ['police', 0.3]]
  };
  const ZONE_MIX = { plotinka: 'center', sq1905: 'center', lenina: 'center', whitehouse: 'center', opera: 'center', vainera: 'center', market: 'base', circus: 'center', vokzal: 'base', melkovka: 'industry', tkachey: 'industry' };
  const ZONE_GANG = { market: 'center', vainera: 'center', plotinka: 'center', circus: 'center', melkovka: 'uralmash', vokzal: 'uralmash', tkachey: 'sinie', zelroshcha: 'sinie', voznes: 'sinie', whitehouse: 'director', opera: 'director' };
  const ZONE_DENS = { plotinka: 1.3, sq1905: 1.4, lenina: 1.3, vainera: 1.3, market: 1.3, opera: 1.1, circus: 1.0, whitehouse: 0.9, vokzal: 1.1, melkovka: 0.8, tkachey: 0.8, zelroshcha: 0.7, dynamo: 0.8, voznes: 0.9 };

  function weighted(rng, list) {
    let s = 0;
    for (const [, w] of list) s += w;
    let r = rng.next() * s;
    for (const [k, w] of list) { r -= w; if (r <= 0) return k; }
    return list[0][0];
  }

  class World {
    constructor(city, opts) {
      this.city = city;
      this.opts = opts || {};
      this.rng = new RNG(this.opts.seed || 77);
      this.t = 0;
      this.cars = []; this.peds = []; this.shots = []; this.fires = []; this.pickups = []; this.decals = []; this.fx = []; this.texts = [];
      this.bus = [];
      this.nextId = 1;
      this.wanted = { level: 0, cool: 0, heat: 0, flash: 0 };
      this.hostile = new Set();
      this.fields = new Map();
      this.grid = new Map();
      this.spawnT = 0; this.policeT = 0;
      this.parkState = new Map();
      this.density = this.opts.density == null ? 1 : this.opts.density;
      this.viewR = 700;
      this.handler = null;
      this.god = false;
      this.freeze = 0;
      this.setupPickups();
      this.setupTrams();
      const ch = this.opts.character || G.CHARACTERS[0];
      const sp = this.opts.spawn || city.places.safe1;
      this.player = this.spawnPed('player', sp.x, sp.y, { look: { skin: ch.skin, hair: ch.hair, shirt: ch.shirt, pants: ch.pants, fem: ch.fem }, persist: true });
      this.player.isPlayer = true;
      this.player.weapons = { fist: Infinity };
      this.player.cur = 'fist';
      this.player.hp = this.player.maxHp = 100;
      this.player.state = 'player';
    }

    emit(type, data) {
      const e = Object.assign({ type }, data || {});
      this.bus.push(e);
      if (this.bus.length > 200) this.bus.splice(0, this.bus.length - 200);
      if (this.handler) this.handler(type, e);
      return e;
    }
    event(type, x, y, data) { return this.emit(type, Object.assign({ x, y }, data || {})); }

    look(type) {
      const d = PEDS[type] || PEDS.civ;
      const r = this.rng;
      return {
        skin: r.pick(SKIN), hair: r.pick(HAIR), shirt: d.shirt || r.pick(SHIRTS), pants: d.pants || r.pick(PANTS),
        hat: d.hat || (d.random && r.chance(0.2) ? r.pick(['#303030', '#5a4030', '#3a3a50']) : null),
        scarf: d.scarf ? r.pick(d.scarf) : null, helmet: d.helmet || null, band: d.band || null, stripes: !!d.stripes, bag: d.bag && r.chance(0.8), glasses: !!d.glasses,
        fem: d.id === 'babushka' || (d.random && r.chance(0.45))
      };
    }

    spawnPed(type, x, y, o) {
      const d = PEDS[type] || PEDS.civ;
      const opt = o || {};
      const p = {
        id: this.nextId++, kind: 'ped', type, def: d, x, y, a: opt.a != null ? opt.a : this.rng.range(-Math.PI, Math.PI), vx: 0, vy: 0,
        hp: opt.hp || d.hp || 40, maxHp: opt.hp || d.hp || 40, armor: d.armor ? 60 : 0, look: opt.look || this.look(type), state: opt.state || 'walk',
        dir: this.rng.int(0, 3), lane: this.rng.range(-9, 9), t: 0, anim: this.rng.next() * 10, car: null, weapon: opt.weapon !== undefined ? opt.weapon : (d.weapon || null), cool: 0,
        gang: d.gang || null, cop: !!d.cop, persist: !!opt.persist, dead: false, deadT: 0, down: 0, hitCd: 0, fleeT: 0, target: null,
        speed: d.speed || 42, run: d.run || 90, tag: opt.tag || null, home: opt.home || null, burn: 0
      };
      this.peds.push(p);
      return p;
    }

    spawnCar(mid, x, y, a, o) {
      const m = VEHICLES[mid];
      const opt = o || {};
      const c = {
        id: this.nextId++, kind: 'car', mid, m, color: opt.color || this.rng.pick(m.colors), x, y, a: a || 0, vx: 0, vy: 0, av: 0,
        hp: m.hp, maxHp: m.hp, driver: null, pass: [], ctl: { thr: 0, steer: 0, hand: false }, ai: { mode: opt.mode || 'none' },
        parked: !!opt.parked, dead: false, burning: false, burnT: 0, fuse: 0, bomb: false, persist: !!opt.persist, siren: false, tag: opt.tag || null,
        spot: opt.spot == null ? -1 : opt.spot, touched: false, fwd: 0, lat: 0
      };
      this.cars.push(c);
      this.clearLamps(c);
      if (opt.driver) {
        const p = this.spawnPed(opt.driver === true ? 'civ' : opt.driver, x, y, { persist: c.persist, tag: opt.driverTag || null });
        this.putIn(p, c, true);
      }
      return c;
    }

    clearLamps(c) {
      const city = this.city;
      const buf = this._lb || (this._lb = []);
      for (const k of city.propsNear(c.x, c.y, c.m.L, buf)) {
        const pr = city.props[k];
        if (pr.type === 'lamp' && !pr.down && insideCar(c, pr.x, pr.y, 3)) { pr.down = true; pr.downA = c.a + Math.PI / 2; }
      }
    }

    putIn(p, c, asDriver) {
      p.car = c; p.x = c.x; p.y = c.y; p.vx = 0; p.vy = 0;
      if (asDriver && !c.driver) c.driver = p; else c.pass.push(p);
      c.parked = false;
    }

    removeCar(c) {
      if (c.driver && !c.driver.isPlayer) this.removePed(c.driver);
      for (const p of c.pass) if (!p.isPlayer) this.removePed(p);
      const i = this.cars.indexOf(c);
      if (i >= 0) this.cars.splice(i, 1);
      if (c.spot >= 0) this.parkState.set(c.spot, this.t);
      c.removed = true;
    }
    removePed(p) {
      if (p.isPlayer) return;
      const i = this.peds.indexOf(p);
      if (i >= 0) this.peds.splice(i, 1);
      if (p.car) { if (p.car.driver === p) p.car.driver = null; p.car.pass = p.car.pass.filter(q => q !== p); }
      p.removed = true;
    }

    get px() { return this.player.car ? this.player.car.x : this.player.x; }
    get py() { return this.player.car ? this.player.car.y : this.player.y; }

    rebuildGrid() {
      const g = this.grid;
      for (const v of g.values()) v.length = 0;
      const add = (e) => {
        const k = Math.floor(e.x / CELL) + Math.floor(e.y / CELL) * 1000;
        let a = g.get(k);
        if (!a) { a = []; g.set(k, a); }
        a.push(e);
      };
      for (const c of this.cars) add(c);
      for (const p of this.peds) if (!p.car) add(p);
      for (const tr of this.trams) for (const tc of tr.cars) add(tc);
    }

    near(x, y, r, out) {
      const res = out || [];
      res.length = 0;
      const x0 = Math.floor((x - r) / CELL), x1 = Math.floor((x + r) / CELL), y0 = Math.floor((y - r) / CELL), y1 = Math.floor((y + r) / CELL);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
        const a = this.grid.get(cx + cy * 1000);
        if (a) for (const e of a) res.push(e);
      }
      return res;
    }

    enterCar(p, c) {
      if (c.dead || c.burning || c.removed) return false;
      if (c.m.boat && c.sinking) return false;
      const old = c.driver;
      if (old && old !== p) {
        this.ejectPed(old, c);
        if (p.isPlayer) {
          if (old.cop) { this.crime('hitcop', c.x, c.y); }
          else this.crime('jack', c.x, c.y);
          if (old.gang && !old.dead) { old.state = 'attack'; old.target = p; }
          else if (!old.dead) { old.state = 'flee'; old.fleeT = 6; old.flee = { x: c.x, y: c.y }; }
          this.emit('jacked', { car: c, victim: old });
        }
      }
      if (p.isPlayer && c.m.police) this.crime('stealcop', c.x, c.y);
      p.car = c; c.driver = p; c.parked = false; c.touched = true;
      p.vx = p.vy = 0;
      if (p.isPlayer) { c.ai = { mode: 'player' }; c.siren = false; c.persistPlayer = true; this.lastCar = c; }
      this.emit('enter', { car: c, ped: p });
      return true;
    }

    exitSpot(c) {
      const m = c.m, city = this.city;
      if (m.boat) return city.nearestPoint(c.x, c.y, (x, y) => city.walkable(x, y), 70);
      const fx = Math.cos(c.a), fy = Math.sin(c.a);
      const side = m.W / 2 + 8;
      const cands = [[0, -side], [0, side], [m.L / 2 + 8, 0], [-m.L / 2 - 8, 0], [0, -side - 14], [0, side + 14]];
      for (const [a, b] of cands) {
        const x = c.x + fx * a - fy * b, y = c.y + fy * a + fx * b;
        if (!city.walkable(x, y)) continue;
        if (city.cross(c.x, c.y, x, y, G.SEG.BUILDING | G.SEG.FENCE | G.SEG.WATER | G.SEG.EDGE)) continue;
        if (this.cars.some(o => o !== c && !o.removed && insideCar(o, x, y, 2))) continue;
        return [x, y];
      }
      return null;
    }

    ejectPed(p, c) {
      const s = this.exitSpot(c) || [c.x, c.y];
      if (c.driver === p) c.driver = null;
      c.pass = c.pass.filter(q => q !== p);
      p.car = null; p.x = s[0]; p.y = s[1]; p.a = c.a;
      if (!c.driver) { c.ctl.thr = 0; c.ctl.steer = 0; c.ctl.hand = true; }
    }

    exitCar(p) {
      const c = p.car;
      if (!c) return false;
      if (Math.hypot(c.vx, c.vy) > 110 && !c.m.boat) return false;
      const s = this.exitSpot(c);
      if (!s) return false;
      if (c.driver === p) c.driver = null;
      c.pass = c.pass.filter(q => q !== p);
      p.car = null; p.x = s[0]; p.y = s[1]; p.a = c.a; p.vx = p.vy = 0;
      c.ctl.thr = 0; c.ctl.steer = 0; c.ctl.hand = true;
      if (!c.driver) c.ai = { mode: 'none' };
      this.emit('exit', { car: c, ped: p });
      return true;
    }

    nearestCarFor(p, r, boats) {
      let best = null, bd = r || 40;
      for (const c of this.cars) {
        if (c.dead || c.removed || c.burning || (boats && !c.m.boat)) continue;
        const [lx, ly] = localOf(c, p.x, p.y);
        const dx = Math.max(0, Math.abs(lx) - c.m.L / 2), dy = Math.max(0, Math.abs(ly) - c.m.W / 2);
        const d = Math.hypot(dx, dy);
        if (d < bd) { bd = d; best = c; }
      }
      return best;
    }

    control(inp, dt) {
      const p = this.player;
      if (p.dead || this.freeze > 0) { if (p.car) { p.car.ctl.thr = 0; p.car.ctl.steer = 0; p.car.ctl.hand = true; } return; }
      if (p.car) {
        const c = p.car;
        c.ctl.thr = inp.up ? 1 : inp.down ? -1 : 0;
        c.ctl.steer = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
        c.ctl.hand = !!inp.hand;
        if (inp.horn && (this.hornT || 0) <= 0) { this.hornT = 0.35; this.event('horn', c.x, c.y, { car: c }); this.scare(c.x + Math.cos(c.a) * 60, c.y + Math.sin(c.a) * 60, 70, 2); }
        if (inp.fire) {
          if (c.bomb && !c.fuse) { c.fuse = 4; this.emit('fuse', { car: c }); }
          else if (c.m.tank) this.tankFire(c);
          else if (p.cur !== 'fist' && p.cur !== 'molotov' && !c.m.boat) this.fireWeapon(p, c.a, true);
        }
        if (inp.enter) this.exitCar(p);
        p.x = c.x; p.y = c.y; p.a = c.a;
      } else {
        const run = inp.walk ? 55 : 112;
        if (inp.scheme === 'direct') {
          const mx = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), my = (inp.down ? 1 : 0) - (inp.up ? 1 : 0);
          if (mx || my) {
            const want = Math.atan2(my, mx);
            if (!inp.fire) p.a += clamp(wrapAngle(want - p.a), -12 * dt, 12 * dt);
            const l = Math.hypot(mx, my);
            p.vx = mx / l * run; p.vy = my / l * run;
          } else { p.vx = 0; p.vy = 0; }
        } else {
          p.a += ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * 3.8 * dt;
          const mv = inp.up ? run : inp.down ? -run * 0.55 : 0;
          p.vx = Math.cos(p.a) * mv; p.vy = Math.sin(p.a) * mv;
        }
        p.moving = Math.hypot(p.vx, p.vy) > 5;
        if (inp.fire) this.fireWeapon(p, this.aimAssist(p), false);
        if (inp.enter) {
          const c = this.nearestCarFor(p, 26) || this.nearestCarFor(p, 52, true);
          if (c) this.enterCar(p, c);
        }
      }
      if (inp.next) this.cycleWeapon(1);
      if (inp.prev) this.cycleWeapon(-1);
      if (inp.slot) { const w = WEAPON_ORDER[inp.slot - 1]; if (w && p.weapons[w]) p.cur = w; }
    }

    cycleWeapon(d) {
      const p = this.player;
      const have = WEAPON_ORDER.filter(w => p.weapons[w] > 0);
      const i = have.indexOf(p.cur);
      p.cur = have[(i + d + have.length) % have.length] || 'fist';
      this.emit('weapon', { w: p.cur });
    }

    aimAssist(p) {
      let best = null, bs = 0.22;
      const w = WEAPONS[p.cur];
      const range = (w && w.range) || 30;
      for (const q of this.near(p.x, p.y, range)) {
        if (q.kind !== 'ped' || q === p || q.dead) continue;
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d > range || d < 1) continue;
        const da = Math.abs(wrapAngle(Math.atan2(q.y - p.y, q.x - p.x) - p.a));
        const score = da + d / range * 0.1 - (q.cop || q.gang ? 0.05 : 0);
        if (da < bs && (!best || score < best.s)) best = { a: Math.atan2(q.y - p.y, q.x - p.x), s: score };
      }
      return best ? best.a : p.a;
    }

    fireWeapon(p, ang, fromCar) {
      if (p.cool > 0) return false;
      const wid = p.isPlayer ? p.cur : (p.weapon || 'fist');
      const w = WEAPONS[wid];
      if (!w) return false;
      if (p.isPlayer && wid !== 'fist') {
        if (!(p.weapons[wid] > 0)) { this.cycleWeapon(1); return false; }
        p.weapons[wid]--;
        if (p.weapons[wid] <= 0) { delete p.weapons[wid]; this.cycleWeapon(1); }
      }
      p.cool = w.rate * (p.isPlayer ? 1 : 1.6);
      const src = p.car || p;
      const off = p.car ? p.car.m.L / 2 + 6 : 8;
      const sx = src.x + Math.cos(ang) * off, sy = src.y + Math.sin(ang) * off;
      if (w.kind === 'melee') {
        for (const q of this.near(p.x, p.y, 30)) {
          if (q.kind !== 'ped' || q === p || q.dead || q.car) continue;
          const d = Math.hypot(q.x - sx, q.y - sy);
          if (d < w.range) { this.pedDamage(q, w.dmg, p, 'fist'); q.down = 0.6; q.vx = Math.cos(ang) * 80; q.vy = Math.sin(ang) * 80; this.event('punch', q.x, q.y); break; }
        }
        return true;
      }
      const n = w.pellets || 1;
      const spread = w.spread * (p.isPlayer ? 1 : 2.2);
      for (let k = 0; k < n; k++) {
        const a = ang + (this.rng.next() - 0.5) * 2 * (spread || 0);
        const sp = w.speed * (w.kind === 'bullet' ? (0.95 + this.rng.next() * 0.1) : 1);
        const base = { x: sx, y: sy, vx: Math.cos(a) * sp + (p.car ? p.car.vx : 0), vy: Math.sin(a) * sp + (p.car ? p.car.vy : 0), owner: p, ownerCar: p.car, kind: w.kind, dmg: w.dmg, life: w.range / sp, radius: w.radius || 0, wid, z: 0 };
        this.shots.push(base);
      }
      this.fx.push({ t: 'flash', x: sx, y: sy, life: 0.06, max: 0.06, a: ang });
      this.event('shot', sx, sy, { w: wid, owner: p });
      if (w.kind !== 'throw') this.scare(sx, sy, 260, 7);
      if (p.isPlayer) this.crime('shoot', sx, sy);
      return true;
    }

    tankFire(c) {
      if ((c.gunCool || 0) > 0) return;
      c.gunCool = 1.25;
      const a = c.a;
      const sx = c.x + Math.cos(a) * (c.m.L / 2 + 14), sy = c.y + Math.sin(a) * (c.m.L / 2 + 14);
      this.shots.push({ x: sx, y: sy, vx: Math.cos(a) * 620, vy: Math.sin(a) * 620, owner: c.driver, ownerCar: c, kind: 'rocket', dmg: 190, radius: 96, life: 1.2, wid: 'tank', shell: true });
      this.fx.push({ t: 'flash', x: sx, y: sy, life: 0.1, max: 0.1, a, big: true });
      this.event('cannon', sx, sy);
      c.vx -= Math.cos(a) * 30; c.vy -= Math.sin(a) * 30;
      this.scare(sx, sy, 400, 8);
      this.crime('shoot', sx, sy);
    }

    scare(x, y, r, t) {
      for (const q of this.near(x, y, r)) {
        if (q.kind !== 'ped' || q.isPlayer || q.dead || q.car) continue;
        if (q.cop || q.gang || q.state === 'guard' || q.state === 'attack' || q.state === 'hail' || q.state === 'idle' || q.tag) continue;
        if (dist2(q.x, q.y, x, y) > r * r) continue;
        q.state = 'flee'; q.fleeT = t + this.rng.next() * 3; q.flee = { x, y };
      }
      for (const c of this.cars) {
        if (!c.driver || c.driver.isPlayer || c.ai.mode !== 'traffic') continue;
        if (dist2(c.x, c.y, x, y) < r * r) c.ai.panic = 5;
      }
    }

    stepShots(dt) {
      const buf = [];
      for (let i = this.shots.length - 1; i >= 0; i--) {
        const s = this.shots[i];
        const ox = s.x, oy = s.y;
        s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
        let hit = null;
        if (s.kind === 'throw') {
          s.z = Math.sin(Math.max(0, 1 - s.life / (s.life0 || (s.life0 = s.life + dt))) * Math.PI) * 30;
          if (s.life <= 0 || this.city.solidAt(s.x, s.y)) { this.molotovBurst(s.x - s.vx * dt, s.y - s.vy * dt, s.owner); this.shots.splice(i, 1); }
          continue;
        }
        if (s.kind === 'rocket' && this.rng.chance(0.8)) this.fx.push({ t: 'smoke', x: s.x, y: s.y, vx: 0, vy: 0, r: 5, life: 0.8, max: 0.8 });
        if (this.city.solidAt(s.x, s.y) || !this.city.inMargin(s.x, s.y)) {
          if (s.kind === 'rocket') this.explosion(ox, oy, s.radius, s.dmg, s.owner);
          else this.fx.push({ t: 'spark', x: ox, y: oy, life: 0.2, max: 0.2 });
          this.shots.splice(i, 1);
          continue;
        }
        for (const e of this.near(s.x, s.y, 50, buf)) {
          if (e.kind === 'car') {
            if (e === s.ownerCar || e.removed) continue;
            if (!insideCar(e, s.x, s.y, 1)) continue;
            hit = e; break;
          } else {
            if (e === s.owner || e.dead || e.car) continue;
            if (segDist(e.x, e.y, ox, oy, s.x, s.y) > 6) continue;
            hit = e; break;
          }
        }
        if (!hit && s.life > 0) continue;
        if (s.kind === 'rocket') this.explosion(s.x, s.y, s.radius, s.dmg, s.owner);
        else if (hit && hit.kind === 'car') {
          if (hit.m.bike && hit.driver && this.rng.chance(0.5)) this.pedDamage(hit.driver, s.dmg, s.owner, 'bullet');
          else this.carDamage(hit, s.dmg * (hit.m.armored ? 0.35 : 0.55), s.owner, 'bullet');
          this.fx.push({ t: 'spark', x: s.x, y: s.y, life: 0.15, max: 0.15 });
        } else if (hit) this.pedDamage(hit, hit.isPlayer && s.owner && !s.owner.isPlayer ? s.dmg * 0.55 : s.dmg, s.owner, 'bullet', s);
        this.shots.splice(i, 1);
      }
    }

    molotovBurst(x, y, owner) {
      this.fires.push({ x, y, r: 42, life: 5, owner, tick: 0 });
      this.event('whoosh', x, y);
      this.scare(x, y, 200, 6);
      if (owner && owner.isPlayer) this.crime('shoot', x, y);
    }

    explosion(x, y, r, dmg, owner) {
      this.fx.push({ t: 'boom', x, y, r, life: 0.7, max: 0.7 });
      for (let k = 0; k < 10; k++) this.fx.push({ t: 'smoke', x: x + this.rng.range(-r, r) * 0.4, y: y + this.rng.range(-r, r) * 0.4, vx: this.rng.range(-20, 20), vy: this.rng.range(-20, 20), r: 12 + this.rng.next() * 12, life: 1.6 + this.rng.next(), max: 2.6 });
      this.decal('scorch', x, y, r * 0.55);
      this.event('boom', x, y, { r });
      this.scare(x, y, 420, 8);
      const buf = [];
      for (const e of this.near(x, y, r + 50, buf)) {
        const d = Math.hypot(e.x - x, e.y - y);
        if (e.kind === 'ped') {
          if (e.dead || e.car || d > r) continue;
          const f = 1 - d / r;
          e.vx += (e.x - x) / (d || 1) * 200 * f; e.vy += (e.y - y) / (d || 1) * 200 * f;
          e.down = 1.2;
          this.pedDamage(e, dmg * (0.3 + 0.9 * f), owner, 'boom');
        } else if (e.kind === 'car') {
          if (e.removed) continue;
          const rr = r + e.m.L / 3;
          if (d > rr) continue;
          const f = 1 - d / rr;
          e.vx += (e.x - x) / (d || 1) * 160 * f / e.m.mass; e.vy += (e.y - y) / (d || 1) * 160 * f / e.m.mass;
          e.av += (this.rng.next() - 0.5) * 6 * f;
          if (!e.dead) this.carDamage(e, dmg * (0.3 + f) * (e.m.tank ? 0.25 : 1), owner, 'boom');
        }
      }
      if (owner && owner.isPlayer) this.crime('boom', x, y);
    }

    pedDamage(p, dmg, attacker, cause, src) {
      if (p.dead || p.removed) return;
      if (p.isPlayer && this.god) return;
      if (p.car && cause !== 'boom-in-car') {
        if (!p.car.m.bike) return;
      }
      if (p.armor > 0) { const take = Math.min(p.armor, dmg * 0.7); p.armor -= take; dmg -= take; }
      p.hp -= dmg;
      p.hurtT = 0.2;
      if (cause === 'bullet' || cause === 'car' || cause === 'boom') this.decal('blood', p.x + this.rng.range(-4, 4), p.y + this.rng.range(-4, 4), 3 + this.rng.next() * 3);
      if (p.hp <= 0) { this.killPed(p, attacker, cause); return; }
      if (p.isPlayer) { this.emit('hurt', { dmg }); return; }
      if (attacker && attacker.isPlayer) {
        if (p.cop) { this.crime('hitcop', p.x, p.y); p.state = 'chase'; p.target = attacker; }
        else if (p.gang || p.def.boss) { p.state = 'attack'; p.target = attacker; if (p.gang) this.provoke(p.gang, p); }
        else if (p.state !== 'idle' && !p.tag) { p.state = 'flee'; p.fleeT = 8; p.flee = { x: attacker.x, y: attacker.y }; }
        if (!p.cop) this.crime('assault', p.x, p.y);
      } else if (attacker && !attacker.isPlayer && (p.gang || p.cop) && attacker.kind === 'ped') {
        p.state = 'attack'; p.target = attacker;
      }
    }

    provoke(gang, victim) {
      for (const q of this.near(victim.x, victim.y, 260)) {
        if (q.kind === 'ped' && q.gang === gang && !q.dead && !q.car && q.state !== 'attack') { q.state = 'attack'; q.target = this.player; }
      }
    }

    killPed(p, attacker, cause) {
      p.dead = true; p.hp = 0; p.state = 'dead'; p.deadT = 0; p.down = 0;
      if (p.car) { const c = p.car; if (c.driver === p) c.driver = null; c.pass = c.pass.filter(q => q !== p); p.car = null; p.x = c.x; p.y = c.y; p.hidden = true; }
      this.decal('blood', p.x, p.y, 7 + this.rng.next() * 4);
      this.emit('kill', { victim: p, attacker, cause, x: p.x, y: p.y });
      if (attacker && attacker.isPlayer && !p.isPlayer) {
        if (p.cop) this.crime('killcop', p.x, p.y);
        else this.crime('kill', p.x, p.y);
      }
      if (p.isPlayer) this.emit('wasted', { cause });
    }

    carDamage(c, dmg, attacker, cause) {
      if (c.dead || c.removed || dmg <= 0) return;
      if (c.m.tank) dmg *= 0.3;
      c.hp -= dmg;
      if (attacker) c.lastHit = attacker;
      if (attacker && attacker.isPlayer && c.driver && !c.driver.isPlayer) {
        if (c.m.police) this.crime('hitcop', c.x, c.y);
        else if (c.driver.gang && cause !== 'car') { c.ai.mode = 'hunt'; c.ai.target = this.player; }
        else if (c.ai.mode === 'traffic') c.ai.panic = 6;
      }
      this.emit('carHit', { car: c, dmg, attacker, cause });
      if (c.hp <= -80) { this.explodeCar(c); return; }
      if (c.hp <= 0 && !c.burning) {
        c.burning = true; c.burnT = 0;
        for (const p of [c.driver].concat(c.pass)) {
          if (!p || p.isPlayer) continue;
          this.ejectPed(p, c);
          p.state = 'flee'; p.fleeT = 6; p.flee = { x: c.x, y: c.y };
        }
        if (c.driver && c.driver.isPlayer) this.emit('fireWarn', { car: c });
      }
    }

    explodeCar(c) {
      if (c.dead) return;
      c.dead = true; c.burning = false; c.hp = 0; c.bomb = false; c.fuse = 0;
      c.ctl.thr = 0; c.siren = false;
      const occupants = [c.driver].concat(c.pass).filter(Boolean);
      c.driver = null; c.pass = [];
      for (const p of occupants) { p.car = null; p.x = c.x; p.y = c.y; this.killPed(p, c.lastHit, 'boom'); p.hidden = !p.isPlayer; }
      this.explosion(c.x, c.y, c.m.tank ? 110 : 84, c.m.tank ? 150 : 115, c.lastHit);
      this.fires.push({ x: c.x, y: c.y, r: 26, life: 6, owner: null, tick: 0, wreck: c });
      this.emit('carDestroyed', { car: c, attacker: c.lastHit || null, x: c.x, y: c.y });
      if (c.lastHit && c.lastHit.isPlayer && c.m.police) this.crime('copcar', c.x, c.y);
    }

    sinkCar(c) {
      if (c.removed) return;
      const occupants = [c.driver].concat(c.pass).filter(Boolean);
      c.driver = null; c.pass = [];
      for (const p of occupants) {
        p.car = null;
        if (p.isPlayer) { p.x = c.x; p.y = c.y; this.killPed(p, null, 'drown'); }
        else this.removePed(p);
      }
      this.event('splash', c.x, c.y, { big: true });
      this.emit('carDestroyed', { car: c, attacker: c.lastHit || (occupants.some(p => p.isPlayer) ? this.player : null), x: c.x, y: c.y, sunk: true });
      this.removeCar(c);
    }

    decal(type, x, y, r, a) {
      this.decals.push({ type, x, y, r, a: a || this.rng.range(0, 6.28), t: this.t });
      if (this.decals.length > 500) this.decals.splice(0, this.decals.length - 500);
    }
    skid(c) {
      const fx = Math.cos(c.a), fy = Math.sin(c.a);
      const back = -c.m.L / 2 + 6, side = c.m.W / 2 - 3;
      for (const s of [-side, side]) this.decal('skid', c.x + fx * back - fy * s, c.y + fy * back + fx * s, 2.2, c.a);
      if (this.rng.chance(0.3)) this.fx.push({ t: 'smoke', x: c.x - fx * c.m.L / 2, y: c.y - fy * c.m.L / 2, vx: 0, vy: 0, r: 5, life: 0.6, max: 0.6, light: true });
    }
    blood(x, y, s) { this.decal('blood', x, y, 6 * s); }

    copsSee(x, y, r) {
      const R = r || 330;
      for (const p of this.peds) if (p.cop && !p.dead && dist2(p.x, p.y, x, y) < R * R) return true;
      for (const c of this.cars) if (c.m.police && !c.dead && c.driver && !c.driver.isPlayer && dist2(c.x, c.y, x, y) < R * R * 1.4) return true;
      return false;
    }

    crime(kind, x, y) {
      const w = this.wanted;
      const seen = this.copsSee(x, y);
      const always = kind === 'killcop' || kind === 'copcar' || kind === 'stealcop' || kind === 'hitcop';
      if (!seen && !always) return;
      const before = w.level;
      const heat = { hitped: 0.5, kill: 1.2, jack: 0.6, stealcop: 2, shoot: 0.4, hitcop: 2, killcop: 3.5, copcar: 3.5, boom: 1.5, assault: 0.5 }[kind] || 0.5;
      w.heat += heat;
      let lvl = Math.max(w.level, 1);
      if (kind === 'stealcop' || kind === 'hitcop' || kind === 'boom') lvl = Math.max(lvl, 2);
      if (kind === 'killcop' || kind === 'copcar') lvl = Math.max(lvl + (w.level >= 2 ? 1 : 0), 2);
      if (w.heat >= 7) lvl = Math.max(lvl, 3);
      if (w.heat >= 14) lvl = Math.max(lvl, 4);
      w.level = Math.min(4, lvl);
      w.cool = 0;
      if (w.level > before) { w.flash = 2; this.emit('wantedUp', { level: w.level }); }
    }

    setWanted(n) {
      const w = this.wanted;
      w.level = clamp(n, 0, 4);
      w.cool = 0;
      w.heat = [0, 1, 4, 8, 15][w.level];
      w.flash = 2;
      if (w.level === 0) this.callOffPolice();
    }

    callOffPolice() {
      for (const c of this.cars) if (c.m.police && c.ai.mode === 'police') { c.ai = { mode: 'traffic', dir: 0 }; c.siren = false; c.chase = false; }
      for (const p of this.peds) if (p.cop && (p.state === 'chase' || p.state === 'attack')) { p.state = 'walk'; p.target = null; }
    }

    updateWanted(dt) {
      const w = this.wanted;
      if (w.flash > 0) w.flash -= dt;
      if (w.level <= 0) { w.heat = Math.max(0, w.heat - dt * 0.2); return; }
      const seen = this.copsSee(this.px, this.py, 280);
      if (seen) w.cool = 0; else w.cool += dt;
      if (w.cool > COOL[w.level]) {
        w.level--; w.cool = 0; w.heat = Math.min(w.heat, [0, 1, 4, 8, 15][w.level]);
        this.emit('wantedDown', { level: w.level });
        if (w.level === 0) this.callOffPolice();
      }
    }

    setupPickups() {
      const city = this.city;
      const rng = new RNG(4242);
      const kinds = [['w_pm', 12], ['w_obrez', 7], ['w_akm', 7], ['w_rpg', 4], ['w_molotov', 7], ['armor', 9], ['health', 11], ['bribe', 7]];
      const ok = (x, y) => { const g = city.surfAt(x, y); return (g === GR.YARD || g === GR.PLAZA || g === GR.DIRT || g === GR.GRASS) && city.walkable(x, y) && city.inPlay(x, y); };
      const used = [];
      for (const [k, n] of kinds) for (let j = 0; j < n; j++) {
        for (let tries = 0; tries < 300; tries++) {
          const x = rng.next() * city.W, y = rng.next() * city.H;
          if (!ok(x, y)) continue;
          if (used.some(([a, b]) => Math.abs(a - x) + Math.abs(b - y) < 600)) continue;
          used.push([x, y]);
          this.pickups.push({ id: 'p' + this.pickups.length, type: k, x, y, active: true, respawn: k === 'bribe' ? 150 : 70, t: 0 });
          break;
        }
      }
      for (const f of city.fixedPickups || []) {
        const t = city.walkable(f.x, f.y) ? [f.x, f.y] : city.nearestPoint(f.x, f.y, (x, y) => city.walkable(x, y), 200);
        if (!t) continue;
        this.pickups.push({ id: f.key || ('p' + this.pickups.length), type: f.type, x: t[0], y: t[1], active: true, respawn: f.key ? 0 : 90, t: 0, once: !!f.key });
      }
    }

    updatePickups(dt) {
      const p = this.player;
      for (const k of this.pickups) {
        if (!k.active) { if (k.respawn && !k.once) { k.t += dt; if (k.t > k.respawn) { k.active = true; k.t = 0; } } continue; }
        if (p.dead) continue;
        const inBoat = p.car && p.car.m.boat;
        if (inBoat) continue;
        const r = p.car ? 24 : 16;
        if (dist2(k.x, k.y, this.px, this.py) > r * r) continue;
        if (!this.canTake || this.canTake(k)) {
          k.active = false; k.t = 0;
          this.takePickup(k);
        }
      }
    }

    takePickup(k) {
      const p = this.player;
      const def = PICKUPS[k.type];
      if (def.weapon) {
        const w = WEAPONS[def.weapon];
        p.weapons[def.weapon] = (p.weapons[def.weapon] || 0) + w.pickup;
        if (p.cur === 'fist' || !p.car) p.cur = def.weapon;
      } else if (k.type === 'health') p.hp = p.maxHp;
      else if (k.type === 'armor') p.armor = 100;
      else if (k.type === 'bribe') this.setWanted(0);
      this.event('pickup', k.x, k.y, { kind: k.type, pickup: k });
    }

    trafficModel(zone) {
      const list = TRAFFIC[ZONE_MIX[zone] || 'base'];
      return weighted(this.rng, list);
    }

    population(dt) {
      this.spawnT -= dt;
      if (this.spawnT > 0) return;
      this.spawnT = 0.25;
      const city = this.city;
      const px = this.px, py = this.py;
      const zone = city.zoneKey(px, py);
      const dens = (ZONE_DENS[zone] || 0.8) * this.density;
      const minR = this.viewR + 80, maxR = this.viewR + 520;
      let nCars = 0, nPeds = 0;
      for (let i = this.cars.length - 1; i >= 0; i--) {
        const c = this.cars[i];
        const d = Math.hypot(c.x - px, c.y - py);
        if (c.persist || c === this.player.car || (c.driver && c.driver.isPlayer)) continue;
        if (c.m.police && c.ai.mode === 'police') continue;
        if (d > maxR + 450 || (c.dead && d > this.viewR + 200 && this.t - (c.deadAt || (c.deadAt = this.t)) > 20)) { this.removeCar(c); continue; }
        if (!c.parked && c.driver) nCars++;
      }
      for (let i = this.peds.length - 1; i >= 0; i--) {
        const p = this.peds[i];
        if (p.isPlayer || p.persist || p.car) continue;
        const d = Math.hypot(p.x - px, p.y - py);
        if (d > maxR + 350 || (p.dead && (p.deadT > 45 || d > this.viewR + 150)) || (p.hidden && p.dead)) { this.removePed(p); continue; }
        if (!p.dead) nPeds++;
      }
      const wantCars = Math.round(20 * dens), wantPeds = Math.round(34 * dens);
      if (nCars < wantCars) this.trySpawnTraffic(px, py, minR, maxR);
      if (nPeds < wantPeds) { this.trySpawnPed(px, py, minR - 80, maxR - 100); this.trySpawnPed(px, py, minR - 80, maxR - 100); }
      this.parkedCars(px, py);
      this.policeDispatch();
    }

    ringPoint(px, py, minR, maxR, pred) {
      for (let tries = 0; tries < 14; tries++) {
        const a = this.rng.range(-Math.PI, Math.PI), r = this.rng.range(minR, maxR);
        const x = px + Math.cos(a) * r, y = py + Math.sin(a) * r;
        if (!this.city.playAt(x, y)) continue;
        const q = pred(x, y);
        if (q) return q;
      }
      return null;
    }

    trySpawnTraffic(px, py, minR, maxR) {
      const city = this.city, net = city.net;
      const r = this.ringPoint(px, py, minR, maxR, (x, y) => {
        const q = net.nearestLane(x, y, null, 30 * city.M, true);
        if (!q) return null;
        const lane = net.lanes[q.lane];
        if (lane.conn || q.s < 8 || q.s > lane.len - 8) return null;
        return q;
      });
      if (!r) return;
      for (const c of this.cars) if (dist2(c.x, c.y, r.x, r.y) < 70 * 70) return;
      for (const tr of this.trams) for (const tc of tr.cars) if (dist2(tc.x, tc.y, r.x, r.y) < 120 * 120) return;
      const zone = city.zoneKey(r.x, r.y);
      let mid = this.trafficModel(zone);
      let driver = 'civ';
      const gang = ZONE_GANG[zone];
      if (gang && this.rng.chance(0.1) && this.opts.gangs !== false && G.GANGS[gang]) { mid = G.GANGS[gang].car; driver = gang; }
      if (VEHICLES[mid].police) driver = 'cop';
      if (mid === 'taxi' || mid === 'liaz' || mid === 'raf' || mid === 'ikarus' || mid === 'ziu') driver = 'civ';
      const c = this.spawnCar(mid, r.x, r.y, r.a, { driver, mode: 'traffic' });
      c.ai.lane = r.lane; c.ai.s = r.s; c.ai.next = -1;
      c.ai.cruise = 120 + this.rng.next() * 70 + (VEHICLES[mid].kind === 'heavy' ? -30 : 0);
      const sp = c.ai.cruise * 0.7;
      c.vx = Math.cos(c.a) * sp; c.vy = Math.sin(c.a) * sp;
      if (c.m.police) { const q = this.spawnPed('cop', r.x, r.y); this.putIn(q, c, false); }
    }

    trySpawnPed(px, py, minR, maxR) {
      const city = this.city, net = city.net;
      const r = this.ringPoint(px, py, minR, maxR, (x, y) => net.nearestWalk(x, y, 40 * city.M));
      if (!r) return;
      const e = net.walkEdges[r.edge];
      if (e.kind === 'cross') return;
      const q = pointAt(e.pts, e.cum, r.s);
      const x = q[0] + this.rng.range(-6, 6), y = q[1] + this.rng.range(-6, 6);
      if (!city.walkable(x, y)) return;
      const zone = city.zoneKey(x, y);
      const rr = this.rng.next();
      let type = 'civ';
      const gang = ZONE_GANG[zone];
      if (rr < 0.045) type = 'cop';
      else if (rr < 0.12 && gang && this.opts.gangs !== false && G.PEDS[gang]) type = gang;
      else if (rr < 0.25) type = 'babushka';
      else if (rr < 0.33) type = zone === 'melkovka' || zone === 'tkachey' ? 'worker' : 'student';
      const p = this.spawnPed(type, x, y);
      p.edge = r.edge; p.es = r.s; p.edir = this.rng.chance(0.5) ? 1 : -1;
    }

    parkedCars(px, py) {
      const city = this.city;
      const R = this.viewR + 400;
      for (let k = 0; k < city.parking.length; k++) {
        const sp = city.parking[k];
        const d2v = dist2(sp.x, sp.y, px, py);
        const st = this.parkState.get(k);
        if (st === 'on') continue;
        if (d2v > R * R || d2v < (this.viewR + 40) * (this.viewR + 40)) continue;
        if (typeof st === 'number' && this.t - st < 90) continue;
        const zone = city.zoneKey(sp.x, sp.y);
        let mid = this.trafficModel(zone);
        if (VEHICLES[mid].police || VEHICLES[mid].kind === 'heavy') mid = 'vaz2106';
        const c = this.spawnCar(mid, sp.x, sp.y, sp.a, { parked: true, spot: k });
        c.ai.mode = 'none';
        this.parkState.set(k, 'on');
      }
      for (let n = this.cars.length - 1; n >= 0; n--) {
        const c = this.cars[n];
        if (c.spot < 0 || c.persist || c.touched) continue;
        if (dist2(c.x, c.y, px, py) > (R + 300) * (R + 300)) { this.parkState.delete(c.spot); c.spot = -1; this.removeCar(c); }
      }
      for (const c of this.cars) if (c.spot >= 0 && (c.touched || c.dead) && this.parkState.get(c.spot) === 'on') { this.parkState.set(c.spot, this.t); c.spot = -1; }
    }

    policeDispatch() {
      const lvl = this.wanted.level;
      if (lvl <= 0) return;
      this.policeT -= 0.25;
      if (this.policeT > 0) return;
      this.policeT = 1.2;
      let n = 0;
      for (const c of this.cars) if (c.m.police && !c.dead && c.ai.mode === 'police') n++;
      for (const c of this.cars) {
        if (n >= POLICE_WANT[lvl]) break;
        if (c.m.police && !c.dead && c.driver && !c.driver.isPlayer && c.ai.mode === 'traffic' && dist2(c.x, c.y, this.px, this.py) < 900 * 900) { c.ai = { mode: 'police' }; c.siren = true; n++; }
      }
      if (lvl >= 3) this.roadblock();
      if (n >= POLICE_WANT[lvl]) return;
      const city = this.city, net = city.net;
      const r = this.ringPoint(this.px, this.py, this.viewR + 60, this.viewR + 420, (x, y) => net.nearestLane(x, y, null, 30 * city.M, true));
      if (!r) return;
      const mid = lvl >= 4 ? (this.rng.chance(0.5) ? 'kgb' : 'police') : lvl >= 3 ? (this.rng.chance(0.35) ? 'gai' : 'police') : (this.rng.chance(0.5) ? 'gai' : 'police');
      const c = this.spawnCar(mid, r.x, r.y, r.a, { driver: mid === 'kgb' ? 'kgb' : lvl >= 4 ? 'omon' : 'cop', mode: 'police' });
      c.siren = true;
      const q = this.spawnPed(mid === 'kgb' ? 'kgb' : lvl >= 3 ? 'omon' : 'cop', r.x, r.y);
      this.putIn(q, c, false);
    }

    roadblock() {
      const c = this.player.car;
      if (!c || c.m.boat || (this.blockT || 0) > this.t) return;
      const sp = Math.hypot(c.vx, c.vy);
      if (sp < 120) return;
      const city = this.city, net = city.net;
      const ax = c.x + c.vx / sp * 620, ay = c.y + c.vy / sp * 620;
      const r = net.nearestLane(ax, ay, Math.atan2(c.vy, c.vx), 40 * city.M, true);
      if (!r) return;
      const lane = net.lanes[r.lane];
      if (lane.conn) return;
      const seg = net.segs[lane.seg];
      const q = pointAt(seg.pts, seg.cum, G.projectOn(seg.pts, seg.cum, r.x, r.y)[0]);
      this.blockT = this.t + 14;
      const nx = -Math.sin(q[2]), ny = Math.cos(q[2]);
      const half = seg.w / 2 - 12;
      const n = Math.max(1, Math.round(seg.w / 46));
      for (let k = 0; k < n; k++) {
        const off = n === 1 ? 0 : -half + (2 * half) * k / (n - 1);
        const x = q[0] + nx * off, y = q[1] + ny * off;
        if (this.cars.some(o => !o.removed && Math.abs(o.x - x) < 30 && Math.abs(o.y - y) < 30)) continue;
        const car = this.spawnCar(this.wanted.level >= 4 ? 'kgb' : 'police', x, y, q[2] + Math.PI / 2 + (k % 2 ? Math.PI : 0), { parked: true });
        car.flash = true; car.roadblock = true;
        const p = this.spawnPed(this.wanted.level >= 4 ? 'omon' : 'cop', x - Math.cos(q[2]) * 34, y - Math.sin(q[2]) * 34, { state: 'chase' });
        p.target = this.player;
      }
      this.emit('roadblock', { x: q[0], y: q[1] });
    }

    updateGarages(dt) {
      const p = this.player;
      const c = p.car;
      for (const g of Object.values(this.city.garages)) {
        const inside = c && !c.dead && Math.abs(c.x - g.x) < 22 && Math.abs(c.y - g.y) < 22 && Math.hypot(c.vx, c.vy) < 60;
        if (inside && !g.busy && !g.inside) { g.inside = true; this.emit('garage', { g, car: c }); }
        else if (!inside && g.inside && !g.busy) g.inside = false;
        if (g.busy) { g.busy -= dt; if (g.busy <= 0) { g.busy = 0; this.emit('garageDone', { g, car: g.car }); g.car = null; } }
      }
    }

    updateFires(dt) {
      for (let i = this.fires.length - 1; i >= 0; i--) {
        const f = this.fires[i];
        f.life -= dt; f.tick -= dt;
        if (this.rng.chance(0.5)) this.fx.push({ t: 'fire', x: f.x + this.rng.range(-f.r, f.r) * 0.6, y: f.y + this.rng.range(-f.r, f.r) * 0.6, vx: 0, vy: -10, r: 6 + this.rng.next() * 6, life: 0.5, max: 0.5 });
        if (f.tick <= 0) {
          f.tick = 0.25;
          for (const e of this.near(f.x, f.y, f.r + 30)) {
            const d = Math.hypot(e.x - f.x, e.y - f.y);
            if (e.kind === 'ped' && !e.dead && !e.car && d < f.r) { e.burn = Math.max(e.burn, 2.5); e.burnBy = f.owner; }
            if (e.kind === 'car' && !e.dead && d < f.r + e.m.L / 3 && e !== f.wreck) this.carDamage(e, 5, f.owner, 'fire');
          }
        }
        if (f.life <= 0) this.fires.splice(i, 1);
      }
    }

    updateFx(dt) {
      for (let i = this.fx.length - 1; i >= 0; i--) {
        const f = this.fx[i];
        f.life -= dt;
        if (f.vx) f.x += f.vx * dt;
        if (f.vy) f.y += f.vy * dt;
        if (f.life <= 0) this.fx.splice(i, 1);
      }
      if (this.fx.length > 700) this.fx.splice(0, this.fx.length - 700);
      for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.t += dt; t.y -= 22 * dt; if (t.t > 1.6) this.texts.splice(i, 1); }
    }

    floatText(text, x, y, color) { this.texts.push({ text, x, y, t: 0, color: color || '#ffe040' }); }

    step(dt, inp) {
      this.t += dt;
      if (this.freeze > 0) this.freeze -= dt;
      if (this.hornT > 0) this.hornT -= dt;
      this.control(inp || {}, dt);
      this.rebuildGrid();
      this.think(dt);
      for (const c of this.cars) {
        if (c.removed) continue;
        if (c.gunCool > 0) c.gunCool -= dt;
        this.stepCar(c, dt);
        this.carVsProps(c);
        if (c.burning) {
          c.burnT += dt;
          if (this.rng.chance(0.6)) this.fx.push({ t: 'fire', x: c.x + this.rng.range(-8, 8), y: c.y + this.rng.range(-8, 8), vx: 0, vy: -14, r: 7 + this.rng.next() * 6, life: 0.45, max: 0.45 });
          if (c.burnT > 3.6) this.explodeCar(c);
        } else if (!c.dead && c.hp < c.maxHp * 0.35 && this.rng.chance(0.25)) {
          const fx = Math.cos(c.a), fy = Math.sin(c.a);
          this.fx.push({ t: 'smoke', x: c.x + fx * c.m.L * 0.35, y: c.y + fy * c.m.L * 0.35, vx: this.rng.range(-8, 8), vy: -12, r: 5, life: 1, max: 1, light: c.hp > c.maxHp * 0.2 });
        }
        if (c.fuse > 0) { c.fuse -= dt; if (c.fuse <= 0) { c.fuse = 0; this.explodeCar(c); } }
      }
      const buf = [];
      for (const c of this.cars) {
        if (c.removed) continue;
        for (const e of this.near(c.x, c.y, 100, buf)) {
          if (e === c) continue;
          if (e.kind === 'car') { if (e.id > c.id && !e.removed) this.carVsCar(c, e); }
          else if (!c.m.boat) this.carVsPed(c, e);
        }
      }
      for (const p of this.peds) {
        if (p.removed) continue;
        if (p.car) { p.x = p.car.x; p.y = p.car.y; continue; }
        if (p.dead) { p.deadT += dt; }
        if (p.hitCd > 0) p.hitCd -= dt;
        if (p.cool > 0) p.cool -= dt;
        if (p.down > 0) p.down -= dt;
        if (p.hurtT > 0) p.hurtT -= dt;
        if (p.burn > 0 && !p.dead) {
          p.burn -= dt;
          if (this.rng.chance(0.5)) this.fx.push({ t: 'fire', x: p.x, y: p.y, vx: 0, vy: -12, r: 5, life: 0.4, max: 0.4 });
          this.pedDamage(p, 14 * dt, p.burnBy || null, 'fire');
          if (!p.isPlayer && !p.dead) { p.state = 'flee'; p.fleeT = 2; p.flee = { x: p.x + this.rng.range(-5, 5), y: p.y + this.rng.range(-5, 5) }; }
        }
        this.stepPed(p, dt);
        p.anim += Math.hypot(p.vx, p.vy) * dt * 0.12;
      }
      this.stepShots(dt);
      this.updateFires(dt);
      this.updateFx(dt);
      this.updateWanted(dt);
      this.updatePickups(dt);
      this.updateGarages(dt);
      this.updateTrams(dt);
      this.population(dt);
      if (this.player.car && this.player.car.removed) { const c = this.player.car; this.player.car = null; this.player.x = c.x; this.player.y = c.y; }
    }
  }

  Object.assign(World.prototype, G.Phys);
  Object.assign(G, { World, TRAFFIC, ZONE_GANG, weighted });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
