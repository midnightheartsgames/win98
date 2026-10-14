(function (Z) {
  'use strict';

  const HEAD = '#version 300 es\nprecision highp float;\nprecision highp int;\nprecision highp sampler2DArray;\n';

  const ENV = `
uniform vec3 uEye;
uniform vec3 uSunDir;
uniform vec3 uSunCol;
uniform vec3 uSkyTop;
uniform vec3 uSkyHor;
uniform vec3 uAmbTop;
uniform vec3 uAmbBot;
uniform vec3 uFogCol;
uniform vec4 uFog;
uniform float uTime;
uniform vec4 uPoint[8];
uniform vec4 uPointCol[8];
uniform int uNumPoints;
uniform highp sampler2DShadow uShadow;
uniform mat4 uShadowVP;
uniform vec4 uShadowP;

float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), u.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), u.x), u.y); }
float fbm2(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }

float shadowAt(vec3 wp, vec3 n){
  if (uShadowP.x < 0.5) return 1.0;
  vec3 off = wp + n * uShadowP.z;
  vec4 sp = uShadowVP * vec4(off, 1.0);
  vec3 c = sp.xyz / sp.w * 0.5 + 0.5;
  if (c.x <= 0.001 || c.y <= 0.001 || c.x >= 0.999 || c.y >= 0.999 || c.z >= 1.0) return 1.0;
  float t = uShadowP.y;
  float s = 0.0;
  s += texture(uShadow, vec3(c.xy + vec2(-0.5, -0.5) * t, c.z - uShadowP.w));
  s += texture(uShadow, vec3(c.xy + vec2( 0.5, -0.5) * t, c.z - uShadowP.w));
  s += texture(uShadow, vec3(c.xy + vec2(-0.5,  0.5) * t, c.z - uShadowP.w));
  s += texture(uShadow, vec3(c.xy + vec2( 0.5,  0.5) * t, c.z - uShadowP.w));
  float edge = smoothstep(0.0, 0.08, min(min(c.x, c.y), min(1.0 - c.x, 1.0 - c.y)));
  return mix(1.0, s * 0.25, edge);
}

vec3 pointLights(vec3 wp, vec3 n){
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 8; i++){
    if (i >= uNumPoints) break;
    vec3 d = uPoint[i].xyz - wp;
    float L = length(d);
    float r = uPoint[i].w;
    if (L > r) continue;
    float att = 1.0 - L / r; att *= att;
    acc += uPointCol[i].rgb * att * (max(dot(n, d / max(L, 0.001)), 0.0) * 0.8 + 0.2);
  }
  return acc;
}

vec3 lit(vec3 albedo, vec3 n, vec3 wp, float ao){
  float ndl = max(dot(n, uSunDir), 0.0);
  float sh = ndl > 0.0 ? shadowAt(wp, n) : 0.0;
  vec3 amb = mix(uAmbBot, uAmbTop, n.y * 0.5 + 0.5) * ao;
  return albedo * (uSunCol * ndl * sh + amb + pointLights(wp, n));
}

vec3 fogged(vec3 col, vec3 wp){
  float d = length(wp - uEye);
  float f = 1.0 - exp(-pow(d * uFog.x, 1.6));
  float hf = uFog.y * exp(-max(wp.y - uFog.z, 0.0) * 0.12) * (1.0 - exp(-d * 0.004));
  vec3 vdir = (wp - uEye) / max(d, 0.001);
  float sunAmt = pow(max(dot(vdir, uSunDir), 0.0), 8.0);
  vec3 fc = mix(uFogCol, uSunCol * 0.9 + uFogCol * 0.4, sunAmt * 0.45);
  return mix(col, fc, clamp(f + hf, 0.0, 1.0));
}

vec3 skyColor(vec3 dir){
  float h = clamp(dir.y, -0.2, 1.0);
  vec3 c = mix(uSkyHor, uSkyTop, pow(max(h, 0.0), 0.55));
  float s = max(dot(dir, uSunDir), 0.0);
  c += uSunCol * (pow(s, 6.0) * 0.25 + pow(s, 64.0) * 0.6);
  c = mix(c, uSkyHor * 0.7, smoothstep(0.0, -0.2, dir.y));
  return c;
}
`;

  const TERRAIN_VS = HEAD + `
layout(location=0) in vec3 aGrid;
uniform highp sampler2D uHeight;
uniform vec4 uNode;
uniform vec4 uMap;
uniform ivec2 uHSize;
uniform mat4 uVP;
out vec3 vPos;
out vec3 vNrm;
float Hf(ivec2 p){ p = clamp(p, ivec2(0), uHSize - 1); return texelFetch(uHeight, p, 0).r; }
void main(){
  vec2 w = uNode.xy + aGrid.xz * uNode.z;
  ivec2 ip = ivec2(floor((w - uMap.xy) / uMap.z + 0.5));
  int st = max(1, int(uNode.z / uMap.z + 0.5));
  float h = Hf(ip);
  float hl = Hf(ip - ivec2(st, 0)), hr = Hf(ip + ivec2(st, 0)), hd = Hf(ip - ivec2(0, st)), hu = Hf(ip + ivec2(0, st));
  vec2 mapEnd = uMap.xy + vec2(uHSize - 1) * uMap.z;
  vec2 od2 = max(max(uMap.xy - w, w - mapEnd), vec2(0.0));
  float od = length(od2);
  if (od > 0.0){
    float k = smoothstep(0.0, 500.0, od);
    float far = 20.0 + (sin(w.x * 0.0031) + sin(w.y * 0.0027 + 1.3)) * 6.0 + sin(w.x * 0.011 + w.y * 0.008) * 2.0;
    float lift = h > 0.4 ? mix(h, far, k) : (h < -0.5 ? h : mix(h, far, k * 0.6));
    h = lift; hl = lift; hr = lift; hd = lift; hu = lift;
  }
  vec3 n = normalize(vec3(hl - hr, 2.0 * uNode.z, hd - hu));
  h -= aGrid.y * (uNode.z * 1.5 + 1.0);
  vPos = vec3(w.x, h, w.y);
  vNrm = n;
  gl_Position = uVP * vec4(vPos, 1.0);
}`;

  const TERRAIN_FS = HEAD + ENV + `
in vec3 vPos;
in vec3 vNrm;
uniform sampler2D uSplat0;
uniform sampler2D uSplat1;
uniform sampler2D uTint;
uniform sampler2DArray uMat;
uniform vec4 uMap;
uniform vec2 uCov;
out vec4 oCol;
const float SC[8] = float[8](3.2, 4.0, 3.0, 3.5, 4.5, 6.0, 3.5, 3.0);
vec3 matTex(int i, vec2 wp, float w){
  vec2 uv = wp / SC[i];
  vec3 a = texture(uMat, vec3(uv, float(i))).rgb;
  vec3 b = texture(uMat, vec3(uv * 0.21 + 0.37, float(i))).rgb;
  return mix(a, a * b * 1.9, 0.45);
}
void main(){
  vec3 n = normalize(vNrm);
  vec2 suv = (vPos.xz - uMap.xy) / (uMap.z * uCov);
  vec4 w0 = texture(uSplat0, suv), w1 = texture(uSplat1, suv);
  vec2 oo = max(max(-suv, suv - 1.0), vec2(0.0));
  float outK = smoothstep(0.0, 0.01, length(oo));
  if (outK > 0.0){
    float fn = vnoise(vPos.xz * 0.004), fn2 = vnoise(vPos.xz * 0.013 + 4.0);
    vec4 g0 = vec4(0.15 + fn2 * 0.2, 0.45 + fn * 0.3, 0.3 - fn * 0.15, fn2 * 0.15);
    w0 = mix(w0, g0, outK); w1 = mix(w1, vec4(0.0), outK);
  }
  float ws[8] = float[8](w0.r, w0.g, w0.b, w0.a, w1.r, w1.g, w1.b, w1.a);
  vec3 col = vec3(0.0);
  float tot = 0.0;
  for (int i = 0; i < 8; i++){
    if (ws[i] > 0.02){ col += matTex(i, vPos.xz, ws[i]) * ws[i]; tot += ws[i]; }
  }
  col /= max(tot, 0.001);
  float slope = 1.0 - n.y;
  float rk = smoothstep(0.28, 0.48, slope + (vnoise(vPos.xz * 0.15) - 0.5) * 0.12);
  if (rk > 0.01){
    vec3 bl = abs(n); bl /= (bl.x + bl.y + bl.z);
    vec3 r = texture(uMat, vec3(vPos.zy / 6.0, 5.0)).rgb * bl.x + texture(uMat, vec3(vPos.xz / 6.0, 5.0)).rgb * bl.y + texture(uMat, vec3(vPos.xy / 6.0, 5.0)).rgb * bl.z;
    col = mix(col, r, rk);
  }
  vec4 tint = texture(uTint, suv);
  col *= mix(vec3(1.0), tint.rgb * 2.0, tint.a);
  float macro = fbm2(vPos.xz * 0.012);
  col *= 0.82 + macro * 0.36;
  float wetline = smoothstep(0.9, 0.0, vPos.y) * 0.35;
  col *= 1.0 - wetline;
  vec3 c = lit(col, n, vPos, 1.0);
  oCol = vec4(fogged(c, vPos), 1.0);
}`;

  const WATER_VS = HEAD + `
layout(location=0) in vec3 aPos;
uniform mat4 uVP;
uniform float uLevel;
out vec3 vPos;
void main(){ vPos = vec3(aPos.x, uLevel, aPos.z); gl_Position = uVP * vec4(vPos, 1.0); }`;

  const WATER_FS = HEAD + ENV + `
in vec3 vPos;
uniform highp sampler2D uHeight;
uniform vec4 uMap;
uniform ivec2 uHSize;
uniform float uLevel;
uniform vec3 uWaterDeep;
uniform vec3 uWaterShallow;
out vec4 oCol;
float Hf(ivec2 p){ p = clamp(p, ivec2(0), uHSize - 1); return texelFetch(uHeight, p, 0).r; }
float terrainH(vec2 w){
  vec2 f = (w - uMap.xy) / uMap.z;
  ivec2 i = ivec2(floor(f)); vec2 t = fract(f);
  return mix(mix(Hf(i), Hf(i + ivec2(1, 0)), t.x), mix(Hf(i + ivec2(0, 1)), Hf(i + ivec2(1, 1)), t.x), t.y);
}
vec2 waveGrad(vec2 p, float t){
  vec2 g = vec2(0.0);
  g += vec2(cos(p.x * 0.31 + t * 0.9 + p.y * 0.12), cos(p.y * 0.27 - t * 0.8)) * 0.05;
  g += vec2(cos(p.x * 0.83 - p.y * 0.4 + t * 1.7), cos(p.y * 0.77 + p.x * 0.3 + t * 1.5)) * 0.03;
  float e = 0.6;
  float n0 = vnoise(p * 0.9 + vec2(t * 0.35, t * 0.2));
  float nx = vnoise((p + vec2(e, 0.0)) * 0.9 + vec2(t * 0.35, t * 0.2));
  float nz = vnoise((p + vec2(0.0, e)) * 0.9 + vec2(t * 0.35, t * 0.2));
  g += vec2(nx - n0, nz - n0) * 0.5;
  float m0 = vnoise(p * 3.1 - vec2(t * 0.6, t * 0.5));
  float mx = vnoise((p + vec2(0.2, 0.0)) * 3.1 - vec2(t * 0.6, t * 0.5));
  float mz = vnoise((p + vec2(0.0, 0.2)) * 3.1 - vec2(t * 0.6, t * 0.5));
  g += vec2(mx - m0, mz - m0) * 0.35;
  return g;
}
void main(){
  float depth = uLevel - terrainH(vPos.xz);
  if (depth <= 0.0) discard;
  vec2 g = waveGrad(vPos.xz, uTime);
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 v = normalize(uEye - vPos);
  float dist = length(uEye - vPos);
  n = normalize(mix(n, vec3(0.0, 1.0, 0.0), smoothstep(80.0, 600.0, dist) * 0.8));
  float fres = 0.03 + 0.97 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 refl = skyColor(reflect(-v, n));
  vec3 body = mix(uWaterShallow, uWaterDeep, smoothstep(0.0, 3.5, depth));
  vec3 amb = mix(uAmbBot, uAmbTop, 0.75);
  vec3 lc = body * (amb + uSunCol * max(uSunDir.y, 0.0) * 0.6);
  float sh = shadowAt(vPos, vec3(0.0, 1.0, 0.0));
  vec3 h = normalize(uSunDir + v);
  float spec = pow(max(dot(n, h), 0.0), 220.0) * 2.2 * sh;
  vec3 col = mix(lc, refl, fres * 0.85) + uSunCol * spec;
  float foam = smoothstep(0.35, 0.0, depth) * (0.55 + 0.45 * sin(uTime * 1.6 + vnoise(vPos.xz * 2.0) * 6.0));
  col = mix(col, vec3(0.85, 0.86, 0.8) * (amb + uSunCol * 0.5), foam * 0.45 * smoothstep(0.0, 0.08, depth));
  float alpha = mix(0.45, 0.94, smoothstep(0.0, 2.2, depth));
  alpha = max(alpha, fres);
  oCol = vec4(fogged(col, vPos), alpha);
}`;

  const SKY_VS = HEAD + `
const vec2 P[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
out vec2 vNdc;
void main(){ vNdc = P[gl_VertexID]; gl_Position = vec4(P[gl_VertexID], 1.0, 1.0); }`;

  const SKY_FS = HEAD + ENV + `
in vec2 vNdc;
uniform mat4 uInvVP;
uniform vec4 uSky;
uniform vec3 uMoonDir;
out vec4 oCol;
void main(){
  vec4 a = uInvVP * vec4(vNdc, -1.0, 1.0), b = uInvVP * vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize(b.xyz / b.w - a.xyz / a.w);
  vec3 c = skyColor(dir);
  float sd = dot(dir, uSunDir);
  c += uSunCol * smoothstep(0.9993, 0.9997, sd) * 3.0;
  if (dir.y > 0.0){
    vec2 cp = dir.xz / (dir.y + 0.08) * 900.0 + vec2(uTime * 6.0, uTime * 2.0);
    float cl = fbm2(cp * 0.0012) * 0.75 + fbm2(cp * 0.0041) * 0.35;
    float cover = uSky.x;
    float dens = smoothstep(1.0 - cover * 0.9 - 0.2, 1.05 - cover * 0.5, cl);
    vec3 cloudLit = mix(uAmbTop * 1.2 + uSkyHor * 0.3, uSunCol * 0.9 + vec3(0.15), clamp(pow(max(sd, 0.0), 3.0) * 0.6 + 0.35, 0.0, 1.0));
    cloudLit = mix(cloudLit, uSkyHor * 0.55, uSky.y);
    c = mix(c, cloudLit, dens * smoothstep(0.0, 0.18, dir.y) * 0.92);
    float st = uSky.z;
    if (st > 0.0){
      vec2 sp = dir.xz / (dir.y + 0.35) * 260.0;
      float s = hash12(floor(sp));
      float tw = 0.6 + 0.4 * sin(uTime * 3.0 + s * 40.0);
      c += vec3(0.9, 0.92, 1.0) * step(0.9965, s) * st * tw * (1.0 - dens) * smoothstep(0.0, 0.3, dir.y);
    }
    float md = dot(dir, uMoonDir);
    c += vec3(0.75, 0.78, 0.82) * smoothstep(0.99955, 0.9998, md) * uSky.w;
    c += vec3(0.3, 0.32, 0.38) * pow(max(md, 0.0), 120.0) * uSky.w * 0.5;
  }
  oCol = vec4(c, 1.0);
}`;


  const WORLD_ATTR = `
layout(location=0) in vec3 aPos;
layout(location=1) in vec4 aNrm;
layout(location=2) in vec2 aUV;
layout(location=3) in vec4 aCol;
layout(location=4) in uvec4 aMat;
`;

  const WORLD_VS = HEAD + WORLD_ATTR + `
uniform mat4 uVP;
uniform mat4 uModel;
out vec3 vPos;
out vec3 vNrm;
out vec2 vUV;
out vec4 vCol;
flat out uvec4 vMat;
void main(){
  vec4 wp = uModel * vec4(aPos, 1.0);
  vPos = wp.xyz;
  vNrm = mat3(uModel) * aNrm.xyz;
  vUV = aUV; vCol = aCol; vMat = aMat;
  gl_Position = uVP * wp;
}`;

  const TREE_VS = HEAD + WORLD_ATTR + `
layout(location=5) in vec4 iPos;
layout(location=6) in vec4 iPar;
uniform mat4 uVP;
uniform float uTime;
uniform float uWind;
out vec3 vPos;
out vec3 vNrm;
out vec2 vUV;
out vec4 vCol;
flat out uvec4 vMat;
void main(){
  float c = cos(iPos.w), s = sin(iPos.w), sc = iPar.x;
  vec3 p = aPos * sc;
  if (aMat.x >= 128u){
    float ph = iPar.z * 6.283 + uTime * (1.3 + uWind);
    float k = max(p.y - 1.5, 0.0) * 0.012 * (0.6 + uWind);
    p.x += sin(ph + p.y * 0.3) * k * 3.0;
    p.z += cos(ph * 0.8 + p.x * 0.4) * k * 2.0;
  }
  vec3 r = vec3(p.x * c - p.z * s, p.y, p.x * s + p.z * c);
  vec3 n = aNrm.xyz;
  vNrm = vec3(n.x * c - n.z * s, n.y, n.x * s + n.z * c);
  vPos = iPos.xyz + r;
  vUV = aUV;
  float t = iPar.y;
  vCol = vec4(aCol.rgb * (0.85 + t * 0.3) * vec3(1.0 + (t - 0.5) * 0.12, 1.0, 1.0 - (t - 0.5) * 0.1), aCol.a);
  vMat = aMat;
  gl_Position = uVP * vec4(vPos, 1.0);
}`;

  const WORLD_FS = HEAD + ENV + `
in vec3 vPos;
in vec3 vNrm;
in vec2 vUV;
in vec4 vCol;
flat in uvec4 vMat;
uniform sampler2DArray uMats;
uniform sampler2DArray uFac;
uniform sampler2DArray uLeaf;
uniform sampler2DArray uFace;
uniform uint uGlow;
out vec4 oCol;
void main(){
  uint m = vMat.x;
  vec3 alb;
  vec3 n = normalize(vNrm);
  float leaf = 0.0;
  if (m >= 192u){
    alb = texture(uFace, vec3(vUV, float(m - 192u))).rgb;
  } else if (m >= 128u){
    vec4 t = texture(uLeaf, vec3(vUV, float(m - 128u)));
    if (t.a < 0.42) discard;
    alb = t.rgb;
    leaf = 1.0;
  } else if (m >= 64u){
    vec2 mo = floor(vUV), f = fract(vUV);
    float seed = float(vMat.y), dmg = float(vMat.z) / 255.0;
    float h = hash12(mo + vec2(seed * 0.731 + 3.1, seed * 1.37));
    float h2 = hash12(mo * 1.71 + seed * 0.11 + 7.0);
    int var = 0;
    if (h < dmg * 0.6) var = h2 < 0.35 ? 3 : 1;
    else if (h < dmg * 0.6 + 0.05 + dmg * 0.15) var = 2;
    vec2 q = (vec2(float(var % 2), float(var / 2)) + f) * 0.5;
    alb = textureGrad(uFac, vec3(q, float(m - 64u)), dFdx(vUV) * 0.5, dFdy(vUV) * 0.5).rgb;
    float streak = smoothstep(0.55, 0.9, vnoise(vec2(vPos.x * 0.7 + vPos.z * 0.7, vPos.y * 0.08)));
    alb *= 1.0 - streak * 0.25 * (0.4 + dmg);
  } else {
    alb = texture(uMats, vec3(vUV, float(m))).rgb;
  }
  alb *= vCol.rgb * 2.0;
  if ((vMat.w & 2u) == 0u){
    float g = fbm2(vPos.xz * 0.21 + vPos.y * 0.07);
    alb *= 0.86 + 0.28 * g;
  }
  vec3 c;
  if (leaf > 0.5){
    float ndl = dot(n, uSunDir) * 0.5 + 0.5;
    float sh = shadowAt(vPos, vec3(0.0, 1.0, 0.0));
    vec3 amb = mix(uAmbBot, uAmbTop, 0.7);
    c = alb * (uSunCol * ndl * sh * 0.95 + amb * 1.05 + pointLights(vPos, n));
  } else {
    if (!gl_FrontFacing) n = -n;
    c = lit(alb, n, vPos, vCol.a);
  }
  if ((vMat.w & 1u) != 0u || m == uGlow) c = alb * 1.6;
  oCol = vec4(fogged(c, vPos), 1.0);
}`;

  const SKIN_VS = HEAD + WORLD_ATTR + `
uniform mat4 uVP;
uniform mat4 uBones[32];
out vec3 vPos;
out vec3 vNrm;
out vec2 vUV;
out vec4 vCol;
flat out uvec4 vMat;
void main(){
  float w = float(aMat.z) / 255.0;
  mat4 B = uBones[aMat.w];
  if (w > 0.0) B = B * (1.0 - w) + uBones[aMat.y] * w;
  vec4 wp = B * vec4(aPos, 1.0);
  vPos = wp.xyz;
  vNrm = mat3(B) * aNrm.xyz;
  vUV = aUV; vCol = aCol; vMat = uvec4(aMat.x, 0u, 0u, 2u);
  gl_Position = uVP * wp;
}`;

  const DEPTH_FS = HEAD + `
out vec4 oCol;
void main(){ oCol = vec4(1.0); }`;

  const DEPTH_LEAF_FS = HEAD + `
in vec2 vUV;
flat in uvec4 vMat;
uniform sampler2DArray uLeaf;
out vec4 oCol;
void main(){
  if (vMat.x >= 128u){ if (texture(uLeaf, vec3(vUV, float(vMat.x - 128u))).a < 0.42) discard; }
  oCol = vec4(1.0);
}`;

  Z.GLSL = { HEAD, ENV, TERRAIN_VS, TERRAIN_FS, WATER_VS, WATER_FS, SKY_VS, SKY_FS, WORLD_VS, TREE_VS, WORLD_FS, DEPTH_FS, DEPTH_LEAF_FS, SKIN_VS };
})(globalThis.FalloutZP = globalThis.FalloutZP || {});
