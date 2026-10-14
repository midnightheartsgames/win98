(function (H) {
  'use strict';
  H.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  H.distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  class Damageable {
    constructor(hp) { this.hp = hp; this.maxHP = hp; }
    takeDamage(amount) { this.hp = Math.max(0, this.hp - amount); }
  }
  class Player extends Damageable {
    constructor(data = {}) {
      super(100); Object.assign(this, { x: 4, z: 6, y: 0, vy: 0, yaw: 0, pitch: 0, crouch: false, crowbar: false, pistol: false, weapon: 'hands', ammo: 17, reserve: 68, hurt: 0 }, data);
    }
    takeDamage(n) { super.takeDamage(n); this.hurt = .35; }
    step(world, input, dt) {
      this.crouch = !!input.ControlLeft || !!input.KeyC || world.ceilingAt(this.x, this.z) < 1.65;
      const speed = this.crouch ? 2.2 : input.ShiftLeft ? 6.5 : 4.5;
      let forward = (+!!input.KeyW) - (+!!input.KeyS), side = (+!!input.KeyD) - (+!!input.KeyA);
      const length = Math.hypot(forward, side) || 1; forward /= length; side /= length;
      world.move(this, (Math.cos(this.yaw) * forward - Math.sin(this.yaw) * side) * speed * dt, (Math.sin(this.yaw) * forward + Math.cos(this.yaw) * side) * speed * dt, .25);
      if (input.Space && this.y === 0 && !this.crouch) { this.vy = 4.65; world.sound('jump'); }
      const airborne = this.y > 0; this.vy -= 9.8 * dt; this.y = Math.max(0, this.y + this.vy * dt);
      const headroom = world.ceilingAt(this.x, this.z) - (this.crouch ? .85 : 1.6) - .08;
      if (this.y > headroom) { this.y = Math.max(0, headroom); this.vy = Math.min(0, this.vy); }
      if (!this.y) { this.vy = 0; if (airborne) world.sound('land'); }
      this.hurt = Math.max(0, this.hurt - dt);
    }
  }
  class Weapon {
    constructor(damage, range, cooldown) { Object.assign(this, { damage, range, cooldown, timer: 0, reloadTimer: 0, animation: 0 }); }
    equip() { this.reloadTimer = 0; }
    unequip() { this.reloadTimer = 0; }
    step(p, dt) {
      this.timer = Math.max(0, this.timer - dt); this.animation = Math.max(0, this.animation - dt);
      if (this.reloadTimer > 0) { this.reloadTimer = Math.max(0, this.reloadTimer - dt); if (this.reloadTimer === 0) { const n = Math.min(17 - p.ammo, p.reserve); p.ammo += n; p.reserve -= n; } }
    }
    reload() {}
    attack(world) {
      if (this.timer > 0 || this.reloadTimer > 0) return false;
      this.timer = this.cooldown; this.animation = .22;
      const p = world.player, pistol = this instanceof Pistol;
      if (pistol && p.ammo <= 0) { world.sound('empty'); this.reload(world); return false; }
      if (pistol) p.ammo--;
      world.sound(pistol ? 'shot' : 'swing');
      const hit = world.trace(this.range, true, pistol ? (world.random() - .5) * .016 : 0);
      if (hit && hit.takeDamage) { hit.takeDamage(this.damage); world.sound('hit'); world.particles.push({ x: hit.x, z: hit.z, y: hit.type === 'headcrab' ? .3 : 1, life: .3, color: hit instanceof Enemy ? [ .5, .08, .02 ] : [ .6, .45, .25 ] }); }
      if (pistol) p.pitch = H.clamp(p.pitch + .015, -.95, .95);
      world.alert(); return true;
    }
  }
  class Crowbar extends Weapon { constructor() { super(20, 1.7, .45); } }
  class Pistol extends Weapon {
    constructor() { super(14, 45, .23); }
    reload(world) { const p = world.player; if (!this.reloadTimer && p.ammo < 17 && p.reserve > 0) { this.reloadTimer = 1.35; world.sound('reload'); } }
  }
  const stats = { headcrab: [14, 8, 2.1], zombie: [60, 15, 1.15], vortigaunt: [80, 20, 1.6] };
  class Enemy extends Damageable {
    constructor(type, x, z) { super(stats[type][0]); Object.assign(this, { type, x, z, y: 0, state: 'idle', timer: 0, cooldown: 0, lastSeen: null, pathTimer: 0, path: [], leap: 0, beam: 0 }); }
    step(w, dt) {
      if (!this.hp) { this.state = 'dead'; this.y = 0; return; }
      const p = w.player, distance = H.distance(this, p), visible = distance < 17 && w.visible(this, p);
      this.cooldown = Math.max(0, this.cooldown - dt); this.beam = Math.max(0, this.beam - dt);
      if (visible) this.lastSeen = { x: p.x, z: p.z };
      if (!this.lastSeen) return;
      if (this.state === 'charge') {
        this.timer -= dt;
        if (this.timer <= 0) { if (w.visible(this, p) && distance < 18) { p.takeDamage(20); this.beam = .18; w.sound('electric'); } this.state = 'reposition'; this.cooldown = 2.5; }
        return;
      }
      if (this.state === 'jump') {
        this.timer -= dt; this.y = Math.sin(Math.max(0, this.timer) / .5 * Math.PI) * .9;
        w.move(this, this.leapX * dt * 7, this.leapZ * dt * 7, .26);
        if (distance < .85 && p.y < .65 && !this.leapHit) { p.takeDamage(8); this.leapHit = true; w.sound('hurt'); }
        if (this.timer <= 0) { this.y = 0; this.state = 'recover'; this.cooldown = 1.5; } return;
      }
      if (this.type === 'headcrab' && visible && distance < 3 && !this.cooldown) {
        this.state = 'jump'; this.timer = .5; this.leapHit = false; this.leapX = (p.x - this.x) / (distance || 1); this.leapZ = (p.z - this.z) / (distance || 1); w.sound('crab'); return;
      }
      if (this.type === 'vortigaunt' && visible && distance > 2 && distance < 14 && !this.cooldown) { this.state = 'charge'; this.timer = .9; w.sound('charge'); return; }
      if (visible && distance < 1.45 && !this.cooldown && this.type !== 'headcrab') { if (p.y < .8) p.takeDamage(stats[this.type][1]); this.cooldown = 1.25; this.state = 'attack'; w.sound('hurt'); return; }
      if (this.type === 'headcrab' && this.cooldown) return;
      this.state = this.type === 'vortigaunt' && distance < 4 ? 'reposition' : 'chase';
      this.pathTimer -= dt;
      if (this.pathTimer <= 0) { this.path = w.navigate(this, this.lastSeen); this.pathTimer = .7; }
      let target = visible ? p : this.path[0];
      if (target && H.distance(this, target) < .3 && this.path.length) { this.path.shift(); target = this.path[0]; }
      if (!target) { this.lastSeen = null; this.state = 'idle'; return; }
      let dx = target.x - this.x, dz = target.z - this.z, len = Math.hypot(dx, dz) || 1;
      const retreat = this.state === 'reposition' ? -1 : 1;
      const speed = stats[this.type][2] * retreat;
      if (!w.move(this, dx / len * speed * dt, dz / len * speed * dt, .3) && visible) {
        target = this.path[0]; if (target) { dx = target.x - this.x; dz = target.z - this.z; len = Math.hypot(dx, dz) || 1; w.move(this, dx / len * dt * 1.4, dz / len * dt * 1.4, .3); }
      }
    }
  }
  class Headcrab extends Enemy { constructor(x, z) { super('headcrab', x, z); } }
  class Zombie extends Enemy { constructor(x, z) { super('zombie', x, z); } }
  class Vortigaunt extends Enemy { constructor(x, z) { super('vortigaunt', x, z); } }
  class Interactable {
    constructor(type, x, z, label) { Object.assign(this, { type, x, z, label, used: false }); }
    interact(w) { w.message(this.label); }
  }
  class Door extends Interactable {
    constructor(type, x, z, axis) { super(type, x, z, type === 'locked' ? 'ACCESS DENIED' : 'E — открыть дверь'); this.axis = axis; this.open = false; this.slide = 0; this.solid = true; }
    interact(w) { if (this.type === 'locked' || this.arenaLock) return w.message('ACCESS DENIED — устраните угрозу'); this.open = true; this.solid = false; w.sound('door'); }
    step(w, dt) { if (this.type === 'automatic' && H.distance(this, w.player) < 2.7 && !this.open) this.interact(w); this.slide = H.clamp(this.slide + (this.open ? dt * 2 : -dt * 2), 0, 1); }
  }
  class Breakable extends Damageable {
    constructor(type, x, z, loot) { super(type === 'glass' ? 20 : 40); Object.assign(this, { type, x, z, loot, solid: true, broken: false }); }
    step(w) { if (!this.hp && !this.broken) { this.broken = true; this.solid = false; w.sound('break'); if (this.loot) w.items.push(new Pickup(this.loot, this.x, this.z)); for (let i = 0; i < 8; i++) w.particles.push({ x: this.x + (w.random() - .5), z: this.z + (w.random() - .5), y: .3 + w.random(), life: 1, color: [.5, .35, .15] }); } }
  }
  class Pickup extends Interactable {
    constructor(type, x, z) { super(type, x, z, 'E — подобрать'); }
    interact(w) {
      if (this.used) return; const p = w.player;
      if (this.type === 'health') { if (p.hp >= 100) return; p.hp = Math.min(100, p.hp + 25); }
      else if (this.type === 'ammo') { if (p.reserve >= 136) return; p.reserve = Math.min(136, p.reserve + 34); }
      else { p[this.type] = true; w.equip(this.type); }
      this.used = true; w.sound('pickup'); w.message({ health: '+25 HEALTH', ammo: '+34 9mm', crowbar: 'МОНТИРОВКА · ЛКМ — удар · разбивайте ящики', pistol: '9mm PISTOL · R — перезарядка · 1 / 2 — оружие' }[this.type]);
    }
  }
  class HealthStation extends Interactable {
    constructor(x, z) { super('station', x, z, 'Удерживайте E — лечение'); this.charge = 100; }
    interact(w, dt = 1 / 60) { const n = Math.min(dt * 20, 100 - w.player.hp, this.charge); w.player.hp += n; this.charge -= n; if (!this.charge) w.message('STATION EMPTY'); }
  }
  class TriggerVolume {
    constructor(x, z, radius, actions) { Object.assign(this, { x, z, radius, actions, fired: false }); }
    step(w) { if (!this.fired && H.distance(this, w.player) < this.radius) { this.fired = true; this.actions.forEach(a => w.action(a)); } }
  }
  class SaveManager {
    constructor(storage) { this.storage = storage; this.key = 'hl98-checkpoint-v1'; }
    read() {
      try { const s = JSON.parse(this.storage.getItem(this.key)); if (!s || s.version !== 1 || ![0, 1].includes(s.level)) return null;
        const p = s.player; if (!p || !Number.isFinite(p.hp) || p.hp <= 0 || p.hp > 100 || !Number.isInteger(p.ammo) || p.ammo < 0 || p.ammo > 17 || !Number.isInteger(p.reserve) || p.reserve < 0 || p.reserve > 136 || typeof p.crowbar !== 'boolean' || typeof p.pistol !== 'boolean' || !['hands', 'crowbar', 'pistol'].includes(p.weapon) || (p.weapon !== 'hands' && !p[p.weapon]) || (s.level === 1 && (!p.crowbar || !p.pistol))) return null; return s;
      } catch (_) { return null; }
    }
    write(level, p) { try { this.storage.setItem(this.key, JSON.stringify({ version: 1, level, player: { hp: p.hp, crowbar: p.crowbar, pistol: p.pistol, weapon: p.weapon, ammo: p.ammo, reserve: p.reserve } })); return true; } catch (_) { return false; } }
  }
  Object.assign(H, { Damageable, Player, Weapon, Crowbar, Pistol, Enemy, Headcrab, Zombie, Vortigaunt, Interactable, Door, Breakable, Pickup, HealthStation, TriggerVolume, SaveManager });
})(globalThis.HL98 = globalThis.HL98 || {});
