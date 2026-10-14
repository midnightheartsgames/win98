(function (G) {
  'use strict';
  const { T, GR, clamp, dist, VEHICLES, PICKUPS } = G;

  const INSTANT = new Set(['spawnCar', 'spawnPed', 'wanted', 'clearWanted', 'hostile', 'say', 'setDate']);
  const STEP_TYPES = new Set(['spawnCar', 'spawnPed', 'wanted', 'clearWanted', 'hostile', 'say', 'setDate', 'enter', 'deliver', 'goto', 'kill', 'wreck', 'damage', 'unseat', 'pickup', 'board', 'drop', 'lose', 'follow', 'race', 'crush', 'fares', 'bombfit', 'countdown', 'wait']);

  class Mission {
    constructor(game, def) {
      this.g = game;
      this.w = game.world;
      this.city = game.city;
      this.def = def;
      this.refs = {};
      this.pickups = [];
      this.idx = -1;
      this.state = 'run';
      this.text = '';
      this.timeLeft = null;
      this.count = 0;
      this.cp = 0;
      this.next();
    }

    say(text, kind) { this.g.msg(text, kind || 'info'); }

    placeOf(at, off) {
      let x, y;
      if (typeof at === 'string' && at.startsWith('ref:')) {
        const e = this.refs[at.slice(4)];
        if (!e) return null;
        x = e.lastX != null && e.removed ? e.lastX : e.x; y = e.lastY != null && e.removed ? e.lastY : e.y;
      } else if (typeof at === 'string') {
        const p = this.city.places[at];
        if (!p) throw new Error('place ' + at);
        x = p.x; y = p.y;
      } else { x = at.x; y = at.y; }
      if (off) { x += off[0] * T; y += off[1] * T; }
      return { x, y };
    }

    roadSpot(x, y, minR) {
      const city = this.city, net = city.net;
      const r0 = (minR || 0) * T;
      const free = (px, py) => !this.w.cars.some(c => !c.removed && Math.abs(c.x - px) < 46 && Math.abs(c.y - py) < 46);
      for (let r = r0; r < r0 + 40 * T; r += T) {
        const n = Math.max(1, Math.round(r / T * 6));
        let best = null, bd = Infinity;
        for (let k = 0; k < n; k++) {
          const a = k / n * Math.PI * 2;
          const q = net.nearestLane(x + Math.cos(a) * r, y + Math.sin(a) * r, null, T * 0.9, true);
          if (!q) continue;
          const lane = net.lanes[q.lane];
          if (lane.conn || q.s < 10 || q.s > lane.len - 10) continue;
          const d = Math.hypot(q.x - x, q.y - y);
          if (d < r0 - T * 1.5 || !free(q.x, q.y)) continue;
          if (d < bd) { bd = d; best = q; }
        }
        if (best) return { x: best.x, y: best.y, a: best.a, lane: best.lane, s: best.s };
      }
      return { x, y, a: 0, lane: -1, s: 0 };
    }

    freeTile(x, y) {
      const city = this.city;
      if (city.walkable(x, y)) return { x, y };
      const t = city.nearestPoint(x, y, (a, b) => city.walkable(a, b), 260);
      return t ? { x: t[0], y: t[1] } : { x, y };
    }

    spawnCar(s) {
      const w = this.w;
      let p = this.placeOf(s.at, s.off);
      let a = s.a != null ? s.a : 0, lane = null;
      if (s.road) { const r = this.roadSpot(p.x, p.y, s.far || s.near || 0); p = r; a = r.a; lane = r; }
      else if (s.parked && !this.city.drivable(p.x, p.y)) { const q = this.city.nearestPoint(p.x, p.y, (x, y) => this.city.drivable(x, y) && this.city.drivable(x + 20, y) && this.city.drivable(x - 20, y), 300); if (q) p = { x: q[0], y: q[1] }; }
      const c = w.spawnCar(s.model, p.x, p.y, a, { color: s.color, parked: !!s.parked, persist: true, driver: s.driver || null, mode: s.mode || 'none', tag: 'mission' });
      if (s.hp) { c.hp = c.maxHp = s.hp; }
      if (c.driver) { c.driver.persist = true; c.driver.tag = 'mission'; }
      for (const t of s.pass || []) { const q = w.spawnPed(t, p.x, p.y, { persist: true, tag: 'mission' }); w.putIn(q, c, false); }
      const ai = c.ai;
      if (lane && lane.lane >= 0) { ai.lane = lane.lane; ai.s = lane.s; ai.next = -1; }
      if (s.dest) ai.dest = this.placeOf(s.dest);
      if (s.speed) ai.speed = s.speed;
      if (s.careful) ai.careful = true;
      if (s.mode === 'traffic') ai.cruise = s.speed || 160;
      if (s.mode === 'hunt') ai.target = w.player;
      if (s.mode === 'flee') ai.cruise = s.speed || 140;
      if (s.parked) { c.ctl.hand = true; }
      this.refs[s.ref] = c;
      return c;
    }

    spawnPed(s) {
      const w = this.w;
      const p0 = this.placeOf(s.at, s.off);
      const p = this.freeTile(p0.x, p0.y);
      const q = w.spawnPed(s.type, p.x, p.y, { persist: true, tag: 'mission', state: s.state || 'idle', weapon: s.weapon, hp: s.hp });
      if (s.state === 'guard') { q.post = { x: p.x, y: p.y }; q.aggro = s.aggro || 190; }
      if (s.state === 'attack') q.target = w.player;
      if (s.hostileAlways) q.hostileAlways = true;
      q.faceA = Math.atan2(w.py - q.y, w.px - q.x);
      this.refs[s.ref] = q;
      return q;
    }

    spawnPickup(s) {
      const p0 = this.placeOf(s.at, s.off);
      if (!p0) return null;
      const p = this.freeTile(p0.x, p0.y);
      const k = { id: 'm_' + s.ref, type: s.kind, x: p.x, y: p.y, active: true, respawn: 0, t: 0, mission: true, once: true };
      this.w.pickups.push(k);
      this.pickups.push(k);
      this.refs[s.ref] = k;
      return k;
    }

    next() {
      for (;;) {
        this.idx++;
        const s = this.def.steps[this.idx];
        if (!s) { this.state = 'done'; return; }
        this.cur = s;
        this.t = 0;
        this.timeLeft = s.time || null;
        this.count = 0;
        this.warn = 0;
        if (s.text) { this.text = G.genderize(s.text, this.g.fem); this.say(this.text, 'objective'); }
        this.init(s);
        if (!INSTANT.has(s.do)) return;
      }
    }

    init(s) {
      const w = this.w, g = this.g;
      switch (s.do) {
        case 'spawnCar': this.spawnCar(s); break;
        case 'spawnPed': this.spawnPed(s); break;
        case 'wanted': if (w.wanted.level < s.level) w.setWanted(s.level); break;
        case 'clearWanted': w.setWanted(0); break;
        case 'hostile': if (s.on) w.hostile.add(s.gang); else w.hostile.delete(s.gang); break;
        case 'say': this.say(G.genderize(s.text, g.fem), 'story'); break;
        case 'setDate': g.renamed = true; g.msg('23 сентября 1991 года. Свердловск снова называется Екатеринбург!', 'big'); break;
        case 'pickup': this.spawnPickup(s); break;
        case 'deliver': { const gar = this.city.garages[s.at]; gar.open = true; g.updateGarages(); break; }
        case 'race': {
          this.cps = s.cps.map(id => this.placeOf(id));
          for (const r of s.rivals) {
            const c = this.refs[r];
            if (!c || c.dead) continue;
            c.ai = { mode: 'race', cps: this.cps, cp: 0, speed: c.m.max * 0.82 };
          }
          this.cp = 0;
          break;
        }
        case 'countdown': this.cdLast = -1; break;
        case 'bombfit': break;
        default: break;
      }
    }

    fail(reason) {
      if (this.state !== 'run') return;
      this.state = 'fail';
      this.reason = reason || '';
    }

    alive(e) { return e && !e.removed && !e.dead; }

    update(dt) {
      if (this.state !== 'run') return;
      const s = this.cur, w = this.w, P = w.player;
      this.t += dt;
      if (this.timeLeft != null) {
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) { this.fail('Время вышло.'); return; }
      }
      for (const e of Object.values(this.refs)) if (e && !e.removed) { e.lastX = e.x; e.lastY = e.y; }
      switch (s.do) {
        case 'enter': {
          const c = this.refs[s.ref];
          if (!c || c.removed || c.dead) { this.fail('Машина уничтожена.'); return; }
          if (P.car === c) this.next();
          break;
        }
        case 'deliver': {
          const c = this.refs[s.ref];
          if (!c || c.dead || (c.removed && !this.delivered)) { this.fail('Машина уничтожена.'); return; }
          if (this.delivered) this.next();
          break;
        }
        case 'goto': {
          const p = this.placeOf(s.at);
          const need = s.need || 'any';
          let okNeed = true;
          if (need === 'car') okNeed = !!P.car && !P.car.m.boat;
          else if (need === 'foot') okNeed = !P.car;
          else if (need === 'boat') okNeed = !!P.car && P.car.m.boat;
          else if (need.startsWith('ref:')) { const c = this.refs[need.slice(4)]; if (!c || c.removed || c.dead) { this.fail('Транспорт потерян.'); return; } okNeed = P.car === c; }
          if (okNeed && dist(w.px, w.py, p.x, p.y) < (s.r || 40)) this.next();
          break;
        }
        case 'kill': {
          if (s.refs.every(r => { const e = this.refs[r]; return !e || e.dead || e.removed; })) this.next();
          break;
        }
        case 'wreck': {
          if (s.refs.every(r => { const e = this.refs[r]; return !e || e.dead || e.removed; })) this.next();
          break;
        }
        case 'damage': {
          const c = this.refs[s.ref];
          if (!c || c.removed) { this.fail('Цель потеряна.'); return; }
          if (c.dead || c.hp < c.maxHp * s.below) {
            for (const q of [c.driver].concat(c.pass)) { if (!q || q.isPlayer) continue; w.ejectPed(q, c); q.state = 'flee'; q.fleeT = 10; q.flee = { x: c.x, y: c.y }; }
            c.ai = { mode: 'none' };
            this.next();
          }
          break;
        }
        case 'unseat': {
          const c = this.refs[s.ref];
          if (!c || c.removed || c.dead || !c.driver || c.driver.dead) this.next();
          break;
        }
        case 'pickup': {
          const k = this.refs[s.ref];
          if (k && !k.active) this.next();
          break;
        }
        case 'board': {
          const q = this.refs[s.ref];
          if (!q || q.dead || q.removed) { this.fail(q ? 'Пассажир погиб.' : 'Пассажир потерян.'); return; }
          const c = P.car;
          if (q.car && q.car === c) { this.next(); break; }
          if (c && !c.m.bike && !c.m.boat && q.state !== 'enter' && dist(c.x, c.y, q.x, q.y) < 90 && Math.hypot(c.vx, c.vy) < 30) { q.state = 'enter'; q.goalCar = c; }
          if (q.state === 'enter' && q.goalCar !== c) q.state = 'idle';
          break;
        }
        case 'drop': {
          const q = this.refs[s.ref];
          if (!q || q.dead || q.removed) { this.fail('Пассажир погиб.'); return; }
          const p = this.placeOf(s.at);
          if (!q.car) {
            this.warn += dt;
            if (this.warn > 1 && !P.car) { q.state = 'follow'; q.target = P; }
            if (P.car && dist(P.car.x, P.car.y, q.x, q.y) < 90 && Math.hypot(P.car.vx, P.car.vy) < 30 && q.state !== 'enter') { q.state = 'enter'; q.goalCar = P.car; }
            break;
          }
          this.warn = 0;
          const c = q.car;
          if (dist(c.x, c.y, p.x, p.y) < (s.r || 60) && Math.hypot(c.vx, c.vy) < 40) {
            w.ejectPed(q, c);
            q.state = 'goto'; q.goal = { x: p.x, y: p.y }; q.after = 'idle';
            this.next();
          }
          break;
        }
        case 'lose': {
          if (w.wanted.level === 0) this.next();
          break;
        }
        case 'follow': {
          const c = this.refs[s.ref];
          if (!c || c.removed || c.dead) { this.fail('Цель уничтожена.'); return; }
          if (c.ai.arrived) { this.next(); break; }
          const d = dist(w.px, w.py, c.x, c.y);
          if (d > s.max) { this.far = (this.far || 0) + dt; if (this.far > 7) { this.fail('Ты {упустил|упустила} машину.'); return; } } else this.far = 0;
          if (d < s.min) { this.close = (this.close || 0) + dt; if (this.close > 3) { this.fail('Тебя заметили!'); c.ai = { mode: 'flee', cruise: 220 }; return; } } else this.close = 0;
          this.warnText = d > s.max ? 'Ты отстаёшь!' : d < s.min ? 'Слишком близко!' : '';
          break;
        }
        case 'race': {
          if (!P.car) break;
          const cp = this.cps[this.cp];
          if (cp && dist(P.car.x, P.car.y, cp.x, cp.y) < 70) {
            this.cp++;
            this.g.sfx('checkpoint');
            if (this.cp >= this.cps.length) { this.next(); break; }
            this.say('Контрольная точка ' + this.cp + ' из ' + this.cps.length, 'info');
          }
          break;
        }
        case 'crush': case 'fares': {
          if (this.count >= s.n) this.next();
          break;
        }
        case 'bombfit': {
          if (this.bombDone) this.next();
          break;
        }
        case 'wait': {
          this.waitLeft = s.secs - this.t;
          if (this.t >= s.secs) this.next();
          break;
        }
        case 'countdown': {
          const left = Math.ceil(s.secs - this.t);
          if (left !== this.cdLast) { this.cdLast = left; this.g.msg(left > 0 ? String(left) : 'МАРШ!', 'count'); this.g.sfx(left > 0 ? 'beep' : 'go'); }
          if (this.t >= s.secs) this.next();
          break;
        }
        default: break;
      }
      if (this.state === 'run' && this.cur.do === 'wreck' && this.cur.failArrive) {
        for (const r of this.cur.refs) { const e = this.refs[r]; if (e && !e.dead && e.ai && e.ai.arrived) { this.fail('Цель ушла.'); return; } }
      }
      if (this.state === 'run' && this.cur.do === 'damage' && this.cur.failArrive) {
        const e = this.refs[this.cur.ref];
        if (e && e.ai && e.ai.arrived) this.fail('Инкассаторы доехали до проходной.');
      }
    }

    onEvent(type, e) {
      if (this.state !== 'run') return;
      const s = this.cur;
      if (type === 'garage' && s.do === 'deliver' && e.g.id === s.at) {
        const c = this.refs[s.ref];
        if (e.car !== c) { this.g.msg('Это не та машина.', 'info'); return 'reject'; }
        if (c.hp < c.maxHp * (s.minHp || 0)) { this.fail('Машина слишком побита — заказчик не возьмёт.'); return 'reject'; }
        this.delivered = true;
        return 'take';
      }
      if (type === 'raceFinish' && s.do === 'race' && s.rivals.some(r => this.refs[r] === e.car)) this.fail('Соперник пришёл первым.');
      if (type === 'crushed' && s.do === 'crush') { this.count++; this.say('Под прессом: ' + this.count + ' из ' + s.n, 'info'); }
      if (type === 'fare' && s.do === 'fares') { this.count++; this.say('Пассажиров: ' + this.count + ' из ' + s.n, 'info'); }
      if (type === 'bombFitted' && s.do === 'bombfit') this.bombDone = true;
      if (type === 'carHit' && s.do === 'follow' && e.car === this.refs[s.ref] && e.attacker && e.attacker.isPlayer) { this.fail('Ты {спугнул|спугнула} Жмыхова.'); e.car.ai = { mode: 'flee', cruise: 230 }; }
      return null;
    }

    cleanup(success) {
      const w = this.w;
      for (const k of this.pickups) { k.active = false; const i = w.pickups.indexOf(k); if (i >= 0) w.pickups.splice(i, 1); }
      for (const e of Object.values(this.refs)) {
        if (!e || e.kind === undefined) continue;
        e.persist = false;
        if (e.kind === 'car') { for (const q of [e.driver].concat(e.pass)) if (q && !q.isPlayer) q.persist = false; if (e.driver && !e.driver.isPlayer && e.ai.mode === 'race') e.ai = { mode: 'traffic' }; }
        if (e.kind === 'ped' && !e.dead && (e.state === 'guard' || e.state === 'attack') && success) e.state = 'walk';
      }
      for (const g of Object.values(this.city.garages)) if (g.kind === 'deliver') g.open = false;
      this.g.updateGarages();
    }

    markers() {
      const out = [];
      if (this.state !== 'run') return out;
      const s = this.cur, w = this.w, P = w.player;
      const add = (x, y, o) => out.push(Object.assign({ x, y }, o || {}));
      const ent = e => e && !e.removed && !e.dead;
      switch (s.do) {
        case 'enter': { const c = this.refs[s.ref]; if (ent(c)) add(c.x, c.y, { ground: false }); break; }
        case 'deliver': {
          const c = this.refs[s.ref];
          if (P.car === c) { const gr = this.city.garages[s.at]; add(gr.x, gr.y, { r: 26 }); }
          else if (ent(c)) add(c.x, c.y, { ground: false });
          break;
        }
        case 'goto': case 'drop': { const p = this.placeOf(s.at); add(p.x, p.y, { r: s.r ? Math.min(60, s.r) : 30 }); break; }
        case 'kill': case 'wreck': for (const r of s.refs) { const e = this.refs[r]; if (ent(e)) add(e.x, e.y, { ground: false, color: '#ff4030' }); } break;
        case 'damage': case 'unseat': case 'follow': { const e = this.refs[s.ref]; if (ent(e)) add(e.x, e.y, { ground: false, color: s.do === 'follow' ? '#40c0ff' : '#ff4030' }); break; }
        case 'pickup': { const k = this.refs[s.ref]; if (k && k.active) add(k.x, k.y, { ground: false }); break; }
        case 'board': { const q = this.refs[s.ref]; if (ent(q)) add(q.x, q.y, { ground: false, color: '#40ff60' }); break; }
        case 'race': { const cp = this.cps[this.cp]; if (cp) add(cp.x, cp.y, { r: 60, color: '#40ff60' }); break; }
        case 'crush': { const gr = this.city.garages.crusher; add(gr.x, gr.y, { r: 26 }); break; }
        case 'bombfit': { const gr = this.nearestGarage('bomb'); add(gr.x, gr.y, { r: 26 }); break; }
        case 'wait': if (s.at) { const p = this.placeOf(s.at); add(p.x, p.y, { r: 30 }); } break;
        case 'fares': break;
        default: break;
      }
      return out;
    }

    nearestGarage(kind) {
      let best = null, bd = 1e12;
      for (const g of Object.values(this.city.garages)) if (g.kind === kind) { const d = G.dist2(g.x, g.y, this.w.px, this.w.py); if (d < bd) { bd = d; best = g; } }
      return best;
    }
  }

  function validateMission(m, city) {
    const errs = [];
    const refs = new Set();
    for (const s of m.steps) {
      if (!STEP_TYPES.has(s.do)) errs.push(m.id + ': unknown step ' + s.do);
      const at = s.at;
      if (at && typeof at === 'string' && !at.startsWith('ref:') && !city.places[at]) errs.push(m.id + ': unknown place ' + at);
      if (at && typeof at === 'string' && at.startsWith('ref:') && !refs.has(at.slice(4))) errs.push(m.id + ': unknown ref ' + at);
      if (s.dest && !city.places[s.dest]) errs.push(m.id + ': unknown dest ' + s.dest);
      if (s.model && !VEHICLES[s.model]) errs.push(m.id + ': unknown model ' + s.model);
      if (s.type && !G.PEDS[s.type]) errs.push(m.id + ': unknown ped ' + s.type);
      if (s.kind && !PICKUPS[s.kind]) errs.push(m.id + ': unknown pickup ' + s.kind);
      if (s.driver && !G.PEDS[s.driver]) errs.push(m.id + ': unknown driver ' + s.driver);
      for (const t of s.pass || []) if (!G.PEDS[t]) errs.push(m.id + ': unknown pass ' + t);
      if (s.do === 'deliver' && !(city.garages[s.at] && city.garages[s.at].kind === 'deliver')) errs.push(m.id + ': deliver needs deliver garage ' + s.at);
      for (const r of [s.ref].concat(s.refs || [], s.rivals || [])) if (r && s.do !== 'spawnCar' && s.do !== 'spawnPed' && s.do !== 'pickup' && !refs.has(r)) errs.push(m.id + ': ref before spawn ' + r);
      if (s.need && s.need.startsWith('ref:') && !refs.has(s.need.slice(4))) errs.push(m.id + ': need ref ' + s.need);
      for (const c of s.cps || []) if (!city.places[c]) errs.push(m.id + ': cp ' + c);
      if (s.ref && (s.do === 'spawnCar' || s.do === 'spawnPed' || s.do === 'pickup')) refs.add(s.ref);
    }
    return errs;
  }

  Object.assign(G, { Mission, validateMission, STEP_TYPES });
  if (typeof module !== 'undefined' && module.exports) module.exports = G;
})(globalThis.Gta90 = globalThis.Gta90 || {});
