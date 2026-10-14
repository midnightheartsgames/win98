(function (M) {
  'use strict';
  const T = { soft: 0, flash: 1, smoke: 2, splat: 3, shard: 4, dot: 5, streak: 6, flame: 7, shell: 8, square: 9, glow: 10, ring: 11 };
  const MAX_DECALS = 220;

  class FX {
    constructor() {
      this.parts = [];
      this.decals = [];
      this.lights = [];
      this.snow = [];
      this.rain = [];
      this.time = 0;
      this.rng = new M.RNG(99);
      this.shake = 0;
    }

    reset() {
      this.parts.length = 0;
      this.decals.length = 0;
      this.lights.length = 0;
      this.snow.length = 0;
      this.rain.length = 0;
    }

    add(o) {
      const p = Object.assign({ t: 0, life: 0.5, vel: [0, 0, 0], grav: 0, drag: 0, size: 0.1, grow: 0, col: [1, 1, 1, 1], fade: true, add: false, tile: T.soft, rot: 0 }, o);
      if (this.parts.length > 1800) this.parts.shift();
      this.parts.push(p);
      return p;
    }

    light(pos, color, r, life) { this.lights.push({ pos: pos.slice(), color, r, life, t: 0 }); }

    decal(pos, n, size, tile, col, o) {
      const d = Object.assign({ pos: M.addScaled(pos, n, 0.012 + this.decals.length * 0.00002), n, size, tile, col, rot: this.rng.next() * 6.28 }, o || {});
      this.decals.push(d);
      if (this.decals.length > MAX_DECALS) this.decals.shift();
    }

    handle(ev, g) {
      const r = this.rng;
      switch (ev.t) {
        case 'shot': {
          const d = ev.dir;
          const heavy = ev.weapon === 'pump' || ev.weapon === 'sawed' || ev.weapon === 'deagle';
          const at = M.addScaled(ev.pos, d, 0.12);
          this.add({ pos: at, life: 0.055, size: heavy ? 0.42 : 0.28, tile: T.flash, add: true, col: [1, 0.9, 0.7, 1], rot: r.next() * 6 });
          this.add({ pos: M.addScaled(at, d, 0.15), life: 0.04, size: heavy ? 0.3 : 0.18, tile: T.flash, add: true, col: [1, 0.8, 0.5, 0.8], rot: r.next() * 6 });
          this.light(at, [1.6, 1.05, 0.5].map(v => v * (heavy ? 1.4 : 1)), heavy ? 7 : 5, 0.06);
          this.add({ pos: at, vel: M.scale(d, 0.8), life: 0.7, size: 0.12, grow: 0.5, tile: T.smoke, col: [0.6, 0.6, 0.6, 0.35], drag: 2 });
          if (!ev.npc || M.dist(ev.pos, g.player.pos) < 14) {
            const side = M.norm(M.cross(d, [0, 1, 0]));
            const sh = ev.weapon === 'pump' || ev.weapon === 'sawed';
            if (ev.weapon !== 'sawed') this.add({ pos: M.addScaled(ev.pos, d, -0.05), vel: [side[0] * 1.8 + r.range(-0.3, 0.3), 2.2, side[2] * 1.8 + r.range(-0.3, 0.3)], grav: 10, life: 1.4, size: sh ? 0.05 : 0.03, tile: T.shell, col: sh ? [0.9, 0.2, 0.15, 1] : [1, 0.85, 0.4, 1], fade: false, bounce: this.floorBelow(g, ev.pos), spin: r.range(-20, 20) });
          }
          break;
        }
        case 'impact': {
          const n = ev.n || [0, 1, 0];
          const mat = ev.mat;
          const count = 6;
          for (let i = 0; i < count; i++) {
            const v = M.add(M.scale(n, r.range(1, 3)), [r.range(-1.5, 1.5), r.range(-0.5, 2), r.range(-1.5, 1.5)]);
            if (mat === 'metal') this.add({ pos: ev.pos, vel: M.scale(v, 1.8), grav: 9, life: r.range(0.15, 0.4), size: 0.025, tile: T.dot, add: true, col: [1, 0.8, 0.4, 1] });
            else if (mat === 'wood') this.add({ pos: ev.pos, vel: v, grav: 9, life: 0.6, size: 0.04, tile: T.square, col: [0.45, 0.3, 0.15, 1], fade: false });
            else if (mat === 'snow') this.add({ pos: ev.pos, vel: M.scale(v, 0.7), grav: 5, life: 0.8, size: 0.06, tile: T.soft, col: [0.9, 0.93, 1, 0.8] });
            else if (mat === 'water') this.add({ pos: ev.pos, vel: [v[0] * 0.3, 3 + r.next() * 2, v[2] * 0.3], grav: 12, life: 0.6, size: 0.05, tile: T.soft, col: [0.7, 0.75, 0.8, 0.7] });
            else this.add({ pos: ev.pos, vel: M.scale(v, 0.8), grav: 9, life: 0.5, size: 0.03, tile: T.square, col: [0.4, 0.38, 0.35, 1], fade: false });
          }
          this.add({ pos: M.addScaled(ev.pos, n, 0.05), vel: M.scale(n, 0.6), life: 0.9, size: 0.1, grow: 0.5, tile: T.smoke, col: mat === 'snow' ? [0.9, 0.9, 1, 0.5] : [0.55, 0.52, 0.48, 0.45], drag: 2 });
          if (mat === 'metal') this.light(ev.pos, [0.8, 0.6, 0.3], 1.5, 0.05);
          if (ev.decal && mat !== 'water') this.decal(ev.pos, n, mat === 'wood' ? 0.09 : 0.11, T.soft, mat === 'snow' ? [0.3, 0.32, 0.35, 0.5] : [0.05, 0.04, 0.03, 0.85], { hole: true });
          break;
        }
        case 'blood': {
          const d = ev.dir || [0, 0, 1];
          const n = ev.head ? 14 : 8;
          for (let i = 0; i < n; i++) this.add({ pos: ev.pos, vel: M.add(M.scale(d, r.range(1, 4)), [r.range(-1, 1), r.range(-0.5, 1.5), r.range(-1, 1)]), grav: 9, life: r.range(0.3, 0.7), size: r.range(0.02, 0.05), tile: T.dot, col: [0.45, 0.02, 0.02, 1] });
          this.add({ pos: ev.pos, vel: M.scale(d, 0.5), life: 0.35, size: 0.12, grow: 0.6, tile: T.soft, col: [0.5, 0.03, 0.03, 0.6] });
          const hit = g.world.raycast(ev.pos, M.scale(M.norm([d[0], d[1] - 0.6, d[2]]), 2.5), { noDyn: true });
          if (hit) this.decal(hit.pos, hit.n, r.range(0.25, 0.5), T.splat, [0.35, 0.02, 0.02, 0.85]);
          break;
        }
        case 'explode': {
          const p = ev.pos;
          for (let i = 0; i < 16; i++) this.add({ pos: M.add(p, [r.range(-0.4, 0.4), r.range(-0.2, 0.5), r.range(-0.4, 0.4)]), vel: [r.range(-3, 3), r.range(0.5, 4), r.range(-3, 3)], drag: 3, life: r.range(0.35, 0.7), size: r.range(0.6, 1.1), grow: 1.5, tile: T.flame, add: true, col: [1, 0.75, 0.4, 1], rot: r.next() * 6 });
          for (let i = 0; i < 14; i++) this.add({ pos: M.add(p, [r.range(-0.6, 0.6), r.range(0, 0.8), r.range(-0.6, 0.6)]), vel: [r.range(-1.5, 1.5), r.range(1, 3), r.range(-1.5, 1.5)], drag: 1.2, life: r.range(1.5, 3), size: r.range(0.6, 1.0), grow: 1.2, tile: T.smoke, col: [0.18, 0.17, 0.16, 0.7] });
          for (let i = 0; i < 26; i++) this.add({ pos: p, vel: [r.range(-9, 9), r.range(2, 10), r.range(-9, 9)], grav: 12, life: r.range(0.4, 1.2), size: 0.04, tile: T.dot, add: true, col: [1, 0.7, 0.3, 1] });
          for (let i = 0; i < 10; i++) this.add({ pos: p, vel: [r.range(-6, 6), r.range(3, 8), r.range(-6, 6)], grav: 12, life: 1.6, size: r.range(0.05, 0.12), tile: T.square, col: [0.15, 0.13, 0.12, 1], fade: false, bounce: this.floorBelow(g, p) });
          this.add({ pos: p, life: 0.25, size: 2.5, grow: 4, tile: T.ring, add: true, col: [1, 0.9, 0.7, 0.5] });
          this.light(p, [3.5, 2.2, 1.0], 14, 0.5);
          const hit = g.world.raycast(p, [0, -3, 0], { noDyn: true });
          if (hit) this.decal(hit.pos, hit.n, 2.4, T.soft, [0, 0, 0, 0.8]);
          this.shake = Math.max(this.shake, M.clamp(1.2 - M.dist(p, g.player.pos) / 25, 0, 1));
          break;
        }
        case 'glass': {
          const ax = ev.axis === 'x' ? [1, 0, 0] : [0, 0, 1];
          for (let i = 0; i < 26; i++) {
            const along = r.range(-ev.w / 2, ev.w / 2), up = r.range(-ev.h / 2, ev.h / 2);
            const pos = ev.axis === 'y' ? [ev.pos[0] + along, ev.pos[1], ev.pos[2] + up] : [ev.pos[0] + ax[0] * along, ev.pos[1] + up, ev.pos[2] + ax[2] * along];
            this.add({ pos, vel: M.add(M.scale(ev.dir, r.range(1, 4)), [r.range(-1, 1), r.range(-0.5, 1.5), r.range(-1, 1)]), grav: 11, life: r.range(0.7, 1.4), size: r.range(0.04, 0.12), tile: T.shard, col: [0.8, 0.9, 1, 0.8], spin: r.range(-12, 12), bounce: this.floorBelow(g, pos) });
          }
          break;
        }
        case 'debris': {
          for (let i = 0; i < 18; i++) this.add({ pos: M.add(ev.pos, [r.range(-0.3, 0.3), r.range(-0.3, 0.3), r.range(-0.3, 0.3)]), vel: [r.range(-3, 3), r.range(1, 5), r.range(-3, 3)], grav: 11, life: r.range(1, 2), size: r.range(0.06, 0.16), tile: T.square, col: ev.mat === 'wood' ? [0.5, 0.35, 0.18, 1] : [0.5, 0.48, 0.45, 1], fade: false, spin: r.range(-10, 10), bounce: this.floorBelow(g, ev.pos) });
          for (let i = 0; i < 5; i++) this.add({ pos: ev.pos, vel: [r.range(-1, 1), r.range(0, 1), r.range(-1, 1)], life: 1.2, size: 0.4, grow: 0.8, tile: T.smoke, col: [0.5, 0.45, 0.4, 0.4], drag: 2 });
          break;
        }
        case 'molotov': {
          for (let i = 0; i < 14; i++) this.add({ pos: ev.pos, vel: [r.range(-3, 3), r.range(1, 4), r.range(-3, 3)], grav: 10, life: 0.8, size: 0.06, tile: T.shard, col: [0.4, 0.8, 0.3, 0.8] });
          for (let i = 0; i < 10; i++) this.add({ pos: M.add(ev.pos, [0, 0.3, 0]), vel: [r.range(-2, 2), r.range(1, 3), r.range(-2, 2)], drag: 2, life: 0.5, size: 0.7, grow: 1, tile: T.flame, add: true, col: [1, 0.7, 0.3, 1] });
          this.light(ev.pos, [2.5, 1.4, 0.5], 9, 0.4);
          this.decal(M.add(ev.pos, [0, 0.02, 0]), [0, 1, 0], 2.2, T.soft, [0, 0, 0, 0.7]);
          break;
        }
        case 'hurt':
          if (!ev.burn) this.shake = Math.max(this.shake, 0.25);
          break;
      }
    }

    floorBelow(g, p) {
      const h = g.world.raycast(p, [0, -6, 0], { noDyn: true });
      return h ? h.pos[1] + 0.01 : p[1] - 6;
    }

    update(dt, g, camPos) {
      this.time += dt;
      const P = this.parts;
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.t += dt;
        if (p.t >= p.life) { P.splice(i, 1); continue; }
        p.vel[1] -= p.grav * dt;
        if (p.drag) { const k = Math.exp(-p.drag * dt); p.vel[0] *= k; p.vel[1] *= k; p.vel[2] *= k; }
        p.pos[0] += p.vel[0] * dt; p.pos[1] += p.vel[1] * dt; p.pos[2] += p.vel[2] * dt;
        if (p.spin) p.rot += p.spin * dt;
        if (p.bounce !== undefined && p.pos[1] < p.bounce) {
          p.pos[1] = p.bounce;
          p.vel[1] = Math.abs(p.vel[1]) * 0.3;
          p.vel[0] *= 0.5; p.vel[2] *= 0.5;
          if (p.spin) p.spin *= 0.5;
          if (p.tile === T.shell && !p.clinked) { p.clinked = true; p.life = Math.max(p.life, p.t + 3); if (this.onClink) this.onClink(p.pos); }
        }
      }
      for (let i = this.lights.length - 1; i >= 0; i--) { const l = this.lights[i]; l.t += dt; if (l.t >= l.life) this.lights.splice(i, 1); }
      for (const f of g.fires) {
        const grow = Math.min(1, f.t * 3);
        const n = Math.max(1, Math.round(f.r * 3 * grow * dt * 30));
        for (let i = 0; i < n; i++) {
          const a = this.rng.next() * 6.28, d = Math.sqrt(this.rng.next()) * f.r * grow;
          this.add({ pos: [f.pos[0] + Math.cos(a) * d, f.pos[1] + 0.1, f.pos[2] + Math.sin(a) * d], vel: [0, this.rng.range(1, 2.4), 0], life: this.rng.range(0.35, 0.7), size: this.rng.range(0.25, 0.5), grow: 0.3, tile: T.flame, add: true, col: [1, 0.7, 0.35, 0.9], rot: this.rng.next() * 6 });
        }
        if (this.rng.chance(dt * 6)) this.add({ pos: [f.pos[0], f.pos[1] + 1.2, f.pos[2]], vel: [0, 1.4, 0], life: 2.5, size: 0.5, grow: 1, tile: T.smoke, col: [0.12, 0.11, 0.1, 0.4], drag: 0.5 });
      }
      this.shake = Math.max(0, this.shake - dt * 2.5);
      this.updateWeather(dt, g, camPos);
    }

    updateWeather(dt, g, cam) {
      const w = g.world;
      if (!cam) return;
      const kind = w.weather;
      if (kind === 'snow' || kind === 'blizzard') {
        const N = kind === 'blizzard' ? 1400 : 900;
        while (this.snow.length < N) this.snow.push([cam[0] + this.rng.range(-16, 16), cam[1] + this.rng.range(-6, 12), cam[2] + this.rng.range(-16, 16), this.rng.next()]);
        const wind = kind === 'blizzard' ? [2.2, 0, 0.8] : [0.6, 0, 0.3];
        for (const s of this.snow) {
          s[0] += (wind[0] + Math.sin(this.time * 1.3 + s[3] * 20) * 0.4) * dt;
          s[1] -= (1.1 + s[3] * 0.8) * dt;
          s[2] += (wind[2] + Math.cos(this.time * 1.1 + s[3] * 17) * 0.4) * dt;
          if (s[0] < cam[0] - 16) s[0] += 32; else if (s[0] > cam[0] + 16) s[0] -= 32;
          if (s[2] < cam[2] - 16) s[2] += 32; else if (s[2] > cam[2] + 16) s[2] -= 32;
          if (s[1] < cam[1] - 6) s[1] += 18; else if (s[1] > cam[1] + 12) s[1] -= 18;
        }
      } else this.snow.length = 0;
      if (kind === 'rain') {
        while (this.rain.length < 700) this.rain.push([cam[0] + this.rng.range(-14, 14), cam[1] + this.rng.range(-5, 10), cam[2] + this.rng.range(-14, 14)]);
        for (const s of this.rain) {
          s[1] -= 14 * dt; s[0] += 1.2 * dt;
          if (s[0] < cam[0] - 14) s[0] += 28; else if (s[0] > cam[0] + 14) s[0] -= 28;
          if (s[2] < cam[2] - 14) s[2] += 28; else if (s[2] > cam[2] + 14) s[2] -= 28;
          if (s[1] < cam[1] - 5) s[1] += 15;
        }
      } else this.rain.length = 0;
    }

    dynLights(g) {
      const out = [];
      for (const l of this.lights) {
        const k = 1 - l.t / l.life;
        out.push({ pos: l.pos, color: l.color.map(c => c * k), r: l.r });
      }
      for (const f of g.fires) {
        const fl = 0.8 + Math.sin(this.time * 17 + f.pos[0]) * 0.12 + Math.sin(this.time * 29 + f.pos[2]) * 0.08;
        out.push({ pos: [f.pos[0], f.pos[1] + 0.8, f.pos[2]], color: [1.6 * fl, 0.9 * fl, 0.35 * fl], r: 5 + f.r * 1.5 });
      }
      out.sort((a, b) => (b.color[0] + b.color[1]) * b.r - (a.color[0] + a.color[1]) * a.r);
      return out.slice(0, 8);
    }

    outdoorAt(w, p) {
      const z = w.zoneAt(p);
      return !!(z && z.outdoor && z.snow !== false);
    }

    draw(r, view, cam, fog) {
      const gl = r.gl;
      const V = cam.view;
      const right = [V[0], V[4], V[8]], up = [V[1], V[5], V[9]];
      const data = r.spriteData;
      const maxQ = data.length / 54;
      const g = view.game;
      const passes = [[], []];
      const quad = (list, c, s, tile, col, rot, axis) => { list.push([c, s, tile, col, rot || 0, axis]); };
      for (const d of this.decals) passes[0].push(['decal', d]);
      for (const p of this.parts) {
        const k = p.t / p.life;
        const a = p.fade ? (p.col[3] * (1 - k)) : p.col[3];
        const s = p.size * (1 + p.grow * k);
        quad(passes[p.add ? 1 : 0], p.pos, s, p.tile, [p.col[0], p.col[1], p.col[2], a], p.rot);
      }
      if (g) {
        const bt = g.bt && g.bt.on;
        for (const b of g.projectiles) {
          const sp = M.len(b.vel);
          const dir = M.scale(b.vel, 1 / (sp || 1));
          const len = Math.min(M.dist(b.pos, b.start), bt ? 3.2 : 1.6);
          const tail = M.addScaled(b.pos, dir, -len);
          const player = b.owner === 'player';
          const col = player ? [1, 0.85, 0.55, bt ? 0.75 : 0.5] : [1, 0.7, 0.45, bt ? 0.8 : 0.45];
          passes[1].push(['streak', b.pos, tail, bt ? 0.035 : 0.022, col]);
          if (bt) {
            passes[1].push([b.pos, 0.07, T.glow, [1, 0.9, 0.7, 0.9], 0]);
            passes[0].push(['streak', b.pos, M.addScaled(b.pos, dir, -Math.min(M.dist(b.pos, b.start), 6)), 0.09, [0.75, 0.78, 0.82, 0.12]]);
          }
        }
        for (const L of g.props) if (L.kind === 'searchlight' && !L.off && L.dir) {
          passes[1].push(['streak', M.addScaled(L.pos, L.dir, 22), L.pos, 2.2, [0.9, 0.95, 1, 0.07]]);
          passes[1].push([L.pos, 0.9, T.glow, [1, 1, 0.95, 0.9], 0]);
        }
      }
      const snowOk = this.snow.length && g;
      if (snowOk) for (const s of this.snow) {
        if (!this.outdoorAt(g.world, s)) continue;
        passes[0].push([s, 0.035 + s[3] * 0.03, T.soft, [0.92, 0.94, 1, 0.8], 0]);
      }
      if (this.rain.length && g) for (const s of this.rain) {
        if (!this.outdoorAt(g.world, s)) continue;
        passes[0].push(['streak', s, [s[0] - 0.05, s[1] + 0.45, s[2]], 0.012, [0.7, 0.75, 0.85, 0.35]]);
      }
      const P = r.pSprite.use();
      P.m4('uVP', cam.vp).f3('uCam', view.cam.pos).f3('uFogC', fog.color).f2('uFog', fog.near, fog.far).i1('uTex', 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, r.spriteTex);
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      const camPos = view.cam.pos;
      for (let pass = 0; pass < 2; pass++) {
        let n = 0;
        const put = (a, b, c, d, tile, col) => {
          if (n >= maxQ) return;
          const u0 = (tile % 4) / 4, v0 = Math.floor(tile / 4) / 4, u1 = u0 + 0.25, v1 = v0 + 0.25;
          const uv = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
          const pts = [a, b, c, d];
          let o = n * 54;
          for (const i of [0, 1, 2, 0, 2, 3]) {
            const p = pts[i];
            data[o++] = p[0]; data[o++] = p[1]; data[o++] = p[2];
            data[o++] = uv[i][0]; data[o++] = uv[i][1];
            data[o++] = col[0]; data[o++] = col[1]; data[o++] = col[2]; data[o++] = col[3];
          }
          n++;
        };
        for (const it of passes[pass]) {
          if (it[0] === 'decal') {
            const d = it[1];
            const nn = d.n;
            const t0 = Math.abs(nn[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
            let ax = M.norm(M.cross(t0, nn)), ay = M.cross(nn, ax);
            const c = Math.cos(d.rot), s = Math.sin(d.rot);
            const rx = M.add(M.scale(ax, c), M.scale(ay, s)), ry = M.add(M.scale(ay, c), M.scale(ax, -s));
            const h = d.size / 2;
            const p = d.pos;
            put(M.add(M.addScaled(p, rx, -h), M.scale(ry, -h)), M.add(M.addScaled(p, rx, h), M.scale(ry, -h)), M.add(M.addScaled(p, rx, h), M.scale(ry, h)), M.add(M.addScaled(p, rx, -h), M.scale(ry, h)), d.tile, d.col);
          } else if (it[0] === 'streak') {
            const [, a, b, wdt, col] = it;
            const dir = M.norm(M.sub(a, b));
            const toCam = M.norm(M.sub(camPos, a));
            let side = M.cross(dir, toCam);
            const sl = M.len(side);
            if (sl < 1e-4) continue;
            side = M.scale(side, wdt / sl);
            put(M.sub(b, side), M.add(b, side), M.add(a, side), M.sub(a, side), T.streak, col);
          } else {
            const [c, s, tile, col, rot] = it;
            const cr = Math.cos(rot), sr = Math.sin(rot);
            const rx = M.add(M.scale(right, cr * s), M.scale(up, sr * s)), ry = M.add(M.scale(up, cr * s), M.scale(right, -sr * s));
            put(M.sub(M.sub(c, rx), ry), M.sub(M.add(c, rx), ry), M.add(M.add(c, rx), ry), M.add(M.sub(c, rx), ry), tile, col);
          }
        }
        if (!n) continue;
        if (pass === 0) { gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); P.f1('uFogMix', 1); }
        else { gl.blendFunc(gl.SRC_ALPHA, gl.ONE); P.f1('uFogMix', 0.6); }
        if (pass === 0) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -4); }
        r.sprites.set(data.subarray(0, n * 54), n * 6);
        r.sprites.draw();
        gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }
  }
  M.FX = FX;
  M.FX_TILE = T;
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
