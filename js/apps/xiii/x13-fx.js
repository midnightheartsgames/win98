(function (X) {
  'use strict';
  const T = X.Tex, INK = '#1a100a';
  const CELLS = ['flash', 'smoke', 'dust', 'spark', 'blood', 'drop', 'splash', 'snow', 'rain', 'glint', 'boom', 'hole', 'splat', 'shadow', 'shell', 'chip', 'tracer', 'fire', 'nflash', 'scorch', 'glass', 'leaf'];
  const CI = {};
  CELLS.forEach((c, i) => { CI[c] = i; });
  const COLS = 8, CS = 128;

  function star(x, cx, cy, n, r0, r1, rot, r) {
    x.beginPath();
    for (let i = 0; i <= n * 2; i++) {
      const a = rot + i / (n * 2) * Math.PI * 2;
      const rr = i % 2 ? r0 * (0.8 + r() * 0.3) : r1 * (0.75 + r() * 0.35);
      const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
      if (i) x.lineTo(px, py); else x.moveTo(px, py);
    }
    x.closePath();
  }

  function drawCell(x, name, r) {
    const c = CS / 2;
    x.lineJoin = 'round'; x.lineCap = 'round';
    switch (name) {
      case 'flash':
        star(x, c, c, 9, 20, 60, 0.2, r); x.fillStyle = '#fff7c0'; x.fill(); x.lineWidth = 5; x.strokeStyle = INK; x.stroke();
        star(x, c, c, 9, 12, 38, 0.5, r); x.fillStyle = '#ffffff'; x.fill();
        star(x, c, c, 7, 8, 22, 0.1, r); x.fillStyle = '#ffe060'; x.fill();
        break;
      case 'nflash':
        star(x, c, c, 7, 18, 52, 0.3, r); x.fillStyle = '#ffe680'; x.fill(); x.lineWidth = 4; x.strokeStyle = INK; x.stroke();
        star(x, c, c, 7, 8, 26, 0.6, r); x.fillStyle = '#ffffff'; x.fill();
        break;
      case 'smoke': case 'dust': {
        const col = name === 'smoke' ? '#9a948c' : '#b09470';
        x.fillStyle = col; x.strokeStyle = INK; x.lineWidth = 3;
        x.beginPath();
        for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28, rr = 22 + r() * 10; x.moveTo(c + Math.cos(a) * 26 + rr, c + Math.sin(a) * 22); x.arc(c + Math.cos(a) * 26, c + Math.sin(a) * 22, rr, 0, 7); }
        x.fill(); x.globalAlpha = 0.6; x.stroke(); x.globalAlpha = 1;
        x.fillStyle = T.shade(col, 1.2); x.beginPath(); x.arc(c - 10, c - 12, 20, 0, 7); x.fill();
        break;
      }
      case 'spark': x.fillStyle = '#fff4a0'; x.beginPath(); x.ellipse(c, c, 50, 7, 0, 0, 7); x.fill(); x.fillStyle = '#ffffff'; x.beginPath(); x.ellipse(c, c, 30, 3, 0, 0, 7); x.fill(); break;
      case 'blood':
        x.fillStyle = '#9a0c08';
        for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * 34; x.beginPath(); x.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, 8 + r() * 16, 0, 7); x.fill(); }
        x.strokeStyle = INK; x.lineWidth = 2; x.globalAlpha = 0.5; x.beginPath(); x.arc(c, c, 30, 0, 7); x.stroke(); x.globalAlpha = 1;
        break;
      case 'drop': x.fillStyle = '#a00e08'; x.beginPath(); x.arc(c, c + 10, 18, 0, 7); x.fill(); x.beginPath(); x.moveTo(c - 16, c + 4); x.lineTo(c, c - 34); x.lineTo(c + 16, c + 4); x.fill(); break;
      case 'splash':
        x.fillStyle = '#e8f4f8'; x.strokeStyle = '#2a4a5a'; x.lineWidth = 3;
        for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.35; x.beginPath(); x.ellipse(c + Math.cos(a) * 30, c + 20 + Math.sin(a) * 40, 7, 16, a + Math.PI / 2, 0, 7); x.fill(); x.stroke(); }
        break;
      case 'snow': x.fillStyle = '#ffffff'; x.beginPath(); x.arc(c, c, 26, 0, 7); x.fill(); x.strokeStyle = '#8aa0b8'; x.lineWidth = 3; x.stroke(); break;
      case 'rain': x.strokeStyle = '#c8d8e8'; x.lineWidth = 7; x.beginPath(); x.moveTo(4, c); x.lineTo(CS - 4, c); x.stroke(); break;
      case 'glint': star(x, c, c, 4, 6, 50, 0, () => 0.5); x.fillStyle = '#ffffff'; x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); break;
      case 'boom': {
        x.fillStyle = '#f08a1c'; x.strokeStyle = INK; x.lineWidth = 5;
        star(x, c, c, 11, 34, 60, 0, r); x.fill(); x.stroke();
        x.fillStyle = '#ffd23a'; star(x, c, c, 9, 22, 42, 0.4, r); x.fill();
        x.fillStyle = '#fffbe0'; x.beginPath(); x.arc(c, c, 18, 0, 7); x.fill();
        break;
      }
      case 'hole':
        x.fillStyle = '#1a120c'; x.beginPath(); x.arc(c, c, 14, 0, 7); x.fill();
        x.strokeStyle = '#1a120c'; x.lineWidth = 3;
        for (let i = 0; i < 6; i++) { const a = r() * 6.28; x.beginPath(); x.moveTo(c + Math.cos(a) * 12, c + Math.sin(a) * 12); x.lineTo(c + Math.cos(a) * (24 + r() * 16), c + Math.sin(a) * (24 + r() * 16)); x.stroke(); }
        x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.arc(c - 4, c - 4, 5, 0, 7); x.fill();
        break;
      case 'splat':
        x.fillStyle = '#7a0a06';
        for (let i = 0; i < 14; i++) { const a = r() * 6.28, d = r() * 40; x.beginPath(); x.ellipse(c + Math.cos(a) * d, c + Math.sin(a) * d, 6 + r() * 14, 4 + r() * 10, a, 0, 7); x.fill(); }
        break;
      case 'shadow': { const g = x.createRadialGradient(c, c, 4, c, c, 60); g.addColorStop(0, 'rgba(30,20,20,0.75)'); g.addColorStop(0.6, 'rgba(30,20,20,0.45)'); g.addColorStop(1, 'rgba(30,20,20,0)'); x.fillStyle = g; x.fillRect(0, 0, CS, CS); break; }
      case 'shell': x.fillStyle = '#d8a430'; x.fillRect(c - 8, c - 20, 16, 40); x.strokeStyle = INK; x.lineWidth = 3; x.strokeRect(c - 8, c - 20, 16, 40); break;
      case 'chip': x.fillStyle = '#8a5a30'; x.beginPath(); x.moveTo(c - 20, c - 10); x.lineTo(c + 24, c - 4); x.lineTo(c + 8, c + 16); x.closePath(); x.fill(); x.strokeStyle = INK; x.lineWidth = 3; x.stroke(); break;
      case 'tracer': { const g = x.createLinearGradient(0, 0, CS, 0); g.addColorStop(0, 'rgba(255,240,180,0)'); g.addColorStop(0.7, 'rgba(255,240,180,0.9)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, c - 5, CS, 10); break; }
      case 'fire':
        x.fillStyle = '#f07818'; x.beginPath(); x.moveTo(c - 30, CS - 10); x.quadraticCurveTo(c - 40, c, c, 8); x.quadraticCurveTo(c + 40, c, c + 30, CS - 10); x.fill();
        x.fillStyle = '#ffd040'; x.beginPath(); x.moveTo(c - 16, CS - 12); x.quadraticCurveTo(c - 20, c + 10, c, c - 20); x.quadraticCurveTo(c + 20, c + 10, c + 16, CS - 12); x.fill();
        x.strokeStyle = INK; x.lineWidth = 3; x.globalAlpha = 0.5; x.beginPath(); x.moveTo(c - 30, CS - 10); x.quadraticCurveTo(c - 40, c, c, 8); x.quadraticCurveTo(c + 40, c, c + 30, CS - 10); x.stroke(); x.globalAlpha = 1;
        break;
      case 'scorch': { const g = x.createRadialGradient(c, c, 4, c, c, 60); g.addColorStop(0, 'rgba(10,6,4,0.9)'); g.addColorStop(0.7, 'rgba(20,14,10,0.5)'); g.addColorStop(1, 'rgba(20,14,10,0)'); x.fillStyle = g; x.fillRect(0, 0, CS, CS); break; }
      case 'glass': x.fillStyle = 'rgba(200,230,240,0.9)'; x.beginPath(); x.moveTo(c - 20, c - 26); x.lineTo(c + 22, c - 8); x.lineTo(c - 4, c + 28); x.closePath(); x.fill(); x.strokeStyle = '#ffffff'; x.lineWidth = 3; x.stroke(); break;
      case 'leaf': x.fillStyle = '#d0701c'; x.beginPath(); x.ellipse(c, c, 30, 14, 0.5, 0, 7); x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.stroke(); break;
    }
  }

  class FX {
    constructor(r) {
      this.r = r;
      this.parts = [];
      this.decals = [];
      this.tracers = [];
      this.time = 0;
      this.data = { a: new Float32Array(36 * 3000), b: new Float32Array(36 * 1200), d: new Float32Array(36 * 600) };
      if (typeof document !== 'undefined' && r) {
        const cv = document.createElement('canvas');
        cv.width = COLS * CS; cv.height = Math.ceil(CELLS.length / COLS) * CS;
        const x = cv.getContext('2d');
        const rng = X.rng(77);
        CELLS.forEach((n, i) => { x.save(); x.translate((i % COLS) * CS, Math.floor(i / COLS) * CS); x.beginPath(); x.rect(0, 0, CS, CS); x.clip(); drawCell(x, n, rng); x.restore(); });
        this.tex = X.GL.texture(r.gl, cv, { mip: true });
        this.rows = Math.ceil(CELLS.length / COLS);
      }
    }
    uv(name) {
      const i = CI[name] || 0;
      const u0 = (i % COLS) / COLS, v0 = Math.floor(i / COLS) / this.rows;
      return [u0, v0, u0 + 1 / COLS, v0 + 1 / this.rows];
    }
    add(kind, pos, o) {
      o = o || {};
      if (this.parts.length > 2600) this.parts.shift();
      const p = { kind, pos: pos.slice(), vel: o.vel ? o.vel.slice() : [0, 0, 0], size: o.size || 0.3, grow: o.grow || 0, life: o.life || 0.5, t: 0, col: o.col || [1, 1, 1], alpha: o.alpha === undefined ? 1 : o.alpha, rot: o.rot === undefined ? Math.random() * 6.28 : o.rot, spin: o.spin || 0, grav: o.grav || 0, add: !!o.add, drag: o.drag || 0, fade: o.fade === undefined ? 1 : o.fade, stretch: o.stretch || 0 };
      this.parts.push(p);
      return p;
    }
    decal(kind, pos, n, size, o) {
      o = o || {};
      if (this.decals.length > 90) this.decals.shift();
      this.decals.push({ kind, pos: X.vma(pos, 0.012, n), n: X.vnorm(n), size, rot: Math.random() * 6.28, t: 0, life: o.life || 60, col: o.col || [1, 1, 1] });
    }
    tracer(a, b, o) {
      o = o || {};
      if (this.tracers.length > 60) this.tracers.shift();
      this.tracers.push({ a: a.slice(), b: b.slice(), t: 0, life: o.life || 0.07, w: o.w || 0.03 });
    }
    event(e, game) {
      const rnd = Math.random;
      switch (e.t) {
        case 'impact': {
          const mat = e.mat || 'concrete';
          const wood = /plank|wood|crate|siding|beam|door|bark/.test(mat);
          const snow = /snow|sand/.test(mat);
          const metal = /metal|container|car|barrel|chrome|locker|bars/.test(mat);
          this.add(snow ? 'snow' : 'dust', X.vma(e.p, 0.05, e.n), { vel: X.vscale(e.n, 0.8), size: 0.18, grow: 0.9, life: 0.5, alpha: 0.85, col: snow ? [1, 1, 1] : [0.9, 0.85, 0.8] });
          for (let i = 0; i < (metal ? 5 : 3); i++) {
            const v = X.vadd(X.vscale(e.n, 2 + rnd() * 3), [(rnd() - 0.5) * 3, rnd() * 3, (rnd() - 0.5) * 3]);
            this.add(metal ? 'spark' : wood ? 'chip' : 'dust', e.p, { vel: v, size: metal ? 0.08 : 0.06, life: 0.4, grav: 9, add: metal, stretch: metal ? 1 : 0 });
          }
          if (!e.stick && !/water|glass/.test(mat)) this.decal('hole', e.p, e.n, 0.09);
          break;
        }
        case 'blood': {
          const d = e.dir || [0, 0, 1];
          for (let i = 0; i < (e.head ? 12 : 6); i++) {
            const v = X.vadd(X.vscale(d, 1 + rnd() * 3), [(rnd() - 0.5) * 2, rnd() * 2.5, (rnd() - 0.5) * 2]);
            this.add('drop', e.p, { vel: v, size: 0.05 + rnd() * 0.04, life: 0.6, grav: 9.8 });
          }
          this.add('blood', e.p, { size: e.head ? 0.35 : 0.22, grow: 0.8, life: 0.35, alpha: 0.95 });
          if (game) {
            const h = game.world.ray(e.p, X.vnorm([d[0], d[1] - 0.3, d[2]]), 2.5, X.F.SHOT);
            if (h) this.decal('splat', h.p, h.n, 0.35 + rnd() * 0.3);
            else { const g = game.world.ray(e.p, [0, -1, 0], 3, X.F.SOLID); if (g) this.decal('splat', g.p, g.n, 0.4); }
          }
          break;
        }
        case 'explode': {
          const p = e.p;
          this.add('boom', p, { size: 1.2, grow: 7, life: 0.45, alpha: 1, spin: 0.5 });
          for (let i = 0; i < 12; i++) this.add('smoke', X.vadd(p, [(rnd() - 0.5) * 2, rnd() * 1.5, (rnd() - 0.5) * 2]), { vel: [(rnd() - 0.5) * 3, 1.5 + rnd() * 2, (rnd() - 0.5) * 3], size: 0.8, grow: 2.5, life: 1.6 + rnd(), alpha: 0.8, drag: 1.2 });
          for (let i = 0; i < 16; i++) this.add('spark', p, { vel: [(rnd() - 0.5) * 16, rnd() * 12, (rnd() - 0.5) * 16], size: 0.12, life: 0.7, grav: 10, add: true, stretch: 1 });
          for (let i = 0; i < 6; i++) this.add('fire', X.vadd(p, [(rnd() - 0.5), 0, (rnd() - 0.5)]), { vel: [0, 2 + rnd() * 2, 0], size: 0.7, grow: 1, life: 0.6, add: false });
          if (game) { const g = game.world.ray(X.vadd(p, [0, 0.5, 0]), [0, -1, 0], 3, X.F.SOLID); if (g) this.decal('scorch', g.p, g.n, 2.5); }
          break;
        }
        case 'glass':
          for (let i = 0; i < 14; i++) this.add('glass', X.vadd(e.p, [(rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.8, (rnd() - 0.5) * 0.8]), { vel: [(rnd() - 0.5) * 4, rnd() * 2, (rnd() - 0.5) * 4], size: 0.06 + rnd() * 0.05, life: 0.9, grav: 9.8, spin: 8 });
          break;
        case 'splash':
          this.add('splash', X.vadd(e.p, [0, 0.4, 0]), { size: 0.9, grow: 1.5, life: 0.5 });
          break;
        case 'objBreak':
          for (let i = 0; i < 10; i++) this.add('chip', e.p, { vel: [(rnd() - 0.5) * 5, rnd() * 4, (rnd() - 0.5) * 5], size: 0.08, life: 0.8, grav: 9.8, spin: 10 });
          break;
        case 'shot': {
          if (e.w === 'silenced' || e.w === 'crossbow') break;
          const dist = X.vdist(e.from, e.to);
          if (dist > 2) this.tracer(e.from, e.to, { life: 0.06, w: e.w === 'm60' || e.w === 'sniper' ? 0.045 : 0.03 });
          break;
        }
        case 'fire': {
          if (e.who !== 'player' && game) {
            const c = game.char(e.who);
            if (c && c.state === 'alive') {
              const f = X.fwd(c.yaw, c.pitch || 0), r = X.right(c.yaw);
              const p = c.muzzle || [c.pos[0] + f[0] * 0.75 + r[0] * 0.18, c.pos[1] + (c.crouch > 0.5 ? 1.0 : 1.38) + f[1] * 0.6, c.pos[2] + f[2] * 0.75 + r[2] * 0.18];
              if (e.w !== 'silenced') this.add('nflash', p, { size: e.w === 'shotgun' || e.w === 'm60' ? 0.55 : 0.4, life: 0.06, add: false });
            } else if (e.from) this.add('nflash', e.from, { size: 1.2, life: 0.06 });
          }
          break;
        }
      }
    }
    update(dt, game) {
      this.time += dt;
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.t += dt;
        if (p.t >= p.life) { this.parts.splice(i, 1); continue; }
        p.vel[1] -= p.grav * dt;
        if (p.drag) { const k = Math.exp(-p.drag * dt); p.vel[0] *= k; p.vel[1] *= k; p.vel[2] *= k; }
        p.pos[0] += p.vel[0] * dt; p.pos[1] += p.vel[1] * dt; p.pos[2] += p.vel[2] * dt;
        p.rot += p.spin * dt;
      }
      for (let i = this.tracers.length - 1; i >= 0; i--) { const t = this.tracers[i]; t.t += dt; if (t.t > t.life) this.tracers.splice(i, 1); }
      for (let i = this.decals.length - 1; i >= 0; i--) { const d = this.decals[i]; d.t += dt; if (d.t > d.life) this.decals.splice(i, 1); }
      if (game && game.def.env && (game.def.env.snow || game.def.env.rain)) this.weather(dt, game);
    }
    weather(dt, game) {
      const env = game.def.env;
      const cam = this.camPos || game.player.pos;
      this.wAcc = (this.wAcc || 0) + (env.snow ? env.snow * 70 : env.rain * 260) * dt;
      const n = Math.floor(this.wAcc);
      this.wAcc -= n;
      const roofs = game.world.interiors.filter(b => cam[1] < b[4] + 0.5);
      for (let i = 0; i < n; i++) {
        const p = [cam[0] + (Math.random() - 0.5) * 30, cam[1] + 8 + Math.random() * 6, cam[2] + (Math.random() - 0.5) * 30];
        if (roofs.some(b => p[0] > b[0] - 0.3 && p[0] < b[3] + 0.3 && p[2] > b[2] - 0.3 && p[2] < b[5] + 0.3)) continue;
        if (env.snow) this.add('snow', p, { vel: [0.4 + (Math.random() - 0.5), -1.4 - Math.random(), (Math.random() - 0.5)], size: 0.08 + Math.random() * 0.06, life: 7, alpha: 0.95, drag: 0 });
        else this.add('rain', p, { vel: [0.5, -16, 0.3], size: 0.26, life: 1.1, alpha: 0.55, stretch: 2.6 });
      }
    }
    sprites(view, o) {
      if (!this.tex) return null;
      const V = view.V;
      const right = [V[0], V[4], V[8]], up = [V[1], V[5], V[9]];
      const A = this.data.a, B = this.data.b, D = this.data.d;
      let na = 0, nb = 0, nd = 0;
      const put = (arr, n, p0, p1, p2, p3, uv, col, a) => {
        const o = n * 36;
        const pts = [p0, p1, p2, p3], uvs = [[uv[0], uv[3]], [uv[2], uv[3]], [uv[2], uv[1]], [uv[0], uv[1]]];
        for (let k = 0; k < 4; k++) {
          const q = o + k * 9;
          arr[q] = pts[k][0]; arr[q + 1] = pts[k][1]; arr[q + 2] = pts[k][2];
          arr[q + 3] = uvs[k][0]; arr[q + 4] = uvs[k][1];
          arr[q + 5] = col[0]; arr[q + 6] = col[1]; arr[q + 7] = col[2]; arr[q + 8] = a;
        }
      };
      const game = this.game;
      if (game && !(o && o.hideWorld)) {
        const uvS = this.uv('shadow');
        const chars = (o && o.puppets) || game.chars;
        for (const c of chars) {
          if (c.state === 'hidden' || c.carried || c.invisible) continue;
          if (X.vdist(c.pos, view.pos) > 45) continue;
          const lying = c.state === 'dead' || c.state === 'ko' || c.pose === 'lie';
          const s = lying ? 1.1 : 0.55;
          const y = c.pos[1] + 0.03;
          const f = X.fwd(c.yaw, 0), r = X.right(c.yaw);
          const off = lying ? (c.deathKind === 'front' ? -0.8 : c.deathKind === 'ko' ? 0 : 0.8) : 0;
          const cx = c.pos[0] - f[0] * off, cz = c.pos[2] - f[2] * off;
          const sx = lying && c.deathKind !== 'ko' ? 0.5 : s, sz = s;
          const P = (a, b) => [cx + r[0] * a * sx + f[0] * b * sz, y, cz + r[2] * a * sx + f[2] * b * sz];
          if (nd < 600) put(D, nd++, P(-1, 1), P(1, 1), P(1, -1), P(-1, -1), uvS, [1, 1, 1], 0.7);
        }
      }
      for (const d of this.decals) {
        if (nd >= 600) break;
        if (X.vdist(d.pos, view.pos) > 60) continue;
        const uv = this.uv(d.kind);
        const n = d.n;
        const t1 = X.vnorm(Math.abs(n[1]) > 0.9 ? X.vcross(n, [1, 0, 0]) : X.vcross(n, [0, 1, 0]));
        const t2 = X.vcross(n, t1);
        const c = Math.cos(d.rot), s = Math.sin(d.rot);
        const a = X.vadd(X.vscale(t1, c), X.vscale(t2, s)), b = X.vadd(X.vscale(t1, -s), X.vscale(t2, c));
        const h = d.size;
        const P = (i, j) => [d.pos[0] + (a[0] * i + b[0] * j) * h, d.pos[1] + (a[1] * i + b[1] * j) * h, d.pos[2] + (a[2] * i + b[2] * j) * h];
        put(D, nd++, P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), uv, d.col, Math.min(1, (d.life - d.t) / 3));
      }
      for (const p of this.parts) {
        const arr = p.add ? B : A;
        if ((p.add ? nb : na) >= (p.add ? 1200 : 3000)) continue;
        const k = p.t / p.life;
        const size = p.size * (1 + p.grow * k);
        const alpha = p.alpha * (p.fade ? (1 - Math.max(0, k - 0.5) * 2) : 1);
        const uv = this.uv(p.kind);
        let rx, ry;
        if (p.stretch && (p.vel[0] || p.vel[1] || p.vel[2])) {
          const vd = X.vnorm(p.vel);
          const vs = [X.vdot(vd, right), X.vdot(vd, up)];
          const l = Math.hypot(vs[0], vs[1]) || 1;
          const dx = vs[0] / l, dy = vs[1] / l;
          const L = size * (1 + p.stretch * 2);
          rx = [(right[0] * dx + up[0] * dy) * L, (right[1] * dx + up[1] * dy) * L, (right[2] * dx + up[2] * dy) * L];
          ry = [(-right[0] * dy + up[0] * dx) * size * 0.35, (-right[1] * dy + up[1] * dx) * size * 0.35, (-right[2] * dy + up[2] * dx) * size * 0.35];
        } else {
          const c = Math.cos(p.rot), s = Math.sin(p.rot);
          rx = [(right[0] * c + up[0] * s) * size, (right[1] * c + up[1] * s) * size, (right[2] * c + up[2] * s) * size];
          ry = [(-right[0] * s + up[0] * c) * size, (-right[1] * s + up[1] * c) * size, (-right[2] * s + up[2] * c) * size];
        }
        const q = p.pos;
        const P = (i, j) => [q[0] + rx[0] * i + ry[0] * j, q[1] + rx[1] * i + ry[1] * j, q[2] + rx[2] * i + ry[2] * j];
        if (p.add) put(B, nb++, P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), uv, p.col, alpha);
        else put(A, na++, P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), uv, p.col, alpha);
      }
      const uvT = this.uv('tracer');
      for (const t of this.tracers) {
        if (nb >= 1200) break;
        const dir = X.vsub(t.b, t.a);
        const mid = X.vlerp(t.a, t.b, 0.5);
        const toCam = X.vnorm(X.vsub(view.pos, mid));
        const side = X.vscale(X.vnorm(X.vcross(dir, toCam)), t.w);
        const k = 1 - t.t / t.life;
        const a0 = X.vlerp(t.a, t.b, Math.max(0, 1 - k * 1.3));
        put(B, nb++, X.vsub(a0, side), X.vsub(t.b, side), X.vadd(t.b, side), X.vadd(a0, side), uvT, [1, 0.95, 0.75], k);
      }
      return [{ tex: this.tex, n: nd, data: D, offset: true }, { tex: this.tex, n: na, data: A }, { tex: this.tex, n: nb, data: B, add: true }];
    }
  }
  X.FX = FX;
})(globalThis.XIII = globalThis.XIII || {});
