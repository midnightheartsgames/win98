(function (H) {
  'use strict';

  const GIB_COLORS = {
    wood: [[0.55, 0.4, 0.22], [0.45, 0.32, 0.18]],
    glass: [[0.7, 0.85, 0.9], [0.55, 0.7, 0.75]],
    melon: [[0.3, 0.6, 0.2], [0.85, 0.2, 0.2]],
    metal: [[0.5, 0.5, 0.52], [0.35, 0.36, 0.38]],
    concrete: [[0.6, 0.6, 0.58], [0.45, 0.45, 0.44]],
    flesh: [[0.55, 0.08, 0.05], [0.4, 0.05, 0.03]],
    alien: [[0.8, 0.75, 0.1], [0.6, 0.55, 0.05]]
  };

  class Fx {
    constructor(game) {
      this.game = game;
      this.parts = [];
      this.decals = [];
      this.beams = [];
      this.rng = H.rng(game.seed ^ 0x55aa);
      this.decalVersion = 0;
    }
    add(p) {
      if (this.parts.length > 700) this.parts.shift();
      this.parts.push(Object.assign({ t: 0, life: 1, size: 0.1, grow: 0, vel: { x: 0, y: 0, z: 0 }, grav: 0, col: [1, 1, 1], alpha: 1, blend: 'add', drag: 0, bounce: false }, p));
    }
    spark(pos, n = 8, col = [1, 0.85, 0.4]) {
      const r = this.rng;
      for (let i = 0; i < n; i++) {
        this.add({ pos: H.vcopy(pos), vel: { x: r.range(-4, 4), y: r.range(0.5, 5), z: r.range(-4, 4) }, grav: 14, life: r.range(0.2, 0.5), size: 0.035, col, blend: 'add', streak: true });
      }
    }
    impact(pos, n, mat) {
      const m = H.MATERIALS[mat] ? H.MATERIALS[mat].impact : mat;
      const r = this.rng;
      if (m === 'metal') this.spark(pos, 6);
      else if (m === 'water') this.splash(pos, 0.6);
      else if (m === 'flesh') this.blood(pos, n, 'red');
      const dust = m === 'wood' ? [0.5, 0.4, 0.28] : m === 'dirt' ? [0.45, 0.38, 0.28] : [0.62, 0.62, 0.6];
      if (m !== 'water' && m !== 'flesh') {
        for (let i = 0; i < 4; i++) {
          this.add({ pos: H.vadd(pos, n, 0.05), vel: { x: n.x * r.range(0.4, 1.4) + r.range(-0.5, 0.5), y: n.y * r.range(0.4, 1.4) + r.range(0, 0.6), z: n.z * r.range(0.4, 1.4) + r.range(-0.5, 0.5) }, grav: 1.2, life: r.range(0.4, 0.9), size: 0.08, grow: 0.35, col: dust, alpha: 0.7, blend: 'alpha', drag: 2 });
        }
        for (let i = 0; i < 3; i++) {
          this.add({ pos: H.vadd(pos, n, 0.03), vel: { x: n.x * 3 + r.range(-2, 2), y: n.y * 3 + r.range(0, 3), z: n.z * 3 + r.range(-2, 2) }, grav: 12, life: 0.6, size: 0.03, col: [dust[0] * 0.6, dust[1] * 0.6, dust[2] * 0.6], blend: 'alpha', bounce: true });
        }
      }
      if (m !== 'water') this.decal(pos, n, m === 'flesh' ? 'blood' : 'bullet');
    }
    blood(pos, dir, kind = 'red') {
      const r = this.rng;
      const col = kind === 'yellow' ? [0.75, 0.7, 0.1] : [0.55, 0.02, 0.02];
      for (let i = 0; i < 8; i++) {
        this.add({ pos: H.vcopy(pos), vel: { x: (dir ? dir.x * 2 : 0) + r.range(-1.5, 1.5), y: r.range(0.2, 2.5), z: (dir ? dir.z * 2 : 0) + r.range(-1.5, 1.5) }, grav: 9, life: r.range(0.3, 0.7), size: r.range(0.04, 0.09), grow: 0.1, col, alpha: 0.9, blend: 'alpha' });
      }
      const w = this.game.world;
      const d = w.raycast({ x: pos.x, y: pos.y + 0.1, z: pos.z }, { x: 0, y: -1, z: 0 }, 3);
      if (d) this.decal(d.point, d.n, kind === 'yellow' ? 'alienblood' : 'blood');
    }
    splash(pos, s = 1) {
      const r = this.rng;
      for (let i = 0; i < 10 * s; i++) {
        this.add({ pos: H.vcopy(pos), vel: { x: r.range(-1.2, 1.2) * s, y: r.range(1.5, 4) * s, z: r.range(-1.2, 1.2) * s }, grav: 12, life: r.range(0.4, 0.8), size: 0.06 * s, grow: 0.1, col: [0.75, 0.85, 0.9], alpha: 0.7, blend: 'alpha' });
      }
    }
    smoke(pos, n = 1, col = [0.3, 0.3, 0.3], size = 0.6) {
      const r = this.rng;
      for (let i = 0; i < n; i++) {
        this.add({ pos: { x: pos.x + r.range(-0.2, 0.2), y: pos.y, z: pos.z + r.range(-0.2, 0.2) }, vel: { x: r.range(-0.3, 0.3), y: r.range(0.6, 1.4), z: r.range(-0.3, 0.3) }, grav: -0.2, life: r.range(1.5, 3), size, grow: 1.0, col, alpha: 0.5, blend: 'alpha', drag: 0.6 });
      }
    }
    fire(pos, s = 1) {
      const r = this.rng;
      this.add({ pos: { x: pos.x + r.range(-0.25, 0.25) * s, y: pos.y, z: pos.z + r.range(-0.25, 0.25) * s }, vel: { x: 0, y: r.range(1, 2), z: 0 }, life: r.range(0.3, 0.6), size: 0.25 * s, grow: -0.2, col: [1, r.range(0.4, 0.7), 0.15], blend: 'add' });
    }
    explosion(pos, radius) {
      const r = this.rng;
      for (let i = 0; i < 26; i++) {
        const d = H.vnorm({ x: r.range(-1, 1), y: r.range(-0.2, 1), z: r.range(-1, 1) });
        this.add({ pos: H.vcopy(pos), vel: H.vscale(d, r.range(2, 7) * radius / 5), drag: 3, life: r.range(0.35, 0.8), size: r.range(0.5, 1.1) * radius / 5, grow: 1.4, col: [1, r.range(0.5, 0.8), 0.2], blend: 'add' });
      }
      for (let i = 0; i < 12; i++) {
        this.add({ pos: { x: pos.x + r.range(-1, 1), y: pos.y + r.range(0, 1), z: pos.z + r.range(-1, 1) }, vel: { x: r.range(-1, 1), y: r.range(1, 3), z: r.range(-1, 1) }, drag: 1, life: r.range(1.5, 3.5), size: r.range(0.8, 1.4) * radius / 5, grow: 1.2, col: [0.18, 0.17, 0.16], alpha: 0.7, blend: 'alpha' });
      }
      this.spark(pos, 18, [1, 0.7, 0.3]);
      const w = this.game.world;
      const d = w.raycast({ x: pos.x, y: pos.y + 0.2, z: pos.z }, { x: 0, y: -1, z: 0 }, radius);
      if (d) this.decal(d.point, d.n, 'scorch');
    }
    gibs(pos, kind, half) {
      const r = this.rng;
      const cols = GIB_COLORS[kind] || GIB_COLORS.wood;
      const n = kind === 'glass' ? 14 : 10;
      for (let i = 0; i < n; i++) {
        this.add({ pos: { x: pos.x + r.range(-half.x, half.x), y: pos.y + r.range(-half.y, half.y), z: pos.z + r.range(-half.z, half.z) }, vel: { x: r.range(-3, 3), y: r.range(1, 5), z: r.range(-3, 3) }, grav: 14, life: r.range(1.5, 3), size: r.range(0.06, 0.16), col: r.pick(cols), blend: 'solid', bounce: true, chunk: true });
      }
    }
    tracer(from, to, col = [1, 0.9, 0.6]) {
      this.beams.push({ a: H.vcopy(from), b: H.vcopy(to), t: 0, life: Math.max(0.05, H.dist(from, to) / 280), width: 0.02, col });
    }
    beam(from, to, col, width = 0.08, life = 0.25) {
      this.beams.push({ a: H.vcopy(from), b: H.vcopy(to), t: 0, life, width, col, jag: true });
    }
    muzzle(pos, col = [1, 0.8, 0.4], size = 0.35) {
      this.add({ pos: H.vcopy(pos), life: 0.05, size, col, blend: 'add' });
    }
    decal(pos, n, kind) {
      if (!n) return;
      if (this.decals.length > 220) this.decals.shift();
      const size = kind === 'scorch' ? 1.6 : kind === 'blood' || kind === 'alienblood' ? 0.5 : 0.1;
      this.decals.push({ pos: H.vadd(pos, n, 0.012), n: H.vcopy(n), kind, size, rot: this.rng() * 6.28 });
      this.decalVersion++;
    }
    step(dt) {
      const w = this.game.world;
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.t += dt;
        if (p.t >= p.life) { this.parts.splice(i, 1); continue; }
        p.vel.y -= p.grav * dt;
        if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vel.x *= k; p.vel.y *= k; p.vel.z *= k; }
        p.pos.x += p.vel.x * dt; p.pos.y += p.vel.y * dt; p.pos.z += p.vel.z * dt;
        p.size = Math.max(0.005, p.size + p.grow * dt);
        if (p.bounce) {
          const g = w.surfaceAt(p.pos.x, p.pos.z, p.pos.y + 0.3, 0);
          if (p.pos.y < g) { p.pos.y = g; p.vel.y = -p.vel.y * 0.3; p.vel.x *= 0.6; p.vel.z *= 0.6; }
        }
      }
      for (let i = this.beams.length - 1; i >= 0; i--) {
        const b = this.beams[i];
        b.t += dt;
        if (b.t >= b.life) this.beams.splice(i, 1);
      }
    }
  }

  H.Fx = Fx;
  if (typeof module !== 'undefined') module.exports = H;
})(globalThis.Hl2 = globalThis.Hl2 || {});
