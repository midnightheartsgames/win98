(function (S) {
  'use strict';
  const { M4, Mesh, clamp, rgb, lerp } = S;
  const MAXL = 8;

  const VS_LIT = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP; uniform mat4 uM; uniform vec2 uUVOff;
varying vec3 vW; varying vec3 vN; varying vec2 vUV; varying vec4 vC;
void main(){ vec4 w = uM * vec4(aPos, 1.0); vW = w.xyz; vN = (uM * vec4(aNrm, 0.0)).xyz; vUV = aUV + uUVOff; vC = aCol; gl_Position = uVP * w; }`;
  const FS_LIT = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uAmb; uniform vec3 uFogCol; uniform float uFog; uniform float uFogMax;
uniform vec3 uCam; uniform float uBaked; uniform vec4 uTint; uniform float uAlpha; uniform float uAlphaTest; uniform float uShadow; uniform float uGlow;
uniform vec3 uLP[${MAXL}]; uniform vec4 uLC[${MAXL}];
varying vec3 vW; varying vec3 vN; varying vec2 vUV; varying vec4 vC;
void main(){
  vec4 t = texture2D(uTex, vUV);
  if (t.a < uAlphaTest) discard;
  vec3 n = normalize(vN);
  vec3 dyn = vec3(0.0);
  for (int i = 0; i < ${MAXL}; i++) {
    vec3 d = uLP[i] - vW; float l = length(d) + 0.001; float a = max(0.0, 1.0 - l / uLC[i].w);
    dyn += uLC[i].rgb * a * a * (0.35 + 0.65 * max(dot(n, d / l), 0.0));
  }
  vec3 lit;
  if (uBaked > 0.5) {
    if (vC.a > 1.5) lit = vC.rgb * (1.0 + uGlow);
    else { float nd = max(dot(n, uSun), 0.0); lit = vC.rgb * (uAmb + uSunCol * nd * vC.a + dyn); }
  } else {
    float nd = max(dot(n, uSun), 0.0);
    lit = vC.rgb * (uAmb * (0.75 + 0.25 * n.y) + uSunCol * nd * uShadow + dyn);
    if (vC.a < 0.5) lit = vC.rgb * (1.0 + uGlow);
  }
  vec3 c = t.rgb * lit;
  c = mix(c, uTint.rgb, uTint.a);
  float dist = length(vW - uCam);
  float f = 1.0 - exp(-dist * dist * uFog * uFog);
  c = mix(c, uFogCol, clamp(f, 0.0, uFogMax));
  gl_FragColor = vec4(c, uAlpha * (uAlphaTest > 0.0 ? 1.0 : t.a));
}`;
  const VS_SKY = `attribute vec2 aP; varying vec2 vP; void main(){ vP = aP; gl_Position = vec4(aP, 0.9999, 1.0); }`;
  const FS_SKY = `
precision mediump float;
uniform vec3 uR; uniform vec3 uU; uniform vec3 uF; uniform vec2 uTan; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uTime; uniform float uClouds; uniform float uNight; uniform vec3 uFogCol;
uniform sampler2D uCloud; varying vec2 vP;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec3 d = normalize(uF + uR * vP.x * uTan.x + uU * vP.y * uTan.y);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 c = mix(uHor, uTop, pow(clamp(h, 0.0, 1.0), 0.6));
  float s = max(dot(d, uSun), 0.0);
  c += uSunCol * (pow(s, 600.0) * 1.6 + pow(s, 18.0) * 0.18);
  if (uNight > 0.3 && d.y > 0.05) { vec2 g = floor(d.xz / (d.y + 0.2) * 220.0); float st = step(0.9975, hash(g)); c += vec3(st) * (uNight - 0.3) * 0.9 * (1.0 - uClouds * 0.6); }
  if (d.y > 0.0) {
    vec2 uv = d.xz / (d.y + 0.1) * 0.1 + vec2(uTime * 0.003, uTime * 0.0015);
    float cl = texture2D(uCloud, uv).a * 0.7 + texture2D(uCloud, uv * 2.1 + 0.37).a * 0.4;
    cl = clamp(cl * (0.35 + uClouds), 0.0, 1.0) * smoothstep(0.0, 0.18, d.y);
    vec3 cc = mix(uHor * 1.05, uTop * 0.8 + vec3(0.06), 0.3) * (1.0 - uClouds * 0.25);
    c = mix(c, cc, cl * 0.9);
  }
  c = mix(c, uFogCol, smoothstep(0.12, -0.02, d.y));
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
  float dist = length(vW - uCam); float f = clamp(1.0 - exp(-dist * dist * uFog * uFog), 0.0, 1.0);
  vec3 c = uAdd > 0.5 ? vCol.rgb * (1.0 - f) : mix(vCol.rgb, uFogCol, f);
  gl_FragColor = vec4(c, a);
}`;

  function compile(gl, vs, fs) {
    const mk = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, a = {};
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const info = gl.getActiveUniform(p, i), name = info.name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, name); }
    for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES); i < n; i++) { const info = gl.getActiveAttrib(p, i); a[info.name] = gl.getAttribLocation(p, info.name); }
    return { p, u, a };
  }
  const ident = M4.create();
  const DECAL_TEX = { cobble: 1, dirtroad: 1, snowroad: 1 };
  const ROAD_TEX = { cobble: 'cobble', dirt: 'dirtroad', snow: 'snowroad' };
  const LOOK_SLEEVE = 0x5a5a3a;

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }) || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL unavailable');
      this.gl = gl;
      this.u32 = !!gl.getExtension('OES_element_index_uint');
      this.aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      this.lit = compile(gl, VS_LIT, FS_LIT); this.sky = compile(gl, VS_SKY, FS_SKY); this.pp = compile(gl, VS_P, FS_P);
      this.tex = {};
      const T = S.textures();
      for (const k in T) this.tex[k] = this.upload(T[k], k !== 'particle' && k !== 'cloud', !!S.ALPHA_TEX[k]);
      this.signTex = {};
      this.skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this.pBuf = gl.createBuffer(); this.pIdx = gl.createBuffer(); this.pCap = 0;
      this.parts = []; this.lights = []; this.decals = []; this.beams = []; this.flakes = []; this.debris = [];
      this.rigCache = {}; this.itemCache = {}; this.gunCache = {}; this.viewCache = {}; this.targetCache = {}; this.doorCache = new Map();
      this.V = M4.create(); this.P = M4.create(); this.VP = M4.create(); this.time = 0; this.shake = 0;
      this.frame = { actors: 0, chunks: 0 };
      this.grassOn = true;
      gl.disable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    }
    upload(img, mip = true, alpha = false) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mip ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mip ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); if (this.aniso && !alpha) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      return t;
    }
    glMesh(m) {
      const gl = this.gl, big = m.count > 65535;
      if (big && !this.u32) throw new Error('mesh too large');
      const mk = (data, T) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new T(data), gl.STATIC_DRAW); return b; };
      const g = { pos: mk(m.pos, Float32Array), nrm: mk(m.nrm, Float32Array), uv: mk(m.uv, Float32Array), col: mk(m.col, Float32Array), n: m.idx.length, big };
      g.idx = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.idx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, big ? new Uint32Array(m.idx) : new Uint16Array(m.idx), gl.STATIC_DRAW);
      const b = m.bounds(); g.min = b.min; g.max = b.max;
      return g;
    }
    freeMesh(g) { const gl = this.gl; for (const k of ['pos', 'nrm', 'uv', 'col', 'idx']) gl.deleteBuffer(g[k]); }
    drawMesh(g) {
      const gl = this.gl, a = this.lit.a;
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pos); gl.vertexAttribPointer(a.aPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.nrm); gl.vertexAttribPointer(a.aNrm, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.uv); gl.vertexAttribPointer(a.aUV, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.col); gl.vertexAttribPointer(a.aCol, 4, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.idx); gl.drawElements(gl.TRIANGLES, g.n, g.big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, 0);
    }

    setLevel(game) {
      if (this.chunks) for (const c of this.chunks) this.freeMesh(c.g);
      if (this.waterMeshes) for (const w of this.waterMeshes) this.freeMesh(w.g);
      if (this.signMeshes) for (const s of this.signMeshes) this.freeMesh(s.g);
      for (const g of this.doorCache.values()) this.freeMesh(g);
      this.doorCache.clear();
      const W = game.W, def = game.def, env = def.env;
      this.game = game; this.W = W; this.def = def; this.env = env; this.levelId = def.id;
      const sl = Math.hypot(...env.sun); this.sunDir = env.sun.map(v => v / sl);
      this.parts.length = 0; this.decals.length = 0; this.beams.length = 0; this.lights.length = 0; this.debris.length = 0; this.flakes.length = 0;
      const chunkMap = new Map(), all = [];
      const chunk = (tex, x, z, size = 48) => { const key = `${tex}|${size}|${Math.floor(x / size)}|${Math.floor(z / size)}`; let c = chunkMap.get(key); if (!c || c.count > 60000) { c = new Mesh(); c.tex = tex; c.size = size; chunkMap.set(key, c); all.push(c); } return c; };
      this.treeGrid = new Map();
      for (const t of def.trees) { if (t.kind === 'bush') continue; const k = `${Math.floor(t.x / 8)},${Math.floor(t.z / 8)}`; (this.treeGrid.get(k) || this.treeGrid.set(k, []).get(k)).push(t); }
      for (const b of def.boxes) if (b.render) this.emitBox(chunk, b);
      for (const p of def.props) { const ms = S.propMeshes(p); for (const tex in ms) chunk(tex, p.x, p.z).append(ms[tex]); }
      for (const t of def.trees) { const out = {}; S.treeMeshes(t, out); for (const tex in out) chunk(tex, t.x, t.z).append(out[tex]); }
      this.emitTerrain(chunk);
      this.emitRoads(chunk);
      if (this.grassOn && env.grass) this.emitGrass(chunk);
      this.staticLights = def.lights.slice();
      for (const m of all) this.bake(m);
      this.chunks = all.filter(m => m.idx.length).map(m => ({ tex: m.tex, g: this.glMesh(m), alpha: !!S.ALPHA_TEX[m.tex], decal: !!DECAL_TEX[m.tex], grass: m.tex === 'grasstuft' }));
      this.chunks.sort((a, b) => (a.decal - b.decal) || (a.alpha - b.alpha) || (a.tex < b.tex ? -1 : 1));
      this.waterMeshes = def.water.map(f => { const m = new Mesh(); m.quad([[f.x0, f.y, f.z1], [f.x1, f.y, f.z1], [f.x1, f.y, f.z0], [f.x0, f.y, f.z0]], [0, 1, 0], [[f.x0 / 5, f.z1 / 5], [f.x1 / 5, f.z1 / 5], [f.x1 / 5, f.z0 / 5], [f.x0 / 5, f.z0 / 5]], [0.8, 0.85, 0.85, 1]); return { g: this.glMesh(m) }; });
      this.signMeshes = def.signs.map(s => {
        const txt = game.L(s.text); if (!this.signTex[txt]) this.signTex[txt] = this.upload(S.signTexture(txt), false);
        const m = new Mesh(), w = s.w / 2, h = s.h / 2; m.with(M4.rotY(M4.translate(M4.create(), s.x, s.y, s.z), s.rot), q => { q.quad([[w, -h, 0.02], [-w, -h, 0.02], [-w, h, 0.02], [w, h, 0.02]], [0, 0, 1], [[1, 1], [0, 1], [0, 0], [1, 0]], [1, 1, 1, 1]); q.quad([[-w, -h, -0.02], [w, -h, -0.02], [w, h, -0.02], [-w, h, -0.02]], [0, 0, -1], [[1, 1], [0, 1], [0, 0], [1, 0]], [0.9, 0.9, 0.9, 1]); q.cbox(0, -h - 0.9, 0, 0.04, 0.9, 0.04, [0.4, 0.4, 0.4, 1]); });
        return { g: this.glMesh(m), tex: txt };
      });
      this.emitters = def.fires.map(f => ({ x: f.x, y: f.y, z: f.z, s: f.s }));
    }
    emitBox(chunk, b) {
      const tint = b.tint ? rgb(b.tint) : [1, 1, 1, 1], w = b.uvs, ts = 3.5;
      const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
      const face = (tex, o, ax, ay, lenA, lenB, n, uvf) => {
        const m = chunk(tex, cx, cz), na = Math.max(1, Math.ceil(lenA / ts)), nb = Math.max(1, Math.ceil(lenB / ts));
        for (let i = 0; i < na; i++) for (let j = 0; j < nb; j++) {
          const a0 = (i / na) * lenA, a1 = ((i + 1) / na) * lenA, b0 = (j / nb) * lenB, b1 = ((j + 1) / nb) * lenB;
          const P = (a, bb) => [o[0] + ax[0] * a + ay[0] * bb, o[1] + ax[1] * a + ay[1] * bb, o[2] + ax[2] * a + ay[2] * bb];
          const ps = [P(a0, b0), P(a1, b0), P(a1, b1), P(a0, b1)];
          m.quad(ps, n, ps.map(p => uvf(p).map(v => v / w)), tint);
        }
      };
      const { x0, y0, z0, x1, y1, z1 } = b, dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
      const side = b.side || b.tex;
      if (b.glass) {
        const tex = 'glass', gw = 1, vy = p => -(p[1] - y0) / dy;
        if (dx > dz) { face(tex, [x0, y0, cz], [1, 0, 0], [0, 1, 0], dx, dy, [0, 0, 1], p => [(p[0] - x0) / dx * gw * w, vy(p) * w]); }
        else face(tex, [cx, y0, z0], [0, 0, 1], [0, 1, 0], dz, dy, [1, 0, 0], p => [(p[2] - z0) / dz * gw * w, vy(p) * w]);
        return;
      }
      face(b.top, [x0, y1, z1], [1, 0, 0], [0, 0, -1], dx, dz, [0, 1, 0], p => [p[0], p[2]]);
      if (!b.noBottom && y0 > this.W.terrainAt(cx, cz) + 0.3) face(b.tex, [x0, y0, z0], [1, 0, 0], [0, 0, 1], dx, dz, [0, -1, 0], p => [p[0], p[2]]);
      const vw = b.tex === 'wire' ? Math.max(dy, 0.1) : w;
      const vy = p => -(p[1] - y0) / vw * w;
      face(side, [x0, y0, z1], [1, 0, 0], [0, 1, 0], dx, dy, [0, 0, 1], p => [p[0], vy(p)]);
      face(side, [x1, y0, z0], [-1, 0, 0], [0, 1, 0], dx, dy, [0, 0, -1], p => [-p[0], vy(p)]);
      face(side, [x1, y0, z1], [0, 0, -1], [0, 1, 0], dz, dy, [1, 0, 0], p => [-p[2], vy(p)]);
      face(side, [x0, y0, z0], [0, 0, 1], [0, 1, 0], dz, dy, [-1, 0, 0], p => [p[2], vy(p)]);
    }
    terrainColor(x, z, n) {
      const env = this.env, g = env.grassCol, d = env.dirtCol;
      let k = clamp(S.fbm(x / 28, z / 28, 31, 3) * 1.8 - 0.55, 0, 1);
      k = Math.max(k, clamp((0.92 - n[1]) * 5, 0, 1));
      for (const r of this.def.roads) { const q = S.lineDist(x, z, r.pts); if (q.d < r.w / 2 + 2.5) k = Math.max(k, 1 - (q.d - r.w / 2) / 2.5); }
      const v = 0.85 + 0.3 * S.fbm(x / 6, z / 6, 9, 2), m = env.snow ? 1.25 : 1.7;
      return [lerp(g[0], d[0], k) * v * m, lerp(g[1], d[1], k) * v * m, lerp(g[2], d[2], k) * v * m, 1];
    }
    emitTerrain(chunk) {
      const W = this.W, F = W.F, C = 32, step = 2;
      for (let cz = W.bz0; cz < W.bz1; cz += C) for (let cx = W.bx0; cx < W.bx1; cx += C) {
        const m = chunk('terrain', cx + 1, cz + 1), ex = Math.min(W.bx1, cx + C), ez = Math.min(W.bz1, cz + C);
        const nx = Math.ceil((ex - cx) / step), nz = Math.ceil((ez - cz) / step), base = m.count;
        for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
          const x = Math.min(ex, cx + i * step), z = Math.min(ez, cz + j * step), n = W.terrainNormal(x, z);
          m.vert(x, W.terrainAt(x, z), z, n[0], n[1], n[2], x / 6, z / 6, this.terrainColor(x, z, n));
        }
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
          const x0 = cx + i * step, z0 = cz + j * step;
          if (F.inHole(x0 + 1, z0 + 1)) continue;
          const a = base + j * (nx + 1) + i, b = a + nx + 1; m.idx.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
      const R = 600, S16 = 40, ox = W.bx0 - R, oz = W.bz0 - R, nx = Math.ceil((W.bx1 - W.bx0 + 2 * R) / S16), nz = Math.ceil((W.bz1 - W.bz0 + 2 * R) / S16);
      const inside = (x, z) => x >= W.bx0 && x <= W.bx1 && z >= W.bz0 && z <= W.bz1;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const x0 = ox + i * S16, z0 = oz + j * S16, x1 = x0 + S16, z1 = z0 + S16;
        if (inside(x0, z0) && inside(x1, z0) && inside(x0, z1) && inside(x1, z1)) continue;
        const hh = (x, z) => { const cx2 = clamp(x, W.bx0, W.bx1), cz2 = clamp(z, W.bz0, W.bz1), dd = Math.hypot(x - cx2, z - cz2); return W.terrainAt(cx2, cz2) * Math.max(0, 1 - dd / 60) + (dd > 0 ? 3 + 16 * S.fbm(x / 90, z / 90, 5, 3) * Math.min(1, dd / 120) : 0) - (inside(x, z) ? 0.3 : 0); };
        const m = chunk('terrain', x0, z0, 400);
        const ps = [[x0, hh(x0, z1), z1], [x1, hh(x1, z1), z1], [x1, hh(x1, z0), z0], [x0, hh(x0, z0), z0]];
        const c = this.terrainColor(x0, z0, [0, 1, 0]).map((v, k) => (k < 3 ? v * 0.85 : 1));
        m.quad(ps, [0, 1, 0], ps.map(p => [p[0] / 6, p[2] / 6]), c);
        if (!inside(x0 + 20, z0 + 20) && S.hash2(i, j, 3) < 0.55) { const tx = x0 + 20, tz = z0 + 20, th = hh(tx, tz); const t = { x: tx, z: tz, y: th, s: 1.5 + S.hash2(i, j, 4) * 1.5, rot: i + j, kind: this.env.snow ? 'snowpine' : S.hash2(i, j, 5) < 0.5 ? 'pine' : 'oak' }; const out = {}; S.treeMeshes(t, out); for (const k in out) chunk(k, tx, tz, 400).append(out[k]); }
      }
    }
    emitRoads(chunk) {
      const W = this.W;
      const strip = (pts, w, tex, yfix, lift = 0.05, vScale = 6) => {
        let dist = 0;
        for (let i = 0; i < pts.length - 1; i++) {
          const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / 3));
          const ux = (bx - ax) / len, uz = (bz - az) / len, px = -uz * w / 2, pz = ux * w / 2;
          for (let k = 0; k < n; k++) {
            const t0 = k / n, t1 = (k + 1) / n, x0 = ax + (bx - ax) * t0, z0 = az + (bz - az) * t0, x1 = ax + (bx - ax) * t1, z1 = az + (bz - az) * t1;
            const y = (x, z) => (yfix != null ? yfix : W.terrainAt(x, z)) + lift;
            const m = chunk(tex, x0, z0);
            const d0 = dist + len * t0, d1 = dist + len * t1;
            const ps = [[x0 + px, y(x0 + px, z0 + pz), z0 + pz], [x0 - px, y(x0 - px, z0 - pz), z0 - pz], [x1 - px, y(x1 - px, z1 - pz), z1 - pz], [x1 + px, y(x1 + px, z1 + pz), z1 + pz]];
            m.quad(ps, [0, 1, 0], [[0, d0 / vScale], [1, d0 / vScale], [1, d1 / vScale], [0, d1 / vScale]], [1, 1, 1, 1]);
          }
          dist += len;
        }
      };
      for (const r of this.def.roads) strip(r.pts, r.w, ROAD_TEX[r.kind] || 'dirtroad', null, 0.05, r.kind === 'cobble' ? 4 : 5);
      for (const rl of this.def.rails) {
        for (let i = 0; i < rl.pts.length - 1; i++) {
          const [ax, az] = rl.pts[i], [bx, bz] = rl.pts[i + 1], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
          const rot = Math.atan2(ux, uz);
          for (let d = 0.4; d < len; d += 0.75) {
            const x = ax + ux * d, z = az + uz * d, y = (rl.y != null ? rl.y : W.terrainAt(x, z)) + 0.03;
            chunk('planks', x, z).with(M4.rotY(M4.translate(M4.create(), x, y, z), rot), q => q.cbox(0, 0.06, 0, 1.3, 0.07, 0.12, [0.45, 0.38, 0.3, 1]));
          }
          const n = Math.ceil(len / 6);
          for (let k = 0; k < n; k++) {
            const d0 = len * k / n, d1 = len * (k + 1) / n;
            for (const off of [-0.76, 0.76]) {
              const x0 = ax + ux * d0 - uz * off, z0 = az + uz * d0 + ux * off, x1 = ax + ux * d1 - uz * off, z1 = az + uz * d1 + ux * off;
              const y0 = (rl.y != null ? rl.y : W.terrainAt(x0, z0)) + 0.18, y1 = (rl.y != null ? rl.y : W.terrainAt(x1, z1)) + 0.18;
              const m = chunk('metal', x0, z0), c = [0.55, 0.5, 0.48, 1], hw = 0.04;
              m.poly4([x0 - uz * hw, y0 + 0.06, z0 + ux * hw], [x0 + uz * hw, y0 + 0.06, z0 - ux * hw], [x1 + uz * hw, y1 + 0.06, z1 - ux * hw], [x1 - uz * hw, y1 + 0.06, z1 + ux * hw], c);
              m.poly4([x0 - uz * hw, y0 - 0.08, z0 + ux * hw], [x0 - uz * hw, y0 + 0.06, z0 + ux * hw], [x1 - uz * hw, y1 + 0.06, z1 + ux * hw], [x1 - uz * hw, y1 - 0.08, z1 + ux * hw], c);
            }
          }
        }
      }
    }
    emitGrass(chunk) {
      const W = this.W, def = this.def, env = this.env, r = S.RNG(99 + def.id.length);
      const area = (W.bx1 - W.bx0) * (W.bz1 - W.bz0), n = Math.floor(area / 16 * env.grass);
      for (let i = 0; i < n; i++) {
        const x = W.bx0 + 2 + r() * (W.bx1 - W.bx0 - 4), z = W.bz0 + 2 + r() * (W.bz1 - W.bz0 - 4);
        if (S.fbm(x / 20, z / 20, 13, 2) < 0.38) continue;
        const nrm = W.terrainNormal(x, z); if (nrm[1] < 0.85) continue;
        const y = W.terrainAt(x, z); let bad = false;
        W.near(x - 0.6, z - 0.6, x + 0.6, z + 0.6, b => { if (!b.invisible && b.y1 > y - 0.2 && b.y0 < y + 1) { bad = true; return false; } });
        if (bad || W.ray(x, y + 0.5, z, 0, 1, 0, 30, true, true)) continue;
        for (const rd of def.roads) if (S.lineDist(x, z, rd.pts).d < rd.w / 2 + 0.5) { bad = true; break; }
        for (const w of def.water) if (x > w.x0 - 1 && x < w.x1 + 1 && z > w.z0 - 1 && z < w.z1 + 1) bad = true;
        if (bad) continue;
        const c = this.terrainColor(x, z, nrm), s = 0.6 + r() * 0.7;
        chunk('grasstuft', x, z, 32).cross(x, y - 0.05, z, 1.2 * s, 0.75 * s, 2, [c[0] * 1.15, c[1] * 1.15, c[2] * 1.05, 1], r() * 3);
      }
    }
    bake(m) {
      const W = this.W, sun = this.sunDir;
      let topY = -Infinity; for (const b of W.boxes) if (!b.invisible && b.y1 > topY) topY = b.y1;
      const p = m.pos, n = m.nrm, c = m.col, foliage = !!S.ALPHA_TEX[m.tex];
      const cache = new Map();
      for (let i = 0, v = 0; i < p.length; i += 3, v += 4) {
        if (c[v + 3] === 0) { c[v + 3] = 2; continue; }
        const x = p[i], y = p[i + 1], z = p[i + 2], nx = n[i], ny = n[i + 1], nz = n[i + 2];
        const far = x < W.bx0 - 2 || x > W.bx1 + 2 || z < W.bz0 - 2 || z > W.bz1 + 2;
        let sh = 1, sky = 1;
        if (!far && y < topY + 0.1) {
          const key = `${Math.round(x * 2)},${Math.round(y * 2)},${Math.round(z * 2)},${nx > 0.5 ? 1 : nx < -0.5 ? 2 : 0}${ny > 0.5 ? 1 : ny < -0.5 ? 2 : 0}${nz > 0.5 ? 1 : nz < -0.5 ? 2 : 0}`;
          const hit = cache.get(key);
          if (hit) { sh = hit[0]; sky = hit[1]; }
          else {
            const ox = x + nx * 0.08, oy = y + ny * 0.08 + 0.02, oz = z + nz * 0.08;
            if (!foliage || y < 3) {
              if (W.ray(ox, oy, oz, sun[0], sun[1], sun[2], 60, true, true)) sh = 0.12;
              if (ny > -0.5 && W.ray(ox, oy, oz, 0, 1, 0, 40, true, true)) sky = 0.5;
              if (sky < 1 && ny < 0.5) sky = 0.45;
            }
            cache.set(key, [sh, sky]);
          }
        }
        if (m.tex === 'terrain' || m.tex === 'grasstuft' || DECAL_TEX[m.tex]) {
          const k0x = Math.floor(x / 8), k0z = Math.floor(z / 8);
          for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const list = this.treeGrid.get(`${k0x + a},${k0z + b}`); if (!list) continue; for (const t of list) { const d = Math.hypot(t.x - x, t.z - z), R = 2.8 * t.s; if (d < R) { sh = Math.min(sh, 0.35 + 0.65 * (d / R)); sky = Math.min(sky, 0.8 + 0.2 * d / R); } } }
        }
        c[v] *= sky; c[v + 1] *= sky; c[v + 2] *= sky; c[v + 3] = sh;
      }
    }

    rig(key) {
      if (this.rigCache[key]) return this.rigCache[key];
      const model = key.startsWith('h:') ? S.humanModel(key.slice(2)) : S.MODELS[key], parts = {};
      for (const p of model.parts) { const m = new Mesh(); p.build(m); parts[p.n] = m.count ? this.glMesh(m) : null; }
      return (this.rigCache[key] = { model, parts });
    }
    itemMesh(id) { return this.itemCache[id] || (this.itemCache[id] = this.glMesh(S.pickupMesh(id))); }
    gunMesh(id) { return this.gunCache[id] || (this.gunCache[id] = this.glMesh(S.gunModel(id))); }
    viewMesh(w) { return this.viewCache[w] || (this.viewCache[w] = this.glMesh(S.viewModel(w, LOOK_SLEEVE))); }
    targetMesh(kind) { return this.targetCache[kind] || (this.targetCache[kind] = this.glMesh(S.targetMesh(kind))); }
    doorMesh(d) {
      let g = this.doorCache.get(d); if (g) return g;
      const m = new Mesh(), L = d.b - d.a, t = d.gate ? 0.1 : 0.06;
      if (d.tex === 'bars') m.box(0, 0, -0.03, L, d.h, 0.03, [1, 1, 1, 1], 'unit');
      else m.box(0, 0, -t, L, d.h, t, [1, 1, 1, 1], 'unit');
      g = this.glMesh(m); this.doorCache.set(d, g); return g;
    }
    doorMatrix(d) {
      const ang = d.open * Math.PI * 0.5 * d.swing, m = M4.create();
      if (d.dir === 'x') { M4.translate(m, d.a, d.y, d.c); M4.rotY(m, -ang); }
      else { M4.translate(m, d.c, d.y, d.a); M4.rotY(m, -Math.PI / 2 + ang); }
      return m;
    }

    envNow() {
      const env = this.env, f = this.flashK || 0;
      return { sunCol: env.sunColor, amb: env.ambient.map(v => v + f * 0.6), fog: env.fog, sky: env.sky, hor: env.horizon, fogD: env.fogDensity, night: env.night || 0, clouds: env.clouds };
    }

    add(o) { if (this.parts.length > 3000) this.parts.shift(); this.parts.push(o); return o; }
    puff(x, y, z, n, o) {
      const r = Math.random;
      for (let i = 0; i < n; i++) {
        const sp = o.speed || 2, a = r() * Math.PI * 2, u = r() * 2 - 1, s = Math.sqrt(1 - u * u);
        this.add({ x: x + (r() - 0.5) * (o.spread || 0), y: y + (r() - 0.5) * (o.spread || 0), z: z + (r() - 0.5) * (o.spread || 0),
          vx: Math.cos(a) * s * sp * (0.3 + r()), vy: u * sp * (0.3 + r()) + (o.up || 0), vz: Math.sin(a) * s * sp * (0.3 + r()),
          life: (o.life || 1) * (0.6 + r() * 0.6), t: 0, size: (o.size || 0.3) * (0.7 + r() * 0.6), grow: o.grow || 0, col: o.col, add: !!o.add, grav: o.grav || 0, drag: o.drag == null ? 0.5 : o.drag });
      }
    }
    light(x, y, z, r, c, life) { this.lights.push({ x, y, z, r, c, life, max: life }); }
    decal(x, y, z, n, s, col, life = 40) {
      if (this.decals.length > 240) this.decals.shift();
      this.decals.push({ x: x + n[0] * 0.02, y: y + n[1] * 0.02, z: z + n[2] * 0.02, n, s, col, life, t: 0, rot: Math.random() * 6 });
    }
    events(evs, game) {
      const W = this.W, p = game.player;
      for (const e of evs) {
        switch (e.t) {
          case 'impact': {
            const c = e.surf === 'dirt' ? [0.5, 0.42, 0.32, 0.65] : e.surf === 'snow' ? [0.9, 0.92, 0.95, 0.7] : e.surf === 'wood' ? [0.55, 0.45, 0.32, 0.6] : [0.65, 0.63, 0.6, 0.55];
            this.puff(e.x, e.y, e.z, 4, { speed: 1.2, life: 0.7, size: 0.2, grow: 0.5, col: c, up: 0.4 });
            if (e.surf === 'metal' || e.surf === 'stone') this.puff(e.x, e.y, e.z, 4, { speed: 5, life: 0.18, size: 0.05, col: [1, 0.85, 0.5, 1], add: true, grav: 10 });
            this.decal(e.x, e.y, e.z, e.n || [0, 1, 0], 0.07, [0.08, 0.07, 0.06, 0.8], 30);
            break;
          }
          case 'blood': {
            this.puff(e.x, e.y, e.z, e.n, { speed: 2.2, life: 0.6, size: 0.14, col: [0.45, 0.02, 0.02, 0.9], grav: 10, drag: 0.3 });
            const fy = W.floorAt(e.x, e.z, 0.2, e.y + 0.3);
            if (e.y - fy < 2.2 && Math.random() < 0.6) this.decal(e.x + (Math.random() - 0.5) * 0.6, fy, e.z + (Math.random() - 0.5) * 0.6, [0, 1, 0], 0.2 + Math.random() * 0.25, [0.3, 0.02, 0.02, 0.8], 60);
            break;
          }
          case 'explosion': {
            const s = e.r / 7;
            this.puff(e.x, e.y, e.z, 18, { speed: 5 * s, life: 0.5, size: 1.1 * s, grow: 2 * s, col: [1, 0.55, 0.2, 1], add: true, drag: 3 });
            this.puff(e.x, e.y, e.z, 16, { speed: 2.5 * s, life: 2.8, size: 1.0 * s, grow: 1.8 * s, col: [0.2, 0.19, 0.17, 0.65], up: 1.5, drag: 1 });
            this.puff(e.x, e.y, e.z, 22, { speed: 14 * s, life: 0.5, size: 0.06, col: [1, 0.8, 0.4, 1], add: true, grav: 14, drag: 0.3 });
            this.puff(e.x, e.y, e.z, 14, { speed: 6 * s, life: 1.2, size: 0.15, col: this.env.snow ? [0.85, 0.86, 0.9, 1] : [0.35, 0.3, 0.25, 1], grav: 14, drag: 0.2 });
            this.light(e.x, e.y + 0.5, e.z, e.r * 2.5, [2, 1.2, 0.5], 0.45);
            const fy = W.floorAt(e.x, e.z, 0.2, e.y + 0.5); if (e.y - fy < 1.5) this.decal(e.x, fy, e.z, [0, 1, 0], e.r * 0.3, [0, 0, 0, 0.6], 80);
            this.shake = Math.max(this.shake, clamp(1 - Math.hypot(e.x - p.x, e.z - p.z) / 45, 0, 1));
            this.flashK = Math.max(this.flashK || 0, clamp(1 - Math.hypot(e.x - p.x, e.z - p.z) / 60, 0, 1) * 0.5);
            break;
          }
          case 'smoke': this.add({ x: e.x, y: e.y, z: e.z, vx: 0, vy: 0.3, vz: 0, life: 1.2, t: 0, size: 0.25, grow: 0.8, col: [0.7, 0.7, 0.68, 0.45], add: false, grav: 0, drag: 0.3 }); break;
          case 'fire': {
            if (e.nade) { this.swingT = 0.35; break; }
            const f = game.forward();
            this.light(p.x + f[0] * 1.2, game.eye + f[1] * 1.2, p.z + f[2] * 1.2, 9, [1.6, 1.1, 0.5], 0.06);
            if (e.w !== 'silenced') this.muzzleT = 0.05;
            this.kickT = 0.12;
            break;
          }
          case 'npcfire': this.light(e.x, e.y, e.z, 7, [1.5, 1.0, 0.5], 0.06); this.puff(e.x, e.y, e.z, 1, { speed: 0.1, life: 0.06, size: 0.35, col: [1, 0.75, 0.35, 1], add: true, drag: 0 }); break;
          case 'tankfire': this.light(e.x, e.y, e.z, 14, [2, 1.3, 0.6], 0.1); this.puff(e.x, e.y, e.z, 10, { speed: 3, life: 1.2, size: 0.6, grow: 1.2, col: [0.4, 0.38, 0.35, 0.6], drag: 1.5 }); break;
          case 'tracer': this.beams.push({ a: e.a, b: e.b, w: 0.018, col: e.enemy ? [1, 0.75, 0.4, 0.5] : [1, 0.85, 0.6, 0.35], life: 0.05, t: 0 }); break;
          case 'helmet': {
            const rg = this.rig('h:heer');
            this.debris.push({ x: e.x, y: e.y, z: e.z, vx: Math.sin(e.yaw) * 2.5 + (Math.random() - 0.5), vy: 3.5, vz: Math.cos(e.yaw) * 2.5 + (Math.random() - 0.5), rx: 0, rz: 0, t: 0, g: rg.parts.helmet, uid: e.uid });
            break;
          }
          case 'hurt': if (e.dmg > 10) this.shake = Math.max(this.shake, 0.3); break;
          default: break;
        }
      }
    }
    stepEffects(dt, game) {
      this.time += dt;
      for (const p of this.parts) {
        p.t += dt; const k = Math.max(0, 1 - p.drag * dt);
        p.vx *= k; p.vy = p.vy * k - p.grav * dt; p.vz *= k;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.size += p.grow * dt;
      }
      this.parts = this.parts.filter(p => p.t < p.life && p.size > 0);
      for (const L of this.lights) L.life -= dt;
      this.lights = this.lights.filter(L => L.life > 0);
      for (const b of this.beams) b.t += dt;
      this.beams = this.beams.filter(b => b.t < b.life);
      for (const d of this.decals) d.t += dt;
      this.decals = this.decals.filter(d => d.t < d.life);
      for (const d of this.debris) {
        if (d.rest) continue;
        d.t += dt; d.vy -= 18 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.rx += dt * 9; d.rz += dt * 5;
        const fl = this.W.floorAt(d.x, d.z, 0.1, d.y + 0.5);
        if (d.y < fl + 0.12) { d.y = fl + 0.12; if (Math.abs(d.vy) < 1.5) { d.rest = true; d.rx = Math.PI; } else { d.vy = -d.vy * 0.35; d.vx *= 0.5; d.vz *= 0.5; } }
      }
      if (this.debris.length > 40) this.debris.shift();
      if (this.muzzleT > 0) this.muzzleT -= dt;
      if (this.kickT > 0) this.kickT -= dt;
      if (this.swingT > 0) this.swingT -= dt;
      this.shake = Math.max(0, this.shake - dt * 2);
      this.flashK = Math.max(0, (this.flashK || 0) - dt * 2);
      this.emitAcc = (this.emitAcc || 0) + dt;
      if (this.emitAcc > 0.05) {
        this.emitAcc = 0;
        const px = game.player.x, pz = game.player.z;
        const fires = this.emitters.slice();
        for (const t of game.targets) if (t.dead) fires.push({ x: t.x, y: t.y + (t.kind === 'uboat' ? 3 : 0.5), z: t.z, s: t.kind === 'radio' ? 0.4 : 1.4, smoke: true });
        for (const t of game.tanks) if (t.dead && t.deadT < 90) fires.push({ x: t.x, y: t.y + 1.8, z: t.z, s: 1.2, smoke: true });
        for (const e of fires) if (Math.abs(e.x - px) < 90 && Math.abs(e.z - pz) < 90) {
          const s = e.s || 1;
          this.add({ x: e.x + (Math.random() - 0.5) * 0.5 * s, y: e.y + 0.15, z: e.z + (Math.random() - 0.5) * 0.5 * s, vx: 0, vy: 1.3 * s, vz: 0, life: 0.55, t: 0, size: 0.35 * s, grow: -0.4 * s, col: [1, 0.5, 0.15, 0.9], add: true, grav: 0, drag: 0.5 });
          if (Math.random() < (e.smoke ? 0.6 : 0.3)) this.add({ x: e.x, y: e.y + 0.9 * s, z: e.z, vx: (Math.random() - 0.5) * 0.3 + 0.3, vy: 1.1, vz: (Math.random() - 0.5) * 0.3, life: 3.5, t: 0, size: 0.35 * s, grow: 0.6 * s, col: [0.2, 0.2, 0.2, 0.35], add: false, grav: 0, drag: 0.2 });
        }
      }
      const snow = this.env.snow || 0, want = Math.floor(snow * 600);
      const cam = this.lastCam || { x: game.player.x, y: game.eye, z: game.player.z };
      while (this.flakes.length < want) this.flakes.push({ x: cam.x + (Math.random() - 0.5) * 36, y: cam.y + Math.random() * 14 - 4, z: cam.z + (Math.random() - 0.5) * 36, ph: Math.random() * 6 });
      if (this.flakes.length > want) this.flakes.length = want;
      for (const d of this.flakes) { d.y -= 1.6 * dt; d.x += (0.6 + Math.sin(this.time + d.ph) * 0.5) * dt; d.z += Math.cos(this.time * 0.7 + d.ph) * 0.3 * dt; if (d.y < cam.y - 5 || Math.abs(d.x - cam.x) > 18 || Math.abs(d.z - cam.z) > 18) { d.x = cam.x + (Math.random() - 0.5) * 36; d.z = cam.z + (Math.random() - 0.5) * 36; d.y = cam.y + 8 + Math.random() * 4; } }
    }

    resize(w, h) { this.canvas.width = w; this.canvas.height = h; }
    setLights(list, cam) {
      const scored = list.map(L => ({ L, s: (L.r * L.r) / (1 + (L.x - cam[0]) ** 2 + (L.y - cam[1]) ** 2 + (L.z - cam[2]) ** 2) })).sort((a, b) => b.s - a.s).slice(0, MAXL);
      const P = new Float32Array(MAXL * 3), C = new Float32Array(MAXL * 4);
      scored.forEach(({ L }, i) => { P.set([L.x, L.y, L.z], i * 3); const f = L.max ? clamp(L.life / L.max, 0, 1) : 1; C.set([L.c[0] * f, L.c[1] * f, L.c[2] * f, L.r], i * 4); });
      for (let i = scored.length; i < MAXL; i++) C.set([0, 0, 0, 1], i * 4);
      return { P, C };
    }
    frustum(vp) {
      const m = vp, pl = [];
      const row = r => [m[r], m[4 + r], m[8 + r], m[12 + r]];
      const r0 = row(0), r1 = row(1), r2 = row(2), r3 = row(3);
      for (const [a, s] of [[r0, 1], [r0, -1], [r1, 1], [r1, -1], [r2, 1], [r2, -1]]) { const p = [r3[0] + s * a[0], r3[1] + s * a[1], r3[2] + s * a[2], r3[3] + s * a[3]]; const l = Math.hypot(p[0], p[1], p[2]); pl.push(p.map(v => v / l)); }
      return pl;
    }
    boxVisible(pl, mn, mx) { for (const p of pl) { const x = p[0] > 0 ? mx[0] : mn[0], y = p[1] > 0 ? mx[1] : mn[1], z = p[2] > 0 ? mx[2] : mn[2]; if (p[0] * x + p[1] * y + p[2] * z + p[3] < 0) return false; } return true; }
    sphereVisible(pl, x, y, z, r) { for (const p of pl) if (p[0] * x + p[1] * y + p[2] * z + p[3] < -r) return false; return true; }
    project(x, y, z) {
      const m = this.VP, cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (cw <= 0.05) return null; return [(cx / cw * 0.5 + 0.5), (1 - (cy / cw * 0.5 + 0.5))];
    }
    shadowAt(x, y, z) { const s = this.sunDir; return this.W && this.W.ray(x, y, z, s[0], s[1], s[2], 50, true, true) ? 0.3 : 1; }
    render(game, cam, opt = {}) {
      const gl = this.gl, w = this.canvas.width, h = this.canvas.height;
      gl.viewport(0, 0, w, h);
      const E = this.envNow(); this.E = E;
      const aspect = w / h, fov = (opt.fov || 75) * Math.PI / 180, vfov = 2 * Math.atan(Math.tan(fov / 2) / aspect);
      let sx = 0, sy = 0; if (this.shake > 0) { sx = (Math.random() - 0.5) * this.shake * 0.12; sy = (Math.random() - 0.5) * this.shake * 0.12; }
      const cx = cam.x + sx, cy = cam.y + sy, cz = cam.z; this.lastCam = { x: cx, y: cy, z: cz };
      M4.perspective(this.P, vfov, aspect, 0.06, 1200);
      M4.view(this.V, cx, cy, cz, cam.yaw, cam.pitch, cam.roll || 0);
      M4.mul(this.VP, this.P, this.V);
      const pl = this.frustum(this.VP);
      gl.clearColor(E.fog[0], E.fog[1], E.fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const V = this.V, R = [V[0], V[4], V[8]], U = [V[1], V[5], V[9]], F = [-V[2], -V[6], -V[10]];
      gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
      const sk = this.sky; gl.useProgram(sk.p);
      gl.uniform3fv(sk.u.uR, R); gl.uniform3fv(sk.u.uU, U); gl.uniform3fv(sk.u.uF, F); gl.uniform2f(sk.u.uTan, Math.tan(vfov / 2) * aspect, Math.tan(vfov / 2));
      gl.uniform3fv(sk.u.uTop, E.sky); gl.uniform3fv(sk.u.uHor, E.hor); gl.uniform3fv(sk.u.uSun, this.sunDir); gl.uniform3fv(sk.u.uSunCol, E.sunCol.map(v => v * 0.6)); gl.uniform1f(sk.u.uTime, this.time); gl.uniform1f(sk.u.uClouds, E.clouds);
      gl.uniform1f(sk.u.uNight, E.night); gl.uniform3fv(sk.u.uFogCol, E.fog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.cloud); gl.uniform1i(sk.u.uCloud, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf); gl.enableVertexAttribArray(sk.a.aP); gl.vertexAttribPointer(sk.a.aP, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(sk.a.aP);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      const L = this.lit; gl.useProgram(L.p);
      for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.enableVertexAttribArray(L.a[k]);
      gl.uniformMatrix4fv(L.u.uVP, false, this.VP); gl.uniform3fv(L.u.uCam, [cx, cy, cz]);
      gl.uniform3fv(L.u.uSun, this.sunDir); gl.uniform3fv(L.u.uSunCol, E.sunCol); gl.uniform3fv(L.u.uAmb, E.amb);
      gl.uniform3fv(L.u.uFogCol, E.fog); gl.uniform1f(L.u.uFog, E.fogD); gl.uniform1f(L.u.uFogMax, 1); gl.uniform1f(L.u.uGlow, E.night * 0.6);
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1); gl.uniform2f(L.u.uUVOff, 0, 0); gl.uniform1i(L.u.uTex, 0); gl.uniform1f(L.u.uAlphaTest, 0); gl.uniform1f(L.u.uShadow, 1);
      const dl = this.lights.slice();
      for (const s of this.staticLights) if (Math.abs(s.x - cx) < 70 && Math.abs(s.z - cz) < 70) { const fk = s.fire ? (0.8 + 0.2 * Math.sin(this.time * 11 + s.x) * Math.sin(this.time * 7.3)) : 1; dl.push({ x: s.x, y: s.y, z: s.z, r: s.r, c: s.c.map(v => v * fk * (0.45 + E.night * 0.75)) }); }
      for (const t of game.targets) if (t.dead && Math.abs(t.x - cx) < 70 && Math.abs(t.z - cz) < 70) dl.push({ x: t.x, y: t.y + 2, z: t.z, r: 12, c: [1.4, 0.7, 0.25].map(v => v * (0.8 + 0.2 * Math.sin(this.time * 9 + t.x))) });
      for (const t of game.tanks) if (t.dead && t.deadT < 90 && Math.abs(t.x - cx) < 70) dl.push({ x: t.x, y: t.y + 3, z: t.z, r: 12, c: [1.4, 0.7, 0.25] });
      const LS = this.setLights(dl, [cx, cy, cz]); gl.uniform3fv(L.u.uLP, LS.P); gl.uniform4fv(L.u.uLC, LS.C);
      gl.uniform1f(L.u.uBaked, 1); gl.uniformMatrix4fv(L.u.uM, false, ident);
      let lastTex = null, nch = 0, mode = 0;
      for (const c of this.chunks) {
        const mn = c.g.min, mx = c.g.max, ccx = (mn[0] + mx[0]) / 2, ccz = (mn[2] + mx[2]) / 2;
        const dist = Math.hypot(Math.max(0, Math.abs(ccx - cx) - (mx[0] - mn[0]) / 2), Math.max(0, Math.abs(ccz - cz) - (mx[2] - mn[2]) / 2));
        if (dist > (c.grass ? 55 : 330)) continue;
        if (!this.boxVisible(pl, mn, mx)) continue;
        const want = c.decal ? 2 : c.alpha ? 1 : 0;
        if (want !== mode) {
          if (want === 2) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-1.5, -4); gl.uniform1f(L.u.uAlphaTest, 0); }
          else { gl.disable(gl.POLYGON_OFFSET_FILL); gl.uniform1f(L.u.uAlphaTest, want === 1 ? 0.45 : 0); }
          mode = want;
        }
        if (c.tex !== lastTex) { gl.bindTexture(gl.TEXTURE_2D, this.tex[c.tex] || this.tex.concrete); lastTex = c.tex; }
        this.drawMesh(c.g); nch++;
      }
      gl.disable(gl.POLYGON_OFFSET_FILL); gl.uniform1f(L.u.uAlphaTest, 0);
      for (const s of this.signMeshes) { gl.bindTexture(gl.TEXTURE_2D, this.signTex[s.tex]); this.drawMesh(s.g); }
      gl.uniform1f(L.u.uBaked, 0);
      for (const d of game.doors) {
        const dx = (d.dir === 'x' ? (d.a + d.b) / 2 : d.c) - cx, dz = (d.dir === 'x' ? d.c : (d.a + d.b) / 2) - cz;
        if (dx * dx + dz * dz > 6400) continue;
        gl.bindTexture(gl.TEXTURE_2D, this.tex[d.tex] || this.tex.door);
        if (d.tex === 'bars') gl.uniform1f(L.u.uAlphaTest, 0.45);
        gl.uniformMatrix4fv(L.u.uM, false, this.doorMatrix(d)); this.drawMesh(this.doorMesh(d));
        if (d.tex === 'bars') gl.uniform1f(L.u.uAlphaTest, 0);
      }
      gl.bindTexture(gl.TEXTURE_2D, this.tex.cloth);
      for (const it of game.pickups) {
        if ((it.x - cx) ** 2 + (it.z - cz) ** 2 > 3600) continue;
        if (!this.sphereVisible(pl, it.x, it.y, it.z, 0.8)) continue;
        const m = M4.rotY(M4.translate(M4.create(), it.x, it.y + 0.02, it.z), (it.ph || 0));
        gl.uniformMatrix4fv(L.u.uM, false, m);
        if (S.DATA.PICKUPS[it.id] && S.DATA.PICKUPS[it.id].quest) gl.uniform4f(L.u.uTint, 1, 0.9, 0.5, 0.15 + 0.12 * Math.sin(this.time * 4));
        this.drawMesh(this.itemMesh(it.id));
        gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
      }
      for (const c of game.planted) {
        if (c.done) continue;
        const m = M4.translate(M4.create(), c.x, c.y + 0.05, c.z); gl.uniformMatrix4fv(L.u.uM, false, m);
        gl.uniform4f(L.u.uTint, 1, 0.1, 0.05, Math.sin(this.time * 12) > 0 ? 0.5 : 0);
        this.drawMesh(this.itemMesh('charges')); gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
      }
      for (const pt of game.plants) {
        if (pt.planted || (pt.x - cx) ** 2 + (pt.z - cz) ** 2 > 400) continue;
        const m = M4.translate(M4.create(), pt.x, pt.y + 0.02, pt.z); gl.uniformMatrix4fv(L.u.uM, false, m);
        gl.uniform4f(L.u.uTint, 1, 0.85, 0.3, 0.35 + 0.25 * Math.sin(this.time * 5)); gl.uniform1f(L.u.uAlpha, 0.6); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        this.drawMesh(this.itemMesh('charges')); gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1); gl.disable(gl.BLEND);
      }
      for (const t of game.targets) {
        if ((t.x - cx) ** 2 + (t.z - cz) ** 2 > 90000) continue;
        const m = M4.rotY(M4.translate(M4.create(), t.x, t.y - (t.dead ? (t.kind === 'uboat' ? 1.5 : 0.2) : 0), t.z), t.rot || 0);
        if (t.dead) { M4.rotZ(m, t.kind === 'v2' ? 0.5 : t.kind === 'uboat' ? 0.15 : 0.08); gl.uniform4f(L.u.uTint, 0.06, 0.05, 0.04, 0.72); }
        gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(this.targetMesh(t.kind));
        gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
      }
      let na = 0;
      const bigHeads = !!(game.codes && game.codes.BIGHEADS);
      for (const a of game.actors) {
        if (a.hidden) continue;
        if (!this.sphereVisible(pl, a.x, a.y + 0.9, a.z, 2)) continue;
        if (Math.hypot(a.x - cx, a.z - cz) > 260) continue;
        const key = a.kind === 'human' ? 'h:' + a.look : 'dog', rg = this.rig(key), model = rg.model;
        const root = M4.translate(M4.create(), a.x, a.y, a.z);
        M4.rotY(root, a.yaw);
        if (a.dead) {
          const k = Math.min(1, a.deadT * 2.4), dir = a.fallDir || 1;
          if (a.kind === 'human') { M4.translate(root, 0, 0.12 * k, 0); M4.rotX(root, -k * Math.PI / 2 * dir * 0.98); }
          else M4.rotZ(root, k * Math.PI / 2 * dir);
        }
        M4.scale(root, model.scale || 1);
        const hold = a.kind === 'human' && a.weapon && !a.surrender ? (S.DATA.WEAPONS[a.weapon].cat === 1 ? 'pistol' : S.DATA.WEAPONS[a.weapon].cat === 5 || a.weapon === 'mg42' ? 'heavy' : 'rifle') : 'none';
        const pa = a.dead ? { t: 0, walk: 0, move: 0, hold: 'none' } : Object.assign({}, a.anim || { t: this.time }, { hold });
        if (a.kind === 'human' && !a.dead && a.ai && a.ai.state !== 'combat' && !(a.aimT > 0) && hold !== 'none') pa.aim = 0;
        const mats = S.poseMatrices(model, root, pa);
        a.shadeT = (a.shadeT || 0) - 1;
        if (a.shadeT <= 0) { a.shadeT = 20; a.shade = this.shadowAt(a.x, a.y + 1.2, a.z); }
        gl.uniform1f(L.u.uShadow, a.shade == null ? 1 : a.shade);
        if (a.flash > 0) gl.uniform4f(L.u.uTint, 0.6, 0.05, 0.05, 0.35); else gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
        for (const p of model.parts) {
          const g = rg.parts[p.n]; if (!g) continue;
          if (p.n === 'helmet' && !a.helmet) continue;
          let m = mats[p.n];
          if (bigHeads && (p.n === 'head' || p.n === 'helmet')) { m = M4.copy(M4.create(), m); M4.scale(m, 1.9); }
          gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(g);
        }
        if (a.kind === 'human' && a.weapon && !a.dead && !a.surrender && hold !== 'none') { gl.uniformMatrix4fv(L.u.uM, false, mats.gun); this.drawMesh(this.gunMesh(a.weapon)); }
        if (a.kind === 'human' && a.anim && a.anim.papers && !a.dead) { const pm = M4.copy(M4.create(), mats.armLR); M4.translate(pm, 0, -0.33, 0.05); M4.rotX(pm, -1.2); gl.uniformMatrix4fv(L.u.uM, false, pm); this.drawMesh(this.gunMesh('papers')); }
        na++;
      }
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
      for (const d of this.debris) { if (!d.g) continue; const m = M4.rotZ(M4.rotX(M4.translate(M4.create(), d.x, d.y - 0.15, d.z), d.rx), d.rz); gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(d.g); }
      const trig = this.rig('tank');
      for (const t of game.tanks) {
        if (!this.sphereVisible(pl, t.x, t.y + 1.5, t.z, 5)) continue;
        const root = M4.rotY(M4.translate(M4.create(), t.x, t.y, t.z), t.yaw);
        const mats = S.poseMatrices(trig.model, root, t.anim || {});
        gl.uniform1f(L.u.uShadow, 1);
        if (t.dead) gl.uniform4f(L.u.uTint, 0.05, 0.04, 0.03, 0.75); else if (t.flash > 0) gl.uniform4f(L.u.uTint, 1, 0.6, 0.2, 0.3); else gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
        for (const p of trig.model.parts) { const g = trig.parts[p.n]; if (g) { gl.uniformMatrix4fv(L.u.uM, false, mats[p.n]); this.drawMesh(g); } }
      }
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uShadow, 1);
      for (const pr of game.projs) {
        const m = M4.translate(M4.create(), pr.x, pr.y, pr.z);
        if (pr.straight) { M4.rotY(m, Math.atan2(pr.vx, pr.vz) + Math.PI); M4.rotX(m, Math.atan2(pr.vy, Math.hypot(pr.vx, pr.vz))); }
        else { M4.rotY(m, pr.rot || 0); M4.rotX(m, (pr.rot || 0) * 0.7); }
        gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(this.gunMesh(pr.kind === 'rocket' ? 'rocket' : pr.kind === 'shell' ? 'shell' : pr.kind));
      }
      if (this.waterMeshes.length) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        gl.bindTexture(gl.TEXTURE_2D, this.tex.water); gl.uniformMatrix4fv(L.u.uM, false, ident); gl.uniform1f(L.u.uAlpha, 0.82);
        gl.uniform2f(L.u.uUVOff, this.time * 0.02, this.time * 0.013);
        for (const wm of this.waterMeshes) this.drawMesh(wm.g);
        gl.uniform1f(L.u.uAlpha, 1); gl.uniform2f(L.u.uUVOff, 0, 0); gl.depthMask(true); gl.disable(gl.BLEND);
      }
      for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.disableVertexAttribArray(L.a[k]);
      this.drawParticles(game, [cx, cy, cz], R, U, E);
      if (opt.viewmodel && !game.player.dead) this.drawViewmodel(game, cam, aspect, opt, E);
      this.frame.actors = na; this.frame.chunks = nch;
    }
    drawParticles(game, cam, R, U, E) {
      const gl = this.gl, P = this.pp;
      const alpha = [], add = [], shadows = [];
      const push = (list, x, y, z, s, c) => list.push(x, y, z, s, c[0], c[1], c[2], c[3]);
      for (const a of game.actors) {
        if (a.hidden || (a.dead && a.deadT > 1)) continue;
        const d2 = (a.x - cam[0]) ** 2 + (a.z - cam[2]) ** 2; if (d2 > 3600) continue;
        push(shadows, a.x, a.y + 0.04, a.z, a.r * 1.5, [0, 0, 0, 0.35 * (a.shade == null ? 1 : a.shade)]);
      }
      for (const p of this.parts) { const f = clamp(1 - p.t / p.life, 0, 1), a = p.col[3] * (p.add ? f : Math.min(1, f * 1.6)); push(p.add ? add : alpha, p.x, p.y, p.z, Math.max(0.01, p.size), [p.col[0], p.col[1], p.col[2], a]); }
      for (const e of this.emitters) if ((e.x - cam[0]) ** 2 + (e.z - cam[2]) ** 2 < 6400) push(add, e.x, e.y + 0.4, e.z, 1.1 + 0.1 * Math.sin(this.time * 13), [1, 0.5, 0.15, 0.35]);
      if (E.night > 0.1) for (const s of this.staticLights) if (s.lamp && (s.x - cam[0]) ** 2 + (s.z - cam[2]) ** 2 < 14400) push(add, s.x, s.y + 0.1, s.z, 0.7, [1, 0.9, 0.6, 0.45 * Math.max(0.4, E.night)]);
      for (const f of this.flakes) push(alpha, f.x, f.y, f.z, 0.035, [1, 1, 1, 0.9]);
      for (const pr of game.projs) if (pr.kind === 'rocket') push(add, pr.x, pr.y, pr.z, 0.35, [1, 0.7, 0.3, 0.9]);
      gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, this.VP); gl.uniform3fv(P.u.uCam, cam); gl.uniform1f(P.u.uFog, E.fogD); gl.uniform3fv(P.u.uFogCol, E.fog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.particle); gl.uniform1i(P.u.uTex, 0);
      gl.enable(gl.BLEND); gl.depthMask(false);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -6);
      this.drawQuads(shadows, [1, 0, 0], [0, 0, 1], 0);
      if (this.decals.length) {
        const dv = [];
        for (const d of this.decals) {
          if ((d.x - cam[0]) ** 2 + (d.z - cam[2]) ** 2 > 4900) continue;
          const n = d.n, ax = Math.abs(n[1]) > 0.8 ? [1, 0, 0] : [0, 1, 0];
          let t1 = [n[1] * ax[2] - n[2] * ax[1], n[2] * ax[0] - n[0] * ax[2], n[0] * ax[1] - n[1] * ax[0]]; const l1 = Math.hypot(...t1) || 1; t1 = t1.map(v => v / l1);
          const t2 = [n[1] * t1[2] - n[2] * t1[1], n[2] * t1[0] - n[0] * t1[2], n[0] * t1[1] - n[1] * t1[0]];
          const c = Math.cos(d.rot), s = Math.sin(d.rot), u = t1.map((v, i) => (v * c + t2[i] * s) * d.s), v2 = t2.map((v, i) => (v * c - t1[i] * s) * d.s);
          const fade = clamp((d.life - d.t) / 5, 0, 1), col = d.col;
          for (const [cu, cv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) dv.push(d.x + u[0] * cu + v2[0] * cv, d.y + u[1] * cu + v2[1] * cv, d.z + u[2] * cu + v2[2] * cv, cu, cv, col[0], col[1], col[2], col[3] * fade, 0);
        }
        if (dv.length) this.drawRaw(dv, 0);
      }
      gl.disable(gl.POLYGON_OFFSET_FILL);
      this.drawQuads(alpha, R, U, 0);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      this.drawQuads(add, R, U, 1);
      const bv = [];
      const beam = (a, b, w, c) => {
        const d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], mid = [(a[0] + b[0]) / 2 - cam[0], (a[1] + b[1]) / 2 - cam[1], (a[2] + b[2]) / 2 - cam[2]];
        let s = [d[1] * mid[2] - d[2] * mid[1], d[2] * mid[0] - d[0] * mid[2], d[0] * mid[1] - d[1] * mid[0]]; const l = Math.hypot(...s) || 1; s = s.map(v => (v / l) * w);
        for (const [p, k] of [[a, -1], [a, 1], [b, 1], [b, -1]]) bv.push(p[0] + s[0] * k, p[1] + s[1] * k, p[2] + s[2] * k, k, 0, c[0], c[1], c[2], c[3], 0);
      };
      for (const b of this.beams) beam(b.a, b.b, b.w, b.col);
      if (bv.length) this.drawRaw(bv, 1);
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    drawQuads(list, R, U, additive) {
      if (!list.length) return;
      const n = list.length / 8, v = new Float32Array(n * 40); let k = 0;
      const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (let i = 0; i < n; i++) { const o = i * 8; for (const c of C) { v[k++] = list[o]; v[k++] = list[o + 1]; v[k++] = list[o + 2]; v[k++] = c[0]; v[k++] = c[1]; v[k++] = list[o + 4]; v[k++] = list[o + 5]; v[k++] = list[o + 6]; v[k++] = list[o + 7]; v[k++] = list[o + 3]; } }
      const gl = this.gl; gl.uniform3fv(this.pp.u.uR, R); gl.uniform3fv(this.pp.u.uU, U);
      this.drawRaw(v, additive);
    }
    drawRaw(verts, additive) {
      const gl = this.gl, P = this.pp, n = verts.length / 40;
      if (n > this.pCap) {
        this.pCap = Math.min(16383, Math.max(n, this.pCap * 2, 256)); const idx = new Uint16Array(this.pCap * 6);
        for (let i = 0; i < this.pCap; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      }
      gl.uniform1f(P.u.uAdd, additive);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuf); gl.bufferData(gl.ARRAY_BUFFER, verts instanceof Float32Array ? verts : new Float32Array(verts), gl.STREAM_DRAW);
      const st = 40;
      for (const [name, size, off] of [['aPos', 3, 0], ['aCorner', 2, 12], ['aCol', 4, 20], ['aSize', 1, 36]]) { gl.enableVertexAttribArray(P.a[name]); gl.vertexAttribPointer(P.a[name], size, gl.FLOAT, false, st, off); }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pIdx); gl.drawElements(gl.TRIANGLES, Math.min(n, this.pCap) * 6, gl.UNSIGNED_SHORT, 0);
      for (const name of ['aPos', 'aCorner', 'aCol', 'aSize']) gl.disableVertexAttribArray(P.a[name]);
    }
    drawViewmodel(game, cam, aspect, opt, E) {
      const gl = this.gl, L = this.lit, p = game.player, w = p.w;
      const wid = w.state === 'switch' && w.t < 0.22 ? w.next : game.cur;
      const d = S.DATA.WEAPONS[wid];
      if (!d) return;
      if (d.scope && p.aim > 0.6) return;
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const proj = M4.perspective(M4.create(), 62 * Math.PI / 180, aspect, 0.02, 20);
      gl.useProgram(L.p); for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.enableVertexAttribArray(L.a[k]);
      gl.uniformMatrix4fv(L.u.uVP, false, proj); gl.uniform3f(L.u.uCam, 0, 0, 0); gl.uniform1f(L.u.uFogMax, 0); gl.uniform1f(L.u.uBaked, 0); gl.uniform1f(L.u.uAlphaTest, 0);
      const V = this.V, s = this.sunDir, sv = [V[0] * s[0] + V[4] * s[1] + V[8] * s[2], V[1] * s[0] + V[5] * s[1] + V[9] * s[2], V[2] * s[0] + V[6] * s[1] + V[10] * s[2]];
      gl.uniform3fv(L.u.uSun, sv);
      const shade = opt.shade == null ? 1 : opt.shade;
      gl.uniform3fv(L.u.uSunCol, E.sunCol.map(v => v * shade)); gl.uniform3fv(L.u.uAmb, E.amb.map(v => v * (0.6 + 0.4 * shade) + (opt.lampLight || 0)));
      gl.uniform1f(L.u.uShadow, 1);
      const LP = new Float32Array(MAXL * 3), LC = new Float32Array(MAXL * 4); for (let i = 0; i < MAXL; i++) LC[i * 4 + 3] = 1;
      const pos = S.VIEW_POS[wid] || S.VIEW_POS.colt;
      const flash = this.muzzleT > 0;
      if (flash) { LP.set([pos.hip[0], pos.hip[1] + 0.05, pos.hip[2] - 0.6], 0); LC.set([2.2, 1.5, 0.7, 2.5], 0); }
      gl.uniform3fv(L.u.uLP, LP); gl.uniform4fv(L.u.uLC, LC);
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1);
      gl.bindTexture(gl.TEXTURE_2D, this.tex.cloth);
      const vm = this.viewMesh(wid);
      const aim = p.aim, bobA = opt.bob === false ? 0 : 1, sp = Math.min(1, Math.hypot(p.vx, p.vz) / 4) * (p.ground ? 1 : 0.3) * bobA;
      const bx = Math.sin(p.bob * Math.PI) * 0.012 * sp * (1 - aim * 0.8), by = -Math.abs(Math.cos(p.bob * Math.PI)) * 0.01 * sp * (1 - aim * 0.8);
      const sway = opt.sway || [0, 0];
      const hp = pos.hip, ap = pos.aim;
      let x = lerp(hp[0], ap[0], aim) + bx + sway[0] * (1 - aim * 0.7), y = lerp(hp[1], ap[1], aim) + by + sway[1] * (1 - aim * 0.7), z = lerp(hp[2], ap[2], aim);
      const m = M4.create();
      let rx = 0, ry = 0, rz = 0;
      if (w.state === 'switch') { const k = w.t > 0.22 ? (0.45 - w.t) / 0.23 : w.t / 0.22; y -= clamp(k, 0, 1) * 0.3; rx -= clamp(k, 0, 1) * 0.5; }
      if (w.state === 'reload') { const T0 = d.reload || 2, f = clamp(1 - w.t / T0, 0, 1), k = Math.sin(f * Math.PI); y -= k * 0.08; rz += k * 0.6; rx -= k * 0.25; x += k * 0.03; }
      if (this.kickT > 0) { const k = this.kickT / 0.12; z += k * (d.cat === 5 ? 0.08 : 0.035) * (1 - aim * 0.5); rx += k * (d.bolt ? 0.1 : 0.06); }
      if (this.swingT > 0 && d.throw) { const k = Math.sin((1 - this.swingT / 0.35) * Math.PI); y += k * 0.08; z -= k * 0.2; rx += k * 0.8; }
      if (d.papers && game.actors.some(a => a.ai && a.ai.state === 'inspect' && a.ai.asked)) { y += 0.04; z += 0.04; }
      M4.translate(m, x, y, z); M4.rotY(m, ry); M4.rotX(m, rx); M4.rotZ(m, rz + p.lean * -0.1);
      gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(vm);
      for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.disableVertexAttribArray(L.a[k]);
      if (flash) {
        const P = this.pp; gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, proj); gl.uniform3f(P.u.uCam, 0, 0, 0); gl.uniform1f(P.u.uFog, 0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex.particle); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
        const mz = M4.xform(m, pos.muzzle[0], pos.muzzle[1], pos.muzzle[2]);
        const sz = d.cat === 1 ? 0.06 : d.cat === 5 ? 0.2 : 0.1;
        this.drawQuads([mz[0], mz[1], mz[2], sz, 1, 0.7, 0.3, 1, mz[0], mz[1], mz[2], sz * 0.45, 1, 1, 0.9, 1], [1, 0, 0], [0, 1, 0], 1);
        gl.depthMask(true); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      }
    }
    destroy() { const gl = this.gl; const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
  }

  S.Renderer = Renderer;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.Moh98 = globalThis.Moh98 || {});
