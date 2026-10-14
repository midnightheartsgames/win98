(function (F) {
  'use strict';

  const G = 9.81, STEP = 1 / 120, MAX = 72, LIFE = 32, SINK = 2.2;
  const TOPPLE = new Set(['lamp', 'blamp', 'plamp', 'alamp', 'tlight', 'sign', 'flagpole', 'fflag', 'hlamp', 'slamp', 'windsock', 'citylight', 'tpole', 'gatepost']);
  const WHOLE = new Set(['bin', 'cone', 'barrel', 'bollard', 'crates', 'trolleys', 'flowers', 'cart', 'rblock', 'pump', 'beds', 'sandbox', 'bale']);
  const MATS = {
    wood: ['bench', 'fence', 'picket', 'table', 'crates', 'picnic', 'boat', 'shed', 'cabin', 'lifeguard', 'cafe', 'stall', 'beds', 'sandbox', 'goal', 'pgate'],
    glass: ['phone', 'citylight', 'ghouse'],
    plastic: ['bin', 'cone', 'parasol', 'fflag', 'flowers', 'trolleys', 'cart', 'vnet', 'barrel', 'bale']
  };
  const MAT_OF = {};
  for (const [k, list] of Object.entries(MATS)) for (const t of list) MAT_OF[t] = k;

  class PieceBatch extends F.Batch {
    constructor(cap, rec, key) { super(cap); this.rec = rec; this.key = key; this.depth = 0; }
  }
  for (const name of ['quad', 'triangle', 'box', 'cyl', 'cone', 'disc', 'beam']) {
    const base = F.Batch.prototype[name];
    PieceBatch.prototype[name] = function (...args) {
      if (this.depth++ === 0) this.rec.push({ b: this, i0: this.ni, i1: -1 });
      try { return base.apply(this, args); } finally {
        if (--this.depth === 0) { const g = this.rec[this.rec.length - 1]; g.i1 = this.ni; }
      }
    };
  }

  class NullBatch extends F.Batch {
    constructor() { super(16); }
    need() { this.n = 0; this.ni = 0; }
    v() { return 0; }
    tri() { }
  }

  function qmul(a, b) {
    return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
  }

  function qmat(q, m) {
    const [x, y, z, w] = q;
    m[0] = 1 - 2 * (y * y + z * z); m[1] = 2 * (x * y - z * w); m[2] = 2 * (x * z + y * w);
    m[3] = 2 * (x * y + z * w); m[4] = 1 - 2 * (x * x + z * z); m[5] = 2 * (y * z - x * w);
    m[6] = 2 * (x * z - y * w); m[7] = 2 * (y * z + x * w); m[8] = 1 - 2 * (x * x + y * y);
    return m;
  }

  function yawQuat(yaw) { return [0, Math.sin(-yaw / 2), 0, Math.cos(-yaw / 2)]; }

  function groupBox(g) {
    const b = g.b, f = b.f, I = b.idx, lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (let k = g.i0; k < g.i1; k++) {
      const o = I[k] * 7;
      for (let a = 0; a < 3; a++) { const v = f[o + a]; if (v < lo[a]) lo[a] = v; if (v > hi[a]) hi[a] = v; }
    }
    return { lo, hi };
  }

  function boxGap(a, b) {
    let s = 0;
    for (let k = 0; k < 3; k++) { const d = Math.max(0, a.lo[k] - b.hi[k], b.lo[k] - a.hi[k]); s += d * d; }
    return Math.sqrt(s);
  }

  function volOf(c) {
    return Math.max(0.02, c.hi[0] - c.lo[0]) * Math.max(0.02, c.hi[1] - c.lo[1]) * Math.max(0.02, c.hi[2] - c.lo[2]);
  }

  function cluster(groups, maxN) {
    let cl = groups.filter(g => g.i1 > g.i0).map(g => { const bb = groupBox(g); return { gs: [g], lo: bb.lo, hi: bb.hi }; });
    if (!cl.length) return [];
    if (maxN <= 1) {
      const all = { gs: [], lo: [Infinity, Infinity, Infinity], hi: [-Infinity, -Infinity, -Infinity] };
      for (const c of cl) { all.gs.push(...c.gs); for (let k = 0; k < 3; k++) { all.lo[k] = Math.min(all.lo[k], c.lo[k]); all.hi[k] = Math.max(all.hi[k], c.hi[k]); } }
      return [all];
    }
    const merge = (a, b) => {
      a.gs.push(...b.gs);
      for (let k = 0; k < 3; k++) { a.lo[k] = Math.min(a.lo[k], b.lo[k]); a.hi[k] = Math.max(a.hi[k], b.hi[k]); }
    };
    for (;;) {
      if (cl.length <= 1) break;
      let small = -1, sv = Infinity;
      for (let i = 0; i < cl.length; i++) { const v = volOf(cl[i]); if (v < sv) { sv = v; small = i; } }
      if (cl.length <= maxN && sv > 0.004) break;
      let best = -1, bd = Infinity;
      for (let j = 0; j < cl.length; j++) {
        if (j === small) continue;
        const d = boxGap(cl[small], cl[j]);
        if (d < bd) { bd = d; best = j; }
      }
      merge(cl[best], cl[small]);
      cl.splice(small, 1);
    }
    return cl;
  }

  function pieceMeshes(c) {
    const cx = (c.lo[0] + c.hi[0]) / 2, cy = (c.lo[1] + c.hi[1]) / 2, cz = (c.lo[2] + c.hi[2]) / 2;
    const byKey = new Map();
    for (const g of c.gs) {
      let e = byKey.get(g.b.key);
      if (!e) byKey.set(g.b.key, e = { src: g.b, out: new F.Batch(64), map: new Map() });
      const b = g.b, out = e.out, I = b.idx, S = F.STRIDE;
      for (let k = g.i0; k < g.i1; k += 3) {
        out.need(3, 3);
        const ids = [];
        for (let j = 0; j < 3; j++) {
          const vi = I[k + j];
          let ni = e.map.get(vi);
          if (ni === undefined) {
            ni = out.n++;
            out.u8.set(b.u8.subarray(vi * S, vi * S + S), ni * S);
            out.f[ni * 7] -= cx; out.f[ni * 7 + 1] -= cy; out.f[ni * 7 + 2] -= cz;
            e.map.set(vi, ni);
          }
          ids.push(ni);
        }
        out.tri(ids[0], ids[1], ids[2]);
      }
    }
    return { c: [cx, cy, cz], h: [Math.max(0.03, (c.hi[0] - c.lo[0]) / 2), Math.max(0.03, (c.hi[1] - c.lo[1]) / 2), Math.max(0.03, (c.hi[2] - c.lo[2]) / 2)], meshes: [...byKey.entries()].map(([key, e]) => ({ key, batch: e.out, gpu: null })) };
  }

  class Debris {
    constructor(world, scene) {
      this.world = world;
      this.scene = scene;
      this.list = [];
      this.dead = [];
      this.hits = [];
      this.acc = 0;
      this.rng = F.rng(97);
      this.M = new Float32Array(9);
      this.uid = 1;
    }

    clear() {
      for (const b of this.list) this.dead.push(b);
      this.list.length = 0;
    }

    groundAt(x, z, ref) {
      const w = this.world, s = w.lastSurf, e = w.lastEdge;
      const y = w.ground(x, z, ref);
      w.lastSurf = s; w.lastEdge = e;
      return y;
    }

    propPieces(p, maxN) {
      const rec = [];
      const b = new PieceBatch(512, rec, 'white'), sg = new PieceBatch(64, rec, 'street'), ab = new PieceBatch(64, rec, 'adatlas');
      b.uvw = [0.2, 0.2];
      sg.uvw = F.Street ? F.Street.WHITE_UV : [0.2, 0.2];
      const ch = this.scene && this.scene.chunkAt ? this.scene.chunkAt(p.x, p.z) : null;
      const rng = ch ? F.rng(ch.ix * 31 + ch.iz * 17) : F.rng(1);
      const nb = new NullBatch(), A = F.Ads;
      const build = (q, bb, ss, aa) => {
        if (q.type === 'citylight') { if (A) A.citylight(bb, aa, A.pick('cl', q.theme, q.ad), A.pick('cl', q.theme, q.ad + 7)); }
        else F.Models.buildProp(bb, q, rng, ss);
        if (q.banner && A) { A.flagBrackets(bb); A.flagPair(aa, A.pick('flag', q.banner.theme, q.banner.k)); }
      };
      if (ch) {
        for (const q of ch.props) {
          if (q !== p && q.col_ && q.col_.broken) continue;
          if (q === p) { build(q, b, sg, ab); break; }
          build(q, nb, nb, nb);
        }
      } else build(p, b, sg, ab);
      return cluster(rec, maxN).map(pieceMeshes);
    }

    spawnProp(p, hit, carMass) {
      const speed = Math.hypot(hit.vx || 0, hit.vz || 0);
      const topple = TOPPLE.has(p.type), whole = topple || WHOLE.has(p.type);
      const maxN = whole ? 1 : speed < 9 ? 1 : speed < 16 ? 3 : 4;
      const pieces = this.propPieces(p, maxN);
      if (!pieces.length) return [];
      const total = pieces.reduce((a, pc) => a + pc.h[0] * pc.h[1] * pc.h[2], 0) || 1;
      const mat = MAT_OF[p.type] || 'metal';
      const out = [];
      const cy = Math.cos(p.yaw || 0), sy = Math.sin(p.yaw || 0);
      for (const pc of pieces) {
        const m = Math.max(2, (p.mass || 40) * pc.h[0] * pc.h[1] * pc.h[2] / total);
        const lx = pc.c[0], lz = pc.c[2];
        const wx = p.x + lx * cy - lz * sy, wz = p.z + lx * sy + lz * cy;
        const body = this.add({ x: wx, y: (p.y || 0) + pc.c[1], z: wz, q: yawQuat(p.yaw || 0), m, h: pc.h, look: { kind: 'prop', meshes: pc.meshes }, mat });
        this.launch(body, hit, carMass || 1200, topple, pieces.length);
        out.push(body);
      }
      return out;
    }

    spawnBoard(meshes, x, y, z, yaw, hit, carMass) {
      const out = [];
      const cy = Math.cos(yaw), sy = Math.sin(yaw);
      for (const pc of meshes) {
        const wx = x + pc.c[0] * cy - pc.c[2] * sy, wz = z + pc.c[0] * sy + pc.c[2] * cy;
        const body = this.add({ x: wx, y: y + pc.c[1], z: wz, q: yawQuat(yaw), m: pc.m || 40, h: pc.h, look: { kind: 'prop', meshes: pc.meshes }, mat: pc.mat || 'wood' });
        this.launch(body, hit, carMass || 1200, !!pc.topple, meshes.length);
        out.push(body);
      }
      return out;
    }

    spawnPart(o) {
      const cy = Math.cos(o.yaw), sy = Math.sin(o.yaw);
      const lx = o.c[0], lz = o.c[2];
      const body = this.add({ x: o.x + lx * cy - lz * sy, y: o.y + o.c[1], z: o.z + lx * sy + lz * cy, q: yawQuat(o.yaw), m: o.m || 12, h: o.h, look: o.look, mat: 'metal' });
      const r = this.rng;
      body.v[0] = (o.vx || 0) * (0.75 + r() * 0.2) + (r() - 0.5) * 2 + (o.kx || 0);
      body.v[2] = (o.vz || 0) * (0.75 + r() * 0.2) + (r() - 0.5) * 2 + (o.kz || 0);
      body.v[1] = (o.vy !== undefined ? o.vy : 1.2 + r() * 2.2);
      const s = 1 + Math.hypot(o.vx || 0, o.vz || 0) * 0.15;
      body.w[0] = (r() - 0.5) * 4 * s; body.w[1] = (r() - 0.5) * 3 * s; body.w[2] = (r() - 0.5) * 4 * s;
      return body;
    }

    add(o) {
      if (this.list.length >= MAX) {
        let k = 0, best = -1;
        for (let i = 0; i < this.list.length; i++) { const b = this.list[i]; const s = b.age + (b.sleep ? 100 : 0); if (s > best) { best = s; k = i; } }
        this.dead.push(this.list[k]);
        this.list.splice(k, 1);
      }
      const h = o.h, m = o.m;
      const body = {
        id: this.uid++, x: o.x, y: o.y, z: o.z, q: o.q.slice(), v: [0, 0, 0], w: [0, 0, 0], m, h: h.slice(),
        I: [Math.max(m * 0.012, m / 3 * (h[1] * h[1] + h[2] * h[2])), Math.max(m * 0.012, m / 3 * (h[0] * h[0] + h[2] * h[2])), Math.max(m * 0.012, m / 3 * (h[0] * h[0] + h[1] * h[1]))],
        r: Math.hypot(h[0], h[2]), look: o.look, mat: o.mat, age: 0, sleep: false, still: 0, air: 1, sink: 0, ground: null, gT: 0, model: new Float32Array(16), bang: 0, wet: false
      };
      body.corners = [];
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) body.corners.push([sx * h[0], sy * h[1], sz * h[2]]);
      this.list.push(body);
      return body;
    }

    launch(b, hit, carMass, topple, n) {
      const r = this.rng, vx = hit.vx || 0, vz = hit.vz || 0, V = Math.hypot(vx, vz);
      const k = (1.25 * carMass) / (carMass + b.m);
      const dx = V > 0.1 ? vx / V : -(hit.nx || 0), dz = V > 0.1 ? vz / V : -(hit.nz || 0);
      if (topple) {
        const h = Math.max(1, b.h[1] * 2);
        b.v[0] = vx * 0.45 + (r() - 0.5) * 0.8; b.v[2] = vz * 0.45 + (r() - 0.5) * 0.8; b.v[1] = 0.6 + r() * 0.8;
        const s = (V * 0.85 + 1.5) / h;
        b.w[0] = dz * s * 2 + (r() - 0.5) * 0.6; b.w[1] = (r() - 0.5) * 1.5; b.w[2] = -dx * s * 2 + (r() - 0.5) * 0.6;
        return;
      }
      const spread = n > 1 ? 0.3 : 0.16;
      const side = (r() - 0.5) * 2 * spread * V, kk = k * 0.78;
      b.v[0] = vx * kk * (0.72 + r() * 0.26) - dz * side;
      b.v[2] = vz * kk * (0.72 + r() * 0.26) + dx * side;
      b.v[1] = Math.min(7, 0.8 + V * (0.08 + r() * 0.12));
      const s = 0.6 + V * 0.35 / Math.max(0.4, Math.max(b.h[0], b.h[1], b.h[2]) * 2);
      b.w[0] = (r() - 0.5) * 2 * s + dz * s; b.w[1] = (r() - 0.5) * 2 * s; b.w[2] = (r() - 0.5) * 2 * s - dx * s;
    }

    update(dt, cars, cam) {
      this.hits.length = 0;
      this.acc += Math.min(dt, 0.1);
      let steps = 0;
      while (this.acc >= STEP && steps < 12) { this.acc -= STEP; steps++; }
      if (!steps) return;
      const h = STEP;
      for (let i = this.list.length - 1; i >= 0; i--) {
        const b = this.list[i];
        b.age += h * steps;
        const far = cam ? Math.hypot(b.x - cam.x, b.z - cam.z) : 0;
        if (b.sink > 0 || (b.age > LIFE && (far > 45 || b.age > LIFE * 2)) || far > 700) {
          b.sink += h * steps;
          b.y -= h * steps * 0.35;
          if (b.sink > SINK || far > 700) { this.dead.push(b); this.list.splice(i, 1); }
          continue;
        }
        if (cars) this.push(b, cars);
        if (b.sleep) continue;
        this.groundPlane(b);
        for (let s = 0; s < steps; s++) this.step(b, h);
        this.walls(b);
      }
    }

    groundPlane(b) {
      const ref = b.y + Math.max(b.h[0], b.h[1], b.h[2]) + 1.5;
      const y0 = this.groundAt(b.x, b.z, ref), y1 = this.groundAt(b.x + 0.6, b.z, ref), y2 = this.groundAt(b.x, b.z + 0.6, ref);
      let gx = (y1 - y0) / 0.6, gz = (y2 - y0) / 0.6;
      if (Math.abs(gx) > 1.2 || Math.abs(gz) > 1.2) { gx = 0; gz = 0; }
      b.ground = [y0, gx, gz, b.x, b.z];
      const wet = this.world.isWaterAt && this.world.isWaterAt(b.x, b.z) && y0 < F.WATER_Y;
      if (wet && !b.wet && b.y < F.WATER_Y + 0.2) { b.wet = true; this.hits.push({ x: b.x, y: F.WATER_Y, z: b.z, k: 4, mat: 'water' }); }
      if (b.wet && b.y < F.WATER_Y - 0.3 && !b.sink) b.sink = 0.01;
    }

    step(b, h) {
      const v = b.v, w = b.w, M = this.M;
      v[1] -= G * h;
      if (b.wet) { const k = Math.exp(-h * 3); v[0] *= k; v[1] *= k; v[2] *= k; w[0] *= k; w[1] *= k; w[2] *= k; }
      b.x += v[0] * h; b.y += v[1] * h; b.z += v[2] * h;
      const dq = qmul([w[0] * h * 0.5, w[1] * h * 0.5, w[2] * h * 0.5, 0], b.q);
      const q = b.q;
      q[0] += dq[0]; q[1] += dq[1]; q[2] += dq[2]; q[3] += dq[3];
      const ql = Math.hypot(q[0], q[1], q[2], q[3]) || 1;
      q[0] /= ql; q[1] /= ql; q[2] /= ql; q[3] /= ql;
      qmat(q, M);
      const g = b.ground;
      if (!g || b.wet) return;
      const nl = Math.hypot(g[1], 1, g[2]), nx = -g[1] / nl, ny = 1 / nl, nz = -g[2] / nl;
      let deep = 0, touch = 0, vImp = 0;
      for (let it = 0; it < 2; it++) {
        for (const c of b.corners) {
          const rx = M[0] * c[0] + M[1] * c[1] + M[2] * c[2], ry = M[3] * c[0] + M[4] * c[1] + M[5] * c[2], rz = M[6] * c[0] + M[7] * c[1] + M[8] * c[2];
          const px = b.x + rx, py = b.y + ry, pz = b.z + rz;
          const gy = g[0] + g[1] * (px - g[3]) + g[2] * (pz - g[4]);
          const d = (gy - py) * ny;
          if (d <= 0) continue;
          if (it === 0) { touch++; deep = Math.max(deep, d); }
          const r = [rx, ry, rz];
          let vp = this.pointVel(b, r);
          const vn = vp[0] * nx + vp[1] * ny + vp[2] * nz;
          if (vn >= 0) continue;
          if (it === 0) vImp = Math.max(vImp, -vn);
          const e = -vn > 1.5 ? 0.22 : 0;
          const jn = -(1 + e) * vn / this.kOf(b, r, [nx, ny, nz]);
          this.impulse(b, r, nx * jn, ny * jn, nz * jn);
          vp = this.pointVel(b, r);
          const vdn = vp[0] * nx + vp[1] * ny + vp[2] * nz;
          let tx = vp[0] - vdn * nx, ty = vp[1] - vdn * ny, tz = vp[2] - vdn * nz;
          const tl = Math.hypot(tx, ty, tz);
          if (tl < 1e-4) continue;
          tx /= tl; ty /= tl; tz /= tl;
          const jt = Math.min(tl / this.kOf(b, r, [tx, ty, tz]), 0.72 * jn);
          this.impulse(b, r, -tx * jt, -ty * jt, -tz * jt);
        }
      }
      if (deep > 0) {
        b.y += Math.max(0, deep - 0.003) * 0.6;
        const v2 = v[0] * v[0] + v[1] * v[1] + v[2] * v[2];
        const k = Math.exp(-h * (v2 < 0.3 ? 9 : 2.6));
        w[0] *= k; w[1] *= k; w[2] *= k;
        const kv = Math.exp(-h * 1.5);
        v[0] *= kv; v[2] *= kv;
      }
      if (vImp > 2.5 && b.bang <= 0) { this.hits.push({ x: b.x, y: b.y, z: b.z, k: vImp, mat: b.mat, m: b.m }); b.bang = 0.25; }
      if (b.bang > 0) b.bang -= h;
      b.air = touch ? 0 : b.air + h;
      if (b.air < 0.15 && v[0] * v[0] + v[1] * v[1] + v[2] * v[2] < 0.06 && w[0] * w[0] + w[1] * w[1] + w[2] * w[2] < 0.15) {
        b.still += h;
        if (b.still > 0.6) { b.sleep = true; v[0] = v[1] = v[2] = 0; w[0] = w[1] = w[2] = 0; }
      } else b.still = 0;
    }

    pointVel(b, r) {
      const v = b.v, w = b.w;
      return [v[0] + w[1] * r[2] - w[2] * r[1], v[1] + w[2] * r[0] - w[0] * r[2], v[2] + w[0] * r[1] - w[1] * r[0]];
    }

    invI(b, x) {
      const M = this.M, I = b.I;
      const lx = M[0] * x[0] + M[3] * x[1] + M[6] * x[2], ly = M[1] * x[0] + M[4] * x[1] + M[7] * x[2], lz = M[2] * x[0] + M[5] * x[1] + M[8] * x[2];
      const ax = lx / I[0], ay = ly / I[1], az = lz / I[2];
      return [M[0] * ax + M[1] * ay + M[2] * az, M[3] * ax + M[4] * ay + M[5] * az, M[6] * ax + M[7] * ay + M[8] * az];
    }

    kOf(b, r, n) {
      const rn = [r[1] * n[2] - r[2] * n[1], r[2] * n[0] - r[0] * n[2], r[0] * n[1] - r[1] * n[0]];
      const a = this.invI(b, rn);
      const c = [a[1] * r[2] - a[2] * r[1], a[2] * r[0] - a[0] * r[2], a[0] * r[1] - a[1] * r[0]];
      return 1 / b.m + n[0] * c[0] + n[1] * c[1] + n[2] * c[2];
    }

    impulse(b, r, jx, jy, jz) {
      b.v[0] += jx / b.m; b.v[1] += jy / b.m; b.v[2] += jz / b.m;
      const t = [r[1] * jz - r[2] * jy, r[2] * jx - r[0] * jz, r[0] * jy - r[1] * jx];
      const a = this.invI(b, t);
      b.w[0] += a[0]; b.w[1] += a[1]; b.w[2] += a[2];
    }

    footprint(b) {
      const M = qmat(b.q, this.M);
      let fx = M[0], fz = M[6];
      let l = Math.hypot(fx, fz);
      if (l < 0.3) { fx = M[2]; fz = M[8]; l = Math.hypot(fx, fz) || 1; }
      fx /= l; fz /= l;
      const rx = -fz, rz = fx;
      const ext = (dx, dz) => b.h[0] * Math.abs(M[0] * dx + M[6] * dz) + b.h[1] * Math.abs(M[1] * dx + M[7] * dz) + b.h[2] * Math.abs(M[2] * dx + M[8] * dz);
      const hy = b.h[0] * Math.abs(M[3]) + b.h[1] * Math.abs(M[4]) + b.h[2] * Math.abs(M[5]);
      return { o: { x: b.x, z: b.z, fx, fz, rx, rz, hl: Math.max(0.05, ext(fx, fz)), hw: Math.max(0.05, ext(rx, rz)) }, hy };
    }

    walls(b) {
      const { o, hy } = this.footprint(b);
      const R = Math.max(o.hl, o.hw) + 0.5;
      const list = this.world.colliders(b.x - R, b.z - R, b.x + R, b.z + R);
      for (const c of list) {
        if (c.k === 'smash' || c.broken) continue;
        if (c.y1 !== undefined && (b.y - hy > c.y1 || b.y + hy < c.y0)) continue;
        let hit = null;
        if (c.k === 'box') hit = F.Coll.obbObb(o, c);
        else if (c.k === 'poly') hit = F.Coll.obbPoly(o, c);
        else if (c.k === 'circ') hit = F.Coll.obbCirc(o, c.x, c.z, c.r);
        else if (c.k === 'seg') hit = F.Coll.obbSeg(o, c);
        if (!hit) continue;
        b.x += hit.nx * hit.d; b.z += hit.nz * hit.d;
        o.x = b.x; o.z = b.z;
        const vn = b.v[0] * hit.nx + b.v[2] * hit.nz;
        if (vn < 0) {
          b.v[0] -= 1.3 * vn * hit.nx; b.v[2] -= 1.3 * vn * hit.nz;
          b.v[0] *= 0.7; b.v[2] *= 0.7;
          b.w[1] += (this.rng() - 0.5) * Math.min(6, -vn);
          if (-vn > 3 && b.bang <= 0) { this.hits.push({ x: b.x, y: b.y, z: b.z, k: -vn, mat: b.mat, m: b.m }); b.bang = 0.25; }
        }
        b.sleep = false;
      }
    }

    push(b, cars) {
      for (const car of cars) {
        const dx = b.x - car.x, dz = b.z - car.z;
        if (dx * dx + dz * dz > 49) continue;
        const { o, hy } = this.footprint(b);
        if (b.y - hy > car.y + car.hgt || b.y + hy < car.y - 0.3) continue;
        const co = { x: car.x, z: car.z, fx: Math.sin(car.yaw), fz: -Math.cos(car.yaw), rx: Math.cos(car.yaw), rz: Math.sin(car.yaw), hl: car.hl, hw: car.hw };
        const box = { x: o.x, z: o.z, hx: o.hl, hz: o.hw, c: o.fx, s: o.fz };
        const hit = F.Coll.obbObb(co, box);
        if (!hit) continue;
        const nx = -hit.nx, nz = -hit.nz;
        b.x += nx * hit.d; b.z += nz * hit.d;
        const rvx = b.v[0] - car.vx, rvz = b.v[2] - car.vz, vn = rvx * nx + rvz * nz;
        if (vn < 0) {
          const r = this.rng, k = 1.3 * car.m / (car.m + b.m);
          b.v[0] -= k * vn * nx; b.v[2] -= k * vn * nz;
          b.v[1] = Math.max(b.v[1], Math.min(6, -vn * (0.25 + r() * 0.2)));
          const s = Math.min(9, -vn * 0.8 / Math.max(0.3, b.r));
          b.w[0] += (r() - 0.5) * s + nz * s * 0.5; b.w[1] += (r() - 0.5) * s; b.w[2] += (r() - 0.5) * s - nx * s * 0.5;
          if (-vn > 2.5 && b.bang <= 0) { this.hits.push({ x: b.x, y: b.y, z: b.z, k: -vn, mat: b.mat, m: b.m, car: true }); b.bang = 0.2; }
        }
        b.sleep = false;
        b.still = 0;
      }
    }

    modelOf(b) {
      const M = qmat(b.q, this.M), m = b.model;
      const sink = b.sink > 0 ? Math.min(1, b.sink / SINK) : 0;
      m[0] = M[0]; m[1] = M[3]; m[2] = M[6]; m[3] = 0;
      m[4] = M[1]; m[5] = M[4]; m[6] = M[7]; m[7] = 0;
      m[8] = M[2]; m[9] = M[5]; m[10] = M[8]; m[11] = 0;
      m[12] = b.x; m[13] = b.y - sink * 0.3; m[14] = b.z; m[15] = 1;
      return m;
    }

    drain() {
      const d = this.dead;
      this.dead = [];
      return d;
    }
  }

  const BOARD_UV = [0, 1, 0, 0, 1, 0, 1, 1];

  function boardPieces(kind) {
    const C = F.col, white = C('#ffffff');
    const post = () => { const b = new F.Batch(32); b.box(0, 0, 0, 0.12, 2.4, 0.12, C('#606468'), 0); return b; };
    const panel = new F.Batch(32), face = new F.Batch(16);
    panel.box(0, 0, 0, 3.2, 1.7, 0.05, C('#303236'), 0);
    face.quad([3.1, -1.6, -0.08], [3.1, 1.6, -0.08], [-3.1, 1.6, -0.08], [-3.1, -1.6, -0.08], white, 0, BOARD_UV, [0, 0, -1]);
    face.quad([-3.1, -1.6, 0.08], [-3.1, 1.6, 0.08], [3.1, 1.6, 0.08], [3.1, -1.6, 0.08], white, 0, BOARD_UV, [0, 0, 1]);
    return [
      { c: [-2.6, 2.4, 0], h: [0.12, 2.4, 0.12], m: 35, mat: 'metal', topple: true, meshes: [{ key: 'white', batch: post(), gpu: null }] },
      { c: [2.6, 2.4, 0], h: [0.12, 2.4, 0.12], m: 35, mat: 'metal', topple: true, meshes: [{ key: 'white', batch: post(), gpu: null }] },
      { c: [0, 4.8, 0.06], h: [3.2, 1.7, 0.09], m: 60, mat: 'wood', meshes: [{ key: 'white', batch: panel, gpu: null }, { key: kind === 'xp' ? 'board_xp' : 'board_ft', batch: face, gpu: null }] }
    ];
  }

  function signPieces(kind) {
    const C = F.col, white = C('#ffffff'), pole = new F.Batch(32), face = new F.Batch(16);
    pole.box(0, -0.2, 0, 0.07, 1.6, 0.07, C('#909498'), 0);
    face.quad([0.8, 0.6, -0.05], [0.8, 1.8, -0.05], [-0.8, 1.8, -0.05], [-0.8, 0.6, -0.05], white, 0, BOARD_UV, [0, 0, -1]);
    face.quad([-0.8, 0.6, 0.05], [-0.8, 1.8, 0.05], [0.8, 1.8, 0.05], [0.8, 0.6, 0.05], white, 0, BOARD_UV, [0, 0, 1]);
    return [{ c: [0, 1.8, 0], h: [0.8, 1.8, 0.07], m: 30, mat: 'metal', topple: true, meshes: [{ key: 'white', batch: pole, gpu: null }, { key: 'stunt_' + kind, batch: face, gpu: null }] }];
  }

  F.Debris = Debris;
  F.DebrisKit = { PieceBatch, NullBatch, cluster, pieceMeshes, yawQuat, qmat, boardPieces, signPieces, TOPPLE, WHOLE, MAT_OF };
})(globalThis.Forza = globalThis.Forza || {});
