(function (F) {
  'use strict';

  const S = F.STRIDE, MAT = F.MAT;
  const PART = F.DMG.PART, NP = F.DMG.PARTS.length, TUNE = F.DMG.TUNE;
  const BROKEN = { head: [44, 46, 50], tail: [72, 24, 26] };

  function noise3(x, y, z, s) {
    return F.noise2(x * 5.3 + z * 3.1, y * 5.3 - z * 2.3, s & 0xffff);
  }

  class Dented {
    constructor(geo, lod) {
      const b = geo.lods[lod];
      this.geo = geo;
      this.lod = lod;
      this.nv = b.n;
      this.ni = b.ni;
      this.base = b.u8.slice(0, b.n * S);
      this.bf = new Float32Array(this.base.buffer);
      this.bi8 = new Int8Array(this.base.buffer);
      this.idx = b.idx.slice(0, b.ni);
      this.tags = geo.tagLods[lod];
      this.off = new Float32Array(b.n * 3);
      this.moved = new Uint8Array(b.n);
      this.applied = 0;
      this.last = null;
      this.out = new Uint8Array(this.base.length);
      this.of = new Float32Array(this.out.buffer);
      this.oi8 = new Int8Array(this.out.buffer);
      this.pos = new Float32Array(b.n * 3);
      this.dn = new Float32Array(b.n * 3);
      this.cnt = new Uint8Array(b.n);
      this.dl = new Float32Array(b.n);
      const T = this.ni / 3;
      this.fn0 = new Float32Array(T * 3);
      const f = this.bf, I = this.idx;
      for (let t = 0; t < T; t++) {
        const a = I[t * 3] * 7, c = I[t * 3 + 1] * 7, d = I[t * 3 + 2] * 7;
        const n = cross(f[a], f[a + 1], f[a + 2], f[c], f[c + 1], f[c + 2], f[d], f[d + 1], f[d + 2]);
        this.fn0[t * 3] = n[0]; this.fn0[t * 3 + 1] = n[1]; this.fn0[t * 3 + 2] = n[2];
      }
      this.cen = new Float32Array(NP * 3);
      const cn = new Float32Array(NP);
      for (let v = 0; v < this.nv; v++) {
        const p = this.tags[v];
        if (!p) continue;
        this.cen[p * 3] += f[v * 7]; this.cen[p * 3 + 1] += f[v * 7 + 1]; this.cen[p * 3 + 2] += f[v * 7 + 2];
        cn[p]++;
      }
      for (let p = 0; p < NP; p++) if (cn[p]) for (let k = 0; k < 3; k++) this.cen[p * 3 + k] /= cn[p];
      this.has = cn;
    }

    sync(dmg) {
      const log = dmg.log;
      if (this.applied > log.length || (this.applied && log[this.applied - 1] !== this.last)) {
        this.off.fill(0);
        this.moved.fill(0);
        this.applied = 0;
      }
      for (let i = this.applied; i < log.length; i++) this.add(log[i]);
      this.applied = log.length;
      this.last = log.length ? log[log.length - 1] : null;
    }

    add(rec) {
      if (rec.boom || rec.land || rec.kind === 'tear' || !(rec.d > 0)) return;
      const f = this.bf, off = this.off, r = rec.r, r2 = r * r, seed = rec.s;
      for (let v = 0; v < this.nv; v++) {
        const o = v * 7;
        const dx = f[o] - rec.x, dy = (f[o + 1] - rec.y) * 1.25, dz = f[o + 2] - rec.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 >= r2) continue;
        const t = 1 - d2 / r2, w = t * t;
        const n1 = noise3(f[o], f[o + 1], f[o + 2], seed), n2 = noise3(f[o + 2], f[o], f[o + 1], seed + 7);
        const k = rec.d * w * (0.62 + 0.76 * n1);
        off[v * 3] += rec.nx * k + (n2 - 0.5) * k * 0.3 * Math.abs(rec.nz);
        off[v * 3 + 1] += (n2 - 0.5) * k * 0.55 - k * 0.12;
        off[v * 3 + 2] += rec.nz * k + (n2 - 0.5) * k * 0.3 * Math.abs(rec.nx);
        this.moved[v] = 1;
      }
    }

    compose(dmg) {
      this.sync(dmg);
      const out = this.out, of = this.of, oi8 = this.oi8, f = this.bf, b8 = this.bi8, pos = this.pos, tags = this.tags, st = dmg.st, a = dmg.anim;
      out.set(this.base);
      const info = this.geo.dmgInfo, max = TUNE.maxCrush;
      const hood = info.hood, trunk = info.trunk, scr = info.screen;
      const hoodA = st[PART.hood] === 2 ? 0 : a.hood, trunkA = st[PART.trunk] === 1 ? a.trunk : 0;
      let crack = null;
      if (st[PART.glassF] === 1 && dmg.crack && scr) {
        const ty = scr.y1 - scr.y0, tz = scr.z1 - scr.z0, tl = Math.hypot(ty, tz) || 1;
        crack = { x: dmg.crack.x, y: scr.y0 + ty * 0.4, z: scr.z0 + tz * 0.4, ty: ty / tl, tz: tz / tl, a: F.clamp(Math.round(dmg.crack.R / 1.6 * 255), 20, 255) };
      }
      let anyMove = false;
      for (let v = 0; v < this.nv; v++) {
        const o = v * 7, p3 = v * 3;
        let x = f[o], y = f[o + 1], z = f[o + 2];
        if (this.moved[v]) {
          let ox = this.off[p3], oy = this.off[p3 + 1], oz = this.off[p3 + 2];
          const l = Math.hypot(ox, oy, oz);
          if (l > max) { const k = max / l; ox *= k; oy *= k; oz *= k; }
          x += ox; y += oy; z += oz;
          const cb = o * 4 + 24, m = b8[o * 4 + 23];
          if (m <= 2 || m === MAT.TRIM || m === MAT.CHROME) {
            const sc = noise3(f[o] * 3, f[o + 1] * 3, f[o + 2] * 3, 91);
            const k = 1 - (0.3 + 0.22 * sc) * F.clamp(l / 0.09, 0, 1);
            out[cb] = out[cb] * k; out[cb + 1] = out[cb + 1] * k; out[cb + 2] = out[cb + 2] * k;
          }
          this.dl[v] = Math.min(l, max);
          anyMove = true;
        } else this.dl[v] = 0;
        const p = tags[v];
        if (p) {
          const s = st[p], c = this.cen;
          if (p === PART.hood && hood && hoodA > 0.0005 && s < 2) {
            const qy = y - hood.y, qz = z - hood.z, ca = Math.cos(hoodA), sa = Math.sin(hoodA);
            y = hood.y + qy * ca - qz * sa; z = hood.z + qy * sa + qz * ca;
            anyMove = true;
          } else if (p === PART.trunk && trunk && trunkA > 0.0005) {
            const qy = y - trunk.y, qz = z - trunk.z, ca = Math.cos(trunkA), sa = Math.sin(trunkA);
            y = trunk.y + qy * ca + qz * sa; z = trunk.z - qy * sa + qz * ca;
            anyMove = true;
          } else if ((p === PART.bumperF || p === PART.bumperR) && s === 1) {
            const bi = p === PART.bumperF ? info.bumperF : info.bumperR, hang = dmg.hang[p === PART.bumperF ? 'bumperF' : 'bumperR'];
            const ang = hang * (p === PART.bumperF ? a.bumperF : a.bumperR), px = hang * bi.x;
            const qx = x - px, qy = y - bi.y, ca = Math.cos(ang), sa = Math.sin(ang);
            x = px + qx * ca - qy * sa; y = bi.y + qx * sa + qy * ca;
            z += (p === PART.bumperF ? -1 : 1) * Math.abs(qx) * Math.abs(sa) * 0.12;
            anyMove = true;
          }
          if (s === 2 && p !== PART.headL && p !== PART.headR && p !== PART.tailL && p !== PART.tailR) {
            x = c[p * 3]; y = c[p * 3 + 1] - 0.05; z = c[p * 3 + 2];
            anyMove = true;
          } else if (s === 2) {
            const cb = o * 4 + 24, m = b8[o * 4 + 23], col = p <= PART.headR ? BROKEN.head : BROKEN.tail;
            if (m === MAT.HEAD || m === MAT.TAIL || m === MAT.LENS || m === MAT.REVERSE) {
              oi8[o * 4 + 23] = MAT.TRIM;
              out[cb] = col[0]; out[cb + 1] = col[1]; out[cb + 2] = col[2];
            }
          } else if (p === PART.glassF && crack) {
            oi8[o * 4 + 23] = MAT.CRACK;
            const qx = x - crack.x, qy = y - crack.y, qz = z - crack.z;
            of[o + 3] = qx;
            of[o + 4] = qy * crack.ty + qz * crack.tz;
            out[o * 4 + 27] = crack.a;
          }
        }
        if (dmg.burnt) {
          const cb = o * 4 + 24;
          out[cb] = out[cb] * 0.42; out[cb + 1] = out[cb + 1] * 0.4; out[cb + 2] = out[cb + 2] * 0.38;
        }
        of[o] = x; of[o + 1] = y; of[o + 2] = z;
        pos[p3] = x; pos[p3 + 1] = y; pos[p3 + 2] = z;
      }
      if (anyMove) this.normals();
      return out;
    }

    normals() {
      const I = this.idx, T = this.ni / 3, pos = this.pos, dn = this.dn, cnt = this.cnt, fn0 = this.fn0, b8 = this.bi8, oi8 = this.oi8;
      dn.fill(0);
      cnt.fill(0);
      for (let t = 0; t < T; t++) {
        const ia = I[t * 3], ib = I[t * 3 + 1], ic = I[t * 3 + 2];
        const a = ia * 3, c = ib * 3, d = ic * 3;
        const n = cross(pos[a], pos[a + 1], pos[a + 2], pos[c], pos[c + 1], pos[c + 2], pos[d], pos[d + 1], pos[d + 2]);
        if (!n[3] || (fn0[t * 3] === 0 && fn0[t * 3 + 1] === 0 && fn0[t * 3 + 2] === 0)) continue;
        const ex = n[0] - fn0[t * 3], ey = n[1] - fn0[t * 3 + 1], ez = n[2] - fn0[t * 3 + 2];
        if (ex * ex + ey * ey + ez * ez < 1e-6) continue;
        for (const vi of [ia, ib, ic]) {
          dn[vi * 3] += ex; dn[vi * 3 + 1] += ey; dn[vi * 3 + 2] += ez;
          cnt[vi]++;
        }
      }
      const f = this.bf, dl = this.dl;
      for (let v = 0; v < this.nv; v++) {
        const crush = dl[v];
        if (!cnt[v] && crush < 0.004) continue;
        const o = v * 28 + 20, k = cnt[v] ? 1 / cnt[v] : 0;
        let nx = b8[o] / 127 + dn[v * 3] * k, ny = b8[o + 1] / 127 + dn[v * 3 + 1] * k, nz = b8[o + 2] / 127 + dn[v * 3 + 2] * k;
        if (crush >= 0.004) {
          const q = v * 7, j = Math.min(1, crush / 0.1) * 0.55;
          nx += (noise3(f[q] * 1.9, f[q + 1] * 1.9, f[q + 2] * 1.9, 11) - 0.5) * 2 * j;
          ny += (noise3(f[q] * 1.9, f[q + 1] * 1.9, f[q + 2] * 1.9, 23) - 0.5) * 2 * j;
          nz += (noise3(f[q] * 1.9, f[q + 1] * 1.9, f[q + 2] * 1.9, 37) - 0.5) * 2 * j;
        }
        const l = Math.hypot(nx, ny, nz) || 1;
        oi8[o] = Math.round(nx / l * 127); oi8[o + 1] = Math.round(ny / l * 127); oi8[o + 2] = Math.round(nz / l * 127);
      }
    }

    partBatch(dmg, p) {
      this.sync(dmg);
      if (!this.has[p]) return null;
      const f = this.bf, tags = this.tags, I = this.idx, max = TUNE.maxCrush;
      const P = (v, k) => {
        let ox = this.off[v * 3], oy = this.off[v * 3 + 1], oz = this.off[v * 3 + 2];
        const l = Math.hypot(ox, oy, oz);
        const s = l > max ? max / l : 1;
        return f[v * 7 + k] + [ox, oy, oz][k] * s;
      };
      const map = new Map();
      let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
      const tris = [];
      for (let t = 0; t < this.ni; t += 3) {
        const a = I[t], b = I[t + 1], c = I[t + 2];
        if (tags[a] !== p || tags[b] !== p || tags[c] !== p) continue;
        tris.push(a, b, c);
        for (const v of [a, b, c]) {
          if (map.has(v)) continue;
          map.set(v, map.size);
          for (let k = 0; k < 3; k++) { const q = P(v, k); lo[k] = Math.min(lo[k], q); hi[k] = Math.max(hi[k], q); }
        }
      }
      if (!tris.length) return null;
      const cx = (lo[0] + hi[0]) / 2, cy = (lo[1] + hi[1]) / 2, cz = (lo[2] + hi[2]) / 2;
      const out = new F.Batch(map.size + 4);
      out.need(map.size, tris.length);
      const src = this.base;
      for (const [v, j] of map) {
        out.u8.set(src.subarray(v * S, v * S + S), j * S);
        out.f[j * 7] = P(v, 0) - cx; out.f[j * 7 + 1] = P(v, 1) - cy; out.f[j * 7 + 2] = P(v, 2) - cz;
      }
      out.n = map.size;
      for (const v of tris) out.idx[out.ni++] = map.get(v);
      return { batch: out, c: [cx, cy, cz], h: [Math.max(0.03, (hi[0] - lo[0]) / 2), Math.max(0.03, (hi[1] - lo[1]) / 2), Math.max(0.03, (hi[2] - lo[2]) / 2)] };
    }
  }

  function cross(ax, ay, az, bx, by, bz, cx, cy, cz) {
    const ux = bx - ax, uy = by - ay, uz = bz - az, vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz);
    return l < 1e-10 ? [0, 0, 0, 0] : [nx / l, ny / l, nz / l, 1];
  }

  F.Dents = { Dented, noise3 };
})(globalThis.Forza = globalThis.Forza || {});
