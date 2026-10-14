(function (Q) {
  'use strict';
  const WP = Q.WP;

  class FX {
    constructor(world, opts) {
      this.world = world;
      this.opts = opts || {};
      this.parts = [];
      this.marks = [];
      this.trails = [];
      this.lights = [];
      this.gibs = [];
      this.bolts = new Map();
      this.time = 0;
      this.rnd = Q.rng(12345);
      this.faceMap = new Map();
      if (world) for (const f of world.faces) this.faceMap.set(f.brush * 256 + f.plane, f);
      this.batches = {};
    }

    batch(tex, blend, offset) {
      const k = tex + '|' + blend + (offset ? '|o' : '');
      if (!this.batches[k]) this.batches[k] = new Q.SpriteBatch(tex, blend, offset);
      return this.batches[k];
    }

    part(o) {
      if (this.parts.length > 1400) this.parts.shift();
      this.parts.push(Object.assign({ age: 0, life: 1, size: 8, size1: null, col: [1, 1, 1, 1], col1: null, vel: [0, 0, 0], grav: 0, drag: 0, tex: 'flare', blend: 'add', rot: 0, rotv: 0 }, o));
    }

    light(pos, r, col, life) {
      this.lights.push({ pos: pos.slice(), r, col, life, age: 0 });
      if (this.lights.length > 40) this.lights.shift();
    }

    mark(pos, n, size, tex, col, blend, life, rot) {
      if (this.opts.marks === false) return;
      const t = this.world.trace(Q.vma(pos, 2, n), Q.vma(pos, -4, n), [0, 0, 0], [0, 0, 0], Q.MASK_SHOT);
      if (t.fraction >= 1 || !t.normal) return;
      if (Q.matInfo(t.mat).nomarks) return;
      const f = this.faceMap.get(t.brush * 256 + t.plane);
      const nn = t.normal;
      let u = Math.abs(nn[2]) > 0.9 ? [1, 0, 0] : Q.vnorm(Q.vcross([0, 0, 1], nn));
      let v = Q.vcross(nn, u);
      const a = rot === undefined ? this.rnd() * Q.TAU : rot, c = Math.cos(a), s = Math.sin(a);
      const u2 = Q.vadd(Q.vscale(u, c), Q.vscale(v, s)), v2 = Q.vsub(Q.vscale(v, c), Q.vscale(u, s));
      u = u2; v = v2;
      const h = size / 2, p = Q.vma(t.endpos, 0.4, nn);
      let poly = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(q => Q.vadd(Q.vadd(p, Q.vscale(u, q[0] * h)), Q.vscale(v, q[1] * h)));
      if (f) {
        const vs = f.verts;
        for (let i = 0; i < vs.length && poly; i++) {
          const e0 = vs[i], e1 = vs[(i + 1) % vs.length];
          const en = Q.vnorm(Q.vcross(Q.vsub(e1, e0), f.n));
          poly = Q.clipWinding(poly, en, Q.vdot(en, e0) + 0.01);
        }
      }
      if (!poly || poly.length < 3) return;
      const uvs = poly.map(q => { const d = Q.vsub(q, p); return [0.5 + Q.vdot(d, u) / size, 0.5 - Q.vdot(d, v) / size]; });
      this.marks.push({ poly, uvs, tex, col, blend, life: life || 20, age: 0 });
      if (this.marks.length > 220) this.marks.shift();
    }

    sparks(pos, n, count, col, speed) {
      for (let i = 0; i < count; i++) {
        const d = Q.vnorm([n[0] + (this.rnd() - 0.5) * 1.4, n[1] + (this.rnd() - 0.5) * 1.4, n[2] + (this.rnd() - 0.5) * 1.4]);
        this.part({ pos: pos.slice(), vel: Q.vscale(d, (speed || 200) * (0.4 + this.rnd())), life: 0.25 + this.rnd() * 0.3, size: 2.5, size1: 0.5, col: col || [1, 0.85, 0.5, 1], grav: 500, tex: 'spark' });
      }
    }

    smoke(pos, size, life, col) {
      this.part({ pos: pos.slice(), vel: [(this.rnd() - 0.5) * 12, (this.rnd() - 0.5) * 12, 16 + this.rnd() * 10], life: life || 1, size: size || 10, size1: (size || 10) * 2.6, col: col || [0.55, 0.55, 0.55, 0.45], col1: [0.4, 0.4, 0.4, 0], tex: 'smoke', blend: 'alpha', rot: this.rnd() * 6, rotv: (this.rnd() - 0.5) * 1.5 });
    }

    event(e, game) {
      const P = id => game ? game.player(id) : null;
      switch (e.t) {
        case 'fire': {
          const col = e.wp === WP.RAILGUN ? [0.4, 1, 0.5] : e.wp === WP.PLASMA ? [0.6, 0.4, 1] : e.wp === WP.BFG ? [0.4, 1, 0.4] : e.wp === WP.LIGHTNING ? [0.6, 0.7, 1] : [1, 0.75, 0.35];
          if (e.wp !== WP.GAUNTLET) this.light(Q.vma(e.pos, 10, e.dir), e.wp === WP.LIGHTNING ? 160 : 220, e.quad ? [0.5, 0.6, 1.4] : col.map(x => x * 1.4), 0.09);
          if (e.wp === WP.ROCKET || e.wp === WP.GRENADE) this.smoke(Q.vma(e.pos, 12, e.dir), 8, 0.6);
          if (e.wp === WP.MACHINEGUN || e.wp === WP.SHOTGUN) this.shell(e, P(e.p));
          break;
        }
        case 'bullet':
          this.sparks(e.pos, e.normal, 4, [1, 0.8, 0.4, 1], 180);
          this.smoke(Q.vma(e.pos, 2, e.normal), 4, 0.5, [0.6, 0.58, 0.55, 0.4]);
          this.mark(e.pos, e.normal, 6, 'hole', [1, 1, 1, 0.9], 'alpha', 25);
          break;
        case 'pellet':
          this.smoke(Q.vma(e.pos, 2, e.normal), 4, 0.45, [0.6, 0.58, 0.55, 0.35]);
          if (this.rnd() < 0.6) this.sparks(e.pos, e.normal, 1, [1, 0.8, 0.4, 1], 150);
          this.mark(e.pos, e.normal, 5, 'hole', [1, 1, 1, 0.85], 'alpha', 25);
          break;
        case 'blood':
          for (let i = 0; i < 3 + (e.n || 1) * 2; i++) {
            this.part({ pos: e.pos.slice(), vel: [(this.rnd() - 0.5) * 140, (this.rnd() - 0.5) * 140, this.rnd() * 120], life: 0.5 + this.rnd() * 0.3, size: 4 + this.rnd() * 3, size1: 7, col: [0.7, 0.05, 0.03, 0.95], col1: [0.4, 0, 0, 0], grav: 500, tex: 'smoke', blend: 'alpha' });
          }
          if (this.rnd() < 0.35) this.mark(Q.vma(e.pos, 0, [0, 0, 1]), [0, 0, 1], 18, 'blood', [1, 1, 1, 0.9], 'alpha', 15);
          break;
        case 'explode': this.explosion(e); break;
        case 'rail': {
          const p = P(e.p);
          const col = p && p.look ? railColor(p) : [0.2, 1, 0.3];
          this.trails.push({ kind: 'rail', p0: e.from.slice(), p1: e.to.slice(), age: 0, life: 1.2, col });
          const dir = Q.vnorm(Q.vsub(e.to, e.from));
          const len = Q.vdist(e.from, e.to);
          let up = Math.abs(dir[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
          const s1 = Q.vnorm(Q.vcross(dir, up)), s2 = Q.vcross(s1, dir);
          for (let d = 12, i = 0; d < len && i < 400; d += 6, i++) {
            const a = d * 0.12;
            const off = Q.vadd(Q.vscale(s1, Math.cos(a) * 4), Q.vscale(s2, Math.sin(a) * 4));
            this.part({ pos: Q.vadd(Q.vma(e.from, d, dir), off), vel: Q.vscale(off, 1.2), life: 0.7 + this.rnd() * 0.4, size: 3.2, size1: 5, col: [col[0], col[1], col[2], 0.7], col1: [col[0], col[1], col[2], 0], tex: 'flare' });
          }
          if (e.normal && !e.sky) {
            this.mark(e.to, e.normal, 14, 'energy', [col[0], col[1], col[2], 1], 'add', 12);
            this.sparks(e.to, e.normal, 6, [col[0], col[1], col[2], 1], 200);
            this.light(e.to, 180, col, 0.3);
          }
          break;
        }
        case 'lightning': {
          this.bolts.set(e.p, { from: e.from, to: e.to, age: 0, hit: e.hit || e.world });
          if (e.world && e.normal) {
            if (this.rnd() < 0.4) this.mark(e.to, e.normal, 10, 'energy', [0.5, 0.6, 1, 1], 'add', 3);
            this.sparks(e.to, e.normal, 2, [0.7, 0.8, 1, 1], 160);
          }
          this.light(e.to, 120, [0.5, 0.6, 1.2], 0.06);
          break;
        }
        case 'gib': this.gibBurst(e.pos); break;
        case 'teleport_in':
        case 'teleport_out':
          for (let i = 0; i < 26; i++) {
            const a = this.rnd() * Q.TAU;
            this.part({ pos: [e.pos[0] + Math.cos(a) * 14, e.pos[1] + Math.sin(a) * 14, e.pos[2] - 20 + this.rnd() * 50], vel: [0, 0, 40 + this.rnd() * 60], life: 0.6 + this.rnd() * 0.4, size: 4, size1: 1, col: [0.6, 0.7, 1, 1], tex: 'spark' });
          }
          this.light(e.pos, 200, [0.5, 0.6, 1.2], 0.4);
          break;
        case 'item_respawn':
          for (let i = 0; i < 16; i++) {
            const a = i / 16 * Q.TAU;
            this.part({ pos: [e.pos[0] + Math.cos(a) * 16, e.pos[1] + Math.sin(a) * 16, e.pos[2] - 10], vel: [Math.cos(a) * 20, Math.sin(a) * 20, 50], life: 0.6, size: 4, size1: 1, col: [1, 1, 0.8, 1], tex: 'spark' });
          }
          break;
        case 'jumppad':
          for (let i = 0; i < 10; i++) this.part({ pos: [e.pos[0] + (this.rnd() - 0.5) * 30, e.pos[1] + (this.rnd() - 0.5) * 30, e.pos[2] + 4], vel: [0, 0, 120 + this.rnd() * 80], life: 0.5, size: 6, size1: 2, col: [1, 0.6, 0.2, 0.9], tex: 'flare' });
          break;
        default: break;
      }
    }

    shell(e, p) {
      if (!p || this.opts.brass === false) return;
      const r = Q.angleVectors(p.ps.yaw, 0).right;
      const pos = Q.vma(Q.vma(e.pos, -6, e.dir), 4, r);
      this.gibs.push({ pos, vel: Q.vadd(Q.vscale(r, 60 + this.rnd() * 40), [0, 0, 80 + this.rnd() * 40]), rot: 0, rotv: 12, mesh: 'brass', life: 2.5, age: 0, sc: 1 });
    }

    explosion(e) {
      const big = e.kind === 'rocket' || e.kind === 'grenade';
      if (big) {
        const col = e.quad ? [0.5, 0.6, 1.4] : [1.4, 0.8, 0.35];
        this.part({ pos: e.pos.slice(), life: 0.55, size: 30, size1: 95, col: [1, 0.9, 0.7, 1], col1: [1, 0.4, 0.1, 0], tex: 'fire', rot: this.rnd() * 6, rotv: 1 });
        this.part({ pos: e.pos.slice(), life: 0.3, size: 60, size1: 110, col: [1, 0.7, 0.3, 0.8], col1: [1, 0.3, 0, 0], tex: 'flare' });
        for (let i = 0; i < 6; i++) this.smoke(Q.vadd(e.pos, [(this.rnd() - 0.5) * 30, (this.rnd() - 0.5) * 30, this.rnd() * 20]), 16, 1.4 + this.rnd(), [0.35, 0.33, 0.3, 0.5]);
        this.sparks(e.pos, e.normal || [0, 0, 1], 10, [1, 0.7, 0.3, 1], 320);
        this.light(e.pos, 320, col, 0.55);
        if (!e.direct) this.mark(e.pos, e.normal || [0, 0, 1], 64, 'burn', [1, 1, 1, 0.85], 'mul', 25);
      } else if (e.kind === 'plasma') {
        this.part({ pos: e.pos.slice(), life: 0.3, size: 14, size1: 30, col: [0.7, 0.5, 1, 1], col1: [0.4, 0.2, 1, 0], tex: 'flare' });
        this.sparks(e.pos, e.normal || [0, 0, 1], 3, [0.7, 0.5, 1, 1], 150);
        this.light(e.pos, 150, [0.7, 0.4, 1.3], 0.2);
        if (!e.direct) this.mark(e.pos, e.normal || [0, 0, 1], 16, 'energy', [0.6, 0.4, 1, 1], 'add', 10);
      } else if (e.kind === 'bfg') {
        this.part({ pos: e.pos.slice(), life: 0.7, size: 40, size1: 150, col: [0.6, 1, 0.5, 1], col1: [0.2, 1, 0.2, 0], tex: 'flare', rotv: 2 });
        this.part({ pos: e.pos.slice(), life: 0.9, size: 30, size1: 120, col: [0.4, 1, 0.4, 0.9], col1: [0, 0.5, 0, 0], tex: 'fire', rot: 1, rotv: -1 });
        this.light(e.pos, 400, [0.5, 1.6, 0.5], 0.8);
        if (!e.direct) this.mark(e.pos, e.normal || [0, 0, 1], 64, 'energy', [0.4, 1, 0.4, 1], 'add', 15);
      }
    }

    gibBurst(pos) {
      const meshes = Q.gibMeshes();
      for (let i = 0; i < 8; i++) {
        this.gibs.push({ pos: [pos[0], pos[1], pos[2] + 10], vel: [(this.rnd() - 0.5) * 400, (this.rnd() - 0.5) * 400, 200 + this.rnd() * 300], rot: this.rnd() * 6, rotv: (this.rnd() - 0.5) * 16, mesh: meshes[i % meshes.length], life: 5 + this.rnd() * 3, age: 0, blood: 0, sc: 1 });
      }
      for (let i = 0; i < 18; i++) this.part({ pos: pos.slice(), vel: [(this.rnd() - 0.5) * 300, (this.rnd() - 0.5) * 300, this.rnd() * 300], life: 0.7, size: 7, size1: 12, col: [0.7, 0.05, 0.03, 1], col1: [0.3, 0, 0, 0], grav: 600, tex: 'smoke', blend: 'alpha' });
      this.mark(pos, [0, 0, 1], 48, 'blood', [1, 1, 1, 0.95], 'alpha', 20);
    }

    projectiles(game, dt) {
      for (const m of game.projectiles) {
        m.fxT = (m.fxT || 0) + dt;
        if (m.kind === 'rocket') {
          if (m.fxT > 0.028) { m.fxT = 0; this.smoke(m.pos, 7, 1.1, [0.7, 0.7, 0.7, 0.55]); }
          this.light(m.pos, 190, m.quad ? [0.4, 0.5, 1.2] : [1.3, 0.7, 0.25], 0.001);
        } else if (m.kind === 'grenade') {
          if (m.fxT > 0.05 && !m.rest) { m.fxT = 0; this.smoke(m.pos, 4, 0.7, [0.6, 0.6, 0.6, 0.4]); }
        } else if (m.kind === 'plasma') {
          this.light(m.pos, 120, [0.6, 0.4, 1.2], 0.001);
        } else if (m.kind === 'bfg') {
          this.light(m.pos, 240, [0.4, 1.4, 0.4], 0.001);
        }
      }
    }

    update(dt, game) {
      this.time += dt;
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.age += dt;
        if (p.age >= p.life) { this.parts.splice(i, 1); continue; }
        p.vel[2] -= p.grav * dt;
        if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vel = Q.vscale(p.vel, k); }
        p.pos = Q.vma(p.pos, dt, p.vel);
        p.rot += p.rotv * dt;
      }
      for (let i = this.marks.length - 1; i >= 0; i--) { const m = this.marks[i]; m.age += dt; if (m.age >= m.life) this.marks.splice(i, 1); }
      for (let i = this.trails.length - 1; i >= 0; i--) { const t = this.trails[i]; t.age += dt; if (t.age >= t.life) this.trails.splice(i, 1); }
      for (let i = this.lights.length - 1; i >= 0; i--) { const l = this.lights[i]; l.age += dt; if (l.age >= l.life && l.life > 0.01) this.lights.splice(i, 1); else if (l.life <= 0.01 && l.age > 0) this.lights.splice(i, 1); }
      for (const [k, b] of this.bolts) { b.age += dt; if (b.age > 0.1) this.bolts.delete(k); }
      for (let i = this.gibs.length - 1; i >= 0; i--) {
        const g = this.gibs[i];
        g.age += dt;
        if (g.age >= g.life) { this.gibs.splice(i, 1); continue; }
        if (g.rest) continue;
        g.vel[2] -= 800 * dt;
        const end = Q.vma(g.pos, dt, g.vel);
        const t = this.world.trace(g.pos, end, [-2, -2, -2], [2, 2, 2], Q.MASK_SHOT);
        g.pos = t.endpos;
        g.rot += g.rotv * dt;
        if (t.fraction < 1) {
          const d = Q.vdot(g.vel, t.normal);
          g.vel = Q.vscale(Q.vma(g.vel, -2 * d, t.normal), g.mesh === 'brass' ? 0.4 : 0.35);
          g.rotv *= 0.6;
          if (g.mesh !== 'brass' && Math.abs(d) > 120 && g.blood < 3) { g.blood++; this.mark(g.pos, t.normal, 20, 'blood', [1, 1, 1, 0.9], 'alpha', 12); }
          if (t.normal[2] > 0.6 && Q.vlen(g.vel) < 30) g.rest = true;
        } else if (g.mesh !== 'brass' && this.rnd() < dt * 12) {
          this.part({ pos: g.pos.slice(), vel: [0, 0, 0], life: 0.5, size: 3, size1: 5, col: [0.6, 0.04, 0.02, 0.8], col1: [0.3, 0, 0, 0], grav: 200, tex: 'smoke', blend: 'alpha' });
        }
      }
      if (game) this.projectiles(game, dt);
    }

    dynLights(view, game, extra) {
      const out = [];
      for (const l of this.lights) {
        const k = l.life <= 0.01 ? 1 : 1 - l.age / l.life;
        out.push({ pos: l.pos, r: l.r * (0.6 + 0.4 * k), col: l.col.map(c => c * k) });
      }
      if (game) {
        for (const p of game.players) {
          if (!p.alive) continue;
          if (p.powerups.quad > game.time) out.push({ pos: p.ps.origin, r: 170, col: [0.3, 0.4, 1.1] });
          else if (p.powerups.battlesuit > game.time) out.push({ pos: p.ps.origin, r: 150, col: [0.9, 0.7, 0.2] });
        }
      }
      if (extra) out.push(...extra);
      out.sort((a, b) => Q.vdist(a.pos, view.pos) - Q.vdist(b.pos, view.pos));
      return out.slice(0, 8);
    }

    build(view, game, decals, time, flames) {
      for (const k of Object.keys(this.batches)) this.batches[k].reset();
      const av = Q.angleVectors(view.yaw, view.pitch);
      const right = av.right, up = av.up;
      const eye = view.pos;
      if (decals) {
        for (const d of decals) {
          const pulse = d.glow ? 0.65 + 0.35 * Math.sin(time * 4) : 1;
          const b = this.batch(d.tex, d.glow ? 'add' : 'alpha', true);
          b.quad(d.pts[0], d.pts[1], d.pts[2], d.pts[3], [pulse, pulse, pulse, 1]);
        }
      }
      for (const m of this.marks) {
        const fade = m.age > m.life - 2 ? (m.life - m.age) / 2 : 1;
        const b = this.batch(m.tex, m.blend, true);
        const col = [m.col[0], m.col[1], m.col[2], m.col[3] * fade];
        if (m.blend === 'add') { col[0] *= fade; col[1] *= fade; col[2] *= fade; }
        for (let i = 1; i + 1 < m.poly.length; i++) {
          b.grow(3);
          b.vert(m.poly[0], m.uvs[0][0], m.uvs[0][1], col);
          b.vert(m.poly[i], m.uvs[i][0], m.uvs[i][1], col);
          b.vert(m.poly[i + 1], m.uvs[i + 1][0], m.uvs[i + 1][1], col);
        }
      }
      for (const p of this.parts) {
        const k = p.age / p.life;
        const size = p.size1 !== null ? p.size + (p.size1 - p.size) * k : p.size;
        const c0 = p.col, c1 = p.col1 || [p.col[0], p.col[1], p.col[2], 0];
        const col = [c0[0] + (c1[0] - c0[0]) * k, c0[1] + (c1[1] - c0[1]) * k, c0[2] + (c1[2] - c0[2]) * k, c0[3] + (c1[3] - c0[3]) * k];
        this.batch(p.tex, p.blend).billboard(p.pos, size, col, right, up, p.rot);
      }
      for (const t of this.trails) {
        const k = 1 - t.age / t.life;
        this.batch('beam', 'add').beam(t.p0, t.p1, 6 * (0.5 + k * 0.5), [t.col[0] * k, t.col[1] * k, t.col[2] * k, k], eye, 1, 0);
        this.batch('beam', 'add').beam(t.p0, t.p1, 2, [k, k, k, k], eye, 1, 0);
      }
      for (const [, b] of this.bolts) {
        const len = Q.vdist(b.from, b.to);
        const off = (time * 7.3) % 1;
        this.batch('bolt', 'add').beam(b.from, b.to, 14, [0.6, 0.7, 1, 1], eye, len / 128, off);
        this.batch('bolt', 'add').beam(b.from, b.to, 9, [1, 1, 1, 0.8], eye, len / 90, -off * 1.7);
        if (b.hit) this.batch('flare', 'add').billboard(b.to, 18 + Math.sin(time * 40) * 4, [0.7, 0.8, 1, 1], right, up, 0);
      }
      if (game) {
        for (const m of game.projectiles) {
          if (m.kind === 'plasma') {
            this.batch('flare', 'add').billboard(m.pos, 16, [0.6, 0.45, 1, 1], right, up, time * 5);
            this.batch('flare', 'add').billboard(m.pos, 7, [1, 1, 1, 1], right, up, 0);
          } else if (m.kind === 'bfg') {
            this.batch('flare', 'add').billboard(m.pos, 40, [0.4, 1, 0.4, 1], right, up, time * 3);
            this.batch('fire', 'add').billboard(m.pos, 26, [0.5, 1, 0.5, 1], right, up, -time * 4);
          } else if (m.kind === 'rocket') {
            const back = Q.vma(m.pos, -12, Q.vnorm(m.vel));
            this.batch('flare', 'add').billboard(back, 22 + Math.sin(time * 50) * 4, m.quad ? [0.5, 0.6, 1, 1] : [1, 0.7, 0.3, 1], right, up, 0);
          }
        }
      }
      if (flames) {
        for (const f of flames) {
          const s = 26 * (f.scale || 1);
          for (let i = 0; i < 3; i++) {
            const ph = time * 3 + i * 2.1 + f.pos[0] * 0.01;
            const lift = ((ph % 1) + 1) % 1;
            this.batch('fire', 'add').billboard([f.pos[0], f.pos[1], f.pos[2] + 4 + lift * s * 0.7], s * (1 - lift * 0.5), [1, 0.8, 0.5, 1 - lift], right, up, ph);
          }
          this.batch('flare', 'add').billboard([f.pos[0], f.pos[1], f.pos[2] + 6], s * 1.6, [1, 0.5, 0.2, 0.35], right, up, 0);
        }
      }
      return Object.values(this.batches).sort((a, b) => (b.offset ? 1 : 0) - (a.offset ? 1 : 0) || (a.blend === 'mul' ? -1 : 0));
    }
  }
  Q.FX = FX;

  function railColor(p) {
    const tr = p.look && p.look.trim;
    if (!tr) return [0.2, 1, 0.3];
    const c = [parseInt(tr.slice(1, 3), 16) / 255, parseInt(tr.slice(3, 5), 16) / 255, parseInt(tr.slice(5, 7), 16) / 255];
    const m = Math.max(c[0], c[1], c[2]) || 1;
    return [c[0] / m, c[1] / m, c[2] / m];
  }
  Q.railColor = railColor;
})(globalThis.Quake3 = globalThis.Quake3 || {});
