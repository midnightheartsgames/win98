(function (K) {
  'use strict';
  const { M4, clamp, lerp, frustumPlanes, sphereVisible, smooth } = K;
  const { Mesh, FL } = K.Models;
  const MAXL = 8;
  const WD = K.WORLD;

  const VS_LIT = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute vec4 aCol;
attribute vec4 aOff; attribute float aRot;
uniform mat4 uVP; uniform mediump float uInst;
varying vec3 vW; varying vec3 vN; varying vec2 vUV; varying vec4 vC; varying vec3 vBase;
void main(){
  vec3 p = aPos; vec3 n = aNrm; vBase = vec3(0.0);
  if (uInst > 0.5) {
    float c = cos(aRot), s = sin(aRot);
    p = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c) * aOff.w + aOff.xyz;
    n = vec3(n.x * c - n.z * s, n.y, n.x * s + n.z * c);
    vBase = aOff.xyz;
  }
  vW = p; vN = n; vUV = aUV; vC = aCol;
  gl_Position = uVP * vec4(p, 1.0);
}`;
  const FS_LIT = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uAmb; uniform vec3 uFogCol; uniform float uFog; uniform vec3 uCam;
uniform float uAlphaTest; uniform vec4 uTint; uniform vec3 uDither; uniform float uInst; uniform float uFlat; uniform float uBlend;
uniform vec3 uLP[${MAXL}]; uniform vec4 uLC[${MAXL}];
varying vec3 vW; varying vec3 vN; varying vec2 vUV; varying vec4 vC; varying vec3 vBase;
float bayer(vec2 p){ vec2 q = mod(floor(p), 4.0); float a = mod(q.x + q.y * 2.0, 4.0); float b = mod(q.x * 2.0 + q.y * 3.0 + floor(q.y / 2.0), 4.0); return (a * 4.0 + b + 0.5) / 16.0; }
void main(){
  vec4 t = texture2D(uTex, vUV);
  if (t.a < uAlphaTest) discard;
  if (uDither.x > 0.5) {
    vec3 bp = uInst > 0.5 ? vBase : vW;
    float d = length(bp.xz - uCam.xz);
    float f = clamp((uDither.y - d) / uDither.z, 0.0, 1.0);
    float b = bayer(gl_FragCoord.xy);
    if (uDither.x < 1.5) { if (b > f) discard; } else { if (b <= f) discard; }
  }
  vec3 n = normalize(vN);
  if (!gl_FrontFacing && uFlat < 0.5) n = -n;
  vec3 dyn = vec3(0.0);
  for (int i = 0; i < ${MAXL}; i++) {
    vec3 d = uLP[i] - vW; float l = length(d) + 0.001; float a = max(0.0, 1.0 - l / uLC[i].w);
    dyn += uLC[i].rgb * a * a * (0.4 + 0.6 * max(dot(n, d / l), 0.0));
  }
  vec3 lit;
  if (vC.a > 1.5) lit = vec3(1.3);
  else { float nd = max(dot(n, uSun), 0.0); float sky = 0.75 + 0.25 * n.y; lit = uAmb * sky + uSunCol * nd + dyn; }
  vec3 c = t.rgb * vC.rgb * lit;
  c = mix(c, uTint.rgb, uTint.a);
  float dist = length(vW - uCam);
  float f = 1.0 - exp(-dist * uFog);
  c = mix(c, uFogCol, clamp(f, 0.0, 1.0));
  gl_FragColor = vec4(c, uBlend > 0.5 ? t.a * clamp(vC.a, 0.0, 1.0) : 1.0);
}`;
  const VS_BB = `
attribute vec3 aBase; attribute vec4 aCS; attribute vec3 aCell;
uniform mat4 uVP; uniform vec3 uCamR;
varying vec2 vUV; varying vec3 vW; varying vec3 vB; varying float vTint;
void main(){
  vec3 r = normalize(vec3(uCamR.x, 0.0, uCamR.z));
  vec3 p = aBase + r * aCS.x * aCS.z * 0.5 + vec3(0.0, aCS.y * aCS.w, 0.0);
  vW = p; vB = aBase; vTint = aCell.z;
  vUV = vec2(aCell.x + (aCS.x * 0.5 + 0.5) * aCell.y, aCS.y * 0.985 + 0.005);
  gl_Position = uVP * vec4(p, 1.0);
}`;
  const FS_BB = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uAmb; uniform vec3 uSunCol; uniform vec3 uFogCol; uniform float uFog; uniform vec3 uCam; uniform vec3 uDither;
varying vec2 vUV; varying vec3 vW; varying vec3 vB; varying float vTint;
float bayer(vec2 p){ vec2 q = mod(floor(p), 4.0); float a = mod(q.x + q.y * 2.0, 4.0); float b = mod(q.x * 2.0 + q.y * 3.0 + floor(q.y / 2.0), 4.0); return (a * 4.0 + b + 0.5) / 16.0; }
void main(){
  vec4 t = texture2D(uTex, vUV);
  if (t.a < 0.38) discard;
  float d = length(vB.xz - uCam.xz);
  float f = clamp((uDither.y - d) / uDither.z, 0.0, 1.0);
  if (bayer(gl_FragCoord.xy) <= f) discard;
  vec3 c = t.rgb * (uAmb * 0.95 + uSunCol * 0.62) * (0.88 + vTint * 0.24);
  float dist = length(vW - uCam);
  c = mix(c, uFogCol, clamp(1.0 - exp(-dist * uFog), 0.0, 1.0));
  gl_FragColor = vec4(c, 1.0);
}`;
  const VS_SKY = `attribute vec2 aP; varying vec2 vP; void main(){ vP = aP; gl_Position = vec4(aP, 0.9999, 1.0); }`;
  const FS_SKY = `
precision mediump float;
uniform vec3 uR; uniform vec3 uU; uniform vec3 uF; uniform vec2 uTan; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uTime; uniform float uNight;
uniform sampler2D uCloud; varying vec2 vP;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec3 d = normalize(uF + uR * vP.x * uTan.x + uU * vP.y * uTan.y);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 c = mix(uHor, uTop, pow(clamp(h, 0.0, 1.0), 0.55));
  float s = max(dot(d, uSun), 0.0);
  c += uSunCol * (pow(s, 700.0) * 2.0 + pow(s, 14.0) * 0.16);
  if (uNight > 0.55 && d.y > 0.02) { vec2 g = floor(d.xz / (d.y + 0.25) * 240.0); float st = step(0.997, hash(g)); c += vec3(st) * (uNight - 0.55) * 2.2; }
  if (d.y > 0.0) {
    vec2 uv = d.xz / (d.y + 0.12) * 0.12 + vec2(uTime * 0.0015, uTime * 0.0008);
    float cl = texture2D(uCloud, uv).a * 0.75 + texture2D(uCloud, uv * 2.3 + 0.41).a * 0.35;
    cl = clamp(cl, 0.0, 1.0) * smoothstep(0.0, 0.2, d.y);
    vec3 cc = mix(uHor, vec3(1.0), 0.55) * (1.0 - uNight * 0.8);
    c = mix(c, cc, cl * 0.75);
  }
  gl_FragColor = vec4(c, 1.0);
}`;
  const VS_P = `
