(function (K) {
  'use strict';
  const WALL_H = 3.4;
  K.WALL_H = WALL_H;

  const m4 = {
    ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    mul(a, b) {
      const o = new Float32Array(16);
      for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k];
        o[c * 4 + r] = s;
      }
      return o;
    },
    persp(fov, asp, n, f) {
      const t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
      o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
      return o;
    },
    look(e, c, u) {
      let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      let l = Math.hypot(zx, zy, zz); zx /= l; zy /= l; zz /= l;
      let xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
      l = Math.hypot(xx, xy, xz); xx /= l; xy /= l; xz /= l;
      const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0, -(xx * e[0] + xy * e[1] + xz * e[2]), -(yx * e[0] + yy * e[1] + yz * e[2]), -(zx * e[0] + zy * e[1] + zz * e[2]), 1]);
    },
    inv(m) {
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

  class Stack {
    constructor() { this.m = m4.ident(); this.st = []; }
    reset() { this.m = m4.ident(); this.st.length = 0; }
    push() { this.st.push(this.m.slice()); }
    pop() { this.m = this.st.pop(); }
    t(x, y, z) { const m = this.m; m[12] += m[0] * x + m[4] * y + m[8] * z; m[13] += m[1] * x + m[5] * y + m[9] * z; m[14] += m[2] * x + m[6] * y + m[10] * z; m[15] += m[3] * x + m[7] * y + m[11] * z; return this; }
    s(x, y, z) { const m = this.m; for (let i = 0; i < 4; i++) { m[i] *= x; m[4 + i] *= y; m[8 + i] *= z; } return this; }
    ry(a) { const c = Math.cos(a), s = Math.sin(a), m = this.m; for (let i = 0; i < 4; i++) { const x = m[i], z = m[8 + i]; m[i] = x * c - z * s; m[8 + i] = x * s + z * c; } return this; }
    rx(a) { const c = Math.cos(a), s = Math.sin(a), m = this.m; for (let i = 0; i < 4; i++) { const y = m[4 + i], z = m[8 + i]; m[4 + i] = y * c + z * s; m[8 + i] = -y * s + z * c; } return this; }
    rz(a) { const c = Math.cos(a), s = Math.sin(a), m = this.m; for (let i = 0; i < 4; i++) { const x = m[i], y = m[4 + i]; m[i] = x * c + y * s; m[4 + i] = -x * s + y * c; } return this; }
  }

  const colCache = new Map();
  function rgb(hex) {
    if (Array.isArray(hex)) return hex;
    let c = colCache.get(hex);
    if (c) return c;
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map(x => parseInt(x + x, 16)) : [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    c = [v[0] / 255, v[1] / 255, v[2] / 255];
    colCache.set(hex, c);
    return c;
  }
  const shade = (c, k) => [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];
  K.rgb = rgb;

  const VS = `
attribute vec3 aPos; attribute vec3 aNor; attribute vec3 aCol; attribute float aEmit;
uniform mat4 uVP; uniform mat4 uModel;
varying vec3 vCol; varying vec3 vNor; varying vec3 vW; varying float vEmit;
void main(){ vec4 w = uModel * vec4(aPos,1.0); vW = w.xyz; vNor = normalize(mat3(uModel) * aNor); vCol = aCol; vEmit = aEmit; gl_Position = uVP * w; }`;
  const FS = `
precision mediump float;
varying vec3 vCol; varying vec3 vNor; varying vec3 vW; varying float vEmit;
uniform vec4 uTint; uniform float uEmit; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uAmb;
uniform vec3 uFog; uniform vec2 uFogR; uniform vec3 uEye; uniform vec3 uLP[8]; uniform vec3 uLC[8]; uniform float uLR[8]; uniform float uFlash; uniform float uAlpha;
uniform vec4 uCut; uniform float uCutOn;
void main(){
  if (uCutOn > 0.5 && vW.y > 1.05) {
    vec2 a = uCut.xy; vec2 b = uCut.zw; vec2 ab = b - a; float l2 = max(dot(ab, ab), 0.001);
    float t = clamp(dot(vW.xz - a, ab) / l2, 0.0, 1.0);
    float d = length(vW.xz - (a + ab * t));
    if (t > 0.02 && d < 1.4 + t * 4.2) discard;
    if (length(vW.xz - a) < 2.2 && dot(vW.xz - a, ab) > -0.5) discard;
  }
  vec3 base = vCol * uTint.rgb;
  vec3 n = normalize(vNor);
  float d = max(dot(n, normalize(uSunDir)), 0.0);
  vec3 lit = vec3(uAmb) + uSunCol * d * 0.55 + vec3(0.06) * (n.y * 0.5 + 0.5);
  for (int i = 0; i < 8; i++) {
    vec3 L = uLP[i] - vW; float dist = length(L);
    float att = clamp(1.0 - dist / uLR[i], 0.0, 1.0);
    lit += uLC[i] * att * att * 0.75 * (0.35 + 0.65 * max(dot(n, L / max(dist, 0.001)), 0.0));
  }
  float e = max(vEmit, uEmit);
  vec3 col = mix(base * lit, base * 1.25, e) + vec3(uFlash);
  float f = clamp((length(vW - uEye) - uFogR.x) / (uFogR.y - uFogR.x), 0.0, 1.0);
  col = mix(col, uFog, f * (1.0 - e * 0.6));
  gl_FragColor = vec4(col, uTint.a * uAlpha);
}`;
  const SKY_VS = 'attribute vec2 aP; varying float vY; void main(){ vY = aP.y; gl_Position = vec4(aP, 0.999, 1.0); }';
  const SKY_FS = 'precision mediump float; varying float vY; uniform vec3 uTop; uniform vec3 uBot; void main(){ gl_FragColor = vec4(mix(uBot, uTop, clamp(vY * 0.5 + 0.5, 0.0, 1.0)), 1.0); }';

  class MeshBuilder {
    constructor() { this.v = []; }
    vert(x, y, z, nx, ny, nz, c, e) { this.v.push(x, y, z, nx, ny, nz, c[0], c[1], c[2], e || 0); }
    quad(p, n, c, e) {
      const [a, b, cc, d] = p;
      this.vert(...a, ...n, c, e); this.vert(...b, ...n, c, e); this.vert(...cc, ...n, c, e);
      this.vert(...a, ...n, c, e); this.vert(...cc, ...n, c, e); this.vert(...d, ...n, c, e);
    }
    box(x0, y0, z0, x1, y1, z1, c, e, faces) {
      const f = faces || 63;
      const top = c.top || c, side = c.side || c;
      if (f & 1) this.quad([[x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]], [0, 1, 0], top, e);
      if (f & 2) this.quad([[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]], [0, -1, 0], shade(side, 0.5), e);
      if (f & 4) this.quad([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], side, e);
      if (f & 8) this.quad([[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]], [0, 0, -1], side, e);
      if (f & 16) this.quad([[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [1, 0, 0], shade(side, 0.92), e);
      if (f & 32) this.quad([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], shade(side, 0.92), e);
    }
    cyl(cx, y0, cz, r, h, seg, c, e, capTop) {
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
        const x0 = cx + Math.cos(a0) * r, z0 = cz + Math.sin(a0) * r, x1 = cx + Math.cos(a1) * r, z1 = cz + Math.sin(a1) * r;
        const am = (a0 + a1) / 2;
        this.quad([[x0, y0, z0], [x1, y0, z1], [x1, y0 + h, z1], [x0, y0 + h, z0]].reverse(), [Math.cos(am), 0, Math.sin(am)], c, e);
        if (capTop !== false) {
          this.vert(cx, y0 + h, cz, 0, 1, 0, c.top || c, e); this.vert(x1, y0 + h, z1, 0, 1, 0, c.top || c, e); this.vert(x0, y0 + h, z0, 0, 1, 0, c.top || c, e);
        }
      }
    }
    build(gl) {
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.v), gl.STATIC_DRAW);
      return { buf, n: this.v.length / 10 };
    }
  }

  function hash(x, z) { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: true, alpha: false, preserveDrawingBuffer: false }) || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.prog = this.program(VS, FS);
      this.sky = this.program(SKY_VS, SKY_FS);
      const P = this.prog;
      this.loc = {};
      for (const a of ['aPos', 'aNor', 'aCol', 'aEmit']) this.loc[a] = gl.getAttribLocation(P, a);
      for (const u of ['uVP', 'uModel', 'uTint', 'uEmit', 'uSunDir', 'uSunCol', 'uAmb', 'uFog', 'uFogR', 'uEye', 'uFlash', 'uAlpha', 'uCut', 'uCutOn']) this.loc[u] = gl.getUniformLocation(P, u);
      this.loc.uLP = gl.getUniformLocation(P, 'uLP'); this.loc.uLC = gl.getUniformLocation(P, 'uLC'); this.loc.uLR = gl.getUniformLocation(P, 'uLR');
      const cube = new MeshBuilder();
      cube.box(-0.5, -0.5, -0.5, 0.5, 0.5, 0.5, [1, 1, 1], 0);
      this.cube = cube.build(gl);
      const cyl = new MeshBuilder();
      cyl.cyl(0, -0.5, 0, 0.5, 1, 10, [1, 1, 1], 0, true);
      this.cylM = cyl.build(gl);
      const sph = new MeshBuilder();
      this.sphere(sph, 8, 6);
      this.sph = sph.build(gl);
      const ring = new MeshBuilder();
      for (let i = 0; i < 24; i++) {
        const a0 = i / 24 * Math.PI * 2, a1 = (i + 1) / 24 * Math.PI * 2;
        const p = (a, r) => [Math.cos(a) * r, 0, Math.sin(a) * r];
        ring.quad([p(a0, 0.42), p(a1, 0.42), p(a1, 0.5), p(a0, 0.5)], [0, 1, 0], [1, 1, 1], 1);
      }
      this.ring = ring.build(gl);
      const disc = new MeshBuilder();
      for (let i = 0; i < 16; i++) {
        const a0 = i / 16 * Math.PI * 2, a1 = (i + 1) / 16 * Math.PI * 2;
        disc.vert(0, 0, 0, 0, 1, 0, [0, 0, 0], 0); disc.vert(Math.cos(a1) * 0.5, 0, Math.sin(a1) * 0.5, 0, 1, 0, [0, 0, 0], 0); disc.vert(Math.cos(a0) * 0.5, 0, Math.sin(a0) * 0.5, 0, 1, 0, [0, 0, 0], 0);
      }
      this.disc = disc.build(gl);
      this.skyBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
      this.skyLoc = { aP: gl.getAttribLocation(this.sky, 'aP'), uTop: gl.getUniformLocation(this.sky, 'uTop'), uBot: gl.getUniformLocation(this.sky, 'uBot') };
      this.st = new Stack();
      this.static = null;
      this.skyline = null;
      this.particles = [];
      this.bolts = [];
      this.rings = [];
      this.lights = [];
      this.cam = { yaw: 0, pitch: 0.78, dist: 10, tx: 0, ty: 1, tz: 0, x: 0, y: 8, z: 8, shake: 0 };
      this.time = 0;
      this.traffic = [];
    }

    program(vs, fs) {
      const gl = this.gl;
      const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh)); return sh; };
      const p = gl.createProgram();
      gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }

    sphere(mb, seg, rings) {
      for (let r = 0; r < rings; r++) {
        const t0 = r / rings * Math.PI, t1 = (r + 1) / rings * Math.PI;
        for (let s = 0; s < seg; s++) {
          const p0 = s / seg * Math.PI * 2, p1 = (s + 1) / seg * Math.PI * 2;
          const P = (t, p) => [Math.sin(t) * Math.cos(p) * 0.5, Math.cos(t) * 0.5, Math.sin(t) * Math.sin(p) * 0.5];
          const a = P(t0, p0), b = P(t0, p1), c = P(t1, p1), d = P(t1, p0);
          const n = P((t0 + t1) / 2, (p0 + p1) / 2).map(v => v * 2);
          mb.quad([a, b, c, d], n, [1, 1, 1], 0);
        }
      }
    }

    buildArea(game) {
      const gl = this.gl;
      const a = game.area;
      const th = a.theme;
      const mb = new MeshBuilder();
      const lights = [];
      const floorCols = th.floor.map(rgb);
      const wall = rgb(th.wall), wallTop = shade(rgb(th.wallTop), 0.62), trim = rgb(th.trim), lamp = rgb(th.lamp);
      const isWallish = (x, z) => { const t = game.tileAt(x, z); return t === '#' || t === 'x'; };
      const depth = new Int16Array(a.w * a.h).fill(99);
      const dq = [];
      for (let z = 0; z < a.h; z++) for (let x = 0; x < a.w; x++) { const t = a.tiles[z * a.w + x]; if (t !== '#' && t !== ' ') { depth[z * a.w + x] = 0; dq.push(z * a.w + x); } }
      for (let qi = 0; qi < dq.length; qi++) {
        const i = dq[qi], x = i % a.w, z = (i - x) / a.w;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, nz = z + dz;
          if (nx < 0 || nz < 0 || nx >= a.w || nz >= a.h) continue;
          const j = nz * a.w + nx;
          if (depth[j] > depth[i] + 1 && a.tiles[j] === '#') { depth[j] = depth[i] + 1; dq.push(j); }
        }
      }
      const city = !!th.skyline;
      const wallH = (x, z) => {
        const d = depth[z * a.w + x];
        if (!city || d <= 1) return WALL_H;
        const blk = hash(Math.floor(x / 3), Math.floor(z / 3));
        return WALL_H + Math.min(16, (d - 1) * 2.2 + blk * 8);
      };
      const isVoid = (x, z) => game.tileAt(x, z) === ' ';
      for (let z = 0; z < a.h; z++) {
        for (let x = 0; x < a.w; x++) {
          const ch = a.tiles[z * a.w + x];
          const T = K.TILES[ch];
          const hv = hash(x, z);
          const floorCh = T && T.kind === 'floor' ? ch : (ch === '+' || ch === 'b' || ch === 'u' || (T && T.kind !== 'wall' && T.kind !== 'void')) ? game.floorUnder(a.def, x, z) : null;
          if (floorCh && ch !== 'x') {
            const ft = K.TILES[floorCh] || K.TILES['.'];
            let fc = floorCols[ft.f || 0];
            const k = 0.94 + hv * 0.1 - ((x + z) & 1) * 0.03;
            fc = shade(fc, k);
            const glow = ft.f === 6 ? 0.6 : 0;
            const y = ft.f === 4 ? -0.08 : 0;
            mb.quad([[x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z]], [0, 1, 0], fc, glow);
            if (ft.f === 4) mb.quad([[x, y, z], [x, y, z + 1], [x + 1, y, z + 1], [x + 1, y, z]], [0, 1, 0], fc, 0.15);
            if (ft.f === 3 && hv > 0.5) mb.box(x + 0.05, 0.001, z + 0.48, x + 0.95, 0.01, z + 0.52, shade(fc, 0.7), 0);
          }
          if (ch === '#' || ch === 'x') {
            const exposed = [[0, -1, 8], [0, 1, 4], [1, 0, 16], [-1, 0, 32]];
            let faces = 1;
            for (const [dx, dz, bit] of exposed) if (!isWallish(x + dx, z + dz) && !isVoid(x + dx, z + dz)) faces |= bit;
            const wh = ch === 'x' ? WALL_H : wallH(x, z);
            if (city && ch === '#') {
              for (const [dx, dz, bit] of exposed) {
                const nx = x + dx, nz = z + dz;
                if (isWallish(nx, nz) && game.inside(nx, nz) && wallH(nx, nz) < wh - 0.01) faces |= bit;
              }
            }
            const wc = shade(wall, 0.93 + hv * 0.1);
            mb.box(x, 0, z, x + 1, wh, z + 1, { side: wc, top: wh > WALL_H ? shade(wallTop, 0.8) : wallTop }, 0, faces);
            if (wh > WALL_H + 2 && (faces & ~1)) {
              for (let wy = WALL_H + 1.2; wy < wh - 0.8; wy += 2.2) if (hash(x * 3 + Math.floor(wy), z) > 0.45) mb.box(x - 0.01, wy, z - 0.01, x + 1.01, wy + 0.7, z + 1.01, hash(x, z + Math.floor(wy)) > 0.5 ? lamp : trim, 0.75, faces & ~1);
            }
            if (ch === '#') {
              const tf = faces & ~1;
              if (tf) mb.box(x - 0.002, 0.92, z - 0.002, x + 1.002, 1.0, z + 1.002, trim, 0.9, tf);
              if (tf && hv > 0.82) mb.box(x - 0.004, 1.9, z - 0.004, x + 1.004, 2.5, z + 1.004, shade(trim, 0.6), 0.5, tf);
            }
            continue;
          }
          const cx = x + 0.5, cz = z + 0.5;
          if (!T) continue;
          switch (T.kind) {
            case 'rail': mb.box(x + 0.1, 0, z + 0.1, x + 0.9, 0.95, z + 0.9, { side: shade(wall, 0.8), top: trim }, 0); mb.box(x + 0.08, 0.95, z + 0.08, x + 0.92, 1.02, z + 0.92, trim, 0.8); break;
            case 'bar': mb.box(x, 0, z, x + 1, 1.05, z + 1, { side: shade(wall, 0.7), top: shade(wallTop, 1.05) }, 0); mb.box(x, 0.2, z, x + 1, 0.3, z + 1, trim, 0.9); break;
            case 'table': mb.box(x + 0.1, 0.72, z + 0.1, x + 0.9, 0.8, z + 0.9, shade(wallTop, 0.9), 0); mb.box(cx - 0.08, 0, cz - 0.08, cx + 0.08, 0.72, cz + 0.08, shade(wall, 0.5), 0); break;
            case 'pillar': mb.cyl(cx, 0, cz, 0.42, WALL_H, 8, shade(wall, 1.05), 0); mb.cyl(cx, 2.4, cz, 0.44, 0.12, 8, trim, 0.9, false); break;
            case 'console': mb.box(x + 0.15, 0, z + 0.15, x + 0.85, 1.1, z + 0.85, shade(wall, 0.55), 0); mb.box(x + 0.1, 1.1, z + 0.1, x + 0.9, 1.35, z + 0.9, rgb('#40c0ff'), 0.9); break;
            case 'crate': { const cc = shade(rgb('#7a6a50'), 0.8 + hv * 0.4); mb.box(x + 0.08, 0, z + 0.08, x + 0.92, 0.95, z + 0.92, cc, 0); mb.box(x + 0.06, 0.4, z + 0.06, x + 0.94, 0.5, z + 0.94, shade(cc, 0.6), 0); if (hv > 0.5) mb.box(x + 0.2, 0.95, z + 0.2, x + 0.75, 1.5, z + 0.75, shade(cc, 1.1), 0); break; }
            case 'bed': mb.box(x + 0.05, 0, z + 0.1, x + 0.95, 0.45, z + 0.9, shade(wallTop, 0.8), 0); mb.box(x + 0.1, 0.45, z + 0.15, x + 0.4, 0.6, z + 0.85, rgb('#e0e0e0'), 0); break;
            case 'plant': mb.cyl(cx, 0, cz, 0.3, 0.45, 6, rgb('#6a5040'), 0); mb.box(cx - 0.3, 0.45, cz - 0.3, cx + 0.3, 1.1, cz + 0.3, rgb('#3a7a3a'), 0); mb.box(cx - 0.2, 1.1, cz - 0.2, cx + 0.2, 1.4, cz + 0.2, rgb('#4a9a4a'), 0); break;
            case 'lamp': mb.cyl(cx, 0, cz, 0.08, 3.0, 6, rgb('#303038'), 0); mb.box(cx - 0.22, 3.0, cz - 0.22, cx + 0.22, 3.3, cz + 0.22, lamp, 1); lights.push({ x: cx, y: 2.8, z: cz, c: lamp, r: 9 }); break;
            case 'rubble': for (let i = 0; i < 4; i++) { const r1 = hash(x + i, z * 3 + i), r2 = hash(x * 7 + i, z + i); const px = x + 0.15 + r1 * 0.6, pz = z + 0.15 + r2 * 0.6, s = 0.18 + r1 * 0.2; mb.box(px - s, 0, pz - s, px + s, s * 1.8, pz + s, shade(wall, 0.6 + r2 * 0.3), 0); } break;
            case 'swoop': mb.box(x + 0.1, 0.35, z + 0.2, x + 0.9, 0.7, z + 0.8, rgb('#a03020'), 0); mb.box(x + 0.25, 0.7, z + 0.3, x + 0.6, 0.9, z + 0.7, rgb('#303030'), 0); mb.box(x + 0.85, 0.4, z + 0.3, x + 0.98, 0.65, z + 0.7, rgb('#60a0ff'), 1); break;
            case 'hut': mb.box(x, 0, z, x + 1, 1.8, z + 1, { side: shade(rgb('#6a5a40'), 0.8 + hv * 0.3), top: rgb('#4a3a2a') }, 0); break;
            case 'cage': mb.box(x + 0.02, 0, z + 0.02, x + 0.98, 0.15, z + 0.98, rgb('#303040'), 0); mb.box(x + 0.02, 2.5, z + 0.02, x + 0.98, 2.6, z + 0.98, rgb('#303040'), 0); for (let i = 0; i < 3; i++) { const o = 0.15 + i * 0.35; mb.box(x + o, 0.15, z + 0.02, x + o + 0.04, 2.5, z + 0.06, rgb('#ff6040'), 1); mb.box(x + o, 0.15, z + 0.94, x + o + 0.04, 2.5, z + 0.98, rgb('#ff6040'), 1); } lights.push({ x: cx, y: 1.3, z: cz, c: rgb('#ff4020'), r: 4 }); break;
          }
        }
      }
      if (a.def.ship) this.buildHawk(mb, a.def.ship);
      for (let z = 4; z < a.h; z += 8) for (let x = 4; x < a.w; x += 8) {
        if (game.baseWalk(x, z) && !lights.some(l => Math.abs(l.x - x) < 5 && Math.abs(l.z - z) < 5)) lights.push({ x: x + 0.5, y: WALL_H - 0.3, z: z + 0.5, c: shade(lamp, 0.55), r: 9, amb: true });
      }
      for (const d of game.doors) this.doorFrame(mb, game, d, trim, wall);
      if (this.static) gl.deleteBuffer(this.static.buf);
      this.static = mb.build(gl);
      this.lights = lights;
      if (this.skyline) { gl.deleteBuffer(this.skyline.buf); this.skyline = null; }
      if (th.skyline) {
        const sm = new MeshBuilder();
        const cx = a.w / 2, cz = a.h / 2;
        const rr = Math.max(a.w, a.h) * 0.75 + 20;
        for (let i = 0; i < 70; i++) {
          const ang = i / 70 * Math.PI * 2 + hash(i, 3) * 0.08;
          const r = rr + hash(i, 7) * 40;
          const bx = cx + Math.cos(ang) * r, bz = cz + Math.sin(ang) * r;
          const w = 5 + hash(i, 11) * 9, hgt = 18 + hash(i, 13) * 55;
          const col = shade(rgb(th.wall), 0.35 + hash(i, 5) * 0.2);
          sm.box(bx - w / 2, -30, bz - w / 2, bx + w / 2, hgt, bz + w / 2, col, 0);
          for (let k = 0; k < 6; k++) {
            const wy = -5 + k * (hgt / 6) + hash(i, k) * 3;
            sm.box(bx - w / 2 - 0.05, wy, bz - w / 2 - 0.05, bx + w / 2 + 0.05, wy + 0.5, bz + w / 2 + 0.05, hash(i, k + 20) > 0.5 ? rgb(th.lamp) : rgb(th.trim), 0.85);
          }
          if (hash(i, 17) > 0.7) sm.box(bx - 0.3, hgt, bz - 0.3, bx + 0.3, hgt + 6, bz + 0.3, rgb('#ff3030'), 1);
        }
        this.skyline = sm.build(gl);
        this.traffic = [];
        for (let i = 0; i < 26; i++) this.traffic.push({ a: hash(i, 99) * Math.PI * 2, r: rr * (0.7 + hash(i, 98) * 0.5), y: 12 + hash(i, 97) * 30, sp: (0.02 + hash(i, 96) * 0.04) * (i % 2 ? 1 : -1), c: hash(i, 95) > 0.5 ? rgb('#ffe0a0') : rgb('#ff5050') });
      } else this.traffic = [];
      this.area = a;
      this.theme = th;
    }

    buildHawk(mb, s) {
      const hull = rgb('#b8b4a8'), dark = rgb('#6a6860'), glow = rgb('#60c0ff');
      const cx = s.x + 0.5, cz = s.z + 0.5;
      mb.cyl(cx, 1.2, cz, 5.2, 0.9, 20, { side: hull, top: shade(hull, 1.05) }, 0);
      mb.cyl(cx, 2.1, cz, 4.2, 0.5, 20, { side: shade(hull, 0.9), top: shade(hull, 1.1) }, 0);
      mb.cyl(cx, 2.6, cz, 2.2, 0.6, 16, { side: dark, top: shade(hull, 1.15) }, 0);
      mb.box(cx - 3.6, 1.3, cz - 6.4, cx - 1.6, 2.1, cz - 3.5, hull, 0);
      mb.box(cx + 1.6, 1.3, cz - 6.4, cx + 3.6, 2.1, cz - 3.5, hull, 0);
      mb.box(cx - 3.4, 1.35, cz - 6.55, cx - 1.8, 2.05, cz - 6.3, dark, 0);
      mb.box(cx + 1.8, 1.35, cz - 6.55, cx + 3.4, 2.05, cz - 6.3, dark, 0);
      mb.box(cx + 4.6, 1.5, cz - 1.2, cx + 7.0, 2.6, cz + 0.8, hull, 0);
      mb.box(cx + 6.9, 1.7, cz - 1.0, cx + 7.3, 2.4, cz + 0.6, rgb('#203040'), 0.6);
      mb.box(cx - 3.9, 1.4, cz + 4.4, cx - 1.1, 2.1, cz + 5.0, glow, 1);
      mb.box(cx + 1.1, 1.4, cz + 4.4, cx + 3.9, 2.1, cz + 5.0, glow, 1);
      for (const [dx, dz] of [[-3, 2], [3, 2], [0, -3]]) mb.cyl(cx + dx, 0, cz + dz, 0.25, 1.25, 6, dark, 0);
      mb.box(cx - 0.8, 0.02, cz + 4.2, cx + 0.8, 1.25, cz + 5.4, dark, 0);
    }

    doorFrame(mb, game, d, trim, wall) {
      const x = d.x, z = d.z;
      const horiz = game.tileAt(x - 1, z) === '#' || game.tileAt(x + 1, z) === '#';
      d.horiz = horiz;
      if (horiz) mb.box(x, 2.6, z + 0.3, x + 1, WALL_H, z + 0.7, { side: shade(wall, 0.9), top: shade(wall, 1.1) }, 0);
      else mb.box(x + 0.3, 2.6, z, x + 0.7, WALL_H, z + 1, { side: shade(wall, 0.9), top: shade(wall, 1.1) }, 0);
    }

    resize(w, h) {
      this.canvas.width = w; this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }

    bindMesh(m) {
      const gl = this.gl, L = this.loc;
      gl.bindBuffer(gl.ARRAY_BUFFER, m.buf);
      gl.enableVertexAttribArray(L.aPos); gl.vertexAttribPointer(L.aPos, 3, gl.FLOAT, false, 40, 0);
      gl.enableVertexAttribArray(L.aNor); gl.vertexAttribPointer(L.aNor, 3, gl.FLOAT, false, 40, 12);
      gl.enableVertexAttribArray(L.aCol); gl.vertexAttribPointer(L.aCol, 3, gl.FLOAT, false, 40, 24);
      gl.enableVertexAttribArray(L.aEmit); gl.vertexAttribPointer(L.aEmit, 1, gl.FLOAT, false, 40, 36);
      this.bound = m;
    }

    draw(mesh, col, emit, alpha) {
      const gl = this.gl, L = this.loc;
      if (this.bound !== mesh) this.bindMesh(mesh);
      gl.uniformMatrix4fv(L.uModel, false, this.st.m);
      const c = rgb(col);
      gl.uniform4f(L.uTint, c[0], c[1], c[2], 1);
      gl.uniform1f(L.uEmit, emit || 0);
      gl.uniform1f(L.uAlpha, alpha == null ? 1 : alpha);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.n);
    }

    part(x, y, z, sx, sy, sz, col, emit) {
      this.st.push(); this.st.t(x, y, z).s(sx, sy, sz); this.draw(this.cube, col, emit); this.st.pop();
    }
    ball(x, y, z, sx, sy, sz, col, emit) {
      this.st.push(); this.st.t(x, y, z).s(sx, sy, sz); this.draw(this.sph, col, emit); this.st.pop();
    }

    updateCamera(game, dt, ui) {
      const c = this.cam;
      const L = game.leader;
      let tx = L ? L.x : 0, tz = L ? L.z : 0, ty = 1.1, dist = c.dist, pitch = c.pitch, yaw = c.yaw;
      if (game.mode === 'dialog' && game.dialog && ui && ui.dialogCam) {
        const d = ui.dialogCam;
        tx = d.x; tz = d.z; ty = d.y; dist = d.dist; pitch = d.pitch; yaw = d.yaw;
      }
      const k = Math.min(1, dt * 6);
      c.tx += (tx - c.tx) * k; c.ty += (ty - c.ty) * k; c.tz += (tz - c.tz) * k;
      c.cd = c.cd == null ? dist : c.cd + (dist - c.cd) * k;
      c.cp = c.cp == null ? pitch : c.cp + (pitch - c.cp) * k;
      c.cy = c.cy == null ? yaw : c.cy + K.wrapAngle(yaw - c.cy) * k;
      if (game.mode !== 'dialog') c.cy = yaw;
      c.x = c.tx + Math.sin(c.cy) * Math.cos(c.cp) * c.cd;
      c.y = c.ty + Math.sin(c.cp) * c.cd;
      c.z = c.tz + Math.cos(c.cy) * Math.cos(c.cp) * c.cd;
      if (c.shake > 0) { c.x += (Math.random() - 0.5) * c.shake; c.y += (Math.random() - 0.5) * c.shake; c.shake = Math.max(0, c.shake - dt * 2); }
    }

    snapCamera() { this.cam.tx = null; }

    render(game, dt, ui) {
      const gl = this.gl;
      this.time += dt;
      if (!this.static || this.area !== game.area) this.buildArea(game);
      const c = this.cam;
      if (c.tx == null && game.leader) {
        const L0 = game.leader, a0 = game.area;
        c.tx = L0.x; c.tz = L0.z; c.ty = 1.1; c.cd = c.dist; c.cp = c.pitch;
        if (Math.hypot(L0.x - a0.w / 2, L0.z - a0.h / 2) > 6) { c.yaw = Math.atan2(L0.x - a0.w / 2, L0.z - a0.h / 2); c.cy = c.yaw; }
      }
      this.updateCamera(game, dt, ui);
      const th = this.theme;
      const w = this.canvas.width, h = this.canvas.height;
      gl.viewport(0, 0, w, h);
      const fog = rgb(th.fog);
      gl.clearColor(fog[0], fog[1], fog[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (th.sky) {
        gl.useProgram(this.sky);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
        gl.enableVertexAttribArray(this.skyLoc.aP);
        gl.vertexAttribPointer(this.skyLoc.aP, 2, gl.FLOAT, false, 0, 0);
        const t1 = rgb(th.sky[1]), t0 = rgb(th.sky[0]);
        gl.uniform3f(this.skyLoc.uTop, t1[0], t1[1], t1[2]);
        gl.uniform3f(this.skyLoc.uBot, t0[0], t0[1], t0[2]);
        gl.depthMask(false);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.depthMask(true);
        gl.disableVertexAttribArray(this.skyLoc.aP);
      }
      gl.useProgram(this.prog);
      this.bound = null;
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      const L = this.loc;
      this.proj = m4.persp(0.9, w / h, 0.1, 400);
      this.view = m4.look([c.x, c.y, c.z], [c.tx, c.ty, c.tz], [0, 1, 0]);
      this.vp = m4.mul(this.proj, this.view);
      this.ivp = m4.inv(this.vp);
      gl.uniformMatrix4fv(L.uVP, false, this.vp);
      const sd = th.sun;
      gl.uniform3f(L.uSunDir, sd[0], sd[1], sd[2]);
      const sc = rgb(th.sunCol);
      gl.uniform3f(L.uSunCol, sc[0], sc[1], sc[2]);
      gl.uniform1f(L.uAmb, th.amb);
      gl.uniform3f(L.uEye, c.x, c.y, c.z);
      gl.uniform1f(L.uFlash, 0);
      this.setLights(game);
      if (this.skyline) {
        gl.uniform3f(L.uFog, fog[0], fog[1], fog[2]);
        gl.uniform2f(L.uFogR, 60, 260);
        this.st.reset();
        this.draw(this.skyline, [1, 1, 1], 0);
        for (const t of this.traffic) {
          t.a += t.sp * dt;
          const cx = this.area.w / 2 + Math.cos(t.a) * t.r, cz = this.area.h / 2 + Math.sin(t.a) * t.r;
          this.st.reset(); this.st.t(cx, t.y, cz).ry(-t.a).s(0.8, 0.3, 1.6);
          this.draw(this.cube, t.c, 1);
        }
      }
      gl.uniform3f(L.uFog, fog[0], fog[1], fog[2]);
      gl.uniform2f(L.uFogR, th.fogFar * 0.35, th.fogFar);
      this.st.reset();
      const cutDx = c.x - c.tx, cutDz = c.z - c.tz, cutL = Math.hypot(cutDx, cutDz) || 1;
      gl.uniform4f(L.uCut, c.tx, c.tz, c.tx + cutDx / cutL * Math.min(cutL, 9), c.tz + cutDz / cutL * Math.min(cutL, 9));
      gl.uniform1f(L.uCutOn, game.mode === 'dialog' ? 0 : 1);
      this.draw(this.static, [1, 1, 1], 0);
      this.drawDoors(game);
      this.drawObjects(game, ui);
      gl.uniform1f(L.uCutOn, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      for (const cr of game.creatures) {
        if (cr.dead && cr.deadT > 30) continue;
        const s = cr.big ? 2.6 : cr.model.b === 'hutt' ? 2.2 : 0.9 * (cr.model.w || 1);
        this.st.reset(); this.st.t(cr.x, 0.02, cr.z).s(s, 1, s);
        this.draw(this.disc, [0, 0, 0], 0, 0.35);
      }
      this.drawRings(game, ui, dt);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      for (const cr of game.creatures) this.drawCreature(cr, game);
      this.drawFx(game, dt);
    }

    setLights(game) {
      const gl = this.gl, L = this.loc, c = this.cam;
      const dyn = [];
      for (const b of this.bolts) dyn.push({ x: b.x, y: b.y, z: b.z, c: shade(b.c, 1.2), r: 3.5 });
      for (const p of this.particles) if (p.light) dyn.push({ x: p.x, y: p.y, z: p.z, c: p.c, r: p.light * Math.max(0, p.life / p.max) });
      for (const cr of game.creatures) { if (!cr.dead && cr.equip && cr.equip.r && K.ITEMS[cr.equip.r] && K.ITEMS[cr.equip.r].saber) dyn.push({ x: cr.x, y: 1.2, z: cr.z, c: rgb('#ffe040'), r: 4 }); }
      const all = this.lights.map(l => ({ l, d: (l.x - c.tx) ** 2 + (l.z - c.tz) ** 2 - (l.amb ? 0 : 20) }));
      all.sort((a, b) => a.d - b.d);
      const pick = dyn.slice(0, 3).concat(all.slice(0, 8).map(x => x.l)).slice(0, 8);
      const P = new Float32Array(24), C = new Float32Array(24), R = new Float32Array(8);
      pick.forEach((l, i) => { P[i * 3] = l.x; P[i * 3 + 1] = l.y; P[i * 3 + 2] = l.z; C[i * 3] = l.c[0]; C[i * 3 + 1] = l.c[1]; C[i * 3 + 2] = l.c[2]; R[i] = l.r; });
      for (let i = pick.length; i < 8; i++) R[i] = 0.001;
      gl.uniform3fv(L.uLP, P); gl.uniform3fv(L.uLC, C); gl.uniform1fv(L.uLR, R);
    }

    drawDoors(game) {
      const th = this.theme;
      for (const d of game.doors) {
        const open = d.anim || 0;
        const col = d.locked ? '#a04040' : th.trim;
        const x = d.x + 0.5, z = d.z + 0.5;
        const horiz = d.horiz !== false;
        for (const side of [-1, 1]) {
          const off = 0.25 + open * 0.5;
          this.st.reset();
          if (horiz) this.st.t(x + side * off, 1.3, z).s(0.5, 2.6, 0.18);
          else this.st.t(x, 1.3, z + side * off).s(0.18, 2.6, 0.5);
          this.draw(this.cube, rgb(th.wall).map(v => v * 0.85), 0);
          this.st.reset();
          if (horiz) this.st.t(x + side * (off - 0.2), 1.3, z).s(0.06, 2.2, 0.2);
          else this.st.t(x, 1.3, z + side * (off - 0.2)).s(0.2, 2.2, 0.06);
          this.draw(this.cube, col, 0.9);
        }
      }
    }

    drawObjects(game, ui) {
      const t = this.time;
      const hover = ui && ui.hover;
      for (const o of game.objects) {
        const hl = hover === o ? 0.35 : 0;
        this.st.reset();
        if (o.type === 'box') {
          const model = o.model;
          if (model === 'corpse') {
            this.st.t(o.x, 0.12, o.z).ry(0.6);
            this.part(0, 0, 0, 0.5, 0.24, 1.4, '#5a5048', hl);
            this.part(0, 0.05, 0.75, 0.3, 0.26, 0.3, '#8a7060', hl);
          } else {
            this.st.t(o.x, 0, o.z);
            this.part(0, 0.3, 0, 0.8, 0.6, 0.55, o.looted ? '#4a4a50' : '#6a7078', hl);
            this.part(0, 0.62, 0, 0.84, 0.06, 0.59, o.locked ? '#c04040' : o.looted ? '#505058' : '#40d0ff', o.looted ? 0 : 0.9);
          }
        } else if (o.type === 'corpse') {
          this.st.t(o.x, 0, o.z);
          this.part(0, 0.15, 0, 0.5, 0.3, 0.5, '#505860', hl);
          this.part(0, 0.32, 0, 0.3, 0.04, 0.3, '#40d0ff', 0.6 + Math.sin(t * 4) * 0.3);
        } else if (o.type === 'use') {
          this.st.t(o.x, 0, o.z);
          if (o.def.dlg === 'bait_spot') { this.part(0, 0.08, 0, 0.9, 0.16, 0.9, '#6a6050', hl); this.part(0.2, 0.2, 0.1, 0.5, 0.1, 0.1, '#d0c8b0', 0); this.part(-0.2, 0.2, -0.1, 0.1, 0.1, 0.5, '#d0c8b0', 0); }
          else if (o.def.dlg === 'hawk_ramp' || o.def.dlg === 'swoop_bike') { this.part(0, 0.05, 0, 0.9, 0.1, 0.9, '#40d0ff', 0.4 + Math.sin(t * 3) * 0.3); }
          else { this.part(0, 0.55, 0, 0.7, 1.1, 0.5, '#404850', hl); this.part(0, 1.15, 0.05, 0.62, 0.4, 0.42, '#40d0ff', 0.9); }
        } else if (o.type === 'exit') {
          const g = game;
          let fx = 0, fz = 0;
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (g.pathWalk(o.tx + dx, o.tz + dz)) { fx = dx; fz = dz; }
          const lift = /Лифт|Спидер|Подъём/.test(o.n);
          this.st.t(o.x, 0, o.z);
          if (lift) {
            this.part(fx * 0.45, 1.4, fz * 0.45, fz ? 0.95 : 0.12, 2.8, fx ? 0.95 : 0.12, '#303848', hl);
            this.part(fx * 0.52, 1.4, fz * 0.52, fz ? 0.7 : 0.04, 2.4, fx ? 0.7 : 0.04, '#40e0ff', 0.55 + Math.sin(t * 2) * 0.2);
          } else {
            this.part(fx * 0.45, 1.3, fz * 0.45, fz ? 0.98 : 0.14, 2.6, fx ? 0.98 : 0.14, '#3a3a44', hl);
            this.part(fx * 0.53, 1.3, fz * 0.53, fz ? 0.5 : 0.04, 2.0, fx ? 0.5 : 0.04, o.def.req && !game.evalReq(o.def.req) ? '#ff5040' : '#40e0ff', 0.8);
          }
        } else if (o.type === 'mine' && o.found) {
          this.st.t(o.x, 0, o.z);
          this.part(0, 0.05, 0, 0.4, 0.1, 0.4, '#303030', 0);
          this.part(0, 0.12, 0, 0.12, 0.05, 0.12, '#ff3030', 0.5 + Math.sin(t * 8) * 0.5);
        }
      }
    }

    drawRings(game, ui, dt) {
      const L = game.leader;
      const sel = ui && ui.selected;
      const hover = ui && ui.hover;
      const ringAt = (x, z, r, col, a) => { this.st.reset(); this.st.t(x, 0.04, z).ry(this.time * 0.8).s(r * 2, 1, r * 2); this.draw(this.ring, col, 1, a); };
      if (L && !L.dead && game.mode === 'play') ringAt(L.x, L.z, L.radius + 0.25, '#60a0ff', 0.55);
      for (const c of game.creatures) {
        if (c.dead) continue;
        if (c === sel || c === hover || (L && L.target === c.uid)) {
          const col = c.faction === 'hostile' ? '#ff4040' : c.faction === 'party' ? '#60ff80' : '#40e0ff';
          ringAt(c.x, c.z, c.radius + 0.35, col, c === sel || L && L.target === c.uid ? 0.9 : 0.5);
        }
      }
      if (hover && !hover.uid && hover.x != null && game.mode === 'play') ringAt(hover.x, hover.z, 0.7, '#40e0ff', 0.7);
      for (let i = this.rings.length - 1; i >= 0; i--) {
        const r = this.rings[i];
        r.t += dt;
        if (r.t > r.max) { this.rings.splice(i, 1); continue; }
        const k = r.t / r.max;
        ringAt(r.x, r.z, r.r0 + (r.r1 - r.r0) * k, r.c, 1 - k);
      }
    }

    drawCreature(c, game) {
      const m = c.model;
      const st = this.st;
      st.reset();
      st.t(c.x, 0, c.z).ry(c.ang);
      const hs = (m.h || 1);
      const ws = (m.w || 1);
      const a = c.anim || { a: 'idle', t: 0 };
      const flash = game.time - (c.hitT || -9) < 0.12 ? 0.35 : 0;
      this.gl.uniform1f(this.loc.uFlash, flash);
      if (c.dead || a.a === 'knock' && a.t < 2.5) {
        const k = Math.min(1, (c.dead ? c.deadT : a.t) / 0.5);
        const fall = k * Math.PI / 2 * 0.98;
        st.t(0, 0.05 + k * 0.12 * hs, 0).rx(-fall);
      }
      if (m.b === 'astromech') this.drawAstromech(c, m, a);
      else if (m.b === 'hutt') this.drawHutt(c, m, a);
      else this.drawHumanoid(c, m, a, hs, ws);
      this.gl.uniform1f(this.loc.uFlash, 0);
      if (K.hasEffect(c, 'stun') && !c.dead) {
        for (let i = 0; i < 3; i++) {
          const an = this.time * 3 + i * 2.1;
          st.reset(); st.t(c.x + Math.cos(an) * 0.35, 2.05 * hs, c.z + Math.sin(an) * 0.35).s(0.1, 0.1, 0.1);
          this.draw(this.cube, '#ffe060', 1);
        }
      }
      if (K.hasEffect(c, 'shield') && !c.dead) {
        this.gl.enable(this.gl.BLEND); this.gl.depthMask(false);
        st.reset(); st.t(c.x, 0.95 * hs, c.z).s(1.1 * ws, 2.0 * hs, 1.1 * ws);
        this.draw(this.sph, '#60a0ff', 1, 0.18 + Math.sin(this.time * 6) * 0.05);
        this.gl.depthMask(true); this.gl.disable(this.gl.BLEND);
      }
    }

    limbAngles(c, a) {
      const moving = c.moving && !c.dead;
      const ph = c.walkPh || 0;
      const sw = moving ? Math.sin(ph * 1.6) * 0.7 : 0;
      const r = { legL: sw, legR: -sw, armL: -sw * 0.8, armR: sw * 0.8, bob: moving ? Math.abs(Math.sin(ph * 1.6)) * 0.05 : Math.sin(this.time * 2 + c.uid) * 0.012, torso: 0, armLz: 0.08, armRz: -0.08, head: 0 };
      const t = a.t;
      const w = c.equip && c.equip.r ? K.ITEMS[c.equip.r] : null;
      const ranged = w && w.wt === 'ranged';
      const inCombat = c.faction === 'hostile' ? c.aggro : (c.target != null);
      if (ranged && (inCombat || a.a === 'shoot') && !moving) { r.armR = -1.45; if (w.two) { r.armL = -1.3; r.armLz = -0.45; } }
      if (a.a === 'shoot') {
        const n = a.n || 1, gap = a.gap || 0.3;
        for (let i = 0; i < n; i++) { const tt = t - 0.18 - i * gap; if (tt > 0 && tt < 0.12) { r.armR = -1.45 - 0.25 * (1 - tt / 0.12); if (K.isDual(c) && i % 2 === 1) { r.armL = -1.7; } } }
        if (K.isDual(c) && t < (n * gap + 0.3)) r.armL = -1.45;
      } else if (a.a === 'swing') {
        const n = a.n || 1, gap = a.gap || 0.42;
        const i = Math.min(n - 1, Math.floor(t / gap));
        const tt = (t - i * gap) / gap;
        if (t < n * gap + 0.2) {
          const k = tt < 0.35 ? tt / 0.35 : 1 - Math.min(1, (tt - 0.35) / 0.65) * 0.0;
          const sw2 = tt < 0.35 ? -2.6 * k : -2.6 + Math.min(1, (tt - 0.35) / 0.25) * 2.4;
          r.armR = sw2;
          r.armRz = i % 2 ? 0.6 : -0.5;
          r.torso = (i % 2 ? -0.25 : 0.25) * Math.sin(tt * Math.PI);
          if (w && (w.two || w.dbl)) { r.armL = sw2 * 0.9; r.armLz = -0.5; }
        }
      } else if (a.a === 'cast' && t < 0.9) { r.armL = r.armR = -1.4 - Math.sin(t * 6) * 0.2; r.armLz = -0.3; r.armRz = 0.3; }
      else if (a.a === 'throw' && t < 0.6) { r.armR = t < 0.25 ? -2.8 * (t / 0.25) : -2.8 + (t - 0.25) / 0.35 * 2.2; }
      else if (a.a === 'use' && t < 0.8) { r.armR = -1.0; r.armL = -1.0; }
      else if (a.a === 'hit' && t < 0.25) { r.torso = -0.2 * (1 - t / 0.25); }
      else if (a.a === 'eat') { r.armL = r.armR = -1.2 - Math.sin(t * 10) * 0.4; r.torso = 0.4; }
      return r;
    }

    drawHumanoid(c, m, a, hs, ws) {
      const st = this.st;
      const r = this.limbAngles(c, a);
      const b = m.b;
      const P = {
        human: { leg: 0.92, hip: 0.1, tw: 0.46, th: 0.6, td: 0.26, arm: 0.66, head: 0.26, hunch: 0 },
        twilek: { leg: 0.9, hip: 0.1, tw: 0.42, th: 0.58, td: 0.24, arm: 0.64, head: 0.25, hunch: 0 },
        wookiee: { leg: 0.95, hip: 0.12, tw: 0.56, th: 0.66, td: 0.32, arm: 0.74, head: 0.3, hunch: 0 },
        rodian: { leg: 0.9, hip: 0.1, tw: 0.42, th: 0.58, td: 0.24, arm: 0.64, head: 0.3, hunch: 0 },
        duros: { leg: 0.94, hip: 0.1, tw: 0.44, th: 0.6, td: 0.24, arm: 0.68, head: 0.32, hunch: 0 },
        gamorrean: { leg: 0.66, hip: 0.14, tw: 0.66, th: 0.66, td: 0.46, arm: 0.66, head: 0.36, hunch: 0.15 },
        rakghoul: { leg: 0.8, hip: 0.1, tw: 0.4, th: 0.56, td: 0.26, arm: 0.86, head: 0.28, hunch: 0.5 },
        rancor: { leg: 0.5, hip: 0.12, tw: 0.6, th: 0.46, td: 0.4, arm: 0.62, head: 0.3, hunch: 0.55 },
        droid: { leg: 0.92, hip: 0.09, tw: 0.36, th: 0.54, td: 0.2, arm: 0.66, head: 0.22, hunch: 0 }
      }[b] || { leg: 0.92, hip: 0.1, tw: 0.46, th: 0.6, td: 0.26, arm: 0.66, head: 0.26, hunch: 0 };
      const fem = m.fem ? 0.9 : 1;
      const scale = b === 'rancor' ? (m.h || 3) / 1.9 : 1;
      st.push();
      if (b === 'rancor') st.s(scale, scale, scale); else st.s(ws, hs, ws);
      const skin = m.skin || '#c89070', top = m.top || '#606060', bot = m.bot || '#404040';
      const hipY = P.leg + r.bob;
      const body = c.equip && c.equip.body && K.ITEMS[c.equip.body];
      const armorCol = body && body.col && c.faction === 'party' && !m.robe ? body.col : top;
      for (const side of [-1, 1]) {
        st.push();
        st.t(side * P.hip, hipY, 0).rx(side < 0 ? r.legL : r.legR).t(0, -P.leg / 2, 0);
        this.part(0, 0, 0, 0.19 * (b === 'gamorrean' || b === 'rancor' ? 1.6 : 1), P.leg, 0.21 * (b === 'rancor' ? 1.6 : 1), b === 'wookiee' || b === 'rakghoul' || b === 'rancor' ? skin : bot);
        this.part(0, -P.leg / 2 + 0.05, 0.05, 0.2 * (b === 'rancor' ? 1.8 : 1), 0.1, 0.3, b === 'droid' ? top : b === 'rakghoul' || b === 'rancor' || b === 'wookiee' ? shade(rgb(skin), 0.7) : '#2a2622');
        st.pop();
      }
      st.push();
      st.t(0, hipY, 0).rx(P.hunch + r.torso * 0.3).ry(r.torso);
      const tw = P.tw * fem;
      this.part(0, P.th / 2, 0, tw, P.th, P.td, b === 'rakghoul' || b === 'rancor' || b === 'wookiee' ? skin : armorCol);
      if (m.vest) this.part(0, P.th * 0.55, 0.02, tw * 1.04, P.th * 0.6, P.td * 1.06, m.vest);
      if (b === 'droid') this.part(0, P.th * 0.5, P.td * 0.52, tw * 0.5, 0.12, 0.02, m.trim || '#c02020', 0.8);
      if (m.robe) this.part(0, -0.35, 0, tw * 1.15, 0.75, P.td * 1.3, bot);
      if (m.ragged) this.part(0, -0.15, 0, tw * 1.08, 0.3, P.td * 1.1, top);
      if (m.cape) this.part(0, P.th * 0.1, -P.td * 0.62, tw * 1.1, P.th * 1.8, 0.05, m.cape);
      if (b === 'gamorrean') this.part(0, P.th * 0.2, 0.05, tw * 1.1, P.th * 0.5, P.td * 1.15, skin);
      const shY = P.th - 0.05;
      const armCol = b === 'rakghoul' || b === 'rancor' || b === 'wookiee' || b === 'gamorrean' ? skin : armorCol;
      const w = c.equip && c.equip.r ? K.ITEMS[c.equip.r] : null;
      const wl = c.equip && c.equip.l ? K.ITEMS[c.equip.l] : null;
      for (const side of [-1, 1]) {
        st.push();
        st.t(side * (tw / 2 + 0.07), shY, 0).rx(side < 0 ? r.armL : r.armR).rz(side < 0 ? r.armLz : r.armRz).t(0, -P.arm / 2, 0);
        this.part(0, 0, 0, 0.14 * (b === 'rancor' ? 1.8 : b === 'gamorrean' ? 1.3 : 1), P.arm, 0.15 * (b === 'rancor' ? 1.6 : 1), armCol);
        this.part(0, -P.arm / 2 - 0.04, 0, 0.12, 0.1, 0.12, b === 'droid' ? top : skin);
        if (b === 'rakghoul' || b === 'rancor') for (let k = -1; k <= 1; k++) this.part(k * 0.04, -P.arm / 2 - 0.14, 0.04, 0.025, 0.14, 0.025, '#e0d8c0');
        const wi = side > 0 ? w : wl;
        if (wi && !wi.natural && b !== 'rakghoul' && b !== 'rancor') {
          st.push();
          st.t(0, -P.arm / 2 - 0.05, 0);
          this.drawWeapon(wi, side);
          st.pop();
        }
        st.pop();
      }
      st.push();
      st.t(0, P.th + P.head * 0.55, b === 'rakghoul' ? 0.08 : 0).ry(r.head);
      this.drawHead(b, m, P.head, c);
      st.pop();
      st.pop();
      st.pop();
    }

    drawHead(b, m, hsz, c) {
      const skin = m.skin || '#c89070';
      if (b === 'droid') {
        this.part(0, 0, 0, hsz, hsz, hsz, m.top);
        this.part(0, 0.02, hsz / 2, hsz * 0.7, 0.05, 0.02, m.trim || '#ff2020', 1);
        return;
      }
      if (m.helm) {
        this.part(0, 0.02, 0, hsz * 1.1, hsz * 1.12, hsz * 1.12, m.top);
        this.part(0, 0.0, hsz * 0.56, hsz * 0.8, hsz * 0.3, 0.02, m.mask || '#101014', m.mask ? 0 : 0.2);
        if (m.mask) this.part(0, -0.05, hsz * 0.58, hsz * 0.5, hsz * 0.15, 0.03, '#303030');
        return;
      }
      if (b === 'rodian') {
        this.ball(0, 0.02, 0, hsz * 1.05, hsz * 1.2, hsz * 1.05, skin);
        for (const s of [-1, 1]) this.ball(s * hsz * 0.28, 0.05, hsz * 0.38, hsz * 0.34, hsz * 0.42, hsz * 0.25, '#101018', 0.1);
        this.part(0, -hsz * 0.25, hsz * 0.5, hsz * 0.18, hsz * 0.18, hsz * 0.3, skin);
        return;
      }
      if (b === 'duros') {
        this.ball(0, 0.05, 0, hsz * 1.1, hsz * 1.2, hsz * 1.0, skin);
        for (const s of [-1, 1]) this.part(s * hsz * 0.22, 0.04, hsz * 0.48, hsz * 0.18, hsz * 0.1, 0.02, '#ff3020', 0.9);
        return;
      }
      if (b === 'gamorrean') {
        this.part(0, 0, 0, hsz, hsz * 0.9, hsz, skin);
        this.part(0, -hsz * 0.15, hsz * 0.55, hsz * 0.45, hsz * 0.35, hsz * 0.25, shade(rgb(skin), 1.15));
        for (const s of [-1, 1]) { this.part(s * hsz * 0.28, -hsz * 0.25, hsz * 0.6, 0.04, 0.12, 0.04, '#f0e8d0'); this.part(s * hsz * 0.42, hsz * 0.45, 0, 0.08, 0.14, 0.05, skin); }
        return;
      }
      if (b === 'rakghoul') {
        this.part(0, 0, 0.02, hsz, hsz, hsz * 1.1, skin);
        this.part(0, -hsz * 0.35, hsz * 0.3, hsz * 0.8, hsz * 0.3, hsz * 0.6, shade(rgb(skin), 0.8));
        for (const s of [-1, 1]) this.part(s * hsz * 0.22, hsz * 0.1, hsz * 0.56, 0.05, 0.04, 0.02, '#ffe040', 0.9);
        return;
      }
      if (b === 'rancor') {
        this.part(0, 0, 0.1, hsz * 1.3, hsz, hsz * 1.4, skin);
        this.part(0, -hsz * 0.55, hsz * 0.3, hsz * 1.2, hsz * 0.35, hsz * 1.2, shade(rgb(skin), 0.75));
        for (let k = -2; k <= 2; k++) this.part(k * hsz * 0.2, -hsz * 0.3, hsz * 0.85, 0.05, 0.1, 0.05, '#f0e8d0');
        for (const s of [-1, 1]) this.part(s * hsz * 0.4, hsz * 0.15, hsz * 0.8, 0.06, 0.04, 0.02, '#ff8020', 0.8);
        return;
      }
      if (b === 'wookiee') {
        this.part(0, 0.03, 0, hsz, hsz * 1.2, hsz, skin);
        this.part(0, -0.05, hsz * 0.5, hsz * 0.5, hsz * 0.4, hsz * 0.15, shade(rgb(skin), 0.75));
        for (const s of [-1, 1]) this.part(s * hsz * 0.22, hsz * 0.15, hsz * 0.51, 0.05, 0.03, 0.02, '#202020');
        return;
      }
      this.part(0, 0, 0, hsz * 0.92, hsz * 1.05, hsz, skin);
      for (const s of [-1, 1]) this.part(s * hsz * 0.2, hsz * 0.05, hsz * 0.51, 0.045, 0.03, 0.02, '#1a1410');
      if (m.beard) this.part(0, -hsz * 0.35, hsz * 0.4, hsz * 0.8, hsz * 0.4, hsz * 0.3, m.beard);
      if (m.glasses) this.part(0, hsz * 0.05, hsz * 0.53, hsz * 0.8, 0.07, 0.02, '#202830', 0.2);
      if (b === 'twilek') {
        this.part(0, hsz * 0.1, 0, hsz * 0.95, hsz * 1.1, hsz * 1.02, skin);
        for (const s of [-1, 1]) { this.st.push(); this.st.t(s * hsz * 0.18, hsz * 0.2, -hsz * 0.45).rx(0.25); this.part(0, -hsz * 0.8, 0, hsz * 0.24, hsz * 1.9, hsz * 0.22, skin); this.st.pop(); }
        if (m.fem) this.part(0, hsz * 0.52, 0, hsz * 0.98, 0.07, hsz * 1.04, m.top);
        return;
      }
      if (m.cap) { this.part(0, hsz * 0.5, 0, hsz * 1.02, hsz * 0.25, hsz * 1.08, m.cap); this.part(0, hsz * 0.45, hsz * 0.55, hsz * 0.9, 0.04, hsz * 0.25, '#1a1a1a'); return; }
      const hair = m.hair;
      if (hair) {
        this.part(0, hsz * 0.48, -0.01, hsz * 0.98, hsz * 0.18, hsz * 1.04, hair);
        this.part(0, hsz * 0.1, -hsz * 0.47, hsz * 0.98, hsz * 0.75, hsz * 0.12, hair);
        if (m.fem) this.part(0, -hsz * 0.4, -hsz * 0.45, hsz * 0.9, hsz * 0.9, hsz * 0.18, hair);
        if (c && c.tpl === 'bastila') { this.part(0, hsz * 0.6, -hsz * 0.35, hsz * 0.5, hsz * 0.3, hsz * 0.4, hair); }
      }
    }

    drawWeapon(w, side) {
      const s = this.st;
      if (w.wt === 'ranged') {
        const len = w.two ? (w.heavy ? 0.85 : 0.7) : 0.32;
        this.part(0, -len / 2 + 0.05, 0.03, w.two ? 0.09 : 0.07, len, 0.12, w.col || '#404850');
        this.part(0, -len + 0.03, 0.03, 0.05, 0.06, 0.05, '#202020');
        if (w.two) this.part(0, -0.02, -0.08, 0.06, 0.08, 0.18, shade(rgb(w.col || '#404850'), 0.7));
        return;
      }
      const len = w.len || 0.8;
      s.push();
      s.rx(Math.PI / 2);
      if (w.saber) {
        this.part(0, 0.05, 0, 0.07, 0.24, 0.07, '#a0a0a8');
        this.part(0, 0.17 + len / 2, 0, 0.05, len, 0.05, w.col, 1);
        this.part(0, 0.17 + len / 2, 0, 0.09, len + 0.04, 0.09, w.col, 0.6);
        if (w.dbl) { this.part(0, -0.07 - len / 2, 0, 0.05, len, 0.05, w.col, 1); this.part(0, -0.07 - len / 2, 0, 0.09, len + 0.04, 0.09, w.col, 0.6); }
      } else {
        this.part(0, 0.0, 0, 0.06, 0.18, 0.06, '#3a3028');
        this.part(0, 0.1, 0, 0.2, 0.04, 0.08, '#606060');
        this.part(0, 0.12 + len / 2, 0, 0.035, len, 0.1, w.col || '#b0b8c0', w.id && /vibro/.test(w.id) ? 0.25 : 0);
        if (w.dbl) this.part(0, -0.12 - len / 2, 0, 0.035, len, 0.1, w.col || '#b0b8c0', 0.25);
      }
      s.pop();
    }

    drawAstromech(c, m, a) {
      const st = this.st;
      st.push();
      const bob = c.moving ? Math.sin((c.walkPh || 0) * 3) * 0.02 : 0;
      st.t(0, bob, 0);
      st.push(); st.t(0, 0.55, 0).s(0.5, 0.7, 0.5); this.draw(this.cylM, m.top); st.pop();
      st.push(); st.t(0, 0.9, 0).s(0.5, 0.36, 0.5); this.draw(this.sph, '#b0b0b8'); st.pop();
      this.part(0, 0.95, 0.22, 0.12, 0.1, 0.04, '#3080ff', 0.8 + Math.sin(this.time * 5) * 0.2);
      this.part(0, 0.55, 0.25, 0.3, 0.3, 0.02, m.trim || '#3060a0');
      for (const s of [-1, 1]) { this.part(s * 0.3, 0.45, 0, 0.1, 0.9, 0.18, m.bot); this.part(s * 0.3, 0.03, 0.05, 0.14, 0.06, 0.3, '#303030'); }
      if (a.a === 'shoot' && a.t < 0.5) this.part(0, 0.7, 0.3, 0.06, 0.06, 0.2, '#ff6040', 1);
      st.pop();
    }

    drawHutt(c, m, a) {
      const skin = m.skin;
      const breath = Math.sin(this.time * 1.5) * 0.03;
      this.part(0, 0.35, -0.6, 1.3, 0.7, 1.6, skin);
      this.part(0, 0.3, -1.5, 0.8, 0.5, 0.8, shade(rgb(skin), 0.9));
      this.part(0, 0.9 + breath, 0, 1.2, 0.9, 1.0, skin);
      this.part(0, 1.5 + breath, 0.1, 0.9, 0.55, 0.8, skin);
      this.part(0, 1.95 + breath, 0.2, 0.8, 0.5, 0.7, skin);
      this.part(0, 1.8 + breath, 0.57, 0.7, 0.08, 0.02, '#4a3020');
      for (const s of [-1, 1]) { this.part(s * 0.22, 2.05 + breath, 0.56, 0.1, 0.08, 0.02, '#e0a020', 0.6); this.part(s * 0.55, 1.45, 0.35, 0.18, 0.18, 0.45, skin); }
    }

    drawFx(game, dt) {
      const gl = this.gl;
      for (let i = this.bolts.length - 1; i >= 0; i--) {
        const b = this.bolts[i];
        b.t += dt;
        if (b.t < 0) continue;
        const k = b.t / b.dur;
        if (k >= 1) { this.bolts.splice(i, 1); if (!b.miss) this.spark(b.x1, b.y1, b.z1, b.c, 5); continue; }
        b.x = b.x0 + (b.x1 - b.x0) * k; b.y = b.y0 + (b.y1 - b.y0) * k; b.z = b.z0 + (b.z1 - b.z0) * k;
        const ang = Math.atan2(b.x1 - b.x0, b.z1 - b.z0);
        this.st.reset(); this.st.t(b.x, b.y, b.z).ry(ang).s(0.07, 0.07, 0.7);
        this.draw(this.cube, b.c, 1);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.depthMask(false);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) { this.particles.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy -= (p.g || 0) * dt;
        if (p.y < 0.02 && p.g) { p.y = 0.02; p.vy *= -0.3; }
        const k = p.life / p.max;
        const s = p.s * (p.grow ? (1 + (1 - k) * p.grow) : 1);
        this.st.reset(); this.st.t(p.x, p.y, p.z).s(s, s, s);
        this.draw(p.sph ? this.sph : this.cube, p.c, 1, Math.min(1, k * 1.5));
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    spark(x, y, z, c, n) {
      for (let i = 0; i < n; i++) this.particles.push({ x, y, z, vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 4, g: 9, life: 0.3, max: 0.3, s: 0.05, c: rgb(c) });
    }

    onEvent(e, game) {
      const byUid = u => game.creatures.find(c => c.uid === u);
      if (e.type === 'bolt') {
        const a = byUid(e.from), b = byUid(e.to);
        if (!a || !b) return;
        const fx = Math.sin(a.ang), fz = Math.cos(a.ang);
        const hs = (a.model.h || 1);
        const x0 = a.x + fx * 0.55, y0 = 1.35 * hs * (a.model.b === 'astromech' ? 0.5 : 1), z0 = a.z + fz * 0.55;
        let x1 = b.x, y1 = 1.1 * (b.model.h || 1), z1 = b.z;
        if (e.miss) { x1 += (Math.random() - 0.5) * 1.4; y1 += (Math.random() - 0.2) * 0.8; z1 += (Math.random() - 0.5) * 1.4; }
        const d = Math.hypot(x1 - x0, z1 - z0);
        this.bolts.push({ x0, y0, z0, x1, y1, z1, x: x0, y: y0, z: z0, t: -(e.delay || 0), dur: Math.max(0.06, d / 38), c: rgb(e.col || '#ff4030'), miss: e.miss });
      } else if (e.type === 'fx') {
        if (e.kind === 'explosion') {
          this.particles.push({ x: e.x, y: 0.8, z: e.z, vx: 0, vy: 0, vz: 0, life: 0.5, max: 0.5, s: 1.2, grow: 2.2, c: rgb('#ffa040'), sph: true, light: 12 });
          for (let i = 0; i < 26; i++) this.particles.push({ x: e.x, y: 0.5, z: e.z, vx: (Math.random() - 0.5) * 9, vy: Math.random() * 7, vz: (Math.random() - 0.5) * 9, g: 12, life: 0.8, max: 0.8, s: 0.1 + Math.random() * 0.1, c: rgb(Math.random() > 0.5 ? '#ffd060' : '#ff6020') });
          for (let i = 0; i < 8; i++) this.particles.push({ x: e.x + (Math.random() - 0.5), y: 1, z: e.z + (Math.random() - 0.5), vx: 0, vy: 1.2, vz: 0, life: 1.6, max: 1.6, s: 0.5, grow: 1.5, c: [0.25, 0.22, 0.2], sph: true });
          this.rings.push({ x: e.x, z: e.z, r0: 0.3, r1: 3.2, t: 0, max: 0.4, c: '#ffa040' });
        } else if (e.kind === 'heal') {
          for (let i = 0; i < 14; i++) this.particles.push({ x: e.x + (Math.random() - 0.5) * 0.7, y: 0.2 + Math.random(), z: e.z + (Math.random() - 0.5) * 0.7, vx: 0, vy: 1.3, vz: 0, life: 0.9, max: 0.9, s: 0.07, c: rgb('#60ff80') });
        } else if (e.kind === 'force') {
          this.rings.push({ x: e.x, z: e.z, r0: 0.2, r1: 2.2, t: 0, max: 0.5, c: '#80c0ff' });
          for (let i = 0; i < 12; i++) this.particles.push({ x: e.x, y: 1, z: e.z, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.3) * 2, vz: (Math.random() - 0.5) * 3, life: 0.6, max: 0.6, s: 0.08, c: rgb('#a0d0ff'), light: 4 });
        } else if (e.kind === 'stun' || e.kind === 'ion') {
          const col = e.kind === 'ion' ? '#60a0ff' : '#ffe060';
          this.rings.push({ x: e.x, z: e.z, r0: 0.3, r1: 2.8, t: 0, max: 0.45, c: col });
          for (let i = 0; i < 20; i++) this.particles.push({ x: e.x, y: 0.6, z: e.z, vx: (Math.random() - 0.5) * 6, vy: Math.random() * 3, vz: (Math.random() - 0.5) * 6, life: 0.6, max: 0.6, s: 0.08, c: rgb(col), light: 6 });
        }
      } else if (e.type === 'grenade') {
        const a = byUid(e.from);
        if (!a) return;
        const x0 = a.x, z0 = a.z;
        const n = 10;
        for (let i = 0; i < n; i++) {
          const k = i / n;
          this.particles.push({ x: x0 + (e.x - x0) * k, y: 1.2 + Math.sin(k * Math.PI) * 2, z: z0 + (e.z - z0) * k, vx: 0, vy: 0, vz: 0, life: 0.05 + k * 0.7, max: 0.75, s: 0.05, c: rgb('#c0c0c0') });
        }
      } else if (e.type === 'shake') this.cam.shake = Math.max(this.cam.shake, e.v * 0.6);
      else if (e.type === 'area' || e.type === 'tiles') { this.static = null; if (e.type === 'area') { this.cam.tx = null; this.particles = []; this.bolts = []; this.rings = []; } }
      else if (e.type === 'moveMark') this.rings.push({ x: e.x, z: e.z, r0: 0.8, r1: 0.1, t: 0, max: 0.4, c: '#60ff80' });
    }

    project(x, y, z) {
      const m = this.vp;
      if (!m) return null;
      const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
      const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
      const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (cw <= 0.05) return null;
      return [(cx / cw * 0.5 + 0.5) * this.canvas.width, (1 - (cy / cw * 0.5 + 0.5)) * this.canvas.height, cw];
    }

    ray(sx, sy) {
      const nx = sx / this.canvas.width * 2 - 1, ny = 1 - sy / this.canvas.height * 2;
      const u = (x, y, z, w) => { const m = this.ivp; const X = m[0] * x + m[4] * y + m[8] * z + m[12] * w, Y = m[1] * x + m[5] * y + m[9] * z + m[13] * w, Z = m[2] * x + m[6] * y + m[10] * z + m[14] * w, W = m[3] * x + m[7] * y + m[11] * z + m[15] * w; return [X / W, Y / W, Z / W]; };
      const a = u(nx, ny, -1, 1), b = u(nx, ny, 1, 1);
      const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const l = Math.hypot(...d);
      return { o: a, d: d.map(v => v / l) };
    }

    pick(game, sx, sy) {
      if (!this.ivp) return null;
      const r = this.ray(sx, sy);
      let best = null, bt = 1e9;
      const testCyl = (x, z, rad, h, obj) => {
        const ox = r.o[0] - x, oz = r.o[2] - z;
        const a = r.d[0] ** 2 + r.d[2] ** 2, b = 2 * (ox * r.d[0] + oz * r.d[2]), c = ox * ox + oz * oz - rad * rad;
        const disc = b * b - 4 * a * c;
        if (disc < 0) return;
        const t = (-b - Math.sqrt(disc)) / (2 * a);
        const y = r.o[1] + r.d[1] * t;
        if (t > 0 && t < bt && y >= -0.2 && y <= h) { bt = t; best = obj; }
      };
      for (const c of game.creatures) {
        if (c.dead && !c.loot) continue;
        if (c.dead) continue;
        const h = c.big ? 3 : c.model.b === 'astromech' ? 1.1 : 1.9 * (c.model.h || 1);
        testCyl(c.x, c.z, c.radius + 0.25, h, c);
      }
      for (const o of game.objects) {
        if (o.type === 'trig' || (o.type === 'mine' && !o.found)) continue;
        testCyl(o.x, o.z, 0.6, o.type === 'exit' ? 2.6 : 1.3, o);
      }
      for (const d of game.doors) if (!d.open) testCyl(d.x + 0.5, d.z + 0.5, 0.6, 2.6, Object.assign(d, { type: 'door' }));
      if (r.d[1] < 0) {
        const t = -r.o[1] / r.d[1];
        if (t < bt) return { ground: true, x: r.o[0] + r.d[0] * t, z: r.o[2] + r.d[2] * t };
      }
      return best;
    }
  }

  K.Renderer = Renderer;
  K.m4 = m4;
})(globalThis.Kotor98 = globalThis.Kotor98 || {});
