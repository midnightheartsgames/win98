(function (M) {
  'use strict';
  const col = h => {
    if (Array.isArray(h)) return h;
    let hx = h.slice(1);
    if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
    const n = parseInt(hx, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  };
  const mulc = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

  class MB {
    constructor() {
      this.a = [];
      this.bone = 0;
      this.spec = 0;
      this.tex = 0;
      this.uvs = 0.5;
    }
    v(p, n, uv, c) { this.a.push(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1], c[0], c[1], c[2], this.bone, this.spec, this.tex); }
    tri(p0, p1, p2, c, t0, t1, t2) {
      const n = M.norm(M.cross(M.sub(p1, p0), M.sub(p2, p0)));
      this.v(p0, n, t0 || [0, 0], c); this.v(p1, n, t1 || [1, 0], c); this.v(p2, n, t2 || [1, 1], c);
    }
    quad(p0, p1, p2, p3, c, uv) {
      uv = uv || [[0, 1], [1, 1], [1, 0], [0, 0]];
      this.tri(p0, p1, p2, c, uv[0], uv[1], uv[2]);
      this.tri(p0, p2, p3, c, uv[0], uv[2], uv[3]);
    }
    box(cx, cy, cz, sx, sy, sz, c, o) {
      o = o || {};
      c = col(c);
      const hx = sx / 2, hy = sy / 2, hz = sz / 2;
      const tx = o.top ? o.top[0] : 1, tz = o.top ? o.top[1] : 1;
      const ry = o.rot || 0, rx = o.rotX || 0, rz = o.rotZ || 0;
      const cy_ = Math.cos(ry), sy_ = Math.sin(ry), cx_ = Math.cos(rx), sx_ = Math.sin(rx), cz_ = Math.cos(rz), sz_ = Math.sin(rz);
      const P = (x, y, z) => {
        const k = y > 0 ? 1 : 0;
        x *= k ? tx : 1; z *= k ? tz : 1;
        if (o.shift && y > 0) { x += o.shift[0]; z += o.shift[1]; }
        let X = x * cz_ - y * sz_, Y = x * sz_ + y * cz_, Z = z;
        const Y2 = Y * cx_ - Z * sx_, Z2 = Y * sx_ + Z * cx_;
        Y = Y2; Z = Z2;
        return [cx + X * cy_ + Z * sy_, cy + Y, cz - X * sy_ + Z * cy_];
      };
      const u = o.fit ? 1 : 1 / (o.uv || this.uvs);
      const f = o.skip || '';
      const sh = o.shadeSides === false ? 1 : 0.92;
      if (!f.includes('t')) this.quad(P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz), c, [[0, 0], [sx * u, 0], [sx * u, sz * u], [0, sz * u]].map(q => o.fit ? [q[0] / Math.max(1e-6, sx * u), q[1] / Math.max(1e-6, sz * u)] : q));
      if (!f.includes('b')) this.quad(P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), mulc(c, 0.7));
      const side = (a, b, cc, d, w) => this.quad(a, b, cc, d, mulc(c, sh), o.fit ? [[0, 1], [1, 1], [1, 0], [0, 0]] : [[0, sy * u], [w * u, sy * u], [w * u, 0], [0, 0]]);
      if (!f.includes('f')) side(P(-hx, -hy, -hz), P(-hx, hy, -hz).map((v, i) => v), P(hx, hy, -hz), P(hx, -hy, -hz), sx);
      if (!f.includes('k')) side(P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz), P(-hx, -hy, hz), sx);
      if (!f.includes('l')) side(P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz), P(-hx, -hy, -hz), sz);
      if (!f.includes('r')) side(P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), P(hx, -hy, hz), sz);
    }
    fixFront() { return this; }
    cyl(p0, p1, r0, r1, seg, c, o) {
      o = o || {};
      c = col(c);
      const ax = M.norm(M.sub(p1, p0));
      const up = Math.abs(ax[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      const u = M.norm(M.cross(ax, up)), w = M.cross(u, ax);
      const L = M.dist(p0, p1);
      const rz = o.rz || 1;
      const ring = (p, r, a) => [p[0] + (u[0] * Math.cos(a) + w[0] * Math.sin(a) * rz) * r, p[1] + (u[1] * Math.cos(a) + w[1] * Math.sin(a) * rz) * r, p[2] + (u[2] * Math.cos(a) + w[2] * Math.sin(a) * rz) * r];
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
        const q0 = ring(p0, r0, a0), q1 = ring(p0, r0, a1), q2 = ring(p1, r1, a1), q3 = ring(p1, r1, a0);
        const n0 = M.norm(M.sub(ring(p0, 1, a0), p0)), n1 = M.norm(M.sub(ring(p0, 1, a1), p0));
        const uu0 = i / seg * (o.uvWrap || 1), uu1 = (i + 1) / seg * (o.uvWrap || 1);
        const vv = o.fit ? 1 : L / (o.uv || this.uvs);
        this.v(q0, n0, [uu0, vv], c); this.v(q1, n1, [uu1, vv], c); this.v(q2, n1, [uu1, 0], c);
        this.v(q0, n0, [uu0, vv], c); this.v(q2, n1, [uu1, 0], c); this.v(q3, n0, [uu0, 0], c);
        if (o.caps !== false) {
          if (r1 > 0.001) this.tri(p1, q3, q2, mulc(c, 0.9), [0.5, 0.5], [0, 0], [1, 0]);
          if (r0 > 0.001) this.tri(p0, q1, q0, mulc(c, 0.8), [0.5, 0.5], [0, 0], [1, 0]);
        }
      }
    }
    ellipsoid(cx, cy, cz, rx, ry, rz, seg, rings, c, o) {
      o = o || {};
      c = col(c);
      const pt = (i, j) => {
        const th = j / rings * Math.PI, ph = i / seg * Math.PI * 2;
        const n = [Math.sin(th) * Math.sin(ph), Math.cos(th), Math.sin(th) * Math.cos(ph)];
        return { p: [cx + n[0] * rx, cy + n[1] * ry, cz + n[2] * rz], n };
      };
      for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) {
        const a = pt(i, j), b = pt(i + 1, j), cc = pt(i + 1, j + 1), d = pt(i, j + 1);
        if (o.keep && !o.keep(a, b, cc, d)) continue;
        const uv = o.uv || (q => [(q.n[0] + 1) / 2, (1 - q.n[1]) / 2]);
        const col_ = o.color ? o.color(a) : c;
        const emit = (q) => this.v(q.p, q.n, uv(q), col_);
        emit(a); emit(d); emit(cc);
        emit(a); emit(cc); emit(b);
      }
    }
    append(other, xf) {
      for (let i = 0; i < other.a.length; i += 14) {
        let p = [other.a[i], other.a[i + 1], other.a[i + 2]], n = [other.a[i + 3], other.a[i + 4], other.a[i + 5]];
        if (xf) { p = M.GL.mat4.xform(xf, p); n = M.GL.mat4.xformDir(xf, n); }
        this.a.push(p[0], p[1], p[2], n[0], n[1], n[2], other.a[i + 6], other.a[i + 7], other.a[i + 8], other.a[i + 9], other.a[i + 10], other.a[i + 11], other.a[i + 12], other.a[i + 13]);
      }
    }
    data() { return new Float32Array(this.a); }
  }
  M.MB = MB;

  const LOOKS = {
    max: { skin: '#d6a88a', hair: '#231811', hairStyle: 'slick', top: 'leather', topCol: '#2b2019', shirt: '#383c42', pants: '#23262e', shoes: '#121010', brow: '#20150e', stubble: 0.55, squint: true, eyes: '#34485a', spec: 0.55 },
    alex: { skin: '#d8ae90', hair: '#4a3222', hairStyle: 'short', top: 'coat', topCol: '#6a5a44', shirt: '#c8c4b8', pants: '#3a3a3e', shoes: '#1a1614', tie: '#6a1a1a', brow: '#3a2418', eyes: '#3a4a2a', spec: 0.15 },
    bb: { skin: '#dcb498', hair: '#6a5038', hairStyle: 'short', top: 'suit', topCol: '#4a4e56', shirt: '#dcdcd4', pants: '#4a4e56', shoes: '#1a1614', tie: '#2a3a6a', brow: '#4a3422', eyes: '#3a2a1a', glasses: true, width: 1.08, belly: 0.3 },
    michelle: { skin: '#e8c0a4', hair: '#b88a4a', hairStyle: 'long', top: 'dress', topCol: '#9ab0c8', pants: '#9ab0c8', shoes: '#c8b8a8', female: true, brow: '#8a5a2a', eyes: '#3a6a8a', lips: '#b8686a' },
    thug: { skin: '#d0a080', hair: '#1a1410', hairStyle: 'short', top: 'leather', topCol: '#4a3020', shirt: '#6a6a60', pants: '#2a3040', shoes: '#1a1410', brow: '#1a1008', stubble: 0.4, spec: 0.35, vary: true },
    mobster: { skin: '#d4a482', hair: '#141010', hairStyle: 'slick', top: 'suit', topCol: '#1e2228', shirt: '#b8b4ac', pants: '#1e2228', shoes: '#0e0c0a', tie: '#5a1418', brow: '#140c08', vary: true, hat: 0.3 },
    robber: { skin: '#d0a080', hair: '#101010', hairStyle: 'mask', top: 'leather', topCol: '#1c1c1e', shirt: '#2a2a2a', pants: '#1a1c22', shoes: '#101010', mask: true, spec: 0.3, vary: true },
    junkie: { skin: '#c8a894', hair: '#3a2e20', hairStyle: 'messy', top: 'tank', topCol: '#8a8470', pants: '#3a3a44', shoes: '#2a2420', brow: '#2a2018', stubble: 0.7, eyes: '#2a1a1a', sick: true, vary: true },
    hooker: { skin: '#e0b494', hair: '#2a0a0a', hairStyle: 'long', top: 'dress', topCol: '#8a1030', pants: '#8a1030', shoes: '#1a0a0a', female: true, lips: '#a0102a', brow: '#1a0a0a', eyes: '#1a1a1a', spec: 0.4 },
    goth: { skin: '#e2d0c8', hair: '#0a0a0c', hairStyle: 'long', top: 'coat', topCol: '#101012', shirt: '#1a1a1c', pants: '#121214', shoes: '#0a0a0a', brow: '#0a0a0a', eyes: '#0a0a0a', lips: '#2a0a14', spec: 0.5, vary: true },
    doorman: { skin: '#8a5a40', hair: '#0a0a0a', hairStyle: 'bald', top: 'suit', topCol: '#0e0e10', shirt: '#0e0e10', pants: '#0e0e10', shoes: '#050505', glasses: 'shades', width: 1.22, height: 1.06 },
    finitoJoey: { skin: '#d0a07c', hair: '#1a120c', hairStyle: 'slick', top: 'suit', topCol: '#5a4230', shirt: '#e0d8c0', pants: '#5a4230', shoes: '#2a1a10', tie: '#c8a030', mustache: true, brow: '#1a120c', width: 1.05 },
    finitoVirgilio: { skin: '#caa07c', hair: '#1a120c', hairStyle: 'bald', top: 'suit', topCol: '#3a3e44', shirt: '#2a2a30', pants: '#3a3e44', shoes: '#101010', glasses: true, brow: '#1a120c', width: 1.12, belly: 0.4 },
    rico: { skin: '#b07a58', hair: '#0a0a0a', hairStyle: 'slick', top: 'coat', topCol: '#5a1a6a', shirt: '#e8d8a0', pants: '#5a1a6a', shoes: '#e8e0d0', hat: 1, hatCol: '#5a1a6a', glasses: 'shades', chain: true, mustache: true, spec: 0.5 },
    vinnie: { skin: '#dcac8c', hair: '#0e0a08', hairStyle: 'slick', top: 'suit', topCol: '#6a5a3a', shirt: '#e8e0c8', pants: '#6a5a3a', shoes: '#2a1a10', tie: '#8a1a1a', brow: '#0e0a08', width: 1.3, belly: 1, stubble: 0.3 },
    lupino: { skin: '#dcc4b4', hair: '#0a0a0a', hairStyle: 'bald', top: 'coat', topCol: '#0c0c0e', shirt: '#4a0a10', pants: '#101012', shoes: '#050505', goatee: true, eyes: '#6a0a0a', brow: '#1a1010', tattoo: true, height: 1.07, width: 1.12, spec: 0.6 },
    cop: { skin: '#d4a482', hair: '#2a1a10', hairStyle: 'short', top: 'uniform', topCol: '#1a2a4a', shirt: '#1a2a4a', pants: '#141c30', shoes: '#0a0a0a', hat: 2, hatCol: '#141c30', brow: '#2a1a10' },
    worker: { skin: '#b88a68', hair: '#2a2020', hairStyle: 'short', top: 'vest', topCol: '#e06a1a', shirt: '#2a3a5a', pants: '#2a3a5a', shoes: '#1a1410', hat: 3, hatCol: '#2a3a5a', brow: '#2a2020', stubble: 0.5 },
    tenant: { skin: '#dcb498', hair: '#8a8a88', hairStyle: 'short', top: 'shirt', topCol: '#6a5a4a', shirt: '#6a5a4a', pants: '#4a4a44', shoes: '#2a2420', brow: '#6a6a68', stubble: 0.6, bloody: true },
    vlad: { skin: '#d8b098', hair: '#3a2a1a', hairStyle: 'short', top: 'coat', topCol: '#141414', shirt: '#d8d8d0', pants: '#141414', shoes: '#0a0a0a', brow: '#2a1a10' },
    dummy: { dummy: true }
  };
  M.LOOKS = LOOKS;

  function varyLook(base, seed) {
    if (!base.vary) return base;
    const r = new M.RNG(seed * 97 + 13);
    const L = Object.assign({}, base);
    const skins = ['#d6a888', '#c89878', '#b88a68', '#8a5a40', '#e0b89c', '#a87050'];
    L.skin = r.pick(skins);
    if (base.top === 'leather') L.topCol = r.pick(['#4a3020', '#2a2420', '#3a2a1e', '#1e1e20', '#5a3a28']);
    if (base.top === 'suit') { L.topCol = r.pick(['#1e2228', '#2a2a2e', '#3a3228', '#262a36']); L.pants = L.topCol; L.tie = r.pick(['#5a1418', '#1a2a5a', '#6a5a1a', '#2a2a2a']); }
    if (base.top === 'tank') L.topCol = r.pick(['#8a8470', '#6a6a8a', '#8a5a4a', '#c8c0a8']);
    if (base.top === 'coat' && base.hairStyle === 'long') L.hairStyle = r.pick(['long', 'bald', 'short', 'long']);
    L.hairStyle = base.hairStyle === 'mask' ? 'mask' : r.chance(0.15) && base.hairStyle !== 'long' ? 'bald' : L.hairStyle;
    if (base.hairStyle === 'short' && r.chance(0.3)) L.hairStyle = 'beanie';
    L.hair = r.pick(['#141010', '#2a1a10', '#4a3020', '#1a1a1a', '#6a4a2a']);
    L.hat = base.hat && r.chance(base.hat) ? 1 : 0;
    L.hatCol = '#141414';
    L.width = (base.width || 1) * r.range(0.95, 1.12);
    L.belly = r.chance(0.25) ? r.range(0.3, 0.8) : (base.belly || 0);
    L.height = r.range(0.96, 1.05);
    L.stubble = r.range(0, 0.8);
    L.glasses = r.chance(0.12) ? 'shades' : false;
    return L;
  }
  M.varyLook = varyLook;

  function faceCanvas(L) {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const c = cv.getContext('2d');
    c.fillStyle = L.skin; c.fillRect(0, 0, S, S);
    const g = c.createLinearGradient(0, 0, 96, 0);
    g.addColorStop(0, 'rgba(60,30,20,0.35)'); g.addColorStop(0.25, 'rgba(0,0,0,0)'); g.addColorStop(0.75, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(60,30,20,0.35)');
    c.fillStyle = g; c.fillRect(0, 0, 96, S);
    if (L.sick) { c.fillStyle = 'rgba(120,140,110,0.25)'; c.fillRect(0, 0, 96, S); }
    if (L.mask) {
      c.fillStyle = '#141416'; c.fillRect(0, 0, S, S);
      c.fillStyle = L.skin; c.fillRect(24, 50, 48, 13); c.fillRect(38, 80, 20, 8);
      c.fillStyle = '#101010'; c.fillRect(30, 53, 10, 6); c.fillRect(56, 53, 10, 6);
      return cv;
    }
    if (L.stubble) {
      const r = new M.RNG(5);
      c.fillStyle = 'rgba(30,20,15,' + (0.35 * L.stubble) + ')';
      for (let i = 0; i < 700 * L.stubble; i++) { const x = 18 + r.next() * 60, y = 72 + r.next() * 44; if (Math.abs(x - 48) + (y - 72) * 0.6 > 8) c.fillRect(x, y, 1.2, 1.2); }
      c.fillStyle = 'rgba(30,20,15,' + (0.25 * L.stubble) + ')'; c.fillRect(20, 76, 56, 38);
      c.fillStyle = L.skin; c.globalAlpha = 0.6; c.fillRect(36, 70, 24, 6); c.globalAlpha = 1;
    }
    const ey = 54;
    const eh = L.squint ? 3 : 5;
    c.fillStyle = 'rgba(40,20,15,0.35)';
    c.fillRect(24, ey - 5, 18, 10); c.fillRect(54, ey - 5, 18, 10);
    c.fillStyle = '#e8e0d8';
    c.fillRect(27, ey - eh / 2, 12, eh); c.fillRect(57, ey - eh / 2, 12, eh);
    c.fillStyle = L.eyes || '#3a2a1a';
    c.fillRect(31, ey - eh / 2, 5, eh); c.fillRect(60, ey - eh / 2, 5, eh);
    c.fillStyle = '#000'; c.fillRect(32.5, ey - 1, 2, 2); c.fillRect(61.5, ey - 1, 2, 2);
    c.fillStyle = L.brow || L.hair;
    c.save();
    c.translate(33, ey - 8); c.rotate(L.squint ? 0.16 : -0.05); c.fillRect(-9, -2, 18, 3.5); c.restore();
    c.save();
    c.translate(63, ey - 8); c.rotate(L.squint ? -0.16 : 0.05); c.fillRect(-9, -2, 18, 3.5); c.restore();
    if (L.squint) { c.fillStyle = 'rgba(40,20,10,0.4)'; c.fillRect(46, ey - 12, 1.5, 7); c.fillRect(49, ey - 12, 1.5, 6); }
    c.fillStyle = 'rgba(60,30,20,0.35)'; c.fillRect(44, ey + 2, 3, 16); c.fillRect(42, ey + 16, 12, 4);
    c.fillStyle = 'rgba(255,230,210,0.25)'; c.fillRect(47, ey + 2, 3, 14);
    c.fillStyle = L.lips || 'rgba(120,50,45,0.85)';
    c.fillRect(38, 88, 20, 3.5);
    c.fillStyle = 'rgba(40,10,10,0.6)'; c.fillRect(38, 88, 20, 1.2);
    if (L.mustache) { c.fillStyle = L.hair; c.fillRect(36, 82, 24, 5); }
    if (L.goatee) { c.fillStyle = L.hair; c.fillRect(42, 94, 12, 14); c.fillRect(38, 84, 20, 3); }
    if (L.female) { c.fillStyle = 'rgba(200,90,90,0.18)'; c.beginPath(); c.arc(28, 72, 9, 0, 6.3); c.arc(68, 72, 9, 0, 6.3); c.fill(); c.fillStyle = '#1a1010'; c.fillRect(26, ey - eh / 2 - 1.5, 14, 1.5); c.fillRect(56, ey - eh / 2 - 1.5, 14, 1.5); }
    if (L.tattoo) { c.fillStyle = 'rgba(30,30,60,0.6)'; c.beginPath(); c.moveTo(80, 20); c.lineTo(92, 50); c.lineTo(84, 70); c.lineTo(88, 40); c.fill(); }
    if (L.bloody) { c.fillStyle = 'rgba(120,10,10,0.8)'; c.fillRect(56, 40, 16, 40); c.fillRect(30, 90, 10, 20); }
    const hs = L.hairStyle;
    if (hs !== 'bald') {
      c.fillStyle = L.hair;
      const line = hs === 'long' ? 26 : hs === 'messy' ? 22 : 20;
      c.fillRect(0, 0, 96, line);
      c.beginPath(); c.moveTo(0, line); c.quadraticCurveTo(48, line - 6, 96, line); c.lineTo(96, 0); c.lineTo(0, 0); c.fill();
      c.fillRect(0, 0, 10, 60); c.fillRect(86, 0, 10, 60);
      c.fillRect(96, 0, 32, hs === 'long' ? S : 90);
    } else {
      c.fillStyle = 'rgba(255,240,230,0.12)'; c.fillRect(20, 4, 56, 14);
      c.fillStyle = L.skin; c.fillRect(96, 0, 32, S);
    }
    if (hs === 'beanie') { c.fillStyle = '#2a2a2a'; c.fillRect(0, 0, 128, 28); }
    c.fillStyle = L.skin; c.fillRect(96, 100, 32, 28);
    return cv;
  }
  M.faceCanvas = faceCanvas;

  function detailCanvas() {
    const S = 128;
    const cv = document.createElement('canvas');
    cv.width = S; cv.height = S;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.fillStyle = '#c8c8c8'; c.fillRect(0, 0, S, S);
    M.texUtil.shade(c, S, 91, 0.35, 8, 4);
    M.texUtil.speckle(c, S, 92, 900, '#000', 1, 0.2);
    return cv;
  }
  M.detailCanvas = detailCanvas;

  function buildChar(look, seed) {
    const L = varyLook(look, seed || 1);
    const mb = new MB();
    const B = M.Anim.B;
    const W = L.width || 1;
    const belly = L.belly || 0;
    const fem = !!L.female;
    const skin = col(L.skin), top = col(L.topCol || '#444'), shirt = col(L.shirt || L.topCol || '#666'), pants = col(L.pants || '#333'), shoes = col(L.shoes || '#111'), hair = col(L.hair || '#111');
    const sleeve = L.top === 'tank' || L.top === 'dress' && fem ? skin : L.top === 'vest' ? shirt : top;
    const jacketSpec = L.top === 'leather' ? (L.spec || 0.5) : L.top === 'coat' ? (L.spec || 0.2) : (L.spec || 0.08);
    const bone = (b) => { mb.bone = B[b]; };
    mb.tex = 0;
    bone('pelvis');
    mb.spec = 0.05;
    mb.box(0, -0.03, 0, 0.34 * W * (fem ? 1.08 : 1), 0.22, 0.21 + belly * 0.06, fem && L.top === 'dress' ? top : pants);
    if (L.top === 'leather' || L.top === 'suit' || L.top === 'uniform') { mb.spec = jacketSpec; mb.box(0, 0.07, 0, 0.35 * W + belly * 0.06, 0.1, 0.22 + belly * 0.12, top); }
    if (L.top === 'coat') {
      mb.spec = jacketSpec;
      mb.box(0, -0.3, 0.07, 0.4 * W, 0.62, 0.1, top, { top: [0.9, 1] });
      mb.box(0, 0.06, 0, 0.36 * W + belly * 0.06, 0.12, 0.23 + belly * 0.12, top);
    }
    if (fem && L.top === 'dress') { mb.spec = 0.25; mb.box(0, -0.3, 0, 0.44 * W, 0.5, 0.3, top, { top: [0.75, 0.75] }); }
    mb.spec = 0.05;
    bone('spine');
    mb.spec = L.top === 'shirt' || L.top === 'tank' || L.top === 'dress' ? 0.05 : jacketSpec;
    mb.box(0, 0.1, belly * 0.03 * -1, 0.31 * W + belly * 0.14, 0.24, 0.2 + belly * 0.18, L.top === 'tank' ? top : L.top === 'dress' ? top : L.top === 'vest' ? top : top, { top: [1.02, 1] });
    if (L.top === 'leather' || L.top === 'coat' || L.top === 'suit') { mb.spec = 0.05; mb.box(0, 0.1, -0.1 - belly * 0.09, 0.09, 0.24, 0.02, shirt); }
    bone('chest');
    mb.spec = L.top === 'shirt' || L.top === 'tank' ? 0.05 : jacketSpec;
    const cw = fem ? 0.36 : 0.43;
    mb.box(0, 0.12, 0, cw * W, 0.3, 0.22 + belly * 0.08, top, { top: [1.0, 0.95] });
    if (fem) { mb.spec = 0.2; mb.ellipsoid(-0.07, 0.1, -0.1, 0.065, 0.06, 0.05, 8, 6, top); mb.ellipsoid(0.07, 0.1, -0.1, 0.065, 0.06, 0.05, 8, 6, top); }
    if (L.top === 'leather' || L.top === 'coat' || L.top === 'suit' || L.top === 'uniform') {
      mb.spec = 0.05;
      mb.box(0, 0.13, -0.112 - belly * 0.04, 0.11, 0.3, 0.02, shirt, { top: [1.3, 1] });
      mb.spec = jacketSpec;
      mb.box(-0.08, 0.27, -0.06, 0.1, 0.07, 0.14, top, { rotZ: 0.4 });
      mb.box(0.08, 0.27, -0.06, 0.1, 0.07, 0.14, top, { rotZ: -0.4 });
      mb.box(0, 0.28, 0.08, 0.3, 0.08, 0.06, top);
    }
    if (L.tie) { mb.spec = 0.2; mb.box(0, 0.09, -0.125 - belly * 0.04, 0.045, 0.3, 0.015, col(L.tie), { top: [0.6, 1] }); }
    if (L.top === 'vest') { mb.spec = 0.1; mb.box(0, 0.12, 0, cw * W + 0.02, 0.3, 0.24, col(L.topCol)); mb.box(0, 0.1, -0.125, cw * W * 0.9, 0.04, 0.01, '#e8e8a0'); mb.box(0, 0.16, 0.125, cw * W * 0.9, 0.04, 0.01, '#e8e8a0'); }
    if (L.top === 'uniform') { mb.box(-0.1, 0.18, -0.115, 0.05, 0.06, 0.01, '#c8a030'); }
    if (L.chain) { mb.spec = 0.9; mb.box(0, 0.2, -0.118, 0.12, 0.015, 0.012, '#e0b030'); }
    if (L.top === 'tank') { mb.spec = 0.05; mb.box(0, 0.26, 0, cw * W * 0.9, 0.05, 0.2, skin); }
    bone('neck');
    mb.spec = 0.05;
    mb.cyl([0, -0.02, 0], [0, 0.09, 0], 0.056, 0.052, 8, skin);
    if (L.top === 'coat' || L.top === 'leather') { mb.spec = jacketSpec; mb.cyl([0, -0.04, 0.01], [0, 0.05, 0.02], 0.085, 0.078, 8, top, { caps: false }); }
    bone('head');
    mb.tex = 1;
    mb.spec = 0.08;
    const hx = 0.093, hy = 0.12, hz = 0.105;
    mb.ellipsoid(0, 0.1, 0, hx, hy, hz, 12, 10, skin.map(() => 1), {
      uv: q => {
        const front = q.n[2] < 0.12;
        const v = M.clamp(0.5 - q.n[1] * 0.5, 0, 1);
        if (front) return [0.375 + q.n[0] * 0.36, v];
        return [0.875 + q.n[0] * 0.1, v];
      }
    });
    mb.tex = 0;
    mb.box(0, 0.085, -0.105, 0.03, 0.05, 0.03, skin, { top: [0.6, 0.4] });
    mb.box(-0.094, 0.1, 0, 0.02, 0.05, 0.035, skin);
    mb.box(0.094, 0.1, 0, 0.02, 0.05, 0.035, skin);
    mb.box(0, 0.02, -0.04, 0.12, 0.05, 0.1, skin, { skip: 't' });
    const hs = L.hairStyle;
    if (hs !== 'bald' && hs !== 'mask') {
      mb.spec = hs === 'slick' ? 0.5 : 0.1;
      const hr = 1.07;
      mb.ellipsoid(0, 0.105 + (hs === 'messy' ? 0.01 : 0), 0.004, hx * hr, hy * hr * (hs === 'messy' ? 1.05 : 1), hz * hr, 12, 10, hair, {
        keep: (a, b, c2, d) => {
          const cy = (a.n[1] + c2.n[1]) / 2, cz = (a.n[2] + c2.n[2]) / 2;
          if (cz < -0.2) return cy > 0.62;
          if (cz < 0.35) return cy > 0.18;
          return cy > (hs === 'long' ? -1 : -0.45);
        }
      });
      if (hs === 'long') { mb.box(0, -0.05, 0.07, 0.2, 0.34, 0.08, hair, { top: [1, 1.1] }); mb.box(-0.09, -0.02, 0, 0.04, 0.26, 0.1, hair); mb.box(0.09, -0.02, 0, 0.04, 0.26, 0.1, hair); }
      if (hs === 'beanie') { mb.spec = 0.02; mb.ellipsoid(0, 0.13, 0.005, hx * 1.13, hy * 0.95, hz * 1.12, 10, 8, '#262626', { keep: (a, b, c2) => (a.n[1] + c2.n[1]) / 2 > 0.1 }); }
    }
    if (L.hat) {
      const hc = col(L.hatCol || '#141414');
      mb.spec = 0.1;
      if (L.hat === 2) { mb.cyl([0, 0.17, 0], [0, 0.26, 0], 0.11, 0.12, 10, hc); mb.box(0, 0.175, -0.1, 0.16, 0.015, 0.1, hc); mb.box(0, 0.24, -0.11, 0.05, 0.04, 0.01, '#c8a030'); }
      else if (L.hat === 3) { mb.cyl([0, 0.16, 0.005], [0, 0.24, 0.005], 0.105, 0.1, 10, hc); mb.box(0, 0.165, -0.11, 0.15, 0.015, 0.1, hc); }
      else { mb.cyl([0, 0.17, 0], [0, 0.18, 0], 0.18, 0.18, 12, hc); mb.cyl([0, 0.18, 0], [0, 0.3, 0], 0.11, 0.1, 12, hc); mb.cyl([0, 0.2, 0], [0, 0.225, 0], 0.112, 0.112, 12, '#1a0a0a', { caps: false }); }
    }
    if (L.glasses) {
      mb.spec = 0.9;
      const gc = L.glasses === 'shades' ? '#050505' : '#303030';
      mb.box(-0.04, 0.1, -0.103, 0.06, 0.028, 0.012, gc);
      mb.box(0.04, 0.1, -0.103, 0.06, 0.028, 0.012, gc);
      mb.box(0, 0.105, -0.105, 0.03, 0.008, 0.01, gc);
    }
    mb.spec = 0.05;
    const arm = (side) => {
      const s = side === 'L' ? -1 : 1;
      bone('uarm' + side);
      mb.spec = sleeve === skin ? 0.05 : jacketSpec;
      mb.ellipsoid(0, -0.02, 0, 0.075 * Math.min(1.2, W), 0.07, 0.075, 8, 6, sleeve);
      mb.cyl([0, 0, 0], [0, -0.29, 0], 0.068 * Math.min(1.15, W), 0.055, 8, sleeve);
      bone('farm' + side);
      mb.cyl([0, 0.01, 0], [0, -0.25, 0], 0.055, 0.044, 8, L.top === 'tank' || fem && L.top === 'dress' ? skin : sleeve);
      if (L.top === 'leather' || L.top === 'coat' || L.top === 'suit') { mb.spec = 0.05; mb.cyl([0, -0.22, 0], [0, -0.25, 0], 0.046, 0.046, 8, shirt, { caps: false }); }
      bone('hand' + side);
      mb.spec = 0.05;
      mb.box(0, -0.055, -0.005, 0.07, 0.1, 0.038, skin, { top: [1, 1] });
      mb.box(s * -0.04, -0.035, -0.02, 0.025, 0.06, 0.025, skin, { rotZ: s * 0.5 });
    };
    arm('L'); arm('R');
    const leg = (side) => {
      bone('thigh' + side);
      mb.spec = 0.05;
      const lp = fem && L.top === 'dress' ? skin : pants;
      mb.cyl([0, 0.02, 0], [0, -0.44, 0], 0.095 * (fem ? 1.05 : 1) + belly * 0.02, 0.065, 8, lp);
      if (L.top === 'coat') { mb.spec = jacketSpec; mb.box(side === 'L' ? -0.02 : 0.02, -0.26, -0.085, 0.17, 0.56, 0.04, top, { top: [1, 1] }); }
      bone('shin' + side);
      mb.spec = 0.05;
      mb.cyl([0, 0.01, 0], [0, -0.42, 0], 0.066, 0.05, 8, lp);
      bone('foot' + side);
      mb.spec = 0.35;
      mb.box(0, -0.035, -0.05, 0.1, 0.075, 0.27, shoes, { top: [0.9, 0.9] });
    };
    leg('L'); leg('R');
    return { data: mb.data(), look: L, scale: L.height || 1 };
  }
  M.buildChar = buildChar;

  function buildDummy() {
    const mb = new MB();
    mb.bone = 0;
    mb.spec = 0;
    const board = '#c8a878';
    mb.box(0, 0.35, 0.02, 0.1, 0.7, 0.1, '#5a4a3a');
    mb.box(0, 0.95, 0, 0.55, 0.9, 0.03, board);
    mb.box(0, 1.55, 0, 0.3, 0.32, 0.03, board);
    mb.box(0, 1.1, -0.018, 0.2, 0.2, 0.005, '#1a1a1a');
    mb.box(0, 1.1, -0.021, 0.1, 0.1, 0.005, '#c81a1a');
    mb.box(0, 1.55, -0.018, 0.12, 0.12, 0.005, '#1a1a1a');
    return mb.data();
  }
  M.buildDummy = buildDummy;

  function buildWeapon(id) {
    const mb = new MB();
    mb.spec = 0.6;
    const black = '#1c1c1e', grey = '#6a6c6e', wood = '#6a4424';
    switch (id) {
      case 'beretta':
      case 'beretta2':
        mb.box(0, 0.05, -0.07, 0.034, 0.036, 0.2, black);
        mb.box(0, 0.025, -0.06, 0.03, 0.02, 0.17, '#2a2a2c');
        mb.box(0, -0.03, 0.005, 0.03, 0.11, 0.045, '#2a2420', { rotX: -0.25 });
        mb.box(0, 0.005, -0.04, 0.012, 0.03, 0.05, black);
        break;
      case 'deagle':
        mb.spec = 0.9;
        mb.box(0, 0.055, -0.09, 0.04, 0.045, 0.27, '#8a8c8e');
        mb.box(0, 0.025, -0.08, 0.036, 0.025, 0.22, '#7a7c7e');
        mb.box(0, -0.035, 0.01, 0.036, 0.12, 0.05, '#1a1a1a', { rotX: -0.2 });
        break;
      case 'ingram':
      case 'ingram2':
        mb.box(0, 0.04, -0.05, 0.045, 0.055, 0.2, black);
        mb.box(0, -0.05, -0.02, 0.035, 0.16, 0.04, black);
        mb.cyl([0, 0.045, -0.15], [0, 0.045, -0.2], 0.012, 0.012, 6, '#101010');
        mb.box(0, 0.075, 0.03, 0.02, 0.012, 0.1, grey);
        break;
      case 'pump':
        mb.cyl([0, 0.05, -0.05], [0, 0.05, -0.62], 0.016, 0.016, 8, black);
        mb.cyl([0, 0.02, -0.08], [0, 0.02, -0.52], 0.014, 0.014, 8, '#2a2a2a');
        mb.spec = 0.2;
        mb.box(0, 0.02, -0.34, 0.045, 0.045, 0.16, wood);
        mb.spec = 0.6;
        mb.box(0, 0.04, 0.02, 0.05, 0.07, 0.18, black);
        mb.spec = 0.2;
        mb.box(0, -0.02, 0.25, 0.045, 0.1, 0.3, wood, { rotX: 0.15 });
        mb.box(0, -0.04, 0.06, 0.035, 0.09, 0.04, wood, { rotX: -0.3 });
        break;
      case 'sawed':
        mb.cyl([-0.013, 0.05, -0.05], [-0.013, 0.05, -0.36], 0.015, 0.015, 8, grey);
        mb.cyl([0.013, 0.05, -0.05], [0.013, 0.05, -0.36], 0.015, 0.015, 8, grey);
        mb.spec = 0.2;
        mb.box(0, 0.03, -0.15, 0.05, 0.03, 0.16, wood);
        mb.box(0, -0.03, 0.03, 0.04, 0.12, 0.08, wood, { rotX: -0.4 });
        break;
      case 'pipe':
        mb.spec = 0.4;
        mb.cyl([0, 0, 0.1], [0, 0, -0.65], 0.022, 0.022, 8, '#5a4a3a');
        mb.cyl([0, 0, -0.6], [0, 0, -0.68], 0.03, 0.03, 8, '#4a4a4a');
        break;
      case 'bat':
        mb.spec = 0.35;
        mb.cyl([0, 0, 0.12], [0, 0, -0.72], 0.018, 0.036, 10, '#a8804a');
        mb.cyl([0, 0, 0.12], [0, 0, 0.14], 0.026, 0.026, 8, '#8a6a3a');
        break;
      case 'grenade':
        mb.spec = 0.3;
        mb.ellipsoid(0, 0, 0, 0.035, 0.045, 0.035, 8, 6, '#3a4a2a');
        mb.box(0, 0.05, 0, 0.02, 0.025, 0.02, grey);
        mb.box(0.02, 0.045, 0, 0.005, 0.05, 0.015, grey);
        break;
      case 'molotov':
        mb.spec = 0.9;
        mb.cyl([0, -0.08, 0], [0, 0.07, 0], 0.035, 0.035, 8, '#3a6a2a');
        mb.cyl([0, 0.07, 0], [0, 0.13, 0], 0.035, 0.013, 8, '#3a6a2a');
        mb.spec = 0;
        mb.box(0, 0.16, 0, 0.03, 0.06, 0.03, '#d8d0b0');
        break;
      case 'painkillers':
        mb.spec = 0.5;
        mb.cyl([0, 0, 0], [0, 0.1, 0], 0.03, 0.03, 10, '#d88a20');
        mb.cyl([0, 0.1, 0], [0, 0.125, 0], 0.032, 0.032, 10, '#f0f0e8');
        mb.box(0, 0.05, -0.03, 0.04, 0.05, 0.005, '#f0e8d0');
        break;
      case 'ammo':
        mb.spec = 0.1;
        mb.box(0, 0.05, 0, 0.18, 0.1, 0.1, '#6a5a2a');
        mb.box(0, 0.05, -0.051, 0.12, 0.05, 0.002, '#e8d8a0');
        break;
      case 'shells':
        mb.spec = 0.1;
        mb.box(0, 0.05, 0, 0.18, 0.1, 0.1, '#8a1a1a');
        mb.box(0, 0.05, -0.051, 0.12, 0.05, 0.002, '#e8e0d0');
        break;
      case 'key':
        mb.spec = 0.9;
        mb.box(0, 0.005, 0, 0.03, 0.006, 0.03, '#c8a830');
        mb.box(0, 0.005, -0.04, 0.008, 0.006, 0.05, '#c8a830');
        break;
      case 'detonator':
        mb.spec = 0.3;
        mb.box(0, 0.05, 0, 0.12, 0.1, 0.08, '#4a4a3a');
        mb.box(0, 0.11, 0, 0.03, 0.03, 0.03, '#c81a1a');
        mb.cyl([0.04, 0.1, 0], [0.04, 0.25, 0], 0.004, 0.004, 4, '#222');
        break;
      default:
        mb.box(0, 0.05, 0, 0.1, 0.1, 0.1, '#f0f');
    }
    return mb.data();
  }
  M.buildWeapon = buildWeapon;

  M.PROP_MATS = {
    door_wood: { s: 128, m: 1, fit: true, draw: (c, S) => { M.texUtil.planks(c, S, { color: '#6a4424', n: 3, seed: 40 }); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 3; c.strokeRect(14, 12, S - 28, S * 0.36); c.strokeRect(14, S * 0.55, S - 28, S * 0.38); M.texUtil.shade(c, S, 41, 0.3, 4, 3); } },
    door_metal: { s: 128, m: 1, fit: true, draw: (c, S) => { c.fillStyle = '#5a6a6a'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 42, 0.4, 4, 4); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 2; c.strokeRect(6, 6, S - 12, S - 12); c.fillStyle = 'rgba(20,20,20,0.6)'; c.fillRect(S * 0.3, S * 0.12, S * 0.4, S * 0.18); M.texUtil.stains(c, S, 43, 6, 'rgba(80,40,10,1)', 0.35); } },
    door_old: { s: 128, m: 1, fit: true, draw: (c, S) => { M.texUtil.planks(c, S, { color: '#4a3a2a', n: 4, seed: 44 }); M.texUtil.shade(c, S, 45, 0.5, 4, 4); M.texUtil.stains(c, S, 46, 8, 'rgba(0,0,0,1)', 0.4); } },
    door_red: { s: 128, m: 1, fit: true, draw: (c, S) => { c.fillStyle = '#6a1a1a'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 47, 0.4, 4, 4); c.strokeStyle = 'rgba(0,0,0,0.5)'; c.lineWidth = 3; c.strokeRect(14, 12, S - 28, S - 24); } },
    locker: { s: 128, m: 1, fit: true, draw: (c, S) => { c.fillStyle = '#4a5a6a'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 48, 0.35, 4, 4); c.fillStyle = 'rgba(0,0,0,0.6)'; for (let i = 0; i < 5; i++) c.fillRect(S * 0.3, S * (0.08 + i * 0.035), S * 0.4, 2); c.fillRect(S * 0.05, S * 0.5, 4, 10); } },
    train_side: { s: 256, m: 1, fit: true, draw: (c, S) => { c.fillStyle = '#8a8e90'; c.fillRect(0, 0, S, S); c.globalAlpha = 0.12; for (let y = 0; y < S; y += 4) { c.fillStyle = '#000'; c.fillRect(0, y, S, 1); } c.globalAlpha = 1; M.texUtil.shade(c, S, 49, 0.3, 4, 4); c.fillStyle = '#1a1a1a'; c.fillRect(0, S * 0.66, S, 3); M.texUtil.stains(c, S, 50, 6, 'rgba(30,20,10,1)', 0.35); } },
    fabric_brown: { s: 128, m: 0.8, draw: (c, S) => { c.fillStyle = '#5a3e2a'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 51, 0.3, 16, 3); } },
    fabric_green: { s: 128, m: 0.8, draw: (c, S) => { c.fillStyle = '#2e4a36'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 52, 0.3, 16, 3); } },
    fabric_blue: { s: 128, m: 0.8, draw: (c, S) => { c.fillStyle = '#2a3a6a'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 58, 0.3, 16, 3); } },
    fabric_red: { s: 128, m: 0.8, draw: (c, S) => { c.fillStyle = '#6a1a20'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 53, 0.3, 16, 3); } },
    sheet: { s: 128, m: 1, draw: (c, S) => { c.fillStyle = '#d8d4c8'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 54, 0.2, 4, 3); } },
    leather: { s: 128, m: 0.6, draw: (c, S) => { c.fillStyle = '#2a1e18'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 55, 0.4, 8, 4); } },
    white_metal: { s: 128, m: 1, draw: (c, S) => { c.fillStyle = '#d8d8d0'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 56, 0.15, 4, 3); } },
    cardboard: { s: 64, m: 0.9, draw: (c, S) => { c.fillStyle = '#b8a07a'; c.fillRect(0, 0, S, S); M.texUtil.shade(c, S, 59, 0.25, 6, 3); c.fillStyle = 'rgba(80,50,20,0.5)'; c.fillRect(0, S * 0.46, S, S * 0.08); } },
    money: { s: 128, m: 0.4, draw: (c, S) => { c.fillStyle = '#6a8a5a'; c.fillRect(0, 0, S, S); c.fillStyle = '#3a5a2a'; for (let i = 0; i < 4; i++) c.fillRect(0, i * S / 4, S, 3); M.texUtil.shade(c, S, 57, 0.2, 8, 3); } },
    screen: { s: 64, m: 1, fit: true, emissive: 0.4, draw: (c, S) => { c.fillStyle = '#1a2a2a'; c.fillRect(0, 0, S, S); } }
  };
  Object.assign(M.MATS, M.PROP_MATS);

  function part(list, mat, fn) {
    const mb = new MB();
    mb.uvs = 0.6;
    fn(mb);
    list.push({ mat, data: mb.data() });
    return list;
  }

  function buildDecor(id, o) {
    o = o || {};
    const L = [];
    const S = M.DECOR[id] || { w: 1, h: 1, d: 1 };
    switch (id) {
      case 'bench':
        part(L, 'wood_panel', m => { m.box(0, 0.45, 0, 1.8, 0.06, 0.45, '#8a6a4a'); m.box(0, 0.75, 0.22, 1.8, 0.35, 0.05, '#8a6a4a'); });
        part(L, 'metal', m => { for (const x of [-0.8, 0.8]) { m.box(x, 0.22, 0, 0.06, 0.44, 0.4, '#555'); } });
        break;
      case 'trash':
        part(L, 'metal', m => { m.cyl([0, 0, 0], [0, 0.85, 0], 0.26, 0.29, 10, '#4a4e4a'); });
        break;
      case 'sofa':
        part(L, o.mat || 'fabric_brown', m => { m.box(0, 0.25, 0, 2, 0.4, 0.9, '#fff'); m.box(0, 0.6, 0.35, 2, 0.5, 0.2, '#fff'); m.box(-0.9, 0.5, 0, 0.2, 0.3, 0.9, '#fff'); m.box(0.9, 0.5, 0, 0.2, 0.3, 0.9, '#fff'); m.box(-0.45, 0.5, -0.05, 0.85, 0.12, 0.7, '#ddd'); m.box(0.45, 0.5, -0.05, 0.85, 0.12, 0.7, '#ddd'); });
        break;
      case 'armchair':
        part(L, o.mat || 'fabric_green', m => { m.box(0, 0.25, 0, 0.9, 0.4, 0.9, '#fff'); m.box(0, 0.65, 0.35, 0.9, 0.5, 0.2, '#fff'); m.box(-0.4, 0.55, 0, 0.12, 0.25, 0.9, '#fff'); m.box(0.4, 0.55, 0, 0.12, 0.25, 0.9, '#fff'); });
        break;
      case 'bed':
        part(L, 'wood_panel', m => { m.box(0, 0.2, 0, 1.6, 0.3, 2.1, '#8a6a4a'); m.box(0, 0.6, 1.02, 1.6, 0.9, 0.08, '#6a4a2a'); });
        part(L, 'sheet', m => { m.box(0, 0.45, -0.1, 1.5, 0.2, 1.85, o.sheet || '#fff'); m.box(0, 0.6, 0.82, 1.2, 0.12, 0.35, '#fff'); });
        break;
      case 'crib':
        part(L, 'white_metal', m => {
          m.box(0, 0.35, 0, 0.7, 0.05, 1.3, '#f0ece0');
          for (const x of [-0.33, 0.33]) for (let z = -0.6; z <= 0.6; z += 0.12) m.box(x, 0.65, z, 0.03, 0.6, 0.03, '#f0ece0');
          for (const z of [-0.63, 0.63]) for (let x = -0.3; x <= 0.3; x += 0.12) m.box(x, 0.65, z, 0.03, 0.6, 0.03, '#f0ece0');
          for (const x of [-0.33, 0.33]) m.box(x, 0.97, 0, 0.05, 0.05, 1.3, '#f0ece0');
          for (const [x, z] of [[-0.33, -0.63], [0.33, -0.63], [-0.33, 0.63], [0.33, 0.63]]) m.box(x, 0.5, z, 0.05, 1.0, 0.05, '#f0ece0');
        });
        part(L, 'sheet', m => { m.box(0, 0.42, 0, 0.62, 0.1, 1.2, '#d8e0f0'); });
        break;
      case 'table':
        part(L, 'wood_panel', m => { m.box(0, 0.75, 0, 1.4, 0.06, 0.9, '#9a7a5a'); for (const [x, z] of [[-0.62, -0.38], [0.62, -0.38], [-0.62, 0.38], [0.62, 0.38]]) m.box(x, 0.36, z, 0.07, 0.72, 0.07, '#7a5a3a'); });
        break;
      case 'tableside':
        part(L, 'wood_panel', m => {
          m.box(0, 0.49, -0.17, 1.4, 0.98, 0.06, '#9a7a5a');
          for (const [x, y] of [[-0.62, 0.08], [0.62, 0.08], [-0.62, 0.9], [0.62, 0.9]]) m.box(x, y, 0.04, 0.07, 0.07, 0.36, '#7a5a3a');
        });
        if (o.cloth) part(L, 'sheet', m => { m.box(0, 0.62, -0.205, 1.3, 0.7, 0.01, o.cloth); });
        break;
      case 'desk':
        part(L, 'wood_panel', m => { m.box(0, 0.75, 0, 1.5, 0.06, 0.75, '#7a5a3a'); m.box(-0.55, 0.36, 0, 0.4, 0.72, 0.7, '#6a4a2a'); m.box(0.7, 0.36, 0, 0.05, 0.72, 0.7, '#6a4a2a'); });
        break;
      case 'chair':
        part(L, 'wood_panel', m => { m.box(0, 0.46, 0, 0.45, 0.05, 0.45, '#7a5a3a'); m.box(0, 0.75, 0.2, 0.45, 0.5, 0.04, '#7a5a3a'); for (const [x, z] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) m.box(x, 0.22, z, 0.04, 0.45, 0.04, '#5a3a1a'); });
        break;
      case 'tvstand':
        part(L, 'wood_panel', m => { m.box(0, 0.25, 0, 0.9, 0.5, 0.55, '#5a3a2a'); });
        part(L, 'trim', m => { m.box(0, 0.75, 0.02, 0.62, 0.5, 0.5, '#2a2a2a'); });
        part(L, 'screen', m => { m.box(0, 0.76, -0.235, 0.5, 0.38, 0.01, '#8aaa9a', { fit: true }); });
        break;
      case 'fridge':
        part(L, 'white_metal', m => { m.box(0, 0.9, 0, 0.8, 1.8, 0.7, '#e8e4d8'); m.box(0.3, 1.2, -0.36, 0.03, 0.4, 0.03, '#888'); m.box(0, 1.25, -0.352, 0.78, 0.01, 0.01, '#666'); });
        break;
      case 'stove':
        part(L, 'white_metal', m => { m.box(0, 0.45, 0, 0.8, 0.9, 0.7, '#e0dcd0'); m.box(0, 0.4, -0.352, 0.6, 0.4, 0.01, '#222'); });
        part(L, 'metal', m => { for (const [x, z] of [[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]]) m.cyl([x, 0.9, z], [x, 0.92, z], 0.1, 0.1, 8, '#222'); });
        break;
      case 'counter':
        part(L, 'wood_panel', m => { m.box(0, 0.45, 0, 2, 0.9, 0.62, '#8a6a4a'); });
        part(L, 'marble', m => { m.box(0, 0.92, -0.02, 2.04, 0.05, 0.68, '#ddd'); });
        break;
      case 'shelf':
        part(L, 'metal', m => { for (const x of [-0.78, 0.78]) m.box(x, 1, 0, 0.04, 2, 0.45, '#666'); for (let y = 0.1; y < 2; y += 0.48) m.box(0, y, 0, 1.6, 0.03, 0.45, '#777'); });
        part(L, 'cardboard', m => { const r = new M.RNG(o.seed || 3); for (let y = 0.12; y < 1.9; y += 0.48) for (let x = -0.6; x < 0.7; x += 0.4) if (r.chance(0.6)) m.box(x, y + 0.14, 0, 0.3, 0.26, 0.35, r.pick(['#9a7a4a', '#8a6a3a', '#aa8a5a'])); });
        break;
      case 'lockers':
        part(L, 'locker', m => { for (let i = 0; i < 4; i++) m.box(-0.675 + i * 0.45, 1, 0, 0.44, 2, 0.5, '#fff', { fit: true }); });
        break;
      case 'car':
      case 'mercedes':
      case 'cruiser': {
        const body = id === 'mercedes' ? '#0e0e10' : id === 'cruiser' ? '#e8e8e8' : (o.color || '#6a2a1a');
        part(L, 'metal', m => {
          m.spec = 0.8;
          m.box(0, 0.6, 0, 1.85, 0.55, 4.7, body);
          m.box(0, 1.1, 0.2, 1.6, 0.5, 2.4, body, { top: [0.92, 0.8] });
          if (id === 'cruiser') { m.box(0, 0.6, 0, 1.87, 0.2, 2.0, '#1a2a6a'); m.box(0, 1.4, 0.2, 1.0, 0.1, 0.25, '#222'); }
        });
        part(L, 'black', m => {
          m.spec = 0.9;
          m.box(0, 1.12, 0.2, 1.62, 0.36, 2.2, '#10141a', { top: [0.92, 0.8] });
          for (const [x, z] of [[-0.85, -1.5], [0.85, -1.5], [-0.85, 1.5], [0.85, 1.5]]) m.cyl([x - 0.12, 0.34, z], [x + 0.12, 0.34, z], 0.34, 0.34, 10, '#141414');
        });
        if (id === 'cruiser') {
          part(L, 'neon_red', m => { m.box(-0.3, 1.47, 0.2, 0.4, 0.1, 0.2, '#fff'); });
          part(L, 'neon_blue', m => { m.box(0.3, 1.47, 0.2, 0.4, 0.1, 0.2, '#fff'); });
        }
        part(L, 'lamp', m => { m.box(-0.65, 0.7, -2.36, 0.3, 0.12, 0.02, '#fff'); m.box(0.65, 0.7, -2.36, 0.3, 0.12, 0.02, '#fff'); });
        part(L, 'neon_red', m => { m.box(-0.7, 0.7, 2.36, 0.3, 0.1, 0.02, '#fff'); m.box(0.7, 0.7, 2.36, 0.3, 0.1, 0.02, '#fff'); });
        break;
      }
      case 'dumpster':
        part(L, 'metal', m => { m.spec = 0.3; m.box(0, 0.6, 0, 1.9, 1.2, 1.1, '#2a4a2a', { top: [1, 1] }); m.box(0, 1.25, 0.1, 1.9, 0.08, 1.0, '#223a22', { rotX: -0.1 }); });
        break;
      case 'lamp':
      case 'streetlight':
        part(L, 'metal', m => { m.cyl([0, 0, 0], [0, 4.6, 0], 0.08, 0.06, 8, '#2a2c2a'); m.box(0, 4.6, -0.5, 0.12, 0.1, 1.1, '#2a2c2a'); });
        part(L, 'lamp', m => { m.box(0, 4.52, -0.95, 0.35, 0.08, 0.3, '#fff'); });
        break;
      case 'hydrant':
        part(L, 'metal', m => { m.spec = 0.4; m.cyl([0, 0, 0], [0, 0.65, 0], 0.13, 0.12, 8, '#a02a1a'); m.ellipsoid(0, 0.65, 0, 0.12, 0.1, 0.12, 8, 5, '#a02a1a'); m.cyl([-0.2, 0.45, 0], [0.2, 0.45, 0], 0.05, 0.05, 6, '#a02a1a'); });
        break;
      case 'turnstile':
        part(L, 'metal', m => { m.spec = 0.7; m.box(0, 0.5, 0, 0.3, 1.0, 0.9, '#8a8c8a'); m.cyl([0.15, 0.85, 0], [0.55, 0.85, 0], 0.025, 0.025, 6, '#aaa'); m.cyl([0.15, 0.85, 0], [0.4, 0.95, 0.25], 0.025, 0.025, 6, '#aaa'); });
        break;
      case 'booth':
        part(L, 'metal', m => { m.box(0, 0.5, 0, 2.4, 1.0, 2.0, '#6a7a6a'); m.box(0, 2.45, 0, 2.5, 0.3, 2.1, '#5a6a5a'); for (const [x, z] of [[-1.15, -0.95], [1.15, -0.95], [-1.15, 0.95], [1.15, 0.95]]) m.box(x, 1.7, z, 0.1, 1.4, 0.1, '#5a6a5a'); });
        break;
      case 'pallet':
        part(L, 'crate', m => { m.box(0, 0.55, 0, 1.2, 1.1, 1.0, '#fff', { fit: true }); });
        break;
      case 'barrel':
        part(L, 'rust', m => { m.spec = 0.3; m.cyl([0, 0, 0], [0, 0.9, 0], 0.3, 0.3, 12, o.color || '#4a6a8a'); m.cyl([0, 0.3, 0], [0, 0.33, 0], 0.31, 0.31, 12, '#333', { caps: false }); m.cyl([0, 0.6, 0], [0, 0.63, 0], 0.31, 0.31, 12, '#333', { caps: false }); });
        break;
      case 'console':
        part(L, 'metal', m => { m.box(0, 0.5, 0, 2.2, 1.0, 0.8, '#5a605a'); m.box(0, 1.05, 0.1, 2.2, 0.2, 0.6, '#4a504a', { rotX: -0.35 }); });
        part(L, 'lamp', m => { const r = new M.RNG(o.seed || 7); for (let i = 0; i < 16; i++) m.box(-0.9 + (i % 8) * 0.25, 1.12, -0.05 + Math.floor(i / 8) * 0.18, 0.06, 0.03, 0.06, r.pick(['#ff4a2a', '#4aff6a', '#ffd84a', '#fff'])); });
        break;
      case 'safe':
        part(L, 'vault', m => { m.spec = 0.6; m.box(0, 0.7, 0, 1.0, 1.4, 0.8, '#6a6c6a'); m.cyl([0, 0.8, -0.4], [0, 0.8, -0.45], 0.12, 0.12, 12, '#aaa'); });
        break;
      case 'bar':
        part(L, 'wood_panel', m => { m.spec = 0.4; m.box(0, 0.55, 0, 3, 1.1, 0.7, '#5a3a24'); m.box(0, 1.12, -0.05, 3.1, 0.06, 0.82, '#3a2414'); });
        part(L, 'metal', m => { m.spec = 0.9; m.cyl([-1.5, 0.15, -0.4], [1.5, 0.15, -0.4], 0.025, 0.025, 6, '#c8a040'); });
        break;
      case 'speaker':
        part(L, 'black', m => { m.box(0, 0.9, 0, 1.0, 1.8, 0.8, '#1a1a1a'); });
        part(L, 'metal', m => { m.cyl([0, 1.25, -0.4], [0, 1.25, -0.42], 0.3, 0.3, 12, '#2a2a2a'); m.cyl([0, 0.5, -0.4], [0, 0.5, -0.42], 0.25, 0.25, 12, '#2a2a2a'); });
        break;
      case 'altar':
        part(L, 'stone_gothic', m => { m.box(0, 0.55, 0, 2.4, 1.1, 1.2, '#fff'); });
        part(L, 'curtain_red', m => { m.box(0, 1.11, 0, 2.2, 0.02, 1.0, '#fff'); m.box(0, 0.8, -0.61, 1.6, 0.6, 0.01, '#fff'); });
        break;
      case 'throne':
        part(L, 'wood_panel', m => { m.spec = 0.3; m.box(0, 0.25, 0, 1.2, 0.5, 1.0, '#2a1a10'); m.box(0, 1.2, 0.42, 1.2, 1.9, 0.16, '#2a1a10', { top: [0.7, 1] }); m.box(-0.55, 0.7, 0, 0.12, 0.4, 1.0, '#2a1a10'); m.box(0.55, 0.7, 0, 0.12, 0.4, 1.0, '#2a1a10'); });
        part(L, 'fabric_red', m => { m.box(0, 0.52, -0.05, 1.0, 0.06, 0.85, '#fff'); m.box(0, 1.1, 0.33, 0.9, 1.2, 0.02, '#fff'); });
        break;
      case 'candles':
        part(L, 'white_metal', m => { const r = new M.RNG(o.seed || 1); for (let i = 0; i < 5; i++) { const x = r.range(-0.2, 0.2), z = r.range(-0.2, 0.2), h = r.range(0.15, 0.5); m.cyl([x, 0, z], [x, h, z], 0.03, 0.03, 6, '#e8e0c8'); } });
        break;
      case 'pipes':
        part(L, 'rust', m => { m.cyl([0, 0.2, -2], [0, 0.2, 2], 0.18, 0.18, 10, '#8a7a6a'); });
        break;
      case 'boiler':
        part(L, 'rust', m => { m.spec = 0.3; m.cyl([0, 0, 0], [0, 2.0, 0], 0.75, 0.75, 14, '#6a5a4a'); m.cyl([0, 2.0, 0], [0, 2.8, 0], 0.15, 0.15, 8, '#5a4a3a'); });
        break;
      case 'washer':
        part(L, 'white_metal', m => { m.box(0, 0.45, 0, 0.7, 0.9, 0.7, '#e8e4dc'); m.cyl([0, 0.45, -0.35], [0, 0.45, -0.37], 0.2, 0.2, 12, '#3a4a5a'); });
        break;
      case 'toilet':
        part(L, 'white_metal', m => { m.box(0, 0.2, 0, 0.4, 0.4, 0.5, '#f0f0ea'); m.box(0, 0.42, -0.05, 0.42, 0.05, 0.55, '#f0f0ea'); m.box(0, 0.6, 0.28, 0.42, 0.45, 0.18, '#f0f0ea'); });
        break;
      case 'sink':
        part(L, 'white_metal', m => { m.box(0, 0.85, 0, 0.6, 0.12, 0.45, '#f0f0ea'); m.cyl([0, 0, 0.1], [0, 0.8, 0.1], 0.08, 0.1, 8, '#f0f0ea'); });
        break;
      case 'bathtub':
        part(L, 'white_metal', m => { m.box(0, 0.3, 0, 0.8, 0.6, 1.7, '#f0f0ea'); });
        part(L, 'water', m => { m.box(0, 0.55, 0, 0.66, 0.02, 1.55, '#8aa'); });
        break;
      case 'piano':
        part(L, 'black', m => { m.spec = 0.9; m.box(0, 0.65, 0, 1.5, 1.3, 0.6, '#0a0a0a'); m.box(0, 0.75, -0.4, 1.4, 0.06, 0.25, '#f0f0f0'); });
        break;
      case 'moneypile':
        part(L, 'money', m => { const r = new M.RNG(o.seed || 2); for (let i = 0; i < 14; i++) m.box(r.range(-0.4, 0.4), 0.04 + (i % 4) * 0.08, r.range(-0.25, 0.25), 0.16, 0.07, 0.08, '#fff', { rot: r.range(0, 3) }); });
        break;
      case 'suitcase':
        part(L, 'leather', m => { m.box(0, 0.12, 0, 0.8, 0.22, 0.5, '#6a4a2a'); });
        part(L, 'money', m => { m.box(0, 0.25, 0, 0.7, 0.06, 0.42, '#fff'); });
        break;
      case 'cage':
        part(L, 'bars', m => { m.box(0, 1.1, 0, 1.4, 2.2, 1.4, '#fff'); });
        break;
      case 'hoop':
        part(L, 'metal', m => { m.cyl([0, 0, 0.4], [0, 3.3, 0.4], 0.07, 0.07, 8, '#3a3a3a'); m.box(0, 3.3, 0.25, 1.2, 0.8, 0.05, '#e8e8e8'); m.cyl([0, 3.05, 0.05], [0, 3.07, 0.05], 0.23, 0.23, 12, '#c84a1a', { caps: false }); });
        break;
      case 'rubble':
        part(L, 'concrete', m => { const r = new M.RNG(o.seed || 5); for (let i = 0; i < 9; i++) m.box(r.range(-0.8, 0.8), r.range(0.1, 0.4), r.range(-0.8, 0.8), r.range(0.3, 0.8), r.range(0.2, 0.6), r.range(0.3, 0.8), '#aaa', { rot: r.range(0, 3), rotX: r.range(-0.4, 0.4) }); });
        break;
      case 'coatrack':
        part(L, 'wood_panel', m => { m.cyl([0, 0, 0], [0, 1.8, 0], 0.03, 0.03, 6, '#5a3a1a'); m.cyl([0, 0, 0], [0, 0.05, 0], 0.25, 0.25, 8, '#5a3a1a'); });
        break;
      case 'phonebooth':
        part(L, 'metal', m => { m.box(0, 1.15, 0.45, 1.0, 2.3, 0.1, '#6a6a6a'); m.box(0, 2.25, 0, 1.0, 0.1, 1.0, '#5a5a5a'); m.box(0, 1.35, 0.35, 0.3, 0.45, 0.1, '#222'); });
        break;
      case 'target':
        part(L, 'wood_panel', m => { m.box(0, 0.95, 0, 0.6, 1.9, 0.05, '#c8a878'); });
        break;
      case 'djbooth':
        part(L, 'black', m => { m.box(0, 0.6, 0, 2.6, 1.2, 1.2, '#1a1a1e'); });
        part(L, 'metal', m => { m.cyl([-0.6, 1.2, 0], [-0.6, 1.23, 0], 0.25, 0.25, 12, '#333'); m.cyl([0.6, 1.2, 0], [0.6, 1.23, 0], 0.25, 0.25, 12, '#333'); });
        part(L, 'neon_blue', m => { m.box(0, 0.6, -0.61, 2.4, 0.05, 0.01, '#fff'); });
        break;
      case 'mixer':
        part(L, 'metal', m => { m.box(0, 0.5, 0, 1.2, 1.0, 0.8, '#2a2a2e'); m.box(0, 1.05, 0, 1.1, 0.1, 0.7, '#3a3a3e', { rotX: -0.2 }); });
        break;
      case 'cross':
        part(L, 'wood_panel', m => { m.box(0, 1.5, 0, 0.25, 3, 0.25, '#3a2a1a'); m.box(0, 2.2, 0, 1.4, 0.25, 0.25, '#3a2a1a'); });
        break;
      case 'statue':
        part(L, 'stone_gothic', m => { m.box(0, 0.4, 0, 1.0, 0.8, 1.0, '#fff'); m.box(0, 1.6, 0, 0.5, 1.6, 0.4, '#fff', { top: [0.7, 0.8] }); m.ellipsoid(0, 2.5, 0, 0.18, 0.22, 0.18, 8, 6, '#fff'); m.box(-0.45, 2.0, 0.15, 0.6, 0.9, 0.08, '#ddd', { rotZ: 0.6 }); m.box(0.45, 2.0, 0.15, 0.6, 0.9, 0.08, '#ddd', { rotZ: -0.6 }); });
        break;
      case 'stretcher':
        part(L, 'metal', m => { m.box(0, 0.8, 0, 0.7, 0.08, 2.0, '#aaa'); for (const [x, z] of [[-0.3, -0.9], [0.3, -0.9], [-0.3, 0.9], [0.3, 0.9]]) m.box(x, 0.4, z, 0.04, 0.8, 0.04, '#888'); });
        part(L, 'sheet', m => { m.box(0, 0.9, 0, 0.66, 0.12, 1.9, '#fff'); });
        break;
      default:
        part(L, 'crate', m => { m.box(0, S.h / 2, 0, S.w, S.h, S.d, '#fff'); });
    }
    return L;
  }
  M.buildDecor = buildDecor;

  function buildProp(p) {
    const L = [];
    switch (p.kind) {
      case 'door': {
        const mat = p.mat || 'door_wood';
        const leaves = p.double ? 2 : 1;
        const lw = p.w / leaves;
        for (let i = 0; i < leaves; i++) part(L, mat, m => { m.spec = /metal/.test(mat) ? 0.4 : 0.15; m.box(lw / 2, p.h / 2, 0, lw - 0.02, p.h - 0.02, 0.07, '#fff', { fit: true }); m.box(lw - 0.12, 1.0, -0.06, 0.03, 0.03, 0.1, '#c8b060'); m.box(lw - 0.12, 1.0, 0.06, 0.03, 0.03, 0.1, '#c8b060'); });
        break;
      }
      case 'cyl':
        part(L, 'metal', m => { m.spec = 0.7; const c = p.color || '#b8321e'; m.cyl([0, 0.02, 0], [0, 1.05, 0], 0.16, 0.16, 12, c); m.ellipsoid(0, 1.05, 0, 0.16, 0.12, 0.16, 12, 6, c, { keep: (a) => a.n[1] >= 0 }); m.cyl([0, 1.15, 0], [0, 1.28, 0], 0.04, 0.04, 8, '#8a8a80'); m.box(0, 1.25, 0, 0.14, 0.03, 0.03, '#8a8a80'); m.cyl([0, 0.7, 0], [0, 0.78, 0], 0.162, 0.162, 12, '#e8e0c8', { caps: false }); });
        break;
      case 'crate':
        part(L, 'crate', m => { m.box(0, p.size[1] / 2, 0, p.size[0], p.size[1], p.size[2], '#fff', { fit: true }); });
        break;
      case 'locker':
        part(L, 'locker', m => { m.spec = 0.3; m.box(0, (p.h || 1.9) / 2, 0, p.w || 0.9, p.h || 1.9, p.d || 0.5, '#fff', { fit: true }); });
        break;
      case 'button':
        part(L, 'metal', m => { m.box(0, 0, 0.02, 0.2, 0.28, 0.04, '#5a5a58'); });
        part(L, p.color === 'green' ? 'neon_blue' : 'neon_red', m => { m.cyl([0, 0.03, -0.0], [0, 0.03, -0.03], 0.035, 0.035, 8, '#fff'); });
        break;
      case 'keypad':
        part(L, 'metal', m => { m.box(0, 0, 0.02, 0.18, 0.26, 0.04, '#3a3c3a'); });
        break;
      case 'phone':
        part(L, 'black', m => { m.spec = 0.6; m.box(0, 0, 0.04, 0.18, 0.3, 0.08, '#1a1a1a'); m.box(0.12, 0.02, 0.0, 0.06, 0.24, 0.05, '#1a1a1a'); });
        break;
      case 'tv':
        part(L, 'trim', m => { m.box(0, 0.25, 0, 0.62, 0.5, 0.5, '#2a2a2a'); });
        break;
      case 'note':
        part(L, 'paper', m => { m.box(0, 0.005, 0, 0.21, 0.01, 0.29, '#fff', { fit: true, rot: 0.3 }); });
        break;
      case 'padlock':
        part(L, 'metal', m => { m.spec = 0.8; m.box(0, 0, 0, 0.07, 0.07, 0.03, '#b8a040'); m.cyl([-0.02, 0.035, 0], [-0.02, 0.07, 0], 0.008, 0.008, 5, '#999'); m.cyl([0.02, 0.035, 0], [0.02, 0.07, 0], 0.008, 0.008, 5, '#999'); });
        break;
      case 'searchlight':
        part(L, 'metal', m => { m.cyl([0, 0, 0.3], [0, 0, -0.3], 0.35, 0.3, 12, '#3a3a3a'); });
        part(L, 'lamp', m => { m.cyl([0, 0, -0.3], [0, 0, -0.32], 0.3, 0.3, 12, '#fff'); });
        break;
      case 'mover':
        if (p.model === 'train' || p.model === 'eltrain') buildTrain(L, p);
        else if (p.model === 'subwaycar') {
          for (const b of p.parts || []) {
            const floor = b[4] <= 0.001;
            part(L, floor ? 'diamond_plate' : 'train_side', m => { m.spec = 0.4; m.uvs = 1.2; m.box((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2, b[3] - b[0], b[4] - b[1], b[5] - b[2], '#fff'); });
          }
          part(L, 'fluor', m => { m.box(0, 2.38, 0, 12, 0.04, 0.3, '#fff'); });
          part(L, 'fabric_blue', m => { m.box(-5.5, 0.25, 1.05, 3.2, 0.5, 0.45, '#fff'); m.box(0, 0.25, 1.05, 3.2, 0.5, 0.45, '#fff'); m.box(5.2, 0.25, 1.05, 3.2, 0.5, 0.45, '#fff'); });
          part(L, 'metal', m => { m.spec = 0.8; m.box(6.8, 1.0, 0, 0.5, 0.9, 1.6, '#aaa'); });
        }
        else if (p.model === 'mercedes' || p.model === 'car' || p.model === 'cruiser') return buildDecor(p.model, p);
        else if (p.model === 'elevator') part(L, 'metal_plate', m => { const b = p.parts[0]; m.box((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2, b[3] - b[0], b[4] - b[1], b[5] - b[2], '#fff'); });
        else for (const b of p.parts || []) part(L, p.mat || 'metal', m => { m.box((b[0] + b[3]) / 2, (b[1] + b[4]) / 2, (b[2] + b[5]) / 2, b[3] - b[0], b[4] - b[1], b[5] - b[2], '#fff'); });
        break;
      case 'block':
        part(L, p.mat || 'concrete', m => { m.box((p.min[0] + p.max[0]) / 2, (p.min[1] + p.max[1]) / 2, (p.min[2] + p.max[2]) / 2, p.max[0] - p.min[0], p.max[1] - p.min[1], p.max[2] - p.min[2], '#fff'); });
        break;
    }
    return L;
  }
  M.buildProp = buildProp;

  function buildTrain(L, p) {
    for (const b of p.parts || []) {
      const cx = (b[0] + b[3]) / 2, cy = (b[1] + b[4]) / 2, cz = (b[2] + b[5]) / 2;
      const sx = b[3] - b[0], sy = b[4] - b[1], sz = b[5] - b[2];
      const along = sx > sz ? 'x' : 'z';
      const len = Math.max(sx, sz), wid = Math.min(sx, sz);
      part(L, 'train_side', m => { m.spec = 0.6; m.box(cx, cy, cz, sx, sy, sz, '#fff', { fit: true, skip: 't' }); });
      part(L, 'metal_plate', m => { m.box(cx, b[4] - 0.01, cz, sx - 0.05, 0.02, sz - 0.05, '#aaa'); });
      part(L, 'window_lit', m => {
        const n = Math.floor(len / 2.2);
        for (let i = 0; i < n; i++) {
          const t = -len / 2 + (i + 0.5) * len / n;
          for (const s of [-1, 1]) {
            if (along === 'x') m.box(cx + t, cy + sy * 0.12, cz + s * (wid / 2 + 0.01), 1.3, 0.8, 0.02, '#fff', { fit: true });
            else m.box(cx + s * (wid / 2 + 0.01), cy + sy * 0.12, cz + t, 0.02, 0.8, 1.3, '#fff', { fit: true });
          }
        }
      });
      part(L, 'lamp', m => {
        if (along === 'x') { m.box(b[0] - 0.01, cy - sy * 0.25, cz - wid * 0.3, 0.02, 0.18, 0.25, '#fff'); m.box(b[0] - 0.01, cy - sy * 0.25, cz + wid * 0.3, 0.02, 0.18, 0.25, '#fff'); }
        else { m.box(cx - wid * 0.3, cy - sy * 0.25, b[2] - 0.01, 0.25, 0.18, 0.02, '#fff'); m.box(cx + wid * 0.3, cy - sy * 0.25, b[2] - 0.01, 0.25, 0.18, 0.02, '#fff'); }
      });
    }
  }
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
