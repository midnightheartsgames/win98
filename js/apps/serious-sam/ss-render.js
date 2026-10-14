/**
 * Serious Sam 98 — WebGL 1 renderer.
 * Static level geometry is chunked by texture and area with lighting baked into vertex colours
 * (sun shadows via world ray casts, sky occlusion, torch light). Monsters are articulated rigs drawn part by part.
 * Also: procedural sky, particles/beams/decals, gibs, water, exit portals and the first-person weapon.
 */
(function (S) {
  'use strict';
  const { M4, Mesh, clamp, rgb } = S;
  const MAXL = 8;

  const VS_LIT = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP; uniform mat4 uM; uniform vec2 uUVOff;
varying vec3 vW; varying vec3 vN; varying vec2 vUV; varying vec4 vC;
void main(){ vec4 w = uM * vec4(aPos, 1.0); vW = w.xyz; vN = (uM * vec4(aNrm, 0.0)).xyz; vUV = aUV + uUVOff; vC = aCol; gl_Position = uVP * w; }`;
  const FS_LIT = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uAmb; uniform vec3 uFogCol; uniform float uFog; uniform float uFogMax;
uniform vec3 uCam; uniform float uBaked; uniform vec4 uTint; uniform float uAlpha;
uniform vec3 uLP[${MAXL}]; uniform vec4 uLC[${MAXL}];
varying vec3 vW; varying vec3 vN; varying vec2 vUV; varying vec4 vC;
void main(){
  vec4 t = texture2D(uTex, vUV);
  vec3 n = normalize(vN);
  vec3 dyn = vec3(0.0);
  for (int i = 0; i < ${MAXL}; i++) {
    vec3 d = uLP[i] - vW; float l = length(d) + 0.001; float a = max(0.0, 1.0 - l / uLC[i].w);
    dyn += uLC[i].rgb * a * a * (0.3 + 0.7 * max(dot(n, d / l), 0.0));
  }
  vec3 lit;
  if (uBaked > 0.5) lit = vC.rgb + dyn;
  else {
    float nd = max(dot(n, uSun), 0.0);
    lit = vC.rgb * (uAmb * (0.8 + 0.2 * n.y) + uSunCol * nd + dyn);
    lit = mix(vC.rgb * 1.15, lit, vC.a);
  }
  vec3 c = t.rgb * lit;
  c = mix(c, uTint.rgb, uTint.a);
  float dist = length(vW - uCam);
  float f = 1.0 - exp(-dist * dist * uFog * uFog);
  c = mix(c, uFogCol, clamp(f, 0.0, uFogMax));
  gl_FragColor = vec4(c, uAlpha * t.a);
}`;
  const VS_SKY = `attribute vec2 aP; varying vec2 vP; void main(){ vP = aP; gl_Position = vec4(aP, 0.9999, 1.0); }`;
  const FS_SKY = `
precision mediump float;
uniform vec3 uR; uniform vec3 uU; uniform vec3 uF; uniform vec2 uTan; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunCol; uniform float uTime; uniform float uClouds;
uniform sampler2D uCloud; varying vec2 vP;
void main(){
  vec3 d = normalize(uF + uR * vP.x * uTan.x + uU * vP.y * uTan.y);
  float h = clamp(d.y, -0.2, 1.0);
  vec3 c = mix(uHor, uTop, pow(clamp(h, 0.0, 1.0), 0.55));
  float s = max(dot(d, uSun), 0.0);
  c += uSunCol * (pow(s, 900.0) * 3.0 + pow(s, 24.0) * 0.28 + pow(s, 4.0) * 0.1);
  if (d.y > 0.01) {
    vec2 uv = d.xz / (d.y + 0.08) * 0.12 + vec2(uTime * 0.004, uTime * 0.002);
    float cl = texture2D(uCloud, uv).a * 0.75 + texture2D(uCloud, uv * 2.3 + 0.3).a * 0.35;
    cl = clamp(cl * uClouds * 1.4, 0.0, 1.0) * smoothstep(0.0, 0.25, d.y);
    c = mix(c, mix(vec3(1.0, 0.97, 0.92), uHor, 0.35) + uSunCol * pow(s, 8.0) * 0.3, cl * 0.85);
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

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: true, alpha: false, depth: true, powerPreference: 'high-performance' }) || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL unavailable');
      this.gl = gl;
      this.u32 = !!gl.getExtension('OES_element_index_uint');
      this.aniso = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      this.lit = compile(gl, VS_LIT, FS_LIT); this.sky = compile(gl, VS_SKY, FS_SKY); this.pp = compile(gl, VS_P, FS_P);
      this.tex = {};
      const T = S.textures();
      for (const k in T) this.tex[k] = this.upload(T[k], k !== 'particle' && k !== 'plain');
      this.skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      this.pBuf = gl.createBuffer(); this.pIdx = gl.createBuffer(); this.pCap = 0;
      this.parts = []; this.debris = []; this.lights = []; this.decals = []; this.beams = [];
      this.rigCache = {}; this.itemCache = {}; this.projCache = {}; this.viewCache = {};
      this.V = M4.create(); this.P = M4.create(); this.VP = M4.create(); this.time = 0; this.shake = 0;
      this.frame = { enemies: 0, chunks: 0 };
      gl.disable(gl.CULL_FACE); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    }
    upload(img, mip = true) {
      const gl = this.gl, t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, mip ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, mip ? gl.REPEAT : gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4); }
      else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      return t;
    }
    // Mesh -> GL buffers
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

    // ================================================================ level geometry
    setLevel(game) {
      if (this.chunks) for (const c of this.chunks) this.freeMesh(c.g);
      if (this.gates) for (const g of this.gates) this.freeMesh(g.g);
      if (this.waterMeshes) for (const w of this.waterMeshes) this.freeMesh(w.g);
      const W = game.W, def = game.def, env = def.env;
      this.game = game; this.W = W; this.env = env;
      const sl = Math.hypot(...env.sun); this.sun = env.sun.map(v => v / sl);
      this.parts.length = 0; this.debris.length = 0; this.decals.length = 0; this.beams.length = 0;
      const chunkMap = new Map();
      const chunk = (tex, x, z, size = 40) => { const key = `${tex}|${size}|${Math.floor(x / size)}|${Math.floor(z / size)}`; let c = chunkMap.get(key); if (!c || c.count > 50000) { c = new Mesh(); c.tex = tex; chunkMap.set(key, c); (this._all || (this._all = [])).push(c); } return c; };
      this._all = [];
      // boxes
      for (const b of def.boxes) { if (!b.render || b.gate) continue; this.emitBox(chunk, b); }
      // props
      this.emitters = []; this.portals = [];
      for (const p of def.props) {
        if (p.kind === 'portal') { this.portals.push(p); continue; }
        if (p.far) p.y = W.terrainAt(p.x, p.z) - 4;
        if (p.kind === 'torch') this.emitters.push({ x: p.x, y: p.y + 0.6, z: p.z, s: 0.8 });
        if (p.kind === 'brazier') this.emitters.push({ x: p.x, y: p.y + 1.3, z: p.z, s: 1.6 });
        const ms = S.propMeshes(p);
        for (const tex in ms) chunk(tex, p.x, p.z).append(ms[tex]);
      }
      // terrain
      this.emitTerrain(chunk);
      // bake lighting into static geometry
      this.staticLights = def.lights.slice();
      const t0 = Date.now();
      for (const m of this._all) this.bake(m);
      this.bakeMs = Date.now() - t0;
      this.chunks = this._all.filter(m => m.idx.length).map(m => ({ tex: m.tex, g: this.glMesh(m) }));
      this._all = null;
      // gates
      this.gates = [];
      for (const id in def.gates) {
        const b = def.gates[id].box, m = new Mesh();
        m.box(b.x0, b.y0, b.z0, b.x1, b.y1, b.z1, [1, 1, 1, 1], b.uvs);
        this.bakeFlat(m, 0.95); this.gates.push({ id, g: this.glMesh(m), tex: b.tex, h: b.y1 - b.y0 });
      }
      // water
      this.waterMeshes = def.fx.filter(f => f.kind === 'water').map(f => { const m = new Mesh(); m.quad([[f.x0, f.y, f.z1], [f.x1, f.y, f.z1], [f.x1, f.y, f.z0], [f.x0, f.y, f.z0]], [0, 1, 0], [[f.x0 / 6, f.z1 / 6], [f.x1 / 6, f.z1 / 6], [f.x1 / 6, f.z0 / 6], [f.x0 / 6, f.z0 / 6]], [1, 1, 1, 1]); return { g: this.glMesh(m) }; });
      // portal mesh
      if (!this.portalMesh) {
        const m = new Mesh(), gold = rgb(0xd8b050), stone = rgb(0xc8b090);
        m.cyl(0, 0, 0, 2.8, 2.6, 0.4, 16, stone);
        for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2; m.cbox(Math.cos(a) * 2.0, 2.6 + Math.sin(a) * 2.0, 0, 0.22, 0.22, 0.22, gold); }
        m.box(-2.4, 0.4, -0.3, -2.0, 2.6, 0.3, gold); m.box(2.0, 0.4, -0.3, 2.4, 2.6, 0.3, gold);
        this.portalMesh = this.glMesh(m);
        const d = new Mesh(); d.cyl(0, 0, 0, 1.85, 1.85, 0.02, 20, [1, 1, 1, 0]); this.portalDisk = this.glMesh(d);
      }
    }
    emitBox(chunk, b) {
      const tint = b.tint ? rgb(b.tint) : [1, 1, 1, 1], w = b.uvs, ts = 2.5;
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
      face(b.top, [x0, y1, z1], [1, 0, 0], [0, 0, -1], dx, dz, [0, 1, 0], p => [p[0], p[2]]);
      if (y0 > 0.3) face(b.tex, [x0, y0, z0], [1, 0, 0], [0, 0, 1], dx, dz, [0, -1, 0], p => [p[0], p[2]]);
      if (y1 > -0.05) {
        face(b.tex, [x0, y0, z1], [1, 0, 0], [0, 1, 0], dx, dy, [0, 0, 1], p => [p[0], -p[1]]);
        face(b.tex, [x1, y0, z0], [-1, 0, 0], [0, 1, 0], dx, dy, [0, 0, -1], p => [-p[0], -p[1]]);
        face(b.tex, [x1, y0, z1], [0, 0, -1], [0, 1, 0], dz, dy, [1, 0, 0], p => [-p[2], -p[1]]);
        face(b.tex, [x0, y0, z0], [0, 0, 1], [0, 1, 0], dz, dy, [-1, 0, 0], p => [p[2], -p[1]]);
      }
    }
    emitTerrain(chunk) {
      const W = this.W, C = 32, step = 2, white = [1, 1, 1, 1];
      for (let cz = W.bz0; cz < W.bz1; cz += C) for (let cx = W.bx0; cx < W.bx1; cx += C) {
        const m = chunk('sand', cx + 1, cz + 1), ex = Math.min(W.bx1, cx + C), ez = Math.min(W.bz1, cz + C);
        const nx = Math.ceil((ex - cx) / step), nz = Math.ceil((ez - cz) / step), base = m.count;
        for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
          const x = Math.min(ex, cx + i * step), z = Math.min(ez, cz + j * step), n = W.terrainNormal(x, z);
          m.vert(x, W.terrainAt(x, z), z, n[0], n[1], n[2], x / 8, z / 8, white);
        }
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = base + j * (nx + 1) + i, b = a + nx + 1; m.idx.push(a, b, a + 1, a + 1, b, b + 1); }
      }
      // outer ring: coarse, extends to the horizon
      const S16 = 16, R = 640, ox = W.bx0 - Math.ceil(R / S16) * S16, oz = W.bz0 - Math.ceil(R / S16) * S16;
      const nx = Math.ceil((W.bx1 + R - ox) / S16), nz = Math.ceil((W.bz1 + R - oz) / S16);
      const inside = (x, z) => x > W.bx0 + 0.5 && x < W.bx1 - 0.5 && z > W.bz0 + 0.5 && z < W.bz1 - 0.5;
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
        const x0 = ox + i * S16, z0 = oz + j * S16, x1 = x0 + S16, z1 = z0 + S16;
        if (inside(x0, z0) && inside(x1, z0) && inside(x0, z1) && inside(x1, z1)) continue;
        const m = chunk('sand', x0, z0, 320), P = (x, z) => [x, W.terrainAt(x, z) - (inside(x, z) ? 1.2 : 0), z];
        const ps = [P(x0, z1), P(x1, z1), P(x1, z0), P(x0, z0)], n = W.terrainNormal(x0 + 8, z0 + 8);
        m.quad(ps, n, ps.map(p => [p[0] / 8, p[2] / 8]), [1, 1, 1, 1]);
        m.outer = true;
      }
    }
    bake(m) {
      const W = this.W, env = this.env, sun = this.sun, amb = env.ambient, sc = env.sunColor, lights = this.staticLights;
      let topY = 0; for (const b of W.boxes) if (!b.invisible && b.y1 > topY) topY = b.y1;
      const p = m.pos, n = m.nrm, c = m.col;
      for (let i = 0, v = 0; i < p.length; i += 3, v += 4) {
        const x = p[i], y = p[i + 1], z = p[i + 2], nx = n[i], ny = n[i + 1], nz = n[i + 2];
        const far = x < W.bx0 - 2 || x > W.bx1 + 2 || z < W.bz0 - 2 || z > W.bz1 + 2;
        const ndl = Math.max(0, nx * sun[0] + ny * sun[1] + nz * sun[2]);
        let sh = 1, sky = 1;
        if (!far) {
          const ox = x + nx * 0.06, oy = y + ny * 0.06, oz = z + nz * 0.06;
          if (ndl > 0 && y < topY) { const t = (topY + 0.5 - oy) / Math.max(0.05, sun[1]); if (W.ray(ox, oy, oz, sun[0], sun[1], sun[2], Math.min(250, t), true, true)) sh = 0; }
          if (y < topY && ny > -0.5 && W.ray(ox, oy + 0.02, oz, 0, 1, 0, topY + 1 - oy, true, true)) sky = 0.42;
        }
        const k = sh * ndl;
        let r = amb[0] * sky * (0.78 + 0.22 * ny) + sc[0] * k, g = amb[1] * sky * (0.78 + 0.22 * ny) + sc[1] * k, bl = amb[2] * sky * (0.78 + 0.22 * ny) + sc[2] * k;
        if (!far) for (const L of lights) {
          const dx = L.x - x, dy = L.y - y, dz = L.z - z, d = Math.hypot(dx, dy, dz); if (d >= L.r) continue;
          const a = (1 - d / L.r) ** 2 * (0.35 + 0.65 * Math.max(0, (dx * nx + dy * ny + dz * nz) / (d || 1))) * 1.5;
          r += L.c[0] * a; g += L.c[1] * a; bl += L.c[2] * a;
        }
        const e = c[v + 3];
        c[v] = c[v] * (r * e + (1 - e) * 1.2); c[v + 1] = c[v + 1] * (g * e + (1 - e) * 1.2); c[v + 2] = c[v + 2] * (bl * e + (1 - e) * 1.2); c[v + 3] = 1;
      }
    }
    bakeFlat(m, k) { const env = this.env, s = this.sun; for (let i = 0, v = 0; i < m.pos.length; i += 3, v += 4) { const nd = Math.max(0, m.nrm[i] * s[0] + m.nrm[i + 1] * s[1] + m.nrm[i + 2] * s[2]); for (let q = 0; q < 3; q++) m.col[v + q] *= (env.ambient[q] + env.sunColor[q] * nd * 0.7) * k; } }

    // ================================================================ cached dynamic meshes
    rig(type) {
      if (this.rigCache[type]) return this.rigCache[type];
      const model = S.MODELS[type], parts = {};
      for (const p of model.parts) { const m = new Mesh(); p.build(m); parts[p.n] = m.count ? this.glMesh(m) : null; }
      return (this.rigCache[type] = { model, parts });
    }
    itemMesh(type) {
      if (this.itemCache[type]) return this.itemCache[type];
      let m = S.PICKUPS[type];
      if (!m && type.startsWith('w_')) {
        const v = S.VIEW[type.slice(2)]; m = new Mesh();
        m.with(M4.scale(M4.create(), 1.8), q => { for (const k in v) v[k](q); });
      }
      return (this.itemCache[type] = this.glMesh(m || new Mesh().cbox(0, 0, 0, 0.2, 0.2, 0.2, [1, 0, 1, 1])));
    }
    projMesh(name) { return this.projCache[name] || (this.projCache[name] = this.glMesh(S.PROJ_MODELS[name])); }
    viewMesh(w) {
      if (this.viewCache[w]) return this.viewCache[w];
      const v = S.VIEW[w], out = {};
      for (const k in v) { const m = new Mesh(); v[k](m); out[k] = this.glMesh(m); }
      return (this.viewCache[w] = out);
    }

    // ================================================================ particles & effects
    add(o) { if (this.parts.length > 3500) this.parts.shift(); this.parts.push(o); return o; }
    puff(x, y, z, n, o) {
      const r = Math.random;
      for (let i = 0; i < n; i++) {
        const sp = o.speed || 2, a = r() * Math.PI * 2, u = r() * 2 - 1, s = Math.sqrt(1 - u * u);
        this.add({ x: x + (r() - 0.5) * (o.spread || 0), y: y + (r() - 0.5) * (o.spread || 0), z: z + (r() - 0.5) * (o.spread || 0),
          vx: Math.cos(a) * s * sp * (0.3 + r()), vy: u * sp * (0.3 + r()) + (o.up || 0), vz: Math.sin(a) * s * sp * (0.3 + r()),
          life: (o.life || 1) * (0.6 + r() * 0.6), t: 0, size: (o.size || 0.3) * (0.7 + r() * 0.6), grow: o.grow || 0, col: o.col, add: !!o.add, grav: o.grav || 0, drag: o.drag || 0.5, fade: o.fade });
      }
    }
    light(x, y, z, r, c, life) { this.lights.push({ x, y, z, r, c, life, max: life }); }
    events(evs, game) {
      const W = this.W;
      for (const e of evs) {
        switch (e.t) {
          case 'impact':
            if (e.energy) { this.puff(e.x, e.y, e.z, 8, { speed: 3, life: 0.35, size: 0.18, col: [e.energy[0], e.energy[1], e.energy[2], 1], add: true, grav: 4 }); this.light(e.x, e.y, e.z, 4, e.energy, 0.12); }
            else { this.puff(e.x, e.y, e.z, 4, { speed: 1.2, life: 0.8, size: 0.35, grow: 0.8, col: e.terrain ? [0.8, 0.68, 0.5, 0.6] : [0.7, 0.62, 0.5, 0.55], up: 0.6 }); this.puff(e.x, e.y, e.z, 3, { speed: 6, life: 0.2, size: 0.07, col: [1, 0.85, 0.5, 1], add: true, grav: 10 }); }
            break;
          case 'blood': this.puff(e.x, e.y, e.z, Math.round(e.n), { speed: 3, life: 0.7, size: e.big ? 0.35 : 0.22, col: [0.55, 0.02, 0.02, 0.9], grav: 12, drag: 0.2 }); break;
          case 'explosion': {
            const s = e.r / 5;
            if (!e.dust) {
              this.puff(e.x, e.y, e.z, 14, { speed: 5 * s, life: 0.55, size: 1.2 * s, grow: 2 * s, col: [1, 0.55, 0.18, 1], add: true, drag: 3 });
              this.puff(e.x, e.y, e.z, 10, { speed: 2.5 * s, life: 2.2, size: 1.0 * s, grow: 1.8 * s, col: [0.25, 0.22, 0.2, 0.55], up: 1.6, drag: 1 });
              this.puff(e.x, e.y, e.z, 16, { speed: 14 * s, life: 0.6, size: 0.1, col: [1, 0.8, 0.4, 1], add: true, grav: 14, drag: 0.3 });
              this.light(e.x, e.y + 0.5, e.z, e.r * 3, [1.6, 0.9, 0.4], 0.45);
              const fy = W.floorAt(e.x, e.z, 0.2, e.y + 0.5); if (e.y - fy < 1.5) this.decals.push({ x: e.x, y: fy + 0.04, z: e.z, s: e.r * 0.45, life: 25, t: 0, col: [0, 0, 0, 0.55] });
            } else this.puff(e.x, e.y + 0.5, e.z, 24, { speed: 8, life: 1.5, size: 2.4, grow: 3, col: [0.7, 0.6, 0.45, 0.5], up: 1, drag: 2 });
            this.shake = Math.max(this.shake, clamp((e.big ? 1 : 0.5) * (1 - Math.hypot(e.x - game.player.x, e.z - game.player.z) / 60), 0, 1));
            break;
          }
          case 'spawn':
            this.puff(e.x, e.y + e.h * 0.5, e.z, e.item ? 12 : 22, { speed: 1.5, life: 0.8, size: 0.25, spread: Math.max(e.r * 2, 1), col: e.item ? [0.6, 1, 0.6, 1] : [0.6, 0.85, 1, 1], add: true, up: 2.5, drag: 1.5 });
            this.light(e.x, e.y + e.h * 0.5, e.z, 6 + e.r * 3, [0.6, 0.8, 1.4], 0.5);
            break;
          case 'tracer': this.beams.push({ a: [e.x0, e.y0, e.z0], b: [e.x1, e.y1, e.z1], w: e.enemy ? 0.06 : 0.04, col: e.enemy ? [1, 0.5, 0.2, 0.9] : [1, 0.9, 0.6, 0.7], life: 0.05, t: 0 }); break;
          case 'gib': this.gib(e.e, e.big); break;
          case 'die': break;
          case 'fire': {
            const p = game.player, f = game.forward();
            if (e.w !== 'knife') this.light(p.x + f[0] * 1.2, game.eye + f[1] * 1.2, p.z + f[2] * 1.2, e.w === 'laser' ? 7 : 9, e.w === 'laser' ? [0.3, 1.2, 0.3] : [1.4, 1.0, 0.5], 0.07);
            this.muzzleT = e.w === 'knife' ? 0 : 0.06; this.muzzleW = e.w; this.muzzleHand = e.hand; this.muzzleBarrel = e.barrel;
            break;
          }
          case 'shake': this.shake = Math.max(this.shake, e.a); break;
          default: break;
        }
      }
    }
    gib(e, big) {
      const rg = this.rig(e.type), model = rg.model;
      const root = M4.rotY(M4.translate(M4.create(), e.x, e.y, e.z), e.yaw); M4.scale(root, model.scale || 1);
      const mats = S.poseMatrices(model, root, Object.assign({}, e.anim, { move: 0 }));
      const bone = e.type === 'kleer', metal = /bio|arach|ughzan/.test(e.type), r = Math.random;
      for (const p of model.parts) {
        if (!rg.parts[p.n]) continue;
        const m = mats[p.n], base = M4.copy(M4.create(), m); base[12] = base[13] = base[14] = 0;
        const dx = m[12] - e.x, dz = m[14] - e.z, l = Math.hypot(dx, dz) || 1, sp = 3 + r() * 5;
        this.debris.push({ g: rg.parts[p.n], base, x: m[12], y: m[13], z: m[14], vx: (dx / l) * sp + (r() - 0.5) * 4, vy: 4 + r() * 6, vz: (dz / l) * sp + (r() - 0.5) * 4, ax: (r() - 0.5) * 12, az: (r() - 0.5) * 12, rot: 0, life: 5 + r() * 3, t: 0 });
      }
      if (this.debris.length > 400) this.debris.splice(0, this.debris.length - 400);
      const cy = e.y + e.h * 0.5;
      if (bone) this.puff(e.x, cy, e.z, 16, { speed: 3, life: 1.2, size: 0.4, grow: 1, col: [0.85, 0.8, 0.7, 0.6] });
      else if (metal) this.puff(e.x, cy, e.z, 30, { speed: 8, life: 0.7, size: 0.12, col: [1, 0.8, 0.3, 1], add: true, grav: 12 });
      else this.puff(e.x, cy, e.z, big ? 40 : 24, { speed: 5, life: 0.9, size: 0.3, col: [0.6, 0.02, 0.02, 0.95], grav: 12, drag: 0.2, spread: e.r });
    }
    stepEffects(dt, game) {
      this.time += dt;
      const W = this.W;
      for (const p of this.parts) {
        p.t += dt; const k = Math.max(0, 1 - p.drag * dt);
        p.vx *= k; p.vy = p.vy * k - p.grav * dt; p.vz *= k;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.size += p.grow * dt;
      }
      this.parts = this.parts.filter(p => p.t < p.life);
      for (const d of this.debris) {
        d.t += dt; d.vy -= 22 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.rot += dt;
        const fl = W.floorAt(d.x, d.z, 0.2, d.y + 0.6);
        if (d.y < fl + 0.1) { d.y = fl + 0.1; if (d.vy < 0) d.vy *= -0.3; d.vx *= 0.7; d.vz *= 0.7; d.ax *= 0.7; d.az *= 0.7; }
        if (d.t > d.life - 1) d.y -= dt * 0.4;
      }
      this.debris = this.debris.filter(d => d.t < d.life);
      for (const L of this.lights) L.life -= dt;
      this.lights = this.lights.filter(L => L.life > 0);
      for (const b of this.beams) b.t += dt;
      this.beams = this.beams.filter(b => b.t < b.life);
      for (const d of this.decals) d.t += dt;
      this.decals = this.decals.filter(d => d.t < d.life);
      if (this.muzzleT > 0) this.muzzleT -= dt;
      this.shake = Math.max(0, this.shake - dt * 2.2);
      // ambient emitters
      this.emitAcc = (this.emitAcc || 0) + dt;
      if (this.emitAcc > 0.05) {
        this.emitAcc = 0;
        const px = game.player.x, pz = game.player.z;
        for (const e of this.emitters) if (Math.abs(e.x - px) < 70 && Math.abs(e.z - pz) < 70) {
          this.add({ x: e.x + (Math.random() - 0.5) * 0.2 * e.s, y: e.y, z: e.z + (Math.random() - 0.5) * 0.2 * e.s, vx: 0, vy: 1.4 * e.s, vz: 0, life: 0.45, t: 0, size: 0.35 * e.s, grow: -0.4 * e.s, col: [1, 0.5, 0.15, 0.9], add: true, grav: 0, drag: 0.5 });
        }
        for (const p of this.portals) {
          const on = game.waveDone(p.after), a = Math.random() * Math.PI * 2;
          if (on) this.add({ x: p.x + Math.cos(a) * 1.9, y: (p.y || 0) + 2.6 + Math.sin(a) * 1.9, z: p.z, vx: -Math.cos(a) * 1.2, vy: -Math.sin(a) * 1.2, vz: 0, life: 1.4, t: 0, size: 0.3, grow: -0.1, col: [0.5, 0.9, 1, 1], add: true, grav: 0, drag: 0 });
        }
        for (const pr of game.projs) {
          const d = pr.def;
          if (d.trail === 'smoke') this.add({ x: pr.x, y: pr.y, z: pr.z, vx: 0, vy: 0.3, vz: 0, life: 0.9, t: 0, size: 0.25, grow: 1.2, col: [0.6, 0.6, 0.6, 0.45], add: false, grav: 0, drag: 1 });
          if (d.trail === 'fire') this.add({ x: pr.x, y: pr.y, z: pr.z, vx: 0, vy: 0.5, vz: 0, life: 0.4, t: 0, size: d.size * 1.6, grow: -0.5, col: [1, 0.45, 0.1, 0.9], add: true, grav: 0, drag: 1 });
        }
      }
    }

    // ================================================================ frame
    resize(w, h) { this.canvas.width = w; this.canvas.height = h; }
    setLights(list, cam) {
      // pick the strongest MAXL lights for this frame
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
    boxVisible(pl, mn, mx) {
      for (const p of pl) { const x = p[0] > 0 ? mx[0] : mn[0], y = p[1] > 0 ? mx[1] : mn[1], z = p[2] > 0 ? mx[2] : mn[2]; if (p[0] * x + p[1] * y + p[2] * z + p[3] < 0) return false; }
      return true;
    }
    sphereVisible(pl, x, y, z, r) { for (const p of pl) if (p[0] * x + p[1] * y + p[2] * z + p[3] < -r) return false; return true; }

    render(game, cam, opt = {}) {
      const gl = this.gl, env = this.env, W = this.W, w = this.canvas.width, h = this.canvas.height;
      gl.viewport(0, 0, w, h);
      const aspect = w / h, fov = (opt.fov || 90) * Math.PI / 180, vfov = 2 * Math.atan(Math.tan(fov / 2) / aspect);
      let sx = 0, sy = 0; if (this.shake > 0) { sx = (Math.random() - 0.5) * this.shake * 0.25; sy = (Math.random() - 0.5) * this.shake * 0.25; }
      const cx = cam.x + sx, cy = cam.y + sy, cz = cam.z;
      M4.perspective(this.P, vfov, aspect, 0.08, 1400);
      this.aspect = aspect; this.tanH = Math.tan(fov / 2); this.tanV = Math.tan(vfov / 2); this.vmOn = !!opt.viewmodel;
      M4.view(this.V, cx, cy, cz, cam.yaw, cam.pitch, cam.roll || 0);
      M4.mul(this.VP, this.P, this.V);
      const pl = this.frustum(this.VP);
      gl.clearColor(env.fog[0], env.fog[1], env.fog[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      // ---- sky
      const V = this.V, R = [V[0], V[4], V[8]], U = [V[1], V[5], V[9]], F = [-V[2], -V[6], -V[10]];
      gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
      const sk = this.sky; gl.useProgram(sk.p);
      gl.uniform3fv(sk.u.uR, R); gl.uniform3fv(sk.u.uU, U); gl.uniform3fv(sk.u.uF, F); gl.uniform2f(sk.u.uTan, Math.tan(vfov / 2) * aspect, Math.tan(vfov / 2));
      gl.uniform3fv(sk.u.uTop, env.skyTop); gl.uniform3fv(sk.u.uHor, env.skyHorizon); gl.uniform3fv(sk.u.uSun, this.sun); gl.uniform3fv(sk.u.uSunCol, env.sunColor); gl.uniform1f(sk.u.uTime, this.time); gl.uniform1f(sk.u.uClouds, env.clouds);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.cloud); gl.uniform1i(sk.u.uCloud, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf); gl.enableVertexAttribArray(sk.a.aP); gl.vertexAttribPointer(sk.a.aP, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.disableVertexAttribArray(sk.a.aP);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      // ---- lit geometry
      const L = this.lit; gl.useProgram(L.p);
      for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.enableVertexAttribArray(L.a[k]);
      gl.uniformMatrix4fv(L.u.uVP, false, this.VP); gl.uniform3fv(L.u.uCam, [cx, cy, cz]);
      gl.uniform3fv(L.u.uSun, this.sun); gl.uniform3fv(L.u.uSunCol, env.sunColor); gl.uniform3fv(L.u.uAmb, env.ambient);
      gl.uniform3fv(L.u.uFogCol, env.fog); gl.uniform1f(L.u.uFog, env.fogDensity); gl.uniform1f(L.u.uFogMax, 1);
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1); gl.uniform2f(L.u.uUVOff, 0, 0); gl.uniform1i(L.u.uTex, 0);
      // dynamic lights: effects + nearby torches + projectiles + portals
      const dl = this.lights.slice();
      for (const s of this.staticLights) if (Math.abs(s.x - cx) < 45 && Math.abs(s.z - cz) < 45) dl.push({ x: s.x, y: s.y, z: s.z, r: s.r * 0.8, c: s.c.map(v => v * (0.85 + 0.15 * Math.sin(this.time * 13 + s.x))) });
      for (const pr of game.projs) if (pr.def.light) dl.push({ x: pr.x, y: pr.y, z: pr.z, r: 6 + pr.def.size * 6, c: pr.def.light });
      for (const p of this.portals) if (game.waveDone(p.after)) dl.push({ x: p.x, y: (p.y || 0) + 2.5, z: p.z, r: 10, c: [0.4, 0.8, 1.3] });
      const LS = this.setLights(dl, [cx, cy, cz]); gl.uniform3fv(L.u.uLP, LS.P); gl.uniform4fv(L.u.uLC, LS.C);
      // static chunks
      gl.uniform1f(L.u.uBaked, 1); gl.uniformMatrix4fv(L.u.uM, false, ident);
      let lastTex = null, nch = 0;
      for (const c of this.chunks) {
        if (!this.boxVisible(pl, c.g.min, c.g.max)) continue;
        if (c.tex !== lastTex) { gl.bindTexture(gl.TEXTURE_2D, this.tex[c.tex] || this.tex.plain); lastTex = c.tex; }
        this.drawMesh(c.g); nch++;
      }
      // gates
      for (const g of this.gates) {
        const st = game.gates[g.id]; if (!st || st.t >= 0.999) continue;
        const m = M4.translate(M4.create(), 0, -st.t * g.h, 0); gl.uniformMatrix4fv(L.u.uM, false, m);
        gl.bindTexture(gl.TEXTURE_2D, this.tex[g.tex] || this.tex.gate); this.drawMesh(g.g);
      }
      // ---- dynamic lit objects
      gl.uniform1f(L.u.uBaked, 0);
      // portals
      for (const p of this.portals) {
        const m = M4.rotY(M4.translate(M4.create(), p.x, p.y || 0, p.z), (p.rot || 0));
        gl.bindTexture(gl.TEXTURE_2D, this.tex.gold); gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(this.portalMesh);
        const on = game.waveDone(p.after);
        const md = M4.rotX(M4.translate(M4.create(), p.x, (p.y || 0) + 2.6, p.z), Math.PI / 2);
        gl.bindTexture(gl.TEXTURE_2D, this.tex.water); gl.uniform2f(L.u.uUVOff, this.time * 0.3, this.time * 0.1);
        gl.uniform4f(L.u.uTint, on ? 0.45 : 0.1, on ? 0.85 : 0.1, on ? 1 : 0.12, on ? 0.55 + 0.1 * Math.sin(this.time * 4) : 0.7);
        gl.uniformMatrix4fv(L.u.uM, false, md); this.drawMesh(this.portalDisk);
        gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform2f(L.u.uUVOff, 0, 0);
      }
      // items
      for (const it of game.items) {
        if (it.taken) continue;
        const y = it.y + 0.55 + Math.sin(this.time * 2.5 + it.ph) * 0.12;
        if (!this.sphereVisible(pl, it.x, y, it.z, 1)) continue;
        const m = M4.rotY(M4.translate(M4.create(), it.x, y, it.z), this.time * 1.6 + it.ph);
        gl.bindTexture(gl.TEXTURE_2D, this.tex.flesh); gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(this.itemMesh(it.type));
      }
      // monsters
      let ne = 0;
      gl.bindTexture(gl.TEXTURE_2D, this.tex.flesh);
      for (const e of game.enemies) {
        const sc = (S.MODELS[e.type].scale || 1);
        if (!this.sphereVisible(pl, e.x, e.y + e.h / 2, e.z, e.h * 0.8 + 1)) continue;
        if (Math.hypot(e.x - cx, e.z - cz) > 700) continue;
        const rg = this.rig(e.type), root = M4.translate(M4.create(), e.x, e.y, e.z);
        if (e.dead) { const sink = Math.max(0, e.deadT - 5) * 0.5; M4.translate(root, 0, -sink, 0); }
        M4.rotY(root, e.yaw);
        if (e.dead) { const k = Math.min(1, e.deadT * 2.2); M4.rotX(root, -k * Math.PI / 2 * (e.fly ? 1 : 0.95)); }
        M4.scale(root, sc);
        const anim = e.dead ? Object.assign({}, e.anim, { move: 0, attack: 0 }) : e.anim;
        const mats = S.poseMatrices(rg.model, root, anim);
        if (e.spawnT > 0) gl.uniform4f(L.u.uTint, 0.7, 0.9, 1, clamp(e.spawnT / 0.6, 0, 1));
        else if (e.flash > 0) gl.uniform4f(L.u.uTint, 1, 0.25, 0.2, clamp(e.flash * 5, 0, 0.6));
        else if (game.player.power > 0 && false) gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
        else gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
        for (const p of rg.model.parts) { const g = rg.parts[p.n]; if (!g) continue; gl.uniformMatrix4fv(L.u.uM, false, mats[p.n]); this.drawMesh(g); }
        ne++;
      }
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0);
      // gibs
      for (const d of this.debris) {
        const m = M4.translate(M4.create(), d.x, d.y, d.z); M4.mul(m, m, d.base); M4.rotX(m, d.ax * d.rot); M4.rotZ(m, d.az * d.rot);
        gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(d.g);
      }
      // projectile models
      for (const pr of game.projs) {
        const d = pr.def; if (!d.model) continue;
        const hl = Math.hypot(pr.vx, pr.vz), yaw = Math.atan2(pr.vx, pr.vz), pitch = Math.atan2(pr.vy, hl || 1e-6);
        const m = M4.translate(M4.create(), pr.x, pr.y, pr.z); M4.rotY(m, yaw); M4.rotX(m, -pitch); M4.rotY(m, Math.PI);
        if (d.model === 'ball' || d.model === 'grenade') M4.rotX(m, this.time * 12);
        gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(this.projMesh(d.model));
      }
      // water
      if (this.waterMeshes.length) {
        gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
        gl.bindTexture(gl.TEXTURE_2D, this.tex.water); gl.uniformMatrix4fv(L.u.uM, false, ident); gl.uniform1f(L.u.uAlpha, 0.78);
        gl.uniform2f(L.u.uUVOff, this.time * 0.02, this.time * 0.013);
        for (const wm of this.waterMeshes) this.drawMesh(wm.g);
        gl.uniform1f(L.u.uAlpha, 1); gl.uniform2f(L.u.uUVOff, 0, 0); gl.depthMask(true); gl.disable(gl.BLEND);
      }
      for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.disableVertexAttribArray(L.a[k]);
      // ---- particles, beams, decals, shadows
      this.drawParticles(game, [cx, cy, cz], R, U, F);
      // ---- first-person weapon
      if (opt.viewmodel && !game.player.dead) this.drawViewmodel(game, cam, aspect, opt);
      this.frame.enemies = ne; this.frame.chunks = nch;
    }

    drawParticles(game, cam, R, U, F) {
      const gl = this.gl, P = this.pp, env = this.env, W = this.W;
      const quads = [], flat = [];
      const push = (list, x, y, z, s, c) => list.push(x, y, z, s, c[0], c[1], c[2], c[3]);
      // shadows & decals lie flat
      for (const e of game.enemies) {
        if (e.dead && e.deadT > 1) continue;
        const d2 = (e.x - cam[0]) ** 2 + (e.z - cam[2]) ** 2; if (d2 > 110 * 110) continue;
        const fy = W.floorAt(e.x, e.z, 0.2, e.y + 0.3);
        const a = clamp(0.45 - (e.y - fy) * 0.03, 0.1, 0.45);
        push(flat, e.x, fy + 0.05, e.z, e.r * 1.3 * (S.MODELS[e.type].scale > 3 ? 1.6 : 1), [0, 0, 0, a]);
      }
      for (const it of game.items) if (!it.taken && (it.x - cam[0]) ** 2 + (it.z - cam[2]) ** 2 < 3600) push(flat, it.x, it.y + 0.04, it.z, 0.45, [0, 0, 0, 0.35]);
      for (const d of this.decals) push(flat, d.x, d.y, d.z, d.s, [0, 0, 0, d.col[3] * clamp((d.life - d.t) / 5, 0, 1)]);
      const alpha = [], add = [];
      for (const p of this.parts) {
        const f = clamp(1 - p.t / p.life, 0, 1), a = p.col[3] * (p.add ? f : Math.min(1, f * 1.6));
        push(p.add ? add : alpha, p.x, p.y, p.z, Math.max(0.01, p.size), [p.col[0], p.col[1], p.col[2], a]);
      }
      // projectile glows & muzzle flashes of enemies
      for (const pr of game.projs) {
        const d = pr.def; if (!d.sprite) continue;
        let x = pr.x, y = pr.y, z = pr.z;
        const age = pr.muzzle ? game.time - pr.born : 1;
        if (age < 0.12 && this.vmOn) {
          const tip = this.muzzleTipWorld(pr, cam, R, U, F), k = 1 - age / 0.12;
          x += (tip[0] - pr.ox) * k; y += (tip[1] - pr.oy) * k; z += (tip[2] - pr.oz) * k;
          if (age < 0.05) for (let i = 1; i <= 4; i++) { const s = i / 5; push(add, tip[0] + (x - tip[0]) * s, tip[1] + (y - tip[1]) * s, tip[2] + (z - tip[2]) * s, 0.05 + s * 0.08, [0.4, 1, 0.4, 0.7]); }
        }
        push(add, x, y, z, d.size * 2.2 + (d.glow || 0) * 0.3, [d.sprite[0], d.sprite[1], d.sprite[2], 1]);
        push(add, x, y, z, d.size * 0.9, [1, 1, 1, 0.9]);
        if (d === S.DATA.PROJ.laser) { push(add, x - pr.vx * 0.006, y - pr.vy * 0.006, z - pr.vz * 0.006, 0.18, [0.4, 1, 0.4, 0.8]); }
      }
      for (const pr of game.projs) if (pr.def.model === 'rocket') push(add, pr.x - pr.vx * 0.012, pr.y - pr.vy * 0.012, pr.z - pr.vz * 0.012, 0.45, [1, 0.7, 0.3, 1]);
      // portal beams
      for (const p of this.portals) if (game.waveDone(p.after)) for (let i = 0; i < 6; i++) push(add, p.x, (p.y || 0) + 2.6 + i * 5, p.z, 2.6 - i * 0.2, [0.3, 0.6, 1, 0.22]);

      gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, this.VP); gl.uniform3fv(P.u.uCam, cam); gl.uniform1f(P.u.uFog, env.fogDensity); gl.uniform3fv(P.u.uFogCol, env.fog);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.particle); gl.uniform1i(P.u.uTex, 0);
      gl.enable(gl.BLEND); gl.depthMask(false);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4);
      this.drawQuads(flat, [1, 0, 0], [0, 0, 1], 0);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      this.drawQuads(alpha, R, U, 0);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      this.drawQuads(add, R, U, 1);
      // beams: explicit vertices
      if (this.beams.length) {
        const bv = [];
        for (const b of this.beams) {
          const d = [b.b[0] - b.a[0], b.b[1] - b.a[1], b.b[2] - b.a[2]], mid = [(b.a[0] + b.b[0]) / 2 - cam[0], (b.a[1] + b.b[1]) / 2 - cam[1], (b.a[2] + b.b[2]) / 2 - cam[2]];
          let s = [d[1] * mid[2] - d[2] * mid[1], d[2] * mid[0] - d[0] * mid[2], d[0] * mid[1] - d[1] * mid[0]]; const l = Math.hypot(...s) || 1; s = s.map(v => (v / l) * b.w);
          const c = b.col;
          for (const [p, cx] of [[b.a, -1], [b.a, 1], [b.b, 1], [b.b, -1]]) bv.push(p[0] + s[0] * cx, p[1] + s[1] * cx, p[2] + s[2] * cx, cx, 0, c[0], c[1], c[2], c[3], 0);
        }
        this.drawRaw(bv, 1);
      }
      gl.depthMask(true); gl.disable(gl.BLEND);
    }
    // quads: [x,y,z,size,r,g,b,a]*n
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
        this.pCap = Math.max(n, this.pCap * 2, 256); const idx = new Uint16Array(this.pCap * 6);
        for (let i = 0; i < this.pCap && i < 16383; i++) idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pIdx); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      }
      gl.uniform1f(P.u.uAdd, additive);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuf); gl.bufferData(gl.ARRAY_BUFFER, verts instanceof Float32Array ? verts : new Float32Array(verts), gl.STREAM_DRAW);
      const st = 40;
      for (const [name, size, off] of [['aPos', 3, 0], ['aCorner', 2, 12], ['aCol', 4, 20], ['aSize', 1, 36]]) { gl.enableVertexAttribArray(P.a[name]); gl.vertexAttribPointer(P.a[name], size, gl.FLOAT, false, st, off); }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.pIdx); gl.drawElements(gl.TRIANGLES, Math.min(n, 16383) * 6, gl.UNSIGNED_SHORT, 0);
      for (const name of ['aPos', 'aCorner', 'aCol', 'aSize']) gl.disableVertexAttribArray(P.a[name]);
    }

    drawViewmodel(game, cam, aspect, opt) {
      const gl = this.gl, L = this.lit, p = game.player, t = game.time;
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const proj = M4.perspective(M4.create(), 58 * Math.PI / 180, aspect, 0.02, 20);
      gl.useProgram(L.p); for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.enableVertexAttribArray(L.a[k]);
      gl.uniformMatrix4fv(L.u.uVP, false, proj); gl.uniform3f(L.u.uCam, 0, 0, 0); gl.uniform1f(L.u.uFogMax, 0); gl.uniform1f(L.u.uBaked, 0);
      const V = this.V, s = this.sun, sv = [V[0] * s[0] + V[4] * s[1] + V[8] * s[2], V[1] * s[0] + V[5] * s[1] + V[9] * s[2], V[2] * s[0] + V[6] * s[1] + V[10] * s[2]];
      gl.uniform3fv(L.u.uSun, sv);
      // light level at the player's feet (dark tombs darken the gun)
      const shade = opt.shade == null ? 1 : opt.shade;
      gl.uniform3fv(L.u.uSunCol, this.env.sunColor.map(v => v * shade)); gl.uniform3fv(L.u.uAmb, this.env.ambient.map(v => v * (0.6 + 0.4 * shade)));
      const w = p.next && p.switchT > 0.2 ? p.cur : p.cur, pos = S.VIEW_POS[w], vm = this.viewMesh(w);
      const flash = this.muzzleT > 0;
      const LP = new Float32Array(MAXL * 3), LC = new Float32Array(MAXL * 4); for (let i = 0; i < MAXL; i++) LC[i * 4 + 3] = 1;
      const mb = w === 'laser' && this.muzzleBarrel != null ? S.DATA.WEAPONS.laser.barrels[this.muzzleBarrel] : null, mu = mb ? [mb[0], mb[1], pos.muzzle[2]] : pos.muzzle;
      if (flash) { LP.set(mb ? [pos.at[0] + mu[0], pos.at[1] + mu[1], pos.at[2] + mu[2] + 0.04] : [pos.at[0], pos.at[1] + 0.05, pos.at[2] - 0.5], 0); LC.set(w === 'laser' ? [0.4, 1.6, 0.4, 2.5] : [1.8, 1.2, 0.6, 2.5], 0); }
      gl.uniform3fv(L.u.uLP, LP); gl.uniform4fv(L.u.uLC, LC);
      gl.uniform4f(L.u.uTint, 0, 0, 0, 0); gl.uniform1f(L.u.uAlpha, 1);
      if (p.power > 0) gl.uniform4f(L.u.uTint, 1, 0.3, 0.9, 0.12 + 0.08 * Math.sin(t * 10));
      gl.bindTexture(gl.TEXTURE_2D, this.tex.flesh);
      const bobA = opt.bob === false ? 0 : 1, sp = Math.min(1, Math.hypot(p.vx, p.vz) / 10) * (p.ground ? 1 : 0.3) * bobA;
      const bx = Math.sin(p.bob * 0.5 * Math.PI) * 0.018 * sp, by = -Math.abs(Math.cos(p.bob * 0.5 * Math.PI)) * 0.014 * sp;
      let sw = 0; if (p.switchT > 0) sw = p.switchT > 0.2 ? (0.4 - p.switchT) / 0.2 : p.switchT / 0.2;
      const since = t - p.lastFire, kick = Math.max(0, 1 - since / (w === 'cannon' ? 0.5 : w === 'dshotgun' || w === 'rocket' ? 0.35 : 0.15));
      const sway = opt.sway || [0, 0];
      const hands = w === 'colt' && p.dual ? [1, -1] : [1];
      for (const hd of hands) {
        const mine = hd === 1 ? p.hand === 1 || !p.dual : p.hand === 0;
        const k = mine || !p.dual ? kick : 0;
        const m = M4.translate(M4.create(), pos.at[0] * hd + bx + sway[0], pos.at[1] + by - sw * 0.35 + sway[1] - (w === 'cannon' ? p.charge * 0.04 : 0), pos.at[2] + k * 0.06);
        if (hd < 0) M4.scale(m, -1, 1, 1);
        if (w === 'knife' && since < 0.4) { const a = Math.sin((since / 0.4) * Math.PI); M4.translate(m, -0.1 * a, 0.05 * a, -0.18 * a); M4.rotY(m, 0.9 * a); M4.rotZ(m, -0.6 * a); }
        const rl = w === 'colt' ? this.coltReloadPose(p, hd) : null;
        if (rl) { M4.translate(m, -0.07 * rl.side * rl.tilt, 0.04 * rl.tilt, 0.02 * rl.tilt); M4.rotY(m, 0.75 * rl.side * rl.tilt); M4.rotX(m, 0.6 * rl.tilt + rl.jerk); M4.rotZ(m, 0.35 * rl.tilt); }
        M4.rotX(m, k * (w === 'colt' ? 0.5 : 0.12) * (w === 'minigun' || w === 'tommy' || w === 'laser' ? 0.4 : 1));
        gl.uniformMatrix4fv(L.u.uM, false, m); this.drawMesh(vm.body);
        if (vm.cyl) { const cm = M4.copy(M4.create(), m), open = rl ? rl.open : 0; M4.translate(cm, -0.05 * open, 0.019 - 0.014 * open, 0); M4.rotZ(cm, rl ? rl.spin : (p.clip % 6) * Math.PI / 3); M4.translate(cm, 0, -0.019, 0); gl.uniformMatrix4fv(L.u.uM, false, cm); this.drawMesh(vm.cyl); }
        if (vm.spin) { const sm = M4.copy(M4.create(), m); M4.rotZ(sm, w === 'minigun' ? p.spinA : (p.ammo.rockets || 0) * Math.PI / 2); gl.uniformMatrix4fv(L.u.uM, false, sm); this.drawMesh(vm.spin); }
        if (vm.barrel0) for (let i = 0; vm['barrel' + i]; i++) { const bm = M4.copy(M4.create(), m); M4.translate(bm, 0, 0, this.laserRecoil(t - p.barrelFire[i]) * 0.06); gl.uniformMatrix4fv(L.u.uM, false, bm); this.drawMesh(vm['barrel' + i]); }
        if (vm.pump) { const pm = M4.copy(M4.create(), m), ph = since > 0.2 && since < 0.6 ? Math.sin(((since - 0.2) / 0.4) * Math.PI) : 0; M4.translate(pm, 0, 0, ph * 0.12); gl.uniformMatrix4fv(L.u.uM, false, pm); this.drawMesh(vm.pump); }
      }
      for (const k of ['aPos', 'aNrm', 'aUV', 'aCol']) gl.disableVertexAttribArray(L.a[k]);
      // muzzle flash sprite
      if (flash) {
        const P = this.pp; gl.useProgram(P.p); gl.uniformMatrix4fv(P.u.uVP, false, proj); gl.uniform3f(P.u.uCam, 0, 0, 0); gl.uniform1f(P.u.uFog, 0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex.particle); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); gl.disable(gl.DEPTH_TEST);
        const list = [], c = w === 'laser' ? [0.4, 1, 0.4, 1] : [1, 0.75, 0.35, 1], sz = { colt: 0.07, shotgun: 0.13, dshotgun: 0.18, tommy: 0.09, minigun: 0.12, rocket: 0.14, grenade: 0.1, laser: 0.08, cannon: 0.25 }[w] || 0.1;
        const hd = w === 'colt' && p.dual && this.muzzleHand === 0 ? -1 : 1;
        list.push(pos.at[0] * hd + mu[0], pos.at[1] + mu[1], pos.at[2] + mu[2], sz, c[0], c[1], c[2], 1, pos.at[0] * hd + mu[0], pos.at[1] + mu[1], pos.at[2] + mu[2], sz * 0.45, 1, 1, 1, 1);
        this.drawQuads(list, [1, 0, 0], [0, 1, 0], 1);
        gl.depthMask(true); gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      }
    }
    laserRecoil(since) {
      if (since < 0) return 0;
      if (since < 0.025) return since / 0.025;
      const k = clamp(1 - (since - 0.025) / 0.22, 0, 1); return k * k;
    }
    muzzleTipWorld(pr, cam, R, U, F) {
      const V = S.VIEW_POS.laser, x = V.at[0] + pr.muzzle[0], y = V.at[1] + pr.muzzle[1], z = -(V.at[2] + V.muzzle[2]);
      const vm = Math.tan(29 * Math.PI / 180), D = 0.6, cx = (x / z) / (vm * this.aspect) * this.tanH * D, cy = (y / z) / vm * this.tanV * D;
      return [cam[0] + R[0] * cx + U[0] * cy + F[0] * D, cam[1] + R[1] * cx + U[1] * cy + F[1] * D, cam[2] + R[2] * cx + U[2] * cy + F[2] * D];
    }
    coltReloadPose(p, hd) {
      if (!(p.reloadT > 0) || p.switchT > 0) return null;
      const u = clamp(1 - p.reloadT / S.DATA.WEAPONS.colt.reload, 0, 1), ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
      const lag = p.dual && hd < 0 ? 0.06 : 0, v = clamp(u - lag, 0, 1);
      const tilt = ease(v / 0.15) * (1 - ease((v - 0.85) / 0.15)), open = ease((v - 0.15) / 0.12) * (1 - ease((v - 0.72) / 0.1));
      const jerk = v > 0.3 && v < 0.42 ? -0.35 * Math.sin(((v - 0.3) / 0.12) * Math.PI) : 0;
      return { tilt, open, jerk, side: p.dual ? 0.35 : 1, spin: ease((v - 0.45) / 0.3) * Math.PI * 3 };
    }
    // brightness of static lighting at a point (for the weapon model)
    shadeAt(x, y, z) {
      const W = this.W, s = this.sun;
      if (!W) return 1;
      const lit = !W.ray(x, y + 1.5, z, s[0], s[1], s[2], 60, true, true);
      let k = lit ? 1 : 0.45;
      for (const L of this.staticLights) { const d = Math.hypot(L.x - x, L.y - y - 1.5, L.z - z); if (d < L.r) k += (1 - d / L.r) * 0.6; }
      return Math.min(1.2, k);
    }
    destroy() {
      const gl = this.gl; const ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext();
    }
  }

  S.Renderer = Renderer;
  if (typeof module !== 'undefined') module.exports = S;
})(globalThis.SeriousSam98 = globalThis.SeriousSam98 || {});
