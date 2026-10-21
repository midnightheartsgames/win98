(function (K) {
  'use strict';
  const B = K.Body, J = B.J, IT = K.DATA.ITEMS;
  const FL = 12;

  class Mesh {
    constructor(cap) { this.v = new Float32Array((cap || 4096) * FL); this.i = new Uint32Array((cap || 4096) * 1.6); this.nv = 0; this.ni = 0; }
    reset() { this.nv = 0; this.ni = 0; }
    grow(nv, ni) {
      if ((this.nv + nv) * FL > this.v.length) { const n = new Float32Array(Math.max(this.v.length * 2, (this.nv + nv) * FL)); n.set(this.v); this.v = n; }
      if (this.ni + ni > this.i.length) { const n = new Uint32Array(Math.max(this.i.length * 2, this.ni + ni)); n.set(this.i); this.i = n; }
    }
    vert(x, y, z, nx, ny, nz, u, v, c) {
      const o = this.nv * FL, a = this.v;
      a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = nx; a[o + 4] = ny; a[o + 5] = nz; a[o + 6] = u; a[o + 7] = v; a[o + 8] = c[0]; a[o + 9] = c[1]; a[o + 10] = c[2]; a[o + 11] = c[3] == null ? 1 : c[3];
      return this.nv++;
    }
    quad(p, n, uv, c, cs) {
      this.grow(4, 6);
      const b = this.nv;
      for (let k = 0; k < 4; k++) this.vert(p[k][0], p[k][1], p[k][2], n[0], n[1], n[2], uv[k][0], uv[k][1], cs ? cs[k] : c);
      const I = this.i; I[this.ni++] = b; I[this.ni++] = b + 1; I[this.ni++] = b + 2; I[this.ni++] = b; I[this.ni++] = b + 2; I[this.ni++] = b + 3;
    }
    tri(p, n, uv, c) {
      this.grow(3, 3);
      const b = this.nv;
      for (let k = 0; k < 3; k++) this.vert(p[k][0], p[k][1], p[k][2], n[0], n[1], n[2], uv[k][0], uv[k][1], c);
      this.i[this.ni++] = b; this.i[this.ni++] = b + 1; this.i[this.ni++] = b + 2;
    }
    boxB(cx, cy, cz, ux, uy, uz, vx, vy, vz, wx, wy, wz, c, cell, shade) {
      const cnr = (a, b, d) => [cx + ux * a + vx * b + wx * d, cy + uy * a + vy * b + wy * d, cz + uz * a + vz * b + wz * d];
      const nrm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
      const u0 = cell ? cell[0] : 0, v0 = cell ? cell[1] : 0, u1 = cell ? cell[2] : 1, v1 = cell ? cell[3] : 1;
      const uv = [[u0, v1], [u1, v1], [u1, v0], [u0, v0]];
      const s = shade || 1;
      const top = [c[0] * 1.0 * s, c[1] * 1.0 * s, c[2] * 1.0 * s, c[3] == null ? 1 : c[3]];
      const side = [c[0] * 0.92 * s, c[1] * 0.92 * s, c[2] * 0.92 * s, c[3] == null ? 1 : c[3]];
      this.quad([cnr(-1, -1, 1), cnr(1, -1, 1), cnr(1, 1, 1), cnr(-1, 1, 1)], nrm(wx, wy, wz), uv, side);
      this.quad([cnr(1, -1, -1), cnr(-1, -1, -1), cnr(-1, 1, -1), cnr(1, 1, -1)], nrm(-wx, -wy, -wz), uv, side);
      this.quad([cnr(1, -1, 1), cnr(1, -1, -1), cnr(1, 1, -1), cnr(1, 1, 1)], nrm(ux, uy, uz), uv, side);
      this.quad([cnr(-1, -1, -1), cnr(-1, -1, 1), cnr(-1, 1, 1), cnr(-1, 1, -1)], nrm(-ux, -uy, -uz), uv, side);
      this.quad([cnr(-1, 1, 1), cnr(1, 1, 1), cnr(1, 1, -1), cnr(-1, 1, -1)], nrm(vx, vy, vz), uv, top);
      this.quad([cnr(-1, -1, -1), cnr(1, -1, -1), cnr(1, -1, 1), cnr(-1, -1, 1)], nrm(-vx, -vy, -vz), uv, side);
    }
    boxY(x, y, z, w, h, d, rot, c, tile) {
      const cs = Math.cos(rot), sn = Math.sin(rot), hw = w / 2, hd = d / 2;
      const P = (lx, ly, lz) => [x + lx * cs - lz * sn, y + ly, z + lx * sn + lz * cs];
      const t = tile || 2;
      const f = (lx0, lz0, lx1, lz1, nx, nz, len) => {
        const n = [nx * cs - nz * sn, 0, nx * sn + nz * cs];
        this.quad([P(lx0, 0, lz0), P(lx1, 0, lz1), P(lx1, h, lz1), P(lx0, h, lz0)], n, [[0, h / t], [len / t, h / t], [len / t, 0], [0, 0]], c);
      };
      f(-hw, hd, hw, hd, 0, 1, w); f(hw, -hd, -hw, -hd, 0, -1, w); f(hw, hd, hw, -hd, 1, 0, d); f(-hw, -hd, -hw, hd, -1, 0, d);
      const tc = [c[0] * 1.06, c[1] * 1.06, c[2] * 1.06, c[3]];
      this.quad([P(-hw, h, hd), P(hw, h, hd), P(hw, h, -hd), P(-hw, h, -hd)], [0, 1, 0], [[0, d / t], [w / t, d / t], [w / t, 0], [0, 0]], tc);
      this.quad([P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd)], [0, -1, 0], [[0, 0], [w / t, 0], [w / t, d / t], [0, d / t]], c);
    }
    ramp(x, y, z, w, h, d, rot, c, tile) {
      const cs = Math.cos(rot), sn = Math.sin(rot), hw = w / 2, hd = d / 2, t = tile || 2;
      const P = (lx, ly, lz) => [x + lx * cs - lz * sn, y + ly, z + lx * sn + lz * cs];
      const R = (nx, ny, nz) => [nx * cs - nz * sn, ny, nx * sn + nz * cs];
      const L = Math.hypot(d, h);
      this.quad([P(-hw, 0, -hd), P(-hw, h, hd), P(hw, h, hd), P(hw, 0, -hd)], R(0, d / L, -h / L), [[0, 0], [w / t, 0], [w / t, L / t], [0, L / t]], c);
      this.tri([P(hw, 0, hd), P(hw, 0, -hd), P(hw, h, hd)], R(1, 0, 0), [[d / t, 0], [0, 0], [d / t, h / t]], c);
      this.tri([P(-hw, 0, -hd), P(-hw, 0, hd), P(-hw, h, hd)], R(-1, 0, 0), [[d / t, 0], [0, 0], [0, h / t]], c);
      this.quad([P(-hw, 0, hd), P(hw, 0, hd), P(hw, h, hd), P(-hw, h, hd)], R(0, 0, 1), [[0, 0], [w / t, 0], [w / t, h / t], [0, h / t]], c);
    }
    prism(x, y, z, w, h, d, rot, c, tile, under) {
      const cs = Math.cos(rot), sn = Math.sin(rot), hw = w / 2, hd = d / 2, t = tile || 2;
      const P = (lx, ly, lz) => [x + lx * cs - lz * sn, y + ly, z + lx * sn + lz * cs];
      const sl = Math.hypot(hd, h);
      const nA = [-(h / sl) * 0, hd / sl, h / sl], nB = [0, hd / sl, -h / sl];
      const rot3 = n => [n[0] * cs - n[2] * sn, n[1], n[0] * sn + n[2] * cs];
      this.quad([P(-hw, 0, hd), P(hw, 0, hd), P(hw, h, 0), P(-hw, h, 0)], rot3(nA), [[0, sl / t], [w / t, sl / t], [w / t, 0], [0, 0]], c);
      this.quad([P(hw, 0, -hd), P(-hw, 0, -hd), P(-hw, h, 0), P(hw, h, 0)], rot3(nB), [[0, sl / t], [w / t, sl / t], [w / t, 0], [0, 0]], c);
      const gc = [c[0] * 0.85, c[1] * 0.85, c[2] * 0.85, c[3]];
      this.tri([P(hw, 0, hd), P(hw, 0, -hd), P(hw, h, 0)], rot3([1, 0, 0]), [[0, h / t], [d / t, h / t], [d / t / 2, 0]], gc);
      this.tri([P(-hw, 0, -hd), P(-hw, 0, hd), P(-hw, h, 0)], rot3([-1, 0, 0]), [[0, h / t], [d / t, h / t], [d / t / 2, 0]], gc);
      if (under) this.quad([P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd)], [0, -1, 0], [[0, 0], [w / t, 0], [w / t, d / t], [0, d / t]], [c[0] * 0.5, c[1] * 0.5, c[2] * 0.5, c[3]]);
    }
    cyl(x, y, z, r, h, c, n, tile, rTop, uvMode) {
      n = n || 8; const t = tile || 2, rt = rTop == null ? r : rTop;
      for (let k = 0; k < n; k++) {
        const a0 = k / n * Math.PI * 2, a1 = (k + 1) / n * Math.PI * 2;
        const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
        const cm = Math.cos((a0 + a1) / 2), sm = Math.sin((a0 + a1) / 2);
        const circ = 2 * Math.PI * r, u0 = uvMode ? k / n : k / n * circ / t, u1 = uvMode ? (k + 1) / n : (k + 1) / n * circ / t;
        this.quad([[x + c1 * r, y, z + s1 * r], [x + c0 * r, y, z + s0 * r], [x + c0 * rt, y + h, z + s0 * rt], [x + c1 * rt, y + h, z + s1 * rt]], [cm, (r - rt) / h, sm], [[u1, h / t], [u0, h / t], [u0, 0], [u1, 0]], c);
        if (rt > 0.001) this.tri([[x, y + h, z], [x + c1 * rt, y + h, z + s1 * rt], [x + c0 * rt, y + h, z + s0 * rt]], [0, 1, 0], [[0.5, 0.5], [0.5 + c1 * 0.5, 0.5 + s1 * 0.5], [0.5 + c0 * 0.5, 0.5 + s0 * 0.5]], c);
      }
    }
    sphere(x, y, z, rx, ry, rz, c, seg, cshade) {
      const ns = seg || 8, nr = Math.max(4, Math.floor(ns * 0.75));
      for (let j = 0; j < nr; j++) for (let k = 0; k < ns; k++) {
        const p = (jj, kk) => { const th = jj / nr * Math.PI, ph = kk / ns * Math.PI * 2; return [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]; };
        const a = p(j, k), b = p(j, k + 1), cc = p(j + 1, k + 1), d = p(j + 1, k);
        const P = q => [x + q[0] * rx, y + q[1] * ry, z + q[2] * rz];
        const m = [(a[0] + cc[0]) / 2, (a[1] + cc[1]) / 2, (a[2] + cc[2]) / 2];
        const sh = cshade ? 0.7 + 0.3 * (m[1] * 0.5 + 0.5) : 1;
        const col = [c[0] * sh, c[1] * sh, c[2] * sh, c[3]];
        const us = Math.max(2, rx * 1.6), vs = Math.max(1.5, ry * 1.4);
        this.quad([P(d), P(cc), P(b), P(a)], m, [[k / ns * us, (j + 1) / nr * vs], [(k + 1) / ns * us, (j + 1) / nr * vs], [(k + 1) / ns * us, j / nr * vs], [k / ns * us, j / nr * vs]], col);
      }
    }
    cross(x, y, z, w, h, rot, c, n) {
      n = n || 3;
      for (let k = 0; k < n; k++) {
        const a = rot + k / n * Math.PI, dx = Math.cos(a) * w / 2, dz = Math.sin(a) * w / 2;
        const nrm = [-Math.sin(a), 0.5, Math.cos(a)];
        const ur = Math.max(1, w / 1.3), vr = Math.max(1, h / 1.3);
        this.quad([[x - dx, y, z - dz], [x + dx, y, z + dz], [x + dx, y + h, z + dz], [x - dx, y + h, z - dz]], nrm, [[0, vr], [ur, vr], [ur, 0], [0, 0]], c);
      }
    }
  }

  const hex = (n, k) => [((n >> 16) & 255) / 255 * (k || 1), ((n >> 8) & 255) / 255 * (k || 1), (n & 255) / 255 * (k || 1), 1];
  const CELL = k => { const x = (k % 4) * 0.25, y = Math.floor(k / 4) * 0.25; return [x + 0.01, y + 0.01, x + 0.24, y + 0.24]; };
  const C_PLAIN = CELL(0), C_CLOTH = CELL(1), C_CHAIN = CELL(2), C_LEATHER = CELL(3), C_WOOD = CELL(4), C_HAIR = CELL(5), C_SKIN = CELL(6), C_TAB = CELL(7);

  function treeMesh(sp) {
    const m = { bark: new Mesh(512), leaf: new Mesh(2048) };
    const H = K.WORLD.SPECIES[sp].h;
    const white = [1, 1, 1, 1];
    if (sp === 0) {
      m.bark.cyl(0, 0, 0, 0.24, H * 0.8, white, 7, 1.5, 0.08);
      const layers = 4;
      for (let k = 0; k < layers; k++) {
        const y = H * (0.4 + k * 0.14), r = 2.2 - k * 0.42;
        m.leaf.cyl(0, y, 0, r, H * 0.2, [0.8 - k * 0.05, 0.9, 0.8, 1], 9, 1.4, 0.15, true);
        m.leaf.cyl(0, y - 0.05, 0, r * 0.98, 0.02, [0.5, 0.6, 0.5, 1], 9, 1.4, 0.0, true);
      }
    } else if (sp === 3) {
      m.bark.cyl(0, 0, 0, 0.2, H * 0.6, white, 6, 1.5, 0.08);
      for (let k = 0; k < 6; k++) {
        const y = H * (0.12 + k * 0.13), r = 2.0 * (1 - k / 6.8);
        m.leaf.cyl(0, y, 0, r, H * 0.19, [0.65 + k * 0.05, 0.75 + k * 0.04, 0.7, 1], 9, 1.2, 0.05, true);
      }
    } else if (sp === 1) {
      m.bark.cyl(0, 0, 0, 0.42, H * 0.55, white, 8, 1.5, 0.3);
      m.bark.cyl(0, H * 0.45, 0, 0.18, H * 0.25, white, 6, 1.5, 0.08);
      const blobs = [[0, 0.78, 0, 3.2], [1.9, 0.66, 0.6, 2.3], [-1.8, 0.68, -0.4, 2.4], [0.4, 0.66, -1.9, 2.2], [-0.5, 0.64, 1.9, 2.2], [0.2, 0.95, 0.1, 2.2]];
      for (const [bx, by, bz, r] of blobs) {
        const y = H * by, sh = 0.7 + by * 0.35;
        m.leaf.sphere(bx, y, bz, r, r * 0.75, r, [sh, sh, sh, 1], 7, true);
        m.leaf.cross(bx, y - r * 0.5, bz, r * 1.9, r * 1.4, bx, [sh * 0.9, sh, sh * 0.9, 1], 2);
      }
    } else if (sp === 2) {
      m.bark.cyl(0, 0, 0, 0.17, H * 0.85, white, 6, 1.5, 0.06);
      const blobs = [[0, 0.82, 0, 1.6], [0.9, 0.66, 0.3, 1.3], [-0.8, 0.6, -0.3, 1.3], [0.2, 0.5, 0.9, 1.1], [0, 0.98, 0, 1.0]];
      for (const [bx, by, bz, r] of blobs) {
        const y = H * by, sh = 0.75 + by * 0.3;
        m.leaf.sphere(bx, y, bz, r, r * 1.2, r, [sh, sh, sh, 1], 6, true);
        m.leaf.cross(bx, y - r, bz, r * 1.8, r * 2.2, by * 3, [sh, sh, sh, 1], 2);
      }
    } else {
      m.bark.cyl(0, 0, 0, 0.26, H * 0.9, white, 6, 1.5, 0.07);
      const br = [[0.5, 1.4, 0.2], [0.65, -1.2, 0.9], [0.8, 0.9, -1.1], [0.42, -0.8, -0.9]];
      for (const [hy, dx, dz] of br) {
        const y = H * hy, l = Math.hypot(dx, dz);
        const ux = dx / l * 0.07, uz = dz / l * 0.07;
        m.bark.boxB(dx / 2, y + 0.5, dz / 2, dx / 2, 0.5, dz / 2, -uz, 0, ux, 0, 0.07, 0, white, null);
      }
    }
    return m;
  }

  function segBox(mb, A, Bp, w, d, side, col, cell, pad) {
    let ux = Bp[0] - A[0], uy = Bp[1] - A[1], uz = Bp[2] - A[2];
    const len = Math.hypot(ux, uy, uz) || 1e-4; ux /= len; uy /= len; uz /= len;
    let sx = side[0], sy = side[1], sz = side[2];
    const dot = sx * ux + sy * uy + sz * uz; sx -= ux * dot; sy -= uy * dot; sz -= uz * dot;
    let sl = Math.hypot(sx, sy, sz);
    if (sl < 1e-4) { sx = 1; sy = 0; sz = 0; const d2 = ux; sx -= ux * d2; sy -= uy * d2; sz -= uz * d2; sl = Math.hypot(sx, sy, sz) || 1; }
    sx /= sl; sy /= sl; sz /= sl;
    const tx = sy * uz - sz * uy, ty = sz * ux - sx * uz, tz = sx * uy - sy * ux;
    const hl = len / 2 + (pad || 0);
    const cx = (A[0] + Bp[0]) / 2, cy = (A[1] + Bp[1]) / 2, cz = (A[2] + Bp[2]) / 2;
    mb.boxB(cx, cy, cz, sx * w / 2, sy * w / 2, sz * w / 2, ux * hl, uy * hl, uz * hl, tx * d / 2, ty * d / 2, tz * d / 2, col, cell);
  }
  function boxAt(mb, c, r, u, f, w, h, d, col, cell) {
    mb.boxB(c[0], c[1], c[2], r[0] * w / 2, r[1] * w / 2, r[2] * w / 2, u[0] * h / 2, u[1] * h / 2, u[2] * h / 2, f[0] * d / 2, f[1] * d / 2, f[2] * d / 2, col, cell);
  }
  const jp = (Jt, j) => [Jt[j * 3], Jt[j * 3 + 1], Jt[j * 3 + 2]];
  const add = (a, b, k) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const ortho = (v, u) => { const d = v[0] * u[0] + v[1] * u[1] + v[2] * u[2]; return nrm([v[0] - u[0] * d, v[1] - u[1] * d, v[2] - u[2] * d]); };
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  const RED = [0.55, 0.06, 0.05, 1], WOODC = [0.55, 0.38, 0.22, 1], IRONC = [0.55, 0.56, 0.6, 1], DARK = [0.08, 0.07, 0.07, 1], WHITE = [0.92, 0.9, 0.86, 1];
  const GLOW = c => [c[0], c[1], c[2], 2];

  function armorCol(id, fb) {
    if (!id) return { col: fb, cell: C_CLOTH };
    const it = IT[id];
    const col = hex(it.color || 0x808080);
    const cell = it.look === 'chain' || it.look === 'tabard' ? C_CHAIN : it.look === 'plate' ? C_PLAIN : it.look === 'cloth' ? C_LEATHER : it.look === 'bracers' || it.look === 'boots' ? C_LEATHER : C_PLAIN;
    return { col, cell };
  }

  function frameFrom(Jt, yaw) {
    const pel = jp(Jt, J.pelvis), nk = jp(Jt, J.neck);
    const up = nrm(sub(nk, pel));
    let right = sub(jp(Jt, J.shR), jp(Jt, J.shL));
    if (Math.hypot(right[0], right[1], right[2]) < 1e-3) right = [Math.cos(yaw || 0), 0, Math.sin(yaw || 0)];
    right = ortho(right, up);
    const fwd = cross(up, right);
    return { up, right, fwd };
  }

  function humanGeom(mb, look, Jt, opts) {
    const o = opts || {};
    const col = look.colors, skin = hex(col.skin), hair = hex(col.hair), shirt = hex(col.shirt), pants = hex(col.pants);
    const eq = look.equip || {}, pros = look.pros || {}, limbs = look.limbs || {};
    const F = frameFrom(Jt, o.yaw);
    const lost = p => limbs[p] && limbs[p].state === 'lost';
    const cutOf = p => limbs[p] ? limbs[p].cut : null;
    const skip = o.skip || {};
    const tor = armorCol(eq.torso, shirt);
    const pel = jp(Jt, J.pelvis), chest = jp(Jt, J.chest), neck = jp(Jt, J.neck), head = jp(Jt, J.head);
    const fem = look.female;
    if (!skip.torso) {
      const tw = fem ? 0.32 : 0.37;
      segBox(mb, add(pel, F.up, 0.05), add(neck, F.up, -0.04), tw, 0.22, F.right, tor.col, tor.cell);
      if (eq.torso && IT[eq.torso].look === 'tabard') segBox(mb, add(add(pel, F.up, -0.18), F.fwd, 0.115), add(add(neck, F.up, -0.1), F.fwd, 0.115), tw * 0.62, 0.02, F.right, hex(0xb02020), C_TAB);
      if (eq.torso === 'blackplate') { boxAt(mb, add(add(chest, F.up, 0.06), F.right, 0.2), F.right, F.up, F.fwd, 0.16, 0.1, 0.24, hex(0x3a3640), C_PLAIN); boxAt(mb, add(add(chest, F.up, 0.06), F.right, -0.2), F.right, F.up, F.fwd, 0.16, 0.1, 0.24, hex(0x3a3640), C_PLAIN); }
      boxAt(mb, add(pel, F.up, 0.02), F.right, F.up, F.fwd, tw + 0.02, 0.07, 0.235, hex(0x3a2614), C_LEATHER);
      boxAt(mb, add(pel, F.up, -0.1), F.right, F.up, F.fwd, 0.3, 0.18, 0.2, pants, C_CLOTH);
      if (fem && !eq.legs) segBox(mb, add(pel, F.up, -0.05), add(pel, F.up, -0.62), 0.42, 0.3, F.right, pants, C_CLOTH);
      if (look.colors.cloak) segBox(mb, add(add(neck, F.fwd, -0.13), F.up, -0.02), add(add(pel, F.fwd, -0.2), F.up, -0.5), 0.46, 0.035, F.right, hex(look.colors.cloak), C_CLOTH);
    }
    if (!skip.head && !lost('head')) headGeom(mb, look, head, neck, F, o);
    else if (lost('head')) boxAt(mb, add(neck, F.up, 0.01), F.right, F.up, F.fwd, 0.1, 0.03, 0.1, RED, C_PLAIN);
    for (const side of ['L', 'R']) {
      const s = side === 'R' ? 1 : -1, part = 'arm' + side;
      if (skip[part]) continue;
      const sh = jp(Jt, side === 'R' ? J.shR : J.shL), el = jp(Jt, side === 'R' ? J.elR : J.elL), ha = jp(Jt, side === 'R' ? J.haR : J.haL);
      const pr = pros[part], isLost = lost(part), cut = cutOf(part);
      const sleeve = eq.torso ? tor : { col: shirt, cell: C_CLOTH };
      const arm = eq.arms ? armorCol(eq.arms, shirt) : sleeve;
      const side3 = F.fwd;
      if (!isLost || cut === 'lower' || pr) {
        if (isLost && cut === 'upper' && pr) segBox(mb, sh, el, 0.1, 0.1, side3, pr === 'ironarm' ? IRONC : WOODC, C_WOOD);
        else segBox(mb, sh, el, 0.115, 0.115, side3, sleeve.col, sleeve.cell, 0.03);
      } else boxAt(mb, sh, F.right, F.up, F.fwd, 0.1, 0.06, 0.1, RED, C_PLAIN);
      if (!isLost) {
        segBox(mb, el, ha, 0.095, 0.095, side3, eq.arms ? arm.col : sleeve.col, eq.arms ? arm.cell : sleeve.cell, 0.02);
        boxAt(mb, add(ha, nrm(sub(ha, el)), 0.04), F.right, nrm(sub(ha, el)), F.fwd, 0.075, 0.09, 0.08, skin, C_SKIN);
      } else if (pr === 'hook') {
        segBox(mb, el, lerp3(el, ha, 0.75), 0.06, 0.06, side3, WOODC, C_WOOD);
        const d = nrm(sub(ha, el)), tip = add(ha, d, 0.05);
        segBox(mb, lerp3(el, ha, 0.72), tip, 0.02, 0.02, side3, IRONC, C_PLAIN);
        segBox(mb, tip, add(add(tip, F.fwd, 0.06), F.up, 0.05), 0.02, 0.02, side3, IRONC, C_PLAIN);
      } else if (pr === 'woodarm' || pr === 'ironarm') {
        const c = pr === 'ironarm' ? IRONC : WOODC;
        segBox(mb, el, ha, 0.085, 0.085, side3, c, pr === 'ironarm' ? C_PLAIN : C_WOOD);
        boxAt(mb, add(ha, nrm(sub(ha, el)), 0.04), F.right, nrm(sub(ha, el)), F.fwd, 0.08, 0.09, 0.08, c, C_PLAIN);
      } else if (cut === 'lower') boxAt(mb, el, F.right, F.up, F.fwd, 0.09, 0.05, 0.09, RED, C_PLAIN);
    }
    for (const side of ['L', 'R']) {
      const part = 'leg' + side;
      if (skip[part]) continue;
      const hip = jp(Jt, side === 'R' ? J.hipR : J.hipL), kn = jp(Jt, side === 'R' ? J.knR : J.knL), ft = jp(Jt, side === 'R' ? J.ftR : J.ftL);
      const pr = pros[part], isLost = lost(part), cut = cutOf(part);
      const leg = eq.legs ? armorCol(eq.legs, pants) : { col: pants, cell: C_CLOTH };
      const boot = eq.legs ? leg.col : hex(0x3a2818);
      if (!isLost || cut === 'lower' || pr) {
        if (isLost && cut === 'upper' && pr) segBox(mb, hip, kn, 0.12, 0.12, F.right, pr === 'ironleg' ? IRONC : WOODC, C_WOOD);
        else segBox(mb, hip, kn, 0.155, 0.16, F.right, pants, C_CLOTH, 0.03);
      } else boxAt(mb, hip, F.right, F.up, F.fwd, 0.14, 0.06, 0.14, RED, C_PLAIN);
      if (!isLost) {
        segBox(mb, kn, ft, 0.125, 0.13, F.right, eq.legs ? leg.col : pants, eq.legs ? leg.cell : C_CLOTH, 0.02);
        if (!eq.legs) segBox(mb, lerp3(kn, ft, 0.45), ft, 0.135, 0.14, F.right, boot, C_LEATHER, 0.01);
        footGeom(mb, ft, kn, F, boot);
      } else if (pr === 'pegleg') {
        segBox(mb, kn, add(ft, F.up, -0.02), 0.055, 0.055, F.right, WOODC, C_WOOD);
        boxAt(mb, kn, F.right, F.up, F.fwd, 0.12, 0.06, 0.12, hex(0x3a2818), C_LEATHER);
      } else if (pr === 'ironleg') {
        segBox(mb, kn, ft, 0.1, 0.1, F.right, IRONC, C_PLAIN);
        footGeom(mb, ft, kn, F, IRONC);
      } else if (cut === 'lower') boxAt(mb, kn, F.right, F.up, F.fwd, 0.12, 0.05, 0.12, RED, C_PLAIN);
    }
  }
  function footGeom(mb, ft, kn, F, col) {
    const shin = nrm(sub(ft, kn));
    const fw = ortho(F.fwd, shin);
    const c = add(add(ft, fw, 0.06), shin, 0.0);
    boxAt(mb, c, F.right, shin, fw, 0.12, 0.08, 0.25, col, C_LEATHER);
  }

  function headGeom(mb, look, head, neck, F, o) {
    const col = look.colors, skin = hex(col.skin), hair = hex(col.hair);
    let up = nrm(sub(head, neck));
    const right = ortho(F.right, up), fwd = cross(up, right);
    const s = (look.scale || 1);
    const c = add(head, up, 0.02 * s);
    const eq = look.equip || {};
    const helm = eq.head ? IT[eq.head].look : null;
    if (o.firstPerson) return;
    segBox(mb, neck, add(neck, up, 0.1), 0.1, 0.1, right, skin, C_SKIN);
    boxAt(mb, c, right, up, fwd, 0.21, 0.25, 0.235, skin, C_SKIN);
    const f = (x, y) => add(add(add(c, right, x), up, y), fwd, 0.118);
    const eyes = look.eyes || { L: 'ok', R: 'ok' }, pros = look.pros || {};
    for (const sd of ['L', 'R']) {
      const x = sd === 'R' ? 0.05 : -0.05, p = f(x, 0.03);
      if (eyes[sd] === 'ok') { boxAt(mb, p, right, up, fwd, 0.04, 0.025, 0.01, WHITE, C_PLAIN); boxAt(mb, add(p, fwd, 0.004), right, up, fwd, 0.018, 0.02, 0.01, hex(look.elf ? 0x2a6a3a : 0x3a2a1a), C_PLAIN); }
      else if (pros['eye' + sd] === 'crystaleye') boxAt(mb, p, right, up, fwd, 0.04, 0.03, 0.014, GLOW(look.kind === 'villain' ? [1, 0.2, 0.15] : [0.4, 0.95, 1]), C_PLAIN);
      else if (pros['eye' + sd] === 'glasseye') { boxAt(mb, p, right, up, fwd, 0.04, 0.025, 0.01, WHITE, C_PLAIN); boxAt(mb, add(p, fwd, 0.004), right, up, fwd, 0.018, 0.02, 0.01, hex(0x3a6aa0), C_PLAIN); }
      else { boxAt(mb, p, right, up, fwd, 0.055, 0.045, 0.012, DARK, C_PLAIN); boxAt(mb, add(add(c, up, 0.06), fwd, 0.002), right, up, fwd, 0.225, 0.014, 0.245, DARK, C_PLAIN); }
    }
    boxAt(mb, f(0, -0.015), right, up, fwd, 0.03, 0.05, 0.04, [skin[0] * 0.92, skin[1] * 0.88, skin[2] * 0.86, 1], C_SKIN);
    boxAt(mb, f(0, -0.07), right, up, fwd, 0.06, 0.012, 0.01, hex(0x6a2a24), C_PLAIN);
    if (look.elf) for (const sd of [-1, 1]) segBox(mb, add(add(c, right, sd * 0.1), up, 0.01), add(add(add(c, right, sd * 0.16), up, 0.08), fwd, -0.03), 0.02, 0.045, fwd, skin, C_SKIN);
    if (helm !== 'blackhelm' && helm !== 'hood') {
      boxAt(mb, add(add(c, up, 0.115), fwd, -0.01), right, up, fwd, 0.225, 0.05, 0.25, hair, C_HAIR);
      boxAt(mb, add(add(c, up, 0.02), fwd, -0.1), right, up, fwd, 0.225, 0.2, 0.05, hair, C_HAIR);
      if (look.female || look.elf) segBox(mb, add(add(c, up, 0.05), fwd, -0.11), add(add(c, up, look.female ? -0.32 : -0.2), fwd, -0.13), 0.2, 0.05, right, hair, C_HAIR);
    }
    if (look.beard) boxAt(mb, add(add(c, up, -0.1), fwd, 0.09), right, up, fwd, 0.18, 0.12, 0.08, hair, C_HAIR);
    if (look.crown) { boxAt(mb, add(c, up, 0.15), right, up, fwd, 0.24, 0.06, 0.26, hex(0xe0b030), C_PLAIN); for (const x of [-0.09, 0, 0.09]) boxAt(mb, add(add(c, up, 0.2), right, x), right, up, fwd, 0.03, 0.06, 0.03, hex(0xf0c040), C_PLAIN); }
    if (helm === 'helmet') {
      boxAt(mb, add(c, up, 0.1), right, up, fwd, 0.245, 0.11, 0.27, hex(0xa8a8b4), C_PLAIN);
      boxAt(mb, add(add(c, up, 0.03), fwd, 0.13), right, up, fwd, 0.02, 0.09, 0.02, hex(0x9a9aa4), C_PLAIN);
      segBox(mb, add(c, up, 0.15), add(add(c, up, 0.27), fwd, -0.12), 0.03, 0.06, right, hex(0xc02020), C_CLOTH);
    } else if (helm === 'blackhelm') {
      boxAt(mb, add(c, up, 0.01), right, up, fwd, 0.26, 0.29, 0.27, hex(0x2c2832), C_PLAIN);
      boxAt(mb, add(add(c, up, 0.04), fwd, 0.136), right, up, fwd, 0.16, 0.022, 0.006, DARK, C_PLAIN);
      boxAt(mb, add(c, up, 0.16), right, up, fwd, 0.04, 0.05, 0.2, hex(0x3a3640), C_PLAIN);
    } else if (helm === 'leafhelm') {
      boxAt(mb, add(c, up, 0.1), right, up, fwd, 0.24, 0.08, 0.26, hex(0x6a5a30), C_WOOD);
    } else if (helm === 'hood') {
      const hc = hex((IT[eq.head] && IT[eq.head].color) || 0x4a5a3a);
      boxAt(mb, add(add(c, up, 0.02), fwd, -0.035), right, up, fwd, 0.27, 0.31, 0.25, hc, C_CLOTH);
      segBox(mb, add(add(c, up, 0.14), fwd, -0.12), add(add(c, up, -0.12), fwd, -0.2), 0.25, 0.06, right, hc, C_CLOTH);
    } else if (helm === 'cap') {
      boxAt(mb, add(c, up, 0.13), right, up, fwd, 0.235, 0.06, 0.255, hex((IT[eq.head] && IT[eq.head].color) || 0x6a4a2a), C_CLOTH);
    }
  }

  function weaponGeom(mb, id, hand, dir, side, glowFn) {
    const it = IT[id]; if (!it) return;
    const L = it.len || 0.8;
    const tip = add(hand, dir, L), back = add(hand, dir, -0.14);
    const s2 = ortho(side, dir);
    const look = it.look;
    if (look === 'sword' || look === 'knife' || look === 'elfblade') {
      segBox(mb, back, add(hand, dir, 0.06), 0.035, 0.035, s2, hex(0x3a2a1a), C_LEATHER);
      boxAt(mb, add(hand, dir, 0.07), s2, dir, cross(dir, s2), look === 'knife' ? 0.06 : 0.18, 0.025, 0.035, hex(look === 'elfblade' ? 0x8a7a3a : 0x6a6a70), C_PLAIN);
      const mid = add(hand, dir, 0.08 + (L - 0.08) * 0.55);
      const curve = look === 'elfblade' ? add(mid, cross(dir, s2), 0.04) : mid;
      segBox(mb, add(hand, dir, 0.08), curve, look === 'knife' ? 0.03 : 0.05, 0.012, s2, hex(0xd8dce4), C_PLAIN);
      segBox(mb, curve, tip, look === 'knife' ? 0.022 : 0.04, 0.01, s2, hex(0xe0e4ec), C_PLAIN);
    } else if (look === 'axe' || look === 'greataxe') {
      const hl = add(hand, dir, look === 'greataxe' ? -0.45 : -0.12);
      segBox(mb, hl, tip, 0.04, 0.04, s2, WOODC, C_WOOD);
      const hs = look === 'greataxe' ? 0.32 : 0.2;
      const tdir = cross(dir, s2);
      const hc = add(add(tip, dir, -hs * 0.45), tdir, hs * 0.45);
      boxAt(mb, hc, s2, dir, tdir, 0.02, hs, hs * 0.9, hex(0x9a9aa2), C_PLAIN);
      if (look === 'greataxe') boxAt(mb, add(add(tip, dir, -hs * 0.45), tdir, -hs * 0.3), s2, dir, tdir, 0.02, hs * 0.7, hs * 0.5, hex(0x8a8a92), C_PLAIN);
    } else if (look === 'spear') {
      segBox(mb, add(hand, dir, -0.9), tip, 0.035, 0.035, s2, WOODC, C_WOOD);
      segBox(mb, tip, add(tip, dir, 0.25), 0.05, 0.012, s2, hex(0xd0d4dc), C_PLAIN);
    } else if (look === 'mace') {
      segBox(mb, back, tip, 0.04, 0.04, s2, hex(0x4a3a2a), C_WOOD);
      boxAt(mb, tip, s2, dir, cross(dir, s2), 0.12, 0.14, 0.12, hex(0x7a7a82), C_PLAIN);
    } else if (look === 'bow' || look === 'elfbow') {
      const up = nrm(cross(s2, dir));
      const top = add(add(hand, up, L * 0.5), dir, -0.12), bot = add(add(hand, up, -L * 0.5), dir, -0.12);
      const m1 = add(add(hand, up, L * 0.25), dir, 0.0), m2 = add(add(hand, up, -L * 0.25), dir, 0.0);
      const c = look === 'elfbow' ? hex(0x8a5a2a) : WOODC;
      segBox(mb, hand, m1, 0.04, 0.03, s2, c, C_WOOD); segBox(mb, m1, top, 0.03, 0.025, s2, c, C_WOOD);
      segBox(mb, hand, m2, 0.04, 0.03, s2, c, C_WOOD); segBox(mb, m2, bot, 0.03, 0.025, s2, c, C_WOOD);
      const pull = glowFn && glowFn.draw ? glowFn.draw : 0;
      const sm = add(add(hand, dir, -0.12 - pull * 0.55), up, 0);
      segBox(mb, top, sm, 0.006, 0.006, s2, WHITE, C_PLAIN); segBox(mb, sm, bot, 0.006, 0.006, s2, WHITE, C_PLAIN);
      if (pull > 0.05) segBox(mb, sm, add(sm, dir, 0.75), 0.012, 0.012, s2, hex(0x8a6a4a), C_WOOD);
    } else if (look === 'xbow') {
      segBox(mb, add(hand, dir, -0.3), add(hand, dir, 0.45), 0.06, 0.07, s2, WOODC, C_WOOD);
      segBox(mb, add(add(hand, dir, 0.4), s2, -0.32), add(add(hand, dir, 0.4), s2, 0.32), 0.035, 0.035, dir, hex(0x5a5a62), C_PLAIN);
    }
  }

  function actorGeom(mb, a, Jt, o) {
    if (a.quad) return quadGeom(mb, a, Jt);
    const look = { colors: a.colors, equip: a.equip, pros: a.pros, limbs: a.limbs, eyes: a.eyes, elf: a.elf, female: a.female, beard: a.beard, crown: a.crown, scale: a.scale, kind: a.kind };
    humanGeom(mb, look, Jt, { yaw: a.yaw, firstPerson: o && o.firstPerson, skip: o && o.skip });
    const pose = a.pose, an = a.anim || {};
    const F = frameFrom(Jt, a.yaw);
    const shield = a.offLook === 'shield' && a.equip.off;
    if (!a.dead && pose) {
      const w = a.drawn ? currentWeapon(a) : null;
      if (w && pose.whand && pose.wdir && w !== 'fists') weaponGeom(mb, w, pose.whand, pose.wdir, a.leftMain ? [-F.right[0], -F.right[1], -F.right[2]] : F.right, { draw: a.draw });
      else sheathed(mb, a, Jt, F);
      if (shield) {
        const ha = jp(Jt, a.leftMain ? J.haR : J.haL), el = jp(Jt, a.leftMain ? J.elR : J.elL);
        const sc = hex((IT[a.equip.off] && IT[a.equip.off].color) || 0x8a6438);
        if (a.drawn && !a.torch) {
          const blocking = (an.block || 0) > 0.3;
          const n = blocking ? F.fwd : nrm(add(F.fwd, F.right, a.leftMain ? 0.9 : -0.9));
          const ctr = add(lerp3(el, ha, 0.5), n, 0.07);
          shieldGeom(mb, ctr, n, F.up, sc);
        } else shieldGeom(mb, add(add(jp(Jt, J.chest), F.fwd, -0.16), F.up, -0.05), [-F.fwd[0], -F.fwd[1], -F.fwd[2]], F.up, sc);
      }
      if (a.torch) {
        const ha = jp(Jt, J.haL);
        segBox(mb, add(ha, F.up, -0.15), add(ha, F.up, 0.3), 0.04, 0.04, F.right, WOODC, C_WOOD);
        boxAt(mb, add(ha, F.up, 0.36), F.right, F.up, F.fwd, 0.09, 0.14, 0.09, GLOW([1, 0.62, 0.2]), C_PLAIN);
      }
      if (a.chair && !a.chairSeat) chairGeom(mb, a);
    }
  }
  function currentWeapon(a) {
    if (a.slot === 'ranged' && a.equip.ranged) return a.equip.ranged;
    return a.equip.main || null;
  }
  function sheathed(mb, a, Jt, F) {
    const pel = jp(Jt, J.pelvis), chest = jp(Jt, J.chest);
    if (a.equip.main && IT[a.equip.main]) {
      const it = IT[a.equip.main];
      if (it.hand === 2) weaponGeom(mb, a.equip.main, add(add(chest, F.fwd, -0.16), F.right, 0.15), nrm(add(F.up, F.right, -0.6)), F.fwd, null);
      else weaponGeom(mb, a.equip.main, add(add(pel, F.right, -0.2), F.fwd, 0.05), nrm(add(add(F.up, -1, 0), F.fwd, -0.4)), F.right, null);
    }
    if (a.equip.ranged && IT[a.equip.ranged]) weaponGeom(mb, a.equip.ranged, add(add(chest, F.fwd, -0.17), F.up, -0.05), nrm(add(F.up, F.right, 0.5)), nrm(F.fwd), null);
  }
  function shieldGeom(mb, c, n, up, col) {
    const r = ortho(cross(up, n), n), u = cross(n, r);
    const seg = 8;
    for (let k = 0; k < seg; k++) {
      const a0 = k / seg * Math.PI * 2, a1 = (k + 1) / seg * Math.PI * 2;
      const p0 = add(add(c, r, Math.cos(a0) * 0.32), u, Math.sin(a0) * 0.32), p1 = add(add(c, r, Math.cos(a1) * 0.32), u, Math.sin(a1) * 0.32);
      const f = add(c, n, 0.03);
      mb.tri([f, add(p1, n, 0.015), add(p0, n, 0.015)], n, [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5]], col);
      mb.tri([c, p0, p1], [-n[0], -n[1], -n[2]], [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5]], [col[0] * 0.6, col[1] * 0.6, col[2] * 0.6, 1]);
      mb.quad([p0, p1, add(p1, n, 0.015), add(p0, n, 0.015)], nrm(sub(lerp3(p0, p1, 0.5), c)), [[0.5, 0.5], [0.5, 0.5], [0.5, 0.5], [0.5, 0.5]], hex(0x5a5a60));
    }
    boxAt(mb, add(c, n, 0.045), r, u, n, 0.08, 0.08, 0.03, hex(0xc8b060), C_PLAIN);
  }
  function chairGeom(mb, a) {
    const f = [Math.sin(a.yaw), 0, -Math.cos(a.yaw)], r = [Math.cos(a.yaw), 0, Math.sin(a.yaw)], up = [0, 1, 0];
    const base = [a.x, a.y, a.z];
    boxAt(mb, add(base, up, 0.6), r, up, f, 0.5, 0.06, 0.48, WOODC, C_WOOD);
    boxAt(mb, add(add(base, up, 0.95), f, -0.24), r, up, f, 0.5, 0.65, 0.05, WOODC, C_WOOD);
    const spin = (a.anim.phase || 0);
    for (const s of [-1, 1]) {
      const c = add(add(base, r, s * 0.33), up, 0.34);
      for (let k = 0; k < 8; k++) {
        const a0 = k / 8 * Math.PI * 2 + spin, a1 = (k + 1) / 8 * Math.PI * 2 + spin;
        const p0 = add(add(c, f, Math.cos(a0) * 0.33), up, Math.sin(a0) * 0.33), p1 = add(add(c, f, Math.cos(a1) * 0.33), up, Math.sin(a1) * 0.33);
        segBox(mb, p0, p1, 0.04, 0.05, r, hex(0x4a3a2a), C_WOOD);
      }
      segBox(mb, c, add(add(c, f, Math.cos(spin) * 0.3), up, Math.sin(spin) * 0.3), 0.02, 0.02, r, hex(0x4a3a2a), C_WOOD);
      boxAt(mb, add(add(add(base, r, s * 0.2), f, 0.32), up, 0.08), r, up, f, 0.04, 0.16, 0.12, hex(0x3a3a3a), C_PLAIN);
    }
  }

  function quadGeom(mb, a, Jt) {
    const Q = B.Q, q = B.QUAD[a.kindBody] || B.QUAD.cow;
    const P = j => jp(Jt, j);
    const hip = P(Q.hip), sh = P(Q.sh), nk = P(Q.neck), hd = P(Q.head);
    const body = hex(a.colors.shirt), spot = hex(a.colors.pants);
    const along = nrm(sub(sh, hip));
    let right = cross(along, [0, 1, 0]); if (Math.hypot(...right) < 1e-3) right = [1, 0, 0]; right = nrm(right);
    const up = cross(right, along);
    const s = a.scale || 1, cow = a.kind === 'cow';
    const bw = (cow ? 0.68 : 0.32) * s, bh = (cow ? 0.72 : 0.34) * s;
    segBox(mb, add(hip, along, -0.12 * s), add(sh, along, 0.1 * s), bw, bh, right, body, cow ? C_PLAIN : C_HAIR);
    if (cow) {
      boxAt(mb, add(add(lerp3(hip, sh, 0.35), up, 0.12), right, 0.345 * s), right, up, along, 0.02, 0.36 * s, 0.5 * s, spot, C_PLAIN);
      boxAt(mb, add(add(lerp3(hip, sh, 0.7), up, 0.2), right, -0.345 * s), right, up, along, 0.02, 0.3 * s, 0.4 * s, spot, C_PLAIN);
      boxAt(mb, add(lerp3(hip, sh, 0.2), up, -0.4 * s), right, up, along, 0.22, 0.12, 0.26, hex(0xe8a8a0), C_SKIN);
    }
    segBox(mb, add(sh, up, 0.05), nk, (cow ? 0.36 : 0.2) * s, (cow ? 0.4 : 0.2) * s, right, body, cow ? C_PLAIN : C_HAIR);
    const hdir = nrm(sub(hd, nk));
    segBox(mb, nk, add(hd, hdir, cow ? 0.08 : 0.1), (cow ? 0.3 : 0.17) * s, (cow ? 0.34 : 0.17) * s, right, body, cow ? C_PLAIN : C_HAIR);
    if (cow) {
      boxAt(mb, add(hd, hdir, 0.12), right, up, hdir, 0.26 * s, 0.2 * s, 0.1 * s, hex(0xd8a898), C_SKIN);
      for (const sd of [-1, 1]) { segBox(mb, add(add(nk, right, sd * 0.13), up, 0.15), add(add(add(nk, right, sd * 0.3), up, 0.25), hdir, -0.05), 0.04, 0.04, up, hex(0xe8e0c8), C_PLAIN); boxAt(mb, add(add(nk, right, sd * 0.2), up, 0.03), right, up, hdir, 0.12, 0.06, 0.04, body, C_PLAIN); }
      for (const sd of [-1, 1]) boxAt(mb, add(add(add(lerp3(nk, hd, 0.4), right, sd * 0.11), up, 0.08), hdir, 0.05), right, up, hdir, 0.04, 0.04, 0.02, DARK, C_PLAIN);
    } else {
      boxAt(mb, add(add(hd, hdir, 0.14), up, -0.03), right, up, hdir, 0.1 * s, 0.09 * s, 0.16 * s, body, C_HAIR);
      boxAt(mb, add(hd, hdir, 0.23), right, up, hdir, 0.05, 0.04, 0.03, DARK, C_PLAIN);
      for (const sd of [-1, 1]) segBox(mb, add(add(nk, right, sd * 0.06), up, 0.06), add(add(nk, right, sd * 0.07), up, 0.17), 0.04, 0.025, hdir, body, C_HAIR);
      for (const sd of [-1, 1]) boxAt(mb, add(add(add(lerp3(nk, hd, 0.7), right, sd * 0.06), up, 0.05), hdir, 0.03), right, up, hdir, 0.025, 0.02, 0.01, GLOW([1, 0.85, 0.3]), C_PLAIN);
    }
    for (const [j, fr] of [[Q.fl, 1], [Q.fr, 1], [Q.rl, -1], [Q.rr, -1]]) {
      const base = fr > 0 ? sh : hip, ft = P(j);
      const top = add(add(base, right, (j === Q.fl || j === Q.rl ? -1 : 1) * q.legSpread * s), up, -bh * 0.3);
      segBox(mb, top, ft, (cow ? 0.14 : 0.07) * s, (cow ? 0.14 : 0.07) * s, along, body, C_PLAIN);
      boxAt(mb, add(ft, [0, 1, 0], 0.04), right, [0, 1, 0], along, (cow ? 0.15 : 0.07) * s, 0.08, (cow ? 0.16 : 0.09) * s, cow ? DARK : body, C_PLAIN);
    }
    const tail = P(Q.tail);
    segBox(mb, add(hip, up, cow ? 0.25 : 0.08), tail, (cow ? 0.05 : 0.09) * s, (cow ? 0.05 : 0.09) * s, right, body, C_HAIR);
  }

  function pieceGeom(mb, pc) {
    const p = pc.rag.p, ids = pc.rag.ids, look = pc.look;
    const pts = ids.map((_, k) => [p[k * 3], p[k * 3 + 1], p[k * 3 + 2]]);
    const skin = hex(look.colors.skin), shirt = hex(look.colors.shirt), pants = hex(look.colors.pants);
    const side = [1, 0, 0];
    if (pc.part === 'head') {
      const neck = pts[0], head = pts[1];
      const F = { right: ortho([1, 0, 0], nrm(sub(head, neck))), up: nrm(sub(head, neck)) };
      F.fwd = cross(F.up, F.right);
      headGeom(mb, Object.assign({}, look, { eyes: { L: 'ok', R: 'ok' }, limbs: {} }), head, neck, F, {});
      boxAt(mb, neck, F.right, F.up, F.fwd, 0.1, 0.03, 0.1, RED, C_PLAIN);
      return;
    }
    const arm = pc.part.startsWith('arm');
    const eq = look.equip || {};
    if (pts.length === 3) {
      segBox(mb, pts[0], pts[1], arm ? 0.11 : 0.15, arm ? 0.11 : 0.16, side, arm ? shirt : pants, C_CLOTH);
      boxAt(mb, pts[0], [1, 0, 0], [0, 1, 0], [0, 0, 1], arm ? 0.1 : 0.14, arm ? 0.1 : 0.14, arm ? 0.1 : 0.14, RED, C_PLAIN);
    } else boxAt(mb, pts[0], [1, 0, 0], [0, 1, 0], [0, 0, 1], arm ? 0.09 : 0.12, arm ? 0.09 : 0.12, arm ? 0.09 : 0.12, RED, C_PLAIN);
    const a = pts[pts.length - 2], b = pts[pts.length - 1];
    segBox(mb, a, b, arm ? 0.095 : 0.125, arm ? 0.095 : 0.13, side, arm ? (eq.arms ? hex(IT[eq.arms].color) : shirt) : (eq.legs ? hex(IT[eq.legs].color) : pants), C_CLOTH);
    const d = nrm(sub(b, a));
    if (arm) boxAt(mb, add(b, d, 0.04), ortho(side, d), d, cross(d, ortho(side, d)), 0.075, 0.09, 0.08, skin, C_SKIN);
    else { const fw = ortho([0, 0, 1], d); boxAt(mb, add(b, fw, 0.06), cross(d, fw), d, fw, 0.12, 0.08, 0.25, hex(0x3a2818), C_LEATHER); }
  }

  function wagonGeom(mb, w) {
    const f = [Math.sin(w.yaw), 0, -Math.cos(w.yaw)], r = [Math.cos(w.yaw), 0, Math.sin(w.yaw)];
    const pt = w.pitch || 0;
    const up = nrm([-f[0] * pt, 1, -f[2] * pt]);
    const ff = nrm(cross(up, r));
    const base = [w.x, w.y, w.z];
    const wood = hex(0x7a5430), dark = hex(0x4a3420);
    boxAt(mb, add(base, up, 0.75), r, up, ff, 1.7, 0.12, 3.4, wood, C_WOOD);
    for (const s of [-1, 1]) boxAt(mb, add(add(base, up, 1.0), r, s * 0.85), r, up, ff, 0.08, 0.45, 3.4, wood, C_WOOD);
    boxAt(mb, add(add(base, up, 1.0), ff, -1.7), r, up, ff, 1.7, 0.45, 0.08, wood, C_WOOD);
    boxAt(mb, add(add(base, up, 1.05), ff, 1.55), r, up, ff, 1.5, 0.12, 0.5, dark, C_WOOD);
    for (const s of [-1, 1]) segBox(mb, add(add(add(base, up, 0.7), r, s * 0.45), ff, 1.6), add(add(add(base, up, 0.9), r, s * 0.45), ff, 3.9), 0.07, 0.07, up, dark, C_WOOD);
    const spin = w.spin || 0;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const c = add(add(add(base, r, sx * 0.95), ff, sz * 1.15), up, 0.55);
      for (let k = 0; k < 10; k++) {
        const a0 = k / 10 * Math.PI * 2 + spin, a1 = (k + 1) / 10 * Math.PI * 2 + spin;
        segBox(mb, add(add(c, ff, Math.cos(a0) * 0.52), up, Math.sin(a0) * 0.52), add(add(c, ff, Math.cos(a1) * 0.52), up, Math.sin(a1) * 0.52), 0.07, 0.09, r, dark, C_WOOD);
      }
      for (let k = 0; k < 3; k++) { const a0 = k / 3 * Math.PI + spin; segBox(mb, add(add(c, ff, Math.cos(a0) * 0.5), up, Math.sin(a0) * 0.5), add(add(c, ff, -Math.cos(a0) * 0.5), up, -Math.sin(a0) * 0.5), 0.04, 0.04, r, wood, C_WOOD); }
    }
    const cover = w.kind === 'smuggle' ? hex(0x5a5248) : w.kind === 'supply' ? hex(0xd8ccb0) : hex(0xc8a878);
    if (!w.robbed) {
      for (let k = 0; k < 5; k++) {
        const z = -1.5 + k * 0.75;
        const arcs = 6;
        for (let j = 0; j < arcs; j++) {
          const a0 = j / arcs * Math.PI, a1 = (j + 1) / arcs * Math.PI;
          const p0 = add(add(add(base, up, 1.2 + Math.sin(a0) * 0.9), r, Math.cos(a0) * 0.86), ff, z), p1 = add(add(add(base, up, 1.2 + Math.sin(a1) * 0.9), r, Math.cos(a1) * 0.86), ff, z);
          segBox(mb, p0, p1, 0.8, 0.035, ff, cover, C_CLOTH, 0.04);
        }
      }
      if (w.kind === 'supply') boxAt(mb, add(add(base, up, 1.1), ff, 1.1), r, up, ff, 0.7, 0.45, 0.45, hex(0x6a3a1a), C_WOOD);
    } else {
      for (let k = 0; k < 2; k++) segBox(mb, add(add(add(base, up, 1.2), r, -0.86), ff, -1.5 + k * 3), add(add(add(base, up, 2.0), r, 0.1), ff, -1.4 + k * 2.8), 0.04, 0.05, ff, wood, C_WOOD);
      boxAt(mb, add(add(add(base, up, 0.9), r, 0.4), ff, -0.6), r, up, ff, 0.5, 0.1, 0.4, cover, C_CLOTH);
    }
  }

  function dropGeom(mb, d) {
    const it = IT[d.id], r = [Math.cos(d.yaw), 0, Math.sin(d.yaw)], f = [-Math.sin(d.yaw), 0, Math.cos(d.yaw)];
    const base = [d.x, d.y + 0.05, d.z];
    if (it && (it.type === 'weapon' || it.type === 'shield')) {
      if (it.type === 'shield') { shieldGeom(mb, add(base, [0, 1, 0], 0.04), [0, 1, 0], f, hex(it.color || 0x8a6438)); return; }
      weaponGeom(mb, d.id, add(base, f, -0.3), f, [0, 1, 0], null);
      return;
    }
    if (it && it.type === 'pros') { boxAt(mb, base, r, [0, 1, 0], f, 0.1, 0.1, 0.5, it.id.startsWith('iron') ? IRONC : WOODC, C_WOOD); return; }
    boxAt(mb, add(base, [0, 1, 0], 0.12), r, [0, 1, 0], f, 0.32, 0.26, 0.24, hex(0xa08a5a), C_CLOTH);
    boxAt(mb, add(base, [0, 1, 0], 0.27), r, [0, 1, 0], f, 0.1, 0.06, 0.1, hex(0x6a4a2a), C_CLOTH);
  }
  function arrowGeom(mb, x, y, z, vx, vy, vz, len) {
    const d = nrm([vx, vy, vz]), p = [x, y, z], back = add(p, d, -(len || 0.75));
    const side = ortho([0, 1, 0], d);
    segBox(mb, back, p, 0.018, 0.018, side, hex(0x8a6a44), C_WOOD);
    segBox(mb, back, add(back, d, 0.14), 0.05, 0.005, side, WHITE, C_PLAIN);
  }

  K.Models = { Mesh, treeMesh, actorGeom, humanGeom, pieceGeom, wagonGeom, dropGeom, arrowGeom, segBox, boxAt, hex, frameFrom, weaponGeom, FL };
})(globalThis.Korovany = globalThis.Korovany || {});
