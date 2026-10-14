(function (X) {
  'use strict';
  const M4 = X.M4, G = X.GL, MD = X.Models;
  const FAR = 700, NL = 8;

  const OCT = `
vec2 oct(vec3 n) {
  n /= (abs(n.x) + abs(n.y) + abs(n.z));
  vec2 e = n.z >= 0.0 ? n.xy : (1.0 - abs(n.yx)) * vec2(n.x >= 0.0 ? 1.0 : -1.0, n.y >= 0.0 ? 1.0 : -1.0);
  return e * 0.5 + 0.5;
}
vec3 octDec(vec2 e) {
  e = e * 2.0 - 1.0;
  vec3 n = vec3(e.xy, 1.0 - abs(e.x) - abs(e.y));
  if (n.z < 0.0) n.xy = (1.0 - abs(n.yx)) * vec2(n.x >= 0.0 ? 1.0 : -1.0, n.y >= 0.0 ? 1.0 : -1.0);
  return normalize(n);
}`;

  const G_VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute vec3 aCol;
uniform mat4 uVP; uniform mat4 uM; uniform mat4 uV;
varying vec3 vN; varying vec2 vUV; varying float vZ;
void main() {
  vec4 w = uM * vec4(aPos, 1.0);
  vN = (uV * (uM * vec4(aNrm, 0.0))).xyz;
  vUV = aUV;
  vZ = -(uV * w).z;
  gl_Position = uVP * w;
}`;
  const G_FS = `
precision highp float;
uniform sampler2D uTex; uniform float uAlphaTest; uniform float uFar;
varying vec3 vN; varying vec2 vUV; varying float vZ;
${OCT}
void main() {
  if (uAlphaTest > 0.0 && texture2D(uTex, vUV).a < uAlphaTest) discard;
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  float d = clamp(sqrt(max(vZ, 0.0) / uFar), 0.0, 0.99998);
  float hi = floor(d * 255.0) / 255.0;
  float lo = fract(d * 255.0);
  gl_FragColor = vec4(oct(n), hi, lo);
}`;

  const C_VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute vec3 aCol;
uniform mat4 uVP; uniform mat4 uM; uniform mat4 uV;
varying vec3 vW; varying vec3 vNw; varying vec2 vUV; varying vec3 vC; varying float vZ;
void main() {
  vec4 w = uM * vec4(aPos, 1.0);
  vW = w.xyz;
  vNw = (uM * vec4(aNrm, 0.0)).xyz;
  vUV = aUV; vC = aCol;
  vZ = -(uV * w).z;
  gl_Position = uVP * w;
}`;
  const C_FS = `
precision highp float;
uniform sampler2D uTex; uniform float uAlphaTest; uniform float uMode;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uAmb; uniform vec3 uShade;
uniform vec3 uFogCol; uniform vec2 uFog; uniform vec3 uCam; uniform float uTime;
uniform vec4 uL[${NL}]; uniform vec3 uLC[${NL}];
uniform float uMask; uniform float uHatch; uniform vec3 uTint; uniform float uAlpha; uniform vec3 uWater; uniform float uFogOn;
uniform vec3 uIntMin[8]; uniform vec3 uIntMax[8]; uniform float uIntN; uniform vec3 uIntAmb;
varying vec3 vW; varying vec3 vNw; varying vec2 vUV; varying vec3 vC; varying float vZ;
float indoor(vec3 p) {
  float k = 0.0;
  for (int i = 0; i < 8; i++) {
    if (float(i) >= uIntN) break;
    vec3 a = step(uIntMin[i], p) * step(p, uIntMax[i]);
    k = max(k, a.x * a.y * a.z);
  }
  return k;
}
float hatchAt(vec3 p, vec3 n) {
  vec3 an = abs(n);
  vec2 q = an.y > 0.6 ? p.xz : (an.x > an.z ? p.zy : p.xy);
  float l = abs(fract((q.x + q.y) * 3.3) - 0.5);
  return smoothstep(0.07, 0.15, l);
}
void main() {
  vec4 t = texture2D(uTex, vUV);
  if (uAlphaTest > 0.0 && t.a < uAlphaTest) discard;
  vec3 base = t.rgb * vC * uTint;
  float fogK = smoothstep(uFog.x, uFog.y, vZ) * uFogOn;
  vec3 col;
  if (uMode > 0.5 && uMode < 1.5) {
    col = base * 1.1;
    fogK *= 0.5;
  } else if (uMode > 1.5 && uMode < 2.5) {
    vec3 V = normalize(uCam - vW);
    float fres = pow(1.0 - max(V.y, 0.0), 4.0);
    col = mix(uWater, uFogCol, clamp(fres * 0.9, 0.0, 0.85));
    float r1 = sin(vW.x * 0.7 + uTime * 0.9 + sin(vW.z * 0.25) * 2.0);
    float r2 = sin(vW.z * 1.1 - uTime * 0.6 + sin(vW.x * 0.4) * 1.4);
    float rip = smoothstep(0.93, 0.975, r1 * r2);
    float dk = smoothstep(0.965, 0.99, sin(vW.x * 0.33 + vW.z * 0.55 + uTime * 0.45 + sin(vW.z * 0.19) * 3.0));
    float fade = 1.0 - smoothstep(15.0, 90.0, vZ);
    col = mix(col, col * 0.72, dk * 0.55 * fade);
    col = mix(col, vec3(1.0, 0.97, 0.9), rip * 0.45 * fade);
    vec3 R = reflect(-V, vec3(0.0, 1.0, 0.0));
    float sg = max(dot(R, uSunDir), 0.0);
    vec2 rz = normalize(R.xz + vec2(1e-5));
    vec2 sz = normalize(uSunDir.xz + vec2(1e-5));
    float az = max(dot(rz, sz), 0.0);
    float el = 1.0 - smoothstep(0.0, 0.45, abs(R.y - uSunDir.y));
    col += uSunCol * pow(az, 90.0) * el * (0.12 + rip * 1.4);
  } else {
    vec3 n = normalize(vNw);
    if (!gl_FrontFacing) n = -n;
    float ndl = dot(n, uSunDir);
    float lit = smoothstep(-0.03, 0.05, ndl);
    float hi = smoothstep(0.62, 0.68, ndl) * 0.1;
    vec3 L = mix(uShade, uSunCol, lit) + uSunCol * hi;
    L += uAmb * (0.6 + 0.4 * n.y);
    float ind = uIntN > 0.0 ? indoor(vW) : 0.0;
    if (ind > 0.5) {
      float up = smoothstep(-0.2, 0.6, n.y);
      float side = smoothstep(0.0, 0.3, dot(n, normalize(vec3(0.4, 0.3, 0.7))));
      L = uIntAmb * (0.72 + 0.18 * up + 0.14 * side);
      lit = 0.5 + 0.5 * side;
    }
    for (int i = 0; i < ${NL}; i++) {
      vec3 d = uL[i].xyz - vW;
      float dist = length(d);
      float r = uL[i].w;
      if (r > 0.0 && dist < r) {
        float a = 1.0 - dist / r;
        float k = a * a * max(dot(n, d / max(dist, 0.001)), 0.0) * 1.7 + a * 0.28;
        float band = smoothstep(0.1, 0.16, k) * 0.3 + smoothstep(0.38, 0.44, k) * 0.22 + smoothstep(0.76, 0.82, k) * 0.12;
        L += uLC[i] * band * (0.35 + 0.65 * smoothstep(-0.7, 0.3, n.y));
      }
    }
    col = base * L;
    if (uHatch > 0.0 && abs(n.y) < 0.55) {
      float dark = 1.0 - lit;
      float h = hatchAt(vW, n);
      float df = 1.0 - smoothstep(8.0, 26.0, vZ);
      col *= mix(1.0, mix(0.8, 1.0, h), dark * uHatch * df);
    }
  }
  col = mix(col, uFogCol, fogK);
  gl_FragColor = vec4(col, uMode > 2.5 ? t.a * uAlpha : uMask);
}`;

  const O_VS = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec2 aUV; attribute vec3 aCol;
uniform mat4 uVP; uniform mat4 uM; uniform vec3 uCam; uniform float uW;
void main() {
  vec4 w = uM * vec4(aPos, 1.0);
  vec3 n = normalize((uM * vec4(aNrm, 0.0)).xyz);
  float d = length(w.xyz - uCam);
  w.xyz += n * uW * clamp(d, 0.35, 40.0);
  gl_Position = uVP * w;
}`;
  const O_FS = `
precision mediump float;
uniform vec3 uInk; uniform float uMask;
void main() { gl_FragColor = vec4(uInk, uMask); }`;

  const SKY_VS = `
attribute vec2 aPos; varying vec2 vP;
void main() { vP = aPos; gl_Position = vec4(aPos, 0.99999, 1.0); }`;
  const SKY_FS = `
precision highp float;
uniform mat4 uInv; uniform vec3 uCam; uniform sampler2D uSky; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunSize; uniform float uTime; uniform vec3 uFogCol;
uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uBelow; uniform float uStars; uniform vec3 uMoon; uniform float uFlat;
varying vec2 vP;
float h3(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
void main() {
  vec4 p = uInv * vec4(vP, 1.0, 1.0);
  vec3 d = normalize(p.xyz / p.w - uCam);
  vec3 col;
  if (d.y >= 0.0) col = mix(mix(uHor, uMid, smoothstep(0.0, 0.22, d.y)), uTop, smoothstep(0.22, 0.95, d.y));
  else col = mix(uHor, uBelow, smoothstep(0.0, 0.08, -d.y));
  if (uStars > 0.0 && d.y > 0.02) {
    vec3 q = floor(d * 240.0);
    float st = h3(q);
    col += vec3(1.0) * step(0.9975, st) * uStars * smoothstep(0.02, 0.2, d.y);
  }
  if (uMoon.y > 0.0) {
    float m = dot(d, normalize(uMoon));
    col = mix(col, vec3(0.97, 0.95, 0.85), smoothstep(0.99975, 0.99985, m));
    col += vec3(0.25, 0.27, 0.35) * pow(max(m, 0.0), 300.0);
  }
  float s = dot(d, uSunDir);
  float glow = pow(max(s, 0.0), 10.0) * 0.35 + pow(max(s, 0.0), 90.0) * 0.45;
  col = mix(col, uSunCol, clamp(glow, 0.0, 1.0) * 0.85);
  float disc = smoothstep(cos(uSunSize), cos(uSunSize * 0.9), s);
  col = mix(col, vec3(1.0, 0.98, 0.92), disc);
  float elev = asin(clamp(d.y, -1.0, 1.0));
  float v = 1.0 - (elev + 0.04) / 0.59;
  if (v > 0.0 && v < 1.0) {
    float u = atan(d.x, -d.z) / 6.2831853 + 0.5;
    vec4 b = texture2D(uSky, vec2(u + uTime * 0.0004, v));
    col = mix(col, b.rgb, b.a);
  }
  if (uFlat > 0.0) col = uFogCol;
  gl_FragColor = vec4(col, 0.0);
}`;

  const COMP_VS = `
attribute vec2 aPos; varying vec2 vUV;
void main() { vUV = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
  const COMP_FS = `
precision highp float;
uniform sampler2D uC; uniform sampler2D uG; uniform sampler2D uPaper;
uniform vec2 uPx; uniform vec2 uRes; uniform float uFar; uniform float uLineW; uniform float uInkFar;
uniform vec3 uInk; uniform float uInkAmt; uniform vec3 uGrade; uniform float uSat; uniform float uContrast;
uniform float uFlash; uniform vec3 uFlashCol; uniform float uVig; uniform float uTintMode; uniform vec3 uDuoA; uniform vec3 uDuoB;
uniform float uGrain; uniform float uTime; uniform vec4 uHurt; uniform float uWater; uniform float uGamma;
varying vec2 vUV;
${OCT}
float zOf(vec4 g) { float d = g.b + g.a / 255.0; return max(d * d * uFar, 0.01); }
void main() {
  vec2 uv = vUV;
  if (uWater > 0.0) uv += vec2(sin(uv.y * 30.0 + uTime * 2.0), cos(uv.x * 26.0 + uTime * 1.7)) * 0.003 * uWater;
  vec4 c = texture2D(uC, uv);
  vec4 g0 = texture2D(uG, uv);
  float z0 = zOf(g0);
  vec3 n0 = octDec(g0.rg);
  float w = uLineW * mix(1.5, 0.85, clamp(z0 / 26.0, 0.0, 1.0));
  vec2 dx = vec2(uPx.x * w, 0.0), dy = vec2(0.0, uPx.y * w);
  vec4 gl = texture2D(uG, uv - dx), gr = texture2D(uG, uv + dx), gu = texture2D(uG, uv + dy), gd = texture2D(uG, uv - dy);
  float i0 = 1.0 / z0;
  float il = 1.0 / zOf(gl), ir = 1.0 / zOf(gr), iu = 1.0 / zOf(gu), id = 1.0 / zOf(gd);
  float lap = max(abs(il + ir - 2.0 * i0), abs(iu + id - 2.0 * i0)) / max(max(i0, max(max(il, ir), max(iu, id))) , 1e-6);
  float ed = smoothstep(0.012, 0.045, lap);
  float en = 1.0 - min(min(dot(n0, octDec(gl.rg)), dot(n0, octDec(gr.rg))), min(dot(n0, octDec(gu.rg)), dot(n0, octDec(gd.rg))));
  float ec = smoothstep(0.22, 0.45, en) * (1.0 - step(uFar * 0.98, z0));
  float ink = max(ed, ec);
  ink *= 1.0 - smoothstep(uInkFar * 0.45, uInkFar, z0) * 0.85;
  vec3 col = c.rgb;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, uSat) * uGrade;
  col = (col - 0.5) * uContrast + 0.5;
  if (uTintMode > 0.5) {
    float l2 = clamp(dot(col, vec3(0.3, 0.59, 0.11)) * 1.1, 0.0, 1.0);
    vec3 duo = mix(uDuoA, uDuoB, l2);
    float keep = (uTintMode > 1.5 && uTintMode < 2.5) ? step(0.5, c.a) : 0.0;
    col = mix(duo, col, keep);
    if (uTintMode > 2.5) col = mix(col, vec3(dot(col, vec3(0.33))), 0.7);
  }
  col = mix(col, uInk, clamp(ink * uInkAmt, 0.0, 1.0));
  float p = texture2D(uPaper, uv * uRes / 256.0).r;
  col *= 1.0 + (p - 0.5) * uGrain;
  vec2 q = uv - 0.5;
  col *= 1.0 - uVig * dot(q, q) * 1.7;
  if (uHurt.w > 0.0) {
    float edge = smoothstep(0.18, 0.5, length(q * vec2(1.0, 1.25)));
    col = mix(col, uHurt.rgb, edge * uHurt.w);
  }
  if (uWater > 0.0) {
    float murk = clamp(0.25 + (1.0 - exp(-z0 * 0.09)) * 0.72, 0.0, 0.95);
    col = mix(col * vec3(0.7, 0.95, 1.0), vec3(0.08, 0.28, 0.32), murk * uWater);
  }
  col = mix(col, uFlashCol, uFlash);
  col = pow(max(col, 0.0), vec3(uGamma));
  gl_FragColor = vec4(col, 1.0);
}`;

  const SPR_VS = `
attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP; varying vec2 vUV; varying vec4 vCol;
void main() { vUV = aUV; vCol = aCol; gl_Position = uVP * vec4(aPos, 1.0); }`;
  const SPR_FS = `
precision mediump float;
uniform sampler2D uTex; varying vec2 vUV; varying vec4 vCol;
void main() { vec4 t = texture2D(uTex, vUV); gl_FragColor = vec4(t.rgb * vCol.rgb, t.a * vCol.a); }`;

  const SCR_VS = `
attribute vec2 aPos; uniform vec4 uRect; uniform vec4 uUV; varying vec2 vUV;
void main() { vUV = uUV.xy + aPos * uUV.zw; vec2 p = uRect.xy + aPos * uRect.zw; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;
  const SCR_FS = `
precision mediump float;
uniform sampler2D uTex; uniform vec4 uColor; uniform float uTexMix; varying vec2 vUV;
void main() { vec4 t = texture2D(uTex, vUV); gl_FragColor = mix(uColor, t * uColor, uTexMix); }`;

  class Renderer {
    constructor(canvas, opts) {
      this.opts = opts || {};
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: !!this.opts.preserve, powerPreference: 'high-performance' }) || canvas.getContext('experimental-webgl');
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.uint = gl.getExtension('OES_element_index_uint');
      const an = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
      this.aniso = an ? { ext: an, max: Math.min(4, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) } : null;
      this.pG = G.compile(gl, G_VS, G_FS);
      this.pC = G.compile(gl, C_VS, C_FS);
      this.pO = G.compile(gl, O_VS, O_FS);
      this.pSky = G.compile(gl, SKY_VS, SKY_FS, ['aPos']);
      this.pComp = G.compile(gl, COMP_VS, COMP_FS, ['aPos']);
      this.pSpr = G.compile(gl, SPR_VS, SPR_FS, ['aPos', 'aUV', 'aCol']);
      this.pScr = G.compile(gl, SCR_VS, SCR_FS, ['aPos']);
      this.tri = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tri);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      this.quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1]), gl.STATIC_DRAW);
      this.texCache = {};
      this.white = this.makeTex(this.solidCanvas('#ffffff'), { mip: false });
      this.paper = X.Tex.paper ? G.texture(gl, X.Tex.paper(256), {}) : this.white;
      this.W = 0; this.H = 0;
      this.main = null;
      this.meshCache = {};
      this.charBufs = {};
      this.sprBuf = gl.createBuffer();
      this.sprData = new Float32Array(9 * 4 * 3000);
      this.sprIdx = gl.createBuffer();
      const idx = new Uint16Array(6 * 3000);
      for (let i = 0; i < 3000; i++) { idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sprIdx);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      this.panelTargets = null;
      this.lineW = 1;
      this.gamma = 1;
      this.inkAmt = 1;
      this.hatch = 0.8;
      this.outline = true;
      this.scale = 1;
      this.lost = false;
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; }, false);
    }

    solidCanvas(color, w, h) {
      const c = document.createElement('canvas'); c.width = w || 4; c.height = h || 4;
      const x = c.getContext('2d'); x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
      return c;
    }
    makeTex(canvas, o) { return G.texture(this.gl, canvas, Object.assign({ aniso: this.aniso }, o || {})); }
    matTex(name) {
      if (this.texCache[name]) return this.texCache[name];
      const cv = X.Tex.make(name);
      const t = cv ? this.makeTex(cv, {}) : this.white;
      this.texCache[name] = t;
      return t;
    }
    atlasTex() {
      if (this.atlas) return this.atlas;
      const A = MD.atlas();
      this.atlas = A.canvas ? this.makeTex(A.canvas, {}) : this.white;
      return this.atlas;
    }

    resize(w, h) {
      const gl = this.gl;
      w = Math.max(64, Math.round(w)); h = Math.max(48, Math.round(h));
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
      if (this.W === w && this.H === h && this.main) return;
      this.W = w; this.H = h;
      if (this.main) { G.freeTarget(gl, this.main.g); G.freeTarget(gl, this.main.c); gl.deleteRenderbuffer(this.main.depth); }
      this.main = this.makeTargets(w, h);
    }
    makeTargets(w, h) {
      const gl = this.gl;
      const depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);
      const g = G.target(gl, w, h, depth), c = G.target(gl, w, h, depth);
      g.ownRb = false; c.ownRb = false;
      return { g, c, depth, w, h };
    }

    setLevel(game) {
      const gl = this.gl;
      this.freeLevel();
      this.game = game;
      const env = game.def.env || {};
      this.env = env;
      const L = env.light || {};
      this.sun = X.vnorm(L.dir || [0.4, 0.8, 0.3]);
      this.sunCol = L.color || [1, 0.95, 0.85];
      this.amb = L.ambient || [0.45, 0.45, 0.5];
      this.shadeCol = L.shadow || [0.55, 0.5, 0.55];
      const fog = env.fog || {};
      this.fogCol = fog.color || [0.8, 0.8, 0.85];
      this.fog = [fog.near === undefined ? 60 : fog.near, fog.far === undefined ? 400 : fog.far];
      this.waterCol = env.water || [0.25, 0.42, 0.5];
      this.grade = Object.assign({ tint: [1, 1, 1], sat: 1, contrast: 1.04, ink: [0.1, 0.07, 0.05], inkFar: 170, vig: 0.35, grain: 0.1 }, env.grade || {});
      this.skyTex = G.texture(gl, this.paintSky(env), { mip: false });
      this.interiors = game.world.interiors || [];
      this.buildWorld(game.world);
    }
    freeLevel() {
      const gl = this.gl;
      const del = g => { if (g) { gl.deleteBuffer(g.vbo); gl.deleteBuffer(g.ibo); } };
      if (this.chunks) for (const c of this.chunks) del(c.g);
      if (this.dynMeshes) for (const d of this.dynMeshes) del(d.g);
      if (this.groupMeshes) for (const d of this.groupMeshes) del(d.g);
      if (this.doorMeshes) for (const d of this.doorMeshes) del(d.g);
      for (const k in this.charBufs) { const b = this.charBufs[k]; gl.deleteBuffer(b.vbo); gl.deleteBuffer(b.ibo); }
      this.charBufs = {};
      if (this.skyTex) gl.deleteTexture(this.skyTex);
      for (const k in this.texCache) if (k.startsWith('sign:')) { gl.deleteTexture(this.texCache[k]); delete this.texCache[k]; }
      this.chunks = []; this.dynMeshes = []; this.groupMeshes = []; this.doorMeshes = [];
    }

    paintSky(env) {
      const W = 4096, H = 512;
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      const S = env.sky || {};
      const r = X.rng(X.hash('sky' + (this.game ? this.game.def.id : '')));
      const col = a => X.Tex.rgb(a);
      const Y = e => H * (1 - (e + 0.04) / 0.59);
      const hy = Y(0);
      const ink = '#2e2018';
      const cl = S.clouds === undefined ? 0.4 : S.clouds;
      const cc = S.cloudColor || [1, 1, 1];
      const nClouds = Math.round(cl * 70);
      for (let i = 0; i < nClouds; i++) {
        const e = 0.05 + Math.pow(r(), 1.4) * 0.38;
        const cx = r() * W, cy = Y(e);
        const sc = (0.5 + r() * 0.8) * (0.55 + e * 2.2);
        const n = 4 + Math.floor(r() * 7);
        const puffs = [];
        for (let k = 0; k < n; k++) puffs.push([cx + (k - n / 2) * 26 * sc + (r() - 0.5) * 10, cy - r() * 12 * sc * (1 - k / n * 0.3), (11 + r() * 15) * sc]);
        for (const ox of [-W, 0, W]) {
          x.save(); x.translate(ox, 0);
          x.fillStyle = col(cc.map(v => v * 0.8)); x.strokeStyle = ink; x.lineWidth = 2.5;
          x.beginPath();
          for (const p of puffs) { x.moveTo(p[0] + p[2] * 1.15, p[1]); x.ellipse(p[0], p[1], p[2] * 1.15, p[2] * 0.85, 0, 0, Math.PI * 2); }
          x.fill();
          x.globalAlpha = 0.7; x.stroke(); x.globalAlpha = 1;
          x.fillStyle = col(cc);
          x.beginPath();
          for (const p of puffs) { x.moveTo(p[0] - p[2] * 0.12 + p[2] * 0.95, p[1] - p[2] * 0.25); x.ellipse(p[0] - p[2] * 0.12, p[1] - p[2] * 0.25, p[2] * 0.95, p[2] * 0.62, 0, 0, Math.PI * 2); }
          x.fill();
          x.fillStyle = col(cc.map(v => v * 0.72));
          x.beginPath(); x.ellipse((puffs[0][0] + puffs[n - 1][0]) / 2, cy + 3, (puffs[n - 1][0] - puffs[0][0]) / 2 + 20 * sc, 3.5 * sc, 0, 0, Math.PI * 2); x.fill();
          x.restore();
        }
      }
      const layers = [];
      if (S.mountains) layers.push({ h: S.mountains, col: S.mountainColor || [0.52, 0.56, 0.66], snow: S.snowcaps !== false, rough: 1, n: 90 });
      if (S.hills) layers.push({ h: S.hills, col: S.hillColor || [0.35, 0.42, 0.3], snow: false, rough: 0.4, n: 50 });
      for (const Ly of layers) {
        const pts = [];
        let yv = 0;
        for (let i = 0; i <= Ly.n; i++) {
          yv += (r() - 0.5) * 18 * Ly.rough;
          yv *= 0.88;
          const peak = Math.abs(Math.sin(i * 0.37 + r() * 0.4)) * 55 + Math.abs(Math.sin(i * 0.11)) * 70;
          pts.push([i / Ly.n * W, hy - (peak * Ly.h + 12 + Math.abs(yv) * Ly.h)]);
        }
        pts[Ly.n][1] = pts[0][1];
        x.fillStyle = col(Ly.col);
        x.beginPath(); x.moveTo(0, hy + 30);
        for (const p of pts) x.lineTo(p[0], p[1]);
        x.lineTo(W, hy + 30); x.closePath(); x.fill();
        if (Ly.snow) {
          x.fillStyle = 'rgba(246,248,255,0.95)';
          for (let i = 1; i < Ly.n; i++) {
            const p = pts[i];
            if (p[1] < hy - 60 * Ly.h && p[1] <= pts[i - 1][1] && p[1] <= pts[i + 1][1]) {
              const w1 = (pts[i + 1][0] - p[0]) * 0.45, w0 = (p[0] - pts[i - 1][0]) * 0.45;
              x.beginPath(); x.moveTo(p[0], p[1]); x.lineTo(p[0] + w1, p[1] + (pts[i + 1][1] - p[1]) * 0.45); x.lineTo(p[0] + w1 * 0.5, p[1] + 20); x.lineTo(p[0], p[1] + 30); x.lineTo(p[0] - w0 * 0.5, p[1] + 18); x.lineTo(p[0] - w0, p[1] + (pts[i - 1][1] - p[1]) * 0.45); x.closePath(); x.fill();
            }
          }
        }
        x.strokeStyle = ink; x.lineWidth = 2.5; x.globalAlpha = 0.75;
        x.beginPath(); pts.forEach((p, i) => i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1])); x.stroke(); x.globalAlpha = 1;
        X.Tex.hatch(x, 0, hy - 90 * Ly.h, W, 90 * Ly.h + 30, 1.0, 7, ink, 0.12, 1.2, r);
      }
      if (S.city) {
        const cc2 = S.cityColor || [0.45, 0.45, 0.52];
        let bx = 0;
        while (bx < W) {
          const bw = 18 + r() * 40, bh = 12 + r() * 60 * S.city;
          x.fillStyle = col(cc2);
          x.fillRect(bx, hy - bh, bw, bh + 30);
          x.strokeStyle = ink; x.globalAlpha = 0.55; x.lineWidth = 2; x.strokeRect(bx, hy - bh, bw, bh + 30); x.globalAlpha = 1;
          if (S.cityLights) { x.fillStyle = '#f8d880'; for (let k = 0; k < 8; k++) if (r() < 0.5) x.fillRect(bx + 3 + r() * (bw - 6), hy - bh + 5 + r() * (bh - 8), 2, 3); }
          bx += bw + 1 + r() * 8;
        }
      }
      if (S.forest) {
        x.fillStyle = col(S.forestColor || [0.2, 0.28, 0.22]);
        for (let i = 0; i < 900; i++) {
          const tx = r() * W, th = 8 + r() * 26;
          x.beginPath(); x.moveTo(tx, hy - th); x.lineTo(tx - th * 0.28, hy + 30); x.lineTo(tx + th * 0.28, hy + 30); x.fill();
        }
      }
      return c;
    }

    buildWorld(world) {
      const gl = this.gl;
      const CH = 32;
      const statics = new Map();
      const get = (mat, emit, cx, cz, alpha) => {
        const key = mat + '|' + (emit ? 'e' : '') + (alpha ? 'a' : '') + '|' + cx + ',' + cz;
        let e = statics.get(key);
        if (!e) { e = { mat, emit, alpha, m: new X.Mesh(512) }; statics.set(key, e); }
        return e.m;
      };
      const dyn = [];
      const groups = new Map();
      const doors = [];
      const self = this;
      function sinkFor(v) {
        if (v.grp) {
          let gm = groups.get(v.grp);
          if (!gm) { gm = { grp: v.grp, mats: new Map() }; groups.set(v.grp, gm); }
          return (mat, emit, alpha) => {
            const k = mat + (emit ? '|e' : '') + (alpha ? '|a' : '');
            let e = gm.mats.get(k);
            if (!e) { e = { mat, emit, alpha, m: new X.Mesh(256) }; gm.mats.set(k, e); }
            return e.m;
          };
        }
        if (v.dyn || v.light) {
          const d = { v, mats: new Map() };
          dyn.push(d);
          return (mat, emit, alpha) => {
            const k = mat + (emit ? '|e' : '') + (alpha ? '|a' : '');
            let e = d.mats.get(k);
            if (!e) { e = { mat, emit, alpha, m: new X.Mesh(64) }; d.mats.set(k, e); }
            return e.m;
          };
        }
        const cx = Math.floor((v.x !== undefined ? v.x : (v.p ? v.p[0][0] : (v.a ? v.a[0] : 0))) / CH);
        const cz = Math.floor((v.z !== undefined ? v.z : (v.p ? v.p[0][2] : (v.a ? v.a[2] : 0))) / CH);
        return (mat, emit, alpha) => get(mat, emit, cx, cz, alpha);
      }
      const info = m => X.Tex.info(m);
      const tint = v => v.tint || [1, 1, 1];
      for (const v of world.visuals) {
        if (v.t === 'door') { doors.push(v); continue; }
        if (v.t === 'glass') continue;
        if (v.t === 'alarm') { const m = sinkFor(v)('alarm_red', true); G.box(m, v.x, v.y, v.z, 0.16, 0.2, 0.05, v.yaw, 0.5, [1, 1, 1]); continue; }
        if (v.t === 'hook') {
          const m = sinkFor(v)('metal_dark', false);
          G.box(m, v.x, v.y, v.z, 0.04, 0.04, 0.3, v.yaw, 1, [1, 1, 1]);
          G.cyl(m, v.x, v.y - 0.25, v.z, 0.08, 0.08, 0.04, 8, 1, [1, 0.8, 0.3], true, 0);
          continue;
        }
        const sink = sinkFor(v);
        if (v.t === 'box') {
          const faces = () => true;
          faces.target = (k) => {
            const mm = k === 'top' ? (v.top || v.mat) : k === 'bot' ? (v.bot || v.mat) : (v.side || v.mat);
            return sink(mm, !!(v.emit || info(mm).emit));
          };
          G.box(null, v.x, v.y, v.z, v.hx, v.hy, v.hz, v.yaw, 1, tint(v), faces, !v.grp);
        } else if (v.t === 'quad') {
          const m = sink(v.mat, !!(v.emit || info(v.mat).emit), !!info(v.mat).alpha);
          quadMesh(m, v, info(v.mat).uv);
        } else if (v.t === 'cyl') {
          G.cyl(sink(v.mat, !!(v.emit || info(v.mat).emit)), v.x, v.y, v.z, v.r, v.r2, v.h, v.sides, info(v.mat).uv, tint(v), v.cap, v.yaw);
        } else if (v.t === 'hcyl') {
          const tmp = new X.Mesh(64);
          G.cyl(tmp, 0, -v.len / 2, 0, v.r, v.r, v.len, v.sides, info(v.mat).uv, tint(v), v.cap, 0);
          sink(v.mat, false).append(tmp, M4.trs(v.x, v.y, v.z, v.yaw, -Math.PI / 2, 0, 1));
        } else if (v.t === 'beam') {
          beamMesh(sink(v.mat, !!(v.emit || info(v.mat).emit)), v.a, v.b, v.r, v.sides, info(v.mat).uv, tint(v));
        } else if (v.t === 'sphere') {
          G.sphere(sink(v.mat, !!(v.emit || info(v.mat).emit)), v.x, v.y, v.z, v.r, 10, 7, info(v.mat).uv, tint(v), v.sy || 1);
        } else if (v.t === 'terrain') {
          this.terrainMesh(v, statics);
        } else if (v.t === 'water') {
          const m = new X.Mesh(64);
          const n = 8;
          for (let i = 0; i < n; i++) for (let k = 0; k < n; k++) {
            const x0 = v.x0 + (v.x1 - v.x0) * i / n, x1 = v.x0 + (v.x1 - v.x0) * (i + 1) / n;
            const z0 = v.z0 + (v.z1 - v.z0) * k / n, z1 = v.z0 + (v.z1 - v.z0) * (k + 1) / n;
            m.quadPts([[x0, v.y, z1], [x1, v.y, z1], [x1, v.y, z0], [x0, v.y, z0]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], [1, 1, 1]);
          }
          this.water = this.water || [];
          this.water.push({ g: G.upload(gl, m, false, this.uint), color: v.color });
        } else if (v.t === 'fence') {
          const m = sink('chainlink', false, true);
          const a = v.a, b = v.b, h = v.h, len = Math.hypot(b[0] - a[0], b[2] - a[2]), us = info('chainlink').uv;
          const n = X.vnorm([-(b[2] - a[2]), 0, b[0] - a[0]]);
          m.quadPts([[a[0], a[1], a[2]], [b[0], b[1], b[2]], [b[0], b[1] + h, b[2]], [a[0], a[1] + h, a[2]]], n, [[0, h / us], [len / us, h / us], [len / us, 0], [0, 0]], [1, 1, 1]);
          m.quadPts([[b[0], b[1], b[2]], [a[0], a[1], a[2]], [a[0], a[1] + h, a[2]], [b[0], b[1] + h, b[2]]], [-n[0], 0, -n[2]], [[len / us, h / us], [0, h / us], [0, 0], [len / us, 0]], [1, 1, 1]);
        } else if (v.t === 'sign') {
          const key = 'sign:' + world.visuals.indexOf(v);
          this.texCache[key] = this.makeTex(this.signCanvas(v), { mip: true });
          const m = sink(key, !!v.emit);
          const r = X.right(v.yaw), f = X.fwd(v.yaw, 0);
          const ux = [-r[0], 0, -r[2]];
          const hw = v.w / 2, hh = v.h / 2;
          const c = [v.x + f[0] * 0.01, v.y, v.z + f[2] * 0.01];
          const P = (a, b) => [c[0] + ux[0] * a, c[1] + b, c[2] + ux[2] * a];
          m.quadPts([P(-hw, -hh), P(hw, -hh), P(hw, hh), P(-hw, hh)], f, [[0, 1], [1, 1], [1, 0], [0, 0]], [1, 1, 1]);
          if (v.two) {
            const c2 = [v.x - f[0] * 0.01, v.y, v.z - f[2] * 0.01];
            const P2 = (a, b) => [c2[0] - ux[0] * a, c2[1] + b, c2[2] - ux[2] * a];
            m.quadPts([P2(-hw, -hh), P2(hw, -hh), P2(hw, hh), P2(-hw, hh)], [-f[0], 0, -f[2]], [[0, 1], [1, 1], [1, 0], [0, 0]], [1, 1, 1]);
          }
        } else if (v.t === 'tree') {
          this.treeMesh(v, sink);
        } else if (v.t === 'rock') {
          const m = sink(v.mat || 'rock', false);
          G.sphere(m, v.x, v.y, v.z, v.r, 9, 6, info('rock').uv, [1, 1, 1], v.sy, 0.35, v.seed);
          if (v.snow) G.sphere(sink('snow', false), v.x, v.y + v.r * v.sy * 0.25, v.z, v.r * 0.82, 9, 4, 6, [1, 1, 1], v.sy * 0.7, 0.3, v.seed + 1);
        }
      }
      function quadMesh(m, v, us) {
        const p = v.p;
        const tri = p.length === 3;
        const n = X.triNormal(p[0], p[1], p[2]);
        let uv = v.uvs;
        if (!uv) {
          const e1 = X.vnorm(X.vsub(p[1], p[0]));
          const e2 = X.vcross(n, e1);
          const uu = v.uv || us || 1;
          uv = p.map(q => { const d = X.vsub(q, p[0]); return [X.vdot(d, e1) / uu, -X.vdot(d, e2) / uu]; });
        }
        if (tri) m.triPts(p, n, uv, v.tint || [1, 1, 1]); else m.quadPts(p, n, uv, v.tint || [1, 1, 1]);
        if (v.two) {
          const rp = p.slice().reverse(), ruv = uv.slice().reverse();
          if (tri) m.triPts(rp, [-n[0], -n[1], -n[2]], ruv, v.tint || [1, 1, 1]); else m.quadPts(rp, [-n[0], -n[1], -n[2]], ruv, v.tint || [1, 1, 1]);
        }
      }
      this.chunks = [];
      for (const [, e] of statics) {
        if (!e.m.ni) continue;
        const parts = this.splitMesh(e.m);
        for (const pm of parts) this.chunks.push({ mat: e.mat, emit: e.emit, alpha: e.alpha, g: G.upload(gl, pm, false, this.uint), noG: e.alpha });
      }
      this.groupMeshes = [];
      for (const [grp, gm] of groups) for (const [, e] of gm.mats) if (e.m.ni) this.groupMeshes.push({ grp, mat: e.mat, emit: e.emit, alpha: e.alpha, g: G.upload(gl, e.m, false, this.uint) });
      this.dynMeshes = [];
      for (const d of dyn) for (const [, e] of d.mats) if (e.m.ni) this.dynMeshes.push({ v: d.v, mat: e.mat, emit: e.emit, g: G.upload(gl, e.m, false, this.uint) });
      this.doorMeshes = doors.map(v => {
        const d = v.door, m = new X.Mesh(64);
        const hw = d.w / 2, hh = d.h / 2;
        if (d.bars) {
          for (let x = -hw + 0.06; x < hw; x += 0.14) G.cyl(m, x, -hh, 0, 0.018, 0.018, d.h, 4, 1, [1, 1, 1], false, 0);
          G.box(m, 0, hh - 0.04, 0, hw, 0.04, 0.03, 0, 1, [1, 1, 1]); G.box(m, 0, 0, 0, hw, 0.03, 0.03, 0, 1, [1, 1, 1]);
        } else {
          G.box(m, 0, 0, 0, hw, hh, 0.05, 0, 1.2, [1, 1, 1]);
          for (let i = 0; i < m.n; i++) { const o = i * 11; if (Math.abs(m.v[o + 5]) > 0.5) { m.v[o + 6] = (m.v[o] + hw) / d.w; m.v[o + 7] = (hh - m.v[o + 1]) / d.h; } }
        }
        return { door: d, mat: d.bars ? 'bars' : d.mat, g: G.upload(gl, m, false, this.uint) };
      });
      this.glass = world.visuals.filter(v => v.t === 'glass').map(v => {
        const m = new X.Mesh(24);
        G.box(m, 0, 0, 0, v.hx, v.hy, v.hz, 0, 1, v.tint || [1, 1, 1]);
        for (let i = 0; i < m.n; i++) { const o = i * 11; const ax = Math.abs(m.v[o + 3]) > 0.5 ? 2 : 0; m.v[o + 6] = (m.v[o + ax] / (2 * (ax === 2 ? v.hz : v.hx) || 1)) + 0.5; m.v[o + 7] = 0.5 - m.v[o + 1] / (2 * v.hy); }
        return { v, g: G.upload(gl, m, false, this.uint), c: [v.x, v.y, v.z] };
      });
      this.lights = world.lights;
      for (const c of this.chunks) this.matTex(c.mat);
      this.atlasTex();
    }

    splitMesh(m) {
      if (m.n <= 65000 || this.uint) return [m];
      const out = [];
      let cur = new X.Mesh(4096), map = new Map();
      for (let t = 0; t < m.ni; t += 3) {
        if (cur.n > 64000) { out.push(cur); cur = new X.Mesh(4096); map = new Map(); }
        const tri = [];
        for (let k = 0; k < 3; k++) {
          const vi = m.idx[t + k];
          let ni = map.get(vi);
          if (ni === undefined) {
            const o = vi * 11, a = m.v;
            cur.grow(1, 0);
            ni = cur.vert(a[o], a[o + 1], a[o + 2], a[o + 3], a[o + 4], a[o + 5], a[o + 6], a[o + 7], a[o + 8], a[o + 9], a[o + 10]);
            map.set(vi, ni);
          }
          tri.push(ni);
        }
        cur.grow(0, 3);
        cur.tri(tri[0], tri[1], tri[2]);
      }
      if (cur.ni) out.push(cur);
      return out;
    }

    terrainMesh(v, statics) {
      const t = v.ref;
      const us = X.Tex.info(v.mat).uv;
      const nx = t.nx, nz = t.nz;
      const verts = new Array((nx + 1) * (nz + 1));
      for (let k = 0; k <= nz; k++) for (let i = 0; i <= nx; i++) {
        const x = t.x0 + i * t.cell, z = t.z0 + k * t.cell;
        const h = t.at(i, k);
        const hl = t.at(Math.max(0, i - 1), k), hr = t.at(Math.min(nx, i + 1), k), hd = t.at(i, Math.max(0, k - 1)), hu = t.at(i, Math.min(nz, k + 1));
        const n = X.vnorm([hl - hr, 2 * t.cell, hd - hu]);
        verts[k * (nx + 1) + i] = { x, y: h, z, n };
      }
      const pick = (y, ny) => {
        if (v.steep && ny < 0.72) return v.steep;
        if (v.low && y < v.lowY) return v.low;
        if (v.high && y > v.highY) return v.high;
        return v.mat;
      };
      const meshes = new Map();
      const C = 16;
      for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
        if (t.holes.length && t.inHole(t.x0 + (i + 0.5) * t.cell, t.z0 + (k + 0.5) * t.cell)) continue;
        const a = verts[k * (nx + 1) + i], b = verts[k * (nx + 1) + i + 1], c = verts[(k + 1) * (nx + 1) + i + 1], d = verts[(k + 1) * (nx + 1) + i];
        const avgY = (a.y + b.y + c.y + d.y) / 4, avgN = (a.n[1] + b.n[1] + c.n[1] + d.n[1]) / 4;
        const mat = pick(avgY, avgN);
        const key = mat + '|' + Math.floor(i / C) + ',' + Math.floor(k / C);
        let m = meshes.get(key);
        if (!m) { m = { mat, m: new X.Mesh(C * C * 4) }; meshes.set(key, m); }
        const mm = m.m;
        const uu = X.Tex.info(mat).uv || us;
        mm.grow(4, 6);
        const s = mm.n;
        for (const q of [a, b, c, d]) mm.vert(q.x, q.y, q.z, q.n[0], q.n[1], q.n[2], q.x / uu, q.z / uu, 1, 1, 1);
        mm.tri(s, s + 3, s + 2); mm.tri(s, s + 2, s + 1);
      }
      for (const [k, e] of meshes) statics.set('T' + k, { mat: e.mat, emit: false, alpha: false, m: e.m });
    }

    treeMesh(v, sink) {
      const r = X.rng(v.seed || 1);
      const h = v.h, R = v.r;
      const bark = sink('bark', false);
      if (v.kind === 'pine') {
        G.cyl(bark, v.x, v.y - 0.3, v.z, R * 0.09, R * 0.05, h * 0.35, 6, 1.5, [1, 1, 1], false, 0);
        const needles = sink(v.color === 'dark' ? 'pine_dark' : 'pine', false);
        const layers = 4 + Math.floor(r() * 2);
        for (let i = 0; i < layers; i++) {
          const t = i / layers;
          const y0 = v.y + h * (0.18 + t * 0.62);
          const rr = R * (1 - t * 0.72) * (0.9 + r() * 0.2);
          const hh = h * 0.34 * (1 - t * 0.35);
          const tmp = new X.Mesh(40);
          G.cyl(tmp, 0, 0, 0, rr, 0.0, hh, 9, 2, [1, 1, 1], true, r() * 6);
          for (let j = 0; j < tmp.n; j++) { const o = j * 11; if (tmp.v[o + 1] < 0.01) { const a = Math.atan2(tmp.v[o + 2], tmp.v[o]); tmp.v[o + 1] -= (Math.sin(a * 4.5 + i) * 0.5 + 0.5) * rr * 0.25; } }
          needles.append(tmp, M4.trs(v.x + (r() - 0.5) * 0.2, y0, v.z + (r() - 0.5) * 0.2, 0, (r() - 0.5) * 0.05, (r() - 0.5) * 0.05, 1));
          if (v.snow) {
            const sn = new X.Mesh(40);
            G.cyl(sn, 0, hh * 0.35, 0, rr * 0.7, 0.0, hh * 0.7, 9, 3, [1, 1, 1], false, r() * 6);
            sink('snow', false).append(sn, M4.trs(v.x, y0 + 0.02, v.z, 0, 0, 0, 1));
          }
        }
      } else {
        G.cyl(bark, v.x, v.y - 0.3, v.z, R * 0.12, R * 0.08, h * 0.55, 6, 1.5, v.kind === 'birch' ? [1.7, 1.7, 1.6] : [1, 1, 1], false, 0);
        const leaf = sink(v.kind === 'birch' ? 'leaves_yellow' : (v.color === 'green' ? 'leaves' : 'leaves_orange'), false);
        const n = 4 + Math.floor(r() * 3);
        for (let i = 0; i < n; i++) {
          const a = r() * X.TAU, d = R * 0.45 * r();
          G.sphere(leaf, v.x + Math.cos(a) * d, v.y + h * (0.55 + r() * 0.3), v.z + Math.sin(a) * d, R * (0.45 + r() * 0.3), 8, 5, 2, [1, 1, 1], 0.85, 0.3, v.seed + i);
        }
      }
    }

    signCanvas(v) {
      const W = 512, H = Math.max(32, Math.min(256, Math.round(512 * v.h / v.w / 32) * 32 || 64));
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d');
      x.fillStyle = v.bg; x.fillRect(0, 0, W, H);
      X.Tex.stipple(x, W, 400, '#000', 0.06, X.rng(3), 1);
      const font = v.font === 'serif' ? 'Georgia, "Times New Roman", serif' : v.font === 'mono' ? '"Courier New", monospace' : 'Impact, "Arial Black", sans-serif';
      let size = H * 0.66;
      x.font = `bold ${size}px ${font}`;
      const tw = x.measureText(v.text).width;
      if (tw > W * 0.92) { size *= W * 0.92 / tw; x.font = `bold ${size}px ${font}`; }
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillText(v.text, W / 2 + 3, H / 2 + 4);
      x.fillStyle = v.fg; x.fillText(v.text, W / 2, H / 2 + 2);
      x.strokeStyle = v.border || '#20140c'; x.lineWidth = Math.max(4, H * 0.06); x.strokeRect(2, 2, W - 4, H - 4);
      return c;
    }

    lightsFor(cam) {
      const out = [];
      const L = this.lights || [];
      const arr = [];
      for (const l of L) {
        if (!l.on) continue;
        const d = X.vdist(l.p, cam) - l.r;
        if (d > 70) continue;
        arr.push([d, l]);
      }
      arr.sort((a, b) => a[0] - b[0]);
      for (let i = 0; i < Math.min(NL, arr.length); i++) out.push(arr[i][1]);
      return out;
    }

    view(cam, w, h) {
      const aspect = w / h;
      const P = M4.persp(cam.fov * X.DEG, aspect, cam.near || 0.06, FAR);
      const V = cam.look ? M4.lookAt(cam.pos, cam.look, cam.up || [0, 1, 0]) : M4.view(cam.pos, cam.yaw, cam.pitch, cam.roll || 0);
      const VP = M4.mul(P, V);
      return { P, V, VP, planes: M4.frustum(VP), pos: cam.pos, w, h, fov: cam.fov };
    }

    setCommon(p, view, cp) {
      const gl = this.gl, u = p.u;
      gl.uniformMatrix4fv(u.uVP, false, view.VP);
      gl.uniformMatrix4fv(u.uV, false, view.V);
      if (cp) {
        gl.uniform3fv(u.uSunDir, this.sun);
        gl.uniform3fv(u.uSunCol, this.sunCol);
        gl.uniform3fv(u.uAmb, this.amb);
        gl.uniform3fv(u.uShade, this.shadeCol);
        gl.uniform3fv(u.uFogCol, this.fogCol);
        gl.uniform2fv(u.uFog, this.fog);
        gl.uniform3fv(u.uCam, view.pos);
        gl.uniform1f(u.uTime, this.time || 0);
        gl.uniform3fv(u.uWater, this.waterCol);
        gl.uniform1f(u.uHatch, this.hatch);
        gl.uniform3f(u.uTint, 1, 1, 1);
        gl.uniform1f(u.uAlpha, 1);
        gl.uniform1f(u.uFogOn, view.noFog ? 0 : 1);
        const ls = view.lights || [];
        const a = new Float32Array(NL * 4), c = new Float32Array(NL * 3);
        for (let i = 0; i < ls.length; i++) {
          const l = ls[i];
          const fl = l.flicker ? 1 - l.flicker * 0.25 * (0.5 + 0.5 * Math.sin((this.time || 0) * 17 + i * 3) * Math.sin((this.time || 0) * 7.3 + i)) : 1;
          a[i * 4] = l.p[0]; a[i * 4 + 1] = l.p[1]; a[i * 4 + 2] = l.p[2]; a[i * 4 + 3] = l.r;
          c[i * 3] = l.color[0] * fl; c[i * 3 + 1] = l.color[1] * fl; c[i * 3 + 2] = l.color[2] * fl;
        }
        gl.uniform4fv(u.uL, a);
        gl.uniform3fv(u.uLC, c);
        const ints = this.interiors || [];
        const mn = new Float32Array(24), mx = new Float32Array(24);
        for (let i = 0; i < Math.min(8, ints.length); i++) { mn.set(ints[i].slice(0, 3), i * 3); mx.set(ints[i].slice(3, 6), i * 3); }
        gl.uniform3fv(u.uIntMin, mn);
        gl.uniform3fv(u.uIntMax, mx);
        gl.uniform1f(u.uIntN, view.noInt ? 0 : Math.min(8, ints.length));
        gl.uniform3fv(u.uIntAmb, (this.env.light && this.env.light.indoor) || [0.92, 0.88, 0.82]);
      } else {
        gl.uniform1f(u.uFar, FAR);
      }
    }

    drawMesh(p, g, model, tex, o) {
      const gl = this.gl, u = p.u;
      gl.uniformMatrix4fv(u.uM, false, model || IDENT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex || this.white);
      if (u.uTex) gl.uniform1i(u.uTex, 0);
      if (u.uAlphaTest) gl.uniform1f(u.uAlphaTest, o && o.alpha ? 0.5 : 0);
      if (u.uMode) gl.uniform1f(u.uMode, o && o.mode ? o.mode : 0);
      if (u.uMask) gl.uniform1f(u.uMask, o && o.mask ? o.mask : 0);
      G.bindMesh(gl, g);
      gl.drawElements(gl.TRIANGLES, g.count, g.type, 0);
    }

    scene(view, o) {
      const gl = this.gl;
      const game = this.game;
      o = o || {};
      const list = { world: [], dyn: [], chars: [], props: [] };
      if (!o.hideWorld) {
        for (const c of this.chunks) if (M4.boxVisible(view.planes, c.g.min, c.g.max)) list.world.push(c);
      }
      return list;
    }

    passes(view, tgt, o) {
      const gl = this.gl;
      o = o || {};
      view.lights = o.hideWorld ? [] : this.lightsFor(view.pos);
      const vis = this.scene(view, o);
      const charDraw = this.prepareChars(view, o);
      gl.bindFramebuffer(gl.FRAMEBUFFER, tgt.g.fb);
      gl.viewport(0, 0, tgt.w, tgt.h);
      gl.clearColor(0.5, 0.5, 1, 1);
      gl.clearDepth(1);
      gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      gl.disable(gl.BLEND);
      gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
      this.drawAll(this.pG, view, vis, charDraw, o, false);
      if (o.vm) this.drawVM(this.pG, o.vm, false);
      gl.bindFramebuffer(gl.FRAMEBUFFER, tgt.c.fb);
      gl.viewport(0, 0, tgt.w, tgt.h);
      const bg = o.bg || null;
      gl.clearColor(bg ? bg[0] : this.fogCol[0], bg ? bg[1] : this.fogCol[1], bg ? bg[2] : this.fogCol[2], 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!o.hideWorld && !bg) this.drawSky(view);
      gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
      this.drawAll(this.pC, view, vis, charDraw, o, true);
      if (this.outline && charDraw.length) this.drawOutlines(view, charDraw);
      if (!o.hideWorld) this.drawTransparent(view, o);
      if (o.vm) {
        gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
        this.drawVM(this.pC, o.vm, true);
      }
    }

    drawSky(view) {
      const gl = this.gl, p = this.pSky;
      gl.useProgram(p.p);
      gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.disable(gl.CULL_FACE);
      const inv = invert(view.VP);
      gl.uniformMatrix4fv(p.u.uInv, false, inv);
      gl.uniform3fv(p.u.uCam, view.pos);
      gl.uniform3fv(p.u.uSunDir, this.skySun || this.sun);
      gl.uniform3fv(p.u.uSunCol, (this.env.sky && this.env.sky.sunColor) || [1, 0.95, 0.8]);
      gl.uniform1f(p.u.uSunSize, (this.env.sky && this.env.sky.sunSize) || 0.04);
      gl.uniform1f(p.u.uTime, this.time || 0);
      gl.uniform3fv(p.u.uFogCol, this.fogCol);
      gl.uniform1f(p.u.uFlat, 0);
      const S = this.env.sky || {};
      gl.uniform3fv(p.u.uTop, S.top || [0.35, 0.55, 0.85]);
      gl.uniform3fv(p.u.uMid, S.mid || [0.6, 0.75, 0.9]);
      gl.uniform3fv(p.u.uHor, S.hor || [0.85, 0.88, 0.9]);
      gl.uniform3fv(p.u.uBelow, S.below || this.fogCol);
      gl.uniform1f(p.u.uStars, S.stars || 0);
      gl.uniform3fv(p.u.uMoon, S.moon || [0, -1, 0]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.skyTex); gl.uniform1i(p.u.uSky, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tri);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.enable(gl.CULL_FACE);
    }

    drawAll(p, view, vis, chars, o, color) {
      const gl = this.gl;
      const game = this.game;
      gl.useProgram(p.p);
      this.setCommon(p, view, color);
      for (const c of vis.world) {
        if (!color && c.noG) continue;
        if (c.alpha) gl.disable(gl.CULL_FACE);
        this.drawMesh(p, c.g, null, this.matTex(c.mat), { mode: c.emit ? 1 : 0, alpha: c.alpha });
        if (c.alpha) gl.enable(gl.CULL_FACE);
      }
      if (!o.hideWorld && game) {
        for (const d of this.dynMeshes) {
          if (d.v.hidden) continue;
          if (!M4.boxVisible(view.planes, d.g.min, d.g.max)) continue;
          this.drawMesh(p, d.g, null, this.matTex(d.mat), { mode: d.emit ? 1 : 0 });
        }
        for (const d of this.doorMeshes) {
          const b = d.door.block;
          const m = M4.trs(b.x, b.y, b.z, b.yaw, 0, 0, 1);
          if (d.door.bars) gl.disable(gl.CULL_FACE);
          this.drawMesh(p, d.g, m, this.matTex(d.mat), {});
          if (d.door.bars) gl.enable(gl.CULL_FACE);
        }
        for (const gm of this.groupMeshes) {
          const g = gm.grp;
          this.drawMesh(p, gm.g, M4.trs(g.pos[0], g.pos[1], g.pos[2], g.yaw, 0, 0, 1), this.matTex(gm.mat), { mode: gm.emit ? 1 : 0, alpha: gm.alpha });
        }
        if (this.water && color) {
          for (const w of this.water) this.drawMesh(p, w.g, null, this.white, { mode: 2 });
        } else if (this.water) for (const w of this.water) this.drawMesh(p, w.g, null, this.white, {});
        this.drawProps(p, view);
      }
      const at = this.atlasTex();
      for (const cd of chars) {
        this.drawMesh(p, cd.buf.g, null, at, { mask: 1 });
      }
      if (o.extra) for (const e of o.extra) this.drawMesh(p, e.g, e.m, e.tex || at, { mask: 1 });
    }

    drawProps(p, view) {
      const game = this.game;
      const at = this.atlasTex();
      const isVis = (pos, r) => M4.sphereVisible(view.planes, pos, r || 1);
      for (const it of game.items) {
        if (it.taken || it.hidden) continue;
        if (X.vdist(it.pos, view.pos) > 80 || !isVis(it.pos, 0.6)) continue;
        const key = 'item:' + it.kind + ':' + (it.w || '');
        const g = this.cached(key, () => MD.item(it.kind === 'weapon' ? 'weapon' : it.kind === 'ammo' ? 'ammo' : it.kind, it.w));
        const yaw = it.stuck ? Math.atan2(-(it.dir || [0, 0, 1])[0], -(it.dir || [0, 0, 1])[2]) : (X.hash(it.id) % 628) / 100;
        const m = it.stuck ? M4.trs(it.pos[0], it.pos[1] - 0.02, it.pos[2], yaw, 0.4, 0, 1) : M4.trs(it.pos[0], it.pos[1], it.pos[2], yaw, 0, 0, 1);
        this.drawMesh(p, g, m, at, { mask: 0.6 });
      }
      for (const ob of game.objects) {
        if (ob.taken || ob.broken) continue;
        if (X.vdist(ob.pos, view.pos) > 70 || !isVis(ob.pos, 1)) continue;
        const g = this.cached('obj:' + ob.kind, () => MD.object(ob.kind));
        this.drawMesh(p, g, M4.trs(ob.pos[0], ob.pos[1], ob.pos[2], ob.yaw, 0, 0, 1), at, { mask: 0.6 });
      }
      for (const pr of game.projectiles) {
        const g = this.cached('proj:' + pr.kind, () => MD.proj(pr.kind));
        const v = pr.vel;
        const yaw = Math.atan2(-v[0], -v[2]), pitch = Math.atan2(v[1], Math.hypot(v[0], v[2]));
        const spin = pr.kind === 'knife' ? pr.t * 30 : 0;
        this.drawMesh(p, g, M4.trs(pr.pos[0], pr.pos[1], pr.pos[2], yaw, pitch + (pr.kind === 'knife' ? spin : 0), 0, 1), at, { mask: 0.6 });
      }
      for (const c of game.secCams) {
        if (c.dead) continue;
        const g = this.cached('seccam', () => { const m = new X.Mesh(64); G.box(m, 0, 0, 0, 0.1, 0.09, 0.18, 0, 1, [0.85, 0.85, 0.82]); G.box(m, 0, 0, -0.2, 0.05, 0.05, 0.03, 0, 1, [0.1, 0.1, 0.1]); G.box(m, 0, 0.15, 0.1, 0.02, 0.08, 0.02, 0, 1, [0.3, 0.3, 0.3]); return m; });
        this.drawMesh(p, g, M4.trs(c.pos[0], c.pos[1], c.pos[2], c.cur, -0.35, 0, 1), at, {});
      }
      for (const h of game.grapples) {
        if (!h.deployed) continue;
        const len = h.pos[1] - h.bottom;
        const g = this.cached('rope', () => { const m = new X.Mesh(32); G.cyl(m, 0, -1, 0, 0.02, 0.02, 1, 5, 1, [0.75, 0.62, 0.36], false, 0); return m; });
        const m = M4.mul(M4.trs(h.pos[0], h.pos[1], h.pos[2], 0, 0, 0, 1), scaleY(len));
        this.drawMesh(p, g, m, at, {});
      }
      for (const v of game.vehicles) {
        if (v.hidden) continue;
        const g = this.cached('veh:' + v.kind, () => vehicleMesh(v.kind));
        const vm = M4.trs(v.pos[0], v.pos[1], v.pos[2], v.yaw || 0, v.dead ? 0.3 : (v.pitch || 0), v.roll || 0, 1);
        this.drawMesh(p, g, vm, at, { mask: 0.6 });
        if (v.kind === 'heli') {
          const spin = v.active && !(v.dead && v.crashed) ? game.time * (v.dead ? 9 : 21) : 0.4;
          this.drawMesh(p, this.cached('veh:heli:rotor', () => rotorMesh(5.5, 0.18)), M4.mul(vm, M4.trs(0, 1.35, 0, spin, 0, 0, 1)), at, { mask: 0.6 });
          this.drawMesh(p, this.cached('veh:heli:tail', () => rotorMesh(0.75, 0.07)), M4.mul(vm, M4.mul(M4.trs(0.14, 0.95, 5.5, 0, 0, Math.PI / 2, 1), M4.trs(0, 0, 0, spin * 1.7, 0, 0, 1))), at, { mask: 0.6 });
        }
      }
    }

    cached(key, fn) {
      if (this.meshCache[key]) return this.meshCache[key];
      const m = fn();
      const g = G.upload(this.gl, m, false, this.uint);
      this.meshCache[key] = g;
      return g;
    }

    prepareChars(view, o) {
      const gl = this.gl;
      const out = [];
      let list = o.puppets || (this.game && !o.hideChars ? this.game.chars : []);
      if (o.showPlayer && this.game && this.game.player.alive) {
        const p = this.game.player;
        const pp = this.playerPuppet || (this.playerPuppet = { id: 'player_puppet', type: 'xiii', state: 'alive', weapon: null, speed: 0, crouch: 0 });
        pp.pos = p.pos; pp.yaw = p.yaw; pp.speed = p.speed; pp.crouch = p.crouched ? 1 : 0;
        pp.weapon = X.WEAPONS[p.weapon] && X.WEAPONS[p.weapon].kind === 'hitscan' ? p.weapon : null;
        list = list.concat([pp]);
      }
      const t = o.time === undefined ? (this.game ? this.game.time : 0) : o.time;
      for (const ch of list) {
        if (ch.state === 'hidden' || ch.invisible) continue;
        if (ch.carried && !o.puppets) continue;
        const d = X.vdist(ch.pos, view.pos);
        if (d > (o.puppets ? 400 : 130)) continue;
        const c = [ch.pos[0], ch.pos[1] + 0.9, ch.pos[2]];
        if (!M4.sphereVisible(view.planes, c, ch.state === 'dead' ? 2.2 : 1.4)) continue;
        const def = X.CHARS[ch.type];
        if (!def) continue;
        const wpn = ch.state === 'dead' || ch.state === 'ko' ? null : ch.weapon;
        const key = (ch.lookKey || ch.type);
        const tpl = MD.template(ch.look || def.look, ch.showGun === false ? null : wpn, key + (ch.look ? ':' + ch.id : ''));
        let buf = this.charBufs[ch.id + '|' + tpl.mesh.n + '|' + key + '|' + (wpn || '')];
        if (!buf) {
          const data = new Float32Array(tpl.mesh.v.subarray(0, tpl.mesh.n * 11));
          const g = G.upload(gl, tpl.mesh, true, this.uint);
          buf = { data, g, faceKey: null };
          this.charBufs[ch.id + '|' + tpl.mesh.n + '|' + key + '|' + (wpn || '')] = buf;
        }
        const faceKey = (def.look.face || 'xiii') + ((ch.state === 'dead' && ch.deathKind === 'head') || ch.face === 'pain' ? ':pain' : '');
        if (buf.faceKey !== faceKey) { MD.setFace(tpl, buf.data, faceKey); buf.faceKey = faceKey; }
        if (!ch.walkPh) ch.walkPh = (X.hash(ch.id) % 100) / 10;
        if (ch.speed) ch.walkPh += (ch.speed * (ch.speed > 2.6 ? 2.1 : 3.4)) * (this.dt || 0.016);
        const aiming = !!(ch.ai && ch.ai.alert === 2 && ch.ai.seeNow) || ch.aimPose;
        const pose = ch.forcePose || MD.animate(ch, t, { aiming, pitch: ch.pitch || 0, fireT: ch.fireT });
        if (ch.state !== 'dead' && ch.state !== 'ko') ch.lastPose = pose;
        let pos = ch.pos;
        if (ch.state === 'hostage' && !o.puppets && this.game) {
          const p = this.game.player;
          const r = X.right(p.yaw), f = X.fwd(p.yaw, 0);
          pos = [p.pos[0] + f[0] * 0.62 + r[0] * 0.22, p.pos[1] - 0.12, p.pos[2] + f[2] * 0.62 + r[2] * 0.22];
        }
        const root = MD.rootMatrix(pos, ch.yaw, pose.pitch || 0, pose.roll || 0);
        const mats = MD.skin(tpl, pose, root, buf.data, false);
        ch.headWorld = MD.boneWorld(mats, 2, [0, 0.15, -0.01]);
        ch.chestWorld = MD.boneWorld(mats, 1, [0, 0.3, 0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf.g.vbo);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, buf.data);
        out.push({ ch, buf, dist: d });
      }
      return out;
    }

    drawOutlines(view, chars) {
      const gl = this.gl, p = this.pO;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, view.VP);
      gl.uniformMatrix4fv(p.u.uM, false, IDENT);
      gl.uniform3fv(p.u.uCam, view.pos);
      gl.uniform3fv(p.u.uInk, this.grade.ink);
      gl.uniform1f(p.u.uMask, 1);
      gl.cullFace(gl.FRONT);
      gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
      for (const cd of chars) {
        gl.uniform1f(p.u.uW, 0.0026 * this.lineW * (view.fov / 70));
        const g = cd.buf.g;
        gl.bindBuffer(gl.ARRAY_BUFFER, g.vbo);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ibo);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 44, 12);
        gl.drawElements(gl.TRIANGLES, g.count, g.type, 0);
      }
      gl.cullFace(gl.BACK);
      gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
    }

    drawTransparent(view, o) {
      const gl = this.gl;
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.depthMask(false);
      if (this.glass && this.glass.length && !o.hideWorld) {
        const p = this.pC;
        gl.useProgram(p.p);
        this.setCommon(p, view, true);
        const gt = this.matTex('glass');
        const list = this.glass.filter(q => !q.v.block || !q.v.block.dead).map(q => [X.vdist(q.c, view.pos), q]).filter(q => q[0] < 90).sort((a, b) => b[0] - a[0]);
        gl.disable(gl.CULL_FACE);
        for (const [, q] of list) {
          const v = q.v;
          gl.uniform1f(p.u.uAlpha, 1);
          this.drawMesh(p, q.g, M4.trs(v.x, v.y, v.z, v.yaw || 0, 0, 0, 1), gt, { mode: 3 });
        }
        gl.enable(gl.CULL_FACE);
      }
      if (this.game && this.game.searchlights && this.game.searchlights.length && !o.hideWorld) this.drawBeams(view);
      if (this.fx && !o.noFx) this.drawSprites(view, this.fx.sprites(view, o), false);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    drawBeams(view) {
      const gl = this.gl, p = this.pC;
      const g = this.cached('beam', () => { const m = new X.Mesh(64); G.cyl(m, 0, 0, 0, 0.35, 1, 1, 12, 1, [1, 1, 1], false, 0); return m; });
      gl.useProgram(p.p);
      this.setCommon(p, view, true);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ZERO, gl.ONE);
      gl.disable(gl.CULL_FACE);
      gl.uniform3f(p.u.uTint, 1.0, 0.95, 0.75);
      gl.uniform1f(p.u.uAlpha, 0.13);
      for (const s of this.game.searchlights) {
        if (!s.light.on) continue;
        const d = X.vsub(s.spot, s.pos), len = X.vlen(d);
        if (len < 0.5) continue;
        const yaw = Math.atan2(-d[0], -d[2]), pitch = Math.atan2(d[1], Math.hypot(d[0], d[2]));
        const m = M4.mul(M4.trs(s.pos[0], s.pos[1], s.pos[2], yaw, pitch - Math.PI / 2, 0, 1), scale3(len * 0.09, len, len * 0.09));
        this.drawMesh(p, g, m, this.white, { mode: 3 });
      }
      gl.uniform3f(p.u.uTint, 1, 1, 1);
      gl.uniform1f(p.u.uAlpha, 1);
      gl.enable(gl.CULL_FACE);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    }

    drawSprites(view, batches) {
      if (!batches) return;
      const gl = this.gl, p = this.pSpr;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, view.VP);
      gl.disable(gl.CULL_FACE);
      gl.disableVertexAttribArray(3);
      for (const b of batches) {
        if (!b.n) continue;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, b.tex); gl.uniform1i(p.u.uTex, 0);
        if (b.add) gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ZERO, gl.ONE); else gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        if (b.offset) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -4); }
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sprBuf);
        gl.bufferData(gl.ARRAY_BUFFER, b.data.subarray(0, b.n * 36), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12);
        gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sprIdx);
        gl.drawElements(gl.TRIANGLES, Math.min(b.n, 3000) * 6, gl.UNSIGNED_SHORT, 0);
        if (b.offset) gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      gl.enableVertexAttribArray(3);
      gl.enable(gl.CULL_FACE);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
    }

    drawVM(p, vm, color) {
      const gl = this.gl;
      if (!vm || !vm.parts || !vm.parts.length) return;
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const P = M4.persp((vm.fov || 58) * X.DEG, this.curAspect || 1.33, 0.01, 20);
      const V = IDENT;
      gl.useProgram(p.p);
      const view = { VP: P, V, pos: [0, 0, 0], lights: [], noFog: true, noInt: true };
      this.setCommon(p, view, color);
      if (color) {
        const cam = vm.camInv;
        if (cam) {
          const sd = M4.dir(cam, this.sun);
          gl.uniform3fv(p.u.uSunDir, X.vnorm(sd));
        }
        gl.uniform1f(p.u.uHatch, 0);
        if (vm.tint) gl.uniform3fv(p.u.uTint, vm.tint);
      }
      const at = this.atlasTex();
      for (const part of vm.parts) {
        const g = this.cached(part.key, part.build);
        this.drawMeshRange(p, g, part.m, at, part.range);
      }
      if (color && this.outline) {
        const po = this.pO;
        gl.useProgram(po.p);
        gl.uniformMatrix4fv(po.u.uVP, false, P);
        gl.uniform3fv(po.u.uCam, [0, 0, 0]);
        gl.uniform3fv(po.u.uInk, this.grade.ink);
        gl.uniform1f(po.u.uMask, 0);
        gl.uniform1f(po.u.uW, 0.012 * this.lineW);
        gl.cullFace(gl.FRONT);
        gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
        for (const part of vm.parts) {
          const g = this.cached(part.key, part.build);
          gl.uniformMatrix4fv(po.u.uM, false, part.m);
          gl.bindBuffer(gl.ARRAY_BUFFER, g.vbo);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.ibo);
          gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 44, 0);
          gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 44, 12);
          const r = part.range || [0, g.count];
          gl.drawElements(gl.TRIANGLES, r[1] - r[0], g.type, r[0] * (g.type === gl.UNSIGNED_INT ? 4 : 2));
        }
        gl.cullFace(gl.BACK);
        gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
      }
    }
    drawMeshRange(p, g, model, tex, range) {
      const gl = this.gl, u = p.u;
      gl.uniformMatrix4fv(u.uM, false, model || IDENT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex || this.white);
      if (u.uTex) gl.uniform1i(u.uTex, 0);
      if (u.uAlphaTest) gl.uniform1f(u.uAlphaTest, 0);
      if (u.uMode) gl.uniform1f(u.uMode, 0);
      if (u.uMask) gl.uniform1f(u.uMask, 0);
      G.bindMesh(gl, g);
      const r = range || [0, g.count];
      gl.drawElements(gl.TRIANGLES, r[1] - r[0], g.type, r[0] * (g.type === gl.UNSIGNED_INT ? 4 : 2));
    }

    composite(tgt, out, post) {
      const gl = this.gl, p = this.pComp;
      post = post || {};
      gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.fb : null);
      const w = out ? out.w : this.W, h = out ? out.h : this.H;
      gl.viewport(post.vx || 0, post.vy || 0, post.vw || w, post.vh || h);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.useProgram(p.p);
      const bind = (unit, tex, name) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(p.u[name], unit); };
      bind(0, tgt.c.tex, 'uC'); bind(1, tgt.g.tex, 'uG'); bind(2, this.paper, 'uPaper');
      gl.uniform2f(p.u.uPx, 1 / tgt.w, 1 / tgt.h);
      gl.uniform2f(p.u.uRes, tgt.w, tgt.h);
      gl.uniform1f(p.u.uFar, FAR);
      gl.uniform1f(p.u.uLineW, (post.lineW || this.lineW) * Math.max(1, Math.min(1.8, tgt.h / 600)));
      gl.uniform1f(p.u.uInkFar, post.inkFar || this.grade.inkFar);
      gl.uniform3fv(p.u.uInk, this.grade.ink);
      gl.uniform1f(p.u.uInkAmt, post.ink === undefined ? this.inkAmt : post.ink);
      const gt = this.grade.tint;
      gl.uniform3fv(p.u.uGrade, gt);
      gl.uniform1f(p.u.uSat, post.sat === undefined ? this.grade.sat : post.sat);
      gl.uniform1f(p.u.uContrast, this.grade.contrast);
      gl.uniform1f(p.u.uFlash, post.flash || 0);
      gl.uniform3fv(p.u.uFlashCol, post.flashCol || [1, 1, 1]);
      gl.uniform1f(p.u.uVig, post.vig === undefined ? this.grade.vig : post.vig);
      gl.uniform1f(p.u.uTintMode, post.tint || 0);
      gl.uniform3fv(p.u.uDuoA, post.duoA || [0.25, 0.12, 0.06]);
      gl.uniform3fv(p.u.uDuoB, post.duoB || [1, 0.86, 0.62]);
      gl.uniform1f(p.u.uGrain, post.grain === undefined ? this.grade.grain : post.grain);
      gl.uniform1f(p.u.uTime, this.time || 0);
      gl.uniform4fv(p.u.uHurt, post.hurt || [0.6, 0, 0, 0]);
      gl.uniform1f(p.u.uWater, post.water || 0);
      gl.uniform1f(p.u.uGamma, 1 / (this.gamma || 1));
      gl.bindBuffer(gl.ARRAY_BUFFER, this.tri);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderMain(frame) {
      if (this.lost) return;
      const gl = this.gl;
      this.time = frame.time;
      this.dt = frame.dt;
      this.curAspect = this.W / this.H;
      const view = this.view(frame.cam, this.W, this.H);
      this.lastView = view;
      this.passes(view, this.main, { vm: frame.vm });
      this.composite(this.main, null, frame.post);
    }

    ensurePanelTargets(w, h) {
      if (this.panelTargets && this.panelTargets.w >= w && this.panelTargets.h >= h) return this.panelTargets;
      if (this.panelTargets) { const gl = this.gl; G.freeTarget(gl, this.panelTargets.g); G.freeTarget(gl, this.panelTargets.c); gl.deleteRenderbuffer(this.panelTargets.depth); }
      this.panelTargets = this.makeTargets(Math.max(w, 512), Math.max(h, 384));
      return this.panelTargets;
    }
    renderPanel(panel, cam, o) {
      const gl = this.gl;
      const w = panel.pw, h = panel.ph;
      const pt = this.ensurePanelTargets(w, h);
      const tgt = { g: pt.g, c: pt.c, w, h };
      if (!panel.out || panel.out.w !== w || panel.out.h !== h) {
        if (panel.out) G.freeTarget(gl, panel.out);
        panel.out = G.target(gl, w, h, false);
      }
      this.curAspect = w / h;
      const view = this.view(cam, w, h);
      o = o || {};
      this.passes(view, tgt, o);
      const post = Object.assign({ vig: 0.15, grain: 0.14 }, o.post || {});
      const sx = w / pt.w, sy = h / pt.h;
      this.compositeRegion(pt, panel.out, post, sx, sy);
      panel.view = view;
      return view;
    }
    compositeRegion(pt, out, post, sx, sy) {
      this.composite({ c: pt.c, g: pt.g, w: pt.w, h: pt.h }, { fb: out.fb, w: out.w, h: out.h }, Object.assign({}, post, { vx: 0, vy: 0, vw: Math.round(out.w / sx), vh: Math.round(out.h / sy) }));
    }

    beginOverlay() {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.W, this.H);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(this.pScr.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    }
    rect(x, y, w, h, color, tex, uv) {
      const gl = this.gl, u = this.pScr.u;
      gl.uniform4f(u.uRect, x / this.W, 1 - (y + h) / this.H, w / this.W, h / this.H);
      gl.uniform4fv(u.uUV, uv || [0, 0, 1, 1]);
      gl.uniform4fv(u.uColor, color || [1, 1, 1, 1]);
      gl.uniform1f(u.uTexMix, tex ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex || this.white); gl.uniform1i(u.uTex, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    endOverlay() { this.gl.disable(this.gl.BLEND); }
    freePanel(panel) { if (panel.out) { G.freeTarget(this.gl, panel.out); panel.out = null; } }
    destroy() {
      this.freeLevel();
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  }

  const IDENT = M4.ident();
  function scaleY(s) { const m = M4.ident(); m[5] = s; return m; }
  function scale3(x, y, z) { const m = M4.ident(); m[0] = x; m[5] = y; m[10] = z; return m; }
  function invert(m) {
    const inv = new Float32Array(16);
    inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
    inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
    inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
    inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
    inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
    inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
    inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
    inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
    inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
    inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
    inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
    inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
    inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
    inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
    inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
    inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
    let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
    det = det ? 1 / det : 0;
    for (let i = 0; i < 16; i++) inv[i] *= det;
    return inv;
  }
  X.invert = invert;

  function vehicleMesh(kind) {
    const m = new X.Mesh(256);
    if (kind === 'heli') {
      G.sphere(m, 0, 0, 0.3, 1.5, 12, 8, 1, [0.22, 0.26, 0.2], 0.85);
      G.box(m, 0, 0.15, 3.2, 0.25, 0.25, 2.4, 0, 1, [0.22, 0.26, 0.2]);
      G.box(m, 0, 0.9, 5.4, 0.08, 0.7, 0.4, 0, 1, [0.22, 0.26, 0.2]);
      G.box(m, 0, 1.2, 0, 0.15, 0.2, 0.15, 0, 1, [0.1, 0.1, 0.1]);
      G.box(m, 0, 0.1, -1.1, 0.9, 0.5, 0.35, 0, 1, [0.35, 0.5, 0.6]);
      for (const x of [-0.9, 0.9]) G.box(m, x, -1.3, 0.2, 0.05, 0.05, 1.3, 0, 1, [0.15, 0.15, 0.15]);
      G.box(m, 1.2, -0.3, -0.2, 0.2, 0.15, 0.5, 0, 1, [0.12, 0.12, 0.12]);
    } else if (kind === 'boat') {
      G.box(m, 0, 0.5, 0, 1.4, 0.5, 3.5, 0, 1, [0.85, 0.85, 0.8]);
      G.box(m, 0, 1.4, 0.4, 1.0, 0.5, 1.2, 0, 1, [0.9, 0.9, 0.85]);
    } else {
      G.box(m, 0, 0.5, 0, 1, 0.5, 2, 0, 1, [0.5, 0.5, 0.5]);
    }
    const pats = MD.atlas().pat || {};
    const w = pats.white || [0, 0, 0, 0];
    for (let i = 0; i < m.n; i++) { m.v[i * 11 + 6] = w[0]; m.v[i * 11 + 7] = w[1]; }
    return m;
  }

  function rotorMesh(len, w) {
    const m = new X.Mesh(64);
    G.box(m, 0, 0, 0, len, 0.03, w, 0.3, 1, [0.1, 0.1, 0.1]);
    G.box(m, 0, 0, 0, len, 0.03, w, 0.3 + Math.PI / 2, 1, [0.1, 0.1, 0.1]);
    G.cyl(m, 0, -0.05, 0, w * 0.9, w * 0.9, 0.12, 8, 1, [0.14, 0.14, 0.14], true, 0);
    const pats = MD.atlas().pat || {};
    const wp = pats.white || [0, 0, 0, 0];
    for (let i = 0; i < m.n; i++) { m.v[i * 11 + 6] = wp[0]; m.v[i * 11 + 7] = wp[1]; }
    return m;
  }

  function beamMesh(m, a, b, r, sides, us, col) {
    const d = X.vsub(b, a), L = X.vlen(d);
    if (L < 1e-6) return;
    const dn = X.vscale(d, 1 / L);
    const helper = Math.abs(dn[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    const u = X.vnorm(X.vcross(dn, helper)), w = X.vcross(dn, u);
    const n = Math.max(3, sides || 6), uu = us || 1;
    const off = k => { const t = k / n * Math.PI * 2; return X.vadd(X.vscale(u, Math.cos(t) * r), X.vscale(w, Math.sin(t) * r)); };
    for (let i = 0; i < n; i++) {
      const o0 = off(i), o1 = off(i + 1);
      const nn = X.vnorm(X.vadd(o0, o1));
      m.quadPts([X.vadd(a, o0), X.vadd(a, o1), X.vadd(b, o1), X.vadd(b, o0)], nn, [[i / n, 0], [(i + 1) / n, 0], [(i + 1) / n, L / uu], [i / n, L / uu]], col);
    }
  }

  X.Renderer = Renderer;
  X.RENDER_FAR = FAR;
})(globalThis.XIII = globalThis.XIII || {});
