(function (K) {
  'use strict';

  const ATLAS_W = 4096, ATLAS_H = 1280, FRAME_W = 128, FRAME_H = 256, FRAMES = 8, COLS = ATLAS_W / FRAME_W;
  const V3 = K.v3;
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

  const builder = () => {
    const a = [];
    const put = (p, n, t) => a.push(p[0], p[1], p[2], n[0], n[1], n[2], t[0], t[1]);
    return {
      a,
      tri(p0, p1, p2, n0, n1, n2, t0, t1, t2) { put(p0, n0, t0); put(p1, n1, t1); put(p2, n2, t2); },
      quad(p0, p1, p2, p3, n0, n1, n2, n3, t0, t1, t2, t3) {
        this.tri(p0, p1, p2, n0, n1, n2, t0, t1, t2);
        this.tri(p0, p2, p3, n0, n2, n3, t0, t2, t3);
      }
    };
  };

  const prism = (B, A, E, r0, r1, sides, segs, reg) => {
    const axis = V3.norm(V3.sub(E, A)), ref = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = V3.norm(V3.cross(axis, ref)), w = V3.cross(axis, u);
    const uv = (x, y) => K.Tex.region(reg, x, y);
    for (let s = 0; s < segs; s++) {
      const c0 = lerp3(A, E, s / segs), c1 = lerp3(A, E, (s + 1) / segs);
      const ra = r0 + (r1 - r0) * s / segs, rb = r0 + (r1 - r0) * (s + 1) / segs;
      for (let k = 0; k < sides; k++) {
        const a0 = k / sides * Math.PI * 2, a1 = (k + 1) / sides * Math.PI * 2;
        const d0 = V3.add(V3.scale(u, Math.cos(a0)), V3.scale(w, Math.sin(a0))), d1 = V3.add(V3.scale(u, Math.cos(a1)), V3.scale(w, Math.sin(a1)));
        B.quad(V3.add(c0, V3.scale(d0, ra)), V3.add(c0, V3.scale(d1, ra)), V3.add(c1, V3.scale(d1, rb)), V3.add(c1, V3.scale(d0, rb)),
          d0, d1, d1, d0, uv(k / sides, 1), uv((k + 1) / sides, 1), uv((k + 1) / sides, 0), uv(k / sides, 0));
      }
    }
  };

  const cards = (B, c, s, reg, center, rnd, flat) => {
    const n = V3.norm(V3.add(V3.sub(c, center), [0, s * 0.5, 0]));
    const yaw = rnd() * Math.PI, h = s / 2, uv = (x, y) => K.Tex.region(reg, x, y);
    for (const d of [[Math.cos(yaw), 0, Math.sin(yaw)], [-Math.sin(yaw), 0, Math.cos(yaw)]]) {
      const l = V3.sub(c, V3.scale(d, h)), r = V3.add(c, V3.scale(d, h));
      B.quad([l[0], c[1] - h, l[2]], [r[0], c[1] - h, r[2]], [r[0], c[1] + h, r[2]], [l[0], c[1] + h, l[2]], n, n, n, n, uv(0, 1), uv(1, 1), uv(1, 0), uv(0, 0));
    }
    if (flat) return;
    const a = [Math.cos(yaw + 0.7) * h, Math.sin(yaw + 0.7) * h], b = [-a[1], a[0]];
    B.quad([c[0] - a[0] - b[0], c[1], c[2] - a[1] - b[1]], [c[0] + a[0] - b[0], c[1], c[2] + a[1] - b[1]], [c[0] + a[0] + b[0], c[1], c[2] + a[1] + b[1]], [c[0] - a[0] + b[0], c[1], c[2] - a[1] + b[1]],
      n, n, n, n, uv(0, 0), uv(1, 0), uv(1, 1), uv(0, 1));
  };

  const cone = (B, y0, h, r, sides, reg) => {
    const apex = [0, y0 + h, 0], uv = (x, y) => K.Tex.region(reg, x, y);
    for (let k = 0; k < sides; k++) {
      const a0 = k / sides * Math.PI * 2, a1 = (k + 1) / sides * Math.PI * 2, am = (a0 + a1) / 2;
      const n0 = V3.norm([Math.cos(a0), r / h, Math.sin(a0)]), n1 = V3.norm([Math.cos(a1), r / h, Math.sin(a1)]), nm = V3.norm([Math.cos(am), r / h, Math.sin(am)]);
      B.tri(apex, [Math.cos(a0) * r, y0, Math.sin(a0) * r], [Math.cos(a1) * r, y0, Math.sin(a1) * r], nm, n0, n1, uv((k + 0.5) / sides, 0), uv(k / sides, 1), uv((k + 1) / sides, 1));
    }
  };

  const crown = (B, rnd, n, center, rx, ry, size, reg, trunkTop, limbs, limbR, barkReg) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, e = Math.acos(1 - 2 * rnd()) - Math.PI / 2, rr = 0.55 + 0.45 * Math.sqrt(rnd());
      const c = [center[0] + Math.cos(a) * Math.cos(e) * rx * rr, center[1] + Math.sin(e) * ry * rr, center[2] + Math.sin(a) * Math.cos(e) * rx * rr];
      if (i < limbs) prism(B, trunkTop, lerp3(trunkTop, c, 0.85), limbR, limbR * 0.35, 4, 1, barkReg);
      cards(B, c, size * (0.8 + 0.4 * rnd()), reg, center, rnd);
    }
  };

  const model = (sp, variant) => {
    const S = K.Flora.SPECIES[sp], H = S.h[variant], R = S.r[variant], rnd = K.rng(1000 + sp * 10 + variant), RG = K.Tex.REGIONS, B = builder();
    const lean = () => [(rnd() - 0.5) * H * 0.03, 0, (rnd() - 0.5) * H * 0.03];
    if (S.id === 'pine') {
      const l = lean(), top = [l[0], H * 0.82, l[2]];
      prism(B, [0, -0.3, 0], top, R, R * 0.45, 6, 5, RG.barkPine);
      crown(B, rnd, 7 + variant * 2, [top[0], H * 0.85, top[2]], H * 0.17, H * 0.08, H * 0.13, RG.needles, lerp3([0, 0, 0], top, 0.92), 4, R * 0.35, RG.barkPine);
    } else if (S.id === 'spruce') {
      prism(B, [0, -0.3, 0], [0, H * 0.97, 0], R, R * 0.2, 6, 5, RG.barkSpruce);
      const tiers = 4 + variant;
      for (let i = 0; i < tiers; i++) {
        const t = i / tiers;
        cone(B, H * (0.1 + 0.82 * t), H * (0.34 - 0.12 * t), H * 0.22 * (1 - t * 0.82), 8, RG.spruce);
      }
    } else if (S.id === 'birch') {
      const l = lean(), top = [l[0] * 2, H * 0.9, l[2] * 2];
      prism(B, [0, -0.3, 0], top, R, R * 0.4, 6, 5, RG.barkBirch);
      crown(B, rnd, 10 + variant * 3, [top[0], H * 0.72, top[2]], H * 0.19, H * 0.24, H * 0.15, RG.leafBirch, lerp3([0, 0, 0], top, 0.6), 3, R * 0.4, RG.barkBirch);
    } else if (S.id === 'oak') {
      const top = [0, H * 0.42, 0];
      prism(B, [0, -0.3, 0], top, R, R * 0.75, 7, 3, RG.barkOak);
      crown(B, rnd, 16 + variant * 5, [0, H * 0.66, 0], H * 0.4, H * 0.24, H * 0.2, RG.leafOak, top, 5, R * 0.45, RG.barkOak);
    } else if (S.id === 'alder') {
      const l = lean(), top = [l[0], H * 0.85, l[2]];
      prism(B, [0, -0.3, 0], top, R, R * 0.45, 6, 4, RG.barkSpruce);
      crown(B, rnd, 10 + variant * 3, [top[0], H * 0.66, top[2]], H * 0.22, H * 0.3, H * 0.15, RG.leafAlder, lerp3([0, 0, 0], top, 0.55), 3, R * 0.4, RG.barkSpruce);
    } else {
      const top = [0, H * 0.4, 0];
      prism(B, [0, -0.3, 0], top, R, R * 0.7, 7, 3, RG.barkOak);
      crown(B, rnd, 14 + variant * 4, [0, H * 0.64, 0], H * 0.33, H * 0.3, H * 0.19, RG.leafLinden, top, 3, R * 0.45, RG.barkOak);
    }
    return finish(B);
  };

  const elderModel = () => {
    const rnd = K.rng(4646), RG = K.Tex.REGIONS, B = builder(), E = K.Flora.ELDER;
    prism(B, [0, -0.5, 0], [0.4, 20, -0.3], E.r, E.r * 0.65, 10, 7, RG.barkElder);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2 + rnd() * 0.4;
      prism(B, [Math.cos(a) * 1.2, 1.2, Math.sin(a) * 1.2], [Math.cos(a) * 4.5, -0.4, Math.sin(a) * 4.5], 0.75, 0.2, 6, 1, RG.barkElder);
    }
    const center = [0, 35, 0];
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2 + rnd() * 0.5, from = [0.3, 14 + rnd() * 4, -0.2], to = [Math.cos(a) * 13, 30 + rnd() * 6, Math.sin(a) * 13];
      prism(B, from, to, 0.9, 0.35, 6, 3, RG.barkElder);
    }
    crown(B, rnd, 46, center, 18, 9, 5, RG.leafOak, [0.3, 20, -0.2], 0, 0.5, RG.barkElder);
    return finish(B);
  };

  const undergrowth = kind => {
    const rnd = K.rng(77 + kind), RG = K.Tex.REGIONS, B = builder(), reg = kind === 0 ? RG.fern : RG.bush;
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * Math.PI + rnd() * 0.3, d = [Math.cos(a), 0, Math.sin(a)], w = kind === 0 ? 0.75 : 0.9, n = [0, 1, 0], uv = (x, y) => K.Tex.region(reg, x, y);
      B.quad(V3.scale(d, -w), V3.scale(d, w), [d[0] * w, 1, d[2] * w], [-d[0] * w, 1, -d[2] * w], n, n, n, n, uv(0, 1), uv(1, 1), uv(1, 0), uv(0, 0));
    }
    return finish(B);
  };

  const finish = B => {
    const data = new Float32Array(B.a);
    let radius = 0, height = 0;
    for (let i = 0; i < data.length; i += 8) {
      radius = Math.max(radius, Math.hypot(data[i], data[i + 2]));
      height = Math.max(height, data[i + 1]);
    }
    return { data, verts: data.length / 8, tris: data.length / 24, radius, height };
  };

  const models = () => {
    const list = [];
    for (let sp = 0; sp < K.Flora.SPECIES.length; sp++) for (let v = 0; v < 3; v++) list.push(model(sp, v));
    return list;
  };

  const frameSize = m => {
    const half = Math.max(m.radius * 1.04, m.height * 1.02 / 4);
    return [half * 2, half * 4];
  };

  const frameOf = (variant, k) => {
    const idx = variant * FRAMES + k;
    return { col: idx % COLS, row: Math.floor(idx / COLS) };
  };

  const BAYER = `float bayer(vec2 p) {
  ivec2 q = ivec2(mod(p, 4.0));
  int b[16] = int[16](0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5);
  return (float(b[q.x + q.y * 4]) + 0.5) / 16.0;
}`;

  const TREE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec4 aInst;
