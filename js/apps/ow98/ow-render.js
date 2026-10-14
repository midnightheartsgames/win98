(function (O) {
  'use strict';
  const M4 = O.M4;
  const PI = Math.PI;
  const PORTRAIT = {
    reinhardt: { dist: 7.8, drop: 0.3 }, roadhog: { dist: 7.4, drop: 0.35 }, winston: { dist: 6.6, drop: 0.3 },
    torbjorn: { dist: 7.6, drop: 0.7 }, zenyatta: { dist: 7, drop: 0.35 }, mccree: { dist: 7.8, drop: 0.2 }
  };
  const CLOUDS = { day: [0.5, 0.22, 0.004, 0.85], dusk: [0.5, 0.2, 0.003, 0.8], night: [0.58, 0.25, 0.002, 0.3], rain: [0.2, 0.35, 0.011, 1] };
  const VM_MUZZLE = {
    tracer: { r: [0, 0.2, -0.16, -0.64], l: [1, -0.2, -0.16, -0.64], s: 0.055 },
    soldier: { r: [0, 0.14, -0.18, -0.95], s: 0.1 },
    mccree: { r: [0, 0.18, -0.165, -0.73], s: 0.1 },
    junkrat: { r: [0, 0.14, -0.2, -0.94], s: 0.12 },
    torbjorn: { r: [0, 0.2, -0.18, -0.82], s: 0.1, weapon: 0 },
    widowmaker: { r: [0, 0.12, -0.17, -1.33], s: 0.09 },
    roadhog: { r: [0, 0.18, -0.18, -0.99], s: 0.16 },
    lucio: { r: [0, 0.22, -0.2, -0.72], s: 0.08 },
    mercy: { r: [3, 0.2, -0.2, -0.6], s: 0.06, weapon: 1 }
  };
  const PROJ_FLASH = { junkrat: [1, 0.6, 0.3], lucio: [0.55, 1, 0.35], mercy: [1, 0.85, 0.45] };
  const lerp3 = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

  const FP = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;
  const LIGHTS = `
uniform vec4 uLP[4]; uniform vec3 uLC[4];
vec3 dynLight(vec3 p, vec3 n, float wrap){
  vec3 s = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec3 d = uLP[i].xyz - p;
    float k = clamp(1.0 - dot(d, d) / (uLP[i].w * uLP[i].w), 0.0, 1.0);
    float nl = wrap > 0.99 ? 1.0 : clamp(dot(n, normalize(d)) * (1.0 - wrap) + wrap, 0.0, 1.0);
    s += uLC[i] * k * k * nl;
  }
  return s;
}
uniform vec3 uEye; uniform vec2 uFog; uniform vec3 uFogCol; uniform vec3 uSun; uniform vec3 uSunCol;
vec3 fogged(vec3 c, vec3 p){
  vec3 v = p - uEye;
  float d = length(v);
  float f = clamp((d - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0);
  float glow = pow(max(dot(v / max(d, 0.001), uSun), 0.0), 6.0);
  return mix(c, uFogCol + uSunCol * glow * 0.3, f);
}`;

  const VS_WORLD = `
attribute vec3 aPos; attribute vec2 aUv; attribute vec3 aCol;
uniform mat4 uVP; uniform vec2 uScroll;
varying vec2 vUv; varying vec3 vCol; varying vec3 vWp;
void main(){ vUv = aUv + uScroll; vCol = aCol; vWp = aPos; gl_Position = uVP * vec4(aPos, 1.0); }`;
  const FS_WORLD = FP + LIGHTS + `
uniform sampler2D uTex; uniform float uAlpha; uniform float uTest; uniform float uFlash; uniform float uGlow;
varying vec2 vUv; varying vec3 vCol; varying vec3 vWp;
void main(){
  vec4 t = texture2D(uTex, vUv);
  if (t.a < uTest) discard;
  vec3 c = t.rgb * (abs(vCol) + dynLight(vWp, vec3(0.0, 1.0, 0.0), 1.0) + uFlash);
  float glow = vCol.r < 0.0 ? clamp((-vCol.r - 0.2) / 1.15, 0.0, 1.0) : 0.0;
  gl_FragColor = vec4(fogged(c, vWp), uGlow > 0.5 ? glow : t.a * uAlpha);
}`;
  const VS_WATER = `
attribute vec3 aPos; attribute vec2 aUv; attribute vec3 aCol;
uniform mat4 uVP;
varying vec3 vWp; varying vec3 vCol;
void main(){ vWp = aPos; vCol = aCol; gl_Position = uVP * vec4(aPos, 1.0); }`;
  const FS_WATER = FP + LIGHTS + `
uniform sampler2D uTex; uniform float uT; uniform vec3 uTop; uniform vec3 uHor; uniform float uAlpha; uniform float uFlash;
varying vec3 vWp; varying vec3 vCol;
void main(){
  vec2 p = vWp.xz;
  vec3 a = texture2D(uTex, p / 6.0 + vec2(uT * 0.02, uT * 0.013)).rgb;
  vec3 b = texture2D(uTex, vec2(p.x * 0.8 - p.y * 0.6, p.x * 0.6 + p.y * 0.8) / 9.0 - vec2(uT * 0.017, -uT * 0.011)).rgb;
  vec3 base = (a + b) * 0.5 * vCol;
  float fade = clamp(1.0 - distance(uEye, vWp) / 90.0, 0.0, 1.0);
  float nx = (0.07 * cos(p.x * 1.3 + uT * 1.7) + 0.04 * cos((p.x + p.y) * 2.3 + uT * 2.1)) * fade + (a.r - b.g) * 0.25 * (0.3 + 0.7 * fade);
  float nz = (0.07 * cos(p.y * 1.1 - uT * 1.3) + 0.04 * cos((p.x - p.y) * 3.1 - uT * 2.7)) * fade + (a.g - b.r) * 0.25 * (0.3 + 0.7 * fade);
  vec3 n = normalize(vec3(nx, 1.0, nz));
  vec3 v = normalize(uEye - vWp);
  float fr = 0.06 + 0.8 * pow(1.0 - max(dot(n, v), 0.0), 4.0);
  vec3 r = reflect(-v, n);
  vec3 sky = mix(uHor, uTop, clamp(r.y * 1.6, 0.0, 1.0));
  vec3 c = mix(base * (1.0 + uFlash), sky, fr);
  float s = max(dot(r, uSun), 0.0);
  c += uSunCol * (pow(s, 220.0) * 2.2 + pow(s, 28.0) * 0.22);
  c += base * dynLight(vWp, n, 1.0);
  gl_FragColor = vec4(fogged(c, vWp), clamp(uAlpha + fr * 0.3, 0.0, 1.0));
}`;
  const VS_MODEL = `
attribute vec3 aPos; attribute vec3 aNrm; attribute vec4 aCol; attribute float aBone; attribute float aMat;
uniform mat4 uVP; uniform mat4 uB[15];
varying vec3 vN; varying vec3 vWp; varying vec4 vCol; varying float vMat;
void main(){
  mat4 m = uB[int(aBone + 0.5)];
  vec4 wp = m * vec4(aPos, 1.0);
  vN = (m * vec4(aNrm, 0.0)).xyz;
  vWp = wp.xyz; vCol = aCol; vMat = aMat;
  gl_Position = uVP * wp;
}`;
  const FS_MODEL = FP + LIGHTS + `
uniform vec3 uAmb; uniform vec4 uTint; uniform float uFlat; uniform float uAlpha; uniform float uFlash; uniform float uGlow;
varying vec3 vN; varying vec3 vWp; varying vec4 vCol; varying float vMat;
void main(){
  if (uFlat > 0.5) { gl_FragColor = vec4(uTint.rgb, uAlpha); return; }
  vec3 n = normalize(vN + vec3(0.0, 0.0001, 0.0));
  vec3 v = normalize(uEye - vWp);
  float nl = dot(n, uSun);
  float dif = clamp(nl * 0.82 + 0.18, 0.0, 1.0);
  dif = mix(dif, smoothstep(0.05, 0.55, dif), 0.3);
  vec3 amb = uAmb * (0.8 + 0.28 * n.y);
  float g = vMat;
  vec3 hv = normalize(uSun + v);
  float spec = pow(max(dot(n, hv), 0.0), 12.0 + 90.0 * g) * g * 1.3 * smoothstep(-0.05, 0.2, nl);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
  vec3 base = vCol.rgb;
  vec3 c = base * (amb + uSunCol * dif + dynLight(vWp, n, 0.25) + uFlash) + uSunCol * spec + (amb * 0.32 + uSunCol * 0.2 * g) * rim;
  c = mix(c, base * 1.3, vCol.a);
  c = mix(c, uTint.rgb, uTint.a);
  float d = distance(vWp, uEye);
  gl_FragColor = vec4(mix(c, uFogCol, clamp((d - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0)), uGlow > 0.5 ? vCol.a * (1.0 - uTint.a) : uAlpha);
}`;
  const VS_FX = `
attribute vec3 aPos; attribute vec2 aUv; attribute vec4 aCol;
uniform mat4 uVP; varying vec2 vUv; varying vec4 vCol;
void main(){ vUv = aUv; vCol = aCol; gl_Position = uVP * vec4(aPos, 1.0); }`;
  const FS_FX = `
precision mediump float;
uniform sampler2D uTex; varying vec2 vUv; varying vec4 vCol;
void main(){ gl_FragColor = texture2D(uTex, vUv) * vCol; }`;
  const VS_SKY = `
attribute vec2 aPos; varying vec2 vP;
void main(){ vP = aPos; gl_Position = vec4(aPos, 0.99999, 1.0); }`;
  const FS_SKY = FP + `
uniform mat4 uInv; uniform vec3 uEye; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uLow; uniform vec3 uSun; uniform vec3 uSunCol; uniform vec3 uLine; uniform sampler2D uSkyline; uniform float uStars;
uniform float uT; uniform vec4 uCloud; uniform vec3 uCloudCol; uniform vec3 uCloudShade; uniform float uFlash;
varying vec2 vP;
float hash(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
void main(){
  vec4 a = uInv * vec4(vP, 1.0, 1.0);
  vec3 d = normalize(a.xyz / a.w - uEye);
  float h = d.y;
  vec3 c = h > 0.0 ? mix(uHor, uTop, pow(clamp(h * 1.6, 0.0, 1.0), 0.7)) : mix(uHor, uLow, clamp(-h * 4.0, 0.0, 1.0));
  float s = max(dot(d, uSun), 0.0);
  c += uSunCol * pow(s, 5.0) * 0.16 * (1.0 - clamp(h * 2.0, 0.0, 1.0));
  float u = atan(d.x, d.z) / 6.28318 + 0.5;
  float glow = 0.0;
  if (uStars > 0.0 && h > 0.03) {
    vec2 g = floor(vec2(u * 900.0, h * 300.0));
    float r = hash(g), r2 = hash(g + 7.3);
    c += vec3(0.9, 0.93, 1.0) * step(0.9982, r) * uStars * (0.55 + 0.45 * sin(uT * (1.5 + r2 * 3.0) + r2 * 40.0)) * smoothstep(0.03, 0.2, h);
    float md = smoothstep(0.99935, 0.99955, s);
    float crater = noise(vec2(d.x, d.z + d.y) * 900.0) * 0.25 + noise(vec2(d.x, d.z + d.y) * 260.0) * 0.2;
    c = mix(c, vec3(0.88, 0.9, 0.96) * (0.78 + crater), md);
    c += uSunCol * pow(s, 90.0) * 0.4;
    glow = md * 0.35 + pow(s, 90.0) * 0.3;
  } else {
    c += uSunCol * (smoothstep(0.9991, 0.9995, s) * 1.4 + pow(s, 320.0) * 0.55 + pow(s, 14.0) * 0.18);
    glow = smoothstep(0.999, 0.9995, s) + pow(s, 60.0) * 0.35;
  }
  if (h > 0.0 && uCloud.w > 0.0) {
    vec2 cp = d.xz / (h + 0.07) * 0.8 + vec2(uT * uCloud.z, uT * uCloud.z * 0.4);
    float n = fbm(cp);
    float cov = smoothstep(uCloud.x, uCloud.x + uCloud.y, n);
    float n2 = fbm(cp + uSun.xz * 0.35);
    float lit = clamp(0.62 + (n - n2) * 3.2, 0.0, 1.0);
    vec3 cc = mix(uCloudShade, uCloudCol, lit);
    cc += uSunCol * pow(s, 7.0) * 0.55 * (1.0 - cov * 0.6);
    float ca = cov * smoothstep(0.0, 0.16, h) * uCloud.w;
    c = mix(c, cc + uFlash * 0.6, ca);
    glow *= 1.0 - ca * 0.8;
  }
  float v = 1.0 - clamp((h + 0.03) / 0.26, 0.0, 1.0);
  vec4 sk = texture2D(uSkyline, vec2(u * 3.0, v));
  c = mix(c, uLine * (0.75 + 0.5 * sk.r), sk.a * step(-0.03, h));
  c += vec3(0.75, 0.8, 1.0) * uFlash * 0.22;
  gl_FragColor = vec4(c, glow * (1.0 - sk.a * step(-0.03, h)));
}`;
  const VS_POST = `
attribute vec2 aPos; varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;
  const FS_BRIGHT = `
precision mediump float;
uniform sampler2D uTex; uniform vec2 uPx; uniform float uThr; varying vec2 vUv;
void main(){
  vec4 c = (texture2D(uTex, vUv + uPx * vec2(-1.0, -1.0)) + texture2D(uTex, vUv + uPx * vec2(1.0, -1.0)) + texture2D(uTex, vUv + uPx * vec2(-1.0, 1.0)) + texture2D(uTex, vUv + uPx)) * 0.25;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c.rgb * clamp(c.a, 0.0, 1.0) * mix(0.6, 1.0, smoothstep(uThr, 1.0, l)), 1.0);
}`;
  const FS_BLUR = `
precision mediump float;
uniform sampler2D uTex; uniform vec2 uDir; varying vec2 vUv;
void main(){
  vec3 c = texture2D(uTex, vUv).rgb * 0.227;
  c += (texture2D(uTex, vUv + uDir * 1.385).rgb + texture2D(uTex, vUv - uDir * 1.385).rgb) * 0.316;
  c += (texture2D(uTex, vUv + uDir * 3.231).rgb + texture2D(uTex, vUv - uDir * 3.231).rgb) * 0.07;
  gl_FragColor = vec4(c, 1.0);
}`;
  const FS_COMP = `
precision mediump float;
uniform sampler2D uTex; uniform sampler2D uBloom; uniform float uBloomK; uniform float uVig; uniform float uSat; uniform vec3 uLift; varying vec2 vUv;
void main(){
  vec3 c = texture2D(uTex, vUv).rgb + texture2D(uBloom, vUv).rgb * uBloomK;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat);
  c = c + uLift * (1.0 - l);
  vec2 q = vUv - 0.5;
  c *= 1.0 - dot(q, q) * uVig;
  gl_FragColor = vec4(c, 1.0);
}`;

  function sh(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function prog(gl, vs, fs, attrs) {
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs));
    attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); const name = info.name.replace(/\[0\]$/, ''); u[name] = gl.getUniformLocation(p, info.name); }
    return { p, u, n: attrs.length };
  }

  function skylineCanvas(kind, seed) {
    const c = O.Tex.canvas(1024, 128);
    if (!c) return null;
    const x = c.getContext('2d');
    x.clearRect(0, 0, 1024, 128);
    const r = O.rng(seed || 3);
    x.fillStyle = '#fff';
    if (kind === 'mountains' || kind === 'hills' || kind === 'rocks') {
      const amp = kind === 'hills' ? 30 : kind === 'rocks' ? 45 : 70;
      for (let layer = 0; layer < 2; layer++) {
        x.fillStyle = layer ? 'rgba(210,210,210,1)' : 'rgba(255,255,255,1)';
        x.beginPath(); x.moveTo(0, 128);
        let h = 60;
        for (let i = 0; i <= 1024; i += 16) { h = Math.max(10, Math.min(120, h + (r() - 0.5) * amp * 0.6)); x.lineTo(i, 128 - h * (layer ? 0.6 : 1)); }
        x.lineTo(1024, 128); x.fill();
      }
    } else if (kind === 'city' || kind === 'towers' || kind === 'domes') {
      for (let i = 0; i < 1024;) {
        const w = 10 + r() * 30, h = 20 + r() * (kind === 'towers' ? 100 : 70);
        x.fillRect(i, 128 - h, w, h);
        if (kind === 'domes' && r() < 0.3) { x.beginPath(); x.ellipse(i + w / 2, 128 - h - 8, w * 0.45, 14, 0, 0, Math.PI * 2); x.fill(); x.fillRect(i + w / 2 - 1, 128 - h - 34, 2, 14); }
        if (kind === 'towers' && r() < 0.2) x.fillRect(i + w / 2 - 2, 128 - h - 20, 4, 20);
        i += w + r() * 6;
      }
    } else if (kind === 'sea') {
      for (let i = 0; i < 1024; i += 64) if (r() < 0.3) { x.beginPath(); x.moveTo(i, 128); x.quadraticCurveTo(i + 30, 128 - 20 - r() * 20, i + 64, 128); x.fill(); }
    }
    return c;
  }

  class Renderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.opts = opts;
      const ctxOpts = { antialias: false, alpha: !!opts.alpha, depth: true, stencil: false, preserveDrawingBuffer: !!opts.preserve };
      const gl = canvas.getContext('webgl', ctxOpts) || canvas.getContext('experimental-webgl', ctxOpts);
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.pw = prog(gl, VS_WORLD, FS_WORLD, ['aPos', 'aUv', 'aCol']);
      this.pm = prog(gl, VS_MODEL, FS_MODEL, ['aPos', 'aNrm', 'aCol', 'aBone', 'aMat']);
      this.pwa = prog(gl, VS_WATER, FS_WATER, ['aPos', 'aUv', 'aCol']);
      this.pf = prog(gl, VS_FX, FS_FX, ['aPos', 'aUv', 'aCol']);
      this.ps = prog(gl, VS_SKY, FS_SKY, ['aPos']);
      this.skyBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      this.fxBuf = gl.createBuffer();
      this.fxArr = new Float32Array(9 * 6 * 3000);
      this.texCache = new Map();
      this.models = new Map();
      this.parts = new O.Particles();
      this.bones = new Float32Array(15 * 16);
      this.ident = M4.ident();
      this.anims = new Map();
      this.world = null;
      this.filter = opts.filter || 'linear';
      this.fxTex = this.texture(O.Tex.fx(), { repeat: false, mip: false });
      this.white = this.texture((() => { const c = O.Tex.canvas(4, 4); const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 4); return c; })(), { repeat: true });
      this.w = canvas.width; this.h = canvas.height;
      this.lightP = new Float32Array(16); this.lightC = new Float32Array(12);
      this.noLights();
      this.flash = 0; this.boltT = -9; this.boltNext = 0; this.gt = 0;
      this.parts.fpMuzzle = side => this.fpMuzzle(side);
      this.pComp = null;
      if (!opts.alpha) {
        try { this.pBright = prog(gl, VS_POST, FS_BRIGHT, ['aPos']); this.pBlur = prog(gl, VS_POST, FS_BLUR, ['aPos']); this.pComp = prog(gl, VS_POST, FS_COMP, ['aPos']); } catch (e) { this.pComp = null; }
      }
      this.setPost(opts.post !== false);
    }

    setPost(on) { this.post = !!on && !!this.pComp; }

    noLights() {
      for (let i = 0; i < 4; i++) this.lightP.set([0, -1e4, 0, 0.01], i * 4);
      this.lightC.fill(0);
    }

    gatherLights(scene) {
      const c = this.cam, list = [];
      for (const l of this.parts.lights) {
        if (l.age < 0) continue;
        const k = 1 - l.age / l.life;
        list.push([l.x, l.y, l.z, l.r, l.c, k * k]);
      }
      for (const p of scene.proj || []) {
        const d = O.FX_PROJ[p.kind];
        if (d && d.light && p.stuckTo === undefined) list.push([p.pos.x, p.pos.y, p.pos.z, d.light, d.glow || d.c, 0.85]);
      }
      for (const d of scene.deploy || []) if (d.kind === 'field') list.push([d.pos.x, d.pos.y + 1, d.pos.z, 6, [1, 0.8, 0.3], 0.5]);
      for (const l of list) l.push(l[5] * l[3] / (1 + Math.hypot(l[0] - c.x, l[1] - c.y, l[2] - c.z)));
      list.sort((a, b) => b[6] - a[6]);
      this.noLights();
      for (let i = 0; i < Math.min(4, list.length); i++) {
        const l = list[i];
        this.lightP.set([l[0], l[1], l[2], l[3]], i * 4);
        this.lightC.set([l[4][0] * l[5], l[4][1] * l[5], l[4][2] * l[5]], i * 3);
      }
    }

    setLights(p, on) {
      const gl = this.gl;
      gl.uniform4fv(p.u.uLP, on ? this.lightP : this.darkP || (this.darkP = new Float32Array([0, -1e4, 0, 0.01, 0, -1e4, 0, 0.01, 0, -1e4, 0, 0.01, 0, -1e4, 0, 0.01])));
      gl.uniform3fv(p.u.uLC, on ? this.lightC : this.darkC || (this.darkC = new Float32Array(12)));
      if (p.u.uFlash) gl.uniform1f(p.u.uFlash, on ? this.flash : 0);
    }

    storm(t) {
      const W = this.world;
      if (!W || !W.storm) { this.flash = 0; return; }
      if (t > this.boltNext) { this.boltT = t; this.boltNext = t + 7 + Math.random() * 13; if (this.onThunder) this.onThunder(); }
      const k = t - this.boltT;
      this.flash = k < 0 ? 0 : k < 0.07 ? 0.5 : k < 0.13 ? 0.08 : k < 0.3 ? 0.38 * (1 - (k - 0.13) / 0.17) : 0;
    }

    fpMuzzle(side) {
      const c = this.cam;
      if (!c || !c.world || !this.fpHero) return null;
      if (this.fpScoped) return M4.point(c.world, 0.05, -0.12, -0.6);
      const d = VM_MUZZLE[this.fpHero];
      if (!d) return null;
      const m = side < 0 && d.l ? d.l : d.r;
      const f1 = 1 / Math.tan(0.6), f0 = 1 / Math.tan(c.fovV / 2);
      const D = Math.max(0.7, -m[3]);
      const k = f1 / f0 * D / -m[3];
      return M4.point(c.world, m[1] * k, m[2] * k, -D);
    }

    makeFbo() {
      const gl = this.gl;
      const old = this.fbo;
      if (old) { for (const t of old.tex) gl.deleteTexture(t); for (const f of old.fb) gl.deleteFramebuffer(f); gl.deleteRenderbuffer(old.rb); }
      const w = Math.max(1, this.w), h = Math.max(1, this.h), w2 = Math.max(1, w >> 2), h2 = Math.max(1, h >> 2);
      const tex = (tw, th) => {
        const t = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        return t;
      };
      const T = [tex(w, h), tex(w2, h2), tex(w2, h2)];
      const rb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      let ok = true;
      const F = T.map((t, i) => {
        const f = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        if (i === 0) gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) ok = false;
        return f;
      });
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.fbo = { w: this.w, h: this.h, w2, h2, tex: T, fb: F, rb };
      if (!ok) this.post = false;
    }

    fullscreen(p) {
      const gl = this.gl;
      gl.useProgram(p.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      for (let i = 1; i < 5; i++) gl.disableVertexAttribArray(i);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    beginPost() {
      if (!this.post) return false;
      if (!this.fbo || this.fbo.w !== this.w || this.fbo.h !== this.h) this.makeFbo();
      if (!this.post) return false;
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.fbo.fb[0]);
      return true;
    }

    endPost() {
      const gl = this.gl, F = this.fbo;
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(false); gl.disable(gl.CULL_FACE);
      gl.activeTexture(gl.TEXTURE0);
      const pass = (p, fb, src, w, h, set) => {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.viewport(0, 0, w, h);
        gl.useProgram(p.p);
        gl.bindTexture(gl.TEXTURE_2D, src);
        gl.uniform1i(p.u.uTex, 0);
        set(p);
        this.fullscreen(p);
      };
      pass(this.pBright, F.fb[1], F.tex[0], F.w2, F.h2, p => { gl.uniform2f(p.u.uPx, 1.5 / F.w, 1.5 / F.h); gl.uniform1f(p.u.uThr, 0.92); });
      for (const k of [1, 2]) {
        pass(this.pBlur, F.fb[2], F.tex[1], F.w2, F.h2, p => gl.uniform2f(p.u.uDir, k / F.w2, 0));
        pass(this.pBlur, F.fb[1], F.tex[2], F.w2, F.h2, p => gl.uniform2f(p.u.uDir, 0, k / F.h2));
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.w, this.h);
      const p = this.pComp;
      gl.useProgram(p.p);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, F.tex[1]); gl.uniform1i(p.u.uBloom, 1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, F.tex[0]); gl.uniform1i(p.u.uTex, 0);
      const W = this.world, night = W && (W.stars > 0 || W.storm);
      gl.uniform1f(p.u.uBloomK, night ? 1.25 : 1.0);
      gl.uniform1f(p.u.uVig, 0.55);
      gl.uniform1f(p.u.uSat, 1.08);
      gl.uniform3fv(p.u.uLift, night ? [0.0, 0.01, 0.035] : [0.012, 0.01, 0.02]);
      this.fullscreen(p);
      gl.depthMask(true); gl.enable(gl.DEPTH_TEST);
    }

    ok() { return !!this.gl; }

    destroy() {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }

    texture(canvas, o = {}) {
      const gl = this.gl;
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
      const pow2 = (canvas.width & (canvas.width - 1)) === 0 && (canvas.height & (canvas.height - 1)) === 0;
      const nearest = this.filter === 'nearest' && o.mip !== false;
      if (pow2 && o.mip !== false) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, nearest ? gl.NEAREST_MIPMAP_NEAREST : gl.LINEAR_MIPMAP_LINEAR);
      } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, nearest ? gl.NEAREST : gl.LINEAR);
      const wrap = pow2 && o.repeat !== false ? gl.REPEAT : gl.CLAMP_TO_EDGE;
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, o.clampT ? gl.CLAMP_TO_EDGE : wrap);
      return t;
    }

    matTex(key) {
      if (this.texCache.has(key)) return this.texCache.get(key);
      const c = O.Tex.get(key);
      const t = c ? this.texture(c, { repeat: true }) : this.white;
      this.texCache.set(key, t);
      return t;
    }

    resize(w, h) {
      this.canvas.width = w; this.canvas.height = h;
      this.w = w; this.h = h;
    }

    buf(data) {
      const gl = this.gl;
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return b;
    }

    modelBuf(d) {
      return { pos: this.buf(d.pos), nrm: this.buf(d.nrm), col: this.buf(d.col), bone: this.buf(d.bone), mat: this.buf(d.mat || new Float32Array(d.n)), n: d.n };
    }

    freeWorld() {
      const gl = this.gl;
      if (!this.world) return;
      for (const g of this.world.groups) { gl.deleteBuffer(g.pos); gl.deleteBuffer(g.uv); gl.deleteBuffer(g.col); }
      if (this.world.props) { const p = this.world.props; for (const k of ['pos', 'nrm', 'col', 'bone', 'mat']) gl.deleteBuffer(p[k]); }
      for (const t of this.world.signTex || []) gl.deleteTexture(t);
      this.world = null;
    }

    setMap(map) {
      this.freeWorld();
      const th = map.theme || {};
      const wm = new O.WorldMesh(map, { shadows: this.opts.shadows !== false });
      const built = wm.build();
      const signTex = new Map();
      for (const s of built.signs) {
        const c = O.Tex.sign(s.text, { bg: s.bg, fg: s.fg, font: s.font, w: s.w, h: s.h, glow: s.glow });
        if (c) signTex.set(s.key, this.texture(c, { repeat: false, mip: true, clampT: true }));
      }
      const groups = built.groups.map(g => {
        const key = g.key.replace(/^d:/, '');
        return {
          key: g.key, alpha: g.alpha, n: g.n, decal: key !== g.key,
          pos: this.buf(g.pos), uv: this.buf(g.uv), col: this.buf(g.col),
          tex: signTex.get(key) || this.matTex(key.replace(/#.*$/, '')),
          test: O.Tex.ALPHA[key] ? 0.5 : 0
        };
      }).sort((a, b) => a.decal - b.decal);
      const water = map.vis.water.map(w => {
        const pos = [], uv = [], col = [];
        const q = [[w.x0, w.z0], [w.x1, w.z0], [w.x1, w.z1], [w.x0, w.z0], [w.x1, w.z1], [w.x0, w.z1]];
        const c = O.rgb(w.tint);
        for (const [x, z] of q) { pos.push(x, w.y, z); uv.push(x / 6, z / 6); col.push(c[0] * 1.4, c[1] * 1.4, c[2] * 1.4); }
        return { pos: this.buf(new Float32Array(pos)), uv: this.buf(new Float32Array(uv)), col: this.buf(new Float32Array(col)), n: 6 };
      });
      if (th.sea !== undefined) {
        const y = th.sea, S = 1500;
        const pos = [-S, y, -S, S, y, -S, S, y, S, -S, y, -S, S, y, S, -S, y, S];
        const uv = pos.map((v, i) => (i % 3 === 1 ? null : v / 8)).filter(v => v !== null);
        const c = O.rgb(th.seaCol || 0x2a6a9a);
        const col = []; for (let i = 0; i < 6; i++) col.push(c[0] * 1.3, c[1] * 1.3, c[2] * 1.3);
        water.push({ pos: this.buf(new Float32Array(pos)), uv: this.buf(new Float32Array(uv)), col: this.buf(new Float32Array(col)), n: 6, sea: true });
      }
      const pd = O.buildProps(map);
      const props = pd.n ? this.modelBuf(pd) : null;
      const sk = skylineCanvas(th.skyline || 'mountains', O.hash(map.id));
      this.world = {
        map, groups, water, props, signTex: [...signTex.values()],
        fog: O.rgb(th.fog === undefined ? 0xc8d0dc : th.fog), fogNear: th.fogNear || 60, fogFar: th.fogFar || 220,
        top: O.rgb(th.skyTop === undefined ? 0x6aa0e0 : th.skyTop), hor: O.rgb(th.skyHorizon === undefined ? 0xd8e4f0 : th.skyHorizon),
        low: O.rgb(th.skyLow === undefined ? (th.fog === undefined ? 0xa0a8b0 : th.fog) : th.skyLow),
        sun: (() => { const s = th.sun || [0.4, 0.8, 0.3]; const l = Math.hypot(...s); return [s[0] / l, s[1] / l, s[2] / l]; })(),
        sunCol: O.rgb(th.sunCol === undefined ? 0xfff0dc : th.sunCol), amb: O.rgb(th.amb === undefined ? 0x8a90a8 : th.amb),
        line: O.rgb(th.skylineTint === undefined ? 0x8090a8 : th.skylineTint), skyline: sk ? this.texture(sk, { repeat: true, mip: false, clampT: true }) : this.white,
        stars: th.time === 'night' ? 0.8 : 0, petals: !!th.petals, snow: !!th.snow, confetti: !!th.confetti, rain: !!th.rain,
        time: th.time || 'day', storm: !!th.rain
      };
      const W = this.world, cl = CLOUDS[W.time] || CLOUDS.day;
      W.cloud = th.clouds === 0 ? [0, 0, 0, 0] : [th.clouds || cl[0], cl[1], cl[2], cl[3]];
      W.cloudCol = W.time === 'dusk' ? lerp3(W.sunCol, [1, 0.95, 0.95], 0.35) : W.time === 'night' ? lerp3(W.hor, W.top, 0.3) : W.time === 'rain' ? [0.34, 0.37, 0.44] : [1, 1, 1];
      W.cloudShade = W.time === 'dusk' ? lerp3(W.top, [0.5, 0.35, 0.5], 0.4) : W.time === 'night' ? lerp3(W.top, [0, 0, 0], 0.3) : W.time === 'rain' ? [0.13, 0.15, 0.19] : lerp3(W.top, [0.62, 0.66, 0.75], 0.65);
      this.parts.clear();
      this.anims.clear();
      if (this.sprays) { for (const x of this.sprays) this.gl.deleteTexture(x.tex); this.sprays = []; }
      this.payloadStyle = map.def.payloadStyle || map.id;
      return this.world;
    }

    heroModel(heroId, skin) {
      const key = 'h:' + heroId + ':' + skin;
      let m = this.models.get(key);
      if (!m) { const b = O.buildHeroModel(heroId, skin); m = this.modelBuf(b.data); m.S = b.S; this.models.set(key, m); }
      return m;
    }
    viewModel(heroId, skin) {
      const key = 'v:' + heroId + ':' + skin;
      let m = this.models.get(key);
      if (!m) { m = this.modelBuf(O.buildViewModel(heroId, skin).data); this.models.set(key, m); }
      return m;
    }
    depModel(kind, arg) {
      const key = 'd:' + kind + ':' + arg;
      let m = this.models.get(key);
      if (!m) { m = this.modelBuf(O.buildDeployModel(kind, arg)); this.models.set(key, m); }
      return m;
    }

    camera(cam) {
      const aspect = this.w / Math.max(1, this.h);
      const fovH = cam.fovH || 1.65;
      const fovV = cam.fovV || 2 * Math.atan(Math.tan(fovH / 2) / aspect);
      const proj = M4.perspective(fovV, aspect, cam.near || 0.06, cam.far || 900);
      const d = O.dir(cam.yaw, cam.pitch);
      let view = M4.lookAt(cam.x, cam.y, cam.z, cam.x + d.x, cam.y + d.y, cam.z + d.z);
      if (cam.roll) view = M4.mul(M4.rotZ(cam.roll), view);
      const vp = M4.mul(proj, view);
      this.cam = { ...cam, proj, view, vp, fovV, aspect, inv: M4.invert(vp), dir: d };
      this.cam.world = M4.invert(view);
      this.cam.right = [view[0], view[4], view[8]];
      this.cam.up = [view[1], view[5], view[9]];
      return this.cam;
    }

    project(x, y, z) {
      const m = this.cam.vp;
      const cx = m[0] * x + m[4] * y + m[8] * z + m[12], cy = m[1] * x + m[5] * y + m[9] * z + m[13], cw = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (cw <= 0.01) return null;
      return { x: (cx / cw * 0.5 + 0.5), y: (1 - (cy / cw * 0.5 + 0.5)), d: cw };
    }

    drawSky() {
      const gl = this.gl, W = this.world, p = this.ps, c = this.cam;
      gl.useProgram(p.p);
      gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      for (let i = 1; i < 5; i++) gl.disableVertexAttribArray(i);
      gl.uniformMatrix4fv(p.u.uInv, false, c.inv);
      gl.uniform3f(p.u.uEye, c.x, c.y, c.z);
      gl.uniform3fv(p.u.uTop, W.top); gl.uniform3fv(p.u.uHor, W.hor); gl.uniform3fv(p.u.uLow, W.low);
      gl.uniform3fv(p.u.uSun, W.sun); gl.uniform3fv(p.u.uSunCol, W.sunCol); gl.uniform3fv(p.u.uLine, W.line);
      gl.uniform1f(p.u.uStars, W.stars);
      gl.uniform1f(p.u.uT, this.t || 0);
      gl.uniform4fv(p.u.uCloud, W.cloud);
      gl.uniform3fv(p.u.uCloudCol, W.cloudCol);
      gl.uniform3fv(p.u.uCloudShade, W.cloudShade);
      gl.uniform1f(p.u.uFlash, this.flash);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, W.skyline); gl.uniform1i(p.u.uSkyline, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    }

    worldProg(fog, glow) {
      const gl = this.gl, p = this.pw, c = this.cam, W = this.world;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, c.vp);
      gl.uniform3f(p.u.uEye, c.x, c.y, c.z);
      gl.uniform2f(p.u.uFog, fog ? W.fogNear : 1e5, fog ? W.fogFar : 1e6);
      gl.uniform3fv(p.u.uFogCol, W.fog);
      gl.uniform3fv(p.u.uSun, W.sun);
      gl.uniform3fv(p.u.uSunCol, W.sunCol);
      gl.uniform2f(p.u.uScroll, 0, 0);
      gl.uniform1i(p.u.uTex, 0);
      gl.uniform1f(p.u.uGlow, glow && this.glowPass ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0);
      this.setLights(p, true);
      for (let i = 3; i < 5; i++) gl.disableVertexAttribArray(i);
      return p;
    }

    drawWater(t) {
      const gl = this.gl, p = this.pwa, c = this.cam, W = this.world;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, c.vp);
      gl.uniform3f(p.u.uEye, c.x, c.y, c.z);
      gl.uniform2f(p.u.uFog, W.fogNear, W.fogFar);
      gl.uniform3fv(p.u.uFogCol, W.fog); gl.uniform3fv(p.u.uSun, W.sun); gl.uniform3fv(p.u.uSunCol, W.sunCol);
      gl.uniform3fv(p.u.uTop, W.top); gl.uniform3fv(p.u.uHor, W.hor);
      gl.uniform1f(p.u.uT, t);
      this.setLights(p, true);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.matTex('water')); gl.uniform1i(p.u.uTex, 0);
      for (let i = 1; i < 5; i++) gl.disableVertexAttribArray(i);
      for (const w of W.water) {
        gl.uniform1f(p.u.uAlpha, w.sea ? 0.9 : 0.72);
        gl.bindBuffer(gl.ARRAY_BUFFER, w.pos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, w.col); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, w.n);
      }
    }

    drawGroup(g, alpha) {
      const gl = this.gl, p = this.pw;
      gl.bindTexture(gl.TEXTURE_2D, g.tex || this.white);
      gl.uniform1f(p.u.uAlpha, alpha === undefined ? 1 : alpha);
      gl.uniform1f(p.u.uTest, g.test || 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.pos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.uv); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, g.col); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, g.n);
    }

    modelProg(vp, eye) {
      const gl = this.gl, p = this.pm, W = this.world;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, vp || this.cam.vp);
      const e = eye || this.cam;
      gl.uniform3f(p.u.uEye, e.x, e.y, e.z);
      gl.uniform3fv(p.u.uSun, W ? W.sun : [0.4, 0.8, 0.4]);
      gl.uniform3fv(p.u.uSunCol, W ? W.sunCol : [1, 0.95, 0.9]);
      gl.uniform3fv(p.u.uAmb, W ? W.amb : [0.55, 0.58, 0.66]);
      gl.uniform2f(p.u.uFog, W ? W.fogNear : 1e5, W ? W.fogFar : 1e6);
      gl.uniform3fv(p.u.uFogCol, W ? W.fog : [0.5, 0.5, 0.5]);
      gl.uniform4f(p.u.uTint, 0, 0, 0, 0);
      gl.uniform1f(p.u.uFlat, 0);
      gl.uniform1f(p.u.uAlpha, 1);
      gl.uniform1f(p.u.uGlow, this.glowPass ? 1 : 0);
      this.setLights(p, !!W);
      return p;
    }

    drawModel(m, bones, o = {}) {
      const gl = this.gl, p = this.pm;
      gl.uniformMatrix4fv(p.u.uB, false, bones);
      if (o.tint) gl.uniform4f(p.u.uTint, o.tint[0], o.tint[1], o.tint[2], o.tint[3]); else gl.uniform4f(p.u.uTint, 0, 0, 0, 0);
      gl.uniform1f(p.u.uFlat, o.flat ? 1 : 0);
      gl.uniform1f(p.u.uAlpha, o.alpha === undefined ? 1 : o.alpha);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.pos); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.nrm); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.col); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.bone); gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, m.mat); gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, m.n);
    }

    animState(h, t) {
      let a = this.anims.get(h.id);
      const v = h.vis || {};
      if (!a) {
        a = { phase: 0, x: h.pos.x, y: h.pos.y, z: h.pos.z, t, yaw: h.yaw || 0, vx: 0, vy: 0, vz: 0, lf: 0, ll: 0, hip: 0, air: v.air ? 1 : 0, crouch: v.crouch ? 1 : 0, sprint: 0, shield: 0, scope: 0, airT: 0, minVy: 0, landT: 9, landV: 0, turn: 0, tphase: 0, hurt: h.lastHurt, hurtSide: 0, alive: h.alive, deathKind: 0, deathSide: 1, pose: null, poseT0: 0, poseW: 0, seed: (O.hash(String(h.id)) % 97) / 15 };
        this.anims.set(h.id, a);
      }
      const dt = t - a.t;
      const e = r => 1 - Math.exp(-Math.min(0.1, Math.max(0, dt)) * r);
      if (dt > 0 && dt < 0.25) {
        const dx = h.pos.x - a.x, dy = h.pos.y - a.y, dz = h.pos.z - a.z;
        const d = Math.hypot(dx, dz);
        if (d < 3) {
          a.vx += (dx / dt - a.vx) * e(14); a.vz += (dz / dt - a.vz) * e(14); a.vy += (dy / dt - a.vy) * e(20);
          a.phase += d * 2.1 * (O.Anim.STRIDE[h.heroId] || 1);
        } else { a.vx = 0; a.vy = 0; a.vz = 0; }
        const yaw = h.yaw || 0;
        a.turn += (O.angDiff(a.yaw, yaw) / dt - a.turn) * e(10);
        a.tphase += Math.abs(a.turn) * dt * 1.6;
        a.yaw = yaw;
        const sy = Math.sin(yaw), cy = Math.cos(yaw);
        a.lf = a.vx * sy + a.vz * cy; a.ll = a.vx * cy - a.vz * sy;
        a.hip += (O.Anim.hipTarget(a.lf, a.ll) - a.hip) * e(8);
        const air = !!v.air && h.alive;
        if (air) { a.airT += dt; a.minVy = Math.min(a.minVy, a.vy); }
        else { if (a.airT > 0.12) { a.landT = 0; a.landV = Math.max(0, -a.minVy); } a.airT = 0; a.minVy = 0; a.landT += dt; }
        a.air += ((air ? 1 : 0) - a.air) * e(air ? 14 : 20);
        a.crouch += ((v.crouch ? 1 : 0) - a.crouch) * e(10);
        a.sprint += ((v.sprint ? 1 : 0) - a.sprint) * e(8);
        a.shield += ((v.shield ? 1 : 0) - a.shield) * e(11);
        a.scope += ((v.scope !== undefined && v.scope >= 0 ? 1 : 0) - a.scope) * e(12);
      }
      if (v.pose) {
        const t0 = v.poseT === undefined ? 0 : v.poseT;
        if (a.pose !== v.pose || a.poseT0 !== t0) { if (!a.pose) a.poseW = 0; a.pose = v.pose; a.poseT0 = t0; }
        a.poseW = Math.min(1, a.poseW + Math.max(0, Math.min(0.1, dt)) / 0.22);
      } else if (a.pose) {
        a.poseW -= Math.max(0, Math.min(0.1, dt)) / 0.3;
        if (a.poseW <= 0) { a.pose = null; a.poseW = 0; }
      }
      if (h.lastHurt !== undefined && h.lastHurt !== a.hurt) {
        a.hurt = h.lastHurt;
        const src = h.lastAttacker !== undefined && h.lastAttacker !== null && this.sceneHeroes ? this.sceneHeroes.find(x => x.id === h.lastAttacker) : null;
        if (src && src.pos) {
          const ang = O.angDiff(h.yaw || 0, Math.atan2(src.pos.x - h.pos.x, src.pos.z - h.pos.z));
          a.hurtSide = Math.sin(ang); a.hurtFront = Math.cos(ang);
        } else { a.hurtSide = (O.hash(String(h.lastHurt)) % 3) - 1; a.hurtFront = 1; }
      }
      if (a.alive && !h.alive) {
        const f = a.hurtFront === undefined ? 1 : a.hurtFront;
        a.deathKind = f < -0.4 ? 1 : Math.abs(a.hurtSide || 0) > 0.7 ? 2 : f > 0.4 ? 0 : O.hash(String(h.id) + t) % 3;
        a.deathSide = (a.hurtSide || 0) >= 0 ? 1 : -1;
      }
      a.alive = h.alive;
      a.t = t;
      a.x = h.pos.x; a.y = h.pos.y; a.z = h.pos.z;
      return a;
    }

    heroState(h, t, a) {
      const v = h.vis || {};
      const wr = v.wallride;
      const st = {
        t, x: h.pos.x, y: h.pos.y, z: h.pos.z, yaw: h.yaw, pitch: h.pitch, move: v.moving || 0, phase: a ? a.phase : 0, air: !!v.air, crouch: !!v.crouch,
        shotT: Math.max(v.shotT === undefined ? -9 : v.shotT, v.shot2T === undefined ? -9 : v.shot2T), shot1T: v.shotT, shot2T: v.shot2T,
        act: v.act, actT: v.actT, item: v.item, side: v.side, shield: !!v.shield, scope: v.scope === undefined ? -1 : v.scope,
        weapon: v.weapon || 0, fly: !!v.fly, descent: !!v.descent, sprint: !!v.sprint, wallride: !!wr, dead: !h.alive, deadT: h.deadT || 0,
        stun: (h.st && (h.st.stun > 0 || h.st.knock > 0)), breath: !!v.breath, volley: v.volley || 0,
        beam: h.heroId === 'mercy' && !!(v.beams && v.beams.length), rage: h.ultOn === 'rage',
        pose: v.pose || null, poseT0: v.poseT || 0, poseW: 1
      };
      if (wr) st.wallSide = (wr[0] * Math.cos(h.yaw || 0) - wr[1] * Math.sin(h.yaw || 0)) > 0 ? 1 : -1;
      if (a) {
        Object.assign(st, { lf: a.lf, ll: a.ll, hipYaw: a.hip, vy: a.vy, airW: a.air, crouchW: a.crouch, sprintW: a.sprint, shieldW: a.shield, scopeW: a.scope, landT: a.landT, landV: a.landV, turn: a.turn, tphase: a.tphase, deathKind: a.deathKind, deathSide: a.deathSide, seed: a.seed, pose: a.pose, poseT0: a.poseT0, poseW: a.poseW });
        if (h.lastHurt !== undefined) { st.hurtT = t - h.lastHurt; st.hurtSide = a.hurtSide; }
      }
      return st;
    }

    drawHero(h, t, o = {}) {
      const m = this.heroModel(h.heroId, h.skin || 'classic');
      const a = o.still || h.still ? null : this.animState(h, t);
      const st = this.heroState(h, t, a);
      if (o.yaw !== undefined) st.yaw = o.yaw;
      if (o.idle) st.idle = true;
      if (o.noWeapon) st.noWeapon = true;
      const world = O.Anim.heroBones(h.heroId, m.S, st, this.bones);
      this.drawModel(m, this.bones, o);
      if (!o.flat || !o.alpha) this.drawProps(O.Anim.props(h.heroId, m.S, st, world), o);
    }

    drawProps(list, o) {
      if (!list) return;
      const mats = this.propMats || (this.propMats = new Float32Array(15 * 16));
      for (const p of list) {
        const mm = this.depModel('item', p.m);
        for (let i = 0; i < 4; i++) mats.set(p.mat, i * 16);
        this.drawModel(mm, mats, o);
      }
    }

    showcase(o) {
      const gl = this.gl;
      gl.viewport(0, 0, this.w, this.h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!o.hero || !O.HEROES[o.hero]) return null;
      const def = O.HEROES[o.hero];
      const fovV = 0.46;
      const cy = def.h * 0.5 + (o.hero === 'zenyatta' ? 0.2 : 0);
      const dist = (def.h * 0.5 + 0.35) / Math.tan(fovV / 2) * (o.zoom || 1);
      const orbit = o.orbit || 0;
      this.camera({ x: Math.sin(orbit) * dist, y: cy + 0.35, z: Math.cos(orbit) * dist, yaw: orbit + PI, pitch: -Math.atan2(0.35, dist), fovV, near: 0.1, far: 60 });
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
      gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
      const W = this.world;
      this.world = null;
      const p = this.modelProg();
      this.world = W;
      gl.uniform3fv(p.u.uSun, [-0.42, 0.72, 0.55]);
      gl.uniform3fv(p.u.uSunCol, [0.92, 0.88, 0.8]);
      gl.uniform3fv(p.u.uAmb, [0.5, 0.54, 0.64]);
      gl.uniform2f(p.u.uFog, 1e5, 1e6);
      const mats = new Float32Array(15 * 16);
      const k = Math.max(0.55, def.r * 2.1);
      mats.set(M4.mul(M4.rotY(o.t * 0.15), M4.scale(k, 1, k)), 0);
      if (o.floor !== false) this.drawModel(this.depModel('pedestal'), mats);
      const h = { id: 'stage', heroId: o.hero, skin: o.skin || 'classic', pos: { x: 0, y: 0.12, z: 0 }, yaw: o.yaw || 0, pitch: -0.08, alive: true, r: def.r, h: def.h, vis: { pose: o.pose || null, poseT: 0, weapon: 0 } };
      this.drawHero(h, o.ct === undefined ? o.t : o.ct, { idle: !o.pose, still: o.still });
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      this.drawFx({ heroes: [h] }, o.t);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      return this.cam;
    }

    render(scene) {
      const gl = this.gl;
      if (!this.world) return;
      const t = scene.t;
      const gt = scene.gt === undefined ? t : scene.gt;
      this.t = t; this.gt = gt;
      const c = this.camera(scene.cam);
      const viewer = scene.viewer;
      const fpOn = !!(viewer && scene.fp && viewer.alive && viewer.heroId);
      this.fpHero = fpOn ? viewer.heroId : null;
      this.sceneHeroes = scene.heroes;
      if (!fpOn && this.fp) this.fp.alive = false;
      this.fpScoped = fpOn && !!scene.noVm;
      this.storm(t);
      this.gatherLights(scene);
      const post = this.beginPost();
      this.glowPass = post;
      gl.viewport(0, 0, this.w, this.h);
      gl.clearColor(this.world.fog[0], this.world.fog[1], this.world.fog[2], post ? 0 : 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      this.drawSky();
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
      this.worldProg(true, true);
      for (const g of this.world.groups) if ((!g.alpha || g.test) && !g.decal) this.drawGroup(g);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -6);
      for (const g of this.world.groups) if ((!g.alpha || g.test) && g.decal) this.drawGroup(g);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.disable(gl.CULL_FACE);
      this.modelProg();
      if (this.world.props) this.drawModel(this.world.props, this.ident);
      this.drawDynamic(scene, t);
      this.drawXray(scene, gt);
      this.modelProg();
      for (const h of scene.heroes) {
        if (!h.heroId || (!h.alive && (h.deadT || 0) > 3.5)) continue;
        if (viewer && h === viewer && scene.fp) continue;
        if (h.k && h.k.recalling > 0) continue;
        const inv = h.st && h.st.phase > 0;
        const hurt = gt - (h.lastHurt === undefined ? -99 : h.lastHurt);
        this.drawHero(h, gt, inv ? { alpha: 0.4 } : h.alive && hurt >= 0 && hurt < 0.12 ? { tint: [1, 1, 1, 0.42 * (1 - hurt / 0.12)] } : {});
      }
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.depthMask(false);
      if (this.world.water.length) this.drawWater(t);
      this.worldProg(true);
      gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-2, -6);
      for (const g of this.world.groups) if (g.alpha && !g.test) this.drawGroup(g, 0.85);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      this.drawSprays();
      this.drawFx(scene, t);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      if (fpOn && !scene.noVm) this.drawViewModel(viewer, scene, gt);
      this.glowPass = false;
      if (post) this.endPost();
    }

    drawDynamic(scene, t) {
      const M = M4;
      const mats = new Float32Array(15 * 16);
      const set = (i, m) => mats.set(m, i * 16);
      if (scene.payload) {
        const p = scene.payload;
        const m = this.depModel('payload', this.payloadStyle);
        set(0, M.mul(M.translate(p.x, p.y, p.z), M.rotY(p.yaw)));
        this.drawModel(m, mats);
      }
      for (const pk of scene.pickups || []) {
        const m = this.depModel('health', pk.big);
        set(0, M.translate(pk.x, pk.y, pk.z));
        set(1, pk.t > 0 ? M.scale(0, 0, 0) : M.mul(M.translate(pk.x, pk.y + Math.sin(t * 2 + pk.x) * 0.08, pk.z), M.rotY(t * 1.5)));
        this.drawModel(m, mats);
      }
      for (const d of scene.deploy || []) {
        let m = null;
        if (d.kind === 'turret') {
          m = this.depModel('turret', d.level || 1);
          const s = d.age < (d.build || 0) ? 0.3 + 0.7 * d.age / d.build : 1;
          set(0, M.mul(M.translate(d.pos.x, d.pos.y, d.pos.z), M.scale(s, s, s)));
          set(1, M.mul(M.mul(M.translate(d.pos.x, d.pos.y, d.pos.z), M.scale(s, s, s)), M.mul(M.translate(0, 0.9, 0), M.mul(M.mul(M.rotY(d.yaw || 0), M.rotX(-(d.pitch || 0))), M.translate(0, -0.9, 0)))));
        } else if (d.kind === 'trap') { m = this.depModel('trap', d.sprung ? 1 : 0); set(0, M.translate(d.pos.x, d.pos.y, d.pos.z)); }
        else if (d.kind === 'venom') { m = this.depModel('venom'); set(0, M.translate(d.pos.x, d.pos.y, d.pos.z)); }
        else if (d.kind === 'field') { m = this.depModel('field'); set(0, M.translate(d.pos.x, d.pos.y, d.pos.z)); }
        else if (d.kind === 'bubble') { m = this.depModel('bubble'); set(0, M.translate(d.pos.x, d.pos.y, d.pos.z)); }
        else if (d.kind === 'pack') { m = this.depModel('pack'); set(0, M.mul(M.translate(d.pos.x, d.pos.y, d.pos.z), M.rotY(t))); }
        else if (d.kind === 'scrap') { m = this.depModel('scrap'); set(0, M.translate(d.pos.x, d.pos.y, d.pos.z)); }
        else if (d.kind === 'tire') { m = this.depModel('tire'); set(0, M.mul(M.mul(M.translate(d.pos.x, d.pos.y, d.pos.z), M.rotY(d.yaw || 0)), M.mul(M.translate(0, 0.55, 0), M.mul(M.rotX(d.spin || 0), M.translate(0, -0.55, 0))))); }
        if (m) this.drawModel(m, mats);
      }
      for (const p of scene.proj || []) {
        if (p.kind === 'mine' && p.stuckTo !== undefined) {
          const m = this.depModel('mine');
          set(0, M.translate(p.pos.x, p.pos.y - 0.1, p.pos.z));
          this.drawModel(m, mats);
        } else if (p.kind === 'bomb' && p.stuckTo !== undefined) {
          const m = this.depModel('bomb');
          set(0, M.mul(M.translate(p.pos.x, p.pos.y, p.pos.z), M.rotY(t * 4)));
          this.drawModel(m, mats);
        }
      }
    }

    fpState(h, scene, st, a) {
      const cam = scene.cam;
      const f = this.fp || (this.fp = { t: scene.t, yaw: cam.yaw, pitch: cam.pitch, sx: 0, sy: 0, srx: 0, sry: 0, vx: 0, vy: 0, vrx: 0, vry: 0, land: 0, vland: 0, roll: 0, air: 0, crouch: 0, sprint: 0, equipT: -9, id: null, hero: null, weapon: 0, alive: false, landT: 9 });
      const dt = Math.max(0, Math.min(0.05, scene.t - f.t));
      f.t = scene.t;
      if (f.id !== h.id) { f.equipT = -9; f.landT = a ? a.landT : 9; f.yaw = cam.yaw; f.pitch = cam.pitch; }
      else if (f.hero !== h.heroId || !f.alive || f.weapon !== st.weapon) { f.equipT = scene.t; f.landT = a ? a.landT : 9; }
      f.id = h.id; f.hero = h.heroId; f.alive = true; f.weapon = st.weapon;
      const dyaw = O.angDiff(f.yaw, cam.yaw), dpitch = cam.pitch - f.pitch;
      f.yaw = cam.yaw; f.pitch = cam.pitch;
      if (dt > 0) {
        const wy = O.clamp(dyaw / dt, -9, 9), wp = O.clamp(dpitch / dt, -9, 9);
        const tx = wy * 0.0042, ty = -wp * 0.0036, trx = -wp * 0.016, try_ = -wy * 0.02;
        const n = Math.max(1, Math.ceil(dt / 0.008)), h2 = dt / n;
        for (let i = 0; i < n; i++) {
          f.vx += (130 * (tx - f.sx) - 17 * f.vx) * h2; f.sx += f.vx * h2;
          f.vy += (130 * (ty - f.sy) - 17 * f.vy) * h2; f.sy += f.vy * h2;
          f.vrx += (110 * (trx - f.srx) - 15 * f.vrx) * h2; f.srx += f.vrx * h2;
          f.vry += (110 * (try_ - f.sry) - 15 * f.vry) * h2; f.sry += f.vry * h2;
          f.vland += (-160 * f.land - 15 * f.vland) * h2; f.land += f.vland * h2;
        }
        f.sx = O.clamp(f.sx, -0.05, 0.05); f.sy = O.clamp(f.sy, -0.04, 0.04);
        if (a && a.landT < f.landT && a.landT < 0.05) f.vland -= O.clamp(a.landV * 0.045, 0.08, 0.6);
        if (a) f.landT = a.landT;
        const k = r => 1 - Math.exp(-dt * r);
        f.roll += (O.clamp((a ? a.ll : 0) * 0.011, -0.07, 0.07) - f.roll) * k(8);
        f.air += ((st.air ? -O.clamp((a ? a.vy : 0) / 8, -1, 1) : 0) - f.air) * k(9);
        f.crouch += ((st.crouch ? 1 : 0) - f.crouch) * k(10);
        f.sprint += ((st.sprint ? 1 : 0) - f.sprint) * k(9);
      }
      f.equip = Math.max(0, Math.min(1, (scene.t - f.equipT) / 0.42));
      return f;
    }

    drawViewModel(h, scene, t) {
      const gl = this.gl;
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const c = this.cam;
      const proj = M4.perspective(1.2, c.aspect, 0.02, 10);
      const vp = M4.mul(proj, c.view);
      const camWorld = c.world;
      const m = this.viewModel(h.heroId, h.skin || 'classic');
      const a = this.animState(h, t);
      const st = this.heroState(h, t, a);
      st.onGround = !st.air;
      st.fp = this.fpState(h, scene, st, a);
      const VB = O.Anim.VB;
      const loc = this.vmLoc || (this.vmLoc = new Float32Array(VB * 16));
      O.Anim.view(h.heroId, st, loc);
      const out = this.vmOut || (this.vmOut = new Float32Array(15 * 16));
      for (let i = 0; i < VB; i++) out.set(M4.mul(camWorld, loc.subarray(i * 16, i * 16 + 16)), i * 16);
      this.modelProg(vp, c);
      gl.uniform2f(this.pm.u.uFog, 1e5, 1e6);
      this.drawModel(m, out, scene.vmTint ? { tint: scene.vmTint } : {});
      this.vmCamWorld = camWorld;
      const mz = VM_MUZZLE[h.heroId];
      const since = t - (st.shotT === undefined ? -9 : st.shotT);
      if (mz && since >= 0 && since < 0.055 && (mz.weapon === undefined || (st.weapon || 0) === mz.weapon)) {
        const m0 = h.heroId === 'tracer' && (h.vis && h.vis.side || 1) < 0 && mz.l ? mz.l : mz.r;
        const p = M4.point(out.subarray(m0[0] * 16, m0[0] * 16 + 16), m0[1], m0[2], m0[3]);
        this.drawFlash(vp, p, O.FX_TRACER[h.heroId] || [1, 0.85, 0.5], mz.s * (h.vis && h.vis.big && h.heroId === 'widowmaker' ? 1.7 : 1), since / 0.055);
      }
    }

    drawFlash(vp, p, c, s, k) {
      const gl = this.gl, pr = this.pf, T = O.FXT;
      const arr = this.flashArr || (this.flashArr = new Float32Array(9 * 6 * 4));
      const R = this.cam.right, U = this.cam.up;
      const a = 1 - k;
      let o = 0;
      const quad = (sz, tex, col, r) => {
        const cs = Math.cos(r), sn = Math.sin(r);
        const rx = (R[0] * cs + U[0] * sn) * sz, ry = (R[1] * cs + U[1] * sn) * sz, rz = (R[2] * cs + U[2] * sn) * sz;
        const ux = (U[0] * cs - R[0] * sn) * sz, uy = (U[1] * cs - R[1] * sn) * sz, uz = (U[2] * cs - R[2] * sn) * sz;
        o = this.fxQuad(arr, o, [p[0] - rx - ux, p[1] - ry - uy, p[2] - rz - uz], [p[0] + rx - ux, p[1] + ry - uy, p[2] + rz - uz], [p[0] + rx + ux, p[1] + ry + uy, p[2] + rz + uz], [p[0] - rx + ux, p[1] - ry + uy, p[2] - rz + uz], this.cell(tex), col);
      };
      const rot = Math.random() * 6.28;
      quad(s * 1.8, T.soft, [c[0], c[1], c[2], 0.4 * a], 0);
      quad(s * (0.8 + Math.random() * 0.45), T.flare, [0.4 + c[0] * 0.6, 0.4 + c[1] * 0.6, 0.4 + c[2] * 0.6, a], rot);
      quad(s * 0.4, T.star, [1, 1, 1, a * 0.9], rot * 1.7);
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, vp);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fxTex); gl.uniform1i(pr.u.uTex, 0);
      gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
      gl.bufferData(gl.ARRAY_BUFFER, arr.subarray(0, o), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
      gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4);
      gl.drawArrays(gl.TRIANGLES, 0, o / 9);
      gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    }

    drawXray(scene, t) {
      const gl = this.gl;
      const viewer = scene.viewer;
      if (!viewer) return;
      gl.depthFunc(gl.GREATER);
      gl.depthMask(false);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      this.modelProg();
      gl.uniform1f(this.pm.u.uGlow, 0);
      gl.uniform2f(this.pm.u.uFog, 1e5, 1e6);
      for (const h of scene.heroes) {
        if (!h.alive || !h.heroId || h === viewer) continue;
        const ally = h.team === viewer.team;
        const revealed = !ally && ((scene.infra && scene.infra[viewer.team] > scene.gt) || (h.st && h.st.revealed > 0));
        if (!ally && !revealed) continue;
        this.drawHero(h, t, { flat: true, tint: ally ? [0.35, 0.7, 1, 1] : [1, 0.25, 0.2, 1], alpha: ally ? 0.45 : 0.6 });
      }
      gl.depthFunc(gl.LEQUAL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    fxQuad(arr, o, p0, p1, p2, p3, uvr, c) {
      const u0 = uvr[0], v0 = uvr[1], u1 = uvr[2], v1 = uvr[3];
      const put = (p, u, v) => { arr[o++] = p[0]; arr[o++] = p[1]; arr[o++] = p[2]; arr[o++] = u; arr[o++] = v; arr[o++] = c[0]; arr[o++] = c[1]; arr[o++] = c[2]; arr[o++] = c[3]; };
      put(p0, u0, v1); put(p1, u1, v1); put(p2, u1, v0);
      put(p0, u0, v1); put(p2, u1, v0); put(p3, u0, v0);
      return o;
    }

    cell(i) { const x = (i % 4) * 0.25, y = Math.floor(i / 4) * 0.25; return [x + 0.004, y + 0.004, x + 0.246, y + 0.246]; }

    buildFx(scene, t, additive) {
      const arr = this.fxArr;
      let o = 0;
      const R = this.cam.right, U = this.cam.up;
      const lim = arr.length - 60;
      const bill = (x, y, z, s, tex, c, rot) => {
        if (o > lim) return;
        let rx = R[0] * s, ry = R[1] * s, rz = R[2] * s, ux = U[0] * s, uy = U[1] * s, uz = U[2] * s;
        if (rot) { const cs = Math.cos(rot), sn = Math.sin(rot); const ax = rx * cs + ux * sn, ay = ry * cs + uy * sn, az = rz * cs + uz * sn; ux = ux * cs - rx * sn; uy = uy * cs - ry * sn; uz = uz * cs - rz * sn; rx = ax; ry = ay; rz = az; }
        o = this.fxQuad(arr, o, [x - rx - ux, y - ry - uy, z - rz - uz], [x + rx - ux, y + ry - uy, z + rz - uz], [x + rx + ux, y + ry + uy, z + rz + uz], [x - rx + ux, y - ry + uy, z - rz + uz], this.cell(tex), c);
      };
      const flat = (x, y, z, s, tex, c) => { if (o > lim) return; o = this.fxQuad(arr, o, [x - s, y, z - s], [x + s, y, z - s], [x + s, y, z + s], [x - s, y, z + s], this.cell(tex), c); };
      const line = (x0, y0, z0, x1, y1, z1, w, tex, c, mid) => {
        if (o > lim) return;
        const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
        const mx = (x0 + x1) / 2 - this.cam.x, my = (y0 + y1) / 2 - this.cam.y, mz = (z0 + z1) / 2 - this.cam.z;
        let sx = dy * mz - dz * my, sy = dz * mx - dx * mz, sz = dx * my - dy * mx;
        const l = Math.hypot(sx, sy, sz) || 1;
        sx = sx / l * w; sy = sy / l * w; sz = sz / l * w;
        const cl = this.cell(tex);
        const du = mid ? (cl[2] - cl[0]) * 0.22 : 0;
        o = this.fxQuad(arr, o, [x0 - sx, y0 - sy, z0 - sz], [x1 - sx, y1 - sy, z1 - sz], [x1 + sx, y1 + sy, z1 + sz], [x0 + sx, y0 + sy, z0 + sz], [cl[0] + du, cl[1], cl[2] - du, cl[3]], c);
      };
      const orient = (x, y, z, n, s, tex, c, rot) => {
        if (o > lim) return;
        let ux = 1, uy = 0, uz = 0;
        if (Math.abs(n[1]) < 0.9) { const l = Math.hypot(n[2], n[0]) || 1; ux = n[2] / l; uz = -n[0] / l; }
        const vx = n[1] * uz - n[2] * uy, vy = n[2] * ux - n[0] * uz, vz = n[0] * uy - n[1] * ux;
        const cs = Math.cos(rot) * s, sn = Math.sin(rot) * s;
        const ax = ux * cs + vx * sn, ay = uy * cs + vy * sn, az = uz * cs + vz * sn;
        const bx = vx * cs - ux * sn, by = vy * cs - uy * sn, bz = vz * cs - uz * sn;
        o = this.fxQuad(arr, o, [x - ax - bx, y - ay - by, z - az - bz], [x + ax - bx, y + ay - by, z + az - bz], [x + ax + bx, y + ay + by, z + az + bz], [x - ax + bx, y - ay + by, z - az + bz], this.cell(tex), c);
      };
      const part = p => {
        const k = p.age / p.life;
        const s = p.s0 + (p.s1 - p.s0) * k;
        const a = p.a0 * (1 - k) * (p.add ? 1 : Math.min(1, k * 5 + 0.25));
        const cc = p.c1 ? [p.c[0] + (p.c1[0] - p.c[0]) * k, p.c[1] + (p.c1[1] - p.c[1]) * k, p.c[2] + (p.c1[2] - p.c[2]) * k, a] : [p.c[0], p.c[1], p.c[2], a];
        if (p.streak) line(p.x - p.vx * p.streak, p.y - p.vy * p.streak, p.z - p.vz * p.streak, p.x, p.y, p.z, s, p.tex, cc);
        else if (p.flat) flat(p.x, p.y, p.z, s, p.tex, cc);
        else bill(p.x, p.y, p.z, s, p.tex, cc, p.rot || 0);
      };
      const T = O.FXT;
      const viewer = scene.viewer;
      const myTeam = viewer ? viewer.team : 0;
      const tcol = team => team === myTeam ? [0.35, 0.7, 1] : [1, 0.3, 0.25];
      if (additive) {
        for (const d of this.parts.decals) {
          if (!d.add || d.age < 0) continue;
          const k = d.age / d.life;
          orient(d.x, d.y, d.z, d.n, d.s, d.tex, [d.c[0], d.c[1], d.c[2], d.a0 * (1 - k)], d.rot);
        }
        for (const p of this.parts.list) if (p.add && p.age >= 0) part(p);
        for (const l of this.parts.lines) {
          const k = l.age / l.life;
          line(l.x0, l.y0, l.z0, l.x1, l.y1, l.z1, l.w * (1 - k * 0.5), l.tex, [l.c[0], l.c[1], l.c[2], l.a0 * (1 - k)]);
        }
        for (const s of this.parts.shots) {
          if (s.age < 0) continue;
          const c = s.c;
          if (s.beam) {
            const k = s.age / s.life, a = (1 - k) * (1 - k) * s.a;
            line(s.x0, s.y0, s.z0, s.x1, s.y1, s.z1, s.w * (2.6 + k * 3), T.bolt, [c[0], c[1], c[2], a * 0.5], true);
            line(s.x0, s.y0, s.z0, s.x1, s.y1, s.z1, s.w * Math.max(0.2, 0.9 - k * 0.7), T.bolt, [0.5 + c[0] * 0.5, 0.5 + c[1] * 0.5, 0.5 + c[2] * 0.5, a], true);
            continue;
          }
          const head = Math.min(s.dist, s.age * s.speed), tail = Math.max(0, head - s.len);
          if (tail >= s.dist - 0.01) continue;
          const hx = s.x0 + s.dx * head, hy = s.y0 + s.dy * head, hz = s.z0 + s.dz * head;
          const tx = s.x0 + s.dx * tail, ty = s.y0 + s.dy * tail, tz = s.z0 + s.dz * tail;
          line(tx, ty, tz, hx, hy, hz, s.w * 2.6, T.streak, [c[0], c[1], c[2], 0.6 * s.a]);
          line(tx, ty, tz, hx, hy, hz, s.w * 0.85, T.streak, [0.3 + c[0] * 0.7, 0.3 + c[1] * 0.7, 0.3 + c[2] * 0.7, s.a]);
          if (s.bolt && head < s.dist) bill(hx, hy, hz, s.w * 3.2, T.soft, [c[0], c[1], c[2], 0.9 * s.a]);
        }
        for (const p of scene.proj || []) {
          const d = O.FX_PROJ[p.kind];
          if (!d || d.blend === 'alpha') continue;
          if ((p.kind === 'bomb' || p.kind === 'mine') && p.stuckTo !== undefined) {
            if (Math.sin(t * 20) > 0) bill(p.pos.x, p.pos.y + 0.05, p.pos.z, 0.25, T.soft, [0.5, 0.85, 1, 1]);
            continue;
          }
          bill(p.pos.x, p.pos.y, p.pos.z, d.s, T.soft, [d.c[0], d.c[1], d.c[2], 1]);
          if (p.kind === 'orb') bill(p.pos.x, p.pos.y, p.pos.z, d.s * 0.5, T.star, [1, 1, 0.8, 1], t * 5);
          if (p.kind === 'strike') { for (let i = 0; i < 4; i++) bill(p.pos.x - p.vel.x * 0.02 * i, p.pos.y, p.pos.z - p.vel.z * 0.02 * i, d.s * (1 - i * 0.2), T.flame, [1, 0.5, 0.15, 0.8], i); }
          const vl = p.vel ? Math.hypot(p.vel.x, p.vel.y, p.vel.z) : 0;
          if (vl > 20 && p.kind !== 'strike') line(p.pos.x - p.vel.x * 0.03, p.pos.y - p.vel.y * 0.03, p.pos.z - p.vel.z * 0.03, p.pos.x, p.pos.y, p.pos.z, d.s * 0.45, T.streak, [d.c[0], d.c[1], d.c[2], 0.8]);
        }
        for (const d of scene.deploy || []) {
          if (d.kind === 'field') {
            flat(d.pos.x, d.pos.y + 0.05, d.pos.z, 5, T.ring, [1, 0.85, 0.3, 0.5 + 0.2 * Math.sin(t * 6)]);
            if (Math.random() < 0.3) this.parts.add({ x: d.pos.x + (Math.random() - 0.5) * 8, y: d.pos.y + 0.2, z: d.pos.z + (Math.random() - 0.5) * 8, vx: 0, vy: 1.5, vz: 0, g: 0, life: 0.8, age: 0, s0: 0.15, s1: 0, c: [1, 0.85, 0.3], a0: 1, tex: T.cross, add: true });
          } else if (d.kind === 'venom') bill(d.pos.x, d.pos.y + 0.2, d.pos.z, 0.2, T.soft, [0.9, 0.3, 1, 0.6 + 0.4 * Math.sin(t * 5)]);
        }
        for (const b of scene.barriers || []) o = this.barrierFx(b, tcol(b.team), o);
        for (const h of scene.heroes) {
          if (!h.alive || !h.heroId) continue;
          const beams = (h.vis && h.vis.beams) || [];
          if (beams.length) {
            const e = { x: h.pos.x, y: h.pos.y + h.eyeH * 0.85, z: h.pos.z };
            const fwd = O.dir(h.yaw, h.pitch);
            const rx = -Math.cos(h.yaw), rz = Math.sin(h.yaw);
            const fp = viewer === h && scene.fp;
            const sx = e.x + fwd.x * (fp ? 1.0 : 0.7) + rx * (fp ? 0.28 : 0.25), sy = e.y + fwd.y * 0.8 - (fp ? 0.1 : 0.05), sz = e.z + fwd.z * (fp ? 1.0 : 0.7) + rz * (fp ? 0.28 : 0.25);
            for (const bm of beams) {
              let tx, ty, tz;
              if (bm.to !== undefined) { const tg = scene.heroes.find(x => x.id === bm.to); if (!tg) continue; tx = tg.pos.x; ty = tg.pos.y + tg.h * 0.6; tz = tg.pos.z; }
              else { tx = bm.x; ty = bm.y; tz = bm.z; }
              if (bm.kind === 'tesla') {
                let px = sx, py = sy, pz = sz;
                const n = 6;
                for (let i = 1; i <= n; i++) {
                  const f = i / n;
                  const jx = i < n ? (Math.random() - 0.5) * 0.5 : 0, jy = i < n ? (Math.random() - 0.5) * 0.5 : 0, jz = i < n ? (Math.random() - 0.5) * 0.5 : 0;
                  const nx = sx + (tx - sx) * f + jx, ny = sy + (ty - sy) * f + jy, nz = sz + (tz - sz) * f + jz;
                  line(px, py, pz, nx, ny, nz, 0.06, T.beam, [0.6, 0.85, 1, 1]);
                  px = nx; py = ny; pz = nz;
                }
                bill(tx, ty, tz, 0.4, T.star, [0.6, 0.85, 1, 0.8], t * 9);
              } else {
                const c = bm.kind === 'boost' ? [0.4, 0.7, 1] : [1, 0.85, 0.3];
                const n = 8;
                let px = sx, py = sy, pz = sz;
                for (let i = 1; i <= n; i++) {
                  const f = i / n;
                  const arc = Math.sin(f * PI) * 0.4;
                  const nx = sx + (tx - sx) * f, ny = sy + (ty - sy) * f + arc, nz = sz + (tz - sz) * f;
                  line(px, py, pz, nx, ny, nz, 0.07, T.beam, [c[0], c[1], c[2], 0.9]);
                  px = nx; py = ny; pz = nz;
                }
                bill(sx, sy, sz, 0.18, T.soft, [c[0], c[1], c[2], 1]);
              }
            }
          }
          if (h.st && h.st.harmony > 0) bill(h.pos.x, h.pos.y + h.h + 0.35 + Math.sin(t * 3) * 0.05, h.pos.z, 0.22, T.soft, [1, 0.85, 0.3, 1]);
          if (h.st && h.st.discord > 0) bill(h.pos.x, h.pos.y + h.h + 0.35 + Math.sin(t * 3) * 0.05, h.pos.z, 0.22, T.soft, [0.85, 0.3, 1, 1]);
          if (h.st && h.st.boost > 0) bill(h.pos.x, h.pos.y + h.h * 0.5, h.pos.z, 0.9, T.halo, [0.4, 0.7, 1, 0.25]);
          if (h.temp > 0) bill(h.pos.x, h.pos.y + h.h * 0.5, h.pos.z, 1.1, T.halo, [0.5, 1, 0.4, 0.35]);
          if (h.ultOn === 'trans') bill(h.pos.x, h.pos.y + h.h * 0.6, h.pos.z, 2.2, T.halo, [1, 0.9, 0.5, 0.45]);
          if (h.ultOn === 'molten') bill(h.pos.x, h.pos.y + h.h * 0.5, h.pos.z, 1.2, T.soft, [1, 0.45, 0.1, 0.25]);
          if (h.ultOn === 'rage') bill(h.pos.x, h.pos.y + h.h * 0.5, h.pos.z, 1.8, T.halo, [0.6, 0.8, 1, 0.3]);
          const pf = PROJ_FLASH[h.heroId];
          const shotAt = Math.max(h.vis && h.vis.shotT || -9, h.vis && h.vis.shot2T || -9);
          if (pf && this.gt - shotAt >= 0 && this.gt - shotAt < 0.06 && !(viewer === h && scene.fp) && (h.heroId !== 'mercy' || (h.vis && h.vis.weapon) === 1)) {
            const f = O.dir(h.yaw, h.pitch);
            const mx = h.pos.x + f.x * 0.75 - Math.cos(h.yaw) * 0.22, my = h.pos.y + h.eyeH * 0.82 + f.y * 0.75, mz = h.pos.z + f.z * 0.75 + Math.sin(h.yaw) * 0.22;
            bill(mx, my, mz, 0.26, T.flare, [pf[0], pf[1], pf[2], 1], t * 37);
            bill(mx, my, mz, 0.5, T.soft, [pf[0], pf[1], pf[2], 0.45]);
          }
          if (h.heroId === 'lucio' && h.vis && h.vis.song) {
            const c = h.vis.song === 'heal' ? [1, 0.85, 0.2] : [0.4, 1, 0.3];
            flat(h.pos.x, h.pos.y + 0.06, h.pos.z, h.vis.amp ? 1.6 : 1.1, T.ring, [c[0], c[1], c[2], 0.5]);
          }
        }
        for (const pt of scene.points || []) {
          const segs = 32, c = pt.col;
          for (let i = 0; i < segs; i++) {
            const a0 = i / segs * PI * 2, a1 = (i + 1) / segs * PI * 2;
            const on = i / segs < (pt.prog || 0);
            const cc = on ? pt.progCol || c : c;
            const r0 = pt.r - 0.18, r1 = pt.r + 0.18;
            if (o > lim) break;
            o = this.fxQuad(arr, o, [pt.x + Math.cos(a0) * r0, pt.y + 0.06, pt.z + Math.sin(a0) * r0], [pt.x + Math.cos(a1) * r0, pt.y + 0.06, pt.z + Math.sin(a1) * r0], [pt.x + Math.cos(a1) * r1, pt.y + 0.06, pt.z + Math.sin(a1) * r1], [pt.x + Math.cos(a0) * r1, pt.y + 0.06, pt.z + Math.sin(a0) * r1], this.cell(T.beam), [cc[0], cc[1], cc[2], on ? 0.95 : 0.55]);
          }
          flat(pt.x, pt.y + 0.04, pt.z, pt.r, T.soft, [c[0], c[1], c[2], 0.12]);
        }
      } else {
        for (const d of this.parts.decals) {
          if (d.add || d.age < 0) continue;
          const left = d.life - d.age;
          orient(d.x, d.y, d.z, d.n, d.s, d.tex, [d.c[0], d.c[1], d.c[2], d.a0 * Math.min(1, left / (d.life * 0.3))], d.rot);
        }
        for (const h of scene.heroes) {
          if (!h.alive || !h.heroId) continue;
          const gy = h.groundY !== undefined && h.groundY > -1e8 && h.pos.y - h.groundY < 6 ? h.groundY : h.pos.y;
          const s = h.r * 1.5 * Math.max(0.4, 1 - (h.pos.y - gy) * 0.15);
          flat(h.pos.x, gy + 0.04, h.pos.z, s, T.shadow, [1, 1, 1, 0.55]);
        }
        for (const p of this.parts.list) if (!p.add && p.age >= 0) part(p);
        for (const p of scene.proj || []) {
          const d = O.FX_PROJ[p.kind];
          if (!d || d.blend !== 'alpha') continue;
          if (p.kind === 'mine' && p.stuckTo !== undefined) continue;
          bill(p.pos.x, p.pos.y, p.pos.z, d.s * 0.5, T.soft, [d.c[0], d.c[1], d.c[2], 1]);
          if (d.glow) bill(p.pos.x, p.pos.y + 0.05, p.pos.z, 0.1, T.soft, [d.glow[0], d.glow[1], d.glow[2], 1]);
          if (p.kind === 'hook') {
            const own = scene.heroes.find(x => x.id === p.owner);
            if (own) line(own.pos.x, own.pos.y + own.eyeH * 0.75, own.pos.z, p.pos.x, p.pos.y, p.pos.z, 0.05, T.beam, [0.35, 0.35, 0.38, 1]);
          }
        }
        for (const h of scene.heroes) {
          if (h.heroId === 'roadhog' && h.k && h.k.pull) {
            const tg = scene.heroes.find(x => x.id === h.k.pull.id);
            if (tg) line(h.pos.x, h.pos.y + h.eyeH * 0.75, h.pos.z, tg.pos.x, tg.pos.y + tg.h * 0.6, tg.pos.z, 0.05, T.beam, [0.35, 0.35, 0.38, 1]);
          }
        }
      }
      return o;
    }

    barrierFx(b, col, o) {
      const arr = this.fxArr;
      const hpk = Math.max(0.25, Math.min(1, b.hp / (b.kind === 'rect' ? 2000 : 600)));
      const c = [col[0], col[1], col[2], 0.28 + 0.2 * hpk];
      const cl = this.cell(O.FXT.hex);
      if (b.kind === 'rect') {
        const segs = 8, rx = -b.nz, rz = b.nx;
        for (let i = 0; i < segs; i++) {
          const f0 = i / segs - 0.5, f1 = (i + 1) / segs - 0.5;
          const bend0 = -Math.cos(f0 * PI) * 0.6 + 0.6, bend1 = -Math.cos(f1 * PI) * 0.6 + 0.6;
          const x0 = b.x + rx * f0 * b.w - b.nx * bend0 * 0.6, z0 = b.z + rz * f0 * b.w - b.nz * bend0 * 0.6;
          const x1 = b.x + rx * f1 * b.w - b.nx * bend1 * 0.6, z1 = b.z + rz * f1 * b.w - b.nz * bend1 * 0.6;
          const u0 = cl[0] + (cl[2] - cl[0]) * (i / segs), u1 = cl[0] + (cl[2] - cl[0]) * ((i + 1) / segs);
          o = this.fxQuad(arr, o, [x0, b.y0, z0], [x1, b.y0, z1], [x1, b.y1, z1], [x0, b.y1, z0], [u0, cl[1], u1, cl[3]], c);
        }
      } else {
        const lat = 6, lon = 12;
        for (let i = 0; i < lat; i++) for (let j = 0; j < lon; j++) {
          const p = (a, bb) => { const th = a / lat * PI * 0.55, ph = bb / lon * PI * 2; return [b.x + Math.sin(th) * Math.cos(ph) * b.r, b.y - 0.4 + Math.cos(th) * b.r, b.z + Math.sin(th) * Math.sin(ph) * b.r]; };
          o = this.fxQuad(arr, o, p(i, j), p(i, j + 1), p(i + 1, j + 1), p(i + 1, j), cl, c);
        }
      }
      return o;
    }

    drawFx(scene, t) {
      const gl = this.gl, p = this.pf;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, this.cam.vp);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.fxTex); gl.uniform1i(p.u.uTex, 0);
      gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
      for (const additive of [false, true]) {
        const n = this.buildFx(scene, t, additive);
        if (!n) continue;
        if (additive) gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        else gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE_MINUS_SRC_ALPHA);
        gl.bufferData(gl.ARRAY_BUFFER, this.fxArr.subarray(0, n), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12);
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
        gl.drawArrays(gl.TRIANGLES, 0, n / 9);
      }
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    }

    addSpray(sp) {
      this.sprays = this.sprays || [];
      const tex = this.texture(sp.art, { repeat: false, mip: false, clampT: true });
      this.sprays.push({ sp, tex });
      if (this.sprays.length > 12) { const old = this.sprays.shift(); this.gl.deleteTexture(old.tex); }
    }

    drawSprays() {
      if (!this.sprays || !this.sprays.length) return;
      const gl = this.gl, p = this.pf;
      gl.useProgram(p.p);
      gl.uniformMatrix4fv(p.u.uVP, false, this.cam.vp);
      gl.uniform1i(p.u.uTex, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.fxBuf);
      gl.disableVertexAttribArray(3); gl.disableVertexAttribArray(4);
      for (const { sp, tex } of this.sprays) {
        const n = [sp.nx, sp.ny, sp.nz];
        let u = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [n[2], 0, -n[0]];
        const ul = Math.hypot(...u) || 1; u = u.map(v => v / ul);
        const v = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
        const s = 0.7, c = [sp.x + n[0] * 0.02, sp.y + n[1] * 0.02, sp.z + n[2] * 0.02];
        const P = (a, b) => [c[0] + u[0] * a * s + v[0] * b * s, c[1] + u[1] * a * s + v[1] * b * s, c[2] + u[2] * a * s + v[2] * b * s];
        const arr = new Float32Array(54);
        this.fxQuad(arr, 0, P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), [0, 0, 1, 1], [1, 1, 1, 0.95]);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.bufferData(gl.ARRAY_BUFFER, arr, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0);
        gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12);
        gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
    }

    ambient(scene, dt) {
      const W = this.world;
      const c = this.cam || scene.cam;
      if (!W || !c) return;
      for (const p of scene.proj || []) this.parts.trail(p, dt);
      if (W.petals && Math.random() < dt * 20) this.parts.add({ x: c.x + (Math.random() - 0.5) * 30, y: c.y + 6 + Math.random() * 4, z: c.z + (Math.random() - 0.5) * 30, vx: 0.6, vy: -0.8, vz: 0.3, g: 0, life: 7, age: 0, s0: 0.06, s1: 0.06, c: [1, 0.72, 0.82], a0: 1, tex: O.FXT.soft, add: false });
      if (W.snow && Math.random() < dt * 60) this.parts.add({ x: c.x + (Math.random() - 0.5) * 30, y: c.y + 8, z: c.z + (Math.random() - 0.5) * 30, vx: 0.3, vy: -1.2, vz: 0.1, g: 0, life: 7, age: 0, s0: 0.05, s1: 0.05, c: [1, 1, 1], a0: 0.9, tex: O.FXT.soft, add: false });
      if (W.rain) for (let i = Math.round(dt * 160 + Math.random()); i > 0; i--) this.parts.add({ x: c.x + (Math.random() - 0.5) * 26, y: c.y + 7 + Math.random() * 3, z: c.z + (Math.random() - 0.5) * 26, vx: 0.8, vy: -15, vz: 0.4, g: 0, life: 0.9, age: 0, s0: 0.012, s1: 0.012, c: [0.72, 0.78, 0.9], a0: 0.5, tex: O.FXT.streak, add: false, streak: 0.045 });
      if (W.confetti && Math.random() < dt * 15) this.parts.add({ x: c.x + (Math.random() - 0.5) * 24, y: c.y + 5, z: c.z + (Math.random() - 0.5) * 24, vx: 0.2, vy: -0.6, vz: 0.2, g: 0, life: 7, age: 0, s0: 0.07, s1: 0.07, c: [[1, 0.3, 0.4], [1, 0.8, 0.2], [0.3, 0.7, 1], [0.4, 0.9, 0.4]][Math.random() * 4 | 0], a0: 1, tex: O.FXT.soft, add: false });
    }

    portrait(heroId, skin, size, o = {}) {
      const gl = this.gl;
      const w = size, h = size;
      const fb = gl.createFramebuffer();
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      const rb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE);
      const def = O.HEROES[heroId];
      const m = this.heroModel(heroId, skin);
      const S = m.S;
      const full = o.full;
      const st = { t: o.t || 0, x: 0, y: 0, z: 0, yaw: 0, pitch: 0, move: 0, phase: 0, pose: o.pose || null, rest: !full && !o.pose, noWeapon: !full && !o.pose, idle: full && !o.pose };
      if (o.pose && o.t === undefined) { const cl = O.Clips.get(heroId, o.pose); st.t = cl ? O.Clips.iconT(cl) : 0.4; }
      const world = O.Anim.heroBones(heroId, S, st, this.bones);
      const props = O.Anim.props(heroId, S, st, world);
      const frame = PORTRAIT[heroId] || {};
      const head = M4.point(this.bones.subarray(O.BONES.HEAD * 16, O.BONES.HEAD * 16 + 16), 0, S.head, 0);
      const cx = full ? 0 : head[0], cy = full ? def.h * 0.52 + (heroId === 'zenyatta' ? 0.2 : 0) : head[1] - S.headR * (frame.drop === undefined ? 0.45 : frame.drop), cz = full ? 0 : head[2];
      const dist = full ? def.h * 1.55 : S.headR * (frame.dist || 7.2);
      const yaw = o.yaw === undefined ? (frame.yaw === undefined ? 0.32 : frame.yaw) : o.yaw;
      const ex = cx + Math.sin(yaw) * dist, ez = cz + Math.cos(yaw) * dist, ey = cy + (full ? 0.15 : S.headR * 0.35);
      const proj = M4.perspective(full ? 0.9 : 0.62, w / h, 0.05, 50);
      const view = M4.lookAt(ex, ey, ez, cx, cy, cz);
      const vp = M4.mul(proj, view);
      const W = this.world;
      this.world = null;
      this.modelProg(vp, { x: ex, y: ey, z: ez });
      this.world = W;
      const gp = this.pm;
      gl.uniform3fv(gp.u.uSun, [-0.35, 0.7, 0.62]);
      gl.uniform3fv(gp.u.uSunCol, [0.9, 0.86, 0.8]);
      gl.uniform3fv(gp.u.uAmb, [0.52, 0.55, 0.64]);
      gl.uniform2f(gp.u.uFog, 1e5, 1e6);
      this.drawModel(m, this.bones, o.flat ? { flat: true, tint: o.flat } : {});
      this.drawProps(props, o.flat ? { flat: true, tint: o.flat } : {});
      const px = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.deleteFramebuffer(fb); gl.deleteTexture(tex); gl.deleteRenderbuffer(rb);
      gl.viewport(0, 0, this.w, this.h);
      const c = O.Tex.canvas(w, h);
      const ctx = c.getContext('2d');
      const img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
      ctx.putImageData(img, 0, 0);
      return c;
    }
  }
  O.Renderer = Renderer;
})(globalThis.Ow98 = globalThis.Ow98 || {});
