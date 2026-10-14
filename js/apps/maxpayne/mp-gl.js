(function (M) {
  'use strict';

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s) + '\n' + src.split('\n').slice(0, 5).join('\n'));
    return s;
  }

  class Program {
    constructor(gl, vs, fs, attrs) {
      this.gl = gl;
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
      (attrs || []).forEach((a, i) => gl.bindAttribLocation(p, i, a));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
      this.p = p;
      this.u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(p, i);
        const name = info.name.replace(/\[0\]$/, '');
        this.u[name] = gl.getUniformLocation(p, info.name);
      }
    }
    use() { this.gl.useProgram(this.p); return this; }
    f1(n, v) { const l = this.u[n]; if (l) this.gl.uniform1f(l, v); return this; }
    i1(n, v) { const l = this.u[n]; if (l) this.gl.uniform1i(l, v); return this; }
    f2(n, a, b) { const l = this.u[n]; if (l) this.gl.uniform2f(l, a, b); return this; }
    f3(n, v) { const l = this.u[n]; if (l) this.gl.uniform3f(l, v[0], v[1], v[2]); return this; }
    f4(n, v) { const l = this.u[n]; if (l) this.gl.uniform4f(l, v[0], v[1], v[2], v[3]); return this; }
    v3(n, arr) { const l = this.u[n]; if (l) this.gl.uniform3fv(l, arr); return this; }
    v4(n, arr) { const l = this.u[n]; if (l) this.gl.uniform4fv(l, arr); return this; }
    m4(n, m) { const l = this.u[n]; if (l) this.gl.uniformMatrix4fv(l, false, m); return this; }
    m4v(n, arr) { const l = this.u[n]; if (l) this.gl.uniformMatrix4fv(l, false, arr); return this; }
  }

  class Mesh {
    constructor(gl, layout, data, o) {
      this.gl = gl;
      this.layout = layout;
      this.stride = layout.reduce((a, b) => a + b, 0);
      this.vao = gl.createVertexArray();
      this.vbo = gl.createBuffer();
      this.dynamic = !!(o && o.dynamic);
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      let off = 0;
      layout.forEach((n, i) => {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribPointer(i, n, gl.FLOAT, false, this.stride * 4, off * 4);
        off += n;
      });
      gl.bindVertexArray(null);
      this.count = 0;
      if (data) this.set(data);
    }
    set(data, count) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      const arr = data instanceof Float32Array ? data : new Float32Array(data);
      if (this.dynamic && this.cap >= arr.length) gl.bufferSubData(gl.ARRAY_BUFFER, 0, arr, 0, count !== undefined ? count * this.stride : arr.length);
      else {
        gl.bufferData(gl.ARRAY_BUFFER, arr, this.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
        this.cap = arr.length;
      }
      this.count = count !== undefined ? count : arr.length / this.stride;
    }
    draw(mode, first, count) {
      const gl = this.gl;
      if (!this.count) return;
      gl.bindVertexArray(this.vao);
      gl.drawArrays(mode === undefined ? gl.TRIANGLES : mode, first || 0, count === undefined ? this.count : count);
    }
    dispose() {
      this.gl.deleteBuffer(this.vbo);
      this.gl.deleteVertexArray(this.vao);
    }
  }

  class Target {
    constructor(gl, w, h, o) {
      this.gl = gl;
      this.fb = gl.createFramebuffer();
      this.tex = gl.createTexture();
      this.depth = gl.createRenderbuffer();
      this.resize(w, h, o);
    }
    resize(w, h) {
      const gl = this.gl;
      this.w = w; this.h = h;
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
    bind() {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
      gl.viewport(0, 0, this.w, this.h);
    }
    dispose() {
      const gl = this.gl;
      gl.deleteFramebuffer(this.fb);
      gl.deleteTexture(this.tex);
      gl.deleteRenderbuffer(this.depth);
    }
  }

  const mat4 = {
    ident() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    mul(a, b, out) {
      out = out || new Float32Array(16);
      const r = out === a || out === b ? new Float32Array(16) : out;
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        r[j * 4 + i] = a[i] * b[j * 4] + a[4 + i] * b[j * 4 + 1] + a[8 + i] * b[j * 4 + 2] + a[12 + i] * b[j * 4 + 3];
      }
      if (r !== out) out.set(r);
      return out;
    },
    persp(fov, asp, n, f) {
      const t = 1 / Math.tan(fov / 2);
      return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]);
    },
    lookAt(e, c, up) {
      const z = M.norm(M.sub(e, c));
      const x = M.norm(M.cross(up || [0, 1, 0], z));
      const y = M.cross(z, x);
      return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -M.dot(x, e), -M.dot(y, e), -M.dot(z, e), 1]);
    },
    trs(t, yaw, s) {
      const c = Math.cos(yaw || 0), sn = Math.sin(yaw || 0), k = s || 1;
      return new Float32Array([c * k, 0, -sn * k, 0, 0, k, 0, 0, sn * k, 0, c * k, 0, t[0], t[1], t[2], 1]);
    },
    translate(t) { const m = mat4.ident(); m[12] = t[0]; m[13] = t[1]; m[14] = t[2]; return m; },
    rotXm(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]); },
    rotZm(a) { const c = Math.cos(a), s = Math.sin(a); return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); },
    rotEuler(x, y, z) {
      return mat4.mul(mat4.mul(mat4.rotY(y), mat4.rotXm(x)), mat4.rotZm(z));
    },
    rotY(a) { return mat4.trs([0, 0, 0], a, 1); },
    xform(m, p) { return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14]]; },
    xformDir(m, p) { return [m[0] * p[0] + m[4] * p[1] + m[8] * p[2], m[1] * p[0] + m[5] * p[1] + m[9] * p[2], m[2] * p[0] + m[6] * p[1] + m[10] * p[2]]; },
    project(m, p) {
      const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
      const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
      const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
      return w > 0.01 ? [x / w, y / w, w] : null;
    }
  };

  M.GL = { Program, Mesh, Target, mat4 };
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
