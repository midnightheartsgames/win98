(function (M) {
  'use strict';
  const { Program, Mesh, Target, mat4 } = M.GL;

  const WORLD_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec2 aUv; layout(location=3) in vec2 aLm;
uniform mat4 uVP;
out vec3 vPos; out vec3 vNrm; out vec2 vUv; out vec2 vLm;
void main(){ vPos=aPos; vNrm=aNrm; vUv=aUv; vLm=aLm; gl_Position=uVP*vec4(aPos,1.0); }`;
  const LIGHTS_GLSL = `
uniform vec4 uDL[8]; uniform vec3 uDC[8]; uniform int uDN;
vec3 dyn(vec3 p, vec3 n){ vec3 s=vec3(0.0); for(int i=0;i<8;i++){ if(i>=uDN) break; vec3 L=uDL[i].xyz-p; float d=length(L); float a=clamp(1.0-d/uDL[i].w,0.0,1.0); s+=uDC[i]*a*a*(max(0.0,dot(n,L/max(d,0.001)))*0.8+0.2); } return s; }`;
  const WORLD_FS = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNrm; in vec2 vUv; in vec2 vLm;
uniform sampler2D uTex; uniform sampler2D uLm; uniform sampler2D uEmit;
uniform vec3 uCam; uniform vec3 uFogC; uniform vec2 uFog;
uniform float uEmissive; uniform float uAlphaTest; uniform float uHasEmit; uniform float uLmOn;
${LIGHTS_GLSL}
out vec4 o;
void main(){
  vec4 t=texture(uTex,vUv);
  if(t.a<uAlphaTest) discard;
  vec3 lm=uLmOn>0.5?texture(uLm,vLm).rgb*2.0:vec3(0.6);
  vec3 n=normalize(vNrm);
  vec3 c=t.rgb*(lm+dyn(vPos,n));
  c=mix(c,t.rgb*1.1,uEmissive);
  if(uHasEmit>0.5) c+=texture(uEmit,vUv).rgb*0.85;
  float f=smoothstep(uFog.x,uFog.y,distance(vPos,uCam));
  o=vec4(mix(c,uFogC,f),t.a);
}`;
  const MODEL_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec2 aUv; layout(location=3) in vec3 aCol; layout(location=4) in float aBone; layout(location=5) in float aSpec; layout(location=6) in float aTex;
uniform mat4 uVP; uniform mat4 uBones[20];
out vec3 vPos; out vec3 vNrm; out vec3 vCol; out vec2 vUv; out float vSpec; out float vTex;
void main(){ mat4 m=uBones[int(aBone+0.5)]; vec4 wp=m*vec4(aPos,1.0); vPos=wp.xyz; vNrm=mat3(m)*aNrm; vUv=aUv; vCol=aCol; vSpec=aSpec; vTex=aTex; gl_Position=uVP*wp; }`;
  const MODEL_FS = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNrm; in vec3 vCol; in vec2 vUv; in float vSpec; in float vTex;
uniform sampler2D uTex0; uniform sampler2D uTex1;
uniform vec3 uCam; uniform vec3 uFogC; uniform vec2 uFog;
uniform vec3 uAmb; uniform vec4 uPL[4]; uniform vec3 uPC[4]; uniform int uPN;
uniform float uTexMul; uniform vec3 uTint; uniform float uEmissive; uniform float uAlpha;
${LIGHTS_GLSL}
out vec4 o;
void main(){
  vec4 t0 = texture(uTex0,vUv);
  if (vTex < 0.5 && t0.a < 0.5) discard;
  vec3 base = vTex>0.5 ? texture(uTex1,vUv).rgb : vCol*t0.rgb*uTexMul;
  base*=uTint;
  vec3 n=normalize(vNrm);
  if(!gl_FrontFacing) n=-n;
  vec3 V=normalize(uCam-vPos);
  vec3 light=uAmb*(0.8+0.2*n.y);
  float sp=0.0;
  for(int i=0;i<4;i++){ if(i>=uPN) break; vec3 L=uPL[i].xyz-vPos; float d=length(L); vec3 Ld=L/max(d,0.001); float a=clamp(1.0-d/uPL[i].w,0.0,1.0); a*=a; float lam=max(dot(n,Ld),0.0); light+=uPC[i]*a*(lam*0.85+0.15); vec3 H=normalize(Ld+V); sp+=pow(max(dot(n,H),0.0),22.0)*a*dot(uPC[i],vec3(0.33)); }
  light+=dyn(vPos,n);
  vec3 c=base*light+sp*vSpec*0.9;
  c=mix(c,base,uEmissive);
  float f=smoothstep(uFog.x,uFog.y,distance(vPos,uCam));
  o=vec4(mix(c,uFogC,f),uAlpha);
}`;
  const SPRITE_VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec2 aUv; layout(location=2) in vec4 aCol;
uniform mat4 uVP;
out vec2 vUv; out vec4 vCol; out vec3 vPos;
void main(){ vUv=aUv; vCol=aCol; vPos=aPos; gl_Position=uVP*vec4(aPos,1.0); }`;
  const SPRITE_FS = `#version 300 es
precision highp float;
in vec2 vUv; in vec4 vCol; in vec3 vPos;
uniform sampler2D uTex; uniform vec3 uCam; uniform vec3 uFogC; uniform vec2 uFog; uniform float uFogMix;
out vec4 o;
void main(){ vec4 t=texture(uTex,vUv)*vCol; float f=smoothstep(uFog.x,uFog.y,distance(vPos,uCam))*uFogMix; o=vec4(mix(t.rgb,uFogC*t.a,f),t.a); if(o.a<0.004) discard; }`;
  const QUAD_VS = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv=aPos*0.5+0.5; gl_Position=vec4(aPos,0.0,1.0); }`;
  const SKY_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform mat4 uInvVP; uniform sampler2D uSky; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uGlow; uniform float uFlash;
out vec4 o;
void main(){
  vec4 p=uInvVP*vec4(vUv*2.0-1.0,1.0,1.0); vec3 d=normalize(p.xyz/p.w);
  float h=d.y;
  vec3 c=mix(uHor,uTop,smoothstep(-0.05,0.5,h));
  c+=uGlow*pow(max(0.0,1.0-abs(h)*3.0),2.0);
  float a=atan(d.x,-d.z)/6.2831853+0.5;
  float v=clamp(h*3.2,-0.2,1.0);
  if(v<0.95){ vec4 s=texture(uSky,vec2(a*3.0,1.0-clamp(v+0.2,0.0,1.0))); c=mix(c,s.rgb,s.a); }
  c+=vec3(0.5,0.55,0.7)*uFlash;
  o=vec4(c,1.0);
}`;
  const POST_FS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene; uniform float uBT; uniform float uHurt; uniform float uTime; uniform float uGamma; uniform float uGrain; uniform float uDeath; uniform float uFlash; uniform vec2 uRes; uniform float uNovel; uniform vec3 uGrade; uniform float uHeal; uniform float uDark;
out vec4 o;
float rnd(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }
void main(){
  vec2 uv=vUv;
  vec3 c=texture(uScene,uv).rgb;
  if(uBT>0.001){
    vec2 d=(uv-0.5)*0.014*uBT; vec3 acc=c;
    for(int i=1;i<7;i++) acc+=texture(uScene,uv-d*float(i)).rgb;
    c=mix(c,acc/7.0,0.55*uBT);
    float l=dot(c,vec3(0.3,0.59,0.11));
    c=mix(c,vec3(l)*vec3(1.08,0.98,0.8)*1.08,0.5*uBT);
  }
  if(uNovel>0.5){
    c=1.0-exp(-c*2.4);
    float l=dot(c,vec3(0.3,0.59,0.11));
    c=mix(vec3(l),c,0.35)*uGrade;
    c=(c-0.42)*1.35+0.42+0.02;
    c=max(c,0.0);
    c=floor(c*9.0+0.5)/9.0*0.35+c*0.65;
  }
  vec2 q=uv-0.5;
  float vig=dot(q,q);
  c*=1.0-vig*(0.55+uBT*0.6+uNovel*0.7);
  if(uHurt>0.0) c=mix(c,vec3(0.55,0.02,0.02),clamp(uHurt*(0.25+vig*2.2),0.0,0.75));
  if(uHeal>0.0) c+=vec3(0.18,0.14,0.05)*uHeal*(1.0-vig*2.0);
  if(uDeath>0.0){ float l=dot(c,vec3(0.3,0.59,0.11)); c=mix(c,vec3(l*1.1,l*0.3,l*0.25),uDeath*0.7); }
  c+=vec3(uFlash);
  c*=1.0-uDark;
  float g=rnd(uv*uRes+fract(uTime*7.3)*100.0)-0.5;
  c+=g*(uGrain+uNovel*0.08+uBT*0.03);
  c=pow(max(c,0.0),vec3(1.0/uGamma));
  o=vec4(c,1.0);
}`;

  const FACES = [
    { n: [1, 0, 0], key: 'px', side: 'side' }, { n: [-1, 0, 0], key: 'nx', side: 'side' },
    { n: [0, 1, 0], key: 'py', side: 'top' }, { n: [0, -1, 0], key: 'ny', side: 'bottom' },
    { n: [0, 0, 1], key: 'pz', side: 'side' }, { n: [0, 0, -1], key: 'nz', side: 'side' }
  ];

  function faceMat(mat, f) {
    if (!mat) return 'concrete';
    if (typeof mat === 'string') return mat;
    return mat[f.key] || mat[f.side] || mat.side || mat.top || 'concrete';
  }

  function faceCorners(s, fi) {
    const a = s.min, b = s.max;
    switch (fi) {
      case 0: return [[b[0], a[1], b[2]], [b[0], a[1], a[2]], [b[0], b[1], a[2]], [b[0], b[1], b[2]]];
      case 1: return [[a[0], a[1], a[2]], [a[0], a[1], b[2]], [a[0], b[1], b[2]], [a[0], b[1], a[2]]];
      case 2: return [[a[0], b[1], b[2]], [b[0], b[1], b[2]], [b[0], b[1], a[2]], [a[0], b[1], a[2]]];
      case 3: return [[a[0], a[1], a[2]], [b[0], a[1], a[2]], [b[0], a[1], b[2]], [a[0], a[1], b[2]]];
      case 4: return [[a[0], a[1], b[2]], [b[0], a[1], b[2]], [b[0], b[1], b[2]], [a[0], b[1], b[2]]];
      default: return [[b[0], a[1], a[2]], [a[0], a[1], a[2]], [a[0], b[1], a[2]], [b[0], b[1], a[2]]];
    }
  }

  function planarUV(p, n, info, s) {
    const m = info.m || 2;
    let u, v;
    if (Math.abs(n[0]) > 0.5) { u = n[0] > 0 ? -p[2] : p[2]; v = p[1]; }
    else if (Math.abs(n[1]) > 0.5) { u = p[0]; v = n[1] > 0 ? p[2] : -p[2]; }
    else { u = n[2] > 0 ? p[0] : -p[0]; v = p[1]; }
    const sc = (s && s.uvScale) || 1;
    return [u / (m * sc), -v / (m * sc)];
  }

  class Renderer {
    constructor(canvas, o) {
      o = o || {};
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: !!o.preserve, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL2 недоступен. Нужен 3D-ускоритель.');
      this.gl = gl;
      this.tex = new M.Textures(gl);
      this.pWorld = new Program(gl, WORLD_VS, WORLD_FS);
      this.pModel = new Program(gl, MODEL_VS, MODEL_FS);
      this.pSprite = new Program(gl, SPRITE_VS, SPRITE_FS);
      this.pSky = new Program(gl, QUAD_VS, SKY_FS);
      this.pPost = new Program(gl, QUAD_VS, POST_FS);
      this.quad = new Mesh(gl, [2], [-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]);
      this.target = new Target(gl, 4, 4);
      this.sprites = new Mesh(gl, [3, 2, 4], null, { dynamic: true });
      this.spriteData = new Float32Array(9 * 6 * 6000);
      this.detail = this.tex.upload(M.detailCanvas());
      this.white = this.tex.upload((() => { const c = document.createElement('canvas'); c.width = c.height = 4; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 4, 4); return c; })());
      this.spriteTex = this.tex.upload(this.spriteAtlas(), { clamp: true });
      this.charCache = new Map();
      this.weaponCache = new Map();
      this.decorCache = new Map();
      this.propCache = new Map();
      this.bones = new Float32Array(16 * 20);
      this.gamma = 1.0;
      this.scale = 1;
      this.level = null;
      this.skyTex = null;
      this.probes = new Map();
      this.tvCanvas = new Map();
    }

    spriteAtlas() {
      const S = 256, T = 64;
      const cv = document.createElement('canvas');
      cv.width = S; cv.height = S;
      const c = cv.getContext('2d');
      const cell = (i, fn) => { c.save(); c.translate((i % 4) * T, Math.floor(i / 4) * T); c.beginPath(); c.rect(0, 0, T, T); c.clip(); fn(c, T); c.restore(); };
      const radial = (stops) => (x, t) => { const g = x.createRadialGradient(t / 2, t / 2, 0, t / 2, t / 2, t / 2); stops.forEach(s => g.addColorStop(s[0], s[1])); x.fillStyle = g; x.fillRect(0, 0, t, t); };
      cell(0, radial([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.5)'], [1, 'rgba(255,255,255,0)']]));
      cell(1, (x, t) => { x.translate(t / 2, t / 2); for (let i = 0; i < 6; i++) { x.rotate(Math.PI / 3); const g = x.createLinearGradient(0, 0, t / 2, 0); g.addColorStop(0, 'rgba(255,250,220,1)'); g.addColorStop(1, 'rgba(255,160,40,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, -t * 0.06); x.lineTo(t / 2, 0); x.lineTo(0, t * 0.06); x.fill(); } radial([[0, 'rgba(255,255,230,1)'], [0.3, 'rgba(255,200,80,0.6)'], [1, 'rgba(255,120,20,0)']])(x, 0); x.beginPath(); x.arc(0, 0, t * 0.18, 0, 6.3); x.fillStyle = 'rgba(255,255,230,0.9)'; x.fill(); });
      cell(2, (x, t) => { const r = new M.RNG(3); for (let i = 0; i < 12; i++) { const g = x.createRadialGradient(t / 2 + r.range(-12, 12), t / 2 + r.range(-12, 12), 0, t / 2, t / 2, t * 0.45); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, t, t); } });
      cell(3, (x, t) => { const r = new M.RNG(5); x.fillStyle = 'rgba(255,255,255,1)'; x.beginPath(); x.arc(t / 2, t / 2, t * 0.22, 0, 6.3); x.fill(); for (let i = 0; i < 14; i++) { const a = r.next() * 6.3, d = r.range(t * 0.2, t * 0.45); x.beginPath(); x.arc(t / 2 + Math.cos(a) * d, t / 2 + Math.sin(a) * d, r.range(1.5, 4.5), 0, 6.3); x.fill(); } });
      cell(4, (x, t) => { x.fillStyle = 'rgba(210,235,255,0.85)'; x.beginPath(); x.moveTo(t * 0.5, t * 0.05); x.lineTo(t * 0.8, t * 0.7); x.lineTo(t * 0.3, t * 0.95); x.closePath(); x.fill(); x.strokeStyle = 'rgba(255,255,255,1)'; x.stroke(); });
      cell(5, radial([[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]));
      cell(6, (x, t) => { const g = x.createLinearGradient(0, 0, t, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,1)'); x.fillStyle = g; x.fillRect(0, t * 0.4, t, t * 0.2); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(0, t * 0.3, t, t * 0.4); });
      cell(7, (x, t) => { const g = x.createRadialGradient(t / 2, t * 0.7, 0, t / 2, t * 0.6, t * 0.5); g.addColorStop(0, 'rgba(255,255,200,1)'); g.addColorStop(0.35, 'rgba(255,160,40,0.9)'); g.addColorStop(1, 'rgba(200,40,0,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(t * 0.2, t); x.quadraticCurveTo(t * 0.1, t * 0.4, t * 0.5, 0); x.quadraticCurveTo(t * 0.9, t * 0.4, t * 0.8, t); x.fill(); });
      cell(8, (x, t) => { x.fillStyle = '#c8b050'; x.fillRect(t * 0.35, t * 0.2, t * 0.3, t * 0.6); x.fillStyle = '#8a6a20'; x.fillRect(t * 0.35, t * 0.2, t * 0.3, t * 0.1); });
      cell(9, (x, t) => { x.fillStyle = '#fff'; x.fillRect(t * 0.2, t * 0.2, t * 0.6, t * 0.6); });
      cell(10, radial([[0, 'rgba(255,255,255,0.9)'], [0.2, 'rgba(255,255,255,0.25)'], [1, 'rgba(255,255,255,0)']]));
      cell(11, (x, t) => { x.strokeStyle = 'rgba(255,255,255,0.9)'; x.lineWidth = 2; x.beginPath(); x.arc(t / 2, t / 2, t * 0.4, 0, 6.3); x.stroke(); });
      return cv;
    }

    resize(w, h) {
      const gl = this.gl;
      const W = Math.max(4, Math.floor(w * this.scale)), H = Math.max(4, Math.floor(h * this.scale));
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
      if (this.target.w !== W || this.target.h !== H) this.target.resize(W, H);
      this.W = w; this.H = h;
    }

    skyCanvas(kind) {
      const W = 1024, H = 256;
      const cv = document.createElement('canvas');
      cv.width = W; cv.height = H;
      const c = cv.getContext('2d');
      c.clearRect(0, 0, W, H);
      const r = new M.RNG(kind === 'summer' ? 9 : 4);
      const layers = [[0.55, '#0c1016', 0.25], [0.8, '#07090d', 0.4]];
      for (const [hmax, colr, lit] of layers) {
        let x = 0;
        while (x < W) {
          const w = r.range(20, 70), h = H * r.range(0.2, hmax);
          c.fillStyle = colr;
          c.fillRect(x, H - h, w, h);
          if (r.chance(0.3)) c.fillRect(x + w * 0.4, H - h - r.range(5, 25), w * 0.2, r.range(5, 25));
          for (let yy = H - h + 4; yy < H - 4; yy += 6) for (let xx = x + 3; xx < x + w - 3; xx += 5) if (r.chance(lit * 0.35)) { c.fillStyle = r.chance(0.7) ? 'rgba(240,200,120,0.85)' : 'rgba(200,220,255,0.7)'; c.fillRect(xx, yy, 2, 2.5); c.fillStyle = colr; }
          x += w + r.range(0, 8);
        }
      }
      return cv;
    }

    captureScene() {
      return { world: this.world, faces: this.faces, lmSize: this.lmSize, lmData: this.lmData, lmTex: this.lmTex, bakeIndex: this.bakeIndex, bakeDone: this.bakeDone, worldMeshes: this.worldMeshes, decalMeshes: this.decalMeshes, skyTex: this.skyTex, skyKind: this.skyKind, probes: this.probes, aoRays: this.aoRays };
    }

    useScene(sc) {
      if (!sc) return;
      Object.assign(this, sc);
    }

    disposeScene(sc) {
      if (!sc) return;
      for (const m of sc.worldMeshes || []) m.mesh.dispose();
      for (const m of sc.decalMeshes || []) m.mesh.dispose();
      if (sc.lmTex) this.gl.deleteTexture(sc.lmTex);
      if (sc.skyTex) this.gl.deleteTexture(sc.skyTex);
      sc.worldMeshes = []; sc.decalMeshes = []; sc.lmTex = null; sc.skyTex = null;
    }

    loadWorld(world, o) {
      o = o || {};
      if (!o.keep) this.disposeLevel();
      this.worldMeshes = []; this.decalMeshes = []; this.lmTex = null; this.skyTex = null;
      this.probes = new Map();
      this.world = world;
      const gl = this.gl;
      const faces = [];
      const occluders = s => s.vis !== false && !s.glass && !s.group;
      const inside = (p, self) => {
        let hit = false;
        world.each(p[0] - 0.001, p[2] - 0.001, p[0] + 0.001, p[2] + 0.001, s => {
          if (s === self || s.dynProp || !occluders(s)) return;
          if (p[0] > s.min[0] && p[0] < s.max[0] && p[1] > s.min[1] && p[1] < s.max[1] && p[2] > s.min[2] && p[2] < s.max[2]) { hit = true; return false; }
        });
        if (!hit) for (const s of world.solids) {
          if (s.col || s === self || !occluders(s)) continue;
          if (p[0] > s.min[0] && p[0] < s.max[0] && p[1] > s.min[1] && p[1] < s.max[1] && p[2] > s.min[2] && p[2] < s.max[2]) { hit = true; break; }
        }
        return hit;
      };
      for (const s of world.solids) {
        if (s.vis === false) continue;
        for (let fi = 0; fi < 6; fi++) {
          const f = FACES[fi];
          const mat = faceMat(s.mat, f);
          if (mat === 'clip' || mat === 'none') continue;
          const cs = faceCorners(s, fi);
          const cen = [(cs[0][0] + cs[2][0]) / 2, (cs[0][1] + cs[2][1]) / 2, (cs[0][2] + cs[2][2]) / 2];
          const off = p => [p[0] + f.n[0] * 0.02, p[1] + f.n[1] * 0.02, p[2] + f.n[2] * 0.02];
          const ins = (p, q) => M.mix3(p, q, 0.08);
          const pts = [off(cen), off(ins(cs[0], cen)), off(ins(cs[1], cen)), off(ins(cs[2], cen)), off(ins(cs[3], cen))];
          if (pts.every(p => inside(p, s))) continue;
          faces.push({ s, fi, f, mat, cs, group: s.group || null });
        }
      }
      this.faces = faces;
      const RES = o.lmRes || 0.42;
      const PAD = 1;
      let atlas = 1024;
      const place = () => {
        let x = 0, y = 0, row = 0;
        for (const F of faces) {
          const U = M.dist(F.cs[0], F.cs[1]), V = M.dist(F.cs[1], F.cs[2]);
          F.lw = M.clamp(Math.ceil(U / RES) + 1, 2, 96);
          F.lh = M.clamp(Math.ceil(V / RES) + 1, 2, 96);
          if (x + F.lw + PAD * 2 > atlas) { x = 0; y += row; row = 0; }
          F.lx = x + PAD; F.ly = y + PAD;
          x += F.lw + PAD * 2;
          row = Math.max(row, F.lh + PAD * 2);
        }
        return y + row;
      };
      faces.sort((a, b) => (b.lh || 0) - (a.lh || 0));
      let used = place();
      faces.sort((a, b) => b.lh - a.lh);
      used = place();
      while (used > atlas && atlas < 4096) { atlas *= 2; used = place(); }
      this.lmSize = atlas;
      this.lmData = new Uint8Array(atlas * atlas * 4);
      this.bakeIndex = 0;
      this.bakeDone = false;
      this.lmTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.lmTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas, atlas, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.buildWorldMeshes();
      this.buildDecals();
      this.skyKind = world.sky;
      if (world.sky && world.sky !== 'none') this.skyTex = this.tex.upload(this.skyCanvas(world.sky), { clampT: true });
      this.aoRays = o.ao === false ? 0 : 5;
      return this.captureScene();
    }

    buildWorldMeshes() {
      const gl = this.gl;
      const groups = new Map();
      const A = this.lmSize;
      for (const F of this.faces) {
        const info = this.tex.matInfo(F.mat);
        const key = (F.group || '') + '|' + F.mat;
        if (!groups.has(key)) groups.set(key, { group: F.group, mat: F.mat, info, v: [] });
        const G = groups.get(key);
        const cs = F.cs, n = F.f.n;
        let uvs;
        if (info.fit) uvs = [[0, 1], [1, 1], [1, 0], [0, 0]];
        else uvs = cs.map(p => planarUV(p, n, info, F.s));
        if (F.s.uvOff) uvs = uvs.map(q => [q[0] + F.s.uvOff[0], q[1] + F.s.uvOff[1]]);
        const lm = [[F.lx + 0.5, F.ly + 0.5], [F.lx + F.lw - 0.5, F.ly + 0.5], [F.lx + F.lw - 0.5, F.ly + F.lh - 0.5], [F.lx + 0.5, F.ly + F.lh - 0.5]].map(q => [q[0] / A, q[1] / A]);
        for (const i of [0, 1, 2, 0, 2, 3]) {
          const p = cs[i];
          G.v.push(p[0], p[1], p[2], n[0], n[1], n[2], uvs[i][0], uvs[i][1], lm[i][0], lm[i][1]);
        }
      }
      this.worldMeshes = [];
      for (const G of groups.values()) {
        const mesh = new Mesh(gl, [3, 3, 2, 2], G.v);
        this.worldMeshes.push({ mesh, mat: G.mat, group: G.group, info: G.info, alpha: G.info.alpha });
      }
    }

    bakeStep(budgetMs) {
      if (this.bakeDone) return 1;
      const w = this.world;
      const t0 = performance.now();
      const A = this.lmSize;
      const aoDirs = [];
      const R = new M.RNG(17);
      for (let i = 0; i < this.aoRays; i++) {
        const u = R.next(), v = R.next();
        const r = Math.sqrt(u), th = 6.2831 * v;
        aoDirs.push([r * Math.cos(th), Math.sqrt(1 - u), r * Math.sin(th)]);
      }
      while (this.bakeIndex < this.faces.length) {
        const F = this.faces[this.bakeIndex++];
        const info = this.tex.matInfo(F.mat);
        const n = F.f.n;
        const cs = F.cs;
        const t = Math.abs(n[1]) > 0.5 ? [1, 0, 0] : [0, 1, 0];
        const tb1 = M.norm(M.cross(n, t)), tb2 = M.cross(n, tb1);
        for (let j = 0; j < F.lh; j++) for (let i = 0; i < F.lw; i++) {
          const u = F.lw > 1 ? i / (F.lw - 1) : 0.5, v = F.lh > 1 ? j / (F.lh - 1) : 0.5;
          const U = M.dist(cs[0], cs[1]), V = M.dist(cs[0], cs[3]);
          const eu = Math.min(0.06, U * 0.25) / Math.max(U, 1e-4), ev = Math.min(0.06, V * 0.25) / Math.max(V, 1e-4);
          const uu = M.clamp(u, eu, 1 - eu), vv = M.clamp(v, ev, 1 - ev);
          const q1 = M.mix3(cs[0], cs[1], uu), q2 = M.mix3(cs[3], cs[2], uu);
          const q = M.mix3(q1, q2, vv);
          const p = [q[0] + n[0] * 0.03, q[1] + n[1] * 0.03, q[2] + n[2] * 0.03];
          let c;
          if (info.emissive >= 1) c = [0.5, 0.5, 0.5];
          else {
            c = w.lightAt(p, n);
            if (this.aoRays) {
              let occ = 0;
              for (const d of aoDirs) {
                const dir = [tb1[0] * d[0] + n[0] * d[1] + tb2[0] * d[2], tb1[1] * d[0] + n[1] * d[1] + tb2[1] * d[2], tb1[2] * d[0] + n[2] * d[1] + tb2[2] * d[2]];
                if (w.raycast(p, M.scale(dir, 0.9), { noDyn: true, noGlass: true })) occ++;
              }
              const k = 1 - 0.55 * occ / aoDirs.length;
              c = [c[0] * k, c[1] * k, c[2] * k];
            }
            c = [c[0] * 0.5, c[1] * 0.5, c[2] * 0.5];
          }
          const idx = ((F.ly + j) * A + (F.lx + i)) * 4;
          this.lmData[idx] = M.clamp(c[0] * 255, 0, 255);
          this.lmData[idx + 1] = M.clamp(c[1] * 255, 0, 255);
          this.lmData[idx + 2] = M.clamp(c[2] * 255, 0, 255);
          this.lmData[idx + 3] = 255;
        }
        for (let j = -1; j <= F.lh; j++) for (let i = -1; i <= F.lw; i++) {
          if (i >= 0 && i < F.lw && j >= 0 && j < F.lh) continue;
          const si = M.clamp(i, 0, F.lw - 1), sj = M.clamp(j, 0, F.lh - 1);
          const src = ((F.ly + sj) * A + (F.lx + si)) * 4, dst = ((F.ly + j) * A + (F.lx + i)) * 4;
          if (F.lx + i < 0 || F.ly + j < 0 || F.lx + i >= A || F.ly + j >= A) continue;
          for (let k = 0; k < 4; k++) this.lmData[dst + k] = this.lmData[src + k];
        }
        if (performance.now() - t0 > budgetMs) break;
      }
      const done = this.bakeIndex >= this.faces.length;
      if (done) {
        this.bakeDone = true;
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.lmTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, A, A, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.lmData);
        this.lmData = null;
      }
      return this.faces.length ? this.bakeIndex / this.faces.length : 1;
    }

    buildDecals() {
      const gl = this.gl;
      this.decalMeshes = [];
      for (const d of this.world.decals) {
        const n = { px: [1, 0, 0], nx: [-1, 0, 0], py: [0, 1, 0], ny: [0, -1, 0], pz: [0, 0, 1], nz: [0, 0, -1] }[d.face] || [0, 0, 1];
        const up = Math.abs(n[1]) > 0.5 ? [0, 0, -1] : [0, 1, 0];
        const right = M.norm(M.cross(up, n));
        const rot = d.rot || 0;
        const r2 = M.add(M.scale(right, Math.cos(rot)), M.scale(up, Math.sin(rot)));
        const u2 = M.add(M.scale(up, Math.cos(rot)), M.scale(right, -Math.sin(rot)));
        const p = M.addScaled(d.pos, n, 0.012 + (d.lift || 0));
        const hw = d.w / 2, hh = d.h / 2;
        const cs = [
          M.add(M.addScaled(p, r2, -hw), M.scale(u2, -hh)), M.add(M.addScaled(p, r2, hw), M.scale(u2, -hh)),
          M.add(M.addScaled(p, r2, hw), M.scale(u2, hh)), M.add(M.addScaled(p, r2, -hw), M.scale(u2, hh))
        ];
        const uv = [[0, 1], [1, 1], [1, 0], [0, 0]];
        const lit = d.emissive ? [1, 1, 1] : this.world.lightAt(M.addScaled(d.pos, n, 0.1), n);
        const tint = d.emissive ? [1, 1, 1] : lit.map(x => Math.min(1.5, x * 1.5 + 0.06));
        const v = [];
        for (const i of [0, 1, 2, 0, 2, 3]) v.push(cs[i][0], cs[i][1], cs[i][2], uv[i][0], uv[i][1], tint[0], tint[1], tint[2], d.alpha === undefined ? 1 : d.alpha);
        this.decalMeshes.push({ mesh: new Mesh(gl, [3, 2, 4], v), tex: d.tex, group: d.group });
      }
    }

    disposeLevel() {
      this.disposeScene(this);
      if (this.probes) this.probes.clear();
    }

    uploadModel(parts) {
      return parts.map(p => ({ mat: p.mat, mesh: new Mesh(this.gl, [3, 3, 2, 3, 1, 1, 1], p.data) }));
    }

    charModel(look, seed) {
      const key = look + ':' + seed;
      if (this.charCache.has(key)) return this.charCache.get(key);
      let m;
      if (look === 'dummy') m = { mesh: new Mesh(this.gl, [3, 3, 2, 3, 1, 1, 1], M.buildDummy()), face: this.white, scale: 1, dummy: true };
      else {
        const L = M.LOOKS[look] || M.LOOKS.thug;
        const b = M.buildChar(L, seed);
        const face = this.tex.upload(M.faceCanvas(b.look));
        m = { mesh: new Mesh(this.gl, [3, 3, 2, 3, 1, 1, 1], b.data), face, scale: b.scale };
      }
      this.charCache.set(key, m);
      return m;
    }

    weaponModel(id) {
      if (this.weaponCache.has(id)) return this.weaponCache.get(id);
      const m = new Mesh(this.gl, [3, 3, 2, 3, 1, 1, 1], M.buildWeapon(id));
      this.weaponCache.set(id, m);
      return m;
    }

    decorModel(id, o) {
      const key = id + JSON.stringify(o || {});
      if (this.decorCache.has(key)) return this.decorCache.get(key);
      const m = this.uploadModel(M.buildDecor(id, o));
      this.decorCache.set(key, m);
      return m;
    }

    propModel(p) {
      const key = p.kind + ':' + (p.model || '') + ':' + (p.mat || '') + ':' + (p.w || '') + ':' + (p.h || '') + ':' + JSON.stringify(p.size || p.parts || p.min || '') + (p.double ? 'd' : '') + (p.color || '');
      if (this.propCache.has(key)) return this.propCache.get(key);
      const m = this.uploadModel(M.buildProp(p));
      this.propCache.set(key, m);
      return m;
    }

    probe(key, p, t) {
      const c = this.probes.get(key);
      if (c && t - c.t < 0.3 && M.dist(c.p, p) < 0.8) return c;
      const w = this.world;
      const z = w.zoneAt(p);
      const amb = (z && z.amb ? z.amb : w.ambient).slice();
      const list = [];
      for (const L of w.lights) {
        if (L.off || (L.group && w.groups[L.group] && !w.groups[L.group].on)) continue;
        const d = M.dist(L.pos, p);
        if (d > L.r) continue;
        const hit = w.raycast(p, M.sub(L.pos, p), { noDyn: true, noGlass: true });
        const vis = hit && hit.t < 0.97 ? 0.15 : 1;
        const k = Math.pow(1 - d / L.r, 1.6) * L.i * vis;
        list.push({ pos: L.pos, color: [L.color[0] * L.i * vis, L.color[1] * L.i * vis, L.color[2] * L.i * vis], r: L.r, k });
      }
      if (w.moon && z && z.outdoor) {
        const md = w.moon.dir;
        const hit = w.raycast(p, [-md[0] * 60, -md[1] * 60, -md[2] * 60], { noDyn: true });
        if (!hit) list.push({ pos: [p[0] - md[0] * 30, p[1] - md[1] * 30, p[2] - md[2] * 30], color: w.moon.color.map(v => v * 1.4), r: 60, k: 0.5 });
        amb[0] += 0.03; amb[1] += 0.035; amb[2] += 0.05;
      }
      list.sort((a, b) => b.k - a.k);
      const res = { t, p: p.slice(), amb, lights: list.slice(0, 4) };
      this.probes.set(key, res);
      return res;
    }

    setDyn(prog, dyn) {
      const n = Math.min(8, dyn.length);
      const L = new Float32Array(32), C = new Float32Array(24);
      for (let i = 0; i < n; i++) {
        const d = dyn[i];
        L[i * 4] = d.pos[0]; L[i * 4 + 1] = d.pos[1]; L[i * 4 + 2] = d.pos[2]; L[i * 4 + 3] = d.r;
        C[i * 3] = d.color[0]; C[i * 3 + 1] = d.color[1]; C[i * 3 + 2] = d.color[2];
      }
      prog.v4('uDL', L).v3('uDC', C).i1('uDN', n);
    }

    setProbe(prog, pr, boost) {
      const n = Math.min(4, pr.lights.length);
      const L = new Float32Array(16), C = new Float32Array(12);
      for (let i = 0; i < n; i++) {
        const l = pr.lights[i];
        L[i * 4] = l.pos[0]; L[i * 4 + 1] = l.pos[1]; L[i * 4 + 2] = l.pos[2]; L[i * 4 + 3] = l.r;
        C[i * 3] = l.color[0]; C[i * 3 + 1] = l.color[1]; C[i * 3 + 2] = l.color[2];
      }
      const b = boost || 1;
      prog.f3('uAmb', [pr.amb[0] * 1.6 * b + 0.02, pr.amb[1] * 1.6 * b + 0.02, pr.amb[2] * 1.6 * b + 0.025]).v4('uPL', L).v3('uPC', C).i1('uPN', n);
    }

    camera(cam, aspect) {
      const proj = mat4.persp(cam.fov || 1.1, aspect, cam.near || 0.06, cam.far || 220);
      const view = mat4.lookAt(cam.pos, cam.target, cam.up || [0, 1, 0]);
      const vp = mat4.mul(proj, view);
      return { proj, view, vp, pos: cam.pos };
    }

    boneMatrices(pose, pos, yaw, scale, out) {
      const Bn = M.Anim.BONES;
      const world = [];
      const base = mat4.mul(mat4.trs(pos, yaw, scale || 1), mat4.ident());
      for (let i = 0; i < Bn.length; i++) {
        const [, parent, off] = Bn[i];
        const r = pose.rot[i];
        let local = mat4.translate(i === 0 ? [off[0] + pose.root[0], off[1] + pose.root[1], off[2] + pose.root[2]] : off);
        if (i === 0 && pose.rootM) local = mat4.mul(local, pose.rootM);
        local = mat4.mul(local, mat4.rotEuler(r[0], r[1], r[2]));
        const m = parent < 0 ? mat4.mul(base, local) : mat4.mul(world[parent], local);
        world.push(m);
        if (out) out.set(m, i * 16);
      }
      return world;
    }

    drawModelParts(parts, model, pr, o) {
      const gl = this.gl, P = this.pModel;
      this.bones.set(model, 0);
      P.m4v('uBones', this.bones.subarray(0, 16));
      this.setProbe(P, pr, o && o.boost);
      P.f3('uTint', (o && o.tint) || [1, 1, 1]).f1('uEmissive', 0).f1('uAlpha', 1).f1('uTexMul', 1);
      for (const p of parts) {
        const info = this.tex.matInfo(p.mat);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex.get(p.mat));
        P.f1('uEmissive', info.emissive >= 1 ? 1 : (o && o.emissive) || 0);
        p.mesh.draw();
      }
    }

    render(view) {
      const gl = this.gl;
      const W = this.target.w, H = this.target.h;
      this.target.bind();
      const w = this.world;
      const fog = view.fog || w.fog;
      gl.clearColor(fog.color[0], fog.color[1], fog.color[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const cam = this.camera(view.cam, W / H);
      this.lastCam = cam;
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      if (w.sky && w.sky !== 'none' && this.skyTex) {
        gl.disable(gl.DEPTH_TEST);
        const P = this.pSky.use();
        const rotOnly = mat4.lookAt([0, 0, 0], M.sub(view.cam.target, view.cam.pos), [0, 1, 0]);
        const inv = this.invert(mat4.mul(cam.proj, rotOnly));
        P.m4('uInvVP', inv);
        const sk = w.sky === 'summer' ? { top: [0.02, 0.025, 0.06], hor: [0.1, 0.09, 0.14], glow: [0.12, 0.06, 0.05] } : w.sky === 'dawn' ? { top: [0.08, 0.1, 0.16], hor: [0.32, 0.3, 0.34], glow: [0.2, 0.12, 0.08] } : { top: [0.03, 0.035, 0.05], hor: [0.16, 0.16, 0.19], glow: [0.18, 0.1, 0.05] };
        P.f3('uTop', sk.top).f3('uHor', sk.hor).f3('uGlow', sk.glow).f1('uFlash', view.lightning || 0);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.skyTex); P.i1('uSky', 0);
        this.quad.draw();
        gl.enable(gl.DEPTH_TEST);
      }
      const dyn = view.dyn || [];
      const P = this.pWorld.use();
      P.m4('uVP', cam.vp).f3('uCam', view.cam.pos).f3('uFogC', fog.color).f2('uFog', fog.near, fog.far).i1('uTex', 0).i1('uLm', 1).i1('uEmit', 2).f1('uLmOn', this.bakeDone ? 1 : 0);
      this.setDyn(P, dyn);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.lmTex);
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.BACK);
      for (const m of this.worldMeshes) {
        if (m.group && w.groups[m.group] && !w.groups[m.group].on) continue;
        if (m.alpha) continue;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.get(m.mat));
        const em = this.tex.emitMap(m.mat);
        if (em) { gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, em); }
        P.f1('uHasEmit', em ? 1 : 0).f1('uEmissive', m.info.emissive >= 1 ? 1 : 0).f1('uAlphaTest', 0.5);
        m.mesh.draw();
      }
      gl.disable(gl.CULL_FACE);
      for (const m of this.worldMeshes) {
        if (!m.alpha) continue;
        if (m.group && w.groups[m.group] && !w.groups[m.group].on) continue;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.get(m.mat));
        P.f1('uHasEmit', 0).f1('uEmissive', 0).f1('uAlphaTest', 0.5);
        m.mesh.draw();
      }
      this.drawModels(view, cam, dyn);
      this.drawDecals(view, cam, fog);
      this.drawGlass(view, cam, fog);
      if (view.fx) view.fx.draw(this, view, cam, fog);
      this.post(view);
    }

    drawDecals(view, cam, fog) {
      const gl = this.gl, w = this.world;
      const P = this.pSprite.use();
      P.m4('uVP', cam.vp).f3('uCam', view.cam.pos).f3('uFogC', fog.color).f2('uFog', fog.near, fog.far).f1('uFogMix', 1).i1('uTex', 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-1, -2);
      for (const d of this.decalMeshes) {
        if (d.group && w.groups[d.group] && !w.groups[d.group].on) continue;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex.decal(d.tex));
        d.mesh.draw();
      }
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    drawGlass(view, cam, fog) {
      if (!view.props) return;
      const gl = this.gl;
      const v = [];
      const quad = (a, b, c, d, col) => { for (const p of [a, b, c, a, c, d]) v.push(p[0], p[1], p[2], 0.5, 0.5, col[0], col[1], col[2], col[3]); };
      for (const p of view.props) {
        if (p.kind !== 'glass' || p.broken || p.hidden) continue;
        const x = p.pos[0], y = p.pos[1], z = p.pos[2], hw = p.w / 2;
        const col = p.tint || [0.55, 0.66, 0.78, 0.2];
        if (p.axis === 'y') { const hd = p.d / 2; quad([x - hw, y, z - hd], [x + hw, y, z - hd], [x + hw, y, z + hd], [x - hw, y, z + hd], col); }
        else if (p.axis === 'x') quad([x - hw, y, z], [x + hw, y, z], [x + hw, y + p.h, z], [x - hw, y + p.h, z], col);
        else quad([x, y, z - hw], [x, y, z + hw], [x, y + p.h, z + hw], [x, y + p.h, z - hw], col);
      }
      if (!v.length) return;
      if (!this.glassMesh) this.glassMesh = new Mesh(gl, [3, 2, 4], null, { dynamic: true });
      this.glassMesh.set(new Float32Array(v));
      const P = this.pSprite.use();
      P.m4('uVP', cam.vp).f3('uCam', view.cam.pos).f3('uFogC', fog.color).f2('uFog', fog.near, fog.far).f1('uFogMix', 1).i1('uTex', 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.white);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.disable(gl.CULL_FACE);
      this.glassMesh.draw();
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    drawModels(view, cam, dyn) {
      const gl = this.gl, w = this.world;
      const P = this.pModel.use();
      const fog = view.fog || w.fog;
      P.m4('uVP', cam.vp).f3('uCam', view.cam.pos).f3('uFogC', fog.color).f2('uFog', fog.near, fog.far).i1('uTex0', 0).i1('uTex1', 1).f1('uTexMul', 1).f1('uAlpha', 1);
      this.setDyn(P, dyn);
      gl.disable(gl.CULL_FACE);
      const t = view.time || 0;
      for (const d of w.decor) {
        if (d.group && w.groups[d.group] && !w.groups[d.group].on) continue;
        if (d.hidden) continue;
        if (M.dist(d.pos, view.cam.pos) > (view.fog || w.fog).far + 10) continue;
        const parts = this.decorModel(d.model, { mat: d.mat, sheet: d.sheet, seed: d.seed, color: d.color });
        const pr = this.probe('decor' + w.decor.indexOf(d), [d.pos[0], d.pos[1] + 0.8, d.pos[2]], 0);
        this.drawModelParts(parts, mat4.trs(d.pos, d.yaw, d.scale || 1), pr);
      }
      if (view.props) for (const p of view.props) this.drawProp(p, view, t);
      if (view.items) for (const it of view.items) this.drawItem(it, view, t);
      if (view.actors) for (const a of view.actors) this.drawActor(a, view, t);
      if (view.throws) for (const th of view.throws) {
        const pr = this.probe('th', th.pos, t);
        const m = mat4.mul(mat4.trs(th.pos, th.spin || 0, 1), mat4.rotXm(th.spin || 0));
        this.drawWeaponMesh(this.weaponModel(th.kind), m, pr);
      }
    }

    drawWeaponMesh(mesh, m, pr) {
      const gl = this.gl, P = this.pModel;
      this.bones.set(m, 0);
      P.m4v('uBones', this.bones.subarray(0, 16));
      this.setProbe(P, pr);
      P.f3('uTint', [1, 1, 1]).f1('uEmissive', 0).f1('uTexMul', 1.25);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.detail);
      mesh.draw();
      P.f1('uTexMul', 1);
    }

    drawProp(p, view, t) {
      const gl = this.gl;
      if (p.hidden) return;
      if (p.kind === 'glass' || p.kind === 'fire' || p.kind === 'note' && p.noModel) return;
      if (p.kind === 'cyl' && p.exploded) return;
      if (p.kind === 'crate' && p.broken) return;
      if (p.kind === 'padlock' && p.broken) return;
      const parts = this.propModel(p);
      if (!parts.length) return;
      let m;
      const pos = p.pos || [0, 0, 0];
      const key = 'prop:' + p.id;
      if (p.kind === 'door') {
        const pr = this.probe(key, [pos[0], pos[1] + 1.2, pos[2]], t);
        const leaves = p.double ? 2 : 1;
        const lw = p.w / leaves;
        for (let i = 0; i < leaves; i++) {
          const sideSign = p.double ? (i === 0 ? -1 : 1) : (p.hinge === 'b' ? 1 : -1);
          const baseYaw = p.axis === 'x' ? 0 : -Math.PI / 2;
          let mm;
          if (p.slide) {
            const off = p.open * p.w * (p.slideDir || 1);
            const origin = p.axis === 'x' ? [pos[0] - p.w / 2 + i * lw + off, pos[1], pos[2]] : [pos[0], pos[1], pos[2] - p.w / 2 + i * lw + off];
            mm = mat4.trs(origin, baseYaw, 1);
          } else {
            const hinge = p.axis === 'x' ? [pos[0] + sideSign * p.w / 2, pos[1], pos[2]] : [pos[0], pos[1], pos[2] + sideSign * p.w / 2];
            const ang = p.open * Math.PI / 2 * (p.swing || 1) * (p.axis === 'x' ? 1 : -1) * (sideSign < 0 ? -1 : 1);
            const flip = sideSign > 0 ? Math.PI : 0;
            mm = mat4.trs(hinge, baseYaw + flip + ang, 1);
          }
          this.drawModelParts([parts[i] || parts[0]], mm, pr);
        }
        return;
      }
      if (p.kind === 'mover') {
        const o = p.origin || [0, 0, 0];
        const pr = this.probe(key, [o[0], o[1] + 1.5, o[2]], t);
        m = mat4.trs(o, p.yaw || 0, 1);
        this.drawModelParts(parts, m, pr, { boost: 1.3 });
        return;
      }
      if (p.kind === 'block') {
        if (p.off) return;
        const pr = this.probe(key, [(p.min[0] + p.max[0]) / 2, p.max[1], (p.min[2] + p.max[2]) / 2], t);
        this.drawModelParts(parts, mat4.ident(), pr);
        return;
      }
      if (p.kind === 'searchlight') {
        const pr = { amb: [0.3, 0.3, 0.3], lights: [] };
        const d = p.dir || [0, 0, -1];
        const yaw = M.yawOf(d[0], d[2]), pitch = Math.asin(M.clamp(d[1], -1, 1));
        m = mat4.mul(mat4.trs(pos, yaw, 1), mat4.rotXm(pitch));
        this.drawModelParts(parts, m, pr);
        return;
      }
      const pr = this.probe(key, [pos[0], pos[1] + 0.5, pos[2]], t);
      m = mat4.trs(pos, p.yaw || 0, 1);
      this.drawModelParts(parts, m, pr);
      if (p.kind === 'tv') this.drawTvScreen(p, m, t);
    }

    drawTvScreen(p, m, t) {
      const gl = this.gl, P = this.pModel;
      let entry = this.tvCanvas.get(p.id);
      if (!entry) {
        const cv = document.createElement('canvas');
        cv.width = 64; cv.height = 48;
        const mb = new M.MB();
        mb.box(0, 0.26, -0.252, 0.5, 0.38, 0.005, '#fff', { fit: true });
        entry = { cv, tex: this.tex.upload(cv, { nearest: true }), mesh: new Mesh(gl, [3, 3, 2, 3, 1, 1, 1], mb.data()), last: -1 };
        this.tvCanvas.set(p.id, entry);
      }
      const frame = Math.floor(t * 8);
      if (frame !== entry.last) {
        entry.last = frame;
        const c = entry.cv.getContext('2d');
        if (!p.on) { c.fillStyle = '#0c1210'; c.fillRect(0, 0, 64, 48); c.fillStyle = 'rgba(120,160,150,0.15)'; c.fillRect(6, 4, 20, 10); }
        else if (M.TV && M.TV[p.show] && M.TV[p.show].paint) M.TV[p.show].paint(c, t);
        else { const img = c.createImageData(64, 48); for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } c.putImageData(img, 0, 0); }
        gl.bindTexture(gl.TEXTURE_2D, entry.tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, entry.cv);
      }
      this.bones.set(m, 0);
      P.m4v('uBones', this.bones.subarray(0, 16));
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, entry.tex);
      P.f1('uEmissive', 1);
      entry.mesh.draw();
      P.f1('uEmissive', 0);
    }

    drawItem(it, view, t) {
      if (it.taken || it.hidden) return;
      const id = it.kind === 'weapon' ? it.weapon : it.kind === 'ammo' ? (it.ammo === '12g' ? 'shells' : 'ammo') : it.kind === 'painkillers' ? 'painkillers' : it.kind === 'key' ? 'key' : it.kind === 'detonator' ? 'detonator' : 'ammo';
      const mesh = this.weaponModel(id);
      const flat = it.kind === 'weapon' && !['grenade', 'molotov'].includes(it.weapon);
      const yaw = (M.hash(Math.floor(it.pos[0] * 10), Math.floor(it.pos[2] * 10)) * 6.28);
      let m = mat4.trs([it.pos[0], it.pos[1] + (flat ? 0.03 : 0), it.pos[2]], yaw, 1);
      if (flat) m = mat4.mul(m, mat4.rotZm(Math.PI / 2));
      const pr = this.probe('item:' + it.id, [it.pos[0], it.pos[1] + 0.5, it.pos[2]], t);
      this.drawWeaponMesh(mesh, m, pr);
    }

    drawActor(a, view, t) {
      const gl = this.gl, P = this.pModel;
      const model = this.charModel(a.look, a.seed || 1);
      const pr = this.probe('actor:' + a.key, [a.pos[0], a.pos[1] + 1.2, a.pos[2]], t);
      if (model.dummy) {
        let m = mat4.trs(a.pos, a.yaw, 1);
        if (a.lie) m = mat4.mul(m, mat4.rotXm(a.lieAngle !== undefined ? a.lieAngle : Math.PI / 2 * 0.96));
        this.bones.set(m, 0);
        P.m4v('uBones', this.bones.subarray(0, 16));
        this.setProbe(P, pr);
        P.f3('uTint', a.tint || [1, 1, 1]).f1('uEmissive', 0).f1('uTexMul', 1.2);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.detail);
        model.mesh.draw();
        return;
      }
      const pose = M.Anim.pose(a.state);
      const mats = this.boneMatrices(pose, a.pos, a.yaw, model.scale * (a.scale || 1), this.bones);
      P.m4v('uBones', this.bones);
      this.setProbe(P, pr, a.boost);
      P.f3('uTint', a.tint || [1, 1, 1]).f1('uEmissive', 0).f1('uTexMul', 1.25).f1('uAlpha', 1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.detail);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, model.face);
      model.mesh.draw();
      a.handR = mats[M.Anim.B.handR];
      a.handL = mats[M.Anim.B.handL];
      a.headM = mats[M.Anim.B.head];
      const wid = a.weapon;
      if (wid && !a.state.death) {
        const W = M.WEAPONS[wid];
        const single = wid === 'beretta2' ? 'beretta' : wid === 'ingram2' ? 'ingram' : wid;
        const mesh = this.weaponModel(single);
        const fix = mat4.mul(mat4.translate([0, -0.09, -0.02]), mat4.rotXm(-Math.PI / 2));
        const pr2 = pr;
        if (W && W.hold === 'dual') this.drawWeaponMesh(mesh, mat4.mul(a.handL, fix), pr2);
        if (!(W && W.throwable) || (a.state.throwT !== undefined && a.state.throwT < 0.3)) this.drawWeaponMesh(mesh, mat4.mul(a.handR, fix), pr2);
      }
    }

    invert(m) {
      const inv = new Float32Array(16);
      const a = m;
      inv[0] = a[5] * a[10] * a[15] - a[5] * a[11] * a[14] - a[9] * a[6] * a[15] + a[9] * a[7] * a[14] + a[13] * a[6] * a[11] - a[13] * a[7] * a[10];
      inv[4] = -a[4] * a[10] * a[15] + a[4] * a[11] * a[14] + a[8] * a[6] * a[15] - a[8] * a[7] * a[14] - a[12] * a[6] * a[11] + a[12] * a[7] * a[10];
      inv[8] = a[4] * a[9] * a[15] - a[4] * a[11] * a[13] - a[8] * a[5] * a[15] + a[8] * a[7] * a[13] + a[12] * a[5] * a[11] - a[12] * a[7] * a[9];
      inv[12] = -a[4] * a[9] * a[14] + a[4] * a[10] * a[13] + a[8] * a[5] * a[14] - a[8] * a[6] * a[13] - a[12] * a[5] * a[10] + a[12] * a[6] * a[9];
      inv[1] = -a[1] * a[10] * a[15] + a[1] * a[11] * a[14] + a[9] * a[2] * a[15] - a[9] * a[3] * a[14] - a[13] * a[2] * a[11] + a[13] * a[3] * a[10];
      inv[5] = a[0] * a[10] * a[15] - a[0] * a[11] * a[14] - a[8] * a[2] * a[15] + a[8] * a[3] * a[14] + a[12] * a[2] * a[11] - a[12] * a[3] * a[10];
      inv[9] = -a[0] * a[9] * a[15] + a[0] * a[11] * a[13] + a[8] * a[1] * a[15] - a[8] * a[3] * a[13] - a[12] * a[1] * a[11] + a[12] * a[3] * a[9];
      inv[13] = a[0] * a[9] * a[14] - a[0] * a[10] * a[13] - a[8] * a[1] * a[14] + a[8] * a[2] * a[13] + a[12] * a[1] * a[10] - a[12] * a[2] * a[9];
      inv[2] = a[1] * a[6] * a[15] - a[1] * a[7] * a[14] - a[5] * a[2] * a[15] + a[5] * a[3] * a[14] + a[13] * a[2] * a[7] - a[13] * a[3] * a[6];
      inv[6] = -a[0] * a[6] * a[15] + a[0] * a[7] * a[14] + a[4] * a[2] * a[15] - a[4] * a[3] * a[14] - a[12] * a[2] * a[7] + a[12] * a[3] * a[6];
      inv[10] = a[0] * a[5] * a[15] - a[0] * a[7] * a[13] - a[4] * a[1] * a[15] + a[4] * a[3] * a[13] + a[12] * a[1] * a[7] - a[12] * a[3] * a[5];
      inv[14] = -a[0] * a[5] * a[14] + a[0] * a[6] * a[13] + a[4] * a[1] * a[14] - a[4] * a[2] * a[13] - a[12] * a[1] * a[6] + a[12] * a[2] * a[5];
      inv[3] = -a[1] * a[6] * a[11] + a[1] * a[7] * a[10] + a[5] * a[2] * a[11] - a[5] * a[3] * a[10] - a[9] * a[2] * a[7] + a[9] * a[3] * a[6];
      inv[7] = a[0] * a[6] * a[11] - a[0] * a[7] * a[10] - a[4] * a[2] * a[11] + a[4] * a[3] * a[10] + a[8] * a[2] * a[7] - a[8] * a[3] * a[6];
      inv[11] = -a[0] * a[5] * a[11] + a[0] * a[7] * a[9] + a[4] * a[1] * a[11] - a[4] * a[3] * a[9] - a[8] * a[1] * a[7] + a[8] * a[3] * a[5];
      inv[15] = a[0] * a[5] * a[10] - a[0] * a[6] * a[9] - a[4] * a[1] * a[10] + a[4] * a[2] * a[9] + a[8] * a[1] * a[6] - a[8] * a[2] * a[5];
      let det = a[0] * inv[0] + a[1] * inv[4] + a[2] * inv[8] + a[3] * inv[12];
      det = det ? 1 / det : 0;
      for (let i = 0; i < 16; i++) inv[i] *= det;
      return inv;
    }

    post(view) {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, view.out ? view.out.fb : null);
      if (view.out) gl.viewport(0, 0, view.out.w, view.out.h);
      else gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      gl.disable(gl.DEPTH_TEST);
      const P = this.pPost.use();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.target.tex);
      P.i1('uScene', 0).f1('uBT', view.bt || 0).f1('uHurt', view.hurt || 0).f1('uTime', view.time || 0).f1('uGamma', this.gamma * (view.gamma || 1))
        .f1('uGrain', view.grain !== undefined ? view.grain : 0.035).f1('uDeath', view.death || 0).f1('uFlash', view.flash || 0).f2('uRes', this.target.w, this.target.h)
        .f1('uNovel', view.novel ? 1 : 0).f3('uGrade', view.grade || [1, 1, 1]).f1('uHeal', view.heal || 0).f1('uDark', view.dark || 0);
      this.quad.draw();
      gl.enable(gl.DEPTH_TEST);
    }

    project(p) {
      if (!this.lastCam) return null;
      const r = mat4.project(this.lastCam.vp, p);
      if (!r) return null;
      return [(r[0] * 0.5 + 0.5) * this.W, (1 - (r[1] * 0.5 + 0.5)) * this.H, r[2]];
    }

    renderToCanvas(view, w, h) {
      const gl = this.gl;
      const oldT = this.target;
      const tmp = new Target(gl, w, h);
      const out = new Target(gl, w, h);
      this.target = tmp;
      const oldW = this.W, oldH = this.H;
      this.W = w; this.H = h;
      this.render(Object.assign({}, view, { out }));
      const px = new Uint8Array(w * h * 4);
      gl.bindFramebuffer(gl.FRAMEBUFFER, out.fb);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.target = oldT;
      this.W = oldW; this.H = oldH;
      const shots = [];
      if (view.projectPts) for (const p of view.projectPts) { const r = mat4.project(this.lastCam.vp, p); shots.push(r ? [(r[0] * 0.5 + 0.5) * w, (1 - (r[1] * 0.5 + 0.5)) * h, r[2]] : null); }
      tmp.dispose(); out.dispose();
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      const c = cv.getContext('2d');
      const img = c.createImageData(w, h);
      for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
      c.putImageData(img, 0, 0);
      return { canvas: cv, points: shots };
    }

    dispose() {
      this.disposeLevel();
      this.tex.dispose();
      for (const m of this.charCache.values()) m.mesh.dispose();
      for (const m of this.weaponCache.values()) m.dispose();
      this.charCache.clear(); this.weaponCache.clear();
      const lose = this.gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }
  }
  M.Renderer = Renderer;
})(globalThis.MaxPayne = globalThis.MaxPayne || {});
