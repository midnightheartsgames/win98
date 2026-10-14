(function (N) {
  'use strict';

  const K = { OPAQUE: 0, LEAF: 1, FACADE: 2, NEON: 3, WATER: 4, NIGHT: 5, PAINT: 6, GLASS: 7, LAMP: 8, SIGN: 9, FAR: 10, DECAL: 11, ATLAS: 12, SKIN: 13, EMIT: 14, FARLEAF: 15, CHROME: 16, LENS: 17, TRIM: 18, FOLIAGE: 19 };
  N.KIND = K;

  const rgb = (h, a) => { const c = N.hex(h); return [c[0], c[1], c[2], a === undefined ? 255 : a]; };
  N.rgb = rgb;
  const WHITE = [255, 255, 255, 255];
  const WALK_C = [236, 234, 228, 255];
  const CURB_C = [215, 215, 212, 255];

  class MB {
    constructor(cap) {
      this.nv = 0;
      this.ni = 0;
      this.alloc(cap || 1024, (cap || 1024) * 2);
    }
    alloc(vc, ic) {
      const old = this.buf, oldI = this.idx;
      this.cap = vc;
      this.buf = new ArrayBuffer(vc * 32);
      this.f = new Float32Array(this.buf);
      this.i8 = new Int8Array(this.buf);
      this.u8 = new Uint8Array(this.buf);
      if (old) this.u8.set(new Uint8Array(old, 0, this.nv * 32));
      this.icap = ic;
      this.idx = new Uint32Array(ic);
      if (oldI) this.idx.set(oldI.subarray(0, this.ni));
    }
    ensure(nv, ni) {
      if (this.nv + nv > this.cap || this.ni + ni > this.icap) this.alloc(Math.max(this.cap * 2, this.nv + nv + 64), Math.max(this.icap * 2, this.ni + ni + 128));
    }
    v(x, y, z, nx, ny, nz, u, v, c, layer, kind) {
      const n = this.nv++;
      const o = n * 8, b = n * 32;
      this.f[o] = x; this.f[o + 1] = y; this.f[o + 2] = z;
      this.i8[b + 12] = Math.round(nx * 127); this.i8[b + 13] = Math.round(ny * 127); this.i8[b + 14] = Math.round(nz * 127); this.i8[b + 15] = 0;
      this.f[o + 4] = u; this.f[o + 5] = v;
      this.u8[b + 24] = c[0]; this.u8[b + 25] = c[1]; this.u8[b + 26] = c[2]; this.u8[b + 27] = c[3];
      this.u8[b + 28] = layer; this.u8[b + 29] = kind; this.u8[b + 30] = 0; this.u8[b + 31] = 0;
      return n;
    }
    tri(a, b, c) { this.idx[this.ni++] = a; this.idx[this.ni++] = b; this.idx[this.ni++] = c; }
    quad(p, n, uv, c, layer, kind, c2) {
      this.ensure(4, 6);
      const a = this.v(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1], c, layer, kind);
      this.v(p[3], p[4], p[5], n[0], n[1], n[2], uv[2], uv[3], c, layer, kind);
      this.v(p[6], p[7], p[8], n[0], n[1], n[2], uv[4], uv[5], c2 || c, layer, kind);
      this.v(p[9], p[10], p[11], n[0], n[1], n[2], uv[6], uv[7], c2 || c, layer, kind);
      this.tri(a, a + 1, a + 2);
      this.tri(a, a + 2, a + 3);
    }
    wall(xa, za, xb, zb, y0, y1, o) {
      const dx = xb - xa, dz = zb - za;
      const L = Math.hypot(dx, dz);
      if (L < 1e-4 || y1 <= y0) return;
      const nx = -dz / L, nz = dx / L;
      const us = o.us || 1, vs = o.vs || 1;
      const u0 = (o.u0 || 0), u1 = u0 + L / us;
      const v0 = (o.v0 !== undefined ? o.v0 : y0 / vs), v1 = v0 + (y1 - y0) / vs;
      const n = o.flip ? [-nx, 0, -nz] : [nx, 0, nz];
      this.quad([xa, y0, za, xb, y0, zb, xb, y1, zb, xa, y1, za], n, [u0, v1, u1, v1, u1, v0, u0, v0], o.cb || o.c || WHITE, o.layer, o.kind || 0, o.ct || o.c || WHITE);
    }
    flat(x0, z0, x1, z1, y, o) {
      const s = o.us || 1;
      const ox = o.ox || 0, oz = o.oz || 0;
      const n = o.down ? [0, -1, 0] : [0, 1, 0];
      if (o.uv) this.quad([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1], n, o.uv, o.c || WHITE, o.layer, o.kind || 0);
      else this.quad([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1], n, [(x0 + ox) / s, (z0 + oz) / s, (x1 + ox) / s, (z0 + oz) / s, (x1 + ox) / s, (z1 + oz) / s, (x0 + ox) / s, (z1 + oz) / s], o.c || WHITE, o.layer, o.kind || 0);
    }
    box(x0, y0, z0, x1, y1, z1, o) {
      const side = o.side || o, top = o.top || o;
      const us = side.us || 1, vs = side.vs || 1;
      const so = { layer: side.layer, kind: side.kind, us, vs, c: side.c, cb: side.cb, ct: side.ct };
      if (!o.noSides) {
        this.wall(x1, z0, x0, z0, y0, y1, Object.assign({}, so, { u0: -x1 / us }));
        this.wall(x0, z1, x1, z1, y0, y1, Object.assign({}, so, { u0: x0 / us }));
        this.wall(x0, z0, x0, z1, y0, y1, Object.assign({}, so, { u0: z0 / us }));
        this.wall(x1, z1, x1, z0, y0, y1, Object.assign({}, so, { u0: -z1 / us }));
      }
      if (!o.noTop) this.flat(x0, z0, x1, z1, y1, { layer: top.layer, kind: top.kind, us: top.us || us, c: top.c || side.c });
      if (o.bottom) this.flat(x0, z0, x1, z1, y0, { layer: (o.bottom.layer !== undefined ? o.bottom.layer : side.layer), kind: side.kind, us, c: side.c, down: true });
    }
    obox(p, y0, y1, o) {
      const side = o.side || o, top = o.top || o;
      const us = side.us || 1, vs = side.vs || 1;
      const n = p.length;
      for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n;
        this.wall(p[j], p[j + 1], p[i], p[i + 1], y0, y1, { layer: side.layer, kind: side.kind, us, vs, c: side.c, u0: side.u0 || 0, v0: side.v0 });
      }
      if (!o.noTop) this.polyFlat(p, y1, { layer: top.layer, kind: top.kind || 0, us: top.us || us, c: top.c || side.c });
    }
    polyFlat(p, y, o) {
      const tri = o.tri || N.triangulate(p);
      const s = o.us || 1;
      const n = p.length / 2;
      this.ensure(n, tri.length);
      const base = this.nv;
      const c = o.c || WHITE;
      for (let i = 0; i < n; i++) this.v(p[i * 2], y, p[i * 2 + 1], 0, o.down ? -1 : 1, 0, p[i * 2] / s, p[i * 2 + 1] / s, c, o.layer, o.kind || 0);
      for (let i = 0; i < tri.length; i += 3) this.tri(base + tri[i], base + tri[i + 1], base + tri[i + 2]);
    }
    fan(q, y, o) {
      const n = q.length / 2;
      if (n < 3) return;
      this.ensure(n, (n - 2) * 3);
      const base = this.nv;
      const s = o.us || 1;
      for (let k = 0; k < n; k++) this.v(q[k * 2], y, q[k * 2 + 1], 0, 1, 0, q[k * 2] / s, q[k * 2 + 1] / s, o.c || WHITE, o.layer, o.kind || 0);
      for (let k = 1; k + 1 < n; k++) this.tri(base, base + k, base + k + 1);
    }
    cyl(cx, cz, y0, y1, r0, r1, seg, o) {
      const us = o.us || 1, vs = o.vs || 1;
      const c = o.c || WHITE;
      this.ensure(seg * 2 + 2, seg * 6 + seg * 3);
      const base = this.nv;
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * Math.PI * 2;
        const ca = Math.cos(a), sa = Math.sin(a);
        const u = (o.uWrap ? i / seg * o.uWrap : a * r0 / us);
        this.v(cx + ca * r0, y0, cz + sa * r0, ca, 0, sa, u, (o.v0 || 0) + (y1 - y0) / vs, o.cb || c, o.layer, o.kind || 0);
        this.v(cx + ca * r1, y1, cz + sa * r1, ca, 0, sa, u, (o.v0 || 0), o.ct || c, o.layer, o.kind || 0);
      }
      for (let i = 0; i < seg; i++) {
        const a = base + i * 2;
        this.tri(a, a + 2, a + 3);
        this.tri(a, a + 3, a + 1);
      }
      if (o.cap) {
        this.ensure(seg + 2, seg * 3);
        const ctr = this.v(cx, y1, cz, 0, 1, 0, 0.5, 0.5, o.capC || c, o.capLayer !== undefined ? o.capLayer : o.layer, o.kind || 0);
        const b2 = this.nv;
        for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; this.v(cx + Math.cos(a) * r1, y1, cz + Math.sin(a) * r1, 0, 1, 0, 0.5 + Math.cos(a) * 0.5, 0.5 + Math.sin(a) * 0.5, o.capC || c, o.capLayer !== undefined ? o.capLayer : o.layer, o.kind || 0); }
        for (let i = 0; i < seg; i++) this.tri(ctr, b2 + i, b2 + i + 1);
      }
    }
    cross(x, y0, z, w, h, layer, c, planes, kind) {
      const n = planes || 3;
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI;
        const dx = Math.cos(a) * w / 2, dz = Math.sin(a) * w / 2;
        this.quad([x - dx, y0, z - dz, x + dx, y0, z + dz, x + dx, y0 + h, z + dz, x - dx, y0 + h, z - dz], [0, 1, 0], [0, 1, 1, 1, 1, 0, 0, 0], [c[0] * 0.75 | 0, c[1] * 0.75 | 0, c[2] * 0.75 | 0, 200], layer, kind === undefined ? K.LEAF : kind, c);
      }
    }
    append(src, tx, ty, tz, yaw, sc) {
      const s = sc || 1;
      const c = Math.cos(yaw || 0), sn = Math.sin(yaw || 0);
      this.ensure(src.nv, src.ni);
      const base = this.nv;
      const F = this.f, I8 = this.i8, U8 = this.u8, SF = src.f, SI = src.i8, SU = src.u8;
      for (let i = 0; i < src.nv; i++) {
        const o = i * 8, b = i * 32, d = (base + i) * 8, db = (base + i) * 32;
        const lx = SF[o] * s, ly = SF[o + 1] * s, lz = SF[o + 2] * s;
        F[d] = tx + lx * c - lz * sn;
        F[d + 1] = ty + ly;
        F[d + 2] = tz + lx * sn + lz * c;
        const nx = SI[b + 12], nz = SI[b + 14];
        I8[db + 12] = Math.round(nx * c - nz * sn);
        I8[db + 13] = SI[b + 13];
        I8[db + 14] = Math.round(nx * sn + nz * c);
        I8[db + 15] = 0;
        F[d + 4] = SF[o + 4];
        F[d + 5] = SF[o + 5];
        U8[db + 24] = SU[b + 24]; U8[db + 25] = SU[b + 25]; U8[db + 26] = SU[b + 26]; U8[db + 27] = SU[b + 27];
        U8[db + 28] = SU[b + 28]; U8[db + 29] = SU[b + 29];
      }
      for (let i = 0; i < src.ni; i++) this.idx[this.ni + i] = src.idx[i] + base;
      this.ni += src.ni;
      this.nv += src.nv;
    }
  }
  N.MB = MB;

  const T = n => N.TEX[n];

  N.floorGrid = (H, fh) => {
    const n = Math.max(1, Math.round(H / fh)), f = H / n;
    if (f >= fh * 0.8 && f <= fh * 1.25) return { floors: n, fh: f, cut: 0 };
    const m = Math.max(1, Math.ceil(H / fh - 0.05));
    return { floors: m, fh, cut: m * fh - H };
  };

  N.signFace = (mb, x, y, z, nx, nz, w, h, A, kind, back, col) => {
    const rx = nz, rz = -nx, a = A[4], cap = A[5] || 0;
    const U = f => A[0] + (A[2] - A[0]) * f;
    const quad = (s0, s1, y0, y1, f0, f1) => mb.quad([x + rx * s1, y0, z + rz * s1, x + rx * s0, y0, z + rz * s0, x + rx * s0, y1, z + rz * s0, x + rx * s1, y1, z + rz * s1], [nx, 0, nz], [U(f1), A[3], U(f0), A[3], U(f0), A[1], U(f1), A[1]], col || WHITE, 0, kind);
    if (back) {
      const bx = x - nx * 0.06, bz = z - nz * 0.06;
      mb.quad([bx - rx * w / 2, y - h / 2, bz - rz * w / 2, bx + rx * w / 2, y - h / 2, bz + rz * w / 2, bx + rx * w / 2, y + h / 2, bz + rz * w / 2, bx - rx * w / 2, y + h / 2, bz - rz * w / 2], [-nx, 0, -nz], [0, 0, 1, 0, 1, 1, 0, 1], back, T('darkmetal'), 0);
    }
    const y0 = y - h / 2, y1 = y + h / 2;
    if (!a) { quad(-w / 2, w / 2, y0, y1, 0, 1); return; }
    if (cap) {
      const wn = h * a;
      if (w <= wn + 1e-3) { quad(-w / 2, w / 2, y0, y1, 0, 1); return; }
      const cw = wn * cap, e = (w - wn) / 2, s = -w / 2, fs = cap * 1.25;
      quad(s, s + cw, y0, y1, 0, cap);
      quad(s + cw, s + cw + e, y0, y1, fs, fs);
      quad(s + cw + e, -s - cw - e, y0, y1, cap, 1 - cap);
      quad(-s - cw - e, -s - cw, y0, y1, 1 - fs, 1 - fs);
      quad(-s - cw, -s, y0, y1, 1 - cap, 1);
      return;
    }
    const qw = Math.min(w, h * a), qh = qw / a;
    quad(-qw / 2, qw / 2, y - qh / 2, y + qh / 2, 0, 1);
  };

  N.wireLinks = (inc, out) => {
    const turn = (a, b) => a.dx1 * b.dx0 + a.dz1 * b.dz0;
    const links = [], hasIn = new Set(), hasOut = new Set();
    const link = (a, b) => { links.push([a, b]); hasOut.add(a); hasIn.add(b); };
    const ways = a => out.filter(b => b.edge !== a.edge && turn(a, b) > -0.72);
    for (const a of inc) {
      const straight = ways(a).filter(b => turn(a, b) > 0.8).sort((p, q) => turn(a, q) - turn(a, p))[0];
      if (straight) link(a, straight);
    }
    for (const a of inc) if (!hasOut.has(a)) for (const b of ways(a)) link(a, b);
    for (const b of out) {
      if (hasIn.has(b)) continue;
      const from = inc.filter(a => a.edge !== b.edge && turn(a, b) > -0.72).sort((p, q) => turn(q, b) - turn(p, b))[0];
      if (from) link(from, b);
    }
    const best = (list, f) => list.slice().sort((p, q) => f(q) - f(p))[0];
    for (const a of inc) if (!hasOut.has(a) && out.length) link(a, best(out, b => turn(a, b)));
    for (const b of out) if (!hasIn.has(b) && inc.length) link(best(inc, a => turn(a, b)), b);
    return links;
  };

  N.wireCurve = (a, b) => {
    const ax = a.x1, az = a.z1, bx = b.x0, bz = b.z0;
    const dist = Math.hypot(bx - ax, bz - az);
    if (a.dx1 * b.dx0 + a.dz1 * b.dz0 > 0.97) return [ax, az, bx, bz];
    const kk = Math.max(0.5, dist * 0.38);
    const c1x = ax + a.dx1 * kk, c1z = az + a.dz1 * kk, c2x = bx - b.dx0 * kk, c2z = bz - b.dz0 * kk;
    const S = Math.max(2, Math.min(12, Math.ceil(dist / 1.5))), pts = [];
    for (let i = 0; i <= S; i++) {
      const t = i / S, u = 1 - t;
      pts.push(u * u * u * ax + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * bx, u * u * u * az + 3 * u * u * t * c1z + 3 * u * t * t * c2z + t * t * t * bz);
    }
    return pts;
  };

  const STYLE = {
    panel5: { wall: 'khrush', mw: 3.2, fh: 2.8, tints: ['#ffffff', '#f4f0e8', '#e8ecf0', '#f0e8e0'] },
    brick5: { wall: 'brick5', mw: 3.2, fh: 2.8, tints: ['#ffffff', '#f0e0d8', '#e8e8e8', '#f4e4dc'] },
    panel9: { wall: 'panel9', mw: 3.6, fh: 2.8, roofBox: true, tints: ['#ffffff', '#f0ece4', '#e4e8ec'] },
    panel9b: { wall: 'panel9b', mw: 3.6, fh: 2.8, roofBox: true, tints: ['#ffffff', '#f4ece0'] },
    panel16: { wall: 'panel16', mw: 3.4, fh: 2.8, roofBox: true, tints: ['#ffffff', '#eef0f4'] },
    panel16b: { wall: 'panel16b', mw: 3.4, fh: 2.8, roofBox: true, tints: ['#ffffff', '#f4ece8'] },
    stalin: { wall: 'stalin', mw: 3.6, fh: 3.3, shop: 'shopfront', cornice: true, tints: ['#ffffff', '#f8f0e0', '#f0e4d0'] },
    stalinb: { wall: 'stalinb', mw: 3.6, fh: 3.3, shop: 'shopfront', cornice: true, tints: ['#ffffff', '#f4ece8'] },
    soc: { wall: 'constr', mw: 5.2, fh: 3.2, cornice: true, tints: ['#ffffff', '#f0ece0', '#e8e8e4', '#f4ecdc'] },
    shop: { wall: 'shopfront', mw: 5, fh: 3.8, side: 'plaster', tints: ['#ffffff', '#f0f0f0'] },
    store: { wall: 'glass', mw: 3, fh: 4.2, cornice: true, tints: ['#ffffff'] },
    hotel: { wall: 'stalin', mw: 3.6, fh: 3.3, shop: 'shopfront', cornice: true, tints: ['#fff6e6'] },
    lobby: { wall: 'glass', mw: 3, fh: 4.5, tints: ['#ffffff'] },
    club: { wall: 'club', mw: 6, fh: 4.5, kind: 0, tints: ['#ffffff'] },
    ovd: { wall: 'ovd', mw: 3.4, fh: 3.2, tints: ['#ffffff'] },
    hospital: { wall: 'hospital', mw: 3.4, fh: 3.1, tints: ['#ffffff'] },
    school: { wall: 'school', mw: 4.2, fh: 3.4, tints: ['#ffffff'] },
    kinder: { wall: 'kinder', mw: 3.4, fh: 3.3, tints: ['#ffffff', '#f0f4e0'] },
    cinema: { wall: 'cinema', mw: 12, fh: 13, kind: 0, tints: ['#ffffff'] },
    arena: { wall: 'hall', mw: 6, fh: 12, tints: ['#e8eef0'] },
    dk: { wall: 'dk', mw: 5, fh: 9, cornice: true, tints: ['#ffffff'] },
    factory: { wall: 'factory', mw: 6, fh: 7, tints: ['#ffffff', '#e8dcd0'] },
    hall: { wall: 'hall', mw: 6, fh: 9, tints: ['#ffffff', '#e8e8e0', '#dde4e8'] },
    brickoffice: { wall: 'brick5', mw: 3.2, fh: 3.3, tints: ['#ffffff', '#f0e0d0'] },
    office: { wall: 'office', mw: 3.4, fh: 3.3, tints: ['#ffffff', '#f0f0e8', '#e8ecf0'] },
    garage: { wall: 'garage', mw: 3, fh: 2.6, kind: 0, side: 'plaster', tints: ['#ffffff', '#e0e8e0', '#e8e0e0', '#e0e0e8'] },
    container: { wall: 'container', mw: 6, fh: 2.6, kind: 0, tints: ['#c83a2a', '#2a5aa8', '#3a8a4a', '#d8a82a', '#8a8a8a'] },
    containers: { wall: 'container', mw: 6, fh: 2.6, kind: 0, tints: ['#c83a2a'] },
    wood: { wall: 'wood', mw: 4, fh: 3.2, side: 'plank', tints: ['#ffffff', '#f0e0d0', '#e0d0c0', '#d8e0f0'] },
    brickhouse: { wall: 'brickhouse', mw: 4, fh: 3.2, side: 'brick5', tints: ['#ffffff', '#f0e0d0'] },
    shed: { wall: 'plank', mw: 3, fh: 2.2, kind: 0, tints: ['#ffffff'] },
    service: { wall: 'service', mw: 8, fh: 5.2, side: 'plaster', kind: 0, tints: ['#ffffff'] },
    booth: { wall: 'booth', mw: 3, fh: 2.8, tints: ['#ffffff'] },
    warehouse: { wall: 'warehouse', mw: 8, fh: 11, kind: 0, tints: ['#ffffff', '#e0e8ec'] },
    tank: { wall: 'metal', mw: 6, fh: 6, kind: 0, tints: ['#e0e0d8'] },
    stands: { wall: 'concrete', mw: 4, fh: 4, kind: 0, tints: ['#ffffff'] },
    frame: { wall: 'plaster', mw: 4, fh: 2.8, kind: 0, tints: ['#ffffff'] }
  };
  N.STYLE = STYLE;

  const LAND = {
    f: ['forestfloor', 6, [235, 240, 225, 255]], p: ['grass', 6, [225, 245, 215, 255]], g: ['grass', 6, [240, 235, 215, 255]], e: ['grass', 6, [205, 225, 215, 255]], b: ['grass', 6, [220, 230, 205, 255]], o: ['grass', 6, [235, 240, 220, 255]],
    i: ['pitch', 20, WHITE], j: ['dirt', 8, [230, 215, 200, 255]], c: ['asphalt2', 8, [210, 210, 215, 255]], t: ['track', 6, WHITE], y: ['sand', 5, WHITE], s: ['sand', 6, WHITE], q: ['concrete', 6, WHITE],
    k: ['asphalt2', 8, [225, 225, 228, 255]], m: ['asphalt2', 8, [220, 218, 212, 255]], h: ['grass', 6, [245, 240, 215, 255]], d: ['grass', 6, [240, 245, 215, 255]], x: ['grass', 6, [235, 240, 220, 255]], z: ['grass', 6, [200, 215, 190, 255]],
    a: ['allot', 10, WHITE], r: ['asphalt2', 8, [205, 200, 195, 255]], n: ['concrete', 6, [215, 210, 205, 255]], u: ['dirt', 8, WHITE], v: ['asphalt2', 8, [220, 220, 220, 255]], l: ['field', 12, WHITE], P: ['plaza', 4, WHITE]
  };
  const LAND_ORDER = 'Rlanvdhxzgpbeforskmqcjiytw';

  function clipPoly(t, x0, z0, x1, z1) {
    let poly = t;
    const planes = [[1, 0, -x0], [-1, 0, x1], [0, 1, -z0], [0, -1, z1]];
    for (const [a, b, c] of planes) {
      const out = [];
      const n = poly.length;
      for (let i = 0; i < n; i += 2) {
        const j = (i + 2) % n;
        const px = poly[i], pz = poly[i + 1], qx = poly[j], qz = poly[j + 1];
        const dp = a * px + b * pz + c, dq = a * qx + b * qz + c;
        if (dp >= 0) out.push(px, pz);
        if ((dp >= 0) !== (dq >= 0)) { const t2 = dp / (dp - dq); out.push(px + (qx - px) * t2, pz + (qz - pz) * t2); }
      }
      poly = out;
      if (poly.length < 6) return null;
    }
    return poly;
  }

  function segHitsRect(ax, az, bx, bz, x0, z0, x1, z1) {
    let t0 = 0, t1 = 1;
    const dx = bx - ax, dz = bz - az;
    for (const [p, q] of [[-dx, ax - x0], [dx, x1 - ax], [-dz, az - z0], [dz, z1 - az]]) {
      if (Math.abs(p) < 1e-12) { if (q < 0) return false; continue; }
      const r = q / p;
      if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; }
    }
    return true;
  }

  class CityGeo {
    constructor(city, atlas, progress) {
      this.city = city;
      this.atlas = atlas;
      this.CH = 128;
      this.X0 = Math.floor(city.X0 / this.CH) * this.CH;
      this.Z0 = Math.floor(city.Z0 / this.CH) * this.CH;
      this.nx = Math.ceil((city.X1 - this.X0) / this.CH);
      this.nz = Math.ceil((city.Z1 - this.Z0) / this.CH);
      this.GX1 = this.X0 + this.nx * this.CH;
      this.GZ1 = this.Z0 + this.nz * this.CH;
      this.chunks = [];
      for (let iz = 0; iz < this.nz; iz++) {
        for (let ix = 0; ix < this.nx; ix++) {
          const x0 = this.X0 + ix * this.CH, z0 = this.Z0 + iz * this.CH;
          this.chunks.push({ ix, iz, x0, z0, x1: x0 + this.CH, z1: z0 + this.CH, bx0: x0, bz0: z0, bx1: x0 + this.CH, bz1: z0 + this.CH, y1: 2, mb: null, dl: [null, null, null, null], decal: null });
        }
      }
      this.lamps = [];
      this.tlights = [];
      this.brkVerts = new Map();
      this.progress = progress || (() => { });
    }

    chunkAt(x, z) {
      const ix = N.clamp(Math.floor((x - this.X0) / this.CH), 0, this.nx - 1), iz = N.clamp(Math.floor((z - this.Z0) / this.CH), 0, this.nz - 1);
      const ch = this.chunks[iz * this.nx + ix];
      if (!ch.mb) ch.mb = new MB(1024);
      return ch;
    }

    chunkOf(x, z) {
      const ix = N.clamp(Math.floor((x - this.X0) / this.CH), 0, this.nx - 1), iz = N.clamp(Math.floor((z - this.Z0) / this.CH), 0, this.nz - 1);
      return this.chunks[iz * this.nx + ix];
    }

    facadeGrid(b, st, e) {
      const mods = Math.max(1, Math.round(e.L / st.mw));
      const shops = st.shop && !b.y0 && (b.shops || b.kind === 's');
      const shop = !!(shops && e.L > 8 && this.streetFacing(e.ax, e.az, e.bx, e.bz));
      const yb = shop ? st.fh + 0.6 : b.h > 4 && !b.y0 ? 0.6 : 0;
      const g = N.floorGrid((b.y0 || 0) + b.h - yb, st.fh);
      return { mods, us: e.L / mods, yb, shop, floors: g.floors, fh: g.fh, base: yb - g.cut };
    }

    grow(ch, x0, z0, x1, z1, y1) {
      ch.x0 = Math.min(ch.x0, x0); ch.z0 = Math.min(ch.z0, z0); ch.x1 = Math.max(ch.x1, x1); ch.z1 = Math.max(ch.z1, z1); ch.y1 = Math.max(ch.y1, y1);
    }

    inGrid(x, z, m) { return x >= this.X0 - m && x <= this.GX1 + m && z >= this.Z0 - m && z <= this.GZ1 + m; }

    decalTri(layer, t, y, o) {
      const x0 = Math.min(t[0], t[2], t[4]), x1 = Math.max(t[0], t[2], t[4]), z0 = Math.min(t[1], t[3], t[5]), z1 = Math.max(t[1], t[3], t[5]);
      const CH = this.CH;
      const ix0 = Math.max(0, Math.floor((x0 - this.X0) / CH)), ix1 = Math.min(this.nx - 1, Math.floor((x1 - this.X0) / CH));
      const iz0 = Math.max(0, Math.floor((z0 - this.Z0) / CH)), iz1 = Math.min(this.nz - 1, Math.floor((z1 - this.Z0) / CH));
      if (ix0 > ix1 || iz0 > iz1) return;
      const whole = ix0 === ix1 && iz0 === iz1 && x0 >= this.X0 && z0 >= this.Z0 && x1 <= this.GX1 && z1 <= this.GZ1;
      for (let iz = iz0; iz <= iz1; iz++) {
        for (let ix = ix0; ix <= ix1; ix++) {
          const ch = this.chunks[iz * this.nx + ix];
          const p = whole ? t : clipPoly(t, ch.bx0, ch.bz0, ch.bx1, ch.bz1);
          if (!p) continue;
          const mb = ch.dl[layer] || (ch.dl[layer] = new MB(512));
          const n = p.length / 2;
          mb.ensure(n, (n - 2) * 3);
          const base = mb.nv;
          const s = o.us || 1;
          for (let i = 0; i < n; i++) {
            const x = p[i * 2], z = p[i * 2 + 1];
            let u = x / s, v = z / s;
            if (o.uvf) { const q = o.uvf(x, z); u = q[0]; v = q[1]; }
            mb.v(x, y, z, 0, 1, 0, u, v, o.c || WHITE, o.layer, o.kind || 0);
          }
          for (let i = 1; i + 1 < n; i++) mb.tri(base, base + i, base + i + 1);
        }
      }
    }

    decalPoly(layer, p, y, o) {
      if (p.length < 6) return;
      const tri = N.triangulate(p);
      for (let i = 0; i < tri.length; i += 3) {
        const a = tri[i] * 2, b = tri[i + 1] * 2, c = tri[i + 2] * 2;
        this.decalTri(layer, [p[a], p[a + 1], p[b], p[b + 1], p[c], p[c + 1]], y, o);
      }
    }

    decalStrip(layer, left, right, y, o) {
      const n = Math.min(left.length, right.length) / 2;
      for (let i = 1; i < n; i++) {
        const ax = left[i * 2 - 2], az = left[i * 2 - 1], bx = left[i * 2], bz = left[i * 2 + 1];
        const cx = right[i * 2], cz = right[i * 2 + 1], dx = right[i * 2 - 2], dz = right[i * 2 - 1];
        this.decalTri(layer, [ax, az, bx, bz, cx, cz], y, o);
        this.decalTri(layer, [ax, az, cx, cz, dx, dz], y, o);
      }
    }

    lineStrip(layer, pts, hw, y, o) {
      if (pts.length < 4) return;
      this.decalStrip(layer, N.offsetPline(pts, -hw), N.offsetPline(pts, hw), y, o);
    }

    quadDecal(layer, cx, cz, ux, uz, hl, hw, y, o) {
      const rx = -uz, rz = ux;
      const p = [cx - ux * hl - rx * hw, cz - uz * hl - rz * hw, cx + ux * hl - rx * hw, cz + uz * hl - rz * hw, cx + ux * hl + rx * hw, cz + uz * hl + rz * hw, cx - ux * hl + rx * hw, cz - uz * hl + rz * hw];
      const uv = o.uv || [0, 0, 1, 0, 1, 1, 0, 1];
      const uvf = (x, z) => {
        const lx = ((x - cx) * ux + (z - cz) * uz) / (hl * 2) + 0.5, lz = ((x - cx) * rx + (z - cz) * rz) / (hw * 2) + 0.5;
        return [uv[0] + (uv[2] - uv[0]) * lx, uv[1] + (uv[7] - uv[1]) * lz];
      };
      const oo = Object.assign({}, o, { uvf });
      this.decalTri(layer, [p[0], p[1], p[2], p[3], p[4], p[5]], y, oo);
      this.decalTri(layer, [p[0], p[1], p[4], p[5], p[6], p[7]], y, oo);
    }

    discDecal(layer, x, z, r, o) {
      const seg = 10;
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
        this.decalTri(layer, [x, z, x + Math.cos(a0) * r, z + Math.sin(a0) * r, x + Math.cos(a1) * r, z + Math.sin(a1) * r], 0, o);
      }
    }

    build() {
      this.ground();
      this.progress(0.1);
      this.landDecals();
      this.progress(0.2);
      this.roads();
      this.progress(0.35);
      this.rails();
      for (const b of this.city.buildings) {
        if (b.removed) continue;
        this.building(b);
        const ch = this.chunkOf(b.cx, b.cz);
        (ch.blds || (ch.blds = [])).push(b.id);
      }
      this.progress(0.55);
      this.walls();
      this.wires();
      this.signs();
      this.progress(0.65);
      const P = N.Props;
      const cache = new Map();
      const flora = this.flora = N.Flora ? new N.Flora(this) : null;
      for (const p of this.city.props) {
        const ch = this.chunkAt(p.x, p.z);
        const gy = p.y !== undefined ? p.y : this.city.groundY(p.x, p.z);
        if (flora && flora.takes(p)) flora.add(ch, p, gy);
        else P.place(this, ch, p, gy, cache);
      }
      this.progress(0.85);
      this.ramps();
      this.backdrop = this.buildBackdrop();
      this.interior = this.buildInterior();
      this.metro = N.MetroGeo ? N.MetroGeo.build(this) : null;
      this.mergeDecals();
      for (const ch of this.chunks) if (!ch.mb) ch.mb = new MB(4);
      this.progress(1);
      return this;
    }

    mergeDecals() {
      for (const ch of this.chunks) {
        let nv = 0, ni = 0;
        for (const d of ch.dl) if (d) { nv += d.nv; ni += d.ni; }
        if (ni) {
          const m = new MB(nv + 4);
          m.alloc(nv + 4, ni + 4);
          for (const d of ch.dl) if (d) m.append(d, 0, 0, 0, 0);
          ch.decal = m;
        }
        ch.dl = null;
      }
    }

    landPolygon() {
      const L = this.city.bankL || [];
      if (L.length < 4) return null;
      const R = 14000, n = L.length;
      const dir = (ax, az, bx, bz) => { const l = Math.hypot(bx - ax, bz - az) || 1; return [(bx - ax) / l, (bz - az) / l]; };
      const dF = dir(L[0], L[1], L[2], L[3]), dL = dir(L[n - 4], L[n - 3], L[n - 2], L[n - 1]);
      const p0 = [L[0] - dF[0] * R, L[1] - dF[1] * R], p1 = [L[n - 2] + dL[0] * R, L[n - 1] + dL[1] * R];
      const p = [p0[0], p0[1]].concat(L, [p1[0], p1[1], p1[0] + dL[1] * R * 2, p1[1] - dL[0] * R * 2, p0[0] + dF[1] * R * 2, p0[1] - dF[0] * R * 2]);
      return N.polyArea(p) < 0 ? N.reversePoly(p) : p;
    }

    ground() {
      const c = this.city;
      const grass = { layer: T('grass'), us: 6, c: WHITE };
      this.farLand = new MB(4096);
      const land = this.landPolygon();
      this.land = land;
      if (!land) {
        for (const ch of this.chunks) this.chunkAt(ch.bx0 + 1, ch.bz0 + 1).mb.flat(ch.bx0, ch.bz0, ch.bx1, ch.bz1, 0, grass);
        return;
      }
      const islands = c.water.slice(1);
      const tris = [];
      for (const p of [land].concat(islands)) {
        const t = N.triangulate(p);
        for (let i = 0; i < t.length; i += 3) {
          const q = [p[t[i] * 2], p[t[i] * 2 + 1], p[t[i + 1] * 2], p[t[i + 1] * 2 + 1], p[t[i + 2] * 2], p[t[i + 2] * 2 + 1]];
          tris.push({ q, main: p === land, x0: Math.min(q[0], q[2], q[4]), x1: Math.max(q[0], q[2], q[4]), z0: Math.min(q[1], q[3], q[5]), z1: Math.max(q[1], q[3], q[5]) });
        }
      }
      const segs = new N.SpatialHash(64);
      const addSegs = (p, closed) => {
        const n = p.length / 2;
        for (let i = 0; i + 1 < n + (closed ? 1 : 0); i++) {
          const j = (i + 1) % n;
          const ax = p[i * 2], az = p[i * 2 + 1], bx = p[j * 2], bz = p[j * 2 + 1];
          segs.insert({ ax, az, bx, bz, x0: Math.min(ax, bx), z0: Math.min(az, bz), x1: Math.max(ax, bx), z1: Math.max(az, bz) });
        }
      };
      addSegs(c.bankL, false);
      for (const p of islands) addSegs(p, true);
      const onLand = (x, z) => N.pointInPoly(land, x, z) || islands.some(p => N.pointInPoly(p, x, z));
      for (const ch of this.chunks) {
        let crossed = false;
        segs.query(ch.bx0, ch.bz0, ch.bx1, ch.bz1, s => { if (segHitsRect(s.ax, s.az, s.bx, s.bz, ch.bx0, ch.bz0, ch.bx1, ch.bz1)) { crossed = true; return true; } });
        if (!crossed) {
          if (onLand((ch.bx0 + ch.bx1) / 2, (ch.bz0 + ch.bz1) / 2)) this.chunkAt(ch.bx0 + 1, ch.bz0 + 1).mb.flat(ch.bx0, ch.bz0, ch.bx1, ch.bz1, 0, grass);
          continue;
        }
        for (const t of tris) {
          if (t.x1 < ch.bx0 || t.x0 > ch.bx1 || t.z1 < ch.bz0 || t.z0 > ch.bz1) continue;
          const q = clipPoly(t.q, ch.bx0, ch.bz0, ch.bx1, ch.bz1);
          if (q) this.chunkAt(ch.bx0 + 1, ch.bz0 + 1).mb.fan(q, 0, grass);
        }
      }
      const far = { layer: T('grass'), us: 24, c: [190, 200, 176, 255], kind: K.FAR };
      const G = 1e7;
      for (const t of tris) {
        if (!t.main) continue;
        for (const [x0, z0, x1, z1] of [[-G, -G, this.X0, G], [this.GX1, -G, G, G], [this.X0, -G, this.GX1, this.Z0], [this.X0, this.GZ1, this.GX1, G]]) {
          const q = clipPoly(t.q, x0, z0, x1, z1);
          if (q) this.farLand.fan(q, -0.02, far);
        }
      }
      this.bankSlopes(c.bankL, false);
      for (const p of islands) this.bankSlopes(p, true);
    }

    bankSlopes(p, closed) {
      const c = this.city;
      const n = p.length / 2;
      let u = 0;
      for (let i = 0; i + 1 < n + (closed ? 1 : 0); i++) {
        const j = (i + 1) % n;
        const ax = p[i * 2], az = p[i * 2 + 1], bx = p[j * 2], bz = p[j * 2 + 1];
        const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz);
        if (L < 0.2) continue;
        const mx = (ax + bx) / 2, mz = (az + bz) / 2;
        const u0 = u;
        u += L / 4;
        if (!this.inGrid(mx, mz, 900)) continue;
        let nx = -dz / L, nz = dx / L;
        if (!c.inWater(mx + nx * 4, mz + nz * 4)) { nx = -nx; nz = -nz; }
        const W = 6.5;
        const inside = this.inGrid(mx, mz, 0);
        const ch = inside ? this.chunkAt(mx, mz) : null;
        const mb = inside ? ch.mb : this.farLand;
        mb.quad([ax, 0.01, az, bx, 0.01, bz, bx + nx * W, -2.7, bz + nz * W, ax + nx * W, -2.7, az + nz * W], [nx * 0.45, 0.9, nz * 0.45], [u0, 0, u, 0, u, 1.6, u0, 1.6], [214, 204, 184, 255], T('sand'), inside ? 0 : K.FAR);
        if (inside) this.grow(ch, Math.min(ax, bx) - W, Math.min(az, bz) - W, Math.max(ax, bx) + W, Math.max(az, bz) + W, 1);
      }
    }

    landDecals() {
      const c = this.city;
      const land = c.land.slice().sort((p, q) => LAND_ORDER.indexOf(p.k) - LAND_ORDER.indexOf(q.k) || q.area - p.area);
      for (const l of land) {
        if (l.k === 'R') continue;
        if (l.box.x1 < this.X0 || l.box.z1 < this.Z0 || l.box.x0 > this.GX1 || l.box.z0 > this.GZ1) continue;
        if (l.k === 'w') {
          this.decalPoly(0, l.poly, 0, { layer: T('water'), kind: K.WATER, us: 16 });
          const ring = l.poly.concat([l.poly[0], l.poly[1]]);
          this.decalStrip(0, ring, N.offsetPline(ring, 1.4), 0, { layer: T('sand'), us: 4, c: [205, 195, 165, 255] });
          continue;
        }
        const s = LAND[l.k];
        if (!s || l.custom) continue;
        this.decalPoly(0, l.poly, 0, { layer: T(s[0]), us: s[1], c: s[2] });
      }
      for (const p of c.plazas || []) this.decalPoly(0, p.poly, 0, { layer: T(p.tex), us: p.tex === 'brickpave' ? 4 : 8, c: p.tex === 'brickpave' ? WHITE : [214, 210, 202, 255] });
      for (const k of c.marks || []) this.lineStrip(3, [k.ax, k.az, k.bx, k.bz], k.w / 2, 0, { layer: T('paint'), kind: K.DECAL });
      if (c.kiselev) this.kiselev(c.kiselev);
    }

    kiselev(k) {
      this.decalPoly(0, k.poly, 0, { layer: T('plaza'), us: 4, c: [236, 230, 222, 255] });
      const ring = [];
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; ring.push(k.cx + Math.cos(a) * (k.rin - 2), k.cz + Math.sin(a) * (k.rin - 2)); }
      this.decalPoly(0, ring, 0, { layer: T('granite'), us: 3, c: [200, 192, 186, 255] });
      const curbO = { layer: T('granite'), us: 1.5, vs: 0.3, v0: 0, c: [186, 180, 174, 255] };
      for (const bed of k.beds) {
        this.decalPoly(0, bed.poly, 0, { layer: T('grass'), us: 6, c: [215, 240, 205, 255] });
        const p = bed.poly, n = p.length;
        for (let i = 0; i < n; i += 2) {
          const j = (i + 2) % n;
          const ax = p[i], az = p[i + 1], bx = p[j], bz = p[j + 1];
          const L = Math.hypot(bx - ax, bz - az);
          if (L < 0.05) continue;
          const ch = this.chunkAt((ax + bx) / 2, (az + bz) / 2);
          const ux = (bx - ax) / L, uz = (bz - az) / L;
          ch.mb.obox(this.orect((ax + bx) / 2 + uz * 0.1, (az + bz) / 2 - ux * 0.1, ux, uz, L / 2 + 0.1, 0.1), -0.05, 0.22, { side: curbO, top: { layer: T('granite'), us: 1, c: [196, 190, 184, 255] } });
          this.grow(ch, Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz), 0.5);
        }
        if (bed.flowers) this.decalPoly(0, bed.flowers, 0, { layer: T('flowers'), us: 3 });
      }
    }

    roads() {
      const c = this.city;
      const asphalt = { layer: T('asphalt'), us: 7 };
      const conc = { layer: T('concrete'), us: 6 };
      for (const s of c.surf) {
        const o = s.cls === 'D' ? { layer: T('dirt'), us: 8 } : s.cls === 'L' ? { layer: T('asphalt2'), us: 8, c: [225, 225, 225, 255] } : { layer: T('asphalt2'), us: 8 };
        this.lineStrip(1, s.pts, s.w / 2, 0, o);
        const n = s.pts.length;
        this.discDecal(1, s.pts[0], s.pts[1], s.w / 2, o);
        this.discDecal(1, s.pts[n - 2], s.pts[n - 1], s.w / 2, o);
      }
      for (const f of c.foot) {
        const o = f.cls === 'P' ? { layer: T('plaza'), us: 4 } : f.cls === 'S' ? { layer: T('concrete'), us: 3 } : { layer: T('asphalt2'), us: 6, c: [214, 210, 202, 255] };
        this.lineStrip(1, f.pts, f.w / 2, 0, o);
      }
      for (const d of c.doorPaths || []) this.lineStrip(1, [d.ax, d.az, d.bx, d.bz], d.w / 2, 0, { layer: T('asphalt2'), us: 6, c: [208, 204, 196, 255] });
      for (const e of c.edges) {
        if (e.bridge && e.len > 200) continue;
        const tp = e.inner ? e.pts : c.trimmed(e);
        this.lineStrip(2, tp, e.hw, 0, e.plant ? conc : asphalt);
        this.sidewalks(e, tp);
        if (!e.plant && !e.inner) this.markings(e, tp);
      }
      for (const f of c.fills) {
        const cnt = f.length / 2;
        let cx = 0, cz = 0;
        for (let i = 0; i < cnt; i++) { cx += f[i * 2] / cnt; cz += f[i * 2 + 1] / cnt; }
        for (let i = 0; i < cnt; i++) {
          const j = (i + 1) % cnt;
          this.decalTri(2, [cx, cz, f[i * 2], f[i * 2 + 1], f[j * 2], f[j * 2 + 1]], 0, asphalt);
        }
      }
      for (const n of c.nodes) {
        const plant = n.ends.some(q => c.edges[q.e].plant);
        const o = plant ? conc : asphalt;
        if (n.poly) {
          const p = n.poly, cnt = p.length / 2;
          for (let i = 0; i < cnt; i++) {
            const j = (i + 1) % cnt;
            this.decalTri(2, [n.x, n.z, p[i * 2], p[i * 2 + 1], p[j * 2], p[j * 2 + 1]], 0, o);
          }
        }
        if (n.cornerList) for (const cc of n.cornerList) if (cc.walk) this.walkPoly(cc.walk);
        if (n.joins) for (const j of n.joins) { this.decalTri(2, j.road, 0, o); if (j.walk) this.walkPoly(j.walk); }
        if (n.poly && !plant && (n.light || n.deg >= 3)) this.crossings(n);
      }
    }

    sidewalks(e, tp) {
      for (const side of [1, -1]) {
        const sw = side > 0 ? e.swR : e.swL;
        if (!sw) continue;
        const inner = N.offsetPline(tp, side * e.hw), outer = N.offsetPline(tp, side * (e.hw + sw));
        const n = inner.length / 2;
        for (let i = 1; i < n; i++) {
          const ax = inner[i * 2 - 2], az = inner[i * 2 - 1], bx = inner[i * 2], bz = inner[i * 2 + 1];
          const dx = outer[i * 2 - 2], dz = outer[i * 2 - 1], cx = outer[i * 2], cz = outer[i * 2 + 1];
          const L = Math.hypot(bx - ax, bz - az);
          if (L < 0.01) continue;
          const steps = Math.max(1, Math.ceil(L / 2));
          let run = -1;
          for (let k = 0; k <= steps; k++) {
            let blocked = true;
            if (k < steps) {
              const t = (k + 0.5) / steps;
              blocked = this.onSurf((ax + (bx - ax) * t + dx + (cx - dx) * t) / 2, (az + (bz - az) * t + dz + (cz - dz) * t) / 2);
            }
            if (!blocked) { if (run < 0) run = k; continue; }
            if (run < 0) continue;
            const t0 = run / steps, t1 = k / steps;
            this.walkPiece([ax + (bx - ax) * t0, az + (bz - az) * t0, ax + (bx - ax) * t1, az + (bz - az) * t1, dx + (cx - dx) * t1, dz + (cz - dz) * t1, dx + (cx - dx) * t0, dz + (cz - dz) * t0], run > 0, k < steps);
            run = -1;
          }
        }
      }
    }

    onSurf(x, z) {
      let r = false;
      this.city.roadHash.query(x, z, x, z, it => {
        if (it.t !== 3) return;
        const [d2] = N.segDist2(x, z, it.ax, it.az, it.bx, it.bz);
        if (d2 <= it.hw * it.hw) { r = true; return true; }
      });
      return r;
    }

    curb(mb, ax, az, bx, bz, cx, cz) {
      const nx = -(bz - az), nz = bx - ax;
      const out = nx * ((ax + bx) / 2 - cx) + nz * ((az + bz) / 2 - cz) >= 0;
      const o = { layer: T('curb'), us: 2, vs: 0.3, v0: 0, c: CURB_C };
      if (out) mb.wall(ax, az, bx, bz, 0, N.CURB, o); else mb.wall(bx, bz, ax, az, 0, N.CURB, o);
    }

    walkPiece(p, capA, capB) {
      const cx = (p[0] + p[2] + p[4] + p[6]) / 4, cz = (p[1] + p[3] + p[5] + p[7]) / 4;
      const ch = this.chunkAt(cx, cz);
      const mb = ch.mb;
      mb.fan(p, N.CURB, { layer: T('sidewalk'), us: 4, c: WALK_C });
      this.curb(mb, p[0], p[1], p[2], p[3], cx, cz);
      this.curb(mb, p[4], p[5], p[6], p[7], cx, cz);
      if (capA) this.curb(mb, p[6], p[7], p[0], p[1], cx, cz);
      if (capB) this.curb(mb, p[2], p[3], p[4], p[5], cx, cz);
      this.grow(ch, Math.min(p[0], p[2], p[4], p[6]), Math.min(p[1], p[3], p[5], p[7]), Math.max(p[0], p[2], p[4], p[6]), Math.max(p[1], p[3], p[5], p[7]), 0.3);
    }

    walkPoly(w) {
      const poly0 = w.inner.concat(N.reversePoly(w.outer));
      const b = N.polyBounds(poly0);
      const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      const ch = this.chunkAt(cx, cz);
      const mb = ch.mb;
      const poly = N.polyArea(poly0) < 0 ? N.reversePoly(poly0) : poly0;
      mb.polyFlat(poly, N.CURB, { layer: T('sidewalk'), us: 4, c: WALK_C });
      const mean = l => { let x = 0, z = 0; for (let i = 0; i < l.length; i += 2) { x += l[i]; z += l[i + 1]; } return [x / (l.length / 2), z / (l.length / 2)]; };
      const line = (l, ref) => {
        for (let i = 2; i < l.length; i += 2) this.curb(mb, l[i - 2], l[i - 1], l[i], l[i + 1], ref[0], ref[1]);
      };
      line(w.inner, mean(w.outer));
      line(w.outer, mean(w.inner));
      this.grow(ch, b.x0, b.z0, b.x1, b.z1, 0.3);
    }

    markings(e, tp) {
      const paint = { layer: T('paint'), kind: K.DECAL };
      const cum = N.cumLen(tp), L = cum[cum.length - 1];
      if (L < 3) return;
      const dash = (off, d, g, w) => {
        for (let s = 1.5; s + d <= L - 1.5; s += d + g) {
          const a = N.plineAt(tp, cum, s + d / 2);
          this.quadDecal(3, a.x - a.dz * off, a.z + a.dx * off, a.dx, a.dz, d / 2, w / 2, 0, paint);
        }
      };
      const solid = (off, w) => this.lineStrip(3, N.offsetPline(tp, off), w / 2, 0, Object.assign({ uvf: (x, z) => [x * 0.3, z * 0.3] }, paint));
      if (!e.oneway) {
        if (e.lanes >= 2) { solid(0.12, 0.12); solid(-0.12, 0.12); }
        else if (e.rank >= 2) dash(0, 3, 6, 0.12);
        for (let k = 1; k < e.lanes; k++) { dash(k * N.LANE_W, 3, 6, 0.12); dash(-k * N.LANE_W, 3, 6, 0.12); }
      } else {
        for (let k = 1; k < e.lanes; k++) dash(-e.hw + k * N.LANE_W, 3, 6, 0.12);
      }
      if (e.main && L > 10) { solid(e.hw - 0.35, 0.12); solid(-(e.hw - 0.35), 0.12); }
      for (const s of e.crossings || []) {
        const t = s - e.sa;
        if (t < 3 || t > L - 3) continue;
        const a = N.plineAt(tp, cum, t);
        this.zebra(a.x, a.z, a.dx, a.dz, e.hw);
      }
    }

    zebra(x, z, dx, dz, hw) {
      const paint = { layer: T('paint'), kind: K.DECAL };
      const rx = -dz, rz = dx;
      for (let k = -hw + 0.6; k < hw - 0.4; k += 1.1) this.quadDecal(3, x + rx * (k + 0.27), z + rz * (k + 0.27), dx, dz, 1.8, 0.27, 0, paint);
    }

    crossings(n) {
      const c = this.city;
      for (const en of n.ends) {
        const e = c.edges[en.e];
        if (e.plant || e.inner) continue;
        const d = en.sb + 2.2;
        if (en.zebra) this.zebra(n.x + en.ux * d, n.z + en.uz * d, en.ux, en.uz, e.hw);
        if (!n.light || e.len < 12 || (e.oneway && en.atA)) continue;
        const sx = n.x + en.ux * (en.sb + 4.6), sz = n.z + en.uz * (en.sb + 4.6);
        const lo = e.oneway ? -e.hw : 0, hi = e.hw;
        const mx = en.uz, mz = -en.ux;
        this.quadDecal(3, sx + mx * (lo + hi) / 2, sz + mz * (lo + hi) / 2, en.ux, en.uz, 0.2, (hi - lo) / 2, 0, { layer: T('paint'), kind: K.DECAL });
      }
    }

    rails() {
      const c = this.city;
      const metal = { layer: T('darkmetal'), c: [150, 150, 150, 255] };
      for (const r of c.rails) {
        if (r.k === 'A') continue;
        const p = r.pts;
        const tram = r.k === 'T';
        let along = 0;
        for (let i = 2; i < p.length; i += 2) {
          const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1];
          const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
          if (len < 0.1) continue;
          const ux = dx / len, uz = dz / len, rx = -uz, rz = ux;
          const mx = (ax + bx) / 2, mz = (az + bz) / 2;
          const s0 = along;
          along += len;
          const onRoad = c.surfaceAt(mx, mz) === 0;
          if (!onRoad) {
            const hw = tram ? 1.4 : 1.6;
            this.quadDecal(1, mx, mz, ux, uz, len / 2 + 0.3, hw, 0, { layer: T('sleepers'), uvf: (x, z) => [((x - ax) * rx + (z - az) * rz) / (hw * 2) + 0.5, (s0 + (x - ax) * ux + (z - az) * uz) / 3.3] });
          }
          for (const o of [-0.76, 0.76]) {
            const cx = mx + rx * o, cz = mz + rz * o;
            if (onRoad || tram) { this.quadDecal(3, cx, cz, ux, uz, len / 2, 0.06, 0, { layer: T('darkmetal'), c: [120, 118, 112, 255] }); continue; }
            const ch = this.chunkAt(mx, mz);
            ch.mb.obox(this.orect(cx, cz, ux, uz, len / 2, 0.04), 0.06, 0.18, metal);
            this.grow(ch, mx - len, mz - len, mx + len, mz + len, 1);
          }
        }
      }
    }

    orect(cx, cz, ux, uz, hl, hw) {
      const rx = -uz, rz = ux;
      const p = [cx + ux * hl + rx * hw, cz + uz * hl + rz * hw, cx - ux * hl + rx * hw, cz - uz * hl + rz * hw, cx - ux * hl - rx * hw, cz - uz * hl - rz * hw, cx + ux * hl - rx * hw, cz + uz * hl - rz * hw];
      return N.polyArea(p) < 0 ? N.reversePoly(p) : p;
    }

    building(b) {
      const st = STYLE[b.style] || STYLE.panel5;
      const ch = this.chunkAt(b.cx, b.cz);
      const mb = ch.mb;
      this.grow(ch, b.x0 - 1, b.z0 - 1, b.x1 + 1, b.z1 + 1, (b.y0 || 0) + b.h + 6);
      const r = N.rng(b.id * 7919 + 13);
      const tint = rgb(b.c || st.tints[Math.floor(r() * st.tints.length)]);
      const y0 = b.y0 || 0, y1 = y0 + b.h;
      const m = b.mb;
      if (b.lm && N.Landmarks && N.Landmarks.build(this, mb, b)) return;
      if (b.style === 'stands') { this.stands(mb, b); return; }
      if (b.style === 'frame') { this.frame(mb, b); return; }
      if (b.style === 'tank') { mb.cyl(m.cx, m.cz, 0, b.h, m.hw, m.hw, 14, { layer: T('metal'), us: 4, vs: 4, c: tint, cap: true, capLayer: T('metal') }); return; }
      const kind = st.kind !== undefined ? st.kind : K.FACADE;
      const vOff = Math.floor(r() * 20);
      const aoLow = [tint[0] * 0.62 | 0, tint[1] * 0.62 | 0, tint[2] * 0.62 | 0, 255];
      const pitchedRoof = (b.roof === 'gable' || b.roof === 'hip') && m.fill > 0.78;
      const sawRoof = b.roof === 'saw';
      const flatRoof = !pitchedRoof && !sawRoof;
      const par = flatRoof && b.h > 6 ? (st.cornice ? 0.9 : 0.6) : 0;
      const shops = st.shop && y0 === 0 && (b.shops || b.kind === 's');
      const p = b.poly;
      const n = p.length / 2;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const ax = p[i * 2], az = p[i * 2 + 1], bx = p[j * 2], bz = p[j * 2 + 1];
        const L = Math.hypot(bx - ax, bz - az);
        if (L < 0.05) continue;
        const mods = Math.max(1, Math.round(L / st.mw));
        const us = L / mods;
        const narrow = L < st.mw * 0.7;
        const layer = T(narrow ? (st.side || 'plaster') : st.wall);
        const k = narrow ? 0 : kind;
        const g = this.facadeGrid(b, st, { L, ax, az, bx, bz });
        const yb = g.yb;
        if (g.shop) {
          const sm = Math.max(1, Math.round(L / 5));
          mb.wall(bx, bz, ax, az, 0, yb, { layer: T(st.shop), kind: K.FACADE, us: L / sm, vs: yb, v0: 0, u0: 0, cb: aoLow, ct: tint });
        } else if (yb > 0) mb.wall(bx, bz, ax, az, -0.3, 0.6, { layer: T('concrete'), us: 3, vs: 3, c: [150, 148, 142, 255] });
        if (y1 > yb) {
          const vAt = y => vOff + (y1 - y) / g.fh;
          const split = y0 === 0 ? Math.min(y1, yb + 3) : yb;
          if (split > yb) mb.wall(bx, bz, ax, az, yb, split, { layer, kind: k, us, vs: g.fh, v0: vAt(split), u0: 0, cb: aoLow, ct: tint });
          if (y1 > split) mb.wall(bx, bz, ax, az, split, y1, { layer, kind: k, us, vs: g.fh, v0: vAt(y1), u0: 0, c: tint });
        }
        if (par) {
          const pc = st.cornice ? [tint[0] * 0.95 | 0, tint[1] * 0.92 | 0, tint[2] * 0.85 | 0, 255] : [tint[0] * 0.82 | 0, tint[1] * 0.82 | 0, tint[2] * 0.82 | 0, 255];
          const ix = -(bz - az) / L * 0.3, iz = (bx - ax) / L * 0.3;
          mb.wall(bx, bz, ax, az, y1, y1 + par, { layer: T('plaster'), us: 4, vs: 4, c: pc });
          mb.wall(ax + ix, az + iz, bx + ix, bz + iz, y1, y1 + par, { layer: T('plaster'), us: 4, vs: 4, c: [pc[0] * 0.8 | 0, pc[1] * 0.8 | 0, pc[2] * 0.8 | 0, 255] });
          mb.quad([ax, y1 + par, az, bx, y1 + par, bz, bx + ix, y1 + par, bz + iz, ax + ix, y1 + par, az + iz], [0, 1, 0], [0, 0, L / 2, 0, L / 2, 0.2, 0, 0.2], pc, T('plaster'), 0);
        }
      }
      if (y0 > 0) mb.polyFlat(p, y0, { layer: T('plaster'), us: 4, down: true, c: [180, 180, 180, 255] });
      if (b.shopSegs && !shops) this.shopFaces(mb, b);
      if (pitchedRoof) { this.pitched(mb, b, m, y1, b.roofTex ? T(b.roofTex) : T('roofmetal'), tint, st, b.roof === 'gable'); return; }
      if (sawRoof) { this.saw(mb, b, m, y1, tint); return; }
      mb.polyFlat(p, y1, { layer: b.roofTex ? T(b.roofTex) : T('tar'), us: 6, c: [200, 200, 200, 255] });
      if (b.roofShape && m.fill > 0.85 && b.h < 26) this.pitched(mb, b, m, y1, T(b.roofShape === 'hip' ? 'roofmetal' : 'slate'), tint, st, b.roofShape === 'gable', 0.3);
      else if (st.roofBox && b.h > 20) this.roofBoxes(mb, b, y1, tint, r);
    }

    shopFaces(mb, b) {
      const p = b.poly;
      for (const sg of b.shopSegs) {
        const i = sg.i, j = (i + 2) % p.length;
        const ax = p[i], az = p[i + 1], bx = p[j], bz = p[j + 1], L = Math.hypot(bx - ax, bz - az) || 1;
        const ux = (bx - ax) / L, uz = (bz - az) / L, nx = uz, nz = -ux;
        const P = (s, v) => [ax + ux * s + nx * v, az + uz * s + nz * v];
        const a = P(sg.s0, 0.05), c = P(sg.s1, 0.05);
        const mods = Math.max(1, Math.round((sg.s1 - sg.s0) / 2.4));
        mb.wall(c[0], c[1], a[0], a[1], 0.55, 3.15, { layer: T('shopfront'), kind: K.FACADE, us: (sg.s1 - sg.s0) / mods, vs: 2.6, v0: 0.12 });
        const sm = (sg.s0 + sg.s1) / 2;
        const q = [...P(sm - 1.2, 0), ...P(sm + 1.2, 0), ...P(sm + 1.2, 1.3), ...P(sm - 1.2, 1.3)];
        const qp = N.polyArea(q) < 0 ? N.reversePoly(q) : q;
        mb.obox(qp, 2.75, 2.88, { side: { layer: T('metal'), us: 2, vs: 1, c: [140, 60, 50, 255] }, top: { layer: T('metal'), c: [150, 64, 52, 255] } });
        const st = [...P(sm - 1.0, 0), ...P(sm + 1.0, 0), ...P(sm + 1.0, 1.2), ...P(sm - 1.0, 1.2)];
        mb.obox(N.polyArea(st) < 0 ? N.reversePoly(st) : st, -0.1, 0.5, { side: { layer: T('concrete'), us: 2, vs: 1 }, top: { layer: T('concrete'), us: 2 } });
      }
    }

    doorsOf(b) {
      if (!this.doorMap) {
        this.doorMap = new Map();
        for (const p of this.city.props) {
          if (p.type !== 'podezd' || p.b === undefined) continue;
          if (!this.doorMap.has(p.b)) this.doorMap.set(p.b, []);
          this.doorMap.get(p.b).push(p);
        }
      }
      return this.doorMap.get(b.id) || [];
    }

    roofBoxSpots(b) {
      this.boxSpots = this.boxSpots || new Map();
      if (this.boxSpots.has(b.id)) return this.boxSpots.get(b.id);
      const m = b.mb, out = [], HL = 2.2, HW = 1.6;
      const add = (cx, cz, ux, uz) => {
        const q = this.orect(cx, cz, ux, uz, HL + 0.3, HW + 0.3);
        for (let i = 0; i < q.length; i += 2) if (!N.pointInPoly(b.poly, q[i], q[i + 1])) return false;
        for (let i = 0; i < b.poly.length; i += 2) if (N.pointInPoly(q, b.poly[i], b.poly[i + 1])) return false;
        if (out.some(o => Math.hypot(o.cx - cx, o.cz - cz) < 6)) return false;
        out.push({ cx, cz, ux, uz, hl: HL, hw: HW });
        return true;
      };
      for (const d of this.doorsOf(b)) {
        const fx = Math.sin(d.rot), fz = -Math.cos(d.rot);
        for (const k of [2.6, 3.6, 4.8]) if (add(d.x - fx * k, d.z - fz * k, -fz, fx)) break;
      }
      if (!out.length) {
        const cnt = Math.max(1, Math.round(m.hl * 2 / 18));
        for (let i = 0; i < cnt; i++) {
          const t = ((i + 0.5) / cnt * 2 - 1) * m.hl;
          add(m.cx + m.ax * t, m.cz + m.az * t, m.ax, m.az);
        }
      }
      this.boxSpots.set(b.id, out);
      return out;
    }

    roofBoxes(mb, b, y1, tint, r) {
      const wc = [tint[0] * 0.9 | 0, tint[1] * 0.9 | 0, tint[2] * 0.9 | 0, 255], steel = { layer: T('darkmetal'), c: [90, 90, 90, 255] }, H = 2.6;
      for (const s of this.roofBoxSpots(b)) {
        const { cx, cz, ux, uz, hl, hw } = s, rx = -uz, rz = ux;
        const at = (k, u, v) => [cx + rx * v * k + ux * u * k, cz + rz * v * k + uz * u * k];
        const side = (k, s0, s1, ya, yb, o) => { const a = at(k, s0, hw + 0.012), c = at(k, s1, hw + 0.012); mb.wall(a[0], a[1], c[0], c[1], ya, yb, o); };
        mb.obox(this.orect(cx, cz, ux, uz, hl, hw), y1, y1 + H, { side: { layer: T('plaster'), us: 3, vs: 3, c: wc }, top: { layer: T('tar'), us: 3 } });
        mb.obox(this.orect(cx, cz, ux, uz, hl + 0.1, hw + 0.1), y1 + H, y1 + H + 0.14, { side: { layer: T('metal'), us: 2, vs: 1, c: [124, 126, 128, 255] }, top: { layer: T('tar'), us: 3, c: [176, 176, 176, 255] } });
        const d0 = -hl * 0.72, d1 = d0 + 0.9;
        side(1, d0, d1, y1 + 0.04, y1 + 2.04, { layer: T('service'), us: 0.9, vs: 2.0, v0: 0, u0: 0, c: [170, 150, 130, 255] });
        const dc = at(1, (d0 + d1) / 2, hw + 0.32);
        mb.obox(this.orect(dc[0], dc[1], ux, uz, 0.65, 0.32), y1 + 2.16, y1 + 2.24, { layer: T('concrete'), us: 1, vs: 1 });
        side(-1, -0.55, 0.55, y1 + 1.45, y1 + 2.05, { layer: T('darkmetal'), c: [62, 64, 66, 255] });
        for (let k = 0; k < 4; k++) side(-1, -0.55, 0.55, y1 + 1.5 + k * 0.14, y1 + 1.54 + k * 0.14, { layer: T('metal'), c: [140, 142, 144, 255] });
        if (r() < 0.75) {
          const t = (r() - 0.5) * hl * 1.2, ax = cx + ux * t, az = cz + uz * t, yb = y1 + H + 0.14;
          mb.box(ax - 0.05, yb, az - 0.05, ax + 0.05, yb + 3.6, az + 0.05, steel);
          for (const [yy, w] of [[3.0, 1.1], [2.4, 0.8]]) mb.obox(this.orect(ax, az, rx, rz, w, 0.04), yb + yy, yb + yy + 0.08, steel);
        }
      }
    }

    streetFacing(ax, az, bx, bz) {
      const L = Math.hypot(bx - ax, bz - az) || 1;
      const nx = (bz - az) / L, nz = -(bx - ax) / L;
      return !!this.city.nearestEdge((ax + bx) / 2 + nx * 6, (az + bz) / 2 + nz * 6, e => e.rank >= 2, 30);
    }

    pitched(mb, b, m, y1, roofL, tint, st, gable, inset0) {
      const ov = inset0 === undefined ? 0.4 : -inset0;
      const hl = m.hl + ov, hw = m.hw + ov;
      const ridge = inset0 === undefined ? (b.ridge || Math.min(3.5, m.hw * 0.6)) : Math.min(3, m.hw * 0.35);
      const ax = m.ax, az = m.az, rx = -az, rz = ax;
      const P = (u, v, y) => [m.cx + ax * u + rx * v, y, m.cz + az * u + rz * v];
      const ins = gable ? 0 : Math.min(hw, hl * 0.5);
      const yb = y1 - (inset0 === undefined ? 0.15 : 0);
      const r0 = P(-hl + ins, 0, y1 + ridge), r1 = P(hl - ins, 0, y1 + ridge);
      const e = [P(-hl, -hw, yb), P(hl, -hw, yb), P(hl, hw, yb), P(-hl, hw, yb)];
      const add = (a, bb, cc, d) => {
        const ux = bb[0] - a[0], uy = bb[1] - a[1], uz = bb[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        const l = Math.hypot(nx, ny, nz) || 1;
        nx /= l; ny /= l; nz /= l;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
        const w = Math.hypot(ux, uz) / 3;
        mb.quad([a[0], a[1], a[2], bb[0], bb[1], bb[2], cc[0], cc[1], cc[2], d[0], d[1], d[2]], [nx, ny, nz], [0, 0, w, 0, w, 2, 0, 2], WHITE, roofL, 0);
      };
      add(e[0], e[1], r1, r0);
      add(e[2], e[3], r0, r1);
      if (!gable) { add(e[3], e[0], r0, r0); add(e[1], e[2], r1, r1); return; }
      const side = T(st.side || 'plaster');
      for (const [a, bb, top, sg] of [[e[3], e[0], r0, -1], [e[1], e[2], r1, 1]]) {
        mb.ensure(3, 3);
        const i0 = mb.v(a[0], a[1], a[2], ax * sg, 0, az * sg, 0, 1, tint, side, 0);
        mb.v(bb[0], bb[1], bb[2], ax * sg, 0, az * sg, 1, 1, tint, side, 0);
        mb.v(top[0], top[1], top[2], ax * sg, 0, az * sg, 0.5, 0, tint, side, 0);
        mb.tri(i0, i0 + 1, i0 + 2);
      }
    }

    saw(mb, b, m, y1, tint) {
      const n = Math.max(1, Math.round(m.hl * 2 / 12));
      const step = m.hl * 2 / n;
      const th = 3.2;
      const ax = m.ax, az = m.az, rx = -az, rz = ax;
      const P = (u, v, y) => [m.cx + ax * u + rx * v, y, m.cz + az * u + rz * v];
      mb.polyFlat(b.poly, y1, { layer: T('tar'), us: 6, c: [180, 180, 180, 255] });
      for (let i = 0; i < n; i++) {
        const u0 = -m.hl + i * step, u1 = u0 + step;
        const a = P(u0, -m.hw, y1), bb = P(u0, m.hw, y1), c2 = P(u1, m.hw, y1 + th), d = P(u1, -m.hw, y1 + th);
        mb.quad([a[0], a[1], a[2], bb[0], bb[1], bb[2], c2[0], c2[1], c2[2], d[0], d[1], d[2]], [-ax * 0.3, 0.95, -az * 0.3], [0, 0, m.hw * 2 / 3, 0, m.hw * 2 / 3, 2, 0, 2], WHITE, T('slate'), 0);
        const e0 = P(u1, -m.hw, y1), e1 = P(u1, m.hw, y1);
        mb.wall(e0[0], e0[2], e1[0], e1[2], y1, y1 + th, { layer: T('hall'), kind: K.FACADE, us: 6, vs: th * 2.4, v0: 0.4, c: tint });
        for (const [s0, s1, sg] of [[P(u0, -m.hw, y1), P(u1, -m.hw, y1), -1], [P(u1, m.hw, y1), P(u0, m.hw, y1), 1]]) {
          mb.ensure(3, 3);
          const i0 = mb.v(s0[0], y1, s0[2], rx * sg, 0, rz * sg, 0, 1, tint, T('plaster'), 0);
          mb.v(s1[0], y1, s1[2], rx * sg, 0, rz * sg, 1, 1, tint, T('plaster'), 0);
          const top = sg < 0 ? d : c2;
          mb.v(top[0], top[1], top[2], rx * sg, 0, rz * sg, 1, 0, tint, T('plaster'), 0);
          mb.tri(i0, i0 + 1, i0 + 2);
        }
      }
    }

    stands(mb, b) {
      const m = b.mb;
      const vAx = -m.az, vAz = m.ax;
      const N0 = b.standsN || [vAx, vAz];
      const toward = vAx * N0[0] + vAz * N0[1] >= 0 ? 1 : -1;
      const steps = 7;
      const W = m.hw * 2;
      for (let i = 0; i < steps; i++) {
        const h = b.h * (i + 1) / steps;
        const vc = (m.hw - W * (i + 0.5) / steps) * toward;
        mb.obox(this.orect(m.cx + vAx * vc, m.cz + vAz * vc, m.ax, m.az, m.hl, W / steps / 2 + 0.02), 0, h, { side: { layer: T('concrete'), us: 4, vs: 4 }, top: { layer: T('stands'), us: 2 } });
      }
      const bx = m.cx - vAx * toward * m.hw, bz = m.cz - vAz * toward * m.hw;
      mb.obox(this.orect(m.cx, m.cz, m.ax, m.az, m.hl, m.hw), b.h + 4.8, b.h + 5.1, { layer: T('metal'), us: 6, vs: 6 });
      mb.obox(this.orect(bx, bz, m.ax, m.az, m.hl, 0.2), b.h, b.h + 4.8, { layer: T('metal'), us: 4, vs: 4, c: [200, 200, 200, 255] });
      for (let k = -2; k <= 2; k++) { const x = bx + m.ax * k * m.hl * 0.45, z = bz + m.az * k * m.hl * 0.45; mb.box(x - 0.2, 0, z - 0.2, x + 0.2, b.h + 5, z + 0.2, { layer: T('darkmetal'), c: [120, 120, 120, 255] }); }
    }

    frame(mb, b) {
      const m = b.mb;
      const floors = b.floors || 8;
      for (let f = 0; f <= floors; f++) {
        const y = f * 2.8;
        const shrink = f > floors - 2 ? 0.5 : 1;
        mb.obox(this.orect(m.cx - m.ax * m.hl * (1 - shrink), m.cz - m.az * m.hl * (1 - shrink), m.ax, m.az, m.hl * shrink, m.hw), y, y + 0.25, { layer: T('concrete'), us: 4, vs: 4 });
        if (f >= floors) continue;
        for (let u = -m.hl; u <= -m.hl + m.hl * 2 * shrink + 0.1; u += 6) for (const v of [-m.hw + 0.2, m.hw - 0.2]) {
          const x = m.cx + m.ax * u - m.az * v, z = m.cz + m.az * u + m.ax * v;
          mb.box(x - 0.2, y, z - 0.2, x + 0.2, y + 2.8, z + 0.2, { layer: T('concrete'), us: 2, vs: 2 });
        }
        if (f < 4) {
          const a = [m.cx - m.ax * m.hl + m.az * m.hw, m.cz - m.az * m.hl - m.ax * m.hw], bb = [m.cx + m.ax * m.hl + m.az * m.hw, m.cz + m.az * m.hl - m.ax * m.hw];
          mb.wall(bb[0], bb[1], a[0], a[1], y, y + 2.8, { layer: T('brick5'), us: 3.2, vs: 2.8, kind: K.FACADE });
        }
      }
    }

    walls() {
      const c = this.city;
      for (const f of c.fenceSegs || []) {
        if (f.panel) continue;
        const cx = (f.ax + f.bx) / 2, cz = (f.az + f.bz) / 2;
        const ch = this.chunkAt(cx, cz);
        const L = Math.hypot(f.bx - f.ax, f.bz - f.az);
        if (L < 0.05) continue;
        const ux = (f.bx - f.ax) / L, uz = (f.bz - f.az) / L;
        const tex = f.tex || 'concfence';
        const mesh = tex === 'metalfence';
        const us = tex === 'concfence' ? 4 : mesh ? 2.5 : 3, vs = tex === 'concfence' ? 2.4 : f.h;
        const t = mesh ? 0.03 : f.t / 2;
        ch.mb.obox(this.orect(cx, cz, ux, uz, L / 2, t), -0.1, f.h, { side: { layer: T(tex), us, vs, v0: 0, kind: mesh ? K.DECAL : 0 }, top: { layer: T('concrete'), us: 2 }, noTop: mesh });
        this.grow(ch, Math.min(f.ax, f.bx), Math.min(f.az, f.bz), Math.max(f.ax, f.bx), Math.max(f.az, f.bz), f.h);
      }
      for (const bx of c.boxes) {
        if (bx.kind !== 'rail' || !bx.poly) continue;
        const ch = this.chunkAt((bx.x0 + bx.x1) / 2, (bx.z0 + bx.z1) / 2);
        ch.mb.obox(bx.poly, 0, bx.y1, { layer: T(bx.tex || 'metal'), us: 2, vs: 2 });
        this.grow(ch, bx.x0, bx.z0, bx.x1, bx.z1, bx.y1);
      }
    }

    wireSeg(ax, ay, az, bx, by, bz, sag, n) {
      const segs = n || 3;
      const L = Math.hypot(bx - ax, bz - az);
      if (L < 0.2) return;
      const ch = this.chunkAt((ax + bx) / 2, (az + bz) / 2);
      const mb = ch.mb;
      const ux = (bx - ax) / L, uz = (bz - az) / L, rx = -uz * 0.016, rz = ux * 0.016;
      const P = t => [ax + (bx - ax) * t, ay + (by - ay) * t - sag * 4 * t * (1 - t), az + (bz - az) * t];
      const c = [46, 46, 48, 255], lay = T('darkmetal');
      for (let k = 0; k < segs; k++) {
        const a = P(k / segs), b = P((k + 1) / segs);
        mb.quad([a[0] - rx, a[1], a[2] - rz, b[0] - rx, b[1], b[2] - rz, b[0] + rx, b[1], b[2] + rz, a[0] + rx, a[1], a[2] + rz], [0, 1, 0], [0, 0, 1, 0, 1, 1, 0, 1], c, lay, 0);
        mb.quad([a[0], a[1] - 0.016, a[2], b[0], b[1] - 0.016, b[2], b[0], b[1] + 0.016, b[2], a[0], a[1] + 0.016, a[2]], [-uz, 0, ux], [0, 0, 1, 0, 1, 1, 0, 1], c, lay, 0);
      }
      this.grow(ch, Math.min(ax, bx), Math.min(az, bz), Math.max(ax, bx), Math.max(az, bz), Math.max(ay, by) + 1);
    }

    wireLine(pts, y, sag) {
      for (let i = 2; i < pts.length; i += 2) {
        const ax = pts[i - 2], az = pts[i - 1], bx = pts[i], bz = pts[i + 1];
        const L = Math.hypot(bx - ax, bz - az);
        const n = Math.max(1, Math.ceil(L / 34));
        for (let k = 0; k < n; k++) this.wireSeg(ax + (bx - ax) * k / n, y, az + (bz - az) * k / n, ax + (bx - ax) * (k + 1) / n, y, az + (bz - az) * (k + 1) / n, sag * Math.min(1, L / n / 34), L / n > 12 ? 3 : 1);
      }
    }

    wires() {
      const c = this.city;
      const wired = e => e.trolley && !(e.bridge && e.len > 200);
      const curb = (e, dir) => { const ids = dir > 0 ? e.lanesF : e.lanesB; return ids.length ? c.lanes[ids[ids.length - 1]] : null; };
      const pair = (pts, sag) => { for (const d of [-0.3, 0.3]) this.wireLine(N.offsetPline(pts, d), 5.9, sag); };
      for (const e of c.edges) if (wired(e)) for (const dir of [1, -1]) { const l = curb(e, dir); if (l) pair(l.pts, 0.14); }
      for (const n of c.nodes) {
        const inc = [], out = [];
        for (const en of n.ends) {
          const e = c.edges[en.e];
          if (!wired(e)) continue;
          for (const dir of [1, -1]) {
            const l = curb(e, dir);
            if (l && l.to === n.id && !inc.includes(l)) inc.push(l);
            if (l && l.from === n.id && !out.includes(l)) out.push(l);
          }
        }
        for (const [a, b] of N.wireLinks(inc, out)) pair(N.wireCurve(a, b), 0);
      }
      for (const s of c.spans || []) {
        this.wireSeg(s.ax, 6.35, s.az, s.bx, 6.35, s.bz, 0.22, 4);
        for (const [x, z] of [[s.ax, s.az], [s.bx, s.bz]]) {
          const ch = this.chunkAt(x, z);
          ch.mb.box(x - 0.09, 6.2, z - 0.09, x + 0.09, 6.5, z + 0.09, { layer: T('darkmetal'), c: [70, 70, 72, 255] });
        }
      }
      for (const r of c.rails) if (r.k === 'T') this.wireLine(r.pts, 6.0, 0.12);
      for (const t of c.tramPoles || []) {
        const ch = this.chunkAt(t.x, t.z);
        ch.mb.box(t.x - 0.1, 0, t.z - 0.1, t.x + 0.1, 7.6, t.z + 0.1, { layer: T('darkmetal'), c: [110, 112, 114, 255] });
        this.wireSeg(t.x, 6.6, t.z, t.tx, 6.2, t.tz, 0, 1);
        this.wireSeg(t.x, 7.3, t.z, t.tx, 6.25, t.tz, 0, 1);
        this.grow(ch, t.x - 4, t.z - 4, t.x + 4, t.z + 4, 8);
      }
    }

    signs() {
      const c = this.city, A = this.atlas.map;
      for (const s of c.signs) {
        const uv = A[s.style + '|' + s.text];
        if (!uv) continue;
        const ch = this.chunkAt(s.x, s.z);
        const kind = s.style === 'relief' || s.style === 'paint' || s.style === 'gazlogo' ? K.ATLAS : s.style === 'neon' || s.style === 'neonsmall' || s.style === 'roof' || s.style === 'roofsmall' || s.style === 'boxletter' ? K.NEON : K.SIGN;
        const rx = -s.nz, rz = s.nx;
        const hw = s.w / 2, hh = s.h / 2;
        const both = s.face === 'both';
        N.signFace(ch.mb, s.x + s.nx * 0.05, s.y, s.z + s.nz * 0.05, s.nx, s.nz, s.w, s.h, uv, kind, !both && kind === K.SIGN ? [60, 60, 64, 255] : null);
        if (both) {
          N.signFace(ch.mb, s.x - s.nx * 0.01, s.y, s.z - s.nz * 0.01, s.nx, s.nz, s.w, s.h, uv, K.ATLAS, null, [46, 46, 50, 255]);
          const steel = { layer: T('darkmetal'), c: [62, 64, 68, 255] }, bx = s.x - s.nx * 0.14, bz = s.z - s.nz * 0.14;
          for (const yy of [s.y - hh + 0.15, s.y + hh - 0.25]) ch.mb.obox(this.orect(bx, bz, rx, rz, hw, 0.04), yy, yy + 0.1, steel);
        }
        if ((s.style === 'roof' || s.style === 'roofsmall') && s.face === 'both') {
          const bx = s.x - s.nx * 0.14, bz = s.z - s.nz * 0.14;
          for (const k of [-0.9, -0.45, 0, 0.45, 0.9]) ch.mb.box(bx - 0.05 + rx * hw * k, s.y - hh - 2.6, bz - 0.05 + rz * hw * k, bx + 0.05 + rx * hw * k, s.y + hh - 0.15, bz + 0.05 + rz * hw * k, { layer: T('darkmetal'), c: [62, 64, 68, 255] });
        }
        if (s.post) for (const k of [-0.42, 0.42]) ch.mb.box(s.x + rx * s.w * k - 0.06, 0, s.z + rz * s.w * k - 0.06, s.x + rx * s.w * k + 0.06, s.y - hh, s.z + rz * s.w * k + 0.06, { layer: T('darkmetal'), c: [110, 110, 110, 255] });
        this.grow(ch, s.x - hw, s.z - hw, s.x + hw, s.z + hw, s.y + hh);
      }
    }

    ramps() {
      for (const r of this.city.ramps) {
        if (r.stair) continue;
        const ch = this.chunkAt(r.cx, r.cz);
        const mb = ch.mb;
        const fx = r.fx, fz = r.fz, rx = -fz, rz = fx;
        const P = (u, v, y) => [r.cx + fx * u + rx * v, y, r.cz + fz * u + rz * v];
        const lo = 0.1, hi = 0.1 + r.h;
        const a = P(-r.l / 2, -r.w / 2, lo), b = P(-r.l / 2, r.w / 2, lo), c2 = P(r.l / 2, r.w / 2, hi), d = P(r.l / 2, -r.w / 2, hi);
        mb.quad([a[0], a[1], a[2], b[0], b[1], b[2], c2[0], c2[1], c2[2], d[0], d[1], d[2]], [-fx * 0.2, 0.98, -fz * 0.2], [0, 0, 1, 0, 1, r.l / 2, 0, r.l / 2], [220, 200, 170, 255], T('plank'), 0);
        const e = P(r.l / 2, -r.w / 2, 0), f = P(r.l / 2, r.w / 2, 0);
        mb.quad([d[0], d[1], d[2], c2[0], c2[1], c2[2], f[0], f[1], f[2], e[0], e[1], e[2]], [fx, 0, fz], [0, 0, 1, 0, 1, 1, 0, 1], WHITE, T('plank'), 0);
        for (const [s0, s1, top, sg] of [[a, e, d, -1], [b, f, c2, 1]]) {
          mb.ensure(3, 3);
          const i0 = mb.v(s0[0], 0, s0[2], rx * sg, 0, rz * sg, 0, 1, WHITE, T('plank'), 0);
          mb.v(s1[0], 0, s1[2], rx * sg, 0, rz * sg, 1, 1, WHITE, T('plank'), 0);
          mb.v(top[0], top[1], top[2], rx * sg, 0, rz * sg, 1, 0, WHITE, T('plank'), 0);
          mb.tri(i0, i0 + 1, i0 + 2);
        }
        this.grow(ch, r.x0, r.z0, r.x1, r.z1, hi + 1);
      }
    }

    buildBackdrop() {
      const mb = new MB(16384);
      const c = this.city;
      const rng = N.rng(777);
      const cx = (c.PX0 + c.PX1) / 2, cz = (c.PZ0 + c.PZ1) / 2;
      mb.flat(cx - 16000, cz - 16000, cx + 16000, cz + 16000, N.WATER_Y, { layer: T('water'), kind: K.WATER, us: 24 });
      mb.append(this.farLand, 0, 0, 0, 0);
      if (this.land) {
        for (let i = 0; i < 900; i++) {
          const a = rng() * Math.PI * 2, d = 200 + rng() * 2600;
          const ex = Math.cos(a), ez = Math.sin(a);
          const x = N.clamp(cx + ex * 1e5, this.X0, this.GX1) + ex * d, z = N.clamp(cz + ez * 1e5, this.Z0, this.GZ1) + ez * d;
          if (this.inGrid(x, z, 0) || !N.pointInPoly(this.land, x, z)) continue;
          if (rng() < 0.12) {
            const tall = rng() < 0.4;
            const yaw = rng() * Math.PI;
            const l = tall ? 16 : 36 + rng() * 50, w = 13, h = tall ? 30 + rng() * 16 : 14 + rng() * 12;
            mb.obox(this.orect(x, z, Math.sin(yaw), -Math.cos(yaw), l / 2, w / 2), 0, h, { side: { layer: T(rng.pick(['panel9', 'panel16', 'khrush', 'panel9b'])), kind: K.FAR, us: 3.4, vs: 2.8 }, top: { layer: T('tar'), us: 6, kind: K.FAR } });
          } else mb.cross(x, 0, z, 14 + rng() * 10, 13 + rng() * 9, T(rng() < 0.5 ? 'leaves_pine' : 'leaves_linden'), [175, 188, 172, 255], 2, K.FARLEAF);
        }
      }
      this.rightBank(mb, rng, cx, cz);
      this.bridge(mb);
      return mb;
    }

    rightBank(mb, rng, cx, cz) {
      const c = this.city;
      const R = c.bankR || [];
      if (R.length < 4) return;
      const cum = N.cumLen(R), L = cum[cum.length - 1];
      const TOP = 68;
      const rows = [0, 26, 60, 110, 180, 270, 340, 900, 2600];
      const hAt = d => (d <= 12 ? -2.4 + d * 0.3 : d >= 270 ? TOP : 1.2 + (TOP - 1.2) * Math.pow((d - 12) / 258, 0.75));
      const cols = [];
      for (let s = 0; s <= L; s += 60) {
        const p = N.plineAt(R, cum, s);
        let nx = -p.dz, nz = p.dx;
        if (c.inWater(p.x + nx * 12, p.z + nz * 12)) { nx = -nx; nz = -nz; }
        cols.push({ x: p.x, z: p.z, nx, nz });
      }
      for (let i = 1; i < cols.length; i++) {
        const A = cols[i - 1], B = cols[i];
        if (Math.min(Math.hypot(A.x - cx, A.z - cz), Math.hypot(B.x - cx, B.z - cz)) > 7500) continue;
        for (let k = 1; k < rows.length; k++) {
          const d0 = rows[k - 1], d1 = rows[k];
          const q = [A.x + A.nx * d0, hAt(d0), A.z + A.nz * d0, B.x + B.nx * d0, hAt(d0), B.z + B.nz * d0, B.x + B.nx * d1, hAt(d1), B.z + B.nz * d1, A.x + A.nx * d1, hAt(d1), A.z + A.nz * d1];
          const tex = k === 1 ? 'sand' : k <= 5 ? 'cliff' : 'grass';
          const s = k <= 5 ? 30 : 60;
          mb.quad(q, [A.nx * 0.5, 0.8, A.nz * 0.5], [q[0] / s, d0 / s, q[3] / s, d0 / s, q[6] / s, d1 / s, q[9] / s, d1 / s], k <= 5 ? [205, 215, 200, 255] : [185, 196, 170, 255], T(tex), K.FAR);
        }
        for (let t = 0; t < 6; t++) {
          const u = rng(), d = 24 + rng() * 240;
          const x = A.x + (B.x - A.x) * u + (A.nx + B.nx) / 2 * d, z = A.z + (B.z - A.z) * u + (A.nz + B.nz) / 2 * d;
          mb.cross(x, hAt(d) - 1, z, 12 + rng() * 6, 12 + rng() * 6, T('leaves_linden'), [120, 140, 115, 255], 2, K.FARLEAF);
        }
        if (rng() < 0.6) {
          const u = rng(), d = 330 + rng() * 520;
          const x = A.x + (B.x - A.x) * u + A.nx * d, z = A.z + (B.z - A.z) * u + A.nz * d;
          const tall = rng() < 0.4;
          const w = 14, l = tall ? 18 : 40 + rng() * 40, h = tall ? 40 + rng() * 12 : 16 + rng() * 12;
          const yaw = Math.atan2(A.nx, -A.nz) + (rng() < 0.5 ? 0 : Math.PI / 2);
          mb.obox(this.orect(x, z, Math.sin(yaw), -Math.cos(yaw), l / 2, w / 2), TOP - 1, TOP + h, { side: { layer: T(rng.pick(['panel9', 'panel16', 'khrush', 'panel9b'])), kind: K.FAR, us: 3.4, vs: 2.8 }, top: { layer: T('tar'), us: 6, kind: K.FAR } });
        }
      }
    }

    bridge(mb) {
      const c = this.city;
      for (const bd of c.bridgeDecks || []) {
        let s1 = 1300;
        for (let s = 200; s < 4000; s += 10) if (!c.inWater(bd.x + bd.dx * s, bd.z + bd.dz * s) && c.inWater(bd.x + bd.dx * (s - 20), bd.z + bd.dz * (s - 20))) { s1 = s + 350; break; }
        const bx = bd.x + bd.dx * s1, bz = bd.z + bd.dz * s1;
        const n = Math.ceil(s1 / 50);
        const hw = 10;
        const rx = -bd.dz, rz = bd.dx;
        const yAt = t => Math.min(1, t * 2.4) * 34 + t * t * 30;
        for (let i = 0; i < n; i++) {
          const t0 = i / n, t1 = (i + 1) / n;
          const x0 = bd.x + (bx - bd.x) * t0, z0 = bd.z + (bz - bd.z) * t0, x1 = bd.x + (bx - bd.x) * t1, z1 = bd.z + (bz - bd.z) * t1;
          const y0 = yAt(t0) + 0.05, y1 = yAt(t1) + 0.05;
          mb.quad([x0 - rx * hw, y0, z0 - rz * hw, x1 - rx * hw, y1, z1 - rz * hw, x1 + rx * hw, y1, z1 + rz * hw, x0 + rx * hw, y0, z0 + rz * hw], [0, 1, 0], [0, (i * 50) / 7, 3, (i * 50) / 7, 3, ((i + 1) * 50) / 7, 0, ((i + 1) * 50) / 7], WHITE, T('asphalt'), K.FAR);
          for (const s of [-1, 1]) {
            mb.quad([x0 + rx * hw * s, y0 - 2.2, z0 + rz * hw * s, x1 + rx * hw * s, y1 - 2.2, z1 + rz * hw * s, x1 + rx * hw * s, y1, z1 + rz * hw * s, x0 + rx * hw * s, y0, z0 + rz * hw * s], [rx * s, 0, rz * s], [0, 1, 4, 1, 4, 0, 0, 0], [200, 200, 195, 255], T('concrete'), K.FAR);
            mb.quad([x0 + rx * hw * s, y0, z0 + rz * hw * s, x1 + rx * hw * s, y1, z1 + rz * hw * s, x1 + rx * hw * s, y1 + 1.1, z1 + rz * hw * s, x0 + rx * hw * s, y0 + 1.1, z0 + rz * hw * s], [rx * s, 0, rz * s], [0, 1, 4, 1, 4, 0, 0, 0], [150, 160, 170, 255], T('metal'), K.FAR);
          }
          if (i > 0 && y0 > 6) mb.box(x0 - 2.5, N.WATER_Y - 3, z0 - 2.5, x0 + 2.5, y0 - 2.2, z0 + 2.5, { layer: T('concrete'), kind: K.FAR, us: 4, vs: 4 });
        }
      }
    }

    buildInterior() {
      const r = this.city.clubRoom;
      const mb = new MB(4096);
      if (!r) return mb;
      const { x0, z0, x1, z1, H } = r;
      mb.flat(x0, z0, x1, z1, 0.1, { layer: T('carpet'), us: 4 });
      const dx0 = x0 + 12, dz0 = z0 + 8, dx1 = x0 + 28, dz1 = z0 + 22;
      mb.flat(dx0, dz0, dx1, dz1, 0.13, { layer: T('dancefloor'), kind: K.EMIT, us: 4 });
      mb.flat(x0, z0, x1, z1, H, { layer: T('clubwall'), us: 6, down: true, c: [120, 110, 130, 255] });
      mb.wall(x0, z0, x1, z0, 0, H, { layer: T('clubwall'), us: 6, vs: H, v0: 0, c: [200, 190, 200, 255] });
      mb.wall(x1, z1, x0, z1, 0, H, { layer: T('clubwall'), us: 6, vs: H, v0: 0, c: [200, 190, 200, 255] });
      mb.wall(x0, z1, x0, z0, 0, H, { layer: T('clubwall'), us: 6, vs: H, v0: 0, c: [200, 190, 200, 255] });
      mb.wall(x1, z0, x1, z1, 0, H, { layer: T('clubwall'), us: 6, vs: H, v0: 0, c: [200, 190, 200, 255] });
      mb.box(x0 + 2, 0, z0 + 2, x0 + 4, 1.1, z0 + 20, { side: { layer: T('barwood'), us: 3, vs: 1.1 }, top: { layer: T('darkmetal'), us: 2 } });
      mb.box(x0 + 0.3, 0.8, z0 + 2, x0 + 0.8, 3.2, z0 + 20, { side: { layer: T('barwood'), us: 3, vs: 1.4, kind: K.NIGHT }, top: { layer: T('darkmetal') } });
      mb.box(x1 - 10, 0, z0 + 1, x1 - 1, 0.9, z0 + 8, { side: { layer: T('darkmetal'), us: 2, vs: 1 }, top: { layer: T('deck'), us: 2 } });
      mb.box(x0 + 26, 0, z1 - 7, x0 + 38, 0.5, z1 - 1, { side: { layer: T('darkmetal'), us: 2, vs: 1 }, top: { layer: T('carpet'), us: 2 } });
      for (let i = 0; i < 5; i++) mb.box(x0 + 27 + i * 2.2, 0.5, z1 - 3, x0 + 28.6 + i * 2.2, 1.0, z1 - 1.6, { layer: T('white'), c: [140, 30, 60, 255] });
      mb.box(x0 + 30, 0.5, z1 - 5.2, x0 + 34, 1.2, z1 - 3.8, { layer: T('glass') });
      for (const x of [x0 + 10, x0 + 30]) for (const z of [z0 + 6, z1 - 10]) mb.cyl(x, z, 0, H, 0.4, 0.4, 8, { layer: T('plaster'), kind: 0, c: [120, 90, 140, 255], us: 1, vs: 2 });
      mb.box(dx0, H - 0.6, dz0, dx1, H - 0.4, dz0 + 0.3, { layer: T('darkmetal'), c: [120, 120, 120, 255] });
      mb.box(dx0, H - 0.6, dz1 - 0.3, dx1, H - 0.4, dz1, { layer: T('darkmetal'), c: [120, 120, 120, 255] });
      mb.wall(x0 + 0.05, z1 - 6, x0 + 0.05, z1 - 2, 0, 2.6, { layer: T('service'), us: 4, vs: 2.6, v0: 0.2 });
      this.clubBounds = { x0, z0, x1, z1 };
      return mb;
    }
  }

  N.CityGeo = CityGeo;

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
