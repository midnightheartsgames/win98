(function (Z) {
  'use strict';

  const FX_VS = Z.GLSL.HEAD + `
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aDat;
layout(location=2) in vec4 aCol;
uniform mat4 uVP;
uniform vec3 uCamR;
uniform vec3 uCamU;
uniform vec3 uEye;
out vec2 vUV;
out vec4 vCol;
flat out int vKind;
out float vSeed;
void main(){
  vec2 corner = vec2(float(gl_VertexID & 1), float((gl_VertexID >> 1) & 1)) * 2.0 - 1.0;
  int kind = int(aDat.w);
  vec3 p = aPos;
  if (kind == 2) {
    vec3 dir = aDat.xyz;
    float L = length(dir);
    vec3 d = dir / max(L, 1e-4);
    vec3 toEye = normalize(uEye - p);
    vec3 side = normalize(cross(d, toEye));
    p += d * (corner.y * 0.5 + 0.5) * L + side * corner.x * 0.03;
    vUV = vec2(corner.x, corner.y * 0.5 + 0.5);
  } else {
    float s = aDat.x;
    float rot = aDat.y;
    vec2 c = vec2(corner.x * cos(rot) - corner.y * sin(rot), corner.x * sin(rot) + corner.y * cos(rot));
    p += (uCamR * c.x + uCamU * c.y) * s;
    vUV = corner;
  }
  vCol = aCol;
  vKind = kind;
  vSeed = aDat.z;
  gl_Position = uVP * vec4(p, 1.0);
}`;

  const FX_FS = Z.GLSL.HEAD + `
in vec2 vUV;
in vec4 vCol;
flat in int vKind;
in float vSeed;
out vec4 oCol;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), u.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), u.x), u.y); }
void main(){
  float r = length(vUV);
  if (vKind == 0) {
    float a = smoothstep(1.0, 0.2, r) * (0.65 + 0.35 * n2(vUV * 3.0 + vSeed * 13.0));
    oCol = vec4(vCol.rgb, vCol.a * a);
  } else if (vKind == 1) {
    float ang = atan(vUV.y, vUV.x);
    float star = 0.55 + 0.45 * pow(abs(cos(ang * 2.5 + vSeed * 6.0)), 6.0);
    float a = smoothstep(star, 0.0, r);
    oCol = vec4(vCol.rgb * (1.0 + (1.0 - r) * 2.0), vCol.a * a);
  } else if (vKind == 2) {
    float a = smoothstep(1.0, 0.0, abs(vUV.x)) * smoothstep(0.0, 0.3, vUV.y);
    oCol = vec4(vCol.rgb, vCol.a * a);
  } else if (vKind == 3) {
    vec2 uv = vUV;
    float fl = n2(vec2(uv.x * 2.5 + vSeed * 7.0, uv.y * 2.0 - vSeed * 9.0));
    float shape = smoothstep(1.0, 0.0, length(vec2(uv.x * 1.4, (uv.y + 0.3) * 0.8))) * (0.6 + fl * 0.8);
    vec3 c = mix(vec3(1.0, 0.25, 0.05), vec3(1.0, 0.85, 0.4), clamp(shape * 1.4 - uv.y * 0.3, 0.0, 1.0));
    oCol = vec4(c * vCol.rgb, vCol.a * clamp(shape, 0.0, 1.0));
  } else {
    float a = smoothstep(1.0, 0.5, r + n2(vUV * 4.0 + vSeed) * 0.3);
    oCol = vec4(vCol.rgb, vCol.a * a);
  }
  if (oCol.a < 0.004) discard;
}`;

  class FX {
    constructor(r) {
      this.r = r;
      const gl = r.gl;
      this.prog = new Z.Program(gl, FX_VS, FX_FS, 'fx');
      this.max = 6000;
      this.data = new Float32Array(this.max * 4 * 11);
      this.vao = gl.createVertexArray();
      this.vb = gl.createBuffer();
      gl.bindVertexArray(this.vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
      gl.bufferData(gl.ARRAY_BUFFER, this.data.byteLength, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 44, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 44, 28);
      const idx = new Uint16Array(Math.min(16383, this.max) * 6);
      for (let i = 0; i < idx.length / 6; i++) { idx[i * 6] = i * 4; idx[i * 6 + 1] = i * 4 + 1; idx[i * 6 + 2] = i * 4 + 2; idx[i * 6 + 3] = i * 4 + 2; idx[i * 6 + 4] = i * 4 + 1; idx[i * 6 + 5] = i * 4 + 3; }
      this.ib = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      gl.bindVertexArray(null);
      this.parts = [];
      this.lights = [];
    }

    add(o) {
      if (this.parts.length >= this.max) this.parts.shift();
      this.parts.push(Object.assign({ t: 0, life: 0.5, size: 0.3, grow: 0, vx: 0, vy: 0, vz: 0, g: 0, drag: 0, col: [1, 1, 1], a: 1, fade: 1, kind: 0, add: false, rot: Math.random() * 6.28, seed: Math.random() }, o));
    }

    light(x, y, z, r, c, life) { this.lights.push({ x, y, z, r, c, t: 0, life }); }

    muzzle(p, dir, big, small) {
      const s = (big ? 0.4 : 0.26) * (small ? 0.4 : 1);
      this.add({ x: p[0], y: p[1], z: p[2], life: 0.06, size: s, kind: 1, add: true, col: [1, 0.75, 0.35], a: 1 });
      this.add({ x: p[0] + dir[0] * 0.15, y: p[1] + dir[1] * 0.15, z: p[2] + dir[2] * 0.15, life: 0.05, size: s * 0.7, kind: 1, add: true, col: [1, 0.9, 0.6], a: 0.9 });
      for (let i = 0; i < 2; i++) this.add({ x: p[0], y: p[1], z: p[2], vx: dir[0] * 0.8 + (Math.random() - 0.5) * 0.3, vy: 0.4 + Math.random() * 0.3, vz: dir[2] * 0.8 + (Math.random() - 0.5) * 0.3, life: 0.9, size: 0.12, grow: 0.5, kind: 0, col: [0.55, 0.55, 0.52], a: 0.35 });
      this.light(p[0], p[1], p[2], 7, [1.6, 1.1, 0.5], 0.06);
    }

    tracer(a, b, col, w) {
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      this.add({ x: a[0], y: a[1], z: a[2], dir: [dx, dy, dz], life: 0.07, kind: 2, add: true, col: col || [1, 0.8, 0.45], a: 0.7, size: w || 0.02 });
    }

    beam(a, b, col) {
      for (let i = 0; i < 3; i++) this.tracer(a, b, col, 0.04);
      this.light(b[0], b[1], b[2], 5, col.map(c => c * 1.5), 0.1);
    }

    arc(a, b) {
      let prev = a;
      const n = 8;
      for (let i = 1; i <= n; i++) {
        const t = i / n;
        const p = [Z.lerp(a[0], b[0], t) + (i < n ? (Math.random() - 0.5) * 0.5 : 0), Z.lerp(a[1], b[1], t) + (i < n ? (Math.random() - 0.5) * 0.5 : 0), Z.lerp(a[2], b[2], t) + (i < n ? (Math.random() - 0.5) * 0.5 : 0)];
        this.add({ x: prev[0], y: prev[1], z: prev[2], dir: [p[0] - prev[0], p[1] - prev[1], p[2] - prev[2]], life: 0.12, kind: 2, add: true, col: [0.6, 0.8, 1.6], a: 1 });
        prev = p;
      }
      this.light(b[0], b[1], b[2], 6, [0.8, 1, 2], 0.12);
    }

    impact(p, n, surf) {
      const col = surf === 'dirt' ? [0.45, 0.38, 0.28] : surf === 'wood' ? [0.5, 0.38, 0.25] : [0.6, 0.6, 0.58];
      for (let i = 0; i < 5; i++) this.add({ x: p[0], y: p[1], z: p[2], vx: (n[0] + (Math.random() - 0.5)) * 2, vy: (n[1] + Math.random()) * 2, vz: (n[2] + (Math.random() - 0.5)) * 2, g: 6, life: 0.6, size: 0.08, grow: 0.4, kind: 0, col, a: 0.6 });
      if (surf !== 'dirt') for (let i = 0; i < 3; i++) this.add({ x: p[0], y: p[1], z: p[2], vx: (n[0] + (Math.random() - 0.5)) * 5, vy: (n[1] + Math.random()) * 4, vz: (n[2] + (Math.random() - 0.5)) * 5, g: 9, life: 0.25, size: 0.03, kind: 1, add: true, col: [1, 0.8, 0.4], a: 1 });
    }

    blood(p, dir, k = 1, col) {
      const c = col || [0.45, 0.02, 0.02];
      for (let i = 0; i < 6 * k; i++) this.add({ x: p[0], y: p[1], z: p[2], vx: (dir ? dir[0] * 1.5 : 0) + (Math.random() - 0.5) * 2, vy: Math.random() * 2, vz: (dir ? dir[2] * 1.5 : 0) + (Math.random() - 0.5) * 2, g: 8, life: 0.5, size: 0.06 + Math.random() * 0.06, grow: 0.2, kind: 4, col: c, a: 0.9 });
    }

    explosion(p, r) {
      for (let i = 0; i < 18; i++) this.add({ x: p[0], y: p[1] + 0.3, z: p[2], vx: (Math.random() - 0.5) * r * 1.5, vy: Math.random() * r * 1.2, vz: (Math.random() - 0.5) * r * 1.5, drag: 2.5, life: 0.5 + Math.random() * 0.3, size: r * 0.25, grow: r * 0.5, kind: 3, add: true, col: [1, 1, 1], a: 1 });
      for (let i = 0; i < 22; i++) this.add({ x: p[0], y: p[1] + 0.5, z: p[2], vx: (Math.random() - 0.5) * r, vy: 1 + Math.random() * r * 0.8, vz: (Math.random() - 0.5) * r, drag: 1.2, g: -0.5, life: 2.5 + Math.random() * 2, size: r * 0.3, grow: r * 0.4, kind: 0, col: [0.22, 0.2, 0.18], a: 0.6 });
      for (let i = 0; i < 16; i++) this.add({ x: p[0], y: p[1] + 0.3, z: p[2], vx: (Math.random() - 0.5) * 16, vy: 3 + Math.random() * 8, vz: (Math.random() - 0.5) * 16, g: 12, life: 1.2, size: 0.05, kind: 0, col: [0.15, 0.12, 0.1], a: 1 });
      this.light(p[0], p[1] + 1, p[2], r * 3.5, [3, 1.8, 0.8], 0.35);
    }

    flame(p, size) { this.add({ x: p[0] + (Math.random() - 0.5) * size, y: p[1], z: p[2] + (Math.random() - 0.5) * size, vy: 1.2 + Math.random(), life: 0.6, size: 0.25 + Math.random() * 0.2, grow: -0.2, kind: 3, add: true, col: [1, 1, 1], a: 0.9 }); }

    smoke(p, size, col) { this.add({ x: p[0], y: p[1], z: p[2], vy: 0.8, life: 2.5, size: size || 0.4, grow: 0.8, kind: 0, col: col || [0.25, 0.24, 0.22], a: 0.4, drag: 0.5 }); }

    splash(p, big) { for (let i = 0; i < (big ? 18 : 7); i++) this.add({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5) * 2, vy: 1.5 + Math.random() * 2.5, vz: (Math.random() - 0.5) * 2, g: 9, life: 0.7, size: 0.08, grow: 0.3, kind: 0, col: [0.75, 0.8, 0.82], a: 0.6 }); }

    dirt(p) { for (let i = 0; i < 3; i++) this.add({ x: p[0] + (Math.random() - 0.5), y: p[1] + 0.1, z: p[2] + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 1.5, vy: 1.5 + Math.random() * 2, vz: (Math.random() - 0.5) * 1.5, g: 9, life: 0.8, size: 0.12, grow: 0.3, kind: 0, col: [0.36, 0.28, 0.2], a: 0.8 }); }

    update(dt) {
      for (const p of this.parts) {
        p.t += dt;
        p.vy -= p.g * dt;
        if (p.drag) { const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      }
      this.parts = this.parts.filter(p => p.t < p.life);
      for (const l of this.lights) l.t += dt;
      this.lights = this.lights.filter(l => l.t < l.life);
    }

    draw(r) {
      const gl = r.gl, n = Math.min(this.parts.length, this.max);
      if (!n) return;
      const V = this.view || r.view;
      const camR = [V[0], V[4], V[8]], camU = [V[1], V[5], V[9]];
      const pass = (add) => {
        let k = 0;
        const D = this.data;
        for (const p of this.parts) {
          if (!!p.add !== add) continue;
          const life = p.t / p.life;
          const a = p.a * (p.fade ? (1 - life) : 1);
          const size = Math.max(0.01, p.size + p.grow * p.t);
          for (let v = 0; v < 4; v++) {
            const o = (k * 4 + v) * 11;
            D[o] = p.x; D[o + 1] = p.y; D[o + 2] = p.z;
            if (p.kind === 2) { D[o + 3] = p.dir[0]; D[o + 4] = p.dir[1]; D[o + 5] = p.dir[2]; }
            else { D[o + 3] = size; D[o + 4] = p.rot; D[o + 5] = p.seed; }
            D[o + 6] = p.kind;
            D[o + 7] = p.col[0]; D[o + 8] = p.col[1]; D[o + 9] = p.col[2]; D[o + 10] = a;
          }
          k++;
          if (k >= 16000) break;
        }
        if (!k) return;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vb);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.data, 0, k * 4 * 11);
        gl.blendFunc(gl.SRC_ALPHA, add ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
        gl.drawElements(gl.TRIANGLES, k * 6, gl.UNSIGNED_SHORT, 0);
      };
      const p = this.prog.use();
      gl.uniformMatrix4fv(p.u.uVP, false, this.vp || r.vp);
      gl.uniform3fv(p.u.uCamR, camR);
      gl.uniform3fv(p.u.uCamU, camU);
      gl.uniform3fv(p.u.uEye, r.eye);
      gl.bindVertexArray(this.vao);
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      pass(false);
      pass(true);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      gl.bindVertexArray(null);
    }
  }
  Z.FX = FX;
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
