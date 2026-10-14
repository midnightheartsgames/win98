(function (O) {
  'use strict';
  const T = { soft: 0, smoke: 1, ring: 2, cross: 3, star: 4, hex: 5, beam: 6, shadow: 7, spark: 8, halo: 9, confetti: 10, flame: 11, bolt: 12, scorch: 13, streak: 14, flare: 15 };
  O.FXT = T;

  const HERO_TRACER = {
    tracer: [0.45, 0.85, 1], soldier: [0.55, 0.82, 1], mccree: [1, 0.88, 0.55], widowmaker: [1, 0.45, 0.95], roadhog: [1, 0.72, 0.38],
    torbjorn: [1, 0.62, 0.3], turret: [1, 0.8, 0.45], junkrat: [1, 0.7, 0.3], lucio: [0.55, 1, 0.35], mercy: [1, 0.85, 0.45], trainbot: [1, 0.5, 0.3]
  };
  const SHOT = {
    tracer: { speed: 340, len: 4.5, w: 0.035, sparks: 4, hole: 0.07 },
    pulse: { speed: 125, len: 2.2, w: 0.06, bolt: true, energy: true, sparks: 3, hole: 0.06 },
    pellet: { speed: 260, len: 1.8, w: 0.022, sparks: 2, hole: 0.05 },
    sniper: { beam: true, w: 0.05, energy: true, sparks: 6, hole: 0.12 }
  };
  O.FX_SHOT = SHOT;
  const PROJ = {
    frag: { c: [0.35, 0.4, 0.25], s: 0.28, glow: [1, 0.6, 0.2], blend: 'alpha', trail: 'fuse' },
    mayhem: { c: [0.35, 0.4, 0.25], s: 0.22, glow: [1, 0.5, 0.2], blend: 'alpha', trail: 'fuse' },
    helix: { c: [0.6, 0.85, 1], s: 0.35, trail: 'smoke', light: 4 },
    turretRocket: { c: [1, 0.6, 0.3], s: 0.3, trail: 'smoke', light: 3 },
    rivet: { c: [1, 0.55, 0.15], s: 0.22, trail: 'ember', light: 2.2 },
    sonic: { c: [0.5, 1, 0.3], s: 0.3, trail: 'sonic', light: 2.5, energy: true },
    blaster: { c: [1, 0.9, 0.4], s: 0.22, trail: 'ember', light: 2.5, energy: true },
    orb: { c: [1, 0.85, 0.35], s: 0.42, trail: 'sparkle', light: 3.5, energy: true },
    strike: { c: [1, 0.45, 0.1], s: 1.6, trail: 'flame', light: 7 },
    flash: { c: [1, 1, 0.9], s: 0.25, light: 2 },
    bomb: { c: [0.4, 0.8, 1], s: 0.35, blink: true, trail: 'sparkle', light: 2.5 },
    mine: { c: [0.3, 0.3, 0.3], s: 0.35, blink: [1, 0.2, 0.1], blend: 'alpha' },
    trapThrow: { c: [0.55, 0.55, 0.6], s: 0.35, blend: 'alpha' },
    venomThrow: { c: [0.8, 0.3, 1], s: 0.25, trail: 'drip' },
    bubbleThrow: { c: [0.5, 0.8, 1], s: 0.3, trail: 'sparkle' },
    shell: { c: [1, 0.7, 0.3], s: 0.25, trail: 'ember' },
    hook: { c: [0.7, 0.7, 0.72], s: 0.35, blend: 'alpha' }
  };
  O.FX_PROJ = PROJ;
  const BLAST = {
    pulse: { core: [0.85, 0.97, 1], fire: [0.35, 0.75, 1], end: [0.1, 0.25, 0.85] },
    mine: { core: [1, 0.92, 0.65], fire: [1, 0.55, 0.2], end: [0.6, 0.15, 0.05] },
    boom: { core: [1, 0.95, 0.72], fire: [1, 0.62, 0.22], end: [0.55, 0.14, 0.04] }
  };
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

  class Particles {
    constructor() { this.list = []; this.lines = []; this.shots = []; this.decals = []; this.lights = []; this.t = 0; this.fpMuzzle = null; }
    add(p) { if (this.list.length < 1600) this.list.push(p); return p; }
    line(l) { if (this.lines.length < 400) this.lines.push(l); return l; }
    shot(s) { if (this.shots.length < 320) this.shots.push(s); return s; }
    decal(d) { if (this.decals.length >= 90) this.decals.shift(); this.decals.push(d); return d; }
    light(l) { if (this.lights.length < 48) this.lights.push(l); return l; }
    clear() { this.list.length = 0; this.lines.length = 0; this.shots.length = 0; this.decals.length = 0; this.lights.length = 0; }

    burst(x, y, z, n, o) {
      const r = Math.random;
      for (let i = 0; i < n; i++) {
        const a = r() * Math.PI * 2, b = (r() - 0.3) * Math.PI;
        const sp = (o.speed || 4) * (0.4 + r() * 0.8);
        this.add({
          x, y, z, vx: Math.cos(a) * Math.cos(b) * sp, vy: Math.sin(b) * sp + (o.up || 0), vz: Math.sin(a) * Math.cos(b) * sp, g: o.g === undefined ? 9 : o.g,
          life: (o.life || 0.5) * (0.6 + r() * 0.8), age: -(o.delay || 0) * (0.7 + r() * 0.6), s0: o.s0 || 0.15, s1: o.s1 === undefined ? 0.02 : o.s1, c: o.c || [1, 1, 1], c1: o.c1 || null,
          a0: o.a === undefined ? 1 : o.a, tex: o.tex === undefined ? T.soft : o.tex, add: o.add !== false, drag: o.drag || 0, streak: o.streak || 0,
          rot: o.spin ? r() * 6.28 : 0, spin: o.spin ? (r() - 0.5) * o.spin : 0
        });
      }
    }

    sparks(x, y, z, n, nrm, o) {
      const r = Math.random;
      for (let i = 0; i < n; i++) {
        let vx = (r() - 0.5) * 2, vy = (r() - 0.5) * 2 + 0.4, vz = (r() - 0.5) * 2;
        if (nrm) { vx += nrm[0] * 1.6; vy += nrm[1] * 1.6; vz += nrm[2] * 1.6; }
        const l = Math.hypot(vx, vy, vz) || 1, sp = (o.speed || 5) * (0.5 + r() * 0.8);
        this.add({ x, y, z, vx: vx / l * sp, vy: vy / l * sp, vz: vz / l * sp, g: o.g === undefined ? 14 : o.g, life: (o.life || 0.28) * (0.6 + r() * 0.8), age: -(o.delay || 0), s0: o.w || 0.024, s1: 0.008, c: o.c || [1, 0.85, 0.55], a0: 1, tex: T.streak, add: true, drag: 1.2, streak: o.streak || 0.04 });
      }
    }

    hitWorld(x, y, z, n, c, o) {
      const r = Math.random, d = o.delay || 0;
      const px = x + n[0] * 0.02, py = y + n[1] * 0.02, pz = z + n[2] * 0.02;
      this.sparks(px, py, pz, o.sparks || 4, n, { delay: d, c: o.energy ? mixc(c, [1, 1, 1], 0.4) : [1, 0.82, 0.5], speed: o.energy ? 3.5 : 5.5 });
      this.add({ x: px, y: py, z: pz, vx: n[0] * 0.7, vy: n[1] * 0.7 + 0.25, vz: n[2] * 0.7, g: 0, life: 0.55, age: -d, s0: 0.06, s1: 0.32, c: [0.58, 0.56, 0.52], a0: 0.4, tex: T.smoke, add: false, drag: 2.4, rot: r() * 6.28, spin: 1 });
      this.add({ x: px, y: py, z: pz, vx: 0, vy: 0, vz: 0, g: 0, life: 0.07, age: -d, s0: (o.hole || 0.07) * 2.6, s1: (o.hole || 0.07) * 3.2, c: o.energy ? c : [1, 0.85, 0.6], a0: 0.9, tex: T.flare, add: true, rot: r() * 6.28 });
      this.decal({ x: x + n[0] * 0.012, y: y + n[1] * 0.012, z: z + n[2] * 0.012, n, s: o.hole || 0.07, rot: r() * 6.28, life: 9, age: -d, c: [0.07, 0.06, 0.055], a0: 0.85, tex: T.scorch, add: false });
      if (o.energy) this.decal({ x: x + n[0] * 0.016, y: y + n[1] * 0.016, z: z + n[2] * 0.016, n, s: (o.hole || 0.07) * 1.7, rot: 0, life: 0.7, age: -d, c, a0: 0.9, tex: T.soft, add: true });
      this.light({ x: px + n[0] * 0.3, y: py + n[1] * 0.3, z: pz + n[2] * 0.3, r: 1.5, c: mulc(o.energy ? c : [1, 0.75, 0.45], 0.35), life: 0.07, age: -d });
    }

    hitHero(x, y, z, c, crit, d, energy) {
      const r = Math.random;
      this.add({ x, y, z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.09, age: -d, s0: 0.28, s1: 0.42, c: energy ? mixc(c, [1, 1, 1], 0.35) : [1, 0.78, 0.5], a0: 1, tex: T.flare, add: true, rot: r() * 6.28 });
      this.sparks(x, y, z, crit ? 9 : 4, null, { delay: d, c: crit ? [1, 0.95, 0.5] : [1, 0.62, 0.42], speed: crit ? 6 : 4, g: 8 });
      if (crit) this.add({ x, y, z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.2, age: -d, s0: 0.15, s1: 0.75, c: [1, 0.95, 0.55], a0: 0.9, tex: T.ring, add: true });
    }

    muzzle(x, y, z, c, s, dir) {
      const r = Math.random;
      this.add({ x, y, z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.05, age: 0, s0: s, s1: s * 1.25, c: mixc(c, [1, 1, 1], 0.35), a0: 1, tex: T.flare, add: true, rot: r() * 6.28 });
      this.add({ x, y, z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.06, age: 0, s0: s * 1.5, s1: s * 1.8, c, a0: 0.3, tex: T.soft, add: true });
      if (dir) this.add({ x: x + dir[0] * s * 0.6, y: y + dir[1] * s * 0.6, z: z + dir[2] * s * 0.6, vx: dir[0] * 9, vy: dir[1] * 9, vz: dir[2] * 9, g: 0, life: 0.05, age: 0, s0: s * 0.35, s1: s * 0.2, c, a0: 0.9, tex: T.streak, add: true, streak: 0.03 });
    }

    shotEvent(f, st, viewer) {
      const r = Math.random;
      const own = !!(viewer && f.owner === viewer.id);
      let x0 = f.x0, y0 = f.y0, z0 = f.z0, fp = false;
      if (own && this.fpMuzzle) { const m = this.fpMuzzle(f.side || 1); if (m) { x0 = m[0]; y0 = m[1]; z0 = m[2]; fp = true; } }
      const c = HERO_TRACER[f.hero] || [1, 0.9, 0.6];
      const dx = f.x1 - x0, dy = f.y1 - y0, dz = f.z1 - z0, dist = Math.hypot(dx, dy, dz) || 0.001;
      const u = [dx / dist, dy / dist, dz / dist];
      const big = f.type === 'sniper' ? 0.7 + (f.charge || 0) * 0.9 : f.big ? 1.6 : 1;
      const wk = fp ? 0.75 : 1;
      if (!fp) this.muzzle(x0, y0, z0, c, f.type === 'pellet' ? 0.24 : f.type === 'sniper' ? 0.24 : 0.16, u);
      this.light({ x: x0 + u[0] * 0.6, y: y0 + u[1] * 0.6, z: z0 + u[2] * 0.6, r: st.beam ? 4.5 : f.type === 'pellet' ? 4 : 3, c: mulc(c, fp ? 0.22 : 0.45), life: 0.05, age: 0 });
      let delay = 0;
      if (st.beam) {
        this.shot({ beam: true, x0, y0, z0, x1: f.x1, y1: f.y1, z1: f.z1, w: st.w * big * wk, c, life: 0.45 + big * 0.2, age: 0, a: fp ? 0.75 : 1 });
        const n = Math.min(44, Math.floor(dist / 0.8));
        const sc = mixc(c, [0.85, 0.82, 0.9], 0.55);
        for (let i = 1; i <= n; i++) {
          const k = i / (n + 1);
          this.add({ x: x0 + dx * k + (r() - 0.5) * 0.04, y: y0 + dy * k + (r() - 0.5) * 0.04, z: z0 + dz * k + (r() - 0.5) * 0.04, vx: (r() - 0.5) * 0.14, vy: 0.1 + r() * 0.12, vz: (r() - 0.5) * 0.14, g: 0, life: 0.9 + r() * 0.9 + big * 0.3, age: -k * 0.04, s0: 0.05, s1: 0.24 + big * 0.14, c: sc, a0: 0.42, tex: T.smoke, add: false, drag: 0.8, rot: r() * 6.28, spin: 0.6 });
        }
      } else {
        const len = Math.min(st.len * big, Math.max(0.3, dist));
        this.shot({ x0, y0, z0, dx: u[0], dy: u[1], dz: u[2], dist, speed: st.speed, len, w: st.w * big * wk, c, bolt: !!st.bolt, age: 0, life: (dist + len) / st.speed, a: fp ? 0.8 : 1 });
        delay = dist / st.speed;
      }
      if (f.hit) this.hitHero(f.x1, f.y1, f.z1, c, f.crit, delay, st.energy);
      else if (f.shield) {
        const mine = viewer && f.team !== viewer.team;
        this.add({ x: f.x1, y: f.y1, z: f.z1, vx: 0, vy: 0, vz: 0, g: 0, life: 0.14, age: -delay, s0: 0.25, s1: 0.55, c: mine ? [0.45, 0.8, 1] : [1, 0.45, 0.4], a0: 0.8, tex: T.hex, add: true, rot: r() * 6.28 });
      } else if (f.n) this.hitWorld(f.x1, f.y1, f.z1, f.n, c, { delay, energy: st.energy, hole: st.hole * (f.type === 'sniper' ? big : 1), sparks: st.sparks });
    }

    event(f, g, viewer) {
      const r = Math.random;
      const st = SHOT[f.type];
      if (st) { this.shotEvent(f, st, viewer); return; }
      if (f.type === 'impact') {
        const d = PROJ[f.kind];
        const pc = d ? d.glow || d.c : [1, 0.8, 0.5];
        const energy = !!(d && d.energy);
        if (f.n) this.hitWorld(f.x, f.y, f.z, f.n, pc, { energy, hole: f.kind === 'shell' ? 0.1 : 0.08, sparks: f.kind === 'shell' ? 7 : 4 });
        else {
          this.sparks(f.x, f.y, f.z, f.kind === 'shell' ? 10 : 6, null, { c: mixc(pc, [1, 1, 1], 0.3), speed: 4 });
          this.light({ x: f.x, y: f.y, z: f.z, r: 2.4, c: pc, life: 0.1, age: 0 });
        }
        this.add({ x: f.x, y: f.y, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.14, age: 0, s0: 0.45, s1: 0.2, c: pc, a0: 0.9, tex: energy ? T.flare : T.soft, add: true, rot: r() * 6.28 });
        if (f.kind === 'sonic') this.add({ x: f.x, y: f.y, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.2, age: 0, s0: 0.2, s1: 0.8, c: pc, a0: 0.8, tex: T.ring, add: true });
      } else if (f.type === 'explosion') {
        const R = f.r || 2, kind = f.kind;
        const P = BLAST[kind] || BLAST.boom;
        this.add({ x: f.x, y: f.y, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.13, age: 0, s0: R * 0.5, s1: R * 1.35, c: P.core, a0: 1, tex: T.soft, add: true });
        const nf = Math.min(14, 5 + Math.round(R * 2));
        for (let i = 0; i < nf; i++) {
          const a = r() * 6.28, b = (r() - 0.2) * 1.4, sp = R * (0.6 + r() * 0.9);
          this.add({ x: f.x + Math.cos(a) * R * 0.25 * r(), y: f.y + r() * R * 0.2, z: f.z + Math.sin(a) * R * 0.25 * r(), vx: Math.cos(a) * Math.cos(b) * sp, vy: Math.sin(b) * sp + R * 0.5, vz: Math.sin(a) * Math.cos(b) * sp, g: -1, life: 0.32 + r() * 0.3, age: -r() * 0.05, s0: R * (0.3 + r() * 0.15), s1: R * (0.6 + r() * 0.3), c: P.fire, c1: P.end, a0: 1, tex: r() < 0.5 ? T.flame : T.soft, add: true, drag: 3.5, rot: r() * 6.28, spin: (r() - 0.5) * 4 });
        }
        this.add({ x: f.x, y: f.y, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.24, age: 0, s0: R * 0.6, s1: R * 2.3, c: mixc(P.core, P.fire, 0.3), a0: 0.75, tex: T.ring, add: true });
        this.sparks(f.x, f.y, f.z, Math.min(34, Math.round(R * 8)), null, { c: mixc(P.core, P.fire, 0.4), speed: R * 5.5, life: 0.5, g: 12, streak: 0.05, w: 0.035 });
        this.burst(f.x, f.y + 0.3, f.z, Math.min(18, Math.round(R * 4)), { speed: R * 1.1, life: 1.8, s0: R * 0.3, s1: R * 1.15, c: kind === 'pulse' ? [0.42, 0.45, 0.55] : [0.3, 0.28, 0.27], g: -1.4, tex: T.smoke, add: false, a: 0.55, drag: 1.6, delay: 0.1, spin: 1.5 });
        this.light({ x: f.x, y: f.y + 0.5, z: f.z, r: R * 4, c: mulc(P.fire, 1.3), life: 0.38, age: 0 });
        if (kind === 'pulse') {
          this.burst(f.x, f.y, f.z, 22, { speed: 10, life: 0.4, s0: 0.2, c: [0.7, 0.9, 1], g: 0, tex: T.spark, spin: 8 });
          this.add({ x: f.x, y: f.y + 0.1, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.35, age: 0, s0: R * 0.4, s1: R * 1.8, c: [0.4, 0.8, 1], a0: 0.8, tex: T.ring, add: true, flat: true });
        }
      } else if (f.type === 'death') {
        this.burst(f.x, f.y + 1, f.z, 10, { speed: 2, life: 0.8, s0: 0.25, s1: 0.5, c: [0.8, 0.8, 0.85], g: -0.5, tex: T.smoke, add: false, a: 0.5, spin: 1 });
        this.sparks(f.x, f.y + 1, f.z, 8, null, { c: [1, 0.85, 0.6], speed: 3, g: 6, life: 0.4 });
      } else if (f.type === 'blink') {
        this.line({ x0: f.x0, y0: f.y0, z0: f.z0, x1: f.x1, y1: f.y1, z1: f.z1, w: 0.5, c: [0.4, 0.8, 1], life: 0.3, age: 0, a0: 0.6, tex: T.bolt });
        this.line({ x0: f.x0, y0: f.y0, z0: f.z0, x1: f.x1, y1: f.y1, z1: f.z1, w: 0.12, c: [0.85, 0.97, 1], life: 0.2, age: 0, a0: 0.9, tex: T.bolt });
        this.burst(f.x0, f.y0, f.z0, 8, { speed: 2, life: 0.35, s0: 0.2, c: [0.5, 0.85, 1], g: 0 });
        this.sparks(f.x1, f.y1, f.z1, 10, null, { c: [0.6, 0.9, 1], speed: 3, g: 0, life: 0.3 });
        this.light({ x: f.x1, y: f.y1, z: f.z1, r: 3, c: [0.3, 0.6, 0.9], life: 0.2, age: 0 });
      } else if (f.type === 'recall') {
        for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; this.add({ x: f.x + Math.cos(a) * 0.6, y: f.y, z: f.z + Math.sin(a) * 0.6, vx: -Math.sin(a) * 2, vy: 1.5, vz: Math.cos(a) * 2, g: 0, life: 0.6, age: 0, s0: 0.2, s1: 0, c: [0.4, 0.8, 1], a0: 1, tex: T.soft, add: true }); }
        this.light({ x: f.x, y: f.y, z: f.z, r: 3.5, c: [0.3, 0.6, 1], life: 0.5, age: 0 });
      } else if (f.type === 'flash') {
        this.add({ x: f.x, y: f.y, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.25, age: 0, s0: 1, s1: 4, c: [1, 1, 0.9], a0: 1, tex: T.flare, add: true, rot: r() * 6.28 });
        this.sparks(f.x, f.y, f.z, 16, null, { c: [1, 1, 0.8], speed: 7, g: 2, life: 0.3 });
        this.light({ x: f.x, y: f.y, z: f.z, r: 7, c: [1.6, 1.6, 1.4], life: 0.25, age: 0 });
      } else if (f.type === 'shieldhit') {
        const c = f.team === (viewer ? viewer.team : 0) ? [0.4, 0.75, 1] : [1, 0.45, 0.4];
        this.add({ x: f.x, y: f.y, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.12, age: 0, s0: 0.4, s1: 0.8, c, a0: 0.4, tex: T.hex, add: true });
      } else if (f.type === 'barrierbreak') {
        this.burst(f.x, f.y, f.z, 30, { speed: 5, life: 0.7, s0: 0.25, s1: 0.05, c: [0.6, 0.85, 1], g: 6, tex: T.hex, spin: 6 });
        this.light({ x: f.x, y: f.y, z: f.z, r: 6, c: [0.5, 0.8, 1.2], life: 0.3, age: 0 });
      } else if (f.type === 'shatter') {
        for (let i = 1; i <= 12; i++) {
          const d = f.range * i / 12;
          for (const off of [-1, 0, 1]) {
            const a = f.yaw + off * f.arc * 0.7 * (i / 12);
            const x = f.x + Math.sin(a) * d, z = f.z + Math.cos(a) * d;
            this.add({ x, y: f.y + 0.2, z, vx: 0, vy: 3 + r() * 2, vz: 0, g: 12, life: 0.5, age: -i * 0.03, s0: 0.6, s1: 0.2, c: [0.55, 0.5, 0.42], a0: 0.9, tex: T.smoke, add: false, rot: r() * 6.28 });
            this.add({ x, y: f.y + 0.1, z, vx: 0, vy: 0.5, vz: 0, g: 0, life: 0.35, age: -i * 0.03, s0: 0.8, s1: 1.6, c: [0.5, 0.8, 1], a0: 0.7, tex: T.soft, add: true });
          }
        }
        this.light({ x: f.x + Math.sin(f.yaw) * f.range * 0.5, y: f.y + 1, z: f.z + Math.cos(f.yaw) * f.range * 0.5, r: f.range, c: [0.4, 0.7, 1.2], life: 0.5, age: 0 });
      } else if (f.type === 'slam') {
        this.burst(f.x, f.y, f.z, 16, { speed: 5, life: 0.5, s0: 0.3, s1: 0.5, c: [0.7, 0.65, 0.6], g: 5, tex: T.smoke, add: false, a: 0.7, spin: 2 });
        this.sparks(f.x, f.y, f.z, 10, null, { c: [1, 0.8, 0.5], speed: 6 });
      } else if (f.type === 'land') {
        for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; this.add({ x: f.x, y: f.y + 0.2, z: f.z, vx: Math.cos(a) * 6, vy: 0.6, vz: Math.sin(a) * 6, g: 0, life: 0.4, age: 0, s0: 0.4, s1: 0.8, c: [0.7, 0.68, 0.62], a0: 0.6, tex: T.smoke, add: false, drag: 3, rot: r() * 6.28 }); }
        this.add({ x: f.x, y: f.y + 0.2, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.3, age: 0, s0: 0.5, s1: f.r * 2, c: [0.5, 0.8, 1], a0: 0.8, tex: T.ring, add: true, flat: true });
        this.light({ x: f.x, y: f.y + 1, z: f.z, r: f.r * 2, c: [0.4, 0.7, 1.1], life: 0.3, age: 0 });
      } else if (f.type === 'soundwave') {
        const fx = Math.sin(f.yaw), fz = Math.cos(f.yaw);
        for (let i = 0; i < 5; i++) this.add({ x: f.x + fx * (1 + i), y: f.y, z: f.z + fz * (1 + i), vx: fx * 12, vy: 0, vz: fz * 12, g: 0, life: 0.25, age: -i * 0.02, s0: 0.6 + i * 0.5, s1: 2 + i, c: [0.5, 1, 0.4], a0: 0.5, tex: T.ring, add: true });
      } else if (f.type === 'soundbarrier') {
        this.add({ x: f.x, y: f.y + 1, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 0.8, age: 0, s0: 2, s1: f.r * 1.6, c: [0.5, 1, 0.4], a0: 0.8, tex: T.ring, add: true });
        this.burst(f.x, f.y + 1, f.z, 30, { speed: 8, life: 0.6, s0: 0.3, c: [0.6, 1, 0.5], g: 0 });
        this.light({ x: f.x, y: f.y + 1.5, z: f.z, r: f.r * 1.5, c: [0.5, 1.2, 0.4], life: 0.6, age: 0 });
      } else if (f.type === 'rez') {
        for (let i = 0; i < 30; i++) this.add({ x: f.x + (r() - 0.5) * 3, y: f.y, z: f.z + (r() - 0.5) * 3, vx: 0, vy: 4 + r() * 4, vz: 0, g: 0, life: 1, age: 0, s0: 0.3, s1: 0, c: [1, 0.9, 0.5], a0: 1, tex: T.soft, add: true });
        this.add({ x: f.x, y: f.y + 0.1, z: f.z, vx: 0, vy: 0, vz: 0, g: 0, life: 1, age: 0, s0: 1, s1: f.r * 2, c: [1, 0.9, 0.5], a0: 0.7, tex: T.ring, add: true, flat: true });
        this.light({ x: f.x, y: f.y + 2, z: f.z, r: f.r * 1.5, c: [1.3, 1.1, 0.6], life: 1, age: 0 });
      } else if (f.type === 'venom') {
        this.burst(f.x, f.y + 0.3, f.z, 26, { speed: 2.5, life: 1.4, s0: 0.5, s1: 1.2, c: [0.6, 0.2, 0.8], g: -0.3, tex: T.smoke, add: false, a: 0.6, drag: 1.5, spin: 1 });
        this.light({ x: f.x, y: f.y + 0.8, z: f.z, r: f.r * 1.4, c: [0.7, 0.2, 1], life: 0.6, age: 0 });
      } else if (f.type === 'pickup') {
        this.add({ x: f.x, y: f.y + 0.6, z: f.z, vx: 0, vy: 1.5, vz: 0, g: 0, life: 0.5, age: 0, s0: 0.6, s1: 1.2, c: f.big ? [1, 0.9, 0.3] : [0.4, 1, 0.4], a0: 1, tex: T.cross, add: true });
      }
    }

    trail(p, dt) {
      const d = PROJ[p.kind];
      if (!d || !d.trail || p.stuckTo !== undefined || !p.vel) return;
      const r = Math.random;
      const k = d.trail;
      const rate = k === 'smoke' ? 70 : k === 'flame' ? 50 : k === 'sonic' ? 14 : 30;
      let n = dt * rate;
      n = Math.floor(n) + (r() < n % 1 ? 1 : 0);
      const x = p.pos.x, y = p.pos.y, z = p.pos.z, v = p.vel;
      for (let i = 0; i < n; i++) {
        const f = r() * dt;
        const px = x - v.x * f, py = y - v.y * f, pz = z - v.z * f;
        if (k === 'smoke') {
          this.add({ x: px, y: py, z: pz, vx: (r() - 0.5) * 0.3, vy: 0.2 + r() * 0.3, vz: (r() - 0.5) * 0.3, g: 0, life: 0.9 + r() * 0.5, age: 0, s0: 0.1, s1: 0.55, c: [0.62, 0.62, 0.64], a0: 0.4, tex: T.smoke, add: false, drag: 1.2, rot: r() * 6.28, spin: 1 });
          if (i === 0) this.add({ x: px, y: py, z: pz, vx: 0, vy: 0, vz: 0, g: 0, life: 0.1, age: 0, s0: 0.3, s1: 0.1, c: [1, 0.7, 0.35], a0: 0.9, tex: T.flame, add: true, rot: r() * 6.28 });
        } else if (k === 'fuse') {
          this.add({ x: px, y: py + 0.12, z: pz, vx: (r() - 0.5) * 1.5, vy: r() * 1.5, vz: (r() - 0.5) * 1.5, g: 6, life: 0.25, age: 0, s0: 0.03, s1: 0.01, c: [1, 0.75, 0.3], a0: 1, tex: T.streak, add: true, streak: 0.03 });
          if (r() < 0.5) this.add({ x: px, y: py + 0.12, z: pz, vx: 0, vy: 0.3, vz: 0, g: 0, life: 0.5, age: 0, s0: 0.05, s1: 0.2, c: [0.4, 0.4, 0.42], a0: 0.35, tex: T.smoke, add: false, rot: r() * 6.28 });
        } else if (k === 'ember') {
          this.add({ x: px, y: py, z: pz, vx: (r() - 0.5) * 0.4, vy: (r() - 0.5) * 0.4, vz: (r() - 0.5) * 0.4, g: 2, life: 0.22, age: 0, s0: d.s * 0.4, s1: 0.01, c: d.c, a0: 0.9, tex: T.soft, add: true });
        } else if (k === 'sparkle') {
          this.add({ x: px + (r() - 0.5) * 0.2, y: py + (r() - 0.5) * 0.2, z: pz + (r() - 0.5) * 0.2, vx: 0, vy: 0.2, vz: 0, g: 0, life: 0.35, age: 0, s0: 0.09, s1: 0, c: mixc(d.c, [1, 1, 1], 0.3), a0: 1, tex: T.spark, add: true, rot: r() * 6.28, spin: 6 });
        } else if (k === 'sonic') {
          this.add({ x: px, y: py, z: pz, vx: 0, vy: 0, vz: 0, g: 0, life: 0.2, age: 0, s0: 0.1, s1: 0.45, c: d.c, a0: 0.55, tex: T.ring, add: true });
        } else if (k === 'flame') {
          this.add({ x: px + (r() - 0.5) * 0.8, y: py + (r() - 0.5) * 0.8, z: pz + (r() - 0.5) * 0.8, vx: (r() - 0.5), vy: 0.8 + r(), vz: (r() - 0.5), g: 0, life: 0.35 + r() * 0.2, age: 0, s0: 0.6, s1: 0.1, c: [1, 0.6, 0.2], c1: [0.7, 0.15, 0.05], a0: 0.85, tex: T.flame, add: true, rot: r() * 6.28, spin: 3 });
        } else if (k === 'drip') {
          this.add({ x: px, y: py, z: pz, vx: 0, vy: 0, vz: 0, g: 6, life: 0.3, age: 0, s0: 0.05, s1: 0.03, c: [0.75, 0.3, 1], a0: 0.9, tex: T.soft, add: true });
        }
      }
    }

    update(dt) {
      this.t += dt;
      const L = this.list;
      let j = 0;
      for (let i = 0; i < L.length; i++) {
        const p = L[i];
        p.age += dt;
        if (p.age >= p.life) continue;
        if (p.age > 0) {
          p.vy -= p.g * dt;
          if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; }
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          if (p.spin) p.rot += p.spin * dt;
        }
        L[j++] = p;
      }
      L.length = j;
      for (const A of [this.lines, this.shots, this.decals, this.lights]) {
        j = 0;
        for (let i = 0; i < A.length; i++) { const l = A[i]; l.age += dt; if (l.age < l.life) A[j++] = l; }
        A.length = j;
      }
    }
  }
  O.Particles = Particles;
  O.FX_TRACER = HERO_TRACER;
})(globalThis.Ow98 = globalThis.Ow98 || {});
