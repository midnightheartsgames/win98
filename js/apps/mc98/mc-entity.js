(function (M) {
  'use strict';
  const B = M.BLOCKS;
  const GRAVITY = 32, TERMINAL = 78;

  const humanoid = (tex, extra) => Object.assign({
    parts: [
      { box: [-4, 24, -4, 4, 32, 4], tex: { side: tex + '_head', top: tex + '_head', bottom: tex + '_head', face: tex + '_face' }, swing: 'head' },
      { box: [-4, 12, -2, 4, 24, 2], tex: { side: tex + '_body', top: tex + '_body', bottom: tex + '_body' } },
      { box: [4, 12, -2, 8, 24, 2], tex: { side: tex + '_arm' }, pivot: [6, 22, 0], swing: 'armR' },
      { box: [-8, 12, -2, -4, 24, 2], tex: { side: tex + '_arm' }, pivot: [-6, 22, 0], swing: 'armL' },
      { box: [0, 0, -2, 4, 12, 2], tex: { side: tex + '_leg' }, pivot: [2, 12, 0], swing: 'legR' },
      { box: [-4, 0, -2, 0, 12, 2], tex: { side: tex + '_leg' }, pivot: [-2, 12, 0], swing: 'legL' }
    ]
  }, extra || {});
  const quadruped = (tex, legH, bodyH, bodyLen, headSize) => ({
    parts: [
      { box: [-5, legH, -bodyLen / 2, 5, legH + bodyH, bodyLen / 2], tex: { side: tex + '_body', top: tex + '_body', bottom: tex + '_body' } },
      { box: [-headSize / 2, legH + bodyH - headSize + 2, -bodyLen / 2 - headSize, headSize / 2, legH + bodyH + 2, -bodyLen / 2], tex: { side: tex + '_head', top: tex + '_head', bottom: tex + '_head', face: tex + '_face' }, swing: 'head' },
      { box: [1, 0, -bodyLen / 2 + 1, 5, legH, -bodyLen / 2 + 5], tex: { side: tex + '_leg' }, pivot: [3, legH, -bodyLen / 2 + 3], swing: 'legR' },
      { box: [-5, 0, -bodyLen / 2 + 1, -1, legH, -bodyLen / 2 + 5], tex: { side: tex + '_leg' }, pivot: [-3, legH, -bodyLen / 2 + 3], swing: 'legL' },
      { box: [1, 0, bodyLen / 2 - 5, 5, legH, bodyLen / 2 - 1], tex: { side: tex + '_leg' }, pivot: [3, legH, bodyLen / 2 - 3], swing: 'legL' },
      { box: [-5, 0, bodyLen / 2 - 5, -1, legH, bodyLen / 2 - 1], tex: { side: tex + '_leg' }, pivot: [-3, legH, bodyLen / 2 - 3], swing: 'legR' }
    ]
  });

  const MOBS = {
    pig: { w: 0.45, h: 0.9, hp: 10, speed: 1.1, hostile: false, drops: [['porkchop', 1, 3]], model: quadruped('pig', 6, 8, 16, 8), sound: 'pig' },
    cow: { w: 0.45, h: 1.3, hp: 10, speed: 1.0, hostile: false, drops: [['beef', 1, 3], ['leather', 0, 2]], model: quadruped('cow', 12, 8, 16, 8), sound: 'cow' },
    sheep: { w: 0.45, h: 1.3, hp: 8, speed: 1.0, hostile: false, drops: [['wool', 1, 1]], model: quadruped('sheep', 12, 8, 16, 7), sound: 'sheep' },
    chicken: { w: 0.2, h: 0.7, hp: 4, speed: 1.2, hostile: false, drops: [['chicken', 1, 1], ['feather', 0, 2]], glide: true, model: { parts: [
      { box: [-3, 5, -4, 3, 11, 4], tex: { side: 'chicken_body', top: 'chicken_body', bottom: 'chicken_body' } },
      { box: [-2, 9, -7, 2, 15, -4], tex: { side: 'chicken_head', top: 'chicken_head', bottom: 'chicken_head', face: 'chicken_face' }, swing: 'head' },
      { box: [-1, 0, -1, 1, 5, 1], tex: { side: 'chicken_leg' }, pivot: [0, 5, 0], swing: 'legR' },
      { box: [-4, 7, -3, -3, 11, 3], tex: { side: 'chicken_body' }, pivot: [-3, 11, 0], swing: 'wingL' },
      { box: [3, 7, -3, 4, 11, 3], tex: { side: 'chicken_body' }, pivot: [3, 11, 0], swing: 'wingR' }
    ] }, sound: 'chicken' },
    zombie: { w: 0.3, h: 1.8, hp: 20, speed: 2.2, hostile: true, attack: 4, reach: 1.7, burns: true, drops: [['feather', 0, 2]], model: humanoid('zombie', { zombieArms: true }), sound: 'zombie' },
    skeleton: { w: 0.3, h: 1.8, hp: 20, speed: 2.4, hostile: true, attack: 3, ranged: true, burns: true, drops: [['arrow', 0, 2], ['bone', 0, 2]], model: humanoid('skeleton'), sound: 'skeleton' },
    creeper: { w: 0.3, h: 1.7, hp: 20, speed: 2.1, hostile: true, explodes: true, drops: [['gunpowder', 0, 2]], model: { parts: [
      { box: [-4, 18, -4, 4, 26, 4], tex: { side: 'creeper_head', top: 'creeper_head', bottom: 'creeper_head', face: 'creeper_face' }, swing: 'head' },
      { box: [-4, 6, -2, 4, 18, 2], tex: { side: 'creeper_body', top: 'creeper_body', bottom: 'creeper_body' } },
      { box: [-4, 0, -6, 0, 6, -2], tex: { side: 'creeper_leg' }, pivot: [-2, 6, -4], swing: 'legL' },
      { box: [0, 0, -6, 4, 6, -2], tex: { side: 'creeper_leg' }, pivot: [2, 6, -4], swing: 'legR' },
      { box: [-4, 0, 2, 0, 6, 6], tex: { side: 'creeper_leg' }, pivot: [-2, 6, 4], swing: 'legR' },
      { box: [0, 0, 2, 4, 6, 6], tex: { side: 'creeper_leg' }, pivot: [2, 6, 4], swing: 'legL' }
    ] }, sound: 'creeper' },
    spider: { w: 0.7, h: 0.9, hp: 16, speed: 2.9, hostile: true, attack: 2, reach: 1.9, neutralInDay: true, drops: [['string', 0, 2]], model: { parts: [
      { box: [-5, 3, -3, 5, 11, 9], tex: { side: 'spider_body', top: 'spider_body', bottom: 'spider_body' } },
      { box: [-4, 4, -11, 4, 12, -3], tex: { side: 'spider_head', top: 'spider_head', bottom: 'spider_head', face: 'spider_face' }, swing: 'head' },
      { box: [5, 6, -6, 13, 8, -4], tex: { side: 'spider_leg' }, pivot: [5, 7, -5], swing: 'legR' }, { box: [5, 6, -2, 13, 8, 0], tex: { side: 'spider_leg' }, pivot: [5, 7, -1], swing: 'legL' },
      { box: [5, 6, 2, 13, 8, 4], tex: { side: 'spider_leg' }, pivot: [5, 7, 3], swing: 'legR' }, { box: [5, 6, 6, 13, 8, 8], tex: { side: 'spider_leg' }, pivot: [5, 7, 7], swing: 'legL' },
      { box: [-13, 6, -6, -5, 8, -4], tex: { side: 'spider_leg' }, pivot: [-5, 7, -5], swing: 'legL' }, { box: [-13, 6, -2, -5, 8, 0], tex: { side: 'spider_leg' }, pivot: [-5, 7, -1], swing: 'legR' },
      { box: [-13, 6, 2, -5, 8, 4], tex: { side: 'spider_leg' }, pivot: [-5, 7, 3], swing: 'legL' }, { box: [-13, 6, 6, -5, 8, 8], tex: { side: 'spider_leg' }, pivot: [-5, 7, 7], swing: 'legR' }
    ] }, sound: 'spider' }
  };
  const PLAYER_MODEL = humanoid('player');

  class Entity {
    constructor(x, y, z, w, h) {
      this.x = x; this.y = y; this.z = z; this.w = w; this.h = h;
      this.vx = 0; this.vy = 0; this.vz = 0; this.yaw = 0; this.pitch = 0;
      this.onGround = false; this.inWater = false; this.inLava = false; this.dead = false; this.age = 0; this.blockedH = false;
      this.fallStart = null; this.id = Entity.nextId++;
    }
    aabb() { return [this.x - this.w, this.y, this.z - this.w, this.x + this.w, this.y + this.h, this.z + this.w]; }
    moveAxis(world, axis, d) {
      if (d === 0) return 0;
      const box = this.aabb(), e = box.slice();
      if (d < 0) e[axis] += d; else e[axis + 3] += d;
      const cols = world.collidersIn(e[0], e[1], e[2], e[3], e[4], e[5]);
      const a1 = (axis + 1) % 3, a2 = (axis + 2) % 3;
      for (const c of cols) {
        if (box[a1 + 3] <= c[a1] || box[a1] >= c[a1 + 3] || box[a2 + 3] <= c[a2] || box[a2] >= c[a2 + 3]) continue;
        if (d > 0 && box[axis + 3] <= c[axis]) d = Math.min(d, c[axis] - box[axis + 3] - 1e-5);
        else if (d < 0 && box[axis] >= c[axis + 3]) d = Math.max(d, c[axis + 3] - box[axis] + 1e-5);
      }
      if (axis === 0) this.x += d; else if (axis === 1) this.y += d; else this.z += d;
      return d;
    }
    physics(world, dt, o = {}) {
      const feet = world.liquidAt(this.x, this.y + 0.1, this.z), head = world.liquidAt(this.x, this.y + this.h * 0.8, this.z);
      this.inWater = feet === 8 || head === 8; this.inLava = feet === 9 || head === 9;
      const inLiquid = this.inWater || this.inLava;
      const climbing = o.climb && B[world.getBlock(Math.floor(this.x), Math.floor(this.y + 0.5), Math.floor(this.z))].climb;
      if (!o.noGravity) {
        if (inLiquid) { this.vy -= GRAVITY * 0.15 * dt; this.vy = Math.max(this.vy, -3); }
        else if (climbing) { this.vy = Math.max(this.vy, -2.5); }
        else if (o.glide && this.vy < 0) this.vy = Math.max(this.vy - GRAVITY * dt, -2.5);
        else this.vy = Math.max(this.vy - GRAVITY * dt, -TERMINAL);
      }
      const wasGround = this.onGround;
      const dx = this.vx * dt, dy = this.vy * dt, dz = this.vz * dt;
      const mx = this.moveAxis(world, 0, dx), mz = this.moveAxis(world, 2, dz);
      const my = this.moveAxis(world, 1, dy);
      this.blockedH = (Math.abs(mx - dx) > 1e-4) || (Math.abs(mz - dz) > 1e-4);
      this.onGround = dy < 0 && my > dy + 1e-6;
      if (my !== dy) this.vy = 0;
      if (this.onGround) {
        if (this.fallStart != null && !inLiquid) { const f = this.fallStart - this.y; this.fallStart = null; if (f > 3.1 && !o.noFall) this.fallDamage = f - 3; }
      } else if (this.vy < 0 && this.fallStart == null) this.fallStart = this.y;
      if (inLiquid || climbing) this.fallStart = null;
      if (this.vy > 0 && this.fallStart != null && this.y > this.fallStart) this.fallStart = this.y;
      if (o.step && this.blockedH && (this.onGround || wasGround || inLiquid) && this.vy <= 0.01) this.vy = inLiquid ? 3 : 9.5;
      const drag = inLiquid ? 0.7 : (this.onGround ? 0.55 : 0.9);
      this.vx *= Math.pow(drag, dt * 10); this.vz *= Math.pow(drag, dt * 10);
      this.age += dt;
    }
    distTo(e) { return Math.hypot(e.x - this.x, e.z - this.z); }
  }
  Entity.nextId = 1;

  class Mob extends Entity {
    constructor(type, x, y, z) {
      const d = MOBS[type];
      super(x, y, z, d.w, d.h);
      this.type = type; this.def = d; this.hp = d.hp; this.maxHp = d.hp;
      this.wanderT = 0; this.tx = null; this.tz = null; this.walk = 0; this.hurtT = 0; this.attackCd = 0; this.fuse = 0; this.burning = 0;
      this.fleeT = 0; this.angry = false; this.deathT = 0; this.soundT = 3 + Math.random() * 10; this.persistent = false; this.eggT = 200 + Math.random() * 300;
    }
    hostileNow(game) {
      if (!this.def.hostile) return false;
      if (this.def.neutralInDay && !this.angry) { const l = game.lightAt(this.x, this.y + 0.5, this.z); return l < 8; }
      return true;
    }
    ai(game, dt) {
      const p = game.player, w = game.world;
      if (this.hp <= 0) { this.deathT += dt; if (this.deathT > 0.9) this.dead = true; this.vx = this.vz = 0; return; }
      this.hurtT = Math.max(0, this.hurtT - dt); this.attackCd = Math.max(0, this.attackCd - dt); this.fleeT = Math.max(0, this.fleeT - dt);
      const dist = this.distTo(p), hostile = this.hostileNow(game);
      let dirX = 0, dirZ = 0, speed = this.def.speed;
      let want = false;
      if (this.fleeT > 0) { const ang = Math.atan2(this.z - p.z, this.x - p.x); dirX = Math.cos(ang); dirZ = Math.sin(ang); speed *= 1.6; want = true; }
      else if (hostile && dist < 16 && !p.dead && game.difficulty > 0) {
        const dx = p.x - this.x, dz = p.z - this.z, len = Math.hypot(dx, dz) || 1;
        if (this.def.ranged) {
          if (dist > 10) { dirX = dx / len; dirZ = dz / len; want = true; }
          else if (dist < 5) { dirX = -dx / len; dirZ = -dz / len; want = true; }
          this.yaw = Math.atan2(-dx, -dz);
          if (this.attackCd <= 0 && dist < 14 && game.canSee(this.x, this.y + 1.5, this.z, p.x, p.y + 1.4, p.z)) { game.shootArrow(this, p); this.attackCd = 1.6 + Math.random() * 0.6; }
        } else if (this.def.explodes) {
          if (dist < 3) { this.fuse += dt; if (this.fuse > 1.5) { game.explode(this.x, this.y + 0.5, this.z, 3, this); this.dead = true; return; } }
          else { this.fuse = Math.max(0, this.fuse - dt * 2); dirX = dx / len; dirZ = dz / len; want = true; }
          if (dist < 7 && this.fuse === 0 && dist > 3 && Math.random() < 0.02 * dt * 20) game.sound('creeper_hiss', this.x, this.y, this.z);
        } else {
          dirX = dx / len; dirZ = dz / len; want = dist > (this.def.reach || 1.7) * 0.8;
          if (dist <= (this.def.reach || 1.7) && Math.abs(p.y - this.y) < 2 && this.attackCd <= 0) { game.damagePlayer(this.def.attack, 'mob', this); this.attackCd = 1; }
        }
      } else {
        this.wanderT -= dt;
        if (this.wanderT <= 0) { this.wanderT = 2 + Math.random() * 6; if (Math.random() < 0.65) { const a = Math.random() * M.TAU; this.tx = this.x + Math.cos(a) * (3 + Math.random() * 6); this.tz = this.z + Math.sin(a) * (3 + Math.random() * 6); } else this.tx = null; }
        if (this.tx != null) { const dx = this.tx - this.x, dz = this.tz - this.z, len = Math.hypot(dx, dz); if (len < 0.7) this.tx = null; else { dirX = dx / len; dirZ = dz / len; want = true; speed *= 0.55; } }
        if (this.def.explodes) this.fuse = Math.max(0, this.fuse - dt * 2);
      }
      if (want) {
        const ahead = w.getBlock(Math.floor(this.x + dirX * 1.2), Math.floor(this.y - 0.6), Math.floor(this.z + dirZ * 1.2));
        const dropAhead = ahead === 0 && w.getBlock(Math.floor(this.x + dirX * 1.2), Math.floor(this.y - 2.6), Math.floor(this.z + dirZ * 1.2)) === 0;
        if (dropAhead && !hostile) { this.tx = null; want = false; }
      }
      if (want) { this.vx += (dirX * speed - this.vx) * Math.min(1, dt * 8); this.vz += (dirZ * speed - this.vz) * Math.min(1, dt * 8); this.yaw = Math.atan2(-dirX, -dirZ); }
      this.physics(w, dt, { step: true, glide: this.def.glide });
      if (this.fallDamage) { game.damageMob(this, Math.round(this.fallDamage), 'fall'); this.fallDamage = 0; }
      if (this.inLava) { if (Math.random() < dt * 4) game.damageMob(this, 4, 'lava'); this.burning = 4; }
      if (this.burning > 0) { this.burning -= dt; if (Math.random() < dt) game.damageMob(this, 1, 'fire'); if (this.inWater) this.burning = 0; }
      if (this.def.burns && game.isDay() && !this.inWater && w.getSky(Math.floor(this.x), Math.floor(this.y + this.h), Math.floor(this.z)) >= 15) this.burning = Math.max(this.burning, 1);
      const sp = Math.hypot(this.vx, this.vz);
      this.walk += sp * dt * 3;
      this.soundT -= dt;
      if (this.soundT <= 0) { this.soundT = 4 + Math.random() * 12; if (dist < 20) game.sound(this.def.sound, this.x, this.y, this.z); }
      if (this.type === 'chicken') { this.eggT -= dt; if (this.eggT <= 0) { this.eggT = 300 + Math.random() * 300; game.dropItem(this.x, this.y, this.z, { id: M.ITEM_BY_KEY.egg.id, count: 1 }); } }
      if (this.y < -8) this.dead = true;
    }
  }

  class ItemEntity extends Entity {
    constructor(x, y, z, stack) { super(x, y, z, 0.125, 0.25); this.stack = stack; this.pickupDelay = 0.5; this.life = 300; this.spin = Math.random() * M.TAU; }
    tick(game, dt) {
      this.physics(game.world, dt, { noFall: true });
      if (this.inWater) this.vy = Math.max(this.vy, 1.5);
      if (this.inLava) { this.dead = true; return; }
      this.pickupDelay -= dt; this.life -= dt; this.spin += dt * 2;
      if (this.life <= 0 || this.y < -8) this.dead = true;
    }
  }

  class Arrow extends Entity {
    constructor(x, y, z, vx, vy, vz, owner) { super(x, y, z, 0.1, 0.2); this.vx = vx; this.vy = vy; this.vz = vz; this.owner = owner; this.stuck = false; this.life = 60; this.damage = 4; }
    tick(game, dt) {
      this.life -= dt; if (this.life <= 0) { this.dead = true; return; }
      if (this.stuck) return;
      const nx = this.x + this.vx * dt, ny = this.y + this.vy * dt, nz = this.z + this.vz * dt;
      const len = Math.hypot(this.vx, this.vy, this.vz);
      const hit = game.world.raycast(this.x, this.y, this.z, this.vx / len, this.vy / len, this.vz / len, len * dt + 0.05);
      if (hit) { this.x = hit.px; this.y = hit.py; this.z = hit.pz; this.stuck = true; this.life = 20; game.sound('arrow_hit', this.x, this.y, this.z); return; }
      const target = game.hitEntityOnSegment(this.x, this.y, this.z, nx, ny, nz, this.owner);
      if (target) { game.arrowHit(this, target); this.dead = true; return; }
      this.x = nx; this.y = ny; this.z = nz; this.vy -= GRAVITY * 0.6 * dt;
      this.vx *= 0.999; this.vz *= 0.999;
      this.yaw = Math.atan2(-this.vx, -this.vz); this.pitch = Math.atan2(this.vy, Math.hypot(this.vx, this.vz));
      if (this.y < -8) this.dead = true;
    }
  }

  class FallingBlock extends Entity {
    constructor(x, y, z, id) { super(x + 0.5, y, z + 0.5, 0.49, 0.98); this.block = id; }
    tick(game, dt) {
      this.physics(game.world, dt, { noFall: true });
      if (this.onGround || this.age > 30) {
        const bx = Math.floor(this.x), by = Math.round(this.y), bz = Math.floor(this.z);
        const cur = game.world.getBlock(bx, by, bz);
        if (cur === 0 || B[cur].replaceable) game.world.setBlock(bx, by, bz, this.block);
        else game.dropItem(this.x, this.y, this.z, { id: this.block, count: 1 });
        this.dead = true;
      }
    }
  }

  class PrimedTnt extends Entity {
    constructor(x, y, z) { super(x + 0.5, y, z + 0.5, 0.49, 0.98); this.fuse = 4; this.vy = 4; this.vx = (Math.random() - 0.5) * 2; this.vz = (Math.random() - 0.5) * 2; }
    tick(game, dt) {
      this.physics(game.world, dt, { noFall: true });
      this.fuse -= dt;
      if (this.fuse <= 0) { this.dead = true; game.explode(this.x, this.y + 0.5, this.z, 4, null); }
    }
  }

  Object.assign(M, { Entity, Mob, ItemEntity, Arrow, FallingBlock, PrimedTnt, MOBS, PLAYER_MODEL, GRAVITY });
})(globalThis.Mc98 = globalThis.Mc98 || {});
