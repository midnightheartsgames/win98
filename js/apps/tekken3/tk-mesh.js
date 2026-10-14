(function (T) {
  'use strict';
  const { vadd, vsub, vscale, vdot, vcross, vlen, vnorm, vmad, mvec, mmul, rotY, rotX, rotZ, clamp, rgb, mixc, shade, M_ID } = T;

  const STRIDE = 12;

  class MB {
    constructor(cap) { this.data = new Float32Array((cap || 4096) * STRIDE); this.n = 0; this.alpha = 1; }
    reset() { this.n = 0; return this; }
    grow(need) {
      if ((this.n + need) * STRIDE <= this.data.length) return;
      const nd = new Float32Array(Math.max(this.data.length * 2, (this.n + need) * STRIDE));
      nd.set(this.data); this.data = nd;
    }
    v(p, n, c, a, u, w) {
      const d = this.data, i = this.n * STRIDE;
      d[i] = p[0]; d[i + 1] = p[1]; d[i + 2] = p[2];
      d[i + 3] = n[0]; d[i + 4] = n[1]; d[i + 5] = n[2];
      d[i + 6] = c[0]; d[i + 7] = c[1]; d[i + 8] = c[2]; d[i + 9] = a;
      d[i + 10] = u || 0; d[i + 11] = w || 0;
      this.n++;
    }
    tri(a, b, c, col, center) {
      this.grow(3);
      let n = vcross(vsub(b, a), vsub(c, a));
      const l = vlen(n);
      if (l < 1e-9) return;
      n = vscale(n, 1 / l);
      if (center) {
        const fc = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
        if (vdot(n, vsub(fc, center)) < 0) { n = vscale(n, -1); const t = b; b = c; c = t; }
      }
      const al = this.alpha;
      this.v(a, n, col, al); this.v(b, n, col, al); this.v(c, n, col, al);
    }
    quad(a, b, c, d, col, center) { this.tri(a, b, c, col, center); this.tri(a, c, d, col, center); }
    tquad(a, b, c, d, col, alpha, uv) {
      this.grow(6);
      let n = vnorm(vcross(vsub(b, a), vsub(c, a)));
      const al = alpha === undefined ? 1 : alpha;
      const u = uv || [0, 0, 1, 1];
      this.v(a, n, col, al, u[0], u[1]); this.v(b, n, col, al, u[2], u[1]); this.v(c, n, col, al, u[2], u[3]);
      this.v(a, n, col, al, u[0], u[1]); this.v(c, n, col, al, u[2], u[3]); this.v(d, n, col, al, u[0], u[3]);
    }
    box(c, ax, ay, az, col, skipBottom) {
      const P = (sx, sy, sz) => [c[0] + ax[0] * sx + ay[0] * sy + az[0] * sz, c[1] + ax[1] * sx + ay[1] * sy + az[1] * sz, c[2] + ax[2] * sx + ay[2] * sy + az[2] * sz];
      const p000 = P(-1, -1, -1), p100 = P(1, -1, -1), p010 = P(-1, 1, -1), p110 = P(1, 1, -1);
      const p001 = P(-1, -1, 1), p101 = P(1, -1, 1), p011 = P(-1, 1, 1), p111 = P(1, 1, 1);
      this.quad(p001, p101, p111, p011, col, c);
      this.quad(p100, p000, p010, p110, col, c);
      this.quad(p101, p100, p110, p111, col, c);
      this.quad(p000, p001, p011, p010, col, c);
      this.quad(p011, p111, p110, p010, col, c);
      if (!skipBottom) this.quad(p000, p100, p101, p001, col, c);
    }
    tbox(b0, b1, X, Z, w0, d0, w1, d1, col, colTop) {
      const c = vscale(vadd(b0, b1), 0.5);
      const A = (b, w, d, sx, sz) => vadd(b, vadd(vscale(X, w * sx), vscale(Z, d * sz)));
      const q = [A(b0, w0, d0, -1, -1), A(b0, w0, d0, 1, -1), A(b0, w0, d0, 1, 1), A(b0, w0, d0, -1, 1)];
      const r = [A(b1, w1, d1, -1, -1), A(b1, w1, d1, 1, -1), A(b1, w1, d1, 1, 1), A(b1, w1, d1, -1, 1)];
      for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; this.quad(q[i], q[j], r[j], r[i], col, c); }
      this.quad(q[0], q[1], q[2], q[3], col, c);
      this.quad(r[0], r[1], r[2], r[3], colTop || col, c);
    }
    prism(a, b, r0, r1, n, ref, col, colEnd) {
      const ax = vsub(b, a);
      const len = vlen(ax);
      if (len < 1e-5) return;
      const d = vscale(ax, 1 / len);
      let u = vsub(ref, vscale(d, vdot(ref, d)));
      if (vlen(u) < 1e-4) u = Math.abs(d[1]) < 0.9 ? vcross(d, [0, 1, 0]) : vcross(d, [1, 0, 0]);
      u = vnorm(u);
      const w = vcross(d, u);
      const c = vscale(vadd(a, b), 0.5);
      const ra = [], rb = [];
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n * Math.PI * 2;
        const o = vadd(vscale(u, Math.cos(t)), vscale(w, Math.sin(t)));
        ra.push(vmad(a, o, r0)); rb.push(vmad(b, o, r1));
      }
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        this.quad(ra[i], ra[j], rb[j], rb[i], col, c);
      }
      const ce = colEnd || col;
      for (let i = 1; i < n - 1; i++) {
        this.tri(ra[0], ra[i], ra[i + 1], col, c);
        this.tri(rb[0], rb[i], rb[i + 1], ce, c);
      }
    }
    ellipsoid(c, R, rx, ry, rz, col, seg, rings, from, to, colFn) {
      const S = seg || 8, Rn = rings || 5;
      const f0 = from === undefined ? 0 : from, f1 = to === undefined ? Rn : to;
      const pt = (i, k) => {
        const th = k / Rn * Math.PI, ph = i / S * Math.PI * 2;
        const l = [Math.sin(th) * Math.cos(ph) * rx, Math.cos(th) * ry, Math.sin(th) * Math.sin(ph) * rz];
        return vadd(c, mvec(R, l));
      };
      for (let k = f0; k < f1; k++) {
        for (let i = 0; i < S; i++) {
          const a = pt(i, k), b = pt(i + 1, k), d = pt(i, k + 1), e = pt(i + 1, k + 1);
          const cc = colFn ? colFn(i, k) : col;
          if (k === 0) this.tri(a, e, d, cc, c);
          else if (k === Rn - 1) this.tri(a, b, d, cc, c);
          else this.quad(a, b, e, d, cc, c);
        }
      }
    }
  }

  function frameFromDir(d, upHint) {
    let up = vsub(upHint, vscale(d, vdot(upHint, d)));
    if (vlen(up) < 1e-4) up = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    up = vnorm(up);
    const side = vcross(d, up);
    return [d[0], up[0], side[0], d[1], up[1], side[1], d[2], up[2], side[2]];
  }

  const ax = (R, i, s) => [R[i] * s, R[3 + i] * s, R[6 + i] * s];

  function toWorld(j, pos, yaw) {
    const R = rotY(yaw);
    const P = v => [pos[0] + R[0] * v[0] + R[2] * v[2], pos[1] + v[1], pos[2] + R[6] * v[0] + R[8] * v[2]];
    const D = v => [R[0] * v[0] + R[2] * v[2], v[1], R[6] * v[0] + R[8] * v[2]];
    const o = { s: j.s, lo: j.lo, ro: j.ro };
    for (const k of ['P', 'S0', 'N', 'neckTop', 'head', 'shL', 'shR', 'elL', 'elR', 'waL', 'waR', 'fiL', 'fiR', 'hipL', 'hipR', 'knL', 'knR', 'anL', 'anR']) o[k] = P(j[k]);
    for (const k of ['fdL', 'fdR', 'ftL', 'ftR']) o[k] = D(j[k]);
    for (const k of ['Rp', 'Rc', 'Rh']) o[k] = mmul(R, j[k]);
    return o;
  }

  const WHITE = [1, 1, 1];

  function col(v, fallback) {
    if (!v) return fallback;
    return typeof v === 'string' ? rgb(v) : v;
  }

  function buildLookColors(look) {
    const skin = col(look.skin, rgb('#c8906c'));
    const top = look.top ? col(look.top) : null;
    const pants = col(look.pants, rgb('#202020'));
    return {
      skin, top, pants,
      hair: col(look.hair, rgb('#181410')),
      shoes: look.shoes === null ? skin : col(look.shoes, rgb('#1a1a1a')),
      gloves: look.gloves ? col(look.gloves) : skin,
      belt: col(look.belt, shade(pants, 0.5)),
      sleeve: top && look.sleeves ? top : skin,
      fore: top && look.sleeves === 'long' ? top : skin,
      shin: look.shorts ? skin : pants,
      eye: col(look.eye, rgb('#18120e')),
      lip: col(look.lip, shade(skin, 0.72)),
      trim: col(look.trim, rgb('#d8b040')),
      accent: col(look.accent, rgb('#b01818'))
    };
  }

  function headPoint(j, B, look, x, y, z) {
    const s = j.s;
    const hw = (look.headW || 1) * B.headR * s, hh = (look.headH || 1.12) * B.headR * s, hd = (look.headD || 1.02) * B.headR * s;
    return vadd(j.head, mvec(j.Rh, [x * hd, y * hh, z * hw]));
  }

  function buildHead(mb, j, B, look, C) {
    const s = j.s, R = j.Rh;
    const hw = (look.headW || 1) * B.headR * s, hh = (look.headH || 1.12) * B.headR * s, hd = (look.headD || 1.02) * B.headR * s;
    const kind = look.head || 'human';
    const hp = (x, y, z) => vadd(j.head, mvec(R, [x * hd, y * hh, z * hw]));
    if (kind === 'robot') {
      mb.box(j.head, ax(R, 0, hd * 1.05), ax(R, 1, hh * 0.95), ax(R, 2, hw * 1.05), C.top || C.skin);
      mb.box(hp(0.98, 0.18, 0), ax(R, 0, hd * 0.12), ax(R, 1, hh * 0.2), ax(R, 2, hw * 0.85), C.accent);
      mb.box(hp(0.6, -0.55, 0), ax(R, 0, hd * 0.45), ax(R, 1, hh * 0.25), ax(R, 2, hw * 0.7), shade(C.top || C.skin, 0.7));
      mb.prism(hp(0, 0.9, 0.55), hp(0, 1.6, 0.6), 0.012 * s, 0.008 * s, 4, [1, 0, 0], C.trim);
      return;
    }
    if (kind === 'dummy') {
      mb.prism(hp(0, -0.95, 0), hp(0, 0.95, 0), hw * 0.95, hw * 0.9, 8, ax(R, 0, 1), C.skin, shade(C.skin, 0.8));
      mb.box(hp(0.9, 0.15, 0), ax(R, 0, hd * 0.12), ax(R, 1, hh * 0.08), ax(R, 2, hw * 0.55), shade(C.skin, 0.55));
      return;
    }
    const skinHead = look.headCol ? col(look.headCol) : C.skin;
    mb.ellipsoid(j.head, R, hd, hh, hw, skinHead, 8, 6);
    if (kind === 'bear') {
      mb.box(hp(0.95, -0.28, 0), ax(R, 0, hd * 0.42), ax(R, 1, hh * 0.3), ax(R, 2, hw * 0.45), shade(skinHead, 1.15));
      mb.box(hp(1.36, -0.18, 0), ax(R, 0, hd * 0.08), ax(R, 1, hh * 0.12), ax(R, 2, hw * 0.2), rgb('#101010'));
      for (const z of [-0.72, 0.72]) mb.ellipsoid(hp(-0.1, 0.9, z), R, hd * 0.26, hh * 0.24, hw * 0.16, skinHead, 5, 3);
      for (const z of [-0.38, 0.38]) mb.box(hp(0.86, 0.2, z), ax(R, 0, hd * 0.05), ax(R, 1, hh * 0.06), ax(R, 2, hw * 0.07), rgb('#0c0a08'));
      return;
    }
    if (kind === 'boss') {
      for (const z of [-0.55, 0.55]) mb.prism(hp(0.1, 0.6, z), hp(0.45, 1.55, z * 1.9), 0.035 * s, 0.006 * s, 5, [1, 0, 0], C.trim);
    }
    const eyeY = 0.12, eyeZ = 0.36;
    if (look.mask) {
      const mc = col(look.mask);
      mb.ellipsoid(j.head, R, hd * 1.05, hh * 1.04, hw * 1.05, mc, 8, 6, 0, 6, (i, k) => (k === 2 && (i === 0 || i === 7)) ? rgb('#f0e8d8') : mc);
    } else {
      for (const z of [-eyeZ, eyeZ]) {
        mb.box(hp(0.9, eyeY, z), ax(R, 0, hd * 0.07), ax(R, 1, hh * 0.05), ax(R, 2, hw * 0.1), C.eye);
        mb.box(hp(0.9, eyeY + 0.17, z * 1.05), ax(R, 0, hd * 0.07), ax(R, 1, hh * 0.035), ax(R, 2, hw * 0.16), look.brow ? col(look.brow) : C.hair);
      }
      mb.box(hp(1.0, -0.12, 0), ax(R, 0, hd * 0.1), ax(R, 1, hh * 0.13), ax(R, 2, hw * 0.08), shade(skinHead, 0.92));
      if (look.glasses) {
        const gc = rgb('#1a1a1a');
        for (const z of [-eyeZ, eyeZ]) {
          mb.box(hp(1.0, eyeY + 0.12, z), ax(R, 0, hd * 0.03), ax(R, 1, hh * 0.025), ax(R, 2, hw * 0.2), gc);
          mb.box(hp(1.0, eyeY - 0.1, z), ax(R, 0, hd * 0.03), ax(R, 1, hh * 0.025), ax(R, 2, hw * 0.2), gc);
          mb.box(hp(1.0, eyeY, z + 0.2 * Math.sign(z)), ax(R, 0, hd * 0.03), ax(R, 1, hh * 0.12), ax(R, 2, hw * 0.025), gc);
          mb.box(hp(1.0, eyeY, z - 0.2 * Math.sign(z)), ax(R, 0, hd * 0.03), ax(R, 1, hh * 0.12), ax(R, 2, hw * 0.025), gc);
          mb.box(hp(0.5, eyeY + 0.05, z * 2.6), ax(R, 0, hd * 0.5), ax(R, 1, hh * 0.02), ax(R, 2, hw * 0.02), gc);
        }
      }
      mb.box(hp(0.86, -0.46, 0), ax(R, 0, hd * 0.07), ax(R, 1, hh * 0.035), ax(R, 2, hw * 0.24), C.lip);
      for (const z of [-1, 1]) mb.box(hp(0, 0, z * 0.98), ax(R, 0, hd * 0.14), ax(R, 1, hh * 0.2), ax(R, 2, hw * 0.06), shade(skinHead, 0.9));
    }
    if (look.beard) {
      const bc = col(look.beard);
      mb.box(hp(0.68, -0.72, 0), ax(R, 0, hd * 0.3), ax(R, 1, hh * 0.26), ax(R, 2, hw * 0.55), bc);
      for (const z of [-1, 1]) mb.box(hp(0.45, -0.42, z * 0.72), ax(R, 0, hd * 0.35), ax(R, 1, hh * 0.3), ax(R, 2, hw * 0.12), bc);
      if (look.beardLong) mb.prism(hp(0.72, -0.9, 0), hp(0.9, -1.9, 0), hw * 0.34, hw * 0.08, 5, ax(R, 0, 1), bc);
    }
    if (look.stache) mb.box(hp(0.93, -0.32, 0), ax(R, 0, hd * 0.06), ax(R, 1, hh * 0.06), ax(R, 2, hw * 0.34), col(look.stache));
    buildHair(mb, j, B, look, C, hp, hd, hh, hw);
    if (look.headband) {
      const bc = col(look.headband);
      const ring = (y) => {
        for (let i = 0; i < 8; i++) {
          const a0 = i / 8 * Math.PI * 2, a1 = (i + 1) / 8 * Math.PI * 2;
          const p0 = hp(Math.cos(a0) * 1.07, y, Math.sin(a0) * 1.07), p1 = hp(Math.cos(a1) * 1.07, y, Math.sin(a1) * 1.07);
          const q0 = hp(Math.cos(a0) * 1.07, y + 0.22, Math.sin(a0) * 1.07), q1 = hp(Math.cos(a1) * 1.07, y + 0.22, Math.sin(a1) * 1.07);
          mb.quad(p0, p1, q1, q0, bc, j.head);
        }
      };
      ring(0.3);
    }
  }

  function buildHair(mb, j, B, look, C, hp, hd, hh, hw) {
    const style = look.hairStyle || 'short';
    if (style === 'bald' || look.mask) return;
    const R = j.Rh, hc = C.hair;
    const cap = (sc, lo) => mb.ellipsoid(hp(-0.1, 0.3, 0), R, hd * sc, hh * sc * 0.92, hw * sc * 1.04, hc, 8, 6, 0, lo || 3);
    if (style === 'short' || style === 'spiky' || style === 'pony' || style === 'long' || style === 'bun' || style === 'topknot' || style === 'braid' || style === 'bob') {
      cap(1.06, 3);
      mb.box(hp(-0.62, 0.05, 0), ax(R, 0, hd * 0.38), ax(R, 1, hh * 0.42), ax(R, 2, hw * 0.9), hc);
      for (const z of [-1, 1]) mb.box(hp(-0.2, 0.32, z * 0.93), ax(R, 0, hd * 0.42), ax(R, 1, hh * 0.22), ax(R, 2, hw * 0.1), hc);
    }
    if (style === 'spiky') {
      const spikes = [[0.3, 0.9, 0], [-0.2, 0.95, 0.35], [-0.2, 0.95, -0.35], [-0.6, 0.7, 0], [0.55, 0.7, 0.5], [0.55, 0.7, -0.5], [-0.55, 0.55, 0.6], [-0.55, 0.55, -0.6], [0.1, 1.0, 0.2], [0.1, 1.0, -0.2]];
      for (const [x, y, z] of spikes) {
        const base = hp(x * 0.8, y * 0.85, z * 0.8);
        const tip = hp(x * 1.5 - 0.25, y * 1.55 + 0.1, z * 1.5);
        mb.prism(base, tip, hw * 0.3, hw * 0.02, 4, ax(R, 0, 1), hc);
      }
    }
    if (style === 'mohawk') mb.box(hp(-0.05, 0.95, 0), ax(R, 0, hd * 0.9), ax(R, 1, hh * 0.35), ax(R, 2, hw * 0.12), hc);
    if (style === 'afro') mb.ellipsoid(hp(-0.15, 0.35, 0), R, hd * 1.35, hh * 1.2, hw * 1.4, hc, 8, 5, 0, 4);
    if (style === 'bun') mb.ellipsoid(hp(-0.5, 0.95, 0), R, hd * 0.35, hh * 0.3, hw * 0.35, hc, 6, 4);
    if (style === 'topknot') mb.prism(hp(-0.1, 0.9, 0), hp(-0.3, 1.45, 0), hw * 0.2, hw * 0.14, 6, ax(R, 0, 1), hc);
    if (style === 'long' || style === 'bob') {
      const len = style === 'long' ? 2.4 : 1.35;
      mb.box(hp(-0.55, 0.9 - len * 0.5, 0), ax(R, 0, hd * 0.45), ax(R, 1, hh * len * 0.5), ax(R, 2, hw * 1.02), hc);
      if (style === 'bob') for (const z of [-0.95, 0.95]) mb.box(hp(0.15, -0.05, z), ax(R, 0, hd * 0.55), ax(R, 1, hh * 0.55), ax(R, 2, hw * 0.1), hc);
    }
    if (look.fringe) mb.box(hp(0.72, 0.62, 0), ax(R, 0, hd * 0.2), ax(R, 1, hh * 0.22), ax(R, 2, hw * 0.8), hc);
  }

  function limbColor(C, part) { return C[part] || C.skin; }

  function buildFighter(mb, jl, B, look, pos, yaw, extra) {
    const j = toWorld(jl, pos, yaw);
    const s = j.s;
    const C = extra && extra.colors ? extra.colors : buildLookColors(look);
    const up = mvec(j.Rc, [0, 1, 0]);
    const fwd = mvec(j.Rc, [1, 0, 0]);
    const right = mvec(j.Rc, [0, 0, 1]);
    const pf = mvec(j.Rp, [1, 0, 0]), pr = mvec(j.Rp, [0, 0, 1]), pu = mvec(j.Rp, [0, 1, 0]);
    const g = look.girth || 1;
    const topC = C.top || C.skin;
    const mid = vmad(j.S0, up, B.spine * s * 0.42);
    mb.tbox(vmad(j.P, pu, -0.1 * s), vmad(j.P, pu, 0.07 * s), pr, pf, B.pelW * s * 0.5 * g, B.pelD * s * 0.5 * g, B.waistW * s * 0.5 * g, B.waistD * s * 0.5 * g, C.pants);
    const waistC = look.abs === 'skin' || !C.top ? C.skin : topC;
    mb.tbox(vmad(j.S0, up, 0.0), mid, right, fwd, B.waistW * s * 0.5 * g, B.waistD * s * 0.5 * g, B.waistW * s * 0.52 * g, B.waistD * s * 0.52 * g, waistC);
    const chestTop = vmad(j.N, up, 0.02 * s);
    const chestC = look.open ? C.skin : topC;
    mb.tbox(mid, chestTop, right, fwd, B.waistW * s * 0.53 * g, B.waistD * s * 0.53 * g, B.chestW * s * 0.5 * g, B.chestD * s * 0.5 * g, chestC);
    if (look.open && C.top) {
      for (const z of [-1, 1]) {
        const a = vmad(vmad(j.S0, right, z * B.waistW * s * 0.36 * g), fwd, B.waistD * s * 0.3);
        const b = vmad(vmad(chestTop, right, z * B.chestW * s * 0.36 * g), fwd, B.chestD * s * 0.28);
        mb.tbox(a, b, right, fwd, B.waistW * s * 0.2 * g, B.waistD * s * 0.28 * g, B.chestW * s * 0.17 * g, B.chestD * s * 0.3 * g, topC);
      }
    }
    if (look.belt !== false) mb.tbox(vmad(j.S0, up, -0.035 * s), vmad(j.S0, up, 0.03 * s), right, fwd, B.waistW * s * 0.53 * g, B.waistD * s * 0.54 * g, B.waistW * s * 0.53 * g, B.waistD * s * 0.54 * g, C.belt);
    mb.prism(vmad(j.N, up, -0.03 * s), vmad(j.neckTop, up, 0.02 * s), B.neckR * s * (look.neck || 1), B.neckR * s * 0.9 * (look.neck || 1), 6, fwd, C.skin);
    buildHead(mb, j, B, look, C);
    const ag = look.armG || 1, lg = look.legG || 1;
    for (const side of ['L', 'R']) {
      const sh = j['sh' + side], el = j['el' + side], wa = j['wa' + side], fi = j['fi' + side], fd = j['fd' + side];
      const hip = j['hip' + side], kn = j['kn' + side], an = j['an' + side], ft = j['ft' + side];
      const sleeve = limbColor(C, 'sleeve'), fore = limbColor(C, 'fore');
      mb.ellipsoid(sh, j.Rc, B.arm[0] * s * 1.25 * ag, B.arm[0] * s * 1.2 * ag, B.arm[0] * s * 1.3 * ag, look.pads ? col(look.pads) : sleeve, 6, 4);
      mb.prism(sh, el, B.arm[0] * s * ag, B.arm[1] * s * ag, 6, fwd, sleeve);
      mb.prism(el, wa, B.arm[2] * s * ag, B.arm[3] * s * ag, 6, up, fore);
      if (look.wrist) mb.prism(vmad(wa, fd, -0.07 * s), vmad(wa, fd, 0.005 * s), B.arm[3] * s * 1.25 * ag, B.arm[3] * s * 1.25 * ag, 6, up, col(look.wrist));
      const handF = frameFromDir(fd, up);
      const open = side === 'L' ? j.lo : j.ro;
      const hs = (look.hand || 1) * s;
      if (open > 0.5) mb.box(vmad(fi, fd, 0.02 * s), ax(handF, 0, B.fist * hs * 0.75), ax(handF, 1, 0.022 * hs), ax(handF, 2, B.handW * hs * 0.5), C.gloves);
      else mb.box(fi, ax(handF, 0, B.fist * hs * 0.55), ax(handF, 1, 0.04 * hs), ax(handF, 2, B.handW * hs * 0.52), C.gloves);
      if (look.claws) for (const z of [-0.6, 0, 0.6]) mb.prism(vmad(vmad(fi, fd, B.fist * hs * 0.5), ax(handF, 2, B.handW * hs * 0.5), z), vmad(vmad(fi, fd, B.fist * hs * 0.95), ax(handF, 2, B.handW * hs * 0.5), z), 0.012 * s, 0.002 * s, 4, up, rgb('#f0ead8'));
      const legUp = vnorm(vsub(hip, kn));
      mb.ellipsoid(vmad(hip, legUp, -0.02 * s), j.Rp, B.leg[0] * s * 1.05 * lg, B.leg[0] * s * 1.0 * lg, B.leg[0] * s * 1.05 * lg, C.pants, 6, 4);
      const wide = look.gi ? 1.22 : 1;
      mb.prism(hip, kn, B.leg[0] * s * lg * wide, B.leg[1] * s * lg * wide, 6, pf, C.pants);
      const shinC = C.shin;
      mb.prism(kn, an, B.leg[2] * s * lg * (look.gi ? 1.3 : 1), B.leg[3] * s * lg * (look.gi ? 1.15 : 1), 6, pf, shinC);
      if (look.kneepads) mb.ellipsoid(vmad(kn, pf, 0.03 * s), j.Rp, B.leg[1] * s * 1.2, B.leg[1] * s * 1.25, B.leg[1] * s * 1.25, col(look.kneepads), 6, 4);
      if (look.shinpads) mb.prism(vmad(kn, vnorm(vsub(an, kn)), 0.05 * s), vmad(an, vnorm(vsub(kn, an)), 0.05 * s), B.leg[2] * s * 1.2, B.leg[3] * s * 1.25, 6, pf, col(look.shinpads));
      const fu = [0, 1, 0];
      let fup = vsub(fu, vscale(ft, vdot(fu, ft)));
      if (vlen(fup) < 0.05) fup = pu;
      const FF = frameFromDir(ft, fup);
      const fh = B.footH * s * 0.5;
      const fc = vmad(vmad(an, ft, B.footLen * s * 0.3), ax(FF, 1, 1), -fh * 0.55);
      mb.box(fc, ax(FF, 0, B.footLen * s * 0.5), ax(FF, 1, fh), ax(FF, 2, B.footW * s * 0.5), C.shoes);
    }
    if (look.parts) for (const pt of look.parts) buildPart(mb, j, B, look, C, pt);
    return j;
  }

  function attachFrame(j, at) {
    if (at === 'head') return [j.head, j.Rh];
    if (at === 'chest') return [j.N, j.Rc];
    if (at === 'spine') return [j.S0, j.Rc];
    if (at === 'pelvis') return [j.P, j.Rp];
    const side = at.slice(-1);
    const up = mvec(j.Rc, [0, 1, 0]);
    if (at.startsWith('hand')) return [j['fi' + side], frameFromDir(j['fd' + side], up)];
    if (at.startsWith('fore')) return [j['wa' + side], frameFromDir(j['fd' + side], up)];
    if (at.startsWith('upper')) return [j['sh' + side], frameFromDir(vnorm(vsub(j['el' + side], j['sh' + side])), up)];
    if (at.startsWith('sh')) return [j['sh' + side], j.Rc];
    if (at.startsWith('thigh')) return [j['hip' + side], frameFromDir(vnorm(vsub(j['kn' + side], j['hip' + side])), mvec(j.Rp, [1, 0, 0]))];
    if (at.startsWith('shin')) return [j['kn' + side], frameFromDir(vnorm(vsub(j['an' + side], j['kn' + side])), mvec(j.Rp, [1, 0, 0]))];
    return [j.P, j.Rp];
  }

  function buildPart(mb, j, B, look, C, pt) {
    const [o, R] = attachFrame(j, pt.at);
    const s = j.s;
    const c = typeof pt.col === 'string' && pt.col[0] !== '#' ? (C[pt.col] || C.skin) : col(pt.col, C.accent);
    const P = v => vadd(o, mvec(R, vscale(v, s)));
    if (pt.shape === 'box') mb.box(P(pt.off || [0, 0, 0]), ax(R, 0, pt.size[0] * s), ax(R, 1, pt.size[1] * s), ax(R, 2, pt.size[2] * s), c);
    else if (pt.shape === 'rod') mb.prism(P(pt.a), P(pt.b), pt.r0 * s, (pt.r1 === undefined ? pt.r0 : pt.r1) * s, pt.n || 6, mvec(R, [1, 0, 0]), c);
    else if (pt.shape === 'ball') mb.ellipsoid(P(pt.off || [0, 0, 0]), R, pt.size[0] * s, pt.size[1] * s, pt.size[2] * s, c, pt.seg || 6, pt.rings || 4);
  }

  Object.assign(T, { MB, frameFromDir, toWorld, buildFighter, buildLookColors, headPoint, attachFrame, STRIDE });
  if (typeof module !== 'undefined' && module.exports) module.exports = T;
})(globalThis.Tk3 = globalThis.Tk3 || {});
