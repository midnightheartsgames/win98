(function (K) {
  'use strict';

  const FLAMES = 64, PUFFS = 120;

  const SKY_VS = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vNdc;
void main() {
  vNdc = aPos;
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

  const SKY_FS = `#version 300 es
precision highp float;
in vec2 vNdc;
uniform vec3 uFwd;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec2 uTan;
uniform vec3 uZenith;
uniform vec3 uHorizon;
uniform vec3 uSunDir;
uniform vec3 uSun;
uniform vec3 uMoonDir;
uniform vec3 uFogSun;
uniform float uNight;
uniform float uDusk;
uniform float uTime;
uniform float uMoon;
uniform float uCloud;
uniform float uStorm;
uniform float uMist;
uniform float uFlash;
uniform vec2 uCloudOff;
uniform vec4 uBolt;
out vec4 outColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
void main() {
  vec3 d = normalize(uFwd + vNdc.x * uTan.x * uRight + vNdc.y * uTan.y * uUp);
  float up = max(d.y, 0.0);
  vec3 c = mix(uHorizon, uZenith, pow(up, 0.5));
  vec2 hz = normalize(d.xz + 1e-4), sz = normalize(uSunDir.xz + 1e-4);
  float side = pow(max(dot(hz, sz), 0.0), 5.0);
  c += uFogSun * side * (1.0 - smoothstep(0.0, 0.45, up)) * 1.6;
  float s = max(dot(d, uSunDir), 0.0);
  float disc = smoothstep(0.99955, 0.99975, s);
  c += uSun * (pow(s, 600.0) * 0.6 + pow(s, 24.0) * 0.18 + pow(s, 4.0) * 0.06 * (1.0 + uDusk * 2.0));
  float m = dot(d, uMoonDir);
  if (uNight > 0.01 && d.y > 0.02) {
    vec3 q = d * 260.0, cell = floor(q);
    float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float tw = 0.65 + 0.35 * sin(uTime * (2.0 + h * 5.0) + h * 40.0);
    float star = step(0.9968, h) * smoothstep(0.42, 0.0, length(fract(q) - 0.5)) * tw;
    vec3 mwN = normalize(vec3(0.42, 0.55, -0.72));
    float band = exp(-pow(dot(d, mwN) / 0.16, 2.0)) * (0.5 + 0.8 * fbm(d.xz / (d.y + 0.25) * 6.0));
    c += (vec3(0.9, 0.92, 1.0) * star + vec3(0.12, 0.13, 0.17) * band) * uNight * smoothstep(0.02, 0.25, d.y);
  }
  vec3 mu = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0))), mv = cross(mu, uMoonDir);
  vec2 md = vec2(dot(d, mu), dot(d, mv)) / 0.028;
  if (m > 0.0 && dot(md, md) < 1.0 && uNight > 0.01) {
    vec3 n = vec3(md, sqrt(max(0.0, 1.0 - dot(md, md))));
    float ph = uMoon * 6.2832, lit = smoothstep(-0.06, 0.06, dot(n, vec3(sin(ph), 0.0, -cos(ph))));
    float crat = 0.72 + 0.28 * fbm(md * 3.0 + 7.0) - 0.18 * smoothstep(0.55, 0.7, vn(md * 5.0));
    c = mix(c, vec3(1.25, 1.27, 1.32) * crat * (0.05 + 0.95 * lit), smoothstep(1.0, 0.92, dot(md, md)) * uNight);
  }
  float glowM = 0.5 - 0.5 * cos(uMoon * 6.2832);
  c += vec3(0.3, 0.33, 0.45) * (pow(max(m, 0.0), 60.0) * 0.55 + pow(max(m, 0.0), 8.0) * 0.06) * uNight * glowM;
  c = mix(c, uSun * 3.0 + vec3(1.0, 0.96, 0.86) * (1.0 - uNight), disc * (1.0 - uNight));
  vec2 az = normalize(d.xz + 1e-4);
  float mtn = (0.012 + 0.03 * fbm(az * 2.2 + 5.0) + 0.012 * fbm(az * 9.0 + 1.0)) * (0.55 + 0.9 * max(0.0, -az.y));
  c = mix(c, mix(uHorizon, uZenith, 0.2) * 0.9, (1.0 - smoothstep(mtn - 0.002, mtn, d.y)) * smoothstep(-0.004, 0.004, d.y) * 0.6 * (1.0 - uMist));
  if (d.y > 0.0) {
    vec2 p = d.xz / (d.y + 0.08);
    vec2 wind = uCloudOff;
    float lo = clamp((fbm(p * 0.55 + wind) - 0.28) / 0.44, 0.0, 1.0), lo2 = clamp((fbm(p * 0.55 + wind + sz * 0.05) - 0.28) / 0.44, 0.0, 1.0);
    float cov = smoothstep(1.0 - uCloud - 0.1, 1.0 - uCloud + 0.14, lo);
    float hi = fbm(vec2(p.x * 0.18, p.y * 0.9) + wind * 0.4) * smoothstep(0.35, 0.9, fbm(p * 0.12 - wind));
    float thick = clamp((lo - lo2) * 3.0 + 0.55, 0.0, 1.0);
    float far = 1.0 - smoothstep(0.02, 0.22, d.y);
    cov = mix(cov, smoothstep(0.15, 0.95, uCloud), far);
    thick = mix(thick, 0.5, far);
    hi *= 1.0 - far;
    vec3 dayC = mix(vec3(0.62, 0.65, 0.7), vec3(1.0, 1.0, 0.98), thick);
    vec3 duskC = mix(vec3(0.42, 0.3, 0.36), vec3(1.0, 0.66, 0.42), thick);
    vec3 nightC = mix(vec3(0.05, 0.06, 0.09), vec3(0.16, 0.18, 0.24), thick * (0.3 + 0.7 * uMoon));
    vec3 cc = mix(mix(dayC, duskC, uDusk), nightC, uNight) * (1.0 + pow(s, 8.0) * 0.6 * (1.0 - uNight) * (1.0 - uStorm));
    cc *= 1.0 - uStorm * (0.5 - 0.25 * thick);
    cc += vec3(0.55, 0.6, 0.75) * uFlash * (0.4 + 0.6 * thick);
    float fade = smoothstep(0.0, 0.18, d.y);
    c = mix(c, cc, cov * fade * mix(0.92, 1.0, smoothstep(0.7, 0.95, uCloud)));
    c = mix(c, mix(mix(vec3(0.95), vec3(1.0, 0.75, 0.55), uDusk), vec3(0.12, 0.13, 0.17), uNight), hi * 0.35 * fade * (1.0 - cov));
  }
  c = mix(c, uHorizon + uFogSun * side, (1.0 - smoothstep(0.0, 0.16, d.y)) * smoothstep(0.3, 0.8, uCloud + uMist));
  if (uBolt.w > 0.0 && d.y > -0.01 && d.y < uBolt.z) {
    vec2 bd = normalize(uBolt.xy), hz2 = normalize(d.xz + 1e-4);
    float bs = hz2.x * bd.y - hz2.y * bd.x, e = d.y / uBolt.z;
    if (dot(hz2, bd) > 0.9) {
      float path = (vn(vec2(e * 7.0, uBolt.w * 50.0)) - 0.5) * 0.05 + (vn(vec2(e * 31.0, uBolt.w * 90.0)) - 0.5) * 0.014;
      float dist = abs(bs - path * uBolt.z * 4.0);
      float core = (1.0 - smoothstep(0.0, 0.0022, dist)) + exp(-dist * 90.0) * 0.35;
      c += vec3(0.85, 0.88, 1.0) * core * uFlash * 2.5 * smoothstep(-0.01, 0.03, d.y);
    }
  }
  c = mix(c, uHorizon, uMist * 0.85 * (1.0 - smoothstep(0.0, 0.6, up) * 0.4));
  outColor = vec4(c, 1.0);
}`;

  const LIT_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec3 aCol;
uniform mat4 uViewProj;
uniform mat4 uModel;
out vec3 vCol;
out vec3 vNrm;
out vec3 vWorld;
void main() {
  vec4 w = uModel * vec4(aPos, 1.0);
  vWorld = w.xyz;
  vNrm = mat3(uModel) * aNrm;
  vCol = aCol;
  gl_Position = uViewProj * w;
}`;

  const LIT_FS = `#version 300 es
precision highp float;
in vec3 vCol;
in vec3 vNrm;
in vec3 vWorld;
uniform vec3 uLightDir;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
out vec4 outColor;
void main() {
  vec3 n = normalize(vNrm);
  float diff = max(dot(n, uLightDir), 0.0);
  vec3 c = vCol;
  c *= uAmbient + uLight * diff;
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const TOWN_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec2 aMat;
uniform mat4 uViewProj;
out vec3 vNrm;
out vec3 vWorld;
out vec2 vUv;
flat out int vMat;
out float vIndoor;
void main() {
  vWorld = aPos;
  vNrm = aNrm;
  vUv = aUv;
  vMat = int(aMat.x + 0.5);
  vIndoor = aMat.y;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

  const TOWN_FS = `#version 300 es
precision highp float;
in vec3 vNrm;
in vec3 vWorld;
in vec2 vUv;
flat in int vMat;
in float vIndoor;
uniform vec3 uLightDir;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
uniform float uNight;
out vec4 outColor;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
vec3 boards(vec2 q, float h, vec3 base, float run) {
  float row = floor(q.y / h), b = fract(q.y / h);
  float joint = step(0.985, fract((q.x + hash(vec2(row, 3.0)) * run) / run));
  float tone = 0.82 + hash(vec2(row, 1.0)) * 0.3;
  float grain = noise(vec2(q.x * 1.5, row * 9.0 + b * 3.0)) * 0.16;
  return base * (tone + grain - 0.08) * (b < 0.09 || joint > 0.5 ? 0.45 : 1.0);
}
vec3 blocks(vec2 q, vec2 size, vec3 base, vec3 mortar, float edge) {
  float row = floor(q.y / size.y);
  vec2 c = vec2(q.x / size.x + mod(row, 2.0) * 0.5, q.y / size.y);
  vec2 f = fract(c), id = floor(c);
  float tone = 0.8 + hash(id) * 0.35, pit = noise(q * 7.0) * 0.12;
  return min(min(f.x, 1.0 - f.x) * size.x, min(f.y, 1.0 - f.y) * size.y) < edge ? mortar : base * (tone - pit);
}
vec3 glass(vec2 q, float inner) {
  float bar = min(min(q.x, 1.0 - q.x), min(q.y, 1.0 - q.y));
  if (bar < 0.09 || abs(q.x - 0.5) < 0.035 || abs(q.y - 0.5) < 0.03) return vec3(0.33, 0.24, 0.15);
  vec3 day = mix(vec3(0.1, 0.13, 0.16), vec3(0.34, 0.4, 0.46), q.y * 0.6 + hash(floor(q * 6.0)) * 0.15);
  if (inner > 0.5) day = mix(vec3(0.78, 0.82, 0.86), vec3(0.95, 0.96, 0.98), q.y);
  return day;
}
vec3 surface(int m, vec2 uv, vec2 q) {
  if (m == 0) return vec3(0.83, 0.79, 0.69) * (0.9 + noise(uv * 3.0) * 0.12 - noise(uv * 17.0) * 0.05);
  if (m == 1) return boards(q, 0.24, vec3(0.56, 0.42, 0.28), 2.7);
  if (m == 2) { float b = fract(q.y / 0.3), row = floor(q.y / 0.3); float round_ = 0.55 + 0.45 * sin(3.14159 * b); return vec3(0.5, 0.37, 0.24) * (round_ + noise(vec2(q.x * 2.0, row * 5.0)) * 0.15) * (0.9 + hash(vec2(row, 7.0)) * 0.2); }
  if (m == 3) return blocks(q, vec2(0.62, 0.3), vec3(0.62, 0.6, 0.56), vec3(0.74, 0.72, 0.67), 0.025);
  if (m == 4) { vec3 c = blocks(q, vec2(0.32, 0.22), vec3(0.42, 0.3, 0.22), vec3(0.2, 0.14, 0.1), 0.012); return c * (0.75 + fract(q.y / 0.22) * 0.35); }
  if (m == 5) { float row = fract(q.y / 0.35); float s = hash(vec2(floor(q.x * 22.0), floor(q.y / 0.35))); return vec3(0.64, 0.54, 0.31) * (0.72 + s * 0.3 + row * 0.18) * (row < 0.12 ? 0.6 : 1.0); }
  if (m == 6) { vec3 c = blocks(q, vec2(0.28, 0.18), vec3(0.36, 0.39, 0.44), vec3(0.18, 0.19, 0.22), 0.012); return c * (0.8 + fract(q.y / 0.18) * 0.25); }
  if (m == 7) return boards(q.yx, 0.2, vec3(0.5, 0.37, 0.24), 3.1);
  if (m == 8) { float x = fract(uv.x * 5.0); float strap = step(abs(uv.y - 0.22), 0.035) + step(abs(uv.y - 0.78), 0.035); vec3 c = vec3(0.36, 0.24, 0.14) * (0.85 + hash(vec2(floor(uv.x * 5.0), 2.0)) * 0.25) * (x < 0.06 ? 0.55 : 1.0); return strap > 0.5 ? vec3(0.17, 0.16, 0.16) : c; }
  if (m == 9) return glass(uv, vIndoor);
  if (m == 10) return vec3(0.33, 0.23, 0.15) * (0.85 + noise(vec2(q.x * 0.8, q.y * 8.0)) * 0.3);
  if (m == 11) return mod(floor(q.x / 0.3), 2.0) < 0.5 ? vec3(0.66, 0.17, 0.12) : vec3(0.86, 0.8, 0.66);
  if (m == 12) return mod(floor(q.x / 0.3), 2.0) < 0.5 ? vec3(0.22, 0.42, 0.2) : vec3(0.86, 0.8, 0.66);
  if (m == 13) return vec3(0.46, 0.33, 0.21) * (0.75 + noise(q * 2.5) * 0.45);
  if (m == 14) return vec3(0.34, 0.25, 0.17) * (0.8 + noise(q * 6.0) * 0.35);
  if (m == 15) { vec2 g = floor(q / 0.25); return (mod(g.x + g.y, 2.0) < 0.5 ? vec3(0.58, 0.2, 0.15) : vec3(0.5, 0.16, 0.12)) * (0.9 + noise(q * 9.0) * 0.15); }
  if (m == 16) return vec3(0.3, 0.3, 0.32) * (0.85 + noise(q * 5.0) * 0.25);
  if (m == 18) { float row = fract(q.y / 0.3); return vec3(0.14, 0.11, 0.09) * (0.55 + noise(q * 7.0) * 0.8) * (0.7 + 0.3 * sin(3.14159 * row)) + vec3(0.32, 0.1, 0.03) * step(0.92, noise(q * 13.0 + 3.0)); }
  if (m == 19) return vec3(0.8, 0.46, 0.13) * (0.85 + noise(q * 6.0) * 0.2);
  if (m == 20) return blocks(q, vec2(0.7, 0.36), vec3(0.2, 0.19, 0.2), vec3(0.31, 0.29, 0.3), 0.03) * (0.85 + noise(q * 3.0) * 0.25);
  return vec3(0.6, 0.43, 0.2) * (0.85 + noise(q * 4.0) * 0.25);
}
void main() {
  vec3 n = normalize(vNrm);
  vec2 q = floor(vUv * 16.0) / 16.0;
  vec3 c = surface(vMat, vUv, q);
  vec3 lit = uAmbient + uLight * max(dot(n, uLightDir), 0.0);
  vec3 inside = vec3(0.66, 0.6, 0.52) * (1.0 - uNight * 0.55) + vec3(1.0, 0.7, 0.42) * uNight * 0.32;
  c *= mix(lit, inside, vIndoor);
  if (vMat == 9 && vIndoor < 0.5) c += vec3(1.0, 0.72, 0.38) * uNight * 0.85;
  if (vMat == 17) c += vec3(0.4, 0.32, 0.18) * pow(max(dot(reflect(-uLightDir, n), normalize(uEye - vWorld)), 0.0), 12.0) * (1.0 - uNight);
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const GROUND_FS = `#version 300 es
precision highp float;
precision mediump sampler2DArray;
in vec3 vCol;
in vec3 vNrm;
in vec3 vWorld;
uniform vec3 uLightDir;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
uniform sampler2DArray uLayers;
uniform sampler2D uW0;
uniform sampler2D uW1;
uniform sampler2D uW2;
uniform sampler2D uAux;
uniform float uSamples;
uniform float uStep;
uniform float uTile[12];
uniform float uWet;
uniform float uRain;
uniform float uClock;
uniform vec3 uWetSky;
float rh(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
float ring(vec2 p, float t) {
  vec2 c = floor(p), f = fract(p) - 0.5;
  float ph = fract(t * 0.9 + rh(c));
  float d = length(f - (vec2(rh(c + 3.1), rh(c + 7.7)) - 0.5) * 0.2);
  return (1.0 - smoothstep(0.0, 0.035, abs(d - ph * 0.4))) * (1.0 - ph) * step(0.35, rh(c + 1.7));
}
float ripples(vec2 p) { return uRain * (ring(p * 3.4, uClock) + ring(p * 3.4 + 0.5, uClock * 1.13 + 0.4)); }
vec3 wetten(vec3 c, vec3 n, float wet, float pool) {
  vec3 v = normalize(uEye - vWorld);
  float fr = pow(1.0 - max(dot(v, n), 0.0), 4.0);
  c *= 1.0 - wet * 0.3;
  c = mix(c, uWetSky * 0.85, fr * wet * 0.3);
  if (pool > 0.0) {
    vec3 pc = mix(c * 0.5, uWetSky * (0.55 + 0.45 * fr), 0.3 + 0.5 * fr) + uWetSky * ripples(vWorld.xz) * 0.32;
    c = mix(c, pc, pool);
  }
  return c;
}
out vec4 outColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 layer(int i, vec2 uv) {
  float l = float(i);
  return mix(texture(uLayers, vec3(uv, l)).rgb, texture(uLayers, vec3(uv * 0.29 + vec2(0.37, 0.61), l)).rgb, 0.38);
}
vec3 tri(int i, vec3 n) {
  float s = 1.0 / uTile[i];
  vec3 b = pow(abs(n), vec3(4.0));
  b /= b.x + b.y + b.z;
  return layer(i, vWorld.zy * s) * b.x + layer(i, vWorld.xz * s) * b.y + layer(i, vWorld.xy * s) * b.z;
}
void main() {
  vec3 n = normalize(vNrm);
  vec2 g = (vWorld.xz / uStep + 0.5) / uSamples;
  vec4 a = texture(uW0, g), b = texture(uW1, g), c4 = texture(uW2, g);
  float w[12] = float[12](a.r, a.g, a.b, a.a, b.r, b.g, b.b, b.a, c4.r, c4.g, c4.b, c4.a);
  vec3 c = vec3(0.0);
  float sum = 0.0;
  for (int i = 0; i < 12; i++) {
    if (w[i] < 0.004) continue;
    vec3 s = (i == 6 || i == 7) ? tri(i, n) : layer(i, vWorld.xz / uTile[i]);
    c += s * w[i];
    sum += w[i];
  }
  c = sum > 0.0 ? c / sum : vCol;
  vec4 aux = texture(uAux, g);
  float macro = vnoise(vWorld.xz / 83.0) * 0.6 + vnoise(vWorld.xz / 29.0) * 0.4;
  c *= (0.84 + 0.32 * macro) * mix(1.0, aux.r, 0.9);
  c = mix(c, c * vec3(0.82, 0.86, 0.9), aux.g * 0.35);
  float diff = max(dot(n, uLightDir), 0.0);
  c *= uAmbient + uLight * diff;
  float sw = max(sum, 1e-3), wet = uWet * (1.0 - w[8] / sw) * (0.7 + 0.3 * aux.g);
  float soft = clamp((w[3] + w[9] + w[11] + w[1] * 0.4 + w[5] * 0.6) / sw, 0.0, 1.0);
  float pool = smoothstep(0.3, 0.85, uWet) * soft * smoothstep(0.66, 0.73, vnoise(vWorld.xz / 2.7) * 0.65 + vnoise(vWorld.xz / 0.8) * 0.35 + aux.g * 0.15) * smoothstep(0.96, 0.99, n.y);
  c = wetten(c, n, wet, pool);
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const ROAD_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec3 aRoad;
uniform mat4 uViewProj;
out vec3 vWorld;
out vec3 vNrm;
out vec3 vRoad;
void main() {
  vWorld = aPos;
  vNrm = aNrm;
  vRoad = aRoad;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

  const ROAD_FS = `#version 300 es
precision highp float;
precision mediump sampler2DArray;
in vec3 vWorld;
in vec3 vNrm;
in vec3 vRoad;
uniform vec3 uLightDir;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
uniform sampler2DArray uLayers;
uniform sampler2D uAux;
uniform float uSamples;
uniform float uStep;
uniform float uTile[12];
uniform float uWet;
uniform float uRain;
uniform float uClock;
uniform vec3 uWetSky;
float rh(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
float ring(vec2 p, float t) {
  vec2 c = floor(p), f = fract(p) - 0.5;
  float ph = fract(t * 0.9 + rh(c));
  float d = length(f - (vec2(rh(c + 3.1), rh(c + 7.7)) - 0.5) * 0.2);
  return (1.0 - smoothstep(0.0, 0.035, abs(d - ph * 0.4))) * (1.0 - ph) * step(0.35, rh(c + 1.7));
}
float ripples(vec2 p) { return uRain * (ring(p * 3.4, uClock) + ring(p * 3.4 + 0.5, uClock * 1.13 + 0.4)); }
vec3 wetten(vec3 c, vec3 n, float wet, float pool) {
  vec3 v = normalize(uEye - vWorld);
  float fr = pow(1.0 - max(dot(v, n), 0.0), 4.0);
  c *= 1.0 - wet * 0.3;
  c = mix(c, uWetSky * 0.85, fr * wet * 0.3);
  if (pool > 0.0) {
    vec3 pc = mix(c * 0.5, uWetSky * (0.55 + 0.45 * fr), 0.3 + 0.5 * fr) + uWetSky * ripples(vWorld.xz) * 0.32;
    c = mix(c, pc, pool);
  }
  return c;
}
out vec4 outColor;
float hash(float p) { return fract(sin(p * 127.1) * 43758.5453); }
float vn(float x) { float i = floor(x), f = fract(x); return mix(hash(i), hash(i + 1.0), f * f * (3.0 - 2.0 * f)); }
vec3 layer(int i, vec2 uv) { float l = float(i); return mix(texture(uLayers, vec3(uv, l)).rgb, texture(uLayers, vec3(uv * 0.29 + vec2(0.37, 0.61), l)).rgb, 0.38); }
void main() {
  int style = int(vRoad.z + 0.5);
  float a = vRoad.x, s = vRoad.y;
  float edge = abs(a);
  float wob = (vn(s * 0.31) - 0.5) * 0.18 + (vn(s * 1.7 + 9.0) - 0.5) * 0.08;
  int mat = style == 0 ? 4 : style == 2 ? 5 : style == 5 ? 7 : 3;
  vec3 c = layer(mat, vWorld.xz / uTile[mat]);
  vec3 grass = layer(0, vWorld.xz / uTile[0]);
  float rel = edge;
  float body = 1.0 - smoothstep(0.62 + wob, 0.86 + wob, rel);
  if (style == 2) body = 1.0 - smoothstep(0.9, 0.97, rel);
  float rutPos = style == 0 ? 0.32 : style == 1 ? 0.34 : style == 3 ? 0.2 : -1.0;
  if (rutPos > 0.0) {
    float r = 1.0 - smoothstep(0.0, 0.07, abs(rel - rutPos));
    c = mix(c, c * vec3(0.72, 0.68, 0.62), r * 0.65);
  }
  if (style == 1) c = mix(c, grass * 0.78, (1.0 - smoothstep(0.03, 0.1, rel + (vn(s * 2.3) - 0.5) * 0.05)) * 0.6 * smoothstep(0.25, 0.55, vn(s * 0.8 + 3.0)));
  if (style == 0) c = mix(c, c * 1.08, 1.0 - smoothstep(0.0, 0.3, rel));
  if (style == 2) c = mix(c, c * 0.62, smoothstep(0.84, 0.9, rel) * (1.0 - smoothstep(0.92, 0.96, rel)));
  if (style == 4) c = mix(c, layer(2, vWorld.xz / uTile[2]), 0.35);
  vec2 g = (vWorld.xz / uStep + 0.5) / uSamples;
  float shade = texture(uAux, g).r;
  vec3 n = normalize(vNrm);
  c *= mix(1.0, shade, 0.9);
  c *= uAmbient + uLight * max(dot(n, uLightDir), 0.0);
  float rut = rutPos > 0.0 ? 1.0 - smoothstep(0.0, 0.08, abs(rel - rutPos)) : 0.0;
  float pool = smoothstep(0.3, 0.85, uWet) * rut * smoothstep(0.45, 0.6, vn(s * 0.35 + 5.0)) * (style == 5 ? 0.0 : 1.0);
  c = wetten(c, n, uWet * (style == 2 ? 1.0 : 0.85), pool);
  float d = distance(vWorld, uEye);
  float f = clamp(d / uFogFar, 0.0, 1.0);
  float alpha = body * (1.0 - smoothstep(170.0, 230.0, d));
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), alpha);
}`;

  const RAIN_VS = `#version 300 es
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec4 aDrop;
uniform mat4 uViewProj;
uniform vec3 uEye;
uniform vec3 uFall;
uniform float uClock;
uniform float uBox;
uniform float uLen;
uniform float uWidth;
uniform float uSnow;
out float vA;
out float vX;
void main() {
  vec3 lo = uEye - uBox * 0.5;
  vec3 p = mod(vec3(aDrop.x, aDrop.z, aDrop.y) * uBox + uFall * (uClock + aDrop.w * 7.0) - lo, uBox) + lo;
  p.xz += vec2(sin(uClock * 1.3 + aDrop.w * 40.0), cos(uClock * 1.1 + aDrop.x * 30.0)) * 0.35 * uSnow;
  vec3 fd = normalize(uFall);
  vec3 q = mix(p, p - fd * uLen * (0.7 + 0.6 * aDrop.w), aCorner.y);
  vec3 toEye = uEye - q;
  float dist = length(toEye);
  q += normalize(cross(fd, toEye)) * aCorner.x * uWidth * (1.0 + dist * 0.04);
  vA = smoothstep(uBox * 0.5, uBox * 0.3, length(p.xz - uEye.xz)) * smoothstep(0.4, 1.5, dist) * (1.0 - aCorner.y * 0.7 * (1.0 - uSnow));
  vX = aCorner.x;
  gl_Position = uViewProj * vec4(q, 1.0);
}`;

  const RAIN_FS = `#version 300 es
precision highp float;
in float vA;
in float vX;
uniform vec3 uColor;
uniform float uAlpha;
out vec4 outColor;
void main() {
  outColor = vec4(uColor, vA * uAlpha * (1.0 - abs(vX)));
}`;

  const GRASS_VS = `#version 300 es
layout(location = 0) in vec3 aCorner;
layout(location = 1) in vec4 aPos;
layout(location = 2) in vec4 aLook;
uniform mat4 uViewProj;
uniform float uTime;
uniform vec3 uWind;
uniform vec3 uEye;
uniform float uRadius;
uniform float uH[12];
uniform float uW[12];
out vec2 vUv;
out vec3 vWorld;
out float vTone;
out float vShade;
out float vFade;
out float vTop;
void main() {
  int k = int(aPos.w + 0.5);
  float sc = aLook.x, ang = aLook.y + aCorner.z * 1.5708;
  vec2 dir = vec2(cos(ang), sin(ang));
  float hh = uH[k] * sc, ww = uW[k] * sc;
  float cy = aCorner.y * aCorner.y, sp = 1.0 + uWind.z * 1.5;
  float osc = sin(uTime * 1.7 * sp + aPos.x * 0.35 + aPos.z * 0.27) + 0.5 * sin(uTime * 2.9 * sp + aPos.x * 0.9);
  float gust = 0.6 + 0.4 * sin(uTime * 0.6 - dot(aPos.xz, uWind.xy) * 0.08);
  vec2 bend = uWind.xy * uWind.z * gust * 0.22 * hh * cy + vec2(1.0, 0.6) * osc * (0.05 + 0.08 * uWind.z) * hh * cy;
  vec3 w = aPos.xyz + vec3(dir.x * aCorner.x * ww + bend.x, aCorner.y * hh, dir.y * aCorner.x * ww + bend.y);
  vWorld = w;
  vUv = vec2((mod(float(k), 4.0) + aCorner.x + 0.5) / 4.0, (floor(float(k) / 4.0) + 1.0 - aCorner.y * 0.98 - 0.01) / 4.0);
  vTone = aLook.z;
  vShade = aLook.w;
  vTop = aCorner.y;
  float d = distance(aPos.xz, uEye.xz);
  vFade = 1.0 - smoothstep(uRadius * 0.62, uRadius, d);
  gl_Position = uViewProj * vec4(w, 1.0);
}`;

  const GRASS_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vWorld;
in float vTone;
in float vShade;
in float vFade;
in float vTop;
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
out vec4 outColor;
float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec4 t = texture(uTex, vUv);
  if (t.a < 0.5 || h2(floor(gl_FragCoord.xy)) > vFade) discard;
  vec3 c = t.rgb * (0.86 + vTone * 0.28) * mix(1.0, vShade, 0.85) * (0.72 + 0.28 * vTop);
  c *= uAmbient + uLight * (0.35 + 0.65 * max(uLightDir.y, 0.0));
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const OUTER_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in float aOff;
uniform mat4 uViewProj;
out vec3 vWorld;
out vec3 vNrm;
void main() {
  vWorld = aPos;
  vNrm = aNrm;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

  const OUTER_FS = `#version 300 es
precision highp float;
precision mediump sampler2DArray;
in vec3 vWorld;
in vec3 vNrm;
uniform sampler2DArray uLayers;
uniform float uTile[12];
uniform vec3 uLightDir;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
uniform float uSize;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
out vec4 outColor;
float oh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float on(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(oh(i), oh(i + vec2(1.0, 0.0)), u.x), mix(oh(i + vec2(0.0, 1.0)), oh(i + vec2(1.0, 1.0)), u.x), u.y); }
vec3 lay(int i) { return texture(uLayers, vec3(vWorld.xz / uTile[i], float(i))).rgb; }
void main() {
  vec3 n = normalize(vNrm);
  float x = vWorld.x, z = vWorld.z, h = vWorld.y;
  float wn = max(0.0, -z), ws = max(0.0, z - uSize), ww = max(0.0, -x), we = max(0.0, x - uSize), sum = wn + ws + ww + we + 1e-3;
  float woods = ((ww + we) + wn * (1.0 - smoothstep(190.0, 215.0, h))) / sum;
  vec2 cell = floor(vWorld.xz / 70.0);
  float pick = oh(cell);
  vec3 fields = pick < 0.4 ? lay(1) : pick < 0.7 ? lay(11) : lay(0);
  vec3 c = mix(fields, lay(2) * 0.8, woods * 0.85 + (ws / sum) * smoothstep(0.62, 0.7, on(vWorld.xz / 160.0)) * 0.8);
  c = mix(c, lay(7), smoothstep(230.0, 290.0, h) * (wn / sum));
  c = mix(c, lay(6), smoothstep(0.82, 0.62, n.y));
  c = mix(c, lay(8), smoothstep(200.0, 215.0, h) * smoothstep(0.6, 0.7, n.y));
  c *= 0.86 + 0.28 * on(vWorld.xz / 90.0);
  c *= uAmbient + uLight * max(dot(n, uLightDir), 0.0);
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const PROP_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in vec2 aMat;
uniform mat4 uViewProj;
out vec3 vWorld;
out vec3 vNrm;
out vec2 vMat;
void main() {
  vWorld = aPos;
  vNrm = aNrm;
  vMat = aMat;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

  const PROP_FS = `#version 300 es
precision highp float;
precision mediump sampler2DArray;
in vec3 vWorld;
in vec3 vNrm;
in vec2 vMat;
uniform sampler2DArray uLayers;
uniform vec3 uLightDir;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
out vec4 outColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
vec3 tri(float l, vec3 n, float s) {
  vec3 b = pow(abs(n), vec3(4.0));
  b /= b.x + b.y + b.z;
  return texture(uLayers, vec3(vWorld.zy * s, l)).rgb * b.x + texture(uLayers, vec3(vWorld.xz * s, l)).rgb * b.y + texture(uLayers, vec3(vWorld.xy * s, l)).rgb * b.z;
}
void main() {
  vec3 n = normalize(vNrm);
  int m = int(vMat.x + 0.5);
  vec3 c;
  if (m == 0) c = tri(6.0, n, 0.5) * 0.95;
  else if (m == 4) c = tri(7.0, n, 0.7);
  else if (m == 1) c = vec3(0.32, 0.23, 0.15) * (0.7 + 0.5 * vn(vec2(atan(n.x, n.z) * 9.0, vWorld.y * 3.0))) ;
  else if (m == 2) c = vec3(0.68, 0.55, 0.36) * (0.85 + 0.25 * sin(length(fract(vWorld.xz * 0.5) - 0.5) * 60.0));
  else if (m == 3) c = vec3(0.74, 0.62, 0.32) * (0.75 + 0.45 * vn(vec2(atan(n.x, n.z) * 14.0, vWorld.y * 12.0)));
  else c = vec3(0.45, 0.34, 0.22) * (0.8 + 0.3 * vn(vWorld.xz * 6.0));
  float moss = vMat.y * smoothstep(0.35, 0.8, n.y) * (0.6 + 0.4 * vn(vWorld.xz * 2.3));
  c = mix(c, vec3(0.24, 0.34, 0.14) * (0.8 + 0.4 * vn(vWorld.xz * 9.0)), moss);
  c *= uAmbient + uLight * max(dot(n, uLightDir), 0.0);
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const CLUTTER_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNrm;
layout(location = 2) in float aMat;
layout(location = 3) in vec4 aAt;
layout(location = 4) in vec4 aLook;
uniform mat4 uViewProj;
uniform vec3 uEye;
uniform float uRadius;
out vec3 vWorld;
out vec3 vNrm;
out float vMat;
out float vTone;
out float vMoss;
out float vFade;
void main() {
  float c = cos(aLook.x), s = sin(aLook.x), sc = aAt.w;
  vec3 p = vec3(aPos.x * c - aPos.z * s, aPos.y, aPos.x * s + aPos.z * c) * sc;
  vec3 w = aAt.xyz + p;
  vWorld = w;
  vNrm = vec3(aNrm.x * c - aNrm.z * s, aNrm.y, aNrm.x * s + aNrm.z * c);
  vMat = aMat;
  vTone = aLook.y;
  vMoss = aLook.z;
  vFade = 1.0 - smoothstep(uRadius * 0.6, uRadius, distance(aAt.xz, uEye.xz));
  gl_Position = uViewProj * vec4(w, 1.0);
}`;

  const CLUTTER_FS = `#version 300 es
precision highp float;
precision mediump sampler2DArray;
in vec3 vWorld;
in vec3 vNrm;
in float vMat;
in float vTone;
in float vMoss;
in float vFade;
uniform sampler2DArray uLayers;
uniform vec3 uLightDir;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uEye;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
out vec4 outColor;
float h2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  if (h2(floor(gl_FragCoord.xy)) > vFade) discard;
  vec3 n = normalize(vNrm);
  int m = int(vMat + 0.5);
  vec3 c;
  if (m == 0) c = mix(vec3(0.52, 0.49, 0.44), vec3(0.62, 0.56, 0.46), vTone);
  else if (m == 1) c = texture(uLayers, vec3(vWorld.xz * 1.3, 7.0)).rgb * (0.8 + vTone * 0.3);
  else if (m == 2) c = vec3(0.86, 0.82, 0.72);
  else if (m == 3) c = vTone > 0.75 ? vec3(0.72, 0.12, 0.08) : mix(vec3(0.46, 0.3, 0.16), vec3(0.62, 0.44, 0.24), vTone);
  else if (m == 4) c = vec3(0.3, 0.22, 0.14) * (0.8 + vTone * 0.4);
  else if (m == 5) c = vec3(0.4, 0.3, 0.2) * (0.75 + 0.5 * h2(floor(vWorld.xz * 30.0)));
  else c = mix(vec3(0.22, 0.18, 0.11), vec3(0.3, 0.37, 0.14) * (0.75 + 0.5 * h2(floor(vWorld.xz * 16.0))) * (0.85 + vTone * 0.3), smoothstep(0.25, 0.75, n.y));
  if (m <= 1) c = mix(c, vec3(0.26, 0.36, 0.15), vMoss * 0.6 * smoothstep(0.4, 0.9, n.y));
  c *= uAmbient + uLight * max(dot(n, uLightDir), 0.0);
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const shapes = (() => {
    const tri = (out, a, b, c, m, moss, ctr) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      if (ctr && nx * ((a[0] + b[0] + c[0]) / 3 - ctr[0]) + ny * ((a[1] + b[1] + c[1]) / 3 - ctr[1]) + nz * ((a[2] + b[2] + c[2]) / 3 - ctr[2]) < 0) { nx = -nx; ny = -ny; nz = -nz; }
      for (const p of [a, b, c]) out.push(p[0], p[1], p[2], nx, ny, nz, m, moss);
    };
    const ico = () => {
      const t = (1 + Math.sqrt(5)) / 2, v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(p => { const l = Math.hypot(...p); return p.map(x => x / l); });
      let f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
      const mid = {}, m = (a, b) => { const k = a < b ? a + '_' + b : b + '_' + a; if (mid[k] === undefined) { const p = v[a].map((x, i) => (x + v[b][i]) / 2), l = Math.hypot(...p); v.push(p.map(x => x / l)); mid[k] = v.length - 1; } return mid[k]; };
      const g = [];
      for (const [a, b, c] of f) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); g.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
      return { v, f: g };
    };
    const ICO = ico();
    const cyl = (out, a, b, r0, r1, sides, mSide, mCap, moss) => {
      const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(...ax), d = ax.map(x => x / L), up = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const u = [d[1] * up[2] - d[2] * up[1], d[2] * up[0] - d[0] * up[2], d[0] * up[1] - d[1] * up[0]], ul = Math.hypot(...u), U = u.map(x => x / ul), V = [d[1] * U[2] - d[2] * U[1], d[2] * U[0] - d[0] * U[2], d[0] * U[1] - d[1] * U[0]];
      const ring = (c, r, k) => { const an = k / sides * Math.PI * 2; return [c[0] + (U[0] * Math.cos(an) + V[0] * Math.sin(an)) * r, c[1] + (U[1] * Math.cos(an) + V[1] * Math.sin(an)) * r, c[2] + (U[2] * Math.cos(an) + V[2] * Math.sin(an)) * r]; };
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
      for (let k = 0; k < sides; k++) {
        const p0 = ring(a, r0, k), p1 = ring(a, r0, k + 1), q0 = ring(b, r1, k), q1 = ring(b, r1, k + 1);
        tri(out, p0, q0, p1, mSide, moss, mid); tri(out, p1, q0, q1, mSide, moss, mid);
        if (mCap !== null) { tri(out, b, q1, q0, mCap, 0, mid); tri(out, a, p0, p1, mCap, 0, mid); }
      }
    };
    return { tri, ICO, cyl };
  })();

  const propGeometry = (list, T) => {
    const out = [], { tri, ICO, cyl } = shapes;
    list.forEach((p, n) => {
      const r = p.rot * Math.PI / 180, c = Math.cos(r), s = Math.sin(r), rot = (x, z) => [x * c - z * s, x * s + z * c];
      if (p.kind === 'boulder') {
        const sx = p.size * 0.78, sy = p.size * 0.62, sz = p.size * 0.68, sink = p.size * 0.2;
        const pts = ICO.v.map((v, i) => { const k = 0.78 + 0.34 * (((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1); const [x, z] = rot(v[0] * sx * k, v[2] * sz * k); return [p.x + x, p.y - sink + (v[1] * sy * k + sy * 0.4), p.z + z]; });
        const ctr = [p.x, p.y - sink + sy * 0.4, p.z];
        for (const [a, b, d] of ICO.f) tri(out, pts[a], pts[b], pts[d], p.size > 1.3 ? 0 : 4, p.moss, ctr);
      } else if (p.kind === 'stump') {
        cyl(out, [p.x, p.y - 0.2, p.z], [p.x, p.y + 0.5, p.z], p.size * 1.15, p.size, 9, 1, 2, p.moss);
      } else if (p.kind === 'log') {
        const [dx, dz] = rot(p.size / 2, 0), ya = T.heightAt(p.x - dx, p.z - dz), yb = T.heightAt(p.x + dx, p.z + dz);
        cyl(out, [p.x - dx, ya + 0.22, p.z - dz], [p.x + dx, yb + 0.2, p.z + dz], 0.26, 0.21, 8, 1, 2, p.moss);
      } else if (p.kind === 'hay') {
        const R = [[0, 1], [0.55, 1.02], [1.05, 0.86], [1.45, 0.52], [1.72, 0.14], [1.8, 0]];
        for (let i = 0; i < R.length - 1; i++) cyl(out, [p.x, p.y - 0.15 + R[i][0] * p.size, p.z], [p.x, p.y - 0.15 + R[i + 1][0] * p.size, p.z], R[i][1] * p.size * 0.85, R[i + 1][1] * p.size * 0.85 + 0.001, 10, 3, null, 0);
      } else if (p.kind === 'woodpile') {
        for (let row = 0; row < 4; row++) for (let k = 0; k < 9; k++) {
          const o = -1.2 + k * 0.3 + (row % 2) * 0.15, [ax, az] = rot(o, -0.42), [bx, bz] = rot(o, 0.42), y = p.y + 0.12 + row * 0.24;
          cyl(out, [p.x + ax, y, p.z + az], [p.x + bx, y, p.z + bz], 0.12, 0.12, 6, 1, 2, 0);
        }
        const [rx, rz] = rot(0, 0);
        cyl(out, [p.x + rx - c * 1.45, p.y + 1.2, p.z + rz - s * 1.45], [p.x + rx + c * 1.45, p.y + 1.2, p.z + rz + s * 1.45], 0.05, 0.05, 4, 1, null, 0);
      }
    });
    return new Float32Array(out);
  };

  const clutterMeshes = () => {
    const out = [], { ICO, cyl } = shapes, ranges = [];
    const add = (fn) => { const start = out.length / 7, tmp = []; fn(tmp); for (let q = 0; q < tmp.length; q += 8) out.push(tmp[q], tmp[q + 1], tmp[q + 2], tmp[q + 3], tmp[q + 4], tmp[q + 5], tmp[q + 6]); ranges.push([start, out.length / 7 - start]); };
    const blob = (tmp, sx, sy, sz, m, lift) => { const pts = ICO.v.map((v, i) => { const k = 0.8 + 0.3 * (((Math.sin(i * 7.31 + sx * 91) * 9781.7) % 1 + 1) % 1); return [v[0] * sx * k, v[1] * sy * k + lift, v[2] * sz * k]; }); for (const [a, b, c] of ICO.f) shapes.tri(tmp, pts[a], pts[b], pts[c], m, 0, [0, lift, 0]); };
    add(t => blob(t, 0.09, 0.05, 0.07, 0, 0.02));
    add(t => blob(t, 0.26, 0.17, 0.21, 1, 0.05));
    add(t => { cyl(t, [0, 0, 0], [0, 0.09, 0], 0.018, 0.015, 6, 2, null, 0); cyl(t, [0, 0.08, 0], [0, 0.13, 0], 0.07, 0.001, 8, 3, null, 0); cyl(t, [0, 0.075, 0], [0, 0.085, 0], 0.07, 0.07, 8, 3, 3, 0); });
    add(t => { cyl(t, [-0.45, 0.03, 0], [0.45, 0.03, 0.05], 0.028, 0.018, 5, 4, 4, 0); cyl(t, [0.05, 0.03, 0.02], [0.3, 0.05, 0.25], 0.015, 0.01, 4, 4, null, 0); });
    add(t => cyl(t, [0, -0.05, 0], [0, 0.42, 0], 0.5, 0.04, 10, 5, null, 0));
    add(t => blob(t, 0.45, 0.4, 0.4, 6, 0.32));
    return { data: new Float32Array(out), ranges };
  };

  const WATER_VS = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec4 aInfo;
layout(location = 2) in vec4 aMore;
uniform mat4 uViewProj;
out vec3 vWorld;
out vec4 vInfo;
out vec4 vMore;
void main() {
  vWorld = aPos;
  vInfo = aInfo;
  vMore = aMore;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}`;

  const WATER_FS = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec4 vInfo;
in vec4 vMore;
uniform vec3 uEye;
uniform vec3 uWater;
uniform vec3 uSky;
uniform vec3 uZenith;
uniform vec3 uFog;
uniform float uFogFar;
uniform vec3 uFogDir;
uniform vec3 uFogSun;
vec3 fogTint(vec3 w) { vec3 e = w - uEye; float k = pow(max(dot(normalize(e.xz + 1e-4), normalize(uFogDir.xz + 1e-4)), 0.0), 5.0); return uFog + uFogSun * k; }
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSun;
uniform vec3 uMoonDir;
uniform float uMoon;
uniform float uNight;
uniform vec3 uLight;
uniform vec3 uAmbient;
uniform vec3 uLightDir;
uniform vec3 uWind;
uniform float uWet;
uniform float uRain;
uniform float uClock;
uniform vec3 uWetSky;
float rh(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 15731.743); }
float ring(vec2 p, float t) {
  vec2 c = floor(p), f = fract(p) - 0.5;
  float ph = fract(t * 0.9 + rh(c));
  float d = length(f - (vec2(rh(c + 3.1), rh(c + 7.7)) - 0.5) * 0.2);
  return (1.0 - smoothstep(0.0, 0.035, abs(d - ph * 0.4))) * (1.0 - ph) * step(0.35, rh(c + 1.7));
}
float ripples(vec2 p) { return uRain * (ring(p * 3.4, uClock) + ring(p * 3.4 + 0.5, uClock * 1.13 + 0.4)); }
vec3 wetten(vec3 c, vec3 n, float wet, float pool) {
  vec3 v = normalize(uEye - vWorld);
  float fr = pow(1.0 - max(dot(v, n), 0.0), 4.0);
  c *= 1.0 - wet * 0.3;
  c = mix(c, uWetSky * 0.85, fr * wet * 0.3);
  if (pool > 0.0) {
    vec3 pc = mix(c * 0.5, uWetSky * (0.55 + 0.45 * fr), 0.3 + 0.5 * fr) + uWetSky * ripples(vWorld.xz) * 0.32;
    c = mix(c, pc, pool);
  }
  return c;
}
out vec4 outColor;
float wh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wn(vec2 p) { vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f); return mix(mix(wh(i), wh(i + vec2(1.0, 0.0)), u.x), mix(wh(i + vec2(0.0, 1.0)), wh(i + vec2(1.0, 1.0)), u.x), u.y); }
float field(vec2 q, vec2 dir) {
  vec2 r = vec2(dot(q, dir), dot(q, vec2(-dir.y, dir.x)));
  return wn(vec2(r.x * 0.55, r.y * 1.3)) * 0.55 + wn(vec2(r.x * 1.6, r.y * 3.1) + 5.3) * 0.3 + wn(q * 3.7 + 9.1) * 0.15;
}
float waves(vec2 p, vec2 dir, float speed) {
  float ph0 = fract(uTime * 0.25), ph1 = fract(uTime * 0.25 + 0.5), w0 = 1.0 - abs(ph0 * 2.0 - 1.0);
  float a = field(p - dir * speed * 4.0 * (ph0 - 0.5), dir), b = field(p - dir * speed * 4.0 * (ph1 - 0.5) + vec2(3.7, 1.9), dir);
  return mix(b, a, w0);
}
void main() {
  float kind = vMore.x, speed = vMore.y, foam = vMore.z;
  bool river = kind < 0.5, lake = kind > 0.5 && kind < 1.5, swamp = kind > 1.5 && kind < 2.5, falls = kind > 2.5;
  vec2 dir = river || falls ? vec2(cos(vMore.w), sin(vMore.w)) : normalize(uWind.xy + vec2(1e-3));
  float sp = river ? speed : falls ? 0.0 : 0.15 + uWind.z * 0.4;
  vec3 lit = uAmbient + uLight * max(uLightDir.y, 0.0) * 0.8;
  vec3 v = normalize(uEye - vWorld);
  float d = distance(vWorld, uEye), fog = clamp(d / uFogFar, 0.0, 1.0);
  if (falls) {
    float st = wn(vec2(vInfo.y * 7.0, vWorld.y * 0.7 + uTime * 4.0)) * 0.6 + wn(vec2(vInfo.y * 16.0, vWorld.y * 1.6 + uTime * 7.0)) * 0.4;
    float edge = smoothstep(vInfo.z - 1.2, vInfo.z - 0.4, abs(vInfo.y));
    vec3 c = mix(uWater * 1.4 + lit * 0.15, lit * 1.0, smoothstep(0.35, 0.8, st));
    outColor = vec4(mix(c, fogTint(vWorld), fog * fog * (3.0 - 2.0 * fog)), (0.55 + 0.35 * smoothstep(0.35, 0.8, st)) * (1.0 - edge));
    return;
  }
  float amp = river ? 0.16 + speed * 0.1 : swamp ? 0.05 : 0.08 + uWind.z * 0.2;
  vec2 p = vWorld.xz, e = vec2(0.18, 0.0);
  float h0 = waves(p, dir, sp), hx = waves(p + e.xy, dir, sp), hz = waves(p + e.yx, dir, sp);
  float lod = 0.2 + 0.8 * (1.0 - smoothstep(10.0, 70.0, d)) * (0.4 + 0.6 * smoothstep(0.05, 0.35, v.y));
  vec3 n = normalize(vec3(-(hx - h0) / e.x * amp * lod, 1.0, -(hz - h0) / e.x * amp * lod));
  vec3 R = reflect(-v, n);
  vec3 sky = mix(uSky, uZenith, smoothstep(0.0, 0.6, R.y)) * 0.85;
  float fres = 0.03 + 0.72 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  float a = abs(vInfo.y), hf = vInfo.z, dep = vInfo.w;
  float ld = lake || swamp ? dep * max(0.0, 1.0 - (a / hf) * (a / hf)) + 0.05 : dep * (1.0 - smoothstep(hf - 2.2, hf + 0.8, a)) + 0.05;
  float T = exp(-ld * (swamp ? 4.0 : 1.25)) * 0.72;
  vec3 deep = swamp ? vec3(0.07, 0.07, 0.03) * lit * 1.6 : uWater;
  float alpha = 1.0 - (1.0 - fres) * T;
  vec3 c = (sky * fres + (1.0 - fres) * (1.0 - T) * deep) / max(alpha, 1e-3);
  vec3 glint = pow(max(dot(R, uSunDir), 0.0), 240.0) * uSun * 5.0 * (1.0 - uNight) + pow(max(dot(R, uMoonDir), 0.0), 70.0) * vec3(0.75, 0.8, 0.95) * uMoon * 1.6;
  c += glint;
  alpha = max(alpha, clamp(dot(glint, vec3(0.33)), 0.0, 1.0));
  if (river) {
    vec2 fq = vec2(vInfo.y, vInfo.x - uTime * speed * 1.6);
    float bank = smoothstep(hf - 1.0, hf + 0.4, a);
    float fn = wn(fq * vec2(2.4, 1.1)) * 0.6 + wn(fq * vec2(6.0, 3.0) + 4.0) * 0.4;
    float fm = smoothstep(0.7, 0.86, fn + foam * 0.4 + bank * 0.12 * speed) * step(0.04, foam + bank * 0.7);
    c = mix(c, lit * 0.95, fm * 0.85);
    alpha = mix(alpha, 0.95, fm);
  }
  if (swamp) {
    float dw = smoothstep(0.56, 0.64, wn(p * 0.45) * 0.6 + wn(p * 2.3) * 0.4 + smoothstep(hf * 0.3, hf * 0.8, a) * 0.2);
    c = mix(c, vec3(0.15, 0.2, 0.07) * lit * (0.85 + 0.3 * wn(p * 6.0)), dw * 0.9);
    alpha = mix(alpha, 0.97, dw);
  }
  c += uWetSky * ripples(vWorld.xz) * 0.4;
  outColor = vec4(mix(c, fogTint(vWorld), fog * fog * (3.0 - 2.0 * fog)), alpha);
}`;

  const GLOW_VS = `#version 300 es
layout(location = 0) in vec3 aCenter;
layout(location = 1) in vec2 aCorner;
layout(location = 2) in vec3 aColor;
layout(location = 3) in float aSize;
uniform mat4 uViewProj;
uniform vec3 uRight;
uniform vec3 uUp;
uniform vec3 uEye;
uniform float uFogFar;
out vec2 vUv;
out vec3 vColor;
out float vFade;
void main() {
  vec3 p = aCenter + (uRight * aCorner.x + uUp * aCorner.y) * aSize;
  vUv = aCorner;
  vColor = aColor;
  vFade = clamp(1.0 - distance(aCenter, uEye) / (uFogFar * 2.4), 0.0, 1.0);
  gl_Position = uViewProj * vec4(p, 1.0);
}`;

  const GLOW_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vColor;
in float vFade;
uniform float uNight;
out vec4 outColor;
void main() {
  float r = length(vUv);
  float a = exp(-r * r * 4.0) * (1.0 - smoothstep(0.85, 1.0, r));
  outColor = vec4(vColor * a * uNight * vFade * 1.6, 1.0);
}`;

  const SMOKE_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vColor;
in float vFade;
out vec4 outColor;
void main() {
  float r = length(vUv);
  float a = exp(-r * r * 2.6) * (1.0 - smoothstep(0.85, 1.0, r)) * 0.8 * vFade;
  outColor = vec4(vColor, a);
}`;

  const FIG_VS = `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;
layout(location = 0) in vec4 aM0;
layout(location = 1) in vec4 aM1;
layout(location = 2) in vec4 aM2;
layout(location = 3) in vec4 aPal;
layout(location = 4) in vec4 aExt;
uniform sampler2D uMesh;
uniform mat4 uViewProj;
out vec2 vUv;
out vec3 vTint;
out vec3 vNrm;
out vec3 vWorld;
out vec2 vFace;
flat out int vEyes;
vec3 unpackColor(float v) {
  float r = floor(v / 65536.0);
  float g = floor((v - r * 65536.0) / 256.0);
  float b = v - r * 65536.0 - g * 256.0;
  return vec3(r, g, b) / 255.0;
}
vec4 fetch(int i) {
  return texelFetch(uMesh, ivec2(i % 2048, i / 2048), 0);
}
void main() {
  int vid = gl_VertexID;
  vUv = vec2(0.0);
  vTint = vec3(0.0);
  vNrm = vec3(0.0, 1.0, 0.0);
  vWorld = vec3(0.0);
  vFace = vec2(0.0);
  vEyes = 0;
  if (vid >= int(aExt.y + 0.5)) { gl_Position = vec4(0.0, 0.0, -2.0, 1.0); return; }
  int i = (int(aExt.x + 0.5) + vid) * 3;
  vec4 t0 = fetch(i);
  vec4 t1 = fetch(i + 1);
  vec4 t2 = fetch(i + 2);
  vec4 p = vec4(t0.xyz, 1.0);
  vec3 n = vec3(t0.w, t1.x, t1.y);
  vec2 uv = t1.zw;
  int slot = int(t2.x + 0.5);
  vWorld = vec3(dot(aM0, p), dot(aM1, p), dot(aM2, p));
  vNrm = vec3(dot(aM0.xyz, n), dot(aM1.xyz, n), dot(aM2.xyz, n));
  vec3 c = vec3(1.0);
  if (slot == 0 || slot == 6) c = unpackColor(aPal.x);
  else if (slot == 1) c = unpackColor(aPal.y);
  else if (slot == 2) c = unpackColor(aPal.z);
  else if (slot == 3) c = unpackColor(aPal.w);
  else if (slot == 4) c = unpackColor(aExt.w);
  else if (slot == 5) c = vec3(0.34, 0.23, 0.15);
  else if (slot == 7) c = vec3(0.56, 0.42, 0.27);
  else if (slot == 8) c = vec3(0.08, 0.07, 0.07);
  else if (slot == 9) c = vec3(0.24, 0.23, 0.25);
  else if (slot == 10) c = vec3(0.94, 0.92, 0.86);
  if (slot == 6) {
    int z = int(aExt.z + 0.5);
    vFace = vec2((uv.x * 8.0 - 0.03) / 0.94, (uv.y * 8.0 - 2.03) / 0.94);
    vEyes = z >> 3;
    uv.x += float(z & 7) / 8.0;
  }
  vTint = c;
  vUv = uv;
  gl_Position = uViewProj * vec4(vWorld, 1.0);
}`;

  const FIG_FS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vTint;
in vec3 vNrm;
in vec3 vWorld;
in vec2 vFace;
flat in int vEyes;
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
out vec4 outColor;
void main() {
  vec4 t = texture(uTex, vUv);
  vec3 base = t.a > 0.75 ? t.rgb * vTint : t.rgb;
  for (int s = 0; s < 2; s++) {
    if ((vEyes & (1 << s)) == 0) continue;
    vec2 c = vec2(s == 0 ? 0.287 : 0.713, 0.425);
    vec2 d = (vFace - c) / vec2(0.07, 0.05);
    float r = dot(d, d);
    if (r < 1.0) base = mix(vec3(0.05, 0.01, 0.01), vec3(0.22, 0.03, 0.03), r);
    else if (r < 1.9) base = mix(base, vec3(0.5, 0.12, 0.1), 0.65);
    else if (abs(vFace.x - c.x + 0.01) < 0.014 && vFace.y > c.y && vFace.y < c.y + 0.24 - abs(vFace.x - c.x) * 4.0) base = vec3(0.36, 0.03, 0.02);
  }
  vec3 n = normalize(vNrm);
  float diff = max(dot(n, uLightDir), 0.0);
  vec3 c = base * (uAmbient + uLight * (diff * 0.85 + 0.15));
  float f = clamp(distance(vWorld, uEye) / uFogFar, 0.0, 1.0);
  outColor = vec4(mix(c, fogTint(vWorld), f * f * (3.0 - 2.0 * f)), 1.0);
}`;

  const SIGHT_VS = `#version 300 es
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  const SIGHT_FS = `#version 300 es
precision highp float;
uniform float uWidth;
uniform float uEdge;
uniform vec2 uDark;
uniform vec4 uTintL;
uniform vec4 uTintR;
uniform vec3 uSlit;
out vec4 outColor;
void main() {
  float m = smoothstep(0.5 - uEdge, 0.5 + uEdge, gl_FragCoord.x / uWidth);
  float dark = mix(uDark.x, uDark.y, m);
  vec2 q = abs(gl_FragCoord.xy / vec2(uWidth, uSlit.z) - 0.5) * 2.0;
  float slit = uSlit.z > 0.0 ? max(smoothstep(uSlit.x - 0.06, uSlit.x + 0.02, q.x), smoothstep(uSlit.y - 0.08, uSlit.y + 0.02, q.y)) : 0.0;
  dark = max(dark, slit * 0.96);
  vec4 tint = mix(uTintL, uTintR, m);
  float a = max(dark, tint.a);
  outColor = vec4(tint.rgb * tint.a * (1.0 - dark), a);
}`;

  const POST_FS = `#version 300 es
precision highp float;
uniform sampler2D uTex;
out vec4 outColor;
const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
void main() {
  ivec2 p = ivec2(gl_FragCoord.xy);
  vec3 c = texelFetch(uTex, p, 0).rgb;
  float d = (BAYER[(p.y & 3) * 4 + (p.x & 3)] + 0.5) / 16.0 - 0.5;
  vec3 levels = vec3(31.0, 63.0, 31.0);
  outColor = vec4(clamp(floor(c * levels + 0.5 + d), vec3(0.0), levels) / levels, 1.0);
}`;

  const SIGHT_TINT = { ok: [0, 0, 0, 0], dark: [0, 0, 0, 0], glass: [0.86, 0.9, 0.92, 0.22], resin: [0.95, 0.62, 0.16, 0.2], ruby: [0.85, 0.08, 0.12, 0.24] };

  const FAR = 280, MESH_W = 2048;

  class Figures {
    constructor(gpu) {
      const gl = gpu.gl, lib = K.Models.library();
      this.gpu = gpu;
      this.prog = gpu.program(FIG_VS, FIG_FS);
      const texels = lib.verts * 3, rows = Math.ceil(texels / MESH_W), mesh = new Float32Array(MESH_W * rows * 4);
      for (let v = 0; v < lib.verts; v++) {
        const s = v * lib.stride, o = v * 12, d = lib.data;
        mesh[o] = d[s]; mesh[o + 1] = d[s + 1]; mesh[o + 2] = d[s + 2]; mesh[o + 3] = d[s + 3];
        mesh[o + 4] = d[s + 4]; mesh[o + 5] = d[s + 5]; mesh[o + 6] = d[s + 6]; mesh[o + 7] = d[s + 7];
        mesh[o + 8] = d[s + 8];
      }
      this.meshTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.meshTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, MESH_W, rows, 0, gl.RGBA, gl.FLOAT, mesh);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      this.tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, K.Tex.people());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, 3);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      const meshTex = this.meshTex, tex = this.tex;
      gpu.frees.push(() => { gl.deleteTexture(meshTex); gl.deleteTexture(tex); });
      this.vao = gl.createVertexArray();
      this.layers = { still: this.layer(), live: this.layer(), hands: this.layer() };
      const vao = this.vao;
      gpu.frees.push(() => gl.deleteVertexArray(vao));
      this.stillKey = null;
      this.stats = { instances: 0, draws: 0, tris: 0 };
    }

    layer() {
      const gl = this.gpu.gl, buf = gl.createBuffer();
      this.gpu.frees.push(() => gl.deleteBuffer(buf));
      return { buf, segs: [], n: 0, cap: 0, arr: null };
    }

    fill(layer, items, opts) {
      const gl = this.gpu.gl, res = K.Models.pack(items, Object.assign({ out: layer.arr, grow: true }, opts));
      layer.segs = res.segs;
      layer.n = res.n;
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.buf);
      if (res.data !== layer.arr || res.data.length > layer.cap) {
        layer.arr = res.data;
        layer.cap = res.data.length;
        gl.bufferData(gl.ARRAY_BUFFER, res.data, gl.DYNAMIC_DRAW);
      } else {
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, res.data, 0, res.n * K.Models.INST);
      }
    }

    near(items, eye) {
      return items.filter(it => {
        const f = it.frames, g = f ? null : it.gear && it.gear[0] && it.gear[0][1];
        if (!f && !g) return false;
        return Math.hypot((f ? f[33] : g[9]) - eye[0], (f ? f[35] : g[11]) - eye[2]) < FAR;
      });
    }

    setStill(items, version, eye) {
      const key = version + ':' + Math.floor(eye[0] / 32) + ':' + Math.floor(eye[2] / 32);
      if (key === this.stillKey) return;
      this.stillKey = key;
      this.fill(this.layers.still, this.near(items, eye));
    }

    setLive(items, eye) {
      this.fill(this.layers.live, this.near(items, eye));
    }

    setHands(item, leg) {
      this.fill(this.layers.hands, [item, leg].filter(Boolean), { parts: [3, 4, 5, 6] });
    }

    begin(vp, eye, D, fogFar) {
      const gl = this.gpu.gl, u = this.prog.u;
      gl.useProgram(this.prog.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.meshTex);
      gl.uniform1i(u.uMesh, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.uniform1i(u.uTex, 1);
      gl.uniformMatrix4fv(u.uViewProj, false, vp);
      gl.uniform3fv(u.uLightDir, D.lightDir);
      gl.uniform3fv(u.uLight, D.light);
      gl.uniform3fv(u.uAmbient, D.ambient);
      gl.uniform3fv(u.uEye, eye);
      gl.uniform3fv(u.uFog, D.horizon); gl.uniform3fv(u.uFogDir, D.sunDir); gl.uniform3fv(u.uFogSun, D.sunFog);
      gl.uniform1f(u.uFogFar, fogFar);
      gl.bindVertexArray(this.vao);
    }

    draw(layer) {
      const gl = this.gpu.gl, stride = K.Models.INST * 4;
      let draws = 0, tris = 0;
      if (!layer.n) return { draws, tris };
      gl.bindBuffer(gl.ARRAY_BUFFER, layer.buf);
      for (const s of layer.segs) {
        for (let a = 0; a < 5; a++) {
          gl.enableVertexAttribArray(a);
          gl.vertexAttribPointer(a, 4, gl.FLOAT, false, stride, s.start * stride + a * 16);
          gl.vertexAttribDivisor(a, 1);
        }
        gl.drawArraysInstanced(gl.TRIANGLES, 0, s.verts, s.count);
        draws++;
        tris += s.verts / 3 * s.count;
      }
      return { draws, tris };
    }

    end() {
      const gl = this.gpu.gl;
      gl.bindVertexArray(null);
      gl.activeTexture(gl.TEXTURE0);
    }
  }

  const KIND = {
    stone: [0.72, 0.71, 0.67], plaster: [0.86, 0.85, 0.81], dark: [0.34, 0.33, 0.35],
    wood: [0.55, 0.42, 0.29], bark: [0.38, 0.29, 0.2], leaf: [0.22, 0.36, 0.16]
  };

  const boxGeometry = (list, color) => {
    const out = [];
    for (const b of list) {
      const base = color || KIND[b.kind] || KIND.stone;
      const col = b.landmark ? base.map(c => Math.min(1, c * 1.1)) : base;
      const corner = (u, v) => [b.x + u * b.c - v * b.s, b.z + u * b.s + v * b.c];
      const p = [corner(-b.hw, -b.hd), corner(b.hw, -b.hd), corner(b.hw, b.hd), corner(-b.hw, b.hd)];
      const face = (a, c2, d, e, n, tint) => {
        const cc = col.map(x => x * tint);
        for (const v of [a, c2, d, a, d, e]) out.push(v[0], v[1], v[2], n[0], n[1], n[2], cc[0], cc[1], cc[2]);
      };
      const lo = i => [p[i][0], b.y0, p[i][1]], hi = i => [p[i][0], b.y1, p[i][1]];
      const nu = [b.c, 0, b.s], nv = [-b.s, 0, b.c];
      face(hi(0), hi(1), hi(2), hi(3), [0, 1, 0], 1.08);
      face(lo(0), lo(3), lo(2), lo(1), [0, -1, 0], 0.6);
      face(lo(0), lo(1), hi(1), hi(0), [-nv[0], 0, -nv[2]], 0.95);
      face(lo(2), lo(3), hi(3), hi(2), nv, 0.95);
      face(lo(1), lo(2), hi(2), hi(1), nu, 1);
      face(lo(3), lo(0), hi(0), hi(3), [-nu[0], 0, -nu[2]], 1);
    }
    return new Float32Array(out);
  };

  const TOWN_MATS = ['plaster', 'plank', 'log', 'stone', 'shingle', 'thatch', 'slate', 'floor', 'door', 'window', 'beam', 'cloth', 'cloth2', 'hide', 'dirt', 'bed', 'iron', 'bronze', 'char', 'ochre', 'basalt'];
  const KORNI_IDS = new Set(K.Places.BUILDINGS.filter(b => b.korni).map(b => b.id));
  const KEEP = new Set(['floor', 'stone', 'iron', 'dirt']);
  const charred = p => p.kind === 'roof' || p.item ? null : Object.assign({}, p, { mat: KEEP.has(p.mat) ? p.mat : 'char', y1: p.mat === 'log' || p.mat === 'plank' ? p.y1 - 0.7 : p.y1 });
  const TOWN_LOCAL = new Set(['door', 'window']);

  const townGeometry = (town, keep) => {
    const out = [], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const vert = (p, n, uv, m, indoor) => out.push(p[0], p[1], p[2], n[0], n[1], n[2], uv[0], uv[1], m, indoor);
    const quad = (p, n, uv, m, indoor) => { for (const i of [0, 1, 2, 0, 2, 3]) vert(p[i], n, uv[i], m, indoor); };
    const tri = (p, n, uv, m, indoor) => { for (let i = 0; i < 3; i++) vert(p[i], n, uv[i], m, indoor); };
    const ob = (ctr, ax, ay, az, hx, hy, hz, mat, indoor) => {
      const m = TOWN_MATS.indexOf(mat), local = TOWN_LOCAL.has(mat), ind = indoor ? 1 : 0;
      const P = (a, b, d) => [ctr[0] + ax[0] * a * hx + ay[0] * b * hy + az[0] * d * hz, ctr[1] + ax[1] * a * hx + ay[1] * b * hy + az[1] * d * hz, ctr[2] + ax[2] * a * hx + ay[2] * b * hy + az[2] * d * hz];
      const side = (n, h, pts, size) => {
        const uv = local ? [[0, 0], [1, 0], [1, 1], [0, 1]] : pts.map(p => [dot(p, h), p[1]]);
        quad(pts, n, uv, m, ind);
      };
      side(az, ax, [P(-1, -1, 1), P(1, -1, 1), P(1, 1, 1), P(-1, 1, 1)]);
      side(az.map(x => -x), ax, [P(1, -1, -1), P(-1, -1, -1), P(-1, 1, -1), P(1, 1, -1)]);
      side(ax, az, [P(1, -1, 1), P(1, -1, -1), P(1, 1, -1), P(1, 1, 1)]);
      side(ax.map(x => -x), az, [P(-1, -1, -1), P(-1, -1, 1), P(-1, 1, 1), P(-1, 1, -1)]);
      const topPts = [P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)], botPts = [P(-1, -1, -1), P(-1, -1, 1), P(1, -1, 1), P(1, -1, -1)];
      const flat = pts => local ? [[0, 0], [1, 0], [1, 1], [0, 1]] : pts.map(p => [dot(p, ax), dot(p, az)]);
      quad(topPts, ay, flat(topPts), m, ind);
      quad(botPts, ay.map(x => -x), flat(botPts), m, ind);
    };
    const axes = rot => { const c = Math.cos(rot), s = Math.sin(rot); return [[c, 0, s], [0, 1, 0], [-s, 0, c]]; };
    const box = p => { const [ax, ay, az] = axes(p.rot || 0); ob([p.x, (p.y0 + p.y1) / 2, p.z], ax, ay, az, p.w / 2, (p.y1 - p.y0) / 2, p.d / 2, p.mat, p.indoor); };
    const roof = p => {
      const [ax, , az] = axes(p.rot), m = TOWN_MATS.indexOf(p.mat), at = (u, v, y) => [p.x + ax[0] * u + az[0] * v, y, p.z + ax[2] * u + az[2] * v];
      const hw = p.w / 2, hd = p.d / 2, rise = p.y1 - p.y0;
      if (p.hip) {
        const apex = at(0, 0, p.y1), cs = [at(-hw, -hd, p.y0), at(hw, -hd, p.y0), at(hw, hd, p.y0), at(-hw, hd, p.y0)];
        for (let i = 0; i < 4; i++) {
          const a = cs[i], b = cs[(i + 1) % 4], mid = [(a[0] + b[0]) / 2 - p.x, 0, (a[2] + b[2]) / 2 - p.z], len = Math.hypot(mid[0], mid[2]);
          const n = [mid[0] / len * rise, len, mid[2] / len * rise], nl = Math.hypot(...n), e = [b[0] - a[0], 0, b[2] - a[2]], el = Math.hypot(e[0], e[2]);
          tri([a, b, apex], n.map(x => x / nl), [[0, 0], [el, 0], [el / 2, Math.hypot(len, rise)]], m, 0);
        }
        return;
      }
      const alongU = p.ridge === 'u', half = alongU ? hd : hw, run = alongU ? hw : hd, slope = Math.hypot(half, rise);
      const R = (a, b, y) => alongU ? at(a, b, y) : at(b, a, y), dir = alongU ? az : ax, rdir = alongU ? ax : az;
      for (const sgn of [-1, 1]) {
        const n0 = [dir[0] * sgn * rise, half, dir[2] * sgn * rise], nl = Math.hypot(...n0), n = n0.map(x => x / nl);
        const pts = [R(-run, sgn * half, p.y0), R(run, sgn * half, p.y0), R(run, 0, p.y1), R(-run, 0, p.y1)];
        quad(pts, n, pts.map((q, i) => [dot(q, rdir), i < 2 ? 0 : slope]), m, 0);
        const lip = [R(-run, sgn * half, p.y0), R(run, sgn * half, p.y0), R(run, sgn * half, p.y0 - 0.12), R(-run, sgn * half, p.y0 - 0.12)];
        quad(lip, dir.map(x => x * sgn), lip.map(q => [dot(q, rdir), q[1]]), TOWN_MATS.indexOf('beam'), 0);
      }
      const g = TOWN_MATS.indexOf(p.gable || 'plank'), inset = run - 0.4;
      const lift = rise * 0.4 / half;
      for (const sgn of [-1, 1]) {
        const n = rdir.map(x => x * sgn), uv = q => [dot(q, dir), q[1]];
        const sq = [R(sgn * inset, -half + 0.4, p.y0), R(sgn * inset, half - 0.4, p.y0), R(sgn * inset, half - 0.4, p.y0 + lift), R(sgn * inset, -half + 0.4, p.y0 + lift)];
        quad(sq, n, sq.map(uv), g, 0);
        const pts = [R(sgn * inset, -half + 0.4, p.y0 + lift), R(sgn * inset, half - 0.4, p.y0 + lift), R(sgn * inset, 0, p.y1)];
        tri(pts, n, pts.map(uv), g, 0);
      }
    };
    const bell = p => {
      const m = TOWN_MATS.indexOf('bronze'), prof = [[0, 1], [0.08, 0.97], [0.3, 0.72], [0.6, 0.58], [0.85, 0.5], [0.95, 0.32], [1, 0]], N = 14, h = p.y1 - p.y0;
      for (let k = 0; k < prof.length - 1; k++) {
        for (let i = 0; i < N; i++) {
          const a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2;
          const ring = (t, a) => [p.x + Math.cos(a) * p.r * prof[t][1], p.y0 + h * prof[t][0], p.z + Math.sin(a) * p.r * prof[t][1]];
          const am = (a0 + a1) / 2, dr = prof[k][1] - prof[k + 1][1], dy = prof[k + 1][0] - prof[k][0], nl = Math.hypot(dr * p.r, dy * h) || 1;
          const n = [Math.cos(am) * dy * h / nl, dr * p.r / nl, Math.sin(am) * dy * h / nl];
          quad([ring(k, a0), ring(k, a1), ring(k + 1, a1), ring(k + 1, a0)], n, [[a0, prof[k][0]], [a1, prof[k][0]], [a1, prof[k + 1][0]], [a0, prof[k + 1][0]]], m, 0);
        }
      }
      ob([p.x, p.y1 + 0.12, p.z], [1, 0, 0], [0, 1, 0], [0, 0, 1], 3.05, 0.12, 0.14, 'beam', 0);
      ob([p.x, p.y0 + 0.25, p.z], [1, 0, 0], [0, 1, 0], [0, 0, 1], 0.06, 0.3, 0.06, 'iron', 0);
    };
    const wheel = p => {
      const [ax, ay, az] = axes(p.rot), N = p.r < 1 ? 10 : 16, rim = p.r < 1 ? 0.045 : 0.1, bars = p.r < 1 ? 3 : 4;
      for (const off of p.r < 1 ? [0] : [-p.width / 2, p.width / 2]) {
        for (let i = 0; i < N; i++) {
          const a = (i + 0.5) / N * Math.PI * 2, r = p.r - 0.1, ctr = [p.x + ax[0] * off + az[0] * Math.cos(a) * r, p.y + Math.sin(a) * r, p.z + ax[2] * off + az[2] * Math.cos(a) * r];
          const tan = [az[0] * -Math.sin(a), Math.cos(a), az[2] * -Math.sin(a)], rad = [az[0] * Math.cos(a), Math.sin(a), az[2] * Math.cos(a)];
          ob(ctr, ax, rad, tan, p.r < 1 ? p.width / 2 : 0.06, rim, Math.PI * p.r / N + 0.02, 'beam', 0);
        }
        for (let i = 0; i < bars; i++) {
          const a = i / bars * Math.PI, rad = [az[0] * Math.cos(a), Math.sin(a), az[2] * Math.cos(a)], tan = [az[0] * -Math.sin(a), Math.cos(a), az[2] * -Math.sin(a)];
          ob([p.x + ax[0] * off, p.y, p.z + ax[2] * off], ax, tan, rad, 0.05, 0.06, p.r - 0.15, 'beam', 0);
        }
      }
      if (p.paddles !== false) for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2, r = p.r - 0.05, rad = [az[0] * Math.cos(a), Math.sin(a), az[2] * Math.cos(a)], tan = [az[0] * -Math.sin(a), Math.cos(a), az[2] * -Math.sin(a)];
        ob([p.x + rad[0] * r, p.y + rad[1] * r, p.z + rad[2] * r], ax, rad, tan, p.width / 2, 0.22, 0.03, 'plank', 0);
      }
      ob([p.x, p.y, p.z], ax, ay, az, p.width / 2 + (p.r < 1 ? 0.08 : 0.5), p.r < 1 ? 0.06 : 0.12, p.r < 1 ? 0.06 : 0.12, 'iron', 0);
    };
    const furniture = p => {
      const [ax, ay, az] = axes(p.rot || 0), long = p.w >= p.d, L = Math.max(p.w, p.d) / 2, S = Math.min(p.w, p.d) / 2, y0 = p.y0, y1 = p.y1, h = y1 - y0;
      const sub = (a, b, lo, hi, ha, hb, mat) => {
        const u = long ? a : b, v = long ? b : a, hu = long ? ha : hb, hv = long ? hb : ha;
        ob([p.x + ax[0] * u + az[0] * v, (lo + hi) / 2, p.z + ax[2] * u + az[2] * v], ax, ay, az, hu, (hi - lo) / 2, hv, mat, 1);
      };
      const legs = (lo, hi, k) => { for (const a of [-1, 1]) for (const b of [-1, 1]) sub(a * (L - k), b * (S - k), lo, hi, 0.04, 0.04, 'beam'); };
      switch (p.item) {
        case 'table': sub(0, 0, y1 - 0.06, y1, L, S, 'plank'); legs(y0, y1 - 0.06, 0.1); break;
        case 'bench': sub(0, 0, y1 - 0.05, y1, L, S, 'plank'); for (const a of [-1, 1]) sub(a * (L - 0.12), 0, y0, y1 - 0.05, 0.04, S - 0.03, 'plank'); break;
        case 'bed': case 'cot': sub(0, 0, y0, y0 + 0.28, L, S, 'beam'); legs(y0, y1 - 0.05, 0.05); sub(0.15, 0, y0 + 0.28, y1, L - 0.2, S - 0.04, 'bed'); sub(-L + 0.22, 0, y0 + 0.28, y1 + 0.06, 0.18, S - 0.1, 'plaster'); sub(-L + 0.03, 0, y0, y1 + 0.35, 0.03, S, 'beam'); break;
        case 'chest': sub(0, 0, y0, y1 - 0.1, L, S, 'beam'); sub(0, 0, y1 - 0.1, y1, L + 0.02, S + 0.02, 'beam'); for (const a of [-0.6, 0.6]) sub(a * L, 0, y0, y1 + 0.005, 0.03, S + 0.025, 'iron'); break;
        case 'hearth': sub(0, 0, y0, y0 + 0.35, L, S, 'stone'); for (const a of [-1, 1]) sub(a * (L - 0.18), 0, y0 + 0.35, y1, 0.18, S, 'stone'); sub(0, 0.12, y1 - 0.3, y1, L, S - 0.12, 'stone'); sub(0, S - 0.12, y0 + 0.35, y1, L - 0.36, 0.12, 'stone'); sub(0, 0.15, y1, y0 + 3.1, L * 0.45, S * 0.6, 'stone'); sub(0, -0.1, y0 + 0.35, y0 + 0.5, L - 0.5, S - 0.3, 'dirt'); break;
        case 'barrel': for (const k of [0, 1]) { const turn = k * Math.PI / 4, [bx, , bz] = axes((p.rot || 0) + turn); ob([p.x, (y0 + y1) / 2, p.z], bx, ay, bz, L * 0.92, h / 2, L * 0.92 * 0.414 * 2.4, 'plank', 1); ob([p.x, (y0 + y1) / 2, p.z], bz, ay, bx.map(x => -x), L * 0.92, h / 2, L * 0.92 * 0.414 * 2.4, 'plank', 1); } for (const f of [0.2, 0.8]) sub(0, 0, y0 + h * f - 0.03, y0 + h * f + 0.03, L * 0.97, L * 0.97, 'iron'); break;
        case 'counter': sub(0, 0, y0, y1 - 0.06, L, S - 0.05, 'plank'); sub(0, 0, y1 - 0.06, y1, L + 0.05, S + 0.05, 'beam'); break;
        case 'shelf': for (const a of [-1, 1]) sub(a * (L - 0.03), 0, y0, y1, 0.03, S, 'beam'); for (let i = 0; i < 4; i++) sub(0, 0, y0 + 0.1 + i * 0.55, y0 + 0.13 + i * 0.55, L, S, 'plank'); for (let i = 0; i < 7; i++) sub(-L + 0.3 + i * (L * 2 - 0.6) / 6, 0, y0 + 0.68 + (i % 3) * 0.55, y0 + 0.88 + (i % 3) * 0.55, 0.07, 0.07, i % 2 ? 'bronze' : 'stone'); break;
        case 'rack': for (const a of [-1, 1]) sub(a * (L - 0.05), 0, y0, y1, 0.05, S, 'beam'); sub(0, 0, y1 - 0.1, y1 - 0.04, L, 0.04, 'beam'); sub(0, 0, y0 + 0.3, y0 + 0.36, L, 0.04, 'beam'); for (let i = 0; i < 6; i++) sub(-L + 0.3 + i * (L * 2 - 0.6) / 5, 0, y0 + 0.25, y1 - 0.15, 0.02, 0.02, i % 2 ? 'iron' : 'beam'); break;
        case 'anvil': sub(0, 0, y0, y1 - 0.25, S * 0.8, S * 0.8, 'beam'); sub(0, 0, y1 - 0.25, y1, L, S * 0.7, 'iron'); break;
        case 'stove': sub(0, 0, y0, y0 + 1.1, L, S, 'stone'); sub(0, 0, y0 + 1.1, y0 + 3.1, L * 0.4, S * 0.4, 'stone'); sub(0, -S - 0.005, y0 + 0.35, y0 + 0.7, L * 0.4, 0.01, 'dirt'); break;
        case 'stand': sub(0, 0, y0, y1, L, S, 'plank'); sub(0, 0, y1, y1 + 0.02, L * 0.6, S * 0.6, 'cloth'); break;
        default: box(p);
      }
    };
    for (const p0 of town.parts) {
      const p = keep ? keep(p0) : p0;
      if (!p) continue;
      if (p.item) furniture(p);
      else if (p.kind === 'roof') roof(p);
      else if (p.kind === 'bell') bell(p);
      else if (p.kind === 'wheel') wheel(p);
      else box(p);
    }
    return new Float32Array(out);
  };

  const frustum = m => {
    const r = i => [m[i], m[4 + i], m[8 + i], m[12 + i]];
    const r0 = r(0), r1 = r(1), r2 = r(2), r3 = r(3);
    const add = (a, b, s) => [a[0] + s * b[0], a[1] + s * b[1], a[2] + s * b[2], a[3] + s * b[3]];
    return [add(r3, r0, 1), add(r3, r0, -1), add(r3, r1, 1), add(r3, r1, -1), add(r3, r2, 1), add(r3, r2, -1)];
  };

  const visible = (planes, x0, y0, z0, x1, y1, z1) => {
    for (const p of planes) {
      if (p[0] * (p[0] > 0 ? x1 : x0) + p[1] * (p[1] > 0 ? y1 : y0) + p[2] * (p[2] > 0 ? z1 : z0) + p[3] < 0) return false;
    }
    return true;
  };

  const groundUpload = (gl, T) => {
    const G = T.ground(), N = T.N, out = {}, ani = gl.getExtension('EXT_texture_filter_anisotropic');
    const flat = (unit, data, w, h) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    };
    out.w = [0, 1, 2].map(q => {
      const d = new Uint8Array(N * N * 4);
      for (let k = 0; k < N * N; k++) for (let c = 0; c < 4; c++) d[k * 4 + c] = G.weights[k * G.M + q * 4 + c];
      return flat(4 + q, d, N, N);
    });
    out.aux = flat(7, G.aux, N, N);
    const S = K.Tex.GSIZE, L = K.Tex.GBASE.length, layers = gl.createTexture();
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, layers);
    gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, S, S, L, 0, gl.RGBA, gl.UNSIGNED_BYTE, K.Tex.ground());
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);
    if (ani) gl.texParameterf(gl.TEXTURE_2D_ARRAY, ani.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(ani.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    out.layers = layers;
    gl.activeTexture(gl.TEXTURE0);
    return out;
  };

  class Renderer {
    rainSetup() {
      const gl = this.gpu.gl, prog = this.gpu.program(RAIN_VS, RAIN_FS), MAX = 6000, r = K.rng(97), drops = new Float32Array(MAX * 4);
      for (let i = 0; i < MAX * 4; i++) drops[i] = r();
      const vao = gl.createVertexArray(), cb = gl.createBuffer(), ib = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, cb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 0, 1, 0, 1, 1, -1, 0, 1, 1, -1, 1]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, ib);
      gl.bufferData(gl.ARRAY_BUFFER, drops, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 16, 0);
      gl.vertexAttribDivisor(1, 1);
      gl.bindVertexArray(null);
      this.gpu.frees.push(() => { gl.deleteVertexArray(vao); gl.deleteBuffer(cb); gl.deleteBuffer(ib); });
      return { prog, vao, MAX, n: 0 };
    }

    grassSetup(T) {
      const gl = this.gpu.gl, prog = this.gpu.program(GRASS_VS, GRASS_FS), MAX = 40000;
      const corners = [];
      for (const p of [0, 1]) for (const [x, y] of [[-0.5, 0], [0.5, 0], [0.5, 1], [-0.5, 0], [0.5, 1], [-0.5, 1]]) corners.push(x, y, p);
      const vao = gl.createVertexArray(), cb = gl.createBuffer(), ib = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, cb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(corners), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 12, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, ib);
      gl.bufferData(gl.ARRAY_BUFFER, MAX * 32, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 0);
      gl.vertexAttribDivisor(1, 1);
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 32, 16);
      gl.vertexAttribDivisor(2, 1);
      gl.bindVertexArray(null);
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE8);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, K.Tex.grass());
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.activeTexture(gl.TEXTURE0);
      this.gpu.frees.push(() => { gl.deleteVertexArray(vao); gl.deleteBuffer(cb); gl.deleteBuffer(ib); gl.deleteTexture(tex); });
      return { prog, vao, ib, tex, MAX, n: 0, key: '', cache: new Map(), at: K.Detail.sampler(T), data: new Float32Array(MAX * 8) };
    }

    clutterSetup() {
      const gl = this.gpu.gl, prog = this.gpu.program(CLUTTER_VS, CLUTTER_FS), M = clutterMeshes(), MAX = 16000;
      const vao = gl.createVertexArray(), vb = gl.createBuffer(), ib = gl.createBuffer();
      gl.bindVertexArray(vao);
      gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, M.data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 28, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 28, 24);
      gl.bindBuffer(gl.ARRAY_BUFFER, ib);
      gl.bufferData(gl.ARRAY_BUFFER, MAX * 32, gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(3); gl.vertexAttribDivisor(3, 1);
      gl.enableVertexAttribArray(4); gl.vertexAttribDivisor(4, 1);
      gl.bindVertexArray(null);
      this.gpu.frees.push(() => { gl.deleteVertexArray(vao); gl.deleteBuffer(vb); gl.deleteBuffer(ib); });
      return { prog, vao, ib, ranges: M.ranges, MAX, data: new Float32Array(MAX * 8), counts: [], key: '' };
    }

    grassUpdate(eye, level) {
      const G = this.grass, T = this.T, cs = K.Detail.CELL, key = Math.floor(eye[0] / cs) + ':' + Math.floor(eye[2] / cs) + ':' + level;
      if (G.key === key) return;
      G.key = key;
      const L = K.Detail.LEVELS[level], r = L.radius, gl = this.gpu.gl, smalls = [];
      let n = 0;
      if (r) {
        const c0x = Math.floor((eye[0] - r) / cs), c1x = Math.floor((eye[0] + r) / cs), c0z = Math.floor((eye[2] - r) / cs), c1z = Math.floor((eye[2] + r) / cs);
        for (let cz = c0z; cz <= c1z; cz++) for (let cx = c0x; cx <= c1x; cx++) {
          const mx = cx * cs + cs / 2, mz = cz * cs + cs / 2;
          if (Math.hypot(mx - eye[0], mz - eye[2]) > r + cs || mx < 0 || mz < 0 || mx > T.SIZE || mz > T.SIZE) continue;
          const ck = cx + ':' + cz;
          let list = G.cache.get(ck);
          if (!list) { list = K.Detail.cell(T, cx, cz, G.at); list.small = K.Detail.small(T, cx, cz, G.at); G.cache.set(ck, list); if (G.cache.size > 900) G.cache.delete(G.cache.keys().next().value); }
          if (Math.hypot(mx - eye[0], mz - eye[2]) < r * 0.62 + cs) smalls.push(list.small);
          for (let q = 0; q < list.length && n < G.MAX; q++) {
            if (L.density < 1 && (q * 7 + cx * 3 + cz) % 2) continue;
            const g = list[q], o = n * 8;
            G.data[o] = g.x; G.data[o + 1] = g.y; G.data[o + 2] = g.z; G.data[o + 3] = g.kind;
            G.data[o + 4] = g.scale; G.data[o + 5] = g.rot; G.data[o + 6] = g.tone; G.data[o + 7] = g.shade;
            n++;
          }
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, G.ib);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, G.data, 0, n * 8);
      }
      const C = this.clutter, kinds = C.ranges.length;
      C.counts = new Array(kinds).fill(0);
      let m = 0;
      for (let k = 0; k < kinds; k++) for (const list of smalls) for (const g of list) {
        if (g.kind !== k || m >= C.MAX) continue;
        const o = m * 8;
        C.data[o] = g.x; C.data[o + 1] = g.y; C.data[o + 2] = g.z; C.data[o + 3] = g.scale;
        C.data[o + 4] = g.rot; C.data[o + 5] = g.tone; C.data[o + 6] = g.moss; C.data[o + 7] = 0;
        C.counts[k]++;
        m++;
      }
      if (m) { gl.bindBuffer(gl.ARRAY_BUFFER, C.ib); gl.bufferSubData(gl.ARRAY_BUFFER, 0, C.data, 0, m * 8); }
      C.radius = r * 0.62;
      G.n = n;
      G.radius = r;
    }

    groundTextures(T) {
      const gl = this.gpu.gl, tex = groundUpload(gl, T);
      this.gpu.frees.push(() => { for (const x of [tex.layers, tex.aux, ...tex.w]) gl.deleteTexture(x); });
      return tex;
    }

    constructor(gpu, T, W, F) {
      this.gpu = gpu;
      this.T = T;
      this.sky = gpu.program(SKY_VS, SKY_FS);
      this.lit = gpu.program(LIT_VS, LIT_FS);
      this.townProg = gpu.program(TOWN_VS, TOWN_FS);
      this.water = gpu.program(WATER_VS, WATER_FS);
      this.glow = gpu.program(GLOW_VS, GLOW_FS);
      this.smokeProg = gpu.program(GLOW_VS, SMOKE_FS);
      this.sightProg = gpu.program(SIGHT_VS, SIGHT_FS);
      this.postProg = gpu.program(SIGHT_VS, POST_FS);
      this.post = null;
      this.screen = gpu.mesh([-1, -1, 3, -1, -1, 3], [2]);
      this.steps = [1, 2, 4];
      this.index = this.steps.map(s => gpu.indices(T.chunkIndices(s)));
      this.chunks = [];
      const n = (T.N - 1) / T.CHUNK;
      for (let cz = 0; cz < n; cz++) {
        for (let cx = 0; cx < n; cx++) {
          let x0 = 0, z0 = 0, size = 0;
          const lods = this.steps.map((s, i) => {
            const c = T.chunk(cx, cz, s);
            x0 = c.x0;
            z0 = c.z0;
            size = c.size;
            return { mesh: gpu.mesh(c.data, [3, 3, 3], this.index[i]), minY: c.minY, maxY: c.maxY };
          });
          this.chunks.push({ x0, z0, size, minY: Math.min(...lods.map(l => l.minY)), maxY: Math.max(...lods.map(l => l.maxY)), lods });
        }
      }
      this.boxes = gpu.mesh(boxGeometry(W.boxes.filter(b => !b.hidden && !b.dressed)), [3, 3, 3]);
      const town = K.Places.town(T);
      this.town = gpu.mesh(townGeometry(town, p => KORNI_IDS.has(p.building) ? null : p), [3, 3, 2, 2]);
      this.villageParts = { parts: town.parts.filter(p => KORNI_IDS.has(p.building)) };
      this.village = gpu.mesh(townGeometry(this.villageParts), [3, 3, 2, 2]);
      this.villageKey = '';
      const inner = T.waterMesh(), outerWater = K.Edge.water(T), allWater = new Float32Array(inner.length + outerWater.length);
      allWater.set(inner);
      allWater.set(outerWater, inner.length);
      this.waterMesh = gpu.mesh(allWater, T.WATER_LAYOUT);
      this.groundProg = gpu.program(LIT_VS, GROUND_FS);
      this.groundTex = this.groundTextures(T);
      this.roadProg = gpu.program(ROAD_VS, ROAD_FS);
      this.roads = gpu.mesh(T.roadGeometry(), [3, 3, 3]);
      this.grass = this.grassSetup(T);
      this.rain = this.rainSetup();
      this.propProg = gpu.program(PROP_VS, PROP_FS);
      this.outerProg = gpu.program(OUTER_VS, OUTER_FS);
      this.outer = gpu.mesh(K.Edge.mesh(T), [3, 3, 1]);
      this.props = gpu.mesh(propGeometry(K.Detail.props(T, F), T), [3, 3, 2]);
      this.clutter = this.clutterSetup();
      const glow = [];
      for (const L of K.Places.LANDMARKS) {
        for (const g of L.lights) {
          const ax = g.ax !== undefined ? g.ax : L.at[0] + (g.dx || 0), az = g.az !== undefined ? g.az : L.at[1] + (g.dz || 0);
          const y = T.heightAt(L.at[0], L.at[1]) + g.dy;
          for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) glow.push(ax, g.ax !== undefined ? T.heightAt(ax, az) + g.dy : y, az, u, v, g.color[0], g.color[1], g.color[2], g.size);
        }
      }
      for (const g of town.lights.filter(l => !l.indoor)) for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) glow.push(g.at[0], g.at[1], g.at[2], u, v, g.color[0], g.color[1], g.color[2], g.size);
      this.glowMesh = gpu.mesh(glow, [3, 2, 3, 1]);
      const hearths = [];
      for (const g of town.lights.filter(l => l.indoor)) for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) hearths.push(g.at[0], g.at[1], g.at[2], u, v, g.color[0], g.color[1], g.color[2], g.size);
      this.hearths = gpu.mesh(hearths, [3, 2, 3, 1]);
      this.flames = gpu.mesh(new Float32Array(FLAMES * 6 * 9), [3, 2, 3, 1]);
      this.flameData = new Float32Array(FLAMES * 6 * 9);
      this.puffs = gpu.mesh(new Float32Array(PUFFS * 6 * 9), [3, 2, 3, 1]);
      this.puffData = new Float32Array(PUFFS * 6 * 9);
      this.identity = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      this.forest = F ? new K.Trees.Forest(gpu, T, F) : null;
      this.figures = new Figures(gpu);
      this.fx = new K.Fx.Fx(gpu);
      this.fx.T = T;
      this.stats = { chunks: 0, tris: 0 };
    }

    target(w, h) {
      const gl = this.gpu.gl, old = this.post;
      if (old && old.w === w && old.h === h) return old;
      if (old) { gl.deleteFramebuffer(old.fb); gl.deleteTexture(old.tex); gl.deleteRenderbuffer(old.depth); }
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const depth = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
      const fb = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.post = { fb, tex, depth, w, h };
      return this.post;
    }

    render(v, w, h) {
      const WX = K.Weather && v.weather ? v.weather : null;
      const gl = this.gpu.gl, D = WX ? K.Weather.apply(K.daylight(v.hour, v.day, WX.wx.cloud), WX.wx, WX.mist, WX.flash) : K.daylight(v.hour, v.day, v.cloud), b = K.basis(v.yaw, v.pitch), fogFar = D.fogFar * (v.fogScale || 1);
      const wind = D.wind || [0.95, 0.31, 0.2], tNow = v.time || 0, dtv = K.clamp(tNow - (this.skyT === undefined ? tNow : this.skyT), 0, 0.25), wetSky = D.horizon.map((c, i) => (c + D.zenith[i]) / 2);
      this.skyT = tNow;
      this.cloudOff = this.cloudOff || [0, 0];
      this.cloudOff[0] += wind[0] * (0.002 + 0.007 * wind[2]) * dtv;
      this.cloudOff[1] += wind[1] * (0.002 + 0.007 * wind[2]) * dtv;
      D.wind = wind;
      D.time = tNow;
      const wetU = u => { gl.uniform1f(u.uWet, D.wet || 0); gl.uniform1f(u.uRain, D.rain || 0); gl.uniform1f(u.uClock, tNow); gl.uniform3fv(u.uWetSky, wetSky); };
      const tanY = Math.tan(v.fov / 2), aspect = w / h, post = v.dither ? this.target(w, h) : null;
      gl.bindFramebuffer(gl.FRAMEBUFFER, post ? post.fb : null);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(this.sky.p);
      const su = this.sky.u;
      gl.uniform3fv(su.uFwd, b.fwd);
      gl.uniform3fv(su.uRight, b.right);
      gl.uniform3fv(su.uUp, b.up);
      gl.uniform2f(su.uTan, tanY * aspect, tanY);
      gl.uniform3fv(su.uZenith, D.zenith);
      gl.uniform3fv(su.uHorizon, D.horizon);
      gl.uniform3fv(su.uSunDir, D.sunDir);
      gl.uniform3fv(su.uSun, D.sun);
      gl.uniform3fv(su.uMoonDir, D.moonDir);
      gl.uniform1f(su.uNight, D.night);
      gl.uniform1f(su.uDusk, D.dusk);
      gl.uniform1f(su.uTime, v.time || 0);
      gl.uniform1f(su.uMoon, D.moon);
      gl.uniform1f(su.uCloud, D.cloud);
      gl.uniform3fv(su.uFogSun, D.sunFog);
      gl.uniform1f(su.uStorm, D.storm || 0);
      gl.uniform1f(su.uMist, WX ? WX.mist : 0);
      gl.uniform1f(su.uFlash, D.flash || 0);
      gl.uniform2fv(su.uCloudOff, this.cloudOff);
      const bolt = WX && WX.bolt && D.flash > 0 ? WX.bolt : null;
      gl.uniform4fv(su.uBolt, bolt ? [bolt.dir[0], bolt.dir[1], Math.atan(450 / bolt.dist), bolt.seed + 0.01] : [0, 0, 0, 0]);
      gl.bindVertexArray(this.screen.vao);
      gl.drawArrays(gl.TRIANGLES, 0, this.screen.count);

      gl.enable(gl.DEPTH_TEST);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      const view = K.m4.lookAt(v.eye, K.v3.add(v.eye, b.fwd), [0, 1, 0]);
      const vp = K.m4.multiply(K.m4.perspective(v.fov, aspect, 0.1, 3600), view);
      const planes = frustum(vp);
      gl.useProgram(this.lit.p);
      const lu = this.lit.u;
      gl.uniformMatrix4fv(lu.uViewProj, false, vp);
      gl.uniformMatrix4fv(lu.uModel, false, this.identity);
      gl.uniform3fv(lu.uLightDir, D.lightDir);
      gl.uniform3fv(lu.uLight, D.light);
      gl.uniform3fv(lu.uAmbient, D.ambient);
      gl.uniform3fv(lu.uEye, v.eye);
      gl.uniform3fv(lu.uFog, D.horizon); gl.uniform3fv(lu.uFogDir, D.sunDir); gl.uniform3fv(lu.uFogSun, D.sunFog);
      gl.uniform1f(lu.uFogFar, fogFar);
      const gp = this.groundProg, gu = gp.u, GT = this.groundTex;
      gl.useProgram(gp.p);
      gl.uniformMatrix4fv(gu.uViewProj, false, vp);
      gl.uniformMatrix4fv(gu.uModel, false, this.identity);
      gl.uniform3fv(gu.uLightDir, D.lightDir);
      gl.uniform3fv(gu.uLight, D.light);
      gl.uniform3fv(gu.uAmbient, D.ambient);
      gl.uniform3fv(gu.uEye, v.eye);
      gl.uniform3fv(gu.uFog, D.horizon); gl.uniform3fv(gu.uFogDir, D.sunDir); gl.uniform3fv(gu.uFogSun, D.sunFog);
      gl.uniform1f(gu.uFogFar, fogFar);
      gl.uniform1f(gu.uSamples, this.T.N);
      gl.uniform1f(gu.uStep, this.T.STEP);
      gl.uniform1fv(gu.uTile, K.Tex.GTILE);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D_ARRAY, GT.layers);
      for (let q = 0; q < 3; q++) { gl.activeTexture(gl.TEXTURE4 + q); gl.bindTexture(gl.TEXTURE_2D, GT.w[q]); }
      gl.activeTexture(gl.TEXTURE7); gl.bindTexture(gl.TEXTURE_2D, GT.aux);
      gl.activeTexture(gl.TEXTURE0);
      gl.uniform1i(gu.uLayers, 3);
      gl.uniform1i(gu.uW0, 4);
      gl.uniform1i(gu.uW1, 5);
      gl.uniform1i(gu.uW2, 6);
      gl.uniform1i(gu.uAux, 7);
      wetU(gu);
      let drawn = 0, tris = 0;
      for (const c of this.chunks) {
        const cx = c.x0 + c.size / 2, cz = c.z0 + c.size / 2;
        const d = Math.max(0, Math.hypot(cx - v.eye[0], cz - v.eye[2]) - c.size * 0.71);
        if (d > fogFar + 60) continue;
        if (!visible(planes, c.x0, c.minY, c.z0, c.x0 + c.size, c.maxY, c.z0 + c.size)) continue;
        const lod = c.lods[d < 220 ? 0 : d < 500 ? 1 : 2].mesh;
        gl.bindVertexArray(lod.vao);
        gl.drawElements(gl.TRIANGLES, lod.count, gl.UNSIGNED_SHORT, 0);
        drawn++;
        tris += lod.count / 3;
      }
      const op = this.outerProg, ou = op.u;
      gl.useProgram(op.p);
      gl.uniformMatrix4fv(ou.uViewProj, false, vp);
      gl.uniform3fv(ou.uLightDir, D.lightDir);
      gl.uniform3fv(ou.uLight, D.light);
      gl.uniform3fv(ou.uAmbient, D.ambient);
      gl.uniform3fv(ou.uEye, v.eye);
      gl.uniform3fv(ou.uFog, D.horizon); gl.uniform3fv(ou.uFogDir, D.sunDir); gl.uniform3fv(ou.uFogSun, D.sunFog);
      gl.uniform1f(ou.uFogFar, fogFar);
      gl.uniform1f(ou.uSize, this.T.SIZE);
      gl.uniform1fv(ou.uTile, K.Tex.GTILE);
      gl.uniform1i(ou.uLayers, 3);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(2, 8);
      gl.bindVertexArray(this.outer.vao);
      gl.drawArrays(gl.TRIANGLES, 0, this.outer.count);
      gl.disable(gl.POLYGON_OFFSET_FILL);
      tris += this.outer.count / 3;
      const rp = this.roadProg, ru = rp.u;
      gl.useProgram(rp.p);
      gl.uniformMatrix4fv(ru.uViewProj, false, vp);
      gl.uniform3fv(ru.uLightDir, D.lightDir);
      gl.uniform3fv(ru.uLight, D.light);
      gl.uniform3fv(ru.uAmbient, D.ambient);
      gl.uniform3fv(ru.uEye, v.eye);
      gl.uniform3fv(ru.uFog, D.horizon); gl.uniform3fv(ru.uFogDir, D.sunDir); gl.uniform3fv(ru.uFogSun, D.sunFog);
      gl.uniform1f(ru.uFogFar, fogFar);
      gl.uniform1f(ru.uSamples, this.T.N);
      gl.uniform1f(ru.uStep, this.T.STEP);
      gl.uniform1fv(ru.uTile, K.Tex.GTILE);
      gl.uniform1i(ru.uLayers, 3);
      gl.uniform1i(ru.uAux, 7);
      wetU(ru);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      gl.polygonOffset(-1, -4);
      gl.bindVertexArray(this.roads.vao);
      gl.drawArrays(gl.TRIANGLES, 0, this.roads.count);
      tris += this.roads.count / 3;
      gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      const pp = this.propProg, pu = pp.u;
      gl.useProgram(pp.p);
      gl.uniformMatrix4fv(pu.uViewProj, false, vp);
      gl.uniform3fv(pu.uLightDir, D.lightDir);
      gl.uniform3fv(pu.uLight, D.light);
      gl.uniform3fv(pu.uAmbient, D.ambient);
      gl.uniform3fv(pu.uEye, v.eye);
      gl.uniform3fv(pu.uFog, D.horizon); gl.uniform3fv(pu.uFogDir, D.sunDir); gl.uniform3fv(pu.uFogSun, D.sunFog);
      gl.uniform1f(pu.uFogFar, fogFar);
      gl.uniform1i(pu.uLayers, 3);
      gl.bindVertexArray(this.props.vao);
      gl.drawArrays(gl.TRIANGLES, 0, this.props.count);
      tris += this.props.count / 3;
      const level = v.grass === undefined ? 2 : v.grass;
      this.grassUpdate(v.eye, level);
      if (this.grass.n) {
        const G = this.grass, gu2 = G.prog.u;
        gl.useProgram(G.prog.p);
        gl.uniformMatrix4fv(gu2.uViewProj, false, vp);
        gl.uniform1f(gu2.uTime, v.time || 0);
        gl.uniform3fv(gu2.uWind, wind);
        gl.uniform3fv(gu2.uEye, v.eye);
        gl.uniform1f(gu2.uRadius, G.radius);
        gl.uniform1fv(gu2.uH, K.Detail.KINDS.map(k => k.h));
        gl.uniform1fv(gu2.uW, K.Detail.KINDS.map(k => k.w));
        gl.uniform3fv(gu2.uLightDir, D.lightDir);
        gl.uniform3fv(gu2.uLight, D.light);
        gl.uniform3fv(gu2.uAmbient, D.ambient);
        gl.uniform3fv(gu2.uFog, D.horizon); gl.uniform3fv(gu2.uFogDir, D.sunDir); gl.uniform3fv(gu2.uFogSun, D.sunFog);
        gl.uniform1f(gu2.uFogFar, fogFar);
        gl.activeTexture(gl.TEXTURE8);
        gl.bindTexture(gl.TEXTURE_2D, G.tex);
        gl.uniform1i(gu2.uTex, 8);
        gl.activeTexture(gl.TEXTURE0);
        gl.disable(gl.CULL_FACE);
        gl.bindVertexArray(G.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 12, G.n);
        tris += G.n * 4;
      }
      const C = this.clutter;
      if (C.counts.some(x => x)) {
        const cu = C.prog.u;
        gl.useProgram(C.prog.p);
        gl.uniformMatrix4fv(cu.uViewProj, false, vp);
        gl.uniform3fv(cu.uEye, v.eye);
        gl.uniform1f(cu.uRadius, C.radius);
        gl.uniform3fv(cu.uLightDir, D.lightDir);
        gl.uniform3fv(cu.uLight, D.light);
        gl.uniform3fv(cu.uAmbient, D.ambient);
        gl.uniform3fv(cu.uFog, D.horizon); gl.uniform3fv(cu.uFogDir, D.sunDir); gl.uniform3fv(cu.uFogSun, D.sunFog);
        gl.uniform1f(cu.uFogFar, fogFar);
        gl.uniform1i(cu.uLayers, 3);
        gl.bindVertexArray(C.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, C.ib);
        let first = 0;
        C.ranges.forEach(([start, count], k) => {
          const n = C.counts[k];
          if (!n) return;
          gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 32, first * 32);
          gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 32, first * 32 + 16);
          gl.drawArraysInstanced(gl.TRIANGLES, start, count, n);
          tris += count / 3 * n;
          first += n;
        });
      }
      gl.useProgram(this.lit.p);
      gl.bindVertexArray(this.boxes.vao);
      gl.drawArrays(gl.TRIANGLES, 0, this.boxes.count);
      tris += this.boxes.count / 3;
      gl.useProgram(this.townProg.p);
      const tu = this.townProg.u;
      gl.uniformMatrix4fv(tu.uViewProj, false, vp);
      gl.uniform3fv(tu.uLightDir, D.lightDir);
      gl.uniform3fv(tu.uLight, D.light);
      gl.uniform3fv(tu.uAmbient, D.ambient);
      gl.uniform3fv(tu.uEye, v.eye);
      gl.uniform3fv(tu.uFog, D.horizon); gl.uniform3fv(tu.uFogDir, D.sunDir); gl.uniform3fv(tu.uFogSun, D.sunFog);
      gl.uniform1f(tu.uFogFar, fogFar);
      gl.uniform1f(tu.uNight, D.night);
      gl.bindVertexArray(this.town.vao);
      gl.drawArrays(gl.TRIANGLES, 0, this.town.count);
      tris += this.town.count / 3;
      const burnt = v.burnt || '';
      if (burnt !== this.villageKey) {
        const set = new Set(burnt.split(',').filter(Boolean)), data = townGeometry(this.villageParts, p => set.has(p.building) ? charred(p) : p);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.village.buf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
        this.village.count = data.length / 10;
        this.villageKey = burnt;
      }
      gl.bindVertexArray(this.village.vao);
      gl.drawArrays(gl.TRIANGLES, 0, this.village.count);
      tris += this.village.count / 3;
      if (v.fx && v.fx.blood) this.fx.pools(vp, v.eye, D, fogFar, v.fx.S);
      const people = { instances: 0, draws: 0, tris: 0 };
      if (v.people) {
        const fg = this.figures;
        fg.setStill(v.people.still, v.people.version, v.eye);
        fg.setLive(v.people.live, v.eye);
        fg.begin(vp, v.eye, D, fogFar);
        for (const layer of [fg.layers.still, fg.layers.live]) {
          const r = fg.draw(layer);
          people.draws += r.draws;
          people.tris += r.tris;
          people.instances += layer.n;
        }
        fg.end();
        tris += people.tris;
      }

      if (this.forest) {
        const R = v.treeRadius || 40;
        this.forest.update(v.eye, R);
        this.forest.draw(vp, v.eye, D, fogFar, R, !!v.border);
        tris += this.forest.stats.tris;
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.useProgram(this.water.p);
      const wu = this.water.u;
      gl.uniformMatrix4fv(wu.uViewProj, false, vp);
      gl.uniform3fv(wu.uEye, v.eye);
      gl.uniform3fv(wu.uWater, [0.13, 0.25, 0.27].map((c, i) => c * (D.ambient[i] + D.light[i] * 0.5)));
      gl.uniform3fv(wu.uSky, D.horizon);
      gl.uniform3fv(wu.uFog, D.horizon); gl.uniform3fv(wu.uFogDir, D.sunDir); gl.uniform3fv(wu.uFogSun, D.sunFog);
      gl.uniform1f(wu.uFogFar, fogFar);
      gl.uniform1f(wu.uTime, v.time || 0);
      gl.uniform3fv(wu.uZenith, D.zenith);
      gl.uniform3fv(wu.uSunDir, D.sunDir);
      gl.uniform3fv(wu.uSun, D.sun);
      gl.uniform3fv(wu.uMoonDir, D.moonDir);
      gl.uniform1f(wu.uMoon, (D.moonLit === undefined ? 1 : D.moonLit) * D.night * (1 - (D.cloud || 0) * 0.85));
      gl.uniform1f(wu.uNight, D.night);
      gl.uniform3fv(wu.uLight, D.light);
      gl.uniform3fv(wu.uAmbient, D.ambient);
      gl.uniform3fv(wu.uLightDir, D.lightDir);
      gl.uniform3fv(wu.uWind, wind);
      wetU(wu);
      gl.bindVertexArray(this.waterMesh.vao);
      gl.drawArrays(gl.TRIANGLES, 0, this.waterMesh.count);

      if (D.night > 0.02) {
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(this.glow.p);
        const gu = this.glow.u;
        gl.uniformMatrix4fv(gu.uViewProj, false, vp);
        gl.uniform3fv(gu.uRight, b.right);
        gl.uniform3fv(gu.uUp, b.up);
        gl.uniform3fv(gu.uEye, v.eye);
        gl.uniform1f(gu.uFogFar, fogFar);
        gl.uniform1f(gu.uNight, D.night);
        gl.bindVertexArray(this.glowMesh.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.glowMesh.count);
      }
      if (this.hearths.count) {
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(this.glow.p);
        const gu = this.glow.u;
        gl.uniformMatrix4fv(gu.uViewProj, false, vp);
        gl.uniform3fv(gu.uRight, b.right);
        gl.uniform3fv(gu.uUp, b.up);
        gl.uniform3fv(gu.uEye, v.eye);
        gl.uniform1f(gu.uFogFar, fogFar);
        gl.uniform1f(gu.uNight, 0.45 + D.night * 0.4);
        gl.bindVertexArray(this.hearths.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.hearths.count);
      }
      if (v.smoke && v.smoke.length) {
        const n = Math.min(PUFFS, v.smoke.length), d = this.puffData, shade = 0.12 + (1 - D.night) * 0.16;
        let k = 0;
        for (let i = 0; i < n; i++) {
          const g = v.smoke[i];
          for (const [u, w] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { d[k++] = g[0]; d[k++] = g[1]; d[k++] = g[2]; d[k++] = u; d[k++] = w; d[k++] = shade; d[k++] = shade; d[k++] = shade * 1.05; d[k++] = g[3]; }
        }
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(this.smokeProg.p);
        const su2 = this.smokeProg.u;
        gl.uniformMatrix4fv(su2.uViewProj, false, vp);
        gl.uniform3fv(su2.uRight, b.right);
        gl.uniform3fv(su2.uUp, b.up);
        gl.uniform3fv(su2.uEye, v.eye);
        gl.uniform1f(su2.uFogFar, fogFar * 1.6);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.puffs.buf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 54);
        gl.bindVertexArray(this.puffs.vao);
        gl.drawArrays(gl.TRIANGLES, 0, n * 6);
      }
      if (v.glows && v.glows.length) {
        const n = Math.min(FLAMES, v.glows.length), d = this.flameData;
        let k = 0;
        for (let i = 0; i < n; i++) {
          const g = v.glows[i], flick = 0.85 + 0.15 * Math.sin((v.time || 0) * 23 + i * 7.1) * Math.sin((v.time || 0) * 9.3 + i);
          for (const [u, w] of [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]]) { d[k++] = g[0]; d[k++] = g[1]; d[k++] = g[2]; d[k++] = u; d[k++] = w; d[k++] = g[3]; d[k++] = g[4]; d[k++] = g[5]; d[k++] = g[6] * flick; }
        }
        gl.blendFunc(gl.ONE, gl.ONE);
        gl.useProgram(this.glow.p);
        const gu = this.glow.u;
        gl.uniformMatrix4fv(gu.uViewProj, false, vp);
        gl.uniform3fv(gu.uRight, b.right);
        gl.uniform3fv(gu.uUp, b.up);
        gl.uniform3fv(gu.uEye, v.eye);
        gl.uniform1f(gu.uFogFar, fogFar);
        gl.uniform1f(gu.uNight, Math.max(0.35, D.night));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.flames.buf);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, d, 0, n * 54);
        gl.bindVertexArray(this.flames.vao);
        gl.drawArrays(gl.TRIANGLES, 0, n * 6);
      }
      this.rain.n = 0;
      if (WX && WX.precip && !WX.sheltered && WX.wx.rain > 0.02) {
        const R = this.rain, u = R.prog.u, snow = v.eye[1] > 195 ? 1 : 0, lit = D.ambient.map((c, i) => Math.min(1, (c + D.light[i] * 0.45) * (snow ? 1.4 : 1.15)));
        R.n = Math.round(R.MAX * Math.min(1, WX.wx.rain) * (snow ? 0.6 : 1));
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(R.prog.p);
        gl.uniformMatrix4fv(u.uViewProj, false, vp);
        gl.uniform3fv(u.uEye, v.eye);
        gl.uniform3fv(u.uFall, snow ? [wind[0] * wind[2] * 1.5, -1.4, wind[1] * wind[2] * 1.5] : [wind[0] * wind[2] * 4.5, -9.5, wind[1] * wind[2] * 4.5]);
        gl.uniform1f(u.uClock, tNow);
        gl.uniform1f(u.uBox, snow ? 20 : 26);
        gl.uniform1f(u.uLen, snow ? 0.035 : 0.6);
        gl.uniform1f(u.uWidth, snow ? 0.022 : 0.009);
        gl.uniform1f(u.uSnow, snow);
        gl.uniform3fv(u.uColor, lit);
        gl.uniform1f(u.uAlpha, snow ? 0.85 : 0.5);
        gl.bindVertexArray(R.vao);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, R.n);
      }
      gl.depthMask(true);
      gl.disable(gl.BLEND);
      gl.bindVertexArray(null);
      if (v.fx) {
        gl.enable(gl.DEPTH_TEST);
        this.fx.dots(vp, D, h, v.fx.blood);
      }
      if (v.hands) {
        const fg = this.figures, hvp = K.m4.multiply(K.m4.perspective(v.fov, aspect, 0.05, 6), view);
        fg.setHands(v.hands, v.leg);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        fg.begin(hvp, v.eye, D, 1e6);
        const r = fg.draw(fg.layers.hands);
        fg.end();
        people.draws += r.draws;
        tris += r.tris;
      }
      if (v.sight) {
        const s = v.sight, P = this.sightProg, tint = side => { const c = SIGHT_TINT[s.blind ? 'dark' : s[side]] || SIGHT_TINT.ok; return side === 'l' || side === 'r' ? (s[side] === 'resin' ? [c[0], c[1], c[2], c[3] + 0.08 * s.night] : c) : c; };
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(P.p);
        gl.uniform1f(P.u.uWidth, w);
        gl.uniform1f(P.u.uEdge, 0.03);
        gl.uniform2f(P.u.uDark, s.blind || s.l === 'dark' ? 1 : 0, s.blind || s.r === 'dark' ? 1 : 0);
        gl.uniform4fv(P.u.uTintL, tint('l'));
        gl.uniform4fv(P.u.uTintR, tint('r'));
        gl.uniform3f(P.u.uSlit, 0.6, 0.4, s.slit ? h : 0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.disable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
      }
      if (post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, w, h);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);
        gl.useProgram(this.postProg.p);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, post.tex);
        gl.uniform1i(this.postProg.u.uTex, 0);
        gl.bindVertexArray(null);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.enable(gl.DEPTH_TEST);
      }
      this.stats = { rain: this.rain.n, grass: this.grass.n, chunks: drawn, tris: Math.round(tris), trees: this.forest ? this.forest.stats.near : 0, draws: this.forest ? this.forest.stats.draws : 0, people };
    }
  }

  K.Renderer = Renderer;
})(globalThis.Kirill98 = globalThis.Kirill98 || {});
