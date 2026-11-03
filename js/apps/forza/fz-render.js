(function (F) {
  'use strict';

  const M4 = F.M4;
  const GROUND_DECALS = new Set(['chevron', 'smoke', 'carshadow', 'splash']);
  const LOD_DIST = [25, 120];
  const BLUR_RATE = 30;
  const WIPE_T = 1.3;
  const BRAKE_DIST = 12;
  const DETAIL_DIST = 420;
  const IDENT3 = new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  const ZERO3 = new Float32Array(3);
  const BLUR_C = new Float32Array([0.5, 0.52]);
  const WIND_DIR = [0.92, 0.39];
  const FLORA_R = [0, 95, 150], GRASS_R = [0, 55, 95], GRASS_D = [0, 0.55, 1], LOD_BAND = 14;
  const SHADOW_HALF = 85;
  const CABIN_BIAS = new Float32Array([1.6 * 6.4 / 512, 0.006 / 20, 0.012 / 20, 0.0006]);

  const ANIM = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define FP highp
#else
#define FP mediump
#endif
attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aNrm; attribute vec4 aCol;
uniform FP float uTime; uniform vec4 uWind; uniform vec4 uPush[2];
vec3 animate(vec3 p, float mat, inout vec3 n) {
  if (mat > 17.5 && mat < 20.5 && aCol.a > 0.0) {
    float amp = aCol.a * 0.5, ph = dot(p.xz, vec2(0.19, 0.13));
    float g = sin(uTime * 1.3 + ph) * 0.6 + sin(uTime * 2.7 + ph * 1.9) * 0.3 + sin(uTime * 5.3 + ph * 3.7) * 0.1;
    vec2 d = uWind.xy * (uWind.z * (0.45 + 0.55 * g) + uWind.w) * amp;
    if (mat < 19.5) d += vec2(-uWind.y, uWind.x) * sin(uTime * 7.1 + ph * 9.0) * amp * uWind.z * 0.25;
    for (int i = 0; i < 2; i++) {
      vec2 q = p.xz - uPush[i].xy;
      float r = length(q), f = uPush[i].w * max(0.0, 1.0 - r / max(uPush[i].z, 0.1));
      d += q / max(r, 0.3) * f * sin(uTime * 19.0 + r * 2.0) * min(1.0, amp * 6.0);
    }
    p.xz += d;
  }
  if (mat > 15.5 && mat < 16.5) {
    float cx = (floor(p.x / 0.3) + 0.5) * 0.3, ph = (uTime + cx * 0.08) / 7.0;
    float a = (floor(ph) + smoothstep(0.84, 1.0, fract(ph))) * 2.0944, ca = cos(a), sa = sin(a);
    vec2 q = vec2(p.x - cx, p.z);
    p.x = cx + q.x * ca - q.y * sa; p.z = q.x * sa + q.y * ca;
    n = vec3(n.x * ca - n.z * sa, n.y, n.x * sa + n.z * ca);
  }
  return p;
}`;

  const VS = ANIM + `
uniform mat4 uVP; uniform mat4 uModel; uniform mat4 uShadowVP;
uniform float uLights; uniform float uBrake; uniform float uReverse; uniform FP float uNight;
varying vec2 vUV; varying vec4 vCol; varying float vMat; varying float vEmis; varying vec3 vWPos; varying vec3 vN; varying vec4 vSh; varying vec3 vObj;
void main() {
  float mat = floor(aNrm.w * 127.0 + 0.5);
  vec3 n = aNrm.xyz;
  vec3 p = animate(aPos, mat, n);
  vec4 wp = uModel * vec4(p, 1.0);
  gl_Position = uVP * wp;
  vN = mat3(uModel) * n;
  vMat = mat;
  vUV = aUV;
  vCol = aCol;
  vWPos = wp.xyz;
  vObj = p;
  vEmis = 0.0;
  if (mat > 2.5 && mat < 3.5) vEmis = uLights;
  if (mat > 3.5 && mat < 4.5) vEmis = uLights * 0.45 + uBrake;
  if (mat > 7.5 && mat < 8.5) vEmis = uNight;
  if (mat > 9.5 && mat < 10.5) vEmis = uNight;
  if (mat > 12.5 && mat < 13.5) vEmis = uReverse * 0.55;
  if (mat > 14.5 && mat < 16.5) vEmis = uNight * aCol.a;
  if (mat > 5.5 && mat < 6.5) vUV = aUV + vec2(uTime * 0.012, uTime * 0.007);
  vSh = uShadowVP * wp;
}`;

  const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex; uniform samplerCube uEnv; uniform sampler2D uShadow; uniform sampler2D uMask2; uniform float uSkin; uniform float uMetal; uniform float uDirt;
uniform float uCabin; uniform float uInGlass; uniform float uRainK; uniform vec4 uWipe; uniform vec4 uPiv; uniform vec4 uGlass; uniform float uWipeLen; uniform float uWipeA;
uniform vec3 uCam; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uAmb; uniform vec3 uGroundCol;
uniform vec2 uFog; uniform float uFogScale; uniform vec3 uFogCol; uniform vec3 uSkyCol;
uniform float uAlphaTest; uniform vec3 uPaint1; uniform vec3 uPaint2;
uniform float uNight; uniform float uDither; uniform float uAlpha; uniform float uWet; uniform float uTime; uniform float uFlat; uniform float uFlood;
uniform float uShadowOn; uniform float uShadowTexel; uniform mat3 uShadowN; uniform vec4 uShadowBias; uniform float uCaster; uniform float uRoad; uniform float uSpecK; uniform float uInside; uniform vec3 uDial;
uniform vec4 uSpotPos[4]; uniform vec4 uSpotDir[4]; uniform vec4 uLamp[8]; uniform vec3 uLampCol;
uniform sampler2D uClouds; uniform vec4 uCloud; uniform float uCloudSh; uniform float uRain; uniform vec4 uMist; uniform vec4 uLod;
varying vec2 vUV; varying vec4 vCol; varying float vMat; varying float vEmis; varying vec3 vWPos; varying vec3 vN; varying vec4 vSh; varying vec3 vObj;
float bayer(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  vec2 a = mod(q, 2.0); vec2 b = floor(q / 2.0);
  float ba = a.x * 2.0 + a.y * 3.0 - 4.0 * a.x * a.y;
  float bb = b.x * 2.0 + b.y * 3.0 - 4.0 * b.x * b.y;
  return (ba * 4.0 + bb + 0.5) / 16.0;
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p); vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float unpackDepth(vec4 c) { return dot(c, vec4(1.0, 1.0 / 255.0, 1.0 / 65025.0, 1.0 / 16581375.0)); }
float crackAt(vec2 p, float R, float px) {
  float r = length(p);
  if (R <= 0.0 || r > R) return 0.0;
  float a = atan(p.y, p.x) * 2.07 + 7.0;
  float id = floor(a);
  float off = hash(vec2(id, 4.1)) - 0.5;
  float wob = (vnoise(vec2(r * 7.0, id * 3.3)) - 0.5) * 0.5;
  float da = abs(fract(a) - 0.5 - off * 0.6 + wob * (0.4 + r));
  float rad = 1.0 - smoothstep(0.0, 0.003 + 0.003 * (1.0 - r / R) + px, da / 2.07 * r);
  float q = r * 8.5 + hash(vec2(id, 1.7)) * 0.9;
  float rid = floor(q);
  float ring = (1.0 - smoothstep(0.0, 0.03 + px * 8.5, abs(fract(q) - 0.5) / 1.0)) * step(hash(vec2(id, rid)), 0.6) * step(0.06, r);
  float core = 1.0 - smoothstep(0.012, 0.055, r);
  float fade = 1.0 - smoothstep(R * 0.62, R, r);
  return clamp(max(max(rad, ring * 0.75), core), 0.0, 1.0) * fade;
}
float shadowRow(vec2 q, float d, vec4 w) {
  float t = uShadowTexel;
  return step(d, unpackDepth(texture2D(uShadow, q - vec2(t, 0.0)))) * w.x + step(d, unpackDepth(texture2D(uShadow, q))) * w.y
    + step(d, unpackDepth(texture2D(uShadow, q + vec2(t, 0.0)))) * w.z + step(d, unpackDepth(texture2D(uShadow, q + vec2(2.0 * t, 0.0)))) * w.w;
}
float shadowAt(vec3 N, bool leaf) {
  if (uShadowOn < 0.5) return 1.0;
  float nl = clamp(dot(N, uSunDir), 0.0, 1.0), sl = sqrt(1.0 - nl * nl);
  vec3 p = vSh.xyz / vSh.w * 0.5 + 0.5;
  float d;
  if (leaf) d = p.z - uShadowBias.w * (1.0 + 3.67 * (1.0 - nl));
  else {
    p += uShadowN * (N * (uShadowBias.x * sl * uCaster));
    d = p.z - uShadowBias.y - uShadowBias.z * sl * uCaster;
  }
  if (p.x <= 0.0 || p.x >= 1.0 || p.y <= 0.0 || p.y >= 1.0 || p.z >= 1.0) return 1.0;
  vec2 g = p.xy / uShadowTexel - 0.5;
  vec2 f = fract(g), h = 1.0 - f, t = vec2(0.0, uShadowTexel);
  vec4 wx = vec4(h.x * h.x, 2.0 - f.x * f.x, 2.0 - h.x * h.x, f.x * f.x) * 0.25, wy = vec4(h.y * h.y, 2.0 - f.y * f.y, 2.0 - h.y * h.y, f.y * f.y) * 0.25;
  vec2 b = (floor(g) + 0.5) * uShadowTexel;
  float s = shadowRow(b - t, d, wx) * wy.x + shadowRow(b, d, wx) * wy.y + shadowRow(b + t, d, wx) * wy.z + shadowRow(b + t * 2.0, d, wx) * wy.w;
  vec2 e = min(p.xy, 1.0 - p.xy);
  return mix(1.0, s, smoothstep(0.0, 0.07, min(e.x, e.y)));
}
vec3 envAt(vec3 r, float b) { return textureCube(uEnv, r, b).rgb; }
float wipedAgo(vec2 p, vec2 piv) {
  vec2 d = p - piv;
  if (uWipe.z < 0.5 || d.y < -0.03 || length(d) > uWipeLen) return 99.0;
  float th = atan(max(d.y, 0.0), d.x);
  if (th > uWipeA) return 99.0;
  float c = acos(1.0 - 2.0 * th / uWipeA) / 6.2832;
  float ph = fract(uWipe.x / uWipe.y);
  float last = ph >= 1.0 - c ? 1.0 - c : (ph >= c ? c : -c);
  return (ph - last) * uWipe.y;
}
vec3 shoulder(vec3 c, float knee) {
  float mx = max(c.r, max(c.g, c.b));
  if (mx <= knee) return c;
  float k = mx - knee;
  float m = knee + k / (1.0 + k / (1.0 - knee));
  return mix(c * (m / mx), vec3(m), clamp((mx - 1.0) * 0.3, 0.0, 0.3));
}
void main() {
  vec4 t = texture2D(uTex, vUV);
  if (uAlphaTest > 0.5 && t.a < 0.5) discard;
  float m = vMat;
  float pm = 1.0, p2 = 0.0;
  if (uSkin > 0.5) { pm = t.a; p2 = texture2D(uMask2, vUV).r; t.a = 1.0; }
  bool cracked = m > 16.5 && m < 17.5;
  bool glass = (m > 4.5 && m < 5.5) || cracked;
  vec3 base = cracked ? vCol.rgb : t.rgb * vCol.rgb;
  float a = uAlpha;
  bool painted = m > 0.5 && m < 2.5;
  bool trim = m > 10.5 && m < 11.5;
  bool lens = (m > 2.5 && m < 4.5) || (m > 11.5 && m < 13.5);
  float inside = max(uInside, step(13.5, m) * step(m, 14.5));
  if (m > 0.5 && m < 1.5) base *= mix(vec3(1.0), mix(uPaint1, uPaint2, p2), pm);
  if (m > 1.5 && m < 2.5) base *= mix(vec3(1.0), uPaint2, pm);
  float dirt = 0.0;
  if (uDirt > 0.0 && (painted || trim || m < 0.5)) {
    dirt = uDirt * (1.0 - smoothstep(0.12, 0.95, vObj.y)) * (0.45 + 0.55 * vnoise(vUV * 90.0 + vec2(vObj.y * 3.0, 0.0)));
    dirt = clamp(dirt * 1.6, 0.0, 0.85);
    base = mix(base, vec3(0.34, 0.29, 0.23), dirt);
  }
  bool leaf = m > 17.5 && m < 19.5;
  bool skinM = m > 20.5 && m < 21.5;
  vec3 N = normalize(vN);
  if (!gl_FrontFacing && !leaf) N = -N;
  vec3 toCam = uCam - vWPos;
  float dist = length(toCam);
  if (uLod.z > 0.5) {
    float lt = smoothstep(uLod.x - uLod.y, uLod.x + uLod.y, dist), th = bayer(gl_FragCoord.xy);
    if (uLod.z < 1.5 ? lt > th : lt <= th) discard;
  }
  vec3 V = toCam / max(dist, 0.001);
  float ndl = leaf ? clamp((dot(N, uSunDir) + 0.45) / 1.45, 0.0, 1.0) : skinM ? clamp((dot(N, uSunDir) + 0.2) / 1.2, 0.0, 1.0) : max(dot(N, uSunDir), 0.0);
  float sh = ndl > 0.0 ? shadowAt(N, leaf) : 1.0;
  if (uCloudSh > 0.0) sh *= 1.0 - uCloudSh * smoothstep(uCloud.x, uCloud.x + uCloud.y, texture2D(uClouds, vWPos.xz * 0.00042 + uCloud.zw).r);
  vec3 hemi = mix(uGroundCol, uAmb, N.y * 0.5 + 0.5);
  float sunK = 1.0 - 0.7 * inside * (1.0 - uCabin);
  vec3 cabin = mix(hemi, (uAmb + uGroundCol) * 0.5, 0.7 * inside) * (1.0 - 0.15 * inside);
  vec3 light = mix(cabin + uSunCol * ndl * sh * sunK, vec3(1.0), uFlat);
  if (leaf) light += uSunCol * pow(max(dot(-V, uSunDir), 0.0), 4.0) * 0.42 * (0.35 + 0.65 * sh) * (1.0 - uFlat);
  vec3 local = vec3(0.0);
  if (uNight > 0.05) {
    for (int i = 0; i < 4; i++) {
      vec4 sp = uSpotPos[i];
      if (sp.w <= 0.0) continue;
      vec3 dv = vWPos - sp.xyz;
      float dd = length(dv);
      vec3 dir = dv / max(dd, 0.001);
      float cone = smoothstep(0.8, 0.95, dot(dir, uSpotDir[i].xyz));
      float att = sp.w * cone / (1.0 + dd * dd * 0.003) * (1.0 - smoothstep(45.0, 85.0, dd));
      local += vec3(1.0, 0.93, 0.8) * att * (0.25 + 0.75 * max(dot(N, -dir), 0.0));
    }
    for (int i = 0; i < 8; i++) {
      vec4 lp = uLamp[i];
      if (lp.w <= 0.0) continue;
      vec3 dv = lp.xyz - vWPos;
      float dd = length(dv);
      float att = max(0.0, 1.0 - dd / lp.w);
      local += uLampCol * att * att * (0.3 + 0.7 * max(dot(N, dv / max(dd, 0.001)), 0.0));
    }
    local *= uNight;
  }
  vec3 c = base * (light + local);
  c += base * vec3(1.0, 0.88, 0.72) * uFlood * (0.45 + 0.55 * max(dot(N, V), 0.0));
  float specK = 0.035, shin = 18.0;
  if (painted) { specK = 0.6; shin = 280.0; }
  else if (m > 14.5 && m < 16.5) { specK = 0.12; shin = 40.0; }
  else if (skinM) { specK = 0.1; shin = 14.0; }
  else if (glass) { specK = 0.9; shin = 160.0; }
  else if (m > 6.5 && m < 7.5) { specK = 0.9; shin = 70.0; }
  else if (trim) { specK = 0.14; shin = 32.0; }
  else if (lens) { specK = 0.8; shin = 150.0; }
  float wetRoad = uRoad * uWet;
  if (uRoad > 0.5) { specK = 0.05 + 0.55 * wetRoad; shin = 24.0 + 90.0 * wetRoad; }
  vec3 H = normalize(uSunDir + V);
  float ndh = max(dot(N, H), 0.0);
  float lit = sh * step(0.001, ndl) * uSpecK * sunK;
  float spec = pow(ndh, shin) * specK * lit * (1.0 - dirt);
  c += uSunCol * spec;
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
  vec3 R = reflect(-V, N);
  if (painted) {
    float fc = (0.045 + 0.955 * fres) * uSpecK * (1.0 - dirt * 0.85) * (1.0 + 0.3 * uWet);
    if (uMetal > 0.5) {
      vec3 tint = base / max(max(base.r, max(base.g, base.b)), 0.05);
      c = c * 0.8 + tint * envAt(R, 2.5) * 0.28 * uSpecK * (1.0 - dirt) + base * uSunCol * pow(ndh, 26.0) * 0.5 * lit;
      c += uSunCol * step(0.955, hash(floor(vUV * 1400.0))) * pow(ndh, 90.0) * lit * clamp(1.0 - dist / 22.0, 0.0, 1.0) * 2.0 * (1.0 - dirt);
    } else c += uSunCol * pow(ndh, 30.0) * 0.07 * lit * (1.0 - dirt);
    c = c * (1.0 - fc) * (1.0 - 0.12 * uWet) + (envAt(R, 0.0) + local * 0.3) * fc;
  } else if (glass && uInGlass > 0.5) {
    float wide = step(abs(vObj.x), uGlass.w), front = step(vObj.z, uGlass.z) * wide;
    vec2 gp = wide > 0.5 ? vec2(vObj.x, (vObj.y - uGlass.x) * uGlass.y) : vec2(vObj.z, vObj.y);
    float ago = front > 0.5 ? min(wipedAgo(gp, uPiv.xy), wipedAgo(gp, uPiv.zw)) : 99.0;
    vec2 q = gp * 24.0, cell = floor(q);
    vec2 f = fract(q) - 0.5 - (vec2(hash(cell + 1.7), hash(cell + 9.2)) - 0.5) * 0.5;
    float rr = 0.1 + 0.22 * hash(cell + 4.4);
    float drop = (1.0 - smoothstep(rr * 0.55, rr, length(f))) * step(hash(cell + 2.9) * 6.0, ago) * step(0.35, hash(cell + 6.1)) * uRainK;
    float glare = pow(max(dot(-V, uSunDir), 0.0), 8.0) * (1.0 - uNight) * uSpecK;
    float haze = glare * (0.4 + 0.3 * vnoise(gp * 9.0 + vec2(gp.y * 2.0, 0.0)));
    vec3 dc = mix(uAmb * 0.95 + uSunCol * 0.25, uAmb * 0.3, smoothstep(-rr, rr, f.y));
    c = mix(uSunCol * 0.9 + vec3(0.08), dc, drop);
    a = clamp(0.03 + haze * 0.55 + drop * 0.6, 0.0, 0.9);
    if (cracked) {
      float ck = crackAt(vUV, vCol.a * 1.6, 0.0006);
      c = mix(c, (uAmb + uSunCol * 0.4) * 0.75 + vec3(0.05), ck * 0.8);
      a = max(a, ck * 0.62);
    }
  } else if (glass) {
    c = mix(base * light * 0.35, envAt(R, 0.0) + local * 0.4, 0.18 + 0.72 * fres) + uSunCol * spec;
    a = min(a, 0.45 + 0.52 * fres + spec);
    if (uSpecK < 0.5) { c *= 0.55; a = max(a, 0.66); }
    if (cracked) {
      float ck = crackAt(vUV, vCol.a * 1.6, dist * 0.0011);
      c = mix(c, vec3(0.8, 0.84, 0.88) * (light * 0.7 + 0.22) + local * 0.3, ck * 0.85);
      a = max(a, ck * 0.92);
    }
  } else if (m > 6.5 && m < 7.5) {
    c = mix(c, envAt(R, 0.0) * 1.1, 0.65);
  } else if (trim) {
    c = mix(c, envAt(R, 4.0) * 0.55, (0.04 + 0.3 * fres) * uSpecK * (1.0 - dirt));
  } else if (lens) {
    c = mix(c, envAt(R, 0.5), (0.1 + 0.55 * fres) * uSpecK);
  } else if (m > 5.5 && m < 6.5) {
    float e = 0.04;
    float h0 = texture2D(uTex, vUV * 1.6).r + texture2D(uTex, vUV * 2.3 + vec2(uTime * 0.01, -uTime * 0.008)).r;
    float hx = texture2D(uTex, vUV * 1.6 + vec2(e, 0.0)).r + texture2D(uTex, vUV * 2.3 + vec2(uTime * 0.01 + e, -uTime * 0.008)).r;
    float hz = texture2D(uTex, vUV * 1.6 + vec2(0.0, e)).r + texture2D(uTex, vUV * 2.3 + vec2(uTime * 0.01, -uTime * 0.008 + e)).r;
    vec3 Nw = normalize(vec3((h0 - hx) * 2.2, 1.0, (h0 - hz) * 2.2));
    vec3 Rw = reflect(-V, Nw);
    float fw = 0.03 + 0.97 * pow(1.0 - max(dot(Nw, V), 0.0), 5.0);
    vec3 sky = mix(uSkyCol, envAt(Rw, 0.0), 0.5);
    vec3 deep = vec3(0.06, 0.14, 0.18) * (hemi + uSunCol * 0.25);
    c = mix(deep, sky, clamp(fw * 1.2 + 0.18, 0.0, 1.0)) + local * 0.25;
    c += uSunCol * pow(max(dot(Rw, uSunDir), 0.0), 420.0) * 2.2 * sh * uSpecK;
  } else if (m > 8.5 && m < 9.5) {
    if (t.a < 0.999 && uNight > 0.01) {
      vec2 cell = floor(vUV + vec2(0.001));
      float on = step(hash(cell + floor(vWPos.xz / 30.0)), vCol.a * 0.95);
      c = mix(c, vec3(1.0, 0.82, 0.52) * (0.75 + 0.25 * hash(cell * 1.7)), on * uNight * 0.92);
    }
  }
  if (wetRoad > 0.0) {
    float pud = smoothstep(0.5, 0.72, vnoise(vWPos.xz * 0.11) * 0.7 + vnoise(vWPos.xz * 0.5) * 0.3);
    vec3 Nr = vec3(0.0, 1.0, 0.0);
    if (uRain > 0.01 && dist < 70.0) {
      vec2 q = vWPos.xz * 1.7, cell = floor(q);
      vec2 f = fract(q) - 0.5 - (vec2(hash(cell), hash(cell + 3.1)) - 0.5) * 0.5;
      float ph = fract(uTime * 1.4 + hash(cell + 7.7)), r = length(f);
      float ring = (1.0 - smoothstep(0.0, 0.07, abs(r - ph * 0.48))) * (1.0 - ph) * step(hash(cell + 1.3), uRain * 0.9);
      Nr = normalize(vec3(f.x * ring * 2.2, 1.0, f.y * ring * 2.2));
      pud = max(pud, ring * 0.6);
    }
    vec3 refl = mix(uSkyCol, envAt(reflect(-V, Nr), 1.5), 0.5) + local * 0.6;
    c = mix(c * (1.0 - 0.28 * wetRoad), refl, (0.06 + 0.55 * pud) * (0.25 + 0.75 * fres) * wetRoad);
  } else if (uWet > 0.0 && (m < 0.5 || trim || (m > 17.5 && m < 20.5))) c *= 1.0 - uWet * 0.25;
  if (m > 9.5 && m < 10.5) c += base * uDial * vEmis;
  else if (m > 14.5 && m < 16.5) c += base * vEmis * 0.95;
  else c += base * vEmis * 1.4 + vec3(vEmis) * 0.25;
  c = shoulder(c, 0.84);
  float fog = clamp((uFog.y - dist * uFogScale) / max(1.0, uFog.y - uFog.x), 0.0, 1.0);
  vec3 fogC = uFogCol;
  if (uMist.x > 0.0) {
    float hk = (vWPos.y - uCam.y) * uMist.y;
    float along = abs(hk) > 0.002 ? (1.0 - exp(-hk)) / hk : 1.0;
    fog = min(fog, exp(-uMist.x * exp(-(uCam.y - uMist.z) * uMist.y) * dist * along));
    fogC += uSunCol * pow(max(dot(-V, uSunDir), 0.0), 5.0) * uMist.w;
  }
  c = mix(fogC, c, fog);
  if (uDither > 0.5) {
    float b = bayer(gl_FragCoord.xy);
    c = floor(c * vec3(31.0, 63.0, 31.0) + b) / vec3(31.0, 63.0, 31.0);
  }
  gl_FragColor = vec4(c, a * t.a);
}`;

  const SKY_VS = `
attribute vec2 aP; varying vec2 vP;
void main() { vP = aP; gl_Position = vec4(aP, 0.9999, 1.0); }`;

  const SKY_FN = `
uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uFogC; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform sampler2D uClouds; uniform float uTime; uniform float uCover; uniform float uNight; uniform vec3 uCloudCol;
uniform vec4 uWx; uniform vec4 uFlash; uniform vec2 uDrift; uniform vec3 uMistS;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float cloudAt(vec2 uv) {
  vec4 a = texture2D(uClouds, uv);
  vec4 b = texture2D(uClouds, uv * 3.1 + (a.b - 0.5) * 0.22 + vec2(0.37, 0.11));
  return a.r * 0.55 + a.g * 0.2 + b.g * 0.25;
}
vec3 skyCol(vec3 d, out float occ) {
  occ = 0.0;
  float h = clamp(d.y, -0.2, 1.0), hp = max(h, 0.0);
  float sd = dot(d, uSunDir);
  float clearSky = 1.0 - uCover * 0.85;
  float up = smoothstep(-0.04, 0.02, uWx.z) * (1.0 - uNight * 0.7);
  vec2 dh = normalize(d.xz + vec2(0.0001)), sh = normalize(uSunDir.xz + vec2(0.0001));
  float toward = dot(dh, sh) * 0.5 + 0.5;
  vec3 c = mix(uHor, uTop, pow(hp, 0.5));
  c += uSunCol * (1.0 - smoothstep(0.0, 0.32, hp)) * pow(toward, 4.0) * 0.24 * clearSky * up;
  c += uSunCol * 0.0128 / pow(1.36 - 1.2 * sd, 1.5) * clearSky * up;
  c = mix(uFogC, c, smoothstep(-0.01, 0.09, h));
  float sp = max(sd, 0.0);
  vec3 core = mix(uSunCol, vec3(max(uSunCol.r, max(uSunCol.g, uSunCol.b))), 0.6 * smoothstep(0.04, 0.3, uWx.z));
  c += (core * smoothstep(0.99955, 0.9998, sd) * 4.0 + uSunCol * (pow(sp, 900.0) * 1.2 + pow(sp, 24.0) * 0.1)) * up;
  float starK = smoothstep(0.5, 0.92, uNight);
  if (starK > 0.0 && d.y > 0.0) {
    vec2 g = floor(vec2(atan(d.x, d.z) * 190.0, d.y * 260.0));
    float s = step(0.9965, hash(g)) * (0.75 + 0.25 * sin(uTime * 2.3 + hash(g + 7.0) * 60.0));
    c += vec3(s) * starK * (0.6 + 0.4 * hash(g + 3.0)) * smoothstep(0.02, 0.2, d.y) * (1.0 - uCover);
    vec3 md = normalize(vec3(-uSunDir.x, 0.42, -uSunDir.z));
    float mc = dot(d, md);
    float crater = 0.82 + 0.18 * hash(floor(d.xz * 700.0));
    c += vec3(0.86, 0.9, 1.0) * (smoothstep(0.99935, 0.9996, mc) * 1.3 * crater + pow(max(mc, 0.0), 160.0) * 0.12) * starK * (1.0 - uCover * 0.8);
  }
  if (uWx.x > 0.01 && d.y < 0.24) {
    vec2 ring = dh * 0.31 + vec2(0.5, uTime * 0.0005);
    float shaft = smoothstep(0.35, 0.72, texture2D(uClouds, ring).r) * (1.0 - smoothstep(0.0, 0.24, hp)) * uWx.x;
    c = mix(c, uFogC * 0.72, shaft * 0.5);
  }
  if (d.y > 0.0) {
    float horizonK = smoothstep(0.0, 0.16, d.y);
    vec2 uv = d.xz / (d.y + 0.07) * 0.13 + uDrift;
    float th = mix(0.7, 0.14, uCover), soft = mix(0.12, 0.4, uCover);
    float n0 = cloudAt(uv);
    float dens = smoothstep(th, th + soft, n0);
    vec2 st = sh * 0.03;
    float o1 = smoothstep(th, th + soft, cloudAt(uv + st)), o2 = smoothstep(th, th + soft, cloudAt(uv + st * 2.6));
    float lightT = exp(-(o1 * 1.3 + o2 * 0.9) * (0.9 + uCover * 1.2));
    vec3 skyAmb = mix(uHor, uTop, 0.55);
    float silver = pow(sp, 6.0) * (1.0 - dens) * 1.8;
    vec3 cc = uCloudCol * (uSunCol * (lightT * 1.1 + silver * lightT) * up * (1.0 - uCover * 0.55) + skyAmb * (0.78 + 0.62 * uCover));
    cc *= mix(1.0, 0.72, dens * uCover * (0.35 + 0.65 * uWx.x)) * (0.9 + 0.2 * smoothstep(0.2, 0.9, n0)) * (1.0 - uWx.y * 0.3 * dens);
    cc += uFlash.w * vec3(0.8, 0.84, 1.0) * (0.12 + 1.2 * pow(max(dot(d, uFlash.xyz), 0.0), 5.0)) * (0.35 + dens);
    cc = mix(uFogC, cc, 0.4 + 0.6 * smoothstep(0.0, 0.3, d.y));
    vec2 uv2 = d.xz / (d.y + 0.12) * 0.15 + uDrift * 0.6;
    float ci = smoothstep(0.62, 0.95, texture2D(uClouds, uv2).a * 0.7 + texture2D(uClouds, uv2 * 2.3 + 0.4).a * 0.3) * (1.0 - uCover) * 0.4 * horizonK;
    c = mix(c, uCloudCol * (uSunCol * 0.9 * up + skyAmb * 0.8), ci * (1.0 - dens));
    dens *= horizonK;
    c = mix(c, cc, dens);
    occ = dens;
  }
  c += uFlash.w * vec3(0.5, 0.52, 0.6) * 0.15;
  if (uMistS.x > 0.0) {
    float T = d.y > 0.0 ? exp(-uMistS.x / max(d.y, 0.002)) : 0.0;
    vec3 fc = uFogC + uSunCol * pow(max(sd, 0.0), 5.0) * uMistS.y + uSunCol * pow(max(sd, 0.0), 60.0) * uMistS.y * 0.6;
    c = mix(fc, c, T);
    occ = max(occ, (1.0 - T) * 0.85);
  }
  return c;
}`;

  const SKY_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform mat4 uInv; uniform float uDither; uniform float uMask;
varying vec2 vP;` + SKY_FN + `
void main() {
  vec4 a = uInv * vec4(vP, -1.0, 1.0); vec4 b = uInv * vec4(vP, 1.0, 1.0);
  float occ;
  vec3 c = skyCol(normalize(b.xyz / b.w - a.xyz / a.w), occ);
  if (uDither > 0.5) {
    vec2 q = mod(floor(gl_FragCoord.xy), 4.0);
    float bb = hash(q);
    c = floor(c * vec3(31.0, 63.0, 31.0) + bb) / vec3(31.0, 63.0, 31.0);
  }
  gl_FragColor = vec4(c, max(occ, uMask));
}`;

  const ENV_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform mat4 uInv; uniform vec3 uGround; uniform float uCity;
varying vec2 vP;` + SKY_FN + `
void main() {
  vec4 a = uInv * vec4(vP, -1.0, 1.0); vec4 b = uInv * vec4(vP, 1.0, 1.0);
  vec3 d = normalize(b.xyz / b.w - a.xyz / a.w);
  float occ;
  vec3 c = skyCol(d, occ);
  if (uCity > 0.5 && d.y > -0.02) {
    float ang = atan(d.x, d.z), cell = floor(ang * 40.0);
    float hb = (0.012 + 0.05 * hash(vec2(cell, 7.0))) * step(0.22, hash(vec2(cell, 3.0)));
    if (d.y < hb) {
      float win = step(0.8, hash(floor(vec2(ang * 420.0, d.y * 520.0)))) * uNight;
      c = mix(uGround * 0.7, uFogC, 0.5) + vec3(1.0, 0.78, 0.45) * win * 0.8;
    }
  }
  if (d.y < 0.0) c = mix(c, uGround * (0.75 + 0.25 * smoothstep(-1.0, -0.05, d.y)), 1.0 - smoothstep(-0.04, 0.0, d.y));
  gl_FragColor = vec4(c, 1.0);
}`;

  const SP_VS = `
attribute vec3 aPos; attribute vec2 aUV; attribute vec4 aCol;
uniform mat4 uVP; uniform vec3 uCam; uniform vec2 uFog; uniform float uFogScale; uniform vec4 uMist;
varying vec2 vUV; varying vec4 vCol; varying float vFog;
void main() {
  gl_Position = uVP * vec4(aPos, 1.0);
  vUV = aUV; vCol = aCol;
  float d = length(aPos - uCam) * uFogScale;
  vFog = clamp((uFog.y - d) / max(1.0, uFog.y - uFog.x), 0.0, 1.0);
  if (uMist.x > 0.0 && uFogScale > 0.0) {
    float hk = (aPos.y - uCam.y) * uMist.y;
    float along = abs(hk) > 0.002 ? (1.0 - exp(-hk)) / hk : 1.0;
    vFog = min(vFog, exp(-uMist.x * exp(-(uCam.y - uMist.z) * uMist.y) * d * along));
  }
}`;

  const SP_FS = `
precision mediump float;
uniform sampler2D uTex; uniform vec3 uFogCol; uniform float uAdd;
varying vec2 vUV; varying vec4 vCol; varying float vFog;
void main() {
  vec4 t = texture2D(uTex, vUV) * vCol;
  if (uAdd > 0.5) gl_FragColor = vec4(t.rgb * t.a * vFog, 1.0);
  else gl_FragColor = vec4(mix(uFogCol, t.rgb, vFog), t.a);
}`;

  const SH_VS = ANIM + `
uniform mat4 uLVP; uniform mat4 uModel;
varying vec2 vUV;
void main() {
  vec3 n = aNrm.xyz;
  vUV = aUV;
  gl_Position = uLVP * uModel * vec4(animate(aPos, floor(aNrm.w * 127.0 + 0.5), n), 1.0);
}`;

  const SH_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uTex; uniform float uAlphaTest;
varying vec2 vUV;
void main() {
  if (uAlphaTest > 0.5 && texture2D(uTex, vUV).a < 0.5) discard;
  vec4 enc = fract(vec4(1.0, 255.0, 65025.0, 16581375.0) * gl_FragCoord.z);
  enc -= enc.yzww * vec4(1.0 / 255.0, 1.0 / 255.0, 1.0 / 255.0, 0.0);
  gl_FragColor = enc;
}`;

  const POST_VS = `
attribute vec2 aP; varying vec2 vUV;
void main() { vUV = aP * 0.5 + 0.5; gl_Position = vec4(aP, 0.0, 1.0); }`;

  const BRIGHT_FS = `
precision mediump float;
uniform sampler2D uSrc; uniform vec2 uTexel; uniform float uThr; uniform float uGain;
varying vec2 vUV;
void main() {
  vec3 c = texture2D(uSrc, vUV + uTexel * vec2(-1.0, -1.0)).rgb + texture2D(uSrc, vUV + uTexel * vec2(1.0, -1.0)).rgb
    + texture2D(uSrc, vUV + uTexel * vec2(-1.0, 1.0)).rgb + texture2D(uSrc, vUV + uTexel * vec2(1.0, 1.0)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(uThr, uThr + 0.22, l) * uGain, 1.0);
}`;

  const BLUR_FS = `
precision mediump float;
uniform sampler2D uSrc; uniform vec2 uDir;
varying vec2 vUV;
void main() {
  vec3 c = texture2D(uSrc, vUV).rgb * 0.2270270270;
  c += texture2D(uSrc, vUV + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(uSrc, vUV - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(uSrc, vUV + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(uSrc, vUV - uDir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`;

  const RAYSRC_FS = `
precision mediump float;
uniform sampler2D uSrc; uniform vec2 uTexel; uniform vec2 uSun; uniform float uAsp; uniform vec3 uCol;
varying vec2 vUV;
void main() {
  vec4 a = texture2D(uSrc, vUV + uTexel * vec2(-1.0, -1.0)), b = texture2D(uSrc, vUV + uTexel * vec2(1.0, -1.0));
  vec4 c = texture2D(uSrc, vUV + uTexel * vec2(-1.0, 1.0)), d = texture2D(uSrc, vUV + uTexel * vec2(1.0, 1.0));
  float open = 1.0 - (a.a + b.a + c.a + d.a) * 0.25;
  vec3 sky = (a.rgb + b.rgb + c.rgb + d.rgb) * 0.25;
  vec2 v = (vUV - uSun) * vec2(uAsp, 1.0);
  float r2 = dot(v, v);
  float w = exp(-r2 * 46.0) + exp(-r2 * 10.0) * 0.07;
  gl_FragColor = vec4(uCol * open * w * (0.5 + 0.5 * max(sky.r, max(sky.g, sky.b))), 1.0);
}`;

  const RADIAL_FS = `
precision mediump float;
uniform sampler2D uSrc; uniform vec2 uSun; uniform float uLen; uniform float uDecay; uniform float uNorm;
varying vec2 vUV;
void main() {
  vec2 d = (uSun - vUV) * uLen / 16.0, uv = vUV;
  vec3 acc = vec3(0.0);
  float w = 1.0, ws = 0.0;
  for (int i = 0; i < 16; i++) {
    float inb = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    acc += texture2D(uSrc, uv).rgb * w * inb; ws += w; w *= uDecay; uv += d;
  }
  gl_FragColor = vec4(acc / mix(16.0, ws, uNorm), 1.0);
}`;

  const COMP_FS = `
precision mediump float;
uniform sampler2D uScene; uniform sampler2D uBloom; uniform sampler2D uRays; uniform float uRayK;
uniform float uBloomK; uniform float uBlur; uniform float uSat; uniform float uContrast; uniform vec3 uTint; uniform float uVig; uniform float uDither; uniform float uExpo;
uniform mat3 uMat; uniform vec3 uOff; uniform float uGrain; uniform float uSeed; uniform vec2 uBlurC;
varying vec2 vUV;
float grain(vec2 p) {
  vec3 q = fract(vec3(mod(p, 512.0).xyx + uSeed) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z) - 0.5;
}
float bayer(vec2 p) {
  vec2 q = mod(floor(p), 4.0);
  vec2 a = mod(q, 2.0); vec2 b = floor(q / 2.0);
  float ba = a.x * 2.0 + a.y * 3.0 - 4.0 * a.x * a.y;
  float bb = b.x * 2.0 + b.y * 3.0 - 4.0 * b.x * b.y;
  return (ba * 4.0 + bb + 0.5) / 16.0;
}
vec3 shoulder(vec3 c, float knee) {
  float mx = max(c.r, max(c.g, c.b));
  if (mx <= knee) return c;
  float k = mx - knee;
  float m = knee + k / (1.0 + k / (1.0 - knee));
  return mix(c * (m / mx), vec3(m), clamp((mx - 1.0) * 0.3, 0.0, 0.3));
}
void main() {
  vec3 c = texture2D(uScene, vUV).rgb;
  if (uBlur > 0.01) {
    vec2 d = vUV - uBlurC;
    vec2 s = d * uBlur * smoothstep(0.1, 0.6, length(d)) * 0.022;
    c += texture2D(uScene, vUV - s).rgb + texture2D(uScene, vUV - s * 2.0).rgb + texture2D(uScene, vUV - s * 3.0).rgb + texture2D(uScene, vUV - s * 4.0).rgb;
    c *= 0.2;
  }
  c += texture2D(uBloom, vUV).rgb * uBloomK;
  if (uRayK > 0.0) c += texture2D(uRays, vUV).rgb * uRayK;
  c *= uExpo;
  c = shoulder(c, 0.88);
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, uSat);
  c = (c - 0.5) * uContrast + 0.5;
  c *= uTint;
  c = uMat * c + uOff;
  vec2 q = (vUV - 0.5) * vec2(1.0, 0.82);
  c *= 1.0 - uVig * smoothstep(0.32, 0.78, length(q) * 1.35);
  if (uGrain > 0.0) c += grain(gl_FragCoord.xy) * uGrain * (1.1 - dot(c, vec3(0.3, 0.5, 0.2)));
  c = clamp(c, 0.0, 1.0);
  if (uDither > 0.5) c = floor(c * vec3(31.0, 63.0, 31.0) + bayer(gl_FragCoord.xy)) / vec3(31.0, 63.0, 31.0);
  gl_FragColor = vec4(c, 1.0);
}`;

  const DOF_FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uScene; uniform sampler2D uDepth; uniform vec2 uTexel; uniform vec4 uLens; uniform vec2 uStep;
varying vec2 vUV;
float dist(vec2 uv) {
  float z = texture2D(uDepth, uv).r * 2.0 - 1.0;
  return 2.0 * uLens.x * uLens.y / (uLens.y + uLens.x - z * (uLens.y - uLens.x));
}
float coc(float z) { return min(uLens.w * abs(z - uLens.z) / max(z, 0.01), uStep.y); }
void main() {
  vec4 c0 = texture2D(uScene, vUV);
  float z0 = dist(vUV), r0 = coc(z0);
  vec3 acc = c0.rgb;
  float tot = 1.0, r = uStep.x, a = 0.0;
  for (int i = 0; i < 120; i++) {
    if (r > uStep.y) break;
    vec2 uv = vUV + vec2(cos(a), sin(a)) * uTexel * r;
    float z = dist(uv), rs = coc(z);
    if (z > z0) rs = min(rs, r0 * 2.0);
    acc += mix(acc / tot, texture2D(uScene, uv).rgb, smoothstep(r - 0.5, r + 0.5, rs));
    tot += 1.0;
    a += 2.39996323;
    r += uStep.x / r;
  }
  gl_FragColor = vec4(acc / tot, c0.a);
}`;

  const GROUP_MODE = {
    ground: { cull: true }, water: { cull: false },
    road4: { road: 1.5 }, road2: { road: 1.25 }, lane: { road: 1 }, cobble: { road: 1 }, asph: { road: 2.5 }, gravel: { road: 1 }, dirt: { road: 1 }, sandtrack: { road: 1 },
    grasstrack: { road: 1 }, track: { road: 1 }, runway: { road: 1 }, pave: { road: 1 }, rail: { road: 1 },
    trees: { alpha: true, cull: false, tex: 'florafar', lod: 2 }, shrubs: { alpha: true, cull: false, tex: 'florafar', lod: 2, far: 460 }, rocks: { alpha: true, cull: false, tex: 'flora' },
    concrete: { cull: false }, white: { cull: true }, adatlas: { cull: true, alpha: true }, __ads: { cull: true, alpha: true }, festfloor: { road: 0.6 }, festpaint: { road: 3 },
    tiles: { road: 0.8 }, parkpath: { road: 0.8 }, apron: { road: 0.9 }, paint: { road: 3.4 }, street: { cull: true, alpha: true }, __street: { cull: true, alpha: true }, dirboards: { cull: true },
    roof_flat: { cull: false }, roof_tile: { cull: false }, roof_tin: { cull: false }, roof_slate: { cull: false }
  };
  const receiverOnly = key => key === 'ground' || key === 'water' || key === 'pave' || !!(GROUP_MODE[key] && GROUP_MODE[key].road);

  class Renderer {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      const gl = canvas.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: !!opts.preserve, powerPreference: 'high-performance' });
      if (!gl) throw new Error('WebGL недоступен');
      this.gl = gl;
      this.opts = Object.assign({ dither: true, draw: 900, filter: 'linear' }, opts);
      this.pw = this.program(VS, FS, ['aPos', 'aUV', 'aNrm', 'aCol'], ['uVP', 'uModel', 'uCam', 'uSunDir', 'uSunCol', 'uAmb', 'uGroundCol', 'uFog', 'uFogScale', 'uLights', 'uBrake', 'uNight', 'uTime', 'uFlat', 'uTex', 'uEnv', 'uFogCol', 'uAlphaTest', 'uPaint1', 'uPaint2', 'uDither', 'uSkyCol', 'uAlpha', 'uWet', 'uShadowVP', 'uShadow', 'uShadowOn', 'uShadowTexel', 'uShadowN', 'uShadowBias', 'uCaster', 'uRoad', 'uSpecK', 'uInside', 'uDial', 'uSpotPos', 'uSpotDir', 'uLamp', 'uLampCol', 'uSkin', 'uMask2', 'uMetal', 'uDirt', 'uReverse', 'uCabin', 'uInGlass', 'uRainK', 'uWipe', 'uPiv', 'uGlass', 'uWipeLen', 'uWipeA', 'uFlood', 'uClouds', 'uCloud', 'uCloudSh', 'uRain', 'uMist', 'uWind', 'uPush', 'uLod']);
      this.ps = this.program(SKY_VS, SKY_FS, ['aP'], ['uInv', 'uTop', 'uHor', 'uFogC', 'uSunDir', 'uSunCol', 'uClouds', 'uTime', 'uCover', 'uNight', 'uCloudCol', 'uDither', 'uWx', 'uFlash', 'uDrift', 'uMask', 'uMistS']);
      this.pe = this.program(SKY_VS, ENV_FS, ['aP'], ['uInv', 'uTop', 'uHor', 'uFogC', 'uSunDir', 'uSunCol', 'uClouds', 'uTime', 'uCover', 'uNight', 'uCloudCol', 'uGround', 'uCity', 'uWx', 'uFlash', 'uDrift', 'uMistS']);
      this.pp = this.program(SP_VS, SP_FS, ['aPos', 'aUV', 'aCol'], ['uVP', 'uCam', 'uFog', 'uFogScale', 'uTex', 'uFogCol', 'uAdd', 'uMist']);
      this.pd = this.program(SH_VS, SH_FS, ['aPos', 'aUV', 'aNrm', 'aCol'], ['uLVP', 'uModel', 'uTex', 'uAlphaTest', 'uTime', 'uWind', 'uPush']);
      this.pb = this.program(POST_VS, BRIGHT_FS, ['aP'], ['uSrc', 'uTexel', 'uThr', 'uGain']);
      this.pl = this.program(POST_VS, BLUR_FS, ['aP'], ['uSrc', 'uDir']);
      this.pc = this.program(POST_VS, COMP_FS, ['aP'], ['uScene', 'uBloom', 'uBloomK', 'uBlur', 'uSat', 'uContrast', 'uTint', 'uVig', 'uDither', 'uExpo', 'uRays', 'uRayK', 'uMat', 'uOff', 'uGrain', 'uSeed', 'uBlurC']);
      this.pf = this.program(POST_VS, DOF_FS, ['aP'], ['uScene', 'uDepth', 'uTexel', 'uLens', 'uStep']);
      this.depthExt = gl.getExtension('WEBGL_depth_texture');
      this.prs = this.program(POST_VS, RAYSRC_FS, ['aP'], ['uSrc', 'uTexel', 'uSun', 'uAsp', 'uCol']);
      this.prr = this.program(POST_VS, RADIAL_FS, ['aP'], ['uSrc', 'uSun', 'uLen', 'uDecay', 'uNorm']);
      this.prog = this.pw;
      this.push = new Float32Array(8);
      this.tiles = new Map();
      this.floraState = null;
      this.spots = new Float32Array(16);
      this.spotDirs = new Float32Array(16);
      this.lamps = new Float32Array(32);
      this.shadowOn = false;
      this.shadowVP = M4.ident();
      this.shadowSize = Math.min(2048, gl.getParameter(gl.MAX_TEXTURE_SIZE) || 1024);
      this.shadowBias = new Float32Array([1.6 * SHADOW_HALF * 2 / this.shadowSize, 0.03 / 699, 0.05 / 699, 0.0006]);
      this.targets = null;
      this.skyBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      this.spBuf = gl.createBuffer();
      this.spIdx = gl.createBuffer();
      this.dynBuf = gl.createBuffer();
      this.dynIdx = gl.createBuffer();
      this.textures = new Map();
      this.skins = new Map();
      this.aniso = gl.getExtension('EXT_texture_filter_anisotropic');
      this.meshes = new Map();
      this.wrecks = new Map();
      this.frameNo = 0;
      this.ident = M4.ident();
      this.model = new Float32Array(16);
      this.wheelT = new Float32Array(16);
      this.wheelM = new Float32Array(16);
      this.glassQ = [];
      this.glassN = 0;
      this.drivers = new Map();
      this.rigIbo = new Map();
      this.lookTexs = new Map();
      this.uc = {};
      this.carFast = {};
      this.stats = { draws: 0, tris: 0, chunks: 0 };
      this.sprites = new Float32Array(9 * 4 * 4096);
      this.spriteIdx = new Uint16Array(6 * 4096);
      for (let i = 0; i < 4096; i++) {
        const b = i * 4;
        this.spriteIdx.set([b, b + 1, b + 2, b, b + 2, b + 3], i * 6);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.spIdx);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.spriteIdx, gl.STATIC_DRAW);
      this.lost = false;
      canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.lost = true; });
    }

    program(vs, fs, attrs, unis) {
      const gl = this.gl;
      const mk = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const p = gl.createProgram();
      gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
      attrs.forEach((name, i) => gl.bindAttribLocation(p, i, name));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      const o = { p, a: {}, u: {} };
      for (const a of attrs) o.a[a] = gl.getAttribLocation(p, a);
      for (const u of unis) o.u[u] = gl.getUniformLocation(p, u);
      return o;
    }

    tex(name) {
      let t = this.textures.get(name);
      if (t) return t;
      const gl = this.gl;
      const cv = F.Tex.paint(name) || F.Tex.paint('white');
      t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      const pow2 = (cv.width & (cv.width - 1)) === 0 && (cv.height & (cv.height - 1)) === 0;
      const fl = F.Tex.flags[name] || {};
      if (pow2) {
        if (fl.mips) { const lv = fl.mips(cv); for (let i = 1; i < lv.length; i++) gl.texImage2D(gl.TEXTURE_2D, i, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, lv[i]); }
        else gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, fl.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, fl.clamp ? gl.CLAMP_TO_EDGE : gl.REPEAT);
      } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.opts.filter === 'point' ? gl.NEAREST : gl.LINEAR);
      this.textures.set(name, t);
      return t;
    }

    upload(batch) {
      const gl = this.gl;
      const parts = batch.finish();
      const out = [];
      for (const pt of parts) {
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, pt.data, gl.STATIC_DRAW);
        const ibo = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, pt.idx, gl.STATIC_DRAW);
        out.push({ vbo, ibo, count: pt.ni });
      }
      return out;
    }

    free(mesh) {
      if (!mesh) return;
      const gl = this.gl;
      for (const pt of mesh) { gl.deleteBuffer(pt.vbo); gl.deleteBuffer(pt.ibo); }
    }

    bindMesh(pt) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, pt.vbo);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
      gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 12);
      if (this.prog === this.pw || this.prog === this.pd) {
        gl.vertexAttribPointer(2, 4, gl.BYTE, true, 28, 20);
        gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 28, 24);
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pt.ibo);
    }

    setU(name, v) {
      if (this.uc[name] === v) return;
      this.uc[name] = v;
      this.gl.uniform1f(this.pw.u[name], v);
    }

    drawRange(mesh, model, first, count) {
      const gl = this.gl, pt = mesh[0];
      if (count <= 0) return;
      gl.uniformMatrix4fv(this.prog.u.uModel, false, model || this.ident);
      this.bindMesh(pt);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, first * 2);
      this.stats.draws++;
      this.stats.tris += count / 3;
    }

    drawMesh(mesh, model) {
      const gl = this.gl;
      gl.uniformMatrix4fv(this.prog.u.uModel, false, model || this.ident);
      for (const pt of mesh) {
        this.bindMesh(pt);
        gl.drawElements(gl.TRIANGLES, pt.count, gl.UNSIGNED_SHORT, 0);
        this.stats.draws++;
        this.stats.tris += pt.count / 3;
      }
    }

    setScene(scene) {
      this.resetTiles();
      this.scene = scene;
      for (const ch of scene.chunks) ch.gpu = null;
      for (const lm of scene.landmarks) lm.gpu = null;
    }

    carMesh(id, wing) {
      const w = wing || '', byId = this.carFast[id];
      let m = byId && byId[w];
      if (m) return m;
      const key = id + '|' + w;
      m = this.meshes.get(key);
      if (!m) {
        const g = F.Models.carGeo(id, wing);
        const up = bt => bt && this.upload(cloneBatch(bt));
        m = { geo: g, skins: {}, lods: g.lods.map(up), lamp: up(g.lamp && g.lamp.batch), wblade: up(g.wiper && g.wiper.blade), cock: this.upload(cloneBatch(g.cockpit.batch)), swheel: this.upload(cloneBatch(g.cockpit.wheel)), gauge: this.upload(cloneBatch(g.cockpit.gauge)) };
        this.meshes.set(key, m);
        (this.carFast[id] || (this.carFast[id] = {}))[w] = m;
      }
      return m;
    }

    dentMesh(car, m, lod) {
      const d = car.dmg;
      if (!d || !(d.log.length || d.burnt) || !m.geo.tagLods) return null;
      let w = this.wrecks.get(d);
      if (!w || w.geo !== m.geo) {
        if (w) this.freeWreck(w);
        w = { geo: m.geo, inst: [null, null, null], gpu: [null, null, null], key: ['', '', ''], seen: 0 };
        this.wrecks.set(d, w);
      }
      w.seen = this.frameNo;
      const key = d.ver + ':' + d.animKey() + (d.burnt ? 'b' : '');
      if (w.key[lod] !== key) {
        const inst = w.inst[lod] || (w.inst[lod] = new F.Dents.Dented(m.geo, lod));
        const data = inst.compose(d), gl = this.gl, base = m.lods[lod][0];
        if (!w.gpu[lod]) w.gpu[lod] = [{ vbo: gl.createBuffer(), ibo: base.ibo, count: base.count }];
        gl.bindBuffer(gl.ARRAY_BUFFER, w.gpu[lod][0].vbo);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        w.key[lod] = key;
      }
      return w.gpu[lod];
    }

    partMesh(owner, part) {
      const d = owner.dmg;
      if (!d) return null;
      const m = this.carMesh(owner.id, owner.wing), w = this.wrecks.get(d);
      const inst = (w && w.geo === m.geo && w.inst[0]) || new F.Dents.Dented(m.geo, 0);
      if (w && w.geo === m.geo) w.inst[0] = inst;
      return inst.partBatch(d, F.DMG.PART[part]);
    }

    freeWreck(w) {
      for (const g of w.gpu) if (g) this.gl.deleteBuffer(g[0].vbo);
      w.gpu = [null, null, null];
    }

    gcWrecks() {
      for (const [d, w] of this.wrecks) {
        if (this.frameNo - w.seen < 300) continue;
        this.freeWreck(w);
        this.wrecks.delete(d);
      }
      for (const [inst, d] of this.drivers) {
        if (this.frameNo - d.seen < 300) continue;
        this.gl.deleteBuffer(d.mesh[0].vbo);
        this.drivers.delete(inst);
      }
      for (const [key, t] of this.lookTexs) {
        if (t.keep || this.frameNo - t.seen < 1800) continue;
        this.gl.deleteTexture(t.tex);
        this.lookTexs.delete(key);
      }
    }

    driverSlot(inst) {
      const gl = this.gl, rig = inst.rig;
      let d = this.drivers.get(inst);
      if (!d) {
        let ibo = this.rigIbo.get(rig);
        if (!ibo) {
          ibo = gl.createBuffer();
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
          gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, rig.idx, gl.STATIC_DRAW);
          this.rigIbo.set(rig, ibo);
        }
        d = { mesh: [{ vbo: gl.createBuffer(), ibo, count: rig.ni }], seen: 0, geo: null, steer: NaN, cockpit: null, frame: -1 };
        this.drivers.set(inst, d);
      }
      d.seen = this.frameNo;
      return d;
    }

    driverMesh(inst, geo, steer, cockpit) {
      const gl = this.gl, d = this.driverSlot(inst);
      if (d.frame !== this.frameNo || d.geo !== geo || d.steer !== steer || d.cockpit !== cockpit) {
        F.Driver.pose(inst, geo, steer, cockpit);
        gl.bindBuffer(gl.ARRAY_BUFFER, d.mesh[0].vbo);
        gl.bufferData(gl.ARRAY_BUFFER, inst.data, gl.DYNAMIC_DRAW);
        d.frame = this.frameNo; d.geo = geo; d.steer = steer; d.cockpit = cockpit;
      }
      return d.mesh;
    }

    lookTex(key, look, keep) {
      let t = this.lookTexs.get(key);
      if (t) { t.seen = this.frameNo; if (keep) t.keep = true; return t.tex; }
      const gl = this.gl, cv = F.Driver.paintLook(look, F.Tex.canvas(F.Driver.TEX, F.Driver.TEX));
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.opts.filter === 'point' ? gl.NEAREST : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      t = { tex, seen: this.frameNo, keep: !!keep };
      this.lookTexs.set(key, t);
      return tex;
    }

    drawFigure(inst, model, t) {
      const gl = this.gl, d = this.driverSlot(inst), at = F.Driver.stand(inst, t);
      gl.bindBuffer(gl.ARRAY_BUFFER, d.mesh[0].vbo);
      gl.bufferData(gl.ARRAY_BUFFER, inst.data, gl.DYNAMIC_DRAW);
      d.frame = -1;
      if (this.prog === this.pw) {
        gl.bindTexture(gl.TEXTURE_2D, this.lookTex(inst.tex, inst.look));
        gl.uniform1f(this.pw.u.uInside, 0);
      }
      gl.disable(gl.CULL_FACE);
      this.drawRange(d.mesh, model, 0, inst.rig.ni);
      gl.enable(gl.CULL_FACE);
      return at;
    }

    figureShot(look, w, h, frame = 'head') {
      const gl = this.gl;
      this.ensureFbo();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const inst = F.Driver.make(look), pose = F.Driver.stand(inst, 0), c = frame === 'head' ? pose.head : pose.chest, d = frame === 'head' ? 0.62 : 1.5;
      const cam = { x: c[0] + 0.12 * d, y: c[1] + 0.02, z: c[2] - d, tx: c[0], ty: c[1] - (frame === 'head' ? 0.01 : 0), tz: c[2], fov: 30 };
      const C = this.camera(cam, w, h);
      const env = studioEnv();
      this.setWorldUniforms(env, cam, C);
      gl.uniform1f(this.pw.u.uDither, 0);
      gl.uniform1f(this.pw.u.uShadowOn, 0);
      this.drawFigure(inst, this.ident, 0);
      const px = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const cv = F.Tex.canvas(w, h), ctx = cv.getContext('2d'), img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
      ctx.putImageData(img, 0, 0);
      gl.clearColor(0, 0, 0, 1);
      return cv;
    }

    drawDriver(car, geo, model, headless, cockpit) {
      const gl = this.gl, inst = car.driver, mesh = this.driverMesh(inst, geo, car.steer || 0, cockpit);
      const main = this.prog === this.pw;
      if (main) {
        gl.bindTexture(gl.TEXTURE_2D, this.lookTex(inst.tex, inst.look));
        gl.uniform1f(this.pw.u.uInside, 1);
      }
      gl.disable(gl.CULL_FACE);
      this.drawRange(mesh, model, 0, headless ? inst.rig.head : inst.rig.ni);
      if (main && !cockpit) {
        gl.uniform1f(this.pw.u.uInside, 0);
        gl.enable(gl.CULL_FACE);
      }
    }

    drawDebris(list, C, shadow = false) {
      const gl = this.gl, main = !shadow && this.prog === this.pw;
      gl.disable(gl.CULL_FACE);
      for (const b of list) {
        const R = Math.max(b.h[0], b.h[1], b.h[2]) * 1.8 + 0.2;
        if (C && !M4.boxVisible(C.planes, b.x - R, b.y - R, b.z - R, b.x + R, b.y + R, b.z + R)) continue;
        const look = b.look;
        if (look.kind === 'part') {
          if (!look.gpu) look.gpu = this.upload(look.batch);
          if (main) this.bindCarLook(look);
          else gl.bindTexture(gl.TEXTURE_2D, this.tex('white'));
          this.drawMesh(look.gpu, b.model);
          if (main) this.unbindCarLook();
          continue;
        }
        for (const ms of look.meshes) {
          if (!ms.gpu) ms.gpu = this.upload(ms.batch);
          gl.bindTexture(gl.TEXTURE_2D, this.tex(ms.key));
          gl.uniform1f(this.prog.u.uAlphaTest, ms.key === 'street' || ms.key === 'adatlas' ? 1 : 0);
          this.drawMesh(ms.gpu, b.model);
        }
      }
      gl.uniform1f(this.prog.u.uAlphaTest, 0);
      gl.enable(gl.CULL_FACE);
    }

    bindCarLook(look) {
      const gl = this.gl, u = this.pw.u, burnt = !!look.burnt;
      const p1 = burnt ? [0.07, 0.065, 0.06] : look.paint1 || [0.8, 0.8, 0.8], p2 = burnt ? p1 : look.paint2 || p1;
      gl.uniform3f(u.uPaint1, p1[0], p1[1], p1[2]);
      gl.uniform3f(u.uPaint2, p2[0], p2[1], p2[2]);
      this.setU('uMetal', look.metal && !burnt ? 1 : 0);
      this.setU('uDirt', burnt ? 0.9 : look.dirt || 0);
      const m = this.carMesh(look.id, look.wing), lv = look.livery || 'none';
      const sk = m.skins[lv] || (m.skins[lv] = this.carSkin(look.id, lv, m.geo.skin)), mk = sk.mask || this.blank();
      if (mk !== this.mask3) {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, mk);
        gl.activeTexture(gl.TEXTURE0);
        this.mask3 = mk;
      }
      gl.bindTexture(gl.TEXTURE_2D, sk.tex);
      this.setU('uSkin', 1);
    }

    unbindCarLook() {
      this.setU('uMetal', 0);
      this.setU('uDirt', 0);
      this.setU('uSkin', 0);
    }

    carSkin(id, livery, desc) {
      const key = id + '|' + (livery || 'none');
      let s = this.skins.get(key);
      if (s) return s;
      const gl = this.gl, img = F.Tex.carSkin(desc, livery || 'none'), N = img.size;
      const make = (data, fmt) => {
        const tx = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tx);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, fmt, N, N, 0, fmt, gl.UNSIGNED_BYTE, data);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, this.opts.filter === 'point' ? gl.NEAREST : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (this.aniso) gl.texParameterf(gl.TEXTURE_2D, this.aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);
        return tx;
      };
      s = { tex: make(img.rgba, gl.RGBA), mask: img.mask ? make(img.mask, gl.LUMINANCE) : null, bytes: Math.round(N * N * (img.mask ? 5 : 4) * 4 / 3) };
      this.skins.set(key, s);
      return s;
    }

    blank() {
      if (this.blankTex) return this.blankTex;
      const gl = this.gl, tx = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, 1, 1, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, new Uint8Array([0]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      this.blankTex = tx;
      return tx;
    }

    wheelMesh(def, tread, kind, rear) {
      const bt = F.Blueprints.of(def), split = !!(rear && bt && Array.isArray(bt.tyre)), key = 'wheel|' + def.id + '|' + tread + '|' + kind + (split ? '|r' : '');
      let m = this.meshes.get(key);
      if (!m) { m = this.upload(F.Models.buildWheel(def, { tread, kind, rear: split })); this.meshes.set(key, m); }
      return m;
    }

    brakeMesh(def, red) {
      const key = 'brake|' + def.id + '|' + (red ? 1 : 0);
      let m = this.meshes.get(key);
      if (!m) { m = this.upload(F.Models.buildBrake(def, red)); this.meshes.set(key, m); }
      return m;
    }

    staticMesh(key, build) {
      let m = this.meshes.get(key);
      if (!m) { m = this.upload(build()); this.meshes.set(key, m); }
      return m;
    }

    resize(w, h) {
      if (this.canvas.width !== w || this.canvas.height !== h) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
    }

    camera(cam, w, h, viewport) {
      const aspect = (viewport ? viewport[2] / viewport[3] : w / h);
      const proj = M4.persp(cam.fov * Math.PI / 180, aspect, cam.near || 0.3, cam.far || 3000);
      if (cam.mirror) { proj[0] = -proj[0]; }
      if (cam.shiftX) proj[8] = -cam.shiftX;
      const view = M4.lookAt(cam.x, cam.y, cam.z, cam.tx, cam.ty, cam.tz, cam.ux || 0, cam.uy === undefined ? 1 : cam.uy, cam.uz || 0);
      const vp = M4.mul(proj, view);
      this.eyeY = cam.y;
      const skyProj = M4.persp(cam.fov * Math.PI / 180, aspect, 1, 2);
      if (cam.mirror) skyProj[0] = -skyProj[0];
      if (cam.shiftX) skyProj[8] = -cam.shiftX;
      const turn = view.slice();
      turn[12] = turn[13] = turn[14] = 0;
      return { proj, view, vp, planes: M4.planes(vp), inv: M4.invert(vp), skyInv: M4.invert(M4.mul(skyProj, turn)) };
    }

    setGfx(mode) { this.opts.gfx = mode; }

    post() { return this.opts.gfx === 'high' || this.opts.gfx === 'ultra' || !!this.forcePost; }

    setLights(spots, lamps) {
      this.spots.fill(0); this.spotDirs.fill(0); this.lamps.fill(0);
      spots.slice(0, 4).forEach((l, i) => { this.spots.set([l.x, l.y, l.z, l.k], i * 4); this.spotDirs.set([l.dx, l.dy, l.dz, 0], i * 4); });
      lamps.slice(0, 8).forEach((l, i) => this.lamps.set([l.x, l.y, l.z, l.r], i * 4));
    }

    envCube(env) {
      if (env === this.cubeEnv && this.cube) return this.cube;
      this.cubeEnv = env;
      const gl = this.gl, S = 64, st = !!env.studio;
      const q = this.cubeNow || (this.cubeNow = new Int32Array(7));
      q[0] = st ? 1 : 0; q[1] = Math.round(env.sunDir[0] * 24); q[2] = Math.round(env.sunDir[1] * 24); q[3] = Math.round(env.sunDir[2] * 24);
      q[4] = Math.round((env.night || 0) * 24); q[5] = Math.round((env.cover || 0) * 24); q[6] = Math.round((env.rain || 0) * 6) + Math.round((env.storm || 0) * 6) * 8 + Math.round((env.mist || 0) * 8) * 64;
      let same = !!this.cubeQ;
      for (let i = 0; same && i < 7; i++) same = q[i] === this.cubeQ[i];
      if (!this.cube) {
        this.cube = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cube);
        for (let i = 0; i < 6; i++) gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.cubeFbo = gl.createFramebuffer();
      }
      if (same) return this.cube;
      (this.cubeQ || (this.cubeQ = new Int32Array(7))).set(q);
      const fbo = gl.getParameter(gl.FRAMEBUFFER_BINDING), vp = gl.getParameter(gl.VIEWPORT), cull = gl.isEnabled(gl.CULL_FACE), s = this.pe;
      gl.useProgram(s.p);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.cubeFbo);
      gl.viewport(0, 0, S, S);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
      gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.enableVertexAttribArray(s.a.aP);
      gl.vertexAttribPointer(s.a.aP, 2, gl.FLOAT, false, 0, 0);
      this.skyUniforms(s, env, st, 2);
      gl.uniform4f(s.u.uFlash, 0, 1, 0, 0);
      gl.uniform3fv(s.u.uGround, st ? [0.12, 0.36, 0.34] : env.groundCol);
      gl.uniform1f(s.u.uCity, st ? 0 : 1);
      gl.uniform1i(s.u.uClouds, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex('clouds'));
      const proj = M4.persp(Math.PI / 2, 1, 0.1, 10);
      const faces = [[1, 0, 0, 0, -1, 0], [-1, 0, 0, 0, -1, 0], [0, 1, 0, 0, 0, 1], [0, -1, 0, 0, 0, -1], [0, 0, 1, 0, -1, 0], [0, 0, -1, 0, -1, 0]];
      faces.forEach((f, i) => {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.cube, 0);
        gl.uniformMatrix4fv(s.u.uInv, false, M4.invert(M4.mul(proj, M4.lookAt(0, 0, 0, f[0], f[1], f[2], f[3], f[4], f[5]))));
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      });
      gl.disableVertexAttribArray(s.a.aP);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cube);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(vp[0], vp[1], vp[2], vp[3]);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      if (cull) gl.enable(gl.CULL_FACE);
      this.stats.draws += 6;
      return this.cube;
    }

    shadowUniforms(vp, size, on, bias) {
      const gl = this.gl, u = this.pw.u, n = this.shadowN || (this.shadowN = new Float32Array(9));
      for (let c = 0; c < 3; c++) for (let r = 0; r < 3; r++) n[c * 3 + r] = vp[c * 4 + r] * 0.5;
      gl.uniformMatrix4fv(u.uShadowVP, false, vp);
      gl.uniformMatrix3fv(u.uShadowN, false, n);
      gl.uniform4fv(u.uShadowBias, bias);
      gl.uniform1f(u.uShadowTexel, 1 / size);
      gl.uniform1f(u.uShadowOn, on ? 1 : 0);
    }

    windUniforms(u, env) {
      const gl = this.gl, wk = env.studio ? 0 : env.wind || 0;
      gl.uniform1f(u.uTime, env.time % 900);
      gl.uniform4f(u.uWind, WIND_DIR[0], WIND_DIR[1], env.studio ? 0 : 0.25 + wk * 1.1, wk * 0.35);
      gl.uniform4fv(u.uPush, this.push);
    }

    setWorldUniforms(env, cam, C) {
      const gl = this.gl, u = this.pw.u;
      const cube = this.envCube(env);
      gl.useProgram(this.pw.p);
      this.prog = this.pw;
      this.shadowUniforms(this.shadowVP, this.shadowSize, this.shadowOn && !env.studio, this.shadowBias);
      gl.uniform1f(u.uCaster, 1);
      gl.uniform1f(u.uRoad, 0);
      gl.uniform1f(u.uSpecK, this.opts.gfx === 'retro' ? 0.35 : 1);
      gl.uniform1f(u.uInside, 0);
      gl.uniform3f(u.uDial, 1, 1, 1);
      this.glassN = 0;
      gl.uniform4fv(u.uSpotPos, this.spots);
      gl.uniform4fv(u.uSpotDir, this.spotDirs);
      gl.uniform4fv(u.uLamp, this.lamps);
      gl.uniform3f(u.uLampCol, 1.0, 0.78, 0.48);
      gl.uniform1i(u.uShadow, 2);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, this.shadowTex || this.tex('white'));
      gl.uniformMatrix4fv(u.uVP, false, C.vp);
      gl.uniform3f(u.uCam, cam.x, cam.y, cam.z);
      this.lodEye = [cam.x, cam.y, cam.z];
      this.lodK = cam.lodK || 1;
      gl.uniform3fv(u.uSunDir, env.sunDir);
      gl.uniform3fv(u.uSunCol, env.sunCol);
      gl.uniform3fv(u.uAmb, env.amb);
      gl.uniform3fv(u.uGroundCol, env.groundCol);
      gl.uniform2f(u.uFog, env.fogNear, env.fogFar);
      gl.uniform1f(u.uFogScale, 1);
      gl.uniform3fv(u.uFogCol, env.fogCol);
      this.mistUniform(u, env);
      gl.uniform3fv(u.uSkyCol, env.skyHor);
      gl.uniform1f(u.uNight, env.night);
      this.windUniforms(u, env);
      gl.uniform4f(u.uLod, 0, 0, 0, 0);
      gl.uniform1f(u.uDither, this.opts.dither && !this.post() ? 1 : 0);
      gl.uniform1f(u.uAlpha, 1);
      gl.uniform1f(u.uLights, 0);
      gl.uniform1f(u.uBrake, 0);
      gl.uniform1f(u.uFlat, 0);
      gl.uniform1f(u.uFlood, 0);
      gl.uniform1f(u.uWet, env.wet || 0);
      gl.uniform3f(u.uPaint1, 1, 1, 1);
      gl.uniform3f(u.uPaint2, 1, 1, 1);
      gl.uniform1i(u.uTex, 0);
      gl.uniform1i(u.uEnv, 1);
      gl.uniform1i(u.uMask2, 3);
      gl.uniform1f(u.uSkin, 0);
      gl.uniform1f(u.uMetal, 0);
      gl.uniform1f(u.uDirt, 0);
      gl.uniform1f(u.uReverse, 0);
      this.uc = { uLights: 0, uBrake: 0, uSkin: 0, uMetal: 0, uDirt: 0, uReverse: 0 };
      gl.uniform1f(u.uCabin, 0);
      gl.uniform1f(u.uInGlass, 0);
      const cover = env.studio ? 0 : env.cover || 0, dr = env.drift || [0, 0];
      gl.uniform4f(u.uCloud, 0.7 + (0.14 - 0.7) * cover, 0.12 + (0.4 - 0.12) * cover, dr[0] * 0.7, dr[1] * 0.7);
      gl.uniform1f(u.uCloudSh, env.studio ? 0 : 0.72 * (env.day || 0) * (1 - (env.mist || 0)));
      gl.uniform1f(u.uRain, env.studio ? 0 : env.rain || 0);
      gl.uniform1i(u.uClouds, 4);
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, this.tex('clouds'));
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, this.blank());
      this.mask3 = this.blank();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cube);
      gl.activeTexture(gl.TEXTURE0);
      gl.enableVertexAttribArray(this.pw.a.aPos);
      gl.enableVertexAttribArray(this.pw.a.aUV);
      gl.enableVertexAttribArray(this.pw.a.aNrm);
      gl.enableVertexAttribArray(this.pw.a.aCol);
    }

    mistUniform(u, env) {
      const on = !env.studio && env.mistD > 0;
      this.gl.uniform4f(u.uMist, on ? env.mistD : 0, 1 / (env.mistH || 30), 0, on ? env.mistSun || 0 : 0);
    }

    skyUniforms(s, env, st, camY = this.eyeY) {
      const gl = this.gl, dr = env.drift || [0, 0];
      const mist = !st && env.mistD > 0 ? env.mistD * (env.mistH || 30) * Math.exp(-Math.max(0, camY || 0) / (env.mistH || 30)) : 0;
      gl.uniform3f(s.u.uMistS, mist, st ? 0 : env.mistSun || 0, 0);
      gl.uniform3fv(s.u.uTop, st ? [0.7, 0.74, 0.8] : env.skyTop);
      gl.uniform3fv(s.u.uHor, env.skyHor);
      gl.uniform3fv(s.u.uFogC, st ? [0.46, 0.55, 0.58] : env.fogCol);
      gl.uniform3fv(s.u.uSunDir, env.sunDir);
      gl.uniform3fv(s.u.uSunCol, env.sunCol);
      gl.uniform3fv(s.u.uCloudCol, st ? [1, 1, 1] : env.cloudCol);
      gl.uniform1f(s.u.uTime, st ? 0 : (env.time || 0) % 600);
      gl.uniform1f(s.u.uCover, st ? 0 : env.cover);
      gl.uniform1f(s.u.uNight, env.night || 0);
      gl.uniform4f(s.u.uWx, st ? 0 : env.rain || 0, st ? 0 : env.storm || 0, env.sunEl === undefined ? 1 : env.sunEl, env.wind || 0);
      gl.uniform2f(s.u.uDrift, st ? 0 : dr[0], st ? 0 : dr[1]);
    }

    drawSky(env, C, mask = 0) {
      const gl = this.gl, s = this.ps;
      gl.useProgram(s.p);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.enableVertexAttribArray(s.a.aP);
      gl.vertexAttribPointer(s.a.aP, 2, gl.FLOAT, false, 0, 0);
      gl.uniformMatrix4fv(s.u.uInv, false, C.skyInv || C.inv);
      this.skyUniforms(s, env, false);
      const fd = env.flashDir || [0, 1, 0];
      gl.uniform4f(s.u.uFlash, fd[0], fd[1], fd[2], env.flash || 0);
      gl.uniform1f(s.u.uMask, mask);
      gl.uniform1f(s.u.uDither, this.opts.dither && !this.post() ? 1 : 0);
      gl.uniform1i(s.u.uClouds, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex('clouds'));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(s.a.aP);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      this.stats.draws++;
    }

    visibleChunks(cam, C, dist) {
      const out = [];
      const sc = this.scene;
      if (!sc) return out;
      const r = dist + 140;
      for (const ch of sc.chunks) {
        const cx = (ch.x0 + ch.x1) / 2, cz = (ch.z0 + ch.z1) / 2;
        const dx = Math.max(0, Math.abs(cam.x - cx) - 125), dz = Math.max(0, Math.abs(cam.z - cz) - 125);
        const d = Math.hypot(dx, dz);
        if (d > r) continue;
        if (!M4.boxVisible(C.planes, ch.x0 - 20, ch.y0 - 2, ch.z0 - 20, ch.x1 + 20, ch.y1 + 2, ch.z1 + 20)) continue;
        out.push({ ch, d });
      }
      out.sort((a, b) => a.d - b.d);
      return out;
    }

    ensureChunk(ch, budget) {
      if (ch.gpu && !ch.dirtyProps) return budget;
      if (!ch.gpu) {
        if (budget <= 0) return budget;
        ch.gpu = {};
        for (const key of Object.keys(ch.groups)) {
          const b = ch.groups[key];
          if (b.empty) continue;
          ch.gpu[key] = this.upload(b);
        }
        budget--;
      }
      if (ch.dirtyProps && ch.props.length) {
        this.free(ch.gpu.__props);
        this.free(ch.gpu.__street);
        this.free(ch.gpu.__ads);
        const pb = this.scene.propBatches(ch);
        ch.gpu.__props = pb.props.empty ? null : this.upload(pb.props);
        ch.gpu.__street = pb.street.empty ? null : this.upload(pb.street);
        ch.gpu.__ads = pb.ads.empty ? null : this.upload(pb.ads);
      }
      ch.dirtyProps = false;
      return budget;
    }

    resetTiles() {
      for (const t of this.tiles.values()) this.free(t.gpu);
      this.tiles.clear();
      this.floraState = null;
    }

    setPush(list) {
      const P = this.push;
      P.fill(0);
      for (let i = 0; i < Math.min(2, list.length); i++) P.set(list[i], i * 4);
    }

    floraTiles(cam, opts) {
      const sc = this.scene;
      if (!sc || !sc.cells || !F.TILES) return null;
      const q = this.opts.flora === undefined ? 2 : this.opts.flora, RT = FLORA_R[q] || 0, RG = GRASS_R[q] || 0, dens = GRASS_D[q] || 0;
      if (this.tileQ !== q) { this.resetTiles(); this.tileQ = q; }
      this.tileFrame = (this.tileFrame || 0) + 1;
      const now = this.tileFrame, T = F.TILES, tiles = this.tiles;
      const start = performance.now(), ms = opts.noUpload ? -1 : opts.tileMs || 4;
      let built = 0;
      const canBuild = () => ms >= 0 && (built === 0 || performance.now() - start < ms);
      const near = (x0, z0, size) => Math.hypot(Math.max(0, Math.abs(cam.x - (x0 + size / 2)) - size / 2), Math.max(0, Math.abs(cam.z - (z0 + size / 2)) - size / 2));
      const out = { R: RT, band: LOD_BAND, gR: RG, trees: [], grass: [], cam: [cam.x, cam.z] };
      let missT = Infinity, missG = Infinity;
      if (RT > 0) {
        const r = RT + LOD_BAND, list = [];
        for (let ix = Math.floor((cam.x - r) / T.tree); ix <= Math.floor((cam.x + r) / T.tree); ix++) {
          for (let iz = Math.floor((cam.z - r) / T.tree); iz <= Math.floor((cam.z + r) / T.tree); iz++) {
            const c = sc.cells.get(ix * 4096 + iz);
            if (!c) continue;
            const d = near(c.x0, c.z0, T.tree);
            if (d < r) list.push([d, c]);
          }
        }
        list.sort((a, b) => a[0] - b[0]);
        for (const [d, c] of list) {
          const key = 'T' + c.key;
          let t = tiles.get(key);
          if (!t) {
            if (!canBuild()) { missT = Math.min(missT, d); continue; }
            const b = sc.treeTile(c);
            t = { gpu: b.empty ? [] : this.upload(b), used: now, x0: c.x0, z0: c.z0, size: T.tree };
            tiles.set(key, t);
            built++;
          }
          t.used = now;
          out.trees.push(t);
        }
      }
      if (RG > 0) {
        const r = RG + LOD_BAND, list = [];
        for (let ix = Math.floor((cam.x - r) / T.grass); ix <= Math.floor((cam.x + r) / T.grass); ix++) {
          for (let iz = Math.floor((cam.z - r) / T.grass); iz <= Math.floor((cam.z + r) / T.grass); iz++) {
            const d = near(ix * T.grass, iz * T.grass, T.grass);
            if (d < r) list.push([d, ix, iz]);
          }
        }
        list.sort((a, b) => a[0] - b[0]);
        for (const [d, ix, iz] of list) {
          const key = 'G' + (ix * 4096 + iz);
          let t = tiles.get(key);
          if (!t) {
            if (!canBuild()) { missG = Math.min(missG, d); continue; }
            const b = sc.grassTile(ix, iz, dens);
            t = { gpu: b.empty ? [] : this.upload(b), used: now, x0: ix * T.grass, z0: iz * T.grass, size: T.grass };
            tiles.set(key, t);
            built++;
          }
          t.used = now;
          out.grass.push(t);
        }
      }
      out.R = Math.max(0, Math.min(RT, missT - LOD_BAND));
      out.gR = Math.max(0, Math.min(RG, missG - LOD_BAND));
      if (now % 30 === 0) {
        for (const [key, t] of tiles) {
          if (now - t.used < 90 || near(t.x0, t.z0, t.size) < (key[0] === 'T' ? RT : RG) + 80) continue;
          this.free(t.gpu);
          tiles.delete(key);
        }
      }
      this.stats.tiles = tiles.size;
      return out;
    }

    drawTiles(list, R, band) {
      const gl = this.gl, u = this.pw.u;
      if (!list.length) return;
      gl.uniform4f(u.uLod, R, band, 1, 0);
      for (const t of list) {
        for (const pt of t.gpu) {
          this.bindMesh(pt);
          gl.drawElements(gl.TRIANGLES, pt.count, gl.UNSIGNED_SHORT, 0);
          this.stats.draws++;
          this.stats.tris += pt.count / 3;
        }
      }
      gl.uniform4f(u.uLod, 0, 0, 0, 0);
    }

    drawWorld(env, cam, C, opts = {}) {
      const gl = this.gl, u = this.pw.u;
      const dist = opts.dist || this.opts.draw;
      const vis = this.visibleChunks(cam, C, dist);
      this.stats.chunks = vis.length;
      let budget = opts.noUpload ? 0 : (opts.budget || 3);
      for (const v of vis) budget = this.ensureChunk(v.ch, v.d < 300 ? Math.max(budget, 1) : budget);
      const fl = this.floraTiles(cam, opts);
      if (!opts.noUpload) this.floraState = fl;
      const groups = new Map();
      for (const v of vis) {
        if (!v.ch.gpu) continue;
        for (const key of Object.keys(v.ch.gpu)) {
          const m = v.ch.gpu[key];
          if (!m) continue;
          if (key === 'trees' && v.d > dist * 0.95) continue;
          if (key.startsWith('x_') && v.d > DETAIL_DIST) continue;
          const gm = GROUP_MODE[key];
          if (gm && gm.far && v.d > gm.far) continue;
          const k2 = gm && gm.lod && fl && fl.R > 0 && v.d < fl.R + LOD_BAND ? key + '@' : key;
          let arr = groups.get(k2);
          if (!arr) groups.set(k2, arr = []);
          arr.push(m);
        }
      }
      gl.uniformMatrix4fv(u.uModel, false, this.ident);
      const order = [...groups.keys()].sort((a, b) => rank(a) - rank(b));
      for (const key of order) {
        const lodded = key.endsWith('@'), k0 = lodded ? key.slice(0, -1) : key;
        const base = k0.startsWith('x_') ? k0.slice(2) : k0;
        const mode = GROUP_MODE[base] || { cull: true };
        const texName = k0 === '__props' ? 'white' : k0 === '__street' ? 'street' : k0 === '__ads' ? 'adatlas' : mode.tex || base;
        gl.bindTexture(gl.TEXTURE_2D, this.tex(texName));
        if (mode.cull === false || mode.road) gl.disable(gl.CULL_FACE); else gl.enable(gl.CULL_FACE);
        if (mode.road) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-mode.road, -3 * mode.road); }
        gl.uniform1f(u.uAlphaTest, mode.alpha ? 1 : 0);
        gl.uniform1f(u.uRoad, mode.road && key !== 'rail' ? 1 : 0);
        gl.uniform1f(u.uCaster, receiverOnly(base) ? 0 : 1);
        if (lodded) gl.uniform4f(u.uLod, fl.R, LOD_BAND, 2, 0);
        for (const mesh of groups.get(key)) {
          for (const pt of mesh) {
            this.bindMesh(pt);
            gl.drawElements(gl.TRIANGLES, pt.count, gl.UNSIGNED_SHORT, 0);
            this.stats.draws++;
            this.stats.tris += pt.count / 3;
          }
        }
        if (lodded) gl.uniform4f(u.uLod, 0, 0, 0, 0);
        if (mode.road) gl.disable(gl.POLYGON_OFFSET_FILL);
      }
      if (fl && (fl.trees.length || fl.grass.length)) {
        gl.disable(gl.CULL_FACE);
        gl.uniform1f(u.uAlphaTest, 1);
        gl.uniform1f(u.uRoad, 0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex('flora'));
        if (fl.R > 0) this.drawTiles(fl.trees, fl.R, LOD_BAND);
        if (fl.gR > 0) this.drawTiles(fl.grass, fl.gR, LOD_BAND * 1.6);
      }
      gl.uniform1f(u.uAlphaTest, 0);
      gl.uniform1f(u.uRoad, 0);
      gl.uniform1f(u.uCaster, 1);
      gl.enable(gl.CULL_FACE);
      if (this.scene && !opts.noLandmarks) {
        gl.disable(gl.CULL_FACE);
        gl.bindTexture(gl.TEXTURE_2D, this.tex('lmatlas'));
        gl.uniform1f(u.uAlphaTest, 1);
        gl.uniform1f(u.uFlood, (env.night || 0) * 0.42);
        const far = Math.max(dist * 3.2, 2400);
        for (const lm of this.scene.landmarks) {
          const d = Math.hypot(lm.x - cam.x, lm.z - cam.z);
          if (d > far || (d > dist + 150 && lm.h < 45)) continue;
          if (!M4.boxVisible(C.planes, lm.x - 90, lm.y - 5, lm.z - 90, lm.x + 90, lm.y + lm.h + 5, lm.z + 90)) continue;
          if (!lm.gpu) lm.gpu = this.upload(lm.batch);
          gl.uniform1f(u.uFogScale, d > dist * 0.8 ? Math.max(0.28, (dist * 0.8) / d) : 1);
          this.drawMesh(lm.gpu, this.ident);
        }
        gl.uniform1f(u.uFogScale, 1);
        gl.uniform1f(u.uAlphaTest, 0);
        gl.uniform1f(u.uFlood, 0);
        gl.enable(gl.CULL_FACE);
      }
      return vis;
    }

    drawCar(car, env, minLod = 0) {
      const gl = this.gl, u = this.pw.u;
      const m = this.carMesh(car.id, car.wing);
      const model = M4.pose(car.x, car.y, car.z, car.yaw, car.pitch || 0, car.roll || 0, 1, this.model);
      const p1 = car.paint1 || [0.8, 0.8, 0.8], p2 = car.paint2 || p1;
      const main = this.prog === this.pw;
      if (main) {
        gl.uniform3f(u.uPaint1, p1[0], p1[1], p1[2]);
        gl.uniform3f(u.uPaint2, p2[0], p2[1], p2[2]);
        this.setU('uLights', car.lights || 0);
        this.setU('uBrake', car.brake || 0);
        this.setU('uReverse', car.reverse ? 1 : 0);
        this.setU('uMetal', car.metal ? 1 : 0);
        this.setU('uDirt', car.dirt || 0);
      }
      const e = this.lodEye, d = e ? Math.hypot(car.x - e[0], car.y - e[1], car.z - e[2]) * (this.lodK || 1) : 0;
      const lod = Math.max(minLod, car.far ? 2 : d < LOD_DIST[0] ? 0 : d < LOD_DIST[1] ? 1 : 2);
      const geo = m.geo, def = F.Cars.get(car.id);
      if (main) {
        const lv = car.livery || 'none', sk = m.skins[lv] || (m.skins[lv] = this.carSkin(car.id, lv, geo.skin)), mk = sk.mask || this.blank();
        if (mk !== this.mask3) {
          gl.activeTexture(gl.TEXTURE3);
          gl.bindTexture(gl.TEXTURE_2D, mk);
          gl.activeTexture(gl.TEXTURE0);
          this.mask3 = mk;
        }
        gl.bindTexture(gl.TEXTURE_2D, sk.tex);
        this.setU('uSkin', 1);
      } else gl.bindTexture(gl.TEXTURE_2D, this.tex('caratlas'));
      const cut = geo.cuts[lod], mesh = this.dentMesh(car, m, lod) || m.lods[lod];
      if (lod === 0) gl.disable(gl.CULL_FACE);
      if (cut) {
        const first = lod === 0 && car.wipe >= 0 ? cut.w : 0, end = !main ? cut.g : car.inside ? cut.b : lod > 0 ? cut.g : cut.c;
        this.drawRange(mesh, model, first, end - first);
      } else this.drawMesh(mesh, model);
      if (main) gl.enable(gl.CULL_FACE);
      const up = car.popup !== undefined ? car.popup : car.lights || 0;
      if (main && m.lamp && lod < 2 && up > 0.02) {
        if (geo.lamp.hinge) this.drawMesh(m.lamp, M4.mul(model, lampPose(this.wheelT, geo.lamp.hinge, geo.lamp.shut * (1 - Math.min(1, up))), this.wheelM));
        else if (up > 0.5) this.drawMesh(m.lamp, model);
      }
      if (main && lod === 0 && m.wblade && car.wipe >= 0) {
        const wp = geo.wiper, a = wp.sweep * (0.5 - 0.5 * Math.cos(Math.PI * 2 * car.wipe / WIPE_T));
        for (const p of wp.pivots) this.drawMesh(m.wblade, M4.mul(model, wiperPose(this.wheelT, wp, p, a), this.wheelM));
      }
      if (main && car.dirt) this.setU('uDirt', car.dirt * 0.55);
      if (main && cut && lod === 0 && !car.inside && cut.g > cut.c) {
        const q = this.glassQ, k = this.glassN++;
        const slot = q[k] || (q[k] = { mesh: null, first: 0, count: 0, model: new Float32Array(16), d: 0 });
        slot.mesh = mesh; slot.first = cut.c; slot.count = cut.g - cut.c; slot.model.set(model); slot.d = d;
      }
      const tread = F.Models.treadOf(def, car.tires);
      const red = (car.brakes | 0) > 0 || (def.cla || 0) >= 0.1;
      const tmp = this.wheelT, wm = this.wheelM, dm = car.dmg && car.dmg.log.length ? car.dmg : null;
      for (let i = 0; i < 4 && lod < 2; i++) {
        const wl = geo.wheels[i];
        const left = wl.x < 0;
        const toe = dm ? Math.sign(dm.toeRaw[i]) * Math.min(0.06, Math.abs(dm.toeRaw[i]) * 0.3) : 0;
        const steer = (wl.front ? (car.steer || 0) : 0) + toe;
        const spin = (car.spins ? -car.spins[i] : (car.spin || 0)) * (left ? -1 : 1);
        const rate = car.rates ? car.rates[i] : (car.speed || 0) / wl.r;
        const kind = lod ? 'far' : Math.abs(rate) > BLUR_RATE ? 'blur' : 'sharp';
        const drop = (car.susp ? car.susp[i] : 0) + (dm && dm.flat[i] && (!car.susp || !dm.mechOn) ? 0.07 : 0);
        M4.mul(model, wheelPose(tmp, wl, steer, left, spin, drop), wm);
        this.drawMesh(this.wheelMesh(def, tread, kind, !wl.front), wm);
        if (kind === 'sharp' && main && d < BRAKE_DIST) {
          M4.mul(model, wheelPose(tmp, wl, steer, left, 0, drop), wm);
          this.drawMesh(this.brakeMesh(def, red), wm);
        }
      }
      if (main) {
        this.setU('uLights', 0);
        this.setU('uBrake', 0);
        this.setU('uReverse', 0);
        this.setU('uMetal', 0);
        this.setU('uDirt', 0);
        this.setU('uSkin', 0);
        if (lod === 0 && car.driver && !car.inside && !(car.dmg && car.dmg.burnt)) this.drawDriver(car, geo, model, false, false);
      }
      return m;
    }

    flushGlass(cutout = false) {
      const n = this.glassN, q = this.glassQ;
      if (!n) return;
      const gl = this.gl;
      this.glassN = 0;
      for (let i = 1; i < n; i++) {
        const s = q[i];
        let j = i - 1;
        while (j >= 0 && q[j].d < s.d) { q[j + 1] = q[j]; j--; }
        q[j + 1] = s;
      }
      gl.bindTexture(gl.TEXTURE_2D, this.tex('caratlas'));
      gl.enable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      if (cutout) gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      else gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.depthMask(false);
      for (let i = 0; i < n; i++) this.drawRange(q[i].mesh, q[i].model, q[i].first, q[i].count);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    cabinShadow(car, env) {
      const gl = this.gl, S = 512;
      this.cabinOn = false;
      if (this.opts.gfx !== 'ultra' || !env.sunUp || env.cover > 0.85) return;
      if (!this.cabinFbo) {
        this.cabinTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.cabinTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const depth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, S, S);
        this.cabinFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.cabinFbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.cabinTex, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.cabinM = new Float32Array(16);
        this.cabinInv = new Float32Array(16);
        this.cabinVP = new Float32Array(16);
        this.cabinKey = new Float32Array(4).fill(NaN);
      }
      const m = this.carMesh(car.id, car.wing), sd = env.sunDir, steer = car.steer || 0;
      const M = M4.pose(car.x, car.y, car.z, car.yaw, car.pitch || 0, car.roll || 0, 1, this.cabinM);
      const lx = M[0] * sd[0] + M[1] * sd[1] + M[2] * sd[2], ly = M[4] * sd[0] + M[5] * sd[1] + M[6] * sd[2], lz = M[8] * sd[0] + M[9] * sd[1] + M[10] * sd[2];
      const k = this.cabinKey;
      const pk = car.driver && car.driver.anim ? car.driver.anim.key : 0;
      if (this.cabinFor !== m || this.cabinPose !== pk || !(Math.abs(k[0] - lx) < 0.004 && Math.abs(k[1] - ly) < 0.004 && Math.abs(k[2] - lz) < 0.004 && Math.abs(k[3] - steer) < 0.01)) {
        k[0] = lx; k[1] = ly; k[2] = lz; k[3] = steer;
        this.cabinPose = pk;
        this.cabinFor = m;
        const half = 3.2, up = Math.abs(ly) > 0.98 ? [0, 0, 1] : [0, 1, 0];
        this.cabinLocal = M4.mul(M4.ortho(-half, half, -half, half, 10, 30), M4.lookAt(lx * 20, 1 + ly * 20, lz * 20, 0, 1, 0, up[0], up[1], up[2]));
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.cabinFbo);
        gl.viewport(0, 0, S, S);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        const pd = this.pd;
        gl.useProgram(pd.p);
        this.prog = pd;
        gl.uniformMatrix4fv(pd.u.uLVP, false, this.cabinLocal);
        gl.uniform1i(pd.u.uTex, 0);
        gl.uniform1f(pd.u.uAlphaTest, 0);
        gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1);
        gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
        gl.disable(gl.CULL_FACE);
        const cut = m.geo.cuts[0];
        this.drawRange(this.dentMesh(car, m, 0) || m.lods[0], this.ident, cut.w, cut.b - cut.w);
        this.drawMesh(m.cock, this.ident);
        this.drawMesh(m.swheel, steerPose(this.wheelT, m.geo.cockpit, steer));
        if (car.driver) this.drawDriver(car, m.geo, this.ident, false, true);
        gl.enable(gl.CULL_FACE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        this.prog = this.pw;
      }
      const inv = this.cabinInv, t0 = M[12], t1 = M[13], t2 = M[14];
      inv[0] = M[0]; inv[1] = M[4]; inv[2] = M[8]; inv[3] = 0;
      inv[4] = M[1]; inv[5] = M[5]; inv[6] = M[9]; inv[7] = 0;
      inv[8] = M[2]; inv[9] = M[6]; inv[10] = M[10]; inv[11] = 0;
      inv[12] = -(M[0] * t0 + M[1] * t1 + M[2] * t2); inv[13] = -(M[4] * t0 + M[5] * t1 + M[6] * t2); inv[14] = -(M[8] * t0 + M[9] * t1 + M[10] * t2); inv[15] = 1;
      M4.mul(this.cabinLocal, inv, this.cabinVP);
      this.cabinOn = true;
    }

    shadowPass(env, center, cars, extra) {
      const gl = this.gl;
      this.shadowOn = false;
      if (this.opts.gfx !== 'ultra' || !env.sunUp || env.cover > 0.85 || !this.scene) return;
      const S = this.shadowSize;
      if (!this.shadowFbo) {
        this.shadowTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.shadowTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, S, S, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const depth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, S, S);
        this.shadowFbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.shadowTex, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      }
      const half = SHADOW_HALF, sd = env.sunDir;
      const up = Math.abs(sd[1]) > 0.98 ? [0, 0, 1] : [0, 1, 0];
      let rx = up[1] * sd[2] - up[2] * sd[1], ry = up[2] * sd[0] - up[0] * sd[2], rz = up[0] * sd[1] - up[1] * sd[0];
      const rl = Math.hypot(rx, ry, rz) || 1;
      rx /= rl; ry /= rl; rz /= rl;
      const ux = sd[1] * rz - sd[2] * ry, uy = sd[2] * rx - sd[0] * rz, uz = sd[0] * ry - sd[1] * rx;
      const texel = half * 2 / S, A = this.shadowAnchor || (this.shadowAnchor = [center.x, center.y, center.z]);
      const ex = center.x - A[0], ey = center.y - A[1], ez = center.z - A[2];
      const sr = Math.round((ex * rx + ey * ry + ez * rz) / texel) * texel, su = Math.round((ex * ux + ey * uy + ez * uz) / texel) * texel;
      const along = ex * sd[0] + ey * sd[1] + ez * sd[2];
      A[0] += rx * sr + ux * su + sd[0] * along; A[1] += ry * sr + uy * su + sd[1] * along; A[2] += rz * sr + uz * su + sd[2] * along;
      const view = M4.lookAt(A[0] + sd[0] * 300, A[1] + sd[1] * 300, A[2] + sd[2] * 300, A[0], A[1], A[2], up[0], up[1], up[2]);
      if (center.eye) { this.lodEye = center.eye; this.lodK = center.lodK || 1; }
      this.shadowVP = M4.mul(M4.ortho(-half, half, -half, half, 1, 700), view);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowFbo);
      gl.viewport(0, 0, S, S);
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const pd = this.pd;
      gl.useProgram(pd.p);
      this.prog = pd;
      gl.uniformMatrix4fv(pd.u.uLVP, false, this.shadowVP);
      gl.uniform1i(pd.u.uTex, 0);
      gl.uniform1f(pd.u.uAlphaTest, 0);
      this.windUniforms(pd.u, env);
      gl.activeTexture(gl.TEXTURE0);
      gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1);
      gl.enableVertexAttribArray(2); gl.enableVertexAttribArray(3);
      gl.disable(gl.CULL_FACE);
      const reach = half * 1.45 + 130;
      for (const ch of this.scene.chunks) {
        if (!ch.gpu) continue;
        const mx = (ch.x0 + ch.x1) / 2, mz = (ch.z0 + ch.z1) / 2;
        if (Math.abs(mx - center.x) > reach || Math.abs(mz - center.z) > reach) continue;
        const fs = this.floraState, nearCh = fs && fs.R >= 125 && Math.hypot(Math.max(0, Math.abs(fs.cam[0] - mx) - 125), Math.max(0, Math.abs(fs.cam[1] - mz) - 125)) < fs.R - 10;
        for (const key of Object.keys(ch.gpu)) {
          const mesh = ch.gpu[key];
          if (!mesh || receiverOnly(key)) continue;
          if (nearCh && GROUP_MODE[key] && GROUP_MODE[key].lod) continue;
          const base = key === '__props' ? 'white' : key === '__street' ? 'street' : key === '__ads' ? 'adatlas' : key.startsWith('x_') ? key.slice(2) : key;
          const gm = GROUP_MODE[base];
          gl.uniform1f(pd.u.uAlphaTest, (gm && gm.alpha) || base === 'adatlas' || base === 'street' ? 1 : 0);
          gl.bindTexture(gl.TEXTURE_2D, this.tex(gm && gm.tex || base));
          gl.uniformMatrix4fv(pd.u.uModel, false, this.ident);
          for (const pt of mesh) {
            this.bindMesh(pt);
            gl.drawElements(gl.TRIANGLES, pt.count, gl.UNSIGNED_SHORT, 0);
            this.stats.draws++;
          }
        }
      }
      gl.uniform1f(pd.u.uAlphaTest, 1);
      const fs = this.floraState;
      if (fs && fs.trees.length) {
        gl.bindTexture(gl.TEXTURE_2D, this.tex('flora'));
        gl.uniformMatrix4fv(pd.u.uModel, false, this.ident);
        for (const t of fs.trees) {
          if (Math.abs(t.x0 + t.size / 2 - center.x) > reach + 60 || Math.abs(t.z0 + t.size / 2 - center.z) > reach + 60) continue;
          for (const pt of t.gpu) { this.bindMesh(pt); gl.drawElements(gl.TRIANGLES, pt.count, gl.UNSIGNED_SHORT, 0); this.stats.draws++; }
        }
      }
      gl.bindTexture(gl.TEXTURE_2D, this.tex('lmatlas'));
      for (const lm of this.scene.landmarks) {
        if (!lm.gpu || Math.abs(lm.x - center.x) > reach + 60 || Math.abs(lm.z - center.z) > reach + 60) continue;
        this.drawMesh(lm.gpu, this.ident);
      }
      gl.uniform1f(pd.u.uAlphaTest, 0);
      for (const car of cars) this.drawCar(car, env, 0);
      if (extra) extra(center, reach);
      gl.enable(gl.CULL_FACE);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.prog = this.pw;
      this.shadowOn = true;
    }

    ensureTargets(w, h) {
      const gl = this.gl;
      const t = this.targets, deep = !!(this.wantDepth && this.depthExt);
      if (t && t.w === w && t.h === h && t.deep === deep) return t;
      if (t) for (const r of [t.scene, t.a, t.b, t.r1, t.r2, t.dof]) {
        if (!r) continue;
        gl.deleteFramebuffer(r.fbo); gl.deleteTexture(r.tex);
        if (r.depth) gl.deleteRenderbuffer(r.depth);
        if (r.zTex) gl.deleteTexture(r.zTex);
      }
      const depthTex = (tw, th) => {
        const z = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, z);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_STENCIL, tw, th, 0, gl.DEPTH_STENCIL, this.depthExt.UNSIGNED_INT_24_8_WEBGL, null);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, z, 0);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) return z;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, null, 0);
        gl.deleteTexture(z);
        this.depthExt = null;
        return null;
      };
      const make = (tw, th, depth) => {
        const tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        const fbo = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
        let rb = null;
        const zTex = depth && deep ? depthTex(tw, th) : null;
        if (depth && !zTex) {
          rb = gl.createRenderbuffer();
          gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
          gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, tw, th);
          gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rb);
        }
        return { fbo, tex, depth: rb, zTex, w: tw, h: th };
      };
      const bw = Math.max(8, Math.round(w / 4)), bh = Math.max(8, Math.round(h / 4));
      const scene = make(w, h, true);
      this.targets = { w, h, deep: !!scene.zTex, scene, a: make(bw, bh, false), b: make(bw, bh, false), r1: make(bw, bh, false), r2: make(bw, bh, false), dof: scene.zTex ? make(w, h, false) : null };
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return this.targets;
    }

    beginFrame(w, h) {
      const gl = this.gl;
      this.frameNo++;
      if (this.frameNo % 120 === 0) this.gcWrecks();
      if (this.post()) gl.bindFramebuffer(gl.FRAMEBUFFER, this.ensureTargets(w, h).scene.fbo);
      else gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
    }

    fullscreen(prog, target, tw, th) {
      const gl = this.gl;
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.viewport(0, 0, tw, th);
      gl.useProgram(prog.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.stats.draws++;
    }

    endFrame(fx) {
      if (!this.post()) return;
      const gl = this.gl, t = this.targets;
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.SCISSOR_TEST);
      gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3);
      gl.activeTexture(gl.TEXTURE0);
      gl.useProgram(this.pb.p);
      gl.bindTexture(gl.TEXTURE_2D, t.scene.tex);
      gl.uniform1i(this.pb.u.uSrc, 0);
      gl.uniform2f(this.pb.u.uTexel, 1 / t.w, 1 / t.h);
      gl.uniform1f(this.pb.u.uThr, fx.thr);
      gl.uniform1f(this.pb.u.uGain, 1);
      this.fullscreen(this.pb, t.a.fbo, t.a.w, t.a.h);
      gl.useProgram(this.pl.p);
      gl.uniform1i(this.pl.u.uSrc, 0);
      for (const k of [1, 2]) {
        gl.bindTexture(gl.TEXTURE_2D, t.a.tex);
        gl.useProgram(this.pl.p);
        gl.uniform2f(this.pl.u.uDir, k / t.a.w, 0);
        this.fullscreen(this.pl, t.b.fbo, t.b.w, t.b.h);
        gl.bindTexture(gl.TEXTURE_2D, t.b.tex);
        gl.useProgram(this.pl.p);
        gl.uniform2f(this.pl.u.uDir, 0, k / t.a.h);
        this.fullscreen(this.pl, t.a.fbo, t.a.w, t.a.h);
      }
      const rays = fx.rays > 0.004 && fx.sun;
      if (rays) {
        const s = this.prs, rr = this.prr;
        gl.useProgram(s.p);
        gl.bindTexture(gl.TEXTURE_2D, t.scene.tex);
        gl.uniform1i(s.u.uSrc, 0);
        gl.uniform2f(s.u.uTexel, 1.5 / t.w, 1.5 / t.h);
        gl.uniform2f(s.u.uSun, fx.sun[0], fx.sun[1]);
        gl.uniform1f(s.u.uAsp, t.w / t.h);
        gl.uniform3fv(s.u.uCol, fx.rayCol || [1, 0.9, 0.7]);
        this.fullscreen(s, t.r1.fbo, t.r1.w, t.r1.h);
        gl.useProgram(rr.p);
        gl.uniform1i(rr.u.uSrc, 0);
        gl.uniform2f(rr.u.uSun, fx.sun[0], fx.sun[1]);
        for (const [src, dst, len, dec, norm] of [[t.r1, t.r2, 0.85, 0.9, 0], [t.r2, t.r1, 0.18, 0.99, 1], [t.r1, t.r2, 0.05, 1, 1]]) {
          gl.bindTexture(gl.TEXTURE_2D, src.tex);
          gl.useProgram(rr.p);
          gl.uniform1f(rr.u.uLen, len);
          gl.uniform1f(rr.u.uDecay, dec);
          gl.uniform1f(rr.u.uNorm, norm);
          this.fullscreen(rr, dst.fbo, dst.w, dst.h);
        }
      }
      const src = fx.dof && t.dof ? this.dofPass(fx.dof) : t.scene;
      const pc = this.pc;
      gl.useProgram(pc.p);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, rays ? t.r2.tex : t.a.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, t.a.tex);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniformMatrix3fv(pc.u.uMat, false, fx.mat || IDENT3);
      gl.uniform3fv(pc.u.uOff, fx.off || ZERO3);
      gl.uniform1f(pc.u.uGrain, fx.grain || 0);
      gl.uniform1f(pc.u.uSeed, fx.seed || 0);
      gl.uniform2fv(pc.u.uBlurC, fx.blurC || BLUR_C);
      gl.uniform1i(pc.u.uScene, 0);
      gl.uniform1i(pc.u.uBloom, 1);
      gl.uniform1i(pc.u.uRays, 2);
      gl.uniform1f(pc.u.uRayK, rays ? fx.rays : 0);
      gl.uniform1f(pc.u.uBloomK, fx.bloom);
      gl.uniform1f(pc.u.uBlur, fx.blur);
      gl.uniform1f(pc.u.uSat, fx.sat);
      gl.uniform1f(pc.u.uContrast, fx.contrast);
      gl.uniform3fv(pc.u.uTint, fx.tint);
      gl.uniform1f(pc.u.uVig, fx.vig);
      gl.uniform1f(pc.u.uExpo, fx.expo);
      gl.uniform1f(pc.u.uDither, this.opts.dither ? 1 : 0);
      this.fullscreen(pc, null, t.w, t.h);
      gl.disableVertexAttribArray(0);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
    }

    dofPass(d) {
      const gl = this.gl, t = this.targets, p = this.pf, R = Math.max(1, d.maxR);
      gl.useProgram(p.p);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, t.scene.zTex);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, t.scene.tex);
      gl.uniform1i(p.u.uScene, 0);
      gl.uniform1i(p.u.uDepth, 1);
      gl.uniform2f(p.u.uTexel, 1 / t.w, 1 / t.h);
      gl.uniform4f(p.u.uLens, d.near, d.far, d.focus, d.k);
      gl.uniform2f(p.u.uStep, Math.max(0.6, R * R / 220), R);
      this.fullscreen(p, t.dof.fbo, t.w, t.h);
      return t.dof;
    }

    drawDyn(mesh, x, y, z, yaw, pitch = 0, roll = 0, tex = 'white', cull = false) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.tex(tex));
      if (cull) gl.enable(gl.CULL_FACE); else gl.disable(gl.CULL_FACE);
      this.drawMesh(mesh, M4.pose(x, y, z, yaw, pitch, roll, 1, this.model));
      gl.enable(gl.CULL_FACE);
    }

    drawInsideGlass(m, model, env, fx, mesh) {
      const gl = this.gl, u = this.pw.u, wp = m.geo.wiper;
      gl.uniform1f(u.uInGlass, 1);
      gl.uniform1f(u.uRainK, fx.rain || 0);
      if (wp) {
        const k = 1 / Math.max(0.2, wp.up[1]), y0 = wp.pivots[0][1];
        gl.uniform4f(u.uGlass, y0, k, wp.zTop, wp.xMax);
        gl.uniform4f(u.uPiv, wp.pivots[0][0], 0, wp.pivots[1][0], 0);
        gl.uniform4f(u.uWipe, Math.max(0, fx.wipe), WIPE_T, fx.wipe >= 0 ? 1 : 0, 0);
        gl.uniform1f(u.uWipeLen, wp.len * 1.04);
        gl.uniform1f(u.uWipeA, wp.sweep);
      } else gl.uniform4f(u.uWipe, 0, WIPE_T, 0, 0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex('white'));
      gl.enable(gl.CULL_FACE);
      gl.cullFace(gl.FRONT);
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.depthMask(false);
      const cut = m.geo.cuts[0];
      this.drawRange(mesh || m.lods[0], model, cut.c, cut.g - cut.c);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.cullFace(gl.BACK);
      gl.uniform1f(u.uInGlass, 0);
    }

    drawCockpit(car, cam, C, env, cluster, fx) {
      const gl = this.gl, u = this.pw.u;
      const m = this.carMesh(car.id, car.wing);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const model = M4.pose(car.x, car.y, car.z, car.yaw, car.pitch || 0, car.roll || 0, 1, this.model);
      const p1 = car.paint1 || [0.8, 0.8, 0.8];
      gl.uniform3f(u.uPaint1, p1[0], p1[1], p1[2]);
      gl.disable(gl.CULL_FACE);
      gl.bindTexture(gl.TEXTURE_2D, this.tex('caratlas'));
      gl.uniform1f(u.uInside, 1);
      if (this.cabinOn) {
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.cabinTex);
        gl.activeTexture(gl.TEXTURE0);
        this.shadowUniforms(this.cabinVP, 512, true, CABIN_BIAS);
        gl.uniform1f(u.uCabin, 1);
      }
      this.drawMesh(m.cock, model);
      this.drawMesh(m.swheel, M4.mul(model, steerPose(this.wheelT, m.geo.cockpit, car.steer || 0), this.wheelM));
      if (car.driver && car.driverPart) this.drawDriver(car, m.geo, model, car.driverPart === 'body', true);
      gl.uniform1f(u.uInside, 0);
      if (cluster) this.drawCluster(car.id, m, model, cluster);
      if (fx && m.geo.cuts[0] && this.opts.gfx !== 'retro') this.drawInsideGlass(m, model, env, fx, this.dentMesh(car, m, 0));
      if (this.cabinOn) {
        gl.uniform1f(u.uCabin, 0);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowTex || this.tex('white'));
        gl.activeTexture(gl.TEXTURE0);
        this.shadowUniforms(this.shadowVP, this.shadowSize, this.shadowOn && !env.studio, this.shadowBias);
      }
      gl.enable(gl.CULL_FACE);
      return m;
    }

    drawCluster(id, m, model, cl) {
      const gl = this.gl, u = this.pw.u, cp = m.geo.cockpit, f = cp.face, glow = cl.pal.glow;
      gl.uniform1f(u.uFlat, 0.3);
      gl.uniform3f(u.uDial, glow[0] * 1.25, glow[1] * 1.25, glow[2] * 1.25);
      const gpu = cl.gpu || (cl.gpu = { face: 'face|' + cl.faceKey, needle: this.needleMesh(cl.pal.needle), lcd: this.lcdMesh(id, cp, cl.layout), glass: this.glassMesh(id, f) });
      this.canvasTex(gpu.face, cl.face, false, true);
      this.drawMesh(m.gauge, model);
      gl.uniform3f(u.uDial, 1.1, 1.1, 1.1);
      gl.bindTexture(gl.TEXTURE_2D, this.tex('white'));
      const dials = cl.layout.dials;
      for (let i = 0; i < dials.length; i++) {
        M4.mul(model, dialPose(this.wheelT, f, dials[i], cl.needles[i].a), this.wheelM);
        this.drawMesh(gpu.needle, this.wheelM);
      }
      gl.uniform1f(u.uFlat, 1);
      this.canvasTex('lcd', cl.lcd, cl.dirty, false);
      cl.dirty = false;
      this.drawMesh(gpu.lcd, model);
      gl.uniform1f(u.uFlat, 0);
      gl.bindTexture(gl.TEXTURE_2D, this.tex('white'));
      gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
      gl.depthMask(false);
      gl.uniform1f(u.uAlpha, 0.16);
      this.drawMesh(gpu.glass, model);
      gl.uniform1f(u.uAlpha, 1);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

    canvasTex(key, cv, dirty, mips) {
      const gl = this.gl;
      let t = this.textures.get(key);
      const fresh = !t;
      if (fresh) { t = gl.createTexture(); this.textures.set(key, t); }
      gl.bindTexture(gl.TEXTURE_2D, t);
      if (fresh || dirty) {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv);
        if (mips) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      return t;
    }

    needleMesh(hex) {
      const key = 'needle|' + hex;
      let m = this.meshes.get(key);
      if (!m) {
        const b = new F.Batch(64), col = F.col(hex), cap = F.col('#161616');
        b.quad([-0.18, -0.028, 0], [0.9, -0.011, 0], [0.9, 0.011, 0], [-0.18, 0.028, 0], col, F.MAT.DIAL, null, [0, 0, 1]);
        b.triangle([0.9, -0.011, 0], [1, 0, 0], [0.9, 0.011, 0], col, F.MAT.DIAL);
        for (let i = 0; i < 8; i++) {
          const a0 = i / 8 * Math.PI * 2, a1 = (i + 1) / 8 * Math.PI * 2;
          b.triangle([0, 0, 0.004], [Math.cos(a0) * 0.085, Math.sin(a0) * 0.085, 0.004], [Math.cos(a1) * 0.085, Math.sin(a1) * 0.085, 0.004], cap, 0);
        }
        m = this.upload(b);
        this.meshes.set(key, m);
      }
      return m;
    }

    lcdMesh(id, cp, lay) {
      const key = 'lcd|' + id;
      let m = this.meshes.get(key);
      if (!m) {
        const b = new F.Batch(128), f = cp.face, white = F.col('#ffffff'), H = F.Cluster.lcdH(lay);
        const P = (px, py) => [0, 1, 2].map(i => f.c[i] + f.r[i] * (px / 256 - 1) * f.hw + f.u[i] * (1 - py / 128) * f.hh + f.n[i] * 0.0025);
        const put = (x, y, w, h, r) => {
          const u0 = r[0] / 256, v0 = r[1] / H, u1 = (r[0] + r[2]) / 256, v1 = (r[1] + r[3]) / H;
          b.quad(P(x - w / 2, y + h / 2), P(x + w / 2, y + h / 2), P(x + w / 2, y - h / 2), P(x - w / 2, y - h / 2), white, 0, [u0, v1, u1, v1, u1, v0, u0, v0], f.n);
        };
        for (const l of lay.lcd) put(l.x, l.y, l.w, l.h, F.Cluster.SLOTS[l.k]);
        lay.lamps.forEach((l, i) => put(l.x, l.y, 18, 18, F.Cluster.LAMP_CELL(i)));
        if (cp.radio) {
          const r = F.Cluster.SLOTS.radio, q = cp.radio;
          const u0 = r[0] / 256, v0 = r[1] / H, u1 = (r[0] + r[2]) / 256, v1 = (r[1] + r[3]) / H;
          b.quad(q[0], q[1], q[2], q[3], white, 0, [u0, v1, u1, v1, u1, v0, u0, v0], [0, 0, 1]);
        }
        m = this.upload(b);
        this.meshes.set(key, m);
      }
      return m;
    }

    glassMesh(id, f) {
      const key = 'cglass|' + id;
      let m = this.meshes.get(key);
      if (!m) {
        const b = new F.Batch(16);
        const P = (sx, sy) => [0, 1, 2].map(i => f.c[i] + f.r[i] * sx * f.fx + f.u[i] * sy * f.fy + f.n[i] * 0.012);
        b.quad(P(-1, -1), P(1, -1), P(1, 1), P(-1, 1), F.col('#ffffff'), F.MAT.GLASS, null, f.n);
        m = this.upload(b);
        this.meshes.set(key, m);
      }
      return m;
    }

    beginSprites() { this.spN = 0; this.spList = []; }

    sprite(tex, add, x, y, z, rx, ry, rz, ux, uy, uz, col, uv) {
      if (this.spN >= 4000) return;
      let batch = this.spList[this.spList.length - 1];
      if (!batch || batch.tex !== tex || batch.add !== add) { batch = { tex, add, start: this.spN, n: 0 }; this.spList.push(batch); }
      const f = this.sprites;
      const b = this.spN * 36;
      const u0 = uv ? uv[0] : 0, v0 = uv ? uv[1] : 0, u1 = uv ? uv[2] : 1, v1 = uv ? uv[3] : 1;
      const P = [[x - rx - ux, y - ry - uy, z - rz - uz, u0, v1], [x + rx - ux, y + ry - uy, z + rz - uz, u1, v1], [x + rx + ux, y + ry + uy, z + rz + uz, u1, v0], [x - rx + ux, y - ry + uy, z - rz + uz, u0, v0]];
      for (let k = 0; k < 4; k++) {
        const o = b + k * 9;
        f[o] = P[k][0]; f[o + 1] = P[k][1]; f[o + 2] = P[k][2]; f[o + 3] = P[k][3]; f[o + 4] = P[k][4];
        f[o + 5] = col[0]; f[o + 6] = col[1]; f[o + 7] = col[2]; f[o + 8] = col[3];
      }
      this.spN++;
      batch.n++;
    }

    billboard(tex, add, x, y, z, size, col, C, uv, stretchUp = 0) {
      const v = C.view;
      const rx = v[0] * size, ry = v[4] * size, rz = v[8] * size;
      const ux = v[1] * (size + stretchUp), uy = v[5] * (size + stretchUp), uz = v[9] * (size + stretchUp);
      this.sprite(tex, add, x, y, z, rx, ry, rz, ux, uy, uz, col, uv);
    }

    flushSprites(env, cam, C, noFog = false) {
      if (!this.spN) return;
      const gl = this.gl, s = this.pp;
      gl.useProgram(s.p);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.spBuf);
      gl.bufferData(gl.ARRAY_BUFFER, this.sprites.subarray(0, this.spN * 36), gl.STREAM_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.spIdx);
      gl.enableVertexAttribArray(s.a.aPos); gl.enableVertexAttribArray(s.a.aUV); gl.enableVertexAttribArray(s.a.aCol);
      gl.vertexAttribPointer(s.a.aPos, 3, gl.FLOAT, false, 36, 0);
      gl.vertexAttribPointer(s.a.aUV, 2, gl.FLOAT, false, 36, 12);
      gl.vertexAttribPointer(s.a.aCol, 4, gl.FLOAT, false, 36, 20);
      gl.uniformMatrix4fv(s.u.uVP, false, C.vp);
      gl.uniform3f(s.u.uCam, cam.x, cam.y, cam.z);
      gl.uniform2f(s.u.uFog, env.fogNear, env.fogFar);
      gl.uniform1f(s.u.uFogScale, noFog ? 0 : 1);
      gl.uniform3fv(s.u.uFogCol, env.fogCol);
      this.mistUniform(s.u, env);
      gl.uniform1i(s.u.uTex, 0);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND);
      gl.depthMask(false);
      for (const bt of this.spList) {
        if (bt.add) gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE); else gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);
        gl.uniform1f(s.u.uAdd, bt.add ? 1 : 0);
        gl.bindTexture(gl.TEXTURE_2D, this.tex(bt.tex));
        if (GROUND_DECALS.has(bt.tex)) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(-4, -16); }
        gl.drawElements(gl.TRIANGLES, bt.n * 6, gl.UNSIGNED_SHORT, bt.start * 12);
        gl.disable(gl.POLYGON_OFFSET_FILL);
        this.stats.draws++;
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.enable(gl.CULL_FACE);
      gl.disableVertexAttribArray(s.a.aPos); gl.disableVertexAttribArray(s.a.aUV); gl.disableVertexAttribArray(s.a.aCol);
      this.spN = 0;
      this.spList = [];
    }

    ensureFbo() {
      const gl = this.gl;
      if (!this.fbo) {
        this.fbo = gl.createFramebuffer();
        this.fboTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        this.fboDepth = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.fboDepth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.fboDepth);
      }
    }

    thumbnail(id, paint1, paint2, livery, wing, w = 256, h = 150, metal = false) {
      const gl = this.gl;
      this.ensureFbo();
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, w, h);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const car = F.Cars.get(id);
      const L = Math.max(car.sh.len, 3.7);
      const cam = { x: -L * 0.95, y: 1.35, z: -L * 0.62, tx: 0, ty: 0.45, tz: 0, fov: 30 };
      const C = this.camera(cam, w, h);
      const env = studioEnv();
      this.setWorldUniforms(env, cam, C);
      gl.uniform1f(this.pw.u.uDither, 0);
      gl.uniform1f(this.pw.u.uShadowOn, 0);
      this.drawCar({ id, livery, wing, metal, x: 0, y: 0, z: 0, yaw: 0, paint1: paint1, paint2: paint2 || paint1 }, env);
      this.flushGlass(true);
      const px = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      const cv = F.Tex.canvas(w, h);
      const ctx = cv.getContext('2d');
      const img = ctx.createImageData(w, h);
      for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
      ctx.putImageData(img, 0, 0);
      gl.clearColor(0, 0, 0, 1);
      return cv;
    }

    destroy() {
      const gl = this.gl;
      for (const t of this.textures.values()) gl.deleteTexture(t);
      for (const s of this.skins.values()) { gl.deleteTexture(s.tex); if (s.mask) gl.deleteTexture(s.mask); }
      if (this.blankTex) gl.deleteTexture(this.blankTex);
      if (this.cube) { gl.deleteTexture(this.cube); gl.deleteFramebuffer(this.cubeFbo); }
      for (const m of this.meshes.values()) {
        if (Array.isArray(m)) this.free(m);
        else {
          for (const k of ['cock', 'swheel', 'gauge', 'lamp', 'wblade']) this.free(m[k]);
          for (const l of m.lods) this.free(l);
        }
      }
      if (this.scene) {
        for (const ch of this.scene.chunks) if (ch.gpu) for (const k of Object.keys(ch.gpu)) this.free(ch.gpu[k]);
        for (const lm of this.scene.landmarks) this.free(lm.gpu);
      }
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }
  }

  function steerPose(out, cp, steer) {
    const wp = cp.wheelPos, rot = -steer * 7.5, cr = Math.cos(rot), sr = Math.sin(rot), ct = Math.cos(cp.tilt), st = Math.sin(cp.tilt);
    out[0] = cr; out[1] = sr * ct; out[2] = sr * st; out[3] = 0;
    out[4] = -sr; out[5] = cr * ct; out[6] = cr * st; out[7] = 0;
    out[8] = 0; out[9] = -st; out[10] = ct; out[11] = 0;
    out[12] = wp[0]; out[13] = wp[1]; out[14] = wp[2]; out[15] = 1;
    return out;
  }

  function wiperPose(out, wp, p, a) {
    const c = Math.cos(a), s = Math.sin(a), u = wp.up, n = wp.n;
    const x0 = c, x1 = s * u[1], x2 = s * u[2];
    out[0] = x0; out[1] = x1; out[2] = x2; out[3] = 0;
    out[4] = n[0]; out[5] = n[1]; out[6] = n[2]; out[7] = 0;
    out[8] = x1 * n[2] - x2 * n[1]; out[9] = x2 * n[0] - x0 * n[2]; out[10] = x0 * n[1] - x1 * n[0]; out[11] = 0;
    out[12] = p[0] + n[0] * 0.02; out[13] = p[1] + n[1] * 0.02; out[14] = p[2] + n[2] * 0.02; out[15] = 1;
    return out;
  }

  function lampPose(out, hinge, a) {
    const c = Math.cos(a), s = Math.sin(a), hy = hinge[0], hz = hinge[1];
    out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = c; out[6] = s; out[7] = 0;
    out[8] = 0; out[9] = -s; out[10] = c; out[11] = 0;
    out[12] = 0; out[13] = hy - c * hy + s * hz; out[14] = hz - s * hy - c * hz; out[15] = 1;
    return out;
  }

  function dialPose(out, f, d, deg) {
    const len = d.r * ((d.len || 0.86) - (d.from || 0)) * 2 * f.hw / 512, wide = d.from ? d.r * 0.2 * 2 * f.hw / 512 : len, off = d.r * (d.from || 0) * 2 * f.hw / 512;
    const px = (d.x / 256 - 1) * f.hw, py = (1 - d.y / 128) * f.hh;
    const a = (deg - 90) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    for (let i = 0; i < 3; i++) {
      out[i] = (f.r[i] * c - f.u[i] * s) * len;
      out[4 + i] = (f.r[i] * s + f.u[i] * c) * wide;
      out[8 + i] = f.n[i] * wide;
      out[12 + i] = f.c[i] + f.r[i] * px + f.u[i] * py + f.n[i] * 0.003 + (f.r[i] * c - f.u[i] * s) * off;
    }
    out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
    return out;
  }

  function wheelPose(out, wl, steer, left, spin, drop) {
    const yaw = steer + (left ? Math.PI : 0);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cs = Math.cos(spin), ss = Math.sin(spin);
    out[0] = cy; out[1] = 0; out[2] = -sy; out[3] = 0;
    out[4] = sy * ss; out[5] = cs; out[6] = cy * ss; out[7] = 0;
    out[8] = sy * cs; out[9] = -ss; out[10] = cy * cs; out[11] = 0;
    out[12] = wl.x; out[13] = wl.y - drop; out[14] = wl.z; out[15] = 1;
    return out;
  }

  function rank(key) {
    if (key === 'ground') return 0;
    if (key === 'water') return 1;
    if (GROUP_MODE[key] && GROUP_MODE[key].road) return key === 'paint' ? 3.5 : key === 'asph' ? 3 : key === 'pave' ? 2.5 : 2;
    if (key.endsWith('@')) key = key.slice(0, -1);
    if (key === 'trees' || key === 'shrubs') return 9;
    return 5;
  }

  function cloneBatch(b) {
    const c = new F.Batch(Math.max(16, b.n));
    c.parts = b.parts.slice();
    c.u8.set(b.u8.subarray(0, b.n * F.STRIDE));
    c.n = b.n;
    c.idx.set(b.idx.subarray(0, b.ni));
    c.ni = b.ni;
    return c;
  }

  function studioEnv() {
    return { sunDir: norm([0.5, 0.8, -0.35]), sunCol: [0.75, 0.72, 0.68], amb: [0.62, 0.64, 0.7], groundCol: [0.35, 0.33, 0.32], fogNear: 1e5, fogFar: 2e5, fogCol: [0, 0, 0], skyHor: [0.8, 0.85, 0.9], night: 0, time: 0, studio: true };
  }

  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }

  F.Renderer = Renderer;
  F.studioEnv = studioEnv;
  F.norm3 = norm;
})(globalThis.Forza = globalThis.Forza || {});
