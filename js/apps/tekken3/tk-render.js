(function (T) {
  'use strict';
  const { clamp, lerp, wrapAngle, MB, GL, vnorm, vadd, vscale, rgb, buildFighter, buildLookColors } = T;

  function canvas(w, h) {
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }

  function sparkTexture() {
    const c = canvas(128, 128), g = c.getContext('2d');
    const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.2, 'rgba(255,255,255,0.85)');
    rg.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    g.globalCompositeOperation = 'lighter';
    g.translate(64, 64);
    for (let i = 0; i < 8; i++) {
      g.rotate(Math.PI / 4);
      const lg = g.createLinearGradient(0, 0, 62, 0);
      lg.addColorStop(0, 'rgba(255,255,255,0.9)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = lg;
      g.beginPath(); g.moveTo(0, -3 - (i % 2) * 2); g.lineTo(i % 2 ? 44 : 62, 0); g.lineTo(0, 3 + (i % 2) * 2); g.fill();
    }
    return c;
  }

  function softTexture() {
    const c = canvas(64, 64), g = c.getContext('2d');
    const rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    rg.addColorStop(0, 'rgba(255,255,255,1)');
    rg.addColorStop(0.6, 'rgba(255,255,255,0.45)');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
    return c;
  }

  function ringTexture() {
    const c = canvas(64, 64), g = c.getContext('2d');
    g.strokeStyle = 'rgba(255,255,255,1)'; g.lineWidth = 5;
    g.beginPath(); g.arc(32, 32, 26, 0, Math.PI * 2); g.stroke();
    g.filter = 'blur(2px)';
    g.stroke();
    return c;
  }

  class Scene {
    constructor(gl) {
      this.gl = gl;
      this.mb = new MB(30000);
      this.fxb = new MB(6000);
      this.shb = new MB(600);
      this.parts = [];
      this.shakeAmt = 0;
      this.cam = null;
      this.flash = 0;
      this.stage = null;
      this.lookCache = new Map();
      this.time = 0;
      if (gl && gl.ok()) {
        this.texSpark = gl.texture(sparkTexture(), true);
        this.texSoft = gl.texture(softTexture(), true);
        this.texRing = gl.texture(ringTexture(), true);
      }
    }

    setStage(st) {
      if (this.stage && this.stage.gpu) this.freeStage(this.stage.gpu);
      this.stage = st;
      if (!st) return;
      st.gpu = T.buildStageGpu ? T.buildStageGpu(this.gl, st) : null;
      this.parts = this.parts.filter(p => !p.amb);
    }

    freeStage(g) {
      for (const k of Object.keys(g)) {
        const v = g[k];
        if (v && v.buf) this.gl.freeMesh(v);
        else if (v && typeof WebGLTexture !== 'undefined' && v instanceof WebGLTexture) this.gl.freeTexture(v);
      }
    }

    shake(s) { this.shakeAmt = Math.max(this.shakeAmt, s); }

    spawn(kind, pos, o) {
      const P = this.parts;
      const opt = o || {};
      if (kind === 'hit' || kind === 'ch' || kind === 'block' || kind === 'parry') {
        const col = kind === 'block' ? [0.55, 0.75, 1] : kind === 'ch' ? [1, 0.35, 0.25] : kind === 'parry' ? [0.6, 1, 0.6] : [1, 0.85, 0.45];
        const size = (kind === 'block' ? 0.35 : 0.45) * (opt.big ? 1.6 : 1);
        P.push({ k: 'spark', p: pos.slice(), s: size, life: 11, t: 0, col, rot: Math.random() * 6 });
        P.push({ k: 'glow', p: pos.slice(), s: size * 1.6, life: 8, t: 0, col });
        if (kind !== 'block') P.push({ k: 'ring', p: pos.slice(), s: size * 0.5, grow: 0.12, life: 12, t: 0, col });
        const n = kind === 'block' ? 6 : opt.big ? 16 : 9;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, b = (Math.random() - 0.3) * 2;
          const sp = 0.05 + Math.random() * 0.08;
          P.push({ k: 'bit', p: pos.slice(), v: [Math.cos(a) * sp, b * 0.05 + 0.02, Math.sin(a) * sp], s: 0.04 + Math.random() * 0.04, life: 14 + Math.random() * 8, t: 0, col, g: 0.006 });
        }
      } else if (kind === 'dust') {
        const n = opt.big ? 10 : 5;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2;
          P.push({ k: 'dust', p: [pos[0] + Math.cos(a) * 0.2, 0.05, pos[2] + Math.sin(a) * 0.2], v: [Math.cos(a) * 0.02, 0.008 + Math.random() * 0.01, Math.sin(a) * 0.02], s: 0.2 + Math.random() * 0.2, grow: 0.012, life: 26 + Math.random() * 10, t: 0, col: opt.col || [0.75, 0.7, 0.62], a: 0.45 });
        }
      } else if (kind === 'fire') {
        P.push({ k: 'glow', p: pos.slice(), v: opt.v || [0, 0.01, 0], s: opt.s || 0.4, grow: 0.02, life: 18, t: 0, col: [1, 0.5 + Math.random() * 0.3, 0.1] });
      } else if (kind === 'amb') {
        P.push(Object.assign({ k: 'amb', amb: true, t: 0 }, opt));
      }
    }

    tickParts() {
      const P = this.parts;
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.t++;
        if (p.v) { p.p[0] += p.v[0]; p.p[1] += p.v[1]; p.p[2] += p.v[2]; if (p.g) p.v[1] -= p.g; if (p.drag) { p.v[0] *= p.drag; p.v[2] *= p.drag; } }
        if (p.grow) p.s += p.grow;
        if (p.k === 'amb' && p.p[1] < 0) { P.splice(i, 1); continue; }
        if (p.life && p.t >= p.life) P.splice(i, 1);
      }
    }

    cameraFor(match, mode) {
      const fs = match.fs;
      const a = fs[0], b = fs[1] || fs[0];
      const mid = [(a.pos[0] + b.pos[0]) / 2, 0, (a.pos[2] + b.pos[2]) / 2];
      const sep = Math.hypot(a.pos[0] - b.pos[0], a.pos[2] - b.pos[2]);
      const air = Math.max(a.pos[1], b.pos[1]);
      const ang = match.camA;
      const L = [Math.sin(ang), 0, -Math.cos(ang)];
      const dist = clamp(2.5 + sep * 0.95, 3.5, 9.5);
      const h = 1.2 + air * 0.35 + (dist - 3.5) * 0.06;
      const at = [mid[0], 0.92 + air * 0.3, mid[2]];
      const eye = [mid[0] - L[0] * dist, h, mid[2] - L[2] * dist];
      return { eye, at, fov: 0.74 };
    }

    updateCamera(target, snap) {
      if (!this.cam || snap) { this.cam = { eye: target.eye.slice(), at: target.at.slice(), fov: target.fov }; return; }
      const k = 0.16;
      for (let i = 0; i < 3; i++) { this.cam.eye[i] = lerp(this.cam.eye[i], target.eye[i], k); this.cam.at[i] = lerp(this.cam.at[i], target.at[i], k); }
      this.cam.fov = lerp(this.cam.fov, target.fov, 0.1);
    }

    lookColors(key, look) {
      let c = this.lookCache.get(key);
      if (!c) { c = buildLookColors(look); this.lookCache.set(key, c); }
      return c;
    }

    render(list, opts) {
      const gl = this.gl;
      if (!gl || !gl.ok()) return;
      const o = opts || {};
      this.time++;
      const st = this.stage;
      const env = st ? st.env : { light: vnorm([0.4, 0.8, 0.45]), lightCol: [0.85, 0.82, 0.75], sky: [0.42, 0.45, 0.52], gnd: [0.22, 0.2, 0.18], fog: [0.3, 0.32, 0.36], fogR: [20, 80], rim: [0.12, 0.12, 0.14], clear: [0.3, 0.32, 0.36] };
      gl.clear(env.clear || env.fog);
      gl.setEnv(env);
      if (!this.cam) this.cam = { eye: [0, 1.4, 4.5], at: [0, 1, 0], fov: 0.72 };
      let eye = this.cam.eye.slice(), at = this.cam.at.slice();
      if (this.shakeAmt > 0.001) {
        const s = this.shakeAmt;
        eye = [eye[0] + (Math.random() - 0.5) * s, eye[1] + (Math.random() - 0.5) * s, eye[2] + (Math.random() - 0.5) * s];
        at = [at[0] + (Math.random() - 0.5) * s * 0.5, at[1] + (Math.random() - 0.5) * s * 0.5, at[2]];
        this.shakeAmt *= 0.82;
      }
      gl.camera(eye, at, this.cam.fov, 0.1, 500);
      gl.setTint(o.tint || [1, 1, 1]);
      if (st && st.gpu && T.drawStage) T.drawStage(gl, st, eye, this.time);
      else {
        const mb = this.mb.reset();
        mb.tquad([-40, 0, 40], [40, 0, 40], [40, 0, -40], [-40, 0, -40], [0.45, 0.42, 0.38], 1);
        gl.drawDyn(mb, {});
      }
      const sh = this.shb.reset();
      for (const it of list) {
        if (it.hidden) continue;
        const p = it.pos, h = Math.max(0, p[1]);
        const r = 0.42 * (it.size || 1) * (1 + (it.lying ? 0.5 : 0)) / (1 + h * 0.6);
        const a = 0.55 / (1 + h * 1.5);
        const y = 0.012;
        sh.tquad([p[0] - r, y, p[2] + r], [p[0] + r, y, p[2] + r], [p[0] + r, y, p[2] - r], [p[0] - r, y, p[2] - r], [0, 0, 0], a, [0, 0, 1, 1]);
      }
      gl.drawDyn(sh, { tex: this.texSoft, blend: true, depthWrite: false, unlit: true });
      const mb = this.mb.reset();
      for (const it of list) {
        if (it.hidden) continue;
        const colors = this.lookColors(it.key, it.look);
        buildFighter(mb, it.j, it.B, it.look, it.pos, it.yaw, { colors });
        if (it.extra) it.extra(mb);
      }
      if (o.flash) gl.setFlash(o.flash);
      gl.drawDyn(mb, {});
      if (o.flash) gl.setFlash(0);
      this.drawParts(eye);
    }

    drawParts(eye) {
      const gl = this.gl;
      const R = gl.camRight, U = gl.camUp;
      const add = this.fxb.reset(), alpha = new MB(2000);
      const buckets = { spark: [], glow: [], ring: [], bit: [], dust: [], amb: [] };
      for (const p of this.parts) (buckets[p.k] || buckets.glow).push(p);
      const quad = (mb, p, s, col, a, rot) => {
        const c = Math.cos(rot || 0), sn = Math.sin(rot || 0);
        const rx = [R[0] * c + U[0] * sn, R[1] * c + U[1] * sn, R[2] * c + U[2] * sn];
        const ux = [U[0] * c - R[0] * sn, U[1] * c - R[1] * sn, U[2] * c - R[2] * sn];
        const P = (sx, sy) => [p[0] + (rx[0] * sx + ux[0] * sy) * s, p[1] + (rx[1] * sx + ux[1] * sy) * s, p[2] + (rx[2] * sx + ux[2] * sy) * s];
        mb.tquad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), col, a, [0, 1, 1, 0]);
      };
      for (const p of buckets.spark) { const k = p.t / p.life; quad(add, p.p, p.s * (0.6 + k * 0.9), p.col, 1 - k, p.rot + k * 0.6); }
      for (const p of buckets.bit) { const k = p.t / p.life; quad(add, p.p, p.s, p.col, 1 - k, 0); }
      for (const p of buckets.glow) { const k = p.t / p.life; quad(add, p.p, p.s * (1 + k * 0.5), p.col, (1 - k) * 0.7, 0); }
      gl.drawDyn(add, { tex: this.texSpark, blend: 'add', depthWrite: false, unlit: true, nofog: true, cull: false });
      const ring = this.fxb.reset();
      for (const p of buckets.ring) { const k = p.t / p.life; quad(ring, p.p, p.s, p.col, (1 - k) * 0.9, 0); }
      gl.drawDyn(ring, { tex: this.texRing, blend: 'add', depthWrite: false, unlit: true, nofog: true, cull: false });
      for (const p of buckets.dust) { const k = p.t / p.life; quad(alpha, p.p, p.s, p.col, (1 - k) * (p.a || 0.5), 0); }
      for (const p of buckets.amb) quad(alpha, p.p, p.s, p.col, p.a || 0.8, p.rot || 0);
      gl.drawDyn(alpha, { tex: this.texSoft, blend: true, depthWrite: false, unlit: true, cull: false });
    }
  }

  Object.assign(T, { Scene, makeCanvas: canvas });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
