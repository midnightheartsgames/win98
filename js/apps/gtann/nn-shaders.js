(function (N) {
  'use strict';

  const HASH = `
uint hu(uint x) { x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }
float hi2(ivec2 i) { return float(hu(uint(i.x) + hu(uint(i.y) + 0x9e3779b9u))) * 2.3283064e-10; }
float hi3(ivec3 i) { return float(hu(uint(i.x) + hu(uint(i.y) + hu(uint(i.z) + 0x85ebca6bu)))) * 2.3283064e-10; }
float hf2(vec2 p) { return hi2(ivec2(floor(p))); }
float vn(vec2 p) {
  vec2 fl = floor(p);
  ivec2 i = ivec2(fl);
  vec2 f = p - fl;
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hi2(i), hi2(i + ivec2(1, 0)), u.x), mix(hi2(i + ivec2(0, 1)), hi2(i + ivec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) { s += vn(p) * a; p = mat2(1.6, 1.2, -1.2, 1.6) * p + 17.3; a *= 0.5; }
  return s;
}
float fbm3(vec2 p) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 3; i++) { s += vn(p) * a; p = mat2(1.6, 1.2, -1.2, 1.6) * p + 5.1; a *= 0.5; }
  return s * 1.143;
}
`;

  const FOG = `
uniform vec4 u_fog;
uniform vec4 u_fogSun;
uniform vec3 u_fogCol;
float fogAmt(vec3 w, vec3 cam, float d, float farK) {
  float f = clamp((d - u_fog.x * farK) / (u_fog.y * farK - u_fog.x * farK), 0.0, 1.0);
  f = f * f * (3.0 - 2.0 * f);
  vec3 rd = (w - cam) / max(d, 0.001);
  float ry = abs(rd.y) < 0.0005 ? 0.0005 : rd.y;
  float b = u_fog.w;
  float fo = u_fog.z / b * exp(-max(cam.y, -2.0) * b) * (1.0 - exp(-d * ry * b)) / ry;
  float hf = 1.0 - exp(-max(fo, 0.0) / farK);
  return 1.0 - (1.0 - f) * (1.0 - hf);
}
vec3 fogColor(vec3 w, vec3 cam, float d, vec3 sun) {
  vec3 rd = (w - cam) / max(d, 0.001);
  return u_fogCol + u_fogSun.rgb * pow(max(dot(rd, sun), 0.0), u_fogSun.w);
}
`;

  const WORLD_VS = `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=1) in vec4 a_nrm;
layout(location=2) in vec2 a_uv;
layout(location=3) in vec4 a_col;
layout(location=4) in vec4 a_lk;
uniform mat4 u_vp;
uniform vec3 u_org;
uniform vec3 u_eyeL;
uniform vec4 u_wind;
uniform vec4 u_push[4];
uniform float u_time;
out vec3 v_w;
out vec3 v_n;
out vec2 v_uv;
out vec4 v_col;
out vec2 v_mat;
flat out float v_layer;
flat out float v_kind;
void main() {
  vec3 p = a_pos;
  float k = a_lk.y;
  if (abs(k - 1.0) < 0.5 || abs(k - 15.0) < 0.5) {
    float top = clamp(1.0 - a_uv.y, 0.0, 1.0);
    float ph = dot(p.xz + u_org.xz, vec2(0.071, 0.053));
    float osc = sin(u_time * 1.3 + ph) * 0.6 + sin(u_time * 2.9 + ph * 2.3) * 0.25;
    p.xz += u_wind.xy * (u_wind.w + osc * u_wind.z) * top * top;
  }
  if (abs(k - 19.0) < 0.5 && a_lk.z > 0.5) {
    float sw = a_lk.z * (1.0 / 255.0);
    vec3 w = p + u_org;
    float ph = dot(w.xz, vec2(0.071, 0.053));
    float osc = sin(u_time * 1.3 + ph) * 0.6 + sin(u_time * 2.9 + ph * 2.3) * 0.25;
    float fl = sin(u_time * 6.3 + dot(w, vec3(1.7, 2.3, 1.3))) * 0.5 + sin(u_time * 8.9 + dot(w, vec3(2.9, 1.1, 2.1))) * 0.5;
    p.xz += u_wind.xy * (u_wind.w + osc * u_wind.z) * sw * 1.6 + vec2(fl, -fl * 0.7) * sw * 0.05 * (0.4 + length(u_wind.xy));
    for (int i = 0; i < 4; i++) {
      vec4 q = u_push[i];
      if (q.z <= 0.0) continue;
      vec2 d = w.xz - q.xy;
      float dl = length(d) + 0.001;
      float f = (1.0 - smoothstep(q.z * 0.35, q.z, dl)) * (1.0 - smoothstep(q.w, q.w + 0.6, w.y));
      if (f <= 0.0) continue;
      float s = min(1.0, sw * 4.0) * f;
      p.xz += d / dl * s * 0.55 * min(q.z, 2.6);
      p.y -= s * 0.35 * min(1.5, q.z);
    }
  }
  v_w = p + u_org;
  v_n = a_nrm.xyz;
  v_uv = a_uv;
  v_col = a_col;
  v_layer = a_lk.x;
  v_kind = k;
  v_mat = a_lk.zw * (1.0 / 255.0);
  gl_Position = u_vp * vec4(p - u_eyeL, 1.0);
}`;

  const WORLD_FS = `#version 300 es
precision highp float;
precision highp sampler2DArray;
uniform sampler2DArray u_tex;
uniform sampler2D u_atlas;
uniform sampler2D u_mat;
uniform vec3 u_sun, u_sunCol, u_sky, u_gnd, u_cam, u_skyHor, u_skyTop;
uniform vec4 u_rain;
uniform vec4 u_flash;
uniform vec2 u_windW;
uniform float u_night, u_time, u_alpha;
uniform vec4 u_pl[16];
uniform vec3 u_plc[16];
uniform vec4 u_pld[16];
uniform int u_npl;
in vec3 v_w;
in vec3 v_n;
in vec2 v_uv;
in vec4 v_col;
in vec2 v_mat;
flat in float v_layer;
flat in float v_kind;
out vec4 o;
${HASH}
${FOG}
float puddle(vec2 p) {
  float n = vn(p * 0.09) * 0.6 + vn(p * 0.31 + 7.3) * 0.28 + vn(p * 1.7 + 3.1) * 0.12;
  float th = 0.68 - u_rain.z * 0.14;
  return smoothstep(th, th + 0.05, n);
}
vec2 ripples(vec2 p, float t) {
  vec2 acc = vec2(0.0);
  for (int l = 0; l < 2; l++) {
    vec2 q = p * (l == 0 ? 2.7 : 4.3) + float(l) * 31.7;
    vec2 c = floor(q);
    vec2 f = q - c;
    float h = hi2(ivec2(c) + ivec2(l * 977, 0));
    float ph = fract(t * (0.8 + h * 0.7) + h * 7.0);
    vec2 ctr = vec2(hi2(ivec2(c) + ivec2(13, 7)), hi2(ivec2(c) + ivec2(29, 3))) * 0.4 + 0.3;
    vec2 d = f - ctr;
    float r = length(d);
    float rr = ph * 0.32;
    float ring = sin((r - rr) * 70.0) * smoothstep(0.045, 0.0, abs(r - rr)) * (1.0 - ph) * (1.0 - ph);
    acc += d / max(r, 0.001) * ring;
  }
  return acc;
}
vec3 skyRefl(vec3 r) {
  float y = clamp(r.y, -0.2, 1.0);
  vec3 s = mix(u_skyHor, u_skyTop, sqrt(max(y, 0.0)));
  return y < 0.0 ? mix(u_skyHor, u_gnd * 1.4, -y * 5.0) : s;
}
float coneK(int i, vec3 L) {
  vec4 q = u_pld[i];
  return q.w < -1.5 ? 1.0 : smoothstep(q.w, q.w + (1.0 - q.w) * 0.5, dot(-L, q.xyz));
}
vec3 carEnv(vec3 r, float rough) {
  float y = r.y;
  float az = atan(r.z, r.x);
  float w = 0.004 + rough * 0.16;
  vec3 sky = mix(u_skyHor, u_skyTop, sqrt(clamp(y, 0.0, 1.0))) * 1.25;
  float edge = 0.03 + 0.07 * vn(vec2(az * 7.0, 1.3)) + 0.05 * step(0.62, vn(vec2(az * 31.0, 5.7)));
  vec3 city = mix(u_gnd, u_skyHor, 0.3) * 0.55;
  city += u_night * vec3(1.0, 0.72, 0.38) * step(0.9, hi2(ivec2(floor(az * 90.0), floor(y * 70.0)))) * step(0.0, y) * step(y, edge) * 0.8;
  vec3 c = mix(city, sky, smoothstep(edge - w, edge + w, y));
  c = mix(u_gnd * 1.15, c, smoothstep(-0.06 - w, w, y));
  return mix(c, mix(u_skyHor, u_gnd, 0.5) * 0.9, rough * rough * 0.6);
}
void main() {
  int k = int(v_kind + 0.5);
  bool atl = (k == 3 || k == 9 || k == 12);
  vec4 t = atl ? texture(u_atlas, v_uv) : texture(u_tex, vec3(v_uv, v_layer));
  bool fol = k == 19;
  bool leaf = (k == 1 || k == 15 || fol);
  if ((leaf || k == 11 || k == 12) && t.a < 0.5) discard;
  if (fol && v_mat.y > 0.0) {
    float fe = v_mat.y * 510.0;
    float fd = clamp((length(v_w - u_cam) - fe * 0.6) / (fe * 0.4), 0.0, 1.0);
    if (hi2(ivec2(gl_FragCoord.xy)) < fd) discard;
  }
  if (k == 3 && t.a < 0.25) discard;
  vec3 base = t.rgb * v_col.rgb;
  if (k == 6 || k == 13) base = mix(v_col.rgb, t.rgb, t.a);
  bool burnt = k == 6 && v_mat.x < 0.02;
  if (burnt) {
    vec2 q = v_uv * vec2(9.0, 5.0);
    float b1 = vn(q), b2 = vn(q * 3.7 + 11.0);
    base = mix(vec3(0.035, 0.032, 0.03), vec3(0.15, 0.072, 0.034), smoothstep(0.5, 0.85, b1) * 0.7);
    base = mix(base, vec3(0.26, 0.25, 0.23), smoothstep(0.72, 0.92, b2) * 0.5);
  }
  float grime = (k == 7 || k == 14 || k == 17 || fol) ? 0.0 : v_mat.y;
  if (grime > 0.004) {
    float gn = vn(v_uv * vec2(7.0, 4.0) + 3.7) * 0.6 + vn(v_uv * vec2(23.0, 13.0)) * 0.4;
    grime *= smoothstep(0.25, 0.75, gn + grime * 0.45);
    base = mix(base, vec3(0.34, 0.3, 0.24) * (0.8 + 0.4 * gn), grime * 0.85);
  }
  vec3 n = normalize(v_n + vec3(0.0, 0.0001, 0.0));
  if (leaf && !fol) n = vec3(0.0, 1.0, 0.0);
  if (k == 11 && dot(n, u_cam - v_w) < 0.0) n = -n;
  vec3 V = normalize(u_cam - v_w);
  vec4 mt = atl ? vec4(0.0) : texelFetch(u_mat, ivec2(int(v_layer + 0.5), 0), 0);
  float up = clamp(n.y * 1.6 - 0.6, 0.0, 1.0);
  float gloss = mt.b;
  float wet = 0.0, pud = 0.0;
  if (u_rain.y > 0.001 && !atl && k != 4 && k != 7 && k != 14) {
    wet = u_rain.y * (leaf ? 0.5 : mix(0.55, 1.0, up));
    if (up < 0.2 && !leaf) wet *= 0.75 + 0.25 * vn(vec2(v_w.x + v_w.z, v_w.y * 0.25 + u_time * 0.6) * vec2(5.0, 1.0));
    base *= 1.0 - mt.g * 0.45 * wet;
    if (!leaf) gloss = mix(gloss, 0.62 + 0.25 * up, wet * mt.a);
    if (up > 0.5 && mt.r > 0.0 && u_rain.z > 0.001) {
      pud = puddle(v_w.xz) * mt.r * up * smoothstep(0.0, 0.25, u_rain.z);
      if (pud > 0.001) {
        vec2 rp = u_rain.x > 0.01 ? ripples(mod(v_w.xz, 512.0), u_rain.w) * u_rain.x : vec2(0.0);
        rp += (vec2(vn(v_w.xz * 3.0 + u_windW * u_time * 0.2), vn(v_w.zx * 3.0 - u_windW * u_time * 0.2)) - 0.5) * (0.02 + length(u_windW) * 0.012);
        n = normalize(mix(n, normalize(vec3(rp.x * 0.5, 1.0, rp.y * 0.5)), pud));
        base *= 1.0 - 0.45 * pud;
        gloss = mix(gloss, 0.97, pud);
      }
    }
  }
  float ndl = max(dot(n, u_sun), 0.0);
  if (fol) ndl = max(dot(n, u_sun) + 0.55, 0.0) / 1.55 * 0.9;
  else if (leaf) ndl = 0.65 * max(u_sun.y, 0.0) + 0.2;
  float hemi = n.y * 0.5 + 0.5;
  vec3 lit = (mix(u_gnd, u_sky, hemi) + u_sunCol * ndl) * v_col.a;
  if (fol) lit += u_sunCol * pow(max(dot(-V, u_sun), 0.0), 4.0) * 0.32 * v_col.a;
  lit += u_flash.w * vec3(0.55, 0.62, 0.8) * (0.3 + 0.7 * max(dot(n, u_flash.xyz), 0.0));
  vec3 pl = vec3(0.0);
  vec3 spec = vec3(0.0);
  bool shiny = gloss > 0.3 && k != 6 && k != 4 && k < 16;
  float carExp = k == 6 && !burnt ? mix(24.0, 320.0, v_mat.x * v_mat.x) : (k == 16 ? 420.0 : (k == 17 ? 600.0 : (k == 18 ? 40.0 : 0.0)));
  vec3 cspec = vec3(0.0);
  vec3 Bv = normalize(vec3(V.x, 0.0, V.z) + vec3(0.0001, 0.0, 0.0));
  vec3 Tv = vec3(-Bv.z, 0.0, Bv.x);
  float ax = mix(0.3, 0.035, gloss);
  float ay = ax * mix(1.0, 7.0, up * max(wet, pud));
  for (int i = 0; i < 16; i++) {
    if (i >= u_npl) break;
    vec3 d = u_pl[i].xyz - v_w;
    float dist = length(d) + 0.001;
    vec3 L = d / dist;
    float cone = coneK(i, L);
    float att = max(0.0, 1.0 - dist / u_pl[i].w);
    att *= att * cone;
    float nl = leaf ? 0.8 : max(dot(n, L), 0.0) * 0.85 + 0.15;
    pl += u_plc[i] * att * nl;
    if (shiny) {
      vec3 H = normalize(L + V);
      float hn = max(dot(H, n), 0.05);
      float ht = dot(H, Tv), hb = dot(H, Bv);
      float D = exp(-((ht * ht) / (ax * ax) + (hb * hb) / (ay * ay)) / (hn * hn));
      spec += u_plc[i] * D * cone * (2.2 / (1.0 + dist * dist * 0.0035)) * step(0.0, dot(n, L));
    }
    if (carExp > 0.0) cspec += u_plc[i] * cone * pow(max(dot(n, normalize(L + V)), 0.0), carExp) * step(0.0, dot(n, L)) / (1.0 + dist * dist * 0.01);
  }
  lit += pl;
  vec3 c = base * lit;
  float fr = 0.03 + 0.97 * pow(1.0 - max(dot(n, V), 0.0), 5.0);
  float env = 0.0;
  if (shiny) {
    vec3 Hs = normalize(u_sun + V);
    float sp = pow(max(dot(n, Hs), 0.0), mix(12.0, 600.0, gloss * gloss));
    c += u_sunCol * sp * gloss * (0.15 + 1.6 * max(wet, pud)) * step(0.0, ndl);
    c += spec * (0.12 + fr) * gloss;
    env = clamp(fr * (wet * 0.55 + pud * 1.2 + gloss * 0.2), 0.0, 0.92) * mix(0.3, 1.0, gloss);
    c = mix(c, skyRefl(reflect(-V, n)), env);
  }
  if (k == 6 && !burnt) {
    float paintK = 1.0 - t.a;
    float g = clamp(v_mat.x * (1.0 - grime * 0.85) + max(wet, pud) * 0.25, 0.0, 1.0);
    vec3 r = reflect(-V, n);
    float f3 = 1.0 - max(dot(n, V), 0.0);
    f3 = f3 * f3 * f3;
    float coat = clamp((0.1 + 0.9 * f3) * mix(0.25, 1.1, g), 0.0, 0.92) * paintK;
    c = mix(c, carEnv(r, 1.0 - g), coat);
    c += u_sunCol * pow(max(dot(n, normalize(u_sun + V)), 0.0), mix(30.0, 700.0, g * g)) * mix(0.12, 1.8, g) * paintK * step(0.0, ndl);
    c += cspec * mix(0.4, 2.0, g) * paintK;
  }
  if (k >= 16 && k <= 18) {
    vec3 r = reflect(-V, n);
    float f5 = 1.0 - max(dot(n, V), 0.0);
    f5 = f5 * f5 * f5 * f5 * f5;
    float sunS = step(0.0, ndl);
    if (k == 16) {
      c = base * lit * 0.14 + carEnv(r, 0.05 + grime * 0.6) * base * (0.75 + 0.25 * f5);
      c += u_sunCol * pow(max(dot(r, u_sun), 0.0), 300.0) * 2.4 * sunS + cspec * 1.6;
    } else if (k == 17) {
      c = base * (lit * 0.78 + 0.05) + carEnv(r, 0.03) * (0.04 + 0.6 * f5);
      c += u_sunCol * pow(max(dot(r, u_sun), 0.0), 600.0) * 3.0 * sunS + cspec * 1.4;
    } else {
      c = base * lit + carEnv(r, 0.55) * (0.035 + 0.3 * f5) * (1.0 - grime);
      c += u_sunCol * pow(max(dot(n, normalize(u_sun + V)), 0.0), 40.0) * 0.12 * sunS + cspec * 0.15;
    }
  }
  if (k == 2) {
    float glass = 1.0 - t.a;
    vec2 cell = floor(v_uv);
    float h = hi2(ivec2(cell) * ivec2(7, 13) + ivec2(floor(v_w.xz * 0.011) * 71.0));
    vec3 refl = mix(u_skyHor, u_sky * 1.2, 0.5);
    c = mix(c, base * lit * 0.55 + refl * 0.5, glass * (1.0 - u_night * 0.75));
    float on = step(0.6 - u_night * 0.16, h) * u_night;
    vec3 wc = mix(vec3(1.0, 0.76, 0.42), vec3(0.72, 0.84, 1.0), step(0.88, h));
    c += glass * on * wc * (0.65 + 0.55 * fract(h * 13.0));
  }
  if (k == 3) c = t.rgb * v_col.rgb * (1.15 + u_night * 1.45);
  if (k == 5) c = mix(c, base * 2.6, u_night);
  if (k == 9) c = base * (lit + vec3(u_night * 0.85));
  if (k == 14) c = base * 2.2;
  if (k == 4) {
    vec2 p = v_w.xz;
    float wk = 0.6 + length(u_windW) * 0.08;
    vec3 wn = normalize(vec3(cos(p.x * 0.31 + u_time * 1.2) * 0.07 * wk + cos((p.x + p.y) * 0.9 + u_time * 2.1) * 0.03 * wk, 1.0, cos(p.y * 0.23 - u_time * 0.9) * 0.07 * wk + sin((p.x - p.y) * 1.3 - u_time * 1.7) * 0.03 * wk));
    if (u_rain.x > 0.01) { vec2 rp = ripples(mod(p, 512.0) * 0.7, u_rain.w) * u_rain.x * 0.35; wn = normalize(wn + vec3(rp.x, 0.0, rp.y)); }
    float frw = 0.12 + 0.88 * pow(1.0 - max(dot(wn, V), 0.0), 4.0);
    vec3 refl = skyRefl(reflect(-V, wn));
    c = mix(base * (lit * 0.8 + 0.1), refl, frw * 0.75);
    vec3 r = reflect(-u_sun, wn);
    c += u_sunCol * pow(max(dot(r, V), 0.0), 90.0) * 1.6;
    c += pl * 0.5;
    for (int i = 0; i < 16; i++) {
      if (i >= u_npl) break;
      vec3 d = u_pl[i].xyz - v_w;
      float dist = length(d) + 0.001;
      vec3 Hw = normalize(d / dist + V);
      float hn = max(dot(Hw, wn), 0.05);
      float ht = dot(Hw, Tv), hb = dot(Hw, Bv);
      c += u_plc[i] * coneK(i, d / dist) * exp(-((ht * ht) / 0.0016 + (hb * hb) / 0.06) / (hn * hn)) * 1.4 / (1.0 + dist * dist * 0.0015);
    }
    env = frw * 0.75;
    pud = 1.0;
  }
  float ga = u_alpha;
  if (k == 7) {
    float nv = dot(n, V);
    float fv = 1.0 - abs(nv);
    float f2 = fv * fv;
    vec3 nn = nv < 0.0 ? -n : n;
    vec3 r = reflect(-V, nn);
    float tint = v_mat.x;
    c = base * lit * (0.5 - 0.3 * tint) + carEnv(r, 0.02) * (0.16 + 0.55 * f2) + pl * 0.2 * (1.0 - tint);
    c += u_sunCol * pow(max(dot(r, u_sun), 0.0), 500.0) * 2.5 * step(0.0, dot(nn, u_sun));
    ga = clamp(u_alpha * (0.6 + 0.75 * f2) + tint * 0.42, 0.0, 0.97);
  }
  float d = length(v_w - u_cam);
  float farK = (k == 10 || k == 15) ? 2.6 : 1.0;
  float f = fogAmt(v_w, u_cam, d, farK);
  if (k == 10 || k == 15) f *= 0.85;
  if (k == 3 || k == 14 || (k == 5 && u_night > 0.5)) f *= 0.55;
  c = mix(c, fogColor(v_w, u_cam, d, u_sun), f);
  env *= 1.0 - f;
  float mask = (env < 0.004 || up < 0.5 || leaf) ? 0.0 : (pud > 0.5 ? 0.5 + env * 0.5 : env * 0.5);
  o = vec4(c, k == 7 ? ga : mask);
}`;

  const FULL_VS = `#version 300 es
out vec2 v_p;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
  v_p = p;
  gl_Position = vec4(p, 1.0, 1.0);
}`;

  const SKY_FS = `#version 300 es
precision highp float;
uniform mat4 u_ivp;
uniform vec3 u_top, u_hor, u_fog, u_sun, u_sunCol, u_cam, u_moon, u_glow;
uniform vec4 u_cloud;
uniform vec2 u_drift;
uniform float u_stars, u_time, u_night, u_el, u_rainbow;
uniform vec4 u_flash;
uniform vec4 u_bolt;
in vec2 v_p;
out vec4 o;
${HASH}
vec3 hue(float x) { return clamp(vec3(abs(x * 6.0 - 3.0) - 1.0, 2.0 - abs(x * 6.0 - 2.0), 2.0 - abs(x * 6.0 - 4.0)), 0.0, 1.0); }
float jag(float x, float seed) {
  float i = floor(x);
  return mix(hi2(ivec2(int(i), int(seed * 97.0))), hi2(ivec2(int(i) + 1, int(seed * 97.0))), x - i) - 0.5;
}
float bolt(vec3 d) {
  float az = atan(d.x, -d.z);
  float el = asin(clamp(d.y, -1.0, 1.0));
  float top = u_bolt.w;
  if (el < -0.02 || el > top) return 0.0;
  float s = clamp(el / top, 0.0, 1.0);
  float sd = u_bolt.y;
  float off = (jag(s * 5.0, sd) * 0.06 + jag(s * 14.0, sd + 1.3) * 0.024 + jag(s * 41.0, sd + 2.7) * 0.008) * (0.4 + top * 3.0);
  float w = 0.0007 + 0.0028 * top;
  float da = abs(mod(az - u_bolt.x - off + 3.14159265, 6.2831853) - 3.14159265);
  float core = exp(-(da / w) * (da / w));
  float glow = exp(-da / (w * 5.0)) * 0.22;
  float bo = off + (1.0 - s) * (jag(3.5, sd + 5.0) * 0.4) + jag(s * 23.0, sd + 9.0) * 0.012;
  float db = abs(mod(az - u_bolt.x - bo + 3.14159265, 6.2831853) - 3.14159265);
  float br = exp(-(db / (w * 0.55)) * (db / (w * 0.55))) * smoothstep(0.4, 0.62, s);
  return (core + glow + br * 0.65) * smoothstep(-0.02, 0.01, el);
}
void main() {
  vec4 a = u_ivp * vec4(v_p, 1.0, 1.0);
  vec3 d = normalize(a.xyz / a.w - u_cam);
  float h = d.y;
  float hp = max(h, 0.0);
  float day = 1.0 - u_night;
  float sunUp = smoothstep(-0.12, 0.04, u_el);
  vec3 c = mix(u_hor, u_top, pow(clamp(h, 0.0, 1.0), 0.5));
  float sd = dot(d, u_sun);
  c += u_sunCol * 0.14 * exp(-hp * 8.0) * (0.35 + 0.65 * (0.5 + 0.5 * sd)) * sunUp;
  float g = 0.76;
  float mie = (1.0 - g * g) / pow(max(1.0 + g * g - 2.0 * g * sd, 0.0001), 1.5) * 0.0796;
  c += u_sunCol * mie * (0.05 + 0.4 * u_cloud.z) * sunUp;
  c += u_glow * exp(-hp * 6.0) * 0.9;
  if (h < 0.0) c = mix(u_hor + u_glow * 0.5, u_fog, clamp(-h * 6.0, 0.0, 1.0));
  vec3 lights = vec3(0.0);
  if (u_stars > 0.01 && h > 0.0) {
    vec3 sp = d * 150.0;
    ivec3 ci = ivec3(floor(sp));
    vec3 cf = fract(sp) - 0.5;
    float hs = hi3(ci);
    if (hs > 0.976) {
      vec3 off = (vec3(hi3(ci + ivec3(1, 0, 0)), hi3(ci + ivec3(0, 1, 0)), hi3(ci + ivec3(0, 0, 1))) - 0.5) * 0.5;
      float r = length(cf - off);
      float mag = (hs - 0.976) / 0.024;
      float tw = 0.65 + 0.35 * sin(u_time * (1.5 + hs * 40.0) + hs * 500.0);
      vec3 tint = mix(vec3(0.75, 0.82, 1.0), vec3(1.0, 0.9, 0.75), hi3(ci + ivec3(3, 5, 7)));
      lights += tint * smoothstep(0.2 + mag * 0.08, 0.0, r) * (0.45 + mag * mag * 2.2) * tw * u_stars * smoothstep(0.02, 0.3, h);
    }
  }
  if (u_night > 0.05) {
    float md = dot(d, u_moon);
    float ma = acos(clamp(md, -1.0, 1.0));
    float R = 0.016;
    if (ma < R * 1.2) {
      vec3 rt = normalize(cross(u_moon, vec3(0.0, 1.0, 0.0)));
      vec3 uv = cross(rt, u_moon);
      vec3 dd = d - u_moon * md;
      vec2 q = vec2(dot(dd, rt), dot(dd, uv)) / R;
      float rq = length(q);
      vec3 nm = vec3(q, sqrt(max(0.0, 1.0 - rq * rq)));
      float ph = clamp(dot(nm, normalize(vec3(0.8, 0.25, 0.55))) * 1.4 + 0.08, 0.0, 1.0);
      float maria = 0.72 + 0.28 * vn(q * 2.6 + 11.0) - 0.12 * smoothstep(0.55, 0.75, vn(q * 5.0 + 3.0));
      lights += vec3(1.0, 0.97, 0.9) * ph * maria * 2.4 * smoothstep(1.0, 0.94, rq) * u_night;
    }
    lights += vec3(0.5, 0.56, 0.72) * exp(-ma * 16.0) * (0.12 + 0.3 * u_cloud.z) * u_night;
  }
  float sa = acos(clamp(sd, -1.0, 1.0));
  float disc = smoothstep(0.0095, 0.0075, sa);
  float limb = sqrt(max(0.0, 1.0 - (sa / 0.0095) * (sa / 0.0095)));
  lights += u_sunCol * (disc * (0.55 + 0.45 * limb) * 18.0 + pow(max(sd, 0.0), 1200.0) * 3.0) * smoothstep(-0.05, 0.0, u_el);
  float dens = 0.0;
  vec3 cc = vec3(0.0);
  if (h > 0.0) {
    float tt = 1.0 / (h + 0.045);
    vec2 cp = d.xz * tt * 1.15 + u_drift;
    vec2 wq = vec2(fbm3(cp * 0.7 + 3.1), fbm3(cp * 0.7 + 7.7)) - 0.5;
    float n = fbm(cp + wq * 0.9);
    float cov = u_cloud.x;
    float lo = mix(0.74, 0.16, cov);
    float hi = lo + mix(0.12, 0.48, cov);
    dens = smoothstep(lo, hi, n);
    vec2 ts = normalize(u_sun.xz + vec2(0.0001)) * 0.09;
    float n2 = fbm(cp + ts + wq * 0.9);
    float lightK = clamp((n - n2) * 3.5 + 0.55, 0.0, 1.0);
    vec3 shadowC = mix(u_hor, u_top, 0.45) * 0.72 + u_glow * 0.4;
    vec3 litC = u_sunCol * 1.15 * sunUp + mix(u_hor, u_top, 0.3) * 0.55;
    cc = mix(shadowC, litC, lightK * (1.0 - u_cloud.y * 0.6));
    float lum = dot(cc, vec3(0.3, 0.59, 0.11));
    cc = mix(cc, vec3(lum) * vec3(0.58, 0.6, 0.66), u_cloud.y * (0.45 + 0.4 * dens));
    cc *= 1.0 - u_cloud.y * 0.3 * smoothstep(0.4, 1.0, n);
    cc = mix(cc, vec3(0.045, 0.05, 0.065) + u_glow * (1.1 + 0.6 * dens), u_night * 0.88);
    cc += u_sunCol * pow(max(sd, 0.0), 9.0) * (1.0 - dens) * dens * 2.4 * sunUp * day;
    cc = mix(cc, u_hor, smoothstep(0.3, 0.0, h) * 0.55);
    float ci = fbm3(vec2(cp.x * 0.6 - cp.y * 0.2, cp.y * 2.6) * 1.7 + u_drift * 0.4) * (0.55 + 0.6 * vn(cp * 0.8 + 41.0));
    float cir = smoothstep(0.5, 0.85, ci) * (1.0 - cov) * 0.3 * smoothstep(0.05, 0.4, h);
    c = mix(c, mix(u_hor, vec3(1.0), 0.6) * (day * 0.9 + 0.1) + u_sunCol * 0.2, cir);
    dens *= smoothstep(0.0, 0.1, h);
  }
  c += lights * (1.0 - dens * 0.96);
  c = mix(c, cc, dens);
  if (u_flash.w > 0.0) {
    float fd = max(dot(d, u_flash.xyz), 0.0);
    c += vec3(0.7, 0.76, 1.0) * u_flash.w * (0.15 + 1.4 * pow(fd, 5.0)) * (0.35 + dens);
  }
  if (u_bolt.z > 0.0) c += vec3(0.82, 0.86, 1.0) * bolt(d) * u_bolt.z * 6.0;
  if (u_rainbow > 0.001 && h > -0.02) {
    float ang = acos(clamp(dot(d, -u_sun), -1.0, 1.0));
    float x = (ang - 0.700) / 0.040;
    float m = smoothstep(-0.25, 0.1, x) * smoothstep(1.25, 0.9, x);
    vec3 rb = hue(clamp((1.0 - x) * 0.78, 0.0, 0.78));
    float x2 = (ang - 0.880) / 0.055;
    float m2 = smoothstep(-0.25, 0.1, x2) * smoothstep(1.25, 0.9, x2);
    vec3 rb2 = hue(clamp(x2 * 0.78, 0.0, 0.78));
    float inside = smoothstep(0.71, 0.5, ang) * 0.06;
    c += (rb * m * 0.26 + rb2 * m2 * 0.06 + vec3(inside)) * u_rainbow * (1.0 - dens * 0.8) * smoothstep(-0.02, 0.06, h);
  }
  c = mix(c, u_fog, clamp(u_cloud.z * (1.0 - smoothstep(0.0, 0.25 + 0.55 * (1.0 - u_cloud.z), hp)), 0.0, 1.0) * 0.92);
  o = vec4(c, 0.0);
}`;

  const SOFT = `
uniform highp sampler2D u_depth;
uniform vec2 u_res;
uniform vec4 u_soft;
float linZ(float d) { float z = d * 2.0 - 1.0; return 2.0 * u_soft.y * u_soft.z / (u_soft.z + u_soft.y - z * (u_soft.z - u_soft.y)); }
float softK(float scale) {
  if (u_soft.x < 0.5 || scale <= 0.0) return 1.0;
  float sz = linZ(texture(u_depth, gl_FragCoord.xy / u_res).r);
  float mz = linZ(gl_FragCoord.z);
  return clamp((sz - mz) * scale, 0.0, 1.0);
}
`;

  const SPR_VS = `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec4 a_col;
layout(location=3) in float a_soft;
uniform mat4 u_vp;
out vec2 v_uv;
out vec4 v_col;
out vec3 v_w;
out float v_soft;
uniform vec3 u_org;
void main() { v_uv = a_uv; v_col = a_col; v_w = a_pos + u_org; v_soft = a_soft; gl_Position = u_vp * vec4(a_pos, 1.0); }`;

  const SPR_FS = `#version 300 es
precision highp float;
uniform sampler2D u_tex;
uniform vec3 u_cam, u_sun;
uniform float u_add;
in vec2 v_uv;
in vec4 v_col;
in vec3 v_w;
in float v_soft;
out vec4 o;
${FOG}
${SOFT}
void main() {
  vec4 t = texture(u_tex, v_uv) * v_col;
  if (u_add < 0.5) t.a *= softK(v_soft);
  float d = length(v_w - u_cam);
  float f = fogAmt(v_w, u_cam, d, 1.0);
  if (u_add > 0.5) o = vec4(t.rgb * t.a * (1.0 - f * 0.8) * 1.25, 0.0);
  else o = vec4(mix(t.rgb, fogColor(v_w, u_cam, d, u_sun), f * 0.9), t.a);
}`;

  const FX_VS = `#version 300 es
layout(location=0) in vec3 a_pos;
layout(location=1) in vec2 a_uv;
layout(location=2) in vec4 a_fx;
layout(location=3) in vec4 a_col;
uniform mat4 u_vp;
out vec2 v_uv;
flat out vec4 v_fx;
out vec4 v_col;
out vec3 v_w;
uniform vec3 u_org;
void main() { v_uv = a_uv; v_fx = a_fx; v_col = a_col; v_w = a_pos + u_org; gl_Position = u_vp * vec4(a_pos, 1.0); }`;

  const FX_FS = `#version 300 es
precision highp float;
uniform vec3 u_cam, u_sun, u_amb;
uniform float u_time;
in vec2 v_uv;
flat in vec4 v_fx;
in vec4 v_col;
in vec3 v_w;
out vec4 o;
${HASH}
${FOG}
${SOFT}
vec3 fireRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 a = mix(vec3(0.0), vec3(0.55, 0.06, 0.01), smoothstep(0.0, 0.25, t));
  a = mix(a, vec3(1.0, 0.35, 0.05), smoothstep(0.2, 0.5, t));
  a = mix(a, vec3(1.0, 0.75, 0.25), smoothstep(0.45, 0.75, t));
  return mix(a, vec3(1.0, 0.97, 0.88), smoothstep(0.75, 1.0, t));
}
void main() {
  int type = int(v_fx.x + 0.5);
  float age = clamp(v_fx.y, 0.0, 1.0);
  float seed = v_fx.z;
  vec2 p = v_uv;
  vec3 rgb = vec3(0.0);
  float alpha = 0.0;
  float softScale = 2.0;
  if (type == 1) {
    float r = length(p);
    float an = atan(p.y, p.x);
    float np = 5.0 + floor(seed * 3.0);
    float petals = pow(abs(cos(an * np * 0.5 + seed * 6.2831)), 5.0);
    float jag = vn(vec2(an * 2.5 + seed * 40.0, r * 3.0 - age * 6.0));
    float reach = 0.3 + 0.7 * petals * (0.65 + 0.55 * jag);
    float flame = smoothstep(reach, reach * 0.25, r);
    float core = exp(-r * r * 20.0);
    float life = pow(1.0 - age, 0.6);
    rgb = (fireRamp(0.55 + flame * 0.5) * flame * 3.2 + vec3(1.0, 0.97, 0.9) * core * 7.0) * life * v_col.a;
    softScale = 6.0;
  } else if (type == 2) {
    float x = clamp(p.x, 0.0, 1.0), y = abs(p.y);
    float nz = vn(vec2(x * 7.0 + seed * 30.0, seed * 9.0 + age * 3.0));
    float w = mix(0.95, 0.12, x) * (0.75 + 0.5 * nz);
    float shape = smoothstep(w, w * 0.2, y) * smoothstep(1.0, 0.55 + 0.2 * nz, x) * smoothstep(0.0, 0.06, x);
    float life = pow(1.0 - age, 0.7);
    rgb = fireRamp(0.45 + shape * 0.6 - x * 0.2) * shape * 4.0 * life * v_col.a;
    softScale = 6.0;
  } else if (type == 3) {
    float x = clamp(p.x, 0.0, 1.0), y = p.y;
    float core = exp(-y * y * 26.0);
    float glow = exp(-y * y * 2.5) * 0.3;
    float along = pow(x, 1.7) * smoothstep(1.0, 0.92, x);
    rgb = (vec3(1.0, 0.88, 0.62) * core * 4.0 + vec3(1.0, 0.5, 0.18) * glow) * along * v_col.a;
    softScale = 0.0;
  } else if (type == 4) {
    float r = length(p);
    float an = atan(p.y, p.x);
    float spikes = pow(abs(cos(an * 2.0 + seed * 6.28)), 18.0);
    float s = exp(-r * r * 12.0) + spikes * exp(-r * 4.0) * 0.6;
    rgb = vec3(1.0, 0.85, 0.55) * s * 3.5 * (1.0 - age) * v_col.a;
    softScale = 8.0;
  } else if (type == 5) {
    float r = length(p);
    if (r > 1.0) discard;
    vec3 sp = vec3(p, sqrt(max(0.0, 1.0 - r * r)));
    vec2 q = p * 2.2 + vec2(seed * 13.0, seed * 7.0) + vec2(0.0, -age * 1.5);
    float n = fbm(q + sp.xy * 0.8);
    float n2 = fbm(q * 1.9 + 4.0);
    float edge = r + (n - 0.5) * 0.55;
    float dens = smoothstep(1.0, 0.55, edge);
    float heat = (1.1 - age * 1.25) * (1.15 - r * 0.9) + (n2 - 0.5) * 0.8 - age * 0.2;
    float hot = smoothstep(0.85, 0.3, age);
    vec3 fire = fireRamp(heat) * dens * hot * 3.6 * (0.6 + 0.4 * sp.z);
    float smoke = dens * smoothstep(0.15, 0.6, age) * smoothstep(1.0, 0.75, age) * 0.9;
    vec3 smokeC = (u_amb * 0.55 + vec3(0.04)) * (0.6 + 0.5 * sp.z) * (0.75 + 0.5 * n);
    rgb = fire * (1.0 - smoke * 0.7) + smokeC * smoke;
    alpha = smoke;
    softScale = 0.6;
  } else if (type == 6) {
    float y = p.y;
    float n = fbm(vec2(p.x * 1.4 + seed * 9.0, y * 1.8 - u_time * 2.4 + seed * 5.0));
    float n2 = vn(vec2(p.x * 3.0 + seed * 3.0, y * 4.0 - u_time * 5.0));
    float width = mix(0.95, 0.1, y);
    float body = smoothstep(width, width * 0.25, abs(p.x + (n - 0.5) * 0.5 * y)) * smoothstep(1.0, 0.3, y + (n2 - 0.5) * 0.35) * smoothstep(0.0, 0.08, y);
    float heat = body * (1.05 - y * 0.6) + (n - 0.5) * 0.3;
    rgb = fireRamp(heat) * body * 3.0 * v_col.a;
    softScale = 1.0;
  } else if (type == 7) {
    float r = length(p);
    float rr = 0.15 + age * 0.85;
    float rq = (r - rr) / (0.06 + 0.1 * age);
    float ring = exp(-rq * rq) * (1.0 - age) * (1.0 - age);
    float dust = smoothstep(rr, 0.0, r) * (1.0 - age) * 0.25;
    rgb = vec3(1.0, 0.7, 0.4) * ring * 1.5 * v_col.a;
    alpha = dust;
    rgb += u_amb * 0.4 * dust;
    softScale = 0.0;
  } else if (type == 8) {
    float x = clamp(p.x, 0.0, 1.0), y = p.y;
    float across = exp(-y * y * 2.2);
    float along = pow(1.0 - x, 1.3) * smoothstep(0.0, 0.1, x);
    float grain = 0.85 + 0.15 * vn(v_w.xz * 0.8 + v_w.y * 0.5 + u_time * 0.3);
    rgb = v_col.rgb * across * along * grain * v_col.a;
    softScale = 0.8;
  } else if (type == 9) {
    float r = length(p);
    float s = exp(-r * r * 5.0);
    rgb = v_col.rgb * s * v_col.a * 1.5;
    softScale = 1.5;
  }
  float k = softK(softScale);
  float d = length(v_w - u_cam);
  float f = fogAmt(v_w, u_cam, d, 1.0);
  rgb *= k * (1.0 - f * 0.75);
  alpha *= k * (1.0 - f * 0.5);
  if (any(isnan(rgb)) || any(isinf(rgb))) rgb = vec3(0.0);
  o = vec4(rgb, clamp(alpha, 0.0, 1.0));
}`;

  const RAIN_VS = `#version 300 es
layout(location=0) in vec2 a_q;
layout(location=1) in vec4 a_seed;
uniform mat4 u_vp;
uniform vec3 u_cam, u_box, u_vel, u_camVel, u_amb;
uniform float u_time, u_len, u_pix, u_mode, u_ground;
uniform vec4 u_flash;
uniform vec4 u_pl[12];
uniform vec3 u_plc[12];
uniform int u_npl;
out vec2 v_q;
out float v_a;
out vec3 v_light;
out float v_ph;
${HASH}
void main() {
  vec3 pos;
  float a;
  if (u_mode < 0.5) {
    vec3 vel = u_vel * (0.85 + 0.3 * a_seed.w);
    vec3 pw = a_seed.xyz * u_box + vel * u_time;
    vec3 rel = mod(pw - u_cam + u_box * 0.5, u_box) - u_box * 0.5;
    vec3 head = u_cam + rel;
    vec3 sv = vel - u_camVel * 0.7;
    vec3 dir = normalize(sv);
    float len = u_len * clamp(length(sv) / 9.0, 0.6, 2.2);
    pos = mix(head - dir * len, head, a_q.x);
    vec3 toCam = u_cam - pos;
    float dist = length(toCam);
    vec3 side = normalize(cross(dir, toCam / max(dist, 0.001)));
    float w = max(0.005, dist * u_pix * 0.7);
    pos += side * a_q.y * w;
    a = 0.005 / w * smoothstep(0.6, 2.0, dist) * (1.0 - smoothstep(u_box.x * 0.35, u_box.x * 0.5, length(rel.xz)));
    v_ph = 0.0;
  } else {
    float cyc = u_time * 1.6 + a_seed.w * 7.0;
    float ph = fract(cyc);
    float id = floor(cyc);
    vec2 off = vec2(hi2(ivec2(int(a_seed.x * 65535.0), int(id))), hi2(ivec2(int(a_seed.y * 65535.0), int(id) + 77))) - 0.5;
    vec3 ctr = vec3(u_cam.x + off.x * 30.0, u_ground + 0.02, u_cam.z + off.y * 30.0);
    vec3 toCam = normalize(vec3(u_cam.x - ctr.x, 0.0, u_cam.z - ctr.z) + vec3(0.0001));
    vec3 side = vec3(-toCam.z, 0.0, toCam.x);
    float s = 0.22;
    pos = ctr + side * a_q.y * s + vec3(0.0, a_q.x * s * 0.8, 0.0);
    a = smoothstep(17.0, 6.0, length(off * 30.0));
    v_ph = ph;
  }
  vec3 l = u_amb + u_flash.w * vec3(0.7, 0.75, 0.9);
  for (int i = 0; i < 12; i++) {
    if (i >= u_npl) break;
    vec3 d = u_pl[i].xyz - pos;
    float att = max(0.0, 1.0 - length(d) / (u_pl[i].w * 1.3));
    l += u_plc[i] * att * att * 1.6;
  }
  v_light = l;
  v_q = a_q;
  v_a = a;
  gl_Position = u_vp * vec4(pos, 1.0);
}`;

  const RAIN_FS = `#version 300 es
precision highp float;
uniform float u_mode, u_alpha;
in vec2 v_q;
in float v_a;
in vec3 v_light;
in float v_ph;
out vec4 o;
void main() {
  float a;
  if (u_mode < 0.5) {
    a = exp(-v_q.y * v_q.y * 2.5) * smoothstep(0.0, 0.3, v_q.x) * smoothstep(1.0, 0.85, v_q.x) * v_a * u_alpha;
  } else {
    vec2 q = vec2(v_q.y, v_q.x);
    float ph = v_ph;
    float ring = 0.0;
    for (int i = 0; i < 3; i++) {
      float s = float(i) - 1.0;
      vec2 c = vec2(s * 0.55 * ph, 0.12 + (1.4 * ph - 1.6 * ph * ph) * (1.0 - abs(s) * 0.35));
      ring += smoothstep(0.1, 0.0, length(q - c));
    }
    ring += smoothstep(0.12, 0.0, abs(q.y - 0.02)) * smoothstep(0.2 + ph * 0.8, 0.0, abs(q.x)) * 0.5;
    a = ring * (1.0 - ph) * v_a * u_alpha * 0.45;
  }
  o = vec4(v_light * a, a * 0.6);
}`;

  const BRIGHT_FS = `#version 300 es
precision highp float;
uniform sampler2D u_src;
uniform vec2 u_texel;
uniform vec2 u_thr;
in vec2 v_p;
out vec4 o;
void main() {
  vec2 uv = v_p * 0.5 + 0.5;
  vec3 c = texture(u_src, uv + vec2(-1.0, -1.0) * u_texel).rgb + texture(u_src, uv + vec2(1.0, -1.0) * u_texel).rgb + texture(u_src, uv + vec2(-1.0, 1.0) * u_texel).rgb + texture(u_src, uv + vec2(1.0, 1.0) * u_texel).rgb;
  c = min(c * 0.25, vec3(24.0));
  if (any(isnan(c))) c = vec3(0.0);
  float br = max(c.r, max(c.g, c.b));
  float kn = u_thr.y;
  float s = clamp(br - u_thr.x + kn, 0.0, 2.0 * kn);
  s = s * s / (4.0 * kn + 0.0001);
  o = vec4(c * max(s, br - u_thr.x) / max(br, 0.0001), 1.0);
}`;

  const DOWN_FS = `#version 300 es
precision highp float;
uniform sampler2D u_src;
uniform vec2 u_texel;
in vec2 v_p;
out vec4 o;
void main() {
  vec2 uv = v_p * 0.5 + 0.5;
  vec2 h = u_texel * 0.5;
  vec4 s = texture(u_src, uv) * 4.0;
  s += texture(u_src, uv - h) + texture(u_src, uv + h) + texture(u_src, uv + vec2(h.x, -h.y)) + texture(u_src, uv - vec2(h.x, -h.y));
  o = s / 8.0;
}`;

  const UP_FS = `#version 300 es
precision highp float;
uniform sampler2D u_src;
uniform vec2 u_texel;
uniform float u_k;
in vec2 v_p;
out vec4 o;
void main() {
  vec2 uv = v_p * 0.5 + 0.5;
  vec2 h = u_texel * 0.5;
  vec4 s = texture(u_src, uv + vec2(-h.x * 2.0, 0.0));
  s += texture(u_src, uv + vec2(-h.x, h.y)) * 2.0;
  s += texture(u_src, uv + vec2(0.0, h.y * 2.0));
  s += texture(u_src, uv + vec2(h.x, h.y)) * 2.0;
  s += texture(u_src, uv + vec2(h.x * 2.0, 0.0));
  s += texture(u_src, uv + vec2(h.x, -h.y)) * 2.0;
  s += texture(u_src, uv + vec2(0.0, -h.y * 2.0));
  s += texture(u_src, uv + vec2(-h.x, -h.y)) * 2.0;
  o = s / 12.0 * u_k;
}`;

  const RAYS_FS = `#version 300 es
precision highp float;
uniform sampler2D u_src;
uniform highp sampler2D u_depth;
uniform vec2 u_sunUV;
uniform float u_k;
in vec2 v_p;
out vec4 o;
void main() {
  vec2 uv = v_p * 0.5 + 0.5;
  vec2 delta = (u_sunUV - uv) / 32.0 * 0.9;
  vec2 p = uv;
  float illum = 1.0;
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 32; i++) {
    p += delta;
    if (p.x < 0.0 || p.y < 0.0 || p.x > 1.0 || p.y > 1.0) break;
    float sky = step(0.99999, texture(u_depth, p).r);
    vec3 s = texture(u_src, p).rgb;
    acc += max(s - 0.45, 0.0) * sky * illum;
    illum *= 0.955;
  }
  o = vec4(acc / 32.0 * u_k, 1.0);
}`;

  const DOF_FS = `#version 300 es
precision highp float;
uniform sampler2D u_src;
uniform highp sampler2D u_depth;
uniform vec2 u_res, u_nf;
uniform vec4 u_dof;
in vec2 v_p;
out vec4 o;
float depthAt(vec2 uv) {
  float d = texture(u_depth, uv).r;
  if (d > 0.99999) return u_nf.y;
  float z = d * 2.0 - 1.0;
  return 2.0 * u_nf.x * u_nf.y / (u_nf.y + u_nf.x - z * (u_nf.y - u_nf.x));
}
float coc(float z) { return min(u_dof.z, u_dof.x * abs(z - u_dof.y) / max(z, 0.01)); }
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 px = 1.0 / u_res;
  vec4 c0 = texture(u_src, uv);
  float z0 = depthAt(uv);
  float s0 = coc(z0);
  vec3 acc = min(c0.rgb, vec3(32.0));
  float tot = 1.0;
  float r = u_dof.w;
  float a = 0.0;
  for (int i = 0; i < 480; i++) {
    if (r >= u_dof.z) break;
    vec2 tc = uv + vec2(cos(a), sin(a)) * px * r;
    float z = depthAt(tc);
    float s = coc(z);
    if (z > z0) s = min(s, s0 * 2.0);
    vec3 c = min(texture(u_src, tc).rgb, vec3(32.0));
    float m = smoothstep(r - u_dof.w * 0.5, r + u_dof.w * 0.5, s);
    acc += mix(acc / tot, c, m);
    tot += 1.0;
    a += 2.39996323;
    r += u_dof.w / r;
  }
  vec3 col = acc / tot;
  if (any(isnan(col)) || any(isinf(col))) col = c0.rgb;
  o = vec4(col, c0.a * (1.0 - smoothstep(1.5, 5.0, s0)));
}`;

  const COMP_FS = `#version 300 es
precision highp float;
uniform sampler2D u_scene;
uniform highp sampler2D u_depth;
uniform sampler2D u_bloom;
uniform sampler2D u_rays;
uniform vec2 u_res;
uniform float u_time;
uniform mat4 u_proj, u_iproj, u_view;
uniform vec3 u_skyHor, u_skyTop, u_rainCol, u_sunCol;
uniform vec2 u_rainDir;
uniform vec2 u_nf;
uniform vec4 u_feat;
uniform vec4 u_grade;
uniform vec3 u_lift, u_gain;
uniform vec4 u_fx;
uniform vec4 u_waves[4];
uniform vec4 u_death;
uniform vec4 u_pf, u_pg;
uniform vec3 u_pts, u_pth;
uniform float u_pvig;
in vec2 v_p;
out vec4 o;
${HASH}
float linZ(float d) { float z = d * 2.0 - 1.0; return 2.0 * u_nf.x * u_nf.y / (u_nf.y + u_nf.x - z * (u_nf.y - u_nf.x)); }
vec3 viewPos(vec2 uv, float d) { vec4 p = u_iproj * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return p.xyz / p.w; }
vec2 toUV(vec3 v) { vec4 c = u_proj * vec4(v, 1.0); return c.xy / c.w * 0.5 + 0.5; }
vec3 ssr(vec2 uv, float a) {
  bool mirror = a > 0.5;
  float k = mirror ? (a - 0.5) * 2.0 : a * 2.0;
  float d = texture(u_depth, uv).r;
  if (d > 0.99999) return vec3(0.0);
  vec3 P = viewPos(uv, d);
  vec3 V = normalize(P);
  vec3 Nu = normalize((u_view * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  vec3 R = reflect(V, Nu);
  if (R.z > -0.01) return vec3(0.0);
  float t = 0.35 + 0.02 * length(P);
  float prevT = 0.0;
  bool hit = false;
  vec2 quv = uv;
  for (int i = 0; i < 26; i++) {
    vec3 Q = P + R * t;
    quv = toUV(Q);
    if (quv.x < 0.0 || quv.x > 1.0 || quv.y < 0.0 || quv.y > 1.0) break;
    float sz = viewPos(quv, texture(u_depth, quv).r).z;
    float diff = sz - Q.z;
    if (diff > 0.0 && diff < t * 0.3 + 0.35) { hit = true; break; }
    prevT = t;
    t *= 1.27;
  }
  if (!hit) return vec3(0.0);
  float lo = prevT, hi = t;
  for (int j = 0; j < 5; j++) {
    float m = (lo + hi) * 0.5;
    vec3 M = P + R * m;
    vec2 mu = toUV(M);
    float sz = viewPos(mu, texture(u_depth, mu).r).z;
    if (sz - M.z > 0.0) hi = m; else lo = m;
  }
  quv = toUV(P + R * hi);
  vec3 refl = texture(u_scene, quv).rgb;
  if (!mirror) {
    float st = clamp(hi * 0.0009, 0.0015, 0.012);
    refl = refl * 0.3 + (texture(u_scene, quv + vec2(0.0, st)).rgb + texture(u_scene, quv - vec2(0.0, st)).rgb) * 0.22 + (texture(u_scene, quv + vec2(0.0, st * 2.2)).rgb + texture(u_scene, quv - vec2(0.0, st * 2.2)).rgb) * 0.13;
  }
  float edge = smoothstep(0.0, 0.07, quv.x) * smoothstep(1.0, 0.93, quv.x) * smoothstep(0.0, 0.07, quv.y) * smoothstep(1.0, 0.9, quv.y);
  float fade = edge * clamp(-R.z * 3.0, 0.0, 1.0) * (1.0 - smoothstep(70.0, 140.0, hi));
  float ry = dot(R, Nu);
  vec3 skyA = mix(u_skyHor, u_skyTop, sqrt(clamp(ry, 0.0, 1.0)));
  return (min(refl, vec3(16.0)) - skyA) * k * fade;
}
vec2 lens(vec2 uv) {
  vec2 acc = vec2(0.0);
  vec2 asp = vec2(u_res.x / u_res.y, 1.0);
  for (int l = 0; l < 2; l++) {
    float sc = l == 0 ? 7.0 : 12.0;
    vec2 p = uv * asp * sc;
    p.y += u_time * (l == 0 ? 0.035 : 0.06);
    vec2 cid = floor(p);
    ivec2 id = ivec2(cid) + ivec2(l * 131, 0);
    vec2 f = p - cid - 0.5;
    float h = hi2(id);
    if (h > 0.42) continue;
    vec2 ctr = (vec2(hi2(id + ivec2(3, 1)), hi2(id + ivec2(7, 2))) - 0.5) * 0.5;
    float life = fract(u_time * 0.07 + h * 9.0);
    float r = 0.1 + 0.14 * hi2(id + ivec2(1, 9));
    vec2 dd = f - ctr;
    dd.y *= 1.0 + 0.4 * smoothstep(0.0, 0.5, dd.y);
    float m = smoothstep(r, r * 0.55, length(dd)) * smoothstep(1.0, 0.75, life) * smoothstep(0.0, 0.08, life);
    acc += dd / r * m * 0.09 / sc;
  }
  return acc;
}
vec3 rainLayers(vec2 uv) {
  float z = linZ(texture(u_depth, uv).r);
  vec3 acc = vec3(0.0);
  vec2 asp = vec2(u_res.x / u_res.y, 1.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float lz = 5.0 + fi * 10.0 + fi * fi * 9.0;
    if (z < lz) continue;
    float sc = 1.0 / (1.0 + fi * 0.8);
    vec2 p = uv * asp;
    p.x += (p.y - 0.5) * u_rainDir.x * 0.25;
    p *= vec2(120.0, 5.0) / sc;
    p.y += u_time * (11.0 / sc * 0.5 + 3.0) + fi * 3.7;
    vec2 cid = floor(p);
    float h = hi2(ivec2(int(cid.x), i * 911));
    float y = fract(p.y + h * 13.7);
    float on = step(0.55, hi2(ivec2(int(cid.x), int(cid.y) + i * 37)));
    float streak = smoothstep(0.0, 0.06, y) * smoothstep(0.32, 0.05, y) * on;
    float xs = fract(p.x) - 0.5;
    streak *= smoothstep(0.2, 0.0, abs(xs));
    acc += u_rainCol * streak * (0.55 - fi * 0.13);
  }
  return acc;
}
vec3 tonemap(vec3 x) {
  float m = max(x.r, max(x.g, x.b));
  if (m <= 0.78) return x;
  float t = 0.78 + 0.22 * (1.0 - exp(-(m - 0.78) / 0.22));
  vec3 c = x * (t / m);
  return mix(c, vec3(t), smoothstep(1.6, 9.0, m) * 0.55);
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 duv = vec2(0.0);
  vec2 asp = vec2(u_res.x / u_res.y, 1.0);
  for (int i = 0; i < 4; i++) {
    vec4 w = u_waves[i];
    if (w.w <= 0.0) continue;
    vec2 dv = (uv - w.xy) * asp;
    float dist = length(dv);
    float rq = (dist - w.z) / (0.02 + w.z * 0.25);
    float ring = exp(-rq * rq);
    duv += dv / max(dist, 0.001) * ring * w.w * 0.03 / asp;
  }
  if (u_fx.y > 0.001) {
    float z = linZ(texture(u_depth, uv).r);
    float hk = u_fx.y * smoothstep(45.0, 180.0, z) * (1.0 - step(0.99999, texture(u_depth, uv).r) * 0.6);
    duv += (vec2(vn(uv * vec2(70.0, 140.0) + vec2(0.0, -u_time * 2.5)), vn(uv * vec2(60.0, 120.0) + vec2(5.0, -u_time * 2.1))) - 0.5) * 0.0028 * hk;
  }
  if (u_fx.x > 0.001) duv += lens(uv) * u_fx.x;
  if (u_pf.z > 0.5) duv.x += (hf2(vec2(floor(uv.y * 240.0), 7.0)) - 0.5) * 0.0011;
  vec2 suv = clamp(uv + duv, vec2(0.0005), vec2(0.9995));
  vec4 sc = texture(u_scene, suv);
  if (u_pf.z > 0.5) {
    float tp = u_res.y / 480.0 / u_res.x;
    sc.rgb = (texture(u_scene, suv - vec2(tp * 1.5, 0.0)).rgb + sc.rgb * 2.0 + texture(u_scene, suv + vec2(tp * 1.5, 0.0)).rgb) * 0.25;
    sc.r = mix(sc.r, texture(u_scene, suv + vec2(tp * 3.0, 0.0)).r, 0.6);
    sc.b = mix(sc.b, texture(u_scene, suv - vec2(tp * 3.0, 0.0)).b, 0.6);
  }
  vec3 col = sc.rgb;
  if (u_feat.x > 0.5 && sc.a > 0.004) col += ssr(suv, sc.a);
  if (u_feat.w > 0.001) col += rainLayers(suv) * u_feat.w;
  col += texture(u_bloom, suv).rgb * u_feat.y;
  col += texture(u_rays, suv).rgb * u_sunCol * u_feat.z;
  col *= u_grade.x * (1.0 + u_fx.z);
  if (any(isnan(col)) || any(isinf(col))) col = sc.rgb;
  col = max(col, vec3(0.0));
  col = tonemap(col);
  col = col * u_gain + u_lift * (1.0 - col);
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(l), col, u_grade.y * (1.0 - u_death.x));
  col = mix(col, l * vec3(u_death.y, u_death.z, u_death.w) * 1.15, u_death.x * 0.35);
  col = (col - 0.5) * u_grade.z + 0.5;
  vec2 q = uv - 0.5;
  col *= 1.0 - u_grade.w * dot(q * asp, q * asp) * 1.25;
  if (u_pf.x > 0.5) {
    float pl = dot(col, vec3(0.299, 0.587, 0.114));
    col = mix(vec3(pl), col, u_pg.x * (1.0 - u_pf.y));
    col = clamp((col - 0.5) * u_pg.y + 0.5, 0.0, 1.0);
    float pl2 = dot(col, vec3(0.299, 0.587, 0.114));
    col *= mix(u_pts, u_pth, smoothstep(0.08, 0.85, pl2));
    col = u_pg.z + col * (1.0 - u_pg.z);
    col *= 1.0 - u_pvig * dot(q * asp, q * asp) * 1.6;
    vec2 gc = floor(gl_FragCoord.xy / max(1.0, u_res.y / 720.0));
    col += (hi2(ivec2(gc) + ivec2(173, 911)) - 0.5) * u_pg.w * (0.5 + 2.0 * pl2 * (1.0 - pl2));
    if (u_pf.z > 0.5) col *= 1.0 - 0.16 * step(0.5, fract(gl_FragCoord.y / max(2.0, u_res.y / 240.0)));
  }
  float gr = hf2(gl_FragCoord.xy + fract(u_time * 7.3) * vec2(911.0, 577.0)) - 0.5;
  col += gr * u_fx.w + (hf2(gl_FragCoord.xy * 1.37 + 3.0) - 0.5) / 255.0;
  o = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

  N.GLSL = {
    world: [WORLD_VS, WORLD_FS],
    sky: [FULL_VS, SKY_FS],
    sprite: [SPR_VS, SPR_FS],
    fx: [FX_VS, FX_FS],
    rain: [RAIN_VS, RAIN_FS],
    bright: [FULL_VS, BRIGHT_FS],
    down: [FULL_VS, DOWN_FS],
    up: [FULL_VS, UP_FS],
    rays: [FULL_VS, RAYS_FS],
    dof: [FULL_VS, DOF_FS],
    comp: [FULL_VS, COMP_FS]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = N;
})(globalThis.GtaNN = globalThis.GtaNN || {});
