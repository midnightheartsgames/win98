(function (K) {
  'use strict';

  const MAX = 900, POOL_CAP = K.Wounds.POOL_CAP;
  const COLORS = { blood: [0.42, 0.03, 0.02], straw: [0.78, 0.74, 0.58], spark: [1, 0.86, 0.5] };

  const DOT_VS = `#version 300 es
layout(location = 0) in vec4 aPos;
layout(location = 1) in vec4 aCol;
uniform mat4 uViewProj;
uniform float uScale;
out vec4 vCol;
void main() {
  vec4 p = uViewProj * vec4(aPos.xyz, 1.0);
  gl_Position = p;
  gl_PointSize = clamp(aPos.w * uScale / max(p.w, 0.1), 1.0, 10.0);
  vCol = aCol;
}`;

  const DOT_FS = `#version 300 es
precision highp float;
in vec4 vCol;
uniform vec3 uLight;
out vec4 outColor;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  if (dot(d, d) > 0.25) discard;
  vec3 c = vCol.a > 1.5 ? vCol.rgb : vCol.rgb * uLight;
  outColor = vec4(c, 1.0);
}`;

  const POOL_VS = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aPool;
layout(location = 2) in vec4 aNorm;
uniform mat4 uViewProj;
uniform float uTime;
out vec2 vUv;
out float vSeed;
out vec3 vWorld;
void main() {
  float age = max(0.0, uTime - aPool.w);
  float r = aNorm.w * (0.25 + 0.75 * clamp(age / 4.0, 0.0, 1.0));
  vec3 n = normalize(aNorm.xyz);
  vec3 t = normalize(abs(n.y) > 0.9 ? cross(n, vec3(1.0, 0.0, 0.0)) : cross(n, vec3(0.0, 1.0, 0.0)));
  vec3 b = cross(n, t);
  vec3 p = aPool.xyz + n * 0.025 + (t * aCorner.x + b * aCorner.y) * r;
  vUv = aCorner;
  vSeed = fract(aPool.x * 13.17 + aPool.z * 7.31);
  vWorld = p;
  gl_Position = uViewProj * vec4(p, 1.0);
}`;

  const POOL_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in float vSeed;
in vec3 vWorld;
uniform vec3 uLight;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
out vec4 outColor;
void main() {
  float a = atan(vUv.y, vUv.x), d = length(vUv);
  float edge = 0.78 + 0.12 * sin(a * 3.0 + vSeed * 20.0) + 0.08 * sin(a * 7.0 + vSeed * 41.0);
  if (d > edge) discard;
  vec3 c = vec3(0.3, 0.02, 0.015) * (0.85 + 0.25 * (1.0 - d / edge)) * uLight;
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 0.86);
}`;

  class Fx {
    constructor(gpu) {
      const gl = gpu.gl;
      this.gpu = gpu;
      this.dot = gpu.program(DOT_VS, DOT_FS);
      this.pool = gpu.program(POOL_VS, POOL_FS);
      this.n = 0;
      this.pos = new Float32Array(MAX * 3);
      this.vel = new Float32Array(MAX * 3);
      this.life = new Float32Array(MAX);
      this.kind = new Uint8Array(MAX);
      this.size = new Float32Array(MAX);
      this.buf = new Float32Array(MAX * 8);
      this.vao = gl.createVertexArray();
      this.vbo = gl.createBuffer();
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, this.buf.byteLength, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
      gl.bindVertexArray(null);
      this.pvao = gl.createVertexArray();
      this.quad = gl.createBuffer();
      this.inst = gl.createBuffer();
      gl.bindVertexArray(this.pvao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.inst);
      gl.bufferData(gl.ARRAY_BUFFER, POOL_CAP * 32, gl.DYNAMIC_DRAW);
      for (const [loc, off] of [[1, 0], [2, 16]]) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 32, off);
        gl.vertexAttribDivisor(loc, 1);
      }
      gl.bindVertexArray(null);
      const vao = this.vao, pvao = this.pvao, bufs = [this.vbo, this.quad, this.inst];
      gpu.frees.push(() => { gl.deleteVertexArray(vao); gl.deleteVertexArray(pvao); bufs.forEach(b => gl.deleteBuffer(b)); });
      this.poolKey = null;
      this.poolCount = 0;
      this.rnd = K.rng(77);
    }

    spray(kind, at, dir, count, speed) {
      const r = this.rnd, d = dir || [0, 1, 0];
      for (let k = 0; k < count; k++) {
        const i = this.n < MAX ? this.n++ : Math.floor(r() * MAX);
        const s = (speed || 3) * (0.35 + r() * 0.9);
        this.pos.set([at[0] + (r() - 0.5) * 0.06, at[1] + (r() - 0.5) * 0.06, at[2] + (r() - 0.5) * 0.06], i * 3);
        this.vel.set([d[0] * s + (r() - 0.5) * 2.2, d[1] * s + 0.8 + r() * 2.2, d[2] * s + (r() - 0.5) * 2.2], i * 3);
        this.life[i] = kind === 'spark' ? 0.18 + r() * 0.15 : 0.9 + r() * 0.8;
        this.kind[i] = kind === 'blood' ? 0 : kind === 'straw' ? 1 : 2;
        this.size[i] = kind === 'straw' ? 0.05 + r() * 0.04 : kind === 'spark' ? 0.025 : 0.025 + r() * 0.03;
      }
    }

    update(dt, T, S, blood) {
      const p = this.pos, v = this.vel, r = this.rnd;
      for (let i = 0; i < this.n; i++) {
        this.life[i] -= dt;
        const o = i * 3, k = this.kind[i];
        if (this.life[i] <= 0) {
          this.n--;
          if (i < this.n) {
            p.copyWithin(o, this.n * 3, this.n * 3 + 3);
            v.copyWithin(o, this.n * 3, this.n * 3 + 3);
            this.life[i] = this.life[this.n];
            this.kind[i] = this.kind[this.n];
            this.size[i] = this.size[this.n];
            i--;
          }
          continue;
        }
        v[o + 1] -= (k === 2 ? 2 : k === 1 ? 4 : 9.81) * dt;
        if (k === 1) { v[o] *= 1 - 2 * dt; v[o + 2] *= 1 - 2 * dt; }
        p[o] += v[o] * dt; p[o + 1] += v[o + 1] * dt; p[o + 2] += v[o + 2] * dt;
        const g = T.heightAt(p[o], p[o + 2]);
        if (p[o + 1] < g + 0.01) {
          p[o + 1] = g + 0.01;
          v[o] = 0; v[o + 1] = 0; v[o + 2] = 0;
          if (k === 0 && blood && S && r() < 0.04) K.Wounds.pool(S, p[o], p[o + 2], 0.05 + r() * 0.08, S.time - 3.5);
          if (k !== 1) this.life[i] = Math.min(this.life[i], 0.25);
        }
      }
    }

    pools(vp, eye, D, fogFar, S) {
      const gl = this.gpu.gl;
      const light = [0, 1, 2].map(i => D.ambient[i] + D.light[i] * 0.7);
      if (S && S.blood.length) {
        const key = S.blood.length + ':' + (S.blood.length ? S.blood[S.blood.length - 1].born : 0) + ':' + (S.bloodVersion || 0);
        if (key !== this.poolKey) {
          this.poolKey = key;
          const list = S.blood.slice(-POOL_CAP), data = new Float32Array(list.length * 8);
          list.forEach((b, i) => {
            const n = this.T ? this.T.normalAt(b.x, b.z) : [0, 1, 0], y = this.T ? this.T.heightAt(b.x, b.z) : 0;
            data.set([b.x, b.y !== undefined ? b.y : y, b.z, b.born, n[0], n[1], n[2], b.r], i * 8);
          });
          gl.bindBuffer(gl.ARRAY_BUFFER, this.inst);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
          this.poolCount = list.length;
        }
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(false);
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(-2, -4);
        gl.useProgram(this.pool.p);
        const u = this.pool.u;
        gl.uniformMatrix4fv(u.uViewProj, false, vp);
        gl.uniform1f(u.uTime, S.time);
        gl.uniform3fv(u.uLight, light);
        gl.uniform3fv(u.uEye, eye);
        gl.uniform3fv(u.uFog, D.horizon); gl.uniform3fv(u.uFogDir, D.sunDir); gl.uniform3fv(u.uFogSun, D.sunFog);
        gl.uniform1f(u.uFogFar, fogFar);
        gl.bindVertexArray(this.pvao);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.poolCount);
        gl.disable(gl.POLYGON_OFFSET_FILL);
        gl.depthMask(true);
        gl.disable(gl.BLEND);
        gl.bindVertexArray(null);
      }
    }

    dots(vp, D, height, blood) {
      const gl = this.gpu.gl;
      const light = [0, 1, 2].map(i => D.ambient[i] + D.light[i] * 0.7);
      if (!this.n) return;
      const b = this.buf;
      let m = 0;
      for (let i = 0; i < this.n; i++) {
        const k = this.kind[i];
        if (k === 0 && !blood) continue;
        const c = k === 0 ? COLORS.blood : k === 1 ? COLORS.straw : COLORS.spark;
        b.set([this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2], this.size[i], c[0], c[1], c[2], k === 2 ? 2 : 1], m * 8);
        m++;
      }
      if (!m) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, b, 0, m * 8);
      gl.useProgram(this.dot.p);
      gl.uniformMatrix4fv(this.dot.u.uViewProj, false, vp);
      gl.uniform1f(this.dot.u.uScale, height * 1.4);
      gl.uniform3fv(this.dot.u.uLight, light);
      gl.bindVertexArray(this.vao);
      gl.drawArrays(gl.POINTS, 0, m);
      gl.bindVertexArray(null);
    }
  }

  K.Fx = { Fx, pool: K.Wounds.pool, POOL_CAP };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
