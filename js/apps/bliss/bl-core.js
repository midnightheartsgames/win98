(function (B) {
  'use strict';
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (a, b, x) => {
    const t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const wrapAngle = (a) => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  };

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const v3 = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    scale: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
  };

  function cameraBasis(yaw, pitch, roll) {
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const f = [-Math.sin(yaw) * cp, sp, -Math.cos(yaw) * cp];
    const r0 = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const u0 = v3.cross(r0, f);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const r = [r0[0] * cr + u0[0] * sr, r0[1] * cr + u0[1] * sr, r0[2] * cr + u0[2] * sr];
    const u = [u0[0] * cr - r0[0] * sr, u0[1] * cr - r0[1] * sr, u0[2] * cr - r0[2] * sr];
    return { f, r, u };
  }

  function makeCamera(pos, yaw, pitch, roll, fovY, aspect, near = 0.6, far = 30000) {
    const { f, r, u } = cameraBasis(yaw, pitch, roll);
    const view = new Float32Array([
      r[0], u[0], -f[0], 0,
      r[1], u[1], -f[1], 0,
      r[2], u[2], -f[2], 0,
      -v3.dot(r, pos), -v3.dot(u, pos), v3.dot(f, pos), 1,
    ]);
    const t = 1 / Math.tan(fovY / 2);
    const proj = new Float32Array([
      t / aspect, 0, 0, 0,
      0, t, 0, 0,
      0, 0, (far + near) / (near - far), -1,
      0, 0, (2 * far * near) / (near - far), 0,
    ]);
    const viewProj = mat4mul(proj, view);
    return { pos: pos.slice(), f, r, u, fovY, aspect, near, far, view, proj, viewProj,
      tanY: Math.tan(fovY / 2), tanX: Math.tan(fovY / 2) * aspect, planes: frustumPlanes(viewProj) };
  }

  function mat4mul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++)
      for (let rr = 0; rr < 4; rr++) {
        let s = 0;
        for (let k = 0; k < 4; k++) s += a[k * 4 + rr] * b[c * 4 + k];
        o[c * 4 + rr] = s;
      }
    return o;
  }

  function frustumPlanes(m) {
    const row = (i) => [m[i], m[4 + i], m[8 + i], m[12 + i]];
    const r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
    const planes = [];
    for (const [a, s] of [[r0, 1], [r0, -1], [r1, 1], [r1, -1], [r2, 1], [r2, -1]]) {
      const p = [r3[0] + s * a[0], r3[1] + s * a[1], r3[2] + s * a[2], r3[3] + s * a[3]];
      const l = Math.hypot(p[0], p[1], p[2]);
      planes.push([p[0] / l, p[1] / l, p[2] / l, p[3] / l]);
    }
    return planes;
  }
  function sphereVisible(planes, x, y, z, rad) {
    for (const p of planes) if (p[0] * x + p[1] * y + p[2] * z + p[3] < -rad) return false;
    return true;
  }

  const Noise = (() => {
    const rnd = mulberry32(1337);
    const perm = new Uint8Array(512);
    const p = Array.from({ length: 256 }, (_, i) => i);
    for (let i = 255; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
    for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    const gx = new Float32Array(256), gy = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const a = rnd() * Math.PI * 2; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
    const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    function n2(x, y) {
      const xi = Math.floor(x), yi = Math.floor(y);
      const xf = x - xi, yf = y - yi;
      const X = xi & 255, Y = yi & 255;
      const g = (ix, iy, dx, dy) => { const h = perm[ix + perm[iy]]; return gx[h] * dx + gy[h] * dy; };
      const u = fade(xf), v = fade(yf);
      const a = g(X, Y, xf, yf), b = g(X + 1, Y, xf - 1, yf);
      const c = g(X, Y + 1, xf, yf - 1), d = g(X + 1, Y + 1, xf - 1, yf - 1);
      return 1.41 * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v);
    }
    function fbm(x, y, oct) {
      let s = 0, amp = 0.5, f = 1, norm = 0;
      for (let i = 0; i < oct; i++) { s += amp * n2(x * f, y * f); norm += amp; amp *= 0.5; f *= 2.03; }
      return s / norm;
    }
    function ridged(x, y, oct) {
      let s = 0, amp = 0.5, f = 1, norm = 0;
      for (let i = 0; i < oct; i++) { const n = 1 - Math.abs(n2(x * f, y * f)); s += amp * n * n; norm += amp; amp *= 0.5; f *= 2.1; }
      return s / norm;
    }
    return { n2, fbm, ridged };
  })();

  class Program {
    constructor(gl, vs, fs, name) {
      this.gl = gl;
      const sh = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(s);
          const lines = src.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n');
          console.error(`[${name}] shader error:\n${log}\n${lines}`);
          throw new Error(`Shader ${name}: ${log}`);
        }
        return s;
      };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`Link ${name}: ${gl.getProgramInfoLog(p)}`);
      this.p = p;
      this.u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(p, i);
        const key = info.name.replace(/\[0\]$/, '');
        this.u[key] = { loc: gl.getUniformLocation(p, info.name), type: info.type, size: info.size };
      }
    }
    use() { this.gl.useProgram(this.p); return this; }
    set(name, v) {
      const u = this.u[name];
      if (!u) return this;
      const gl = this.gl, l = u.loc;
      switch (u.type) {
        case gl.FLOAT: u.size > 1 ? gl.uniform1fv(l, v) : gl.uniform1f(l, v); break;
        case gl.FLOAT_VEC2: gl.uniform2fv(l, v); break;
        case gl.FLOAT_VEC3: gl.uniform3fv(l, v); break;
        case gl.FLOAT_VEC4: gl.uniform4fv(l, v); break;
        case gl.FLOAT_MAT4: gl.uniformMatrix4fv(l, false, v); break;
        case gl.INT: case gl.SAMPLER_2D: case gl.BOOL: gl.uniform1i(l, v); break;
        default: console.warn('uniform type', name, u.type);
      }
      return this;
    }
    setAll(obj) { for (const k in obj) this.set(k, obj[k]); return this; }
  }

  function makeBuffer(gl, data, target = gl.ARRAY_BUFFER, usage = gl.STATIC_DRAW) {
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, usage);
    return b;
  }

  function makeVAO(gl, attrs, indexBuf) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    for (const a of attrs) {
      gl.bindBuffer(gl.ARRAY_BUFFER, a.buf);
      gl.enableVertexAttribArray(a.loc);
      gl.vertexAttribPointer(a.loc, a.size, a.type || gl.FLOAT, !!a.normalized, a.stride || 0, a.offset || 0);
      if (a.divisor) gl.vertexAttribDivisor(a.loc, a.divisor);
    }
    if (indexBuf) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuf);
    gl.bindVertexArray(null);
    return vao;
  }

  function makeTexture(gl, { w, h, internal, format, type, data, filter, wrap, mips }) {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data || null);
    const f = filter || gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, f);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap || gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap || gl.CLAMP_TO_EDGE);
    if (mips) gl.generateMipmap(gl.TEXTURE_2D);
    return t;
  }

  function icosphere(subdiv) {
    const t = (1 + Math.sqrt(5)) / 2;
    let verts = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
      [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v3.norm);
    let faces = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6],
      [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let s = 0; s < subdiv; s++) {
      const cache = new Map();
      const mid = (a, b) => {
        const key = a < b ? a + '_' + b : b + '_' + a;
        if (cache.has(key)) return cache.get(key);
        verts.push(v3.norm(v3.scale(v3.add(verts[a], verts[b]), 0.5)));
        cache.set(key, verts.length - 1);
        return verts.length - 1;
      };
      const nf = [];
      for (const [a, b, c] of faces) {
        const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
        nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
      }
      faces = nf;
    }
    return { pos: new Float32Array(verts.flat()), idx: new Uint16Array(faces.flat()) };
  }

  Object.assign(B, { clamp, lerp, smoothstep, wrapAngle, mulberry32, v3, cameraBasis, makeCamera, sphereVisible, Noise, Program, makeBuffer, makeVAO, makeTexture, icosphere });
})(globalThis.Bliss = globalThis.Bliss || {});
