(function (D) {
  'use strict';
  const hex = c => {
    if (Array.isArray(c)) return c;
    const n = parseInt(c.slice(1), 16);
    if (c.length === 4) return [((n >> 8) & 15) / 15, ((n >> 4) & 15) / 15, (n & 15) / 15];
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };

  const m4 = {
    id: () => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]),
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
      return o;
    },
    trans(x, y, z) { const m = m4.id(); m[12] = x; m[13] = y; m[14] = z; return m; },
    scale(x, y, z) { const m = m4.id(); m[0] = x; m[5] = y === undefined ? x : y; m[10] = z === undefined ? x : z; return m; },
    rx(a) { const c = Math.cos(a), s = Math.sin(a), m = m4.id(); m[5] = c; m[6] = s; m[9] = -s; m[10] = c; return m; },
    ry(a) { const c = Math.cos(a), s = Math.sin(a), m = m4.id(); m[0] = c; m[2] = -s; m[8] = s; m[10] = c; return m; },
    rz(a) { const c = Math.cos(a), s = Math.sin(a), m = m4.id(); m[0] = c; m[1] = s; m[4] = -s; m[5] = c; return m; },
    persp(fov, asp, n, f) {
      const t = 1 / Math.tan(fov / 2), m = new Float32Array(16);
      m[0] = t / asp; m[5] = t; m[10] = (f + n) / (n - f); m[11] = -1; m[14] = 2 * f * n / (n - f);
      return m;
    },
    lookAt(e, c, up) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
      let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
      l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
    },
    tp(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; },
    tn(m, x, y, z) { return [m[0] * x + m[4] * y + m[8] * z, m[1] * x + m[5] * y + m[9] * z, m[2] * x + m[6] * y + m[10] * z]; },
    invert(m) {
      const inv = new Float32Array(16);
      inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
      inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
      inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
      inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
      inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
      inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
      inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
      inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
      inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
      inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
      inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
      inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
      inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
      inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
      inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
      inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
      let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
      det = det ? 1 / det : 0;
      for (let i = 0; i < 16; i++) inv[i] *= det;
      return inv;
    }
  };

  class Geo {
    constructor() { this.v = []; }
    get count() { return this.v.length / 11; }
    vert(p, uv, n, c) { this.v.push(p[0], p[1], p[2], uv[0], uv[1], n[0], n[1], n[2], c[0], c[1], c[2]); }
    tri(a, b, c, ua, ub, uc, n, col) {
      col = col || [1, 1, 1];
      if (!n) {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const l = Math.hypot(nx, ny, nz) || 1; n = [nx / l, ny / l, nz / l];
      }
      this.vert(a, ua, n, col); this.vert(b, ub, n, col); this.vert(c, uc, n, col);
      return this;
    }
    quad(a, b, c, d, uv, n, col) {
      uv = uv || [[0, 0], [1, 0], [1, 1], [0, 1]];
      this.tri(a, b, c, uv[0], uv[1], uv[2], n, col);
      this.tri(a, c, d, uv[0], uv[2], uv[3], n, col);
      return this;
    }
    box(x0, y0, z0, x1, y1, z1, o) {
      o = o || {};
      const us = o.us || 1, col = o.col || [1, 1, 1];
      const W = Math.abs(x1 - x0) * us, H = Math.abs(y1 - y0) * us, Dd = Math.abs(z1 - z0) * us;
      const f = o.faces || 'ntbsew';
      const skipTop = o.noTop, skipBot = o.noBot;
      const fr = o.front;
      if (f.includes('s')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], fr || [[0, H], [W, H], [W, 0], [0, 0]], [0, 0, 1], col);
      if (f.includes('n')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [[0, H], [W, H], [W, 0], [0, 0]], [0, 0, -1], col);
      if (f.includes('e')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [[0, H], [Dd, H], [Dd, 0], [0, 0]], [1, 0, 0], col);
      if (f.includes('w')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [[0, H], [Dd, H], [Dd, 0], [0, 0]], [-1, 0, 0], col);
      if (f.includes('t') && !skipTop) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [[0, 0], [W, 0], [W, Dd], [0, Dd]], [0, 1, 0], o.topCol || col);
      if (f.includes('b') && !skipBot) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [[0, 0], [W, 0], [W, Dd], [0, Dd]], [0, -1, 0], col);
      return this;
    }
    taper(cx, y0, cz, w0, d0, w1, d1, h, o) {
      o = o || {};
      const col = o.col || [1, 1, 1], us = o.us || 1;
      const b = [[cx - w0 / 2, y0, cz - d0 / 2], [cx + w0 / 2, y0, cz - d0 / 2], [cx + w0 / 2, y0, cz + d0 / 2], [cx - w0 / 2, y0, cz + d0 / 2]];
      const ox = o.ox || 0, oz = o.oz || 0;
      const t = [[cx + ox - w1 / 2, y0 + h, cz + oz - d1 / 2], [cx + ox + w1 / 2, y0 + h, cz + oz - d1 / 2], [cx + ox + w1 / 2, y0 + h, cz + oz + d1 / 2], [cx + ox - w1 / 2, y0 + h, cz + oz + d1 / 2]];
      const H = Math.abs(h) * us;
      const sides = [[3, 2], [2, 1], [1, 0], [0, 3]];
      sides.forEach(([i, j], k) => {
        const W = (k % 2 ? d0 : w0) * us;
        const uv = k === 0 && o.front ? o.front : [[0, H], [W, H], [W, 0], [0, 0]];
        if (h > 0) this.quad(b[i], b[j], t[j], t[i], uv, null, col);
        else this.quad(b[j], b[i], t[i], t[j], uv, null, col);
      });
      if (!o.noTop) { if (h > 0) this.quad(t[3], t[2], t[1], t[0], null, null, o.topCol || col); else this.quad(t[0], t[1], t[2], t[3], null, null, o.topCol || col); }
      if (!o.noBot) { if (h > 0) this.quad(b[0], b[1], b[2], b[3], null, null, col); else this.quad(b[3], b[2], b[1], b[0], null, null, col); }
      return this;
    }
    cyl(cx, y0, cz, r0, r1, h, n, o) {
      o = o || {};
      const col = o.col || [1, 1, 1], us = o.us || 1;
      const circ = 2 * Math.PI * Math.max(r0, r1) * us;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
        const p0 = [cx + Math.sin(a0) * r0, y0, cz + Math.cos(a0) * r0], p1 = [cx + Math.sin(a1) * r0, y0, cz + Math.cos(a1) * r0];
        const q0 = [cx + Math.sin(a0) * r1, y0 + h, cz + Math.cos(a0) * r1], q1 = [cx + Math.sin(a1) * r1, y0 + h, cz + Math.cos(a1) * r1];
        const u0 = i / n * circ, u1 = (i + 1) / n * circ;
        const n0 = [Math.sin((a0 + a1) / 2), (r0 - r1) / Math.max(0.01, Math.abs(h)), Math.cos((a0 + a1) / 2)];
        const l = Math.hypot(n0[0], n0[1], n0[2]); n0[0] /= l; n0[1] /= l; n0[2] /= l;
        this.quad(p0, p1, q1, q0, [[u0, h * us], [u1, h * us], [u1, 0], [u0, 0]], n0, col);
        if (!o.noTop && r1 > 0.001) this.tri([cx, y0 + h, cz], q0, q1, [0.5, 0.5], [0.5 + Math.sin(a0) / 2, 0.5 + Math.cos(a0) / 2], [0.5 + Math.sin(a1) / 2, 0.5 + Math.cos(a1) / 2], [0, 1, 0], o.topCol || col);
        if (!o.noBot && r0 > 0.001) this.tri([cx, y0, cz], p1, p0, [0.5, 0.5], [0.5, 0], [0, 0.5], [0, -1, 0], col);
      }
      return this;
    }
    sphere(cx, cy, cz, rx, ry, rz, lat, lon, o) {
      o = o || {};
      const col = o.col || [1, 1, 1];
      const P = (i, j) => {
        const th = (i / lat) * Math.PI, ph = (j / lon) * Math.PI * 2;
        return [cx + Math.sin(th) * Math.sin(ph) * rx, cy + Math.cos(th) * ry, cz + Math.sin(th) * Math.cos(ph) * rz];
      };
      const N = (i, j) => { const th = (i / lat) * Math.PI, ph = (j / lon) * Math.PI * 2; return [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)]; };
      for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) {
        const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
        const uv = [[j / lon, i / lat], [j / lon, (i + 1) / lat], [(j + 1) / lon, (i + 1) / lat], [(j + 1) / lon, i / lat]];
        const n = N(i + 0.5, j + 0.5);
        this.tri(a, b, c, uv[0], uv[1], uv[2], n, col);
        this.tri(a, c, d, uv[0], uv[2], uv[3], n, col);
      }
      return this;
    }
    cross(cx, y0, cz, w, h, o) {
      o = o || {};
      const col = o.col || [1, 1, 1];
      const n = o.planes || 2;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI + (o.spin || 0);
        const dx = Math.cos(a) * w / 2, dz = Math.sin(a) * w / 2;
        const nn = [Math.sin(a), 0.5, -Math.cos(a)];
        this.quad([cx - dx, y0, cz - dz], [cx + dx, y0, cz + dz], [cx + dx, y0 + h, cz + dz], [cx - dx, y0 + h, cz - dz], [[0, 1], [1, 1], [1, 0], [0, 0]], nn, col);
        this.quad([cx + dx, y0, cz + dz], [cx - dx, y0, cz - dz], [cx - dx, y0 + h, cz - dz], [cx + dx, y0 + h, cz + dz], [[1, 1], [0, 1], [0, 0], [1, 0]], [-nn[0], 0.5, -nn[2]], col);
      }
      return this;
    }
    hplane(cx, y, cz, w, d, o) {
      o = o || {};
      this.quad([cx - w / 2, y, cz + d / 2], [cx + w / 2, y, cz + d / 2], [cx + w / 2, y, cz - d / 2], [cx - w / 2, y, cz - d / 2], o.uv || [[0, 1], [1, 1], [1, 0], [0, 0]], [0, 1, 0], o.col || [1, 1, 1]);
      if (o.both) this.quad([cx - w / 2, y, cz - d / 2], [cx + w / 2, y, cz - d / 2], [cx + w / 2, y, cz + d / 2], [cx - w / 2, y, cz + d / 2], null, [0, -1, 0], o.col || [1, 1, 1]);
      return this;
    }
    append(g, m) {
      const v = g.v;
      for (let i = 0; i < v.length; i += 11) {
        let p = [v[i], v[i + 1], v[i + 2]], n = [v[i + 5], v[i + 6], v[i + 7]];
        if (m) { p = m4.tp(m, p[0], p[1], p[2]); n = m4.tn(m, n[0], n[1], n[2]); const l = Math.hypot(n[0], n[1], n[2]) || 1; n = [n[0] / l, n[1] / l, n[2] / l]; }
        this.v.push(p[0], p[1], p[2], v[i + 3], v[i + 4], n[0], n[1], n[2], v[i + 8], v[i + 9], v[i + 10]);
      }
      return this;
    }
  }

  const ARMOR_LOOKS = {
    cloth: { tex: 'cloth', col: '#8a7a60', legs: 'cloth', legCol: '#5a4a3a' },
    noble: { tex: 'cloth', col: '#5a4a6a', legs: 'cloth', legCol: '#3a3030', trim: '#c8a050' },
    wedding: { tex: 'cloth', col: '#d8d0c0', legs: 'cloth', legCol: '#a89880', trim: '#6a8a5a' },
    leather: { tex: 'leather', col: '#7a5a3a', legs: 'leather', legCol: '#5a4028' },
    studded: { tex: 'studded', col: '#6a4a30', legs: 'leather', legCol: '#4a3420' },
    dalish: { tex: 'leather', col: '#6a5a3a', legs: 'leather', legCol: '#4a5a34', trim: '#4a6a3a' },
    chain: { tex: 'chain', col: '#9a9aa4', legs: 'chain', legCol: '#8a8a94' },
    warden: { tex: 'chain', col: '#8a90a4', legs: 'chain', legCol: '#6a6a74', tabard: '#3a4a7a', trim: '#c0c0c0' },
    highever: { tex: 'chain', col: '#9a9aa4', legs: 'chain', legCol: '#7a7a84', tabard: '#2a4a9a', trim: '#c8a050' },
    splint: { tex: 'plate', col: '#8a8a90', legs: 'chain', legCol: '#7a7a80' },
    plate: { tex: 'plate', col: '#b0b0b8', legs: 'plate', legCol: '#a0a0a8' },
    templar: { tex: 'plate', col: '#c0c0c8', legs: 'plate', legCol: '#b0b0b8', tabard: '#8a1a1a' },
    dwarfplate: { tex: 'plate', col: '#9a7a60', legs: 'plate', legCol: '#8a6a50' },
    robe: { tex: 'robe', col: '#6a6a8a', legs: 'robe', legCol: '#5a5a7a', skirt: 1 },
    hat: { tex: 'cloth', col: '#6a6a8a' }
  };
  const RACE_SCALE = {
    human: { h: 1, w: 1 }, elf: { h: 0.95, w: 0.9 }, dwarf: { h: 0.74, w: 1.22 }, qunari: { h: 1.22, w: 1.28 },
    hurlock: { h: 1.08, w: 1.08 }, genlock: { h: 0.76, w: 1.3 }, ogre: { h: 1.95, w: 1.9 }, skeleton: { h: 1, w: 0.8 }, spirit: { h: 1.05, w: 1 }
  };

  const itemLook = id => (id && D.ITEMS[id]) || null;
  const armorFor = (look, equip) => {
    const chest = itemLook(equip && equip.chest);
    const key = (chest && chest.look) || look.armor || 'cloth';
    const a = ARMOR_LOOKS[key] || ARMOR_LOOKS.cloth;
    const tint = (chest && chest.tint) || look.tint || a.col;
    return { a, key, col: hex(key === 'robe' || key === 'noble' || key === 'cloth' || key === 'wedding' ? tint : (chest && chest.tint) || a.col), tabard: a.tabard ? hex(look.tint && key !== 'chain' ? look.tint : a.tabard) : null, legCol: hex(a.legCol), trim: a.trim ? hex(a.trim) : null };
  };

  const weaponGeo = (look, g, o) => {
    g = g || new Geo();
    o = o || {};
    const metal = o.col || [0.8, 0.82, 0.88];
    const wood = [0.45, 0.3, 0.18];
    switch (look) {
      case 'dagger': g.box(-0.02, -0.08, -0.02, 0.02, 0.02, 0.02, { col: wood }); g.box(-0.06, 0.02, -0.015, 0.06, 0.04, 0.015, { col: metal }); g.taper(0, 0.04, 0, 0.05, 0.012, 0.005, 0.005, 0.32, { col: metal }); break;
      case 'sword': g.box(-0.02, -0.15, -0.02, 0.02, 0.02, 0.02, { col: wood }); g.box(-0.1, 0.02, -0.02, 0.1, 0.05, 0.02, { col: metal }); g.taper(0, 0.05, 0, 0.06, 0.014, 0.01, 0.008, 0.85, { col: metal }); break;
      case 'greatsword': g.box(-0.025, -0.35, -0.025, 0.025, 0.02, 0.025, { col: wood }); g.box(-0.16, 0.02, -0.025, 0.16, 0.06, 0.025, { col: metal }); g.taper(0, 0.06, 0, 0.09, 0.018, 0.02, 0.01, 1.25, { col: metal }); break;
      case 'axe': g.box(-0.02, -0.15, -0.02, 0.02, 0.62, 0.02, { col: wood }); g.taper(0.1, 0.42, 0, 0.18, 0.02, 0.26, 0.012, 0.2, { col: metal }); break;
      case 'greataxe': g.box(-0.025, -0.4, -0.025, 0.025, 0.95, 0.025, { col: wood }); g.taper(0.14, 0.62, 0, 0.26, 0.025, 0.36, 0.015, 0.32, { col: metal }); g.taper(-0.1, 0.66, 0, 0.14, 0.025, 0.2, 0.015, 0.24, { col: metal }); break;
      case 'mace': g.box(-0.02, -0.15, -0.02, 0.02, 0.5, 0.02, { col: wood }); g.box(-0.08, 0.45, -0.08, 0.08, 0.66, 0.08, { col: metal }); break;
      case 'maul': g.box(-0.025, -0.4, -0.025, 0.025, 0.85, 0.025, { col: wood }); g.box(-0.2, 0.75, -0.1, 0.2, 1.0, 0.1, { col: metal }); break;
      case 'bow': case 'longbow': {
        const L = look === 'longbow' ? 0.8 : 0.6;
        for (let i = 0; i < 6; i++) {
          const a0 = -1 + i / 3, a1 = -1 + (i + 1) / 3;
          const z0 = -Math.cos(a0 * 1.2) * 0.14 + 0.1, z1 = -Math.cos(a1 * 1.2) * 0.14 + 0.1;
          g.box(-0.015, a0 * L, z0 - 0.015, 0.015, a1 * L, z1 + 0.015, { col: wood });
        }
        g.box(-0.004, -L, 0.12, 0.004, L, 0.128, { col: [0.9, 0.9, 0.85] });
        break;
      }
      case 'staff': g.cyl(0, -0.8, 0, 0.025, 0.02, 1.9, 5, { col: wood }); g.box(-0.06, 1.1, -0.06, 0.06, 1.25, 0.06, { col: o.gem || [0.6, 0.8, 1] }); g.box(-0.03, 1.02, -0.07, 0.03, 1.12, 0.07, { col: metal }); break;
      case 'buckler': g.append(new Geo().cyl(0, -0.03, 0, 0.28, 0.28, 0.06, 8, { col: o.shieldCol || [0.55, 0.4, 0.25] }).cyl(0, 0.03, 0, 0.08, 0.05, 0.05, 6, { col: metal }), m4.rz(Math.PI / 2)); break;
      case 'kite': g.append(new Geo().taper(0.08, -0.03, 0, 0.78, 0.52, 0.7, 0.46, 0.06, { col: o.shieldCol || [0.35, 0.4, 0.6] }).box(-0.3, 0.03, -0.025, 0.42, 0.05, 0.025, { col: metal }), m4.rz(Math.PI / 2)); break;
      case 'tower': g.append(new Geo().box(-0.5, -0.03, -0.3, 0.55, 0.04, 0.3, { col: o.shieldCol || [0.45, 0.35, 0.25] }).box(-0.5, 0.04, -0.03, 0.55, 0.06, 0.03, { col: metal }), m4.rz(Math.PI / 2)); break;
      default: g.box(-0.02, -0.1, -0.02, 0.02, 0.6, 0.02, { col: metal });
    }
    return g;
  };

  const part = (name, parent, pivot, batches) => ({ name, parent, pivot, batches });

  const buildHumanoid = (look, equip) => {
    const rk = look.kind === 'hurlock' ? 'hurlock' : look.kind === 'genlock' ? 'genlock' : look.kind === 'ogre' ? 'ogre' : look.kind === 'skeleton' ? 'skeleton' : look.race || 'human';
    const rs = RACE_SCALE[rk] || RACE_SCALE.human;
    const fem = look.sex === 'f';
    const S = (look.scale || 1) * rs.h * (fem ? 0.95 : 1);
    const Wd = rs.w * (fem ? 0.9 : 1) * (look.fat ? 1.2 : 1) * (look.scale || 1);
    const ds = rk === 'hurlock' || rk === 'genlock' || rk === 'ogre';
    const skel = rk === 'skeleton';
    const skinTex = ds ? 'darkspawn' : skel ? 'bone' : 'skin';
    const skinCol = ds ? hex(rk === 'ogre' ? '#8a7868' : rk === 'genlock' ? '#8a8478' : '#7a7a74') : skel ? [0.9, 0.88, 0.8] : hex(look.skin || '#e0b896');
    const ar = armorFor(look, equip);
    const bodyTex = ds && !equip ? 'darkspawn' : skel ? 'bone' : ar.a.tex;
    const bodyCol = ds && !equip ? skinCol : skel ? skinCol : ar.col;
    const legTex = skel ? 'bone' : ar.a.legs === 'robe' ? 'cloth' : ar.a.legs;
    const legCol = skel ? skinCol : ar.legCol;
    const gloves = itemLook(equip && equip.gloves), boots = itemLook(equip && equip.boots), head = itemLook(equip && equip.head);
    const handTex = gloves ? (ARMOR_LOOKS[gloves.look] || ARMOR_LOOKS.leather).tex : skinTex;
    const handCol = gloves ? hex((ARMOR_LOOKS[gloves.look] || ARMOR_LOOKS.leather).col) : skinCol;
    const footTex = boots ? (ARMOR_LOOKS[boots.look] || ARMOR_LOOKS.leather).tex : 'leather';
    const footCol = boots ? hex((ARMOR_LOOKS[boots.look] || ARMOR_LOOKS.leather).col) : [0.35, 0.25, 0.18];
    const parts = [];
    const legL = 0.47 * S, shinL = 0.44 * S, hip = legL + shinL + 0.05 * S;
    const torsoH = 0.58 * S, shW = (fem ? 0.36 : 0.42) * Wd, waistW = (fem ? 0.26 : 0.3) * Wd;
    const add = (name, parent, pivot, list) => { parts.push(part(name, parent, pivot, list)); return parts.length - 1; };
    const G = () => new Geo();
    const pelvis = add('pelvis', -1, [0, hip, 0], [{ tex: legTex, col: legCol, geo: G().box(-waistW / 2 - 0.01, -0.08 * S, -0.11 * Wd, waistW / 2 + 0.01, 0.07 * S, 0.11 * Wd) }]);
    const torsoGeo = G().taper(0, 0, 0, waistW, 0.2 * Wd, shW, 0.24 * Wd, torsoH, { front: [[0, 1], [1, 1], [1, 0], [0, 0]] });
    const torsoB = [{ tex: bodyTex, col: bodyCol, geo: torsoGeo }];
    if (ar.tabard) torsoB.push({ tex: 'cloth', col: ar.tabard, geo: G().box(-waistW * 0.42, -0.35 * S, 0.105 * Wd, waistW * 0.42, torsoH * 0.85, 0.13 * Wd, { faces: 's' }).box(-waistW * 0.42, -0.35 * S, -0.13 * Wd, waistW * 0.42, torsoH * 0.85, -0.105 * Wd, { faces: 'n' }) });
    if (ar.trim) torsoB.push({ tex: 'gold', col: ar.trim, geo: G().box(-waistW / 2 - 0.012, -0.005, -0.112 * Wd, waistW / 2 + 0.012, 0.04, 0.112 * Wd, { faces: 'nsew' }) });
    if (fem && !skel && !ds) torsoB.push({ tex: bodyTex, col: bodyCol, geo: G().box(-shW * 0.36, torsoH * 0.52, 0.1 * Wd, shW * 0.36, torsoH * 0.8, 0.16 * Wd) });
    if (ar.key === 'plate' || ar.key === 'splint' || ar.key === 'templar' || ar.key === 'dwarfplate' || rk === 'hurlock') torsoB.push({ tex: 'plate', col: ar.col, geo: G().box(-shW / 2 - 0.06, torsoH - 0.12, -0.13 * Wd, -shW / 2 + 0.08, torsoH + 0.03, 0.13 * Wd).box(shW / 2 - 0.08, torsoH - 0.12, -0.13 * Wd, shW / 2 + 0.06, torsoH + 0.03, 0.13 * Wd) });
    if (ds && rk !== 'genlock') torsoB.push({ tex: 'metal', col: [0.35, 0.33, 0.32], geo: G().taper(-shW / 2, torsoH, 0, 0.06, 0.06, 0.0, 0.0, 0.22 * S).taper(shW / 2, torsoH, 0, 0.06, 0.06, 0, 0, 0.22 * S) });
    const torso = add('torso', pelvis, [0, 0.06 * S, 0], torsoB);
    if (ar.a.skirt) parts[pelvis].batches.push({ tex: 'robe', col: ar.col, geo: G().taper(0, 0.05 * S, 0, waistW + 0.04, 0.26 * Wd, waistW + 0.22, 0.4 * Wd, -hip + 0.1, { noBot: false }) });
    else if (ar.tabard) parts[pelvis].batches.push({ tex: 'cloth', col: ar.tabard, geo: G().box(-waistW * 0.4, -0.45 * S, 0.12 * Wd, waistW * 0.4, 0.05, 0.14 * Wd, { faces: 's' }) });
    const hs = (rk === 'genlock' || rk === 'ogre' ? 1.25 : 1) * (look.scale ? Math.pow(look.scale, 0.3) : 1) * Math.pow(rs.h, 0.35);
    const hw = 0.2 * hs * (rk === 'qunari' ? 1.1 : 1), hh = 0.25 * hs, hd = 0.23 * hs;
    const faceTex = 'face:' + JSON.stringify({ race: look.race, sex: look.sex, skin: look.skin, hair: look.hair, eyes: look.eyes, beard: look.beard, tattoo: look.tattoo, kind: look.kind, ghost: look.ghost });
    const headB = [
      { tex: skinTex, col: skinCol, geo: G().box(-hw / 2, 0.02, -hd / 2, hw / 2, hh, hd / 2, { faces: 'ntbew' }).box(-0.05 * hs, -0.06, -0.05 * hs, 0.05 * hs, 0.04, 0.05 * hs) },
      { tex: skel ? 'bone' : faceTex, col: skel ? skinCol : [1, 1, 1], face: !skel, geo: G().box(-hw / 2, 0.02, -hd / 2, hw / 2, hh, hd / 2 + 0.005, { faces: 's', front: [[0, 1], [1, 1], [1, 0], [0, 0]] }) }
    ];
    if (skel) headB.push({ tex: 'plain', col: [0.05, 0.05, 0.05], geo: G().box(-hw * 0.35, hh * 0.5, hd / 2, -hw * 0.1, hh * 0.7, hd / 2 + 0.01, { faces: 's' }).box(hw * 0.1, hh * 0.5, hd / 2, hw * 0.35, hh * 0.7, hd / 2 + 0.01, { faces: 's' }) });
    if (!ds && !skel) headB.push({ tex: skinTex, col: skinCol, geo: G().box(-0.018, hh * 0.35, hd / 2, 0.018, hh * 0.62, hd / 2 + 0.04) });
    if (look.race === 'elf') headB.push({ tex: skinTex, col: skinCol, geo: G().taper(-hw / 2 - 0.01, hh * 0.45, -0.02, 0.02, 0.05, 0.004, 0.02, 0.12, { ox: -0.06 }).taper(hw / 2 + 0.01, hh * 0.45, -0.02, 0.02, 0.05, 0.004, 0.02, 0.12, { ox: 0.06 }) });
    const hair = hex(look.hair || '#3a2414');
    const hst = look.hairStyle || (fem ? 'long' : 'short');
    const helmItem = head ? head.look : look.helm;
    if (!ds && !skel && !(helmItem && helmItem !== 'hat')) {
      const hg = G();
      if (hst !== 'bald') hg.box(-hw / 2 - 0.012, hh * 0.72, -hd / 2 - 0.012, hw / 2 + 0.012, hh + 0.03, hd / 2 + 0.01);
      if (hst === 'long') hg.box(-hw / 2 - 0.015, -0.14, -hd / 2 - 0.03, hw / 2 + 0.015, hh + 0.02, -hd / 2 + 0.06).box(-hw / 2 - 0.02, 0.0, -hd / 2, -hw / 2 + 0.01, hh, hd / 2 - 0.04).box(hw / 2 - 0.01, 0.0, -hd / 2, hw / 2 + 0.02, hh, hd / 2 - 0.04);
      if (hst === 'short') hg.box(-hw / 2 - 0.012, hh * 0.3, -hd / 2 - 0.015, hw / 2 + 0.012, hh + 0.02, -hd / 2 + 0.05);
      if (hst === 'tail') hg.box(-hw / 2 - 0.012, hh * 0.3, -hd / 2 - 0.015, hw / 2 + 0.012, hh + 0.02, -hd / 2 + 0.05).box(-0.035, -0.18, -hd / 2 - 0.06, 0.035, hh * 0.6, -hd / 2 - 0.01);
      if (hst === 'braids') hg.box(-hw / 2 - 0.015, hh * 0.3, -hd / 2 - 0.015, hw / 2 + 0.015, hh + 0.02, -hd / 2 + 0.05).box(-hw / 2 - 0.04, -0.2, -0.03, -hw / 2 - 0.005, hh * 0.6, 0.02).box(hw / 2 + 0.005, -0.2, -0.03, hw / 2 + 0.04, hh * 0.6, 0.02);
      if (hst === 'crop') hg.box(-hw / 2 - 0.006, hh * 0.78, -hd / 2 - 0.006, hw / 2 + 0.006, hh + 0.012, hd / 2 - 0.02);
      if (hst !== 'bald') headB.push({ tex: 'hair', col: hair, geo: hg });
    }
    if (look.beard && look.beard !== 'none' && look.beard !== 'stubble' && !fem && !helmItem) {
      const bl = look.race === 'dwarf' ? 0.2 : 0.09;
      const bg = G().box(-hw / 2 + 0.01, -bl, hd / 2 - 0.08, hw / 2 - 0.01, hh * 0.32, hd / 2 + 0.03);
      if (look.beard === 'goatee') { bg.v = []; bg.box(-0.04, -bl * 0.6, hd / 2 - 0.02, 0.04, hh * 0.2, hd / 2 + 0.03); }
      headB.push({ tex: 'hair', col: hair, geo: bg });
    }
    if (helmItem) {
      const hg = G();
      let hc = [0.72, 0.72, 0.76], ht = 'metal';
      if (helmItem === 'chain') { ht = 'chain'; hg.box(-hw / 2 - 0.025, -0.08, -hd / 2 - 0.025, hw / 2 + 0.025, hh + 0.03, hd / 2 - 0.02, { faces: 'ntew' }).box(-hw / 2 - 0.025, hh * 0.75, -hd / 2 - 0.025, hw / 2 + 0.025, hh + 0.03, hd / 2 + 0.02, { faces: 'ts' }); }
      else if (helmItem === 'leather' || helmItem === 'studded' || helmItem === 'dalish') { ht = 'leather'; hc = [0.5, 0.36, 0.22]; hg.box(-hw / 2 - 0.02, hh * 0.55, -hd / 2 - 0.02, hw / 2 + 0.02, hh + 0.04, hd / 2 + 0.02); }
      else if (helmItem === 'hat') { ht = 'cloth'; hc = hex(look.tint || '#6a6a8a'); hg.cyl(0, hh * 0.85, 0, hw * 0.9, hw * 0.9, 0.02, 8).cyl(0, hh * 0.85, -0.02, hw * 0.5, 0.02, 0.28, 6); }
      else { hc = helmItem === 'dwarfplate' ? [0.62, 0.5, 0.4] : [0.72, 0.72, 0.78]; hg.box(-hw / 2 - 0.03, -0.03, -hd / 2 - 0.03, hw / 2 + 0.03, hh + 0.05, hd / 2 + 0.03, { faces: 'ntew' }).box(-hw / 2 - 0.03, hh * 0.55, hd / 2, hw / 2 + 0.03, hh + 0.05, hd / 2 + 0.03, { faces: 's' }).box(-hw / 2 - 0.03, -0.03, hd / 2, -0.02, hh * 0.45, hd / 2 + 0.03, { faces: 's' }).box(0.02, -0.03, hd / 2, hw / 2 + 0.03, hh * 0.45, hd / 2 + 0.03, { faces: 's' }); }
      headB.push({ tex: ht, col: hc, geo: hg });
    }
    if (rk === 'ogre') headB.push({ tex: 'bone', col: [0.85, 0.8, 0.7], geo: G().taper(-hw / 2, hh * 0.8, 0, 0.08, 0.08, 0.01, 0.01, 0.3, { ox: -0.18 }).taper(hw / 2, hh * 0.8, 0, 0.08, 0.08, 0.01, 0.01, 0.3, { ox: 0.18 }) });
    if (rk === 'hurlock' && !helmItem) headB.push({ tex: 'metal', col: [0.4, 0.38, 0.36], geo: G().box(-hw / 2 - 0.02, hh * 0.6, -hd / 2 - 0.02, hw / 2 + 0.02, hh + 0.05, hd / 2 + 0.02, { faces: 'ntew' }).taper(0, hh + 0.05, 0, 0.05, 0.12, 0.0, 0.0, 0.14) });
    if (look.race === 'qunari' && look.horns) headB.push({ tex: 'bone', col: [0.8, 0.75, 0.65], geo: G().taper(-hw / 2, hh * 0.8, 0, 0.06, 0.06, 0.01, 0.01, 0.25, { ox: -0.1, oz: -0.1 }).taper(hw / 2, hh * 0.8, 0, 0.06, 0.06, 0.01, 0.01, 0.25, { ox: 0.1, oz: -0.1 }) });
    const neckH = rk === 'ogre' ? torsoH * 0.92 : torsoH;
    const headI = add('head', torso, [0, neckH + 0.04 * S, rk === 'ogre' ? 0.12 : 0], headB);
    const armW = (rk === 'ogre' ? 0.2 : 0.1) * Wd, uaL = 0.3 * S * (rk === 'ogre' ? 1.1 : 1), faL = 0.27 * S * (rk === 'ogre' ? 1.15 : 1);
    const armTex = bodyTex, armCol = bodyCol;
    const heavyArm = ar.key === 'plate' || ar.key === 'splint' || ar.key === 'templar' || ar.key === 'dwarfplate';
    for (const side of [-1, 1]) {
      const nm = side < 0 ? 'L' : 'R';
      const ua = add('uarm' + nm, torso, [side * (shW / 2 + armW * 0.35), torsoH - 0.04, 0], [{ tex: armTex, col: armCol, geo: G().taper(0, 0, 0, armW * 1.1, armW * 1.1, armW, armW, -uaL) }]);
      const faB = [{ tex: ar.a.skirt ? 'robe' : heavyArm ? 'plate' : skinTex, col: ar.a.skirt ? armCol : heavyArm ? armCol : skinCol, geo: G().taper(0, 0, 0, armW, armW, armW * 0.8, armW * 0.8, -faL) }];
      if (ar.a.skirt) faB.push({ tex: 'robe', col: armCol, geo: G().taper(0, -faL * 0.3, 0, armW * 1.1, armW * 1.1, armW * 1.8, armW * 1.8, -faL * 0.72) });
      const fa = add('farm' + nm, ua, [0, -uaL, 0], faB);
      if (gloves && !heavyArm) parts[fa].batches.push({ tex: handTex, col: handCol, geo: G().taper(0, -faL * 0.55, 0, armW * 0.95, armW * 0.95, armW * 0.9, armW * 0.9, -faL * 0.45) });
      add('hand' + nm, fa, [0, -faL, 0], [{ tex: handTex, col: handCol, geo: G().box(-armW * 0.45, -0.1 * S * (rk === 'ogre' ? 1.6 : 1), -armW * 0.5, armW * 0.45, 0, armW * 0.55) }]);
    }
    const legW = 0.13 * Wd;
    for (const side of [-1, 1]) {
      const nm = side < 0 ? 'L' : 'R';
      const th = add('thigh' + nm, pelvis, [side * waistW * 0.28, -0.04 * S, 0], [{ tex: legTex, col: legCol, geo: G().taper(0, 0, 0, legW * 1.15, legW * 1.2, legW, legW, -legL) }]);
      const sh = add('shin' + nm, th, [0, -legL, 0], [{ tex: boots ? footTex : legTex, col: boots ? footCol : legCol, geo: G().taper(0, 0, 0, legW, legW, legW * 0.85, legW * 0.85, -shinL) }]);
      add('foot' + nm, sh, [0, -shinL, 0], [{ tex: footTex, col: footCol, geo: G().box(-legW * 0.5, -0.06 * S, -0.05 * S, legW * 0.5, 0.02, 0.17 * S * (rk === 'ogre' ? 1.3 : 1)) }]);
    }
    const w = itemLook(equip && equip.main);
    const off = itemLook(equip && equip.off);
    const mainLook = w ? w.look : look.weapon || null;
    const metalCol = w && w.tier >= 3 ? [0.86, 0.88, 0.95] : w && w.tier === 2 ? [0.62, 0.64, 0.7] : [0.7, 0.68, 0.66];
    if (mainLook) add('weapon', parts.findIndex(p => p.name === 'handR'), [0, -0.06 * S, 0.02], [{ tex: 'metal', col: [1, 1, 1], geo: weaponGeo(mainLook, null, { col: metalCol, gem: w && w.staff === 'fire' ? [1, 0.5, 0.2] : [0.6, 0.8, 1] }) }]);
    if (off) {
      const shield = off.type === 'shield';
      const sc = off.tint ? hex(off.tint) : off.look === 'kite' ? [0.4, 0.3, 0.2] : [0.5, 0.36, 0.22];
      add('offhand', parts.findIndex(p => p.name === 'handL'), shield ? [-0.08, -0.05, 0] : [0, -0.06 * S, 0.02], [{ tex: shield ? 'leather' : 'metal', col: [1, 1, 1], geo: weaponGeo(off.look, null, { col: metalCol, shieldCol: sc }) }]);
    }
    return { kind: 'humanoid', parts, height: hip + torsoH + hh + 0.1, hip, S, rk, sheath: mainLook, bow: w && w.bow, staff: w && w.staff, twoH: w && w.hands === 2, shield: off && off.type === 'shield', mainLook, offLook: off && off.look };
  };

  const buildQuad = look => {
    const k = look.kind;
    const col = hex(look.col || '#8a6a40');
    const cfg = {
      dog: { L: 0.85, W: 0.34, H: 0.42, leg: 0.48, head: 0.26, snout: 0.16, tail: 0.18, tex: 'fur' },
      wolf: { L: 0.95, W: 0.3, H: 0.36, leg: 0.52, head: 0.24, snout: 0.22, tail: 0.4, tex: 'fur' },
      bear: { L: 1.5, W: 0.8, H: 0.75, leg: 0.6, head: 0.4, snout: 0.18, tail: 0.1, tex: 'fur' },
      deepstalker: { L: 0.8, W: 0.28, H: 0.3, leg: 0.5, head: 0.22, snout: 0.3, tail: 0.7, tex: 'darkspawn' },
      rat: { L: 0.55, W: 0.24, H: 0.22, leg: 0.16, head: 0.16, snout: 0.12, tail: 0.5, tex: 'fur' },
      mouse: { L: 0.16, W: 0.08, H: 0.07, leg: 0.05, head: 0.06, snout: 0.04, tail: 0.18, tex: 'fur' }
    }[k] || { L: 0.8, W: 0.3, H: 0.35, leg: 0.45, head: 0.24, snout: 0.16, tail: 0.3, tex: 'fur' };
    const sc = look.big || 1;
    const L = cfg.L * sc, W = cfg.W * sc, H = cfg.H * sc, leg = cfg.leg * sc;
    const parts = [];
    const G = () => new Geo();
    const add = (name, parent, pivot, list) => { parts.push(part(name, parent, pivot, list)); return parts.length - 1; };
    const body = add('body', -1, [0, leg + H * 0.5, 0], [{ tex: cfg.tex, col, geo: G().box(-W / 2, -H / 2, -L / 2, W / 2, H / 2, L / 2).box(-W * 0.55, -H * 0.3, L * 0.1, W * 0.55, H * 0.58, L / 2 + 0.02, { col: [0.9, 0.9, 0.9] }) }]);
    const hs = cfg.head * sc;
    const headB = [{ tex: cfg.tex, col, geo: G().box(-hs / 2, -hs * 0.4, 0, hs / 2, hs * 0.5, hs).box(-hs * 0.3, -hs * 0.35, hs, hs * 0.3, hs * 0.1, hs + cfg.snout * sc) }];
    headB.push({ tex: 'plain', col: [0.05, 0.05, 0.05], geo: G().box(-hs * 0.12, -hs * 0.1, hs + cfg.snout * sc - 0.01, hs * 0.12, hs * 0.08, hs + cfg.snout * sc + 0.01, { faces: 's' }).box(-hs * 0.4, hs * 0.18, hs - 0.01, -hs * 0.2, hs * 0.3, hs + 0.005, { faces: 's' }).box(hs * 0.2, hs * 0.18, hs - 0.01, hs * 0.4, hs * 0.3, hs + 0.005, { faces: 's' }) });
    if (k === 'wolf' || k === 'dog' || k === 'rat' || k === 'mouse') headB.push({ tex: cfg.tex, col, geo: G().taper(-hs * 0.32, hs * 0.45, hs * 0.3, hs * 0.2, hs * 0.1, 0.01, 0.01, hs * (k === 'dog' ? 0.25 : 0.45)).taper(hs * 0.32, hs * 0.45, hs * 0.3, hs * 0.2, hs * 0.1, 0.01, 0.01, hs * (k === 'dog' ? 0.25 : 0.45)) });
    if (k === 'bear') headB.push({ tex: cfg.tex, col, geo: G().box(-hs * 0.45, hs * 0.45, hs * 0.3, -hs * 0.25, hs * 0.65, hs * 0.45).box(hs * 0.25, hs * 0.45, hs * 0.3, hs * 0.45, hs * 0.65, hs * 0.45) });
    if (look.blight) headB.push({ tex: 'plain', col: [0.9, 0.2, 0.1], emissive: 1, geo: G().box(-hs * 0.4, hs * 0.18, hs + 0.002, -hs * 0.2, hs * 0.3, hs + 0.01, { faces: 's' }).box(hs * 0.2, hs * 0.18, hs + 0.002, hs * 0.4, hs * 0.3, hs + 0.01, { faces: 's' }) });
    add('head', body, [0, H * 0.3, L / 2], headB);
    const tailCol = k === 'rat' || k === 'mouse' ? [0.85, 0.6, 0.6] : col;
    add('tail', body, [0, H * 0.3, -L / 2], [{ tex: k === 'rat' ? 'skin' : cfg.tex, col: tailCol, geo: G().taper(0, 0, 0, W * 0.2, W * 0.2, W * 0.08, W * 0.08, cfg.tail * sc) }]);
    const lw = Math.max(0.03, W * 0.28);
    for (const [nm, x, z] of [['legFL', -1, 1], ['legFR', 1, 1], ['legBL', -1, -1], ['legBR', 1, -1]]) {
      const up = add(nm, body, [x * (W / 2 - lw / 2), -H * 0.3, z * (L / 2 - lw)], [{ tex: cfg.tex, col, geo: G().box(-lw / 2, -leg * 0.55, -lw / 2, lw / 2, H * 0.1, lw / 2) }]);
      add(nm + '2', up, [0, -leg * 0.55, 0], [{ tex: cfg.tex, col: k === 'bear' ? col : [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], geo: G().box(-lw * 0.4, -leg * 0.48, -lw * 0.4, lw * 0.4, 0, lw * 0.5) }]);
    }
    return { kind: 'quad', parts, height: leg + H + hs * 0.6, sub: k };
  };

  const buildSpider = look => {
    const col = hex(look.col || '#3a3028');
    const sc = look.big || 1;
    const parts = [];
    const G = () => new Geo();
    const add = (name, parent, pivot, list) => { parts.push(part(name, parent, pivot, list)); return parts.length - 1; };
    const body = add('body', -1, [0, 0.6 * sc, 0], [{ tex: 'chitin', col, geo: G().sphere(0, 0.05, -0.35 * sc, 0.34 * sc, 0.28 * sc, 0.42 * sc, 5, 7).sphere(0, 0, 0.12 * sc, 0.2 * sc, 0.16 * sc, 0.22 * sc, 4, 6) }, { tex: 'plain', col: [0.8, 0.1, 0.1], emissive: 1, geo: G().box(-0.08 * sc, 0.04 * sc, 0.3 * sc, 0.08 * sc, 0.09 * sc, 0.34 * sc) }]);
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1, k = i % 4;
      const z = (0.25 - k * 0.14) * sc;
      const up = add('leg' + i, body, [side * 0.16 * sc, 0, z], [{ tex: 'chitin', col, geo: G().box(-0.025 * sc, -0.025 * sc, -0.025 * sc, 0.025 * sc, 0.025 * sc, 0.025 * sc).box(side < 0 ? -0.5 * sc : 0, -0.02 * sc, -0.02 * sc, side < 0 ? 0 : 0.5 * sc, 0.02 * sc, 0.02 * sc) }]);
      add('leg' + i + 'b', up, [side * 0.5 * sc, 0, 0], [{ tex: 'chitin', col: [col[0] * 0.8, col[1] * 0.8, col[2] * 0.8], geo: G().box(-0.018 * sc, -0.65 * sc, -0.018 * sc, 0.018 * sc, 0, 0.018 * sc) }]);
    }
    return { kind: 'spider', parts, height: 0.9 * sc };
  };

  const buildWisp = look => {
    const col = hex(look.col || '#8cf');
    const G = () => new Geo();
    const parts = [part('core', -1, [0, 1.3, 0], [{ tex: 'plain', col, emissive: 1, geo: G().sphere(0, 0, 0, 0.12, 0.12, 0.12, 4, 6) }])];
    return { kind: 'wisp', parts, height: 1.5, glow: col };
  };
  const buildRage = look => {
    const sc = look.big || 1;
    const G = () => new Geo();
    const parts = [];
    const add = (name, parent, pivot, list) => { parts.push(part(name, parent, pivot, list)); return parts.length - 1; };
    const body = add('body', -1, [0, 0, 0], [{ tex: 'lava', col: [1, 0.8, 0.6], emissive: 1, geo: G().taper(0, 0, 0, 0.3 * sc, 0.3 * sc, 0.7 * sc, 0.5 * sc, 1.3 * sc).sphere(0, 1.55 * sc, 0.05, 0.3 * sc, 0.3 * sc, 0.28 * sc, 4, 6) }]);
    for (const s of [-1, 1]) {
      const a = add(s < 0 ? 'uarmL' : 'uarmR', body, [s * 0.4 * sc, 1.2 * sc, 0], [{ tex: 'lava', col: [1, 0.8, 0.6], emissive: 1, geo: G().taper(0, 0, 0, 0.18 * sc, 0.18 * sc, 0.22 * sc, 0.22 * sc, -0.7 * sc) }]);
      add(s < 0 ? 'handL' : 'handR', a, [0, -0.7 * sc, 0], [{ tex: 'lava', col: [1, 0.9, 0.7], emissive: 1, geo: G().sphere(0, -0.08 * sc, 0, 0.16 * sc, 0.16 * sc, 0.16 * sc, 3, 5) }]);
    }
    return { kind: 'rage', parts, height: 1.9 * sc, glow: [1, 0.5, 0.15] };
  };

  const buildModel = (look, equip) => {
    const k = look.kind || 'humanoid';
    if (k === 'humanoid' || k === 'hurlock' || k === 'genlock' || k === 'ogre' || k === 'skeleton') return buildHumanoid(look, equip);
    if (k === 'spider') return buildSpider(look);
    if (k === 'wisp') return buildWisp(look);
    if (k === 'rage') return buildRage(look);
    return buildQuad(look);
  };

  const ease = t => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
  const poseHumanoid = (M, e, t, ctx) => {
    const P = {};
    const set = (n, rx, ry, rz) => { P[n] = [rx || 0, ry || 0, rz || 0]; };
    const anim = e.anim || 'idle';
    const at = e.animT || 0;
    const moving = ctx.moving;
    const phase = ctx.walkPhase || 0;
    let rootY = 0, rootRx = 0, rootRz = 0, rootZ = 0;
    const armed = ctx.combat;
    const breathe = Math.sin(t * 2 + (e.uid || 0)) * 0.02;
    set('torso', breathe, 0, 0);
    set('head', -breathe, 0, 0);
    if (armed && !moving) {
      set('uarmR', -0.5, 0, 0.15); set('farmR', -0.8, 0, 0); set('uarmL', -0.3, 0, -0.2); set('farmL', -0.9, 0, 0);
      if (M.twoH) { set('uarmR', -0.7, 0.3, 0.2); set('farmR', -0.9, 0, 0); set('uarmL', -0.7, -0.4, -0.1); set('farmL', -1.0, 0, 0); }
      if (M.bow) { set('uarmL', -1.3, 0, -0.1); set('farmL', 0, 0, 0); set('uarmR', -1.2, 0.3, 0.2); set('farmR', -1.4, 0, 0); }
      set('thighL', -0.15, 0, 0); set('shinL', 0.25, 0, 0); set('thighR', 0.15, 0, 0); set('shinR', 0.1, 0, 0);
      rootY = -0.04;
    } else {
      set('uarmR', 0.05, 0, 0.08); set('uarmL', 0.05, 0, -0.08); set('farmR', -0.15); set('farmL', -0.15);
    }
    if (moving) {
      const s = Math.sin(phase), c = Math.cos(phase);
      const amp = ctx.run ? 0.75 : 0.5;
      set('thighL', s * amp, 0, 0); set('thighR', -s * amp, 0, 0);
      set('shinL', Math.max(0, -c) * amp * 1.2 + 0.1); set('shinR', Math.max(0, c) * amp * 1.2 + 0.1);
      set('footL', -0.1); set('footR', -0.1);
      if (!armed) { set('uarmL', -s * amp * 0.8, 0, -0.08); set('uarmR', s * amp * 0.8, 0, 0.08); set('farmL', -0.3); set('farmR', -0.3); }
      else { set('uarmL', -s * 0.3 - 0.3, 0, -0.15); set('farmL', -0.9); set('uarmR', -0.4, 0, 0.15); set('farmR', -0.7); }
      rootY = Math.abs(Math.sin(phase)) * 0.05 - 0.02;
      P.torso[0] = ctx.run ? 0.15 : 0.05;
    }
    const swingLen = 0.55;
    if (anim === 'attack' && at < swingLen) {
      const k = at / swingLen;
      const wind = ease(k / 0.35), strike = ease((k - 0.35) / 0.4), back = ease((k - 0.75) / 0.25);
      if (M.bow) {
        set('uarmL', -1.45, 0, -0.1); set('farmL', 0); set('uarmR', -1.4, 0.4 - wind * 0.5, 0.3); set('farmR', -1.6 + wind * 0.8 - strike * 0.8);
      } else if (M.staff) {
        set('uarmR', -0.4 - wind * 1.4 + strike * 0.6, 0, 0.1); set('farmR', -0.4 - wind * 0.3);
        set('uarmL', -0.9 * wind, 0, -0.1); set('farmL', -0.6);
      } else if (M.twoH) {
        const a = -wind * 2.3 + strike * 2.2 - back * 0.3;
        set('uarmR', a - 0.5, 0.3, 0.2); set('farmR', -0.6 + strike * 0.4); set('uarmL', a - 0.5, -0.4, -0.1); set('farmL', -0.8);
        P.torso = [0.1 + strike * 0.25, -wind * 0.4 + strike * 0.7, 0];
      } else if (M.mainLook === 'dagger') {
        set('uarmR', -0.4 - wind * 0.6 - strike * 0.9, 0, 0.2); set('farmR', -1.4 + strike * 1.3);
        P.torso = [0.1, strike * 0.4 - wind * 0.2, 0];
      } else {
        set('uarmR', -wind * 2.4 + strike * 2.0, 0, 0.3 + strike * 0.2); set('farmR', -0.5 - wind * 0.4 + strike * 0.5);
        P.torso = [0.05 + strike * 0.15, -wind * 0.3 + strike * 0.5, 0];
        if (M.shield) { set('uarmL', -0.9, 0, -0.35); set('farmL', -0.6); }
      }
      rootZ = strike * 0.12;
    }
    if ((anim === 'cast' && at < 0.8) || e.cast) {
      const k = e.cast ? 0.5 : Math.min(1, at / 0.8);
      const up = e.cast ? 1 : Math.sin(k * Math.PI);
      set('uarmR', -1.5 * up - 0.2, 0, 0.3); set('farmR', -0.3 * up);
      set('uarmL', -1.3 * up - 0.2, 0, -0.3); set('farmL', -0.4 * up);
      P.head[0] = -0.2 * up;
    }
    if (anim === 'throw' && at < 0.6) {
      const k = at / 0.6;
      set('uarmR', -2.6 * ease(k / 0.5) + 2.2 * ease((k - 0.5) / 0.4), 0, 0.2);
    }
    if (anim === 'slam' && at < 1.0) {
      const k = at / 1.0;
      const a = -2.8 * ease(k / 0.5) + 2.6 * ease((k - 0.5) / 0.2);
      set('uarmR', a, 0, 0.2); set('uarmL', a, 0, -0.2); set('farmR', -0.3); set('farmL', -0.3);
      P.torso = [0.4 * ease((k - 0.5) / 0.2), 0, 0];
    }
    if (anim === 'grab' || e.grabbing) { set('uarmR', -1.6, 0, 0.4); set('farmR', -0.4); }
    if (e.hurtT > 0) { P.torso = [P.torso[0] - e.hurtT * 0.6, P.torso[1], P.torso[2]]; P.head[0] -= e.hurtT * 0.5; }
    const lie = (k) => {
      rootRx = -1.5 * k; rootY = 0.12 * k;
      set('uarmL', -0.3 * k, 0, -0.9 * k); set('uarmR', -0.3 * k, 0, 0.9 * k); set('thighL', 0.1 * k, 0, -0.15 * k); set('thighR', 0.05 * k, 0, 0.12 * k);
      set('shinL', 0.2 * k); set('shinR', 0.4 * k);
    };
    if (e.dead || anim === 'dead' || anim === 'down' || (e.down)) lie(ease(Math.min(1, (e.deadT !== undefined && e.dead ? e.deadT : at) / 0.7)));
    else if (ctx.st === 'knock') lie(ease(Math.min(1, at / 0.4)));
    else if (anim === 'getup' && at < 0.8) lie(1 - ease(at / 0.8));
    else if (ctx.st === 'sleep' || anim === 'sleep') lie(1);
    else if (ctx.st === 'stun' || ctx.st === 'horror') {
      set('uarmL', -2.2, 0, -0.5); set('uarmR', -2.2, 0, 0.5); set('farmL', -1.8); set('farmR', -1.8);
      P.torso = [0.5, 0, Math.sin(t * 6) * 0.05]; rootY = -0.15;
      set('thighL', -0.6); set('thighR', -0.6); set('shinL', 1.0); set('shinR', 1.0);
    } else if (ctx.st === 'freeze' || ctx.st === 'para') {
    } else if (ctx.st === 'grab') {
      rootRz = Math.sin(t * 8) * 0.3; set('thighL', Math.sin(t * 9) * 0.5); set('thighR', -Math.sin(t * 9) * 0.5);
    } else if (!moving && !armed) {
      switch (anim) {
        case 'sit': rootY = -0.42 * M.S; set('thighL', -1.5); set('thighR', -1.5); set('shinL', 1.5); set('shinR', 1.5); set('uarmL', -0.4); set('uarmR', -0.4); set('farmL', -0.8); set('farmR', -0.8); break;
        case 'wounded': rootY = -M.hip * 0.9; rootRx = -0.35; set('thighL', -1.4, 0, -0.2); set('thighR', -1.2, 0, 0.3); set('shinL', 0.6); set('shinR', 1.2); P.head = [0.5, 0, 0.2]; set('uarmR', -0.6, 0, 0.3); set('farmR', -1.2); break;
        case 'kneel': rootY = -0.45 * M.S; set('thighL', -1.5); set('shinL', 1.5); set('thighR', 0.1); set('shinR', 1.6); P.head = [0.3, 0, 0]; break;
        case 'pray': rootY = -0.45 * M.S; set('thighL', -1.5); set('shinL', 1.5); set('thighR', 0.1); set('shinR', 1.6); P.head = [0.4, 0, 0]; set('uarmL', -0.9, 0, 0.3); set('uarmR', -0.9, 0, -0.3); set('farmL', -1.2); set('farmR', -1.2); break;
        case 'guard': set('uarmR', -0.4, 0, 0.2); set('farmR', -1.0); set('uarmL', -0.3, 0, -0.1); set('farmL', -0.9); break;
        case 'read': set('uarmL', -0.7); set('farmL', -1.2); set('uarmR', -0.7); set('farmR', -1.2); P.head = [0.35, 0, 0]; break;
        case 'work': { const s = Math.sin(t * 5); set('uarmR', -1.2 - s * 0.6, 0, 0.2); set('farmR', -0.6); P.torso = [0.25, 0, 0]; break; }
        case 'drink': { const k = (Math.sin(t * 0.8) + 1) / 2; set('uarmR', -0.4 - k * 0.6, 0, 0.3); set('farmR', -1.4 - k * 0.8); P.head = [-0.2 * k, 0, 0]; break; }
        case 'talk': { const s = Math.sin(t * 3); set('uarmR', -0.5 - s * 0.3, 0, 0.2); set('farmR', -0.6); break; }
        case 'cower': rootY = -0.4; set('thighL', -1.6); set('thighR', -1.6); set('shinL', 1.8); set('shinR', 1.8); set('uarmL', -2.5, 0, -0.4); set('uarmR', -2.5, 0, 0.4); set('farmL', -1.5); set('farmR', -1.5); P.torso = [0.6, 0, 0]; break;
        case 'lie': lie(1); break;
        case 'dance': { const s = Math.sin(t * 4); set('uarmL', -2 + s * 0.4, 0, -0.5); set('uarmR', -2 - s * 0.4, 0, 0.5); rootY = Math.abs(s) * 0.06; break; }
        case 'point': set('uarmR', -1.5, 0, 0.1); set('farmR', 0); break;
        default: break;
      }
    }
    if (ctx.talking && !moving && !e.dead) { const s = Math.sin(t * 4); P.head = [P.head[0] + s * 0.04, Math.sin(t * 1.3) * 0.1, 0]; if (anim === 'idle') { set('uarmR', -0.35 - Math.max(0, s) * 0.3, 0, 0.2); set('farmR', -0.7); } }
    if (M.rk === 'ogre') { P.torso[0] += 0.35; }
    return { P, rootY, rootRx, rootRz, rootZ };
  };
  const poseQuad = (M, e, t, ctx) => {
    const P = {};
    const set = (n, rx, ry, rz) => { P[n] = [rx || 0, ry || 0, rz || 0]; };
    const ph = ctx.walkPhase || 0;
    let rootY = 0, rootRx = 0, rootRz = 0;
    const amp = ctx.moving ? (ctx.run ? 0.9 : 0.6) : 0;
    const s = Math.sin(ph), c = Math.cos(ph);
    set('legFL', s * amp); set('legBR', s * amp); set('legFR', -s * amp); set('legBL', -s * amp);
    set('legFL2', Math.max(0, c) * amp); set('legBR2', -Math.max(0, c) * amp * 0.6); set('legFR2', Math.max(0, -c) * amp); set('legBL2', -Math.max(0, -c) * amp * 0.6);
    set('tail', 0.4 + Math.sin(t * (M.sub === 'dog' ? 9 : 3)) * 0.15, Math.sin(t * (M.sub === 'dog' ? 12 : 2)) * 0.4, 0);
    set('head', ctx.moving ? Math.sin(ph * 2) * 0.06 : Math.sin(t * 1.5) * 0.05, 0, 0);
    if (e.anim === 'attack' && (e.animT || 0) < 0.5) { const k = (e.animT || 0) / 0.5; P.head = [0.5 * Math.sin(k * Math.PI), 0, 0]; rootRx = 0.25 * Math.sin(k * Math.PI); rootY = 0.1 * Math.sin(k * Math.PI); }
    if (e.dead || e.down || ctx.st === 'knock' || ctx.st === 'sleep') { rootRz = 1.5; rootY = 0.1; }
    if (e.anim === 'sit' && !ctx.moving) { set('legBL', -1.2); set('legBR', -1.2); set('legBL2', 1.8); set('legBR2', 1.8); rootRx = -0.4; rootY = -0.12; }
    return { P, rootY, rootRx, rootRz, rootZ: 0 };
  };
  const poseSpider = (M, e, t, ctx) => {
    const P = {};
    const ph = (ctx.walkPhase || 0) * 1.5;
    for (let i = 0; i < 8; i++) {
      const side = i < 4 ? -1 : 1, k = i % 4;
      const off = (k % 2 === (i < 4 ? 0 : 1)) ? 0 : Math.PI;
      const sw = ctx.moving ? Math.sin(ph + off) * 0.35 : Math.sin(t * 2 + i) * 0.03;
      const lift = ctx.moving ? Math.max(0, Math.cos(ph + off)) * 0.3 : 0;
      P['leg' + i] = [0, (k - 1.5) * 0.35 * side + sw, side * (0.45 + lift)];
      P['leg' + i + 'b'] = [0, 0, -side * 0.2];
    }
    let rootY = 0, rootRz = 0;
    if (e.anim === 'attack' && (e.animT || 0) < 0.5) P.body = [-0.3 * Math.sin((e.animT / 0.5) * Math.PI), 0, 0];
    if (e.dead) { rootRz = Math.PI; rootY = -0.2; }
    return { P, rootY, rootRx: 0, rootRz, rootZ: 0 };
  };
  const poseRage = (M, e, t) => {
    const P = { uarmL: [Math.sin(t * 2) * 0.3 - 0.3, 0, -0.4], uarmR: [Math.sin(t * 2 + 1) * 0.3 - 0.3, 0, 0.4] };
    if (e.anim === 'attack' && (e.animT || 0) < 0.6) P.uarmR = [-2 * Math.sin((e.animT / 0.6) * Math.PI), 0, 0.3];
    return { P, rootY: Math.sin(t * 3) * 0.05 + (e.dead ? -1.5 : 0), rootRx: 0, rootRz: 0, rootZ: 0 };
  };
  const pose = (M, e, t, ctx) => {
    if (M.kind === 'humanoid') return poseHumanoid(M, e, t, ctx);
    if (M.kind === 'quad') return poseQuad(M, e, t, ctx);
    if (M.kind === 'spider') return poseSpider(M, e, t, ctx);
    if (M.kind === 'rage') return poseRage(M, e, t, ctx);
    return { P: {}, rootY: Math.sin(t * 3 + (e.uid || 0)) * 0.1 + (e.dead ? -1.2 : 0), rootRx: 0, rootRz: 0, rootZ: 0 };
  };

  D.GFX = D.GFX || {};
  Object.assign(D.GFX, { m4, Geo, hex, buildModel, pose, weaponGeo, ARMOR_LOOKS });
})(globalThis.Dao98 = globalThis.Dao98 || {});
