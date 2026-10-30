(function (B) {
  'use strict';
  const GLSL_HEAD = `#version 300 es
  precision highp float;
  precision highp int;
  precision highp sampler2D;
  `;

  const COMMON = `
  uniform vec3 uCamPos;
  uniform float uTime;
  uniform vec3 uSunDir, uSunCol, uZenith, uSkyMid, uHorizon, uHaze, uAmbSky, uAmbGround, uCloudLit, uCloudShade;
  uniform float uExposure;
  uniform vec2 uWind;
  uniform sampler2D uNoise;
  uniform sampler2D uCloudShadow;
  uniform vec4 uCloudShadowMap;

  vec3 skyColor(vec3 rd) {
    float y = clamp(rd.y, 0.0, 1.0);
    vec3 col = mix(uHorizon, uSkyMid, smoothstep(0.0, 0.2, y));
    col = mix(col, uZenith, smoothstep(0.08, 0.7, y));
    col = mix(col, uHaze, smoothstep(0.02, -0.12, rd.y));
    float sd = max(dot(rd, uSunDir), 0.0);
    col += uSunCol * (0.03 * pow(sd, 5.0) + 0.08 * pow(sd, 40.0));
    return col;
  }
  vec3 fogColor(vec3 rd) {
    float sd = max(dot(rd, uSunDir), 0.0);
    return uHaze + uSunCol * 0.07 * pow(sd, 7.0);
  }
  vec3 applyFog(vec3 col, vec3 wp) {
    vec3 d = wp - uCamPos;
    float dist = length(d);
    vec3 rd = d / max(dist, 1e-3);
    const float a = 0.00012, b = 0.0021;
    float k = rd.y * b;
    float tt = abs(k) < 1e-5 ? dist : (1.0 - exp(-dist * k)) / k;
    float fog = 1.0 - exp(-a * exp(-uCamPos.y * b) * tt);
    fog = max(fog, smoothstep(6500.0, 12500.0, dist));
    return mix(col, fogColor(rd), fog);
  }
  vec4 toScreen(vec3 c, float alpha) {
    c = 1.0 - exp(-c * uExposure);
    float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = max(mix(vec3(l), c, 1.15), 0.0);
    return vec4(pow(c, vec3(1.0 / 2.2)), alpha);
  }
  float cloudShadow(vec3 wp) {
    vec2 p = wp.xz + uSunDir.xz / max(uSunDir.y, 0.12) * (uCloudShadowMap.w - wp.y);
    vec2 uv = (p - uCloudShadowMap.xy) / (2.0 * uCloudShadowMap.z) + 0.5;
    return 1.0 - 0.45 * texture(uCloudShadow, uv).r;
  }
  vec3 grassAlbedo(vec2 xz, float h) {
    float big = texture(uNoise, xz * 0.00042).b;
    float mid = texture(uNoise, xz * 0.0029 + 0.37).b;
    float fine = texture(uNoise, xz * 0.027 + 0.71).g;
    float gust = texture(uNoise, xz * 0.011 - uWind * uTime * 0.045).r;
    vec3 lush = vec3(0.065, 0.28, 0.03);
    vec3 dry = vec3(0.24, 0.4, 0.05);
    vec3 deep = vec3(0.03, 0.14, 0.02);
    vec3 c = mix(lush, dry, clamp(smoothstep(0.38, 0.78, big) * 0.7 + smoothstep(50.0, 120.0, h) * 0.3, 0.0, 1.0));
    c = mix(c, deep, smoothstep(0.52, 0.8, mid) * 0.5);
    return c * (0.86 + 0.28 * fine) * (0.93 + 0.14 * gust);
  }
  `;

  const SH = {};

  SH.skyVS = `
  out vec2 vUV;
  void main() {
    vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
    vUV = p;
    gl_Position = vec4(p, 1.0, 1.0);
  }`;
  SH.skyFS = `
  uniform vec3 uCamF, uCamR, uCamU;
  uniform vec2 uTan;
  in vec2 vUV;
  out vec4 o;
  void main() {
    vec3 rd = normalize(uCamF + vUV.x * uTan.x * uCamR + vUV.y * uTan.y * uCamU);
    vec3 col = skyColor(rd);
    if (rd.y > 0.0) {
      vec2 p = rd.xz / (rd.y + 0.1) * 0.2;
      vec2 q = vec2(p.x * 0.5 + p.y * 0.32, p.y * 1.7 - p.x * 0.3) + vec2(uTime * 0.0012, 0.0);
      float n = texture(uNoise, q * 0.45).b * 0.62 + texture(uNoise, q * 1.6 + 0.3).b * 0.38;
      float c = smoothstep(0.6, 0.84, n) * smoothstep(0.0, 0.22, rd.y);
      float sd = max(dot(rd, uSunDir), 0.0);
      col = mix(col, uCloudLit * 0.85 + uSunCol * 0.1 * pow(sd, 5.0), c * 0.42);
    }
    float sd = dot(rd, uSunDir);
    col += uSunCol * 7.0 * smoothstep(0.99955, 0.99988, sd);
    o = toScreen(col, 1.0);
  }`;

  SH.terrainVS = `
  layout(location = 0) in vec3 aPos;
  layout(location = 1) in vec3 aNor;
  uniform mat4 uViewProj;
  out vec3 vPos;
  out vec3 vNor;
  void main() {
    vPos = aPos;
    vNor = aNor;
    gl_Position = uViewProj * vec4(aPos, 1.0);
  }`;

  const VINE_GROUND = `
  uniform vec4 uVine;
  uniform vec4 uVineAxes;
  uniform sampler2D uGround;
  uniform float uGroundHalf;
  uniform float uGolden;
  vec2 vineLocal(vec2 xz) {
    vec2 r = xz - uVine.xy;
    return vec2(dot(r, uVineAxes.xy), dot(r, uVineAxes.zw));
  }
  float vineMask(vec2 vl, float soft) {
    return (1.0 - smoothstep(uVine.z - soft, uVine.z + soft, abs(vl.x))) *
           (1.0 - smoothstep(uVine.w - soft, uVine.w + soft, abs(vl.y)));
  }
  vec4 groundMap(vec2 xz) { return texture(uGround, xz / (2.0 * uGroundHalf) + 0.5); }
  `;

  SH.terrainFS = VINE_GROUND + `
  in vec3 vPos;
  in vec3 vNor;
  out vec4 o;
  void main() {
    vec3 n = normalize(vNor);
    vec2 gn = vec2(texture(uNoise, vPos.xz * 0.045).r, texture(uNoise, vPos.xz * 0.045 + 0.5).r) - 0.5;
    n = normalize(n + vec3(gn.x, 0.0, gn.y) * 0.22);
    vec3 alb = grassAlbedo(vPos.xz, vPos.y);

    vec2 vl = vineLocal(vPos.xz);
    float vm = vineMask(vl, 8.0);
    if (vm > 0.0) {
      float f = vl.y / 3.0;
      float row = abs(fract(f) - 0.5) * 2.0;
      float fw = fwidth(f);
      float leaves = smoothstep(0.62 - fw * 2.0, 0.62 + fw * 2.0, row);
      leaves = mix(leaves, 0.62, smoothstep(0.15, 0.5, fw));
      vec3 vcol = mix(vec3(0.24, 0.17, 0.1), vec3(0.07, 0.2, 0.035), leaves);
      alb = mix(alb, vcol, vm);
    }
    vec4 gm = groundMap(vPos.xz);
    alb = mix(alb, vec3(0.34, 0.28, 0.2), gm.g * 0.92);
    float slope = 1.0 - n.y;
    alb = mix(alb, vec3(0.2, 0.2, 0.18), smoothstep(0.3, 0.55, slope) * smoothstep(120.0, 280.0, vPos.y));

    float sh = cloudShadow(vPos) * mix(gm.r, gm.b, uGolden);
    float ndl = max(dot(n, uSunDir) * 0.82 + 0.18, 0.0);
    vec3 amb = mix(uAmbGround, uAmbSky, n.y * 0.5 + 0.5);
    vec3 col = alb * (uSunCol * ndl * sh + amb);
    o = toScreen(applyFog(col, vPos), 1.0);
  }`;

  SH.grassVS = VINE_GROUND + `
  layout(location = 0) in vec2 aTile;
  uniform mat4 uViewProj;
  uniform sampler2D uHeight;
  uniform float uHmHalf, uHmStep;
  uniform float uTile, uWidthMul, uFadeNear, uFadeFar, uCamAGL;
  out vec3 vPos;
  out vec3 vAlb;
  out vec3 vNor;
  out float vT;
  out float vSh;

  uint hash(uint x) { x ^= x >> 16; x *= 0x7feb352du; x ^= x >> 15; x *= 0x846ca68bu; x ^= x >> 16; return x; }
  float rnd(inout uint s) { s = hash(s); return float(s) * (1.0 / 4294967295.0); }

  float terrainH(vec2 xz) {
    vec2 f = (xz + uHmHalf) / uHmStep;
    ivec2 i = ivec2(floor(f));
    vec2 t = f - vec2(i);
    float h00 = texelFetch(uHeight, i, 0).r;
    float h10 = texelFetch(uHeight, i + ivec2(1, 0), 0).r;
    float h01 = texelFetch(uHeight, i + ivec2(0, 1), 0).r;
    float h11 = texelFetch(uHeight, i + ivec2(1, 1), 0).r;
    return t.x > t.y ? h00 + (h10 - h00) * t.x + (h11 - h10) * t.y
                     : h00 + (h11 - h01) * t.x + (h01 - h00) * t.y;
  }

  void main() {
    int blade = gl_VertexID / 7;
    int k = gl_VertexID - blade * 7;
    ivec2 tid = ivec2(floor(aTile / uTile + 0.5));
    uint s = hash(uint(tid.x) * 73856093u ^ uint(tid.y) * 19349663u ^ uint(blade) * 83492791u);
    vec2 root = aTile + vec2(rnd(s), rnd(s)) * uTile;
    float hR = rnd(s), ang = rnd(s) * 6.2831853, bendR = rnd(s), colR = rnd(s), rowR = rnd(s);

    vec2 vl = vineLocal(root);
    bool vine = abs(vl.x) < uVine.z && abs(vl.y) < uVine.w;
    float hgt = mix(0.22, 0.56, hR * hR);
    float width = 0.05 * uWidthMul;
    if (vine) {
      vl.y = floor(vl.y / 3.0 + 0.5) * 3.0 + (rowR - 0.5) * 0.9;
      root = uVine.xy + uVineAxes.xy * vl.x + uVineAxes.zw * vl.y;
      hgt = 1.05 + 0.5 * hR;
      width = 0.2 * uWidthMul;
    }
    vec4 gm = groundMap(root);
    hgt *= 1.0 - gm.g;
    float baseY = terrainH(root);
    float dist = length(vec3(root.x, baseY, root.y) - uCamPos);
    float fade = 1.0 - smoothstep(uFadeNear, uFadeFar, dist);
    hgt *= fade;
    width *= fade;

    float gust = textureLod(uNoise, root * 0.011 - uWind * uTime * 0.045, 0.0).r;
    float flutter = sin(uTime * 3.1 + root.x * 0.9 + root.y * 0.7 + ang);
    vec2 disp = uWind * (0.12 + gust * 0.6) + vec2(-uWind.y, uWind.x) * flutter * 0.07;
    vec2 away = root - uCamPos.xz;
    float dd = length(away);
    float push = smoothstep(8.0, 0.5, dd) * smoothstep(9.0, 1.8, uCamAGL);
    disp += away / max(dd, 0.1) * push * 1.6;
    vec2 sideDir = vec2(cos(ang), sin(ang));
    disp += vec2(-sideDir.y, sideDir.x) * (bendR - 0.5) * 0.7;
    if (vine) disp *= 0.15;

    float t = float(k / 2) / 3.0;
    float side = k == 6 ? 0.0 : float(k & 1) * 2.0 - 1.0;
    vec2 off = disp * t * t * hgt;
    float y = hgt * t * (1.0 - 0.28 * min(dot(disp, disp), 1.5) * t);
    float w = width * (vine ? 1.0 - t * 0.3 : 1.0 - t * 0.85);
    vec3 p = vec3(root.x + sideDir.x * side * w * 0.5 + off.x, baseY + y, root.y + sideDir.y * side * w * 0.5 + off.y);

    vec3 faceN = vec3(-sideDir.y, 0.0, sideDir.x);
    vNor = normalize(vec3(0.0, 1.0, 0.0) + faceN * 0.35 + vec3(disp.x, 0.0, disp.y) * 0.25);
    vec3 alb = grassAlbedo(root, baseY) * (0.5 + 0.8 * t) * (0.82 + 0.36 * colR);
    alb = mix(alb, alb * vec3(1.25, 1.12, 0.55), t * 0.3);
    if (vine) alb = mix(vec3(0.03, 0.09, 0.02), vec3(0.08, 0.2, 0.04), t) * (0.8 + 0.4 * colR);
    vAlb = alb;
    vT = t;
    vSh = cloudShadow(vec3(root.x, baseY, root.y)) * mix(gm.r, gm.b, uGolden);
    vPos = p;
    gl_Position = uViewProj * vec4(p, 1.0);
  }`;

  SH.grassFS = `
  in vec3 vPos;
  in vec3 vAlb;
  in vec3 vNor;
  in float vT;
  in float vSh;
  out vec4 o;
  void main() {
    vec3 n = normalize(vNor);
    vec3 vd = normalize(vPos - uCamPos);
    float ndl = max(dot(n, uSunDir) * 0.8 + 0.2, 0.0);
    float trans = pow(max(dot(vd, uSunDir), 0.0), 4.0) * vT * 0.5;
    vec3 amb = mix(uAmbGround, uAmbSky, n.y * 0.5 + 0.5);
    vec3 col = vAlb * (uSunCol * (ndl + trans) * vSh + amb);
    o = toScreen(applyFog(col, vPos), 1.0);
  }`;

  SH.treeVS = `
  layout(location = 0) in vec3 aPos;
  layout(location = 1) in vec4 aBlob;
  layout(location = 2) in vec4 aTree;
  uniform mat4 uViewProj;
  out vec3 vPos;
  out vec3 vN;
  out vec3 vTreeN;
  out float vH;
  void main() {
    vec3 n = aPos;
    float lump = textureLod(uNoise, aBlob.xz * 0.013 + n.xz * 0.21 + n.y * 0.13, 0.0).r;
    vec3 p = aBlob.xyz + n * aBlob.w * (0.82 + 0.36 * lump);
    vPos = p;
    vN = n;
    vTreeN = normalize(p - (aTree.xyz - vec3(0.0, aTree.w * 0.35, 0.0)));
    vH = (p.y - (aTree.y - aTree.w * 0.55)) / (aTree.w * 1.3);
    gl_Position = uViewProj * vec4(p, 1.0);
  }`;
  SH.treeFS = `
  in vec3 vPos;
  in vec3 vN;
  in vec3 vTreeN;
  in float vH;
  out vec4 o;
  void main() {
    vec3 n = normalize(mix(normalize(vN), normalize(vTreeN), 0.6));
    float leaf = texture(uNoise, vPos.xz * 0.31 + vPos.y * 0.23).g;
    vec3 alb = mix(vec3(0.03, 0.08, 0.018), vec3(0.085, 0.18, 0.035), leaf);
    float ndl = max(dot(n, uSunDir) * 0.7 + 0.3, 0.0);
    float ao = mix(0.4, 1.0, clamp(vH, 0.0, 1.0));
    vec3 col = alb * (uSunCol * ndl * cloudShadow(vPos) + mix(uAmbGround, uAmbSky, n.y * 0.5 + 0.5)) * ao;
    o = toScreen(applyFog(col, vPos), 1.0);
  }`;

  SH.trunkVS = `
  layout(location = 0) in vec3 aPos;
  layout(location = 1) in vec4 aTrunk;
  uniform mat4 uViewProj;
  out vec3 vPos;
  out vec3 vN;
  void main() {
    float r = 0.22 + aTrunk.w * 0.07;
    vec3 p = aTrunk.xyz + vec3(aPos.x * r * (1.0 - aPos.y * 0.35), aPos.y * aTrunk.w * 1.25 - 0.4, aPos.z * r * (1.0 - aPos.y * 0.35));
    vPos = p;
    vN = normalize(vec3(aPos.x, 0.0, aPos.z));
    gl_Position = uViewProj * vec4(p, 1.0);
  }`;
  SH.trunkFS = `
  in vec3 vPos;
  in vec3 vN;
  out vec4 o;
  void main() {
    float ndl = max(dot(vN, uSunDir) * 0.6 + 0.4, 0.0);
    vec3 col = vec3(0.07, 0.055, 0.04) * (uSunCol * ndl * 0.6 + uAmbSky * 0.6);
    o = toScreen(applyFog(col, vPos), 1.0);
  }`;

  SH.cloudVS = `
  layout(location = 0) in vec2 aCorner;
  layout(location = 1) in vec4 aPuff;
  layout(location = 2) in vec2 aInfo;
  uniform mat4 uViewProj;
  uniform vec3 uCamR, uCamU;
  out vec2 vUV;
  out vec3 vCenter;
  out float vShade;
  out float vAlpha;
  out float vR;
  void main() {
    vUV = aCorner * 1.2;
    vCenter = aPuff.xyz;
    vShade = aInfo.x;
    vAlpha = aInfo.y;
    vR = aPuff.w;
    vec3 p = aPuff.xyz + (uCamR * aCorner.x + uCamU * aCorner.y) * aPuff.w * 1.2;
    gl_Position = uViewProj * vec4(p, 1.0);
  }`;
  SH.cloudFS = `
  uniform vec3 uCamR, uCamU;
  in vec2 vUV;
  in vec3 vCenter;
  in float vShade;
  in float vAlpha;
  in float vR;
  out vec4 o;
  void main() {
    float d2 = dot(vUV, vUV);
    if (d2 > 1.44) discard;
    float d = sqrt(d2);
    float seed = fract(vCenter.x * 0.0137 + vCenter.z * 0.0071);
    float en = texture(uNoise, vUV * 0.32 + seed).b;
    float a = smoothstep(1.05, 0.45, d + (en - 0.5) * 0.55);
    vec3 toCam = normalize(uCamPos - vCenter);
    vec3 n = normalize(uCamR * vUV.x + uCamU * vUV.y + toCam * sqrt(max(1.0 - min(d2, 1.0), 0.0)));
    float lit = (dot(n, uSunDir) * 0.5 + 0.5) * mix(0.5, 1.0, vShade);
    vec3 col = mix(uCloudShade, uCloudLit, smoothstep(0.1, 0.95, lit));
    float back = pow(max(dot(-toCam, uSunDir), 0.0), 5.0);
    col += uSunCol * 0.22 * back * smoothstep(0.35, 1.0, d);
    float dc = length(vCenter - uCamPos);
    a *= smoothstep(vR * 0.3, vR * 1.3, dc) * vAlpha;
    vec4 c = toScreen(applyFog(col, vCenter), 1.0);
    o = vec4(c.rgb * a, a);
  }`;

  SH.shadowVS = `
  layout(location = 0) in vec2 aCorner;
  layout(location = 1) in vec4 aPuff;
  layout(location = 2) in vec2 aInfo;
  uniform vec4 uMap;
  out vec2 vUV;
  out float vA;
  void main() {
    vUV = aCorner;
    vA = aInfo.y;
    vec2 p = aPuff.xz + aCorner * aPuff.w * 0.95;
    gl_Position = vec4((p - uMap.xy) / uMap.z, 0.0, 1.0);
  }`;
  SH.shadowFS = `
  in vec2 vUV;
  in float vA;
  out vec4 o;
  void main() { o = vec4(smoothstep(1.0, 0.15, length(vUV)) * 0.42 * vA); }`;

  SH.birdVS = `
  layout(location = 0) in vec4 aPos;
  layout(location = 1) in vec4 aI0;
  layout(location = 2) in vec4 aI1;
  uniform mat4 uViewProj;
  out vec3 vPos;
  void main() {
    vec3 p = aPos.xyz;
    float flap = sin(aI1.y) * aI1.w;
    p.y += abs(p.x) * flap * aPos.w;
    p *= aI1.z;
    float cb = cos(aI1.x), sb = sin(aI1.x);
    p = vec3(p.x * cb - p.y * sb, p.x * sb + p.y * cb, p.z);
    float cy = cos(aI0.w), sy = sin(aI0.w);
    p = vec3(p.x * cy + p.z * sy, p.y, -p.x * sy + p.z * cy);
    p += aI0.xyz;
    vPos = p;
    gl_Position = uViewProj * vec4(p, 1.0);
  }`;
  SH.birdFS = `
  in vec3 vPos;
  out vec4 o;
  void main() {
    vec3 col = vec3(0.035, 0.03, 0.028) * (uAmbSky + uSunCol * 0.15);
    o = toScreen(applyFog(col, vPos), 1.0);
  }`;

  SH.frameVS = `
  layout(location = 0) in vec2 aCorner;
  layout(location = 1) in vec2 aArm;
  layout(location = 2) in vec2 aThick;
  uniform mat4 uViewProj;
  uniform vec3 uC, uR, uU;
  uniform vec2 uSize;
  out vec2 vLocal;
  void main() {
    float dist = length(uC - uCamPos);
    float th = 0.32 * max(1.0, dist / 110.0);
    vec2 l = aCorner * uSize * 0.5 + aArm * uSize.x * 0.5 + aThick * th;
    vLocal = l / (uSize * 0.5);
    vec3 p = uC + uR * l.x + uU * l.y;
    gl_Position = uViewProj * vec4(p, 1.0);
  }`;
  SH.frameFS = `
  uniform float uAlpha;
  uniform float uFill;
  in vec2 vLocal;
  out vec4 o;
  void main() {
    vec3 gold = vec3(1.0, 0.86, 0.52);
    float edge = max(abs(vLocal.x), abs(vLocal.y));
    float a = uFill > 0.5 ? 0.06 * smoothstep(0.6, 1.0, edge) + 0.015 : 0.95;
    a *= uAlpha;
    o = vec4(gold * a, a);
  }`;

  SH.glowVS = `
  layout(location = 0) in vec2 aCorner;
  uniform mat4 uViewProj;
  uniform vec3 uC, uCamR, uCamU;
  uniform float uScale;
  out vec2 vUV;
  void main() {
    vUV = aCorner;
    vec3 p = uC + (uCamR * aCorner.x + uCamU * aCorner.y) * uScale;
    gl_Position = uViewProj * vec4(p, 1.0);
  }`;
  SH.glowFS = `
  uniform float uAlpha;
  in vec2 vUV;
  out vec4 o;
  void main() {
    float d = length(vUV);
    float a = (exp(-d * d * 9.0) * 0.6 + exp(-d * 3.5) * 0.18) * uAlpha;
    o = vec4(vec3(1.0, 0.85, 0.55) * a, a);
  }`;

  SH.moteVS = `
  layout(location = 0) in vec4 aSeed;
  uniform mat4 uViewProj;
  uniform float uMode;
  uniform vec4 uThermal;
  uniform float uPx;
  out float vA;
  void main() {
    vec3 p;
    if (uMode < 0.5) {
      vec3 box = vec3(70.0);
      vec3 base = aSeed.xyz * box + vec3(uWind.x, 0.15, uWind.y) * uTime * 1.6
                + vec3(sin(uTime * 0.7 + aSeed.w * 30.0), cos(uTime * 0.5 + aSeed.x * 20.0), 0.0) * 0.8;
      p = uCamPos + mod(base - uCamPos, box) - box * 0.5;
    } else {
      float a = aSeed.x * 6.2831 + uTime * (0.12 + aSeed.w * 0.1);
      float r = sqrt(aSeed.y) * 60.0;
      float h = uThermal.w - uThermal.z;
      p = vec3(uThermal.x + cos(a) * r, uThermal.z + mod(aSeed.z * h + uTime * 4.0, h), uThermal.y + sin(a) * r);
    }
    float d = length(p - uCamPos);
    bool amb = uMode < 0.5;
    float size = (amb ? 0.06 + aSeed.w * 0.06 : 0.4 + aSeed.w * 0.3) * uPx / max(d, 0.1);
    gl_PointSize = clamp(size, 1.2, 7.0);
    vA = amb ? smoothstep(1.0, 4.0, d) * (1.0 - smoothstep(14.0, 32.0, d)) * 0.45
             : (1.0 - smoothstep(400.0, 1800.0, d)) * 0.8 * smoothstep(1.0, 6.0, d);
    vA *= amb ? min(size / 1.2, 1.0) : max(min(size / 1.2, 1.0), 0.4);
    gl_Position = uViewProj * vec4(p, 1.0);
  }`;
  SH.moteFS = `
  in float vA;
  out vec4 o;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float a = exp(-dot(c, c) * 2.5) * vA;
    vec3 col = vec3(1.0, 0.96, 0.85) * (0.6 + 0.4 * uSunCol.r / 3.0);
    o = vec4(col * a, a);
  }`;

  Object.assign(B, { GLSL_HEAD, COMMON, SH });
})(globalThis.Bliss = globalThis.Bliss || {});