layout(location = 4) in vec4 aInst2;
uniform mat4 uViewProj;
uniform vec3 uEye;
uniform float uFadeStart;
uniform float uFadeLen;
uniform vec3 uWind;
uniform float uTime;
out vec2 vUv;
out vec3 vNrm;
out vec3 vWorld;
out float vFade;
out float vTint;
void main() {
  float d = distance(aInst.xz, uEye.xz);
  vFade = 1.0 - clamp((d - uFadeStart) / uFadeLen, 0.0, 1.0);
  if (vFade <= 0.0) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); return; }
  float c = cos(aInst.w), s = sin(aInst.w);
  vec3 p = aPos * aInst2.x;
  p = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);
  float hgt = max(p.y, 0.0), lean = 0.035 * hgt * hgt / (hgt + 12.0);
  float gust = 0.6 + 0.4 * sin(uTime * 0.8 - dot(aInst.xz, uWind.xy) * 0.03);
  vec2 osc = vec2(sin(uTime * 1.3 + aInst.x * 0.7), cos(uTime * 1.1 + aInst.z * 0.6)) * (0.3 + uWind.z);
  p.xz += (uWind.xy * uWind.z * gust + osc * 0.25) * lean;
  vWorld = p + aInst.xyz;
  vNrm = vec3(c * aNrm.x + s * aNrm.z, aNrm.y, -s * aNrm.x + c * aNrm.z);
  vUv = aUv;
  vTint = aInst2.y;
  gl_Position = uViewProj * vec4(vWorld, 1.0);
}`;

  const TREE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vNrm;
in vec3 vWorld;
in float vFade;
in float vTint;
uniform sampler2D uTex;
uniform vec3 uLightDir;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
uniform float uBorder;
out vec4 outColor;
${BAYER}
void main() {
  vec4 t = texture(uTex, vUv);
  if (t.a < 0.5) discard;
  if (bayer(gl_FragCoord.xy) >= vFade) discard;
  vec3 n = normalize(vNrm);
  float diff = max(dot(n, uLightDir), 0.0) * 0.8 + 0.2;
  vec3 c = t.rgb * vTint * (uAmbient + uLight * diff);
  c = mix(c, vec3(0.9, 0.2, 0.15), uBorder * 0.45);
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const IMP_VS = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 3) in vec4 aInst;
layout(location = 4) in vec4 aInst2;
uniform mat4 uViewProj;
uniform vec3 uEye;
uniform float uFadeStart;
uniform float uFadeLen;
uniform vec2 uSizes[18];
uniform float uFogFar;
out vec2 vUv;
out float vFade;
out float vTint;
out float vDist;
void main() {
  vec2 to = uEye.xz - aInst.xz;
  float d = length(to);
  vFade = clamp((d - uFadeStart) / uFadeLen, 0.0, 1.0);
  if (vFade <= 0.0 || d > uFogFar * 1.02) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); return; }
  int v = int(aInst2.z + 0.5);
  vec2 size = uSizes[v] * aInst2.x;
  vec2 dir = to / max(d, 0.001);
  vec3 right = vec3(dir.y, 0.0, -dir.x);
  vec3 p = aInst.xyz + right * aCorner.x * size.x + vec3(0.0, aCorner.y * size.y, 0.0);
  float a = atan(dir.x, dir.y) - aInst.w;
  int k = int(mod(floor(a / 0.7853982 + 0.5), 8.0));
  int idx = v * 8 + k;
  float col = float(idx - (idx / 32) * 32), row = float(idx / 32);
  vUv = vec2((col + aCorner.x + 0.5) / 32.0, (row + aCorner.y) / 5.0);
  vTint = aInst2.y;
  vDist = distance(p, uEye);
  gl_Position = uViewProj * vec4(p, 1.0);
}`;

  const IMP_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in float vFade;
