(function (L) {
  'use strict';

  const G = L.GL;
  const MODEL_YAW = 0;

  const TERRAIN_VS = `#version 300 es
in vec3 aPos; in vec3 aNor;
uniform mat4 uVP;
out vec3 vPos; out vec3 vNor;
void main(){ vPos = aPos; vNor = aNor; gl_Position = uVP * vec4(aPos, 1.0); }`;

  const TERRAIN_FS = `#version 300 es
precision highp float;
in vec3 vPos; in vec3 vNor;
uniform sampler2D uMacro, uDetail, uRock, uTypes;
uniform float uSize, uDetailAvg, uRockAvg, uFogDen, uTypeOn, uZoneOn, uTime;
uniform vec3 uSun, uLight, uFogCol, uCam;
uniform vec4 uZone;
uniform vec4 uLamp0, uLamp1; uniform vec3 uLampCol;
out vec4 o;
void main(){
  vec2 uv = vPos.xz / uSize;
  vec3 macro = texture(uMacro, uv).rgb;
  float dl = dot(texture(uDetail, vPos.xz / 7.0).rgb, vec3(0.3333)) / uDetailAvg;
  float rl = dot(texture(uRock, vPos.xz / 11.0).rgb, vec3(0.3333)) / uRockAvg;
  vec3 n = normalize(vNor);
  float slope = 1.0 - n.y;
  float k = mix(dl, rl, smoothstep(0.06, 0.22, slope));
  vec3 col = macro * (0.55 + 0.45 * k);
  float ndl = max(dot(n, uSun), 0.0);
  col *= mix(1.0, 0.62 + 0.62 * ndl, 0.5) * uLight;
  if (uLamp0.w > 0.0) { float d0 = length(vPos - uLamp0.xyz); col += uLampCol * macro * 2.2 * max(0.0, 1.0 - d0 / uLamp0.w); }
  if (uLamp1.w > 0.0) { float d1 = length(vPos - uLamp1.xyz); col += uLampCol * macro * 2.2 * max(0.0, 1.0 - d1 / uLamp1.w); }
  if (uTypeOn > 0.5) { vec4 t = texture(uTypes, uv); col = mix(col, t.rgb, t.a * uTypeOn); }
  if (uZoneOn > 0.5) {
    bool inside = vPos.x > uZone.x && vPos.z > uZone.y && vPos.x < uZone.z && vPos.z < uZone.w;
    float edge = min(min(abs(vPos.x - uZone.x), abs(vPos.x - uZone.z)), min(abs(vPos.z - uZone.y), abs(vPos.z - uZone.w)));
    if (inside) { col = mix(col, vec3(1.0, 0.92, 0.55), 0.10); if (edge < 1.6) col = mix(col, vec3(1.0, 0.85, 0.2), 0.75); }
    else col *= 0.82;
  }
  float d = length(vPos - uCam);
  float f = 1.0 - exp(-pow(d * uFogDen, 2.0));
  o = vec4(mix(col, uFogCol, f), 1.0);
}`;

  const SKY_VS = `#version 300 es
in vec3 aPos; in vec2 aUV;
uniform mat4 uVP; uniform vec3 uCam;
out vec2 vUV;
void main(){ vUV = aUV; gl_Position = uVP * vec4(aPos + vec3(uCam.x, 0.0, uCam.z), 1.0); gl_Position.z = gl_Position.w * 0.9999; }`;

  const SKY_FS = `#version 300 es
precision highp float;
in vec2 vUV; uniform sampler2D uSky; uniform vec3 uLight; uniform vec3 uFogCol; uniform float uHaze;
out vec4 o;
void main(){
  float u = fract(vUV.x);
  vec2 gx = dFdx(vUV), gy = dFdy(vUV);
  float a = 1.0 - smoothstep(0.0, 0.2, min(u, 1.0 - u));
  vec3 c0 = textureGrad(uSky, vec2(u, vUV.y), gx, gy).rgb;
  vec3 c1 = textureGrad(uSky, vec2(fract(u + 0.5), vUV.y), gx, gy).rgb;
  vec3 c = mix(c0, c1, a) * uLight;
  float h = smoothstep(0.72, 1.0, vUV.y) * uHaze;
  o = vec4(mix(c, uFogCol, h), 1.0);
}`;

  const WATER_VS = `#version 300 es
in vec3 aPos; uniform mat4 uVP; out vec3 vPos;
void main(){ vPos = aPos; gl_Position = uVP * vec4(aPos, 1.0); }`;

  const WATER_FS = `#version 300 es
precision highp float;
in vec3 vPos; uniform vec3 uCam, uFogCol, uLight, uSkyCol; uniform float uTime, uFogDen;
out vec4 o;
void main(){
  float w = sin(vPos.x * 0.21 + uTime * 1.3) * 0.5 + sin(vPos.z * 0.17 - uTime * 1.1) * 0.5 + sin((vPos.x + vPos.z) * 0.53 + uTime * 2.1) * 0.25;
  vec3 v = normalize(uCam - vPos);
  float fres = pow(1.0 - max(v.y, 0.0), 3.0);
  vec3 deep = vec3(0.09, 0.17, 0.2) * uLight;
  vec3 c = mix(deep, uSkyCol * 0.85, 0.25 + 0.55 * fres) + w * 0.025;
  float d = length(vPos - uCam);
  float f = 1.0 - exp(-pow(d * uFogDen, 2.0));
  o = vec4(mix(c, uFogCol, f), 0.78);
}`;

  const BILL_VS = `#version 300 es
in vec2 aCorner;
in vec4 iPos; in vec4 iSpr; in vec2 iMisc;
uniform mat4 uVP; uniform vec3 uRight; uniform float uTime, uSway;
out vec2 vUV; out float vShade; out vec3 vWorld;
void main(){
  float h = iPos.w; float w = h * iMisc.x;
  vec3 r = normalize(vec3(uRight.x, 0.0, uRight.z));
  vec3 p = iPos.xyz + r * aCorner.x * w + vec3(0.0, aCorner.y * h, 0.0);
  p.xz += vec2(sin(uTime * 1.3 + iMisc.y * 17.0), cos(uTime * 1.1 + iMisc.y * 9.0)) * uSway * aCorner.y * aCorner.y * h * 0.02;
  vUV = vec2(mix(iSpr.x, iSpr.z, aCorner.x + 0.5), mix(iSpr.w, iSpr.y, aCorner.y));
  vShade = 0.72 + 0.28 * aCorner.y + iMisc.y * 0.12;
  vWorld = p;
  gl_Position = uVP * vec4(p, 1.0);
}`;

  const BILL_FS = `#version 300 es
precision highp float;
in vec2 vUV; in float vShade; in vec3 vWorld;
uniform sampler2D uTex; uniform vec3 uLight, uFogCol, uCam; uniform float uFogDen, uCut;
out vec4 o;
void main(){
  vec4 t = texture(uTex, vUV);
  if (t.a < uCut) discard;
  vec3 c = t.rgb * vShade * uLight;
  float d = length(vWorld - uCam);
  float f = 1.0 - exp(-pow(d * uFogDen, 2.0));
  o = vec4(mix(c, uFogCol, f), 1.0);
}`;

  const UNIT_VS = `#version 300 es
precision highp float;
precision highp int;
in vec2 aUV;
in vec4 iPos; in vec4 iAnim; in vec4 iExtra;
uniform highp isampler2D uPosTex;
uniform sampler2D uNorTex;
uniform mat4 uVP; uniform float uScale, uYaw;
out vec2 vUV; out vec3 vNor; out vec3 vWorld; out vec4 vExtra;
void main(){
  int v = gl_VertexID;
  vec3 a = vec3(texelFetch(uPosTex, ivec2(v, int(iAnim.x)), 0).xyz);
  vec3 b = vec3(texelFetch(uPosTex, ivec2(v, int(iAnim.y)), 0).xyz);
  vec3 na = texelFetch(uNorTex, ivec2(v, int(iAnim.x)), 0).xyz;
  vec3 nb = texelFetch(uNorTex, ivec2(v, int(iAnim.y)), 0).xyz;
  vec3 p = mix(a, b, iAnim.z) * uScale * iExtra.z;
  vec3 n = normalize(mix(na, nb, iAnim.z) + vec3(0.0, 0.0001, 0.0));
  p.z = -p.z; n.z = -n.z;
  float ang = iPos.w + uYaw;
  float c = cos(ang), s = sin(ang);
  vec3 w = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + iPos.xyz;
  vNor = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z);
  vUV = aUV / 2048.0;
  vWorld = w;
  vExtra = iExtra;
  gl_Position = uVP * vec4(w, 1.0);
}`;

  const UNIT_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec2 vUV; in vec3 vNor; in vec3 vWorld; in vec4 vExtra;
uniform sampler2DArray uTex;
uniform vec3 uSun, uSunCol, uAmb, uFogCol, uCam; uniform float uFogDen;
uniform vec4 uLamp0, uLamp1; uniform vec3 uLampCol;
out vec4 o;
void main(){
  vec3 t = texture(uTex, vec3(vUV, vExtra.w)).rgb;
  vec3 n = normalize(vNor);
  float ndl = max(dot(n, uSun), 0.0);
  vec3 c = t * (uAmb + uSunCol * ndl);
  if (uLamp0.w > 0.0) c += t * uLampCol * 1.6 * max(0.0, 1.0 - length(vWorld - uLamp0.xyz) / uLamp0.w);
  if (uLamp1.w > 0.0) c += t * uLampCol * 1.6 * max(0.0, 1.0 - length(vWorld - uLamp1.xyz) / uLamp1.w);
  c = mix(c, c * 0.55, vExtra.y);
  c += vec3(0.32, 0.27, 0.1) * vExtra.x;
  float d = length(vWorld - uCam);
  float f = 1.0 - exp(-pow(d * uFogDen, 2.0));
  o = vec4(mix(c, uFogCol, f), 1.0);
}`;

  const FLAT_VS = `#version 300 es
in vec3 aPos; in vec4 aCol;
uniform mat4 uVP;
out vec4 vCol;
void main(){ vCol = aCol; gl_Position = uVP * vec4(aPos, 1.0); }`;

  const FLAT_FS = `#version 300 es
precision highp float;
in vec4 vCol; out vec4 o;
void main(){ o = vCol; }`;

  const SPRITE_VS = `#version 300 es
in vec2 aCorner;
in vec4 iPos; in vec4 iUV; in vec4 iCol; in vec2 iSize;
uniform mat4 uVP; uniform vec3 uRight, uUp;
out vec2 vUV; out vec4 vCol;
void main(){
  vec3 p = iPos.xyz + uRight * (aCorner.x * iSize.x + iPos.w) + uUp * aCorner.y * iSize.y;
  vUV = vec2(mix(iUV.x, iUV.z, aCorner.x + 0.5), mix(iUV.w, iUV.y, aCorner.y + 0.5));
  vCol = iCol;
  gl_Position = uVP * vec4(p, 1.0);
}`;

  const SPRITE_FS = `#version 300 es
precision highp float;
in vec2 vUV; in vec4 vCol; uniform sampler2D uTex; out vec4 o;
void main(){ vec4 t = texture(uTex, vUV); o = vec4(t.rgb * vCol.rgb, t.a * vCol.a); if (o.a < 0.01) discard; }`;

  const DECAL_VS = `#version 300 es
in vec2 aCorner;
in vec4 iPos; in vec2 iSize;
uniform mat4 uVP;
out vec2 vUV; out float vA;
void main(){
  float c = cos(iPos.w), s = sin(iPos.w);
  vec2 q = vec2(aCorner.x * iSize.x, aCorner.y * iSize.y);
  vec3 p = iPos.xyz + vec3(c * q.x + s * q.y, 0.0, -s * q.x + c * q.y);
  vUV = aCorner + 0.5; vA = 1.0;
  gl_Position = uVP * vec4(p, 1.0);
}`;

  const DECAL_FS = `#version 300 es
precision highp float;
in vec2 vUV; in float vA; uniform float uAlpha; out vec4 o;
void main(){ float r = length(vUV - 0.5) * 2.0; float a = (1.0 - smoothstep(0.35, 1.0, r)) * uAlpha; if (a < 0.01) discard; o = vec4(0.0, 0.0, 0.0, a); }`;

  const ANIM = {
    stand: [0], idle: [1, 2], ready: [16, 17], fight: [4, 5, 6, 7], shoot: [8], die: [10, 11, 12, 13], walk: [3], run: [15], flee: [14, 18]
  };
  const FPS = { stand: 12, idle: 12, ready: 14, fight: 20, shoot: 17, die: 16, walk: 0, run: 0, flee: 0 };
  const STRIDE = {
    foot: { walk: 4.1, run: 6.5, flee: 7.4 },
    cav: { walk: 2.2, run: 4.05, flee: 4.05 },
    ele: { walk: 3, run: 3.35, flee: 3.35 }
  };

  class Camera {
    constructor() {
      this.tx = 512; this.tz = 512; this.dist = 180; this.yaw = 0; this.pitch = 0.75; this.fov = 0.9;
      this.vx = 0; this.vz = 0;
    }
    eye(terrain) {
      const cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
      const ty = terrain ? terrain.heightAt(this.tx, this.tz) : 0;
      let ex = this.tx + Math.sin(this.yaw) * cp * this.dist, ez = this.tz + Math.cos(this.yaw) * cp * this.dist, ey = ty + sp * this.dist;
      if (terrain) {
        const g = terrain.heightAt(L.clamp(ex, 0, terrain.size), L.clamp(ez, 0, terrain.size)) + 4;
        if (ey < g) ey = g;
      }
      return [ex, ey, ez, ty];
    }
  }

  class Renderer {
    constructor(canvas) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL2 недоступен');
      this.gl = gl;
      this.cam = new Camera();
      this.time = 0;
      this.opts = { grass: true, trees: 1, shadows: true, numbers: true, types: 0 };
      this.numbers = [];
      this.dust = [];
      this.overlay = { zone: null, rings: [], arrows: [] };
      this.models = new Map();
      this.build();
    }

    build() {
      const gl = this.gl;
      this.pTerrain = G.program(gl, TERRAIN_VS, TERRAIN_FS);
      this.pSky = G.program(gl, SKY_VS, SKY_FS);
      this.pWater = G.program(gl, WATER_VS, WATER_FS);
      this.pBill = G.program(gl, BILL_VS, BILL_FS);
      this.pUnit = G.program(gl, UNIT_VS, UNIT_FS);
      this.pFlat = G.program(gl, FLAT_VS, FLAT_FS);
      this.pSprite = G.program(gl, SPRITE_VS, SPRITE_FS);
      this.pDecal = G.program(gl, DECAL_VS, DECAL_FS);
      this.quad = G.buffer(gl, new Float32Array([-0.5, 0, 0.5, 0, 0.5, 1, -0.5, 0, 0.5, 1, -0.5, 1]));
      this.quadC = G.buffer(gl, new Float32Array([-0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, 0.5]));
      this.flatBuf = gl.createBuffer();
      this.instBuf = gl.createBuffer();
      this.digitTex = G.canvasTexture(gl, 512, 64, (c, w, h) => {
        c.font = 'bold 50px Georgia, serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const chars = '0123456789+-';
        for (let i = 0; i < chars.length; i++) {
          c.lineWidth = 7;
          c.strokeStyle = 'rgba(0,0,0,0.85)';
          c.strokeText(chars[i], i * 32 + 16, 34);
          c.fillStyle = '#fff';
          c.fillText(chars[i], i * 32 + 16, 34);
        }
        c.save();
        c.translate(13 * 32, 34);
        c.lineWidth = 7;
        c.strokeStyle = '#fff';
        c.beginPath();
        c.arc(0, 2, 11, Math.PI * 0.15, Math.PI * 1.85, true);
        c.stroke();
        c.restore();
        c.save();
        c.translate(14 * 32 + 16, 32);
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(0, -4, 11, 0, Math.PI * 2);
        c.fill();
        c.fillRect(-7, 2, 14, 11);
        c.fillStyle = '#000';
        c.beginPath(); c.arc(-4, -5, 3, 0, Math.PI * 2); c.arc(4, -5, 3, 0, Math.PI * 2); c.fill();
        c.restore();
      }, { clamp: true, nomip: true });
      this.puffTex = G.canvasTexture(gl, 64, 64, (c, w, h) => {
        const g = c.createRadialGradient(32, 32, 2, 32, 32, 31);
        g.addColorStop(0, 'rgba(255,255,255,0.9)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
      }, { clamp: true });
    }

    async load(battle, onProgress) {
      const gl = this.gl;
      const terrain = battle.terrain;
      this.battle = battle;
      this.terrain = terrain;
      const prog = (f, t) => onProgress && onProgress(f, t);
      prog(0.05, 'Карта');
      const tex = await L.loadMapTextures(terrain.key, terrain.meta);
      this.mapTex = tex;
      this.tMacro = G.texture(gl, tex.macro, { clamp: true, aniso: true });
      this.tDetail = G.texture(gl, tex.detail, { aniso: true });
      this.tRock = G.texture(gl, tex.rock, { aniso: true });
      this.tSky = G.texture(gl, tex.sky, { clampY: true });
      this.tTrees = G.texture(gl, tex.trees, { clamp: true });
      this.tGrass = tex.grass ? G.texture(gl, tex.grass, { clamp: true }) : null;
      this.tTuft = tex.tuft ? G.texture(gl, tex.tuft, { clamp: true }) : null;
      this.tWheat = tex.wheat ? G.texture(gl, tex.wheat, { clamp: true }) : null;
      this.detailAvg = this.avgLum(tex.detail);
      this.rockAvg = this.avgLum(tex.rock);
      const macroAvg = this.avgLum(tex.macro);
      this.exposure = macroAvg > 0.6 ? L.clamp(0.6 / macroAvg, 0.8, 1) : 1;
      this.skyTop = this.skyColor(tex.sky, 0.02);
      this.skyMid = this.skyColor(tex.sky, 0.55);
      prog(0.3, 'Рельеф');
      this.buildTerrain();
      this.buildTypes();
      this.buildSky();
      this.buildWater();
      prog(0.4, 'Деревья');
      this.buildTrees();
      this.buildGrass();
      this.setupLight();
      const need = new Map();
      const addNeed = (key, color) => {
        if (!need.has(key)) need.set(key, new Set());
        need.get(key).add(color);
      };
      for (const s of battle.squads) addNeed(s.key, s.color);
      for (const r of battle.reinforcements || []) for (const s of r.squads) addNeed(s.key, s.color == null ? 0 : s.color);
      let i = 0;
      for (const [key, colors] of need) {
        prog(0.45 + 0.5 * i / need.size, L.UNITS[key].name);
        await this.loadUnit(key, Array.from(colors));
        i++;
      }
      prog(1, 'Готово');
      const zc = battle.sides[0].zone;
      if (zc) {
        const face = battle.sides[0].face;
        this.cam.tx = (zc[0] + zc[2]) / 2 + Math.sin(face) * 60;
        this.cam.tz = (zc[1] + zc[3]) / 2 + Math.cos(face) * 60;
        this.cam.yaw = face - Math.PI;
      }
    }

    avgLum(img) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 16;
      const c = cv.getContext('2d');
      c.drawImage(img, 0, 0, 16, 16);
      const d = c.getImageData(0, 0, 16, 16).data;
      let s = 0;
      for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3;
      return Math.max(0.05, s / (d.length / 4) / 255);
    }

    skyColor(img, v) {
      const cv = document.createElement('canvas');
      cv.width = 32;
      cv.height = 32;
      const c = cv.getContext('2d');
      c.drawImage(img, 0, 0, 32, 32);
      const d = c.getImageData(0, Math.floor(v * 31), 32, 1).data;
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4;
      return [r / n / 255, g / n / 255, b / n / 255];
    }

    buildTerrain() {
      const gl = this.gl;
      const t = this.terrain;
      const W = t.W;
      const pos = new Float32Array(W * W * 6);
      for (let z = 0; z < W; z++) {
        for (let x = 0; x < W; x++) {
          const i = (z * W + x) * 6;
          const wx = x * L.CELL, wz = z * L.CELL;
          pos[i] = wx;
          pos[i + 1] = t.rawAt(x, z);
          pos[i + 2] = wz;
          const hx = t.rawAt(x + 1, z) - t.rawAt(x - 1, z), hz = t.rawAt(x, z + 1) - t.rawAt(x, z - 1);
          const nx = -hx, ny = 2 * L.CELL, nz = -hz;
          const l = Math.hypot(nx, ny, nz);
          pos[i + 3] = nx / l; pos[i + 4] = ny / l; pos[i + 5] = nz / l;
        }
      }
      const idx = new Uint32Array((W - 1) * (W - 1) * 6);
      let k = 0;
      for (let z = 0; z < W - 1; z++) {
        for (let x = 0; x < W - 1; x++) {
          const a = z * W + x, b = a + 1, c = a + W, d = c + 1;
          idx[k++] = a; idx[k++] = c; idx[k++] = b;
          idx[k++] = b; idx[k++] = c; idx[k++] = d;
        }
      }
      this.terrainVao = gl.createVertexArray();
      gl.bindVertexArray(this.terrainVao);
      G.buffer(gl, pos);
      const p = this.pTerrain.p;
      const la = gl.getAttribLocation(p, 'aPos'), ln = gl.getAttribLocation(p, 'aNor');
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 3, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(ln);
      gl.vertexAttribPointer(ln, 3, gl.FLOAT, false, 24, 12);
      G.buffer(gl, idx, gl.ELEMENT_ARRAY_BUFFER);
      gl.bindVertexArray(null);
      this.terrainCount = idx.length;
    }

    buildTypes() {
      const gl = this.gl;
      const t = this.terrain;
      const n = t.tn;
      const data = new Uint8Array(n * n * 4);
      const COL = { 1: [210, 150, 60, 110], 2: [60, 170, 60, 110], 3: [10, 90, 20, 150], 5: [220, 60, 50, 120], 6: [120, 80, 30, 150], 7: [70, 160, 240, 150], 8: [20, 50, 200, 190] };
      for (let i = 0; i < n * n; i++) {
        const c = COL[t.types[i]];
        if (c) { data[i * 4] = c[0]; data[i * 4 + 1] = c[1]; data[i * 4 + 2] = c[2]; data[i * 4 + 3] = c[3]; }
      }
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, n, n, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.tTypes = tex;
    }

    buildSky() {
      const gl = this.gl;
      const R = this.terrain.size * 1.9, seg = 48;
      const y0 = -R * 0.06, y1 = R * 0.62;
      const data = [];
      for (let i = 0; i < seg; i++) {
        const a0 = i / seg * Math.PI * 2, a1 = (i + 1) / seg * Math.PI * 2;
        const u0 = i / seg * 3, u1 = (i + 1) / seg * 3;
        const p = (a, y) => [Math.sin(a) * R, y, Math.cos(a) * R];
        const v = [[...p(a0, y1), u0, 0], [...p(a1, y1), u1, 0], [...p(a1, y0), u1, 1], [...p(a0, y1), u0, 0], [...p(a1, y0), u1, 1], [...p(a0, y0), u0, 1]];
        for (const q of v) data.push(...q);
      }
      this.skyVao = gl.createVertexArray();
      gl.bindVertexArray(this.skyVao);
      G.buffer(gl, new Float32Array(data));
      const la = gl.getAttribLocation(this.pSky.p, 'aPos'), lu = gl.getAttribLocation(this.pSky.p, 'aUV');
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(lu);
      gl.vertexAttribPointer(lu, 2, gl.FLOAT, false, 20, 12);
      gl.bindVertexArray(null);
      this.skyCount = seg * 6;
    }

    buildWater() {
      const t = this.terrain;
      this.waterLevel = t.waterLevel;
      if (this.waterLevel == null) return;
      const gl = this.gl;
      const s = t.size, y = this.waterLevel - 0.25;
      this.waterVao = gl.createVertexArray();
      gl.bindVertexArray(this.waterVao);
      G.buffer(gl, new Float32Array([-s, y, -s, s * 2, y, -s, s * 2, y, s * 2, -s, y, -s, s * 2, y, s * 2, -s, y, s * 2]));
      const la = gl.getAttribLocation(this.pWater.p, 'aPos');
      gl.enableVertexAttribArray(la);
      gl.vertexAttribPointer(la, 3, gl.FLOAT, false, 12, 0);
      gl.bindVertexArray(null);
    }

    billboardVao(prog, data) {
      const gl = this.gl;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
      const lc = gl.getAttribLocation(prog.p, 'aCorner');
      gl.enableVertexAttribArray(lc);
      gl.vertexAttribPointer(lc, 2, gl.FLOAT, false, 8, 0);
      const buf = G.buffer(gl, data);
      const lp = gl.getAttribLocation(prog.p, 'iPos'), ls = gl.getAttribLocation(prog.p, 'iSpr'), lm = gl.getAttribLocation(prog.p, 'iMisc');
      gl.enableVertexAttribArray(lp);
      gl.vertexAttribPointer(lp, 4, gl.FLOAT, false, 40, 0);
      gl.vertexAttribDivisor(lp, 1);
      gl.enableVertexAttribArray(ls);
      gl.vertexAttribPointer(ls, 4, gl.FLOAT, false, 40, 16);
      gl.vertexAttribDivisor(ls, 1);
      gl.enableVertexAttribArray(lm);
      gl.vertexAttribPointer(lm, 2, gl.FLOAT, false, 40, 32);
      gl.vertexAttribDivisor(lm, 1);
      gl.bindVertexArray(null);
      return { vao, buf, count: data.length / 10 };
    }

    buildTrees() {
      const t = this.terrain;
      const sprites = t.meta.trees;
      const list = t.trees(L.hashString(t.key), this.opts.trees);
      const extra = [];
      const rnd = L.rng(L.hashString(t.key + 'x'));
      for (let z = 0; z < t.tn; z++) {
        for (let x = 0; x < t.tn; x++) {
          const ty = t.types[z * t.tn + x];
          if (ty !== L.T.lightwood && ty !== L.T.densewood) continue;
          const wx = (x + 0.5) * t.cell, wz = (z + 0.5) * t.cell;
          if (t.forestAt(wx, wz) > 60) continue;
          if (rnd.next() < (ty === L.T.densewood ? 0.1 : 0.04) * this.opts.trees) {
            const px = wx + rnd.range(-2, 2), pz = wz + rnd.range(-2, 2);
            extra.push({ x: px, z: pz, y: t.heightAt(px, pz), s: rnd.range(8, 13), sprite: rnd.int(sprites.length), r: rnd.next() });
          }
        }
      }
      const all = list.concat(extra);
      this.treeList = all;
      const data = new Float32Array(all.length * 10);
      all.forEach((tr, i) => {
        const sp = sprites[tr.sprite];
        const o = i * 10;
        data[o] = tr.x; data[o + 1] = tr.y - 0.3; data[o + 2] = tr.z; data[o + 3] = tr.s * (0.9 + (1 - sp.aspect) * 0.4);
        data[o + 4] = sp.u0; data[o + 5] = sp.v0; data[o + 6] = sp.u1; data[o + 7] = sp.v1;
        data[o + 8] = sp.aspect; data[o + 9] = tr.r;
      });
      this.trees = this.billboardVao(this.pBill, data);
      const shadows = new Float32Array(all.length * 6);
      all.forEach((tr, i) => {
        const o = i * 6;
        shadows[o] = tr.x; shadows[o + 1] = tr.y + 0.08; shadows[o + 2] = tr.z; shadows[o + 3] = tr.r * 6;
        shadows[o + 4] = tr.s * 0.55; shadows[o + 5] = tr.s * 0.55;
      });
      this.treeShadows = this.decalVao(shadows);
    }

    decalVao(data) {
      const gl = this.gl;
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadC);
      const p = this.pDecal.p;
      const lc = gl.getAttribLocation(p, 'aCorner');
      gl.enableVertexAttribArray(lc);
      gl.vertexAttribPointer(lc, 2, gl.FLOAT, false, 8, 0);
      const buf = G.buffer(gl, data, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
      const lp = gl.getAttribLocation(p, 'iPos'), ls = gl.getAttribLocation(p, 'iSize');
      gl.enableVertexAttribArray(lp);
      gl.vertexAttribPointer(lp, 4, gl.FLOAT, false, 24, 0);
      gl.vertexAttribDivisor(lp, 1);
      gl.enableVertexAttribArray(ls);
      gl.vertexAttribPointer(ls, 2, gl.FLOAT, false, 24, 16);
      gl.vertexAttribDivisor(ls, 1);
      gl.bindVertexArray(null);
      return { vao, buf, count: data.length / 6 };
    }

    buildGrass() {
      const tex = this.tGrass || this.tTuft;
      this.grassChunks = new Map();
      this.grassTex = tex;
      this.grassAtlas = !!this.tGrass;
    }

    grassChunk(cx, cz) {
      const key = cx + ',' + cz;
      if (this.grassChunks.has(key)) return this.grassChunks.get(key);
      const t = this.terrain;
      const rnd = L.rng(L.hashString(key + t.key));
      const out = [];
      const CH = 32;
      const night = this.battle && this.battle.level && this.battle.level.night;
      const snowy = /snowy/.test(t.key);
      const n = snowy ? 40 : 150;
      for (let i = 0; i < n; i++) {
        const x = cx * CH + rnd.next() * CH, z = cz * CH + rnd.next() * CH;
        if (x < 0 || z < 0 || x > t.size || z > t.size) continue;
        const ty = t.typeAt(x, z);
        if (ty === L.T.water || ty === L.T.ford) continue;
        const g = t.grassAt(x, z);
        const kind = g >> 4;
        let keep = kind > 0 ? 0.9 : 0.4;
        if (ty === L.T.densewood) keep = 0.15;
        if (rnd.next() > keep) continue;
        const q = this.grassAtlas ? (kind > 0 ? (kind - 1) % 4 : 3) : 0;
        const u0 = this.grassAtlas ? (q % 2) * 0.5 : 0, v0 = this.grassAtlas ? Math.floor(q / 2) * 0.5 : 0;
        const u1 = this.grassAtlas ? u0 + 0.5 : 1, v1 = this.grassAtlas ? v0 + 0.5 : 1;
        const h = (kind === 1 ? 1.1 : kind === 2 ? 0.7 : 0.55) * rnd.range(0.7, 1.25) * (night ? 0.9 : 1);
        out.push(x, t.heightAt(x, z) - 0.05, z, h, u0, v0, u1, v1, 1.6, rnd.next());
      }
      const vao = out.length ? this.billboardVao(this.pBill, new Float32Array(out)) : null;
      this.grassChunks.set(key, vao);
      return vao;
    }

    setupLight() {
      const m = this.terrain.meta.light;
      const lv = this.battle.level || {};
      const toSun = v => { const x = -v[0], y = -v[1], z = v[2]; const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
      this.sun = toSun(m.sunDir);
      this.unitSun = toSun(m.unitDir);
      const c = v => v.map(x => Math.min(1.6, x / 255));
      this.sunCol = c(m.sun);
      this.fogBase = c(m.fog);
      this.unitAmb = c(m.unitAmbient).map(x => x * 0.62 + 0.08);
      this.unitSunCol = c(m.unitSun).map(x => x * 0.62);
      this.lightMul = [1, 1, 1];
      this.fogDen = 1 / (this.terrain.size * 2.2);
      this.lamps = [];
      if (lv.night && this.terrain.meta.lamps) {
        for (const l of this.terrain.meta.lamps) this.lamps.push([l[3] / 8, l[4] / 8 + this.terrain.heightAt(l[3] / 8, -l[5] / 8), -l[5] / 8, l[6] / 8 * 0.35]);
      }
      this.night = !!lv.night;
      this.sunset = lv.sunset || 0;
      this.updateLight(0);
    }

    updateLight(time) {
      let mul = [1, 1, 1], fog = this.fogBase.slice(), amb = this.unitAmb.slice(), sunc = this.unitSunCol.slice();
      if (this.night) {
        mul = [0.66, 0.72, 0.98];
        fog = [0.07, 0.08, 0.15];
        amb = amb.map((x, i) => x * [0.58, 0.64, 0.9][i]);
        sunc = sunc.map((x, i) => x * [0.55, 0.62, 0.95][i]);
      } else if (this.sunset) {
        const k = L.clamp(time / this.sunset, 0, 1);
        const e = k * k;
        mul = [L.lerp(1, 0.95, e), L.lerp(1, 0.62, e), L.lerp(1, 0.45, e)];
        fog = [L.lerp(fog[0], 0.75, e), L.lerp(fog[1], 0.42, e), L.lerp(fog[2], 0.3, e)];
        amb = amb.map((x, i) => x * mul[i]);
        sunc = sunc.map((x, i) => x * L.lerp(1, [0.95, 0.62, 0.4][i], e));
      }
      this.cur = { mul, fog, amb, sunc };
    }

    async loadUnit(key, colors) {
      const gl = this.gl;
      const model = await L.loadModel(key);
      const imgs = [];
      for (const c of colors) imgs.push(await L.unitTexture(key, c));
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      const posTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, posTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16I, model.V, model.F, 0, gl.RGB_INTEGER, gl.SHORT, model.pos);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      const norTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, norTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8_SNORM, model.V, model.F, 0, gl.RGB, gl.BYTE, model.nrm);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
      const texArr = G.textureArray(gl, imgs, 512);
      const vao = gl.createVertexArray();
      gl.bindVertexArray(vao);
      const p = this.pUnit.p;
      G.buffer(gl, model.uv);
      const lu = gl.getAttribLocation(p, 'aUV');
      gl.enableVertexAttribArray(lu);
      gl.vertexAttribPointer(lu, 2, gl.SHORT, false, 0, 0);
      const inst = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, inst);
      const li = ['iPos', 'iAnim', 'iExtra'].map(n => gl.getAttribLocation(p, n));
      li.forEach((loc, i) => {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 48, i * 16);
        gl.vertexAttribDivisor(loc, 1);
      });
      G.buffer(gl, model.idx, gl.ELEMENT_ARRAY_BUFFER);
      gl.bindVertexArray(null);
      const slots = {};
      for (const name in ANIM) {
        slots[name] = ANIM[name].map(i => model.anims[i]).filter(a => a && a.count > 0);
      }
      if (!slots.shoot.length) slots.shoot = slots.fight;
      if (!slots.ready.length) slots.ready = slots.stand;
      if (!slots.idle.length) slots.idle = slots.stand;
      if (!slots.flee.length) slots.flee = slots.run;
      if (!slots.run.length) slots.run = slots.walk;
      const cls = L.CLASSES[L.UNITS[key].type];
      const stride = L.UNITS[key].type === 'Elephant' ? STRIDE.ele : cls.cav ? STRIDE.cav : STRIDE.foot;
      this.models.set(key, { model, posTex, norTex, texArr, vao, inst, colors, slots, data: new Float32Array(48 * 12), count: 0, stride, scale: L.MODEL_SCALE });
    }

    frameOf(m, s, dtAlpha) {
      const slots = m.slots;
      let list = slots[s.anim] || slots.stand;
      let name = s.anim;
      if (name === 'stand' && s.animVar > 0 && s.sq.state !== 'engaged') { list = slots.idle; name = 'idle'; }
      const a = list[s.animVar % list.length] || slots.stand[0];
      let f;
      if (name === 'walk' || name === 'run' || name === 'flee') {
        const span = Math.max(1, a.count - 1);
        f = (s.walkPhase / m.stride[name]) * span;
        f = ((f % span) + span) % span;
        const i = Math.floor(f);
        return [a.start + i, a.start + Math.min(i + 1, a.count - 1), f - i];
      }
      const fps = FPS[name] || 12;
      f = (s.animT + dtAlpha) * fps;
      if (name === 'die') {
        f = Math.min(f, a.count - 1);
        const i = Math.floor(f);
        return [a.start + i, a.start + Math.min(i + 1, a.count - 1), f - i];
      }
      if (name === 'fight' || name === 'shoot') {
        f = Math.min(f, a.count - 1.001);
        const i = Math.floor(f);
        return [a.start + i, a.start + Math.min(i + 1, a.count - 1), f - i];
      }
      f = (f + s.uid * 3.7) % a.count;
      const i = Math.floor(f);
      return [a.start + i, a.start + (i + 1) % a.count, f - i];
    }

    matrices() {
      const cv = this.canvas;
      const w = cv.width, h = cv.height;
      const [ex, ey, ez, ty] = this.cam.eye(this.terrain);
      this.eyePos = [ex, ey, ez];
      const proj = G.perspective(this.cam.fov, w / Math.max(1, h), 1.5, this.terrain.size * 5);
      const view = G.lookAt(ex, ey, ez, this.cam.tx, ty + 2, this.cam.tz, 0, 1, 0);
      this.proj = proj;
      this.view = view;
      this.vp = G.mul(proj, view);
      this.ivp = G.invert(this.vp);
      this.right = [view[0], view[4], view[8]];
      this.up = [view[1], view[5], view[9]];
    }

    resize() {
      const cv = this.canvas;
      const dpr = Math.min(window.devicePixelRatio || 1, 2) * (this.opts.scale || 1);
      const w = Math.max(1, Math.round(cv.clientWidth * dpr)), h = Math.max(1, Math.round(cv.clientHeight * dpr));
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    }

    render(alpha, dtReal, selection) {
      const gl = this.gl;
      const b = this.battle;
      if (!b || !this.terrainVao) return;
      this.time += dtReal;
      this.resize();
      this.updateLight(b.time);
      this.matrices();
      const cur = this.cur;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      const top = this.night ? [0.02, 0.03, 0.07] : this.skyTop.map((x, i) => x * cur.mul[i]);
      gl.clearColor(top[0], top[1], top[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      this.drawSky();
      this.drawTerrain();
      if (this.opts.shadows) this.drawShadows(alpha);
      this.drawTrees();
      this.drawUnits(alpha, selection);
      if (this.opts.grass && this.grassTex) this.drawGrass();
      this.drawWater();
      this.drawOverlay(selection);
      this.drawProjectiles(alpha);
      this.drawDust(dtReal);
      if (this.opts.numbers) this.drawNumbers(dtReal);
    }

    commonFog(u) {
      const gl = this.gl;
      gl.uniform3fv(u.uFogCol, this.cur.fog);
      gl.uniform1f(u.uFogDen, this.fogDen);
      gl.uniform3fv(u.uCam, this.eyePos);
    }

    drawSky() {
      const gl = this.gl;
      const pr = this.pSky;
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      gl.uniform3fv(pr.u.uCam, [this.terrain.size / 2, 0, this.terrain.size / 2]);
      gl.uniform3fv(pr.u.uLight, this.night ? [0.45, 0.5, 0.75] : this.cur.mul);
      gl.uniform3fv(pr.u.uFogCol, this.cur.fog);
      gl.uniform1f(pr.u.uHaze, 0.35);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tSky);
      gl.uniform1i(pr.u.uSky, 0);
      gl.depthMask(false);
      gl.bindVertexArray(this.skyVao);
      gl.drawArrays(gl.TRIANGLES, 0, this.skyCount);
      gl.depthMask(true);
    }

    setLamps(u) {
      const gl = this.gl;
      const l0 = this.lamps[0] || [0, 0, 0, 0], l1 = this.lamps[1] || [0, 0, 0, 0];
      const flick = 0.9 + Math.sin(this.time * 9) * 0.05 + Math.sin(this.time * 23) * 0.04;
      gl.uniform4fv(u.uLamp0, [l0[0], l0[1], l0[2], l0[3] * flick]);
      gl.uniform4fv(u.uLamp1, [l1[0], l1[1], l1[2], l1[3] * flick]);
      gl.uniform3fv(u.uLampCol, [1, 0.62, 0.25]);
    }

    drawTerrain() {
      const gl = this.gl;
      const pr = this.pTerrain;
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      gl.uniform1f(pr.u.uSize, this.terrain.size);
      gl.uniform1f(pr.u.uDetailAvg, this.detailAvg);
      gl.uniform1f(pr.u.uRockAvg, this.rockAvg);
      gl.uniform3fv(pr.u.uSun, this.sun);
      gl.uniform3fv(pr.u.uLight, this.cur.mul.map(x => x * this.exposure));
      gl.uniform1f(pr.u.uTime, this.time);
      this.commonFog(pr.u);
      this.setLamps(pr.u);
      gl.uniform1f(pr.u.uTypeOn, this.opts.types || 0);
      const z = this.overlay.zone;
      gl.uniform1f(pr.u.uZoneOn, z ? 1 : 0);
      gl.uniform4fv(pr.u.uZone, z || [0, 0, 0, 0]);
      const texs = [this.tMacro, this.tDetail, this.tRock, this.tTypes];
      ['uMacro', 'uDetail', 'uRock', 'uTypes'].forEach((n, i) => {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, texs[i]);
        gl.uniform1i(pr.u[n], i);
      });
      gl.bindVertexArray(this.terrainVao);
      gl.drawElements(gl.TRIANGLES, this.terrainCount, gl.UNSIGNED_INT, 0);
    }

    drawWater() {
      if (this.waterLevel == null) return;
      const gl = this.gl;
      const pr = this.pWater;
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      gl.uniform1f(pr.u.uTime, this.time);
      gl.uniform3fv(pr.u.uLight, this.cur.mul);
      gl.uniform3fv(pr.u.uSkyCol, this.night ? [0.1, 0.13, 0.25] : this.skyMid);
      this.commonFog(pr.u);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.bindVertexArray(this.waterVao);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    drawBill(obj, tex, cut, sway) {
      if (!obj || !obj.count) return;
      const gl = this.gl;
      const pr = this.pBill;
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      gl.uniform3fv(pr.u.uRight, this.right);
      gl.uniform1f(pr.u.uTime, this.time);
      gl.uniform1f(pr.u.uSway, sway);
      gl.uniform1f(pr.u.uCut, cut);
      gl.uniform3fv(pr.u.uLight, this.cur.mul.map((x, i) => x * (this.night ? 0.85 : 1)));
      this.commonFog(pr.u);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(pr.u.uTex, 0);
      gl.bindVertexArray(obj.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, obj.count);
    }

    drawTrees() {
      this.drawBill(this.trees, this.tTrees, 0.45, 1);
    }

    drawGrass() {
      const cx0 = Math.floor(this.cam.tx / 32), cz0 = Math.floor(this.cam.tz / 32);
      const r = Math.round(L.clamp(this.cam.dist / 60, 2, 5));
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          const ch = this.grassChunk(cx0 + dx, cz0 + dz);
          if (ch) this.drawBill(ch, this.grassTex, 0.35, 2.2);
        }
      }
    }

    drawShadows(alpha) {
      const gl = this.gl;
      const b = this.battle;
      const n = b.soldiers.length;
      if (!this.shadowData || this.shadowData.length < n * 6) this.shadowData = new Float32Array(n * 6 + 60);
      const d = this.shadowData;
      let k = 0;
      for (const s of b.soldiers) {
        if (s.gone) continue;
        if (!s.alive && s.dieT > 3) continue;
        const x = s.px + (s.x - s.px) * alpha, z = s.pz + (s.z - s.pz) * alpha;
        if (!this.inView(x, z)) continue;
        const big = s.sq.cls.cav ? (s.sq.clsName === 'Elephant' ? 3.2 : 1.6) : 0.75;
        d[k++] = x; d[k++] = this.terrain.heightAt(x, z) + 0.06; d[k++] = z; d[k++] = s.face;
        d[k++] = big * 1.25; d[k++] = big * (s.sq.cls.cav ? 2.2 : 1.25);
      }
      if (!this.unitShadows) this.unitShadows = this.decalVao(d);
      else {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.unitShadows.buf);
        gl.bufferData(gl.ARRAY_BUFFER, d.subarray(0, k), gl.DYNAMIC_DRAW);
      }
      this.unitShadows.count = k / 6;
      const pr = this.pDecal;
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-2, -2);
      gl.uniform1f(pr.u.uAlpha, this.night ? 0.22 : 0.42);
      gl.bindVertexArray(this.unitShadows.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.unitShadows.count);
      gl.uniform1f(pr.u.uAlpha, this.night ? 0.12 : 0.28);
      gl.bindVertexArray(this.treeShadows.vao);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, this.treeShadows.count);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    inView(x, z) {
      const m = this.vp;
      const y = this.terrain.heightAt(x, z) + 1;
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (w < 0.5) return false;
      const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
      return cx > -1.25 && cx < 1.25 && cy > -1.4 && cy < 1.3;
    }

    drawUnits(alpha, selection) {
      const gl = this.gl;
      const b = this.battle;
      for (const m of this.models.values()) m.count = 0;
      const dtA = alpha * L.TICK;
      for (const s of b.soldiers) {
        if (s.gone) continue;
        const m = this.models.get(s.sq.key);
        if (!m) continue;
        const x = s.px + (s.x - s.px) * alpha, z = s.pz + (s.z - s.pz) * alpha;
        if (!this.inView(x, z)) continue;
        if (m.data.length < (m.count + 1) * 12) {
          const nd = new Float32Array(m.data.length * 2);
          nd.set(m.data);
          m.data = nd;
        }
        const [fa, fb, bl] = this.frameOf(m, s, s.alive ? dtA : 0);
        const o = m.count * 12;
        const d = m.data;
        d[o] = x; d[o + 1] = this.terrain.heightAt(x, z); d[o + 2] = z; d[o + 3] = s.face;
        d[o + 4] = fa; d[o + 5] = fb; d[o + 6] = bl; d[o + 7] = 0;
        const sel = selection && selection.has(s.sq) ? 1 : 0;
        const dead = s.alive ? 0 : Math.min(1, s.dieT / 4);
        d[o + 8] = sel * (0.35 + 0.15 * Math.sin(this.time * 6));
        d[o + 9] = dead * 0.5;
        d[o + 10] = m.scale / L.MODEL_SCALE;
        d[o + 11] = Math.max(0, m.colors.indexOf(s.sq.color));
        m.count++;
      }
      const pr = this.pUnit;
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      gl.uniform1f(pr.u.uScale, L.MODEL_SCALE);
      gl.uniform1f(pr.u.uYaw, MODEL_YAW);
      gl.uniform3fv(pr.u.uSun, this.unitSun);
      gl.uniform3fv(pr.u.uSunCol, this.cur.sunc);
      gl.uniform3fv(pr.u.uAmb, this.cur.amb);
      this.commonFog(pr.u);
      this.setLamps(pr.u);
      for (const m of this.models.values()) {
        if (!m.count) continue;
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, m.posTex);
        gl.uniform1i(pr.u.uPosTex, 0);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, m.norTex);
        gl.uniform1i(pr.u.uNorTex, 1);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, m.texArr);
        gl.uniform1i(pr.u.uTex, 2);
        gl.bindBuffer(gl.ARRAY_BUFFER, m.inst);
        gl.bufferData(gl.ARRAY_BUFFER, m.data.subarray(0, m.count * 12), gl.DYNAMIC_DRAW);
        gl.bindVertexArray(m.vao);
        gl.drawElementsInstanced(gl.TRIANGLES, m.model.T * 3, gl.UNSIGNED_SHORT, 0, m.count);
      }
    }

    flat(data, mode, blend) {
      if (!data.length) return;
      const gl = this.gl;
      const pr = this.pFlat;
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      if (!this.flatVao) {
        this.flatVao = gl.createVertexArray();
        gl.bindVertexArray(this.flatVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.flatBuf);
        const la = gl.getAttribLocation(pr.p, 'aPos'), lc = gl.getAttribLocation(pr.p, 'aCol');
        gl.enableVertexAttribArray(la);
        gl.vertexAttribPointer(la, 3, gl.FLOAT, false, 28, 0);
        gl.enableVertexAttribArray(lc);
        gl.vertexAttribPointer(lc, 4, gl.FLOAT, false, 28, 12);
      }
      gl.bindVertexArray(this.flatVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.flatBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.DYNAMIC_DRAW);
      if (blend) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      }
      gl.drawArrays(mode, 0, data.length / 7);
      gl.disable(gl.BLEND);
    }

    ribbon(out, pts, width, col, lift) {
      const t = this.terrain;
      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
        const dx = bx - ax, dz = bz - az;
        const l = Math.hypot(dx, dz) || 1;
        const steps = Math.max(1, Math.ceil(l / 3));
        const nx = -dz / l * width / 2, nz = dx / l * width / 2;
        for (let s = 0; s < steps; s++) {
          const t0 = s / steps, t1 = (s + 1) / steps;
          const x0 = ax + dx * t0, z0 = az + dz * t0, x1 = ax + dx * t1, z1 = az + dz * t1;
          const y0 = t.heightAt(x0, z0) + (lift || 0.25), y1 = t.heightAt(x1, z1) + (lift || 0.25);
          const q = [[x0 - nx, y0, z0 - nz], [x0 + nx, y0, z0 + nz], [x1 + nx, y1, z1 + nz], [x0 - nx, y0, z0 - nz], [x1 + nx, y1, z1 + nz], [x1 - nx, y1, z1 - nz]];
          for (const p of q) out.push(p[0], p[1], p[2], col[0], col[1], col[2], col[3]);
        }
      }
    }

    squadOutline(sq, pad) {
      const c = Math.cos(sq.face), s = Math.sin(sq.face);
      const hw = sq.width / 2 + pad, hd = sq.depth / 2 + pad;
      const cx = sq.alive > 0 && sq.cx != null && this.battle.state !== 'deploy' ? sq.cx : sq.ax;
      const cz = sq.alive > 0 && sq.cz != null && this.battle.state !== 'deploy' ? sq.cz : sq.az;
      const corner = (lx, lz) => [cx + c * lx + s * lz, cz - s * lx + c * lz];
      return [corner(-hw, hd), corner(hw, hd), corner(hw, -hd), corner(-hw, -hd), corner(-hw, hd)];
    }

    drawOverlay(selection) {
      const gl = this.gl;
      const out = [];
      const b = this.battle;
      const ov = this.overlay;
      const deploy = b.state === 'deploy';
      for (const sq of b.squads) {
        if (sq.alive <= 0 || !sq.onField || sq.state === 'fled') continue;
        const selected = selection && selection.has(sq);
        const hovered = ov.hover === sq;
        if (!selected && !hovered && !deploy) continue;
        let col;
        if (sq.side === 0) col = selected ? [1, 0.86, 0.2, 0.9] : hovered ? [1, 1, 1, 0.6] : [0.85, 0.2, 0.15, 0.55];
        else col = hovered ? [1, 0.5, 0.4, 0.8] : [0.3, 0.45, 1, 0.5];
        if (deploy && sq.side === 0 && ov.invalid && ov.invalid.has(sq)) col = [1, 0.1, 0.1, 0.95];
        this.ribbon(out, this.squadOutline(sq, 1.2), selected ? 0.7 : 0.45, col);
        if (deploy && sq.side === 0 && selected) {
          const fx = Math.sin(sq.face), fz = Math.cos(sq.face);
          const tip = [sq.ax + fx * (sq.depth / 2 + 9), sq.az + fz * (sq.depth / 2 + 9)];
          const base = [sq.ax + fx * (sq.depth / 2 + 2), sq.az + fz * (sq.depth / 2 + 2)];
          this.ribbon(out, [base, tip], 0.8, [1, 0.86, 0.2, 0.9]);
          const rx = Math.cos(sq.face), rz = -Math.sin(sq.face);
          this.ribbon(out, [[tip[0] - fx * 3 + rx * 2.5, tip[1] - fz * 3 + rz * 2.5], tip, [tip[0] - fx * 3 - rx * 2.5, tip[1] - fz * 3 - rz * 2.5]], 0.8, [1, 0.86, 0.2, 0.9]);
        }
      }
      for (const a of ov.arrows || []) this.ribbon(out, a.pts, a.w || 0.9, a.col);
      for (const r of ov.rings || []) {
        const pts = [];
        for (let i = 0; i <= 28; i++) {
          const ang = i / 28 * Math.PI * 2;
          pts.push([r.x + Math.sin(ang) * r.r, r.z + Math.cos(ang) * r.r]);
        }
        this.ribbon(out, pts, r.w || 0.6, r.col);
      }
      gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-4, -4);
      this.flat(out, gl.TRIANGLES, true);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.depthMask(true);
    }

    drawProjectiles(alpha) {
      const gl = this.gl;
      const b = this.battle;
      const out = [];
      const dt = L.TICK * alpha;
      for (const p of b.projectiles) {
        const x = p.x + p.vx * dt, y = p.y + (p.vy - 4.9 * dt) * dt, z = p.z + p.vz * dt;
        const v = Math.hypot(p.vx, p.vy, p.vz) || 1;
        const len = p.kind === 'arrow' ? 0.9 : p.kind === 'pilum' ? 2.0 : 1.6;
        const tx = x - p.vx / v * len, ty = y - p.vy / v * len, tz = z - p.vz / v * len;
        const c = p.kind === 'arrow' ? [0.25, 0.18, 0.1, 1] : [0.35, 0.26, 0.15, 1];
        out.push(x, y, z, ...c, tx, ty, tz, ...c);
      }
      const now = b.time;
      for (const s of b.stuck) {
        if (now - s.t > 40) continue;
        const len = s.kind === 'arrow' ? 0.7 : 1.3;
        const fx = Math.sin(s.ax), fz = Math.cos(s.ax);
        const c = [0.28, 0.2, 0.12, 1];
        out.push(s.x, s.y, s.z, ...c, s.x - fx * len * 0.6, s.y + len * 0.75, s.z - fz * len * 0.6, ...c);
      }
      this.flat(out, gl.LINES, false);
    }

    addNumber(x, z, text, color) {
      if (this.numbers.length > 260) this.numbers.shift();
      this.numbers.push({ x, y: this.terrain.heightAt(x, z) + 2.4, z, text: String(text), color, t: 0 });
    }

    addDust(x, z, size, col) {
      if (this.dust.length > 400) this.dust.shift();
      this.dust.push({ x, y: this.terrain.heightAt(x, z) + 0.3, z, s: size, t: 0, col: col || [0.62, 0.55, 0.42] });
    }

    sprites(list, tex, additive) {
      if (!list.length) return;
      const gl = this.gl;
      const pr = this.pSprite;
      gl.useProgram(pr.p);
      gl.uniformMatrix4fv(pr.u.uVP, false, this.vp);
      gl.uniform3fv(pr.u.uRight, this.right);
      gl.uniform3fv(pr.u.uUp, this.up);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(pr.u.uTex, 0);
      if (!this.spriteVao) {
        this.spriteVao = gl.createVertexArray();
        gl.bindVertexArray(this.spriteVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.quadC);
        const lc = gl.getAttribLocation(pr.p, 'aCorner');
        gl.enableVertexAttribArray(lc);
        gl.vertexAttribPointer(lc, 2, gl.FLOAT, false, 8, 0);
        this.spriteBuf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
        const names = ['iPos', 'iUV', 'iCol', 'iSize'];
        const sizes = [4, 4, 4, 2];
        let off = 0;
        names.forEach((n, i) => {
          const loc = gl.getAttribLocation(pr.p, n);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, sizes[i], gl.FLOAT, false, 56, off);
          gl.vertexAttribDivisor(loc, 1);
          off += sizes[i] * 4;
        });
      }
      gl.bindVertexArray(this.spriteVao);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(list), gl.DYNAMIC_DRAW);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, additive ? gl.ONE : gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, list.length / 14);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    drawNumbers(dt) {
      const gl = this.gl;
      const list = [];
      const scale = L.clamp(this.cam.dist / 120, 0.6, 3.2);
      const keep = [];
      for (const n of this.numbers) {
        n.t += dt;
        if (n.t > 1.3) continue;
        keep.push(n);
        const a = n.t < 0.15 ? n.t / 0.15 : 1 - Math.max(0, n.t - 0.8) / 0.5;
        const y = n.y + n.t * 1.8 * scale;
        const w = 0.5 * scale, h = 0.62 * scale;
        const chars = n.text.split('');
        chars.forEach((ch, i) => {
          let idx = '0123456789+-'.indexOf(ch);
          if (ch === 'h') idx = 13;
          if (ch === 'x') idx = 14;
          if (idx < 0) return;
          const u0 = idx * 32 / 512, u1 = (idx * 32 + 32) / 512;
          const off = (i - (chars.length - 1) / 2) * w * 0.82;
          list.push(n.x, y, n.z, off, u0, 0, u1, 1, n.color[0], n.color[1], n.color[2], a, w, h);
        });
      }
      this.numbers = keep;
      gl.disable(gl.DEPTH_TEST);
      this.sprites(list, this.digitTex, false);
      gl.enable(gl.DEPTH_TEST);
    }

    drawDust(dt) {
      const list = [];
      const keep = [];
      for (const d of this.dust) {
        d.t += dt;
        if (d.t > 1.6) continue;
        keep.push(d);
        const a = (1 - d.t / 1.6) * 0.35;
        const s = d.s * (0.6 + d.t * 1.2);
        list.push(d.x, d.y + d.t * 0.8, d.z, 0, 0, 0, 1, 1, d.col[0], d.col[1], d.col[2], a * (this.night ? 0.5 : 1), s, s);
      }
      this.dust = keep;
      this.sprites(list, this.puffTex, false);
    }

    rayAt(mx, my) {
      const cv = this.canvas;
      const rect = cv.getBoundingClientRect();
      const nx = ((mx - rect.left) / rect.width) * 2 - 1, ny = 1 - ((my - rect.top) / rect.height) * 2;
      const a = G.transform(this.ivp, nx, ny, -1), b = G.transform(this.ivp, nx, ny, 1);
      const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
      const l = Math.hypot(dx, dy, dz);
      return [a[0], a[1], a[2], dx / l, dy / l, dz / l];
    }

    pickGround(mx, my) {
      if (!this.ivp) return null;
      const [ox, oy, oz, dx, dy, dz] = this.rayAt(mx, my);
      const t = this.terrain;
      let prev = 0;
      for (let s = 0; s < this.terrain.size * 3; s += 2) {
        const x = ox + dx * s, y = oy + dy * s, z = oz + dz * s;
        if (x < -50 || z < -50 || x > t.size + 50 || z > t.size + 50) { if (s > 200) break; continue; }
        if (y < t.heightAt(L.clamp(x, 0, t.size), L.clamp(z, 0, t.size))) {
          let lo = prev, hi = s;
          for (let i = 0; i < 12; i++) {
            const m = (lo + hi) / 2;
            const px = ox + dx * m, py = oy + dy * m, pz = oz + dz * m;
            if (py < t.heightAt(L.clamp(px, 0, t.size), L.clamp(pz, 0, t.size))) hi = m; else lo = m;
          }
          const x2 = L.clamp(ox + dx * hi, 0, t.size), z2 = L.clamp(oz + dz * hi, 0, t.size);
          return [x2, t.heightAt(x2, z2), z2];
        }
        prev = s;
      }
      return null;
    }

    project(x, y, z) {
      if (!this.vp) return null;
      const m = this.vp;
      const w = m[3] * x + m[7] * y + m[11] * z + m[15];
      if (w < 0.1) return null;
      const cx = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w, cy = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
      return [(cx * 0.5 + 0.5) * this.canvas.clientWidth, (0.5 - cy * 0.5) * this.canvas.clientHeight, w];
    }

    moveCamera(dx, dz) {
      const c = this.cam;
      const s = Math.sin(c.yaw), co = Math.cos(c.yaw);
      c.tx = L.clamp(c.tx + dx * co + dz * s, 20, this.terrain.size - 20);
      c.tz = L.clamp(c.tz - dx * s + dz * co, 20, this.terrain.size - 20);
    }

    zoom(f) {
      const c = this.cam;
      c.dist = L.clamp(c.dist * f, 18, Math.min(900, this.terrain.size * 0.8));
      c.pitch = L.clamp(0.35 + (c.dist - 18) / 700 * 0.9, 0.3, 1.25);
    }

    focus(x, z) {
      this.cam.tx = L.clamp(x, 20, this.terrain.size - 20);
      this.cam.tz = L.clamp(z, 20, this.terrain.size - 20);
    }

    destroy() {
      const ext = this.gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      this.battle = null;
    }
  }

  L.Renderer = Renderer;
  L.ANIM_SLOTS = ANIM;
  L.UNIT_SHADERS = { vs: UNIT_VS, fs: UNIT_FS, decalVs: DECAL_VS, decalFs: DECAL_FS };
})(globalThis.Legion = globalThis.Legion || {});
