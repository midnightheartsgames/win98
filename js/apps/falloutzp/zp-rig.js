(function (Z) {
  'use strict';

  const M4 = Z.M4;

  Z.eulerMat = (rx, ry, rz, out) => {
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    out = out || new Float32Array(16);
    out[0] = cy * cz + sy * sx * sz; out[1] = cx * sz; out[2] = -sy * cz + cy * sx * sz; out[3] = 0;
    out[4] = -cy * sz + sy * sx * cz; out[5] = cx * cz; out[6] = sy * sz + cy * sx * cz; out[7] = 0;
    out[8] = sy * cx; out[9] = -sx; out[10] = cy * cx; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  };

  class RigDef {
    constructor(bones) {
      this.bones = bones.map((b, i) => Object.assign({ i }, b));
      this.index = {};
      for (const b of this.bones) this.index[b.name] = b.i;
      for (const b of this.bones) {
        const p = b.parent ? this.bones[this.index[b.parent]] : null;
        b.pi = p ? p.i : -1;
        b.off = p ? [b.pos[0] - p.pos[0], b.pos[1] - p.pos[1], b.pos[2] - p.pos[2]] : b.pos.slice();
      }
    }
    get n() { return this.bones.length; }
    bi(name) { return this.index[name]; }
  }
  Z.RigDef = RigDef;

  class Pose {
    constructor(def) {
      this.def = def;
      const n = def.n;
      this.rot = new Float32Array(n * 3);
      this.trans = new Float32Array(n * 3);
      this.scale = new Float32Array(n).fill(1);
      this.world = new Float32Array(n * 16);
      this.skin = new Float32Array(n * 16);
      this.tmp = new Float32Array(16);
      this.tmp2 = new Float32Array(16);
    }
    reset() { this.rot.fill(0); this.trans.fill(0); this.scale.fill(1); }
    set(name, rx, ry, rz) { const i = this.def.index[name]; if (i === undefined) return; this.rot[i * 3] = rx; this.rot[i * 3 + 1] = ry; this.rot[i * 3 + 2] = rz; }
    add(name, rx, ry, rz) { const i = this.def.index[name]; if (i === undefined) return; this.rot[i * 3] += rx; this.rot[i * 3 + 1] += ry; this.rot[i * 3 + 2] += rz; }
    move(name, x, y, z) { const i = this.def.index[name]; if (i === undefined) return; this.trans[i * 3] += x; this.trans[i * 3 + 1] += y; this.trans[i * 3 + 2] += z; }
    solve(rootM) {
      const def = this.def, W = this.world, S = this.skin, L = this.tmp;
      for (const b of def.bones) {
        const i = b.i;
        Z.eulerMat(this.rot[i * 3], this.rot[i * 3 + 1], this.rot[i * 3 + 2], L);
        const sc = this.scale[i];
        if (sc !== 1) for (let k = 0; k < 11; k++) if (k !== 3 && k !== 7) L[k] *= sc;
        L[12] = b.off[0] + this.trans[i * 3]; L[13] = b.off[1] + this.trans[i * 3 + 1]; L[14] = b.off[2] + this.trans[i * 3 + 2];
        const parent = b.pi >= 0 ? W.subarray(b.pi * 16, b.pi * 16 + 16) : rootM;
        M4.mul(parent, L, this.tmp2);
        W.set(this.tmp2, i * 16);
        const o = i * 16;
        for (let k = 0; k < 12; k++) S[o + k] = W[o + k];
        S[o + 12] = W[o + 12] - (W[o] * b.pos[0] + W[o + 4] * b.pos[1] + W[o + 8] * b.pos[2]);
        S[o + 13] = W[o + 13] - (W[o + 1] * b.pos[0] + W[o + 5] * b.pos[1] + W[o + 9] * b.pos[2]);
        S[o + 14] = W[o + 14] - (W[o + 2] * b.pos[0] + W[o + 6] * b.pos[1] + W[o + 10] * b.pos[2]);
        S[o + 15] = 1;
      }
    }
    refresh(names) {
      const def = this.def, W = this.world, S = this.skin, L = this.tmp, dirty = new Set(names.map(n => def.index[n]));
      for (const b of def.bones) {
        if (b.pi < 0 || !dirty.has(b.pi)) continue;
        const i = b.i;
        dirty.add(i);
        Z.eulerMat(this.rot[i * 3], this.rot[i * 3 + 1], this.rot[i * 3 + 2], L);
        L[12] = b.off[0] + this.trans[i * 3]; L[13] = b.off[1] + this.trans[i * 3 + 1]; L[14] = b.off[2] + this.trans[i * 3 + 2];
        M4.mul(W.subarray(b.pi * 16, b.pi * 16 + 16), L, this.tmp2);
        W.set(this.tmp2, i * 16);
        const o = i * 16;
        for (let k = 0; k < 12; k++) S[o + k] = W[o + k];
        S[o + 12] = W[o + 12] - (W[o] * b.pos[0] + W[o + 4] * b.pos[1] + W[o + 8] * b.pos[2]);
        S[o + 13] = W[o + 13] - (W[o + 1] * b.pos[0] + W[o + 5] * b.pos[1] + W[o + 9] * b.pos[2]);
        S[o + 14] = W[o + 14] - (W[o + 2] * b.pos[0] + W[o + 6] * b.pos[1] + W[o + 10] * b.pos[2]);
        S[o + 15] = 1;
      }
    }
    bonePos(name) { const i = this.def.index[name], o = i * 16; return [this.world[o + 12], this.world[o + 13], this.world[o + 14]]; }
    boneMat(name) { const i = this.def.index[name]; return this.world.subarray(i * 16, i * 16 + 16); }
    point(name, x, y, z) { return M4.transform(this.boneMat(name), x, y, z); }
  }
  Z.Pose = Pose;

  class SkinBuilder extends Z.MeshBuilder {
    constructor(def) { super(); this.def = def; this.bone = 0; this.bone2 = 0; this.w2 = 0; }
    boneIndex(name) { const i = this.def.index[name]; if (i === undefined) throw new Error('bone ' + name); return i; }
    useBone(name) { this.bone = this.boneIndex(name); this.bone2 = this.bone; this.w2 = 0; return this; }
    weight(name, name2, w) {
      this.bone = this.boneIndex(name);
      this.bone2 = name2 ? this.boneIndex(name2) : this.bone;
      this.w2 = name2 ? Z.clamp(w || 0, 0, 1) : 0;
      return this;
    }
    v(x, y, z, nx, ny, nz, u, w) {
      const i = super.v(x, y, z, nx, ny, nz, u, w);
      this.mat[i * 4 + 1] = this.bone2;
      this.mat[i * 4 + 2] = Math.round(this.w2 * 255);
      this.mat[i * 4 + 3] = this.bone;
      return i;
    }
    smoothRange(v0, i0) {
      const n = this.n, P = this.pos;
      const key = i => Math.round(P[i * 3] * 4000) + ',' + Math.round(P[i * 3 + 1] * 4000) + ',' + Math.round(P[i * 3 + 2] * 4000);
      const group = new Map(), gi = new Int32Array(n - v0);
      for (let i = v0; i < n; i++) { const k = key(i); let g = group.get(k); if (g === undefined) { g = group.size; group.set(k, g); } gi[i - v0] = g; }
      const gs = new Float32Array(group.size * 3);
      for (let t = i0; t < this.idx.length; t += 3) {
        const a = this.idx[t], b = this.idx[t + 1], c = this.idx[t + 2];
        if (a < v0 || b < v0 || c < v0) continue;
        const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
        const wx = P[c * 3] - P[a * 3], wy = P[c * 3 + 1] - P[a * 3 + 1], wz = P[c * 3 + 2] - P[a * 3 + 2];
        const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
        for (const q of [a, b, c]) { const g = gi[q - v0] * 3; gs[g] += nx; gs[g + 1] += ny; gs[g + 2] += nz; }
      }
      for (let i = v0; i < n; i++) {
        const g = gi[i - v0] * 3, L = Math.hypot(gs[g], gs[g + 1], gs[g + 2]);
        if (L < 1e-12) continue;
        this.nrm[i * 3] = gs[g] / L; this.nrm[i * 3 + 1] = gs[g + 1] / L; this.nrm[i * 3 + 2] = gs[g + 2] / L;
      }
    }
    backfaces(v0, i0) {
      const off = this.n - v0, i1 = this.idx.length;
      for (let i = v0; i < v0 + off; i++) {
        this.n++;
        this.pos.push(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
        this.nrm.push(-this.nrm[i * 3], -this.nrm[i * 3 + 1], -this.nrm[i * 3 + 2]);
        this.uv.push(this.uv[i * 2], this.uv[i * 2 + 1]);
        for (let k = 0; k < 4; k++) { this.col.push(this.col[i * 4 + k]); this.mat.push(this.mat[i * 4 + k]); }
      }
      for (let t = i0; t < i1; t += 3) this.idx.push(this.idx[t] + off, this.idx[t + 2] + off, this.idx[t + 1] + off);
    }
    loft(rings, o = {}) {
      const sides = o.sides || 16, U = o.U || [0, 0, -1], V = o.V || [1, 0, 0];
      const a0 = o.arc ? o.arc[0] : -Math.PI, a1 = o.arc ? o.arc[1] : Math.PI;
      const off = o.off || 0, v0 = this.n, i0 = this.idx.length, cols = sides + 1;
      const A = [U[1] * V[2] - U[2] * V[1], U[2] * V[0] - U[0] * V[2], U[0] * V[1] - U[1] * V[0]];
      let along = 0;
      for (let k = 0; k < rings.length; k++) {
        const R = rings[k];
        if (k) { const q = rings[k - 1].c; along += Math.hypot(R.c[0] - q[0], R.c[1] - q[1], R.c[2] - q[2]); }
        this.weight(R.b || o.b, R.b2 || o.b2, R.w !== undefined ? R.w : (o.w || 0));
        if (R.tint) this.setTint(R.tint[0], R.tint[1], R.tint[2], 255);
        const ex = 2 / (R.n || o.n || 2);
        const per = Math.PI * (R.rx + (R.f !== undefined ? R.f : R.rz)) * (a1 - a0) / (Math.PI * 2);
        for (let i = 0; i <= sides; i++) {
          const ph = a0 + (a1 - a0) * i / sides, sp = Math.sin(ph), cp = Math.cos(ph);
          const fx = Math.sign(sp) * Math.pow(Math.abs(sp), ex), fz = Math.sign(cp) * Math.pow(Math.abs(cp), ex);
          const depth = cp >= 0 ? (R.f !== undefined ? R.f : R.rz) : (R.bk !== undefined ? R.bk : R.rz);
          let px = fx * (R.rx + off), pu = fz * (depth + off);
          if (o.shape) { const e = o.shape(ph, R, k); px += sp * e; pu += cp * e; }
          const Uk = R.U || U, Vk = R.V || V;
          const x = R.c[0] + Uk[0] * pu + Vk[0] * px, y = R.c[1] + Uk[1] * pu + Vk[1] * px, z = R.c[2] + Uk[2] * pu + Vk[2] * px;
          this.v(x, y, z, Uk[0] * cp + Vk[0] * sp, Uk[1] * cp + Vk[1] * sp, Uk[2] * cp + Vk[2] * sp, i / sides * per * (o.uvU || 2), along * (o.uvV || 2));
        }
      }
      const d = rings.length > 1 ? [rings[rings.length - 1].c[0] - rings[0].c[0], rings[rings.length - 1].c[1] - rings[0].c[1], rings[rings.length - 1].c[2] - rings[0].c[2]] : A;
      const flip = o.flip !== undefined ? o.flip : d[0] * A[0] + d[1] * A[1] + d[2] * A[2] < 0;
      const tri = (a, b, c) => { if (flip) this.idx.push(a, c, b); else this.idx.push(a, b, c); };
      for (let k = 0; k + 1 < rings.length; k++) for (let i = 0; i < sides; i++) {
        const p0 = v0 + k * cols + i, p1 = p0 + 1, q0 = p0 + cols, q1 = q0 + 1;
        tri(p0, p1, q0); tri(p1, q1, q0);
      }
      const cap = (k, end) => {
        const R = rings[k];
        this.weight(R.b || o.b, R.b2 || o.b2, R.w !== undefined ? R.w : (o.w || 0));
        const c = this.v(R.c[0], R.c[1], R.c[2], 0, 0, 0, 0, along * (o.uvV || 2));
        for (let i = 0; i < sides; i++) { const p0 = v0 + k * cols + i; if (end) tri(p0, c, p0 + 1); else tri(p0, p0 + 1, c); }
      };
      if (o.capA) cap(0, false);
      if (o.capB) cap(rings.length - 1, true);
      if (o.jag) for (let i = 0; i < cols; i++) { const q = v0 + (rings.length - 1) * cols + i; this.pos[q * 3 + 1] += (Z.hash2(i, 7, o.jag) - 0.5) * 0.06; }
      if (o.post) o.post(v0, this.n);
      this.smoothRange(v0, i0);
      if (o.double) this.backfaces(v0, i0);
      return v0;
    }
    tube(bone, a, b, ra, rb, sides, opts = {}) {
      this.useBone(bone);
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 1;
      const ax = [dx / L, dy / L, dz / L];
      let up = Math.abs(ax[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      let ux = up[1] * ax[2] - up[2] * ax[1], uy = up[2] * ax[0] - up[0] * ax[2], uz = up[0] * ax[1] - up[1] * ax[0];
      const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul;
      const vx = ax[1] * uz - ax[2] * uy, vy = ax[2] * ux - ax[0] * uz, vz = ax[0] * uy - ax[1] * ux;
      const sx = opts.sx || 1, sz = opts.sz || 1;
      const rings = opts.rings || [[0, ra], [1, rb]];
      const base = this.n;
      for (const [t, r] of rings) {
        for (let i = 0; i <= sides; i++) {
          const ang = i / sides * Math.PI * 2;
          const c = Math.cos(ang) * r * sx, s = Math.sin(ang) * r * sz;
          const px = a[0] + dx * t + ux * c + vx * s, py = a[1] + dy * t + uy * c + vy * s, pz = a[2] + dz * t + uz * c + vz * s;
          const nnx = ux * Math.cos(ang) / sx + vx * Math.sin(ang) / sz, nny = uy * Math.cos(ang) / sx + vy * Math.sin(ang) / sz, nnz = uz * Math.cos(ang) / sx + vz * Math.sin(ang) / sz;
          const nl = Math.hypot(nnx, nny, nnz) || 1;
          this.v(px, py, pz, nnx / nl, nny / nl, nnz / nl, i / sides * (opts.uScale || 1), t * L * (opts.vScale || 1));
        }
      }
      const rn = sides + 1;
      for (let k = 0; k + 1 < rings.length; k++) for (let i = 0; i < sides; i++) {
        const p0 = base + k * rn + i, p1 = p0 + 1, q0 = p0 + rn, q1 = q0 + 1;
        this.idx.push(p0, q0, q1, p0, q1, p1);
      }
      if (opts.capA) { const c = this.v(a[0], a[1], a[2], -ax[0], -ax[1], -ax[2], 0.5, 0); for (let i = 0; i < sides; i++) this.idx.push(c, base + i + 1, base + i); }
      if (opts.capB) { const lastBase = base + (rings.length - 1) * rn; const c = this.v(b[0], b[1], b[2], ax[0], ax[1], ax[2], 0.5, 1); for (let i = 0; i < sides; i++) this.idx.push(c, lastBase + i, lastBase + i + 1); }
    }
    ellipsoid(bone, c, r, seg = 10, ring = 8, opts = {}) {
      this.useBone(bone);
      const base = this.n;
      for (let j = 0; j <= ring; j++) {
        const th = j / ring * Math.PI, st = Math.sin(th), ct = Math.cos(th);
        for (let i = 0; i <= seg; i++) {
          const ph = i / seg * Math.PI * 2, sp = Math.sin(ph), cp = Math.cos(ph);
          let nx = st * cp, ny = ct, nz = st * sp;
          let px = nx * r[0], py = ny * r[1], pz = nz * r[2];
          if (opts.deform) { const d = opts.deform(nx, ny, nz); px *= d; py *= d; pz *= d; }
          const nl = Math.hypot(nx / r[0], ny / r[1], nz / r[2]) || 1;
          this.v(c[0] + px, c[1] + py, c[2] + pz, nx / r[0] / nl, ny / r[1] / nl, nz / r[2] / nl, opts.uv ? opts.uv(nx, ny, nz)[0] : i / seg, opts.uv ? opts.uv(nx, ny, nz)[1] : j / ring);
        }
      }
      const rn = seg + 1;
      for (let j = 0; j < ring; j++) for (let i = 0; i < seg; i++) {
        const a = base + j * rn + i, b = a + 1, c2 = a + rn, d = c2 + 1;
        this.idx.push(a, b, d, a, d, c2);
      }
    }
    boneBox(bone, cx, cy, cz, sx, sy, sz, yaw = 0, uvs = 1, sides = 63) {
      this.useBone(bone);
      this.box(cx, cy - sy / 2, cz, sx, sy, sz, yaw, uvs, sides);
    }
  }
  Z.SkinBuilder = SkinBuilder;

  Z.solveIK2 = (a, b, c, target, pole) => {
    const la = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), lb = Math.hypot(c[0] - b[0], c[1] - b[1], c[2] - b[2]);
    let tx = target[0] - a[0], ty = target[1] - a[1], tz = target[2] - a[2];
    let d = Math.hypot(tx, ty, tz);
    const dmax = (la + lb) * 0.999;
    if (d > dmax) { tx *= dmax / d; ty *= dmax / d; tz *= dmax / d; d = dmax; }
    const cosA = Z.clamp((la * la + d * d - lb * lb) / (2 * la * d), -1, 1);
    const ux = tx / d, uy = ty / d, uz = tz / d;
    let px = pole[0] - a[0], py = pole[1] - a[1], pz = pole[2] - a[2];
    const dp = px * ux + py * uy + pz * uz;
    px -= ux * dp; py -= uy * dp; pz -= uz * dp;
    const pl = Math.hypot(px, py, pz) || 1;
    px /= pl; py /= pl; pz /= pl;
    const sinA = Math.sqrt(1 - cosA * cosA);
    const ex = a[0] + (ux * cosA + px * sinA) * la, ey = a[1] + (uy * cosA + py * sinA) * la, ez = a[2] + (uz * cosA + pz * sinA) * la;
    return { elbow: [ex, ey, ez], hand: [a[0] + tx, a[1] + ty, a[2] + tz] };
  };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