in float vTint;
in float vDist;
uniform sampler2D uAtlas;
uniform vec3 uLight;
uniform vec3 uFog;
uniform float uFogFar;
out vec4 outColor;
${BAYER}
void main() {
  vec4 t = texture(uAtlas, vUv);
  if (t.a < 0.5) discard;
  if (bayer(gl_FragCoord.xy) < 1.0 - vFade) discard;
  vec3 c = t.rgb * vTint * uLight;
  float f = clamp(vDist / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, uFog, f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const BAKE_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
uniform mat4 uViewProj;
out vec2 vUv;
out vec3 vNrm;
void main() {
  vUv = aUv;
  vNrm = aNrm;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

  const BAKE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vNrm;
uniform sampler2D uTex;
out vec4 outColor;
void main() {
  vec4 t = texture(uTex, vUv);
  if (t.a < 0.5) discard;
  float l = 0.6 + 0.4 * max(dot(normalize(vNrm), normalize(vec3(0.3, 0.8, 0.5))), 0.0);
  outColor = vec4(t.rgb * l, 1.0);
}`;

  class Forest {
    constructor(gpu, T, F) {
      const gl = gpu.gl;
      this.gpu = gpu;
      this.T = T;
      this.F = F;
      this.prog = gpu.program(TREE_VS, TREE_FS);
      this.imp = gpu.program(IMP_VS, IMP_FS);
      this.bakeProg = gpu.program(BAKE_VS, BAKE_FS);
      this.tex = this.texture(K.Tex.flora());
      this.kinds = models().map(geo => this.instanced(geo));
      this.sizes = new Float32Array(this.kinds.flatMap(k => frameSize(k.geo)));
      const elder = this.instanced(elderModel());
      const E = F.elder;
      this.upload(elder, new Float32Array([E.x, T.heightAt(E.x, E.z) - 0.4, E.z, 0.3, 1, 1, 0, 0]));
      this.elder = elder;
      this.plants = [this.instanced(undergrowth(0)), this.instanced(undergrowth(1))];
      this.atlas = this.bake();
      const tr = F.trees, outer = K.Edge ? K.Edge.trees(T, F) : new Float32Array(0), all = new Float32Array(tr.count * 8 + outer.length);
      for (let i = 0; i < tr.count; i++) all.set([tr.X[i], tr.Y[i], tr.Z[i], tr.YAW[i], tr.S[i], tr.TINT[i], tr.V[i], 0], i * 8);
      all.set(outer, tr.count * 8);
      this.inner = tr.count;
      this.quad = this.instanced({ data: new Float32Array([-0.5, 0, 0.5, 0, -0.5, 1, 0.5, 1]), verts: 4, tris: 2 }, [2]);
      this.upload(this.quad, all);
      this.key = null;
      this.stats = { near: 0, tris: 0, impostors: all.length / 8, draws: 0 };
    }

    texture(canvas) {
      const gl = this.gpu.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 4);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.gpu.frees.push(() => gl.deleteTexture(t));
      return t;
    }

    instanced(geo, sizes) {
      const gl = this.gpu.gl, vao = gl.createVertexArray(), vbo = gl.createBuffer(), inst = gl.createBuffer();
      const layout = sizes || [3, 3, 2], stride = layout.reduce((a, b) => a + b, 0);
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, geo.data, gl.STATIC_DRAW);
      let off = 0;
      layout.forEach((n, i) => {
        gl.enableVertexAttribArray(i);
        gl.vertexAttribPointer(i, n, gl.FLOAT, false, stride * 4, off * 4);
        off += n;
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      for (const [loc, offset] of [[3, 0], [4, 16]]) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 32, offset);
        gl.vertexAttribDivisor(loc, 1);
      }
      gl.bindVertexArray(null);
      this.gpu.frees.push(() => { gl.deleteVertexArray(vao); gl.deleteBuffer(vbo); gl.deleteBuffer(inst); });
      return { geo, vao, inst, verts: geo.verts, n: 0 };
    }

    upload(k, arr) {
      const gl = this.gpu.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, k.inst);
      gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
      k.n = arr.length / 8;
    }

    bake() {
      const gl = this.gpu.gl, t = gl.createTexture(), fb = gl.createFramebuffer(), depth = gl.createRenderbuffer();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, ATLAS_W, ATLAS_H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, ATLAS_W, ATLAS_H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      gl.viewport(0, 0, ATLAS_W, ATLAS_H);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.enable(gl.SCISSOR_TEST);
      gl.useProgram(this.bakeProg.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.uniform1i(this.bakeProg.u.uTex, 0);
      this.kinds.forEach((kind, v) => {
        const [w, h] = frameSize(kind.geo);
        for (let k = 0; k < FRAMES; k++) {
          const th = k * Math.PI * 2 / FRAMES, f = frameOf(v, k);
          gl.viewport(f.col * FRAME_W, f.row * FRAME_H, FRAME_W, FRAME_H);
          gl.scissor(f.col * FRAME_W, f.row * FRAME_H, FRAME_W, FRAME_H);
          const eye = [Math.sin(th) * 60, h / 2, Math.cos(th) * 60];
          const vp = K.m4.multiply(K.m4.ortho(-w / 2, w / 2, -h / 2, h / 2, 1, 120), K.m4.lookAt(eye, [0, h / 2, 0], [0, 1, 0]));
          gl.uniformMatrix4fv(this.bakeProg.u.uViewProj, false, vp);
          gl.bindVertexArray(kind.vao);
          gl.drawArrays(gl.TRIANGLES, 0, kind.verts);
        }
      });
      gl.disable(gl.SCISSOR_TEST);
      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.deleteFramebuffer(fb);
      gl.deleteRenderbuffer(depth);
      this.gpu.frees.push(() => gl.deleteTexture(t));
      return t;
    }

    update(eye, R) {
      const C = K.Flora.CELL, cx = Math.floor(eye[0] / C), cz = Math.floor(eye[2] / C), key = cx + ',' + cz + ',' + R;
      if (key === this.key) return;
      this.key = key;
      const F = this.F, tr = F.trees, un = F.under, mx = (cx + 0.5) * C, mz = (cz + 0.5) * C, pad = C * 0.71 + 2;
      const lists = this.kinds.map(() => []);
      for (const c of F.nearCells(mx, mz, R + pad)) {
        for (let q = tr.cells.start[c]; q < tr.cells.start[c + 1]; q++) {
          const i = tr.cells.list[q];
          lists[tr.V[i]].push(tr.X[i], tr.Y[i], tr.Z[i], tr.YAW[i], tr.S[i], tr.TINT[i], tr.V[i], 0);
        }
      }
      let near = 0, tris = 0;
      lists.forEach((l, v) => {
        this.upload(this.kinds[v], new Float32Array(l));
        near += this.kinds[v].n;
        tris += this.kinds[v].n * this.kinds[v].geo.tris;
      });
      const plants = [[], []];
      for (const c of F.nearCells(mx, mz, 30 + pad)) {
        for (let q = un.cells.start[c]; q < un.cells.start[c + 1]; q++) {
          const i = un.cells.list[q];
          plants[un.KIND[i]].push(un.X[i], un.Y[i], un.Z[i], un.YAW[i], un.S[i], 1, 0, 0);
        }
      }
      plants.forEach((l, k) => this.upload(this.plants[k], new Float32Array(l)));
      this.stats.near = near;
      this.stats.tris = tris;
    }

    draw(vp, eye, D, fogFar, R, border, outer) {
      const gl = this.gpu.gl, u = this.prog.u;
      let draws = 0;
      gl.useProgram(this.prog.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.uniform1i(u.uTex, 0);
      gl.uniformMatrix4fv(u.uViewProj, false, vp);
      gl.uniform3fv(u.uEye, eye);
      gl.uniform3fv(u.uLightDir, D.lightDir);
      gl.uniform3fv(u.uLight, D.light);
      gl.uniform3fv(u.uAmbient, D.ambient);
      gl.uniform3fv(u.uFog, D.horizon); gl.uniform3fv(u.uFogDir, D.sunDir); gl.uniform3fv(u.uFogSun, D.sunFog);
      gl.uniform1f(u.uFogFar, fogFar);
      gl.uniform1f(u.uBorder, border ? 1 : 0);
      gl.uniform1f(u.uFadeStart, R - K.Flora.BAND);
      gl.uniform1f(u.uFadeLen, K.Flora.BAND);
      gl.uniform3fv(u.uWind, D.wind || [1, 0, 0.2]);
      gl.uniform1f(u.uTime, D.time || 0);
      for (const k of this.kinds) {
        if (!k.n) continue;
        gl.bindVertexArray(k.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, k.verts, k.n);
        draws++;
      }
      gl.uniform1f(u.uBorder, 0);
      gl.uniform1f(u.uFadeStart, 1e6);
      gl.bindVertexArray(this.elder.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, this.elder.verts, 1);
      draws++;
      gl.uniform1f(u.uFadeStart, 26);
      gl.uniform1f(u.uFadeLen, 4);
      for (const k of this.plants) {
        if (!k.n) continue;
        gl.bindVertexArray(k.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, k.verts, k.n);
        draws++;
      }
      const iu = this.imp.u;
      gl.useProgram(this.imp.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.atlas);
      gl.uniform1i(iu.uAtlas, 0);
      gl.uniformMatrix4fv(iu.uViewProj, false, vp);
      gl.uniform3fv(iu.uEye, eye);
      gl.uniform1f(iu.uFadeStart, R - K.Flora.BAND);
      gl.uniform1f(iu.uFadeLen, K.Flora.BAND);
      gl.uniform2fv(iu.uSizes, this.sizes);
      gl.uniform3fv(iu.uLight, [0, 1, 2].map(i => D.ambient[i] + D.light[i] * 0.55));
      gl.uniform3fv(iu.uFog, D.horizon); gl.uniform3fv(iu.uFogDir, D.sunDir); gl.uniform3fv(iu.uFogSun, D.sunFog);
      gl.uniform1f(iu.uFogFar, fogFar);
      gl.bindVertexArray(this.quad.vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, outer === false ? this.inner : this.quad.n);
      draws++;
      gl.bindVertexArray(null);
      this.stats.draws = draws;
    }
  }

  K.Trees = { ATLAS_W, ATLAS_H, FRAME_W, FRAME_H, FRAMES, models, elderModel, undergrowth, frameSize, frameOf, Forest };
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
