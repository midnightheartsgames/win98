(function (X) {
  'use strict';
  const STRIDE = 11;

  class Mesh {
    constructor(cap) {
      this.v = new Float32Array((cap || 1024) * STRIDE);
      this.idx = new Uint32Array((cap || 1024) * 2);
      this.n = 0; this.ni = 0;
      this.min = [Infinity, Infinity, Infinity]; this.max = [-Infinity, -Infinity, -Infinity];
    }
    grow(nv, ni) {
      if ((this.n + nv) * STRIDE > this.v.length) {
        const a = new Float32Array(Math.max(this.v.length * 2, (this.n + nv) * STRIDE * 1.5 | 0));
        a.set(this.v.subarray(0, this.n * STRIDE)); this.v = a;
      }
      if (this.ni + ni > this.idx.length) {
        const b = new Uint32Array(Math.max(this.idx.length * 2, (this.ni + ni) * 1.5 | 0));
        b.set(this.idx.subarray(0, this.ni)); this.idx = b;
      }
    }
    vert(x, y, z, nx, ny, nz, u, v, r, g, b) {
      const o = this.n * STRIDE, a = this.v;
      a[o] = x; a[o + 1] = y; a[o + 2] = z; a[o + 3] = nx; a[o + 4] = ny; a[o + 5] = nz; a[o + 6] = u; a[o + 7] = v; a[o + 8] = r; a[o + 9] = g; a[o + 10] = b;
      if (x < this.min[0]) this.min[0] = x; if (y < this.min[1]) this.min[1] = y; if (z < this.min[2]) this.min[2] = z;
      if (x > this.max[0]) this.max[0] = x; if (y > this.max[1]) this.max[1] = y; if (z > this.max[2]) this.max[2] = z;
      return this.n++;
    }
    tri(a, b, c) { const i = this.idx; i[this.ni++] = a; i[this.ni++] = b; i[this.ni++] = c; }
    quadPts(p, n, uv, col) {
      this.grow(4, 6);
      const c = col || [1, 1, 1];
      const s = this.n;
      for (let k = 0; k < 4; k++) this.vert(p[k][0], p[k][1], p[k][2], n[0], n[1], n[2], uv[k][0], uv[k][1], c[0], c[1], c[2]);
      this.tri(s, s + 1, s + 2); this.tri(s, s + 2, s + 3);
    }
    triPts(p, n, uv, col) {
      this.grow(3, 3);
      const c = col || [1, 1, 1];
      const s = this.n;
      for (let k = 0; k < 3; k++) this.vert(p[k][0], p[k][1], p[k][2], n[0], n[1], n[2], uv[k][0], uv[k][1], c[0], c[1], c[2]);
      this.tri(s, s + 1, s + 2);
    }
    append(m, tf) {
      this.grow(m.n, m.ni);
      const base = this.n;
      const a = m.v;
      for (let i = 0; i < m.n; i++) {
        const o = i * STRIDE;
        let x = a[o], y = a[o + 1], z = a[o + 2], nx = a[o + 3], ny = a[o + 4], nz = a[o + 5];
        if (tf) {
          const p = X.M4.point(tf, [x, y, z]), q = X.M4.dir(tf, [nx, ny, nz]);
          x = p[0]; y = p[1]; z = p[2];
          const l = Math.hypot(q[0], q[1], q[2]) || 1; nx = q[0] / l; ny = q[1] / l; nz = q[2] / l;
        }
        this.vert(x, y, z, nx, ny, nz, a[o + 6], a[o + 7], a[o + 8], a[o + 9], a[o + 10]);
      }
      for (let i = 0; i < m.ni; i++) this.idx[this.ni++] = m.idx[i] + base;
    }
    tint(col, from) {
      for (let i = from || 0; i < this.n; i++) { const o = i * STRIDE + 8; this.v[o] *= col[0]; this.v[o + 1] *= col[1]; this.v[o + 2] *= col[2]; }
    }
  }
  Mesh.STRIDE = STRIDE;
  X.Mesh = Mesh;

  function nrm(a, b, c) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    return X.vnorm(X.vcross(u, v));
  }
  X.triNormal = nrm;

  const G = {};
  X.GL = G;

  G.box = function (m, cx, cy, cz, hx, hy, hz, yaw, uvs, col, faces, worldUV) {
    const c = Math.cos(yaw || 0), s = Math.sin(yaw || 0);
    const W = (lx, ly, lz) => [cx + lx * c + lz * s, cy + ly, cz - lx * s + lz * c];
    const us = uvs || 1;
    const wu = worldUV && !yaw;
    const F = [
      { n: [1, 0, 0], p: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], k: 'side', ax: 'x' },
      { n: [-1, 0, 0], p: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], k: 'side', ax: 'x' },
      { n: [0, 1, 0], p: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], k: 'top', ax: 'y' },
      { n: [0, -1, 0], p: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], k: 'bot', ax: 'y' },
      { n: [0, 0, 1], p: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], k: 'side', ax: 'z' },
      { n: [0, 0, -1], p: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], k: 'side', ax: 'z' }
    ];
    for (const f of F) {
      if (faces && !faces(f.k, f.n)) continue;
      const tm = faces && faces.target ? faces.target(f.k, f.n) : m;
      if (!tm) continue;
      const pts = f.p.map(q => W(q[0], q[1], q[2]));
      const n = [f.n[0] * c + f.n[2] * s, f.n[1], -f.n[0] * s + f.n[2] * c];
      const uv = f.p.map((q, i) => {
        const ox = wu ? cx : 0, oy = wu ? cy : 0, oz = wu ? cz : 0;
        const gx = (wu ? pts[i][0] : q[0] + ox), gy = (wu ? pts[i][1] : q[1] + oy), gz = (wu ? pts[i][2] : q[2] + oz);
        if (f.ax === 'y') return [gx / us, gz / us];
        if (f.ax === 'x') return [(f.n[0] > 0 ? -gz : gz) / us, -gy / us];
        return [(f.n[2] > 0 ? gx : -gx) / us, -gy / us];
      });
      tm.quadPts(pts, n, uv, col);
    }
  };

  G.cyl = function (m, x, y, z, r, r2, h, sides, uvs, col, cap, yaw) {
    const n = sides || 10, us = uvs || 1;
    const base = m.n;
    m.grow((n + 1) * 2 + (cap ? n * 2 + 2 : 0), n * 6 + (cap ? n * 6 : 0));
    const slope = (r - r2) / Math.max(h, 1e-3);
    const y0 = yaw || 0;
    for (let i = 0; i <= n; i++) {
      const a = y0 + i / n * X.TAU, ca = Math.cos(a), sa = Math.sin(a);
      const nn = X.vnorm([ca, slope, sa]);
      const u = i / n * X.TAU * Math.max(r, 0.05) / us;
      m.vert(x + ca * r, y, z + sa * r, nn[0], nn[1], nn[2], u, 0, col[0], col[1], col[2]);
      m.vert(x + ca * r2, y + h, z + sa * r2, nn[0], nn[1], nn[2], u, -h / us, col[0], col[1], col[2]);
    }
    for (let i = 0; i < n; i++) {
      const a = base + i * 2;
      m.tri(a, a + 1, a + 3); m.tri(a, a + 3, a + 2);
    }
    if (cap) {
      for (const [yy, rr, up] of [[y + h, r2, 1], [y, r, -1]]) {
        if (rr < 1e-3) continue;
        const c0 = m.vert(x, yy, z, 0, up, 0, x / us, z / us, col[0], col[1], col[2]);
        const s = m.n;
        for (let i = 0; i <= n; i++) {
          const a = y0 + i / n * X.TAU;
          m.vert(x + Math.cos(a) * rr, yy, z + Math.sin(a) * rr, 0, up, 0, (x + Math.cos(a) * rr) / us, (z + Math.sin(a) * rr) / us, col[0], col[1], col[2]);
        }
        for (let i = 0; i < n; i++) { if (up > 0) m.tri(c0, s + i + 1, s + i); else m.tri(c0, s + i, s + i + 1); }
      }
    }
  };

  G.sphere = function (m, x, y, z, r, seg, rings, uvs, col, sy, noise, seed) {
    const S = seg || 10, R = rings || 7, us = uvs || 1, k = sy || 1;
    const base = m.n;
    const rng = noise ? X.rng(seed || 1) : null;
    const jit = [];
    if (noise) for (let i = 0; i <= R; i++) { jit[i] = []; for (let j = 0; j <= S; j++) jit[i][j] = j === S ? jit[i][0] : 1 + (rng() - 0.5) * noise; }
    m.grow((S + 1) * (R + 1), S * R * 6);
    for (let i = 0; i <= R; i++) {
      const th = i / R * Math.PI, st = Math.sin(th), ct = Math.cos(th);
      for (let j = 0; j <= S; j++) {
        const ph = j / S * X.TAU;
        const nx = st * Math.cos(ph), ny = ct, nz = st * Math.sin(ph);
        const rr = r * (noise ? jit[i][j] : 1);
        const nn = X.vnorm([nx, ny / k, nz]);
        m.vert(x + nx * rr, y + ny * rr * k, z + nz * rr, nn[0], nn[1], nn[2], j / S * X.TAU * r / us, i / R * Math.PI * r * k / us, col[0], col[1], col[2]);
      }
    }
    for (let i = 0; i < R; i++) for (let j = 0; j < S; j++) {
      const a = base + i * (S + 1) + j, b = a + S + 1;
      m.tri(a, a + 1, b + 1); m.tri(a, b + 1, b);
    }
  };

  G.compile = function (gl, vs, fs, attrs) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('Shader: ' + gl.getShaderInfoLog(s) + '\n' + src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n').slice(0, 3000));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    (attrs || ['aPos', 'aNrm', 'aUV', 'aCol']).forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('Link: ' + gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      const name = info.name.replace(/\[0\]$/, '');
      u[name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  };

  G.upload = function (gl, mesh, dynamic, uint) {
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.v.subarray(0, mesh.n * STRIDE), dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    const big = mesh.n > 65535;
    if (big && !uint) throw new Error('Mesh too large');
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, big ? mesh.idx.subarray(0, mesh.ni) : new Uint16Array(mesh.idx.subarray(0, mesh.ni)), gl.STATIC_DRAW);
    return { vbo, ibo, count: mesh.ni, type: big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, min: mesh.min.slice(), max: mesh.max.slice(), verts: mesh.n };
  };

  G.bindMesh = function (gl, g) {
    gl.bindBuffer(gl.ARRAY_BUFFER, g.vbo);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ibo);
    const s = STRIDE * 4;
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, s, 0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, s, 12);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, s, 24);
    gl.vertexAttribPointer(3, 3, gl.FLOAT, false, s, 32);
  };

  G.texture = function (gl, src, o) {
    o = o || {};
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    const pot = (src.width & (src.width - 1)) === 0 && (src.height & (src.height - 1)) === 0;
    const wrap = o.clamp || !pot ? gl.CLAMP_TO_EDGE : gl.REPEAT;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    if (pot && o.mip !== false) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, o.nearest ? gl.NEAREST : gl.LINEAR);
    if (o.aniso && o.aniso.ext) gl.texParameterf(gl.TEXTURE_2D, o.aniso.ext.TEXTURE_MAX_ANISOTROPY_EXT, o.aniso.max);
    return t;
  };

  G.target = function (gl, w, h, depth) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    let rb = null;
    if (depth) {
      if (depth === true) {
        rb = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);
      } else rb = depth;
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rb);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return { fb, tex, rb, w, h };
  };
  G.freeTarget = function (gl, t) {
    if (!t) return;
    gl.deleteFramebuffer(t.fb); gl.deleteTexture(t.tex);
    if (t.rb && t.ownRb !== false) gl.deleteRenderbuffer(t.rb);
  };
})(globalThis.XIII = globalThis.XIII || {});
