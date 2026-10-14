(function (N) {
  'use strict';

  const clone = o => JSON.parse(JSON.stringify(o || {}));
  const place = (w, id) => (typeof id === 'string' ? w.city.places[id] : Array.isArray(id) ? { x: id[0], z: id[1], yaw: id[2] || 0 } : id);
  const turned = (p0, yaw) => (yaw !== undefined ? yaw + (p0.rot || 0) : p0.yaw);
  const nearPlace = (w, id, dx, dz) => { const p0 = place(w, id); const q = N.placeAt(p0, dx, dz); return { x: q[0], z: q[1] }; };

  const roadNode = (city, x, z) => city.nearestNode(x, z, n => n.deg > 1 && n.ends.some(q => !city.edges[q.e].plant && !city.edges[q.e].stub));

  function routeVia(city, pts, allowPlant) {
    const nodes = pts.map(p => roadNode(city, p[0], p[1]).id);
    let all = [nodes[0]];
    for (let i = 1; i < nodes.length; i++) {
      const r = city.route(nodes[i - 1], nodes[i], false) || (allowPlant ? city.route(nodes[i - 1], nodes[i], true) : null);
      if (r) all = all.concat(r.slice(1));
    }
    return N.AI.waypoints(city, all);
  }
  N.routeVia = routeVia;

  function routeTo(city, from, to) {
    const path = routeVia(city, [from, to], true);
    const a = roadNode(city, to[0], to[1]);
    const b = city.nearestNode(to[0], to[1], n => n.deg > 0);
    if (a && b && a.id !== b.id) {
      const r = city.route(a.id, b.id, true, true);
      if (r) for (const q of N.AI.waypoints(city, r)) path.push(q);
    }
    path.push({ x: to[0], z: to[1] });
    return path;
  }
  N.routeTo = routeTo;

  function column(path, i, gap) {
    const a = path[0], b = path[Math.min(1, path.length - 1)];
    const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz) || 1;
    return [a.x - dx / L * gap * i, a.z - dz / L * gap * i, N.yawOf(dx, dz)];
  }

  const P = (id, f, r, a) => ({ id, f: f || 0, r: r || 0, a: a || 0 });

  const MS = {
    P,
    at(c, ref) {
      const w = c.w;
      if (!ref) return { x: w.player.x, z: w.player.z, yaw: w.player.yaw };
      if (Array.isArray(ref)) return { x: ref[0], z: ref[1], yaw: ref[2] || 0 };
      if (typeof ref === 'string') ref = P(ref);
      if (ref.x !== undefined && ref.id === undefined) return { x: ref.x, z: ref.z, yaw: ref.yaw || 0, y: ref.y };
      let b;
      if (ref.id[0] === '@') { const e = c.ents[ref.id.slice(1)] || (ref.id === '@tyoma' ? w.player : null); b = e ? { x: e.x, z: e.z, yaw: e.yaw || 0, y: e.y } : { x: w.player.x, z: w.player.z, yaw: 0 }; }
      else b = w.city.places[ref.id];
      const s = Math.sin(b.yaw || 0), co = Math.cos(b.yaw || 0);
      return { x: b.x + ref.f * s + ref.r * co, z: b.z - ref.f * co + ref.r * s, yaw: (b.yaw || 0) + ref.a, y: ref.f || ref.r ? undefined : b.y };
    },
    xz(c, ref) { const q = MS.at(c, ref); return [q.x, q.z]; },
    npc(c, tag, who, ref, o = {}) {
      const w = c.w, q = MS.at(c, ref);
      const ch = N.CHARS[who];
      const kind = o.kind || (ch ? (ch.kind || 'business') : who);
      const look = o.look || (ch && ch.look ? Object.assign({}, ch.look) : N.makeLook(kind, w.rng, o.dress));
      const p = w.spawnPed(kind, q.x, q.z, o.yaw !== undefined ? o.yaw : q.yaw, { look, weapon: o.weapon || 'fists', hp: o.hp, persistent: true, friendly: !!o.friendly });
      if (o.y !== undefined) { p.y = o.y; p.deck = o.y; }
      else if (q.y !== undefined) p.y = q.y;
      p.who = ch ? who : (o.who || null);
      p.cop = false;
      p.gang = !!o.gang;
      if (o.armor) p.armor = o.armor;
      if (o.hidden) p.hidden = true;
      p.ai = Object.assign({ mode: 'idle', mission: true, invuln: !!o.invuln }, o.ai || {});
      if (o.face) { const f = MS.at(c, o.face); p.ai.face = { x: f.x, z: f.z }; p.yaw = N.yawOf(f.x - p.x, f.z - p.z); }
      if (o.gest) p.anim.gest = { k: o.gest, t: 1, d: 0 };
      return c.tag(tag, p);
    },
    veh(c, tag, model, ref, o = {}) {
      const w = c.w, q = MS.at(c, ref);
      const v = w.spawnVehicle(model, q.x, q.z, o.yaw !== undefined ? o.yaw : q.yaw, Object.assign({ persistent: true }, o));
      if (o.color) v.color = o.color;
      if (o.hp) v.hp = v.maxHp = o.hp;
      if (o.lights) v.lights = true;
      if (o.heavy) v.heavy = o.heavy;
      return c.tag(tag, v);
    },
    crew(c, prefix, refs, o = {}) {
      const out = [];
      refs.forEach((ref, i) => {
        const q = MS.at(c, ref);
        const sp = o.exact ? [q.x, q.z] : c.w.city.freeSpot(q.x, q.z, 5);
        const weapon = o.weapons ? o.weapons[i % o.weapons.length] : 'pm';
        const p = MS.npc(c, prefix + (i + 1), o.kind || 'bandit', [sp[0], sp[1], q.yaw], { kind: o.kind || 'bandit', weapon, hp: o.hp, gang: true, look: o.mask ? Object.assign(N.makeLook(o.kind || 'bandit', c.w.rng), { hat: 'mask' }) : undefined, armor: o.armor });
        p.fireT = 0.6 + c.w.rng() * 0.8;
        p.ai = { mode: 'guard', mission: true, x: sp[0], z: sp[1], aggro: o.aggro || 24, group: prefix, acc: o.acc, face: o.face ? (() => { const f = MS.at(c, o.face); return { x: f.x, z: f.z }; })() : null };
        if (o.y !== undefined) { p.y = o.y; p.deck = o.y; }
        out.push(p);
      });
      return out;
    },
    tp(c, ref, o = {}) {
      const g = c.g, w = c.w, q = MS.at(c, ref);
      if (o.car) {
        const v = c.ents[o.car];
        if (w.player.veh && w.player.veh !== v) w.exitVehicle(w.player);
        if (v) { if (w.player.veh !== v) { w.resetPed(w.player); w.seat(w.player, v, true); } w.player.x = v.x; w.player.z = v.z; }
        g.cool.add('mission');
        w.emit({ t: 'teleport' });
        return;
      }
      g.putPlayer(q.x, q.z, o.yaw !== undefined ? o.yaw : q.yaw, q.y);
    },
    seat(c, who, car, driver) {
      const w = c.w, p = who === 'tyoma' ? w.player : c.ents[who], v = c.ents[car];
      if (!p || !v) return;
      if (p.veh === v) return;
      if (p.veh) w.unseat(p);
      w.seat(p, v, driver !== false);
      if (p.anim) p.anim.board = null;
    },
    rm(c, ...tags) {
      for (const t of tags) {
        const e = c.ents[t];
        if (!e) continue;
        if (!e.kind) { const i = c.w.pickups.indexOf(e); if (i >= 0) c.w.pickups.splice(i, 1); const j = c.pickups.indexOf(e); if (j >= 0) c.pickups.splice(j, 1); }
        else if (!e.removed) {
          if (e.kind === 'veh') { if (c.w.player.veh === e) c.w.exitVehicle(c.w.player); c.w.removeVehicle(e); }
          else if (!e.isPlayer) c.w.removePed(e);
        }
        delete c.ents[t];
      }
    },
    give(c, id, ammo, equip) {
      c.g.giveWeapon(id, ammo);
      c.g.unlock(id);
      if (equip) c.w.player.weapon = id;
    },
    dist(c, tag, ref) {
      const e = tag === 'tyoma' ? c.w.player : c.ents[tag];
      if (!e) return Infinity;
      const q = ref ? MS.at(c, ref) : c.w.player;
      const ex = e.veh ? e.veh.x : e.x, ez = e.veh ? e.veh.z : e.z;
      return Math.hypot(ex - q.x, ez - q.z);
    },
    with(c, tag) { const e = c.ents[tag], pl = c.w.player; return !!(e && !e.dead && pl.veh && e.veh === pl.veh); },
    route(c, from, to) { const a = MS.at(c, from), b = MS.at(c, to); return routeTo(c.w.city, [a.x, a.z], [b.x, b.z]); },
    path(c, refs) { return refs.map(r => { const q = MS.at(c, r); return { x: q.x, z: q.z }; }); },
    alive(c, tag) { const e = c.ents[tag]; return !!(e && !e.dead && !e.removed); },
    count(c, tags) { return tags.filter(t => MS.alive(c, t)).length; },
    tags(prefix, n) { return Array.from({ length: n }, (_, i) => prefix + (i + 1)); },
    hostile(c, tags, o = {}) {
      for (const t of tags) {
        const e = c.ents[t];
        if (!e || e.dead) continue;
        e.ai = Object.assign({ mode: 'attack', target: c.w.player, mission: true, t: 0 }, o);
      }
    }
  };
  N.MS = MS;

  class MissionRun {
    constructor(game, def, o = {}) {
      this.g = game;
      this.w = game.world;
      this.def = def;
      this.ents = {};
      this.vars = {};
      this.i = -1;
      this.t = 0;
      this.timer = null;
      this.done = false;
      this.failed = null;
      this.text = '';
      this.pickups = [];
      this.cp = null;
      this.conv = null;
      this.bar = null;
      this.stepVars = {};
      this.startSnap = o.startSnap || game.snapPlayer();
      if (o.cp) {
        this.vars = clone(o.cp.vars);
        this.cp = o.cp;
        this.i = o.cp.i;
        const s = def.steps[this.i];
        if (s.place) s.place(this);
        if (s.setup) s.setup(this);
        if (s.kit) this.kit(s.kit);
      }
      this.next();
    }

    tag(name, e) {
      this.ents[name] = e;
      e.mtag = name;
      e.persistent = true;
      if (e.kind === 'ped') { e.ai = e.ai || { mode: 'idle' }; e.ai.mission = true; }
      return e;
    }

    get(name) { return name === 'tyoma' ? this.w.player : this.ents[name]; }

    pickup(tag, type, x, z, o) {
      const k = this.w.addPickup(type, x, z, Object.assign({ mission: true }, o || {}));
      this.ents[tag] = k;
      this.pickups.push(k);
      return k;
    }

    kit(spec) {
      const pl = this.w.player;
      for (const [id, n] of Object.entries(spec.weapons || {})) {
        const W = N.WEAPONS[id];
        const have = pl.weapons[id] ? pl.weapons[id].ammo + (pl.weapons[id].clip || 0) : 0;
        if (!pl.weapons[id] || have < n) this.w.giveWeapon(pl, id, Math.max(1, n - have));
        if (W && !W.melee && spec.equip === id) pl.weapon = id;
      }
      if (spec.equip && pl.weapons[spec.equip]) pl.weapon = spec.equip;
      if (spec.armor) pl.armor = Math.max(pl.armor, spec.armor);
    }

    get cur() { return this.def.steps[this.i]; }

    jump(id) {
      const k = this.def.steps.findIndex(s => s.id === id);
      if (k < 0) return;
      this.i = k - 1;
      this.next();
    }

    say(lines) {
      const out = [];
      for (const l of lines) out.push(this.g.say(l[0], l[1], N.cutOpts(l[2])));
      return out;
    }

    next() {
      for (;;) {
        this.i++;
        if (this.i >= this.def.steps.length) { this.complete(); return; }
        const s = this.cur;
        this.t = 0;
        this.stepVars = {};
        this.bar = null;
        if (s.timer) this.timer = typeof s.timer === 'function' ? s.timer(this) : s.timer;
        else if (!s.keepTimer) this.timer = null;
        if (s.text) { this.text = typeof s.text === 'function' ? s.text(this) : s.text; this.g.objective(this.text); }
        if (s.help) this.g.help(N.HELP[s.help] || s.help);
        if (s.type === 'call') { s.fn(this); if (this.failed || this.done || this.cur !== s) return; continue; }
        if (s.type === 'cp') {
          if (s.setup) s.setup(this);
          this.cp = { i: this.i, id: s.id, name: s.name || s.id, vars: clone(this.vars), snap: this.g.snapPlayer() };
          continue;
        }
        if (s.type === 'talk') {
          this.conv = { lines: typeof s.lines === 'function' ? s.lines(this) : s.lines, i: 0, cur: null, need: s.need || null, wait: s.delay || 0.6, gap: s.gap || 0.5, away: s.away || null, warned: false };
          continue;
        }
        if (s.type === 'say') {
          const lines = typeof s.lines === 'function' ? s.lines(this) : s.lines;
          this.stepVars.subs = this.say(lines);
          if (!s.wait) continue;
        }
        if (s.type === 'cut') { this.conv = null; this.g.playCut(s, this); }
        if (s.type === 'wanted') { this.w.setWanted(Math.max(this.w.wanted.level, s.level)); continue; }
        if (s.enter) s.enter(this);
        if (this.failed || this.done || this.cur !== s) return;
        return;
      }
    }

    fail(text) {
      if (this.failed || this.done) return;
      this.failed = text || 'Задание провалено';
      this.conv = null;
      this.g.missionFailed(this);
    }

    complete() {
      this.done = true;
      this.conv = null;
      this.cleanup(true);
      this.g.missionPassed(this);
    }

    cleanup(ok) {
      for (const [k, e] of Object.entries(this.ents)) {
        if (!e || e.removed || !e.kind) continue;
        if (e.kind === 'ped') {
          if (e.keep) continue;
          e.persistent = false;
          e.hidden = false;
          if (e.ai) { e.ai.mission = false; e.ai.invuln = false; }
          if (!e.dead && !e.veh) e.ai = e.gang && !ok ? { mode: 'attack', target: this.w.player, rage: 30 } : { mode: 'walk', edge: -1, leaving: true };
          if (e.friendly && !e.veh && this.def.dismiss !== false) e.ai = { mode: 'walk', edge: -1, leaving: true };
        } else if (e.kind === 'veh') {
          if (e.keep) continue;
          e.persistent = false;
          if (e.ai && e.ai.mode !== 'lane') e.ai = e.driver ? { mode: 'rejoin', ambient: true } : null;
        }
      }
      for (const k of this.pickups) { const i = this.w.pickups.indexOf(k); if (i >= 0) this.w.pickups.splice(i, 1); }
      this.resetWorld();
    }

    dispose() {
      const w = this.w;
      for (const e of Object.values(this.ents)) {
        if (!e || e.removed || !e.kind) continue;
        if (e.kind === 'ped') { if (!e.isPlayer) w.removePed(e); }
        else if (e.kind === 'veh') { if (w.player.veh === e) w.exitVehicle(w.player); w.removeVehicle(e); }
      }
      for (const k of this.pickups) { const i = w.pickups.indexOf(k); if (i >= 0) w.pickups.splice(i, 1); }
      this.ents = {};
      this.resetWorld();
    }

    resetWorld() {
      const w = this.w;
      w.wanted.cap = 6;
      if (w.missionHold) w.missionHold.clear();
      w.truce = false;
      w.player.puppet = null;
      w.player.anim.gest = null;
    }

    alive(tag) { const e = this.ents[tag]; return e && !e.dead && !e.removed; }

    checkFail(f, dt) {
      const w = this.w;
      if (f.dead) { const e = this.ents[f.dead]; if (e && (e.dead || e.removed)) return f.text; }
      if (f.destroyed) { const e = this.ents[f.destroyed]; if (e && (e.dead || e.removed || e.sink > 1)) return f.text; }
      if (f.far) {
        const e = this.ents[f.far];
        if (e && !e.dead && !e.removed) {
          const ex = e.veh ? e.veh.x : e.x, ez = e.veh ? e.veh.z : e.z;
          const d = Math.hypot(ex - w.player.x, ez - w.player.z);
          const k = 'far_' + f.far;
          this.stepVars[k] = d > f.dist ? (this.stepVars[k] || 0) + dt : 0;
          if (this.stepVars[k] > (f.time || 6)) return f.text;
        }
      }
      if (f.fn) return f.fn(this, dt);
      return null;
    }

    targetOf(s) {
      if (!s.at) return null;
      if (typeof s.at === 'function') return s.at(this);
      if (typeof s.at === 'string' && this.ents[s.at]) { const e = this.ents[s.at]; return { x: e.x, z: e.z, y: e.y }; }
      if (typeof s.at === 'object' && !Array.isArray(s.at) && s.at.id) return MS.at(this, s.at);
      return place(this.w, s.at);
    }

    stepConv(dt) {
      const cv = this.conv;
      if (!cv) return;
      if (cv.cur && !cv.cur.done) return;
      cv.cur = null;
      if (cv.i >= cv.lines.length) { this.conv = null; return; }
      const ok = !cv.need || cv.need(this);
      if (!ok) {
        if (cv.away && !cv.warned && !this.g.subs.length) { cv.warned = true; this.g.say(cv.away[0], cv.away[1], N.cutOpts(cv.away[2])); }
        return;
      }
      cv.warned = false;
      if (this.g.subs.length || this.g.cut) return;
      cv.wait -= dt;
      if (cv.wait > 0) return;
      const l = cv.lines[cv.i++];
      cv.cur = this.g.say(l[0], l[1], N.cutOpts(l[2]));
      cv.wait = cv.gap;
    }

    step(dt, input) {
      if (this.done || this.failed) return;
      const s = this.cur;
      if (!s) return;
      this.t += dt;
      for (const f of (this.def.fails || []).concat(s.fails || [])) {
        const msg = this.checkFail(f, dt);
        if (msg) { this.fail(msg); return; }
      }
      if (this.timer !== null && s.type !== 'cut') {
        this.timer -= dt;
        if (this.timer <= 0) { this.fail(s.timeText || 'Время вышло!'); return; }
      }
      if (!this.g.cut) this.stepConv(dt);
      if (s.tick) s.tick(this, dt);
      if (this.failed || this.done || this.cur !== s) return;
      this.bar = s.bar ? s.bar(this) : null;
      if (this.stepDone(s, dt)) this.next();
    }

    stepDone(s, dt) {
      const w = this.w, pl = w.player;
      switch (s.type) {
        case 'cut': return !this.g.cut;
        case 'say': return (this.stepVars.subs || []).every(q => !q || q.done);
        case 'wait': return this.t >= s.t;
        case 'goto': {
          const tg = this.targetOf(s);
          if (!tg) return true;
          const d = Math.hypot(pl.x - tg.x, pl.z - tg.z);
          if (d > (s.r || 3)) return false;
          if (s.y !== undefined && Math.abs(pl.y - s.y) > 3) return false;
          if (s.veh === 'none' && pl.veh) return false;
          if (s.veh === 'any' && !pl.veh) return false;
          if (s.veh && s.veh !== 'none' && s.veh !== 'any' && pl.veh !== this.ents[s.veh]) return false;
          if (s.with) { const q = this.ents[s.with]; if (!q || q.veh !== pl.veh || !pl.veh) { if (!this.stepVars.waitMsg) { this.stepVars.waitMsg = 1; this.g.objective(s.withText || 'Подожди пассажира.'); } return false; } }
          if (s.stop && pl.veh && Math.abs(pl.veh.spd) > 3) return false;
          return true;
        }
        case 'enter': return pl.veh && pl.veh === this.ents[s.tag];
        case 'kill': return (typeof s.tags === 'function' ? s.tags(this) : s.tags).every(t => { const e = this.ents[t]; return !e || e.dead || e.removed; });
        case 'destroy': return s.tags.every(t => { const e = this.ents[t]; return !e || e.dead || e.removed; });
        case 'collect': { const k = this.ents[s.tag]; return !k || !this.w.pickups.includes(k) || k.taken; }
        case 'lose': return w.wanted.level === 0 && (!s.inVeh || pl.veh === this.ents[s.inVeh]);
        case 'fn': return s.fn(this, dt);
        case 'tail': return this.stepTail(s, dt);
        case 'choice': {
          for (const o of s.options) {
            const tg = place(w, o.at);
            if (Math.hypot(pl.x - tg.x, pl.z - tg.z) < (o.r || 3) && !pl.veh) { this.vars[s.var] = o.value; this.g.flag(s.var, o.value); return true; }
          }
          return false;
        }
      }
      return true;
    }

    stepTail(s, dt) {
      const v = this.ents[s.tag], pl = this.w.player, sv = this.stepVars;
      if (!v || v.dead || v.removed) return true;
      const px = pl.veh ? pl.veh.x : pl.x, pz = pl.veh ? pl.veh.z : pl.z;
      const d = Math.hypot(v.x - px, v.z - pz);
      sv.sus = N.clamp((sv.sus || 0) + (d < (s.near || 14) ? dt / (s.spot || 4) : -dt * 0.12), 0, 1);
      sv.lost = d > (s.far || 160) ? (sv.lost || 0) + dt : 0;
      sv.d = d;
      if (sv.lost > (s.lose || 10)) { this.fail(s.lostText || 'Ты потерял машину из виду.'); return false; }
      if (sv.sus >= 1) { if (s.spotted) s.spotted(this); else this.fail(s.spotText || 'Тебя заметили.'); return false; }
      if (!this.bar) this.bar = { label: 'ПОДОЗРЕНИЕ', k: sv.sus, col: sv.sus > 0.6 ? '#ff5a3c' : '#f0c040' };
      return s.done ? s.done(this, dt) : !!(v.ai && v.ai.arrived);
    }

    blips() {
      const s = this.cur;
      const out = [];
      if (!s || this.done || this.failed) return out;
      const w = this.w;
      if (s.type === 'goto') { const tg = this.targetOf(s); if (tg) out.push({ x: tg.x, z: tg.z, y: tg.y, type: 'dest', r: s.r || 3 }); }
      if (s.type === 'choice') for (const o of s.options) { const tg = place(w, o.at); out.push({ x: tg.x, z: tg.z, type: 'dest', r: o.r || 3, label: o.label }); }
      if (s.type === 'enter') { const v = this.ents[s.tag]; if (v && !v.dead) out.push({ x: v.x, z: v.z, type: 'veh', ent: v }); }
      if (s.type === 'tail') { const v = this.ents[s.tag]; if (v && !v.dead) out.push({ x: v.x, z: v.z, type: 'enemy', ent: v }); }
      if (s.type === 'kill' || s.type === 'destroy') {
        const tags = typeof s.tags === 'function' ? s.tags(this) : s.tags;
        for (const t of tags) { const e = this.ents[t]; if (e && !e.dead && !e.removed) out.push({ x: e.veh ? e.veh.x : e.x, z: e.veh ? e.veh.z : e.z, type: 'enemy', ent: e }); }
      }
      if (s.type === 'collect') { const k = this.ents[s.tag]; if (k && !k.taken) out.push({ x: k.x, z: k.z, type: 'pickup' }); }
      if (s.blips) for (const b of s.blips(this)) out.push(b);
      for (const [k, e] of Object.entries(this.ents)) if (e && e.kind === 'ped' && e.friendly && !e.dead && !e.removed && !e.hidden && !out.some(o => o.ent === e)) out.push({ x: e.x, z: e.z, type: 'friend', ent: e });
      return out;
    }
  }
  N.MissionRun = MissionRun;

  N.MISSIONS = [];
  N.MISSION_BY = {};
  N.addMission = def => { N.MISSIONS.push(def); N.MISSION_BY[def.id] = def; return def; };
  N.MISSION_KIT = { place, turned, nearPlace, column, roadNode };

  class TaxiJob {
    constructor(game) {
      this.g = game;
      this.w = game.world;
      this.kind = 'taxi';
      this.streak = 0;
      this.earned = 0;
      this.state = 'find';
      this.fare = null;
      this.dest = null;
      this.timer = 0;
      this.outT = 0;
      this.newFare();
      this.g.big('ТАКСИ', 'Найди пассажира', 2.5);
    }
    newFare() {
      const w = this.w, pl = w.player;
      const side = [];
      w.city.walkHash.query(pl.x - 260, pl.z - 260, pl.x + 260, pl.z + 260, it => { if (it.n.k === 's') side.push(it.n); });
      for (let k = 0; k < 80 && side.length; k++) {
        const n = side[Math.floor(w.rng() * side.length)];
        const d = Math.hypot(n.x - pl.x, n.z - pl.z);
        if (d < 70 || d > 260) continue;
        const p = w.spawnPed(w.rng.pick(['business', 'woman', 'student', 'pensioner', 'girl', 'worker']), n.x, n.z, 0, { persistent: true });
        p.ai = { mode: 'idle', mission: true, face: { x: pl.x, z: pl.z } };
        p.fare = true;
        this.fare = p;
        this.state = 'find';
        this.timer = 40 + d / 8;
        return;
      }
    }
    pickDest() {
      const w = this.w, pl = w.player;
      const W = w.city.walk;
      const names = Object.values(w.city.places).filter(p => p.metro || ['hotel_door', 'market', 'dk', 'cinema', 'stadium_gate', 'kesha_door', 'club_door', 'hosp_n', 'hosp_s', 'gunshop', 'ferris', 'zarya', 'port_gate', 'gaz_gate'].includes(p.id));
      for (let k = 0; k < 60; k++) {
        const p = w.rng() < 0.5 ? w.rng.pick(names) : W.nodes[Math.floor(w.rng() * W.nodes.length)];
        if (p.k && p.k !== 's') continue;
        const d = Math.hypot(p.x - pl.x, p.z - pl.z);
        if (d < 250 || d > 1400) continue;
        this.dest = { x: p.x, z: p.z, name: p.metro ? 'метро «' + p.metro + '»' : w.city.zoneAt(p.x, p.z) };
        this.state = 'drive';
        this.timer = 25 + d / 8.5;
        this.distance = d;
        return;
      }
    }
    step(dt) {
      const w = this.w, pl = w.player, v = pl.veh;
      if (!v || !v.livery || v.livery !== 'taxi') {
        this.outT += dt;
        if (this.outT > 8 || !v && this.outT > 0.1 && this.state === 'drive') { this.end('Ты вышел из такси.'); return; }
      } else this.outT = 0;
      if (v && v.dead) { this.end('Такси разбито.'); return; }
      this.timer -= dt;
      if (this.state === 'find') {
        const f = this.fare;
        if (!f || f.dead || f.removed) { this.newFare(); return; }
        if (this.timer <= 0) { this.end('Пассажир уехал на маршрутке.'); return; }
        if (v && Math.hypot(f.x - v.x, f.z - v.z) < 9 && Math.abs(v.spd) < 2.5) {
          f.ai = { mode: 'follow', target: pl, mission: true };
          this.state = 'board';
        }
      } else if (this.state === 'board') {
        const f = this.fare;
        if (!f || f.dead) { this.newFare(); return; }
        if (f.veh === v) { this.pickDest(); this.g.objective('Отвези пассажира: ' + this.dest.name + '.'); }
        if (v && Math.abs(v.spd) > 4) { f.ai = { mode: 'idle', mission: true }; this.state = 'find'; }
      } else if (this.state === 'drive') {
        if (this.timer <= 0) { this.end('Пассажир вышел, не заплатив ни копейки.'); return; }
        if (Math.hypot(this.dest.x - pl.x, this.dest.z - pl.z) < 10 && v && Math.abs(v.spd) < 3) {
          const f = this.fare;
          const pay = Math.round(40 + this.distance * 0.09 + Math.max(0, this.timer) * 2);
          this.streak++;
          this.earned += pay;
          this.g.addMoney(pay);
          this.g.state.taxi.fares++;
          let bonus = 0;
          if (this.streak % 5 === 0) { bonus = this.streak * 60; this.g.addMoney(bonus); }
          this.g.big('+' + N.money(pay), bonus ? 'Серия ' + this.streak + '! Премия ' + N.money(bonus) : 'Заказов подряд: ' + this.streak, 2.5, 'money');
          if (f) { w.exitVehicle(f); f.persistent = false; f.ai = { mode: 'walk', edge: -1, leaving: true }; }
          this.fare = null;
          if (this.g.state.taxi.fares >= 10 && !this.g.flags.taxiBoost) { this.g.flag('taxiBoost', true); this.g.addMoney(5000); this.g.pager(N.PAGER.taxi); }
          this.newFare();
        }
      }
    }
    blips() {
      if (this.state === 'find' && this.fare) return [{ x: this.fare.x, z: this.fare.z, type: 'friend', ent: this.fare }];
      if (this.state === 'drive' && this.dest) return [{ x: this.dest.x, z: this.dest.z, type: 'dest', r: 10 }];
      return [];
    }
    end(text) {
      if (this.fare && !this.fare.removed) {
        const f = this.fare;
        if (f.veh) this.w.exitVehicle(f);
        f.persistent = false;
        f.ai = { mode: 'walk', edge: -1, leaving: true };
      }
      this.g.sideEnded(this, text || 'Смена окончена', 'Заработано: ' + N.money(this.earned));
    }
    get label() { return this.state === 'drive' ? 'ТАКСИ' : 'ТАКСИ'; }
  }

  class PoliceJob {
    constructor(game) {
      this.g = game;
      this.w = game.world;
      this.kind = 'police';
      this.level = Math.max(1, game.state.police.level + 1);
      this.earned = 0;
      this.outT = 0;
      this.targets = [];
      this.spawnLevel();
    }
    spawnLevel() {
      const w = this.w, pl = w.player;
      this.targets = [];
      const n = this.level >= 6 ? 2 : 1;
      for (let i = 0; i < n; i++) {
        let lane = null;
        for (let k = 0; k < 100; k++) {
          const l = w.city.lanes[Math.floor(w.rng() * w.city.lanes.length)];
          if (!l.ambient) continue;
          const d = Math.hypot(l.x0 - pl.x, l.z0 - pl.z);
          if (d > 140 && d < 380) { lane = l; break; }
        }
        if (!lane) continue;
        const model = w.rng.pick(this.level > 4 ? ['bmw525', 'audi80', 'lc80', 'vaz2110', 'merc600'] : ['vaz2106', 'vaz2109', 'm2141', 'vaz21099', 'audi80']);
        const v = w.spawnVehicle(model, lane.x0, lane.z0, N.yawOf(lane.dx, lane.dz), { persistent: true });
        const crew = this.level >= 3 ? 2 : 1;
        for (let k = 0; k < crew; k++) {
          const p = w.spawnPed('bandit', v.x, v.z, v.yaw, { persistent: true, weapon: this.level >= 4 ? 'ak' : 'pm' });
          p.gang = true;
          p.ai = { mode: 'idle', mission: true, shootFromCar: this.level >= 2 };
          w.seat(p, v, k === 0);
        }
        v.ai = { mode: 'flee', speed: 20 + Math.min(10, this.level) };
        this.targets.push(v);
      }
      this.timer = 120 + this.level * 8;
      this.g.big('Уровень ' + this.level, 'Задержи преступников!', 2.5);
    }
    step(dt) {
      const w = this.w, pl = w.player, v = pl.veh;
      const copCar = v && (v.livery === 'militia' || v.copCar);
      if (!copCar) { this.outT += dt; if (this.outT > 30) { this.end('Ты бросил служебную машину.'); return; } } else this.outT = 0;
      this.timer -= dt;
      if (this.timer <= 0) { this.end('Преступники скрылись.'); return; }
      let done = true;
      for (const t of this.targets) {
        const crew = w.peds.filter(p => p.persistent && p.gang && (p.veh === t || p.fromCar === t.id));
        const alive = !t.dead && t.driver && !t.driver.dead;
        if (t.driver && t.driver.dead) for (const q of t.pass.slice()) { w.exitVehicle(q); q.fromCar = t.id; q.ai = { mode: 'attack', target: pl, mission: true }; }
        if (t.dead && !t.bailed) { t.bailed = true; }
        const onFoot = w.peds.filter(p => p.fromCar === t.id && !p.dead);
        if (alive || onFoot.length) done = false;
        if (!alive && t.driver && !t.driver.dead && !t.driver.fromCar) { const d = t.driver; w.exitVehicle(d); d.fromCar = t.id; d.ai = { mode: 'attack', target: pl, mission: true }; }
      }
      if (done) {
        const pay = this.level * this.level * 50 + 500;
        this.g.addMoney(pay);
        this.earned += pay;
        this.g.state.police.level = Math.max(this.g.state.police.level, this.level);
        this.g.big('ПРЕСТУПНИКИ ОБЕЗВРЕЖЕНЫ', '+' + N.money(pay), 3, 'money');
        for (const t of this.targets) t.persistent = false;
        for (const p of w.peds) if (p.fromCar !== undefined) { p.persistent = false; }
        if (this.level >= 12 && !this.g.flags.policeDone) { this.g.flag('policeDone', true); this.g.addMoney(10000); w.player.maxArmor = 150; this.g.pager(N.PAGER.police); this.end('Все уровни пройдены!'); return; }
        this.level++;
        this.spawnLevel();
      }
    }
    blips() {
      const out = [];
      for (const t of this.targets) if (!t.dead && t.driver && !t.driver.dead) out.push({ x: t.x, z: t.z, type: 'enemy', ent: t });
      for (const p of this.w.peds) if (p.fromCar !== undefined && !p.dead && p.persistent) out.push({ x: p.x, z: p.z, type: 'enemy', ent: p });
      return out;
    }
    end(text) {
      for (const t of this.targets) { t.persistent = false; if (t.ai) t.ai = t.driver ? { mode: 'flee', speed: 18 } : null; }
      for (const p of this.w.peds) if (p.fromCar !== undefined || (p.persistent && p.gang && p.veh && this.targets.includes(p.veh))) { p.persistent = false; }
      this.g.sideEnded(this, text || 'Смена окончена', 'Заработано: ' + N.money(this.earned));
    }
  }

  N.TaxiJob = TaxiJob;
  N.PoliceJob = PoliceJob;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