attribute vec3 aPos; attribute vec2 aCorner; attribute vec4 aCol; attribute float aSize;
uniform mat4 uVP; uniform vec3 uR; uniform vec3 uU;
varying vec2 vC; varying vec4 vCol; varying vec3 vW;
void main(){ vec3 w = aPos + (uR * aCorner.x + uU * aCorner.y) * aSize; vW = w; vC = aCorner; vCol = aCol; gl_Position = uVP * vec4(w, 1.0); }`;
  const FS_P = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uCam; uniform float uFog; uniform vec3 uFogCol; uniform float uAdd;
varying vec2 vC; varying vec4 vCol; varying vec3 vW;
void main(){
  float a = texture2D(uTex, vC * 0.5 + 0.5).a * vCol.a;
  float dist = length(vW - uCam); float f = clamp(1.0 - exp(-dist * uFog), 0.0, 1.0);
  vec3 c = uAdd > 0.5 ? vCol.rgb * (1.0 - f) : mix(vCol.rgb, uFogCol, f);
  gl_FragColor = vec4(c, a);
}`;

  function compile(gl, vs, fs) {
    const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, a = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const info = gl.getActiveUniform(p, i), name = info.name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, name); }
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES); i < n; i++) { const info = gl.getActiveAttrib(p, i); a[info.name] = gl.getAttribLocation(p, info.name); }
    return { p, u, a };
  }

  const MAT_TILE = { plank: 2, log: 1.6, stone: 3, stone_light: 3, dark_stone: 3, plaster: 3, thatch: 2.5, shingle: 2, roof_red: 2, roof_black: 2, moss: 2, wood_dark: 1.5, gate: 6, chronicle: 3.2, target: 1.4, board: 2.4, map: 3.2, chest: 1, bed: 2, carpet: 4, barrel: 1.2, fence: 2, straw: 2.6, rock: 3, bark: 2, leaves_big: 6 };
  const MAT_TEX = { leaves_big: 'leaves_big' };

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!globalThis.__kvShots }) || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL unavailable');
      this.gl = gl;
      this.u32 = !!gl.getExtension('OES_element_index_uint');
      this.inst = gl.getExtension('ANGLE_instanced_arrays');
      this.lit = compile(gl, VS_LIT, FS_LIT); this.bb = compile(gl, VS_BB, FS_BB); this.sky = compile(gl, VS_SKY, FS_SKY); this.pp = compile(gl, VS_P, FS_P);
      this.tex = {};
      const T = K.Tex.textures();
      for (const k in T) this.tex[k] = this.upload(T[k], k !== 'particle' && k !== 'blood' && k !== 'body', !!K.Tex.ALPHA[k]);
      this.skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
      this.dyn = new Mesh(60000); this.dynBuf = gl.createBuffer(); this.dynIdx = gl.createBuffer();
      this.dec = new Mesh(4000); this.decBuf = gl.createBuffer(); this.decIdx = gl.createBuffer();
      this.pBuf = gl.createBuffer(); this.pIdx = gl.createBuffer(); this.pData = new Float32Array(10 * 4 * 3000); this.pIdxData = null;
      this.instBuf = gl.createBuffer(); this.instData = new Float32Array(5 * 4000);
      this.particles = []; this.vp = M4.create(); this.proj = M4.create(); this.view = M4.create();
      this.nearR = 70; this.band = 12;
      this.lights = [];
      this.w = canvas.width; this.h = canvas.height;
    }
    resize(w, h) { this.canvas.width = w; this.canvas.height = h; this.w = w; this.h = h; }
    upload(img, repeat, alpha) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      const pot = (img.width & (img.width - 1)) === 0 && (img.height & (img.height - 1)) === 0;
      if (pot) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, alpha ? gl.LINEAR_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      const wrap = repeat && pot ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
      return t;
    }
    meshToGL(m) {
      const gl = this.gl, vb = gl.createBuffer(), ib = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, m.v.subarray(0, m.nv * FL), gl.STATIC_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      if (this.u32) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.i.subarray(0, m.ni), gl.STATIC_DRAW);
      else gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(m.i.subarray(0, m.ni)), gl.STATIC_DRAW);
      return { vb, ib, n: m.ni };
    }

    setWorld(W) {
      this.W = W;
      this.buildTerrain(W);
      this.buildRoads(W);
      this.buildStatic(W);
      this.buildTrees(W);
      this.buildWater(W);
    }
    groundColor(W, x, z) {
      const s = W.surfaceAt(x, z), zn = W.zoneAt(x, z), h = W.height(x, z), n = K.fbm(x / 23, z / 23, 5, 2), n2 = K.fbm(x / 7, z / 7, 9, 1);
      let c;
      if (s === 'water') c = [0.32, 0.33, 0.26];
      else if (s === 'road') c = [0.5, 0.42, 0.3];
      else if (s === 'snow') c = [0.92, 0.93, 0.96];
      else if (s === 'rock') c = [0.46 + n * 0.08, 0.44 + n * 0.08, 0.41 + n * 0.06];
      else if (s === 'sand') c = [0.74, 0.68, 0.5];
      else if (s === 'field') c = [0.74 + n * 0.08, 0.62 + n * 0.06, 0.28];
      else if (s === 'forest') c = [0.25 + n * 0.1, 0.32 + n * 0.08, 0.14 + n2 * 0.05];
      else if (zn === 'evil') c = [0.42 + n * 0.1, 0.42 + n * 0.06, 0.27];
      else if (zn === 'emp') c = [0.4 + n * 0.08, 0.47 + n * 0.06, 0.22];
      else c = [0.32 + n * 0.1, 0.44 + n * 0.08, 0.2 + n2 * 0.04];
      if (zn === 'evil' && h > 70 && s !== 'snow') { const k = smooth(70, 100, h); c = [lerp(c[0], 0.5, k), lerp(c[1], 0.48, k), lerp(c[2], 0.45, k)]; }
      const p = W.placeAt(x, z);
      if (p && s !== 'road' && s !== 'water' && (p.id === 'town' || p.id === 'fort' || p.id === 'palace')) { const d = Math.hypot(x - p.x, z - p.z) / p.r; const k = clamp(1.1 - d, 0, 0.55); c = [lerp(c[0], 0.5, k), lerp(c[1], 0.44, k), lerp(c[2], 0.32, k)]; }
      const dens = W.treeDensity(x, z);
      const ao = 1 - Math.min(0.42, dens * 0.18);
      return [c[0] * ao, c[1] * ao, c[2] * ao, 1];
    }
    buildTerrain(W) {
      const N = WD.N, C = WD.CELL, H = WD.HALF, CS = 25;
      const col = new Array(N * N), nrm = new Array(N * N);
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = -H + i * C, z = -H + j * C; col[j * N + i] = this.groundColor(W, x, z); nrm[j * N + i] = W.normal(x, z); }
      this.terrain = [];
      for (let cj = 0; cj < N - 1; cj += CS) for (let ci = 0; ci < N - 1; ci += CS) {
        const m = new Mesh((CS + 1) * (CS + 1) + 10);
        const i1 = Math.min(N - 1, ci + CS), j1 = Math.min(N - 1, cj + CS);
        const w = i1 - ci + 1;
        let miny = Infinity, maxy = -Infinity;
        for (let j = cj; j <= j1; j++) for (let i = ci; i <= i1; i++) {
          const x = -H + i * C, z = -H + j * C, y = W.H[j * N + i], n = nrm[j * N + i];
          miny = Math.min(miny, y); maxy = Math.max(maxy, y);
          m.grow(1, 0); m.vert(x, y, z, n[0], n[1], n[2], x / 9, z / 9, col[j * N + i]);
        }
        for (let j = 0; j < j1 - cj; j++) for (let i = 0; i < i1 - ci; i++) {
          const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
          m.grow(0, 6); const I = m.i; I[m.ni++] = a; I[m.ni++] = c; I[m.ni++] = b; I[m.ni++] = b; I[m.ni++] = c; I[m.ni++] = d;
        }
        const g = this.meshToGL(m);
        const cx = -H + (ci + i1) / 2 * C, cz = -H + (cj + j1) / 2 * C;
        g.cx = cx; g.cy = (miny + maxy) / 2; g.cz = cz; g.r = Math.hypot((i1 - ci) * C / 2, (j1 - cj) * C / 2, (maxy - miny) / 2);
        this.terrain.push(g);
      }
    }
    buildRoads(W) {
      const m = new Mesh(20000);
      for (const r of WD.ROADS) {
        const pts = r.dense; let along = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
          const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, w = 3.4;
          const p = (x, z, side) => { const px = x + nx * w * side, pz = z + nz * w * side; return [px, Math.max(W.height(px, pz), WD.WATER_Y + 0.05) + 0.07, pz]; };
          const c = [1, 1, 1, 1];
          m.quad([p(ax, az, 1), p(bx, bz, 1), p(bx, bz, -1), p(ax, az, -1)], [0, 1, 0], [[1, along / 6], [1, (along + l) / 6], [0, (along + l) / 6], [0, along / 6]], c);
          along += l;
        }
      }
      this.roads = this.meshToGL(m);
    }
    buildStatic(W) {
      const byMat = {};
      this.burnMeshes = {}; this.gateMeshes = {};
      const get = (p) => {
        if (p.gate) return this.gateMeshes[p.gate] || (this.gateMeshes[p.gate] = { m: new Mesh(256), mat: p.mat });
        if (p.burn) { const k = p.burn + '|' + p.mat; return this.burnMeshes[k] || (this.burnMeshes[k] = { m: new Mesh(512), mat: p.mat, burn: p.burn }); }
        return byMat[p.mat] || (byMat[p.mat] = { m: new Mesh(2048), mat: p.mat });
      };
      for (const p of W.parts) {
        const g = get(p), m = g.m, t = MAT_TILE[p.mat] || 2;
        const c = [1, 1, 1, 1];
        if (p.s === 'box') {
          if (p.mat === 'chronicle' || p.mat === 'map' || p.mat === 'board' || p.mat === 'chest') m.boxY(p.x, p.y, p.z, p.w, p.h, p.d, p.rot, c, Math.max(p.w, p.h));
          else m.boxY(p.x, p.y, p.z, p.w, p.h, p.d, p.rot, c, t);
        }
        else if (p.s === 'prism') m.prism(p.x, p.y, p.z, p.w, p.h, p.d, p.rot, c, t, true);
        else if (p.s === 'ramp') m.ramp(p.x, p.y, p.z, p.w, p.h, p.d, p.rot, c, t);
        else if (p.s === 'cyl') m.cyl(p.x, p.y, p.z, p.w / 2, p.h, c, p.mat === 'target' ? 12 : 8, t, null, p.mat === 'target');
        else if (p.s === 'sphere') m.sphere(p.x, p.y + p.h / 2, p.z, p.w / 2, p.h / 2, p.d / 2, [0.85, 0.95, 0.85, 1], 9, true);
      }
      this.statics = Object.values(byMat).map(g => Object.assign(this.meshToGL(g.m), { mat: g.mat }));
      for (const k in this.burnMeshes) { const g = this.burnMeshes[k]; this.burnMeshes[k] = Object.assign(this.meshToGL(g.m), { mat: g.mat, burn: g.burn }); }
      for (const k in this.gateMeshes) { const g = this.gateMeshes[k]; this.gateMeshes[k] = Object.assign(this.meshToGL(g.m), { mat: g.mat }); }
      this.signs = [];
      const NAMES = { healer: 'Знахарка', pros: 'Деревяшкин и сын', smith: 'Кузня', store: 'Всё для дороги', inn: 'Корова и колесо', headman: 'Староста', quarter: 'Интендант' };
      for (const s of W.signs) {
        const m = new Mesh(32);
        const o = s.o, d = s.d, [x, z] = W.toWorld(o, 0, d / 2 + 0.25);
        m.boxY(x, o.y + 2.0, z, 2.2, 0.55, 0.06, o.rot, [1, 1, 1, 1], 2.2);
        const g = this.meshToGL(m); g.tex = this.upload(K.Tex.signTex(NAMES[s.id] || s.id), false, false);
        this.signs.push(g);
      }
    }
    buildWater(W) {
      const L = W.lake, m = new Mesh(64), r = L.r + 40;
      m.quad([[L.x - r, WD.WATER_Y, L.z + r], [L.x + r, WD.WATER_Y, L.z + r], [L.x + r, WD.WATER_Y, L.z - r], [L.x - r, WD.WATER_Y, L.z - r]], [0, 1, 0], [[0, 0], [r / 6, 0], [r / 6, r / 6], [0, r / 6]], [1, 1, 1, 1]);
      this.water = this.meshToGL(m);
    }
    buildTrees(W) {
      const gl = this.gl;
      this.treeGL = [];
      for (let s = 0; s < WD.SPECIES.length; s++) {
        const tm = K.Models.treeMesh(s);
        this.treeGL.push({ bark: this.meshToGL(tm.bark), leaf: this.meshToGL(tm.leaf), barkTex: s === 2 ? 'birch' : s === 4 ? 'barkdark' : 'bark', leafTex: s === 0 || s === 3 ? 'needles' : s === 2 ? 'leaves_birch' : 'leaves' });
      }
      this.makeImpostors();
      this.bbChunks = [];
      for (let c = 0; c < W.tchunks.length; c++) {
        const list = W.tchunks[c]; if (!list.length) { this.bbChunks.push(null); continue; }
        const n = list.length, v = new Float32Array(n * 4 * 10), idx = this.u32 ? new Uint32Array(n * 6) : new Uint16Array(n * 6);
        let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity, miny = Infinity, maxy = -Infinity;
        list.forEach((ti, k) => {
          const sp = W.tsp[ti], s = W.ts[ti], sz = this.impSize[sp];
          const w = sz[0] * s, h = sz[1] * s, cell = sp * this.impCW, cw = this.impCW, tint = K.hash2(ti, 3, 1);
          const corners = [[-1, 0], [1, 0], [1, 1], [-1, 1]];
          corners.forEach(([cx, cy], q) => { const o = (k * 4 + q) * 10; v[o] = W.tx[ti]; v[o + 1] = W.ty[ti]; v[o + 2] = W.tz[ti]; v[o + 3] = cx; v[o + 4] = cy; v[o + 5] = w; v[o + 6] = h; v[o + 7] = cell; v[o + 8] = cw; v[o + 9] = tint; });
          const b = k * 4; idx.set([b, b + 1, b + 2, b, b + 2, b + 3], k * 6);
          minx = Math.min(minx, W.tx[ti]); maxx = Math.max(maxx, W.tx[ti]); minz = Math.min(minz, W.tz[ti]); maxz = Math.max(maxz, W.tz[ti]); miny = Math.min(miny, W.ty[ti]); maxy = Math.max(maxy, W.ty[ti] + h);
        });
        if (!this.u32 && n * 4 > 65535) { this.bbChunks.push(null); continue; }
        const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, v, gl.STATIC_DRAW);
        const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
        this.bbChunks.push({ vb, ib, n: n * 6, cx: (minx + maxx) / 2, cy: (miny + maxy) / 2, cz: (minz + maxz) / 2, r: Math.hypot(maxx - minx, maxy - miny, maxz - minz) / 2 + 4 });
      }
    }
    makeImpostors() {
      const gl = this.gl, n = WD.SPECIES.length, CW = 128, CH = 256;
      this.impN = n; this.impSize = [];
      const W = 1024, Hh = 256;
      this.impCW = CW / W;
      const fb = gl.createFramebuffer(), tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, Hh, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const rb = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, W, Hh);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
      gl.viewport(0, 0, W, Hh); gl.clearColor(0.3, 0.38, 0.2, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      const P = this.lit; gl.useProgram(P.p);
      for (let s = 0; s < n; s++) {
        const H = WD.SPECIES[s].h * 1.08, half = Math.max(H * 0.25, s === 1 ? 5.2 : s === 0 ? 2.6 : s === 2 ? 2.4 : s === 3 ? 2.2 : 2.0);
        const halfW = Math.max(half, H * CW / CH / 2);
        this.impSize.push([halfW * 2, halfW * 2 * CH / CW]);
        gl.viewport(s * CW, 0, CW, CH);
        const proj = M4.ortho(M4.create(), -halfW, halfW, 0, halfW * 2 * CH / CW, -50, 50);
        const view = M4.lookAt(M4.create(), 0, 0, 10, 0, 0, 0);
        const vp = M4.mul(M4.create(), proj, view);
        this.setLit(vp, [0, 0, 30], { sun: [0.45, 0.55, 0.7], sunCol: [0.82, 0.78, 0.68], amb: [0.46, 0.5, 0.5], fogCol: [0, 0, 0], fog: 0 }, []);
        gl.uniform1f(P.u.uFlat, 1);
        const t = this.treeGL[s];
        this.drawMesh(t.bark, this.tex[t.barkTex], 0);
        this.drawMesh(t.leaf, this.tex[t.leafTex], 0.5);
        gl.uniform1f(P.u.uFlat, 0);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, tex); gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      this.impTex = tex;
    }

    setLit(vp, cam, env, lights) {
      const gl = this.gl, P = this.lit;
      gl.useProgram(P.p);
      gl.uniformMatrix4fv(P.u.uVP, false, vp);
      gl.uniform3fv(P.u.uSun, env.sun); gl.uniform3fv(P.u.uSunCol, env.sunCol); gl.uniform3fv(P.u.uAmb, env.amb);
      gl.uniform3fv(P.u.uFogCol, env.fogCol); gl.uniform1f(P.u.uFog, env.fog); gl.uniform3fv(P.u.uCam, cam);
      gl.uniform4f(P.u.uTint, 0, 0, 0, 0); gl.uniform3f(P.u.uDither, 0, 0, 1); gl.uniform1f(P.u.uInst, 0); gl.uniform1f(P.u.uFlat, 0); gl.uniform1f(P.u.uBlend, 0);
      const lp = new Float32Array(MAXL * 3), lc = new Float32Array(MAXL * 4);
      lights.slice(0, MAXL).forEach((l, i) => { lp.set([l.x, l.y, l.z], i * 3); lc.set([l.r, l.g, l.b, l.rad], i * 4); });
      gl.uniform3fv(P.u.uLP, lp); gl.uniform4fv(P.u.uLC, lc);
      gl.uniform1i(P.u.uTex, 0);
    }
    bindLit(vb) {
      const gl = this.gl, a = this.lit.a, S = FL * 4;
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.enableVertexAttribArray(a.aPos); gl.vertexAttribPointer(a.aPos, 3, gl.FLOAT, false, S, 0);
      gl.enableVertexAttribArray(a.aNrm); gl.vertexAttribPointer(a.aNrm, 3, gl.FLOAT, false, S, 12);
      gl.enableVertexAttribArray(a.aUV); gl.vertexAttribPointer(a.aUV, 2, gl.FLOAT, false, S, 24);
      gl.enableVertexAttribArray(a.aCol); gl.vertexAttribPointer(a.aCol, 4, gl.FLOAT, false, S, 32);
      if (a.aOff >= 0) { gl.disableVertexAttribArray(a.aOff); gl.vertexAttrib4f(a.aOff, 0, 0, 0, 1); }
      if (a.aRot >= 0) { gl.disableVertexAttribArray(a.aRot); gl.vertexAttrib1f(a.aRot, 0); }
    }
    drawMesh(g, tex, alphaTest) {
      const gl = this.gl;
      this.bindLit(g.vb);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1f(this.lit.u.uAlphaTest, alphaTest || 0);
      gl.drawElements(gl.TRIANGLES, g.n, this.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    }

    env(game) {
      const t = game.time, h = (t / 60) % 24;
      const day = game.daylight();
      const ang = (h - 6) / 12 * Math.PI;
      const sy = Math.sin(ang), sx = Math.cos(ang);
      const sun = day > 0.02 ? [sx * 0.8, Math.max(0.12, sy), 0.35] : [0.3, 0.7, -0.4];
      const l = Math.hypot(...sun); sun[0] /= l; sun[1] /= l; sun[2] /= l;
      const dusk = clamp(1 - Math.abs(sy) * 3, 0, 1) * (day > 0.02 ? 1 : 0);
      const dk = Math.min(1, day);
      const sunCol = day > 0.02 ? [lerp(0.82, 0.92, 1 - dusk) * dk, lerp(0.8, 0.55, dusk) * dk, lerp(0.72, 0.34, dusk) * dk] : [0.12, 0.14, 0.22];
      const amb = [lerp(0.13, 0.36, dk), lerp(0.15, 0.38, dk), lerp(0.24, 0.44, dk)];
      const hor = [lerp(0.08, lerp(0.72, 0.95, dusk), day), lerp(0.1, lerp(0.8, 0.62, dusk), day), lerp(0.18, lerp(0.88, 0.45, dusk), day)];
      const top = [lerp(0.02, 0.32, day), lerp(0.03, 0.5, day), lerp(0.08, 0.85, day)];
      return { sun, sunCol, amb, fogCol: hor, hor, top, fog: game.isNight() ? 0.0045 : 0.0026, night: 1 - day };
    }

    collectLights(game, cam) {
      const L = [];
      const W = game.world;
      const push = (x, y, z, r, g, b, rad) => { const d = Math.hypot(x - cam[0], z - cam[2]); if (d < 90) L.push({ x, y, z, r, g, b, rad, d }); };
      const night = game.isNight() ? 1 : 0.35;
      const fl = 0.85 + Math.sin(game.time * 31) * 0.08 + Math.sin(game.time * 47) * 0.06;
      for (const a of game.actors) if (a.torch && !a.dead && a.joints) push(a.joints[18], a.joints[19] + 0.4, a.joints[20], 1.2 * fl * night, 0.7 * fl * night, 0.3 * night, 9);
      for (const u of W.uses) if (u.kind === 'fire') push(u.x, u.y + 0.6, u.z, 1.3 * fl * night, 0.65 * fl * night, 0.25 * night, 10);
      for (const id in W.burn) { const b = W.burn[id]; if (b.state === 'fire') push(b.x, W.height(b.x, b.z) + 2.5, b.z, 2.2 * fl, 1.0 * fl, 0.35, 18); }
      L.sort((a, b) => a.d - b.d);
      return L;
    }

    emit(type, x, y, z, n, o) {
      const P = this.particles, R = Math.random;
      if (P.length > 2600) return;
      for (let i = 0; i < n; i++) {
        if (type === 'blood') P.push({ x, y, z, vx: (R() - 0.5) * 3 + (o && o.dx ? o.dx * 2 : 0), vy: R() * 2.5 + 0.5, vz: (R() - 0.5) * 3 + (o && o.dz ? o.dz * 2 : 0), life: 0.6 + R() * 0.5, t: 0, s: 0.05 + R() * 0.06, c: [0.55, 0.03, 0.02, 1], g: 9, add: 0 });
        else if (type === 'spark') P.push({ x, y, z, vx: (R() - 0.5) * 5, vy: R() * 3, vz: (R() - 0.5) * 5, life: 0.25 + R() * 0.2, t: 0, s: 0.04, c: [1, 0.85, 0.4, 1], g: 6, add: 1 });
        else if (type === 'fire') P.push({ x: x + (R() - 0.5) * (o ? o.r : 0.3), y: y + R() * (o ? o.h : 0.2), z: z + (R() - 0.5) * (o ? o.r : 0.3), vx: (R() - 0.5) * 0.4, vy: 1.2 + R() * 1.5, vz: (R() - 0.5) * 0.4, life: 0.5 + R() * 0.6, t: 0, s: (o && o.s) || 0.25 + R() * 0.25, c: [1, 0.55 + R() * 0.3, 0.15, 0.9], g: -0.5, add: 1, shrink: 1 });
        else if (type === 'smoke') P.push({ x: x + (R() - 0.5) * (o ? o.r : 0.3), y, z: z + (R() - 0.5) * (o ? o.r : 0.3), vx: 0.4 + (R() - 0.5) * 0.4, vy: 1.0 + R(), vz: (R() - 0.5) * 0.4, life: 2.5 + R() * 2, t: 0, s: (o && o.s) || 0.6 + R() * 0.6, c: [0.2, 0.19, 0.18, 0.5], g: -0.2, add: 0, grow: 1 });
        else if (type === 'dust') P.push({ x, y, z, vx: (R() - 0.5) * 1, vy: R() * 0.5, vz: (R() - 0.5) * 1, life: 0.6 + R() * 0.4, t: 0, s: 0.2 + R() * 0.2, c: [0.55, 0.5, 0.42, 0.35], g: 0.5, add: 0, grow: 1 });
        else if (type === 'chip') P.push({ x, y, z, vx: (R() - 0.5) * 4, vy: R() * 3, vz: (R() - 0.5) * 4, life: 0.5 + R() * 0.3, t: 0, s: 0.05, c: [0.55, 0.38, 0.2, 1], g: 9, add: 0 });
      }
    }
    stepParticles(dt, game) {
      const P = this.particles, W = game.world;
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i]; p.t += dt;
        if (p.t > p.life) { P.splice(i, 1); continue; }
        p.vy -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.g > 3) { const fl = W.floorAt(p.x, p.z, p.y + 0.2, 0.3); if (p.y < fl) { p.y = fl + 0.01; p.vx = p.vy = p.vz = 0; } }
      }
    }

    render(game, cam, opts) {
      const gl = this.gl, W = game.world;
      const o = opts || {};
      this.nearR = o.nearTrees || 70;
      const fov = (cam.fov || 70) * Math.PI / 180, asp = this.w / this.h;
      M4.perspective(this.proj, fov, asp, 0.07, 900);
      const cp = Math.cos(cam.pitch), fx = Math.sin(cam.yaw) * cp, fy = Math.sin(cam.pitch), fz = -Math.cos(cam.yaw) * cp;
      M4.lookAt(this.view, cam.x, cam.y, cam.z, cam.x + fx, cam.y + fy, cam.z + fz);
      M4.mul(this.vp, this.proj, this.view);
      const planes = frustumPlanes(this.vp);
      const camP = [cam.x, cam.y, cam.z];
      const env = this.env(game);
      this.lastEnv = env;
      gl.viewport(0, 0, this.w, this.h);
      gl.clearColor(env.hor[0], env.hor[1], env.hor[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.drawSky(cam, fx, fy, fz, fov, asp, env, game);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.BLEND);
      const lights = this.collectLights(game, camP);
      this.setLit(this.vp, camP, env, lights);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      for (const t of this.terrain) if (sphereVisible(planes, t.cx, t.cy, t.cz, t.r) && Math.hypot(t.cx - cam.x, t.cz - cam.z) < 900) this.drawMesh(t, this.tex.ground, 0);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1, -2);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.uniform1f(this.lit.u.uBlend, 1);
      this.drawMesh(this.roads, this.tex.dirt, 0.02);
      gl.disable(gl.BLEND); gl.uniform1f(this.lit.u.uBlend, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      for (const s of this.statics) this.drawMesh(s, this.tex[MAT_TEX[s.mat] || s.mat] || this.tex.plank, s.mat === 'leaves_big' ? 0.5 : 0);
      for (const k in this.burnMeshes) {
        const g = this.burnMeshes[k], b = W.burn[g.burn];
        if (b && b.state === 'ruin') gl.uniform4f(this.lit.u.uTint, 0.06, 0.05, 0.04, 0.82);
        else if (b && b.state === 'fire') gl.uniform4f(this.lit.u.uTint, 0.2, 0.08, 0.02, clamp(b.fire / 75, 0, 0.7));
        this.drawMesh(g, this.tex[g.mat] || this.tex.plank, 0);
        gl.uniform4f(this.lit.u.uTint, 0, 0, 0, 0);
      }
      for (const k in this.gateMeshes) { const gt = W.gates[k]; if (gt && gt.closed && gt.hp > 0) { const dmg = 1 - gt.hp / gt.max; gl.uniform4f(this.lit.u.uTint, 0.1, 0.07, 0.05, dmg * 0.5); this.drawMesh(this.gateMeshes[k], this.tex.gate, 0); gl.uniform4f(this.lit.u.uTint, 0, 0, 0, 0); } }
      for (const s of this.signs) this.drawMesh(s, s.tex, 0);
      this.drawTrees(game, cam, planes, env, camP);
      this.setLit(this.vp, camP, env, lights);
      this.buildDynamic(game, cam, planes, o);
      if (this.dyn.nv) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.dynBuf); gl.bufferData(gl.ARRAY_BUFFER, this.dyn.v.subarray(0, this.dyn.nv * FL), gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.dynIdx);
        if (this.u32) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.dyn.i.subarray(0, this.dyn.ni), gl.DYNAMIC_DRAW);
        else gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.dyn.i.subarray(0, this.dyn.ni)), gl.DYNAMIC_DRAW);
        this.drawMesh({ vb: this.dynBuf, ib: this.dynIdx, n: this.dyn.ni }, this.tex.body, 0);
      }
      this.drawDecals(game, cam);
      this.drawWater(env);
      this.drawParticles(game, cam, env, fx, fy, fz);
    }

    drawSky(cam, fx, fy, fz, fov, asp, env, game) {
      const gl = this.gl, P = this.sky;
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.useProgram(P.p);
      const f = [fx, fy, fz];
      const right = [Math.cos(cam.yaw), 0, Math.sin(cam.yaw)];
      const up = [right[1] * f[2] - right[2] * f[1], right[2] * f[0] - right[0] * f[2], right[0] * f[1] - right[1] * f[0]];
      gl.uniform3fv(P.u.uR, right); gl.uniform3fv(P.u.uU, up); gl.uniform3fv(P.u.uF, f);
      gl.uniform2f(P.u.uTan, Math.tan(fov / 2) * asp, Math.tan(fov / 2));
      gl.uniform3fv(P.u.uTop, env.top); gl.uniform3fv(P.u.uHor, env.hor); gl.uniform3fv(P.u.uSun, env.sun); gl.uniform3fv(P.u.uSunCol, env.sunCol);
      gl.uniform1f(P.u.uTime, game.time * 60); gl.uniform1f(P.u.uNight, env.night);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.cloud); gl.uniform1i(P.u.uCloud, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.enableVertexAttribArray(P.a.aP); gl.vertexAttribPointer(P.a.aP, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.disableVertexAttribArray(P.a.aP);
    }

    drawTrees(game, cam, planes, env, camP) {
      const gl = this.gl, W = game.world, nearR = this.nearR, band = this.band;
      const B = this.bb;
      gl.useProgram(B.p);
      gl.uniformMatrix4fv(B.u.uVP, false, this.vp);
      gl.uniform3f(B.u.uCamR, Math.cos(cam.yaw), 0, Math.sin(cam.yaw));
      gl.uniform3fv(B.u.uAmb, env.amb); gl.uniform3fv(B.u.uSunCol, env.sunCol); gl.uniform3fv(B.u.uFogCol, env.fogCol); gl.uniform1f(B.u.uFog, env.fog); gl.uniform3fv(B.u.uCam, camP);
      gl.uniform3f(B.u.uDither, 2, nearR, band);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.impTex); gl.uniform1i(B.u.uTex, 0);
      const S = 40;
      for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);
      gl.enableVertexAttribArray(B.a.aBase); gl.enableVertexAttribArray(B.a.aCS); gl.enableVertexAttribArray(B.a.aCell);
      let drawn = 0;
      for (const c of this.bbChunks) {
        if (!c) continue;
        const d = Math.hypot(c.cx - cam.x, c.cz - cam.z);
        if (d - c.r > 820) continue;
        if (d + c.r < nearR - band) continue;
        if (!sphereVisible(planes, c.cx, c.cy, c.cz, c.r)) continue;
        gl.bindBuffer(gl.ARRAY_BUFFER, c.vb);
        gl.vertexAttribPointer(B.a.aBase, 3, gl.FLOAT, false, S, 0);
        gl.vertexAttribPointer(B.a.aCS, 4, gl.FLOAT, false, S, 12);
        gl.vertexAttribPointer(B.a.aCell, 3, gl.FLOAT, false, S, 28);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ib);
        gl.drawElements(gl.TRIANGLES, c.n, this.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
        drawn++;
      }
      gl.disableVertexAttribArray(B.a.aBase); gl.disableVertexAttribArray(B.a.aCS); gl.disableVertexAttribArray(B.a.aCell);
      this.stats = { bbChunks: drawn };
      const list = W.nearTrees(cam.x, cam.z, nearR + 2, this._nt || (this._nt = []));
      const per = WD.SPECIES.map(() => []);
      for (const i of list) {
        if (!sphereVisible(planes, W.tx[i], W.ty[i] + W.th[i] * 0.5, W.tz[i], W.th[i] * 0.6 + 2)) continue;
        per[W.tsp[i]].push(i);
      }
      this.stats.near = list.length;
      const P = this.lit;
      this.setLit(this.vp, camP, env, this.collectLights(game, camP));
      gl.uniform3f(P.u.uDither, 1, nearR, band);
      gl.uniform1f(P.u.uInst, 1);
      for (let s = 0; s < per.length; s++) {
        const ids = per[s]; if (!ids.length) continue;
        const t = this.treeGL[s];
        if (this.inst) {
          const n = Math.min(ids.length, 4000), data = this.instData;
          for (let k = 0; k < n; k++) { const i = ids[k]; data[k * 5] = W.tx[i]; data[k * 5 + 1] = W.ty[i]; data[k * 5 + 2] = W.tz[i]; data[k * 5 + 3] = W.ts[i]; data[k * 5 + 4] = W.trot[i]; }
          for (const [g, tex, at] of [[t.bark, this.tex[t.barkTex], 0], [t.leaf, this.tex[t.leafTex], 0.5]]) {
            this.bindLit(g.vb);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf); gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 5), gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(P.a.aOff); gl.vertexAttribPointer(P.a.aOff, 4, gl.FLOAT, false, 20, 0); this.inst.vertexAttribDivisorANGLE(P.a.aOff, 1);
            gl.enableVertexAttribArray(P.a.aRot); gl.vertexAttribPointer(P.a.aRot, 1, gl.FLOAT, false, 20, 16); this.inst.vertexAttribDivisorANGLE(P.a.aRot, 1);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1f(P.u.uAlphaTest, at);
            this.inst.drawElementsInstancedANGLE(gl.TRIANGLES, g.n, this.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0, n);
            this.inst.vertexAttribDivisorANGLE(P.a.aOff, 0); this.inst.vertexAttribDivisorANGLE(P.a.aRot, 0);
            gl.disableVertexAttribArray(P.a.aOff); gl.disableVertexAttribArray(P.a.aRot);
          }
        } else {
          for (const [g, tex, at] of [[t.bark, this.tex[t.barkTex], 0], [t.leaf, this.tex[t.leafTex], 0.5]]) {
            this.bindLit(g.vb); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ib);
            gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1f(P.u.uAlphaTest, at);
            for (const i of ids) { gl.vertexAttrib4f(P.a.aOff, W.tx[i], W.ty[i], W.tz[i], W.ts[i]); gl.vertexAttrib1f(P.a.aRot, W.trot[i]); gl.drawElements(gl.TRIANGLES, g.n, this.u32 ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0); }
          }
        }
      }
      gl.uniform1f(P.u.uInst, 0); gl.uniform3f(P.u.uDither, 0, 0, 1);
    }

    buildDynamic(game, cam, planes, o) {
      const mb = this.dyn; mb.reset();
      for (const a of game.actors) {
        if (!a.joints) continue;
        const d = Math.hypot(a.x - cam.x, a.z - cam.z);
        if (d > 125) continue;
        if (!sphereVisible(planes, a.x, a.y + 1, a.z, 2.2)) continue;
        const Jt = a.dead && a.rag ? a.rag.p : a.joints;
        if (a.player && o.firstPerson) { K.Models.actorGeom(mb, a, Jt, { firstPerson: true, skip: { head: true } }); continue; }
        K.Models.actorGeom(mb, a, Jt, {});
      }
      for (const pc of game.pieces) { const q = pc.rag.p; if (Math.hypot(q[0] - cam.x, q[2] - cam.z) < 70) K.Models.pieceGeom(mb, pc); }
      for (const w of game.wagons) {
        if (w.gone) continue;
        if (Math.hypot(w.x - cam.x, w.z - cam.z) > 150 || !sphereVisible(planes, w.x, w.y + 1, w.z, 4)) continue;
        if (w.moving) w.spin = (w.spin || 0) + 0.035;
        K.Models.wagonGeom(mb, w);
      }
      for (const d of game.drops) if (Math.hypot(d.x - cam.x, d.z - cam.z) < 50) K.Models.dropGeom(mb, d);
      for (const s of game.stuck) if (Math.hypot(s.x - cam.x, s.z - cam.z) < 50) { const l = Math.hypot(s.vx, s.vy, s.vz) || 1; K.Models.arrowGeom(mb, s.x + s.vx / l * 0.25, s.y + s.vy / l * 0.25, s.z + s.vz / l * 0.25, s.vx, s.vy, s.vz); }
      for (const pr of game.projectiles) K.Models.arrowGeom(mb, pr.x, pr.y, pr.z, pr.vx, pr.vy, pr.vz);
    }

    drawDecals(game, cam) {
      const gl = this.gl, mb = this.dec, sh = this.shadowMesh || (this.shadowMesh = new Mesh(2000));
      mb.reset(); sh.reset();
      const flat = (m, x, y, z, r, rot, col) => { const c = Math.cos(rot) * r, s = Math.sin(rot) * r; m.quad([[x - c - s, y, z - s + c], [x + c - s, y, z + s + c], [x + c + s, y, z + s - c], [x - c + s, y, z - s - c]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], col); };
      for (const d of game.decals) {
        if (Math.hypot(d.x - cam.x, d.z - cam.z) > 60) continue;
        flat(mb, d.x, d.y + 0.03, d.z, d.r, d.rot, [1, 1, 1, d.kind === 'drip' ? 0.8 : 1]);
      }
      for (const a of game.actors) {
        if (a.dead || !a.joints || Math.hypot(a.x - cam.x, a.z - cam.z) > 50) continue;
        const r = a.quad ? (a.kind === 'cow' ? 1.0 : 0.55) : 0.48, y = game.world.floorAt(a.x, a.z, a.y + 0.3, 0.5) + 0.04;
        flat(sh, a.x, y, a.z, r, 0, [0, 0, 0, 0.5]);
      }
      for (const w of game.wagons) if (!w.gone && Math.hypot(w.x - cam.x, w.z - cam.z) < 60) { flat(sh, w.x, w.y + 0.05, w.z, 2.0, w.yaw, [0, 0, 0, 0.45]); }
      const L = this.lit;
      gl.useProgram(L.p);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4);
      gl.uniform1f(L.u.uBlend, 1); gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
      for (const [m, tex] of [[sh, this.tex.particle], [mb, this.tex.blood]]) {
        if (!m.nv) continue;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.decBuf); gl.bufferData(gl.ARRAY_BUFFER, m.v.subarray(0, m.nv * FL), gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.decIdx);
        if (this.u32) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.i.subarray(0, m.ni), gl.DYNAMIC_DRAW); else gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(m.i.subarray(0, m.ni)), gl.DYNAMIC_DRAW);
        this.drawMesh({ vb: this.decBuf, ib: this.decIdx, n: m.ni }, tex, 0.01);
      }
      gl.uniform1f(L.u.uBlend, 0);
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.depthMask(true); gl.disable(gl.BLEND);
    }
    drawWater(env) {
      const gl = this.gl, L = this.lit;
      gl.useProgram(L.p);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.uniform1f(L.u.uBlend, 1);
      gl.uniform4f(L.u.uTint, env.hor[0] * 0.4 + 0.08, env.hor[1] * 0.45 + 0.15, env.hor[2] * 0.5 + 0.22, 0.3);
      this.drawMesh(this.water, this.tex.water, 0);
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uBlend, 0);
      gl.disable(gl.BLEND);
    }
    drawParticles(game, cam, env, fx, fy, fz) {
      const P = this.particles;
      if (!P.length) return;
      const gl = this.gl, pr = this.pp;
      const n = Math.min(P.length, 3000), d = this.pData.length >= n * 40 ? this.pData : (this.pData = new Float32Array(n * 40));
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      let k = 0, nAlpha = 0;
      for (const add of [0, 1]) {
        for (let i = 0; i < n; i++) {
          const p = P[i]; if (p.add !== add) continue;
          const a = p.t / p.life, s = p.s * (p.grow ? 1 + a * 2.5 : p.shrink ? 1 - a * 0.7 : 1), al = p.c[3] * (1 - a);
          for (const [cx, cy] of corners) { const o = k * 10; d[o] = p.x; d[o + 1] = p.y; d[o + 2] = p.z; d[o + 3] = cx; d[o + 4] = cy; d[o + 5] = p.c[0]; d[o + 6] = p.c[1]; d[o + 7] = p.c[2]; d[o + 8] = al; d[o + 9] = s; k++; }
        }
        if (!add) nAlpha = k / 4;
      }
      if (!this.pIdxData) { this.pIdxData = new Uint16Array(3000 * 6); for (let i = 0; i < 3000; i++) this.pIdxData.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.pIdxData, gl.STATIC_DRAW); }
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      const right = [Math.cos(cam.yaw), 0, Math.sin(cam.yaw)];
      const up = [right[1] * fz - right[2] * fy, right[2] * fx - right[0] * fz, right[0] * fy - right[1] * fx];
      gl.uniform3fv(pr.u.uR, right); gl.uniform3fv(pr.u.uU, up);
      gl.uniform3f(pr.u.uCam, cam.x, cam.y, cam.z); gl.uniform1f(pr.u.uFog, env.fog); gl.uniform3fv(pr.u.uFogCol, env.fogCol);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.particle); gl.uniform1i(pr.u.uTex, 0);
      for (let i = 0; i < 8; i++) gl.disableVertexAttribArray(i);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuf); gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, k * 10), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(pr.a.aPos); gl.vertexAttribPointer(pr.a.aPos, 3, gl.FLOAT, false, 40, 0);
      gl.enableVertexAttribArray(pr.a.aCorner); gl.vertexAttribPointer(pr.a.aCorner, 2, gl.FLOAT, false, 40, 12);
      gl.enableVertexAttribArray(pr.a.aCol); gl.vertexAttribPointer(pr.a.aCol, 4, gl.FLOAT, false, 40, 20);
      gl.enableVertexAttribArray(pr.a.aSize); gl.vertexAttribPointer(pr.a.aSize, 1, gl.FLOAT, false, 40, 36);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pIdx);
      gl.enable(gl.BLEND); gl.depthMask(false);
      if (nAlpha) { gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.uniform1f(pr.u.uAdd, 0); gl.drawElements(gl.TRIANGLES, nAlpha * 6, gl.UNSIGNED_SHORT, 0); }
      const nAdd = k / 4 - nAlpha;
      if (nAdd) { gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.uniform1f(pr.u.uAdd, 1); gl.drawElements(gl.TRIANGLES, nAdd * 6, gl.UNSIGNED_SHORT, nAlpha * 12); }
      gl.depthMask(true); gl.disable(gl.BLEND);
      gl.disableVertexAttribArray(pr.a.aPos); gl.disableVertexAttribArray(pr.a.aCorner); gl.disableVertexAttribArray(pr.a.aCol); gl.disableVertexAttribArray(pr.a.aSize);
    }
  }

  K.Renderer = Renderer;
})(globalThis.Korovany = globalThis.Korovany || {});
