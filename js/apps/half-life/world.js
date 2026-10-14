(function (H) {
  'use strict';
  const layout = [[0, 0], [1, 0], [2, 0], [2, 1], [1, 1], [0, 1], [0, 2], [1, 2]];
  const names = [
    ['ANOMALOUS MATERIALS', 'PERSONNEL / 01', 'CONTAMINATED LAB', 'SECURITY STORAGE', 'BIOLOGICAL RESEARCH', 'TEST CHAMBER', 'REACTOR CONTROL', 'EMERGENCY ELEVATOR'],
    ['SECTOR C / ARRIVAL', 'MAINTENANCE', 'FREIGHT STORAGE', 'VENTILATION', 'GENERATOR CONTROL', 'COOLANT SYSTEM', 'TURBINE HALL', 'AUXILIARY POWER']
  ];
  class World {
    constructor(level = 0, data = {}, hooks = {}) {
      Object.assign(this, { level, hooks, player: new H.Player(data), enemies: [], items: [], doors: [], breakables: [], props: [], particles: [], triggers: [], time: 0, room: 0, wave: 0, complete: false, visited: new Set(), weapons: { crowbar: new H.Crowbar(), pistol: new H.Pistol() } });
      this.random = hooks.random || Math.random;
      this.size = 37; this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(1));
      this.rooms = layout.map(([gx, gz], i) => ({ x: gx * 12 + 6.5, z: gz * 12 + 6.5, name: names[level][i] }));
      layout.forEach(([gx, gz], i) => {
        for (let z = gz * 12 + 1; z <= gz * 12 + 11; z++) for (let x = gx * 12 + 1; x <= gx * 12 + 11; x++) this.grid[z][x] = 0;
        const r = this.rooms[i];
        this.props.push({ type: level ? 'generator' : 'console', x: r.x - 3.5, z: r.z - 3.5, solid: true });
        this.props.push({ type: 'table', x: r.x + 3, z: r.z + 3.6, solid: true });
        if (i > 0 && i < 7) {
          this.breakables.push(new H.Breakable('crate', r.x - 2.5, r.z + 2.7, i % 2 ? 'ammo' : 'health'));
          this.breakables.push(new H.Breakable('crate', r.x - 3.6, r.z + 2.7));
        }
        this.triggers.push(new H.TriggerVolume(r.x, r.z, 5, [{ type: 'ShowMessage', text: r.name }, ...(i === 1 || i === 5 ? [{ type: 'Explosion', x: r.x + 3, z: r.z - 3 }, { type: 'LightFlicker' }, { type: 'PlaySound', sound: 'alarm' }] : [])]));
      });
      for (let i = 1; i < layout.length; i++) {
        const a = this.rooms[i - 1], b = this.rooms[i], horizontal = a.x !== b.x;
        const x = horizontal ? (a.x + b.x) / 2 : a.x, z = horizontal ? a.z : (a.z + b.z) / 2;
        for (let d = -1; d <= 1; d++) this.grid[Math.floor(z) + (horizontal ? d : 0)][Math.floor(x) + (horizontal ? 0 : d)] = 0;
        const door = new H.Door(i % 3 === 1 ? 'automatic' : 'button', x, z, horizontal ? 'x' : 'z');
        this.doors.push(door);
      }
      this.items.push(new H.HealthStation(this.rooms[3].x + 4.5, this.rooms[3].z));
      this.items.push(new H.HealthStation(this.rooms[6].x - 4.5, this.rooms[6].z));
      this.items.push(new H.Pickup('health', this.rooms[4].x + 2, this.rooms[4].z + 1));
      this.items.push(new H.Pickup('ammo', this.rooms[6].x - 2, this.rooms[6].z - 1));
      if (level === 0) {
        this.props.push({ type: 'reactor', x: this.rooms[0].x + 2, z: this.rooms[0].z + 2, solid: true });
        this.items.push(new H.Pickup('crowbar', 7, 6.5));
        this.items.push(new H.Pickup('pistol', this.rooms[3].x, this.rooms[3].z));
        this.spawn('headcrab', 1); this.spawn('zombie', 2); this.spawn('headcrab', 3, 2, -1);
        this.spawn('zombie', 4, -1, 0); this.spawn('headcrab', 4, 2, 1);
        this.spawn('zombie', 5); this.spawn('headcrab', 5, -2, 0); this.spawn('vortigaunt', 6);
        this.breakables.push(new H.Breakable('glass', this.rooms[2].x + 2, this.rooms[2].z + 1));
        const boards = new H.Breakable('boards', this.doors[3].x + 1, this.doors[3].z);
        this.breakables.push(boards);
      } else {
        this.spawn('headcrab', 1, 0, -1); this.spawn('headcrab', 1, 2, 1); this.spawn('zombie', 2); this.spawn('headcrab', 2, -2, 1);
        this.spawn('zombie', 3, 3, 0); this.spawn('vortigaunt', 4); this.spawn('zombie', 5, -1, 1); this.spawn('headcrab', 5, 2, -1); this.spawn('vortigaunt', 6);
        this.props.push({ type: 'vent', x: this.rooms[3].x, z: this.rooms[3].z, solid: false });
      }
      const last = this.rooms[7];
      const exit = new H.Interactable('exit', last.x + 4.5, last.z, level ? 'E — восстановить питание' : 'E — аварийный лифт');
      exit.interact = w => {
        if (w.level === 0 && (!w.player.pistol || !w.player.crowbar)) return w.message('Найдите монтировку и пистолет');
        if (w.enemies.some(e => e.hp > 0)) return w.message('ACCESS DENIED — устраните оставшиеся угрозы: ' + w.enemies.filter(e => e.hp > 0).length);
        if (w.level === 1 && w.wave !== 3) return w.message('AUXILIARY POWER OFFLINE');
        w.complete = true; w.hooks.transition?.();
      };
      this.items.push(exit);
      const locked = new H.Door('locked', 1.3, 9, 'x'); locked.label = 'E — служебный отсек'; this.doors.push(locked);
      this.player.x = 4; this.player.z = 6.5;
    }
    spawn(type, room, dx = 0, dz = 0) { const r = this.rooms[room]; const e = new ({ headcrab: H.Headcrab, zombie: H.Zombie, vortigaunt: H.Vortigaunt }[type])(r.x + dx, r.z + dz); e.room = room; this.enemies.push(e); return e; }
    message(text) { this.notice = text; this.noticeTime = 4; this.hooks.message?.(text); }
    sound(type) { this.hooks.sound?.(type); }
    equip(type) { if (!this.player[type]) return; this.weapons[this.player.weapon]?.unequip(); this.player.weapon = type; this.weapons[type]?.equip(); }
    wall(x, z) { return this.grid[Math.floor(z)]?.[Math.floor(x)] !== 0; }
    ceilingAt(x, z) { const vent = this.props.find(o => o.type === 'vent'); return vent && Math.abs(x - vent.x) < 1.3 && Math.abs(z - vent.z) < 4.9 ? 1.21 : 3.6; }
    extent(o) { if (o instanceof H.Door) return o.axis === 'x' ? [.48, 1.5] : [1.5, .48]; if (o.type === 'boards') return [.15, 1.5]; if (o.type === 'glass') return [.06, .45]; if (o.type === 'reactor') return [1, 1]; if (o.type === 'table') return [1, .55]; if (o.type === 'console' || o.type === 'generator') return [.8, .7]; return [.45, .45]; }
    blocked(x, z, radius = .25, actor) {
      for (const dx of [-radius, radius]) for (const dz of [-radius, radius]) if (this.wall(x + dx, z + dz)) return true;
      for (const o of [...this.doors, ...this.breakables, ...this.props]) {
        if (!o.solid) continue; const [w, d] = this.extent(o);
        if (Math.abs(x - o.x) < w + radius && Math.abs(z - o.z) < d + radius) return true;
      }
      const vent = this.props.find(o => o.type === 'vent');
      if (vent && actor === this.player && (!actor.crouch || actor.y > .28) && Math.abs(x - vent.x) < 1.3 && Math.abs(z - vent.z) < 4.9) return true;
      if (vent && actor instanceof H.Enemy && actor.type !== 'headcrab' && Math.abs(x - vent.x) < 1.6 && Math.abs(z - vent.z) < 5.2) return true;
      return false;
    }
    move(actor, dx, dz, radius) {
      const oldX = actor.x, oldZ = actor.z;
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .15));
      for (let i = 0; i < steps; i++) { if (!this.blocked(actor.x + dx / steps, actor.z, radius, actor)) actor.x += dx / steps; if (!this.blocked(actor.x, actor.z + dz / steps, radius, actor)) actor.z += dz / steps; }
      return Math.hypot(actor.x - oldX, actor.z - oldZ) > .0001;
    }
    visible(a, b) { const distance = H.distance(a, b); for (let s = .2; s < distance; s += .2) { const t = s / distance; if (this.blocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t, 0)) return false; } return true; }
    navigate(a, b) {
      const key = (x, z) => z * this.size + x, start = key(Math.floor(a.x), Math.floor(a.z)), goal = key(Math.floor(b.x), Math.floor(b.z));
      const queue = [start], previous = new Map([[start, null]]);
      for (let i = 0; i < queue.length; i++) {
        const n = queue[i]; if (n === goal) break; const x = n % this.size, z = Math.floor(n / this.size);
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, nz = z + dz, k = key(nx, nz); if (nx < 0 || nz < 0 || nx >= this.size || nz >= this.size || previous.has(k) || this.blocked(nx + .5, nz + .5, .3, a)) continue; previous.set(k, n); queue.push(k); }
      }
      if (!previous.has(goal)) return []; const result = []; let n = goal;
      while (n !== start) { result.push({ x: n % this.size + .5, z: Math.floor(n / this.size) + .5 }); n = previous.get(n); } return result.reverse();
    }
    trace(range, attack = false, spread = 0) {
      const p = this.player, yaw = p.yaw + spread, eye = p.y + (p.crouch ? .85 : 1.6);
      const objects = attack ? [...this.enemies.filter(e => e.hp > 0), ...this.breakables.filter(b => !b.broken)] : [...this.items.filter(o => !o.used), ...this.doors];
      for (let t = 0; t <= range; t += .045) {
        const x = p.x + Math.cos(yaw) * Math.cos(p.pitch) * t, z = p.z + Math.sin(yaw) * Math.cos(p.pitch) * t, y = eye + Math.sin(p.pitch) * t;
        if (this.wall(x, z) || y < 0 || y > 3.6) return null;
        for (const o of objects) {
          const [w, d] = o instanceof H.Door || o instanceof H.Breakable ? this.extent(o) : [.48, .48];
          const top = o.type === 'headcrab' ? .65 + o.y : o.type === 'crate' ? 1 : o instanceof H.Enemy ? 1.9 : 2.7;
          if (Math.abs(x - o.x) < w && Math.abs(z - o.z) < d && (!attack || y <= top)) return o;
        }
        if (this.blocked(x, z, 0)) return null;
      } return null;
    }
    alert() { for (const e of this.enemies) if (H.distance(e, this.player) < 10 && this.visible(e, this.player)) e.lastSeen = { x: this.player.x, z: this.player.z }; }
    action(a) {
      if (a.type === 'ShowMessage') this.message(a.text);
      if (a.type === 'PlaySound') this.sound(a.sound);
      if (a.type === 'SpawnEnemy') this.spawn(a.enemy, a.room, a.dx || 0, a.dz || 0);
      if (a.type === 'OpenDoor') this.doors[a.index]?.interact(this);
      if (a.type === 'LightFlicker') this.flicker = 2;
      if (a.type === 'MoveObject') Object.assign(this.props[a.index], a.position);
      if (a.type === 'Explosion') { this.sound('explosion'); for (let i = 0; i < 16; i++) this.particles.push({ x: a.x + this.random(), z: a.z + this.random(), y: 1 + this.random(), life: 1, color: [1, .5, .08] }); }
    }
    step(input, dt) {
      if (this.complete || this.player.hp <= 0) return;
      this.time += dt; this.noticeTime = Math.max(0, (this.noticeTime || 0) - dt); this.flicker = Math.max(0, (this.flicker || 0) - dt);
      this.player.step(this, input, dt); Object.values(this.weapons).forEach(w => w.step(this.player, dt));
      this.doors.forEach(d => d.step(this, dt)); this.breakables.forEach(b => b.step(this));
      this.items.forEach(o => { if (o instanceof H.Pickup && H.distance(o, this.player) < .85) o.interact(this); });
      this.triggers.forEach(t => t.step(this));
      this.room = this.rooms.findIndex(r => Math.abs(r.x - this.player.x) < 5.8 && Math.abs(r.z - this.player.z) < 5.8);
      if (this.room >= 0) this.visited.add(this.room);
      if (this.level === 1 && this.room === 7 && !this.wave && H.distance(this.player, this.rooms[7]) < 4.5) {
        this.wave = 1; const door = this.doors[6]; door.open = false; door.solid = true; door.arenaLock = true;
        this.spawn('headcrab', 7, -2, -2); this.spawn('headcrab', 7, 2, 2); this.spawn('zombie', 7, 2, -2); this.message('CONTAINMENT LOCKDOWN — WAVE 01'); this.sound('alarm');
      }
      if (this.wave > 0 && this.wave < 3 && !this.enemies.some(e => e.room === 7 && e.hp > 0)) {
        this.wave++;
        if (this.wave === 2) { this.spawn('vortigaunt', 7, -2, -2); this.spawn('vortigaunt', 7, 2, 2); this.message('ELECTRICAL SURGE — WAVE 02'); this.items.push(new H.Pickup('ammo', this.rooms[7].x, this.rooms[7].z), new H.Pickup('health', this.rooms[7].x - 1, this.rooms[7].z)); }
        else { this.doors[6].arenaLock = false; this.doors[6].interact(this); this.message('Питание готово. Активируйте зелёный терминал [E].'); }
      }
      this.enemies.forEach(e => e.step(this, dt));
      this.target = this.trace(2.6);
      if (input.KeyE && this.target) { if (this.target instanceof H.HealthStation) this.target.interact(this, dt); else if (!this.eHeld) this.target.interact(this); }
      this.eHeld = !!input.KeyE;
      this.particles.forEach(p => { p.life -= dt; p.y = Math.max(.04, p.y - dt); }); this.particles = this.particles.filter(p => p.life > 0);
      if ((input.KeyW || input.KeyS || input.KeyA || input.KeyD) && !this.player.y && this.time > (this.nextStep || 0)) { this.sound('step'); this.nextStep = this.time + (input.ShiftLeft ? .29 : .43); }
    }
  }
  H.World = World;
})(globalThis.HL98 = globalThis.HL98 || {});
