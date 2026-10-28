(function (K) {
  'use strict';

  class Gpu {
    constructor(canvas, opts) {
      const o = opts || {};
      const gl = canvas.getContext('webgl2', {
        antialias: false,
        alpha: false,
        depth: true,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: !!o.preserve,
        powerPreference: 'high-performance'
      });
      if (!gl) throw new Error('нет WebGL2');
      this.gl = gl;
      this.frees = [];
      Gpu.live++;
      Gpu.peak = Math.max(Gpu.peak, Gpu.live);
    }

    shader(type, src) {
      const gl = this.gl, s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(s);
        gl.deleteShader(s);
        throw new Error('шейдер: ' + log);
      }
      return s;
    }

    program(vs, fs) {
      const gl = this.gl, p = gl.createProgram();
      const a = this.shader(gl.VERTEX_SHADER, vs), b = this.shader(gl.FRAGMENT_SHADER, fs);
      gl.attachShader(p, a);
      gl.attachShader(p, b);
      gl.linkProgram(p);
      gl.deleteShader(a);
      gl.deleteShader(b);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(p);
        gl.deleteProgram(p);
        throw new Error('программа: ' + log);
      }
      const u = {};
      const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) {
        const info = gl.getActiveUniform(p, i);
        u[info.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, info.name);
      }
      this.frees.push(() => gl.deleteProgram(p));
      return { p, u };
    }

    indices(arr) {
      const gl = this.gl, buf = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
      this.frees.push(() => gl.deleteBuffer(buf));
      return { buf, count: arr.length };
    }

    mesh(data, sizes, index) {
      const gl = this.gl;
      const arr = data instanceof Float32Array ? data : new Float32Array(data);
      const vao = gl.createVertexArray(), buf = gl.createBuffer();
      const stride = sizes.reduce((s, n) => s + n, 0);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
      let off = 0;
      sizes.forEach((n, i) => {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribPointer(i, n, gl.FLOAT, false, stride * 4, off * 4);
        off += n;
      });
      if (index) gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index.buf);
      gl.bindVertexArray(null);
      this.frees.push(() => {
        gl.deleteVertexArray(vao);
        gl.deleteBuffer(buf);
      });
      return { vao, buf, count: index ? index.count : arr.length / stride, indexed: !!index };
    }

    destroy() {
      if (!this.gl) return;
      for (const free of this.frees) free();
      this.frees = [];
      const lose = this.gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      this.gl = null;
      Gpu.live--;
    }
  }

  Gpu.live = 0;
  Gpu.peak = 0;
  K.Gpu = Gpu;
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
