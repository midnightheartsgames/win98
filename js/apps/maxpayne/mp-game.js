(function (M) {
  'use strict';
  const GRAV = 13.5;
  const RUN = 5.1, WALK = 2.3, CROUCH = 2.0;
  const PLAYER_R = 0.3, PLAYER_H = 1.8, CROUCH_H = 1.15, DODGE_H = 0.8;
  const BT_DRAIN = 0.095;
  const DAMAGE_PART = { head: 3, body: 1, legs: 0.72 };
  const COVER = { reach: 1.45, low: 0.88, tall: 1.3, slide: 1.7, enter: 0.3, popIn: 0.13, popOut: 0.2, hold: 0.55, peek: 0.38, away: 0.22, probe: [0.45, 0.86, 1.3, 1.62] };
  const HARD_LAND = 8.6, LAND_LAG = 0.45;
  M.COVER = COVER;

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function bodySpheres(e) {
    const p = e.pos;
    if (e.posture === 'lie' || e.posture === 'dive') {
      const f = M.fwdOf(e.lieYaw !== undefined ? e.lieYaw : e.yaw);
      const y = p[1] + (e.posture === 'dive' ? 0.55 : 0.22);
      const at = (k, dy) => [p[0] + f[0] * k, y + (dy || 0), p[2] + f[2] * k];
      return [
        { c: at(0.78, 0.05), r: 0.14, part: 'head' },
        { c: at(0.4), r: 0.22, part: 'body' },
        { c: at(0.02), r: 0.21, part: 'body' },
        { c: at(-0.38), r: 0.2, part: 'legs' },
        { c: at(-0.8), r: 0.18, part: 'legs' }
      ];
    }
    if (e.posture === 'cover') {
      const at = y => [p[0], p[1] + y, p[2]];
      return [
        { c: at(1.1), r: 0.13, part: 'head' },
        { c: at(0.86), r: 0.21, part: 'body' },
        { c: at(0.64), r: 0.2, part: 'body' },
        { c: at(0.44), r: 0.18, part: 'legs' },
        { c: at(0.26), r: 0.16, part: 'legs' },
        { c: at(0.1), r: 0.13, part: 'legs' }
      ];
    }
    const k = e.posture === 'crouch' ? 0.64 : 1;
    const at = y => [p[0], p[1] + y * k, p[2]];
    return [
      { c: at(1.64), r: 0.135, part: 'head' },
      { c: at(1.34), r: 0.22, part: 'body' },
      { c: at(1.06), r: 0.2, part: 'body' },
      { c: at(0.78), r: 0.19, part: 'legs' },
      { c: at(0.45), r: 0.17, part: 'legs' },
      { c: at(0.15), r: 0.15, part: 'legs' }
    ];
  }
  M.bodySpheres = bodySpheres;

  class Game {
    constructor(o) {
      o = o || {};
      this.levelId = o.level;
      this.def = M.levels[o.level];
      if (!this.def) throw new Error('unknown level ' + o.level);
      this.world = M.buildLevel(this.def);
      this.rng = new M.RNG(o.seed || 7);
      this.diffIndex = o.difficulty === undefined ? 1 : o.difficulty;
      this.diff = M.DIFFICULTY[this.diffIndex] || M.DIFFICULTY[1];
      this.adapt = o.adapt || 1;
      this.time = 0;
      this.real = 0;
      this.events = [];
      this.flags = {};
      this.timers = [];
      this.subs = [];
      this.dialogs = [];
      this.props = [];
      this.propById = {};
      this.chars = [];
      this.charById = {};
      this.items = [];
      this.projectiles = [];
      this.throws = [];
      this.fires = [];
      this.decals = 0;
      this.stats = { kills: 0, heads: 0, shots: 0, hits: 0, painkillers: 0, time: 0, deaths: 0 };
      this.thought = this.def.thought || '';
      this.cine = null;
      this.done = false;
      this.failed = null;
      this.bt = { on: false, meter: 1, dodge: false, manual: false };
      this.nym = this.diff.timer ? { t: 60 } : null;
      this.triggers = (this.def.triggers || []).map(t => ({ id: t.id, min: t.min, max: t.max, once: t.once !== false, fired: false, off: !!t.off }));
      this.dynOf = new Map();
      this.initPlayer(o.carry);
      for (const d of this.world.propDefs) this.addProp(clone(d));
      for (const d of this.def.props || []) this.addProp(clone(d));
      for (const c of this.def.chars || []) this.addChar(clone(c));
      for (const it of this.def.items || []) this.addItem(clone(it));
      const blocks = [];
      for (const p of this.props) if (p.kind === 'glass' || p.kind === 'crate' || p.kind === 'locker' || p.navBlock) { const b = this.dynOf.get(p.id); if (b) blocks.push(...b); }
      this.nav = new M.Nav(this.world, { blocks, bounds: this.def.navBounds });
      if (o.snapshot) this.restore(o.snapshot);
      else this.fireEvent('start');
    }

    initPlayer(carry) {
      const s = this.def.start || { pos: [0, 0, 0], yaw: 0 };
      const lo = this.def.loadout || {};
      const src = carry && !lo.reset ? carry : lo;
      const p = {
        pos: s.pos.slice(), vel: [0, 0, 0], yaw: s.yaw || 0, pitch: 0, r: PLAYER_R, h: PLAYER_H,
        onGround: true, crouch: false, posture: 'stand', hp: src.hp || 100, pk: src.painkillers || 0, heal: 0,
        weapons: {}, clips: {}, ammo: { '9mm': 0, '50ae': 0, '12g': 0, gren: 0, molo: 0 },
        cur: null, last: null, cd: 0, reload: 0, switchT: 0, dodge: null, jumpT: 0, hurtT: 99, dead: false, deadT: 0,
        swing: 0, throwT: 0, throwKind: null, fireT: 99, dualSide: 0, lockMsgT: 0, moveT: 0, stepT: 0, landT: 99, spin: 0,
        cover: null, coverOut: null, coverSpot: null, scanT: 0, airT: 0, land: null
      };
      for (const w of src.weapons || ['beretta']) p.weapons[w] = true;
      Object.assign(p.ammo, src.ammo || {});
      for (const w of Object.keys(p.weapons)) {
        const W = M.WEAPONS[w];
        if (W && W.clip) p.clips[w] = src.clips && src.clips[w] !== undefined ? src.clips[w] : W.clip;
      }
      this.syncDual(p);
      p.cur = src.cur && p.weapons[src.cur] ? src.cur : this.bestWeapon(p);
      p.last = p.cur;
      this.player = p;
      this.bt.meter = src.bt !== undefined ? src.bt : 1;
    }

    carry() {
      const p = this.player;
      return { weapons: Object.keys(p.weapons).filter(k => p.weapons[k]), clips: Object.assign({}, p.clips), ammo: Object.assign({}, p.ammo), painkillers: p.pk, hp: Math.max(60, Math.round(p.hp)), cur: p.cur, bt: this.bt.meter };
    }

    syncDual(p) {
      for (const id of ['beretta2', 'ingram2']) {
        const W = M.WEAPONS[id];
        if (p.weapons[id] && p.clips[id] === undefined) p.clips[id] = Math.min(W.clip, (p.clips[W.dualOf] || 0) * 2);
      }
    }

    bestWeapon(p) {
      const order = ['ingram2', 'beretta2', 'pump', 'ingram', 'deagle', 'beretta', 'sawed', 'bat', 'pipe'];
      for (const w of order) if (p.weapons[w] && this.hasAmmo(p, w)) return w;
      for (const w of order) if (p.weapons[w]) return w;
      return null;
    }

    hasAmmo(p, w) {
      const W = M.WEAPONS[w];
      if (!W) return false;
      if (W.melee) return true;
      if (W.throwable) return p.ammo[W.ammo] > 0;
      return (p.clips[w] || 0) + (p.ammo[W.ammo] || 0) > 0;
    }

    emit(e) { this.events.push(e); }
    fireEvent(name, arg) {
      const sys = M.SYSTEM_EVENTS && M.SYSTEM_EVENTS[name];
      if (sys) return sys(this, arg);
      const h = this.def.on && this.def.on[name];
      if (h) h(this, arg);
    }

    addProp(p) {
      if (!p.id) p.id = p.kind + '_' + this.props.length;
      this.props.push(p);
      this.propById[p.id] = p;
      if (p.kind === 'door') { p.open = p.open || 0; p.target = p.target !== undefined ? p.target : p.open; p.swing = p.swing || 0; }
      if (p.kind === 'cyl') { p.hp = p.hp || 18; }
      if (p.kind === 'crate') { p.hp = p.hp || 30; p.size = p.size || [1, 1, 1]; }
      if (p.kind === 'mover') { p.origin = p.origin || (p.path ? p.path[0].slice() : [0, 0, 0]); p.seg = p.seg || 0; p.along = p.along || 0; p.speed = p.speed || 0; p.moving = !!p.moving; }
      if (p.kind === 'searchlight') p.phase = p.phase || 0;
      if (p.kind === 'tv') p.line = p.line || 0;
      this.syncProp(p);
      return p;
    }

    setDyn(p, boxes) {
      const old = this.dynOf.get(p.id);
      if (old) for (const b of old) { const i = this.world.dyn.indexOf(b); if (i >= 0) this.world.dyn.splice(i, 1); }
      const list = boxes.map(b => Object.assign({ on: true, dynProp: true, prop: p.id }, b));
      for (const b of list) this.world.dyn.push(b);
      this.dynOf.set(p.id, list);
      return list;
    }

    doorLeafBoxes(p) {
      const t = 0.09;
      const x = p.pos[0], y = p.pos[1], z = p.pos[2], hw = p.w / 2, h = p.h;
      if (p.slide) {
        const off = p.open * p.w * (p.slideDir || 1);
        if (p.axis === 'x') return [{ min: [x - hw + off, y, z - t], max: [x + hw + off, y + h, z + t] }];
        return [{ min: [x - t, y, z - hw + off], max: [x + t, y + h, z + hw + off] }];
      }
      if (p.open < 0.04) {
        if (p.axis === 'x') return [{ min: [x - hw, y, z - t], max: [x + hw, y + h, z + t] }];
        return [{ min: [x - t, y, z - hw], max: [x + t, y + h, z + hw] }];
      }
      if (p.open > 0.96) {
        const s = p.swing || 1;
        const leaves = p.double ? [[-1, hw], [1, hw]] : [[p.hinge === 'b' ? 1 : -1, p.w]];
        return leaves.map(([side, L]) => {
          if (p.axis === 'x') {
            const hx = x + side * hw, ez = z + s * L;
            return { min: [hx - t, y, Math.min(z, ez)], max: [hx + t, y + h, Math.max(z, ez)] };
          }
          const hz = z + side * hw, ex = x + s * L;
          return { min: [Math.min(x, ex), y, hz - t], max: [Math.max(x, ex), y + h, hz + t] };
        });
      }
      return [];
    }

    syncProp(p) {
      const B = (x0, y0, z0, x1, y1, z1) => ({ min: [Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1)], max: [Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1)] });
      const x = p.pos ? p.pos[0] : 0, y = p.pos ? p.pos[1] : 0, z = p.pos ? p.pos[2] : 0;
      if (p.hidden) { this.setDyn(p, []); return; }
      switch (p.kind) {
        case 'door': this.setDyn(p, this.doorLeafBoxes(p)); break;
        case 'glass': {
          if (p.broken) { this.setDyn(p, []); break; }
          const hw = p.w / 2;
          const list = this.setDyn(p, [p.axis === 'y' ? B(x - hw, y - 0.02, z - p.d / 2, x + hw, y + 0.02, z + p.d / 2) : p.axis === 'x' ? B(x - hw, y, z - 0.03, x + hw, y + p.h, z + 0.03) : B(x - 0.03, y, z - hw, x + 0.03, y + p.h, z + hw)]);
          for (const b of list) b.glass = true;
          break;
        }
        case 'cyl': this.setDyn(p, p.exploded ? [] : [B(x - 0.17, y, z - 0.17, x + 0.17, y + 1.3, z + 0.17)]); break;
        case 'crate': {
          const s = p.size;
          this.setDyn(p, p.broken ? [] : [B(x - s[0] / 2, y, z - s[2] / 2, x + s[0] / 2, y + s[1], z + s[2] / 2)]);
          break;
        }
        case 'locker': {
          const w = p.w || 0.9, d = p.d || 0.5, h = p.h || 1.9;
          const c = Math.abs(Math.cos(p.yaw || 0)), s = Math.abs(Math.sin(p.yaw || 0));
          const hx = (w * c + d * s) / 2, hz = (w * s + d * c) / 2;
          this.setDyn(p, [B(x - hx, y, z - hz, x + hx, y + h, z + hz)]);
          break;
        }
        case 'mover': {
          const o = p.origin;
          this.setDyn(p, (p.parts || []).map(q => B(o[0] + q[0], o[1] + q[1], o[2] + q[2], o[0] + q[3], o[1] + q[4], o[2] + q[5])));
          break;
        }
        case 'block': this.setDyn(p, p.off ? [] : [B(p.min[0], p.min[1], p.min[2], p.max[0], p.max[1], p.max[2])]); break;
        default: this.setDyn(p, []);
      }
    }

    addChar(c) {
      const T = M.ENEMY[c.type] || M.ENEMY.thug;
      const ch = Object.assign({
        name: T.name, group: null, pos: [0, 0, 0], vel: [0, 0, 0], yaw: 0, pitch: 0, r: 0.3, h: 1.8, hp: T.hp, maxHp: T.hp,
        state: 'alive', weapon: 'beretta', clip: 0, posture: 'stand', onGround: true, gren: 0, molo: 0, mode: 'ambush',
        anim: { move: [0, 0], speed: 0, fireT: 99, flinchT: 99, death: null, crouch: false, throwT: 99, swingT: 99, reloadT: 99 },
        ai: {}, drop: null
      }, c);
      if (c.hp) ch.maxHp = c.hp;
      if (c.hidden) ch.state = 'hidden';
      if (ch.weapon && M.WEAPONS[ch.weapon] && M.WEAPONS[ch.weapon].clip) ch.clip = M.WEAPONS[ch.weapon].clip;
      ch.home = ch.home || ch.pos.slice();
      if (c.pose) ch.posture = c.pose === 'lie' || c.pose === 'dead' ? 'lie' : ch.posture;
      if (c.dead) { ch.state = 'dead'; ch.anim.death = { kind: c.deadPose || 'back', t: 99 }; ch.lieYaw = ch.yaw; }
      this.chars.push(ch);
      this.charById[ch.id] = ch;
      if (M.AI) M.AI.init(this, ch);
      return ch;
    }

    addItem(it) {
      const d = Object.assign({ taken: false, amount: 0 }, it);
      if (!d.id) d.id = 'item_' + this.items.length;
      if (d.in) d.hidden = true;
      this.items.push(d);
      return d;
    }

    char(id) { return this.charById[id]; }
    prop(id) { return this.propById[id]; }

    step(inp) {
      inp = inp || {};
      if (this.done) return;
      const realDt = M.TICK;
      this.real += realDt;
      this.updateBT(inp, realDt);
      const scale = this.cine && this.cine.slow ? this.cine.slow : (this.bt.on ? M.BT_SCALE : 1);
      this.scale = scale;
      const dt = realDt * scale;
      this.dt = dt;
      this.time += dt;
      this.stats.time += realDt;
      if (this.nym && !this.player.dead) {
        this.nym.t -= realDt;
        if (this.nym.t <= 0) { this.nym.t = 0; this.killPlayer('Время вышло.'); }
      }
      this.runTimers();
      this.updateDialogs(realDt);
      if (this.cine) {
        this.cine.t += realDt;
        if (this.cine.t >= this.cine.dur) {
          const ev = this.cine.then;
          this.cine = null;
          if (ev) this.fireEvent(ev);
        }
      }
      this.updatePlayer(this.cine || this.paused ? { yaw: inp.yaw, pitch: inp.pitch } : inp, dt, realDt);
      for (const c of this.chars) if (c.state === 'alive' && M.AI) M.AI.update(this, c, dt);
      for (const c of this.chars) if (c.state === 'dead') this.updateCorpse(c, dt);
      this.updateProps(dt);
      this.updateProjectiles(dt);
      this.updateThrows(dt);
      this.updateFires(dt);
      this.updateItems();
      this.updateTriggers();
      for (let i = this.subs.length - 1; i >= 0; i--) {
        this.subs[i].t += realDt;
        if (this.subs[i].t > this.subs[i].dur) this.subs.splice(i, 1);
      }
    }

    updateBT(inp, realDt) {
      const bt = this.bt, p = this.player;
      if (p.dead) {
        bt.on = true;
        return;
      }
      if (inp.bt && !this.cine) {
        if (bt.on && !bt.dodge) { bt.on = false; bt.manual = false; this.emit({ t: 'bt', on: false }); }
        else if (!bt.on && bt.meter > 0.03) { bt.on = true; bt.manual = true; this.emit({ t: 'bt', on: true }); }
      }
      if (bt.on) {
        bt.meter -= BT_DRAIN * realDt * (bt.dodge ? 0.6 : 1);
        if (bt.meter <= 0) {
          bt.meter = 0;
          if (!bt.dodge) { bt.on = false; bt.manual = false; this.emit({ t: 'bt', on: false }); }
        }
      }
    }

    updatePlayer(inp, dt, realDt) {
      const p = this.player, w = this.world;
      if (inp.yaw !== undefined) p.yaw = inp.yaw;
      if (inp.pitch !== undefined) p.pitch = M.clamp(inp.pitch, -1.35, 1.35);
      if (p.dead) {
        p.deadT += realDt;
        p.vel[0] *= 0.9; p.vel[2] *= 0.9;
        p.vel[1] -= GRAV * dt;
        w.move(p, dt, { step: 0 });
        return;
      }
      p.hurtT += dt;
      p.jumpT += dt;
      p.landT += dt;
      if (p.heal > 0) {
        const k = Math.min(p.heal, 70 * realDt);
        p.heal -= k;
        p.hp = Math.min(100, p.hp + k);
      }
      if (inp.heal) this.usePainkillers();
      if (inp.slot) this.selectSlot(inp.slot);
      if (inp.next) this.cycleWeapon(1);
      if (inp.prev) this.cycleWeapon(-1);
      if (inp.weapon && p.weapons[inp.weapon]) this.switchTo(inp.weapon);
      if (inp.reload) this.startReload();
      if (inp.use) this.useFocus();
      const dodgeReq = inp.dodge || (inp.alt && this.moveVec(inp).some(v => v !== 0));
      if (inp.alt && !dodgeReq) this.updateBT({ bt: true }, 0);
      const moveDir = this.moveVec(inp);
      const f = M.fwdOf(p.yaw), r = M.rightOf(p.yaw);
      let wish = [f[0] * moveDir[1] + r[0] * moveDir[0], 0, f[2] * moveDir[1] + r[2] * moveDir[0]];
      const wl = Math.hypot(wish[0], wish[2]);
      if (wl > 0) wish = [wish[0] / wl, 0, wish[2] / wl];
      let away = [-f[0], 0, -f[2]];
      if (p.cover) {
        away = p.cover.n.slice();
        if (dodgeReq || inp.jump) this.leaveCover(dodgeReq ? 'dodge' : 'jump');
        else if (inp.cover) { this.leaveCover('key'); inp = Object.assign({}, inp, { cover: false }); }
      }
      if (inp.cover && !p.cover && !p.dodge && p.onGround) this.takeCover(wl > 0 ? wish : null);
      if (p.coverOut) { p.coverOut.t += realDt; if (p.coverOut.t > 0.6) p.coverOut = null; }
      if (p.land) { p.land.t += dt; if (p.land.t > 1.2) p.land = null; }
      if (dodgeReq && !p.dodge && (p.onGround || p.jumpT < 0.25)) this.startDodge(wl > 0 ? wish : away);
      if (p.dodge) this.updateDodge(dt, realDt, inp);
      else if (p.cover) this.updateCover(inp, wish, wl, dt, realDt);
      else {
        const wantCrouch = !!inp.crouch;
        if (wantCrouch !== p.crouch) {
          if (wantCrouch) { p.crouch = true; p.h = CROUCH_H; }
          else {
            const free = !w.overlaps([p.pos[0] - p.r, p.pos[1] + 0.05, p.pos[2] - p.r], [p.pos[0] + p.r, p.pos[1] + PLAYER_H, p.pos[2] + p.r], 'char');
            if (free) { p.crouch = false; p.h = PLAYER_H; }
          }
        }
        p.posture = p.crouch ? 'crouch' : 'stand';
        const lag = p.land && p.land.kind === 'hard' && p.land.t < LAND_LAG ? 0.3 : 1;
        const speed = (p.crouch ? CROUCH : inp.walk ? WALK : RUN) * lag;
        const acc = p.onGround ? 42 : 7;
        const tv = [wish[0] * speed, wish[2] * speed];
        for (let i = 0; i < 2; i++) {
          const ax = i === 0 ? 0 : 2;
          const dv = tv[i] - p.vel[ax];
          const m = acc * dt;
          p.vel[ax] += M.clamp(dv, -m, m);
        }
        if (inp.jump && p.onGround && !p.crouch) { p.vel[1] = 4.7; p.onGround = false; p.jumpT = 0; this.emit({ t: 'sfx', id: 'jump', pos: p.pos.slice() }); }
        p.vel[1] -= GRAV * dt;
        const wasAir = !p.onGround;
        const vy = p.vel[1];
        this.pushDoors(p, wish);
        this.breakGlassOnBody(p);
        w.move(p, dt, { step: 0.45 });
        if (p.onGround) p.airT = 0; else p.airT += dt;
        if (wasAir && p.onGround) {
          p.landT = 0;
          const ahead = wl > 0 && wish[0] * f[0] + wish[2] * f[2] > 0.7 && Math.hypot(p.vel[0], p.vel[2]) > 2.4;
          p.land = vy < -HARD_LAND ? { kind: ahead ? 'roll' : 'hard', t: 0 } : null;
          const limit = p.land && p.land.kind === 'roll' ? 14.5 : 12;
          if (vy < -limit) this.hurtPlayer((-vy - limit) * 14, [0, 1, 0], 'fall');
          this.emit({ t: 'sfx', id: p.land && p.land.kind === 'roll' ? 'roll' : 'land', pos: p.pos.slice() });
          if (p.land && p.land.kind === 'hard') this.noise(p.pos, 6, 'land');
        }
        if (p.onGround && wl > 0) {
          p.stepT += dt * (p.crouch ? 1.6 : 2.3);
          if (p.stepT > 1) { p.stepT = 0; this.emit({ t: 'step', pos: p.pos.slice(), snow: this.isOutdoor(p.pos) }); }
          p.moveT += dt;
          this.noise(p.pos, inp.walk || p.crouch ? 0 : 3.5, 'step');
        } else p.moveT = 0;
      }
      this.carryOnMover(p);
      p.scanT -= realDt;
      if (p.scanT <= 0) {
        p.scanT = 0.1;
        p.coverSpot = !p.cover && !p.dodge && p.onGround ? this.coverCandidate(wl > 0 ? wish : null) : null;
      }
      if (p.onGround && p.groundObj && p.groundObj.glass) { if (p.cover) this.leaveCover('lost'); this.breakGlass(this.propById[p.groundObj.prop], [0, -1, 0]); p.onGround = false; }
      if (p.pos[1] < (this.def.killY !== undefined ? this.def.killY : -60)) this.killPlayer('fall');
      this.updateWeapon(inp, dt, realDt);
      p.anim = this.playerAnim(p, moveDir);
    }

    moveVec(inp) {
      return [(inp.right ? 1 : 0) - (inp.left ? 1 : 0), (inp.fwd ? 1 : 0) - (inp.back ? 1 : 0)];
    }

    isOutdoor(pos) {
      const z = this.world.zoneAt([pos[0], pos[1] + 1, pos[2]]);
      return !!(z && z.outdoor);
    }

    playerAnim(p, mv) {
      if (p.cover) return { move: [0, 0], speed: 0, crouch: false, air: false };
      const lv = [p.vel[0], p.vel[2]];
      const f = M.fwdOf(p.yaw), r = M.rightOf(p.yaw);
      const fwd = lv[0] * f[0] + lv[1] * f[2], side = lv[0] * r[0] + lv[1] * r[2];
      return { move: [side, fwd], speed: Math.hypot(lv[0], lv[1]), crouch: p.crouch, air: !p.onGround && !p.dodge };
    }

    coverSolid(s) {
      if (!s || s.glass || s.tag === 'stairs') return false;
      if (s.dynProp) {
        const q = this.propById[s.prop];
        return !!q && (q.kind === 'crate' || q.kind === 'locker' || q.kind === 'block');
      }
      return true;
    }

    coverAt(pos, n) {
      const w = this.world, reach = PLAYER_R + 0.28;
      let top = -1;
      for (const h of COVER.probe) {
        const hit = w.raycast([pos[0], pos[1] + h, pos[2]], [-n[0] * reach, 0, -n[2] * reach], { noGlass: true });
        if (!hit || hit.n[0] * n[0] + hit.n[2] * n[2] < 0.9 || !this.coverSolid(hit.solid)) break;
        top = Math.max(top, hit.solid.max[1] - pos[1]);
      }
      if (top < COVER.low) return null;
      return { top, tall: top >= COVER.tall };
    }

    coverToward(d) {
      const p = this.player, w = this.world;
      const len = COVER.reach + p.r;
      const hit = w.raycast([p.pos[0], p.pos[1] + COVER.probe[0], p.pos[2]], [d[0] * len, 0, d[2] * len], { noGlass: true });
      if (!hit || hit.n[1] !== 0 || hit.n[0] * d[0] + hit.n[2] * d[2] > -0.5 || !this.coverSolid(hit.solid)) return null;
      const n = [hit.n[0], 0, hit.n[2]];
      const gr = w.groundAt(hit.pos[0] + n[0] * (p.r + 0.03), hit.pos[2] + n[2] * (p.r + 0.03), p.pos[1] + 0.46, p.r * 0.9);
      if (gr.y < p.pos[1] - 0.46) return null;
      const anchor = [hit.pos[0] + n[0] * (p.r + 0.03), gr.y + 0.001, hit.pos[2] + n[2] * (p.r + 0.03)];
      const info = this.coverAt(anchor, n);
      if (!info) return null;
      if (w.overlaps([anchor[0] - p.r, anchor[1] + 0.05, anchor[2] - p.r], [anchor[0] + p.r, anchor[1] + CROUCH_H, anchor[2] + p.r], 'char')) return null;
      return { n, anchor, dist: hit.t * len, tall: info.tall, top: info.top };
    }

    coverCandidate(wish) {
      const p = this.player;
      const f = M.fwdOf(p.yaw);
      const intent = wish ? [wish, [f[0], 0, f[2]]] : [[f[0], 0, f[2]]];
      let best = null;
      for (const d of intent) {
        const c = this.coverToward(d);
        if (c && (!best || c.dist < best.dist)) best = c;
      }
      if (best) return best;
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        const c = this.coverToward([Math.sin(a), 0, Math.cos(a)]);
        if (c && c.dist < 0.9 && (!best || c.dist < best.dist)) best = c;
      }
      return best;
    }

    coverEdge(pos, c, side) {
      const w = this.world, reach = PLAYER_R + 0.28, n = c.n, t = c.tR;
      const h = c.tall ? 1.3 : COVER.probe[0];
      for (let s = 0.1; s <= 0.71; s += 0.1) {
        const o = [pos[0] + t[0] * s * side, pos[1] + h, pos[2] + t[2] * s * side];
        const hit = w.raycast(o, [-n[0] * reach, 0, -n[2] * reach], { noGlass: true });
        if (hit && hit.n[0] * n[0] + hit.n[2] * n[2] >= 0.9 && this.coverSolid(hit.solid)) continue;
        const off = s - 0.1 + COVER.peek;
        const x = pos[0] + t[0] * off * side, z = pos[2] + t[2] * off * side;
        if (w.overlaps([x - PLAYER_R, pos[1] + 0.05, z - PLAYER_R], [x + PLAYER_R, pos[1] + PLAYER_H, z + PLAYER_R], 'char')) return -1;
        return off;
      }
      return -1;
    }

    takeCover(wish) {
      const p = this.player;
      const spot = this.coverCandidate(wish);
      if (!spot) return false;
      const n = spot.n;
      const yaw = M.yawOf(n[0], n[2]);
      p.cover = {
        n, tR: M.rightOf(yaw), tall: spot.tall, top: spot.top, from: p.pos.slice(), anchor: spot.anchor, enter: 0,
        pop: 0, peek: 0, holdT: 9, awayT: 0, queue: false, queueThrow: false, edge: 0, edgeOff: -1, edgeL: -1, edgeR: -1, edgeT: 0,
        side: 0, slide: 0, dist: 0, hidT: 0, base: spot.anchor.slice()
      };
      p.coverOut = null;
      p.crouch = false;
      p.vel[0] = 0; p.vel[2] = 0;
      p.posture = spot.tall ? 'stand' : 'cover';
      p.h = spot.tall ? PLAYER_H : CROUCH_H;
      p.coverSpot = null;
      this.stats.covers = (this.stats.covers || 0) + 1;
      this.emit({ t: 'cover', on: true, tall: spot.tall });
      this.fireEvent('cover', spot.tall ? 'tall' : 'low');
      return true;
    }

    leaveCover(why) {
      const p = this.player, c = p.cover;
      if (!c) return;
      p.cover = null;
      p.coverOut = { t: 0, tall: c.tall, n: c.n.slice(), why };
      p.vel[0] = 0; p.vel[2] = 0;
      if (p.posture === 'cover') {
        const free = !this.world.overlaps([p.pos[0] - p.r, p.pos[1] + 0.05, p.pos[2] - p.r], [p.pos[0] + p.r, p.pos[1] + PLAYER_H, p.pos[2] + p.r], 'char');
        p.crouch = !free;
        p.posture = free ? 'stand' : 'crouch';
        p.h = free ? PLAYER_H : CROUCH_H;
      }
      this.emit({ t: 'cover', on: false });
    }

    stepBody(p, vx, vz, dt, step) {
      p.vel[0] = vx; p.vel[2] = vz;
      p.vel[1] -= GRAV * dt;
      this.world.move(p, dt, { step });
      p.vel[0] = 0; p.vel[2] = 0;
    }

    updateCover(inp, wish, wl, dt, realDt) {
      const p = this.player, c = p.cover;
      const pdt = realDt * Math.max(this.scale, 0.5);
      if (c.enter < 1) {
        c.enter = Math.min(1, c.enter + pdt / COVER.enter);
        const at = M.mix3(c.from, c.anchor, M.smooth(c.enter));
        const lim = 9 * dt;
        this.stepBody(p, M.clamp(at[0] - p.pos[0], -lim, lim) / dt, M.clamp(at[2] - p.pos[2], -lim, lim) / dt, dt, 0.45);
        if (c.enter >= 1) {
          c.base = p.pos.slice();
          if (!this.coverAt(p.pos, c.n)) this.leaveCover('lost');
        }
        return;
      }
      const info = c.peek === 0 ? this.coverAt(p.pos, c.n) : { tall: c.tall, top: c.top };
      if (!info) { this.leaveCover('lost'); return; }
      if (c.pop === 0 && info.tall !== c.tall) {
        c.tall = info.tall;
        p.posture = c.tall ? 'stand' : 'cover';
        p.h = c.tall ? PLAYER_H : CROUCH_H;
      }
      c.top = info.top;
      const along = wl > 0 ? wish[0] * c.tR[0] + wish[2] * c.tR[2] : 0;
      const out = wl > 0 ? wish[0] * c.n[0] + wish[2] * c.n[2] : 0;
      if (out > 0.7) {
        c.awayT += pdt;
        if (c.awayT > COVER.away) { this.leaveCover('away'); return; }
      } else c.awayT = 0;
      c.edgeT -= realDt;
      if (c.edgeT <= 0 && c.peek === 0) {
        c.edgeT = 0.1;
        c.edgeL = c.tall ? this.coverEdge(p.pos, c, -1) : -1;
        c.edgeR = c.tall ? this.coverEdge(p.pos, c, 1) : -1;
        const f = M.fwdOf(p.yaw);
        const look = f[0] * c.tR[0] + f[2] * c.tR[2];
        const prefer = c.side || (look >= 0 ? 1 : -1);
        if (c.edgeR >= 0 && (c.edgeL < 0 || prefer > 0)) { c.edge = 1; c.edgeOff = c.edgeR; }
        else if (c.edgeL >= 0) { c.edge = -1; c.edgeOff = c.edgeL; }
        else { c.edge = 0; c.edgeOff = -1; }
      }
      const W = p.cur ? M.WEAPONS[p.cur] : null;
      const canPop = !c.tall || c.edge !== 0;
      if (inp.fire && W && W.melee) { this.leaveCover('melee'); return; }
      if (inp.fire && !canPop) { this.leaveCover('fire'); return; }
      if (!canPop) { c.queue = false; c.queueThrow = false; }
      const want = canPop && (!!inp.fire || c.queue || c.queueThrow || out < -0.6);
      if (want) c.holdT = 0; else c.holdT += pdt;
      const up = want || (c.holdT < COVER.hold && c.pop > 0);
      c.pop = M.clamp(c.pop + (up ? pdt / COVER.popIn : -pdt / COVER.popOut), 0, 1);
      if (c.pop > 0.3) c.hidT = Math.max(0, c.hidT - dt * 2); else c.hidT += dt;
      if (!c.tall) {
        const stand = c.pop > 0.45;
        if (stand && p.posture === 'cover') {
          const free = !this.world.overlaps([p.pos[0] - p.r, p.pos[1] + 0.05, p.pos[2] - p.r], [p.pos[0] + p.r, p.pos[1] + PLAYER_H, p.pos[2] + p.r], 'char');
          if (free) { p.posture = 'stand'; p.h = PLAYER_H; }
        } else if (!stand && p.posture !== 'cover') { p.posture = 'cover'; p.h = CROUCH_H; }
        if (c.pop === 0) this.slideCover(along, dt);
        else { this.stepBody(p, -c.n[0] * 0.4, -c.n[2] * 0.4, dt, 0); c.slide = 0; }
        return;
      }
      const goal = c.edge * c.edgeOff * M.smooth(c.pop);
      if (c.pop > 0 || c.peek !== 0) {
        const tx = c.base[0] + c.tR[0] * goal, tz = c.base[2] + c.tR[2] * goal;
        const lim = 6 * dt;
        this.stepBody(p, M.clamp(tx - p.pos[0], -lim, lim) / dt, M.clamp(tz - p.pos[2], -lim, lim) / dt, dt, 0.3);
        c.peek = c.pop === 0 ? 0 : goal;
        if (c.pop === 0) { p.pos[0] = c.base[0]; p.pos[2] = c.base[2]; }
        c.slide = 0;
        return;
      }
      this.slideCover(along, dt);
    }

    slideCover(along, dt) {
      const p = this.player, c = p.cover;
      const sp = Math.abs(along) > 0.2 ? Math.sign(along) * COVER.slide * Math.min(1, Math.abs(along) * 1.4) : 0;
      const before = p.pos.slice();
      let vx = -c.n[0] * 0.4, vz = -c.n[2] * 0.4;
      if (sp !== 0) {
        const s = Math.sign(sp);
        const ahead = [p.pos[0] + c.tR[0] * (s * 0.12 + sp * dt), p.pos[1], p.pos[2] + c.tR[2] * (s * 0.12 + sp * dt)];
        if (this.coverAt(ahead, c.n)) { vx += c.tR[0] * sp; vz += c.tR[2] * sp; }
        c.side = s;
      }
      this.stepBody(p, vx, vz, dt, 0.3);
      if (!this.coverAt(p.pos, c.n)) { p.pos[0] = before[0]; p.pos[2] = before[2]; }
      const moved = (p.pos[0] - before[0]) * c.tR[0] + (p.pos[2] - before[2]) * c.tR[2];
      c.slide = moved / Math.max(dt, 1e-6);
      c.dist += moved;
      c.base = p.pos.slice();
      if (Math.abs(moved) > 1e-4) {
        p.stepT += Math.abs(moved) * 0.9;
        if (p.stepT > 1) { p.stepT = 0; this.emit({ t: 'step', pos: p.pos.slice(), snow: this.isOutdoor(p.pos), soft: true }); }
      }
    }

    startDodge(dir) {
      const p = this.player;
      p.dodge = { phase: 'air', t: 0, dir: [dir[0], dir[2]], lie: M.yawOf(dir[0], dir[2]) };
      p.vel = [dir[0] * 7.4, 3.2, dir[2] * 7.4];
      p.onGround = false;
      p.crouch = false;
      p.h = DODGE_H;
      p.posture = 'dive';
      p.lieYaw = p.dodge.lie;
      if (this.bt.meter > 0.04) {
        if (!this.bt.on) this.emit({ t: 'bt', on: true, dodge: true });
        this.bt.on = true;
        this.bt.dodge = true;
        this.bt.meter = Math.max(0, this.bt.meter - 0.05);
      }
      this.emit({ t: 'sfx', id: 'dodge', pos: p.pos.slice() });
      this.stats.dodges = (this.stats.dodges || 0) + 1;
    }

    updateDodge(dt, realDt, inp) {
      const p = this.player, d = p.dodge, w = this.world;
      d.t += d.phase === 'air' ? dt : realDt;
      if (d.phase === 'air') {
        p.vel[1] -= GRAV * 0.92 * dt;
        this.breakGlassOnBody(p);
        const vy = p.vel[1];
        const res = w.move(p, dt, { step: 0.2, noSnap: true });
        if (res.blocked) { p.vel[0] *= 0.3; p.vel[2] *= 0.3; }
        if ((p.onGround && d.t > 0.12) || d.t > 2.4) {
          d.phase = 'down';
          d.t = 0;
          p.vel = [0, 0, 0];
          p.posture = 'lie';
          p.h = 0.5;
          this.emit({ t: 'sfx', id: 'thud', pos: p.pos.slice() });
          if (vy < -13) this.hurtPlayer((-vy - 13) * 12, [0, 1, 0], 'fall');
        }
      } else if (d.phase === 'down') {
        p.vel[1] -= GRAV * dt;
        w.move(p, dt, { step: 0 });
        const wantUp = inp.fwd || inp.back || inp.left || inp.right || inp.jump;
        if (d.t > (wantUp ? 0.22 : 0.5)) {
          const free = !w.overlaps([p.pos[0] - p.r, p.pos[1] + 0.05, p.pos[2] - p.r], [p.pos[0] + p.r, p.pos[1] + PLAYER_H, p.pos[2] + p.r], 'char');
          if (free) {
            d.phase = 'up';
            d.t = 0;
            if (this.bt.dodge) {
              this.bt.dodge = false;
              if (!this.bt.manual) { this.bt.on = false; this.emit({ t: 'bt', on: false }); }
            }
          }
        }
      } else {
        p.vel[1] -= GRAV * dt;
        w.move(p, dt, { step: 0 });
        if (d.t > 0.3) {
          p.dodge = null;
          p.h = PLAYER_H;
          p.posture = 'stand';
        }
      }
    }

    carryOnMover(e) {
      if (!e.onGround || !e.groundObj || !e.groundObj.prop) return;
      const m = this.propById[e.groundObj.prop];
      if (!m || !m.delta) return;
      e.pos[0] += m.delta[0]; e.pos[1] += m.delta[1]; e.pos[2] += m.delta[2];
    }

    pushDoors(e, wish) {
      if (!wish || (wish[0] === 0 && wish[2] === 0)) return;
      for (const p of this.props) {
        if (p.kind !== 'door' || p.target > 0.5 || p.noPush) continue;
        const dx = p.pos[0] - e.pos[0], dz = p.pos[2] - e.pos[2];
        if (Math.abs(e.pos[1] - p.pos[1]) > 1.2) continue;
        const along = p.axis === 'x' ? dx : dz, across = p.axis === 'x' ? dz : dx;
        if (Math.abs(along) > p.w / 2 + 0.1 || Math.abs(across) > 0.75) continue;
        const toward = p.axis === 'x' ? wish[2] * Math.sign(across) : wish[0] * Math.sign(across);
        if (toward < 0.3) continue;
        if (p.locked && p.keyFlag && e === this.player && this.flags['has:' + p.keyFlag]) {
          p.locked = false;
          this.emit({ t: 'pickup', text: 'Ключ подошёл' });
        }
        if (p.locked) {
          if (e === this.player && this.real - (p.lockT || -9) > 2.5) {
            p.lockT = this.real;
            this.emit({ t: 'locked', id: p.id, text: p.lockMsg || 'Заперто.' });
            this.fireEvent('locked:' + p.id);
          }
          continue;
        }
        this.openDoor(p.id, Math.sign(across) || 1);
      }
    }

    openDoor(id, dir) {
      const p = this.propById[id];
      if (!p || p.target >= 1) return;
      p.target = 1;
      if (!p.slide) p.swing = dir || p.swing || 1;
      if (p.forceSwing) p.swing = p.forceSwing;
      p.locked = false;
      this.emit({ t: 'sfx', id: p.slide ? 'slide' : 'door', pos: p.pos.slice() });
      this.fireEvent('open:' + id);
    }
    closeDoor(id) {
      const p = this.propById[id];
      if (!p) return;
      p.target = 0;
      this.emit({ t: 'sfx', id: p.slide ? 'slide' : 'doorclose', pos: p.pos.slice() });
    }
    unlock(id) { const p = this.propById[id]; if (p) p.locked = false; }
    lock(id, msg) { const p = this.propById[id]; if (p) { p.locked = true; if (msg) p.lockMsg = msg; } }

    breakGlassOnBody(e) {
      const v = e.vel;
      const sp = Math.hypot(v[0], v[2]);
      if (sp < 2.5) return;
      const min = [e.pos[0] - e.r + v[0] * 0.05, e.pos[1] + 0.1, e.pos[2] - e.r + v[2] * 0.05];
      const max = [e.pos[0] + e.r + v[0] * 0.05, e.pos[1] + e.h, e.pos[2] + e.r + v[2] * 0.05];
      for (const d of this.world.dyn) {
        if (!d.on || !d.glass) continue;
        if (M.boxOverlap(min, max, d.min, d.max)) this.breakGlass(this.propById[d.prop], v);
      }
    }

    breakGlass(p, dir) {
      if (!p || p.broken) return;
      p.broken = true;
      this.syncProp(p);
      this.emit({ t: 'glass', pos: [p.pos[0], p.pos[1] + (p.axis === 'y' ? 0 : p.h / 2), p.pos[2]], w: p.w, h: p.axis === 'y' ? p.d : p.h, axis: p.axis, dir: dir ? M.norm(dir) : [0, 0, 0] });
      this.noise(p.pos, 14, 'glass');
      this.fireEvent('break:' + p.id);
    }

    usePainkillers() {
      const p = this.player;
      if (p.pk <= 0 || p.hp + p.heal >= 100) return false;
      p.pk--;
      p.heal += 48;
      this.stats.painkillers++;
      this.emit({ t: 'sfx', id: 'pills', pos: p.pos.slice() });
      this.emit({ t: 'heal' });
      return true;
    }

    selectSlot(n) {
      const p = this.player;
      const list = M.WEAPON_ORDER.filter(w => M.WEAPONS[w].slot === n && p.weapons[w] && this.hasAmmo(p, w));
      if (!list.length) return;
      const i = list.indexOf(p.cur);
      this.switchTo(list[(i + 1) % list.length]);
    }
    cycleWeapon(dir) {
      const p = this.player;
      const list = M.WEAPON_ORDER.filter(w => p.weapons[w] && this.hasAmmo(p, w));
      if (!list.length) return;
      const i = Math.max(0, list.indexOf(p.cur));
      this.switchTo(list[(i + dir + list.length) % list.length]);
    }
    switchTo(w) {
      const p = this.player;
      if (!p.weapons[w] || p.cur === w) return;
      p.last = p.cur;
      p.cur = w;
      p.reload = 0;
      p.switchT = 0.28;
      p.cd = Math.max(p.cd, 0.1);
      this.emit({ t: 'sfx', id: 'switch' });
    }

    startReload() {
      const p = this.player, W = M.WEAPONS[p.cur];
      if (!W || !W.clip || p.reload > 0) return false;
      if ((p.clips[p.cur] || 0) >= W.clip || p.ammo[W.ammo] <= 0) return false;
      p.reload = W.reload;
      p.reloadW = p.cur;
      this.emit({ t: 'sfx', id: W.shellReload ? 'shell' : 'reload', pos: p.pos.slice() });
      return true;
    }

    finishReload() {
      const p = this.player, W = M.WEAPONS[p.reloadW];
      if (!W || p.reloadW !== p.cur) { p.reload = 0; return; }
      if (W.shellReload) {
        if (p.ammo[W.ammo] > 0 && p.clips[p.cur] < W.clip) { p.clips[p.cur]++; p.ammo[W.ammo]--; }
        if (p.clips[p.cur] < W.clip && p.ammo[W.ammo] > 0) { p.reload = W.reload; this.emit({ t: 'sfx', id: 'shell', pos: p.pos.slice() }); }
        else p.reload = 0;
        return;
      }
      const need = W.clip - (p.clips[p.cur] || 0);
      const take = Math.min(need, p.ammo[W.ammo]);
      p.clips[p.cur] = (p.clips[p.cur] || 0) + take;
      p.ammo[W.ammo] -= take;
      p.reload = 0;
    }

    updateWeapon(inp, dt, realDt) {
      const p = this.player;
      const pdt = realDt * Math.max(this.scale, 0.5);
      p.cd = Math.max(0, p.cd - pdt);
      p.switchT = Math.max(0, p.switchT - pdt);
      p.fireT += dt;
      if (p.reload > 0) {
        if (inp.fire && M.WEAPONS[p.cur] && M.WEAPONS[p.cur].shellReload && (p.clips[p.cur] || 0) > 0) p.reload = 0;
        else {
          p.reload -= pdt;
          if (p.reload <= 0) { p.reload = 0; this.finishReload(); }
          return;
        }
      }
      if (p.throwT > 0) {
        p.throwT -= pdt;
        if (p.throwT <= 0) this.releaseThrow();
      }
      if (p.swing > 0) {
        p.swing -= pdt;
        if (p.swing <= 0) this.meleeHit();
      }
      const cv = p.cover;
      const exposed = !cv || (cv.enter >= 1 && cv.pop >= 0.85);
      if ((inp.throwQuick || (cv && cv.queueThrow)) && p.throwT <= 0 && p.cd <= 0) {
        const kind = p.ammo.gren > 0 && (p.lastThrow !== 'molotov' || p.ammo.molo <= 0) ? 'grenade' : p.ammo.molo > 0 ? 'molotov' : null;
        if (kind && !exposed) cv.queueThrow = true;
        else if (kind) { if (cv) cv.queueThrow = false; this.startThrow(kind); }
        else if (cv) cv.queueThrow = false;
      }
      if (!(inp.fire || (cv && cv.queue)) || p.switchT > 0 || !p.cur) return;
      const W = M.WEAPONS[p.cur];
      if (!exposed) { if (!W.melee) cv.queue = true; return; }
      if (p.cd > 0) return;
      if (cv) cv.queue = false;
      if (W.semi && inp.firePressed === false && p.lastSemi && this.real - p.lastSemi < W.cd * 1.7) return;
      if (W.melee) {
        p.cd = W.cd;
        p.swing = 0.14;
        p.anim && (p.anim.swing = 1);
        p.swingT = this.time;
        this.emit({ t: 'sfx', id: 'swing', pos: p.pos.slice() });
        return;
      }
      if (W.throwable) {
        if (p.ammo[W.ammo] > 0) this.startThrow(p.cur);
        return;
      }
      if ((p.clips[p.cur] || 0) <= 0) {
        if (!this.startReload()) {
          if (this.real - (p.dryT || -9) > 0.35) { p.dryT = this.real; this.emit({ t: 'sfx', id: 'dry' }); }
          const b = this.bestWeapon(p);
          if (b && b !== p.cur && !this.hasAmmo(p, p.cur)) this.switchTo(b);
        }
        return;
      }
      p.cd = W.cd;
      p.lastSemi = this.real;
      p.clips[p.cur]--;
      p.fireT = 0;
      this.stats.shots++;
      const side = W.hold === 'dual' ? (p.dualSide = 1 - p.dualSide) : 0;
      const muzzle = this.playerMuzzle(side);
      const aim = inp.aim || this.defaultAim();
      const dir = M.norm(M.sub(aim, muzzle));
      for (let i = 0; i < W.pellets; i++) {
        const spread = W.spread * (p.moveT > 0.2 ? 1.25 : 1) * (p.dodge ? 1.15 : 1) * (p.crouch ? 0.8 : 1) * (p.cover ? 0.75 : 1);
        const d = this.jitter(dir, spread);
        this.spawnBullet(muzzle, d, W.speed, W.dmg, 'player', p.cur);
      }
      this.emit({ t: 'shot', weapon: p.cur, pos: muzzle, dir, owner: 'player', side });
      this.noise(p.pos, 26, 'shot');
      if ((p.clips[p.cur] || 0) <= 0 && p.ammo[W.ammo] > 0) this.startReload();
    }

    jitter(dir, s) {
      if (s <= 0) return dir;
      const a = this.rng.next() * Math.PI * 2, r = Math.sqrt(this.rng.next()) * s;
      const up = Math.abs(dir[1]) < 0.95 ? [0, 1, 0] : [1, 0, 0];
      const u = M.norm(M.cross(dir, up)), v = M.cross(u, dir);
      return M.norm([dir[0] + (u[0] * Math.cos(a) + v[0] * Math.sin(a)) * r, dir[1] + (u[1] * Math.cos(a) + v[1] * Math.sin(a)) * r, dir[2] + (u[2] * Math.cos(a) + v[2] * Math.sin(a)) * r]);
    }

    eye() {
      const p = this.player;
      const h = p.posture === 'lie' ? 0.45 : p.posture === 'dive' ? 0.75 : p.posture === 'crouch' || p.posture === 'cover' ? 1.0 : 1.55;
      return [p.pos[0], p.pos[1] + h, p.pos[2]];
    }

    playerMuzzle(side) {
      const p = this.player;
      const f = M.dirFromYawPitch(p.yaw, p.pitch), r = M.rightOf(p.yaw);
      const e = this.eye();
      const sx = side === 1 ? -0.2 : 0.2;
      const m = [e[0] + f[0] * 0.55 + r[0] * sx, e[1] - 0.12 + f[1] * 0.5, e[2] + f[2] * 0.55 + r[2] * sx];
      const hit = this.world.raycast(e, M.sub(m, e), { noGlass: true });
      if (hit) return M.addScaled(e, M.sub(m, e), Math.max(0, hit.t - 0.05));
      return m;
    }

    defaultAim() {
      const p = this.player;
      const e = this.eye();
      const d = M.dirFromYawPitch(p.yaw, p.pitch);
      const hit = this.world.raycast(e, M.scale(d, 80));
      return hit ? hit.pos : M.addScaled(e, d, 80);
    }

    spawnBullet(pos, dir, speed, dmg, owner, weapon) {
      this.projectiles.push({ pos: pos.slice(), vel: M.scale(dir, speed), dmg, owner, weapon, life: 0, start: pos.slice(), whiz: false, id: (this.bid = (this.bid || 0) + 1) });
    }

    startThrow(kind) {
      const p = this.player;
      if (p.throwT > 0) return;
      p.throwT = 0.26;
      p.throwKind = kind;
      p.cd = 0.8;
      p.lastThrow = kind;
      this.emit({ t: 'sfx', id: 'throwprep' });
    }
    releaseThrow() {
      const p = this.player;
      const kind = p.throwKind;
      p.throwRelT = this.time;
      const ammo = kind === 'grenade' ? 'gren' : 'molo';
      if (p.ammo[ammo] <= 0) return;
      p.ammo[ammo]--;
      const e = this.eye();
      const d = M.dirFromYawPitch(p.yaw, p.pitch + 0.2);
      const start = M.addScaled(e, d, 0.4);
      this.spawnThrow(kind, start, [d[0] * 13, d[1] * 13 + 1.5, d[2] * 13], 'player');
      if (p.cur === kind && p.ammo[ammo] <= 0) { const b = this.bestWeapon(p); if (b) this.switchTo(b); }
    }
    spawnThrow(kind, pos, vel, owner) {
      this.throws.push({ kind, pos: pos.slice(), vel: vel.slice(), owner, fuse: kind === 'grenade' ? 2.4 : 9, t: 0, spin: 0 });
      this.emit({ t: 'sfx', id: 'throw', pos: pos.slice() });
    }

    meleeHit() {
      const p = this.player, W = M.WEAPONS[p.cur];
      if (!W || !W.melee) return;
      const f = M.fwdOf(p.yaw);
      let hit = false;
      for (const c of this.chars) {
        if (c.state !== 'alive' || c.civilian && !c.hostile) continue;
        const d = M.sub(c.pos, p.pos);
        const dist = Math.hypot(d[0], d[2]);
        if (dist > W.range + 0.3 || Math.abs(d[1]) > 1.3) continue;
        if ((d[0] * f[0] + d[2] * f[2]) / (dist || 1) < 0.45) continue;
        this.damageChar(c, W.dmg, 'body', M.norm([d[0], 0.2, d[2]]), 'player', p.cur);
        hit = true;
      }
      const e = this.eye();
      const tip = M.addScaled(e, M.dirFromYawPitch(p.yaw, p.pitch), W.range);
      for (const q of this.props) {
        if (q.kind === 'crate' && !q.broken && M.dist(q.pos, tip) < 1.2) { this.damageProp(q, 40, tip, [f[0], 0, f[2]]); hit = true; }
        else if (q.kind === 'glass' && !q.broken && M.dist([q.pos[0], q.pos[1] + q.h / 2, q.pos[2]], tip) < Math.max(1, q.w / 2)) { this.breakGlass(q, f); hit = true; }
        else if (q.kind === 'padlock' && !q.broken && M.dist(q.pos, tip) < 0.7) { this.damageProp(q, 99, tip, f); hit = true; }
        else if (q.kind === 'shootable' && !q.broken && M.dist(q.pos, tip) < (q.r || 0.4) + 0.5) { this.damageProp(q, W.dmg, tip, f); hit = true; }
      }
      if (hit) this.emit({ t: 'sfx', id: 'bash', pos: tip });
    }

    updateProjectiles(dt) {
      const P = this.projectiles;
      for (let i = P.length - 1; i >= 0; i--) {
        const b = P[i];
        b.life += dt;
        const seg = M.scale(b.vel, dt);
        let best = null;
        const wh = this.world.raycast(b.pos, seg, { shot: true });
        if (wh) best = { t: wh.t, kind: wh.solid.glass ? 'glass' : wh.solid.dynProp ? 'prop' : 'world', n: wh.n, solid: wh.solid };
        const tryChar = (c, isPlayer) => {
          for (const s of bodySpheres(c)) {
            const t = M.segSphere(b.pos, seg, s.c, s.r);
            if (t >= 0 && (!best || t < best.t)) best = { t, kind: 'char', c, isPlayer, part: s.part };
          }
        };
        if (b.owner !== 'player' && !this.player.dead) {
          const p = this.player;
          if (M.dist(p.pos, b.pos) < M.len(seg) + 3) tryChar(p, true);
          if (!b.whiz) {
            const e = this.eye();
            const t = M.clamp(M.dot(M.sub(e, b.pos), seg) / Math.max(1e-6, M.dot(seg, seg)), 0, 1);
            const q = M.addScaled(b.pos, seg, t);
            if (M.dist(q, e) < 1.2 && t > 0 && t < 1) { b.whiz = true; this.emit({ t: 'whiz', pos: q }); }
          }
        }
        for (const c of this.chars) {
          if (c.state !== 'alive' || c.id === b.owner || c.noHit) continue;
          if (b.owner === 'player' && c.friendly) continue;
          if (M.dist(c.pos, b.pos) > M.len(seg) + 3) continue;
          tryChar(c, false);
        }
        for (const q of this.props) {
          if (q.kind === 'cyl' && !q.exploded) {
            const t = M.segSphere(b.pos, seg, [q.pos[0], q.pos[1] + 0.65, q.pos[2]], 0.22);
            if (t >= 0 && (!best || t < best.t)) best = { t, kind: 'cyl', q };
          } else if (q.kind === 'padlock' && !q.broken) {
            const t = M.segSphere(b.pos, seg, q.pos, 0.14);
            if (t >= 0 && (!best || t < best.t)) best = { t, kind: 'padlock', q };
          } else if (q.kind === 'shootable' && !q.broken && !q.hidden) {
            const t = M.segSphere(b.pos, seg, q.pos, q.r || 0.4);
            if (t >= 0 && (!best || t < best.t)) best = { t, kind: 'shootable', q };
          }
        }
        if (!best) {
          b.pos = M.add(b.pos, seg);
          if (b.life > 2.5 || M.dist(b.pos, b.start) > 120) P.splice(i, 1);
          continue;
        }
        const hp = M.addScaled(b.pos, seg, best.t);
        const dir = M.norm(b.vel);
        if (best.kind === 'glass') {
          const prop = this.propById[best.solid.prop];
          this.breakGlass(prop, dir);
          b.pos = M.addScaled(hp, dir, 0.05);
          b.vel = M.scale(b.vel, 0.85);
          continue;
        }
        P.splice(i, 1);
        if (best.kind === 'char') {
          if (best.isPlayer) {
            this.hurtPlayer(b.dmg, dir, b.owner, b.weapon);
            this.emit({ t: 'blood', pos: hp, dir, player: true });
          } else {
            const src = b.owner === 'player' ? 'player' : 'npc';
            const mult = b.owner === 'player' ? 1 : 0.5;
            if (b.owner === 'player') this.stats.hits++;
            this.damageChar(best.c, b.dmg * mult, best.part, dir, src, b.weapon, hp);
            this.emit({ t: 'blood', pos: hp, dir, head: best.part === 'head' });
          }
        } else if (best.kind === 'cyl') {
          this.damageProp(best.q, b.dmg, hp, dir);
          this.emit({ t: 'impact', pos: hp, n: M.scale(dir, -1), mat: 'metal' });
        } else if (best.kind === 'padlock') {
          this.damageProp(best.q, 99, hp, dir);
        } else if (best.kind === 'shootable') {
          this.damageProp(best.q, b.dmg, hp, dir);
          this.emit({ t: 'impact', pos: hp, n: M.scale(dir, -1), mat: best.q.mat || 'metal' });
        } else {
          const s = best.solid;
          if (s.dynProp) {
            const prop = this.propById[s.prop];
            if (prop && prop.kind === 'crate') this.damageProp(prop, b.dmg, hp, dir);
          }
          this.emit({ t: 'impact', pos: hp, n: best.n, mat: this.surfaceOf(s, best.n), decal: true });
          if (b.owner === 'player') this.noise(hp, 6, 'impact');
        }
      }
    }

    surfaceOf(s, n) {
      if (s.dynProp) {
        const p = this.propById[s.prop];
        if (p && (p.kind === 'crate' || p.kind === 'door' && !p.metal)) return 'wood';
        return 'metal';
      }
      let m = s.mat;
      if (m && typeof m === 'object') m = n[1] > 0.5 ? (m.top || m.side) : n[1] < -0.5 ? (m.bottom || m.side) : (m.side || m.top);
      m = String(m || '');
      if (/wood|parquet|crate|door|plank/.test(m)) return 'wood';
      if (/metal|steel|rail|vault|grate|train/.test(m)) return 'metal';
      if (/snow/.test(m)) return 'snow';
      if (/water/.test(m)) return 'water';
      return 'stone';
    }

    damageProp(q, dmg, pos, dir) {
      if (q.kind === 'cyl') {
        if (q.exploded) return;
        q.hp -= dmg;
        if (q.hp <= 0 && !q.hiss) {
          q.hiss = 0.45;
          this.emit({ t: 'sfx', id: 'hiss', pos: q.pos.slice() });
        }
      } else if (q.kind === 'crate') {
        if (q.broken) return;
        q.hp -= dmg;
        if (q.hp <= 0) {
          q.broken = true;
          this.syncProp(q);
          this.emit({ t: 'debris', pos: [q.pos[0], q.pos[1] + q.size[1] / 2, q.pos[2]], size: q.size, mat: 'wood' });
          for (const it of this.items) if (it.in === q.id) it.hidden = false;
          this.fireEvent('break:' + q.id);
        }
      } else if (q.kind === 'shootable') {
        if (q.broken) return;
        q.hp = (q.hp === undefined ? 20 : q.hp) - dmg;
        if (q.hp <= 0) { q.broken = true; this.fireEvent(q.event || 'break:' + q.id); }
      } else if (q.kind === 'padlock') {
        if (q.broken) return;
        q.broken = true;
        this.emit({ t: 'sfx', id: 'padlock', pos: q.pos.slice() });
        this.emit({ t: 'impact', pos: q.pos.slice(), n: M.scale(dir || [0, 0, 1], -1), mat: 'metal' });
        if (q.door) { this.unlock(q.door); this.openDoor(q.door, q.swing || 1); }
        this.fireEvent('break:' + q.id);
      }
    }

    explode(pos, r, dmg, src) {
      this.emit({ t: 'explode', pos: pos.slice(), r });
      this.noise(pos, 45, 'explode');
      const test = (c, pts) => {
        const d = M.dist(c, pos);
        if (d > r) return 0;
        const hit = this.world.raycast(pos, M.sub(c, pos), { noGlass: true, noDyn: true });
        if (hit && hit.t < 0.95) return 0;
        return Math.pow(1 - d / r, 0.75);
      };
      const p = this.player;
      if (!p.dead) {
        const k = test([p.pos[0], p.pos[1] + 0.9, p.pos[2]]);
        if (k > 0) {
          this.hurtPlayer(dmg * k * 0.75, M.norm(M.sub(p.pos, pos)), src, 'explosion');
          const push = M.norm([p.pos[0] - pos[0], 0.5, p.pos[2] - pos[2]]);
          p.vel = M.addScaled(p.vel, push, 5 * k);
        }
      }
      for (const c of this.chars) {
        if (c.state !== 'alive' || c.invuln) continue;
        const k = test([c.pos[0], c.pos[1] + 0.9, c.pos[2]]);
        if (k > 0) this.damageChar(c, dmg * k, 'body', M.norm([c.pos[0] - pos[0], 0.6, c.pos[2] - pos[2]]), src, 'explosion');
      }
      for (const q of this.props) {
        const d = M.dist(q.pos || [0, 0, 0], pos);
        if (q.kind === 'cyl' && !q.exploded && !q.hiss && d < r * 0.9) q.hiss = 0.12 + d * 0.03;
        else if (q.kind === 'crate' && !q.broken && d < r * 0.8) this.damageProp(q, 999, q.pos, [0, 1, 0]);
        else if (q.kind === 'glass' && !q.broken && d < r * 1.2) this.breakGlass(q, M.norm(M.sub(q.pos, pos)));
        else if (q.kind === 'door' && !q.locked && !q.noPush && d < r * 0.7 && q.target < 1) this.openDoor(q.id, 1);
      }
    }

    updateProps(dt) {
      for (const p of this.props) {
        if (p.kind === 'door') {
          if (p.open !== p.target) {
            const sp = (p.speed || (p.slide ? 1.2 : 2.6)) * dt;
            p.open = p.open < p.target ? Math.min(p.target, p.open + sp) : Math.max(p.target, p.open - sp);
            this.syncProp(p);
          }
        } else if (p.kind === 'cyl') {
          if (p.hiss !== undefined && !p.exploded) {
            p.hiss -= dt;
            if (p.hiss <= 0) {
              p.exploded = true;
              this.syncProp(p);
              this.explode([p.pos[0], p.pos[1] + 0.7, p.pos[2]], p.radius || 4.8, p.dmg || 170, 'player');
              this.fireEvent('explode:' + p.id);
            }
          }
        } else if (p.kind === 'mover') this.updateMover(p, dt);
        else if (p.kind === 'searchlight') this.updateSearchlight(p, dt);
        else if (p.kind === 'tv' && p.on) this.updateTv(p, dt);
      }
    }

    pathRemaining(p) {
      let total = M.dist(p.path[p.seg], p.path[p.seg + 1]) - p.along;
      for (let i = p.seg + 1; i < p.path.length - 1; i++) total += M.dist(p.path[i], p.path[i + 1]);
      return total;
    }

    updateMover(p, dt) {
      p.delta = null;
      if (!p.moving || !p.path || p.path.length < 2) return;
      const accel = p.accel || 3, vmax = p.maxSpeed || 8;
      if (!p.loop && !p.noBrake && this.pathRemaining(p) <= p.speed * p.speed / (2 * accel) + 0.05) p.speed = Math.max(0.5, p.speed - accel * dt);
      else p.speed = Math.min(vmax, p.speed + accel * dt);
      let move = p.speed * dt;
      const old = p.origin.slice();
      let arrived = false;
      while (move > 1e-9) {
        const L = M.dist(p.path[p.seg], p.path[p.seg + 1]);
        if (p.along + move < L) { p.along += move; break; }
        move -= L - p.along;
        p.along = 0;
        p.seg++;
        if (p.seg >= p.path.length - 1) {
          if (p.loop) { p.seg = 0; continue; }
          p.seg = p.path.length - 2;
          p.along = M.dist(p.path[p.seg], p.path[p.seg + 1]);
          arrived = true;
          break;
        }
      }
      const A = p.path[p.seg], Bp = p.path[p.seg + 1];
      p.origin = M.mix3(A, Bp, p.along / (M.dist(A, Bp) || 1));
      p.delta = M.sub(p.origin, old);
      if (Math.abs(p.delta[0]) + Math.abs(p.delta[1]) + Math.abs(p.delta[2]) > 5) p.delta = [0, 0, 0];
      this.syncProp(p);
      if (arrived) {
        p.moving = false;
        p.speed = 0;
        this.emit({ t: 'sfx', id: 'moverstop', pos: p.origin.slice() });
        this.later(0, 'mover:' + p.id);
      }
      const boxes = this.dynOf.get(p.id) || [];
      const bodies = [this.player, ...this.chars.filter(c => c.state === 'alive')];
      for (const e of bodies) {
        if (e.dead) continue;
        if (e.onGround && e.groundObj && e.groundObj.prop === p.id) continue;
        const min = [e.pos[0] - e.r, e.pos[1] + 0.05, e.pos[2] - e.r], max = [e.pos[0] + e.r, e.pos[1] + e.h, e.pos[2] + e.r];
        for (const bx of boxes) {
          if (!M.boxOverlap(min, max, bx.min, bx.max)) continue;
          if (e.pos[1] >= bx.max[1] - 0.35) { e.pos[1] = bx.max[1] + 0.001; e.onGround = true; e.groundObj = bx; continue; }
          const pushDir = M.norm([p.delta[0], 0, p.delta[2]]);
          e.pos = M.addScaled(e.pos, pushDir, M.len(p.delta) + 0.02);
          if (p.speed > 3 && p.crush !== false) {
            if (e === this.player) this.hurtPlayer(250, pushDir, 'train');
            else this.damageChar(e, 999, 'body', pushDir, 'world');
          }
        }
      }
    }

    moverGo(id, path) {
      const p = this.propById[id];
      if (!p) return;
      if (path) { p.path = path; p.seg = 0; p.along = 0; p.origin = path[0].slice(); }
      p.moving = true;
      this.emit({ t: 'sfx', id: p.sound || 'moverstart', pos: p.origin.slice() });
    }

    updateSearchlight(p, dt) {
      if (p.off) return;
      p.phase += dt * (p.speed || 0.35);
      const yaw = p.yaw + Math.sin(p.phase) * (p.sweep || 0.6);
      p.dir = M.dirFromYawPitch(yaw, p.pitch || -0.35);
      const pl = this.player;
      if (pl.dead) return;
      const c = [pl.pos[0], pl.pos[1] + 1, pl.pos[2]];
      const to = M.sub(c, p.pos);
      const d = M.len(to);
      if (d > (p.range || 40)) { p.seeT = 0; return; }
      const cos = M.dot(M.scale(to, 1 / d), p.dir);
      if (cos < Math.cos(p.cone || 0.12) || !this.world.visible(p.pos, c)) { p.seeT = Math.max(0, (p.seeT || 0) - dt); return; }
      p.seeT = (p.seeT || 0) + dt;
      if (p.seeT > 0.4 && this.real - (p.alarmT || -9) > 2) {
        p.alarmT = this.real;
        this.fireEvent('spotted:' + p.id);
        this.emit({ t: 'spotted', id: p.id });
      }
    }

    updateTv(p, dt) {
      const show = M.TV && M.TV[p.show];
      if (!show || !show.lines.length) return;
      p.lineT = (p.lineT || 0) - dt;
      if (p.lineT > 0) return;
      const line = show.lines[p.line % show.lines.length];
      p.line++;
      p.lineT = line.dur || 3.6;
      if (M.dist(this.player.pos, p.pos) < 9) this.say(line.who, line.text, p.lineT - 0.2, { tv: true });
    }

    updateThrows(dt) {
      const T = this.throws;
      for (let i = T.length - 1; i >= 0; i--) {
        const g = T[i];
        g.t += dt;
        g.vel[1] -= GRAV * dt;
        const seg = M.scale(g.vel, dt);
        const hit = this.world.raycast(g.pos, seg);
        let charHit = null;
        if (g.kind === 'molotov' && g.t > 0.08) {
          const bodies = [...this.chars.filter(c => c.state === 'alive' && c.id !== g.owner)];
          if (g.owner !== 'player') bodies.push(this.player);
          for (const c of bodies) for (const s of bodySpheres(c)) {
            const t = M.segSphere(g.pos, seg, s.c, s.r + 0.05);
            if (t >= 0 && (!hit || t < hit.t)) { charHit = { t }; break; }
          }
        }
        if (hit && hit.solid.glass) this.breakGlass(this.propById[hit.solid.prop], M.norm(g.vel));
        if ((hit && !hit.solid.glass) || charHit) {
          const t = charHit ? charHit.t : hit.t;
          const at = M.addScaled(g.pos, seg, t);
          if (g.kind === 'molotov') {
            T.splice(i, 1);
            this.molotovBurst(at, g.owner);
            continue;
          }
          const n = hit.n;
          g.pos = M.addScaled(at, n, 0.03);
          const vn = M.dot(g.vel, n);
          g.vel = M.scale(M.sub(g.vel, M.scale(n, 2 * vn)), 0.38);
          if (n[1] > 0.6 && Math.abs(g.vel[1]) < 1.2) g.vel[1] = 0;
          if (Math.abs(vn) > 1.5) this.emit({ t: 'sfx', id: 'bounce', pos: g.pos.slice() });
        } else g.pos = M.add(g.pos, seg);
        g.spin += dt * 12;
        if (g.kind === 'grenade') {
          g.fuse -= dt;
          if (g.fuse <= 0) {
            T.splice(i, 1);
            this.explode(M.add(g.pos, [0, 0.2, 0]), 6, 190, g.owner === 'player' ? 'player' : 'npc');
          }
        } else if (g.t > 6) T.splice(i, 1);
      }
    }

    molotovBurst(at, owner) {
      const gr = this.world.groundAt(at[0], at[2], at[1] + 0.3, 0.1);
      const y = gr.y > at[1] - 4 ? gr.y : at[1];
      this.fires.push({ pos: [at[0], y, at[2]], r: 2.3, t: 0, life: 7.5, owner });
      this.emit({ t: 'molotov', pos: [at[0], y, at[2]] });
      this.noise(at, 20, 'explode');
      for (const q of this.props) if (q.kind === 'cyl' && !q.exploded && !q.hiss && M.dist(q.pos, at) < 2.6) q.hiss = 1.2;
    }

    addFire(pos, r, life, o) {
      const f = Object.assign({ pos: pos.slice(), r, t: 0, life: life || 1e9, owner: 'world' }, o || {});
      this.fires.push(f);
      return f;
    }

    updateFires(dt) {
      for (let i = this.fires.length - 1; i >= 0; i--) {
        const f = this.fires[i];
        f.t += dt;
        if (f.t > f.life || f.off) { this.fires.splice(i, 1); continue; }
        const grow = Math.min(1, f.t * 3);
        const r = f.r * grow;
        const p = this.player;
        if (!p.dead && M.dist2d(p.pos, f.pos) < r && Math.abs(p.pos[1] - f.pos[1]) < 1.3) this.hurtPlayer((f.dmg || 22) * dt, [0, 1, 0], 'fire', 'fire', true);
        for (const c of this.chars) {
          if (c.state !== 'alive' || c.fireproof) continue;
          if (M.dist2d(c.pos, f.pos) < r && Math.abs(c.pos[1] - f.pos[1]) < 1.3) {
            this.damageChar(c, (f.dmg || 38) * dt, 'body', [0, 1, 0], f.owner === 'player' ? 'player' : 'world', 'fire');
            c.ai.burn = 1;
          }
        }
      }
    }

    updateItems() {
      const p = this.player;
      if (p.dead) return;
      for (const it of this.items) {
        if (it.taken || it.hidden) continue;
        const dx = it.pos[0] - p.pos[0], dz = it.pos[2] - p.pos[2], dy = it.pos[1] - p.pos[1];
        if (dx * dx + dz * dz > 0.85 * 0.85 || dy < -0.6 || dy > 1.4) continue;
        if (this.pickup(it)) {
          it.taken = true;
          this.fireEvent('pick:' + it.id);
        }
      }
    }

    pickup(it) {
      const p = this.player;
      let text = null;
      if (it.kind === 'painkillers') {
        if (p.pk >= 8) return false;
        p.pk = Math.min(8, p.pk + (it.amount || 1));
        text = 'Обезболивающее';
        this.emit({ t: 'sfx', id: 'pillsbottle' });
      } else if (it.kind === 'weapon') {
        const W = M.WEAPONS[it.weapon];
        const give = it.amount !== undefined ? it.amount : (W.give || 0);
        if (W.throwable) {
          if (p.ammo[W.ammo] >= M.AMMO[W.ammo].max && p.weapons[it.weapon]) return false;
          p.weapons[it.weapon] = true;
          p.ammo[W.ammo] = Math.min(M.AMMO[W.ammo].max, p.ammo[W.ammo] + Math.max(1, give));
          text = W.name;
        } else if (W.melee) {
          if (p.weapons[it.weapon]) return false;
          p.weapons[it.weapon] = true;
          text = W.name;
        } else {
          const had = p.weapons[it.weapon];
          const dual = it.weapon === 'beretta' ? 'beretta2' : it.weapon === 'ingram' ? 'ingram2' : null;
          if (!had) {
            p.weapons[it.weapon] = true;
            p.clips[it.weapon] = Math.min(W.clip, give);
            p.ammo[W.ammo] = Math.min(M.AMMO[W.ammo].max, p.ammo[W.ammo] + Math.max(0, give - W.clip));
            text = W.name;
            if (this.shouldAutoSwitch(it.weapon)) this.switchTo(it.weapon);
          } else if (dual && !p.weapons[dual]) {
            p.weapons[dual] = true;
            p.clips[dual] = Math.min(M.WEAPONS[dual].clip, (p.clips[it.weapon] || 0) + give);
            text = M.WEAPONS[dual].name;
            if (p.cur === it.weapon) this.switchTo(dual);
          } else {
            if (p.ammo[W.ammo] >= M.AMMO[W.ammo].max) return false;
            p.ammo[W.ammo] = Math.min(M.AMMO[W.ammo].max, p.ammo[W.ammo] + Math.max(1, give));
            text = M.AMMO[W.ammo].name + ' +' + Math.max(1, give);
          }
        }
        this.emit({ t: 'sfx', id: 'pickgun' });
      } else if (it.kind === 'ammo') {
        const a = it.ammo;
        if (p.ammo[a] >= M.AMMO[a].max) return false;
        p.ammo[a] = Math.min(M.AMMO[a].max, p.ammo[a] + (it.amount || 10));
        text = M.AMMO[a].name + ' +' + (it.amount || 10);
        this.emit({ t: 'sfx', id: 'pickammo' });
      } else if (it.kind === 'key' || it.kind === 'detonator' || it.kind === 'flag') {
        this.flags['has:' + (it.flag || it.id)] = true;
        text = it.name || M.ITEM_NAMES[it.kind] || 'Предмет';
        this.emit({ t: 'sfx', id: 'pickkey' });
      }
      if (text) this.emit({ t: 'pickup', text });
      return true;
    }

    shouldAutoSwitch(w) {
      const p = this.player;
      const rank = { pipe: 0, bat: 1, beretta: 2, sawed: 3, deagle: 4, ingram: 5, pump: 6, beretta2: 6, ingram2: 7 };
      const W = M.WEAPONS[w];
      if (!W || W.throwable) return false;
      return (rank[w] || 0) > (rank[p.cur] || 0) && p.reload <= 0;
    }

    updateTriggers() {
      const p = this.player;
      if (p.dead) return;
      const c = [p.pos[0], p.pos[1] + 0.5, p.pos[2]];
      for (const t of this.triggers) {
        if (t.off || (t.once && t.fired)) continue;
        const inside = M.pointInBox(c, t.min, t.max);
        if (inside && !t.inside) {
          t.fired = true;
          this.fireEvent('enter:' + t.id);
        }
        t.inside = inside;
      }
    }

    trigger(id) { return this.triggers.find(t => t.id === id); }
    enableTrigger(id, on) { const t = this.trigger(id); if (t) { t.off = !on; if (on) t.fired = false; } }

    focus() {
      const p = this.player;
      if (p.dead || p.dodge) return null;
      const e = this.eye();
      const f = M.fwdOf(p.yaw);
      let best = null, bs = -1;
      for (const q of this.props) {
        if (!this.usable(q)) continue;
        const pos = q.usePos || q.pos;
        const d = M.dist(pos, [p.pos[0], p.pos[1] + 1, p.pos[2]]);
        if (d > (q.reach || 1.9)) continue;
        const to = M.norm([pos[0] - p.pos[0], 0, pos[2] - p.pos[2]]);
        const facing = to[0] * f[0] + to[2] * f[2];
        if (facing < 0.2 && d > 0.8) continue;
        const hit = this.world.raycast(e, M.sub(pos, e), { noGlass: true });
        if (hit && hit.t < 0.88 && !(hit.solid.dynProp && hit.solid.prop === q.id)) continue;
        const score = facing * 2 - d;
        if (score > bs) { bs = score; best = q; }
      }
      for (const c of this.chars) {
        if (c.state !== 'alive' || !c.usable) continue;
        const d = M.dist(c.pos, p.pos);
        if (d > 2.0) continue;
        const score = 2 - d;
        if (score > bs) { bs = score; best = { kind: 'char', id: c.id, label: c.usable, char: true }; }
      }
      return best;
    }

    usable(q) {
      if (q.hidden || q.disabled) return false;
      switch (q.kind) {
        case 'button': return !q.used || !q.once;
        case 'phone': return !!q.ringing;
        case 'tv': return true;
        case 'note': return true;
        case 'locker': return !q.opened;
        case 'door': return !!q.useOpen && q.target < 1;
        case 'keypad': return !q.used;
        default: return false;
      }
    }

    labelOf(q) {
      if (q.label) return q.label;
      return { button: 'Нажать', phone: 'Ответить', tv: 'Телевизор', note: 'Прочитать', locker: 'Открыть', door: 'Открыть', keypad: 'Ввести код' }[q.kind] || 'Использовать';
    }

    useFocus() {
      const q = this.focus();
      if (!q) return false;
      this.use(q);
      return true;
    }

    use(q) {
      if (q.char) { this.fireEvent('talk:' + q.id); return; }
      switch (q.kind) {
        case 'button':
          if (q.locked) { this.emit({ t: 'locked', id: q.id, text: q.lockMsg || 'Не работает.' }); this.fireEvent('locked:' + q.id); break; }
          q.used = true;
          this.emit({ t: 'sfx', id: q.sound || 'button', pos: q.pos.slice() });
          this.fireEvent('use:' + q.id);
          break;
        case 'keypad':
          if (q.needFlag && !this.flags[q.needFlag]) { this.emit({ t: 'locked', text: q.lockMsg || 'Нужен код.' }); this.fireEvent('locked:' + q.id); break; }
          q.used = true;
          this.emit({ t: 'sfx', id: 'keypad', pos: q.pos.slice() });
          this.fireEvent('use:' + q.id);
          break;
        case 'phone':
          q.ringing = false;
          this.emit({ t: 'sfx', id: 'pickup_phone', pos: q.pos.slice() });
          this.fireEvent('phone:' + q.id);
          break;
        case 'tv':
          q.on = !q.on;
          q.lineT = 0.3;
          this.emit({ t: 'sfx', id: q.on ? 'tvon' : 'tvoff', pos: q.pos.slice() });
          this.fireEvent('tv:' + q.id);
          break;
        case 'note':
          this.emit({ t: 'note', id: q.id, title: q.title, text: q.text });
          this.flags['read:' + q.id] = true;
          this.fireEvent('read:' + q.id);
          break;
        case 'locker':
          q.opened = true;
          this.emit({ t: 'sfx', id: 'locker', pos: q.pos.slice() });
          for (const it of this.items) if (it.in === q.id) it.hidden = false;
          this.fireEvent('use:' + q.id);
          break;
        case 'door':
          if (q.locked && q.keyFlag && this.flags['has:' + q.keyFlag]) q.locked = false;
          if (q.locked) { this.emit({ t: 'locked', id: q.id, text: q.lockMsg || 'Заперто.' }); this.fireEvent('locked:' + q.id); break; }
          this.openDoor(q.id, q.swing || 1);
          break;
      }
    }

    hurtPlayer(dmg, dir, src, weapon, silent) {
      const p = this.player;
      if (p.dead || this.god || this.done) return;
      let k = src === 'fall' || src === 'train' || src === 'world' ? 1 : this.diff.dmg * this.adapt;
      if (src === 'player' && weapon === 'explosion') k = 0.8;
      const d = dmg * k;
      p.hp -= d;
      if (!silent) {
        p.hurtT = 0;
        this.emit({ t: 'hurt', dmg: d, dir: dir || [0, 0, 0] });
      } else if (this.real - (p.burnT || -9) > 0.4) { p.burnT = this.real; this.emit({ t: 'hurt', dmg: d, dir: [0, 1, 0], burn: true }); }
      if (p.hp <= 0) this.killPlayer(src);
    }

    killPlayer(reason) {
      const p = this.player;
      if (p.dead) return;
      p.hp = 0;
      p.dead = true;
      p.deadT = 0;
      p.dodge = null;
      p.cover = null;
      p.posture = 'lie';
      p.lieYaw = p.yaw + Math.PI;
      this.stats.deaths++;
      this.bt.on = true;
      this.emit({ t: 'death', reason });
    }

    damageChar(c, dmg, part, dir, src, weapon, at) {
      if (c.state !== 'alive' || c.invuln) {
        if (c.state === 'alive' && c.invuln && src === 'player') { c.ai.aware = true; this.fireEvent('shot:' + c.id); }
        return;
      }
      if (c.friendly && src === 'player') return;
      const mult = weapon === 'explosion' || weapon === 'fire' ? 1 : (DAMAGE_PART[part] || 1);
      let d = dmg * mult;
      if (c.dmgScale !== undefined) d *= c.dmgScale;
      if (c.hpFloor !== undefined && c.hp - d < c.hpFloor) { d = Math.max(0, c.hp - c.hpFloor); c.hp = c.hpFloor; this.fireEvent('floor:' + c.id); }
      else c.hp -= d;
      c.lastHit = { dir, part, weapon, src };
      if (M.AI) M.AI.onHurt(this, c, dir, src);
      this.fireEvent('hurt:' + c.id);
      if (c.hp > 0) return;
      this.killChar(c, dir, part, weapon, src);
    }

    killChar(c, dir, part, weapon, src) {
      if (c.state === 'dead') return;
      c.state = 'dead';
      c.hp = 0;
      dir = dir || [0, 0, 1];
      const f = M.fwdOf(c.yaw);
      const front = -(dir[0] * f[0] + dir[2] * f[2]);
      const heavy = weapon === 'pump' || weapon === 'sawed' || weapon === 'deagle' || weapon === 'explosion';
      const kind = weapon === 'explosion' ? 'blown' : part === 'head' && this.rng.chance(0.5) ? 'drop' : front > 0.3 ? (heavy ? 'flyback' : 'back') : front < -0.3 ? 'front' : (this.rng.chance(0.5) ? 'spinL' : 'spinR');
      c.anim.death = { kind, t: 0 };
      c.lieYaw = c.yaw;
      const push = heavy ? 3.2 : 1.1;
      c.vel = [dir[0] * push, weapon === 'explosion' ? 3.5 : 0.6, dir[2] * push];
      c.posture = 'lie';
      if (src === 'player') {
        this.stats.kills++;
        if (part === 'head') this.stats.heads++;
        this.bt.meter = Math.min(1, this.bt.meter + (c.dummy ? 0.05 : 0.11) + (part === 'head' ? 0.05 : 0));
        if (this.nym) this.nym.t += c.boss ? 20 : 6;
      }
      this.emit({ t: 'kill', id: c.id, pos: c.pos.slice(), head: part === 'head', boss: !!c.boss, src });
      if (!c.noDrop && c.weapon && !c.dummy) {
        const W = M.WEAPONS[c.weapon];
        if (W && !W.throwable) this.addItem({ kind: 'weapon', weapon: c.dropWeapon || c.weapon, amount: W.melee ? 0 : Math.max(4, Math.round((W.give || 8) * (0.6 + this.rng.next() * 0.5))), pos: [c.pos[0] + dir[0] * 0.6, c.pos[1] + 0.05, c.pos[2] + dir[2] * 0.6], dropped: true });
      }
      if (c.drop) for (const d of [].concat(c.drop)) this.addItem(Object.assign({ pos: [c.pos[0] + this.rng.range(-0.4, 0.4), c.pos[1] + 0.05, c.pos[2] + this.rng.range(-0.4, 0.4)] }, d));
      if (c.gren > 0 && !c.dummy && this.rng.chance(0.5)) this.addItem({ kind: 'weapon', weapon: 'grenade', amount: 1, pos: [c.pos[0] - dir[0] * 0.4, c.pos[1] + 0.05, c.pos[2] - dir[2] * 0.4] });
      if (c.molo > 0 && !c.dummy && this.rng.chance(0.5)) this.addItem({ kind: 'weapon', weapon: 'molotov', amount: 1, pos: [c.pos[0] - dir[0] * 0.4, c.pos[1] + 0.05, c.pos[2] - dir[2] * 0.4] });
      if (M.AI) M.AI.onDeath(this, c);
      this.fireEvent('dead:' + c.id);
      if (c.group && !this.chars.some(o => o.group === c.group && (o.state === 'alive' || o.state === 'hidden') && !o.civilian)) this.fireEvent('kill:' + c.group);
    }

    updateCorpse(c, dt) {
      const d = c.anim.death;
      if (!d || d.t > 6) return;
      d.t += dt;
      c.vel[1] -= GRAV * dt;
      c.vel[0] *= Math.pow(0.02, dt);
      c.vel[2] *= Math.pow(0.02, dt);
      const body = { pos: c.pos, vel: c.vel, r: 0.22, h: 0.4, onGround: c.onGround };
      this.world.move(body, dt, { step: 0.2 });
      c.pos = body.pos;
      c.onGround = body.onGround;
    }

    noise(pos, r, kind) {
      if (r <= 0 || !M.AI) return;
      M.AI.hear(this, pos, r, kind);
    }

    runTimers() {
      if (!this.timers.length) return;
      for (let i = 0; i < this.timers.length; i++) {
        const t = this.timers[i];
        if ((t.real ? this.real : this.time) >= t.at) {
          this.timers.splice(i, 1);
          i--;
          this.fireEvent(t.ev, t.arg);
        }
      }
    }

    later(sec, ev, arg, real) {
      this.timers.push({ at: (real ? this.real : this.time) + sec, ev, arg, real: !!real });
    }

    say(who, text, dur, o) {
      o = o || {};
      const s = Object.assign({ who, text, dur: dur || Math.min(7, 1.6 + text.length * 0.055), t: 0 }, o);
      this.subs = this.subs.filter(q => !(q.who === who && q.tv === s.tv));
      this.subs.push(s);
      if (this.subs.length > 4) this.subs.shift();
      this.emit({ t: 'say', who, text, dur: s.dur, tv: !!o.tv, thought: !!o.thought });
      return s;
    }
    think(text, dur) { return this.say('max', text, dur, { thought: true }); }
    hint(text, dur) { this.emit({ t: 'hint', text, dur: dur || 6 }); }
    setThought(text) { this.thought = text; }

    dialog(lines, endEv) {
      const d = { lines, i: -1, t: 0, end: endEv };
      this.dialogs.push(d);
      this.nextLine(d);
      return d;
    }
    nextLine(d) {
      d.i++;
      if (d.i >= d.lines.length) {
        this.dialogs.splice(this.dialogs.indexOf(d), 1);
        if (d.end) this.fireEvent(d.end);
        return;
      }
      const L = d.lines[d.i];
      const who = L[0], text = L[1];
      const dur = L[2] || Math.min(7.5, 1.8 + text.length * 0.058);
      d.t = dur;
      if (who === 'max:thought') this.think(text, dur);
      else this.say(who, text, dur, { phone: !!d.phone });
    }
    updateDialogs(realDt) {
      for (const d of this.dialogs.slice()) {
        d.t -= realDt;
        if (d.t <= 0) this.nextLine(d);
      }
    }
    skipLine() {
      for (const d of this.dialogs.slice()) { d.t = 0; this.subs = this.subs.filter(s => !s.tv); }
    }

    wake(group, mode) {
      for (const c of this.chars) {
        if (c.group !== group || c.state !== 'hidden') continue;
        c.state = 'alive';
        if (M.AI) M.AI.wake(this, c, mode);
      }
    }
    alert(group) {
      for (const c of this.chars) if (c.group === group && c.state === 'alive' && M.AI) M.AI.alertChar(this, c, this.player.pos);
    }
    raise(group) {
      for (const c of this.chars) if (c.group === group && c.state === 'alive' && c.popup) { c.raised = true; c.noHit = false; this.emit({ t: 'sfx', id: 'popup', pos: c.pos.slice() }); }
    }
    groupAlive(group) { return this.chars.filter(c => c.group === group && (c.state === 'alive' || c.state === 'hidden')).length; }

    show(id, on) {
      this.world.setGroup(id, on);
      this.flags['grp:' + id] = on;
      this.emit({ t: 'group', id, on });
    }

    cam(shot) {
      this.cine = Object.assign({ t: 0, dur: 3 }, shot);
      this.emit({ t: 'cine', shot: this.cine });
    }

    novel(page) { this.emit({ t: 'novel', page }); }
    music(id) { this.flags.music = id; this.emit({ t: 'music', id }); }
    checkpoint(name) { this.emit({ t: 'checkpoint', name: name || '' }); }
    finish() {
      if (this.done) return;
      this.done = true;
      this.emit({ t: 'complete' });
    }
    fail(text) {
      if (this.failed) return;
      this.failed = text;
      this.emit({ t: 'fail', text });
    }

    ring(id) {
      const q = this.propById[id];
      if (q) { q.ringing = true; this.emit({ t: 'ring', id, pos: q.pos.slice() }); }
    }

    charTo(id, pos, o) {
      const c = this.charById[id];
      if (!c || !M.AI) return;
      M.AI.scriptMove(this, c, pos, o || {});
    }

    snapshot() {
      const strip = o => JSON.parse(JSON.stringify(o, (k, v) => k === 'groundObj' || k === 'path' && Array.isArray(v) && v.length > 60 ? undefined : v));
      return {
        v: 1, level: this.levelId, time: this.time, real: this.real, flags: strip(this.flags), timers: strip(this.timers), thought: this.thought,
        player: strip(this.player), bt: strip(this.bt), nym: this.nym ? strip(this.nym) : null,
        chars: strip(this.chars), items: strip(this.items), props: strip(this.props), fires: strip(this.fires),
        triggers: this.triggers.map(t => ({ id: t.id, fired: t.fired, off: t.off })),
        groups: Object.fromEntries(Object.entries(this.world.groups).map(([k, g]) => [k, g.on])),
        lights: this.world.lights.map(L => !!L.off), stats: strip(this.stats), diff: this.diffIndex
      };
    }

    restore(s) {
      this.time = s.time; this.real = s.real; this.flags = s.flags; this.timers = s.timers; this.thought = s.thought || '';
      this.player = s.player;
      this.player.groundObj = null;
      this.bt = s.bt; this.nym = s.nym; this.stats = s.stats || this.stats;
      for (const [k, on] of Object.entries(s.groups || {})) this.world.setGroup(k, on);
      (s.lights || []).forEach((off, i) => { if (this.world.lights[i]) this.world.lights[i].off = off; });
      for (const d of this.world.dyn.slice()) if (d.dynProp) this.world.dyn.splice(this.world.dyn.indexOf(d), 1);
      this.dynOf.clear();
      this.props = []; this.propById = {};
      for (const p of s.props) this.addProp(p);
      this.chars = []; this.charById = {};
      for (const c of s.chars) { this.chars.push(c); this.charById[c.id] = c; c.groundObj = null; }
      this.items = s.items;
      this.fires = s.fires || [];
      for (const t of s.triggers || []) { const q = this.trigger(t.id); if (q) { q.fired = t.fired; q.off = t.off; } }
      this.projectiles = []; this.throws = []; this.subs = []; this.dialogs = []; this.cine = null;
      this.done = false; this.failed = null;
    }
  }
  M.Game = Game;
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
