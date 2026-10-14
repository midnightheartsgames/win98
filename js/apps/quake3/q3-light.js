(function (Q) {
  'use strict';
  const MAXLUX = 64;
  const ZERO = [0, 0, 0];
  const SKYDIRS = [[0, 0, 1], [0.6, 0, 0.8], [-0.6, 0, 0.8], [0, 0.6, 0.8], [0, -0.6, 0.8]];

  function axesFor(n) {
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
    if (az >= ax && az >= ay) return [0, 1, 2];
    if (ax >= ay) return [1, 2, 0];
    return [0, 2, 1];
  }
  Q.lmAxes = axesFor;

  function pack(rects, W) {
    rects.sort((a, b) => b.h - a.h || b.w - a.w);
    let x = 0, y = 0, rowH = 0;
    for (const r of rects) {
      if (x + r.w + 1 > W) { x = 0; y += rowH + 1; rowH = 0; }
      r.x = x; r.y = y;
      x += r.w + 1;
      if (r.h > rowH) rowH = r.h;
    }
    return y + rowH + 1;
  }

  class Baker {
    constructor(world) {
      this.w = world;
      this.def = world.def;
      this.L = this.def.lmScale || 16;
      this.lights = world.lights.map(l => Object.assign({}, l));
      for (const it of this.def.extraLights || []) this.lights.push(it);
      this.sun = this.def.sun || null;
      if (this.sun) this.sunDir = Q.vnorm(this.sun.dir);
      this.amb = this.def.ambient || [0.1, 0.1, 0.1];
      this.skyAmb = this.def.skyAmbient || (this.def.sky ? Q.vscale(this.def.sky.horizon, 0.22) : [0, 0, 0]);
      this.faceData = [];
      this.progress = 0;
      this.rays = 0;
    }

    layout() {
      const rects = [];
      for (const f of this.w.faces) {
        const info = Q.matInfo(f.mat);
        if (info.sky || info.fullbright || info.nodraw) { this.faceData[f.id] = null; continue; }
        const ax = axesFor(f.n);
        let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
        for (const v of f.verts) {
          umin = Math.min(umin, v[ax[0]]); umax = Math.max(umax, v[ax[0]]);
          vmin = Math.min(vmin, v[ax[1]]); vmax = Math.max(vmax, v[ax[1]]);
        }
        let L = this.L;
        const span = Math.max(umax - umin, vmax - vmin);
        if (span / L + 2 > MAXLUX) L = span / (MAXLUX - 2);
        const w = Math.ceil((umax - umin) / L) + 2, h = Math.ceil((vmax - vmin) / L) + 2;
        const r = { f, ax, umin, vmin, L, w, h, x: 0, y: 0 };
        this.faceData[f.id] = r;
        rects.push(r);
      }
      let W = 512;
      let H = pack(rects, W);
      while (H > W) { W *= 2; H = pack(rects, W); }
      this.W = W;
      this.H = 1;
      while (this.H < H) this.H *= 2;
      this.rects = rects;
      this.data = new Float32Array(this.W * this.H * 3);
      this.valid = new Uint8Array(this.W * this.H);
    }

    lightsNear(f) {
      const out = [];
      for (const l of this.lights) {
        const r = l.intensity;
        if (l.pos[0] < f.min[0] - r || l.pos[0] > f.max[0] + r || l.pos[1] < f.min[1] - r || l.pos[1] > f.max[1] + r || l.pos[2] < f.min[2] - r || l.pos[2] > f.max[2] + r) continue;
        const d = Q.vdot(l.pos, f.n) - f.d;
        if (d < -4) continue;
        out.push(l);
      }
      return out;
    }

    skyVisible(p, dir) {
      this.rays++;
      const t = this.w.trace(p, Q.vma(p, 6000, dir), ZERO, ZERO, Q.MASK_OPAQUE);
      return t.fraction >= 1 || Q.matInfo(t.mat).sky;
    }

    shade(p, n, lights, skyExp, out) {
      out[0] = this.amb[0]; out[1] = this.amb[1]; out[2] = this.amb[2];
      if (this.sun) {
        const ndl = -(n[0] * this.sunDir[0] + n[1] * this.sunDir[1] + n[2] * this.sunDir[2]);
        if (ndl > 0 && skyExp > 0 && this.skyVisible(p, Q.vscale(this.sunDir, -1))) {
          const k = this.sun.intensity * ndl;
          out[0] += this.sun.color[0] * k; out[1] += this.sun.color[1] * k; out[2] += this.sun.color[2] * k;
        }
      }
      if (skyExp > 0) {
        let vis = 0;
        for (const d of SKYDIRS) {
          const nd = n[0] * d[0] + n[1] * d[1] + n[2] * d[2];
          if (nd < -0.2) continue;
          if (this.skyVisible(p, d)) vis += 0.5 + 0.5 * Math.max(0, nd);
        }
        vis /= SKYDIRS.length;
        out[0] += this.skyAmb[0] * vis; out[1] += this.skyAmb[1] * vis; out[2] += this.skyAmb[2] * vis;
      }
      for (const l of lights) {
        const dx = l.pos[0] - p[0], dy = l.pos[1] - p[1], dz = l.pos[2] - p[2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist >= l.intensity) continue;
        let ndl = (n[0] * dx + n[1] * dy + n[2] * dz) / Math.max(1e-3, dist);
        if (ndl <= -0.1) continue;
        ndl = Math.max(0, ndl * 0.85 + 0.15);
        const f = 1 - dist / l.intensity;
        const k = ndl * f * (0.35 + 0.65 * f) * (l.bright || 1.6);
        if (k < 0.004) continue;
        this.rays++;
        const t = this.w.trace(p, l.pos, ZERO, ZERO, Q.MASK_OPAQUE);
        if (t.fraction < 0.995) continue;
        out[0] += l.color[0] * k; out[1] += l.color[1] * k; out[2] += l.color[2] * k;
      }
    }

    faceSkyExposure(f) {
      if (!this.def.sky) return 0;
      const c = Q.vma(f.center, 2, f.n);
      let v = 0;
      for (const d of SKYDIRS) if (Q.vdot(d, f.n) > -0.3 && this.skyVisible(c, d)) v++;
      if (!v && this.sun && Q.vdot(f.n, this.sunDir) < 0 && this.skyVisible(c, Q.vscale(this.sunDir, -1))) v = 1;
      if (!v) {
        for (const vtx of f.verts) {
          const p = Q.vma(Q.vlerp(vtx, f.center, 0.1), 2, f.n);
          if (this.skyVisible(p, [0, 0, 1]) || (this.sun && this.skyVisible(p, Q.vscale(this.sunDir, -1)))) { v = 1; break; }
        }
      }
      return v;
    }

    bakeFace(r) {
      const f = r.f, n = f.n, ax = r.ax, w = this.w;
      const lights = this.lightsNear(f);
      const skyExp = this.faceSkyExposure(f);
      const out = [0, 0, 0];
      for (let j = 0; j < r.h; j++) {
        for (let i = 0; i < r.w; i++) {
          const u = r.umin + (i - 0.5) * r.L, v = r.vmin + (j - 0.5) * r.L;
          const p = [0, 0, 0];
          p[ax[0]] = u; p[ax[1]] = v;
          p[ax[2]] = (f.d - n[ax[0]] * u - n[ax[1]] * v) / n[ax[2]];
          let s = Q.vma(p, 1.5, n);
          let ok = !(w.pointContents(s) & Q.CONTENTS.SOLID);
          for (let k = 0; !ok && k < 5; k++) {
            s = Q.vlerp(s, Q.vma(f.center, 1.5, n), 0.35);
            ok = !(w.pointContents(s) & Q.CONTENTS.SOLID);
          }
          const idx = (r.y + j) * this.W + (r.x + i);
          if (!ok) continue;
          this.shade(s, n, lights, skyExp, out);
          this.data[idx * 3] = out[0]; this.data[idx * 3 + 1] = out[1]; this.data[idx * 3 + 2] = out[2];
          this.valid[idx] = 1;
        }
      }
      this.smooth(r);
    }

    smooth(r) {
      const W = this.W;
      const tmp = new Float32Array(r.w * r.h * 3), cnt = new Float32Array(r.w * r.h);
      for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
        let sr = 0, sg = 0, sb = 0, c = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const ii = i + di, jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= r.w || jj >= r.h) continue;
          const idx = (r.y + jj) * W + r.x + ii;
          if (!this.valid[idx]) continue;
          const wgt = di === 0 && dj === 0 ? 2 : 1;
          sr += this.data[idx * 3] * wgt; sg += this.data[idx * 3 + 1] * wgt; sb += this.data[idx * 3 + 2] * wgt; c += wgt;
        }
        const k = j * r.w + i;
        if (c) { tmp[k * 3] = sr / c; tmp[k * 3 + 1] = sg / c; tmp[k * 3 + 2] = sb / c; cnt[k] = 1; }
      }
      for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
        const k = j * r.w + i, idx = (r.y + j) * W + r.x + i;
        if (!cnt[k]) { this.data[idx * 3] = this.amb[0]; this.data[idx * 3 + 1] = this.amb[1]; this.data[idx * 3 + 2] = this.amb[2]; continue; }
        this.data[idx * 3] = tmp[k * 3]; this.data[idx * 3 + 1] = tmp[k * 3 + 1]; this.data[idx * 3 + 2] = tmp[k * 3 + 2];
        this.valid[idx] = 1;
      }
    }

    bakeGrid() {
      const w = this.w;
      const CS = [64, 64, 96];
      const mn = w.mins.map((v, i) => Math.floor(v / CS[i]) * CS[i]), mx = w.maxs;
      const nx = Math.max(1, Math.ceil((mx[0] - mn[0]) / CS[0]) + 1), ny = Math.max(1, Math.ceil((mx[1] - mn[1]) / CS[1]) + 1), nz = Math.max(1, Math.ceil((mx[2] - mn[2]) / CS[2]) + 1);
      const N = nx * ny * nz;
      const amb = new Float32Array(N * 3), dirc = new Float32Array(N * 3), dir = new Float32Array(N * 3), ok = new Uint8Array(N);
      const hasSky = !!this.def.sky;
      for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const idx = (k * ny + j) * nx + i;
        const p = [mn[0] + i * CS[0], mn[1] + j * CS[1], mn[2] + k * CS[2]];
        if (w.pointContents(p) & Q.CONTENTS.SOLID) continue;
        ok[idx] = 1;
        let ar = this.amb[0] * 1.2, ag = this.amb[1] * 1.2, ab = this.amb[2] * 1.2;
        let dr = 0, dg = 0, db = 0, vx = 0, vy = 0, vz = 0;
        if (hasSky) {
          let vis = 0;
          for (const d of SKYDIRS) if (this.skyVisible(p, d)) vis++;
          vis /= SKYDIRS.length;
          ar += this.skyAmb[0] * vis * 1.4; ag += this.skyAmb[1] * vis * 1.4; ab += this.skyAmb[2] * vis * 1.4;
          if (this.sun && vis > 0 && this.skyVisible(p, Q.vscale(this.sunDir, -1))) {
            const k2 = this.sun.intensity;
            dr += this.sun.color[0] * k2; dg += this.sun.color[1] * k2; db += this.sun.color[2] * k2;
            vx -= this.sunDir[0] * k2; vy -= this.sunDir[1] * k2; vz -= this.sunDir[2] * k2;
          }
        }
        for (const l of this.lights) {
          const dx = l.pos[0] - p[0], dy = l.pos[1] - p[1], dz = l.pos[2] - p[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist >= l.intensity) continue;
          const f = 1 - dist / l.intensity;
          const kk = f * (0.35 + 0.65 * f) * (l.bright || 1.6);
          if (kk < 0.01) continue;
          this.rays++;
          if (w.trace(p, l.pos, ZERO, ZERO, Q.MASK_OPAQUE).fraction < 0.995) continue;
          dr += l.color[0] * kk * 0.75; dg += l.color[1] * kk * 0.75; db += l.color[2] * kk * 0.75;
          ar += l.color[0] * kk * 0.3; ag += l.color[1] * kk * 0.3; ab += l.color[2] * kk * 0.3;
          const inv = kk / Math.max(1, dist);
          vx += dx * inv; vy += dy * inv; vz += dz * inv;
        }
        amb[idx * 3] = ar; amb[idx * 3 + 1] = ag; amb[idx * 3 + 2] = ab;
        dirc[idx * 3] = dr; dirc[idx * 3 + 1] = dg; dirc[idx * 3 + 2] = db;
        const vl = Math.hypot(vx, vy, vz) || 1;
        dir[idx * 3] = vx / vl; dir[idx * 3 + 1] = vy / vl; dir[idx * 3 + 2] = vz / vl || 1;
      }
      this.grid = { mn, CS, nx, ny, nz, amb, dirc, dir, ok };
    }

    run() {
      const t0 = Date.now();
      this.layout();
      for (const r of this.rects) this.bakeFace(r);
      this.bakeGrid();
      const bytes = new Uint8Array(this.W * this.H * 4);
      for (let i = 0; i < this.W * this.H; i++) {
        bytes[i * 4] = Math.min(255, this.data[i * 3] * 127.5);
        bytes[i * 4 + 1] = Math.min(255, this.data[i * 3 + 1] * 127.5);
        bytes[i * 4 + 2] = Math.min(255, this.data[i * 3 + 2] * 127.5);
        bytes[i * 4 + 3] = 255;
      }
      this.bytes = bytes;
      this.ms = Date.now() - t0;
      return this;
    }

    faceUV(f, v) {
      const r = this.faceData[f.id];
      if (!r) return [0, 0];
      const u = (v[r.ax[0]] - r.umin) / r.L + 1, vv = (v[r.ax[1]] - r.vmin) / r.L + 1;
      return [(r.x + u) / this.W, (r.y + vv) / this.H];
    }
  }
  Q.Baker = Baker;

  Q.sampleGrid = function (grid, p, out) {
    const g = grid;
    const fx = (p[0] - g.mn[0]) / g.CS[0], fy = (p[1] - g.mn[1]) / g.CS[1], fz = (p[2] - g.mn[2]) / g.CS[2];
    const x0 = Q.clamp(Math.floor(fx), 0, g.nx - 1), y0 = Q.clamp(Math.floor(fy), 0, g.ny - 1), z0 = Q.clamp(Math.floor(fz), 0, g.nz - 1);
    const tx = Q.clamp(fx - x0, 0, 1), ty = Q.clamp(fy - y0, 0, 1), tz = Q.clamp(fz - z0, 0, 1);
    const a = [0, 0, 0], d = [0, 0, 0], v = [0, 0, 0];
    let tw = 0;
    for (let k = 0; k < 2; k++) for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      const xi = Math.min(g.nx - 1, x0 + i), yi = Math.min(g.ny - 1, y0 + j), zi = Math.min(g.nz - 1, z0 + k);
      const idx = (zi * g.ny + yi) * g.nx + xi;
      if (!g.ok[idx]) continue;
      const wgt = (i ? tx : 1 - tx) * (j ? ty : 1 - ty) * (k ? tz : 1 - tz) + 1e-4;
      for (let c = 0; c < 3; c++) { a[c] += g.amb[idx * 3 + c] * wgt; d[c] += g.dirc[idx * 3 + c] * wgt; v[c] += g.dir[idx * 3 + c] * wgt; }
      tw += wgt;
    }
    if (tw > 0) for (let c = 0; c < 3; c++) { a[c] /= tw; d[c] /= tw; }
    else { a[0] = a[1] = a[2] = 0.5; d[0] = d[1] = d[2] = 0.3; v[2] = 1; }
    const vl = Math.hypot(v[0], v[1], v[2]) || 1;
    out.amb = a; out.dcol = d; out.dir = [v[0] / vl, v[1] / vl, v[2] / vl];
    return out;
  };
})(globalThis.Quake3 = globalThis.Quake3 || {});
